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

This unit applies `SF-002`-`SF-005`, `GV-001`-`GV-004` and `GV-009`,
`FM-001`-`FM-004` and `FM-006`-`FM-011`, `SW-002`-`SW-006`,
`SW-008`-`SW-016`, `SW-018`-`SW-020`, and
`UI-001`-`UI-004`. It settles Miyabi only. Anton and Rina remain the next
separate Shock-state/general-damage unit.

## Authority And Consumer Decision Map

| Rule | Retained relationship | Exact current consumer | Candidate/prepared and lifecycle consequence | Setup/Result consequence | Similar / contrast |
| --- | --- | --- | --- | --- | --- |
| `GV-004`, `FM-002`, `FM-007` | Display Attribute Frost calculates through Ice for damage, buff, and equipment applicability while remaining a distinct Agent identity | `effectAttributeForAgent`, `FORMULA_PARTICIPATION_BY_AGENT`, and `attackProfileFor` | Ice clauses compete; same-Attribute party qualification still compares the displayed Agent identity; all existing preparation stages remain unchanged | Setup displays Frost identity and source-owned Ice equipment wording; Result projects general damage and buildup, never `anomaly_damage` | Honed Edge to Physical is the nearest mapping; ordinary Ice Agent Ellen is the identity contrast |
| `SF-003`, `SF-005`, `FM-004`, `SW-013`, `SW-014` | Fully Enabled CRIT Rate converts one-for-one into Frost buildup bonus against an Icefire target, capped at 80% | `post-delivery-stat-modifier-gauge` and the action Result composer | CRIT is a finite setup opportunity for both direct damage and buildup; the prepared package does not add a new runtime Icefire state model | Result exposes the gauge and an action-local Frost-buildup row; resource, cadence, and hidden state remain absent | Burnice's AP-derived Afterburn gauge is nearest; Trigger's CRIT-to-Daze conversion is the different-formula contrast |
| `FM-002`, `FM-007`, `SW-012` | Frostburn supplies a party buildup outcome; qualified Shimotsuki and Mindscape clauses remain exact local or party outcomes | current provider delivery and action projection | Qualification uses another Support, Anomaly, or Section 6 member; Party Apply and target-only rebuild recalculate it through current state | Separate action rows prevent Icefire and Frostburn target conditions from being summed as one universal snapshot | Nangong's action-scoped party buildup is nearest; Yuzuha's broad AM-derived provider is the contrast |
| `SW-004`, `SW-005`, `SW-008`, `SW-009`, `UI-001` | Each selected W-Engine and Disc remains a source-owned whole package while candidate value comes only from the package Miyabi realizes | shared equipment facts, selected relationship mappers, candidates, representatives, and Setup descriptions | Full prepares Hailstorm; non-limited prepares Fusion; lower same-role packages and remote other-limited packages are excluded after complete-setup recomposition | Setup keeps every clause of each admitted package; Result omits AP that this bounded Miyabi profile cannot consume | Hailstorm is the complete benchmark; Fusion is the competitive partial-package contrast |
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
  stat/modifier gauge and one source-local action row. Frostburn-Break's raw
  1500%-ATK damage amount remains outside Result, while its all-party Anomaly
  Buildup Bonus +20% against a Frostburn target remains. Do not add a
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

- R6. Miyabi's full W-Engine candidates are Hailstorm Shrine W1 and Fusion
  Compiler W1. Her sole non-limited candidate is Fusion. Prepare Hailstorm in
  full and Fusion in non-limited.
  - Hailstorm's Base ATK, CRIT Rate, CRIT DMG, and Ice DMG form the complete
    direct-damage/buildup package and the full-pool representative.
  - Fusion's PEN and ATK form the strongest non-limited direction even though
    its AP clause contributes zero to this bounded profile. After complete main-
    stat recomposition, Electro-Lip's ATK/DMG route reaches the same PEN plus
    ordinary-DMG direction at lower realized value, so the stronger Fusion
    package compresses it within the shared standard/A-Rank acquisition role.
  - Frostfall's realized AM and Ice DMG and Practiced Perfection's realized ATK
    and AM are positive but do not have current Miyabi competitive-practice
    support sufficient to justify a second limited S-Rank acquisition beside
    Hailstorm and the competitive standard/A-Rank alternatives. Their unused
    Abloom and Physical clauses contribute zero and are not penalties.
  - Flamemaker's realized ATK and DMG do not preserve the off-field operation
    that makes its package competitive for Burnice. Roaring's ATK/buildup,
    Marcato's off-Specialty CRIT stat stick, and the remaining legal Anomaly
    engines are either too remote after recomposition or repeat a stronger
    admitted direction. Legality, positivity, a different label, or a threshold
    by itself does not preserve membership.
- R7. Add Branch & Blade Song's minimum current 4-piece relationships: at
  Initial AM 115 or higher, CRIT DMG +30%; in the Fully Enabled snapshot,
  CRIT Rate +12%. Prepare Branch 4-piece and admit no alternative 4-piece.
  Polar Metal's Ice DMG and fully enabled Basic/Dash DMG are usable, but its
  single ordinary-DMG modifier family gives up Branch's CRIT Rate and CRIT DMG
  package and cannot preserve the practical 90% CRIT boundary through the
  bounded eight-hit opportunity. Woodpecker's CRIT/ATK package is likewise
  usable but gives up Branch's stronger tailored CRIT package without a
  materially distinct setup advantage. Dialyn's received-Ultimate operation
  does not add contextual Puffer Electro: the action is applicable, but its
  package is not competitive with Branch's tailored direction. Do not retain
  Branch's Freeze/Shatter trigger duration because its removal changes neither
  candidate, representative, applicability, Setup, nor Result when the fully
  enabled maximum is projected.
- R8. Miyabi's 2-piece directions are Ice DMG through Polar Metal, CRIT Rate
  through Woodpecker, PEN Ratio through Puffer Electro, Basic Attack DMG
  through Dawn's Bloom, ATK through Hormone Punk, and buildup tempo through
  Phaethon's Melody AM, subject to current same-set and same-effect rules.
  Prepare Woodpecker 2-piece. Branch cannot complement the sole Branch
  4-piece, and same-value aliases do not create extra choices.
- R9. Offer CRIT Rate or ATK% in Slot 4; PEN Ratio, ATK%, or Ice DMG in Slot 5;
  and ATK% or Anomaly Mastery in Slot 6. Effective substats are CRIT Rate,
  CRIT DMG, and ATK%. Prepare CRIT Rate/PEN Ratio/ATK% at M0 and
  CRIT Rate/Ice DMG/ATK% at M1+ in both pools with zero supplied
  effective-substat counts. M1's Shimotsuki-scoped DEF Ignore lowers PEN's
  prepared priority without removing its broader editable direction, while
  Ice DMG avoids repeating the ATK% already prepared in Slot 6. Hailstorm,
  Branch, Woodpecker, Slot 4,
  and eight reserved future CRIT Rate hits reach 92.2% CRIT Rate, preserving a
  practical stability margin beyond the 80% buildup-conversion cap. CRIT DMG
  Slot 4 repeats abundant Hailstorm/Branch supply and leaves an impractical
  CRIT Rate deficit; ATK% Slot 4 remains the high-investment alternative when
  the user supplies enough CRIT Rate. AM Slot 6 remains a distinct editable
  buildup-tempo direction for neutral-resistance or externally ATK-saturated
  compositions without changing Miyabi's primary formula to anomaly damage.

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
  valid again. At M0, authorized preparation under that pressure uses Slot 5
  Ice DMG in place of PEN; M1+ already prepares Ice DMG. Woodpecker 2-piece
  remains unaffected. Any incomplete required selection keeps the entire
  Result empty.
- R12. Selected and candidate equipment use the same source-owned compressed
  Setup summaries. Hailstorm and Branch retain only their fully enabled current
  consumer-backed maxima; routine trigger, duration, stack acquisition, and
  resource prose stays out. Fusion continues to show its complete source-owned
  package in Setup, while Result projects only its ATK and PEN clauses and omits
  AP for this bounded profile.
- R13. Result exposes Initial/Combat/Fully Enabled ATK, CRIT Rate, CRIT DMG,
  AM, ordinary modifier rows, the CRIT-to-buildup gauge, exact local action
  distinctions, and compatible party buildup
  rows. Shimotsuki and Kazahana retain their local visible identities while
  inheriting canonical Basic Attack equipment effects; Dodge Counter remains a
  separate action. Result adds neither `anomaly_damage`, AP, a generic final-
  damage row, nor hidden shared Frost state.
- R14. Add Miyabi's original portrait and Frost identity mark. Calibrate
  `scale`, `headTopY`, and `faceX` in that order against a nearby admitted
  portrait at desktop and narrow widths, expanded and compact. No existing
  portrait metadata or layout is in scope.

## Testing Delta

- TD1. Frost-to-Ice is a new member of the existing special-Attribute mapping,
  not a new mechanism. Add a small table-driven special-Attribute assertion to
  the existing formula-policy suite; do not create a Miyabi value catalogue.
- TD2. The CRIT-derived action modifier, qualification, and lifecycle are
  already proved by shared harness, integration, and lifecycle fixtures.
  Nangong's existing action-scoped buildup test covers an Anomaly-profile
  recipient but cannot prove an Attack-profile recipient whose residual setup
  direction consumes `anomaly_buildup`; add that contrasting shared flow. No
  new Miyabi exact-value, candidate-roster, representative snapshot,
  source-fact deletion, or equipment catalogue test is authorized.
- TD3. The existing received-Ultimate lifecycle proves candidates that have
  already passed whole-package admission, but it cannot prove that a new
  `general_damage` Agent without that local admission remains excluded. Extend
  the shared lifecycle fixture with one admitted and one unadmitted recipient;
  this gate remains meaningful with equivalent registered fixtures. Do not add
  a Miyabi candidate-roster assertion.
- TD4. The existing action-composition fixture proves canonical effects can be
  inherited without replacing a local identity, but it cannot prove Miyabi's
  two Basic outcomes supply that established relationship or keep Dodge Counter
  separate. Add one integration flow with an equivalent Basic-scoped Disc
  effect; do not assert the candidate roster or exact effect value.
- TD5. Portrait metadata changes require the existing visual-baseline job and
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
