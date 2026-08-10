import { describe, expect, it } from 'vitest'
import { source, type ResolvedCurrentEffect } from '../effects'
import {
  composeActionHierarchy,
  surfaces,
  type ActionScopeNode,
} from './composition'

const actionScopes: readonly ActionScopeNode[] = [{
  id: 'seedActions',
  actions: ['Canonical action', 'Source-local outcome'],
  children: [
    {
      id: 'seedBasicActions',
      actions: ['Canonical action'],
      children: [{
        id: 'seedSlaughter',
        actions: ['Canonical action'],
      }],
    },
    {
      id: 'seedUltimate',
      actions: ['Source-local outcome'],
    },
  ],
}]

describe('Result composition', () => {
  it('projects only changed action scopes and links each one to its nearest visible parent', () => {
    const syntheticSource = source('Synthetic action source', 'seed', 'core')
    const effects: ResolvedCurrentEffect[] = [
      {
        metric: 'dmgBonus',
        earliestSurface: 'combat',
        amount: 10,
        source: syntheticSource,
        action: 'seedActions',
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 20,
        source: syntheticSource,
        action: 'seedBasicActions',
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        source: syntheticSource,
        action: 'seedSlaughter',
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
        actions: ['Canonical action', 'Source-local outcome'],
        values: { initial: 0, combat: 10, fully: 10 },
      },
      {
        id: 'seedBasicActions',
        actions: ['Canonical action'],
        baseActionId: 'seedActions',
        values: { initial: 0, combat: 10, fully: 30 },
      },
      {
        id: 'seedSlaughter',
        actions: ['Canonical action'],
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
        action: 'seedActions',
      },
      {
        metric: 'dmgBonus',
        earliestSurface: 'fully',
        amount: 30,
        source: syntheticSource,
        action: 'seedSlaughter',
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
