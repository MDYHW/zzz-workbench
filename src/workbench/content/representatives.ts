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

const anbySoldier0Representative: Omit<SetupSelection, 'engineId'> = {
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

const ellenRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'deepSeaVisitor' : 'brimstone',
  fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
  mains: { slot4: pool === 'full' ? 'critDmg' : 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
})

const soukakuRepresentative: SetupSelection = {
  engineId: 'kaboom', fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
  mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
}

const soldier11Representative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'heartstringNocturne' : 'brimstone',
  fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
  mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
})

const lighterRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'blazingLaurel' : 'hellfireGears',
  fourPieceId: 'astralVoice', twoPieceId: 'shockstar',
  mains: { slot4: 'atkPct', slot5: 'fireDmg', slot6: 'impact' },
})

const lucyRepresentative: SetupSelection = {
  engineId: 'kaboom', fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
  mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
}

const zhuYuanRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'cordisGermina' : 'brimstone',
  fourPieceId: 'chaoticMetal',
  twoPieceId: pool === 'full' ? 'branchAndBlade' : 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'atkPct' },
})

const nicoleRepresentative: SetupSelection = {
  engineId: 'theVault', fourPieceId: 'moonlight', twoPieceId: 'swingJazz',
  mains: { slot4: 'atkPct', slot5: 'etherDmg', slot6: 'energyRegenPct' },
}

const orphieRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'bellicoseBlaze' : 'gildedBlossom',
  fourPieceId: 'shadowHarmony', twoPieceId: 'swingJazz',
  mains: {
    slot4: pool === 'full' ? 'critDmg' : 'critRate',
    slot5: 'fireDmg', slot6: 'energyRegenPct',
  },
})

const pulchraRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'blazingLaurel' : 'boxCutter',
  fourPieceId: 'king', twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'impact' },
})

const harumasaRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'zanshinHerbCase' : 'brimstone',
  fourPieceId: 'shadowHarmony', twoPieceId: 'branchAndBlade',
  mains: pool === 'full'
    ? { slot4: 'atkPct', slot5: 'atkPct', slot6: 'atkPct' }
    : { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' },
})

const qingyiRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'iceJadeTeapot' : 'steamOven',
  fourPieceId: 'king', twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'impact' },
})

const nekomataRepresentative = (): SetupSelection => ({
  engineId: 'steelCushion',
  fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
  mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
})

const billyRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'cloudcleaveRadiance' : 'brimstone',
  fourPieceId: 'woodpecker', twoPieceId: 'branchAndBlade',
  mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
})

const benRepresentative: SetupSelection = {
  engineId: 'tremorTrigramVessel',
  fourPieceId: 'woodpecker', twoPieceId: 'branchAndBlade',
  mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'atkPct' },
}

const koledaRepresentative: SetupSelection = {
  engineId: 'hellfireGears',
  fourPieceId: 'king', twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'impact' },
}

const anbyRepresentative: SetupSelection = {
  engineId: 'hellfireGears',
  fourPieceId: 'king', twoPieceId: 'shockstar',
  mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'impact' },
}

const caesarRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'tusksOfFury' : 'springEmbrace',
  fourPieceId: 'bunnyInWonderland', twoPieceId: 'swingJazz',
  mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'impact' },
})

const yeShunguangRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'cloudcleaveRadiance' : 'brimstone',
  fourPieceId: 'whiteWaterBallad', twoPieceId: 'branchAndBlade',
  mains: { slot4: 'critDmg', slot5: 'physicalDmg', slot6: 'atkPct' },
})

const zhaoRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'halfSugarBunny' : 'originalTransmorpher',
  fourPieceId: 'bunnyInWonderland', twoPieceId: 'yunkui',
  mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
})

const graceRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'timeweaver' : 'fusionCompiler',
  fourPieceId: 'thunderMetal', twoPieceId: 'pufferElectro',
  mains: {
    slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery',
  },
})

const piperRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'practicedPerfection' : 'roaringRide',
  fourPieceId: 'fangedMetal', twoPieceId: 'phaethonsMelody',
  mains: { slot4: 'anomalyProficiency', slot5: 'physicalDmg', slot6: 'anomalyMastery' },
})

const yuzuhaRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'metanukimorphosis' : 'kaboom',
  fourPieceId: 'moonlight', twoPieceId: 'phaethonsMelody',
  mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'anomalyMastery' },
})

const sunnaRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'thoughtbop' : 'kaboom',
  fourPieceId: 'moonlight', twoPieceId: 'swingJazz',
  mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
})

const burniceRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'flamemakerShaker' : 'electroLipGloss',
  fourPieceId: 'chaosJazz', twoPieceId: 'swingJazz',
  mains: { slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'energyRegenPct' },
})

const janeRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'practicedPerfection' : 'weepingGemini',
  fourPieceId: 'fangedMetal', twoPieceId: 'pufferElectro',
  mains: { slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery' },
})

const sethRepresentative: SetupSelection = {
  engineId: 'peacekeeperSpecialized', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
  mains: { slot4: 'anomalyProficiency', slot5: 'electricDmg', slot6: 'energyRegenPct' },
}

const yanagiRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'timeweaver' : 'weepingGemini',
  fourPieceId: 'chaosJazz', twoPieceId: 'freedomBlues',
  mains: { slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery' },
})

const aliceRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'practicedPerfection' : 'fusionCompiler',
  fourPieceId: 'fangedMetal', twoPieceId: 'phaethonsMelody',
  mains: { slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery' },
})

const vivianRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'flightOfFancy' : 'weepingGemini',
  fourPieceId: 'phaethonsMelody', twoPieceId: 'freedomBlues',
  mains: { slot4: 'anomalyProficiency', slot5: 'etherDmg', slot6: 'anomalyMastery' },
})

const ariaRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'angelInTheShell' : 'electroLipGloss',
  fourPieceId: 'phaethonsMelody', twoPieceId: 'freedomBlues',
  mains: { slot4: 'anomalyProficiency', slot5: 'etherDmg', slot6: 'anomalyMastery' },
})

const promeiaRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'frostfallSickle' : 'fusionCompiler',
  fourPieceId: 'notesFromTheChained', twoPieceId: 'phaethonsMelody',
  mains: { slot4: 'anomalyProficiency', slot5: 'iceDmg', slot6: 'anomalyMastery' },
})

const nangongYuRepresentative = (pool: PoolId): SetupSelection => ({
  engineId: pool === 'full' ? 'neonFantasies' : 'hellfireGears',
  fourPieceId: 'phaethonsMelody', twoPieceId: 'freedomBlues',
  mains: { slot4: 'anomalyProficiency', slot5: 'etherDmg', slot6: 'anomalyMastery' },
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
    full: { ...anbySoldier0Representative, engineId: 'severedInnocence' },
    nonLimited: {
      ...anbySoldier0Representative,
      engineId: 'marcatoDesire',
      mains: { ...anbySoldier0Representative.mains, slot4: 'critDmg' },
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
  ellen: { full: ellenRepresentative('full'), nonLimited: ellenRepresentative('nonLimited') },
  soukaku: { full: soukakuRepresentative, nonLimited: soukakuRepresentative },
  soldier11: { full: soldier11Representative('full'), nonLimited: soldier11Representative('nonLimited') },
  lighter: { full: lighterRepresentative('full'), nonLimited: lighterRepresentative('nonLimited') },
  lucy: { full: lucyRepresentative, nonLimited: lucyRepresentative },
  zhuYuan: { full: zhuYuanRepresentative('full'), nonLimited: zhuYuanRepresentative('nonLimited') },
  nicole: { full: nicoleRepresentative, nonLimited: nicoleRepresentative },
  orphie: { full: orphieRepresentative('full'), nonLimited: orphieRepresentative('nonLimited') },
  pulchra: { full: pulchraRepresentative('full'), nonLimited: pulchraRepresentative('nonLimited') },
  harumasa: { full: harumasaRepresentative('full'), nonLimited: harumasaRepresentative('nonLimited') },
  qingyi: { full: qingyiRepresentative('full'), nonLimited: qingyiRepresentative('nonLimited') },
  nekomata: { full: nekomataRepresentative(), nonLimited: nekomataRepresentative() },
  billy: { full: billyRepresentative('full'), nonLimited: billyRepresentative('nonLimited') },
  ben: { full: benRepresentative, nonLimited: benRepresentative },
  koleda: { full: koledaRepresentative, nonLimited: koledaRepresentative },
  anby: { full: anbyRepresentative, nonLimited: anbyRepresentative },
  caesar: { full: caesarRepresentative('full'), nonLimited: caesarRepresentative('nonLimited') },
  yeShunguang: {
    full: yeShunguangRepresentative('full'),
    nonLimited: yeShunguangRepresentative('nonLimited'),
  },
  zhao: { full: zhaoRepresentative('full'), nonLimited: zhaoRepresentative('nonLimited') },
  grace: { full: graceRepresentative('full'), nonLimited: graceRepresentative('nonLimited') },
  piper: { full: piperRepresentative('full'), nonLimited: piperRepresentative('nonLimited') },
  yuzuha: { full: yuzuhaRepresentative('full'), nonLimited: yuzuhaRepresentative('nonLimited') },
  burnice: { full: burniceRepresentative('full'), nonLimited: burniceRepresentative('nonLimited') },
  jane: { full: janeRepresentative('full'), nonLimited: janeRepresentative('nonLimited') },
  seth: { full: sethRepresentative, nonLimited: sethRepresentative },
  yanagi: { full: yanagiRepresentative('full'), nonLimited: yanagiRepresentative('nonLimited') },
  alice: { full: aliceRepresentative('full'), nonLimited: aliceRepresentative('nonLimited') },
  vivian: { full: vivianRepresentative('full'), nonLimited: vivianRepresentative('nonLimited') },
  aria: { full: ariaRepresentative('full'), nonLimited: ariaRepresentative('nonLimited') },
  promeia: { full: promeiaRepresentative('full'), nonLimited: promeiaRepresentative('nonLimited') },
  sunna: { full: sunnaRepresentative('full'), nonLimited: sunnaRepresentative('nonLimited') },
  nangongYu: { full: nangongYuRepresentative('full'), nonLimited: nangongYuRepresentative('nonLimited') },
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
  if (agentId === 'ellen') return ellenRepresentative(pool)
  if (agentId === 'zhuYuan') return zhuYuanRepresentative(pool)
  return representative
}
