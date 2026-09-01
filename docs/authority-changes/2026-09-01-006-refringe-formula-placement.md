---
id: ACR-2026-09-01-006
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Define Refringe formula placement

## One decision

Decide how Refringe Coefficient modifies an applicable Attribute Anomaly effect in the current formula foundation.

## Context

The approved through-Version-3.1 expansion scope requires a later Remielle vertical. Her Core Passive derives Refringe Coefficient from Anomaly Proficiency and can increase it for a three-Anomaly party, while Refringe enhances an Attribute Anomaly effect and that enhanced effect can supply later source-local outcomes. Current formula mechanics can calculate a stat-derived coefficient, but it does not decide where a coefficient that scales the anomaly effect as a whole belongs. Treating it as ordinary Anomaly DMG Bonus would combine it additively with that region; treating it as an added anomaly-result DMG Multiplier would change the source result's inherent coefficient.

This record decides only Refringe's formula placement for current Result applicability. It does not define raw anomaly coefficients, final damage, Lumiflux buildup, Voidflare storage, Luminize calculation, anomaly history, trigger frequency, rotation, candidate membership, or a runtime simulator.

## Existing rule

- Owning Rule IDs: `FM-002`, `FM-003`, `FM-004`, `FM-009`, `GV-006`, `SF-005`, and `SW-013`
- Conflict: the current anomaly frame separates a result's coefficient inside `anomaly_base_damage` from additive `anomaly_buff_multiplier` contributions, and its linear-scaling rule can derive Refringe Coefficient from Anomaly Proficiency. None decides the formula region for a source-stated coefficient that multiplies the already-composed Attribute Anomaly effect. The action-and-condition owner keeps the applicable result and later source-local outcomes independent, while the source and Result owners require only the smallest current scale-factor meaning. Therefore neither existing anomaly region can absorb Refringe without changing its stated relationship.

## Proposed change

Keep Refringe Coefficient as a distinct multiplicative factor over the exact Attribute Anomaly effect to which Refringe applies:

```text
refringed_anomaly_damage
  = anomaly_damage
  * (1 + applicable Refringe Coefficient)
```

The coefficient is not regular DMG Bonus, `anomaly_buff_multiplier`, or an additive change to the source anomaly's DMG Multiplier inside `anomaly_base_damage`. Its Anomaly-Proficiency-derived portion and any source-stated fixed or Mindscape addition compose into the one Refringe Coefficient before that factor is applied.

A later result such as Abloom or Vortex receives the factor only when its own current source meaning explicitly derives it from, inherits, or otherwise scales from the Refringed Attribute Anomaly effect. Sharing `anomaly_damage`, an Attribute, or an Anomaly label does not establish that edge. Preserve the exact affected result, holder, recipient, party, Mindscape, and source-local conditions independently.

Result may expose the current Refringe Coefficient as a distinct source-stated scale factor without calculating raw or final anomaly damage. Do not model Voidflare storage, Luminize, anomaly history, trigger cadence, or a universal derived-anomaly graph merely to retain this coefficient.

## Evidence

- The official Remielle mechanics introduction identifies Refringe as the source-local reaction by which her current kit enhances an Attribute Anomaly effect: https://www.hoyolab.com/article/45967009
- The current Prydwen Remielle profile was updated on 2026-08-19 and records Patch 3.1 for its review, build, and teams calculations. Its Core Passive transcription states that Refringe Coefficient is `0.02%` of Remielle's Anomaly Proficiency, gains a fixed addition in a three-Anomaly party, and creates Voidflare from the Anomaly Effect Strength after the Attribute Anomaly effect has been enhanced by Refringe. Its review independently interprets Refringe as an unsaturated multiplier over the anomaly as a whole: https://www.prydwen.gg/zenless/characters/remielle
- The current Icy Veins Remielle guide, updated 2026-07-28, independently describes Refringe as increasing the triggering Attribute Anomaly DMG by the Anomaly-Proficiency-derived coefficient and distinguishes that relationship from ordinary DMG Bonus and from Remielle's later Luminize outcome: https://www.icy-veins.com/zenless-zone-zero/remielle-dan-guide-best-builds
- `FM-009` can derive the coefficient from Anomaly Proficiency, but calculation of the value does not decide its formula placement. `anomalyOutcomeProfileFor` and `composeActionHierarchy` currently preserve exact anomaly-result scopes for ordinary `anomalyDmgBonus`, while current result-specific DMG Multiplier operations remain separate from that bonus. Those consumers expose the missing third placement; they do not supply the owner decision.

## Nearest current consumer

Current exact Attribute Anomaly and Disorder bonus projection is the nearest modifier consumer. `anomalyOutcomeProfileFor` emits source-scoped `anomalyDmgBonus` relationships and `composeActionHierarchy` applies them only to matching result targets. Refringe needs the same exact-result applicability but a separate multiplicative placement after the shared anomaly frame rather than another additive input inside `anomaly_buff_multiplier`.

Current Disorder and Vortex DMG Multiplier operations are the nearest coefficient contrast. They alter a result-specific coefficient inside `anomaly_base_damage`; Refringe instead scales the completed Attribute Anomaly effect without rewriting that source result's inherent coefficient.

## Contrast

Yuzuha's Anomaly-Mastery-derived Attribute Anomaly and Disorder DMG increases are ordinary `anomalyDmgBonus` contributions even though their values are stat-derived; the derivation basis does not create Refringe placement. Vivian's added Abloom DMG Multiplier and the accepted Vortex DMG Multiplier placement change exact result coefficients inside `anomaly_base_damage`; the phrase `DMG Multiplier` alone does not make Refringe an additive coefficient change. A later outcome that merely shares the anomaly formula but lacks an explicit Refringed-effect inheritance edge receives no Refringe factor. These cases disprove derivation-based placement, coefficient-region placement, and universal propagation.

## Impact

- Permanent owners affected: `docs/zzz-formula-mechanics.md` must add the distinct Refringe factor, its composition boundary, and its non-equivalence to the two existing anomaly regions. `SW-013` already permits a complete source-stated scale factor without raw or final damage, so the product contract needs no amendment for that presentation boundary.
- Supporting requirements affected: the through-Version-3.1 expansion and later Remielle requirement may retain Refringe Coefficient and only exact source-established derived-result applicability after the owner amendment.
- Production and tests affected: no immediate change. Later dependent work may derive the coefficient from the retained AP basis, compose source-stated additions, and project it as a distinct Result relationship. It must not reuse `anomalyDmgBonus`, rewrite `anomaly_base_damage`, or add Voidflare history, final-damage calculation, a runtime anomaly simulator, or a universal result graph.
- Visible Setup or Result consequence: none in this ACR. Later Result may show Refringe Coefficient as a separate scale-factor row or gauge while Setup continues to compress the selected source package independently.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T13:39:42.3121159+09:00`
