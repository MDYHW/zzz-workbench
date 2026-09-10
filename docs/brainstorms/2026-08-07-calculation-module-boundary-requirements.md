---
date: 2026-08-07
topic: calculation-module-boundary
status: approved
---

# Calculation Module Boundary

This requirement records the ownership boundary for the current calculation surface. The mechanism is owned by the [shared source and calculation harness requirements](2026-08-21-shared-source-calculation-harness-requirements.md); this document keeps the public boundary and reason for separate module responsibilities.

## Bounded outcomes

- `calculateParty(state, context)` remains the public `PartyResult | null`
  boundary. It returns no Result for incomplete required selections and otherwise delegates the applied party to `evaluateProfileParty`.
- Shared composition owns Agent-neutral stat surfaces, retained relationship
  evaluation, delivery, reconciliation, operations, gauges, and Result types. Agent setup policy and source relationships remain separately authored; shared facts are not copied into Agent-local outcome catalogues.
- The applied-party harness evaluates every current holder from its own Setup,
  preserves provider/source/recipient identity and exact formula or action scope, delivers eligible relationships, then composes each recipient's local Result. Ordinary providers use local pre-delivery values; already-admitted derived relationships consume completed delivery in the shared harness's bounded acyclic order. This does not authorize callbacks, arbitrary expressions, iteration, or another dependency phase.
- Projection is consumer-gated. Current stat aggregates, materially different
  action modifiers, complete operations, and threshold or cap gauges are visible only when an admitted relationship changes that consumer. Upstream provider inputs remain explained at the holder; recipient breakdowns show the direct delivered source. No-consumer cases produce no generic Result row.
- Independent effects add normally. Highest-only reconciliation applies only to
  an explicitly shared non-stacking game identity, while equal winning origins remain visible in the numeric breakdown. Replacement, conversion, source ordering, and surface distinctions remain explicit where they affect output.
- Preparation and calculation remain separate under `SW-015`. Result output
  never feeds preparation or invents candidates. The [applied-party boundary](2026-08-07-applied-party-calculation-boundary-requirements.md) retains the whole-party, target-only and direct-edit lifecycle contrasts.
- New content extends the shared harness with retained facts, local competitive
  policy, and the smallest current relationship consumer. It does not require a per-Agent calculator, mandatory local test suite, universal optional schema, registry, plugin contract, or edits to unrelated Agent behavior.

## Required verification boundary

Inspect `src/workbench/calculate.ts#calculateParty`, `src/workbench/calculation/profile-harness.ts#evaluateProfileParty`, and `src/workbench/state.ts#workbenchReducer` as current behavior-bearing consumers. Shared behavior coverage must preserve numeric values, source and breakdown ordering, actions, operations, gauges, Focus/viewed independence, completeness, and the party, target-rebuild, direct-edit, invalidation, and reselect lifecycle. Tests prove behavior and composed flows; file layout, helper names, exact counts, and Agent roster snapshots are not requirements.

Preserve observable calculation and reducer behavior when changing internal
representations. This boundary adds no Result surface, researched content,
legacy execution path, generic calculator, catalogue, optimizer, solver,
simulator, or persistence layer.
