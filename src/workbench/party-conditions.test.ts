import { describe, expect, it } from 'vitest'
import {
  anotherAgentHasQualificationGroup,
  harumasaAdditionalIsActive,
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

describe('Harumasa and Qingyi local party conditions', () => {
  it('keeps Additional qualification order-independent and exact', () => {
    expect(harumasaAdditionalIsActive(['harumasa', 'qingyi', 'lucia'], 0)).toBe(true)
    expect(harumasaAdditionalIsActive(['lucia', 'harumasa', 'nicole'], 1)).toBe(false)
    expect(qingyiAdditionalIsActive(['qingyi', 'harumasa', 'lucia'], 0)).toBe(true)
    expect(qingyiAdditionalIsActive(['zhuYuan', 'qingyi', 'lucia'], 1)).toBe(true)
    expect(qingyiAdditionalIsActive(['lucia', 'qingyi', 'lycaon'], 1)).toBe(false)
  })

  it('limits Qingyi Astral opportunity to Nicole, Astra, and Pan', () => {
    expect(qingyiAstralOpportunity(['qingyi', 'nicole', 'lucia'], 0)).toBe(true)
    expect(qingyiAstralOpportunity(['astraYao', 'qingyi', 'lucia'], 1)).toBe(true)
    expect(qingyiAstralOpportunity(['qingyi', 'panYinhu', 'lucia'], 0)).toBe(true)
    expect(qingyiAstralOpportunity(['qingyi', 'cissia', 'lucia'], 0)).toBe(false)
  })
})
