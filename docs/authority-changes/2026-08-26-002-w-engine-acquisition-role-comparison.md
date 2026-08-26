---
id: ACR-2026-08-26-002
date: 2026-08-26
status: accepted
supersedes: ACR-2026-08-25-001
superseded_by: none
---

# Preserve Agent-realized value while comparing W-Engine acquisition roles

## One decision

Retain Agent-realized W-Engine valuation while replacing global same-direction
compression with separate comparison of the representative, other limited
S-Rank alternatives, and non-limited alternatives inside one material
competitive range.

## Context

The workbench needs a small set of materially competitive choices without
collapsing the user's distinct acquisition paths into one ranked recommendation.
The current owner correctly values only what the Agent realizes, rejects remote
packages, and derives non-limited from one admitted set. Its same-direction
compression can still be read globally: once the strongest representative is
known, every weaker package on that direction appears dominated even when an
already-owned limited S-Rank remains competitive with the best standard S-Rank
or A-Rank route available to that user.

That reading also makes the opposite error possible. Treating acquisition as a
blanket distinction could retain every positive limited package and recreate an
equipment catalogue. The owner needs one comparison order that preserves a
competitive owned-limited alternative while still compressing redundancy
inside each acquisition role.

This decision preserves the realized-value boundary accepted in
`ACR-2026-08-25-001` but replaces that record's requirement that a partial
limited S-Rank justify a distinct setup direction. If accepted, this record is
therefore its successor rather than an unrelated parallel decision.

## Existing rule

- Owning Rule IDs: `SW-005`, `SW-008`, `SW-010`
- Conflict: the package-inspection and competitive-set rules retain only the
  stronger package for one recomposed setup direction, while the availability
  rule allows acquisition and accessibility to distinguish choices without
  defining whether that distinction is evaluated before or after same-direction
  compression. The current wording therefore cannot decide whether a
  competitive other limited S-Rank may coexist with the stronger representative
  on the same direction, or when that coexistence becomes a catalogue.

## Proposed change

First recompose every inspected legal W-Engine around the Agent's current
formula, actions and operations, thresholds and caps, fixed stat supply, and
finite Disc-main-stat-substat opportunity. Count only realized contributions;
an unusable clause remains zero rather than a penalty. Base ATK remains part of
that setup calculation, but rank, a modest isolated Base ATK difference,
release or character association, package completeness, and clause count do
not independently establish admission, direction, or priority.

Select the representative from the strongest Agent-realized recomposed setup
and continue comparing every alternative with it. The representative calibrates
the material competitive range: an alternative whose complete recomposed value
is too remote remains excluded even when acquisition differs. No fixed numeric
cutoff or candidate count follows.

For alternatives that remain in that range, apply same-direction compression
within acquisition roles rather than across all roles at once:

- compare other limited S-Ranks with each other and retain only the strongest
  competitive alternative for one recomposed direction;
- judge that retained other limited S-Rank chiefly against the strongest
  standard S-Rank or A-Rank route, so it may coexist below the representative
  when its realized value is comparable to or stronger than that non-limited
  route; and
- compare standard S-Ranks and A-Ranks with each other and retain only the
  strongest useful non-limited alternative for one recomposed direction.

Do not globally collapse the representative, the retained other limited
S-Rank, and the retained non-limited alternative merely because their final
setup direction matches. Their acquisition roles may create materially
different choices after each survives the same representative-calibrated range.
A genuinely different setup direction still requires a material change in
finite stat allocation, action or operation coverage, threshold or cap use, or
formula consumption; a different label, trigger, rarity, or positive clause is
insufficient. Author one admitted set after these comparisons, then derive full
and non-limited exactly as `SW-010` already requires.

## Evidence

- `src/workbench/content/engines.ts` (`ENGINE_IDS_BY_AGENT_AND_POOL` and
  `enginePools`) authors one full candidate list and derives non-limited only by
  filtering limited identities. The current consumer already preserves exact
  acquisition identity without a runtime score or per-pool readmission pass.
- `src/workbench/content/representatives.ts`
  (`REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL`) selects deterministic full and
  non-limited representatives from those authored subsets. Representative
  priority and candidate membership are therefore distinct current product
  inputs.
- `docs/brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md`
  (R7) retains Serpentine Seeker as Cissia's stronger full representative,
  Bellicose Blaze as a partial limited-ownership alternative whose usable
  Energy Regen and CRIT Rate remain material, and Drill Rig - Red Axis as the
  non-limited route. The unused Fire clause contributes zero; it does not make
  Bellicose negative.
- `docs/brainstorms/2026-08-12-corin-lycaon-vertical-requirements.md` (R5)
  excludes Myriad Eclipse beside Heartstring Nocturne because both occupy the
  same limited CRIT direction for Corin and Myriad supplies no stronger or
  distinct realized axis.
- `docs/brainstorms/2026-08-15-nekomata-billy-vertical-requirements.md`
  (R8-R10) excludes Starlight Engine beside The Brimstone on the same
  non-limited broad-ATK direction while preserving materially different CRIT,
  Physical, and action packages.

## Nearest current consumer

Cissia is the nearest established consumer. Her current full candidate list
contains the stronger representative Serpentine, the partial other-limited
Bellicose alternative, and the non-limited Drill route; `enginePools` removes
both limited identities from non-limited without rerunning admission. This is
the exact boundary the global same-direction wording fails to explain:
Bellicose is weaker than the representative but remains a material acquired
limited option rather than being valued through its unusable Fire clause.

## Contrast

Corin's excluded Myriad Eclipse is the within-role contrast. Myriad and
Heartstring are both limited S-Rank CRIT packages for that holder, and Myriad
adds no competitive realized direction after the stronger package is retained.
Billy's excluded Starlight Engine supplies the parallel non-limited contrast:
Brimstone is the stronger package on the same broad-ATK route. Acquisition-role
comparison therefore preserves neither weaker same-role duplicate and does not
turn limited ownership or legal selection into automatic membership.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-005`, `SW-008`, `SW-010`).
- Supporting requirements affected: current and future Agent requirements whose
  W-Engine rationale globally collapses representative, other-limited, and
  non-limited choices on one direction, retains every positive limited option,
  or uses release or character association as value evidence require bounded
  Agent-local review. No candidate roster follows from this record.
- Production and tests affected: no shared runtime mechanism is implied.
  Later bounded audits may change Agent-local entries in
  `ENGINE_IDS_BY_AGENT_AND_POOL` or
  `REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL`. Existing reference, pool-derivation,
  preparation, completeness, and selected-input lifecycle coverage remains the
  applicable harness unless a later correction exposes a new shared failure.
- Visible Setup or Result consequence: none from this ACR or the owner amendment
  alone. A later Agent-local correction may remove a redundant choice, retain a
  competitive owned-limited alternative, or change a prepared first choice.
  Setup continues to show the complete admitted source-owned package and Result
  continues to project only consumable relationships.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-26T22:45:57.2550124+09:00`
