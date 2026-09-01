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

## Stable Rule Identifiers

High-risk cross-cutting rules in this owner use the `SW-###` namespace. The
prefix is reserved to this file, and the number is an immutable reference label
rather than another rule or an expansion of the labeled section. Do not assign
these identifiers to Agent-local facts, examples, or ordinary explanatory
paragraphs.

Within the `SW-###` namespace, allocate numbers monotonically and never reuse
one. A heading move or wording clarification that preserves the same meaning
keeps its identifier. If an `SW-###` rule's meaning boundary splits, merges,
moves to another owner, or retires, reserve the old identifier under a local
`Retired Rule IDs` heading as `SW-### -> <successor IDs or none>: <reason>` and
allocate new owner-prefixed identifiers to every resulting current rule.

## Retired Rule IDs

`SW-007 -> SW-018, SW-019, SW-020`: the former rule combined variable-main-
stat opportunity, effective-substat opportunity, and context-effective
candidate changes in one meaning boundary.

## Workbench Dependency

**Rule ID:** `SW-001`

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

**Rule ID:** `SW-002`

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

#### Finite Effective-Substat Input Boundary

**Rule ID:** `SW-003`

Effective substat hit counts begin at zero after their inputs are available.
Zero means no user-supplied substat investment, not a recommendation. Each count
is an integer from 0 through 36 as a fixed editor boundary. This range does not
claim that every independent combination is attainable on six exact Discs. The
service derives neither preview-specific maxima nor a hard sum limit and does
not model individual Disc lines, enhancement allocation, main-stat exclusion,
or farming probability.

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

### Candidate Authoring

#### Agent Outcome Relationship Gate

**Rule ID:** `SW-017`

Every candidate-bearing setup input derives usable source value through the
same current Agent outcome relationships before applying its surface-specific
competitive rule. A source contribution has usable value only through at least
one retained relationship:

- a **basis, threshold, or conversion relationship**, where supplied stat
  value changes another retained outcome or preparation boundary;
- a **delivery-topology relationship**, where an action or operating interval
  delivers retained Daze, damage, buff, or another setup outcome;
- a **role-resource relationship**, where Impact, Energy, or another retained
  resource materially enables that delivery or outcome; or
- an **external-outcome relationship**, where a party- or enemy-facing effect
  reaches an exact current recipient and applicable formula.

Specialty, Attribute, holder, activation, action, recipient, interval, and
other source-local qualifiers gate each contribution independently. They do
not create a competitive axis by themselves. A contribution that fails its
gate adds zero usable value and receives no penalty; complete and partial
packages use the same relationship test. Passing that test proves only usable
value. The applicable input rule must still compare its complete setup, finite
opportunity, nearest usable same-axis alternative, material setup direction,
acquisition or allocation role where applicable, and a countercase that would
reverse the conclusion before admission, compression, or representative
authoring.

For a W-Engine passive or Drive Disc 4-piece clause whose realized value
depends on activation, affected action, interval, or operation, source
reachability and operation-aligned candidate value are separate gates. An
exact retained holder action or state, or an intentionally controllable party
operation, establishes source reachability when it satisfies the source-local
qualifiers. Do not add an in-combat, duration, frequency, action-share,
rotation, or uptime condition that the source does not state.

The reachable route contributes candidate value only when it belongs to the
Agent's authored delivery topology or an intentionally controlled party
operation used by the current direction, without inserting, repeating, or
displacing a material core action solely to activate the equipment. A reachable
but operation-misaligned clause adds zero usable value, establishes no
competitive axis, and cannot preserve a same-direction alternative or decide a
representative. It receives no penalty and remains part of the complete
source-owned Setup package when that equipment is admitted.

This additional operation-alignment question does not apply to W-Engine Base
ATK or advanced stats, Drive Disc 2-piece effects, main stats, effective
substats, or unconditional supply. Their existing relationships and surface-
specific opportunity gates still decide value. Selected Result projection is
also independent: candidate admission cannot create a Result relationship, and
Fully Enabled reachability under `SW-014` cannot create candidate value.

Derive these relationships only from retained Agent facts, source facts, and
applicable formula, action, operation, or recipient consumers. Do not require
action share, uptime, or rotation precision absent from the retained source
condition and current consumer. A genuinely new operation that these
established relationships cannot express requires an explicit common-
mechanism or authority decision; do not force it into the gate or infer a
relationship from item identity or analogy.

#### Candidate Preparation Dependency

**Rule ID:** `SW-004`

Candidate authoring follows this order:

1. establish completed Agent facts and Rank-default Mindscape;
2. establish direction, roles, actions, retained operations, formulas,
   conversions, thresholds, caps, and exclusions;
3. establish exact source reachability and, where required, operation-aligned
   usable contribution through `SW-017`, then use recurring outcome
   relationships and exact clause gates to restrict inspection;
4. apply the W-Engine, Drive Disc, variable-main-stat, or effective-substat
   surface rule and its own opportunity topology;
5. close the materially distinct authored base candidates under `SW-008`;
6. derive current effective candidates through only the bounded adjustments in
   `SW-020`, in the explicit acyclic order below; and
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

The W-Engine input applies the narrower realized-package comparison owned by
the inspection and competitive-set rules below. For that input, package
completeness and unusable source clauses add neither value nor cost; the
strongest Agent-appropriate recomposed setup calibrates the competitive range,
and finite main-stat and substat reallocation compresses same-direction
alternatives within that range. This W-Engine boundary does not replace the
separate Drive Disc, main-stat, or effective-substat gates.

Patterns order inspection but cannot inherit another Agent's result. New items
are routed first to current Agent outcome relationships, then through the
formula, action, stat-pressure, Specialty, and other clause gates that can
establish an exact consumer. Unrelated Agents do not require full re-derivation.

#### Surface-Specific Inspection

##### W-Engine Package Inspection

**Rule ID:** `SW-005`

For W-Engines, begin with current competitive-practice shortlists as discovery
input rather than a final answer. Inspect matching-Specialty packages first,
then perform a bounded omission pass through other currently admitted packages
that could strengthen the exact authored direction. The applicable supporting
content requirement owns any finite release or identity admission scope; this
rule does not imply a permanent version cohort. A guide appearance, release or
character association, rarity, Specialty match, or isolated high value neither
admits nor rejects a package by itself.

For every inspected legal package, project Base ATK, advanced stat, and every
passive clause independently through `SW-017`, including its separate source-
reachability and operation-alignment gates where applicable. Settle the exact
holder role and formula, action, operation, threshold, or cap consumer;
Specialty eligibility and activation compatibility; availability and ownership
origin; and the nearest usable same-direction competitor. At S-Rank W1 or
A-Rank W5, derive only the conditions, scopes, and operations the current Agent
can realize. A usable contribution adds its realized value. An unusable
contribution adds zero and is neither a bonus nor a penalty. Complete and
partial describe applicability; clause count and package completeness do not
establish value or priority. An off-Specialty package remains Agent-local and
survives only when its realized package is competitive for the current
direction. Base ATK remains part of the recomposed setup, but Rank or a modest
isolated Base ATK difference does not independently establish admission,
direction, or priority.

At zero currently supplied substats, recompose the complete bounded setup and
the future opportunity owned by [Competitive Candidate Set](#competitive-candidate-set)
around each realized package. Identify the strongest Agent-appropriate setup as
the representative benchmark and continue comparing every alternative with it.
The benchmark calibrates the material competitive range rather than removing
every weaker package; reject packages too remote to remain useful choices.

Inside that range, compress same-direction alternatives within their
acquisition role. Among other limited S-Ranks, retain only the strongest
competitive package for one recomposed direction. Among standard S-Ranks and
A-Ranks, normally retain only the strongest useful package for one recomposed
direction.

That standard-S-Rank/A-Rank compression has one account-use exception for a
choice-constrained Agent. After ordinary package inspection and material-range
comparison, also retain the strongest still-competitive same-direction
substitute only when the stronger W-Engine is a current competitive choice for
more than one Agent, one owned equipment identity cannot serve simultaneous
teams, and no other admitted non-limited route materially replaces the
contested operation or setup direction for this Agent. The substitute must
survive on its own realized value; an imaginable duplicate conflict cannot
rescue a remote package. Specialty and candidate count do not establish this
boundary. The substitute never displaces the stronger package in representative
comparison, and admission alone changes no authored full or non-limited
representative. This exception adds no inventory input, duplicate-selection
validation, or runtime cross-team allocation.

Judge the retained other limited S-Rank chiefly beside that strongest non-
limited route, so it may coexist below the representative when its realized
value is comparable to or stronger than the non-limited route. Do not collapse
the representative, that other limited alternative, and the non-limited route
solely because their final setup direction matches. The opportunity cost of
selecting one W-Engine is the realized value of the competing setup it
displaces, not unusable source text. A partial limited S-Rank receives no
completeness penalty, but limited acquisition does not preserve a remote or
same-role dominated package.

Author one admitted candidate set before applying availability pools, then
author one deterministic representative from the applicable subset for each
pool. Candidate membership or representative priority does not establish
Result projection; each retained clause still needs its exact recipient,
formula, Attribute, action, or operation consumer. Setup continues to show the
complete source-owned selected package. Contextual or selected-input-derived
changes also keep their established contrary and invalid-selection lifecycle.
Do not turn this authoring order into runtime scoring, a package registry, or a
named-Agent decision table.

##### Drive Disc Package Inspection

**Rule ID:** `SW-006`

A 4-piece Disc needs a material core effect; a 2-piece needs a competitive
complement beside a different 4-piece; a main stat must be legal and survive
slot opportunity cost; and an effective substat must materially strengthen a
supported setup-tuning axis after current stat supply, thresholds, caps,
conversions, and alternatives. Disc admission and preparation compare a
complete legal package: the selected 4-piece set's inherent 2-piece effect and
4-piece effect together with the different selected 2-piece complement. A Disc
candidate survives in one piece role only when it participates in at least one
materially competitive complete package.

Drive Disc authoring uses a two-level effect-clause inspection map before it
compares complete packages. The first level identifies the effect family; the
second identifies the exact current axis or scope. Current families include
scaling-stat supply such as ATK% or Max HP%, CRIT supply, Attribute DMG,
action-scoped DMG, formula-specific modifiers, DEF-region supply, Daze supply,
resource supply, and party-facing modifiers. Keep only current leaves: do not
prepopulate unused Attributes, actions, or effects to form a catalogue.

The family and leaf route discovery; they do not establish Agent value.
Project every retained clause through `SW-017` and its independent qualifier
gates before recombining an exact Disc package. An activation-, action-,
interval-, or operation-dependent 4-piece clause also passes the separate
source-reachability and operation-alignment gates; a 2-piece clause does not
acquire that extra question merely because it belongs to the same set.

Classify each retained 2-piece or 4-piece clause independently, then recombine
every clause belonging to one exact Disc identity for the whole-package
comparison. A multi-clause Disc does not belong to only one family. Piece
threshold, holder and Specialty eligibility, activation, recipient, canonical
action, Attribute, source-local qualifier, stack behavior, non-stacking, and
exact identity remain orthogonal applicability facts rather than deeper
classification levels.

For one Agent direction, inspect in this order: establish exact Result and
setup consumers; apply the `SW-017` relationship and qualifier gates; select
formula-valid effect families and exact leaves; apply role priority; compare
complete 4-piece packages; compare legal 2-piece complements; apply threshold,
cap, and bounded future-substat opportunity costs; resolve explicitly authored
same-effect identity compression; then apply contextual candidate and non-
stacking holder policy. Candidate membership and the zero-substat prepared
first choice remain separate outcomes.

For a current general-damage Attack contributor, the ordinary 2-piece
inspection includes both ATK% and the matching Attribute DMG modifier, together
with applicable CRIT, DEF-region, and defining-action alternatives. ATK is the
direct scaling stat in `base_damage`; Attribute DMG occupies a separate regular-
DMG modifier scope. Neither axis is the automatic prepared first choice.

For a current Rupture damage contributor, the ordinary 2-piece inspection
includes the matching Attribute DMG modifier and applicable CRIT alternatives.
Do not admit a standalone Max HP% 2-piece: its increase reaches Sheer Force only
after the `0.10 * current Max HP` conversion and is not competitive with the
retained 2-piece alternatives. This does not invalidate Max HP inside a
competitive 4-piece package such as Yunkui Tales. PEN Ratio is formula-invalid
because `sheer_damage` omits the DEF region.

Stun and provider directions reuse the same routing rather than inheriting a
named-Agent list. When the current Focus's primary damage direction is
crit-capable, Agent-local preparation may assign a legal competitive King of
the Summit package to each Stun holder whose Daze and buffer roles consume it.
The zero-substat start may remain below King's CRIT threshold: Slot 4 and
effective substat positions are finite future investment opportunity, not
absent supply.
When one legal competitive prepared representative already holds King,
allocation may move another eligible holder only to an already-authored,
legal, independently competitive non-overlapping complete package. Preserve
the less-flexible competitive fit first and use a current independent consumer
to resolve any supported priority. When every colliding holder lacks such an
alternative, preserve each independently closed local representative even
though King is duplicated. That duplication admits no fallback, reopens no
candidate, recommends no party, and does not make the highest-only effect
stack. Only after this pass does preparation allocate other compatible party-
facing packages, and only then Shockstar Disco unless sufficient authored
field time makes its Basic, Dash, and Dodge Counter scope competitive. A
capped provider reserves its scarce future substat opportunity before
committing fixed supply, then inspects resource and party-facing packages for
the remaining axes. Contextual Puffer Electro and Astral Voice admission and
non-stacking holder allocation remain the separate operation-aware passes
defined below.

##### Variable Main-Stat Inspection

**Rule ID:** `SW-018`

Variable main-stat candidates begin from the Agent direction and only the
relationships that pass `SW-017`. Each candidate must be legal for its exact
Slot 4, 5, or 6 and must justify consuming that slot beside the other legal
relationships available there. Formula participation, a positive contribution,
or a threshold alone does not establish competitiveness. Compare the fixed
supply created by the complete current package, the distinct outcome axis, and
the finite main-stat and future-substat opportunity displaced by the choice.

Different slots do not make one common value class, and a W-Engine or Disc
relationship does not admit the same stat here automatically. A resource main
and a direct scaling main remain distinct only when they materially strengthen
different retained delivery, threshold, conversion, or formula outcomes. A
formula-invalid stat has no value through that formula. The residual personal-
damage exception for a direction with no role-strengthening variable-main
choice remains limited to this surface and creates no damage role or Result
relationship.

Candidate membership is itself a user-visible Setup outcome and does not need a
paired calculated row. Do not invent personal-damage, raw-damage, or raw-Daze
Result merely to retain a competitive main-stat choice.

##### Effective-Substat Inspection

**Rule ID:** `SW-019`

Effective-substat candidates likewise begin from `SW-017`, but their opportunity
is one additional hit from the shared finite tuning input. That hit must remain
a material use after the complete package's fixed supply, thresholds, caps,
conversions, and stronger retained alternatives are considered. A materially
weaker supplier may be excluded even while it increases a formula, unless it
preserves a distinct threshold, cap, operation, or relationship that matters to
the direction. Percentage and flat supply may both remain only when each is a
material use of the same scarce axis.

Judge membership against the authored direction, representative package
alternatives, and bounded context pressure, not the user's current edited hit
counts or a Result value. Approaching a cap through direct editing does not
continuously remove a retained substat. If the authored starting representative
leaves only trivial future room on a scarce tuning axis, reconsider that
representative's fixed supply instead of shrinking the candidate set around it.
A generic personal-damage increase or ordinary Attribute buildup does not admit
CRIT or Anomaly Proficiency without a materially competitive retained use.

A stat-derived threshold can establish a basis relationship without creating a
personal-damage role. It may therefore admit a main stat, effective substat, or
Disc supplier independently on each surface. A W-Engine supplying the same stat
still passes its complete-package, acquisition, and availability comparison and
does not enter automatically.

#### Context-Effective Candidate Policy

**Rule ID:** `SW-020`

Author base candidates before evaluating Mindscape, party, Focus, pool, active
provider, or selected-equipment context. Do not re-derive the whole candidate
set from every combination. Context may consume only an authored bounded
predicate whose exact relationship, recipient, formula, action, operation, and
surface consequence are already settled.

Every researched current pressure ends in exactly one product outcome: no setup
change, a prepared-choice-only adjustment, or a candidate-membership adjustment.
A prepared-choice-only adjustment is consumed only during authorized
preparation and never overwrites a direct edit. A membership adjustment is
reevaluated in the current session and may invalidate an edited selection under
`SW-009` and `SW-011`. Persist only the bounded predicate and choice needed by
the current consumer, never a score, ranking, research receipt, or provider-
identity branch.

The current membership adjustment admits material **broad** pre-PEN DEF
Reduction or DEF Ignore as pressure that may remove an otherwise competitive
PEN Ratio supplier when the applied setup's authored primary or residual damage
direction consumes `def_multiplier`. Resolve the pressure through its actual
recipient, Attribute, action, and formula applicability; do not turn one
provider's clause into a global party flag. It can affect Slot 5 PEN Ratio and a
PEN Ratio 2-piece Disc independently. It does not remove a competitive 4-piece
whose complete package contains that 2-piece effect.

Breadth is the current authored boundary, not universal proof of materiality.
A limited action-scoped pre-PEN modifier does not remove PEN Ratio merely
because it precedes PEN in the formula, and a broad or numerically large effect
does not establish exclusion without this policy. A formula omitting
`def_multiplier` is unaffected. Spectral Gaze's broad pressure therefore uses
the formula relationship rather than Agent, Specialty, or Attribute identity;
Cordis Germina's Basic/Ultimate-only DEF Ignore does not create the same
membership removal. A pressure-safe prepared package must be authored rather
than selected by runtime fallback.

Most Mindscape and party changes narrow candidates. Addition is exceptional
and requires a newly material external contribution or operation. The current
recipient-applied Ultimate opportunity may add an authored Puffer Electro
4-piece case for an applicable crit-capable general-damage direction. The
current provider-applied Quick Assist opportunity may add an authored Astral
Voice 4-piece case when its entrant effect becomes materially usable for the
recipient's direction. Newly usable activation is necessary but not sufficient:
the complete package must remain competitive after holder role, Focus
responsibility, role-fitting alternatives, and opportunity cost. A focused
damage contributor with a stronger operation-fitting package does not gain the
contextual case merely because activation is reachable. These are operation-
and recipient-applicability rules, not Named-Agent branches, and they neither
select the case nor continuously rank it.

Candidate addition remains distinct from prepared holder allocation. When a
non-stacking competitive effect fits more than one applied holder, preparation
prefers a legal non-overlapping allocation only by moving a holder to an
already-authored, legal, independently competitive complete package. Allocate
the less-flexible fit first. Use only current independent role or Result
consumers, complete package preservation, current main-stat and effective-
substat directions, zero-substat threshold opportunity, and the material loss
from giving up the effect. If those consumers still do not distinguish
otherwise supported non-overlapping allocations, author one bounded
deterministic party representative. When every colliding holder lacks an
authored competitive non-overlapping alternative, preserve each local
representative even though the prepared effect is duplicated. Do not return
`null`, use slot or Agent identity as a hidden tiebreaker, invent a fallback,
reopen candidate membership, or create a runtime holder score. Direct edits
may likewise create duplicate holders; ordinary highest-only Result
composition keeps either prepared or edited duplication from stacking.

Allocation passes compose in dependency order: a later holder tie-break
consumes already-resolved Focus/formula and earlier package allocation. A
changed pass requires one flow through adjacent passes together and one
contrast. New equipment normally competes first on its own surface and may
change a prepared main stat through its fixed package. Reconsider an effective
substat only when the new equipment creates material pressure after existing
stat supply and finite opportunity are applied.

#### Competitive Candidate Set

**Rule ID:** `SW-008`

Candidate membership is product policy, not runtime ranking. A candidate remains
only when its whole usable package creates a material choice. Limited ownership,
accessibility, stat or modifier balance, thresholds, caps, operation, or a
supported preference may distinguish it. Reachability, release or character
association, a different trigger, or an isolated clause is insufficient.

Source reachability alone establishes no candidate value. For a clause that
requires the additional gate, operation alignment under `SW-017` establishes
usable value, not competitiveness. Every admission, removal, compression, and
representative conclusion still requires the applicable surface comparison:
complete package, finite opportunity, nearest comparator, material user-facing
direction, and reversing countercase. Do not compare unrelated surfaces by
treating a shared relationship label as a common score.

`SW-005` owns W-Engine representative-range and acquisition-role comparison,
including complete and partial packages, other limited and non-limited routes,
and the choice-constrained contention fallback. This rule consumes the closed
W-Engine outcome without repeating those item-specific opportunity semantics.
For every surface, a different direction must materially change finite
allocation, action or operation coverage, threshold or cap use, formula
consumption, acquisition, or allocation. A different label, trigger, rarity,
or positive clause is insufficient. Candidate count is never a target, and the
workbench does not expose every viable fallback.

A legal party composition or non-stacking allocation collision does not by
itself establish a material candidate direction, admit a fallback, or reopen an
Agent-local compression conclusion. Allocation consumes only candidates and
representatives that already survived this rule. When no authored competitive
non-overlapping alternative exists, `SW-020` preserves the independently
closed local representatives instead of changing membership.

Individual viability is not enough. Numerical difference alone creates no
cutoff. Candidate count is not a target. A direction's valid stat pressure keeps
only stats that materially support a role or retained relationship. Formula
participation alone is insufficient. Flat PEN is not current valid stat
pressure, an effective substat, or a Result row; PEN Ratio is separate.

For every current candidate admission, removal, compression, and deterministic
representative, retain the smallest Agent-local outcome that preserves the
material decision and its reversal boundary: identity; realized outcome axis;
usable or unused clause only when it changes the comparison; nearest comparator;
finite opportunity; any acquisition- or allocation-role reason for coexistence
or compression; and the contrary condition, lifecycle, or visible consequence
that changes the result. Shared equipment facts continue to own source values,
progression, conditions, scopes, and Setup copy. Keep guide material, the full
investigated equipment set, detailed arithmetic, worksheets, and complete
countermodels transient. Do not persist every rejection, a candidate registry,
an explanation payload, or a runtime score.

The applicable current Agent supporting requirement owns that settled local
outcome, while production consumes its candidate and representative identities
as Agent-centered setup policy. Shared equipment facts do not own the candidate
because an item can realize different relationships and competitive boundaries
for different holders. This ownership does not require one file per Agent, one
physical rationale schema, or rationale in the consumer UI.

Equal retained numeric effects do not by themselves collapse or admit exact
equipment identity. Each identity first passes the normal competitive-candidate
policy, and exact identity still determines selected artwork, source disclosure,
and complete-package legality. When two 2-piece identities supply the same
retained decision and an authored same-effect relationship says their separate
display has no additional current value, expose one current identity through
the canonical/substitute policy under Complete Setup Selection. This compresses
the candidate surface rather than merging the identities or their source facts.

Prepared substat counts and representative authoring use two different
observations. The visible prepared setup always begins at zero supplied hits.
When a capped provider direction has only one materially effective tuning axis
and few competitive substat suppliers, authoring also reserves a conservative
future opportunity of eight hits in each retained supplier of that axis. The
eight-hit value is not a universal distribution, a candidate-count target, an
exact farming promise, or a value applied to the current Result.

Reserve that bounded future opportunity before deciding how much of the same
axis fixed W-Engine, Disc, or main-stat slots must supply. Use fixed choices for
the residual cap requirement and for valuable axes that substats cannot supply.
This prevents the starting representative from spending scarce fixed choices
to pre-fill a cap while leaving its few worthwhile substats with little useful
room. The prepared setup still initializes every offered count at zero and its
Result may therefore begin below the cap.

For a crit-capable damage direction, apply the same bounded future opportunity
before authoring its complete Disc package and Slot 4 balance. Compare the raw
sum of fixed and future CRIT Rate supply with the 100% formula cap: supply above
the cap has no formula value and is an opportunity cost, even though the visible
Result clamps it away. Rebalance the 2-piece and main stat before reducing an
effective-substat candidate, while preserving a lower defining threshold and a
material CRIT-stability advantage. This is a bounded authoring check, not an
uncapped Result row or preparation feedback from the user's current counts.

This ordering does not apply to an ordinary damage direction merely because one
of its effective substats is stronger than another. When several materially
valuable damage axes remain available, first author the best complete W-Engine
package in the pool. Then compare legal complete Disc packages, main stats, and
retained effective substats as one bounded balance around that W-Engine. The
finite opportunity may distinguish remaining Disc or substat suppliers in this
second comparison, but it does not admit a low-value stat or reopen the authored
W-Engine choice as a runtime score. In both cases the result is an authored
starting representative, not a runtime optimizer or a promise of exact farmed
counts.

### Prepared Starting Setup

**Rule ID:** `SW-009`

Preparation supplies one deterministic first choice from the current effective
candidates for the Agent, Mindscape, party, focus, and availability pool. It
chooses a W-Engine and Rank-default refinement, a 4-piece set, a different
2-piece set, legal Slot 4/5/6 main stats, and zero for every offered effective-
substat hit count.

Preparation is downstream of `SW-008` candidate closure and `SW-020` context
resolution. It cannot choose a representative, backfill a missing candidate,
or use a prepared Result to resolve an unfinished admission or compression.

The first choice is authored competitive policy, not a runtime score. Use the
direction-specific ordering above: an ordinary damage direction resolves its
pool-specific W-Engine package before jointly balancing the complete Disc
package and later stat inputs, while a capped provider with one scarce tuning
axis reserves the bounded future substat opportunity before committing fixed
package and main-stat supply on that same axis. In either case, do not insert
undisclosed substat investment into the prepared current setup. Zero counts mean
no user-supplied investment, not a recommendation to avoid those stats.

Authorized preparation resolves these dependencies in two acyclic layers.
First derive context-effective W-Engine and complete-Disc candidate sets from
the applied directions, each package's own usable effects, party allocation or
compatibility, newly material upstream contributions or operations, and other
already-established context that does not depend on an unresolved equipment
selection. Consume any authored prepared-choice-only adjustment for those
inputs, then choose the W-Engine and complete Disc package.
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

Effective-substat pressure has one narrower lifecycle because zero is a valid
current count. When a selected input first admits an effective-substat input,
create that count at zero. When the pressure removes the input, discard its
count and history; reselecting the pressure creates a new zero rather than
restoring the previous count. This does not authorize repairing an already-
required but missing count to zero. Such a missing required input remains
incomplete until the user repairs it or authorized preparation rebuilds it.

### W-Engine Availability Pools

**Rule ID:** `SW-010`

- **full pool** includes every admitted W-Engine, including limited S-Rank;
- **non-limited pool** excludes limited S-Rank while retaining admitted non-
  limited S-Rank and A-Rank engines.

After the representative-range and acquisition-role comparisons, author one
admitted candidate set before partitioning it by availability. The Agent-
realized comparison includes acquisition and accessibility where they
materially distinguish competitive choices, but availability does not rerun
comparison or readmit a rejected package. Full exposes the whole admitted set;
non-limited derives its exact subset by removing limited S-Rank identities.
Author the full representative from the full set and the non-limited
representative from that derived subset. A non-limited accessibility path need
not numerically equal the full representative, but it must still have survived
the same representative-calibrated material range and its acquisition-role
comparison.

A qualifying choice-constrained contention fallback enters that one admitted
set during the `SW-005` comparison; pool filtering never readmits it. Because
the fallback is a standard S-Rank or A-Rank identity, both full and non-limited
expose it. Its presence does not replace the stronger authored representative
in either applicable pool.

Pool defaults to full. Initial preparation selects the authored first choice
from that pool. Switching pools initializes that Agent with the complete
prepared setup for the target pool, including zero effective-substat counts.
The initial product keeps no separate edited setup for each pool.

### Complete Setup Selection

**Rule ID:** `SW-011`

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

An explicitly authored pair of same-effect 2-piece identities exposes at most
one member at a time. When the current 4-piece is one member, expose the other.
When neither is selected as 4-piece and exactly one member is an authored
4-piece candidate, expose that member so the existing atomic role-swap path
remains available. When neither member has that 4-piece role, use one authored
canonical identity; release order or lexical order may settle an otherwise
immaterial authoring tie without becoming runtime equipment data. If both
members have a material 4-piece role, author the current consumer's canonical
choice rather than inventing a runtime tiebreaker. Selection keeps the exact
displayed identity, source disclosure, and different-set legality. A direct
4-piece edit reevaluates this candidate surface under the ordinary invalidation
lifecycle and does not select a substitute or restore a previous choice.

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

**Rule ID:** `SW-012`

The user selects three distinct admitted Agents. Exactly one focus-eligible
member is selected automatically; multiple require user choice; none leaves the
draft in party composition. The focused character is the fixed on-field damage-
concentration observation point and recipient of controllable one-member setup
effects. Other members may briefly act for supported triggers without changing
focus.

Recipient compression starts after exact source eligibility is known. When the
game rule or a retained numerical relationship determines one or more recipients,
use those actual recipients; Focus does not override them. When user operation
can steer one effective recipient, Focus is legally eligible for that effect,
and modeling the hidden action route would not change the visible setup choice
or Result, project the effect exactly once to Focus. The holder may itself be
Focus when the source permits self-receipt. If Focus is structurally ineligible,
never force the effect onto Focus: use an exact retained recipient rule or stop
that bounded projection for authoring. A genuine multi-recipient effect projects
to every eligible current recipient. Provider identity, holder identity, and
Focus identity alone do not decide which branch applies.

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

### Lumiflux Next-Agent Resolution

**Rule ID:** `SW-021`

When `GV-011` requires the next Agent for Lumiflux's party-contextual
Attribute, resolve that Agent cyclically in the applied three-Agent party:
the first slot uses the second, the second uses the third, and the third uses
the first. This is a product-authored deterministic fallback for the terminal
slot because the retained current source does not state that case. It is not
an exact game fact and does not define a general next-recipient or party-order
relationship.

This resolution supplies only the adjacent Agent identity consumed by
`GV-011`. It does not transfer another property, replace either declared
Attribute, or broaden the contextual relationship beyond Lumiflux damage and
Attribute-scoped effect applicability. Draft party edits do not change the
applied resolution. Applying a changed party or order creates the new context,
prepares all three Agents, and recalculates Result under `SW-012` and `SW-016`.

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

**Rule ID:** `SW-013`

For each complete setup, Result visually exposes current inputs and candidates;
setting-relevant stats and modifier regions; atomic amounts with concise source
identities and earliest surface; action aggregates only when they differ;
stat-derived bases with linked buff, conversion, threshold, or cap outputs;
source-stated non-stat operations only when their numeric meaning is complete for
one canonical action or one state outcome without assuming trigger frequency,
rotation, field time, resource-spending cadence, incoming damage, or uptime;
threshold/cap state; and changes caused by visible inputs or party context.

Result is not a generic ledger for every numeric operation. The governing test
is whether a value is complete as a setting stat, canonical-action outcome, or
state outcome without a rotation, resource, or incoming-damage model. Current
retained non-stat examples are Dialyn's enemy Stun-duration extension and Astra
M4's next-Quick-Assist Daze modifier. A numeric resource or survival clause does
not enter Result merely because the source states an amount.

Shield, healing, and other survival value are excluded from Result and from
positive damage or setup axes. A deterministic and exactly calculable survival
amount does not admit or strengthen a candidate, prepared representative, main
stat, or substat and does not make Shield Effect or that amount visible in
Result.

Setup may retain the smallest exact survival clause needed to disclose a
current selected or candidate package whose admission is independently
supported by non-survival consumers. A shield's existence or activation may
likewise remain an internal source-local eligibility or target-state condition
for an independently admitted damage, Daze, stat, or party effect. Neither
retention makes survival value positive or visible in Result.

Result projects that admitted non-survival effect under the actual authored
Core Passive, Additional Ability, Mindscape, equipment, or canonical-action
source that owns it. A named shield state and an action that merely creates the
shield do not become sources. A canonical action owns the Result contribution
only when the action itself authors the retained effect.

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

An Energy Regen row shows current automatic Energy recovered per second on each
surface. Its aggregate includes the composed Energy Regen stat and each
applicable source-stated automatic per-second recovery whose rate is fixed once
its directly observed eligibility state holds, using the composition owned by
formula mechanics. Automatic off-field recovery therefore qualifies without
assuming action cadence. Expanded breakdown preserves a percentage stat source
and an automatic `/s` recovery source as distinct atomic amounts.

An Energy or Adrenaline grant conditioned on an action, hit, resource spend, or
other repeatable event is excluded from Result when interpreting its setting
value would require cadence or rotation assumptions. Do not normalize such a
grant into `/s`, expose it as a standalone operation, or add it to an Energy
Regen row. A cooldown-limited trigger is not automatic recovery merely because
it can theoretically recur. Its exact clause may still remain in compressed
Setup content and candidate or representative policy under the source-fact
retention gate.

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
`min(calculated CRIT Rate, 100%)`; Result never exposes the uncapped amount.
Authored representative policy may inspect the raw fixed-plus-future sum only
for the bounded cap opportunity check above. It does not read a user's current
Result or continuously reprepare an edited setup.
Calculations use decimal precision and presentation rounding never feeds back.

## Fully Enabled Party Window

**Rule ID:** `SW-014`

This is a setting-tuning surface, not a rotation or damage simulator. Include a
condition only when compatible, intentionally activatable, reachable, and
Result-changing. Difficulty, duration, maintenance, frequency, and rotation
share do not reduce the enabled value.

A legal repeatable trigger route reaches the stack cap unless exact mechanics
require distinct categories. Do not infer partial stacks from listed action
count, uptime, or frequency. Leave unresolved reachability unimplemented.

This reachability rule decides the Fully Enabled value of an independently
retained selected relationship. It does not establish operation-aligned
candidate value. A source-reachable W-Engine passive or Drive Disc 4-piece
clause may therefore reach its full selected Result value while contributing
zero to candidate comparison under `SW-017`, and candidate admission cannot
create the selected Result relationship in the opposite direction.

Bangboo is not an input or fourth Agent. A Bangboo action may satisfy
reachability only when the resulting value is independent of Bangboo choice.
Kaboom the Cannon therefore reaches four stacks and 16% ATK at W5 when
applicable.

For identical non-stacking effects, resolve sources independently and apply one
highest reachable value per recipient, preserving equal applied origins for
numeric breakdown. Do not model sequential replacement.

## Static Preparation And Dynamic Session

**Rule ID:** `SW-015`

Static preparation owns completed facts, direction, roles, focus eligibility,
candidate policy, authored first choices, bounded predicates, and availability.
Session owns party, focus, pool, Mindscape, refinement, editable selections,
prepared initialization, completeness, recipient resolution, calculation, and
Result.

Session may evaluate authored alternatives, compose selected-equipment stat
pressure with current setup candidates, and resolve the authored prepared
setup. It cannot invent candidates, assign runtime equipment scores, optimize a
package from Result output, or feed Result back into preparation.

### Bounded Target Result Context

The current session owns one editable `Target Stun DMG Multiplier` total for Ye
Shunguang's Veil Vulnerability Result. It defaults to `150%`, accepts whole
percentage values at or above `100%`, and persists across party Apply,
Mindscape changes, pool preparation, and direct setup edits until the session
ends or the user changes it. It is not an Agent setup selection and does not
change focus, candidate membership, prepared first choices, allocation,
selection completeness, or any non-Ye Result.

Editing this target value recalculates the complete current party immediately.
The value remains session context when Ye leaves the applied party and becomes
visible again if Ye returns. This is one current Result consumer, not a generic
enemy panel, enemy catalogue, stage preset, or authorization for additional
target inputs.

The editor may hold an incomplete text draft while the canonical session value
remains valid. A whole integer at or above `100` commits and recalculates
immediately. An empty, fractional, non-finite, or below-minimum draft keeps the
last committed Result, reports the constraint accessibly, and restores the
committed value on blur or Enter. Result recalculation does not move focus or
replace the user's valid selection inside the control.

## User Flow Contract

**Rule ID:** `SW-016`

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
10. When Ye Shunguang is applied, editing the target Stun DMG Multiplier inside
    her expanded Result recalculates Result without preparing or invalidating a
    setup.
11. Expanded rows show numeric breakdown, action differences, and gauges without
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
