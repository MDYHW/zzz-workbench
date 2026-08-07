---
date: 2026-08-07
topic: calculation-module-boundary
---

# Calculation Module Boundary

## Summary

Reorganize the completed first-vertical calculation and behavior tests around their existing shared, party-wide, and Agent-local responsibilities before adding another vertical. Preserve every current setup, Result, lifecycle, source, action, gauge, and UI behavior.

---

## Problem Frame

The applied-party and effect-composition refactors established the intended semantics, but their implementation now concentrates several independently changing responsibilities in `src/workbench/calculate.ts`. That file contains the shared Result model and composition helpers, three Agent-local observation and projection regions, authored source ordering, and the exact-two-pass party orchestrator. `src/workbench/calculate.test.ts` and `src/App.test.tsx` likewise contain multiple distinct behavior families in single files.

File length alone does not justify abstraction. Here, however, the existing regions already change for different reasons: a new Agent should not require editing another Agent's projector, and party traversal should not be mixed with a current Agent's formula relationships. Adding the next vertical without moving these proven ownership seams would increase review scope and collision risk in the central files.

---

## Actors

- A1. Setup workbench user: continues to receive the same prepared setup and Result behavior throughout the refactor.
- A2. Future vertical implementer: adds Agent-local content and calculation without modifying unrelated current Agent modules.
- A3. Reviewer: verifies semantic parity through focused modules and behavior-bearing tests rather than reconstructing one monolithic file.

---

## Key Flows

- F1. Current party calculation
  - **Trigger:** A complete current applied party is calculated.
  - **Actors:** A1, A3
  - **Steps:** The complete gate runs, provider-local observations and outgoing clauses are distributed in one party pass, recipient-local Results are composed in a second pass, and the existing Result DTO is projected.
  - **Outcome:** Current numeric values, source ordering, actions, gauges, operations, and conditional rows remain identical.
  - **Covered by:** R1, R2, R3, R5, R6

- F2. Later Agent calculation extension
  - **Trigger:** A2 implements an Agent in a later vertical.
  - **Actors:** A2, A3
  - **Steps:** The Agent's local observations, outgoing retained effects, custom relationships, Result projection, and focused tests are added through the Agent-local ownership boundary; party dispatch admits the new identity explicitly.
  - **Outcome:** Existing Agent modules do not need semantic edits unless the new content genuinely changes their current Result consumer behavior.
  - **Covered by:** R3, R4, R7

---

## Requirements

**Behavior preservation**

- R1. This refactor must not change any current candidate, prepared first choice, setup lifecycle, calculation value, Result row, breakdown amount or order, action outcome, gauge, operation, source disclosure, focus behavior, responsive behavior, or interaction behavior.
- R2. The public `calculateParty -> PartyResult | null` boundary and incomplete-selection behavior must remain unchanged.
- R3. Party calculation must continue to use exactly two outer applied-slot passes: provider-local observation plus immediate distribution, followed by recipient-local Result composition. No Agent-local module may directly read another applied slot's setup.

**Module ownership**

- R4. Shared Result types and surface/effect composition must have one Agent-neutral owner. Agent-specific formulas, source ordering, or candidate policy must not enter that shared kernel.
- R5. The party orchestrator must own the complete gate, exact-two-pass traversal, recipient delivery, exhaustive Agent dispatch, and final applied-slot Result order without owning any current Agent's custom formula.
- R6. Each current Agent must own its local observations, outgoing retained clauses, custom conversions or replacements, source ordering, and Result projection in an Agent-local module. These modules may expose different explicit functions; they must not be forced through a universal optional-field schema, registry, or plugin contract.
- R7. A later Agent should be addable through its own Agent-local behavior and explicit closed dispatch, without moving or rewriting unrelated current Agent logic.

**Test organization**

- R8. Existing calculation tests must be organized by party boundary and Agent-local behavior while preserving every distinct regression consequence.
- R9. Existing UI integration tests may be divided by user-visible behavior family: setup/equipment editing, Result/Mindscape/source disclosure, and party navigation/focus/accessibility.
- R10. Test reorganization must not delete assertions merely to reduce file size, add tests of private helper shape or module exports, or introduce a universal fixture framework. Reuse only the smallest shared test support needed by current behavior tests.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given the prepared Yixuan, Dialyn, and Lucia party, when the refactored calculation runs, all existing Initial, Combat, and Fully Enabled values and presentation details match the pre-refactor behavior and incomplete setup still returns no Result.
- AE2. **Covers R1, R6, R8.** Given a current W-Engine, Disc, main-stat, substat, Mindscape, or pool edit, when Results recalculate, the same Agent-local and cross-Agent values, sources, actions, gauges, and lifecycle consequences remain covered by behavior tests owned by the applicable module or integration flow.
- AE3. **Covers R3, R5, R6.** Given a cross-Agent outgoing effect, when provider traversal order changes, recipient values and authored source order remain unchanged, and no recipient projector reconstructs the provider's setup.
- AE4. **Covers R4, R5, R6.** Given an Agent-neutral surface composition change, only the shared kernel and affected behavior tests need modification; given an Agent-specific relationship change, only that Agent-local module, its tests, and genuinely affected integration consumers need modification.
- AE5. **Covers R7.** Given a future Agent with retained current behavior, when it is admitted later, implementation adds explicit Agent-local behavior and exhaustive dispatch without editing unrelated current Agent modules solely to satisfy a common schema.
- AE6. **Covers R8, R9, R10.** Given the reorganized test suite, when the full suite runs, every current behavior assertion remains active and no new test exists solely to assert file layout, helper names, or export structure.

---

## Success Criteria

- A new vertical has a clear Agent-local calculation destination and does not enlarge the current central calculator with another full projector region.
- Reviewers can distinguish shared composition, party orchestration, and Agent-local behavior without tracing unrelated code.
- The complete current behavior suite, type check, production build, and browser verification pass without a user-visible difference.
- The refactor reduces central-file responsibility without introducing a generic calculator, universal Agent contract, or speculative extension mechanism.

---

## Scope Boundaries

- Do not add or research another Agent, vertical, W-Engine, Drive Disc, Mindscape, formula, or candidate.
- Do not implement Party Edit, persistence, routing, another Result surface, or any UI redesign.
- Do not broadly split `src/workbench/content.ts`, stabilized UI components, or state solely because of line count.
- Do not change the `PartyResult`, `AgentResult`, metric, action, operation, source, gauge, state, or reducer consumer contracts.
- Do not add a universal Agent interface with optional observations, a registry, plugin discovery, formula catalogue, dependency graph, or iterative solver.
- Do not delete, merge, or weaken behavior tests unless a moved replacement demonstrably catches the same failure consequence.
- Do not add structure-only tests or snapshot the file/module layout.

---

## Key Decisions

- Module boundaries follow reason-for-change rather than a line-count target: shared composition, party orchestration, and Agent-local semantics are the current proven seams.
- Agent modules remain explicit and heterogeneous. Exhaustive dispatch is retained as a safety boundary for newly admitted content.
- Test files mirror behavior ownership, while assertions continue to protect public behavior rather than implementation arrangement.
- Shared content and stabilized UI stay in place until a later concrete consumer proves another ownership seam.

---

## Dependencies / Assumptions

- The completed applied-party boundary and its exact-two-pass calculation are the baseline for this refactor.
- The current 64-test suite and accepted browser behavior are the parity baseline.
- No external research is required because this task changes repository organization rather than game facts or external interfaces.

---

## Outstanding Questions

None. The approved scope and current implementation determine the required behavior and boundaries.
