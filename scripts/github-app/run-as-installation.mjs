import { createSign, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const APP_ID = 4603661;
export const INSTALLATION_ID = 153925488;
export const REPOSITORY = 'Min-DongYoung/zzz-workbench';
export const API_ORIGIN = 'https://api.github.com';
export const PROTECTED_BASE = 'recovery';
export const PEM_PATH_ENV = 'ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH';
export const GIT_EXECUTABLE_ENV = 'ZZZ_WORKBENCH_GIT_EXECUTABLE';
export const GH_EXECUTABLE_ENV = 'ZZZ_WORKBENCH_GH_EXECUTABLE';
export const EVIDENCE_MARKER = '<!-- zzz-workbench:authority-review:v1 -->';

const OWNER = 'Min-DongYoung';
const REVIEW_APP_AUTHOR = 'zzz-workbench-agent-mdy[bot]';
const REPOSITORY_NAME = 'zzz-workbench';
const CODEx_BRANCH = /^codex\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const SHA = /^[0-9a-f]{40}$/;
const POSITIVE_INTEGER = /^[1-9][0-9]*$/;
const ALLOWED_TOKEN_PERMISSIONS = new Map([
  ['contents', 'write'],
  ['pull_requests', 'write'],
  ['metadata', 'read'],
]);

export class LauncherError extends Error {
  constructor(message = 'GitHub App operation failed.', {
    code = 'operation_failed', retryable = false, mutationCompleted = false, resource = null,
  } = {}) {
    super(message);
    this.name = 'LauncherError';
    this.code = code;
    this.retryable = retryable;
    this.mutationCompleted = mutationCompleted;
    this.resource = resource;
  }
}

function fail(message) {
  throw new LauncherError(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

export function createAppJwt(privateKey, now = Date.now()) {
  if (!isNonEmptyString(privateKey)) fail('Private key is required.');

  const issuedAt = Math.floor(now / 1000) - 30;
  const payload = {
    iat: issuedAt,
    exp: issuedAt + 9 * 60,
    iss: APP_ID,
    jti: randomUUID(),
  };
  const encodedHeader = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signed = `${encodedHeader}.${encodedPayload}`;

  try {
    const signer = createSign('RSA-SHA256');
    signer.update(signed);
    signer.end();
    return `${signed}.${signer.sign(privateKey, 'base64url')}`;
  } catch {
    fail('GitHub App authentication could not be prepared.');
  }
}

export function validatePemPath(pemPath) {
  if (!isNonEmptyString(pemPath) || !path.isAbsolute(pemPath)) {
    fail(`${PEM_PATH_ENV} must be an absolute path.`);
  }
  return path.resolve(pemPath);
}

export function validateExecutablePath(executable, expectedName) {
  if (!isNonEmptyString(executable) || !path.isAbsolute(executable)) {
    fail(`${expectedName} executable must be an absolute path.`);
  }
  const actualName = path.basename(executable).toLowerCase();
  const allowedNames = new Set([expectedName, `${expectedName}.exe`]);
  if (!allowedNames.has(actualName)) fail('Executable is not allowlisted.');
  return path.resolve(executable);
}

function validateBranch(branch) {
  if (!isNonEmptyString(branch) || !CODEx_BRANCH.test(branch) || branch.includes('..') || branch.endsWith('/')) {
    fail('Branch is not an allowed non-protected codex branch.');
  }
  return branch;
}

function validatePullNumber(value) {
  if (!isNonEmptyString(value) || !POSITIVE_INTEGER.test(value)) fail('Pull request number is invalid.');
  return value;
}

function validateHeadSha(value) {
  if (!isNonEmptyString(value) || !SHA.test(value)) fail('Head SHA is invalid.');
  return value;
}

function validateText(value, label) {
  if (!isNonEmptyString(value) || Buffer.byteLength(value, 'utf8') > 64 * 1024) {
    fail(`${label} is required and must not exceed 64 KiB.`);
  }
  return value.replaceAll('\r\n', '\n');
}

function pathIsInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function validateEvidenceBody(value) {
  const body = validateText(value, 'Review evidence');
  if (body.split(EVIDENCE_MARKER).length - 1 !== 1) fail('Review evidence marker is invalid.');
  const fenced = body.match(/```json\s*([\s\S]*?)\s*```/i);
  let payload;
  try {
    payload = JSON.parse(fenced?.[1] ?? '');
  } catch {
    fail('Review evidence JSON is malformed.');
  }
  if (payload?.schema !== 'zzz-workbench-authority-review/v1' || payload?.kind !== 'authority-review') {
    fail('Review evidence schema is invalid.');
  }
  return body;
}

function requireExactKeys(operation, keys) {
  const actualKeys = Object.keys(operation).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    fail('Operation schema is not allowlisted.');
  }
}

export function validateOperation(operation) {
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    fail('Operation is invalid.');
  }

  switch (operation.kind) {
    case 'git-push':
      requireExactKeys(operation, ['kind', 'branch']);
      return { kind: 'git-push', branch: validateBranch(operation.branch) };
    case 'pr-create':
      requireExactKeys(operation, ['kind', 'head', 'title', 'body']);
      return {
        kind: 'pr-create',
        head: validateBranch(operation.head),
        title: validateText(operation.title, 'Pull request title'),
        body: validateText(operation.body, 'Pull request body'),
      };
    case 'pr-edit':
      requireExactKeys(operation, ['kind', 'number', 'title', 'body']);
      return {
        kind: 'pr-edit',
        number: validatePullNumber(operation.number),
        title: validateText(operation.title, 'Pull request title'),
        body: validateText(operation.body, 'Pull request body'),
      };
    case 'evidence-upsert':
      requireExactKeys(operation, ['kind', 'number', 'body']);
      return {
        kind: 'evidence-upsert',
        number: validatePullNumber(operation.number),
        body: validateEvidenceBody(operation.body),
      };
    case 'pr-merge':
      requireExactKeys(operation, ['kind', 'number', 'headSha']);
      return {
        kind: 'pr-merge',
        number: validatePullNumber(operation.number),
        headSha: validateHeadSha(operation.headSha),
      };
    default:
      fail('Operation is not allowlisted.');
  }
}

export function parseCliOperation(argv) {
  const [kind, ...args] = argv;
  switch (kind) {
    case 'git-push':
      if (args.length === 1) return validateOperation({ kind, branch: args[0] });
      break;
    case 'pr-create':
      if (args.length === 3) return validateOperation({ kind, head: args[0], title: args[1], body: args[2] });
      break;
    case 'pr-edit':
      if (args.length === 3) return validateOperation({ kind, number: args[0], title: args[1], body: args[2] });
      break;
    case 'evidence-upsert':
      if (args.length === 2) return validateOperation({ kind, number: args[0], body: args[1] });
      break;
    case 'pr-merge':
      if (args.length === 2) return validateOperation({ kind, number: args[0], headSha: args[1] });
      break;
    default:
      break;
  }
  fail('Command arguments do not match an allowlisted operation.');
}

export async function parseCliOperationFromFiles(argv, readFile = fs.readFile) {
  const marker = argv.indexOf('--body-file');
  if (marker < 0) return parseCliOperation(argv);
  if (marker !== argv.length - 2 || !['pr-create', 'pr-edit', 'evidence-upsert'].includes(argv[0])) {
    fail('Body-file command arguments are invalid.');
  }
  const bodyPath = argv.at(-1);
  if (!path.isAbsolute(bodyPath)) fail('Body file path must be absolute.');
  let body;
  try {
    body = await readFile(bodyPath, 'utf8');
  } catch {
    fail('Body file could not be read.');
  }
  if (!isNonEmptyString(body) || Buffer.byteLength(body, 'utf8') > 64 * 1024) fail('Body file is empty or too large.');
  return parseCliOperation([...argv.slice(0, marker), body]);
}

export function buildGitEnvironment(token, executable) {
  if (!isNonEmptyString(token)) fail('Installation token is unavailable.');
  const credential = Buffer.from(`x-access-token:${token}`).toString('base64');
  const executableDirectory = path.dirname(executable);
  return {
    PATH: executableDirectory,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_CONFIG_COUNT: '7',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${credential}`,
    GIT_CONFIG_KEY_1: 'credential.helper',
    GIT_CONFIG_VALUE_1: '',
    GIT_CONFIG_KEY_2: 'core.hooksPath',
    GIT_CONFIG_VALUE_2: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_CONFIG_KEY_3: 'protocol.allow',
    GIT_CONFIG_VALUE_3: 'never',
    GIT_CONFIG_KEY_4: 'protocol.https.allow',
    GIT_CONFIG_VALUE_4: 'always',
    GIT_CONFIG_KEY_5: 'http.followRedirects',
    GIT_CONFIG_VALUE_5: 'false',
    GIT_CONFIG_KEY_6: 'core.fsmonitor',
    GIT_CONFIG_VALUE_6: 'false',
    GIT_TERMINAL_PROMPT: '0',
    GIT_ASKPASS: process.platform === 'win32' ? 'NUL' : '/bin/false',
    GIT_PAGER: 'cat',
    PAGER: 'cat',
    EDITOR: 'false',
    VISUAL: 'false',
    SYSTEMROOT: process.env.SYSTEMROOT ?? process.env.SystemRoot ?? '',
    SystemRoot: process.env.SystemRoot ?? process.env.SYSTEMROOT ?? '',
  };
}

export function buildGhEnvironment(token, executable, configDirectory, gitExecutable = executable) {
  if (!isNonEmptyString(token)) fail('Installation token is unavailable.');
  return {
    PATH: [...new Set([path.dirname(executable), path.dirname(gitExecutable)])].join(path.delimiter),
    GH_TOKEN: token,
    GH_HOST: 'github.com',
    GH_CONFIG_DIR: configDirectory,
    GH_PROMPT_DISABLED: '1',
    GH_NO_UPDATE_NOTIFIER: '1',
    GIT_TERMINAL_PROMPT: '0',
    GIT_PAGER: 'cat',
    PAGER: 'cat',
    EDITOR: 'false',
    VISUAL: 'false',
    SYSTEMROOT: process.env.SYSTEMROOT ?? process.env.SystemRoot ?? '',
    SystemRoot: process.env.SystemRoot ?? process.env.SYSTEMROOT ?? '',
  };
}

export function buildChildCommand(operation) {
  switch (operation.kind) {
    case 'git-push':
      return ['push', `https://github.com/${REPOSITORY}.git`, `HEAD:refs/heads/${operation.branch}`];
    case 'pr-create':
      return ['pr', 'create', '--repo', REPOSITORY, '--head', operation.head, '--base', PROTECTED_BASE, '--title', operation.title, '--body', operation.body];
    case 'pr-edit':
      return ['pr', 'edit', operation.number, '--repo', REPOSITORY, '--base', PROTECTED_BASE, '--title', operation.title, '--body', operation.body];
    case 'evidence-upsert':
      fail('Evidence upsert uses the fixed GitHub API adapter.');
      break;
    case 'pr-merge':
      return ['pr', 'merge', operation.number, '--repo', REPOSITORY, '--squash', '--match-head-commit', operation.headSha];
    default:
      fail('Operation is not allowlisted.');
  }
}

export function isExpectedRemote(remoteUrl) {
  return remoteUrl.trim() === `https://github.com/${REPOSITORY}.git`;
}

export function assertPullRequestTarget(details, expectedHeadSha) {
  if (!details || details.baseRefName !== PROTECTED_BASE || !CODEx_BRANCH.test(details.headRefName ?? '')) {
    fail('Pull request is outside the allowlisted repository flow.');
  }
  if (expectedHeadSha && details.headRefOid !== expectedHeadSha) {
    fail('Pull request head no longer matches the approved operation.');
  }
}

async function responseJson(response) {
  if (!response || !response.ok) {
    const retryable = response?.status === 429 || Number(response?.status) >= 500;
    throw new LauncherError('GitHub App verification failed.', {
      code: retryable ? 'github_unavailable' : 'github_rejected', retryable,
    });
  }
  try {
    return await response.json();
  } catch {
    fail('GitHub App verification failed.');
  }
}

async function githubJson(fetchImpl, pathname, init) {
  let response;
  try {
    response = await fetchImpl(`${API_ORIGIN}${pathname}`, init);
  } catch {
    fail('GitHub App verification failed.');
  }
  return responseJson(response);
}

function jwtHeaders(jwt) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${jwt}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function installationHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export function validateAppAndInstallation(app, installation) {
  if (app?.id !== APP_ID || app?.owner?.login !== OWNER) fail('GitHub App verification failed.');
  if (installation?.id !== INSTALLATION_ID || installation?.app_id !== APP_ID || installation?.account?.login !== OWNER) {
    fail('GitHub App installation verification failed.');
  }
  const permissions = installation.permissions ?? {};
  const permissionEntries = Object.entries(permissions);
  if (installation.repository_selection !== 'selected'
    || permissionEntries.some(([name, value]) => ALLOWED_TOKEN_PERMISSIONS.get(name) !== value)
    || permissions.contents !== 'write' || permissions.pull_requests !== 'write') {
    fail('GitHub App installation scope or permissions are invalid.');
  }
}

export function validateInstallationToken(tokenResponse) {
  if (!isNonEmptyString(tokenResponse?.token)) fail('Installation token could not be minted.');
  for (const [permission, value] of Object.entries(tokenResponse.permissions ?? {})) {
    if (ALLOWED_TOKEN_PERMISSIONS.get(permission) !== value) {
      fail('Installation token permissions are broader than allowed.');
    }
  }
  if (tokenResponse.permissions?.contents !== 'write' || tokenResponse.permissions?.pull_requests !== 'write') {
    fail('Installation token permissions are insufficient.');
  }
  return tokenResponse.token;
}

export function validateTokenRepositories(payload) {
  const repositories = payload?.repositories;
  if (!Array.isArray(repositories) || repositories.length !== 1 || payload?.total_count !== 1) {
    fail('Installation token repository scope is invalid.');
  }
  const [repository] = repositories;
  if (repository?.full_name !== REPOSITORY || repository?.private !== true) {
    fail('Installation token repository scope is invalid.');
  }
}

export async function mintInstallationToken({ fetchImpl = fetch, jwt, timeoutMs = 15_000 }) {
  const request = (pathname, init = {}) => githubJson(fetchImpl, pathname, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
  const app = await request('/app', { headers: jwtHeaders(jwt) });
  const installation = await request(`/app/installations/${INSTALLATION_ID}`, { headers: jwtHeaders(jwt) });
  validateAppAndInstallation(app, installation);

  const tokenResponse = await request(`/app/installations/${INSTALLATION_ID}/access_tokens`, {
    method: 'POST',
    headers: { ...jwtHeaders(jwt), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repositories: [REPOSITORY_NAME],
      permissions: { contents: 'write', pull_requests: 'write' },
    }),
  });
  const rawToken = tokenResponse?.token;
  try {
    const token = validateInstallationToken(tokenResponse);
    const repositories = await request('/installation/repositories?per_page=100', {
      headers: installationHeaders(token),
    });
    validateTokenRepositories(repositories);
    return token;
  } catch (error) {
    if (isNonEmptyString(rawToken)) {
      try { await revokeInstallationToken({ fetchImpl, token: rawToken, timeoutMs }); } catch {}
    }
    throw error;
  }
}

export async function revokeInstallationToken({ fetchImpl = fetch, token, timeoutMs = 15_000 }) {
  if (!isNonEmptyString(token)) return;
  try {
    const response = await fetchImpl(`${API_ORIGIN}/installation/token`, {
      method: 'DELETE',
      headers: installationHeaders(token),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response?.ok && response?.status !== 404) throw new Error('revocation failed');
  } catch {
    throw new LauncherError('GitHub App token cleanup failed.');
  }
}

export function spawnCommand(executable, args, options = {}, spawnImpl = spawn) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(executable, args, { ...options, shell: false, windowsHide: true });
    } catch {
      reject(new LauncherError('Allowlisted command could not start.'));
      return;
    }
    let stdout = '';
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGKILL'); } catch {}
      reject(new LauncherError('Allowlisted command timed out.', { code: 'command_timeout', retryable: false, mutationCompleted: null }));
    }, options.timeoutMs ?? 120_000);
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new LauncherError('Allowlisted command could not start.', { code: 'command_start_failed' }));
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) resolve({ stdout });
      else reject(new LauncherError('Allowlisted command failed.', { code: 'command_failed', mutationCompleted: null }));
    });
  });
}

async function verifyGitRemote({ runChild, gitExecutable, cwd }) {
  const environment = buildGitEnvironment('verification-only', gitExecutable);
  const [fetchRemote, pushRemote] = await Promise.all([
    runChild(gitExecutable, ['remote', 'get-url', 'origin'], { env: environment, cwd }),
    runChild(gitExecutable, ['remote', 'get-url', '--push', 'origin'], { env: environment, cwd }),
  ]);
  if (!isExpectedRemote(fetchRemote.stdout ?? '') || !isExpectedRemote(pushRemote.stdout ?? '')) {
    fail('Git origin is not the allowlisted GitHub repository.');
  }
}

function dangerousLocalConfig(source) {
  return source.split(/\r?\n/).some((line) => {
    const key = line.replace(/^file:[^\t]*\t/, '').split(/[=\s]/, 1)[0].toLowerCase();
    if (key === 'remote.origin.url') return false;
    return /^(?:url\.|http\.|credential\.|protocol\.|alias\.|include(?:if)?\.|filter\.)/.test(key)
      || /(?:\.pushurl|\.receivepack|\.uploadpack)$/.test(key)
      || ['core.hookspath', 'core.fsmonitor', 'core.sshcommand', 'core.gitproxy', 'core.pager'].includes(key);
  });
}

async function repositoryProof({ runChild, gitExecutable, cwd }) {
  await verifyGitRemote({ runChild, gitExecutable, cwd });
  const environment = buildGitEnvironment('verification-only', gitExecutable)
  const [branch, head, status, config] = await Promise.all([
    runChild(gitExecutable, ['rev-parse', '--abbrev-ref', 'HEAD'], { env: environment, cwd }),
    runChild(gitExecutable, ['rev-parse', 'HEAD'], { env: environment, cwd }),
    runChild(gitExecutable, ['status', '--porcelain'], { env: environment, cwd }),
    runChild(gitExecutable, ['config', '--local', '--list', '--show-origin'], { env: environment, cwd }),
  ])
  const headSha = (head.stdout ?? '').trim()
  if (!SHA.test(headSha) || (status.stdout ?? '').trim() !== '' || dangerousLocalConfig(config.stdout ?? '')) {
    fail('Repository checkout or local Git configuration is not trusted.')
  }
  return {
    branch: (branch.stdout ?? '').trim(),
    headSha,
    config: (config.stdout ?? '').trim(),
  };
}

export async function verifyTrustedRecoveryCheckout({ runChild, gitExecutable, sourceRoot }) {
  const proof = await repositoryProof({ runChild, gitExecutable, cwd: sourceRoot });
  const environment = buildGitEnvironment('verification-only', gitExecutable);
  const remoteRecovery = await runChild(gitExecutable, ['rev-parse', 'refs/remotes/origin/recovery'], { env: environment, cwd: sourceRoot });
  if (proof.branch !== PROTECTED_BASE || proof.headSha !== (remoteRecovery.stdout ?? '').trim()) {
    fail('Launcher source is not the clean exact local origin/recovery checkout.');
  }
  return proof;
}

async function verifyOperationCheckout({ runChild, gitExecutable, operation, cwd = process.cwd() }) {
  const proof = await repositoryProof({ runChild, gitExecutable, cwd });
  if (operation.kind === 'git-push' && proof.branch !== operation.branch) fail('Git push branch does not match the current checkout.');
  if (operation.kind === 'pr-create' && proof.branch !== operation.head) fail('Pull request head does not match the current checkout.');
  if (proof.branch !== PROTECTED_BASE && !CODEx_BRANCH.test(proof.branch)) fail('Operation checkout branch is not allowlisted.');
  return proof;
}

async function verifyPullRequest({ runChild, ghExecutable, ghEnvironment, operation }) {
  if (operation.kind === 'pr-create') return;
  const fields = operation.kind === 'pr-merge'
    ? 'baseRefName,headRefName,headRefOid,state,isDraft,mergeStateStatus,statusCheckRollup'
    : 'baseRefName,headRefName,headRefOid';
  const result = await runChild(ghExecutable, ['pr', 'view', operation.number, '--repo', REPOSITORY, '--json', fields], {
    env: ghEnvironment,
  });
  let details;
  try {
    details = JSON.parse(result.stdout);
  } catch {
    fail('Pull request verification failed.');
  }
  assertPullRequestTarget(details, operation.kind === 'pr-merge' ? operation.headSha : undefined);
  if (operation.kind === 'pr-merge') assertMergeReady(details);
  return details;
}

function assertMergeReady(details) {
  if (details?.state !== 'OPEN' || details?.isDraft === true) {
    throw new LauncherError('Pull request is not open and ready for merge.', { code: 'merge_not_open' });
  }
  const checks = Array.isArray(details.statusCheckRollup) ? details.statusCheckRollup : [];
  const pending = checks.some((check) => (
    (check?.status && check.status !== 'COMPLETED')
    || ['PENDING', 'EXPECTED'].includes(check?.state)
  ));
  if (pending || details.mergeStateStatus === 'UNKNOWN') {
    throw new LauncherError('Required merge checks are still pending.', {
      code: 'merge_checks_pending', retryable: true, mutationCompleted: false,
    });
  }
  const failed = checks.some((check) => (
    (check?.status === 'COMPLETED' && !['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(check?.conclusion))
    || (check?.state && check.state !== 'SUCCESS')
  ));
  if (failed) throw new LauncherError('A required merge check failed.', { code: 'merge_checks_failed' });
}

async function pullRequestResource({ runChild, ghExecutable, ghEnvironment, operation }) {
  const number = operation.number ?? operation.head;
  const result = await runChild(ghExecutable, ['pr', 'view', number, '--repo', REPOSITORY, '--json', 'number,url,headRefName,headRefOid,state,mergeStateStatus'], {
    env: ghEnvironment,
  });
  try {
    const value = JSON.parse(result.stdout);
    return {
      number: value.number,
      url: value.url,
      head: value.headRefName,
      headSha: value.headRefOid,
      state: value.state,
      mergeState: value.mergeStateStatus,
    };
  } catch {
    fail('Pull request result could not be verified.');
  }
}

function normalizedPullResource(value) {
  return {
    number: value.number,
    url: value.url,
    head: value.headRefName,
    headSha: value.headRefOid,
    state: value.state,
    mergeState: value.mergeStateStatus,
  };
}

async function findCreatedPullRequest({ runChild, ghExecutable, ghEnvironment, operation, expectedHeadSha }) {
  const result = await runChild(ghExecutable, [
    'pr', 'list', '--repo', REPOSITORY, '--state', 'open', '--base', PROTECTED_BASE, '--head', operation.head,
    '--json', 'number,url,baseRefName,headRefName,headRefOid,state,mergeStateStatus,title,body',
  ], { env: ghEnvironment });
  let values;
  try {
    values = JSON.parse(result.stdout);
  } catch {
    fail('Pull request creation result could not be listed.');
  }
  if (!Array.isArray(values) || values.length > 1) fail('Pull request creation result is ambiguous.');
  if (values.length === 0) return null;
  const value = values[0];
  if (value.baseRefName !== PROTECTED_BASE || value.headRefName !== operation.head
    || value.headRefOid !== expectedHeadSha || value.state !== 'OPEN'
    || value.title !== operation.title || value.body !== operation.body) {
    throw new LauncherError('An existing pull request conflicts with the requested creation.', {
      code: 'pr_create_conflict', resource: normalizedPullResource(value),
    });
  }
  return normalizedPullResource(value);
}

async function reconcilePullRequestEdit({ runChild, ghExecutable, ghEnvironment, operation }) {
  const result = await runChild(ghExecutable, [
    'pr', 'view', operation.number, '--repo', REPOSITORY,
    '--json', 'number,url,baseRefName,headRefName,headRefOid,state,mergeStateStatus,title,body',
  ], { env: ghEnvironment });
  let value;
  try {
    value = JSON.parse(result.stdout);
  } catch {
    fail('Pull request edit result could not be verified.');
  }
  assertPullRequestTarget(value);
  if (value.title !== operation.title || value.body !== operation.body) return null;
  return normalizedPullResource(value);
}

async function reconcileMergeFailure({ runChild, ghExecutable, ghEnvironment, operation }) {
  let resource;
  try {
    resource = await pullRequestResource({ runChild, ghExecutable, ghEnvironment, operation });
  } catch {
    return null;
  }
  if (resource.headSha !== operation.headSha) {
    throw new LauncherError('Pull request head changed during merge.', {
      code: 'stale_head', retryable: false, mutationCompleted: false, resource,
    });
  }
  if (resource.state === 'MERGED') return resource;
  return null;
}

async function upsertEvidenceComment({ fetchImpl, token, operation, timeoutMs = 15_000 }) {
  const request = async (pathname, init = {}) => githubJson(fetchImpl, pathname, {
    ...init,
    headers: { ...installationHeaders(token), ...(init.headers ?? {}) },
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
  const pull = await request(`/repos/${REPOSITORY}/pulls/${operation.number}`);
  if (pull?.state !== 'open' || pull?.base?.ref !== PROTECTED_BASE || pull?.base?.repo?.full_name !== REPOSITORY
    || pull?.head?.repo?.full_name !== REPOSITORY || !CODEx_BRANCH.test(pull?.head?.ref ?? '')) {
    fail('Review evidence target is outside the allowlisted pull request flow.');
  }
  const listMarked = async () => {
    const comments = [];
    for (let page = 1; page <= 100; page += 1) {
      const values = await request(`/repos/${REPOSITORY}/issues/${operation.number}/comments?per_page=100&page=${page}`);
      if (!Array.isArray(values)) fail('Review evidence comments are unavailable.');
      comments.push(...values);
      if (values.length < 100) break;
      if (page === 100) fail('Review evidence comment list is too large.');
    }
    const marked = comments.filter(({ body }) => typeof body === 'string' && body.includes(EVIDENCE_MARKER));
    if (marked.some(({ user }) => user?.login !== REVIEW_APP_AUTHOR)) fail('A foreign review evidence marker requires owner repair.');
    if (marked.length > 1) fail('Multiple review evidence comments require owner repair.');
    return marked;
  };
  const marked = await listMarked();
  const payload = { body: operation.body };
  let comment;
  try {
    comment = marked.length === 1
      ? await request(`/repos/${REPOSITORY}/issues/comments/${marked[0].id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      : await request(`/repos/${REPOSITORY}/issues/${operation.number}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
  } catch (error) {
    const failure = error instanceof LauncherError ? error : new LauncherError();
    try {
      const reconciled = await listMarked();
      if (reconciled.length === 1 && reconciled[0].body === operation.body) {
        return { commentId: reconciled[0].id, url: reconciled[0].html_url, reconciled: true };
      }
    } catch {}
    throw new LauncherError('Review evidence mutation result is unknown.', {
      code: failure.code, retryable: true, mutationCompleted: null, resource: { pullRequest: Number(operation.number) },
    });
  }
  if (!Number.isInteger(comment?.id) || typeof comment?.html_url !== 'string') fail('Review evidence result is invalid.');
  return { commentId: comment.id, url: comment.html_url };
}

export async function runAsInstallation(operationInput, options = {}) {
  const operation = validateOperation(operationInput);
  const environment = options.environment ?? process.env;
  const pemPath = validatePemPath(environment[PEM_PATH_ENV]);
  const gitExecutable = validateExecutablePath(environment[GIT_EXECUTABLE_ENV], 'git');
  const ghExecutable = validateExecutablePath(environment[GH_EXECUTABLE_ENV], 'gh');
  const fetchImpl = options.fetchImpl ?? fetch;
  const runChild = options.runChild ?? spawnCommand;
  const readFile = options.readFile ?? fs.readFile;
  const makeTempDirectory = options.makeTempDirectory ?? fs.mkdtemp;
  const removeDirectory = options.removeDirectory ?? fs.rm;
  const sourceRoot = options.sourceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const operationCwd = options.operationCwd ?? process.cwd();
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (pathIsInside(sourceRoot, pemPath) || pathIsInside(operationCwd, pemPath)) {
    fail('GitHub App private key must remain outside repository worktrees.');
  }
  let token;
  let operationError;
  let mutationResult;

  try {
    const sourceProof = options.trustedSourceProof
      ? await options.trustedSourceProof({ runChild, gitExecutable, sourceRoot })
      : await verifyTrustedRecoveryCheckout({ runChild, gitExecutable, sourceRoot });
    if (!sourceProof || !SHA.test(sourceProof.headSha ?? '')) fail('Trusted launcher source proof failed.');
    const checkoutProof = options.operationCheckoutProof
      ? await options.operationCheckoutProof({ runChild, gitExecutable, operation, cwd: operationCwd })
      : await verifyOperationCheckout({ runChild, gitExecutable, operation, cwd: operationCwd });

    if (operation.kind === 'pr-merge' && typeof options.currentStatePreflight !== 'function') {
      fail('Immediate merge requires a current GitHub-state preflight.');
    }

    let privateKey;
    try {
      privateKey = await readFile(pemPath, 'utf8');
    } catch {
      fail('GitHub App private key could not be read.');
    }
    token = await mintInstallationToken({ fetchImpl, jwt: createAppJwt(privateKey, options.now ?? Date.now()), timeoutMs });

    const currentCheckoutProof = options.operationCheckoutProof
      ? await options.operationCheckoutProof({ runChild, gitExecutable, operation, cwd: operationCwd })
      : await verifyOperationCheckout({ runChild, gitExecutable, operation, cwd: operationCwd });
    if (JSON.stringify(currentCheckoutProof) !== JSON.stringify(checkoutProof)) fail('Repository checkout changed after credential minting.');

    if (operation.kind === 'pr-merge') {
      let currentApproved
      try {
        currentApproved = await options.currentStatePreflight({
          repository: REPOSITORY,
          base: PROTECTED_BASE,
          number: operation.number,
          headSha: operation.headSha,
          token,
          sourceRoot,
          trustedBaseSha: sourceProof.headSha,
        })
      } catch {
        fail('Immediate merge current-state preflight failed.')
      }
      if (currentApproved !== true) fail('Immediate merge current GitHub state is not approved.')
    }

    if (operation.kind === 'git-push') {
      try {
        await runChild(gitExecutable, buildChildCommand(operation), {
          env: buildGitEnvironment(token, gitExecutable),
          cwd: operationCwd,
        });
      } catch {
        throw new LauncherError('Git push result is not yet known.', {
          code: 'git_push_result_unknown', retryable: true, mutationCompleted: null,
          resource: { branch: operation.branch, headSha: checkoutProof.headSha },
        });
      }
      mutationResult = { ok: true, kind: operation.kind, repository: REPOSITORY, branch: operation.branch, headSha: checkoutProof.headSha };
      return mutationResult;
    }

    if (operation.kind === 'evidence-upsert') {
      const resource = await upsertEvidenceComment({ fetchImpl, token, operation, timeoutMs });
      mutationResult = { ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: Number(operation.number), ...resource };
      return mutationResult;
    }

    const ghConfigDirectory = await makeTempDirectory(path.join(os.tmpdir(), 'zzz-workbench-gh-'));
    try {
      const ghEnvironment = buildGhEnvironment(token, ghExecutable, ghConfigDirectory, gitExecutable);
      if (operation.kind === 'pr-create') {
        let existing;
        try {
          existing = await findCreatedPullRequest({
            runChild, ghExecutable, ghEnvironment, operation, expectedHeadSha: checkoutProof.headSha,
          });
        } catch (lookupError) {
          if (lookupError instanceof LauncherError && lookupError.code === 'pr_create_conflict') throw lookupError;
          throw new LauncherError('Pull request creation lookup is temporarily unavailable.', {
            code: 'pr_create_lookup_unavailable', retryable: true, mutationCompleted: false,
            resource: { head: operation.head, headSha: checkoutProof.headSha },
          });
        }
        if (existing) {
          mutationResult = {
            ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: existing, reconciled: true,
          };
          return mutationResult;
        }
      }
      await verifyPullRequest({ runChild, ghExecutable, ghEnvironment, operation });
      try {
        await runChild(ghExecutable, buildChildCommand(operation), { env: ghEnvironment, cwd: operationCwd });
        const resource = await pullRequestResource({ runChild, ghExecutable, ghEnvironment, operation });
        mutationResult = { ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: resource };
        return mutationResult;
      } catch (error) {
        if (operation.kind === 'pr-create') {
          let reconciled;
          try {
            reconciled = await findCreatedPullRequest({
              runChild, ghExecutable, ghEnvironment, operation, expectedHeadSha: checkoutProof.headSha,
            });
          } catch (reconciliationError) {
            if (reconciliationError instanceof LauncherError && reconciliationError.code === 'pr_create_conflict') {
              throw reconciliationError;
            }
            throw new LauncherError('Pull request creation result is not yet known.', {
              code: 'pr_create_result_unknown', retryable: true, mutationCompleted: null,
              resource: { head: operation.head, headSha: checkoutProof.headSha },
            });
          }
          if (reconciled) {
            mutationResult = {
              ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: reconciled, reconciled: true,
            };
            return mutationResult;
          }
          throw new LauncherError('Pull request creation result is not yet known.', {
            code: 'pr_create_result_unknown', retryable: true, mutationCompleted: null,
            resource: { head: operation.head, headSha: checkoutProof.headSha },
          });
        }
        if (operation.kind === 'pr-edit') {
          let reconciled;
          try {
            reconciled = await reconcilePullRequestEdit({ runChild, ghExecutable, ghEnvironment, operation });
          } catch {}
          if (reconciled) {
            mutationResult = {
              ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: reconciled, reconciled: true,
            };
            return mutationResult;
          }
          throw new LauncherError('Pull request edit result is not yet known.', {
            code: 'pr_edit_result_unknown', retryable: true, mutationCompleted: null,
            resource: { pullRequest: Number(operation.number) },
          });
        }
        if (operation.kind !== 'pr-merge') throw error;
        const reconciled = await reconcileMergeFailure({ runChild, ghExecutable, ghEnvironment, operation });
        if (!reconciled) {
          throw new LauncherError('Immediate merge result is not yet known.', {
            code: 'merge_result_unknown', retryable: true, mutationCompleted: null,
            resource: { pullRequest: Number(operation.number), headSha: operation.headSha },
          });
        }
        mutationResult = { ok: true, kind: operation.kind, repository: REPOSITORY, pullRequest: reconciled, reconciled: true };
        return mutationResult;
      }
    } finally {
      await removeDirectory(ghConfigDirectory, { recursive: true, force: true });
    }
  } catch (error) {
    operationError = error;
    if (mutationResult) {
      throw new LauncherError('Local post-mutation cleanup failed.', {
        code: 'local_cleanup_failed', retryable: false, mutationCompleted: true, resource: mutationResult,
      });
    }
    if (error instanceof LauncherError) throw error;
    throw new LauncherError('GitHub App operation failed.');
  } finally {
    if (token) {
      try {
        await revokeInstallationToken({ fetchImpl, token, timeoutMs });
      } catch (revokeError) {
        if (!operationError) {
          throw new LauncherError('GitHub App token cleanup failed.', {
            code: 'token_cleanup_failed', retryable: false, mutationCompleted: Boolean(mutationResult), resource: mutationResult,
          });
        }
      }
    }
  }
}

async function main() {
  try {
    const operation = await parseCliOperationFromFiles(process.argv.slice(2))
    const options = operation.kind === 'pr-merge' ? {
      currentStatePreflight: async ({ number, headSha, token, sourceRoot, trustedBaseSha }) => {
        const { evaluateMergePreflight } = await import('../governance/trusted-github.mjs')
        const { snapshot } = await evaluateMergePreflight({
          prNumber: Number(number), token, root: sourceRoot, trustedBaseSha,
        })
        return snapshot.baseSha === trustedBaseSha && snapshot.headSha === headSha
      },
    } : {}
    const result = await runAsInstallation(operation, options)
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    const failure = error instanceof LauncherError ? error : new LauncherError();
    process.stderr.write(`${JSON.stringify({
      ok: false,
      code: failure.code,
      retryable: failure.retryable,
      mutationCompleted: failure.mutationCompleted,
      resource: failure.resource,
    })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
