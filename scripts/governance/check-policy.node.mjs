import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
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
  parseAgentRoster,
  parseGovernanceStatusBinding,
  parseGovernanceTargetBinding,
  proveAgentLocal,
  proveIdentifierOnlyOwnerChange,
  trustedDecision,
  validateAcrStates,
  validateAcrTransaction,
  validateAuthorityTrace,
  validateChildOutcomes,
  validateFinalization,
  validateFrozenRoster,
  validateProtectedApproval,
  validateReviewSignalWorkflow,
  validateVisualWorkflow,
  validateReviewEvidence,
  validateRepository,
  validateSupportingRequirementRuleIds,
  validateTrustedWorkflowConcurrency,
  validateTrustedWorkflowEvents,
  isVisualNotApplicableDiff,
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

function visualWorkflowSource() {
  return readFileSync(join(process.cwd(), '.github/workflows/visual-baseline.yml'), 'utf8')
}

function visualScopeScript() {
  const workflow = visualWorkflowSource().replace(/\r\n?/g, '\n')
  const startToken = "          node --input-type=module <<'NODE'\n"
  const endToken = '\n          NODE\n'
  const start = workflow.indexOf(startToken)
  const end = workflow.indexOf(endToken, start + startToken.length)
  assert.notEqual(start, -1)
  assert.notEqual(end, -1)
  const imports = [
    "import { appendFileSync } from 'node:fs'",
    "import { execFileSync } from 'node:child_process'",
  ]
  let source = workflow.slice(start + startToken.length, end)
    .split('\n')
    .map((line) => line.startsWith('          ') ? line.slice(10) : line)
    .join('\n')
  for (const statement of imports) {
    assert.equal(source.split(statement).length, 2)
    source = source.replace(`${statement}\n`, '')
  }
  assert.doesNotMatch(source, /^import /m)
  return source
}

function rawVisualRecord(path, {
  status = 'M',
  oldMode = status === 'A' ? '000000' : '100644',
  newMode = status === 'D' ? '000000' : '100644',
  oldSha = oldMode === '000000' ? '0'.repeat(40) : BASE,
  newSha = newMode === '000000' ? '0'.repeat(40) : HEAD,
} = {}) {
  return `:${oldMode} ${newMode} ${oldSha} ${newSha} ${status}\0${path}\0`
}

function visualTreeEntry(path, {
  status = 'M',
  oldMode = status === 'A' ? '000000' : '100644',
  newMode = status === 'D' ? '000000' : '100644',
  oldSha = oldMode === '000000' ? '0'.repeat(40) : BASE,
  newSha = newMode === '000000' ? '0'.repeat(40) : HEAD,
} = {}) {
  const side = (mode, sha) => mode === '000000' ? null : {
    mode,
    type: mode === '160000' ? 'commit' : 'blob',
    sha,
  }
  return { path, base: side(oldMode, oldSha), head: side(newMode, newSha) }
}

function executeVisualScope(raw, { base = BASE, head = HEAD } = {}) {
  const calls = []
  const writes = []
  runInNewContext(visualScopeScript(), {
    process: { env: { BASE_SHA: base, HEAD_SHA: head, GITHUB_ENV: 'github-env' } },
    execFileSync(command, args, options) {
      calls.push({ command, args: [...args], options: { ...options } })
      return raw
    },
    appendFileSync(filePath, value) {
      writes.push({ filePath, value })
    },
  })
  return { calls, writes }
}

function visualScopeResult(raw, options) {
  const result = executeVisualScope(raw, options)
  assert.deepEqual(result.calls, [{
    command: 'git',
    args: [
      'diff', '--raw', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', '--abbrev=40',
      options?.base ?? BASE, options?.head ?? HEAD, '--',
    ],
    options: { encoding: 'utf8' },
  }])
  assert.deepEqual(result.writes.map(({ filePath }) => filePath), ['github-env'])
  assert.equal(result.writes.length, 1)
  const match = /^VISUAL_NOT_APPLICABLE=(true|false)\n$/.exec(result.writes[0].value)
  assert.ok(match)
  return match[1] === 'true'
}

function localFacts() {
  return {
    newAgentId: 'testAgent',
    agentSlug: 'test-agent',
    existingEquipmentIds: ['discA', 'engineA'],
    files: [
      { path: 'src/workbench/content/types.ts', kind: 'agent-id-union-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/agents.ts', kind: 'agent-summary-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/setup-options.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/representatives.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/retained-values.ts', kind: 'agent-owned-record-entry', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/calculate.ts', kind: 'agent-import-and-switch-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/provider-effects.ts', kind: 'agent-import-and-switch-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/content/agent-setup-candidates.ts', kind: 'agent-equipment-membership-addition', operation: 'additive', agentIds: ['testAgent'], equipmentIds: ['engineA'] },
      { path: 'src/workbench/content/agent-setup-candidates.ts', kind: 'agent-equipment-membership-addition', operation: 'additive', agentIds: ['testAgent'], equipmentIds: ['discA'] },
      { path: 'src/workbench/calculation/agents/test-agent.ts', kind: 'agent-calculation-module-addition', operation: 'additive', agentIds: ['testAgent'] },
      { path: 'src/workbench/calculate.flows.test.ts', kind: 'test-additions-only', operation: 'additive', agentIds: ['testAgent'] },
    ],
  }
}

const LOCAL_PATHS = [...new Set(localFacts().files.map(({ path }) => path))]

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
  assert.deepEqual(
    evaluateChangeMatrix(['docs/audits/2026-08-27-agent-centered-candidate-audit-brief.md', 'src/workbench/a.ts']).categories,
    ['production-test', 'supporting-doc'],
  )
  assert.equal(categoryForPath('docs/audits/2026-08-15-existing-vertical-recovery.md'), 'audit-index')
  assert.throws(() => evaluateChangeMatrix(['AGENTS.md', 'src/workbench/a.ts']), /cannot share/)
  assert.throws(() => evaluateChangeMatrix(['mystery.bin']), /Unknown/)
  assert.equal(categoryForPath('src/components/agentPortraits.ts'), 'visual-baseline')
})

test('identifier-only owner bootstrap proves only monotonic namespaced markers beneath existing headings', () => {
  const baseSource = [
    '### Party-Slot Continuity',
    '',
    'Current continuity rule.',
    '',
    '### Party Editing',
    '',
    'Current editing rule.',
    '',
  ].join('\n')
  const headSource = [
    '### Party-Slot Continuity',
    '',
    '**Rule ID:** `UI-005`',
    '',
    'Current continuity rule.',
    '',
    '### Party Editing',
    '',
    '**Rule ID:** `UI-006`',
    '',
    'Current editing rule.',
    '',
  ].join('\n')
  const ruleState = { knownRuleIds: ['GOV-001', 'UI-001', 'UI-004'] }
  const change = {
    path: 'docs/workbench-ui-design-rules.md',
    baseType: 'blob',
    baseMode: '100644',
    headType: 'blob',
    headMode: '100644',
    baseSource,
    headSource,
  }
  assert.deepEqual(proveIdentifierOnlyOwnerChange([change], ruleState), {
    path: 'docs/workbench-ui-design-rules.md',
    newRuleIds: ['UI-005', 'UI-006'],
  })
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headSource: headSource.replace('Current editing rule.', 'Changed editing rule.') }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headSource: headSource.replace('UI-005', 'SW-005') }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headSource: headSource.replace('UI-005', 'UI-004') }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headSource: headSource.replace('UI-005', 'UI-007').replace('UI-006', 'UI-005') }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headSource: headSource.replace('### Party-Slot Continuity\n\n', '') }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, baseSource: headSource, headSource: headSource.replace('**Rule ID:** `UI-005`\n\n', '') }], {
    knownRuleIds: [...ruleState.knownRuleIds, 'UI-005', 'UI-006'],
  }), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, baseSource: headSource, headSource: headSource.replace('UI-005', 'UI-007') }], {
    knownRuleIds: [...ruleState.knownRuleIds, 'UI-005', 'UI-006'],
  }), null)
  const numberedBase = '### Information Density\n\n**Rule ID:** `UI-001`\n\nCurrent density rule.\n'
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change,
    baseSource: numberedBase,
    headSource: numberedBase.replace('**Rule ID:** `UI-001`', '**Rule ID:** `UI-005`\n\n**Rule ID:** `UI-001`'),
  }], ruleState), null)
  for (const [base, head] of [
    [
      '```md\n### Example Rule\n\nExample text.\n```\n',
      '```md\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n```\n',
    ],
    [
      '~~~md\n### Example Rule\n\nExample text.\n~~~\n',
      '~~~md\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n~~~\n',
    ],
    [
      '<!--\n### Example Rule\n\nExample text.\n-->\n',
      '<!--\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n-->\n',
    ],
    [
      '```md <!-- descriptive info -->\n### Example Rule\n\nExample text.\n',
      '```md <!-- descriptive info -->\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n',
    ],
    [
      '```md\n```not-a-close\n### Example Rule\n\nExample text.\n```\n',
      '```md\n```not-a-close\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n```\n',
    ],
    [
      '<!-- closed --><!-- remains open\n### Example Rule\n\nExample text.\n-->\n',
      '<!-- closed --><!-- remains open\n### Example Rule\n\n**Rule ID:** `UI-005`\n\nExample text.\n-->\n',
    ],
    [
      '## Stable Rule Identifiers\n\nIdentifier notes.\n',
      '## Stable Rule Identifiers\n\n**Rule ID:** `UI-005`\n\nIdentifier notes.\n',
    ],
    [
      '## Retired Rule IDs\n\nRetirement notes.\n',
      '## Retired Rule IDs\n\n**Rule ID:** `UI-005`\n\nRetirement notes.\n',
    ],
    [
      '## Examples\n\nExample text.\n',
      '## Examples\n\n**Rule ID:** `UI-005`\n\nExample text.\n',
    ],
    [
      '## Purpose\n\nPurpose text.\n',
      '## Purpose\n\n**Rule ID:** `UI-005`\n\nPurpose text.\n',
    ],
    [
      '## Authority Boundary\n\nBoundary text.\n',
      '## Authority Boundary\n\n**Rule ID:** `UI-005`\n\nBoundary text.\n',
    ],
  ]) {
    assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, baseSource: base, headSource: head }], ruleState), null)
  }
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headMode: '100755' }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, baseType: 'tree' }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change, headType: 'commit' }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([change], {
    knownRuleIds: [...ruleState.knownRuleIds, 'UI-009'],
  }), null)
  const movedBase = '### First Rule\n\n**Rule ID:** `UI-001`\n\nFirst text.\n\n### Second Rule\n\nSecond text.\n'
  const movedHead = '### First Rule\n\nFirst text.\n\n### Second Rule\n\n**Rule ID:** `UI-001`\n\nSecond text.\n'
  assert.equal(proveIdentifierOnlyOwnerChange([{ ...change,
    baseSource: movedBase,
    headSource: movedHead,
  }], ruleState), null)
  const duplicateHeadingBase = '### Rule\n\nFirst text.\n\n### Rule\n\nSecond text.\n'
  const duplicateHeadingHead = '### Rule\n\n**Rule ID:** `UI-005`\n\nFirst text.\n\n### Rule\n\n**Rule ID:** `UI-006`\n\nSecond text.\n'
  assert.deepEqual(proveIdentifierOnlyOwnerChange([{ ...change,
    baseSource: duplicateHeadingBase,
    headSource: duplicateHeadingHead,
  }], ruleState)?.newRuleIds, ['UI-005', 'UI-006'])
  const parentChildBase = '### Parent Rule\n\nParent text.\n\n#### Child Rule\n\n**Rule ID:** `UI-001`\n\nChild text.\n'
  const parentChildHead = '### Parent Rule\n\n**Rule ID:** `UI-005`\n\nParent text.\n\n#### Child Rule\n\n**Rule ID:** `UI-001`\n\nChild text.\n'
  assert.deepEqual(proveIdentifierOnlyOwnerChange([{ ...change,
    baseSource: parentChildBase,
    headSource: parentChildHead,
  }], ruleState)?.newRuleIds, ['UI-005'])
  const crlfBase = baseSource.replaceAll('\n', '\r\n')
  const crlfHead = headSource.replaceAll('\n', '\r\n')
  assert.deepEqual(proveIdentifierOnlyOwnerChange([{ ...change,
    baseSource: crlfBase,
    headSource: crlfHead,
  }], ruleState)?.newRuleIds, ['UI-005', 'UI-006'])
  assert.equal(proveIdentifierOnlyOwnerChange([
    change,
    { path: 'docs/setup-workbench-product-contract.md', baseSource, headSource },
  ], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([
    change,
    {
      path: 'README.md',
      baseType: 'blob',
      baseMode: '100644',
      headType: 'blob',
      headMode: '100644',
      baseSource: 'Old text.\n',
      headSource: 'New text.\n',
    },
  ], ruleState), null)
})

test('identifier bootstrap proves the two current party UI rules from an unnumbered base', () => {
  const currentSource = readFileSync(new URL('../../docs/workbench-ui-design-rules.md', import.meta.url), 'utf8')
  const baseSource = currentSource
    .replace('**Rule ID:** `UI-005`\n\n', '')
    .replace('**Rule ID:** `UI-006`\n\n', '')
  const headSource = baseSource
    .replace('### Party-Slot Continuity\n\n', '### Party-Slot Continuity\n\n**Rule ID:** `UI-005`\n\n')
    .replace('### Party Editing\n\n', '### Party Editing\n\n**Rule ID:** `UI-006`\n\n')
  assert.deepEqual(proveIdentifierOnlyOwnerChange([{
    path: 'docs/workbench-ui-design-rules.md',
    baseType: 'blob',
    baseMode: '100644',
    headType: 'blob',
    headMode: '100644',
    baseSource,
    headSource,
  }], {
    knownRuleIds: ['UI-001', 'UI-002', 'UI-003', 'UI-004'],
  }), {
    path: 'docs/workbench-ui-design-rules.md',
    newRuleIds: ['UI-005', 'UI-006'],
  })
})

test('identifier bootstrap proves only the legacy product non-goals level-two boundary', () => {
  const currentSource = readFileSync(new URL('../../docs/setup-workbench-product-contract.md', import.meta.url), 'utf8')
  const baseSource = currentSource.replace('**Rule ID:** `SW-022`\n\n', '')
  const headSource = baseSource.replace(
    '## Current Non-Goals\n\n',
    '## Current Non-Goals\n\n**Rule ID:** `SW-022`\n\n',
  )
  const productChange = {
    path: 'docs/setup-workbench-product-contract.md',
    baseType: 'blob',
    baseMode: '100644',
    headType: 'blob',
    headMode: '100644',
    baseSource,
    headSource,
  }
  const ruleState = { knownRuleIds: ['GOV-001', 'SW-001', 'SW-021'] }

  assert.deepEqual(proveIdentifierOnlyOwnerChange([productChange], ruleState), {
    path: 'docs/setup-workbench-product-contract.md',
    newRuleIds: ['SW-022'],
  })
  assert.equal(proveIdentifierOnlyOwnerChange([{
    ...productChange,
    path: 'docs/workbench-ui-design-rules.md',
    headSource: headSource.replace('SW-022', 'UI-007'),
  }], { knownRuleIds: ['GOV-001', 'UI-001', 'UI-006'] }), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{
    ...productChange,
    baseSource: baseSource.replace('Current Non-Goals', 'Purpose'),
    headSource: headSource.replace('Current Non-Goals', 'Purpose'),
  }], ruleState), null)
  assert.equal(proveIdentifierOnlyOwnerChange([{
    ...productChange,
    headSource: headSource.replace(
      '## Purpose\n\n',
      '## Purpose\n\n**Rule ID:** `SW-023`\n\n',
    ),
  }], ruleState), null)
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

test('U4 visual N/A is limited to regular Markdown supporting documentation', () => {
  assert.equal(isVisualNotApplicableDiff([
    treeEntry('docs/plans/example.md'),
    treeEntry('docs/brainstorms/example.md', BASE, null),
    treeEntry('docs/solutions/example.md', null, HEAD),
    treeEntry('docs/roadmaps/example.md'),
    treeEntry('docs/ideation/example.md'),
  ]), true)
  for (const entry of [
    treeEntry('docs/audits/example.md'),
    treeEntry('docs/plans/example.txt'),
    treeEntry('src/app.css'),
    treeEntry('docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md'),
    treeEntry('docs/plans/2026-08-15-003-fix-authority-governance-recovery-plan.md'),
    treeEntry('docs/plans/example.md', null, null),
    {
      ...treeEntry('docs/plans/example.md'),
      base: { mode: '100755', type: 'blob', sha: BASE },
      head: { mode: '100755', type: 'blob', sha: HEAD },
    },
    {
      ...treeEntry('docs/plans/example.md'),
      base: { mode: '120000', type: 'blob', sha: BASE },
      head: { mode: '120000', type: 'blob', sha: HEAD },
    },
    {
      ...treeEntry('docs/plans/example.md'),
      base: { mode: '160000', type: 'commit', sha: BASE },
      head: { mode: '160000', type: 'commit', sha: HEAD },
    },
    { ...treeEntry('docs/plans/example.md'), head: { mode: '120000', type: 'blob', sha: HEAD } },
    { ...treeEntry('docs/plans/example.md'), head: { mode: '100644', type: 'tree', sha: HEAD } },
  ]) assert.equal(isVisualNotApplicableDiff([entry]), false)
  assert.equal(isVisualNotApplicableDiff([treeEntry('docs/plans/example.md'), treeEntry('src/app.css')]), false)
})

test('U4 visual workflow classifier derives N/A from exact event SHAs and raw Git identity', () => {
  const singleRecordCases = [
    ['docs/plans/added.md', { status: 'A' }],
    ['docs/brainstorms/deleted.md', { status: 'D' }],
    ['docs/solutions/edited.md', {}],
    ['docs/plans/.md', {}],
    ['docs/plans/example.txt', {}],
    ['unknown/example.md', {}],
    ['docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md', {}],
    ['docs/plans/2026-08-15-003-fix-authority-governance-recovery-plan.md', {}],
    ['docs/plans/executable.md', { oldMode: '100755', newMode: '100755' }],
    ['docs/plans/symlink.md', { oldMode: '120000', newMode: '120000' }],
    ['docs/plans/submodule.md', { oldMode: '160000', newMode: '160000' }],
    ['docs/plans/type-change.md', { status: 'T', oldMode: '100644', newMode: '120000' }],
    ['docs/plans/was-executable.md', { oldMode: '100755', newMode: '100644' }],
    ['docs/plans/was-symlink.md', { status: 'T', oldMode: '120000', newMode: '100644' }],
    ['docs/plans/was-submodule.md', { status: 'T', oldMode: '160000', newMode: '100644' }],
  ]
  for (const [path, options] of singleRecordCases) {
    assert.equal(
      visualScopeResult(rawVisualRecord(path, options)),
      isVisualNotApplicableDiff([visualTreeEntry(path, options)]),
    )
  }

  const multipleEntries = [
    visualTreeEntry('docs/roadmaps/one.md'),
    visualTreeEntry('docs/ideation/two.md', { status: 'A' }),
  ]
  assert.equal(
    visualScopeResult(
      rawVisualRecord('docs/roadmaps/one.md')
        + rawVisualRecord('docs/ideation/two.md', { status: 'A' }),
    ),
    isVisualNotApplicableDiff(multipleEntries),
  )
  assert.equal(
    visualScopeResult(rawVisualRecord('docs/plans/example.md') + rawVisualRecord('src/app.css')),
    isVisualNotApplicableDiff([visualTreeEntry('docs/plans/example.md'), visualTreeEntry('src/app.css')]),
  )
})

test('U4 visual workflow classifier rejects incomplete or inconsistent raw Git identity', () => {
  for (const raw of [
    '',
    rawVisualRecord('docs/plans/example.md').slice(0, -1),
    `:100644 100644 ${BASE} ${HEAD} M\0`,
    `100644 100644 ${BASE} ${HEAD} M\0docs/plans/example.md\0`,
    `:100600 100644 ${BASE} ${HEAD} M\0docs/plans/example.md\0`,
    `:100644 100644 ${'g'.repeat(40)} ${HEAD} M\0docs/plans/example.md\0`,
    rawVisualRecord('docs/plans/example.md', { status: 'A', oldMode: '100644' }),
    rawVisualRecord('docs/plans/example.md', { status: 'D', newMode: '100644' }),
    rawVisualRecord('docs/plans/example.md', { status: 'M', oldMode: '000000' }),
    rawVisualRecord('docs/plans/example.md', { status: 'T', newMode: '000000' }),
    rawVisualRecord('docs/plans/example.md', { oldSha: BASE, newSha: BASE }),
    `:100644 100644 ${BASE} ${HEAD} X\0docs/plans/example.md\0`,
  ]) assert.throws(() => executeVisualScope(raw), /Visual baseline diff/)

  for (const [base, head] of [
    ['', HEAD],
    [BASE, 'short'],
    ['A'.repeat(40), HEAD],
    [BASE, `${HEAD}0`],
  ]) assert.throws(
    () => executeVisualScope(rawVisualRecord('docs/plans/example.md'), { base, head }),
    /Visual baseline commit identity is invalid/,
  )
})

test('U9 visual workflow pins screenshot execution and failure evidence', () => {
  const currentWorkflow = visualWorkflowSource()
  assert.equal(validateVisualWorkflow(currentWorkflow), true)
  const workflowSource = currentWorkflow

  for (const required of [
    '      image: mcr.microsoft.com/playwright@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07',
    '          persist-credentials: false',
    '      - run: npm ci --ignore-scripts',
    '      - run: npm run test:visual',
    '        if: \${{ failure() }}',
    '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    '          name: visual-baseline-\${{ github.event.pull_request.number }}-\${{ github.event.pull_request.head.sha }}',
    '            playwright-report/',
    '            test-results/',
    '          retention-days: 3',
  ]) {
    assert.throws(() => validateVisualWorkflow(workflowSource.replace(required, '')), /Visual workflow/)
  }

  assert.throws(
    () => validateVisualWorkflow(workflowSource.replace('      - run: npm run test:visual', '      - run: true')),
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
    { path: 'src/workbench/content/agent-setup-candidates.ts', kind: 'agent-equipment-membership-addition', operation: 'additive', equipmentIds: ['engineA', 'testEngine'], agentIds: ['testAgent'] },
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
  const identifierTrace = parseAuthorityTrace(traceBody('protected', {
    'Owning Rule IDs': 'GOV-001',
    Prerequisites: 'No accepted authority record applies because the exact owner diff adds identifiers only.',
  }))
  const identifierOnlyOwnerChange = {
    path: 'docs/workbench-ui-design-rules.md',
    newRuleIds: ['UI-005', 'UI-006'],
  }
  assert.equal(validateAuthorityTrace(identifierTrace, {
    knownRuleIds: KNOWN_RULES,
    computedClassification: 'protected',
    changeCategories: ['permanent-owner'],
    changedPaths: ['docs/workbench-ui-design-rules.md'],
    identifierOnlyOwnerChange,
  }).classification, 'protected')
  assert.throws(() => validateAuthorityTrace(identifierTrace, {
    knownRuleIds: KNOWN_RULES,
    computedClassification: 'protected',
    changeCategories: ['permanent-owner'],
    changedPaths: ['docs/workbench-ui-design-rules.md'],
  }), /already-merged accepted/)
  assert.throws(() => validateAuthorityTrace(identifierTrace, {
    knownRuleIds: KNOWN_RULES,
    computedClassification: 'protected',
    changeCategories: ['permanent-owner'],
    changedPaths: ['docs/workbench-ui-design-rules.md'],
    identifierOnlyOwnerChange: { ...identifierOnlyOwnerChange, path: 'docs/setup-workbench-product-contract.md' },
  }), /Identifier-only/)
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

test('trusted decision accepts a proven identifier bootstrap and rejects the same owner trace without proof', () => {
  const identifierBody = traceBody('protected', {
    'Owning Rule IDs': 'GOV-001',
    Prerequisites: 'No accepted authority record applies because the exact owner diff adds identifiers only.',
  })
  const identifierEvidence = evidenceComment({
    classification: 'protected',
    traceDigest: authorityTraceDigest(parseAuthorityTrace(identifierBody)),
    ruleIds: ['GOV-001'],
  })
  const input = decisionInput({
    body: identifierBody,
    classification: 'protected',
    changeCategories: ['permanent-owner'],
    changedPaths: ['docs/workbench-ui-design-rules.md'],
    identifierOnlyOwnerChange: {
      path: 'docs/workbench-ui-design-rules.md',
      newRuleIds: ['UI-005', 'UI-006'],
    },
    knownRuleIds: [...KNOWN_RULES, 'UI-001', 'UI-004'],
    comments: [identifierEvidence],
    reviews: [{
      author: 'Min-DongYoung',
      state: 'APPROVED',
      commitId: HEAD,
      submittedAt: '2026-08-15T01:02:00.000Z',
    }],
  })
  assert.equal(trustedDecision(input).statuses['Trusted Governance'], 'success')
  assert.throws(() => trustedDecision({ ...input, identifierOnlyOwnerChange: null }), /already-merged accepted/)
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
  const skippedMarker = validationRuns()
  skippedMarker[1].jobs[0].steps = [{ name: 'Visual baseline not applicable', conclusion: 'skipped' }]
  assert.deepEqual(validateChildOutcomes(skippedMarker, expected).jobs, REQUIRED_JOB_NAMES)

  const validMarker = validationRuns()
  validMarker[1].jobs[0].steps = [{ name: 'Visual baseline not applicable', conclusion: 'success' }]
  assert.deepEqual(validateChildOutcomes(validMarker, { ...expected, visualNotApplicable: true }).jobs, REQUIRED_JOB_NAMES)
  assert.throws(() => validateChildOutcomes(validMarker, expected), /not independently verified/)
  assert.throws(() => validateChildOutcomes(validationRuns(), { ...expected, visualNotApplicable: true }), /marker is absent/)

  const duplicateMarker = structuredClone(validMarker)
  duplicateMarker[1].jobs[0].steps.push({ name: 'Visual baseline not applicable', conclusion: 'success' })
  assert.throws(
    () => validateChildOutcomes(duplicateMarker, { ...expected, visualNotApplicable: true }),
    /marker is invalid/,
  )
  const failedMarker = structuredClone(validMarker)
  failedMarker[1].jobs[0].steps[0].conclusion = 'failure'
  assert.throws(
    () => validateChildOutcomes(failedMarker, { ...expected, visualNotApplicable: true }),
    /marker is invalid/,
  )
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

test('changed supporting requirements cite only current Rule IDs', () => {
  const ruleState = {
    currentRuleIds: ['SF-005', 'SW-001', 'SW-002', 'SW-004'],
    retiredRuleIds: ['SF-001', 'SW-003'],
  }
  assert.equal(validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/current.md', source: 'Apply `SF-005` and `SW-001`-`SW-002`.' },
  ], ruleState), true)
  assert.throws(() => validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/retired.md', source: 'Apply `SF-001`.' },
  ], ruleState), /retired Rule ID SF-001/)
  assert.throws(() => validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/unknown.md', source: 'Apply `SF-999`.' },
  ], ruleState), /unknown Rule ID SF-999/)
  assert.throws(() => validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/range.md', source: 'Apply `SW-002`-`SW-004`.' },
  ], ruleState), /retired Rule ID SW-003/)
  assert.throws(() => validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/descending.md', source: 'Apply `SW-004`-`SW-002`.' },
  ], ruleState), /descending Rule ID range SW-004 to SW-002/)
  assert.equal(validateSupportingRequirementRuleIds([
    { path: 'docs/brainstorms/list.md', source: 'Apply:\n- `SW-002`\n- `SW-004`' },
  ], ruleState), true)
  assert.equal(validateSupportingRequirementRuleIds([
    { path: 'docs/solutions/history.md', source: 'Historical `SF-001`.' },
    { path: 'docs/brainstorms/deleted.md', source: null },
  ], ruleState), true)
})

test('AE6 frozen roster and finalization fail until exact complete recovery state exists', () => {
  const roster = Array.from({ length: 38 }, (_, index) => ({
    id: `agent${String(index + 1).padStart(2, '0')}`,
    name: `Agent ${String(index + 1).padStart(2, '0')}`,
  }))
  const names = roster.map(({ name }) => name)
  assert.equal(validateFrozenRoster(roster, [...names].reverse(), roster), true)
  assert.equal(validateFrozenRoster([...roster, { id: 'newAgent', name: 'New Agent' }], [...names].reverse(), roster), true)
  assert.throws(() => validateFrozenRoster([
    ...roster.slice(1), { id: 'newAgent', name: roster[0].name },
  ], names, roster), /exactly cover/)
  assert.throws(() => validateFrozenRoster([
    { ...roster[0], name: 'Renamed Agent' }, ...roster.slice(1), { id: 'newAgent', name: roster[0].name },
  ], names, roster), /exactly cover/)
  assert.throws(() => validateFrozenRoster([
    ...roster, { id: roster[0].id, name: 'New Agent' },
  ], names, roster), /duplicates/)
  assert.throws(() => validateFrozenRoster([
    ...roster, { id: 'newAgent', name: roster[0].name },
  ], names, roster), /duplicates/)
  assert.throws(() => validateFrozenRoster([
    { ...roster[0], name: ` ${roster[0].name}` }, ...roster.slice(1),
  ], names, roster), /invalid identity/)
  assert.throws(() => validateFrozenRoster(roster, names.slice(1), roster), /exactly cover/)
  assert.deepEqual(parseAgentRoster(`export const ADMITTED_AGENTS = [
    // { id: 'forged', name: 'Forged Agent' },
    { id: 'actual', name: 'Actual Agent' },
  ]\n`), [{ id: 'actual', name: 'Actual Agent' }])
  assert.throws(() => parseAgentRoster(`export const ADMITTED_AGENTS = [
    { id: 'actual', name: 'Actual Agent', ...replacement },
  ]\n`), /non-literal identity/)
  assert.throws(() => parseAgentRoster(`export const ADMITTED_AGENTS = [
    { id: 'actual', name: 'Actual Agent', ['id']: 'replacement' },
  ]\n`), /non-literal identity/)
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

test('trusted governance reacts to mutable evidence without redundant PR lifecycle dispatches', () => {
  const workflow = `name: Trusted Governance Dispatcher

on:
  pull_request_target:
    types: [edited]
  issue_comment:
    types: [created, edited, deleted]
  workflow_run:
    workflows: [PR Validation, Visual Baseline Validation, Review Signal]
    types: [completed]
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      pr_number:
        description: Optional open protected PR number; blank revalidates all.
        required: false
        type: string

permissions:
  contents: read
`
  assert.equal(validateTrustedWorkflowEvents(workflow), true)
  assert.equal(validateTrustedWorkflowEvents(workflow.replace(
    'description: Optional open protected PR number; blank revalidates all.',
    'description: Revalidate one protected pull request, or all when blank.',
  )), true)
  assert.throws(
    () => validateTrustedWorkflowEvents(workflow.replace(
      '        required: false',
      '        description: Extra ignored-looking copy.\n        required: false',
    )),
    /bounded direct event surface/,
  )
  assert.throws(
    () => validateTrustedWorkflowEvents(workflow.replace('types: [edited]', 'types: [opened, edited, synchronize]')),
    /bounded direct event surface/,
  )
  assert.throws(
    () => validateTrustedWorkflowEvents(workflow.replace('Visual Baseline Validation, Review Signal]', 'Visual Baseline Validation]')),
    /bounded direct event surface/,
  )
  assert.throws(
    () => validateTrustedWorkflowEvents(workflow.replace('  pull_request_target:\n    types: [edited]\n', '')),
    /bounded direct event surface/,
  )
})

test('review changes use a permissionless skipped-job relay', () => {
  const workflow = `name: Review Signal

on:
  pull_request_review:
    types: [submitted, edited, dismissed]

permissions: {}

jobs:
  signal:
    name: Review Signal Event
    if: \${{ false }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "The skipped job preserves a default-branch review event signal without allocating a runner."
`
  assert.equal(validateReviewSignalWorkflow(workflow), true)
  assert.equal(validateReviewSignalWorkflow(workflow.replace(
    'The skipped job preserves a default-branch review event signal without allocating a runner.',
    'Review changes are relayed without runner allocation.',
  )), true)
  assert.equal(validateReviewSignalWorkflow(workflow.replace('name: Review Signal Event', 'name: Review Relay Event')), true)
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace(
      '    if: \${{ false }}',
      '    name: Extra ignored-looking copy\n    if: \${{ false }}',
    )),
    /permissionless skipped-job relay/,
  )
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace('name: Review Signal', 'name: Renamed Signal')),
    /permissionless skipped-job relay/,
  )
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace(/\s+steps:\n\s+- run:.*\n/, '\n')),
    /permissionless skipped-job relay/,
  )
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace('      - run:', '  - run:')),
    /permissionless skipped-job relay/,
  )
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace('permissions: {}', 'permissions:\n  statuses: write')),
    /permissionless skipped-job relay/,
  )
  assert.throws(
    () => validateReviewSignalWorkflow(workflow.replace('if: \${{ false }}', 'if: \${{ always() }}')),
    /permissionless skipped-job relay/,
  )
})
