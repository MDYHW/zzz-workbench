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
