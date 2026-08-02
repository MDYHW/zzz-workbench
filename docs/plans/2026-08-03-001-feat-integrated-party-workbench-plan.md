---
title: "feat: Integrate the fixed-party workbench surface"
type: feat
status: active
date: 2026-08-03
origin: docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md
---

# feat: Integrate the fixed-party workbench surface

## Summary

Replace the current detached party rail, target-only setup card, and three simultaneous Result tables with one fixed-party workbench row. One Agent slot is expanded and contains Identity -> Setup -> Result; the other two slots remain compact and identifiable. Selecting a compact slot changes only which Agent is being inspected. It does not change the applied party, Focus, prepared setup, or calculated party state.

This checkpoint preserves the implemented Yixuan edit loop and numeric outputs whose meaning remains valid. It changes the projection and presentation needed to express the current product contract: party contributions appear in each affected Agent's values, Result discloses only new contributions at later surfaces, action differences use common action vocabulary, and gauges appear only for source-defined threshold or cap relationships.

## Problem Frame

The repository already proves a real prepared-setup -> Result -> edit -> recalculation vertical for Yixuan, Dialyn, and Lucia. The gap is not another foundation or a new content vertical. The production page still presents that behavior as detached regions and exposes provisional Result conventions that conflict with the subsequently approved UI direction.

| Layer | Already proven | Gap addressed here |
|---|---|---|
| Party | Fixed ordered Yixuan -> Dialyn -> Lucia party and Yixuan Focus | One expanded selectable inspection slot plus two compact identity slots |
| Setup | Prepared packages; Yixuan pool, W-Engine, and four substat-count edits | Setup belongs inside the expanded slot; partner summaries must be truthful, not false controls |
| State | Direct W-Engine preservation, pool re-preparation, bounded substat edits | Viewed-Agent selection must be view-only and trigger no lifecycle event |
| Calculation | Complete-party Initial, Combat, and Fully Enabled values | Party contributions must be projected onto affected Agents; later surfaces disclose only new sources |
| Result | Metrics, breakdowns, action differences, gauges | One viewed Agent; canonical labels; source-defined gauges only |
| Visual language | Approved controlled-collision and soft-seam exploration | Production direction with setup/result legibility ahead of poster spectacle |

## User-Visible Outcome

On desktop, all three applied party slots occupy one row. The selected slot has a stable expanded width and contains the selected Agent's identity, prepared setup, and Result. The other slots divide the remaining width and stay recognizable through normalized portrait framing and concise identity information. Selecting another slot expands it in place and collapses the previous one.

Yixuan remains the fixed Focus and the only Agent with editable inputs in this checkpoint. Viewing Dialyn or Lucia shows their complete prepared setup summaries and their own Result without pretending fixed values are editable. Returning to Yixuan reveals the pool, W-Engine, and substat counts previously left there.

## Requirements

### Party and view

- **R1 - Integrated party row.** Render exactly one expanded slot and two compact slots in fixed party order. Identity, Setup, and Result live inside the expanded slot; no detached global setup or Result panel remains.
- **R2 - View is not Focus.** Slot selection changes only the viewed Agent. Yixuan remains Focus and the on-field reference for Combat and Fully Enabled assumptions. Viewing a partner cannot prepare, reset, or edit a setup.

### Setup lifecycle

- **R3 - Honest setup surface.** Show Mindscape, pool context, W-Engine/refinement, 4-piece and 2-piece Discs, Slot 4/5/6 main stats, and effective-substat state in setup order. Only supported choices look interactive.
- **R4 - W-Engine selection block.** Show Yixuan's selected W-Engine as one closed selection block. If the current pool has multiple admitted candidates, opening the block lists the alternatives other than the current selection. The one-candidate non-limited pool has no false selection affordance.
- **R5 - Preserve setup lifecycle.** Direct W-Engine edit applies its Rank-default refinement, preserves current Disc sets, main stats, effective-substat offerings and counts, then recalculates. Pool switch completely re-prepares Yixuan and resets counts. A substat edit changes only that count. Incomplete required setup still yields no Result.

### Result calculation and projection

- **R6 - One viewed Result.** Calculate the whole party once, then render only the selected Agent's projection. Viewing another Agent cannot create a separate calculated snapshot.
- **R7 - Three moments.** Initial is the Agent's pre-combat setup without shared effects. Combat adds effects active on entry without further action conditions. Fully Enabled adds every mutually compatible maximum effect the focused party can actually activate.
- **R8 - Incremental disclosure with a complete total.** Initial detail decomposes its aggregate. Each later surface compresses the prior aggregate into one carried-forward subtotal and names only contributions first introduced at the current surface. Individual earlier sources are not repeated, but every displayed aggregate remains arithmetically explainable.
- **R9 - Integrated party contributions.** Effects supplied by another member appear in each affected Agent's metric or modifier. Remove the detached Party Effects strip only after every retained current contribution has a valid destination.
- **R10 - Canonical labels.** Do not expose Agent-local skill, stack, or state names as Result categories. Action differences use common action terms such as Basic Attack, EX Special Attack, and Ultimate. W-Engine and Drive Disc names may remain as sources.
- **R11 - Source-defined gauges only.** Render a gauge only when an authored source defines a threshold or cap and the gauge connects governing input to output. Remove the generic Yixuan 100% CRIT gauge; preserve valid Dialyn and Lucia relationships.

### Presentation and accessibility

- **R12 - Approved visual direction.** Use a mostly neutral base, controlled accents, soft-seam boundary penetration, normalized portraits, compact information symbols, and denser setup/result typography. Identity cannot dominate working space.
- **R13 - Responsive and accessible.** Preserve readable control sizes, keyboard operation, visible focus, semantic labels, and no page-level horizontal scrolling at verified widths.

## Scope Boundary

### In scope

- Production integration of the fixed-party slot structure.
- Local viewed-Agent state independent of the setup reducer.
- Existing Yixuan pool, W-Engine, and effective-substat edits inside the expanded slot.
- Truthful read-only setup summaries for Dialyn and Lucia.
- Result projection changes required by R6-R11.
- Promotion of only the bounded local portraits and identity assets consumed by production.
- Behavior tests and browser-visible verification of the complete loop.

### Explicit non-goals

- Party drafting, filtering, replacement, occupied-Agent rules, Apply, or Cancel.
- Focus editing or changing the current on-field reference from Yixuan.
- Mindscape, refinement, Drive Disc, or main-stat editing.
- Partner pools or partner effective-substat editing.
- New Agents, W-Engines, Discs, formulas, candidate packages, or competitive ranking.
- A catalogue, optimizer, universal equipment/effect schema, dependency engine, evidence/history system, persistence, backend, combat simulator, or final-damage calculator.
- Pixel-copying an exploration page. Approved composition principles and interaction hierarchy are constraints; production dimensions use real content.
- Preserving obsolete component boundaries or tests merely to minimize the diff.

### Deferred follow-up

- Applied/draft party editing and its complete lifecycle.
- Additional target Agents and authored setup packages.
- Additional editable inputs after each has a current candidate set and consumer.
- Downstream equipment dependency behavior unless an explicitly admitted current item changes candidate availability or invalidates a preserved selection.

## Authority and Context

Permanent product meaning remains owned by:

- AGENTS.md
- docs/setup-workbench-product-contract.md
- docs/source-fact-boundary.md
- docs/zzz-formula-mechanics.md
- docs/zzz-game-vocabulary.md
- docs/workbench-ui-design-rules.md

Supporting records used by this checkpoint:

- docs/plans/2026-08-01-001-feat-yixuan-setup-workbench-plan.md
- docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md
- docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md
- design-explorations/soft-seam-integrated-final.html

## Technical Decisions Needed Now

### Viewed Agent stays outside setup lifecycle state

Own viewedAgentId in App or the integrated party component. Do not add VIEW_AGENT to src/workbench/state.ts. That would mix a reversible view preference with product-owned preparation events and increase reset risk.

### One party calculation produces Agent-owned views

Keep the pure whole-party calculation. Refine its output so every visible effect has an affected Agent consumer, a surface, and a public source label. The UI selects one projection; it never calculates cards independently.

The rejected alternative is calculating only the expanded Agent. Party context and Focus govern Combat and Fully Enabled, so isolated card calculation would conceal dependencies and invite inconsistent totals.

### Calculation output owns incremental source novelty

Return aggregate values for all three surfaces while distinguishing contributions first introduced at each surface. Initial exposes its normal decomposition. Combat and Fully Enabled expose one prior-surface subtotal plus only the current surface's new sources, so the detail still sums to the aggregate without repeating earlier source names. Do not infer novelty by comparing formatted values, rounded totals, DOM labels, or CSS visibility.

### Replace provisional global collections

Move action rows into the owning AgentResult projection. Remove partyEffects only after every retained contribution has an Agent-owned destination. Replace provisional action labels with the minimum common-action rows required by the current two W-Engines and party effects. Do not wrap the Party Effects strip into a collapsed panel.

### Reuse selected local assets without an asset system

Copy only consumed portraits and current identity symbols from design-explorations/assets into production paths. Keep per-Agent focal-position values close to current Agent content. Do not introduce runtime image processing, a registry, or imports from exploration CSS.

## Pre-Implementation Knowledge Dependencies

These are current-vertical facts required by visible Setup or Result. They must be resolved before the named unit begins; they do not justify broad content research or a reusable evidence system.

1. **Current source/action mapping, before U1.** For each retained Agent-owned effect, confirm its public category, affected Agent outputs, common actions, earliest surface, and explicit non-recipients. Do not retain Darkbreaker, Five-Star Service Hotline, External Line, Lost Nocturne, or Grandmaster merely because the current calculation contains those strings.
2. **Dialyn enemy-facing outputs, before U1.** Confirm the earliest surface and Result owner for the current Stun DMG Multiplier and Stun-duration contributions. If either cannot be settled from current authorities and admitted facts, U1 stops and returns that exact fact gap to the controller; the checkpoint cannot pass by silently dropping the row or shipping the detached Party Effects strip.
3. **Partner effective substats, before U3.** Author only Dialyn's and Lucia's current competitive effective-substat offerings and their prepared zero-count state. These fixed facts complete the partner Setup summaries; they do not create partner editors or a universal candidate model.
4. **Current identity symbols, before U5.** Confirm which semantically correct Dialyn and Lucia symbols exist locally. A missing decorative symbol may fall back to an accessible text label; it does not justify external asset research or block the interaction.

## Implementation Units

### U1. Align the Result projection

**Goal:** Make pure calculation output sufficient for one integrated Agent Result without global party effects or repeated explanation.

**Requirements:** R6-R11

**Files:**

- Modify src/workbench/content.ts
- Modify src/workbench/calculate.ts
- Modify src/workbench/calculate.test.ts

**Work:**

- Replace prohibited local source strings with public categories or common actions.
- Associate every party contribution with affected Agent output and earliest surface.
- Keep aggregates for all surfaces. Later breakdowns expose one carried-forward subtotal plus only newly introduced sources.
- Replace All Sheer actions and Core-supported actions with the minimum material common-action distinctions.
- Put current action rows inside the owning AgentResult instead of a global collection.
- Remove Yixuan's generic CRIT gauge; retain source-defined Dialyn and Lucia gauges.
- Delete partyEffects after all current values have destinations.
- Preserve current numeric baselines and edit deltas unless semantic remapping exposes a genuine formula defect; justify any numeric change from an authority or admitted current fact.

**Behavior tests:**

- Initial contains no shared-party contribution.
- Combat includes only entry-active additions; its detail sums the prior subtotal and newly active sources to the aggregate.
- Fully Enabled includes all mutually compatible maxima; its detail sums the prior subtotal and newly active sources to the aggregate.
- Every current party contribution has positive assertions for intended recipients and negative assertions for non-recipients, surfaces, attributes, and common actions where applicable.
- Initial sources do not repeat in later details.
- Each W-Engine yields only material common-action distinctions.
- No Result label exposes local skill/state/stack names.
- No Yixuan generic CRIT gauge exists; Dialyn and Lucia gauges preserve input, threshold/cap, and output.
- Incomplete required setup still returns null.

### U2. Add view-only selection and the integrated slot shell

**Goal:** Establish the approved interaction geometry without changing setup state.

**Requirements:** R1, R2, R6, R13

**Dependencies:** U1's Agent-owned Result and action contracts must be settled before U2 connects real Result children. The slot shell and view-only state may be developed independently before that connection.

**Files:**

- Modify src/App.tsx
- Create src/components/PartyWorkbench.tsx
- Delete src/components/PartyRail.tsx
- Modify src/App.test.tsx

**Work:**

- Initialize viewedAgentId to Yixuan.
- Render all slots in one ordered row with one expanded slot and two compact buttons.
- Keep the Yixuan Focus marker independent from expanded state.
- Put Identity, Setup, and Result children inside the expanded slot.
- Normalize portrait framing through current per-Agent focal positions.
- Remove detached page-level party/setup/result sections.

**Behavior tests:**

- Yixuan is initially expanded.
- Selecting Dialyn expands Dialyn, compacts Yixuan, preserves party order and Yixuan Focus.
- Selecting Lucia and returning to Yixuan preserves pool, engine, and all counts.
- Slot selection does not dispatch setup lifecycle events or change calculation inputs.
- Exactly one slot and one Agent Result are expanded.

### U3. Render truthful viewed-Agent Setup

**Goal:** Put the complete setup sequence into the expanded slot while exposing only genuine controls.

**Requirements:** R3-R5

**Dependencies:** U2 and partner effective-substat authoring

**Files:**

- Modify src/workbench/content.ts
- Modify src/workbench/calculate.ts
- Modify src/workbench/calculate.test.ts
- Create src/components/AgentSetup.tsx
- Delete src/components/TargetSetup.tsx
- Modify src/App.tsx
- Modify src/App.test.tsx

**Work:**

- Render Mindscape/pool, W-Engine/refinement, both Disc sets, three main stats, and effective-substat state in top-to-bottom order.
- Reuse existing Yixuan pool dispatch, direct engine edit, and four bounded count controls.
- Use one closed W-Engine selection block; list only alternative candidates in the full pool.
- Add the bounded partner effective-substat offerings and zero counts to current content, and render Dialyn/Lucia as complete static summaries with no disabled selector chrome.
- Treat the fixed complete partner facts as part of the calculation completeness gate without introducing editable partner state.
- Keep refinement visible as the engine's Rank default, not a control.

**Behavior tests:**

- Full pool keeps the selected engine in the closed block and lists the one current alternative; direct selection preserves counts and prepared equipment.
- Non-limited pool shows Cauldron W5 without a false dropdown.
- Pool switching selects its authored first engine and zeros all counts.
- Each count remains independently editable from 0 through 36.
- Dialyn and Lucia show authored effective-substat offerings at zero alongside every other required category, and expose no edit controls.
- Every interactive visual has a real state transition.

### U4. Render one authority-conformant Result beside Setup

**Goal:** Explain the selected Agent's party-aware values across three surfaces without duplicate information.

**Requirements:** R6-R11

**Dependencies:** U1-U3

**Files:**

- Modify src/components/ResultPanel.tsx
- Modify src/App.tsx
- Modify src/App.test.tsx

**Work:**

- Accept one AgentResult projection containing its own relevant current action rows.
- Align Initial, Combat, and Fully Enabled as distinct moments.
- Show only setup-relevant metrics for the viewed Agent.
- Keep aggregate values in every surface; Initial detail is atomic, while later detail combines one carried-forward subtotal with only new sources.
- Put supplied party contributions into recipient rows and remove Party Effects.
- Render only common-action distinctions that change current Result.
- Render only calculation-supplied source-defined gauges.
- Render an empty Result immediately when calculation returns null.
- Make each metric label the accessible disclosure control. Expanding the metric reveals its surface breakdown, applicable common-action aggregates with sources, and any linked gauge directly beneath that metric.

**Behavior tests:**

- Each slot selection shows only that Agent's relevant Result.
- Surface meanings and aggregates remain stable across view changes.
- Later breakdowns contain a carried-forward subtotal, omit earlier source labels, and still sum to the displayed aggregate.
- Party values appear under recipients; no global Party Effects region exists.
- Full/non-limited engine paths show their current common-action differences.
- Gauges communicate governing input, threshold/cap, and output.
- A metric label exposes its disclosure state and keeps the three aggregate cells visible when collapsed.
- Expanded sources, common-action aggregates, and a linked gauge stay beneath their owning metric.
- Null calculation removes prior Result content.

### U5. Apply the visual direction and verify the browser loop

**Goal:** Bring production to the approved ZZZ-adjacent direction while preserving working space.

**Requirements:** R12, R13 and all earlier behavior

**Dependencies:** U2-U4

**Files:**

- Modify src/app.css
- Create src/assets/agents/yixuan.png
- Create src/assets/agents/dialyn.webp
- Create src/assets/agents/lucia.webp
- Create or promote only consumed files under src/assets/identity/
- Modify src/App.test.tsx only for behavior/accessibility, never CSS structure assertions

**Work:**

- Keep the three-slot one-row composition at desktop widths. At the phone breakpoint, stack slots in fixed party order; the expanded slot becomes full width and stacks Identity, Setup, and Result internally, while compact slots remain full-width identity buttons.
- Use the selected soft-seam composition direction: narrow Identity, touching Setup/Result, restrained boundary penetration.
- Keep expanded width stable at desktop; compact slots divide the remaining width.
- Use full-color artwork in the expanded identity and a neutral compact treatment without implying a Mindscape default.
- Keep names clear of faces, make the expanded face larger, and normalize crops by face/body center.
- Put rank, attribute, and specialty in a wide, low, translucent dark row.
- Give both Disc sets, main stats, and substats sufficient height and type scale.
- Reduce stylistic intensity from Identity toward Result.
- Preserve focus indicators, hit areas, accessible names, and keyboard order.
- At the phone breakpoint, render each metric as labeled Initial, Combat, and Fully Enabled rows rather than squeezing three surface columns.

**Automated verification:**

- npm test
- npm run build
- npm run check
- git diff --check

**Browser verification matrix:**

Inspect at least 1440x900, 1280x720, and 390x844 with no page-level horizontal scroll.

1. Yixuan expanded; partner slots compact; Identity leaves sufficient Setup/Result space.
2. Dialyn then Lucia expanded; compact crops remain consistent; Yixuan Focus stays clear.
3. Full-pool engine list opens in place; selection closes; changed Result remains adjacent.
4. Non-limited pool shows one engine without a false selector and resets counts.
5. Pool switching re-prepares; direct engine editing preserves nonzero counts.
6. Substat controls at 0, an intermediate value, and 36 remain readable and bounded.
7. Three surfaces remain distinct without repeated source clutter or unexplained aggregates.
8. Dialyn/Lucia gauges remain legible; no generic Yixuan CRIT gauge appears.
9. Keyboard traversal follows slots -> pool -> engine -> substats -> Result disclosures.
10. The full interaction loop emits no console errors.

## System-Wide Impact

- **State:** WorkbenchState and its event semantics remain the editable input source. One transient viewed-Agent value is added above domain state.
- **Calculation:** Result remains pure and derived. Its shape changes from a global party-effects list plus three display-ready cards to Agent-owned projections.
- **Presentation:** PartyRail and TargetSetup are replaced by integrated-slot responsibilities. ResultPanel becomes a single-Agent renderer.
- **Failure behavior:** The completeness gate continues to return null; no expanded view may cache prior Result.
- **Migration:** No persisted data or API exists. This is a coherent pre-stable breaking cleanup; no compatibility layer is needed.
- **Testing:** Assert state transitions, values, visible meaning, and accessibility. Do not add tests for wrapper counts or class names.

## Risks

| Risk | Mitigation |
|---|---|
| Viewed Agent is confused with Focus | Label Focus independently and prove view changes leave setup and Focus unchanged. |
| Partner summaries resemble disabled controls | Use non-interactive semantics/styles and assert absence of controls. |
| Incremental disclosure makes totals seem non-cumulative | Show one carried-forward subtotal so each expanded surface explains its aggregate without repeating prior source names. |
| Party contribution migration drops or leaks a current effect | Test intended recipients and explicit non-recipients before deleting partyEffects. |
| Common action labels erase a material distinction | Retain rows only when current setup produces a different Result for that action. |
| Poster treatment consumes working space | Keep Identity narrow and subordinate to Setup/Result, recalibrating its width from real content at every verified viewport. |
| Exploration assets become a content system | Promote only consumed files and reference them directly from current content. |

## Success Criteria

- The user can identify the applied party and Focus, select any slot, and understand the expanded slot as that Agent's Setup and Result.
- Existing Yixuan edit events retain their valid numeric consequences and lifecycle semantics.
- Dialyn and Lucia are inspectable as complete prepared Agents without false controls.
- Each viewed Result is party-aware across Initial, Combat, and Fully Enabled.
- No detached Party Effects region, repeated later-surface source list, unexplained aggregate, prohibited local source label, or generic Yixuan CRIT gauge remains.
- Tests, build/type gates, desktop/phone browser checks, keyboard checks, and console inspection pass.

## Execution Governance

The controller owns authority interpretation, product questions, acceptance criteria, final review, documentation, and commit decisions. A delegated implementation task may change only the listed production/test files, report evidence, and stop when a product decision or new domain fact is required. Exploration artifacts are references; an implementation task cannot declare a new product direction from them.

## Documentation Notes

- Permanent authorities need no revision unless implementation reveals a genuine contradiction.
- Update this plan's status only after automated and browser verification pass.
- Do not create an ADR, evidence archive, generic design system, CI workflow, deployment configuration, or monitoring layer.
- Keep this plan uncommitted until controller/user review is complete.

## Sources

- AGENTS.md
- docs/setup-workbench-product-contract.md
- docs/source-fact-boundary.md
- docs/zzz-formula-mechanics.md
- docs/zzz-game-vocabulary.md
- docs/workbench-ui-design-rules.md
- docs/plans/2026-08-01-001-feat-yixuan-setup-workbench-plan.md
- docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md
- docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md
- design-explorations/soft-seam-integrated-final.html
