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
import hugoPortrait from '../assets/agents/portraits/hugo.webp'
import juFufuPortrait from '../assets/agents/portraits/ju-fufu.webp'
import panYinhuPortrait from '../assets/agents/portraits/pan-yinhu.webp'
import banyuePortrait from '../assets/agents/portraits/banyue.webp'
import starlightBillyPortrait from '../assets/agents/portraits/starlight-billy-kid.webp'
import ellenPortrait from '../assets/agents/portraits/ellen.webp'
import soukakuPortrait from '../assets/agents/portraits/soukaku.webp'
import soldier11Portrait from '../assets/agents/portraits/soldier-11.webp'
import lighterPortrait from '../assets/agents/portraits/lighter.webp'
import lucyPortrait from '../assets/agents/portraits/lucy.webp'
import nicolePortrait from '../assets/agents/portraits/nicole.webp'
import type { AgentId } from '../workbench/content'
import zhuYuanPortrait from '../assets/agents/portraits/zhu-yuan.webp'
import orphiePortrait from '../assets/agents/portraits/orphie-and-magus.webp'
import pulchraPortrait from '../assets/agents/portraits/pulchra.webp'

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
  hugo: hugoPortrait,
  juFufu: juFufuPortrait,
  panYinhu: panYinhuPortrait,
  banyue: banyuePortrait,
  starlightBilly: starlightBillyPortrait,
  ellen: ellenPortrait,
  soukaku: soukakuPortrait,
  soldier11: soldier11Portrait,
  lighter: lighterPortrait,
  lucy: lucyPortrait,
  zhuYuan: zhuYuanPortrait,
  nicole: nicolePortrait,
  orphie: orphiePortrait,
  pulchra: pulchraPortrait,
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

// Source metadata is the only Agent-specific portrait input. `faceX` is the
// horizontal optical anchor, not a literal face center; `headTopY` registers the
// readable continuous composition, not a literal hair top. Surface frames remain
// shared CSS geometry so an asset cannot introduce a local placement rule.
const PORTRAIT_SOURCES: Record<AgentId, PortraitSource> = {
  yixuan: { faceX: 55.86, headTopY: 1, scale: 1.2 },
  dialyn: { faceX: 50, headTopY: 3, scale: 1.17 },
  lucia: { faceX: 44.3, headTopY: 6, scale: 1.1 },
  anbySoldier0: { faceX: 50.6, headTopY: 1, scale: 1.1 },
  trigger: { faceX: 47, headTopY: 2, scale: 1 },
  astraYao: { faceX: 48.7, headTopY: 7, scale: 1.1 },
  seed: { faceX: 52, headTopY: 4, scale: 1 },
  cissia: { faceX: 55.5, headTopY: 5, scale: 1 },
  evelyn: { faceX: 55.45, headTopY: 2, scale: 1.1 },
  corin: { faceX: 57, headTopY: 13, scale: 1.2 },
  lycaon: { faceX: 50, headTopY: 3, scale: 1.2 },
  yidhari: { faceX: 44.5, headTopY: 2, scale: 1.2 },
  manato: { faceX: 50, headTopY: 3, scale: 1.2 },
  hugo: { faceX: 58, headTopY: 3, scale: 1.3 },
  juFufu: { faceX: 41, headTopY: 24, scale: 1.26 },
  panYinhu: { faceX: 50, headTopY: 2, scale: 0.8 },
  banyue: { faceX: 50, headTopY: 12, scale: 1.2 },
  starlightBilly: { faceX: 50, headTopY: 9, scale: 1.2 },
  ellen: { faceX: 59, headTopY: 5, scale: 1 },
  soukaku: { faceX: 58.25, headTopY: 13, scale: 1.2 },
  soldier11: { faceX: 51, headTopY: 6, scale: 1.1 },
  lighter: { faceX: 52, headTopY: 2, scale: 1.3 },
  lucy: { faceX: 55, headTopY: 27, scale: 1.2 },
  zhuYuan: { faceX: 51, headTopY: 2, scale: 1.2 },
  nicole: { faceX: 62, headTopY: 9, scale: 1.2 },
  orphie: { faceX: 38, headTopY: 8, scale: 1.1 },
  pulchra: { faceX: 53, headTopY: 4, scale: 1.1 },
}

export function portraitSourceStyle(agentId: AgentId): PortraitSourceStyle {
  const source = PORTRAIT_SOURCES[agentId]
  return {
    '--portrait-source-face-x': String(source.faceX),
    '--portrait-source-head-top-y': String(source.headTopY),
    '--portrait-source-scale': String(source.scale),
  }
}
