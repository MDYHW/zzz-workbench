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
import bellicoseBlazeImage from '../../assets/equipment/w-engines/bellicose-blaze.webp'
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
import krakensCradleImage from '../../assets/equipment/w-engines/krakens-cradle.webp'
import grillOWispImage from '../../assets/equipment/w-engines/grill-owisp.webp'
import wrathfulVajraImage from '../../assets/equipment/w-engines/wrathful-vajra.webp'
import myriadEclipseImage from '../../assets/equipment/w-engines/myriad-eclipse.webp'
import roaringFurnaceImage from '../../assets/equipment/w-engines/roaring-fur-nace.webp'
import tusksOfFuryImage from '../../assets/equipment/w-engines/tusks-of-fury.webp'
import tremorTrigramVesselImage from '../../assets/equipment/w-engines/tremor-trigram-vessel.webp'
import starlightRiderFaceplateImage from '../../assets/equipment/w-engines/starlight-rider-faceplate.webp'
import deepSeaVisitorImage from '../../assets/equipment/w-engines/deep-sea-visitor.webp'
import riotSuppressorMarkVIImage from '../../assets/equipment/w-engines/riot-suppressor-mark-vi.webp'
import theVaultImage from '../../assets/equipment/w-engines/the-vault.webp'
import gildedBlossomImage from '../../assets/equipment/w-engines/gilded-blossom.webp'
import boxCutterImage from '../../assets/equipment/w-engines/box-cutter.webp'
import zanshinHerbCaseImage from '../../assets/equipment/w-engines/zanshin-herb-case.webp'
import cloudcleaveRadianceImage from '../../assets/equipment/w-engines/cloudcleave-radiance.webp'
import starlightEngineReplicaImage from '../../assets/equipment/w-engines/starlight-engine-replica.webp'
import hailstormShrineImage from '../../assets/equipment/w-engines/hailstorm-shrine.webp'
import bigCylinderImage from '../../assets/equipment/w-engines/big-cylinder.webp'
import springEmbraceImage from '../../assets/equipment/w-engines/spring-embrace.webp'
import demaraBatteryMarkIIImage from '../../assets/equipment/w-engines/demara-battery-mark-ii.webp'
import originalTransmorpherImage from '../../assets/equipment/w-engines/original-transmorpher.webp'
import halfSugarBunnyImage from '../../assets/equipment/w-engines/half-sugar-bunny.webp'
import timeweaverImage from '../../assets/equipment/w-engines/timeweaver.webp'
import practicedPerfectionImage from '../../assets/equipment/w-engines/practiced-perfection.webp'
import fusionCompilerImage from '../../assets/equipment/w-engines/fusion-compiler.webp'
import electroLipGlossImage from '../../assets/equipment/w-engines/electro-lip-gloss.webp'
import weepingGeminiImage from '../../assets/equipment/w-engines/weeping-gemini.webp'
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
  tusksOfFury: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    effects: {
      shield: { modifier: 'shieldEffect', unit: '%', value: [30, 37.5, 45, 52.5, 60] },
      damage: { modifier: 'dmgBonus', unit: '%', value: [18, 22.5, 27, 31.5, 36], scope: { recipient: 'squad' } },
      daze: { modifier: 'dazeBonus', unit: '%', value: [12, 15, 18, 21, 24], scope: { recipient: 'squad' } },
    },
  },
  tremorTrigramVessel: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      damage: { modifier: 'dmgBonus', unit: '%', value: [25, 28.7, 32.5, 36.2, 40], scope: { actions: ['EX Special Attack', 'Ultimate'] } },
      energy: { modifier: 'energy', unit: '', value: [2, 2.3, 2.6, 2.9, 3.2] },
    },
  },
  roaringFurnace: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    effects: {
      daze: {
        modifier: 'dazeBonus', unit: '%', value: [28, 32.2, 36.4, 40.6, 44.8],
        scope: { actions: ['EX Special Attack', 'Chain Attack', 'Ultimate'] },
      },
      damage: {
        modifier: 'dmgBonus', unit: '%',
        progression: { kind: 'stacks', perStack: [10, 11.5, 13, 14.5, 16], maxStacks: 2 },
        scope: { recipient: 'squad' },
      },
    },
  },
  myriadEclipse: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      critDamage: { modifier: 'critDmg', unit: '%', value: [45, 51.75, 58.5, 65.25, 72] },
      defIgnore: { modifier: 'defIgnore', unit: '%', value: [25, 28.75, 32.5, 36.25, 40], scope: { recipient: 'enemy' } },
    },
  },
  krakensCradle: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      iceSheerDamage: { modifier: 'sheerDmgBonus', unit: '%', progression: { kind: 'stacks', perStack: [6, 7.5, 9, 10.5, 12], maxStacks: 3 }, scope: { attributes: ['Ice'] } },
      critRate: { modifier: 'critRate', unit: '%', value: [20, 23, 26, 29, 32] },
    },
  },
  grillOWisp: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    effects: {
      fireDamage: { modifier: 'dmgBonus', unit: '%', value: [15, 17.25, 19.5, 21.75, 24], scope: { attributes: ['Fire'] } },
      critRate: { modifier: 'critRate', unit: '%', value: [15, 17.25, 19.5, 21.75, 24] },
    },
  },
  wrathfulVajra: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [20, 23, 26, 29, 32] },
      fireSheerDamage: { modifier: 'sheerDmgBonus', unit: '%', progression: { kind: 'stacks', perStack: [9, 10.35, 11.7, 13.05, 14.4], maxStacks: 2 }, scope: { actions: ['EX Special Attack'], attributes: ['Fire'] } },
    },
  },
  starlightRiderFaceplate: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [20, 23, 26, 29, 32] },
      physicalSheerDamage: {
        modifier: 'sheerDmgBonus', unit: '%',
        progression: { kind: 'stacks', perStack: [10, 11.5, 13, 14.5, 16], maxStacks: 2 },
        scope: { attributes: ['Physical'] },
      },
    },
  },
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
  bellicoseBlaze: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [20, 23, 26, 29, 32] },
      fireAftershockDefIgnore: {
        modifier: 'defIgnore',
        unit: '%',
        progression: { kind: 'stacks', perStack: [15, 17.2, 19.5, 21.7, 24], maxStacks: 2 },
        scope: { recipient: 'enemy', tags: ['aftershock'], attributes: ['Fire'] },
      },
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
  deepSeaVisitor: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      iceDamage: { modifier: 'dmgBonus', unit: '%', value: [25, 31.25, 37.5, 43.75, 50], scope: { attributes: ['Ice'] } },
      basicCritRate: { modifier: 'critRate', unit: '%', value: [10, 12.5, 15, 17.5, 20] },
      dashCritRate: { modifier: 'critRate', unit: '%', value: [10, 12.5, 15, 17.5, 20] },
    },
  },
  riotSuppressorMarkVI: {
    advancedStat: { id: 'critDmg', label: 'CRIT DMG', value: 48, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [15, 18.75, 22.5, 26.25, 30] },
      chargedEtherDamage: {
        modifier: 'dmgBonus', unit: '%', value: [35, 43.75, 52.5, 61.25, 70],
        scope: { actions: ['Basic Attack', 'Dash Attack'], attributes: ['Ether'] },
      },
    },
  },
  theVault: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    effects: {
      targetDamage: { modifier: 'dmgBonus', unit: '%', value: scaledRefinementValues(15), scope: { recipient: 'squad' } },
      holderEnergy: { modifier: 'energy', unit: '/s', value: scaledRefinementValues(0.5) },
    },
  },
  gildedBlossom: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', value: [6, 6.9, 7.8, 8.7, 9.6] },
      exDamage: {
        modifier: 'dmgBonus', unit: '%', value: [15, 17.2, 19.5, 21.8, 24],
        scope: { actions: ['EX Special Attack'] },
      },
    },
  },
  boxCutter: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
    effects: {
      physicalDamage: {
        modifier: 'dmgBonus', unit: '%', value: [15, 17.3, 19.5, 21.8, 24],
        scope: { attributes: ['Physical'] },
      },
      daze: { modifier: 'dazeBonus', unit: '%', value: [10, 11.5, 13, 14.5, 16] },
    },
  },
  zanshinHerbCase: {
    advancedStat: { id: 'critDmg', label: 'CRIT DMG', value: 48, unit: '%' },
    effects: {
      critRate: { modifier: 'critRate', unit: '%', value: [10, 11.5, 13, 14.5, 16] },
      dashDamage: { modifier: 'dmgBonus', unit: '%', value: [40, 46, 52, 58, 64], scope: { actions: ['Dash Attack'], attributes: ['Electric'] } },
      anomalyStunCritRate: { modifier: 'critRate', unit: '%', value: [10, 11.5, 13, 14.5, 16] },
    },
  },
  cloudcleaveRadiance: {
    advancedStat: { id: 'critDmg', label: 'CRIT DMG', value: 48, unit: '%' },
    effects: {
      physicalResIgnore: { modifier: 'resIgnore', unit: '%', value: [20, 22, 24, 26, 28], scope: { attributes: ['Physical'] } },
      etherVeilDamage: { modifier: 'dmgBonus', unit: '%', value: [25, 28.7, 32.5, 36.2, 40] },
      etherVeilCritDamage: { modifier: 'critDmg', unit: '%', value: [25, 28.7, 32.5, 36.2, 40] },
    },
  },
  hailstormShrine: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    effects: {
      critDamage: { modifier: 'critDmg', unit: '%', value: [50, 57, 65, 72, 80] },
      iceDamage: {
        modifier: 'dmgBonus', unit: '%',
        progression: { kind: 'stacks', perStack: scaledRefinementValues(20), maxStacks: 2 },
        scope: { attributes: ['Ice'] },
      },
    },
  },
  bigCylinder: {
    advancedStat: { id: 'defPct', label: 'DEF', value: 40, unit: '%' },
    effects: {
      damageTaken: { modifier: 'damageTakenReduction', unit: '%', value: [7.5, 8.5, 9.5, 10.5, 12] },
      guaranteedCrit: { modifier: 'guaranteedCrit', unit: '%', value: fixedRefinementValues(100) },
      addedDefDamage: { modifier: 'defDamage', unit: '%', value: scaledRefinementValues(600) },
    },
  },
  springEmbrace: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      damageTaken: { modifier: 'damageTakenReduction', unit: '%', value: [7.5, 8.5, 9.5, 10.5, 12] },
      energyGeneration: { modifier: 'energyGenerationRate', unit: '%', value: scaledRefinementValues(10) },
    },
  },
  starlightEngineReplica: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      physicalDamage: { modifier: 'dmgBonus', unit: '%', value: [36, 41, 46.5, 52, 57.5], scope: { attributes: ['Physical'] } },
    },
  },
  demaraBatteryMarkII: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
    effects: {
      electricDamage: {
        modifier: 'dmgBonus', unit: '%', value: [15, 17.5, 20, 22, 24],
        scope: { attributes: ['Electric'] },
      },
      energyGeneration: {
        modifier: 'energyGenerationRate', unit: '%', value: [18, 20.5, 23, 25, 27.5],
      },
    },
  },
  originalTransmorpher: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    effects: {
      maxHp: { modifier: 'maxHp', unit: '%', value: [8, 9, 10, 11, 12.5] },
      impact: { modifier: 'impact', unit: '%', value: [10, 11.5, 13, 14.5, 16] },
    },
  },
  halfSugarBunny: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    effects: {
      automaticEnergy: { modifier: 'energyRegen', unit: '/s', value: [0.46, 0.53, 0.6, 0.67, 0.74] },
      squadAtk: { modifier: 'atk', unit: '%', value: [10, 11.5, 13, 14.5, 16], scope: { recipient: 'squad' } },
      squadMaxHp: { modifier: 'maxHp', unit: '%', value: [10, 11.5, 13, 14.5, 16], scope: { recipient: 'squad' } },
      veilCritDamage: { modifier: 'critDmg', unit: '%', value: [30, 34.5, 39, 43.5, 48], scope: { recipient: 'squad' } },
    },
  },
  timeweaver: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    effects: {
      electricBuildup: {
        modifier: 'anomalyBuildupBonus', unit: '%', value: [30, 35, 40, 45, 50],
        scope: { attributes: ['Electric'] },
      },
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '', value: [75, 85, 95, 105, 115],
        scope: { actions: ['Special Attack', 'EX Special Attack'] },
      },
      disorderDamage: {
        modifier: 'anomalyDmgBonus', unit: '%', value: [25, 27.5, 30, 32.5, 35],
      },
    },
  },
  practicedPerfection: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 30, unit: '%' },
    effects: {
      anomalyMastery: {
        modifier: 'anomalyMastery', unit: '', value: [60, 69, 78, 87, 96],
      },
      physicalDamage: {
        modifier: 'dmgBonus', unit: '%',
        progression: { kind: 'stacks', perStack: [20, 23, 26, 29, 32], maxStacks: 2 },
        scope: { attributes: ['Physical'] },
      },
    },
  },
  fusionCompiler: {
    advancedStat: { id: 'penRatio', label: 'PEN Ratio', value: 24, unit: '%' },
    effects: {
      atk: { modifier: 'atk', unit: '%', value: [12, 15, 18, 21, 24] },
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '',
        progression: { kind: 'stacks', perStack: [25, 31, 37, 43, 50], maxStacks: 3 },
        scope: { actions: ['Special Attack', 'EX Special Attack'] },
      },
    },
  },
  electroLipGloss: {
    advancedStat: { id: 'anomalyProficiency', label: 'Anomaly Proficiency', value: 75, unit: '' },
    effects: {
      atk: { modifier: 'atk', unit: '%', value: [10, 11.5, 13, 14.5, 16] },
      damage: { modifier: 'dmgBonus', unit: '%', value: [15, 17.5, 20, 22.5, 25] },
    },
  },
  weepingGemini: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    effects: {
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '',
        progression: { kind: 'stacks', perStack: [30, 34, 38, 42, 46], maxStacks: 4 },
      },
    },
  },
} as const satisfies Record<EngineId, WEngineFacts>

/** Exact authored fields for one admitted W-Engine, derived from the fact source. */
export type WEngineFactContract<Id extends EngineId> = (typeof W_ENGINE_FACTS)[Id]
export type WEngineEffectField<Id extends EngineId> = keyof WEngineFactContract<Id>['effects']

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  tusksOfFury: {
    id: 'tusksOfFury', name: 'Tusks of Fury', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.tusksOfFury.advancedStat, image: tusksOfFuryImage,
    passiveSpecialty: 'Defense',
    passiveLines: (refinement) => [
      `Shield provided +${percent(W_ENGINE_FACTS.tusksOfFury.effects.shield, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.tusksOfFury.effects.damage, refinement)}`,
      `Squad Daze +${percent(W_ENGINE_FACTS.tusksOfFury.effects.daze, refinement)}`,
    ],
  },
  tremorTrigramVessel: {
    id: 'tremorTrigramVessel', name: 'Tremor Trigram Vessel', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.tremorTrigramVessel.advancedStat, image: tremorTrigramVesselImage,
    passiveLines: (refinement) => [
      `EX Special & Ultimate DMG +${percent(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, refinement)}`,
      `Squad takes DMG or heals · Energy +${equipmentEffectBaseValue(W_ENGINE_FACTS.tremorTrigramVessel.effects.energy, refinement)}`,
    ],
  },
  roaringFurnace: {
    id: 'roaringFurnace', name: 'Roaring Fur-nace', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.roaringFurnace.advancedStat, image: roaringFurnaceImage,
    passiveLines: (refinement) => [
      `EX Special, Chain Attack & Ultimate Daze +${percent(W_ENGINE_FACTS.roaringFurnace.effects.daze, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.roaringFurnace.effects.damage, refinement, true)}`,
    ],
  },
  myriadEclipse: {
    id: 'myriadEclipse', name: 'Myriad Eclipse', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.myriadEclipse.advancedStat, image: myriadEclipseImage,
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, refinement)}`,
      `DEF Ignore +${percent(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, refinement)}`,
    ],
  },
  krakensCradle: {
    id: 'krakensCradle', name: "Kraken's Cradle", rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.krakensCradle.advancedStat, image: krakensCradleImage,
    passiveLines: (refinement) => [
      `Ice Sheer DMG +${percent(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, refinement, true)}`,
      `≤50% Max HP · CRIT Rate +${percent(W_ENGINE_FACTS.krakensCradle.effects.critRate, refinement)}`,
    ],
  },
  grillOWisp: {
    id: 'grillOWisp', name: "Grill O'Wisp", rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.grillOWisp.advancedStat, image: grillOWispImage,
    passiveLines: (refinement) => [
      `Fire DMG +${percent(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, refinement)}`,
      `CRIT Rate +${percent(W_ENGINE_FACTS.grillOWisp.effects.critRate, refinement)}`,
    ],
  },
  wrathfulVajra: {
    id: 'wrathfulVajra', name: 'Wrathful Vajra', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.wrathfulVajra.advancedStat, image: wrathfulVajraImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, refinement)}`,
      `EX Special Attack · Fire Sheer DMG +${percent(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, refinement, true)}`,
    ],
  },
  starlightRiderFaceplate: {
    id: 'starlightRiderFaceplate', name: 'Starlight Rider Faceplate', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.starlightRiderFaceplate.advancedStat,
    image: starlightRiderFaceplateImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, refinement)}`,
      `Physical Sheer DMG +${percent(W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage, refinement, true)}`,
    ],
  },
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
      `Target HP <50% \u00B7 EX Special Attack DMG +${percent(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)}`,
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
    passiveSpecialty: 'Stun',
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
  bellicoseBlaze: {
    id: 'bellicoseBlaze', name: 'Bellicose Blaze', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.bellicoseBlaze.advancedStat, image: bellicoseBlazeImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, refinement)}`,
      `Fire Aftershock DEF Ignore +${percent(W_ENGINE_FACTS.bellicoseBlaze.effects.fireAftershockDefIgnore, refinement, true)}`,
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
    passiveSpecialty: 'Attack',
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
  deepSeaVisitor: {
    id: 'deepSeaVisitor', name: 'Deep Sea Visitor', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.deepSeaVisitor.advancedStat, image: deepSeaVisitorImage,
    passiveLines: (refinement) => [
      `Ice DMG +${percent(W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage, refinement)}`,
      `CRIT Rate +${equipmentEffectBaseValue(W_ENGINE_FACTS.deepSeaVisitor.effects.basicCritRate, refinement)
        + equipmentEffectBaseValue(W_ENGINE_FACTS.deepSeaVisitor.effects.dashCritRate, refinement)}%`,
    ],
  },
  riotSuppressorMarkVI: {
    id: 'riotSuppressorMarkVI', name: 'Riot Suppressor Mark VI', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.riotSuppressorMarkVI.advancedStat, image: riotSuppressorMarkVIImage,
    passiveSpecialty: 'Attack',
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, refinement)}`,
      `Ether Basic & Dash Attack DMG +${percent(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, refinement)}`,
    ],
  },
  theVault: {
    id: 'theVault', name: 'The Vault', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.theVault.advancedStat, image: theVaultImage,
    passiveSpecialty: 'Support',
    passiveLines: (refinement) => [
      `Target squad DMG +${percent(W_ENGINE_FACTS.theVault.effects.targetDamage, refinement)}`,
      `Holder Energy +${perSecond(W_ENGINE_FACTS.theVault.effects.holderEnergy, refinement)}`,
    ],
  },
  gildedBlossom: {
    id: 'gildedBlossom', name: 'Gilded Blossom', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.gildedBlossom.advancedStat, image: gildedBlossomImage,
    passiveSpecialty: 'Attack',
    passiveLines: (refinement) => [
      `ATK +${percent(W_ENGINE_FACTS.gildedBlossom.effects.atk, refinement)}`,
      `EX Special Attack DMG +${percent(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, refinement)}`,
    ],
  },
  boxCutter: {
    id: 'boxCutter', name: 'Box Cutter', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.boxCutter.advancedStat, image: boxCutterImage,
    passiveSpecialty: 'Stun',
    passiveLines: (refinement) => [
      `Physical DMG +${percent(W_ENGINE_FACTS.boxCutter.effects.physicalDamage, refinement)}`,
      `Daze +${percent(W_ENGINE_FACTS.boxCutter.effects.daze, refinement)}`,
    ],
  },
  zanshinHerbCase: {
    id: 'zanshinHerbCase', name: 'Zanshin Herb Case', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.zanshinHerbCase.advancedStat, image: zanshinHerbCaseImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, refinement)
        + equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, refinement)}%`,
      `Electric Dash Attack DMG +${percent(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, refinement)}`,
    ],
  },
  cloudcleaveRadiance: {
    id: 'cloudcleaveRadiance', name: 'Cloudcleave Radiance', rank: 'S', limited: true, baseAtk: 743,
    advancedStat: W_ENGINE_FACTS.cloudcleaveRadiance.advancedStat, image: cloudcleaveRadianceImage,
    passiveSpecialty: 'Attack',
    passiveLines: (refinement) => [
      `Physical RES Ignore +${percent(W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore, refinement)}`,
      `DMG +${percent(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage, refinement)}`,
      `CRIT DMG +${percent(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage, refinement)}`,
    ],
  },
  hailstormShrine: {
    id: 'hailstormShrine', name: 'Hailstorm Shrine', rank: 'S', limited: true, baseAtk: 743,
    advancedStat: W_ENGINE_FACTS.hailstormShrine.advancedStat, image: hailstormShrineImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.hailstormShrine.effects.critDamage, refinement)}`,
      `Ice DMG +${percent(W_ENGINE_FACTS.hailstormShrine.effects.iceDamage, refinement, true)}`,
    ],
  },
  bigCylinder: {
    id: 'bigCylinder', name: 'Big Cylinder', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.bigCylinder.advancedStat, image: bigCylinderImage,
    passiveSpecialty: 'Defense',
    passiveLines: (refinement) => [
      `DMG taken -${percent(W_ENGINE_FACTS.bigCylinder.effects.damageTaken, refinement)}`,
      `Next hit guaranteed CRIT with added ${percent(W_ENGINE_FACTS.bigCylinder.effects.addedDefDamage, refinement)} DEF DMG`,
    ],
  },
  springEmbrace: {
    id: 'springEmbrace', name: 'Spring Embrace', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.springEmbrace.advancedStat, image: springEmbraceImage,
    passiveSpecialty: 'Defense',
    passiveLines: (refinement) => [
      `DMG taken -${percent(W_ENGINE_FACTS.springEmbrace.effects.damageTaken, refinement)}`,
      `Energy Generation Rate +${percent(W_ENGINE_FACTS.springEmbrace.effects.energyGeneration, refinement)} · Transfers to next on-field Agent`,
    ],
  },
  starlightEngineReplica: {
    id: 'starlightEngineReplica', name: 'Starlight Engine Replica', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.starlightEngineReplica.advancedStat, image: starlightEngineReplicaImage,
    passiveLines: (refinement) => [`Physical DMG +${percent(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, refinement)}`],
  },
  demaraBatteryMarkII: {
    id: 'demaraBatteryMarkII', name: 'Demara Battery Mark II', rank: 'A', limited: false, baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.demaraBatteryMarkII.advancedStat, image: demaraBatteryMarkIIImage,
    passiveSpecialty: 'Stun',
    passiveLines: (refinement) => [
      `Electric DMG +${percent(W_ENGINE_FACTS.demaraBatteryMarkII.effects.electricDamage, refinement)}`,
      `Energy Generation Rate +${percent(W_ENGINE_FACTS.demaraBatteryMarkII.effects.energyGeneration, refinement)}`,
    ],
  },
  originalTransmorpher: {
    id: 'originalTransmorpher', name: 'Original Transmorpher', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.originalTransmorpher.advancedStat, image: originalTransmorpherImage,
    passiveSpecialty: 'Defense',
    passiveLines: (refinement) => [
      `Max HP +${percent(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, refinement)}`,
      `Impact +${percent(W_ENGINE_FACTS.originalTransmorpher.effects.impact, refinement)}`,
    ],
  },
  halfSugarBunny: {
    id: 'halfSugarBunny', name: 'Half-Sugar Bunny', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.halfSugarBunny.advancedStat, image: halfSugarBunnyImage,
    passiveSpecialty: 'Defense',
    passiveLines: (refinement) => [
      `Automatic Energy Regen +${perSecond(W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, refinement)}`,
      `Squad ATK & Max HP +${percent(W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, refinement)} · Non-stacking`,
      `Activate or extend Ether Veil · Squad CRIT DMG +${percent(W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, refinement)}`,
    ],
  },
  timeweaver: {
    id: 'timeweaver', name: 'Timeweaver', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.timeweaver.advancedStat, image: timeweaverImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `Electric Anomaly Buildup +${percent(W_ENGINE_FACTS.timeweaver.effects.electricBuildup, refinement)}`,
      `Special/EX against anomalied enemy · Anomaly Proficiency +${equipmentEffectBaseValue(W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency, refinement)}`,
      `At 375 Anomaly Proficiency · Disorder DMG +${percent(W_ENGINE_FACTS.timeweaver.effects.disorderDamage, refinement)}`,
    ],
  },
  practicedPerfection: {
    id: 'practicedPerfection', name: 'Practiced Perfection', rank: 'S', limited: true, baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.practicedPerfection.advancedStat, image: practicedPerfectionImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `Anomaly Mastery +${equipmentEffectBaseValue(W_ENGINE_FACTS.practicedPerfection.effects.anomalyMastery, refinement)}`,
      `Inflict Assault · Physical DMG +${equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.practicedPerfection.effects.physicalDamage, refinement)}% per stack · 2 stacks on entry`,
    ],
  },
  fusionCompiler: {
    id: 'fusionCompiler', name: 'Fusion Compiler', rank: 'S', limited: false, baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.fusionCompiler.advancedStat, image: fusionCompilerImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `ATK +${percent(W_ENGINE_FACTS.fusionCompiler.effects.atk, refinement)}`,
      `Special/EX · Anomaly Proficiency +${equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, refinement)} per stack · Maximum +${equipmentEffectMaximumValue(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, refinement)}`,
    ],
  },
  electroLipGloss: {
    id: 'electroLipGloss', name: 'Electro-Lip Gloss', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.electroLipGloss.advancedStat, image: electroLipGlossImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `Anomalied enemy present · ATK +${percent(W_ENGINE_FACTS.electroLipGloss.effects.atk, refinement)}`,
      `Anomalied enemy present · DMG +${percent(W_ENGINE_FACTS.electroLipGloss.effects.damage, refinement)}`,
    ],
  },
  weepingGemini: {
    id: 'weepingGemini', name: 'Weeping Gemini', rank: 'A', limited: false, baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.weepingGemini.advancedStat, image: weepingGeminiImage,
    passiveSpecialty: 'Anomaly',
    passiveLines: (refinement) => [
      `Squad inflicts Attribute Anomaly · Anomaly Proficiency +${equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency, refinement)} per stack · Maximum +${equipmentEffectMaximumValue(W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency, refinement)}`,
    ],
  },
}

const enginePools = (full: EngineId[]): Record<PoolId, EngineId[]> => ({
  full,
  nonLimited: full.filter((engineId) => !W_ENGINES[engineId].limited),
})

export const ENGINE_IDS_BY_AGENT_AND_POOL: Record<AgentId, Record<PoolId, EngineId[]>> = {
  yixuan: enginePools(['qingming', 'cauldron', 'radiowave', 'puzzleSphere']),
  yidhari: enginePools(['krakensCradle', 'grillOWisp', 'cauldron', 'qingming', 'radiowave', 'puzzleSphere']),
  manato: enginePools(['grillOWisp', 'wrathfulVajra', 'qingming', 'radiowave', 'puzzleSphere']),
  hugo: enginePools(['myriadEclipse', 'cordisGermina', 'heartstringNocturne', 'steelCushion', 'marcatoDesire']),
  juFufu: enginePools(['roaringFurnace', 'blazingLaurel', 'hellfireGears', 'steamOven', 'preciousFossilizedCore']),
  panYinhu: enginePools(['tusksOfFury', 'tremorTrigramVessel']),
  banyue: enginePools(['wrathfulVajra', 'qingming', 'cauldron', 'grillOWisp', 'puzzleSphere']),
  starlightBilly: enginePools(['starlightRiderFaceplate', 'qingming', 'cauldron', 'steelCushion', 'grillOWisp', 'puzzleSphere']),
  dialyn: enginePools(['yesterdayCalls', 'hellfireGears', 'steamOven', 'preciousFossilizedCore']),
  lucia: enginePools(['dreamlitHearth', 'thoughtbop', 'weepingCradle', 'kaboom', 'unfetteredGameBall']),
  anbySoldier0: enginePools(['severedInnocence', 'cordisGermina', 'heartstringNocturne', 'marcatoDesire', 'starlightEngine']),
  trigger: enginePools(['spectralGaze', 'blazingLaurel', 'iceJadeTeapot', 'restrained', 'preciousFossilizedCore', 'steamOven']),
  astraYao: enginePools(['elegantVanity', 'bashfulDemon', 'kaboom']),
  seed: enginePools(['cordisGermina', 'heartstringNocturne', 'severedInnocence', 'brimstone', 'marcatoDesire']),
  cissia: enginePools(['serpentineSeeker', 'bellicoseBlaze', 'drillRigRedAxis', 'cordisGermina']),
  evelyn: enginePools(['heartstringNocturne', 'severedInnocence', 'cordisGermina', 'starlightEngine', 'steelCushion']),
  corin: enginePools(['cordisGermina', 'heartstringNocturne', 'steelCushion', 'housekeeper']),
  lycaon: enginePools(['blazingLaurel', 'hellfireGears', 'steamOven', 'preciousFossilizedCore', 'simmeringPot']),
  ellen: enginePools(['deepSeaVisitor', 'myriadEclipse', 'cordisGermina', 'steelCushion', 'brimstone', 'starlightEngine']),
  soukaku: enginePools(['weepingCradle', 'kaboom']),
  soldier11: enginePools(['heartstringNocturne', 'cordisGermina', 'severedInnocence', 'brimstone', 'starlightEngine']),
  lighter: enginePools(['blazingLaurel', 'iceJadeTeapot', 'hellfireGears', 'steamOven', 'restrained', 'preciousFossilizedCore']),
  lucy: enginePools(['elegantVanity', 'weepingCradle', 'kaboom']),
  zhuYuan: enginePools(['cordisGermina', 'heartstringNocturne', 'brimstone', 'riotSuppressorMarkVI', 'marcatoDesire', 'starlightEngine']),
  nicole: enginePools(['elegantVanity', 'theVault', 'weepingCradle', 'kaboom']),
  orphie: enginePools(['bellicoseBlaze', 'heartstringNocturne', 'severedInnocence', 'cordisGermina', 'gildedBlossom', 'marcatoDesire']),
  pulchra: enginePools(['blazingLaurel', 'boxCutter', 'hellfireGears', 'steamOven', 'preciousFossilizedCore']),
  harumasa: enginePools(['zanshinHerbCase', 'cordisGermina', 'brimstone', 'heartstringNocturne', 'starlightEngine']),
  qingyi: enginePools(['iceJadeTeapot', 'blazingLaurel', 'restrained', 'hellfireGears', 'steamOven', 'preciousFossilizedCore']),
  nekomata: enginePools(['steelCushion', 'heartstringNocturne', 'cordisGermina', 'cloudcleaveRadiance', 'severedInnocence', 'brimstone']),
  billy: enginePools(['cloudcleaveRadiance', 'heartstringNocturne', 'cordisGermina', 'brimstone', 'steelCushion', 'starlightEngineReplica']),
  ben: enginePools(['tremorTrigramVessel', 'tusksOfFury', 'cloudcleaveRadiance', 'hailstormShrine', 'bigCylinder', 'springEmbrace']),
  koleda: enginePools(['hellfireGears', 'blazingLaurel', 'restrained', 'steamOven', 'preciousFossilizedCore']),
  anby: enginePools(['hellfireGears', 'blazingLaurel', 'restrained', 'steamOven', 'preciousFossilizedCore', 'demaraBatteryMarkII']),
  caesar: enginePools(['tusksOfFury', 'hellfireGears', 'springEmbrace']),
  yeShunguang: enginePools([
    'cloudcleaveRadiance', 'brimstone', 'steelCushion', 'gildedBlossom',
    'marcatoDesire', 'starlightEngine',
  ]),
  zhao: enginePools(['halfSugarBunny', 'originalTransmorpher']),
  grace: enginePools([
    'timeweaver', 'practicedPerfection', 'fusionCompiler', 'electroLipGloss', 'weepingGemini',
  ]),
}
