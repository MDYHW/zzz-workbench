---
id: ACR-2026-09-01-005
date: 2026-09-01
status: accepted
supersedes: none
superseded_by: none
---

# Define Lumiflux declared and contextual Attribute meaning

## One decision

Decide how a Lumiflux Agent keeps its declared Attribute identity while its damage and Attribute-scoped effect applicability use the next party slot's Attribute.

## Context

The approved through-Version-3.1 expansion scope requires a later Remielle vertical, and her retained source meaning changes both the Attribute of her damage and the Attribute-scoped effects that can apply to that damage according to the next Agent in party order. Its bounded equipment scope also includes a Drive Disc that names a Lumiflux holder directly. The permanent vocabulary defines fixed special-to-base Attribute relationships, but it does not define a party-contextual Attribute relationship or distinguish that contextual result from the holder's declared identity. Current cited source text does not state how `next Agent` resolves from the last slot, while the product requires one deterministic complete setup and Result for every legal three-Agent order.

This record decides only the Attribute relationship needed by current party selection, candidate preparation, equipment applicability, and Result. It does not define Lumiflux buildup, Refringe, Voidflare, Luminize, raw damage, anomaly history, rotation, candidate membership, a runtime simulator, or a general relationship graph.

## Existing rule

- Owning Rule IDs: `GV-004`, `GV-006`, `GV-010`, `SW-012`, `SW-016`, `SF-002`, and `SF-005`
- Conflict: the current vocabulary owns base Attribute identity and defines only fixed relationships from Frost, Auric Ink, and Honed Edge to one base Attribute. Its action-and-condition rule keeps holder identity and Attribute scope independent, but no current rule decides whether Lumiflux is replaced by the adjacent Agent's Attribute or retained as its own declared identity while damage and applicable Attribute scopes resolve contextually. The product contract owns a three-Agent party, party-context application, and full rebuild on Apply, but it does not define terminal `next Agent` resolution. The source-retention owner permits an explicitly approved deterministic product fallback when a missing game fact blocks a qualifying outcome and requires the retained distinctions when the bounded Remielle scope is admitted.

## Proposed change

Define Lumiflux as a declared Agent Attribute with a party-contextual damage and buff relationship. A Lumiflux Agent remains Lumiflux for an exact holder condition or other source that names the holder's declared Attribute. For damage and Attribute-scoped effect applicability, the Agent uses the declared Attribute of the next Agent in party order. If that adjacent Agent has a special Attribute with a defined base relationship, use that relationship only for the damage or buff scope that the special-Attribute rule already covers.

For the workbench's three-Agent party, resolve `next Agent` cyclically: after the last slot, use the first slot. This is a product-authored deterministic fallback accepted for the current party-order consumer because the cited current source text does not state the terminal case. Do not retain or present the cyclic boundary as an exact game fact, and do not generalize it beyond this Lumiflux next-Agent resolution.

The contextual relationship does not replace either Agent's declared identity, create a new base Attribute, make the two Attributes synonyms, or transfer the adjacent Agent's Specialty, stats, anomaly result, action identity, holder eligibility, or source-local mechanics.

## Evidence

- The official Version 3.1 update introduces Remielle as the first Lumiflux Agent and establishes Lumiflux as her Attribute: https://www.hoyolab.com/article/46037106?reply=1
- The current Prydwen Remielle profile was updated on 2026-08-19 and records Patch 3.1 for its review, build, and teams calculations. It identifies Remielle as Lumiflux and explains that her element remains distinct while her attacks are treated as the Attribute of the following Agent: https://www.prydwen.gg/zenless/characters/remielle
- The current Icy Veins Remielle guide, updated 2026-07-28, independently states that Lumiflux is a special Attribute and that her damage also counts as the Attribute of the Agent to her right. Its Feathered Fate transcription separately grants one clause only when the equipper is a Lumiflux character: https://www.icy-veins.com/zenless-zone-zero/remielle-dan-guide-best-builds
- The current Icy Veins Lumiflux mechanics page, updated 2026-07-01, describes Attribute Mutation from the next Agent and treatment of Lumiflux damage as damage of the resulting target Attribute: https://www.icy-veins.com/zenless-zone-zero/lumiflux-attribute-anomaly-effect-and-characters
- None of those cited current sources states the terminal-slot behavior. On 2026-09-01, the product owner explicitly accepted cyclic last-slot-to-first resolution for the workbench rather than leaving a legal three-Agent order without a complete contextual Attribute.
- `src/workbench/formula-policy.ts` currently resolves one static Attribute from only `agentId`, while `src/workbench/content/agent-sources/equipment-eligibility.ts` uses that result for both exact holder-Attribute conditions and affected-Attribute conditions. This current consumer proves that the new source meaning would otherwise conflate two independently material outcomes; it does not supply the missing owner rule.

## Nearest current consumer

Frost, Auric Ink, and Honed Edge are the nearest current relationships. `effectAttributeForAgent` preserves their declared Agent identities elsewhere while mapping their damage and buff applicability to Ice, Ether, and Physical. Lumiflux needs the same identity-versus-applicability separation, but its effective Attribute is party-contextual instead of fixed.

## Contrast

Wind is an independent base Attribute and passes through unchanged regardless of party order. Feathered Fate's exact Lumiflux-holder clause is the second contrast: replacing the holder's declared identity with the adjacent Agent's Attribute would make that clause unreachable. The ordinary missing-source boundary is the third contrast: the cyclic fallback is allowed only because the product owner explicitly accepted it for this exact qualifying consumer. These cases disprove a universal adjacent-slot mapping, a model that replaces Lumiflux identity with its effective damage Attribute, and a general fallback for missing source facts.

## Impact

- Permanent owners affected: `docs/zzz-game-vocabulary.md` must define Lumiflux's declared identity, party-contextual damage and buff relationship, and non-transfer boundary without changing formula ownership. `docs/setup-workbench-product-contract.md` must define cyclic terminal-slot resolution as a product-authored deterministic fallback bounded to Lumiflux next-Agent applicability.
- Supporting requirements affected: the through-Version-3.1 expansion and later Remielle requirement may retain party-slot-dependent Attribute applicability and exact Lumiflux-holder eligibility after the owner amendment.
- Production and tests affected: no immediate change. Later dependent work may separate declared holder Attribute from party-contextual effective Attribute and pass party order to the consumers that require it. It must not introduce an optional ambiguous Attribute resolver, a universal capability catalogue, or a runtime combat simulator.
- Visible Setup or Result consequence: none in this ACR. Later prepared setups and Result may change when Remielle is reordered, while exact Lumiflux-holder equipment remains eligible in every party slot.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-01T12:49:27.8895006+09:00`
