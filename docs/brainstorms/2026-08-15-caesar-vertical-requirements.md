---
date: 2026-08-15
topic: caesar-vertical
---

# Caesar King Vertical Requirements

## Summary

Admit Caesar King through the current setup-to-Result path. Caesar is an
S-Rank Physical Defense Agent whose primary Daze direction is coupled to one
deterministic per-activation shield output, a Focus-routed ATK benefit, and the
first current enemy DMG Taken multiplier. The vertical reuses existing Impact,
Daze, shield-effect, recipient, action, equipment-package, contextual-candidate,
and lifecycle meanings without introducing a generic survival model.

The vertical adds one W-Engine identity, Original Transmorpher, and one Result
metric, DMG Taken. It adds no incoming-damage simulation, shield uptime or
depletion, anti-interrupt state, Assist catalogue, Energy gauge, anomaly
direction, raw damage, raw Daze, or runtime optimizer.

## Product Flows

1. Applying Caesar prepares a complete M0 setup with zero supplied substats.
   The full pool starts on Tusks of Fury; the non-limited pool starts on the
   higher-Initial-Impact Hellfire Gears chassis even though its Stun passive is
   inactive for Caesar.
2. Result makes Initial/Combat versus Fully Enabled Impact visible. W-Engine,
   Slot 6, and Shockstar 2-piece Impact increase the shield basis and Daze;
   Caesar's triggered Special/Assist Impact increase affects Fully Enabled
   Impact and Daze but never retroactively increases the shield basis.
3. Caesar's Result owns one Radiant Aegis amount. The controllable active
   bearer ATK benefit is delivered exactly once to Focus, while her qualified
   Additional Ability exposes a separate enemy DMG Taken metric on current
   general- and sheer-damage consumers.
4. Astral Voice becomes a contextual 4-piece candidate only when the applied
   party supplies the established repeated Quick Assist opportunity. Party
   Apply that removes the opportunity rebuilds all three setups and prepares
   Caesar back on Proto Punk; restoring the opportunity restores membership
   but not the prior selection.
5. Party Apply rebuilds all three setups. Pool or Mindscape changes rebuild
   only Caesar. Direct edits stay local and never rerun contextual preparation
   or holder allocation.

## Owning Rules And Contrasts

- Formula mechanics owns Initial/Combat/Fully stat regions, percentage Impact,
  Daze Bonus, DMG Taken as its own damage-formula region, and Caesar's bounded
  shield relationship. Lighter's Core Fully Enabled Impact is the closest stat-region
  contrast: it improves Daze but cannot strengthen an Initial-Impact shield.
  Ben's provider-local Core shield is the closest operation contrast: it
  justifies a deterministic shield output, not a general shield subsystem.
- The product contract owns Focus delivery, whole-package candidate and
  representative authoring, finite future investment, contextual candidates,
  and lifecycle. Pan Yinhu's Focus-delivered benefit is the closest recipient
  consumer. Proto Punk versus Bunny in Wonderland is the closest whole-package
  Disc contrast: one strengthens the shield plus squad damage, while the other
  trades an unused HP 2-piece for a larger squad damage maximum.
- The source-fact boundary admits the shield, qualified DMG Taken multiplier,
  current Impact change, M2 ATK change, and complete M6 action differences
  because each has a deterministic current consumer. It excludes shield
  depletion, one-hit protection, duration, Energy events, and M4 Assist-point
  substitution because those require runtime cadence, incoming damage, or a
  resource model. Ben's shield amount is the closest admitted relation; Spring
  Embrace's event resource is the closest omitted one.
- Game vocabulary owns Initial Stat versus Base Stat, Impact versus Daze,
  Shield Effect versus shield amount, Specialty activation, trigger action
  versus affected scope, and Defensive versus Evasive Assist. The retained
  source wording "base Impact" is canonicalized to the current Initial Impact
  surface because current setup inputs change the displayed out-of-combat
  value; it is neither Caesar's bare character Base Impact nor a Combat Impact
  buff.
- UI rules own compressed selected/candidate package copy, Result source
  disclosure, action rows, the shield operation, and portrait calibration.
  Original Transmorpher exposes both its unused HP chassis and active
  after-attacked Impact clause in Setup; Setup does not repeat rotation advice.

## Requirements

### Identity, direction, and retained facts

- R1. Admit Caesar King as S-Rank Physical Defense, Sons of Calydon, M0 by
  default, and not Focus-eligible. Her primary formula participation is
  `daze_buildup`; `general_damage` is residual only for variable main-stat and
  retained M6/action equipment projection. Her shield and squad benefits do
  not make her a damage Focus.
- R2. Retain completed ATK 711, CRIT Rate 5%, CRIT DMG 50%, and Impact 123.
  ATK supplies the residual variable-main and M6
  action consumer; Impact supplies both Daze and the Initial-Impact shield
  basis. HP and DEF remain absent because neither changes a current candidate,
  prepared choice, threshold, formula, operation, or Result.
- R3. Caesar's Additional Ability is active when another applied Agent can
  perform Defensive Assist or shares her faction. Keep this as one local
  current qualification consumer using the admitted Evasive-Assist exceptions,
  not as a new field on every Agent. When active, nearby enemies take 25% more
  DMG at Fully Enabled. This is `dmgTaken`, not `dmgBonus`, and applies to
  current `general_damage` and `sheer_damage` consumers. Caesar plus Zhu Yuan
  and Billy is the inactive contrast; replacing Billy with Anby activates the
  Defensive-Assist route, while Pulchra activates the same-faction route.

### Core and Mindscapes

- R4. Completed Core creates Radiant Aegis after the retained EX/Chain/Ultimate,
  retaliatory EX, or Assist routes. Result exposes one Caesar-owned operation:
  `(1400% × Initial Impact + 1400) × (1 + Fully Enabled Shield Effect / 100)`.
  The
  shared pool, duration, anti-interrupt behavior, depletion, one-hit limit, and
  trigger cadence remain outside the service.
- R5. While the Core shield benefit is enabled, deliver flat ATK +1000 exactly
  once to Focus. At M2+, replace that value with +1500; do not add both. The
  active-bearer wording remains a controllable single-recipient relationship,
  not a reason to duplicate the clause across all three Results.
- R6. After Caesar's Perfect Block, Retaliation, or Defensive Assist, retain
  Fully Enabled Impact +20% at M0-M2, +22% at M3-M4, and +24% at M5-M6. Initial
  and Combat Impact remain equal because the increase needs a post-entry
  trigger. The level-tier change is source-stated and affects Daze. It never
  changes Initial Impact or the Core shield operation.
- R7. Retain Ultimate Daze +100% at M0-M2, +110% at M3-M4, and +120% at M5-M6
  against a shielded enemy. M1 additionally supplies enemy All-Attribute RES
  Reduction 15% while the Core shield is active. M2 changes the delivered ATK
  as R5. M3/M5 change only the retained skill-tier values. M4's Assist-point
  and Energy substitution has no current Result or setup consumer.
- R8. At M6, EX Special: Overpowered Shield Bash and Assist Follow-Up gain
  action CRIT Rate to the 100% displayed cap and DMG Bonus +50%; using either
  also supplies Caesar CRIT Rate +30% and CRIT DMG +60% at Fully Enabled.
  Expose the separate primary-target follow-up as one source-local operation
  worth 50% of the original action DMG. Do not translate it into another 50%
  DMG Bonus or calculate raw damage.

### W-Engine authoring

- R9. Caesar's full W-Engine candidates are Tusks of Fury, Hellfire Gears,
  Demara Battery Mark II, and Original Transmorpher. Non-limited candidates are
  Hellfire, Demara, and Original. Full prepares Tusks W1; non-limited prepares
  Hellfire W1. Candidate membership and representative choice are authored
  independently per pool.
- R10. Tusks is the full-pool representative through Base ATK 713, advanced
  Initial Impact +18%, Shield Effect +30%, squad DMG +18%, and squad Daze +12%,
  the only retained package that strengthens every current Caesar direction.
  Hellfire's Base ATK 684 and advanced Initial Impact +18% remain usable while
  its Stun-only Energy/Fully-Impact passive is inactive; its higher shared
  shield/Daze chassis makes it the non-limited representative.
- R11. Demara is a partial but competitive accessibility path: Base ATK 624 and
  advanced Initial Impact +15% strengthen shield and Daze, while its Stun-only
  Electric DMG/Energy Generation passive is inactive. Its visible A-Rank
  accessibility is the material distinction from Hellfire's stronger same-axis
  S-Rank chassis; absent that accessibility consumer, Hellfire would dominate
  it. Add Original Transmorpher
  as A-Rank non-limited, Base ATK 594, advanced HP +25%, holder Max HP
  +8% / 9% / 10% / 11% / 12.5%, and after being attacked Fully Enabled Impact
  +10% / 11.5% / 13% / 14.5% / 16% from W1-W5.
  Original's HP is unused and its active Impact misses the shield basis, but
  the stronger W5 Fully Enabled Daze route remains a distinct competitive tradeoff
  against Demara's dual-axis Initial Impact.
- R12. Spring Embrace, Tremor Trigram Vessel, Big Cylinder, and other Defense
  packages are excluded because their active survival, Energy-event, or
  personal-damage clauses do not strengthen Caesar's retained shield/Daze/
  buffer direction enough to survive the retained Impact packages' opportunity
  cost. Other Stun engines do not enter by numerical stat-stick analogy once a
  retained same-axis package is no longer competitive. These are local Caesar
  judgments, not a general rule for Defense holders.

### Drive Discs, mains, and prepared setup

- R13. Caesar's authored base 4-piece candidates are Proto Punk and Bunny in
  Wonderland. Proto supplies Shield Effect +15% and squad DMG +15% after her
  Assist route. Bunny supplies unused HP +10% but up to squad DMG +18% while a
  Defense holder has a shield, a more offensive whole-package alternative.
  Astral Voice is appended only under the established repeated Quick Assist
  opportunity and supplies unused ATK +10% plus controllable entrant DMG +24%.
  Swing Jazz is dominated by Proto's equal squad-DMG output plus shield axis;
  Shockstar 4-piece misses Caesar's defining EX/Assist Daze actions; Freedom
  Blues is not admitted before an anomaly-direction consumer exists.
- R14. Caesar's 2-piece candidates are Shockstar Disco, Proto Punk, and King of
  the Summit. Shockstar's Initial Impact +6% strengthens both shield and Daze;
  Proto's Shield Effect +15% strengthens only the shield; King's Daze +6%
  strengthens only Daze. Do not infer King 4-piece membership or Stun-holder
  allocation from Caesar's legal King 2-piece.
- R15. Main candidates are CRIT Rate/CRIT DMG/ATK% in Slot 4,
  Physical DMG/ATK%/PEN Ratio in Slot 5, and Impact in Slot 6. These variable
  personal-damage mains are the bounded residual allowance for a non-damage
  role; they do not create a broader damage candidate direction. Base effective
  substats are empty because Impact and Shield Effect cannot be supplied as
  ordinary substats and Caesar has no independent substat threshold or primary
  damage role. Zero supplied counts therefore create no eight-hit allocation.
- R16. Full locally prepares Tusks; non-limited locally prepares Hellfire. Both
  prepare Proto/Shockstar, CRIT Rate / Physical DMG / Impact, and no substats.
  This deterministic first choice favors the complete shield-plus-squad
  package while keeping a finite editable main-stat choice. It is not a
  runtime comparison of shield uptime, Daze rotations, or incoming attacks.

### Preparation, Result, and visible acceptance

- R17. Preparation remains acyclic. First derive effective W-Engine and
  complete-Disc candidates from authored bases, context, and party allocation,
  apply any prepared-choice-only package adjustment, and select the package.
  Then derive downstream main-stat and effective-substat candidates from the
  established party and selected equipment and choose their prepared values.
  Caesar adds no prepared King/Astral allocation pass: Proto remains her first
  choice, and contextual Astral changes membership only. Existing Stun
  King/Astral/Shockstar allocation remains unchanged in a Focus + Caesar +
  one-Stun party.
- R18. Selecting contextual Astral and then removing its party opportunity
  through Party Apply rebuilds all three setups and prepares Caesar back on
  Proto Punk. Reapplying the opportunity restores candidate membership but not
  the prior selection. This follows Party Apply initialization rather than the
  direct selected-pressure invalidation lifecycle. Bunny, Proto, and all
  2-piece choices are the unaffected contrast.
- R19. Result exposes Impact, Daze Bonus, selected residual ATK/CRIT/DMG inputs,
  Shield Effect when supplied, the Caesar-owned shield operation, exact Core/
  Mindscape action rows, delivered Focus ATK, and applicable shared/enemy
  modifiers. DMG Taken appears as a separately composed Initial/Combat/Fully
  row only for current eligible damage formulas. Candidate dominance and
  prepared choice do not broaden exact Result projection.
- R20. Selected and candidate equipment expose the same accessible compressed
  package descriptions, including inactive Specialty passives. Original asset
  inspection and in-app Browser comparison at desktop and one narrow viewport
  cover Caesar expanded and compact without changing another portrait.

## Acceptance Evidence

- AE1. Candidate and preparation tests prove both independent W-Engine pools,
  usable versus inactive passive packages, Original's complete package, base
  versus contextual Disc membership, zero-substat representatives, and one
  unaffected party.
- AE2. Composed lifecycle tests cover contextual Astral present, absent, and
  reselected; Party Apply rebuilding all three setups; targeted pool/Mindscape
  rebuilding only Caesar; direct-edit locality; and preservation of the
  existing Stun King allocation in a Focus/Caesar/Stun flow.
- AE3. Calculation tests prove Initial/Combat versus Fully Enabled Impact,
  shield basis and
  Shield Effect, Focus ATK at M0/M2, Additional active/inactive routes, broad
  DMG Taken projection without DMG Bonus contamination, M1 RES Reduction,
  skill-tier Daze/Impact values, M6 capped action CRIT/DMG/operation, Tusks,
  inactive Hellfire/Demara passives, and Original Fully-only Impact.
- AE4. Shared UI tests prove complete selected/candidate package copy,
  accessible inactive-passive descriptions, Result remains empty when
  incomplete, and no generic shield, incoming-damage, Assist, Energy, or
  anomaly surface appears.
- AE5. Full tests, typecheck, production build, original portrait inspection,
  and desktop/narrow expanded/compact Browser verification pass before closure.

## Assumptions

- The current admitted Evasive-Assist exceptions are Astra Yao, Billy Kid,
  Pulchra, and Zhu Yuan. This list is owned only by Caesar's present Additional
  Ability consumer and must be revisited when a later admitted Agent can change
  that qualification; it is not Agent catalogue metadata.
- The current formula participants consume Caesar's DMG Taken only through
  `general_damage` and `sheer_damage`. A later anomaly vertical must establish
  its own formula/result consumer before broadening the applicability.

## Rejected Alternatives And Boundaries

- Do not interpret source-local "base Impact" as Caesar's bare character Base
  Impact or as Fully Enabled Impact. The current Initial stat surface is the
  smallest representation that preserves equipment choices and the
  post-trigger Fully Enabled Impact contrast.
- Do not put the shared shield amount on every Agent, route the ATK buff to all
  party members, or dynamically follow a runtime active character. One
  provider-owned operation plus one Focus recipient preserves the current
  controllable setup decision.
- Do not encode DMG Taken as DMG Bonus. They occupy different permanent formula
  regions even when both are additive percentages in visible prose.
- Do not add generic shield, Assist-type, survival, or source-evidence schemas.
  The Caesar qualification helper, shield operation, and metric exist only for
  current consumers.
- Do not admit Original, Demara, Spring, or off-Specialty Stun engines merely
  because a guide names them or a number is positive. Holder eligibility,
  active versus inactive passive, complete package, same-axis comparator,
  zero-substat opportunity cost, and pool-specific representative decide each
  local outcome.
- Do not add anomaly equipment, anomaly formula participation, or Freedom
  Blues before the roadmap's anomaly semantic gate is independently closed.

## Status

No product decision blocks implementation planning. The Caesar shield and
Initial-Impact semantic gate closes through the permanent stat-region and
bounded-operation rules plus the established Ben/Lighter contrasts. The
permanent formula and source-fact owners now admit Caesar's bounded DMG Taken
and dedicated shield relationships without generalizing them. Exact
source values and current qualification facts were used as ephemeral inputs;
this document owns only the settled local product outcomes above.
