import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import {
  APP_PERMISSION_PROFILES,
  GITHUB_API_VERSION,
  GITHUB_CONFIG_SCHEMA,
  FIXED_CHILD_MODE,
  FIXED_CHILD_RESULT_SCHEMA,
  FIXED_CHILD_SCHEMA,
  INSTALLATION_TOKEN_ENV,
  PUBLIC_BRANCH_RULESET_NAME,
  PublicReleaseGithubError,
  configureRootPages,
  createArtifactRuleset,
  createNoJekyllRoot,
  createPrivateDestination,
  createGithubAppJwt,
  createRateLimitedFetch,
  disablePages,
  executeFixedChildCommand,
  inspectPublicRelease,
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
const TOKEN = 'UNIQUE_TOKEN_7'
const OLD = '1'.repeat(40)
const BLOB_A = '2'.repeat(40)
const BLOB_B = '3'.repeat(40)
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

function authTransport({ phase = 'publisher', overrides = {} } = {}) {
  const calls = []
  const current = config()
  const role = phase === 'publisher' ? 'publisher' : 'bootstrap'
  const app = current.apps[role]
  const permissions = APP_PERMISSION_PROFILES[phase]
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
})

test('bootstrap and recovery phases require their distinct exact permission profiles', async () => {
  for (const phase of ['bootstrap', 'recovery']) {
    const mock = authTransport({ phase })
    await mintInstallationToken({
      fetchImpl: mock.fetchImpl, config: mock.current, phase, privateKey: PEM,
      destinationState: 'present', now: 1_700_000_000_000,
    })
    const mint = mock.calls.find(({ url }) => url.endsWith('/access_tokens'))
    assert.deepEqual(JSON.parse(mint.init.body).permissions, APP_PERMISSION_PROFILES[phase])
  }
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
  for (const phase of ['publisher', 'recovery']) {
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

test('rate-limited transport does not retry ordinary forbidden responses and bounds fallback waits', async () => {
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
  assert.equal(rateCalls, 3)
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
  refUpdateStatus = null, reconcileToCommit = false,
} = {}) {
  const calls = []
  let refReads = 0
  let updated = false
  const entries = [
    { path: '.nojekyll', mode: '100644', type: 'blob', sha: BLOB_A },
    { path: 'index.html', mode: '100644', type: 'blob', sha: BLOB_B },
  ]
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.includes('/git/ref/heads/main')) {
      if (init.method === 'PATCH') {
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
      refReads += 1
      if (staleOnRecheck && refReads === 2) return response({ object: { sha: '9'.repeat(40) } })
      return response({ object: { sha: updated ? COMMIT : OLD } })
    }
    if (url.endsWith('/git/blobs')) {
      const input = JSON.parse(init.body)
      return response({ sha: input.content === Buffer.from('').toString('base64') ? BLOB_A : BLOB_B })
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
  { path: 'index.html', mode: '100644', bytes: Buffer.from('<!doctype html>') },
]

test('publication writes complete blobs/tree/commit and performs one non-force expected-tip ref update', async () => {
  const mock = publicationTransport()
  const result = await publishArtifactTree({
    fetchImpl: mock.fetchImpl, token: TOKEN, config: config(), files: files(),
    artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  })
  assert.equal(result.state, 'published')
  assert.equal(result.commitSha, COMMIT)
  const treeCall = mock.calls.find(({ url, init }) => url.endsWith('/git/trees') && init.method === 'POST')
  assert.deepEqual(Object.keys(JSON.parse(treeCall.init.body)), ['tree'])
  const updates = mock.calls.filter(({ url, init }) => url.includes('/git/ref/heads/main') && init.method === 'PATCH')
  assert.equal(updates.length, 1)
  assert.deepEqual(JSON.parse(updates[0].init.body), { sha: COMMIT, force: false })
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

test('publication child deadline scales with the exact artifact and reserves rate-limit cleanup time', () => {
  const small = fixedCommand('publish', 'publisher', { files: encodedFiles(), artifactTreeDigest: ARTIFACT })
  const current = fixedCommand('publish', 'publisher', {
    files: Array.from({ length: 216 }, (_value, index) => ({
      path: `assets/file-${index}.png`, mode: '100644', contentBase64: '',
    })),
    artifactTreeDigest: ARTIFACT,
  })
  assert.ok(publicationChildTimeoutMs(current) > publicationChildTimeoutMs(small))
  assert.ok(publicationChildTimeoutMs(current) < 15 * 60_000)
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

function rulesetPayload(id = 31) {
  return {
    id,
    name: PUBLIC_BRANCH_RULESET_NAME,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [{ actor_id: 102, actor_type: 'Integration', bypass_mode: 'always' }],
    conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      { type: 'update', parameters: { update_allows_fetch_and_merge: false } },
    ],
  }
}

function pagesPayload() {
  return {
    build_type: 'legacy',
    source: { branch: 'main', path: '/' },
    html_url: 'https://neutral-workbench.github.io/',
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

test('bootstrap protection has one publisher Integration bypass and blocks deletion, non-fast-forward, and direct updates', async () => {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url.endsWith('/rulesets') && init.method === 'POST') return response({ id: 31, ...JSON.parse(init.body) }, 201)
    if (url.endsWith('/rulesets/31')) return response(rulesetPayload())
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  assert.equal((await createArtifactRuleset({ fetchImpl, token: TOKEN, config: config() })).id, 31)
  const body = JSON.parse(calls.find(({ url }) => url.endsWith('/rulesets')).init.body)
  assert.deepEqual(body.bypass_actors, [{ actor_id: 102, actor_type: 'Integration', bypass_mode: 'always' }])
  assert.deepEqual(body.rules.map(({ type }) => type), ['deletion', 'non_fast_forward', 'update'])
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

function inspectionTransport({ buildPending = false, unexpectedActor = null } = {}) {
  const fetchImpl = async (url) => {
    if (url.endsWith('/repos/neutral-workbench/neutral-workbench.github.io')) return response(repository(false))
    if (url.endsWith('/rulesets/31')) return response(rulesetPayload())
    if (url.endsWith('/pages')) return response(pagesPayload())
    if (url.includes('/git/ref/heads/main')) return response({ object: { sha: COMMIT } })
    if (url.endsWith(`/git/commits/${COMMIT}`)) return response({ sha: COMMIT, tree: { sha: TREE }, parents: [{ sha: OLD }] })
    if (url.includes('/public_members')) return response([])
    if (url.includes('/contributors')) {
      return response(buildPending ? [] : [{ login: unexpectedActor ?? 'neutral-publisher[bot]' }])
    }
    if (url.includes('/events')) {
      return response(buildPending ? [] : [{ type: 'PushEvent', actor: { login: 'github-pages[bot]' } }])
    }
    if (url.endsWith(`/commits/${COMMIT}`)) {
      return response({ author: { login: 'neutral-publisher[bot]' }, committer: { login: 'neutral-publisher[bot]' } })
    }
    if (url.endsWith('/pages/builds/latest')) {
      return buildPending
        ? response({}, 404)
        : response({ status: 'built', commit: COMMIT, pusher: { login: 'github-pages[bot]' } })
    }
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  return fetchImpl
}

function liveTransport({ mismatch = false } = {}) {
  const expected = new Map(files().map((file) => [new URL(file.path, 'https://neutral-workbench.github.io/').href, file.bytes]))
  return async (url) => {
    const bytes = mismatch && url.endsWith('/index.html') ? Buffer.from('changed') : expected.get(url)
    return {
      ok: Boolean(bytes),
      status: bytes ? 200 : 404,
      url,
      async arrayBuffer() { return bytes },
    }
  }
}

test('public inspection verifies visibility, ruleset, build commit, exact live bytes, and allowed actor metadata', async () => {
  const result = await inspectPublicRelease({
    fetchImpl: inspectionTransport(),
    publicFetchImpl: inspectionTransport(),
    liveFetchImpl: liveTransport(),
    token: TOKEN,
    config: config(),
    rulesetId: 31,
    expectedCommitSha: COMMIT,
    expectedTreeSha: TREE,
    files: files(),
  })
  assert.equal(result.complete, true)
  assert.deepEqual(result.actors.unexpectedActors, [])
  assert.deepEqual(result.live.mismatchedPaths, [])
})

test('incomplete public actor/build propagation remains pending while unexpected actors and live mismatch fail completion', async () => {
  const pending = await inspectPublicRelease({
    fetchImpl: inspectionTransport({ buildPending: true }),
    publicFetchImpl: inspectionTransport({ buildPending: true }),
    liveFetchImpl: liveTransport(),
    token: TOKEN,
    config: config(),
    rulesetId: 31,
    expectedCommitSha: COMMIT,
    expectedTreeSha: TREE,
    files: files(),
  })
  assert.equal(pending.complete, false)
  assert.ok(pending.pendingSurfaces.includes('pages-build'))
  assert.ok(pending.pendingSurfaces.includes('contributors'))

  const actor = await inspectPublicRelease({
    fetchImpl: inspectionTransport({ unexpectedActor: 'personal-user' }),
    publicFetchImpl: inspectionTransport({ unexpectedActor: 'personal-user' }),
    liveFetchImpl: liveTransport(), token: TOKEN, config: config(), rulesetId: 31,
    expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(),
  })
  assert.deepEqual(actor.actors.unexpectedActors, ['personal-user'])
  assert.equal(actor.complete, false)

  const live = await inspectPublicRelease({
    fetchImpl: inspectionTransport(), liveFetchImpl: liveTransport({ mismatch: true }),
    publicFetchImpl: inspectionTransport(),
    token: TOKEN, config: config(), rulesetId: 31,
    expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(),
  })
  assert.deepEqual(live.live.mismatchedPaths, ['index.html'])
  assert.equal(live.complete, false)
})

test('live file inspection bounds a transport that ignores AbortSignal', async () => {
  const result = await inspectPublicRelease({
    fetchImpl: inspectionTransport(), publicFetchImpl: inspectionTransport(),
    liveFetchImpl: async () => new Promise(() => {}),
    token: TOKEN, config: config(), rulesetId: 31,
    expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(), timeoutMs: 5,
  })
  assert.equal(result.complete, false)
  assert.deepEqual(result.live.mismatchedPaths, files().map((file) => file.path))
})

test('public actor inspection follows all pages and excludes community Issue activity from release identities', async () => {
  const calls = []
  const publicFetchImpl = async (url) => {
    calls.push(url)
    const parsed = new URL(url)
    if (parsed.pathname === '/repos/neutral-workbench/neutral-workbench.github.io') return response(repository(false))
    if (parsed.pathname.endsWith('/commits/' + COMMIT)) {
      return response({ author: { login: 'neutral-publisher[bot]' }, committer: { login: 'neutral-publisher[bot]' } })
    }
    const page = parsed.searchParams.get('page')
    const next = (resource) => `<https://api.github.com${resource}?per_page=100&page=2>; rel="next"`
    if (parsed.pathname.endsWith('/public_members')) {
      return page === '2' ? response([]) : response([], 200, next(parsed.pathname))
    }
    if (parsed.pathname.endsWith('/contributors')) {
      return page === '2'
        ? response([{ login: 'neutral-bootstrap[bot]' }])
        : response([{ login: 'neutral-publisher[bot]' }], 200, next(parsed.pathname))
    }
    if (parsed.pathname.endsWith('/events')) {
      return page === '2'
        ? response([{ type: 'PushEvent', actor: { login: 'github-pages[bot]' } }])
        : response([{ type: 'IssueCommentEvent', actor: { login: 'community-user' } }], 200, next(parsed.pathname))
    }
    throw new Error(`Unexpected mock URL: ${url}`)
  }
  const result = await inspectPublicRelease({
    fetchImpl: inspectionTransport(), publicFetchImpl, liveFetchImpl: liveTransport(),
    token: TOKEN, config: config(), rulesetId: 31,
    expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(),
  })
  assert.equal(result.complete, true)
  assert.equal(result.actors.observedActors.includes('community-user'), false)
  assert.deepEqual(result.actors.unexpectedActors, [])
  for (const resource of ['public_members', 'contributors', 'events']) {
    assert.ok(calls.some((url) => url.includes(`/${resource}`) && url.includes('page=2')))
  }
})

test('public actor pagination fails closed at the bounded page limit', async () => {
  const publicFetchImpl = async (url) => {
    const parsed = new URL(url)
    if (parsed.pathname === '/repos/neutral-workbench/neutral-workbench.github.io') return response(repository(false))
    if (parsed.pathname.endsWith('/commits/' + COMMIT)) {
      return response({ author: { login: 'neutral-publisher[bot]' }, committer: { login: 'neutral-publisher[bot]' } })
    }
    const page = Number(parsed.searchParams.get('page') ?? '1')
    return response([], 200,
      `<https://api.github.com${parsed.pathname}?per_page=100&page=${page + 1}>; rel="next"`)
  }
  await assert.rejects(() => inspectPublicRelease({
    fetchImpl: inspectionTransport(), publicFetchImpl, liveFetchImpl: liveTransport(),
    token: TOKEN, config: config(), rulesetId: 31,
    expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(),
  }), (error) => error.code === 'github_actor_pagination_limit')
})

test('public actor pagination rejects malformed, cross-origin, and repeated next links', async (t) => {
  const links = [
    ['malformed', 'not-a-link; rel="next"'],
    ['cross-origin', '<https://evil.example/orgs/neutral-workbench/public_members?page=2>; rel="next"'],
    ['repeated', '<https://api.github.com/orgs/neutral-workbench/public_members?per_page=100>; rel="next"'],
  ]
  for (const [name, link] of links) await t.test(name, async () => {
    const publicFetchImpl = async (url) => {
      const parsed = new URL(url)
      if (parsed.pathname === '/repos/neutral-workbench/neutral-workbench.github.io') return response(repository(false))
      if (parsed.pathname.endsWith('/commits/' + COMMIT)) {
        return response({ author: { login: 'neutral-publisher[bot]' }, committer: { login: 'neutral-publisher[bot]' } })
      }
      if (parsed.pathname.endsWith('/public_members')) return response([], 200, link)
      return response([])
    }
    await assert.rejects(() => inspectPublicRelease({
      fetchImpl: inspectionTransport(), publicFetchImpl, liveFetchImpl: liveTransport(),
      token: TOKEN, config: config(), rulesetId: 31,
      expectedCommitSha: COMMIT, expectedTreeSha: TREE, files: files(),
    }), (error) => error.code === 'github_actor_pagination_invalid')
  })
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

test('fixed child command binds every operation to one non-crossing App role', () => {
  const cases = [
    fixedCommand('bootstrap', 'bootstrap', { files: encodedFiles(), artifactTreeDigest: ARTIFACT }),
    fixedCommand('publish', 'publisher', { files: encodedFiles(), artifactTreeDigest: ARTIFACT }),
    fixedCommand('disable-pages', 'recovery'),
  ]
  for (const command of cases) assert.equal(validateFixedChildCommand(command), command)
  assert.throws(() => validateFixedChildCommand(fixedCommand('publish', 'publisher', {
    files: encodedFiles(), artifactTreeDigest: ARTIFACT, expectedTip: OLD,
  })), /schema is invalid/)
  for (const command of cases) {
    const foreignRole = command.role === 'publisher' ? 'recovery' : 'publisher'
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
  assert.equal(result.ok, true)
  assert.equal(result.result.previousTip, OLD)
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
      command: fixedCommand('disable-pages', 'recovery'), token: TOKEN, fetchImpl,
    })
    assert.equal(result.schema, FIXED_CHILD_RESULT_SCHEMA)
    assert.equal(result.ok, !failOperation)
    assert.equal(result.tokenRevoked, true)
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
    command: fixedCommand('disable-pages', 'recovery'), token: TOKEN, fetchImpl,
  })
  assert.equal(result.ok, false)
  assert.equal(result.tokenRevoked, false)
  assert.equal(result.error.code, 'github_operation_and_revocation_unconfirmed')
  assert.equal(result.error.state, 'reconcile-required')
  assert.match(result.error.message, /operation and installation token revocation/)
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
      child.stdout.end(`${JSON.stringify({
        schema: FIXED_CHILD_RESULT_SCHEMA,
        ok: true,
        tokenRevoked: true,
        result: { state: 'published' },
        error: null,
      })}\n`)
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

test('injected SIGINT kills the child, returns a non-null close signal, and removes handlers', async () => {
  const signals = new EventEmitter()
  const spawnImpl = () => {
    const child = new EventEmitter()
    child.stdin = new PassThrough()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => queueMicrotask(() => child.emit('close', null, 'SIGINT'))
    queueMicrotask(() => signals.emit('SIGINT'))
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
          stdout: JSON.stringify({
            schema: FIXED_CHILD_RESULT_SCHEMA,
            ok: true,
            tokenRevoked: true,
            result: { state: 'published' },
            error: null,
          }),
        }
      },
    })
    assert.deepEqual(result, { state: 'published' })
    assert.deepEqual(order.slice(0, 3), ['preflight', 'key', 'fetch'])
    assert.equal(mock.calls.some(({ url }) => url.endsWith('/installation/token')), false)
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
    }), (error) => error.code === 'github_operation_and_revocation_unconfirmed'
      && error.state === 'reconcile-required'
      && /operation and installation token revocation/.test(error.message))
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

test('signal received during mint revokes the returned token before spawning and removes handlers', async () => {
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
      if (url.endsWith('/access_tokens')) signals.emit('SIGINT')
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
