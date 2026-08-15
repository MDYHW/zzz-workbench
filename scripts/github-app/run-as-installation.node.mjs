import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { generateKeyPairSync } from 'node:crypto';
import {
  APP_ID,
  INSTALLATION_ID,
  REPOSITORY,
  EVIDENCE_MARKER,
  LauncherError,
  assertPullRequestTarget,
  buildChildCommand,
  buildGhEnvironment,
  createAppJwt,
  isExpectedRemote,
  mintInstallationToken,
  parseCliOperation,
  parseCliOperationFromFiles,
  runAsInstallation,
  spawnCommand,
  validateInstallationToken,
  validateOperation,
  verifyTrustedRecoveryCheckout,
} from './run-as-installation.mjs';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

function ok(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function appFetch(token = 'token-value') {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith('/app')) return ok({ id: APP_ID, owner: { login: 'Min-DongYoung' } });
    if (url.endsWith(`/app/installations/${INSTALLATION_ID}`)) return ok({
      id: INSTALLATION_ID, app_id: APP_ID, account: { login: 'Min-DongYoung' }, repository_selection: 'selected',
      permissions: { contents: 'write', pull_requests: 'write', metadata: 'read' },
    });
    if (url.endsWith('/access_tokens')) return ok({ token, permissions: { contents: 'write', pull_requests: 'write', metadata: 'read' } }, 201);
    if (url.includes('/installation/repositories')) return ok({ total_count: 1, repositories: [{ full_name: REPOSITORY, private: true }] });
    if (url.endsWith('/installation/token')) return ok({}, 204);
    throw new Error('unexpected request');
  };
  return { calls, fetchImpl };
}

function runtimeOptions(overrides = {}) {
  const { fetchImpl } = appFetch();
  return {
    environment: {
      ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH: '/secure/app.pem',
      ZZZ_WORKBENCH_GIT_EXECUTABLE: '/tools/git',
      ZZZ_WORKBENCH_GH_EXECUTABLE: '/tools/gh',
    },
    fetchImpl,
    readFile: async () => PEM,
    makeTempDirectory: async () => '/tmp/gh-config',
    removeDirectory: async () => {},
    currentStatePreflight: async () => true,
    trustedSourceProof: async () => ({ headSha: 'b'.repeat(40) }),
    operationCheckoutProof: async ({ operation }) => ({
      branch: operation.branch ?? operation.head ?? 'codex/launcher-test', headSha: 'a'.repeat(40), config: '',
    }),
    now: 1_700_000_000_000,
    ...overrides,
  };
}

test('creates a signed GitHub App JWT without exposing the private key', () => {
  const jwt = createAppJwt(PEM, 1_700_000_000_000);
  assert.match(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.ok(!jwt.includes('PRIVATE KEY'));
});

test('accepts only fixed operation schemas and rejects force, protected, and arbitrary commands', () => {
  assert.deepEqual(validateOperation({ kind: 'git-push', branch: 'codex/recovery-policy' }), { kind: 'git-push', branch: 'codex/recovery-policy' });
  assert.deepEqual(buildChildCommand({ kind: 'git-push', branch: 'codex/recovery-policy' }), ['push', `https://github.com/${REPOSITORY}.git`, 'HEAD:refs/heads/codex/recovery-policy']);
  for (const operation of [
    { kind: 'git-push', branch: 'recovery' },
    { kind: 'git-push', branch: 'codex/force', force: true },
    { kind: 'gh-api', args: ['api', '/repos/other'] },
    { kind: 'pr-merge', number: '1', headSha: 'A'.repeat(40) },
  ]) {
    assert.throws(() => validateOperation(operation), LauncherError);
  }
  assert.throws(() => parseCliOperation(['git-push', 'codex/ok', '--force']), LauncherError);
  assert.throws(() => validateOperation({ kind: 'pr-comment', number: '1', body: 'unused' }), LauncherError);
});

test('body-file transport preserves multiline payloads without widening the command schema', async () => {
  const operation = await parseCliOperationFromFiles(
    ['pr-edit', '42', 'Title', '--body-file', '/secure/body.md'],
    async () => 'line one\nline two',
  );
  assert.equal(operation.body, 'line one\nline two');
  await assert.rejects(() => parseCliOperationFromFiles(
    ['pr-edit', '42', 'Title', '--body-file', 'relative.md'], async () => 'body',
  ), /absolute/);
});

test('rejects broader installation permissions and foreign remotes or pull requests', () => {
  assert.throws(() => validateInstallationToken({ token: 't', permissions: { contents: 'write', pull_requests: 'write', actions: 'write' } }), LauncherError);
  assert.equal(isExpectedRemote('https://github.com/Min-DongYoung/zzz-workbench.git'), true);
  assert.equal(isExpectedRemote('https://github.com/other/repository.git'), false);
  assert.throws(() => assertPullRequestTarget({ baseRefName: 'main', headRefName: 'codex/a' }), LauncherError);
  assert.throws(() => assertPullRequestTarget({ baseRefName: 'recovery', headRefName: 'feature/a' }), LauncherError);
});

test('trusted launcher source requires clean recovery at local origin and preserves distinct git/gh PATH entries', async () => {
  const runChild = async (_executable, args) => {
    if (args.join(' ') === 'remote get-url origin' || args.join(' ') === 'remote get-url --push origin') return { stdout: `https://github.com/${REPOSITORY}.git\n` };
    if (args.join(' ') === 'rev-parse --abbrev-ref HEAD') return { stdout: 'recovery\n' };
    if (args.join(' ') === 'rev-parse HEAD' || args.join(' ') === 'rev-parse refs/remotes/origin/recovery') return { stdout: `${'b'.repeat(40)}\n` };
    if (args[0] === 'status' || args[0] === 'config') return { stdout: '' };
    throw new Error('unexpected command');
  };
  assert.equal((await verifyTrustedRecoveryCheckout({ runChild, gitExecutable: '/tools/git', sourceRoot: '/trusted' })).headSha, 'b'.repeat(40));
  const environment = buildGhEnvironment('token', '/gh/gh', '/tmp/config', '/git/git');
  assert.ok(environment.PATH.includes('/gh'));
  assert.ok(environment.PATH.includes('/git'));
});

test('runs an allowlisted git push with the token only in the child environment and always revokes it', async () => {
  const { calls, fetchImpl } = appFetch('never-in-arguments');
  const childCalls = [];
  const runChild = async (executable, args, options) => {
    childCalls.push({ executable, args, options });
    return { stdout: '' };
  };
  await runAsInstallation({ kind: 'git-push', branch: 'codex/launcher-test' }, runtimeOptions({ fetchImpl, runChild }));
  assert.deepEqual(childCalls[0].args, ['push', `https://github.com/${REPOSITORY}.git`, 'HEAD:refs/heads/codex/launcher-test']);
  const encodedCredential = childCalls[0].options.env.GIT_CONFIG_VALUE_0.replace('AUTHORIZATION: basic ', '');
  assert.ok(Buffer.from(encodedCredential, 'base64').toString().includes('never-in-arguments'));
  assert.ok(!childCalls[0].args.join(' ').includes('never-in-arguments'));
  assert.ok(calls.some(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE'));
});

test('git push exposes an ambiguous result as an idempotent retry with exact branch identity', async () => {
  await assert.rejects(() => runAsInstallation({ kind: 'git-push', branch: 'codex/launcher-test' }, runtimeOptions({
    runChild: async () => { throw new LauncherError('timeout', { code: 'command_timeout', mutationCompleted: null }); },
  })), (error) => error instanceof LauncherError
    && error.code === 'git_push_result_unknown'
    && error.retryable === true
    && error.mutationCompleted === null
    && error.resource?.branch === 'codex/launcher-test'
    && error.resource?.headSha === 'a'.repeat(40));
});

test('checks PR target and exact head before immediate squash merge', async () => {
  const childCalls = [];
  let preflightInput;
  const runChild = async (executable, args, options) => {
    childCalls.push({ executable, args, options });
    if (args[0] === 'pr' && args[1] === 'view') {
      return { stdout: JSON.stringify({ number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42', baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40), state: 'OPEN', mergeStateStatus: 'CLEAN' }) };
    }
    return { stdout: '' };
  };
  await runAsInstallation({ kind: 'pr-merge', number: '42', headSha: 'a'.repeat(40) }, runtimeOptions({
    runChild,
    sourceRoot: '/trusted/recovery',
    currentStatePreflight: async (value) => { preflightInput = value; return true; },
  }));
  assert.ok(childCalls.some(({ args }) => JSON.stringify(args) === JSON.stringify(['pr', 'merge', '42', '--repo', REPOSITORY, '--squash', '--match-head-commit', 'a'.repeat(40)])));
  assert.equal(preflightInput.sourceRoot, '/trusted/recovery');
  assert.equal(preflightInput.trustedBaseSha, 'b'.repeat(40));
});

test('blocks immediate merge before key reads, token minting, or child execution when current-state preflight is absent', async () => {
    let readCount = 0;
    let childCount = 0;
    let fetchCount = 0;
    await assert.rejects(
      () => runAsInstallation({ kind: 'pr-merge', number: '42', headSha: 'a'.repeat(40) }, runtimeOptions({
        currentStatePreflight: undefined,
        readFile: async () => { readCount += 1; return PEM; },
        fetchImpl: async () => { fetchCount += 1; return ok({}); },
        runChild: async () => { childCount += 1; return { stdout: '' }; },
      })),
      LauncherError,
    );
    assert.equal(readCount, 0);
    assert.equal(fetchCount, 0);
    assert.equal(childCount, 0);
});

test('revokes the token and never spawns gh when the current GitHub-state preflight is absent or fails', async () => {
  for (const currentStatePreflight of [async () => false, async () => { throw new Error('stale state'); }]) {
    const { calls, fetchImpl } = appFetch();
    let childCount = 0;
    await assert.rejects(
      () => runAsInstallation({ kind: 'pr-merge', number: '42', headSha: 'a'.repeat(40) }, runtimeOptions({
        currentStatePreflight,
        fetchImpl,
        runChild: async () => { childCount += 1; return { stdout: '' }; },
      })),
      LauncherError,
    );
    assert.equal(childCount, 0);
    assert.ok(calls.some(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE'));
  }
});

test('redacts failures and revokes an already minted token', async () => {
  const secret = 'token-that-must-not-leak';
  const { calls, fetchImpl } = appFetch(secret);
  await assert.rejects(
    () => runAsInstallation({ kind: 'git-push', branch: 'codex/launcher-test' }, runtimeOptions({
      fetchImpl,
      runChild: async () => { throw new Error(secret); },
    })),
    (error) => error instanceof LauncherError && !error.message.includes(secret),
  );
  assert.ok(calls.some(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE'));
});

test('evidence upsert creates or replaces the single marker comment and returns its identity', async () => {
  const body = `${EVIDENCE_MARKER}\n\`\`\`json\n${JSON.stringify({ schema: 'zzz-workbench-authority-review/v1', kind: 'authority-review' })}\n\`\`\``;
  for (const existing of [[], [{ id: 77, body: `${EVIDENCE_MARKER}\nold`, user: { login: 'zzz-workbench-agent-mdy[bot]' } }]]) {
    const { fetchImpl: baseFetch } = appFetch();
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
      calls.push({ url, init });
      if (url.endsWith('/pulls/42')) return ok({
        state: 'open',
        base: { ref: 'recovery', repo: { full_name: REPOSITORY } },
        head: { ref: 'codex/launcher-test', repo: { full_name: REPOSITORY } },
      });
      if (url.endsWith('/issues/42/comments?per_page=100&page=1')) return ok(existing);
      if (url.endsWith('/issues/42/comments') && init.method === 'POST') return ok({ id: 88, html_url: 'https://github.com/comment/88' }, 201);
      if (url.endsWith('/issues/comments/77') && init.method === 'PATCH') return ok({ id: 77, html_url: 'https://github.com/comment/77' });
      return baseFetch(url, init);
    };
    const result = await runAsInstallation({ kind: 'evidence-upsert', number: '42', body }, runtimeOptions({ fetchImpl }));
    assert.equal(result.kind, 'evidence-upsert');
    assert.equal(result.commentId, existing.length === 0 ? 88 : 77);
    assert.equal(calls.filter(({ init }) => ['POST', 'PATCH'].includes(init.method)).length, 2);
  }
});

test('evidence upsert rejects a foreign target and reconciles an ambiguous mutation', async () => {
  const body = `${EVIDENCE_MARKER}\n\`\`\`json\n${JSON.stringify({ schema: 'zzz-workbench-authority-review/v1', kind: 'authority-review' })}\n\`\`\``;
  const { fetchImpl: baseFetch } = appFetch();
  let mutations = 0;
  await assert.rejects(
    () => runAsInstallation({ kind: 'evidence-upsert', number: '42', body }, runtimeOptions({
      fetchImpl: async (url, init = {}) => {
        if (url.endsWith('/pulls/42')) return ok({
          state: 'open',
          base: { ref: 'main', repo: { full_name: REPOSITORY } },
          head: { ref: 'codex/launcher-test', repo: { full_name: REPOSITORY } },
        });
        if (url.includes('/issues/') && ['POST', 'PATCH'].includes(init.method)) mutations += 1;
        return baseFetch(url, init);
      },
    })),
    /outside the allowlisted/,
  );
  assert.equal(mutations, 0);

  let listCount = 0;
  const reconciled = await runAsInstallation({ kind: 'evidence-upsert', number: '42', body }, runtimeOptions({
    fetchImpl: async (url, init = {}) => {
      if (url.endsWith('/pulls/42')) return ok({
        state: 'open',
        base: { ref: 'recovery', repo: { full_name: REPOSITORY } },
        head: { ref: 'codex/launcher-test', repo: { full_name: REPOSITORY } },
      });
      if (url.endsWith('/issues/42/comments?per_page=100&page=1')) {
        listCount += 1;
        return ok(listCount === 1 ? [] : [{
          id: 88, body, html_url: 'https://github.com/comment/88',
          user: { login: 'zzz-workbench-agent-mdy[bot]' },
        }]);
      }
      if (url.endsWith('/issues/42/comments') && init.method === 'POST') throw new Error('ambiguous network failure');
      return baseFetch(url, init);
    },
  }));
  assert.equal(reconciled.reconciled, true);
  assert.equal(reconciled.commentId, 88);
});

test('merge reports pending checks and reconciles an ambiguous successful mutation', async () => {
  await assert.rejects(
    () => runAsInstallation({ kind: 'pr-merge', number: '42', headSha: 'a'.repeat(40) }, runtimeOptions({
      runChild: async (_executable, args) => {
        if (args[0] === 'pr' && args[1] === 'view') return { stdout: JSON.stringify({
          number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42',
          baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40),
          state: 'OPEN', isDraft: false, mergeStateStatus: 'BLOCKED',
          statusCheckRollup: [{ status: 'IN_PROGRESS', conclusion: null }],
        }) };
        return { stdout: '' };
      },
    })),
    (error) => error instanceof LauncherError && error.code === 'merge_checks_pending' && error.retryable === true,
  );

  let views = 0;
  const result = await runAsInstallation({ kind: 'pr-merge', number: '42', headSha: 'a'.repeat(40) }, runtimeOptions({
    runChild: async (_executable, args) => {
      if (args[0] === 'pr' && args[1] === 'view') {
        views += 1;
        return { stdout: JSON.stringify({
          number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42',
          baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40),
          state: views === 1 ? 'OPEN' : 'MERGED', isDraft: false, mergeStateStatus: 'CLEAN', statusCheckRollup: [],
        }) };
      }
      if (args[0] === 'pr' && args[1] === 'merge') throw new LauncherError('ambiguous', { mutationCompleted: null });
      return { stdout: '' };
    },
  }));
  assert.equal(result.reconciled, true);
  assert.equal(result.pullRequest.state, 'MERGED');
});

test('PR edit reconciles exact title and body after an ambiguous mutation', async () => {
  let views = 0;
  const result = await runAsInstallation({
    kind: 'pr-edit', number: '42', title: 'Updated title', body: 'Updated body',
  }, runtimeOptions({
    runChild: async (_executable, args) => {
      if (args[0] === 'pr' && args[1] === 'view') {
        views += 1;
        return { stdout: JSON.stringify({
          number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42',
          baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40),
          state: 'OPEN', mergeStateStatus: 'UNKNOWN',
          title: views === 1 ? 'Old title' : 'Updated title',
          body: views === 1 ? 'Old body' : 'Updated body',
        }) };
      }
      if (args[0] === 'pr' && args[1] === 'edit') throw new LauncherError('ambiguous', { mutationCompleted: null });
      return { stdout: '' };
    },
  }));
  assert.equal(result.reconciled, true);
  assert.equal(result.pullRequest.number, 42);
  assert.equal(views, 2);
});

test('PR creation reconciles an exact same-head PR after an ambiguous mutation', async () => {
  let lists = 0;
  const pull = {
    number: 42,
    url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42',
    baseRefName: 'recovery',
    headRefName: 'codex/launcher-test',
    headRefOid: 'a'.repeat(40),
    state: 'OPEN',
    mergeStateStatus: 'UNKNOWN',
    title: 'Title',
    body: 'Body',
  };
  const result = await runAsInstallation({
    kind: 'pr-create', head: 'codex/launcher-test', title: 'Title', body: 'Body',
  }, runtimeOptions({
    runChild: async (_executable, args) => {
      if (args[0] === 'pr' && args[1] === 'list') {
        lists += 1;
        return { stdout: JSON.stringify(lists === 1 ? [] : [pull]) };
      }
      if (args[0] === 'pr' && args[1] === 'create') {
        throw new LauncherError('ambiguous', { mutationCompleted: null });
      }
      return { stdout: '' };
    },
  }));
  assert.equal(result.reconciled, true);
  assert.equal(result.pullRequest.number, 42);
  assert.equal(lists, 2);
});

test('PR creation reports a failed pre-mutation lookup as safely retryable', async () => {
  await assert.rejects(() => runAsInstallation({
    kind: 'pr-create', head: 'codex/launcher-test', title: 'Title', body: 'Body',
  }, runtimeOptions({
    runChild: async (_executable, args) => {
      if (args[0] === 'pr' && args[1] === 'list') {
        throw new LauncherError('timeout', { code: 'command_timeout', mutationCompleted: null });
      }
      return { stdout: '' };
    },
  })), (error) => error instanceof LauncherError
    && error.code === 'pr_create_lookup_unavailable'
    && error.retryable === true
    && error.mutationCompleted === false
    && error.resource?.headSha === 'a'.repeat(40));
});

test('PR creation normalizes a double-failure reconciliation as safely retryable unknown state', async () => {
  let lists = 0;
  await assert.rejects(() => runAsInstallation({
    kind: 'pr-create', head: 'codex/launcher-test', title: 'Title', body: 'Body\r\n',
  }, runtimeOptions({
    runChild: async (_executable, args) => {
      if (args[0] === 'pr' && args[1] === 'list') {
        lists += 1;
        if (lists === 1) return { stdout: '[]' };
        throw new LauncherError('list failed', { code: 'command_failed' });
      }
      if (args[0] === 'pr' && args[1] === 'create') {
        throw new LauncherError('ambiguous', { mutationCompleted: null });
      }
      return { stdout: '' };
    },
  })), (error) => error instanceof LauncherError
    && error.code === 'pr_create_result_unknown'
    && error.retryable === true
    && error.mutationCompleted === null
    && error.resource?.head === 'codex/launcher-test');
  assert.equal(lists, 2);
});

test('post-mint repository validation failure revokes the raw installation token', async () => {
  const { calls, fetchImpl: baseFetch } = appFetch('raw-token');
  const fetchImpl = async (url, init = {}) => {
    if (url.includes('/installation/repositories')) {
      calls.push({ url, init });
      return ok({ total_count: 2, repositories: [] });
    }
    return baseFetch(url, init);
  };
  await assert.rejects(() => mintInstallationToken({ fetchImpl, jwt: createAppJwt(PEM, 1_700_000_000_000) }), LauncherError);
  assert.ok(calls.some(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE'));
});

test('post-mutation local cleanup failure reports completed identity and forbids blind retry', async () => {
  const runChild = async (_executable, args) => {
    if (args[0] === 'pr' && args[1] === 'view') return {
      stdout: JSON.stringify({
        number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42',
        baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40),
        state: 'OPEN', mergeStateStatus: 'CLEAN',
      }),
    };
    return { stdout: '' };
  };
  await assert.rejects(
    () => runAsInstallation({ kind: 'pr-edit', number: '42', title: 'Title', body: 'Body' }, runtimeOptions({
      runChild, removeDirectory: async () => { throw new Error('cleanup'); },
    })),
    (error) => error instanceof LauncherError
      && error.code === 'local_cleanup_failed'
      && error.mutationCompleted === true
      && error.resource?.pullRequest?.number === 42,
  );
});

test('spawnCommand invokes a direct executable with shell disabled', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  const started = [];
  const result = spawnCommand('/tools/git', ['status'], {}, (executable, args, options) => {
    started.push({ executable, args, options });
    queueMicrotask(() => {
      child.stdout.emit('data', Buffer.from('ok'));
      child.emit('close', 0);
    });
    return child;
  });
  assert.deepEqual(await result, { stdout: 'ok' });
  assert.equal(started[0].options.shell, false);
  assert.equal(started[0].options.windowsHide, true);
});
