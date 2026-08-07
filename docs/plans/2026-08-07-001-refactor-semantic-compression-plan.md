---
title: "refactor: Compress first-vertical semantics without changing behavior"
type: refactor
status: completed
date: 2026-08-07
origin: docs/brainstorms/2026-08-06-first-vertical-completion-review-requirements.md
---

# refactor: Compress first-vertical semantics without changing behavior

## Summary

Remove repeated authoring and selected-input interpretation only where the
current Setup, calculation, Result, and interaction consumers express the same
meaning. Bind a requested Setup value to its current source before Agent
formula application inside that Agent's calculation, while keeping
Agent-specific recipient, timing, action, preparation, and source-presentation
decisions explicit. Use the stabilized first vertical as the behavioral and
visual baseline.

---

## Problem Frame

The completed Yixuan, Dialyn, and Lucia vertical contains several kinds of
repetition. Some repeat one fact for two consumers and can drift independently;
others deliberately repeat similar code because the product meanings differ.
Treating both categories as ordinary duplication would either preserve avoidable
maintenance risk or erase decisions that the current workbench needs to expose.

This plan therefore evaluates compression by current purpose and consumer, not
line count or structural uniformity (see origin:
`docs/brainstorms/2026-08-06-first-vertical-completion-review-requirements.md`).

---

## Requirements

- R1. Preserve the completed three-Agent vertical and stabilized UI behavior as
  the baseline unless a permanent authority identifies a contradiction.
- R5. Evaluate calculation, source composition, candidate definition, state
  preparation, and presentation repetition against their current meanings and
  consumers.
- R6. Compress only when every current materially valuable distinction and
  visible behavior remains intact.
- R7. Introduce no universal effect schema, catalogue, registry, evidence
  system, optimizer, or speculative shared abstraction.
- R8. Retain intentional asymmetry for recipient, activation surface, action
  scope, source identity, candidate policy, and preparation lifecycle.
- R9. Preserve the stabilized UI structure, including responsive allocation,
  page and local overflow, keyboard focus, selector states, and source
  highlighting.
- R10. Verify representative desktop and narrow states against the real
  interactive consumer, including current long-content, disclosure, pointer,
  keyboard, selected, fixed, and disabled states.
- R11. Keep tests that protect a user action, lifecycle transition, calculation
  consequence, source relationship, conditional presentation, or accessibility
  behavior.
- R12. Add no test whose only purpose is to lock the new helper, object shape,
  field count, or equivalent content enumeration.
- R15. Keep permanent policy in its existing authority and make this plan the
  only new documentation artifact.

**Origin actors:** A1 product owner, A2 controller, A3 bounded worker.

**Origin flows:** F1 baseline audit; F2 bounded improvement handoff.

**Origin acceptance examples:** AE1 preserves similar-looking effects with
different meanings; AE2 preserves local overflow and interaction behavior;
AE3 retains boundary-bearing tests rather than exhaustive structure tests;
AE4 keeps unsettled semantic decisions with the controller.

---

## Scope Boundaries

- Do not change current candidates, candidate order, authored prepared first
  choices, Rank-default behavior, or effective-substat offerings.
- Do not derive a prepared first choice from candidate position. Candidate
  membership and deterministic initialization remain separate product policy.
- Do not merge the `setMindscape` and `switchPool` lifecycle decisions into a
  generic preparation event. Their explicit preservation of current pool or
  current Mindscape remains reviewable at the reducer boundary.
- Do not generalize Agent calculators, Result metrics, Mindscape effects,
  recipient distribution, action applicability, or surface timing.
- Do not enumerate every selected Setup field as an effect or contribution.
  A valid candidate with no current Result consumer remains a visible required
  choice without creating a Result row or source.
- Do not change UI layout, CSS, typography, responsive allocation, portrait
  calibration, selector presentation, or Result composition.
- Do not implement Party edit or Agent replacement. That work remains deferred
  until another vertical creates the current replacement consumer.
- Do not run a broad unrelated test cleanup. Remove or combine an assertion only
  when the affected refactor leaves another behavior-bearing check for the same
  failure consequence.

---

## Context & Research

### Relevant Code and Patterns

- `src/workbench/content.ts` currently mixes source-owned numeric content,
  compressed Setup copy, authored candidates, prepared first choices, and
  source presentation labels. Its existing Agent-local literals are the pattern
  to retain; the work does not need a content language.
- `src/workbench/calculate.ts` keeps Agent-specific calculators, explicit
  recipient distribution, surface timing, action scope, and atomic source
  breakdowns. It currently reads selected engine, main-stat, substat, and Disc
  values separately from their matching Result sources; that separation is
  repeated interpretation, while the later applicability distinctions are
  consumers rather than accidental duplication.
- `src/workbench/state.ts` already centralizes creation of one prepared Agent
  setup while keeping Mindscape and pool events explicit and target-only.
- `src/components/AgentSetup.tsx`, `src/components/ResultPanel.tsx`, and
  `src/components/PartyWorkbench.tsx` repeat the same pointer/focus channel
  wiring, while each owns different tone mapping, labels, and interactions.
- `src/components/AgentSetup.tsx` repeats the same post-selection focus-return
  lifecycle for W-Engine, Drive Disc, and main-stat selectors while preserving
  three distinct selectors.
- `src/workbench/calculate.test.ts`, `src/workbench/state.test.ts`, and
  `src/App.test.tsx` already cover most required behavior and should be edited as
  characterization coverage rather than replaced with representation tests.

### Institutional Learnings

- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
  requires scope, semantic parity, interaction, and only then visual review.
  Sharing handlers is safe only when selector state, keyboard focus, source
  linkage, stale-link clearing, and the current editing point remain observable.

### External References

- None. This is a product-specific local refactor with strong current authority
  and implementation evidence; framework or industry guidance would not settle
  the semantic boundaries.

---

## Compression Decision Matrix

| Structure under review | Current purpose | Decision | Principal trade-off |
|---|---|---|---|
| Per-engine `defaultRefinement` literals | Apply the product's S-Rank W1 / A-Rank W5 initialization rule | Derive from Rank once; keep selected refinement editable | Less per-engine locality, but removes impossible Rank/default disagreement |
| Full and non-limited W-Engine arrays | Present Agent-authored candidates under current availability | Author one ordered full list and derive non-limited membership from explicit current availability; keep prepared choices authored | Adds one real eligibility fact, but avoids duplicated membership and preserves policy separation |
| Main-stat display string and numeric value | Show a value and calculate from the same level-15 amount | Keep one numeric amount and derive current percent copy | Current admitted main stats are all percentages; a later non-percent consumer must extend the representation then |
| W-Engine and Disc values in Setup copy and calculation | Compare the selected package and calculate its retained effects | Single-author current source-owned numbers; keep display projection and Agent-specific application separate | More structured content, but prevents Setup/Result drift without inventing a universal effect model |
| Separate selected stat-value and source lookups | Let an Agent calculator consume a current numeric Setup input and disclose its exact source | Resolve a requested raw value, unit, and source together after completeness; apply it explicitly in the Agent calculator | Prevents value/source drift, but intentionally leaves candidate-only choices unresolved when no Result asks for them |
| Dialyn and Lucia Energy Regen assembly | Compose the same stat formula and distinct `%` versus `/s` disclosure | Share one Energy-Regen-specific projection helper with explicit source inputs | Formula is less locally repeated; caller-owned source identity and piece location remain visible |
| Pointer/focus source event wiring | Link Setup loci, Result sources, and provider slots | Share one channel-event primitive; keep tone resolution and active-state ownership local | One indirection reduces handler drift but must not hide locus mapping |
| Selector focus restoration | Return the user to the changed setting after a candidate closes | Share one local focus-return hook; keep each selector component separate | Removes repeated lifecycle code without forcing incompatible selector content into one component |
| Mindscape/pool reducer branches | Re-prepare only the target while preserving a different upstream dimension | Keep explicit | Similar object replacement hides two different product events if generalized |
| Candidate list and prepared first choice | Offer competitive choices versus initialize one authored setup | Keep separate | Deriving the first choice would be shorter but would create the prohibited hidden fallback/ranking behavior |
| Agent calculators and effect applicability | Preserve recipient, surface, formula region, and action scope | Keep explicit | Less uniform code is accepted because the asymmetry changes current Results |

---

## Key Technical Decisions

- **One fact may have several projections:** Setup comparison copy, calculation
  inputs, Result aggregates, and atomic source disclosure remain separate
  consumers. Compression removes repeated source values, not those projections.
- **Static derivation is not runtime optimization:** Rank defaults and
  availability filtering are deterministic product rules over authored content.
  They do not rank equipment or feed Result back into preparation.
- **Equipment-specific meaning remains named:** W-Engine and Drive Disc values
  stay source- or Agent-local. Do not replace them with open-ended effect arrays,
  semantic string keys, or optional recipient/surface/action fields.
- **Numeric Setup input resolution is pull-based and calculation-local:** after
  the complete-selection gate, an Agent calculator may request a selected
  W-Engine advanced stat, main stat, or effective substat value, unit, and
  source together. The resolver does not emit contributions for every
  selection and does not decide metric, recipient, surface, action, condition,
  threshold, cap, or formula application. Equipment passive identity remains
  in U2's named facts and Agent-local projections.
- **King of the Summit is the contrary case:** Setup may show the compatible
  fully enabled `+30%` comparison value, while calculation retains the
  threshold-sensitive `15% + 15%` relationship and gauge. Compression must
  derive both from the same source values without flattening the relationship.
- **Energy Regen is the only shared Result assembler in scope:** its percentage
  composition followed by per-second operations is explicitly owned by formula
  authority and currently repeated by two Agents. Other stats remain local
  until another exact current consumer proves the same contract.
- **UI sharing stops below semantic mapping:** share pointer/focus event
  transitions and focus-return mechanics, but retain Result-to-tone mapping,
  provider-Agent resolution, selector ARIA, and App-level pointer-over-focus
  precedence where they are currently readable.
- **Tests defend failures, not abstractions:** no test should import a new helper
  merely to prove that it exists. Existing setup, calculation, interaction, and
  accessibility outcomes remain the verification surface.

---

## Open Questions

### Resolved During Planning

- **Should the candidate list select the prepared setup?** No. Candidate
  membership and authored first choice are separate visible product outcomes.
- **Should all equipment effects become one schema?** No. Only numeric facts
  shared by current Setup and calculation consumers are centralized; timing,
  recipient, action scope, thresholds, and formula application remain explicit.
- **Should the reducer's two preparation branches share one generic action?**
  No. Their small repeated shape carries different preservation rules and is
  cheaper than hiding the lifecycle distinction.
- **Should identical `20% Energy Regen` Disc values become one shared global
  effect?** No. Swing Jazz and Moonlight Lullaby keep distinct source identity
  and piece applicability even when they use the same number.
- **Should current UI calibration tests be removed during this refactor?** No.
  UI stabilization has just established the baseline; this plan only adjusts
  interaction tests directly made redundant or incomplete by shared handlers.
- **Should every visible Setup slot resolve to a Result contribution?** No.
  Result calculators pull only inputs with a current consumer. Dialyn's
  residual Slot 5 choices remain complete, visible Setup choices without a
  personal-damage Result, source row, or zero contribution.

### Deferred to Implementation

- Exact local names and placement of bounded equipment-value resolvers may
  follow the current module style. Implementation must stop if a proposed shape
  requires a generic effect registry or untyped semantic lookup.
- An interaction assertion may be combined only after the implementer proves
  that the remaining test covers the same pointer, focus, and clearing failure.

---

## Implementation Units

- U1. **Derive static setup rules from their owning facts**

**Goal:** Remove repeated Rank defaults, pool membership, main-stat display
values, and canonical source-category labels without changing candidates,
ordering, preparation, or visible copy.

**Requirements:** R1, R5-R8, R11-R12

**Dependencies:** None

**Files:**
- Modify: `src/workbench/content.ts`
- Modify: `src/workbench/state.ts`
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/workbench/state.test.ts`
- Modify: `src/App.test.tsx`

**Approach:**
- Keep one product-owned Rank-to-default-refinement mapping and use it for
  prepared initialization, direct W-Engine selection, and candidate preview.
  Refinement remains a separate editable state value.
- Preserve each Agent's authored ordered full-pool candidate list. Record only
  the current availability distinction required to derive the non-limited
  subset; filtering must preserve authored order.
- Keep `PREPARED_SETUP_BY_AGENT_AND_POOL` and the Yixuan M1+ override explicit.
  Do not use candidate position as initialization policy.
- Format the current admitted percentage main-stat copy from its numeric amount
  instead of storing both forms.
- Use shared canonical presentation labels for Core Passive, Additional
  Ability, EX Special Attack, and Mindscape while preserving owner Agent and
  source locus on every `ResultSource`.

**Execution note:** Use the existing candidate, Rank-default, main-stat, and
source-label assertions as characterization coverage before changing content
representation.

**Patterns to follow:**
- `src/workbench/content.ts` authored Agent candidate order and prepared setup
  literals.
- `src/workbench/state.ts` `createPreparedAgentSetup` and target-local direct
  selection behavior.

**Test scenarios:**
- Happy path: every Agent exposes the same ordered full and non-limited W-Engine
  candidates as the current baseline.
- Happy path: selecting an S-Rank candidate initializes W1 and selecting an
  A-Rank candidate initializes W5 in both state and visible candidate behavior.
- Integration: full/non-limited pool changes still re-prepare only the target
  Agent with the currently authored first choice rather than the first derived
  candidate.
- Happy path: every current main-stat block shows the same signed percentage and
  calculation uses the same numeric amount.
- Integration: local and cross-Agent Result source labels remain the same while
  owner identity and source tones remain distinct.
- Negative: non-limited S-Rank choices such as Hellfire Gears and Weeping Cradle
  remain admitted; Rank alone must not be used as the availability filter.

**Verification:** Candidate membership/order, defaults, prepared setup,
main-stat output, and source labels are byte-for-visible-byte equivalent to the
baseline without tests inspecting the new internal shape.

---

- U2. **Single-author retained equipment values**

**Goal:** Make Setup comparison copy and calculation read the same current
W-Engine and Drive Disc numeric facts while retaining source-specific
application logic.

**Requirements:** R1, R5-R8, R11-R12

**Dependencies:** U1

**Files:**
- Modify: `src/workbench/content.ts`
- Modify: `src/workbench/calculate.ts`
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/workbench/calculate.test.ts`
- Modify: `src/App.test.tsx`

**Approach:**
- Give each current W-Engine one source-owned set of refinement-resolved numeric
  facts. Keep Agent-local named projections for calculation and retain the
  current compressed passive-line formatter for Setup.
- Give each current Drive Disc one source-owned set of current numeric facts.
  Generate the same compressed 2-piece/4-piece comparison lines and use those
  values in calculation without deriving semantics from display strings.
- Move Disc-owned values currently placed under party constants back to their
  Disc source. Party distribution still decides recipients in calculation.
- Preserve separate fields or local relationships only where they change the
  consumer: King's threshold stages, Yunkui's HP/CRIT/Sheer effects,
  Moonlight's piece-specific Energy and squad DMG, action-only W-Engine effects,
  and per-second operations remain distinct.
- Do not create a generic effect list, generic recipient field, generic surface
  enum, or dynamic formula dispatcher.

**Execution note:** Characterize the exact current Setup line and Result delta
for each distinct effect shape before removing the repeated number.

**Patterns to follow:**
- `src/workbench/calculate.ts` existing `yixuanEngineEffects`,
  `dialynEngineEffects`, and `luciaEngineEffects` named outputs.
- `src/components/AgentSetup.tsx` existing W-Engine and Disc compressed
  presentation.

**Test scenarios:**
- Happy path: each admitted W-Engine retains its exact Setup passive values and
  current Result/action/party contribution at the selected refinement.
- Boundary: W1 and one non-default refinement retain the current scaling and
  source identity without presentation/calculation drift.
- Happy path: Yunkui, Woodpecker, Branch & Blade, Swing Jazz, and Moonlight
  retain exact piece effects, source identities, and earliest surfaces.
- Contrary case: King remains `+30%` in compatible Setup comparison while
  calculation applies `15%` below the CRIT threshold and `30%` at/above it with
  the existing gauge relationship.
- Negative: two sources with the same numeric amount remain separate rows when
  their piece, owner, recipient, timing, or action scope differs.
- Negative: no new Result row, action, source, candidate, or explanation copy is
  generated from the new content representation.

**Verification:** Every current equipment selection produces identical Setup
copy, numeric Results, action outcomes, source breakdowns, and candidate
behavior, with each retained source value authored once.

---

- U5. **Resolve source-bound numeric Setup inputs on demand**

**Goal:** Pair a selected W-Engine advanced stat, main stat, or effective
substat value with its current unit and Result source when a calculator requests
that input, without turning all visible choices into effects or contributions.

**Requirements:** R1, R5-R8, R11-R12

**Dependencies:** U2

**Files:**
- Modify: `src/workbench/calculate.ts`
- Modify: `src/workbench/calculate.test.ts`
- Modify: `src/App.test.tsx`

**Approach:**
- Resolve inputs only after `calculateParty` has passed the complete-workbench
  gate. Do not store resolved inputs in `WorkbenchState` or expose them to Setup
  candidate presentation.
- Replace separate value and source lookups with bounded calculator-local
  resolvers for the current W-Engine advanced stat, requested main stat,
  and offered effective substat.
- Return the selected raw value, unit, and source identity rather than a ready
  `Contribution`, Result metric, or generic effect. A percentage input becomes
  an absolute amount only in the Agent formula region that consumes it.
- Preserve source binding: W-Engine source detail uses the current refinement;
  main stats use their Slot locus; and substats use the Agent-local offered-input
  locus.
- Keep selected W-Engine and Disc passive identity, named values, source
  projection, and cross-Agent ownership in U2 and the explicit Agent-local
  calculation. Do not widen the numeric resolver with heterogeneous identity-
  only records or optional effect fields.
- A request for an unselected stat returns no input. Do not create a zero
  contribution or source row, and do not enumerate unrequested Setup fields.
- Keep recipient, Initial/Combat/Fully Enabled placement, action scope,
  conditions, thresholds, caps, conversion, and metric selection explicit in
  the Agent calculators. Qingming action effects, Lucia party contributions,
  and the King threshold remain contrary cases against generic evaluation.

**Execution note:** Preserve the existing value, source-replacement,
cross-Agent, and complete-selection behavior as characterization coverage
before consolidating the paired lookups.

**Patterns to follow:**
- `src/workbench/calculate.ts` current `engineAdvanced`, `mainAmount`,
  `substatAmount`, `engineSource`, `discSource`, `mainSource`, and
  `substatSource` boundaries.
- `src/components/ResultPanel.tsx` current-consumer gate, which remains the only
  generic Result-row admission rule.

**Test scenarios:**
- Integration: changing a consumed W-Engine advanced stat, main stat, or
  effective substat changes the current numeric Result and its source together,
  with no stale source identity.
- Contrary case: changing Dialyn Slot 5 from ATK% to PEN Ratio changes state and
  keeps Setup complete, while Party Result values, rows, and sources remain
  unchanged.
- Boundary: Hellfire Gears at a non-default refinement keeps the fixed advanced
  stat value while the W-Engine source detail identifies the current refinement.
- Negative: an unselected stat, unrequested valid choice, or zero optional
  amount creates no atomic source row.
- Error path: an incomplete required selection still returns no Party Result;
  the resolver must not coerce missing input to zero or bypass completeness.

**Verification:** Every current calculator reads consumed advanced-stat,
main-stat, and effective-substat values with their sources through one bounded
interpretation boundary, while equipment passives, candidate-only choices, and
all Agent-specific applicability remain unchanged.

---

- U3. **Share the Energy Regen Result projection**

**Goal:** Express the product-owned Energy Regen formula and atomic disclosure
once while keeping Dialyn and Lucia source selection explicit.

**Requirements:** R1, R5-R8, R11-R12

**Dependencies:** U2, U5

**Files:**
- Modify: `src/workbench/calculate.ts`
- Modify: `src/workbench/calculate.test.ts`

**Approach:**
- Introduce one Energy-Regen-specific calculation/projection helper that
  receives the Agent base, explicit initial percentage contributions with
  sources, and explicit later per-second operations with sources.
- Build W-Engine advanced-stat and Slot 6 contribution inputs from U5's
  source-bound numeric values. Disc and per-second passive inputs continue to
  come from U2's named equipment facts and explicit Agent-local source
  projection; the Energy helper does not select equipment or infer sources.
- Compose percentages into the base first, add `/s` operations afterward, and
  return the existing Initial/Combat/Fully Enabled values and breakdown shape.
- Dialyn remains responsible for selecting W-Engine advanced stat, Slot 6,
  2-piece Disc, and W-Engine `/s` sources. Lucia remains responsible for its
  W-Engine advanced stat, Slot 6, 4-piece Disc, and W-Engine `/s` sources.
- Do not generalize other percentage stats or create a generic Result-metric
  builder.

**Execution note:** Preserve the current aggregate and breakdown assertions as
formula characterization before extraction.

**Patterns to follow:**
- `docs/zzz-formula-mechanics.md` Energy Regen composition order.
- `src/workbench/calculate.ts` `percentageContribution`,
  `perSecondEnergyContribution`, `surfaces`, and `withoutZero` helpers.

**Test scenarios:**
- Happy path: Dialyn retains exact Initial percentage composition and adds the
  selected W-Engine `/s` operation at Combat and Fully Enabled.
- Happy path: Lucia retains exact Initial percentage composition and the same
  later-operation behavior.
- Integration: Dialyn's 2-piece source and Lucia's 4-piece source remain
  correctly labeled and linked after sharing the projection.
- Boundary: an Energy Regen main-stat edit changes Initial while a per-second
  W-Engine edit changes only the later aggregate and its `/s` atomic line.
- Negative: a percentage source is never displayed as `/s`, a per-second source
  is never multiplied by Energy Regen percentage, and no one-time Energy
  operation enters the row.
- Edge case: zero-valued optional contributions remain absent without removing
  the Energy Regen metric when another current contribution or value exists.

**Verification:** Dialyn and Lucia retain exact two-decimal surface values and
distinct source disclosure while the formula assembly exists in one place.

---

- U4. **Share source interaction and selector focus mechanics**

**Goal:** Remove repeated pointer/focus channel wiring and selector focus-return
state without changing source mapping, accessibility, or stabilized layout.

**Requirements:** R1, R5-R8, R9-R12

**Dependencies:** U1-U3, U5

**Files:**
- Create: `src/components/sourceInteraction.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/AgentSetup.tsx`
- Modify: `src/components/PartyWorkbench.tsx`
- Modify: `src/components/ResultPanel.tsx`
- Modify: `src/App.test.tsx`

**Approach:**
- Share the pointer-enter/leave and focus/blur channel event primitive and its
  TypeScript contract across Setup targets, Result source rows, and Agent slots.
- Keep App-level active-tone state, pointer-over-focus precedence, and reset on
  viewed-Agent changes explicit.
- Keep Result-specific source-to-tone/provider resolution and each component's
  active class grammar local. The shared primitive must not infer a locus from
  text or source identity.
- Replace the three repeated selector focus-return effects with one bounded
  hook local to Setup interaction. W-Engine, Drive Disc, and main-stat selector
  markup, ARIA names, candidate content, open state, and selection dispatch
  remain separate.
- Change no CSS or geometry. Remove or combine only an assertion whose failure
  consequence is already covered by a stronger local, cross-Agent, keyboard,
  or focus-return behavior test.

**Execution note:** Preserve the current source and selector interaction tests
before extraction, then simplify only proven duplicates after the shared code
passes those behaviors.

**Patterns to follow:**
- `src/App.tsx` pointer-over-focus active-tone resolution.
- `src/components/ResultPanel.tsx` current provider Agent and source-locus tone
  mapping.
- `src/components/AgentSetup.tsx` current post-selection effect-based focus
  restoration.

**Test scenarios:**
- Interaction: pointer hover activates a local Setup/Result pair and clearing
  pointer state restores any still-focused source rather than clearing it.
- Interaction: keyboard focus alone activates the same pair and blur clears it.
- Cross-Agent: a Dialyn or Lucia source in Yixuan Result highlights the provider
  slot without expanding or changing it.
- Integration: W-Engine, Drive Disc, and main-stat candidate selection each
  close only their selector and restore focus to the changed setting.
- Lifecycle: changing viewed Agent clears obsolete source tone and shows no
  stale highlight; replacing equipment retains the locus tone while replacing
  source text and values.
- Accessibility: roving Agent-slot navigation, compact-overview close/re-entry,
  selected/fixed/disabled states, and accessible selector names remain intact.
- Negative: no test asserts the helper's object shape, export count, hook name,
  or number of consumers.

**Browser verification:**
- Verify Yixuan, Dialyn, and Lucia expanded states and the equal compact overview
  using pointer and keyboard entry/exit.
- Exercise W-Engine, both Disc roles, main stats, Mindscape, substats, Result
  disclosure, local source linking, and cross-Agent source linking.
- Confirm focus return after each selector kind, no stale highlight after Agent
  or equipment changes, no page-level horizontal overflow, the accepted local
  Result-table overflow behavior, and no console errors at representative
  desktop, intermediate, and narrow widths.

**Verification:** All automated checks, production build, and real-browser
behavior match the stabilized checkpoint with no CSS diff.

---

## System-Wide Impact

- **Interaction graph:** The existing setup edit -> reducer -> completeness gate
  -> pure party calculation that pulls requested source-bound numeric inputs ->
  viewed Result flow remains unchanged. Only repeated static derivation, paired
  value/source lookup, Energy projection, and UI event plumbing move behind
  bounded helpers.
- **Error propagation:** There is no external error path. Invalid selections
  continue to return the same state, and incomplete setup continues to produce
  no Result.
- **State lifecycle risks:** Deriving candidate subsets could accidentally
  change order or conflate membership with preparation; Rank derivation could
  reset an edited refinement; interaction extraction could return focus after a
  non-selection event. Unit-specific integration tests own these risks.
- **Calculation risks:** A generalized equipment representation could flatten
  King thresholds, move an effect to the wrong surface, or merge sources with
  equal numbers. An eager resolver could also invent contributions for valid
  candidate-only choices. The plan retains demand-driven Agent/source-specific
  application and tests both contrary cases.
- **Presentation risks:** Shared event handlers could hide tone or provider
  mapping errors. Mapping remains local, existing source text remains the
  identity carrier, and browser verification follows interaction tests.
- **API surface parity:** There is no API, CLI, persistence, exported package,
  or external consumer.
- **Integration coverage:** State tests prove candidate and preparation
  behavior; calculation tests prove numeric/surface/source behavior; component
  and browser checks prove the complete user interaction.
- **Unchanged invariants:** Candidate membership and order, prepared first
  choices, target-only Mindscape/pool re-preparation, direct-edit preservation,
  complete-selection gating, cumulative Mindscapes, recipient distribution,
  action scope, source disclosure, conditional Result rows, candidate-only
  inputs with no Result quantity, and stabilized UI geometry remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| A source-value object becomes a universal effect schema by accumulation | Keep source/Agent-specific named facts and explicit projections; stop if implementation requires generic recipient, surface, action, or formula dispatch |
| A numeric Setup resolver eagerly turns every selection into a contribution | Resolve only calculator-requested advanced, main, and effective-substat inputs after completeness; preserve Dialyn Slot 5 as the concrete no-Result contrary case |
| Value and source remain separable inside the new boundary | Return each requested raw value, unit, and current source together and verify selection changes replace both in behavior tests |
| Derived pool membership is mistaken for runtime candidate policy | Author the full Agent-local list and availability facts statically; keep prepared selection separate and explicit |
| Setup copy and calculation become coupled at the wrong level | Share only numeric facts; retain separate display formatting and calculation applicability |
| Energy helper receives the right number with the wrong source | Require explicit source/value contribution inputs and assert Dialyn 2-piece versus Lucia 4-piece disclosure |
| Interaction sharing erases selector differences | Share only event transitions and focus-return lifecycle; keep component markup, ARIA, tone mapping, and dispatch local |
| Test reduction removes a distinct regression guard | Remove only exact duplicate consequences; preserve tier, recipient, candidate, lifecycle, conditional-row, source, and accessibility boundaries |
| Semantic work disturbs the just-stabilized UI | Prohibit CSS/geometry changes and compare the final browser consumer with checkpoint `c75fbff` |

There are no runtime, network, package, migration, or external-service
dependencies.

---

## Authority Self-Review

- **`docs/setup-workbench-product-contract.md`:** The plan preserves authored
  candidates and first choices, Rank defaults, target-only preparation,
  direct-edit behavior, the complete-selection gate, recipient composition,
  and all three Result surfaces. Static derivation does not rank at runtime.
- **`docs/source-fact-boundary.md`:** Compression removes repeated storage of a
  retained current fact but does not remove any distinction that changes a
  choice, calculation, source breakdown, action difference, gauge, or
  interaction. Pull-based resolution starts from a current Result request and
  does not persist unconsumed choices as effects, evidence, or a future schema.
- **`docs/zzz-game-vocabulary.md`:** W-Engine Rank and refinement remain
  separate; Disc piece, source owner, recipient, action, condition, and stat
  meaning remain distinct even when their numbers match.
- **`docs/zzz-formula-mechanics.md`:** Energy Regen keeps percentage composition
  before `/s` operations; King's threshold relation remains explicit; modifier
  regions, surface timing, conversions, and Agent-specific formula exclusions
  remain outside Setup input resolution and are not generalized.
- **`docs/workbench-ui-design-rules.md`:** Current values, available actions,
  selector states, focus return, source mapping/highlighting, compact/expanded
  continuity, responsive behavior, and browser verification remain intact.

No authority conflict or unresolved product question blocks implementation.

---

## Documentation / Operational Notes

- No permanent authority requires amendment; this plan applies their current
  meanings.
- Do not create a learning, ADR, evidence record, migration, changelog, or
  compatibility layer as part of implementation.
- Implementation should be reviewed as a behavior-preserving refactor, with
  semantic content and interaction units kept separable in the diff.

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-08-06-first-vertical-completion-review-requirements.md`
- `AGENTS.md`
- `docs/setup-workbench-product-contract.md`
- `docs/source-fact-boundary.md`
- `docs/zzz-game-vocabulary.md`
- `docs/zzz-formula-mechanics.md`
- `docs/workbench-ui-design-rules.md`
- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
- `docs/plans/2026-08-05-001-feat-mindscape-result-behavior-plan.md`
- `src/workbench/content.ts`
- `src/workbench/state.ts`
- `src/workbench/calculate.ts`
- `src/components/AgentSetup.tsx`
- `src/components/PartyWorkbench.tsx`
- `src/components/ResultPanel.tsx`
- `src/workbench/state.test.ts`
- `src/workbench/calculate.test.ts`
- `src/App.test.tsx`
