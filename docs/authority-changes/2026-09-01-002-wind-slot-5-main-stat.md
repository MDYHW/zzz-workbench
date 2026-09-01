---
id: ACR-2026-09-01-002
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Add Wind DMG Bonus to the Slot 5 main-stat pool

## One decision

Decide whether a level 15 S-Rank Slot 5 Drive Disc can carry Wind DMG Bonus and, if so, at what fixed amount.

## Context

The permanent vocabulary now classifies Wind as the sixth base Attribute, but that classification explicitly does not decide Slot 5 main-stat eligibility. The current Slot 5 pool lists the five earlier base-Attribute DMG Bonus choices and omits Wind, so later Velina setup authoring cannot represent her source-legal elemental main stat without a separate owner decision.

This record decides only the game-defined Slot 5 main-stat fact. It does not admit Wind DMG Bonus as a candidate for every Wind Agent, choose Velina's representative, define formula behavior, or decide any Wind anomaly mechanic.

## Existing rule

- Owning Rule IDs: `GV-002`, `GV-010`, and `SF-005`
- Conflict: the main-stat owner defines a closed current Slot 5 pool with 30% Physical, Fire, Ice, Electric, and Ether DMG Bonus choices. The Wind identity owner establishes Wind as a separate base Attribute but explicitly leaves Slot 5 eligibility undecided. The retention gate permits the smallest new fact because current main-stat identity, setup selection, and Result projection require it, but it does not supply the missing eligibility or amount.

## Proposed change

Add Wind DMG Bonus to the level 15 S-Rank Slot 5 main-stat pool at a fixed amount of 30%. Keep it independent from PEN Ratio, ATK%, and every other Slot 5 choice. Do not infer candidate priority, representative selection, anomaly behavior, or a relationship to another Attribute from this legal equipment fact.

## Evidence

- The official Version 3.0 update announcement introduces Wind as an independent combat Attribute and a separate Wind DMG Bonus Slot 5 main stat: https://www.hoyolab.com/article/45488578
- The official Version 3.0 limited-channel announcement identifies Velina as `Wind - Anomaly`, preserving the holder Attribute that consumes the new choice: https://www.hoyolab.com/article/45467484
- A current HoYoLAB Velina build guide independently lists `Slot 5: Wind DMG Bonus/PEN Ratio`: https://www.hoyolab.com/article/45489869
- `docs/zzz-game-vocabulary.md` (`GV-002`) gives every current base-Attribute Slot 5 DMG Bonus the same level 15 S-Rank amount of 30%, while `GV-010` now classifies Wind as a base Attribute without deciding this equipment fact.
- `src/workbench/content/types.ts` (`MainStatId`), `src/workbench/content/setup-options.ts` (`MAIN_STATS`), and `src/workbench/content/agent-sources/equipment.ts` (`mainRelationships`) currently retain and project the five earlier elemental main-stat identities but have no Wind entry.

## Nearest current consumer

Physical, Fire, Ice, Electric, and Ether DMG Bonus are the nearest established Slot 5 cases. Each has a distinct `MainStatId`, a 30% `MAIN_STATS` fact, an Agent-authored candidate use, and generic selected-main projection to DMG Bonus through `mainRelationships`. Wind needs the same legal main-stat identity and amount before any later Agent-local candidate decision can consume it.

## Contrast

Frost, Auric Ink, and Honed Edge do not add separate Slot 5 main-stat choices because their source-defined base relationships consume Ice, Ether, and Physical DMG Bonus. Wind has no such relationship under the current owner and therefore cannot reuse another Attribute's main-stat identity. PEN Ratio and ATK% remain separate legal Slot 5 choices whose candidate value belongs to Agent setup policy rather than this game-fact decision.

## Impact

- Permanent owners affected: `docs/zzz-game-vocabulary.md` must add Wind DMG Bonus 30% to the `GV-002` Slot 5 table without changing the other main-stat values or candidate policy.
- Supporting requirements affected: the through-Version-3.1 content expansion and later Velina requirement may inspect Wind DMG Bonus as one legal Slot 5 package only after the owner amendment merges.
- Production and tests affected: no immediate change. Later dependent work may add a Wind main-stat identity and shared generic projection, then author only the competitive Agent-local candidates. It must not add an Attribute catalogue, runtime optimizer, or Wind-specific main-stat handler.
- Visible Setup or Result consequence: none in this ACR. Later selected Wind DMG Bonus can appear as a 30% Slot 5 setup input and contribute 30% DMG Bonus through the generic selected-main relationship when the current holder and Result consume it.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T10:04:17.7568936+09:00`
