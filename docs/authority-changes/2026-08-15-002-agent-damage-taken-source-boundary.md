---
id: ACR-2026-08-15-002
date: 2026-08-15
status: accepted
supersedes: none
superseded_by: none
---

# Exclude current setup sources from generic DMG Taken

## One decision

The workbench retains `dmg_taken_multiplier` as a conceptual target-side
formula component for enemy, stage, and other environmental mechanics, but the
current outgoing setup-to-Result boundary admits no Agent, W-Engine, or Drive
Disc contribution to that component. Recipient or application at the enemy
does not by itself classify an effect as generic DMG Taken. Caesar King's
qualified Additional Ability `+25%` is an unscoped regular DMG Bonus
contribution and follows the existing regular-DMG-Bonus formula applicability
and party distribution rules. Holder-side incoming-damage reduction remains a
survival package fact when independently retained by Setup; it does not project
into this outgoing Result component.

## Context

The clean-room formula owner originally kept generic `dmg_taken_multiplier`
for non-setup target mechanics while excluding every current setup source. The
Caesar vertical later amended that owner in the same transaction that authored
Caesar's requirement, then used the new requirement and consumer to validate a
new Agent-supplied `DMG Taken` Result region. That circular change conflated the
enemy recipient/application locus with the modifier category and now affects
general, Sheer, and anomaly Result projection through a shared metric.

## Existing rule

- Owning Rule IDs: `FM-004`, `FM-007`, `SF-003`, `SW-012`, `GV-006`
- Conflict: the component-meaning rule correctly defines
  `dmg_taken_multiplier` as a general
  target-side region and explicitly says that dealing more damage to or against
  a target is not its synonym. The party-recipient rule evaluates recipient
  distribution before formula applicability, and the action-vocabulary rule
  keeps recipient separate from trigger and affected scope. The formula-family
  rule nevertheless names Caesar as the one current
  setup-source exception, while the source-fact rule permits canonicalization to a formula
  region without yet stating the source-locus boundary that prevents the enemy
  recipient from selecting that region. The unchanged component, recipient,
  and vocabulary meanings constrain the correction; the source-fact and
  formula-family rules require amendment after this record merges.

## Proposed change

Restore the current setup-source exclusion for generic
`dmg_taken_multiplier`. Keep the component in applicable damage frames so a
future independently admitted enemy, stage, or environmental consumer remains
representable, but do not create an outgoing Result contribution, damage-setting
pressure, or target-context input for it without a separately authorized
consumer. Preserve an exact holder-side incoming-damage reduction in compressed
selected or candidate package copy when its whole package independently passes
the Setup retention gate. That survival fact neither creates a shared
`dmgTaken` metric nor projects into Result. Classify a source effect's stat or
modifier region from its explicit meaning independently of
recipient, trigger, and target wording. Then resolve recipient distribution,
recipient-specific applicability, and action, Attribute, and formula
applicability in the existing party-composition order. `enemy-context`, target
wording, or an "against" condition alone does not establish DMG Taken.

Project Caesar's qualified Additional Ability `+25%` into the existing regular
DMG Bonus quantity at Fully Enabled for each eligible current recipient. It
uses the `Additional Ability` source and the same unscoped regular-DMG-Bonus
formula applicability as other broad DMG Bonus contributions. Do not preserve
a generic `DMG Taken` row, source, or shared Agent metric for Caesar. This does
not reclassify an explicitly named Stun DMG Multiplier, Veil Vulnerability,
RES/DEF-region effect, Daze Taken effect, or another independently owned target
mechanic as regular DMG Bonus.

## Evidence

- Commit `2b26ff382c270d98f73f86fe81106ca5e22bab20` established the original
  permanent formula boundary: `dmg_taken_multiplier` remained for enemy, stage,
  or other target mechanics, while the current setup-source boundary admitted
  no Agent, W-Engine, or Drive Disc contribution.
- Commit `121a72d1020c5edc4b15e2d69a5cf110deed755e` replaced that exclusion with
  Caesar as the sole setup-source exception while adding Caesar's requirement
  and implementation plan in the same transaction. The new secondary
  requirement therefore could not independently establish the changed
  permanent meaning.
- `src/workbench/calculation/agents/caesar.ts#resolveCaesarProviderClauses`
  currently emits Caesar's `+25%` as `dmgTaken` with recipient
  `enemy-context`. `src/workbench/effects.ts#EffectMetric` and
  `src/workbench/calculate.ts` then distribute that shared metric to compatible
  current formula consumers, while Caesar and Grace expose generic `DMG Taken`
  projectors. These consumers show the impact of the disputed classification;
  they do not prove it correct.
- `src/workbench/calculation/agents/pan-yinhu.ts` already projects Depleted
  Qi's broad damage "against the target" as `enemy-context` `dmgBonus`, not
  `dmgTaken`. This is the closest current consumer because it preserves the
  same enemy application locus and broad regular-DMG outcome as Caesar while
  keeping modifier classification independent from recipient distribution.
- `src/workbench/calculation/agents/lycaon.ts` separates three clauses that can
  share an enemy application locus: Ice RES Reduction uses `resReduction`,
  other-Attribute damage against the target uses `dmgBonus`, and the Additional
  Ability that explicitly changes Stun DMG Multiplier uses
  `stunDmgMultiplier`. The source container, debuff presentation, and target
  wording do not collapse those formula regions.
- Commit `861748b5d307713ad2509647fb7b940c42f4c869` previously made the same
  classification error for Lycaon's other-Attribute damage by introducing
  `dmgTakenIncrease`. The current recovery implementation in commit
  `dfd097b476955d7aeab6ecad4e840f3cad558719` restores it to regular
  `dmgBonus`. That correction is current consumer evidence, not authority for
  Caesar's classification.
- `src/workbench/calculation/agents/corin.ts` projects personal damage against
  Stunned enemies as regular `dmgBonus`. Soldier 11's Stunned-target Fire DMG,
  Anby Soldier 0's personal and allied damage against Silver Star, and Koleda's
  squad Chain Attack damage against a debuffed target preserve the same
  distinction across self, action-scoped, all-party, and enemy-conditioned
  forms. Target wording and an enemy condition therefore do not independently
  select `dmg_taken_multiplier`.
- `src/workbench/content/engines.ts` retains Big Cylinder and Spring Embrace
  holder-side `DMG taken` reduction in compressed Setup copy. Their current
  requirements keep those survival clauses outside Result while evaluating
  each complete package. They are not outgoing party contributions to an enemy
  target and do not justify the shared `dmgTaken` Result metric.

## Nearest current consumer

Pan Yinhu is the nearest supported Agent consumer. His qualified Additional
Ability applies Depleted Qi to an enemy and increases broad damage against that
target by 20%, with another 10% at M1. The current provider keeps the exact
enemy application locus while projecting the value through regular DMG Bonus.
Like Caesar, the source changes broad current damage after a party and target
condition is established; unlike the disputed Caesar implementation, the enemy
recipient does not rename the formula region.

## Contrast

Lycaon's Core is the closest within-source contrast. One enemy-applied Core
state supplies actual Ice RES Reduction and regular other-Attribute DMG Bonus;
neither the shared source nor the target wording merges those clauses. His
Additional Ability separately and explicitly adds Stun DMG Multiplier, showing
the target-side component selected by its mechanical meaning rather than its
recipient. Trigger's Core supplies the same explicit Stun DMG Multiplier
contrast, and Ye Shunguang's Veil Vulnerability replaces that exact target
multiplier for her bounded Fully Enabled window and cap.

The conceptual generic `dmg_taken_multiplier` likewise remains available for
enemy, stage, or environmental mechanics even though no current setup source
supplies it to outgoing Result. Big Cylinder and Spring Embrace are the
W-Engine contrast: their holder-side incoming-damage reduction may remain an
exact compressed survival fact and influence a complete-package comparison,
but it supplies no outgoing enemy-side Result contribution.

## Impact

- Permanent owners affected: `docs/source-fact-boundary.md` (`SF-003`) and
  `docs/zzz-formula-mechanics.md` (`FM-007`). The current component meaning in
  `FM-004`, recipient order in `SW-012`, and source-local condition meaning in
  `GV-006` remain unchanged constraints.
- Supporting requirements affected:
  `docs/brainstorms/2026-08-15-caesar-vertical-requirements.md` and its
  completed milestone description. The recovery requirement already records
  the disputed classification as unresolved process debt and does not supply
  the product answer.
- Production and tests affected: `src/workbench/effects.ts` shared `dmgTaken`
  metric and anomaly applicability; `src/workbench/calculate.ts` distribution;
  `src/workbench/calculation/agents/caesar.ts` provider and Result projection;
  `src/workbench/calculation/agents/grace.ts` generic projector; and the
  corresponding calculation, flow, and Result tests. Current Stun DMG
  Multiplier, Veil Vulnerability, RES/DEF, and Daze consumers remain intact.
  Big Cylinder and Spring Embrace incoming-damage copy and independently
  supported complete-package relevance also remain intact and outside Result.
- Visible Setup or Result consequence: a qualified Caesar adds `+25%` to each
  eligible recipient's existing Fully Enabled `DMG Bonus` quantity under
  `Additional Ability`. Result no longer exposes a separate Agent-supplied
  `DMG Taken` row. An unqualified Caesar supplies neither contribution. No
  generic enemy or stage input is introduced, and Trigger/Ye keep their exact
  Stun and Veil presentation. Selected and candidate W-Engine descriptions may
  still disclose an exact holder-side incoming-damage clause without creating
  a Result row.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-16T17:14:54.1076434+09:00`
