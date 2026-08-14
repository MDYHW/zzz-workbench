---
date: 2026-08-14
topic: harumasa-qingyi-vertical
status: active
origin: docs/brainstorms/2026-08-14-harumasa-qingyi-vertical-requirements.md
---

# Asaba Harumasa And Qingyi Vertical Plan

## Summary

Extend the existing typed content, preparation, Agent-local calculation, and
responsive portrait paths for Harumasa and Qingyi. The implementation reuses
current whole-package equipment, selected-pressure, provider/recipient, action-
scope, and two-Stun allocation mechanisms; it introduces no optimizer,
catalogue, combat-state model, or new UI surface.

## Problem frame

Version 2.8 expansion next needs two current Agents whose visible setup and
Result meanings are already settled in the origin requirement. The remaining
work is to admit those meanings through established consumers without allowing
Harumasa's action-limited effects or Qingyi's local candidate/allocation policy
to broaden existing behavior.

## Authority and settled contrasts

- Permanent owners: `docs/setup-workbench-product-contract.md`,
  `docs/source-fact-boundary.md`, `docs/zzz-formula-mechanics.md`,
  `docs/zzz-game-vocabulary.md`, and `docs/workbench-ui-design-rules.md`.
- Local owner:
  `docs/brainstorms/2026-08-14-harumasa-qingyi-vertical-requirements.md`.
- Closest consumers: Ellen/Corin for Harumasa's crit-capable general damage and
  action projection; Lycaon/Lighter/Pulchra for Qingyi's Impact, Daze, King,
  personal-contribution, and Stun allocation paths; Nicole/Astra/Pan for the
  retained external Quick Assist opportunity; Spectral broad pressure for the
  M1 lifecycle.
- Preserved contrasts: Harumasa Cordis/Potential/Zanshin scopes never become
  broad pressure; Qingyi's Nicole-inclusive Astral context does not broaden the
  current Astra/Pan helper used by focused damage Agents; Sheer recipients stay
  outside Qingyi M1 general-damage pressure; current Trigger/Lycaon/Pulchra/Ju
  Fufu allocation outcomes remain local and unchanged.
- Applicable learning:
  `docs/solutions/workflow-issues/prevent-secondary-requirements-from-validating-themselves-2026-08-12.md`.

## Scope boundaries

- No Voltage, Electro Quiver, Shock, resource, rotation, uptime, raw damage,
  raw Daze, shield, event-Energy, or final-output model.
- No runtime equipment score, substat farming optimizer, dynamic main-stat
  recommendation, holder registry, or named-party priority matrix.
- No holder-specific passive-copy abstraction for excluded partial packages.
- No UI redesign or per-Agent test suite; extend shared mechanism and flow
  families only.
- No content beyond the permanent Version 2.8 admission boundary.

## Key technical decisions

- Keep all new retained facts and compressed equipment copy in current typed
  content maps; action and recipient activation stays in Agent-local calculation
  and provider phases.
- Give Qingyi a local Nicole/Astra/Pan contextual-Astral predicate. Do not change
  the stronger repeated-Quick-Assist helper that currently serves other Agents.
- Reuse the existing preparation order. Qingyi enters the current Focus/King
  and King/Astral passes; extend the bounded no-Astral Shockstar fallback only
  for the Qingyi/Dialyn case, without a new Stun scoring system.
- Register Harumasa and Qingyi through separate Agent-local calculation modules;
  shared orchestration changes only to route their existing context and clauses.
- Treat AE8 as one reducer journey across party re-application: the two-Stun
  allocation and external-provider Astral context require different three-Agent
  parties and cannot be proven by one static party.

## Implementation units

- U1. **Typed content and prepared representatives**

**Goal:** Admit both identities, Zanshin Herb Case, candidate pools, retained
values, complete full/non-limited representatives, main-stat choices, effective
substats, and initial ATK inputs with zero supplied substat counts.

**Requirements:** R1-R2, R4-R15, R28-R30; F1-F2; AE1-AE4.

**Dependencies:** None.

**Files:**
- Modify: `src/workbench/content/types.ts`
- Modify: `src/workbench/content/agents.ts`
- Modify: `src/workbench/content/engines.ts`
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/content/setup-options.ts`
- Modify: `src/workbench/content/representatives.ts`
- Modify: `src/workbench/content/retained-values.ts`
- Modify: `src/workbench/calculation/initial-atk.ts`
- Test: `src/workbench/content/equipment-effects.test.ts`
- Test: `src/workbench/preparation.test.ts`
- Test: `src/components/AgentSetup.test.tsx`

**Approach:** Follow current Agent and equipment maps. Preserve full and non-
limited pools as independent authored choices, keep every representative count
at zero, and expose only compressed complete-package copy. Zanshin needs only
the structured facts used by Setup and Result; Severed remains excluded rather
than creating holder-specific passive text. Use the origin's exact retained
level-60 inputs and W1-W5 Zanshin values without inferring missing progression.

**Patterns to follow:** `src/workbench/content/engines.ts` Cordis and Ice-Jade;
`src/workbench/content/representatives.ts` Ellen/Corin and Lycaon/Pulchra;
`src/workbench/content/setup-options.ts` crit-capable damage and selected-King
substat patterns.

**Test scenarios:**
- Happy path: full Harumasa prepares Zanshin with Shadow/Branch and three ATK%
  mains; non-limited prepares Brimstone with CRIT/Electric/ATK mains.
- Happy path: both Qingyi pools prepare King/Shockstar with CRIT/Electric/Impact;
  full uses Ice-Jade and non-limited uses Steam.
- Edge case: every prepared substat count is zero while effective choices remain
  present and finite.
- Integration: selected and candidate Zanshin descriptions expose the same
  accessible complete package, while non-limited contains no limited S-Rank.

**Verification:** Every candidate and representative is complete, deterministic,
pool-local, and expressible through existing Setup controls.

- U2. **Qualification, candidates, preparation, and lifecycle**

**Goal:** Add exact Additional qualification, Qingyi contextual Astral, selected-
King pressure, and current two-Stun participation without changing established
consumers.

**Requirements:** R3, R12-R16, R27; F4; AE7-AE9.

**Dependencies:** U1.

**Files:**
- Modify: `src/workbench/party-conditions.ts`
- Modify: `src/workbench/candidates.ts`
- Modify: `src/workbench/preparation.ts`
- Test: `src/workbench/party-conditions.test.ts`
- Test: `src/workbench/candidates.test.ts`
- Test: `src/workbench/preparation.test.ts`
- Test: `src/workbench/state.test.ts`

**Approach:** Extend local predicates and current passes. Reconciliation must
continue clearing invalid downstream selections atomically without fallback or
history. A party rebuild composes representative, Focus/King, two-Stun
allocation, contextual candidate, and selected-pressure behavior; a target-only
rebuild preserves every untouched legal direct edit. The no-Astral fallback
keeps current Ju Fufu behavior and adds only the Qingyi/Dialyn outcome that no
existing holder can express.

**Execution note:** Write lifecycle and composed-preparation failures before
changing shared candidate/preparation code.

**Patterns to follow:** Trigger qualification; Lycaon/Pulchra/Ju Fufu
allocation; current Astra/Pan contextual candidate handling without broadening
its focused-damage helper.

**Test scenarios:**
- Happy path: Harumasa is qualified by Stun or Anomaly and Qingyi by Attack or
  same faction; their pair activates both regardless of slot order.
- Edge case: Nicole, Astra, and Pan each add Qingyi Astral; Party Apply without
  the provider rebuilds Qingyi to King with Astral absent, and reapplying a
  provider rebuilds King with membership but no selection history.
- Edge case: Qingyi King exposes Woodpecker and CRIT inputs. Selecting
  Woodpecker, changing to Proto or Shockstar, and reselecting King covers clear,
  incomplete, membership-return, and no-history states while retaining one
  established Stun contrast.
- Integration: with a flexible Stun, Qingyi keeps King and the other takes
  Astral; with Ju Fufu, Qingyi keeps King and Ju uses Shockstar; permutations do
  not change the outcome.
- Integration: with Dialyn, Dialyn keeps King and Qingyi takes Shockstar in
  every slot permutation because Qingyi alone has the legal fallback.
- Edge case: a Qingyi-target rebuild preserves an untouched directly edited Ju
  King duplicate, while a Ju-target rebuild beside rigid Qingyi King prepares
  Ju Shockstar; untouched setup object identity survives both directions.
- Edge case: a Qingyi-target rebuild beside Dialyn King prepares Qingyi
  Shockstar, while a Dialyn-target rebuild preserves an untouched directly
  edited Qingyi King duplicate because Dialyn has no fallback; untouched setup
  object identity survives both directions.
- Covers AE8: one reducer journey re-applies parties to traverse the two-Stun and
  contextual-Astral cases in permanent preparation order.

**Verification:** New local predicates and pressure participate in shared flows
without altering retained Trigger/Lycaon/Pulchra/Ju Fufu or Cissia/Evelyn cases.

- U3. **Agent-local calculation and exact projection**

**Goal:** Implement Harumasa and Qingyi Result metrics, gauges, action scopes,
Mindscapes, equipment projection, provider clauses, and orchestration routing.

**Requirements:** R17-R26; F1-F3; AE3-AE6, AE9.

**Dependencies:** U1, U2. U2 lands candidate, selection, and allocation behavior
before this unit adds Qingyi provider pressure and Result projection.

**Files:**
- Create: `src/workbench/calculation/agents/harumasa.ts`
- Create: `src/workbench/calculation/agents/qingyi.ts`
- Modify: `src/workbench/provider-effects.ts`
- Modify: `src/workbench/calculate.ts`
- Test: `src/workbench/calculate.flows.test.ts`
- Test: `src/workbench/calculate.mechanics.test.ts`
- Test: `src/workbench/calculate.policies.test.ts`
- Test: `src/workbench/state.test.ts`

**Approach:** Mirror current Agent-local observe/resolve/calculate boundaries.
Use action hierarchies for Dash Slash, Chasing Thunder, Basic, Chain, Ultimate,
and Enchanted Basic differences; use existing recipient applicability for
attributes and formula families. Project selected equipment independently from
candidate ranking, and keep authoring-only future substats out of Result.

**Execution note:** Add failing action-scope, threshold/cap, and recipient
contrasts before implementing each Agent module.

**Patterns to follow:** Ellen/Corin/Hugo action and optional DEF/RES projection;
Lycaon/Lighter/Pulchra Impact, Daze, King, provider, and personal-contribution
projection; existing composition/non-stacking tests.

**Test scenarios:**
- Happy path: prepared full/non-limited parties expose the authored CRIT, Impact,
  ATK, Daze, Stun multiplier, and action differences with no hidden substat hits.
- Edge case: Harumasa Core/Potential/M2/M6 and Zanshin/Cordis clauses affect only
  their exact Dash/Chasing/Basic/Chain/Ultimate scopes and Attribute.
- Contrast: Harumasa Potential's broad self ATK and its Dash/Chasing Electric
  RES Ignore are asserted independently so one clause cannot inherit the
  other's scope.
- Edge case: when Qingyi is qualified, Impact-to-ATK is uncapped below 220
  Impact and reaches exactly +600 at or above 220; when unqualified, the
  relationship and ATK contribution are absent on both sides of the threshold.
- Happy path: Qingyi Stun multiplier is 80 at M0 and 108 at M2; M6 affects only
  Enchanted Basic CRIT DMG while its broad RES reduction reaches eligible party
  recipients.
- Integration: Ice-Jade/King/Astral/Proto/Shockstar and selected Attack engines
  obey current non-stacking and exact recipient/action rules.
- Integration: a table-driven engine projection matrix covers Zanshin initial
  versus enabled CRIT and Electric Dash; Brimstone and Starlight broad outputs;
  Heartstring's unused Fire clause; Restrained Basic-only DMG/Daze; Blazing
  Fire/Ice recipients; Hellfire Impact without event Energy; and Precious
  threshold Daze.
- Covers F3 / AE6: M0 -> M1 -> M0 -> M1 with an edited general-damage
  PEN/Puffer input clears without fallback, returns membership without history,
  leaves Result empty until repair, and preserves a Sheer contrast.
- Contrast: Qingyi M1 affects general damage but not Sheer; Harumasa action-
  limited DEF/RES never emits broad candidate pressure.

**Verification:** Result contains only supported current metrics, operations,
gauges, and material action rows; no raw damage/Daze or combat-state output is
introduced.

- U4. **Visible integration, portrait calibration, and browser proof**

**Goal:** Wire both original portrait assets and prove the complete Setup/Result
experience across responsive destinations and state changes.

**Requirements:** R27-R30; F1-F5; AE1, AE4-AE10.

**Dependencies:** U2, U3.

**Files:**
- Modify: `src/components/agentPortraits.ts`
- Test: `src/App.party.test.tsx`
- Test: `src/App.setup.test.tsx`
- Test: `src/App.result.test.tsx`
- Test: `src/components/AgentSetup.test.tsx`
- Test: `src/components/ResultPanel.test.tsx`

**Approach:** Reuse shared Party Editor, Setup, candidate, Result, gauge, and
action-row components. Inspect original assets before calibrating fixed scale,
then head top, then face X. Change no layout unless the shared destinations
cannot render the admitted identities correctly.

**Test scenarios:**
- Happy path: applying Harumasa/Qingyi/third Agent exposes both tabs, complete
  full and non-limited setups, accessible equipment copy, and populated Results.
- Edge case: when Qingyi enters M1 while an affected general-damage recipient
  has edited PEN Ratio or standalone Puffer selected, each invalidated slot is
  visibly setup-incomplete in compact and expanded states, Qingyi and unaffected
  slots stay complete, all Results empty without fallback, and repair restores
  populated Results without resetting unrelated controls.
- Integration: affected selectors open by pointer and keyboard at desktop and
  narrow widths, expose visible focus plus selected/candidate accessible names
  and complete descriptions, apply a choice, and return focus to the owning
  Setup control without clipping or horizontal overflow.
- Integration: desktop and narrow browser checks cover each Agent expanded and
  compact, Party Editor portraits, pool switching, candidate copy, gauges,
  action differences, clipping, overflow, and console state.
- Integration: each new portrait is compared with nearby admitted portraits in
  the same destinations for face readability, connected upper-body composition,
  optical identity weight, and name/control clearance.

**Verification:** Original assets and all required responsive destinations pass
in-app Browser inspection at `127.0.0.1:5173`; DOM tests remain wiring proof only.

- U5. **System review and plan closure**

**Goal:** Verify implementation fidelity, review permanent-authority support,
commit the completed feature, then preserve only its durable milestone.

**Requirements:** All; AE1-AE10.

**Dependencies:** U4.

**Files:**
- Modify: `docs/plans/README.md`
- Delete after committed implementation: `docs/plans/2026-08-14-harumasa-qingyi-vertical.md`

**Approach:** Run focused tests continuously, then the full repository check,
TypeScript/build gates, diff hygiene, and adversarial/correctness/testing review.
Reject findings that lack permanent-owner and current-consumer support. After a
committed implementation preserves this active plan, add one compact milestone
and delete the plan body in a separate closure commit.

**Test scenarios:**
- Integration: one representative prepared journey covers both Agents, pool and
  Mindscape target-only rebuilds, contextual membership, selected pressure,
  allocation, non-stacking, and incomplete Result.
- Regression: all existing shared mechanism tests pass without per-Agent policy
  forks or unintended roster behavior.

**Verification:** Full checks, browser acceptance, final review, feature commit,
and plan-lifecycle closure all succeed with a clean worktree.

## System-wide impact

- **Interaction graph:** typed content feeds candidate membership and prepared
  representatives; preparation feeds selected inputs; provider/recipient phases
  feed Agent-local calculations; shared Setup/Result components render the
  completed state.
- **State lifecycle risk:** Qingyi M1 can invalidate more than one downstream
  input, while contextual Astral changes only through all-party Apply.
  Reconciliation must remain atomic and preserve the target-only versus all-
  party rebuild boundary.
- **Cross-Agent risk:** Focus/King, two-Stun allocation, contextual Astral, and
  selected pressure are adjacent passes. Acceptance requires the composed
  reducer journey, not isolated helper tests.
- **API surface:** only existing internal typed unions/maps and calculation
  routing expand; there is no external API or persistence migration.
- **Unchanged invariants:** incomplete setups yield no Result; party Apply
  rebuilds three slots; pool/Mindscape changes rebuild only the changed Agent;
  direct edits do not reprepare other Agents.

## Risks and stop conditions

| Risk | Mitigation / stop condition |
| --- | --- |
| Qingyi-local Astral changes focused-damage candidates | Use a local predicate and retain Cissia/Evelyn contrast tests. |
| Two-Stun ordering becomes slot-dependent | Test permutations and target-only rebuilds; stop if a new tie requires an unowned score. |
| Action-limited clauses leak into broad pressure | Test exact action/Attribute/formula contrasts before registration. |
| Authoring future hits appear as supplied Result state | Assert zero counts and current Result inputs in both pools. |
| Portrait metadata passes DOM tests but clips visually | Original-asset plus desktop/narrow expanded/compact Browser acceptance blocks closure. |
| Implementation exposes a missing source fact or semantic boundary | Stop before filling it by guide or neighboring-Agent analogy. |

## Sources and references

- Origin: `docs/brainstorms/2026-08-14-harumasa-qingyi-vertical-requirements.md`
- Roadmap: `docs/roadmaps/2026-08-13-vertical-expansion-roadmap.md`
- Current calculation patterns: `src/workbench/calculation/agents/ellen.ts`,
  `src/workbench/calculation/agents/corin.ts`,
  `src/workbench/calculation/agents/lycaon.ts`,
  `src/workbench/calculation/agents/pulchra.ts`
- Current lifecycle patterns: `src/workbench/candidates.ts`,
  `src/workbench/preparation.ts`, `src/workbench/state.ts`
