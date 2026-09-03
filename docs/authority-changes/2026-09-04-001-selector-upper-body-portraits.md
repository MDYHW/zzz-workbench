---
id: ACR-2026-09-04-001
date: 2026-09-04
status: accepted
supersedes: none
superseded_by: none
---

# Give the applied-party selector its own upper-body portrait crop

## One decision

Allow each persistent applied-party selector to use a dedicated upper-body crop of the same Agent artwork identity while the selected-Agent workspace retains its full artwork composition.

## Context

The persistent selector introduced by `ACR-2026-09-03-002` is now a low, equal three-slot row. Reusing the workspace full-art source and its optical metadata in that shallow destination either makes the figure too small to identify or cuts the face and upper body unpredictably. The product owner compared full art, circle icon, and upper-body variants in the Candidate C selector direction, selected the upper-body variant, removed the other variants, and calibrated the diagonal image boundary and lower slot height.

The workspace has a different job. Its full artwork may cross the visual Identity-to-Setup seam behind Setup content and uses the accepted `scale`, `headTopY`, and `faceX` calibration. Making the selector inherit that composition no longer preserves a coherent identity treatment across the two materially different destinations.

## Existing rule

- Owning Rule IDs: `UI-003`
- Conflict: the current rule requires compact and expanded states to retain the same Agent artwork identity and share one source asset's three normalized inputs across every responsive portrait surface. It does not decide whether the new persistent selector may use a purpose-built crop of that same artwork identity, and its shared-source wording prevents doing so without treating selector and workspace geometry as one calibration problem.

## Proposed change

The persistent applied-party selector may use one dedicated upper-body portrait crop for each admitted Agent while the selected-Agent workspace retains the full artwork source and its normalized optical metadata. Both sources must depict the same Agent artwork identity.

All three selectors use one common destination frame and one common crop treatment. The selector crop is not adjusted with workspace `scale`, `headTopY`, or `faceX`; its source framing supplies the compact identification composition. The product must provide the selector crop coherently for the admitted roster rather than mixing full-art and upper-body selector treatments as a partial fallback.

This exception is limited to the persistent ordinary-view selector. It does not change selected-Agent workspace calibration, Party Edit presentation, Rank, Attribute, Specialty, name, Focus, incomplete, viewed, or Result-source-link states.

## Evidence

- `docs/workbench-ui-design-rules.md#portrait-source-calibration-and-acceptance` (`UI-003`) currently combines every portrait destination through one source asset and one metadata tuple.
- `docs/authority-changes/2026-09-03-002-party-selector-workspace.md` established the persistent equal three-slot selector but explicitly left portrait asset choice to a later decision.
- `src/components/PartyWorkbench.tsx#PortraitArt` currently supplies both `PartySelector` and `WorkspaceIdentity` from `AGENT_PORTRAITS` and applies `portraitSourceStyle` to both.
- `src/app.css` gives the selector a shallow diagonal destination and the workspace a tall Identity plane. Rendering the same full-art source in both makes selector readability depend on full-figure transparent bounds that the workspace metadata was designed to correct.
- In the manually reviewed selector comparison, the product owner selected the upper-body treatment over full art and circle icon, then accepted a lower slot height and a common image-aligned diagonal cut.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartySelector` is the nearest consumer. It needs an immediately readable Agent face and upper body inside three equal shallow slots while preserving name and identity symbols. A roster-complete upper-body crop set retains that identity function without coupling the selector to workspace full-art placement.

## Contrast

`src/components/PartyWorkbench.tsx#WorkspaceIdentity` is the contrasting consumer. It intentionally shows a larger continuous figure, allows artwork to remain visible behind the shared Identity-and-Setup background, and needs the approved Agent-specific optical metadata. Replacing that source with a compact crop would remove the full figure composition the workspace exists to show.

`src/components/PartyEditor.tsx#PartyEditor` is a second contrast. Its controls choose a draft replacement target rather than the currently viewed applied Agent, and this decision does not authorize changing that separate presentation.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-003` only).
- Supporting requirements affected: `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md` may record the selected persistent-selector crop after the owner amendment.
- Production and tests affected: later work may add a roster-complete selector portrait map and assets, make `PartySelector` consume it without workspace optical metadata, retain `WorkspaceIdentity` on `AGENT_PORTRAITS`, and update shared desktop/narrow visual coverage.
- Visible Setup or Result consequence: Setup inputs and Result values do not change. The three persistent selector slots gain consistent face-and-upper-body identification at their lower height; the selected workspace continues to show the calibrated full Agent artwork and source highlighting.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-04T06:41:04.8879073+09:00`
