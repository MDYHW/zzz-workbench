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

Use npm when a Node project is introduced. Preserve unrelated work and do not
stage or commit unless the user asks.
