---
id: ACR-2026-09-01-004
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Define Vortex formula placement

## One decision

Decide how Vortex damage and source-stated Vortex DMG or Vortex DMG Multiplier changes enter the current formula foundation.

## Context

The permanent vocabulary now defines Vortex as a cross-Attribute result distinct from ordinary Disorder. The approved Velina vertical includes one source that increases Windswept and Vortex DMG and another that increases Vortex's DMG Multiplier. Current formula mechanics does not include Vortex in a formula family or decide whether those two wordings occupy the same calculation region.

This record decides only formula placement needed for current Result applicability. It does not define Vortex's raw coefficient, final damage, damage attribution, trigger frequency, duration, buildup history, rotation, candidate priority, representative, or runtime anomaly sequence.

## Existing rule

- Owning Rule IDs: `FM-002`, `FM-003`, `FM-004`, `GV-006`, `GV-009`, and `SF-005`
- Conflict: the current anomaly frame and its base and bonus components name Attribute Anomaly and Disorder but omit Vortex. The vocabulary owner now requires Vortex to remain a distinct result, and the action-and-condition owner keeps result scope independent from formula placement. None decides whether Vortex uses the existing anomaly frame or whether Vortex DMG and Vortex DMG Multiplier modify different regions.

## Proposed change

Place Vortex in the existing `anomaly_damage` formula family. A source that increases Vortex DMG without changing its stated DMG Multiplier contributes to `anomaly_buff_multiplier` and remains scoped to the exact Vortex result. It does not become regular DMG Bonus or apply to Attribute Anomaly or Disorder unless the source independently includes those results.

A source-stated additive increase to Vortex's DMG Multiplier changes the Vortex coefficient inside `anomaly_base_damage`. Preserve it as an exact Vortex DMG Multiplier operation rather than `anomalyDmgBonus`, regular `dmgBonus`, or a new formula family. Existing `anomaly_damage` regions apply only when their independent action, Attribute, holder, recipient, and other source scopes reach Vortex.

Do not infer a raw coefficient, calculated base component, final output, attribution model, live trigger sequence, or runtime simulator from this placement.

## Evidence

- The official Velina mechanics introduction distinguishes Vortex DMG increases from the Core Passive's Vortex DMG Multiplier increase: https://www.hoyolab.com/article/45422807
- The current Prydwen Velina profile records a 2026-08-19 profile update while its build, review, and teams calculations remain Patch 3.0. Its source transcription states that the Additional Ability increases Windswept and Vortex DMG, while the Core Passive separately increases the next Vortex's DMG Multiplier at its stated Windbite condition: https://www.prydwen.gg/zenless/characters/velina
- The current Icy Veins Wind mechanics guide, last updated 2026-05-11, independently identifies Vortex as AoE Anomaly DMG of the non-Wind Attribute that completed during Windswept: https://www.icy-veins.com/zenless-zone-zero/wind-attribute-anomaly-effect-and-characters
- `docs/zzz-formula-mechanics.md` already separates an Attribute Anomaly or Disorder DMG increase from a DMG Multiplier increase inside the shared `anomaly_damage` frame. `src/workbench/content/agent-profiles/anomaly-outcomes.ts` preserves the same distinction between exact anomaly-bonus modifiers and retained Disorder DMG Multiplier operations.

## Nearest current consumer

Current Disorder is the nearest result. `anomalyOutcomeProfileFor` emits exact Disorder `anomalyDmgBonus` relationships separately from retained Disorder DMG Multiplier operations, while `composeActionHierarchy` applies only modifiers whose exact action target reaches the inspected row. Vortex needs the same formula-region distinction without inheriting Disorder's result identity.

## Contrast

An applicable Attribute DMG Bonus remains regular `dmg_bonus_multiplier`, not `anomaly_buff_multiplier`, when its independent Attribute scope reaches Vortex through the shared anomaly frame. Likewise, an exact Attribute Anomaly or Disorder bonus does not reach Vortex merely because all three results use `anomaly_damage`. These cases disprove both a Vortex-only formula family and a universal anomaly-result target.

## Impact

- Permanent owners affected: `docs/zzz-formula-mechanics.md` must extend the current anomaly frame, base-component distinction, and anomaly-bonus component to Vortex without changing the vocabulary owner.
- Supporting requirements affected: the through-Version-3.1 expansion and later Velina requirement may retain exact Vortex bonus and DMG Multiplier outcomes after the owner amendment.
- Production and tests affected: no immediate change. Later dependent work may add an exact Vortex action target, project Vortex DMG Bonus through the existing anomaly modifier path, retain Vortex DMG Multiplier as an operation, and extend shared action-scope coverage. It must not add a new formula family, raw coefficient, final-damage calculator, runtime anomaly simulator, or universal result catalogue.
- Visible Setup or Result consequence: none in this ACR. Later expanded Result may show an exact Vortex Anomaly DMG Bonus row and a separate Vortex DMG Multiplier operation without calculating Vortex's final damage.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T11:18:07.4410450+09:00`
