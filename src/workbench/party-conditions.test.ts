import { describe, expect, it } from 'vitest'
import {
  anotherAgentHasQualificationGroup,
  soldier11AdditionalIsActive,
} from './party-conditions'

describe('opt-in party qualifications', () => {
  it('qualifies Soldier 11 through Fire or the typed NEDF group without merging factions', () => {
    expect(soldier11AdditionalIsActive(['soldier11', 'lighter', 'corin'], 0)).toBe(true)
    expect(soldier11AdditionalIsActive(['soldier11', 'anbySoldier0', 'corin'], 0)).toBe(true)
    expect(soldier11AdditionalIsActive(['soldier11', 'corin', 'lycaon'], 0)).toBe(false)

    expect(anotherAgentHasQualificationGroup(
      ['anbySoldier0', 'soldier11', 'corin'],
      0,
      'New Eridu Defense Force',
    )).toBe(true)
    expect(anotherAgentHasQualificationGroup(
      ['anbySoldier0', 'corin', 'lycaon'],
      0,
      'New Eridu Defense Force',
    )).toBe(false)
    expect(anotherAgentHasQualificationGroup(
      ['lighter', 'lucy', 'corin'],
      0,
      'New Eridu Defense Force',
    )).toBe(false)
  })
})
