---
date: 2026-08-14
topic: banyue-starlight-billy-authority-recovery
---

# Banyue And Starlight Billy Authority Recovery

## Summary

Recover the missing bounded owner for Banyue and Starlight Billy. Current code
and tests were audited against the permanent product, source, formula,
vocabulary, and UI owners and the nearest supported Rupture consumers. The
audit supports current behavior and requires no production change.

Both are S-Rank Focus-eligible Rupture damage dealers using the shared Sheer
Force conversion. They share a Yunkui/CRIT/HP preparation shape but retain
different Attribute, action, party, W-Engine, and Mindscape consequences.
Similarity does not justify a named-agent abstraction or a shared Result
projection.

## Owning Rules And Contrasts

- The product contract owns focus admission, competitive candidates,
  independent pool representatives, finite opportunity, preparation, direct
  edits, completeness, and visible results. Yidhari and Manato are the closest
  ordinary Rupture contrasts.
- Formula mechanics own `Current ATK × 0.30 + Current Max HP × 0.10`, the order
  of HP/ATK composition, Sheer Damage, CRIT, Attribute modifiers, action scopes,
  and RES effects. The source boundary owns which source-stated modifiers and
  operations survive, excluding rotation and raw output.
- Vocabulary owns Rupture, W-Engine holder compatibility, Attribute, Rank, and
  Mindscape. UI rules own shared setup summaries, sources, and responsive
  presentation without creating a build catalogue.

## Requirements

### Shared admission and formula

- R1. Banyue is S-Rank Fire Rupture; Starlight Billy is S-Rank Physical
  Rupture. Both are M0 by default and Focus-eligible. No faction is retained
  without a current qualification consumer. Both participate primarily in
  `sheer_damage` and reuse the one shared current Rupture conversion.
- R2. Each retains Max HP 8497, ATK 859, CRIT Rate 19.4%, and CRIT DMG 50%.
  Matching Attribute DMG modifies completed Sheer damage. HP% is the materially
  stronger scalable conversion input than ATK%, while CRIT and Attribute remain
  independently valuable within finite opportunity. This is the same permanent
  route as Yidhari/Manato, not a runtime optimizer.

### Banyue current behavior

- R3. Banyue's completed Core adds Sheer Force +300, Fire DMG +36%, and CRIT DMG
  +36%. His Additional Ability is active with another Stun or Support Agent and
  adds three stacks of Fire DMG +5% (15%). M6 forces that condition and adds
  three further +8% stacks (24%). These are exact Fire Sheer recipients.
- R4. Banyue Mindscapes apply cumulatively. M1 adds enemy Fire RES Reduction
  10%, Tremor-action Sheer DMG +10%, and Crushing Peaks Stun Duration +2s. M2
  adds Core CRIT DMG +15% and Fire DMG +15%. M4 adds +30% DMG to the four named
  wrath/toppling actions. M6 adds a source-stated Crushing Peaks +600% Sheer
  Force operation. Unretained raw damage, state cadence, and rotation stay out.
- R5. Banyue's full W-Engine candidates are Wrathful Vajra, Qingming Birdcage,
  Cauldron of Clarity, Grill O'Wisp, and Puzzle Sphere. Non-limited candidates
  are Cauldron, Grill, and Puzzle. All are Rupture-holder legal; exact Attribute
  and action compatibility determines usable clauses.
- R6. Full prepares Wrathful W1; non-limited prepares Cauldron W5. Wrathful's
  HP/CRIT and Fire EX Sheer package is fully compatible. Qingming remains a
  competitive high-base HP/CRIT partial package though Ether clauses are unused.
  Cauldron's broad package, Grill's Fire package, and Puzzle's EX package retain
  their exact projections. Full and non-limited choices are independent authoring
  conclusions, not one ranking filtered by availability.
- R7. Banyue's only 4-piece candidate is Yunkui Tales. Two-piece candidates are
  Woodpecker Electro, Branch & Blade Song, and Inferno Metal. Main choices are
  CRIT Rate/CRIT DMG, Fire DMG/HP%, and HP%. Effective substats are CRIT Rate,
  CRIT DMG, and HP%. Full prepares Branch & Blade; non-limited prepares
  Woodpecker; both use CRIT Rate/Fire DMG/HP% and zero supplied hits.

### Starlight Billy current behavior

- R8. Starlight Billy's completed Core adds CRIT DMG +90%. His Additional
  Ability is active with another Stun, Defense, or Support Agent and adds two
  +20% DMG stacks (40%) to Full-Throttle Basic, EX Special, Chain Attack, and
  Ultimate. The action recipients remain exact rather than becoming broad DMG.
- R9. Mindscapes apply cumulatively. M1 adds Physical RES Ignore +18%. M2 adds
  +50% DMG to Full-Throttle, Cool Wheelie, and Ultimate plus Cool Wheelie CRIT
  DMG +50%. M4 adds two Core CRIT DMG +8% stacks. M6 adds Full-Throttle and
  Ultimate Sheer DMG +18% and a bounded two-stack +100% Sheer Force operation.
  Resource, rotation, and raw final output remain absent.
- R10. Full W-Engine candidates are Starlight Rider Faceplate, Qingming
  Birdcage, Cauldron of Clarity, Steel Cushion, Grill O'Wisp, and Puzzle Sphere.
  Non-limited candidates are Cauldron, Steel, Grill, and Puzzle. Every item can
  be equipped; the Rupture passives are holder-compatible, while Steel's Attack
  passive remains inactive even though its advanced stat is usable.
- R11. Full prepares Starlight Rider Faceplate W1; non-limited prepares Cauldron
  W5. Faceplate's HP/CRIT/Physical Sheer package is fully compatible. Steel is
  the partial-but-competitive contrast: its CRIT advanced stat remains usable,
  while its Attack-holder Physical passive is inactive and therefore projects
  no damage clause. An ineligible holder item would not be admitted at all.
  Qingming remains a competitive partial HP/CRIT package despite unused Ether.
- R12. Candidate membership follows whole-package opportunity cost, while exact
  Result projection follows the selected engine's actual holder and activation
  compatibility. A competitive partial candidate does not gain its unused
  clause, and candidate dominance does not define Result.
- R13. Starlight Billy's only 4-piece candidate is Yunkui. Two-piece candidates
  are Woodpecker, Branch & Blade, and Fanged Metal. Main choices are CRIT Rate/
  CRIT DMG/HP% in Slot 4, Physical DMG/HP% in Slot 5, and HP% in Slot 6.
  Effective substats are CRIT Rate, CRIT DMG, and HP%. Full prepares Branch;
  non-limited prepares Woodpecker; both use CRIT Rate/Physical DMG/HP% and zero
  supplied hits.

### Finite opportunity, lifecycle, and acceptance

- R14. For both Agents, the pool-specific engine is fixed before balancing the
  legal Disc package. The conservative authoring check reserves at most eight
  future hits on each retained CRIT and HP axis, clamps formula-valued CRIT Rate
  at 100%, and preserves a useful CRIT-stability balance. Prepared inputs remain
  zero. It does not allocate exact Disc lines, account for main-stat exclusion
  per physical Disc, or react to edited counts.
- R15. Banyue's fixed full package and Starlight Billy's large Core CRIT DMG
  still support the same full Branch/CRIT Rate visible first choice; their
  non-limited Cauldron packages support Woodpecker/CRIT Rate. Manato is the
  superficially similar contrast that prepares Woodpecker/CRIT DMG because his
  action-scoped CRIT package and retained axes create a different whole-package
  balance.
- R16. Party Apply rebuilds all three setups. Pool and Mindscape changes rebuild
  only the changed Agent. Direct edits remain local, never re-run preparation,
  and clear any now-invalid selection without fallback or restoration. Result
  stays empty until all required inputs are complete; zero substats are complete.
- R17. Result exposes each Agent's Max HP, ATK, Sheer Force, CRIT, matching
  regular and Sheer modifiers, exact action differences, applicable RES/Stun
  modifiers, and retained operations. It never reports raw/final damage.
- R18. Shared tests cover the Rupture conversion beside Yidhari/Manato, full and
  non-limited zero-substat representatives, Faceplate fully usable versus Steel
  partial/inactive-passive projection, both Additional predicates, representative
  Mindscape action scopes, incomplete repair, and target-only rebuilds. Tests
  prove fidelity only after the permanent-authority trace succeeds.

## Rejected Alternatives And Boundaries

- Do not retain ATK substats merely because the shared conversion contribution
  is numerically positive; finite opportunity and stronger current axes govern
  material effectiveness.
- Do not infer a universal Rupture candidate or representative table from these
  two similar packages, and do not use candidate membership as a Result formula.
- Do not add a rotation, resource model, raw/final damage, raw Daze, inventory,
  equipment ranker, farming simulation, exact Disc-line optimizer, or evidence
  payload.

## Status

The read-only recovery audit found no mismatch in the sampled supported Banyue
or Starlight Billy consumers. No production change is required for these two
verticals; this conclusion does not assert repository-wide correctness.
