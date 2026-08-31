import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import test from 'node:test'
import {
  EVIDENCE_MARKER, authorityTraceDigest, canonicalTreeDiff, parseAuthorityTrace, proveAgentLocal,
} from './check-policy.mjs'
import {
  createApi,
  buildCurrentSnapshot,
  deriveStructuralFacts,
  evaluateAndPublish,
  evaluatePublishedEvidenceSnapshot,
  evaluateProposedEvidenceSnapshot,
  evaluatePullRequestBatch,
  evaluateSnapshot,
  publishEvaluationFailure,
  resolveEventPullRequests,
  verifyRemoteFinalization,
} from './trusted-github.mjs'

const BASE = '1'.repeat(40)
const HEAD = '2'.repeat(40)
const OTHER = '4'.repeat(40)
const DIFF = `sha256:${'a'.repeat(64)}`

function response(body, { status = 200, link = '' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: { get: (name) => name.toLowerCase() === 'link' ? link : null },
  }
}

function body(classification = 'agent-local') {
  const fields = {
    'Change classification': classification,
    'Protected reason': classification === 'protected' ? 'A governance path changed.' : 'Not applicable: trusted structure is local.',
    'Owning Rule IDs': 'SW-001',
    'Exact consumers': 'src/workbench/content/agents.ts#ADMITTED_AGENTS',
    'Nearest similar current case': 'Existing additive Agent registration.',
    'Contrasting current case': 'Shared helper modification.',
    'Candidate or prepared consequence': 'One prepared setup.',
    Lifecycle: 'Rebuild behavior is unchanged.',
    'Visible Setup or Result consequence': 'One settled Agent surface.',
    'Behavior verification': 'Mechanism tests and build.',
    Prerequisites: 'Not applicable: no authority amendment.',
  }
  return `## Authority trace\n${Object.entries(fields).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
}

function evidence(classification = 'agent-local', overrides = {}) {
  const payload = {
    schema: 'zzz-workbench-authority-review/v1',
    kind: 'authority-review',
    result: 'pass',
    reviewerRun: { id: 'review-1', completedAt: '2026-08-15T01:00:00.000Z', reviewers: ['reviewer'] },
    prNumber: 4,
    baseSha: BASE,
    headSha: HEAD,
    diffDigest: DIFF,
    classification,
    traceDigest: authorityTraceDigest(parseAuthorityTrace(body(classification))),
    mechanismDigest: 'none',
    ruleIds: ['SW-001'],
    consumers: ['src/workbench/content/agents.ts#ADMITTED_AGENTS'],
    ...overrides,
  }
  return {
    id: 55,
    author: 'zzz-workbench-agent-mdy[bot]',
    body: `${EVIDENCE_MARKER}\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
    createdAt: '2026-08-15T01:01:00.000Z',
    updatedAt: '2026-08-15T01:01:00.000Z',
  }
}

function runs() {
  const common = { event: 'pull_request', prNumber: 4, baseSha: BASE, headSha: HEAD, statusSha: HEAD }
  return [
    {
      ...common, id: 10, status: 'completed', conclusion: 'success', path: '.github/workflows/pr-validation.yml', workflowId: 101,
      jobs: ['Behavior Tests', 'Type Check', 'Production Build'].map((name, index) => ({ id: index + 1, name, conclusion: 'success' })),
    },
    {
      ...common, id: 11, status: 'completed', conclusion: 'success', path: '.github/workflows/visual-baseline.yml', workflowId: 102,
      jobs: [{ id: 4, name: 'Visual Baseline', conclusion: 'success' }],
    },
  ]
}

function snapshot(overrides = {}) {
  return {
    prNumber: 4,
    baseSha: BASE,
    headSha: HEAD,
    body: body(),
    diffDigest: DIFF,
    classification: 'agent-local',
    classificationReason: 'Trusted structure is local.',
    declarationMismatch: false,
    changeCategories: ['production-test'],
    changedPaths: ['src/workbench/content/agents.ts'],
    acceptedAcrRecords: [],
    acrBaseRecords: [],
    mechanismDigest: 'none',
    knownRuleIds: ['SW-001'],
    comments: [evidence()],
    reviews: [],
    runs: runs(),
    prValidationWorkflowId: 101,
    visualWorkflowId: 102,
    updatedAt: '2026-08-15T01:00:00.000Z',
    ...overrides,
  }
}

test('proposed evidence closes canonical trace identity before approval or mutation', () => {
  const protectedSnapshot = snapshot({
    body: body('protected'),
    classification: 'protected',
    classificationReason: 'A governance path changed.',
    changeCategories: ['governance'],
    comments: [],
  })
  const proposedBody = evidence('protected').body
  const result = evaluateProposedEvidenceSnapshot(protectedSnapshot, {
    body: proposedBody,
    publishedAt: '2026-08-15T01:01:00.000Z',
  })
  assert.equal(result.targetSha, HEAD)
  assert.deepEqual(result.trace.ruleIds, ['SW-001'])

  assert.throws(() => evaluateProposedEvidenceSnapshot({
    ...protectedSnapshot,
    knownRuleIds: ['SF-005'],
  }, {
    body: proposedBody,
    publishedAt: '2026-08-15T01:01:00.000Z',
  }), /unknown Rule ID/)

  const wrongMechanism = evidence('protected', {
    mechanismDigest: `sha256:${'f'.repeat(64)}`,
  }).body
  assert.throws(() => evaluateProposedEvidenceSnapshot(protectedSnapshot, {
    body: wrongMechanism,
    publishedAt: '2026-08-15T01:01:00.000Z',
  }), /stale or targets another change/)

  assert.throws(() => evaluateProposedEvidenceSnapshot(protectedSnapshot, {
    body: proposedBody,
    publishedAt: '2026-08-15T00:59:59.000Z',
  }), /time is invalid/)
})

test('published evidence postflight binds the actual App comment body and server timestamp', () => {
  const protectedEvidence = evidence('protected')
  const protectedSnapshot = snapshot({
    body: body('protected'),
    classification: 'protected',
    classificationReason: 'A governance path changed.',
    changeCategories: ['governance'],
    comments: [protectedEvidence],
  })
  const result = evaluatePublishedEvidenceSnapshot(protectedSnapshot, {
    body: protectedEvidence.body,
    publishedAt: protectedEvidence.updatedAt,
    commentId: protectedEvidence.id,
  })
  assert.equal(result.targetSha, HEAD)

  assert.throws(() => evaluatePublishedEvidenceSnapshot(protectedSnapshot, {
    body: `${protectedEvidence.body}\nchanged`,
    publishedAt: protectedEvidence.updatedAt,
    commentId: protectedEvidence.id,
  }), /does not match/)
  assert.throws(() => evaluatePublishedEvidenceSnapshot(protectedSnapshot, {
    body: protectedEvidence.body,
    publishedAt: '2026-08-15T01:01:01.000Z',
    commentId: protectedEvidence.id,
  }), /does not match/)
  assert.throws(() => evaluatePublishedEvidenceSnapshot({
    ...protectedSnapshot,
    comments: [{ ...protectedEvidence, id: 56 }],
  }, {
    body: protectedEvidence.body,
    publishedAt: protectedEvidence.updatedAt,
    commentId: protectedEvidence.id,
  }), /does not match/)
})

test('API pagination follows current pages without exposing the token in URLs', async () => {
  const urls = []
  const api = createApi({
    token: 'secret-token',
    fetchImpl: async (url, init) => {
      urls.push({ url, authorization: init.headers.Authorization })
      if (url.endsWith('page=1')) return response(Array.from({ length: 100 }, (_, index) => index), { link: '<next>; rel="next"' })
      return response([100])
    },
  })
  const values = await api.paginate('/repos/Min-DongYoung/zzz-workbench/issues/4/comments')
  assert.equal(values.length, 101)
  assert.ok(urls.every(({ url }) => !url.includes('secret-token')))
  assert.ok(urls.every(({ authorization }) => authorization === 'Bearer secret-token'))
})

test('event routing covers PR edits, comment deletion, workflow runs, protected-base push, and ignores non-PR comments', async () => {
  const api = {
    paginate: async (pathname) => {
      if (pathname.includes('/commits/')) return [{ number: 8, base: { ref: 'main' } }]
      return [{ number: 9 }]
    },
  }
  assert.deepEqual(await resolveEventPullRequests({
    eventName: 'pull_request_target', event: { pull_request: { number: 4, state: 'open', base: { ref: 'main' } } }, api,
  }), [4])
  assert.deepEqual(await resolveEventPullRequests({
    eventName: 'issue_comment', event: { repository: { full_name: 'Min-DongYoung/zzz-workbench' }, issue: { number: 5, pull_request: {} }, action: 'deleted' }, api,
  }), [5])
  assert.deepEqual(await resolveEventPullRequests({
    eventName: 'issue_comment', event: { repository: { full_name: 'Min-DongYoung/zzz-workbench' }, issue: { number: 5 } }, api,
  }), [])
  assert.deepEqual(await resolveEventPullRequests({
    eventName: 'workflow_run', event: { workflow_run: { head_sha: HEAD, pull_requests: [] } }, api,
  }), [8])
  assert.deepEqual(await resolveEventPullRequests({
    eventName: 'push', event: { ref: 'refs/heads/main' }, api,
  }), [9])
})

test('batch revalidation isolates one PR failure and continues every remaining PR', async () => {
  const visited = []
  const invalidated = []
  const batch = await evaluatePullRequestBatch({
    prNumbers: [1, 2, 3],
    evaluate: async (number) => {
      visited.push(number)
      if (number === 2) throw new Error('broken PR')
      return { number }
    },
    onFailure: async (number) => invalidated.push(number),
  })
  assert.deepEqual(visited, [1, 2, 3])
  assert.deepEqual(invalidated, [2])
  assert.deepEqual(batch.results, [{ number: 1 }, { number: 3 }])
  assert.equal(batch.failures.length, 1)
})

test('evaluation failure invalidates both trusted contexts only on the exact protected PR head', async () => {
  const writes = []
  const api = {
    json: async (pathname, init) => {
      if (pathname.endsWith('/pulls/4')) return {
        base: { ref: 'main', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
        head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      }
      if (pathname.endsWith(`/statuses/${HEAD}`)) {
        writes.push(JSON.parse(init.body))
        return {}
      }
      throw new Error(`unexpected json ${pathname}`)
    },
  }
  assert.equal(await publishEvaluationFailure(api, 4, BASE), true)
  assert.deepEqual(writes.map(({ context, state }) => [context, state]), [
    ['Protected Approval', 'failure'],
    ['Trusted Governance', 'failure'],
  ])

  for (const pull of [
    {
      base: { ref: 'recovery', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
    },
    {
      base: { ref: 'main', sha: BASE, repo: { full_name: 'other/repository' } },
      head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
    },
    {
      base: { ref: 'main', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      head: { sha: HEAD, repo: { full_name: 'other/repository' } },
    },
  ]) {
    assert.equal(await publishEvaluationFailure({ json: async () => pull }, 4, BASE), false)
  }

  assert.equal(await publishEvaluationFailure({
    json: async () => ({
      base: { ref: 'main', sha: OTHER, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
    }),
  }, 4, BASE), false)
})

test('current snapshot adapter binds live PR, exact trees, trusted owners, and workflow definitions', async () => {
  const baseTreeSha = '4'.repeat(40)
  const headTreeSha = '5'.repeat(40)
  const baseBlob = '6'.repeat(40)
  const headBlob = '7'.repeat(40)
  const runQueries = []
  let duplicateLifecycle = false
  let requirementPath = 'docs/brainstorms/x.md'
  let requirementHead = { type: 'blob', mode: '100644' }
  let requirementSource = 'Current requirement cites `SF-005`.'
  const api = {
    json: async (pathname) => {
      if (pathname.endsWith('/pulls/4')) return {
        number: 4, state: 'open', body: body(), updated_at: '2026-08-16T00:00:00Z', merge_commit_sha: OTHER,
        base: { ref: 'main', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
        head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      }
      if (pathname.endsWith(`/git/commits/${BASE}`)) return { tree: { sha: baseTreeSha } }
      if (pathname.endsWith(`/git/commits/${HEAD}`)) return { tree: { sha: headTreeSha } }
      if (pathname.includes(baseTreeSha)) return { truncated: false, tree: [{ path: requirementPath, type: 'blob', mode: '100644', sha: baseBlob }] }
      if (pathname.includes(headTreeSha)) return {
        truncated: false,
        tree: requirementHead ? [{ path: requirementPath, ...requirementHead, sha: headBlob }] : [],
      }
      if (pathname.endsWith(`/git/blobs/${headBlob}`)) {
        return { encoding: 'base64', size: Buffer.byteLength(requirementSource), content: Buffer.from(requirementSource).toString('base64') }
      }
      if (pathname.endsWith('/actions/workflows/pr-validation.yml')) return { id: 101 }
      if (pathname.endsWith('/actions/workflows/visual-baseline.yml')) return { id: 102 }
      throw new Error(`unexpected json ${pathname}`)
    },
    paginate: async (pathname) => {
      if (pathname.includes('/pulls?state=all&sort=created&direction=desc')) {
        const current = {
          number: 4,
          base: { ref: 'main', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
          head: { sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
        }
        return duplicateLifecycle ? [current, {
          ...current,
          number: 5,
          base: { ...current.base, ref: 'recovery' },
        }] : [current]
      }
      if (pathname.includes('/runs')) {
        runQueries.push(pathname)
        return []
      }
      if (pathname.includes('/comments') || pathname.includes('/reviews')) return []
      throw new Error(`unexpected paginate ${pathname}`)
    },
  }
  const readFile = async (filePath) => {
    const normalized = String(filePath).replaceAll('\\', '/')
    if (normalized.endsWith('docs/audits/2026-08-15-existing-vertical-recovery.md')) return 'no accepted rows'
    if (normalized.endsWith('AGENTS.md')) return '**Governance Rule ID:** `GOV-001`'
    if (normalized.endsWith('docs/setup-workbench-product-contract.md')) return '**Rule ID:** `SW-001`\n\n**Rule ID:** `SW-003`\n\n## Retired Rule IDs\n\n`SW-002` -> `SW-003`: replacement'
    if (normalized.endsWith('docs/source-fact-boundary.md')) return '**Rule ID:** `SF-005`\n\n## Retired Rule IDs\n\n`SF-001` -> `SF-005`: replacement'
    if (normalized.endsWith('docs/workbench-ui-design-rules.md')) return '**Rule ID:** `UI-001`'
    if (normalized.endsWith('docs/zzz-formula-mechanics.md')) return '**Rule ID:** `FM-001`'
    if (normalized.endsWith('docs/zzz-game-vocabulary.md')) return '**Rule ID:** `GV-001`'
    throw new Error(`unexpected read ${normalized}`)
  }
  const current = await buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile })
  assert.equal(current.baseSha, BASE)
  assert.equal(current.headSha, HEAD)
  assert.deepEqual(current.changeCategories, ['supporting-doc'])
  assert.equal(current.classification, 'agent-local')
  assert.equal(current.prValidationWorkflowId, 101)
  assert.equal(current.visualWorkflowId, 102)
  assert.equal(runQueries.length, 2)
  assert.ok(runQueries.every((pathname) => pathname.includes(`head_sha=${HEAD}`)))
  assert.ok(runQueries.every((pathname) => !pathname.includes(`head_sha=${OTHER}`)))
  requirementSource = 'Stale requirement cites `SF-001`.'
  await assert.rejects(
    () => buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile }),
    /retired Rule ID SF-001/,
  )
  requirementSource = 'Range cites `SW-001`-`SW-003`.'
  await assert.rejects(
    () => buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile }),
    /retired Rule ID SW-002/,
  )
  for (const head of [
    { type: 'blob', mode: '120000' },
    { type: 'blob', mode: '100755' },
    { type: 'commit', mode: '160000' },
  ]) {
    requirementHead = head
    await assert.rejects(
      () => buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile }),
      /must be a regular 100644 blob/,
    )
  }
  requirementHead = null
  const deleted = await buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile })
  assert.deepEqual(deleted.changeCategories, ['supporting-doc'])
  requirementPath = 'docs/solutions/history.md'
  requirementHead = { type: 'blob', mode: '100644' }
  requirementSource = 'Historical text cites `SF-001`.'
  const historical = await buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile })
  assert.deepEqual(historical.changeCategories, ['supporting-doc'])
  requirementPath = 'docs/brainstorms/x.md'
  requirementHead = { type: 'blob', mode: '100644' }
  requirementSource = 'Current requirement cites `SF-005`.'
  duplicateLifecycle = true
  await assert.rejects(
    () => buildCurrentSnapshot({ api, prNumber: 4, root: '/trusted', readFile }),
    /not unique to one pull-request lifecycle/,
  )
})

test('successful current snapshot posts two distinct statuses to the PR head SHA', async () => {
  const writes = []
  const state = snapshot({ runs: runs().reverse() })
  const result = await evaluateAndPublish({
    prNumber: 4,
    api: {},
    targetUrl: 'https://github.com/Min-DongYoung/zzz-workbench/actions/runs/99',
    snapshotProvider: async () => structuredClone(state),
    statusWriter: async (_api, value) => writes.push(value),
  })
  assert.equal(result.posted, true)
  assert.deepEqual(writes.map(({ sha, context, state: status }) => [sha, context, status]), [
    [HEAD, 'Trusted Governance', 'pending'],
    [HEAD, 'Protected Approval', 'pending'],
    [HEAD, 'Protected Approval', 'success'],
    [HEAD, 'Trusted Governance', 'success'],
  ])
  assert.equal(writes.at(-1).description, `pr=4 base=${BASE} runs=10,11`)
  assert.equal(writes.at(-1).targetUrl,
    `https://github.com/Min-DongYoung/zzz-workbench/actions/runs/99?pr=4&base=${BASE}&run1=10&run2=11`)
})

test('missing or edited evidence posts fail-closed statuses without trusting the event payload', async () => {
  for (const comments of [[], [{ ...evidence(), body: `${EVIDENCE_MARKER}\n\`\`\`json\n{}\n\`\`\``, updatedAt: '2026-08-15T02:00:00.000Z' }]]) {
    const writes = []
    const state = snapshot({ comments })
    const result = await evaluateAndPublish({
      prNumber: 4, api: {}, snapshotProvider: async () => structuredClone(state),
      statusWriter: async (_api, value) => writes.push(value),
    })
    assert.match(result.governanceFailure, /evidence/i)
    assert.deepEqual(writes.map(({ state: status }) => status), ['pending', 'pending', 'failure', 'failure'])
  }
})

test('forbidden change-matrix errors become explicit failure statuses', async () => {
  const writes = []
  const state = snapshot({ classification: 'protected', classificationError: 'Permanent-owner changes must be owner-only.' })
  const result = await evaluateAndPublish({
    prNumber: 4, api: {}, snapshotProvider: async () => structuredClone(state),
    statusWriter: async (_api, value) => writes.push(value),
  })
  assert.match(result.governanceFailure, /owner-only/)
  assert.deepEqual(writes.map(({ state: status }) => status), ['pending', 'pending', 'failure', 'failure'])
})

test('state change during evaluation prevents stale writes without cross-PR supersession', async () => {
  const first = snapshot()
  const changed = snapshot({ body: `${body()}\nchanged` })
  let calls = 0
  const writes = []
  const stale = await evaluateAndPublish({
    prNumber: 4, api: {}, snapshotProvider: async () => structuredClone(calls++ === 0 ? first : changed),
    statusWriter: async (_api, value) => writes.push(value),
  })
  assert.equal(stale.stale, true)
  assert.equal(writes.length, 0)

  const staleEvaluator = await evaluateAndPublish({
    prNumber: 4, api: {}, trustedBaseSha: OTHER,
    snapshotProvider: async () => structuredClone(first),
    statusWriter: async (_api, value) => writes.push(value),
  })
  assert.equal(staleEvaluator.stale, true)
  assert.match(staleEvaluator.reason, /evaluator revision/)
  assert.equal(writes.length, 0)
})

test('validation binds the exact PR, base, head, and status target identities', () => {
  for (const [field, value] of [
    ['prNumber', 5],
    ['baseSha', OTHER],
    ['headSha', OTHER],
    ['statusSha', OTHER],
  ]) {
    const state = snapshot()
    state.runs[0][field] = value
    assert.throws(() => evaluateSnapshot(state), /absent/)
  }
})

test('finalization consumes actual creating-PR outcomes and rechecks the live recovery tip', async () => {
  const candidate = '9'.repeat(40)
  const baseTreeSha = '5'.repeat(40)
  const headTreeSha = '6'.repeat(40)
  const ownerSources = new Map([
    ['docs/setup-workbench-product-contract.md', '**Rule ID:** `SW-001`'],
    ['docs/source-fact-boundary.md', '**Rule ID:** `SF-001`'],
    ['docs/workbench-ui-design-rules.md', '**Rule ID:** `UI-001`'],
    ['docs/zzz-formula-mechanics.md', '**Rule ID:** `FM-001`'],
    ['docs/zzz-game-vocabulary.md', '**Rule ID:** `GV-001`'],
    ['AGENTS.md', '**Governance Rule ID:** `GOV-001`'],
  ])
  const changedPath = '.github/pull_request_template.md'
  const baseChangedBlob = '7'.repeat(40)
  const headChangedBlob = '8'.repeat(40)
  const blobSources = new Map([[baseChangedBlob, 'base template'], [headChangedBlob, 'head template']])
  let blobSequence = 10
  const sharedTreeEntries = [...ownerSources].map(([filePath, source]) => {
    const sha = String(blobSequence++).padStart(40, '0')
    blobSources.set(sha, source)
    return { path: filePath, type: 'blob', mode: '100644', sha }
  })
  const baseTree = [...sharedTreeEntries, { path: changedPath, type: 'blob', mode: '100644', sha: baseChangedBlob }]
  const headTree = [...sharedTreeEntries, { path: changedPath, type: 'blob', mode: '100644', sha: headChangedBlob }]
  const diffDigest = canonicalTreeDiff([{
    path: changedPath,
    base: { type: 'blob', mode: '100644', sha: baseChangedBlob },
    head: { type: 'blob', mode: '100644', sha: headChangedBlob },
  }]).digest
  const currentEvidence = evidence('protected', { diffDigest })
  const rawEvidence = {
    id: currentEvidence.id,
    user: { login: currentEvidence.author },
    body: currentEvidence.body,
    created_at: currentEvidence.createdAt,
    updated_at: currentEvidence.updatedAt,
  }
  const rawApproval = {
    id: 66, user: { login: 'Min-DongYoung' }, state: 'APPROVED', commit_id: HEAD,
    submitted_at: '2026-08-15T01:02:00.000Z',
  }
  let tipReads = 0
  const creatingPr = {
    number: 4,
    merged_at: '2026-08-16T01:00:00Z',
    merge_commit_sha: candidate,
    base: { ref: 'recovery', sha: BASE, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
    head: { ref: 'codex/final', sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
  }
  const finalizationApi = (finalTip = candidate, {
    comments = [rawEvidence],
    reviews = [rawApproval],
    duplicateLifecycle = false,
    currentBaseSha = BASE,
    statusBaseSha = BASE,
    statusRunIds = [201, 202],
    workflowStatusSha = HEAD,
  } = {}) => ({
    json: async (pathname) => {
      if (pathname.endsWith('/git/ref/heads/recovery')) {
        tipReads += 1
        return { object: { sha: tipReads === 1 ? candidate : finalTip } }
      }
      if (pathname.endsWith('/pulls/4')) return {
        number: 4, state: 'closed', merged_at: '2026-08-16T01:00:00Z', merge_commit_sha: candidate,
        body: body('protected'), updated_at: '2026-08-16T01:00:00Z',
        base: { ref: 'recovery', sha: currentBaseSha, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
        head: { ref: 'codex/final', sha: HEAD, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
      }
      if (pathname.endsWith(`/git/commits/${BASE}`)) return { tree: { sha: baseTreeSha } }
      if (pathname.endsWith(`/git/commits/${HEAD}`)) return { tree: { sha: headTreeSha } }
      if (pathname.includes(`/git/trees/${baseTreeSha}`)) return { truncated: false, tree: baseTree }
      if (pathname.includes(`/git/trees/${headTreeSha}`)) return { truncated: false, tree: headTree }
      if (pathname.includes('/git/blobs/')) {
        const sha = pathname.split('/').at(-1)
        const source = blobSources.get(sha)
        if (source === undefined) throw new Error(`unexpected blob ${sha}`)
        return { encoding: 'base64', size: Buffer.byteLength(source), content: Buffer.from(source).toString('base64') }
      }
      if (pathname.endsWith('/actions/workflows/pr-validation.yml')) return { id: 101 }
      if (pathname.endsWith('/actions/workflows/visual-baseline.yml')) return { id: 102 }
      throw new Error(`unexpected json ${pathname}`)
    },
    paginate: async (pathname) => {
      if (pathname.endsWith(`/commits/${candidate}/pulls`)) return [creatingPr]
      if (pathname.includes('/pulls?state=all&sort=created&direction=desc')) {
        return duplicateLifecycle ? [creatingPr, {
          ...creatingPr,
          number: 5,
          base: { ...creatingPr.base, ref: 'main' },
        }] : [creatingPr]
      }
      if (pathname.includes('/actions/workflows/101/runs')) return [{
        id: 201, workflow_id: 101, event: 'pull_request', head_sha: workflowStatusSha,
        status: 'completed', conclusion: 'success',
        pull_requests: [],
      }]
      if (pathname.includes('/actions/workflows/102/runs')) return [{
        id: 202, workflow_id: 102, event: 'pull_request', head_sha: workflowStatusSha,
        status: 'completed', conclusion: 'success',
        pull_requests: [],
      }]
      if (pathname.includes('/actions/runs/201/jobs')) return ['Behavior Tests', 'Type Check', 'Production Build']
        .map((name, index) => ({ id: index + 1, name, conclusion: 'success' }))
      if (pathname.includes('/actions/runs/202/jobs')) return [{ id: 4, name: 'Visual Baseline', conclusion: 'success' }]
      if (pathname.endsWith(`/commits/${HEAD}/statuses`)) return ['Trusted Governance', 'Protected Approval']
        .map((context, index) => ({
          id: index + 1, context, state: 'success',
          creator: { login: 'github-actions[bot]' },
          description: context === 'Trusted Governance'
            ? `pr=4 base=${statusBaseSha} runs=${statusRunIds.join(',')}`
            : 'Current protection approval requirement is satisfied.',
          target_url: context === 'Trusted Governance'
            ? `https://github.com/Min-DongYoung/zzz-workbench/actions/runs/${300 + index}?pr=4&base=${statusBaseSha}&run1=${statusRunIds[0]}&run2=${statusRunIds[1]}`
            : `https://github.com/Min-DongYoung/zzz-workbench/actions/runs/${300 + index}`,
        }))
      if (pathname.endsWith('/issues/4/comments')) return comments
      if (pathname.endsWith('/pulls/4/reviews')) return reviews
      throw new Error(`unexpected paginate ${pathname}`)
    },
  })
  const repositoryValidator = async () => ({ auditComplete: true })
  const verified = await verifyRemoteFinalization({
    api: finalizationApi(), actor: 'Min-DongYoung', candidateSha: candidate, root: '/trusted', repositoryValidator,
  })
  assert.equal(verified.creatingPr, 4)
  assert.equal(verified.validatedHeadSha, HEAD)
  assert.deepEqual(Object.keys(verified.statuses).sort(), [
    'Behavior Tests', 'Production Build', 'Protected Approval', 'Trusted Governance', 'Type Check', 'Visual Baseline',
  ])

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(candidate, { comments: [] }), actor: 'Min-DongYoung', candidateSha: candidate,
    root: '/trusted', repositoryValidator,
  }), /Exactly one current review evidence/)

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(candidate, { reviews: [] }), actor: 'Min-DongYoung', candidateSha: candidate,
    root: '/trusted', repositoryValidator,
  }), /current owner approval/)

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(OTHER), actor: 'Min-DongYoung', candidateSha: candidate, root: '/trusted', repositoryValidator,
  }), /current recovery tip/)

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(candidate, { duplicateLifecycle: true }), actor: 'Min-DongYoung', candidateSha: candidate,
    root: '/trusted', repositoryValidator,
  }), /not unique to one pull-request lifecycle/)

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(candidate, { currentBaseSha: OTHER }), actor: 'Min-DongYoung', candidateSha: candidate,
    root: '/trusted', repositoryValidator,
  }), /metadata is no longer trusted/)

  tipReads = 0
  await assert.rejects(() => verifyRemoteFinalization({
    api: finalizationApi(candidate, { statusBaseSha: OTHER }), actor: 'Min-DongYoung', candidateSha: candidate,
    root: '/trusted', repositoryValidator,
  }), /does not bind the creating pull request/)

  for (const options of [{ workflowStatusSha: OTHER }, { statusRunIds: [211, 212] }]) {
    tipReads = 0
    await assert.rejects(() => verifyRemoteFinalization({
      api: finalizationApi(candidate, options), actor: 'Min-DongYoung', candidateSha: candidate,
      root: '/trusted', repositoryValidator,
    }), /required workflow run is absent/i)
  }
})

test('trusted adapter contains no PR-code execution or artifact-download primitive', async () => {
  const source = await fs.readFile(new URL('./trusted-github.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /node:child_process|execFile|spawn\(|artifacts\//)
})

test('trusted structural parser proves narrow Agent seams and rejects unproved structure', async () => {
  const base = {
    'src/workbench/content/types.ts': `export type AgentId =\n  | 'alpha'\n\nexport type EngineId =\n  | 'engineA'\n\nexport type DiscId =\n  | 'discA'\n\nexport type End = string\n`,
    'src/workbench/content/agents.ts': `export const ADMITTED_AGENTS = [\n  {\n    id: 'alpha', name: 'Alpha',\n  },\n]\n`,
    'src/workbench/calculate.ts': `import { calculateAlpha } from './calculation/agents/alpha'\nfunction run(id) {\n  switch (id) {\n    case 'alpha':\n      return calculateAlpha()\n    default:\n      return null\n  }\n}\n`,
    'src/workbench/provider-effects.ts': `import { observeAlpha } from './calculation/agents/alpha'\nfunction run(id) {\n  switch (id) {\n    case 'alpha':\n      return observeAlpha()\n    default:\n      return null\n  }\n}\n`,
    'src/workbench/content/setup-options.ts': `export const OPTIONS = {\n  alpha: { primary: [] },\n}\n`,
    'src/workbench/content/representatives.ts': `const alphaRepresentative = () => ({\n  engineId: 'engineA',\n})\nexport const REPS = {\n  alpha: alphaRepresentative(),\n}\n`,
    'src/workbench/content/retained-values.ts': `export const VALUES = {\n  alpha: { atk: 1 },\n}\nexport const LABELS = {\n  alphaCore: 'Core',\n}\n`,
    'src/workbench/content/engines.ts': `export const FACTS = {\n}\nexport const CHOICES = {\n}\n`,
    'src/workbench/content/agent-setup-candidates.ts': `const ENGINE_CANDIDATES_BY_AGENT = {\n  alpha: ['engineA'],\n}\nexport const DISC_IDS_BY_AGENT_AND_PIECE = {\n  alpha: { fourPiece: ['discA'], twoPiece: ['discA'] },\n}\n`,
    'src/workbench/flow.test.ts': `test('alpha', () => {})\n`,
  }
  const head = {
    ...base,
    'src/workbench/content/types.ts': `export type AgentId =\n  | 'alpha'\n  | 'testAgent'\n\nexport type EngineId =\n  | 'engineA'\n  | 'testEngine'\n\nexport type DiscId =\n  | 'discA'\n\nexport type End = string\n`,
    'src/workbench/content/agents.ts': `export const ADMITTED_AGENTS = [\n  {\n    id: 'alpha', name: 'Alpha',\n  },\n  {\n    id: 'testAgent', name: 'Test Agent',\n  },\n]\n`,
    'src/workbench/calculate.ts': `import { calculateAlpha } from './calculation/agents/alpha'\nimport { calculateTestAgent } from './calculation/agents/test-agent'\nfunction run(id) {\n  switch (id) {\n    case 'alpha':\n      return calculateAlpha()\n    case 'testAgent':\n      return calculateTestAgent()\n    default:\n      return null\n  }\n}\n`,
    'src/workbench/provider-effects.ts': `import { observeAlpha } from './calculation/agents/alpha'\nimport { observeTestAgent } from './calculation/agents/test-agent'\nfunction run(id) {\n  switch (id) {\n    case 'alpha':\n      return observeAlpha()\n    case 'testAgent':\n      return observeTestAgent()\n    default:\n      return null\n  }\n}\n`,
    'src/workbench/content/setup-options.ts': `export const OPTIONS = {\n  alpha: { primary: [] },\n  testAgent: { primary: [] },\n}\n`,
    'src/workbench/content/representatives.ts': `const alphaRepresentative = () => ({\n  engineId: 'engineA',\n})\nconst testAgentRepresentative = () => ({\n  engineId: 'engineA',\n})\nexport const REPS = {\n  alpha: alphaRepresentative(),\n  testAgent: testAgentRepresentative(),\n}\n`,
    'src/workbench/content/retained-values.ts': `export const VALUES = {\n  alpha: { atk: 1 },\n  testAgent: { atk: 1 },\n}\nexport const LABELS = {\n  alphaCore: 'Core',\n  testAgentCore: 'Core',\n}\n`,
    'src/workbench/content/engines.ts': `import testEngineImage from '../../assets/equipment/w-engines/test-engine.webp'\nexport const FACTS = {\n  testEngine: { effect: 1 },\n}\nexport const CHOICES = {\n  testEngine: { id: 'testEngine', image: testEngineImage },\n}\n`,
    'src/workbench/content/agent-setup-candidates.ts': `const ENGINE_CANDIDATES_BY_AGENT = {\n  alpha: ['engineA'],\n  testAgent: ['engineA', 'testEngine'],\n}\nexport const DISC_IDS_BY_AGENT_AND_PIECE = {\n  alpha: { fourPiece: ['discA'], twoPiece: ['discA'] },\n  testAgent: { fourPiece: ['discA'], twoPiece: ['discA'] },\n}\n`,
    'src/workbench/flow.test.ts': `test('alpha', () => {})\ntest('test Agent', () => {})\n`,
    'src/workbench/calculation/agents/test-agent.ts': `export function calculateTestAgent() { return null }\nexport function observeTestAgent() { return null }\n`,
    'src/assets/equipment/w-engines/test-engine.webp': 'binary fixture',
  }
  const texts = new Map()
  const entries = []
  let sequence = 10
  for (const filePath of Object.keys(head)) {
    const baseSha = base[filePath] ? String(sequence++).padStart(40, '0') : null
    const headSha = String(sequence++).padStart(40, '0')
    if (baseSha) texts.set(baseSha, base[filePath])
    texts.set(headSha, head[filePath])
    entries.push({
      path: filePath,
      base: baseSha ? { mode: '100644', type: 'blob', sha: baseSha } : null,
      head: { mode: '100644', type: 'blob', sha: headSha },
    })
  }
  const facts = await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) })
  const proof = proveAgentLocal(facts, entries.map(({ path: filePath }) => filePath))
  assert.equal(proof.local, true, JSON.stringify({ facts, proof }))

  const candidateEntry = entries.find(({ path: filePath }) => filePath === 'src/workbench/content/agent-setup-candidates.ts')
  const candidateHead = texts.get(candidateEntry.head.sha)
  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['engineA']",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['engineA', partialEngineCandidate('testEngine', [])]",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['engineA', partialEngineCandidate('testEngine', ['notAnEffect'])]",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['engineA', 'testEngine', 'unknownEngine']",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['discA', 'testEngine']",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: { fourPiece: ['discA'], twoPiece: ['discA'] }",
    "testAgent: { fourPiece: ['engineA'], twoPiece: ['discA'] }",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    'export const DISC_IDS_BY_AGENT_AND_PIECE',
    "  testAgent: fetch('https://example.invalid')\nexport const DISC_IDS_BY_AGENT_AND_PIECE",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: ['engineA', 'testEngine']",
    "testAgent: ['engineA', 'testEngine'], [fetch('https://example.invalid')]: ['engineA']",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  texts.set(candidateEntry.head.sha, candidateHead.replace(
    "testAgent: { fourPiece: ['discA'], twoPiece: ['discA'] }",
    "testAgent: { fourPiece: ['discA'], twoPiece: ['discA'], ...fetch('https://example.invalid') }",
  ))
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(candidateEntry.head.sha, candidateHead)

  const moduleEntry = entries.find(({ path: filePath }) => filePath === 'src/workbench/calculation/agents/test-agent.ts')
  const moduleHead = texts.get(moduleEntry.head.sha)
  texts.set(moduleEntry.head.sha, `import { W_ENGINE_FACTS } from '../../content/engines'\n`
    + `export function calculateTestAgent() { W_ENGINE_FACTS.engineA.effect = 999; return null }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `import { mutateSharedState } from '../../state'\n`
    + `export function calculateTestAgent() { mutateSharedState(); return null }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `export function calculateTestAgent() { return [0].map((() => {}).constructor('Array.prototype.map = null')) }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `import { W_ENGINE_FACTS } from '../../content'\n`
    + `export function calculateTestAgent() { const { assign } = Object; assign(W_ENGINE_FACTS.engineA, { effect: 999 }); return null }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `import { W_ENGINE_FACTS } from '../../content'\n`
    + `export function calculateTestAgent() { return ([W_ENGINE_FACTS.engineA, { effect: 999 }]).reduce(Object.assign) }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `import { W_ENGINE_FACTS } from '../../content'\n`
    + `export function calculateTestAgent() { for (W_ENGINE_FACTS.engineA.effect of [999]) return null }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `import { W_ENGINE_FACTS } from '../../content'\n`
    + `function assign() { return null }\n`
    + `function exploit(assign = (Object as any).assign) { return assign(W_ENGINE_FACTS.engineA, { effect: 999 }) }\n`
    + `export function calculateTestAgent() { return exploit() }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `export function calculateTestAgent() { return 'x'.replace('x', alert as unknown as (...args: any[]) => string) }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  texts.set(moduleEntry.head.sha, `export function calculateTestAgent() { return focus\`side effect\` }\n`
    + `export function observeTestAgent() { return null }\n`)
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries }, readText: async ({ sha }) => texts.get(sha) }), undefined)
  texts.set(moduleEntry.head.sha, moduleHead)

  const helperBase = '8'.repeat(40)
  const helperHead = '9'.repeat(40)
  texts.set(helperBase, 'export const shared = 1\n')
  texts.set(helperHead, 'export const shared = 1\nexport const changed = 2\n')
  const withHelper = [...entries, {
    path: 'src/workbench/effects.ts',
    base: { mode: '100644', type: 'blob', sha: helperBase },
    head: { mode: '100644', type: 'blob', sha: helperHead },
  }]
  assert.equal(await deriveStructuralFacts({ treeDiff: { entries: withHelper }, readText: async ({ sha }) => texts.get(sha) }), undefined)
})
