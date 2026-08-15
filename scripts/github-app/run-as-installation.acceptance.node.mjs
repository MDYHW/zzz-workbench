import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import {
  APP_ID,
  INSTALLATION_ID,
  REPOSITORY,
  LauncherError,
  runAsInstallation,
  validateAppAndInstallation,
  validateTokenRepositories,
} from './run-as-installation.mjs';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function options(overrides = {}) {
  return {
    environment: {
      ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH: '/secure/app.pem',
      ZZZ_WORKBENCH_GIT_EXECUTABLE: '/tools/git',
      ZZZ_WORKBENCH_GH_EXECUTABLE: '/tools/gh',
    },
    readFile: async () => PEM,
    makeTempDirectory: async () => '/tmp/gh-config',
    removeDirectory: async () => {},
    currentStatePreflight: async () => true,
    trustedSourceProof: async () => ({ headSha: 'b'.repeat(40) }),
    operationCheckoutProof: async ({ operation }) => ({
      branch: operation.branch ?? operation.head ?? 'codex/launcher-test', headSha: 'a'.repeat(40), config: '',
    }),
    now: 1_700_000_000_000,
    fetchImpl: async (url) => {
      if (url.endsWith('/app')) return response({ id: APP_ID, owner: { login: 'Min-DongYoung' } });
      if (url.endsWith(`/app/installations/${INSTALLATION_ID}`)) return response({
        id: INSTALLATION_ID, app_id: APP_ID, account: { login: 'Min-DongYoung' }, repository_selection: 'selected',
        permissions: { checks: 'read', contents: 'write', pull_requests: 'write', statuses: 'read', metadata: 'read' },
      });
      if (url.endsWith('/access_tokens')) return response({
        token: 'test-token',
        permissions: { checks: 'read', contents: 'write', pull_requests: 'write', statuses: 'read', metadata: 'read' },
      }, 201);
      if (url.includes('/installation/repositories')) return response({ total_count: 1, repositories: [{ full_name: REPOSITORY, private: true }] });
      if (url.endsWith('/installation/token')) return response({}, 204);
      throw new Error('unexpected request');
    },
    ...overrides,
  };
}

test('accepts only fixed PR mutation commands against the verified recovery PR flow', async () => {
  const cases = [
    [{ kind: 'pr-create', head: 'codex/launcher-test', title: 'Create', body: 'Body' }, ['pr', 'create', '--repo', REPOSITORY, '--head', 'codex/launcher-test', '--base', 'recovery', '--title', 'Create', '--body', 'Body']],
    [{ kind: 'pr-edit', number: '42', title: 'Edit', body: 'Body' }, ['pr', 'edit', '42', '--repo', REPOSITORY, '--base', 'recovery', '--title', 'Edit', '--body', 'Body']],
  ];

  for (const [operation, expectedArgs] of cases) {
    const childCalls = [];
    await runAsInstallation(operation, options({
      runChild: async (executable, args, childOptions) => {
        childCalls.push({ executable, args, childOptions });
        if (args[0] === 'pr' && args[1] === 'list') return { stdout: '[]' };
        if (args[0] === 'pr' && args[1] === 'view') {
          return { stdout: JSON.stringify({ number: 42, url: 'https://github.com/Min-DongYoung/zzz-workbench/pull/42', baseRefName: 'recovery', headRefName: 'codex/launcher-test', headRefOid: 'a'.repeat(40), state: 'OPEN', mergeStateStatus: 'CLEAN' }) };
        }
        return { stdout: '' };
      },
    }));
    assert.ok(childCalls.some(({ args }) => JSON.stringify(args) === JSON.stringify(expectedArgs)));
  }
});

test('rejects another App, installation, or repository scope before any mutation', () => {
  assert.throws(() => validateAppAndInstallation({ id: APP_ID + 1, owner: { login: 'Min-DongYoung' } }, { id: INSTALLATION_ID, app_id: APP_ID, account: { login: 'Min-DongYoung' } }), LauncherError);
  assert.throws(() => validateAppAndInstallation({ id: APP_ID, owner: { login: 'Min-DongYoung' } }, { id: INSTALLATION_ID + 1, app_id: APP_ID, account: { login: 'Min-DongYoung' } }), LauncherError);
  assert.throws(() => validateTokenRepositories({ total_count: 1, repositories: [{ full_name: 'other/repository', private: true }] }), LauncherError);
});
