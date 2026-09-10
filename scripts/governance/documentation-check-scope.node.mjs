import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  isDocumentationCheckScope,
  parseRawDocumentationDiff,
  runDocumentationCheckScope,
} from './documentation-check-scope.mjs'

const BASE = '1'.repeat(40)
const HEAD = '2'.repeat(40)

function rawRecord(filePath, {
  status = 'M',
  oldMode = status === 'A' ? '000000' : '100644',
  newMode = status === 'D' ? '000000' : '100644',
  oldSha = oldMode === '000000' ? '0'.repeat(40) : BASE,
  newSha = newMode === '000000' ? '0'.repeat(40) : HEAD,
} = {}) {
  return `:${oldMode} ${newMode} ${oldSha} ${newSha} ${status}\0${filePath}\0`
}

function execute(raw, options = {}) {
  const calls = []
  const writes = []
  const result = runDocumentationCheckScope({
    baseSha: options.baseSha ?? BASE,
    headSha: options.headSha ?? HEAD,
    environmentFile: options.environmentFile ?? 'github-env',
    execute(command, args, settings) {
      calls.push({ command, args, settings })
      return raw
    },
    append(filePath, value) {
      writes.push({ filePath, value })
    },
  })
  return { calls, writes, result }
}

test('documentation scope accepts known regular supporting, owner, and ACR Markdown', () => {
  const raw = [
    rawRecord('docs/plans/added.md', { status: 'A' }),
    rawRecord('docs/solutions/deleted.md', { status: 'D' }),
    rawRecord('docs/audits/notes.md'),
    rawRecord('docs/setup-workbench-product-contract.md'),
    rawRecord('docs/authority-changes/2026-09-10-001-example.md'),
  ].join('')
  const entries = parseRawDocumentationDiff(raw)
  assert.equal(isDocumentationCheckScope(entries), true)
  const execution = execute(raw)
  assert.equal(execution.result, true)
  assert.deepEqual(execution.calls, [{
    command: 'git',
    args: [
      '-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`,
      'diff', '--raw', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', '--abbrev=40',
      BASE, HEAD, '--',
    ],
    settings: { cwd: process.cwd(), encoding: 'utf8' },
  }])
  assert.deepEqual(execution.writes, [{
    filePath: 'github-env',
    value: 'DOCUMENTATION_CHECKS_NOT_APPLICABLE=true\n',
  }])
})

test('documentation scope rejects governance, config, runtime, test, asset, unknown, and mixed paths', () => {
  for (const filePath of [
    'AGENTS.md',
    'CONTRIBUTING.md',
    '.github/pull_request_template.md',
    'docs/authority-changes/README.md',
    'docs/audits/2026-08-15-existing-vertical-recovery.md',
    'docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md',
    'docs/plans/2026-08-15-003-fix-authority-governance-recovery-plan.md',
    'package.json',
    'src/workbench/App.tsx',
    'src/workbench/App.test.tsx',
    'src/assets/agents/example.webp',
    'docs/example.md',
    'docs/plans/example.txt',
  ]) {
    assert.equal(isDocumentationCheckScope(parseRawDocumentationDiff(rawRecord(filePath))), false, filePath)
  }
  assert.equal(isDocumentationCheckScope(parseRawDocumentationDiff(
    rawRecord('docs/plans/example.md') + rawRecord('src/workbench/App.tsx'),
  )), false)
})

test('raw and trusted tree classifiers agree for additions, deletions, modes, and types', () => {
  const cases = [
    rawRecord('docs/brainstorms/added.md', { status: 'A' }),
    rawRecord('docs/authority-changes/deleted.md', { status: 'D' }),
    rawRecord('docs/workbench-ui-design-rules.md'),
    rawRecord('docs/plans/executable.md', { oldMode: '100755', newMode: '100755' }),
    rawRecord('docs/plans/symlink.md', { oldMode: '120000', newMode: '120000' }),
    rawRecord('docs/plans/submodule.md', { oldMode: '160000', newMode: '160000' }),
    rawRecord('docs/plans/type-change.md', { status: 'T', newMode: '120000' }),
    rawRecord('scripts/governance/documentation-check-scope.mjs'),
  ]
  for (const raw of cases) {
    const entries = parseRawDocumentationDiff(raw)
    assert.equal(execute(raw).result, isDocumentationCheckScope(entries))
  }
})

test('raw parser rejects malformed, duplicate, or inconsistent diff records', () => {
  for (const raw of [
    '',
    rawRecord('docs/plans/example.md').slice(0, -1),
    `:100644 100644 ${BASE} ${HEAD} M\0`,
    `100644 100644 ${BASE} ${HEAD} M\0docs/plans/example.md\0`,
    `:100600 100644 ${BASE} ${HEAD} M\0docs/plans/example.md\0`,
    `:100644 100644 ${'g'.repeat(40)} ${HEAD} M\0docs/plans/example.md\0`,
    rawRecord('docs/plans/example.md', { status: 'A', oldMode: '100644' }),
    rawRecord('docs/plans/example.md', { status: 'D', newMode: '100644' }),
    rawRecord('docs/plans/example.md', { status: 'M', oldMode: '000000' }),
    rawRecord('docs/plans/example.md', { status: 'T' }),
    rawRecord('docs/plans/example.md', { oldSha: BASE, newSha: BASE }),
    rawRecord('docs/plans/example.md') + rawRecord('docs/plans/example.md'),
    rawRecord("docs/plans/control\n.md"),
    `:100644 100644 ${BASE} ${HEAD} X\0docs/plans/example.md\0`,
  ]) assert.throws(() => parseRawDocumentationDiff(raw), /Documentation check (?:diff|path)/)
})

test('scope runner rejects invalid event identity and unavailable output', () => {
  for (const [baseSha, headSha] of [['', HEAD], [BASE, 'short'], ['A'.repeat(40), HEAD]]) {
    assert.throws(() => execute(rawRecord('docs/plans/example.md'), { baseSha, headSha }), /commit identity/)
  }
  assert.throws(
    () => execute(rawRecord('docs/plans/example.md'), { environmentFile: '' }),
    /environment file/,
  )
})

test('scope reads exact commits under container ownership without global or wildcard trust', () => {
  const tempRoot = realpathSync(tmpdir())
  const fixture = mkdtempSync(path.join(tempRoot, 'documentation-scope-'))
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' }
  const git = (...args) => execFileSync('git', args, { cwd: fixture, env, encoding: 'utf8', stdio: 'pipe' }).trim()
  try {
    git('init', '--quiet')
    mkdirSync(path.join(fixture, 'docs/plans'), { recursive: true })
    const document = path.join(fixture, 'docs/plans/example.md')
    const commit = (message) => {
      git('add', '--', 'docs/plans/example.md')
      git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', message)
      return git('rev-parse', 'HEAD')
    }
    writeFileSync(document, 'Before\n')
    const baseSha = commit('base')
    writeFileSync(document, 'After\n')
    const headSha = commit('head')
    const containerEnv = { ...env, GIT_TEST_ASSUME_DIFFERENT_OWNER: '1' }
    assert.throws(() => execFileSync('git', ['diff', '--raw', baseSha, headSha, '--'], {
      cwd: fixture, env: containerEnv, stdio: 'pipe',
    }), /Could not access|dubious ownership/)
    const writes = []
    assert.equal(runDocumentationCheckScope({
      baseSha, headSha, cwd: fixture, environmentFile: 'github-env',
      execute: (command, args, options) => execFileSync(command, args, { ...options, env: containerEnv, stdio: 'pipe' }),
      append: (_file, value) => writes.push(value),
    }), true)
    assert.deepEqual(writes, ['DOCUMENTATION_CHECKS_NOT_APPLICABLE=true\n'])
    assert.equal(git('config', '--local', '--list').includes('safe.directory='), false)
  } finally {
    assert.equal(path.dirname(fixture), tempRoot)
    assert.ok(path.basename(fixture).startsWith('documentation-scope-'))
    rmSync(fixture, { recursive: true, force: true })
  }
})
