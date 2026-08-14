---
date: 2026-08-14
topic: harumasa-qingyi-vertical
status: accepted
---

# Asaba Harumasa And Qingyi Vertical Requirements

## Summary

Admit Asaba Harumasa and Qingyi through the existing Party Setup and Result
experience using their current released behavior. Harumasa is an S-Rank
Electric Attack Focus and ordinary crit-capable `general_damage` contributor.
His completed Potential Awakening, Dash-centered Core package, Stun/Anomaly
Additional Ability, and Zanshin Herb Case reuse current formula, action,
recipient, equipment, and CRIT-cap meanings. Qingyi is an S-Rank Electric Stun
Agent whose Basic-centered Daze, Subjugation Stun DMG Multiplier, Impact-derived
self ATK, party equipment, and Mindscape pressure reuse current Stun, provider,
threshold, broad pre-PEN, and holder-allocation meanings.

Harumasa and Qingyi activate each other's exact Additional Ability conditions:
Qingyi is Stun for Harumasa, and Harumasa is Attack for Qingyi. This relationship
does not create a named duo rule. The vertical adds only the smallest new
identities and Agent-local clauses needed by the current consumers; it adds no
rotation, Shock state, Voltage simulator, Electro Prison counter, damage/Daze
output, runtime package score, or catalogue.

## Product flows

- F1. Prepared Harumasa/Qingyi party
  - Applying a party with Harumasa as Focus prepares complete full or
    non-limited setups for all three Agents.
  - Harumasa receives Qingyi's Stun-window and selected equipment effects;
    Qingyi exposes her own Daze, Impact-to-ATK, and Stun multiplier Result.
  - Result appears immediately only while every required input remains complete.
- F2. Pool and equipment comparison
  - Switching either Agent's pool rebuilds only that Agent from its independently
    authored pool representative.
  - Direct W-Engine and Disc edits preserve unrelated selections and project
    only exact usable clauses to their exact actions and recipients.
- F3. Qingyi pressure lifecycle
  - Qingyi M1 supplies broad enemy DEF Reduction and therefore the existing
    general-damage pre-PEN pressure.
  - Pressure absent, present, removed, and reintroduced states reconcile every
    affected recipient once, clear invalid selections without fallback, and
    never restore edited history.
- F4. Stun-holder composition
  - Qingyi participates in the established Focus/King pass, then compatible
    party-effect allocation, then Shockstar fallback.
  - Direct edits may create duplicates; target-only preparation changes only
    the target and all-party preparation composes the passes without slot-order
    dependence.
- F5. Visible portrait and Result comparison
  - Both existing original portrait assets use the shared responsive card
    destinations and source-calibration order.
  - Expanded Result exposes only retained stats, gauges, action differences,
    and operations. Compact cards remain summary-only.

## Requirements

### Identity, direction, and qualification

- R1. Admit Asaba Harumasa as S-Rank Electric Attack, Section 6, Focus-eligible,
  rank-default M0. Retain `general_damage` as his primary formula, with ATK,
  Electric/general DMG, CRIT, DEF/RES-region, and Stun DMG Multiplier consumers.
  His retained level-60 inputs are ATK 915, CRIT Rate 19.4%, CRIT DMG 50%, and
  Energy Regen 1.2/s.
- R2. Admit Qingyi as S-Rank Electric Stun, Criminal Investigation Special
  Response Team, not Focus-eligible, rank-default M0. Her direction prioritizes
  Basic-centered `daze_buildup` and all-party Stun-window amplification while
  retaining the bounded personal-damage contribution needed by her
  Impact-to-ATK relationship, Basic/Chain modifiers, current W-Engine tradeoffs,
  variable damage mains, and effective CRIT/ATK tuning. Her retained level-60
  inputs are ATK 758, CRIT Rate 5%, CRIT DMG 50%, Impact 136, and Energy Regen
  1.2/s.
- R3. Harumasa's Additional Ability is active when another applied Agent is
  Stun or Anomaly. Qingyi's Additional Ability is active when another applied
  Agent is Attack or shares her faction. The Harumasa/Qingyi pair activates
  both. Removing or replacing the qualifying teammate removes only the exact
  relationship and its downstream Result/candidate consequences.

### Harumasa candidate and prepared setup policy

- R4. Harumasa's full W-Engine candidates are Zanshin Herb Case, Cordis
  Germina, The Brimstone, Heartstring Nocturne, and Starlight Engine.
  Non-limited retains The Brimstone and Starlight Engine. Full prepares Zanshin
  Herb Case W1; non-limited prepares The Brimstone W1.
- R5. Add Zanshin Herb Case as limited S-Rank Attack, Base ATK 713, advanced
  CRIT DMG +48%. At W1-W5 it supplies CRIT Rate +10% / 11.5% / 13% / 14.5% /
  16%, Electric Dash Attack DMG +40% / 46% / 52% / 58% / 64%, and another CRIT
  Rate +10% / 11.5% / 13% / 14.5% / 16% for 15 seconds after any squad member
  applies an Attribute Anomaly or Stuns an enemy. Harumasa is holder-eligible,
  his defining Dash action consumes the action/Attribute clause, and the
  repeated party route reaches the conditional CRIT clause. At W1 Setup
  compresses this to `CRIT Rate +20%` and `Electric Dash Attack DMG +40%`;
  Result preserves the unconditional and enabled timing surfaces without
  displaying trigger prose.
- R6. The retained Harumasa W-Engine comparisons remain whole packages:
  Cordis supplies its complete CRIT package, Electric DMG, and Basic/Ultimate
  DEF Ignore while its action scope omits defining Dash; Brimstone supplies
  broad ATK through Harumasa's Basic/Dash route; Heartstring retains its strong
  CRIT package while Fire RES Ignore is unused; Starlight retains its broad ATK
  package through Harumasa's Dodge Counter or Quick Assist route. Severed
  Innocence is excluded: Harumasa reaches only one current category stack, and
  that partial CRIT package does not survive comparison with the fully usable
  Zanshin and Heartstring packages. The stronger full-pool candidates do not
  remove the independently authored non-limited Brimstone/Starlight choice set.
- R7. Harumasa's 4-piece candidates are Shadow Harmony, Thunder Metal,
  Woodpecker Electro, and Hormone Punk. Shadow consumes his defining Dash and
  reaches its three-stack ATK/CRIT package without requiring Shock; Thunder is
  the higher-ATK Electric alternate whose Shock condition is reachable but not
  simulated; Woodpecker and Hormone retain distinct CRIT-action and entry-ATK
  packages. Candidate membership does not continuously rank uptime.
- R8. Harumasa's 2-piece candidates are Shadow Harmony, Thunder Metal,
  Woodpecker Electro, Branch & Blade Song, Hormone Punk/Astral Voice under the
  existing exact-identity relationship, and Puffer Electro. These preserve
  Dash, Electric DMG, CRIT, ATK, and DEF-region axes in legal complete packages.
  Slot 4 offers CRIT Rate, CRIT DMG, and ATK%; Slot 5 offers Electric DMG, ATK%,
  and PEN Ratio; Slot 6 offers ATK%. Effective substats are CRIT Rate, CRIT DMG,
  and ATK%; every prepared count is zero.
- R9. Full prepares Zanshin, Shadow Harmony 4-piece plus Branch & Blade
  2-piece, and ATK% / ATK% / ATK% mains. For defining Dash/Chasing Thunder,
  completed fixed CRIT Rate supply plus eight future CRIT Rate hits reaches
  95.6% without a CRIT main, so another fixed CRIT source would overspend the
  bounded opportunity while ATK remains material. Non-limited prepares
  Brimstone with Shadow plus Branch & Blade and CRIT Rate / Electric DMG / ATK%
  mains; its lower fixed CRIT supply plus the same future opportunity reaches
  75.6%, and the CRIT main brings the defining action to 99.6%. This is authored
  pool balance, not a runtime optimizer or an applied eight-hit Result.

### Qingyi candidate and prepared setup policy

- R10. Qingyi's full W-Engine candidates are Ice-Jade Teapot, Blazing Laurel,
  The Restrained, Hellfire Gears, Steam Oven, and Precious Fossilized Core.
  Non-limited retains Hellfire, Steam, and Precious. Full prepares Ice-Jade
  Teapot W1; non-limited prepares Steam Oven W5.
- R11. Ice-Jade is fully compatible with Qingyi's repeated Basic route and
  supplies Base ATK 713, advanced Impact +18%, Fully Enabled Impact +21%, and
  non-stacking squad DMG +20%. The Restrained's Basic-only DMG and Daze clauses
  both match her defining action, unlike the excluded Lycaon package. Blazing
  retains its Impact package and Fire/Ice squad-CRIT alternate for current
  eligible Focus recipients. Hellfire retains Base ATK, advanced Impact, and
  Fully Enabled Impact while its off-field Energy clause is unused; Steam
  supplies Energy Regen and broad maximum Impact +25.6%; Precious supplies
  Impact and broad two-threshold Daze +32%. Steam's repeated-EX resource/Daze
  balance selects the non-limited representative without removing Hellfire's
  higher-Base-ATK/Impact package or Precious's distinct Daze package.
- R12. Qingyi's authored base 4-piece candidates are King of the Summit, Proto
  Punk, Shockstar Disco, and Swing Jazz. King is the current crit-capable Focus
  buffer package; Proto is Qingyi's bounded current Defensive-Assist squad-DMG
  alternate with unused Shield Effect opportunity cost; Shockstar matches her
  defining Basic Daze and sufficient field responsibility; Swing is the
  Chain/Ultimate squad-DMG and Energy package. This Proto outcome is local to
  Qingyi's current direction and does not generalize Pulchra's or another Stun
  Agent's policy.
- R13. A retained external Quick Assist opportunity from Nicole, Astra Yao, or
  Pan Yinhu adds Astral Voice to Qingyi's current effective 4-piece candidates.
  It does not change the authored base set or prepared King first choice. Party
  Apply after removing the provider rebuilds Qingyi to authored King with
  Astral absent; applying a provider again rebuilds Qingyi to King with Astral
  membership available and never restores the earlier Astral selection. This
  Qingyi buffer-role outcome does not broaden the stronger repeated-Quick-
  Assist rule already authored for focused damage contributors.
- R14. Qingyi's base 2-piece candidates are Shockstar Disco, King of the
  Summit, and Swing Jazz. Selected King additionally exposes Woodpecker through
  its existing CRIT-threshold pressure. Slot 4 offers CRIT Rate, CRIT DMG, and
  ATK%; Slot 5 offers Electric DMG, ATK%, and PEN Ratio; Slot 6 offers Impact
  and ATK%. Her retained personal contribution makes CRIT Rate, CRIT DMG, and
  ATK% materially effective substats, but does not make flat PEN valid or
  displace the Daze/buffer-first complete packages.
- R15. Both pools locally prepare King 4-piece plus Shockstar 2-piece with CRIT
  Rate / Electric DMG / Impact mains and zero substat hits. Qingyi's Initial
  King basis is `5 + 24 = 29%`; nine legal CRIT hits reach 50.6%. The visible
  zero-hit setup therefore keeps King's first squad clause and a finite future
  opportunity for the threshold rather than pretending that future investment
  is already supplied. Full Ice-Jade plus Impact main and Shockstar 2-piece
  reaches 221.68 Fully Enabled Impact and Qingyi's +600 ATK conversion cap;
  non-limited Steam reaches a lower uncapped basis and does not borrow hidden
  hits or fixed supply.
- R16. Qingyi uses the already-approved Stun allocation sequence. A sole Qingyi
  King holder keeps King. With another Stun, a holder that cannot prepare
  Astral keeps King while an Astral-compatible holder takes Astral; if neither
  can prepare Astral, one bounded holder keeps King and the other uses its
  authored Shockstar fallback. With Dialyn, Dialyn keeps King because Qingyi is
  the only holder with a legal Shockstar fallback; all-party preparation assigns
  Qingyi Shockstar in every slot order. Rebuilding Qingyi beside established
  Dialyn King also prepares Qingyi Shockstar, while rebuilding Dialyn preserves
  an untouched directly edited Qingyi King duplicate because Dialyn has no
  fallback. Existing independent CRIT consumers, the Qingyi/Ju Fufu outcome,
  and current Pulchra/Lycaon ties remain intact. This requirement adds no global
  Stun score, slot-order rule, or general named-party matrix.

### Agent facts and Result projection

- R17. Harumasa's completed Core applies CRIT Rate +25% to Dash Attack: Hiten
  no Tsuru - Slash, Chasing Thunder, and Ultimate. Up to six Gleaming Edge
  stacks add CRIT DMG +12% each, reaching +72% on the same actions. Completed
  Potential Awakening supplies self ATK +12% after EX Special/Chain/Ultimate
  and makes Dash Slash and Chasing Thunder ignore Electric RES +15%. Its Core
  duration extension changes no current qualifying setup or Result outcome and
  is omitted.
- R18. Active Harumasa Additional supplies personal DMG +40% against Stunned or
  Attribute-Anomaly targets. It is broad for Harumasa's current damage outputs,
  not a party modifier. The extra Electro Prison stack and Chasing Thunder raw
  damage do not create resource or damage-output rows.
- R19. Harumasa Mindscapes apply cumulatively. M2 adds Dash Slash DMG +50% while
  Electro Blitz is available. M6 adds Electric RES Ignore +15% after Ha-Oto no
  Ya hits a Stunned or anomalous enemy; it composes with Potential's
  Dash/Chasing scope rather than replacing it. M1 stack capacity, M4 duration/
  Decibel behavior, M6 extra explosion coefficient, and M3/M5 base skill-table
  changes do not pass the current Result gate.
- R20. Harumasa Result shows ATK, CRIT Rate, CRIT DMG, applicable DMG Bonus,
  DEF Ignore, RES Ignore, and Stun DMG Multiplier only where current inputs
  create those rows. Action modifiers distinguish Dash Slash, Chasing Thunder,
  Basic, Chain, and Ultimate only when Core, Potential, Mindscape, or selected
  equipment changes the applicable value. It never reproduces ordinary base
  multipliers or final damage.
- R21. Qingyi's Flash Connect maximum spends 25 percentage points above its 75%
  threshold, adding DMG +25% and Daze +12.5% to Basic Attack: Enchanted
  Moonlit Blossoms. The workbench retains these complete action modifiers at
  Fully Enabled without exposing Voltage as an editable gauge or rotation.
- R22. Qingyi's completed Core applies up to 20 Subjugation stacks and each
  stack increases enemy Stun DMG Multiplier +4%, reaching +80% Fully Enabled.
  Her Chain Attack receives +3% DMG per stack, reaching a distinct +60% action
  modifier. Stack acquisition speed, normal/elite doubling, and reset timing do
  not change the setup decision and are omitted.
- R23. Active Qingyi Additional adds Basic Attack Daze +20%. It also converts
  each point of current Impact above 120 into +6 self ATK, capped at +600 at
  220 Impact. Result exposes the current Impact, ATK contribution, threshold,
  cap, and output without turning the relationship into an optimizer. The
  relationship reads each Result surface's current Impact and remains absent
  when Qingyi is unqualified.
- R24. Qingyi Mindscapes apply cumulatively. M1 supplies broad enemy DEF
  Reduction +15% and personal CRIT Rate +20%; M2 makes each Subjugation stack
  135% of its original value, reaching Stun DMG Multiplier +108%, and adds
  personal Daze +15% at maximum stacks; M6 adds Enchanted Moonlit Blossoms CRIT
  DMG +100% and broad enemy Attribute RES Reduction +20%. M4 shield and
  cooldown-limited Energy fail the current survival/resource Result gate;
  M3/M5 ordinary skill levels do not create base action output.
- R25. Qingyi M1 broad DEF Reduction emits the existing material broad pre-PEN
  pressure for `general_damage` recipients. It removes Slot 5 PEN Ratio and
  standalone Puffer 2-piece where applicable, but does not remove a separately
  competitive contextual Puffer 4-piece package and never affects
  `sheer_damage`. Harumasa Potential, Cordis, and other action-scoped DEF/RES
  clauses do not emit broad pressure.
- R26. Selected equipment projects independently from candidate dominance.
  Qingyi Ice-Jade squad DMG reaches every applicable current damage recipient;
  Blazing remains Fire/Ice-only; Restrained and Shockstar remain Basic/action-
  scoped; King and party Discs keep ordinary non-stacking. Harumasa Zanshin is
  Electric Dash-only, Cordis DEF Ignore remains Basic/Ultimate-only, and unused
  Heartstring Fire RES Ignore produces no Harumasa row.

### Lifecycle, UI, and source calibration

- R27. Party Apply prepares all three slots. Pool and Mindscape changes rebuild
  only the changed Agent. Direct equipment/main/substat edits never reprepare
  another Agent. Candidate reconciliation follows authorized preparation and
  clears every invalid downstream choice atomically without fallback or history
  restoration.
- R28. Setup descriptions compress complete packages separately from Result
  projection. Selected and candidate W-Engines/Discs expose the same accessible
  descriptions and exact identity artwork. Setup does not copy trigger,
  duration, stack, source-research, or action-catalogue prose.
- R29. Wire the existing original Harumasa and Qingyi portrait assets. Any
  metadata change follows fixed scale, then `headTopY`, then `faceX`, comparing
  original-asset evidence with the shared rendered desktop and narrow expanded
  and compact destinations. Metadata remains calibration for two admitted
  identities, not an Agent catalogue.
- R30. No new screen, runtime validation, evidence payload, compatibility
  registry, combat state, or shared abstraction is added unless an existing
  consumer cannot express an accepted outcome above.

## Acceptance evidence

- AE1. A Harumasa/Qingyi/third-Agent party prepares complete full and
  non-limited setups in every relevant slot order; Harumasa is Focus and both
  Additionals are active. Incomplete any required setup input empties all
  Results until repaired.
- AE2. Harumasa full and non-limited candidates and first choices match R4-R9.
  Zanshin, Cordis, Brimstone, Heartstring, and Starlight each project only their
  complete usable package; non-limited contains no limited S-Rank.
- AE3. Harumasa defining action rows compose Core, Potential, Additional,
  Zanshin/Cordis, M2, and M6 scopes without leaking Dash-only, Basic-only,
  Ultimate-only, or Electric-only values to a contrast action/Attribute.
- AE4. Qingyi full and non-limited candidates and first choices match R10-R15.
  Prepared King starts at 29%, its output changes at 50%, and zero supplied hits
  remain visible. Ice-Jade reaches the Impact-to-ATK cap while Steam's prepared
  zero start remains below it.
- AE5. Qingyi Result shows Enchanted Basic DMG/Daze, Basic Additional Daze,
  Subjugation Stun multiplier, Chain DMG, Impact-derived ATK, and representative
  M1/M2/M6 differences without raw damage, raw Daze, Voltage, shield, or Energy
  event rows.
- AE6. Qingyi M0 -> M1 -> M0 -> M1 covers broad pressure absent, present,
  removed, and reintroduced. An edited Harumasa/general-damage PEN choice clears
  without fallback at M1, membership returns at M0 without history, and a Sheer
  contrast remains unaffected.
- AE7. A retained Quick Assist provider adds Qingyi Astral contextually. Party
  Apply without the provider rebuilds Qingyi to authored King with Astral
  absent; reapplying a provider rebuilds King and restores Astral membership
  without restoring the earlier selection. A no-provider contrast keeps the
  authored base set.
- AE8. One reducer journey across party re-application traverses Focus King
  assignment, flexible King/Astral allocation, Qingyi/Ju Fufu and Qingyi/Dialyn
  no-Astral King/Shockstar allocations, a separate contextual-Astral party,
  preparation, selected pressure, and Result non-stacking in permanent-
  authority order. Target-only rebuilds cover both directions of each rigid
  pairing, change only their target, and preserve any legal direct duplicate
  elsewhere.
- AE9. Existing Trigger/Lycaon/Pulchra/Ju Fufu King and Astral outcomes,
  Nicole/Astra/Pan Quick Assist cases, Spectral broad pressure, and current
  non-stacking Result behavior remain unchanged in representative tests.
- AE10. Original assets and desktop/narrow expanded/compact portraits are
  inspected in the in-app Browser at `127.0.0.1:5173`; both Agents' complete
  Setup, candidate copy, gauges, action rows, pool changes, pressure lifecycle,
  and incomplete Result boundary have no clipping, overflow, console error, or
  inaccessible control.

## Non-goals and rejected alternatives

- No Voltage, Electro Quiver, Electro Prison, Gleaming Edge duration, Shock,
  Decibel, Energy-spending cadence, field-time, rotation, or uptime model.
- No ordinary skill coefficients, final damage/Daze, M6 explosion output,
  shield/healing result, or event Energy normalization.
- No runtime equipment optimizer, arbitrary package score, exact substat
  farming distribution, dynamic main-stat recommendation, or named-Agent Stun
  priority table.
- Do not generalize Qingyi/Pulchra Proto evidence, Qingyi Astral context, or the
  accepted two-Stun tie outcome beyond their exact current consumers.
- Do not turn action-limited Cordis, Potential, M2, M6, or Zanshin clauses into
  broad candidate pressure.
- No Agents, W-Engines, Discs, formulas, or content first introduced after the
  permanent Version-2.8 admission boundary.
