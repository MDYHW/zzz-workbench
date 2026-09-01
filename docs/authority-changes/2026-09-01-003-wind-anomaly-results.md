---
id: ACR-2026-09-01-003
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Define the Wind anomaly result relationship

## One decision

Decide how Windswept, Contamination, and Vortex relate to ordinary Attribute Anomaly and Disorder for current setup and Result applicability.

## Context

The permanent vocabulary now classifies Wind as the sixth base Attribute and admits Wind DMG Bonus as a legal Slot 5 main stat. It does not define the result of completing Wind Anomaly Buildup, the target state created by another Attribute during that result, or the result that replaces Disorder when another Attribute Anomaly completes.

The approved Velina vertical needs these identities before current Disorder-specific Agent and equipment clauses can be evaluated. This record decides only their game-domain relationship. It does not define a damage formula, coefficient, duration, trigger frequency, result attribution, candidate priority, representative, or runtime anomaly sequence.

## Existing rule

- Owning Rule IDs: `GV-006`, `GV-009`, `GV-010`, and `SF-005`
- Conflict: the current anomaly-result owner defines the existing Attribute Anomaly results and ordinary Disorder but omits Wind-specific results. The Wind identity owner explicitly leaves its anomaly results unresolved. The action-and-condition owner keeps a source-local state, result, affected action, recipient, and formula participation independent, while the retention gate requires the smallest distinction because exact Disorder consumers and later Wind Result applicability change. None states whether Vortex is Disorder or how Contamination relates to either result.

## Proposed change

Define Windswept as the Wind Attribute Anomaly result produced when Wind Anomaly Buildup completes. During one Windswept instance, the first direct Physical, Fire, Ice, Electric, or Ether damage establishes Contamination for that Attribute. Contamination is a target state, not an Attribute Anomaly result or Disorder.

When a non-Wind Attribute Anomaly completes while Windswept is active, produce Vortex instead of ordinary Disorder and align Contamination to that non-Wind Attribute. Preserve Vortex as a distinct cross-Attribute result: an exact Disorder condition or bonus does not apply to Vortex unless its own source independently includes Vortex. Do not infer formula placement, numeric damage, coefficient changes, damage attribution, duration, buildup history, or simulation behavior from these identities.

## Evidence

- The official Version 3.0 update introduces Wind as a new combat Attribute and Velina as a Wind Anomaly Agent: https://www.hoyolab.com/article/45488578
- The official Velina mechanics introduction presents Windswept, Contamination, and Vortex as Wind-specific mechanics and states that Vortex replaces Disorder when Windswept participates: https://www.hoyolab.com/article/45422807
- The current Prydwen Velina profile records a 2026-08-19 profile update while its build, review, and teams calculations remain Patch 3.0. It independently describes Windswept as required for Vortex and identifies ordinary Disorder lockout: https://www.prydwen.gg/zenless/characters/velina
- The current Icy Veins Wind mechanics guide independently distinguishes Contamination from Vortex and states that a different Attribute Anomaly against Windswept triggers Vortex instead of Disorder: https://www.icy-veins.com/zenless-zone-zero/wind-attribute-anomaly-effect-and-characters
- `src/workbench/actions.ts` (`DISORDER_TARGET`) and `src/workbench/content/agent-profiles/anomaly-outcomes.ts` preserve ordinary Disorder as an exact source-local result across holder and recipient clauses. The same current action hierarchy separately preserves Attribute Anomaly, Corruption, Abloom, and exact Agent-local outcomes.

## Nearest current consumer

Ordinary Disorder is the nearest current result. `DISORDER_TARGET` gives its holder-local and provider clauses one shared exact identity, while `anomaly-outcomes.ts` keeps Attribute Anomaly and Disorder as separate action-scope roots even when both later use the same formula family or modifier metric. Vortex needs the same exact-result distinction because replacing its identity with Disorder would activate current Disorder-only bonuses and operations.

## Contrast

Miyabi's Frostburn-Break is a source-local `general_damage` outcome and remains valid independently of whether ordinary Disorder or Vortex occurs. Likewise, completing a non-Wind Attribute Anomaly when Windswept is absent continues to use the existing Attribute Anomaly and ordinary Disorder meanings. These cases disprove a party-wide Wind incompatibility flag and a universal renaming of every cross-Attribute or Agent-local result to Vortex.

## Impact

- Permanent owners affected: `docs/zzz-game-vocabulary.md` must add one bounded Wind anomaly-result rule connected to the current `GV-009` result boundary without changing formula mechanics.
- Supporting requirements affected: the through-Version-3.1 content expansion and later Velina, Pyrois, and Sigrid requirements may evaluate only their exact Vortex or Contamination edges after the owner amendment and any required formula decision merge.
- Production and tests affected: no immediate change. Later dependent work may add exact Windswept, Contamination, and Vortex identities and replay current Disorder consumers, but it must not add raw coefficients, a runtime anomaly simulator, or a generic reaction catalogue.
- Visible Setup or Result consequence: none in this ACR. Later Result may distinguish Vortex from Disorder and apply exact Contamination relationships without displaying lifecycle prose or calculated final damage.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T10:38:35.2458348+09:00`
