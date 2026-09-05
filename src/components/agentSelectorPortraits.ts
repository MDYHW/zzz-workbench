import aliceSelectorPortrait from '../assets/agents/selector-portraits/alice.png'
import anbySelectorPortrait from '../assets/agents/selector-portraits/anby.png'
import anbySoldier0SelectorPortrait from '../assets/agents/selector-portraits/soldier-0-anby.png'
import antonSelectorPortrait from '../assets/agents/selector-portraits/anton.png'
import ariaSelectorPortrait from '../assets/agents/selector-portraits/aria.png'
import astraYaoSelectorPortrait from '../assets/agents/selector-portraits/astra-yao.png'
import banyueSelectorPortrait from '../assets/agents/selector-portraits/banyue.png'
import benSelectorPortrait from '../assets/agents/selector-portraits/ben.png'
import billySelectorPortrait from '../assets/agents/selector-portraits/billy.png'
import burniceSelectorPortrait from '../assets/agents/selector-portraits/burnice.png'
import caesarSelectorPortrait from '../assets/agents/selector-portraits/caesar.png'
import cissiaSelectorPortrait from '../assets/agents/selector-portraits/cissia.png'
import corinSelectorPortrait from '../assets/agents/selector-portraits/corin.png'
import dialynSelectorPortrait from '../assets/agents/selector-portraits/dialyn.png'
import ellenSelectorPortrait from '../assets/agents/selector-portraits/ellen.png'
import evelynSelectorPortrait from '../assets/agents/selector-portraits/evelyn.png'
import graceSelectorPortrait from '../assets/agents/selector-portraits/grace.png'
import harumasaSelectorPortrait from '../assets/agents/selector-portraits/harumasa.png'
import hugoSelectorPortrait from '../assets/agents/selector-portraits/hugo.png'
import janeSelectorPortrait from '../assets/agents/selector-portraits/jane.png'
import juFufuSelectorPortrait from '../assets/agents/selector-portraits/ju-fufu.png'
import koledaSelectorPortrait from '../assets/agents/selector-portraits/koleda.png'
import lighterSelectorPortrait from '../assets/agents/selector-portraits/lighter.png'
import luciaSelectorPortrait from '../assets/agents/selector-portraits/lucia.png'
import lucySelectorPortrait from '../assets/agents/selector-portraits/lucy.png'
import lycaonSelectorPortrait from '../assets/agents/selector-portraits/lycaon.png'
import manatoSelectorPortrait from '../assets/agents/selector-portraits/manato.png'
import miyabiSelectorPortrait from '../assets/agents/selector-portraits/miyabi.png'
import nangongYuSelectorPortrait from '../assets/agents/selector-portraits/nangong-yu.png'
import nekomataSelectorPortrait from '../assets/agents/selector-portraits/nekomata.png'
import nicoleSelectorPortrait from '../assets/agents/selector-portraits/nicole.png'
import normaSelectorPortrait from '../assets/agents/selector-portraits/norma.png'
import orphieSelectorPortrait from '../assets/agents/selector-portraits/orphie-and-magus.png'
import panYinhuSelectorPortrait from '../assets/agents/selector-portraits/pan-yinhu.png'
import piperSelectorPortrait from '../assets/agents/selector-portraits/piper.png'
import promeiaSelectorPortrait from '../assets/agents/selector-portraits/promeia.png'
import pulchraSelectorPortrait from '../assets/agents/selector-portraits/pulchra.png'
import pyroisSelectorPortrait from '../assets/agents/selector-portraits/pyrois.png'
import qingyiSelectorPortrait from '../assets/agents/selector-portraits/qingyi.png'
import remielleSelectorPortrait from '../assets/agents/selector-portraits/remielle.png'
import rinaSelectorPortrait from '../assets/agents/selector-portraits/rina.png'
import seedSelectorPortrait from '../assets/agents/selector-portraits/seed.png'
import sethSelectorPortrait from '../assets/agents/selector-portraits/seth.png'
import sigridSelectorPortrait from '../assets/agents/selector-portraits/sigrid.png'
import soldier11SelectorPortrait from '../assets/agents/selector-portraits/soldier-11.png'
import soukakuSelectorPortrait from '../assets/agents/selector-portraits/soukaku.png'
import starlightBillySelectorPortrait from '../assets/agents/selector-portraits/starlight-billy-kid.png'
import sunnaSelectorPortrait from '../assets/agents/selector-portraits/sunna.png'
import triggerSelectorPortrait from '../assets/agents/selector-portraits/trigger.png'
import velinaSelectorPortrait from '../assets/agents/selector-portraits/velina.png'
import vivianSelectorPortrait from '../assets/agents/selector-portraits/vivian.png'
import yanagiSelectorPortrait from '../assets/agents/selector-portraits/yanagi.png'
import yeShunguangSelectorPortrait from '../assets/agents/selector-portraits/ye-shunguang.png'
import yidhariSelectorPortrait from '../assets/agents/selector-portraits/yidhari.png'
import yixuanSelectorPortrait from '../assets/agents/selector-portraits/yixuan.png'
import yuzuhaSelectorPortrait from '../assets/agents/selector-portraits/yuzuha.png'
import zhaoSelectorPortrait from '../assets/agents/selector-portraits/zhao.png'
import zhuYuanSelectorPortrait from '../assets/agents/selector-portraits/zhu-yuan.png'
import type { AgentId } from '../workbench/content'

// Roster-complete upper-body derivatives shared by the persistent selector and
// both Party Edit portrait surfaces. Workspace identity alone uses calibrated
// full artwork.
export const AGENT_SELECTOR_PORTRAITS: Record<AgentId, string> = {
  remielle: remielleSelectorPortrait,
  pyrois: pyroisSelectorPortrait,
  sigrid: sigridSelectorPortrait,
  velina: velinaSelectorPortrait,
  yixuan: yixuanSelectorPortrait,
  dialyn: dialynSelectorPortrait,
  lucia: luciaSelectorPortrait,
  anbySoldier0: anbySoldier0SelectorPortrait,
  trigger: triggerSelectorPortrait,
  astraYao: astraYaoSelectorPortrait,
  seed: seedSelectorPortrait,
  cissia: cissiaSelectorPortrait,
  evelyn: evelynSelectorPortrait,
  corin: corinSelectorPortrait,
  lycaon: lycaonSelectorPortrait,
  yidhari: yidhariSelectorPortrait,
  manato: manatoSelectorPortrait,
  hugo: hugoSelectorPortrait,
  juFufu: juFufuSelectorPortrait,
  panYinhu: panYinhuSelectorPortrait,
  banyue: banyueSelectorPortrait,
  starlightBilly: starlightBillySelectorPortrait,
  ellen: ellenSelectorPortrait,
  soukaku: soukakuSelectorPortrait,
  soldier11: soldier11SelectorPortrait,
  lighter: lighterSelectorPortrait,
  lucy: lucySelectorPortrait,
  zhuYuan: zhuYuanSelectorPortrait,
  nicole: nicoleSelectorPortrait,
  orphie: orphieSelectorPortrait,
  pulchra: pulchraSelectorPortrait,
  harumasa: harumasaSelectorPortrait,
  qingyi: qingyiSelectorPortrait,
  nekomata: nekomataSelectorPortrait,
  billy: billySelectorPortrait,
  ben: benSelectorPortrait,
  koleda: koledaSelectorPortrait,
  anby: anbySelectorPortrait,
  caesar: caesarSelectorPortrait,
  yeShunguang: yeShunguangSelectorPortrait,
  zhao: zhaoSelectorPortrait,
  grace: graceSelectorPortrait,
  piper: piperSelectorPortrait,
  yuzuha: yuzuhaSelectorPortrait,
  burnice: burniceSelectorPortrait,
  jane: janeSelectorPortrait,
  seth: sethSelectorPortrait,
  yanagi: yanagiSelectorPortrait,
  alice: aliceSelectorPortrait,
  vivian: vivianSelectorPortrait,
  aria: ariaSelectorPortrait,
  promeia: promeiaSelectorPortrait,
  sunna: sunnaSelectorPortrait,
  nangongYu: nangongYuSelectorPortrait,
  miyabi: miyabiSelectorPortrait,
  anton: antonSelectorPortrait,
  rina: rinaSelectorPortrait,
  norma: normaSelectorPortrait,
}
