---
id: ACR-2026-09-03-001
date: 2026-09-03
status: accepted
supersedes: none
superseded_by: none
---

# Separate persistent party selection from the selected-Agent workspace

## One decision

Replace the mutable expanded-and-compact party-slot presentation with one persistent equal three-slot selector that chooses a separate selected-Agent workspace while keeping applied-party identity and party-source origin available through Result inspection and party editing.

## Context

The current presentation makes one party slot simultaneously own Agent selection, expanded Identity, Setup, and Result while the other two slots contract. That coupling preserved party continuity when the work area was short, but the admitted Setup controls, Result disclosure, action rows, source matrices, and gauges now make the selected slot substantially taller than its two peers. A user following a Result source from another party member can therefore lose immediate sight of the provider identity, and switching the viewed Agent also changes the geometry of all three party positions.

The product owner reviewed the Candidate C exploration and accepted its direction only as a visual and structural candidate: three equal Agent selectors remain in one row, and one separate Identity–Setup–Result workspace below shows the currently viewed Agent. The exploration does not authorize its fixture data, JavaScript, exact dimensions, or incomplete behavior as production meaning.

The current presentation owner also hides Setup and Result while Party Edit is open. That conflicts with the permanent product contract, which says Party Edit changes only a draft and the applied Result remains visible. The party representation therefore needs one owner-level boundary before supporting requirements, production layout, assets, and tests can be changed coherently.

## Existing rule

- Owning Rule IDs: `UI-002`, `UI-003`, and `SW-016`
- Conflict: the portrait-calibration rule defines compact and expanded states as destinations that share one full portrait identity and its three calibration inputs, while the adjacent current Party-Slot Continuity and Party Editing sections require one expanded slot, two compact slots, and no Setup or Result during party editing. The source-presentation rule requires a Result source to retain a mapped visible source identity and pointer-or-keyboard linkage, but it does not decide where a party-provider locus remains visible after the work area is separated. The product flow contract independently requires the applied Result to remain visible while the user edits a draft. The current owners therefore cannot authorize the reviewed persistent-selector structure, its distinct identification crop, and its Party Edit behavior without correcting the UI owner.

## Proposed change

Define the applied party as three ordered, equal selector identities that remain a single row at every supported viewport. Exactly one selector is the viewed Agent. Selecting another party position changes only the viewed Agent and the separate workspace below; it does not change Focus, party order, Setup state, calculation, or Result meaning. Re-selecting the current position does not create an all-collapsed state. Focus, viewed selection, incomplete Setup, and a temporary source link remain distinct visible states.

The selector may use one dedicated pre-cropped upper-body identification asset per Agent through one shared selector frame. The selected-Agent workspace continues to use the admitted full portrait and its source-owned `scale`, `headTopY`, and `faceX` calibration. Both surfaces must identify the same Agent, but the selector asset does not inherit or redefine the full portrait's calibration inputs. This is a separation of presentation destinations, not a second Agent identity or Mindscape-dependent artwork state.

When an inspected Result source is another applied party member, its party position is highlighted in the persistent selector without changing the viewed Agent. A source owned by the viewed Agent's Core Passive, Additional Ability, Special Attack, or EX Special Attack continues to resolve to the selected workspace Identity rather than treating every Agent source as a party-selector source.

Opening Party Edit keeps the applied selector, viewed Agent, Setup, and Result as the unchanged applied context required by `SW-016`, and presents draft composition controls below the selector as a separate editing surface. Draft target selection must not repurpose the applied selector or make the draft appear applied. Cancel preserves the viewed selection and all applied state; Apply commits and prepares through the existing product lifecycle.

This change does not alter Agent data, Focus eligibility, candidate membership, preparation, calculations, Setup inputs, Result quantities, source semantics, or Party Edit draft rules.

## Evidence

- `docs/setup-workbench-product-contract.md#user-flow-contract` (`SW-016`) states that Party Edit creates a draft without changing the applied party, Focus, setups, or Result, and that the applied Result remains visible while the draft changes.
- `src/components/PartyWorkbench.tsx#PartyWorkbench` already presents party positions as a keyboard-navigable tablist in stable order, and selecting another position is view-only. The same component couples the selected tab to the expanded Identity and workspace, permits the selected tab to set the viewed slot to `null`, and changes the whole rail to an inactive overview while editing.
- `src/App.tsx#App` owns `viewedSlot` separately from the workbench reducer, proving that viewed selection is presentation state rather than applied party, Focus, Setup, or calculation state. It currently suppresses the selected Setup and Result when `viewedSlot` is `null` or while the selected expanded slot is absent.
- `src/components/sourceInteraction.ts#agentSlotTone` already assigns party-provider tones by stable applied slot rather than display geometry. `src/components/ResultPanel.tsx#ResultPanel` resolves party-member source identities to those tones, so a persistent selector can retain the existing source relationship without changing calculation meaning.
- `src/components/agentPortraits.ts#AGENT_PORTRAITS` and `PORTRAIT_SOURCES` currently own one exhaustive full-portrait mapping and the accepted three-input calibration. The reviewed selector exploration used separate upper-body crops, demonstrating the intended visual separation, but production currently has no exhaustive selector-asset mapping. That missing complete asset surface is an implementation prerequisite, not evidence that full-portrait metadata should be reused.
- In the reviewed desktop and narrow exploration, equal selectors preserved immediate party order while the workspace changed below them. The owner rejected full-art and circle-icon selector variants, selected the upper-body crop, reduced selector height, and calibrated one shared diagonal direction. Those accepted observations support the destination split but do not settle exact CSS dimensions or waive production interaction parity.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartyWorkbench` is the nearest current consumer. Its tablist already preserves three ordered party positions, keyboard navigation, Focus identity, incomplete-state identity, view-only Agent switching, and position-based source tones. The proposed change retains those semantics and separates them from the expanded workspace geometry that currently changes with the selected tab.

## Contrast

`src/components/PartyEditor.tsx#PartyEditor` is the contrasting current case. Its slot controls select a draft replacement target and its Agent pool changes only draft composition; they are not applied-party navigation and must not replace or mutate the persistent applied selector. The selected workspace Identity is a second contrast: it needs the calibrated full artwork, Rank, Attribute, Specialty, and local Agent-source linkage, so the dedicated selector crop must not become a universal replacement for every Agent image surface. These cases disprove both a selector that doubles as the draft editor and a rule that forces one crop or one calibration across all Agent destinations.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` must replace the expanded/compact party continuity and Party Edit presentation, distinguish persistent selector identity from selected workspace Identity, update `UI-002` source loci, and narrow `UI-003` to full-portrait calibration while defining the selector asset boundary. `docs/setup-workbench-product-contract.md` (`SW-016`) remains unchanged and constrains the UI correction.
- Supporting requirements affected: `docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md` and `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md` must be corrected after the owner amendment. Other current supporting requirements need correction only where their acceptance language depends on expanded/compact or accordion party destinations.
- Production and tests affected: later changes may restructure `src/components/PartyWorkbench.tsx` and `src/App.tsx`, add an exhaustive Agent-keyed selector portrait surface, separate selector and workspace source targets, recompose `src/app.css`, and replace expanded/compact layout assertions and portrait destinations. Existing workbench reducer, calculation, Setup, Result, and Party Edit lifecycle behavior remain the baseline.
- Visible Setup or Result consequence: Setup choices, values, and Result calculations do not change. Three equal party identities remain visible above the selected workspace; changing the viewed selector replaces the visible Agent Identity, Setup, and Result without moving party positions. Inspecting another Agent's Result source highlights that provider's selector, and opening Party Edit leaves the applied Setup and Result available while the draft is edited separately.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-03T17:26:44.4988416+09:00`
