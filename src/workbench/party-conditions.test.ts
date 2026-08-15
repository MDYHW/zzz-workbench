import { describe, expect, it } from 'vitest'
import {
  anotherAgentHasQualificationGroup,
  billyAdditionalIsActive,
  harumasaAdditionalIsActive,
  nekomataAdditionalIsActive,
  qingyiAdditionalIsActive,
  qingyiAstralOpportunity,
  soldier11AdditionalIsActive,
} from './party-conditions'

describe('opt-in party qualifications', () => {
  it('qualifies Soldier 11 through Fire or the typed NEDF group without merging factions', () => {
    expect(soldier11AdditionalIsActive(['soldier11', 'lighter', 'corin'], 0)).toBe(true)
    expect(soldier11AdditionalIsActive(['soldier11', 'anbySoldier0', 'corin'], 0)).toBe(true)
    expect(soldier11AdditionalIsActive(['soldier11', 'orphie', 'corin'], 0)).toBe(true)
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
      ['orphie', 'soldier11', 'corin'],
      1,
      'New Eridu Defense Force',
    )).toBe(true)
    expect(anotherAgentHasQualificationGroup(
      ['lighter', 'lucy', 'corin'],
      0,
      'New Eridu Defense Force',
    )).toBe(false)
  })
})

describe('Nekomata and Billy local party conditions', () => {
  it('keeps Support reach local to Nekomata while sharing Attribute and faction routes', () => {
    expect(nekomataAdditionalIsActive(['nekomata', 'astraYao', 'lycaon'], 0)).toBe(true)
    expect(nekomataAdditionalIsActive(['lucia', 'nekomata', 'lycaon'], 1)).toBe(true)
    expect(nekomataAdditionalIsActive(['nekomata', 'billy', 'lycaon'], 0)).toBe(true)
    expect(nekomataAdditionalIsActive(['nekomata', 'corin', 'lycaon'], 0)).toBe(true)
    expect(nekomataAdditionalIsActive(['nekomata', 'qingyi', 'lycaon'], 0)).toBe(false)

    expect(billyAdditionalIsActive(['billy', 'nekomata', 'lycaon'], 0)).toBe(true)
    expect(billyAdditionalIsActive(['corin', 'billy', 'lycaon'], 1)).toBe(true)
    expect(billyAdditionalIsActive(['billy', 'nicole', 'lycaon'], 0)).toBe(true)
    expect(billyAdditionalIsActive(['billy', 'astraYao', 'lycaon'], 0)).toBe(false)
  })
})

describe('Harumasa and Qingyi local party conditions', () => {
  it('keeps Additional qualification order-independent and exact', () => {
    expect(harumasaAdditionalIsActive(['harumasa', 'qingyi', 'lucia'], 0)).toBe(true)
    expect(harumasaAdditionalIsActive(['lucia', 'harumasa', 'nicole'], 1)).toBe(false)
    expect(qingyiAdditionalIsActive(['qingyi', 'harumasa', 'lucia'], 0)).toBe(true)
    expect(qingyiAdditionalIsActive(['zhuYuan', 'qingyi', 'lucia'], 1)).toBe(true)
    expect(qingyiAdditionalIsActive(['lucia', 'qingyi', 'lycaon'], 1)).toBe(false)
  })

  it('limits Qingyi Astral opportunity to the retained external Quick Assist providers', () => {
    expect(qingyiAstralOpportunity(['qingyi', 'nicole', 'lucia'], 0)).toBe(true)
    expect(qingyiAstralOpportunity(['astraYao', 'qingyi', 'lucia'], 1)).toBe(true)
    expect(qingyiAstralOpportunity(['qingyi', 'panYinhu', 'lucia'], 0)).toBe(true)
    expect(qingyiAstralOpportunity(['qingyi', 'zhao', 'lucia'], 0)).toBe(true)
    expect(qingyiAstralOpportunity(['qingyi', 'cissia', 'lucia'], 0)).toBe(false)
  })
})
