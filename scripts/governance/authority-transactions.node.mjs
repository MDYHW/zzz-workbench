import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  EVIDENCE_MARKER, authorityTraceDigest, evaluateChangeMatrix, parseAuthorityTrace,
  proveOwnerCorrectionShape, validateAuthorityTrace,
} from './check-policy.mjs'
import { buildCurrentSnapshot, evaluateProposedEvidenceSnapshot, evaluateSnapshot } from './trusted-github.mjs'

const PRODUCT = 'docs/setup-workbench-product-contract.md'
const UI = 'docs/workbench-ui-design-rules.md'
const ACR = 'docs/authority-changes/2026-09-10-001-one-decision.md'
const KNOWN = ['GOV-004', 'SW-001', 'SW-002', 'UI-001']

function body(extra = {}) {
  const fields = {
    'Change classification': 'protected',
    'Protected reason': 'A permanent owner is amended.',
    'Owning Rule IDs': 'SW-001',
    'Exact consumers': 'src/App.tsx#App',
    'Nearest similar current case': 'Applied complete setup.',
    'Contrasting current case': 'Incomplete setup.',
    'Candidate or prepared consequence': 'Candidate membership is unchanged.',
    Lifecycle: 'Editing preserves committed input.',
    'Visible Setup or Result consequence': 'The current visibility rule is clearer.',
    'Behavior verification': 'Independent equivalence review and repository validation.',
    Prerequisites: 'Not applicable: existing meaning is preserved.',
    ...extra,
  }
  return `## Authority trace\n${Object.entries(fields).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
}

function ownerChange(extra = {}) {
  return {
    path: PRODUCT, baseType: 'blob', headType: 'blob', baseMode: '100644', headMode: '100644',
    baseSource: '### Current rule\n\n**Rule ID:** `SW-001`\n\nExisting wording.\n\n## Retired Rule IDs\n\n- `SW-000` -> `SW-001`: Earlier wording.\n',
    headSource: '### Current rule\n\n**Rule ID:** `SW-001`\n\nClearer wording.\n\n## Retired Rule IDs\n\n- `SW-000` -> `SW-001`: Earlier wording.\n',
    ...extra,
  }
}

function options(extra = {}) {
  return {
    knownRuleIds: KNOWN, computedClassification: 'protected',
    changeCategories: ['permanent-owner'], changedPaths: [PRODUCT],
    ...extra,
  }
}

function acrSource({ status = 'accepted', ruleIds = 'SW-001, UI-001', sequence = '001' } = {}) {
  return `---
id: ACR-2026-09-10-${sequence}
date: 2026-09-10
status: ${status}
supersedes: none
superseded_by: none
---

# One changed visibility decision

## One decision
Clarify the visibility state and its presentation owner together.

## Context
The two owners disagree about one visible state.

## Existing rule
Owning Rule IDs: ${ruleIds}

## Proposed change
Align the two owners with the accepted visibility state.

## Evidence
Current editing and applied flows expose the conflict.

## Nearest current consumer
App renders the committed state.

## Contrast
Incomplete state cannot produce Result.

## Impact
Product and UI owners change; dependent implementation follows later.

## Approval result
- Product owner: \`Min-DongYoung\`
- Result: ${status === 'proposed' ? 'pending' : status}
- Decided at: ${status === 'proposed' ? 'pending' : '2026-09-10T13:00:00Z'}
`
}

function decisionOptions(extra = {}) {
  return options({
    changedPaths: [PRODUCT, UI, ACR], changeCategories: ['acr-instance', 'permanent-owner'],
    acrTransaction: { changes: [{ path: ACR, baseSource: null, headSource: acrSource() }] },
    acrBaseRecords: [], acrKnownRuleIds: KNOWN,
    ...extra,
  })
}

test('optional correction claim is exact and digest-bound without changing historical digests', () => {
  const old = parseAuthorityTrace(body())
  const oldDigest = `sha256:${createHash('sha256').update(`${JSON.stringify({ version: 1, fields: old.fields })}\n`).digest('hex')}`
  assert.equal(authorityTraceDigest(old), oldDigest)
  const correction = parseAuthorityTrace(body({ 'Authority correction': 'meaning-preserving' }))
  assert.notEqual(authorityTraceDigest(correction), authorityTraceDigest(old))
  assert.throws(() => parseAuthorityTrace(body({ 'Authority correction': 'probably equivalent' })), /correction/i)
  assert.throws(() => parseAuthorityTrace(`${body({ 'Authority correction': 'meaning-preserving' })}\n- Authority correction: meaning-preserving`), /duplicated/)
})

test('correction structural proof preserves current and retired identities and regular single-owner shape', () => {
  const change = ownerChange()
  const proof = proveOwnerCorrectionShape([change])
  assert.equal(proof.path, PRODUCT)
  for (const modified of [
    { headMode: '100755' }, { baseMode: '120000' }, { headType: 'commit' },
    { headSource: null }, { baseSource: null }, { path: 'docs/brainstorms/local.md' },
    { headSource: change.headSource.replace('`SW-001`\n', '`SW-002`\n') },
    { headSource: change.headSource.replace('`SW-000`', '`SW-009`') },
    { headSource: `${change.headSource}\n**Rule ID:** \`SW-002\`\n` },
    { headSource: `${change.headSource}\n**Rule ID:** \`SW-001\`\n` },
  ]) assert.equal(proveOwnerCorrectionShape([ownerChange(modified)]), null)
  assert.equal(proveOwnerCorrectionShape([change, ownerChange({ path: UI })]), null)
})

test('correction requires explicit claim, current governance, traced owner, and trusted shape', () => {
  const correction = parseAuthorityTrace(body({ 'Authority correction': 'meaning-preserving' }))
  const ownerCorrection = proveOwnerCorrectionShape([ownerChange()])
  assert.equal(validateAuthorityTrace(correction, options({ ownerCorrection })), correction)
  for (const invalid of [
    { ownerCorrection: null }, { knownRuleIds: ['GOV-001', 'SW-001'] },
    { changedPaths: [PRODUCT, UI] }, { changeCategories: ['governance'], changedPaths: ['AGENTS.md'] },
    { ownerCorrection: { ...ownerCorrection, path: UI } },
  ]) assert.throws(() => validateAuthorityTrace(correction, options({ ownerCorrection, ...invalid })), /correction/i)
  assert.throws(() => validateAuthorityTrace(parseAuthorityTrace(body()), options({ ownerCorrection })), /accepted/)
  assert.throws(() => validateAuthorityTrace(parseAuthorityTrace(body({
    'Authority correction': 'meaning-preserving', 'Owning Rule IDs': 'UI-001',
  })), options({ ownerCorrection })), /correction/i)
})

test('decision matrix permits only record and owners when trusted governance enables it', () => {
  const paths = [PRODUCT, UI, ACR]
  assert.throws(() => evaluateChangeMatrix(paths), /owner-only|ACR-only/)
  assert.deepEqual(evaluateChangeMatrix(paths, { authorityDecision: true }).categories, ['acr-instance', 'permanent-owner'])
  for (const dependent of ['src/App.tsx', 'docs/plans/local.md', 'docs/brainstorms/local.md', 'AGENTS.md']) {
    assert.throws(() => evaluateChangeMatrix([...paths, dependent], { authorityDecision: true }), /owner-only|decision|ACR-only/)
  }
})

test('one validated accepted record must govern every changed owner through the trace', () => {
  const trace = parseAuthorityTrace(body({
    'Owning Rule IDs': 'SW-001; UI-001', Prerequisites: 'Accepted ACR-2026-09-10-001 in this decision.',
  }))
  assert.equal(validateAuthorityTrace(trace, decisionOptions()), trace)
  assert.throws(() => validateAuthorityTrace(trace, decisionOptions({ knownRuleIds: ['GOV-001', 'SW-001', 'UI-001'] })), /decision|owner-only|merged/)
  assert.throws(() => validateAuthorityTrace(trace, decisionOptions({
    acrTransaction: { changes: [{ path: ACR, headSource: acrSource({ ruleIds: 'SW-001' }) }] },
  })), /govern/)
  assert.throws(() => validateAuthorityTrace(parseAuthorityTrace(body({
    Prerequisites: 'Accepted ACR-2026-09-10-001.',
  })), decisionOptions()), /govern/)
  for (const status of ['rejected', 'proposed']) {
    assert.throws(() => validateAuthorityTrace(trace, decisionOptions({
      acrTransaction: { changes: [{ path: ACR, headSource: acrSource({ status }) }] },
    })), /accepted|outcome/)
  }
  assert.throws(() => validateAuthorityTrace(trace, decisionOptions({
    acrTransaction: { changes: [
      { path: ACR, headSource: acrSource() },
      { path: ACR.replace('-001-', '-002-'), headSource: acrSource({ sequence: '002' }) },
    ] },
  })), /exactly one/)
  assert.throws(() => validateAuthorityTrace(parseAuthorityTrace(body({
    'Authority correction': 'meaning-preserving', Prerequisites: 'Accepted ACR-2026-09-10-001.',
  })), decisionOptions()), /correction/i)
})

test('later owner amendment accepts one merged record covering all owners, not a collection of unrelated records', () => {
  const trace = parseAuthorityTrace(body({
    'Owning Rule IDs': 'SW-001; UI-001', Prerequisites: 'Accepted ACR-2026-09-10-001.',
  }))
  const state = options({ changedPaths: [PRODUCT, UI], acceptedAcrRecords: [{
    id: 'ACR-2026-09-10-001', ruleIds: ['SW-001', 'UI-001'],
  }] })
  assert.equal(validateAuthorityTrace(trace, state), trace)
  assert.throws(() => validateAuthorityTrace(trace, { ...state,
    acceptedAcrRecords: [{ id: 'ACR-2026-09-10-001', ruleIds: ['SW-002', 'UI-001'] }],
  }), /govern/)
  assert.throws(() => validateAuthorityTrace(parseAuthorityTrace(body({
    'Owning Rule IDs': 'SW-001; UI-001', Prerequisites: 'Accepted ACR-2026-09-10-001 and ACR-2026-09-10-002.',
  })), { ...state, acceptedAcrRecords: [
    { id: 'ACR-2026-09-10-001', ruleIds: ['SW-001'] },
    { id: 'ACR-2026-09-10-002', ruleIds: ['UI-001'] },
  ] }), /one|govern/)
})

async function currentSnapshot(changes, traceBody, { governance = 'GOV-004' } = {}) {
  const baseSha = '1'.repeat(40)
  const headSha = '2'.repeat(40)
  const baseTreeSha = '3'.repeat(40)
  const headTreeSha = '4'.repeat(40)
  const ownerSources = new Map([
    ['AGENTS.md', `**Governance Rule ID:** \`${governance}\``],
    [PRODUCT, ownerChange().baseSource],
    [UI, '**Rule ID:** `UI-001`\n\nExisting UI wording.'],
    ['docs/source-fact-boundary.md', '**Rule ID:** `SF-001`'],
    ['docs/zzz-formula-mechanics.md', '**Rule ID:** `FM-001`'],
    ['docs/zzz-game-vocabulary.md', '**Rule ID:** `GV-001`'],
  ])
  const sources = new Map()
  const entry = (path, source, mode = '100644') => {
    const sha = createHash('sha1').update(source).digest('hex')
    sources.set(sha, source)
    return { path, mode, type: 'blob', sha }
  }
  const baseTree = [...ownerSources].map(([path, source]) => entry(path, source))
  const headTree = new Map(baseTree.map((item) => [item.path, item]))
  for (const change of changes) headTree.set(change.path, entry(change.path, change.source, change.mode))
  const pr = {
    number: 4, state: 'open', body: traceBody, updated_at: '2026-09-10T13:00:00Z',
    base: { ref: 'main', sha: baseSha, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
    head: { ref: 'codex/decision', sha: headSha, repo: { full_name: 'Min-DongYoung/zzz-workbench' } },
  }
  const api = {
    json: async (pathname) => {
      if (pathname.endsWith('/pulls/4')) return pr
      if (pathname.endsWith(`/git/commits/${baseSha}`)) return { tree: { sha: baseTreeSha } }
      if (pathname.endsWith(`/git/commits/${headSha}`)) return { tree: { sha: headTreeSha } }
      if (pathname.includes(`/git/trees/${baseTreeSha}`)) return { truncated: false, tree: baseTree }
      if (pathname.includes(`/git/trees/${headTreeSha}`)) return { truncated: false, tree: [...headTree.values()] }
      if (pathname.includes('/git/blobs/')) {
        const source = sources.get(pathname.split('/').at(-1))
        assert.notEqual(source, undefined)
        return { encoding: 'base64', size: Buffer.byteLength(source), content: Buffer.from(source).toString('base64') }
      }
      throw new Error(`Unexpected API read ${pathname}`)
    },
    paginate: async (pathname) => {
      if (pathname.includes('/pulls?')) return [pr]
      if (pathname.endsWith('/comments') || pathname.endsWith('/reviews')) return []
      throw new Error(`Unexpected API list ${pathname}`)
    },
  }
  const state = await buildCurrentSnapshot({
    api, prNumber: 4, root: '/trusted', includeWorkflows: false,
    readFile: async (path) => {
      const relative = String(path).replaceAll('\\', '/').replace('/trusted/', '')
      if (relative.startsWith('docs/audits/')) return 'No accepted audit rows.'
      assert.ok(ownerSources.has(relative), relative)
      return ownerSources.get(relative)
    },
  })
  const common = { event: 'pull_request', prNumber: 4, baseSha, headSha, statusSha: headSha, status: 'completed', conclusion: 'success' }
  state.prValidationWorkflowId = 101
  state.visualWorkflowId = 102
  state.runs = [
    { ...common, id: 10, path: '.github/workflows/pr-validation.yml', workflowId: 101,
      jobs: ['Behavior Tests', 'Type Check', 'Production Build'].map((name, index) => ({ id: index + 1, name, conclusion: 'success' })) },
    { ...common, id: 11, path: '.github/workflows/visual-baseline.yml', workflowId: 102,
      jobs: [{ id: 4, name: 'Visual Baseline', conclusion: 'success' }] },
  ]
  const trace = parseAuthorityTrace(traceBody)
  const evidence = {
    schema: 'zzz-workbench-authority-review/v1', kind: 'authority-review', result: 'pass',
    prNumber: 4, baseSha, headSha, diffDigest: state.diffDigest,
    classification: 'protected', traceDigest: authorityTraceDigest(trace), mechanismDigest: 'none',
    ruleIds: trace.ruleIds, consumers: trace.consumers,
    reviewerRun: { id: 'independent-review', reviewers: ['reviewer'], completedAt: '2026-09-10T13:01:00Z' },
  }
  state.comments = [{ id: 1, author: 'zzz-workbench-agent-mdy[bot]',
    body: `${EVIDENCE_MARKER}\n\`\`\`json\n${JSON.stringify(evidence)}\n\`\`\``,
    createdAt: '2026-09-10T13:02:00Z', updatedAt: '2026-09-10T13:02:00Z' }]
  state.reviews = [{ author: 'Min-DongYoung', state: 'APPROVED', commitId: headSha, submittedAt: '2026-09-10T13:03:00Z' }]
  return state
}

test('trusted snapshot derives correction from exact blobs and binds approval and mutable evidence', async () => {
  const traceBody = body({ 'Authority correction': 'meaning-preserving' })
  const changes = [{ path: PRODUCT, source: ownerChange().headSource }]
  const state = await currentSnapshot(changes, traceBody)
  assert.deepEqual(state.ownerCorrection, { path: PRODUCT })
  assert.equal(evaluateSnapshot(state).statuses['Protected Approval'], 'success')
  assert.equal(evaluateProposedEvidenceSnapshot(state, {
    body: state.comments[0].body, publishedAt: state.comments[0].updatedAt,
  }).targetSha, state.headSha)
  assert.throws(() => evaluateSnapshot({ ...state, body: body() }), /accepted/)
  assert.throws(() => evaluateSnapshot({ ...state, headSha: 'a'.repeat(40) }), /stale/)
  assert.equal(evaluateSnapshot({ ...state, reviews: [{ ...state.reviews[0], submittedAt: '2026-09-10T13:00:00Z' }] }).statuses['Protected Approval'], 'failure')
  const badShape = await currentSnapshot([{ ...changes[0], mode: '100755' }], traceBody)
  assert.equal(badShape.ownerCorrection, null)
  assert.throws(() => evaluateSnapshot(badShape), /correction/i)
  const oldGovernance = await currentSnapshot(changes, traceBody, { governance: 'GOV-001' })
  assert.throws(() => evaluateSnapshot(oldGovernance), /correction/i)
})

test('trusted snapshot filters ACR blobs from owners and validates the accepted decision before evidence', async () => {
  const traceBody = body({ 'Owning Rule IDs': 'SW-001; UI-001', Prerequisites: 'Accepted ACR-2026-09-10-001.' })
  const changes = [
    { path: PRODUCT, source: ownerChange().headSource },
    { path: UI, source: '**Rule ID:** `UI-001`\n\nAccepted UI wording.' },
    { path: ACR, source: acrSource() },
  ]
  const state = await currentSnapshot(changes, traceBody)
  assert.deepEqual(state.acrTransaction.changes.map(({ path }) => path), [ACR])
  assert.equal(evaluateSnapshot(state).statuses['Trusted Governance'], 'success')
  assert.equal(evaluateProposedEvidenceSnapshot(state, {
    body: state.comments[0].body, publishedAt: state.comments[0].updatedAt,
  }).targetSha, state.headSha)
  for (const source of [acrSource({ status: 'rejected' }), acrSource({ ruleIds: 'SW-001' })]) {
    const invalid = await currentSnapshot([...changes.slice(0, 2), { path: ACR, source }], traceBody)
    assert.throws(() => evaluateSnapshot(invalid), /accepted|govern/)
    assert.throws(() => evaluateProposedEvidenceSnapshot(invalid, {
      body: invalid.comments[0].body, publishedAt: invalid.comments[0].updatedAt,
    }), /accepted|govern/)
  }
  await assert.rejects(() => currentSnapshot([...changes.slice(0, 2), { path: ACR, source: acrSource(), mode: '120000' }], traceBody), /regular 100644/)
  const mixed = await currentSnapshot([...changes, { path: 'docs/plans/dependent.md', source: 'Dependent work.' }], traceBody)
  assert.throws(() => evaluateSnapshot(mixed), /owner-only|decision/)
})
