import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  ARTIFACT_CANDIDATE_SCHEMA, REGULAR_FILE_MODE, REQUIRED_CSP, REQUIRED_FOOTER_DIGEST,
  REQUIRED_FOOTER_WORDING,
  createGitCommandEnvironment, createNpmCommandEnvironment, runDirectCommand, sha256,
} from './public-release-artifact.mjs'
import {
  APP_PERMISSION_PROFILES,
  GITHUB_API_VERSION,
  GITHUB_CONFIG_SCHEMA,
  INSTALLATION_TOKEN_ENV,
  executeFixedChildCommand,
  githubConfigIdentity,
  runPublishingChild,
} from './public-release-github.mjs'
import {
  PRIVATE_CANDIDATE_SCHEMA,
  PublicReleaseError,
  RELEASE_COMMAND_SCHEMA,
  RELEASE_CONTEXT_SCHEMA,
  dispatchReleaseCommand,
  npmPackageIdentity,
  parseReleaseCli,
  validateReleaseCommand,
} from './public-release.mjs'

const digest = (character) => `sha256:${character.repeat(64)}`
const COMMIT = 'a'.repeat(40)
const TREE = 'b'.repeat(40)
const ROOT = path.resolve('C:/trusted/zzz-workbench')
const OUTSIDE = path.resolve('C:/private-release')
const GIT = path.resolve('C:/Program Files/Git/cmd/git.exe')
const NODE = path.resolve('C:/Program Files/nodejs/node.exe')
const OTHER_NODE = path.resolve('C:/Current Node/node.exe')
const NPM = path.resolve('C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js')
const NPM_ROOT = path.dirname(path.dirname(NPM))
const TOOL_BYTES = Buffer.from('trusted-tool')
const CHILD_BYTES = Buffer.from('sealed-child-source')
const BLOB = 'c'.repeat(40)
const CURRENT_CHILD_BYTES = Buffer.from('current-security-fixed-child-source')
const CURRENT_BLOB = 'f'.repeat(40)
const { privateKey: releasePrivateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const RELEASE_PEM = releasePrivateKey.export({ type: 'pkcs8', format: 'pem' })
const RELEASE_TOKEN = `ghs_${'a'.repeat(180)}`
const external = (name) => path.join(OUTSIDE, name)
const baseToolIdentity = (toolPath) => ({
  path: toolPath, realPath: toolPath, digest: `sha256:${sha256(TOOL_BYTES)}`,
})
const boundNpmIdentity = () => ({
  ...baseToolIdentity(NPM),
  packageRoot: NPM_ROOT,
  packageFileCount: 3,
  packageTreeDigest: digest('5'),
})

const webpImageBytes = () => {
  const image = Buffer.from('pixels')
  const chunk = Buffer.alloc(8 + image.length + (image.length % 2))
  chunk.write('VP8 ', 0, 'ascii')
  chunk.writeUInt32LE(image.length, 4)
  image.copy(chunk, 8)
  const payload = Buffer.concat([Buffer.from('WEBP'), chunk])
  const bytes = Buffer.alloc(8 + payload.length)
  bytes.write('RIFF', 0, 'ascii')
  bytes.writeUInt32LE(payload.length, 4)
  payload.copy(bytes, 8)
  return bytes
}

const sourceRasterFiles = () => [{
  path: 'equipment/mark.webp', mode: REGULAR_FILE_MODE, bytes: webpImageBytes(),
}]

const generatedPublicFiles = () => [
  { path: '.nojekyll', mode: REGULAR_FILE_MODE, bytes: Buffer.alloc(0) },
  {
    path: 'index.html', mode: REGULAR_FILE_MODE,
    bytes: Buffer.from(`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${REQUIRED_CSP}"><link rel="stylesheet" href="/assets/app-abcdef12.css"></head><body><div id="root"></div><script type="module" src="/assets/app-abcdef12.js"></script></body></html>`),
  },
  {
    path: 'assets/app-abcdef12.js', mode: REGULAR_FILE_MODE,
    bytes: Buffer.from(`document.querySelector("#root").textContent="ready";${REQUIRED_FOOTER_WORDING.join('')}`),
  },
  { path: 'assets/app-abcdef12.css', mode: REGULAR_FILE_MODE, bytes: Buffer.from('.app{display:block}') },
  { path: 'assets/mark-abcdef12.webp', mode: REGULAR_FILE_MODE, bytes: webpImageBytes() },
]

const config = (forbiddenPrivateIdentifiers = ['private-owner', 'private-repository']) => ({
  schema: GITHUB_CONFIG_SCHEMA,
  apiVersion: GITHUB_API_VERSION,
  destination: { owner: 'neutral-workbench', repository: 'neutral-workbench.github.io', branch: 'main' },
  apps: {
    bootstrap: {
      appId: 101, installationId: 201, owner: 'neutral-workbench',
      botLogin: 'neutral-bootstrap[bot]', keyPath: external('bootstrap.pem'),
    },
    publisher: {
      appId: 102, installationId: 202, owner: 'neutral-workbench',
      botLogin: 'neutral-publisher[bot]', keyPath: external('publisher.pem'),
    },
  },
  allowedPublicActors: ['neutral-bootstrap[bot]', 'neutral-publisher[bot]', 'github-pages[bot]'],
  forbiddenPrivateIdentifiers,
})

const files = () => [{ path: '.nojekyll', mode: REGULAR_FILE_MODE, bytes: Buffer.alloc(0) }]
const candidate = (forbiddenFragments = [
  'private-owner', 'private-repository', ROOT.toLowerCase(), ROOT.toLowerCase().replaceAll('\\', '/'),
  GIT.toLowerCase(), GIT.toLowerCase().replaceAll('\\', '/'),
]) => ({
  schema: ARTIFACT_CANDIDATE_SCHEMA,
  files: files(),
  manifest: { treeDigest: digest('1'), manifestDigest: digest('2'), entries: [] },
  expectation: {
    source: { commitSha: COMMIT, treeSha: TREE },
    sourceContext: {
      controllerRoot: ROOT,
      repositoryRoot: ROOT,
      expectedRemoteUrl: 'git@github.com:private-owner/private-repository.git',
      github: githubConfigIdentity(config()),
      tools: {
        git: baseToolIdentity(GIT),
        node: baseToolIdentity(NODE),
        npm: boundNpmIdentity(),
      },
      publishingChild: {
        path: 'scripts/github-app/public-release-github.mjs', blobSha: BLOB,
        digest: `sha256:${sha256(CHILD_BYTES)}`,
      },
    },
    admission: { forbiddenFragments: [...new Set(forbiddenFragments)].sort() },
    build: { nodeVersion: 'v24.19.0', lockfileSha256: digest('3') },
    artifact: {
      identityVersion: 'zzz-workbench-public-artifact/v1', digestAlgorithm: 'sha256',
      treeDigest: digest('1'), manifestDigest: digest('2'), footerDigest: REQUIRED_FOOTER_DIGEST,
    },
    operatorUseModel: { purpose: 'non-commercial' },
    guidance: [{ id: 'guide', digest: digest('4') }],
  },
  template: {},
  admission: {
    forbiddenFragments: [...new Set(forbiddenFragments)].sort(),
    inertExternalUrlExceptions: [],
    inertRuntimeApiExceptions: [],
  },
})

const encodedCandidate = (value = candidate()) => ({
  schema: PRIVATE_CANDIDATE_SCHEMA,
  candidate: {
    ...value,
    files: value.files.map((file) => ({
      path: file.path, mode: file.mode, contentBase64: file.bytes.toString('base64'),
    })),
  },
})

const trustedController = (head = COMMIT) => {
  const retained = candidate()
  return {
    schema: 'zzz-workbench-public-release-trusted-controller/v1',
    source: { commitSha: head, treeSha: head === COMMIT ? TREE : 'd'.repeat(40) },
    sourceContext: {
      ...retained.expectation.sourceContext,
      publishingChild: head === COMMIT ? retained.expectation.sourceContext.publishingChild : {
        ...retained.expectation.sourceContext.publishingChild,
        blobSha: CURRENT_BLOB,
        digest: `sha256:${sha256(CURRENT_CHILD_BYTES)}`,
      },
    },
  }
}

const pathsFor = (kind) => {
  if (kind === 'prepare') return {
    candidate: external('candidate.json'),
    decisionTemplate: external('decision-template.json'),
    extractionRoot: external('extract'),
    gitExecutable: GIT,
    npmCli: NPM,
    releaseContext: external('release-context.json'),
    githubConfig: external('github.json'),
    repositoryRoot: ROOT,
    trustedController: external('trusted-controller.json'),
  }
  if (kind === 'disable-pages') return {
    githubConfig: external('github.json'),
    trustedController: external('trusted-controller.json'),
    incidentConfirmation: external('incident-confirmation.json'),
    operationDirectory: external('operations'),
  }
  return {
    candidate: external('candidate.json'),
    decision: external('decision.json'),
    ...(kind === 'restore' ? { trustedController: external('trusted-controller.json') } : {}),
    githubConfig: external('github.json'),
    operationDirectory: external('operations'),
  }
}

const command = (kind, paths = pathsFor(kind)) => ({ schema: RELEASE_COMMAND_SCHEMA, kind, paths })

function jsonReader(values) {
  return async (filePath) => {
    const key = path.basename(filePath)
    if (!Object.hasOwn(values, key)) throw new Error(`unexpected read: ${filePath}`)
    const value = values[key]
    return Buffer.isBuffer(value) ? value : JSON.stringify(value)
  }
}

function emptyDirectoryFs() {
  return {
    async lstat() { return { isDirectory: () => true, isSymbolicLink: () => false } },
    async readdir() { return [] },
    async realpath(value) { return value },
  }
}

function missingPathFs(missingPath) {
  return {
    ...emptyDirectoryFs(),
    async lstat(value) {
      if (value === missingPath) {
        const error = new Error(`ENOENT: ${value}`)
        error.code = 'ENOENT'
        throw error
      }
      return { isDirectory: () => true, isSymbolicLink: () => false }
    },
  }
}

function trustedGitRunner({ dirty = false, remote = 'git@github.com:private-owner/private-repository.git', head = COMMIT } = {}) {
  return async (request) => {
    assert.equal(request.executable, GIT)
    assert.equal(request.cwd, ROOT)
    assert.equal(request.shell, false)
    assert.deepEqual(request.env, createGitCommandEnvironment(GIT))
    const key = request.args.join(' ')
    const line = (value) => ({ stdout: Buffer.from(`${value}\n`), stderr: Buffer.alloc(0) })
    if (key === 'rev-parse --show-toplevel') return line(ROOT)
    if (key === 'status --porcelain=v1 --untracked-files=all') {
      return dirty ? line(' M src/App.tsx') : { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }
    }
    if (key === 'branch --show-current') return line('main')
    if (key === 'rev-parse --verify HEAD') return line(head)
    if (key === 'rev-parse --verify refs/remotes/origin/main') return line(head)
    if (key === 'remote get-url origin') return line(remote)
    if (key === 'rev-parse --verify HEAD^{tree}') return line(head === COMMIT ? TREE : 'd'.repeat(40))
    if (key === `rev-parse --verify ${COMMIT}^{commit}`) return line(COMMIT)
    if (key === `rev-parse --verify ${COMMIT}^{tree}`) return line(TREE)
    if (key === `rev-parse --verify ${head}^{commit}`) return line(head)
    if (key === `rev-parse --verify ${head}^{tree}`) return line(head === COMMIT ? TREE : 'd'.repeat(40))
    if (key === `rev-parse --verify ${head}:scripts/github-app/public-release-github.mjs`) {
      return line(head === COMMIT ? BLOB : CURRENT_BLOB)
    }
    if (key === `merge-base --is-ancestor ${head} ${head}`
        || key === `merge-base --is-ancestor ${COMMIT} ${head}`) return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }
    if (key === `cat-file blob ${BLOB}`) return { stdout: CHILD_BYTES, stderr: Buffer.alloc(0) }
    if (key === `cat-file blob ${CURRENT_BLOB}`) return { stdout: CURRENT_CHILD_BYTES, stderr: Buffer.alloc(0) }
    throw new Error(`unexpected git call: ${key}`)
  }
}

function mutationDependencies({
  retained = candidate(), githubConfig = config(), gitRunner = trustedGitRunner(),
  trusted = trustedController(), child,
} = {}) {
  const fixedInputs = []
  const inputs = jsonReader({
    'candidate.json': encodedCandidate(retained),
    'decision.json': {},
    'github.json': githubConfig,
    'trusted-controller.json': trusted,
  })
  return {
    fixedInputs,
    dependencies: {
      controllerRoot: ROOT,
      fsImpl: emptyDirectoryFs(),
      nodeExecutable: NODE,
      readFile: async (filePath, ...args) => [GIT, NODE, NPM].includes(filePath) ? TOOL_BYTES : inputs(filePath, ...args),
      writeFile: async (_filePath, raw) => { fixedInputs.push(JSON.parse(raw)) },
      gitRunner,
      npmPackageIdentity: async () => boundNpmIdentity(),
      acceptPreparedArtifact: async ({ candidate: accepted, phase, onAccepted }) => {
        assert.ok(['bootstrap', 'publish', 'restore'].includes(phase))
        return onAccepted({ files: accepted.files, manifest: accepted.manifest })
      },
      runPublishingChild: child ?? (async ({ preflight, childSource, nodeExecutable }) => {
        assert.deepEqual(childSource, CHILD_BYTES)
        assert.equal(nodeExecutable, NODE)
        const fixed = fixedInputs.at(-1)
        assert.equal(await preflight(fixed), true)
        return { state: fixed.operation === 'bootstrap' ? 'bootstrapped' : 'published' }
      }),
    },
  }
}

test('CLI exposes only prepare, bootstrap, publish, restore, and disable-pages', () => {
  for (const kind of ['prepare', 'bootstrap', 'publish', 'restore', 'disable-pages']) {
    assert.equal(parseReleaseCli([kind, '--input-file', external(`${kind}.json`)]).kind, kind)
    assert.equal(validateReleaseCommand(command(kind)).kind, kind)
  }
  for (const legacy of ['status', 'verify-rc', 'verify-dormant', 'verify-beta', 'rebuild-origin']) {
    assert.throws(() => parseReleaseCli([legacy, '--input-file', external(`${legacy}.json`)]), PublicReleaseError)
    assert.throws(() => validateReleaseCommand(command(legacy)), PublicReleaseError)
  }
})

test('mutation schema has no caller Node executable, snapshot, or expected tip', () => {
  const publish = command('publish')
  assert.deepEqual(Object.keys(publish.paths).sort(), ['candidate', 'decision', 'githubConfig', 'operationDirectory'])
  assert.throws(() => validateReleaseCommand({
    ...publish,
    paths: { ...publish.paths, nodeExecutable: process.execPath },
  }), /schema is invalid/)
  assert.deepEqual(Object.keys(command('restore').paths).sort(), [
    'candidate', 'decision', 'githubConfig', 'operationDirectory', 'trustedController',
  ])
  assert.throws(() => validateReleaseCommand({
    ...command('restore'),
    paths: { ...command('restore').paths, gitExecutable: GIT },
  }), /schema is invalid/)
  assert.throws(() => validateReleaseCommand({
    ...publish,
    paths: { ...publish.paths, snapshot: external('snapshot.json') },
  }), /schema is invalid/)
})

test('prepare accepts only bootstrap, publish, or restore and binds the extracted Git executable', async () => {
  const lockfile = Buffer.from('lock')
  const writes = []
  const context = {
    schema: RELEASE_CONTEXT_SCHEMA,
    phase: 'publish',
    expectedRemoteUrl: 'git@github.com:private-owner/private-repository.git',
    footerDigest: REQUIRED_FOOTER_DIGEST,
    lockfileSha256: `sha256:${sha256(lockfile)}`,
    operatorUseModel: { purpose: 'non-commercial' },
    guidance: [{ id: 'guide', digest: digest('4') }],
    admission: {
      forbiddenFragments: ['private-owner', 'private-repository'],
      inertExternalUrlExceptions: [], inertRuntimeApiExceptions: [],
    },
  }
  const toolCalls = []
  const artifactReads = []
  const result = await dispatchReleaseCommand(command('prepare'), {
    controllerRoot: ROOT,
    nodeExecutable: NODE,
    now: () => Date.parse('2026-09-07T12:05:00.000Z'),
    fsImpl: missingPathFs(config().apps.bootstrap.keyPath),
    readFile: async (filePath) => {
      if ([GIT, NODE, NPM].includes(filePath)) return TOOL_BYTES
      if (filePath.endsWith('public-release-github.mjs')) return CHILD_BYTES
      return jsonReader({ 'release-context.json': context, 'package-lock.json': lockfile, 'github.json': config() })(filePath)
    },
    writeFile: async (_filePath, value) => { writes.push(value) },
    extractImmutableGitSource: async () => ({
      branch: 'main',
      controllerRoot: ROOT,
      extractedPaths: ['index.html', 'package-lock.json', 'package.json', 'src/main.tsx'],
      extractedTreeSha: TREE,
      extractionRoot: external('extract'),
      gitExecutable: GIT,
      gitStatus: '',
      headSha: COMMIT,
      lockfilePath: path.join(external('extract'), 'package-lock.json'),
      nodeVersion: 'v24.19.0',
      originMainSha: COMMIT,
      remoteUrl: context.expectedRemoteUrl,
      repositoryRoot: ROOT,
      sourceTreeSha: TREE,
    }),
    gitRunner: async () => ({ stdout: Buffer.from(`${BLOB}\n`), stderr: Buffer.alloc(0) }),
    npmPackageIdentity: async () => boundNpmIdentity(),
    toolRunner: async (request) => { toolCalls.push(request) },
    readArtifactTree: async (root) => {
      artifactReads.push(root)
      if (root === path.join(external('extract'), 'src', 'assets')) return sourceRasterFiles()
      if (root === path.join(external('extract'), 'dist')) return generatedPublicFiles()
      throw new Error(`Unexpected release tree: ${root}`)
    },
  })
  assert.equal(result.nextCommand, 'publish')
  assert.equal(writes.length, 3)
  const prepared = JSON.parse(writes[0])
  assert.equal(prepared.candidate.expectation.sourceContext.tools.git.path, GIT)
  assert.deepEqual(prepared.candidate.expectation.sourceContext.github, githubConfigIdentity(config()))
  assert.equal(prepared.candidate.expectation.sourceContext.publishingChild.blobSha, BLOB)
  assert.equal(prepared.candidate.expectation.sourceContext.tools.node.path, NODE)
  assert.deepEqual(prepared.candidate.expectation.sourceContext.tools.npm, boundNpmIdentity())
  assert.deepEqual(toolCalls.map(({ executable, args, shell }) => ({ executable, args, shell })), [
    { executable: NODE, args: [NPM, 'ci', '--ignore-scripts'], shell: false },
    { executable: NODE, args: [NPM, 'run', 'build'], shell: false },
  ])
  assert.deepEqual(artifactReads, [
    path.join(external('extract'), 'src', 'assets'),
    path.join(external('extract'), 'dist'),
  ])
  assert.ok(toolCalls.every(({ env }) => JSON.stringify(env) === JSON.stringify(createNpmCommandEnvironment(NODE, external('extract')))))
  assert.ok(toolCalls.every(({ env }) => (
    env.NPM_CONFIG_USERCONFIG === (process.platform === 'win32' ? 'NUL' : '/dev/null')
    && env.NPM_CONFIG_GLOBALCONFIG === (process.platform === 'win32' ? 'NUL.global' : '/dev/null')
  )))
  assert.equal(JSON.parse(writes[2]).schema, 'zzz-workbench-public-release-trusted-controller/v1')

  await assert.rejects(dispatchReleaseCommand(command('prepare'), {
    controllerRoot: ROOT,
    fsImpl: emptyDirectoryFs(),
    readFile: jsonReader({
      'release-context.json': { ...context, phase: 'rebuild-origin' },
    }),
  }), /phase is invalid/)

  await assert.rejects(dispatchReleaseCommand(command('prepare'), {
    controllerRoot: ROOT,
    fsImpl: missingPathFs(config().apps.publisher.keyPath),
    readFile: jsonReader({ 'release-context.json': context, 'github.json': config() }),
  }), (error) => error instanceof PublicReleaseError && error.code === 'external_path_required')
})

test('sealed Node executes an absolute npm-cli.js entry without a command shell', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-npm-cli-'))
  const npmCli = path.join(temporary, 'npm-cli.js')
  const preload = path.join(temporary, 'ambient-preload.cjs')
  const marker = path.join(temporary, 'ambient-marker.txt')
  await fs.writeFile(preload, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed')`)
  await fs.writeFile(npmCli, `process.stdout.write(JSON.stringify({
    args: process.argv.slice(2),
    nodeOptions: process.env.NODE_OPTIONS ?? null,
    privateValue: process.env.ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH ?? null,
  }))`)
  const originalNodeOptions = process.env.NODE_OPTIONS
  const originalPrivateValue = process.env.ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH
  process.env.NODE_OPTIONS = `--require=${preload}`
  process.env.ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH = 'private-key-path'
  try {
    const result = await runDirectCommand({
      executable: process.execPath,
      args: [npmCli, 'ci', '--ignore-scripts'],
      cwd: temporary,
      shell: false,
      env: createNpmCommandEnvironment(process.execPath, temporary),
    })
    assert.deepEqual(JSON.parse(result.stdout.toString('utf8')), {
      args: ['ci', '--ignore-scripts'], nodeOptions: null, privateValue: null,
    })
    await assert.rejects(fs.stat(marker), { code: 'ENOENT' })
  } finally {
    if (originalNodeOptions === undefined) delete process.env.NODE_OPTIONS
    else process.env.NODE_OPTIONS = originalNodeOptions
    if (originalPrivateValue === undefined) delete process.env.ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH
    else process.env.ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH = originalPrivateValue
    await fs.rm(temporary, { recursive: true, force: true })
  }
})

test('Windows command environments bind the actual runtime root independently of tool drives', () => {
  const options = {
    platform: 'win32',
    runtimeEnvironment: {
      SystemRoot: 'C:\\Windows',
      WINDIR: 'c:\\windows',
      ComSpec: 'C:\\Windows\\System32\\cmd.exe',
    },
  }
  const npmEnvironment = createNpmCommandEnvironment(
    'D:\\nodejs\\node.exe',
    'E:\\release\\candidate',
    options,
  )
  assert.equal(npmEnvironment.PATH, 'D:\\nodejs')
  assert.equal(npmEnvironment.SystemRoot, 'C:\\Windows')
  assert.equal(npmEnvironment.NPM_CONFIG_SCRIPT_SHELL, 'C:\\Windows\\System32\\cmd.exe')
  assert.equal(npmEnvironment.NPM_CONFIG_CACHE, 'E:\\release\\candidate\\.npm-cache')
  assert.equal(npmEnvironment.NPM_CONFIG_USERCONFIG, 'NUL')
  assert.equal(npmEnvironment.NPM_CONFIG_GLOBALCONFIG, 'NUL.global')
  assert.notEqual(npmEnvironment.NPM_CONFIG_USERCONFIG, npmEnvironment.NPM_CONFIG_GLOBALCONFIG)

  const gitEnvironment = createGitCommandEnvironment('F:\\Git\\cmd\\git.exe', options)
  assert.equal(gitEnvironment.PATH, 'F:\\Git\\cmd')
  assert.equal(gitEnvironment.ComSpec, 'C:\\Windows\\System32\\cmd.exe')
  assert.throws(() => createNpmCommandEnvironment('D:\\nodejs\\node.exe', 'E:\\release', {
    ...options,
    runtimeEnvironment: { ...options.runtimeEnvironment, ComSpec: 'D:\\Windows\\System32\\cmd.exe' },
  }), /does not match SystemRoot/)
})

test('npm identity seals the complete package tree loaded by npm-cli.js', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-npm-package-'))
  const packageRoot = path.join(temporary, 'npm')
  const bin = path.join(packageRoot, 'bin')
  const lib = path.join(packageRoot, 'lib')
  await fs.mkdir(bin, { recursive: true })
  await fs.mkdir(lib, { recursive: true })
  const npmCli = path.join(bin, 'npm-cli.js')
  const cli = path.join(lib, 'cli.js')
  await fs.writeFile(npmCli, "import '../lib/cli.js'")
  await fs.writeFile(cli, 'export const value = 1')
  await fs.writeFile(path.join(packageRoot, 'package.json'), '{"name":"npm"}')
  const dependencies = { controllerRoot: ROOT, fsImpl: fs, readFile: fs.readFile }
  try {
    const sealed = await npmPackageIdentity(npmCli, dependencies)
    assert.equal(sealed.packageRoot, packageRoot)
    assert.equal(sealed.packageFileCount, 3)
    await fs.writeFile(cli, 'export const value = 2')
    const changed = await npmPackageIdentity(npmCli, dependencies)
    assert.equal(changed.digest, sealed.digest)
    assert.notEqual(changed.packageTreeDigest, sealed.packageTreeDigest)
  } finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
})

test('bootstrap, publish, and restore revalidate decision-bound clean main before key access', async () => {
  for (const phase of ['bootstrap', 'publish', 'restore']) {
    const { fixedInputs, dependencies } = mutationDependencies()
    const result = await dispatchReleaseCommand(command(phase), dependencies)
    assert.equal(fixedInputs.length, 1)
    assert.equal(fixedInputs[0].operation, phase === 'bootstrap' ? 'bootstrap' : 'publish')
    assert.equal(result.state, phase === 'restore' ? 'restored' : fixedInputs[0].operation === 'bootstrap' ? 'bootstrapped' : 'published')
  }
})

test('each release phase requires only its active GitHub App key', async () => {
  for (const [phase, activeRole, inactiveRole] of [
    ['bootstrap', 'bootstrap', 'publisher'],
    ['publish', 'publisher', 'bootstrap'],
    ['restore', 'publisher', 'bootstrap'],
  ]) {
    const githubConfig = config()
    const inactiveKey = githubConfig.apps[inactiveRole].keyPath
    const accepted = mutationDependencies({ githubConfig })
    accepted.dependencies.fsImpl = missingPathFs(inactiveKey)
    await dispatchReleaseCommand(command(phase), accepted.dependencies)

    const activeKey = githubConfig.apps[activeRole].keyPath
    const rejected = mutationDependencies({ githubConfig })
    rejected.dependencies.fsImpl = missingPathFs(activeKey)
    await assert.rejects(dispatchReleaseCommand(command(phase), rejected.dependencies), (error) => (
      error instanceof PublicReleaseError && error.code === 'external_path_required'
    ))
    assert.equal(rejected.fixedInputs.length, 0)
  }
})

test('restore accepts historical candidate A after clean current main advances to B', async () => {
  const current = 'e'.repeat(40)
  let executedChild
  const { dependencies } = mutationDependencies({
    gitRunner: trustedGitRunner({ head: current }),
    trusted: trustedController(current),
    child: async ({ childSource, nodeExecutable }) => {
      executedChild = childSource
      assert.equal(nodeExecutable, NODE)
      return { state: 'published' }
    },
  })
  const result = await dispatchReleaseCommand(command('restore'), dependencies)
  assert.equal(result.state, 'restored')
  assert.deepEqual(executedChild, CURRENT_CHILD_BYTES)
  assert.notDeepEqual(executedChild, CHILD_BYTES)
})

test('restore rejects a modified current-controller seal before child or key access', async () => {
  const trusted = trustedController()
  trusted.sourceContext.tools.git.digest = digest('9')
  let childRuns = 0
  const fixture = mutationDependencies({
    trusted,
    child: async () => { childRuns += 1 },
  })
  await assert.rejects(dispatchReleaseCommand(command('restore'), fixture.dependencies), /tool identity/)
  assert.equal(childRuns, 0)
})

test('dirty or mismatched trusted main fails inside preflight before key read', async () => {
  for (const gitRunner of [
    trustedGitRunner({ dirty: true }),
    trustedGitRunner({ remote: 'git@github.com:other/repository.git' }),
  ]) {
    let keyReads = 0
    const fixture = mutationDependencies({
      gitRunner,
      child: async ({ preflight, loadPrivateKey }) => {
        const fixed = fixture.fixedInputs.at(-1)
        await preflight(fixed)
        keyReads += 1
        await loadPrivateKey(config().apps.publisher.keyPath)
        return { state: 'published' }
      },
    })
    await assert.rejects(dispatchReleaseCommand(command('publish'), fixture.dependencies), /trusted exact main/)
    assert.equal(keyReads, 0)
  }
})

test('operation paths cannot enter the repository through a symlinked ancestor', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-operation-redirect-'))
  const repositoryRoot = path.join(temporary, 'repository')
  const externalRoot = path.join(temporary, 'external')
  const redirectedRoot = path.join(temporary, 'redirected')
  const actualOperations = path.join(repositoryRoot, 'operations')
  try {
    await fs.mkdir(actualOperations, { recursive: true })
    await fs.mkdir(externalRoot)
    try {
      await fs.symlink(repositoryRoot, redirectedRoot, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'UNKNOWN'].includes(error.code)) return
      throw error
    }
    for (const name of ['candidate.json', 'decision.json', 'github.json', 'bootstrap.pem', 'publisher.pem']) {
      await fs.writeFile(path.join(externalRoot, name), '')
    }
    const githubConfig = config()
    githubConfig.apps.bootstrap.keyPath = path.join(externalRoot, 'bootstrap.pem')
    githubConfig.apps.publisher.keyPath = path.join(externalRoot, 'publisher.pem')
    const fixture = mutationDependencies({ githubConfig })
    fixture.dependencies.controllerRoot = repositoryRoot
    fixture.dependencies.fsImpl = fs
    await assert.rejects(dispatchReleaseCommand(command('publish', {
      candidate: path.join(externalRoot, 'candidate.json'),
      decision: path.join(externalRoot, 'decision.json'),
      githubConfig: path.join(externalRoot, 'github.json'),
      operationDirectory: path.join(redirectedRoot, 'operations'),
    }), fixture.dependencies), (error) => (
      error instanceof PublicReleaseError && error.code === 'external_path_required'
    ))
    assert.equal((await fs.readdir(actualOperations)).length, 0)
  } finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
})

test('prepare output paths cannot enter the repository through a symlinked ancestor', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-output-redirect-'))
  const repositoryRoot = path.join(temporary, 'repository')
  const redirectedRoot = path.join(temporary, 'redirected')
  const actualOutputs = path.join(repositoryRoot, 'outputs')
  try {
    await fs.mkdir(actualOutputs, { recursive: true })
    try {
      await fs.symlink(repositoryRoot, redirectedRoot, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'UNKNOWN'].includes(error.code)) return
      throw error
    }
    await assert.rejects(dispatchReleaseCommand(command('prepare', {
      ...pathsFor('prepare'),
      repositoryRoot,
      candidate: path.join(redirectedRoot, 'outputs', 'candidate.json'),
    }), {
      controllerRoot: repositoryRoot,
      fsImpl: fs,
    }), (error) => error instanceof PublicReleaseError && error.code === 'external_path_required')
    assert.deepEqual(await fs.readdir(actualOutputs), [])
  } finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
})

test('every configured private identifier must be present in the candidate-bound denylist', async () => {
  let keyReads = 0
  const retained = candidate(['private-owner', ROOT.toLowerCase(), GIT.toLowerCase()])
  const fixture = mutationDependencies({
    retained,
    child: async ({ preflight, loadPrivateKey }) => {
      const fixed = fixture.fixedInputs.at(-1)
      await preflight(fixed)
      keyReads += 1
      await loadPrivateKey(config().apps.publisher.keyPath)
      return { state: 'published' }
    },
  })
  await assert.rejects(dispatchReleaseCommand(command('publish'), fixture.dependencies), /denylist/)
  assert.equal(keyReads, 0)
})

test('tool or canonical GitHub configuration drift fails before key access', async () => {
  const changedConfig = config()
  changedConfig.allowedPublicActors = [...changedConfig.allowedPublicActors, 'neutral-ops[bot]']
  for (const mode of ['tool', 'npm-tree', 'config']) {
    let keyReads = 0
    const fixture = mutationDependencies({ githubConfig: mode === 'config' ? changedConfig : config() })
    if (mode === 'tool') {
      const baseRead = fixture.dependencies.readFile
      fixture.dependencies.readFile = async (filePath, ...args) => filePath === NODE ? Buffer.from('replaced-tool') : baseRead(filePath, ...args)
    }
    if (mode === 'npm-tree') {
      fixture.dependencies.npmPackageIdentity = async () => ({
        ...boundNpmIdentity(), packageTreeDigest: digest('9'),
      })
    }
    fixture.dependencies.runPublishingChild = async ({ preflight, loadPrivateKey }) => {
      await preflight(fixture.fixedInputs.at(-1))
      keyReads += 1
      await loadPrivateKey(config().apps.publisher.keyPath)
    }
    await assert.rejects(dispatchReleaseCommand(command('publish'), fixture.dependencies))
    assert.equal(keyReads, 0)
  }
})

test('a controller running under a different Node identity fails before key access', async () => {
  let childRuns = 0
  const fixture = mutationDependencies()
  fixture.dependencies.nodeExecutable = OTHER_NODE
  const baseRead = fixture.dependencies.readFile
  fixture.dependencies.readFile = async (filePath, ...args) => (
    filePath === OTHER_NODE ? TOOL_BYTES : baseRead(filePath, ...args)
  )
  fixture.dependencies.runPublishingChild = async () => { childRuns += 1 }
  await assert.rejects(dispatchReleaseCommand(command('publish'), fixture.dependencies), /Node identity/)
  assert.equal(childRuns, 0)
})

test('publish sends no snapshot-derived or caller-supplied expected tip to the child', async () => {
  const { fixedInputs, dependencies } = mutationDependencies()
  let observedSpec
  dependencies.runPublishingChild = async (spec) => {
    observedSpec = spec
    assert.equal(await spec.preflight(fixedInputs.at(-1)), true)
    return { state: 'published' }
  }
  await dispatchReleaseCommand(command('publish'), dependencies)
  assert.deepEqual(Object.keys(fixedInputs[0].payload).sort(), ['artifactTreeDigest', 'files'])
  assert.equal(Object.hasOwn(fixedInputs[0].payload, 'expectedTip'), false)
  assert.equal(observedSpec.nodeExecutable, NODE)
})

test('post-preflight checkout replacement cannot become credentialed child code', async () => {
  const { fixedInputs, dependencies } = mutationDependencies()
  const checkoutChild = path.join(ROOT, 'scripts', 'github-app', 'public-release-github.mjs')
  const baseRead = dependencies.readFile
  let checkoutReads = 0
  dependencies.readFile = async (filePath, ...args) => {
    if (filePath === checkoutChild) { checkoutReads += 1; return Buffer.from('malicious replacement') }
    return baseRead(filePath, ...args)
  }
  dependencies.runPublishingChild = async ({ preflight, childSource }) => {
    assert.equal(await preflight(fixedInputs.at(-1)), true)
    assert.deepEqual(childSource, CHILD_BYTES)
    return { state: 'published' }
  }
  await dispatchReleaseCommand(command('publish'), dependencies)
  assert.equal(checkoutReads, 0)
})

test('stop authority can only disable Pages and never dispatch repository deletion', async () => {
  const fixedInputs = []
  let gitCalls = 0
  const identity = githubConfigIdentity(config())
  const trusted = {
    schema: 'zzz-workbench-public-release-trusted-controller/v1',
    source: candidate().expectation.source,
    sourceContext: candidate().expectation.sourceContext,
  }
  const confirmation = {
    schema: 'zzz-workbench-public-release-disable-confirmation/v1',
    action: 'disable-pages',
    confirmedAt: '2026-09-07T12:00:00.000Z',
    controllerCommit: COMMIT,
    destination: identity.destination,
    githubConfigDigest: identity.digest,
  }
  const inputs = jsonReader({
    'github.json': config(), 'trusted-controller.json': trusted, 'incident-confirmation.json': confirmation,
  })
  const result = await dispatchReleaseCommand(command('disable-pages'), {
    controllerRoot: ROOT,
    nodeExecutable: NODE,
    now: () => Date.parse('2026-09-07T12:05:00.000Z'),
    fsImpl: emptyDirectoryFs(),
    readFile: async (filePath) => [GIT, NODE, NPM].includes(filePath) ? TOOL_BYTES : inputs(filePath),
    writeFile: async (_filePath, raw) => { fixedInputs.push(JSON.parse(raw)) },
    gitRunner: async (request) => { gitCalls += 1; return trustedGitRunner()(request) },
    npmPackageIdentity: async () => boundNpmIdentity(),
    runPublishingChild: async ({ preflight, childSource }) => {
      assert.equal(await preflight(fixedInputs[0]), true)
      assert.deepEqual(childSource, CHILD_BYTES)
      return { disabled: true }
    },
  })
  assert.deepEqual(fixedInputs.map((value) => value.operation), ['disable-pages'])
  assert.ok(gitCalls > 0)
  assert.equal(result.state, 'pages-disabled')
  assert.throws(() => validateReleaseCommand(command('rebuild-origin')), PublicReleaseError)
})

test('disable-pages composes controller routing, both authorized App postures, stop-only minting, and cleanup', async () => {
  for (const installationPermissions of [APP_PERMISSION_PROFILES.bootstrap, APP_PERMISSION_PROFILES.stop]) {
    const operationDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-stop-'))
    const identity = githubConfigIdentity(config())
    const trusted = {
      schema: 'zzz-workbench-public-release-trusted-controller/v1',
      source: candidate().expectation.source,
      sourceContext: candidate().expectation.sourceContext,
    }
    const confirmation = {
      schema: 'zzz-workbench-public-release-disable-confirmation/v1',
      action: 'disable-pages',
      confirmedAt: '2026-09-07T12:00:00.000Z',
      controllerCommit: COMMIT,
      destination: identity.destination,
      githubConfigDigest: identity.digest,
    }
    const inputs = jsonReader({
      'github.json': config(), 'trusted-controller.json': trusted, 'incident-confirmation.json': confirmation,
    })
    const calls = []
    let pagesEnabled = true
    const response = (body, status = 200) => ({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => null },
      async json() { return body },
    })
    const fetchImpl = async (url, init) => {
      calls.push({ url, method: init.method, body: init.body })
      if (url.endsWith('/app')) {
        return response({ id: 101, slug: 'neutral-bootstrap', owner: { login: 'neutral-workbench' } })
      }
      if (url.endsWith('/app/installations/201')) {
        return response({
          id: 201, app_id: 101, account: { login: 'neutral-workbench' },
          repository_selection: 'all', permissions: installationPermissions,
        })
      }
      if (url.endsWith('/access_tokens')) {
        return response({
          token: RELEASE_TOKEN,
          expires_at: '2099-09-07T01:00:00Z',
          permissions: APP_PERMISSION_PROFILES.stop,
        })
      }
      if (url.includes('/installation/repositories')) {
        return response({
          total_count: 1,
          repositories: [{ full_name: 'neutral-workbench/neutral-workbench.github.io' }],
        })
      }
      if (url.endsWith('/repos/neutral-workbench/neutral-workbench.github.io/pages')) {
        if (init.method === 'DELETE') {
          pagesEnabled = false
          return response(null, 204)
        }
        return pagesEnabled ? response({ status: 'built' }) : response({}, 404)
      }
      if (url.endsWith('/installation/token') && init.method === 'DELETE') return response(null, 204)
      throw new Error(`unexpected GitHub request: ${init.method} ${url}`)
    }
    try {
      const result = await dispatchReleaseCommand(command('disable-pages', {
        ...pathsFor('disable-pages'), operationDirectory,
      }), {
        controllerRoot: ROOT,
        nodeExecutable: NODE,
        now: () => Date.parse('2026-09-07T12:05:00.000Z'),
        fsImpl: emptyDirectoryFs(),
        readFile: async (filePath) => {
          if (filePath === config().apps.bootstrap.keyPath) return RELEASE_PEM
          if ([GIT, NODE, NPM].includes(filePath)) return TOOL_BYTES
          return inputs(filePath)
        },
        writeFile: fs.writeFile,
        gitRunner: trustedGitRunner(),
        npmPackageIdentity: async () => boundNpmIdentity(),
        fetchImpl,
        runPublishingChild,
        childRunner: async (spec) => {
          const fixed = JSON.parse(await fs.readFile(spec.inputFile, 'utf8'))
          const childResult = await executeFixedChildCommand({
            command: fixed,
            token: spec.env[INSTALLATION_TOKEN_ENV],
            fetchImpl,
          })
          return {
            exitCode: childResult.ok ? 0 : 1,
            signal: null,
            stdout: JSON.stringify(childResult),
          }
        },
      })
      assert.equal(result.state, 'pages-disabled')
      const mint = calls.find(({ url }) => url.endsWith('/access_tokens'))
      assert.deepEqual(JSON.parse(mint.body).permissions, APP_PERMISSION_PROFILES.stop)
      assert.deepEqual(calls.filter(({ url, method }) => (
        url.includes('/repos/') && method !== 'GET'
      )).map(({ url, method }) => ({ url, method })), [{
        url: 'https://api.github.com/repos/neutral-workbench/neutral-workbench.github.io/pages',
        method: 'DELETE',
      }])
      assert.equal(calls.filter(({ url, method }) => (
        url.endsWith('/installation/token') && method === 'DELETE'
      )).length, 1)
    } finally {
      await fs.rm(operationDirectory, { recursive: true, force: true })
    }
  }
})

test('disable-pages rejects stale destination confirmation before child or key access', async () => {
  const identity = githubConfigIdentity(config())
  const trusted = { schema: 'zzz-workbench-public-release-trusted-controller/v1', source: candidate().expectation.source, sourceContext: candidate().expectation.sourceContext }
  const confirmation = {
    schema: 'zzz-workbench-public-release-disable-confirmation/v1', action: 'disable-pages',
    confirmedAt: '2026-09-07T12:00:00.000Z', controllerCommit: COMMIT,
    destination: { ...identity.destination, owner: 'another-site' }, githubConfigDigest: identity.digest,
  }
  const inputs = jsonReader({ 'github.json': config(), 'trusted-controller.json': trusted, 'incident-confirmation.json': confirmation })
  let childRuns = 0
  await assert.rejects(dispatchReleaseCommand(command('disable-pages'), {
    controllerRoot: ROOT, nodeExecutable: NODE, fsImpl: emptyDirectoryFs(),
    now: () => Date.parse('2026-09-07T12:05:00.000Z'),
    readFile: async (filePath) => [GIT, NODE, NPM].includes(filePath) ? TOOL_BYTES : inputs(filePath),
    npmPackageIdentity: async () => boundNpmIdentity(),
    runPublishingChild: async () => { childRuns += 1 },
  }), /destination incident confirmation/)
  assert.equal(childRuns, 0)
})

test('disable-pages requires only its active bootstrap App key', async () => {
  const identity = githubConfigIdentity(config())
  const trusted = {
    schema: 'zzz-workbench-public-release-trusted-controller/v1',
    source: candidate().expectation.source,
    sourceContext: candidate().expectation.sourceContext,
  }
  const confirmation = {
    schema: 'zzz-workbench-public-release-disable-confirmation/v1',
    action: 'disable-pages',
    confirmedAt: '2026-09-07T12:00:00.000Z',
    controllerCommit: COMMIT,
    destination: identity.destination,
    githubConfigDigest: identity.digest,
  }
  const inputs = jsonReader({
    'github.json': config(), 'trusted-controller.json': trusted, 'incident-confirmation.json': confirmation,
  })
  const baseDependencies = {
    controllerRoot: ROOT,
    nodeExecutable: NODE,
    now: () => Date.parse('2026-09-07T12:05:00.000Z'),
    readFile: async (filePath) => [GIT, NODE, NPM].includes(filePath) ? TOOL_BYTES : inputs(filePath),
    writeFile: async () => {},
    gitRunner: trustedGitRunner(),
    npmPackageIdentity: async () => boundNpmIdentity(),
    runPublishingChild: async () => ({ disabled: true }),
  }

  await dispatchReleaseCommand(command('disable-pages'), {
    ...baseDependencies,
    fsImpl: missingPathFs(config().apps.publisher.keyPath),
  })
  await assert.rejects(dispatchReleaseCommand(command('disable-pages'), {
    ...baseDependencies,
    fsImpl: missingPathFs(config().apps.bootstrap.keyPath),
  }), (error) => error instanceof PublicReleaseError && error.code === 'external_path_required')
})
