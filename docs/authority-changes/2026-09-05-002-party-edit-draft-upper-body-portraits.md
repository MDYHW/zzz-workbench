---
id: ACR-2026-09-05-002
date: 2026-09-05
status: accepted
supersedes: none
superseded_by: none
---

# Reuse upper-body portraits in Party Edit draft slots

## One decision

Allow the three Party Edit draft slots to use the persistent applied-party selector's dedicated upper-body portrait derivative instead of the selected-Agent workspace full-art source.

## Context

Party Edit presents the current draft as three shallow slots before the user chooses one replacement target. The accepted visual direction makes those slots use the same interlocking trapezoid grammar as the persistent applied-party selector so the draft composition is immediately recognizable as a party. In that destination, the workspace full-art source spends the shallow frame on transparent canvas or lower-body composition and requires workspace-specific scale and registration, while the roster-complete selector derivative already provides the readable upper-body identity the matching slot geometry needs.

The product owner compared the draft rail with long Agent names, identity marks, replacement state, Focus state, and desktop and narrow slot dimensions. The accepted direction keeps all three slots equal, uses the upper-body portrait at the left, places Agent identity immediately beside it, and exposes replacement and Focus as separate actions.

## Existing rule

- Owning Rule IDs: `UI-003`
- Conflict: the current portrait-source rule assigns the dedicated upper-body derivative to the persistent selector and Party Edit candidate pool, but explicitly requires Party Edit draft slots to retain workspace full art, its normalized `scale`, `headTopY`, and `faceX` inputs, and a separate full-art destination frame.

## Proposed change

The three Party Edit draft slots may reuse the same roster-complete exact-source upper-body derivative as the persistent applied-party selector. The draft rail uses one common shallow destination frame and crop treatment for all admitted Agents and does not inherit the workspace full-art source's `scale`, `headTopY`, or `faceX` inputs.

This changes only the portrait source and shared framing contract for the draft slots. It does not change the selected-Agent workspace portrait, persistent applied-party selector, candidate-pool portrait, Agent admission, draft order, replacement lifecycle, Focus eligibility, Focus selection, or Setup and Result meaning.

## Evidence

- `docs/workbench-ui-design-rules.md#party-editing` (`UI-006`) requires three equal compact draft slots and treats their selection as replacement-target selection rather than applied-party viewing.
- `docs/workbench-ui-design-rules.md#portrait-source-calibration-and-acceptance` (`UI-003`) already establishes one roster-complete exact-source upper-body derivative and a common shallow frame for the persistent selector.
- `src/components/PartyEditor.tsx#DraftPortrait` currently feeds draft slots from `AGENT_PORTRAITS` and `portraitSourceStyle`, coupling a shallow identity surface to workspace full-art metadata.
- `src/components/PartyWorkbench.tsx#PartySelector` demonstrates the upper-body derivative in three equal persistent party positions with Agent name, Rank, Attribute, and Specialty beside the image.
- The product owner manually reviewed desktop and narrow draft-rail prototypes, selected the selector-matched trapezoid form, required the portrait diagonal and slot geometry to align, retained readable long names and identity marks, and accepted the upper-body portrait source before directing production application.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartySelector` is the nearest similar consumer. It presents three equal party positions in a shallow interlocking rail, uses `AGENT_SELECTOR_PORTRAITS`, and preserves Agent identity beside the portrait. Party Edit draft slots represent the same three-position party composition, but select a replacement target rather than the viewed applied Agent.

## Contrast

`src/components/PartyWorkbench.tsx#WorkspaceIdentity` remains the contrasting full-art consumer. Its portrait intentionally spans the shared Identity and Setup background, uses the accepted workspace `scale`, `headTopY`, and `faceX` metadata, and needs the continuous figure composition that the upper-body derivative would remove.

The Party Edit candidate pool is a second contrast. It already reuses the upper-body derivative under `UI-003`, but repeats up to the full admitted roster in a dense card grid and chooses an Agent candidate. The draft rail has exactly three ordered positions and chooses the replacement target, so this decision does not merge their frame geometry or interactions.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-003` only).
- Supporting requirements affected: the accepted ZZZ-style Party Edit draft-rail direction may be recorded in the current UI supporting requirements after the owner amendment merges.
- Production and tests affected: later work may change `src/components/PartyEditor.tsx#DraftPortrait` to consume `AGENT_SELECTOR_PORTRAITS` and give the three draft slots the persistent selector's shared shallow portrait treatment; shared Party Edit interaction tests may verify the portrait-source boundary without adding Agent-specific catalogue assertions.
- Visible Setup or Result consequence: none. The change affects only Agent identification in the Party Edit draft rail; applied Setup, Result, party lifecycle, and calculation remain unchanged.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-05T12:54:05+09:00`
