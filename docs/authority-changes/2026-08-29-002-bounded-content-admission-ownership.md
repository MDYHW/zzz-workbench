---
id: ACR-2026-08-29-002
date: 2026-08-29
status: accepted
supersedes: none
superseded_by: none
---

# Assign release-bounded content admission to bounded authoring

## One decision

Decide whether a fixed release-version identity cohort remains permanent
source-retention meaning or is owned by the bounded supporting requirement that
admits that content.

## Context

The source-fact owner currently combines two different decisions in `SF-001`.
Its lasting retention gate asks whether a distinction changes a current setup
or Result consumer. The same rule also fixes the initial entity-admission
boundary at Version 2.8. The first decision remains valid for every future
content extension; the second was the bounded scope of one completed expansion.

Keeping a historical version cutoff in the permanent retention owner makes a
past roadmap boundary look like a universal source rule. Moving every current
identity into permanent authority would create a roster or equipment catalogue.
Removing the current-consumer boundary as well would create the opposite error:
a speculative later release or merely compatible item could retain facts before
any admitted product consumer exists.

## Existing rule

- Owning Rule IDs: `SF-001` and `SW-005`
- Conflict: the retention rule owns the timeless current-consumer gate and also
  states that the initial content-admission cohort ends at Version 2.8. The
  W-Engine inspection rule asks authoring to search other "current-cohort"
  packages without deciding whether that phrase means a permanent release
  boundary or the packages already admitted by current bounded content.
  Current owners therefore do not uniquely place a completed release cutoff or
  the next extension's admission boundary.

## Proposed change

Keep the permanent source gate independent of a fixed release version. A source
distinction remains retainable only when it changes a currently admitted
candidate, prepared setup, editable choice, Result, or the policy needed to
produce one. A speculative later Agent, equipment identity, or release remains
outside that gate until a bounded content decision admits a current consumer.

Let the applicable supporting content requirement own each finite release or
identity scope that it proposes to admit. That requirement may set a version
cutoff, name a bounded vertical, and exclude later content for that change. Once
approved, it records the bounded admission outcome for later subordinate work;
after that work lands, the typed identities, admitted roster, candidate policy,
and preparation paths are its exact current consumers. Neither implementation
nor the investigated cutoff becomes a permanent authority or roster.

For an already admitted identity, continue using its current released identity,
progression, kit, equipment facts, and values when they change a current
qualifying outcome. A later revision of that same identity does not require
readmission merely because it was published after the original bounded cutoff.

Interpret W-Engine inspection's bounded omission pass over current packages as
the packages admitted for current consumers, not as an implicit permanent
release-version rule. This decision creates no release-version field, runtime
admission validator, content manifest, source archive, or exhaustive equipment
catalogue.

## Evidence

- `src/workbench/content/agents.ts` (`ADMITTED_AGENTS`) is the current roster
  consumed by party selection, identity lookup, formula policy, candidate
  context, preparation, and Result presentation. It contains no release-version
  gate.
- `src/workbench/content/types.ts` (`AgentId`) and
  `src/workbench/content/setup-policies.ts` (`setupPolicyFor`) bind each current
  identity to complete authored setup policy. A merely known or compatible
  later identity cannot reach those consumers.
- `src/components/PartyEditor.tsx` derives the visible selectable roster from
  `ADMITTED_AGENTS`, so the current landed roster rather than a historical
  version query determines the user-visible choice set.
- `docs/brainstorms/2026-08-19-through-2-8-anomaly-expansion-preflight-requirements.md`
  owns one explicit through-2.8 bounded cohort, excludes later identities, and
  distinguishes inventory from admission. Later vertical requirements then
  admit their own Agent and equipment consequences.
- `docs/plans/README.md` records that the through-2.8 expansion cohort closed.
  That completed milestone is history and routing context, not a permanent
  product or source rule.

## Nearest current consumer

The through-2.8 Anomaly preflight and its completed vertical requirements are
the nearest established bounded authoring case. They verified one finite
release scope, separated inventory from landed admission, and required every
Agent vertical to author its own current candidates, representative, lifecycle,
and visible consequence. The resulting `ADMITTED_AGENTS` and setup policies,
not Version 2.8 metadata, now expose those identities to users.

## Contrast

The sentence in `SF-001` that rejects a speculative later Agent or release as a
current consumer is not a completed cohort decision. It is the enduring
countermodel that prevents source facts, candidates, or Result relationships
from being retained for possible future use. Likewise, a later revision to an
already admitted Agent differs from a new identity: current consumers can make
the revised fact material without reopening the historical admission cutoff.

## Impact

- Permanent owners affected: `docs/source-fact-boundary.md` must keep the
  current-consumer retention gate while removing the fixed Version 2.8 cohort;
  `docs/setup-workbench-product-contract.md` must refer to currently admitted
  packages without implying a permanent release-version cohort.
- Supporting requirements affected: existing through-2.8 requirements remain
  the bounded record of that completed scope. Each later content requirement
  owns only its proposed finite identity or release boundary and applies the
  current permanent rules; no consolidated permanent roster is created.
- Production and tests affected: no immediate change. Current `AgentId`,
  `ADMITTED_AGENTS`, equipment candidates, setup policies, and representatives
  remain the landed consumer boundary. Do not add release metadata, a runtime
  admission gate, a catalogue, or a version-specific regression suite.
- Visible Setup or Result consequence: none for the current roster. A later
  approved content extension becomes selectable and calculable only through
  its own bounded requirement and landed current consumers, while unrelated
  later identities remain absent.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-29T05:35:31+09:00`
