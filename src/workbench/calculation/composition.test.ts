import { describe, expect, expectTypeOf, it } from 'vitest'
import { source, type EffectMetric, type ResolvedCurrentEffect } from '../effects'
import {
  actionForm,
  actionOutcomeLabel,
  actionTagLabel,
  canonicalAction,
  sourceLocalAction,
  actionTarget,
  type ActionOutcome,
  type ActionTag,
  type CanonicalActionKind,
} from '../actions'
import {
  composeActionHierarchy,
  surfaces,
  type ActionScopeNode,
} from './composition'
import type { ActionModifier, ResultMetric } from './result'

const sharedTarget = actionTarget([
  canonicalAction('Basic Attack'),
  sourceLocalAction('Source-local outcome'),
])

const canonicalTarget = actionTarget([canonicalAction('Basic Attack')])

const leafTarget = actionTarget([canonicalAction('Basic Attack')])

const sourceLocalTarget = actionTarget(
  [sourceLocalAction('Source-local outcome')],
)

const actionScopes: readonly ActionScopeNode[] = [{
  id: 'seedActions',
  target: sharedTarget,
  children: [
    {
      id: 'seedBasicActions',
      target: canonicalTarget,
      children: [{
        id: 'seedSlaughter',
        target: leafTarget,
      }],
    },
    {
      id: 'seedUltimate',
      target: sourceLocalTarget,
    },
  ],
}]

describe('Result composition', () => {
  it('uses the shared effect metric vocabulary for Result rows and action outcomes', () => {
    expectTypeOf<ResultMetric['id']>().toEqualTypeOf<EffectMetric>()
    expectTypeOf<ActionModifier['metricId']>().toEqualTypeOf<EffectMetric>()
    expectTypeOf<ActionModifier['outcomes'][number]>().toEqualTypeOf<ActionOutcome>()
    expectTypeOf<ActionModifier['tags'][number]>().toEqualTypeOf<ActionTag>()
    expectTypeOf<CanonicalActionKind>().toEqualTypeOf<
      | 'Basic Attack'
      | 'Dash Attack'
      | 'Dodge Counter'
      | 'Special Attack'
      | 'EX Special Attack'
      | 'Assist'
      | 'Assist Follow-Up'
      | 'Chain Attack'
      | 'Ultimate'
    >()
    expect(actionOutcomeLabel(actionForm('EX Special Attack', 'Cloud-Shaper')))
      .toBe('EX Special Attack: Cloud-Shaper')
    expect(actionOutcomeLabel(sourceLocalAction('Corrode Bone', 'Basic Attack')))
      .toBe('Corrode Bone')
    expect(actionTarget([], ['aftershock'])).toMatchObject({
      outcomes: [],
      tags: ['aftershock'],
    })
    expect(actionTagLabel('aftershock')).toBe('Aftershock')
  })

  it('projects only changed action scopes and links each one to its nearest visible parent', () => {
    const syntheticSource = source('Synthetic action source', 'seed', 'core')
    const effects: ResolvedCurrentEffect[] = [
      {
        metric: 'dmgBonus',
        earliestSurface: 'combat',
        amount: 10,
        source: syntheticSource,
        action: sharedTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 20,
        source: syntheticSource,
        action: canonicalTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        source: syntheticSource,
        action: leafTarget,
      },
    ]

    expect(composeActionHierarchy(
      surfaces(0, 0, 0),
      effects,
      'dmgBonus',
      actionScopes,
    )).toMatchObject([
      {
        id: 'seedActions',
        outcomes: sharedTarget.outcomes,
        tags: [],
        values: { initial: 0, combat: 10, fully: 10 },
      },
      {
        id: 'seedBasicActions',
        outcomes: canonicalTarget.outcomes,
        tags: [],
        baseActionId: 'seedActions',
        values: { initial: 0, combat: 10, fully: 30 },
      },
      {
        id: 'seedSlaughter',
        outcomes: leafTarget.outcomes,
        tags: [],
        baseActionId: 'seedBasicActions',
        values: { initial: 0, combat: 10, fully: 60 },
      },
    ])
  })

  it('links a changed descendant across hidden scopes to its nearest visible ancestor', () => {
    const syntheticSource = source('Synthetic action source', 'seed', 'core')
    const rootAndLeaf: ResolvedCurrentEffect[] = [
      {
        metric: 'dmgBonus',
        earliestSurface: 'combat',
        amount: 10,
        source: syntheticSource,
        action: sharedTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        source: syntheticSource,
        action: leafTarget,
      },
    ]

    expect(composeActionHierarchy(
      surfaces(0, 0, 0),
      rootAndLeaf,
      'dmgBonus',
      actionScopes,
    )).toMatchObject([
      { id: 'seedActions' },
      {
        id: 'seedSlaughter',
        baseActionId: 'seedActions',
        values: { initial: 0, combat: 10, fully: 40 },
      },
    ])

    const leafOnly = composeActionHierarchy(
      surfaces(0, 0, 0),
      rootAndLeaf.slice(1),
      'dmgBonus',
      actionScopes,
    )
    expect(leafOnly).toMatchObject([{
      id: 'seedSlaughter',
      values: { initial: 0, combat: 0, fully: 30 },
    }])
    expect(leafOnly[0]).not.toHaveProperty('baseActionId')
  })

  it('omits an action tree when no scope changes its parent Result', () => {
    expect(composeActionHierarchy(
      surfaces(10, 20, 30),
      [],
      'dmgBonus',
      actionScopes,
    )).toEqual([])
  })
})
