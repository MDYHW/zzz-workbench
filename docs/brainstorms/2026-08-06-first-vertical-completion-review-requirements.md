---
date: 2026-08-06
topic: first-vertical-completion-review
---

# First Vertical Completion Review

## Summary

Review the completed Yixuan, Dialyn, and Lucia vertical as the preserved product baseline, then identify only the workflow, semantic duplication, UI stability, test-value, and documentation changes that materially improve the current workbench or the next vertical.

---

## Problem Frame

The first vertical reached its intended content and visible Result behavior, but the route there repeatedly lost time to unsettled controller ownership, repeated fact and retention judgments, fragile Windows edit transport, browser-verification detours, and long UI adjustment loops. The accumulated code and tests may also contain duplication or checks that were reasonable during construction but do not all deserve permanent carrying cost. A broad cleanup would risk erasing product distinctions that were deliberately established with the user.

---

## Actors

- A1. Product owner: judges whether information and presentation deserve user attention.
- A2. Controller: owns product meaning, scope, integration, and acceptance against the authorities and current consumer.
- A3. Worker: executes bounded, settled implementation without redefining product behavior.

---

## Key Flows

- F1. Baseline audit
  - **Trigger:** The first vertical is considered complete.
  - **Actors:** A1, A2
  - **Steps:** Preserve current visible behavior, compare it with permanent authorities, classify repeated failures and actual duplication, and distinguish defects from intentional product decisions.
  - **Outcome:** Each proposed change has a concrete current consumer, user-visible benefit, or proven workflow benefit.
  - **Covered by:** R1-R8
- F2. Bounded improvement handoff
  - **Trigger:** An audit finding is accepted for implementation.
  - **Actors:** A1, A2, A3
  - **Steps:** Separate semantic work from UI stabilization, give one worker a settled bounded responsibility, and have the controller inspect behavior, tests, build output, and browser-visible results.
  - **Outcome:** Improvements land without reopening completed product meaning or introducing speculative structure.
  - **Covered by:** R9-R13

---

## Requirements

**Baseline and retrospective**

- R1. Treat the completed three-Agent vertical and its current visible behavior as the preserved baseline unless a permanent authority identifies a real contradiction.
- R2. Reconstruct repeated failures across product judgment, fact retention, editing, browser verification, UI iteration, and orchestration, and distinguish root causes from symptoms.
- R3. Recommend a prevention only when it removes a repeated cost without weakening controller judgment or product verification.
- R4. Use the current repository, current authorities, and the observed first-vertical workflow; do not import predecessor repositories or archived implementation as product authority.

**Semantic compression**

- R5. Identify duplication in calculation, source composition, candidate definition, state preparation, and presentation only by comparing meaning and current consumers.
- R6. Compress duplicated representation only when every materially valuable distinction and visible behavior remains intact.
- R7. Reject universal schemas, catalogues, registries, evidence systems, and speculative shared abstractions without a current consumer.
- R8. Keep user-value distinctions even when retaining them is less internally uniform than a generalized representation.

**UI and test stability**

- R9. Stabilize the current UI structure rather than redesigning it, covering responsive allocation, page and local overflow, keyboard focus, selector states, and source highlighting.
- R10. Verify representative desktop and narrow states against the real interactive consumer, including long content, disclosure, pointer, keyboard, selected, fixed, and disabled states where currently applicable.
- R11. Retain or add tests that protect a meaningful user action, lifecycle transition, calculation consequence, source relationship, conditional presentation, or accessibility behavior.
- R12. Remove or avoid tests that merely restate static structure, enumerate equivalent content, or lock internal representation without a distinct regression they can catch.

**Next-vertical workflow**

- R13. Define a reusable sequence that separates product authority, bounded fact research, retention review, content-semantic implementation, UI stabilization, and final verification.
- R14. Delegate only settled bounded execution; the controller retains semantic decisions and independently verifies the resulting diff and observable behavior.
- R15. Keep permanent policy, temporary plans, and reusable workflow learnings in their existing authority layers without duplicating definitions across them.

---

## Acceptance Examples

- AE1. **Covers R5-R8.** Given two similarly shaped effects with different recipients or activation timing, the audit does not merge them solely because their numeric calculation can share code.
- AE2. **Covers R9-R10.** Given a narrow viewport and a long Result source, the UI may rearrange or locally scroll while preserving the current information, source relationship, keyboard access, and absence of page-level horizontal overflow.
- AE3. **Covers R11-R12.** Given several Mindscape levels that share the same behavior, one boundary-oriented cumulative test is retained instead of one structure-only test for every level; a level that changes an ordinary-skill tier keeps a dedicated behavioral assertion.
- AE4. **Covers R13-R15.** Given a new vertical with unsettled content meaning, a worker is not asked to invent retention policy; the controller settles the consumer-visible behavior before delegating implementation.

---

## Success Criteria

- Every proposed change names the current user-visible or workflow cost it removes and the behavior it must preserve.
- UI stabilization can be delegated without the worker needing to reinterpret product meaning or redesign the workbench.
- The remaining regression tests each defend a distinct failure with meaningful consequence.
- The next vertical can follow a shorter sequence without weakening research review, lifecycle correctness, or browser acceptance.

---

## Scope Boundaries

- No implementation or UI mutation during the initial audit.
- No new vertical, Agent content, game-mechanics research, optimizer, simulator, evidence archive, or generalized content catalogue.
- No full UI redesign, new visual direction, or speculative design system.
- No exhaustive test matrix whose only justification is completeness.
- No Git/worktree restructuring or optional tool installation as part of this product review.

---

## Key Decisions

- Preserve first, improve second: the completed vertical is a product baseline rather than raw material for unconstrained cleanup.
- Judge complexity by carried user value: simpler representation is preferred only among options that retain every current materially valuable distinction.
- Separate semantic compression from UI stabilization: each has different acceptance evidence and failure modes.
- Use delegated execution after semantic settlement: parallelism improves speed only when ownership and acceptance are explicit.

---

## Dependencies / Assumptions

- The five permanent authorities remain the owners of product, lifecycle, calculation, source, and presentation meaning.
- The current browser-visible vertical is intentionally close to the product owner's desired service and must be inspected rather than re-derived from generic game-tool conventions.
