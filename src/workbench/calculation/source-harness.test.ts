import { describe, expect, it } from 'vitest'
import {
  defineAgentBaseSource,
  defineAgentSource,
  defineCalculationSource,
  defineDriveDiscSource,
  defineWEngineSource,
} from '../content/source-definitions'
import {
  EFFECTIVE_SUBSTAT_VALUES,
  FIXED_MAIN_STATS,
  SUBSTAT_CHOICES_BY_AGENT,
} from '../content/setup-options'
import { selectSource } from './source-instance'
import { resultSourceFor } from './result'

describe('shared source foundation', () => {
  it('owns fixed main and currently admitted effective-substat facts once', () => {
    expect(FIXED_MAIN_STATS.slot1.numericValue).toBe(2200)
    expect(FIXED_MAIN_STATS.slot2.numericValue).toBe(316)
    expect(FIXED_MAIN_STATS.slot3.numericValue).toBe(184)
    expect(SUBSTAT_CHOICES_BY_AGENT.yixuan[0]).toBe(EFFECTIVE_SUBSTAT_VALUES.critRate)
    expect(EFFECTIVE_SUBSTAT_VALUES).not.toHaveProperty('defPct')
  })

  it('distinguishes one selected W-Engine definition by its holder snapshot', () => {
    const definition = defineWEngineSource('steamOven', 'Steam Oven')
    const anby = selectSource(definition, 'anby', 0, {
      kind: 'refinement', refinement: 5,
    })
    const lycaon = selectSource(definition, 'lycaon', 1, {
      kind: 'refinement', refinement: 5,
    })

    expect(anby.definition).toBe(lycaon.definition)
    expect(anby.holderAgentId).not.toBe(lycaon.holderAgentId)
    expect(anby.appliedPartySlot).not.toBe(lycaon.appliedPartySlot)
  })

  it('keeps base and authored Agent relationships structurally distinct', () => {
    const base = defineAgentBaseSource('anby', 'Anby base stats')
    const additional = defineAgentSource(
      'anby',
      'parallel-connection',
      'Parallel Connection',
      'additional',
    )

    expect(base.key.kind).toBe('agent-base')
    expect(base.visibility).toBe('calculation-only')
    expect(additional.key).toEqual({
      kind: 'agent-source', agentId: 'anby', sourceId: 'parallel-connection',
    })
    expect(additional.visibility).toBe('visible')
  })

  it('does not use presentation labels as source identity', () => {
    const a = defineAgentSource('anby', 'core-skill', 'Same visible label', 'core')
    const b = defineAgentSource('trigger', 'core-skill', 'Same visible label', 'core')

    expect(a.presentation.label).toBe(b.presentation.label)
    expect(a.key).not.toEqual(b.key)
  })

  it('projects a 4-piece-owned 2-piece effect to the selected 4-piece control', () => {
    const source = selectSource(
      defineDriveDiscSource('shadowHarmony', '2-piece', 'Shadow Harmony'),
      'anbySoldier0',
      0,
      { kind: 'drive-disc', selectedRole: '4-piece', effectPiece: '2-piece' },
    )

    expect(resultSourceFor(source)).toMatchObject({
      label: 'Shadow Harmony', locus: 'disc-4pc', detail: '2-piece',
    })
  })

  it('keeps a target editor destination distinct from holder-local calculation sources', () => {
    const source = selectSource(
      defineCalculationSource('target-stun', 'Target Stun DMG Multiplier', 'target'),
      'yeShunguang',
      0,
    )
    expect(resultSourceFor(source).locus).toBe('target')
  })
})
