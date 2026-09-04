---
id: ACR-2026-09-04-002
date: 2026-09-04
status: superseded
supersedes: none
superseded_by: ACR-2026-09-04-003
---

# Route Setup-absent Agent sources to their persistent selector

## One decision

When a visible Result source belongs to an applied Agent but has no visible Setup control, link it to that Agent's persistent party selector instead of the selected workspace Identity.

## Context

The persistent three-Agent selector now keeps every applied Agent visible above one selected-Agent workspace. Result disclosure can therefore point to a stable Agent identity without changing which Agent is viewed.

The current rules split otherwise equivalent Agent-owned sources by whether the provider is the viewed Agent: an external provider terminates at its selector, while a local Core Passive, Additional Ability, Special Attack, EX Special Attack, Ultimate, or other Setup-absent Agent source terminates at the selected workspace. The workspace Identity is a broad rectangular region, and its artwork can cross the Identity-to-Setup seam. Highlighting that region does not identify a concrete editable locus and produces a visually ambiguous outline. The proposed boundary is structural rather than label-based: whether the source has a visible Setup control determines the destination.

## Existing rule

- Owning Rule IDs: `UI-002`, `UI-005`
- Conflict: the Result-source rule allows source hover or keyboard focus to highlight an owning Setup locus or provider Agent slot, but it does not explicitly decide the destination for a viewed Agent's source that has no visible Setup locus. The party-slot rule does decide that Agent-local source linkage terminates in the selected workspace, which contradicts routing the same Setup-absent source to the viewed Agent's persistent selector.

## Proposed change

Keep source presentation and interaction destination as separate meanings. A Result source retains its exact mapped category, detail, and source-locus color. The distinct colors currently assigned to W-Engine, Drive Disc, effective-substat positions, canonical actions, Core Passive, Additional Ability, and other retained source loci are intentional and must not be consolidated merely because several sources now terminate at an Agent selector. The resolved destination receives the active source's retained linking color for the duration of the link. Its temporary hover or keyboard-focus link resolves by the currently visible destination:

- when the source has an unambiguous visible Setup control in the selected workspace, highlight that control;
- when the source is owned by an applied Agent but has no visible Setup control in the selected workspace, highlight the owning Agent's persistent party selector, whether that Agent is currently viewed or is another party member; and
- when the source belongs to a Result-local target or calculation context rather than an applied Agent or visible Setup input, keep the link in the neutral Result-local destination.

The link does not select a party slot, expand a control, change the viewed Agent or Focus, reorder the party, modify Setup or Result values, or replace distinct source-locus colors with one Agent-slot color. The destination is derived from source ownership and visible structure, not from displayed source words or a list of skill names.

## Evidence

- `docs/workbench-ui-design-rules.md#result-source-presentation` (`UI-002`) already separates the exact source text from color as a linking cue, assigns external provider contributions to a stable provider-slot color, and forbids source hover or focus from selecting or expanding that slot.
- `docs/workbench-ui-design-rules.md#party-slot-continuity` (`UI-005`) keeps three equal persistent selectors visible while the selected workspace changes below. The viewed Agent therefore has the same stable selector destination as either external provider.
- `src/components/ResultPanel.tsx#sourceTone` currently combines source-locus color and highlight destination in one tone. It routes `identity` and external-provider sources to an Agent slot but returns local `core`, `additional`, `special`, and `ex-special` loci directly.
- `src/components/PartyWorkbench.tsx#WorkspaceIdentity` consequently maintains a separate hard-coded list of local tones and highlights the entire workspace Identity for them. This list is coupled to current locus names and omits any future Setup-absent Agent source unless the component is edited.
- `src/components/sourceInteraction.ts#agentToneForParty` already derives a stable selector tone from structural Agent ownership and applied party order, so a local and external Agent owner can share one destination rule without changing source facts or calculation.
- A temporary browser trial confirmed that routing a viewed Agent's Setup-absent source to its selector can preserve the viewed Agent, Focus, party order, and Result while removing the workspace-Identity highlight. The trial was reverted because current `UI-005` does not authorize it.

## Nearest current consumer

The external-provider branch in `src/components/ResultPanel.tsx#sourceTone` is the nearest current consumer. It already maps a source's `ownerAgentId` to the provider's persistent selector, preserves the source label and detailed provenance, and leaves the viewed Agent unchanged. A viewed Agent's Setup-absent source differs only in owner equality, not in whether a visible Setup control exists.

## Contrast

A selected W-Engine, Drive Disc piece, main-stat control, effective-substat input, or Mindscape control is the contrasting case. Each has an unambiguous visible Setup locus, so routing every Agent-owned source to a selector would erase the direct Setup-to-Result relationship. Those sources must continue to highlight their exact Setup controls.

A target multiplier or neutral calculation clamp is a second contrast. It is not owned by an applied Agent and must not borrow an Agent selector merely because it appears in that Agent's Result. Its linkage remains Result-local and neutral.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-002` and `UI-005`).
- Supporting requirements affected: `docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md` (`R-006` must cover any owning Agent selector, not only an external provider) and `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md` (source-linked selector state and selected-workspace interaction wording).
- Production and tests affected: later work may separate source presentation tone from highlight destination in `src/components/ResultPanel.tsx` and `src/components/sourceInteraction.ts`, remove the local-tone identity fallback from `src/components/PartyWorkbench.tsx` and its CSS, and replace mechanism tests that require Agent-local sources to highlight Workspace Identity. Calculation and source-fact authoring remain unchanged.
- Visible Setup or Result consequence: hovering or keyboard-focusing a Setup-absent Agent-owned Result source highlights that Agent's persistent selector using the active source's retained linking color. Sources backed by visible Setup controls continue to highlight those controls with their distinct locus colors, and Result-local target or calculation sources stay neutral and local. No view or value changes.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-04T19:10:31.1417578+09:00`
