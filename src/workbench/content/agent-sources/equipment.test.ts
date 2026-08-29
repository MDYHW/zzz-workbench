import { describe, expect, it } from 'vitest'
import { selectSource } from '../../calculation/source-instance'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import { defineCalculationSource } from '../source-definitions'
import { equipmentEffectBaseValue, equipmentEffectMaximumValue, type EquipmentEffectFact } from '../types'
import {
  equipmentEffectActionTargets,
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivatedByHolder,
  isWEnginePassiveEligible,
  type CompleteSelectedSetup,
} from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import { materializeSelectedWEngineEffects } from './w-engine-effect-materializer'
import {
  selectedWEngineBroadPrePenRelationships,
  selectedWEngineRelationships,
} from './w-engine-relationships'

const effect = (overrides: Partial<EquipmentEffectFact>): EquipmentEffectFact => ({
  modifier: 'dmgBonus',
  unit: '%',
  value: 0,
  ...overrides,
})

describe('shared engine activation and scope facts', () => {
  it('derives affected actions and tags without treating trigger actions as scope', () => {
    expect(equipmentEffectActionTargets(effect({
      scope: { actions: ['Dash Attack'], tags: ['aftershock'] },
      activation: { kind: 'trigger', actions: ['EX Special Attack'] },
    }))).toMatchObject([
      { outcomes: [{ kind: 'canonical', action: 'Dash Attack' }], tags: [] },
      { outcomes: [], tags: ['aftershock'] },
    ])
    expect(equipmentEffectActionTargets(effect({
      activation: { kind: 'trigger', actions: ['EX Special Attack'] },
    }))).toEqual([])
    expect(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency).toMatchObject({
      activation: { kind: 'trigger', actions: ['Special Attack', 'EX Special Attack'] },
    })
    expect((W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency as EquipmentEffectFact).scope?.actions).toBeUndefined()
    expect(equipmentEffectActionTargets(effect({
      scope: { condition: 'backAttack' },
    }))).toMatchObject([{
      outcomes: [{ kind: 'source-local', label: 'Back attacks' }],
    }])
  })

  it('keeps Simmering activation separate from its broad holder effects and compressed Setup copy', () => {
    const { daze, damage } = W_ENGINE_FACTS.simmeringPot.effects
    expect(daze.activation).toMatchObject({ kind: 'trigger', actions: ['Assist Follow-Up'], durationSeconds: 30 })
    expect(damage.activation).toMatchObject({ kind: 'trigger', actions: ['Assist Follow-Up'], durationSeconds: 30 })
    expect((daze as EquipmentEffectFact).scope?.actions).toBeUndefined()
    expect((damage as EquipmentEffectFact).scope?.actions).toBeUndefined()
    expect(W_ENGINES.simmeringPot.passiveLines(5)).toEqual([
      `Daze +${equipmentEffectBaseValue(daze, 5)}%`,
      `DMG +${equipmentEffectBaseValue(damage, 5)}%`,
    ])
  })

  it('keeps an equipper-attack trigger in the shared fact and resolves holder capability separately', () => {
    const damage = W_ENGINE_FACTS.weepingCradle.effects.damage
    expect(damage.activation).toEqual({ kind: 'trigger', performer: 'equipper' })
    expect(equipmentEffectCanBeActivatedByHolder('sunna', damage)).toBe(true)
    expect(equipmentEffectCanBeActivatedByHolder('yuzuha', damage)).toBe(true)

    const roaringDamage = W_ENGINE_FACTS.roaringFurnace.effects.damage
    expect(roaringDamage.activation).toEqual({
      kind: 'trigger', performer: 'equipper',
      actions: ['Chain Attack', 'Ultimate'], attributes: ['Fire'],
    })
    expect(equipmentEffectCanBeActivatedByHolder('juFufu', roaringDamage)).toBe(true)
    expect(equipmentEffectCanBeActivatedByHolder('nangongYu', roaringDamage)).toBe(false)

    const etherHolderEffect = effect({
      activation: { kind: 'trigger', holderAttributes: ['Ether'] },
    })
    expect(equipmentEffectCanBeActivatedByHolder('aria', etherHolderEffect)).toBe(true)
    expect(equipmentEffectCanBeActivatedByHolder('promeia', etherHolderEffect)).toBe(false)
  })
})

describe('equipment operating-interval applicability', () => {
  it('distinguishes off-field activation from off-field removal', () => {
    const unconditional = effect({})
    const offFieldOnly = effect({ scope: { condition: 'offField' } })
    const removedOffField = effect({
      activation: { kind: 'trigger', removedOffField: true },
    })

    expect(equipmentEffectAppliesInOperatingInterval(unconditional, 'on-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(unconditional, 'off-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(offFieldOnly, 'on-field')).toBe(false)
    expect(equipmentEffectAppliesInOperatingInterval(offFieldOnly, 'off-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(removedOffField, 'on-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(removedOffField, 'off-field')).toBe(false)
  })
})

describe('shared equipment effect relationship projection', () => {
  const source = selectSource(
    defineCalculationSource('equipment-fixture', 'Equipment fixture'),
    'aria',
    0,
  )

  it('derives stat, action, and recipient meaning from equivalent facts', () => {
    expect(projectEquipmentEffectRelationships({
      source,
      fact: effect({ modifier: 'atk', unit: '%', value: 12 }),
      amount: 12,
      earliestSurface: 'fully',
    })).toMatchObject([{
      kind: 'stat',
      atom: { statId: 'atk', region: 'percentage', value: 12 },
    }])

    expect(projectEquipmentEffectRelationships({
      source,
      fact: effect({
        modifier: 'dmgBonus',
        value: 18,
        scope: { actions: ['Basic Attack'] },
      }),
      amount: 18,
      earliestSurface: 'combat',
    })).toMatchObject([{
      kind: 'modifier',
      atom: {
        metricId: 'dmgBonus',
        earliestSurface: 'combat',
        action: { outcomes: [{ kind: 'canonical', action: 'Basic Attack' }] },
      },
    }])

    expect(projectEquipmentEffectRelationships({
      source,
      fact: effect({
        modifier: 'critDmg',
        value: 24,
        scope: { recipient: 'squad', attributes: ['Ether'] },
      }),
      amount: 24,
      earliestSurface: 'fully',
      delivery: { formulas: ['general_damage'] },
    })).toMatchObject([{
      kind: 'provider',
      delivery: {
        recipient: 'all-party',
        attributes: ['Ether'],
        formulas: ['general_damage'],
      },
      effect: { kind: 'stat', statId: 'critDmg', region: 'flat', value: 24 },
    }])

    expect(projectEquipmentEffectRelationships({
      source,
      fact: effect({
        modifier: 'defIgnore',
        value: 20,
        scope: { recipient: 'enemy' },
      }),
      amount: 20,
      earliestSurface: 'fully',
    })).toMatchObject([{
      kind: 'modifier',
      atom: { metricId: 'defIgnore', value: 20 },
    }])
  })

  it('projects anomaly result scopes as independent targets', () => {
    const anomalyScoped = effect({
      modifier: 'anomalyDmgBonus',
      unit: '%',
      value: 10,
      scope: { anomalyResults: ['Attribute Anomaly', 'Disorder'] },
    })

    expect(equipmentEffectActionTargets(anomalyScoped)).toMatchObject([
      { outcomes: [{ kind: 'source-local', label: 'Attribute Anomaly' }] },
      { outcomes: [{ kind: 'source-local', label: 'Disorder' }] },
    ])
    expect(projectEquipmentEffectRelationships({
      source,
      fact: anomalyScoped,
      amount: 10,
      earliestSurface: 'fully',
    })).toMatchObject([
      {
        kind: 'modifier',
        atom: {
          metricId: 'anomalyDmgBonus',
          action: { outcomes: [{ kind: 'source-local', label: 'Attribute Anomaly' }] },
        },
      },
      {
        kind: 'modifier',
        atom: {
          metricId: 'anomalyDmgBonus',
          action: { outcomes: [{ kind: 'source-local', label: 'Disorder' }] },
        },
      },
    ])
  })
})

describe('ordinary W-Engine effect materialization', () => {
  const source = selectSource(
    defineCalculationSource('engine-materialization-fixture', 'Engine materialization fixture'),
    'trigger',
    0,
  )
  type MaterializerCase = {
    name: string
    effect?: EquipmentEffectFact
    context?: Partial<Parameters<typeof materializeSelectedWEngineEffects>[1]>
    expectedCount?: number
  }

  it('derives surfaces, progression, delivery, interval, and current-consumer joins from facts', () => {
    const relationships = materializeSelectedWEngineEffects({
      alwaysAtk: effect({ modifier: 'atk', unit: '%', value: 12 }),
      stackedCrit: effect({
        modifier: 'critDmg', unit: '%', value: 10,
        progression: { kind: 'stacks', perStack: 5, maxStacks: 2 },
      }),
      basicDamage: effect({
        modifier: 'dmgBonus', value: 18,
        scope: { actions: ['Basic Attack'] },
      }),
      squadDamage: effect({
        modifier: 'dmgBonus', value: 20,
        scope: { recipient: 'squad' },
      }),
      offFieldEnergy: effect({
        modifier: 'energy', unit: '/s', value: 0.6,
        scope: { condition: 'offField' },
      }),
      wrongAttribute: effect({
        modifier: 'dmgBonus', value: 50,
        scope: { attributes: ['Fire'] },
      }),
      explicitOperation: effect({ modifier: 'defDamage', value: 600 }),
      locallyUnused: effect({ modifier: 'dazeBonus', value: 20 }),
    }, {
      agentId: 'trigger',
      focusAgentId: 'anbySoldier0',
      refinement: 1,
      source,
      observation: {
        baseStats: { atk: 100, critDmg: 50 },
        modifierMetrics: ['dmgBonus'],
      },
      effectIsHolderApplicable: (effectKey) => effectKey !== 'locallyUnused',
    })

    expect(relationships).toMatchObject([
      { kind: 'stat', atom: { statId: 'atk', earliestSurface: 'combat', value: 12 } },
      { kind: 'stat', atom: { statId: 'critDmg', earliestSurface: 'combat', value: 10 } },
      { kind: 'stat', atom: { statId: 'critDmg', earliestSurface: 'fully', value: 10 } },
      {
        kind: 'modifier',
        atom: {
          metricId: 'dmgBonus', earliestSurface: 'fully', value: 18,
          action: { outcomes: [{ kind: 'canonical', action: 'Basic Attack' }] },
        },
      },
      {
        kind: 'provider',
        delivery: {
          recipient: 'all-party',
          formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'],
        },
        effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: 20 },
      },
      { kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: 0.6 } },
    ])
  })

  it('applies each exclusion gate independently before materializing a shared effect', () => {
    const sharedDamage = effect({ modifier: 'dmgBonus', value: 18 })
    const cases: readonly MaterializerCase[] = [
      { name: 'omitted effect key', context: { omitEffectKeys: new Set(['shared']) } },
      { name: 'includeEffect filter', context: { includeEffect: () => false } },
      { name: 'holder-applicable filter', context: { effectIsHolderApplicable: () => false } },
      {
        name: 'holder capability filter',
        effect: effect({
          modifier: 'dmgBonus',
          value: 18,
          activation: { kind: 'trigger', holderAttributes: ['Ether'] },
        }),
        context: { agentId: 'promeia' as const },
      },
      {
        name: 'operating interval filter',
        effect: effect({
          modifier: 'dmgBonus',
          value: 18,
          scope: { condition: 'offField' },
        }),
        context: { agentId: 'aria' as const, focusAgentId: 'aria' as const },
      },
      {
        name: 'local consumer filter',
        context: { observation: { baseStats: {}, modifierMetrics: [] as const } },
      },
      { name: 'unaffected positive case', context: {}, expectedCount: 1 },
    ] as const

    for (const testCase of cases) {
      const relationships = materializeSelectedWEngineEffects(
        { shared: testCase.effect ?? sharedDamage },
        {
          agentId: 'trigger',
          focusAgentId: 'anbySoldier0',
          refinement: 1,
          source,
          observation: {
            baseStats: {},
            modifierMetrics: ['dmgBonus'],
          },
          effectIsHolderApplicable: () => true,
          ...testCase.context,
        },
      )
      expect(relationships, testCase.name).toHaveLength(testCase.expectedCount ?? 0)
    }
  })

  it('derives the fixed non-Focus Support interval without generalizing off-field recovery', () => {
    const automaticOffFieldEnergy = effect({
      modifier: 'energy', unit: '/s', value: 0.6,
      scope: { condition: 'offField' },
    })
    const materializeFor = (agentId: 'rina' | 'yuzuha' | 'aria', focusAgentId: 'anton' | 'jane' | 'aria') => (
      materializeSelectedWEngineEffects(
        { energy: automaticOffFieldEnergy },
        {
          agentId,
          focusAgentId,
          refinement: 1,
          source,
          effectIsHolderApplicable: () => true,
        },
      )
    )

    expect(materializeFor('rina', 'anton')).toMatchObject([
      { kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: 0.6 } },
    ])
    expect(materializeFor('yuzuha', 'jane')).toMatchObject([
      { kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: 0.6 } },
    ])
    expect(materializeFor('aria', 'aria')).toEqual([])
  })

  it('projects broad no-action defense pressure from selected W-Engines only when the shared fact stays generic', () => {
    const myriadRelationships = selectedWEngineBroadPrePenRelationships({
      agentId: 'ellen',
      focusAgentId: 'ellen',
      engineId: 'myriadEclipse',
      refinement: 1,
      source,
      passiveEligible: true,
    })
    expect(myriadRelationships).toMatchObject([
      { kind: 'modifier', atom: { metricId: 'defIgnore', value: equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, 1) } },
    ])

    const spectralRelationships = selectedWEngineBroadPrePenRelationships({
      agentId: 'trigger',
      focusAgentId: 'anbySoldier0',
      engineId: 'spectralGaze',
      refinement: 1,
      source,
      passiveEligible: true,
    })
    expect(spectralRelationships).toMatchObject([
      { kind: 'provider', effect: { kind: 'modifier', metricId: 'defReduction' } },
    ])

    const serpentineEligible = selectedWEngineBroadPrePenRelationships({
      agentId: 'cissia',
      focusAgentId: 'cissia',
      engineId: 'serpentineSeeker',
      refinement: 1,
      source,
      passiveEligible: true,
    })
    expect(serpentineEligible).toMatchObject([
      { kind: 'modifier', atom: { metricId: 'defIgnore', value: equipmentEffectBaseValue(W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore, 1) } },
    ])

    const serpentineIneligible = selectedWEngineBroadPrePenRelationships({
      agentId: 'orphie',
      focusAgentId: 'orphie',
      engineId: 'serpentineSeeker',
      refinement: 1,
      source,
      passiveEligible: true,
    })
    expect(
      serpentineIneligible.some((relationship) => (
        relationship.kind === 'modifier'
        && relationship.atom.metricId === 'defIgnore'
      )),
    ).toBe(false)
    expect(isWEnginePassiveEligible('orphie', 'serpentineSeeker')).toBe(true)
  })

  it('materializes Fusion Compiler maximum AP as a fully enabled holder stat without action scope', () => {
    const genericRelationships = materializeSelectedWEngineEffects({
      anomalyProficiency: W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency,
      contrastDamage: effect({
        modifier: 'dmgBonus',
        unit: '%',
        value: 18,
        scope: { actions: ['Special Attack'] },
      }),
    }, {
      agentId: 'grace',
      focusAgentId: 'grace',
      refinement: 1,
      source,
      observation: {
        baseStats: { anomalyProficiency: 1 },
        modifierMetrics: ['dmgBonus'],
      },
      effectIsHolderApplicable: () => true,
    })

    expect(genericRelationships.filter((relationship) => (
      relationship.kind === 'stat'
      && relationship.atom.statId === 'anomalyProficiency'
    ))).toMatchObject([
      {
        atom: {
          earliestSurface: 'fully',
          value: equipmentEffectMaximumValue(
            W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency,
            1,
          ),
        },
      },
    ])
    expect(genericRelationships.some((relationship) => (
      relationship.kind === 'modifier'
      && relationship.atom.metricId === 'anomalyProficiency'
    ))).toBe(false)
    expect(genericRelationships.filter((relationship) => (
      relationship.kind === 'modifier'
      && relationship.atom.metricId === 'dmgBonus'
    ))).toMatchObject([
      {
        kind: 'modifier',
        atom: {
          metricId: 'dmgBonus',
          action: { outcomes: [{ kind: 'canonical', action: 'Special Attack' }] },
        },
      },
    ])

    const selectedRelationships = selectedWEngineRelationships({
      agentId: 'grace',
      appliedPartySlot: 0,
      setup: {
        engineId: 'fusionCompiler',
        refinement: 1,
        fourPieceId: 'chaosJazz',
        twoPieceId: 'freedomBlues',
        mains: { slot4: 'anomalyProficiency', slot5: 'atkPct', slot6: 'anomalyMastery' },
        substats: {},
      },
      observation: { baseStats: { anomalyProficiency: 1 } },
      focusAgentId: 'grace',
      partyAgentIds: ['grace', 'rina', 'nicole'],
      source,
      passiveEligible: true,
    })

    expect(selectedRelationships.filter((relationship) => (
      relationship.kind === 'stat'
      && relationship.atom.statId === 'anomalyProficiency'
    ))).toMatchObject([
      {
        atom: {
          earliestSurface: 'fully',
          value: equipmentEffectMaximumValue(
            W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency,
            1,
          ),
        },
      },
    ])
    expect(selectedRelationships.some((relationship) => (
      relationship.kind === 'modifier'
      && 'metricId' in relationship.atom
      && relationship.atom.metricId === 'anomalyProficiency'
    ))).toBe(false)
  })
})

describe('selected W-Engine relationship gaps', () => {
  const source = selectSource(
    defineCalculationSource('selected-engine-gap-fixture', 'Selected engine gap fixture'),
    'zhuYuan',
    0,
  )
  const setup = (engineId: CompleteSelectedSetup['engineId']): CompleteSelectedSetup => ({
    engineId,
    refinement: 1,
    fourPieceId: 'woodpecker',
    twoPieceId: 'woodpecker',
    mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'atkPct' },
    substats: {},
  })

  it('keeps Riot Suppressor Mark VI charged Ether damage split between Basic and Dash Attack', () => {
    const relationships = selectedWEngineRelationships({
      agentId: 'zhuYuan',
      appliedPartySlot: 0,
      setup: setup('riotSuppressorMarkVI'),
      observation: {
        baseStats: { critRate: 1 },
        modifierMetrics: ['dmgBonus'],
      },
      focusAgentId: 'zhuYuan',
      partyAgentIds: ['zhuYuan', 'nicole', 'astraYao'],
      source,
      passiveEligible: true,
    })

    const charged = relationships.filter((relationship) => (
      relationship.kind === 'modifier'
      && relationship.atom.metricId === 'dmgBonus'
      && relationship.atom.value === equipmentEffectBaseValue(
        W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage,
        1,
      )
    ))
    expect(charged).toMatchObject([
      { atom: { action: { outcomes: [{ kind: 'canonical', action: 'Basic Attack' }] }, earliestSurface: 'fully' } },
      { atom: { action: { outcomes: [{ kind: 'canonical', action: 'Dash Attack' }] }, earliestSurface: 'fully' } },
    ])
  })

  it('keeps Metanukimorphosis holder Anomaly Mastery at Fully Enabled only', () => {
    const relationships = selectedWEngineRelationships({
      agentId: 'yuzuha',
      appliedPartySlot: 0,
      setup: setup('metanukimorphosis'),
      observation: {
        baseStats: { anomalyMastery: 1 },
      },
      focusAgentId: 'sunna',
      partyAgentIds: ['yuzuha', 'sunna', 'rina'],
      source,
      passiveEligible: true,
    })

    const mastery = relationships.filter((relationship) => (
      relationship.kind === 'stat'
      && relationship.atom.statId === 'anomalyMastery'
    ))
    expect(mastery).toMatchObject([
      {
        atom: {
          earliestSurface: 'fully',
          value: equipmentEffectBaseValue(
            W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery,
            1,
          ),
        },
      },
    ])
  })
})
