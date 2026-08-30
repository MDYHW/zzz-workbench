import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import {
  filterRelationshipRows,
  formatRelationshipRows,
  inspectRelationshipDirectory,
  inspectRelationshipSource,
  parseArguments,
  profileRelationshipCoverage,
} from './inspect-relationship-topology.mjs'

const SCRIPT = path.resolve('scripts/governance/inspect-relationship-topology.mjs')

function rowFor(source) {
  const rows = inspectRelationshipSource(`const source = {}; const relationship = ${source}`, 'fixture.ts')
  assert.equal(rows.length, 1)
  return rows[0]
}

test('relationship topology inspection classifies every current derived family', () => {
  const cases = [
    ["{ kind: 'linear', source, basis: { statId: 'atk', surface: 'initial' }, outputs: [{ emission: { kind: 'stat' } }] }", 'ordinary', 'stat', 'initial', ['stat']],
    ["{ kind: 'gauge', source, basis: { statId: 'atk', surface: 'initial' }, outputs: [{ emission: { kind: 'provider' } }] }", 'ordinary', 'stat', 'initial', ['gauge', 'provider']],
    ["{ kind: 'post-delivery-linear', source, basis: { statId: 'critDmg', surface: 'fully' }, outputs: [{ emission: { kind: 'provider' } }] }", 'post-delivery', 'stat', 'fully', ['provider']],
    ["{ kind: 'post-delivery-gauge', source, basis: { statId: 'anomalyProficiency', surface: 'fully' }, outputs: [{ emission: { kind: 'stat' } }] }", 'post-delivery', 'stat', 'fully', ['gauge', 'stat']],
    ["{ kind: 'threshold-operation', source, basis: { statId: 'impact' } }", 'completed-stat', 'stat', 'combat/fully', ['gauge', 'operation']],
    ["{ kind: 'projection-gauge', source, metricId: 'dmgBonus' }", 'terminal', 'metric', 'fully', ['gauge']],
    ["{ kind: 'post-delivery-stat-modifier-gauge', source, basis: { statId: 'critRate', surface: 'fully' }, output: { value: { kind: 'linear' } } }", 'post-delivery', 'stat', 'fully', ['gauge', 'modifier']],
    ["{ kind: 'post-delivery-metric-stat-gauge', source, basis: { metricId: 'sheerForce', surface: 'fully' }, output: { statId: 'atk' } }", 'post-delivery', 'metric', 'fully', ['gauge', 'stat']],
    ["{ kind: 'surface-stat-derived-metric', source, metricId: 'sheerForce', terms: [{ statId: 'atk' }] }", 'terminal', 'stat', 'each', ['metric']],
  ]
  for (const [source, stage, basis, surface, outputs] of cases) {
    assert.deepEqual(
      (({ file, line, ...topology }) => topology)(rowFor(source)),
      { kind: /kind: '([^']+)'/.exec(source)[1], stage, basis, surface, outputs },
    )
  }
})

test('nested transform discriminators are not reported as relationship declarations', () => {
  const rows = inspectRelationshipSource(`
    const source = {}
    const relationship = {
      kind: 'post-delivery-stat-modifier-gauge', source,
      basis: { statId: 'critRate', surface: 'fully' },
      output: { value: { kind: 'linear' } },
    }
  `)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].kind, 'post-delivery-stat-modifier-gauge')
})

test('topology coverage fails closed when the ProfileRelationship union changes', () => {
  const source = readFileSync('src/workbench/calculation/relationships.ts', 'utf8')
  const coverage = profileRelationshipCoverage(source)
  assert.deepEqual(coverage.missing, [])
  assert.deepEqual(coverage.unclassified, [])
  assert.deepEqual(coverage.kinds, coverage.expected)
})

test('relationship topology filters by shape rather than Agent or equipment identity', () => {
  const rows = [
    { stage: 'post-delivery', basis: 'stat', outputs: ['stat'], kind: 'post-delivery-gauge' },
    { stage: 'post-delivery', basis: 'stat', outputs: ['provider'], kind: 'post-delivery-linear' },
    { stage: 'ordinary', basis: 'stat', outputs: ['stat'], kind: 'linear' },
  ]
  assert.deepEqual(
    filterRelationshipRows(rows, { stage: 'post-delivery', output: 'stat' }),
    [rows[0]],
  )
})

test('current source projection retrieves post-delivery output topologies without named content', async () => {
  const root = path.resolve('src/workbench/content')
  const rows = await inspectRelationshipDirectory(root)

  assert.ok(rows.some((row) => (
    row.kind === 'post-delivery-gauge'
    && row.basis === 'stat'
    && row.outputs.includes('stat')
  )))
  assert.ok(rows.some((row) => (
    row.kind === 'post-delivery-linear'
    && row.basis === 'stat'
    && row.outputs.includes('provider')
  )))
})

test('formatted projection warns that generated discovery is not semantic proof', () => {
  const output = formatRelationshipRows([])
  assert.match(output, /inspect each returned consumer/)
  assert.match(output, /no empty result proves absence/i)
})

test('CLI accepts split and inline filters and rejects malformed invocations', () => {
  const split = spawnSync(process.execPath, [SCRIPT, '--stage', 'post-delivery', '--output', 'stat'], { encoding: 'utf8' })
  assert.equal(split.status, 0)
  assert.match(split.stdout, /post-delivery .* post-delivery-gauge/)

  const inline = spawnSync(process.execPath, [SCRIPT, '--kind=projection-gauge', '--basis=metric'], { encoding: 'utf8' })
  assert.equal(inline.status, 0)
  assert.match(inline.stdout, /terminal \| metric \| fully \| gauge \| projection-gauge/)

  for (const [arguments_, error] of [
    [['value'], /Unexpected argument/],
    [['--unknown', 'value'], /Unknown option/],
    [['--stage'], /Missing value/],
    [['--root', 'missing-relationship-root'], /ENOENT/],
  ]) {
    const result = spawnSync(process.execPath, [SCRIPT, ...arguments_], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, error)
  }
})

test('argument parser preserves independent filters and custom roots', () => {
  assert.deepEqual(
    parseArguments(['--root=custom', '--stage', 'terminal', '--basis=metric', '--output', 'gauge']),
    { root: 'custom', filters: { stage: 'terminal', basis: 'metric', output: 'gauge' } },
  )
})
