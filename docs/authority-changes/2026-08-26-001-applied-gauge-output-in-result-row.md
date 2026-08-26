---
id: ACR-2026-08-26-001
date: 2026-08-26
status: accepted
supersedes: none
superseded_by: none
---

# Show an applied gauge replacement in its Result row

## One decision

When a gauge output is the formula-consumed replacement for its parent Result quantity, the parent row shows that applied output while the gauge retains the raw basis needed to inspect threshold or cap oversupply.

## Context

Ye Shunguang's Fully Enabled Stun DMG Multiplier row currently shows the raw Veil Vulnerability basis even after the gauge clamps the replacement. A raw `+130%` basis against the M0 `+110%` cap therefore leaves the parent Result at `+130%` while the gauge alone shows the formula-consumed `+110%` value.

## Existing rule

- Owning Rule IDs: `UI-002`, `FM-005`
- Conflict: the formula owner says the clamped Veil Vulnerability bonus replaces the ordinary Stun DMG Multiplier used by Ye's applicable damage, while the presentation owner requires the parent Result row to show the raw basis instead of that applied replacement.

## Proposed change

Amend `UI-002` so the parent Result row shows the applied clamped replacement, its expanded breakdown preserves the contributing raw amounts and a neutral calculation clamp, and the gauge continues to show the raw basis against the cap plus the clamped output. Do not change gauges whose cap belongs only to an output derived from a separate parent basis stat.

## Evidence

- `docs/zzz-formula-mechanics.md#stun-dmg-multiplier-and-veil-replacement` defines `veil_vulnerability_bonus = min(raw_veil_vulnerability_bonus, veil_vulnerability_cap)` and makes that clamped value the replacement consumed by Ye's Fully Enabled damage.
- `src/workbench/content/agent-sources/attack.ts#attackProfile` authors the raw target bonus and a `projection-gauge` for the cap.
- `src/workbench/calculation/profile-harness.ts#projectMetrics` evaluates that gauge from the composed raw metric but returns the raw metric unchanged.
- `src/components/ResultPanel.tsx#ResultPanel` displays the unchanged metric as the parent Result and the clamped value only as gauge output.
- `src/workbench/calculation/profile-harness.test.ts` currently encodes the mismatch by expecting a parent value of `130` and a gauge output of `110`.
- The current production inventory contains no other `projection-gauge`. Other threshold and cap relationships either emit their calculated output into the consuming stat, modifier, provider, or operation, or attach a separately capped output to an uncapped basis stat.

## Nearest current consumer

The shared metric-cap path in `src/workbench/calculation/composition.ts#composeMetricEffects` is nearest: it exposes the applied capped Result value while retaining source additions and a neutral calculation clamp in the breakdown. It demonstrates that a displayed aggregate must match the value consumed after its own cap.

## Contrast

Yuzuha's Anomaly Mastery gauge is the contrasting current case. Anomaly Mastery is the basis stat, while Anomaly Buildup Rate, Attribute Anomaly DMG, and Disorder DMG are distinct derived outputs with their own caps. Those output caps must not clamp the parent Anomaly Mastery row. The distinction is whether the gauge output replaces the parent metric or is merely derived from it.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-002` only); `FM-005` remains unchanged.
- Supporting requirements affected: Ye/Zhao R5, R6, R31, AE3, and AE5 must describe the parent row as the applied replacement after the owner amendment merges.
- Production and tests affected: the shared Result projection must retain the raw gauge basis while projecting the clamped replacement into the parent metric; the existing shared projection fixture must reverse its raw-parent assertion. No Agent-specific calculation branch or catalogue test is needed.
- Visible Setup or Result consequence: Setup is unchanged. For a raw `+130%` basis at the M0 cap, the Fully Enabled parent Result becomes `+110%`; expansion still shows the raw contributing amounts, a neutral `-20%` clamp, gauge current `130 / 110`, and Veil Vulnerability output `+110% / 110%`.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-26T06:32:58.8794993Z`
