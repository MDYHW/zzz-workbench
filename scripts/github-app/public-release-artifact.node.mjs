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
  runDirectCommand,
  sha256,
  validateImmutableBuildInput,
  validateReleaseDecision,
} from './public-release-artifact.mjs';
import { sanitizeRasterMetadata } from './public-raster-metadata.js';
import { COMPANION_DOWNLOAD, COMPANION_FILES, createCompanionArchive, readCompanionArchive } from './companion/archive.mjs';
import { buildCompanion } from './companion/build.mjs';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const FOOTER_DIGEST = REQUIRED_FOOTER_DIGEST;
const GUIDANCE_DIGEST = `sha256:${'1'.repeat(64)}`;
const NOW = Date.parse('2026-09-07T12:00:00.000Z');

function file(filePath, contents = '') {
  return { path: filePath, mode: REGULAR_FILE_MODE, bytes: Buffer.from(contents) };
}

function webpChunk(type, contents) {
  const payload = Buffer.from(contents);
  const bytes = Buffer.alloc(8 + payload.length + (payload.length % 2));
  bytes.write(type, 0, 'ascii');
  bytes.writeUInt32LE(payload.length, 4);
  payload.copy(bytes, 8);
  return bytes;
}

function webpImageBytes(contents = 'pixels', extraChunks = []) {
  const payload = Buffer.concat([
    Buffer.from('WEBP'),
    webpChunk('VP8 ', contents),
    ...extraChunks,
  ]);
  const bytes = Buffer.alloc(8 + payload.length);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(payload.length, 4);
  payload.copy(bytes, 8);
  return bytes;
}

function utf16Be(value) {
  const bytes = Buffer.alloc(value.length * 2);
  for (let index = 0; index < value.length; index += 1) bytes.writeUInt16BE(value.charCodeAt(index), index * 2);
  return bytes;
}

function trueTypeBytes(metadata = ['Fixture Variable']) {
  const strings = metadata.map(utf16Be);
  const nameHeaderLength = 6 + (strings.length * 12);
  const name = Buffer.alloc(nameHeaderLength + strings.reduce((sum, value) => sum + value.length, 0));
  name.writeUInt16BE(strings.length, 2);
  name.writeUInt16BE(nameHeaderLength, 4);
  let stringOffset = 0;
  strings.forEach((value, index) => {
    const record = 6 + (index * 12);
    name.writeUInt16BE(3, record);
    name.writeUInt16BE(1, record + 2);
    name.writeUInt16BE(0x0409, record + 4);
    name.writeUInt16BE(index + 1, record + 6);
    name.writeUInt16BE(value.length, record + 8);
    name.writeUInt16BE(stringOffset, record + 10);
    value.copy(name, nameHeaderLength + stringOffset);
    stringOffset += value.length;
  });

  const head = Buffer.alloc(54);
  head.writeUInt32BE(0x00010000, 0);
  head.writeUInt32BE(0x5f0f3cf5, 12);
  const maxp = Buffer.alloc(32);
  maxp.writeUInt32BE(0x00010000, 0);
  maxp.writeUInt16BE(1, 4);
  const fvar = Buffer.alloc(36);
  fvar.writeUInt16BE(1, 0);
  fvar.writeUInt16BE(16, 4);
  fvar.writeUInt16BE(2, 6);
  fvar.writeUInt16BE(1, 8);
  fvar.writeUInt16BE(20, 10);
  fvar.writeUInt16BE(0, 12);
  fvar.writeUInt16BE(8, 14);
  fvar.write('wght', 16, 'ascii');

  const tables = new Map([
    ['OS/2', Buffer.alloc(68)],
    ['cmap', Buffer.alloc(4)],
    ['fvar', fvar],
    ['glyf', Buffer.alloc(4)],
    ['head', head],
    ['hhea', Buffer.alloc(36)],
    ['hmtx', Buffer.alloc(4)],
    ['loca', Buffer.alloc(4)],
    ['maxp', maxp],
    ['name', name],
    ['post', Buffer.alloc(128)],
  ]);
  const directoryEnd = 12 + (tables.size * 16);
  let total = directoryEnd;
  for (const value of tables.values()) {
    total = (total + 3) & ~3;
    total += value.length;
  }
  const bytes = Buffer.alloc(total);
  bytes.writeUInt32BE(0x00010000, 0);
  bytes.writeUInt16BE(tables.size, 4);
  let offset = directoryEnd;
  let index = 0;
  for (const [tag, value] of tables) {
    offset = (offset + 3) & ~3;
    const record = 12 + (index * 16);
    bytes.write(tag, record, 'ascii');
    bytes.writeUInt32BE(offset, record + 8);
    bytes.writeUInt32BE(value.length, record + 12);
    value.copy(bytes, offset);
    offset += value.length;
    index += 1;
  }
  return bytes;
}

function trueTypeTableRecord(bytes, wantedTag) {
  const numTables = bytes.readUInt16BE(4);
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + (index * 16);
    if (bytes.toString('ascii', record, record + 4) === wantedTag) return record;
  }
  throw new Error(`Missing test table: ${wantedTag}`);
}

function indexHtml(policy = REQUIRED_CSP) {
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="stylesheet" href="/assets/app-abcdef12.css"></head><body><div id="root"></div><script type="module" src="/assets/app-abcdef12.js"></script></body></html>`;
}

function minimalFiles() {
  return [
    file('index.html', indexHtml()),
    file('assets/app-abcdef12.js', `document.querySelector("#root").textContent = "ready";${REQUIRED_FOOTER_WORDING.join('')}`),
    file('assets/app-abcdef12.css', '.app{background-image:url("/assets/mark-abcdef12.webp")}'),
    file('assets/mark-abcdef12.webp', webpImageBytes()),
    file('.nojekyll'),
  ];
}

function companionFiles() {
  const manifest = {
    manifest_version: 3, name: 'Fixture companion', version: '1.0.0', description: 'Visible gear reader',
    permissions: ['activeTab', 'scripting'], action: { default_popup: 'popup.html', default_title: 'Gear' },
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self'; style-src 'self'" },
  };
  return COMPANION_FILES.map(name => ({ path: name, bytes: Buffer.from(name === 'manifest.json' ? JSON.stringify(manifest) : '') }));
}

test('companion ZIP is deterministic, canonical and inspected for nested private content', () => {
  const entries = companionFiles();
  const zip = createCompanionArchive(entries);
  assert.deepEqual(zip, createCompanionArchive([...entries].reverse()));
  assert.deepEqual(readCompanionArchive(zip), entries);
  createArtifactManifest([...minimalFiles(), file(COMPANION_DOWNLOAD, zip)]);
  for (const forbidden of ['private-owner', 'document.cookie', 'fetch("https://example.com")', '//# sourceMappingURL=private.map']) {
    const changed = entries.map(entry => entry.path === 'adapter.js' ? { ...entry, bytes: Buffer.from(forbidden) } : entry);
    assert.throws(() => createArtifactManifest([...minimalFiles(), file(COMPANION_DOWNLOAD, createCompanionArchive(changed))]));
  }
  for (const changed of [Buffer.concat([zip, Buffer.from('extra')]), zip.subarray(0, -1)]) {
    expectCode(() => createArtifactManifest([...minimalFiles(), file(COMPANION_DOWNLOAD, changed)]), 'companion_invalid');
  }
  const corrupted = Buffer.from(zip);
  corrupted[4] ^= 1;
  assert.throws(() => readCompanionArchive(corrupted));
  assert.throws(() => createCompanionArchive(entries.map((entry, i) => i === 0 ? { ...entry, path: '../adapter.js' } : entry)));
  assert.throws(() => createCompanionArchive([...entries, { path: 'source-version.json', bytes: Buffer.from('{}') }]));
});

test('companion installation metadata cannot add host, storage or background privileges', () => {
  for (const change of [
    manifest => { manifest.permissions.push('cookies'); },
    manifest => { manifest.host_permissions = ['<all_urls>']; },
    manifest => { manifest.background = { service_worker: 'adapter.js' }; },
    manifest => { manifest.content_security_policy.extension_pages = "script-src 'self'; connect-src *"; },
  ]) {
    const entries = companionFiles();
    const manifest = JSON.parse(entries[2].bytes);
    change(manifest);
    entries[2].bytes = Buffer.from(JSON.stringify(manifest));
    assert.throws(() => createArtifactManifest([...minimalFiles(), file(COMPANION_DOWNLOAD, createCompanionArchive(entries))]));
  }
});

test('only the fixed user navigation targets are added to the public URL boundary', () => {
  const files = minimalFiles();
  files[1].bytes = Buffer.concat([files[1].bytes, Buffer.from('"https://act.hoyolab.com/app/zzz-game-record/index.html?lang=ko-kr&hyl_presentation_style=fullscreen#/zzz"')]);
  createArtifactManifest(files);
  files[1].bytes = Buffer.concat([files[1].bytes, Buffer.from('"https://act.hoyolab.com/other"')]);
  expectCode(() => createArtifactManifest(files), 'external_target');
});

test('the generated companion passes the same nested public-artifact boundary', async () => {
  const zip = await buildCompanion();
  const manifest = createArtifactManifest([...minimalFiles(), file(COMPANION_DOWNLOAD, zip)], {
    forbiddenFragments: ['private-owner', 'source-version', 'workbenchcommit'],
  });
  assert.ok(manifest.entries.some(entry => entry.path === COMPANION_DOWNLOAD));
});

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

async function findGitExecutable() {
  const executableName = process.platform === 'win32' ? 'git.exe' : 'git';
  for (const rawDirectory of (process.env.PATH ?? '').split(path.delimiter)) {
    const directory = rawDirectory.replace(/^"|"$/g, '');
    if (!directory) continue;
    const candidate = path.resolve(directory, executableName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue through the bounded process PATH.
    }
  }
  return null;
}

async function directGit(gitExecutable, cwd, args, { input = null, allowReplacements = false } = {}) {
  const env = createGitCommandEnvironment(gitExecutable);
  if (allowReplacements) delete env.GIT_NO_REPLACE_OBJECTS;
  return runDirectCommand({ executable: gitExecutable, args, cwd, input, shell: false, env });
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
    ['independently executable SVG document', [...minimalFiles(), file('assets/payload-abcdef12.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>fetch("/unexpected")</script></svg>')], 'path_not_allowlisted'],
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

test('admits only inspected hashed font and dependency-license assets', () => {
  const licensePath = 'assets/Typeface-LICENSE-abcdef12.txt';
  const fontPath = 'assets/Typeface-Variable-abcdef12.ttf';
  const licenseUrl = 'https://scripts.sil.org/OFL';
  const exception = (path) => ({ path, url: licenseUrl, occurrences: 1, reason: 'non-requesting-diagnostic' });
  const files = [
    ...minimalFiles(),
    file(fontPath, trueTypeBytes([licenseUrl])),
    file(licensePath, `SIL Open Font License: ${licenseUrl}`),
  ];

  const exceptions = [exception(fontPath), exception(licensePath)];
  const manifest = createArtifactManifest(files, { inertExternalUrlExceptions: exceptions });
  assert.deepEqual(manifest.inertExternalUrlInventory, exceptions.map((entry) => ({
    ...entry, observedOccurrences: 1,
  })).sort((left, right) => left.path.localeCompare(right.path)));
  expectCode(() => createArtifactManifest(files), 'external_target');
  const repeatedFont = [
    ...minimalFiles(),
    file(fontPath, trueTypeBytes([licenseUrl, licenseUrl])),
  ];
  const repeatedException = { ...exception(fontPath), occurrences: 2 };
  assert.equal(createArtifactManifest(repeatedFont, {
    inertExternalUrlExceptions: [repeatedException],
  }).inertExternalUrlInventory[0].observedOccurrences, 2);
  expectCode(() => createArtifactManifest(repeatedFont, {
    inertExternalUrlExceptions: [exception(fontPath)],
  }), 'exception_mismatch');
  const customTableUrl = 'https://example.test/font';
  const customTableVariants = [
    ['ASCII', Buffer.from(customTableUrl, 'ascii'), 0],
    ['UTF-16BE', utf16Be(customTableUrl), 0],
    ['UTF-16LE', Buffer.from(customTableUrl, 'utf16le'), 0],
    ['odd-aligned UTF-16BE', utf16Be(customTableUrl), 1],
  ];
  for (const [, payload, extraOffset] of customTableVariants) {
    const customTableFont = trueTypeBytes();
    const postRecord = trueTypeTableRecord(customTableFont, 'post');
    payload.copy(customTableFont, customTableFont.readUInt32BE(postRecord + 8) + extraOffset);
    const customTableFiles = [...minimalFiles(), file(fontPath, customTableFont)];
    expectCode(() => createArtifactManifest(customTableFiles), 'external_target');
    assert.equal(createArtifactManifest(customTableFiles, {
      inertExternalUrlExceptions: [{
        path: fontPath,
        url: customTableUrl,
        occurrences: 1,
        reason: 'non-requesting-diagnostic',
      }],
    }).inertExternalUrlInventory[0].observedOccurrences, 1);
  }
  expectCode(() => createArtifactManifest([
    ...minimalFiles(), file('assets/notes-abcdef12.txt', 'not a dependency license'),
  ]), 'path_not_allowlisted');
  expectCode(() => createArtifactManifest([
    ...minimalFiles(), file('assets/Typeface-LICENSE.txt', 'unhashed license'),
  ]), 'path_not_allowlisted');
  expectCode(() => createArtifactManifest([
    ...minimalFiles(), file('assets/Typeface-LICENSE-abcdef12.TXT', 'wrong case'),
  ]), 'path_not_allowlisted');
  expectCode(() => createArtifactManifest([
    ...minimalFiles(), file(fontPath, 'not a TrueType font'),
  ]), 'content_invalid');
  const truncated = trueTypeBytes().subarray(0, 80);
  expectCode(() => createArtifactManifest([
    ...minimalFiles(), file(fontPath, truncated),
  ]), 'content_invalid');
  const leaked = [
    ...minimalFiles(),
    file(fontPath, trueTypeBytes(['C:\\Users\\private-owner\\font-source'])),
  ];
  expectCode(() => createArtifactManifest(leaked), 'content_forbidden');
});

test('rejects malformed TrueType structure before treating font metadata as inert', async (t) => {
  const fontPath = 'assets/Typeface-Variable-abcdef12.ttf';
  const reject = (bytes) => expectCode(() => createArtifactManifest([
    ...minimalFiles(), file(fontPath, bytes),
  ]), 'content_invalid');
  const cases = [
    ['zero table count', (bytes) => bytes.writeUInt16BE(0, 4)],
    ['excessive table count', (bytes) => bytes.writeUInt16BE(4097, 4)],
    ['duplicate table', (bytes) => bytes.write('OS/2', 12 + 16, 'ascii')],
    ['zero-length table', (bytes) => bytes.writeUInt32BE(0, 12 + 12)],
    ['misaligned table', (bytes) => bytes.writeUInt32BE(bytes.readUInt32BE(12 + 8) + 1, 12 + 8)],
    ['out-of-bounds table', (bytes) => bytes.writeUInt32BE(bytes.length, 12 + 12)],
    ['overlapping table', (bytes) => bytes.writeUInt32BE(bytes.readUInt32BE(12 + 8), 12 + 16 + 8)],
    ['missing variable table', (bytes) => bytes.write('zzzz', trueTypeTableRecord(bytes, 'fvar'), 'ascii')],
    ['invalid head magic', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'head');
      bytes.writeUInt32BE(0, bytes.readUInt32BE(record + 8) + 12);
    }],
    ['empty axis set', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'fvar');
      bytes.writeUInt16BE(0, bytes.readUInt32BE(record + 8) + 8);
    }],
    ['out-of-bounds variation instances', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'fvar');
      bytes.writeUInt16BE(0xffff, bytes.readUInt32BE(record + 8) + 12);
    }],
    ['zero glyph count', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'maxp');
      bytes.writeUInt16BE(0, bytes.readUInt32BE(record + 8) + 4);
    }],
    ['name storage before records', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      bytes.writeUInt16BE(6, bytes.readUInt32BE(record + 8) + 4);
    }],
    ['empty name record set', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      bytes.writeUInt16BE(0, bytes.readUInt32BE(record + 8) + 2);
    }],
    ['unparsed format-1 language tags', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      bytes.writeUInt16BE(1, bytes.readUInt32BE(record + 8));
    }],
    ['out-of-bounds name string', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      const offset = bytes.readUInt32BE(record + 8);
      bytes.writeUInt16BE(0xffff, offset + 6 + 8);
    }],
    ['odd UTF-16 name length', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      const offset = bytes.readUInt32BE(record + 8);
      bytes.writeUInt16BE(3, offset + 6 + 8);
    }],
    ['unreferenced name storage', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      const offset = bytes.readUInt32BE(record + 8);
      bytes.writeUInt16BE(2, offset + 6 + 10);
    }],
    ['unsupported name platform', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      const offset = bytes.readUInt32BE(record + 8);
      bytes.writeUInt16BE(2, offset + 6);
    }],
    ['unsupported Windows name encoding', (bytes) => {
      const record = trueTypeTableRecord(bytes, 'name');
      const offset = bytes.readUInt32BE(record + 8);
      bytes.writeUInt16BE(4, offset + 6 + 2);
    }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const bytes = trueTypeBytes();
      mutate(bytes);
      reject(bytes);
    });
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
    ['inline raster', 'const image="data:image/webp;base64,UklGRg=="', {}, 'content_forbidden'],
  ];
  for (const [name, contents, options, code] of cases) {
    await t.test(name, () => {
      const files = minimalFiles();
      files[1] = file('assets/app-abcdef12.js', contents);
      expectCode(() => createArtifactManifest(files, options), code);
    });
  }

  const binary = minimalFiles();
  binary[3] = file('assets/mark-abcdef12.webp', webpImageBytes(`binary-prefix ghp_${'x'.repeat(30)} binary-suffix`));
  expectCode(() => createArtifactManifest(binary), 'content_forbidden');

  const compressedBinary = minimalFiles();
  compressedBinary[3] = file(
    'assets/mark-abcdef12.webp',
    webpImageBytes(Buffer.from([0xff, 0x2f, 0x2f, 0x61, 0x62, 0x63, 0x2e, 0x74, 0x65, 0x73, 0x74, 0x00])),
  );
  assert.doesNotThrow(() => createArtifactManifest(compressedBinary));

  const binaryDrivePrefix = minimalFiles();
  binaryDrivePrefix[3] = file(
    'assets/mark-abcdef12.webp',
    webpImageBytes(Buffer.from([0x43, 0x3a, 0x5c, 0xff, 0x01, 0x00])),
  );
  assert.doesNotThrow(() => createArtifactManifest(binaryDrivePrefix));

  const binaryEmbeddedPath = minimalFiles();
  binaryEmbeddedPath[3] = file(
    'assets/mark-abcdef12.webp',
    webpImageBytes(Buffer.from([0x00, ...Buffer.from('C:\\Users\\private\\asset.png'), 0x00])),
  );
  expectCode(() => createArtifactManifest(binaryEmbeddedPath), 'content_forbidden');
});

test('rejects private identifiers and credential shapes in artifact paths', () => {
  expectCode(() => createArtifactManifest([
    ...minimalFiles(),
    file('assets/Private-Owner-abcdef12.png', 'image'),
  ]), 'content_forbidden');
  expectCode(() => createArtifactManifest([
    ...minimalFiles(),
    file(`assets/ghp_${'x'.repeat(30)}-abcdef12.png`, 'image'),
  ]), 'content_forbidden');
});

test('artifact admission rejects raster metadata and accepts explicitly sanitized containers', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-raster-metadata-'));
  const webp = webpImageBytes('pixels', [
    webpChunk('EXIF', Buffer.from('private-owner')),
    webpChunk('PSAI', Buffer.from('C:\\Users\\private-owner')),
  ]);
  const pngChunk = (type, contents) => {
    const bytes = Buffer.alloc(12 + contents.length);
    bytes.writeUInt32BE(contents.length, 0);
    bytes.write(type, 4, 'ascii');
    contents.copy(bytes, 8);
    return bytes;
  };
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', Buffer.alloc(13)),
    pngChunk('iCCP', Buffer.from('private-owner')),
    pngChunk('IDAT', Buffer.from('pixels')),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  try {
    await fs.mkdir(path.join(temporary, 'assets'));
    await fs.writeFile(path.join(temporary, 'assets', 'mark-abcdef12.webp'), webp);
    await fs.writeFile(path.join(temporary, 'assets', 'portrait-abcdef12.png'), png);
    const ingested = await readArtifactTree(temporary);
    assert.ok(ingested.some(({ bytes }) => bytes.includes(Buffer.from('private-owner'))));
    const direct = minimalFiles();
    direct[3] = file('assets/mark-abcdef12.webp', webp);
    expectCode(() => createArtifactManifest(direct), 'content_forbidden');
    direct[3] = file('assets/mark-abcdef12.webp', sanitizeRasterMetadata('assets/mark-abcdef12.webp', webp));
    direct.push(file('assets/portrait-abcdef12.png', png));
    expectCode(() => createArtifactManifest(direct), 'content_forbidden');
    const pngIndex = direct.findIndex(({ path: artifactPath }) => artifactPath.endsWith('.png'));
    direct[pngIndex] = file('assets/portrait-abcdef12.png', sanitizeRasterMetadata('assets/portrait-abcdef12.png', png));
    assert.doesNotThrow(() => createArtifactManifest(direct));
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test('rejects raster extension and signature mismatches', () => {
  const webp = minimalFiles();
  webp[3] = file('assets/mark-abcdef12.webp', 'not a WebP container');
  expectCode(() => createArtifactManifest(webp), 'content_invalid');
  expectCode(() => createArtifactManifest([
    ...minimalFiles(),
    file('assets/portrait-abcdef12.png', webpImageBytes()),
  ]), 'content_invalid');
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
    files[index] = {
      ...files[index],
      bytes: variant.path.endsWith('.webp') ? webpImageBytes(variant.bytes) : variant.bytes,
    };
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
    files[3] = { ...files[3], bytes: webpImageBytes(bytes) };
    const options = index === variants.length - 1 ? { forbiddenFragments: ['비공개-소유자'] } : {};
    expectCode(() => createArtifactManifest(files, options), 'content_forbidden');
  }
  const files = minimalFiles();
  files[3] = { ...files[3], bytes: webpImageBytes(Buffer.from([0x91, 0x2f, 0x61, 0x2f, 0xff])) };
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
    files[3] = { ...files[3], bytes: webpImageBytes(bytes) };
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
    files[3] = { ...files[3], bytes: webpImageBytes(bytes) };
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

test('filesystem walk rejects a symlinked artifact root before reading its target', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-artifact-root-'));
  const target = path.join(temporary, 'target');
  const redirectedRoot = path.join(temporary, 'dist');
  try {
    await fs.mkdir(target);
    await fs.writeFile(path.join(target, 'index.html'), indexHtml());
    try {
      await fs.symlink(target, redirectedRoot, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'UNKNOWN'].includes(error.code)) return;
      throw error;
    }
    await assert.rejects(readArtifactTree(redirectedRoot), (error) => (
      error instanceof ArtifactValidationError && error.code === 'type_invalid'
    ));
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test('release Git commands ignore replacement refs when proving ancestry', async (t) => {
  const gitExecutable = await findGitExecutable();
  if (gitExecutable === null) {
    t.skip('Git executable is unavailable');
    return;
  }
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-git-replace-'));
  const identity = [
    '-c', 'user.name=Release Test',
    '-c', 'user.email=release-test@example.invalid',
  ];
  try {
    await directGit(gitExecutable, temporary, ['init', '--initial-branch=main']);
    await fs.writeFile(path.join(temporary, 'artifact.txt'), 'current main tree');
    await directGit(gitExecutable, temporary, ['add', 'artifact.txt']);
    await directGit(gitExecutable, temporary, [...identity, 'commit', '-m', 'current main']);
    const head = (await directGit(gitExecutable, temporary, ['rev-parse', 'HEAD'])).stdout.toString('utf8').trim();
    const tree = (await directGit(gitExecutable, temporary, ['rev-parse', 'HEAD^{tree}'])).stdout.toString('utf8').trim();
    const candidate = (await directGit(
      gitExecutable, temporary, [...identity, 'commit-tree', tree], { input: Buffer.from('unreachable candidate\n') },
    )).stdout.toString('utf8').trim();
    const replacement = (await directGit(
      gitExecutable, temporary, [...identity, 'commit-tree', tree, '-p', candidate],
      { input: Buffer.from('replacement graft\n') },
    )).stdout.toString('utf8').trim();
    await directGit(gitExecutable, temporary, ['replace', head, replacement]);

    await directGit(gitExecutable, temporary, ['merge-base', '--is-ancestor', candidate, head], {
      allowReplacements: true,
    });
    await assert.rejects(
      directGit(gitExecutable, temporary, ['merge-base', '--is-ancestor', candidate, head]),
      (error) => error instanceof ArtifactValidationError && error.code === 'command_failed',
    );
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
  const generatedFiles = minimalFiles();
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
  assert.deepEqual(candidate.files.map(({ path: filePath }) => filePath), [
    ...candidate.files.map(({ path: filePath }) => filePath),
  ].sort());
  assert.equal(candidate.expectation.artifact.treeDigest, candidate.manifest.treeDigest);
  assert.equal(candidate.expectation.artifact.manifestDigest, candidate.manifest.manifestDigest);
  assert.equal(candidate.template.decision, 'rejected');
  assert.deepEqual(candidate.expectation.admission.forbiddenFragments, candidate.admission.forbiddenFragments);
  assert.equal(candidate.expectation.artifact.footerDigest, deriveFooterDigest(candidate.files));
  assert.equal(candidate.expectation.sourceContext.tools.git.path, path.resolve('C:/tools/git.exe'));
  assert.ok(candidate.admission.forbiddenFragments.includes('private-owner'));
  assert.ok(candidate.admission.forbiddenFragments.includes(fixture.input.controllerRoot.toLowerCase()));
  assert.deepEqual(events.map(([event]) => event), ['read', 'install', 'build', 'read']);
  assert.equal(events[0][1].root, path.join(fixture.input.extractionRoot, 'src', 'assets'));
  assert.deepEqual(events[1][1].args, ['ci', '--ignore-scripts']);
  assert.deepEqual(events[2][1].args, ['run', 'build']);
  assert.equal(events[3][1].root, path.join(fixture.input.extractionRoot, 'dist'));

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

test('candidate build rejects raster bytes absent from the immutable pre-build source snapshot', async () => {
  const fixture = buildFixture();
  let reads = 0;
  await assert.rejects(buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => {
      const files = minimalFiles();
      if (reads++ > 0) files[3] = file('assets/mark-abcdef12.webp', webpImageBytes('injected build payload'));
      return files;
    },
    releaseContext: releaseContext(),
    phase: 'rc-publish',
    forbiddenFragments: ['private-owner'],
    privateBindings: privateBindings(),
  }), (error) => error instanceof ArtifactValidationError && error.code === 'content_forbidden');
});

test('candidate build source-closes emitted TrueType fonts and dependency licenses', async (t) => {
  const fixture = buildFixture();
  const fontA = trueTypeBytes(['Typeface A Variable']);
  const fontB = trueTypeBytes(['Typeface B Variable']);
  const licenseA = Buffer.from('Typeface A redistribution terms');
  const licenseB = Buffer.from('Typeface B redistribution terms');
  const sourceFiles = [
    file('images/mark.webp', minimalFiles()[3].bytes),
    file('fonts/TypefaceA-Variable.ttf', fontA),
    file('fonts/TypefaceA-LICENSE.txt', licenseA),
    file('fonts/TypefaceB-Variable.ttf', fontB),
    file('fonts/TypefaceB-LICENSE.txt', licenseB),
  ];
  const generatedFiles = [
    ...minimalFiles(),
    file('assets/TypefaceA-Variable-abcdef12.ttf', fontA),
    file('assets/TypefaceA-LICENSE-abcdef12.txt', licenseA),
    file('assets/TypefaceB-Variable-abcdef12.ttf', fontB),
    file('assets/TypefaceB-LICENSE-abcdef12.txt', licenseB),
  ];
  const attempt = (generated) => {
    let reads = 0;
    return buildCandidateArtifact({
      buildInput: fixture.input,
      buildExpectation: fixture.expected,
      install: async () => {},
      build: async () => {},
      readGeneratedFiles: async () => (reads++ === 0 ? sourceFiles : generated),
      releaseContext: releaseContext(),
      phase: 'rc-publish',
      forbiddenFragments: ['private-owner'],
      privateBindings: privateBindings(),
    });
  };

  const candidate = await attempt(generatedFiles);
  for (const expected of generatedFiles.filter((entry) => /\.(?:ttf|txt)$/.test(entry.path))) {
    const retained = candidate.files.find((entry) => entry.path === expected.path);
    const manifested = candidate.manifest.entries.find((entry) => entry.path === expected.path);
    assert.ok(retained);
    assert.ok(retained.bytes.equals(expected.bytes));
    assert.deepEqual(manifested, {
      path: expected.path,
      mode: REGULAR_FILE_MODE,
      size: expected.bytes.length,
      sha256: sha256(expected.bytes),
    });
  }
  await t.test('font mismatch', async () => {
    const changed = generatedFiles.map((entry) => entry.path.startsWith('assets/TypefaceB-') && entry.path.endsWith('.ttf')
      ? file(entry.path, trueTypeBytes(['Different font']))
      : entry);
    await assert.rejects(attempt(changed), (error) => (
      error instanceof ArtifactValidationError && error.code === 'content_forbidden'
    ));
  });
  await t.test('license mismatch', async () => {
    const changed = generatedFiles.map((entry) => entry.path.startsWith('assets/TypefaceB-') && entry.path.endsWith('.txt')
      ? file(entry.path, 'different license')
      : entry);
    await assert.rejects(attempt(changed), (error) => (
      error instanceof ArtifactValidationError && error.code === 'content_forbidden'
    ));
  });
});

test('a publish-prepared artifact remains eligible for a fresh restore-phase decision', async () => {
  const fixture = buildFixture();
  const candidate = await buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => minimalFiles(),
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
    readGeneratedFiles: async () => minimalFiles(),
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
    readGeneratedFiles: async () => minimalFiles(),
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
    readGeneratedFiles: async () => leaked,
  }), (error) => error instanceof ArtifactValidationError && error.code === 'content_forbidden');
});

test('acceptance rejects changed retained bytes, manifest, template, and decision', async () => {
  const fixture = buildFixture();
  const makeCandidate = () => buildCandidateArtifact({
    buildInput: fixture.input,
    buildExpectation: fixture.expected,
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => minimalFiles(),
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
