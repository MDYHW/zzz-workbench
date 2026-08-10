import astralVoiceImage from '../../assets/equipment/drive-discs/astral-voice.webp'
import branchAndBladeImage from '../../assets/equipment/drive-discs/branch-and-blade-song.webp'
import dawnsBloomImage from '../../assets/equipment/drive-discs/dawns-bloom.webp'
import hormonePunkImage from '../../assets/equipment/drive-discs/hormone-punk.webp'
import kingImage from '../../assets/equipment/drive-discs/king-of-the-summit.webp'
import moonlightImage from '../../assets/equipment/drive-discs/moonlight-lullaby.webp'
import pufferElectroImage from '../../assets/equipment/drive-discs/puffer-electro.webp'
import shadowHarmonyImage from '../../assets/equipment/drive-discs/shadow-harmony.webp'
import shockstarImage from '../../assets/equipment/drive-discs/shockstar-disco.webp'
import swingJazzImage from '../../assets/equipment/drive-discs/swing-jazz.webp'
import woodpeckerImage from '../../assets/equipment/drive-discs/woodpecker-electro.webp'
import yunkuiImage from '../../assets/equipment/drive-discs/yunkui-tales.webp'
import type { AgentId, DiscId, DriveDiscChoice } from './types'

export const DRIVE_DISC_FACTS = {
  yunkui: { hpPct: 10, critRate: 12, sheerDmg: 10 },
  woodpecker: { critRate: 8, atkPctAtMax: 27 },
  branchAndBlade: { critDmg: 16 },
  king: { daze: 6, squadCritDmg: { base: 15, atCritThreshold: 15 } },
  swingJazz: { energyRegenPct: 20 },
  moonlight: { energyRegenPct: 20, squadDmg: 18 },
  shadowHarmony: { aftershockDmg: 15, atkPct: 12, critRate: 12 },
  shockstar: { impactPct: 6, daze: 20 },
  astralVoice: { atkPct: 10, entrantDmg: 24 },
  hormonePunk: { atkPct: 10 },
  dawnsBloom: { basicDmg: { initial: 15, combat: 20, fully: 20 } },
  pufferElectro: { penRatio: 8, ultimateDmg: 20, atkPct: 15 },
} as const

export const DRIVE_DISCS: Record<DiscId, DriveDiscChoice> = {
  yunkui: {
    id: 'yunkui', name: 'Yunkui Tales', image: yunkuiImage,
    twoPieceEffect: `HP +${DRIVE_DISC_FACTS.yunkui.hpPct}%`,
    fourPieceEffects: [
      `CRIT Rate +${DRIVE_DISC_FACTS.yunkui.critRate}%`,
      `Sheer DMG +${DRIVE_DISC_FACTS.yunkui.sheerDmg}%`,
    ],
  },
  woodpecker: {
    id: 'woodpecker', name: 'Woodpecker Electro', image: woodpeckerImage,
    twoPieceEffect: `CRIT Rate +${DRIVE_DISC_FACTS.woodpecker.critRate}%`,
    fourPieceEffects: [`ATK +${DRIVE_DISC_FACTS.woodpecker.atkPctAtMax}%`],
  },
  branchAndBlade: {
    id: 'branchAndBlade', name: 'Branch & Blade Song', image: branchAndBladeImage,
    twoPieceEffect: `CRIT DMG +${DRIVE_DISC_FACTS.branchAndBlade.critDmg}%`,
  },
  king: {
    id: 'king', name: 'King of the Summit', image: kingImage,
    twoPieceEffect: `Daze +${DRIVE_DISC_FACTS.king.daze}%`,
    fourPieceEffects: [
      `Squad CRIT DMG +${DRIVE_DISC_FACTS.king.squadCritDmg.base + DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold}%`,
    ],
  },
  swingJazz: {
    id: 'swingJazz', name: 'Swing Jazz', image: swingJazzImage,
    twoPieceEffect: `Energy Regen +${DRIVE_DISC_FACTS.swingJazz.energyRegenPct}%`,
  },
  moonlight: {
    id: 'moonlight', name: 'Moonlight Lullaby', image: moonlightImage,
    twoPieceEffect: `Energy Regen +${DRIVE_DISC_FACTS.moonlight.energyRegenPct}%`,
    fourPieceEffects: [`Squad DMG +${DRIVE_DISC_FACTS.moonlight.squadDmg}%`],
  },
  shadowHarmony: {
    id: 'shadowHarmony', name: 'Shadow Harmony', image: shadowHarmonyImage,
    twoPieceEffect: 'Aftershock & Dash Attack DMG +15%',
    fourPieceEffects: ['ATK +12%', 'CRIT Rate +12%'],
  },
  shockstar: {
    id: 'shockstar', name: 'Shockstar Disco', image: shockstarImage,
    twoPieceEffect: 'Impact +6%',
    fourPieceEffects: ['Basic Attack, Dash Attack & Dodge Counter Daze +20%'],
  },
  astralVoice: {
    id: 'astralVoice', name: 'Astral Voice', image: astralVoiceImage,
    twoPieceEffect: 'ATK +10%',
    fourPieceEffects: ['Entrant DMG +24%'],
  },
  hormonePunk: {
    id: 'hormonePunk', name: 'Hormone Punk', image: hormonePunkImage,
    twoPieceEffect: 'ATK +10%',
  },
  dawnsBloom: {
    id: 'dawnsBloom', name: "Dawn's Bloom", image: dawnsBloomImage,
    twoPieceEffect: `Basic Attack DMG +${DRIVE_DISC_FACTS.dawnsBloom.basicDmg.initial}%`,
    fourPieceEffects: [
      `Basic Attack DMG +${DRIVE_DISC_FACTS.dawnsBloom.basicDmg.combat + DRIVE_DISC_FACTS.dawnsBloom.basicDmg.fully}%`,
    ],
  },
  pufferElectro: {
    id: 'pufferElectro', name: 'Puffer Electro', image: pufferElectroImage,
    twoPieceEffect: `PEN Ratio +${DRIVE_DISC_FACTS.pufferElectro.penRatio}%`,
    fourPieceEffects: [
      `Ultimate DMG +${DRIVE_DISC_FACTS.pufferElectro.ultimateDmg}%`,
      `ATK +${DRIVE_DISC_FACTS.pufferElectro.atkPct}%`,
    ],
  },
}

export const DISC_IDS_BY_AGENT_AND_PIECE: Record<
  AgentId,
  { fourPiece: DiscId[]; twoPiece: DiscId[] }
> = {
  yixuan: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade'] },
  dialyn: { fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz', 'moonlight'] },
  lucia: { fourPiece: ['moonlight'], twoPiece: ['yunkui', 'swingJazz'] },
  anbySoldier0: { fourPiece: ['shadowHarmony'], twoPiece: ['woodpecker', 'branchAndBlade'] },
  trigger: { fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'woodpecker', 'swingJazz', 'moonlight'] },
  astraYao: { fourPiece: ['astralVoice', 'moonlight'], twoPiece: ['moonlight', 'swingJazz', 'hormonePunk', 'astralVoice'] },
  seed: { fourPiece: ['dawnsBloom', 'woodpecker'], twoPiece: ['woodpecker', 'branchAndBlade', 'pufferElectro'] },
  cissia: { fourPiece: ['dawnsBloom'], twoPiece: ['swingJazz', 'woodpecker', 'branchAndBlade'] },
}
