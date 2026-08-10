import cauldronImage from '../../assets/equipment/w-engines/cauldron-of-clarity.webp'
import bashfulDemonImage from '../../assets/equipment/w-engines/bashful-demon.webp'
import brimstoneImage from '../../assets/equipment/w-engines/the-brimstone.webp'
import cordisGerminaImage from '../../assets/equipment/w-engines/cordis-germina.webp'
import dreamlitImage from '../../assets/equipment/w-engines/dreamlit-hearth.webp'
import drillRigImage from '../../assets/equipment/w-engines/drill-rig-red-axis.webp'
import elegantVanityImage from '../../assets/equipment/w-engines/elegant-vanity.webp'
import hellfireImage from '../../assets/equipment/w-engines/hellfire-gears.webp'
import iceJadeTeapotImage from '../../assets/equipment/w-engines/ice-jade-teapot.webp'
import kaboomImage from '../../assets/equipment/w-engines/kaboom-the-cannon.webp'
import marcatoDesireImage from '../../assets/equipment/w-engines/marcato-desire.webp'
import preciousFossilizedCoreImage from '../../assets/equipment/w-engines/precious-fossilized-core.webp'
import puzzleSphereImage from '../../assets/equipment/w-engines/puzzle-sphere.webp'
import qingmingImage from '../../assets/equipment/w-engines/qingming-birdcage.webp'
import radiowaveImage from '../../assets/equipment/w-engines/radiowave-journey.webp'
import serpentineSeekerImage from '../../assets/equipment/w-engines/serpentine-seeker.webp'
import restrainedImage from '../../assets/equipment/w-engines/the-restrained.webp'
import severedInnocenceImage from '../../assets/equipment/w-engines/severed-innocence.webp'
import spectralGazeImage from '../../assets/equipment/w-engines/spectral-gaze.webp'
import starlightEngineImage from '../../assets/equipment/w-engines/starlight-engine.webp'
import steamOvenImage from '../../assets/equipment/w-engines/steam-oven.webp'
import thoughtbopImage from '../../assets/equipment/w-engines/thoughtbop.webp'
import unfetteredImage from '../../assets/equipment/w-engines/unfettered-game-ball.webp'
import weepingCradleImage from '../../assets/equipment/w-engines/weeping-cradle.webp'
import yesterdayCallsImage from '../../assets/equipment/w-engines/yesterday-calls.webp'
import {
  scaledEngineValue,
  type AgentId,
  type EngineId,
  type PoolId,
  type Refinement,
  type WEngineChoice,
} from './types'

const percent = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}%`
const perSecond = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}/s`

export const W_ENGINE_FACTS = {
  qingming: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    critRate: 20,
    etherDmg: 16,
    actionSheerDmg: 20,
  },
  cauldron: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    dmg: 12,
    critRate: 6.5,
  },
  radiowave: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    sheerForce: 240,
  },
  puzzleSphere: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    critDmg: 16,
    actionExDmg: 20,
  },
  yesterdayCalls: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    energyPerSecond: 1.5,
    daze: 27,
    squadCritDmg: 30,
  },
  hellfireGears: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    energyPerSecond: 0.6,
    impact: 20,
  },
  steamOven: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    impact: 16,
  },
  dreamlitHearth: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    energyPerSecond: 0.4,
    hpPct: 15,
    squadDmg: 25,
  },
  thoughtbop: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    energyPerSecond: 0.6,
    squadDmgPerStack: 12.5,
    squadAtkPct: 10,
  },
  weepingCradle: {
    advancedStat: { id: 'penRatio', label: 'PEN Ratio', value: 24, unit: '%' },
    energyPerSecond: 0.6,
    squadDmg: 20.2,
  },
  kaboom: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    squadAtkPct: 10,
  },
  unfetteredGameBall: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    squadCritRateBase: 10,
    squadCritRatePerRefinement: 2,
  },
  severedInnocence: { advancedStat: { id: 'critDmg', label: 'CRIT DMG', value: 48, unit: '%' }, combatCritDmg: 30, stackCritDmg: 10, electricDmg: 20 },
  cordisGermina: { advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' }, critRate: 15, electricDmgPerStack: 12.5, defIgnore: 20 },
  marcatoDesire: { advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 20, unit: '%' }, atkPctPerClause: 6 },
  starlightEngine: { advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' }, atkPct: 12 },
  spectralGaze: { advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' }, defReduction: 25, impactPerStack: 4, impactAtMax: 8 },
  iceJadeTeapot: { advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' }, impactPerStack: 0.7, dmg: 20 },
  restrained: { advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' }, dmgPerStack: 6, dazePerStack: 6 },
  preciousFossilizedCore: { advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' }, dazePerThreshold: 10 },
  elegantVanity: { advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' }, energy: 5, dmgPerStack: 10 },
  bashfulDemon: { advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' }, atkPctPerStack: 2 },
  brimstone: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    atkPerStack: [3.5, 4.4, 5.2, 6, 7],
    atkAtMax: [28, 35.2, 41.6, 48, 56],
  },
  serpentineSeeker: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    critRate: [25, 28.8, 32.5, 36.3, 40],
    electricDefIgnore: [28, 31.5, 35, 38.5, 42],
  },
  drillRigRedAxis: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    basicDashElectricDmg: [50, 57.5, 65, 72.5, 80],
  },
} as const

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming', name: 'Qingming Birdcage', rank: 'S', limited: true, baseAtk: 743,
    advancedStat: W_ENGINE_FACTS.qingming.advancedStat, image: qingmingImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.qingming.critRate, refinement)}`,
      `Ether DMG +${percent(W_ENGINE_FACTS.qingming.etherDmg, refinement)}`,
      `EX Special & Ultimate \u00B7 Ether Sheer DMG +${percent(W_ENGINE_FACTS.qingming.actionSheerDmg, refinement)}`,
    ],
  },
  cauldron: {
    id: 'cauldron', name: 'Cauldron of Clarity', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.cauldron.advancedStat, image: cauldronImage,
    passiveLines: (refinement) => [
      `DMG +${percent(W_ENGINE_FACTS.cauldron.dmg, refinement)}`,
      `CRIT Rate +${percent(W_ENGINE_FACTS.cauldron.critRate, refinement)}`,
    ],
  },
  radiowave: {
    id: 'radiowave', name: 'Radiowave Journey', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.radiowave.advancedStat, image: radiowaveImage,
    passiveLines: (refinement) => [
      `Sheer Force +${scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, refinement)}`,
    ],
  },
  puzzleSphere: {
    id: 'puzzleSphere', name: 'Puzzle Sphere', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.puzzleSphere.advancedStat, image: puzzleSphereImage,
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.puzzleSphere.critDmg, refinement)}`,
      `EX Special Attack \u00B7 DMG +${percent(W_ENGINE_FACTS.puzzleSphere.actionExDmg, refinement)}`,
    ],
  },
  yesterdayCalls: {
    id: 'yesterdayCalls', name: 'Yesterday Calls', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.yesterdayCalls.advancedStat, image: yesterdayCallsImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)}`,
      `Daze +${percent(W_ENGINE_FACTS.yesterdayCalls.daze, refinement)}`,
      `Squad CRIT DMG +${percent(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, refinement)}`,
    ],
  },
  hellfireGears: {
    id: 'hellfireGears', name: 'Hellfire Gears', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.hellfireGears.advancedStat, image: hellfireImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement)}`,
      `Impact +${percent(W_ENGINE_FACTS.hellfireGears.impact, refinement)}`,
    ],
  },
  steamOven: {
    id: 'steamOven', name: 'Steam Oven', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.steamOven.advancedStat, image: steamOvenImage,
    passiveLines: (refinement) => [`Impact +${percent(W_ENGINE_FACTS.steamOven.impact, refinement)}`],
  },
  dreamlitHearth: {
    id: 'dreamlitHearth', name: 'Dreamlit Hearth', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.dreamlitHearth.advancedStat, image: dreamlitImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.dreamlitHearth.energyPerSecond, refinement)}`,
      `Max HP +${percent(W_ENGINE_FACTS.dreamlitHearth.hpPct, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.dreamlitHearth.squadDmg, refinement)}`,
    ],
  },
  thoughtbop: {
    id: 'thoughtbop', name: 'Thoughtbop', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.thoughtbop.advancedStat, image: thoughtbopImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.thoughtbop.energyPerSecond, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.thoughtbop.squadDmgPerStack * 2, refinement)}`,
      `Squad ATK +${percent(W_ENGINE_FACTS.thoughtbop.squadAtkPct, refinement)}`,
    ],
  },
  weepingCradle: {
    id: 'weepingCradle', name: 'Weeping Cradle', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.weepingCradle.advancedStat, image: weepingCradleImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.weepingCradle.energyPerSecond, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.weepingCradle.squadDmg, refinement)}`,
    ],
  },
  kaboom: {
    id: 'kaboom', name: 'Kaboom the Cannon', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.kaboom.advancedStat, image: kaboomImage,
    passiveLines: (refinement) => [`Squad ATK +${percent(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement)}`],
  },
  unfetteredGameBall: {
    id: 'unfetteredGameBall', name: 'Unfettered Game Ball', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.unfetteredGameBall.advancedStat, image: unfetteredImage,
    passiveLines: (refinement) => [
      `Squad CRIT Rate +${W_ENGINE_FACTS.unfetteredGameBall.squadCritRateBase + refinement * W_ENGINE_FACTS.unfetteredGameBall.squadCritRatePerRefinement}%`,
    ],
  },
  severedInnocence: { id: 'severedInnocence', name: 'Severed Innocence', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.severedInnocence.advancedStat, image: severedInnocenceImage, passiveLines: (refinement) => [`CRIT DMG +${percent(W_ENGINE_FACTS.severedInnocence.combatCritDmg + W_ENGINE_FACTS.severedInnocence.stackCritDmg * 3, refinement)}`, `Electric DMG +${percent(W_ENGINE_FACTS.severedInnocence.electricDmg, refinement)}`] },
  cordisGermina: { id: 'cordisGermina', name: 'Cordis Germina', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.cordisGermina.advancedStat, image: cordisGerminaImage, passiveLines: (refinement) => [`CRIT Rate +${percent(W_ENGINE_FACTS.cordisGermina.critRate, refinement)}`, `Electric DMG +${percent(W_ENGINE_FACTS.cordisGermina.electricDmgPerStack * 2, refinement)}`, `Basic Attack & Ultimate DEF Ignore +${percent(W_ENGINE_FACTS.cordisGermina.defIgnore, refinement)}`] },
  marcatoDesire: { id: 'marcatoDesire', name: 'Marcato Desire', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.marcatoDesire.advancedStat, image: marcatoDesireImage, passiveLines: (refinement) => [`ATK +${percent(W_ENGINE_FACTS.marcatoDesire.atkPctPerClause * 2, refinement)}`] },
  starlightEngine: { id: 'starlightEngine', name: 'Starlight Engine', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.starlightEngine.advancedStat, image: starlightEngineImage, passiveLines: (refinement) => [`ATK +${percent(W_ENGINE_FACTS.starlightEngine.atkPct, refinement)}`] },
  spectralGaze: { id: 'spectralGaze', name: 'Spectral Gaze', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.spectralGaze.advancedStat, image: spectralGazeImage, passiveLines: (refinement) => [`Enemy DEF Reduction +${percent(W_ENGINE_FACTS.spectralGaze.defReduction, refinement)}`, `Impact +${percent(W_ENGINE_FACTS.spectralGaze.impactPerStack * 3 + W_ENGINE_FACTS.spectralGaze.impactAtMax, refinement)}`] },
  iceJadeTeapot: { id: 'iceJadeTeapot', name: 'Ice-Jade Teapot', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.iceJadeTeapot.advancedStat, image: iceJadeTeapotImage, passiveLines: (refinement) => [`Impact +${percent(W_ENGINE_FACTS.iceJadeTeapot.impactPerStack * 30, refinement)}`, `Squad DMG +${percent(W_ENGINE_FACTS.iceJadeTeapot.dmg, refinement)}`] },
  restrained: { id: 'restrained', name: 'The Restrained', rank: 'S', limited: false, baseAtk: 684, advancedStat: W_ENGINE_FACTS.restrained.advancedStat, image: restrainedImage, passiveLines: (refinement) => [`Basic Attack DMG +${percent(W_ENGINE_FACTS.restrained.dmgPerStack * 5, refinement)}`, `Basic Attack Daze +${percent(W_ENGINE_FACTS.restrained.dazePerStack * 5, refinement)}`] },
  preciousFossilizedCore: { id: 'preciousFossilizedCore', name: 'Precious Fossilized Core', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.preciousFossilizedCore.advancedStat, image: preciousFossilizedCoreImage, passiveLines: (refinement) => [`Target HP ≥50% \u00B7 Daze +${percent(W_ENGINE_FACTS.preciousFossilizedCore.dazePerThreshold, refinement)}`, `Target HP ≥75% \u00B7 Daze +${percent(W_ENGINE_FACTS.preciousFossilizedCore.dazePerThreshold * 2, refinement)} total`] },
  elegantVanity: { id: 'elegantVanity', name: 'Elegant Vanity', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.elegantVanity.advancedStat, image: elegantVanityImage, passiveLines: (refinement) => [`Energy +${W_ENGINE_FACTS.elegantVanity.energy}`, `Squad DMG +${percent(W_ENGINE_FACTS.elegantVanity.dmgPerStack * 2, refinement)}`] },
  bashfulDemon: { id: 'bashfulDemon', name: 'Bashful Demon', rank: 'A', limited: false, baseAtk: 624, advancedStat: W_ENGINE_FACTS.bashfulDemon.advancedStat, image: bashfulDemonImage, passiveLines: (refinement) => [`Squad ATK +${percent(W_ENGINE_FACTS.bashfulDemon.atkPctPerStack * 4, refinement)}`] },
  brimstone: {
    id: 'brimstone', name: 'The Brimstone', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.brimstone.advancedStat, image: brimstoneImage,
    passiveLines: (refinement) => [`ATK +${W_ENGINE_FACTS.brimstone.atkAtMax[refinement - 1]}%`],
  },
  serpentineSeeker: {
    id: 'serpentineSeeker', name: 'Serpentine Seeker', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.serpentineSeeker.advancedStat, image: serpentineSeekerImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${W_ENGINE_FACTS.serpentineSeeker.critRate[refinement - 1]}%`,
      `Electric DMG \u00B7 DEF Ignore +${W_ENGINE_FACTS.serpentineSeeker.electricDefIgnore[refinement - 1]}%`,
    ],
  },
  drillRigRedAxis: {
    id: 'drillRigRedAxis', name: 'Drill Rig - Red Axis', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.drillRigRedAxis.advancedStat, image: drillRigImage,
    passiveLines: (refinement) => [
      `Basic & Dash Attack Electric DMG +${W_ENGINE_FACTS.drillRigRedAxis.basicDashElectricDmg[refinement - 1]}%`,
    ],
  },
}

const enginePools = (full: EngineId[]): Record<PoolId, EngineId[]> => ({
  full,
  nonLimited: full.filter((engineId) => !W_ENGINES[engineId].limited),
})

export const ENGINE_IDS_BY_AGENT_AND_POOL: Record<AgentId, Record<PoolId, EngineId[]>> = {
  yixuan: enginePools(['qingming', 'cauldron', 'radiowave', 'puzzleSphere']),
  dialyn: enginePools(['yesterdayCalls', 'hellfireGears', 'steamOven', 'preciousFossilizedCore']),
  lucia: enginePools(['dreamlitHearth', 'thoughtbop', 'weepingCradle', 'kaboom', 'unfetteredGameBall']),
  anbySoldier0: enginePools(['severedInnocence', 'cordisGermina', 'marcatoDesire', 'starlightEngine']),
  trigger: enginePools(['spectralGaze', 'iceJadeTeapot', 'restrained', 'preciousFossilizedCore', 'steamOven']),
  astraYao: enginePools(['elegantVanity', 'bashfulDemon', 'kaboom']),
  seed: enginePools(['cordisGermina', 'severedInnocence', 'brimstone', 'marcatoDesire']),
  cissia: enginePools(['serpentineSeeker', 'drillRigRedAxis', 'cordisGermina']),
}
