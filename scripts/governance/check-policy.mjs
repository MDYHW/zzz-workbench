import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAst } from 'rolldown/parseAst'

export const PRODUCT_OWNER = 'Min-DongYoung'
export const REVIEW_APP_AUTHOR = 'zzz-workbench-agent-mdy[bot]'
export const EVIDENCE_MARKER = '<!-- zzz-workbench:authority-review:v1 -->'
export const FROZEN_ROSTER = Object.freeze([
  Object.freeze({ id: 'yixuan', name: 'Yixuan' }),
  Object.freeze({ id: 'dialyn', name: 'Dialyn' }),
  Object.freeze({ id: 'lucia', name: 'Lucia' }),
  Object.freeze({ id: 'anbySoldier0', name: 'Anby: Soldier 0' }),
  Object.freeze({ id: 'trigger', name: 'Trigger' }),
  Object.freeze({ id: 'astraYao', name: 'Astra Yao' }),
  Object.freeze({ id: 'seed', name: 'Seed' }),
  Object.freeze({ id: 'cissia', name: 'Cissia' }),
  Object.freeze({ id: 'evelyn', name: 'Evelyn' }),
  Object.freeze({ id: 'corin', name: 'Corin' }),
  Object.freeze({ id: 'lycaon', name: 'Lycaon' }),
  Object.freeze({ id: 'yidhari', name: 'Yidhari' }),
  Object.freeze({ id: 'manato', name: 'Manato' }),
  Object.freeze({ id: 'hugo', name: 'Hugo' }),
  Object.freeze({ id: 'juFufu', name: 'Ju Fufu' }),
  Object.freeze({ id: 'panYinhu', name: 'Pan Yinhu' }),
  Object.freeze({ id: 'banyue', name: 'Banyue' }),
  Object.freeze({ id: 'starlightBilly', name: 'Starlight Billy' }),
  Object.freeze({ id: 'ellen', name: 'Ellen' }),
  Object.freeze({ id: 'soukaku', name: 'Soukaku' }),
  Object.freeze({ id: 'soldier11', name: 'Soldier 11' }),
  Object.freeze({ id: 'lighter', name: 'Lighter' }),
  Object.freeze({ id: 'lucy', name: 'Lucy' }),
  Object.freeze({ id: 'zhuYuan', name: 'Zhu Yuan' }),
  Object.freeze({ id: 'nicole', name: 'Nicole' }),
  Object.freeze({ id: 'orphie', name: 'Orphie & Magus' }),
  Object.freeze({ id: 'pulchra', name: 'Pulchra' }),
  Object.freeze({ id: 'harumasa', name: 'Asaba Harumasa' }),
  Object.freeze({ id: 'qingyi', name: 'Qingyi' }),
  Object.freeze({ id: 'nekomata', name: 'Nekomata' }),
  Object.freeze({ id: 'billy', name: 'Billy Kid' }),
  Object.freeze({ id: 'ben', name: 'Ben Bigger' }),
  Object.freeze({ id: 'koleda', name: 'Koleda Belobog' }),
  Object.freeze({ id: 'anby', name: 'Anby Demara' }),
  Object.freeze({ id: 'caesar', name: 'Caesar King' }),
  Object.freeze({ id: 'yeShunguang', name: 'Ye Shunguang' }),
  Object.freeze({ id: 'zhao', name: 'Zhao' }),
  Object.freeze({ id: 'grace', name: 'Grace Howard' }),
])
export const FROZEN_ROSTER_SIZE = FROZEN_ROSTER.length

export const REQUIRED_CONTEXTS = Object.freeze([
  Object.freeze({ name: 'Trusted Governance', kind: 'status', run: 'trusted' }),
  Object.freeze({ name: 'Protected Approval', kind: 'status', run: 'trusted' }),
  Object.freeze({ name: 'Behavior Tests', kind: 'check', run: 'validation' }),
  Object.freeze({ name: 'Type Check', kind: 'check', run: 'validation' }),
  Object.freeze({ name: 'Production Build', kind: 'check', run: 'validation' }),
  Object.freeze({ name: 'Visual Baseline', kind: 'check', run: 'visual' }),
])

export const REQUIRED_WORKFLOWS = Object.freeze([
  Object.freeze({
    run: 'validation',
    path: '.github/workflows/pr-validation.yml',
    idField: 'prValidationWorkflowId',
    names: Object.freeze(REQUIRED_CONTEXTS.filter(({ kind, run }) => kind === 'check' && run === 'validation')
      .map(({ name }) => name)),
  }),
  Object.freeze({
    run: 'visual',
    path: '.github/workflows/visual-baseline.yml',
    idField: 'visualWorkflowId',
    names: Object.freeze(REQUIRED_CONTEXTS.filter(({ kind, run }) => kind === 'check' && run === 'visual')
      .map(({ name }) => name)),
  }),
])

export const REQUIRED_JOB_NAMES = Object.freeze(
  REQUIRED_CONTEXTS.filter(({ kind }) => kind === 'check').map(({ name }) => name),
)

export const REQUIRED_CONTEXT_NAMES = Object.freeze(REQUIRED_CONTEXTS.map(({ name }) => name))

const SHA = /^[0-9a-f]{40}$/
const ACTION_RUN_TARGET = /^https:\/\/github\.com\/Min-DongYoung\/zzz-workbench\/actions\/runs\/[1-9][0-9]*$/
const GOVERNANCE_DESCRIPTION = /^pr=([1-9][0-9]*) base=([0-9a-f]{40}) runs=([1-9][0-9]*),([1-9][0-9]*)$/
const GOVERNANCE_TARGET = /^https:\/\/github\.com\/Min-DongYoung\/zzz-workbench\/actions\/runs\/[1-9][0-9]*\?pr=([1-9][0-9]*)&base=([0-9a-f]{40})&run1=([1-9][0-9]*)&run2=([1-9][0-9]*)$/
const DIGEST = /^sha256:[0-9a-f]{64}$/
const RULE_ID = /^(?:SW|SF|UI|FM|GV|GOV)-\d{3}$/
const CONSUMER = /^[^\s#]+#[^\s#].*$/
const ACR_STATUS = new Set(['proposed', 'accepted', 'rejected', 'superseded'])

const PERMANENT_OWNERS = new Set([
  'docs/setup-workbench-product-contract.md',
  'docs/source-fact-boundary.md',
  'docs/workbench-ui-design-rules.md',
  'docs/zzz-formula-mechanics.md',
  'docs/zzz-game-vocabulary.md',
])

const PERMANENT_OWNER_BY_RULE_PREFIX = new Map([
  ['SW', 'docs/setup-workbench-product-contract.md'],
  ['SF', 'docs/source-fact-boundary.md'],
  ['UI', 'docs/workbench-ui-design-rules.md'],
  ['FM', 'docs/zzz-formula-mechanics.md'],
  ['GV', 'docs/zzz-game-vocabulary.md'],
])

const RULE_PREFIX_BY_PERMANENT_OWNER = new Map(
  [...PERMANENT_OWNER_BY_RULE_PREFIX].map(([prefix, owner]) => [owner, prefix]),
)

const VISUAL_PATHS = new Set([
  'src/components/agentPortraits.ts',
  'src/app.css',
  'playwright.config.ts',
  'playwright.config.js',
])

const GOVERNANCE_FILES = new Set([
  '.gitattributes',
  '.gitignore',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'package.json',
  'package-lock.json',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'docs/authority-changes/README.md',
  'docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md',
  'docs/plans/2026-08-15-003-fix-authority-governance-recovery-plan.md',
  'docs/postmortems/2026-08-15-authority-governance-drift.md',
])

const LOCAL_STRUCTURAL_KINDS = new Set([
  'agent-id-union-addition',
  'agent-summary-addition',
  'agent-owned-record-entry',
  'agent-import-and-switch-addition',
  'agent-calculation-module-addition',
  'agent-asset-addition',
  'test-additions-only',
  'equipment-id-addition',
  'equipment-fact-addition',
  'equipment-choice-addition',
  'equipment-asset-addition',
  'agent-equipment-membership-addition',
])

const STRICT_AGENT_SHARED_PATHS = new Map([
  ['src/workbench/content/types.ts', new Set(['agent-id-union-addition', 'equipment-id-addition'])],
  ['src/workbench/content/agents.ts', new Set(['agent-summary-addition'])],
  ['src/workbench/content/engines.ts', new Set(['equipment-fact-addition', 'equipment-choice-addition'])],
  ['src/workbench/content/discs.ts', new Set(['equipment-fact-addition', 'equipment-choice-addition'])],
  ['src/workbench/content/agent-setup-candidates.ts', new Set(['agent-equipment-membership-addition'])],
  ['src/workbench/content/setup-options.ts', new Set(['agent-owned-record-entry'])],
  ['src/workbench/content/representatives.ts', new Set(['agent-owned-record-entry'])],
  ['src/workbench/content/retained-values.ts', new Set(['agent-owned-record-entry'])],
  ['src/workbench/calculate.ts', new Set(['agent-import-and-switch-addition'])],
  ['src/workbench/provider-effects.ts', new Set(['agent-import-and-switch-addition'])],
])

const TRACE_FIELDS = Object.freeze([
  'Change classification',
  'Protected reason',
  'Owning Rule IDs',
  'Exact consumers',
  'Nearest similar current case',
  'Contrasting current case',
  'Candidate or prepared consequence',
  'Lifecycle',
  'Visible Setup or Result consequence',
  'Behavior verification',
  'Prerequisites',
])

export class PolicyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PolicyError'
  }
}

function fail(message) {
  throw new PolicyError(message)
}

function normalizePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) fail('Path is invalid.')
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '')
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) fail('Path is invalid.')
  return normalized
}

function sortedUnique(values, label) {
  if (!Array.isArray(values)) fail(`${label} must be an array.`)
  const normalized = values.map((value) => {
    if (typeof value !== 'string' || value.trim().length === 0) fail(`${label} contains an invalid value.`)
    return value.trim()
  })
  if (new Set(normalized).size !== normalized.length) fail(`${label} contains duplicates.`)
  return normalized.sort()
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function assertSha(value, label) {
  if (!SHA.test(value ?? '')) fail(`${label} is invalid.`)
  return value
}

export function isActionRunTargetUrl(value) {
  return ACTION_RUN_TARGET.test(value ?? '')
}

export function createGovernanceStatusBinding({ prNumber, baseSha, runs, actionRunUrl }) {
  if (!Number.isInteger(prNumber) || prNumber <= 0) fail('Governance PR identity is invalid.')
  assertSha(baseSha, 'Governance base SHA')
  const runIds = [runs?.validation, runs?.visual]
  if (runIds.length !== 2 || new Set(runIds).size !== 2
    || runIds.some((id) => !Number.isInteger(id) || id <= 0)) fail('Governance workflow run identities are invalid.')
  if (!isActionRunTargetUrl(actionRunUrl)) fail('Governance workflow target URL is invalid.')
  return {
    prNumber,
    baseSha,
    runs: { validation: runIds[0], visual: runIds[1] },
    description: `pr=${prNumber} base=${baseSha} runs=${runIds.join(',')}`,
    targetUrl: `${actionRunUrl}?pr=${prNumber}&base=${baseSha}&run1=${runIds[0]}&run2=${runIds[1]}`,
  }
}

export function parseGovernanceTargetBinding(value) {
  const match = GOVERNANCE_TARGET.exec(value ?? '')
  if (!match || match[3] === match[4]) return null
  return {
    prNumber: Number(match[1]),
    baseSha: match[2],
    runs: { validation: Number(match[3]), visual: Number(match[4]) },
  }
}

export function parseGovernanceStatusBinding({ description, targetUrl }) {
  const match = GOVERNANCE_DESCRIPTION.exec(description ?? '')
  const target = parseGovernanceTargetBinding(targetUrl)
  if (!match || !target || Number(match[1]) !== target.prNumber || match[2] !== target.baseSha
    || Number(match[3]) !== target.runs.validation || Number(match[4]) !== target.runs.visual) return null
  return target
}

function assertDigest(value, label) {
  if (!DIGEST.test(value ?? '')) fail(`${label} is invalid.`)
  return value
}

function normalizeTreeSide(side, label) {
  if (side === null) return null
  if (!side || typeof side !== 'object') fail(`${label} tree entry is invalid.`)
  const keys = Object.keys(side).sort()
  if (!sameStrings(keys, ['mode', 'sha', 'type'])) fail(`${label} tree entry has unexpected fields.`)
  if (!/^[0-7]{6}$/.test(side.mode ?? '')) fail(`${label} tree mode is invalid.`)
  if (!['blob', 'tree', 'commit'].includes(side.type)) fail(`${label} tree type is invalid.`)
  assertSha(side.sha, `${label} tree SHA`)
  return { mode: side.mode, type: side.type, sha: side.sha }
}

/**
 * The digest binds trusted Git tree identities, not a rendered or truncated patch.
 */
export function canonicalTreeDiff(entries) {
  if (!Array.isArray(entries) || entries.length === 0) fail('Tree diff is empty.')
  const normalized = entries.map((entry) => {
    if (!entry || typeof entry !== 'object') fail('Tree diff entry is invalid.')
    const path = normalizePath(entry.path)
    const base = normalizeTreeSide(entry.base ?? null, 'Base')
    const head = normalizeTreeSide(entry.head ?? null, 'Head')
    if (!base && !head) fail('Tree diff entry has no tree object.')
    if (base && head && base.mode === head.mode && base.type === head.type && base.sha === head.sha) {
      fail('Tree diff entry does not change.')
    }
    return { path, base, head }
  }).sort((left, right) => left.path.localeCompare(right.path, 'en'))
  if (new Set(normalized.map(({ path }) => path)).size !== normalized.length) fail('Tree diff contains duplicate paths.')
  const bytes = Buffer.from(`${JSON.stringify({ version: 1, entries: normalized })}\n`, 'utf8')
  return {
    bytes,
    digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    entries: normalized,
  }
}

export function categoryForPath(pathValue) {
  const path = normalizePath(pathValue)
  if (PERMANENT_OWNERS.has(path)) return 'permanent-owner'
  if (path === 'docs/audits/2026-08-15-existing-vertical-recovery.md') return 'audit-index'
  if (path.startsWith('docs/authority-changes/') && path !== 'docs/authority-changes/README.md') return 'acr-instance'
  if (VISUAL_PATHS.has(path) || path.startsWith('tests/visual/') || path.startsWith('src/assets/agents/')) return 'visual-baseline'
  if (GOVERNANCE_FILES.has(path) || path.startsWith('.github/') || path.startsWith('scripts/governance/') || path.startsWith('scripts/github-app/')) return 'governance'
  if (path.startsWith('docs/audits/') || path.startsWith('docs/brainstorms/') || path.startsWith('docs/plans/') || path.startsWith('docs/roadmaps/') || path.startsWith('docs/solutions/') || path.startsWith('docs/ideation/')) return 'supporting-doc'
  if (path === 'index.html' || path.startsWith('src/') || /(?:^|\/)tests?\//.test(path) || /\.test\.[cm]?[jt]sx?$/.test(path)) return 'production-test'
  return 'unknown'
}

const VISUAL_TRIGGER = [
  'on:',
  '  pull_request:',
  '    types: [opened, synchronize, reopened, ready_for_review]',
]

const VISUAL_PERMISSIONS = [
  'permissions:',
  '  contents: read',
]

const VISUAL_JOB = [
  '  visual-baseline:',
  '    name: Visual Baseline',
  '    runs-on: ubuntu-latest',
  '    container:',
  '      image: mcr.microsoft.com/playwright@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07',
  '    timeout-minutes: 15',
  '    steps:',
  '      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
  '        with:',
  '          persist-credentials: false',
  '      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
  '        with:',
  '          node-version: 24',
  '          cache: npm',
  '      - run: npm ci --ignore-scripts',
  '      - run: npm run test:visual',
  '      - name: Upload visual comparison evidence',
  '        if: ${{ always() }}',
  '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  '        with:',
  '          name: visual-baseline-${{ github.event.pull_request.number }}-${{ github.event.pull_request.head.sha }}',
  '          path: |',
  '            playwright-report/',
  '            test-results/',
  '            tests/visual/workbench-portraits.spec.ts-snapshots/',
  '          if-no-files-found: warn',
  '          retention-days: 14',
]

const VISUAL_WORKFLOW = [
  'name: Visual Baseline Validation',
  '',
  ...VISUAL_TRIGGER,
  '',
  ...VISUAL_PERMISSIONS,
  '',
  'concurrency:',
  '  group: visual-baseline-${{ github.event.pull_request.number }}',
  '  cancel-in-progress: true',
  '',
  'jobs:',
  ...VISUAL_JOB,
  '',
]

export function validateVisualWorkflow(source) {
  if (typeof source !== 'string') {
    fail('Visual workflow is not bound to the pinned screenshot comparison gate.')
  }
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  if (!sameStrings(lines, VISUAL_WORKFLOW)) {
    fail('Visual workflow is not bound to the pinned screenshot comparison gate.')
  }
  return true
}

export function evaluateChangeMatrix(paths, { visualTransaction = false } = {}) {
  const normalizedPaths = sortedUnique(paths.map(normalizePath), 'Changed paths')
  const byCategory = Object.fromEntries(normalizedPaths.map((path) => [path, categoryForPath(path)]))
  const categories = [...new Set(Object.values(byCategory))].sort()
  if (categories.includes('unknown')) fail('Unknown changed path fails closed.')
  if (categories.includes('permanent-owner') && categories.length !== 1) fail('Permanent-owner changes must be owner-only.')
  if (categories.includes('acr-instance') && categories.length !== 1) fail('Authority Change Records must be ACR-only.')
  if (categories.includes('audit-index') && categories.length !== 1) fail('Recovery audit index changes must be index-only.')
  if (categories.includes('governance') && categories.includes('production-test') && !visualTransaction) {
    fail('Governance and production changes cannot share a transaction.')
  }
  if (visualTransaction && !categories.includes('visual-baseline')) fail('Visual transaction lacks a visual baseline change.')
  return { paths: normalizedPaths, byCategory, categories }
}

function agentSlugFor(agentId) {
  return agentId.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function validateEquipmentLocality(facts, newAgentId, existingEquipmentIds) {
  const existing = new Set(existingEquipmentIds)
  const additions = facts.filter(({ kind }) => kind === 'equipment-id-addition')
  const ids = additions.flatMap(({ equipmentIds = [] }) => equipmentIds)
  if (new Set(ids).size !== ids.length || ids.some((id) => existing.has(id))) return false
  for (const id of ids) {
    const related = facts.filter(({ equipmentIds = [] }) => equipmentIds.includes(id))
    const kinds = new Set(related.map(({ kind }) => kind))
    if (!kinds.has('equipment-fact-addition') || !kinds.has('equipment-choice-addition')
      || !kinds.has('equipment-asset-addition') || !kinds.has('agent-equipment-membership-addition')) return false
    if (related.some(({ agentIds = [] }) => agentIds.some((agentId) => agentId !== newAgentId))) return false
  }
  for (const fact of facts.filter(({ kind }) => kind.startsWith('equipment-') || kind === 'agent-equipment-membership-addition')) {
    const factIds = fact.equipmentIds ?? []
    if (factIds.length === 0) return false
    if (fact.kind === 'agent-equipment-membership-addition') {
      if (factIds.some((id) => !ids.includes(id) && !existing.has(id))) return false
      continue
    }
    if (factIds.some((id) => !ids.includes(id))) return false
  }
  return true
}

/**
 * Structural facts are produced by trusted base code. An author declaration is
 * never accepted as a structural fact.
 */
export function proveAgentLocal(structuralFacts, changedPaths = undefined) {
  if (!structuralFacts || typeof structuralFacts !== 'object') return { local: false, reason: 'Missing trusted structural facts.' }
  const {
    newAgentId,
    agentSlug = agentSlugFor(newAgentId ?? ''),
    existingEquipmentIds = [],
    files,
  } = structuralFacts
  if (!/^[a-z][A-Za-z0-9]*$/.test(newAgentId ?? '') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agentSlug ?? '')) {
    return { local: false, reason: 'The new Agent identity is invalid.' }
  }
  if (!Array.isArray(files) || files.length === 0) return { local: false, reason: 'No trusted structural facts were supplied.' }
  if (files.some((fact) => !fact || !LOCAL_STRUCTURAL_KINDS.has(fact.kind) || fact.operation !== 'additive' || fact.commonChange === true)) {
    return { local: false, reason: 'A change is not a strictly additive local seam.' }
  }
  const normalized = files.map((fact) => ({
    ...fact,
    path: normalizePath(fact.path),
    agentIds: [...(fact.agentIds ?? [])],
    equipmentIds: [...(fact.equipmentIds ?? [])],
  }))
  let trustedExistingEquipmentIds
  try {
    trustedExistingEquipmentIds = sortedUnique(existingEquipmentIds, 'Existing equipment IDs')
  } catch {
    return { local: false, reason: 'Existing equipment identity facts are invalid.' }
  }
  if (changedPaths) {
    let normalizedChangedPaths
    try {
      normalizedChangedPaths = sortedUnique(changedPaths.map(normalizePath), 'Changed production paths')
    } catch {
      return { local: false, reason: 'Changed production paths are invalid.' }
    }
    const factPaths = [...new Set(normalized.map(({ path }) => path))].sort()
    if (!sameStrings(normalizedChangedPaths, factPaths)) {
      return { local: false, reason: 'Trusted structural facts do not cover every production path.' }
    }
  }
  if (normalized.some(({ agentIds }) => agentIds.length > 0 && agentIds.some((id) => id !== newAgentId))) {
    return { local: false, reason: 'A structural addition affects another Agent.' }
  }
  for (const fact of normalized) {
    if (fact.kind === 'agent-calculation-module-addition' && fact.path !== `src/workbench/calculation/agents/${agentSlug}.ts`) {
      return { local: false, reason: 'The calculation module is not owned by the new Agent.' }
    }
    if (fact.kind === 'agent-asset-addition' && !fact.path.startsWith(`src/assets/agents/${agentSlug}`)) {
      return { local: false, reason: 'An asset is not owned by the new Agent.' }
    }
    if (fact.kind === 'equipment-asset-addition' && !fact.path.startsWith('src/assets/equipment/')) {
      return { local: false, reason: 'An equipment asset path is invalid.' }
    }
    if (fact.kind === 'test-additions-only' && !/\.test\.[cm]?[jt]sx?$/.test(fact.path)) {
      return { local: false, reason: 'A test seam is invalid.' }
    }
    const allowed = STRICT_AGENT_SHARED_PATHS.get(fact.path)
    if (allowed && !allowed.has(fact.kind)) return { local: false, reason: 'A shared file changed outside its local seam.' }
    if (!allowed && !['agent-calculation-module-addition', 'agent-asset-addition', 'equipment-asset-addition', 'test-additions-only'].includes(fact.kind)) {
      return { local: false, reason: 'A shared structural path is not allowlisted.' }
    }
  }
  const requiredKinds = ['agent-id-union-addition', 'agent-summary-addition', 'agent-calculation-module-addition', 'agent-import-and-switch-addition']
  if (requiredKinds.some((kind) => !normalized.some((fact) => fact.kind === kind))) {
    return { local: false, reason: 'The new Agent registration is incomplete.' }
  }
  if (!validateEquipmentLocality(normalized, newAgentId, trustedExistingEquipmentIds)) return { local: false, reason: 'Equipment is not exclusively and completely owned by the new Agent transaction.' }
  return { local: true, reason: 'Trusted structure proves one additive Agent-local transaction.', newAgentId }
}

export function computeChangeClassification({ paths, structuralFacts, declaration, visualTransaction = false }) {
  const matrix = evaluateChangeMatrix(paths, { visualTransaction })
  const protectedCategories = new Set(['permanent-owner', 'acr-instance', 'audit-index', 'governance', 'visual-baseline'])
  let classification = matrix.categories.some((category) => protectedCategories.has(category)) ? 'protected' : 'agent-local'
  let reason = classification === 'protected' ? 'Changed paths require product-owner protection.' : 'No protected path changed.'
  if (matrix.categories.includes('production-test')) {
    const productionPaths = matrix.paths.filter((path) => categoryForPath(path) === 'production-test')
    const localProof = proveAgentLocal(structuralFacts, productionPaths)
    if (!localProof.local) {
      classification = 'protected'
      reason = localProof.reason
    } else if (classification !== 'protected') {
      reason = localProof.reason
    }
  }
  if (!['agent-local', 'protected'].includes(declaration)) fail('Declared classification is invalid.')
  if (declaration === 'protected') {
    classification = 'protected'
    reason = 'The declaration escalates the trusted classification.'
  }
  return {
    classification,
    reason,
    declarationMismatch: declaration === 'agent-local' && classification === 'protected',
    matrix,
  }
}

function requireMeaningful(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(`${label} is missing.`)
  const trimmed = value.trim()
  const text = /^`[^`\r\n]+`$/.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed
  if (/^(?:n\/?a|not applicable)$/i.test(text)) fail(`${label} needs a reason when not applicable.`)
  if (/^(?:n\/?a|not applicable)\s*[:—-]\s*$/i.test(text)) fail(`${label} has an empty not-applicable reason.`)
  return text
}

export function parseAuthorityTrace(body) {
  if (typeof body !== 'string') fail('Pull request body is missing.')
  const headings = [...body.matchAll(/^## Authority trace\s*$/gmi)]
  if (headings.length !== 1) fail('Pull request must contain exactly one Authority trace section.')
  const start = headings[0].index + headings[0][0].length
  const remainder = body.slice(start)
  const nextHeading = remainder.search(/^##\s+/m)
  const section = nextHeading >= 0 ? remainder.slice(0, nextHeading) : remainder
  const fields = {}
  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^[-*]\s+([^:]+):\s*(.*)$/)
    if (!match) continue
    const label = match[1].trim()
    if (!TRACE_FIELDS.includes(label) || Object.hasOwn(fields, label)) fail('Authority trace field is unknown or duplicated.')
    fields[label] = requireMeaningful(match[2], label)
  }
  if (TRACE_FIELDS.some((field) => !Object.hasOwn(fields, field))) fail('Authority trace is incomplete.')
  const classification = fields['Change classification']
  if (!['agent-local', 'protected'].includes(classification)) fail('Authority trace classification is invalid.')
  const unwrap = (value) => /^`[^`\r\n]+`$/.test(value.trim()) ? value.trim().slice(1, -1).trim() : value.trim()
  const ruleIds = sortedUnique(fields['Owning Rule IDs'].split(/[,;]\s*/).map(unwrap), 'Owning Rule IDs')
  const consumers = sortedUnique(fields['Exact consumers'].split(/;\s*/).map(unwrap), 'Exact consumers')
  if (ruleIds.some((id) => !RULE_ID.test(id))) fail('Authority trace contains an invalid Rule ID.')
  if (consumers.some((consumer) => !CONSUMER.test(consumer))) fail('Authority trace contains an invalid consumer reference.')
  return { fields, classification, ruleIds, consumers }
}

export function authorityTraceDigest(trace) {
  if (!trace?.fields || TRACE_FIELDS.some((field) => typeof trace.fields[field] !== 'string')) {
    fail('Authority trace cannot be digested.')
  }
  const fields = Object.fromEntries(TRACE_FIELDS.map((field) => [field, trace.fields[field]]))
  return `sha256:${createHash('sha256').update(`${JSON.stringify({ version: 1, fields })}\n`, 'utf8').digest('hex')}`
}

export function validateAuthorityTrace(trace, {
  knownRuleIds,
  computedClassification,
  changeCategories = [],
  acceptedAcrRecords = [],
  changedPaths = [],
  identifierOnlyOwnerChange = null,
}) {
  const known = new Set(knownRuleIds)
  if (trace.ruleIds.some((id) => !known.has(id))) fail('Authority trace references an unknown Rule ID.')
  if (trace.classification !== computedClassification) fail('Authority trace classification does not match trusted classification.')
  if (computedClassification === 'protected' && /^(?:n\/?a|not applicable)\s*[:—-]/i.test(trace.fields['Protected reason'])) {
    fail('Protected change lacks a protected reason.')
  }
  if (changeCategories.includes('permanent-owner')) {
    const cited = [...trace.fields.Prerequisites.matchAll(/ACR-\d{4}-\d{2}-\d{2}-\d{3}/g)].map((match) => match[0])
    const changedOwners = changedPaths.filter((filePath) => PERMANENT_OWNERS.has(filePath))
    if (identifierOnlyOwnerChange) {
      if (changedOwners.length !== 1
        || identifierOnlyOwnerChange.path !== changedOwners[0]
        || !Array.isArray(identifierOnlyOwnerChange.newRuleIds)
        || identifierOnlyOwnerChange.newRuleIds.length === 0
        || cited.length !== 0
        || !trace.ruleIds.includes('GOV-001')) {
        fail('Identifier-only owner change trace is invalid.')
      }
      return trace
    }
    const records = new Map(acceptedAcrRecords.map((record) => [record.id, record]))
    if (changedOwners.length !== 1 || cited.length === 0 || cited.some((id) => !records.has(id))) {
      fail('Permanent-owner change lacks an already-merged accepted Authority Change Record prerequisite.')
    }
    const changedOwner = changedOwners[0]
    const related = cited.map((id) => records.get(id)).some(({ ruleIds = [] }) => (
      ruleIds.some((ruleId) => trace.ruleIds.includes(ruleId)
        && PERMANENT_OWNER_BY_RULE_PREFIX.get(ruleId.split('-')[0]) === changedOwner)
    ))
    const tracedOwner = trace.ruleIds.some((ruleId) => PERMANENT_OWNER_BY_RULE_PREFIX.get(ruleId.split('-')[0]) === changedOwner)
    if (!related || !tracedOwner) fail('Authority Change Record and trace do not govern the amended permanent owner.')
  }
  return trace
}

function parseEvidenceComment(comment) {
  if (comment?.author !== REVIEW_APP_AUTHOR || typeof comment?.body !== 'string') fail('Review evidence author is invalid.')
  const markerCount = comment.body.split(EVIDENCE_MARKER).length - 1
  if (markerCount !== 1) fail('Review evidence marker is invalid.')
  const fenced = comment.body.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!fenced) fail('Review evidence JSON is missing.')
  let payload
  try {
    payload = JSON.parse(fenced[1])
  } catch {
    fail('Review evidence JSON is malformed.')
  }
  return { payload, updatedAt: comment.updatedAt ?? comment.createdAt }
}

export function validateReviewEvidence(comments, expected) {
  if (!Array.isArray(comments)) fail('Review comments are unavailable.')
  const marked = comments.filter(({ body }) => typeof body === 'string' && body.includes(EVIDENCE_MARKER))
  if (marked.length !== 1) fail('Exactly one current review evidence comment is required.')
  const { payload, updatedAt } = parseEvidenceComment(marked[0])
  if (payload?.schema !== 'zzz-workbench-authority-review/v1' || payload?.kind !== 'authority-review' || payload?.result !== 'pass') {
    fail('Review evidence schema or result is invalid.')
  }
  if (!payload.reviewerRun || typeof payload.reviewerRun.id !== 'string' || payload.reviewerRun.id.trim().length === 0
    || !Array.isArray(payload.reviewerRun.reviewers) || payload.reviewerRun.reviewers.length === 0) {
    fail('Review evidence provenance is incomplete.')
  }
  sortedUnique(payload.reviewerRun.reviewers, 'Review evidence reviewers')
  const completedAt = Date.parse(payload.reviewerRun.completedAt ?? '')
  const publishedAt = Date.parse(updatedAt ?? '')
  if (!Number.isFinite(completedAt) || !Number.isFinite(publishedAt) || completedAt > publishedAt) fail('Review evidence time is invalid.')
  const equality = [
    [payload.prNumber, expected.prNumber],
    [payload.baseSha, expected.baseSha],
    [payload.headSha, expected.headSha],
    [payload.diffDigest, expected.diffDigest],
    [payload.classification, expected.classification],
    [payload.traceDigest, expected.traceDigest],
    [payload.mechanismDigest, expected.mechanismDigest],
  ]
  if (equality.some(([left, right]) => left !== right)) fail('Review evidence is stale or targets another change.')
  assertSha(payload.baseSha, 'Review evidence base SHA')
  assertSha(payload.headSha, 'Review evidence head SHA')
  assertDigest(payload.diffDigest, 'Review evidence diff digest')
  assertDigest(payload.traceDigest, 'Review evidence trace digest')
  if (payload.mechanismDigest !== 'none') assertDigest(payload.mechanismDigest, 'Review evidence mechanism digest')
  if (!sameStrings(sortedUnique(payload.ruleIds, 'Review evidence Rule IDs'), sortedUnique(expected.ruleIds, 'Expected Rule IDs'))) fail('Review evidence Rule IDs differ.')
  if (!sameStrings(sortedUnique(payload.consumers, 'Review evidence consumers'), sortedUnique(expected.consumers, 'Expected consumers'))) fail('Review evidence consumers differ.')
  return { payload, updatedAt, completedAt }
}

export function validateProtectedApproval(reviews, { classification, headSha, evidenceUpdatedAt }) {
  if (classification === 'agent-local') return { required: false, approved: true }
  if (!Array.isArray(reviews)) fail('Pull request reviews are unavailable.')
  const ownerReviews = reviews.filter(({ author }) => author === PRODUCT_OWNER)
    .sort((left, right) => Date.parse(left.submittedAt) - Date.parse(right.submittedAt))
  const latest = ownerReviews.at(-1)
  if (!latest || latest.state !== 'APPROVED' || latest.commitId !== headSha) fail('Protected change lacks a current owner approval.')
  const submittedAt = Date.parse(latest.submittedAt ?? '')
  const reviewedAt = Date.parse(evidenceUpdatedAt ?? '')
  if (!Number.isFinite(submittedAt) || !Number.isFinite(reviewedAt)) fail('Owner approval time is invalid.')
  if (submittedAt <= reviewedAt) fail('Owner approval does not postdate the latest review evidence.')
  return { required: true, approved: true, review: latest }
}

export function validateChildOutcomes(runs, expected) {
  if (!Array.isArray(runs)) fail('Validation workflow runs are unavailable.')
  const required = REQUIRED_WORKFLOWS.map((workflow) => ({
    ...workflow,
    id: expected[workflow.idField],
  }))
  const selected = []
  for (const workflow of required) {
    const matches = runs.filter((run) => run.path === workflow.path
      && run.workflowId === workflow.id
      && run.event === 'pull_request'
      && run.prNumber === expected.prNumber
      && run.baseSha === expected.baseSha
      && run.headSha === expected.headSha
      && run.statusSha === expected.headSha)
    if (matches.length === 0) fail('A required workflow run is absent.')
    const latest = matches.sort((left, right) => Number(left.id) - Number(right.id)).at(-1)
    if (latest.status !== 'completed' || latest.conclusion !== 'success') fail('The current required workflow run did not complete successfully.')
    selected.push(latest)
  }
  const jobs = selected.flatMap(({ jobs = [] }) => jobs)
  for (const name of REQUIRED_JOB_NAMES) {
    const matches = jobs.filter((job) => job.name === name)
    if (matches.length !== 1 || matches[0].conclusion !== 'success') fail(`Required job ${name} did not finish exactly once with success.`)
  }
  return { runs: selected, jobs: REQUIRED_JOB_NAMES }
}

export function trustedDecision(input) {
  assertSha(input.baseSha, 'Current base SHA')
  assertSha(input.headSha, 'Current head SHA')
  const trace = validateAuthorityTrace(parseAuthorityTrace(input.body), {
    knownRuleIds: input.knownRuleIds,
    computedClassification: input.classification,
    changeCategories: input.changeCategories,
    acceptedAcrRecords: input.acceptedAcrRecords,
    changedPaths: input.changedPaths,
    identifierOnlyOwnerChange: input.identifierOnlyOwnerChange,
  })
  if (input.changeCategories?.includes('acr-instance')) {
    validateAcrTransaction(input.acrTransaction, {
      currentRuleIds: input.knownRuleIds,
      knownRuleIds: input.acrKnownRuleIds ?? input.knownRuleIds,
      baseRecords: input.acrBaseRecords,
    })
  }
  const evidence = validateReviewEvidence(input.comments, {
    prNumber: input.prNumber,
    baseSha: input.baseSha,
    headSha: input.headSha,
    diffDigest: input.diffDigest,
    classification: input.classification,
    traceDigest: authorityTraceDigest(trace),
    mechanismDigest: input.mechanismDigest,
    ruleIds: trace.ruleIds,
    consumers: trace.consumers,
  })
  const checks = validateChildOutcomes(input.runs, input)
  let approval
  try {
    approval = validateProtectedApproval(input.reviews, {
      classification: input.classification,
      headSha: input.headSha,
      evidenceUpdatedAt: evidence.updatedAt,
    })
  } catch (error) {
    if (!(error instanceof PolicyError)) throw error
    approval = { required: input.classification === 'protected', approved: false, error: error.message }
  }
  return {
    targetSha: input.headSha,
    statuses: {
      'Trusted Governance': 'success',
      'Protected Approval': approval.approved ? 'success' : 'failure',
    },
    trace,
    evidence,
    checks,
    approval,
  }
}

export function governanceSnapshotVersion(snapshot) {
  const comments = [...(snapshot.comments ?? [])].sort((left, right) => String(left.id ?? left.body).localeCompare(String(right.id ?? right.body)))
  const reviews = [...(snapshot.reviews ?? [])].sort((left, right) => String(left.id ?? left.submittedAt).localeCompare(String(right.id ?? right.submittedAt)))
  const runs = [...(snapshot.runs ?? [])].map((run) => ({
    ...run,
    jobs: [...(run.jobs ?? [])].sort((left, right) => String(left.id ?? left.name).localeCompare(String(right.id ?? right.name))),
  })).sort((left, right) => String(left.id ?? left.workflowId).localeCompare(String(right.id ?? right.workflowId)))
  const normalized = {
    prNumber: snapshot.prNumber,
    baseSha: snapshot.baseSha,
    headSha: snapshot.headSha,
    diffDigest: snapshot.diffDigest,
    body: snapshot.body,
    comments,
    reviews,
    runs,
  }
  return `sha256:${createHash('sha256').update(`${JSON.stringify(normalized)}\n`, 'utf8').digest('hex')}`
}

export function extractRuleIdState(ownerTexts) {
  if (!Array.isArray(ownerTexts) || ownerTexts.length !== 6) fail('Exactly five permanent owners and AGENTS are required.')
  const currentIds = []
  const retired = []
  for (const { path: rawPath, text } of ownerTexts) {
    const path = normalizePath(rawPath)
    if (!PERMANENT_OWNERS.has(path) && path !== 'AGENTS.md') fail('Rule IDs were read from a non-owner file.')
    if (typeof text !== 'string') fail('Owner text is unavailable.')
    for (const match of text.matchAll(/\*\*(?:Governance )?Rule ID:\*\*\s*`((?:SW|SF|UI|FM|GV|GOV)-\d{3})`/g)) currentIds.push(match[1])
    const heading = path === 'AGENTS.md' ? 'Retired Governance Rule IDs' : 'Retired Rule IDs'
    const start = text.search(new RegExp(`^## ${heading}$`, 'm'))
    if (start >= 0) {
      const remainder = text.slice(start).replace(/^##[^\n]*\n/, '')
      const next = remainder.search(/^##\s+/m)
      const section = next >= 0 ? remainder.slice(0, next) : remainder
      for (const match of section.matchAll(/^\s*(?:-\s*)?`?((?:SW|SF|UI|FM|GV|GOV)-\d{3})`?\s*->\s*([^:\n]+):\s*(\S.*)$/gm)) {
        retired.push({ id: match[1], successors: [...match[2].matchAll(/(?:SW|SF|UI|FM|GV|GOV)-\d{3}/g)].map((item) => item[0]) })
      }
    }
  }
  const retiredIds = retired.map(({ id }) => id)
  const knownRuleIds = [...currentIds, ...retiredIds]
  if (currentIds.length === 0 || new Set(currentIds).size !== currentIds.length) fail('Current Rule IDs are empty or duplicated.')
  if (new Set(knownRuleIds).size !== knownRuleIds.length) fail('Current and retired Rule IDs overlap or are duplicated.')
  const known = new Set(knownRuleIds)
  if (retired.some(({ successors }) => successors.some((id) => !known.has(id)))) fail('A retired Rule ID names an unknown successor.')
  return {
    currentRuleIds: currentIds.sort(),
    retiredRuleIds: retiredIds.sort(),
    knownRuleIds: knownRuleIds.sort(),
  }
}

export function extractCurrentRuleIds(ownerTexts) {
  return extractRuleIdState(ownerTexts).currentRuleIds
}

function markdownRuleHeadingInsertions(source) {
  const headings = []
  let offset = 0
  let fence = null
  let inComment = false
  for (const rawLine of source.match(/.*(?:\r\n|\n|$)/g) ?? []) {
    if (rawLine.length === 0) break
    const line = rawLine.replace(/\r?\n$/, '')
    const nextOffset = offset + rawLine.length
    if (fence) {
      const closingFence = line.match(/^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/)
      if (closingFence && closingFence[1][0] === fence.character
        && closingFence[1].length >= fence.length) fence = null
      offset = nextOffset
      continue
    }
    if (!inComment) {
      const openingFence = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/)
      if (openingFence) {
        if (openingFence[1][0] !== '`' || !openingFence[2].includes('`')) {
          fence = { character: openingFence[1][0], length: openingFence[1].length }
        }
        offset = nextOffset
        continue
      }
    }
    let cursor = 0
    let containsComment = inComment
    while (cursor < line.length) {
      if (inComment) {
        const end = line.indexOf('-->', cursor)
        if (end < 0) break
        inComment = false
        cursor = end + 3
        continue
      }
      const start = line.indexOf('<!--', cursor)
      if (start < 0) break
      containsComment = true
      inComment = true
      cursor = start + 4
    }
    if (containsComment) {
      offset = nextOffset
      continue
    }
    const headingMatch = line.match(/^(#{3,6}) ([^\r\n]+)$/)
    const blankLine = source.slice(nextOffset).match(/^\r?\n/)
    if (headingMatch && blankLine) {
      headings.push({
        level: headingMatch[1].length,
        title: headingMatch[2],
        start: offset,
        insertionOffset: nextOffset + blankLine[0].length,
      })
    }
    offset = nextOffset
  }
  return headings
}

export function proveIdentifierOnlyOwnerChange(changes, ruleState) {
  if (!Array.isArray(changes) || changes.length !== 1) return null
  const change = changes[0]
  const filePath = normalizePath(change?.path ?? '')
  const prefix = RULE_PREFIX_BY_PERMANENT_OWNER.get(filePath)
  const baseSource = change?.baseSource
  const headSource = change?.headSource
  if (!prefix || typeof baseSource !== 'string' || typeof headSource !== 'string'
    || change?.baseType !== 'blob' || change?.headType !== 'blob'
    || change?.baseMode !== '100644' || change?.headMode !== '100644') return null

  const markerPattern = /^\*\*Rule ID:\*\*\s*`((?:SW|SF|UI|FM|GV)-\d{3})`\r?\n\r?\n/gm
  const baseIds = [...baseSource.matchAll(markerPattern)].map((match) => match[1])
  const headMatches = [...headSource.matchAll(markerPattern)]
  const headIds = headMatches.map((match) => match[1])
  if (new Set(baseIds).size !== baseIds.length || new Set(headIds).size !== headIds.length) return null
  if (baseIds.some((id) => !headIds.includes(id))) return null

  const baseSet = new Set(baseIds)
  const additions = headMatches.filter((match) => !baseSet.has(match[1]))
  if (additions.length === 0 || headIds.length !== baseIds.length + additions.length) return null

  const knownIds = ruleState?.knownRuleIds
  if (!Array.isArray(knownIds) || knownIds.length === 0) return null
  const known = new Set(knownIds)
  const previousNumbers = knownIds
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => Number(id.slice(prefix.length + 1)))
  const maximum = previousNumbers.length === 0 ? 0 : Math.max(...previousNumbers)
  const additionNumbers = additions.map((match) => Number(match[1].slice(prefix.length + 1)))
  if (additions.some((match) => !match[1].startsWith(`${prefix}-`) || known.has(match[1]))
    || additionNumbers.some((number) => number <= maximum)
    || additionNumbers.some((number, index) => index > 0 && number <= additionNumbers[index - 1])) {
    return null
  }

  let stripped = headSource
  for (const match of [...additions].reverse()) {
    const start = match.index
    if (!Number.isInteger(start)) return null
    stripped = `${stripped.slice(0, start)}${stripped.slice(start + match[0].length)}`
  }
  if (stripped !== baseSource) return null

  const headings = markdownRuleHeadingInsertions(baseSource)
  const insertionByOffset = new Map(headings.map((heading) => [heading.insertionOffset, heading]))
  const usedHeadings = new Set()
  let removedBefore = 0
  for (const match of additions) {
    const insertionOffset = match.index - removedBefore
    removedBefore += match[0].length
    const heading = insertionByOffset.get(insertionOffset)
    if (!heading || usedHeadings.has(insertionOffset)
      || /^(?:stable rule identifiers?|retired (?:governance )?rule ids?)$/i.test(heading.title)
      || /^\*\*Rule ID:\*\*/.test(baseSource.slice(heading.insertionOffset))) {
      return null
    }
    usedHeadings.add(insertionOffset)
  }

  return Object.freeze({
    path: filePath,
    newRuleIds: Object.freeze(additions.map((match) => match[1])),
  })
}

export function validateSupportingRequirementRuleIds(changes, ruleState) {
  if (!Array.isArray(changes)) fail('Supporting requirement changes must be an array.')
  const current = new Set(ruleState?.currentRuleIds ?? [])
  const retired = new Set(ruleState?.retiredRuleIds ?? [])
  if (current.size === 0) fail('Current Rule IDs are unavailable for supporting requirement validation.')
  for (const change of changes) {
    const filePath = normalizePath(change?.path ?? '')
    if (!filePath.startsWith('docs/brainstorms/') || !filePath.endsWith('.md') || change.source === null) continue
    if (typeof change.source !== 'string') fail('Changed supporting requirement text is unavailable.')
    const ruleIds = new Set(change.source.match(/\b(?:SW|SF|UI|FM|GV|GOV)-\d{3}\b/g) ?? [])
    for (const match of change.source.matchAll(/\b(SW|SF|UI|FM|GV|GOV)-(\d{3})\b`?[ \t]*[-–—][ \t]*`?\b\1-(\d{3})\b/g)) {
      const [, namespace, startText, endText] = match
      const start = Number(startText)
      const end = Number(endText)
      if (start > end) fail(`Changed supporting requirement ${filePath} contains descending Rule ID range ${namespace}-${startText} to ${namespace}-${endText}.`)
      for (let value = start; value <= end; value += 1) {
        ruleIds.add(`${namespace}-${String(value).padStart(3, '0')}`)
      }
    }
    for (const ruleId of ruleIds) {
      if (retired.has(ruleId)) fail(`Changed supporting requirement ${filePath} references retired Rule ID ${ruleId}.`)
      if (!current.has(ruleId)) fail(`Changed supporting requirement ${filePath} references unknown Rule ID ${ruleId}.`)
    }
  }
  return true
}

function normalizeAgentRoster(entries, label) {
  if (!Array.isArray(entries)) fail(`${label} must be an array.`)
  const normalized = entries.map((entry) => {
    if (!entry || !/^[a-z][A-Za-z0-9]*$/.test(entry.id ?? '')
      || typeof entry.name !== 'string' || entry.name.length === 0 || entry.name !== entry.name.trim()) {
      fail(`${label} contains an invalid identity.`)
    }
    return { id: entry.id, name: entry.name }
  })
  sortedUnique(normalized.map(({ id }) => id), `${label} IDs`)
  sortedUnique(normalized.map(({ name }) => name), `${label} names`)
  return normalized
}

export function validateFrozenRoster(currentEntries, indexedNames, frozenEntries = FROZEN_ROSTER) {
  const current = normalizeAgentRoster(currentEntries, 'Current roster')
  const frozen = normalizeAgentRoster(frozenEntries, 'Frozen roster')
  const indexed = sortedUnique(indexedNames, 'Audit roster')
  if (frozen.length !== FROZEN_ROSTER_SIZE
    || indexed.length !== FROZEN_ROSTER_SIZE
    || current.length < FROZEN_ROSTER_SIZE
    || !sameStrings(frozen.map(({ name }) => name).sort(), indexed)
    || frozen.some((identity) => !current.some(({ id, name }) => id === identity.id && name === identity.name))) {
    fail('Recovery audit roster does not exactly cover the frozen 38 identities.')
  }
  return true
}

export function validateAcrStates(records) {
  if (!Array.isArray(records)) fail('Authority Change Records are unavailable.')
  const byId = new Map()
  for (const record of records) {
    if (!record?.id || !ACR_STATUS.has(record.status)) fail('Authority Change Record shape is invalid.')
    if (byId.has(record.id)) fail('Authority Change Record identity is duplicated.')
    byId.set(record.id, record)
    if (record.status === 'proposed') fail('A proposed Authority Change Record is not mergeable.')
    if (record.status === 'superseded' && (!record.supersededBy || record.supersededBy === 'none')) fail('Superseded Authority Change Record lacks its successor.')
  }
  for (const record of records) {
    if (record.status === 'superseded') {
      const successor = byId.get(record.supersededBy)
      if (record.supersededBy === record.id || successor?.status !== 'accepted' || successor?.supersedes !== record.id) {
        fail('Superseded Authority Change Record links are not reciprocal.')
      }
    }
    if (record.status === 'accepted' && record.supersedes && record.supersedes !== 'none') {
      const predecessor = byId.get(record.supersedes)
      if (predecessor?.status !== 'superseded' || predecessor?.supersededBy !== record.id) {
        fail('Accepted Authority Change Record supersession link is not reciprocal.')
      }
    }
  }
  return true
}

const ACR_SECTIONS = Object.freeze([
  'One decision',
  'Context',
  'Existing rule',
  'Proposed change',
  'Evidence',
  'Nearest current consumer',
  'Contrast',
  'Impact',
  'Approval result',
])

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) fail('Authority Change Record frontmatter is missing.')
  const values = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(\S.*)$/)
    if (!field || Object.hasOwn(values, field[1])) fail('Authority Change Record frontmatter is invalid.')
    values[field[1]] = field[2].trim()
  }
  const keys = Object.keys(values).sort()
  if (!sameStrings(keys, ['date', 'id', 'status', 'superseded_by', 'supersedes'])) {
    fail('Authority Change Record frontmatter fields are invalid.')
  }
  return values
}

export function parseAcrDocument(filePath, source, { knownRuleIds = [] } = {}) {
  const path = normalizePath(filePath)
  if (typeof source !== 'string') fail('Authority Change Record source is unavailable.')
  const frontmatter = parseFrontmatter(source)
  const idMatch = frontmatter.id.match(/^ACR-(\d{4}-\d{2}-\d{2})-(\d{3})$/)
  if (!idMatch || frontmatter.date !== idMatch[1] || !ACR_STATUS.has(frontmatter.status)) {
    fail('Authority Change Record identity or status is invalid.')
  }
  const filename = path.split('/').at(-1)
  if (!filename?.startsWith(`${idMatch[1]}-${idMatch[2]}-`) || !filename.endsWith('.md')) {
    fail('Authority Change Record filename does not match its identity.')
  }
  const sectionBodies = new Map()
  for (const section of ACR_SECTIONS) {
    const matches = [...source.matchAll(new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm'))]
    if (matches.length !== 1) fail(`Authority Change Record ${section} section is missing or duplicated.`)
    const start = matches[0].index + matches[0][0].length
    const remainder = source.slice(start)
    const next = remainder.search(/^##\s+/m)
    const body = (next >= 0 ? remainder.slice(0, next) : remainder).trim()
    if (body.length === 0) fail(`Authority Change Record ${section} section is empty.`)
    sectionBodies.set(section, body)
  }
  const existingRuleSection = sectionBodies.get('Existing rule') ?? ''
  const ruleIds = sortedUnique(
    [...existingRuleSection.matchAll(/(?:SW|SF|UI|FM|GV)-\d{3}/g)].map((match) => match[0]),
    'Authority Change Record Rule IDs',
  )
  if (ruleIds.length === 0 || ruleIds.some((id) => !knownRuleIds.includes(id))) {
    fail('Authority Change Record references an unknown permanent Rule ID.')
  }
  const approval = sectionBodies.get('Approval result') ?? ''
  if (!approval.includes(`- Product owner: \`${PRODUCT_OWNER}\``)) fail('Authority Change Record product owner is invalid.')
  const result = approval.match(/^- Result:\s*`?(pending|accepted|rejected)`?\s*$/m)?.[1]
  const decidedAt = approval.match(/^- Decided at:\s*(.*)$/m)?.[1]?.trim()
  if (['accepted', 'rejected'].includes(frontmatter.status)) {
    if (result !== frontmatter.status || !decidedAt || /^(?:none|pending)$/i.test(decidedAt)) fail('Authority Change Record outcome is inconsistent.')
  } else if (frontmatter.status === 'proposed' && result !== 'pending') {
    fail('Proposed Authority Change Record outcome is inconsistent.')
  } else if (frontmatter.status === 'superseded' && (result !== 'accepted' || !decidedAt || /^(?:none|pending)$/i.test(decidedAt))) {
    fail('Superseded Authority Change Record outcome is inconsistent.')
  }
  return {
    path,
    source,
    id: frontmatter.id,
    date: frontmatter.date,
    sequence: Number(idMatch[2]),
    status: frontmatter.status,
    ruleIds,
    supersedes: frontmatter.supersedes,
    supersededBy: frontmatter.superseded_by,
  }
}

function withoutSupersessionTransition(source) {
  return source
    .replace(/^status:\s*(?:accepted|superseded)\s*$/m, 'status: <transition>')
    .replace(/^superseded_by:\s*\S+\s*$/m, 'superseded_by: <transition>')
}

export function validateAcrTransaction(transaction, {
  knownRuleIds = [], currentRuleIds = knownRuleIds, baseRecords = [],
} = {}) {
  if (!transaction || !Array.isArray(transaction.changes) || transaction.changes.length === 0) {
    fail('Authority Change Record transaction is unavailable.')
  }
  const parsed = transaction.changes.map(({ path, baseSource = null, headSource = null }) => {
    const base = baseSource === null ? null : parseAcrDocument(path, baseSource, { knownRuleIds })
    const head = headSource === null ? null : parseAcrDocument(path, headSource, {
      knownRuleIds: base === null ? currentRuleIds : knownRuleIds,
    })
    return { path, base, head }
  })
  if (parsed.some(({ head }) => head === null)) fail('Authority Change Records cannot be deleted.')
  const additions = parsed.filter(({ base }) => base === null)
  const updates = parsed.filter(({ base }) => base !== null)
  if (additions.length !== 1 || !['accepted', 'rejected'].includes(additions[0].head.status)) {
    fail('An ACR transaction must add exactly one accepted or rejected owner outcome.')
  }
  const successor = additions[0].head
  validateAcrStates(baseRecords)
  if (baseRecords.some(({ id }) => id === successor.id)) fail('Authority Change Record identity was already allocated.')
  const allocated = baseRecords.filter(({ date }) => date === successor.date).map(({ sequence }) => sequence)
  const maximum = allocated.length === 0 ? 0 : Math.max(...allocated)
  if (successor.sequence <= maximum) fail('Authority Change Record sequence must advance monotonically for its date.')
  if (updates.length === 0) {
    if (successor.supersedes !== 'none' || successor.supersededBy !== 'none') fail('Initial Authority Change Record links are invalid.')
    return { outcome: successor.status, acceptedId: successor.status === 'accepted' ? successor.id : null }
  }
  if (updates.length !== 1 || successor.status !== 'accepted') fail('Authority Change Record update transaction is invalid.')
  const { base, head } = updates[0]
  if (base.status !== 'accepted' || head.status !== 'superseded'
    || successor.supersedes !== base.id || successor.supersededBy !== 'none'
    || head.supersededBy !== successor.id || head.supersedes !== base.supersedes
    || withoutSupersessionTransition(base.source) !== withoutSupersessionTransition(head.source)) {
    fail('Authority Change Record supersession is not reciprocal and immutable.')
  }
  return { outcome: 'accepted', acceptedId: successor.id, supersededId: base.id }
}

export function validateFinalization({ actor, candidateSha, recoveryTipSha, auditComplete, statuses }) {
  if (actor !== PRODUCT_OWNER) fail('Only the product owner may finalize recovery.')
  assertSha(candidateSha, 'Finalization candidate SHA')
  assertSha(recoveryTipSha, 'Recovery tip SHA')
  if (candidateSha !== recoveryTipSha) fail('Finalization candidate is not the current recovery tip.')
  if (auditComplete !== true) fail('Recovery audit is incomplete.')
  for (const name of REQUIRED_CONTEXT_NAMES) {
    if (statuses?.[name] !== 'success') fail(`Finalization is missing successful ${name}.`)
  }
  return true
}

export function parseAgentRoster(source) {
  let program
  try {
    program = parseAst(source, { lang: 'ts' })
  } catch {
    fail('Baseline Agent roster source is unavailable.')
  }
  const declarations = program.body.flatMap((statement) => (
    statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'VariableDeclaration'
      ? statement.declaration.declarations
      : []
  )).filter(({ id }) => id?.type === 'Identifier' && id.name === 'ADMITTED_AGENTS')
  if (declarations.length !== 1 || declarations[0].init?.type !== 'ArrayExpression') {
    fail('Baseline Agent roster source is unavailable.')
  }
  return declarations[0].init.elements.map((element) => {
    if (element?.type !== 'ObjectExpression') fail('Baseline Agent roster contains a non-literal identity.')
    if (element.properties.some((property) => property.type !== 'Property' || property.computed !== false)) {
      fail('Baseline Agent roster contains a non-literal identity.')
    }
    const readString = (key) => {
      const matches = element.properties.filter((property) => property.type === 'Property'
        && property.computed === false
        && ((property.key.type === 'Identifier' && property.key.name === key)
          || (property.key.type === 'Literal' && property.key.value === key)))
      if (matches.length !== 1 || matches[0].value?.type !== 'Literal' || typeof matches[0].value.value !== 'string') {
        fail('Baseline Agent roster contains a non-literal identity.')
      }
      return matches[0].value.value
    }
    return { id: readString('id'), name: readString('name') }
  })
}

function parseAuditNames(audit) {
  const start = audit.indexOf('## Baseline cohort coverage')
  const end = audit.indexOf('\nTotal:', start)
  if (start < 0 || end < 0) fail('Recovery audit cohort table is unavailable.')
  const names = []
  for (const line of audit.slice(start, end).split(/\r?\n/)) {
    if (!line.startsWith('|') || /^\|\s*(?:Cohort|---)/.test(line)) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length !== 7) fail('Recovery audit cohort row is malformed.')
    names.push(...cells[1].split(';').map((name) => name.trim()))
  }
  return names
}

function auditIsComplete(audit) {
  const mechanismStart = audit.indexOf('## Common-mechanism checkpoint')
  const promotionStart = audit.indexOf('## Promotion boundary')
  if (mechanismStart < 0 || promotionStart < 0) return false
  const operative = audit.slice(mechanismStart, promotionStart)
  return !/\|[^\n]*\|\s*(?:pending|invalidated)\s*\|/i.test(operative)
    && !/\|\s*—\s*\|/.test(operative)
}

export function validateTrustedWorkflowConcurrency(source) {
  const blocks = typeof source === 'string'
    ? source.match(/^concurrency:\s*\r?\n(?:^[ \t]+[^\r\n]*(?:\r?\n|$))*/gm) ?? []
    : []
  if (blocks.length !== 1
    || !/^concurrency:\s*\r?\n  group:\s+trusted-governance-dispatcher\s*\r?\n  queue:\s+max\s*(?:\r?\n)?$/.test(blocks[0])
    || /^\s*cancel-in-progress:/m.test(source)) {
    fail('Trusted workflow evaluations are not globally queued without cancellation.')
  }
  return true
}

async function walkFiles(root, relative = '') {
  const directory = path.join(root, relative)
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await walkFiles(root, child))
    else files.push(normalizePath(child))
  }
  return files
}

export async function validateRepository(root = process.cwd(), { requireCompleteAudit = false } = {}) {
  const ownerPaths = [...PERMANENT_OWNERS, 'AGENTS.md']
  const ownerTexts = await Promise.all(ownerPaths.map(async (filePath) => ({
    path: filePath,
    text: await fs.readFile(path.join(root, filePath), 'utf8'),
  })))
  const ruleState = extractRuleIdState(ownerTexts)
  const ruleIds = ruleState.currentRuleIds
  const agents = await fs.readFile(path.join(root, 'src/workbench/content/agents.ts'), 'utf8')
  const audit = await fs.readFile(path.join(root, 'docs/audits/2026-08-15-existing-vertical-recovery.md'), 'utf8')
  validateFrozenRoster(parseAgentRoster(agents), parseAuditNames(audit))

  const acrDirectory = path.join(root, 'docs/authority-changes')
  const acrFiles = (await fs.readdir(acrDirectory)).filter((file) => file.endsWith('.md') && file !== 'README.md')
  const records = []
  for (const file of acrFiles) {
    const source = await fs.readFile(path.join(acrDirectory, file), 'utf8')
    records.push(parseAcrDocument(`docs/authority-changes/${file}`, source, { knownRuleIds: ruleState.knownRuleIds }))
  }
  validateAcrStates(records)

  const files = await walkFiles(root)
  if (files.some((file) => file.toLowerCase().endsWith('.pem'))) fail('A PEM credential exists inside the repository.')
  const workflowFiles = files.filter((file) => file.startsWith('.github/workflows/') && /\.ya?ml$/.test(file))
  const actionUses = []
  const jobNames = []
  const workflowSources = new Map()
  for (const workflowFile of workflowFiles) {
    const source = await fs.readFile(path.join(root, workflowFile), 'utf8')
    workflowSources.set(workflowFile, source)
    actionUses.push(...[...source.matchAll(/^\s*-?\s*uses:\s*(\S+)\s*$/gm)].map((match) => match[1]))
    jobNames.push(...[...source.matchAll(/^\s{4}name:\s*(.+)\s*$/gm)].map((match) => match[1].trim()))
  }
  const pinned = new Set([
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  ])
  if (actionUses.some((value) => !pinned.has(value))) fail('A workflow Action is not explicitly allowlisted and immutably pinned.')
  if (new Set(jobNames).size !== jobNames.length) fail('Workflow job names are duplicated.')
  if (jobNames.some((name) => ['Trusted Governance', 'Protected Approval'].includes(name))) fail('A workflow job collides with a trusted status name.')
  const trustedWorkflow = workflowSources.get('.github/workflows/trusted-governance.yml') ?? ''
  validateTrustedWorkflowConcurrency(trustedWorkflow)
  if (!/^\s*pull_request_target:/m.test(trustedWorkflow)
    || !/^\s+statuses:\s+write\s*$/m.test(trustedWorkflow)
    || !/ref:\s+main/.test(trustedWorkflow)
    || !/persist-credentials:\s+false/.test(trustedWorkflow)
    || !/TRUSTED_BASE_SHA:\s+\$\{\{\s*steps\.trusted-base\.outputs\.sha\s*}}/.test(trustedWorkflow)
    || !/npm ci --ignore-scripts/.test(trustedWorkflow)
    || !/node scripts\/governance\/trusted-github\.mjs event/.test(trustedWorkflow)
    || /npm test|npm run build/.test(trustedWorkflow)) {
    fail('Trusted workflow does not preserve its trusted-base metadata-only boundary.')
  }
  const prWorkflow = workflowSources.get('.github/workflows/pr-validation.yml') ?? ''
  if (!/^\s*pull_request:/m.test(prWorkflow)
    || !/^\s+contents:\s+read\s*$/m.test(prWorkflow)
    || !/persist-credentials:\s+false/.test(prWorkflow)
    || !/npm run test:governance/.test(prWorkflow)) {
    fail('Pull-request validation workflow is missing a required read-only gate.')
  }
  const visualWorkflow = workflowSources.get('.github/workflows/visual-baseline.yml') ?? ''
  validateVisualWorkflow(visualWorkflow)
  const finalizationWorkflow = workflowSources.get('.github/workflows/recovery-finalization.yml') ?? ''
  if (!/^\s+actions:\s+read\s*$/m.test(finalizationWorkflow)
    || !/^\s+pull-requests:\s+read\s*$/m.test(finalizationWorkflow)
    || !/^\s+statuses:\s+read\s*$/m.test(finalizationWorkflow)
    || !/node scripts\/governance\/trusted-github\.mjs finalization/.test(finalizationWorkflow)
    || /check-policy\.mjs finalization/.test(finalizationWorkflow)) {
    fail('Recovery finalization does not verify actual remote outcomes through its read-only adapter.')
  }
  if (requireCompleteAudit && !auditIsComplete(audit)) fail('Recovery audit is incomplete.')
  return {
    ruleIds,
    knownRuleIds: ruleState.knownRuleIds,
    rosterSize: FROZEN_ROSTER_SIZE,
    auditComplete: auditIsComplete(audit),
  }
}

async function main() {
  try {
    const args = process.argv.slice(2)
    const [command, option] = args
    if (command === 'repository' && args.length <= 2 && (!option || option === '--require-complete-audit')) {
      const result = await validateRepository(process.cwd(), { requireCompleteAudit: option === '--require-complete-audit' })
      process.stdout.write(`Governance repository validation passed (${result.ruleIds.length} Rule IDs, ${result.rosterSize} frozen identities).\n`)
      return
    }
    fail('Policy command is not allowlisted.')
  } catch (error) {
    process.stderr.write(`${error instanceof PolicyError ? error.message : 'Governance repository validation failed.'}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
