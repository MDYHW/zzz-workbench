import { createHash, createSign } from 'node:crypto'
import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const GITHUB_API_ORIGIN = 'https://api.github.com'
export const GITHUB_API_VERSION = '2026-03-10'
export const GITHUB_CONFIG_SCHEMA = 'zzz-workbench-public-release-github/v1'
export const INSTALLATION_TOKEN_ENV = 'ZZZ_WORKBENCH_PUBLIC_RELEASE_INSTALLATION_TOKEN'
export const PUBLIC_BRANCH_RULESET_NAME = 'Protect published artifact'
export const FIXED_CHILD_SCHEMA = 'zzz-workbench-public-release-github-child/v1'
export const FIXED_CHILD_RESULT_SCHEMA = 'zzz-workbench-public-release-github-child-result/v1'
export const FIXED_CHILD_MODE = '--public-release-fixed-child'
export const PUBLICATION_MUTATION_INTERVAL_MS = 1_000
export const PUBLICATION_MAX_RATE_LIMIT_RETRIES = 2
export const PUBLICATION_CHILD_TIMEOUT_MS = 15 * 60_000
const PUBLICATION_REQUEST_TIMEOUT_MS = 10_000

const REQUEST_TIMEOUT_MS = Symbol('request-timeout-ms')

export const FIXED_CHILD_OPERATIONS = Object.freeze({
  bootstrap: Object.freeze({ role: 'bootstrap', phase: 'bootstrap', destinationState: 'absent' }),
  publish: Object.freeze({ role: 'publisher', phase: 'publisher', destinationState: 'present' }),
  'disable-pages': Object.freeze({ role: 'stop', phase: 'stop', destinationState: 'present' }),
})

export const APP_PERMISSION_PROFILES = Object.freeze({
  bootstrap: Object.freeze({
    administration: 'write',
    contents: 'write',
    metadata: 'read',
    pages: 'write',
  }),
  stop: Object.freeze({
    metadata: 'read',
    pages: 'write',
  }),
  publisher: Object.freeze({
    contents: 'write',
    metadata: 'read',
  }),
})

const SHA1 = /^[0-9a-f]{40}$/
const SHA256_IDENTITY = /^sha256:[0-9a-f]{64}$/
const SAFE_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const SAFE_REPOSITORY = /^[A-Za-z0-9._-]+$/
const SAFE_BRANCH = /^(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\.\.)(?!.*\/\/)[A-Za-z0-9][A-Za-z0-9._/-]*$/
const SAFE_BOT = /^[A-Za-z0-9][A-Za-z0-9-]*\[bot\]$/
const FILE_MODE = '100644'
const MAX_INSTALLATION_TOKEN_BYTES = 8 * 1024
const PUBLICATION_REQUEST_BUDGETS = Object.freeze({
  bootstrap: Object.freeze({ fixedMutations: 9, reads: 18 }),
  publish: Object.freeze({ fixedMutations: 4, reads: 18 }),
  'disable-pages': Object.freeze({ fixedMutations: 2, reads: 18 }),
})

export class PublicReleaseGithubError extends Error {
  constructor(message = 'GitHub publication failed.', {
    code = 'github_publication_failed',
    state = 'failed',
    resource = null,
  } = {}) {
    super(message)
    this.name = 'PublicReleaseGithubError'
    this.code = code
    this.state = state
    this.resource = resource
  }
}

function fail(message, details) {
  throw new PublicReleaseGithubError(message, details)
}

function isOpaqueInstallationToken(value) {
  return typeof value === 'string' && value.length > 0
    && Buffer.byteLength(value, 'utf8') <= MAX_INSTALLATION_TOKEN_BYTES
    && !/[\u0000-\u001f\u007f-\u009f]/u.test(value)
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function exactKeys(value, expected, label) {
  if (!isPlainObject(value)) fail(`${label} is invalid.`, { code: 'github_config_invalid' })
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} schema is invalid.`, { code: 'github_config_invalid' })
  }
}

function requiredString(value, label, pattern) {
  if (typeof value !== 'string' || value.length === 0 || /[\r\n\0]/.test(value)
      || (pattern && !pattern.test(value))) {
    fail(`${label} is invalid.`, { code: 'github_config_invalid' })
  }
  return value
}

function requiredPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(`${label} is invalid.`, { code: 'github_config_invalid' })
  }
  return value
}

function normalizedPath(value) {
  return path.resolve(value).replace(/[\\/]+$/, '').toLowerCase()
}

function pathInside(candidate, root) {
  const child = normalizedPath(candidate)
  const parent = normalizedPath(root)
  return child === parent || child.startsWith(`${parent}${path.sep}`)
}

function validateAppConfig(app, label, forbiddenRoots) {
  exactKeys(app, ['appId', 'installationId', 'owner', 'botLogin', 'keyPath'], `${label} App`)
  requiredPositiveInteger(app.appId, `${label} App ID`)
  requiredPositiveInteger(app.installationId, `${label} installation ID`)
  requiredString(app.owner, `${label} App owner`, SAFE_LOGIN)
  requiredString(app.botLogin, `${label} bot login`, SAFE_BOT)
  requiredString(app.keyPath, `${label} key path`)
  if (!path.isAbsolute(app.keyPath) || path.extname(app.keyPath).toLowerCase() !== '.pem'
      || forbiddenRoots.some((root) => pathInside(app.keyPath, root))) {
    fail(`${label} key path must be an external absolute PEM path.`, { code: 'github_config_invalid' })
  }
}

export function validateGithubConfig(config, { forbiddenRoots = [] } = {}) {
  exactKeys(config, [
    'schema', 'apiVersion', 'destination', 'apps', 'allowedPublicActors', 'forbiddenPrivateIdentifiers',
  ], 'GitHub configuration')
  if (config.schema !== GITHUB_CONFIG_SCHEMA || config.apiVersion !== GITHUB_API_VERSION) {
    fail('GitHub configuration version is invalid.', { code: 'github_config_invalid' })
  }
  exactKeys(config.destination, ['owner', 'repository', 'branch'], 'Destination')
  const owner = requiredString(config.destination.owner, 'Destination owner', SAFE_LOGIN)
  const repository = requiredString(config.destination.repository, 'Destination repository', SAFE_REPOSITORY)
  requiredString(config.destination.branch, 'Destination branch', SAFE_BRANCH)
  if (repository.toLowerCase() !== `${owner.toLowerCase()}.github.io`) {
    fail('Destination must be the Organization root Pages repository.', { code: 'github_config_invalid' })
  }
  exactKeys(config.apps, ['bootstrap', 'publisher'], 'GitHub Apps')
  validateAppConfig(config.apps.bootstrap, 'Bootstrap', forbiddenRoots)
  validateAppConfig(config.apps.publisher, 'Publisher', forbiddenRoots)
  if (config.apps.bootstrap.appId === config.apps.publisher.appId
      || config.apps.bootstrap.installationId === config.apps.publisher.installationId
      || normalizedPath(config.apps.bootstrap.keyPath) === normalizedPath(config.apps.publisher.keyPath)) {
    fail('Bootstrap and publisher App identities must be separate.', { code: 'github_config_invalid' })
  }
  for (const [label, values] of [
    ['Allowed public actors', config.allowedPublicActors],
    ['Forbidden private identifiers', config.forbiddenPrivateIdentifiers],
  ]) {
    if (!Array.isArray(values) || values.length === 0
        || values.some((value) => typeof value !== 'string' || value.length === 0 || /[\r\n\0]/.test(value))
        || new Set(values.map((value) => value.toLowerCase())).size !== values.length) {
      fail(`${label} are invalid.`, { code: 'github_config_invalid' })
    }
  }
  for (const bot of [config.apps.bootstrap.botLogin, config.apps.publisher.botLogin]) {
    if (!config.allowedPublicActors.some((actor) => actor.toLowerCase() === bot.toLowerCase())) {
      fail('Configured App actors must be explicitly allowed.', { code: 'github_config_invalid' })
    }
  }
  const publicValues = [owner, repository, ...config.allowedPublicActors]
  if (config.forbiddenPrivateIdentifiers.some((privateValue) => publicValues.some((value) => (
    value.toLowerCase().includes(privateValue.toLowerCase())
      || privateValue.toLowerCase().includes(value.toLowerCase())
  )))) {
    fail('Public and private identities overlap.', { code: 'github_config_invalid' })
  }
  return config
}

export function githubConfigIdentity(value) {
  const config = validateGithubConfig(value)
  return {
    digest: `sha256:${createHash('sha256').update(canonicalJson(config)).digest('hex')}`,
    destination: { ...config.destination },
    apps: Object.fromEntries(['bootstrap', 'publisher'].map((role) => [role, {
      appId: config.apps[role].appId,
      installationId: config.apps[role].installationId,
      owner: config.apps[role].owner,
      botLogin: config.apps[role].botLogin,
    }])),
  }
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

export function createGithubAppJwt(privateKey, appId, now = Date.now()) {
  if (typeof privateKey !== 'string' || !privateKey.includes('PRIVATE KEY')) {
    fail('GitHub App authentication could not be prepared.', { code: 'github_auth_invalid' })
  }
  requiredPositiveInteger(appId, 'GitHub App ID')
  const nowSeconds = Math.floor(now / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 9 * 60, iss: String(appId) }))
  const input = `${header}.${payload}`
  try {
    const signature = createSign('RSA-SHA256').update(input).end().sign(privateKey).toString('base64url')
    return `${input}.${signature}`
  } catch {
    throw new PublicReleaseGithubError('GitHub App authentication could not be prepared.', {
      code: 'github_auth_invalid',
    })
  }
}

function jwtHeaders(jwt) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${jwt}`,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  }
}

function tokenHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  }
}

async function responseJson(response, resource) {
  try {
    return await response.json()
  } catch {
    fail('GitHub returned an invalid response.', { code: 'github_response_invalid', resource })
  }
}

async function request(fetchImpl, pathname, {
  method = 'GET', headers = {}, body, allowNotFound = false, allowEmptyRepository = false,
  includeResponse = false, timeoutMs = 15_000,
} = {}) {
  let response
  try {
    response = await fetchImpl(`${GITHUB_API_ORIGIN}${pathname}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(timeoutMs),
      [REQUEST_TIMEOUT_MS]: timeoutMs,
    })
  } catch {
    throw new PublicReleaseGithubError('GitHub request outcome is unknown.', {
      code: 'github_request_unknown', state: 'reconcile-required', resource: pathname,
    })
  }
  if (allowNotFound && response.status === 404) return null
  if (allowEmptyRepository && response.status === 409) return null
  if (!response.ok) {
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
    if (mutation && response.status >= 500) {
      throw new PublicReleaseGithubError('GitHub mutation outcome requires reconciliation.', {
        code: 'github_request_unknown', state: 'reconcile-required', resource: pathname,
      })
    }
    fail('GitHub rejected the requested operation.', {
      code: 'github_request_rejected', resource: pathname,
    })
  }
  if (response.status === 204) return includeResponse ? { body: null, response } : null
  const parsed = await responseJson(response, pathname)
  return includeResponse ? { body: parsed, response } : parsed
}

async function mutationRequest(fetchImpl, pathname, options, validate = (value) => value) {
  try {
    return validate(await request(fetchImpl, pathname, options))
  } catch (error) {
    const safe = sanitizeGithubError(error)
    if (safe.code === 'github_request_rejected') throw safe
    throw new PublicReleaseGithubError('GitHub mutation outcome requires reconciliation.', {
      code: 'github_request_unknown', state: 'reconcile-required', resource: pathname,
    })
  }
}

async function rateLimitDelay(response, attempt, now) {
  if (![403, 429].includes(response?.status)) return null
  const retryAfterHeader = response.headers?.get?.('retry-after')
  const remainingHeader = response.headers?.get?.('x-ratelimit-remaining')
  let rateLimited = response.status === 429 || retryAfterHeader !== null || remainingHeader === '0'
  if (!rateLimited && response.status === 403 && typeof response.clone === 'function') {
    try {
      const payload = await response.clone().json()
      rateLimited = typeof payload?.message === 'string' && /(?:rate limit|abuse detection)/i.test(payload.message)
    } catch {
      rateLimited = false
    }
  }
  if (!rateLimited) return null
  const retryAfter = Number(retryAfterHeader)
  const maximumDelay = 60_000 * (2 ** attempt)
  if (retryAfterHeader !== null && Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(Math.ceil(retryAfter * 1_000), maximumDelay)
  }
  if (remainingHeader === '0') {
    const resetAt = Number(response.headers?.get?.('x-ratelimit-reset')) * 1_000
    if (Number.isFinite(resetAt) && resetAt > now()) return Math.min(Math.ceil(resetAt - now()), maximumDelay)
  }
  return maximumDelay
}

export function createRateLimitedFetch(fetchImpl, {
  mutationIntervalMs = PUBLICATION_MUTATION_INTERVAL_MS,
  maxRetries = PUBLICATION_MAX_RATE_LIMIT_RETRIES,
  now = () => Date.now(),
  wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
} = {}) {
  if (typeof fetchImpl !== 'function' || !Number.isSafeInteger(mutationIntervalMs) || mutationIntervalMs < 0
      || !Number.isSafeInteger(maxRetries) || maxRetries < 0 || typeof now !== 'function' || typeof wait !== 'function') {
    fail('GitHub rate-limit transport is invalid.', { code: 'github_transport_invalid' })
  }
  let lastMutationCompletedAt = now()
  let remainingRateLimitRetries = maxRetries
  return async (url, init = {}) => {
    const method = String(init.method ?? 'GET').toUpperCase()
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)
    const attemptTimeoutMs = init[REQUEST_TIMEOUT_MS]
    const fetchInit = { ...init }
    delete fetchInit[REQUEST_TIMEOUT_MS]
    for (let attempt = 0; ; attempt += 1) {
      if (mutation) {
        const remaining = mutationIntervalMs - (now() - lastMutationCompletedAt)
        if (remaining > 0) await wait(remaining)
      }
      const response = await fetchImpl(url, {
        ...fetchInit,
        ...(attemptTimeoutMs === undefined ? {} : { signal: AbortSignal.timeout(attemptTimeoutMs) }),
      })
      if (mutation) lastMutationCompletedAt = now()
      const retryDelay = await rateLimitDelay(response, attempt, now)
      if (retryDelay === null || remainingRateLimitRetries === 0) return response
      remainingRateLimitRetries -= 1
      await wait(retryDelay)
    }
  }
}

function exactPermissions(actual, expected) {
  if (!isPlainObject(actual)) return false
  const actualEntries = Object.entries(actual).filter(([, value]) => value !== undefined).sort()
  const expectedEntries = Object.entries(expected).sort()
  return actualEntries.length === expectedEntries.length
    && actualEntries.every(([key, value], index) => key === expectedEntries[index][0] && value === expectedEntries[index][1])
}

function phaseDetails(config, phase) {
  if (!Object.hasOwn(APP_PERMISSION_PROFILES, phase)) {
    fail('GitHub App phase is not allowlisted.', { code: 'github_phase_invalid' })
  }
  const role = phase === 'publisher' ? 'publisher' : 'bootstrap'
  return { app: config.apps[role], permissions: APP_PERMISSION_PROFILES[phase], role }
}

function validateAppIdentity(appResponse, configured, destinationOwner) {
  if (appResponse?.id !== configured.appId
      || appResponse?.owner?.login?.toLowerCase() !== configured.owner.toLowerCase()
      || configured.owner.toLowerCase() !== destinationOwner.toLowerCase()
      || typeof appResponse?.slug !== 'string'
      || `${appResponse.slug}[bot]`.toLowerCase() !== configured.botLogin.toLowerCase()) {
    fail('GitHub App identity is invalid.', { code: 'github_app_identity_invalid' })
  }
}

function validateInstallation(installation, configured, destinationOwner, permissions) {
  if (installation?.id !== configured.installationId
      || installation?.app_id !== configured.appId
      || installation?.account?.login?.toLowerCase() !== destinationOwner.toLowerCase()
      || installation?.repository_selection !== 'all'
      || !exactPermissions(installation?.permissions, permissions)) {
    fail('GitHub App installation scope or permissions are invalid.', {
      code: 'github_installation_invalid',
    })
  }
}

function validateRepositoryScope(payload, destination, destinationState) {
  const repositories = payload?.repositories
  const validAbsent = destinationState === 'absent'
    && payload?.total_count === 0
    && Array.isArray(repositories)
    && repositories.length === 0
  const validPresent = destinationState === 'present'
    && payload?.total_count === 1
    && Array.isArray(repositories)
    && repositories.length === 1
    && repositories[0]?.full_name?.toLowerCase() === `${destination.owner}/${destination.repository}`.toLowerCase()
  if (!validAbsent && !validPresent) {
    fail('Installation token repository scope is invalid.', { code: 'github_token_scope_invalid' })
  }
}

export async function mintInstallationToken({
  fetchImpl,
  config,
  phase,
  destinationState,
  privateKey,
  now = Date.now(),
  timeoutMs = 15_000,
  forbiddenRoots = [],
}) {
  validateGithubConfig(config, { forbiddenRoots })
  if (typeof fetchImpl !== 'function') fail('GitHub transport is unavailable.', { code: 'github_transport_invalid' })
  if (!['absent', 'present'].includes(destinationState)
      || (destinationState === 'absent' && phase !== 'bootstrap')) {
    fail('Destination state is invalid for the GitHub App phase.', { code: 'github_phase_invalid' })
  }
  const { app, permissions } = phaseDetails(config, phase)
  const jwt = createGithubAppJwt(privateKey, app.appId, now)
  const appResponse = await request(fetchImpl, '/app', { headers: jwtHeaders(jwt), timeoutMs })
  validateAppIdentity(appResponse, app, config.destination.owner)
  const installation = await request(fetchImpl, `/app/installations/${app.installationId}`, {
    headers: jwtHeaders(jwt), timeoutMs,
  })
  validateInstallation(installation, app, config.destination.owner, permissions)

  let rawToken = null
  try {
    const tokenResponse = await mutationRequest(fetchImpl, `/app/installations/${app.installationId}/access_tokens`, {
      method: 'POST',
      headers: { ...jwtHeaders(jwt), 'Content-Type': 'application/json' },
      body: destinationState === 'absent'
        ? { permissions }
        : { repositories: [config.destination.repository], permissions },
      timeoutMs,
    }, (payload) => {
      rawToken = isOpaqueInstallationToken(payload?.token) ? payload.token : null
      const expiresAt = Date.parse(payload?.expires_at ?? '')
      if (!rawToken || !exactPermissions(payload?.permissions, permissions)
          || !Number.isFinite(expiresAt) || expiresAt <= now) {
        fail('Installation token response is invalid.', { code: 'github_token_invalid' })
      }
      return payload
    })
    const scope = await request(fetchImpl, '/installation/repositories?per_page=100', {
      headers: tokenHeaders(rawToken), timeoutMs,
    })
    validateRepositoryScope(scope, config.destination, destinationState)
    return { token: rawToken, expiresAt: tokenResponse.expires_at, appId: app.appId, installationId: app.installationId }
  } catch (error) {
    if (rawToken) {
      try {
        await revokeInstallationToken({ fetchImpl, token: rawToken, timeoutMs })
      } catch (revokeError) {
        throw sanitizeGithubError(revokeError)
      }
    }
    const safe = sanitizeGithubError(error)
    if (!rawToken && safe.code === 'github_request_unknown') {
      throw new PublicReleaseGithubError('Installation token issuance is unconfirmed; do not retry until the App installation is reconciled.', {
        code: 'github_token_issuance_unconfirmed', state: 'reconcile-required',
      })
    }
    throw safe
  }
}

export async function revokeInstallationToken({ fetchImpl, token, timeoutMs = 15_000 }) {
  if (!isOpaqueInstallationToken(token)) {
    fail('Installation token cleanup could not be prepared.', { code: 'github_token_invalid' })
  }
  try {
    await mutationRequest(fetchImpl, '/installation/token', {
      method: 'DELETE', headers: tokenHeaders(token), timeoutMs,
    })
  } catch {
    throw new PublicReleaseGithubError('Installation token revocation is unconfirmed.', {
      code: 'github_token_revocation_unconfirmed', state: 'reconcile-required',
    })
  }
  return { revoked: true }
}

export function publishingChildEnvironment(token) {
  if (!isOpaqueInstallationToken(token)) {
    fail('Installation token is invalid.', { code: 'github_token_invalid' })
  }
  return Object.freeze({ [INSTALLATION_TOKEN_ENV]: token })
}

function repositoryBase(destination) {
  return `/repos/${encodeURIComponent(destination.owner)}/${encodeURIComponent(destination.repository)}`
}

function validateRepository(repository, destination, { private: expectedPrivate }) {
  const expectedFullName = `${destination.owner}/${destination.repository}`
  if (repository?.name?.toLowerCase() !== destination.repository.toLowerCase()
      || repository?.full_name?.toLowerCase() !== expectedFullName.toLowerCase()
      || repository?.owner?.login?.toLowerCase() !== destination.owner.toLowerCase()
      || repository?.private !== expectedPrivate
      || repository?.visibility !== (expectedPrivate ? 'private' : 'public')
      || repository?.has_issues !== true
      || repository?.has_discussions !== false) {
    fail('Destination repository state is invalid.', { code: 'github_repository_mismatch' })
  }
  return repository
}

async function readRepository(fetchImpl, destination, token, timeoutMs, allowNotFound = false) {
  return request(fetchImpl, repositoryBase(destination), {
    headers: tokenHeaders(token), timeoutMs, allowNotFound,
  })
}

export async function createPrivateDestination({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const { destination } = config
  const existing = await readRepository(fetchImpl, destination, token, timeoutMs, true)
  if (existing !== null) {
    fail('Destination repository already exists.', { code: 'github_destination_exists' })
  }
  await mutationRequest(fetchImpl, `/orgs/${encodeURIComponent(destination.owner)}/repos`, {
    method: 'POST',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: {
      name: destination.repository,
      private: true,
      has_issues: true,
      has_discussions: false,
      auto_init: false,
    },
    timeoutMs,
  }, (repository) => validateRepository(repository, destination, { private: true }))
  return validateRepository(await readRepository(fetchImpl, destination, token, timeoutMs), destination, { private: true })
}

export async function createNoJekyllRoot({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const { destination } = config
  const base = repositoryBase(destination)
  if (await readTip(fetchImpl, destination, token, timeoutMs, true) !== null) {
    fail('Destination branch is not empty.', { code: 'github_destination_not_empty' })
  }
  const created = await mutationRequest(fetchImpl, `${base}/contents/.nojekyll`, {
    method: 'PUT',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: { message: 'Initialize GitHub Pages host', content: '', branch: destination.branch },
    timeoutMs,
  }, (payload) => {
    const commitSha = requireSha(payload?.commit?.sha, 'Root commit SHA')
    const blobSha = requireSha(payload?.content?.sha, 'Root blob SHA')
    if (payload?.content?.path !== '.nojekyll') fail('Private host root is invalid.', { code: 'github_root_mismatch' })
    return { commitSha, blobSha }
  })
  const { commitSha, blobSha } = created
  const commit = await request(fetchImpl, `${base}/git/commits/${commitSha}`, {
    headers: tokenHeaders(token), timeoutMs,
  })
  const treeSha = requireSha(commit?.tree?.sha, 'Root tree SHA')
  await verifyCommit(fetchImpl, base, commitSha, treeSha, null, token, timeoutMs)
  await verifyTree(fetchImpl, base, treeSha, [
    { path: '.nojekyll', mode: FILE_MODE, type: 'blob', sha: blobSha },
  ], token, timeoutMs)
  if (await readTip(fetchImpl, destination, token, timeoutMs) !== commitSha) {
    fail('Private host root ref is invalid.', { code: 'github_root_mismatch' })
  }
  return { commitSha, treeSha, blobSha }
}

function expectedRuleset(config) {
  return {
    name: PUBLIC_BRANCH_RULESET_NAME,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [{
      actor_id: config.apps.publisher.appId,
      actor_type: 'Integration',
      bypass_mode: 'always',
    }],
    conditions: {
      ref_name: { include: [`refs/heads/${config.destination.branch}`], exclude: [] },
    },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      { type: 'update', parameters: { update_allows_fetch_and_merge: false } },
    ],
  }
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
}

function validateRuleset(ruleset, config) {
  const expected = expectedRuleset(config)
  if (!Number.isSafeInteger(ruleset?.id) || ruleset.id <= 0
      || ruleset?.name !== expected.name
      || ruleset?.target !== expected.target
      || ruleset?.enforcement !== expected.enforcement
      || canonicalJson(ruleset?.bypass_actors) !== canonicalJson(expected.bypass_actors)
      || canonicalJson(ruleset?.conditions) !== canonicalJson(expected.conditions)
      || canonicalJson(ruleset?.rules) !== canonicalJson(expected.rules)) {
    fail('Destination branch ruleset is invalid.', { code: 'github_ruleset_mismatch' })
  }
  return ruleset
}

export async function createArtifactRuleset({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const base = repositoryBase(config.destination)
  const created = await mutationRequest(fetchImpl, `${base}/rulesets`, {
    method: 'POST',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: expectedRuleset(config),
    timeoutMs,
  }, (ruleset) => validateRuleset(ruleset, config))
  const ruleset = created
  return validateRuleset(await request(fetchImpl, `${base}/rulesets/${ruleset.id}`, {
    headers: tokenHeaders(token), timeoutMs,
  }), config)
}

export async function verifyArtifactRuleset({ fetchImpl, token, config, rulesetId, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  requiredPositiveInteger(rulesetId, 'Ruleset ID')
  return validateRuleset(await request(fetchImpl, `${repositoryBase(config.destination)}/rulesets/${rulesetId}`, {
    headers: tokenHeaders(token), timeoutMs,
  }), config)
}

export async function makeDestinationPublic({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const base = repositoryBase(config.destination)
  validateRepository(await readRepository(fetchImpl, config.destination, token, timeoutMs), config.destination, { private: true })
  await mutationRequest(fetchImpl, base, {
    method: 'PATCH',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: { private: false },
    timeoutMs,
  }, (repository) => validateRepository(repository, config.destination, { private: false }))
  return validateRepository(await readRepository(fetchImpl, config.destination, token, timeoutMs), config.destination, { private: false })
}

function validatePages(pages, config) {
  const expectedUrl = `https://${config.destination.owner.toLowerCase()}.github.io/`
  if (pages?.build_type !== 'legacy'
      || pages?.source?.branch !== config.destination.branch
      || pages?.source?.path !== '/'
      || typeof pages?.html_url !== 'string'
      || new URL(pages.html_url).href.toLowerCase() !== expectedUrl) {
    fail('GitHub Pages source is invalid.', { code: 'github_pages_mismatch' })
  }
  return pages
}

export async function configureRootPages({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const base = repositoryBase(config.destination)
  await mutationRequest(fetchImpl, `${base}/pages`, {
    method: 'POST',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: { build_type: 'legacy', source: { branch: config.destination.branch, path: '/' } },
    timeoutMs,
  }, (pages) => validatePages(pages, config))
  return validatePages(await request(fetchImpl, `${base}/pages`, {
    headers: tokenHeaders(token), timeoutMs,
  }), config)
}

export async function bootstrapPublicDestination({
  fetchImpl,
  token,
  config,
  files,
  artifactTreeDigest,
  timeoutMs = 15_000,
}) {
  await createPrivateDestination({ fetchImpl, token, config, timeoutMs })
  const root = await createNoJekyllRoot({ fetchImpl, token, config, timeoutMs })
  const publication = await publishArtifactTree({
    fetchImpl,
    token,
    config,
    files,
    artifactTreeDigest,
    expectedTip: root.commitSha,
    timeoutMs,
  })
  const ruleset = await createArtifactRuleset({ fetchImpl, token, config, timeoutMs })
  await verifyArtifactRuleset({ fetchImpl, token, config, rulesetId: ruleset.id, timeoutMs })
  await makeDestinationPublic({ fetchImpl, token, config, timeoutMs })
  const pages = await configureRootPages({ fetchImpl, token, config, timeoutMs })
  return { state: 'bootstrapped', rootCommitSha: root.commitSha, publication, rulesetId: ruleset.id, pagesUrl: pages.html_url }
}

function branchRefPath(destination) {
  return `${repositoryBase(destination)}/git/ref/heads/${destination.branch.split('/').map(encodeURIComponent).join('/')}`
}

function requireSha(value, label) {
  if (typeof value !== 'string' || !SHA1.test(value)) {
    fail(`${label} is invalid.`, { code: 'github_response_invalid' })
  }
  return value
}

function gitBlobSha(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

function validatePublicationFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    fail('Publication files are invalid.', { code: 'github_publication_invalid' })
  }
  let previous = null
  return files.map((file) => {
    exactKeys(file, ['path', 'mode', 'bytes'], 'Publication file')
    if (typeof file.path !== 'string' || !file.path || file.path.includes('\\') || file.path.startsWith('/')
        || file.path.split('/').some((part) => !part || part === '.' || part === '..')
        || file.mode !== FILE_MODE || !Buffer.isBuffer(file.bytes)) {
      fail('Publication file is invalid.', { code: 'github_publication_invalid' })
    }
    if (previous !== null && previous >= file.path) {
      fail('Publication files must be uniquely sorted.', { code: 'github_publication_invalid' })
    }
    previous = file.path
    return file
  })
}

async function readTip(fetchImpl, destination, token, timeoutMs, allowEmptyRepository = false) {
  const ref = await request(fetchImpl, branchRefPath(destination), {
    headers: tokenHeaders(token), allowNotFound: true, allowEmptyRepository, timeoutMs,
  })
  if (ref === null) return null
  return requireSha(ref?.object?.sha, 'Destination tip')
}

function assertExpectedTip(actual, expected) {
  if (actual !== expected) {
    fail('Destination tip changed before publication.', {
      code: 'github_stale_tip', state: 'failed', resource: 'destination-ref',
    })
  }
}

async function verifyTree(fetchImpl, base, treeSha, expectedEntries, token, timeoutMs) {
  const tree = await request(fetchImpl, `${base}/git/trees/${treeSha}?recursive=1`, {
    headers: tokenHeaders(token), timeoutMs,
  })
  if (tree?.truncated !== false || tree?.sha !== treeSha || !Array.isArray(tree.tree)) {
    fail('Published tree could not be verified.', { code: 'github_tree_mismatch' })
  }

  const expectedDirectories = new Set()
  for (const entry of expectedEntries) {
    const parts = entry.path.split('/')
    for (let length = 1; length < parts.length; length += 1) {
      expectedDirectories.add(parts.slice(0, length).join('/'))
    }
  }
  if (tree.tree.length !== expectedEntries.length + expectedDirectories.size) {
    fail('Published tree could not be verified.', { code: 'github_tree_mismatch' })
  }

  const actualByPath = new Map()
  for (const entry of tree.tree) {
    if (typeof entry?.path !== 'string' || actualByPath.has(entry.path)) {
      fail('Published tree does not match the accepted artifact.', { code: 'github_tree_mismatch' })
    }
    actualByPath.set(entry.path, entry)
  }
  for (const wanted of expectedEntries) {
    const observed = actualByPath.get(wanted.path)
    if (observed?.mode !== wanted.mode || observed?.type !== 'blob' || observed?.sha !== wanted.sha) {
      fail('Published tree does not match the accepted artifact.', { code: 'github_tree_mismatch' })
    }
  }
  for (const directory of expectedDirectories) {
    const observed = actualByPath.get(directory)
    if (observed?.mode !== '040000' || observed?.type !== 'tree' || !SHA1.test(observed?.sha ?? '')) {
      fail('Published tree does not match the accepted artifact.', { code: 'github_tree_mismatch' })
    }
  }
}

async function verifyCommit(fetchImpl, base, commitSha, treeSha, expectedTip, token, timeoutMs) {
  const commit = await request(fetchImpl, `${base}/git/commits/${commitSha}`, {
    headers: tokenHeaders(token), timeoutMs,
  })
  const parents = commit?.parents
  const expectedParents = expectedTip === null ? [] : [expectedTip]
  if (commit?.sha !== commitSha || commit?.tree?.sha !== treeSha || !Array.isArray(parents)
      || parents.length !== expectedParents.length
      || parents.some((parent, index) => parent?.sha !== expectedParents[index])) {
    fail('Published commit could not be verified.', { code: 'github_commit_mismatch' })
  }
}

async function reconcileRef({ fetchImpl, destination, token, commitSha, treeSha, expectedTip, entries, timeoutMs }) {
  try {
    const current = await readTip(fetchImpl, destination, token, timeoutMs)
    if (current !== commitSha) return false
    const base = repositoryBase(destination)
    await verifyCommit(fetchImpl, base, commitSha, treeSha, expectedTip, token, timeoutMs)
    await verifyTree(fetchImpl, base, treeSha, entries, token, timeoutMs)
    return true
  } catch {
    return false
  }
}

export async function publishArtifactTree({
  fetchImpl,
  token,
  config,
  files,
  artifactTreeDigest,
  expectedTip,
  commitMessage = 'Publish ZZZ Setup Workbench artifact',
  timeoutMs = 15_000,
}) {
  validateGithubConfig(config)
  if (typeof fetchImpl !== 'function' || !isOpaqueInstallationToken(token)) {
    fail('GitHub publication could not be prepared.', { code: 'github_publication_invalid' })
  }
  if (!SHA256_IDENTITY.test(artifactTreeDigest ?? '')
      || (expectedTip !== null && !SHA1.test(expectedTip ?? ''))
      || typeof commitMessage !== 'string' || commitMessage.length < 1 || commitMessage.length > 120
      || /[\r\n\0]/.test(commitMessage)) {
    fail('GitHub publication input is invalid.', { code: 'github_publication_invalid' })
  }
  const acceptedFiles = validatePublicationFiles(files)
  const destination = config.destination
  const base = repositoryBase(destination)
  const initialTip = await readTip(fetchImpl, destination, token, timeoutMs)
  assertExpectedTip(initialTip, expectedTip)

  const entries = []
  for (const file of acceptedFiles) {
    const expectedBlobSha = gitBlobSha(file.bytes)
    const blobSha = await mutationRequest(fetchImpl, `${base}/git/blobs`, {
      method: 'POST',
      headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
      body: { content: file.bytes.toString('base64'), encoding: 'base64' },
      timeoutMs,
    }, (blob) => {
      const actualBlobSha = requireSha(blob?.sha, 'Blob SHA')
      if (actualBlobSha !== expectedBlobSha) {
        fail('GitHub blob identity does not match the accepted bytes.', { code: 'github_blob_mismatch' })
      }
      return actualBlobSha
    })
    entries.push({ path: file.path, mode: file.mode, type: 'blob', sha: blobSha })
  }
  const treeSha = await mutationRequest(fetchImpl, `${base}/git/trees`, {
    method: 'POST',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: { tree: entries },
    timeoutMs,
  }, (tree) => requireSha(tree?.sha, 'Tree SHA'))
  await verifyTree(fetchImpl, base, treeSha, entries, token, timeoutMs)

  const commitSha = await mutationRequest(fetchImpl, `${base}/git/commits`, {
    method: 'POST',
    headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
    body: { message: commitMessage, tree: treeSha, parents: expectedTip === null ? [] : [expectedTip] },
    timeoutMs,
  }, (commit) => requireSha(commit?.sha, 'Commit SHA'))
  await verifyCommit(fetchImpl, base, commitSha, treeSha, expectedTip, token, timeoutMs)
  assertExpectedTip(await readTip(fetchImpl, destination, token, timeoutMs), expectedTip)

  let reconciled = false
  try {
    if (expectedTip === null) {
      await mutationRequest(fetchImpl, `${base}/git/refs`, {
        method: 'POST',
        headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
        body: { ref: `refs/heads/${destination.branch}`, sha: commitSha },
        timeoutMs,
      })
    } else {
      await mutationRequest(fetchImpl, branchRefPath(destination), {
        method: 'PATCH',
        headers: { ...tokenHeaders(token), 'Content-Type': 'application/json' },
        body: { sha: commitSha, force: false },
        timeoutMs,
      })
    }
  } catch (error) {
    if (!(error instanceof PublicReleaseGithubError) || error.code !== 'github_request_unknown') {
      throw sanitizeGithubError(error)
    }
    reconciled = await reconcileRef({
      fetchImpl, destination, token, commitSha, treeSha, expectedTip, entries, timeoutMs,
    })
    if (!reconciled) {
      fail('Branch update outcome requires reconciliation.', {
        code: 'github_ref_reconciliation_required', state: 'reconcile-required', resource: 'destination-ref',
      })
    }
  }

  if (!reconciled) {
    const finalTip = await readTip(fetchImpl, destination, token, timeoutMs)
    if (finalTip !== commitSha) {
      fail('Published branch does not reference the expected commit.', { code: 'github_ref_mismatch' })
    }
    await verifyCommit(fetchImpl, base, commitSha, treeSha, expectedTip, token, timeoutMs)
    await verifyTree(fetchImpl, base, treeSha, entries, token, timeoutMs)
  }
  return {
    state: reconciled ? 'reconciled' : 'published',
    artifactTreeDigest,
    commitSha,
    treeSha,
    previousTip: expectedTip,
  }
}

export async function disablePages({ fetchImpl, token, config, timeoutMs = 15_000 }) {
  validateGithubConfig(config)
  const pagesPath = `${repositoryBase(config.destination)}/pages`
  const current = await request(fetchImpl, pagesPath, {
    headers: tokenHeaders(token), timeoutMs, allowNotFound: true,
  })
  if (current !== null) {
    await mutationRequest(fetchImpl, pagesPath, {
      method: 'DELETE', headers: tokenHeaders(token), timeoutMs,
    })
  }
  if (await request(fetchImpl, pagesPath, {
    headers: tokenHeaders(token), timeoutMs, allowNotFound: true,
  }) !== null) {
    fail('GitHub Pages disablement could not be verified.', { code: 'github_pages_disable_unconfirmed' })
  }
  return { disabled: true }
}

function decodeChildFiles(values) {
  if (!Array.isArray(values) || values.length === 0) {
    fail('Fixed child artifact files are invalid.', { code: 'github_child_schema_invalid' })
  }
  return values.map((value) => {
    exactKeys(value, ['path', 'mode', 'contentBase64'], 'Fixed child artifact file')
    if (typeof value.contentBase64 !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.contentBase64)) {
      fail('Fixed child artifact encoding is invalid.', { code: 'github_child_schema_invalid' })
    }
    const bytes = Buffer.from(value.contentBase64, 'base64')
    if (bytes.toString('base64') !== value.contentBase64) {
      fail('Fixed child artifact encoding is not canonical.', { code: 'github_child_schema_invalid' })
    }
    return { path: value.path, mode: value.mode, bytes }
  })
}

export function validateFixedChildCommand(command) {
  exactKeys(command, ['schema', 'operation', 'role', 'config', 'payload'], 'Fixed child command')
  if (command.schema !== FIXED_CHILD_SCHEMA || !Object.hasOwn(FIXED_CHILD_OPERATIONS, command.operation)) {
    fail('Fixed child command is invalid.', { code: 'github_child_schema_invalid' })
  }
  const binding = FIXED_CHILD_OPERATIONS[command.operation]
  if (command.role !== binding.role) {
    fail('Fixed child operation cannot cross its App role.', { code: 'github_child_role_invalid' })
  }
  validateGithubConfig(command.config)
  if (!isPlainObject(command.payload)) {
    fail('Fixed child payload is invalid.', { code: 'github_child_schema_invalid' })
  }
  if (command.operation === 'bootstrap') {
    exactKeys(command.payload, ['files', 'artifactTreeDigest'], 'Bootstrap child payload')
    if (!SHA256_IDENTITY.test(command.payload.artifactTreeDigest ?? '')) {
      fail('Bootstrap artifact identity is invalid.', { code: 'github_child_schema_invalid' })
    }
    decodeChildFiles(command.payload.files)
  } else if (command.operation === 'publish') {
    exactKeys(command.payload, ['files', 'artifactTreeDigest'], 'Publish child payload')
    if (!SHA256_IDENTITY.test(command.payload.artifactTreeDigest ?? '')) {
      fail('Publish artifact binding is invalid.', { code: 'github_child_schema_invalid' })
    }
    decodeChildFiles(command.payload.files)
  } else {
    exactKeys(command.payload, [], 'Recovery child payload')
  }
  return command
}

async function readFixedChildInput(inputFile, readFile = fs.readFile, expectedDigest = null) {
  if (typeof inputFile !== 'string' || !path.isAbsolute(inputFile)) {
    fail('Fixed child input path must be absolute.', { code: 'github_child_schema_invalid' })
  }
  let raw
  try {
    raw = await readFile(inputFile)
  } catch {
    fail('Fixed child input is unavailable or malformed.', { code: 'github_child_schema_invalid' })
  }
  const digest = `sha256:${createHash('sha256').update(raw).digest('hex')}`
  if (expectedDigest !== null && digest !== expectedDigest) {
    fail('Fixed child input changed after preflight.', { code: 'github_child_input_changed' })
  }
  let command
  try {
    command = JSON.parse(raw.toString('utf8'))
  } catch {
    fail('Fixed child input is unavailable or malformed.', { code: 'github_child_schema_invalid' })
  }
  return { command: validateFixedChildCommand(command), digest }
}

export async function readFixedChildCommand(inputFile, readFile = fs.readFile) {
  return (await readFixedChildInput(inputFile, readFile)).command
}

async function dispatchFixedChildOperation(command, { fetchImpl, token, timeoutMs }) {
  const files = command.payload.files ? decodeChildFiles(command.payload.files) : null
  switch (command.operation) {
    case 'bootstrap':
      return bootstrapPublicDestination({
        fetchImpl, token, config: command.config, files,
        artifactTreeDigest: command.payload.artifactTreeDigest, timeoutMs,
      })
    case 'publish':
      {
        const expectedTip = await readTip(fetchImpl, command.config.destination, token, timeoutMs)
        if (expectedTip === null) {
          fail('Published destination branch is absent.', { code: 'github_destination_not_initialized' })
        }
      return publishArtifactTree({
        fetchImpl, token, config: command.config, files,
        artifactTreeDigest: command.payload.artifactTreeDigest,
        expectedTip,
        timeoutMs,
      })
      }
    case 'disable-pages':
      return disablePages({ fetchImpl, token, config: command.config, timeoutMs })
    default:
      fail('Fixed child operation is not allowlisted.', { code: 'github_child_schema_invalid' })
  }
}

function childError(error) {
  const safe = sanitizeGithubError(error)
  return { code: safe.code, state: safe.state, message: safe.message }
}

function combinedReconciliationError(operationError, revocationError) {
  if (operationError === null) return revocationError
  return {
    code: 'github_operation_and_revocation_unconfirmed',
    state: 'reconcile-required',
    message: 'The remote operation and installation token revocation both require reconciliation.',
  }
}

export function publicationChildTimeoutMs(command, requestTimeoutMs = PUBLICATION_REQUEST_TIMEOUT_MS) {
  validateFixedChildCommand(command)
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1) {
    fail('Publishing request timeout is invalid.', { code: 'github_child_process_invalid' })
  }
  const budget = PUBLICATION_REQUEST_BUDGETS[command.operation]
  const fileCount = command.payload.files?.length ?? 0
  const mutationCount = fileCount + budget.fixedMutations
  const retryCount = PUBLICATION_MAX_RATE_LIMIT_RETRIES
  const cleanupCount = 1
  const requestCount = mutationCount + budget.reads + retryCount + cleanupCount
  const mutationPacing = (mutationCount + retryCount + cleanupCount) * PUBLICATION_MUTATION_INTERVAL_MS
  const boundedRequestBudget = requestCount * requestTimeoutMs
  const boundedRateLimitWait = 60_000 + 120_000
  const cleanupReserve = 60_000
  return Math.max(120_000, mutationPacing + boundedRequestBudget + boundedRateLimitWait + cleanupReserve)
}

export async function executeFixedChildCommand({
  command,
  token,
  fetchImpl,
  timeoutMs = PUBLICATION_REQUEST_TIMEOUT_MS,
}) {
  let result = null
  let operationError = null
  let tokenRevoked = false
  try {
    validateFixedChildCommand(command)
    result = await dispatchFixedChildOperation(command, { fetchImpl, token, timeoutMs })
  } catch (error) {
    operationError = childError(error)
  } finally {
    try {
      await revokeInstallationToken({ fetchImpl, token, timeoutMs })
      tokenRevoked = true
    } catch (error) {
      operationError = combinedReconciliationError(operationError, childError(error))
    }
  }
  return {
    schema: FIXED_CHILD_RESULT_SCHEMA,
    ok: operationError === null,
    tokenRevoked,
    result: operationError === null ? result : null,
    error: operationError,
  }
}

export async function runFixedChildProcess({
  nodeExecutable,
  inputFile,
  inputDigest,
  sourceBytes,
  env,
  timeoutMs = PUBLICATION_CHILD_TIMEOUT_MS,
  spawnImpl = spawn,
  signalSource = process,
}) {
  if (typeof nodeExecutable !== 'string' || !path.isAbsolute(nodeExecutable)
      || typeof inputFile !== 'string' || !path.isAbsolute(inputFile)
      || !SHA256_IDENTITY.test(inputDigest ?? '') || !Buffer.isBuffer(sourceBytes)) {
    fail('Fixed child process paths must be absolute.', { code: 'github_child_process_invalid' })
  }
  exactKeys(env, [INSTALLATION_TOKEN_ENV], 'Fixed child environment')
  return new Promise((resolve, reject) => {
    let stdout = ''
    let settled = false
    const child = spawnImpl(nodeExecutable, ['--input-type=module', '-', FIXED_CHILD_MODE, inputFile, inputDigest], {
      shell: false,
      windowsHide: true,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const interrupt = () => { if (!settled) child.kill() }
    const cleanupHandlers = () => {
      signalSource.removeListener('SIGINT', interrupt)
      signalSource.removeListener('SIGTERM', interrupt)
    }
    signalSource.on('SIGINT', interrupt)
    signalSource.on('SIGTERM', interrupt)
    const rejectInterrupted = () => {
      if (settled) return
      settled = true
      child.kill()
      clearTimeout(timer)
      cleanupHandlers()
      reject(new PublicReleaseGithubError('Fixed publishing child was interrupted.', {
        code: 'github_child_interrupted', state: 'reconcile-required',
      }))
    }
    const timer = setTimeout(() => {
      if (settled) return
      child.kill()
      settled = true
      cleanupHandlers()
      reject(new PublicReleaseGithubError('Fixed publishing child timed out.', {
        code: 'github_child_interrupted', state: 'reconcile-required',
      }))
    }, timeoutMs)
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (chunk) => {
      stdout += chunk
      if (stdout.length > 65_536 && !settled) {
        child.kill()
        settled = true
        clearTimeout(timer)
        cleanupHandlers()
        reject(new PublicReleaseGithubError('Fixed publishing child output is invalid.', {
          code: 'github_child_output_invalid', state: 'reconcile-required',
        }))
      }
    })
    child.once('error', () => {
      rejectInterrupted()
    })
    child.stdin?.on('error', rejectInterrupted)
    child.once('close', (exitCode, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      cleanupHandlers()
      resolve({ exitCode, signal, stdout })
    })
    try {
      child.stdin.end(sourceBytes)
    } catch {
      rejectInterrupted()
    }
  })
}

function validateChildResult(value) {
  exactKeys(value, ['schema', 'ok', 'tokenRevoked', 'result', 'error'], 'Fixed child result')
  if (value.schema !== FIXED_CHILD_RESULT_SCHEMA || typeof value.ok !== 'boolean'
      || typeof value.tokenRevoked !== 'boolean'
      || (value.ok && (value.error !== null || value.result === null))
      || (!value.ok && (value.result !== null || !isPlainObject(value.error)))) {
    fail('Fixed child result is invalid.', { code: 'github_child_output_invalid' })
  }
  if (value.error !== null) {
    exactKeys(value.error, ['code', 'state', 'message'], 'Fixed child error')
    for (const key of ['code', 'state', 'message']) requiredString(value.error[key], `Fixed child error ${key}`)
  }
  return value
}

export async function runPublishingChild({
  nodeExecutable,
  operationFile,
  preflight,
  loadPrivateKey,
  fetchImpl,
  childRunner = runFixedChildProcess,
  childSource,
  signalSource = process,
  timeoutMs = null,
  authTimeoutMs = 15_000,
  forbiddenRoots = [],
  now = () => Date.now(),
}) {
  if (typeof nodeExecutable !== 'string' || !path.isAbsolute(nodeExecutable)) {
    fail('Decision-bound Node executable is unavailable.', { code: 'github_child_process_invalid' })
  }
  const input = await readFixedChildInput(operationFile)
  const { command } = input
  if (typeof preflight !== 'function' || await preflight(command) !== true) {
    fail('Publishing child preflight did not pass.', { code: 'github_child_preflight_failed' })
  }
  if (typeof loadPrivateKey !== 'function') {
    fail('GitHub App key loader is unavailable.', { code: 'github_auth_invalid' })
  }
  if (!Buffer.isBuffer(childSource)) {
    fail('Decision-bound publishing child source is unavailable.', { code: 'github_child_process_invalid' })
  }
  const binding = FIXED_CHILD_OPERATIONS[command.operation]
  const app = command.config.apps[binding.role === 'publisher' ? 'publisher' : 'bootstrap']
  const privateKey = await loadPrivateKey(app.keyPath)
  let interrupted = false
  const onInterrupt = () => { interrupted = true }
  signalSource.on('SIGINT', onInterrupt)
  signalSource.on('SIGTERM', onInterrupt)
  let minted = null
  let childConfirmedRevocation = false
  try {
    minted = await mintInstallationToken({
      fetchImpl,
      config: command.config,
      phase: binding.phase,
      destinationState: binding.destinationState,
      privateKey,
      now: now(),
      timeoutMs: authTimeoutMs,
      forbiddenRoots,
    })
    if (interrupted) {
      fail('Publishing was interrupted during credential preparation.', {
        code: 'github_child_interrupted', state: 'reconcile-required',
      })
    }
    const childTimeoutMs = timeoutMs ?? publicationChildTimeoutMs(command)
    const expiresAt = Date.parse(minted.expiresAt ?? '')
    if (!Number.isFinite(expiresAt) || expiresAt - now() < childTimeoutMs + 60_000) {
      fail('Installation token lifetime is insufficient for the bounded publication and cleanup window.', {
        code: 'github_token_lifetime_insufficient', state: 'failed',
      })
    }
    const childProcess = await childRunner({
      nodeExecutable,
      inputFile: operationFile,
      inputDigest: input.digest,
      sourceBytes: childSource,
      env: publishingChildEnvironment(minted.token),
      timeoutMs: childTimeoutMs,
      signalSource,
    })
    if (childProcess.signal !== null) {
      fail('Fixed publishing child did not complete safely.', {
        code: 'github_child_interrupted', state: 'reconcile-required',
      })
    }
    if (typeof childProcess.stdout !== 'string' || childProcess.stdout.includes(minted.token)) {
      fail('Fixed publishing child output is invalid.', {
        code: 'github_child_output_invalid', state: 'reconcile-required',
      })
    }
    let childResult
    try {
      childResult = validateChildResult(JSON.parse(childProcess.stdout.trim()))
    } catch {
      fail('Fixed publishing child output is invalid.', {
        code: 'github_child_output_invalid', state: 'reconcile-required',
      })
    }
    childConfirmedRevocation = childResult.tokenRevoked
    if (childProcess.exitCode !== (childResult.ok ? 0 : 1)
        || !childResult.tokenRevoked) {
      fail('Fixed publishing child did not complete safely.', {
        code: 'github_child_interrupted', state: 'reconcile-required',
      })
    }
    if (!childResult.ok) {
      throw new PublicReleaseGithubError(childResult.error.message, {
        code: childResult.error.code, state: childResult.error.state,
      })
    }
    return childResult.result
  } catch (error) {
    let safe = childError(error)
    if (minted && !childConfirmedRevocation) {
      try {
        await revokeInstallationToken({ fetchImpl, token: minted.token, timeoutMs: authTimeoutMs })
      } catch (revokeError) {
        safe = combinedReconciliationError(safe, childError(revokeError))
      }
    }
    throw new PublicReleaseGithubError(safe.message, { code: safe.code, state: safe.state })
  } finally {
    signalSource.removeListener('SIGINT', onInterrupt)
    signalSource.removeListener('SIGTERM', onInterrupt)
  }
}

async function fixedChildMain() {
  if (process.argv.length !== 5 || process.argv[2] !== FIXED_CHILD_MODE || !path.isAbsolute(process.argv[3])
      || !SHA256_IDENTITY.test(process.argv[4] ?? '')) {
    fail('Fixed child invocation is invalid.', { code: 'github_child_process_invalid' })
  }
  const token = process.env[INSTALLATION_TOKEN_ENV]
  delete process.env[INSTALLATION_TOKEN_ENV]
  if (!isOpaqueInstallationToken(token)) {
    fail('Installation token is unavailable.', { code: 'github_token_invalid' })
  }
  let output
  const rateLimitedFetch = createRateLimitedFetch(fetch)
  try {
    const { command } = await readFixedChildInput(process.argv[3], fs.readFile, process.argv[4])
    output = await executeFixedChildCommand({ command, token, fetchImpl: rateLimitedFetch })
  } catch (error) {
    let tokenRevoked = false
    let safe = childError(error)
    try {
      await revokeInstallationToken({ fetchImpl: rateLimitedFetch, token })
      tokenRevoked = true
    } catch (revokeError) {
      safe = combinedReconciliationError(safe, childError(revokeError))
    }
    output = {
      schema: FIXED_CHILD_RESULT_SCHEMA,
      ok: false,
      tokenRevoked,
      result: null,
      error: safe,
    }
  }
  let serialized = JSON.stringify(output)
  if (serialized.includes(token)) {
    serialized = JSON.stringify({
      schema: FIXED_CHILD_RESULT_SCHEMA,
      ok: false,
      tokenRevoked: output.tokenRevoked,
      result: null,
      error: { code: 'github_child_output_invalid', state: 'failed', message: 'Fixed publishing child output is invalid.' },
    })
  }
  process.stdout.write(`${serialized}\n`)
  process.exitCode = output.ok ? 0 : 1
}

export function sanitizeGithubError(error) {
  if (error instanceof PublicReleaseGithubError) {
    return new PublicReleaseGithubError(error.message, {
      code: error.code, state: error.state, resource: error.resource,
    })
  }
  return new PublicReleaseGithubError('GitHub publication failed.')
}

if ((import.meta.url === pathToFileURL(process.argv[1] ?? '').href && process.argv[2] === FIXED_CHILD_MODE)
    || (process.argv[1] === '-' && process.argv[2] === FIXED_CHILD_MODE)) {
  fixedChildMain().catch((error) => {
    const safe = childError(error)
    process.stdout.write(`${JSON.stringify({
      schema: FIXED_CHILD_RESULT_SCHEMA,
      ok: false,
      tokenRevoked: false,
      result: null,
      error: safe,
    })}\n`)
    process.exitCode = 1
  })
}
