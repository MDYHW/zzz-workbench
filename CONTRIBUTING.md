# Development workflow

This file defines repository operations. It does not define product meaning,
game facts, setup policy, or user-visible behavior.

## Ownership

- `AGENTS.md` gives repository-wide working constraints.
- The five Markdown files directly under `docs/` are the permanent product
  authorities. Each definition stays with its stated owner.
- Applicable approved records under `docs/brainstorms/` hold bounded supporting
  requirements; they remain subordinate to the permanent owners.
- `docs/plans/` contains active bounded execution artifacts plus a compressed
  completed-milestone index. A plan explains how to implement one already
  approved outcome; it is not another permanent authority or a durable product
  rule.
- `docs/authority-changes/` preserves one-decision change history governed by
  `GOV-001`; it records why authority changed but never supplies current
  meaning.
- `docs/audits/` stores compact recovery scope, status, mechanism manifest
  digests, and merged references. It contains no Agent answers or Version
  scope.
- `src/workbench/content/` and its `content.ts` facade hold retained facts for
  currently admitted Agents. Those facts serve current consumers and do not
  form a catalogue.
- Behavior tests are the executable contract for calculation, state transitions,
  preservation and reset rules, and user-visible interactions.
- Components and browser verification own the concrete presentation of the
  behavior already settled by the authorities, requirements, and active plan.
- Git commits record reviewed history. A commit does not replace any owner above.

## Change flow

1. Identify the current user input, visible choice, or Result affected by the
   change. If none exists, apply the repository's single-retention gate before
   adding structure or facts.
2. Read the applicable permanent authority. Change an authority only when
   product meaning or policy changes; do not use implementation details to fill
   an authority gap.
3. After requirements are accepted, follow the active-plan contract in
   [`docs/plans/README.md`](docs/plans/README.md) for a non-trivial
   user-visible checkpoint.
4. Implement from the visible outcome backward with the smallest representation
   that serves the current checkpoint.
5. Add behavior-bearing tests at the narrowest useful layer. Prefer assertions
   about inputs and observable outputs over file shape, component structure, or
   incidental copy.
6. Run `npm run check`.
7. If presentation or interaction changed, verify the affected flow in a real
   browser at desktop and narrow widths. Check interactions, horizontal
   overflow, and console errors.
8. Review the complete diff against the applicable authority and active plan.
   Resolve actionable findings before declaring the checkpoint complete.
9. After verification, close the active plan through the lifecycle defined in
   [`docs/plans/README.md`](docs/plans/README.md).
10. Commit logical, reviewed units with messages that describe user or
   maintainer value. Agents stage or commit only when the user explicitly asks.

## Authority traces and change records

Repository-governance rule
[`GOV-001`](AGENTS.md#authority-change-and-trace-governance) owns the required
transaction when permanent authority cannot decide a product meaning. An
Authority Change Record follows the schema and lifecycle in
[`docs/authority-changes/README.md`](docs/authority-changes/README.md); it is
decision history, not current product authority.

- Put the structured authority trace in the PR description. Do not add a
  permanent trace matrix or Agent answer file to the repository.
- Keep an ACR-only PR separate from the later permanent-owner-only amendment
  and from every dependent requirement, plan, production, or test change.
- Cite stable owner Rule IDs rather than copying their rule text. Missing owner
  support stops the change; code and tests cannot supply it.
- Publish independent semantic-review evidence outside the proposed diff and
  bind it to the current PR, base SHA, head SHA, diff digest, Rule IDs, and
  consumer paths. A later reviewable revision makes prior evidence stale.
- Update the compact recovery audit index only after the referenced change has
  merged. Store cohort scope, status, mechanism manifest digest, accepted
  merged PR/SHA references, and the index PR number, never per-Agent
  conclusions.

Protected authority, governance, shared-semantic, CI, and visual-baseline
changes require fresh product-owner approval of their latest revision. A
settled Agent-local change may later auto-merge only after the repository's
independent-review evidence and required checks prove their objective gates.

## Canonical local gate

```sh
npm run check
```

The command runs the complete automated test suite and a production build. It
is the minimum repeatable gate before review or commit. Browser verification is
required in addition when a change has a visual or interactive consumer; it is
not represented as passing merely because the build succeeds.

## Protected remote gate

The repository now has a shared pull-request and recovery flow, so local checks
are necessary feedback but not the acceptance boundary. Protected changes must
pass the repository's required governance-policy check, behavior tests, type
checking, production build, and any applicable stable-environment Playwright
visual check. A passing local run cannot replace a required remote status.

During authority-governance recovery:

- `unverified-baseline` and `unverified-baseline-3b2456a` preserve the exact
  forensic checkpoint and may not move;
- `recovery` accepts pull requests only and remains distinct from trusted
  `main`;
- every recovery pull request needs a fresh approval from the product-owner
  account until the full ruleset and reviewer-evidence workflow is proven;
- the project GitHub App may author non-protected branches and pull requests,
  but it has no protection bypass and bootstrap auto-merge remains disabled;
  and
- no Agent vertical, frozen plan, or roadmap continuation resumes until the
  recovery acceptance and promotion flow succeeds.

Repository operations and checks enforce this boundary. They do not define
product meaning or make a secondary requirement authoritative.

## Definition of done

A checkpoint is done when all of the following apply:

- the approved visible behavior is complete and its explicit non-goals remain
  out of scope;
- relevant state and calculation behavior is covered by observable assertions;
- `npm run check` passes;
- affected UI flows have browser-visible verification at desktop and narrow
  widths;
- review has no unresolved actionable finding; and
- the active checkpoint plan, when one exists, has been closed into its current
  owners and removed from the active plan set.

## Add process only when it has a current consumer

The shared remote, repeated semantic drift, and repeated portrait regressions
now supply current consumers for required CI, protected review, policy checks,
and stable visual-regression coverage. Keep those safeguards bounded to their
accepted recovery requirements; do not turn them into product owners or a
general evidence catalogue.

An ADR registry, research archive, content-management system, and external
issue tracker still require their own current consumer before introduction.
Active plans, behavior tests, browser verification, protected review, and
focused Git history remain the smallest management system outside the newly
justified safeguards.
