import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import {
  active,
  additive,
  discSource,
  discStatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
  withCandidatePressure,
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  energyRegenProjection,
} from '../composition'
import type { AgentResult, ResultOperation } from '../result'

export interface NicoleCalculationContext {
  agentId: 'nicole'
  setup: CompleteSetup
  additionalActive: boolean
}

const damageFormulas = ['general_damage', 'sheer_damage'] as const

export function observeNicole(
  setup: CompleteSetup,
  additionalActive: boolean,
): NicoleCalculationContext {
  return { agentId: 'nicole', setup, additionalActive }
}

export function resolveNicoleProviderClauses(
  context: NicoleCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.nicole
  const core = source(SOURCE_LABELS.nicoleCore, 'nicole', 'core')
  const additional = source(SOURCE_LABELS.nicoleAbility, 'nicole', 'additional')
  const engine = engineSource('nicole', setup)
  const refinement = setup.refinement

  return active([
    withCandidatePressure(
      withApplicability(
        additive('defReduction', 'fully', core, values.coreDefReduction, 'enemy-context'),
        { formulas: ['general_damage'] },
      ),
      'materialBroadPrePenDefBypass',
    ),
    withApplicability(
      additive('dmgBonus', 'fully', additional,
        additionalActive ? values.additionalEtherDmg : 0, 'all-party'),
      { attributes: ['Ether'], formulas: damageFormulas },
    ),
    additive('critRate', 'fully', mindscapeSource('nicole', 6, '10 stacks'),
      setup.mindscape >= 6 ? values.mindscapeSquadCritRate : 0, 'all-party'),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'elegantVanity'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.elegantVanity.effects.damage, refinement)
          : setup.engineId === 'theVault'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.theVault.effects.targetDamage, refinement)
            : setup.engineId === 'weepingCradle'
              ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement)
              : 0,
        'all-party'),
      { formulas: damageFormulas },
    ),
    ...(setup.engineId === 'weepingCradle'
        ? [perSecond(engine,
          equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement),
          'self')]
        : []),
    withApplicability(
      percentage('atk', 'fully', engine,
        setup.engineId === 'kaboom'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement)
          : 0,
        'all-party', undefined, undefined, 'kaboomTheCannon'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('nicole', 'moonlight', '4-piece'),
        setup.fourPieceId === 'moonlight'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'moonlightLullaby'),
      { formulas: damageFormulas },
    ),
  ])
}

function quickAssistOperations(): ResultOperation[] {
  return ['EX Special Attack', 'Chain Attack', 'Ultimate'].map((action) => ({
    id: `nicole${action.replaceAll(' ', '')}QuickAssist`,
    label: `Quick Assist · ${action}`,
    source: source(SOURCE_LABELS.nicoleCore, 'nicole', 'core', action),
    surface: 'fully',
    value: 1,
    unit: '',
  }))
}

export function calculateNicole(
  context: NicoleCalculationContext,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.nicole
  const effects = resolveDeliveredClauses(inbox, {})
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'nicole', 'energyRegenPct'),
    mainStatInput(setup, 'nicole', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'nicole', 'fourPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'nicole', 'twoPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
    discStatInput(setup, 'nicole', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)

  return {
    agentId: 'nicole',
    metrics: [
      { id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 2, ...energy },
    ],
    actionModifiers: [],
    operations: quickAssistOperations(),
  }
}
