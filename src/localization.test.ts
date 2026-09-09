import { describe, expect, it } from 'vitest'
import {
  localizedActionOutcome,
  localizedDiscEffectLine,
  localizedEnginePassiveLine,
  localizedPresentation,
  localizedSourceLabel,
  translationCoverage,
} from './localization'
import { DRIVE_DISCS, W_ENGINES, type AgentAttribute } from './workbench/content'
import type { ResultSource } from './workbench/effects'

describe('localization identity', () => {
  it('covers every admitted entity collection generically', () => {
    expect(Object.values(translationCoverage).every(Boolean)).toBe(true)
  })

  it('covers every reachable equipment effect through stable equipment identity', () => {
    for (const [engineId, engine] of Object.entries(W_ENGINES)) {
      for (const refinement of [1, 2, 3, 4, 5] as const) {
        engine.passiveLines(refinement).forEach((line, index) => {
          expect(localizedEnginePassiveLine(engineId as keyof typeof W_ENGINES, index, line, 'ko'))
            .not.toBe(line)
        })
      }
    }

    const attributes: AgentAttribute[] = [
      'Lumiflux', 'Physical', 'Fire', 'Ice', 'Electric', 'Ether', 'Wind', 'Auric Ink', 'Honed Edge', 'Frost',
    ]
    for (const [discId, disc] of Object.entries(DRIVE_DISCS)) {
      const typedDiscId = discId as keyof typeof DRIVE_DISCS
      expect(localizedDiscEffectLine(typedDiscId, 'twoPiece', 0, disc.twoPieceEffect, 'ko'))
        .toBeTruthy()
      for (const attribute of attributes) {
        const effects = disc.fourPieceEffectsForHolder?.(attribute) ?? disc.fourPieceEffects ?? []
        effects.forEach((line, index) => {
          expect(localizedDiscEffectLine(typedDiscId, 'fourPiece', index, line, 'ko', attribute))
            .not.toBe(line)
        })
      }
    }
  })

  it('selects Korean action copy by stable outcome identity, not English display copy', () => {
    expect(localizedActionOutcome({
      kind: 'form',
      action: 'Basic Attack',
      formId: 'alice-celestial-overture',
      form: 'changed fallback',
    }, 'ko')).toBe('일반 공격: 별의 서곡')
    expect(localizedActionOutcome({
      kind: 'source-local',
      outcomeId: 'luminize',
      label: 'changed fallback',
    }, 'ko')).toBe('휘광')
  })

  it('selects Korean source and result copy by structured identity', () => {
    const source: ResultSource = {
      label: 'changed fallback',
      ownerAgentId: 'remielle',
      locus: 'assist',
      sourceKey: { kind: 'agent-source', agentId: 'remielle', sourceId: 'flowerFeatherDance' },
    }

    expect(localizedSourceLabel(source, 'ko')).toBe('지원 스킬')
    expect(localizedPresentation('stun-duration-extension', 'changed fallback', 'ko'))
      .toBe('그로기 지속 시간 연장')
  })
})
