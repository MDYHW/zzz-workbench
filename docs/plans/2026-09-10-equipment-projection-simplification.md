---
date: 2026-09-10
status: completed
---

# Equipment effect projection simplification

Preserve the accepted candidate, representative, direct-edit, and incomplete-
Result behavior while reducing duplicated equipment projection. This is a
correction to existing effect delivery, not a new product decision.

## Boundaries

- SW-012/SW-014 and GV-007 retain exact recipients and highest-only composition.
- SW-013, FM-009/FM-010, and the product contract's Display Surfaces retain
  threshold basis, derived-output order, and first applicable surface.
- SF-005/SF-003 retain the smallest source representation and UI-001/UI-002
  keep compressed Setup copy and exact Result contributions separate.
- Candidate and preparation outcomes are unchanged: no equipment identities,
  values, eligibility, acquisition roles, or input lifecycles are added.
- Keep Initial-stat thresholds distinct from action-local thresholds that read
  the completed Fully Enabled stat. Keep entry stacks distinct from later stacks.
- Do not change permanent owners, governance, localization, or component layout.

## Implementation units

### U1: Preserve projected threshold effects

Use the existing provider-emission constructor without discarding its effect
composition. Pass the common materializer's delivery qualifiers and the source's
first applicable surface into the threshold projector. Declare Combat for the
existing Branch & Blade stat threshold and Feathered Fate entry clauses.

Testing delta: the current inactive-threshold and highest-only harness tests
check those mechanisms independently. They do not prove that a threshold fact
retains composition and recipient qualifiers through materialization and actual
delivery. Extend this shared flow with unequal/equal threshold outputs and a
recipient contrast. An equivalent unnamed fact must exercise the same failure.
Extend source-surface coverage for the existing entry and threshold clauses;
keep later-stack and action-local threshold contrasts.
The existing Remielle integration flow now expects the entry-only disc source
in Combat; its later W-Engine contribution remains in Fully Enabled.

### U2: Route each admitted effect once

Move the already-supported minimum-stat dispatch into the common materializer.
Remove the two callers' duplicated ordinary/threshold passes and the unused
custom-projection callback. Preserve W-Engine refinement and observed-basis
eligibility in their current owning caller. Add no generalized rule language.

Testing delta: retain the existing shared materializer coverage for ordinary
effects, progression, holder/Attribute gates, off-field effects, and action-local
thresholds. Those tests plus U1's composed path cover this refactor; do not add
tests of helper calls or file organization.

### U3: Verify the complete unchanged setup flow

Run focused equipment/composition tests, then npm run check. Verify corrected
Result values in the in-app browser at desktop and narrow widths. Recheck the
existing selected-pressure on/off/reselect and incomplete-Result journeys.
Review the complete diff. Retain this uncommitted plan until a requested
checkpoint commit preserves it, then close it under docs/plans/README.md.

## Verification outcome

U1-U3 are implemented and controller-reviewed. All 182 behavior tests, TypeScript
build checking, and the production build pass. The governance/App suite reports
320 passed and one npm-CLI-dependent test skipped because npm is unavailable;
the repository's documented direct Node entrypoints ran the check components.

The in-app browser confirms threshold composition, Combat contribution rows,
and the selected-pressure on/off/reselect flow. The existing shared tests retain
the independent-Agent relationship contrast. No candidate, preparation, input
lifecycle, or Setup-copy rule changed.

The 390px browser check found overlapping expanded Result rows. The same
Remielle flow reproduces on the original HEAD served separately from memory,
so responsive Result layout remains a pre-existing follow-up outside this
equipment-only change. This is not a clean narrow-screen visual pass.

Verification preceded the authorized checkpoint commit. No PR or deployment
has been performed. Remove this plan after the checkpoint preserves it.
