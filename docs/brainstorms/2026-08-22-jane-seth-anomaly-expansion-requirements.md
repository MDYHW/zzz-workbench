---
date: 2026-08-22
topic: jane-seth-anomaly-expansion
status: ready-for-plan
---

# Jane Doe And Seth Lowell Bounded Anomaly Expansion Requirements

## Summary

Add Jane Doe and Seth Lowell as the next bounded Anomaly cohort. Jane is a
Focus-eligible Physical Anomaly damage contributor. Seth is a non-Focus
Electric Defense buffer whose short entries hand AP to himself and the Focus
Agent and whose qualified enemy effect supports anomaly buildup. Reuse the
current setup, equipment, delivery, action, lifecycle, and Result mechanisms.
The only new calculation stage is Jane's acyclic post-delivery AP derivation.

The permanent owners are `SF-001`-`SF-004`, `GV-001`-`GV-003` and
`GV-005`-`GV-009`, `FM-001`-`FM-003` and `FM-006`-`FM-011`,
`SW-002`-`SW-016`, and `UI-002`-`UI-004`. This requirement settles only the
bounded Jane/Seth outcomes below; it does not restate those common policies.

## Requirements

### Jane identity, direction, and retained relationships

- R1. Add Jane after Burnice as S-Rank Physical Anomaly, Criminal Investigation
  Special Response Team, M0 by default, and Focus-eligible. Her completed
  level-60/full-Core/full-Potential values are ATK 880, AP 114, and AM 148.
  Her authored direction supports `anomaly_damage` and `anomaly_buildup`; it
  does not add a general-damage direction or a direction selector. Jane's
  primary operating interval is on-field. A supportive interval can maintain
  Gnawed and enter for Assist/Dodge actions, but it does not produce a distinct
  competitive setup with the current consumers.
- R2. Jane's completed Core makes Assault against a Gnawed target CRIT-capable.
  Fully Enabled Jane AP produces Assault CRIT Rate
  `min(40 + 0.16 * AP, 100)%`; the Core supplies 50% Assault CRIT DMG. Deliver
  that provider to compatible Physical `anomaly_damage` recipients and the
  Assault action only. It creates an Assault action row and CRIT cap gauge, not
  general anomaly CRIT, CRIT equipment policy, or a final damage result.
- R3. Jane's completed Potential has a separate current consumer: when Jane
  triggers Assault, that instance receives another 30% CRIT DMG. Keep this as
  a Jane-local Potential source on Assault. Do not deliver it to another
  Physical anomaly recipient and do not merge it into the Core's all-party
  50% provider. Potential changes to Basic, Dash, Perfect Dodge, Passion, and
  EX action routing are retained only as authoring interpretation needed to
  confirm Jane's on-field interval and Sharpened Stinger activation; they add
  no independent Result row or general action catalogue.
- R4. Passion reads Jane's completed Fully Enabled AP and adds
  `min(max(AP - 120, 0) * 2, 600)` ATK. Recompose Jane's own ATK after ordinary
  provider delivery, expose the AP basis and cap gauge, and never feed the
  derived ATK back into AP. Jane's qualified Additional Ability is active with
  another Anomaly or same-faction teammate and supplies Physical buildup +20%,
  plus another +15% against an anomalied target. Retain the reachable +35%
  maximum without a status-history or uptime model.
- R5. Retain only Mindscape outcomes with a current consumer. M1 adds Passion
  buildup +15% and derives Passion DMG Bonus `min(0.1 * AP, 30)%`. M2 adds
  Assault DEF Ignore +15% and another 50% Assault CRIT DMG to its compatible
  scope. M4 supplies all party members Attribute Anomaly DMG +18% after the
  reachable Assault/Disorder trigger; it does not modify Disorder. M3/M5 skill
  levels, M6 ordinary Passion CRIT, and M6's 1600%-AP extra hit have no current
  qualifying consumer.

### Jane candidates and prepared setup

- R6. Jane's full W-Engine candidates are Practiced Perfection W1, Sharpened
  Stinger W1, Fusion Compiler W1, Electro-Lip Gloss W5, and Weeping Gemini W5.
  The non-limited candidates are Fusion, Electro, and Weeping. Prepare
  Practiced in full and Weeping in non-limited.
  - Practiced is the complete Physical package. Its AM overlaps Slot 6, but its
    ATK does not displace Jane's prepared AP/PEN/AM mains; this is the decisive
    advantage over the other legal partial AM/buildup packages. The ATK still
    overlaps finite ATK-substat and alternative-main opportunity and is not a
    unique formula axis.
  - Sharpened's AP, Physical-damage, and Physical-buildup package is fully
    compatible with Jane's operating interval. It remains the nearest complete
    same-axis comparator and a distinct buildup direction.
  - Fusion supplies PEN/ATK/AP; Electro supplies AP/ATK/broad damage; Weeping
    supplies ATK/AP. These remain materially different accessible packages.
    With prepared Slot 4 AP, the selected Weeping fact crosses Jane's
    Assault-CRIT threshold.
  - Timeweaver is legally selectable and arithmetically positive but rejected:
    its ATK is usable, its AP repeats Slot 4/future AP, its Disorder threshold
    repeats an admitted damage direction, and its Electric buildup is unusable.
    Practiced and Sharp cover its usable directions with complete Physical
    packages. Angel in the Shell and Flight of Fancy also strengthen AM/AP or
    buildup, but lose primarily because their usable packages lack Practiced's
    non-main ATK contribution and strand their Attribute clauses. Roaring Ride
    does not cover Jane's defining interval; the remaining partial, CRIT, Ice,
    or accessible AP-only packages are dominated by the admitted comparators.
- R7. Jane's 4-piece candidates are Fanged Metal and Freedom Blues. Prepare
  Fanged because Physical 2-piece plus Assault-target DMG form the complete
  defining package. Freedom is the distinct Physical buildup-RES Setup choice;
  its corrected Attribute-scoped Result projection remains deferred. The
  independent 2-piece directions are Puffer Electro (PEN), Phaethon's Melody
  (AM), Freedom Blues/Chaos Jazz (AP), Fanged Metal/White Water Ballad
  (Physical), and Hormone Punk/Astral Voice (ATK). Prepare Puffer.
- R8. Jane's main-stat candidates are AP or ATK% in Slot 4; PEN Ratio,
  Physical DMG, or ATK% in Slot 5; and AM or ATK% in Slot 6. Prepare
  AP/PEN/AM in both pools. Effective substats are AP and ATK%, initialized at
  zero. Broad pre-PEN pressure removes Puffer and Slot 5 PEN. Authorized party
  or Jane target preparation chooses Freedom 2-piece/Physical DMG under that
  pressure; a direct edit only clears an invalid selected Puffer or PEN without
  fallback and leaves Result empty until the user reselects.

### Seth identity, direction, and retained relationships

- R9. Add Seth as A-Rank Electric Defense, Criminal Investigation Special
  Response Team, M6 by default, and not Focus-eligible. Seth has no Potential
  Awakening. His completed level-60/full-Core values are ATK 643, AP 90,
  AM 86, Impact 94, and Base Energy Regen 1.56. His authored role is buffer
  only. His own buildup and action Daze have visible consumers but do not make
  personal damage or Daze an intentionally strengthened setup role.
- R10. Seth's EX/Assist route grants Shield of Firm Resolve to Seth and hands
  the same state through Quick Assist to the steerable previous teammate,
  compressed by the workbench to Focus. While present, it grants AP +100 to
  Seth and Focus. Holder and trigger performer remain Seth; shield amount,
  duration, Shield Effect, HP, and DEF remain invisible and cannot admit setup
  investment. Seth therefore reaches AP 190 in his own Fully Enabled row.
- R11. Seth's Additional Ability is active with another Electric or same-
  faction Agent. Its qualified Chain/Electrified-Basic route lowers enemy
  all-Attribute Anomaly Buildup RES by 20% for every compatible
  `anomaly_buildup` recipient. M1 changes only survival/persistence and adds no
  numeric Result. M2 adds Electric buildup +35% to Electrified Basic. M4 adds
  Daze +25% to Defensive Assist. M6's guaranteed-CRIT 500%-ATK extra hit and
  M3/M5 ordinary skill levels have no current retained output.

### Seth candidates and prepared setup

- R12. Seth's full W-Engine candidates are Peacekeeper - Specialized W5,
  Tusks of Fury W1, and Spring Embrace W5. Non-limited keeps Peacekeeper and
  Spring. Prepare Peacekeeper in both pools.
  - Peacekeeper's Energy and EX/Assist buildup are active in Seth's actual
    interval and support repeated buffer access without establishing his role.
    Its personal ATK is unused supply.
  - Tusks supplies a distinct limited recipient-facing damage/Daze package.
    Personal Impact and shield strength do not strengthen Seth's direction.
  - Spring supplies a distinct accessible next-holder Energy-transfer
    operation. Its ATK and incoming-damage reduction do not strengthen the
    role, and cadence prevents a numeric Result operation.
  - Tremor, Big Cylinder, Original Transmorpher, Half-Sugar Bunny, and
    off-Specialty chassis leave only weaker, personal, survival, cadence-bound,
    or inactive remnants after comparison with those three packages.
- R13. Seth's 4-piece candidates are Astral Voice, Swing Jazz, and Freedom
  Blues. Prepare Astral: Seth's repeated Quick Assist can reach the Focus DMG
  package. Swing is the distinct Energy plus reachable party-DMG package.
  Freedom remains a selected Setup candidate only; its corrected Result behavior
  is deferred. Seth's only competitive 2-piece axis is Energy Regen through
  Swing Jazz or Moonlight Lullaby. Prepare Astral/Swing; the authored collision
  alternative is Swing/Moonlight. Do not admit personal AP, AM, ATK, Electric,
  Impact, or Daze sets by numerical positivity alone.
- R14. Under the residual variable-main-stat exception, Seth offers AP or ATK%
  in Slot 4 and Electric DMG or ATK% in Slot 5. Slot 6 offers Energy Regen only.
  Prepare AP/Electric/Energy Regen. Seth offers no effective substats. These
  residual choices do not create personal W-Engine, Disc, Mindscape, damage,
  Daze, or Result policy.

### Shared composition, lifecycle, and visible boundary

- R15. Reuse retained source definitions and selected source instances. Add one
  Jane profile and one Seth provider-defense profile; do not add an Agent
  calculation branch. Ordinary equipment and provider delivery run first.
  One derived pass then reads Jane's completed AP once, creates Passion ATK and
  the Core Assault-CRIT provider, delivers that provider once, and performs
  final composition. Jane's fixed Potential action modifier is not another
  derived pass. No result feeds back into AP and no generic dependency graph,
  cycle solver, or second derived-delivery pass is admitted.
- R16. Add Seth to the existing repeated-Quick-Assist party predicate and give
  him the existing Astral collision alternative metadata. During Party Apply,
  all three representatives are prepared together, so a metadata-flexible
  Astral holder may yield to rigid contextual Cissia before the exclusive
  Astral/Moonlight allocations finish. During pool/Mindscape target rebuild,
  the other two holder snapshots are established and cannot be moved; any
  established Astral holder blocks contextual Cissia from taking Astral. This
  uses the existing alternative metadata predicate rather than a hard-coded
  Agent list.
- R17. Party Apply rebuilds all three setups. Pool or Mindscape rebuild prepares
  only the target against the other two established snapshots. Prepared
  pressure patches run before zero effective-substat initialization; shared
  reconciliation then clears invalid selections without fallback and
  completeness gates Result. Direct equipment/main edits run no preparation:
  they preserve still-effective counts, add newly effective counts at zero,
  remove no-longer-effective identities, reconcile once, and do not restore
  edit history when pressure later disappears.
- R18. Result exposes Jane/Seth's admitted stats, numeric source breakdowns,
  Jane's AP-derived ATK and Assault CRIT gauge/action, Seth's AP delivery,
  qualified enemy buildup RES, and only action-level values that differ.
  Selected sources keep their current hover/focus destination. Spring and
  deferred Freedom remain accessible Setup descriptions without invented Result
  destinations. Exclude final Assault/Shock/Disorder damage, buildup share,
  application history, rotation, Passion/Resolve meters, shield amount/duration,
  healing, and raw extra-hit coefficients. Any incomplete required selection
  keeps the entire Result empty.
- R19. Use Jane and Seth's original roster portraits. Calibration remains an
  implementation unit: inspect each original and verify one shared
  `scale/headTopY/faceX` triple across desktop/narrow and expanded/compact Party
  and Result destinations in the in-app Browser. DOM wiring alone is not visual
  acceptance.

## Acceptance Examples

- AE1. With prepared Jane and Focus-directed Seth, Jane receives Seth's AP and
  recomposes Passion and the Assault gauge from the completed AP result.
  Jane-triggered Assault also receives the separate Potential +30% CRIT DMG. A compatible
  Physical anomaly teammate receives only the Core provider, not Potential;
  Electric Seth receives neither Assault provider. No shield or final-damage
  row appears.
- AE2. With Seth/Piper/Burnice and Piper as Focus, Seth's Additional Ability is
  inactive without an Electric or same-faction teammate. Core AP still reaches
  Seth and Piper, while the enemy buildup-RES contribution disappears. Existing
  Piper/Burnice local effects remain unchanged.
- AE3. Jane full prepares Practiced/Fanged/Puffer/AP/PEN/AM. Non-limited
  prepares Weeping/Fanged/Puffer/AP/PEN/AM and derives Weeping's AP Result
  contribution from the selected shared fact. Broad pre-PEN pressure prepares
  Freedom/Physical instead. Directly adding that pressure clears selected
  Puffer/PEN without fallback; removing it restores membership but not the
  cleared selection.
- AE4. Given Jane/Seth/Cissia on Party Apply, Seth's repeated Quick Assist admits
  contextual Cissia Astral. Cissia keeps the rigid Astral package and flexible
  Seth moves to Swing/Moonlight. Without a repeated-Quick-Assist holder, Cissia
  keeps Dawn's Bloom and Seth keeps Astral.
- AE5. If Astra already holds Astral and only Cissia's pool is rebuilt, Astra is
  not moved and Cissia prepares Dawn's Bloom. A direct duplicate edit may remain
  selected and is handled only by non-stacking Result reconciliation; a later
  target rebuild uses established holders and never restores prior edit history.
- AE6. Selecting Spring exposes its complete compressed package in Setup but no
  cadence-derived Energy Result operation. Selecting Freedom exposes Setup copy
  but no holder-local or Attribute-scoped Result until the deferred shared
  correction is separately admitted.
- AE7. Portrait metadata or DOM tests without original-asset and four-destination
  browser comparison leave the portrait unit incomplete.

## Scope Boundary

- Do not add final anomaly damage, rotation, uptime, application-share, resource,
  shield, healing, or general state simulation.
- Do not generalize Jane's Assault CRIT to ordinary anomaly output or CRIT setup
  policy, and do not infer Seth personal investment from Specialty or one
  positive action.
- Do not implement Freedom Blues Result correction in this vertical. Jane and
  Seth may expose it only as the settled Setup candidate.
- Do not include Anton, Rina, post-2.8 Agents, or a general Quick Assist/action
  catalogue.
- Do not persist raw research payloads, provenance registries, rejected-item
  catalogues, worker records, or a runtime candidate optimizer.

## Readiness

The completed source facts, Jane non-limited representative, Potential source
scope, and shared lifecycle boundary are closed. The bounded vertical is ready
for implementation planning; this document authorizes neither that plan nor
production implementation by itself.
