---
id: ACR-2026-09-03-002
date: 2026-09-03
status: accepted
supersedes: none
superseded_by: none
---

# Separate the party selector from the selected-Agent workspace

## One decision

Replace the applied-view expanded-and-compact party-slot composition with one persistent equal three-slot selector above a separate selected-Agent workspace.

## Context

The current presentation makes the viewed party position own both its Agent identity and the full Identity, Setup, and Result workspace. Selecting another Agent therefore resizes all three party positions, and a long Result can push the other two provider identities away from the source being inspected.

The product owner reviewed the Candidate C direction as a structural candidate and accepted the persistent-selector outcome: all three applied Agents remain immediately recognizable in stable party order, while the selected Agent's Identity, Setup, and Result occupy one workspace below. Candidate C's fixture data, exact dimensions, colors, assets, and incomplete interactions are not product meaning.

This decision is limited to the ordinary applied-party viewing composition. Party Edit presentation remains owned by `UI-006`, and selector portrait sourcing remains owned by `UI-003` until separate decisions change them.

## Existing rule

- Owning Rule IDs: `UI-005`
- Conflict: the current owner wording requires the viewed slot itself to expand, the other two slots to become compact, and the compact slots to divide only the remaining width. It therefore cannot authorize three equal persistent selectors with a separate workspace below, even though both presentations preserve three ordered party identities and one viewed Agent.

## Proposed change

In ordinary applied-party viewing, keep three ordered, equal Agent selector slots in one row at every supported viewport. Exactly one selector represents the viewed Agent, and one separate workspace below presents that Agent's Identity, Setup, and Result. Re-selecting the viewed Agent does not collapse the workspace or create an all-unselected state.

Selecting another party position changes only the viewed Agent and the workspace content. It does not change Focus, party order, applied setups, calculation, candidates, or Result meaning. Keyboard navigation preserves the three-position order and moves the viewed selection directly without an intermediate empty workspace.

The selector reserves visible states for viewed selection, Focus, incomplete Setup, pointer or keyboard focus, and a temporary Result-source link without moving Agent identity. When an expanded Result source comes from another applied party member, its provider position is highlighted in the persistent selector without changing the viewed Agent. The selected workspace continues to expose that Agent's local source distinctions.

Exact slot height, widths, diagonal geometry, colors, typography, motion, and portrait asset choice remain calibration or later presentation decisions. This change does not alter Party Edit draft behavior or its current presentation rule.

## Evidence

- `docs/setup-workbench-product-contract.md#user-flow-contract` (`SW-016`) constrains applied-party and draft-party lifecycle: ordinary viewing cannot silently become a party edit, preparation, or apply transition.
- `src/App.tsx#App` stores `viewedSlot` in local presentation state outside the workbench reducer. Applied party, Focus, Setup, calculation, and Result state remain in the reducer-owned workbench state.
- `src/components/PartyWorkbench.tsx#PartyWorkbench` already provides stable ordered keyboard navigation and view-only slot selection, but couples the selected tab to an expanded slot and permits a second selection to set `viewedSlot` to `null`.
- `src/components/sourceInteraction.ts#agentSlotTone` assigns party-provider source tones by stable applied slot rather than expanded geometry. `src/components/ResultPanel.tsx#ResultPanel` uses those identities for provider-source linkage, so the linkage can terminate at a persistent selector without changing calculation or source meaning.
- The manually reviewed Candidate C desktop and narrow variants kept three equal selectors visible while the selected workspace changed below. This resolved the provider-visibility problem without requiring compact Setup summaries or changing Result disclosure.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartyWorkbench` is the nearest current consumer. Its tablist already preserves three applied positions, stable keyboard order, Focus, incomplete status, viewed selection, and slot-owned source tones. The proposed change retains those behaviors while moving the selected workspace outside the selected list item and removing the all-collapsed viewing state.

## Contrast

`src/components/PartyEditor.tsx#PartyEditor` uses its three slot controls to choose a draft replacement target. Those controls modify only draft composition and must not be conflated with the applied-view selector governed by this decision. Keeping `UI-006` unchanged disproves an over-broad rule that every three-slot surface must share the new viewing composition.

The selected workspace Identity is a second contrast: Agent-local Core Passive, Additional Ability, Special Attack, and EX Special Attack source linkage terminates in that workspace rather than highlighting every Agent source at the party selector.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-005` only). `SW-016`, `UI-002`, `UI-003`, and `UI-006` constrain the amendment but keep their current meaning.
- Supporting requirements affected: `docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md` and `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md` must replace their ordinary-view expanded/compact composition after the owner amendment merges.
- Production and tests affected: later work may restructure `src/components/PartyWorkbench.tsx` and `src/App.tsx`, recompose the ordinary-view slot and workspace CSS in `src/app.css`, and replace tests that require an expandable or all-collapsed viewing state. Workbench reducer, calculation, Setup, Result, and Party Edit lifecycle behavior remain unchanged.
- Visible Setup or Result consequence: Setup inputs, values, and Result calculations do not change. Three equal party selectors remain visible above the selected workspace; selecting one replaces the visible Agent Identity, Setup, and Result without moving the party positions, and another Agent's Result source can highlight its persistent provider slot.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-03T19:46:29.6365134+09:00`
