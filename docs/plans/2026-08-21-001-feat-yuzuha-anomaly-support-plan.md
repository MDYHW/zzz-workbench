---
title: "feat: Add Yuzuha anomaly support vertical"
type: feat
status: active
date: 2026-08-21
origin: docs/brainstorms/2026-08-21-yuzuha-anomaly-support-vertical-requirements.md
---

# feat: Add Yuzuha anomaly support vertical

## Summary

Extend the established content, preparation, provider-composition, Agent-local
calculation, Setup, Result, and portrait seams for Yuzuha. Keep Moonlight as the
prepared 4-piece package, expose Astral as an all-Mindscape candidate, and show
Initial ATK and AM support outcomes without adding runtime rotation or personal
damage modeling.

---

## Requirements

- R1-R6. Add Yuzuha identity, anomaly-buildup participation, exact Core and
  Mindscape source outcomes, the two capped relationships, matching-Attribute
  Sugarburst routing, and the M6 Disorder coefficient operation.
- R7-R10. Add Metanukimorphosis and the approved full/non-limited Support
  W-Engine candidates and representatives with compressed Setup summaries.
- R11-R14. Add independent 4-piece, 2-piece, main-stat, substat, and zero-count
  prepared authoring for both pools.
- R15-R18. Compose recipient-scoped effects through existing provider order,
  preserve state/completeness behavior, and expose exact visible Result values.
- R19. Preserve selected/candidate copy parity and verify Yuzuha and
  Metanukimorphosis assets at desktop and narrow expanded/compact states.

---

## Scope Boundaries

- Do not add personal Yuzuha anomaly/general-damage directions or personal AP,
  CRIT, PEN, Attribute DMG, or damage equipment candidates.
- Do not make Astral M4-only, prepare it by default, or add Slot 6 ATK%.
- Do not add a pressure pass, runtime uptime/rotation simulation, raw anomaly or
  Disorder damage, an item-specific Result replication suite, or source-trigger
  prose to ordinary Setup copy.
- Preserve Grace/Piper Puffer/PEN clearing only as the existing broad
  DEF-pressure contrast; Yuzuha and Metanukimorphosis do not cause it.
- Do not broaden shared schemas or UI beyond the exact current consumer needed
  for one relationship with three visible output quantities.

---

## Context & Research

### Relevant Code and Patterns

- `src/workbench/content/agents.ts`, `src/workbench/content/engines.ts`,
  `src/workbench/content/discs.ts`, `src/workbench/content/setup-options.ts`, and
  `src/workbench/content/representatives.ts` own current identity, equipment,
  candidate, and deterministic prepared-package patterns.
- `src/workbench/preparation.ts`, `src/workbench/provider-effects.ts`, and
  `src/workbench/state.ts` own allocation, provider delivery, reconciliation,
  rebuild, and completeness behavior.
- `src/workbench/calculation/agents/astra-yao.ts`,
  `src/workbench/calculation/agents/lucy.ts`,
  `src/workbench/calculation/agents/grace.ts`, and
  `src/workbench/calculation/agents/piper.ts` are the nearest capped-provider,
  anomaly-recipient, and anomaly-calculation patterns.
- `src/workbench/calculation/result.ts` and `src/components/ResultPanel.tsx` own
  the minimal gauge/operation shape and visible Result rendering.
- `src/components/agentPortraits.ts` and
  `tests/visual/workbench-portraits.spec.ts` own portrait framing and four-state
  visual verification.

### Institutional Learnings

- `docs/solutions/workflow-issues/prevent-secondary-requirements-from-validating-themselves-2026-08-12.md`
  requires candidate/prepared outcomes to remain downstream of the already
  completed authority and current-consumer review, and keeps prepared zero
  distinct from finite future opportunity.
- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
  requires browser evidence to preserve current interaction states rather than
  treating a clean screenshot as sufficient.

### External References

- None. Released source facts and bounded local product outcomes were settled in
  the approved origin requirement; implementation follows repository consumers.

---

## Key Technical Decisions

- Extend existing content records, candidate/preparation functions, provider
  clauses, and Agent-local calculation dispatch instead of adding a Yuzuha
  registry or a new preparation/pressure phase.
- Represent the AM relationship as one capped basis with exactly three labeled
  outputs so the existing Result gauge surface preserves UI-002 quantity parity
  without becoming a generic relationship framework.
- Reuse current recipient formula/action predicates for ATK, regular DMG, AP,
  buildup, anomaly/Disorder, RES, and Disorder-operation delivery.
- Keep compressed equipment copy in the current selected/candidate source path;
  only Unfettered preserves its uncontrollable weakness-match condition.
- Extend shared invariant and observable-flow tests only where Yuzuha adds a new
  mechanism or distinct visible failure.

---

## Open Questions

### Resolved During Planning

- Existing shared seams cover identity, preparation, allocation, provider
  delivery, result operations, reconciliation, and portrait rendering; no new
  permanent meaning or runtime mechanism is required.

### Deferred to Implementation

- Exact helper and type member names may follow the smallest shape discovered
  while editing current consumers; they must not broaden the accepted behavior.

---

## Implementation Units

- U1. **Add Yuzuha and equipment content**

**Goal:** Add identity, retained facts, equipment effects, candidate memberships,
independent Disc roles, mains, substats, and both pool representatives.

**Requirements:** R1, R7-R14, R19

**Dependencies:** None

**Files:**
- Modify: `src/workbench/content/types.ts`
- Modify: `src/workbench/content/agents.ts`
- Modify: `src/workbench/content/engines.ts`
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/content/retained-values.ts`
- Modify: `src/workbench/content/setup-options.ts`
- Modify: `src/workbench/content/representatives.ts`
- Modify: `src/workbench/effects.ts`
- Test: `src/workbench/content/equipment-effects.test.ts`
- Test: `src/workbench/candidates.test.ts`
- Test: `src/workbench/preparation.test.ts`

**Approach:**
- Follow Grace/Piper content admission and Astra/Lucy Support equipment patterns.
- Keep Metanukimorphosis full-only as representative, Kaboom as non-limited
  representative, Moonlight prepared in both pools, Astral legal at all
  Mindscapes, and zero supplied counts for both retained ATK suppliers.
- Preserve selected/candidate compressed summaries through the common effect
  descriptions, including Unfettered's weakness-match condition.

**Patterns to follow:**
- `src/workbench/content/representatives.ts` pool-local representative builders.
- `src/workbench/effects.ts` selected/candidate summary descriptions.

**Test scenarios:**
- Happy path: full and non-limited preparation yield complete approved packages
  with Moonlight, Phaethon, ATK/ATK/AM, and zero ATK%/flat-ATK counts.
- Edge case: Astral remains a candidate before and after M4 while Moonlight
  remains the base prepared representative.
- Integration: retained equipment references resolve and selected/candidate
  summaries expose the same compressed outcome clauses.

**Verification:**
- Candidate/reference integrity and prepared setup tests pass without encoding
  Yuzuha's full local roster as a new shared invariant.

---

- U2. **Compose Yuzuha preparation and lifecycle**

**Goal:** Integrate Yuzuha with existing allocation, rebuild, direct-edit,
reconciliation, and completeness flows without a new pressure pass.

**Requirements:** R11, R16, AE3

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/preparation.ts`
- Modify: `src/workbench/state.ts`
- Test: `src/workbench/preparation.test.ts`
- Test: `src/workbench/state.test.ts`
- Test: `src/workbench/calculation/composition.test.ts`

**Approach:**
- Let current non-stacking Support allocation contextually select Astral while
  keeping Moonlight as Yuzuha's base representative.
- Extend one composed state flow across Apply, Yuzuha-only pool/Mindscape
  rebuild, direct edit, invalid-selection clearing, incomplete/null Result, and
  the preserved Grace/Piper broad-DEF-pressure contrast.

**Patterns to follow:**
- Existing Astral allocation in `src/workbench/preparation.ts`.
- Current rebuild and reconciliation cases in `src/workbench/state.test.ts`.

**Test scenarios:**
- Integration: a party with competing Support allocation prepares one legal
  non-stacking package without changing the earlier pressure/allocation order.
- Integration: pool and Mindscape changes rebuild only Yuzuha, direct edits
  rebuild none, and any incomplete required selection keeps Result null.
- Contrast: existing Grace/Piper Puffer/PEN on/off/reselect clearing remains
  unchanged and is not activated by Yuzuha or Metanukimorphosis.

**Verification:**
- One composed flow proves the full lifecycle and preserved contrast.

---

- U3. **Add provider composition and Agent-local Result calculation**

**Goal:** Calculate Yuzuha's own Initial ATK, AM, Energy Regen, buildup, gauges,
Mindscape outcomes, and exact recipient-scoped provider clauses.

**Requirements:** R2-R6, R15, R17-R18, AE2

**Dependencies:** U1

**Files:**
- Create: `src/workbench/calculation/agents/yuzuha.ts`
- Modify: `src/workbench/calculation/result.ts`
- Modify: `src/workbench/calculation/composition.ts`
- Modify: `src/workbench/provider-effects.ts`
- Modify: `src/workbench/calculate.ts`
- Test: `src/workbench/calculate.policies.test.ts`
- Test: `src/workbench/calculate.mechanics.test.ts`
- Test: `src/workbench/calculate.flows.test.ts`

**Approach:**
- Extend existing provider observation/resolution and recipient inbox order.
- Keep Sugarburst matching-Attribute buildup action-scoped and separate from
  personal anomaly share; use the active Focus Agent's authored Attribute.
- Project one AM basis to three separately labeled output quantities, and expose
  M6 as a Fully Enabled Disorder coefficient operation rather than a buff.

**Execution note:** Implement new formula/provider behavior test-first through
shared mechanism and representative-flow tests.

**Patterns to follow:**
- Initial-ATK capped gauges in `src/workbench/calculation/agents/astra-yao.ts` and
  `src/workbench/calculation/agents/lucy.ts`.
- Anomaly recipient calculations in `src/workbench/calculation/agents/grace.ts`
  and `src/workbench/calculation/agents/piper.ts`.

**Test scenarios:**
- Happy path: qualified Yuzuha exposes Tanuki Wish and three capped AM outputs;
  Metanukimorphosis AP reaches anomaly-damage recipients only.
- Edge case: without qualification, Yuzuha keeps AM but the three AM outputs and
  their recipient clauses are absent.
- Edge case: M1 changes anomaly/Disorder scaling but not buildup; M2 and M4 use
  their exact recipient/action scopes; M6 supplies one Fully Enabled coefficient
  operation without calculating Disorder damage.
- Integration: Grace/Piper receive applicable anomaly clauses, a general-damage
  recipient receives only applicable regular damage clauses, and Yixuan remains
  the sheer-damage contrast.

**Verification:**
- Shared calculation suites prove exact source-to-recipient behavior without an
  Agent-specific Result replication suite.

---

- U4. **Render compressed Setup and multi-output Result**

**Goal:** Show Yuzuha's selected/candidate equipment summaries, three AM output
lines, exact operations, source links, and incomplete-state behavior.

**Requirements:** R7-R8, R15, R18-R19, AE4

**Dependencies:** U1, U3

**Files:**
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/components/ResultPanel.tsx`
- Test: `src/components/AgentSetup.test.tsx`
- Test: `src/components/ResultPanel.test.tsx`
- Test: `src/App.setup.test.tsx`
- Test: `src/App.result.test.tsx`

**Approach:**
- Extend the existing gauge renderer only enough to render all output quantities
  changed by the relationship.
- Keep selected and candidate accessible descriptions on the same compressed
  source and omit controllable trigger/duration/stack prose.

**Test scenarios:**
- Happy path: qualified AM gauge renders separate Buildup, Attribute Anomaly
  DMG, and Disorder DMG lines with source interaction.
- Edge case: Unfettered selected and candidate summaries preserve the concise
  weakness-match condition and refinement value.
- Integration: incomplete selection leaves the Result empty; M6 operation and
  provider-source links render on eligible recipient rows.

**Verification:**
- Component and App tests pass with selected/candidate copy parity and no
  personal Yuzuha damage copy.

---

- U5. **Wire and verify portraits**

**Goal:** Admit Yuzuha and Metanukimorphosis artwork through current asset and
portrait framing paths, then visually verify all required states.

**Requirements:** R19, AE4

**Dependencies:** U1, U4

**Files:**
- Modify: `src/components/agentPortraits.ts`
- Test: `tests/visual/workbench-portraits.spec.ts`
- Test: `tests/visual/workbench-portraits.spec.ts-snapshots/`

**Approach:**
- Inspect the existing source assets before choosing framing metadata.
- Verify desktop and narrow widths with Yuzuha expanded and compact; also
  inspect Metanukimorphosis art in selected and candidate equipment surfaces.

**Test scenarios:**
- Visual: Yuzuha face and silhouette remain intentional at desktop/narrow and
  expanded/compact states without clipping or overlap.
- Visual: Metanukimorphosis artwork and compressed text remain legible in
  selected and candidate states.

**Verification:**
- In-app Browser evidence exists for all four portrait states and both equipment
  surfaces; visual snapshots are updated only for the scoped additions.

---

- U6. **Run integrated verification and inspect the local diff**

**Goal:** Prove the bounded vertical is complete and regression-safe before the
controller's pre-staging inspection gate.

**Requirements:** AE1-AE5

**Dependencies:** U2, U3, U4, U5

**Files:**
- Test: all changed tests plus the complete repository suite

**Approach:**
- Run focused tests throughout, then full tests, type check, production build,
  diff whitespace validation, and controller review of every changed file.

**Test scenarios:**
- Integration: the complete prepared-to-edited Setup and Result lifecycle works
  across both pools and representative recipient/contrast parties.

**Verification:**
- Full tests, type check, production build, browser checks, and `git diff
  --check` pass; no file is staged, committed, pushed, or published.

---

## System-Wide Impact

- **Interaction graph:** content admission feeds candidates and preparation;
  complete state feeds provider observation/resolution; recipient inboxes feed
  Agent-local calculation; Result types feed Setup/Result components.
- **State lifecycle risks:** a new Agent expands exhaustive records and dispatch;
  composed tests must prove Apply/rebuild/direct-edit/reconciliation/null Result.
- **API surface parity:** selected and candidate equipment summaries share one
  source; gauge outputs must remain equally visible and accessible.
- **Integration coverage:** one party flow crosses preparation, allocation,
  provider delivery, recipient calculation, and visible Result.
- **Unchanged invariants:** no new pressure kind, runtime optimizer, personal
  Yuzuha damage direction, or changed Grace/Piper DEF-pressure semantics.

---

## Risks & Dependencies

| Risk | Mitigation |
| --- | --- |
| Shared gauge schema broadens beyond its consumer | Add only the minimal three-output representation and keep existing one-output behavior intact. |
| Provider clauses reach the wrong formula or action | Test anomaly, general-damage, and sheer recipients together with exact action targets. |
| New Agent breaks exhaustive records or preparation | Extend typed records and run reference, candidate, preparation, state, and full type checks. |
| Portrait metadata looks correct in DOM but clips visually | Inspect original assets and verify fixed desktop/narrow expanded/compact Browser states. |

---

## Documentation / Operational Notes

- The approved requirement remains the bounded product outcome; this plan owns
  only execution and stays active until a committed checkpoint permits normal
  lifecycle completion.
- No dependency, migration, rollout, or external service change is required.

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-08-21-yuzuha-anomaly-support-vertical-requirements.md`
- Permanent owners: `docs/setup-workbench-product-contract.md`,
  `docs/zzz-formula-mechanics.md`, `docs/source-fact-boundary.md`,
  `docs/zzz-game-vocabulary.md`, `docs/workbench-ui-design-rules.md`
- Current consumers: `src/workbench/provider-effects.ts`,
  `src/workbench/preparation.ts`, `src/workbench/calculate.ts`,
  `src/workbench/calculation/result.ts`, `src/components/AgentSetup.tsx`, and
  `src/components/ResultPanel.tsx`
