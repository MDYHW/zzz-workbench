import { describe, expect, it } from 'vitest'
import { selectSource } from '../../calculation/source-instance'
import { DRIVE_DISC_FACTS, DRIVE_DISCS } from '../discs'
import { selectedWEngineEffectIsHolderApplicable } from '../agent-equipment-effect-applicability'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import { defineCalculationSource } from '../source-definitions'
import { equipmentEffectBaseValue, equipmentEffectMaximumValue, type EquipmentEffectFact } from '../types'
import {
  equipmentEffectActionTargets,
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivated,
  isWEnginePassiveEligible,
  type CompleteSelectedSetup,
} from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import { materializeSelectedDriveDiscEffects } from './drive-disc-effect-materializer'
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
  it('projects an identity-free minimum-stat effect through the common projector', () => {
    const syntheticSource = selectSource(
      defineCalculationSource('minimum-stat-fixture', 'Minimum-stat fixture'),
      'trigger',
      0,
    )
    const relationships = materializeSelectedDriveDiscEffects({
      threshold: effect({
        modifier: 'critDmg', value: 15,
        activation: { kind: 'minimum-stat', statId: 'critRate', threshold: 50 },
        scope: { recipient: 'squad' },
      }),
    }, {
      source: syntheticSource, agentId: 'trigger', focusAgentId: 'anbySoldier0',
      partyAgentIds: ['trigger', 'anbySoldier0'],
    })
    expect(relationships).toMatchObject([{
      kind: 'gauge', basis: { statId: 'critRate' },
      outputs: [{
        label: 'Squad CRIT DMG',
        activation: { inactiveValue: 0, activeValue: 15 },
        emission: { kind: 'provider', delivery: { recipient: 'all-party' } },
      }],
    }])
  })

  it('retains a minimum-stat progression base in the inactive gauge state', () => {
    const syntheticSource = selectSource(
      defineCalculationSource('minimum-stat-progression-fixture', 'Minimum-stat progression fixture'),
      'trigger',
      0,
    )
    const [relationship] = materializeSelectedDriveDiscEffects({
      threshold: effect({
        modifier: 'critDmg', value: 15,
        progression: { kind: 'conditions', perCondition: 15, maxConditions: 1 },
        activation: { kind: 'minimum-stat', statId: 'critRate', threshold: 50 },
        scope: { recipient: 'squad' },
      }),
    }, {
      source: syntheticSource, agentId: 'trigger', focusAgentId: 'anbySoldier0',
      partyAgentIds: ['trigger', 'anbySoldier0'],
    })
    expect(relationship).toMatchObject({
      kind: 'gauge',
      outputs: [{ activation: { inactiveValue: 15, activeValue: 30 } }],
    })
  })

  it('normalizes floating-point residue in composed progression totals', () => {
    expect(equipmentEffectMaximumValue(effect({
      progression: { kind: 'stacks', perStack: 5.2, maxStacks: 3 },
    }))).toBe(15.6)
  })

  it('fails closed for an unproven action-local minimum-stat output', () => {
    const syntheticSource = selectSource(
      defineCalculationSource('minimum-stat-action-fixture', 'Minimum-stat action fixture'),
      'trigger',
      0,
    )
    expect(() => materializeSelectedDriveDiscEffects({
      threshold: effect({
        modifier: 'dazeBonus', value: 20,
        activation: { kind: 'minimum-stat', statId: 'critRate', threshold: 50 },
        scope: { actions: ['Basic Attack'] },
      }),
    }, {
      source: syntheticSource, agentId: 'trigger', focusAgentId: 'anbySoldier0',
      partyAgentIds: ['trigger', 'anbySoldier0'],
    })).toThrow('Unsupported minimum-stat action output: dazeBonus')
  })

  it('keeps local outcome applicability independent of candidate membership', () => {
    expect(selectedWEngineEffectIsHolderApplicable(
      'trigger', 'cloudcleaveRadiance', 'physicalResIgnore',
    )).toBe(true)
    expect(selectedWEngineEffectIsHolderApplicable(
      'trigger', 'restrained', 'damage',
    )).toBe(false)
    expect(selectedWEngineEffectIsHolderApplicable(
      'trigger', 'restrained', 'daze',
    )).toBe(true)
  })

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
    expect(W_ENGINES.simmeringPot.passiveLines(5).map(({ text }) => text)).toEqual([
      `Daze +${equipmentEffectBaseValue(daze, 5)}%`,
      `DMG +${equipmentEffectBaseValue(damage, 5)}%`,
    ])
  })

  it('compresses Ode and Feathered activation without erasing affected anomaly scope', () => {
    const ode = W_ENGINE_FACTS.odeOfResurrectedWings.effects
    expect(ode.holderAnomalyDamage.activation).toMatchObject({
      kind: 'trigger', anomalyResult: 'Refringe', durationSeconds: 30,
    })
    expect(ode.holderAnomalyDamage.scope).toEqual({
      anomalyResults: ['Attribute Anomaly'],
    })
    expect(W_ENGINES.odeOfResurrectedWings.passiveLines(1).map(({ text }) => text)).toEqual([
      `Anomaly Proficiency +${equipmentEffectBaseValue(ode.anomalyProficiency, 1)}`,
      `Attribute Anomaly DMG +${equipmentEffectBaseValue(ode.holderAnomalyDamage, 1)}%`,
      `Squad DMG +${equipmentEffectBaseValue(ode.squadDamage, 1)}%`,
    ])

    const feathered = DRIVE_DISC_FACTS.featheredFate.fourPiece
    expect(feathered.anomalyProficiency.activation).toMatchObject({
      kind: 'trigger', fieldEntry: true, durationSeconds: 15,
    })
    expect(feathered.lumifluxAnomalyDamage.activation).toMatchObject({
      holderAttributes: ['Lumiflux'],
    })
    expect(feathered.lumifluxAnomalyDamage.scope).toEqual({
      anomalyResults: ['Attribute Anomaly'],
    })
    expect(DRIVE_DISCS.featheredFate.fourPieceEffects?.map(({ text }) => text)).toEqual([
      `Anomaly Proficiency +${equipmentEffectBaseValue(feathered.anomalyProficiency)}`,
      `Attribute Anomaly DMG +${equipmentEffectBaseValue(feathered.lumifluxAnomalyDamage)}%`,
    ])
  })

  it('keeps an equipper-attack trigger in the shared fact and resolves holder capability separately', () => {
    const damage = W_ENGINE_FACTS.weepingCradle.effects.damage
    expect(damage.activation).toEqual({ kind: 'trigger', performer: 'equipper' })
    expect(equipmentEffectCanBeActivated('sunna', ['sunna'], damage)).toBe(true)
    expect(equipmentEffectCanBeActivated('yuzuha', ['yuzuha'], damage)).toBe(true)

    const roaringDamage = W_ENGINE_FACTS.roaringFurnace.effects.damage
    expect(roaringDamage.activation).toEqual({
      kind: 'trigger', performer: 'equipper',
      actions: ['Chain Attack', 'Ultimate'], attributes: ['Fire'],
    })
    expect(equipmentEffectCanBeActivated('juFufu', ['juFufu'], roaringDamage)).toBe(true)
    expect(equipmentEffectCanBeActivated('nangongYu', ['nangongYu'], roaringDamage)).toBe(false)

    const etherHolderEffect = effect({
      activation: { kind: 'trigger', holderAttributes: ['Ether'] },
    })
    expect(equipmentEffectCanBeActivated('aria', ['aria'], etherHolderEffect)).toBe(true)
    expect(equipmentEffectCanBeActivated('promeia', ['promeia'], etherHolderEffect)).toBe(false)

    const windEquipperEffect = effect({
      activation: { kind: 'trigger', performer: 'equipper', attributes: ['Wind'] },
    })
    expect(equipmentEffectCanBeActivated('velina', ['velina'], windEquipperEffect)).toBe(true)
    expect(equipmentEffectCanBeActivated('promeia', ['promeia'], windEquipperEffect)).toBe(false)
  })

  it('resolves Ether Veil operation, performer, and holder Specialty independently', () => {
    const { veilCritRate, attackVeilCritRate } = DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece
    expect(equipmentEffectCanBeActivated(
      'starlightBilly', ['starlightBilly'], veilCritRate,
    )).toBe(false)
    expect(equipmentEffectCanBeActivated(
      'starlightBilly', ['starlightBilly', 'cissia'], veilCritRate,
    )).toBe(true)
    expect(equipmentEffectCanBeActivated(
      'cissia', ['cissia'], attackVeilCritRate,
    )).toBe(true)
    expect(equipmentEffectCanBeActivated(
      'yidhari', ['yidhari'], attackVeilCritRate,
    )).toBe(false)
    expect(equipmentEffectCanBeActivated(
      'starlightBilly', ['starlightBilly', 'cissia'], attackVeilCritRate,
    )).toBe(false)
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
      scope: { anomalyResults: ['Attribute Anomaly', 'Windswept', 'Vortex', 'Disorder'] },
    })

    expect(equipmentEffectActionTargets(anomalyScoped)).toMatchObject([
      { outcomes: [{ kind: 'source-local', label: 'Attribute Anomaly' }] },
      { outcomes: [{ kind: 'source-local', label: 'Windswept' }] },
      { outcomes: [{ kind: 'source-local', label: 'Vortex' }] },
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
          action: { outcomes: [{ kind: 'source-local', label: 'Windswept' }] },
        },
      },
      {
        kind: 'modifier',
        atom: {
          metricId: 'anomalyDmgBonus',
          action: { outcomes: [{ kind: 'source-local', label: 'Vortex' }] },
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
      partyAgentIds: ['trigger', 'anbySoldier0'],
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
          metricId: 'dmgBonus', earliestSurface: 'combat', value: 18,
          action: { outcomes: [{ kind: 'canonical', action: 'Basic Attack' }] },
        },
      },
      {
        kind: 'provider',
        delivery: {
          recipient: 'all-party',
          formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'],
        },
        effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'combat', value: 20 },
      },
      { kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: 0.6 } },
    ])
  })

  it('extends ordinary W-Engines from source relationships without an identity branch', () => {
    const relationships = materializeSelectedWEngineEffects({
      actionScoped: effect({
        modifier: 'dmgBonus', value: 18,
        scope: { actions: ['Basic Attack'] },
      }),
      triggeredSquad: effect({
        modifier: 'critDmg', value: 24,
        scope: { recipient: 'squad' },
        activation: { kind: 'trigger', actions: ['EX Special Attack'] },
      }),
      entryStack: effect({
        modifier: 'resIgnore',
        progression: { kind: 'stacks', perStack: 12.5, maxStacks: 2 },
        scope: { actions: ['Chain Attack', 'Ultimate'], attributes: ['Electric'] },
        activation: {
          kind: 'trigger', fieldEntry: true, actions: ['Chain Attack', 'Ultimate'],
        },
      }),
      thresholdOutcome: effect({
        modifier: 'anomalyDmgBonus', value: 25,
        scope: { anomalyResults: ['Disorder'] },
        activation: { kind: 'minimum-stat', statId: 'anomalyProficiency', threshold: 375 },
      }),
    }, {
      agentId: 'trigger',
      focusAgentId: 'anbySoldier0',
      partyAgentIds: ['trigger', 'anbySoldier0'],
      refinement: 1,
      source,
      observation: {
        baseStats: { anomalyProficiency: 100 },
        modifierMetrics: ['dmgBonus', 'resIgnore', 'anomalyDmgBonus'],
      },
      effectIsHolderApplicable: () => true,
    })

    expect(relationships).toMatchObject([
      {
        kind: 'modifier',
        atom: { metricId: 'dmgBonus', earliestSurface: 'combat', value: 18 },
      },
      {
        kind: 'provider',
        effect: { kind: 'stat', statId: 'critDmg', earliestSurface: 'fully', value: 24 },
      },
      {
        kind: 'modifier',
        atom: { metricId: 'resIgnore', earliestSurface: 'combat', value: 12.5 },
      },
      {
        kind: 'modifier',
        atom: { metricId: 'resIgnore', earliestSurface: 'fully', value: 12.5 },
      },
      {
        kind: 'post-delivery-stat-modifier-gauge',
        basis: { statId: 'anomalyProficiency', surface: 'fully' },
        basisLabel: 'Fully Enabled Anomaly Proficiency',
        modifierMetricId: 'anomalyDmgBonus',
        action: { outcomes: [{ kind: 'source-local', label: 'Disorder' }] },
        output: { label: 'Disorder DMG Bonus', cap: 25, unit: '%' },
      },
    ])
  })

  it('projects a progression minimum-stat W-Engine gauge exactly once', () => {
    const relationships = materializeSelectedWEngineEffects({
      thresholdOutcome: effect({
        modifier: 'anomalyDmgBonus',
        value: 15,
        progression: { kind: 'conditions', perCondition: 15, maxConditions: 1 },
        scope: { anomalyResults: ['Disorder'] },
        activation: { kind: 'minimum-stat', statId: 'anomalyProficiency', threshold: 375 },
      }),
    }, {
      agentId: 'trigger',
      focusAgentId: 'anbySoldier0',
      partyAgentIds: ['trigger', 'anbySoldier0'],
      refinement: 1,
      source,
      observation: {
        baseStats: { anomalyProficiency: 100 },
        modifierMetrics: ['anomalyDmgBonus'],
      },
      effectIsHolderApplicable: () => true,
    })

    expect(relationships).toMatchObject([{
      kind: 'post-delivery-stat-modifier-gauge',
      basis: { statId: 'anomalyProficiency', surface: 'fully' },
      output: { cap: 30, unit: '%' },
      action: { outcomes: [{ kind: 'source-local', label: 'Disorder' }] },
    }])
    expect(relationships).toHaveLength(1)
    expect(relationships[0]).toMatchObject({
      kind: 'post-delivery-stat-modifier-gauge',
      output: { value: { inactiveValue: 15, activeValue: 30 } },
    })
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
          partyAgentIds: ['trigger', 'anbySoldier0'],
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

  it('uses explicit off-field policies without generalizing from Support metadata', () => {
    const automaticOffFieldEnergy = effect({
      modifier: 'energy', unit: '/s', value: 0.6,
      scope: { condition: 'offField' },
    })
    const materializeFor = (agentId: 'rina' | 'yuzuha' | 'astraYao', focusAgentId: 'anton' | 'jane' | 'astraYao') => (
      materializeSelectedWEngineEffects(
        { energy: automaticOffFieldEnergy },
        {
          agentId,
          focusAgentId,
          partyAgentIds: [agentId, focusAgentId],
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
    expect(materializeFor('astraYao', 'anton')).toEqual([])
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
      partyAgentIds: ['grace'],
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

describe('ordinary Drive Disc effect materialization', () => {
  const source = selectSource(
    defineCalculationSource('disc-materialization-fixture', 'Disc materialization fixture'),
    'aria',
    0,
  )

  it('derives ordinary surfaces, progression, action, and recipient delivery without Disc identity', () => {
    const relationships = materializeSelectedDriveDiscEffects({
      fullyAtk: effect({ modifier: 'atk', unit: '%', value: 12 }),
      conditionalCrit: effect({
        modifier: 'critRate', value: 28,
        activation: { kind: 'trigger', targetCondition: 'burningTarget' },
      }),
      progressiveBasic: effect({
        modifier: 'dmgBonus', value: 10,
        progression: { kind: 'conditions', perCondition: 5, maxConditions: 2 },
        scope: { actions: ['Basic Attack'] },
      }),
      squadAnomaly: effect({
        modifier: 'anomalyDmgBonus', value: 16,
        scope: {
          recipient: 'squad',
          anomalyResults: ['Attribute Anomaly', 'Disorder'],
        },
      }),
      matchingBuildupRes: effect({
        modifier: 'anomalyBuildupResReduction', value: 20,
        scope: { recipient: 'enemy' },
      }),
    }, {
      agentId: 'aria',
      focusAgentId: 'aria',
      partyAgentIds: ['aria'],
      source,
      observation: {
        baseStats: { atk: 100, critRate: 5 },
        modifierMetrics: ['dmgBonus', 'anomalyDmgBonus'],
      },
    })

    expect(relationships).toMatchObject([
      { kind: 'stat', atom: { statId: 'atk', earliestSurface: 'fully', value: 12 } },
      { kind: 'stat', atom: { statId: 'critRate', earliestSurface: 'fully', value: 28 } },
      {
        kind: 'modifier',
        atom: { metricId: 'dmgBonus', earliestSurface: 'combat', value: 10 },
      },
      {
        kind: 'modifier',
        atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: 10 },
      },
      {
        kind: 'provider',
        delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] },
        effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', value: 16 },
      },
      {
        kind: 'provider',
        delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] },
        effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', value: 16 },
      },
      {
        kind: 'provider',
        delivery: {
          recipient: 'enemy-context', attributes: ['Ether'], formulas: ['anomaly_buildup'],
        },
        effect: { kind: 'modifier', metricId: 'anomalyBuildupResReduction', value: 20 },
      },
    ])
  })

  it('keeps entry-only and Initial-threshold disc effects on the Combat surface', () => {
    const context = {
      agentId: 'remielle' as const, focusAgentId: 'ellen' as const,
      partyAgentIds: ['remielle', 'ellen', 'astraYao'] as const,
      source: selectSource(defineCalculationSource('entry-disc', 'Entry disc'), 'remielle', 0),
    }
    expect(materializeSelectedDriveDiscEffects(DRIVE_DISC_FACTS.featheredFate.fourPiece, context))
      .toMatchObject([
        { kind: 'stat', atom: { statId: 'anomalyProficiency', earliestSurface: 'combat' } },
        { kind: 'modifier', atom: { metricId: 'anomalyDmgBonus', earliestSurface: 'combat' } },
      ])
    expect(materializeSelectedDriveDiscEffects(DRIVE_DISC_FACTS.branchAndBlade.fourPiece, {
      ...context, agentId: 'miyabi', focusAgentId: 'miyabi',
      partyAgentIds: ['miyabi', 'lycaon', 'astraYao'],
      source: selectSource(defineCalculationSource('threshold-disc', 'Threshold disc'), 'miyabi', 0),
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'gauge', basis: { statId: 'anomalyMastery', surface: 'initial' },
        outputs: [expect.objectContaining({
          emission: expect.objectContaining({ effect: expect.objectContaining({ earliestSurface: 'combat' }) }),
        })],
      }),
      expect.objectContaining({ kind: 'stat', atom: expect.objectContaining({ statId: 'critRate', earliestSurface: 'fully' }) }),
    ]))
  })

  it('materializes White Water Ballad from party and holder Ether Veil capabilities', () => {
    const materializeFor = (
      agentId: 'yeShunguang' | 'starlightBilly',
      partyAgentIds: readonly ('yeShunguang' | 'starlightBilly' | 'cissia')[],
    ) => materializeSelectedDriveDiscEffects(
      DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece,
      {
        agentId,
        focusAgentId: agentId,
        partyAgentIds,
        source,
        observation: { baseStats: { atk: 1, critRate: 1 } },
      },
    )

    expect(materializeFor('starlightBilly', ['starlightBilly'])).toEqual([])
    expect(materializeFor('starlightBilly', ['starlightBilly', 'cissia']))
      .toMatchObject([
        { kind: 'stat', atom: { statId: 'critRate', value: 10 } },
      ])
    expect(materializeFor('yeShunguang', ['yeShunguang'])).toMatchObject([
      { kind: 'stat', atom: { statId: 'critRate', value: 10 } },
      { kind: 'stat', atom: { statId: 'critRate', value: 10 } },
      { kind: 'stat', atom: { statId: 'atk', value: 10 } },
    ])
  })

  it('retains Shockstar source action scope without holder-specific narrowing', () => {
    const relationships = materializeSelectedDriveDiscEffects(
      DRIVE_DISC_FACTS.shockstar.fourPiece,
      {
        agentId: 'trigger',
        focusAgentId: 'anbySoldier0',
        partyAgentIds: ['trigger', 'anbySoldier0'],
        source,
        observation: { baseStats: {}, modifierMetrics: ['dazeBonus'] },
      },
    )

    expect(relationships).toMatchObject([{
      kind: 'modifier',
      atom: {
        metricId: 'dazeBonus',
        action: {
          outcomes: [
            { kind: 'canonical', action: 'Basic Attack' },
            { kind: 'canonical', action: 'Dash Attack' },
            { kind: 'canonical', action: 'Dodge Counter' },
          ],
        },
      },
    }])
  })
})

describe('selected W-Engine source relationships', () => {
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

  it('keeps Riot Suppressor Mark VI charged Ether damage scoped to Basic and Dash Attack', () => {
    const relationships = selectedWEngineRelationships({
      agentId: 'zhuYuan',
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
    expect(charged).toMatchObject([{
      atom: {
        action: {
          outcomes: [
            { kind: 'canonical', action: 'Basic Attack' },
            { kind: 'canonical', action: 'Dash Attack' },
          ],
        },
        earliestSurface: 'fully',
      },
    }])
  })

  it('keeps Ice-Jade stack acquisition separate from its affected outcomes', () => {
    const { impact, damage } = W_ENGINE_FACTS.iceJadeTeapot.effects
    expect(impact.activation).toEqual({
      kind: 'trigger', performer: 'equipper', actions: ['Basic Attack'],
    })
    expect(damage.activation).toEqual({
      kind: 'trigger', performer: 'equipper', actions: ['Basic Attack'], stackThreshold: 15,
    })
    expect(damage.composition).toBe('highest-only')

    const qingyiSource = selectSource(
      defineCalculationSource('ice-jade-source-fixture', 'Ice-Jade source fixture'),
      'qingyi',
      0,
    )
    const relationships = selectedWEngineRelationships({
      agentId: 'qingyi',
      setup: setup('iceJadeTeapot'),
      observation: {
        baseStats: { impact: 1 },
        modifierMetrics: ['dmgBonus'],
      },
      focusAgentId: 'harumasa',
      partyAgentIds: ['qingyi', 'harumasa', 'nicole'],
      source: qingyiSource,
      passiveEligible: true,
    })

    expect(relationships.filter((relationship) => (
      relationship.kind === 'stat'
      && relationship.atom.statId === 'impact'
    ))).toMatchObject([{
      atom: {
        earliestSurface: 'fully',
        value: equipmentEffectMaximumValue(impact, 1),
      },
    }])
    const squadDamage = relationships.filter((relationship) => (
      relationship.kind === 'provider'
      && relationship.effect.kind === 'modifier'
      && relationship.effect.metricId === 'dmgBonus'
    ))
    expect(squadDamage).toMatchObject([{
      delivery: { recipient: 'all-party' },
      effect: {
        earliestSurface: 'fully',
        value: equipmentEffectBaseValue(damage, 1),
        composition: {
          kind: 'highest-only',
          semanticEffect: damage,
        },
      },
    }])
    const [squadDamageRelationship] = squadDamage
    if (squadDamageRelationship?.kind !== 'provider') {
      throw new Error('Expected the Ice-Jade squad DMG provider relationship.')
    }
    expect(squadDamageRelationship.effect).not.toHaveProperty('action')
  })

  it('keeps Metanukimorphosis holder Anomaly Mastery at Fully Enabled only', () => {
    const relationships = selectedWEngineRelationships({
      agentId: 'yuzuha',
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
