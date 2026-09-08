import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import {
  ARTIFACT_CANDIDATE_SCHEMA,
  acceptPreparedArtifact,
  buildCandidateArtifact,
  createGitCommandEnvironment,
  createNpmCommandEnvironment,
  extractImmutableGitSource,
  readArtifactTree,
  runDirectCommand,
  sha256,
} from './public-release-artifact.mjs'
import {
  FIXED_CHILD_SCHEMA,
  PublicReleaseGithubError,
  githubConfigIdentity,
  runPublishingChild,
  validateGithubConfig,
} from './public-release-github.mjs'

export const RELEASE_COMMANDS = Object.freeze([
  'prepare', 'bootstrap', 'publish', 'restore', 'disable-pages',
])
export const RELEASE_COMMAND_SCHEMA = 'zzz-workbench-public-release-command/v1'
export const RELEASE_CONTEXT_SCHEMA = 'zzz-workbench-public-release-context/v1'
export const PRIVATE_CANDIDATE_SCHEMA = 'zzz-workbench-private-release-candidate/v1'
export const TRUSTED_CONTROLLER_SCHEMA = 'zzz-workbench-public-release-trusted-controller/v1'
export const DISABLE_CONFIRMATION_SCHEMA = 'zzz-workbench-public-release-disable-confirmation/v1'

const CONTROLLER_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const RELEASE_PHASES = Object.freeze(['bootstrap', 'publish', 'restore'])
const SHA1 = /^[0-9a-f]{40}$/
const SHA256_IDENTITY = /^sha256:[0-9a-f]{64}$/
const PATHS_BY_COMMAND = Object.freeze({
  prepare: [
    'candidate', 'decisionTemplate', 'extractionRoot', 'gitExecutable', 'npmCli',
    'githubConfig', 'releaseContext', 'repositoryRoot', 'trustedController',
  ],
  bootstrap: ['candidate', 'decision', 'githubConfig', 'operationDirectory'],
  publish: ['candidate', 'decision', 'githubConfig', 'operationDirectory'],
  restore: ['candidate', 'decision', 'githubConfig', 'operationDirectory', 'trustedController'],
  'disable-pages': ['githubConfig', 'incidentConfirmation', 'operationDirectory', 'trustedController'],
})

export class PublicReleaseError extends Error {
  constructor(message, { code = 'release_invalid', state = 'failed' } = {}) {
    super(message)
    this.name = 'PublicReleaseError'
    this.code = code
    this.state = state
  }
}

function fail(message, details) {
  throw new PublicReleaseError(message, details)
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} is invalid.`)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} schema is invalid.`)
  }
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.length === 0 || /[\r\n\0]/.test(value)) fail(`${label} is invalid.`)
  return value
}

function requiredDigest(value, label) {
  if (!SHA256_IDENTITY.test(value ?? '')) fail(`${label} is invalid.`)
  return value
}

function pathsEqual(left, right) {
  const a = path.resolve(left)
  const b = path.resolve(right)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

function isInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function assertExternalPath(value, repositoryRoot, label) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || isInside(repositoryRoot, value)) {
    fail(`${label} must be outside the repository.`, { code: 'external_path_required' })
  }
  return path.resolve(value)
}

async function realUnredirectedDirectory(directory, label, fsImpl) {
  const resolved = path.resolve(directory)
  let stat
  let realPath
  try {
    [stat, realPath] = await Promise.all([fsImpl.lstat(resolved), fsImpl.realpath(resolved)])
  } catch {
    fail(`${label} must be an existing real directory.`, { code: 'external_path_required' })
  }
  if (!stat.isDirectory() || stat.isSymbolicLink() || !pathsEqual(realPath, resolved)) {
    fail(`${label} must be an unredirected real directory.`, { code: 'external_path_required' })
  }
  return path.resolve(realPath)
}

async function verifyExternalExistingPath(value, repositoryRoot, label, fsImpl) {
  const requested = assertExternalPath(value, repositoryRoot, label)
  const realRepository = await realUnredirectedDirectory(repositoryRoot, 'Controller repository', fsImpl)
  let stat
  let realPath
  try {
    [stat, realPath] = await Promise.all([fsImpl.lstat(requested), fsImpl.realpath(requested)])
  } catch {
    fail(`${label} must be an existing external path.`, { code: 'external_path_required' })
  }
  if (stat.isSymbolicLink() || !pathsEqual(realPath, requested) || isInside(realRepository, realPath)) {
    fail(`${label} must not redirect into or through the repository.`, { code: 'external_path_required' })
  }
  return requested
}

async function verifyExternalOutputPath(value, repositoryRoot, label, fsImpl) {
  const requested = assertExternalPath(value, repositoryRoot, label)
  const realRepository = await realUnredirectedDirectory(repositoryRoot, 'Controller repository', fsImpl)
  const parent = await realUnredirectedDirectory(path.dirname(requested), `${label} parent`, fsImpl)
  if (isInside(realRepository, parent)) {
    fail(`${label} parent must remain outside the repository.`, { code: 'external_path_required' })
  }
  return requested
}

async function verifyGithubKeyPath(config, role, dependencies) {
  await verifyExternalExistingPath(
    config.apps[role].keyPath,
    dependencies.controllerRoot,
    `${role} key`,
    dependencies.fsImpl,
  )
}

function validateExecutable(value, names, label) {
  if (typeof value !== 'string' || !path.isAbsolute(value)
      || !names.includes(path.basename(value).toLowerCase())) {
    fail(`${label} must be an absolute allowlisted executable.`, { code: 'executable_invalid' })
  }
  return path.resolve(value)
}

export function parseReleaseCli(argv) {
  if (!Array.isArray(argv) || argv.length !== 3 || argv[1] !== '--input-file') {
    fail('Use <command> --input-file <absolute-path>.')
  }
  const [kind, , inputFile] = argv
  if (!RELEASE_COMMANDS.includes(kind)) fail('Release command is not allowlisted.')
  if (!path.isAbsolute(inputFile)) fail('Release input file must be an absolute path.')
  return { kind, inputFile: path.resolve(inputFile) }
}

export function validateReleaseCommand(payload) {
  exactKeys(payload, ['schema', 'kind', 'paths'], 'Release command')
  if (payload.schema !== RELEASE_COMMAND_SCHEMA || !RELEASE_COMMANDS.includes(payload.kind)) {
    fail('Release command schema is invalid.')
  }
  exactKeys(payload.paths, PATHS_BY_COMMAND[payload.kind], 'Release command paths')
  for (const [label, value] of Object.entries(payload.paths)) {
    if (typeof value !== 'string' || !path.isAbsolute(value)) fail(`${label} must be an absolute path.`)
  }
  const resolved = Object.fromEntries(Object.entries(payload.paths).map(([key, value]) => [key, path.resolve(value)]))
  const identities = Object.values(resolved).map((value) => process.platform === 'win32' ? value.toLowerCase() : value)
  if (new Set(identities).size !== identities.length) fail('Release command paths must be distinct.')
  return { ...payload, paths: resolved }
}

export async function readReleaseCommand(inputFile, readFile = fs.readFile) {
  try {
    return validateReleaseCommand(JSON.parse(await readFile(inputFile, 'utf8')))
  } catch (error) {
    if (error instanceof PublicReleaseError) throw error
    fail('Release input file is unavailable or malformed.', { code: 'external_input_invalid' })
  }
}

async function readJsonFile(filePath, readFile) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    fail('External JSON input is unavailable or malformed.', { code: 'external_input_invalid' })
  }
}

async function writeExclusiveJson(filePath, value, writeFile) {
  try {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', encoding: 'utf8' })
  } catch {
    fail('External output path must be new and exclusively writable.', { code: 'external_output_invalid' })
  }
}

function validateReleaseContext(context) {
  exactKeys(context, [
    'schema', 'admission', 'expectedRemoteUrl', 'footerDigest', 'guidance', 'lockfileSha256',
    'operatorUseModel', 'phase',
  ], 'Release context')
  if (context.schema !== RELEASE_CONTEXT_SCHEMA || !RELEASE_PHASES.includes(context.phase)) {
    fail('Release context phase is invalid.')
  }
  requiredString(context.expectedRemoteUrl, 'Expected remote')
  requiredDigest(context.footerDigest, 'Footer digest')
  requiredDigest(context.lockfileSha256, 'Lockfile digest')
  exactKeys(context.admission, [
    'forbiddenFragments', 'inertExternalUrlExceptions', 'inertRuntimeApiExceptions',
  ], 'Artifact admission context')
  for (const key of Object.keys(context.admission)) {
    if (!Array.isArray(context.admission[key])) fail(`Artifact admission ${key} is invalid.`)
  }
  if (context.admission.forbiddenFragments.length === 0) fail('Artifact private denylist is required.')
  if (!context.operatorUseModel || typeof context.operatorUseModel !== 'object' || Array.isArray(context.operatorUseModel)) {
    fail('Operator/use model is invalid.')
  }
  if (!Array.isArray(context.guidance) || context.guidance.length === 0) fail('Reviewed guidance is invalid.')
  return context
}

function encodeCandidate(candidate) {
  exactKeys(candidate, ['admission', 'expectation', 'files', 'manifest', 'schema', 'template'], 'Artifact candidate')
  if (candidate.schema !== ARTIFACT_CANDIDATE_SCHEMA || !Array.isArray(candidate.files)) {
    fail('Artifact candidate is invalid.')
  }
  return {
    schema: PRIVATE_CANDIDATE_SCHEMA,
    candidate: {
      ...candidate,
      files: candidate.files.map((file) => ({
        path: file.path,
        mode: file.mode,
        contentBase64: file.bytes.toString('base64'),
      })),
    },
  }
}

function decodeCandidate(value) {
  exactKeys(value, ['candidate', 'schema'], 'Private candidate file')
  if (value.schema !== PRIVATE_CANDIDATE_SCHEMA) fail('Private candidate schema is invalid.')
  exactKeys(value.candidate, ['admission', 'expectation', 'files', 'manifest', 'schema', 'template'], 'Artifact candidate')
  if (value.candidate.schema !== ARTIFACT_CANDIDATE_SCHEMA || !Array.isArray(value.candidate.files)) {
    fail('Artifact candidate is invalid.')
  }
  const files = value.candidate.files.map((file) => {
    exactKeys(file, ['contentBase64', 'mode', 'path'], 'Private candidate file entry')
    if (typeof file.contentBase64 !== 'string'
        || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contentBase64)) {
      fail('Private candidate file encoding is invalid.')
    }
    const bytes = Buffer.from(file.contentBase64, 'base64')
    if (bytes.toString('base64') !== file.contentBase64) fail('Private candidate file encoding is not canonical.')
    return { path: file.path, mode: file.mode, bytes }
  })
  return { ...value.candidate, files }
}

function publicationFiles(files) {
  return [...files]
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
    .map((file) => ({ path: file.path, mode: file.mode, contentBase64: file.bytes.toString('base64') }))
}

async function ensureEmptyDirectory(directory, dependencies) {
  const verifiedDirectory = await verifyExternalExistingPath(
    directory, dependencies.controllerRoot, 'Operation directory', dependencies.fsImpl,
  )
  let stat
  try {
    stat = await dependencies.fsImpl.lstat(verifiedDirectory)
  } catch {
    fail('Operation directory must already exist.', { code: 'external_path_required' })
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()
      || (await dependencies.fsImpl.readdir(verifiedDirectory)).length !== 0) {
    fail('Operation directory must be a fresh empty directory.', { code: 'external_path_required' })
  }
  return verifiedDirectory
}

async function toolIdentity(executable, names, label, dependencies) {
  const requested = validateExecutable(executable, names, label)
  let realPath
  let bytes
  try {
    realPath = path.resolve(await dependencies.fsImpl.realpath(requested))
    bytes = await dependencies.readFile(realPath)
  } catch {
    fail(`${label} identity could not be read.`, { code: 'tool_identity_invalid' })
  }
  assertExternalPath(requested, dependencies.controllerRoot, `${label} executable`)
  assertExternalPath(realPath, dependencies.controllerRoot, `${label} real executable`)
  return { path: requested, realPath, digest: `sha256:${sha256(bytes)}` }
}

export async function npmPackageIdentity(executable, dependencies) {
  const entry = await toolIdentity(executable, ['npm-cli.js'], 'npm CLI', dependencies)
  const packageRoot = path.resolve(path.dirname(entry.realPath), '..')
  const expectedEntry = path.join(packageRoot, 'bin', 'npm-cli.js')
  if (!pathsEqual(entry.realPath, expectedEntry)) {
    fail('npm CLI must be the package bin/npm-cli.js entry.', { code: 'tool_identity_invalid' })
  }
  assertExternalPath(packageRoot, dependencies.controllerRoot, 'npm package root')
  let realRoot
  try {
    realRoot = path.resolve(await dependencies.fsImpl.realpath(packageRoot))
  } catch {
    fail('npm package root identity could not be read.', { code: 'tool_identity_invalid' })
  }
  if (!pathsEqual(realRoot, packageRoot)) {
    fail('npm package root must not redirect elsewhere.', { code: 'tool_identity_invalid' })
  }

  const entries = []
  const pathIdentities = new Set()
  async function walk(directory, prefix = '') {
    let children
    try {
      children = await dependencies.fsImpl.readdir(directory, { withFileTypes: true })
    } catch {
      fail('npm package tree identity could not be read.', { code: 'tool_identity_invalid' })
    }
    for (const child of children) {
      if (!child?.name || /[\\/\0\r\n]/.test(child.name) || child.name === '.' || child.name === '..') {
        fail('npm package tree contains an invalid path.', { code: 'tool_identity_invalid' })
      }
      const relative = prefix ? `${prefix}/${child.name}` : child.name
      const identity = process.platform === 'win32' ? relative.toLowerCase() : relative
      if (pathIdentities.has(identity)) {
        fail('npm package tree contains ambiguous paths.', { code: 'tool_identity_invalid' })
      }
      pathIdentities.add(identity)
      const absolute = path.join(directory, child.name)
      let stat
      try {
        stat = await dependencies.fsImpl.lstat(absolute)
      } catch {
        fail('npm package tree identity could not be read.', { code: 'tool_identity_invalid' })
      }
      if (stat.isSymbolicLink()) {
        fail('npm package tree must not contain symbolic links.', { code: 'tool_identity_invalid' })
      }
      if (stat.isDirectory()) {
        await walk(absolute, relative)
      } else if (stat.isFile()) {
        let bytes
        try {
          bytes = await dependencies.readFile(absolute)
        } catch {
          fail('npm package tree identity could not be read.', { code: 'tool_identity_invalid' })
        }
        entries.push({ path: relative, size: bytes.length, sha256: sha256(bytes) })
      } else {
        fail('npm package tree contains an unsupported entry.', { code: 'tool_identity_invalid' })
      }
    }
  }
  await walk(realRoot)
  entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
  if (!entries.some((item) => item.path === 'bin/npm-cli.js')) {
    fail('npm package tree does not contain its sealed entry.', { code: 'tool_identity_invalid' })
  }
  return {
    ...entry,
    packageRoot: realRoot,
    packageFileCount: entries.length,
    packageTreeDigest: `sha256:${sha256(Buffer.from(JSON.stringify({ schema: 'npm-package-tree/v1', entries }), 'utf8'))}`,
  }
}

async function verifyToolchain(expected, dependencies) {
  exactKeys(expected, ['git', 'node', 'npm'], 'Bound toolchain')
  const observed = {
    git: await toolIdentity(expected.git.path, ['git', 'git.exe'], 'Git', dependencies),
    node: await toolIdentity(expected.node.path, ['node', 'node.exe'], 'Node', dependencies),
    npm: await dependencies.npmPackageIdentity(expected.npm.path, dependencies),
  }
  if (!isDeepStrictEqual(observed, expected)) {
    fail('Decision-bound tool identity changed.', { code: 'tool_identity_invalid' })
  }
  return observed
}

function githubBinding(config) {
  return githubConfigIdentity(config)
}

async function prepareRelease(command, dependencies) {
  const repositoryRoot = path.resolve(command.paths.repositoryRoot)
  if (!pathsEqual(repositoryRoot, dependencies.controllerRoot)) {
    fail('Prepare must use the trusted controller repository.', { code: 'trusted_source_invalid' })
  }
  for (const label of ['candidate', 'decisionTemplate', 'trustedController']) {
    await verifyExternalOutputPath(command.paths[label], repositoryRoot, label, dependencies.fsImpl)
  }
  for (const label of ['extractionRoot', 'gitExecutable', 'githubConfig', 'npmCli', 'releaseContext']) {
    await verifyExternalExistingPath(command.paths[label], repositoryRoot, label, dependencies.fsImpl)
  }
  const context = validateReleaseContext(await readJsonFile(command.paths.releaseContext, dependencies.readFile))
  const config = await readJsonFile(command.paths.githubConfig, dependencies.readFile)
  validateGithubConfig(config, { forbiddenRoots: [dependencies.controllerRoot] })
  await verifyGithubKeyPath(config, context.phase === 'bootstrap' ? 'bootstrap' : 'publisher', dependencies)
  const tools = {
    git: await toolIdentity(command.paths.gitExecutable, ['git', 'git.exe'], 'Git', dependencies),
    node: await toolIdentity(dependencies.nodeExecutable, ['node', 'node.exe'], 'Node', dependencies),
    npm: await dependencies.npmPackageIdentity(command.paths.npmCli, dependencies),
  }
  const gitExecutable = tools.git.path
  const npmCli = tools.npm.realPath
  const buildInput = await dependencies.extractImmutableGitSource({
    gitExecutable,
    controllerRoot: dependencies.controllerRoot,
    repositoryRoot,
    expectedRemoteUrl: context.expectedRemoteUrl,
    extractionRoot: command.paths.extractionRoot,
    nodeVersion: dependencies.nodeVersion,
    trustedControllerRoot: dependencies.controllerRoot,
    runCommand: dependencies.gitRunner,
    fsImpl: dependencies.fsImpl,
  })
  const actualLockfileDigest = `sha256:${sha256(await dependencies.readFile(buildInput.lockfilePath))}`
  if (actualLockfileDigest !== context.lockfileSha256) {
    fail('Extracted lockfile digest changed.', { code: 'lockfile_mismatch' })
  }
  const childPath = 'scripts/github-app/public-release-github.mjs'
  const childBytes = await dependencies.readFile(path.join(buildInput.extractionRoot, ...childPath.split('/')))
  await verifyToolchain(tools, dependencies)
  const childBlob = commandText(await dependencies.gitRunner({
    executable: gitExecutable,
    args: ['rev-parse', '--verify', `${buildInput.headSha}:${childPath}`],
    cwd: repositoryRoot,
    input: null,
    shell: false,
    env: createGitCommandEnvironment(gitExecutable),
  }), 'Publishing child blob')
  const candidate = await dependencies.buildCandidateArtifact({
    buildInput,
    buildExpectation: {
      controllerRoot: dependencies.controllerRoot,
      repositoryRoot,
      remoteUrl: context.expectedRemoteUrl,
      gitExecutable,
      headSha: buildInput.headSha,
    },
    install: async ({ cwd, args }) => {
      await verifyToolchain(tools, dependencies)
      return dependencies.toolRunner({
        executable: tools.node.realPath,
        args: [npmCli, ...args],
        cwd,
        input: null,
        shell: false,
        env: createNpmCommandEnvironment(tools.node.realPath, cwd),
      })
    },
    build: async ({ cwd, args }) => {
      await verifyToolchain(tools, dependencies)
      return dependencies.toolRunner({
        executable: tools.node.realPath,
        args: [npmCli, ...args],
        cwd,
        input: null,
        shell: false,
        env: createNpmCommandEnvironment(tools.node.realPath, cwd),
      })
    },
    readGeneratedFiles: ({ root }) => dependencies.readArtifactTree(root, { fsImpl: dependencies.fsImpl }),
    releaseContext: {
      footerDigest: context.footerDigest,
      guidance: context.guidance,
      lockfileSha256: context.lockfileSha256,
      operatorUseModel: context.operatorUseModel,
    },
    phase: context.phase,
    privateBindings: {
      github: githubBinding(config),
      publishingChild: { path: childPath, blobSha: childBlob, digest: `sha256:${sha256(childBytes)}` },
      tools,
    },
    ...context.admission,
  })
  await writeExclusiveJson(command.paths.candidate, encodeCandidate(candidate), dependencies.writeFile)
  await writeExclusiveJson(command.paths.decisionTemplate, candidate.template, dependencies.writeFile)
  await writeExclusiveJson(command.paths.trustedController, {
    schema: TRUSTED_CONTROLLER_SCHEMA,
    source: candidate.expectation.source,
    sourceContext: candidate.expectation.sourceContext,
  }, dependencies.writeFile)
  return {
    state: 'prepared',
    artifactTreeDigest: candidate.manifest.treeDigest,
    manifestDigest: candidate.manifest.manifestDigest,
    nextCommand: context.phase,
  }
}

function commandText(result, label) {
  if (!result || !Buffer.isBuffer(result.stdout)) fail(`${label} did not return bytes.`, { code: 'trusted_source_invalid' })
  const value = result.stdout.toString('utf8').replace(/\r?\n$/, '')
  if (value.includes('\0') || value.includes('\r') || value.includes('\n')) {
    fail(`${label} returned an ambiguous value.`, { code: 'trusted_source_invalid' })
  }
  return value
}

async function verifyHistoricalRestoreSource(candidate, trusted, execution, dependencies) {
  const source = candidate.expectation?.source
  const context = candidate.expectation?.sourceContext
  if (!SHA1.test(source?.commitSha ?? '') || !SHA1.test(source?.treeSha ?? '')
      || !pathsEqual(context?.controllerRoot, dependencies.controllerRoot)
      || !pathsEqual(context?.repositoryRoot, dependencies.controllerRoot)
      || context?.expectedRemoteUrl !== trusted.sourceContext.expectedRemoteUrl
      || !isDeepStrictEqual(context?.github, trusted.sourceContext.github)) {
    fail('Historical restore source binding is invalid.', { code: 'trusted_source_invalid' })
  }
  const gitExecutable = trusted.sourceContext.tools.git.path
  const git = async (args, label) => {
    try {
      return commandText(await dependencies.gitRunner({
        executable: gitExecutable, args, cwd: dependencies.controllerRoot, input: null, shell: false,
        env: createGitCommandEnvironment(gitExecutable),
      }), label)
    } catch (error) {
      if (error instanceof PublicReleaseError) throw error
      fail('Historical restore Git command failed.', { code: 'trusted_source_invalid' })
    }
  }
  const candidateCommit = await git(['rev-parse', '--verify', `${source.commitSha}^{commit}`], 'Historical candidate commit')
  const candidateTree = await git(['rev-parse', '--verify', `${source.commitSha}^{tree}`], 'Historical candidate tree')
  if (candidateCommit !== source.commitSha || candidateTree !== source.treeSha) {
    fail('Historical restore source is unavailable.', { code: 'trusted_source_invalid' })
  }
  try {
    await dependencies.gitRunner({
      executable: gitExecutable,
      args: ['merge-base', '--is-ancestor', source.commitSha, trusted.source.commitSha],
      cwd: dependencies.controllerRoot, input: null, shell: false,
      env: createGitCommandEnvironment(gitExecutable),
    })
  } catch {
    fail('Historical restore source is not reachable from current main.', { code: 'trusted_source_invalid' })
  }
  await verifyToolchain(trusted.sourceContext.tools, dependencies)
  return execution
}

async function verifyDecisionBoundSource(candidate, dependencies, phase) {
  const source = candidate.expectation?.source
  const context = candidate.expectation?.sourceContext
  try {
    exactKeys(source, ['commitSha', 'treeSha'], 'Candidate source')
    exactKeys(context, ['controllerRoot', 'expectedRemoteUrl', 'github', 'publishingChild', 'repositoryRoot', 'tools'], 'Candidate source context')
  } catch {
    fail('Candidate source binding is invalid.', { code: 'trusted_source_invalid' })
  }
  if (!SHA1.test(source.commitSha ?? '') || !SHA1.test(source.treeSha ?? '')
      || !pathsEqual(context.controllerRoot, dependencies.controllerRoot)
      || !pathsEqual(context.repositoryRoot, dependencies.controllerRoot)) {
    fail('Candidate does not bind this trusted controller.', { code: 'trusted_source_invalid' })
  }
  const runtimeNode = await toolIdentity(dependencies.nodeExecutable, ['node', 'node.exe'], 'Node', dependencies)
  if (!isDeepStrictEqual(runtimeNode, context.tools.node)) {
    fail('Controller Node identity differs from the decision-bound tool.', { code: 'tool_identity_invalid' })
  }
  await verifyToolchain(context.tools, dependencies)
  const gitExecutable = context.tools.git.path
  assertExternalPath(gitExecutable, dependencies.controllerRoot, 'Git executable')
  requiredString(context.expectedRemoteUrl, 'Expected remote')
  const git = async (args, label) => {
    try {
      return commandText(await dependencies.gitRunner({
        executable: gitExecutable,
        args,
        cwd: context.repositoryRoot,
        input: null,
        shell: false,
        env: createGitCommandEnvironment(gitExecutable),
      }), label)
    } catch (error) {
      if (error instanceof PublicReleaseError) throw error
      fail('Trusted source Git command failed.', { code: 'trusted_source_invalid' })
    }
  }
  const observed = {
    root: await git(['rev-parse', '--show-toplevel'], 'Repository root'),
    status: await git(['status', '--porcelain=v1', '--untracked-files=all'], 'Git status'),
    branch: await git(['branch', '--show-current'], 'Git branch'),
    head: await git(['rev-parse', '--verify', 'HEAD'], 'HEAD'),
    originMain: await git(['rev-parse', '--verify', 'refs/remotes/origin/main'], 'origin/main'),
    remote: await git(['remote', 'get-url', 'origin'], 'Origin remote'),
    tree: await git(['rev-parse', '--verify', 'HEAD^{tree}'], 'HEAD tree'),
  }
  const currentInvalid = !pathsEqual(observed.root, context.repositoryRoot) || observed.status !== '' || observed.branch !== 'main'
      || observed.head !== observed.originMain || observed.remote !== context.expectedRemoteUrl
  if (currentInvalid) {
    fail('Publishing requires the decision-bound trusted exact main state.', { code: 'trusted_source_invalid' })
  }
  if (observed.head !== source.commitSha || observed.tree !== source.treeSha) {
    fail('Publication candidate is not the current exact main source.', { code: 'trusted_source_invalid' })
  }
  const candidateCommit = await git(['rev-parse', '--verify', `${source.commitSha}^{commit}`], 'Candidate commit')
  const candidateTree = await git(['rev-parse', '--verify', `${source.commitSha}^{tree}`], 'Candidate tree')
  if (candidateCommit !== source.commitSha || candidateTree !== source.treeSha) {
    fail('Candidate historical source identity is unavailable.', { code: 'trusted_source_invalid' })
  }
  try {
    await dependencies.gitRunner({
      executable: gitExecutable,
      args: ['merge-base', '--is-ancestor', source.commitSha, observed.head],
      cwd: context.repositoryRoot,
      input: null,
      shell: false,
      env: createGitCommandEnvironment(gitExecutable),
    })
  } catch {
    fail('Candidate source is not reachable from current main.', { code: 'trusted_source_invalid' })
  }
  const childBlob = await git(['rev-parse', '--verify', `${source.commitSha}:${context.publishingChild.path}`], 'Publishing child blob')
  if (childBlob !== context.publishingChild.blobSha) {
    fail('Decision-bound publishing child identity changed.', { code: 'trusted_source_invalid' })
  }
  const childResult = await dependencies.gitRunner({
    executable: gitExecutable,
    args: ['cat-file', 'blob', childBlob],
    cwd: context.repositoryRoot,
    input: null,
    shell: false,
    env: createGitCommandEnvironment(gitExecutable),
  })
  if (!childResult || !Buffer.isBuffer(childResult.stdout)
      || `sha256:${sha256(childResult.stdout)}` !== context.publishingChild.digest) {
    fail('Decision-bound publishing child bytes changed.', { code: 'trusted_source_invalid' })
  }
  await verifyToolchain(context.tools, dependencies)
  return {
    childSource: childResult.stdout,
    nodeExecutable: context.tools.node.realPath,
  }
}

function verifyCandidateDenylist(candidate, config) {
  const bound = candidate.expectation?.admission?.forbiddenFragments
  if (!Array.isArray(bound) || bound.length === 0) {
    fail('Candidate private denylist is unavailable.', { code: 'denylist_mismatch' })
  }
  const identities = new Set(bound.map((value) => typeof value === 'string' ? value.toLowerCase() : null))
  if (identities.has(null) || config.forbiddenPrivateIdentifiers.some((value) => !identities.has(value.toLowerCase()))) {
    fail('GitHub configuration private identifiers are missing from the candidate-bound denylist.', {
      code: 'denylist_mismatch',
    })
  }
}

async function readPublicationInputs(command, dependencies, phase) {
  for (const [label, value] of Object.entries(command.paths)) {
    assertExternalPath(value, dependencies.controllerRoot, label)
  }
  for (const [label, value] of Object.entries(command.paths)) {
    if (label !== 'operationDirectory') {
      await verifyExternalExistingPath(value, dependencies.controllerRoot, label, dependencies.fsImpl)
    }
  }
  const [candidateValue, decision, config] = await Promise.all([
    readJsonFile(command.paths.candidate, dependencies.readFile),
    readJsonFile(command.paths.decision, dependencies.readFile),
    readJsonFile(command.paths.githubConfig, dependencies.readFile),
  ])
  validateGithubConfig(config, { forbiddenRoots: [dependencies.controllerRoot] })
  await verifyGithubKeyPath(config, phase === 'bootstrap' ? 'bootstrap' : 'publisher', dependencies)
  return { candidate: decodeCandidate(candidateValue), decision, config }
}

async function invokePublishingChild({
  operation, payload, config, operationDirectory, preflight, childSource, nodeExecutable,
}, dependencies) {
  const role = operation === 'publish' ? 'publisher' : operation === 'bootstrap' ? 'bootstrap' : 'stop'
  const fixed = { schema: FIXED_CHILD_SCHEMA, operation, role, config, payload }
  const operationFile = path.join(operationDirectory, `${operation}.json`)
  await writeExclusiveJson(operationFile, fixed, dependencies.writeFile)
  return dependencies.runPublishingChild({
    nodeExecutable,
    operationFile,
    preflight: async (observed) => {
      if (!isDeepStrictEqual(observed, fixed)) return false
      return preflight ? preflight() : true
    },
    loadPrivateKey: (keyPath) => dependencies.readFile(keyPath, 'utf8'),
    fetchImpl: dependencies.fetchImpl,
    childRunner: dependencies.childRunner,
    childSource,
    signalSource: dependencies.signalSource,
    forbiddenRoots: [dependencies.controllerRoot],
  })
}

async function executePublication(command, dependencies, phase) {
  const inputs = await readPublicationInputs(command, dependencies, phase)
  const operationDirectory = await ensureEmptyDirectory(command.paths.operationDirectory, dependencies)
  return dependencies.acceptPreparedArtifact({
    candidate: inputs.candidate,
    decision: inputs.decision,
    phase,
    now: dependencies.now(),
    onAccepted: async ({ files, manifest }) => {
      const operation = phase === 'bootstrap' ? 'bootstrap' : 'publish'
      verifyCandidateDenylist(inputs.candidate, inputs.config)
      if (!isDeepStrictEqual(githubBinding(inputs.config), inputs.candidate.expectation.sourceContext.github)) {
        fail('GitHub operational configuration changed after decision.', { code: 'github_binding_mismatch' })
      }
      let execution
      if (phase === 'restore') {
        const trusted = await readJsonFile(command.paths.trustedController, dependencies.readFile)
        exactKeys(trusted, ['schema', 'source', 'sourceContext'], 'Trusted controller binding')
        if (trusted.schema !== TRUSTED_CONTROLLER_SCHEMA) fail('Trusted controller binding is invalid.')
        const currentExecution = await verifyDecisionBoundSource({ expectation: trusted }, dependencies, 'restore-controller')
        execution = await verifyHistoricalRestoreSource(inputs.candidate, trusted, currentExecution, dependencies)
      } else {
        execution = await verifyDecisionBoundSource(inputs.candidate, dependencies, phase)
      }
      const result = await invokePublishingChild({
        operation,
        payload: { files: publicationFiles(files), artifactTreeDigest: manifest.treeDigest },
        config: inputs.config,
        operationDirectory,
        childSource: execution.childSource,
        nodeExecutable: execution.nodeExecutable,
        preflight: async () => true,
      }, dependencies)
      return {
        state: phase === 'restore' ? 'restored' : result.state,
        artifactTreeDigest: manifest.treeDigest,
        result,
      }
    },
  })
}

async function executeDisablePages(command, dependencies) {
  for (const [label, value] of Object.entries(command.paths)) {
    assertExternalPath(value, dependencies.controllerRoot, label)
  }
  for (const [label, value] of Object.entries(command.paths)) {
    if (label !== 'operationDirectory') {
      await verifyExternalExistingPath(value, dependencies.controllerRoot, label, dependencies.fsImpl)
    }
  }
  const config = await readJsonFile(command.paths.githubConfig, dependencies.readFile)
  validateGithubConfig(config, { forbiddenRoots: [dependencies.controllerRoot] })
  await verifyGithubKeyPath(config, 'bootstrap', dependencies)
  const trusted = await readJsonFile(command.paths.trustedController, dependencies.readFile)
  const confirmation = await readJsonFile(command.paths.incidentConfirmation, dependencies.readFile)
  exactKeys(trusted, ['schema', 'source', 'sourceContext'], 'Trusted controller binding')
  if (trusted.schema !== TRUSTED_CONTROLLER_SCHEMA) fail('Trusted controller binding is invalid.')
  exactKeys(confirmation, ['action', 'confirmedAt', 'controllerCommit', 'destination', 'githubConfigDigest', 'schema'], 'Disable confirmation')
  const identity = githubBinding(config)
  const confirmedAt = Date.parse(confirmation.confirmedAt)
  const observedNow = dependencies.now()
  if (confirmation.schema !== DISABLE_CONFIRMATION_SCHEMA || confirmation.action !== 'disable-pages'
      || confirmation.githubConfigDigest !== identity.digest
      || confirmation.controllerCommit !== trusted.source?.commitSha
      || !isDeepStrictEqual(confirmation.destination, identity.destination)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(confirmation.confirmedAt ?? '')
      || !Number.isFinite(confirmedAt) || confirmedAt > observedNow || observedNow - confirmedAt > 10 * 60_000
      || !isDeepStrictEqual(trusted.sourceContext?.github, identity)) {
    fail('Exact destination incident confirmation is invalid.', { code: 'disable_confirmation_invalid' })
  }
  const execution = await verifyDecisionBoundSource({ expectation: trusted }, dependencies, 'disable-pages')
  const operationDirectory = await ensureEmptyDirectory(command.paths.operationDirectory, dependencies)
  const result = await invokePublishingChild({
    operation: 'disable-pages', payload: {}, config, operationDirectory,
    childSource: execution.childSource, nodeExecutable: execution.nodeExecutable,
  }, dependencies)
  return { state: 'pages-disabled', result, manualNextStep: 'inspect-live-state' }
}

function defaultDependencies(overrides = {}) {
  return {
    controllerRoot: CONTROLLER_ROOT,
    nodeExecutable: process.execPath,
    signalSource: process,
    nodeVersion: process.version,
    fsImpl: fs,
    readFile: fs.readFile,
    writeFile: fs.writeFile,
    gitRunner: runDirectCommand,
    toolRunner: runDirectCommand,
    extractImmutableGitSource,
    buildCandidateArtifact,
    acceptPreparedArtifact,
    readArtifactTree,
    npmPackageIdentity,
    runPublishingChild,
    fetchImpl: fetch,
    childRunner: undefined,
    now: () => Date.now(),
    ...overrides,
  }
}

export async function dispatchReleaseCommand(command, overrides = {}) {
  const validated = validateReleaseCommand(command)
  const dependencies = defaultDependencies(overrides)
  switch (validated.kind) {
    case 'prepare': return prepareRelease(validated, dependencies)
    case 'bootstrap': return executePublication(validated, dependencies, 'bootstrap')
    case 'publish': return executePublication(validated, dependencies, 'publish')
    case 'restore': return executePublication(validated, dependencies, 'restore')
    case 'disable-pages': return executeDisablePages(validated, dependencies)
    default: fail('Release command is not allowlisted.')
  }
}

function serializedReconciliationDiagnostic(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || typeof value.code !== 'string' || value.code.length === 0
      || typeof value.state !== 'string' || value.state.length === 0) return null
  return {
    code: value.code,
    state: value.state,
    ...(typeof value.resource === 'string' && value.resource.length > 0
      ? { resource: value.resource }
      : {}),
    ...(Number.isSafeInteger(value.httpStatus) && value.httpStatus >= 100 && value.httpStatus <= 599
      ? { httpStatus: value.httpStatus }
      : {}),
  }
}

export function serializeReleaseCliError(error) {
  const operational = error instanceof PublicReleaseError || error instanceof PublicReleaseGithubError
  if (!operational) {
    return { ok: false, code: 'release_failed', state: 'failed', message: 'Public release failed.' }
  }
  const operationDiagnostic = serializedReconciliationDiagnostic(error.operationDiagnostic)
  const revocationDiagnostic = serializedReconciliationDiagnostic(error.revocationDiagnostic)
  return {
    ok: false,
    code: error.code,
    state: error.state,
    message: error.message,
    ...(typeof error.resource === 'string' && error.resource.length > 0 ? { resource: error.resource } : {}),
    ...(Number.isSafeInteger(error.httpStatus) && error.httpStatus >= 100 && error.httpStatus <= 599
      ? { httpStatus: error.httpStatus }
      : {}),
    ...(operationDiagnostic === null ? {} : { operationDiagnostic }),
    ...(revocationDiagnostic === null ? {} : { revocationDiagnostic }),
  }
}

async function main() {
  const cli = parseReleaseCli(process.argv.slice(2))
  await verifyExternalExistingPath(cli.inputFile, CONTROLLER_ROOT, 'Release command input', fs)
  const command = await readReleaseCommand(cli.inputFile)
  if (command.kind !== cli.kind) fail('Command kind does not match the input file.')
  process.stdout.write(`${JSON.stringify(await dispatchReleaseCommand(command))}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify(serializeReleaseCliError(error))}\n`)
    process.exitCode = 1
  })
}
