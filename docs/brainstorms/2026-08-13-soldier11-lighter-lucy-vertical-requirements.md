---
date: 2026-08-13
topic: soldier11-lighter-lucy-vertical
---

# Soldier 11, Lighter, And Lucy Vertical

## Summary

Admit Soldier 11, Lighter, and Lucy from the initial Version-2.8 content cohort
using their current released behavior. Soldier 11 is a Fire Attack Focus and
general-damage consumer. Lighter is a Fire Stun contributor whose current
Impact threshold produces Fire/Ice squad damage, enemy Fire/Ice RES reduction,
Stun duration, and Stun DMG Multiplier consequences. Lucy is an A-Rank Fire
Support whose Initial-ATK cap produces an all-party flat-ATK effect.

The vertical reuses current general-damage, daze, capped-buffer, enemy-context,
formula/attribute/action applicability, exact equipment identity, contextual
Puffer, King selected-pressure, completeness, rank, faction, portrait, and
pool-rebuild behavior. It adds only one current relationship seam: exact
display factions remain distinct, while a typed New Eridu Defense Force
qualification group lets the game-recognized Silver Squad and Obol Squad
relationship satisfy Soldier 11's Additional Ability without a named-party
table.

It does not add a rotation or Morale simulator, raw damage, resource cadence,
optimizer, historical-version switch, named-party catalogue, generalized
faction graph, or guide-backed evidence payload.

## Product flows

- Applying the three Agents prepares complete local setups with zero supplied
  substats and calculates Result only while every required choice is complete.
- Soldier 11 receives Fire and Stun support through current formula, attribute,
  action, enemy-context, and all-party consumers. No party clause is copied
  into her local calculation solely because this is the authored trio.
- Lighter's selected King candidate adds CRIT Rate investment pressure. Removing
  King removes the otherwise-unused CRIT substat and clears invalid selection;
  reselecting King exposes CRIT Rate again at count zero without restoring old
  history.
- Lucy's Core reads Initial ATK, shows its cap on Lucy, and gives its flat value
  to every party member once. It is not a Focus-only effect and is not derived
  from Combat ATK.
- Pool or Mindscape changes rebuild only the changed Agent. Direct edits never
  invoke hidden representative repair.

## Requirements

### Admission, direction, and party identity

- R1. Admit Soldier 11 as S-Rank, Fire, Attack, Obol Squad, Focus-eligible,
  and a primary `general_damage` contributor. Admit Lighter as S-Rank, Fire,
  Stun, Sons of Calydon, not Focus-eligible, and a primary `daze_buildup`
  contributor with no authored personal-damage direction. Admit Lucy as A-Rank,
  Fire, Support, Sons of Calydon, not Focus-eligible, and a buffer. The generic
  rank mechanism initializes Soldier 11 and Lighter at M0 and Lucy at M6.
- R2. Retain current level-60 values: Soldier 11 ATK 888, CRIT Rate 19.4%,
  CRIT DMG 50%, and Energy Regen 1.2; Lighter ATK 797, CRIT Rate 5%, CRIT DMG
  50%, Impact 137, and Energy Regen 1.2; Lucy ATK 658, CRIT Rate 5%, CRIT DMG
  50%, and Energy Regen 1.56. Other facts remain absent without a current
  Setup, formula, threshold, action, or Result consumer.
- R3. Retain exact faction identity separately from teammate qualification.
  Soldier 0 belongs to Defense Force - Silver Squad, while Soldier 11, Trigger,
  and Seed belong to Obol Squad. All four share the typed New Eridu Defense
  Force qualification group for current game-recognized teammate conditions.
  This is not a named Agent rule and does not make their display factions equal.
  Generic exact-faction equality remains unchanged; a teammate condition
  consults the NEDF group only when that exact source condition admits it.
  Existing faction-only consumers are a preserved contrast. Lighter and Lucy
  qualify each other through their exact Sons of Calydon faction.
- R4. Soldier 11 uses ATK, CRIT Rate, CRIT DMG, Fire DMG, and PEN Ratio through
  general damage; effective substats are CRIT Rate, CRIT DMG, and ATK%. Lighter
  uses Impact and Daze, with no base effective substat. King selection adds only
  CRIT Rate at count zero because it creates the current 50% threshold consumer.
  Lucy uses ATK and Energy Regen and has no effective substat in the authored
  competitive packages because every current candidate representative already
  reaches her highest Core requirement at zero supplied substats.

### Soldier 11 equipment authoring

- R5. Soldier 11's full W-Engine candidates are Heartstring Nocturne, Cordis
  Germina, Myriad Eclipse, Severed Innocence, The Brimstone, and Starlight
  Engine. Non-limited candidates are The Brimstone and Starlight Engine. Full
  prepares Heartstring W1; non-limited prepares The Brimstone W1.
- R6. Heartstring's complete high-Base-ATK, advanced CRIT Rate, CRIT DMG, and
  Chain/Ultimate Fire RES Ignore package is usable by Soldier 11 and establishes
  the full first choice. Myriad is the closest usable same-axis competitor:
  the same Base/advanced-CRIT chassis supplies CRIT DMG and broad DEF Ignore
  instead of Heartstring's larger CRIT DMG and Chain/Ultimate Fire RES Ignore,
  so every clause is usable but exact bypass scope remains material. Cordis is
  the partial-package contrast: its CRIT clauses and Basic/Ultimate DEF Ignore
  remain useful while Electric-only damage is unused. Severed and Brimstone
  preserve other competitive CRIT or broadly usable ATK packages. Starlight is
  the accessible A-Rank contrast. Steel
  Cushion is excluded because its Physical clause is unusable and the remaining
  behind-hit clause does not survive the complete-package comparison.
- R7. Soldier 11's base 4-piece candidates are Woodpecker Electro and Dawn's
  Bloom. Dialyn adds Puffer Electro contextually through the established
  repeated-Ultimate opportunity. Her 2-piece candidates are Inferno Metal,
  Woodpecker Electro, Branch & Blade Song, Dawn's Bloom, Puffer Electro,
  Hormone Punk, and Astral Voice, subject to the same-effect identity lifecycle.
- R8. Both pools prepare Woodpecker 4-piece plus Puffer 2-piece with CRIT Rate /
  PEN Ratio / ATK% mains and zero substats. The fixed CRIT/ATK actions and PEN
  access remain balanced before future substat investment; non-limited does not
  invent a different Disc package merely to compensate for Brimstone's ATK.

### Lighter equipment authoring

- R9. Lighter's full W-Engine candidates are Blazing Laurel, Ice-Jade Teapot,
  Hellfire Gears, Steam Oven, The Restrained, and Precious Fossilized Core.
  Non-limited candidates are Hellfire Gears, Steam Oven, The Restrained, and
  Precious Fossilized Core. Full prepares Blazing Laurel W1 and non-limited
  prepares Hellfire Gears W1.
- R10. Blazing Laurel's holder-compatible high-Base-ATK, advanced Impact,
  assist-enabled Combat Impact, and Fire/Ice squad CRIT DMG package is fully
  usable and establishes the full first choice. Ice-Jade is the closest full
  same-axis competitor: it can reach a similar Elation step and provides squad
  DMG rather than Fire/Ice CRIT DMG, so exact identity remains material.
  Hellfire is the non-limited first choice because its advanced and Combat
  Impact plus Energy package advances more of Lighter's current direction than
  Steam's lower-rank Energy/Impact package. Restrained and Precious retain
  direct Basic-Daze and accessible threshold-Daze contrasts.
- R11. Lighter's 4-piece candidates are King of the Summit, Astral Voice, and
  Shockstar Disco. Astral is a usable Quick-Assist party package and is the
  local first choice when King has no independent CRIT investment support.
  Shockstar remains the direct Basic/Dash/Dodge-Counter Daze alternative and
  becomes the fallback only after the other party packages are unsuitable or
  the holder has sufficient field time. King remains a selected candidate, not
  a prepared first choice: base 5% + Slot 4 CRIT 24% + Woodpecker 2-piece 8%
  reaches only 37% at zero substats, below its 50% threshold.
- R12. Lighter's base 2-piece candidates are Shockstar Disco, King of the Summit,
  and Swing Jazz. Both pools prepare Astral 4-piece plus Shockstar 2-piece with
  ATK% / Fire DMG / Impact mains and no substats. Residual ATK/Fire mains do not
  create a personal general-damage Result; they complete the finite package
  after the Impact and party-value choices are settled.
- R13. If another prepared priority holder already uses King, Lighter remains
  on Astral. If a user directly selects King, candidate pressure adds CRIT Rate
  first at count zero and exposes the Slot 4 CRIT path and Woodpecker 2-piece.
  Removing King clears those invalid selections without fallback. Reselecting
  King exposes them again at zero; it does not restore prior counts. Trigger is
  the preserved contrast because her independent Aftershock/CRIT relationship
  retains CRIT Rate when King is absent.

### Lucy equipment authoring

- R14. Lucy's full W-Engine candidates are Elegant Vanity, Weeping Cradle, and
  Kaboom the Cannon. Non-limited candidates are Weeping Cradle and Kaboom.
  Both pools prepare Kaboom W5. Kaboom's ordinary Bangboo-inclusive four-unit
  stack is treated as reachable without adding Bangboo as an independent input.
  Its Energy Regen and all-party ATK package is fully usable and reaches Lucy's
  Core cap. Elegant is the closest full same-recipient competitor: its higher
  Base/advanced ATK is surplus after the cap, while its Energy and squad DMG
  remain a legal alternative. Weeping retains off-field Energy and squad DMG
  while its advanced PEN remains outside Lucy's direction. Bashful Demon is
  excluded after the nearest non-limited same-axis comparison: its surplus
  advanced/personal ATK and weaker squad ATK do not beat Kaboom's stronger
  squad ATK plus Energy axis after both packages reach Lucy's Core cap.
- R15. Lucy's 4-piece candidates are Moonlight Lullaby and Astral Voice. Her
  Support actions satisfy Moonlight; her EX-driven teammate entry makes Astral
  a current one-recipient option without changing its canonical Focus
  projection. Her 2-piece candidates are Swing Jazz, Moonlight Lullaby,
  Hormone Punk, and Astral Voice under the same-effect lifecycle.
- R16. Both Lucy pools prepare Moonlight 4-piece plus Astral Voice 2-piece with
  ATK% / ATK% / Energy Regen mains and zero substats. Kaboom W5 produces
  Initial ATK 2,495.4, above even M0-M2's highest 2,265.5 requirement, so the
  prepared package spends Slot 6 on Energy Regen. Astral is the exposed ATK
  2-piece because Astral is also a current 4-piece candidate; the shared
  same-effect lifecycle is not bypassed with a hidden Hormone selection.

### Current Agent and equipment projection

- R17. Soldier 11's completed Core adds Basic/Dash Fire Suppression DMG +70%.
  Her Additional activates with another Fire Agent or a game-recognized NEDF
  relationship, adds Fire DMG +10%, and adds another +22.5% against Stunned
  enemies. Completed Potential adds CRIT DMG +48%. Expanded Basic coefficients
  remain outside the normalized Result.
- R18. Soldier 11 Mindscapes apply cumulatively: M2 supplies Basic, Dash, and
  Dodge Counter DMG +36% at full stacks; M6 supplies Fire RES Ignore +25% to
  Fire Suppression after Charge. M1 event Energy, M4 survival, and M3/M5 skill
  tiers create no normalized Result row. Selected equipment clauses retain
  exact attribute, action, enemy, and condition scopes; broad pre-PEN pressure
  uses the shared Slot 5 lifecycle.
- R19. Lighter's completed Core at full Morale creates one Quick Assist
  operation, supplies Combat Impact +20% during empowered Basic 5, reduces
  enemy Fire/Ice RES by 15%, and extends the current Stun by 3 seconds once.
  Additional activates with another Attack or same-Faction Agent. Twenty
  Elation stacks provide 25% Fire/Ice DMG at 170 Impact, add 5 percentage
  points per completed 10 Impact above 170, and cap at 75% at 270 Impact.
  The gauge reads Fully Enabled Impact because both Core and selected-engine
  Combat Impact change the current output.
- R20. Lighter M1 changes Collapse's Stun-duration extension from 3 seconds to
  5 seconds and adds another 10% Fire/Ice RES reduction. M2 supplies Stun DMG
  Multiplier +25% and multiplies
  Elation output by 1.2. M4 event Energy and M6 personal damage create no
  normalized Result. Blazing's Fire/Ice CRIT DMG, Ice-Jade's squad DMG,
  engine/Disc Daze, Astral's one-recipient entry effect, and King's threshold
  project only through their existing exact recipients and operations.
- R21. Lucy's completed Core calculates all-party flat ATK as
  `min(Initial ATK * ratio + base, 600)`, using 22.6% + 88 at M0-M2, 24.2% + 96
  at M3-M4, and 25.8% + 104 at M5-M6. Lucy receives the ordinary all-party
  clause once alongside her teammates. The gauge remains on Lucy's Initial ATK
  and does not feed the delivered Combat value back into the calculation.
- R22. Lucy M4 adds all-party CRIT DMG +10% while Cheer On is active. Her
  Additional Ability only changes boar inheritance of Lucy's CRIT stats; it
  does not create a current buffer-direction CRIT Result, setup axis, or
  candidate. M1 event Energy, M2 activation timing, M6 raw boar damage, and
  M3/M5 skill tiers create no separate normalized Result.
- R22a. Kaboom's established same-name non-stacking identity applies across
  Lucy, Soukaku, Astra Yao, and any later exact holder. Equal active origins
  remain visible in the breakdown, but the party receives only the highest
  current Kaboom value once. This is equipment identity, not holder precedence.

### Lifecycle and visible experience

- R23. Party or Focus Apply prepares all three slots. Pool or Mindscape changes
  prepare only the changed Agent. Direct edits preserve unrelated selections.
  Candidate reconciliation clears invalid selections without fallback and
  never restores old history. Result remains empty until repair.
- R24. The three Agents use existing compact/expanded Setup surfaces, typed
  rank/faction identity, accessible candidate descriptions, source breakdowns,
  gauges, operations, action hierarchy, and Result omission rules. Portraits
  require original-asset inspection and Agent-specific face/head/optical-scale
  calibration without changing shared frame geometry.

## Acceptance examples

- AE1. Applying Soldier 11 + Lighter + Lucy initializes M0/M0/M6 and prepares
  Heartstring/Woodpecker/Puffer, Blazing/Astral/Shockstar, and
  Kaboom/Moonlight/Astral in full pool, with every effective substat at zero.
- AE2. Soldier 11's Additional is active with Fire Lighter, Obol Trigger, and
  Silver Squad Soldier 0 through their correct relationships, and inactive
  with a non-Fire Agent outside the NEDF group. Display faction is not rewritten
  to force qualification.
- AE3. Lighter's full representative shows its exact Fully Enabled Impact and
  the corresponding Elation step, plus Fire/Ice RES reduction, one Quick Assist,
  and Stun duration. M1 changes the extension from 3 to 5 seconds; M1/M2 add
  only their stated RES, duration, multiplier,
  and Elation consequences.
- AE4. Selecting King for Lighter adds Slot 4 CRIT, Woodpecker 2-piece, and a
  first CRIT Rate substat at zero. Removing King clears invalid selections and
  leaves Result incomplete; repairing them completes Result. Reselecting King
  does not restore the old CRIT count.
- AE5. Lucy's prepared Initial ATK produces a capped 600 output at every
  Mindscape tier. All three Agents receive one Lucy flat-ATK clause; M4 adds
  CRIT DMG +10%. Lucy still has no personal CRIT setup or boar-damage row.
- AE5a. Lucy and Soukaku holding equal W5 Kabooms expose both equal origins but
  add squad ATK only once. Replacing one holder or changing refinement keeps the
  highest current value without changing the other holder's setup.
- AE6. Switching one Agent's pool rebuilds only that Agent: Soldier 11 prepares
  Brimstone, Lighter Hellfire, and Lucy remains Kaboom. Direct edits preserve
  unrelated selections and never become hidden first-choice fallback.
- AE7. Dialyn's contextual Puffer membership on Soldier 11 and Astral/King
  allocation reuse shared mechanisms. Tests preserve the nearest contrasting
  Agent rather than adding three isolated per-Agent suites.
- AE8. One browser journey at `127.0.0.1:5173` verifies all portraits/ranks,
  full/non-limited preparation, King pressure and repair, Lucy's gauge/delivery,
  and representative Result/action surfaces at desktop and one narrow width.
