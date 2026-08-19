import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import {
  EVIDENCE_MARKER,
  PolicyError,
  REQUIRED_CONTEXTS,
  REQUIRED_JOB_NAMES,
  REQUIRED_WORKFLOWS,
  authorityTraceDigest,
  canonicalTreeDiff,
  categoryForPath,
  computeChangeClassification,
  createGovernanceStatusBinding,
  evaluateChangeMatrix,
  extractCurrentRuleIds,
  extractRuleIdState,
  parseAuthorityTrace,
  parseAcrDocument,
  parseGovernanceStatusBinding,
  parseGovernanceTargetBinding,
  proveAgentLocal,
  trustedDecision,
  validateAcrStates,
  validateAcrTransaction,
  validateAuthorityTrace,
  validateChildOutcomes,
  validateFinalization,
  validateFrozenRoster,
  validateProtectedApproval,
  validateVisualWorkflow,
  validateReviewEvidence,
  validateRepository,
  validateTrustedWorkflowConcurrency,
} from './check-policy.mjs'

const BASE = '1'.repeat(40)
const HEAD = '2'.repeat(40)
const OTHER = '4'.repeat(40)
const DIFF = `sha256:${'a'.repeat(64)}`
const KNOWN_RULES = ['SW-001', 'SF-001', 'GOV-001']
const CONSUMERS = ['src/workbench/content/agents.ts#ADMITTED_AGENTS']

function treeEntry(path, baseSha = BASE, headSha = HEAD) {
  return {
    path,
    base: baseSha ? { mode: '100644', type: 'blob', sha: baseSha } : null,
    head: headSha ? { mode: '100644', type: 'blob', sha: headSha } : null,
  }
}

function localFacts() {
  return {
    newAgentId: 'testAgent',
    agentSlug: 'test-agent',
    files: [
      { path: 'src/workbench/content/types.ts', kind: 'agent-id-union-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/agents.ts', kind: 'agent-summary-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/setup-options.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/representatives.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/retained-values.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/calculate.ts', kind: 'agent-import-and-switch-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/provider-effects.ts', kind: 'agent-import-and-switch-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/calculation/agents/test-agent.ts', kind: 'agent-calculation-module-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/calculate.flows.test.ts', kind: 'test-additions-only', operation: 'additive', agentIds: ['testAgent'] },
    ],
  }
}

const LOCAL_PATHS = localFacts().files.map(({ path }) => path)

function traceBody(classification = 'agent-local', overrides = {}) {
  const fields = {
    'Change classification': classification,
    'Protected reason': classification === 'protected' ? 'Governance policy changes.' : 'Not applicable: trusted structure proves a local addition.',
    'Owning Rule IDs': 'SW-001; SF-001',
    'Exact consumers': CONSUMERS.join('; '),
    'Nearest similar current case': 'An existing additive Agent registration.',
    'Contrasting current case': 'A shared formula helper change.',
    'Candidate or prepared consequence': 'One prepared setup becomes available.',
    Lifecycle: 'Party rebuild and direct-edit behavior remain unchanged.',
    'Visible Setup or Result consequence': 'The new Agent receives the settled Setup and Result surfaces.',
    'Behavior verification': 'Mechanism tests and production build.',
    Prerequisites: 'Not applicable: no authority amendment is needed.',
    ...overrides,
  }
  return `Intro\n\n## Authority trace\n${Object.entries(fields).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n`
}

function evidenceComment(overrides = {}, commentOverrides = {}) {
  const payload = {
    schema: 'zzz-workbench-authority-review/v1',
    kind: 'authority-review',
    result: 'pass',
    reviewerRun: {
      id: 'review-run-1',
      completedAt: '2026-08-15T01:00:00.000Z',
      reviewers: ['independent-reviewer'],
    },
    prNumber: 4,
    baseSha: BASE,
    headSha: HEAD,
    diffDigest: DIFF,
    classification: 'agent-local',
    traceDigest: authorityTraceDigest(parseAuthorityTrace(traceBody(overrides.classification ?? 'agent-local'))),
    mechanismDigest: 'none',
    ruleIds: ['SF-001', 'SW-001'],
    consumers: CONSUMERS,
    ...overrides,
  }
  return {
    author: 'zzz-workbench-agent-mdy[bot]',
    createdAt: '2026-08-15T01:01:00.000Z',
    updatedAt: '2026-08-15T01:01:00.000Z',
    body: `${EVIDENCE_MARKER}\n\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
    ...commentOverrides,
  }
}

function validationRuns(overrides = {}) {
  const common = {
    event: 'pull_request', prNumber: 4, baseSha: BASE, headSha: HEAD, statusSha: HEAD,
  }
  return [
    {
      id: 11,
      ...common,
      path: '.github/workflows/pr-validation.yml',
      workflowId: 101,
      jobs: REQUIRED_JOB_NAMES.slice(0, 3).map((name) => ({ name, conclusion: 'success' })),
    },
    {
      id: 12,
      ...common,
      path: '.github/workflows/visual-baseline.yml',
      workflowId: 102,
      jobs: [{ name: 'Visual Baseline', conclusion: 'success' }],
    },
  ].map((run) => ({ status: 'completed', conclusion: 'success', ...run, ...overrides }))
}

function decisionInput(overrides = {}) {
  return {
    prNumber: 4,
    baseSha: BASE,
    headSha: HEAD,
    diffDigest: DIFF,
    classification: 'agent-local',
    mechanismDigest: 'none',
    body: traceBody(),
    knownRuleIds: KNOWN_RULES,
    comments: [evidenceComment()],
    reviews: [],
    runs: validationRuns(),
    prValidationWorkflowId: 101,
    visualWorkflowId: 102,
    ...overrides,
  }
}

function acrSource({
  id = 'ACR-2026-08-16-001', status = 'accepted', supersedes = 'none', supersededBy = 'none', ruleId = 'SW-001',
} = {}) {
  const result = status === 'proposed' ? 'pending' : status === 'superseded' ? 'accepted' : status
  return [
    '---', `id: ${id}`, `date: ${id.slice(4, 14)}`, `status: ${status}`,
    `supersedes: ${supersedes}`, `superseded_by: ${supersededBy}`, '---', '', '# Decision', '',
    '## One decision', '', 'One bounded decision.', '',
    '## Context', '', 'A current consumer requires it.', '',
    '## Existing rule', '', `- Owning Rule IDs: \`${ruleId}\``, '- Conflict: one boundary.', '',
    '## Proposed change', '', 'The smallest change.', '',
    '## Evidence', '', 'Current repository facts.', '',
    '## Nearest current consumer', '', 'One current consumer.', '',
    '## Contrast', '', 'One current contrast.', '',
    '## Impact', '', '- Permanent owners affected: one', '- Supporting requirements affected: none',
    '- Production and tests affected: none', '- Visible Setup or Result consequence: none', '',
    '## Approval result', '', '- Product owner: `Min-DongYoung`', `- Result: \`${result}\``,
    `- Decided at: ${result === 'pending' ? '' : '2026-08-16T00:00:00Z'}`, '',
  ].join('\n')
}

test('canonical tree digest is order independent, exact-tree sensitive, and never patch based', () => {
  const first = canonicalTreeDiff([treeEntry('b.ts'), treeEntry('a.ts', null, OTHER)])
  const second = canonicalTreeDiff([treeEntry('a.ts', null, OTHER), treeEntry('b.ts')])
  assert.equal(first.digest, second.digest)
  assert.deepEqual(first.entries.map(({ path }) => path), ['a.ts', 'b.ts'])
  assert.notEqual(first.digest, canonicalTreeDiff([treeEntry('a.ts', null, HEAD), treeEntry('b.ts')]).digest)
  assert.throws(() => canonicalTreeDiff([treeEntry('same.ts', BASE, BASE)]), PolicyError)
})

test('AE1 rejects mixed owner, ACR, and audit transactions while allowing their isolated forms', () => {
  assert.deepEqual(evaluateChangeMatrix(['docs/setup-workbench-product-contract.md']).categories, ['permanent-owner'])
  assert.throws(() => evaluateChangeMatrix(['docs/setup-workbench-product-contract.md', 'src/App.tsx']), /owner-only/)
  assert.deepEqual(evaluateChangeMatrix(['docs/authority-changes/2026-08-15-001-test.md']).categories, ['acr-instance'])
  assert.throws(() => evaluateChangeMatrix(['docs/authority-changes/2026-08-15-001-test.md', 'docs/brainstorms/x.md']), /ACR-only/)
  assert.throws(() => evaluateChangeMatrix(['docs/audits/2026-08-15-existing-vertical-recovery.md', 'src/App.tsx']), /index-only/)
  assert.throws(() => validateAcrStates([{ id: 'ACR-2026-08-15-001', status: 'proposed' }]), /not mergeable/)
})

test('ACR transaction accepts one outcome and only reciprocal immutable supersession', () => {
  const firstPath = 'docs/authority-changes/2026-08-16-001-first.md'
  const first = acrSource()
  assert.equal(parseAcrDocument(firstPath, first, { knownRuleIds: KNOWN_RULES }).status, 'accepted')
  assert.equal(validateAcrTransaction({ changes: [{ path: firstPath, headSource: first }] }, { knownRuleIds: KNOWN_RULES }).acceptedId, 'ACR-2026-08-16-001')

  const successorPath = 'docs/authority-changes/2026-08-16-002-successor.md'
  const successor = acrSource({ id: 'ACR-2026-08-16-002', supersedes: 'ACR-2026-08-16-001' })
  const superseded = acrSource({ status: 'superseded', supersededBy: 'ACR-2026-08-16-002' })
  const firstRecord = parseAcrDocument(firstPath, first, { knownRuleIds: KNOWN_RULES })
  assert.equal(validateAcrTransaction({ changes: [
    { path: firstPath, baseSource: first, headSource: superseded },
    { path: successorPath, headSource: successor },
  ] }, { knownRuleIds: KNOWN_RULES, baseRecords: [firstRecord] }).supersededId, 'ACR-2026-08-16-001')
  assert.throws(() => validateAcrTransaction({ changes: [
    { path: firstPath, baseSource: first, headSource: null },
  ] }, { knownRuleIds: KNOWN_RULES }), /cannot be deleted/)

  const currentSuccessor = acrSource({
    id: 'ACR-2026-08-16-002', supersedes: 'ACR-2026-08-16-001', ruleId: 'SW-002',
  })
  assert.equal(validateAcrTransaction({ changes: [
    { path: firstPath, baseSource: first, headSource: superseded },
    { path: successorPath, headSource: currentSuccessor },
  ] }, {
    currentRuleIds: ['SW-002'], knownRuleIds: ['SW-001', 'SW-002'], baseRecords: [firstRecord],
  }).acceptedId, 'ACR-2026-08-16-002')
  assert.throws(() => validateAcrTransaction({ changes: [
    { path: firstPath, headSource: first },
  ] }, { currentRuleIds: ['SW-002'], knownRuleIds: ['SW-001', 'SW-002'] }), /unknown permanent Rule ID/)

  const earlierPath = 'docs/authority-changes/2026-08-16-000-earlier.md'
  const earlier = acrSource({ id: 'ACR-2026-08-16-000' })
  assert.throws(() => validateAcrTransaction({ changes: [{ path: earlierPath, headSource: earlier }] }, {
    knownRuleIds: KNOWN_RULES, baseRecords: [firstRecord],
  }), /advance monotonically/)
})

test('change matrix allows supporting documentation with production but protects governance mixing and unknown paths', () => {
  assert.deepEqual(evaluateChangeMatrix(['docs/brainstorms/a.md', 'src/workbench/a.ts']).categories, ['production-test', 'supporting-doc'])
  assert.throws(() => evaluateChangeMatrix(['AGENTS.md', 'src/workbench/a.ts']), /cannot share/)
  assert.throws(() => evaluateChangeMatrix(['mystery.bin']), /Unknown/)
  assert.equal(categoryForPath('src/components/agentPortraits.ts'), 'visual-baseline')
})

test('U9 visual inputs retain one protected transaction category', () => {
  for (const visualPath of [
    'src/components/agentPortraits.ts',
    'src/app.css',
    'src/assets/agents/portraits/koleda.webp',
    'tests/visual/workbench-portraits.spec.ts',
    'playwright.config.ts',
  ]) assert.equal(categoryForPath(visualPath), 'visual-baseline')
})

test('U9 visual workflow pins screenshot execution and failure evidence', () => {
  const workflow = `name: Visual Baseline Validation

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read

concurrency:
  group: visual-baseline-\${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  visual-baseline:
    name: Visual Baseline
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version: 24
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm run test:visual
      - name: Upload visual comparison evidence
        if: \${{ always() }}
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: visual-baseline-\${{ github.event.pull_request.number }}-\${{ github.event.pull_request.head.sha }}
          path: |
            playwright-report/
            test-results/
            tests/visual/workbench-portraits.spec.ts-snapshots/
          if-no-files-found: warn
          retention-days: 14
`
  assert.equal(validateVisualWorkflow(workflow), true)

  for (const required of [
    '      image: mcr.microsoft.com/playwright@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07',
    '          persist-credentials: false',
    '      - run: npm ci --ignore-scripts',
    '      - run: npm run test:visual',
    '        if: \${{ always() }}',
    '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    '          name: visual-baseline-\${{ github.event.pull_request.number }}-\${{ github.event.pull_request.head.sha }}',
    '            playwright-report/',
    '            test-results/',
    '            tests/visual/workbench-portraits.spec.ts-snapshots/',
  ]) {
    assert.throws(() => validateVisualWorkflow(workflow.replace(required, '')), /Visual workflow/)
  }

  assert.throws(
    () => validateVisualWorkflow(workflow.replace('      - run: npm run test:visual', '      - run: true')),
    /Visual workflow/,
  )
})

test('AE4 proves one realistic additive Agent seam and protects a nearby shared helper edit', () => {
  assert.equal(proveAgentLocal(localFacts()).local, true)
  const local = computeChangeClassification({ paths: LOCAL_PATHS, structuralFacts: localFacts(), declaration: 'agent-local' })
  assert.equal(local.classification, 'agent-local')
  const helper = localFacts()
  helper.files.push({ path: 'src/workbench/effects.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'], commonChange: true })
  const protectedResult = computeChangeClassification({
    paths: [...LOCAL_PATHS, 'src/workbench/effects.ts'], structuralFacts: helper, declaration: 'agent-local',
  })
  assert.equal(protectedResult.classification, 'protected')
  assert.equal(protectedResult.declarationMismatch, true)
  assert.equal(computeChangeClassification({ paths: LOCAL_PATHS, structuralFacts: localFacts(), declaration: 'protected' }).classification, 'protected')
})

test('new equipment stays local only when fact, choice, type, and membership are exclusive to the new Agent', () => {
  const facts = localFacts()
  facts.files.push(
    { path: 'src/workbench/content/types.ts', kind: 'equipment-id-addition', operation: 'additive', equipmentIds: ['testEngine'] },
    { path: 'src/workbench/content/engines.ts', kind: 'equipment-fact-addition', operation: 'additive', equipmentIds: ['testEngine'] },
    { path: 'src/workbench/content/engines.ts', kind: 'equipment-choice-addition', operation: 'additive', equipmentIds: ['testEngine'] },
    { path: 'src/assets/equipment/w-engines/test-engine.webp', kind: 'equipment-asset-addition', operation: 'additive', equipmentIds: ['testEngine'] },
    { path: 'src/workbench/content/engines.ts', kind: 'agent-equipment-membership-addition', operation: 'additive', equipmentIds: ['testEngine'], agentIds: ['testAgent'] },
  )
  assert.equal(proveAgentLocal(facts).local, true)
  facts.files.at(-1).agentIds = ['existingAgent']
  assert.equal(proveAgentLocal(facts).local, false)
})

test('Authority trace is exact, reasoned, consumer-bound, and cannot de-escalate trusted classification', () => {
  const parsed = parseAuthorityTrace(traceBody())
  assert.deepEqual(parsed.ruleIds, ['SF-001', 'SW-001'])
  assert.deepEqual(validateAuthorityTrace(parsed, { knownRuleIds: KNOWN_RULES, computedClassification: 'agent-local' }).consumers, CONSUMERS)
  assert.throws(() => validateAuthorityTrace(parsed, { knownRuleIds: KNOWN_RULES, computedClassification: 'protected' }), /does not match/)
  assert.throws(() => parseAuthorityTrace(traceBody('agent-local', { Lifecycle: 'N/A' })), /needs a reason/)
  assert.throws(() => parseAuthorityTrace(`${traceBody()}\n## Authority trace\n`), /exactly one/)
  const ownerTrace = parseAuthorityTrace(traceBody('protected', { Prerequisites: 'Accepted ACR-2026-08-16-001 and its merged owner amendment.' }))
  assert.equal(validateAuthorityTrace(ownerTrace, {
    knownRuleIds: KNOWN_RULES, computedClassification: 'protected', changeCategories: ['permanent-owner'],
    acceptedAcrRecords: [{ id: 'ACR-2026-08-16-001', ruleIds: ['SW-001'] }],
    changedPaths: ['docs/setup-workbench-product-contract.md'],
  }).classification, 'protected')
  assert.throws(() => validateAuthorityTrace(ownerTrace, {
    knownRuleIds: KNOWN_RULES, computedClassification: 'protected', changeCategories: ['permanent-owner'],
    acceptedAcrRecords: [], changedPaths: ['docs/setup-workbench-product-contract.md'],
  }), /already-merged accepted/)
  assert.throws(() => validateAuthorityTrace(ownerTrace, {
    knownRuleIds: KNOWN_RULES, computedClassification: 'protected', changeCategories: ['permanent-owner'],
    acceptedAcrRecords: [{ id: 'ACR-2026-08-16-001', ruleIds: ['SF-001'] }],
    changedPaths: ['docs/setup-workbench-product-contract.md'],
  }), /do not govern/)
  const unrelatedRuleTrace = parseAuthorityTrace(traceBody('protected', {
    'Owning Rule IDs': 'SW-002',
    Prerequisites: 'Accepted ACR-2026-08-16-001 and its merged owner amendment.',
  }))
  assert.throws(() => validateAuthorityTrace(unrelatedRuleTrace, {
    knownRuleIds: [...KNOWN_RULES, 'SW-002'], computedClassification: 'protected',
    changeCategories: ['permanent-owner'],
    acceptedAcrRecords: [{ id: 'ACR-2026-08-16-001', ruleIds: ['SW-001'] }],
    changedPaths: ['docs/setup-workbench-product-contract.md'],
  }), /do not govern/)
})

test('review evidence requires exactly one current App comment bound to every reviewed identity', () => {
  const expected = {
    prNumber: 4, baseSha: BASE, headSha: HEAD, diffDigest: DIFF,
    classification: 'agent-local', mechanismDigest: 'none',
    traceDigest: authorityTraceDigest(parseAuthorityTrace(traceBody())),
    ruleIds: ['SW-001', 'SF-001'], consumers: CONSUMERS,
  }
  assert.equal(validateReviewEvidence([evidenceComment()], expected).payload.result, 'pass')
  assert.throws(() => validateReviewEvidence([], expected), /Exactly one/)
  assert.throws(() => validateReviewEvidence([evidenceComment(), evidenceComment()], expected), /Exactly one/)
  assert.throws(() => validateReviewEvidence([evidenceComment({}, { author: 'Min-DongYoung' })], expected), /author/)
  assert.throws(() => validateReviewEvidence([evidenceComment({ headSha: OTHER })], expected), /stale/)
  assert.throws(() => validateReviewEvidence([evidenceComment({ diffDigest: `sha256:${'b'.repeat(64)}` })], expected), /stale/)
})

test('comment edit or deletion and PR body classification edits invalidate a previously green decision', () => {
  assert.equal(trustedDecision(decisionInput()).statuses['Trusted Governance'], 'success')
  assert.throws(() => trustedDecision(decisionInput({ comments: [] })), /Exactly one/)
  assert.throws(() => trustedDecision(decisionInput({ comments: [evidenceComment({ result: 'fail' }, { updatedAt: '2026-08-15T02:00:00.000Z' })] })), /schema or result/)
  assert.throws(() => trustedDecision(decisionInput({ body: traceBody('protected') })), /does not match/)
  assert.throws(() => trustedDecision(decisionInput({
    body: traceBody('agent-local', { Lifecycle: 'A materially different lifecycle claim.' }),
  })), /stale/)
})

test('protected approval is exact-head, latest-state, and newer than review evidence', () => {
  const expected = { classification: 'protected', headSha: HEAD, evidenceUpdatedAt: '2026-08-15T01:01:00.000Z' }
  assert.equal(validateProtectedApproval([
    { author: 'Min-DongYoung', state: 'APPROVED', commitId: HEAD, submittedAt: '2026-08-15T01:02:00.000Z' },
  ], expected).approved, true)
  assert.throws(() => validateProtectedApproval([
    { author: 'Min-DongYoung', state: 'APPROVED', commitId: OTHER, submittedAt: '2026-08-15T01:02:00.000Z' },
  ], expected), /current owner approval/)
  assert.throws(() => validateProtectedApproval([
    { author: 'Min-DongYoung', state: 'APPROVED', commitId: HEAD, submittedAt: '2026-08-15T00:30:00.000Z' },
  ], expected), /postdate/)
  assert.throws(() => validateProtectedApproval([
    { author: 'Min-DongYoung', state: 'APPROVED', commitId: HEAD, submittedAt: '2026-08-15T01:01:00.000Z' },
  ], expected), /postdate/)
  assert.throws(() => validateProtectedApproval([
    { author: 'Min-DongYoung', state: 'APPROVED', commitId: HEAD, submittedAt: '2026-08-15T01:02:00.000Z' },
    { author: 'Min-DongYoung', state: 'CHANGES_REQUESTED', commitId: HEAD, submittedAt: '2026-08-15T01:03:00.000Z' },
  ], expected), /current owner approval/)
})

test('required workflow aggregation binds exact run identity and fails closed on every non-success outcome', () => {
  const expected = {
    prNumber: 4, baseSha: BASE, headSha: HEAD,
    prValidationWorkflowId: 101, visualWorkflowId: 102,
  }
  assert.deepEqual(validateChildOutcomes(validationRuns(), expected).jobs, REQUIRED_JOB_NAMES)
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral']) {
    const runs = validationRuns()
    runs[0].jobs[0].conclusion = conclusion
    assert.throws(() => validateChildOutcomes(runs, expected), /exactly once with success/)
  }
  assert.deepEqual(validateChildOutcomes([...validationRuns(), { ...validationRuns()[0], id: 1 }], expected).jobs, REQUIRED_JOB_NAMES)
  for (const mismatch of [
    { prNumber: 5 },
    { baseSha: OTHER },
    { headSha: OTHER },
    { statusSha: OTHER },
  ]) {
    assert.throws(() => validateChildOutcomes(validationRuns(mismatch), expected), /absent/)
  }
})

test('required context descriptors and governance binding share one exact contract', () => {
  assert.deepEqual(REQUIRED_CONTEXTS.map(({ name, kind, run }) => [name, kind, run]), [
    ['Trusted Governance', 'status', 'trusted'],
    ['Protected Approval', 'status', 'trusted'],
    ['Behavior Tests', 'check', 'validation'],
    ['Type Check', 'check', 'validation'],
    ['Production Build', 'check', 'validation'],
    ['Visual Baseline', 'check', 'visual'],
  ])
  assert.deepEqual(REQUIRED_WORKFLOWS, [
    {
      run: 'validation', path: '.github/workflows/pr-validation.yml', idField: 'prValidationWorkflowId',
      names: ['Behavior Tests', 'Type Check', 'Production Build'],
    },
    {
      run: 'visual', path: '.github/workflows/visual-baseline.yml', idField: 'visualWorkflowId',
      names: ['Visual Baseline'],
    },
  ])
  const binding = createGovernanceStatusBinding({
    prNumber: 4,
    baseSha: BASE,
    runs: { validation: 10, visual: 11 },
    actionRunUrl: 'https://github.com/Min-DongYoung/zzz-workbench/actions/runs/99',
  })
  assert.deepEqual(parseGovernanceTargetBinding(binding.targetUrl), {
    prNumber: 4, baseSha: BASE, runs: { validation: 10, visual: 11 },
  })
  assert.deepEqual(parseGovernanceStatusBinding(binding), {
    prNumber: 4, baseSha: BASE, runs: { validation: 10, visual: 11 },
  })
  assert.equal(parseGovernanceStatusBinding({ ...binding, description: binding.description.replace('10,11', '11,10') }), null)
  assert.throws(() => createGovernanceStatusBinding({
    prNumber: 4, baseSha: BASE, runs: { validation: 10, visual: 10 }, actionRunUrl: binding.targetUrl,
  }), /run identities/)
})

test('trusted decision targets the PR head SHA and separates governance from protected approval', () => {
  const local = trustedDecision(decisionInput())
  assert.equal(local.targetSha, HEAD)
  assert.deepEqual(local.statuses, { 'Trusted Governance': 'success', 'Protected Approval': 'success' })

  const protectedComment = evidenceComment({
    classification: 'protected',
    traceDigest: authorityTraceDigest(parseAuthorityTrace(traceBody('protected'))),
  })
  const protectedInput = decisionInput({
    classification: 'protected',
    body: traceBody('protected'),
    comments: [protectedComment],
    reviews: [{ author: 'Min-DongYoung', state: 'APPROVED', commitId: HEAD, submittedAt: '2026-08-15T01:02:00.000Z' }],
  })
  assert.equal(trustedDecision(protectedInput).approval.required, true)
  const awaitingOwner = trustedDecision({ ...protectedInput, reviews: [] })
  assert.deepEqual(awaitingOwner.statuses, { 'Trusted Governance': 'success', 'Protected Approval': 'failure' })
})

test('stable Rule IDs come only from five permanent owners plus AGENTS and reject duplicates', () => {
  const ownerTexts = [
    ['docs/setup-workbench-product-contract.md', '**Rule ID:** `SW-001`'],
    ['docs/source-fact-boundary.md', '**Rule ID:** `SF-001`'],
    ['docs/workbench-ui-design-rules.md', '**Rule ID:** `UI-001`'],
    ['docs/zzz-formula-mechanics.md', '**Rule ID:** `FM-001`'],
    ['docs/zzz-game-vocabulary.md', '**Rule ID:** `GV-001`'],
    ['AGENTS.md', '**Governance Rule ID:** `GOV-001`'],
  ].map(([path, text]) => ({ path, text }))
  assert.deepEqual(extractCurrentRuleIds(ownerTexts), ['FM-001', 'GOV-001', 'GV-001', 'SF-001', 'SW-001', 'UI-001'])
  ownerTexts[1].text = '**Rule ID:** `SW-001`'
  assert.throws(() => extractCurrentRuleIds(ownerTexts), /duplicated/)

  const retiredOwners = [
    ['docs/setup-workbench-product-contract.md', '**Rule ID:** `SW-002`\n\n## Retired Rule IDs\n\nSW-001 -> SW-002: split boundary'],
    ['docs/source-fact-boundary.md', '**Rule ID:** `SF-001`'],
    ['docs/workbench-ui-design-rules.md', '**Rule ID:** `UI-001`'],
    ['docs/zzz-formula-mechanics.md', '**Rule ID:** `FM-001`'],
    ['docs/zzz-game-vocabulary.md', '**Rule ID:** `GV-001`'],
    ['AGENTS.md', '**Governance Rule ID:** `GOV-001`'],
  ].map(([path, text]) => ({ path, text }))
  assert.deepEqual(extractRuleIdState(retiredOwners), {
    currentRuleIds: ['FM-001', 'GOV-001', 'GV-001', 'SF-001', 'SW-002', 'UI-001'],
    retiredRuleIds: ['SW-001'],
    knownRuleIds: ['FM-001', 'GOV-001', 'GV-001', 'SF-001', 'SW-001', 'SW-002', 'UI-001'],
  })
})

test('AE6 frozen roster and finalization fail until exact complete recovery state exists', () => {
  const roster = Array.from({ length: 38 }, (_, index) => `Agent ${String(index + 1).padStart(2, '0')}`)
  assert.equal(validateFrozenRoster(roster, [...roster].reverse()), true)
  assert.equal(validateFrozenRoster([...roster, 'New Agent'], [...roster].reverse()), true)
  assert.throws(() => validateFrozenRoster([...roster.slice(1), 'New Agent'], roster), /exactly cover/)
  assert.throws(() => validateFrozenRoster(roster, roster.slice(1)), /exactly cover/)
  const statuses = Object.fromEntries(['Trusted Governance', 'Protected Approval', ...REQUIRED_JOB_NAMES].map((name) => [name, 'success']))
  assert.throws(() => validateFinalization({ actor: 'other', candidateSha: HEAD, recoveryTipSha: HEAD, auditComplete: true, statuses }), /Only/)
  assert.throws(() => validateFinalization({ actor: 'Min-DongYoung', candidateSha: HEAD, recoveryTipSha: OTHER, auditComplete: true, statuses }), /current recovery tip/)
  assert.throws(() => validateFinalization({ actor: 'Min-DongYoung', candidateSha: HEAD, recoveryTipSha: HEAD, auditComplete: false, statuses }), /incomplete/)
  assert.equal(validateFinalization({ actor: 'Min-DongYoung', candidateSha: HEAD, recoveryTipSha: HEAD, auditComplete: true, statuses }), true)
})

test('checker tampering is itself protected and cannot declare itself Agent-local', () => {
  const result = computeChangeClassification({
    paths: ['scripts/governance/check-policy.mjs'], structuralFacts: localFacts(), declaration: 'agent-local',
  })
  assert.equal(result.classification, 'protected')
  assert.equal(result.declarationMismatch, true)
})

test('current repository satisfies static governance shape independent of recovery lifecycle state', async () => {
  const current = await validateRepository(process.cwd())
  assert.equal(current.rosterSize, 38)
  assert.equal(typeof current.auditComplete, 'boolean')
  if (current.auditComplete) await validateRepository(process.cwd(), { requireCompleteAudit: true })
  else await assert.rejects(() => validateRepository(process.cwd(), { requireCompleteAudit: true }), /incomplete/)
})

test('trusted governance serializes event runs without cancelling PR-attached checks', () => {
  const queued = `concurrency:
  group: trusted-governance-dispatcher
  queue: max
`
  assert.equal(validateTrustedWorkflowConcurrency(queued), true)
  assert.throws(() => validateTrustedWorkflowConcurrency(queued.replace('queue: max', 'cancel-in-progress: true')), /queued without cancellation/)
  assert.throws(() => validateTrustedWorkflowConcurrency(queued.replace('  queue: max\n', '')), /queued without cancellation/)
  assert.throws(() => validateTrustedWorkflowConcurrency(queued.replace('trusted-governance-dispatcher', 'trusted-governance-${{ github.run_id }}')), /globally queued/)
  assert.throws(() => validateTrustedWorkflowConcurrency(`${queued}\n${queued}`), /globally queued/)
  assert.throws(() => validateTrustedWorkflowConcurrency(queued.replace('  queue: max', '  queue: max\n  unexpected: true')), /globally queued/)
})
