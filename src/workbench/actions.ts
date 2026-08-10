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
    canonicalScope?: CanonicalActionKind
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

export const canonicalAction = (
  action: CanonicalActionKind,
): ActionOutcome => ({ kind: 'canonical', action })

export const actionForm = (
  action: CanonicalActionKind,
  form: string,
): ActionOutcome => ({ kind: 'form', action, form })

export const sourceLocalAction = (
  label: string,
  canonicalScope?: CanonicalActionKind,
): ActionOutcome => ({
  kind: 'source-local',
  label,
  ...(canonicalScope ? { canonicalScope } : {}),
})

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
