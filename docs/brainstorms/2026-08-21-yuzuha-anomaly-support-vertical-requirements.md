---
date: 2026-08-21
topic: yuzuha-anomaly-support-vertical
status: approved
---

# Ukinami Yuzuha Anomaly Support Vertical Requirements

## Summary

Admit Ukinami Yuzuha as the first off-field Anomaly-oriented Support vertical.
Her prepared setups invest in Initial ATK and Anomaly Mastery, while Result
separately explains her own anomaly buildup and the exact ATK, regular DMG,
Anomaly Proficiency, buildup, anomaly/Disorder, RES, and Disorder-operation
outcomes that reach eligible party recipients. The vertical does not turn
Sugarburst into a personal anomaly-damage share or inherit Grace/Piper damage
equipment merely because guides list personal AP or PEN after Yuzuha's caps.

## Permanent-Owner And Consumer Review

- `docs/zzz-formula-mechanics.md` owns the separate anomaly-damage and buildup
  regions. Yuzuha participates in `anomaly_buildup`; Sugarburst buildup is
  explicitly excluded from anomaly-damage share, so she does not gain a local
  `anomaly_damage` direction. Grace and Piper are the nearest recipient cases;
  Yixuan's `sheer_damage` remains the formula contrast.
- `docs/setup-workbench-product-contract.md` owns direction-driven candidates,
  whole-package pool representatives, capped-provider finite investment,
  selected-input lifecycle, recipient delivery, and complete-state outcomes.
  Astra/Lucy are the nearest Initial-ATK capped providers and Astra is the
  nearest off-field Support; none supplies Yuzuha's AM-driven three-output
  relationship or Disorder coefficient operation. SW-008/SW-009's special
  sequencing applies only to Yuzuha's substat-tunable Initial-ATK axis. AM is
  instead a valuable fixed equipment axis that substats cannot supply, so the
  two caps do not require a new multi-axis preparation algorithm.
- `docs/source-fact-boundary.md` owns completed source values, exact operations,
  and exclusion of cadence or simulated uptime. The maximum reachable M6
  Disorder multiplier is a complete state operation; Sugar Point acquisition,
  shell cadence, and duration maintenance are not runtime inputs.
- `docs/zzz-game-vocabulary.md` owns ATK, AP, AM, Energy Regen, main-stat and
  substat identities, Attribute Anomaly, and Disorder. AP remains an
  anomaly-damage stat and is therefore recipient-facing from Metanukimorphosis,
  not a personal Yuzuha setup direction.
- `docs/workbench-ui-design-rules.md` owns compressed equipment copy, separate
  output lines for one relationship that changes multiple Result quantities,
  exact Result operations, source linking, and portrait acceptance. Current
  `GaugeResult`, `ResultOperation`, `ResultPanel`, provider delivery, and
  calculation dispatch are the behavior-bearing consumers to extend.

## Key Flows

- **Prepared setup:** pool or Mindscape preparation chooses one competitive
  complete W-Engine/Disc/main-stat package and starts every effective-substat
  count at zero. Full and non-limited representatives are independently
  authored; party Apply and local rebuild behavior remain unchanged.
- **Provider composition:** Yuzuha's own Result first composes Initial ATK and
  AM. Her qualified Additional Ability then derives buildup, Attribute Anomaly
  DMG, and Disorder DMG from the same AM basis before exact recipient
  applicability is resolved. Equipment and Mindscape clauses join the existing
  shared provider phase.
- **Visible Result:** Yuzuha shows her own buildup direction and capped source
  relationships. Eligible anomaly-damage recipients receive the appropriate
  AP and anomaly/Disorder effects; all applicable damage recipients receive
  ATK, regular DMG, or RES effects; M6 supplies a separately sourced Disorder
  operation without calculating final Disorder damage.

## Requirements

### Identity, formula participation, and source outcomes

- R1. Add Ukinami Yuzuha after Piper as S-Rank Physical Support, Spook Shack,
  M0 by default, and not Focus-eligible. Retain completed ATK 758, AP 93, AM
  124, and Base Energy Regen 1.2/s. Her primary formula participation is
  `anomaly_buildup`; she has no personal `anomaly_damage` or
  `general_damage` setup direction at M0-M6. M4's Assist Follow-Up DMG +30%
  and M6's additional 300% ATK shells do not overcome the Initial-ATK, AM, and
  party-support opportunity cost, so no Mindscape introduces personal AP,
  CRIT, PEN, or damage equipment candidates.
- R2. Sugarburst begins as Physical and Flavor Match follows the active Agent's
  Attribute. Its completed Basic level supplies Anomaly Buildup Rate +25% at
  M0-M2, +28% at M3-M4, and +31% at M5-M6, but its buildup does not enter
  anomaly-damage share. Preserve one Yuzuha source-local matching-Attribute
  action outcome routed from the current Focus Agent's authored Attribute; do
  not add the value to the recipient's raw buildup stat or calculate raw
  buildup, application count, anomaly share, field time, or final damage.
- R3. Tanuki Wish supplies all party members flat ATK equal to 40% of Yuzuha's
  Initial ATK, capped at +1200 at Initial ATK 3000, and regular DMG Bonus +15%.
  Result shows the Initial ATK cap gauge and exact recipient contributions.
  The trigger, 40-second duration, and maintenance are omitted from Setup and
  are not runtime controls.
- R4. Yuzuha's Additional Ability is active when another applied Agent is
  Anomaly Specialty or shares Yuzuha's faction. For each point of Yuzuha AM
  above 100, it supplies all party members Anomaly Buildup Rate +0.2% and all
  Attribute Anomaly and Disorder DMG +0.2%, each capped at +20% at AM 200.
  One AM relationship produces three separately labeled gauge output lines and
  three exact recipient clauses: Anomaly Buildup Rate, Attribute Anomaly DMG,
  and Disorder DMG. Without qualification the AM stat remains but all three
  gauge outputs and contributions are absent.
- R5. M1 supplies enemy all-Attribute RES Reduction -10% and raises only the
  Additional Ability's Anomaly/Disorder output to +0.26% per AM over 100,
  capped at +26%; its buildup output remains +0.2%, capped at +20%. M2 supplies
  all party regular DMG Bonus +15% and Anomaly Buildup Rate +15%. M4 supplies
  Assist Follow-Up Anomaly Buildup Rate +20% and triggers Quick Assist. The
  action DMG +30% is retained as a source fact but excluded from Result and
  equipment authoring because the whole personal package remains noncompetitive;
  the Quick Assist route instead strengthens Astral Voice's already-legal
  activation without changing the prepared 4-piece representative.
- R6. At M6, the maximum reachable three qualifying shells supply all party
  Disorder DMG Multiplier +315% as one complete Fully Enabled state operation.
  The source-stated +105% per shell, three separately calculated stacks changes
  the Disorder coefficient in `anomaly_base_damage`; it is not an
  `anomaly_buff_multiplier` bonus. Preserve the exact source, recipient,
  quantity, and maximum state. The separate shell's 300% ATK action coefficient
  remains source fact only. Do not expose charge, hit cadence, separate stack
  timers, or simulate Disorder.

### W-Engine authoring

- R7. Add Metanukimorphosis as limited S-Rank Support, Base ATK 713, advanced
  Energy Regen +60%. W1-W5 supplies holder AM +30/34/39/43/48 and all party AP
  +60/69/78/87/96 through its source conditions. Selected and candidate Setup
  copy compresses those outcomes to `Anomaly Mastery +N` and
  `Squad Anomaly Proficiency +N`; triggers, duration, and instance limits stay
  in the retained fact only.
- R8. Yuzuha's full candidates are Metanukimorphosis, Thoughtbop, Weeping
  Cradle, Kaboom the Cannon, and Unfettered Game Ball. Her non-limited
  candidates are Weeping Cradle, Kaboom, and Unfettered. Unfettered's
  enemy-weakness Anomaly route is legally activatable through Flavor Match and
  its squad CRIT can materially reach a CRIT-consuming Focus Agent; selected
  and candidate Setup copy must preserve the uncontrollable availability
  condition as `Weakness-matched target · Squad CRIT Rate +N%`. It remains a
  complete contextual contrast even though it is unused in the prepared
  Grace/Piper anomaly party. Elegant Vanity, Dreamlit Casket, Bashful Demon,
  Slice of Time, Vault, and Half Sugar Bunny are excluded where activation is
  impossible or their personal, HP, pre-filled ATK, or weaker repeated axes are
  dominated after unused opportunity cost is charged.
- R9. Full prepares Metanukimorphosis W1. Its Base ATK and Energy Regen support
  Tanuki Wish, its AM closes Yuzuha's Additional cap with the prepared Disc
  package at Fully Enabled, and its AP reaches only current
  `anomaly_damage` recipients. Thoughtbop remains the nearest limited
  same-axis Support alternative through high Base ATK, Energy Regen, squad
  regular DMG, and squad ATK; it does not displace Metanukimorphosis's distinct
  AM/AP anomaly package.
- R10. Non-limited prepares Kaboom the Cannon W5. Its Base ATK, Energy Regen,
  and squad ATK are all used, while Weeping Cradle W1 charges an unused
  advanced PEN Ratio against its higher Base ATK, off-field Energy, and squad
  regular DMG package. Weeping remains the nearest partial same-axis
  alternative and Unfettered the recipient-dependent CRIT contrast.
  Non-limited exclusion of limited S-Ranks is availability semantics, not a
  lower-rarity pool; all three non-limited choices also appear in full.

### Drive Disc and finite investment authoring

- R11. Yuzuha's 4-piece candidates are Moonlight Lullaby and Astral Voice at
  every Mindscape. Moonlight's EX/Ultimate route and all-party regular DMG
  package form the prepared off-field Support choice in both pools. Astral's
  Quick Assist entrant relationship is reachable and competitively distinct; M2
  changes practical frequency and uptime without removing membership, and M4's
  added Quick Assist route strengthens activation reliability rather than adding
  membership or displacing Moonlight's Energy Regen plus all-party regular-DMG
  package. Existing non-stacking party allocation may contextually prepare
  Astral when warranted. Freedom Blues is the nearest valid Physical-buildup/AP
  contrast and is excluded because its remaining package is narrower and its
  AP axis unused. Phaethon's Melody 4-piece and personal-damage sets are likewise
  excluded when their remaining package is not competitive for Yuzuha's
  Support and buildup direction.
- R12. Her 2-piece roles are AM from Phaethon's Melody, ATK from the existing
  Hormone Punk/Astral Voice identity, and Energy Regen from the existing Swing
  Jazz/Moonlight Lullaby identity. The selected 2-piece remains independent of
  the selected 4-piece: Moonlight 4-piece exposes Swing Jazz for the same ER
  role, while a different 4-piece exposes canonical Moonlight. Personal AP,
  PEN Ratio, and Attribute DMG 2-piece choices are excluded because no Yuzuha
  damage formula consumes them.
- R13. Both pools prepare Moonlight Lullaby 4-piece, Phaethon's Melody 2-piece,
  Slot 4 ATK%, Slot 5 ATK%, and Slot 6 AM. Legal alternatives keep ATK% in
  Slots 4/5, but Slot 6 AM is the sole candidate because AM is unavailable from
  substats and the bounded future ATK opportunities already cover the capped
  Initial-ATK axis. Energy Regen is not retained as a Slot 6 candidate because
  it gives up the only fixed main-stat AM opportunity without a current whole-
  package case that displaces it. Effective substats are ATK% and flat ATK,
  each initialized to zero.
- R14. Zero supplied counts preserve the authored first choice while the capped
  Initial-ATK provider reserves a conservative eight future hits in each
  retained same-axis substat supplier: ATK% and flat ATK. Eight is an
  authoring pressure check, not a maximum, exact distribution, saturation
  claim, optimizer input, or farming promise. Full Metanukimorphosis zero-
  substat Initial ATK is 2669.6 and eight ATK% plus eight flat hits raise it
  to 3174.64; non-limited Kaboom zero is 2527.2 and eight ATK% plus eight flat
  hits raise it to 3010.88. The prepared Phaethon/AM package gives AM 171.12
  before the engine: Metanukimorphosis W1 reaches 201.12 and the output cap of
  200, while Kaboom remains at 171.12. Prepared Result still supplies zero
  substat counts in both pools.

### Composition, lifecycle, and visible boundaries

- R15. Source facts retain exact activation, duration, stack, recipient, and
  source values. Setup shows only the competitive package outcome, including
  every materially distinct unused clause. Result projects exact current
  numeric contributions and operations. No source-fact trigger prose is copied
  into Setup unless a non-controllable material condition must remain visible.
- R16. Yuzuha adds no candidate pressure kind or preparation pass. Party Apply
  rebuilds all three setups; Yuzuha pool or Mindscape changes rebuild only her
  setup; direct edits rebuild none. Reconciliation clears newly invalid
  dependent selections without fallback, and Result remains empty while any
  required selection is incomplete. Grace/Piper DEF-region pressure lifecycle
  remains the preserved broad-DEF-pressure contrast and is not a consequence of
  Yuzuha or Metanukimorphosis. Changing Yuzuha directly from
  Metanukimorphosis removes only its squad AP source; pool change rebuilds only
  Yuzuha and removes or restores that source; reselecting the engine restores
  it without recreating recipient selections or edit history. A selected
  Puffer/PEN input on Grace or Piper still clears without fallback under broad
  DEF pressure, becomes eligible after provider removal, and clears again after
  reselection. Any incomplete Yuzuha selection keeps `calculateParty` null
  through `isCompleteWorkbench`.
- R17. Provider composition follows the current provider-resolution then
  recipient-calculation order. ATK and regular DMG clauses apply to formula-
  eligible recipients; AP and anomaly/Disorder clauses apply only to
  `anomaly_damage`; the Attribute Anomaly and Disorder clauses retain distinct
  current action targets even when their numeric values match; buildup clauses
  apply only to `anomaly_buildup`; M1 RES applies across applicable damage
  formulas. The M6 coefficient operation appears only for anomaly-damage
  recipients. Yixuan is the preserved sheer contrast and a general-damage Agent
  is the preserved regular-damage contrast.
- R18. Yuzuha Result exposes Initial ATK, AM, Energy Regen, her own Anomaly
  Buildup Bonus outcomes, Tanuki Wish ATK cap, qualified AM three-output gauge,
  applicable Mindscape outcomes, and selected equipment sources. Grace/Piper
  expose received AP, buildup, anomaly/Disorder, RES, and Disorder-operation
  consequences as applicable. No personal Yuzuha AP, PEN, CRIT, final damage,
  raw anomaly meter, rotation, uptime, or team buildup-share surface is added.
- R19. Selected and candidate equipment use identical accessible compressed
  summaries. Yuzuha's existing portrait and Metanukimorphosis art require
  original-asset inspection plus in-app Browser verification at desktop and a
  narrow viewport, expanded and compact, before closure.

## Acceptance Evidence

- AE1. Content/reference tests prove identity, retained engine facts, pool-local
  candidates, representatives, independent 4+2 roles, mains, and zero-count
  preparation without freezing a catalogue as a shared invariant.
- AE2. Shared calculation tests prove Tanuki Wish ATK/DMG, qualified and
  unqualified three-output AM gauge, Metanukimorphosis AP applicability, M1/M2/M4
  scopes, M6 recipient operation, and Yixuan/general-damage contrasts.
- AE3. One composed state flow covers prepared full/non-limited setups, party
  Apply, Yuzuha-only pool/Mindscape rebuild, direct invalid-selection clearing
  without fallback, completeness/null Result, and unchanged Grace/Piper
  selected-pressure lifecycle.
- AE4. UI tests and Browser verification cover compressed selected/candidate
  parity, all three AM output lines, source linking, M6 operation, desktop/narrow
  expanded and compact states, and absence of overflow or personal-damage copy.
- AE5. Full tests, type check, production build, diff review, and exact-head
  independent semantic review pass before evidence publication.

## Rejected Alternatives And Scope Boundaries

- Do not copy guide AP, PEN, CRIT, or personal-DMG recommendations into a
  Yuzuha setup whose current direction has no personal damage consumer.
- Do not admit every legally selectable Support W-Engine or Disc set. Whole-
  package competition, finite opportunity, and pool-local representative
  consequence remain required.
- Do not calculate anomaly damage, buildup, Disorder, Sugarburst share,
  rotation, duration, or uptime.
- Do not create an Agent-specific pressure pass, result-replication test suite,
  anomaly catalogue, reaction registry, or runtime optimizer.
- Do not generalize Grace/Piper's AP-first or partial limited-engine decisions
  to Yuzuha or later Anomaly Agents.

## Status

The user has accepted these bounded local outcomes. No new permanent-authority
amendment blocks this requirement at its current scope. Result, Setup, and
lifecycle consumers decide the needed behavior; implementation may extend their
typed schemas without changing the owned product meaning.
