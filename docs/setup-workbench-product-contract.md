# Setup Workbench Product Contract

Status: product-behavior authority for the setup workbench foundation.

## Purpose

The service is a Zenless Zone Zero party setup workbench centered on calculated
values, comparisons, graphs, and images. The user selects a three-Agent party,
receives a complete competitive starting setup prepared for each Agent's
current Mindscape, party, and W-Engine availability pool, and adjusts those
inputs while inspecting how the current party changes all three Agents'
applicable stats and modifiers. A complete prepared party shows Result
immediately. If any required setup selection is incomplete, Result remains
empty. Expanded Result rows visually decompose the current numeric value into
its contributing amounts and concise source identities.

This document defines product behavior, not runtime, transport, storage, or UI
architecture.

## Authority Boundary

| Owns | Does not own |
| --- | --- |
| workbench outcomes, setup policy, selection completeness, session behavior, display surfaces, party distribution and applicability order | game-term meaning, formula-frame meaning, source-fact retention, records, API, UI implementation |

Game terms belong to `docs/zzz-game-vocabulary.md`. Formula mechanics belong to
`docs/zzz-formula-mechanics.md`. Source-fact retention belongs only to
`docs/source-fact-boundary.md`.

## Workbench Dependency

Meaning flows in one direction:

1. completed Agent facts and Mindscape-qualified values;
2. setup direction, roles, formula relationships, and candidate policy;
3. effective candidates for the current context and already-established
   upstream effects;
4. authored first choices and one complete prepared starting setup;
5. current editable selections;
6. the complete-selection gate;
7. three-surface calculation and recipient-aware composition; and
8. visual Result projection.

A Result, test, UI label, current selection, or candidate order cannot create an
earlier fact or policy. Prepared first choices come from authored competitive
policy. Session logic may resolve those choices for the current context, but it
does not rank arbitrary equipment or optimize a package from Result output.

## Setup Policy

### Service Investment Boundary

- Agent level, Core Passive, and available Potential Awakening use completed
  values. Partial ordinary progression and farming state are not inputs.
- Ordinary-skill investment and level are not editable inputs. When a retained
  setting effect reads an ordinary skill table, the selected Mindscape resolves
  only the completed levels used by the current consumer: M0-M2 uses level 12,
  M3-M4 uses level 14, and M5-M6 uses level 16. Effects whose retained values do
  not change across those levels keep one fixed value.
- Agent ownership and Mindscape, and W-Engine ownership and refinement, vary by
  account. The consumer represents these through admitted Agents, editable
  Mindscape and refinement, and full/non-limited W-Engine pools.
- One setup has one W-Engine, one Drive Disc 4-piece set, one different 2-piece
  set, legal Slot 4/5/6 main stats, and aggregate effective substat hit counts.
  A `2-piece + 2-piece + 2-piece` composition is outside the service.

The service does not model incomplete growth, farming cost, material inventory,
individual Disc inventory, or paid-currency budget. It presents competitive,
materially distinct candidates rather than every legal item.

### Fixed Investment And Input Defaults

Agents are level 60, Core Passive is maximum, and Potential Awakening is maximum
when present. W-Engines are level 60. Drive Discs are level 15 S-Rank items.

Potential Awakening remains completed progression rather than an input. Source
attribution for its retained clauses belongs to
`docs/source-fact-boundary.md`.

| Identity | Initial editable value |
| --- | --- |
| S-Rank Agent | M0 |
| A-Rank Agent | M6 |
| selected S-Rank W-Engine | W1 |
| selected A-Rank W-Engine | W5 |

Mindscape is already selected when an Agent enters setup editing and remains
editable. Changing it resolves any retained skill-table value for its level
tier and initializes that Agent with the complete prepared setup for the new
Mindscape, current party, and current pool. The other two Agents keep their
editable setups, while all three Results are recalculated from the changed
party contribution. Mindscape does not change direction, roles, formula
relationships, pools, or focus eligibility.

The three ordinary-skill levels are derived qualifiers, not another setup input,
Result row, or complete skill-level model. They do not admit ordinary action
coefficients, raw damage or Daze, or values for unused skill levels.

Choosing a W-Engine applies its Rank default refinement. Refinement changes
current values but not candidate membership. S-Rank and A-Rank W-Engines are
supported; B-Rank is outside the product.

Effective substat hit counts begin at zero after their inputs are available.
Zero means no user-supplied substat investment, not a recommendation. Each count
is an integer from 0 through 36; the service derives neither a smaller dynamic
maximum nor a hard sum limit.

### Setup Direction And Roles

A setup direction is prepared policy for one materially distinct way to build
and operate an Agent. It determines roles, supported actions and formulas,
focus eligibility, and candidate policy. The service admits at most one
direction per Agent and does not expose direction selection.

| Setup role | Strengthened contribution |
| --- | --- |
| damage contributor | personal damage intentionally strengthened |
| daze contributor | Daze contribution intentionally strengthened |
| buffer | party-facing stat or modifier contribution intentionally strengthened |

A role belongs to the authored direction rather than to one source container.
Agent facts and admitted equipment can each realize that role when their whole
package intentionally strengthens its contribution. A kit or equipment effect
does not grant a role by existence alone. Specialty is a game identity, not a
setup role or formula family. Focus eligibility is separate prepared policy and
requires both the damage-contributor role and supported operation as the fixed
on-field damage-concentration observation point.

A direction can combine roles and can support more than one of the formula
families owned by `docs/zzz-formula-mechanics.md`. Role and formula remain
separate: a damage contributor may use an applicable damage family; a direction
that supports anomaly output may need both anomaly damage and anomaly buildup;
and a daze contributor uses Daze buildup. A buffer may change components read
by several recipient formula families while its own preparation is driven by
an initial-stat relationship, threshold, cap, Energy operation, or another
retained local relationship rather than by a separate buffer formula family.

Candidate preparation strengthens the direction's roles first. A direction
without the damage-contributor role does not retain personal-damage W-Engine,
Drive Disc, effective-substat, or Mindscape cases merely because they are legal
or improve damage. For each role, candidate policy considers the applicable
formula components and retained scaling relationships together with the setup
inputs that can actually supply them. A role's valid stat can therefore have
different opportunity cost across W-Engine, set, main-stat, and substat inputs.

When a variable main-stat slot offers no stat that strengthens the direction's
roles or retained relationships, current competitive residual personal-damage
choices may remain for that slot without creating a damage-contributor role or
personal-damage Result. This residual exception is limited to variable main
stats. It does not admit a personal-damage W-Engine, 4-piece, 2-piece,
effective substat, or Mindscape case for a direction without the damage-
contributor role.

### Candidate Preparation Dependency

Candidate authoring follows this order:

1. establish completed Agent facts and Rank-default Mindscape;
2. establish direction, roles, actions, retained operations, formulas,
   conversions, thresholds, caps, and exclusions;
3. use recurring role, formula, action, stat-pressure, and Specialty patterns
   to restrict inspection;
4. compare remaining packages against that Agent's exact kit, activation,
   opportunity costs, availability, and current competitive practice;
5. retain only materially distinct authored base candidates;
6. derive current effective candidates through only authored Mindscape, party,
   focus, pool, or active-effect adjustments in the explicit acyclic order
   below; and
7. author the deterministic first choices from those effective candidates
   needed to prepare one complete setup.

Candidate-bearing setup inputs are W-Engines, 4-piece sets, 2-piece sets,
variable main-stat slots, and effective-substat offerings. This term describes
where candidate policy makes a choice; it does not rename an Agent investment
axis or formula component. Candidate policy has three ordered stages:

1. the **authored base candidate set** contains the materially distinct choices
   admitted for one candidate-bearing setup input after direction, role,
   formula, action, operation, whole-package, and opportunity-cost review;
2. the **current effective candidate set** for one input applies the current
   Mindscape, party, focus, pool, and effects produced by only already-
   established upstream selections, together with recipient, Attribute,
   action, and formula applicability, to that authored base; and
3. the **prepared first choice** selects one authored representative only from
   the current effective set during an authorized preparation transition.

Each Agent direction settles the role-strengthened formula families, using the
[Formula-Family Stat Consequences](zzz-formula-mechanics.md#formula-family-stat-consequences),
and any formula family admitted only through the residual-main-stat exception.
It also settles canonical action or output coverage only where that coverage
changes a whole package's usability, candidate membership, or prepared first choice.
Direction-defining output coverage is an authored competitive-practice
judgment. It is not runtime action share, uptime, rotation, or a reason to keep
a global action catalogue.

Within one candidate-bearing setup input, a candidate is dominated only when
its whole usable package expresses no materially distinct role, formula,
action, or operation axis beside a stronger candidate. Choices that strengthen
different axes remain comparable when both materially support the direction;
their relative preference normally selects the prepared first choice rather
than changing membership. Fixed supply from an earlier selected package may
change pressure on a later input without merging their candidate sets or
ranking arbitrary combinations.

Patterns order inspection but cannot inherit another Agent's result. New items
are routed first to roles, formulas, actions, stat pressures, and Specialties
that can consume them; unrelated Agents do not require full re-derivation.

For W-Engines, inspect matching-Specialty packages first and compare Base ATK,
advanced stat, and usable passive together at S-Rank W1 or A-Rank W5. No one
package component is an automatic gate. An unused advanced stat or passive
clause is an opportunity cost in the whole-package comparison, not an automatic
rejection. An off-Specialty package remains Agent-local and survives only when
its usable whole package is competitive for the current direction.

A 4-piece Disc needs a material core effect; a 2-piece needs a competitive
complement beside a different 4-piece; a main stat must be legal and survive
slot opportunity cost; and an effective substat must materially strengthen a
supported setup-tuning axis after current stat supply, thresholds, caps,
conversions, and alternatives. Disc admission and preparation compare a
complete legal package: the selected 4-piece set's inherent 2-piece effect and
4-piece effect together with the different selected 2-piece complement. A Disc
candidate survives in one piece role only when it participates in at least one
materially competitive complete package.

Main-stat and effective-substat candidates begin from the Agent's direction,
roles, formulas, and current Agent sources. Do not re-derive the whole candidate
set from every party and equipment combination. A selected equipment effect may
create a bounded stat pressure when that stat changes the direction's current
choice or Result. In that case, evaluate the competitive setup inputs that can
supply the stat. A threshold alone does not admit every supplier: main-stat
slot cost, substat competition, set-piece opportunity cost, and whole-package
equipment value still apply.

Competitive candidates are choices still worth comparing in the current setup
context, not every stat whose numerical contribution remains positive. An
active provider effect may therefore carry an authored candidate-pressure
meaning after recipient, action, formula, and current competitive practice are
resolved. Candidate policy consumes that meaning rather than the provider's
Agent, W-Engine, or Disc identity, its Result row, or a runtime score.

Every researched current setup pressure ends in exactly one setup-policy
outcome: no setup change, a prepared-choice-only adjustment, or a candidate-
membership adjustment. A prepared-choice-only adjustment is consumed only
during an authorized preparation transition and never overwrites a direct edit.
A membership adjustment is reevaluated for the current session and may
invalidate an edited selection under the lifecycle below. Persist only the
bounded settled predicate and choice needed by the current consumer, never a
score, ranking, research receipt, or provider-identity branch.

The current candidate-membership adjustment admits material **broad** pre-PEN
DEF Reduction or DEF Ignore as pressure that may remove Slot 5 PEN Ratio from
an applied setup whose authored direction admits residual or primary general-
damage investment and therefore consumes the DEF region. Breadth is the current
admission boundary, not a universal proof of materiality. A limited action-
scoped pre-PEN modifier does not remove PEN Ratio merely because it precedes
PEN in the formula; it may affect an explicitly authored prepared preference
when it covers direction-defining output, but a future scoped membership
adjustment requires a new current consumer and product decision before the
qualifier is expanded. A broad or numerically large modifier likewise does not
establish exclusion without that authored policy. A direction whose damage
family omits the DEF region never admits PEN Ratio from this rule. The current
broad Spectral Gaze pressure removes PEN Ratio for applicable Anby, Dialyn, and
Trigger setups, while Cordis Germina's Basic/Ultimate-only DEF Ignore does not
do so by itself. This is authored candidate policy, not a numerical threshold
or action-share calculation inferred at runtime.

For example, under the legal main-stat and substat pools owned by
`docs/zzz-game-vocabulary.md`, a Stun direction can exhaust its direct Daze
stat supply without using every editable investment position: Impact is
available as a Slot 6 main stat, while Impact and Daze Bonus are not Drive Disc
substats and Daze Bonus is not a main stat. A 4-piece package that retains a
Daze 2-piece effect and links the holder's CRIT Rate threshold to a party-
facing modifier can therefore strengthen both daze-contributor and buffer
roles. Current candidates may then
include Slot 4 CRIT Rate, CRIT Rate effective-substat hits, and a competitive
2-piece CRIT Rate set because they supply the buffer threshold or another
retained CRIT-derived relationship, not because they provide residual personal
damage. The 2-piece identity is a result of supplying that pressure, not a named
exception. A W-Engine that supplies CRIT Rate still passes the normal Base ATK,
advanced stat, passive, and availability comparison rather than entering
automatically.

Candidate membership is itself a user-visible setup outcome. It does not need a
paired calculated output merely to justify its presence. Do not invent a
personal-damage or raw-Daze Result to retain an otherwise competitive residual
main-stat choice.

Most Mindscape and party changes narrow candidates. Addition is exceptional and
requires a newly material external contribution or operation. A recipient-
applied Ultimate opportunity can add an authored Puffer Electro 4-piece case
for an applicable crit-capable general-damage direction; it does not select it.

New equipment normally enters as a competing W-Engine, 4-piece, or 2-piece
candidate and may change the prepared main-stat choice through its stat package.
Reconsider an effective-substat candidate only when the new equipment creates a
competitive stat pressure after the Agent's existing retained stat-supply
choices and opportunity costs are applied.

### Competitive Candidate Set

Candidate membership is product policy, not runtime ranking. A candidate remains
only when its whole usable package creates a material choice. Limited ownership,
accessibility, stat or modifier balance, thresholds, caps, operation, or a
supported preference may distinguish it. Reachability, signature association,
a different trigger, or an isolated clause is insufficient.

Compare fully usable W-Engines before partial packages. A partial package may
remain when its usable portion creates a material alternate setup or operation
after its unused portion is charged as opportunity cost. Compare fallbacks
against the nearest package in the same availability and ownership context, and
compare limited fallbacks with each other. Keep the stronger representative when
two partial packages express the same direction; keep both only when their
whole packages create materially different current choices. This applies in
both pools: a non-limited S-Rank package is not rejected merely because its
advanced stat is unused when its usable passive remains competitive. Candidate
count is never a target, and the workbench does not expose every viable
fallback.

Individual viability is not enough. Numerical difference alone creates no
cutoff. Candidate count is not a target. A direction's valid stat pressure keeps
only stats that materially support a role or a stat-derived relationship the
Result actually exposes. Formula participation alone is insufficient. Flat PEN
is not current valid stat pressure, an effective substat, or a Result row; PEN
Ratio is separate.

### Prepared Starting Setup

Preparation supplies one deterministic first choice from the current effective
candidates for the Agent, Mindscape, party, focus, and availability pool. It
chooses a W-Engine and Rank-default refinement, a 4-piece set, a different
2-piece set, legal Slot 4/5/6 main stats, and zero for every offered effective-
substat hit count.

The first choice is authored competitive policy, not a runtime score. Resolve
the W-Engine and Disc package before choosing main stats so their fixed stat
supply, usable effects, thresholds, caps, and slot opportunity costs can change
the prepared choice. Do not assume undisclosed substat investment. Zero counts
mean no user-supplied substat investment, not a recommendation to avoid those
stats.

Authorized preparation resolves these dependencies in two acyclic layers.
First derive context-effective W-Engine and complete-Disc candidate sets from
the applied directions, each package's own usable effects, party allocation or
compatibility, and already-established context that does not depend on an
unresolved equipment selection. Consume any authored prepared-choice-only
adjustment for those inputs, then choose the W-Engine and complete Disc package.
Second resolve active pressure from the established party and selected
equipment, derive non-empty downstream main-stat and effective-substat
candidate sets, choose main-stat first choices, and initialize every offered
effective-substat count to zero. Every prepared choice must belong to its
effective set at the point that input is resolved.

Pressure may target only a later input in this order. A preference or candidate
set that depends on pressure produced only by that same unresolved input, by a
later input, or by a choice it would invalidate is an authoring stop requiring
a new product decision. Do not add a fallback, iteration, fixed-point solver,
or automatic restoration to cross that boundary.

Prepared setup is an initialization point, not a rule that continuously
overwrites edits. Direct W-Engine, refinement, Disc, main-stat, and substat
edits keep the other current inputs unless a selected-input dependency changes
their available candidates. A selected equipment effect may add or remove only
the setup candidates justified by its current stat pressure.

A direct edit that changes candidate pressure does not prepare the provider or
any recipient. The session reevaluates effective candidates for the applied
party in one pass, clears every selected input that is no longer admitted, and
keeps all unrelated current inputs. It chooses no fallback and restores no
previous selection automatically. Result remains empty until every invalidated
required selection is repaired or a later authorized preparation supplies an
authored first choice.

### W-Engine Availability Pools

- **full pool** includes every admitted W-Engine, including limited S-Rank;
- **non-limited pool** excludes limited S-Rank while retaining admitted non-
  limited S-Rank and A-Rank engines.

Pool defaults to full. Initial preparation selects the authored first choice
from that pool. Switching pools initializes that Agent with the complete
prepared setup for the target pool, including zero effective-substat counts.
The initial product keeps no separate edited setup for each pool.

### Complete Setup Selection

A setup is complete only when it has selected Mindscape and pool, one W-Engine
and refinement, different Drive Disc 4-piece and 2-piece sets, legal Slot 4/5/6
main stats, and a count for every offered effective substat.

A party Result is calculated only when all three setups are complete. Before
then, Result surfaces are empty. A prepared setup is a visible current
selection, not a placeholder, first-candidate fallback, or hidden
recommendation.

When the selected 4-piece identity is also an authored 2-piece candidate, it
already supplies its own 2-piece effect and is omitted from the displayed
2-piece alternatives. A normal 2-piece selection changes only the 2-piece set.
Only a 4-piece selection can initiate an atomic role swap: selecting the current
2-piece set as 4-piece swaps the two current identities when the prior 4-piece
set is admitted as a 2-piece candidate. Otherwise that conflicting 4-piece
alternative is not offered. The workbench never chooses a third set.

Changing one Agent's Mindscape or pool initializes only that Agent with the
corresponding prepared setup. Changing party composition or focus initializes
all three Agents for the new party context. Direct setup edits do not reset the
whole setup. Clearing or invalidating a required selection returns the party to
incomplete and removes Result until completion.

Target-only preparation does not limit effect or candidate reevaluation to the
changed Agent. After a Mindscape or pool preparation, the session reevaluates
active effects and effective candidates for all three applied setups. Other
Agents are not prepared again; only their now-invalid dependent selections are
cleared together. Preparing or repairing only one affected Agent does not
restore Result while another required selection remains incomplete.

## Party Context And Recipient Distribution

The user selects three distinct admitted Agents. Exactly one focus-eligible
member is selected automatically; multiple require user choice; none leaves the
draft in party composition. The focused character is the fixed on-field damage-
concentration observation point and recipient of controllable one-member setup
effects. Other members may briefly act for supported triggers without changing
focus.

Fully enabled composition proceeds in this order:

1. establish enabled value from current party and focus;
2. distribute to self, focus, all party members, other party members, or enemy;
3. evaluate recipient-specific applicability;
4. evaluate action/Attribute scope and formula applicability; and
5. include only contributions that change that Agent's Result.

Attribute applicability remains internal. Result presents the value applicable
to the current Agent without `Ice only`-style copy.

Applying a changed party or focus creates a new party context and initializes
all three Agents with their complete prepared setups. Each Agent receives its
Rank-default Mindscape and full pool when newly admitted; an unchanged Agent
keeps its current Mindscape and pool before its setup is prepared for the new
context. A departed Agent has no hidden working copy. Derived Results are
discarded and recalculated from the three new current setups.

## Display Surfaces

| Display surface | Meaning |
| --- | --- |
| initial stats | setup values before combat effects and the basis for sources reading an initial stat |
| combat baseline | values available once combat exists without a new post-entry trigger or state change |
| fully enabled party window | mutually compatible enabled values intentionally reachable by the selected party and setups |

A new action, hit, stack, target state, or other event places a clause in fully
enabled rather than combat baseline. One source may contribute different clauses
to different surfaces.

### Observable Result Information

For each complete setup, Result visually exposes current inputs and candidates;
setting-relevant stats and modifier regions; atomic amounts with concise source
identities and earliest surface; action aggregates only when they differ;
stat-derived bases with linked buff, conversion, threshold, or cap outputs;
source-stated DMG Multiplier and Daze Multiplier modifier operations for retained
actions;
threshold/cap state; and changes caused by visible inputs or party context.

Expanded numeric breakdown is the explanation surface. Guide URLs, source
wording, candidate rationale, activation prose, historical deltas, and narrative
explanations are not stored or displayed.

Aggregates remain reproducible from their complete internal atomic
contributions. Consumer disclosure is not an exhaustive ledger: it omits the
completed-progression Agent base value, fixed Slot 1/2/3 Drive Disc main stats,
and W-Engine Base ATK while retaining them in calculation. When a retained
source defines a percentage input, disclosure shows that percentage rather than
substituting the derived absolute increase; the aggregate still shows the
calculated final value.

An Energy Regen row shows current automatic Energy recovered per second on
each surface. Its aggregate includes the composed Energy Regen stat and every
applicable per-second Energy operation, using the composition owned by formula
mechanics. Expanded breakdown preserves a percentage stat source and a `/s`
operation as distinct atomic amounts. A one-time Energy gain remains a separate
operation and does not change the row.

A retained relationship that is independently evaluated from each display
surface's current inputs shows its complete current contribution in every
surface column, without a positive sign. A direct source addition remains an
incremental signed amount on the surface where that atomic amount first becomes
available.
This lets one expanded row distinguish a continuing formula contribution from
a newly enabled additive effect without introducing history or activation
prose.

Action scope can create expanded action rows but not a second Result surface or damage model.
The Result does not expose an action's ordinary skill level, base DMG
Multiplier, base Daze Multiplier, `base_damage`, `skill_daze`, or final damage or
Daze. When an applicable source independently modifies an existing action's DMG
Multiplier or Daze Multiplier, Result exposes only the source-stated added amount
or scale factor and its source breakdown. A skill-table coefficient that creates
part of the action's damage or Daze is excluded even when another source adds it.
Retained modifier operations remain separate from regular DMG Bonus and Daze
Bonus.
Attribute scope stays internal. CRIT Rate alone displays
`min(calculated CRIT Rate, 100%)`; uncapped detail never feeds preparation.
Calculations use decimal precision and presentation rounding never feeds back.

## Fully Enabled Party Window

This is a setting-tuning surface, not a rotation or damage simulator. Include a
condition only when compatible, intentionally activatable, reachable, and
Result-changing. Difficulty, duration, maintenance, frequency, and rotation
share do not reduce the enabled value.

A legal repeatable trigger route reaches the stack cap unless exact mechanics
require distinct categories. Do not infer partial stacks from listed action
count, uptime, or frequency. Leave unresolved reachability unimplemented.

Bangboo is not an input or fourth Agent. A Bangboo action may satisfy
reachability only when the resulting value is independent of Bangboo choice.
Kaboom the Cannon therefore reaches four stacks and 16% ATK at W5 when
applicable.

For identical non-stacking effects, resolve sources independently and apply one
highest reachable value per recipient, preserving equal applied origins for
numeric breakdown. Do not model sequential replacement.

## Static Preparation And Dynamic Session

Static preparation owns completed facts, direction, roles, focus eligibility,
candidate policy, authored first choices, bounded predicates, and availability.
Session owns party, focus, pool, Mindscape, refinement, editable selections,
prepared initialization, completeness, recipient resolution, calculation, and
Result.

Session may evaluate authored alternatives, compose selected-equipment stat
pressure with current setup candidates, and resolve the authored prepared
setup. It cannot invent candidates, assign runtime equipment scores, optimize a
package from Result output, or feed Result back into preparation.

## User Flow Contract

Party editing creates a draft without changing the applied party, focus,
setups, or Result. The applied Result remains visible while the user changes
the draft. Cancel discards only the draft and leaves the applied state
unchanged. Apply commits the resolved draft party and focus, then prepares all
three Agents for that new context and recalculates Result. Before any party has
been applied, there is no prior setup or Result to preserve while composing the
initial draft.

1. Select three distinct admitted Agents and resolve focus.
2. Prepare all three Agents for the current party using Rank-default Mindscape,
   full pool, authored equipment and main-stat first choices, and zero effective
   substat counts.
3. Display the complete party Result immediately.
4. Mindscape appears first with modest emphasis but is not a confirmation gate.
5. Edit W-Engine/refinement, Disc 4-piece/2-piece, Slot 4/5/6 main stats, and
   effective substat counts for any Agent.
6. A selected equipment effect may update dependent setup candidates without
   preparing any Agent, selecting a fallback, or resetting unrelated current
   inputs. Multiple invalid dependent selections clear in the same transition.
7. Changing one Agent's Mindscape or pool prepares only that Agent again.
   Active effects and effective candidates are still reevaluated for the whole
   applied party; other Agents keep valid edits and lose only invalid dependent
   selections.
8. Applying a changed party or focus prepares all three Agents again.
9. Every edit to an applied setup or party context discards derived output and
   either recalculates the complete party or returns to the empty-Result state
   if a required selection is incomplete.
10. Expanded rows show numeric breakdown, action differences, and gauges without
    a narrative explanation surface.

## Current Non-Goals

- provider ingestion, universal schemas, source registries, or persisted output;
- API, persistence, authentication, deployment, or hidden build history;
- multiple setup directions, runtime equipment scoring, universal package
  optimization, or per-pool edited-setup memory;
- damage totals, rotations, uptime, action frequency, average stacks, clear time,
  enemy-specific optimization, editable ordinary-skill levels, complete skill
  tables, base action coefficients, or raw action damage and Daze; and
- a complete catalogue of mechanics, Agents, equipment, or releases.
