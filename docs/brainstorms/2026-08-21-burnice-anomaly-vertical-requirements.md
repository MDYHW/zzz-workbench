---
date: 2026-08-21
topic: burnice-anomaly-vertical
status: approved
---

# Burnice Anomaly Vertical Requirements

## Summary

Admit Burnice White as an off-field Fire Anomaly applier whose prepared setup
uses Anomaly Proficiency, PEN Ratio, and Energy Regen. Result explains the
stats and modifiers that shape Fire Anomaly, Disorder, buildup, and Afterburn,
plus complete Mindscape operations, without calculating final damage,
application history, rotation, or uptime. Afterburn is a retained residual
general-damage output; it does not reclassify Burnice as a personal
general-damage build.

## Permanent-Owner And Consumer Review

- `docs/zzz-formula-mechanics.md` owns the separate anomaly-damage, anomaly-
  buildup, general-damage, Energy Regen, and action-operation regions. AP
  participates multiplicatively in the anomaly proficiency modifier, but the
  current owner does not specify a literal numeric normalization and the
  workbench has no final anomaly-damage-number consumer. AM changes buildup.
  Initial Energy Regen is the Potential basis, while Flamemaker Shaker's fixed
  Energy per second is composed afterward and cannot feed that relationship.
- `docs/setup-workbench-product-contract.md` owns direction-derived candidates,
  whole-package representatives, independent 4-piece and 2-piece investment,
  provider delivery, selected-input reconciliation, and complete state
  operations. Grace is the nearest anomaly-damage calculation, Piper the
  buildup and off-field-role contrast, and Yuzuha the provider/composition
  contrast. Miyabi remains a general-damage exception rather than an anomaly
  template.
- `docs/source-fact-boundary.md` admits action-scoped modifiers and complete
  state outcomes, while excluding raw skill-table coefficients, final damage,
  trigger cadence, application history, and simulated uptime.
- `docs/zzz-game-vocabulary.md` owns ATK, AP, AM, Energy Regen, Attribute
  Anomaly, Burn, Disorder, and the separate meanings of DMG Bonus and skill DMG
  Multiplier.
- `docs/workbench-ui-design-rules.md` owns one visible output per changed
  quantity, source-linked numeric breakdowns, compressed Setup copy, and
  portrait verification. Existing `GaugeResult.additionalOutputs`,
  `ActionModifier`, `ResultOperation`, provider delivery, composition, Setup,
  and Result consumers are sufficient; no generic reaction simulator is
  required.

## Key Flows

- **Preparation:** each availability pool prepares Chaos Jazz 4-piece, Swing
  Jazz 2-piece, AP / PEN Ratio / Energy Regen mains, zero supplied effective
  substats, and its independently competitive W-Engine representative.
- **Observation and delivery:** Burnice observes her complete setup and party
  qualification. Provider clauses retain self scope and M2 enemy-context scope
  before current applicability and action composition resolve them.
- **Visible Result:** AP and Initial Energy Regen gauges expose their derived
  bonuses, while canonical action/state rows appear only when their modifier or
  operation differs. No row represents a simulated Afterburn, Burn, or Disorder
  final damage number.

## Requirements

### Identity, formula participation, and source outcomes

- R1. Add Burnice White after Yuzuha as S-Rank Fire Anomaly, Sons of Calydon,
  M0 by default, and not Focus-eligible: her primary contribution persists
  through off-field Afterburn rather than serving as the fixed on-field damage-
  concentration observation point. Retain completed ATK 863, AP 120, AM 118,
  and Base Energy Regen 1.56/s. Her primary formula participation is
  `anomaly_damage` plus `anomaly_buildup`; residual `general_damage` exists only
  for the materially different Afterburn sub-output.
- R2. Completed Core Afterburn is an existing source-local Fire action. Its raw
  coefficient, Heat cost, trigger cadence, and Assist arithmetic have no
  current qualifying consumer and remain excluded. Every 10 AP adds Afterburn
  DMG Bonus +1%, capped at +30% at AP 300. Result shows an AP gauge
  whose output is `Afterburn DMG Bonus` and routes that bonus to Afterburn; it
  does not show calculated Afterburn DMG. The source classifies Afterburn as
  Assist Attack damage, so its source-local visible row inherits applicable
  canonical Assist equipment effects without becoming a generic Assist action.
- R3. Burnice's Additional Ability is active when another applied Agent is
  Anomaly Specialty or shares Sons of Calydon. It supplies Anomaly Buildup Rate
  +65% to Mixed Flame Basic Attack, EX Special Attack forms, Afterburn, and
  Tossing. It also extends Burn duration by 3 seconds as one complete Fully
  Enabled state operation. Do not expose trigger cadence, field time, Heat,
  Tossing/Abloom raw coefficients, or an anomaly-application history.
- R4. Completed Potential derives two capped outputs from Initial Energy Regen
  above 1.8/s: each 0.1/s supplies AM +2.5 and regular DMG Bonus +2%, capped at
  +25 AM and +20% DMG Bonus. One Initial Energy Regen gauge shows both outputs
  on separate lines. Only percentage equipment inputs contribute to the basis;
  fixed automatic Energy `/s` is composed at Combat/Fully Enabled afterward.
- R5. M1 supplies Afterburn Anomaly Buildup Rate +25% and changes the existing
  Afterburn skill multiplier by an added +100% ATK. Preserve the buildup as an
  action modifier and the added multiplier as a source-stated Fully Enabled
  operation. Increased Heat capacity and Heat consumption remain excluded.
- R6. M2 supplies all allied attacks against the Thermal Penetration target up
  to PEN Ratio +20% as a Fully Enabled enemy-context contribution. It applies
  only to formula families that use the DEF region and does not affect Sheer.
- R7. M4 supplies CRIT Rate +30% only to EX Special Attack and Assist Attack.
  Retain that general-damage action modifier without adding CRIT equipment,
  mains, substats, or a general-damage Result simulation. The one-second flame-
  spray extension is cadence/uptime and remains excluded.
- R8. M6 makes Double Shot, its special Afterburn, and Burn ignore 25% Fire RES;
  retain exact Fire action/Attribute modifiers. Its new 60% ATK special-
  Afterburn coefficient and once-per-20-seconds 1800% original-Burn arithmetic
  are additional base-output/cadence facts and remain excluded.

### W-Engine authoring

- R9. Flamemaker Shaker's off-field Energy, damage, and AP clauses all support
  Burnice's current interval and direction.
- R10. Burnice's full candidates are Flamemaker Shaker, Practiced Perfection,
  Fusion Compiler, and Weeping Gemini. Full prepares Flamemaker W1: every
  retained axis is used and its off-field Energy plus AP/DMG package
  uniquely coordinates with the prepared Energy main. Practiced Perfection is
  the sole retained partial limited package. Its usable ATK and AM axes are
  material, keep Slot 6 Energy Regen, and
  remain the closest current full-package alternative despite its unusable
  Physical-DMG clause.
- R11. Timeweaver is excluded rather than retained as a Disorder contrast. Its
  Electric buildup clause is unusable. Its source-owned AP threshold is
  reachable only after spending most of the conservative eight-count AP
  opportunity, while the remaining ATK, AP,
  and Disorder DMG still concentrate on Burnice's existing anomaly-damage axis.
  Flamemaker's complete off-field package and Practiced's scarce AM/buildup
  package remain more competitive uses of the single W-Engine opportunity. A
  distinct visible target therefore does not create a distinct equipment-
  investment axis. Angel in the Shell and Flight of Fancy are likewise
  excluded: Burnice cannot activate Angel's two Ether clauses or Flight's
  Ether-hit AP stacks, and their remaining AP/AM/buildup supply does not survive
  same-axis compression against Practiced after Slot 4/6 and future AP/ATK
  opportunities. Current competitive practice independently retains Practiced
  near Flamemaker and omits all three alternatives.
- R12. Non-limited candidates are Fusion Compiler and Weeping Gemini, and
  non-limited prepares Fusion Compiler W1. Burnice can establish Fusion's
  three Special/EX AP stacks before returning off field; the retained maximum
  does not require an off-field refresh. With Slot 5 Fire DMG, Fusion's
  PEN/ATK/AP package covers every current Fire output that Electro-Lip Gloss's
  broad DMG package covers while retaining higher Base ATK and a stronger
  complete allocation, so Electro is compressed rather than retained as a
  second version of the same broad package. Weeping's persistent party-Anomaly
  AP stacks and permanent ATK remain the distinct concentrated-AP contrast.
  Roaring Ride can trigger a random 5-second package
  during Burnice's brief EX entry but cannot refresh it off field, and Burnice
  cannot inherit Piper's sustained on-field EX pattern. Rainforest Gourmet is
  legally activatable but supplies only a short same-axis ATK window after Energy
  consumption and no distinct competitive direction. All three are excluded.
  Frostfall Sickle and Hailstorm Shrine are excluded personal/Attribute packages.
  Pool availability is not a rarity catalogue, and full includes both retained
  non-limited choices.

### Drive Disc and finite investment authoring

- R13. Burnice's 4-piece candidates are Chaos Jazz and Freedom Blues. Chaos is
  prepared because its stable Fire/Electric DMG covers Burnice's off-field
  interval, while its EX/Assist clause covers her brief entry EX window and
  source-classified off-field Afterburn. Freedom remains the nearest
  buildup-resistance alternative. Inferno Metal is legal but excluded: its Burn-
  conditioned CRIT package spends the 4-piece opportunity on an axis outside
  Burnice's authored anomaly directions.
- R14. Her independent 2-piece roles are Energy Regen through Swing Jazz or
  Moonlight Lullaby, AM through Phaethon's Melody, PEN Ratio through Puffer
  Electro, AP through Freedom Blues or Chaos Jazz, and Fire DMG through Inferno
  Metal, and ATK through Hormone Punk or Astral Voice. Chaos 4-piece exposes
  Freedom as the distinct AP identity and prepares Swing for Energy Regen;
  another 4-piece exposes canonical Chaos and Moonlight identities. The ATK
  identity remains competitive across Flamemaker's broad-DMG frame and
  Fusion's PEN/Fire allocation rather than surviving from positivity alone.
- R15. Both pools prepare Chaos Jazz 4-piece, Swing Jazz 2-piece, Slot 4 AP,
  and Slot 6 Energy Regen. Full prepares Slot 5 PEN Ratio; non-limited Fusion
  prepares Slot 5 Fire DMG because the selected engine already supplies PEN.
  Slot 5 PEN Ratio, Fire DMG, and ATK% are retained candidates; Slot 6 AM is the
  retained alternative and Slot 4 AP is the sole candidate. Effective substats
  are AP then ATK%, both initialized to zero. Broad pre-PEN pressure replaces
  a prepared Slot 5 PEN choice with Fire DMG; a directly selected Puffer/PEN
  combination clears without fallback and is not silently rewritten.
- R16. Eight future AP and eight future ATK% hits are a conservative opportunity
  comparison, not a maximum, exact distribution, optimizer input, or farming
  promise. Prepared supplied counts remain zero. The full representative
  composes AP/PEN/Energy mains, while non-limited Fusion composes
  AP/Fire/Energy; neither receives hidden future hits.

### Composition, lifecycle, and visible boundaries

- R17. Burnice is not a Focus candidate; a draft with no other eligible Agent
  cannot Apply, while the generic policy auto-selects a sole eligible teammate.
  Burnice introduces no new candidate-pressure or preparation pass.
  Party Apply rebuilds all setups; Burnice pool or Mindscape changes rebuild
  only Burnice; direct edits rebuild none. Reconciliation clears invalid
  dependent choices without fallback, `isCompleteWorkbench` keeps Result empty
  while any required choice is absent, and reselecting an invalid PEN input
  clears it again. Provider removal restores eligibility rather than edit
  history. Yixuan Sheer remains the unaffected pressure contrast.
- R18. Burnice's local Attribute Anomaly effects use the established canonical
  Attribute Anomaly identity, with Burn only as a child where M6 differs.
  Yuzuha's received Disorder source uses the shared `DISORDER_TARGET`.
  Afterburn remains a separate source-
  local action while inheriting the exact canonical Assist equipment scope
  stated by its source. Do not create unconditional empty Afterburn, Burn, Fire
  Anomaly, or Disorder rows; a row exists only when current sources make it differ.
- R19. Result exposes ATK, AP, AM, Energy Regen, applicable regular/anomaly/
  buildup, PEN, RES, and source-linked action differences. CRIT appears only
  when M4 creates its current EX Special/Assist action difference; the AP gauge,
  Initial Energy Regen two-output gauge, Burn duration operation, and admitted
  Mindscape operations are exact. It excludes final Afterburn, Burn, Fire
  Anomaly, Disorder, Abloom, or original-Burn damage; raw meter, application
  count/share, rotation, cadence, and uptime.
- R20. Source facts retain exact activation, duration, stack, source, recipient,
  action, and Attribute scope. Setup is compressed outcome copy and omits
  controllable or naturally satisfied trigger prose. Selected and candidate
  equipment share the same accessible summaries. Burnice and the new W-Engine
  art require original-asset inspection and in-app Browser verification at
  desktop and narrow widths, expanded and compact.

## Acceptance Evidence

- AE1. Shared content/reference checks cover valid identities, candidate
  references, pool filtering, prepared membership, independent Disc roles, and
  zero-count initialization without freezing Burnice's exact local roster as a
  generic invariant.
- AE2. Shared calculation-flow checks cover the AP gauge, two-output Initial
  Energy Regen gauge and fixed `/s` exclusion, action/state operations, M2
  recipient applicability, Afterburn's exact Assist equipment inheritance, and
  Yuzuha Attribute-Anomaly/Disorder delivery.
- AE3. One composed state flow covers broad pressure present/absent/reselected,
  invalid clearing without fallback, completeness/null Result, and the
  unaffected Sheer contrast.
- AE4. UI and Browser evidence cover selected/candidate compressed copy,
  multiple gauge outputs, operations, source breakdowns, and changed portraits
  at desktop/narrow and expanded/compact states.
- AE5. Focused and full tests, type check, production build, diff check,
  controller diff review, and one independent exact-head review pass before
  protected evidence publication.

## Rejected Alternatives And Scope Boundaries

- Do not treat Afterburn as a personal general-damage build direction or add
  CRIT equipment merely because M4 modifies two actions.
- Do not calculate final damage, raw anomaly application, Burn/Disorder history,
  Heat, rotation, cadence, or uptime.
- Do not treat Flamemaker off-field stack acquisition as double maximum DMG,
  copy routine trigger prose into Setup, or admit every legal Anomaly engine or
  Disc as a candidate.
- Do not retain a partial limited package merely because its surviving clause
  has a different label. Compress Timeweaver, Angel in the Shell, and Flight of
  Fancy against the strongest usable same-axis package and retain only
  Practiced Perfection for Burnice.
- Do not add a Burnice-specific pressure pass, runtime cap optimizer, reaction
  registry, generic operation framework, roster snapshot, or per-Agent test
  suite.
- Do not infer Burnice's candidates or representative from Grace, Piper, or
  Yuzuha; their current behavior remains the nearest case or contrast only.

## Status

The user has accepted the corrected bounded Burnice authoring outcome. Current
permanent owners and established consumers derive the required composition;
no authority amendment, common-mechanism decision, or external-fact blocker
prevents this Agent-local vertical.
