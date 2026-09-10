import { describe, expect, it } from 'vitest'
import {
  localizedActionOutcome,
  localizedActionTag,
  localizedDiscEffectLine,
  localizedEnginePassiveLine,
  localizedPresentation,
  localizedSourceDetail,
  localizedSourceLabel,
  localizedStat,
  localizedUnit,
  translationCoverage,
} from './localization'
import { DRIVE_DISCS, W_ENGINES, type AgentAttribute } from './workbench/content'
import type { ResultSource } from './workbench/effects'

describe('localization identity', () => {
  it('covers every admitted entity collection generically', () => {
    expect(Object.values(translationCoverage).every(Boolean)).toBe(true)
  })

  it('covers every admitted W-Engine advanced stat through stable stat identity', () => {
    for (const engine of Object.values(W_ENGINES)) {
      expect(localizedStat(engine.advancedStat.id, '__missing_advanced_stat__', 'ko'))
        .not.toBe('__missing_advanced_stat__')
    }
  })

  it('covers every reachable equipment effect through stable equipment identity', () => {
    for (const [engineId, engine] of Object.entries(W_ENGINES)) {
      for (const refinement of [1, 2, 3, 4, 5] as const) {
        engine.passiveLines(refinement).forEach((line, index) => {
          const localized = localizedEnginePassiveLine(engineId as keyof typeof W_ENGINES, index, line, 'ko')
          expect(localized.trim()).not.toBe('')
          expect(localized).not.toBe(line)
        })
      }
    }

    const attributes: AgentAttribute[] = [
      'Lumiflux', 'Physical', 'Fire', 'Ice', 'Electric', 'Ether', 'Wind', 'Auric Ink', 'Honed Edge', 'Frost',
    ]
    for (const [discId, disc] of Object.entries(DRIVE_DISCS)) {
      const typedDiscId = discId as keyof typeof DRIVE_DISCS
      const localizedTwoPiece = localizedDiscEffectLine(typedDiscId, 'twoPiece', 0, disc.twoPieceEffect, 'ko')
      expect(localizedTwoPiece.trim()).not.toBe('')
      for (const attribute of attributes) {
        const effects = disc.fourPieceEffectsForHolder?.(attribute) ?? disc.fourPieceEffects ?? []
        effects.forEach((line, index) => {
          const localized = localizedDiscEffectLine(typedDiscId, 'fourPiece', index, line, 'ko', attribute)
          expect(localized.trim()).not.toBe('')
          expect(localized).not.toBe(line)
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
    expect(localizedActionOutcome({
      kind: 'source-local',
      outcomeId: 'flavor-match',
      label: 'changed fallback',
      qualifier: 'Electric',
    }, 'ko')).toBe('동일 속성 공격')
  })

  it('uses one fixed Korean Aftershock term across every presentation context', () => {
    expect(localizedActionTag('aftershock', 'ko')).toBe('여진 피해')
    expect(localizedPresentation('aftershock-daze-bonus', 'changed fallback', 'ko'))
      .toBe('여진 피해 그로기 보너스')

    for (const [engineId, engine] of Object.entries(W_ENGINES)) {
      engine.passiveLines(1).forEach((line, index) => {
        if (!line.includes('Aftershock')) return
        expect(localizedEnginePassiveLine(engineId as keyof typeof W_ENGINES, index, line, 'ko'))
          .toContain('여진 피해')
      })
    }

    for (const [discId, disc] of Object.entries(DRIVE_DISCS)) {
      if (!disc.twoPieceEffect.includes('Aftershock')) continue
      expect(localizedDiscEffectLine(
        discId as keyof typeof DRIVE_DISCS,
        'twoPiece',
        0,
        disc.twoPieceEffect,
        'ko',
      )).toContain('여진 피해')
    }
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
    expect(localizedPresentation('crit-dmg-times-35-percent', 'changed fallback', 'ko'))
      .toBe('치명타 피해 × 35%')
  })

  it('preserves dynamic equipment and Mindscape tier values in Korean source details', () => {
    const source: ResultSource = {
      label: 'Selected source',
      detail: 'W5 · M6',
      detailParts: [
        { presentationId: 'w-engine-refinement', presentationValues: { refinement: 5 }, label: 'W5' },
        { presentationId: 'mindscape-tier', presentationValues: { tier: 6 }, label: 'M6' },
      ],
      ownerAgentId: 'seed',
      locus: 'w-engine',
    }

    expect(localizedSourceDetail(source, 'ko')).toBe('W5 · M6')
    expect(localizedPresentation(
      'mindscape-darkbreaker',
      'changed fallback',
      'ko',
      { tier: 6 },
    )).toBe('형상 시네마 6단계 · 마계를 가르는 어둠')
    expect(localizedPresentation(
      'idyllic-cadenza-level',
      'changed fallback',
      'ko',
      { level: 3 },
    )).toBe('아름다운 칸타빌레 · 레벨 3')
    expect(() => localizedPresentation(
      'mindscape-darkbreaker',
      'changed fallback',
      'ko',
    )).toThrow('Missing tier')
  })

  it('localizes operation units without changing their numeric meaning', () => {
    expect(localizedUnit('% ATK', 'ko')).toBe('% 공격력')
    expect(localizedUnit('% ATK', 'en')).toBe('% ATK')
    expect(localizedUnit('%', 'ko')).toBe('%')
  })
})
