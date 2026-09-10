import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineAgentSource } from '../content/source-definitions'
import { source, type EffectMetric, type ResolvedCurrentEffect } from '../effects'
import {
  actionForm,
  actionOutcomeLabel,
  actionTagLabel,
  canonicalAction,
  sourceLocalAction,
  sameActionTarget,
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
import { linearDerivedOutput } from './relationships'
import type { ActionModifier, ResultMetric } from './result'
import { selectSource } from './source-instance'

const syntheticSourceInstance = selectSource(
  defineAgentSource('seed', 'synthetic-action-source', 'Synthetic action source', 'core'),
  'seed',
  0,
)


const sharedTarget = actionTarget([
  canonicalAction('Basic Attack'),
  sourceLocalAction('refringe', 'Source-local outcome'),
])

const canonicalTarget = actionTarget([canonicalAction('Basic Attack')])

const leafTarget = actionTarget([
  actionForm('Basic Attack', 'seed-falling-petals-slaughter', 'Falling Petals - Slaughter'),
])

const sourceLocalTarget = actionTarget(
  [sourceLocalAction('refringe', 'Source-local outcome')],
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
  it('evaluates stat-derived scaling continuously between source-stated increments', () => {
    expect(linearDerivedOutput({
      basisValue: 2.808,
      basisThreshold: 1.6,
      basisIncrement: 0.1,
      baseOutput: 280,
      outputIncrement: 20,
      outputCap: 700,
    })).toBeCloseTo(521.6, 10)
    expect(linearDerivedOutput({
      basisValue: 4,
      basisThreshold: 1.6,
      basisIncrement: 0.1,
      baseOutput: 280,
      outputIncrement: 20,
      outputCap: 700,
    })).toBe(700)
  })

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
    expect(actionOutcomeLabel(actionForm('EX Special Attack', 'yixuan-cloud-shaper', 'Cloud-Shaper')))
      .toBe('EX Special Attack: Cloud-Shaper')
    expect(actionOutcomeLabel(sourceLocalAction('cissia-corrode-bone', 'Corrode Bone')))
      .toBe('Corrode Bone')
    expect(actionTarget([], ['aftershock'])).toMatchObject({
      outcomes: [],
      tags: ['aftershock'],
    })
    expect(actionTagLabel('aftershock')).toBe('Aftershock')
  })

  it('composes semantically equal targets without collapsing forms or source-local outcomes', () => {
    const effectTarget = actionTarget([
      canonicalAction('Ultimate'),
      canonicalAction('Basic Attack'),
    ])
    const projectedTarget = actionTarget([
      canonicalAction('Basic Attack'),
      canonicalAction('Ultimate'),
    ])
    const differentForm = actionTarget([
      actionForm('Basic Attack', 'seed-falling-petals-slaughter', 'Falling Petals - Slaughter'),
    ])
    const differentLocal = actionTarget([
      sourceLocalAction('cissia-corrode-bone', 'Corrode Bone'),
    ])
    expect(sameActionTarget(effectTarget, projectedTarget)).toBe(true)
    expect(sameActionTarget(effectTarget, differentForm)).toBe(false)
    expect(sameActionTarget(effectTarget, differentLocal)).toBe(false)

    const rows = composeActionHierarchy(
      surfaces(0, 0, 0),
      [{
        metric: 'defIgnore', earliestSurface: 'fully', amount: 15,
        sourceInstance: syntheticSourceInstance,
        source: source('Semantic action source', 'seed', 'core'),
        action: effectTarget,
      }],
      'defIgnore',
      [
        { id: 'canonicalBasicUltimate', target: projectedTarget },
        { id: 'seedSlaughter', target: differentForm },
      ],
    )
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'canonicalBasicUltimate',
        values: { initial: 0, combat: 0, fully: 15 },
      }),
    ])
  })

  it('inherits a canonical equipment scope without replacing a source-local visible target', () => {
    const equipmentTarget = actionTarget([
      canonicalAction('Basic Attack'),
      canonicalAction('Ultimate'),
    ])
    const visibleTarget = actionTarget([
      sourceLocalAction('cissia-corrode-bone', 'Corrode Bone'),
      actionForm('Basic Attack', 'cissia-serpents-kiss', "Serpent's Kiss"),
    ])
    const rows = composeActionHierarchy(
      surfaces(0, 0, 0),
      [{
        metric: 'defIgnore', earliestSurface: 'fully', amount: 15,
        sourceInstance: syntheticSourceInstance,
        source: source('Canonical equipment source', 'cissia', 'w-engine'),
        action: equipmentTarget,
      }],
      'defIgnore',
      [{
        id: 'cissiaBasicActions',
        target: visibleTarget,
        inheritedEffectTargets: [equipmentTarget],
      }],
    )

    expect(rows).toEqual([expect.objectContaining({
      id: 'cissiaBasicActions',
      target: visibleTarget,
      outcomes: visibleTarget.outcomes,
      values: { initial: 0, combat: 0, fully: 15 },
    })])
    expect(sameActionTarget(rows[0].target, equipmentTarget)).toBe(false)
  })

  it('projects only changed action scopes and links each one to its nearest visible parent', () => {
    const syntheticSource = source('Synthetic action source', 'seed', 'core')
    const effects: ResolvedCurrentEffect[] = [
      {
        metric: 'dmgBonus',
        earliestSurface: 'combat',
        amount: 10,
        sourceInstance: syntheticSourceInstance,
        source: syntheticSource,
        action: sharedTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 20,
        sourceInstance: syntheticSourceInstance,
        source: syntheticSource,
        action: canonicalTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        sourceInstance: syntheticSourceInstance,
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
        sourceInstance: syntheticSourceInstance,
        source: syntheticSource,
        action: sharedTarget,
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        sourceInstance: syntheticSourceInstance,
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
