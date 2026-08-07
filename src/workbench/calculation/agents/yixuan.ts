import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  scaledEngineValue,
} from '../../content'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  resolveDeliveredClauses,
  type CompleteSetup,
  type ResolvedCurrentEffect,
  type SourceBoundCurrentClause,
  type SurfaceKey,
} from '../../effects'
import {
  composeActionEffects,
  composeMetricEffects,
  contribution,
  percentageContribution,
  surfaceValueContribution,
  surfaces,
  withoutZero,
} from '../composition'
import type { ActionModifier, AgentResult } from '../result'

export interface YixuanCalculationContext {
  agentId: 'yixuan'
  setup: CompleteSetup
}

export const observeYixuan = (
  setup: CompleteSetup,
): YixuanCalculationContext => ({ agentId: 'yixuan', setup })

export function resolveYixuanProviderClauses(
  setup: CompleteSetup,
): SourceBoundCurrentClause[] {
  const engine = engineSource('yixuan', setup)
  const fourPiece = discSource('yixuan', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const values = VERTICAL_VALUES

  return active([
    additive('critRate', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.critRate, refinement) : 0, 'self'),
    additive('critRate', 'combat', mindscapeSource('yixuan', 1), setup.mindscape >= 1 ? values.yixuan.mindscapeCritRate : 0, 'self'),
    additive('critRate', 'fully', engine, setup.engineId === 'cauldron' ? scaledEngineValue(W_ENGINE_FACTS.cauldron.critRate, refinement) : 0, 'self'),
    additive('critRate', 'fully', fourPiece, setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.critRate : 0, 'self'),
    additive('critDmg', 'fully', STATIC_SOURCES.yixuan.additional, values.yixuan.additionalCritDmg, 'self'),
    additive('critDmg', 'fully', engine, setup.engineId === 'puzzleSphere' ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.critDmg, refinement) : 0, 'self'),
    additive('dmgBonus', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.etherDmg, refinement) : 0, 'self'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'cauldron' ? scaledEngineValue(W_ENGINE_FACTS.cauldron.dmg, refinement) : 0, 'self'),
    additive('sheerForce', 'fully', engine, setup.engineId === 'radiowave' ? scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, refinement) : 0, 'self'),
    additive('sheerDmgBonus', 'fully', fourPiece, setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.sheerDmg : 0, 'self'),
    additive('sheerDmgBonus', 'fully', mindscapeSource('yixuan', 6, 'during Meditation'), setup.mindscape >= 6 ? values.yixuan.mindscapeMeditationSheerDmg : 0, 'self'),
    additive('dmgBonus', 'combat', STATIC_SOURCES.yixuan.core, values.yixuan.coreActionDmgBonus, 'self', 'coreActions'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.yixuan.additional, values.yixuan.additionalExDmgBonus, 'self', 'exSpecialStunned'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'puzzleSphere' ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.actionExDmg, refinement) : 0, 'self', 'exSpecialStunned'),
    additive('dmgBonus', 'fully', mindscapeSource('yixuan', 4, '30% x 2 stacks'), setup.mindscape >= 4 ? values.yixuan.mindscapeActionDmgPerStack * 2 : 0, 'self', 'mindscapeCloudShaper'),
    additive('sheerDmgBonus', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.actionSheerDmg, refinement) : 0, 'self', 'engineSheerActions'),
    additive('resIgnore', 'fully', mindscapeSource('yixuan', 2, 'Ether RES Ignore'), setup.mindscape >= 2 ? values.yixuan.mindscapeEtherResIgnore : 0, 'enemy-context', 'mindscapeEtherResIgnore'),
    additive('stunDuration', 'fully', mindscapeSource('yixuan', 2), setup.mindscape >= 2 ? values.yixuan.mindscapeStunExtension : 0, 'enemy-context'),
  ])
}

function buildYixuanActionModifiers(
  effects: ResolvedCurrentEffect[],
  commonDmgBonus: Record<SurfaceKey, number>,
  commonSheerDmgBonus: Record<SurfaceKey, number>,
  commonResIgnore: Record<SurfaceKey, number>,
): ActionModifier[] {
  const coreActions = composeActionEffects(
    commonDmgBonus,
    effects,
    'dmgBonus',
    'coreActions',
  )
  const stunnedEx = composeActionEffects(
    coreActions.values,
    effects,
    'dmgBonus',
    'exSpecialStunned',
  )
  const actions: ActionModifier[] = [
    {
      id: 'coreActions',
      actions: ['Basic Attack', 'EX Special Attack', 'Assist Follow-Up', 'Chain Attack', 'Ultimate'],
      metricId: 'dmgBonus',
      ...coreActions,
    },
    {
      id: 'exSpecialStunned',
      actions: ['EX Special Attack'],
      metricId: 'dmgBonus',
      baseActionId: 'coreActions',
      ...stunnedEx,
    },
  ]

  if (effects.some(({ action }) => action === 'mindscapeCloudShaper')) {
    actions.push({
      id: 'mindscapeCloudShaper',
      actions: [
        'EX Special Attack: Cloud-Shaper',
        'EX Special Attack: Ashen Ink Becomes Shadows',
      ],
      metricId: 'dmgBonus',
      baseActionId: 'exSpecialStunned',
      ...composeActionEffects(
        stunnedEx.values,
        effects,
        'dmgBonus',
        'mindscapeCloudShaper',
      ),
    })
  }

  if (effects.some(({ action }) => action === 'engineSheerActions')) {
    actions.push({
      id: 'engineSheerActions',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'sheerDmgBonus',
      ...composeActionEffects(
        commonSheerDmgBonus,
        effects,
        'sheerDmgBonus',
        'engineSheerActions',
      ),
    })
  }

  if (effects.some(({ action }) => action === 'mindscapeEtherResIgnore')) {
    actions.push({
      id: 'mindscapeEtherResIgnore',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'resIgnore',
      ...composeActionEffects(
        commonResIgnore,
        effects,
        'resIgnore',
        'mindscapeEtherResIgnore',
      ),
    })
  }

  return actions
}

function orderYixuanEffects(
  effects: ResolvedCurrentEffect[],
): ResolvedCurrentEffect[] {
  const priority = (effect: ResolvedCurrentEffect): number => {
    if (effect.metric === 'sheerForce') return effect.source.ownerAgentId === 'lucia' ? 0 : 1
    if (effect.metric === 'critDmg') {
      if (effect.source.ownerAgentId === 'dialyn') return 1
      if (effect.source.ownerAgentId === 'lucia') return 2
      return effect.source.label === SOURCE_LABELS.yixuanAbility ? 0 : 3
    }
    if (effect.metric === 'dmgBonus') {
      if (effect.source.ownerAgentId === 'dialyn') return 1
      if (effect.source.ownerAgentId === 'lucia') return 2
      if (
        !effect.action
        && effect.earliestSurface === 'fully'
        && effect.source.ownerAgentId === 'yixuan'
        && effect.source.locus === 'w-engine'
      ) return 3
      return 0
    }
    if (effect.metric === 'resIgnore') return effect.source.ownerAgentId === 'dialyn' ? 0 : 1
    return effect.source.ownerAgentId === 'lucia' ? 1 : 0
  }
  return [...effects].sort((left, right) => priority(left) - priority(right))
}

export function calculateYixuan(
  setup: CompleteSetup,
  inbox: SourceBoundCurrentClause[],
  enemyContext: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES
  const yixuan = values.yixuan
  const engine = W_ENGINES[setup.engineId]

  const hpSubstat = effectiveSubstatInput(setup, 'yixuan', 'hpPct')
  const critRateSubstat = effectiveSubstatInput(setup, 'yixuan', 'critRate')
  const critDmgSubstat = effectiveSubstatInput(setup, 'yixuan', 'critDmg')
  const engineHp = engineAdvancedInput(setup, 'yixuan', 'hpPct')
  const engineAtk = engineAdvancedInput(setup, 'yixuan', 'atkPct')
  const discHp = discStatInput(
    setup,
    'yixuan',
    'fourPiece',
    'yunkui',
    DRIVE_DISC_FACTS.yunkui.hpPct,
  )
  const slot5Hp = mainStatInput(setup, 'yixuan', 'slot5', 'hpPct')
  const slot6Hp = mainStatInput(setup, 'yixuan', 'slot6', 'hpPct')
  const hpPercent = (engineHp?.rawValue ?? 0)
    + (discHp?.rawValue ?? 0)
    + (slot5Hp?.rawValue ?? 0)
    + (slot6Hp?.rawValue ?? 0)
    + (hpSubstat?.rawValue ?? 0)
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp

  const baseAtk = yixuan.atk + engine.baseAtk
  const initialAtk = baseAtk * (1 + (engineAtk?.rawValue ?? 0) / 100) + values.fixedDisc.atk
  const effects = orderYixuanEffects(resolveDeliveredClauses(
    [...inbox, ...enemyContext],
    { maxHp: initialHp, atk: baseAtk },
  ))

  const mainCritRate = mainStatInput(setup, 'yixuan', 'slot4', 'critRate')
  const mainCritDmg = mainStatInput(setup, 'yixuan', 'slot4', 'critDmg')
  const twoPieceCritRate = discStatInput(
    setup,
    'yixuan',
    'twoPiece',
    'woodpecker',
    DRIVE_DISC_FACTS.woodpecker.critRate,
  )
  const twoPieceCritDmg = discStatInput(
    setup,
    'yixuan',
    'twoPiece',
    'branchAndBlade',
    DRIVE_DISC_FACTS.branchAndBlade.critDmg,
  )
  const uncappedInitialCritRate = yixuan.critRate
    + (mainCritRate?.rawValue ?? 0)
    + (twoPieceCritRate?.rawValue ?? 0)
    + (critRateSubstat?.rawValue ?? 0)
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const initialCritDmg = yixuan.critDmg
    + (mainCritDmg?.rawValue ?? 0)
    + (twoPieceCritDmg?.rawValue ?? 0)
    + (critDmgSubstat?.rawValue ?? 0)

  const initialDmg = mainStatInput(setup, 'yixuan', 'slot5', 'etherDmg')
  const initialDmgBonus = initialDmg?.rawValue ?? 0
  const hpInitialBreakdown = withoutZero([
    ...(engineHp ? [percentageContribution(
      engineHp.source,
      yixuan.hp * engineHp.rawValue / 100,
      engineHp.rawValue,
    )] : []),
    ...(discHp ? [percentageContribution(
      discHp.source,
      yixuan.hp * discHp.rawValue / 100,
      discHp.rawValue,
    )] : []),
    ...(slot5Hp ? [percentageContribution(
      slot5Hp.source,
      yixuan.hp * slot5Hp.rawValue / 100,
      slot5Hp.rawValue,
    )] : []),
    ...(slot6Hp ? [percentageContribution(
      slot6Hp.source,
      yixuan.hp * slot6Hp.rawValue / 100,
      slot6Hp.rawValue,
    )] : []),
    ...(hpSubstat ? [percentageContribution(
      hpSubstat.source,
      yixuan.hp * hpSubstat.rawValue / 100,
      hpSubstat.rawValue,
    )] : []),
  ])

  const rawCritInitialBreakdown = withoutZero([
    ...(mainCritRate ? [contribution(mainCritRate.source, mainCritRate.rawValue)] : []),
    ...(twoPieceCritRate ? [contribution(
      twoPieceCritRate.source,
      twoPieceCritRate.rawValue,
    )] : []),
    ...(critRateSubstat ? [contribution(critRateSubstat.source, critRateSubstat.rawValue)] : []),
  ])
  const critInitialBreakdown = withoutZero([
    ...rawCritInitialBreakdown,
    contribution(
      STATIC_SOURCES.yixuan.critCap,
      initialCritRate - uncappedInitialCritRate,
    ),
  ])

  const maxHp = composeMetricEffects(
    surfaces(initialHp, initialHp, initialHp),
    surfaces(hpInitialBreakdown, [], []),
    effects,
    'maxHp',
  )
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(
      withoutZero(engineAtk ? [percentageContribution(
        engineAtk.source,
        baseAtk * engineAtk.rawValue / 100,
        engineAtk.rawValue,
      )] : []),
      [],
      [],
    ),
    effects,
    'atk',
  )
  const convertRuptureStats = (atkValue: number, maxHpValue: number) =>
    atkValue * values.rupture.currentAtkToSheer
      + maxHpValue * values.rupture.currentHpToSheer
  const ruptureSheer = surfaces(
    convertRuptureStats(atk.values.initial, maxHp.values.initial),
    convertRuptureStats(atk.values.combat, maxHp.values.combat),
    convertRuptureStats(atk.values.fully, maxHp.values.fully),
  )
  const sheerForce = composeMetricEffects(
    ruptureSheer,
    surfaces(
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.initial)],
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.combat)],
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.fully)],
    ),
    effects,
    'sheerForce',
  )
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critInitialBreakdown, [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.yixuan.critCap },
  )
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(
      withoutZero([
        ...(mainCritDmg ? [contribution(mainCritDmg.source, mainCritDmg.rawValue)] : []),
        ...(twoPieceCritDmg ? [contribution(twoPieceCritDmg.source, twoPieceCritDmg.rawValue)] : []),
        ...(critDmgSubstat ? [contribution(critDmgSubstat.source, critDmgSubstat.rawValue)] : []),
      ]),
      [],
      [],
    ),
    effects,
    'critDmg',
  )
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmgBonus, initialDmgBonus, initialDmgBonus),
    surfaces(
      withoutZero(initialDmg ? [contribution(initialDmg.source, initialDmg.rawValue)] : []),
      [],
      [],
    ),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'sheerDmgBonus',
  )
  const stunDmgMultiplier = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'stunDmgMultiplier',
  )
  const resIgnore = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'resIgnore',
  )

  return {
    agentId: 'yixuan',
    metrics: [
      { id: 'maxHp', label: 'Max HP', unit: '', decimals: 0, ...maxHp },
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1, ...sheerForce },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmgBonus },
      { id: 'sheerDmgBonus', label: 'Sheer DMG Bonus', unit: '%', decimals: 1, ...sheerDmgBonus },
      { id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stunDmgMultiplier },
      { id: 'resIgnore', label: 'RES Ignore', unit: '%', decimals: 1, ...resIgnore },
    ],
    actionModifiers: buildYixuanActionModifiers(
      effects,
      dmgBonus.values,
      sheerDmgBonus.values,
      resIgnore.values,
    ),
    operations: [],
  }
}
