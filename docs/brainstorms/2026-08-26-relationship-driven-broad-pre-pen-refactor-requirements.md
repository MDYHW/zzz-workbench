# Relationship-driven broad pre-PEN preparation refactor requirements

**Status:** Approved
**Date:** 2026-08-26

## Scope

Replace the current Agent/equipment identity catalogue used to discover
material broad pre-PEN DEF Reduction or DEF Ignore with one bounded consumer of
the same active source relationships that feed Result. Preserve authored local
representative packages and the established preparation lifecycle. This unit
does not create a universal effect graph, a runtime setup optimizer, or a
Result-to-Setup feedback path.

## Authority decision map

| Owner | Current meaning used by this unit | Bounded consequence |
| --- | --- | --- |
| `SW-007` | An active material broad pre-PEN relationship removes admitted Slot 5 PEN Ratio and Puffer Electro 2-piece only for a recipient whose Setup direction consumes the DEF region | Source identity does not decide pressure; relationship applicability does |
| `SW-009`, `SW-015` | Authored/contextual choices, selected pressure, allocation, representative preparation, zero supplied counts, and reconciliation remain acyclic and ordered | Party Apply prepares all holders; pool/Mindscape rebuild prepares only the target; direct edits only clear invalid selections |
| `FM-008` | Formula breadth establishes applicability, not ranking or a replacement setup | Setup uses primary plus residual formula participation without importing Result participation or numbers |
| `GV-006` | Holder, trigger, affected scope, recipient, and action are independent relationships | Provider self-receipt and party receipt use delivery semantics; action-scoped effects remain contrasts |
| `SF-001`, `SF-003` | Retain only structure needed by a current consumer and keep the smallest sufficient relationship | Share the active relationship and applicability matcher; do not add unused Disc pressure metadata or a universal graph |

## Requirements

- R1. Candidate pressure is derived from current selected Agent and W-Engine
  relationships after their own activation and holder conditions have been
  resolved. `activeCandidatePressures` must not enumerate provider Agent IDs or
  special-case an equipment ID to reproduce those meanings.
- R2. Result and Setup reuse the same source relationship factories and the
  same delivery applicability for holder, recipient, eligible Agent,
  Specialty, Attribute, and formula. Result continues to use its approved
  Result formula participation. Setup pressure independently supplies the
  recipient's authored primary plus residual formula participation. Neither
  carrier falls back to the other.
- R3. A local broad DEF modifier is normalized as a self-delivered relationship
  for Setup applicability. An `enemy-context` or `all-party` provider includes
  its holder when the remaining recipient and formula conditions match.
  `other-party` still excludes the holder. A derived gauge emission qualifies
  only when its retained transform supplies a current nonzero material effect.
- R4. A DEF Reduction or DEF Ignore relationship with an affected action does
  not create membership pressure. Current Cordis Germina Basic/Ultimate,
  Orphie Aftershock, Hugo Totalize, and Miyabi Shimotsuki meanings remain
  action-local contrasts. Broad selected Myriad Eclipse, Serpentine Seeker, and
  Spectral Gaze relationships keep their current source-owned holder and
  recipient applicability without a second candidate parser.
- R5. The current active relationship set therefore includes the established
  Nicole, Seed M2, Cissia gauge, Qingyi M1, and selected-equipment sources and
  closes the currently missed Alice M1, Evelyn M1, Ye Shunguang M1, and
  conditionally active Sunna M1 paths. This is not a closed source roster: a
  future source participates by producing the same relationship, not by being
  appended to a candidate-pressure identity list.
- R6. The common pressure consumer resolves preparation, Slot 5 PEN Ratio,
  and Puffer Electro 2-piece consequences separately. A retained relationship
  may carry an authored prepared-only main-stat outcome without changing its
  Result effect or preventing another applicable source from removing that
  main-stat candidate. This does not introduce a numeric cutoff or a provider
  identity branch. It does not remove Puffer Electro 4-piece, provider-basis
  PEN on a recipient without a Setup DEF-region damage direction, or a choice
  merely because a large or similarly named modifier exists.
- R7. Pressure-safe first choices remain authored complete local packages.
  They are not selected from the remaining candidate array and are not ranked
  from Result values. Existing live outcomes remain: Evelyn uses Fire DMG;
  Corin Physical DMG; Nekomata Branch & Blade plus ATK%; Billy ATK%; Grace
  Freedom Blues plus Electric DMG; Burnice Fire DMG; Jane Freedom Blues plus
  Physical DMG; Yanagi Electric DMG; Alice Physical DMG; and M0 Miyabi Ice DMG.
  Entries that cannot change a current representative are removed rather than
  retained as future defence.
- R8. Ellen under any qualifying broad pressure uses Branch & Blade 2-piece,
  Ice DMG Slot 5, and CRIT Rate Slot 4. Full-pool Ellen uses CRIT DMG Slot 4
  only when Nicole M6 supplies the separately authorized party CRIT Rate.
  Soldier 11 analogously uses Inferno Metal 2-piece, Fire DMG Slot 5, and CRIT
  Rate Slot 4, with the same full-pool Nicole-M6 CRIT-DMG adjustment. These are
  local complete-package outcomes; provider identity does not select them.
- R9. Party Apply rebuilds all three authored packages before zero supplied
  substats and reconciliation. A pool or Mindscape change rebuilds only its
  target; a newly active provider may clear another holder's invalid PEN or
  Puffer selection but does not prepare or restore that holder. Direct edits
  never prepare a replacement. Any required null selection keeps Result empty.
- R10. The common source/applicability layer must not import numeric Result
  composition, call `calculateParty`, iterate to a fixed point, score
  alternatives, or introduce relationship kinds without a current pressure or
  Result consumer.

## Visible outcome and contrasts

- Alice M1 and other qualifying broad sources now remove incompatible PEN and
  Puffer choices for self and party recipients through the same relationship
  delivery used by Result.
- A Party Apply containing full-pool Trigger on Spectral Gaze and Ellen or
  Soldier 11 starts with a complete pressure-safe setup rather than an invalid
  Puffer/PEN representative and an empty Result.
- Rina remains the provider-basis contrast because her Setup formula
  participation does not consume a personal DEF-region damage formula.
- A selected Cordis Germina remains the action-scoped contrast and does not
  remove broad candidates.
- No Setup copy, Result row shape, portrait, typography, or layout changes.

## Testing delta

- Shared mechanism delta: existing delivery tests prove Result recipients and
  existing Spectral lifecycle tests prove invalid clearing, but neither proves
  that the same active relationship drives Setup pressure independently of
  provider identity. Add one equivalent-fixture test for self/party delivery,
  Setup formula participation, and an action-scoped negative.
- Composed-flow delta: existing Nicole preparation covers Nicole-specific CRIT
  supply, but not a non-Nicole broad provider invalidating Ellen or Soldier 11's
  representative during Party Apply. Add one current integration flow that
  proves complete pressure-safe preparation; do not freeze equipment values or
  duplicate every Agent outcome.
- Reuse the existing pressure present/absent/reselected direct-edit lifecycle
  coverage. Dead-policy removal and unchanged local packages need no catalogue
  assertions. Visual baseline is not applicable because no visible structure
  or styling changes.

## Non-goals

- Universal Agent/W-Engine/Disc effect graph
- Runtime candidate ranking or replacement selection
- Result feedback into candidate preparation
- Exhaustive source or Agent registry tests
- New equipment facts, Setup prose, Result metrics, or visual work
