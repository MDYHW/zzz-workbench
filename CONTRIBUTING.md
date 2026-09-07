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

### Public static RC delivery

The public client is delivered from a separate neutral Organization and its
root Pages repository. This workflow never gives the private-development App or
personal account authority over that public destination. It also never treats a
passing build, a footer, or repository ownership as legal approval.

The public-release controller under `scripts/github-app/` exposes only five
mutation commands. Each accepts one absolute external JSON input path:

```text
node <absolute-trusted-main>\scripts\github-app\public-release.mjs prepare --input-file <absolute-command-json>
node <absolute-trusted-main>\scripts\github-app\public-release.mjs bootstrap --input-file <absolute-command-json>
node <absolute-trusted-main>\scripts\github-app\public-release.mjs publish --input-file <absolute-command-json>
node <absolute-trusted-main>\scripts\github-app\public-release.mjs restore --input-file <absolute-command-json>
node <absolute-trusted-main>\scripts\github-app\public-release.mjs disable-pages --input-file <absolute-command-json>
```

Each command JSON uses `zzz-workbench-public-release-command/v1` and exactly
the following command-specific `paths` object. These redacted examples show
shape only; replace every path with the protected absolute path for the actual
run, keeping all paths distinct and outside the repository except the
`prepare.repositoryRoot` trusted `main` checkout.

```json
{
  "schema": "zzz-workbench-public-release-command/v1",
  "kind": "prepare",
  "paths": {
    "candidate": "C:\\Release\\candidate.json",
    "decisionTemplate": "C:\\Release\\decision-template.json",
    "extractionRoot": "C:\\Release\\fresh-extraction",
    "gitExecutable": "D:\\Tools\\Git\\cmd\\git.exe",
    "npmCli": "D:\\Tools\\npm\\bin\\npm-cli.js",
    "githubConfig": "C:\\Release\\github-config.json",
    "releaseContext": "C:\\Release\\release-context.json",
    "repositoryRoot": "C:\\PrivateCheckout\\zzz-workbench",
    "trustedController": "C:\\Release\\trusted-controller.json"
  }
}
```

`githubConfig`, `releaseContext`, `repositoryRoot`, `gitExecutable`, and
`npmCli` must already exist. `extractionRoot` must already exist as a fresh,
empty, real directory. `candidate`, `decisionTemplate`, and
`trustedController` must not exist: `prepare` creates each exclusively. It
returns the artifact and manifest identities plus the next phase. Review the
candidate, then copy the emitted decision template to a separate new decision
file and edit only the decision, issuer, UTC issue/expiry, and phase
revalidation fields; do not hand-author or edit the candidate or trusted seal.

```json
{
  "schema": "zzz-workbench-public-release-command/v1",
  "kind": "bootstrap",
  "paths": {
    "candidate": "C:\\Release\\candidate.json",
    "decision": "C:\\Release\\bootstrap-decision.json",
    "githubConfig": "C:\\Release\\github-config.json",
    "operationDirectory": "C:\\Release\\bootstrap-operation"
  }
}
```

```json
{
  "schema": "zzz-workbench-public-release-command/v1",
  "kind": "publish",
  "paths": {
    "candidate": "C:\\Release\\candidate.json",
    "decision": "C:\\Release\\publish-decision.json",
    "githubConfig": "C:\\Release\\github-config.json",
    "operationDirectory": "C:\\Release\\publish-operation"
  }
}
```

```json
{
  "schema": "zzz-workbench-public-release-command/v1",
  "kind": "restore",
  "paths": {
    "candidate": "C:\\Release\\retained-candidate.json",
    "decision": "C:\\Release\\restore-decision.json",
    "githubConfig": "C:\\Release\\github-config.json",
    "operationDirectory": "C:\\Release\\restore-operation",
    "trustedController": "C:\\Release\\current-trusted-controller.json"
  }
}
```

```json
{
  "schema": "zzz-workbench-public-release-command/v1",
  "kind": "disable-pages",
  "paths": {
    "githubConfig": "C:\\Release\\github-config.json",
    "incidentConfirmation": "C:\\Release\\disable-confirmation.json",
    "operationDirectory": "C:\\Release\\disable-operation",
    "trustedController": "C:\\Release\\current-trusted-controller.json"
  }
}
```

For the last four commands, every file path is a pre-existing input and
`operationDirectory` must be a separately created fresh, empty, real directory.
The controller writes only its sealed child-operation file there. Use a fresh
directory for every attempt; a reconciliation-required result is inspected,
not retried with a reused directory. `restore` consumes a retained accepted
candidate and a current trusted-controller seal. `disable-pages` consumes a
fresh, ten-minute exact-destination confirmation. Each success object names its
completed state and next manual action; failures are JSON on stderr with a
nonzero exit code and an explicit `failed` or `reconcile-required` state.

The command file and every configuration, receipt, manifest, candidate, decision,
operation directory, and App key stay outside every repository at
protected absolute paths. Every command file uses the exact versioned schema and
contains only the documented command-specific `paths` object; unknown or repeated
paths fail closed. The operational configuration uses the
exact neutral Organization, root repository, fixed branch, two App and
installation identities, neutral bot identities, exact allowed provider actors,
forbidden private identifiers, and external key paths. Do not put these values
in a command argument, repository file, copied log, or public artifact.
`prepare` also writes a current trusted-controller seal beside the candidate and
decision template. `restore` and `disable-pages` consume that separate seal;
neither accepts a caller-selected executable as current controller authority.

#### Candidate and manual decision

1. Start from a clean local `main` worktree whose `HEAD` equals local
   `origin/main`. The trusted controller path must be absolute and that checkout
   must equal the expected private remote.
2. Extract the verified Git commit object into a new temporary build root. Use
   the absolute `npm-cli.js` through the sealed Node 24 executable for
   `npm ci --ignore-scripts` and one `npm run build`; never enable a command
   shell to execute `npm.cmd`. Seal and revalidate the complete regular-file
   npm package tree—including the CLI entry, libraries, metadata, and vendored
   dependencies—and reject redirects, symlinks, or unsupported entries. No existing
   `node_modules` or `dist` participates. Git and npm run with separate exact
   minimal environments: ambient `GIT_*`, `NODE_OPTIONS`, `NODE_PATH`, npm
   user/global configuration, credentials, and release-private variables are
   never inherited. A project `.npmrc` is not an accepted build input.
3. Select the intended privileged phase (`bootstrap`, `publish`, or `restore`)
   in the external release context. Admit only the generated
   static tree and `.nojekyll`. Keep the canonical
   manifest, SHA-256 tree identity, source binding, and receipt private.
4. Manually review every emitted file's provenance and redistribution basis,
   the exact footer wording, the non-commercial operator/use model, current
   guidance, and the actual unrestricted worldwide reach of GitHub Pages. A
   jurisdiction subset cannot authorize this host.
5. Store the accepted or rejected exact-schema decision outside the repository.
   It binds the artifact, wording, guidance identities/digests, issuer, issue
   time, and reviewer-selected expiry. Revalidate it for each privileged phase;
   changed bytes, wording, use model, reach, or material guidance requires a new
   decision.

Keep the trusted-controller seal private and immutable. Regenerate it with a new
`prepare` after current `main`, Git, Node, the fixed child, or the destination
configuration changes; a historical artifact decision does not replace this
current execution seal. The retained artifact candidate itself is phase-neutral:
for restore, start from its original decision template, select `restore` in the
phase revalidation, and perform a fresh owner review without rebuilding or
changing the retained bytes.

The private candidate and decision bind the exact controller root, repository
root, expected remote, canonical Git/Node executable identities, the complete
npm package-tree identity and real path,
the fixed child Git blob and bytes, the canonical GitHub configuration and App
identities, source commit/tree, and artifact denylist. `prepare` therefore also
requires the external GitHub configuration. Before reading an App key,
`bootstrap`, `publish`, and `restore`
re-run Git directly with `shell: false` and require clean `main`,
`HEAD == origin/main`, the bound remote, roots, tools, configuration, and
configured private identifiers. Git system/global configuration and repository
environment overrides are disabled for those reads. Bootstrap and publish additionally require the
candidate commit/tree to equal current `main`; restore permits a still-accepted
historical candidate only when its exact commit/tree exists and is an ancestor
of current `main`. Bootstrap and publish use the candidate-bound fixed child and
Node identity. Restore keeps the historical artifact binding but uses fixed-child,
Git, and Node identities re-verified from current clean `main`, so an old artifact
never restores through superseded privileged code. The child bytes are streamed
from the verified Git blob over stdin and never execute a mutable checkout path.
Build tools and third-party
Actions never receive a key, key path, release configuration, or installation
token. A fresh key exists only for its authorized publication window.

#### Bootstrap and routine publication

While the dedicated Organization is empty, install the neutral publisher App
for all current and future repositories. The bootstrap App then creates the one
private root repository, establishes the private `.nojekyll` root needed for an
empty repository, creates the complete accepted successor tree, installs the
publisher-only normal-update bypass ruleset, verifies the complete tree, makes
the repository public, and enables root-branch Pages.

Every public artifact commit uses only the neutral App identity and one complete
tree. Routine publication uses only the contents-write publisher App. Its fixed
child reads the current authenticated destination tip internally, creates all
blobs and a complete tree, and performs one non-force ref update. Never widen
the publisher with Administration or Pages permission.

After live RC verification, revoke the bootstrap token. In private App settings,
create the required protected offline replacement, delete the used bootstrap
key, remove bootstrap contents permission, and delete the external key file.
Verify the App and installation permissions and local key absence manually;
local absence alone is not proof of provider-side deletion.

#### Manual live verification and Beta handoff

The controller does not claim live verification. Before announcing the RC or
Beta, manually inspect the exact neutral Organization and repository and record
the observation privately. Confirm repository visibility, default branch and
ruleset, Pages source and deployed commit, and every manifest path against its
expected bytes. In a clean browser session, confirm the stable URL loads, the
client makes only expected same-origin requests, and no private identifier or
credential appears in the document, assets, requests, storage, or error output.
Inspect public commit, contributor, deployment, and event identities after
provider metadata has settled. Unexpected or incomplete evidence blocks the
announcement.

Repeat the artifact decision, deployed-byte, actor, and dormant bootstrap-key
checks immediately before Beta. GitHub Issues may be enabled as intake only;
confirm the personal account is not exposed through ownership, commits,
automation, replies, or moderation activity, and disable unintended discussion
surfaces.

The owner-reviewed announcement candidate must include:

- the stable Pages URL;
- `UI`, `Setup`, `Result`, `source`, and `operation` as suggested feedback
  keywords;
- optional browser/device context and a redacted screenshot;
- notice that GitHub Issues and community chat are public, third-party-hosted
  submissions;
- a warning not to include personal or game-account identifiers and to remove
  those details from screenshots;
- the intake-only Issues and community-chat discussion split; and
- the rule that the personal account does not reply, close, label, or triage in
  public. If unsafe disclosure needs moderation, pause Issues and use GitHub's
  private support or moderation path.

Publication never posts or announces Beta automatically.

#### Stop and incident recovery

On any failed gate, unexpected public byte or actor, suspected credential leak,
loss of operator control, or ambiguous mutation, stop new publication and revoke
the active token and affected key. Run `disable-pages` with only the external
configuration, an exact current trusted-controller binding, an explicit
destination/incident confirmation, and a fresh empty operation directory. It
rechecks current clean `main`, tool and child identities, the configuration
digest, and the exact destination before reading the stop key. It uses the fixed Pages
child and can neither delete the repository nor rewrite its contents. Reconcile
the exact live repository, ref, Pages, App installation, and credential state
manually before any later publication. Use `restore` only with a newly accepted
exact candidate and current restore-phase decision.

There is no automated repository-delete, capture, rebuild, status, or recovery
command. If repository deletion is necessary, first keep the required private
incident evidence and an independently prepared supported artifact outside all
repositories, disable Pages, and verify the exact neutral Organization and root
repository. The product owner must then explicitly confirm the irreversible
deletion in GitHub's private Organization UI and perform it there manually.
Never authorize deletion from a chat approval, saved command file, App child, or
local script. After deletion, recreate only through a fresh `prepare` with phase
`bootstrap`, a fresh exact-artifact decision, and a separate `bootstrap` call;
do not reuse an earlier publication operation.

Deleting the controlled origin cannot retract forks, clones, archives, provider
caches, search indexes, or material already observed by others. Record that as
irreversible exposure and complete the required private provider/legal follow-up;
never report global erasure. Rotate or retire affected keys privately, then
repeat the complete manual live-verification checklist before service or
announcement resumes.

Run the focused governance gate with `npm run test:governance`; `npm run check`
includes it before the existing behavior, type, and production-build gates.

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
