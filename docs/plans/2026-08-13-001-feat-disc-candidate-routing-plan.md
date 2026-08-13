---
title: "feat: Apply Disc candidate routing and same-effect lifecycle"
type: feat
status: completed
date: 2026-08-13
origin: docs/brainstorms/2026-08-13-disc-inspection-routing-requirements.md
---

# feat: Apply Disc candidate routing and same-effect lifecycle

## Summary

Extend the existing Disc candidate and selection-reconciliation paths so the
accepted inspection routing supplies missing formula-valid candidates and
shows only one legal identity from each authored same-effect relationship.
Preserve exact selected identity, direct-edit incompleteness, and prepared
zero-substat first choices without introducing runtime scoring.

---

## Problem Frame

Current candidate arrays still omit several accepted Attribute 2-piece choices
and expose equal-effect Disc identities as duplicate selector choices. The
selection lifecycle already clears invalid equipment without fallback, but it
does not yet re-evaluate same-effect exposure against the current 4-piece role.

---

## Requirements

- R1. Apply corrected current vertical outcomes through existing candidate,
  preparation, different-set, pressure, and invalidation mechanisms.
- R2. Add Chaotic Metal for Yixuan while excluding standalone HP% and PEN Ratio
  2-piece choices and preserving her prepared representative.
- R3. Show Dialyn only Swing Jazz for her equal-effect Energy Regen role.
- R4. Make Hugo's ATK% 2-piece identity follow his selected 4-piece role.
- R5. Make Ju Fufu's ATK% and Energy Regen identities follow her selected
  4-piece role.
- R6. Make Pan Yinhu's ATK% and Energy Regen identities follow Astral Voice,
  Swing Jazz, and Bunny in Wonderland exactly as authored.
- R7. Re-evaluate a direct 4-piece edit, clear an invalid 2-piece without
  substitution or restoration, and leave Result incomplete until repair.
- R8. Audit all admitted Agents through the permanent routing without turning
  similar-looking findings into automatic mutations.

---

## Scope Boundaries

- No numeric-equivalence registry, named-Agent rule table, runtime score,
  edited-substat optimizer, or second effect-classification map.
- No anomaly-specific candidate membership.
- No guide URLs, copied prose, receipts, or rationale payloads in the
  repository; representative guide checks remain ephemeral authoring input.
- No prepared representative changes except those already owned by a current
  vertical requirement.
- No automatic correction of additional audit findings; any distinct finding
  remains a separately reviewed semantic unit.

---

## Context & Research

### Relevant Code and Patterns

- `src/workbench/content/discs.ts` owns retained Disc facts, exact identities,
  summaries, and authored candidate membership.
- `src/workbench/candidates.ts` already derives contextual and selected-input
  candidate pressure without mutating base authoring.
- `src/workbench/state.ts` already reconciles invalid required selections to
  `null`, preserves no fallback, and supports explicit role exchange when both
  identities remain legal.
- `src/workbench/content/representatives.ts` owns prepared pool choices and must
  remain independent of edited counts or Result.
- Shared candidate, state, preparation, and Agent Setup tests already cover the
  closest lifecycle seams.

### Institutional Learnings

- Permanent and current vertical owners determine semantics; tests and guides
  prove neither candidate membership nor representative priority by
  themselves.
- Candidate membership, prepared first choice, retained source facts, and
  Result projection are separate artifacts.
- Selected-input dependencies require present, absent, and reselected coverage
  with invalid-selection clearing and no restoration.

### External References

- Representative current guides were checked only as practical input. Their
  common recommendations align with the routing, while omitted Polar, Inferno,
  Bunny, Thunder, and matching-Attribute cases demonstrate why guide lists are
  not exhaustive candidate authority.

---

## Key Technical Decisions

- Model only the two currently consumed same-effect relationships as explicit
  authored substitutions. Do not infer equivalence from numeric values.
- Derive the displayed member from selected 4-piece identity, base 4-piece
  membership, contextual 4-piece membership, and authored canonical fallback,
  in that order.
- Keep the source candidate arrays responsible for material membership; apply
  same-effect compression in the effective-candidate layer where contextual
  and selected-input facts are available.
- Preserve explicit role exchange when a user promotes the current 2-piece to
  4-piece and the former 4-piece becomes the legal displayed complement. This
  direct selection is explicit exchange intent and the sole exception to the
  ordinary clear-on-invalid rule; it is not an inferred fallback.
- Implement source facts for Thunder Metal and Chaotic Metal only to the depth
  consumed by current 2-piece choices.

---

## Open Questions

### Resolved During Planning

- Does representative guide validation reveal a product conflict? No. It
  confirms the routing as a way to interpret and complete guide recommendations
  rather than copy them.
- Should Manato inherit an ATK% 2-piece because a guide lists it? No. ATK enters
  his Sheer Force through the weaker conversion while Fire DMG is a direct
  modifier axis; the guide entry does not override current formula opportunity
  cost or the accepted vertical.

### Deferred to Implementation

- None. Exact helper naming and test organization may follow the closest local
  patterns without changing behavior.

---

## Implementation Units

- U1. **Retain missing Disc facts and corrected candidate membership**

**Goal:** Add only the current facts and candidate identities required by the
accepted Attack, Rupture, Stun, and capped-provider outcomes.

**Requirements:** R1, R2, R3, R8

**Dependencies:** None

**Files:**
- Modify: `src/workbench/content/types.ts`
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/calculation/agents/yixuan.ts`
- Modify: `src/workbench/calculation/agents/yidhari.ts`
- Modify: `src/workbench/calculation/agents/anby-soldier-0.ts`
- Modify: `src/workbench/calculation/agents/seed.ts`
- Modify: `src/workbench/calculation/agents/cissia.ts`
- Modify: `src/workbench/calculation/agents/evelyn.ts`
- Modify: `src/workbench/calculation/agents/ju-fufu.ts`
- Modify: `src/workbench/calculation/agents/pan-yinhu.ts`
- Test: `src/workbench/content/equipment-effects.test.ts`
- Test: `src/workbench/preparation.test.ts`
- Test: `src/workbench/calculate.mechanics.test.ts`
- Test: `src/workbench/calculate.policies.test.ts`

**Approach:**
- Retain Thunder Metal and Chaotic Metal only as current 2-piece consumers need.
- Correct authored lists from their owning verticals, including matching
  Attribute additions. Retain every materially eligible member of an authored
  same-effect relationship; presentation-level compression belongs only to U2.
- Connect each newly reachable exact identity to its current ATK, Energy Regen,
  or matching-Attribute Result consumer without changing effect semantics.
- Leave prepared representatives and zero supplied substats unchanged.

**Execution note:** Add shared candidate characterization before changing the
membership arrays.

**Patterns to follow:**
- Existing retained 2-piece facts and compressed summaries in
  `src/workbench/content/discs.ts`.
- Prepared representative invariants in `src/workbench/preparation.test.ts`.

**Test scenarios:**
- Happy path: representative Attack and Rupture Agents expose their matching
  Attribute 2-piece candidate.
- Contrast: a Rupture Agent exposes neither standalone HP% nor PEN Ratio.
- Integration: every added candidate has exact retained fact, summary, and
  artwork while prepared first choices and zero substat counts remain stable.
- Integration: selecting each representative new or substituted identity adds
  its exact source to the existing Result metric rather than only changing the
  candidate surface.
- Lifecycle: after the user edits substat counts or other Result-producing
  inputs, authorized preparation still derives the same authored package and
  resets every effective supplied count to zero rather than reacting to Result.

**Verification:** Candidate facts are complete for current consumers and no
prepared representative changes as a side effect.

- U2. **Compress authored same-effect identities in effective candidates**

**Goal:** Show one legal member of each authored equal-effect relationship while
preserving every current 4-piece role and contextual origin.

**Requirements:** R1, R3, R4, R5, R6

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/candidates.ts`
- Test: `src/workbench/state.test.ts`
- Test: `src/components/AgentSetup.test.tsx`

**Approach:**
- Keep exact relationship membership explicit and bounded; do not compare
  numeric effect payloads at runtime.
- Activate a relationship only for a consumer whose exact members have each
  independently passed current candidate authoring. Compression may filter
  those admitted identities; it must never manufacture an unadmitted partner.
- Choose the visible member from current selected 4-piece legality, then base or
  contextual 4-piece reachability, then the authored canonical identity.
- Compose this compression after contextual and selected-pressure candidate
  derivation so it does not bypass existing King, Puffer, or Astral behavior.

**Execution note:** Characterize Dialyn, Hugo, Ju Fufu, and Pan Yinhu as shared
relationship variants rather than separate vertical suites.

**Patterns to follow:**
- Effective candidate derivation in `src/workbench/candidates.ts`.
- Selected-input pressure contrasts in `src/workbench/state.test.ts`.

**Test scenarios:**
- Happy path: Dialyn sees Swing Jazz and not Moonlight Lullaby.
- Variant: Hugo on Hormone Punk sees Astral Voice; another admitted 4-piece
  exposes Hormone Punk.
- Variant: Ju Fufu and Pan Yinhu expose the authored member for each selected
  4-piece state with no duplicate equal-effect choice.
- Contextual variant: Cissia outside repeated Quick Assist context exposes
  Hormone Punk; inside context Dawn's Bloom exposes Astral Voice; selecting the
  contextual Astral Voice 4-piece exposes Hormone Punk with exact source.
- Selected-pressure contrast: Lycaon preserves the established King present,
  absent, and reselected Woodpecker/CRIT lifecycle beside Trigger's independent
  qualified-CRIT behavior.
- Contrast: an Agent without an authored relationship remains unchanged.
- Contrast: a consumer with only one independently admitted same-effect member
  never receives the unadmitted partner from compression.
- Integration: candidate selector artwork and accessible source description
  match the exact displayed identity.

**Verification:** Every accepted same-effect case presents one legal identity,
while ordinary and contextual candidates preserve their prior behavior.

- U3. **Preserve direct-edit clearing and explicit role exchange**

**Goal:** Complete the same-effect selection lifecycle without hidden fallback
or history restoration.

**Requirements:** R6, R7

**Dependencies:** U2

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/workbench/candidates.ts`
- Modify: `src/workbench/state.ts`
- Test: `src/workbench/state.test.ts`
- Test: `src/App.setup.test.tsx`
- Test: `src/components/AgentSetup.test.tsx`

**Approach:**
- Evaluate a promoted 2-piece against the candidate state produced by its new
  4-piece role before accepting an explicit role exchange. Selecting the
  current 2-piece as the new 4-piece is the sole explicit-exchange exception;
  moving the former 4-piece is not an automatic substitute.
- Derive the currently legal explicit role-swap identity separately from the
  displayed 2-piece candidates so the selector does not need hidden duplicates
  and the reducer consumes the same legality result.
- For every other direct 4-piece edit, let existing reconciliation clear a
  no-longer-offered 2-piece and keep Result incomplete until the user repairs it.
- Re-exposing a prior identity must not restore the cleared selection.

**Execution note:** Implement the complete present, invalidated, and reselected
lifecycle test-first.

**Patterns to follow:**
- Required-selection reconciliation in `src/workbench/state.ts`.
- Incomplete Result and manual-repair journeys in `src/App.setup.test.tsx`.

**Test scenarios:**
- Happy path: promoting the current 2-piece to 4-piece atomically moves the
  former 4-piece into the now-legal 2-piece role.
- Edge case: changing to a third 4-piece clears an invalid same-effect 2-piece,
  makes Result incomplete, and selects no substitute.
- Lifecycle: changing back re-exposes the old identity but does not restore it;
  explicit user selection completes Result again.
- Integration: the role exchange and repair surfaces show the exact selected
  labels, artwork, and accessible sources; W-Engine, mains, and unrelated
  substats remain unchanged, and only the invalid 2-piece becomes `null`.
- Accessibility: after invalidation, focus remains on the edited 4-piece
  opener, the live status names the Agent and required 2-piece, Setup exposes
  the required control, and Result is empty. Opening that control shows the new
  canonical choices; selecting one returns focus and restores Result.
- Source interaction: one shared role-exchange journey proves both selected
  Disc cards and the new 2-piece Result contribution disclose the exact source,
  including its existing source interaction.
- Contrast: existing non-equivalent legal role exchange remains unchanged.

**Verification:** The user can exchange legal roles explicitly, while all
indirect invalidation remains clear/no-fallback/no-restoration.

- U4. **Audit all admitted Agents through the permanent routing**

**Goal:** Confirm the bounded corrections did not leave another missing or
excessive candidate and did not generalize local behavior to a similar-looking
Agent.

**Requirements:** R8

**Dependencies:** U1, U2, U3

**Files:**
- Read: `src/workbench/content/discs.ts`
- Read: `src/workbench/candidates.ts`
- Read: `src/workbench/content/representatives.ts`
- Read: `src/workbench/calculation/agents/`

**Approach:**
- Trace every proposed exception through its exact consumer, formula or role
  route, holder and activation compatibility, nearest usable same-axis
  comparator, contrasting current case, complete package, finite opportunity
  cost, representative consequence, and selection lifecycle.
- Report any additional finding as a separate semantic unit without editing it
  in this plan's implementation diff.

**Patterns to follow:**
- The bounded authoring gate in `AGENTS.md`.
- Current sentinel structure in the permanent product contract and owning
  vertical requirements.

**Test scenarios:**
- Test expectation: none -- this is a read-only semantic audit of implemented
  candidates and prepared outcomes; U1-U3 own behavior-bearing coverage.

**Verification:** The audit closes every origin A4 field for all admitted Agents
and clearly separates no-finding, follow-up finding, and unresolved fact states.

---

## System-Wide Impact

- **Interaction graph:** authored facts feed effective candidates, selector
  actions feed state reconciliation, and completeness gates Result.
- **State lifecycle risks:** a 4-piece change can invalidate a 2-piece; the plan
  preserves atomic role exchange only for explicit user intent and otherwise
  clears it.
- **API surface parity:** no external API or new interface is introduced.
- **Integration coverage:** shared UI journeys prove exact identity, accessible
  source, incompleteness, repair, and no restoration across layers.
- **Unchanged invariants:** party and pool preparation rebuild behavior,
  selected-pressure lifecycle, contextual Puffer/Astral routing, substat zero
  initialization, and Result projection remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Same-looking values accidentally create a universal equivalence rule | Keep two authored relationships explicit and test an unchanged contrast. |
| Compression hides a legal 4-piece role | Derive the visible complement from selected, base, and contextual 4-piece membership before fallback. |
| Direct edit silently replaces user intent | Reuse null reconciliation and assert incomplete/no-fallback/no-restoration. |
| Audit expands into unrelated corrections | Report additional semantic findings separately without mutating them. |

---

## Documentation / Operational Notes

- The origin requirements and permanent product contract already own behavior;
  this plan adds no duplicate policy prose.
- External evidence remains ephemeral.
- Local browser verification uses the fixed development origin
  `http://127.0.0.1:5173` for affected selector and repair journeys. Run one
  desktop keyboard-only exchange/repair pass and one representative width at
  or below 640px to verify the selector remains visible and scrollable, required
  controls are unobscured, and focus indication/return remain intact. Do not
  expand this into an all-breakpoint or all-zoom matrix unless a defect appears.

---

## Sources & References

- **Origin document:**
  `docs/brainstorms/2026-08-13-disc-inspection-routing-requirements.md`
- **Permanent owner:** `docs/setup-workbench-product-contract.md`
- **Related code:** `src/workbench/content/discs.ts`,
  `src/workbench/candidates.ts`, `src/workbench/state.ts`
