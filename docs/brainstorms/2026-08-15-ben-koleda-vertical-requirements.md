---
date: 2026-08-15
topic: ben-koleda-vertical
---

# Ben And Koleda Vertical Requirements

## Summary

Add Ben Bigger and Koleda Belobog through the current setup-to-Result path.
Ben is a current Fire damage contributor and buffer whose completed Core makes
Initial DEF a retained ATK and shield basis. Koleda is a Fire Daze contributor
and Chain Attack buffer. Both reuse established general-damage, Daze, party
qualification, equipment, preparation, direct-edit, and incomplete-selection
behavior.

Ben opens one bounded Result relationship: the deterministic squad shield
created by one completed EX Special Attack follow-up. The relationship exposes
the selected setup's Initial DEF, Shield Effect, and final per-activation shield
without adding a generic survival formula, incoming-damage model, shield uptime,
or shield catalogue. Koleda adds no new common mechanism.

## Product Flows

1. A user can add Ben or Koleda to any slot, receive the Rank-default
   Mindscape and one complete pool-specific starting setup, and inspect the
   retained Result without supplying substats.
2. Ben's prepared setup strengthens his current personal damage. Direct edits
   can instead select materially distinct DEF/shield, party-buffer, and
   resource packages. Changing DEF updates Ben's Core shield and dependent ATK
   contribution; changing Shield Effect updates only the shield.
3. A qualified Ben exposes the Core-shield CRIT Rate bundle to the whole squad.
   Removing the qualifying Fire or Belobog teammate removes that bundle without
   removing Ben's shield amount.
4. Koleda's prepared King package participates in the current one-King Stun
   allocation. If either Stun can prepare Astral, the less-flexible holder keeps
   King and the flexible holder takes Astral. If both can prepare Astral, the
   otherwise equal choice is deterministic in the bounded current order
   Trigger, Pulchra, Koleda, then Lycaon; the earlier holder keeps King. The
   King/Shockstar fallback remains only when neither holder can prepare Astral.
5. Party Apply rebuilds all three prepared setups. Pool or Mindscape changes
   rebuild only the changed Agent. Direct equipment, main-stat, and substat
   edits remain local, and an invalid direct selection is cleared without a
   hidden fallback.

## Owning Rules And Contrasts

- The product contract owns Ben's combined damage-contributor/buffer direction,
  Koleda's Daze-contributor/buffer direction, whole-package candidates,
  representatives, finite investment opportunity, allocation, and lifecycle.
  Pan Yinhu is the closest DEF-Specialty buffer contrast: his current setup is
  driven by a capped Initial-ATK provider and has no shield Result consumer.
- Formula mechanics owns Initial DEF as a stat surface, Ben's linear DEF-to-ATK
  relationship, regular damage, CRIT, Impact, and Daze composition. Ben's Core
  has no threshold or cap; Pan's capped Initial-ATK relationship therefore must
  not be reused as a shield or DEF gauge.
- The source boundary admits Ben's deterministic per-EX shield because current
  candidate inputs materially strengthen it. Proto Punk on Pulchra and
  Lycaon's M4 remain contrasting shield clauses with no current local survival
  output and therefore no shield Result.
- Game vocabulary owns Defense and Stun identity, Belobog faction, W-Engine
  Specialty activation, Initial DEF inputs, and exact action terms. An
  off-Specialty W-Engine keeps Base ATK and its advanced stat while its passive
  remains inactive.
- UI rules own compressed equipment copy, source origins, the expanded numeric
  Result, and accessible selected/candidate descriptions. Ben's Setup copy says
  what Shield Effect or per-event package an item supplies; it does not copy the
  Core formula into every candidate summary.

## Requirements

### Identity and direction

- R1. Ben Bigger is A-Rank Fire Defense, Belobog Heavy Industries, M6 by
  default, and Focus-eligible. His primary direction is `general_damage`; he
  also has a buffer role and residual `daze_buildup`. Koleda Belobog is S-Rank
  Fire Stun, Belobog Heavy Industries, M0 by default, and not Focus-eligible.
  Her primary direction is `daze_buildup`, with a buffer role and residual
  `general_damage` only where a retained action or package consumes it.
- R2. Ben retains completed ATK 867, DEF 724, CRIT Rate 5%, CRIT DMG 50%,
  Impact 95, and base Energy Regen 1.56/s. Koleda retains completed ATK 735,
  CRIT Rate 5%, CRIT DMG 50%, Impact 134, and base Energy Regen 1.2/s. Other
  completed stats without a current consumer are omitted.

### Ben Core, qualification, and progression

- R3. Ben's completed Core adds 80% of his Initial DEF to Combat ATK. The same
  Core creates a squad shield equal to 30% of Ben's Initial DEF plus 550 after
  one EX Special Attack follow-up, lasting 30 seconds. Shield Effect scales the
  final provided amount. Applicable Shield Effect percentages add before
  scaling the source-stated basis: `shield = (0.3 * Initial DEF + 550) *
  (1 + summed Shield Effect / 100)`. Result exposes Initial DEF, the Core ATK
  contribution, Shield Effect only when nonzero, and one `Core shield per EX
  follow-up` operation. It does not model shield uptime, damage absorption,
  replacement, or incoming attacks.
- R4. Ben's Additional Ability activates when another Agent shares his Fire
  Attribute or Belobog faction. While Ben's Core shield is active, all squad
  members gain CRIT Rate +16%. It is a Fully Enabled all-party CRIT clause tied
  to Ben's exact Core shield, not to any shield in general. The shield amount
  remains visible when the Additional Ability is unqualified.
- R5. Ben's Mindscapes apply cumulatively. M1's enemy damage reduction has no
  current Result consumer. M2 retains the source-stated added 300% DEF damage
  for a successful Special/EX Block Counter as one action operation. M4 adds
  30% DMG to a counter after the source-qualified invulnerable block. M6 adds
  Daze +20% to Basic Attack, Dash Attack, and Dodge Counter after the EX attack
  or follow-up. M3 and M5 change no separately retained source value.

### Ben equipment and prepared setup

- R6. Ben's full W-Engine candidates are Tremor Trigram Vessel, Tusks of Fury,
  Cloudcleave Radiance, Hailstorm Shrine, Big Cylinder, and Spring Embrace.
  His non-limited candidates are Tremor, Big Cylinder, and Spring Embrace.
  Full and non-limited both prepare Tremor W5.
- R7. Tremor is a matching-Defense complete damage package: Base ATK 624,
  advanced ATK +25%, EX/Ultimate DMG +40%, and its exact 3.2-Energy event
  clause retained in Setup only. Tusks is a matching-Defense buffer package:
  advanced Impact +18%, Shield Effect +30%, squad DMG +18%, and squad Daze
  +12% at W1. Cloudcleave and Hailstorm are off-Specialty partial packages whose
  passives are inactive; each retains Base ATK 743 and respectively CRIT DMG
  +48% or CRIT Rate +24%. Hailstorm's inactive Anomaly passive is CRIT DMG
  +50% plus two 20% Ice-DMG stacks triggered by EX Special or any squad
  Attribute Anomaly; none of it applies to Ben. They dominate the same-axis
  lower-Base-ATK Severed Innocence and Heartstring Nocturne partial packages.
- R8. Big Cylinder is a matching-Defense local DEF package: Base ATK 624,
  advanced DEF +40%, DMG taken -12%, and at W5 the next hit after Ben is
  attacked is a guaranteed CRIT with an added 960% of DEF, once per 7.5
  seconds. The incoming-damage trigger keeps both passive clauses in Setup and
  outside Result. Spring Embrace supplies Base ATK 594, advanced ATK +25%, DMG
  taken -12%, and after Ben is attacked grants Energy Generation Rate +16% for
  12 seconds; switching him off-field transfers the buff to the new on-field
  Agent and refreshes its duration. The event remains exact Setup package copy,
  not Energy Regen or a Result operation.
- R9. Ben's authored 4-piece candidates are Woodpecker Electro, Astral Voice,
  Bunny in Wonderland, Proto Punk, and Swing Jazz. Puffer Electro is added only
  in the established Dialyn Ultimate-opportunity context. His 2-piece candidates
  are Woodpecker, Branch & Blade, Inferno Metal, Puffer Electro, Hormone Punk,
  Astral Voice, Swing Jazz, Moonlight Lullaby, and Proto Punk, subject to the
  different-set and exact same-effect identity rules. Proto's Shield Effect is
  material only because Ben has the R3 consumer; this does not make Proto's
  shield clause material for another holder.
- R10. Ben's main candidates are CRIT Rate/CRIT DMG/DEF% in Slot 4;
  Fire DMG/PEN Ratio/ATK%/DEF% in Slot 5; and ATK%/DEF% in Slot 6. Effective
  substats are CRIT Rate, CRIT DMG, ATK%, and DEF%. DEF strengthens both the
  Core ATK relationship and the bounded shield result, while direct damage axes
  remain independently material. Flat DEF is the materially weaker supplier of
  the same uncapped linear relationships and is not admitted. This is an
  authored multi-axis opportunity, not a runtime package score.
- R11. Ben prepares Tremor, Woodpecker/Branch & Blade, CRIT Rate/Fire DMG/ATK%,
  and zero supplied substat hits in both pools. The stronger prepared damage
  package does not remove the finite future DEF opportunity or the editable
  buffer packages.

### Koleda kit, equipment, and prepared setup

- R12. Koleda's completed Core adds Daze +60% to EX Special Attack and enhanced
  Basic Attack after consuming Furnace Fire. Her Additional Ability activates
  with another same-Attribute Agent, same-faction Agent, or Rupture Agent. Her
  EX explosion then applies a target debuff whose two-stack Fully Enabled state
  grants all squad Chain Attacks DMG +70% against the Stunned target. Trigger,
  recipient, action, and target state remain separate.
- R13. Koleda Mindscapes apply cumulatively. M1 adds Daze +15% to the Special
  or EX Special used directly after Basic hit two or four. M2's 60-Energy event
  and 45-second limit remain outside Result and do not change current
  candidates or representatives. M4 adds Chain/Ultimate DMG +18% per consumed
  Charge, up to +36%. M6 retains one added 360% ATK operation for each EX,
  Chain, or Ultimate explosion. M3 and M5 change no separately retained value.
- R14. Koleda's full W-Engine candidates are Hellfire Gears, Blazing Laurel,
  Ice-Jade Teapot, The Restrained, Steam Oven, and Precious Fossilized Core.
  Non-limited excludes Blazing and Ice-Jade. Both pools prepare Hellfire W1.
  Hellfire's off-field Energy +0.6/s and fully enabled Impact +20% strengthen
  her EX/Daze direction; the other packages retain their current complete
  Impact, Daze, Basic-action, resource, and party-facing clauses exactly as for
  established Stun consumers.
- R15. Koleda's 4-piece candidates are King of the Summit, Astral Voice, Proto
  Punk, Shockstar Disco, and Swing Jazz. Her 2-piece candidates are Shockstar,
  King, and Swing. King and Astral are distinct party packages; Proto is a
  legal Assist-triggered party package whose shield 2-piece remains unused for
  Koleda; Shockstar is action-limited Daze; Swing is a reachable
  Chain/Ultimate party-DMG package. None establishes a universal Stun order.
- R16. Koleda's base main candidates are ATK% in Slot 4, Fire DMG/ATK% in Slot
  5, and Impact in Slot 6. She has no base effective substats. Selected King
  adds CRIT Rate in Slot 4 and as an effective substat solely for the 50%
  threshold. Leaving King clears invalid CRIT inputs without fallback;
  reselecting King restores candidate membership at a zero count.
- R17. Koleda prepares Hellfire, King/Shockstar, CRIT Rate/Fire DMG/Impact, and
  zero CRIT Rate hits. Her prepared zero-hit CRIT remains below King's threshold
  but exposes the finite investment opportunity. If allocation moves her to
  Astral, the prepared package becomes Astral/King with ATK% in Slot 4 and no
  effective substat input.

  When both flexible Stuns are otherwise tied, the bounded existing order is
  extended as Trigger, Pulchra, Koleda, then Lycaon. This preserves Trigger's
  authored representative and the accepted Pulchra-over-Koleda balance without
  introducing a holder score.

### Composition, Result, and visible acceptance

- R18. Preparation keeps the permanent order: authored base candidates,
  contextual candidates, selected-input pressure, party allocation, then the
  prepared first choice. A Ben/Koleda flow must compose Ben's contextual Puffer
  state independently from Koleda's King pressure and the party's one-King
  allocation. An unaffected single-Stun party proves no pass leaks.
- R19. Ben Result exposes ATK, DEF, CRIT Rate, CRIT DMG, DMG Bonus, PEN Ratio
  when nonzero, Impact, Energy Regen, Daze, retained M4 DMG and M6 Daze action
  modifiers, optional Shield Effect, the Core shield operation, and the M2
  added-multiplier operation. Koleda exposes
  ATK only when needed by a retained operation, CRIT only when selected inputs
  or inbox effects supply it, Impact, Energy Regen when nonzero, Daze, retained
  action modifiers, and applicable M6 operations. Provider effects project to
  exact recipients once.
- R20. Incomplete selection empties all Result. Candidate and selected equipment
  summaries expose accessible compressed descriptions. Party Apply, target-only
  rebuilds, direct edits, pressure present/absent/reselected, exact same-effect
  identities, and pool changes preserve the established lifecycle.

## Acceptance Evidence

- AE1. Candidate tests prove Ben's full/non-limited pools, complete inactive
  off-Specialty packages, Proto shield consumer, Dialyn Puffer
  absent/present/reselected lifecycle, and Koleda's base plus selected-King
  candidate lifecycle. One composed Ben flow covers broad pre-PEN pressure
  present, absent, and reselected: Slot 5 PEN and standalone Puffer 2-piece are
  removed, an invalid direct selection clears without fallback or history,
  contextual Puffer 4-piece remains legal, preparation stays complete, and an
  action-scoped DEF-ignore contrast creates no such pressure.
- AE2. Preparation tests prove both zero-substat representatives, a Ben/Koleda
  single-Stun party, Koleda/Pulchra, Koleda/Lycaon, and unqualified
  Koleda/Trigger flexible two-Stun ties in all slot orders, a rigid
  Dialyn-or-Ju-Fufu King holder plus Koleda Astral in all slot orders, and the
  existing neither-Astral King/Shockstar contrast.
- AE3. Calculation tests prove Ben's DEF-to-ATK contribution, base and
  simultaneously Tusks-plus-Proto-amplified Core shield, qualification on/off,
  Big Cylinder's absence from Result, and retained Mindscape actions. Pulchra
  Proto and Lycaon M4 still expose no shield Result.
- AE4. Calculation tests prove Koleda Core/M1 Daze scopes, qualified two-stack
  Chain DMG delivery, M4 and M6, Hellfire complete package, and one inactive
  Additional contrast.
- AE5. Shared UI tests prove both Agents render in selection, Setup candidates
  and selected copy are accessible, Result stays empty when incomplete, and
  the new bounded shield operation renders without introducing generic survival
  UI.
- AE6. Original portrait assets and in-app Browser checks cover desktop and one
  narrow viewport with Ben and Koleda expanded and compact before closure.

## Rejected Alternatives And Boundaries

- Do not omit Ben's shield amount: DEF, Tusks, and Proto change a deterministic
  current candidate-visible outcome. Do not add generic shield, healing,
  survival, incoming-damage, uptime, or replacement infrastructure.
- Do not make DEF the prepared first choice merely because it strengthens two
  retained Ben relationships. Current damage practice keeps the zero-substat
  representative on CRIT/Fire/ATK; editable DEF remains a separate finite axis.
- Do not admit every off-Specialty CRIT W-Engine. Cloudcleave and Hailstorm are
  the closest current high-Base-ATK partial packages; their lower-Base-ATK
  same-axis counterparts are dominated for Ben.
- Do not project Tremor's event Energy, Spring's Energy Generation Rate, Big
  Cylinder's incoming-damage proc, Koleda M2 Energy, damage reduction, ordinary
  skill coefficients, raw/final damage or Daze, coordinated Ben/Koleda
  skill-table variants, Furnace Fire uptime, rotations, or action frequency.
- Do not generalize Ben's shield consumer to Proto on Pulchra, Koleda, or any
  other current holder. Do not infer a universal Stun priority from Koleda's
  local King/Astral tie.
- Do not add a runtime equipment optimizer, package score, exact Disc-line
  feasibility model, shield catalogue, or named-Agent allocation framework.
