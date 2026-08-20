---
id: ACR-2026-08-20-001
date: 2026-08-20
status: accepted
supersedes: none
superseded_by: none
---

# Apply broad pre-PEN pressure to DEF-consuming damage directions

## One decision

The current broad pre-PEN candidate-membership pressure applies to an authored
primary or residual damage direction when its applicable formula frame consumes
the DEF region, including `general_damage` and `anomaly_damage`, while a frame
that omits the DEF region such as `sheer_damage` remains unaffected.

## Context

Current setup policy admits material broad pre-PEN DEF Reduction or DEF Ignore
as pressure that can remove otherwise competitive PEN Ratio suppliers, but it
limits that membership outcome to `general_damage`. Formula authority separately
defines both `general_damage` and `anomaly_damage` with `def_multiplier`, while
`sheer_damage` omits it. Grace therefore has a local implementation and
supporting-requirement exception for the same DEF/PEN composition, while Piper
uses the same Anomaly frame without that pressure. The product needs one
formula-based boundary before another Anomaly vertical authors candidates or
preparation behavior.

## Existing rule

- Owning Rule IDs: `SW-007`, `FM-002`, `FM-007`
- Conflict: the setup rule resolves recipient, action, formula, and current
  competitive applicability, yet hard-codes its current broad membership
  adjustment to primary or residual `general_damage`. The formula-family and
  stat-consequence rules establish that `anomaly_damage` consumes the same
  ordered DEF region and that PEN Ratio can strengthen it, while
  `sheer_damage` cannot consume either.
  Grace's current exception follows the formula relationship without permanent
  setup-policy authority; Piper's current exclusion follows the narrower setup
  rule and produces the opposite candidate consequence.

## Proposed change

Replace the formula-family name check in the current broad pre-PEN
candidate-membership boundary with the smallest formula consequence it needs:
the authored primary or residual damage direction must consume
`def_multiplier`. Keep the existing requirements for material broad pre-PEN DEF
Reduction or DEF Ignore, exact recipient, Attribute, action, and formula
applicability, and an otherwise competitive PEN Ratio supplier. Keep limited
action-scoped pre-PEN effects outside automatic membership removal. Do not infer
a runtime threshold, score, or universal exclusion from the presence or size of
a DEF effect. A damage frame that omits `def_multiplier`, including
`sheer_damage`, remains unaffected.

## Evidence

- `docs/zzz-formula-mechanics.md` (`FM-002`) defines `general_damage` and
  `anomaly_damage` with `def_multiplier`, while `sheer_damage` omits that
  component.
- The same owner (`FM-007`) names DEF-region effects as direct setting
  pressures for both `general_damage` and `anomaly_damage`, explicitly excludes
  DEF Reduction, DEF Ignore, PEN Ratio, and flat PEN from `sheer_damage`, and
  states that applicable pre-PEN supply can lower PEN Ratio's relative pressure
  inside the ordered DEF region.
- `docs/setup-workbench-product-contract.md` (`SW-007`) already requires
  actual recipient, Attribute, action, formula, whole-package, and competitive
  applicability before the broad pressure changes membership. Its remaining
  `general_damage` family predicate is narrower than those established formula
  consequences.
- `src/workbench/provider-effects.ts#isCandidatePressureAgent` implements the
  current mismatch directly: it admits primary or residual `general_damage`
  and then adds Grace by Agent identity. `#activeCandidatePressures` sends that
  exception through every current broad pressure source.
- `docs/brainstorms/2026-08-15-grace-anomaly-vertical-requirements.md` R23 and
  the current Grace implementation remove Puffer Electro and Slot 5 PEN Ratio
  because `anomaly_damage` consumes the DEF region. That subordinate outcome
  demonstrates the disputed consequence but cannot amend its permanent owner.
- `docs/brainstorms/2026-08-19-piper-anomaly-vertical-requirements.md` R17
  preserves those same candidates solely because `SW-007` currently names
  `general_damage`. Grace and Piper therefore expose opposite setup policy for
  the same formula region.

## Nearest current consumer

Nekomata is the nearest established current consumer. Her `general_damage`
direction admits Puffer Electro two-piece and Slot 5 PEN Ratio, while an
applicable broad pre-PEN pressure removes both. A newly invalid direct selection
is cleared without fallback, membership returns without restoring history, and
authorized party preparation authors a complete pressure-safe package. The
proposed Anomaly consequence uses that same current candidate and lifecycle
meaning because its formula consumes the same DEF region; it does not copy
Nekomata's Agent-local equipment result.

## Contrast

Yixuan's `sheer_damage` direction is the formula contrast. It omits
`def_multiplier`, so Qingyi M1 and other broad pre-PEN effects do not change her
PEN candidates or preparation. Cordis Germina is the scope contrast: its
Basic- and Ultimate-only DEF Ignore can affect exact Result actions but does not
remove PEN Ratio membership automatically. These cases prevent the proposal
from becoming an all-damage or all-pre-PEN rule.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-007`). `docs/zzz-formula-mechanics.md` (`FM-002`, `FM-007`) already owns
  the unchanged formula distinction and constrains the amendment.
- Supporting requirements affected:
  `docs/brainstorms/2026-08-15-grace-anomaly-vertical-requirements.md`,
  `docs/brainstorms/2026-08-19-piper-anomaly-vertical-requirements.md`, and
  `docs/brainstorms/2026-08-19-through-2-8-anomaly-expansion-preflight-requirements.md`.
- Production and tests affected:
  `src/workbench/provider-effects.ts#isCandidatePressureAgent` and
  `#activeCandidatePressures`; the Puffer Electro and Slot 5 PEN Ratio candidate
  consumers in `src/workbench/candidates.ts`; preparation and reconciliation in
  `src/workbench/state.ts`; Grace, Piper, applicable future Anomaly direction,
  and Sheer/action-scoped contrast coverage in the shared policy and lifecycle
  tests.
- Visible Setup or Result consequence: while an applicable broad pre-PEN
  pressure is active, an Anomaly direction that consumes the DEF region no
  longer offers an otherwise admitted standalone Puffer Electro two-piece or
  Slot 5 PEN Ratio candidate. A newly invalid direct selection clears without
  fallback and leaves Result empty until repaired; authorized preparation uses
  its authored pressure-safe choice. Removing the pressure restores membership,
  not prior selection history. Sheer and limited action-scoped contrasts remain
  unchanged.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-20T23:14:39.2557729+09:00`
