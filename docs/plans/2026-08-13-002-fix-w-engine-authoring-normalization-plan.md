---
title: "fix: Normalize W-Engine authoring"
type: fix
status: active
date: 2026-08-13
---

# fix: Normalize W-Engine authoring

## Summary

Make the permanent W-Engine authoring order explicit, then apply it to the two
current candidate omissions found by the bounded roster audit without changing
established prepared representatives or unrelated Agent behavior.

---

## Problem Frame

Current vertical requirements correctly preserve most authored W-Engine
packages, but Trigger omits one fully usable Stun package and Cissia rejects a
partially usable Attack package whose retained portion remains a material
limited-ownership choice. The common authority states whole-package comparison
principles but does not yet record the complete inspection order used to catch
those omissions.

---

## Requirements

- R1. Record one bounded W-Engine authoring flow that begins from current
  competitive-practice shortlists but independently verifies every retained
  package against current role, formula, action, threshold, eligibility,
  activation, nearest competitor, whole-package opportunity cost, pool, and
  prepared-first-choice boundaries.
- R2. Add Blazing Laurel to Trigger's full-pool candidates because Trigger can
  consume its Impact package and activate its Fire/Ice squad CRIT DMG package;
  preserve Spectral Gaze and Ice-Jade Teapot preparation policy.
- R3. Add Bellicose Blaze to Cissia's full-pool candidates because Energy Regen
  and CRIT Rate remain a material limited-ownership package after its unusable
  Fire Aftershock DEF Ignore is charged as opportunity cost; preserve
  Serpentine Seeker as the full representative and omit that Fire-only clause
  from Cissia Result projection.
- R4. Keep both additions unavailable in the non-limited pool and preserve all
  existing contrasting Agent memberships and representatives.
- R5. Prove the shared whole-package and projection boundaries with focused
  content, calculation, candidate-pool, and visible-selector checks rather than
  freezing every Agent candidate array.

---

## Scope Boundaries

- No runtime optimizer, package score, guide registry, source receipt, or
  explanation payload.
- No W-Engine representative changes, contextual preparation rules, or
  selected-input pressure lifecycle changes.
- No candidate addition for another Agent merely because the same W-Engine is
  usable by Specialty.
- No external evidence or rationale payload retained in repository files.

---

## Context & Research

### Relevant Code and Patterns

- `docs/setup-workbench-product-contract.md` owns candidate and representative
  authoring policy.
- `src/workbench/content/engines.ts` owns exact W-Engine facts and pool-filtered
  candidate membership.
- `src/workbench/calculation/agents/ju-fufu.ts` and
  `src/workbench/calculation/agents/lycaon.ts` establish Blazing Laurel's
  holder-local Impact and Fire/Ice recipient projection.
- `src/workbench/calculation/agents/cissia.ts` already separates usable
  W-Engine clauses from action- and Attribute-scoped Result projection.

### Institutional Learnings

- `docs/solutions/workflow-issues/prevent-secondary-requirements-from-validating-themselves-2026-08-12.md`
  requires permanent authority, closest current consumer, and a contrasting
  current consumer before accepting a secondary requirement or passing test.

---

## Key Technical Decisions

- Extend existing explicit content and per-Agent calculation branches. A new
  generic W-Engine rule engine would exceed the two current consumers.
- Treat candidate membership, prepared first choice, and Result projection as
  three separate artifacts. Neither new candidate changes the representative.
- Preserve complete Setup disclosure for unused passive clauses while omitting
  those clauses from Result when the current holder cannot activate or consume
  them.

---

## Open Questions

### Resolved During Planning

- Trigger representative: Spectral Gaze remains the general-damage first
  choice and Ice-Jade Teapot remains the Sheer-focus adjustment; Blazing Laurel
  is a material alternate, not an undocumented replacement.
- Cissia partial package: Bellicose Blaze survives because its Energy Regen and
  CRIT Rate package creates a material limited-ownership alternative, while
  its Fire Aftershock clause remains visibly disclosed but unprojected.

### Deferred to Implementation

- None.

---

## Implementation Units

- U1. **Close the authoring contract and local requirements**

**Goal:** Persist the common inspection order and replace the two stale local
candidate conclusions with their independently supported current outcomes.

**Requirements:** R1-R4

**Dependencies:** None

**Files:**
- Modify: `docs/setup-workbench-product-contract.md`
- Modify: `docs/brainstorms/2026-08-07-soldier-zero-vertical-requirements.md`
- Modify: `docs/brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md`

**Approach:** Keep the permanent owner procedural and Agent-neutral. Put exact
candidate membership and package consequences only in the owning vertical
requirements, directly replacing contradictory prose.

**Patterns to follow:** Existing Disc inspection routing and bounded authoring
language in `docs/setup-workbench-product-contract.md`.

**Test scenarios:**
- Documentation: every new candidate conclusion names its usable package,
  unused opportunity cost, pool, unchanged representative, and projection
  boundary without retaining external evidence.

**Verification:** Markdown IDs and links remain valid, and no current
requirement continues to exclude either settled candidate.

---

- U2. **Add the two bounded W-Engine candidates and consumers**

**Goal:** Admit Blazing Laurel for Trigger and Bellicose Blaze for Cissia while
preserving current pool and representative behavior.

**Requirements:** R2-R4

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/content/types.ts`
- Modify: `src/workbench/content/engines.ts`
- Modify: `src/workbench/calculation/agents/trigger.ts`
- Modify: `src/workbench/calculation/agents/cissia.ts`
- Test: `src/workbench/content/equipment-effects.test.ts`
- Test: `src/workbench/calculate.mechanics.test.ts`
- Test: `src/workbench/preparation.test.ts`

**Approach:** Reuse the existing exact-fact contracts, pool filter, provider
clauses, and source disclosure. Trigger projects Blazing Laurel only through
its established Impact and Fire/Ice consumers. Cissia projects Bellicose's
CRIT Rate and generic advanced Energy Regen but no Fire Aftershock DEF Ignore.

**Patterns to follow:** Blazing Laurel consumers in Ju Fufu and Lycaon; Cissia's
Serpentine/Drill/Cordis clause separation; unchanged prepared mappings in
`src/workbench/content/representatives.ts`.

**Test scenarios:**
- Happy path: full-pool Trigger exposes Blazing Laurel and its selected package
  increases Trigger Impact while delivering CRIT DMG only to applicable
  Fire/Ice damage consumers.
- Contrast: an inapplicable Attribute consumer receives no Blazing Laurel CRIT
  DMG, and Trigger's prepared Spectral/Ice-Jade choices remain unchanged.
- Happy path: full-pool Cissia exposes Bellicose Blaze and selection supplies
  Energy Regen plus CRIT Rate.
- Contrast: Bellicose selection creates no Fire Aftershock DEF Ignore source on
  Electric Cissia, while Serpentine retains its usable Electric DEF Ignore.
- Pool boundary: both limited additions are absent from non-limited candidates.

**Verification:** Exact Setup summaries disclose every retained passive clause,
calculation sources project only current consumers, and all prepared selections
remain members of their effective pools.

---

- U3. **Verify the visible candidate experience and preservation boundary**

**Goal:** Confirm the two candidates are selectable and understandable without
regressing completeness, accessibility, or established responsive behavior.

**Requirements:** R4-R5

**Dependencies:** U2

**Files:**
- Test: `src/App.party.test.tsx`
- Test: `src/components/AgentSetup.test.tsx`

**Approach:** Extend one shared selector journey only if existing generic tests
do not already prove the new exact package disclosure. Use a fixed-port local
browser check for Trigger and Cissia candidate surfaces.

**Patterns to follow:** Existing selected/candidate equipment accessible
descriptions and direct-edit incompleteness behavior.

**Test scenarios:**
- Integration: selecting either new candidate shows the exact advanced stat and
  all materially distinct passive lines, keeps Rank-default refinement, and
  restores Result only when the setup remains complete.
- Accessibility: candidate and selected summaries retain distinct accessible
  descriptions without source prose or hidden compatibility claims.

**Verification:** Focused UI tests pass and browser inspection at
`127.0.0.1:5173` shows both candidate packages without layout or interaction
regression.

---

## System-Wide Impact

- **Interaction graph:** Static candidate membership flows through existing pool
  filtering, selector rendering, direct selection, provider clauses, and Result
  projection; no new lifecycle is introduced.
- **State lifecycle risks:** A direct selection retains the existing Rank
  default and completeness boundary. Pool changes continue to reprepare only
  the changed Agent.
- **API surface parity:** No external API or automation surface exists.
- **Integration coverage:** One Trigger Attribute contrast and one Cissia
  usable-versus-unused clause contrast prove the shared boundaries.
- **Unchanged invariants:** Non-limited filtering, deterministic preparation,
  incomplete Result, selected identity, and all unrelated candidate arrays stay
  unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| A Specialty-wide addition broadens unrelated Agents | Change only two independently authored Agent arrays and retain explicit contrasts. |
| A visible passive line is mistaken for Result applicability | Keep Setup disclosure and Result projection separate and test the unused Fire clause. |
| Candidate admission accidentally changes preparation | Assert existing representatives and contextual adjustments unchanged. |

---

## Documentation / Operational Notes

- External facts and guide comparisons remain ephemeral.
- Browser verification uses the repository-standard fixed development port
  `5173`; no production or asset workflow changes are required.

---

## Sources & References

- `docs/setup-workbench-product-contract.md`
- `docs/brainstorms/2026-08-07-soldier-zero-vertical-requirements.md`
- `docs/brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md`
- `src/workbench/content/engines.ts`
- `src/workbench/calculation/agents/trigger.ts`
- `src/workbench/calculation/agents/cissia.ts`
