---
id: ACR-2026-09-10-001
date: 2026-09-10
status: accepted
supersedes: none
superseded_by: none
---

# Separate Party Edit state preservation from workspace visibility

## One decision

Keep the applied Setup and Result hidden during Party Edit, with the product
contract owning draft isolation and committed-state transitions and the UI
authority owning the edit-time presentation.

## Context

The product owner accepted the existing hidden-workspace experience on
2026-09-10 and requested that the documents' responsibilities be separated.
The two permanent owners currently disagree about visible Result retention
even though the application preserves the applied party and Setup correctly.
Keeping two visibility instructions makes a future change depend on which
document its author happens to read.

## Existing rule

- Owning Rule IDs: `SW-016` in `docs/setup-workbench-product-contract.md` and
  `UI-006` in `docs/workbench-ui-design-rules.md`.
- Conflict: the product rule says the applied Result remains visible while the
  draft changes. The UI rule says the applied rail shows inactive compact identities
  and does not render Setup or Result. State preservation cannot satisfy the
  first visibility promise while the second promise is followed.

## Proposed change

Remove the competing edit-time Result visibility promise from the product
contract. Keep its existing rules that draft changes leave the applied party,
Focus, Setup inputs, and calculated Result unchanged; Cancel discards only
the draft; and Apply commits the resolved party and Focus, prepares all three
Agents, and recalculates Result.

Refer edit-time presentation to the existing Party Editing rule in the UI
authority. That rule continues to hide the applied Setup and Result, retain
the three inactive applied identities, and restore the same viewed party
position's workspace on Cancel. Do not duplicate that presentation prescription
in the product contract. This decision adds no draft calculation, comparison,
preview, saved state, or new interaction.

## Evidence

- The current `SW-016` first paragraph expressly promises both draft isolation
  and continuous Result visibility; only the latter conflicts with `UI-006`.
- `UI-005` independently distinguishes viewed-Agent selection from applied
  party, Focus, Setup, and calculation. Hiding the workspace during Party Edit
  does not authorize changing any of those inputs.
- `src/workbench/state.ts#reduceWorkbenchState` handles `openPartyEdit`,
  `replaceDraftAgent`, and `setDraftFocus` by changing only the draft, and
  `closePartyEdit` by removing it. `applyPartyEdit` is the contrasting commit
  and whole-party preparation boundary.
- `src/App.tsx#AppliedWorkbench` retains its local `viewedSlot` while the
  reducer-owned draft opens and closes, calculates from the applied state,
  and supplies `Boolean(state.draft)` to the workbench presentation.
- The earlier `ACR-2026-09-03-003` addressed only the Cancel restoration target
  and explicitly left edit-time Setup/Result visibility undecided. It does
  not authorize removing the competing product promise. No earlier accepted
  decision is superseded here.
- A countermodel that shows the old Result while editing a new draft would
  satisfy the existing product sentence but violate `UI-006`. It would not
  show the draft's new result. The owner chose the existing hidden-workspace
  presentation after considering that reference-only benefit.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartyWorkbench` is the visible boundary.
It marks applied selectors inactive while `isPartyEditing` is true and
renders `.party-workspace`, including Setup and Result, only when that flag
is false. This is an established implementation of the accepted presentation,
not authority for resolving the conflicting owner rules.

## Contrast

Direct Setup editing in the applied workspace continues to recalculate and
display Result under `SW-015` and `SW-016`. A local invalid numeric draft
retains the last committed Result; it does not activate Party Edit's hiding
rule. An actually incomplete required selection still has the independent
empty-Result consequence.

Initial Party Edit is another boundary: before any party is applied there is
no applied Setup or Result to preserve or restore. Valid Setup-shortcut entry
continues to establish an applied session directly. Neither entry flow
changes under this decision.

## Impact

- Permanent owners affected: the competing visibility sentence in
  `docs/setup-workbench-product-contract.md` (`SW-016`). The current `UI-006`
  presentation and `UI-005` viewed-position rules remain unchanged. Any later
  owner amendment follows that owner's identifier and amendment-trace rules.
- Supporting requirements affected: inspect the current Party Edit outcomes
  in `docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md`
  and `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md`
  after the owner amendment; no additional visibility policy is needed there.
- Production and tests affected: no behavior change is proposed. Existing
  shared lifecycle coverage and `src/App.integration.test.tsx` cases for
  cancelled drafts, applied drafts, initial entry, and direct Setup editing
  remain the behavior evidence. No new test, source value, candidate roster,
  or prepared choice is authorized by this record.
- Visible Setup or Result consequence: current users continue to see the
  Party Edit draft and inactive applied identities while the workspace is
  hidden. Cancel restores the same viewed party position with its preserved
  Setup and Result values; Apply retains its current preparation lifecycle.
  Transient expanded Result rows are not newly promised to survive hiding.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-10` (owner acceptance in the current task; no exact
  message timestamp was supplied).

This records the product decision only. The fresh exact-head GitHub approval
and independent review required by `GOV-001` remain prerequisites to merge.
