---
date: 2026-08-07
topic: applied-party-calculation-boundary
status: approved
---

# Applied Party Calculation Boundary

This requirement keeps roster availability separate from the current applied party. The three applied slots are the product's setup, completeness, delivery, calculation, and Result boundary. Preparation, party context, session lifecycle, and presentation remain owned by `SW-009`, `SW-012`, `SW-015`, and `UI-005`. The shared mechanism is specified by the [approved shared source and calculation harness requirements](2026-08-21-shared-source-calculation-harness-requirements.md).

## Bounded outcomes

- The admitted roster and applied party are distinct. The applied party always
  contains exactly three distinct ordered slots; admitting an Agent does not apply it or create a hidden prepared setup.
- Each slot owns its current Agent and session Setup. Completeness checks only
  those three setups, and Result is empty until every required selection is complete.
- Applying a changed party or Focus creates a new context and prepares all three
  slots. A pool or Mindscape change rebuilds only the affected slot from its current pool while preserving the other two established Setups. A direct edit changes the current Setup without re-preparing it. Reconciliation clears an invalid dependent selection without fallback or edit-history restoration.
- Result calculation is exposed through `calculateParty` and the shared
  `evaluateProfileParty` harness after the complete gate. The harness evaluates
  provider-local values from each holder's current Setup, distributes retained relationships to their exact eligible recipients, composes recipient-local values, and projects only admitted Result consumers.
- Provider, source, holder, recipient, value or conversion, activation, action
  or Attribute scope, and earliest applicable surface remain distinct wherever they change eligibility or the visible outcome. Self, Focus, all-party, other-party, and enemy-context delivery use retained relationship meaning; Focus does not override an exact recipient rule.
- A delivered relationship is projected only when it changes the recipient's
  admitted Result formula, action difference, visible quantity, breakdown, threshold, or gauge. Setup investment direction does not substitute for a Result consumer. Inactive or unconsumed relationships create no generic row, placeholder, hidden state, or explanation payload.
- Traversal order is deterministic applied-slot order for stable output. The
  value of a provider or recipient cannot depend on which slot is visited first, and a recipient never reads another slot's Setup to reconstruct a provider. Existing exceptional replacements, conversions, and source disclosures retain their explicit relationship and consumer semantics.
- Result order, compact-slot order, keyboard order, and source interaction follow
  applied-slot position and persistent selector ownership. The viewed Agent and Focus are independent: changing the viewed slot changes workspace content only, while Focus-dependent delivery, Setup, calculation, and Result remain.
- A future admitted Agent that is outside the applied party affects none of the
  current party's completeness, Setup, delivery, order, focus, or Result. When later applied, it enters the same bounded slot and harness flow.

## Required verification boundary

Current consumers are `src/workbench/calculate.ts#calculateParty`, `src/workbench/calculation/profile-harness.ts#evaluateProfileParty`, and `src/workbench/state.ts#workbenchReducer`. Verify the complete-selection gate, recipient/projection behavior, deterministic order, and party, target-rebuild, direct-edit, invalidation, and reselect transitions through shared behavior coverage. Preserve the selector and source-linkage presentation owned by `UI-005`; this document does not add a party editor or new identity UI.

No roster catalogue, runtime optimizer, universal calculator, dependency graph,
iterative solver, combat simulator, persistence model, or vertical-specific
calculation path is part of this boundary.
