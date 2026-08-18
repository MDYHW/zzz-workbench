---
date: 2026-08-12
topic: yidhari-manato-vertical
---

# Yidhari And Manato Vertical

## Summary

Admit Yidhari and Manato from the initial Version-2.8 content cohort using
their current released facts. Both are Focus-eligible Rupture damage dealers
and reuse the current Rupture conversion, Sheer Damage formula, authored
candidate, pool-specific representative, preparation, direct-edit,
completeness, provider, Result, Rank, and portrait mechanisms.

Yidhari adds Ice Sheer Damage, a self-reachable Ether Veil: Wellspring,
low-HP modifiers, and a Stun-or-Support-qualified Additional Ability. Manato
adds Fire Sheer Damage, Molten Edge modifiers, action-scoped CRIT DMG, and the
generic A-Rank M6 default. The vertical also corrects two shared relationships
that the new consumers expose: Lucia's Additional Ability is conditional on
another Rupture or Stun Agent, and identical Ether Veil: Wellspring Max HP
effects do not stack.

This work does not add a rotation, resource-cadence model, raw damage output,
an equipment optimizer, a named-party catalogue, or per-Agent framework.

---

## Problem Frame

The current workbench can already represent Rupture conversion through
Yixuan, provider composition through Lucia, pool-specific whole-package
representatives, typed Rank defaults, complete prepared setups at zero
supplied substats, and action-specific Result differences. Yidhari and Manato
must extend those meanings instead of inventing parallel Agent-local policy.

Candidate membership and a prepared representative are different decisions.
Every retained W-Engine must first be legal for the Rupture holder, then be
compared by its complete usable and unused package, exact current consumer,
same-pool competitor, and finite slot/substat opportunity cost. A full pool
does not force a limited S-Rank first choice: Manato's refined A-Rank signature
may remain first when its whole package is stronger for his current direction.
Conversely, a partial package can remain a candidate when its usable axes are
still competitive and distinct.

Drive Disc comparison follows the same rule. CRIT Rate, CRIT DMG, Attribute
DMG, HP, and ATK cannot be treated as equal-looking interchangeable values.
The current Rupture conversion makes HP the stronger scalable Sheer Force axis
for both Agents, while bounded CRIT and Attribute DMG choices remain valuable
because future substats are finite and other modifiers can become saturated.

---

## Actors

- A1. Setup workbench user: applies a party containing Yidhari or Manato,
  receives a complete starting setup for the selected pool, adjusts competitive
  inputs, and reads the resulting stat and modifier surfaces.
- A2. Workbench session: resolves Rank default, pool, Mindscape, preparation,
  candidate membership, completeness, party qualifications, non-stacking
  effects, and synchronous Result recalculation.
- A3. Content author: retains only current facts that have a setup, formula,
  action, threshold, provider, or visible Result consumer.

---

## Key Flows

- F1. New Focus application
  - **Trigger:** The user applies Yidhari or Manato as Focus.
  - **Steps:** The session prepares all three party setups for their current
    pools, initializes every effective substat count to zero, and calculates
    only after all selections are complete.
  - **Outcome:** The new Focus has the same compact/expanded Setup and Result
    experience as the established Agents.
  - **Covered by:** R1-R5, R14-R18, R25
- F2. Pool-specific representative
  - **Trigger:** The user switches a new Agent between full and non-limited
    W-Engine pools.
  - **Steps:** Only that Agent is rebuilt from the authored representative for
    the new pool; the other two setups remain unchanged.
  - **Outcome:** Yidhari changes between Kraken's Cradle W1 and Grill O'Wisp
    W5. Manato keeps Grill O'Wisp W5 in both pools because that conclusion was
    independently established from the complete packages.
  - **Covered by:** R6-R13, R17-R18, R25
- F3. Party-qualified modifiers
  - **Trigger:** A party gains or loses a qualifying Specialty relationship.
  - **Steps:** Yidhari's own Additional CRIT DMG follows another Stun or
    Support Agent. Lucia's squad CRIT DMG follows another Rupture or Stun
    Agent. Candidate membership and direct setup selections do not change.
  - **Outcome:** Result adds or removes only the qualified modifier and
    recalculates the affected surfaces.
  - **Covered by:** R19-R20, R25
- F4. Shared Wellspring
  - **Trigger:** Yidhari, Lucia, or both activate Ether Veil: Wellspring in a
    complete party.
  - **Steps:** Each legal provider retains its own source origin, while the
    identical squad Max HP +5% relationship uses one non-stacking identity.
  - **Outcome:** One provider grants +5%; two providers still grant +5%, not
    +10%.
  - **Covered by:** R21, R25
- F5. Mindscape and direct editing
  - **Trigger:** The user changes Mindscape or directly selects another valid
    W-Engine, Disc, main stat, or effective-substat count.
  - **Steps:** A Mindscape change rebuilds only that Agent. A direct edit keeps
    the remaining setup inputs. Result becomes empty if a required selection
    is incomplete and otherwise recalculates immediately.
  - **Outcome:** Mindscape clauses change their exact Result consumers without
    introducing hidden fallback or runtime optimization.
  - **Covered by:** R22-R25

---

## Requirements

### Admission, identity, and shared formula

- R1. Admit Yidhari and Manato beside the current eleven Agents. Yidhari is
  S-Rank, Ice, Rupture, and Focus-eligible. Manato is A-Rank, Fire, Rupture,
  and Focus-eligible. Their Spook Shack faction is not retained because no
  current setup, qualification, provider, or Result consumer uses it.
- R2. The generic Rank mechanism prepares Yidhari at M0 and Manato at M6.
  Rank remains a typed identity used by both the compact and expanded Agent
  surfaces; no Agent-name default branch is added.
- R3. Retain completed level-60 and maximum Core values only where a current
  consumer exists. Yidhari retains Max HP 8497, ATK 859, CRIT Rate 19.4%, and
  CRIT DMG 50%. Manato retains Max HP 7725, ATK 755, CRIT Rate 5%, CRIT DMG
  50%, and completed Core HP +18%. His ATK includes the completed Base ATK
  enhancements; the three HP +6% Core enhancements remain an explicit Initial
  percentage contribution rather than being misread as flat HP. Do not retain
  unused DEF, Impact, Anomaly, resource, or survival values.
- R4. Both Agents participate primarily in `sheer_damage`. Reuse one shared
  current Rupture conversion: `Current ATK × 0.30 + Current Max HP × 0.10`.
  Their matching Attribute damage is Sheer Damage, uses Sheer Force, and omits
  DEF and PEN. Do not duplicate the conversion as new Agent-local policy.
- R5. Yidhari and Manato have no current Potential Awakening consumer. Do not
  create an empty or guessed Potential record.

### Yidhari W-Engine authoring

- R6. Yidhari's full W-Engine candidates are Kraken's Cradle, Grill O'Wisp,
  Cauldron of Clarity, Qingming Birdcage, Radiowave Journey, and Puzzle Sphere.
  Her non-limited candidates are Grill O'Wisp, Cauldron of Clarity, Radiowave
  Journey, and Puzzle Sphere. All are legal Rupture W-Engines.
- R7. Retain Kraken's Cradle at W1 as Base ATK 713 and HP +30%. Fully Enabled
  adds Ice Sheer DMG +6% per HP-decrease stack, up to three stacks, and CRIT
  Rate +20% at or below 50% Max HP. Every clause is usable by Yidhari.
- R8. Retain Grill O'Wisp at W5 as Base ATK 624 and HP +25%. Fully Enabled adds
  CRIT Rate +24% after HP decreases. Its Fire DMG +24% is retained in the
  equipment package but has no Yidhari Result consumer.
- R9. Reuse Cauldron of Clarity W5, Qingming Birdcage W1, Radiowave Journey W5,
  and Puzzle Sphere W5 with their established exact packages. Yidhari can
  maintain Cauldron through her EX-class tentacle, can use Qingming's HP and
  CRIT but not its Ether clauses, can use Radiowave's direct Sheer Force, and
  can use Puzzle's ATK-fed Rupture conversion plus EX Special CRIT DMG and DMG.
- R10. Wrathful Vajra and Starlight Rider Faceplate are excluded from Yidhari's
  candidates. Each offers the same usable HP +30% and CRIT Rate +20% axes as
  Qingming while supplying lower Base ATK and an Attribute-specific passive
  that Yidhari cannot use. Exact identity therefore does not rescue either
  dominated package. Kraken is the contrast: its Ice passive is fully usable
  and materially changes the whole package.
- R11. Yidhari's full representative is Kraken's Cradle W1. Her non-limited
  representative is Grill O'Wisp W5. Kraken's fully usable Ice Sheer package
  establishes the full choice; Grill narrowly leads the non-limited same-pool
  alternatives through HP and reachable CRIT despite its unused Fire clause.

### Manato W-Engine authoring

- R12. Manato's full W-Engine candidates are Grill O'Wisp, Wrathful Vajra,
  Qingming Birdcage, Radiowave Journey, and Puzzle Sphere. His non-limited
  S-Rank pool candidates are Grill O'Wisp, Radiowave Journey, and Puzzle
  Sphere. All three retained A-Ranks remain available under SW-010's current
  non-limited S-Rank boundary.
- R13. Grill O'Wisp is fully usable by Manato: at W5 it supplies Base ATK 624,
  HP +25%, Fire DMG +24%, and reachable CRIT Rate +24% after HP decreases.
  The unconditional Fire DMG enters at Combat while the HP-decrease CRIT Rate
  enters at Fully Enabled.
  Wrathful Vajra W1 supplies Base ATK 713, HP +30%, CRIT Rate +20%, and Fire
  Sheer DMG +9% per EX Special stack, up to two stacks. Qingming supplies a
  larger Base ATK plus HP and CRIT while its Ether clauses remain unused.
  Radiowave and Puzzle retain their distinct direct-Sheer-Force and
  EX-specialized CRIT packages. Cauldron is excluded for Manato: at W5 its Base
  ATK 594, HP +25%, general DMG +24%, and CRIT Rate +13% occupy Grill's same
  usable Fire-DMG/HP/CRIT direction while losing Base ATK and 11% CRIT Rate.
  It creates no separate formula, action, recipient, or operation choice.
- R14. Kraken's Cradle and Starlight Rider Faceplate are excluded from Manato's
  candidates. Qingming is the nearest same-axis usable competitor: it has the
  same unconditional HP and CRIT package, greater Base ATK, and does not make
  those benefits conditional on low HP. Kraken's Ice and Starlight's Physical
  clauses are unusable by Manato. Wrathful is the contrast because its exact
  Fire clause is usable and keeps it competitive.
- R15. Grill O'Wisp W5 is Manato's representative in both full and non-limited
  pools. This does not collapse the pools: full retains Wrathful and Qingming
  as additional candidates. Grill's complete Fire DMG, HP, and CRIT package is
  the independently supported first choice; full-pool access alone does not
  force the strongest-rarity item into preparation.

### Drive Discs, main stats, and finite opportunity

- R16. Yidhari's only 4-piece candidate is Yunkui Tales. Her 2-piece candidates
  are Woodpecker Electro, Branch & Blade Song, and Polar Metal, subject to the
  different-set rule. Her main-stat candidates are CRIT Rate or CRIT DMG in
  Slot 4, Ice DMG or HP% in Slot 5, and HP% in Slot 6. Her effective substats
  are CRIT Rate, CRIT DMG, and HP%.
- R17. Yidhari prepares Yunkui 4-piece, Branch & Blade 2-piece, CRIT Rate /
  Ice DMG / HP% mains, and zero supplied substat hits in both pools. After the
  bounded eight-hit CRIT Rate and CRIT DMG opportunity is included, Branch and
  the CRIT Rate main keep the complete package below the 100% CRIT Rate cap
  while balancing the large qualified low-HP CRIT DMG supply. Polar Metal
  remains a distinct Ice-DMG complement: a completed setup with greater
  effective-substat investment can favor its fixed modifier even though it is
  not the zero-substat representative. ATK sets supply a materially weaker
  Rupture-conversion increase than the retained CRIT and Ice alternatives.
- R18. Manato's only 4-piece candidate is Yunkui Tales. His 2-piece candidates
  are Woodpecker Electro, Branch & Blade Song, and Inferno Metal. His main-stat
  candidates are CRIT Rate or CRIT DMG in Slot 4, Fire DMG or HP% in Slot 5,
  and HP% in Slot 6. His effective substats are CRIT Rate, CRIT DMG, and HP%.
  He prepares Yunkui 4-piece, Woodpecker 2-piece, CRIT DMG / Fire DMG / HP%
  mains, and zero supplied hits in both pools. Woodpecker balances the large
  action-scoped CRIT DMG supplied by his maximum Core. After the W-Engine is
  authored, the conservative finite-hit opportunity distinguishes Woodpecker as
  the balanced 2-piece first choice for his defining HP-consuming Basic and
  Assist output. Branch remains a direct CRIT-axis edit and Inferno remains a
  distinct regular-DMG edit. ATK 2-piece sets are excluded because their 10%
  ATK contribution through the 0.30 conversion is dominated by the retained
  CRIT and Fire alternatives.
- R19. After each damage direction's pool-specific W-Engine package is fixed, a
  conservative eight-hit future opportunity in each retained substat may help
  balance the legal complete Disc package, main stats, and retained CRIT and HP
  inputs; prepared counts remain zero. For each Agent, one HP% hit contributes
  materially more Sheer Force than one ATK% hit in that bounded comparison.
  HP% is therefore retained and ATK% is not retained merely because ATK still
  participates positively in the shared conversion. This comparison does not
  define a universal eight-hit distribution, admit a low-value stat, or reopen
  the authored W-Engine choice as a runtime score.

### Party qualification and non-stacking provider relationships

- R20. Yidhari's Additional Ability is active only when another applied Agent
  is Stun or Support. When qualified and Yidhari is below 50% Max HP, Fully
  Enabled CRIT DMG increases by 50% at maximum Core. The damage-reduction and
  tentacle damage are not Result metrics; the tentacle remains only the exact
  EX-class action relationship needed by Yunkui and Cauldron authoring.
- R21. Lucia's existing Additional Ability is active only when another applied
  Agent is Rupture or Stun. Its Darkbreaker CRIT DMG +30% is delivered to the
  squad only while qualified. Yixuan, Yidhari, Manato, Dialyn, Trigger, and
  Lycaon are qualifying current examples; Corin and unrelated Specialties are
  contrasts. The behavior uses one shared party predicate rather than a named
  recipient list.
- R22. Yidhari's Ether Veil: Wellspring and Lucia's Ether Veil: Wellspring each
  deliver squad Max HP +5% on Fully Enabled. The identical relationship has one
  non-stacking identity. With both providers selected, Result retains both
  legal origins for explanation but applies the value once. Removing either
  provider leaves the remaining provider as the ordinary sole origin. This
  non-stacking rule does not merge distinct engine Max HP clauses or Yidhari
  M4's self-only Max HP clause.

### Agent and Mindscape Result behavior

- R23. Yidhari Result exposes Max HP, ATK, Sheer Force, CRIT Rate, CRIT DMG,
  regular Ice DMG Bonus, Ice Sheer DMG Bonus, and applicable RES Ignore through
  the established surfaces. Her low-HP relationships are Fully-Enabled-window
  projections, not a new editable HP-state input. Fully Enabled retains maximum-Core low-HP DMG
  +100%, qualified low-HP CRIT DMG +50%, M1 Basic/EX Ice RES Ignore +20%, M2
  CRIT DMG +40%, M4 self Max HP +5% inside Wellspring, and M6 Sheer DMG +25%.
  Resource gain, duration management, healing, survival, and raw damage remain
  absent.
- R24. Manato Result exposes Max HP, ATK, Sheer Force, CRIT Rate, CRIT DMG,
  regular Fire DMG Bonus, Fire Sheer DMG Bonus, and applicable RES Ignore.
  Fully Enabled retains maximum-Core Molten Edge CRIT Rate +10% and Fire DMG
  +20%; HP-consuming Basic Attack and Assist Follow-Up receive CRIT DMG +50%.
  M1 adds up to Fire DMG +20% to Basic Attack and Assist Follow-Up, M2 adds Fire
  RES Ignore +8% while Molten Edge is active, M4 adds Max HP +8%, and M6 adds
  up to Fire DMG +15% to Assist Follow-Up. Resource, healing, survival, and raw
  damage remain absent.
- R25. Mindscape and pool changes rebuild only the changed Agent. Party changes
  rebuild all three setups. Direct edits remain local. Result remains absent
  until every required setup input is complete. Neither new Agent introduces
  selected-input-derived candidate pressure or automatic restoration.

---

## Acceptance Examples

- AE1. Applying Yidhari/Lycaon/Lucia prepares Yidhari at M0 with Kraken W1,
  Yunkui/Branch & Blade, CRIT Rate / Ice DMG / HP%, and zero effective hits. Her
  Additional Ability is qualified, Lucia's Additional Ability is qualified,
  and the two Wellspring providers contribute Max HP +5% exactly once while
  both equal legal origins remain visible in the expanded breakdown. Removing
  either provider leaves one ordinary contributing origin.
- AE2. Applying Yidhari/Anby: Soldier 0/Seed leaves Yidhari's Additional
  Ability unqualified because neither teammate is Stun or Support. Her base
  candidates and prepared equipment are unchanged; only the qualified CRIT DMG
  contribution is absent.
- AE3. Switching Yidhari to non-limited rebuilds only her setup with Grill W5
  and preserves the remaining Disc package. Her candidate list excludes
  Kraken, Qingming, Wrathful, and Starlight; direct engine edits do not change
  Disc membership.
- AE4. Applying Manato/Lucia/Astra Yao prepares M6 Manato with Grill W5,
  Yunkui/Woodpecker, CRIT DMG / Fire DMG / HP%, and zero effective hits. Lucia's
  Additional is qualified by Manato. Applying Lucia/Astra Yao/Seed instead
  removes Lucia's CRIT DMG because neither teammate is Rupture or Stun and,
  under the existing party-change rule, rebuilds all three setups. Reapplying a
  Rupture or Stun party restores qualification through fresh preparation, not
  by restoring an old direct edit.
- AE5. Switching Manato between full and non-limited retains Grill W5 as the
  prepared engine while full alone exposes Wrathful and Qingming. Selecting
  Wrathful projects its usable CRIT and fully reachable Fire Sheer clauses;
  selecting Qingming projects HP/CRIT but no Ether-only clause.
- AE6. At Manato M6, Basic Attack and Assist Follow-Up show the Core CRIT DMG
  difference, both show M1 Fire DMG, only Assist Follow-Up shows M6 Fire DMG,
  and M2 Fire RES Ignore affects only Fire Sheer Damage. Changing to M0 removes
  those Mindscape sources and rebuilds only Manato.
- AE7. Removing any required engine, refinement, Disc, or main stat from either
  new Agent makes Result empty. Repairing the input recalculates through the
  ordinary flow without hidden fallback.
- AE8. Rank and portrait surfaces show Yidhari as S and Manato as A in compact
  and expanded states. Portrait calibration follows the shared source-metadata
  sequence and rendered acceptance owned by the UI design rules rather than
  copying another Agent's coordinates. The shared party editor can draft either
  Agent and apply that Agent as Focus.
- AE9. One shared mechanism test changes a recipient's Current Max HP through a
  legal all-party provider and proves the same `Current ATK × 0.30 + Current Max
  HP × 0.10` recomposition for existing Yixuan and a new Rupture Agent. A new
  Agent receives both its own self clause and Lucia's applicable all-party
  clauses through the generic provider delivery path.

---

## Rejected Alternatives

- Treat every legal Rupture W-Engine as a candidate: rejected because the
  workbench retains competitive decisions, not a catalogue.
- Force a limited S-Rank representative in the full pool: rejected because a
  pool defines availability, while preparation follows the complete package.
- Exclude any partially usable W-Engine: rejected because Qingming remains a
  competitive HP/CRIT package even though its Ether clauses are unused.
- Add ATK substats or ATK 2-piece sets because Rupture conversion contains ATK:
  rejected because finite opportunity and the exact 0.30/0.10 conversion make
  the retained HP/CRIT/Attribute alternatives materially stronger here.
- Model Adrenaline, Blazing Heart, Decibels, uptime, or rotations: rejected
  because no current Setup or Result choice requires those systems.
- Add named Yidhari/Lucia or Lucia/Rupture party rules: rejected because the
  current consumers are exact Specialty predicates and a shared non-stacking
  effect identity.
- Retain Spook Shack for schema symmetry: rejected because faction is retained
  only when a current consumer needs it.

---

## Success Criteria

- Both Agents are selectable Focuses with complete pool-specific starting
  setups and editable competitive candidates.
- Every retained equipment clause has the correct holder, Attribute, action,
  surface, refinement, and recipient behavior; unusable clauses remain visible
  in Setup when needed for whole-package identity but do not affect Result.
- The shared Rupture conversion has one implementation meaning across Yixuan,
  Yidhari, and Manato.
- Lucia Additional qualification and Wellspring non-stacking are proven by
  shared present, absent, and contrasting consumer tests.
- Existing eleven-Agent preparation, direct edits, formulas, keyboard behavior,
  responsive layout, and visual language remain unchanged.

## Scope Boundaries

- In scope: Yidhari, Manato, the exact equipment facts they consume, shared
  Rupture calculation, Lucia qualification correction, Wellspring non-stacking,
  typed admission, preparation, Result, tests, and portrait calibration.
- Out of scope: other Version-2.8 Agents, Bangboo selection, enemy selection,
  raw damage/Daze, rotations, resource cadence, farming or ownership data,
  runtime scoring, generalized eligibility schema, and a per-Agent test suite.

## Dependencies And Outstanding Questions

- No product decision or external-fact blocker remains.
- The five permanent authorities own all required semantics; no permanent
  authority change is warranted.
- Implementation planning must map these requirements onto current shared
  content, preparation, provider, calculation, Result, and portrait seams
  without introducing a parallel vertical architecture.
