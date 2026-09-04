# Workbench UI Design Rules

Status: presentation authority for the bounded setup-workbench consumer.

## Authority Boundary

| Owns | Links to | Does not own |
| --- | --- | --- |
| visual hierarchy, layout and density rules, interaction presentation, responsive presentation, setup-input and selector presentation, ZZZ-inspired shape discipline, and UI verification | [workbench outcomes and user flow](setup-workbench-product-contract.md#user-flow-contract), [required observable result information](setup-workbench-product-contract.md#observable-result-information), and canonical game terms in [ZZZ Game Vocabulary](zzz-game-vocabulary.md) | setup policy, game meaning, formula meaning, source-fact treatment, calculation order, candidate admission, content research, external source structure, or the active values displayed by the consumer |

This document decides how the bounded consumer presents meanings owned elsewhere. It links to those owners instead of redefining them.

## Stable Rule Identifiers

High-risk cross-cutting rules in this owner use the `UI-###` namespace. The
prefix is reserved to this file, and the number is an immutable reference label
rather than another rule or an expansion of the labeled section. Do not assign
these identifiers to Agent-local facts, examples, or ordinary explanatory
paragraphs.

Within the `UI-###` namespace, allocate numbers monotonically and never reuse
one. A heading move or wording clarification that preserves the same meaning
keeps its identifier. If a `UI-###` rule's meaning boundary splits, merges,
moves to another owner, or retires, reserve the old identifier under a local
`Retired Rule IDs` heading as `UI-### -> <successor IDs or none>: <reason>` and
allocate new owner-prefixed identifiers to every resulting current rule.


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

**Rule ID:** `UI-005`

Presentation must preserve the applied party and the viewed Agent as distinct
concepts required by the
[User Flow Contract](setup-workbench-product-contract.md#user-flow-contract).

- In ordinary applied-party viewing, three equal Agent selector slots remain in
  one row and in stable party order at every supported viewport or zoom state,
  without horizontal scrolling.
- Exactly one selector represents the viewed Agent. A separate workspace below
  the selector presents that Agent's Identity, Setup, and Result.
- Selecting another party position changes only the viewed Agent and workspace
  content. Re-selecting the viewed Agent does not collapse the workspace or
  create an all-unselected state. Ordered keyboard navigation moves directly
  between the three positions without an intermediate empty workspace.
- Every selector reserves stable space for viewed selection, Focus, incomplete
  Setup, pointer or keyboard focus, and temporary Result-source linkage. Adding
  or removing any marker must not shift the Agent identity.
- When an expanded Result source is owned by an applied Agent but has no visible
  Setup control in the selected workspace, the owning Agent's persistent
  selector is highlighted with the source's retained linking color. This applies
  equally to the viewed Agent and another applied party member. A source with an
  unambiguous visible Setup control continues to terminate at that control.
  Source linkage does not change the viewed Agent.
- Viewed-Agent selection does not change Focus, party order, applied Setup,
  calculation, candidates, or Result meaning.

Responsive presentation may change selector density and workspace order. It
must not hide a selector or change the meaning or availability of an input or
Result surface.

### Party Editing

**Rule ID:** `UI-006`

Party editing uses one shared Agent pool rather than a
separate candidate popup attached to each slot.

- Entering party edit shows all three equal compact slots without the Agent
  pool.
- While party edit is open, the separate applied-party rail also presents its
  three slots as equal compact inactive identities and does not render Setup or
  Result. The underlying viewed party position remains unchanged so Cancel
  returns ordinary applied-party viewing to the same selected selector and its
  separate Identity, Setup, and Result workspace.
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

**Rule ID:** `UI-001`

Setup Inputs are concise and direct. Result disclosure shows the current
numeric contribution breakdown and mapped source identity, while Setup Inputs
show the current choice and only the compressed effect needed to compare
candidates. Research notes and candidate rationale are not consumer UI.

W-Engine selection blocks and candidate lists show Rank-default refinement,
advanced stat, and the competitive passive package. Base ATK remains an
internal calculation and candidate-authoring fact and is not displayed.

The W-Engine passive summary is source-owned rather than filtered to effects
the current Agent can consume. It shows every materially distinct effect in the
admitted W-Engine's competitive passive package so the complete source-owned
offering remains available for selected and candidate comparison even when the
current Agent cannot consume one clause. Visibility assigns that clause no
positive value, negative value, opportunity cost, or independent candidate
meaning. Result still projects only effects consumed by the current Agent and
setup.

Setup and Result are presentation destinations rather than semantic filters.
Source-fact and setup policy establish the admitted equipment identity and its
complete package before Setup copy is compressed. Holder, Specialty,
Attribute, activation, action, recipient, interval, and formula consumers
establish applicable relationships before Result presentation. The UI must not
materialize every legal or source-stated effect and then use Agent role,
identity, Specialty, or visible-row policy to hide an inapplicable relationship.
Conversely, it cannot create candidate value or a Result relationship from a
visible clause. Correct a mismatch at the owning upstream fact, policy, or
relationship boundary instead of adding holder-filtered Setup copy, a
role-specific presentation branch, or an explanation payload.

Result may omit an aggregate only when the delivered aggregate has no current
value, numeric breakdown, gauge, or action outcome. That empty-row pruning is
presentation density, not an applicability decision, and cannot remove an
otherwise retained relationship. W-Engine and Drive Disc selected and candidate
surfaces preserve every retained source-owned clause for the equipment choice
they present, while the combined Setup continues to show the complete selected
package. Disc role-exchange, complement, and row geometry differences do not
create holder-specific effect filtering.

W-Engine and Drive Disc Setup summaries use one common semantic compression
rule. Compress simultaneously reachable clauses with the same metric,
recipient, and effect scope into their total value. Omit calculation surfaces,
stack or maintenance steps, routine trigger actions, durations, and cooldowns
from the Setup summary. Preserve the recipient and affected action, Attribute,
or outcome scope when they define what the effect changes. A trigger action is
not an affected-action scope. Preserve an external target-state threshold when
it materially changes the package's available magnitude: for example, Precious
Fossilized Core shows its cumulative Daze outcomes at the target-HP thresholds
instead of presenting its maximum as continuously available.

When an equipment summary does not fit the admitted Setup geometry, recheck
semantic compression before changing layout or type. Do not use item-specific
smaller text to accommodate source trigger, stack-acquisition, maintenance,
duration, or cooldown prose. Typography changes require a shared visual need
that remains after the equipment package is correctly compressed.

The Result table uses the width required for its exact aggregates and
disclosure. It does not consume surplus width merely because it is available,
but source matrices and action differences must not be compressed while Setup
already has its admitted readable footprint. In that state, newly reclaimed
expanded-slot width belongs to Result. Setup type and internal structure must be
reconsidered when its readable footprint cannot be preserved.

### Result Source Presentation

**Rule ID:** `UI-002`

In Result disclosure, a source label answers where a contribution
comes from. The Result row, detail qualifier, and gauge output answer what the
contribution changes.

- An Agent source label uses the mapped source category, such as `Basic Attack`,
  `Core Passive`, or `Additional Ability`.
- A Potential Awakening modification or extension uses the mapped existing
  source label. A retained standalone Potential Awakening clause uses the
  `Potential Awakening` label.
- Do not derive an Agent source label from the effect fact's implementation key.
- Every displayed Agent fact requires an explicit source presentation. A missing
  presentation is an error rather than a generic mechanics fallback.
- A contribution from another party member prefixes that Agent's identity to
  the same mapped source label; it does not replace the label with effect copy.
- Result values, change summaries, and source lines use the concise displayed
  number, such as `125%` or `+125%`. Internal value-mode distinctions remain
  required to prevent invalid aggregation, but they do not add explanatory
  suffixes to the displayed number.
- Do not disclose completed-progression Agent base values, fixed Slot 1/2/3
  Drive Disc main stats, or W-Engine Base ATK as Result sources. They remain in
  the calculated aggregate. The source matrix explains decision-relevant setup
  and enabled effects rather than reconstructing every fixed internal term.
- When a retained source defines a percentage, show its source-defined
  percentage rather than replacing it with the derived absolute stat increase.
- Keep aggregate rows neutral. Expanded disclosure assigns color to the current
  source locus: W-Engine, Drive Disc piece or slot, effective-substat input,
  canonical action, Core Passive, or Additional Ability. Different effects from
  that same source keep the same color.
- Effective-substat colors belong to displayed input positions 1, 2, and 3,
  not to stat identities. The first effective-substat input therefore keeps the
  same color across Agents even when one Agent shows CRIT Rate there and another
  shows HP.
- Source-locus color and temporary link destination are separate. An
  Agent-identity formula source uses its owning Agent selector's color. Other
  Agent-owned contributions retain the distinct color of their W-Engine, Drive
  Disc, effective-substat position, canonical action, Core Passive, Additional
  Ability, or other retained source locus even when the source links to a party
  selector. The resolved destination receives that retained linking color for
  the duration of the link; several sources terminating at one selector do not
  collapse into one Agent-slot color.
- Only current, retained source loci consume semantic colors. Calculation clamps
  remain neutral, and absent actions or omitted fixed inputs do not reserve
  speculative colors.
- In one expanded Result quantity, show each source identity once. Place its
  amount at the earliest surface where that contribution appears and show only
  later increments in later surface cells. The parent aggregate remains
  cumulative. Do not insert subtotal pseudo-sources or empty-state copy such as
  `No new contribution`.
- Pointer hover or keyboard focus on a source highlights its unambiguous visible
  Setup control when one exists. An Agent-owned source without a visible Setup
  control highlights the owning Agent's persistent selector, whether that Agent
  is currently viewed or is another applied party member. A Result-local target
  or calculation source remains linked to its neutral Result-local destination.
  Resolve this destination from retained source ownership and visible structure,
  not displayed source words or a list of skill names. Hover or focus on an
  unambiguous Setup locus highlights the matching Result sources. Exact source
  text remains visible, so color is a linking cue rather than the only carrier
  of meaning.
- Source color belongs to the locus, not the selected item identity. Direct
  equipment replacement retains the locus color while replacing its source text,
  contributions, and action rows atomically. Removed sources leave no stale
  highlight. Pool re-preparation clears the active source link.
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
- An expanded quantity orders disclosure as common sources, action outcomes,
  and then the actual sources for one action when the user opens that action.
  Common sources apply to the action outcomes without an `inherits` label,
  repeated subtotal, or duplicated action-delta copy. The action row displays
  the resulting aggregate where it differs from its parent; an unchanged
  surface remains neutral. Its second disclosure identifies the W-Engine,
  Drive Disc, canonical Agent source, or other retained source that produced
  the action-only difference.
- Common-source, action-outcome, and action-source rows share the Initial,
  Combat, and Fully Enabled column tracks. The action table may use a structural
  hierarchy gutter, but it must not create alignment drift or simulate nesting
  by padding only the text. Canonical actions in one outcome group occupy
  separate text lines, keep one readable type size, and grow the row when more
  actions are present. The disclosure control stays aligned at the right of the
  action-label region.
- An expanded action-source row uses an internal hierarchy cue, its resolved
  source color, and a subdued source-row surface. Pointer hover or keyboard
  focus highlights the visible source cells as one row while leaving any
  transparent hierarchy gutter unhighlighted. The source text, not color or the
  action name, remains the identity of the contribution.
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
- Ye Shunguang's Stun DMG Multiplier row is the one current bounded exception
  that also edits an external Result basis. Its expanded detail places the
  `Target Stun DMG Multiplier` whole-percent number input directly with the
  gauge. The parent row shows the applied, clamped `Veil Vulnerability`
  replacement. Its breakdown preserves the raw bonus above `100%` and
  applicable party additions, then shows the calculation clamp as one neutral
  contribution. The gauge keeps the raw current value even when it exceeds the
  cap, and its `Veil Vulnerability` output shows the same clamped value used by
  the parent row. Do not add a separate Veil row, headroom sentence, target
  panel, or setup control.
- That editor keeps a local text draft while the Result retains the last valid
  whole value. Empty, fractional, non-finite, and below-`100` drafts expose the
  constraint without changing Result, then restore the committed value on blur
  or Enter. A valid edit recalculates without moving focus or selection.
- The external basis contribution is named `Target Stun DMG Multiplier` with
  detail `Above 100%`. Its source row, gauge, and editor share one neutral local
  target tone; they do not highlight Ye's Agent slot or any Setup locus. Party
  additions keep their existing independent provider-source interactions.
- A threshold-only relationship uses its threshold as the gauge's maximum
  boundary even when the basis stat has a different display cap. Do not make
  an unrelated stat cap look like additional progress after the output is
  already complete.
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

Compact Agent artwork uses one consistent neutral treatment. That treatment is
a compact-view presentation choice and does not vary with the Agent's current
Mindscape.

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

Expanded Agent artwork uses one consistent full-color treatment for every
current Mindscape. Identity does not display the current Mindscape or change
color with it. The editable M0 through M6 value remains visible only at its
owning Setup input.

#### Portrait Source Calibration And Acceptance

**Rule ID:** `UI-003`

The selected-Agent workspace and persistent applied-party selector retain the
same exact Agent artwork identity. Each workspace full-art source records
exactly three normalized portrait inputs: optical scale, `headTopY`, and
`faceX`. Their implementation names do not make a literal head top or face
center the visual target. Scale controls perceived identity size, `headTopY`
registers the readable continuous figure composition vertically, and `faceX`
registers the optical center of the face and connected upper-body mass
horizontally. These source inputs belong to the full artwork and are shared by
the responsive workspace and Party Edit portrait surfaces.

The persistent selector uses one dedicated upper-body derivative for every
admitted Agent. A derivative retains the exact workspace artwork, pose, form,
and depicted state; only crop framing and asset encoding may change. An
alternate render of the same Agent is not the same source. All three selector
slots use one common destination frame and crop treatment, and the admitted
roster does not mix upper-body derivatives with full-art fallback. The selector
derivative does not inherit the workspace source's `scale`, `headTopY`, or
`faceX`. It may retain its own normalized source inputs only after roster-wide
desktop and narrow comparison demonstrates that the common selector frame
cannot preserve readable identity without them.

The same selector derivative remains visible when the applied-party rail is
inactive during Party Edit. The separate Party Edit draft slots and candidate
pool retain the workspace full-art source, its normalized inputs, and their own
shared responsive destination frames. Their replacement interactions do not
change.

Each portrait surface owns one common destination frame. The frame applies the
source's horizontal and vertical optical registration, then multiplies its
nominal image width by the source optical scale. Agent-specific source inputs
correct differences in composition and perceived identity weight without
repeating the same correction as per-Agent desktop, stacked, or mobile
coordinates. Add a surface-specific Agent exception only after a concrete
asset, surface, and viewport demonstrate that the shared contract cannot
preserve the identity.

The current shared frames are visual calibration inputs, not game or product
meaning. Desktop workspace uses the midpoint from Identity start to Setup
content start, a `100px` head-top line, and a `295%` nominal image width. Mobile
workspace uses `30%`, `16px`, and `110%`. Party Edit full-art frames apply the
same source metadata through their own shared responsive destinations. The
selector uses its own common shallow frame and the same image-aligned diagonal
treatment in all three applied slots.

Use the authored source metadata deterministically at runtime. Original-canvas
measurements, transparent bounds, automatic face detection, visible silhouette
mass, and synthetic body axes may suggest comparison candidates, but none is an
accepted coordinate. Detached strands, weapons, capes, tails, companions,
floating ornaments, feet, and canonical Agent height constrain clipping or
dominance; they do not vote as identity anchors.

Author the three inputs in this fixed sequence because each has a separate
visual responsibility:

1. Inspect the original asset and the actual Identity-start to
   Setup-content-start destination. Choose a useful nearby portrait for optical
   comparison and identify detached or extended forms that are constraints
   rather than anchors.
2. Establish optical scale while holding provisional horizontal and vertical
   registration constant. Compare a small local scale envelope in desktop and
   narrow workspace rendering. Scale makes the readable identity cluster--head,
   face, and connected shoulders or upper body--comparable with its peer. Its
   lower bound is immediate face readability; its upper bound is reached when
   connected body mass or props dominate the frame, or when name and Setup
   clearance fail. A face-only crop, full silhouette, alpha bounds, and body
   height are not scale anchors.
3. Freeze scale, then author `headTopY` from small local vertical deltas in the
   rendered destination. Position the continuous readable figure composition,
   using immediate face readability as a guardrail and connected torso or body
   mass as a counterweight. Do not align literal hair tops or Agent coordinates
   numerically. If a large correction appears necessary, recheck scale and the
   assumed composition instead of hiding the error in a vertical offset.
4. Freeze scale and `headTopY`, then author `faceX`. A midpoint between temporary
   face and connected-upper-body measurements is a useful candidate, not the
   answer. Compare current, midpoint, and when needed a bounded partial move in
   the rendered corridor. Choose the optical center that balances face and
   connected upper body without allowing a detached prop, extended limb, or
   lower-body pose to pull the frame.
5. Keep the current value when a candidate improves only one surface or merely
   changes the crop without improving identity balance. Accept a partial move
   when the full candidate over-corrects. Accept the metadata only when the same
   three inputs survive desktop and narrow workspace rendering without a
   surface-specific correction.

Temporary head, face, shoulder, or body measurements are calibration evidence.
They do not add runtime metadata, define cross-Agent numeric alignment, or
replace rendered comparison. Permanent authority records the method and
acceptance boundary, not an Agent-by-Agent coordinate catalogue.

The accepted desktop crop keeps each face within the corridor from Identity
start to Setup content start, places the face below the name without a hard
collision, preserves comparable perceived Agent scale, and keeps meaningful
artwork clear of Setup controls. Narrow workspace frames apply the same
full-art source metadata through their own shared responsive destination.
Selector derivatives instead use the common selector frame and only the
separately justified normalized inputs above.

Source-variable presence proves only structural wiring. A portrait calibration
is not accepted until the original asset has been inspected and all three
authored inputs have been compared in the actual workspace at one desktop and
one narrow viewport. A
worker report that omits browser verification leaves the portrait unit
incomplete; passing DOM tests cannot substitute for this visual check. Final
acceptance compares the Agent with nearby admitted portraits on the same
destination surface for immediate face readability, continuous composition,
optical identity weight, and name or control clearance. Source inspection alone
cannot mark a portrait sound, and a controller does not accept a worker's
full-art metadata change without repeating that rendered comparison for every
changed Agent in the workspace and Party Edit destinations. A selector
derivative or selector-specific normalized input also requires roster-complete
desktop and narrow comparison in the persistent three-slot rail, including its
inactive Party Edit state.

### Expanded Slot Composition

The desktop expanded slot reads left to right as Identity, Setup, and Result.
Setup and Result remain adjacent. Identity is a constrained identification
plane; it may create a soft asymmetric seam into Setup, but artwork, color, and
decoration must not cover Setup content or make Identity the workbench's visual
center.

Exact ratios and pixel dimensions are calibration inputs rather than product
meaning. Rebalance the areas from real content before reducing readable type,
images, or controls.

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

Apply the common W-Engine and Drive Disc semantic compression rule before
assigning Disc effects to rows. A routine trigger or stack-acquisition step does
not create another effect row; rows represent only materially distinct retained
effect scopes.

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

The current expanded-slot direction uses a top-to-bottom assembly stack because
Setup shares constrained horizontal space with the adjacent Result. W-Engine
and refinement occupy one row, the 4-piece and 2-piece fields remain adjacent,
main stats form the next group, and effective-substat counts finish the flow.

Do not compress a width-dependent horizontal equipment core into this Setup
area. It may be reconsidered only if a later allocation can show W-Engine and
Disc content side by side without shrinking their readable content, weakening
Result, or adding a competing horizontal attention path. Stacking that geometry
after it no longer expresses the horizontal relationship is not preservation of
the same direction.

### Main Stats

Slot 4, 5, and 6 main stats read as one group. Their blocks must
make the slot number, stat identity, and current value legible without excess
height or padding. Do not reduce their type to preserve a previously chosen
block dimension. Rebalance the block footprint and neighboring geometry around
the longest supported label.

- In the current constrained Setup width, each block places Slot in one compact
  upper header and keeps Stat and Value together in the row below. This protects
  readable Stat and Value copy without widening Setup or weakening Result.
- The three Slot headers use the same height, weight, alignment, and divider;
  their lower `Stat | Value` rows keep equal outer footprints.
- Stat copy uses one smaller type step and receives all flexible width. Value
  copy stays left-aligned in a reduced fixed minimum width and expands only
  when its displayed value requires more room.
- This two-row treatment is the current bounded-width presentation, not a
  universal main-stat rule. Reconsider it during later Setup allocation work
  only against the real three-block content and adjacent Result footprint.
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
- When the current effective set offers no substat input, keep the compact Sub
  stats heading and empty grid as a stable setup scaffold. The setup remains
  complete; do not add a disabled control, farming explanation, optimization
  rationale, or placeholder count.
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

The selected choice remains visible before editing. A setting with only one
admitted candidate is still shown as part of the complete setup, but it does not
claim an unavailable change interaction. Candidate count changes the available
interaction, not the visual truth of the current selection.

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

**Rule ID:** `UI-004`

A candidate exposes the information needed for that choice. Drive Disc current
and candidate blocks omit visible names while their accessible names retain
them; compressed effects perform comparison. Each candidate keeps its exact
Disc identity even when another candidate has the same 2-piece effect. The
current 4-piece identity is absent from the visible 2-piece alternatives because
its 2-piece effect is already active; a legal role exchange is presented from
the 4-piece selector instead.

Selected and candidate W-Engine and Drive Disc controls expose the same
compressed package as an accessible description. The accessible name identifies
the equipment and selection action; it does not replace or suppress the effect
description needed to compare candidates.

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
- Use neutral surfaces as the base hierarchy. Accent hue and proportion may
  vary, but accent exists to orient a current action or selection rather than
  to fill every region.
- Keep Agent artwork subordinate to the Setup and Result work surfaces. A
  cartoon-poster composition in which character scale or broad saturated color
  fields dominate the workbench is not the selected direction.
- Keep Rank, Attribute, and Specialty symbols compact because their purpose is
  to compress identity.
- Use yellow markers sparingly for a current action, selected state, or primary
  orientation point.
- Do not add a diagonal merely to make a rectangular component appear more
  game-like.
- Do not add a circle unless it expresses a center, orbit, grouping, control,
  or selection relationship.
- Use boundary collision or penetration only when it joins adjacent surfaces
  without obscuring their current value or available action.
- Preserve calm negative space around dense information; do not manufacture
  empty space by shrinking the information itself.
- Product clarity and internal consistency outrank spectacle.


## Change Protocol

### Experiment Baseline Gate

An isolated UI experiment may remove unrelated page chrome, data wiring, and
surrounding surfaces. It must not reduce the selected surface to static labels
or silently change an interaction merely because the experiment is temporary.

Before producing comparable variants, record one small reference-state
contract from the applicable authorities and the current consumer:

- list every in-scope setting, its visible current value, its available user
  action, and the representative closed, open, selected, disabled, hover, or
  focus states needed to judge its footprint;
- classify each item as preserved baseline, explicit experiment variable, or
  out of scope;
- identify a current implementation that differs from the presentation
  authority as a named authority-conformance correction rather than silently
  preserving or changing it; and
- name the one comparison question each set of variants is intended to answer.

Comparable variants keep all undeclared content, state, behavior, peer sizing,
and control grammar fixed. A static value, focusable container, or `Change`
label is not evidence that a selector has been represented. When selector
presentation is in scope, show the current closed selection and enough of its
candidate state to judge the local opening, candidate footprint, and available
action. A minimal fixture may isolate one Setup, but it still carries every
input and interaction state needed by that Setup comparison.

The controller performs a semantic parity check before judging typography,
color, geometry, clipping, or overflow. Compare the experiment with the current
consumer and the applicable authority input by input. An omitted action,
undeclared control redesign, or unresolved authority-to-runtime difference
blocks visual review even when the artifact renders cleanly.

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
- zero, one, two, and three currently offered effective-substat hit counts,
  including the complete zero-input empty scaffold, selected-pressure removal
  and reappearance that restores the input at zero without restoring its prior
  count, plus a separately missing required count that remains visibly
  incomplete;
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
- displaying Mindscape in Agent Identity or varying Identity color by
  Mindscape;
- letting Agent art or saturated Identity surfaces take visual priority from
  Setup and Result;
- appending missing Setup inputs into leftover footer space instead of
  recalculating the complete Setup footprint;
- forcing a width-dependent horizontal equipment composition into a narrow
  Setup surface by shrinking its content;
- allowing a horizontal swipe plane around the workbench; and
- promoting mockup pixel values or geometry into permanent product meaning.
