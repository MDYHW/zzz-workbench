# AGENTS.md

## Product

This repository builds a Zenless Zone Zero setup workbench. Users choose three
Agents, receive one complete prepared starting setup for each current Agent and
W-Engine availability pool, adjust those competitive setup inputs, and
understand the current setup through visual Result values, numeric breakdowns,
action differences that materially change the Result, and threshold or cap
gauges.

Game accuracy is a means to that experience, not an independent product goal.
Keep only the accuracy needed for a current user-visible choice or Result.
Deliberate simplifications are preferred when additional realism does not
materially improve the setup decision or its visual interpretation.

## Authority

The five Markdown files under `docs/` are the only initial permanent
authorities. Read the applicable owner before making a product or semantic
decision. Definitions have one owner.

The archived predecessor repository, its Git history, tasks, implementation,
tests, plans, and assets are not authorities and must not be consulted or
imported unless the user explicitly authorizes a specific reuse later.

`docs/solutions/` contains category-organized workflow and implementation
learnings with searchable YAML frontmatter such as `module`, `tags`, and
`problem_type`. These records are relevant when similar work recurs, but they
do not become product authorities.

## Work

- Begin from concrete user inputs and visible Result behavior.
- Filter to competitive choices and author a deterministic first choice; do not
  build a catalogue or runtime optimizer.
- Do not convert a real game constraint into runtime validation unless the
  workbench experience needs that validation.
- Do not add evidence systems, explanation payloads, compatibility layers,
  registries, or shared abstractions without a current consumer.
- Use the simplest representation that produces the intended behavior.
- Before implementation, explain the proposed user experience and identify
  any genuine product decision that cannot be derived from the authorities.
- Preserve incomplete-selection behavior: Result remains empty until every
  required setup selection is complete.
- Prepared setup initialization is explicit product behavior, not a hidden
  fallback. Party changes rebuild all three setups; Mindscape and pool changes
  rebuild only the changed Agent's setup.

## Delegation And Parallel Work

- Delegate bounded work whose behavior is settled to a worker using the lowest
  model and reasoning level that can complete it reliably. The controller owns
  product or semantic decisions, task boundaries, and final integration.
- Give every worker explicit file or responsibility ownership, mutation limits,
  and a completion contract covering changed files, tests, browser checks, and
  unresolved deviations.
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

Use npm when a Node project is introduced. Preserve unrelated work and do not
stage or commit unless the user asks.
