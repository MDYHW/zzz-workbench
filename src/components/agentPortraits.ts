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
import harumasaPortrait from '../assets/agents/portraits/harumasa.webp'
import qingyiPortrait from '../assets/agents/portraits/qingyi.webp'
import nekomataPortrait from '../assets/agents/portraits/nekomata.webp'
import billyPortrait from '../assets/agents/portraits/billy.webp'
import benPortrait from '../assets/agents/portraits/ben.webp'
import koledaPortrait from '../assets/agents/portraits/koleda.webp'
import anbyPortrait from '../assets/agents/portraits/anby.webp'
import caesarPortrait from '../assets/agents/portraits/caesar.webp'
import yeShunguangPortrait from '../assets/agents/portraits/ye-shunguang.webp'
import zhaoPortrait from '../assets/agents/portraits/zhao.webp'
import gracePortrait from '../assets/agents/portraits/grace.webp'
import piperPortrait from '../assets/agents/portraits/piper.webp'
import yuzuhaPortrait from '../assets/agents/portraits/yuzuha.webp'
import burnicePortrait from '../assets/agents/portraits/burnice.webp'
import janePortrait from '../assets/agents/portraits/jane.webp'
import sethPortrait from '../assets/agents/portraits/seth.webp'
import yanagiPortrait from '../assets/agents/portraits/yanagi.webp'
import alicePortrait from '../assets/agents/portraits/alice.webp'
import vivianPortrait from '../assets/agents/portraits/vivian.webp'
import ariaPortrait from '../assets/agents/portraits/aria.webp'
import promeiaPortrait from '../assets/agents/portraits/promeia.webp'
import sunnaPortrait from '../assets/agents/portraits/sunna.webp'
import nangongYuPortrait from '../assets/agents/portraits/nangong-yu.webp'
import miyabiPortrait from '../assets/agents/portraits/miyabi.webp'
import antonPortrait from '../assets/agents/portraits/anton.webp'
import rinaPortrait from '../assets/agents/portraits/rina.webp'
import normaPortrait from '../assets/agents/portraits/norma.webp'
import pyroisPortrait from '../assets/agents/portraits/pyrois.webp'
import sigridPortrait from '../assets/agents/portraits/sigrid.webp'

export const AGENT_PORTRAITS: Record<AgentId, string> = {
  pyrois: pyroisPortrait,
  sigrid: sigridPortrait,
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
  harumasa: harumasaPortrait,
  qingyi: qingyiPortrait,
  nekomata: nekomataPortrait,
  billy: billyPortrait,
  ben: benPortrait,
  koleda: koledaPortrait,
  anby: anbyPortrait,
  caesar: caesarPortrait,
  yeShunguang: yeShunguangPortrait,
  zhao: zhaoPortrait,
  grace: gracePortrait,
  piper: piperPortrait,
  yuzuha: yuzuhaPortrait,
  burnice: burnicePortrait,
  jane: janePortrait,
  seth: sethPortrait,
  yanagi: yanagiPortrait,
  alice: alicePortrait,
  vivian: vivianPortrait,
  aria: ariaPortrait,
  promeia: promeiaPortrait,
  sunna: sunnaPortrait,
  nangongYu: nangongYuPortrait,
  miyabi: miyabiPortrait,
  anton: antonPortrait,
  rina: rinaPortrait,
  norma: normaPortrait,
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
  pyrois: { faceX: 50, headTopY: 1, scale: 1 },
  sigrid: { faceX: 34, headTopY: 6, scale: 1.1 },
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
  pulchra: { faceX: 53, headTopY: 12, scale: 1.1 },
  harumasa: { faceX: 55, headTopY: 7, scale: 1.1 },
  qingyi: { faceX: 53, headTopY: 18, scale: 1.25 },
  nekomata: { faceX: 54, headTopY: 29, scale: 1.3 },
  billy: { faceX: 50, headTopY: 8, scale: 1.1 },
  ben: { faceX: 40, headTopY: 15, scale: 0.8 },
  koleda: { faceX: 55, headTopY: 22, scale: 1.1 },
  anby: { faceX: 61, headTopY: 14, scale: 1.15 },
  caesar: { faceX: 56, headTopY: 6, scale: 1.1 },
  yeShunguang: { faceX: 51, headTopY: 5, scale: 1.1 },
  zhao: { faceX: 42, headTopY: 30, scale: 0.9 },
  grace: { faceX: 51, headTopY: 3, scale: 1 },
  piper: { faceX: 45, headTopY: 16, scale: 1.2 },
  yuzuha: { faceX: 53, headTopY: 18, scale: 1.3 },
  burnice: { faceX: 53, headTopY: 6, scale: 1.1 },
  jane: { faceX: 50, headTopY: 2, scale: 1.1 },
  seth: { faceX: 54, headTopY: 2, scale: 1.1 },
  yanagi: { faceX: 42, headTopY: 3, scale: 1.1 },
  alice: { faceX: 50, headTopY: 0, scale: 1.15 },
  vivian: { faceX: 54, headTopY: 15, scale: 1.1 },
  aria: { faceX: 65, headTopY: 0, scale: 1.05 },
  promeia: { faceX: 49, headTopY: 0, scale: 1.2 },
  sunna: { faceX: 52, headTopY: 10, scale: 1.15 },
  nangongYu: { faceX: 64, headTopY: 8, scale: 1.15 },
  miyabi: { faceX: 50, headTopY: 15, scale: 1.1 },
  anton: { faceX: 50, headTopY: 5, scale: 1.1 },
  rina: { faceX: 47.5, headTopY: 8, scale: 1.1 },
  norma: { faceX: 40, headTopY: 12, scale: 1.2 },
}

export function portraitSourceStyle(agentId: AgentId): PortraitSourceStyle {
  const source = PORTRAIT_SOURCES[agentId]
  return {
    '--portrait-source-face-x': String(source.faceX),
    '--portrait-source-head-top-y': String(source.headTopY),
    '--portrait-source-scale': String(source.scale),
  }
}
