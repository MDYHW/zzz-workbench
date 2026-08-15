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

### Candidate Preparation Dependency

**Rule ID:** `SW-004`

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

#### W-Engine Package Inspection

**Rule ID:** `SW-005`

For W-Engines, begin with current competitive-practice shortlists as discovery
input rather than a final answer. Inspect matching-Specialty packages first,
then perform a bounded omission pass through other current-cohort packages that
could strengthen the exact authored direction. A guide appearance, signature
association, rarity, Specialty match, or isolated high value neither admits nor
rejects a package by itself.

For every inspected package, settle the holder's role and formula, action,
operation, threshold, or cap consumer; exact Specialty eligibility and
activation compatibility; availability and ownership origin; and the nearest
usable same-axis competitor in the same pool. Then compare Base ATK, advanced
stat, and every passive clause together at S-Rank W1 or A-Rank W5. Charge an
unused advanced stat or passive clause as finite slot or stat-supply opportunity
cost rather than treating it as an automatic rejection. An off-Specialty
package remains Agent-local and survives only when its usable whole package is
competitive for the current direction.

Apply that comparison independently to full and non-limited availability, at
zero currently supplied substats and with only the bounded future opportunity
owned by [Competitive Candidate Set](#competitive-candidate-set). Set candidate
membership before authoring one deterministic pool representative. Candidate
dominance or representative priority does not establish Result projection;
each retained clause still needs its exact recipient, formula, Attribute,
action, or operation consumer. Contextual or selected-input-derived changes
also keep their established contrary and invalid-selection lifecycle. Do not
turn this authoring order into runtime scoring, a package registry, or a
named-Agent decision table.

#### Drive Disc Inspection Routing

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

Classify each retained 2-piece or 4-piece clause independently, then recombine
every clause belonging to one exact Disc identity for the whole-package
comparison. A multi-clause Disc does not belong to only one family. Piece
threshold, holder and Specialty eligibility, activation, recipient, canonical
action, Attribute, source-local qualifier, stack behavior, non-stacking, and
exact identity remain orthogonal applicability facts rather than deeper
classification levels.

For one Agent direction, inspect in this order: establish exact Result and
setup consumers; select formula-valid effect families and exact leaves; apply
role priority; reject incompatible holders or activations; match defining
actions and Attributes; compare complete 4-piece packages; compare legal
2-piece complements; apply threshold, cap, and bounded future-substat
opportunity costs; resolve explicitly authored same-effect identity compression;
then apply contextual candidate and non-stacking holder policy. Candidate
membership and the zero-substat prepared first choice remain separate outcomes.

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
crit-capable, preparation first assigns one legal competitive King of the
Summit package to a Stun holder whose Daze and buffer roles consume it. The
zero-substat start may remain below King's CRIT threshold: Slot 4 and effective
substat positions are finite future investment opportunity, not absent supply.
If one legal competitive prepared representative already holds King, preserve
that holder unless a current independent consumer establishes another holder's
priority; do not duplicate the non-stacking package merely because another Stun
holder also becomes eligible. Only after this pass does preparation
allocate other compatible party-facing packages, and only then Shockstar Disco
unless sufficient authored field time makes its Basic, Dash, and Dodge Counter
scope competitive. A capped provider reserves its scarce
future substat opportunity before committing fixed supply, then inspects
resource and party-facing packages for the remaining axes. Contextual Puffer
Electro and Astral Voice admission and non-stacking holder allocation remain
the separate operation-aware passes defined below.

#### Effective Substat Candidate Gate

**Rule ID:** `SW-007`

Main-stat and effective-substat candidates begin from the Agent's direction,
roles, formulas, and current Agent sources. Do not re-derive the whole candidate
set from every party and equipment combination. A selected equipment effect may
create a bounded stat pressure when that stat changes the direction's current
choice or Result. In that case, evaluate the competitive setup inputs that can
supply the stat. A threshold alone does not admit every supplier: main-stat
slot cost, substat competition, set-piece opportunity cost, and whole-package
equipment value still apply.

Formula participation or a positive numeric contribution does not by itself
make an effective substat competitive. One additional hit must remain a
material use of the same finite tuning opportunity after the current package's
fixed stat supply, thresholds, caps, conversions, and stronger alternatives are
considered. A materially weaker supplier may therefore be excluded even though
it still increases a formula, unless it keeps a distinct threshold, cap,
operation, or relationship that matters to the direction. This is an authored
candidate decision, not a runtime score or an automatic comparison of every
positive stat.

For example, Yixuan's HP% and ATK% each feed the same current Sheer Force
direction, but the current base-stat magnitudes and Rupture conversion make an
HP% hit materially stronger, so only HP% is retained. By contrast, percentage
and flat supply may both remain competitive for a capped provider whose few
material substats serve one scarce scaling axis. Distinct axes such as Dialyn's
Slot 6 Energy Regen and Impact remain separately comparable as resource-
operation and direct-Daze investments. A generic personal-damage increase or
ordinary Attribute buildup likewise does not admit CRIT or Anomaly Proficiency
for a direction that lacks a materially competitive current use for that
investment.

Judge this membership against the authored direction, representative package
alternatives, and bounded selected-input pressure, not against the user's
current edited hit counts or a Result value. Approaching a cap through direct
editing does not continuously remove a retained substat. If an authored
starting representative leaves only trivial useful room on its scarce tuning
axis, reconsider that representative's fixed supply instead of shrinking the
candidate set around the mistake.

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
DEF Reduction or DEF Ignore as pressure that may remove an admitted PEN Ratio
supplier from an applied setup whose authored direction admits residual or
primary general-damage investment and therefore consumes the DEF region. This
can affect a Slot 5 PEN Ratio main stat or a PEN Ratio 2-piece Disc when each is
otherwise a competitive candidate. Resolve the pressure through its actual
recipient, Attribute, action, and formula applicability; do not turn one
provider's clause into a global party flag.

Breadth is the current admission boundary, not a universal proof of
materiality. A limited action-scoped pre-PEN modifier does not remove PEN Ratio
merely because it precedes PEN in the formula; it may affect an explicitly
authored prepared preference when it covers direction-defining output, but a
future scoped membership adjustment requires a new current consumer and
product decision before the qualifier is expanded. A broad or numerically
large modifier likewise does not establish exclusion without that authored
policy. A direction whose damage family omits the DEF region never admits PEN
Ratio from this rule. The current broad Spectral Gaze pressure removes Slot 5
PEN Ratio for every applicable setup whose authored primary or residual
direction participates in `general_damage`; Agent identity, Specialty, and
Attribute are not additional predicates. Its enemy DEF Reduction reaches the
same formula-applicable Result consumers rather than a separately named Agent
set. A representative that would otherwise start with invalid PEN requires its
own authored pressure-safe prepared choice rather than a runtime fallback. A broad party
Electric DEF Ignore can remove both Slot 5 PEN Ratio and a Puffer Electro
2-piece candidate for an applicable Electric general-damage setup. It does not
by itself remove a separately authored competitive Puffer Electro 4-piece case;
that complete package is evaluated through its inherent 2-piece and 4-piece
effects under the whole-package rule. Cordis Germina's Basic/Ultimate-only DEF
Ignore does not remove either PEN Ratio input by itself. This is authored
candidate policy, not a numerical threshold or action-share calculation
inferred at runtime.

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
for an applicable crit-capable general-damage direction. A provider-applied
Quick Assist opportunity can likewise add an authored Astral Voice 4-piece case
when that operation makes its entrant effect materially usable for the
recipient's direction. Newly usable effect activation is necessary but not
sufficient. Before the contextual case enters the effective set, its complete
package must remain materially competitive after the holder's authored roles,
current Focus responsibility, role-fitting 4-piece alternatives, and opportunity
costs are applied. Astral Voice can survive this comparison when it materially
strengthens a retained buffer role, or when the holder lacks a materially
stronger operation-fitting 4-piece and Astral Voice's whole package remains a
competitive alternate. A focused damage contributor with a strong personal
operation-fitting 4-piece does not gain Astral Voice merely because the party
can supply Quick Assists. The absence of a stronger operation-fitting case is
authored competitive-practice policy, not a runtime absence check or score.

These are operation- and recipient-applicability rules, not Dialyn-, Astra Yao-,
or equipment-identity branches. They admit an already-authored contextual
candidate case; they do not select it, continuously rank it, or overwrite a
direct setup edit.

Candidate addition is distinct from holder allocation. When an equipment case
is already competitive for more than one applied Agent, a non-stacking party
effect or a more suitable holder may change the prepared first choices without
changing candidate membership. For example, allocating Astral Voice to another
eligible holder may prepare Astra Yao with Moonlight Lullaby, while an Astral
Voice case made usable only by an externally supplied Quick Assist is a
candidate-membership addition. Persist these as separate authored policy
outcomes even when both occur in the same party.

When two applied holders can each prepare one of two non-stacking competitive
effects, preparation prefers a legal non-overlapping package. Allocate the
effect with the less flexible holder fit first, using only current independent
role or Result consumers, complete 4-piece/2-piece package preservation,
current authored main-stat and effective-substat directions, threshold
investment at the zero-substat start, and the material role or Result loss
from giving up that effect. Allocate the other
effect to the holder that remains competitively flexible. If those current
consumers still do not distinguish the holders, author one bounded deterministic
party representative. Do not return `null`, duplicate a non-stacking effect,
use slot order or Agent identity as a hidden tiebreaker, or create a runtime
holder score. This allocation changes only authorized prepared first choices;
direct edits may create duplicate holders and Result still applies the ordinary
non-stacking rule.

These allocation rules compose in dependency order. A later Support-holder
tie-break must consume the already-resolved Focus/formula and Stun/King package;
it cannot treat an earlier flexible Astral representative as final and thereby
displace the Stun package. Acceptance for a changed allocation pass includes one
party that traverses the adjacent passes together, not only isolated examples
for each pass.

New equipment normally enters as a competing W-Engine, 4-piece, or 2-piece
candidate and may change the prepared main-stat choice through its stat package.
Reconsider an effective-substat candidate only when the new equipment creates a
competitive stat pressure after the Agent's existing retained stat-supply
choices and opportunity costs are applied.

### Competitive Candidate Set

**Rule ID:** `SW-008`

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

Author candidate membership in both availability contexts before deriving the
non-limited subset. Full-pool authoring compares limited alternatives with each
other while preserving materially distinct accessibility paths; non-limited
authoring re-compares the remaining standard S-Rank and A-Rank packages without
using a limited first choice as their benchmark. A non-limited candidate that
survives that second comparison also appears in full, but its accessibility-
path meaning need not beat the limited representative head to head.

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

Ben's Core shield is the bounded current survival relationship admitted by the
source-fact gate: selected Initial DEF and Shield Effect inputs determine one
complete shield amount per EX Special Attack follow-up. Result exposes that
amount as a source-local operation beside its Initial DEF and optional Shield
Effect inputs. This does not admit shield uptime, incoming damage, replacement,
healing, or another holder's shield clause without its own current consumer.

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
