import type { CSSProperties } from 'react'
import anbySoldier0Portrait from '../assets/agents/portraits/soldier-0-anby.webp'
import astraYaoPortrait from '../assets/agents/portraits/astra-yao.webp'
import cissiaPortrait from '../assets/agents/portraits/cissia.webp'
import corinPortrait from '../assets/agents/portraits/corin.webp'
import dialynPortrait from '../assets/agents/portraits/dialyn.webp'
import evelynPortrait from '../assets/agents/portraits/evelyn.webp'
import luciaPortrait from '../assets/agents/portraits/lucia.webp'
import lycaonPortrait from '../assets/agents/portraits/lycaon.webp'
import manatoPortrait from '../assets/agents/portraits/manato.webp'
import seedPortrait from '../assets/agents/portraits/seed.webp'
import triggerPortrait from '../assets/agents/portraits/trigger.webp'
import yixuanPortrait from '../assets/agents/portraits/yixuan.webp'
import yidhariPortrait from '../assets/agents/portraits/yidhari.webp'
import type { AgentId } from '../workbench/content'

export const AGENT_PORTRAITS: Record<AgentId, string> = {
  yixuan: yixuanPortrait,
  dialyn: dialynPortrait,
  lucia: luciaPortrait,
  anbySoldier0: anbySoldier0Portrait,
  trigger: triggerPortrait,
  astraYao: astraYaoPortrait,
  seed: seedPortrait,
  cissia: cissiaPortrait,
  evelyn: evelynPortrait,
  corin: corinPortrait,
  lycaon: lycaonPortrait,
  yidhari: yidhariPortrait,
  manato: manatoPortrait,
}

interface PortraitSource {
  faceX: number
  headTopY: number
  scale: number
}

export type PortraitSourceStyle = CSSProperties & {
  '--portrait-source-face-x': string
  '--portrait-source-head-top-y': string
  '--portrait-source-scale': string
}

// Source metadata is the only Agent-specific portrait input. Surface frames
// remain shared CSS geometry so an asset cannot introduce a local placement rule.
const PORTRAIT_SOURCES: Record<AgentId, PortraitSource> = {
  yixuan: { faceX: 55.86, headTopY: 2.01, scale: 1 },
  dialyn: { faceX: 50, headTopY: 3.7, scale: 288 / 295 },
  lucia: { faceX: 44.3, headTopY: 7.99, scale: 1 },
  anbySoldier0: { faceX: 50.6, headTopY: 3, scale: 1 },
  trigger: { faceX: 49, headTopY: 5, scale: 330 / 295 },
  astraYao: { faceX: 48.7, headTopY: 8, scale: 330 / 295 },
  seed: { faceX: 52, headTopY: 6, scale: 325 / 295 },
  cissia: { faceX: 55.5, headTopY: 7.99, scale: 1 },
  evelyn: { faceX: 55.45, headTopY: 3.32, scale: 325 / 295 },
  corin: { faceX: 57, headTopY: 13, scale: 1 },
  lycaon: { faceX: 50, headTopY: 3, scale: 1 },
  yidhari: { faceX: 44.5, headTopY: 1.75, scale: 1 },
  manato: { faceX: 50, headTopY: 1.9, scale: 1 },
}

export function portraitSourceStyle(agentId: AgentId): PortraitSourceStyle {
  const source = PORTRAIT_SOURCES[agentId]
  return {
    '--portrait-source-face-x': String(source.faceX),
    '--portrait-source-head-top-y': String(source.headTopY),
    '--portrait-source-scale': String(source.scale),
  }
}
