---
date: 2026-08-25
topic: miyabi-general-damage-expansion
status: ready-for-plan
---

# Miyabi Bounded General-Damage Expansion Requirements

## Summary

Add Hoshimi Miyabi as the bounded unit after the completed ordinary Anomaly
damage/buildup track. Miyabi is an Anomaly Specialty Agent, but her admitted
personal damage direction is `general_damage`: her direct Frost actions use
ATK, CRIT, ordinary DMG Bonus, PEN, DEF, and RES relationships. Her separate
Frost buildup relationships participate in `anomaly_buildup`. Attribute
Anomaly state is therefore a condition and interaction, not permission to add
`anomaly_damage` or its AP damage surface.

This unit applies `SF-001`-`SF-004`, `GV-001`-`GV-004` and `GV-009`,
`FM-001`-`FM-004` and `FM-006`-`FM-011`, `SW-002`-`SW-016`, and
`UI-001`-`UI-004`. It settles Miyabi only. Anton and Rina remain the next
separate Shock-state/general-damage unit.

## Authority And Consumer Decision Map

| Rule | Retained relationship | Exact current consumer | Candidate/prepared and lifecycle consequence | Setup/Result consequence | Similar / contrast |
| --- | --- | --- | --- | --- | --- |
| `GV-004`, `FM-002`, `FM-007` | Display Attribute Frost calculates through Ice for damage, buff, and equipment applicability while remaining a distinct Agent identity | `effectAttributeForAgent`, `FORMULA_PARTICIPATION_BY_AGENT`, and `attackProfileFor` | Ice clauses compete; same-Attribute party qualification still compares the displayed Agent identity; all existing preparation stages remain unchanged | Setup displays Frost identity and source-owned Ice equipment wording; Result projects general damage and buildup, never `anomaly_damage` | Honed Edge to Physical is the nearest mapping; ordinary Ice Agent Ellen is the identity contrast |
| `SF-001`, `SF-003`, `FM-004`, `SW-013`, `SW-014` | Fully Enabled CRIT Rate converts one-for-one into Frost buildup bonus against an Icefire target, capped at 80% | `post-delivery-stat-modifier-gauge` and the action Result composer | CRIT is a finite setup opportunity for both direct damage and buildup; the prepared package does not add a new runtime Icefire state model | Result exposes the gauge and an action-local Frost-buildup row; resource, cadence, and hidden state remain absent | Burnice's AP-derived Afterburn gauge is nearest; Trigger's CRIT-to-Daze conversion is the different-formula contrast |
| `FM-002`, `FM-007`, `SW-012` | Frostburn supplies a party buildup outcome; qualified Shimotsuki and Mindscape clauses remain exact local or party outcomes | current provider delivery and action projection | Qualification uses another Support, Anomaly, or Section 6 member; Party Apply and target-only rebuild recalculate it through current state | Separate action rows prevent Icefire and Frostburn target conditions from being summed as one universal snapshot | Nangong's action-scoped party buildup is nearest; Yuzuha's broad AM-derived provider is the contrast |
| `SW-004`, `SW-005`, `SW-008`, `SW-009`, `UI-001` | Each selected W-Engine and Disc remains a source-owned whole package; Result filters only consumable clauses | shared equipment facts, selected relationship mappers, candidates, representatives, and Setup descriptions | Full prepares Hailstorm; non-limited prepares Fusion; positive partial packages survive only when their remaining axes are materially distinct at zero and finite future substats | Setup keeps each admitted package; Result omits AP, Abloom, Physical, wrong-Specialty, and off-field-only clauses Miyabi cannot consume | Hailstorm is the complete same-identity case; Marcato is the legal partial contrast |
| `SW-015` | Authored/contextual candidates, pressure, allocation, representative preparation, zero supplied counts, and reconciliation keep their current order | shared lifecycle, preparation, and candidate-context consumers | Party Apply rebuilds all; pool/Mindscape rebuilds only Miyabi; direct edits do not reprepare; invalid PEN clears without fallback and never restores edit history | Incomplete required selection keeps Result empty; an unaffected no-PEN holder is preserved | Existing broad pre-PEN lifecycle is the nearest case; a prepared Ice Slot 5 is the unaffected contrast |

## Requirements

### Identity, formula, and retained outcomes

- R1. Add Miyabi as S-Rank Frost Anomaly, Section 6, M0 by default,
  Focus-eligible, with an on-field operating interval. Retain completed
  level-60/full-Core ATK 880, CRIT Rate 5%, CRIT DMG 50%, and Anomaly Mastery
  116. Her setup primary family is `general_damage`, residual family is
  `anomaly_buildup`, and Result families are `general_damage` and
  `anomaly_buildup`. Do not admit AP or an Anomaly DMG row because this bounded
  profile has no `anomaly_damage` consumer.
- R2. Add Frost as Miyabi's visible Agent Attribute. Under `GV-004`, Frost
  damage and buff applicability resolve through Ice. This mapping does not
  make Frost and Ice identical for same-Attribute party qualification.
- R3. Retain the completed Core's one-for-one Fully Enabled CRIT Rate to Frost
  Anomaly Buildup Bonus conversion against an Icefire target, capped at 80%.
  Expose the current CRIT basis and output through the existing post-delivery
  stat/modifier gauge and one source-local action row. Also retain
  Frostburn-Break's exact added damage operation at 1500% ATK and its
  all-party Anomaly Buildup Bonus +20% against a Frostburn target. Do not add a
  Frost gauge, state machine, accumulation history, or base/final damage row.
- R4. Miyabi's Additional Ability qualifies with another Support Agent,
  another Anomaly Agent, or another Section 6 member. When qualified, maximum
  Shimotsuki DMG +60% and its post-Disorder Ice RES Ignore 30% remain scoped
  to that exact action outcome. Fallen Frost acquisition, stance cadence, and
  Disorder history remain absent.
- R5. Retain Ultimate-triggered Ice DMG +30% as a Fully Enabled broad ordinary
  DMG modifier without retaining its duration. Retain only Mindscape outcomes
  with current consumers: M1 maximum Shimotsuki DEF Ignore 36% plus
  all-party Anomaly Buildup Bonus +20% after Frostburn removal; M2
  Kazahana/Dodge Counter DMG +30% and Combat CRIT Rate +15%; M4
  Frostburn-Break DMG +30%; and M6 maximum Shimotsuki DMG +30%. Skill-level,
  resource, automatic-slash, acquisition, duration, and cadence details remain
  absent.

### Competitive setup

- R6. Miyabi's full W-Engine candidates are Hailstorm Shrine W1, Frostfall
  Sickle W1, Flamemaker Shaker W1, Practiced Perfection W1, Fusion Compiler
  W1, Electro-Lip Gloss W5, Roaring Ride W5, and Marcato Desire W5. Her
  non-limited candidates are Fusion, Electro-Lip, Roaring Ride, and Marcato.
  Prepare Hailstorm in full and Fusion in non-limited.
  - Hailstorm's Base ATK, CRIT Rate, CRIT DMG, and Ice DMG form the complete
    direct-damage/buildup package and the full-pool representative.
  - Frostfall's AM and Ice DMG, Practiced Perfection's ATK and AM, and
    Flamemaker's ATK and ordinary DMG are usable. Their Abloom, Physical DMG,
    AP, and off-field Energy clauses respectively remain unused opportunity
    cost where present.
  - Fusion's PEN and ATK form the strongest non-limited complete consumed
    direction even though its AP clause is unused. Electro-Lip supplies ATK
    and DMG with unused AP; Roaring supplies ATK and buildup with unused AP.
  - Marcato is legally selectable outside its passive Specialty. Its Base ATK
    and advanced CRIT Rate remain a positive but partial, materially distinct
    finite CRIT/buildup opportunity; its Attack passive is inactive.
  - Timeweaver's sole consumed ATK axis, Angel in the Shell's sole consumed AM
    axis, Flight of Fancy's sole consumed buildup axis, Weeping Gemini's sole
    consumed ATK axis, and Rainforest Gourmet's fully enabled ATK direction
    lose to an admitted same-axis complete package. Legality, positivity, a
    different label, or a threshold by itself does not preserve membership.
- R7. Add Branch & Blade Song's minimum current 4-piece relationships: at
  Initial AM 115 or higher, CRIT DMG +30%; in the Fully Enabled snapshot,
  CRIT Rate +12%. Prepare Branch 4-piece. Woodpecker Electro remains the
  independent ATK/CRIT 4-piece alternative. Do not retain Branch's Freeze/
  Shatter trigger duration because neither candidate, representative,
  applicability, Setup, nor Result changes when the fully enabled maximum is
  projected.
- R8. Miyabi's 2-piece directions are Ice DMG through Polar Metal, CRIT Rate
  through Woodpecker, CRIT DMG through Branch, PEN Ratio through Puffer
  Electro, Basic Attack DMG through Dawn's Bloom, and ATK through Hormone Punk,
  subject to current same-set and same-effect rules. Prepare Polar 2-piece.
  Same-value aliases and a currently unretained Polar 4-piece do not create
  extra choices.
- R9. Offer CRIT Rate, CRIT DMG, or ATK% in Slot 4; Ice DMG, ATK%, or PEN Ratio
  in Slot 5; and ATK% in Slot 6. Effective substats are CRIT Rate, CRIT DMG,
  and ATK%. Prepare CRIT Rate/Ice DMG/ATK% in both pools with zero supplied
  effective-substat counts. AM Slot 6 is positive for residual buildup but
  loses the fixed 30% ATK main-stat opportunity and is not a competitive
  prepared or editable direction for this general-damage-led package.

### Lifecycle and visible boundaries

- R10. Reuse the literal shared preparation order: authored and contextual
  candidates, selected-input pressure, party allocation, pool/Mindscape
  representative preparation, zero initialization for newly supplied
  substats, then reconciliation. Party Apply rebuilds all holders; pool and
  Mindscape changes rebuild Miyabi only against the other established holder
  snapshots. Direct edits do not reprepare.
- R11. Broad pre-PEN pressure removes Miyabi's optional Slot 5 PEN and Puffer
  directions. An invalid current selection clears without fallback; pressure
  removal does not restore edit history; the user may reselect when it becomes
  valid again. The prepared Ice Slot 5 and Polar 2-piece remain unaffected.
  Any incomplete required selection keeps the entire Result empty.
- R12. Selected and candidate equipment use the same source-owned compressed
  Setup summaries. Hailstorm and Branch retain only their fully enabled current
  consumer-backed maxima; routine trigger, duration, stack acquisition, and
  resource prose stays out. Result projects only clauses Miyabi or a compatible
  recipient consumes, so Flamemaker off-field Energy, AP-only clauses,
  Frostfall Abloom, Practiced Physical DMG, and Marcato's inactive passive do
  not become Result rows.
- R13. Result exposes Initial/Combat/Fully Enabled ATK, CRIT Rate, CRIT DMG,
  AM, ordinary modifier rows, the CRIT-to-buildup gauge, exact local action
  distinctions, the Frostburn-Break operation, and compatible party buildup
  rows. It adds neither `anomaly_damage`, AP, a generic final-damage row, nor
  hidden shared Frost state.
- R14. Add Miyabi's original portrait and Frost identity mark. Calibrate
  `scale`, `headTopY`, and `faceX` in that order against a nearby admitted
  portrait at desktop and narrow widths, expanded and compact. No existing
  portrait metadata or layout is in scope.

## Testing Delta

- TD1. Frost-to-Ice is a new member of the existing special-Attribute mapping,
  not a new mechanism. Extend the current table-driven special-Attribute
  formula-policy assertion; do not create a Miyabi value catalogue.
- TD2. The CRIT-derived action modifier, action-scoped party provider,
  qualification, and lifecycle are already proved by shared harness,
  integration, and lifecycle fixtures. No new named Miyabi exact-value,
  candidate-roster, representative snapshot, source-fact deletion, or
  equipment catalogue test is authorized.
- TD3. Update exhaustive typed registries and existing shared user journeys
  only where admission makes them incomplete. An assertion remains warranted
  only if the same relationship or visible failure remains meaningful with an
  equivalent registered fixture.
- TD4. Portrait metadata changes require the existing visual-baseline job and
  in-app browser checks. No other semantic content change requires a new
  visual snapshot.

## Scope Boundaries

- No final damage, anomaly damage, buildup progress, anomaly history, rotation,
  uptime, Fallen Frost resource, Frost state engine, or runtime optimizer.
- No copied W-Engine or Disc values in Miyabi's Agent profile and no
  consumer-free trigger, duration, cadence, stack, or action schema.
- No Anton, Rina, post-2.8 Agent, permanent-authority amendment, or completed
  track re-audit in this unit.
- No Agent-specific test catalogue or candidate-count rule.

## Resolve Before Planning

None.
