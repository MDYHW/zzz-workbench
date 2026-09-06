---
id: ACR-2026-09-06-001
date: 2026-09-06
status: accepted
supersedes: none
superseded_by: none
---

# Present source-owned operations without a display surface

## One decision

Treat a retained Result operation as one source-owned independent numeric action or state outcome that is displayed once without an Initial, Combat, or Fully Enabled surface identity.

## Context

The Result uses Initial, Combat, and Fully Enabled surfaces to compare cumulative stats and modifier contributions as additional clauses become applicable. A retained operation has a different shape: it is already one complete non-stat outcome for one canonical action or state, and the current Result displays one scalar operation rather than a value on each surface.

The current operation model nevertheless assigns every operation an earliest Combat or Fully Enabled surface and presents that generic surface above the operation. In practice, the surface does not distinguish multiple states of the same operation. It displaces the more useful source identity, such as Core Passive, Additional Ability, or Mindscape, even though source ownership is required for Result interpretation and interaction.

The distinction also obscures the authoring boundary. A surface label cannot make a raw damage coefficient, a base skill-table value, or an outcome without an exact Agent, recipient, action, formula, or state relationship into a valid Result operation. Those cases must be judged by the existing action/state completeness and source-retention rules rather than by whether they can be labeled Combat or Fully Enabled.

## Existing rule

- Owning Rule IDs: `SW-013`
- Conflict: the owning rule requires Result to expose atomic amounts with concise source identities and earliest surface, then separately admits source-stated non-stat operations whose numeric meaning is complete for one canonical action or state outcome. It does not decide whether the earliest-surface requirement applies to those independent operations. The current consumer applies it, although an operation has one scalar value and no surface-to-surface aggregate or comparison.

## Proposed change

Separate display-surface progression from operation ownership. A retained operation is one source-stated, source-owned numeric change to one canonical action or one state outcome. Result presents it once with its exact source identity, affected action or state meaning, necessary concise qualifier, and value. It has no Initial, Combat, or Fully Enabled display identity.

A calculation may still read a stat or relationship at a particular surface to decide whether an operation exists or what its complete value is. That surface belongs to the input relationship or threshold basis; it does not become an attribute of the resulting operation. A threshold or gauge remains responsible for exposing the basis and active state when that distinction changes Result.

Removing the operation surface does not broaden operation admission. The source-retention gate, exact source ownership, recipient, affected action, formula, and state relationships remain required. Ordinary stats and modifier regions keep their display surfaces. Raw or base skill-table coefficients, standalone additional-attack damage amounts, calculated base or final damage and Daze, and values that require cadence, rotation, field time, resource-spending, incoming-damage, or uptime assumptions remain excluded.

The existing mapped Result source presentation supplies categories such as Core Passive, Additional Ability, canonical action, and Mindscape. No parallel operation-specific source classification is introduced.

## Evidence

- `docs/setup-workbench-product-contract.md#observable-result-information` (`SW-013`) defines a retained operation as a complete non-stat canonical-action or state outcome and names Dialyn's enemy Stun-duration extension and Astra M4's next-Quick-Assist Daze as current examples. Neither example is a cumulative surface value.
- `docs/source-fact-boundary.md#minimal-current-meaning` (`SF-003`) independently requires a non-stat Result value to be complete without cadence or rotation assumptions, preserves source owner, affected action, performer, and recipient only where they change the outcome, and forbids invented raw damage or Daze Results.
- `docs/zzz-game-vocabulary.md#actions-and-source-local-conditions` (`GV-006`) keeps trigger action, affected action, and recipient as separate axes. A generic Fully Enabled label cannot supply a missing edge among those axes.
- `docs/zzz-formula-mechanics.md#excluded-calculation-detail` (`FM-011`) excludes base action DMG or Daze multipliers, calculated base components, final outputs, and complete combat simulation while retaining only independently source-stated modifier operations whose action scope changes Result.
- `docs/workbench-ui-design-rules.md#result-source-presentation` (`UI-002`) already makes the source label answer where a contribution comes from, requires explicit mapped presentation for every Agent fact, and includes operations in source ownership and interaction behavior.
- `src/workbench/calculation/relationships.ts#OperationAtom` currently stores one value plus an earliest Combat or Fully Enabled surface. It does not store a value map across Initial, Combat, and Fully Enabled surfaces.
- `src/workbench/calculation/profile-harness.ts#projectOperations` copies each operation's one value and earliest surface into one Result operation without aggregation, replacement, or comparison across surfaces.
- `src/components/ResultPanel.tsx` renders each Result operation once and uses its surface only in the visible generic label, accessible name, and row key. No calculation or conditional projection depends on that Result-facing surface.
- `src/workbench/calculation/relationships.ts#evaluateThresholdOperation` is the challenging case: it may inspect Combat and Fully Enabled stat values to find a qualifying threshold. This supports retaining surface on the threshold basis while removing it from the emitted independent operation.

## Nearest current consumer

Dialyn's `Enemy Stun duration` in `src/workbench/content/agent-profiles/daze-outcomes.ts` is the nearest current consumer because `SW-013` explicitly identifies it as a retained state outcome. The profile authors one scalar duration under Dialyn's Core Passive, and `projectOperations` sends that scalar to the separate Operations list. The current Fully Enabled label does not distinguish another Dialyn Stun-duration value; the Core Passive source identity and `Enemy Stun duration` outcome carry the useful meaning.

Astra M4's `Next Quick Assist Daze` in `src/workbench/content/agent-profiles/party-outcomes.ts` supplies the recipient-and-action variant. Its provider relationship restricts delivery to eligible Stun recipients, while the operation remains one source-owned value. The exact Mindscape source and Quick Assist/Daze meaning explain the operation; Fully Enabled does not establish the recipient or affected action.

## Contrast

An ordinary stat or modifier contribution is the primary contrast. The same Result quantity can have an Initial aggregate, a Combat increment, and a Fully Enabled increment, and its expanded source disclosure uses earliest surface to place atomic contributions in the cumulative table. Removing surfaces from those contributions would erase a current comparison, so this decision is limited to the separate independent Operations list.

A threshold-derived operation is a second contrast. Combat and Fully Enabled values may produce different threshold states, so the evaluating relationship and visible gauge must retain the relevant basis surface. Once that relationship emits one complete operation, copying the qualifying basis surface onto the operation adds no second value or action/state meaning.

Grace M6's current `Special/EX grenade DMG`, Caesar M6's primary-target follow-up expressed as a percentage of original action damage, and Starlight Billy M6's final-hit added Physical damage are audit countermodels. Replacing their Fully Enabled labels with source identities would improve provenance but would not prove that these values are eligible operations rather than raw or standalone added-damage coefficients. They require later source, relationship, role, and sink closure and must be removed if they fail the already-current retention and excluded-detail rules.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md` (`SW-013`) requires a later owner-only amendment to distinguish surface-based atomic contributions from independent source-owned operations. `SF-003`, `GV-006`, `FM-011`, and `UI-002` constrain the change but do not currently require semantic amendment.
- Supporting requirements affected: after the owner amendment, operation-bearing Result and Agent vertical requirements under `docs/brainstorms/` require a bounded audit. This includes the foundational Result and calculation-boundary requirements and every current Agent requirement that admits, excludes, or prescribes presentation of a Result operation. Source-specific candidate uses of the game term "operation" that do not denote a Result operation remain separate.
- Production and tests affected: later work may remove Result-operation display-surface identity from the shared relationship and Result contracts, preserve surface only on inputs that evaluate thresholds or other qualifying state, render the existing source presentation in the operation row, and update shared projection, presentation, accessibility, and behavior tests. A source-to-consumer audit must classify every authored Result operation as retained, removed, or corrected before implementation is complete.
- Visible Setup or Result consequence: the Operations list shows each eligible operation once under its Core Passive, Additional Ability, Mindscape, canonical action, equipment, or external-provider source rather than under Combat or Fully Enabled. Invalid raw-damage or relationship-incomplete rows disappear after the later audit. Setup, ordinary Result stat/modifier surfaces, action aggregates, gauges, and threshold basis labels do not change.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-06T11:39:53.0833185+09:00`
