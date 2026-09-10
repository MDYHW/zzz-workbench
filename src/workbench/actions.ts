import type { AgentAttribute } from './content/types'

export type CanonicalActionKind =
  | 'Basic Attack'
  | 'Dash Attack'
  | 'Dodge Counter'
  | 'Special Attack'
  | 'EX Special Attack'
  | 'Assist'
  | 'Assist Follow-Up'
  | 'Chain Attack'
  | 'Ultimate'

export type ActionTag = 'aftershock'

export type ActionFormId =
  | 'piper-downward-smash'
  | 'burnice-mixed-flame'
  | 'yanagi-rapid-thrust'
  | 'alice-celestial-overture'
  | 'aria-enhanced'
  | 'qingyi-enchanted-moonlit-blossoms'
  | 'koleda-enhanced-furnace-fire'
  | 'anby-thunderbolt'
  | 'lycaon-fully-charged'
  | 'nangong-charged'
  | 'sigrid-converging-spear'
  | 'seed-falling-petals-slaughter'
  | 'seed-falling-petals-downfall'
  | 'cissia-serpents-kiss'
  | 'caesar-overpowered-shield-bash'
  | 'against-shielded-enemy'
  | 'zhao-final-verdict'
  | 'seth-electrified'
  | 'yixuan-cloud-shaper'
  | 'yixuan-ashen-ink-becomes-shadows'

export type SourceLocalOutcomeId =
  | 'disorder' | 'attribute-anomaly' | 'windswept' | 'vortex' | 'abloom' | 'corruption'
  | 'luminize' | 'refringe' | 'frost-buildup-icefire-target'
  | 'anomaly-buildup-frostburn-target' | 'anomaly-buildup-after-frostburn-removal'
  | 'trigger-harmonizing-shot' | 'lycaon-glacial-waltz' | 'lighter-empowered-basic-fifth-hit'
  | 'norma-armor-piercing-warhead' | 'norma-high-explosive-warhead'
  | 'shock' | 'assault' | 'jane-passion-state' | 'burnice-afterburn' | 'burnice-tossing'
  | 'burnice-double-shot' | 'burnice-special-afterburn' | 'burn'
  | 'velina-sweeping-cyclone' | 'wind-anomaly-buildup-wind-anomaly-target'
  | 'velina-condensed-cyclone' | 'ellen-charged-arctic-ambush' | 'ellen-flash-freeze-basic'
  | 'ellen-icy-blade' | 'ellen-glacial-blade-wave' | 'sigrid-unbridled-spear-attacks'
  | 'back-attacks' | 'cissia-corrode-bone' | 'corin-extended-chainsaw-actions'
  | 'hugo-totalize' | 'soldier11-fire-suppression-basic' | 'soldier11-fire-suppression-dash'
  | 'against-stunned-enemies' | 'zhu-yuan-enhanced-shotshell-basic'
  | 'zhu-yuan-enhanced-shotshell-dash' | 'zhu-yuan-enhanced-shotshell-basic-stunned'
  | 'zhu-yuan-enhanced-shotshell-dash-stunned' | 'orphie-heat-charge'
  | 'harumasa-hiten-no-tsuru-slash' | 'harumasa-chasing-thunder'
  | 'ye-shunguang-enlightened-mind-soaring-light' | 'ye-shunguang-cleaving-heavens'
  | 'miyabi-shimotsuki' | 'miyabi-shimotsuki-after-disorder' | 'miyabi-frostburn-break'
  | 'miyabi-kazahana' | 'anton-piledriver' | 'anton-drill' | 'anton-burst-mode-basic'
  | 'anton-burst-mode-dodge-counter' | 'anton-burst-mode-basic-drill'
  | 'anton-burst-mode-basic-piledriver' | 'anton-burst-mode-dodge-drill'
  | 'caesar-overpowered-shield-bash' | 'ben-special-ex-block-counter' | 'seth-defensive-assist'
  | 'starlight-billy-full-throttle-starlight' | 'starlight-billy-cool-wheelie'
  | 'starlight-billy-flying-kick' | 'banyue-lions-roar' | 'banyue-lions-roar-wrath'
  | 'banyue-mountain-tremor' | 'banyue-mountain-tremor-wrath'
  | 'banyue-toppling-mountain' | 'banyue-crushing-peaks'
  | 'flavor-match'

export type ActionOutcome =
  | { kind: 'canonical'; action: CanonicalActionKind }
  | { kind: 'form'; action: CanonicalActionKind; formId: ActionFormId; form: string }
  | ({
    kind: 'source-local'
    outcomeId: Exclude<SourceLocalOutcomeId, 'flavor-match'>
    label: string
    qualifier?: never
  } | {
    kind: 'source-local'
    outcomeId: 'flavor-match'
    label: string
    qualifier: AgentAttribute
  })

declare const actionTargetBrand: unique symbol

export interface ActionTarget {
  readonly outcomes: readonly ActionOutcome[]
  readonly tags: readonly ActionTag[]
  readonly [actionTargetBrand]: never
}

export const actionTarget = (
  outcomes: readonly ActionOutcome[],
  tags: readonly ActionTag[] = [],
): ActionTarget => ({ outcomes, tags } as ActionTarget)

// One semantic tag target is shared across providers and recipients so
// cross-Agent Aftershock clauses compose with the same current action row.
export const AFTERSHOCK_TARGET = actionTarget([], ['aftershock'])

// Shared action identities used by providers and their Stun recipients.
export const BASIC_AFTERSHOCK_TARGET = actionTarget(
  [{ kind: 'canonical', action: 'Basic Attack' }],
  ['aftershock'],
)

export const canonicalAction = (
  action: CanonicalActionKind,
): ActionOutcome => ({ kind: 'canonical', action })

export const actionForm = (
  action: CanonicalActionKind,
  formId: ActionFormId,
  form: string,
): ActionOutcome => ({ kind: 'form', action, formId, form })

type FixedSourceLocalOutcomeId = Exclude<SourceLocalOutcomeId, 'flavor-match'>

export function sourceLocalAction(
  outcomeId: FixedSourceLocalOutcomeId,
  label: string,
): ActionOutcome
export function sourceLocalAction(
  outcomeId: 'flavor-match',
  label: string,
  qualifier: AgentAttribute,
): ActionOutcome
export function sourceLocalAction(
  outcomeId: SourceLocalOutcomeId,
  label: string,
  qualifier?: AgentAttribute,
): ActionOutcome {
  if (outcomeId === 'flavor-match') {
    if (!qualifier) throw new Error('Flavor Match requires an Attribute qualifier')
    return { kind: 'source-local', outcomeId, label, qualifier }
  }
  return { kind: 'source-local', outcomeId, label }
}

function sameOutcome(left: ActionOutcome, right: ActionOutcome): boolean {
  if (left.kind !== right.kind) return false
  switch (left.kind) {
    case 'canonical':
      return right.kind === 'canonical' && left.action === right.action
    case 'form':
      return right.kind === 'form'
        && left.action === right.action
        && left.formId === right.formId
    case 'source-local':
      return right.kind === 'source-local'
        && left.outcomeId === right.outcomeId
        && left.qualifier === right.qualifier
  }
}

function sameMembers<T>(
  left: readonly T[],
  right: readonly T[],
  equal: (leftValue: T, rightValue: T) => boolean,
): boolean {
  if (left.length !== right.length) return false
  const matched = right.map(() => false)
  return left.every((leftValue) => {
    const index = right.findIndex((rightValue, candidate) => (
      !matched[candidate] && equal(leftValue, rightValue)
    ))
    if (index < 0) return false
    matched[index] = true
    return true
  })
}

/** Semantic identity for canonical, form, source-local, and tagged targets. */
export function sameActionTarget(
  left: ActionTarget | undefined,
  right: ActionTarget | undefined,
): boolean {
  if (left === right) return true
  if (!left || !right) return false
  return sameMembers(left.outcomes, right.outcomes, sameOutcome)
    && sameMembers(left.tags, right.tags, (leftTag, rightTag) => leftTag === rightTag)
}

// Disorder has one qualifying outcome across holder and recipient clauses.
// Sharing its identity lets the composition layer retain one Result row.
export const DISORDER_TARGET = actionTarget([sourceLocalAction('disorder', 'Disorder')])

// Attribute Anomaly is shared by holder-local anomaly rows and providers whose
// matching Attribute is selected through Focus.
export const ATTRIBUTE_ANOMALY_TARGET = actionTarget([
  sourceLocalAction('attribute-anomaly', 'Attribute Anomaly'),
])

// Windswept is Wind's Attribute Anomaly. Vortex has a separate coefficient and
// never inherits Disorder or the generic Attribute Anomaly target by default.
export const WINDSWEPT_TARGET = actionTarget([sourceLocalAction('windswept', 'Windswept')])
export const VORTEX_TARGET = actionTarget([sourceLocalAction('vortex', 'Vortex')])

// Abloom and Corruption are exact current anomaly outcomes. They remain action
// identities inside the existing anomaly formula family rather than becoming
// formula families or reaction registries.
export const ABLOOM_TARGET = actionTarget([sourceLocalAction('abloom', 'Abloom')])
export const CORRUPTION_TARGET = actionTarget([sourceLocalAction('corruption', 'Corruption')])

// Remielle's two formula-local outcomes stay distinct from ordinary Attribute
// Anomaly and from each other. Neither target inherits another anomaly family.
export const LUMINIZE_TARGET = actionTarget([sourceLocalAction('luminize', 'Luminize')])
export const REFRINGE_TARGET = actionTarget([sourceLocalAction('refringe', 'Refringe')])

// Miyabi's target-state buildup outcomes are shared across her provider and
// every current anomaly-buildup recipient. They remain separate so the Fully
// Enabled projection never combines mutually exclusive target conditions.
export const MIYABI_ICEFIRE_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('frost-buildup-icefire-target', 'Frost Buildup · Icefire target'),
])
export const MIYABI_FROSTBURN_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('anomaly-buildup-frostburn-target', 'Anomaly Buildup · Frostburn target'),
])
export const MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('anomaly-buildup-after-frostburn-removal', 'Anomaly Buildup · After Frostburn removal'),
])

export function actionOutcomeLabel(outcome: ActionOutcome): string {
  switch (outcome.kind) {
    case 'canonical':
      return outcome.action
    case 'form':
      return `${outcome.action}: ${outcome.form}`
    case 'source-local':
      return outcome.label
  }
}

export function actionTagLabel(tag: ActionTag): string {
  switch (tag) {
    case 'aftershock':
      return 'Aftershock'
  }
}
