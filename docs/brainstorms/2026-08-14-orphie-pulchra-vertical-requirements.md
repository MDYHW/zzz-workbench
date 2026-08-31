---
date: 2026-08-14
topic: orphie-pulchra-vertical
---

# Orphie & Magus And Pulchra Vertical

## Summary

Admit Orphie & Magus and Pulchra from the initial Version-2.8 content cohort
using their current released behavior. Orphie & Magus is an S-Rank Fire Attack
Agent whose off-field direction, Aftershock identity, Energy-Regen-to-ATK Core,
and squad Zeroed In effects reuse current general-damage, action-tag, capped
provider, and New Eridu Defense Force meanings. Pulchra is an A-Rank Physical
Stun Agent whose Daze direction, Aftershock delivery, default-M6 broad squad
DMG, selected-King CRIT pressure, and competitive Stun Disc alternatives reuse
current Stun, provider, equipment, allocation, and lifecycle meanings.

The current vertical adds two equipment identities: Gilded Blossom and Box
Cutter. It does not add a rotation, resource gauge, trap-state simulator,
raw damage, raw Daze, a runtime optimizer, named-party ordering, or a general
Aftershock catalogue.

## Product flows

- Applying the two Agents creates complete pool-specific starting setups at
  zero supplied substats. Orphie reaches her Energy-derived ATK cap in the full
  Bellicose/Shadow/Energy representative and preserves a finite CRIT/ATK
  investment opportunity; Pulchra prepares King locally and exposes only the
  selected-King CRIT opportunity.
- Orphie's equipment and Agent sources retain Aftershock, Basic/Ultimate,
  EX-Special, Chain/Ultimate, Attribute, and recipient scopes separately in
  Result. Pulchra's Core Daze applies to its current four actions while her
  Additional changes from Aftershock-only at M0-M5 to broad squad DMG at M6.
- Selecting Pulchra's King creates CRIT Rate main/substat membership. Selecting
  Astral or Swing clears invalid CRIT selections without a
  fallback; reselecting King restores membership at zero, not history.
- Party preparation composes existing non-stacking allocation before the new
  local representative reaches Setup: an established King-priority Stun holder
  keeps King and Pulchra takes Astral plus King 2-piece. Parties without that
  pressure retain Pulchra's local King first choice.
- Party or Focus Apply rebuilds all three setups. Pool or Mindscape changes
  rebuild only the changed Agent; direct equipment edits never invoke hidden
  cross-Agent repair.

## Requirements

### Admission, direction, and retained identity

- R1. Admit Orphie & Magus as S-Rank, Fire, Attack, Obol Squad, not
  Focus-eligible, and a residual `general_damage` contributor. Admit Pulchra as
  A-Rank, Physical, Stun, Sons of Calydon, not Focus-eligible, with primary
  `daze_buildup` and residual `general_damage` participation. Orphie's retained
  New Eridu Defense Force qualification reuses the same typed group used by
  Soldier 11, Seed, Trigger, and Anby: Soldier 0 without replacing her displayed
  faction. Rank defaults initialize Orphie at M0 and Pulchra at M6.
- R2. Retain current level-60 values consumed by this vertical: Orphie ATK 929,
  CRIT Rate 5%, CRIT DMG 50%, and Energy Regen 1.56/s; Pulchra CRIT Rate 5%,
  Impact 136, and Energy Regen 1.2/s. Other facts remain absent
  without a current Setup, formula, threshold, action, operation, or Result
  consumer.
- R3. Orphie uses ATK, CRIT Rate, CRIT DMG, Fire DMG, Energy Regen, and exact
  DEF/RES bypass through general damage. Her effective substats are CRIT Rate,
  CRIT DMG, and ATK%. Pulchra uses Impact and Daze as her primary direction;
  ATK, CRIT, and Physical DMG remain residual personal-damage values rather than
  an independently authored damage-dealer direction. Her base effective-substat
  set is empty. King selection alone creates CRIT Rate as a material threshold
  opportunity, matching Lycaon and Lighter rather than Trigger's independent
  CRIT relationship.

### Orphie & Magus equipment authoring

- R4. Orphie's full W-Engine candidates are Bellicose Blaze, Heartstring
  Nocturne, Serpentine Seeker, Sol Exuvia, Gilded Blossom, and Marcato Desire.
  Non-limited candidates are Sol, Gilded Blossom, and Marcato. Full prepares
  Bellicose Blaze W1; non-limited prepares Sol W1.
- R5. Bellicose is the full first choice through its complete Energy Regen,
  CRIT Rate, and Fire Aftershock DEF Ignore package. Heartstring is the retained
  Energy-Regen-less other-limited alternative: its balanced CRIT package
  materially recomposes Orphie's zero-substat setup and its Fire
  Chain/Ultimate RES Ignore is usable. Serpentine is a separate limited Energy
  Regen direction whose Energy Regen and CRIT Rate remain competitive with the
  strongest non-limited package while its Electric DEF Ignore contributes zero,
  without that unused clause becoming a penalty. Parallel other-limited
  personal-damage packages that do not materially change the recomposed setup
  beyond Heartstring are excluded. Myriad Eclipse is excluded because
  Heartstring has the same Base ATK and advanced CRIT Rate, more unconditional
  CRIT DMG, and a usable Fire clause while Myriad's Ice-trigger clause is
  inactive. Sol's high-Base-ATK ATK/CRIT package establishes the non-limited
  first choice while its Ether-only clause contributes zero. Gilded preserves
  the distinct fully aligned EX/ATK route. Marcato remains only as the strongest
  still-competitive same-direction account-use substitute when Sol is
  contested. Brimstone and
  Starlight are excluded because their activation-dependent broad ATK packages
  do not create a material package advantage over Gilded's fully aligned EX/ATK
  package or Sol's stronger CRIT/ATK axis at zero supplied substats.
- R6. Add Gilded Blossom as an A-Rank non-limited Attack candidate. Its ATK and
  EX-Special-DMG clauses are both usable by Orphie and remain separately visible
  in Setup and Result.
- R7. Orphie's 4-piece candidates are Shadow Harmony and Astral Voice. Shadow
  is the local self-package through Aftershock/Dash 2-piece identity and its
  4-piece ATK/CRIT package. Orphie's recurring EX Special and Ultimate Quick
  Assist operations make Astral's entrant effect a controllable one-recipient
  squad direction, not a numerical duplicate of Shadow.
  Orphie's 2-piece candidates are Shadow Harmony, Inferno Metal, Woodpecker
  Electro, Branch & Blade Song, Hormone Punk, Astral Voice, Swing Jazz, and
  Moonlight Lullaby. They retain Aftershock, Fire, CRIT, ATK, and Energy axes in
  whole-package combination; same-effect ATK and Energy identities follow the
  existing exact-identity lifecycle.
- R8. Full prepares Shadow Harmony 4-piece plus Swing Jazz 2-piece, CRIT DMG /
  Fire DMG / Energy Regen mains, and zero substats. Its selected W-Engine,
  Shadow, and Agent-local Core supply leave too little of the conservative
  eight-hit CRIT opportunity for another fixed CRIT-Rate main, so CRIT DMG
  precedes it. The selected Energy package reaches Orphie's Core ATK cap.
  Non-limited prepares Sol W1, Shadow Harmony 4-piece plus Swing Jazz 2-piece,
  CRIT DMG / Fire DMG / Energy Regen mains, and zero substats. Sol supplies the
  same fixed CRIT Rate as Bellicose, so the finite opportunity keeps the
  CRIT-DMG main even though Sol does not replace Bellicose's Energy direction.
  The prepared difference is a
  bounded authored representative, not runtime scoring.

### Pulchra equipment authoring

- R9. Pulchra's full W-Engine candidates are Blazing Laurel, Box Cutter,
  Hellfire Gears, Steam Oven, and Precious Fossilized Core. Her non-limited
  pool retains Box Cutter, Hellfire Gears, Steam Oven, and Precious Fossilized
  Core. Full prepares Blazing Laurel W1; non-limited prepares Box Cutter W5.
- R10. Blazing establishes the full first choice through high Base ATK,
  advanced Impact, and Pulchra's frequent Quick/Perfect-Assist route to its
  Fully Enabled Impact. Her authored operation does not establish the repeated-
  Basic Wilt package, so the Fire/Ice squad CRIT-DMG clause is a zero-valued
  unused axis rather than a penalty. Setup still shows that complete source-
  owned clause, while Result projects only the usable Impact. Box Cutter is a
  partial but competitive package: its advanced Impact serves all Daze, while
  its Aftershock trigger supplies the retained Daze clause. Its Physical-DMG
  clause remains complete source-owned Setup copy but contributes zero to
  Pulchra's non-dealer candidate value and Result. At W5 that realized
  Impact/Daze package establishes the non-limited first choice. Hellfire supplies the
  retained Impact plus off-field Energy route. Steam's weaker banked-Energy/
  Impact package remains the strongest practical non-limited substitute when
  Hellfire is contested across simultaneous teams; Box Cutter and Precious do
  not replace that sustained resource package. The Restrained is excluded
  because its passive Daze is limited to Basic Attack while Pulchra's retained
  Core direction centers EX, Assist
  Follow-Up, Chain, Ultimate, and off-field Aftershock. Ice-Jade Teapot is
  excluded because its Basic-stack activation does not match that direction
  closely enough to beat the retained aligned packages. Support W-Engines are
  ineligible and never enter numerical comparison.
- R11. Add Box Cutter as an A-Rank non-limited Stun candidate. Pulchra can
  activate its Aftershock-conditioned Daze package. The Physical-DMG clause
  has no Pulchra Result consumer and remains complete source-owned Setup copy.
- R12. Pulchra's four-piece candidates are King of the Summit, Astral Voice,
  and Swing Jazz. Her two-piece candidates are Shockstar,
  King, and Swing; selected King additionally exposes Woodpecker as the current
  CRIT-threshold pressure choice. King is the squad CRIT-threshold package,
  Astral is the stronger controllable Focus-entrant direction whose two
  reachable stacks already supply 16%, and Swing combines a reachable Chain/Ultimate squad-DMG
  clause with Energy Regen. Proto Punk is excluded holder-locally: its
  Shield Effect supplies no positive axis, its Assist-triggered squad DMG is
  no stronger than Swing's corresponding party effect, and it gives up Swing's
  resource value while depending on an enemy-first Assist opportunity. A legal
  Assist trigger alone does not preserve a materially weaker same-axis package.
  Shockstar remains a useful Impact two-piece, but its Basic/Dash/Dodge Daze
  misses Pulchra's defining off-field EX/Assist/Chain/Ultimate direction and
  therefore does not remain a competitive four-piece.
  Moonlight Lullaby is not a Pulchra candidate because its holder activation
  requires Support Specialty.
- R13. Both pools locally prepare King 4-piece plus Shockstar 2-piece with CRIT
  Rate / Physical DMG / Impact mains and zero CRIT hits. At default M6 the
  fixed CRIT basis is `5 + 10 M1 + 24 main = 39%`; five CRIT hits reach 51% and
  make King's second squad clause a finite future opportunity. Zero supplied
  hits preserve the first King clause rather than proving the threshold is
  unreachable. When Pulchra yields King through established allocation, prepare
  Astral 4-piece plus King 2-piece, ATK / Physical DMG / Impact mains, and no
  CRIT input.

### Current Agent and equipment projection

- R14. Orphie's completed Core supplies self CRIT Rate +25%, self Aftershock
  DMG +85%, and Zeroed In squad ATK. Zeroed In starts at +280 ATK and gains
  +20 ATK per 0.1 Initial Energy Regen above 1.6, evaluated continuously and
  capped at +700.
  Calculate that deterministic threshold from the selected setup's Initial
  Energy Regen; do not simulate Energy cadence or optimize Disc rolls. The
  all-party recipient and cap gauge reuse Astra, Soukaku, Lucy, and Pan Yinhu
  provider boundaries, while the Energy-derived input is Orphie's local rule.
- R15. Orphie's Additional activates with another Stun or Support Agent and
  makes Zeroed In recipients' Aftershock DMG ignore 25% DEF. It is an all-party
  Aftershock action effect, not broad pre-PEN candidate pressure. Her retained
  Core Aftershock classification allows Shadow, Bellicose, and Pulchra's
  provider effect to meet the same tag without collapsing exact actions.
- R16. Orphie Mindscapes apply cumulatively: M1 supplies self Fire RES Ignore
  15% to Special Attack, EX Special, Chain Attack, and Ultimate plus all-party
  Zeroed In DMG +20%; M2 supplies self ATK +20% after Ultimate; M4 supplies
  Heat Charge and Ultimate DMG +40%. M1 duration, M2 Decibel behavior, and M6
  extra attack damage/cadence create no normalized Result. M3/M5 skill tiers
  remain excluded.
- R17. Orphie's selected equipment projects only through exact consumers.
  Bellicose supplies broad CRIT and Initial Energy Regen plus Fire Aftershock
  DEF Ignore; Heartstring supplies broad CRIT DMG and Fire Chain/Ultimate RES
  Ignore; Serpentine supplies Initial Energy Regen and broad CRIT while its
  Electric DEF Ignore remains unused; Sol supplies broad ATK and CRIT while its
  Ether clause is unused; Gilded supplies broad ATK and EX-Special DMG.
  Whole-package candidate choice remains separate from these exact Result
  rows.
- R18. Pulchra's completed Core supplies Daze +30% to EX Special, Assist
  Follow-Up, Chain Attack, and Ultimate while Hunter's Gait is active. Her
  Additional activates with another Attack or Rupture Agent or same-faction
  Agent. At M0-M5 it supplies all-party Aftershock DMG +30% against Binding
  Trap targets; default M6 broadens that same provider to all damage. M1 adds
  self CRIT Rate +10% against trapped targets only as the retained King
  threshold basis. M2 personal ATK, M4 Energy-cost behavior, and M6 repeated
  raw damage do not strengthen her Daze/buffer direction and create no
  normalized Result; M3/M5 skill tiers remain excluded.
- R19. Pulchra's selected equipment preserves exact projection. Blazing adds
  Impact while its unused repeated-Basic Fire/Ice squad CRIT-DMG clause remains
  visible only in the complete Setup package; Box's Daze projects while its
  personal Physical DMG remains Setup package copy; Swing applies broad squad formula-compatible DMG once and
  supplies its Energy 2-piece; Astral applies entrant DMG once to Focus; King applies its non-stacking squad
  CRIT DMG once. Candidate membership, local representative, holder allocation,
  and recipient projection remain separate decisions.

### Candidate lifecycle, allocation, and visible experience

- R20. Selecting King adds CRIT Rate to Pulchra Slot 4 and effective substats.
  Selecting another 4-piece clears an invalid selected CRIT main and its count
  without fallback. Reselecting King restores candidate membership with ATK
  retained only when still legal and CRIT count initialized to zero; it does not
  restore earlier selections. Lycaon and Lighter are the same selected-pressure
  mechanism; a party-qualified Trigger is the contrast whose independent CRIT
  consumer remains present away from King. Pulchra M1 alone does not create a
  damage-dealer CRIT direction, matching Ju Fufu's local buff relationship
  rather than qualified Trigger.
- R21. Party preparation applies the permanent non-stacking holder order rather
  than duplicating King. Dialyn or Trigger keeps King and Pulchra prepares
  Astral plus King 2-piece. Against Lycaon, Pulchra keeps King because her fixed
  39% basis reaches the threshold with five future hits while Lycaon's 29%
  basis needs nine; Lycaon prepares Astral plus King 2-piece. Lighter already
  retains his authored Astral alternative beside Pulchra's King. Ju Fufu cannot
  prepare Astral 4-piece, so he keeps King and Pulchra takes Astral. These are
  bounded deterministic first choices, not a universal Stun priority table;
  slot order does not change them.
- R22. Orphie's Swing/Moonlight and Hormone/Astral 2-piece identities follow
  current same-effect compression and direct-edit lifecycle: exact identity is
  exposed when the paired set occupies 4-piece, otherwise the canonical member
  represents the equal effect. Pulchra's selected 4-piece never makes an
  ineligible Moonlight package legal.
- R23. The two Agents use existing compact/expanded Setup surfaces, rank and
  faction marks, accessible selected/candidate equipment descriptions, source
  breakdowns, action hierarchy, threshold gauges, and Result omission rules.
  Portraits require original-asset inspection and Agent-specific fixed-scale,
  head-top, then face-X calibration without changing shared responsive frame
  geometry.

## Acceptance examples

- AE1. Applying Anby: Soldier 0 + Orphie & Magus + Pulchra in full pool
  initializes M0/M0/M6 and prepares Orphie with Bellicose/Shadow/Swing and
  CRIT DMG/Fire/Energy, and Pulchra with Blazing/King/Shockstar and
  CRIT Rate/Physical/Impact. Every offered effective-substat count starts at
  zero and all three Results are complete.
- AE2. Orphie's full representative reaches Zeroed In's ATK cap. The
  non-limited Sol/Shadow/Swing package remains below it through the same
  continuous relation and prepares CRIT DMG from Sol's fixed CRIT supply. Direct pool
  change rebuilds only Orphie.
- AE3. Orphie's Result exposes self Aftershock DMG +85%; qualified all-party
  Aftershock DEF Ignore +25%; Bellicose Fire Aftershock DEF Ignore; and the
  separate Heartstring or Gilded action rows only when selected. Neither
  qualified DEF Ignore becomes broad candidate pressure, and Serpentine's
  Electric clause creates no Fire row.
- AE4. At M1 Orphie exposes four-action Fire RES Ignore and broad Zeroed In DMG;
  at M2 she adds ATK; at M4 she adds Heat Charge/Ultimate DMG. M6 does not add a
  raw-damage operation or a fabricated coefficient total.
- AE5. Pulchra's local prepared King begins below its threshold at default M6
  and reaches it at five hits. Selecting Astral clears CRIT main/count and
  exposes the Focus entrant effect without a party-wide duplicate. Reselecting
  King restores the candidate
  at zero and never restores the prior count.
- AE6. Pulchra Result keeps Core Daze on EX/Assist Follow-Up/Chain/Ultimate;
  Box Cutter Daze Fully Enabled while its Physical DMG remains Setup copy; and
  default-M6 Additional as
  broad all-party DMG. Setting M5 changes the Additional to Aftershock-only
  without changing another Agent's prepared setup.
- AE7. Applying Corin + Dialyn + Pulchra or Anby: Soldier 0 + Trigger +
  Pulchra is permutation-independent: the retained Stun holder keeps King and
  Pulchra prepares Astral/King with ATK/Physical/Impact. Hugo + Lycaon + Pulchra
  keeps Pulchra on King and moves Lycaon to Astral/King; Hugo + Ju Fufu +
  Pulchra keeps Ju Fufu on King and moves Pulchra to Astral/King. Applying Anby
  + Orphie + Pulchra keeps Pulchra's local King. Astral entrant DMG projects
  once to Focus and King squad CRIT projects once.
- AE8. If any required equipment or main selection is absent, all three Result
  surfaces are empty while the relevant candidate deck remains actionable.
  Repair restores Result without hidden fallback. Selected and candidate
  Gilded, Box, Astral, and Swing descriptions match their compressed exact
  facts.
- AE9. One browser journey at `127.0.0.1:5173` verifies both portraits/ranks,
  full/non-limited preparation, Pulchra King pressure/reselection, selected and
  candidate equipment descriptions, exact Result action rows, and desktop plus
  narrow expanded/compact portrait states.

## Success criteria

- Both Agents extend the established setup-to-Result loop without introducing
  new formula families or hidden runtime optimization.
- Full and non-limited W-Engine choices are authored independently from complete
  usable/unused packages and zero-substat opportunity cost.
- Aftershock equipment, Agent relationships, and exact actions compose without
  turning one tag into broad candidate pressure or an action catalogue.
- Pulchra extends selected-King pressure and current King/Astral allocation
  while preserving Trigger's independent-CRIT contrast and stopping before an
  unsupported general holder priority.
- Every retained source changes a current candidate, representative, setup,
  calculation, Result, threshold, operation, or source disclosure.

## Scope boundaries

- No entity first introduced after Version 2.8, historical ruleset, evidence
  record, guide payload, or external URL.
- No Anomaly Result, resource or rotation simulation, raw/final damage, raw/final
  Daze, trap uptime, Energy cadence, shield Result, or enemy-specific simulator.
- No universal equipment scorer, Aftershock registry, party priority table,
  action catalogue, compatibility matrix, candidate registry, or named-Agent
  preparation framework.
- No automatic direct-edit repair, history restoration, or cross-Agent rebuild
  after a target-only Mindscape or pool change.
- No generalization of Proto from its Assist trigger, Blazing's Wilt clause from
  Pulchra's candidate admission, or Pulchra's King pressure to a Stun Agent
  with an independent CRIT consumer.

## Dependencies / assumptions

- The five permanent Markdown authorities own product behavior, source
  retention, formula meaning, vocabulary, and visual behavior.
- Existing Bellicose, Heartstring, Severed, Cordis, Sol, Marcato, Blazing, Hellfire,
  Steam, Precious, Shadow, King, Astral, Shockstar, Swing, Moonlight, Inferno,
  Woodpecker, Branch & Blade, Hormone, and same-effect meanings remain current.
- Existing typed NEDF qualification, formula/action applicability, capped
  provider, controllable Astral recipient, non-stacking effects, selected-input
  lifecycle, zero-substat preparation, and incomplete Result behavior remain in
  force.
- External research used to settle these requirements is ephemeral. No source
  receipt or copied guide prose becomes repository content.
