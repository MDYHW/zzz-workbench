import cauldronImage from '../../assets/equipment/w-engines/cauldron-of-clarity.webp'
import bashfulDemonImage from '../../assets/equipment/w-engines/bashful-demon.webp'
import brimstoneImage from '../../assets/equipment/w-engines/the-brimstone.webp'
import cordisGerminaImage from '../../assets/equipment/w-engines/cordis-germina.webp'
import dreamlitImage from '../../assets/equipment/w-engines/dreamlit-hearth.webp'
import drillRigImage from '../../assets/equipment/w-engines/drill-rig-red-axis.webp'
import elegantVanityImage from '../../assets/equipment/w-engines/elegant-vanity.webp'
import hellfireImage from '../../assets/equipment/w-engines/hellfire-gears.webp'
import heartstringNocturneImage from '../../assets/equipment/w-engines/heartstring-nocturne.webp'
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
import steelCushionImage from '../../assets/equipment/w-engines/steel-cushion.webp'
import thoughtbopImage from '../../assets/equipment/w-engines/thoughtbop.webp'
import unfetteredImage from '../../assets/equipment/w-engines/unfettered-game-ball.webp'
import weepingCradleImage from '../../assets/equipment/w-engines/weeping-cradle.webp'
import yesterdayCallsImage from '../../assets/equipment/w-engines/yesterday-calls.webp'
import housekeeperImage from '../../assets/equipment/w-engines/housekeeper.webp'
import blazingLaurelImage from '../../assets/equipment/w-engines/blazing-laurel.webp'
import simmeringPotImage from '../../assets/equipment/w-engines/the-simmering-pot.webp'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  fixedRefinementValues,
  scaledRefinementValues,
  type AgentId,
  type EngineId,
  type EquipmentEffectFact,
  type PoolId,
  type Refinement,
  type WEngineChoice,
  type WEngineFacts,
} from './types'

const percent = (
  effect: EquipmentEffectFact,
  refinement: Refinement,
  maximum = false,
): string => `${maximum
  ? equipmentEffectMaximumValue(effect, refinement)
  : equipmentEffectBaseValue(effect, refinement)}%`

const perSecond = (effect: EquipmentEffectFact, refinement: Refinement): string =>
  `${equipmentEffectBaseValue(effect, refinement)}/s`

export const W_ENGINE_FACTS = {
  qingming: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: scaledRefinementValues(20) },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(16), scope: { attributes: ['Ether'] } },
      sheerDamage: { modifier: 'sheerDmgBonus', unit: '%', value: scaledRefinementValues(20), scope: { actions: ['EX Special Attack', 'Ultimate'], attributes: ['Ether'] } },
    },
  },
  cauldron: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    effects: {
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(12) },
      critRate: { modifier: 'critRate', unit: '%', value: scaledRefinementValues(6.5) },
    },
  },
  radiowave: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    effects: {
      sheerForce: { modifier: 'sheerForce', unit: '', value: scaledRefinementValues(240) },
    },
  },
  puzzleSphere: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      critDamage: { modifier: 'critDmg', unit: '%', value: scaledRefinementValues(16) },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(20), scope: { actions: ['EX Special Attack'] } },
    },
  },
  yesterdayCalls: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(1.5) },
      daze: { modifier: 'dazeBonus', unit: '%', value: scaledRefinementValues(27) },
      critDamage: { modifier: 'critDmg', unit: '%', value: scaledRefinementValues(30), scope: { recipient: 'squad' } },
    },
  },
  hellfireGears: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(0.6) },
      impact: { modifier: 'impact', unit: '%', value: scaledRefinementValues(20) },
    },
  },
  steamOven: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    effects: {
      impact: { modifier: 'impact', unit: '%', value: scaledRefinementValues(16) },
    },
  },
  dreamlitHearth: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(0.4) },
      maxHp: { modifier: 'maxHp', unit: '%', value: scaledRefinementValues(15) },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(25), scope: { recipient: 'squad' } },
    },
  },
  thoughtbop: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(0.6) },
      damage: { modifier: 'dmgBonus', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(12.5), maxStacks: 2, maximum: scaledRefinementValues(25) }, scope: { recipient: 'squad' } },
      atk: { modifier: 'atk', unit: '%', value: scaledRefinementValues(10), scope: { recipient: 'squad' } },
    },
  },
  weepingCradle: {
    advancedStat: { id: 'penRatio', label: 'PEN Ratio', value: 24, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(0.6) },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(20.2), scope: { recipient: 'squad' } },
    },
  },
  kaboom: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', value: scaledRefinementValues(10), scope: { recipient: 'squad' } },
    },
  },
  unfetteredGameBall: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [12, 14, 16, 18, 20], scope: { recipient: 'squad' } },
    },
  },
  severedInnocence: {
    advancedStat: { id: 'critDmg', label: 'CRIT DMG', value: 48, unit: '%' },
    effects: {
      critDamage: { modifier: 'critDmg', unit: '%', value: scaledRefinementValues(30), progression: { kind: 'stacks', perStack: scaledRefinementValues(10), maxStacks: 3 } },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(20), scope: { attributes: ['Electric'] } },
    },
  },
  cordisGermina: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: scaledRefinementValues(15) },
      damage: { modifier: 'dmgBonus', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(12.5), maxStacks: 2, maximum: scaledRefinementValues(25) }, scope: { attributes: ['Electric'] } },
      defIgnore: { modifier: 'defIgnore', unit: '%', value: scaledRefinementValues(20), scope: { recipient: 'enemy', actions: ['Basic Attack', 'Ultimate'] } },
    },
  },
  marcatoDesire: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 20, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', progression: { kind: 'conditions', perCondition: scaledRefinementValues(6), maxConditions: 2 } },
    },
  },
  starlightEngine: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', value: scaledRefinementValues(12) },
    },
  },
  spectralGaze: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      defReduction: { modifier: 'defReduction', unit: '%', value: scaledRefinementValues(25), scope: { recipient: 'enemy' } },
      impact: { modifier: 'impact', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(4), maxStacks: 3, atMaximum: scaledRefinementValues(8) } },
    },
  },
  iceJadeTeapot: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    effects: {
      impact: { modifier: 'impact', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(0.7), maxStacks: 30, maximum: scaledRefinementValues(21) } },
      damage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(20), scope: { recipient: 'squad' } },
    },
  },
  restrained: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    effects: {
      damage: { modifier: 'dmgBonus', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(6), maxStacks: 5 }, scope: { actions: ['Basic Attack'] } },
      daze: { modifier: 'dazeBonus', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(6), maxStacks: 5 }, scope: { actions: ['Basic Attack'] } },
    },
  },
  preciousFossilizedCore: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
    effects: {
      daze: { modifier: 'dazeBonus', unit: '%', progression: { kind: 'thresholds', perThreshold: scaledRefinementValues(10), thresholds: [50, 75] } },
    },
  },
  elegantVanity: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    effects: {
      energy: { modifier: 'energy', unit: '', value: fixedRefinementValues(5) },
      damage: { modifier: 'dmgBonus', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(10), maxStacks: 2 }, scope: { recipient: 'squad' } },
    },
  },
  bashfulDemon: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', progression: { kind: 'stacks', perStack: scaledRefinementValues(2), maxStacks: 4 }, scope: { recipient: 'squad' } },
    },
  },
  brimstone: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', progression: { kind: 'stacks', perStack: [3.5, 4.4, 5.2, 6, 7], maxStacks: 8 } },
    },
  },
  serpentineSeeker: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [25, 28.8, 32.5, 36.3, 40] },
      defIgnore: { modifier: 'defIgnore', unit: '%', value: [28, 31.5, 35, 38.5, 42], scope: { recipient: 'enemy', attributes: ['Electric'] } },
    },
  },
  drillRigRedAxis: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    effects: {
      damage: { modifier: 'dmgBonus', unit: '%', value: [50, 57.5, 65, 72.5, 80], scope: { actions: ['Basic Attack', 'Dash Attack'], attributes: ['Electric'] } },
    },
  },
  heartstringNocturne: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      critDamage: { modifier: 'critDmg', unit: '%', value: [50, 57.5, 65, 72.5, 80] },
      fireResIgnore: { modifier: 'resIgnore', unit: '%', progression: { kind: 'stacks', perStack: [12.5, 14.5, 16.5, 18.5, 20], maxStacks: 2 }, scope: { recipient: 'enemy', actions: ['Chain Attack', 'Ultimate'], attributes: ['Fire'] } },
    },
  },
  steelCushion: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      physicalDamage: { modifier: 'dmgBonus', unit: '%', value: [20, 25, 30, 35, 40], scope: { attributes: ['Physical'] } },
      damage: { modifier: 'dmgBonus', unit: '%', value: [25, 31.5, 38, 44, 50], scope: { condition: 'backAttack' } },
    },
  },
  housekeeper: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      energy: { modifier: 'energyRegen', unit: '/s', value: [0.45, 0.52, 0.58, 0.65, 0.72] },
      damage: { modifier: 'dmgBonus', unit: '%', progression: { kind: 'stacks', perStack: [3, 3.5, 4, 4.4, 4.8], maxStacks: 15 }, scope: { actions: ['EX Special Attack'], attributes: ['Physical'] } },
    },
  },
  blazingLaurel: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    effects: {
      impact: { modifier: 'impact', unit: '%', value: [25, 28.75, 32.5, 36.25, 40] },
      critDamage: { modifier: 'critDmg', unit: '%', progression: { kind: 'stacks', perStack: [1.5, 1.72, 1.95, 2.17, 2.4], maxStacks: 20 }, scope: { recipient: 'squad', attributes: ['Fire', 'Ice'] } },
    },
  },
  simmeringPot: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
    effects: {
      daze: { modifier: 'dazeBonus', unit: '%', value: [7.2, 8.2, 9.2, 10.2, 11.5], scope: { actions: ['Assist Follow-Up'] } },
      damage: { modifier: 'dmgBonus', unit: '%', value: [7.2, 8.2, 9.2, 10.2, 11.5], scope: { actions: ['Assist Follow-Up'] } },
    },
  },
} as const satisfies Record<EngineId, WEngineFacts>

/** Exact authored fields for one admitted W-Engine, derived from the fact source. */
export type WEngineFactContract<Id extends EngineId> = (typeof W_ENGINE_FACTS)[Id]
export type WEngineEffectField<Id extends EngineId> = keyof WEngineFactContract<Id>['effects']

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming', name: 'Qingming Birdcage', rank: 'S', limited: true, baseAtk: 743,
    advancedStat: W_ENGINE_FACTS.qingming.advancedStat, image: qingmingImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.qingming.effects.critRate, refinement)}`,
      `Ether DMG +${percent(W_ENGINE_FACTS.qingming.effects.damage, refinement)}`,
      `EX Special & Ultimate \u00B7 Ether Sheer DMG +${percent(W_ENGINE_FACTS.qingming.effects.sheerDamage, refinement)}`,
    ],
  },
  cauldron: {
    id: 'cauldron', name: 'Cauldron of Clarity', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.cauldron.advancedStat, image: cauldronImage,
    passiveLines: (refinement) => [
      `DMG +${percent(W_ENGINE_FACTS.cauldron.effects.damage, refinement)}`,
      `CRIT Rate +${percent(W_ENGINE_FACTS.cauldron.effects.critRate, refinement)}`,
    ],
  },
  radiowave: {
    id: 'radiowave', name: 'Radiowave Journey', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.radiowave.advancedStat, image: radiowaveImage,
    passiveLines: (refinement) => [
      `Sheer Force +${equipmentEffectBaseValue(W_ENGINE_FACTS.radiowave.effects.sheerForce, refinement)}`,
    ],
  },
  puzzleSphere: {
    id: 'puzzleSphere', name: 'Puzzle Sphere', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.puzzleSphere.advancedStat, image: puzzleSphereImage,
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, refinement)}`,
      `EX Special Attack \u00B7 DMG +${percent(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)}`,
    ],
  },
  yesterdayCalls: {
    id: 'yesterdayCalls', name: 'Yesterday Calls', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.yesterdayCalls.advancedStat, image: yesterdayCallsImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.yesterdayCalls.effects.energy, refinement)}`,
      `Daze +${percent(W_ENGINE_FACTS.yesterdayCalls.effects.daze, refinement)}`,
      `Squad CRIT DMG +${percent(W_ENGINE_FACTS.yesterdayCalls.effects.critDamage, refinement)}`,
    ],
  },
  hellfireGears: {
    id: 'hellfireGears', name: 'Hellfire Gears', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.hellfireGears.advancedStat, image: hellfireImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.hellfireGears.effects.energy, refinement)}`,
      `Impact +${percent(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)}`,
    ],
  },
  steamOven: {
    id: 'steamOven', name: 'Steam Oven', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.steamOven.advancedStat, image: steamOvenImage,
    passiveLines: (refinement) => [`Impact +${percent(W_ENGINE_FACTS.steamOven.effects.impact, refinement)}`],
  },
  dreamlitHearth: {
    id: 'dreamlitHearth', name: 'Dreamlit Hearth', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.dreamlitHearth.advancedStat, image: dreamlitImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.dreamlitHearth.effects.energy, refinement)}`,
      `Max HP +${percent(W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.dreamlitHearth.effects.damage, refinement)}`,
    ],
  },
  thoughtbop: {
    id: 'thoughtbop', name: 'Thoughtbop', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.thoughtbop.advancedStat, image: thoughtbopImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.thoughtbop.effects.energy, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.thoughtbop.effects.damage, refinement, true)}`,
      `Squad ATK +${percent(W_ENGINE_FACTS.thoughtbop.effects.atk, refinement)}`,
    ],
  },
  weepingCradle: {
    id: 'weepingCradle', name: 'Weeping Cradle', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.weepingCradle.advancedStat, image: weepingCradleImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement)}`,
    ],
  },
  kaboom: {
    id: 'kaboom', name: 'Kaboom the Cannon', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.kaboom.advancedStat, image: kaboomImage,
    passiveLines: (refinement) => [`Squad ATK +${percent(W_ENGINE_FACTS.kaboom.effects.atk, refinement)}`],
  },
  unfetteredGameBall: {
    id: 'unfetteredGameBall', name: 'Unfettered Game Ball', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.unfetteredGameBall.advancedStat, image: unfetteredImage,
    passiveLines: (refinement) => [
      `Squad CRIT Rate +${percent(W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, refinement)}`,
    ],
  },
  severedInnocence: { id: 'severedInnocence', name: 'Severed Innocence', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.severedInnocence.advancedStat, image: severedInnocenceImage, passiveLines: (refinement) => [`CRIT DMG +${percent(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement, true)}`, `Electric DMG +${percent(W_ENGINE_FACTS.severedInnocence.effects.damage, refinement)}`] },
  cordisGermina: { id: 'cordisGermina', name: 'Cordis Germina', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.cordisGermina.advancedStat, image: cordisGerminaImage, passiveLines: (refinement) => [`CRIT Rate +${percent(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)}`, `Electric DMG +${percent(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement, true)}`, `Basic Attack & Ultimate DEF Ignore +${percent(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)}`] },
  marcatoDesire: { id: 'marcatoDesire', name: 'Marcato Desire', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.marcatoDesire.advancedStat, image: marcatoDesireImage, passiveLines: (refinement) => [`ATK +${percent(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement, true)}`] },
  starlightEngine: { id: 'starlightEngine', name: 'Starlight Engine', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.starlightEngine.advancedStat, image: starlightEngineImage, passiveLines: (refinement) => [`ATK +${percent(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)}`] },
  spectralGaze: { id: 'spectralGaze', name: 'Spectral Gaze', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.spectralGaze.advancedStat, image: spectralGazeImage, passiveLines: (refinement) => [`Enemy DEF Reduction +${percent(W_ENGINE_FACTS.spectralGaze.effects.defReduction, refinement)}`, `Impact +${percent(W_ENGINE_FACTS.spectralGaze.effects.impact, refinement, true)}`] },
  iceJadeTeapot: { id: 'iceJadeTeapot', name: 'Ice-Jade Teapot', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.iceJadeTeapot.advancedStat, image: iceJadeTeapotImage, passiveLines: (refinement) => [`Impact +${percent(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement, true)}`, `Squad DMG +${percent(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, refinement)}`] },
  restrained: { id: 'restrained', name: 'The Restrained', rank: 'S', limited: false, baseAtk: 684, advancedStat: W_ENGINE_FACTS.restrained.advancedStat, image: restrainedImage, passiveLines: (refinement) => [`Basic Attack DMG +${percent(W_ENGINE_FACTS.restrained.effects.damage, refinement, true)}`, `Basic Attack Daze +${percent(W_ENGINE_FACTS.restrained.effects.daze, refinement, true)}`] },
  preciousFossilizedCore: { id: 'preciousFossilizedCore', name: 'Precious Fossilized Core', rank: 'A', limited: false, baseAtk: 594, advancedStat: W_ENGINE_FACTS.preciousFossilizedCore.advancedStat, image: preciousFossilizedCoreImage, passiveLines: (refinement) => [`Target HP ≥50% \u00B7 Daze +${equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)}%`, `Target HP ≥75% \u00B7 Daze +${percent(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement, true)} total`] },
  elegantVanity: { id: 'elegantVanity', name: 'Elegant Vanity', rank: 'S', limited: true, baseAtk: 713, advancedStat: W_ENGINE_FACTS.elegantVanity.advancedStat, image: elegantVanityImage, passiveLines: (refinement) => [`Energy +${equipmentEffectBaseValue(W_ENGINE_FACTS.elegantVanity.effects.energy, refinement)}`, `Squad DMG +${percent(W_ENGINE_FACTS.elegantVanity.effects.damage, refinement, true)}`] },
  bashfulDemon: { id: 'bashfulDemon', name: 'Bashful Demon', rank: 'A', limited: false, baseAtk: 624, advancedStat: W_ENGINE_FACTS.bashfulDemon.advancedStat, image: bashfulDemonImage, passiveLines: (refinement) => [`Squad ATK +${percent(W_ENGINE_FACTS.bashfulDemon.effects.atk, refinement, true)}`] },
  brimstone: {
    id: 'brimstone', name: 'The Brimstone', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.brimstone.advancedStat, image: brimstoneImage,
    passiveLines: (refinement) => [`ATK +${percent(W_ENGINE_FACTS.brimstone.effects.atk, refinement, true)}`],
  },
  serpentineSeeker: {
    id: 'serpentineSeeker', name: 'Serpentine Seeker', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.serpentineSeeker.advancedStat, image: serpentineSeekerImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.serpentineSeeker.effects.critRate, refinement)}`,
      `Electric DMG \u00B7 DEF Ignore +${percent(W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore, refinement)}`,
    ],
  },
  drillRigRedAxis: {
    id: 'drillRigRedAxis', name: 'Drill Rig - Red Axis', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.drillRigRedAxis.advancedStat, image: drillRigImage,
    passiveLines: (refinement) => [
      `Basic & Dash Attack Electric DMG +${percent(W_ENGINE_FACTS.drillRigRedAxis.effects.damage, refinement)}`,
    ],
  },
  heartstringNocturne: {
    id: 'heartstringNocturne', name: 'Heartstring Nocturne', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.heartstringNocturne.advancedStat, image: heartstringNocturneImage,
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)}`,
      `Chain Attack & Ultimate Fire RES Ignore +${percent(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, refinement, true)}`,
    ],
  },
  steelCushion: {
    id: 'steelCushion', name: 'Steel Cushion', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.steelCushion.advancedStat, image: steelCushionImage,
    passiveLines: (refinement) => [
      `Physical DMG +${percent(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, refinement)}`,
      `Back Attack DMG +${percent(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)}`,
    ],
  },
  housekeeper: {
    id: 'housekeeper', name: 'Housekeeper', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.housekeeper.advancedStat, image: housekeeperImage,
    passiveLines: (refinement) => [
      `Automatic Energy +${perSecond(W_ENGINE_FACTS.housekeeper.effects.energy, refinement)}`,
      `EX Special Physical DMG +${percent(W_ENGINE_FACTS.housekeeper.effects.damage, refinement, true)}`,
    ],
  },
  blazingLaurel: {
    id: 'blazingLaurel', name: 'Blazing Laurel', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.blazingLaurel.advancedStat, image: blazingLaurelImage,
    passiveLines: (refinement) => [
      `Impact +${percent(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)}`,
      `Fire & Ice CRIT DMG +${percent(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement, true)}`,
    ],
  },
  simmeringPot: {
    id: 'simmeringPot', name: 'The Simmering Pot', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.simmeringPot.advancedStat, image: simmeringPotImage,
    passiveLines: (refinement) => [
      `Assist Follow-Up Daze +${percent(W_ENGINE_FACTS.simmeringPot.effects.daze, refinement)}`,
      `Assist Follow-Up DMG +${percent(W_ENGINE_FACTS.simmeringPot.effects.damage, refinement)}`,
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
  evelyn: enginePools(['heartstringNocturne', 'severedInnocence', 'cordisGermina', 'starlightEngine', 'steelCushion']),
  corin: enginePools(['cordisGermina', 'heartstringNocturne', 'steelCushion', 'housekeeper']),
  lycaon: enginePools(['blazingLaurel', 'steamOven', 'preciousFossilizedCore', 'simmeringPot']),
}
