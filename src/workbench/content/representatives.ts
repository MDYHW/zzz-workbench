import type { AgentId, PoolId, SetupSelection } from './types'

const yixuanRepresentative = (pool: PoolId, mindscape: number): SetupSelection => ({
  engineId: pool === 'full' ? 'qingming' : 'cauldron',
  fourPieceId: 'yunkui',
  twoPieceId: mindscape >= 1
    ? pool === 'full' ? 'woodpecker' : 'branchAndBlade'
    : pool === 'full' ? 'branchAndBlade' : 'woodpecker',
  mains: {
    slot4: mindscape >= 1 && pool === 'full' ? 'critDmg' : 'critRate',
    slot5: 'etherDmg',
    slot6: 'hpPct',
  },
})

const yidhariRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'yunkui',
  twoPieceId: 'branchAndBlade',
  mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'hpPct' },
}

const manatoRepresentative: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'yunkui',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critDmg', slot5: 'fireDmg', slot6: 'hpPct' },
}

const hugoRepresentative = (pool: PoolId, mindscape: number): SetupSelection => ({
  engineId: pool === 'full' ? 'myriadEclipse' : 'steelCushion',
  fourPieceId: 'hormonePunk',
  twoPieceId: pool === 'full' && mindscape === 0
    ? 'branchAndBlade'
    : 'woodpecker',
  mains: {
    slot4: pool === 'full' && mindscape === 0 ? 'critRate' : 'critDmg',
    slot5: 'iceDmg',
    slot6: 'atkPct',
  },
})

const juFufuRepresentative = (pool: PoolId, mindscape: number): SetupSelection => ({
  engineId: pool === 'full' ? 'roaringFurnace' : 'hellfireGears',
  fourPieceId: 'king',
  twoPieceId: mindscape >= 1 ? 'shockstar' : 'woodpecker',
  mains: {
    slot4: 'critRate',
    slot5: 'atkPct',
    slot6: pool === 'full' ? 'atkPct' : 'impact',
  },
})

const panYinhuRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'tusksOfFury' : 'tremorTrigramVessel',
  fourPieceId: 'astralVoice',
  twoPieceId: 'swingJazz',
  mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
})

const banyueRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'wrathfulVajra' : 'cauldron',
  fourPieceId: 'yunkui',
  twoPieceId: pool === 'full' ? 'branchAndBlade' : 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'hpPct' },
})

const starlightBillyRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'starlightRiderFaceplate' : 'cauldron',
  fourPieceId: 'yunkui',
  twoPieceId: pool === 'full' ? 'branchAndBlade' : 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'hpPct' },
})

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
  engineId: pool === 'full' ? 'elegantVanity' : 'kaboom',
  fourPieceId: 'astralVoice',
  twoPieceId: 'moonlight',
  mains: {
    slot4: 'atkPct',
    slot5: 'atkPct',
    slot6: pool === 'full' || mindscape >= 2 ? 'energyRegenPct' : 'atkPct',
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

const evelynRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'heartstringNocturne' : 'starlightEngine',
  fourPieceId: 'hormonePunk',
  twoPieceId: pool === 'full' ? 'woodpecker' : 'branchAndBlade',
  mains: {
    slot4: pool === 'full' ? 'critDmg' : 'critRate',
    slot5: 'penRatio',
    slot6: 'atkPct',
  },
})

const corinRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'cordisGermina' : 'steelCushion',
  fourPieceId: 'hormonePunk',
  twoPieceId: pool === 'full' ? 'branchAndBlade' : 'woodpecker',
  mains: {
    slot4: 'critRate',
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
    full: yixuanRepresentative('full', 0),
    nonLimited: yixuanRepresentative('nonLimited', 0),
  },
  yidhari: {
    full: { ...yidhariRepresentative, engineId: 'krakensCradle' },
    nonLimited: { ...yidhariRepresentative, engineId: 'grillOWisp' },
  },
  manato: {
    full: { ...manatoRepresentative, engineId: 'grillOWisp' },
    nonLimited: { ...manatoRepresentative, engineId: 'grillOWisp' },
  },
  hugo: {
    full: hugoRepresentative('full', 0),
    nonLimited: hugoRepresentative('nonLimited', 0),
  },
  juFufu: {
    full: juFufuRepresentative('full', 0),
    nonLimited: juFufuRepresentative('nonLimited', 0),
  },
  panYinhu: {
    full: panYinhuRepresentative('full'),
    nonLimited: panYinhuRepresentative('nonLimited'),
  },
  banyue: {
    full: banyueRepresentative('full'),
    nonLimited: banyueRepresentative('nonLimited'),
  },
  starlightBilly: {
    full: starlightBillyRepresentative('full'),
    nonLimited: starlightBillyRepresentative('nonLimited'),
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
      mains: { ...anbyRepresentative.mains, slot4: 'critDmg' },
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
    full: evelynRepresentative('full'),
    nonLimited: evelynRepresentative('nonLimited'),
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
  if (agentId === 'yixuan') return yixuanRepresentative(pool, mindscape)
  if (agentId === 'hugo') return hugoRepresentative(pool, mindscape)
  if (agentId === 'astraYao') return astraRepresentative(pool, mindscape)
  if (agentId === 'juFufu') return juFufuRepresentative(pool, mindscape)
  return representative
}
