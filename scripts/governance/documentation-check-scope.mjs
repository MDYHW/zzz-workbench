import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SHA = /^[0-9a-f]{40}$/
const ZERO_SHA = '0'.repeat(40)
const REGULAR_MODE = '100644'

const PERMANENT_OWNERS = new Set([
  'docs/setup-workbench-product-contract.md',
  'docs/source-fact-boundary.md',
  'docs/workbench-ui-design-rules.md',
  'docs/zzz-formula-mechanics.md',
  'docs/zzz-game-vocabulary.md',
])

const EXCLUDED_DOCUMENTATION = new Set([
  'docs/audits/2026-08-15-existing-vertical-recovery.md',
  'docs/authority-changes/README.md',
  'docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md',
  'docs/plans/2026-08-15-003-fix-authority-governance-recovery-plan.md',
])

const SUPPORTING_ROOTS = Object.freeze([
  'docs/audits/',
  'docs/brainstorms/',
  'docs/ideation/',
  'docs/plans/',
  'docs/roadmaps/',
  'docs/solutions/',
])

export const DOCUMENTATION_CHECK_SCOPE_INPUTS = Object.freeze([
  '.github/workflows/pr-validation.yml',
  '.github/workflows/visual-baseline.yml',
  'scripts/governance/documentation-check-scope.mjs',
])

function normalizePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || value.startsWith('/')
    || /[\u0000-\u001f\u007f]/.test(value)
    || value.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error('Documentation check path is invalid.')
  }
  return value
}

function isKnownDocumentationPath(pathValue) {
  const filePath = normalizePath(pathValue)
  if (!filePath.endsWith('.md') || EXCLUDED_DOCUMENTATION.has(filePath)) return false
  if (PERMANENT_OWNERS.has(filePath)) return true
  if (filePath.startsWith('docs/authority-changes/')) return true
  return SUPPORTING_ROOTS.some((root) => filePath.startsWith(root))
}

function isRegularSide(side) {
  return side?.type === 'blob' && side.mode === REGULAR_MODE && SHA.test(side.sha ?? '')
}

export function isDocumentationCheckScope(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return false
  return entries.every(({ path: filePath, base, head }) => (
    isKnownDocumentationPath(filePath)
    && Boolean(base || head)
    && [base, head].filter(Boolean).every(isRegularSide)
  ))
}

function rawSide(mode, sha) {
  if (mode === '000000') return null
  return { mode, type: mode === '160000' ? 'commit' : 'blob', sha }
}

export function parseRawDocumentationDiff(raw) {
  if (typeof raw !== 'string') throw new Error('Documentation check diff records are invalid.')
  const fields = raw.split('\0')
  if (fields.pop() !== '' || fields.length === 0 || fields.length % 2 !== 0) {
    throw new Error('Documentation check diff records are invalid.')
  }
  const entries = []
  const paths = new Set()
  for (let index = 0; index < fields.length; index += 2) {
    const header = /^:(000000|100644|100755|120000|160000) (000000|100644|100755|120000|160000) ([0-9a-f]{40}) ([0-9a-f]{40}) ([AMDT])$/.exec(fields[index])
    if (!header) throw new Error('Documentation check diff header is invalid.')
    const [, oldMode, newMode, oldSha, newSha, status] = header
    const filePath = normalizePath(fields[index + 1])
    if (paths.has(filePath)
      || (oldMode === '000000') !== (oldSha === ZERO_SHA)
      || (newMode === '000000') !== (newSha === ZERO_SHA)
      || (status === 'A' && (oldMode !== '000000' || newMode === '000000'))
      || (status === 'D' && (newMode !== '000000' || oldMode === '000000'))
      || (['M', 'T'].includes(status) && (oldMode === '000000' || newMode === '000000'))
      || (status === 'T' && oldMode === newMode)
      || (oldMode === newMode && oldSha === newSha)) {
      throw new Error('Documentation check diff pair is invalid.')
    }
    paths.add(filePath)
    entries.push({ path: filePath, base: rawSide(oldMode, oldSha), head: rawSide(newMode, newSha) })
  }
  return entries
}

export function runDocumentationCheckScope({
  baseSha,
  headSha,
  environmentFile,
  execute = execFileSync,
  append = appendFileSync,
} = {}) {
  if (!SHA.test(baseSha ?? '') || !SHA.test(headSha ?? '')) {
    throw new Error('Documentation check commit identity is invalid.')
  }
  if (typeof environmentFile !== 'string' || environmentFile.length === 0) {
    throw new Error('Documentation check environment file is unavailable.')
  }
  const raw = execute('git', [
    'diff', '--raw', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', '--abbrev=40',
    baseSha, headSha, '--',
  ], { encoding: 'utf8' })
  const notApplicable = isDocumentationCheckScope(parseRawDocumentationDiff(raw))
  append(environmentFile, `DOCUMENTATION_CHECKS_NOT_APPLICABLE=${notApplicable}\n`)
  return notApplicable
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  runDocumentationCheckScope({
    baseSha: process.env.BASE_SHA,
    headSha: process.env.HEAD_SHA,
    environmentFile: process.env.GITHUB_ENV,
  })
}
