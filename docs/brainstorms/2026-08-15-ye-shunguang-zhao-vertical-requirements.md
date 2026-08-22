---
date: 2026-08-15
topic: ye-shunguang-zhao-vertical
---

# Ye Shunguang And Zhao Vertical Requirements

## Summary

Admit Ye Shunguang and Zhao through the current setup-to-Result path. Ye is an
S-Rank Honed Edge Attack Agent and the first consumer that replaces an enemy's
ordinary Stun DMG Multiplier with a capped Veil Vulnerability bonus. Zhao is an
S-Rank Ice Defense provider whose Initial-Max-HP relationship supplies CRIT
Rate, a capped squad DMG benefit, Ether Veil, flat squad ATK, and one retained
Max-HP action operation.

The vertical adds White Water Ballad and Half-Sugar Bunny. It corrects the
already-retained Cloudcleave Radiance activation package from Ether-scoped to
broad DMG and CRIT DMG, because Ether Veil is its trigger rather than its
affected Attribute. It adds one bounded session Result input, `Target Stun DMG
Multiplier`, without adding an enemy panel, target catalogue, rotation, raw
damage, raw Daze, resource gauges, healing or survival simulation, or runtime
optimizer.

## Product Flows

1. Applying Ye and Zhao creates complete M0 full-pool setups with zero supplied
   substats. Ye prepares Cloudcleave/White Water/Branch and Zhao prepares
   Half-Sugar/Bunny/Yunkui with their authored main stats.
2. Ye's expanded Stun DMG Multiplier row edits the target total, default `150%`.
   Fully Enabled converts the total above `100%`, adds compatible current party
   contributions, displays the raw sum against the `+110%` cap, and shows the
   clamped Veil Vulnerability output. M4 changes only the cap to `+200%`.
3. Editing the target total recalculates Result only. Party Apply still
   prepares all three setups; pool or Mindscape changes still prepare only the
   changed Agent; ordinary direct setup edits stay local.
4. Zhao's Initial Max HP drives her CRIT Rate and, when her Additional Ability
   qualifies, a `15,000` to `27,000` squad-DMG gauge. Her zero-substat prepared
   package remains below `27,000`, while the bounded future HP opportunity can
   reach it in both pools.
5. Zhao's repeated Quick Assist route supplies the established contextual
   Astral Voice opportunity to current admitted consumers. Candidate admission,
   prepared holder allocation, selected exact-identity exposure, and Result
   projection remain separate passes.

## Owning Rules And Contrasts

- Game vocabulary owns Honed Edge's Physical base relationship and total versus
  bonus Stun DMG Multiplier meaning. Frost-to-Ice and Auric-Ink-to-Ether are the
  closest special-Attribute consumers; ordinary Physical remains the contrast
  that needs no second name.
- Formula mechanics owns Ye's bounded target-total to raw-bonus to clamped-
  replacement composition. Trigger's broad `+35%` enemy-context contribution is
  the closest additive consumer; every non-Ye damage Agent is the contrast that
  keeps the ordinary uncapped region and receives no replacement.
- The product contract owns the target value as session Result context, not
  setup state, plus candidate preparation order, finite opportunity, Focus
  delivery, contextual candidates, allocation, and lifecycle. Existing direct
  setup edits are the closest local recalculation flow; party Apply is the
  contrasting flow that still rebuilds all three setups.
- The source-fact boundary admits Ye's replacement/cap, Zhao's deterministic
  HP-derived CRIT and squad-DMG relations, flat party benefits, exact action
  modifiers, and complete equipment packages. Qingming Sword Force, Bearer,
  Frostbite, Decibels, healing, duration maintenance, and ordinary skill-table
  coefficients remain excluded because they require resource, cadence,
  survival, or raw-damage models.
- UI rules own one parent Result basis row, inline target input, raw cap gauge,
  clamped output, source breakdown, and portrait verification. Evelyn's
  threshold gauge is the closest progressing display; ordinary Stun DMG
  Multiplier rows are the contrast with no target editor or cap.

## Requirements

### Identity, direction, and retained facts

- R1. Admit Ye Shunguang as S-Rank Honed Edge Attack, Yunkui Summit, M0 by
  default, and Focus-eligible. Honed Edge damage and buff applicability resolve
  through Physical while retaining the special identity only where current
  source scope needs it. Ye's primary formula is `general_damage`.
- R2. Retain Ye's completed ATK 938, CRIT Rate 19.4%, and CRIT DMG 50%. These
  completed values already include her Core enhancement nodes and are not
  increased a second time. HP, DEF, Impact, AP, AM, and Energy Regen remain
  absent because they change no current setup choice, retained relationship, or
  Result.
- R3. Admit Zhao as S-Rank Ice Defense, Krampus Compliance Authority, M0 by
  default, and not Focus-eligible. Her primary direction is party support with
  residual `general_damage` only for her HP-derived CRIT and retained Final
  Verdict action outcome. Retain HP 9117, CRIT Rate 5%, CRIT DMG 50%, and Base
  Energy Regen 1.2/s. Her completed Core adds Initial HP +18%.

### Ye Core, Mindscapes, and target replacement

- R4. Unity begins at Combat and supplies Ye CRIT Rate +30% and broad DMG Bonus
  +25%. Ultimate: Chasing Storms or Entry Skill: Illuminating Darkness makes
  Ether Veil: Verdict and Enlightened Mind mutually reachable at Fully Enabled;
  during that window Ye's skill Physical damage becomes Honed Edge and retains
  Physical applicability.
- R5. While Ether Veil: Verdict is active, Ye's skill damage ignores the
  ordinary target Stun DMG Multiplier and uses Veil Vulnerability. Calculate the
  raw basis as `(Target Stun DMG Multiplier - 100) + compatible current party
  Stun DMG Multiplier additions`. The default target total is `150%`, values are
  whole percentages at or above `100%`, and the M0-M3 cap is `+110%`. The parent
  Result row shows Initial `0`, Combat `0`, and the raw Fully Enabled bonus; its
  gauge shows the same raw basis against `110` and the clamped Veil
  Vulnerability output.
- R6. Target `125%` with no provider produces raw/output `+25%` and `85%` cap
  room. Target `200%` produces raw/output `+100%` and `10%` room. Target `200%`
  plus Trigger M0 produces raw `+135%` and output `+110%`; the gauge displays
  `135 / 110` rather than hiding oversupply. UI does not repeat either numeric
  room value in prose. The editor keeps a local string draft: every whole
  integer at or above `100` commits and recalculates immediately; empty,
  fractional, non-finite, or below-minimum drafts keep the last valid Result,
  expose the constraint accessibly, and restore the committed value on blur or
  Enter without moving focus during recalculation.
- R7. Trigger's Core Stun DMG Multiplier is a broad enemy-context contribution,
  not a closed historical Agent list. It supplies Ye `+35%`, or `+55%` at
  Trigger M1, and remains formula-filtered for other current damage consumers.
  Trigger M2's all-party CRIT DMG is likewise formula/CRIT-consumer scoped
  rather than bounded to the first vertical's Agent IDs. Qingyi, Dialyn, Ju
  Fufu M1, Lighter M2, and any other already-retained broad party/enemy Stun
  contribution compose through their existing source clauses; a local
  action-only or qualification-inactive clause does not.
- R8. M1 increases Unity's Combat DMG Bonus by another 10% and supplies broad
  DEF Ignore +20% at Combat. M2 supplies DEF Ignore +40% only to `EX Special
  Attack: Enlightened Mind - Soaring Light` and `Ultimate: Cleaving Heavens` at
  Fully Enabled. M3/M5 change no separately retained ordinary coefficient.
- R9. M4 keeps the same raw basis and raises only the Veil Vulnerability cap and
  output boundary to `+200%`; its starting Decibels remain outside the service.
  M6's separate `+1500% ATK` Physical damage instances are additional raw
  action coefficients rather than modifiers to an existing retained operation,
  so they and Lantern Wish remain outside Result.
- R10. Ye's Additional Ability qualifies with another Support or Defense Agent,
  but its current Qingming Sword Force/Bearer resource grant has no independent
  setup or numeric Result consumer. Keep the qualification out of production
  until a later retained output requires it; Zhao's party value does not depend
  on inventing that resource model.

### Ye W-Engine and Drive Disc authoring

- R11. Ye's full W-Engine candidates are Cloudcleave Radiance, The Brimstone,
  Steel Cushion, Gilded Blossom, Marcato Desire, and Starlight Engine.
  Non-limited candidates exclude Cloudcleave and retain the other
  non-limited packages. Full prepares Cloudcleave W1; non-limited prepares The
  Brimstone W1. S-Rank choices default to W1 and A-Rank choices to W5 when
  directly selected.
- R12. Cloudcleave is limited S-Rank Attack, Base ATK 743, advanced CRIT DMG
  +48%. W1-W5 broad Physical RES Ignore is +20% / 22% / 24% / 26% / 28% at
  Combat. Holder activation of Ether Veil supplies broad Fully Enabled DMG
  Bonus and CRIT DMG +25% / 28.7% / 32.5% / 36.2% / 40%. Ye consumes the whole
  package. Billy and Nekomata remain the closest partial-package contrast:
  their broad Physical RES Ignore stays usable, but another Agent's Veil does
  not satisfy the holder-activation clause.
- R13. Brimstone is the non-limited representative through its S-Rank Base ATK,
  ATK advanced stat, and reachable broad ATK stacks. Steel supplies a CRIT/
  Physical/back-attack balance; Gilded supplies accessible ATK and EX damage;
  Marcato supplies a CRIT chassis and smaller broad ATK route; Starlight supplies
  accessible broad ATK after its retained Assist route. Street Superstar is
  excluded because its same-Base-ATK and advanced-ATK chassis gives up those
  broader packages for an Ultimate-only passive. Ye uses Ultimate, but her
  damage direction is not concentrated there enough for that narrow clause to
  remain competitive across the W-Engine slot. Same-rarity limited CRIT packages whose usable clauses
  are dominated by Cloudcleave add no current accessibility or formula path
  and remain excluded.
- R14. Add White Water Ballad. Its 2-piece supplies Physical DMG +10%. Its
  4-piece supplies Fully Enabled CRIT Rate +10% while within any Ether Veil;
  when an Attack holder activates or extends Ether Veil it supplies another
  CRIT Rate +10% and ATK +10%. Ye reaches the complete package herself. Another
  Physical Attack Agent merely standing in Zhao's Veil receives only the first
  CRIT clause and does not gain contextual membership because that partial
  package is dominated by current authored personal 4-piece choices.
  Ye's complete Setup package compresses the two CRIT clauses to CRIT Rate +20%
  beside ATK +10%; the separate trigger facts remain available to exact Result
  projection rather than being repeated as Setup prose.
- R15. Ye's base 4-piece candidates are White Water Ballad, Woodpecker Electro,
  and Hormone Punk. Puffer Electro remains the established contextual candidate
  only when the applied party supplies Dialyn's retained Ultimate opportunity.
  White Water's complete Physical/CRIT/ATK package is the prepared first choice;
  Woodpecker and Hormone preserve CRIT-balanced and ATK-heavy alternatives.
- R16. Ye's authored 2-piece roles are CRIT Rate, CRIT DMG, Physical DMG, PEN
  Ratio, and one ATK identity. White Water Ballad and Fanged Metal form one
  same-effect identity relationship: selecting White Water 4-piece exposes
  Fanged 2-piece, while selecting another 4-piece exposes White Water so its
  4-piece role remains swappable. Hormone Punk/Astral Voice retain their
  existing ATK identity lifecycle. Prepared White Water uses Branch & Blade.
- R17. Ye's mains are CRIT Rate/CRIT DMG in Slot 4, Physical DMG/ATK%/PEN Ratio
  in Slot 5, and ATK% in Slot 6. Effective substats are CRIT Rate, CRIT DMG, and
  ATK%. Both pools prepare CRIT DMG / Physical DMG / ATK% with zero counts.
  Her fixed Unity and White Water CRIT supply makes CRIT DMG the balanced first
  main while the conservative eight-CRIT-hit authoring check preserves future
  CRIT Rate opportunity without inserting hidden counts or optimizing Disc
  lines.

### Zhao Core, Mindscapes, and equipment authoring

- R18. Zhao's completed Core supplies Initial HP +18%. Initial Max HP grants
  CRIT Rate at +1.4% per 1,000 HP through a continuous relation; M6 uses 125%
  of that output. The resulting CRIT Rate is capped only by the ordinary displayed
  100% CRIT cap. This relation has no 27,000-HP cap.
- R19. Activating Ether Veil: Wellspring supplies all party Max HP +5% and flat
  ATK +1000 at Fully Enabled. The HP effect shares the established identical
  non-stacking Ether Veil: Wellspring identity with Yidhari and Lucia; equal
  origins remain visible while only one value applies. Frostbite, activation
  cadence, duration, and Quick Assist sequencing remain outside Result.
- R20. Zhao's Additional Ability qualifies with another Attack, Anomaly, or
  Support Agent. While Zhao is in any Ether Veil, it supplies squad DMG +10%,
  then +1% per 400 Initial Max HP above 15,000 through a continuous relation,
  capped at +40% at 27,000. The Max HP row shows a `15,000` threshold,
  `27,000` cap, and current
  squad-DMG output only when qualified. Ye is the closest qualifying current
  partner; Zhao with Caesar and Focus-eligible Rupture Agent Yixuan is the
  applicable inactive contrast because no other Attack, Anomaly, or Support
  Agent is present.
- R21. M1 supplies broad All-Attribute RES Ignore +15% to current damage
  consumers at Fully Enabled. M2's self-reachable healing condition supplies
  other party members ATK +15% at Fully Enabled; its personal ATK clause does
  not strengthen Zhao's retained provider direction and creates no local Result.
  M3/M5 alter
  no separately retained coefficient. M4 supplies CRIT DMG +40% only to
  Ultimate, Chain Attack, and `Basic Attack: Final Verdict`.
- R22. `Basic Attack: Final Verdict` retains one complete maximum-charge
  operation: five seconds at +24% Max HP per second produces +120% Max HP.
  M6 scales that source-stated added amount to 140% of its original value,
  producing +168% Max HP. Do not calculate the ordinary action coefficient,
  final damage, charge timing, or repeated M6 consumption behavior. Zhao's
  Special/EX healing amount and HP consumption remain outside the survival
  boundary; they only establish M2 reachability.
- R23. Add Half-Sugar Bunny as limited S-Rank Defense, Base ATK 713, advanced HP
  +30%. W1-W5 holder automatic Energy Regen is +0.46 / 0.53 / 0.60 / 0.67 /
  0.74 per second. Its non-stacking squad ATK and Max HP values are +10% / 11.5%
  / 13% / 14.5% / 16%; activating or extending Ether Veil supplies squad CRIT
  DMG +30% / 34.5% / 39% / 43.5% / 48% at Fully Enabled. Zhao is
  holder-eligible and activates the complete package.
- R24. Zhao's full W-Engine candidates are Half-Sugar Bunny and Original
  Transmorpher; non-limited retains Original. Full prepares Half-Sugar W1 and
  non-limited prepares Original W5. Original's Base ATK 594, advanced HP +25%,
  unconditional holder Max HP +12.5% at W5, and inactive after-attacked Impact
  clause form the nearest same-axis accessibility package. Bunny Band is
  dominated by Original's same-rank, same-Base-ATK HP package and needs an
  external shield for only personal ATK; Spring Embrace and Tusks do not
  preserve enough Initial-HP pressure to offset their unused survival/Daze
  clauses. These are local Zhao judgments, not general Defense exclusions.
- R25. Zhao's 4-piece candidates are Bunny in Wonderland and Astral Voice.
  Bunny supplies HP +10% and squad DMG +18%; Astral supplies ATK
  +10% and a controllable entrant DMG +24% through Zhao's repeated Quick
  Assists. Swing's Energy two-piece remains useful, but its lower same-axis
  squad-DMG four-piece is dominated by Zhao's controllable Astral route and
  complete Bunny HP/buffer package. Proto Punk's unused shield 2-piece and
  weaker Assist route likewise do not remain competitive, and Support-only
  Moonlight 4-piece is inactive for Zhao. Bunny is the
  local representative because its second HP set can keep the 27,000 cap
  inside the bounded future opportunity while its squad output remains broad.
- R26. Zhao's authored 2-piece roles are HP, Energy Regen, and one ATK identity.
  Bunny in Wonderland/Yunkui Tales form a same-effect HP relationship: selected
  Bunny 4-piece exposes Yunkui 2-piece; selected Astral or Swing exposes Bunny
  so its 4-piece role remains swappable. Swing/Moonlight and Astral/Hormone keep
  their established identity lifecycles. Both pools prepare Bunny/Yunkui.
- R27. Zhao's mains are HP% in Slot 4, HP% in Slot 5, and HP%/Energy Regen in
  Slot 6. Effective substats are HP% and flat HP. Her HP-derived CRIT Rate and
  M4 action-scoped CRIT DMG remain visible Result relationships, but they do not
  create a personal damage-contributor direction or admit personal-damage
  setup inputs. Both pools prepare HP% / HP% / HP% with zero counts. The
  capped-provider authoring check considers up to eight HP% and eight flat-HP
  hits: the full and non-limited representatives can reach 27,000 inside that
  finite opportunity, but initialization does not insert hits or continuously
  optimize edited values.

### Preparation, lifecycle, Result, and visible acceptance

- R28. Preparation remains acyclic. First derive authored and contextual
  equipment candidates, apply existing holder allocation, and choose complete
  packages. Then derive selected-input pressure, mains, and effective substats
  and initialize every offered count to zero. Target Stun DMG Multiplier is
  Result context and never enters this flow.
- R29. Zhao joins the established repeated Quick Assist opportunity predicate
  used by Cissia, Evelyn, and Caesar contextual Astral admission. Party Apply
  with Zhao adds the candidate and rebuilds all three setups; removing Zhao
  removes it and prepares the affected Agent back from authored local choices;
  reapplying Zhao restores membership, not a prior selection. Ye's White Water,
  Zhao's Bunny, and every target-value edit are unaffected contrasts. Zhao's
  repeated Quick Assist also satisfies Qingyi's separate local external-Quick-
  Assist Astral opportunity; its present, absent, and reapplied lifecycle stays
  local to Qingyi and does not broaden focused-damage predicates.
- R30. Ye plus Zhao plus one Stun Agent keeps the settled Focus-CRIT King
  preparation: one legal Stun holder prepares King, while Zhao's local Bunny
  package creates no King/Astral collision. Existing two-Stun King/Astral/
  Shockstar allocation remains unchanged; this vertical does not generalize its
  local tie policy.
- R31. Ye Result exposes ATK, CRIT, broad and action-scoped DMG, DEF/RES regions,
  the target-derived raw Stun DMG Multiplier basis and Veil gauge, Cloudcleave,
  White Water, and retained M1/M2/M4 differences. Candidate dominance does not
  broaden exact projection. Non-Ye Results keep ordinary uncapped Stun DMG
  Multiplier rows and no target editor. The external basis is a source row named
  `Target Stun DMG Multiplier` with detail `Above 100%`; it shares one neutral
  local target tone with the gauge and editor and never highlights an Agent or
  Setup locus. Party additions retain their own source rows and interactions.
- R32. Zhao Result exposes Initial/Combat/Fully Max HP, HP-derived CRIT Rate,
  Energy Regen, qualified squad-DMG gauge, exact party/equipment sources,
  M4's action-scoped CRIT relationship, and the Final Verdict operation. M1 and
  M2 project to applicable recipients without adding personal RES/ATK rows. It omits healing totals,
  Frostbite, Decibels, uptime, ordinary damage, and raw action coefficients.
- R33. Selected and candidate equipment expose identical accessible compressed
  package descriptions, including inactive clauses and exact effect identities.
  Original-asset inspection and in-app Browser comparison at desktop and one
  narrow viewport cover Ye and Zhao expanded and compact before commit.

## Acceptance Evidence

- AE1. Candidate and preparation tests prove both W-Engine pools, complete
  usable/unused packages, White Water and Half-Sugar facts, same-effect exact
  identity exposure, zero-substat representatives, and one unaffected current
  consumer.
- AE2. Composed lifecycle tests cover Zhao Quick Assist opportunity present,
  absent, and reselected for both the shared and Qingyi-local predicates;
  contextual candidate clearing without fallback;
  party-wide Apply, changed-Agent-only pool/Mindscape preparation, direct-edit
  locality, and preserved Stun allocation.
- AE3. Ye calculation tests prove Honed Edge/Physical applicability, Unity
  surfaces, Cloudcleave broad activation clauses, M1/M2/M4, excluded M6 raw
  coefficients, default and
  edited target totals, Trigger addition, raw oversupply, clamped output, and a
  contrasting non-Ye uncapped row.
- AE4. Zhao calculation tests prove Initial HP composition, stepped Core CRIT,
  M6 scaling, Additional inactive/below/reached cap, equal Wellspring origins,
  Half-Sugar package, M1/M2 recipient delivery, M4's exact action-scoped CRIT
  DMG without local ATK or generic damage rows, and the Final Verdict operation.
- AE5. UI tests prove the accessible whole-percent target input, immediate
  result-only recalculation, invalid-draft retention and blur/Enter restoration,
  preserved focus, neutral target-source interaction, raw gauge and clamped
  output, no headroom copy or generic target panel, selected/candidate package
  parity, and empty Result during incomplete setup.
- AE6. Full tests, typecheck, production build, original portrait inspection,
  and desktop/narrow expanded/compact Browser verification pass before closure.

## Rejected Alternatives And Boundaries

- Do not add a generic enemy editor, target type, stage preset, resistance
  input, or persisted target profile. One target total exists because Ye has one
  current Result-changing replacement consumer.
- Do not show only the clamped value. The raw gauge basis preserves whether
  party Stun supply is useful or oversupplied; the output carries the applied
  cap.
- Do not create separate `Stun DMG Multiplier` and `Veil Vulnerability` parent
  rows. One expanded basis row plus gauge keeps input, source sum, cap, and
  replacement together.
- Do not put the target input in Setup or let it reprepare equipment. It is
  external Result context and cannot create candidates, pressure, allocation,
  incompleteness, or hidden optimization.
- Do not treat Cloudcleave's Ether Veil trigger as Ether affected scope or let
  another holder's Veil activate it. Trigger, holder eligibility, and affected
  Attribute remain separate.
- Do not make White Water a contextual catalogue entry for every Physical
  Agent. The partial externally supplied package must independently survive the
  current consumer's whole-package opportunity cost; sampled current Physical
  Attack consumers do not.
- Do not generalize Zhao's equipment decisions to every Defense Agent. Her
  Initial-HP threshold, own repeated Quick Assist, and Ether Veil activation are
  the local consumers.

## Status

No product decision blocks implementation planning. The user has settled the
target-total semantics, default, raw cap gauge, and inline Result input. The
five permanent owners now support the bounded Honed Edge and Veil replacement
meaning, while current Trigger, threshold-gauge, special-Attribute, contextual
candidate, and capped-provider consumers supply the required contrasts.
