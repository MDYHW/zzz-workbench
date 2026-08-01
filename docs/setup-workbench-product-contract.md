# Setup Workbench Product Contract

Status: product-behavior authority for the setup workbench foundation.

## Purpose

The service is a Zenless Zone Zero party setup workbench centered on calculated
values, comparisons, graphs, and images. The user selects a three-Agent party,
chooses each Agent's competitive setup inputs, and inspects how the current
party changes all three Agents' applicable stats and modifiers. The service
shows no Result until every required setup selection is complete. Expanded
Result rows visually decompose the current numeric value into its contributing
amounts and concise source identities.

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
3. effective candidates for current Mindscape, party, and availability pool;
4. user selections;
5. the complete-selection gate;
6. three-surface calculation and recipient-aware composition; and
7. visual Result projection.

A Result, test, UI label, current selection, or candidate order cannot create an
earlier fact or policy. The service never chooses a W-Engine, Drive Disc, or
main stat on the user's behalf.

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

Potential Awakening is applied to the Core Passive, Additional Ability, or skill
source it changes. It is not a separate input or Result source identity.

| Identity | Initial editable value |
| --- | --- |
| S-Rank Agent | M0 |
| A-Rank Agent | M6 |
| selected S-Rank W-Engine | W1 |
| selected A-Rank W-Engine | W5 |

Mindscape is already selected when an Agent enters setup editing and remains
editable. Changing it re-evaluates candidates, clears only selections no longer
admitted, resolves any retained skill-table value for its level tier, and
recalculates only when the whole party remains complete. It does not change
direction, roles, formula relationships, pools, or focus eligibility.

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

A kit effect does not grant a role by existence alone. Specialty is a game
identity, not a setup role or formula family. Focus eligibility is separate
prepared policy and requires both the damage-contributor role and supported
operation as the fixed on-field damage-concentration observation point.

Candidate preparation strengthens the direction's roles first. A direction
without the damage-contributor role does not retain personal-damage W-Engine,
Drive Disc, effective-substat, or Mindscape cases merely because they are legal
or improve damage. When a variable main-stat slot offers no stat that
strengthens the primary role, current competitive residual choices may remain
for that slot without creating a damage-contributor role or personal-damage
Result.

### Candidate Preparation Dependency

Candidate authoring follows this order:

1. establish completed Agent facts and Rank-default Mindscape;
2. establish direction, roles, actions, formulas, conversions, thresholds,
   caps, and exclusions;
3. use recurring role, formula, action, stat-pressure, and Specialty patterns
   to restrict inspection;
4. compare remaining packages against that Agent's exact kit, activation,
   opportunity costs, availability, and current competitive practice;
5. retain only materially distinct candidates; and
6. apply only authored Agent-local Mindscape or party adjustments.

Patterns order inspection but cannot inherit another Agent's result. New items
are routed first to roles, formulas, actions, stat pressures, and Specialties
that can consume them; unrelated Agents do not require full re-derivation.

For W-Engines, inspect matching-Specialty packages first and compare Base ATK,
advanced stat, and usable passive together at S-Rank W1 or A-Rank W5. Advanced
stat is equal package meaning. An off-Specialty advanced-stat-only exception is
Agent-local and survives the same whole-package comparison.

A 4-piece Disc needs a material core effect; a 2-piece needs a competitive
complement beside a different 4-piece; a main stat must be legal and survive
slot opportunity cost; and an effective substat must materially strengthen a
supported finite-investment axis after supply, thresholds, caps, conversions,
and alternatives.

Candidate membership is itself a user-visible setup outcome. It does not need a
paired calculated output merely to justify its presence. Do not invent a
personal-damage or raw-Daze Result to retain an otherwise competitive residual
main-stat choice.

Most Mindscape and party changes narrow candidates. Addition is exceptional and
requires a newly material external contribution or operation. A recipient-
applied Ultimate opportunity can add an authored Puffer Electro 4-piece case
for an applicable crit-capable general-damage direction; it does not select it.

### Competitive Candidate Set

Candidate membership is product policy, not runtime ranking. A candidate remains
only when its whole usable package creates a material choice. Limited ownership,
accessibility, stat or modifier balance, thresholds, caps, operation, or a
supported preference may distinguish it. Reachability, signature association,
a different trigger, or an isolated clause is insufficient.

Compare fully usable W-Engines before partial packages. Compare fallbacks against
the nearest package in the same availability and ownership context, and compare
limited fallbacks with each other. Keep only materially distinct
representatives; do not expose every viable fallback.

Individual viability is not enough. Numerical difference alone creates no
cutoff. Candidate count is not a target. A direction's valid stat pressure keeps
only stats that materially support a role or a stat-derived relationship the
Result actually exposes. Formula participation alone is insufficient. Flat PEN
is not current valid stat pressure, an effective substat, or a Result row; PEN
Ratio is separate.

### W-Engine Availability Pools

- **full pool** includes every admitted W-Engine, including limited S-Rank;
- **non-limited pool** excludes limited S-Rank while retaining admitted non-
  limited S-Rank and A-Rank engines.

Pool defaults to full and only filters candidates. It never selects an engine.
Switching pools keeps the current W-Engine if admitted and otherwise clears it.
Other admitted setup inputs and substat counts remain unchanged.

### Complete Setup Selection

A setup is complete only when it has selected Mindscape and pool, one W-Engine
and refinement, different Drive Disc 4-piece and 2-piece sets, legal Slot 4/5/6
main stats, and a count for every offered effective substat.

A party Result is calculated only when all three setups are complete. Before
then, Result surfaces are empty. The service never uses placeholders, the first
candidate, a remembered recommendation, or a hidden fallback.

If selecting a Disc set already used by the other piece role can swap the two
currently admitted sets, the workbench swaps them atomically. Otherwise it
rejects the conflict rather than choosing a third set.

There is no prepared setup reset. An edit changes its input and directly
invalidated dependents only. Clearing or invalidating a required selection
returns the party to incomplete and removes Result until completion.

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

Party replacement preserves unchanged Agents' selections only while admitted.
Invalid selections are cleared. An incoming Agent receives Rank-default
Mindscape, full pool, empty equipment/main stats, and zero substat counts when
available. A departed Agent has no hidden working copy. Focus changes follow the
same preservation rule. Derived Results are always discarded and recalculated
only if all three setups remain complete.

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

Aggregates remain reproducible from atomic contributions. Action scope can
create expanded action rows but not a second Result surface or damage model.
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
candidate policy, bounded predicates, and availability. Session owns party,
focus, pool, Mindscape, refinement, editable selections, completeness,
recipient resolution, calculation, and Result.

Session may evaluate authored alternatives and clear invalid selections. It
cannot invent candidates, rank equipment, choose a package, or feed Result back
into preparation.

## User Flow Contract

1. Select three distinct admitted Agents and resolve focus.
2. Each incoming Agent receives Rank-default Mindscape and full pool; equipment
   and main-stat selections are empty.
3. Mindscape appears first with modest emphasis but is not a confirmation gate.
4. Select W-Engine/refinement, Disc 4-piece/2-piece, Slot 4/5/6 main stats, and
   effective substat counts for all three Agents.
5. Authored Mindscape and party predicates re-evaluate membership. Invalid
   selections clear rather than substitute.
6. Until all required selections are complete, display no Result.
7. Once complete, calculate all Agents across the three surfaces using recipient
   distribution and internal action/Attribute applicability.
8. Every edit discards derived output and either recalculates or returns to the
   empty-Result state.
9. Party replacement initializes the incoming Agent as incomplete and preserves
   valid selections for unchanged Agents.
10. Expanded rows show numeric breakdown, action differences, and gauges without
    a narrative explanation surface.

## Current Non-Goals

- provider ingestion, universal schemas, source registries, or persisted output;
- API, persistence, authentication, deployment, or hidden build history;
- multiple setup directions, runtime ranking, or automatic setup generation;
- damage totals, rotations, uptime, action frequency, average stacks, clear time,
  enemy-specific optimization, editable ordinary-skill levels, complete skill
  tables, base action coefficients, or raw action damage and Daze; and
- a complete catalogue of mechanics, Agents, equipment, or releases.
