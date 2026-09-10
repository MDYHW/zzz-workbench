---
date: 2026-09-10
status: active
---

# Maintenance compression

Preserve the current prepared and edited Setup, calculation, source disclosure,
party selectors, and single-Agent workspace while removing obsolete instructions
and CSS declarations that cannot affect the current rendered surface.

## Settled scope

- Compress the applied-party and calculation-module supporting requirements in
  place. SW-009, SW-012, SW-015 and UI-005 retain preparation, Focus, session and
  viewed-slot boundaries. The approved shared-harness requirement owns current
  relationship evaluation and mechanism-oriented tests. `calculateParty`,
  `evaluateProfileParty`, and `workbenchReducer` demonstrate those boundaries;
  they do not authorize a new rule. Remove old pass counts, Agent-local
  calculator instructions and fixed-trio implementation baselines. Keep roster
  versus applied party, completeness, deterministic slot order and separate
  delivery/projection consequences.
- Remove provably overridden or structurally unreachable declarations only in
  `src/styles/party-selector.css`. UI-002 and UI-005 retain source linkage and
  persistent selectors. `PartyWorkbench` and the later production styles retain
  their current geometry, visibility, focus and disclosure behavior.
- Keep whole-party and target-only preparation distinct: the former allocates
  together; the latter consumes established holders. No calculation, candidate,
  representative, state or localization changes belong to this cleanup.

## Units and acceptance

1. One bounded documentation worker owns the two requirements. The controller
   checks each retained invariant against the current owners and harness, and
   verifies links. Keep source values and Agent-local decisions in their owners.
2. The controller removes dead CSS and verifies actual computed geometry and
   screenshots before/after at desktop, intermediate and narrow widths, including
   selected/unselected, focus and source interaction states. No portrait asset or
   metadata changes and no visual redesign.
3. Run current shared behavior coverage, type check and build. Review and commit
   the finished unit, then close this plan in the milestone index.

## Testing delta

No new mechanism or uncovered visible failure is introduced. Existing party
navigation, source linkage, draft lifecycle and Result disclosure tests remain
the behavioral coverage. Transient CSS parity checks prove this refactor; no
permanent file-layout, declaration-count or content-catalogue test is added.

## Separate transactions

SW-016/UI-006 visibility ownership uses the already prepared ACR-only transaction;
the permanent-owner amendment follows its merge. The existing product fixes and
CI-cost work keep their own reviews. Protected remote changes require independent
exact-head evidence and the repository's fresh owner approval before merge.
