---
id: ACR-2026-08-27-001
date: 2026-08-27
status: accepted
supersedes: none
superseded_by: none
---

# Preserve a contested non-limited W-Engine fallback for choice-constrained Agents

## One decision

Retain the strongest competitive same-direction non-limited W-Engine fallback
when a choice-constrained Agent otherwise loses a practical equipment path to
cross-team W-Engine identity contention, without changing the stronger
prepared representative.

## Context

The workbench authors a small competitive candidate set rather than an
equipment catalogue. Its current same-direction rule correctly removes weaker
standard S-Rank and A-Rank packages when another non-limited package expresses
the same realized direction more strongly.

That compression is incomplete for Agents whose competitive W-Engine routes
are structurally narrow. A W-Engine identity that is a common competitive
choice for several Agents cannot supply every simultaneous team from one owned
copy. If the stronger common engine is the only retained route on that
operation or direction, removing a still-competitive substitute leaves these
Agents without a practical manual fallback. Stun, Support, and Defense Agents
often expose this boundary, but Specialty does not decide it. A damage dealer
with several competitive CRIT, ATK, PEN, DMG, action, or resource routes is not
choice-constrained merely because one preferred engine is contested.

The service does not need item-count input, duplicate validation, or automatic
cross-team allocation to preserve the useful choice. Candidate visibility lets
the user make the manual substitution while the deterministic representative
continues to express the stronger package.

## Existing rule

- Owning Rule IDs: `SW-005`, `SW-008`, `SW-010`
- Conflict: the package-inspection and competitive-set rules retain only the
  strongest standard S-Rank or A-Rank package for one recomposed direction.
  The availability-pool rule lets acquisition and accessibility distinguish
  competitive choices but does not decide whether a
  same-role non-limited substitute may remain when cross-team identity
  contention removes the stronger engine from another choice-constrained
  holder. Applying the current compression literally removes the substitute;
  treating every possible contention as material would instead recreate a
  catalogue.

## Proposed change

Apply the ordinary W-Engine inspection first. The Agent must realize enough of
the package for its complete recomposed setup to remain inside the
representative-calibrated material competitive range. Unusable clauses add
zero rather than a penalty, and legality, Rank, a different label, or positive
value alone does not qualify the engine.

Inside the standard S-Rank and A-Rank acquisition role, continue to retain the
stronger package for a recomposed direction. Also retain the strongest
competitive same-direction substitute only when all of the following are true:

- the stronger W-Engine is a current competitive choice for more than one
  Agent and one owned identity may be needed by simultaneous teams;
- after ordinary candidate inspection, the current Agent has no other admitted
  non-limited route that materially replaces the contested operation or setup
  direction; and
- the substitute remains a practical current choice on its own realized value,
  rather than surviving solely because a duplicate conflict is imaginable.

This is a choice-constraint and acquisition boundary, not a Specialty rule or
candidate-count target. Do not preserve a same-direction fallback for a damage
dealer or any other Agent whose remaining competitive non-limited directions
already absorb the contention. Do not retain multiple remote fallbacks, add an
inventory input, validate duplicate selections, or allocate W-Engines between
teams at runtime. The stronger package remains the deterministic prepared
representative. Author one admitted set and derive full and non-limited from it
without pool-specific readmission.

## Evidence

- `src/workbench/content/engines.ts` (`ENGINE_IDS_BY_AGENT_AND_POOL` and
  `enginePools`) currently exposes Hellfire Gears and Steam Oven together for
  Ju Fufu, Lighter, Trigger, Lycaon, and Qingyi. These are independent equipment
  identities in one admitted set rather than a runtime inventory model.
- `src/workbench/content/representatives.ts`
  (`REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL`) prepares Hellfire Gears for Ju
  Fufu and Lighter in non-limited while their current candidate sets still let
  the user select Steam Oven. Koleda, Anby, Nangong Yu, and Dialyn also prepare
  Hellfire in current authored contexts, demonstrating real cross-Agent demand
  rather than a hypothetical name conflict.
- `docs/brainstorms/2026-08-14-ju-fufu-pan-yinhu-authority-recovery-requirements.md`
  (R5-R6) and
  `docs/brainstorms/2026-08-13-soldier11-lighter-lucy-vertical-requirements.md`
  (R9-R10) preserve Steam as a weaker Energy/Impact route while selecting
  Hellfire. These requirements are secondary evidence of the current visible
  product behavior; they do not decide the missing owner boundary.
- Product-owner review on 2026-08-27 confirmed that the useful exception is
  limited to Agents without diverse competitive equipment directions. It does
  not preserve redundant same-axis choices for damage dealers merely because
  the stronger engine is commonly used.

## Nearest current consumer

Ju Fufu is the nearest current consumer. `ENGINE_IDS_BY_AGENT_AND_POOL.juFufu`
admits both Hellfire and Steam, while `juFufuRepresentative` selects Hellfire in
non-limited. Both packages strengthen her narrow resource/Impact operation;
Hellfire is stronger, but Steam remains a practical second equipment identity
when Hellfire is committed to another simultaneous team. The candidate changes
manual Setup choice without changing the prepared first choice.

Lighter is the nearest repeated case. His current non-limited representative is
also Hellfire and Steam supplies the same lower-valued resource/Impact route.
The repeated result demonstrates a cross-Agent choice constraint rather than a
Ju Fufu identity exception.

## Contrast

Billy is the damage-dealer contrast.
`docs/brainstorms/2026-08-15-nekomata-billy-vertical-requirements.md` (R9-R10)
excludes Starlight Engine when Brimstone dominates its broad ATK direction,
while retaining competitive CRIT, Physical, and ranged-action packages. Those
other realized directions give Billy practical non-limited substitutions, so
cross-team contention for Brimstone does not justify restoring another weaker
broad-ATK engine. The exception therefore cannot be inferred from Attack,
Stun, Support, or Defense Specialty alone.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-005`, `SW-008`, `SW-010`).
- Supporting requirements affected: current and future Agent requirements must
  distinguish ordinary same-direction dominance from the strongest practical
  contention fallback for a choice-constrained holder. Ju Fufu, Lighter, and
  Trigger are immediate retained-candidate review cases; no roster follows
  automatically from this record.
- Production and tests affected: no shared inventory or allocation mechanism
  is implied. Later bounded Agent-local reviews may retain or restore one
  candidate identity while leaving representatives unchanged. Existing shared
  reference, pool-derivation, preparation, completeness, and selected-input
  lifecycle coverage remains sufficient unless a later implementation exposes
  a new mechanism failure.
- Visible Setup or Result consequence: a qualifying fallback remains selectable
  in full and non-limited Setup, whose candidate and selected surfaces show its
  complete source-owned package. Result continues to project only the selected
  holder-consumable relationships. The prepared representative does not change.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-27T21:23:22.3979887+09:00`
