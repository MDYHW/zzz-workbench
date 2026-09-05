import auricInkMark from '../assets/game/attributes/auric-ink.webp'
import electricMark from '../assets/game/attributes/electric.webp'
import etherMark from '../assets/game/attributes/ether.webp'
import fireMark from '../assets/game/attributes/fire.webp'
import frostMark from '../assets/game/attributes/frost.webp'
import honedEdgeMark from '../assets/game/attributes/honed-edge.webp'
import iceMark from '../assets/game/attributes/ice.webp'
import lumifluxMark from '../assets/game/attributes/lumiflux.webp'
import physicalMark from '../assets/game/attributes/physical.webp'
import windMark from '../assets/game/attributes/wind.webp'
import rankAMark from '../assets/game/ranks/a.webp'
import rankSMark from '../assets/game/ranks/s.webp'
import anomalyMark from '../assets/game/specialties/anomaly.webp'
import attackMark from '../assets/game/specialties/attack.webp'
import defenseMark from '../assets/game/specialties/defense.webp'
import ruptureMark from '../assets/game/specialties/rupture.webp'
import stunMark from '../assets/game/specialties/stun.webp'
import supportMark from '../assets/game/specialties/support.webp'
import type { AgentAttribute, AgentRank, AgentSpecialty } from '../workbench/content'

export const ATTRIBUTE_MARKS: Record<AgentAttribute, string> = {
  Lumiflux: lumifluxMark,
  Physical: physicalMark,
  Fire: fireMark,
  Ice: iceMark,
  Electric: electricMark,
  Ether: etherMark,
  Wind: windMark,
  'Auric Ink': auricInkMark,
  'Honed Edge': honedEdgeMark,
  Frost: frostMark,
}

export const SPECIALTY_MARKS: Record<AgentSpecialty, string> = {
  Attack: attackMark,
  Stun: stunMark,
  Support: supportMark,
  Defense: defenseMark,
  Rupture: ruptureMark,
  Anomaly: anomalyMark,
}

export const RANK_MARKS: Record<AgentRank, string> = {
  S: rankSMark,
  A: rankAMark,
}
