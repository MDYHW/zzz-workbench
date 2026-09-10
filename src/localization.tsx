import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ActionOutcome, ActionTag, CanonicalActionKind } from './workbench/actions'
import {
  ADMITTED_AGENTS,
  DRIVE_DISCS,
  W_ENGINES,
  agentDisplayName,
  type AgentAttribute,
  type AgentId,
  type AgentSpecialty,
  type DiscId,
  type EngineId,
  type MainStatId,
  type SubstatId,
} from './workbench/content'
import type { EffectMetric, SurfaceKey } from './workbench/effects'
import type { ResultSource } from './workbench/effects'
import type { SourceDefinitionKey, SourceDefinitionLocus } from './workbench/content/source-definitions'

export type Locale = 'ko' | 'en'

const koAgentNames = {
  remielle: '레미엘', pyrois: '피로이스', sigrid: '시그리드', velina: '벨리나',
  yixuan: '의현', dialyn: '다이아린', lucia: '루시아', anbySoldier0: '0호·엔비',
  trigger: '트리거', astraYao: '아스트라', seed: '시드', cissia: '시시아',
  evelyn: '이블린', corin: '코린', lycaon: '리카온', yidhari: '이드하리',
  manato: '마나토', hugo: '휴고', juFufu: '귤복복', panYinhu: '반인호',
  banyue: '반악', starlightBilly: '스타라이트·빌리', ellen: '엘렌', soukaku: '소우카쿠',
  soldier11: '11호', lighter: '라이터', lucy: '루시', zhuYuan: '주연', nicole: '니콜',
  orphie: '오피&「도깨비불」', pulchra: '펄크라', harumasa: '하루마사', qingyi: '청의',
  nekomata: '네코마타', billy: '빌리', ben: '벤', koleda: '콜레다', anby: '엔비',
  caesar: '카이사르', yeShunguang: '엽빛나', zhao: '자오', grace: '그레이스',
  piper: '파이퍼', yuzuha: '유즈하', burnice: '버니스', jane: '제인', seth: '세스',
  yanagi: '야나기', alice: '앨리스', vivian: '비비안', aria: '아리아',
  promeia: '프로미아', sunna: '수나', nangongYu: '남궁우', miyabi: '미야비',
  anton: '앤톤', rina: '리나', norma: '노르마',
} as const satisfies Record<AgentId, string>

const koEngineNames = {
  odeOfResurrectedWings: '돌아온 날개의 시', solExuvia: '태양의 유체',
  knightsExtolment: '기사 예찬', joyauDore: '영롱한 금빛 마음', boisterousEchoes: '둥둥 메아리',
  chiefSidekick: '수석 조수', peacekeeperSpecialized: '평화 수호자-특화형',
  qingming: '청명의 보금자리', cauldron: '푸른 물결의 솥', radiowave: '일렉트로 워크',
  puzzleSphere: '기변의 큐브', yesterdayCalls: '지난밤의 전화', hellfireGears: '헬파이어 기어',
  steamOven: '스팀오븐', dreamlitHearth: '꿈을 빚는 용광로의 노래', thoughtbop: '사유로 빚은 노래',
  weepingCradle: '흐느끼는 요람', kaboom: '호전적인 꽝꽝이', unfetteredGameBall: '내 맘대로 게임 볼',
  severedInnocence: '순결한 희생', cordisGermina: '기계 심장에 내린 씨앗',
  marcatoDesire: '열망의 악센트', starlightEngine: '별빛 엔진', spectralGaze: '탐혼의 눈동자',
  iceJadeTeapot: '맑은 옥주전자', restrained: '구속된 자',
  preciousFossilizedCore: '귀중한 화석 코어', elegantVanity: '우아한 베니티백',
  bashfulDemon: '수줍은 악마', brimstone: '유황석', serpentineSeeker: '추적하는 송곳니',
  bellicoseBlaze: '소란한 총성과 화염', drillRigRedAxis: '굴착기-붉은 축',
  heartstringNocturne: '심금을 울리는 야상곡', steelCushion: '스틸 쿠션', housekeeper: '하우스키퍼',
  blazingLaurel: '화염의 월계관', simmeringPot: '들끓는 가마솥', krakensCradle: '크라켄의 요람',
  grillOWisp: '어스름한 밤의 화염', wrathfulVajra: '성난 눈의 금강', myriadEclipse: '천변하는 태양의 몰락',
  roaringFurnace: '복을 뿜는 맹호', tusksOfFury: '저돌적인 송곳니',
  tremorTrigramVessel: '진괘를 담은 함', starlightRiderFaceplate: '별빛 기사의 가면',
  deepSeaVisitor: '심해 방문객', riotSuppressorMarkVI: '서프레서 Ⅵ형', theVault: '보물함',
  gildedBlossom: '도금된 화신풍', boxCutter: '커터칼', zanshinHerbCase: '잔심의 청낭',
  cloudcleaveRadiance: '구름을 헤친 빛', starlightEngineReplica: '별빛 엔진 레플리카',
  hailstormShrine: '싸락눈 내린 별각', bigCylinder: '빅 실린더', springEmbrace: '봄날의 포옹',
  originalTransmorpher: '오리지널 변신 아이템', halfSugarBunny: '당도 50% 눈토끼',
  timeweaver: '시류의 현자', practicedPerfection: '완벽하게 단조된 별', fusionCompiler: '감입 컴파일러',
  electroLipGloss: '감전 립글로스', weepingGemini: '쌍둥이의 눈물', sharpenedStinger: '예리한 집게칼',
  roaringRide: '뛰뛰빵빵', metanukimorphosis: '너구리의 7단 변신', flamemakerShaker: '타오르는 셰이커',
  flightOfFancy: '별빛 꿈을 누비는 새', angelInTheShell: '껍데기 속 영혼', frostfallSickle: '삭월에 끊어지는 서리',
  neonFantasies: '네온사인 망상',
} as const satisfies Record<EngineId, string>

const koDiscNames = {
  featheredFate: '깃털에 얽힌 맹세', skyAblaze: '새벽녘 여행기', wutheringSalon: '울부짖는 살롱',
  yunkui: '운규 이야기', woodpecker: '딱따구리 일렉트로', branchAndBlade: '나뭇가지 검의 노래',
  king: '산림의 왕', swingJazz: '스윙 재즈', moonlight: '달빛 기사의 칭송',
  shadowHarmony: '그림자처럼 함께', shockstar: '쇼크스타 디스코', astralVoice: '고요 속의 별',
  hormonePunk: '호르몬 펑크', dawnsBloom: '여명의 꽃', pufferElectro: '복어 일렉트로',
  bunnyInWonderland: '이상한 나라의 눈토끼', infernoMetal: '불지옥 메탈', fangedMetal: '송곳니 메탈',
  polarMetal: '극지 메탈', thunderMetal: '썬더 메탈', chaoticMetal: '카오스 메탈',
  whiteWaterBallad: '물빛 노랫소리', chaosJazz: '카오스 재즈', freedomBlues: '자유의 블루스',
  phaethonsMelody: '파에톤의 노래', shiningAria: '빛의 아리아', notesFromTheChained: '수감자 수기',
} as const satisfies Record<DiscId, string>

const enUi = {
  copySetup: 'Copy setup', copying: 'Copying', copied: 'Copied', copyFailed: 'Copy failed',
  copyAria: 'Copy Setup shortcut', copyingAnnouncement: 'Copying Setup shortcut.',
  copiedAnnouncement: 'Setup shortcut copied.', failedAnnouncement: 'Setup shortcut could not be copied.',
  editParty: 'Edit party', changeFormation: 'Change formation', editingParty: 'Editing party',
  currentParty: 'Current party', appliedParty: 'Applied party', applyParty: 'Apply party', cancel: 'Cancel',
  selectAgent: 'Select Agent', select: 'Select', replace: 'Replace', focus: 'Focus', focusChange: 'Focus change',
  selectFocus: 'Select Focus', treatedOnField: 'Treated as on-field', attribute: 'Attribute', specialty: 'Specialty',
  all: 'All', loadout: 'Loadout', mindscape: 'Mindscape', enginePool: 'W-Engine Pool', full: 'Full',
  nonLimited: 'Non-limited', engine: 'W-Engine', driveDiscs: 'Drive Discs', statBank: 'Stat Bank',
  mainStats: 'Main stats', effectiveSubstats: 'Effective substats', result: 'Result', quantity: 'Quantity',
  outcome: 'Outcome', source: 'Source', commonSource: 'Common source', operations: 'Operations',
  setupIncomplete: 'Setup incomplete', fixedSelection: 'Fixed selection', required: 'required',
  resultContext: 'Result context', wholePercent: 'Whole percentage, 100 or higher',
  noMatchingAgents: 'No Agents match these filters.',
} as const

type UiKey = keyof typeof enUi
const koUi = {
  copySetup: '세팅 복사', copying: '복사 중', copied: '복사됨', copyFailed: '복사 실패',
  copyAria: '세팅 바로가기 복사', copyingAnnouncement: '세팅 바로가기를 복사하고 있습니다.',
  copiedAnnouncement: '세팅 바로가기를 복사했습니다.', failedAnnouncement: '세팅 바로가기를 복사하지 못했습니다.',
  editParty: '파티 편성', changeFormation: '편성 변경', editingParty: '파티 편성 중',
  currentParty: '현재 파티', appliedParty: '적용된 파티', applyParty: '편성 적용', cancel: '취소',
  selectAgent: '에이전트 선택', select: '선택', replace: '교체', focus: '주력', focusChange: '주력 변경',
  selectFocus: '주력 선택', treatedOnField: '온필드로 취급', attribute: '속성', specialty: '특성',
  all: '전체', loadout: '기본 설정', mindscape: '형상 시네마', enginePool: 'W-엔진 범위', full: '전체',
  nonLimited: '상시', engine: 'W-엔진', driveDiscs: '디스크', statBank: '스탯 설정',
  mainStats: '주옵션', effectiveSubstats: '유효 부옵션', result: '결과', quantity: '항목',
  outcome: '적용 대상', source: '출처', commonSource: '공통 출처', operations: '별도 효과',
  setupIncomplete: '세팅 미완료', fixedSelection: '고정 선택', required: '선택 필요',
  resultContext: '결과 조건', wholePercent: '100 이상의 정수 백분율',
  noMatchingAgents: '조건에 맞는 에이전트가 없습니다.',
} as const satisfies Record<UiKey, string>

const koAttributes: Record<AgentAttribute, string> = {
  Lumiflux: '광휘', Physical: '물리', Fire: '불', Ice: '얼음', Electric: '전기', Ether: '에테르',
  Wind: '바람', 'Auric Ink': '현묵', 'Honed Edge': '운검', Frost: '서리',
}
const koSpecialties: Record<AgentSpecialty, string> = {
  Attack: '강공', Stun: '격파', Support: '지원', Defense: '방어', Rupture: '명파', Anomaly: '이상',
}

const koActions: Record<CanonicalActionKind, string> = {
  'Basic Attack': '일반 공격', 'Dash Attack': '대시 공격', 'Dodge Counter': '회피 반격',
  'Special Attack': '특수 스킬', 'EX Special Attack': '강화 특수 스킬', Assist: '지원 스킬',
  'Assist Follow-Up': '지원 후속타', 'Chain Attack': '콤보 스킬', Ultimate: '궁극기',
}

const koActionForms: Record<string, string> = {
  'piper-downward-smash': '내려찍기',
  'burnice-mixed-flame': '활활 스티어링',
  'yanagi-rapid-thrust': '빠른 찌르기',
  'alice-celestial-overture': '별의 서곡',
  'aria-enhanced': '강화',
  'qingyi-enchanted-moonlit-blossoms': '취화월운전',
  'koleda-enhanced-furnace-fire': '강화 용광로 불꽃',
  'anby-thunderbolt': '낙뢰',
  'lycaon-fully-charged': '풀 차지',
  'nangong-charged': '차지',
  'sigrid-converging-spear': '창술·회수',
  'seed-falling-petals-slaughter': '낙화·도륙',
  'seed-falling-petals-downfall': '낙화·붕괴',
  'cissia-serpents-kiss': '뱀의 입맞춤',
  'caesar-overpowered-shield-bash': '초강력 방패 공격',
  'against-shielded-enemy': '실드 보유 적 대상',
  'zhao-final-verdict': '최후의 심판',
  'seth-electrified': '뇌정 참격-감전',
  'yixuan-cloud-shaper': '짙은 구름의 술',
  'yixuan-ashen-ink-becomes-shadows': '먹과 함께 사라져라',
}

const koSourceLocalOutcomes: Record<string, string> = {
  disorder: '혼돈',
  'attribute-anomaly': '속성 이상',
  windswept: '풍화',
  vortex: '난류',
  abloom: '난개',
  corruption: '침식',
  luminize: '휘광',
  refringe: '변이',
  'frost-buildup-icefire-target': '서리 축적 · 얼음불길 타깃',
  'anomaly-buildup-frostburn-target': '이상 축적 · 서리열 타깃',
  'anomaly-buildup-after-frostburn-removal': '이상 축적 · 서리열 제거 후',
  'trigger-harmonizing-shot': '저격의 협주',
  'lycaon-glacial-waltz': '복수의 반격·얼음의 춤',
  'lighter-empowered-basic-fifth-hit': '강화 일반 공격 5단',
  'norma-armor-piercing-warhead': '파괴 탄두',
  'norma-high-explosive-warhead': '고폭 탄두',
  shock: '감전',
  assault: '강타',
  'jane-passion-state': '열광 상태',
  'burnice-afterburn': '잿불',
  'burnice-tossing': '이글이글 저글링',
  'burnice-double-shot': '이글이글 쉐이킹·더블',
  'burnice-special-afterburn': '특수 잿불',
  burn: '연소',
  'velina-sweeping-cyclone': '광역 사이클론',
  'wind-anomaly-buildup-wind-anomaly-target': '바람 속성 이상 축적 · 바람 속성 이상 타깃',
  'velina-condensed-cyclone': '국소 사이클론',
  'ellen-charged-arctic-ambush': '차지 살얼음 잠습',
  'ellen-flash-freeze-basic': '급랭 전지법',
  'ellen-icy-blade': '서리 칼날',
  'ellen-glacial-blade-wave': '칼날 파도',
  'sigrid-unbridled-spear-attacks': '겨눠진 창 공격',
  'back-attacks': '배후 공격',
  'cissia-corrode-bone': '침투',
  'corin-extended-chainsaw-actions': '전기톱 연속 공격',
  'hugo-totalize': '결산',
  'soldier11-fire-suppression-basic': '일반 공격: 화력 진압',
  'soldier11-fire-suppression-dash': '대시 공격: 화력 진압',
  'against-stunned-enemies': '그로기 상태의 적 대상',
  'zhu-yuan-enhanced-shotshell-basic': '강화 산탄 일반 공격',
  'zhu-yuan-enhanced-shotshell-dash': '강화 산탄 대시 공격',
  'zhu-yuan-enhanced-shotshell-basic-stunned': '강화 산탄 일반 공격 · 그로기 상태의 적',
  'zhu-yuan-enhanced-shotshell-dash-stunned': '강화 산탄 대시 공격 · 그로기 상태의 적',
  'orphie-heat-charge': '응축된 열에너지',
  'harumasa-hiten-no-tsuru-slash': '대시 공격: 비상하는 활시위·베기',
  'harumasa-chasing-thunder': '벼락 쫓기',
  'ye-shunguang-enlightened-mind-soaring-light': '강화 특수 스킬: 명심경·섬광',
  'ye-shunguang-cleaving-heavens': '궁극기: 망념을 베고 하늘을 열리',
  'miyabi-shimotsuki': '서리와 달',
  'miyabi-shimotsuki-after-disorder': '서리와 달 · 혼돈 발동 후',
  'miyabi-frostburn-break': '서리열·파괴',
  'miyabi-kazahana': '바람꽃',
  'anton-piledriver': '스파이크 공격',
  'anton-drill': '드릴 공격',
  'anton-burst-mode-basic': '폭발 상태 일반 공격',
  'anton-burst-mode-dodge-counter': '폭발 상태 회피 반격',
  'anton-burst-mode-basic-drill': '폭발 상태 일반 공격 · 드릴',
  'anton-burst-mode-basic-piledriver': '폭발 상태 일반 공격 · 스파이크',
  'anton-burst-mode-dodge-drill': '폭발 상태 회피 반격 · 드릴',
  'caesar-overpowered-shield-bash': '초강력 방패 공격',
  'ben-special-ex-block-counter': '특수/강화 특수 스킬 가드 반격',
  'seth-defensive-assist': '패링 지원: 뇌음 방패',
  'starlight-billy-full-throttle-starlight': '일반 공격: 최고 마력 별빛',
  'starlight-billy-cool-wheelie': '강화 특수 스킬: 윌리 스턴트',
  'starlight-billy-flying-kick': '궁극기: 기사의 플라잉킥',
  'banyue-lions-roar': '강화 특수 스킬: 사자후',
  'banyue-lions-roar-wrath': '강화 특수 스킬: 사자후·분노',
  'banyue-mountain-tremor': '강화 특수 스킬: 요동치는 산',
  'banyue-mountain-tremor-wrath': '강화 특수 스킬: 요동치는 산·분노',
  'banyue-toppling-mountain': '일반 공격: 무너진 산',
  'banyue-crushing-peaks': '일반 공격: 산악 분쇄',
}

const koSurfaces: Record<SurfaceKey, string> = { initial: '초기', combat: '전투 입장', fully: '최종' }
const enSurfaces: Record<SurfaceKey, string> = { initial: 'Initial', combat: 'Combat', fully: 'Fully enabled' }
const koSurfaceDescriptions: Record<SurfaceKey, string> = {
  initial: '전투 효과 적용 전 세팅 수치이며 초기 스탯을 읽는 효과의 기준입니다.',
  combat: '전투가 시작된 뒤 별도의 트리거나 상태 변화 없이 사용할 수 있는 수치입니다.',
  fully: '선택한 파티와 세팅으로 의도적으로 달성 가능한 서로 양립하는 효과를 모두 적용한 수치입니다.',
}
const enSurfaceDescriptions: Record<SurfaceKey, string> = {
  initial: 'Setup values before combat effects and the basis for effects that read an initial stat.',
  combat: 'Values available once combat exists without a new post-entry trigger or state change.',
  fully: 'Mutually compatible enabled values intentionally reachable by the selected party and setups.',
}

const koMetrics: Record<EffectMetric, string> = {
  maxHp: 'HP 최대치', atk: '공격력', def: '방어력', sheerForce: '관입력', impact: '충격력',
  critRate: '치명타 확률', critDmg: '치명타 피해', dmgBonus: '피해 보너스', sheerDmgBonus: '관입 피해 보너스',
  resIgnore: '저항 무시', dazeBonus: '그로기 보너스', stunDmgMultiplier: '그로기 약체 배율',
  energyRegen: '에너지 자동 회복', penRatio: '관통률', defIgnore: '방어력 무시',
  resReduction: '저항 감소', defReduction: '방어력 감소', anomalyProficiency: '이상 마스터리',
  anomalyMastery: '이상 장악력', anomalyDmgBonus: '이상 피해 보너스',
  anomalyBuildupBonus: '이상 축적 효율', anomalyBuildupResReduction: '이상 축적 저항 감소',
  luminizeMultiplier: '휘광 피해 배율', refringeFactor: '변이 계수',
}

const koStats: Partial<Record<MainStatId | SubstatId | string, string>> = {
  critRate: '치명타 확률', critDmg: '치명타 피해', etherDmg: '에테르 피해 보너스', hpPct: 'HP',
  hpFlat: 'HP', atkPct: '공격력', atkFlat: '공격력', physicalDmg: '물리 피해 보너스',
  penRatio: '관통률', impact: '충격력', impactPct: '충격력', energyRegenPct: '에너지 자동 회복', electricDmg: '전기 피해 보너스',
  fireDmg: '불 피해 보너스', iceDmg: '얼음 피해 보너스', windDmg: '바람 피해 보너스',
  defPct: '방어력', anomalyProficiency: '이상 마스터리', anomalyMastery: '이상 장악력',
}

// Numeric values remain owned by the source facts. These templates are selected
// only by stable equipment identity and effect position; English copy is never
// used as translation identity.
const koEnginePassiveTemplates = {
  odeOfResurrectedWings: ['이상 마스터리 +{0}', '속성 이상 피해 +{0}%', '파티 피해 +{0}%'],
  solExuvia: ['치명타 확률 +{0}%', '에테르 저항 무시 +{0}%'],
  knightsExtolment: ['치명타 피해 +{0}%', '얼음 저항 무시 +{0}%'],
  joyauDore: ['이상 마스터리 +{0}', '난류 및 풍화 피해 +{0}%', '파티 이상 마스터리 +{0}'],
  boisterousEchoes: ['에너지 +{0}', '속성 이상 상태의 타깃 대상 피해 +{0}%'],
  chiefSidekick: ['충격력 +{0}', '불 저항 무시 +{0}%', '대기 중 에너지 자동 회복 +{0}/s', '파티 피해 +{0}%'],
  peacekeeperSpecialized: ['에너지 자동 회복 +{0}/s', '강화 특수 스킬 및 지원 후속타 이상 축적 +{0}%'],
  tusksOfFury: ['제공하는 실드량 +{0}%', '파티 피해 +{0}%', '파티 그로기 수치 +{0}%'],
  tremorTrigramVessel: ['강화 특수 스킬 및 궁극기 피해 +{0}%', '파티원이 피해를 받거나 회복 시 · 에너지 +{0}'],
  roaringFurnace: ['강화 특수 스킬, 콤보 스킬 및 궁극기 그로기 수치 +{0}%', '파티 피해 +{0}%'],
  myriadEclipse: ['치명타 피해 +{0}%', '방어력 무시 +{0}%'],
  krakensCradle: ['얼음 관입 피해 +{0}%', 'HP 최대치가 {0}% 이하일 때 · 치명타 확률 +{1}%'],
  grillOWisp: ['불 피해 +{0}%', '치명타 확률 +{0}%'],
  wrathfulVajra: ['치명타 확률 +{0}%', '강화 특수 스킬 · 불 관입 피해 +{0}%'],
  starlightRiderFaceplate: ['치명타 확률 +{0}%', '물리 관입 피해 +{0}%'],
  qingming: ['치명타 확률 +{0}%', '에테르 피해 +{0}%', '강화 특수 스킬 및 궁극기 · 에테르 관입 피해 +{0}%'],
  cauldron: ['피해 +{0}%', '치명타 확률 +{0}%'],
  radiowave: ['관입력 +{0}'],
  puzzleSphere: ['치명타 피해 +{0}%', '타깃 HP가 {0}% 미만일 때 · 강화 특수 스킬 피해 +{1}%'],
  yesterdayCalls: ['대기 중 에너지 자동 회복 +{0}/s', '그로기 수치 +{0}%', '파티 치명타 피해 +{0}%'],
  hellfireGears: ['대기 중 에너지 +{0}/s', '충격력 +{0}%'],
  neonFantasies: ['이상 마스터리 +{0}', '파티 피해 +{0}%'],
  steamOven: ['충격력 +{0}%'],
  dreamlitHearth: ['에너지 +{0}/s', '파티 HP 최대치 +{0}%', '파티 피해 +{0}%'],
  thoughtbop: ['에너지 +{0}/s', '파티 피해 +{0}%', '파티 공격력 +{0}%'],
  weepingCradle: ['에너지 +{0}/s', '파티 피해 +{0}%'],
  kaboom: ['파티 공격력 +{0}%'],
  unfetteredGameBall: ['약점 속성과 일치하는 타깃 · 파티 치명타 확률 +{0}%'],
  severedInnocence: ['치명타 피해 +{0}%', '전기 피해 +{0}%'],
  cordisGermina: ['치명타 확률 +{0}%', '전기 피해 +{0}%', '일반 공격 및 궁극기 방어력 무시 +{0}%'],
  marcatoDesire: ['공격력 +{0}%'],
  starlightEngine: ['공격력 +{0}%'],
  spectralGaze: ['적 방어력 감소 +{0}%', '충격력 +{0}%'],
  iceJadeTeapot: ['충격력 +{0}%', '파티 피해 +{0}%'],
  restrained: ['일반 공격 피해 +{0}%', '일반 공격 그로기 수치 +{0}%'],
  preciousFossilizedCore: ['타깃 HP가 {0}% 이상일 때 · 그로기 수치 +{1}%', '타깃 HP가 {0}% 이상일 때 · 총 그로기 수치 +{1}%'],
  elegantVanity: ['에너지 +{0}', '파티 피해 +{0}%'],
  bashfulDemon: ['파티 공격력 +{0}%'],
  brimstone: ['공격력 +{0}%'],
  serpentineSeeker: ['치명타 확률 +{0}%', '전기 피해 · 방어력 무시 +{0}%'],
  bellicoseBlaze: ['치명타 확률 +{0}%', '불 속성 여진 피해 방어력 무시 +{0}%'],
  drillRigRedAxis: ['일반 공격 및 대시 공격 전기 피해 +{0}%'],
  heartstringNocturne: ['치명타 피해 +{0}%', '콤보 스킬 및 궁극기 불 저항 무시 +{0}%'],
  steelCushion: ['물리 피해 +{0}%', '배후 공격 피해 +{0}%'],
  housekeeper: ['에너지 자동 회복 +{0}/s', '강화 특수 스킬 물리 피해 +{0}%'],
  blazingLaurel: ['충격력 +{0}%', '불 및 얼음 치명타 피해 +{0}%'],
  simmeringPot: ['그로기 수치 +{0}%', '피해 +{0}%'],
  deepSeaVisitor: ['얼음 피해 +{0}%', '치명타 확률 +{0}%'],
  riotSuppressorMarkVI: ['치명타 확률 +{0}%', '에테르 일반 공격 및 대시 공격 피해 +{0}%'],
  theVault: ['대상 파티원 피해 +{0}%', '장착자 에너지 +{0}/s'],
  gildedBlossom: ['공격력 +{0}%', '강화 특수 스킬 피해 +{0}%'],
  boxCutter: ['물리 피해 +{0}%', '그로기 수치 +{0}%'],
  zanshinHerbCase: ['치명타 확률 +{0}%', '전기 대시 공격 피해 +{0}%'],
  cloudcleaveRadiance: ['물리 저항 무시 +{0}%', '피해 +{0}%', '치명타 피해 +{0}%'],
  starlightEngineReplica: ['물리 피해 +{0}%'],
  hailstormShrine: ['치명타 피해 +{0}%', '얼음 피해 +{0}%'],
  bigCylinder: ['받는 피해 -{0}%', '다음 공격 확정 치명타 및 방어력의 {0}% 추가 피해'],
  springEmbrace: ['받는 피해 -{0}%', '에너지 획득 효율 +{0}% · 다음 온필드 에이전트에게 전달'],
  originalTransmorpher: ['HP 최대치 +{0}%', '충격력 +{0}%'],
  halfSugarBunny: ['에너지 자동 회복 +{0}/s', '파티 공격력 및 HP 최대치 +{0}% · 중첩 불가', '에테르 베일 발동 또는 지속 시간 연장 · 파티 치명타 피해 +{0}%'],
  timeweaver: ['전기 이상 축적 +{0}%', '이상 마스터리 +{0}', '이상 마스터리 {0} 이상 · 혼돈 피해 +{1}%'],
  practicedPerfection: ['이상 장악력 +{0}', '물리 피해 +{0}%'],
  fusionCompiler: ['공격력 +{0}%', '이상 마스터리 +{0}'],
  electroLipGloss: ['공격력 +{0}%', '피해 +{0}%'],
  weepingGemini: ['이상 마스터리 +{0}'],
  sharpenedStinger: ['물리 피해 +{0}%', '물리 이상 축적 +{0}%'],
  roaringRide: ['공격력 +{0}%', '이상 마스터리 +{0}', '이상 축적 +{0}%'],
  metanukimorphosis: ['이상 장악력 +{0}', '파티 이상 마스터리 +{0}'],
  flamemakerShaker: ['대기 중 에너지 자동 회복 +{0}/s', '피해 +{0}%', '이상 마스터리 +{0}'],
  flightOfFancy: ['이상 축적 +{0}%', '이상 마스터리 +{0}'],
  angelInTheShell: ['이상 마스터리 +{0}', '속성 이상 상태의 타깃 대상 피해 +{0}%', '속성 이상 및 혼돈 피해 +{0}%'],
  frostfallSickle: ['얼음 피해 +{0}%', '난개 피해 +{0}%'],
} as const satisfies Record<EngineId, readonly string[]>

const koDiscEffectTemplates = {
  featheredFate: { twoPiece: ['이상 마스터리 +{0}'], fourPiece: ['이상 마스터리 +{0}', '속성 이상 피해 +{0}%'] },
  skyAblaze: { twoPiece: ['에테르 피해 +{0}%'], fourPiece: ['치명타 피해 +{0}%', '공격력 +{0}%'] },
  wutheringSalon: { twoPiece: ['바람 피해 +{0}%'], fourPiece: ['이상 마스터리 +{0}', '피해 +{0}%'] },
  yunkui: { twoPiece: ['HP +{0}%'], fourPiece: ['치명타 확률 +{0}%', '관입 피해 +{0}%'] },
  woodpecker: { twoPiece: ['치명타 확률 +{0}%'], fourPiece: ['공격력 +{0}%'] },
  branchAndBlade: { twoPiece: ['치명타 피해 +{0}%'], fourPiece: ['이상 장악력 {0} 이상 · 치명타 피해 +{1}%', '치명타 확률 +{0}%'] },
  king: { twoPiece: ['그로기 수치 +{0}%'], fourPiece: ['파티 치명타 피해 +{0}%'] },
  swingJazz: { twoPiece: ['에너지 자동 회복 +{0}%'], fourPiece: ['파티 피해 +{0}%'] },
  moonlight: { twoPiece: ['에너지 자동 회복 +{0}%'], fourPiece: ['파티 피해 +{0}%'] },
  shadowHarmony: { twoPiece: ['여진 피해 및 대시 공격 피해 +{0}%'], fourPiece: ['공격력 +{0}%', '치명타 확률 +{0}%'] },
  shockstar: { twoPiece: ['충격력 +{0}%'], fourPiece: ['일반 공격, 대시 공격 및 회피 반격 그로기 수치 +{0}%'] },
  astralVoice: { twoPiece: ['공격력 +{0}%'], fourPiece: ['교대 출전한 에이전트 피해 +{0}%'] },
  hormonePunk: { twoPiece: ['공격력 +{0}%'], fourPiece: ['공격력 +{0}%'] },
  dawnsBloom: { twoPiece: ['일반 공격 피해 +{0}%'], fourPiece: ['일반 공격 피해 +{0}%'] },
  pufferElectro: { twoPiece: ['관통률 +{0}%'], fourPiece: ['궁극기 피해 +{0}%', '공격력 +{0}%'] },
  bunnyInWonderland: { twoPiece: ['HP +{0}%'], fourPiece: ['파티 피해 +{0}%'] },
  infernoMetal: { twoPiece: ['불 피해 +{0}%'], fourPiece: ['연소 상태의 타깃 · 치명타 확률 +{0}%'] },
  fangedMetal: { twoPiece: ['물리 피해 +{0}%'], fourPiece: ['강타 상태의 타깃 · 장착자 피해 +{0}%'] },
  polarMetal: { twoPiece: ['얼음 피해 +{0}%'], fourPiece: ['일반 공격 및 대시 공격 피해 +{0}%'] },
  thunderMetal: { twoPiece: ['전기 피해 +{0}%'], fourPiece: ['공격력 +{0}%'] },
  chaoticMetal: { twoPiece: ['에테르 피해 +{0}%'], fourPiece: ['치명타 피해 +{0}%'] },
  whiteWaterBallad: { twoPiece: ['물리 피해 +{0}%'], fourPiece: ['치명타 확률 +{0}%', '공격력 +{0}%'] },
  chaosJazz: { twoPiece: ['이상 마스터리 +{0}'], fourPiece: ['불 및 전기 피해 +{0}%', '강화 특수 스킬 및 지원 스킬 피해 +{0}%'] },
  freedomBlues: { twoPiece: ['이상 마스터리 +{0}'], fourPiece: ['{attribute} 이상 축적 저항 -{0}%'] },
  phaethonsMelody: { twoPiece: ['이상 장악력 +{0}%'], fourPiece: ['이상 마스터리 +{0}', '에테르 피해 +{0}%'] },
  shiningAria: { twoPiece: ['에테르 피해 +{0}%'], fourPiece: ['이상 마스터리 +{0}', '그로기 상태의 타깃 대상 피해 +{0}%'] },
  notesFromTheChained: { twoPiece: ['얼음 피해 +{0}%'], fourPiece: ['이상 마스터리 +{0}', '파티 속성 이상 및 혼돈 피해 +{0}%'] },
} as const satisfies Record<DiscId, { twoPiece: readonly string[]; fourPiece: readonly string[] }>

const koSourceLoci: Partial<Record<SourceDefinitionLocus, string>> = {
  identity: '고유 효과',
  core: '핵심 패시브',
  additional: '추가 능력',
  basic: '일반 공격',
  assist: '지원 스킬',
  chain: '콤보 스킬',
  special: '특수 스킬',
  'ex-special': '강화 특수 스킬',
  ultimate: '궁극기',
  mindscape: '형상 시네마',
  calculation: '계산',
  target: '타깃',
}

const koPresentation: Record<string, string> = {
  'disc-piece-2': '2세트',
  'disc-piece-4': '4세트',
  'equal-non-stacking-origin': '동일한 비중첩 출처',
  'initial-atk': '초기 공격력',
  'initial-energy-regen': '초기 에너지 자동 회복',
  'initial-crit-rate': '초기 치명타 확률',
  'initial-max-hp': '초기 HP 최대치',
  'initial-pen-ratio': '초기 관통률',
  'initial-anomaly-mastery': '초기 이상 장악력',
  'combat-crit-rate': '전투 입장 치명타 확률',
  'fully-crit-rate': '최종 치명타 확률',
  'fully-impact': '최종 충격력',
  'fully-sheer-force': '최종 관입력',
  'fully-anomaly-proficiency': '최종 이상 마스터리',
  'fully-anomaly-mastery': '최종 이상 장악력',
  'raw-stun-dmg-multiplier-bonus': '그로기 약체 배율 보너스 원값',
  'squad-flat-atk': '파티 고정 공격력',
  'squad-atk': '파티 공격력',
  'flat-atk': '고정 공격력',
  'focus-flat-atk': '주력 고정 공격력',
  'focus-sheer-force': '주력 관입력',
  'squad-sheer-force': '파티 관입력',
  'squad-crit-dmg': '파티 치명타 피해',
  'squad-dmg-bonus': '파티 피해 보너스',
  'other-party-pen-ratio': '다른 파티원 관통률',
  'anomaly-buildup-rate': '이상 축적 효율',
  'attribute-anomaly-dmg': '속성 이상 피해',
  'disorder-dmg': '혼돈 피해',
  'afterburn-dmg-bonus': '잿불 피해 보너스',
  'assault-crit-rate': '강타 치명타 확률',
  'at-passion-flat-atk': '열광 상태 · 고정 공격력',
  'anomaly-mastery': '이상 장악력',
  'dmg-bonus': '피해 보너스',
  'combat-impact-bonus': '전투 입장 충격력 보너스',
  'combat-crit-dmg-bonus': '전투 입장 치명타 피해 보너스',
  'special-ex-ultimate-daze-bonus': '특수·강화 특수 스킬·궁극기 그로기 보너스',
  'aftershock-daze-bonus': '여진 피해 그로기 보너스',
  'fire-ice-dmg-bonus': '불/얼음 피해 보너스',
  impact: '충격력',
  'veil-vulnerability': '장막 취약',
  'frost-anomaly-buildup-bonus': '서리 이상 축적 보너스',
  'chain-ultimate-dmg-multiplier': '콤보 스킬 및 궁극기 피해 배율',
  'totalize-added-dmg-multiplier': '결산 추가 피해 배율',
  'totalize-maximum-daze-return': '결산 최대 그로기 반환',
  'ex-special-non-stunned-daze-scale': '비그로기 적 대상 강화 특수 스킬 그로기 배율',
  'ex-special-non-stunned-totalize-added-dmg-multiplier': '비그로기 적 대상 강화 특수 스킬 결산 추가 피해 배율',
  'original-shock-dmg-scale': '기존 감전 피해',
  'enemy-stun-duration': '적 그로기 지속 시간',
  'stun-duration-extension': '그로기 지속 시간 연장',
  'flower-feather-dance': '꽃깃의 춤',
  'added-abloom-dmg-multiplier': '난개 추가 피해 배율',
  'added-afterburn-dmg-multiplier': '잿불 추가 피해 배율',
  'added-vortex-dmg-multiplier': '난류 추가 피해 배율',
  'burn-duration': '연소 지속 시간',
  'frostbite-duration': '서리한 지속 시간',
  'shock-duration': '감전 지속 시간',
  'disorder-dmg-multiplier': '혼돈 피해 배율',
  'maximum-disorder-dmg-multiplier': '최대 혼돈 피해 배율',
  'luminize-trigger-count': '드리운 무지개 / 우아한 날갯짓 · 휘광 발동 횟수',
  'crushing-peaks-added-dmg-multiplier': '일반 공격: 산악 분쇄 추가 피해 배율',
  'next-quick-assist-daze': '다음 빠른 지원 그로기 수치',
  'final-verdict-max-hp': '일반 공격: 최후의 심판 최대 차지 HP 최대치',
  'next-quick-assist': '다음 빠른 지원',
  'final-verdict-maximum-charge': '최후의 심판 · 최대 차지',
  'distinct-refringe-formula-factor': '독립적인 변이 계수',
  'added-luminize-dmg-multiplier': '휘광 추가 피해 배율',
  'phase-flow': '상변하는 시류',
  'prismatic-target': '프리즘 타깃',
  'against-ex-hit-target': '강화 특수 스킬에 명중한 타깃 대상',
  'against-exposed-target': '간파 상태의 타깃 대상',
  'against-physical-anomaly-enemy': '물리 이상 상태의 적 대상',
  'against-corrupted-enemy': '침식 상태의 적 대상',
  'against-prophecy-target': '예언 상태의 타깃 대상',
  'ignores-ether-anomaly-buildup-res': '에테르 이상 축적 저항 무시',
  'from-initial-anomaly-mastery-above-150': '초기 이상 장악력 150 초과분',
  'from-promeia-initial-anomaly-mastery-above-150': '프로미아의 초기 이상 장악력 150 초과분',
  'against-presumption-target': '선입견 상태의 타깃 대상',
  'sweeping-cyclone-wind-anomaly-buildup-res': '광역 사이클론 · 바람 이상 축적 저항',
  'contamination-attribute-selected-by-focus': '오염 속성 · 주력으로 선택',
  'armor-piercing-or-high-explosive-warhead-hit': '파괴 탄두 또는 고폭 탄두 명중',
  'empowered-basic-fifth-hit': '강화 일반 공격 5단',
  'current-atk-and-max-hp-sheer-formula': '현재 공격력 × 0.3 + 현재 HP 최대치 × 0.1',
  'corrode-bone': '침투',
  'above-100-percent': '100% 초과분',
  'crit-dmg-times-35-percent': '치명타 피해 × 35%',
  'shield-of-firm-resolve': '굳은 의지의 방패',
  darkbreaker: '마계를 가르는 어둠',
  'ether-veil-wellspring': '에테르 베일: 샘물',
  'dreamers-nursery-rhyme': '꿈꾸는 이의 자장가',
  'darkbreaker-and-wellspring': '마계를 가르는 어둠 + 샘물',
  'mindscape-2-tier': '형상 시네마 2단계',
  '3-stacks': '3스택',
  '10-stacks': '10스택',
  'rebellious-assault': '반격의 기세',
  'invulnerable-block-counter': '무적 가드 반격',
  'after-ex-special-or-follow-up': '강화 특수 스킬 또는 후속 공격 후',
  'after-perfect-block-retaliation-or-defensive-assist': '정밀 가드·방어 반격·패링 지원 후',
  'special-attack-skill-level-plus-2': '특수 스킬 레벨 +2',
  'radiant-aegis-atk-replacement': '찬란한 방패 공격력 대체',
  'while-radiant-aegis-active': '찬란한 방패 활성 중',
  'against-shielded-enemy': '실드 보유 적 대상',
  'ultimate-skill-level-plus-2': '궁극기 레벨 +2',
  'guaranteed-crit': '확정 치명타',
  'core-crit-rate-increase': '핵심 패시브 치명타 확률 증가',
  'all-attribute-res-ignore': '모든 속성 저항 무시',
  'reachable-healing-condition': '달성 가능한 치유 조건',
  'against-shocked-enemies': '감전 상태의 적 대상',
  'seed-additional-setup': '추가 능력 효과',
  'action-dmg-multiplier': '공격 피해 배율',
  'automatic-energy': '에너지 자동 회복',
}

const koCalculationSources: Record<string, string> = {
  'crit-rate-cap': '표시 치명타 확률 상한',
  'target-stun': '타깃 그로기 약체 배율',
  'veil-vulnerability-cap': '장막 취약 상한',
}

export function localizeText(text: string, locale: Locale): string {
  if (locale === 'en') return text
  const engine = (Object.entries(W_ENGINES) as Array<[EngineId, (typeof W_ENGINES)[EngineId]]>)
    .find(([, value]) => value.name === text)
  if (engine) return koEngineNames[engine[0]]
  const disc = (Object.entries(DRIVE_DISCS) as Array<[DiscId, (typeof DRIVE_DISCS)[DiscId]]>)
    .find(([, value]) => value.name === text)
  if (disc) return koDiscNames[disc[0]]
  return text
}

function renderEquipmentTemplate(
  template: string | undefined,
  fallback: string,
  attribute?: AgentAttribute,
): string {
  if (!template) return fallback
  const values = fallback.match(/\d+(?:\.\d+)?/g) ?? []
  return template
    .replaceAll('{attribute}', attribute ? koAttributes[attribute] : '')
    .replace(/\{(\d+)\}/g, (_, index: string) => values[Number(index)] ?? '')
}

export function localizedAgentName(agentId: AgentId, locale: Locale): string {
  if (locale === 'ko') return koAgentNames[agentId]
  return agentDisplayName(ADMITTED_AGENTS.find(({ id }) => id === agentId)!)
}

export function localizedEngineName(engineId: EngineId, locale: Locale): string {
  return locale === 'ko' ? koEngineNames[engineId] : W_ENGINES[engineId].name
}

export function localizedDiscName(discId: DiscId, locale: Locale): string {
  return locale === 'ko' ? koDiscNames[discId] : DRIVE_DISCS[discId].name
}

export function localizedAttribute(attribute: AgentAttribute, locale: Locale): string {
  return locale === 'ko' ? koAttributes[attribute] : attribute
}

export function localizedSpecialty(specialty: AgentSpecialty, locale: Locale): string {
  return locale === 'ko' ? koSpecialties[specialty] : specialty
}

export function localizedStat(id: string, fallback: string, locale: Locale): string {
  return locale === 'ko' ? koStats[id] ?? localizeText(fallback, locale) : fallback
}

export function localizedMetric(id: EffectMetric, fallback: string, locale: Locale): string {
  return locale === 'ko' ? koMetrics[id] : fallback
}

export function localizedSurface(surface: SurfaceKey, locale: Locale): string {
  return locale === 'ko' ? koSurfaces[surface] : enSurfaces[surface]
}

export function localizedSurfaceDescription(surface: SurfaceKey, locale: Locale): string {
  return locale === 'ko' ? koSurfaceDescriptions[surface] : enSurfaceDescriptions[surface]
}

export function localizedActionOutcome(outcome: ActionOutcome, locale: Locale): string {
  if (locale === 'en') {
    if (outcome.kind === 'canonical') return outcome.action
    if (outcome.kind === 'form') return `${outcome.action}: ${outcome.form}`
    return outcome.label
  }
  if (outcome.kind === 'canonical') return koActions[outcome.action]
  if (outcome.kind === 'form') return `${koActions[outcome.action]}: ${koActionForms[outcome.formId] ?? outcome.form}`
  if (outcome.outcomeId.startsWith('flavor-match-')) return '동일 속성 공격'
  return koSourceLocalOutcomes[outcome.outcomeId] ?? outcome.label
}

export function localizedActionTag(tag: ActionTag, locale: Locale): string {
  return locale === 'ko' && tag === 'aftershock' ? '여진 피해' : 'Aftershock'
}

export function localizedPresentation(
  presentationId: string | undefined,
  fallback: string,
  locale: Locale,
): string {
  if (locale === 'en') return fallback
  if (presentationId?.startsWith('idyllic-cadenza-level-')) {
    return `아름다운 칸타빌레 · 레벨 ${presentationId.slice('idyllic-cadenza-level-'.length)}`
  }
  const darkbreakerTier = presentationId?.match(/^mindscape-(\d+)-darkbreaker$/)
  if (darkbreakerTier) return `형상 시네마 ${darkbreakerTier[1]}단계 · 마계를 가르는 어둠`
  return presentationId ? koPresentation[presentationId] ?? localizeText(fallback, locale) : localizeText(fallback, locale)
}

function localizedSourceKey(key: SourceDefinitionKey, locus: SourceDefinitionLocus): string | undefined {
  switch (key.kind) {
    case 'agent-base':
      return '기본 능력치'
    case 'agent-source':
      if (key.sourceId === 'potential') return '잠재 능력'
      if (key.sourceId === 'stances') return '자세 효과'
      if (key.sourceId === 'rupture-sheer-force') return '명파 특성'
      return koSourceLoci[locus]
    case 'mindscape':
      return '형상 시네마'
    case 'w-engine-base':
    case 'w-engine':
      return koEngineNames[key.engineId]
    case 'drive-disc':
      return koDiscNames[key.discId]
    case 'fixed-main':
    case 'editable-main':
      return `디스크 · ${key.slot.replace('slot', '')}번 슬롯`
    case 'effective-substat':
      return koStats[key.statId]
    case 'calculation': {
      const calculationId = key.calculationId.split(':').at(-1)!
      return koCalculationSources[calculationId] ?? koSourceLoci[locus]
    }
  }
}

export function localizedSourceLabel(source: ResultSource, locale: Locale): string {
  if (locale === 'en') return source.label
  return source.sourceKey
    ? localizedSourceKey(source.sourceKey, source.locus) ?? localizeText(source.label, locale)
    : koSourceLoci[source.locus] ?? localizeText(source.label, locale)
}

export function localizedSourceDetail(source: ResultSource, locale: Locale): string | undefined {
  if (!source.detail) return undefined
  if (locale === 'en') return source.detail
  if (source.detailParts?.length) {
    return source.detailParts
      .map((part) => localizedPresentation(part.presentationId, part.label, locale))
      .join(' · ')
  }
  return localizeText(source.detail, locale)
}

/** Setup copy is selected by stable equipment identity and line position. */
export function localizedEnginePassiveLine(
  engineId: EngineId,
  lineIndex: number,
  line: string,
  locale: Locale,
): string {
  return locale === 'ko'
    ? renderEquipmentTemplate(koEnginePassiveTemplates[engineId][lineIndex], line)
    : line
}

/** Setup copy is selected by stable Disc identity, piece, and line position. */
export function localizedDiscEffectLine(
  discId: DiscId,
  piece: 'twoPiece' | 'fourPiece',
  lineIndex: number,
  line: string,
  locale: Locale,
  holderAttribute?: AgentAttribute,
): string {
  return locale === 'ko'
    ? renderEquipmentTemplate(koDiscEffectTemplates[discId][piece][lineIndex], line, holderAttribute)
    : line
}

interface LocalizationValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: UiKey) => string
}

const defaultLocalization: LocalizationValue = {
  locale: 'en',
  setLocale: () => {},
  t: (key) => enUi[key],
}

const LocalizationContext = createContext<LocalizationValue>(defaultLocalization)

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ko')
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  const value = useMemo<LocalizationValue>(() => ({
    locale,
    setLocale,
    t: (key) => locale === 'ko' ? koUi[key] : enUi[key],
  }), [locale])
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization(): LocalizationValue {
  return useContext(LocalizationContext)
}

export const translationCoverage = {
  agents: Object.keys(koAgentNames).length === ADMITTED_AGENTS.length,
  engines: Object.keys(koEngineNames).length === Object.keys(W_ENGINES).length,
  discs: Object.keys(koDiscNames).length === Object.keys(DRIVE_DISCS).length,
  engineEffects: (Object.entries(W_ENGINES) as Array<[EngineId, (typeof W_ENGINES)[EngineId]]>)
    .every(([engineId, engine]) => ([1, 2, 3, 4, 5] as const)
      .every((refinement) => engine.passiveLines(refinement).length === koEnginePassiveTemplates[engineId].length)),
  discEffects: (Object.entries(DRIVE_DISCS) as Array<[DiscId, (typeof DRIVE_DISCS)[DiscId]]>)
    .every(([discId, disc]) => {
      if (koDiscEffectTemplates[discId].twoPiece.length !== 1) return false
      return (Object.keys(koAttributes) as AgentAttribute[]).every((attribute) => {
        const effects = disc.fourPieceEffectsForHolder?.(attribute) ?? disc.fourPieceEffects ?? []
        return effects.length === koDiscEffectTemplates[discId].fourPiece.length
      })
    }),
} as const
