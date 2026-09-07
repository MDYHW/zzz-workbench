import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ARTIFACT_SCHEMA,
  ARTIFACT_CANDIDATE_SCHEMA,
  ArtifactValidationError,
  DIGEST_ALGORITHM,
  REGULAR_FILE_MODE,
  RELEASE_DECISION_SCHEMA,
  REQUIRED_CSP,
  REQUIRED_FOOTER_DIGEST,
  REQUIRED_FOOTER_WORDING,
  WORLDWIDE_DELIVERY,
  createArtifactManifest as createArtifactManifestRaw,
  createGitCommandEnvironment,
  createReleaseDecisionTemplate,
  deriveFooterDigest,
  extractImmutableGitSource,
  acceptPreparedArtifact,
  buildCandidateArtifact,
  readArtifactTree,
  sha256,
  validateImmutableBuildInput,
  validateReleaseDecision,
} from './public-release-artifact.mjs';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const FOOTER_DIGEST = REQUIRED_FOOTER_DIGEST;
const GUIDANCE_DIGEST = `sha256:${'1'.repeat(64)}`;
const NOW = Date.parse('2026-09-07T12:00:00.000Z');

function file(filePath, contents = '') {
  return { path: filePath, mode: REGULAR_FILE_MODE, bytes: Buffer.from(contents) };
}

function indexHtml(policy = REQUIRED_CSP) {
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="stylesheet" href="/assets/app-abcdef12.css"></head><body><div id="root"></div><script type="module" src="/assets/app-abcdef12.js"></script></body></html>`;
}

function minimalFiles() {
  return [
    file('index.html', indexHtml()),
    file('assets/app-abcdef12.js', `document.querySelector("#root").textContent = "ready";${REQUIRED_FOOTER_WORDING.join('')}`),
    file('assets/app-abcdef12.css', '.app{background-image:url("/assets/mark-abcdef12.webp")}'),
    file('assets/mark-abcdef12.webp', 'image-bytes'),
    file('.nojekyll'),
  ];
}

function createArtifactManifest(files, options = {}) {
  return createArtifactManifestRaw(files, {
    forbiddenFragments: ['private-owner'],
    ...options,
  });
}

function privateBindings() {
  const tool = (name) => ({
    path: path.resolve(`C:/tools/${name}.exe`),
    realPath: path.resolve(`C:/tools/${name}.exe`),
    digest: `sha256:${'8'.repeat(64)}`,
  });
  const npmPackageRoot = path.resolve('C:/tools/npm');
  return {
    tools: {
      git: tool('git'),
      node: tool('node'),
      npm: {
        path: path.join(npmPackageRoot, 'bin', 'npm-cli.js'),
        realPath: path.join(npmPackageRoot, 'bin', 'npm-cli.js'),
        digest: `sha256:${'8'.repeat(64)}`,
        packageRoot: npmPackageRoot,
        packageFileCount: 3,
        packageTreeDigest: `sha256:${'9'.repeat(64)}`,
      },
    },
    publishingChild: {
      path: 'scripts/github-app/public-release-github.mjs',
      blobSha: 'c'.repeat(40),
      digest: `sha256:${'7'.repeat(64)}`,
    },
    github: {
      digest: `sha256:${'6'.repeat(64)}`,
      destination: { owner: 'neutral', repository: 'neutral.github.io', branch: 'main' },
      apps: {
        bootstrap: { appId: 1, installationId: 2, owner: 'neutral', botLogin: 'bootstrap[bot]' },
        publisher: { appId: 3, installationId: 4, owner: 'neutral', botLogin: 'publisher[bot]' },
      },
    },
  };
}

function releaseExpectation(manifest) {
  return {
    source: { commitSha: SHA_A, treeSha: SHA_B },
    sourceContext: {
      controllerRoot: path.resolve('C:/release-controller'),
      expectedRemoteUrl: 'git@github.com:private/zzz-workbench.git',
      ...privateBindings(),
      repositoryRoot: path.resolve('C:/release-controller'),
    },
    admission: { forbiddenFragments: ['private-owner'] },
    build: { nodeVersion: 'v24.8.0', lockfileSha256: `sha256:${'2'.repeat(64)}` },
    artifact: {
      identityVersion: ARTIFACT_SCHEMA,
      digestAlgorithm: DIGEST_ALGORITHM,
      treeDigest: manifest.treeDigest,
      manifestDigest: manifest.manifestDigest,
      footerDigest: FOOTER_DIGEST,
    },
    operatorUseModel: {
      operator: 'private-product-owner',
      purpose: 'unofficial-non-commercial-fan-site',
      dataHandling: 'no-user-data',
    },
    guidance: [{ id: 'reviewed-guidance-2026-09-07', digest: GUIDANCE_DIGEST }],
  };
}

function releaseContext() {
  const expected = releaseExpectation({ treeDigest: '', manifestDigest: '' });
  return {
    footerDigest: expected.artifact.footerDigest,
    guidance: expected.guidance,
    lockfileSha256: expected.build.lockfileSha256,
    operatorUseModel: expected.operatorUseModel,
  };
}

function acceptedDecision(expected, overrides = {}) {
  const base = {
    schema: RELEASE_DECISION_SCHEMA,
    decision: 'accepted',
    source: expected.source,
    sourceContext: expected.sourceContext,
    admission: expected.admission,
    build: expected.build,
    artifact: expected.artifact,
    operatorUseModel: expected.operatorUseModel,
    delivery: WORLDWIDE_DELIVERY,
    guidance: expected.guidance,
    issuer: 'product-owner',
    issuedAt: '2026-09-07T10:00:00.000Z',
    notAfter: '2026-09-08T10:00:00.000Z',
    phaseRevalidation: {
      phase: 'rc-publish',
      confirmedAt: '2026-09-07T11:00:00.000Z',
      invalidatorsUnchanged: true,
    },
  };
  return { ...base, ...overrides };
}

function buildFixture(root = path.resolve('C:/release-controller')) {
  const extractionRoot = path.resolve('C:/release-temp/extracted');
  return {
    input: {
      branch: 'main',
      controllerRoot: root,
      extractedPaths: ['src/main.tsx', 'package-lock.json', 'index.html', 'package.json'],
      extractedTreeSha: SHA_B,
      extractionRoot,
      gitStatus: '',
      headSha: SHA_A,
      lockfilePath: path.join(extractionRoot, 'package-lock.json'),
      nodeVersion: 'v24.8.0',
      originMainSha: SHA_A,
      remoteUrl: 'git@github.com:private/zzz-workbench.git',
      repositoryRoot: root,
      sourceTreeSha: SHA_B,
      gitExecutable: path.resolve('C:/Program Files/Git/cmd/git.exe'),
    },
    expected: {
      controllerRoot: root,
      gitExecutable: path.resolve('C:/Program Files/Git/cmd/git.exe'),
      headSha: SHA_A,
      remoteUrl: 'git@github.com:private/zzz-workbench.git',
      repositoryRoot: root,
    },
  };
}

function expectCode(callback, code) {
  assert.throws(callback, (error) => error instanceof ArtifactValidationError && error.code === code);
}

function blobSha(bytes) {
  return createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
}

async function extractionFixture({ treeEntries, onCommand } = {}) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-source-extraction-'));
  const repositoryRoot = path.join(temporary, 'controller');
  const extractionRoot = path.join(temporary, 'extracted');
  await fs.mkdir(path.join(repositoryRoot, 'src'), { recursive: true });
  await fs.mkdir(extractionRoot);
  await fs.writeFile(path.join(repositoryRoot, 'src/main.tsx'), 'mutable checkout bytes');
  const contents = new Map([
    ['package.json', Buffer.from('{"scripts":{"build":"vite build"}}')],
    ['package-lock.json', Buffer.from('{"lockfileVersion":3}')],
    ['index.html', Buffer.from('<!doctype html>')],
    ['src/main.tsx', Buffer.from('immutable committed bytes')],
  ]);
  const entries = treeEntries ?? [...contents].map(([entryPath, bytes]) => ({
    mode: '100644', type: 'blob', objectSha: blobSha(bytes), path: entryPath,
  }));
  const treeBytes = Buffer.from(entries.map((entry) => (
    `${entry.mode} ${entry.type} ${entry.objectSha}\t${entry.path}\0`
  )).join(''));
  const calls = [];
  const remote = 'git@github.com:private/zzz-workbench.git';
  const runCommand = async (request) => {
    calls.push(request);
    await onCommand?.(request, { repositoryRoot, extractionRoot });
    const key = request.args.join(' ');
    const text = (value) => ({ stdout: Buffer.from(`${value}\n`), stderr: Buffer.alloc(0) });
    if (key === 'rev-parse --show-toplevel') return text(repositoryRoot);
    if (key === 'status --porcelain=v1 --untracked-files=all') return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    if (key === 'branch --show-current') return text('main');
    if (key === 'rev-parse --verify HEAD') return text(SHA_A);
    if (key === 'rev-parse --verify refs/remotes/origin/main') return text(SHA_A);
    if (key === 'remote get-url origin') return text(remote);
    if (key === 'rev-parse --verify HEAD^{tree}') return text(SHA_B);
    if (request.args[0] === 'ls-tree') return { stdout: treeBytes, stderr: Buffer.alloc(0) };
    if (request.args[0] === 'cat-file') {
      const bytes = [...contents.values()].find((value) => blobSha(value) === request.args[2]);
      if (!bytes) throw new Error('unknown test blob');
      return { stdout: bytes, stderr: Buffer.alloc(0) };
    }
    throw new Error(`unexpected command: ${key}`);
  };
  return {
    temporary,
    repositoryRoot,
    extractionRoot,
    contents,
    calls,
    remote,
    runCommand,
    async extract(overrides = {}) {
      return extractImmutableGitSource({
        gitExecutable: path.join(temporary, 'bin', 'git.exe'),
        controllerRoot: repositoryRoot,
        repositoryRoot,
        expectedRemoteUrl: remote,
        extractionRoot,
        trustedControllerRoot: repositoryRoot,
        runCommand,
        ...overrides,
      });
    },
  };
}

test('admits one canonical static tree and derives stable versioned identities', () => {
  const first = createArtifactManifest(minimalFiles());
  const second = createArtifactManifest([...minimalFiles()].reverse());

  assert.equal(first.schema, ARTIFACT_SCHEMA);
  assert.equal(first.digestAlgorithm, DIGEST_ALGORITHM);
  assert.deepEqual(first.entries.map(({ path: artifactPath }) => artifactPath), [
    '.nojekyll',
    'assets/app-abcdef12.css',
    'assets/app-abcdef12.js',
    'assets/mark-abcdef12.webp',
    'index.html',
  ]);
  assert.equal(first.manifestDigest, second.manifestDigest);
  assert.equal(first.treeDigest, second.treeDigest);
  assert.match(first.manifestDigest, /^sha256:[0-9a-f]{64}$/);
  assert.match(first.treeDigest, /^sha256:[0-9a-f]{64}$/);
  assert.notEqual(first.manifestDigest, first.treeDigest);

  const changed = minimalFiles();
  changed[1] = file('assets/app-abcdef12.js', 'document.querySelector("#root").textContent = "changed";');
  assert.notEqual(createArtifactManifest(changed).treeDigest, first.treeDigest);
});

test('rejects non-runtime, ambiguous, colliding, or incomplete output paths', async (t) => {
  const cases = [
    ['source map', [...minimalFiles(), file('assets/app-abcdef12.js.map', '{}')], 'path_not_allowlisted'],
    ['unexpected root', [...minimalFiles(), file('README.md', 'private')], 'path_not_allowlisted'],
    ['traversal', [...minimalFiles(), file('../escape-abcdef12.js', '')], 'path_invalid'],
    ['backslash', [...minimalFiles(), file('assets\\escape-abcdef12.js', '')], 'path_invalid'],
    ['case collision', [...minimalFiles(), file('assets/App-abcdef12.js', '')], 'path_collision'],
    ['nonempty host file', minimalFiles().map((entry) => entry.path === '.nojekyll' ? file('.nojekyll', 'x') : entry), 'tree_incomplete'],
    ['missing host file', minimalFiles().filter((entry) => entry.path !== '.nojekyll'), 'tree_incomplete'],
  ];
  for (const [name, files, code] of cases) {
    await t.test(name, () => expectCode(() => createArtifactManifest(files), code));
  }
});

test('rejects source map hints, credentials, private fragments, local paths, and external targets', async (t) => {
  const cases = [
    ['source map hint', '//# sourceMappingURL=app.map', {}, 'content_forbidden'],
    ['private key', '-----BEGIN PRIVATE KEY-----', {}, 'content_forbidden'],
    ['GitHub token', `ghp_${'x'.repeat(30)}`, {}, 'content_forbidden'],
    ['private identity', 'private-owner@example.test', { forbiddenFragments: ['private-owner@example.test'] }, 'content_forbidden'],
    ['Windows path', 'C:\\Users\\private-owner\\project', {}, 'content_forbidden'],
    ['generic Windows drive path', 'D:\\build\\output\\secret.js', {}, 'content_forbidden'],
    ['forward-slash Windows drive path', 'E:/ci/work/output.js', {}, 'content_forbidden'],
    ['UNC path', String.raw`\\server\share\private\output.js`, {}, 'content_forbidden'],
    ['file URI', 'file:///opt/private/output.js', {}, 'content_forbidden'],
    ['POSIX path', '/home/private-owner/project', {}, 'content_forbidden'],
    ['non-home POSIX path', '/opt/build/private/output.js', {}, 'content_forbidden'],
    ['external target', 'const endpoint="https://example.test/data"', {}, 'external_target'],
    ['protocol-relative target', 'const src="//cdn.example.test/app.js"', {}, 'external_target'],
  ];
  for (const [name, contents, options, code] of cases) {
    await t.test(name, () => {
      const files = minimalFiles();
      files[1] = file('assets/app-abcdef12.js', contents);
      expectCode(() => createArtifactManifest(files, options), code);
    });
  }

  const binary = minimalFiles();
  binary[3] = file('assets/mark-abcdef12.webp', `binary-prefix ghp_${'x'.repeat(30)} binary-suffix`);
  expectCode(() => createArtifactManifest(binary), 'content_forbidden');

  const compressedBinary = minimalFiles();
  compressedBinary[3] = file(
    'assets/mark-abcdef12.webp',
    Buffer.from([0x52, 0x49, 0x46, 0x46, 0xff, 0x2f, 0x2f, 0x61, 0x62, 0x63, 0x2e, 0x74, 0x65, 0x73, 0x74, 0x00]),
  );
  assert.doesNotThrow(() => createArtifactManifest(compressedBinary));

  const binaryDrivePrefix = minimalFiles();
  binaryDrivePrefix[3] = file(
    'assets/mark-abcdef12.webp',
    Buffer.from([0x52, 0x49, 0x46, 0x46, 0x43, 0x3a, 0x5c, 0xff, 0x01, 0x00]),
  );
  assert.doesNotThrow(() => createArtifactManifest(binaryDrivePrefix));

  const binaryEmbeddedPath = minimalFiles();
  binaryEmbeddedPath[3] = file(
    'assets/mark-abcdef12.webp',
    Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, ...Buffer.from('C:\\Users\\private\\asset.png'), 0x00]),
  );
  expectCode(() => createArtifactManifest(binaryEmbeddedPath), 'content_forbidden');
});

test('public admission requires one canonical case-insensitive private-identifier set', () => {
  expectCode(() => createArtifactManifestRaw(minimalFiles()), 'schema_invalid');
  expectCode(() => createArtifactManifestRaw(minimalFiles(), { forbiddenFragments: [] }), 'schema_invalid');
  expectCode(() => createArtifactManifestRaw(minimalFiles(), {
    forbiddenFragments: ['Private-Owner', 'private-owner'],
  }), 'schema_invalid');
  const manifest = createArtifactManifestRaw(minimalFiles(), {
    forbiddenFragments: ['ZZZ-Private', 'Private-Owner'],
  });
  assert.equal(manifest.treeDigest, createArtifactManifestRaw(minimalFiles(), {
    forbiddenFragments: ['private-owner', 'zzz-private'],
  }).treeDigest);

  const leaked = minimalFiles();
  leaked[1] = file('assets/app-abcdef12.js', 'PRIVATE-OWNER');
  expectCode(() => createArtifactManifestRaw(leaked, { forbiddenFragments: ['private-owner'] }), 'content_forbidden');
});

test('private-identifier admission compares canonically equivalent Unicode in text and binary encodings', () => {
  const composed = 'privé-owner';
  const decomposed = composed.normalize('NFD');
  const variants = [
    { path: 'assets/app-abcdef12.js', bytes: Buffer.from(decomposed, 'utf8') },
    { path: 'assets/mark-abcdef12.webp', bytes: Buffer.from(decomposed, 'utf8') },
    { path: 'assets/mark-abcdef12.webp', bytes: Buffer.from(decomposed, 'utf16le') },
  ];
  for (const variant of variants) {
    const files = minimalFiles();
    const index = files.findIndex((entry) => entry.path === variant.path);
    files[index] = { ...files[index], bytes: variant.bytes };
    expectCode(() => createArtifactManifestRaw(files, {
      forbiddenFragments: [composed],
    }), 'content_forbidden');
  }
});

test('binary admission scans meaningful ASCII and UTF-16 metadata without treating short compressed bytes as paths', () => {
  const variants = [
    Buffer.from('metadata private-owner C:\\build\\private\\artifact.js', 'utf8'),
    Buffer.from('metadata private-owner /home/private/build/artifact.js', 'utf16le'),
    Buffer.from('metadata private-owner /srv/private/build/artifact.js', 'utf16le').swap16(),
    Buffer.concat([Buffer.from([0xff]), Buffer.from('metadata private-owner /home/private/build/artifact.js', 'utf16le')]),
    Buffer.concat([Buffer.from([0xff]), Buffer.from('metadata private-owner /srv/private/build/artifact.js', 'utf16le').swap16()]),
    Buffer.from('메타데이터 비공개-소유자 /home/private/build/artifact.js', 'utf8'),
  ];
  for (const [index, bytes] of variants.entries()) {
    const files = minimalFiles();
    files[3] = { ...files[3], bytes };
    const options = index === variants.length - 1 ? { forbiddenFragments: ['비공개-소유자'] } : {};
    expectCode(() => createArtifactManifest(files, options), 'content_forbidden');
  }
  const files = minimalFiles();
  files[3] = { ...files[3], bytes: Buffer.from([0x91, 0x2f, 0x61, 0x2f, 0xff]) };
  createArtifactManifest(files);
});

test('binary admission rejects short complete absolute paths without a private identifier', () => {
  const variants = [
    Buffer.from([0xff, ...Buffer.from('C:\\a\\b', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('\\\\a\\b', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('file:///x', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('/tmp/x', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('/usr/x', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('/root/a', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('/run/x', 'utf8'), 0x00]),
    Buffer.from([0xff, ...Buffer.from('/data/a', 'utf8'), 0x00]),
    Buffer.concat([Buffer.from([0xff]), Buffer.from('C:\\a\\b', 'utf16le')]),
  ];
  for (const bytes of variants) {
    const files = minimalFiles();
    files[3] = { ...files[3], bytes };
    expectCode(() => createArtifactManifest(files), 'content_forbidden');
  }
});

test('binary admission rejects short configured private identifiers in every supported encoding and alignment', () => {
  const variants = [
    Buffer.from([0xff, ...Buffer.from('owner7', 'utf8'), 0x00]),
    Buffer.from('소유자7', 'utf8'),
    Buffer.concat([Buffer.from([0xff]), Buffer.from('owner7', 'utf16le')]),
    Buffer.concat([Buffer.from([0xff]), Buffer.from('owner7', 'utf16le').swap16()]),
  ];
  for (const [index, bytes] of variants.entries()) {
    const files = minimalFiles();
    files[3] = { ...files[3], bytes };
    expectCode(() => createArtifactManifest(files, {
      forbiddenFragments: [index === 1 ? '소유자7' : 'owner7'],
    }), 'content_forbidden');
  }
});

test('footer digest is derived only from one exact emitted bilingual wording pair', () => {
  assert.equal(deriveFooterDigest(minimalFiles()), REQUIRED_FOOTER_DIGEST);
  const missing = minimalFiles();
  missing[1] = file('assets/app-abcdef12.js', REQUIRED_FOOTER_WORDING[0]);
  expectCode(() => deriveFooterDigest(missing), 'footer_invalid');
  const duplicated = minimalFiles();
  duplicated.push(file('assets/footer-abcdef12.js', REQUIRED_FOOTER_WORDING.join('')));
  expectCode(() => deriveFooterDigest(duplicated), 'footer_invalid');
});

test('records only exact inventoried non-requesting diagnostic URLs', () => {
  const url = 'http://www.w3.org/2000/svg';
  const files = minimalFiles();
  files[1] = file('assets/app-abcdef12.js', `const inertNamespace="${url}";`);
  const exception = {
    path: 'assets/app-abcdef12.js',
    url,
    occurrences: 1,
    reason: 'non-requesting-diagnostic',
  };
  const manifest = createArtifactManifest(files, { inertExternalUrlExceptions: [exception] });
  assert.deepEqual(manifest.inertExternalUrlInventory, [{ ...exception, observedOccurrences: 1 }]);
  expectCode(() => createArtifactManifest(files), 'external_target');
  expectCode(() => createArtifactManifest(files, {
    inertExternalUrlExceptions: [{ ...exception, occurrences: 2 }],
  }), 'exception_mismatch');
  expectCode(() => createArtifactManifest(minimalFiles(), {
    inertExternalUrlExceptions: [exception],
  }), 'exception_mismatch');
});

test('rejects storage, persistence, telemetry, and explicit request APIs in emitted JavaScript', async (t) => {
  const cases = [
    ['cookie', 'document.cookie'],
    ['local storage', 'localStorage.getItem("x")'],
    ['session storage', 'window.sessionStorage.setItem("x","y")'],
    ['indexed DB', 'indexedDB.open("x")'],
    ['service worker', 'navigator.serviceWorker.register("/worker.js")'],
    ['Cache Storage', 'caches.open("x")'],
    ['beacon', 'navigator.sendBeacon("/metric")'],
    ['XHR', 'new XMLHttpRequest()'],
    ['web socket', 'new WebSocket("/socket")'],
    ['event source', 'new EventSource("/events")'],
    ['fetch', 'fetch("/data.json")'],
  ];
  for (const [name, contents] of cases) {
    await t.test(name, () => {
      const files = minimalFiles();
      files[1] = file('assets/app-abcdef12.js', contents);
      expectCode(() => createArtifactManifest(files), 'runtime_api_forbidden');
    });
  }

  const files = minimalFiles();
  files[1] = file('assets/app-abcdef12.js', 'const diagnostic="localStorage";');
  const manifest = createArtifactManifest(files, {
    inertRuntimeApiExceptions: [{
      path: 'assets/app-abcdef12.js',
      api: 'localStorage',
      occurrences: 1,
      reason: 'non-requesting-diagnostic',
    }],
  });
  assert.equal(manifest.inertRuntimeApiInventory[0].api, 'localStorage');
  expectCode(() => createArtifactManifest(files, {
    inertRuntimeApiExceptions: [{
      path: 'assets/app-abcdef12.js',
      api: 'localStorage',
      occurrences: 2,
      reason: 'non-requesting-diagnostic',
    }],
  }), 'exception_mismatch');
});

test('requires the unique exact document CSP', async (t) => {
  const cspCases = [
    ['missing', '<!doctype html><html><head></head></html>'],
    ['comment only', `<!doctype html><html><head><!-- <meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"> --></head></html>`],
    ['commented fake head', `<!-- <head><meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"></head> --><!doctype html><html><head></head></html>`],
    ['template only', `<!doctype html><html><head><template><meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"></template></head></html>`],
    ['script string only', `<!doctype html><html><head><script>const value='<meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}">'</script></head></html>`],
    ['duplicate', indexHtml().replace('<link', `<meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"><link`)],
    ['duplicate conflicting attribute', indexHtml().replace('http-equiv="Content-Security-Policy"', 'http-equiv="refresh" http-equiv="Content-Security-Policy"')],
    ['comment is inert', indexHtml().replace('<meta ', `<!-- <meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"> --><meta `)],
    ['active request precedes policy', indexHtml().replace('<meta ', '<script src="/assets/app-abcdef12.js"></script><meta ')],
    ['unrecognized active element precedes policy', indexHtml().replace('<meta ', '<input type="image" src="/assets/x"><meta ')],
    ['meta refresh follows policy', indexHtml().replace('<link', '<meta http-equiv="refresh" content="0;url=/next"><link')],
    ['relaxed connect', indexHtml(REQUIRED_CSP.replace("connect-src 'self'", "connect-src 'self' https:"))],
    ['omitted directive', indexHtml(REQUIRED_CSP.replace("; worker-src 'none'", ''))],
    ['frame ancestor substitution', indexHtml(REQUIRED_CSP.replace("frame-src 'none'", "frame-ancestors 'none'"))],
  ];
  for (const [name, html] of cspCases) {
    await t.test(name, () => {
      const files = minimalFiles();
      files[0] = file('index.html', html);
      if (name === 'comment is inert') createArtifactManifest(files);
      else expectCode(() => createArtifactManifest(files), 'csp_invalid');
    });
  }
});

test('generated HTML rejects entity-encoded navigation targets', () => {
  const files = minimalFiles();
  files[0] = file('index.html', indexHtml().replace(
    '<link', '<meta http-equiv="refresh" content="0;url=&#47;&#47;attacker.example"><link',
  ));
  expectCode(() => createArtifactManifest(files), 'content_forbidden');
});

test('filesystem walk rejects symlinks before reading output bytes', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-artifact-'));
  try {
    await fs.writeFile(path.join(temporary, 'index.html'), indexHtml());
    const target = path.join(temporary, 'target.txt');
    await fs.writeFile(target, 'target');
    const link = path.join(temporary, 'link.txt');
    try {
      await fs.symlink(target, link, 'file');
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'UNKNOWN'].includes(error.code)) return;
      throw error;
    }
    await assert.rejects(readArtifactTree(temporary), (error) => error instanceof ArtifactValidationError && error.code === 'type_invalid');
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test('immutable build input binds clean exact main, Git tree extraction, Node 24, and lockfile', async (t) => {
  const fixture = buildFixture();
  const verified = validateImmutableBuildInput(fixture.input, fixture.expected);
  assert.deepEqual(verified.extractedPaths, ['index.html', 'package-lock.json', 'package.json', 'src/main.tsx']);

  const cases = [
    ['dirty', { gitStatus: ' M src/main.tsx' }],
    ['stale', { originMainSha: 'c'.repeat(40) }],
    ['wrong branch', { branch: 'codex/release' }],
    ['wrong remote', { remoteUrl: 'git@github.com:other/repo.git' }],
    ['wrong Node', { nodeVersion: 'v22.18.0' }],
    ['tree mismatch', { extractedTreeSha: 'c'.repeat(40) }],
    ['mutable dependencies', { extractedPaths: [...fixture.input.extractedPaths, 'node_modules/pkg/index.js'] }],
    ['project npm config', { extractedPaths: [...fixture.input.extractedPaths, '.npmrc'] }],
    ['prior output', { extractedPaths: [...fixture.input.extractedPaths, 'dist/index.html'] }],
    ['wrong lockfile', { lockfilePath: path.join(fixture.input.extractionRoot, 'nested/package-lock.json') }],
    ['wrong Git executable', { gitExecutable: path.resolve('C:/other/git.exe') }],
  ];
  for (const [name, change] of cases) {
    await t.test(name, () => expectCode(
      () => validateImmutableBuildInput({ ...fixture.input, ...change }, fixture.expected),
      'build_input_invalid',
    ));
  }
});

test('extracts only immutable committed blobs with direct absolute git commands', async () => {
  const fixture = await extractionFixture();
  try {
    const buildInput = await fixture.extract();
    assert.equal(buildInput.headSha, SHA_A);
    assert.equal(buildInput.sourceTreeSha, SHA_B);
    assert.deepEqual(buildInput.extractedPaths, ['index.html', 'package-lock.json', 'package.json', 'src/main.tsx']);
    assert.equal(
      await fs.readFile(path.join(fixture.extractionRoot, 'src/main.tsx'), 'utf8'),
      'immutable committed bytes',
    );
    assert.ok(fixture.calls.every((call) => call.executable === path.join(fixture.temporary, 'bin', 'git.exe')));
    assert.ok(fixture.calls.every((call) => call.cwd === fixture.repositoryRoot && call.shell === false));
    assert.ok(fixture.calls.every((call) => (
      JSON.stringify(call.env) === JSON.stringify(createGitCommandEnvironment(call.executable))
      && !Object.keys(call.env).some((key) => key.toUpperCase() === 'GIT_DIR' || key.toUpperCase() === 'NODE_OPTIONS')
    )));
    assert.ok(fixture.calls.some((call) => call.args[0] === 'ls-tree' && call.args.at(-1) === SHA_A));
    assert.ok(fixture.calls.filter((call) => call.args[0] === 'cat-file')
      .every((call) => call.args[1] === 'blob' && /^[0-9a-f]{40}$/.test(call.args[2])));
    assert.ok(fixture.calls.every((call) => !call.args.includes(path.join(fixture.repositoryRoot, 'src/main.tsx'))));
  } finally {
    await fs.rm(fixture.temporary, { recursive: true, force: true });
  }
});

test('working-tree mutation after source verification cannot enter extracted bytes', async () => {
  let mutated = false;
  const fixture = await extractionFixture({
    onCommand: async (request, { repositoryRoot }) => {
      if (!mutated && request.args[0] === 'cat-file') {
        mutated = true;
        await fs.writeFile(path.join(repositoryRoot, 'src/main.tsx'), 'attacker working-tree bytes');
      }
    },
  });
  try {
    await fixture.extract();
    assert.equal(await fs.readFile(path.join(fixture.repositoryRoot, 'src/main.tsx'), 'utf8'), 'attacker working-tree bytes');
    assert.equal(await fs.readFile(path.join(fixture.extractionRoot, 'src/main.tsx'), 'utf8'), 'immutable committed bytes');
  } finally {
    await fs.rm(fixture.temporary, { recursive: true, force: true });
  }
});

test('immutable extraction rejects symlink and submodule tree entries', async (t) => {
  for (const [name, entry] of [
    ['symlink', { mode: '120000', type: 'blob', objectSha: '3'.repeat(40), path: 'link' }],
    ['submodule', { mode: '160000', type: 'commit', objectSha: '4'.repeat(40), path: 'vendor' }],
  ]) {
    await t.test(name, async () => {
      const fixture = await extractionFixture({ treeEntries: [entry] });
      try {
        await assert.rejects(fixture.extract(), (error) => (
          error instanceof ArtifactValidationError && error.code === 'git_tree_invalid'
        ));
      } finally {
        await fs.rm(fixture.temporary, { recursive: true, force: true });
      }
    });
  }
});

test('immutable extraction fails closed when a direct git command fails', async () => {
  const fixture = await extractionFixture();
  try {
    await assert.rejects(fixture.extract({
      runCommand: async (request) => {
        if (request.args[0] === 'ls-tree') throw new Error('private git failure detail');
        return fixture.runCommand(request);
      },
    }), (error) => (
      error instanceof ArtifactValidationError
      && error.code === 'command_failed'
      && !error.message.includes('private git failure detail')
    ));
  } finally {
    await fs.rm(fixture.temporary, { recursive: true, force: true });
  }
});

test('release decision binds exact artifact, worldwide reach, guidance, and phase freshness', () => {
  const manifest = createArtifactManifest(minimalFiles());
  const expected = releaseExpectation(manifest);
  const decision = acceptedDecision(expected);
  assert.deepEqual(validateReleaseDecision(decision, expected, { phase: 'rc-publish', now: NOW }), {
    schema: RELEASE_DECISION_SCHEMA,
    issuer: 'product-owner',
    phase: 'rc-publish',
    issuedAt: '2026-09-07T10:00:00.000Z',
    notAfter: '2026-09-08T10:00:00.000Z',
    artifactTreeDigest: manifest.treeDigest,
  });

  const template = createReleaseDecisionTemplate(expected, { phase: 'rc-publish' });
  assert.equal(template.decision, 'rejected');
  assert.deepEqual(template.delivery, WORLDWIDE_DELIVERY);
  assert.equal(template.phaseRevalidation.invalidatorsUnchanged, false);
});

test('release decision fails closed on every manual-gate mismatch', async (t) => {
  const manifest = createArtifactManifest(minimalFiles());
  const expected = releaseExpectation(manifest);
  const base = acceptedDecision(expected);
  const cases = [
    ['rejected', { decision: 'rejected' }, 'decision_rejected', NOW],
    ['artifact', { artifact: { ...base.artifact, treeDigest: `sha256:${'3'.repeat(64)}` } }, 'decision_mismatch', NOW],
    ['manifest', { artifact: { ...base.artifact, manifestDigest: `sha256:${'3'.repeat(64)}` } }, 'decision_mismatch', NOW],
    ['footer', { artifact: { ...base.artifact, footerDigest: `sha256:${'3'.repeat(64)}` } }, 'decision_mismatch', NOW],
    ['private admission', { admission: { forbiddenFragments: ['different-private-owner'] } }, 'decision_mismatch', NOW],
    ['source context', { sourceContext: { ...base.sourceContext, expectedRemoteUrl: 'git@github.com:other/private.git' } }, 'decision_mismatch', NOW],
    ['GitHub config', { sourceContext: { ...base.sourceContext, github: { ...base.sourceContext.github, digest: `sha256:${'5'.repeat(64)}` } } }, 'decision_mismatch', NOW],
    ['tool identity', { sourceContext: { ...base.sourceContext, tools: { ...base.sourceContext.tools, node: { ...base.sourceContext.tools.node, digest: `sha256:${'5'.repeat(64)}` } } } }, 'decision_mismatch', NOW],
    ['child source', { sourceContext: { ...base.sourceContext, publishingChild: { ...base.sourceContext.publishingChild, blobSha: 'd'.repeat(40) } } }, 'decision_mismatch', NOW],
    ['jurisdiction subset', { delivery: { ...WORLDWIDE_DELIVERY, jurisdictions: ['KR'] } }, 'decision_reach_mismatch', NOW],
    ['unknown guidance', { guidance: [{ id: 'unknown', digest: GUIDANCE_DIGEST }] }, 'decision_guidance_mismatch', NOW],
    ['guidance digest', { guidance: [{ ...base.guidance[0], digest: `sha256:${'4'.repeat(64)}` }] }, 'decision_guidance_mismatch', NOW],
    ['expired', {}, 'decision_stale', Date.parse('2026-09-09T00:00:00.000Z')],
    ['wrong phase', { phaseRevalidation: { ...base.phaseRevalidation, phase: 'beta-announce' } }, 'decision_phase_mismatch', NOW],
    ['invalidator changed', { phaseRevalidation: { ...base.phaseRevalidation, invalidatorsUnchanged: false } }, 'decision_phase_mismatch', NOW],
    ['future revalidation', { phaseRevalidation: { ...base.phaseRevalidation, confirmedAt: '2026-09-07T13:00:00.000Z' } }, 'decision_stale', NOW],
    ['unknown identity version', { artifact: { ...base.artifact, identityVersion: 'zzz-workbench-public-artifact/v2' } }, 'decision_invalid', NOW],
    ['unknown digest algorithm', { artifact: { ...base.artifact, digestAlgorithm: 'sha512' } }, 'decision_invalid', NOW],
    ['extra nested field', { source: { ...base.source, branch: 'main' } }, 'schema_invalid', NOW],
  ];
  for (const [name, override, code, at] of cases) {
    await t.test(name, () => expectCode(
      () => validateReleaseDecision({ ...base, ...override }, expected, { phase: 'rc-publish', now: at }),
      code,
    ));
  }
});

test('candidate build runs once, then later acceptance performs no install or build', async () => {
  const fixture = buildFixture();
  const generatedFiles = minimalFiles().filter((entry) => entry.path !== '.nojekyll');
  const events = [];
  const candidate = await buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async (command) => events.push(['install', command]),
    build: async (command) => events.push(['build', command]),
    readGeneratedFiles: async (input) => {
      events.push(['read', input]);
      return generatedFiles;
    },
    releaseContext: releaseContext(),
    phase: 'rc-publish',
    forbiddenFragments: ['Private-Owner'],
    privateBindings: privateBindings(),
  });

  assert.equal(candidate.schema, ARTIFACT_CANDIDATE_SCHEMA);
  assert.equal(candidate.expectation.artifact.treeDigest, candidate.manifest.treeDigest);
  assert.equal(candidate.expectation.artifact.manifestDigest, candidate.manifest.manifestDigest);
  assert.equal(candidate.template.decision, 'rejected');
  assert.deepEqual(candidate.expectation.admission.forbiddenFragments, candidate.admission.forbiddenFragments);
  assert.equal(candidate.expectation.artifact.footerDigest, deriveFooterDigest(candidate.files));
  assert.equal(candidate.expectation.sourceContext.tools.git.path, path.resolve('C:/tools/git.exe'));
  assert.ok(candidate.admission.forbiddenFragments.includes('private-owner'));
  assert.ok(candidate.admission.forbiddenFragments.includes(fixture.input.controllerRoot.toLowerCase()));
  assert.deepEqual(events.map(([event]) => event), ['install', 'build', 'read']);
  assert.deepEqual(events[0][1].args, ['ci', '--ignore-scripts']);
  assert.deepEqual(events[1][1].args, ['run', 'build']);
  assert.equal(events[2][1].root, path.join(fixture.input.extractionRoot, 'dist'));

  events.length = 0;
  const result = await acceptPreparedArtifact({
    candidate,
    decision: acceptedDecision(candidate.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async (accepted) => {
      events.push(['accepted', accepted.manifest.treeDigest]);
      return accepted.manifest;
    },
  });

  assert.equal(result.treeDigest, candidate.manifest.treeDigest);
  assert.deepEqual(events.map(([event]) => event), ['accepted']);
});

test('a publish-prepared artifact remains eligible for a fresh restore-phase decision', async () => {
  const fixture = buildFixture();
  const candidate = await buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => minimalFiles().filter((entry) => entry.path !== '.nojekyll'),
    releaseContext: releaseContext(),
    phase: 'publish',
    forbiddenFragments: ['private-owner'],
    privateBindings: privateBindings(),
  });
  const decision = acceptedDecision(candidate.expectation, {
    phaseRevalidation: {
      phase: 'restore', confirmedAt: '2026-09-07T11:30:00.000Z', invalidatorsUnchanged: true,
    },
  });
  const result = await acceptPreparedArtifact({
    candidate, decision, phase: 'restore', now: NOW,
    onAccepted: async ({ manifest }) => manifest.treeDigest,
  });
  assert.equal(result, candidate.manifest.treeDigest);
});

test('candidate build failure cannot create an accepted candidate', async () => {
  const fixture = buildFixture();
  await assert.rejects(buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => { throw new Error('build failed'); },
    readGeneratedFiles: async () => minimalFiles().filter((entry) => entry.path !== '.nojekyll'),
    releaseContext: releaseContext(),
    phase: 'rc-publish',
    forbiddenFragments: ['private-owner'],
    privateBindings: privateBindings(),
  }), /build failed/);
});

test('candidate build rejects a caller footer digest mismatch and bound root leakage', async () => {
  const fixture = buildFixture();
  const base = {
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => minimalFiles().filter((entry) => entry.path !== '.nojekyll'),
    phase: 'rc-publish',
    forbiddenFragments: ['private-owner'],
    privateBindings: privateBindings(),
  };
  await assert.rejects(buildCandidateArtifact({
    ...base,
    releaseContext: { ...releaseContext(), footerDigest: `sha256:${'9'.repeat(64)}` },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'footer_invalid');

  const leaked = minimalFiles();
  leaked[1] = file('assets/app-abcdef12.js', `${REQUIRED_FOOTER_WORDING.join('')} ${fixture.input.extractionRoot.toUpperCase()}`);
  await assert.rejects(buildCandidateArtifact({
    ...base,
    releaseContext: releaseContext(),
    readGeneratedFiles: async () => leaked.filter((entry) => entry.path !== '.nojekyll'),
  }), (error) => error instanceof ArtifactValidationError && error.code === 'content_forbidden');
});

test('acceptance rejects changed retained bytes, manifest, template, and decision', async () => {
  const fixture = buildFixture();
  const makeCandidate = () => buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => minimalFiles().filter((entry) => entry.path !== '.nojekyll'),
    releaseContext: releaseContext(),
    phase: 'rc-publish',
    forbiddenFragments: ['private-owner'],
    privateBindings: privateBindings(),
  });
  let acceptedCalls = 0;

  const bytesChanged = await makeCandidate();
  bytesChanged.files.find((entry) => entry.path.endsWith('.js')).bytes[0] ^= 1;
  await assert.rejects(acceptPreparedArtifact({
    candidate: bytesChanged,
    decision: acceptedDecision(bytesChanged.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'candidate_changed');

  const manifestChanged = await makeCandidate();
  manifestChanged.manifest.treeDigest = `sha256:${'9'.repeat(64)}`;
  await assert.rejects(acceptPreparedArtifact({
    candidate: manifestChanged,
    decision: acceptedDecision(manifestChanged.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'candidate_changed');

  const templateChanged = await makeCandidate();
  templateChanged.template.delivery.reach = 'private';
  await assert.rejects(acceptPreparedArtifact({
    candidate: templateChanged,
    decision: acceptedDecision(templateChanged.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'candidate_changed');

  const admissionChanged = await makeCandidate();
  admissionChanged.admission.forbiddenFragments = ['different-private-owner'];
  await assert.rejects(acceptPreparedArtifact({
    candidate: admissionChanged,
    decision: acceptedDecision(admissionChanged.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'candidate_changed');

  const sourceContextChanged = await makeCandidate();
  sourceContextChanged.expectation.sourceContext.expectedRemoteUrl = 'git@github.com:other/private.git';
  await assert.rejects(acceptPreparedArtifact({
    candidate: sourceContextChanged,
    decision: acceptedDecision(sourceContextChanged.expectation),
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'candidate_changed');

  const rejected = await makeCandidate();
  await assert.rejects(acceptPreparedArtifact({
    candidate: rejected,
    decision: { ...acceptedDecision(rejected.expectation), decision: 'rejected' },
    phase: 'rc-publish',
    now: NOW,
    onAccepted: async () => { acceptedCalls += 1; },
  }), (error) => error instanceof ArtifactValidationError && error.code === 'decision_rejected');
  assert.equal(acceptedCalls, 0);
});

test('sha256 hashes raw bytes rather than text-normalized content', () => {
  assert.notEqual(sha256(Buffer.from('a\r\n')), sha256(Buffer.from('a\n')));
});
