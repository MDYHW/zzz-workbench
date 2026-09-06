---
date: 2026-09-06
topic: source-owned-result-operation-audit
---

# Source-Owned Result Operation Audit Requirements

## Summary

Present each retained Result operation once under its existing source identity,
without Combat or Fully Enabled presentation, and remove current operation rows
that expose raw or role-irrelevant standalone damage rather than a retained
action-multiplier or state outcome.

---

## Problem Frame

The Operations list currently assigns one Combat or Fully Enabled label to each
scalar operation even though no operation is compared across surfaces. That
generic label displaces the source identity users need to interpret the row and
can make an incomplete or raw-damage value look like an admitted Result merely
because it has a surface. Several Agent-local rows were also retained without
closing the distinction between an existing action multiplier and a standalone
additional attack amount, or without showing that the value matters to the
Agent's authored role.

---

## Key Flows

- F1. Retained operation presentation
  - **Trigger:** A complete setup emits an admitted operation.
  - **Steps:** Calculation resolves any qualifying inputs, emits one operation
    with its existing source instance, and Result presents the source, affected
    action or state, necessary qualifier, and value once.
  - **Outcome:** The row contains no Initial, Combat, or Fully Enabled identity;
    source interaction still resolves to the correct owner.
  - **Covered by:** R1-R4, R7
- F2. Operation admission audit
  - **Trigger:** A current Agent source appears to supply a numeric non-stat
    outcome.
  - **Steps:** Authoring checks the exact source, Agent role, recipient, affected
    action or state, formula meaning, and current Result decision; it then
    retains, corrects, or omits the outcome under the permanent rules.
  - **Outcome:** Existing-multiplier changes and complete state outcomes remain;
    raw coefficients and standalone additional-attack amounts do not render.
  - **Covered by:** R5-R8

---

## Requirements

**Operation contract and presentation**

- R1. A Result operation is one source-owned scalar action-multiplier or state
  outcome. Its calculation and Result contracts carry no display-surface field.
- R2. The Operations list presents the existing mapped source identity in the
  position previously occupied by Combat or Fully Enabled, followed by the
  operation label, concise source detail when needed, and formatted value. It
  does not add an operation-specific source classification.
- R3. Removing operation presentation surfaces does not change Initial,
  Combat, or Fully Enabled composition and disclosure for stats or modifiers.
- R4. A threshold or gauge may continue to read and name an explicit Combat or
  Fully Enabled basis when that input changes activation or value. The emitted
  operation remains one source-owned result without inheriting that surface.

**Current authored-operation audit**

- R5. Retain complete duration, trigger-count, received-action, and existing
  DMG- or Daze-multiplier changes when their exact source, action or state,
  recipient when applicable, formula meaning, and Agent-relevant Result
  consequence are closed. Current representative retained cases include
  Dialyn's Stun-duration extension, Astra M4's next-Quick-Assist Daze, Evelyn's
  thresholded action multiplier, Banyue's Crushing Peaks multiplier, Burnice's
  Afterburn multiplier, and the admitted Abloom, Vortex, and Disorder
  multiplier operations.
- R6. Remove Grace M6's Special/EX grenade scale, Ben M2's separate DEF-based
  Block Counter damage, Caesar M6's original-action-DMG follow-up, Miyabi's Core
  Frostburn-Break 1500%-ATK damage amount, and Starlight Billy M6's separate
  Sheer-Force final-hit damage. These rows are a direct-damage scale immaterial
  to the Agent's authored role, or standalone additional-attack/base damage
  amounts—not retained changes to an existing action multiplier or complete
  non-damage state outcomes.
- R7. Remove source values retained solely for the five omitted rows. Preserve
  adjacent Mindscape, Core, action-modifier, candidate, Setup, and lifecycle
  behavior whose independent consumers remain.
- R8. The audit does not admit a row from wording, source availability, an
  existing test, or operation-like naming alone. A missing source, recipient,
  affected action or state, formula edge, Agent-role consequence, or current
  Result decision yields omission rather than a zero row or explanation.

---

## Acceptance Examples

- AE1. **Covers R1-R3, R5.** Given Dialyn emits `Enemy Stun duration`, Result
  shows `Core Passive`, the operation label, and `+2.0s` once, with neither
  Combat nor Fully Enabled text, while source hover and focus interaction remain
  attached to Dialyn's Core Passive.
- AE2. **Covers R1, R2, R4, R5.** Given Evelyn first reaches her CRIT threshold
  at Combat or only at Fully Enabled, the gauge names the qualifying CRIT basis
  and value, but the emitted action-multiplier operation has the same
  source-owned surface-free shape in either case.
- AE3. **Covers R5-R8.** Given the five audited Agents use the Mindscape or Core
  state that previously emitted raw or standalone damage, no corresponding
  operation row or retained-only value remains; their independently admitted
  stats and action modifiers still calculate.
- AE4. **Covers R3, R4.** Given an ordinary stat contribution and a threshold
  gauge appear beside an operation, the stat breakdown and gauge retain their
  Initial, Combat, or Fully Enabled distinctions while only the operation omits
  a display surface.

---

## Success Criteria

- Users identify why an operation exists from its source and action/state
  meaning without a redundant surface label.
- Every current authored operation has passed the same source, relationship,
  role, and Result-sink gate, and focused tests catch reintroduction of the five
  invalid rows without creating an Agent-operation catalogue.
- A downstream implementer can change the shared contract, provider delivery,
  threshold emission, UI, Agent-local declarations, retained values, and
  behavior tests without inventing product behavior.

---

## Scope Boundaries

- Do not remove or rename Initial, Combat, or Fully Enabled for stats,
  modifiers, thresholds, gauges, or calculation inputs.
- Do not change Setup copy, candidates, representatives, party allocation,
  preparation, or selected-input lifecycle except to delete facts whose sole
  consumer is an omitted Result operation.
- Do not add rotation, cadence, uptime, resource-spending, base/final damage,
  raw Daze, an operation catalogue, an explanation payload, a new source enum,
  or a runtime semantic validator.
- Source-specific use of the game term `operation` for W-Engine competitive
  alignment remains separate from a Result operation and is unchanged.

---

## Key Decisions

- Source identity replaces display surface because it explains provenance and
  interaction, while one scalar operation has no surface comparison.
- Admission distinguishes a source-stated change to an existing multiplier or
  complete state from a standalone damage amount; it is not a label-based ban
  on every operation containing `DMG`.
- The five removals are bounded local corrections. They do not weaken the
  independently retained neighboring clauses in the same source.

---

## Dependencies / Assumptions

- `SW-013`, as amended through accepted `ACR-2026-09-06-001`, owns the
  surface-free source-owned operation shape.
- `SF-003`, `GV-006`, `FM-011`, and `UI-002` continue to own retention,
  relationship axes, excluded calculation detail, and mapped source
  presentation respectively.

---

## Outstanding Questions

None.
