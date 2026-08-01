# Workbench UI Design Rules

Status: presentation authority for the bounded setup-workbench consumer.

## Authority Boundary

| Owns | Links to | Does not own |
| --- | --- | --- |
| visual hierarchy, layout and density rules, interaction presentation, responsive presentation, setup-input and selector presentation, ZZZ-inspired shape discipline, and UI verification | [workbench outcomes and user flow](setup-workbench-product-contract.md#user-flow-contract), [required observable result information](setup-workbench-product-contract.md#observable-result-information), and canonical game terms in [ZZZ Game Vocabulary](zzz-game-vocabulary.md) | setup policy, game meaning, formula meaning, source-fact treatment, calculation order, candidate admission, content research, external source structure, or the active values displayed by the consumer |

This document decides how the bounded consumer presents meanings owned elsewhere. It links to those owners instead of redefining them.


## Decision Priority

Resolve UI changes in this order:

1. preserve the product meaning and the user's current editing point;
2. preserve legibility of the identity, current value, and available action;
3. remove meaningless padding and decoration;
4. adjust allocation, angle, radius, grouping, or local geometry;
5. adjust component dimensions while preserving readable content; and
6. reduce type or image size only when the earlier steps cannot solve the
   constraint without harming another invariant.

Collision removal, symmetry, implementation convenience, and reuse of an
existing component dimension do not outrank this order.

## Interaction And Workspace

### Action Budget

The consumer uses vertical scrolling, clicking, pointer focus,
and keyboard input. It must not require horizontal scrolling, horizontal
swiping, or panning to reach a party slot or its active setup surface.

The page background is a small surrounding desk for the workbench, not a large
pan-and-zoom canvas. Browser zoom or viewport changes must not expose a large
empty swipeable plane around a fixed workbench.

### Party-Slot Continuity

Presentation must preserve the slot-owned continuity required by
the [User Flow Contract](setup-workbench-product-contract.md#user-flow-contract):
the three party slots remain recognizable while one slot exposes its editable
preview.

- When all three slots are compact, they divide the available width equally.
- When one slot is expanded, it consumes the flexible editing area and the two
  compact slots divide the remaining width equally.
- Selecting another compact slot expands that slot without an intermediate
  all-collapsed state.
- The focused-character marker uses space reserved by every slot. Adding or
  removing the marker must not shift the Agent identity.
- A supported viewport or zoom state must show all three slots without
  horizontal scrolling.

Responsive presentation may change density and vertical order. It must not
change the meaning or availability of an input or Result surface.

### Party Editing

Party editing uses one shared Agent pool rather than a
separate candidate popup attached to each slot.

- Entering party edit shows all three equal compact slots without the Agent
  pool.
- Selecting one slot marks it as the replacement target and reveals the shared
  pool below all three slots.
- Selecting an available Agent replaces the target in the draft, closes the
  pool, and clears the target selection.
- Candidate portraits are compact identification images rather than party-slot
  hero portraits.
- Agents occupying any draft slot remain visible, visibly unavailable,
  and non-selectable.
- The pool exposes Attribute and Specialty filters even in the bounded first
  consumer. Each filter starts at all candidates, admits one value, and
  combines with the other filter by intersection.
- Filtering changes only which consumer-admitted candidates are visible. It
  does not admit unsupported Agents or change setup policy.

Cancel, Apply party, focus validation, and prepared initialization of all three
party slots keep the meanings owned by the
[User Flow Contract](setup-workbench-product-contract.md#user-flow-contract).

## Area, Type, And Padding

### Content-First Sizing

Do not mechanically minimize component area. Determine the
legible type and image footprint first, remove padding that carries no meaning,
then size and place the component around that content.

- Do not shrink both a block and its type merely to remove a collision.
- Do not preserve a fixed height when newly available space can improve
  legibility or grouping.
- Do not stretch a container while leaving its meaningful content unchanged
  and surrounded by new empty space.
- Prefer a readable label and value with minimal padding over a small label in
  a nominally compact block.
- Repeated controls that express the same kind of choice use the same type,
  weight, alignment, and spacing grammar.
- Difference in information importance may change placement and grouping; it
  does not automatically justify smaller unreadable text.

### Information Density

Setup Inputs are concise and direct. Result disclosure shows the current
numeric contribution breakdown and mapped source identity, while Setup Inputs
show the current choice and only the compressed effect needed to compare
candidates. Research notes and candidate rationale are not consumer UI.

The Result table uses the width required for its exact aggregates and
disclosure. It does not consume surplus width merely because it is available.
Setup Inputs receive the remaining useful width, and their type and internal
structure must be reconsidered when that allocation changes.

### Result Source Presentation

In Result disclosure, a source label answers where a contribution
comes from. The Result row, detail qualifier, and gauge output answer what the
contribution changes.

- An Agent source label uses the mapped source category, such as `Basic Attack`,
  `Core Passive`, or `Additional Ability`.
- Maximum Potential Awakening is already applied to those Agent sources and
  never receives a separate Result source label.
- Do not derive an Agent source label from the effect fact's implementation key.
- Every displayed Agent fact requires an explicit source presentation. A missing
  presentation is an error rather than a generic mechanics fallback.
- A contribution from another party member prefixes that Agent's identity to
  the same mapped source label; it does not replace the label with effect copy.
- Result values, change summaries, and source lines use the concise displayed
  number, such as `125%` or `+125%`. Internal value-mode distinctions remain
  required to prevent invalid aggregation, but they do not add explanatory
  suffixes to the displayed number.
- A gauge repeats that same resolved source presentation, including a Drive Disc
  piece identity such as `4pc`; inactive fallback copy must not rename it.
- The gauge heading names its basis display surface directly. The expanded
  parent Result row supplies the basis stat, so the gauge does not repeat a
  compound `surface | stat` label.
- Gauge output copy names the linked Result quantity and only the action or
  anomaly-result qualifier required to distinguish its visible value. Its
  signed value communicates the current contribution; mechanism or distribution
  words such as `Added`, `grant`, `conversion`, or `Party` do not become part
  of the output name.
- When one aggregate differs by canonical action, keep the base Result row
  concise and show the differing action aggregates when that row is expanded.
  Do not create a second Result surface for the comparison.
- For an independent source-stated action DMG Multiplier or Daze Multiplier
  modifier operation, show only its added amount or scale factor and numeric
  source breakdown. Do not show the resolved ordinary skill level, base action
  multiplier, additional skill-table action coefficient, calculated base
  component, or final damage or Daze. Keep these operations visually and
  semantically separate from regular DMG Bonus and Daze Bonus.
- Resolve Attribute applicability against the current Agent before presentation.
  Do not add Attribute-restriction copy such as `Ice only` to Result rows,
  details, gauges, or source lines. Agent Attribute identity and Attribute-bearing
  equipment or input labels remain visible in their owning UI contexts.
- When one relationship changes multiple Result quantities, each quantity keeps
  one output line even when the current contribution value is identical.
- A progressing threshold or cap shows the current basis value and applicable
  boundary on its gauge; it does not repeat the calculated numeric remainder.
- When a threshold-only relationship reaches its boundary, keep the basis
  stat and current value, replace only the progress track and scale with one
  compact `Active` strip, and keep the current output below it. `Enhanced` is
  not a separate reached-state label; an output value change communicates the
  increased amount.

## Agent Slot Identity

### Compact State

Compact identity uses nearly all of its allocated
surface without crowding:

- portrait and identity padding remain small but visible;
- the portrait scales with the compact slot rather than using one unrelated
  fixed size;
- the Agent name remains immediately readable;
- Attribute and Specialty symbols are centered as a pair with a deliberate
  gap; and
- the focused-character marker cannot overlap the portrait, slot number, name,
  or identity symbols.

### Expanded State

The expanded header uses the same portrait, name,
Attribute, Specialty, and Rank identity grammar as the compact slot, but aligns
the information to the expanded header's leftward reading flow.

Agent portraits currently use a square face-and-upper-body crop. A later ZZZ-
inspired diagonal crop remains allowed; the current square crop does not become
an image-pipeline requirement.

Attribute and Specialty images use transparent surrounding backgrounds. Agent
Rank uses the admitted in-game Rank image. Faction is not a default primary
identity in the preview; expose it only where party-condition explanation makes
it useful.

## Equipment Presentation

### Image Surfaces

W-Engine and Drive Disc images use their allocated image surface
instead of being reduced by nested wrapper padding. The two equipment kinds use
a coherent wrapper depth and visual weight even though their source images have
different silhouettes.

The Drive Disc image may be slightly smaller than the W-Engine image when that
produces comparable perceived weight. Accidental image clipping, image-source
backgrounds, and unexplained borders are defects rather than styling.

### W-Engine

The W-Engine identity and its refinement form one
editing group. Refinement must not appear as an unrelated setting separated
from the selected W-Engine. Candidate selection changes only the meanings owned
by the [product flow](setup-workbench-product-contract.md#user-flow-contract);
presentation must distinguish a direct W-Engine edit from a pool change, which
does initialize that Agent's complete prepared setup.

### Drive Disc Effects

Setup Inputs present only the compressed final effects
needed to compare the current Disc choice.

- The adjacent 4-piece and 2-piece fields divide their available row equally
  until the existing responsive breakpoint stacks them.
- A 4-piece field gives each distinct compressed 4-piece effect its own row,
  followed by that set's 2-piece effect row.
- Drive Disc, PC, effect, and value occupy stable visual regions. `4PC` appears
  only on the first 4-piece effect row; later rows leave the PC region blank.
- Every row preserves the same column hierarchy and weight. Effect copy uses
  one smaller type step, takes all flexible width, and may wrap. The value
  region stays left-aligned and uses a reduced fixed minimum width, expanding
  only when a displayed value requires more room.
- Effect rows have no dividing rules. Cell and image spacing stays at the
  minimum needed to distinguish the stable regions, and reclaimed width belongs
  to the effect region rather than decorative whitespace.
- A 2-piece-only field places its single row at the bottom of the reserved
  effect area, aligned with the 2-piece row of the 4-piece field.
- The Drive Disc image remains identifiable but must not crowd or overlap the
  effect copy.
- Within this compressed Disc presentation only, Attribute damage effects omit
  `Bonus`: for example, `Ice DMG +10%`. This shorthand does not rename the
  `DMG Bonus` stat or Result surface.
- Current numeric contributions and mapped source identities remain available
  through Result disclosure rather than expanding Setup Inputs. Research notes,
  effect-mechanics prose, and candidate rationale do not become a parallel
  explanation surface.

## Setup-Input Sequence

The setting flow reads as:

1. Mindscape context;
2. W-Engine and refinement;
3. Drive Disc 4-piece and 2-piece selections;
4. Drive Disc slot 4, 5, and 6 main stats; and
5. effective substat hit counts.

The Rank-default Mindscape is already selected when setup editing opens. Its
current M0 through M6 value is placed before the other inputs and receives
modest visual emphasis so the user is encouraged to reconsider this upstream
context early. That order and emphasis are guidance, not a blocking step: every
other available setup input remains editable, and the user may return to
Mindscape at any time.

W-Engine, Drive Disc, and main-stat inputs begin with the visible prepared
choices for the current party, Mindscape, and pool. Effective-substat hit counts
begin at zero. The complete prepared party displays Result immediately. If any
required input becomes incomplete, the Result region becomes empty; it must not
render placeholder values or values calculated from a hidden fallback.
Potential Awakening is fixed completed progression and is not an input.

Changing one Agent's Mindscape or pool visibly initializes only that Agent's
prepared setup. Applying a changed party or focus initializes all three slots.
Direct equipment and stat edits do not reset unrelated inputs. When a selected
equipment effect creates a current stat pressure, its competitive main-stat,
effective-substat, and set-supply candidates appear at their owning selectors
without adding rationale prose.

Geometry may be linear, orbital, or another coherent structure. It must make
this order and the relationship between groups more apparent than the shape
itself.

### Main Stats

Slot 4, 5, and 6 main stats read as one group. Their blocks must
make the slot number, stat identity, and current value legible without excess
height or padding. Do not reduce their type to preserve a previously chosen
block dimension. Rebalance the block footprint and neighboring geometry around
the longest supported label.

- Each block uses stable `Slot | Stat | Value` visual regions without adding a
  header or dividing rules.
- Stat copy uses one smaller type step and receives all flexible width. Value
  copy stays left-aligned in a reduced fixed minimum width and expands only
  when its displayed value requires more room.
- A small, consistent inset separates Stat copy from the Slot region; do not
  insert literal whitespace into the stat label.
- Within Main Stat presentation only, Attribute damage choices omit `Bonus`:
  for example, `Fire DMG +30%`. This shorthand does not rename the canonical
  `DMG Bonus` stat or Result surface.

### Effective Substat Hit Counts

Effective substat hit counts are frequently adjusted but remain
the final step of setup tuning. Their controls must be easy to inspect and use
without taking visual priority from equipment and main stats.

- The surrounding control area may be smaller than an earlier mockup, while
  its stat label and numeric text remain clearly legible.
- Minus, numeric count, and plus use equal-size circular controls.
- When placed on a circular control, all three follow the same circumference
  and remain entirely inside the owning control.
- The numeric count receives no default visual emphasis solely because it is
  the count.
- Every offered count displays zero after prepared initialization until the
  user supplies a value.
- Within the compact Effective Substat control only, `Anomaly Proficiency` is
  presented as `AP`. Canonical stat labels and accessible control names keep
  the full term.
- A larger-radius group may use a narrower angular spread when its physical
  control footprints still remain distinct.

## Selector Presentation

### Placement

A selector opens near the setting point being changed. W-Engine,
Drive Disc, and main-stat selectors must not all reuse one unrelated fixed
screen position.

- Choose an arc, rail, or local region from the target's position.
- Account for the actual candidate footprint and label, not only a nominal
  angle.
- Avoid covering the selected target and its current value.
- Avoid existing Setup Inputs when free nearby space can do so.
- Covering an unrelated setting is acceptable only when the placement remains
  natural and the active editing point stays unobstructed.
- Different selectors may use different radii, start angles, spans, and item
  dimensions.

The downward-chevron glyph is not required. The component's shape, response,
and hover or focus state must communicate editability.

### Candidate Information

A candidate exposes the information needed for that choice.
Drive Disc candidates do not reduce to image and name when their effects decide
the setup choice. A 4-piece Disc candidate presents its compressed 4-piece and
2-piece effects, with the name serving identification rather than replacing the
comparison.

Candidate panels must not use one fixed size for text-only main stats and image-
led equipment. Each selector uses the smallest readable candidate footprint for
its own information.

### Active Target

Do not wrap every active target in one generic cyan ellipse.
Target emphasis follows the existing target geometry:

- circular equipment activates its own circumference or a local orbit segment;
- a cut main-stat block emphasizes that block's existing contour; and
- a short relation cue may connect the active target to its candidate region.

The emphasis must not change layout, hide the current value, or introduce a new
semantic status.

## ZZZ-Inspired Visual Discipline

ZZZ-inspired styling is not the quantity of yellow, diagonals,
circles, or halftone texture. It is the controlled use of editorial contrast and
geometry to explain hierarchy and action.

- Use asymmetry, cropped planes, weight contrast, and selective geometric cuts
  where they strengthen reading order.
- Use yellow markers sparingly for a current action, selected state, or primary
  orientation point.
- Do not add a diagonal merely to make a rectangular component appear more
  game-like.
- Do not add a circle unless it expresses a center, orbit, grouping, control,
  or selection relationship.
- Preserve calm negative space around dense information; do not manufacture
  empty space by shrinking the information itself.
- Product clarity and internal consistency outrank spectacle.


## Change Protocol

Before an ambiguous or structural UI change:

1. restate the requested outcome in plain language;
2. name the invariants that must not move;
3. identify rejected local fixes that would violate the priority order; and
4. distinguish an experiment from a permanent rule.

After implementation, inspect the changed surface in a browser. Do not declare
the change complete from CSS values alone.

## Verification Matrix

For every affected state, verify readable type, no content collision, no
clipping, keyboard focus visibility, and no horizontal overflow.

At minimum, select the applicable cases:

- all three party slots compact;
- each supported party slot expanded while the other two remain compact;
- an expanded slot that is not the focused character;
- W-Engine, Drive Disc 4-piece, Drive Disc 2-piece, and each main-stat selector;
- two and three offered effective substat hit counts;
- longest current Agent, W-Engine, Drive Disc, and stat labels;
- the supported browser zoom and viewport range;
- the preparation-default Mindscape and a changed Mindscape that visibly
  initializes only that Agent's setup;
- a complete prepared party with immediate Result and zero effective-substat
  counts;
- full/non-limited pool changes that initialize only the changed Agent;
- a changed party or focus that initializes all three Agent setups;
- a selected equipment effect that adds stat-supply candidates at the owning
  selectors without rationale copy;
- an incomplete setup, when reachable, with an empty Result region and no
  hidden fallback;
- Result rows with and without detail, threshold, or cap visuals;
- Result rows whose aggregates do and do not differ by action, with differing
  action values in expansion and no Attribute-restriction copy; and
- pointer hover, keyboard focus, selected, and disabled states.

Pairwise geometry checks may support verification, but a visual pass remains
required because mathematical non-overlap does not establish readable balance.

## Rejected Patterns

The following patterns contradict this authority:

- shrinking a block and its type together as the first collision fix;
- keeping a large fixed-height surface after its information becomes compact;
- enlarging a container without enlarging or reorganizing its content;
- placing every selector candidate set at the same fixed angles;
- showing Disc names without the effects needed for comparison;
- placing Disc effect copy over the Disc image;
- making the numeric substat count larger than its minus and plus controls;
- letting circular substat controls protrude beyond their owning circle;
- using one generic target ellipse for incompatible target shapes;
- repeating yellow markers or diagonal cuts without a hierarchy or action role;
- allowing a horizontal swipe plane around the workbench; and
- promoting mockup pixel values or geometry into permanent product meaning.
