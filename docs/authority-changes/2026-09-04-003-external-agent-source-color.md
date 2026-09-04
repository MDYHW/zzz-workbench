---
id: ACR-2026-09-04-003
date: 2026-09-04
status: accepted
supersedes: ACR-2026-09-04-002
superseded_by: none
---

# Group external Agent sources by provider-selector color

## One decision

When a visible Result source is owned by another applied party Agent and links to that provider's persistent selector, use the provider selector's one Agent-slot color regardless of the source's internal locus.

## Context

The selected workspace exposes only the viewed Agent's Identity, Setup, and Result. A contribution from another party member can retain detailed provenance such as that provider's Core Passive, W-Engine, or Drive Disc in its Result source label, but the corresponding Setup control is not visible in the current workspace. The provider's persistent selector is therefore the one visible destination shared by those external sources.

The recently accepted predecessor separated source-locus color from link destination and required each external source to keep its Core Passive, W-Engine, Drive Disc, or other locus color while temporarily highlighting that same provider selector. Visual review of the integrated workbench found that this makes one external Agent appear as several unrelated color identities without exposing the hidden Setup loci those colors would otherwise connect. The requested correction uses color to reinforce the visible provider destination while exact source text continues to preserve provenance.

## Existing rule

- Owning Rule IDs: `UI-002`, `UI-005`
- Conflict: the current rules require a Setup-absent external Agent source to highlight its owning selector with the source's retained locus color and explicitly forbid several sources terminating at one selector from collapsing into one Agent-slot color. That requirement contradicts grouping all external contributions from one provider by the only currently visible destination that can expose that provider's local distinctions after selection.

## Proposed change

Keep source provenance and external-provider color as separate presentation channels. A Result source owned by another applied party Agent retains its exact provider-prefixed source label and detail, but its source row, gauge, action source, operation, and temporary selector highlight use the owning provider's stable Agent-slot color. All such external sources from the same provider use that one color in the currently viewed Agent's Result.

This change does not select or expand the provider, change the viewed Agent or Focus, or modify Setup or Result values. It does not consolidate sources owned by the viewed Agent: a selected W-Engine, Drive Disc, effective-substat input, main stat, Mindscape, or other source with a visible Setup destination keeps its exact locus color and highlights that control. A viewed Agent's own Setup-absent Core Passive, Additional Ability, canonical action, or other Agent source is not an external-provider source under this decision. Result-local target and calculation sources remain neutral and local.

## Evidence

- `docs/workbench-ui-design-rules.md#result-source-presentation` (`UI-002`) requires exact source text to remain visible and describes color as a linking cue rather than the only carrier of source meaning. Provider-prefixed labels therefore preserve the distinction between an external Agent's Core Passive, W-Engine, Drive Disc, and other loci when those rows share one provider color.
- `docs/workbench-ui-design-rules.md#party-slot-continuity` (`UI-005`) keeps all three applied Agent selectors persistently visible while only one Agent's workspace is shown. For an external provider, the owning selector is the only visible destination that remains available without changing the viewed Agent.
- `src/components/ResultPanel.tsx#sourceTone` in the protected base already maps every source whose `ownerAgentId` differs from the viewed Agent to `agentToneForParty`, while retaining the provider-prefixed source label separately. This current consumer demonstrates that one provider color can preserve exact source text and Result values.
- `src/components/sourceInteraction.ts#agentToneForParty` derives the color from stable applied-party position rather than Agent name or source wording, so two different external providers remain distinguishable while every source from one provider stays visually coherent.
- Integrated visual review with Yixuan viewed showed Dialyn- and Lucia-owned contributions beside Yixuan's local Setup sources. Distinct internal-locus colors made each external provider fragment into multiple color identities even though hovering or focusing every one of those rows led to the same provider selector.
- A countermodel that keeps distinct external locus colors preserves exact provenance but adds no visible Setup destination in the current workspace. The label already carries the retained locus, and selecting the provider exposes its local Setup distinctions; the additional color split therefore does not preserve a different current action or destination.

## Nearest current consumer

The external-provider branch in `src/components/ResultPanel.tsx#sourceTone` is the nearest current consumer. When `source.ownerAgentId !== currentAgentId`, it resolves the provider's applied slot through `agentToneForParty` and uses that Agent-slot tone for the source row and selector linkage. `sourceLabel` independently prefixes the provider and retains the exact source label, so grouping color does not erase provenance.

This is closer than the viewed Agent's own Setup-absent source path: that path terminates at the viewed selector under the predecessor's destination decision but remains inside the Agent whose Result and workspace are already visible. The present decision is limited to another applied Agent whose local Setup is not visible.

## Contrast

A selected W-Engine, Drive Disc piece, main-stat control, effective-substat input, or Mindscape control in the viewed Agent's Setup is the primary contrast. Its exact destination is visible, so its source-locus color continues to connect Result disclosure directly to that control rather than collapsing into the viewed Agent's selector color.

A viewed Agent's own Setup-absent Core Passive, Additional Ability, canonical action, or other Agent-owned source is a second contrast. Although its destination is the viewed Agent's selector under the predecessor's retained routing outcome, it is not supplied by another party member and is outside this external-provider color decision.

A target multiplier or calculation clamp is a third contrast. It is not owned by another applied Agent and remains neutral and Result-local rather than borrowing any Agent-slot color.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-002` and `UI-005`).
- Supporting requirements affected: no wording change is currently required; `docs/brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md` already requires an external provider to remain identifiable on its owning selector, while `docs/brainstorms/2026-08-03-zzz-style-and-integrated-slot-direction.md` leaves exact colors as calibration inputs.
- Production and tests affected: the protected-base `src/components/ResultPanel.tsx#sourceTone` already implements the proposed external-provider grouping. Later integration must preserve that branch while completing selector-destination routing, and mechanism tests must verify that distinct external loci from one provider resolve to the same Agent-slot tone without changing the viewed Agent. Source facts and calculation are unaffected.
- Visible Setup or Result consequence: every source row, gauge, action source, and operation supplied by one external Agent uses that provider selector's one color and highlights that selector on hover or keyboard focus. Exact provider-prefixed source labels remain distinct. Viewed-Agent Setup loci and neutral Result-local sources keep their existing colors and destinations.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-04T22:17:47.6009233+09:00`
