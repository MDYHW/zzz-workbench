# Source-Fact Boundary

Status: single retention authority for the setup workbench.

## Purpose And Boundary

This document owns the only retention gate used by the project. Product
outcomes belong to `docs/setup-workbench-product-contract.md`, game terms to
`docs/zzz-game-vocabulary.md`, and formula relationships to
`docs/zzz-formula-mechanics.md`.

It does not define a source archive, evidence record, explanation payload,
audit trail, or universal game schema.

## The Single Retention Gate

For every proposed term, value, condition, field, hierarchy, relation, or
payload, ask one counterfactual question:

> If this distinction is removed or changed, does current competitive candidate
> membership, a prepared starting setup, another user-visible setup choice, or
> Result change, or does the policy, calculation, or applicability required to
> produce one of those outcomes change?

If yes, keep the smallest representation that preserves that difference. If
no, omit or delete it.

Current qualifying outcomes are limited to:

- competitive authored base candidate membership or current effective
  candidate membership for the selected context and availability pool;
- an authored prepared first choice and the complete starting setup it changes;
- editable party, Mindscape, refinement, equipment, main-stat, and effective
  substat choices;
- the initial, combat-baseline, and fully enabled values and modifiers;
- canonical-action aggregates that actually differ;
- source-stated added amounts or scale factors that independently modify an
  existing retained action's DMG Multiplier or Daze Multiplier, without its
  ordinary base coefficient or raw output;
- internal Attribute, action, recipient, and activation applicability needed to
  calculate the value shown for the current Agent;
- threshold, cap, and gauge outcomes; and
- atomic numeric contributions and concise source identity used by the expanded
  Result breakdown.

Provider paths, revisions, copied wording, guide references, candidate
rationales, authoring receipts, historical deltas, auditability, completeness,
symmetry, possible future use, and an existing field or test are not qualifying
outcomes. They cannot justify retention.

The gate is evaluated against the current consumer. A speculative later Agent
or release is not a consumer. When later content is explicitly admitted, apply
the same gate to that content then.

## Qualifying-Outcome-First Derivation

Start from the user-visible setup choice or Result that may differ and work
backward only as far as needed to select, calculate, or apply it.

External sources and setup practice may be inspected during authoring to learn
the current value, condition, scope, or competitive choice. That investigation
is ephemeral. Once the decision is made, persist only the minimal current
meaning that passes the gate; do not copy the research trail into content
records, UI models, tests, plans, or permanent documentation.

Implementation and tests consume settled meaning. They do not justify keeping
a distinction that fails the gate.

If a missing or conflicting game fact could change a qualifying outcome, do
not guess. Leave that outcome unimplemented until the fact is resolved. This is
an authoring stop, not a reason to create a persistent uncertainty or evidence
schema.

## Minimal Current Meaning

Keep identity and eligibility only when they change candidate membership, a
prepared first choice, another admitted choice, a party condition, or a
calculated Result.

Competitive candidate membership can pass the gate without a paired calculated
output. Do not invent a raw damage, Daze, or personal-output Result merely to
justify a candidate that already changes the visible choice set.

Keep a value, threshold, cap, count, trigger, action scope, Attribute scope,
recipient, duration, stack rule, or compatibility rule only when it changes a
qualifying outcome. Trigger action, affected action, source owner, action
performer, and recipient remain separate only where collapsing them would
change calculation or application.

A source-local name is not automatically a shared term. Canonicalize it to an
existing action, Attribute, stat, formula region, or source identity when that
produces the same qualifying outcome.

For current Rupture Agents, canonicalize the shared 30% current-ATK and 10%
current-Max-HP conversion clauses to one `Rupture specialty` source
identity. The Max HP clause remains a game-authored Core Passive clause, but
that source container does not require a separate workbench source identity
for an identical always-on conversion. Do not reclassify unrelated Core
Passive clauses. Effects that change ATK or Max HP remain sources on their own
stat surfaces, and their derived Sheer Force change is not repeated as another
source contribution. A direct Sheer Force addition keeps its own source
identity.

For identical non-stacking effects, keep only the origins and compatibility
needed to calculate and display the current numeric breakdown. Do not model
combat replacement order when the service does not calculate it.

For Potential Awakening, use the completed Agent values and do not keep
pre-awakening variants. Source ownership is not determined by whether a clause
is new or creates a stack, state, or mechanism. Attribute a completed Potential
Awakening clause that changes or extends a named skill, Core Passive, or
Additional Ability to that existing source, including a newly added effect,
state, stack, or mechanism. An existing source named only as a trigger or
affected scope does not acquire ownership. A retained clause uses Potential
Awakening as its source identity only when the game authors it as a standalone
Potential Awakening clause rather than a modification or extension of an
existing source and it independently passes the current retention gate.

Mindscape and refinement variants keep only values that can change a current
qualifying outcome: candidate membership, an authored prepared first choice,
or the current Result. A selectable value that changes none of those outcomes
needs no source-fact record; the input contract still accepts the selection.

When a retained effect reads an ordinary skill table and the product-qualified
Mindscape tier changes a current qualifying outcome, keep only its level-12,
level-14, and level-16 values. Use one scalar when the retained value does not
change; do not keep other levels or a general skill-level record. The product
contract owns which Mindscape selects each tier.

Do not keep base action DMG or Daze Multipliers, calculated `base_damage` or
`skill_daze`, or final action output. An additional skill-table coefficient that
forms part of an action's damage or Daze remains excluded. For an action already
retained by the setup direction, keep only a source-stated added amount or scale
factor that independently modifies its existing DMG Multiplier or Daze
Multiplier and changes the expanded numeric Result. Keep the operation's source
and action scope, but do not merge it with regular DMG Bonus or Daze Bonus.

## Fully Enabled Reachability

The product contract owns the fully enabled surface. Persist only the condition,
stack progression, cap, and compatibility needed to compute that surface.

Alternative trigger actions do not create one stack slot per action kind. A
repeatable qualifying route may reach the cap unless the game meaning requires
distinct categories. Do not add rotation, uptime, action-frequency, or
maintenance state.

## Examples

- A W-Engine Advanced Stat remains even when its passive is unavailable if that
  stat keeps the engine competitive for a current Agent.
- An Attribute qualifier remains internally when it determines whether a
  modifier applies, but it does not become public explanatory copy.
- A guide URL is removed after candidate policy is authored because changing
  the URL cannot change a current choice or Result.
- A numeric contribution source identity remains because removing it changes
  the expanded Result breakdown; its provider path does not.
