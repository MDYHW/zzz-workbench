---
title: Agent Slot, Setup, and Result UI Requirements
date: 2026-08-02
status: confirmed
authority: supporting-requirements
---

# Agent Slot, Setup, and Result UI Requirements

## Ownership

This records confirmed interaction and presentation decisions. It is not a
sixth permanent authority. The five permanent authorities under docs retain
product ownership and override this document if they differ. This document
does not select architecture, schema, components, or technology.

## Product outcome

The workbench should feel familiar to a Zenless Zone Zero player without
copying the game's menu depth. Three equal ordered Agent selectors remain
visible in one row. Exactly one selector identifies the viewed Agent, and a
separate workspace places that Agent's top-to-bottom Setup beside Result.

Result is not a full stat sheet. It shows only values and modifier regions that
matter to the Agent's authored direction and formula family. Initial, Combat,
and Fully Enabled are three distinct moments. Gauges are reserved for
source-defined thresholds or caps with a linked output.

## State and flow

- Focus is the Agent treated as on-field for Combat and Fully Enabled.
- Viewed Agent is the selected persistent party selector. Changing it replaces
  only the workspace view and preserves Focus, party, setups, calculation, and
  Result meaning; reselecting it does not close the workspace.
- Setup edits use closed selection blocks. A block opens only bounded
  competitive candidates authored for the current context.
- Result recalculates according to the permanent setup-lifecycle rules.
## Requirements

### Party slots

- R-001: All supported layouts keep three equal selectors in one row and stable
  party order without horizontal scrolling.
- R-002: Exactly one selector identifies the viewed Agent and controls one
  separate workspace below the row.
- R-003: Selector dimensions remain fixed across viewed, Focus, incomplete,
  focus, and source-linked states; those states do not reallocate party width.
- R-004: Selectors identify and select Agents but do not summarize the Setup or
  Result shown in the separate workspace.
- R-005: Workspace Identity uses a face-and-shoulders artwork crop plus name,
  Attribute, Specialty, and Focus status. Source art may be full-body because
  the UI owns focal cropping.
- R-006: Focus and an external provider source remain identifiable on their
  owning selectors without changing the viewed Agent.
- R-007: Narrow layouts retain the same one-row selector order and state
  meaning; they do not become a vertical accordion.
- R-008: Identity, Setup, and Result read as one selected-Agent workspace rather
  than as a detached settings page.

### Party Edit formation and candidate pool

This bounded presentation applies `UI-003` and `UI-006` to the draft formation,
Focus choice, and shared candidate pool without changing their product meaning.

- R-040: Attribute and Specialty occupy two separate filter rows. Each row uses
  its current game symbols, starts at All, and permits one selected value; the
  two rows continue to combine by intersection. Under `GV-004`, the Attribute
  row groups Frost with Ice, Auric Ink with Ether, and Honed Edge with Physical,
  while each candidate retains its declared Attribute symbol. Lumiflux remains
  separate because its effect Attribute is party-contextual under `GV-011`.
  Rank is identity information on each candidate rather than a third filter.
- R-041: The filtered candidate pool remains ordered alphabetically by displayed
  Agent name. Occupied Agents keep their alphabetical positions, remain
  unavailable, and identify their current draft position as `Slot 1`, `Slot 2`,
  or `Slot 3`.
- R-042: Every candidate uses the roster-complete exact-source upper-body
  derivative in one shared compact card frame. The card reserves a centered
  two-line name bank and a fixed Rank, Attribute, and Specialty symbol row;
  occupied position follows those symbols rather than displacing them.
- R-043: The three draft slots form one shallow, interlocking rail that reuses
  the applied selector's trapezoid grammar while remaining a separate Party
  Edit frame. Every draft portrait uses the roster-complete exact-source
  upper-body derivative in that common frame. Rank, Attribute, and Specialty
  symbols follow the Agent name immediately beside the portrait, without a
  redundant draft-number label. Selecting a slot marks only the replacement
  target and reveals the shared candidate pool; activating that same target
  again clears it and closes the pool. Its Focus owner uses the same oval
  `Focus` marker as the applied selector rather than a separate icon.
- R-044: Focus remains separate from replacement targeting. A compact control
  after the three draft slots opens only when at least two current members are
  Focus-eligible. Its overlapping choice panel identifies eligible members with
  the same upper-body derivative, gives their names and identity symbols enough
  size to scan confidently, and sizes its row to the exact eligible-member
  count without repeating an eligibility label on every option. It closes after
  selection, leaving the Focus marker on its owning draft slot. One eligible
  member is automatic; none keeps the draft invalid and states that a member
  must be replaced. When an otherwise applicable changed draft has multiple
  eligible members but no resolved Focus, activating Apply party opens this
  same choice panel without changing the applied party.
- R-045: Party Edit names the upper formation `Editing party` and, when an
  applied party exists, the inactive applied formation `Current party` at rail
  level. It does not repeat current, changed, or draft labels on individual
  Agent slots; the inactive treatment remains a secondary cue rather than the
  only distinction between formations.
- R-046: The Party Edit frame and its Cancel and Apply party actions use the
  same thin-line, clipped-corner, dark-paper grammar as the current workbench.
  Cancel remains visually secondary, Apply party remains the yellow primary
  action. Apply party is unavailable for an unchanged, incomplete, duplicate,
  or zero-eligible draft. An otherwise applicable changed draft keeps Apply
  party available when multiple eligible members still require Focus choice;
  that activation resolves Focus before a later activation can commit.
- R-047: Fixed setup assumptions and simulation non-goals do not occupy a
  persistent page footer. The workspace reserves persistent copy for current
  orientation, state, and available action.
- R-048: Before any party has been applied, the first visit opens Party Edit
  directly with all three draft slots empty. No applied-party rail, persistent
  Agent selectors, viewed-Agent workspace, Setup, or Result is shown behind or
  beside this initial composition state.
- R-049: Selecting an empty draft slot marks it as the current destination and
  opens the existing shared Agent pool. Selecting an available Agent fills that
  slot, and a filled slot subsequently retains the established replacement
  behavior. Occupied Agents remain unavailable so the draft cannot contain a
  duplicate.
- R-050: Initial composition reuses the established Party Edit frame, filters,
  candidate cards, draft-slot grammar, and Focus resolution. It does not create
  a separate onboarding page, wizard, or example party.
- R-051: Cancel remains visible in its established action position but is
  disabled throughout initial composition because no applied party exists to
  restore. Apply remains unavailable until the draft contains three distinct
  Agents and satisfies the established Focus eligibility and resolution rules.
- R-052: The first successful Apply prepares all three Agents and leaves initial
  composition for ordinary applied-party viewing. Every later Party Edit opens
  from the current applied party and retains the established Cancel and Apply
  behavior.

### Setup

- R-009: Setup order is Mindscape, pool, W-Engine, Disc 4-piece, Disc 2-piece,
  Slot 4, 5, and 6 main stats, then effective-substat counts.
- R-010: W-Engine, Disc, and main-stat blocks show only the current choice while
  closed.
- R-011: Open lists contain only authored competitive candidates. They are not
  catalogues, rankings, search interfaces, or rationale browsers.
- R-012: A block is interactive only with multiple current candidates. A
  single-candidate context does not imitate a working selector.
- R-013: Refinement is subordinate to W-Engine. Direct engine selection applies
  that engine's Rank-default.
- R-014: Direct W-Engine editing preserves Discs, main stats, effective-substat
  offerings and counts, then recalculates.
- R-015: Pool change completely re-prepares the target Agent and may apply
  different W-Engine, Disc, and main-stat first choices; substats return to zero.
- R-016: Reopen downstream W-Engine dependency behavior only when an admitted
  engine changes downstream candidate availability or invalidates a preserved
  Disc, main-stat, or effective-substat selection. Result differences alone do
  not qualify.

### Result surfaces

- R-017: Result states that it contains setting-relevant important values, not
  every Agent stat.
- R-018: Initial is the viewed Agent's pre-combat surface and contains no effect
  shared by another Agent.
- R-019: Combat treats Focus as on-field and adds applicable effects active
  merely from entering combat, without a new post-entry trigger or state change.
- R-020: Fully Enabled is one coherent payoff window with Focus as on-field main
  dealer about to deal damage.
- R-021: Fully Enabled maximizes every applicable, reachable, mutually
  compatible Result-changing effect supported by the party and setup.
- R-022: Uptime, rotation frequency, duration, and difficulty do not discount
  that maximum. Repeatable action stacks reach cap unless actual mechanics make
  the cap unreachable or incompatible.
- R-023: Attribute, recipient, action, and other real scope restrictions apply.
- R-024: Viewing a non-Focus Agent does not make that Agent the dealer.
- R-025: Party contributions are integrated into affected Agent values and
  breakdowns, not isolated in a separate Party Effects region.

### Actions, sources, and compression

- R-026: Agent action differences use canonical terms: Basic Attack, Dodge,
  Assist, Special Attack, EX Special Attack, Chain Attack, Ultimate, and an
  admitted canonical Aftershock term.
- R-027: Agent-local skill, state, stack, and passive names are not source
  labels. W-Engine and Drive Disc sources retain actual equipment names.
- R-028: Source and action applicability are separate. A W-Engine or Core
  Passive source may apply only to Ultimate.
- R-029: Hierarchy is metric or modifier region, then a canonical action
  aggregate only when values differ, then contributing sources. A retained
  operation is separate: show its mapped source identity, action or state
  meaning, and scalar value once without a display-surface identity.
- R-030: Absolute aggregate totals remain visible at each stat or modifier
  surface and action.
- R-031: Disclosure is incremental: Initial shows base/setup sources; Combat
  only additions since Initial; Fully Enabled only additions since Combat; an
  action aggregate only additions over its common aggregate.
- R-032: A source may reappear only for a new clause, stack, or delta, not to
  repeat its prior contribution.
- R-033: Implementation aggregates are not user-facing action or source names.

### Gauges and design exploration

- R-034: A gauge requires a source-defined threshold or cap and a linked visible
  output. A generic ceiling such as 100 percent CRIT Rate is insufficient.
- R-035: Gauge copy identifies both target and linked output.
- R-036: Explore party slots, Setup selection blocks, and Result separately
  before a full-page composition.
- R-037: Begin from researched ZZZ visual grammar, then adapt it to the
  workbench's information and interaction needs.
- R-038: Comparable variants use identical content, state, and behavior; only
  the visual hypothesis changes.
- R-039: Manual selection precedes combining elements. Familiarity never
  overrides clarity, accessibility, state meaning, or permanent authorities.

## Testing delta

- The new mechanism is the one-time transition from an incomplete initial
  three-slot draft to the first complete, prepared party. The nearest existing
  coverage begins from an already applied party, so it cannot prove that the
  initial screen omits Current party, Identity, Setup, and Result; keeps Cancel
  visible but disabled; rejects incomplete or Focus-invalid drafts; or commits
  the first party only after multi-eligible Focus selection.
- The materially distinct visible failure is an empty draft destination whose
  shape or one-row alignment breaks before any Agent art exists. Existing
  narrow Party Edit checks begin with filled slots and therefore cannot prove
  the empty presentation at both desktop and narrow widths.
- The assertions remain meaningful with equivalent Agent fixtures. Named
  Agents are used only to realize zero-, one-, and multi-eligible Focus states;
  no exact Agent roster, equipment value, or catalogue membership is frozen.

## Acceptance examples

- Selecting Dialyn while Yixuan is Focus shows Dialyn's workspace but leaves
  Yixuan as Focus.
- Selecting any party position preserves the three equal selector widths and
  replaces only the workspace below them.
- A one-candidate pool shows its W-Engine without a false list affordance.
- Directly choosing the other full-pool W-Engine applies its Rank-default,
  preserves downstream setup and counts, and recalculates.
- Changing pool applies that pool's prepared setup and zeroes substats.
- A contribution disclosed in Initial is not repeated in Combat, although the
  Combat absolute aggregate remains visible.
- An Ultimate-only equipment delta keeps the equipment name under Ultimate.
- A source-owned threshold with linked bonus may use a gauge; a generic stat
  ceiling remains a number.
- On a first visit, Party Edit shows three empty draft slots, no Current party
  rail or workbench workspace, and a visible disabled Cancel action.
- Filling fewer than three initial slots leaves Apply unavailable. Filling three
  distinct Agents resolves or requests Focus under the existing rules, and the
  first valid Apply opens the prepared three-Agent workbench.
- Reopening Party Edit after the first Apply starts from the applied three-Agent
  party rather than returning to empty slots.

## Scope boundary

Included: initial empty-party composition, party selector and workspace
Identity, Setup/Result composition, bounded Party Edit candidate-pool
presentation, honest selector affordance, surface meaning, action/source
vocabulary, source compression, gauge eligibility, and element-first visual
exploration.

Excluded: final style selection outside the bounded Party Edit pool, production
UI rewrite outside the accepted surfaces, catalogue, optimizer, ranking,
rationale browser, new ZZZ content, persistence, evidence/history, simulation,
and implementation architecture.

No product-policy decision blocks element samples. Typography, dimensions,
motion, responsive calibration, and production artwork sourcing are comparison
inputs, not unresolved product meaning.
