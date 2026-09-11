import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EFFECTIVE_SUBSTAT_VALUES,
  createPreparedState,
  createSetupShortcutUrl,
  convertGear,
  readParty,
  readSetupShortcut,
} from './.test/bridge.mjs'
import { syntheticGear } from './test-fixtures.mjs'

const SITE = 'https://zzz-setup-workbench.github.io/'
const prepared = () => createPreparedState({}, ['pyrois', 'norma', 'astraYao'], 0)
const input = () => createSetupShortcutUrl(prepared(), SITE)

test('converts a synthetic prepared party through current candidates and the current shortcut parser', () => {
  const party = readParty(input())
  const gear = syntheticGear(prepared())
  const before = structuredClone(gear)
  const result = convertGear(party, gear)

  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.issues, [])
  assert.ok(result.url)
  const state = readSetupShortcut(new URL(result.url).hash)
  assert.equal(state.focusSlot, 0)
  assert.deepEqual(state.slots.map(({ setup }) => setup.pool), ['full', 'full', 'full'])
  assert.deepEqual(state.slots.map(({ agentId }) => agentId), ['pyrois', 'norma', 'astraYao'])
  assert.deepEqual(gear, before)
  assert.doesNotMatch(result.url, /role_id|hoyolab/i)
})

test('maps an authored same-effect 2-piece input only to the unique exposed legal identity', () => {
  const state = prepared()
  const party = readParty(createSetupShortcutUrl(state, SITE))
  const gear = syntheticGear(state)
  const member = gear.members[2]
  assert.equal(state.slots[2].setup.fourPieceId, 'astralVoice')
  assert.equal(state.slots[2].setup.twoPieceId, 'moonlight')
  for (const disc of member.discs.slice(4)) disc.name = 'Swing Jazz'

  const result = convertGear(party, gear)
  assert.deepEqual(result.errors, [])
  const setup = readSetupShortcut(new URL(result.url).hash).slots[2].setup
  assert.equal(setup.twoPieceId, 'moonlight')
  assert.equal(setup.fourPieceId, 'astralVoice')
  assert.notEqual(setup.twoPieceId, setup.fourPieceId)
  assert.match(result.notices.join('\n'), /동일 효과로 반영/)
})

test('retains acquired substat rolls while completed levels add no future upgrades', () => {
  const state = prepared()
  const gear = syntheticGear(state)
  gear.members[0].agent.level = 50
  gear.members[0].weapon.level = 50
  gear.members[0].discs[0].substats = [{
    label: 'CRIT Rate',
    value: `${EFFECTIVE_SUBSTAT_VALUES.critRate.perHit * 2}%`,
  }]
  gear.members[0].discs[3].level = 12
  gear.members[0].discs[3].main.value = '19.2%'

  const result = convertGear(readParty(createSetupShortcutUrl(state, SITE)), gear)
  assert.deepEqual(result.errors, [])
  assert.match(result.notices.join('\n'), /추가 부옵션 강화는 예측하지 않습니다/)
  assert.equal(readSetupShortcut(new URL(result.url).hash).slots[0].setup.substats.critRate, 2)
})

test('returns an explicit comparison choice for a known selection outside current contextual candidates', () => {
  const state = prepared()
  const party = readParty(createSetupShortcutUrl(state, SITE))
  const gear = syntheticGear(state)
  gear.members[0].discs[3].main = { label: 'DEF', value: '48%' }

  const blocked = convertGear(party, gear)
  assert.equal(blocked.url, null)
  assert.equal(blocked.issues.length, 1)
  assert.equal(blocked.issues[0].key, 'slot4')
  const selected = blocked.issues[0].options[0].id
  const compared = convertGear(party, gear, { pyrois: { slot4: selected } })
  assert.deepEqual(compared.errors, [])
  assert.ok(compared.url)
  assert.equal(readSetupShortcut(new URL(compared.url).hash).slots[0].setup.mains.slot4, selected)
})

for (const scenario of [
  'unknown-engine',
  'wrong-agent',
  'duplicate-slot',
  'non-s',
  'fractional-substat',
  'set-222',
]) {
  test(`rejects the entire conversion without a silent substitution: ${scenario}`, () => {
    const state = prepared()
    const gear = syntheticGear(state)
    if (scenario === 'unknown-engine') gear.members[0].weapon.name = 'Unknown'
    if (scenario === 'wrong-agent') gear.members[0].agent.name = 'Anby'
    if (scenario === 'duplicate-slot') gear.members[0].discs[1].slot = 1
    if (scenario === 'non-s') gear.members[0].discs[0].rarity = 'A'
    if (scenario === 'fractional-substat') {
      gear.members[0].discs[0].substats = [{ label: 'CRIT Rate', value: '4.9%' }]
    }
    if (scenario === 'set-222') {
      gear.members[0].discs[0].name = 'Swing Jazz'
      gear.members[0].discs[1].name = 'Swing Jazz'
    }
    const result = convertGear(readParty(createSetupShortcutUrl(state, SITE)), gear)
    assert.equal(result.url, null)
    assert.ok(result.errors.length > 0)
  })
}

test('rejects malformed, partial, queried, and non-public shortcut inputs', () => {
  const valid = input()
  const partial = `${SITE}#setup=${Buffer.from(JSON.stringify({ v: 1, focusSlot: 0, slots: [] })).toString('base64url')}`
  for (const value of [
    '',
    valid.replace('zzz-setup-workbench.github.io', 'example.com'),
    `${SITE}?preview=1${new URL(valid).hash}`,
    `${SITE}#setup=bad`,
    partial,
  ]) assert.throws(() => readParty(value))
})
