---
id: ACR-2026-08-30-001
date: 2026-08-30
status: accepted
supersedes: none
superseded_by: none
---

# Preserve local representatives when non-stacking holders have no competitive alternative

## One decision

Decide whether preparation preserves independently authored local representatives
when multiple holders select the same non-stacking effect and none has an
independently competitive non-overlapping alternative.

## Context

Drive Disc candidates and deterministic representatives close for each Agent
before party allocation. Current allocation then prefers non-overlapping
packages when an Agent already owns another competitive complete package. That
works for current flexible holders such as Trigger, Ju Fufu, and Qingyi.

A later bounded Agent case can instead place two rigid holders together after
each has independently closed the same Disc as its only competitive 4-piece
representative. The current product contract forbids preparation from
duplicating that non-stacking package, but also forbids allocation from
inventing an uncompetitive fallback or reopening candidate membership. It does
not say which already-authored local setup must be discarded, and no current
role, formula, finite-opportunity, or allocation consumer supplies a valid
tiebreaker.

## Existing rule

- Owning Rule IDs: `SW-006`, `SW-008`, and `SW-020`
- Conflict: the Disc-package and context-allocation rules require preparation
  to avoid a duplicate non-stacking Disc and to choose one bounded holder even
  when no independently competitive non-overlapping package exists. The
  competitive-set rule correctly prevents party collision from admitting a
  package that did not survive Agent-local competitive closure. Together, the
  rules require an outcome while excluding every supported way to derive it.

## Proposed change

Keep candidate closure upstream of party allocation. A non-stacking collision
may move a holder only to an already-authored, legal, independently competitive
complete package. When such alternatives exist, prefer a non-overlapping
allocation, preserve the less-flexible competitive fit first, and use a bounded
deterministic party representative only when current retained consumers still
cannot distinguish otherwise valid allocations.

When every colliding holder lacks such an alternative, preserve each Agent's
deterministic local representative even though the selected non-stacking effect
is duplicated. The duplicate is a consequence of preserving independently
closed local policy, not a new candidate direction, a recommendation for that
party, or permission to rank arbitrary parties at runtime. A legal but
competitively unsupported party composition does not admit a fallback, reopen
candidate membership, or create a hidden holder tiebreaker.

Result continues to resolve the duplicated non-stacking effect at its stated
highest reachable value per recipient while preserving distinct selected
origins for numeric disclosure. Prepared duplication therefore does not make
the effect stack or change its source compatibility.

## Evidence

- `src/workbench/preparation.ts`
  (`withCompetitiveKingAstralAllocation`) moves a King holder only when Astral
  Voice is already in that Agent's authored 4-piece candidates.
- `src/workbench/preparation.ts` (`withKingCollisionAlternative`) changes a
  King holder only through an explicit `kingCollisionAlternative`; absence of
  that authored policy preserves the local selection.
- `src/workbench/preparation.ts`
  (`withNonoverlappingExclusiveDiscAllocation`) returns the selections
  unchanged when multiple rigid holders or an unresolved authored tie provide
  no unique keeper. The established allocation mechanism therefore does not
  manufacture a package merely to remove duplication.
- `src/workbench/content/setup-policies.ts`
  (`PREPARED_DISC_HOLDER_POLICY_BY_AGENT`) records only already-authored
  alternatives: Trigger can move from King to Astral Voice, Ju Fufu can move
  from King to Swing Jazz beside a rigid holder, and Qingyi can move from King
  to Shockstar Disco beside the exact Dialyn holder.
- `src/workbench/content/discs.ts` (`DRIVE_DISC_FACTS.king`) identifies King's
  squad CRIT DMG effect as `highest-only`.
- `src/workbench/calculation/delivery.ts` (`resolveHighestOnly`) filters after
  recipient and consumer applicability, preserves distinct equal selected
  origins, and lets only one equal origin contribute to the aggregate.
- `src/workbench/lifecycle.test.ts` currently verifies the Trigger, Ju Fufu,
  and Qingyi authored-alternative cases. It does not establish that one of two
  rigid local representatives must be replaced.

## Nearest current consumer

The Dialyn collision flows are the closest established consumers. Dialyn keeps
King because it is her only retained 4-piece, while Trigger uses its independently
competitive Astral Voice package, Ju Fufu uses its independently competitive
Swing Jazz package, and Qingyi uses its independently competitive Shockstar
Disco package in the exact authored context. Those outcomes prove that
allocation may choose among closed alternatives; they do not prove that party
collision can create an alternative for another rigid holder.

## Contrast

Direct setup edits may already leave multiple holders on the same non-stacking
Disc. The selected packages remain visible while Result applies the effect once
per recipient through highest-only composition. This disproves any claim that
duplicate selected identities are inherently invalid or require a hidden
fallback.

The opposite contrast is a holder with an independently competitive authored
alternative. Preserving duplicate King for Trigger, Ju Fufu, or the exact
Qingyi case would discard a material non-overlapping complete package already
owned by that Agent's setup policy. The exception for rigid holders therefore
cannot become a general preference for duplicate preparation.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md` must
  make `SW-006` and `SW-020` non-overlap allocation conditional on an
  independently competitive authored alternative, and clarify under `SW-008`
  that an arbitrary legal party or allocation collision cannot establish a
  candidate direction.
- Supporting requirements affected:
  `docs/brainstorms/2026-08-30-norma-hollowell-vertical-requirements.md` must
  remove the Norma/Dialyn authority stop after the owner amendment merges and
  preserve both local King representatives without adding an Astral Voice or
  Swing Jazz fallback. Existing Trigger, Ju Fufu, Qingyi, and Dialyn outcomes
  remain unchanged.
- Production and tests affected: no current production change is required for
  the decision itself because current allocation already changes only holders
  with explicit authored alternatives. A later Norma vertical needs one shared
  lifecycle case for two rigid holders with no authored alternative; it must
  prove preserved local representatives, no candidate invention, and
  highest-only Result composition rather than freeze an Agent roster.
- Visible Setup or Result consequence: in a future applied Norma/Dialyn party,
  both complete prepared Setups may show King of the Summit. The squad effect
  contributes once per eligible recipient in Result with both selected origins
  preserved in disclosure. The workbench neither recommends that party nor
  replaces either Agent's setup with an uncompetitive hidden fallback.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-30T12:15:53+09:00`
