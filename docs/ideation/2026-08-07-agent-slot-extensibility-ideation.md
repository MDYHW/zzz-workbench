---
date: 2026-08-07
topic: agent-slot-extensibility
focus: applied-party boundary and prerequisites for later Agent verticals
mode: repo-grounded
---

# Ideation: Agent-slot extensibility

## Grounding Context

- `PartyWorkbench`, `AgentSetup`, and `ResultPanel` already provide one shared
  Identity, Setup, Result, and compact/expanded slot skeleton for every current
  Agent.
- `PARTY_AGENTS` currently acts as both the admitted roster and the active
  three-member party. Adding a fourth Agent would therefore create another
  setup, completeness dependency, slot, navigation member, and fixed
  calculation assumption.
- Slot layout is encoded by current Agent identity, while focus and Rank contain
  current-cast assumptions. Agent calculators intentionally remain local behind
  shared effect and Result composition boundaries.
- Existing tests mostly protect distinct state, interaction, source,
  accessibility, or presentation failures. No broad deletion set is currently
  justified.
- External research was excluded because repository authorities own product
  meaning and this topic does not require current game facts.

## Ranked Ideas

### 1. Introduce the applied-party boundary before the next vertical

**Description:** Separate the admitted roster from an ordered exact-three
applied party. Preparation, completeness, calculation, rendering, navigation,
and Result ordering should consume the applied party rather than every admitted
Agent.

**Warrant:** `direct:` `src/workbench/content.ts`, `src/workbench/state.ts`, and
`src/components/PartyWorkbench.tsx` currently use `PARTY_AGENTS` for both
identity lookup and active-party behavior, while the product contract defines
three selected Agents from an admitted set.

**Rationale:** This is the first boundary that fails immediately when another
Agent becomes a current consumer.

**Downsides:** It changes a cross-cutting state invariant even though the
current visible party remains unchanged.

**Confidence:** 98%

**Complexity:** Medium-high

**Status:** Explored

### 2. Make slot geometry and focus party-context data

**Description:** Drive expanded layout by slot position and pass focus from the
applied party instead of deriving either from current Agent IDs.

**Warrant:** `direct:` the current rail uses Agent-named layout classes and the
current slot components identify Yixuan as focus.

**Rationale:** Party replacement cannot remain slot-correct while identity and
position are the same axis.

**Downsides:** Position-driven presentation must preserve every current
responsive and keyboard state exactly.

**Confidence:** 96%

**Complexity:** Medium

**Status:** Unexplored

### 3. Preserve the existing Setup and Result skeleton

**Description:** Let new Agents use the current four-section Setup and generic
Result projection. Admit new Agent branches in shared components only when a
distinct visible value, action, or state requires them.

**Warrant:** `direct:` the current three Agents already use one `AgentSetup`,
one `ResultPanel`, and one compact/expanded slot presentation.

**Rationale:** The reusable UI skeleton exists already; a second framework
would duplicate it.

**Downsides:** Review must distinguish justified Agent-local exceptions from
convenient branching.

**Confidence:** 95%

**Complexity:** Low as a rule

**Status:** Unexplored

### 4. Establish Agent-local module ownership only when extension proves it

**Description:** Co-locate a new Agent's identity, setup policy, retained
effects, calculation, and focused tests only where current central files become
a demonstrated extension cost. Keep shared equipment and composers shared.

**Warrant:** `reasoned:` a second concrete consumer can show which existing
parallel maps and Agent regions are genuine ownership seams without requiring
a universal Agent schema.

**Rationale:** Locality can lower review and merge cost while preserving
semantic differences.

**Downsides:** Splitting too early can scatter shared facts or create new
indirection.

**Confidence:** 82%

**Complexity:** Medium

**Status:** Unexplored

### 5. Move the Dialyn same-effect OR presentation to its semantic owner

**Description:** Replace repeated Dialyn checks in generic Setup and source
presentation with one bounded authored choice projection that keeps its exact
label, member identities, artwork, action, and Result source.

**Warrant:** `direct:` the same current exception is interpreted in both
`src/components/AgentSetup.tsx` and `src/workbench/effects.ts`.

**Rationale:** This is a current two-consumer semantic leak rather than
speculative future-proofing.

**Downsides:** It is not a blocker for admitting the next Agent and should not
broaden the applied-party task.

**Confidence:** 84%

**Complexity:** Low-medium

**Status:** Unexplored

### 6. Let the next vertical pay for test compression

**Description:** Add behavior for the new consumer first and combine an old
test only when the replacement catches the same failure consequence.

**Warrant:** `direct:` project authorities reject structure-only tests and
broad cleanup, while the current suite protects distinct state, Result,
interaction, source, and accessibility outcomes.

**Rationale:** Cleanup becomes evidence-driven rather than a speculative
prerequisite.

**Downsides:** The suite remains large until concrete overlap is proven.

**Confidence:** 96%

**Complexity:** Low and ongoing

**Status:** Unexplored

## Rejection Summary

| Idea | Reason Rejected |
|---|---|
| Universal Agent or Setup schema | The current UI skeleton is already shared; optional fields would hide Agent-specific consumers. |
| Generic calculator | Formula, recipient, surface, action, and relationship differences remain current Result consumers. |
| Merge compact and expanded identity components | Their actions, ARIA, and geometry differ; one conditional component adds no service behavior. |
| Exhaustive per-Agent skeleton test matrix | It would primarily test structural completeness rather than distinct failure consequences. |
| Broad pre-extension cleanup | No proven duplicate failure set currently justifies the carrying risk. |
