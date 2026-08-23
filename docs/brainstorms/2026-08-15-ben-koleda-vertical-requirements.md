---
date: 2026-08-15
topic: ben-koleda-vertical
---

# Ben And Koleda Vertical Requirements

## Summary

Add Ben Bigger and Koleda Belobog through the current setup-to-Result path.
Ben is a current Fire damage contributor and buffer whose completed Core makes
Initial DEF a retained Combat ATK basis. Koleda is a Fire Daze contributor
and Chain Attack buffer. Both reuse established general-damage, Daze, party
qualification, equipment, preparation, direct-edit, and incomplete-selection
behavior.

Ben's bounded linked Result relationship is Initial DEF to Combat ATK. His Core
shield remains only as the internal source-local condition for an independently
retained Additional Ability effect; Shield Effect and the shield amount are not
Result or positive setup axes. Incoming-damage and transfer events remain
retained authoring/activation facts for eligibility and applicability, while
compressed equipment copy intentionally omits routine trigger and duration
prose and keeps only materially affected outcomes when an independently
admitted complete package needs them.
Koleda adds no new common mechanism.

## Product Flows

1. A user can add Ben or Koleda to any slot, receive the Rank-default
   Mindscape and one complete pool-specific starting setup, and inspect the
   retained Result without supplying substats.
2. Ben's prepared setup strengthens his current personal damage. Direct edits
   can instead select currently exposed DEF, party-buffer, and resource
   packages. Changing DEF updates Ben's Core ATK contribution. Shield Effect
   and an exact shield amount do not enter Result or make an input positive.
3. A qualified Ben exposes the Core-shield CRIT Rate bundle to the whole squad.
   Removing the qualifying Fire or Belobog teammate removes that bundle without
   introducing or removing a visible shield amount. The Additional Ability owns
   the CRIT contribution; the shield-active state remains only its internal
   condition.
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
  not be reused as a DEF gauge.
- The source boundary excludes Ben's deterministic per-EX shield amount and
  Shield Effect from Result and from positive setup axes. It retains only the
  Core shield's existence as the smallest internal condition for Ben's
  Additional Ability CRIT contribution. The removed Proto Punk identity and
  Lycaon's M4 remain contrasts whose survival clauses create no Result or
  positive candidate axis.
- Game vocabulary owns Defense and Stun identity, Belobog faction, W-Engine
  Specialty activation, Initial DEF inputs, and exact action terms. An
  off-Specialty W-Engine keeps Base ATK and its advanced stat while its passive
  remains inactive.
- UI rules own compressed equipment copy, source origins, the expanded numeric
  Result, and accessible selected/candidate descriptions. Ben's retained
  authoring facts include Shield Effect and per-event survival packages for
  eligibility and applicability; compressed Setup keeps materially affected
  outcomes, such as Spring's transfer and Big Cylinder's next-hit outcome,
  while intentionally omitting routine incoming-damage trigger and duration
  prose. It does not project that copy to Result or turn it into candidate
  rationale.

## Requirements

### Identity and direction

- R1. Ben Bigger is A-Rank Fire Defense, Belobog Heavy Industries, M6 by
  default, and Focus-eligible. His primary direction is `general_damage`; he
  also has a buffer role and residual `daze_buildup`. Koleda Belobog is S-Rank
  Fire Stun, Belobog Heavy Industries, M0 by default, and not Focus-eligible.
  Her primary direction is `daze_buildup`, with a buffer role and residual
  `general_damage` only where a retained action or package consumes it.
- R2. Ben retains completed ATK 867, DEF 724, CRIT Rate 5%, CRIT DMG 50%,
  Impact 95, and base Energy Regen 1.56/s. Koleda retains completed CRIT Rate
  5%, Impact 134, and base Energy Regen 1.2/s. Other
  completed stats without a current consumer are omitted.

### Ben Core, qualification, and progression

- R3. Ben's completed Core adds 80% of his Initial DEF to Combat ATK. Result
  exposes Initial DEF and the Core Passive ATK contribution. It exposes neither
  Shield Effect nor an exact Core shield amount or operation. The Core shield's
  active state remains only where R4 needs that source-local condition; neither
  that state nor an activation action acquires ownership of R4's effect.
- R4. Ben's Additional Ability activates when another Agent shares his Fire
  Attribute or Belobog faction. While Ben's Core shield is active, all squad
  members gain CRIT Rate +16%. It is a Fully Enabled all-party CRIT clause tied
  to Ben's Core shield state, not to any shield in general. Result attributes
  the contribution to `Additional Ability`; neither the shield state nor the EX
  follow-up becomes its source, and no shield amount remains visible when the
  Additional Ability is unqualified.
- R5. Ben's Mindscapes apply cumulatively. M1's enemy damage reduction has no
  current Result consumer. M2 retains the source-stated added 300% DEF damage
  for a successful Special/EX Block Counter as one action operation. M4 adds
  30% DMG to a counter after the source-qualified invulnerable block. M6 adds
  Daze +20% to Basic Attack, Dash Attack, and Dodge Counter after the EX attack
  or follow-up. M3 and M5 change no separately retained source value.

### Ben equipment and prepared setup

- R6. Ben's full W-Engine pool contains Tremor Trigram Vessel, Tusks of Fury,
  Cloudcleave Radiance, Hailstorm Shrine, Big Cylinder, and Spring Embrace. His
  non-limited S-Rank pool contains Tremor, Big Cylinder, and Spring Embrace.
  Both prepare Tremor W5. Under SW-010, City Fund Spring remains eligible there
  as an A-Rank and independently competitive through its transferable resource
  direction.
- R7. Tremor is a matching-Defense complete ATK and EX/Ultimate-DMG package;
  its event-Energy clause remains Setup-only copy outside Result. Tusks supplies
  a recipient-facing squad-DMG/Daze package, while its Impact and Shield Effect
  do not strengthen Ben's direction. Shield Effect remains Setup-only survival
  copy and adds no positive axis. Cloudcleave and Hailstorm are off-Specialty
  partial packages with equivalent-rarity CRIT-DMG or CRIT-Rate directions.
  Hailstorm's Anomaly and Ice clauses are inactive for Ben and do not apply to
  Result. Setup nevertheless shows each source-owned complete package without
  compatibility labels. Cloudcleave's CRIT DMG and Hailstorm's CRIT Rate are
  equivalent CRIT investment directions that can exchange Slot 4 and future-substat
  balance, so both remain material full-pool alternatives. Severed Innocence
  and Heartstring Nocturne repeat one of those same CRIT supplies at lower Base
  ATK without a usable Ben passive and remain excluded.
- R8. Big Cylinder is a matching-Defense local DEF and next-hit package. Its
  incoming-damage activation and cadence remain authoring interpretation;
  compressed Setup keeps the next-hit outcome outside Result. Spring Embrace
  supplies ATK and a transferable Energy-generation package. Its activation,
  transfer, and duration remain authoring interpretation; compressed Setup
  keeps the transfer outcome without creating Energy Regen or a Result
  operation. Their survival copy does not establish membership. Big Cylinder
  remains competitive through Ben's DEF-to-ATK relationship and the distinct
  next-hit DEF operation; Spring remains through ATK and its transferable
  resource package. Neither conclusion credits the damage-reduction clauses.
- R9. Ben's 4-piece roster is Woodpecker Electro, Astral Voice, Bunny in
  Wonderland, and Swing Jazz. Dialyn's Ultimate opportunity contextually adds
  Puffer Electro. His 2-piece roster is Woodpecker, Branch & Blade, Inferno
  Metal, Puffer Electro, Hormone Punk, Astral Voice, Swing Jazz, and Moonlight
  Lullaby under the different-set and exact same-effect identity rules.
  Woodpecker is Ben's personal CRIT/ATK direction, Astral is the Focus-entrant
  buffer direction and already reaches 16% at two stacks, Bunny uses Ben's own
  shield to reach 18% squad DMG, and
  Swing exchanges three percentage points of party DMG for Energy Regen.
  Proto Punk is excluded from both pieces: Shield Effect supplies no positive
  axis, and its passive Assist-triggered 15% squad clause does not survive the
  complete-package comparison with Bunny or Swing.
- R10. Ben's main roster is CRIT Rate/CRIT DMG/ATK% in Slot 4, Fire DMG/PEN
  Ratio/ATK% in Slot 5, and ATK% in Slot 6; effective substats are CRIT Rate,
  CRIT DMG, and ATK%. DEF and ATK both supply his one Combat ATK axis through
  Core's `0.8 × DEF` relation. With Ben's retained Agent values and selected
  Tremor fact, both a fixed ATK% main and one ATK% substat hit add more Combat
  ATK than their DEF alternatives. DEF main, DEF%, and flat DEF therefore lose
  the finite same-axis comparison.
  Big Cylinder's fixed DEF and event operation remain complete package facts,
  not repeatable setup investment directions.
- R11. Both pools prepare Tremor from its fully usable personal-damage package.
  The current Disc, main, and zero-substat preparation remains
  Woodpecker/Branch & Blade, CRIT Rate/Fire DMG/ATK%, and zero supplied hits.
  The finite DEF-to-ATK comparison in R10 preserves this representative without
  a runtime optimizer.

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
  candidates or representatives. M4 personal Chain/Ultimate DMG and M6
  explosion damage do not strengthen Koleda's retained Daze/Chain-buffer
  direction and create no Result modifier or operation. M3 and M5 change no
  separately retained value.
- R14. Koleda's full W-Engine candidates are Hellfire Gears, Blazing Laurel,
  The Restrained, Steam Oven, and Precious Fossilized Core. Her non-limited
  S-Rank pool excludes only Blazing from that admitted set. Both pools prepare
  Hellfire W1: its off-field Energy and fully enabled Impact directly reinforce
  Koleda's EX-driven Core Daze.
  Blazing exchanges that resource package for higher Assist-enabled Impact and
  Fire/Ice squad CRIT DMG. The Restrained is a separate enhanced-Basic DMG/Daze
  direction. Steam remains the accessible A-Rank resource/Impact package, and
  Precious remains the target-high-HP Daze package; their timing and ownership
  paths do not duplicate Hellfire's EX package. Ice-Jade is excluded because
  Koleda's short Basic-to-EX sequence does not sustain its 15/30 Basic-hit
  thresholds without role-distorting field time. Box Cutter has no Koleda
  Aftershock consumer, while Demara and Simmering Pot do not beat the retained
  resource or action packages. Simmering's Daze/DMG outcome is broad, but its
  complete package remains less aligned than Koleda's retained resource and
  defining-action alternatives.
  These are Koleda-local conclusions, not inherited Stun membership.
- R15. Koleda's 4-piece roster contains King of the Summit, Astral Voice,
  Shockstar Disco, and Swing Jazz; her 2-piece roster contains Shockstar, King,
  and Swing. King and Astral supply distinct party packages, Shockstar has
  action-limited Daze, and Swing combines a reachable Chain/Ultimate party-DMG
  clause with Energy Regen. Proto Punk is excluded holder-locally because its
  unused Shield Effect and passive Assist route do not make the same 15% party
  axis competitive with Swing or the controllable Astral direction, which
  already reaches 16% at two stacks.
  This does not establish a universal Stun order.
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
  modifiers, and the M2 added-multiplier operation. It exposes no Shield Effect
  or Core shield amount. The DEF-to-ATK contribution is owned by Core Passive;
  the qualified all-party CRIT contribution is owned by Additional Ability.
  Koleda exposes selected King CRIT and its gauge, Impact, Energy Regen when
  nonzero, Daze and retained Daze action modifiers. Her outgoing Chain-DMG and
  Daze clauses project to exact recipients once; personal ATK/damage rows and
  the M6 operation are omitted.
- R20. Incomplete selection empties all Result. Candidate and selected equipment
  summaries expose accessible compressed descriptions. Party Apply, target-only
  rebuilds, direct edits, pressure present/absent/reselected, exact same-effect
  identities, and pool changes preserve the established lifecycle.

## Acceptance Evidence

- AE1. After U6/U7 reinspection, candidate tests prove Ben's independently
  authored full/non-limited pools, complete source-owned off-Specialty packages,
  Proto's holder-local exclusion, Dialyn Puffer
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
- AE3. Calculation tests prove Ben's DEF-to-ATK contribution, qualification
  on/off under the Additional Ability source, absence of Shield Effect and an
  exact shield operation, Big Cylinder's absence from Result, and retained
  Mindscape actions. The removed Proto identity and Lycaon M4 likewise create
  no shield Result.
- AE4. Calculation tests prove Koleda Core/M1 Daze scopes, qualified two-stack
  Chain DMG delivery, omission of personal M4/M6 damage rows, Hellfire's
  complete package, and one inactive Additional contrast.
- AE5. Shared UI tests prove both Agents render in selection, Setup candidates
  and selected copy are accessible, Result stays empty when incomplete, and
  no Shield Effect or exact shield operation renders. Complete selected and
  candidate equipment may retain exact survival copy without creating generic
  survival UI.
- AE6. Original portrait assets and in-app Browser checks cover desktop and one
  narrow viewport with Ben and Koleda expanded and compact before closure.

## Rejected Alternatives And Boundaries

- Do not expose Ben's shield amount or Shield Effect in Result and do not use
  either to justify DEF, Tusks, Proto, or another setup direction. Do not add
  generic shield, healing, survival, incoming-damage, uptime, or replacement
  infrastructure. Preserve only the smallest internal shield condition needed
  by Additional Ability and complete equipment survival copy after independent
  non-survival admission.
- Do not retain DEF as a prepared or repeatable investment merely because it
  has positive arithmetic through Core: ATK is the stronger same-axis supplier.
- Do not admit every off-Specialty CRIT W-Engine from a positive stat.
  Cloudcleave and Hailstorm survive the holder-local comparison because their
  equal-rarity CRIT Rate/CRIT DMG exchange changes the complete finite setup;
  Severed Innocence and Heartstring do not survive by repeating those axes at
  lower Base ATK without a usable Ben passive.
- Do not project Tremor's event Energy, Spring's Energy Generation Rate, Big
  Cylinder's incoming-damage proc, Koleda M2 Energy, damage reduction, ordinary
  skill coefficients, raw/final damage or Daze, coordinated Ben/Koleda
  skill-table variants, Furnace Fire uptime, rotations, or action frequency.
- Do not generalize Ben's internal shield condition into a positive Proto axis
  on Ben, Pulchra, Koleda, or any other current holder. Do not infer a universal
  Stun priority from Koleda's local King/Astral tie.
- Do not add a runtime equipment optimizer, package score, exact Disc-line
  feasibility model, shield catalogue, or named-Agent allocation framework.
