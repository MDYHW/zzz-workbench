---
title: ZZZ-Inspired Workbench Style Direction
date: 2026-08-03
status: confirmed
authority: supporting-design-record
---

# ZZZ-Inspired Workbench Style Direction

## Ownership

This record preserves the causes and visual philosophy behind the selected
workbench direction. It is not a sixth permanent authority and does not own
product behavior, game meaning, calculation, candidate policy, or exact
responsive geometry. The five permanent authorities under `docs/` retain
their stated ownership. Durable presentation rules belong to
[Workbench UI Design Rules](../workbench-ui-design-rules.md).

The integrated reference is a comparison baseline, not a pixel specification or
production component contract.

## Outcome

The workbench should feel familiar to a Zenless Zone Zero player while keeping
Setup and Result, rather than Agent artwork, at the center of the service. Three
equal ordered party selectors remain recognizable in one row. One selected
Agent's Identity, Setup, and Result occupy a separate workspace below them.

The selected desktop reading order is:

`Selector | Selector | Selector`

`Selected Identity -> Setup -> Result`

Setup and Result remain adjacent. Identity may create a controlled visual seam
into the work area, but it must not reduce the readable footprint of Setup or
Result.

## Visual Philosophy

The selected direction uses ZZZ-inspired editorial composition rather than a
collection of game-like decorations.

- Neutral surfaces establish the base hierarchy.
- Accent color is selective and its exact hue and proportion remain adjustable.
- Asymmetry, cropped planes, weight contrast, and local geometric cuts direct
  reading order.
- A collision or boundary penetration is useful only when it connects adjacent
  areas without covering their meaningful content.
- Calm negative space is created around readable information, not by shrinking
  the information.
- Rank, Attribute, and Specialty symbols compress identity and therefore remain
  compact.
- Large character art, saturated color fields, repeated diagonals, circles, and
  yellow markers do not create ZZZ style by themselves.
- Cartoon-poster composition is rejected when character scale or broad color
  blocks take visual priority from the workbench.

## Agent Identity

Identity exists to distinguish the Agent and party position quickly.

- Workspace Identity uses a consistent full-color artwork treatment.
- Party selectors use one consistent neutral artwork treatment.
- These two destinations are view presentation and do not vary with Mindscape.
- Identity does not display the Agent's current Mindscape.
- Mindscape remains an editable Setup input from M0 through M6 and is shown only
  at its owning Setup control.
- The same Agent artwork identity is retained across selector and workspace
  destinations; the UI changes focal crop and scale rather than implying a
  different Agent state.
- Crop calibration follows the Agent's face and body center, not the source
  image bounds, so different artworks retain comparable perceived scale.
- Workspace artwork remains large enough to distinguish the Agent but does not
  become the primary content surface.

## Party-Slot Composition

The three equal selectors stay in one row at every supported layout. Exactly one
is selected for viewing, and all three retain fixed geometry as viewed, Focus,
incomplete, focus, and source-linked states change. Selectors do not summarize
the Setup or Result shown in the separate workspace.

Inside the selected-Agent workspace:

- Identity is the narrow identification plane.
- Setup occupies the left work area.
- Result occupies the adjacent right work area.
- The Identity-to-Setup seam may be soft and asymmetric.
- The Setup-to-Result transition may use stronger material contrast because it
  separates editable inputs from calculated output.

Exact widths, ratios, and pixel values remain calibration inputs. The
composition must be reassessed against real content rather than preserved by
shrinking type or controls.

## Setup Direction

Setup follows one top-to-bottom attention path. Every sample used to evaluate
the direction had to include Mindscape, pool, W-Engine and refinement, Drive
Disc 4-piece and 2-piece, Slot 4/5/6 main stats, and effective-substat counts.
An arrangement was not valid merely because it reserved component placeholders.

The selected direction is a vertical assembly stack:

1. Mindscape and W-Engine pool;
2. the current W-Engine and refinement;
3. adjacent 4-piece and 2-piece Drive Disc fields;
4. the Slot 4, 5, and 6 main-stat group; and
5. the effective-substat controls.

This direction was selected because Setup shares a constrained horizontal area
with Result. Each stage can use the available Setup width before attention moves
downward.

A horizontal equipment-core composition was a useful visual idea, but its
identity depended on showing the W-Engine and both Discs side by side. In the
current Setup surface it would either reduce images and text, cause excessive
wrapping, or add a competing left-to-right reading path. Stacking that same
composition would remove the relationship that made it distinct. It should be
reconsidered only if a later allocation provides enough width without reducing
Result or selector continuity.

The earlier numbered timeline was also not retained. Adding Main Stat and
substat controls beneath that structure treated remaining space as a footer
instead of recalculating the footprint of the complete Setup.

## Result Direction

Result remains a light numeric surface adjacent to the darker Setup work area.
The material contrast makes the transition from editable setup to calculated
interpretation immediately visible.

The current visual baseline preserves one table for the three display surfaces,
with local gauge and action-difference regions below it. The permanent product
and UI authorities continue to own which values, sources, disclosures, gauges,
and action differences are actually shown. This record does not turn the
placeholder density or current row count into a requirement.

## Failure Patterns That Inform Future Work

The exploration produced several reusable constraints:

- Do not let character art or saturated identity color dominate Setup and
  Result.
- Do not treat three equal rectangular areas as sufficient hierarchy.
- Do not create motion or collision by splitting artwork into unrelated blocks.
- Do not preserve a prior container by reducing labels, values, and controls
  together.
- Do not append missing Setup inputs into leftover space and call the resulting
  footprint complete.
- Do not present minor color or angle changes as materially different
  compositions.
- Do not force a width-dependent horizontal idea into a narrow Setup surface.

These are causal constraints, not an archive of every explored design.

## Deferred Calibration

The following remain later UI work rather than unresolved product policy:

- exact Identity, Setup, and Result allocation;
- final fixed selector height and selected workspace dimensions;
- selector opening geometry and candidate presentation;
- refinement editing details;
- pointer, keyboard, focus, and motion treatment;
- responsive rearrangement;
- per-Agent production crop calibration;
- Result disclosure density and source compression; and
- production component boundaries and asset sourcing.

## Visual Reference

The permanent presentation baseline is owned by the
[Workbench UI Design Rules](../workbench-ui-design-rules.md). It retains the selected
Identity, vertical Setup assembly, Result surface, and three persistent party
selectors; exact dimensions, type sizes, colors, and sample data remain
calibration inputs.
