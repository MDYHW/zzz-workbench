---
title: "feat: Add Dialyn-contextual Puffer Electro"
type: feat
status: completed
date: 2026-08-10
origin: docs/brainstorms/2026-08-10-dialyn-puffer-electro-contextual-candidate-requirements.md
---

# feat: Add Dialyn-contextual Puffer Electro

## Summary

Extend the existing recipient-scoped candidate query and Agent-local Result projectors so Dialyn's received Ultimate opportunity admits Puffer Electro 4-piece for the current applicable recipients. Reuse the current Disc selector, same-set exchange, completeness, action hierarchy, and source-disclosure paths without changing prepared setups or adding a new opportunity framework.

---

## Problem Frame

The workbench retains Puffer Electro only as a 2-piece input even though the applied Dialyn context makes its complete 4-piece package a competitive direct choice for current canonical-Ultimate recipients. The implementation must add that choice without turning combat opportunity into runtime allocation or allowing broad PEN pressure to erase a separately authored whole-package case.

---

## Requirements

- R1. Derive Dialyn's M0-M6 received Ultimate opportunity from the applied party and add Puffer Electro 4-piece only to non-Dialyn recipients whose current primary direction is crit-capable `general_damage` with a damaging canonical Ultimate (origin R1-R7, AE1-AE4).
- R2. Retain Puffer Electro's complete selected package and compressed Setup description: inherited PEN Ratio +8%, Ultimate DMG +20%, and post-Ultimate ATK +15% (origin R8-R12, AE5).
- R3. Keep Anby, Seed, and Cissia's existing local and contextual representatives unchanged; direct selection remains recipient-local and existing all-party versus target-only preparation ownership remains intact (origin R13-R16, AE1, AE3, AE6).
- R4. Distinguish broad pre-PEN pressure on standalone Slot 5 and 2-piece inputs from the separately competitive Puffer 4-piece package (origin R10-R12, AE2, AE5).
- R5. Project selected Puffer through Initial PEN, Initial-and-later canonical-Ultimate DMG, and Fully Enabled ATK with Puffer source identity; preserve Seed's existing Ultimate composition, add Cissia's current Ultimate outcome only when it differs, and keep Anby's Ultimate as a child of Aftershock (origin R17-R18, AE7-AE8).
- R6. Keep Dialyn's opportunity and M6 Aftertone out of Result operations and preserve the current acyclic candidate-to-selection-to-Result flow and incomplete-selection gate (origin R19-R21, AE9-AE10).
- R7. Protect the feature with mechanism-, policy-, representative-flow-, component-, and integrated-UI coverage rather than creating new Agent-specific test suites.

**Origin actors:** A1 setup workbench user, A2 workbench session, A3 content author.

**Origin flows:** F1 contextual candidate admission, F2 preparation and direct editing, F3 selected Puffer Result.

**Origin acceptance examples:** AE1-AE10.

---

## Scope Boundaries

- No new Agent, W-Engine, Disc identity, asset, base candidate family, main stat, substat, party preset, or prepared Puffer choice.
- No runtime Positive Reviews, Chain window, switch-in recipient, Decibel, action frequency, duration uptime, rotation, final damage, or M6 Aftertone modeling.
- No universal opportunity registry, Specialty-to-Disc rule, named-Agent compatibility matrix, equipment ranker, or new action catalogue.
- No new Result operation, feedback phase, fixed-point calculation, holder allocation, or recipient selector.
- No production layout or selector redesign. Existing generic Disc rendering and accessible descriptions should consume the new package unchanged.
- No unrelated calculation, content, test, or UI refactor.

---

## Context & Research

### Relevant Code and Patterns

- `src/workbench/provider-effects.ts` already owns recipient-scoped semantic party queries and pressure, including formula participation independent of Result completeness.
- `src/workbench/candidates.ts` already adds contextual Astral Voice without changing base candidate maps and removes only pressure-invalid inputs.
- `src/workbench/state.ts` already validates effective candidates, performs legal Disc-role exchange, clears invalid required selections, and gates Result until repair.
- `src/workbench/content/discs.ts` owns retained Disc facts and compressed selected/candidate descriptions.
- `src/workbench/calculation/agents/seed.ts`, `cissia.ts`, and `anby-soldier-0.ts` own local setup inputs, equipment clauses, parent metrics, and canonical action outcomes.
- `src/workbench/calculation/composition.ts` already composes action differences and nested `baseActionId` relationships without a universal action schema.
- `src/workbench/calculate.mechanics.test.ts`, `calculate.policies.test.ts`, and `calculate.flows.test.ts` separate common mechanisms, authored policies, and representative vertical flows.
- `src/components/AgentSetup.tsx`, `src/App.setup.test.tsx`, and `src/App.result.test.tsx` already expose Disc package descriptions, keyboard selection, source links, and current action hierarchy.

### Institutional Learnings

- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md` requires the browser check to preserve the full selected/candidate/focus interaction envelope rather than judging only the closed selector.

### External References

- None. Exact release facts and current product applicability were settled in the origin requirements; external research receipts remain ephemeral.

---

## Key Technical Decisions

- Use primary `general_damage` participation as the current bounded authoring
  representation of the complete recipient predicate: the direction is
  crit-capable and owns a damaging canonical Ultimate. This currently admits
  Anby, Seed, and Cissia while excluding Dialyn and Trigger's residual damage
  without a named compatibility list. A later Agent for whom that representation
  no longer proves all three properties is an authoring stop, not permission to
  weaken the predicate.
- Add one Dialyn-recipient opportunity query beside current candidate-pressure queries and consume it only in `effectiveFourPieceIds`. Do not represent the opportunity as a clause, Result value, registry entry, or prepared adjustment.
- Keep `DISC_IDS_BY_AGENT_AND_PIECE` unchanged. Puffer is contextual only, so removing Dialyn or applying a new party cannot turn it into an authored base candidate.
- Retain one source-owned Puffer fact record and let each current Agent-local projector consume the applicable inherited 2-piece, ATK, and Ultimate effects. Do not add equipment-driven cross-Agent delivery.
- Preserve Agent-local action identities. Seed reuses its existing Ultimate node, Cissia gains the smallest local Ultimate node, and Anby receives an Ultimate child under its existing Aftershock outcome rather than a universal Ultimate schema.
- Use current shared test families and table-driven cases where the same package must hold for multiple recipients. Add only representative integrated UI cases needed to prove the real candidate and Result chain.

### Rejected Alternatives

- Add Puffer to every Attack Agent: rejected because Specialty is not the applicability predicate and would encode the wrong product meaning.
- Automatically prepare Puffer when Dialyn is present: rejected because this approval adds a contextual comparison, not a new first choice.
- Encode Dialyn's opportunity as an all-party effect clause or operation: rejected because it changes candidate membership but supplies no directly interpretable numeric Result.
- Add a general opportunity registry or generic equipment projector: rejected because the current bounded query and three local consumers are sufficient.
- Remove Puffer 4-piece under Cissia pressure: rejected because pressure removes the standalone PEN input, while the complete package remains competitive through its Ultimate and ATK axes.

---

## Open Questions

### Resolved During Planning

- Is another product decision required? No. Recipient applicability, multiple-recipient behavior, preparation, pressure, action scope, and Result timing are closed by the origin.
- Does candidate admission need complete setup inputs? No. It depends only on
  applied party identity and the recipient's bounded authored direction, where
  current primary `general_damage` participation jointly represents CRIT
  capability and a damaging canonical Ultimate, so it remains available during
  incomplete recovery.
- Does the UI need a new control or layout? No. The current Disc selector and accessible compressed-description path already represent contextual four-piece candidates.

### Deferred to Implementation

- The smallest local helper placement for repeated Puffer clause construction may follow the current import graph after implementation reveals whether three explicit local clauses or one bounded shared helper is clearer.
- Exact test helper reuse may follow the current test-support module; production behavior must not be exposed merely to simplify assertions.

---

## Implementation Units

- U1. **Retain the complete Puffer package and admit the contextual candidate**

**Goal:** Add the exact Puffer 4-piece content and recipient-scoped Dialyn opportunity while preserving base candidates, pressure behavior, preparation, and incomplete recovery.

**Requirements:** R1-R4, R6-R7

**Dependencies:** None

**Files:**
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/provider-effects.ts`
- Modify: `src/workbench/candidates.ts`
- Test: `src/workbench/state.test.ts`
- Test: `src/components/AgentSetup.test.tsx`

**Approach:**
- Extend the existing Puffer fact and Drive Disc choice with its compressed 4-piece effects while keeping the existing 2-piece candidate membership untouched.
- Derive opportunity membership from applied Dialyn plus the current bounded
  recipient predicate represented by primary `general_damage`; do not require
  setup completeness or inspect Result values.
- Add Puffer after the recipient's base four-piece candidates, preserving deterministic order and the existing same-set legal-exchange behavior.
- Leave preparation code unchanged. Party Apply and target preparation continue selecting existing representatives, while direct Puffer selection remains local.
- Keep broad pressure filtering scoped to Puffer's 2-piece role and Slot 5 PEN; the 4-piece contextual addition remains available.

**Execution note:** Start with failing state and component cases so contextual membership, pressure coexistence, and compressed package disclosure are fixed before calculation work.

**Patterns to follow:**
- Contextual Astral admission in `src/workbench/candidates.ts`.
- Recipient pressure queries in `src/workbench/provider-effects.ts`.
- Common Disc semantic compression and accessible descriptions in `src/workbench/content/discs.ts` and `src/components/AgentSetup.tsx`.

**Test scenarios:**
- Covers AE1. Happy path: Seed/Dialyn/Astra adds Puffer only to Seed, while Party Apply still prepares Dawn's Bloom.
- Covers AE2. Integration: Seed/Cissia/Dialyn adds Puffer independently to Seed and Cissia while Cissia pressure removes Seed's standalone Puffer 2-piece and Slot 5 PEN; Dialyn's residual Slot 5 PEN remains.
- Covers AE3. Edge case: Anby/Seed/Dialyn admits both recipients in every slot order and Focus choice without allocating one holder.
- Covers AE4. Contrary cases: Yixuan/Dialyn/Lucia admits none, while Yixuan/Dialyn/Cissia admits only Cissia.
- Covers AE5. Edge case: a current Puffer 2-piece blocks an illegal direct 4-piece swap until another 2-piece is selected; no fallback is chosen.
- Covers AE6. Lifecycle: two direct Puffer selections survive Dialyn Mindscape/pool preparation, while target preparation of one recipient restores only that recipient's representative.
- Covers AE10. Incomplete setup keeps the contextual candidate visible and actionable while Result remains empty.
- Component: selected and candidate Puffer 4-piece descriptions expose `Ultimate DMG +20%`, `ATK +15%`, and inherited `PEN Ratio +8%` visually and through `aria-describedby`, without trigger or duration prose.

**Verification:**
- Effective four-piece membership is recipient-scoped, slot-order independent, and available during incomplete recovery.
- Existing prepared setup outputs remain byte-for-byte unchanged until a user directly selects Puffer.

---

- U2. **Project Puffer through current Agent-local metrics and action hierarchy**

**Goal:** Calculate the selected package for Anby, Seed, and Cissia with correct timing, source identity, parent/action separation, and nested action meaning.

**Requirements:** R2, R5-R7

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/effects.ts`
- Modify: `src/workbench/calculation/agents/anby-soldier-0.ts`
- Modify: `src/workbench/calculation/agents/seed.ts`
- Modify: `src/workbench/calculation/agents/cissia.ts`
- Test: `src/workbench/calculate.mechanics.test.ts`
- Test: `src/workbench/calculate.policies.test.ts`

**Approach:**
- Treat a selected 4-piece as owning Puffer's 2-piece PEN input exactly once; retain Seed's legal standalone 2-piece path.
- Add post-Ultimate ATK as a Fully Enabled equipper-local percentage and Ultimate DMG as an Initial action-scoped contribution. Neither changes the parent DMG Bonus.
- Reuse Seed's existing Ultimate action so Puffer and Seed M4 remain separate atomic sources in one action outcome.
- Add Cissia's local Ultimate action only when its values differ from the parent metric.
- Preserve Anby's existing Aftershock parent/tag and append Ultimate as its nested child, applying Puffer only to that child and not to every Aftershock action.
- Keep Dialyn's opportunity out of delivered clauses and operations; calculation reads only the selected Puffer package.

**Execution note:** Add the common package-projection assertions before implementation, then add the Anby nested-action policy assertion before changing its projector.

**Patterns to follow:**
- Inherited 2-piece calculation in `src/workbench/calculate.mechanics.test.ts` and current Agent projectors.
- Source-local clauses and action hierarchy composition in `src/workbench/effects.ts` and `src/workbench/calculation/composition.ts`.
- Seed's existing action tree and Anby's existing Aftershock tag in their Agent-local projectors.

**Test scenarios:**
- Covers AE7. Mechanism table: complete Puffer setups for Seed, Cissia, and Anby each show Initial PEN +8%, Fully Enabled ATK +15%, and Ultimate DMG +20% from Initial through Fully Enabled without parent inflation.
- Covers AE8. Policy: Seed M4 and Puffer remain separate +20% sources on `seedUltimate`.
- Covers AE8. Policy: Anby's Ultimate row is a child of the Aftershock outcome and Puffer does not apply to the Aftershock parent or unrelated actions.
- Edge case: Seed with Puffer 4-piece and no standalone Puffer 2-piece receives PEN once; an impossible same-set double selection is never required for the calculation.
- Contrary case: Dialyn present without selected Puffer adds no metric, action, gauge, or operation.

**Verification:**
- Numeric values and breakdown sources match Puffer's exact three retained effects on the correct surfaces.
- No new provider feedback phase, cross-Agent Puffer clause, or generic Result operation exists.

---

- U3. **Verify the end-to-end selector and Result experience**

**Goal:** Prove the existing Setup and Result UI consume the contextual candidate and nested actions correctly without production UI changes or regression to earlier verticals.

**Requirements:** R1-R7

**Dependencies:** U1, U2

**Files:**
- Test: `src/App.setup.test.tsx`
- Test: `src/App.result.test.tsx`
- Modify: `docs/plans/2026-08-10-002-feat-dialyn-puffer-contextual-candidate-plan.md` status only after all verification succeeds

**Approach:**
- Exercise the real reducer and calculation chain through the existing selector rather than adding a UI-specific fixture or new component API.
- Verify selected/candidate compressed effects, keyboard selection, source disclosure, nested action rendering, and incomplete recovery using current controls.
- Run the full suite, strict TypeScript, production build, diff validation, and in-app browser checks at the fixed development port.

**Patterns to follow:**
- Existing contextual Astral and pressure-repair flows in `src/App.setup.test.tsx`.
- Current Disc source-link and common/nested action assertions in `src/App.result.test.tsx`.
- Fixed `127.0.0.1:5173` development-server contract in `package.json`.

**Test scenarios:**
- Covers AE1. Representative Setup integration: Seed/Dialyn/Astra exposes
  Puffer, selects it by pointer and keyboard, displays the compressed
  three-effect package, and preserves unrelated setup values. State-level
  coverage owns multi-recipient lifecycle, same-set repair, and incomplete
  recovery instead of repeating them here.
- Covers AE7-AE9. Result integration: one directly selected Puffer source links
  to the recipient's Disc surface, the parent DMG row remains unchanged, the
  nested action renders correctly, and no Dialyn opportunity operation appears.
  Mechanics and policy suites own the cross-recipient numeric matrix and local
  action exceptions instead of repeating them here.
- Browser: closed and open Disc selector states show no overlap, clipping, or
  horizontal overflow; effect descriptions are available to keyboard focus;
  nested Anby Ultimate and Puffer source disclosure render without console
  errors. Inspect representative desktop, stacked, and mobile widths derived
  from the current CSS breakpoints, plus the authority-supported zoom range,
  rather than treating one responsive breakpoint as sufficient.

**Verification:**
- Focused and full Vitest, strict TypeScript, production build, and `git diff --check` pass.
- Browser behavior at port 5173 matches the accepted Setup/Result interaction
  grammar across desktop, stacked, mobile, and supported zoom states with no
  console errors or layout regression.
- The plan is marked completed only after all origin acceptance examples and unchanged invariants are verified.

---

## System-Wide Impact

- **Interaction graph:** Applied party identity feeds the existing contextual candidate query; direct selection feeds Agent-local clauses; the complete gate then projects Result through the unchanged calculator and UI.
- **Error propagation:** No new external failure path exists. Invalid candidate actions remain reducer no-ops, and incomplete selections continue returning empty Result.
- **State lifecycle risks:** The principal risk is conflating candidate admission with preparation or pressure reconciliation. State and integrated tests prove candidate-only behavior and target locality.
- **API surface parity:** Public workbench state, Result DTOs, selector props, and source-interaction contracts remain unchanged; only the closed action ID union gains current local consumers if required.
- **Integration coverage:** State tests prove effective membership and lifecycle, calculation tests prove shared mechanics and local policies, App tests and browser checks prove the complete user-visible chain.
- **Unchanged invariants:** Exact-three applied slots, deterministic candidate ordering, legal same-set exchange, complete-selection gate, source identity, target-only preparation, action parentage, and no Result-to-Setup feedback remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Formula participation accidentally admits Dialyn or Trigger | Treat primary `general_damage` as the bounded current representation of CRIT-capable damaging-Ultimate direction, cover positive and contrary parties, and stop authoring if a later admission breaks that equivalence. |
| Cissia pressure removes Puffer by identity instead of piece role | Keep pressure filtering in the 2-piece path and assert simultaneous pressure plus 4-piece admission. |
| Inherited PEN is omitted or counted twice | Cover selected 4-piece ownership in the shared mechanics suite for all three recipients. |
| Anby's Ultimate loses its Aftershock meaning | Preserve the current parent/tag and assert a nested child relationship rather than a flat Ultimate row. |
| New tests regress into one suite per Agent | Place shared package behavior in mechanics, semantic exceptions in policies, and only one representative end-to-end flow. |
| Generic UI renders a long or inaccessible package | Reuse the compressed three-row content and existing `aria-describedby` path, then inspect the real open selector in-browser. |

---

## Documentation / Operational Notes

- The origin requirements and the completed plan are the durable behavior record; no source registry, evidence archive, or additional permanent policy is needed.
- No persistence, migration, API, authentication, deployment, analytics, or runtime monitoring change is introduced.
- The development server remains fixed to `127.0.0.1:5173` for browser verification.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-08-10-dialyn-puffer-electro-contextual-candidate-requirements.md](../brainstorms/2026-08-10-dialyn-puffer-electro-contextual-candidate-requirements.md)
- Permanent authority: [docs/setup-workbench-product-contract.md](../setup-workbench-product-contract.md)
- Related requirement: [docs/brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md](../brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md)
- Related code: `src/workbench/candidates.ts`, `src/workbench/provider-effects.ts`, `src/workbench/content/discs.ts`, `src/workbench/calculation/agents/seed.ts`, `src/workbench/calculation/agents/cissia.ts`, `src/workbench/calculation/agents/anby-soldier-0.ts`
- Relevant learning: [docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md](../solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md)
