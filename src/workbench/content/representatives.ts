import type { AgentId, PoolId, SetupSelection } from './types'

const yixuanRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'yunkui',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
}

const dialynRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'king',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'energyRegenPct' },
}

const luciaRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'moonlight',
  twoPieceId: 'yunkui',
  mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
}

const anbyRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'shadowHarmony',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' },
}

const triggerRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'spectralGaze' : 'restrained',
  fourPieceId: 'king',
  twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'impact' },
})

const astraRepresentative = (pool: PoolId, mindscape: number): SetupSelection => ({
  engineId: pool === 'full' ? 'elegantVanity' : 'bashfulDemon',
  fourPieceId: 'astralVoice',
  twoPieceId: pool === 'full' ? 'moonlight' : 'hormonePunk',
  mains: {
    slot4: 'atkPct',
    slot5: 'atkPct',
    slot6: mindscape >= 2 ? 'energyRegenPct' : 'atkPct',
  },
})

const seedRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'dawnsBloom',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' },
}

const cissiaRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'dawnsBloom',
  twoPieceId: 'swingJazz',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'energyRegenPct' },
}

const evelynRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'hormonePunk',
  twoPieceId: 'branchAndBlade',
  mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
}

const corinRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'cordisGermina' : 'steelCushion',
  fourPieceId: 'hormonePunk',
  twoPieceId: 'woodpecker',
  mains: {
    slot4: pool === 'full' ? 'critDmg' : 'critRate',
    slot5: 'penRatio',
    slot6: 'atkPct',
  },
})

const lycaonRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'blazingLaurel' : 'steamOven',
  fourPieceId: 'king',
  twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'impact' },
})

export const REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL: Record<
  AgentId,
  Record<PoolId, SetupSelection>
> = {
  yixuan: {
    full: { ...yixuanRepresentative, engineId: 'qingming' },
    nonLimited: { ...yixuanRepresentative, engineId: 'cauldron' },
  },
  dialyn: {
    full: { ...dialynRepresentative, engineId: 'yesterdayCalls' },
    nonLimited: { ...dialynRepresentative, engineId: 'hellfireGears' },
  },
  lucia: {
    full: { ...luciaRepresentative, engineId: 'dreamlitHearth' },
    nonLimited: { ...luciaRepresentative, engineId: 'weepingCradle' },
  },
  anbySoldier0: {
    full: { ...anbyRepresentative, engineId: 'severedInnocence' },
    nonLimited: {
      ...anbyRepresentative,
      engineId: 'marcatoDesire',
      twoPieceId: 'branchAndBlade',
    },
  },
  trigger: {
    full: triggerRepresentative('full'),
    nonLimited: triggerRepresentative('nonLimited'),
  },
  astraYao: {
    full: astraRepresentative('full', 0),
    nonLimited: astraRepresentative('nonLimited', 0),
  },
  seed: {
    full: { ...seedRepresentative, engineId: 'cordisGermina' },
    nonLimited: { ...seedRepresentative, engineId: 'marcatoDesire' },
  },
  cissia: {
    full: { ...cissiaRepresentative, engineId: 'serpentineSeeker' },
    nonLimited: { ...cissiaRepresentative, engineId: 'drillRigRedAxis' },
  },
  evelyn: {
    full: { ...evelynRepresentative, engineId: 'heartstringNocturne' },
    nonLimited: { ...evelynRepresentative, engineId: 'starlightEngine' },
  },
  corin: {
    full: corinRepresentative('full'),
    nonLimited: corinRepresentative('nonLimited'),
  },
  lycaon: {
    full: lycaonRepresentative('full'),
    nonLimited: lycaonRepresentative('nonLimited'),
  },
}

export function representativeSetupFor(
  agentId: AgentId,
  pool: PoolId,
  mindscape: number,
): SetupSelection {
  const representative = REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL[agentId][pool]
  if (agentId === 'yixuan' && pool === 'full' && mindscape >= 1) {
    return { ...representative, twoPieceId: 'branchAndBlade' }
  }
  if (agentId === 'astraYao') return astraRepresentative(pool, mindscape)
  return representative
}
