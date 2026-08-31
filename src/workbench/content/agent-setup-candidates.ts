import { W_ENGINES } from './engines'
import type {
  AgentId,
  CandidateInputAdditions,
  CandidateOperationOpportunity,
  DiscId,
  EngineId,
  MindscapeRank,
  PoolId,
} from './types'

const enginePools = (
  fullCandidates: readonly EngineId[],
): Record<PoolId, EngineId[]> => {
  const full = [...fullCandidates]
  return {
    full,
    nonLimited: full.filter((engineId) => !W_ENGINES[engineId].limited),
  }
}

const ENGINE_CANDIDATES_BY_AGENT: Record<AgentId, readonly EngineId[]> = {
  pyrois: ['solExuvia', 'cordisGermina'],
  norma: ['chiefSidekick', 'yesterdayCalls', 'blazingLaurel', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
  yixuan: ['qingming', 'cauldron', 'radiowave', 'puzzleSphere'],
  yidhari: ['krakensCradle', 'grillOWisp', 'cauldron', 'qingming'],
  manato: ['grillOWisp', 'wrathfulVajra', 'qingming'],
  hugo: ['myriadEclipse', 'cordisGermina', 'heartstringNocturne', 'solExuvia', 'steelCushion', 'marcatoDesire'],
  juFufu: ['roaringFurnace', 'blazingLaurel', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
  panYinhu: ['tusksOfFury', 'tremorTrigramVessel', 'springEmbrace'],
  banyue: ['wrathfulVajra', 'qingming', 'cauldron', 'grillOWisp', 'puzzleSphere'],
  starlightBilly: ['starlightRiderFaceplate', 'qingming', 'cauldron', 'grillOWisp', 'puzzleSphere'],
  dialyn: ['yesterdayCalls', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
  lucia: ['dreamlitHearth', 'weepingCradle', 'kaboom', 'unfetteredGameBall'],
  anbySoldier0: ['severedInnocence', 'cordisGermina', 'heartstringNocturne', 'solExuvia', 'brimstone', 'marcatoDesire'],
  trigger: [
    'spectralGaze',
    'yesterdayCalls', 'blazingLaurel', 'iceJadeTeapot', 'restrained',
    'hellfireGears', 'preciousFossilizedCore', 'steamOven',
  ],
  astraYao: ['elegantVanity', 'bashfulDemon', 'theVault', 'kaboom'],
  seed: ['cordisGermina', 'heartstringNocturne', 'severedInnocence', 'solExuvia', 'brimstone', 'marcatoDesire'],
  cissia: ['serpentineSeeker', 'bellicoseBlaze', 'drillRigRedAxis', 'cordisGermina'],
  evelyn: ['heartstringNocturne', 'severedInnocence', 'cordisGermina', 'solExuvia', 'brimstone', 'steelCushion'],
  corin: ['cordisGermina', 'heartstringNocturne', 'steelCushion', 'solExuvia', 'housekeeper'],
  lycaon: ['blazingLaurel', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
  ellen: ['deepSeaVisitor', 'myriadEclipse', 'cordisGermina', 'solExuvia', 'brimstone', 'marcatoDesire'],
  soukaku: ['weepingCradle', 'kaboom'],
  soldier11: ['heartstringNocturne', 'cordisGermina', 'severedInnocence', 'solExuvia', 'brimstone', 'marcatoDesire'],
  lighter: ['blazingLaurel', 'iceJadeTeapot', 'hellfireGears', 'steamOven', 'restrained', 'preciousFossilizedCore'],
  lucy: ['elegantVanity', 'weepingCradle', 'kaboom'],
  zhuYuan: ['solExuvia', 'cordisGermina', 'heartstringNocturne', 'riotSuppressorMarkVI', 'brimstone', 'marcatoDesire'],
  nicole: ['elegantVanity', 'theVault', 'weepingCradle', 'kaboom', 'unfetteredGameBall'],
  orphie: ['bellicoseBlaze', 'heartstringNocturne', 'serpentineSeeker', 'solExuvia', 'gildedBlossom', 'marcatoDesire'],
  pulchra: [
    'blazingLaurel',
    'boxCutter', 'hellfireGears', 'steamOven', 'preciousFossilizedCore',
  ],
  harumasa: ['zanshinHerbCase', 'cordisGermina', 'heartstringNocturne', 'solExuvia', 'brimstone'],
  qingyi: ['iceJadeTeapot', 'blazingLaurel', 'restrained', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
  nekomata: ['steelCushion', 'solExuvia', 'heartstringNocturne', 'cordisGermina', 'cloudcleaveRadiance', 'brimstone'],
  billy: ['cloudcleaveRadiance', 'solExuvia', 'heartstringNocturne', 'cordisGermina', 'brimstone', 'steelCushion', 'starlightEngineReplica'],
  ben: ['tremorTrigramVessel', 'tusksOfFury', 'cloudcleaveRadiance', 'hailstormShrine', 'bigCylinder', 'springEmbrace'],
  koleda: ['hellfireGears', 'restrained', 'steamOven', 'preciousFossilizedCore'],
  anby: ['hellfireGears', 'restrained', 'steamOven', 'preciousFossilizedCore'],
  caesar: ['tusksOfFury', 'hellfireGears', 'springEmbrace'],
  yeShunguang: [
    'cloudcleaveRadiance', 'severedInnocence', 'brimstone',
  ],
  zhao: ['halfSugarBunny', 'tusksOfFury', 'originalTransmorpher'],
  grace: [
    'timeweaver', 'practicedPerfection',
    'fusionCompiler', 'electroLipGloss', 'weepingGemini',
  ],
  piper: [
    'practicedPerfection', 'sharpenedStinger', 'electroLipGloss',
    'weepingGemini', 'roaringRide',
  ],
  yuzuha: ['metanukimorphosis', 'thoughtbop', 'weepingCradle', 'kaboom', 'unfetteredGameBall'],
  sunna: ['thoughtbop', 'weepingCradle', 'kaboom', 'unfetteredGameBall'],
  burnice: ['flamemakerShaker', 'practicedPerfection', 'fusionCompiler', 'weepingGemini'],
  jane: ['practicedPerfection', 'sharpenedStinger', 'fusionCompiler', 'electroLipGloss', 'weepingGemini'],
  seth: ['peacekeeperSpecialized', 'tusksOfFury', 'springEmbrace'],
  yanagi: ['timeweaver', 'practicedPerfection', 'fusionCompiler', 'electroLipGloss', 'weepingGemini'],
  alice: ['practicedPerfection', 'sharpenedStinger', 'fusionCompiler', 'electroLipGloss', 'weepingGemini'],
  vivian: ['flightOfFancy', 'angelInTheShell', 'weepingGemini'],
  aria: ['angelInTheShell', 'flightOfFancy', 'electroLipGloss', 'weepingGemini', 'fusionCompiler'],
  promeia: ['frostfallSickle', 'fusionCompiler', 'angelInTheShell', 'weepingGemini'],
  nangongYu: ['neonFantasies', 'hellfireGears', 'simmeringPot', 'preciousFossilizedCore', 'roaringFurnace'],
  miyabi: ['hailstormShrine', 'fusionCompiler'],
  anton: ['cordisGermina', 'severedInnocence', 'solExuvia', 'brimstone', 'marcatoDesire', 'drillRigRedAxis'],
  rina: ['weepingCradle', 'kaboom', 'unfetteredGameBall'],
}

export const ENGINE_IDS_BY_AGENT_AND_POOL = Object.fromEntries(
  (Object.entries(ENGINE_CANDIDATES_BY_AGENT) as Array<[
    AgentId,
    readonly EngineId[],
  ]>).map(([agentId, candidates]) => [agentId, enginePools(candidates)]),
) as Record<AgentId, Record<PoolId, EngineId[]>>

export type AgentDiscCandidatePolicy = {
  fourPiece: DiscId[]
  twoPiece: DiscId[]
  contextualFourPiece?: readonly {
    opportunity: CandidateOperationOpportunity
    discId: DiscId
    minimumMindscape?: MindscapeRank
    prepareWhenActive?: true
  }[]
  selectedFourPiece?: Partial<Record<DiscId, CandidateInputAdditions>>
}

export const DISC_IDS_BY_AGENT_AND_PIECE: Record<AgentId, AgentDiscCandidatePolicy> = {
  pyrois: {
    fourPiece: ['skyAblaze', 'pufferElectro'],
    twoPiece: ['pufferElectro', 'woodpecker', 'branchAndBlade', 'chaoticMetal', 'hormonePunk'],
  },
  norma: { fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz'] },
  yixuan: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'chaoticMetal'] },
  yidhari: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'polarMetal'] },
  manato: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal'] },
  hugo: {
    fourPiece: ['hormonePunk', 'woodpecker'],
    twoPiece: ['polarMetal', 'woodpecker', 'branchAndBlade', 'pufferElectro', 'astralVoice', 'hormonePunk'],
    contextualFourPiece: [{
      opportunity: 'received-ultimate', discId: 'pufferElectro', minimumMindscape: 2,
    }],
  },
  juFufu: {
    fourPiece: ['king', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
    selectedFourPiece: {
      king: {
        twoPiece: ['woodpecker'],
        mainStats: { slot4: ['critRate'] },
        substats: ['critRate'],
      },
    },
  },
  panYinhu: {
    fourPiece: ['astralVoice', 'bunnyInWonderland'],
    twoPiece: ['swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
  },
  banyue: {
    fourPiece: ['yunkui'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal'],
  },
  starlightBilly: {
    fourPiece: ['yunkui'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'whiteWaterBallad'],
  },
  dialyn: { fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz'] },
  lucia: { fourPiece: ['moonlight'], twoPiece: ['yunkui', 'swingJazz'] },
  anbySoldier0: {
    fourPiece: ['shadowHarmony'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'pufferElectro', 'thunderMetal', 'hormonePunk'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  trigger: {
    fourPiece: ['king', 'astralVoice', 'shockstar'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: { twoPiece: ['woodpecker'], substats: ['critRate'] },
    },
  },
  astraYao: { fourPiece: ['astralVoice', 'moonlight'], twoPiece: ['moonlight', 'swingJazz', 'hormonePunk', 'astralVoice'] },
  seed: {
    fourPiece: ['dawnsBloom', 'woodpecker'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'dawnsBloom', 'pufferElectro', 'thunderMetal', 'hormonePunk'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  cissia: {
    fourPiece: ['dawnsBloom', 'thunderMetal', 'astralVoice'],
    twoPiece: ['swingJazz', 'woodpecker', 'branchAndBlade', 'dawnsBloom', 'thunderMetal', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [
      { opportunity: 'received-ultimate', discId: 'pufferElectro' },
      {
        opportunity: 'repeated-quick-assist',
        discId: 'astralVoice',
        prepareWhenActive: true,
      },
    ],
  },
  evelyn: {
    fourPiece: ['hormonePunk', 'woodpecker'],
    twoPiece: ['branchAndBlade', 'infernoMetal', 'woodpecker', 'pufferElectro', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [
      { opportunity: 'received-ultimate', discId: 'pufferElectro' },
      { opportunity: 'repeated-quick-assist', discId: 'astralVoice' },
    ],
  },
  corin: {
    fourPiece: ['hormonePunk', 'woodpecker'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'fangedMetal', 'pufferElectro', 'astralVoice', 'hormonePunk'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  lycaon: {
    fourPiece: ['king', 'astralVoice', 'shockstar'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: {
        twoPiece: ['woodpecker'],
        mainStats: { slot4: ['critRate'] },
        substats: ['critRate'],
      },
    },
  },
  ellen: {
    fourPiece: ['woodpecker', 'polarMetal', 'shadowHarmony'],
    twoPiece: ['pufferElectro', 'polarMetal', 'woodpecker', 'branchAndBlade', 'astralVoice', 'hormonePunk'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  soukaku: { fourPiece: ['moonlight', 'astralVoice', 'freedomBlues'], twoPiece: ['swingJazz', 'moonlight', 'hormonePunk', 'astralVoice'] },
  soldier11: {
    fourPiece: ['woodpecker', 'dawnsBloom', 'infernoMetal'],
    twoPiece: ['infernoMetal', 'woodpecker', 'branchAndBlade', 'dawnsBloom', 'pufferElectro', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  lighter: {
    fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: {
        twoPiece: ['woodpecker'],
        mainStats: { slot4: ['critRate'] },
        substats: ['critRate'],
      },
    },
  },
  lucy: {
    fourPiece: ['moonlight', 'astralVoice'], twoPiece: ['swingJazz', 'moonlight'],
  },
  zhuYuan: {
    fourPiece: ['chaoticMetal', 'skyAblaze', 'dawnsBloom'],
    twoPiece: ['chaoticMetal', 'woodpecker', 'branchAndBlade', 'dawnsBloom', 'pufferElectro', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  nicole: {
    fourPiece: ['moonlight', 'astralVoice', 'freedomBlues'],
    twoPiece: ['swingJazz', 'moonlight'],
  },
  orphie: {
    fourPiece: ['shadowHarmony', 'astralVoice'],
    twoPiece: ['shadowHarmony', 'infernoMetal', 'woodpecker', 'branchAndBlade', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
  },
  pulchra: {
    fourPiece: ['king', 'astralVoice', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: {
        twoPiece: ['woodpecker'],
        mainStats: { slot4: ['critRate'] },
        substats: ['critRate'],
      },
    },
  },
  harumasa: {
    fourPiece: ['shadowHarmony', 'thunderMetal', 'woodpecker', 'hormonePunk'],
    twoPiece: ['shadowHarmony', 'thunderMetal', 'woodpecker', 'branchAndBlade', 'hormonePunk', 'astralVoice', 'pufferElectro'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  qingyi: {
    fourPiece: ['king', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    contextualFourPiece: [{ opportunity: 'external-quick-assist', discId: 'astralVoice' }],
    selectedFourPiece: {
      king: {
        twoPiece: ['woodpecker'],
        mainStats: { slot4: ['critRate'] },
        substats: ['critRate'],
      },
    },
  },
  nekomata: {
    fourPiece: ['woodpecker'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'fangedMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  billy: {
    fourPiece: ['woodpecker', 'shadowHarmony', 'dawnsBloom'],
    twoPiece: ['shadowHarmony', 'woodpecker', 'branchAndBlade', 'fangedMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  ben: {
    fourPiece: ['woodpecker', 'astralVoice', 'bunnyInWonderland', 'swingJazz'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal', 'pufferElectro', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  koleda: {
    fourPiece: ['king', 'astralVoice', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: { mainStats: { slot4: ['critRate'] }, substats: ['critRate'] },
    },
  },
  anby: {
    fourPiece: ['king', 'astralVoice', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
    selectedFourPiece: {
      king: { mainStats: { slot4: ['critRate'] }, substats: ['critRate'] },
    },
  },
  caesar: {
    fourPiece: ['bunnyInWonderland', 'freedomBlues'],
    twoPiece: ['swingJazz', 'shockstar', 'king'],
    contextualFourPiece: [{ opportunity: 'repeated-quick-assist', discId: 'astralVoice' }],
  },
  yeShunguang: {
    fourPiece: ['whiteWaterBallad'],
    twoPiece: [
      'whiteWaterBallad', 'fangedMetal', 'woodpecker', 'branchAndBlade',
      'pufferElectro', 'hormonePunk', 'astralVoice',
    ],
  },
  zhao: {
    fourPiece: ['bunnyInWonderland', 'astralVoice'],
    twoPiece: ['bunnyInWonderland', 'yunkui', 'swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
  },
  grace: {
    fourPiece: ['thunderMetal', 'chaosJazz', 'freedomBlues'],
    twoPiece: [
      'pufferElectro', 'phaethonsMelody', 'freedomBlues', 'chaosJazz',
      'hormonePunk', 'astralVoice', 'thunderMetal',
    ],
  },
  piper: {
    fourPiece: ['fangedMetal', 'freedomBlues'],
    twoPiece: ['phaethonsMelody', 'freedomBlues', 'chaosJazz', 'fangedMetal', 'whiteWaterBallad', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  yuzuha: {
    fourPiece: ['moonlight', 'astralVoice', 'freedomBlues'],
    twoPiece: ['phaethonsMelody', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
  },
  burnice: {
    fourPiece: ['chaosJazz', 'freedomBlues'],
    twoPiece: ['swingJazz', 'moonlight', 'phaethonsMelody', 'pufferElectro', 'freedomBlues', 'chaosJazz', 'infernoMetal', 'hormonePunk', 'astralVoice'],
  },
  jane: {
    fourPiece: ['fangedMetal', 'freedomBlues'],
    twoPiece: ['pufferElectro', 'phaethonsMelody', 'freedomBlues', 'chaosJazz', 'fangedMetal', 'whiteWaterBallad', 'hormonePunk', 'astralVoice'],
  },
  seth: {
    fourPiece: ['astralVoice', 'swingJazz', 'bunnyInWonderland', 'freedomBlues'],
    twoPiece: ['swingJazz', 'moonlight'],
  },
  yanagi: {
    fourPiece: ['chaosJazz', 'thunderMetal', 'freedomBlues'],
    twoPiece: ['freedomBlues', 'chaosJazz', 'pufferElectro', 'phaethonsMelody', 'thunderMetal', 'hormonePunk', 'astralVoice'],
  },
  alice: {
    fourPiece: ['fangedMetal', 'freedomBlues', 'hormonePunk'],
    twoPiece: ['phaethonsMelody', 'pufferElectro', 'freedomBlues', 'chaosJazz', 'fangedMetal', 'whiteWaterBallad', 'hormonePunk', 'astralVoice'],
  },
  vivian: {
    fourPiece: ['phaethonsMelody'],
    twoPiece: ['freedomBlues', 'chaosJazz', 'shiningAria', 'chaoticMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  aria: {
    fourPiece: ['phaethonsMelody', 'shiningAria'],
    twoPiece: ['phaethonsMelody', 'freedomBlues', 'chaosJazz', 'shiningAria', 'chaoticMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  promeia: {
    fourPiece: ['notesFromTheChained'],
    twoPiece: ['phaethonsMelody', 'freedomBlues', 'chaosJazz', 'polarMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  sunna: {
    fourPiece: ['moonlight', 'astralVoice'],
    twoPiece: ['swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
  },
  nangongYu: {
    fourPiece: ['phaethonsMelody', 'freedomBlues'],
    twoPiece: ['phaethonsMelody', 'freedomBlues', 'chaosJazz', 'shiningAria', 'chaoticMetal', 'hormonePunk', 'astralVoice', 'pufferElectro'],
  },
  miyabi: {
    fourPiece: ['branchAndBlade'],
    twoPiece: ['polarMetal', 'woodpecker', 'pufferElectro', 'dawnsBloom', 'hormonePunk', 'phaethonsMelody'],
  },
  anton: {
    fourPiece: ['thunderMetal', 'dawnsBloom', 'hormonePunk'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'thunderMetal', 'dawnsBloom', 'pufferElectro', 'hormonePunk'],
    contextualFourPiece: [{ opportunity: 'received-ultimate', discId: 'pufferElectro' }],
  },
  rina: { fourPiece: ['moonlight', 'astralVoice', 'freedomBlues'], twoPiece: ['pufferElectro'] },
}
