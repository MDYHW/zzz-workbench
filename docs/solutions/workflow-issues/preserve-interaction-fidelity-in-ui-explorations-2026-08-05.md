---
title: Preserve interaction fidelity in UI explorations
date: 2026-08-05
category: workflow-issues
module: setup-workbench-ui-exploration
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - "Creating a visual lab for an existing interactive product surface"
  - "Delegating layout, density, or selector-presentation exploration"
  - "Comparing UI variants intended for manual selection"
symptoms:
  - "The exploration preserved labels but omitted current user actions and selector states"
  - "Candidates changed undeclared control geometry and peer sizing"
  - "Controller review passed rendering checks before proving semantic baseline parity"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
related_components:
  - "setup-workbench"
  - "ui-exploration"
  - "worker-delegation"
tags:
  - ui-exploration
  - baseline-fidelity
  - interaction-states
  - acceptance-gates
  - delegation
---

# Preserve interaction fidelity in UI explorations

## Context

A Setup allocation experiment was meant to keep the current editable Setup as
its reference while comparing block footprints, alignment, type size, padding,
space allocation, and duplicated information. Isolating one Setup was correct;
turning that Setup into a static presentation card was not.

The delegation described content and editable cues but did not enumerate the
current actions, authority-required gaps, allowed experiment variables, or
representative states. The artifact therefore omitted real selector states,
showed Mindscape and pool as static values, changed substat control geometry,
and gave peer main-stat blocks unequal treatment. Its completion report proved
containment, focus, and overflow, but not fidelity to the workbench.

The controller repeated the same bias by inspecting geometry before mapping
every input to its current value, available action, and visible state. The
invalid lab was rejected and removed before production integration.

## Guidance

### Establish one reference-state contract

Before delegating or building variants, compare the applicable authority with
the current consumer. Keep the result in the task brief rather than creating a
new registry or evidence system.

Classify every in-scope item as:

- **Preserved baseline:** content, behavior, and control grammar shared by every
  candidate.
- **Explicit experiment variable:** the named presentation choice candidates
  may vary.
- **Authority-required gap:** behavior required by the owner but missing or
  incomplete in the current consumer; the experiment must name whether it is
  proposing that gap.
- **Out of scope:** behavior omitted from this bounded comparison.

For each retained or proposed input, name its current value, available user
action, and the representative closed, open, selected, disabled, hover, or
focus states needed to judge its footprint. If authority and implementation
differ, do not silently copy one or silently correct the other.

### Ask one comparison question per candidate set

A valid allocation question is: how should the same behavior-complete Setup
redistribute blocks, tracks, padding, and type within its admitted width?

A pool-control question is different: should the same Full and Non-limited
choice use a selector, toggle, or button array? Do not mix that control-grammar
experiment into an allocation comparison without declaring it. Comparable
variants keep every undeclared content, state, behavior, peer size, and control
form fixed.

### Keep minimal visual fixtures interaction-state-complete

A visual-only fixture need not implement calculation or lifecycle state. It
must still render the interaction envelope that determines layout. For the
current Setup this includes, where applicable:

- editable Mindscape and pool presentation;
- the closed W-Engine selection and a representative candidate-open state;
- refinement grouped with W-Engine;
- adjacent 4-piece and 2-piece selections and their candidate footprints;
- equal Slot 4, 5, and 6 peers plus a representative main-stat selector;
- real effective-substat count inputs, including zero and a wider count; and
- selected, single-candidate, hover, and keyboard-focus states.

A static value, focusable container, or `Change` label does not establish that
a selector or its space requirement has been represented. The surrounding app
may be omitted; the selected surface's actions may not.

### Separate authority correction from visual experimentation

The current presentation authority calls for equal-size circular substat
controls while the current consumer uses a rectangular stepper. Circular
controls are therefore not inherently unsupported. Introducing them silently
inside an allocation comparison is still invalid because it changes an
undeclared variable. Either preserve the current control for that comparison or
name the authority-conformance correction as its own question.

The inverse also applies. Mindscape may appear static in the current consumer,
but the product authority requires an editable M0 through M6 input. A complete
future Setup footprint cannot omit it merely because the implementation gap
exists; the gap must be named and represented when it is in scope.

### Make the worker brief executable

A delegated experiment identifies:

- the one user decision the variants should support;
- owned files and mutation limits;
- applicable authority sections and current component, CSS, tests, and browser
  reference;
- preserved inputs, actions, and states;
- explicit variables and forbidden substitutions;
- fixture policy, including identical content and state across candidates;
- required browser evidence and unresolved deviations; and
- a stop condition when baseline fidelity or authority reconciliation is
  unclear.

Phrases such as `same content` or `editable cues` are insufficient without the
actual actions and states they denote.

### Apply controller gates in dependency order

A worker completion report is evidence, not acceptance. The controller checks:

1. **Scope:** only owned files changed and markup is valid.
2. **Semantic parity:** every in-scope input has its required value, action, and
   representative state.
3. **Experiment isolation:** every difference is declared and preserved peers
   remain comparable.
4. **Interaction:** candidate, selected, fixed, hover, focus, long-label, and
   wider-value states are visible where applicable.
5. **Visual quality:** only after the earlier gates pass, evaluate type,
   alignment, block size, padding, density, collision, clipping, and overflow.

Failure at an earlier gate blocks manual style review even when the artifact is
visually clean.

## Why This Matters

An interactive surface's real footprint includes the choices and states that
are absent from its default screenshot. If those are omitted, the user is asked
to compare different products rather than different visual answers to one
question. Any selected direction then has to rediscover the missing space and
interaction decisions during production work.

This gate does not make a lab as complex as production. It keeps the rest of
the app out while retaining the minimum behavior-complete surface needed for a
valid comparison.

## When to Apply

- Existing interactive UI is isolated for layout, density, or typography work.
- A visual exploration is delegated to a worker.
- Selectors, disclosure, focus, or candidate states affect the required space.
- The current implementation and permanent authority are known to differ.
- Several variants will be presented for manual selection.

## Examples

| Classification | Valid treatment | Invalid treatment |
| --- | --- | --- |
| Preserved peer group | Slot 4/5/6 keep equal outer footprints and flexible internal `Slot | Stat | Value` tracks | Slot 6 grows or its label alone shrinks to preserve an arbitrary block |
| Explicit variable | Full/Non-limited is deliberately compared as selector, toggle, and button array | One candidate silently reduces pool to static text |
| Authority-required gap | Editable Mindscape receives a representative M0-M6 state when that gap is in scope | Current static M0 is mistaken for the complete product footprint |
| Selector state | Closed choice and representative local candidate region are both shown | `Change` copy is treated as proof of a selector |
| Authority correction | Substat shape is isolated as a named conformance question | Control geometry changes inside an unrelated allocation comparison |
| Fixture content | Every candidate uses identical, clearly synthetic or current factual content | A real equipment name is combined with invented effects that look factual |

## Related

- [Workbench UI Design Rules](../../workbench-ui-design-rules.md)
- [Setup Workbench Product Contract](../../setup-workbench-product-contract.md)
- [Agent Slot, Setup, and Result UI Requirements](../../brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md)
- [ZZZ-Inspired Workbench Style Direction](../../brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md)
