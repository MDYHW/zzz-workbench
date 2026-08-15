# Implementation plans

This directory holds active bounded execution plans. Product meaning belongs to
the five permanent Markdown authorities under `docs/`, and accepted local
outcomes belong to the applicable approved supporting requirements under
`docs/brainstorms/`. A plan begins only after those decisions are settled and
remains subordinate to them.

## Plan lifecycle

### Recovery states

The authority-governance recovery temporarily uses two explicit non-completion
states:

- `frozen-by-recovery` preserves an interrupted plan as audit evidence. It is
  not active work, does not satisfy its acceptance criteria, and cannot produce
  a completed milestone.
- `promotion-ready` keeps the recovery plan open while the exact accepted
  recovery revision is finalized as trusted `main`. It is not completion and
  the plan remains visible until protected post-promotion housekeeping closes
  it.

While recovery is active, the authority-governance recovery plan is the sole
active plan. Frozen plans do not resume and new vertical plans do not begin
until recovery has been promoted and closed.

Use this sequence:

1. Identify the visible input, Setup choice, Result consequence, and preserved
   contrast.
2. Resolve product and domain decisions against the permanent owner and current
   consumers. Complete the candidate or representative authoring gate before
   planning.
3. Write one active plan with bounded units, ownership, dependencies,
   non-goals, behavior tests, and proportionate browser verification. A plan
   cannot turn a zero-substat snapshot into an authoring conclusion or replace
   the preceding permanent-authority/consumer review.
4. Implement from the visible outcome backward. A worker completion report,
   passing test, or plan requirement cannot validate the product conclusion
   that created it. When adjacent preparation passes compose, verify their
   precedence in one shared flow. When portrait metadata changes, an explicit
   `No server/browser` report blocks closure until the controller completes the
   fixed-port visual check.
5. After verification, keep current product outcomes in their requirement or
   permanent owner, reusable workflow lessons in `docs/solutions/`, and
   implementation truth in code and behavior tests. Move any still-needed
   migration, rollback, or operational procedure to its durable owner before
   closing the plan.
6. Add only a compact milestone below, then delete the completed plan body.
   Delete it only after a committed revision preserves that body; if the plan
   has never been committed, retain it through the checkpoint commit and remove
   it in a follow-up commit. Git history is the detailed archive.

Do not copy a completed plan as the template for a new vertical, maintain
supersession chains, or preserve old file lists, model routing, test matrices,
and provisional decisions as current guidance. Reuse the established mechanism
and author the new local outcome from current consumers instead.

## Completed milestones

| Date | Milestone | Current durable owners |
| --- | --- | --- |
| 2026-08-01 to 2026-08-05 | Established the first Yixuan/Dialyn/Lucia setup-to-Result loop, integrated three-slot workbench, and retained Mindscape behavior | [First-vertical baseline requirements](../brainstorms/2026-08-06-first-vertical-completion-review-requirements.md), [product contract](../setup-workbench-product-contract.md), [UI requirements](../brainstorms/2026-08-02-agent-slot-setup-result-ui-requirements.md), [UI design rules](../workbench-ui-design-rules.md) |
| 2026-08-07 | Separated applied-party state, provider/recipient calculation phases, Agent-local calculation ownership, and behavior-oriented test families | [Applied-party requirements](../brainstorms/2026-08-07-applied-party-calculation-boundary-requirements.md), [calculation-module requirements](../brainstorms/2026-08-07-calculation-module-boundary-requirements.md), current calculation code and tests |
| 2026-08-07 to 2026-08-09 | Added the Anby: Soldier 0/Trigger/Astra vertical, Party Edit, contextual candidate pressure, and party-directed preparation | [Anby: Soldier 0 requirements](../brainstorms/2026-08-07-soldier-zero-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md) |
| 2026-08-10 | Added Seed/Cissia, contextual Puffer Electro, and Evelyn through the established preparation, candidate, provider, and Result paths | [Seed/Cissia requirements](../brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md), [Puffer requirements](../brainstorms/2026-08-10-dialyn-puffer-electro-contextual-candidate-requirements.md), [Evelyn requirements](../brainstorms/2026-08-10-evelyn-vertical-requirements.md) |
| 2026-08-12 | Added Corin/Lycaon and Yidhari/Manato while correcting shared Rank, holder allocation, selected-input lifecycle, Rupture, qualification, and portrait seams | [Corin/Lycaon requirements](../brainstorms/2026-08-12-corin-lycaon-vertical-requirements.md), [Yidhari/Manato requirements](../brainstorms/2026-08-12-yidhari-manato-vertical-requirements.md) |
| 2026-08-13 | Formalized bounded W-Engine whole-package inspection and corrected Trigger and Cissia full-pool alternatives without changing their prepared representatives | [product contract](../setup-workbench-product-contract.md), [Trigger requirements](../brainstorms/2026-08-07-soldier-zero-vertical-requirements.md), [Cissia requirements](../brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md) |
| 2026-08-13 | Added Ellen and Soukaku through the established general-damage, capped-buffer, contextual-candidate, equipment-identity, and action-Result flows | [Ellen/Soukaku requirements](../brainstorms/2026-08-13-ellen-soukaku-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-13 | Added Soldier 11, Lighter, and Lucy through typed NEDF qualification, Impact and Elation, capped all-party ATK, selected King pressure, and shared equipment/action flows | [Soldier 11/Lighter/Lucy requirements](../brainstorms/2026-08-13-soldier11-lighter-lucy-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-14 | Added Zhu Yuan and Nicole through general-damage DEF pressure, exact action scopes, Ether/CRIT delivery, and package-aware non-stacking Support allocation | [Zhu Yuan/Nicole requirements](../brainstorms/2026-08-13-zhu-yuan-nicole-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-14 | Recovered the missing bounded authority chains for the already-implemented Hugo, Ju Fufu, Pan Yinhu, Banyue, and Starlight Billy verticals and corrected Hugo's omitted Cordis Basic Attack scope | [Hugo recovery requirements](../brainstorms/2026-08-14-hugo-authority-recovery-requirements.md), [Ju Fufu/Pan Yinhu recovery requirements](../brainstorms/2026-08-14-ju-fufu-pan-yinhu-authority-recovery-requirements.md), [Banyue/Starlight Billy recovery requirements](../brainstorms/2026-08-14-banyue-starlight-billy-authority-recovery-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-14 | Added Orphie & Magus and Pulchra through exact Aftershock scopes, Energy-derived capped ATK, selected-King lifecycle, and composed two-Stun King/Astral/Shockstar allocation | [Orphie/Pulchra requirements](../brainstorms/2026-08-14-orphie-pulchra-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-15 | Added Asaba Harumasa and Qingyi through exact action scopes, Impact-derived ATK, broad DEF/RES recipient projection, contextual Astral membership, and composed two-Stun allocation | [Harumasa/Qingyi requirements](../brainstorms/2026-08-14-harumasa-qingyi-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-15 | Added Nekomata and Billy through exact Physical Attack action scopes, contextual Puffer lifecycle, pool-local whole packages, activated Replica projection, and capped action CRIT | [Nekomata/Billy requirements](../brainstorms/2026-08-15-nekomata-billy-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md) |
| 2026-08-15 | Added Ben Bigger and Koleda through Initial DEF-to-Combat-ATK composition, a bounded per-EX shield, exact Daze and party scopes, selected-King pressure, and composed flexible/rigid two-Stun allocation | [Ben/Koleda requirements](../brainstorms/2026-08-15-ben-koleda-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md), [UI design rules](../workbench-ui-design-rules.md) |
| 2026-08-15 | Added Anby Demara as a distinct Electric Stun Agent through selected-King lifecycle, composed two-Stun allocation, exact Core and Mindscape action scopes, shared Trigger/Astra recipient projection, and calibrated portrait framing | [Anby requirements](../brainstorms/2026-08-15-anby-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md), [UI design rules](../workbench-ui-design-rules.md) |
| 2026-08-15 | Added Caesar King through Initial-Impact shield composition, qualified Focus ATK and enemy DMG Taken delivery, contextual Astral membership, pool-local Defense packages, and exact Core/Mindscape action projection | [Caesar requirements](../brainstorms/2026-08-15-caesar-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md), [source-fact boundary](../source-fact-boundary.md), [UI design rules](../workbench-ui-design-rules.md) |
| 2026-08-15 | Added Ye Shunguang and Zhao through Honed Edge/Physical applicability, capped Veil Vulnerability with editable target context, Initial-HP-derived support, contextual Quick Assist lifecycle, and pool-local equipment packages | [Ye/Zhao requirements](../brainstorms/2026-08-15-ye-shunguang-zhao-vertical-requirements.md), [product contract](../setup-workbench-product-contract.md), [formula mechanics](../zzz-formula-mechanics.md), [source-fact boundary](../source-fact-boundary.md), [UI design rules](../workbench-ui-design-rules.md) |

For removed plan detail, use Git history for `docs/plans/`. The milestone index
does not validate current product behavior; the linked owners and current
behavior-bearing consumers do.
