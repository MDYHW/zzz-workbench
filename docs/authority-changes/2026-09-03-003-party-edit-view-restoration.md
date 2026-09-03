---
id: ACR-2026-09-03-003
date: 2026-09-03
status: accepted
supersedes: none
superseded_by: none
---

# Restore the viewed workspace after cancelling Party Edit

## One decision

When Party Edit is cancelled, ordinary applied-party viewing resumes at the same viewed party position and its selected-Agent workspace rather than restoring a slot expansion.

## Context

`ACR-2026-09-03-002` accepted an ordinary applied view with three persistent equal selectors above a separate selected-Agent workspace. The current Party Editing rule instead says that Cancel restores the viewed slot's previous expansion. Once the accepted selector structure is implemented, no applied party slot expands, so that restoration target no longer exists.

The current application already preserves the viewed party position independently from the Party Edit draft. This decision aligns the permanent presentation wording with that retained view state. It does not redesign Party Edit, change its draft lifecycle, or decide whether its applied Setup and Result remain visible while editing.

## Existing rule

- Owning Rule IDs: `UI-006`
- Conflict: the current owner wording requires Cancel to restore a previous slot expansion. The accepted persistent-selector structure has no expanded party slot, leaving the restoration referent undefined even though the viewed party position remains available.

## Proposed change

Amend only the Cancel restoration sentence in the Party Editing rule: the underlying viewed party position remains unchanged while Party Edit is open, and Cancel returns ordinary applied-party viewing to that same position's selected selector and separate Identity, Setup, and Result workspace.

Keep every other Party Edit presentation and lifecycle requirement unchanged, including the equal draft slots, shared Agent pool, replacement-target flow, filters, unavailable occupied Agents, focus validation, Apply behavior, and prepared initialization. This decision does not authorize selector portrait changes or the later Party Edit visual redesign.

## Evidence

- `docs/authority-changes/2026-09-03-002-party-selector-workspace.md` accepts three persistent equal applied-party selectors and a separate workspace, and explicitly leaves Party Edit presentation unchanged.
- `src/App.tsx#App` stores `viewedSlot` as local presentation state independently from reducer-owned `state.draft`; opening or closing Party Edit does not replace that view state.
- `src/workbench/state.ts#workbenchReducer` handles `closePartyEdit` by removing the draft without changing applied slots, Focus, prepared Setup, or the viewed position owned by `App`.
- `src/components/PartyEditor.tsx#PartyEditor` dispatches `closePartyEdit` on Cancel and invokes its `onClosed` callback; it does not select another applied Agent. `src/App.tsx#App` supplies that callback and owns restoration of focus to the Party Edit trigger.
- `src/components/PartyWorkbench.tsx#PartyWorkbench` receives the unchanged `viewedSlot` while its edit presentation temporarily renders applied identities as inactive compact slots, then uses that same position when ordinary viewing resumes.

## Nearest current consumer

`src/App.tsx#App` is the nearest current consumer. Its `viewedSlot` persists while `state.draft` opens and closes, so the already-established behavior is restoration of the same viewed party position rather than reconstruction of a geometry state.

## Contrast

The `applyPartyEdit` case in `src/workbench/state.ts#workbenchReducer` is the contrasting close path. Apply atomically commits the resolved draft party and prepares all three positions, whereas Cancel discards the draft. Neither path changes the viewed position merely to restore presentation, and this decision does not change Apply's preparation lifecycle.

The replacement target inside `src/components/PartyEditor.tsx#PartyEditor` is a second contrast: it selects which draft slot receives a candidate and is cleared after replacement. It is not the applied viewed position restored after Cancel.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-006` only). The already-accepted ordinary-view change to `UI-005` remains governed by its own ACR.
- Supporting requirements affected: the two current UI requirements may describe Cancel as returning to the same viewed selector and workspace when they are updated after both owner amendments merge.
- Production and tests affected: no independent state or interaction change is required because the current `viewedSlot` already survives draft cancellation. Later selector/workspace implementation must preserve that mechanism and replace tests that assert restoration of expanded-slot geometry.
- Visible Setup or Result consequence: Party Edit remains unchanged while open. After Cancel, the same applied party position is viewed and its separate Identity, Setup, and Result workspace is shown; no party, Setup value, or Result value changes.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-03T20:11:41.4006862+09:00`
