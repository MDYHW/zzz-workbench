---
id: ACR-2026-09-05-001
date: 2026-09-05
status: proposed
supersedes: none
superseded_by: none
---

# Reuse upper-body portraits in the Party Edit Agent pool

## One decision

Allow the Party Edit candidate pool to use the persistent applied-party selector's dedicated upper-body derivative while the Party Edit draft slots and selected-Agent workspace retain their current portrait sources.

## Context

The Party Edit candidate pool is a dense identification surface that may display close to sixty admitted Agents. Its selected compact-card direction uses a shallow repeated frame where the Agent name, Rank, Attribute, and Specialty remain readable beside the portrait. The current workspace full-art source spends most of that frame on transparent canvas or lower-body composition and then depends on Agent-specific workspace scale and registration to recover the face.

The product owner compared compact pool cards using exact-source upper-body derivatives, removed redundant sequence and availability copy, selected an `82px` card height with a `184px` minimum width, and confirmed that long and short names remain readable beside fixed identity symbols. Reusing the already-governed derivative preserves the same pose, form, and depicted state rather than introducing an alternate Agent render.

## Existing rule

- Owning Rule IDs: `UI-003`
- Conflict: the current rule permits the dedicated exact-source upper-body derivative only in the persistent applied-party selector and explicitly requires the separate Party Edit draft slots and candidate pool to retain workspace full art and its normalized inputs. The accepted compact candidate-pool direction therefore cannot use the derivative.

## Proposed change

The Party Edit candidate pool may use the same roster-complete exact-source upper-body derivative owned by the persistent applied-party selector. The pool uses one shared compact destination frame and crop treatment and does not inherit workspace `scale`, `headTopY`, or `faceX` inputs.

This exception applies only to the candidate pool used to identify and select a replacement Agent. The three Party Edit draft slots continue to retain the workspace full-art source and normalized inputs until a separate decision changes them. The selected-Agent workspace remains unchanged. Portrait sourcing does not change candidate admission, filter meaning, alphabetical presentation, occupied state, replacement behavior, Focus, or Setup and Result meaning.

## Evidence

- `docs/workbench-ui-design-rules.md#party-editing` (`UI-006`) defines candidate portraits as compact identification images in one shared Agent pool and requires occupied Agents to remain visible and unavailable.
- `docs/workbench-ui-design-rules.md#portrait-source-calibration-and-acceptance` (`UI-003`) already owns an exact-source upper-body derivative for the persistent applied-party selector but expressly excludes the Party Edit pool.
- `src/components/PartyEditor.tsx#PartyPortrait` currently feeds both draft-slot and candidate-pool frames from `AGENT_PORTRAITS` with `portraitSourceStyle`, coupling both compact destinations to workspace full-art metadata.
- `src/components/PartyEditor.tsx#PartyEditor` renders the pool only after a replacement target is selected and uses each portrait for candidate identification; selecting an available candidate replaces the target and closes the pool.
- The product owner manually reviewed compact pool cards with short names, `Anby: Soldier 0`, and `Starlight Billy`; selected the dossier structure at `82px` by `184px` minimum; and accepted the upper-body image footprint beside fixed Rank, Attribute, and Specialty symbols.

## Nearest current consumer

`src/components/PartyWorkbench.tsx#PartySelector` is the nearest similar consumer. It presents an immediately readable Agent identity in a shallow repeated frame beside name and identity symbols, and `UI-003` already assigns that surface the exact-source upper-body derivative. The Party Edit pool has the same compact-identification need but selects a replacement candidate rather than the viewed applied Agent.

## Contrast

`src/components/PartyEditor.tsx#PartyEditor` also renders three draft-slot portraits. Those slots represent the current draft party and select the replacement target before the pool opens; their final presentation and Focus relationship remain under separate review. Keeping their current full-art source prevents this pool-specific decision from deciding the unfinished draft-slot design.

`src/components/PartyWorkbench.tsx#WorkspaceIdentity` is a second contrast. It intentionally renders the continuous full figure behind the shared Identity and Setup background and consumes the accepted workspace `scale`, `headTopY`, and `faceX` calibration. Replacing it with the compact derivative would remove the composition that surface exists to show.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-003` only).
- Supporting requirements affected: the accepted Party Edit candidate-pool card outcome may be recorded in the current UI supporting requirements after the owner amendment merges.
- Production and tests affected: later work may let the candidate-pool branch of `src/components/PartyEditor.tsx` consume the roster-complete selector portrait map while leaving draft slots on `AGENT_PORTRAITS`; `src/app.css` may give the pool one shared compact upper-body frame; shared Party Edit behavior and accessibility tests may verify source separation without creating Agent-specific catalogue tests.
- Visible Setup or Result consequence: none. Setup inputs, Result values, party draft lifecycle, and the selected-Agent workspace do not change; the candidate pool gains consistent compact Agent identification.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `pending`
- Decided at:
