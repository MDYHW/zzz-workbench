# AGENTS.md

## Product

This repository builds a Zenless Zone Zero setup workbench. Users choose three
Agents, receive one complete prepared starting setup for each current Agent and
W-Engine availability pool, adjust those competitive setup inputs, and
understand the current setup through visual Result values, numeric breakdowns,
action differences that materially change the Result, and threshold or cap
gauges.

Game accuracy is a means to that experience, not an independent product goal.
Retain every distinction needed for a current user-visible choice or Result.
Simplify additional realism only when it does not materially improve the setup
decision or its visual interpretation.

## Authority

The five Markdown files under `docs/` are the only initial permanent
authorities. Read the applicable owner before making a product or semantic
decision. Definitions have one owner.

Applicable supporting requirements under `docs/brainstorms/` record accepted
bounded product outcomes once approved. Active plans describe only the
implementation work still in progress, and `docs/plans/README.md` owns their
lifecycle plus a compressed completed-milestone index. None is a permanent
authority: when a later accepted requirement changes an outcome, correct the
current owning requirement in place and do not use an older plan, milestone
summary, or supersession note as the current rule. Git history, not a searchable
archive directory, preserves removed completed-plan detail.

The archived predecessor repository, its Git history, tasks, implementation,
tests, plans, and assets are not authorities and must not be consulted or
imported unless the user explicitly authorizes a specific reuse later.

`docs/solutions/` contains category-organized workflow and implementation
learnings with searchable YAML frontmatter such as `module`, `tags`, and
`problem_type`. These records are relevant when similar work recurs, but they
do not become product authorities.

## Authority-Change And Trace Governance

The rule in this section governs repository transactions. It is not a sixth
permanent product or game authority and cannot supply a product conclusion.

**Governance Rule ID:** `GOV-001`

The `GOV-###` namespace belongs to repository governance in this file. Allocate
its numbers monotonically and never reuse one. A wording clarification that
preserves the transaction keeps its identifier. A split, merge, replacement,
or retirement reserves the old identifier under a local `Retired Governance
Rule IDs` heading and allocates new identifiers to the resulting current
transactions.
Historical ACRs continue to resolve retired identifiers from that owner-local
ledger, while new traces and new ACR decisions may cite only current Rule IDs.

When current permanent authority cannot decide a required product meaning:

1. Stop dependent requirement, plan, production, test, and audit-completion
   work. A current implementation, test, review, or user approval of dependent
   code cannot fill the missing owner.
2. Open one Authority Change Record for one decision using
   `docs/authority-changes/README.md`. Its protected PR contains ACR files only;
   it does not amend a permanent owner or dependent artifact.
3. Independently reconstruct the existing owner rule, exact current consumer,
   nearest similar case, contrast, impact, and proposed change. The ACR remains
   subordinate decision history and does not become current meaning.
4. Record the product owner's accepted or rejected outcome on the latest ACR
   revision and obtain fresh owner approval before merging that record. A
   proposed, rejected, or stale record authorizes no authority amendment.
5. After an accepted ACR is merged, amend only the affected permanent owner in
   a separate protected PR. The cited immutable accepted record must reference
   the same current Rule ID named by the amendment trace in that permanent
   file; an unrelated accepted record, including one for a different rule in
   the same owner, cannot authorize the amendment. That PR contains no
   requirements, plans, production code, tests, or audit completion.
6. Only after the owner amendment merges may later bounded changes correct
   subordinate requirements, implementation, and tests. Their verification
   proves fidelity to the already-current owner rather than validating the
   owner change.

The ACR state machine and post-merge mutation boundary have one owner:
`docs/authority-changes/README.md`. This rule owns the transaction ordering but
does not duplicate or redefine those record transitions.

Every new or re-audited high-risk conclusion carries this structured trace in
the PR description rather than in a repository answer catalogue:

- change classification and any protected reason;
- owning stable Rule ID or IDs;
- exact current consumer paths and symbols;
- nearest similar current case and contrasting current case;
- bounded candidate or prepared consequence;
- pressure, allocation, or direct-edit lifecycle when applicable, or why it is
  not applicable;
- visible Setup or Result consequence; and
- behavior verification plus any prerequisite accepted ACR and owner-amendment
  references.

Independent semantic-review evidence stays outside the proposed diff and binds
the PR number, reviewed base SHA, head SHA, diff digest, the canonical digest
of the complete Authority trace, traced Rule IDs, and consumer paths. CI may
validate that evidence's provenance, shape, and
freshness; it cannot establish that the semantic conclusion is correct. The
compact recovery index stores only cohort scope, status, mechanism manifest
digest, accepted merged PR/SHA references, and its own PR number.

### Trusted governance execution

The protected `recovery` revision owns the remote evaluator. The
`pull_request_target` workflow checks out `recovery` explicitly and may read
GitHub API metadata, Git tree identities, exact proposed Git blobs as untrusted
text or binary data, current top-level issue comments, reviews, and workflow
runs. It installs only the dependency graph pinned by the trusted `recovery`
lockfile with lifecycle scripts disabled; its trusted parser may inspect a
proposed TypeScript blob as inert syntax but never imports or executes it. It
never checks out or downloads executable artifacts from the proposed PR. PR
behavior, type, build, and visual jobs run
separately with a read-only token and no repository secret.

The six required merge contexts have unique meanings and names:

- `Trusted Governance` is a commit status for the current PR head SHA;
- `Protected Approval` is a separate commit status for that same head SHA;
- `Behavior Tests`, `Type Check`, and `Production Build` are exact PR job names;
  and
- `Visual Baseline` is always present and reports either an exact success or an
  explicit policy-verified not-applicable success.

The trusted evaluator accepts only exactly one successful current job for each
required name. Missing, failed, cancelled, skipped, neutral, duplicate, stale,
or differently bound outcomes fail closed. Status and job names must not
collide. GitHub rules bind every required context to the observed GitHub
Actions integration and require the branch to be current.
Each required `pull_request` workflow run must bind the exact PR number, base
SHA, and head SHA, and its GitHub status target must equal that head SHA.
GitHub may execute the workflow's default checkout from its generated merge
ref; that tested merge state is not a second required-status identity.
A successful `Trusted Governance` status records in its description and target
URL the exact PR, base SHA, and two selected child workflow-run IDs used by the
decision. The launcher and finalization can therefore reject stale results
without trusting mutable post-merge arrays.
A recovery head SHA must belong to exactly one repository pull-request
lifecycle. Reusing the same head commit in another pull request fails closed;
create a new commit before opening the replacement pull request.

PR metadata cannot lower protection. Permanent authority, ACR, audit-index,
governance/CI, shared semantic, and visual changes are protected. A production
change is Agent-local only when trusted base code can prove one additive Agent
boundary across every changed production path; any omitted path, replacement,
deletion, common helper or type-schema edit, shared UI or selector change, or
portrait input is protected. A declaration may escalate this result but never
de-escalate it.

Independent review publishes exactly one versioned top-level issue comment
through the expected GitHub App identity. Its JSON binds the current PR, base,
head, canonical Git-tree digest, classification, Rule IDs, consumers,
complete Authority-trace digest, mechanism digest, and reviewer-run provenance.
The trusted workflow re-fetches
the complete current comment and review sets on body, comment, review, head,
and applicable base events. Editing, replacing, deleting, or making that
evidence stale withdraws the green decision. The local App launcher repeats
the metadata/evidence portion of that current-state preflight before an
immediate exact-head squash merge, then requires exactly one `SUCCESS` rollup
entry for each of the six required contexts. It does not broaden the App with
Actions or Checks read permission; the unique-head lifecycle and trusted
governance status bind that rollup to the current PR. The four job entries are
selected by the run IDs sealed in that status and the latest visible attempt,
so superseded rerun entries do not block a current result and cannot substitute
for it.
The trusted evaluator also binds its checked-out `recovery` revision to the
PR's current base SHA before any status write; a stale evaluator publishes
nothing.

Routine non-protected work does not require the product owner to submit a
review on every PR. Protected work requires a fresh exact-head owner approval
after the latest independent evidence. Global blanket approval remains zero;
CODEOWNERS and `Protected Approval` supply the conditional owner boundary.

Recovery finalization repeats the semantic-evidence boundary after merge. It
reconstructs the historical base/head tree pair used by the successful PR
runs, then re-reads the creating PR's current body, top-level evidence comment,
and reviews. A deleted or edited evidence comment, edited trace, or withdrawn
approval blocks finalization even when the historical jobs and statuses remain
green. Because GitHub may omit a merged workflow run's `pull_requests` array,
post-merge run discovery binds the exact unique head SHA back to that single
creating PR, its recorded base SHA, and the run IDs sealed into the successful
trusted status rather than inventing a second identity.

The local GitHub App launcher is invoked by absolute path from a clean local
`recovery` worktree whose HEAD equals local `origin/recovery`; routine work may
remain in a separate candidate worktree. It reads the PEM only after verifying
that trusted source and the candidate repository/config boundary, and only from
an absolute external path
named by `ZZZ_WORKBENCH_GITHUB_APP_PEM_PATH`. It accepts only the fixed App,
installation, repository, branch, and `git`/`gh` operation schemas; it places a
narrow installation token only in the child environment and revokes it in
guaranteed cleanup. The App has no administration, workflow, status, check,
secret, or protection-bypass permission.

If protection or its required evaluator is defective, freeze `recovery`,
disable App mutation and immediate merge, invalidate outstanding evidence, and
land
one owner-reviewed repair under the minimal protection boundary. Restore and
read back the full rules and rejection probes before resuming recovery.

## Controller Re-grounding And Authoring

A controller refresh is accepted only when it demonstrates operational use of
the repository authorities. Reading or summarizing the five permanent owners,
reporting a clean checkpoint, or passing implementation gates does not by
itself establish semantic readiness.

- Before owning new requirements, a refreshed controller reads all five
  permanent owners, relevant current requirements, the completed-milestone
  index and any active applicable plan, applicable `docs/solutions/`, current
  behavior-bearing consumers, and their visible boundaries. It then
  independently traces a small repository-only set
  of sentinel cases from source or retained relationship through current
  consumer, candidate or representative consequence, lifecycle, and visible
  Setup or Result. The set must include the nearest similar current case and a
  contrasting case; receiving their conclusions in the refresh prompt does not
  prove re-grounding.
- Sentinel coverage is chosen from the current change surface and must exercise
  materially different meanings that are easy to conflate: an equipment-only
  stat consumer versus an independent Agent relationship; equal-looking
  equipment effects with holder-eligibility, exact-identity, or same-set
  consequences; base versus contextual or selected-input-derived candidates;
  pool-specific whole-package representative authoring at zero supplied
  substats; and selected-pressure on, off, and reselect lifecycle. Do not turn
  these checks into a named-Agent decision tree or a permanent exhaustive
  matrix.
- Before requirements close, every newly added or changed candidate membership
  or prepared first choice applies the permanent product contract's Candidate
  Preparation Dependency and applicable W-Engine or Drive Disc inspection
  section. The bounded authoring proof records the exact consumer, eligibility,
  nearest usable same-axis comparator, contrasting current case, complete
  package, finite opportunity cost, pool-specific representative consequence,
  contrary condition, and selected-input lifecycle when applicable. Keep this
  analysis ephemeral and persist only the settled local outcome; do not restate
  the common policy in the requirement.
- Secondary requirements cannot validate themselves. Review their new product
  conclusions against the owning permanent authority and established current
  consumers before writing an implementation plan. Tests, build, browser
  checks, and reviewer agreement prove implementation fidelity only after that
  authoring review succeeds.
- When a new preparation or allocation pass runs beside an existing pass,
  acceptance includes one shared flow that traverses both passes in their
  permanent-authority order and one contrasting flow. Isolated unit examples
  cannot prove composed precedence. A zero-substat prepared value must never be
  treated as the absence of the finite investment opportunity that the selected
  package creates.
- Controller, worker, reviewer, and prior-task feedback is advisory rather than
  authority. Before accepting a semantic recommendation, locate its permanent
  owner, inspect the closest established consumer, actively seek a contrasting
  consumer, and state why the recommendation survives or fails that comparison.
  Reject unsupported feedback even when it comes from an earlier controller.
- A selected-input dependency is not closed by one snapshot. Acceptance covers
  the pressure present, absent, and reselected states, including candidate
  membership, invalid-selection clearing without fallback, completeness, and
  the preserved contrasting consumer. Keep this in shared mechanism and
  representative-flow tests rather than creating a suite per Agent.

## Work

- Begin from concrete user inputs and visible Result behavior.
- Filter to competitive choices and author a deterministic first choice; do not
  build a catalogue or runtime optimizer.
- Do not convert a real game constraint into runtime validation unless the
  workbench experience needs that validation.
- Do not add evidence systems, explanation payloads, compatibility layers,
  registries, or shared abstractions without a current consumer.
- Among representations that preserve every current materially valuable
  distinction, use the least complex one.
- For W-Engine and Drive Disc work, verify retained authoring/calculation facts,
  the compressed Setup summary, and consumer-specific Result projection as
  separate artifacts. Do not copy source-fact prose into Setup. Before changing
  layout or typography, recheck the Setup copy against the semantic compression
  rules and cover both selected and candidate equipment surfaces in behavior
  tests, including their accessible descriptions.
- Before implementation, explain the proposed user experience and identify
  any genuine product decision that cannot be derived from the authorities.
- In Codex desktop, use the available in-app Browser for local visual and
  interaction verification. Do not invoke an `agent-browser`-only workflow or
  ask to install `agent-browser` unless the user explicitly requests it.
- This repository's package manager is npm and `package-lock.json` is the
  dependency owner. If `node`, `npm`, or `npx` is unavailable in a sandboxed
  PowerShell process, load the Codex workspace dependency paths and run the
  repository-local Vitest, TypeScript, or Vite entrypoint with that bundled
  Node executable. Do not switch package managers or let pnpm rewrite an
  npm-managed `node_modules` directory as an environment workaround.
- Any changed portrait source metadata requires original-asset inspection and
  in-app Browser comparison at `127.0.0.1:5173`: desktop and one narrow viewport,
  with the changed Agent expanded and compact. DOM tests prove metadata wiring,
  not visual calibration. `No server/browser` is an explicit incomplete status;
  the controller performs the missing check or does not close or commit the UI
  unit.
- Organize tests around product mechanisms and observable flows, not one suite
  per Agent or vertical. New content extends shared invariant coverage only
  when it introduces a new behavior; do not duplicate retained source values
  in tests merely to freeze content. Keep a small set of representative
  cross-vertical user journeys for integration confidence.
- Preserve incomplete-selection behavior: Result remains empty until every
  required setup selection is complete.
- Prepared setup initialization is explicit product behavior, not a hidden
  fallback. Party changes rebuild all three setups; Mindscape and pool changes
  rebuild only the changed Agent's setup.

## Delegation And Parallel Work

- Delegate bounded work whose behavior is settled to a worker using the lowest
  model and reasoning level that can complete it reliably. The controller owns
  product or semantic decisions, task boundaries, and final integration.
- Route each bounded unit independently rather than assigning one model or
  reasoning level to an entire vertical. A successful source-content or
  mechanical unit does not establish a lower default for semantic, formula,
  lifecycle, visual-calibration, or final-review work.
- Before dispatch, the controller closes the unit's exact authority, current
  consumer, visible consequence, preserved contrast, owned files, and
  acceptance. Candidate membership, prepared representatives, recipient or
  action scope, selected-input lifecycle, and permanent-authority changes remain
  controller work until those meanings are settled.
- Give every worker explicit file or responsibility ownership, mutation limits,
  and a completion contract covering changed files, tests, browser checks, and
  unresolved deviations.
- A worker stops and returns to the controller when it finds a missing owner,
  contradictory retained fact, new semantic or common mechanism, unsupported
  representative, or visible consequence outside its closed acceptance. It does
  not fill that gap by analogy or broaden its mutation scope.
- Before delegating a visual experiment on an existing interactive surface,
  separate the preserved baseline, authority-required gaps, explicit experiment
  variables, and out-of-scope items. Name the current values, available actions,
  and representative interaction states the artifact must retain or propose.
- For that experiment, controller acceptance checks every in-scope element,
  action, and state against both the current consumer and the applicable
  authority before judging style, geometry, clipping, or overflow. A clean
  screenshot or worker completion report does not establish baseline fidelity.
- While a worker runs, continue independent discussion, read-only inspection,
  or non-conflicting research. Before calling `wait_agent`, confirm that no
  independent controller work remains.
- Use only one mutating worker in a shared checkout. Use separate worktrees and
  branches when multiple workers must modify overlapping or uncertain scope.
- A worker `FINAL_ANSWER` reports that its turn ended; it does not establish
  task completion. The controller must inspect the diff and verify applicable
  tests, build, and browser-visible behavior before marking work complete.
- Once the user approves a bounded vertical and its execution scope, the
  controller may continue autonomously through its settled units and gates.
  Stop for review when completion needs a new product decision, unresolved
  external fact, authority change, scope expansion, or additional permission
  for staging, commit, deployment, or another external mutation.

Use npm when a Node project is introduced. Preserve unrelated work and do not
stage or commit unless the user asks.
