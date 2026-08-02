# Development workflow

This file defines repository operations. It does not define product meaning,
game facts, setup policy, or user-visible behavior.

## Ownership

- `AGENTS.md` gives repository-wide working constraints.
- The five Markdown files directly under `docs/` are the permanent product
  authorities. Each definition stays with its stated owner.
- `docs/plans/` contains bounded checkpoint decision artifacts. A plan explains
  one approved outcome and its non-goals; it is not another permanent authority.
- `src/workbench/content.ts` holds the retained facts for the currently implemented
  vertical. Those facts serve current consumers and do not form a catalogue.
- Behavior tests are the executable contract for calculation, state transitions,
  preservation and reset rules, and user-visible interactions.
- Components and browser verification own the concrete presentation of the
  behavior already settled by the authorities and checkpoint plan.
- Git commits record reviewed history. A commit does not replace any owner above.

## Change flow

1. Identify the current user input, visible choice, or Result affected by the
   change. If none exists, apply the repository's single-retention gate before
   adding structure or facts.
2. Read the applicable permanent authority. Change an authority only when
   product meaning or policy changes; do not use implementation details to fill
   an authority gap.
3. For a non-trivial user-visible checkpoint, create one bounded plan under
   `docs/plans/`. Keep explicit non-goals and mark the plan `completed` only when
   its behavior and verification are complete.
4. Implement from the visible outcome backward with the smallest representation
   that serves the current checkpoint.
5. Add behavior-bearing tests at the narrowest useful layer. Prefer assertions
   about inputs and observable outputs over file shape, component structure, or
   incidental copy.
6. Run `npm run check`.
7. If presentation or interaction changed, verify the affected flow in a real
   browser at desktop and narrow widths. Check interactions, horizontal
   overflow, and console errors.
8. Review the complete diff against the applicable authority and plan. Resolve
   actionable findings before declaring the checkpoint complete.
9. Commit logical, reviewed units with messages that describe user or
   maintainer value. Agents stage or commit only when the user explicitly asks.

## Canonical local gate

```sh
npm run check
```

The command runs the complete automated test suite and a production build. It
is the minimum repeatable gate before review or commit. Browser verification is
required in addition when a change has a visual or interactive consumer; it is
not represented as passing merely because the build succeeds.

## Definition of done

A checkpoint is done when all of the following apply:

- the approved visible behavior is complete and its explicit non-goals remain
  out of scope;
- relevant state and calculation behavior is covered by observable assertions;
- `npm run check` passes;
- affected UI flows have browser-visible verification at desktop and narrow
  widths;
- review has no unresolved actionable finding; and
- the checkpoint plan, when one exists, is marked `completed`.

## Add process only when it has a current consumer

The repository does not currently need CI configuration, an ADR registry, a
research archive, visual-regression infrastructure, a content-management
system, or an external issue tracker. Reconsider them only at these triggers:

- add CI when a shared remote or pull-request flow needs the canonical gate;
- add an ADR only when a recurring cross-cutting technical decision cannot live
  clearly in code, tests, or an existing owner;
- add visual regression when stable screens suffer repeated visual regressions;
- add content tooling when repeated authoring errors justify automation; and
- add an issue tracker when parallel contributors need ownership and scheduling.

Until then, plans, behavior tests, browser verification, review, and focused Git
history are the management system.
