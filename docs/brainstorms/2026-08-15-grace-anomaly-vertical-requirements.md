---
date: 2026-08-15
topic: grace-anomaly-vertical
status: approved
---

# Grace Anomaly Vertical Requirements

## Problem Frame

Grace opens the first `anomaly_damage` and `anomaly_buildup` setup-to-Result
consumer. The vertical must make Anomaly Proficiency, Anomaly Mastery, Shock
damage bonuses, buildup bonuses and buildup-resistance reduction useful without
turning the workbench into an anomaly-application history, reaction simulator,
or final-damage calculator.

The permanent formula owner already separates anomaly damage from anomaly
buildup, keeps CRIT invalid by default, and excludes raw anomaly coefficients
and combined party buildup. The product contract keeps only current setup
choices, deterministic prepared starts, visible modifier relationships, exact
qualified outcomes, and bounded threshold gauges. Grace therefore adds the
smallest stat and modifier vocabulary needed by her current package while
preserving the current three-surface Result grammar.

## Permanent-Owner And Consumer Review

- `docs/zzz-formula-mechanics.md` owns `anomaly_damage` and
  `anomaly_buildup`. Grace consumes ATK, AP, regular Electric DMG, Shock or
  Disorder bonuses, DEF/RES/Stun regions, AM, buildup bonus, and buildup RES.
  Soldier 11 is the closest regular-DMG contrast: Electric/Fire DMG and
  DEF/RES still compose, but AP/AM and buildup effects do not enter
  `general_damage`.
- `docs/zzz-game-vocabulary.md` owns AP, AM, Slot 4 AP, Slot 6 AM, AP
  substats, Shock, Disorder, and completed Potential Awakening. Grace's
  completed AP/AM are ordinary stats; her Abloom instances remain raw anomaly
  results rather than a new stat.
- `docs/setup-workbench-product-contract.md` owns competitive candidates,
  whole-package representatives, zero supplied substats, and Result disclosure.
  Grace's prepared zero remains a finite AP/ATK farming opportunity; it does
  not reserve hidden hits or solve exact Disc-line exclusions.
- `docs/source-fact-boundary.md` admits completed Core/Potential values,
  retained source modifiers, exact source-stated operations, and complete
  equipment packages. Shock ticks, remaining duration, raw buildup, final
  anomaly damage, and Abloom's original-result arithmetic remain excluded.
- `docs/workbench-ui-design-rules.md` owns the existing stat/modifier table,
  source disclosure, action-difference rows, threshold gauge, and portrait
  acceptance. Evelyn's threshold gauge is the closest display for Timeweaver's
  AP gate; Grace adds no generic enemy editor.

## Requirements

### Identity, formulas, and retained facts

- R1. Admit Grace Howard as S-Rank Electric Anomaly, Belobog Heavy Industries,
  M0 by default, and Focus-eligible. Her primary formula families are
  `anomaly_damage` and `anomaly_buildup`; she has no residual CRIT-capable
  `general_damage` direction.
- R2. Retain completed ATK 825, AP 116, AM 151, and Base Energy Regen 1.2.
  ATK and AM already include completed Core enhancement nodes. HP, DEF, Impact,
  CRIT Rate, and CRIT DMG create no current setup choice or Result consumer and
  remain absent.
- R3. AP is a flat stat that scales applicable anomaly damage. AM is a
  percentage-scaled stat that scales anomaly buildup. Initial AP includes base,
  W-Engine advanced AP, selected Disc AP, Slot 4 AP, and supplied AP substats.
  Initial AM applies selected percentage inputs to base AM; later flat AM
  effects add on their owned surface. Neither stat is a raw anomaly gauge or a
  final damage value.

### Grace sources and Result boundaries

- R4. At eight Zap stacks, Special Attack or EX Special Attack consumes Zap and
  supplies Electric Anomaly Buildup Bonus +130% at Fully Enabled to those exact
  action kinds. Do not model Zap count, skill buildup, anomaly gauge fill, or
  cadence.
- R5. Grace's Additional Ability qualifies when another Agent shares Electric,
  Belobog Heavy Industries, or Anomaly Specialty. A qualifying EX Special makes
  the next Shock instance gain Anomaly DMG Bonus +18%, up to two stacks, for a
  reachable +36% Shock outcome at Fully Enabled. Keep `Shock` as one
  source-local anomaly outcome; do not calculate ticks, duration, or final
  Shock damage.
- R6. Completed Potential Awakening makes Zap consumption supply Electric DMG
  Bonus +30% at Fully Enabled. It is a regular DMG Bonus that applies to Grace's
  Electric anomaly damage. Pulse, Enhanced Zap duration, and maintenance are
  not runtime inputs.
- R7. Grace's current Ultimate can produce Abloom as an additional instance
  based on an original anomaly result. That arithmetic belongs to
  `anomaly_base_damage` and remains outside Result. The vertical does not add an
  Abloom metric, original-result input, Attribute coefficient table, or
  cross-Agent anomaly-history model.
- R8. M1 squad Energy and M4 Energy Generation Rate remain outside the current
  resource boundary. M2 supplies Electric RES Reduction +8.5% and Electric
  Anomaly Buildup RES Reduction +8.5% at Fully Enabled after a retained grenade
  hit. M3/M5 change no separately retained relationship.
- R9. M6 keeps one complete source-stated operation: Special/EX grenade DMG is
  scaled to `2.00×` at Fully Enabled. Its additional grenade and ordinary skill
  coefficient remain excluded; the operation does not calculate final damage.

### W-Engine authoring

- R10. Grace is holder-eligible only for Anomaly W-Engine passives. Her full
  candidates are Timeweaver, Practiced Perfection, Angel in the Shell, Fusion
  Compiler, Electro-Lip Gloss, and Weeping Gemini. The non-limited pool
  independently retains Fusion Compiler, Electro-Lip Gloss, and Weeping
  Gemini. Full prepares Timeweaver W1; non-limited prepares Fusion Compiler
  W1. Directly selected S-Rank engines default to W1 and A-Rank engines to W5.
- R11. Timeweaver is limited S-Rank Anomaly, Base ATK 713, advanced ATK +30%.
  W1-W5 supplies Electric Anomaly Buildup Bonus +30/35/40/45/50%, Special/EX
  against an anomalied enemy supplies AP +75/85/95/105/115, and AP at least 375
  supplies Disorder DMG Bonus +25/27.5/30/32.5/35%. Grace consumes every clause
  when its exact condition is reachable, making Timeweaver the full-pool first
  choice.
- R12. Timeweaver's complete package remains visible regardless of party. Exact
  Result projection shows its AP threshold gauge only when another applied
  Agent has a non-Electric effective Attribute and therefore supplies a current
  Disorder opportunity. The gauge uses Fully Enabled AP, threshold/cap 375,
  and the selected refinement's Disorder DMG Bonus as output only at or above
  the threshold. An all-Electric party is the contrasting no-Disorder Result;
  no party anomaly sequence is simulated.
- R13. Practiced Perfection is limited S-Rank Anomaly, Base ATK 713, advanced
  ATK +30%. W1-W5 holder AM is +60/69/78/87/96. Its Assault-triggered Physical
  DMG +20/23/26/29/32% per stack, two stacks on entry, is unused by Grace's
  retained Electric anomaly direction. Its large usable AM chassis keeps the
  partial package competitive but below Timeweaver's complete Grace package.
  Angel in the Shell is limited S-Rank Anomaly, Base ATK 713, advanced AM
  +30%, and supplies AP +90/103/117/130/144. Grace cannot activate its
  Ether-holder DMG and Attribute Anomaly DMG clauses, but its AP-and-AM package
  remains competitive between Timeweaver's damage-weighted package and
  Practiced Perfection's buildup-weighted package.
- R14. Fusion Compiler is non-limited S-Rank Anomaly, Base ATK 684, advanced
  PEN Ratio +24%. W1-W5 supplies ATK +12/15/18/21/24% and Special/EX AP
  +25/31/37/43/50 per stack up to three. Grace consumes the full package, so it
  prepares the non-limited pool over the A-Rank alternatives.
- R15. Electro-Lip Gloss is non-limited A-Rank Anomaly, Base ATK 594, advanced
  AP +75. While an anomalied enemy is present it supplies ATK
  +10/11.5/13/14.5/16% and broad DMG Bonus +15/17.5/20/22.5/25%. Weeping Gemini
  is non-limited A-Rank Anomaly, Base ATK 594, advanced ATK +25%; each squad
  Attribute Anomaly supplies AP +30/34/38/42/46 up to four stacks. Both are
  complete accessible alternatives, but neither displaces Fusion's Base ATK,
  PEN, ATK, and reachable AP package.
- R16. Hailstorm Shrine is an eligible Anomaly engine but its CRIT and Ice
  package has no Grace consumer. Frostfall Sickle's usable AM is dominated by
  the retained AM packages after its Ice and Abloom clauses are charged as
  unused. Flight of Fancy and Sharpened Stinger do not survive Angel in the
  Shell's same-AP comparison for Grace's direction-defining maximum-Zap
  Special/EX buildup, and Flamemaker Shaker cannot sustain a competitive
  package through Grace's Energy and field-time pattern. Attack-specialty
  engines are passive-inactive for Grace even if their advanced stat is
  numerically positive. Roaring Ride's short random buff and Rainforest
  Gourmet's Energy-spend cadence do not add a competitive role beyond the
  retained non-limited packages. These are local Grace exclusions, not general
  Anomaly-engine policy.

### Drive Disc authoring and prepared setup

- R17. Add Chaos Jazz, Freedom Blues, and Phaethon's Melody. Chaos Jazz supplies
  AP +30 at 2 pieces; at 4 pieces it supplies Fire/Electric DMG +15% and
  off-field EX Special/Assist DMG +20%, with the retained five-second on-field
  continuation. Freedom supplies AP +30 at 2 pieces and matching-Attribute
  Anomaly Buildup RES Reduction +20% for eight seconds after EX Special at 4
  pieces, non-stacking with the same Attribute. Phaethon supplies AM +8% at 2
  pieces and AP +45 after any squad EX at 4 pieces; its other-holder Ether DMG
  clause is unused by Grace.
- R18. Grace's 4-piece candidates are Thunder Metal, Chaos Jazz, Freedom Blues,
  and Phaethon's Melody. Thunder's Shock-conditioned ATK +28% is the prepared
  first choice; Grace establishes Shock herself and consumes the full ATK
  package. Chaos preserves the broad Electric/AP alternative while its direct
  EX/Assist clause is not projected into the anomaly-only Result. Freedom
  preserves the unique buildup-RES route. Phaethon's complete AM +8% and
  squad-EX-triggered AP +45 package preserves a competitive damage-and-buildup
  balance while its other-holder Ether DMG clause remains unused by Grace.
- R19. Grace's authored 2-piece roles are PEN Ratio, AM, AP, and ATK. Puffer
  Electro supplies PEN Ratio; Phaethon supplies AM; Freedom Blues and Chaos
  Jazz form one exact same-effect AP identity; Hormone Punk and Astral Voice
  keep their existing ATK identity. Selecting Freedom 4-piece exposes Chaos
  2-piece, selecting Chaos exposes Freedom, and another 4-piece exposes the
  canonical Freedom identity. Prepared Thunder uses Puffer.
- R20. Thunder's Electric DMG 2-piece is numerically useful but locally
  dominated by AP, PEN, AM, and ATK roles after the complete 4-piece choice and
  future investment opportunity are considered; it is not admitted merely
  because it contributes positively. This does not generalize to current
  Electric `general_damage` Agents whose formula and CRIT balance differ.
- R21. Grace's mains are AP/ATK% in Slot 4, PEN Ratio/Electric DMG/ATK% in Slot
  5, and AM in Slot 6. Effective substats are AP and ATK%. Flat ATK and flat PEN
  do not create a separately material competitive direction in the bounded
  eight-count authoring check. Both pools prepare AP/PEN Ratio/AM with every
  offered count at zero.
- R22. Zero supplied AP and ATK counts are a finite future opportunity, not an
  absence of investment. The conservative eight-count heuristic checks whether
  a fixed package forecloses a material axis; it does not choose exact Disc
  lines, exclude a main stat from the same Disc, promise farming outcomes, or
  optimize edited setups at runtime.

### Preparation, lifecycle, and visible Result

- R23. Preparation remains authored candidates, contextual candidates, holder
  allocation, selected-input pressure, mains/effective substats, then zero
  initialization. Grace adds no new pressure kind, but the established broad
  pre-PEN DEF-bypass pressure applies because `anomaly_damage` consumes the same
  DEF/PEN region: it removes Puffer and Slot 5 PEN, and a newly prepared Grace
  uses Freedom Blues plus Electric DMG. Pressure removal restores candidate
  membership, not a prior direct selection; reapplication clears a newly
  invalid selection without fallback. Her Freedom/Chaos AP pair independently
  follows the selected-four-piece present/absent/reselected lifecycle and never
  restores prior history.
- R24. Grace's Additional Ability and Timeweaver Disorder opportunity observe
  the applied party only after Party Apply. Party changes rebuild all three
  setups; Grace Mindscape or pool changes rebuild only Grace. Result-only
  qualification changes do not create candidates, hidden counts, or runtime
  equipment selection.
- R25. Grace Result exposes ATK, AP, AM, Energy Regen, regular DMG Bonus, Shock
  and Disorder Anomaly DMG Bonus outcomes, Anomaly Buildup Bonus with
  Special/EX action outcomes, Anomaly Buildup RES Reduction, PEN Ratio, and
  applicable DEF/RES/Stun regions. It exposes the M6 grenade scale operation
  without final damage.
- R26. `Anomaly DMG Bonus` is one parent modifier row whose source-local Shock
  and Disorder outcomes show only differences from the broad parent. `Anomaly
  Buildup Bonus` likewise uses Special Attack and EX Special Attack action
  outcomes for Zap. These rows do not imply raw anomaly damage or buildup.
- R27. Candidate membership, prepared representative, same-effect identity,
  package copy, and exact Result projection remain separate. A package can stay
  competitive with one unused clause, and an admitted clause appears in Result
  only when its holder, activation, Attribute, formula, surface, and outcome
  conditions are satisfied.
- R28. Selected and candidate equipment expose identical accessible compressed
  package descriptions. New AP/AM values keep their flat-versus-percentage
  units. Original Grace portrait inspection and in-app Browser comparison at
  desktop and one narrow viewport cover expanded and compact before commit.

## Acceptance Evidence

- AE1. Content and candidate tests prove exact Agent identity, AP/AM units,
  complete W-Engine and Disc packages, both pools, representatives, zero-count
  inputs, same-effect identity lifecycle, and the Thunder-2-piece contrast.
- AE2. Calculation tests prove AP/AM composition, Core Special/EX buildup,
  qualified/inactive Shock bonus, Potential Electric DMG, M2 RES and buildup
  RES reductions, M6 scale, and Abloom/resource exclusions.
- AE3. Timeweaver tests cover AP below/at/above 375, different-Attribute versus
  all-Electric party, complete package copy, and exact Disorder projection.
  Practiced's partial package, Fusion's full package, and an inactive-specialty
  contrast remain visible without broadening Result.
- AE4. Shared flow tests traverse prepared full/non-limited setups, direct Disc
  identity selection, broad pre-PEN pressure present/absent/reselected,
  selection clearing, party Apply, changed-Agent-only rebuild, and one
  unaffected current general-damage consumer.
- AE5. UI tests prove new metric labels, action outcomes, gauge accessibility,
  selected/candidate package parity, incomplete Result, and no final-damage or
  anomaly-history surface.
- AE6. Full tests, typecheck, production build, original portrait inspection,
  and desktop/narrow expanded/compact Browser verification pass before closure.

## Rejected Alternatives And Boundaries

- Do not calculate Shock ticks, anomaly gauge fill, anomaly application time,
  Disorder sequence, Abloom result, raw coefficients, or final damage.
- Do not add a generic target editor, Attribute Anomaly catalogue, reaction
  registry, party contribution simulator, or runtime equipment scorer.
- Do not treat every positive AP/AM/ATK/PEN/DMG option as a candidate. Current
  formula consumption, complete package, same-pool competition, and finite
  opportunity still gate membership.
- Do not make CRIT generally valid for Anomaly because a later source may
  explicitly create a CRIT-capable anomaly exception.
- Do not generalize Grace's Thunder, Timeweaver, or partial Practiced choices to
  every Anomaly Agent.

## Status

No product decision blocks implementation planning. The permanent owners define
the two formula families, source/result boundary, preparation order, threshold
gauge, and exact identity lifecycle. Grace supplies current consumers for the
minimal AP/AM and anomaly-modifier extensions; Shock/Disorder outcomes and the
all-Electric contrast bound the first anomaly Result without inventing a combat
simulator.
