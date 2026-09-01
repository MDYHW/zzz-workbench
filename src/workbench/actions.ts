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

export type ActionOutcome =
  | { kind: 'canonical'; action: CanonicalActionKind }
  | { kind: 'form'; action: CanonicalActionKind; form: string }
  | {
    kind: 'source-local'
    label: string
  }

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
  form: string,
): ActionOutcome => ({ kind: 'form', action, form })

export const sourceLocalAction = (
  label: string,
): ActionOutcome => ({
  kind: 'source-local',
  label,
})

function sameOutcome(left: ActionOutcome, right: ActionOutcome): boolean {
  if (left.kind !== right.kind) return false
  switch (left.kind) {
    case 'canonical':
      return right.kind === 'canonical' && left.action === right.action
    case 'form':
      return right.kind === 'form'
        && left.action === right.action
        && left.form === right.form
    case 'source-local':
      return right.kind === 'source-local'
        && left.label === right.label
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
export const DISORDER_TARGET = actionTarget([sourceLocalAction('Disorder')])

// Attribute Anomaly is shared by holder-local anomaly rows and providers whose
// matching Attribute is selected through Focus.
export const ATTRIBUTE_ANOMALY_TARGET = actionTarget([
  sourceLocalAction('Attribute Anomaly'),
])

// Windswept is Wind's Attribute Anomaly. Vortex has a separate coefficient and
// never inherits Disorder or the generic Attribute Anomaly target by default.
export const WINDSWEPT_TARGET = actionTarget([sourceLocalAction('Windswept')])
export const VORTEX_TARGET = actionTarget([sourceLocalAction('Vortex')])

// Abloom and Corruption are exact current anomaly outcomes. They remain action
// identities inside the existing anomaly formula family rather than becoming
// formula families or reaction registries.
export const ABLOOM_TARGET = actionTarget([sourceLocalAction('Abloom')])
export const CORRUPTION_TARGET = actionTarget([sourceLocalAction('Corruption')])

// Miyabi's target-state buildup outcomes are shared across her provider and
// every current anomaly-buildup recipient. They remain separate so the Fully
// Enabled projection never combines mutually exclusive target conditions.
export const MIYABI_ICEFIRE_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('Frost Buildup · Icefire target'),
])
export const MIYABI_FROSTBURN_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('Anomaly Buildup · Frostburn target'),
])
export const MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET = actionTarget([
  sourceLocalAction('Anomaly Buildup · After Frostburn removal'),
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
