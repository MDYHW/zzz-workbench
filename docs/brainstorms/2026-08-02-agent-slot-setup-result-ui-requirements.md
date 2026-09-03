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
  aggregate only when values differ, then contributing sources.
- R-030: Absolute aggregate totals remain visible at each surface and action.
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

## Scope boundary

Included: party selector and workspace Identity, Setup/Result composition, honest selector
affordance, surface meaning, action/source vocabulary, source compression,
gauge eligibility, and element-first visual exploration.

Excluded: final style selection, production UI rewrite, catalogue, optimizer,
ranking, rationale browser, new ZZZ content, persistence, evidence/history,
simulation, and implementation architecture.

No product-policy decision blocks element samples. Typography, dimensions,
motion, responsive calibration, and production artwork sourcing are comparison
inputs, not unresolved product meaning.
