import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import {
  APP_PERMISSION_PROFILES,
  BOOTSTRAP_RULESET_RETRY_DELAYS_MS,
  GITHUB_API_VERSION,
  GITHUB_CONFIG_SCHEMA,
  FIXED_CHILD_MODE,
  FIXED_CHILD_RESULT_SCHEMA,
  FIXED_CHILD_SCHEMA,
  INSTALLATION_TOKEN_ENV,
  PUBLICATION_MAX_RATE_LIMIT_RETRIES,
  PUBLICATION_MUTATION_INTERVAL_MS,
  PublicReleaseGithubError,
  configureRootPages,
  createBootstrapArtifactRuleset,
  createNoJekyllRoot,
  createPrivateDestination,
  createGithubAppJwt,
  createRateLimitedFetch,
  disablePages,
  executeFixedChildCommand,
  finalizeArtifactRuleset,
  makeDestinationPublic,
  mintInstallationToken,
  publishArtifactTree,
  publishingChildEnvironment,
  publicationChildTimeoutMs,
  runFixedChildProcess,
  runPublishingChild,
  revokeInstallationToken,
  sanitizeGithubError,
  validateGithubConfig,
  validateFixedChildCommand,
} from './public-release-github.mjs'

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' })
const TOKEN = `ghs_102_${'a'.repeat(180)}.${'b'.repeat(160)}-${'c'.repeat(160)}`
const OLD = '1'.repeat(40)
const gitBlobSha = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const BLOB_A = gitBlobSha(Buffer.from(''))
const BLOB_B = gitBlobSha(Buffer.from('<!doctype html>'))
const TREE = '4'.repeat(40)
const COMMIT = '5'.repeat(40)
const ARTIFACT = `sha256:${'a'.repeat(64)}`

const config = () => ({
  schema: GITHUB_CONFIG_SCHEMA,
  apiVersion: GITHUB_API_VERSION,
  destination: { owner: 'neutral-workbench', repository: 'neutral-workbench.github.io', branch: 'main' },
  apps: {
    bootstrap: {
      appId: 101,
      installationId: 201,
      owner: 'neutral-workbench',
      botLogin: 'neutral-bootstrap[bot]',
      keyPath: path.resolve('C:\\release-secrets\\bootstrap.pem'),
    },
    publisher: {
      appId: 102,
      installationId: 202,
      owner: 'neutral-workbench',
      botLogin: 'neutral-publisher[bot]',
      keyPath: path.resolve('C:\\release-secrets\\publisher.pem'),
    },
  },
  allowedPublicActors: ['neutral-bootstrap[bot]', 'neutral-publisher[bot]', 'github-pages[bot]'],
  forbiddenPrivateIdentifiers: ['private-owner', 'private-repository'],
})

function response(body, status = 200, link = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'link' ? link : null },
    async json() { return body },
  }
}

function authTransport({ phase = 'publisher', permissions = APP_PERMISSION_PROFILES[phase], overrides = {} } = {}) {
  const calls = []
  const current = config()
  const role = phase === 'publisher' ? 'publisher' : 'bootstrap'
  const app = current.apps[role]
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.endsWith('/app')) return response(overrides.app ?? {
      id: app.appId,
      slug: role === 'publisher' ? 'neutral-publisher' : 'neutral-bootstrap',
      owner: { login: 'neutral-workbench' },
    })
    if (url.endsWith(`/app/installations/${app.installationId}`)) return response(overrides.installation ?? {
      id: app.installationId,
      app_id: app.appId,
      account: { login: 'neutral-workbench' },
      repository_selection: 'all',
      permissions,
    })
    if (url.endsWith('/access_tokens')) return response(overrides.token ?? {
      token: TOKEN,
      expires_at: '2099-09-07T01:00:00Z',
      permissions,
    })
    if (url.includes('/installation/repositories')) return response(overrides.scope ?? {
      total_count: 1,
      repositories: [{ full_name: 'neutral-workbench/neutral-workbench.github.io' }],
    })
    if (url.endsWith('/installation/token')) return response({}, 204)
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  return { current, calls, fetchImpl }
}

test('configuration is exact, root-Pages-only, separates Apps, and keeps PEM paths external', () => {
  const candidate = config()
  assert.equal(validateGithubConfig(candidate).schema, GITHUB_CONFIG_SCHEMA)
  assert.throws(() => validateGithubConfig({ ...candidate, extra: true }), /schema is invalid/)
  assert.throws(() => validateGithubConfig({
    ...candidate,
    destination: { ...candidate.destination, repository: 'another-repository' },
  }), /root Pages/)
  assert.throws(() => validateGithubConfig({
    ...candidate,
    apps: { ...candidate.apps, publisher: { ...candidate.apps.publisher, appId: 101 } },
  }), /must be separate/)
  assert.throws(() => validateGithubConfig({
    ...candidate,
    apps: { ...candidate.apps, publisher: { ...candidate.apps.publisher, keyPath: process.cwd() + '\\key.pem' } },
  }, { forbiddenRoots: [process.cwd()] }), /external absolute PEM/)
})

test('JWT is short lived, uses the numeric App ID as issuer, and never contains the PEM', () => {
  const jwt = createGithubAppJwt(PEM, 102, 1_700_000_000_000)
  const [header, payload] = jwt.split('.').slice(0, 2).map((part) => JSON.parse(Buffer.from(part, 'base64url')))
  assert.deepEqual(header, { alg: 'RS256', typ: 'JWT' })
  assert.equal(payload.iss, '102')
  assert.equal(payload.iat, 1_699_999_940)
  assert.equal(payload.exp - payload.iat, 600)
  assert.ok(!jwt.includes('PRIVATE KEY'))
})

test('publisher token is repository-narrow, variable length, exact-permissioned, and API-version pinned', async () => {
  const mock = authTransport()
  const minted = await mintInstallationToken({
    fetchImpl: mock.fetchImpl, config: mock.current, phase: 'publisher', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  })
  assert.equal(minted.token, TOKEN)
  const mint = mock.calls.find(({ url }) => url.endsWith('/access_tokens'))
  assert.deepEqual(JSON.parse(mint.init.body), {
    repositories: ['neutral-workbench.github.io'],
    permissions: { contents: 'write', metadata: 'read' },
  })
  assert.ok(mock.calls.every(({ init }) => init.headers['X-GitHub-Api-Version'] === GITHUB_API_VERSION))
  assert.deepEqual(publishingChildEnvironment(TOKEN), { [INSTALLATION_TOKEN_ENV]: TOKEN })
  assert.deepEqual(publishingChildEnvironment('x'), { [INSTALLATION_TOKEN_ENV]: 'x' })
  assert.throws(() => publishingChildEnvironment('header\r\ninjection'), /token is invalid/)
  assert.throws(() => publishingChildEnvironment('x'.repeat(8 * 1024 + 1)), /token is invalid/)
})

test('bootstrap and stop phases require their distinct exact permission profiles', async () => {
  const expectedPermissions = {
    bootstrap: { administration: 'write', contents: 'write', metadata: 'read', pages: 'write' },
    stop: { administration: 'write', metadata: 'read', pages: 'write' },
  }
  for (const phase of ['bootstrap', 'stop']) {
    const permissions = expectedPermissions[phase]
    const mock = authTransport({ phase, permissions })
    await mintInstallationToken({
      fetchImpl: mock.fetchImpl, config: mock.current, phase, privateKey: PEM,
      destinationState: 'present', now: 1_700_000_000_000,
    })
    const mint = mock.calls.find(({ url }) => url.endsWith('/access_tokens'))
    assert.deepEqual(JSON.parse(mint.init.body).permissions, permissions)
  }
})

test('a failed live bootstrap check can mint only a stop-scoped token before dormancy', async () => {
  const bootstrap = authTransport({ phase: 'bootstrap' })
  const bootstrapToken = await mintInstallationToken({
    fetchImpl: bootstrap.fetchImpl, config: bootstrap.current, phase: 'bootstrap', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  })
  await revokeInstallationToken({ fetchImpl: bootstrap.fetchImpl, token: bootstrapToken.token })

  const stop = authTransport({
    phase: 'stop',
    permissions: APP_PERMISSION_PROFILES.bootstrap,
    overrides: {
      token: {
        token: TOKEN,
        expires_at: '2099-09-07T01:00:00Z',
        permissions: APP_PERMISSION_PROFILES.stop,
      },
    },
  })
  const stopToken = await mintInstallationToken({
    fetchImpl: stop.fetchImpl, config: stop.current, phase: 'stop', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  })
  const mint = stop.calls.find(({ url }) => url.endsWith('/access_tokens'))
  assert.deepEqual(JSON.parse(mint.init.body).permissions, APP_PERMISSION_PROFILES.stop)
  await revokeInstallationToken({ fetchImpl: stop.fetchImpl, token: stopToken.token })
  assert.equal(stop.calls.filter(({ url, init }) => (
    url.endsWith('/installation/token') && init.method === 'DELETE'
  )).length, 1)
})

test('stop rejects an installation posture that is neither bootstrap nor dormant', async () => {
  const mock = authTransport({
    phase: 'stop',
    permissions: { metadata: 'read', pages: 'write' },
  })
  await assert.rejects(() => mintInstallationToken({
    fetchImpl: mock.fetchImpl, config: mock.current, phase: 'stop', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  }), (error) => error.code === 'github_installation_invalid')
  assert.equal(mock.calls.some(({ url }) => url.endsWith('/access_tokens')), false)
})

test('pre-repository bootstrap mints without a nonexistent repository and verifies the all-repositories installation is empty', async () => {
  const mock = authTransport({ phase: 'bootstrap', overrides: {
    scope: { total_count: 0, repositories: [] },
  } })
  await mintInstallationToken({
    fetchImpl: mock.fetchImpl,
    config: mock.current,
    phase: 'bootstrap',
    destinationState: 'absent',
    privateKey: PEM,
    now: 1_700_000_000_000,
  })
  const mint = mock.calls.find(({ url }) => url.endsWith('/access_tokens'))
  assert.deepEqual(JSON.parse(mint.init.body), { permissions: APP_PERMISSION_PROFILES.bootstrap })
})

test('an absent destination is rejected for every non-bootstrap phase', async () => {
  for (const phase of ['publisher', 'stop']) {
    const mock = authTransport({ phase })
    await assert.rejects(() => mintInstallationToken({
      fetchImpl: mock.fetchImpl,
      config: mock.current,
      phase,
      destinationState: 'absent',
      privateKey: PEM,
      now: 1_700_000_000_000,
    }), (error) => error.code === 'github_phase_invalid')
    assert.equal(mock.calls.length, 0)
  }
})

test('wrong App, installation, repository, or broader permissions fail without exposing secrets', async () => {
  const cases = [
    { app: { id: 999, slug: 'neutral-publisher', owner: { login: 'neutral-workbench' } } },
    { installation: {
      id: 202, app_id: 102, account: { login: 'another-owner' }, repository_selection: 'all',
      permissions: APP_PERMISSION_PROFILES.publisher,
    } },
    { installation: {
      id: 202, app_id: 102, account: { login: 'neutral-workbench' }, repository_selection: 'all',
      permissions: { ...APP_PERMISSION_PROFILES.publisher, issues: 'write' },
    } },
    { scope: { total_count: 1, repositories: [{ full_name: 'neutral-workbench/another' }] } },
  ]
  for (const overrides of cases) {
    const mock = authTransport({ overrides })
    await assert.rejects(
      () => mintInstallationToken({
        fetchImpl: mock.fetchImpl, config: mock.current, phase: 'publisher', privateKey: PEM,
        destinationState: 'present', now: 1_700_000_000_000,
      }),
      (error) => {
        const rendered = JSON.stringify({ message: error.message, code: error.code, stack: error.stack })
        assert.ok(!rendered.includes(TOKEN))
        assert.ok(!rendered.includes('PRIVATE KEY'))
        return error instanceof PublicReleaseGithubError
      },
    )
  }
})

test('a post-mint scope failure immediately attempts token revocation', async () => {
  const mock = authTransport({ overrides: {
    scope: { total_count: 2, repositories: [
      { full_name: 'neutral-workbench/neutral-workbench.github.io' },
      { full_name: 'neutral-workbench/other' },
    ] },
  } })
  await assert.rejects(() => mintInstallationToken({
    fetchImpl: mock.fetchImpl, config: mock.current, phase: 'publisher', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  }), /repository scope/)
  assert.ok(mock.calls.some(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE'))
})

test('a post-mint failure reports unconfirmed revocation instead of concealing an active credential', async () => {
  const mock = authTransport({ overrides: {
    scope: { total_count: 0, repositories: [] },
  } })
  const failingRevoke = async (url, init) => {
    if (url.endsWith('/installation/token')) return response({}, 500)
    return mock.fetchImpl(url, init)
  }
  await assert.rejects(() => mintInstallationToken({
    fetchImpl: failingRevoke, config: mock.current, phase: 'publisher', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  }), (error) => error.code === 'github_token_revocation_unconfirmed' && error.state === 'reconcile-required')
})

test('an unparseable or structurally invalid successful token response requires credential reconciliation', async () => {
  for (const malformedToken of [response({}), {
    ok: true, status: 201, headers: { get: () => null },
    async json() { throw new Error('truncated') },
  }]) {
    const mock = authTransport()
    let mintCalls = 0
    const fetchImpl = async (url, init) => {
      if (url.endsWith('/access_tokens')) {
        mintCalls += 1
        return malformedToken
      }
      return mock.fetchImpl(url, init)
    }
    await assert.rejects(() => mintInstallationToken({
      fetchImpl, config: mock.current, phase: 'publisher', privateKey: PEM,
      destinationState: 'present', now: 1_700_000_000_000,
    }), (error) => error.code === 'github_token_issuance_unconfirmed' && error.state === 'reconcile-required')
    assert.equal(mintCalls, 1)
  }
})

test('a server failure while issuing a token is unconfirmed and is never retried', async () => {
  const mock = authTransport()
  let mintCalls = 0
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/access_tokens')) {
      mintCalls += 1
      return response({}, 502)
    }
    return mock.fetchImpl(url, init)
  }
  await assert.rejects(() => mintInstallationToken({
    fetchImpl, config: mock.current, phase: 'publisher', privateKey: PEM,
    destinationState: 'present', now: 1_700_000_000_000,
  }), (error) => error.code === 'github_token_issuance_unconfirmed' && error.state === 'reconcile-required')
  assert.equal(mintCalls, 1)
})

test('rate-limited transport serializes mutations and applies bounded Retry-After handling', async () => {
  let clock = 0
  const waits = []
  const starts = []
  const responses = [
    { ok: false, status: 429, headers: { get: (name) => name === 'retry-after' ? '2' : null } },
    response({ ok: true }),
    response({ ok: true }),
  ]
  const fetchImpl = createRateLimitedFetch(async () => {
    starts.push(clock)
    return responses.shift()
  }, {
    now: () => clock,
    wait: async (milliseconds) => { waits.push(milliseconds); clock += milliseconds },
  })
  assert.equal((await fetchImpl('https://api.github.test/mutate', { method: 'POST' })).ok, true)
  assert.equal((await fetchImpl('https://api.github.test/mutate', { method: 'PATCH' })).ok, true)
  assert.deepEqual(starts, [1_000, 3_000, 4_000])
  assert.deepEqual(waits, [1_000, 2_000, 1_000])
})

test('rate-limited transport does not retry ordinary forbidden responses and globally bounds fallback waits', async () => {
  let forbiddenCalls = 0
  const forbidden = createRateLimitedFetch(async () => {
    forbiddenCalls += 1
    return response({}, 403)
  }, { mutationIntervalMs: 0, wait: async () => {} })
  assert.equal((await forbidden('https://api.github.test/mutate', { method: 'POST' })).status, 403)
  assert.equal(forbiddenCalls, 1)

  let rateCalls = 0
  const waits = []
  const limited = createRateLimitedFetch(async () => {
    rateCalls += 1
    return response({}, 429)
  }, { mutationIntervalMs: 0, wait: async (milliseconds) => { waits.push(milliseconds) } })
  assert.equal((await limited('https://api.github.test/mutate', { method: 'POST' })).status, 429)
  assert.equal((await limited('https://api.github.test/another', { method: 'POST' })).status, 429)
  assert.equal(rateCalls, 4)
  assert.deepEqual(waits, [60_000, 120_000])
})

test('each rate-limit retry receives a fresh per-attempt timeout signal', async () => {
  const signals = []
  const abortedAtStart = []
  let attempts = 0
  const fetchImpl = createRateLimitedFetch(async (_url, init) => {
    attempts += 1
    signals.push(init.signal)
    abortedAtStart.push(init.signal.aborted)
    await new Promise((resolve) => setTimeout(resolve, 4))
    return attempts === 1 ? response({}, 429) : response({}, 204)
  }, {
    mutationIntervalMs: 0,
    maxRetries: 1,
    wait: async () => { await new Promise((resolve) => setTimeout(resolve, 4)) },
  })
  assert.deepEqual(await revokeInstallationToken({ fetchImpl, token: TOKEN, timeoutMs: 2 }), { revoked: true })
  assert.equal(attempts, 2)
  assert.notEqual(signals[0], signals[1])
  assert.deepEqual(abortedAtStart, [false, false])
})

function publicationTransport({
  staleOnRecheck = false, refUpdateThrows = false, refUpdateMalformed = false,
  refUpdateStatus = null, reconcileToCommit = false, wrongBlobSha = false,
  wrongDirectoryEntry = false,
} = {}) {
  const calls = []
  let refReads = 0
  let updated = false
  const entries = [
    { path: '.nojekyll', mode: '100644', type: 'blob', sha: BLOB_A },
    {
      path: 'assets', mode: wrongDirectoryEntry ? '100644' : '040000', type: 'tree', sha: '8'.repeat(40),
    },
    { path: 'assets/app.js', mode: '100644', type: 'blob', sha: BLOB_B },
    { path: 'index.html', mode: '100644', type: 'blob', sha: BLOB_B },
  ]
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.includes('/git/ref/heads/main')) {
      assert.equal(init.method, 'GET')
      refReads += 1
      if (staleOnRecheck && refReads === 2) return response({ object: { sha: '9'.repeat(40) } })
      return response({ object: { sha: updated ? COMMIT : OLD } })
    }
    if (url.includes('/git/refs/heads/main')) {
      assert.equal(init.method, 'PATCH')
      if (refUpdateStatus !== null) {
        if (reconcileToCommit) updated = true
        return response({}, refUpdateStatus)
      }
      if (refUpdateMalformed) {
        if (reconcileToCommit) updated = true
        return { ok: true, status: 200, headers: { get: () => null }, async json() { throw new Error('truncated') } }
      }
      if (refUpdateThrows) {
        if (reconcileToCommit) updated = true
        throw new Error(`network failure ${TOKEN}`)
      }
      updated = true
      return response({ ref: 'refs/heads/main', object: { sha: COMMIT } })
    }
    if (url.endsWith('/git/blobs')) {
      const input = JSON.parse(init.body)
      const expected = input.content === Buffer.from('').toString('base64') ? BLOB_A : BLOB_B
      return response({ sha: wrongBlobSha ? '9'.repeat(40) : expected })
    }
    if (url.endsWith('/git/trees')) {
      assert.equal(Object.hasOwn(JSON.parse(init.body), 'base_tree'), false)
      return response({ sha: TREE })
    }
    if (url.includes(`/git/trees/${TREE}`)) return response({ sha: TREE, truncated: false, tree: entries })
    if (url.endsWith('/git/commits')) {
      const input = JSON.parse(init.body)
      assert.equal(Object.hasOwn(input, 'author'), false)
      assert.equal(Object.hasOwn(input, 'committer'), false)
      assert.deepEqual(input.parents, [OLD])
      return response({ sha: COMMIT })
    }
    if (url.endsWith(`/git/commits/${COMMIT}`)) {
      return response({ sha: COMMIT, tree: { sha: TREE }, parents: [{ sha: OLD }] })
    }
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  return { calls, fetchImpl }
}

const files = () => [
  { path: '.nojekyll', mode: '100644', bytes: Buffer.from('') },
  { path: 'assets/app.js', mode: '100644', bytes: Buffer.from('<!doctype html>') },
  { path: 'index.html', mode: '100644', bytes: Buffer.from('<!doctype html>') },
]

test('publication verifies recursive directory entries and performs one non-force expected-tip ref update', async () => {
  const mock = publicationTransport()
  const result = await publishArtifactTree({
    fetchImpl: mock.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  })
  assert.equal(result.state, 'published')
  assert.equal(result.commitSha, COMMIT)
  const treeCall = mock.calls.find(({ url, init }) => url.endsWith('/git/trees') && init.method === 'POST')
  assert.deepEqual(Object.keys(JSON.parse(treeCall.init.body)), ['tree'])
  const updates = mock.calls.filter(({ url, init }) => url.includes('/git/refs/heads/main') && init.method === 'PATCH')
  assert.equal(updates.length, 1)
  assert.deepEqual(JSON.parse(updates[0].init.body), { sha: COMMIT, force: false })
})

test('publication rejects a recursive directory entry with the wrong Git mode', async () => {
  const mock = publicationTransport({ wrongDirectoryEntry: true })
  await assert.rejects(() => publishArtifactTree({
    fetchImpl: mock.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  }), (error) => error.code === 'github_tree_mismatch')
  assert.equal(mock.calls.some(({ url }) => url.endsWith('/git/commits')), false)
})

test('publication rejects a valid blob identity that does not match the uploaded bytes', async () => {
  const mock = publicationTransport({ wrongBlobSha: true })
  await assert.rejects(() => publishArtifactTree({
    fetchImpl: mock.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  }), (error) => error.code === 'github_request_unknown'
    && error.state === 'reconcile-required'
    && error.resource === '/repos/neutral-workbench/neutral-workbench.github.io/git/blobs'
    && error.httpStatus === null)
  assert.equal(mock.calls.some(({ url }) => url.endsWith('/git/trees')), false)
})

test('a changed destination tip aborts before ref mutation and never rebases the prepared commit', async () => {
  const mock = publicationTransport({ staleOnRecheck: true })
  await assert.rejects(() => publishArtifactTree({
    fetchImpl: mock.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  }), (error) => error.code === 'github_stale_tip')
  assert.equal(mock.calls.some(({ init }) => init.method === 'PATCH'), false)
})

test('an unknown ref outcome reconciles only when the exact commit and complete tree are observed', async () => {
  for (const accepted of [
    publicationTransport({ refUpdateThrows: true, reconcileToCommit: true }),
    publicationTransport({ refUpdateMalformed: true, reconcileToCommit: true }),
    publicationTransport({ refUpdateStatus: 502, reconcileToCommit: true }),
  ]) {
    const result = await publishArtifactTree({
      fetchImpl: accepted.fetchImpl, token: TOKEN, config: config(), files: files(),
      artifactTreeDigest: ARTIFACT, expectedTip: OLD,
    })
    assert.equal(result.state, 'reconciled')
  }

  const unknown = publicationTransport({ refUpdateThrows: true, reconcileToCommit: false })
  await assert.rejects(() => publishArtifactTree({
    fetchImpl: unknown.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  }), (error) => error.code === 'github_ref_reconciliation_required' && error.state === 'reconcile-required')
})

test('revocation succeeds only on confirmed API success and sanitization drops secret-bearing causes', async () => {
  const ok = authTransport()
  assert.deepEqual(await revokeInstallationToken({ fetchImpl: ok.fetchImpl, token: TOKEN }), { revoked: true })

  const failure = async () => response({ message: TOKEN }, 500)
  await assert.rejects(() => revokeInstallationToken({ fetchImpl: failure, token: TOKEN }), (error) => {
    assert.equal(error.code, 'github_token_revocation_unconfirmed')
    assert.ok(!error.message.includes(TOKEN))
    return true
  })
  const sanitized = sanitizeGithubError(new Error(`leaked ${TOKEN} ${PEM}`))
  assert.equal(sanitized.message, 'GitHub publication failed.')
  assert.ok(!JSON.stringify(sanitized).includes(TOKEN))
})

const ROOT_COMMIT = '6'.repeat(40)
const ROOT_TREE = '7'.repeat(40)
const ROOT_BLOB = '8'.repeat(40)

function repository(privateState, id = 77) {
  return {
    id,
    name: 'neutral-workbench.github.io',
    full_name: 'neutral-workbench/neutral-workbench.github.io',
    owner: { login: 'neutral-workbench' },
    private: privateState,
    visibility: privateState ? 'private' : 'public',
    has_issues: true,
    has_discussions: false,
  }
}

function pagesPayload(overrides = {}) {
  return {
    url: 'https://api.github.com/repos/neutral-workbench/neutral-workbench.github.io/pages',
    status: 'built',
    cname: null,
    custom_404: false,
    source: { branch: 'main', path: '/' },
    html_url: 'https://neutral-workbench.github.io/',
    public: true,
    ...overrides,
  }
}

test('bootstrap helpers create only a private exact destination with Issues intake and no Discussions', async () => {
  const calls = []
  let reads = 0
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.endsWith('/repos/neutral-workbench/neutral-workbench.github.io')) {
      reads += 1
      return reads === 1 ? response({}, 404) : response(repository(true))
    }
    if (url.endsWith('/orgs/neutral-workbench/repos')) return response(repository(true), 201)
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  await createPrivateDestination({ fetchImpl, token: TOKEN, config: config() })
  const creation = calls.find(({ url }) => url.endsWith('/orgs/neutral-workbench/repos'))
  assert.deepEqual(JSON.parse(creation.init.body), {
    name: 'neutral-workbench.github.io',
    private: true,
    has_issues: true,
    has_discussions: false,
    auto_init: false,
  })
})

test('ambiguous bootstrap repository creation is reconcile-required and never reported resumable', async () => {
  let calls = 0
  await assert.rejects(createPrivateDestination({
    fetchImpl: async () => {
      calls += 1
      if (calls === 1) return response({}, 404)
      throw new Error('timeout after write')
    },
    token: TOKEN,
    config: config(),
  }), (error) => error.code === 'github_request_unknown' && error.state === 'reconcile-required')
  assert.equal(calls, 2)
})

test('empty-repository bootstrap creates and verifies one private .nojekyll root commit', async () => {
  let refReads = 0
  const fetchImpl = async (url, init) => {
    if (url.includes('/git/ref/heads/main')) {
      refReads += 1
      return refReads === 1 ? response({}, 409) : response({ object: { sha: ROOT_COMMIT } })
    }
    if (url.endsWith('/contents/.nojekyll')) {
      assert.deepEqual(JSON.parse(init.body), {
        message: 'Initialize GitHub Pages host', content: '', branch: 'main',
      })
      return response({ content: { path: '.nojekyll', sha: ROOT_BLOB }, commit: { sha: ROOT_COMMIT } }, 201)
    }
    if (url.endsWith(`/git/commits/${ROOT_COMMIT}`)) {
      return response({ sha: ROOT_COMMIT, tree: { sha: ROOT_TREE }, parents: [] })
    }
    if (url.includes(`/git/trees/${ROOT_TREE}`)) {
      return response({
        sha: ROOT_TREE,
        truncated: false,
        tree: [{ path: '.nojekyll', mode: '100644', type: 'blob', sha: ROOT_BLOB }],
      })
    }
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  assert.equal((await createNoJekyllRoot({ fetchImpl, token: TOKEN, config: config() })).commitSha, ROOT_COMMIT)
})

test('bootstrap protection starts with the bootstrap App and finalizes with only the publisher App bypass', async () => {
  const calls = []
  let current = null
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.endsWith('/neutral-workbench.github.io') && (init.method ?? 'GET') === 'GET') {
      return response(repository(false))
    }
    if (url.endsWith('/rulesets') && (init.method ?? 'GET') === 'GET') return response([])
    if (url.endsWith('/rulesets') && init.method === 'POST') {
      current = { id: 31, ...JSON.parse(init.body) }
      return response(current, 201)
    }
    if (url.endsWith('/rulesets/31') && init.method === 'PUT') {
      current = { id: 31, ...JSON.parse(init.body) }
      return response(current)
    }
    if (url.endsWith('/rulesets/31')) return response(current)
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  const created = await createBootstrapArtifactRuleset({ fetchImpl, token: TOKEN, config: config() })
  assert.equal(created.id, 31)
  const initial = JSON.parse(calls.find(({ url, init }) => (
    url.endsWith('/rulesets') && init.method === 'POST'
  )).init.body)
  assert.deepEqual(initial.bypass_actors, [{ actor_id: 101, actor_type: 'Integration', bypass_mode: 'always' }])
  assert.deepEqual(initial.rules.map(({ type }) => type), ['deletion', 'non_fast_forward', 'update'])

  const finalized = await finalizeArtifactRuleset({
    fetchImpl, token: TOKEN, config: config(), rulesetId: created.id,
  })
  assert.equal(finalized.id, 31)
  const final = JSON.parse(calls.find(({ url, init }) => url.endsWith('/rulesets/31') && init.method === 'PUT').init.body)
  assert.deepEqual(final.bypass_actors, [{ actor_id: 102, actor_type: 'Integration', bypass_mode: 'always' }])
})

test('bootstrap ruleset creation retries only after a rejected write and a fresh public-empty readback', async () => {
  const calls = []
  const waits = []
  let attempts = 0
  let current = null
  const fetchImpl = async (url, init = {}) => {
    const method = init.method ?? 'GET'
    const requestPath = new URL(url, 'https://api.github.test').pathname
    calls.push({ method, requestPath })
    if (requestPath.endsWith('/neutral-workbench.github.io') && method === 'GET') {
      return response(repository(false))
    }
    if (requestPath.endsWith('/rulesets') && method === 'GET') return response([])
    if (requestPath.endsWith('/rulesets') && method === 'POST') {
      attempts += 1
      if (attempts === 1) return response({}, 422)
      current = { id: 31, ...JSON.parse(init.body) }
      return response(current, 201)
    }
    if (requestPath.endsWith('/rulesets/31') && method === 'GET') return response(current)
    throw new Error(`Unexpected mock URL: ${method} ${requestPath}`)
  }

  const created = await createBootstrapArtifactRuleset({
    fetchImpl,
    token: TOKEN,
    config: config(),
    retryDelaysMs: [7],
    wait: async (milliseconds) => { waits.push(milliseconds) },
  })

  assert.equal(created.id, 31)
  assert.equal(attempts, 2)
  assert.deepEqual(waits, [7])
  assert.deepEqual(calls.slice(0, 6).map(({ method, requestPath }) => [method, requestPath.split('/').at(-1)]), [
    ['GET', 'neutral-workbench.github.io'],
    ['GET', 'rulesets'],
    ['POST', 'rulesets'],
    ['GET', 'neutral-workbench.github.io'],
    ['GET', 'rulesets'],
    ['POST', 'rulesets'],
  ])
})

test('rate-limit transport cannot retry a bootstrap ruleset POST without a fresh boundary readback', async () => {
  for (const [status, expectedAttempts] of [[403, 2], [429, 1]]) {
    const calls = []
    let attempts = 0
    let current = null
    const rawFetch = async (url, init = {}) => {
      const method = init.method ?? 'GET'
      const requestPath = new URL(url, 'https://api.github.test').pathname
      calls.push([method, requestPath])
      if (requestPath.endsWith('/neutral-workbench.github.io') && method === 'GET') {
        return response(repository(false))
      }
      if (requestPath.endsWith('/rulesets') && method === 'GET') return response([])
      if (requestPath.endsWith('/rulesets') && method === 'POST') {
        attempts += 1
        if (attempts === 1) {
          return {
            ok: false,
            status,
            headers: { get: (name) => name.toLowerCase() === 'retry-after' ? '0' : null },
            clone() { return this },
            async json() { return { message: 'rate limit' } },
          }
        }
        current = { id: 31, ...JSON.parse(init.body) }
        return response(current, 201)
      }
      if (requestPath.endsWith('/rulesets/31') && method === 'GET') return response(current)
      throw new Error(`Unexpected mock URL: ${method} ${requestPath}`)
    }
    const fetchImpl = createRateLimitedFetch(rawFetch, {
      mutationIntervalMs: 0,
      maxRetries: 2,
      wait: async () => {},
    })

    if (status === 403) {
      const created = await createBootstrapArtifactRuleset({
        fetchImpl,
        token: TOKEN,
        config: config(),
        retryDelaysMs: [0],
        wait: async () => {},
      })
      assert.equal(created.id, 31)
      assert.deepEqual(calls.slice(0, 6).map(([method, requestPath]) => [method, requestPath.split('/').at(-1)]), [
        ['GET', 'neutral-workbench.github.io'],
        ['GET', 'rulesets'],
        ['POST', 'rulesets'],
        ['GET', 'neutral-workbench.github.io'],
        ['GET', 'rulesets'],
        ['POST', 'rulesets'],
      ])
    } else {
      await assert.rejects(() => createBootstrapArtifactRuleset({
        fetchImpl,
        token: TOKEN,
        config: config(),
        retryDelaysMs: [0],
        wait: async () => {},
      }), (error) => error.code === 'github_request_rejected' && error.httpStatus === 429)
    }
    assert.equal(attempts, expectedAttempts)
  }
})

test('bootstrap ruleset creation never retries ambiguous or unrelated failures and preserves safe diagnostics', async () => {
  for (const [status, code, state] of [
    [500, 'github_request_unknown', 'reconcile-required'],
    [400, 'github_request_rejected', 'failed'],
  ]) {
    let attempts = 0
    const fetchImpl = async (url, init = {}) => {
      const method = init.method ?? 'GET'
      const requestPath = new URL(url, 'https://api.github.test').pathname
      if (requestPath.endsWith('/neutral-workbench.github.io') && method === 'GET') {
        return response(repository(false))
      }
      if (requestPath.endsWith('/rulesets') && method === 'GET') return response([])
      if (requestPath.endsWith('/rulesets') && method === 'POST') {
        attempts += 1
        return response({ message: `provider detail ${TOKEN}` }, status)
      }
      throw new Error(`Unexpected mock URL: ${method} ${requestPath}`)
    }

    await assert.rejects(() => createBootstrapArtifactRuleset({
      fetchImpl,
      token: TOKEN,
      config: config(),
      retryDelaysMs: [0, 0],
      wait: async () => {},
    }), (error) => {
      assert.equal(error.code, code)
      assert.equal(error.state, state)
      assert.equal(error.httpStatus, status)
      assert.equal(error.resource, '/repos/neutral-workbench/neutral-workbench.github.io/rulesets')
      assert.equal(JSON.stringify(error).includes(TOKEN), false)
      return true
    })
    assert.equal(attempts, 1)
  }
})

test('bootstrap ruleset retry stops when the public-empty boundary no longer holds', async () => {
  let rulesetReads = 0
  let attempts = 0
  const fetchImpl = async (url, init = {}) => {
    const method = init.method ?? 'GET'
    const requestPath = new URL(url, 'https://api.github.test').pathname
    if (requestPath.endsWith('/neutral-workbench.github.io') && method === 'GET') {
      return response(repository(false))
    }
    if (requestPath.endsWith('/rulesets') && method === 'GET') {
      rulesetReads += 1
      return response(rulesetReads === 1 ? [] : [{ id: 99 }])
    }
    if (requestPath.endsWith('/rulesets') && method === 'POST') {
      attempts += 1
      return response({}, 422)
    }
    throw new Error(`Unexpected mock URL: ${method} ${requestPath}`)
  }

  await assert.rejects(() => createBootstrapArtifactRuleset({
    fetchImpl,
    token: TOKEN,
    config: config(),
    retryDelaysMs: [0],
    wait: async () => {},
  }), (error) => error.code === 'github_ruleset_boundary_mismatch')
  assert.equal(attempts, 1)
  assert.equal(rulesetReads, 2)
})

test('public transition and Pages configuration re-read the exact final visibility and root-branch source', async () => {
  let publicState = false
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/pages')) {
      if (init.method === 'POST') {
        assert.deepEqual(JSON.parse(init.body), {
          build_type: 'legacy', source: { branch: 'main', path: '/' },
        })
      }
      return response(pagesPayload(), init.method === 'POST' ? 201 : 200)
    }
    if (url.endsWith('/repos/neutral-workbench/neutral-workbench.github.io')) {
      if (init.method === 'PATCH') {
        assert.deepEqual(JSON.parse(init.body), { private: false })
        publicState = true
      }
      return response(repository(!publicState))
    }
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  assert.equal((await makeDestinationPublic({ fetchImpl, token: TOKEN, config: config() })).private, false)
  assert.equal((await configureRootPages({ fetchImpl, token: TOKEN, config: config() })).source.path, '/')
})

test('Pages accepts the documented response shape without optional build_type', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ method: init.method ?? 'GET', path: new URL(url).pathname })
    return response(pagesPayload(), (init.method ?? 'GET') === 'POST' ? 201 : 200)
  }

  const pages = await configureRootPages({ fetchImpl, token: TOKEN, config: config() })
  assert.deepEqual(pages.source, { branch: 'main', path: '/' })
  assert.equal(pages.html_url, 'https://neutral-workbench.github.io/')
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET'])
})

test('Pages derives the fixed root URL when the optional response URL is omitted', async () => {
  const { html_url: _omitted, ...withoutHtmlUrl } = pagesPayload()
  const fetchImpl = async (_url, init = {}) => response(
    withoutHtmlUrl,
    (init.method ?? 'GET') === 'POST' ? 201 : 200,
  )

  const pages = await configureRootPages({ fetchImpl, token: TOKEN, config: config() })
  assert.equal(pages.html_url, 'https://neutral-workbench.github.io/')
})

test('Pages rejects present contradictory build type or malformed URL after exact readback', async () => {
  for (const payload of [
    pagesPayload({ build_type: 'workflow' }),
    pagesPayload({ html_url: 'not a URL' }),
  ]) {
    const fetchImpl = async (_url, init = {}) => response(
      payload,
      (init.method ?? 'GET') === 'POST' ? 201 : 200,
    )

    await assert.rejects(
      configureRootPages({ fetchImpl, token: TOKEN, config: config() }),
      (error) => error.code === 'github_pages_mismatch' && error.state === 'reconcile-required',
    )
  }
})

test('Pages reconciles unknown, malformed, or minimal creation outcomes through exact GET state', async () => {
  for (const createResult of [
    async () => { throw new Error('timeout after write') },
    async () => ({ ok: true, status: 201, json: async () => { throw new Error('invalid JSON') } }),
    async () => response({}, 201),
    async () => response({}, 503),
    async () => response(pagesPayload({ html_url: 'not a URL' }), 201),
  ]) {
    const calls = []
    const fetchImpl = async (url, init = {}) => {
      const method = init.method ?? 'GET'
      calls.push({ method, path: new URL(url).pathname })
      return method === 'POST' ? createResult() : response(pagesPayload())
    }

    const pages = await configureRootPages({ fetchImpl, token: TOKEN, config: config() })
    assert.equal(pages.html_url, 'https://neutral-workbench.github.io/')
    assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET'])
  }
})

test('Pages preserves a rejected creation without attempting GET reconciliation', async () => {
  let calls = 0
  const fetchImpl = async (_url, init = {}) => {
    calls += 1
    assert.equal(init.method, 'POST')
    return response({}, 422)
  }

  await assert.rejects(
    configureRootPages({ fetchImpl, token: TOKEN, config: config() }),
    (error) => error.code === 'github_request_rejected'
      && error.state === 'failed'
      && error.httpStatus === 422,
  )
  assert.equal(calls, 1)
})

test('Pages unknown creation outcomes stay reconcile-required without exact source readback', async () => {
  for (const readback of [
    response({}, 404),
    response(pagesPayload({ source: undefined })),
    response(pagesPayload({ source: { branch: 'other', path: '/' } })),
    response(pagesPayload({ source: { branch: 'main', path: '/docs' } })),
  ]) {
    let calls = 0
    const fetchImpl = async (_url, init = {}) => {
      calls += 1
      return (init.method ?? 'GET') === 'POST'
        ? Promise.reject(new Error('timeout after write'))
        : readback
    }

    await assert.rejects(
      configureRootPages({ fetchImpl, token: TOKEN, config: config() }),
      (error) => error.state === 'reconcile-required'
        && error.resource === '/repos/neutral-workbench/neutral-workbench.github.io/pages',
    )
    assert.equal(calls, 2)
  }
})

test('a confirmed public transition makes every failed final visibility read reconcile-required', async () => {
  const destinationPath = '/repos/neutral-workbench/neutral-workbench.github.io'
  for (const [finalRead, expected] of [
    [async () => { throw new Error('connection lost') }, {
      code: 'github_request_unknown', resource: destinationPath, httpStatus: null,
    }],
    [async () => response({}, 503), {
      code: 'github_request_rejected', resource: destinationPath, httpStatus: 503,
    }],
    [async () => response(repository(true)), {
      code: 'github_repository_mismatch', resource: null, httpStatus: null,
    }],
  ]) {
    let reads = 0
    const fetchImpl = async (url, init = {}) => {
      assert.equal(new URL(url).pathname, destinationPath)
      if ((init.method ?? 'GET') === 'PATCH') return response(repository(false))
      reads += 1
      if (reads === 1) return response(repository(true))
      return finalRead()
    }

    await assert.rejects(() => makeDestinationPublic({
      fetchImpl, token: TOKEN, config: config(),
    }), (error) => {
      assert.equal(error.code, expected.code)
      assert.equal(error.state, 'reconcile-required')
      assert.equal(error.resource, expected.resource)
      assert.equal(error.httpStatus, expected.httpStatus)
      return true
    })
    assert.equal(reads, 2)
  }
})

test('a rejected public transition is not reclassified before GitHub confirms public state', async () => {
  let reads = 0
  const fetchImpl = async (_url, init = {}) => {
    if ((init.method ?? 'GET') === 'PATCH') return response({}, 422)
    reads += 1
    return response(repository(true))
  }
  await assert.rejects(() => makeDestinationPublic({
    fetchImpl, token: TOKEN, config: config(),
  }), (error) => error.code === 'github_request_rejected'
    && error.state === 'failed'
    && error.httpStatus === 422)
  assert.equal(reads, 1)
})

function encodedFiles() {
  return files().map((file) => ({
    path: file.path,
    mode: file.mode,
    contentBase64: file.bytes.toString('base64'),
  }))
}

function fixedCommand(operation, role, payload = {}) {
  return { schema: FIXED_CHILD_SCHEMA, operation, role, config: config(), payload }
}

function successfulChildResult(result) {
  return {
    schema: FIXED_CHILD_RESULT_SCHEMA,
    operation: { ok: true, result, error: null },
    revocation: { confirmed: true, error: null },
  }
}

function publicationResult(previousTip = OLD) {
  return {
    state: 'published',
    artifactTreeDigest: ARTIFACT,
    commitSha: COMMIT,
    treeSha: TREE,
    previousTip,
  }
}

function bootstrapResult() {
  return {
    state: 'bootstrapped',
    rootCommitSha: ROOT_COMMIT,
    publication: publicationResult(ROOT_COMMIT),
    rulesetId: 31,
    pagesUrl: 'https://neutral-workbench.github.io/',
  }
}

function failedChildResult(operationError, revocationError = null) {
  return {
    schema: FIXED_CHILD_RESULT_SCHEMA,
    operation: { ok: false, result: null, error: operationError },
    revocation: {
      confirmed: revocationError === null,
      error: revocationError,
    },
  }
}

function successfulOperationTransport(operation, {
  rejectTemporaryRuleset = false,
  rejectFinalRuleset = false,
  staleTemporaryRulesetReadback = false,
  staleFinalRulesetReadback = false,
  omitFalseUpdateParameters = false,
  reportTrueUpdateParameters = false,
} = {}) {
  const base = '/repos/neutral-workbench/neutral-workbench.github.io'
  let repositoryExists = operation !== 'bootstrap'
  let privateState = operation === 'bootstrap'
  let pagesEnabled = operation === 'disable-pages'
  let tip = operation === 'publish' ? OLD : null
  let publishedEntries = []
  let publishedParent = null
  let currentRuleset = null
  let rulesetPhase = null
  const calls = []

  const rulesetResponse = (ruleset) => ({
    ...ruleset,
    rules: ruleset.rules.map((rule) => {
      if (rule.type !== 'update') return rule
      if (omitFalseUpdateParameters) return { type: 'update' }
      return reportTrueUpdateParameters
        ? { type: 'update', parameters: { update_allows_fetch_and_merge: true } }
        : rule
    }),
  })

  const recursiveEntries = (entries) => {
    const directories = new Set()
    for (const entry of entries) {
      const parts = entry.path.split('/')
      for (let length = 1; length < parts.length; length += 1) {
        directories.add(parts.slice(0, length).join('/'))
      }
    }
    return [
      ...[...directories].sort().map((directory) => ({
        path: directory, mode: '040000', type: 'tree', sha: '8'.repeat(40),
      })),
      ...entries,
    ]
  }

  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init })
    const method = init.method ?? 'GET'
    const requestPath = new URL(url, 'https://api.github.test').pathname
    if (requestPath.endsWith('/installation/token') && method === 'DELETE') return response({}, 204)
    if (requestPath === base && method === 'GET') {
      return repositoryExists ? response(repository(privateState)) : response({}, 404)
    }
    if (requestPath.endsWith('/orgs/neutral-workbench/repos') && method === 'POST') {
      repositoryExists = true
      return response(repository(true), 201)
    }
    if (requestPath === base && method === 'PATCH') {
      privateState = false
      return response(repository(false))
    }
    if (requestPath.includes('/git/ref/heads/main')) {
      assert.equal(method, 'GET')
      return tip === null ? response({}, 409) : response({ object: { sha: tip } })
    }
    if (requestPath.includes('/git/refs/heads/main')) {
      assert.equal(method, 'PATCH')
      tip = JSON.parse(init.body).sha
      return response({ ref: 'refs/heads/main', object: { sha: tip } })
    }
    if (requestPath.endsWith('/contents/.nojekyll') && method === 'PUT') {
      tip = ROOT_COMMIT
      return response({
        content: { path: '.nojekyll', sha: ROOT_BLOB }, commit: { sha: ROOT_COMMIT },
      }, 201)
    }
    if (requestPath.endsWith('/git/blobs') && method === 'POST') {
      const input = JSON.parse(init.body)
      return response({ sha: gitBlobSha(Buffer.from(input.content, 'base64')) })
    }
    if (requestPath.endsWith('/git/trees') && method === 'POST') {
      publishedEntries = JSON.parse(init.body).tree
      return response({ sha: TREE })
    }
    if (requestPath.includes(`/git/trees/${ROOT_TREE}`)) {
      return response({
        sha: ROOT_TREE,
        truncated: false,
        tree: [{ path: '.nojekyll', mode: '100644', type: 'blob', sha: ROOT_BLOB }],
      })
    }
    if (requestPath.includes(`/git/trees/${TREE}`)) {
      return response({ sha: TREE, truncated: false, tree: recursiveEntries(publishedEntries) })
    }
    if (requestPath.endsWith('/git/commits') && method === 'POST') {
      publishedParent = JSON.parse(init.body).parents[0] ?? null
      return response({ sha: COMMIT })
    }
    if (requestPath.endsWith(`/git/commits/${ROOT_COMMIT}`)) {
      return response({ sha: ROOT_COMMIT, tree: { sha: ROOT_TREE }, parents: [] })
    }
    if (requestPath.endsWith(`/git/commits/${COMMIT}`)) {
      return response({
        sha: COMMIT,
        tree: { sha: TREE },
        parents: publishedParent === null ? [] : [{ sha: publishedParent }],
      })
    }
    if (requestPath.endsWith('/rulesets') && method === 'POST') {
      if (rejectTemporaryRuleset) return response({}, 403)
      currentRuleset = rulesetResponse({ id: 31, ...JSON.parse(init.body) })
      rulesetPhase = 'temporary'
      return response(currentRuleset, 201)
    }
    if (requestPath.endsWith('/rulesets') && method === 'GET') return response([])
    if (requestPath.endsWith('/rulesets/31') && method === 'PUT') {
      if (rejectFinalRuleset) return response({}, 403)
      currentRuleset = rulesetResponse({ id: 31, ...JSON.parse(init.body) })
      rulesetPhase = 'final'
      return response(currentRuleset)
    }
    if (requestPath.endsWith('/rulesets/31')) {
      if (rulesetPhase === 'temporary' && staleTemporaryRulesetReadback) {
        return response({
          ...currentRuleset,
          bypass_actors: [{ actor_id: 102, actor_type: 'Integration', bypass_mode: 'always' }],
        })
      }
      if (rulesetPhase === 'final' && staleFinalRulesetReadback) {
        return response({
          ...currentRuleset,
          bypass_actors: [{ actor_id: 101, actor_type: 'Integration', bypass_mode: 'always' }],
        })
      }
      return response(currentRuleset)
    }
    if (requestPath.endsWith('/pages')) {
      if (method === 'POST') {
        pagesEnabled = true
        return response(pagesPayload(), 201)
      }
      if (method === 'DELETE') {
        pagesEnabled = false
        return response({}, 204)
      }
      return pagesEnabled ? response(pagesPayload()) : response({}, 404)
    }
    throw new Error(`Unexpected successful operation URL: ${method} ${requestPath}`)
  }
  return { calls, fetchImpl }
}

test('GitHub Free bootstrap exposes only the placeholder before protection and enables Pages after final protection', async () => {
  const transport = successfulOperationTransport('bootstrap')
  const result = await executeFixedChildCommand({
    command: fixedCommand('bootstrap', 'bootstrap', {
      files: encodedFiles(), artifactTreeDigest: ARTIFACT,
    }),
    token: TOKEN,
    fetchImpl: transport.fetchImpl,
  })
  assert.deepEqual(result, successfulChildResult({
      state: 'bootstrapped',
      rootCommitSha: ROOT_COMMIT,
      publication: {
        state: 'published',
        artifactTreeDigest: ARTIFACT,
        commitSha: COMMIT,
        treeSha: TREE,
        previousTip: ROOT_COMMIT,
      },
      rulesetId: 31,
      pagesUrl: 'https://neutral-workbench.github.io/',
  }))

  const mutations = transport.calls
    .map(({ url, init }, index) => ({
      index,
      method: init.method ?? 'GET',
      path: new URL(url, 'https://api.github.test').pathname,
      body: init.body === undefined ? null : JSON.parse(init.body),
    }))
    .filter(({ method }) => method !== 'GET' && method !== 'DELETE')
  const findMutation = (predicate) => mutations.find(({ method, path, body }) => predicate({ method, path, body }))

  const publicMutation = findMutation(({ method, path }) => method === 'PATCH' && path.endsWith('/neutral-workbench.github.io'))
  const temporaryRulesetMutation = findMutation(({ method, path }) => method === 'POST' && path.endsWith('/rulesets'))
  const artifactMutation = findMutation(({ method, path }) => method === 'PATCH' && path.endsWith('/git/refs/heads/main'))
  const finalRulesetMutation = findMutation(({ method, path }) => method === 'PUT' && path.endsWith('/rulesets/31'))
  const pagesMutation = findMutation(({ method, path }) => method === 'POST' && path.endsWith('/pages'))

  assert.ok(publicMutation.index < temporaryRulesetMutation.index)
  assert.ok(temporaryRulesetMutation.index < artifactMutation.index)
  assert.ok(artifactMutation.index < finalRulesetMutation.index)
  assert.ok(finalRulesetMutation.index < pagesMutation.index)
  assert.deepEqual(temporaryRulesetMutation.body.bypass_actors, [
    { actor_id: 101, actor_type: 'Integration', bypass_mode: 'always' },
  ])
  assert.deepEqual(finalRulesetMutation.body.bypass_actors, [
    { actor_id: 102, actor_type: 'Integration', bypass_mode: 'always' },
  ])
})

test('GitHub Free bootstrap accepts ruleset readback that omits an explicit false update default', async () => {
  const transport = successfulOperationTransport('bootstrap', { omitFalseUpdateParameters: true })
  const result = await executeFixedChildCommand({
    command: fixedCommand('bootstrap', 'bootstrap', {
      files: encodedFiles(), artifactTreeDigest: ARTIFACT,
    }),
    token: TOKEN,
    fetchImpl: transport.fetchImpl,
  })

  assert.deepEqual(result, successfulChildResult(bootstrapResult()))
  const rulesetMutations = transport.calls.filter(({ url, init }) => (
    ['POST', 'PUT'].includes(init.method)
      && new URL(url, 'https://api.github.test').pathname.includes('/rulesets')
  ))
  assert.equal(rulesetMutations.length, 2)
  for (const { init } of rulesetMutations) {
    assert.deepEqual(JSON.parse(init.body).rules.at(-1), {
      type: 'update', parameters: { update_allows_fetch_and_merge: false },
    })
  }
})

test('GitHub Free bootstrap rejects ruleset readback that explicitly enables fetch and merge updates', async () => {
  const transport = successfulOperationTransport('bootstrap', { reportTrueUpdateParameters: true })
  const result = await executeFixedChildCommand({
    command: fixedCommand('bootstrap', 'bootstrap', {
      files: encodedFiles(), artifactTreeDigest: ARTIFACT,
    }),
    token: TOKEN,
    fetchImpl: transport.fetchImpl,
  })

  assert.equal(result.operation.ok, false)
  assert.equal(result.operation.error.code, 'github_request_unknown')
  assert.equal(result.operation.error.state, 'reconcile-required')
  assert.match(result.operation.error.resource, /\/rulesets$/)
  assert.equal(result.revocation.confirmed, true)
  const requests = transport.calls.map(({ url, init }) => ({
    method: init.method ?? 'GET',
    path: new URL(url, 'https://api.github.test').pathname,
  }))
  assert.equal(requests.some(({ method, path }) => method === 'PATCH' && path.endsWith('/git/refs/heads/main')), false)
  assert.equal(requests.some(({ method, path }) => method === 'POST' && path.endsWith('/pages')), false)
})

test('GitHub Free bootstrap never publishes before temporary protection or enables Pages before final protection', async () => {
  for (const [failure, expectedArtifactMutation] of [
    [{ rejectTemporaryRuleset: true }, false],
    [{ staleTemporaryRulesetReadback: true }, false],
    [{ rejectFinalRuleset: true }, true],
    [{ staleFinalRulesetReadback: true }, true],
  ]) {
    const transport = successfulOperationTransport('bootstrap', failure)
    const result = await executeFixedChildCommand({
      command: fixedCommand('bootstrap', 'bootstrap', {
        files: encodedFiles(), artifactTreeDigest: ARTIFACT,
      }),
      token: TOKEN,
      fetchImpl: transport.fetchImpl,
    })
    assert.equal(result.operation.ok, false)
    assert.equal(result.revocation.confirmed, true)
    assert.equal(result.operation.result, null)
    assert.equal(result.operation.error.state, 'reconcile-required')
    assert.equal(result.operation.error.code, failure.rejectTemporaryRuleset || failure.rejectFinalRuleset
      ? 'github_request_rejected'
      : 'github_ruleset_mismatch')
    if (failure.rejectTemporaryRuleset || failure.rejectFinalRuleset) {
      assert.equal(result.operation.error.httpStatus, 403)
      assert.match(result.operation.error.resource, /\/rulesets(?:\/31)?$/)
    }
    const requests = transport.calls.map(({ url, init }) => ({
      method: init.method ?? 'GET',
      path: new URL(url, 'https://api.github.test').pathname,
    }))
    assert.equal(requests.some(({ method, path }) => method === 'PATCH' && path.endsWith('/git/refs/heads/main')), expectedArtifactMutation)
    assert.equal(requests.some(({ method, path }) => method === 'POST' && path.endsWith('/pages')), false)
    if (failure.rejectTemporaryRuleset) {
      assert.equal(requests.filter(({ method, path }) => method === 'POST' && path.endsWith('/rulesets')).length, 3)
    }
    assert.equal(requests.at(-1).method, 'DELETE')
    assert.equal(requests.at(-1).path.endsWith('/installation/token'), true)
  }
})

test('bootstrap child timeout covers its observed protocol workload and bounded retries', async () => {
  const currentFiles = Array.from({ length: 216 }, (_value, index) => ({
    path: `assets/file-${String(index).padStart(3, '0')}.png`, mode: '100644', contentBase64: '',
  }))
  const requestTimeoutMs = 10_000
  const command = fixedCommand('bootstrap', 'bootstrap', {
    files: currentFiles, artifactTreeDigest: ARTIFACT,
  })
  const transport = successfulOperationTransport('bootstrap')
  const result = await executeFixedChildCommand({
    command, token: TOKEN, fetchImpl: transport.fetchImpl, timeoutMs: requestTimeoutMs,
  })
  assert.equal(result.operation.ok, true)

  const observedMutationCount = transport.calls.filter(({ init }) => (init.method ?? 'GET') !== 'GET').length
  const cleanup = transport.calls.at(-1)
  assert.equal(cleanup.init.method, 'DELETE')
  assert.equal(cleanup.url.endsWith('/installation/token'), true)

  const boundedRetryWaitMs = Array.from(
    { length: PUBLICATION_MAX_RATE_LIMIT_RETRIES },
    (_value, attempt) => 60_000 * (2 ** attempt),
  ).reduce((total, delay) => total + delay, 0)
  const cleanupReserveMs = 60_000
  const bootstrapRulesetReadinessWaitMs = BOOTSTRAP_RULESET_RETRY_DELAYS_MS
    .reduce((total, delay) => total + delay, 0)
  const fixedMutationBudget = 12
  const readBudget = 24
  const cleanupCount = 1
  const mutationBudget = currentFiles.length + fixedMutationBudget
  const requestBudget = mutationBudget + readBudget + PUBLICATION_MAX_RATE_LIMIT_RETRIES + cleanupCount
  const exactBoundedWorkloadMs = (
    requestBudget * requestTimeoutMs
    + (mutationBudget + PUBLICATION_MAX_RATE_LIMIT_RETRIES + cleanupCount) * PUBLICATION_MUTATION_INTERVAL_MS
    + boundedRetryWaitMs
    + bootstrapRulesetReadinessWaitMs
    + cleanupReserveMs
  )
  assert.equal(publicationChildTimeoutMs(command, requestTimeoutMs), exactBoundedWorkloadMs)
  assert.ok(observedMutationCount <= mutationBudget)
})

test('fixed-child deadlines cover actual slow successful operations through confirmed cleanup', async () => {
  const currentFiles = Array.from({ length: 216 }, (_value, index) => ({
    path: `assets/file-${String(index).padStart(3, '0')}.png`, mode: '100644', contentBase64: '',
  }))
  const cases = [
    fixedCommand('bootstrap', 'bootstrap', { files: currentFiles, artifactTreeDigest: ARTIFACT }),
    fixedCommand('publish', 'publisher', { files: currentFiles, artifactTreeDigest: ARTIFACT }),
    fixedCommand('disable-pages', 'stop'),
  ]
  for (const command of cases) {
    let clock = 0
    const transport = successfulOperationTransport(command.operation)
    const slow = createRateLimitedFetch(async (...args) => {
      clock += 4_000
      return transport.fetchImpl(...args)
    }, {
      now: () => clock,
      wait: async (milliseconds) => { clock += milliseconds },
    })
    const result = await executeFixedChildCommand({ command, token: TOKEN, fetchImpl: slow, timeoutMs: 4_000 })
    assert.equal(result.operation.ok, true, JSON.stringify({ result, calls: transport.calls.map(({ url, init }) => [init.method ?? 'GET', url]) }))
    assert.equal(result.revocation.confirmed, true)
    assert.ok(clock < publicationChildTimeoutMs(command, 4_000))
    assert.equal(transport.calls.at(-1).url.endsWith('/installation/token'), true)
  }
  const publishDeadline = publicationChildTimeoutMs(cases[1])
  assert.ok(publishDeadline > 45 * 60_000)
  assert.ok(publishDeadline < 60 * 60_000)
})

test('fixed child command binds every operation to one non-crossing App role', () => {
  const cases = [
    fixedCommand('bootstrap', 'bootstrap', { files: encodedFiles(), artifactTreeDigest: ARTIFACT }),
    fixedCommand('publish', 'publisher', { files: encodedFiles(), artifactTreeDigest: ARTIFACT }),
    fixedCommand('disable-pages', 'stop'),
  ]
  for (const command of cases) assert.equal(validateFixedChildCommand(command), command)
  assert.throws(() => validateFixedChildCommand(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  })), /schema is invalid/)
  for (const command of cases) {
    const foreignRole = command.role === 'publisher' ? 'stop' : 'publisher'
    assert.throws(() => validateFixedChildCommand({ ...command, role: foreignRole }), (error) => {
      return error.code === 'github_child_role_invalid'
    })
  }
})

test('publisher child reads the authenticated current tip inside the child before preparing the non-force update', async () => {
  const publication = publicationTransport()
  let refReads = 0
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/installation/token')) return response({}, 204)
    if (url.includes('/git/ref/heads/main') && init.method === 'GET') refReads += 1
    return publication.fetchImpl(url, init)
  }
  const result = await executeFixedChildCommand({
    command: fixedCommand('publish', 'publisher', {
      files: encodedFiles(), artifactTreeDigest: ARTIFACT,
    }),
    token: TOKEN,
    fetchImpl,
  })
  assert.equal(result.operation.ok, true)
  assert.equal(result.operation.result.previousTip, OLD)
  assert.ok(refReads >= 4)
  const update = publication.calls.find(({ init }) => init.method === 'PATCH')
  assert.deepEqual(JSON.parse(update.init.body), { sha: COMMIT, force: false })
})

test('fixed child revokes its token in finally after success and known operation failure', async () => {
  for (const failOperation of [false, true]) {
    let revoked = 0
    let pagesReads = 0
    const fetchImpl = async (url, init) => {
      if (url.endsWith('/installation/token')) {
        revoked += 1
        return response({}, 204)
      }
      if (url.endsWith('/pages')) {
        if (failOperation && pagesReads === 0) return response({}, 500)
        if (init.method === 'DELETE') return response({}, 204)
        pagesReads += 1
        return pagesReads === 1 ? response(pagesPayload()) : response({}, 404)
      }
      throw new Error(`Unexpected mock URL: ${url}`)
    }
    const result = await executeFixedChildCommand({
      command: fixedCommand('disable-pages', 'stop'), token: TOKEN, fetchImpl,
    })
    assert.equal(result.schema, FIXED_CHILD_RESULT_SCHEMA)
    assert.equal(result.operation.ok, !failOperation)
    assert.equal(result.revocation.confirmed, true)
    assert.equal(revoked, 1)
    assert.ok(!JSON.stringify(result).includes(TOKEN))
  }
})

test('fixed child preserves both an unknown operation and unconfirmed token revocation', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/installation/token')) return response({}, 502)
    throw new Error('unknown remote operation result')
  }
  const result = await executeFixedChildCommand({
    command: fixedCommand('disable-pages', 'stop'), token: TOKEN, fetchImpl,
  })
  assert.equal(result.operation.ok, false)
  assert.equal(result.revocation.confirmed, false)
  assert.deepEqual(result.operation.error, {
    code: 'github_request_unknown',
    state: 'reconcile-required',
    resource: '/repos/neutral-workbench/neutral-workbench.github.io/pages',
    httpStatus: null,
  })
  assert.deepEqual(result.revocation.error, {
    code: 'github_token_revocation_unconfirmed',
    state: 'reconcile-required',
    resource: '/installation/token',
    httpStatus: 502,
  })
})

test('fixed process uses one absolute Node entry, shell false, token-only env, and no token argument', async () => {
  let observed
  const spawnImpl = (executable, args, options) => {
    observed = { executable, args, options }
    const child = new EventEmitter()
    child.stdin = new PassThrough()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => {}
    queueMicrotask(() => {
      child.stdout.end(`${JSON.stringify(successfulChildResult(publicationResult()))}\n`)
      child.emit('close', 0, null)
    })
    return child
  }
  const inputFile = path.resolve('C:\\release\\operation.json')
  const inputDigest = `sha256:${'d'.repeat(64)}`
  await runFixedChildProcess({
    nodeExecutable: process.execPath,
    inputFile,
    inputDigest,
    sourceBytes: Buffer.from('export {}'),
    env: { [INSTALLATION_TOKEN_ENV]: TOKEN },
    spawnImpl,
  })
  assert.equal(observed.executable, process.execPath)
  assert.equal(observed.options.shell, false)
  assert.deepEqual(observed.options.env, { [INSTALLATION_TOKEN_ENV]: TOKEN })
  assert.deepEqual(observed.args, ['--input-type=module', '-', FIXED_CHILD_MODE, inputFile, inputDigest])
  assert.equal(observed.args.some((argument) => argument.includes(TOKEN)), false)
})

test('repeated SIGINT stays intercepted until the child closes, then removes handlers', async () => {
  const signals = new EventEmitter()
  let kills = 0
  const spawnImpl = () => {
    const child = new EventEmitter()
    child.stdin = new PassThrough()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => {
      kills += 1
      if (kills === 1) queueMicrotask(() => child.emit('close', null, 'SIGINT'))
    }
    queueMicrotask(() => {
      signals.emit('SIGINT')
      assert.equal(signals.listenerCount('SIGINT'), 1)
      signals.emit('SIGINT')
    })
    return child
  }
  const result = await runFixedChildProcess({
    nodeExecutable: process.execPath,
    inputFile: path.resolve('C:/release/operation.json'),
    inputDigest: `sha256:${'d'.repeat(64)}`,
    sourceBytes: Buffer.from('export {}'),
    env: { [INSTALLATION_TOKEN_ENV]: TOKEN },
    spawnImpl,
    signalSource: signals,
  })
  assert.equal(result.signal, 'SIGINT')
  assert.equal(kills, 2)
  assert.equal(signals.listenerCount('SIGINT'), 0)
  assert.equal(signals.listenerCount('SIGTERM'), 0)
})

test('a child stdin pipe failure reaches parent token-revocation fallback', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const signals = new EventEmitter()
  const mock = authTransport()
  let killed = 0
  const spawnImpl = () => {
    const child = new EventEmitter()
    child.stdin = new EventEmitter()
    child.stdin.end = () => queueMicrotask(() => child.stdin.emit('error', new Error('write EOF')))
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => { killed += 1 }
    return child
  }
  try {
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      signalSource: signals,
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: (spec) => runFixedChildProcess({ ...spec, spawnImpl }),
    }), (error) => error.code === 'github_child_interrupted' && error.state === 'reconcile-required')
    assert.equal(killed, 1)
    assert.equal(mock.calls.filter(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE').length, 1)
    assert.equal(signals.listenerCount('SIGINT'), 0)
    assert.equal(signals.listenerCount('SIGTERM'), 0)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent preflight precedes key access and minting, and a confirmed child cleanup needs no fallback', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  const command = fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })
  await fs.writeFile(operationFile, JSON.stringify(command))
  try {
    const mock = authTransport()
    const order = []
    const fetchImpl = async (url, init) => {
      order.push('fetch')
      return mock.fetchImpl(url, init)
    }
    const result = await runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => { order.push('preflight'); return true },
      loadPrivateKey: async (keyPath) => {
        order.push('key')
        assert.equal(keyPath, config().apps.publisher.keyPath)
        return PEM
      },
      fetchImpl,
      childRunner: async (spec) => {
        assert.deepEqual(spec.env, { [INSTALLATION_TOKEN_ENV]: TOKEN })
        assert.equal(spec.nodeExecutable, process.execPath)
        return {
          exitCode: 0,
          signal: null,
          stdout: JSON.stringify(successfulChildResult(publicationResult())),
        }
      },
    })
    assert.deepEqual(result, publicationResult())
    assert.deepEqual(order.slice(0, 3), ['preflight', 'key', 'fetch'])
    assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent rejects success output that does not exactly bind the requested operation and artifact', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    for (const invalidResult of [
      { ...publicationResult(), providerBody: 'provider-internal-body' },
      { ...publicationResult(), artifactTreeDigest: `sha256:${'f'.repeat(64)}` },
    ]) {
      const mock = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 0,
          signal: null,
          stdout: JSON.stringify(successfulChildResult(invalidResult)),
        }),
      }), (error) => error.code === 'github_child_output_invalid' && error.state === 'reconcile-required')
      assert.equal(mock.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent rejects malformed bootstrap and disable-pages success payloads at their command boundaries', async () => {
  const cases = [
    {
      command: fixedCommand('bootstrap', 'bootstrap', {
        files: encodedFiles(), artifactTreeDigest: ARTIFACT,
      }),
      invalidResults: [
        { ...bootstrapResult(), providerBody: 'provider-internal-body' },
        {
          ...bootstrapResult(),
          publication: {
            ...bootstrapResult().publication,
            artifactTreeDigest: `sha256:${'f'.repeat(64)}`,
          },
        },
      ],
      transport: () => authTransport({ phase: 'bootstrap', overrides: {
        scope: { total_count: 0, repositories: [] },
      } }),
    },
    {
      command: fixedCommand('disable-pages', 'stop'),
      invalidResults: [
        { disabled: true, providerBody: 'provider-internal-body' },
        { disabled: false },
      ],
      transport: () => authTransport({ phase: 'stop' }),
    },
  ]
  for (const { command, invalidResults, transport } of cases) {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
    const operationFile = path.join(tempRoot, 'operation.json')
    await fs.writeFile(operationFile, JSON.stringify(command))
    try {
      for (const invalidResult of invalidResults) {
        const mock = transport()
        await assert.rejects(() => runPublishingChild({
          nodeExecutable: process.execPath,
          operationFile,
          childSource: Buffer.from('sealed-source'),
          preflight: async () => true,
          loadPrivateKey: async () => PEM,
          fetchImpl: mock.fetchImpl,
          childRunner: async () => ({
            exitCode: 0,
            signal: null,
            stdout: JSON.stringify(successfulChildResult(invalidResult)),
          }),
        }), (error) => error.code === 'github_child_output_invalid' && error.state === 'reconcile-required')
        assert.equal(mock.calls.filter(({ url, init }) => (
          url.endsWith('/installation/token') && init.method === 'DELETE'
        )).length, 1)
      }
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  }
})

test('parent accepts only the source-defined child input-change diagnostic shape', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const diagnostic = {
    code: 'github_child_input_changed',
    state: 'failed',
    resource: null,
    httpStatus: null,
  }
  try {
    const accepted = authTransport()
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: accepted.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult(diagnostic)),
      }),
    }), (error) => error.code === diagnostic.code
      && error.state === diagnostic.state
      && error.resource === null
      && error.httpStatus === null)
    assert.equal(accepted.calls.some(({ url }) => url.endsWith('/installation/token')), false)

    for (const invalidDiagnostic of [
      { ...diagnostic, state: 'reconcile-required' },
      { ...diagnostic, resource: 'destination-ref' },
      { ...diagnostic, httpStatus: 409 },
    ]) {
      const rejected = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: rejected.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(failedChildResult(invalidDiagnostic)),
        }),
      }), (error) => error.code === 'github_child_output_invalid'
        && error.state === 'reconcile-required')
      assert.equal(rejected.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent accepts the exact bootstrap repository-creation diagnostic resource', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('bootstrap', 'bootstrap', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const diagnostic = {
    code: 'github_request_rejected',
    state: 'failed',
    resource: '/orgs/neutral-workbench/repos',
    httpStatus: 422,
  }
  try {
    const mock = authTransport({ phase: 'bootstrap', overrides: {
      scope: { total_count: 0, repositories: [] },
    } })
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult(diagnostic)),
      }),
    }), (error) => error.code === diagnostic.code
      && error.state === diagnostic.state
      && error.resource === diagnostic.resource
      && error.httpStatus === diagnostic.httpStatus)
    assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent preserves the exact bootstrap Pages mismatch diagnostic', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('bootstrap', 'bootstrap', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const diagnostic = {
    code: 'github_pages_mismatch',
    state: 'reconcile-required',
    resource: '/repos/neutral-workbench/neutral-workbench.github.io/pages',
    httpStatus: null,
  }
  try {
    const mock = authTransport({ phase: 'bootstrap', overrides: {
      scope: { total_count: 0, repositories: [] },
    } })
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult(diagnostic)),
      }),
    }), (error) => error.code === diagnostic.code
      && error.state === diagnostic.state
      && error.resource === diagnostic.resource
      && error.httpStatus === diagnostic.httpStatus)
    assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent rejects impossible request-unknown diagnostic tuples', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const refResource = '/repos/neutral-workbench/neutral-workbench.github.io/git/ref/heads/main'
  try {
    for (const diagnostic of [
      {
        code: 'github_request_unknown',
        state: 'failed',
        resource: refResource,
        httpStatus: null,
      },
      {
        code: 'github_request_unknown',
        state: 'reconcile-required',
        resource: null,
        httpStatus: null,
      },
    ]) {
      const mock = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(failedChildResult(diagnostic)),
        }),
      }), (error) => error.code === 'github_child_output_invalid'
        && error.state === 'reconcile-required')
      assert.equal(mock.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent rejects an operation diagnostic resource unreachable by its command', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('disable-pages', 'stop')))
  try {
    const mock = authTransport({ phase: 'stop' })
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult({
          code: 'github_request_rejected',
          state: 'failed',
          resource: '/repos/neutral-workbench/neutral-workbench.github.io/git/ref/heads/main',
          httpStatus: 422,
        })),
      }),
    }), (error) => error.code === 'github_child_output_invalid'
      && error.state === 'reconcile-required')
    assert.equal(mock.calls.filter(({ url, init }) => (
      url.endsWith('/installation/token') && init.method === 'DELETE'
    )).length, 1)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent accepts bootstrap commit and tree mismatches before and after the public transition', async () => {
  const bootstrapCommand = fixedCommand('bootstrap', 'bootstrap', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })
  const bootstrapTransport = () => authTransport({ phase: 'bootstrap', overrides: {
    scope: { total_count: 0, repositories: [] },
  } })
  for (const code of ['github_commit_mismatch', 'github_tree_mismatch']) {
    for (const state of ['failed', 'reconcile-required']) {
      const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
      const operationFile = path.join(tempRoot, 'operation.json')
      await fs.writeFile(operationFile, JSON.stringify(bootstrapCommand))
      try {
        const mock = bootstrapTransport()
        await assert.rejects(() => runPublishingChild({
          nodeExecutable: process.execPath,
          operationFile,
          childSource: Buffer.from('sealed-source'),
          preflight: async () => true,
          loadPrivateKey: async () => PEM,
          fetchImpl: mock.fetchImpl,
          childRunner: async () => ({
            exitCode: 1,
            signal: null,
            stdout: JSON.stringify(failedChildResult({
              code,
              state,
              resource: null,
              httpStatus: null,
            })),
          }),
        }), (error) => error.code === code && error.state === state)
        assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
      } finally {
        await fs.rm(tempRoot, { recursive: true, force: true })
      }
    }
  }
})

test('parent rejects fabricated direct blob-mismatch diagnostics for every command', async () => {
  const cases = [
    {
      command: fixedCommand('bootstrap', 'bootstrap', {
        files: encodedFiles(), artifactTreeDigest: ARTIFACT,
      }),
      state: 'reconcile-required',
      transport: () => authTransport({ phase: 'bootstrap', overrides: {
        scope: { total_count: 0, repositories: [] },
      } }),
    },
    {
      command: fixedCommand('publish', 'publisher', {
        files: encodedFiles(), artifactTreeDigest: ARTIFACT,
      }),
      state: 'failed',
      transport: () => authTransport(),
    },
    {
      command: fixedCommand('disable-pages', 'stop'),
      state: 'failed',
      transport: () => authTransport({ phase: 'stop' }),
    },
  ]
  for (const item of cases) {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
    const operationFile = path.join(tempRoot, 'operation.json')
    await fs.writeFile(operationFile, JSON.stringify(item.command))
    try {
      const mock = item.transport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(failedChildResult({
            code: 'github_blob_mismatch',
            state: item.state,
            resource: null,
            httpStatus: null,
          })),
        }),
      }), (error) => error.code === 'github_child_output_invalid'
        && error.state === 'reconcile-required')
      assert.equal(mock.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  }
})

test('parent rejects a successful confirmed-revocation envelope with a nonzero exit', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    const mock = authTransport()
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(successfulChildResult(publicationResult())),
      }),
    }), (error) => error.code === 'github_child_output_invalid'
      && error.state === 'reconcile-required')
    assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent accepts only source-defined revocation diagnostic tuples', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const successfulOperation = { ok: true, result: publicationResult(), error: null }
  const unrecoverableOperation = {
    ok: false,
    result: null,
    error: {
      code: 'github_child_output_invalid',
      state: 'failed',
      resource: null,
      httpStatus: null,
    },
  }
  const childResult = (error, operation = successfulOperation) => ({
    schema: FIXED_CHILD_RESULT_SCHEMA,
    operation,
    revocation: { confirmed: false, error },
  })
  try {
    const tokenInvalid = {
      code: 'github_token_invalid',
      state: 'failed',
      resource: null,
      httpStatus: null,
    }
    const tokenInvalidMock = authTransport()
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: tokenInvalidMock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(childResult(tokenInvalid, unrecoverableOperation)),
      }),
    }), (error) => error.code === 'github_child_output_invalid' && error.state === 'failed')
    assert.equal(tokenInvalidMock.calls.filter(({ url, init }) => (
      url.endsWith('/installation/token') && init.method === 'DELETE'
    )).length, 1)

    for (const diagnostic of [
      {
        code: 'github_token_revocation_unconfirmed',
        state: 'reconcile-required',
        resource: '/installation/token',
        httpStatus: null,
      },
      {
        code: 'github_token_revocation_unconfirmed',
        state: 'reconcile-required',
        resource: '/installation/token',
        httpStatus: 503,
      },
    ]) {
      const mock = authTransport()
      const result = await runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(childResult(diagnostic)),
        }),
      })
      assert.deepEqual(result, publicationResult())
      assert.equal(mock.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    }

    for (const diagnostic of [
      {
        code: 'github_token_invalid',
        state: 'reconcile-required',
        resource: null,
        httpStatus: null,
      },
      {
        code: 'github_token_invalid',
        state: 'failed',
        resource: null,
        httpStatus: 401,
      },
      {
        code: 'github_token_revocation_unconfirmed',
        state: 'reconcile-required',
        resource: '/installation/token',
        httpStatus: 204,
      },
    ]) {
      const mock = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(childResult(
            diagnostic,
            diagnostic.code === 'github_token_invalid' ? unrecoverableOperation : successfulOperation,
          )),
        }),
      }), (error) => error.code === 'github_child_output_invalid'
        && error.state === 'reconcile-required')
      assert.equal(mock.calls.filter(({ url, init }) => (
        url.endsWith('/installation/token') && init.method === 'DELETE'
      )).length, 1)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent detects a JSON-escaped credential anywhere in parsed child output', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  const escapedToken = 'ghs_opaque"credential'
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    const mock = authTransport({ overrides: {
      token: {
        token: escapedToken,
        expires_at: '2099-09-07T01:00:00Z',
        permissions: APP_PERMISSION_PROFILES.publisher,
      },
    } })
    const stdout = JSON.stringify(failedChildResult({
      code: escapedToken,
      state: 'failed',
      resource: null,
      httpStatus: null,
    }))
    assert.equal(stdout.includes(escapedToken), false)
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({ exitCode: 1, signal: null, stdout }),
    }), (error) => {
      assert.equal(error.code, 'github_child_output_invalid')
      assert.equal(JSON.stringify(error).includes(escapedToken), false)
      return true
    })
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent returns a verified operation result after fallback confirms token revocation', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const revocationError = {
    code: 'github_token_revocation_unconfirmed',
    state: 'reconcile-required',
    resource: '/installation/token',
    httpStatus: 503,
  }
  try {
    const mock = authTransport()
    const result = await runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify({
          schema: FIXED_CHILD_RESULT_SCHEMA,
          operation: { ok: true, result: publicationResult(), error: null },
          revocation: { confirmed: false, error: revocationError },
        }),
      }),
    })
    assert.deepEqual(result, publicationResult())
    assert.equal(mock.calls.filter(({ url, init }) => (
      url.endsWith('/installation/token') && init.method === 'DELETE'
    )).length, 1)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent reports only revocation uncertainty when the operation succeeded but both cleanup attempts fail', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const revocationError = {
    code: 'github_token_revocation_unconfirmed',
    state: 'reconcile-required',
    resource: '/installation/token',
    httpStatus: 503,
  }
  try {
    const mock = authTransport()
    const fetchImpl = async (url, init) => (
      url.endsWith('/installation/token') ? response({}, 504) : mock.fetchImpl(url, init)
    )
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify({
          schema: FIXED_CHILD_RESULT_SCHEMA,
          operation: { ok: true, result: publicationResult(), error: null },
          revocation: { confirmed: false, error: revocationError },
        }),
      }),
    }), (error) => {
      assert.equal(error.code, 'github_token_revocation_unconfirmed')
      assert.equal(error.operationDiagnostic, null)
      assert.equal(error.revocationDiagnostic, null)
      return true
    })
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent preserves safe GitHub status and resource from a rejected fixed-child operation', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    for (const resource of [
      '/repos/neutral-workbench/neutral-workbench.github.io/git/ref/heads/main',
      '/repos/neutral-workbench/neutral-workbench.github.io/git/refs/heads/main',
    ]) {
      const mock = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => ({
          exitCode: 1,
          signal: null,
          stdout: JSON.stringify(failedChildResult({
            code: 'github_request_rejected',
            state: 'failed',
            resource,
            httpStatus: 422,
          })),
        }),
      }), (error) => {
        assert.equal(error.code, 'github_request_rejected')
        assert.equal(error.state, 'failed')
        assert.equal(error.resource, resource)
        assert.equal(error.httpStatus, 422)
        return true
      })
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent preserves the child operation diagnostic when fallback revocation succeeds', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const operationDiagnostic = {
    code: 'github_request_unknown',
    state: 'reconcile-required',
    resource: '/repos/neutral-workbench/neutral-workbench.github.io/git/refs/heads/main',
    httpStatus: 502,
  }
  const revocationDiagnostic = {
    code: 'github_token_revocation_unconfirmed',
    state: 'reconcile-required',
    resource: '/installation/token',
    httpStatus: 503,
  }
  try {
    const mock = authTransport()
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult(operationDiagnostic, revocationDiagnostic)),
      }),
    }), (error) => {
      assert.equal(error.code, operationDiagnostic.code)
      assert.equal(error.state, operationDiagnostic.state)
      assert.equal(error.resource, operationDiagnostic.resource)
      assert.equal(error.httpStatus, operationDiagnostic.httpStatus)
      assert.equal(error.operationDiagnostic, null)
      assert.equal(error.revocationDiagnostic, null)
      return true
    })
    assert.equal(mock.calls.filter(({ url, init }) => (
      url.endsWith('/installation/token') && init.method === 'DELETE'
    )).length, 1)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent combines the child operation diagnostic with a failed fallback revocation', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const operationDiagnostic = {
    code: 'github_request_unknown',
    state: 'reconcile-required',
    resource: '/repos/neutral-workbench/neutral-workbench.github.io/git/refs/heads/main',
    httpStatus: 502,
  }
  const childRevocationDiagnostic = {
    code: 'github_token_revocation_unconfirmed',
    state: 'reconcile-required',
    resource: '/installation/token',
    httpStatus: 503,
  }
  const mock = authTransport()
  const fetchImpl = async (url, init) => (
    url.endsWith('/installation/token')
      ? response({}, 504)
      : mock.fetchImpl(url, init)
  )
  try {
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl,
      childRunner: async () => ({
        exitCode: 1,
        signal: null,
        stdout: JSON.stringify(failedChildResult(operationDiagnostic, childRevocationDiagnostic)),
      }),
    }), (error) => {
      assert.equal(error.code, 'github_operation_and_revocation_unconfirmed')
      assert.equal(error.state, 'reconcile-required')
      assert.deepEqual(error.operationDiagnostic, operationDiagnostic)
      assert.deepEqual(error.revocationDiagnostic, {
        code: 'github_token_revocation_unconfirmed',
        state: 'reconcile-required',
        resource: '/installation/token',
        httpStatus: 504,
      })
      return true
    })
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent performs revocation fallback when the fixed child is interrupted', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    const mock = authTransport()
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => {
        throw new PublicReleaseGithubError('Fixed publishing child was interrupted.', {
          code: 'github_child_interrupted', state: 'reconcile-required',
        })
      },
    }), (error) => error.code === 'github_child_interrupted' && error.state === 'reconcile-required')
    assert.equal(mock.calls.filter(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE').length, 1)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent preserves both child-operation ambiguity and fallback revocation failure', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const mock = authTransport()
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/installation/token')) return response({}, 502)
    return mock.fetchImpl(url, init)
  }
  try {
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl,
      childRunner: async () => {
        throw new PublicReleaseGithubError('Fixed publishing child was interrupted.', {
          code: 'github_child_interrupted', state: 'reconcile-required',
        })
      },
    }), (error) => {
      assert.equal(error.code, 'github_operation_and_revocation_unconfirmed')
      assert.equal(error.state, 'reconcile-required')
      assert.match(error.message, /operation and installation token revocation/)
      assert.deepEqual(error.operationDiagnostic, {
        code: 'github_child_interrupted',
        state: 'reconcile-required',
        resource: null,
        httpStatus: null,
      })
      assert.deepEqual(error.revocationDiagnostic, {
        code: 'github_token_revocation_unconfirmed',
        state: 'reconcile-required',
        resource: '/installation/token',
        httpStatus: 502,
      })
      return true
    })
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('parent treats signalled or malformed post-spawn output as an unknown remote operation', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  try {
    for (const childProcess of [
      { exitCode: null, signal: 'SIGINT', stdout: '' },
      { exitCode: 0, signal: null, stdout: '{truncated' },
    ]) {
      const mock = authTransport()
      await assert.rejects(() => runPublishingChild({
        nodeExecutable: process.execPath,
        operationFile,
        childSource: Buffer.from('sealed-source'),
        preflight: async () => true,
        loadPrivateKey: async () => PEM,
        fetchImpl: mock.fetchImpl,
        childRunner: async () => childProcess,
      }), (error) => error.state === 'reconcile-required'
        && ['github_child_interrupted', 'github_child_output_invalid'].includes(error.code))
      assert.equal(mock.calls.filter(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE').length, 1)
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('repeated signals during mint stay intercepted through token revocation and remove handlers', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const signals = new EventEmitter()
  const mock = authTransport()
  let childRuns = 0
  try {
    const fetchImpl = async (url, init) => {
      const result = await mock.fetchImpl(url, init)
      if (url.endsWith('/access_tokens')) {
        signals.emit('SIGINT')
        assert.equal(signals.listenerCount('SIGINT'), 1)
        signals.emit('SIGINT')
      }
      if (url.endsWith('/installation/token')) {
        assert.equal(signals.listenerCount('SIGTERM'), 1)
        signals.emit('SIGTERM')
        signals.emit('SIGTERM')
      }
      return result
    }
    await assert.rejects(runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile, childSource: Buffer.from('sealed-source'), signalSource: signals,
      preflight: async () => true, loadPrivateKey: async () => PEM, fetchImpl,
      childRunner: async () => { childRuns += 1 },
    }), (error) => error.code === 'github_child_interrupted' && error.state === 'reconcile-required')
    assert.equal(childRuns, 0)
    assert.equal(mock.calls.filter(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE').length, 1)
    assert.equal(signals.listenerCount('SIGINT'), 0)
    assert.equal(signals.listenerCount('SIGTERM'), 0)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('an insufficient token lifetime revokes immediately without starting the child', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  const now = Date.parse('2026-09-07T00:00:00Z')
  const mock = authTransport({ overrides: {
    token: {
      token: TOKEN,
      expires_at: '2026-09-07T00:02:00Z',
      permissions: APP_PERMISSION_PROFILES.publisher,
    },
  } })
  const signals = new EventEmitter()
  let childRuns = 0
  try {
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      signalSource: signals,
      preflight: async () => true,
      loadPrivateKey: async () => PEM,
      fetchImpl: mock.fetchImpl,
      childRunner: async () => { childRuns += 1 },
      now: () => now,
    }), (error) => error.code === 'github_token_lifetime_insufficient' && error.state === 'failed')
    assert.equal(childRuns, 0)
    assert.equal(mock.calls.filter(({ url, init }) => url.endsWith('/installation/token') && init.method === 'DELETE').length, 1)
    assert.equal(signals.listenerCount('SIGINT'), 0)
    assert.equal(signals.listenerCount('SIGTERM'), 0)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})

test('a failed preflight cannot read a key, mint a token, or spawn a child', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'zzz-public-child-'))
  const operationFile = path.join(tempRoot, 'operation.json')
  await fs.writeFile(operationFile, JSON.stringify(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT,
  })))
  let keyReads = 0
  let childRuns = 0
  try {
    await assert.rejects(() => runPublishingChild({
      nodeExecutable: process.execPath,
      operationFile,
      childSource: Buffer.from('sealed-source'),
      preflight: async () => false,
      loadPrivateKey: async () => { keyReads += 1; return PEM },
      fetchImpl: async () => { throw new Error('must not fetch') },
      childRunner: async () => { childRuns += 1 },
    }), /preflight/)
    assert.equal(keyReads, 0)
    assert.equal(childRuns, 0)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})
