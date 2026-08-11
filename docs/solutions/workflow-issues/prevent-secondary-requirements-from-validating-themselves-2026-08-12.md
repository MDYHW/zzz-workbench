---
title: Prevent secondary requirements from validating themselves
date: 2026-08-12
category: workflow-issues
module: controller-refresh-and-requirements-authoring
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "A refreshed controller will author or review a new vertical"
  - "Secondary requirements add or change candidates, prepared representatives, or selected-input pressure"
  - "Reviewers validate an implementation against requirements written in the same change"
symptoms:
  - "The controller can narrate the permanent contract but cannot apply it to contrasting current consumers"
  - "A secondary requirement becomes the oracle that plans, code, tests, and browser checks merely confirm"
  - "A clean build and passing review stack create confidence in incorrect candidate or representative authoring"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
related_components:
  - "requirements-authoring"
  - "product-policy-review"
  - "test-design"
tags:
  - controller-refresh
  - requirements-authoring
  - candidate-policy
  - representative-setup
  - counterexample-review
  - semantic-drift
---

# Prevent secondary requirements from validating themselves

## Context

A controller refresh preceding the Corin and Lycaon vertical read the permanent
authorities and correctly summarized the workbench architecture, but it did not
prove that the refreshed controller could apply those authorities to nearby
consumers with different meanings. It authored three unsupported conclusions:

- Corin prepared Steel Cushion in both pools without an independently resolved
  full-pool whole-package and finite-substat comparison.
- Lycaon retained CRIT Rate after leaving King of the Summit even though the
  selected King threshold was his only current CRIT consumer.
- Proto Punk survived because its trigger was distinct, although a different
  legal trigger is insufficient when a stronger same-axis complete package
  dominates all usable meaning.

The implementation, tests, build, browser verification, and reviews then
passed. They checked code against the new requirements instead of first trying
to disprove the requirements against permanent authority and established
consumers. The secondary document became its own oracle.

A later advisory review repeated the pattern by overgeneralizing the Lycaon
conclusion to Trigger and by treating Swing Jazz and Moonlight Lullaby as one
candidate because their two-piece Energy Regen values match. Current repository
behavior contradicts both claims: Trigger has an independent CRIT-derived
Aftershock Daze relationship, and exact Disc identity still changes selected
artwork, source disclosure, and same-set legality.

This was not primarily a missing Product Contract rule. The contract already
required current-consumer routing, whole-package and opportunity-cost review,
same-axis dominance, authored first choices, and selected-pressure lifecycle.
The missing workflow step was an operational proof that the refreshed
controller could apply those rules and reject an attractive false analogy.

## Guidance

### Accept an operational refresh, not a narrative refresh

Before a controller owns new requirements, require a small repository-only set
of sentinel cases. For each case, the controller derives this chain without
being given the conclusion:

```text
current source or retained relationship
-> recipient, formula, action, threshold, or exact-identity consumer
-> candidate or prepared-representative consequence
-> preparation or direct-edit lifecycle
-> visible Setup or Result consequence
```

Each derivation includes the closest similar current case and one contrasting
case. Choose the bounded set from the upcoming change surface. Useful semantic
boundaries include:

- a stat consumed only by selected equipment versus the same stat consumed by
  an independent Agent relationship;
- numerically equal equipment effects whose exact identities still change a
  current choice or legal complete package;
- authored base, contextual, and selected-input-derived candidates;
- full and non-limited representatives whose whole-package and zero-substat
  opportunity costs may differ; and
- selected-pressure present, absent, and reselected states.

A product-thesis summary, clean Git status, test count, browser pass, or reviewer
count cannot substitute for these derivations.

### Gate only new or changed authoring decisions

Before requirements close, examine every candidate membership or prepared first
choice being added or changed:

```text
- authored direction and role
- exact holder eligibility and activation compatibility
- exact current formula, action, threshold, or operation consumer
- origin: base, contextual, or selected-input-derived
- nearest usable same-axis competitor in the same availability pool
- usable and unused clauses in each complete package
- finite slot and substat opportunity costs at the authored zero-substat start
- pool-specific prepared first choice
- contrary condition where the candidate or pressure disappears
- on -> off -> reselect lifecycle when a selected input supplies the pressure
```

Persist only the resulting bounded policy. This check is not a source registry,
evidence payload, runtime score, optimizer, candidate catalogue, or universal
condition language. If exact evidence cannot resolve a representative, stop
authoring that representative rather than guessing a replacement.

Eligibility precedes package comparison. A package with stronger visible values
cannot dominate for a holder that fails its exact Specialty or activation
condition. Comparing retained numbers before compatibility can select a false
same-axis competitor even when the later whole-package arithmetic is correct.

### Disconfirm feedback before accepting it

Controller and reviewer feedback is advisory. The receiving controller checks
the owning permanent rule, the nearest established consumer, and an active
counterexample search before accepting it. A previous controller, larger model,
or unanimous review stack is not another authority.

The required review order is:

1. challenge new requirements against the permanent owner;
2. compare them with completed requirements and current behavior-bearing
   consumers;
3. challenge new candidate and representative policy through whole-package,
   dominance, opportunity-cost, and lifecycle rules;
4. write the implementation plan only after that product review succeeds; and
5. review code, tests, build, and browser behavior against the independently
   accepted requirements.

A useful adversarial question is:

> Which existing correct case would disprove this conclusion if it were
> generalized too broadly?

### Test mechanisms together with their contrast

Selected-input pressure needs a shared mechanism test covering all three
states:

```text
pressure source selected
-> the effective candidate set reflects its authored add or remove rule
-> any newly invalid selected input clears without fallback

pressure source removed
-> the pressure-absent candidate set returns
-> a cleared prior selection is not restored and any newly invalid opposite
   selection clears without fallback

pressure source reselected
-> the original pressure-present candidate set returns under the same rule
-> no candidate is selected automatically
```

Pair one representative with one contrast. Do not create one suite per Agent or
vertical and do not duplicate source values merely to freeze content.

## Why This Matters

Without an upstream product-policy gate, verification can form a closed loop:

```text
unsupported authoring conclusion
-> secondary requirement records it
-> implementation follows it
-> tests encode it
-> reviewers confirm agreement
-> full verification reports success
```

The loop creates high confidence without independent product validation. It
also reopens already-settled semantics, expands correction work, and makes
passing gates misleading. Operational sentinels prove that a refreshed
controller can use the contract. Bounded authoring checks catch unsupported
equipment policy before code. Contrasting consumers prevent a local correction
from breaking a nearby correct case.

## When to Apply

- A new controller assumes responsibility after a refresh.
- A vertical adds or changes candidate membership or a prepared representative.
- Selected equipment adds or removes downstream stat or set pressure.
- Two equipment choices have similar or equal retained numeric effects.
- Reviewer feedback proposes changing an established mechanism.
- Full and non-limited representatives match without a pool-specific
  whole-package comparison.
- Tests and reviews pass but share requirements authored in the same change.

Do not re-derive the entire roster for unrelated work. Route the bounded review
through changed roles, formulas, actions, stat pressures, Specialties, and the
nearest current consumers.

## Examples

### Trigger and Lycaon: similar input, different consumers

Removing King from Lycaon removes his current CRIT threshold consumer, so a
CRIT candidate authored only for that relationship must disappear. Removing
King from Trigger removes one threshold consumer but leaves Trigger's
CRIT-derived Aftershock Daze relationship. Trigger therefore retains CRIT.

The policy follows the current consumer, not Agent identity, Specialty, or the
Disc name.

### Swing Jazz and Moonlight Lullaby: equal value, distinct identity

Their two-piece Energy Regen values match, but exact identity remains material
after both independently pass candidate authoring. Selecting Moonlight Lullaby
as four-piece makes its own two-piece identity illegal while Swing Jazz remains
a legal complement. Numeric equality does not erase current selection, source,
artwork, or complete-package legality.

### Corin representative authoring

Legality and broad usefulness do not establish a first choice. Compare each
same-pool package through Base ATK, advanced stat, usable passive, unused-clause
opportunity cost, finite main/substat supply, and the nearest same-axis
competitor. If that comparison does not resolve the full-pool representative,
leave it as an authoring stop. The non-limited choice cannot prove the full-pool
choice.

### Lycaon Disc comparison: eligibility before dominance

Moonlight Lullaby can look stronger than Proto Punk from compressed values:
Energy Regen +20% and squad DMG +18% versus an unused Shield Effect +15% and
squad DMG +15%. That comparison is invalid for Lycaon because Moonlight's
4-piece activation requires a Support holder and Lycaon is Stun. Astral Voice
is the usable same-axis comparison for his retained Quick Assist and buffer
direction. This candidate comparison does not establish a universal Focus
recipient for Astral's entrant effect; recipient projection remains a separate
consumer question.

## Related

- [Setup Workbench Product Contract](../../setup-workbench-product-contract.md)
- [Source-Fact Boundary](../../source-fact-boundary.md)
- [First Vertical Completion Review Requirements](../../brainstorms/2026-08-06-first-vertical-completion-review-requirements.md)
- [Vertical Expansion Efficiency Plan](../../plans/2026-08-10-003-refactor-vertical-expansion-efficiency-plan.md)
- [Preserve Interaction Fidelity in UI Explorations](preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md)
- [Soldier Zero Vertical Requirements](../../brainstorms/2026-08-07-soldier-zero-vertical-requirements.md)
