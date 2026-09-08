---
id: ACR-2026-09-08-002
date: 2026-09-08
status: accepted
supersedes: none
superseded_by: none
---

# View the Focus Agent after Setup-shortcut entry

## One decision

When a valid copied Setup shortcut creates the initial applied session, initially view the shortcut's Focus Agent.

## Context

`SW-016` now authorizes a valid copied Setup shortcut to establish three ordered Agents, Focus, and complete selected Setups without the ordinary initial draft. The shortcut deliberately carries no viewed-Agent state, while `UI-005` requires exactly one applied Agent to be viewed and keeps that selection distinct from Focus.

The current UI owner does not choose which Agent is initially viewed for this alternate entry. When the carried Focus is not in the first party position, retaining the application's ordinary first-slot default would show a different Agent immediately after the user opens a shortcut centered on the explicitly carried Focus.

## Existing rule

- Owning Rule IDs: `UI-005`
- Conflict: the current owner requires one viewed Agent and separates viewing from Focus, but does not select the initial viewed Agent when the Setup shortcut bypasses Party Edit and directly creates an applied session.

## Proposed change

On valid Setup-shortcut entry only, initialize the viewed Agent to the carried Focus position. This is an entry presentation default, not an ongoing coupling: later selecting another Agent changes only the viewed Agent, and later changing Focus through the existing party lifecycle does not automatically change the viewed Agent.

An invalid, incomplete, malformed, or unsupported shortcut applies no state and therefore supplies no viewed-Agent choice. Ordinary initial Party Edit and existing applied-session view restoration retain their current behavior. The shortcut continues to carry no viewed-Agent field.

## Evidence

- `docs/setup-workbench-product-contract.md#user-flow-contract` (`SW-016`) makes a valid copied Setup shortcut the only alternate initial entry, atomically establishes its carried Focus, and explicitly leaves the initially viewed Agent undecided.
- `docs/setup-workbench-product-contract.md#non-goals-and-delivery-boundary` (`SW-022`) excludes viewed-Agent state from the shortcut payload, so Focus is the only carried product input that can supply a meaningful initial presentation choice without enlarging the shortcut.
- `docs/workbench-ui-design-rules.md#party-slot-continuity` (`UI-005`) requires exactly one viewed Agent but prohibits ordinary viewed selection from changing Focus, party order, Setup, or Result. Limiting Focus alignment to initial shortcut entry preserves that separation afterward.
- `src/App.tsx#AppliedWorkbench` currently initializes local `viewedSlot` to position 0 independently of `state.focusSlot`, then passes both values to `PartyWorkbench`. This demonstrates the present first-slot default and the existing independent state boundary.
- A countermodel that always keeps position 0 viewed satisfies the one-viewed-Agent invariant but can immediately present a non-Focus Agent for a valid shortcut whose Focus is in position 1 or 2. It preserves no additional carried user choice because viewed-Agent state is intentionally absent from the shortcut.

## Nearest current consumer

`src/App.tsx#AppliedWorkbench` is the nearest current consumer. It owns `viewedSlot` as local presentation state, derives the visible Setup and Result from that slot, and receives `state.focusSlot` separately. Shortcut entry can therefore choose the initial local view from the already-validated Focus without changing the applied party, carried Setup, or calculation state.

`src/components/PartyWorkbench.tsx#PartyWorkbench` is the visible boundary: it renders exactly one selected party selector and the corresponding Identity, Setup, and Result workspace while displaying Focus as a separate marker.

## Contrast

After entry, selecting a different party selector is the primary contrast. `UI-005` requires that action to change only the viewed Agent; it must not change Focus or any Setup or Result meaning. The proposed initial alignment does not make later viewed selection follow Focus.

Cancelling Party Edit is a second contrast. The current `src/App.tsx#AppliedWorkbench` local viewed position survives while the draft opens and closes, so Cancel returns to the same previously viewed Agent rather than reselecting Focus. Ordinary initial Party Edit also retains its existing first applied view because it is not shortcut entry.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-005` only). `SW-016` and `SW-022` constrain the shortcut boundary but keep their current meaning.
- Supporting requirements affected: a later Setup-shortcut requirement must state that valid entry initially views Focus while carrying no viewed-Agent field; existing UI requirements need no broader view-selection change.
- Production and tests affected: later implementation may initialize `src/App.tsx#AppliedWorkbench` viewed presentation from the validated shortcut Focus and add shared entry/lifecycle coverage. It must preserve later manual view selection, Party Edit Cancel restoration, and invalid-shortcut ordinary entry without Agent-specific catalogue tests.
- Visible Setup or Result consequence: opening a valid shortcut first shows the Focus Agent's Identity, Setup, and recalculated Result. No Setup or Result value changes, and subsequent view selection remains independent.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-08T20:11:34.6142352+09:00`
