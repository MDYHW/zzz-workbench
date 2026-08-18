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
settled Agent-local change may merge without a manual owner review after the
repository's independent-review evidence and required checks pass their
objective gates.

## Canonical local gate

```sh
npm run check
```

The command runs the complete automated test suite and a production build. It
is the minimum repeatable gate before review or commit. Browser verification is
required in addition when a change has a visual or interactive consumer; it is
not represented as passing merely because the build succeeds.

## Protected remote gate

The repository has one protected pull-request flow, so local checks
are necessary feedback but not the acceptance boundary. Protected changes must
pass the repository's required governance-policy check, behavior tests, type
checking, production build, and any applicable stable-environment Playwright
visual check. A passing local run cannot replace a required remote status.

The promotion boundary preserves the recovery history while establishing the
permanent branch topology:

- `unverified-baseline` and `unverified-baseline-3b2456a` preserve the exact
  forensic checkpoint and may not move;
- `recovery` is the frozen attested checkpoint and remains distinct from trusted
  `main`;
- protected `main` accepts pull requests only and is the permanent default;
- the completed bootstrap phase required a fresh product-owner approval for
  every recovery pull request and kept App merge disabled until the full
  ruleset and reviewer-evidence workflow was proven;
- under the current conditional gate, the project GitHub App may author and
  merge non-protected branches and pull requests without another owner review,
  while protected changes still require the fresh approval defined below and
  the App never receives protection bypass; and
- no Agent vertical, frozen plan, or roadmap continuation resumes until the
  recovery acceptance and promotion flow succeeds.

Repository operations and checks enforce this boundary. They do not define
product meaning or make a secondary requirement authoritative.

### Pull-request evidence and conditional approval

Start every PR from the repository template and keep exactly one
`## Authority trace` section. Use current stable Rule IDs and exact
`path#symbol` consumer references. `Not applicable` is accepted only with the
reason it does not apply. Declaring `agent-local` does not make a shared change
local; trusted base code computes protection independently and declarations may
only escalate it.

After an independent semantic review of the latest revision, publish one
top-level issue comment through the project App. Put this marker before the
JSON fence in that same comment:

`<!-- zzz-workbench:authority-review:v1 -->`

```json
{
  "schema": "zzz-workbench-authority-review/v1",
  "kind": "authority-review",
  "result": "pass",
  "reviewerRun": {
    "id": "<review run>",
    "completedAt": "<ISO-8601 time>",
    "reviewers": ["<reviewer identity>"]
  },
  "prNumber": 1,
  "baseSha": "<40 lowercase hex>",
  "headSha": "<40 lowercase hex>",
  "diffDigest": "sha256:<64 lowercase hex>",
  "classification": "agent-local",
  "traceDigest": "sha256:<64 lowercase hex>",
  "mechanismDigest": "none",
  "ruleIds": ["SW-001"],
  "consumers": ["src/path.ts#symbol"]
}
```

Editing or deleting the current comment, changing the PR body or head, or
changing a bound tree invalidates it. Do not add this payload to the proposed
repository diff.

Six unique required contexts gate `main`: `Trusted Governance`,
`Protected Approval`, `Behavior Tests`, `Type Check`, `Production Build`, and
`Visual Baseline`. All six target the current PR head SHA. The four job contexts
come from `pull_request` runs bound to the exact current PR, base, and head;
their default checkout may test GitHub's generated merge ref without making
that generated commit a second status target. Each job must appear exactly once
and finish with `success`; GitHub's native skipped or neutral treatment is not
sufficient here.

One head SHA may belong to only one pull-request lifecycle in this repository.
If a pull request is replaced or recreated, create a new commit first; reusing
the previous head SHA fails trusted evaluation so head-scoped contexts cannot
leak between pull requests.
A successful `Trusted Governance` status also records in its description and
target URL the exact PR, base SHA, and the two selected child workflow-run IDs
used for that decision.

An Agent-local or other routine non-protected PR needs no manual owner review
after its evidence and required contexts pass. A protected PR needs a current
approval from `Min-DongYoung` after the latest evidence; a later push or
evidence update invalidates that approval.

### Local GitHub App launcher

Keep the App PEM outside the repository. Provide only absolute executable and
credential paths:

```powershell
$env:ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH = 'C:\Users\mdy06\.config\zzz-workbench\<app-key>.pem'
$env:ZZZ_WORKBENCH_GIT_EXECUTABLE = '<absolute path to git.exe>'
$env:ZZZ_WORKBENCH_GH_EXECUTABLE = '<absolute path to gh.exe>'
```

Invoke the launcher by absolute path from a clean local `main` worktree
whose HEAD equals local `origin/main`. The current working directory may be
the clean candidate worktree for branch-bound operations. The allowlisted
launcher commands are:

```text
node scripts/github-app/run-as-installation.mjs git-push <codex/branch>
node scripts/github-app/run-as-installation.mjs pr-create <codex/branch> <title> <body>
node scripts/github-app/run-as-installation.mjs pr-edit <number> <title> <body>
node scripts/github-app/run-as-installation.mjs evidence-upsert <number> <body>
node scripts/github-app/run-as-installation.mjs pr-merge <number> <40-char-head-sha>
```

For PR bodies, comments, and evidence payloads, replace the final body argument
with `--body-file <absolute-path>` to avoid shell quoting or command-line length
loss. The launcher reads at most 64 KiB and applies the same exact schema.

`pr-create` reuses only an exact same-head, same-body open PR and reconciles it
after an ambiguous creation result. A failed pre-mutation lookup reports
retryable `pr_create_lookup_unavailable`; if both creation and the immediate
post-mutation lookup are inconclusive, it reports retryable
`pr_create_result_unknown` with the verified head identity instead of falsely
declaring failure. `evidence-upsert` creates or replaces the
single marked App comment and reconciles the marker after an ambiguous write
before allowing a retry. `pr-merge` performs an
immediate exact-head squash only after its trusted metadata/evidence preflight
and an exact-success rollup check for all six required contexts. This preserves
the App's no-Actions and no-status/check-write permission boundary: Checks and
Commit statuses are read-only because GitHub requires both to expose the
combined PR rollup. Head uniqueness and the trusted governance context prevent
another PR lifecycle from lending results.
Job rollup entries are selected by the sealed workflow-run IDs and latest
visible attempt, so older cancelled reruns are ignored while duplicate current
entries fail.
`merge_checks_pending` is a retryable pre-mutation result, and an ambiguous
merge is reconciled against the exact head before it reports success or the
retryable `merge_result_unknown` result. Failed required checks are retried
later rather than queued as auto-merge.
An ambiguous non-force `git-push` reports retryable `git_push_result_unknown`
with the exact branch and HEAD, and an ambiguous `pr-edit` first reconciles the
exact title and body before reporting retryable `pr_edit_result_unknown`.
Every success and failure is machine-readable JSON, and a cleanup failure states
whether the mutation already completed. The launcher rejects another
repository, protected branch push, force operation, arbitrary subprocess, or
broader token scope.

Run the focused governance gate with `npm run test:governance`; `npm run check`
includes it before the existing behavior, type, and production-build gates.
The owner-only recovery finalization re-reads the live `recovery` tip, the
candidate's single creating PR, that PR's actual successful workflow jobs and
trusted commit statuses, and the live tip again before emitting an attestation.
It also reconstructs the exact historical base/head trees and validates the
creating PR's current body, App evidence comment, and current exact-head owner
approval; post-merge withdrawal or editing therefore blocks finalization.
GitHub may omit `pull_requests` from a merged workflow-run response, so this
post-merge check joins those recorded run IDs and exact-head runs to the one
unique creating PR instead of depending on that transient array. It never
synthesizes success from the local gate.

The trusted evaluator installs the dependency graph pinned by the trusted
`recovery` lockfile with lifecycle scripts disabled. It parses selected PR
TypeScript blobs only as inert syntax for the narrow Agent-local proof and does
not install, import, or execute the proposed PR's package or code.

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
