---
title: "feat: Add retained Mindscape setup and Result behavior"
type: feat
status: completed
date: 2026-08-05
---

# feat: Add retained Mindscape setup and Result behavior

## Summary

Make the existing M0-M6 input materially affect the current Yixuan, Dialyn,
and Lucia vertical. Keep only the cumulative Mindscape clauses that change the
prepared setup or an existing Result quantity, action difference, or operation;
preserve the committed workbench composition and stop short of UI stabilization.

---

## Problem Frame

The current consumer already presents an editable Mindscape input and correctly
re-prepares only the changed Agent, but every M0-M6 selection resolves the same
prepared package and the calculation never reads Mindscape. The visible input
therefore has lifecycle behavior without the current setup and Result
differences that give that behavior meaning.

This checkpoint completes that bounded vertical. It does not attempt to model
every clause in the three kits or establish a reusable Mindscape system.

---

## Requirements

- R1. Apply Mindscapes cumulatively: selecting Mx applies every retained effect
  whose minimum level is at or below x, and lowering the selection removes every
  retained effect above the new level.
- R2. Keep candidate membership unchanged for all three Agents. Keep the current
  effective-substat offerings unchanged. Under the later finite-opportunity
  correction, Yixuan's full-pool prepared balance is Branch & Blade plus CRIT
  Rate at M0 and Woodpecker plus CRIT DMG at M1-M6. Her non-limited balance is
  Woodpecker plus CRIT Rate at M0 and Branch & Blade plus CRIT Rate at M1-M6.
  No other prepared first choice changes.
- R3. Changing one Agent's Mindscape re-prepares only that Agent using the
  current pool, resets that Agent's equipment, main stats, refinement, and
  offered effective-substat counts to the authored prepared setup, preserves the
  other two editable setups, and recalculates the whole party.
- R4. Preserve the complete-selection gate. Calculation returns no Result if
  any required selection for any Agent is incomplete; Mindscape handling cannot
  introduce a partial or fallback Result.
- R5. Implement only the retained cumulative Result differences in the table
  below, with their exact recipients, earliest surfaces, scopes, values, and
  caps.
- R6. Present an Agent Mindscape contribution as the mapped `Mindscape` source
  with its selected minimum level, link a local contribution to the existing
  Mindscape input, and preserve the existing provider-Agent prefix and identity
  link for cross-Agent contributions.
- R7. Keep Yixuan M4 as one fully enabled action outcome containing exactly the
  two affected EX Special Attack forms. Preserve its 30%-per-stack and two-stack
  meaning while applying the 60% capped result. Do not broaden it to every EX
  Special Attack.
- R8. Add no Mindscape gauge. Preserve the existing Dialyn and Lucia gauges.
  Express Yixuan M4's fixed fully enabled two-stack cap in its action-source
  disclosure because it is not a user-tuned threshold relationship. Lucia's
  existing gauge keeps its 24,000 initial-Max-HP basis while its linked Squad
  Sheer Force output and cap resolve from the selected M0-M2, M3-M4, or M5-M6
  Special Attack tier.
- R9. Prove preparation, cumulative calculation, recipient and non-recipient
  behavior, action scope, source presentation, downgrade removal, and the
  incomplete-selection gate with behavior-bearing tests and browser checks.

### Retained cumulative behavior

| Selected Agent | Mindscape | Prepared setup difference | Retained Result difference |
|---|---:|---|---|
| Yixuan | M0 | Full uses Branch & Blade + CRIT Rate; non-limited uses Woodpecker + CRIT Rate | Current M0 Result |
| Yixuan | M1 | Full uses Woodpecker + CRIT DMG; non-limited uses Branch & Blade + CRIT Rate | Combat Baseline and Fully Enabled CRIT Rate gain 10%; Initial is unchanged by the Mindscape source |
| Yixuan | M2 | Same as M1 | The existing enemy Stun-duration operation resolves to the non-stacking highest value, +3s from Yixuan Mindscape, instead of Dialyn Core Passive's +2s |
| Yixuan | M3 | Same as M1 | Same retained Result as M2 |
| Yixuan | M4 | Same as M1 | Fully Enabled DMG Bonus for `EX Special Attack: Cloud-Shaper` and `EX Special Attack: Ashen Ink Becomes Shadows` gains 30% per stack at 2 stacks, for +60% |
| Yixuan | M5 | Same as M1 | Same retained Result as M4 |
| Yixuan | M6 | Same as M1 | Fully Enabled Sheer DMG Bonus gains 20% during Meditation, in addition to all earlier retained effects |
| Dialyn | M0-M1 | No change | Current M0 Result |
| Dialyn | M2-M6 | No change | Yixuan's Fully Enabled DMG Bonus gains 15% against Malicious Complaint, and Yixuan's Stun DMG Multiplier gains 20 percentage points, from 30% to 50% under the prepared party |
| Lucia | M0-M1 | No change | Darkbreaker uses completed Special Attack level 12: 12 base Sheer Force plus 7.4 per 200 initial Max HP, capped at 900 when initial Max HP reaches 24,000 |
| Lucia | M2 | No change | Same level-12 Darkbreaker relationship; Yixuan's Fully Enabled Sheer DMG Bonus gains 15% while Darkbreaker and Ether Veil: Wellspring are active |
| Lucia | M3-M4 | No change | Cumulatively keeps M2; completed Special Attack level 14 changes Darkbreaker to 12 base plus 7.8 per 200 initial Max HP, capped at 948 at the same 24,000 initial-Max-HP point |
| Lucia | M5-M6 | No change | Cumulatively keeps M2; completed Special Attack level 16 changes Darkbreaker to 12 base plus 8.2 per 200 initial Max HP, capped at 996 at the same 24,000 initial-Max-HP point |

---

## Scope Boundaries

- Do not retain Yixuan's Technique, Adrenaline, extra lightning strike, Ether
  RES ignore, Condensed Ink action coefficient, or free-Ultimate resource flow.
- Do not retain Dialyn's Positive Reviews rate, All-Attribute RES ignore,
  one-time Energy, personal ATK, or Aftertone damage coefficient.
- Do not retain Lucia's RES ignore, Decibel generation, Echo reapplication,
  Harmony personal damage, party Decibel grant, personal ATK conversion, or
  Harmony critical-hit behavior.
- Do not retain M3/M5 ordinary-skill tiers for Yixuan or Dialyn. Retain only
  Lucia's level-12, level-14, and level-16 Special Attack values that change the
  current Darkbreaker Sheer Force relationship and gauge. Her base action
  DMG/Daze coefficients and the level-varying 70%/76%/82% Max-HP coefficient
  added to a Harmony's final attack remain excluded raw action damage.
- Do not add Agents, party combinations, focus behavior, W-Engines, Drive Discs,
  main stats, substats, formula families, or Result quantities beyond the
  current vertical.
- Do not restyle, reallocate, stabilize, or otherwise revisit the committed
  Identity -> Setup -> Result UI. The only presentation change in scope is the
  functional Mindscape source, action, operation, and source-link behavior.
- Do not add a catalogue, universal Mindscape/effect schema, runtime optimizer,
  combat or rotation simulator, research/evidence system, persistence,
  compatibility layer, source registry, or speculative dependency.
- Do not add structure-only tests, CSS-shape assertions, copied source wording,
  guide URLs, candidate rationale, or an audit matrix.

---

## Context & Research

### Current code and patterns

- `src/workbench/content.ts` owns the current vertical's literal candidates,
  authored prepared first choices, retained values, and source labels.
- `src/workbench/state.ts` already distinguishes Mindscape re-preparation from
  direct edits. Its `setMindscape` transition preserves the current pool,
  replaces only the target setup, and leaves calculation derived.
- `src/workbench/calculate.ts` calculates the complete party once, projects one
  `AgentResult` per Agent, records the earliest surface for atomic sources, and
  already supports metric breakdowns, action outcomes, operations, and gauges.
- `src/components/AgentSetup.tsx` already renders all seven Mindscape choices.
  `src/components/ResultPanel.tsx` already prefixes cross-Agent sources and
  links local and provider-owned source loci.
- `src/workbench/state.test.ts`, `src/workbench/calculate.test.ts`, and
  `src/App.test.tsx` are the behavior-bearing verification layers. The canonical
  automated gate remains `npm run check`.

### Settled retention review

- Exact current game-data text and current guide practice were checked only to
  settle the values and competitive preparation above. In accordance with the
  source-fact boundary, this plan retains the settled current meaning and no
  external research trail.
- Yixuan M1 changes the complete CRIT balance in both pools. Full moves to
  Woodpecker plus a CRIT DMG main because M1 supplies another 10% CRIT Rate;
  non-limited moves to Branch & Blade while keeping the CRIT Rate main. Both
  packages reserve the bounded future CRIT opportunity without exceeding the
  100% cap, and both sets remain visible candidates.
- Dialyn and Lucia retain their daze/buffer directions at every Mindscape.
  Their personal-damage clauses do not admit personal-damage candidates or new
  personal Result rows.
- Yixuan M2 and Dialyn's current +2s Core Passive operation are similar
  non-stacking Stun extensions. The current fully enabled party applies only the
  greater +3s value and its Yixuan Mindscape origin.
- The exact unresolved live-state details for Yixuan M4 stack consumption do not
  affect this consumer. The source states +30% per stack and a two-stack cap;
  the fully enabled surface reaches that compatible cap without modeling the
  subsequent consumption sequence.

### Institutional learning

- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
  requires interaction-state fidelity before visual judgment. This plan uses
  the existing real M0-M6 control and interaction states; it introduces no
  visual experiment and defers all UI stabilization.

---

## Key Technical Decisions

- Keep Agent-local literal values and minimum-level checks. A selected
  Mindscape is already the highest unlocked level, so direct cumulative
  `at least Mx` decisions are sufficient and easier to audit than an effect
  interpreter.
- Keep the existing Agent/pool prepared table as the baseline and apply only
  the bounded Yixuan pool/Mindscape 2-piece and Slot-4 balances. Candidate
  collections remain independent of Mindscape because no membership changes.
- Keep the existing `setMindscape` event boundary. Make its preparation lookup
  Mindscape-aware rather than adding a second reset event or continuously
  correcting direct edits.
- Extend the existing Result source union with one `mindscape` locus. Local
  Mindscape sources use that locus; cross-Agent sources continue to use the
  provider Agent's identity tone and prefix.
- Keep the existing Dialyn enemy Stun-duration operation as the single
  projection point. Resolve its current applied value and source before
  projection: +2s from Dialyn Core below Yixuan M2, +3s from Yixuan Mindscape at
  M2+, never +5s and never an inactive lesser-source row.
- Add Yixuan M4 as a child of the existing EX Special Attack outcome so its two
  named forms inherit the common and stunned-EX amounts before adding the M4
  difference. This preserves arithmetic disclosure without broadening scope.
- Add Lucia M2 to Sheer DMG Bonus, not Sheer Force. Add Yixuan M6 to the same
  modifier region. Neither changes the Rupture ATK/Max HP conversion.
- Resolve Lucia's bounded Special Attack table directly from Mindscape:
  M0-M2 uses level 12, M3-M4 level 14, and M5-M6 level 16. Keep only the three
  Darkbreaker per-200 values and caps; do not introduce an editable skill level,
  complete skill table, or general tier schema.
- Preserve calculation as pure derived output. Do not store Result, resolved
  sources, action rows, or gauge state in the reducer.

---

## Alternative Approaches Considered

- A Mindscape catalogue or universal effect schema: rejected because the three
  current consumers need seven small numeric distinctions and one prepared
  override, not a reusable content language.
- A table of every M1-M6 clause: rejected because excluded resource, raw damage,
  and personal-damage clauses would become permanent unused content.
- A runtime equipment optimizer for Yixuan M1: rejected because the prepared
  Branch/Woodpecker choices are authored policy and direct Disc selection
  remains the user's decision.
- A combat/resource simulator: rejected because Technique, Adrenaline, Positive
  Reviews, Decibels, trigger frequency, rotation share, and final output do not
  change the current setup-tuning Result.
- An evidence registry, source archive, or rationale payload: rejected because
  authoring evidence is ephemeral and cannot change the current consumer.
- Persistence or per-Mindscape edited setup memory: rejected because session
  policy explicitly re-prepares on every Mindscape change and owns no saved
  variants.
- A compatibility layer or parallel old/new Result shape: rejected because the
  repository is pre-stable, local, and has no external contract consumer.
- UI stabilization in the same checkpoint: rejected because the committed
  layout is the required baseline and this work changes semantics, not visual
  direction.
- Snapshot, object-shape, class-name, or wrapper-count tests: rejected because
  they do not prove preparation, calculation, recipient, or visible behavior.

---

## Open Questions

### Resolved during planning

- **Does any Mindscape change candidate membership or effective-substat
  offerings?** No. Only Yixuan's authored full-pool prepared 2-piece changes at
  M1+, within the existing candidate set.
- **Do M3/M5 introduce ordinary skill tiers?** Only for Lucia. Her retained
  Darkbreaker Sheer Force relationship reads Special Attack levels 12/14/16,
  so M3 and M5 change the current linked gauge and Yixuan's Fully Enabled Sheer
  Force. Yixuan and Dialyn still have no retained table reader, and all ordinary
  base coefficients remain absent.
- **How does Yixuan M2 combine with Dialyn's +2s Stun extension?** The effects
  do not stack; the current party applies and shows only the higher +3s M2
  source.
- **Does Yixuan M4 need a gauge?** No. Its fixed fully enabled action source
  discloses the 30%-per-stack and two-stack cap; no user setup input progresses
  against that boundary.
- **Where does Lucia M2 apply?** To Yixuan's fully enabled Sheer DMG Bonus, not
  Sheer Force or regular DMG Bonus.

### Deferred to implementation

- Exact helper and constant names may follow the existing local style. They
  must not turn the settled literal behavior into a generic effect engine.

No unresolved mechanics fact changes a current visible setup or Result, so
implementation is unblocked.

---

## High-Level Technical Design

> This illustrates the intended approach and is directional guidance for
> review, not implementation specification. The implementing agent should
> treat it as context, not code to reproduce.

```mermaid
flowchart LR
    A["Select one Agent's Mindscape"] --> B["Resolve that Agent's authored setup for current pool"]
    B --> C["Replace only that Agent's editable setup"]
    C --> D["Complete-party selection gate"]
    D --> E["Pure cumulative party calculation"]
    E --> F["Three Agent Result projections"]
    F --> G["Current viewed Setup and Result"]
```

The preparation branch is intentionally narrow: only Yixuan's authored
pool/Mindscape CRIT balance changes the baseline package. The calculation branch is also Agent-local: each retained
effect has one minimum Mindscape, recipient, earliest surface, and existing
metric, action, or operation destination.

---

## Implementation Units

- U1. **Author Mindscape-aware prepared policy**

**Goal:** Make the existing preparation event resolve the one retained
Mindscape-dependent prepared choice without changing candidate membership.

**Requirements:** R1-R4

**Dependencies:** None

**Files:**
- Modify: `src/workbench/content.ts`
- Modify: `src/workbench/state.ts`
- Test: `src/workbench/state.test.ts`

**Approach:**
- Keep the existing Agent/pool prepared selections as the baseline content.
- Add one bounded Yixuan pool/Mindscape resolver: full M0 resolves Branch/CRIT
  Rate and M1-M6 Woodpecker/CRIT DMG; non-limited M0 resolves Woodpecker/CRIT
  Rate and M1-M6 Branch/CRIT Rate. Do not create a three-Agent by seven-level
  prepared matrix.
- Pass the selected Mindscape through the existing preparation lookup. Preserve
  the reducer's target-only replacement, current-pool preservation, zeroed
  substats, Rank-default refinement, and derived-Result boundary.
- Leave W-Engine, Disc candidate, main-stat candidate, and effective-substat
  candidate collections unchanged.

**Patterns to follow:**
- `src/workbench/content.ts` literal prepared policy and candidate collections.
- `src/workbench/state.ts` `createPreparedAgentSetup` and `setMindscape` /
  `switchPool` separation.

**Test scenarios:**
- Happy path: prepared Yixuan M0/full uses Branch/CRIT Rate; M1/full uses
  Woodpecker/CRIT DMG; M6/full keeps that balance.
- Happy path: Yixuan M1/non-limited uses Branch/CRIT Rate; switching that setup
  to full prepares Woodpecker/CRIT DMG; switching back restores Branch/CRIT Rate.
- Happy path: lowering Yixuan from M1 to M0 in the full pool restores
  Branch/CRIT Rate.
- Integration: after direct Disc, refinement, main-stat, and substat edits,
  changing Mindscape re-prepares every required target field and zeros every
  offered target substat.
- Integration: changing Yixuan's Mindscape leaves Dialyn and Lucia setup object
  references and edited values unchanged; changing Dialyn or Lucia leaves the
  other two unchanged.
- Edge case: selecting the current Mindscape remains a no-op and does not reset
  direct edits.
- Edge case: every current candidate collection is identical at M0 and M6.

**Verification:** State behavior proves the complete M0/M1+/pool reset matrix,
target-only ownership, and absence of candidate-set drift.

---

- U2. **Compose cumulative Mindscape Result differences**

**Goal:** Apply every retained effect to its exact current metric, action, or
operation while excluding every non-consumer clause.

**Requirements:** R1, R4-R8

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/content.ts`
- Modify: `src/workbench/calculate.ts`
- Test: `src/workbench/calculate.test.ts`

**Approach:**
- Store only the retained Agent-local values: Yixuan 10% CRIT Rate, +3s Stun
  duration, 30% x 2 M4 action bonus, and 20% Sheer DMG; Dialyn 15% DMG and 20%
  Stun DMG Multiplier; Lucia 15% Sheer DMG.
- Gate each value by the selected highest Mindscape so cumulative behavior is
  direct and downgrades remove later effects.
- Add Yixuan M1 at Combat Baseline, leaving Initial unchanged and carrying the
  aggregate increase through Fully Enabled while disclosing the atomic source
  only at Combat.
- Resolve one enemy Stun-duration operation before building Agent projections.
  Keep the existing Dialyn operation location, but replace its amount and source
  with Yixuan M2 at the higher level.
- Extend Yixuan's action outcomes for M4 only after the existing common and
  stunned-EX differences. Group exactly Cloud-Shaper and Ashen Ink Becomes
  Shadows, apply +60% only at Fully Enabled, and retain the 30% x 2 source
  meaning.
- Add Yixuan M6 and Lucia M2 to Yixuan's Fully Enabled Sheer DMG Bonus. Add
  Dialyn M2 to Yixuan's Fully Enabled regular DMG Bonus and Stun DMG Multiplier.
- Add no base action coefficient, final damage, resource quantity, personal
  Dialyn/Lucia damage row, or new gauge.

**Patterns to follow:**
- `src/workbench/calculate.ts` Agent-specific calculators and direct vertical
  effect helpers.
- Existing earliest-surface breakdowns, `ActionModifier` inheritance,
  `ResultOperation`, provider-owned sources, and CRIT display clamp.

**Test scenarios:**
- Happy path: with identical equipment, Yixuan M1 adds exactly 10 CRIT Rate at
  Combat and Fully Enabled, adds nothing at Initial, and exposes the source at
  Combat only.
- Integration: the actual full-pool M0 -> M1 event also changes the prepared
  2-piece, so the resulting Initial CRIT/CRIT DMG and later aggregates reflect
  both the authored setup and the M1 source.
- Happy path: Yixuan M2 replaces the current +2s Dialyn Core Stun-duration
  operation with one +3s Yixuan Mindscape operation; no +5s total or inactive
  +2s source remains.
- Happy path: Yixuan M4 produces one +60% Fully Enabled action difference for
  exactly Cloud-Shaper and Ashen Ink Becomes Shadows, with no Initial/Combat
  amount and no change to another EX Special Attack.
- Happy path: Yixuan M6 adds exactly 20% Fully Enabled Sheer DMG Bonus and keeps
  the M1, M2, and M4 effects active.
- Cumulative edge: Yixuan M3 equals M2 for retained Result; M5 equals M4;
  lowering M6 -> M5 removes only the M6 Sheer DMG source, and lowering M4 -> M3
  removes only the M4 action source.
- Happy path: Dialyn M2 adds exactly 15% Fully Enabled DMG Bonus and 20
  percentage points of Stun DMG Multiplier to Yixuan; M1 adds neither and M3-M6
  preserve both.
- Happy path: Lucia M2 adds exactly 15% Fully Enabled Sheer DMG Bonus to Yixuan;
  M1 adds none and M3-M6 preserve it.
- Negative recipient: Dialyn M2 and Lucia M2 do not create new personal DMG,
  Stun DMG, Sheer DMG, CRIT, or ATK metrics for Dialyn or Lucia.
- Negative scope: no M1/M3/M4/M5/M6 selection adds a source for an excluded
  resource, RES operation, raw coefficient, extra attack, or personal-damage
  clause.
- Error path: an incomplete required selection still returns `null` before any
  Mindscape calculation runs.

**Verification:** Numeric behavior and source ownership reproduce the complete
retained M0-M6 matrix without expanding the formula or action boundary.

---

- U3. **Present and verify Mindscape Result sources**

**Goal:** Make the retained differences understandable through the current
Setup/Result interaction without changing workbench layout or visual direction.

**Requirements:** R6-R9

**Dependencies:** U2

**Files:**
- Modify: `src/workbench/calculate.ts`
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/components/ResultPanel.tsx` only if the existing action/operation
  rendering cannot express the settled source detail
- Modify: `src/app.css` only for the existing source-tone/highlight grammar
- Test: `src/App.test.tsx`

**Approach:**
- Add one explicit Mindscape source presentation and source locus. A local
  Mindscape source links to the existing M0-M6 control; a Dialyn/Lucia source
  shown in Yixuan Result keeps the existing provider prefix and highlights the
  provider slot.
- Preserve the current Result hierarchy: aggregate row, common sources, action
  outcome, then action source. Do not add a parallel Mindscape explanation
  card, tooltip, catalogue, or narrative copy.
- Use the existing operation presentation for the resolved enemy Stun duration.
- Show M4's 60% action amount with source disclosure that preserves the
  30%-per-stack / two-stack cap. Do not add an action gauge.
- Add only the minimum source-tone binding and active-target treatment required
  by the new locus. Do not change allocation, typography, dimensions,
  breakpoints, selectors, artwork, or responsive order.

**Patterns to follow:**
- `src/components/AgentSetup.tsx` existing W-Engine, Disc, main-stat, and
  substat source targets.
- `src/components/ResultPanel.tsx` `sourceLabel`, provider identity tone,
  action-source hierarchy, and operation list.
- `src/App.test.tsx` accessible interaction and visible-consequence assertions.

**Test scenarios:**
- Happy path: selecting Yixuan M1 visibly selects M1, prepares the correct
  2-piece for the current pool, zeros edited Yixuan substats, and changes the
  CRIT Result with a `Mindscape` / M1 source.
- Happy path: selecting Dialyn M2 while Yixuan remains viewed recalculates
  Yixuan's DMG Bonus and Stun DMG Multiplier, prefixes the source with Dialyn,
  and preserves Yixuan and Lucia editable setups.
- Happy path: selecting Lucia M2 while Yixuan remains viewed recalculates
  Yixuan's Sheer DMG Bonus, prefixes the source with Lucia, and preserves Yixuan
  and Dialyn editable setups.
- Happy path: Yixuan M2 shows one Fully Enabled +3s enemy Stun-duration operation
  with the Yixuan Mindscape source and no +2s or +5s alternative.
- Happy path: expanding the applicable Yixuan Result rows shows the M4 two-action
  group, its +60% value, its 30% x 2 source meaning, and the M6/Lucia M2 Sheer
  DMG sources without duplicate later-surface sources.
- Interaction: pointer hover and keyboard focus on a local Mindscape source
  highlight the existing Mindscape input; a cross-Agent source highlights the
  provider Agent slot without expanding it.
- Downgrade: selecting M0 after M6 removes every Mindscape Result source and
  restores the M0 prepared setup while leaving the other Agents' edits intact.
- Empty state: if a required selection is incomplete, the prior Result content
  disappears rather than showing stale Mindscape values.

**Browser verification:**
- At 1440x900, 1280x720, and 390x844, exercise Yixuan M0/M1/M2/M4/M6, Dialyn
  M2, and Lucia M2 with the affected Result disclosures open.
- Verify M0-M6 controls remain operable by pointer and keyboard, focus remains
  visible, source hover/focus reaches the right local input or provider slot,
  the M4 names and source detail do not clip, and the operation remains legible.
- Verify no page-level horizontal scrolling, no layout regression in all three
  expanded slots, and no console error.
- Treat any density or geometry issue not caused by the new semantic content as
  later UI-stabilization work, not scope for this checkpoint.

**Verification:** Component behavior and real-browser checks prove the complete
Mindscape -> target preparation -> whole-party recalculation -> visible Result
loop while preserving the committed UI structure.

---

## System-Wide Impact

- **Interaction graph:** One existing Mindscape event resolves target content,
  replaces one setup, passes the whole-party completeness gate, recalculates all
  Agents, and updates the currently viewed Result projection.
- **Error propagation:** There is no external failure path. Invalid or
  incomplete setup state continues to produce a null party Result and empty
  Result presentation.
- **State lifecycle risks:** The main risks are continuously overwriting a
  direct Disc edit, resetting the other two Agents, or resolving the destination
  pool with the wrong prepared 2-piece. U1 tests own these boundaries.
- **Calculation risks:** Equality-only Mindscape checks could drop cumulative
  effects; broad action labels could leak M4 to every EX; adding Stun extensions
  could incorrectly produce +5s. U2 tests require minimum-level gating, exact
  action scope, and one applied non-stacking source.
- **Presentation risks:** A generic source locus could highlight Core instead of
  Mindscape, and cross-Agent Mindscape sources could lose provider identity. U3
  extends the existing source-link grammar rather than adding a new system.
- **API surface parity:** No API, CLI, persistence, external consumer, or other
  interface exists.
- **Integration coverage:** State tests isolate preparation; calculation tests
  prove numeric and recipient behavior; component/browser checks prove the
  user-visible event chain and source disclosure.
- **Unchanged invariants:** Party and focus behavior, candidate membership,
  direct-edit preservation until a preparation event, target-only Mindscape and
  pool reset, Rank defaults, complete-selection gating, derived Result, and the
  current UI composition remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Guide practice does not define a deterministic zero-substat setup | Keep candidate breadth, but author the bounded full/non-limited first choices from current stat pressure and the prepared zero-hit policy |
| M1's setup reset obscures its direct +10% calculation | Test an identical-equipment calculation delta separately from the end-to-end prepared-state delta |
| M4 source text is mistaken for a raw action coefficient | Treat it as the source-stated increase on two existing actions; keep base multipliers and final damage absent |
| Cross-Agent buffs create inappropriate partner damage rows | Assert current recipients and explicit non-recipients; keep Dialyn/Lucia fixed setup roles |
| Non-stacking Stun extensions appear additive | Resolve one highest applied value and source before projection |
| Semantic content triggers opportunistic UI changes | Limit CSS to source linking and defer unrelated layout, density, and geometry findings |

There are no runtime, network, package, migration, or external-service
dependencies.

---

## Authority Self-Review

- **`docs/setup-workbench-product-contract.md`:** The plan starts from a visible
  input and Result, preserves cumulative current selections, prepared
  initialization, target-only Mindscape reset, current-pool use, other-setup
  preservation, all-Result recalculation, the complete-selection gate, and the
  three display surfaces. It authors first choices and never ranks at runtime.
- **`docs/source-fact-boundary.md`:** Every retained value changes the current
  prepared setup, metric, action difference, or operation. Excluded clauses have
  no current consumer. No evidence, provider, wording, ordinary table, or
  speculative field survives research.
- **`docs/zzz-formula-mechanics.md`:** CRIT Rate remains a capped stat; regular
  DMG Bonus and Sheer DMG Bonus stay separate; Lucia M2 does not become Sheer
  Force; Stun duration remains an operation; raw/base action coefficients and
  final output remain excluded.
- **`docs/zzz-game-vocabulary.md`:** Source owner, recipient, enemy operation,
  trigger action, affected action, Mindscape level, canonical action, and local
  EX form remain separate only where they change the Result. M3/M5 do not become
  a general skill-level model.
- **`docs/workbench-ui-design-rules.md`:** Mindscape remains only in Setup,
  receives an explicit source presentation, and keeps local/cross-Agent source
  linking. Action differences stay under the owning Result row, the existing
  gauges remain source-defined, Attribute restriction copy remains absent, and
  no layout stabilization enters this checkpoint.

The review found no authority conflict and no unresolved product or mechanics
decision that blocks implementation.

---

## Documentation / Operational Notes

- The five permanent authorities require no change; this plan implements their
  current meanings.
- Implementation, tests, production build, browser verification, and final
  review are complete; this plan is `completed`.
- Do not create an ADR, source record, research archive, changelog, migration,
  monitoring, CI, or rollout artifact.

---

## Sources & References

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/setup-workbench-product-contract.md`
- `docs/source-fact-boundary.md`
- `docs/workbench-ui-design-rules.md`
- `docs/zzz-formula-mechanics.md`
- `docs/zzz-game-vocabulary.md`
- `docs/plans/2026-08-01-001-feat-yixuan-setup-workbench-plan.md`
- `docs/plans/2026-08-03-001-feat-integrated-party-workbench-plan.md`
- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
