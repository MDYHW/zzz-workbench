---
id: ACR-2026-09-01-001
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Classify Wind as a base Attribute

## One decision

Decide whether Wind is a sixth base Attribute or must be represented through an existing base or special-Attribute relationship.

## Context

The approved through-Version-3.1 expansion includes Velina as a Wind Agent. The current game vocabulary names five base Attributes and three special Attributes with explicit base relationships. It does not classify Wind, and no current rule authorizes mapping Wind to one of those existing Attributes.

The distinction is required before Velina can enter the current Agent identity, party filtering, Attribute-qualified equipment, provider delivery, or formula-applicability flows. This record decides only Wind's Attribute classification. Wind DMG Bonus main-stat eligibility and the meanings of Windswept, Contamination, Vortex, and Disorder remain separate decisions.

## Existing rule

- Owning Rule IDs: `GV-004`, `GV-006`, and `SF-005`
- Conflict: the current special-Attribute rule preserves only source-defined base relationships for Frost, Auric Ink, and Honed Edge. The action and source-condition rule requires exact Attribute qualifiers to remain independent, while the retention gate requires the smallest current-consumer-changing representation. None decides whether the newly admitted Wind identity is a base Attribute or supplies a relationship that could map it to an existing base Attribute.

## Proposed change

Classify Wind as the sixth base Attribute, distinct from Physical, Fire, Ice, Electric, and Ether. Do not give Wind a special-to-base mapping. Preserve only this base identity at this decision boundary; later owner decisions separately define Wind-specific main-stat eligibility, anomaly results, formula applicability, and retained source relationships.

## Evidence

- The official Version 3.0 update announcement identifies Velina as `Wind - Anomaly`, adds Wind-specific upgrade material, applies Wind DMG independently in current combat content, and introduces a separate Wind DMG Bonus main stat: https://www.hoyolab.com/article/45488578
- The official Version 3.0 limited-channel announcement independently identifies Velina as `Wind - Anomaly`: https://www.hoyolab.com/article/45467484
- The official Velina mechanics introduction presents Wind as her own Agent Attribute rather than naming a relationship to Physical, Fire, Ice, Electric, or Ether: https://www.hoyolab.com/article_pre/18014398241023265
- `src/workbench/content/types.ts` (`AgentAttribute`) currently retains the five base identities and the three source-defined special identities, but no Wind identity.
- `src/workbench/formula-policy.ts` (`effectAttributeForAgent`) passes each current base Attribute through unchanged and maps only the three source-defined special relationships; it throws for an unsupported Attribute rather than inventing a mapping.

## Nearest current consumer

Physical, Fire, Ice, Electric, and Ether are the nearest established cases. `AgentAttribute` retains each identity directly, and `effectAttributeForAgent` passes each one unchanged into candidate context, equipment applicability, provider delivery, and Result calculation. Wind needs that same direct base-identity behavior once Velina is admitted.

## Contrast

Frost, Auric Ink, and Honed Edge are the disconfirming cases. Their distinct Agent identities remain visible, but the current special-Attribute rule explicitly maps their damage and buff applicability to Ice, Ether, and Physical. No corresponding source relationship exists for Wind. Treating Wind as special by analogy would create an unsupported formula and equipment edge.

## Impact

- Permanent owners affected: `docs/zzz-game-vocabulary.md` must classify Wind as a sixth base Attribute without altering the three current special-to-base relationships. No formula, product, source-retention, or UI owner changes in this decision.
- Supporting requirements affected: `docs/brainstorms/2026-08-30-through-3-1-content-expansion-preflight-requirements.md` may proceed to later bounded Wind decisions and the Velina vertical only after the owner amendment merges.
- Production and tests affected: no immediate change. Later dependent work may add Wind to `AgentAttribute`, exact effect-Attribute types, direct effect applicability, party identity presentation, and shared reference-integrity coverage. It must not add a generic Attribute graph or infer anomaly-result behavior from this classification.
- Visible Setup or Result consequence: none in this ACR. After later bounded admission, Velina can be identified and filtered as Wind and Wind-qualified effects can resolve without being mislabeled or applied as another Attribute.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T09:26:26+09:00`
