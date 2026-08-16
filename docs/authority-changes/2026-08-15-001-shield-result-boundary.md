---
id: ACR-2026-08-15-001
date: 2026-08-15
status: accepted
supersedes: none
superseded_by: none
---

# Exclude shield and survival value from Result and positive setup axes

## One decision

The workbench excludes shield, healing, and other survival value from Result
and from positive damage or setup axes, while preserving a source-local shield
condition required by an admitted non-survival effect and retaining compressed
survival copy only when a current selected or candidate package needs it for
complete Setup disclosure. Result projects each independently admitted
non-survival effect directly into its existing quantity or action outcome under
the effect's actual authored source. A named shield state and the action that
creates it do not become Result sources merely because they mediate that effect.

## Context

The current permanent owners admit Ben Bigger's Core shield and Caesar King's
Radiant Aegis as dedicated Result exceptions. Those exceptions then make Shield
Effect and shield output appear to strengthen equipment and Disc choices. This
reopens a survival direction that the service does not use to compare damage
setups and lets a newly created Result consumer validate the exception that
created it.

## Existing rule

- Owning Rule IDs: `SW-013`, `SF-003`, `FM-009`, `UI-002`, `GV-006`
- Conflict: the product contract exposes Ben's shield amount, the source-fact
  boundary admits Ben and Caesar as dedicated survival exceptions, and formula
  mechanics retains Ben's shield scaling as a current Result relationship.
  They conflict with the product boundary that survival value is not a damage
  or setup-tuning consumer. The source-fact rule also correctly permits an
  exact survival clause to remain in a whole-package Setup fact without
  requiring Result projection. The unchanged UI and vocabulary owners already
  require the actual authored source locus, separate a trigger action from an
  affected effect, and keep a mediating named state only as the smallest
  functional condition. They constrain the visible consequence of removing the
  survival exceptions without themselves requiring amendment.

## Proposed change

Remove the dedicated Ben and Caesar survival exceptions. A deterministic and
exactly calculable shield amount does not by itself qualify as a Result or a
positive candidate, representative, main-stat, or substat axis. Preserve only
the smallest compressed survival fact required to describe a current selected
or candidate package whose admission is independently supported by non-survival
consumers. Also preserve shield existence or activation as a source-local
eligibility or target-state condition when an independently admitted damage,
Daze, stat, or party effect requires that condition; this does not retain
Shield Effect or the shield amount. Keep that condition internal to activation
and applicability. Result shows the resulting current quantity, earliest
surface, and atomic contribution under the authored Core Passive, Additional
Ability, Mindscape, equipment, or canonical-action source that owns the effect.
Do not display the shield as a source, derive source ownership from a trigger
action, or add activation prose or a causal chain to Result. A canonical action
is the source only when the action itself owns the retained effect rather than
merely creating the shield state.

## Evidence

- Commit `969ad8c8c841db00ad3814b9cfb14590e9d5b9f7` recorded the approved
  boundary that Result is not a ledger for every numeric operation and that a
  survival amount does not enter Result merely because its source states an
  amount.
- Commits `1ca9cb9df38f26683662518897b63f3a03c432be` and
  `121a72d1020c5edc4b15e2d69a5cf110deed755e` later added the Ben and Caesar
  exceptions to permanent owners in the same transactions that authored the
  supporting vertical requirements. The resulting requirements and consumers
  therefore do not independently establish those exceptions.
- `src/workbench/calculation/agents/ben.ts` exposes the `shieldEffect` metric
  and `benCoreShield` operation, while
  `src/workbench/calculation/agents/caesar.ts` exposes the same metric and the
  `caesarRadiantAegis` operation. Their requirements use those new operations
  to make Shield Effect, Proto Punk, Tusks of Fury, and Initial DEF or Impact
  look stronger. Removing the circular Result consumer changes those visible
  conclusions.
- `src/workbench/content/discs.ts` currently admits Proto Punk as a Ben and
  Caesar two-piece solely through Shield Effect and includes it in both
  four-piece package sets. `src/workbench/content/representatives.ts` prepares
  Caesar on Proto Punk. The two-piece memberships lose their only consumer;
  the four-piece memberships and Caesar representative require a fresh
  non-survival whole-package comparison rather than automatic removal or
  preservation.
- Big Cylinder and Spring Embrace already preserve incoming-damage and survival
  clauses in compressed Setup package copy while keeping those clauses outside
  Result. That separation does not require a shield amount or survival model.

## Nearest current consumer

Evelyn M4 is the closest supported Result consumer. Chain Attack or Ultimate
establishes its shield condition and the resulting CRIT DMG remains visible,
under its authored Mindscape source, while the shield amount and trigger action
do not become Result sources. Ben's squad CRIT and Caesar's Focus ATK, M1 RES
Reduction, shielded-enemy Ultimate Daze, and Bunny in Wonderland activation
keep the same condition-without-survival-value boundary.

## Contrast

Pulchra's Proto Punk package is the closest equipment contrast: its inherent
Shield Effect two-piece is unused while its four-piece squad DMG clause can be
evaluated independently. Ben's Initial DEF to Combat ATK relationship and
Caesar's Focus ATK benefit likewise remain valid non-survival consumers even
though the same Agent source creates a shield. Tusks of Fury remains supported
by Impact, squad DMG, and squad Daze; its Shield Effect clause adds no positive
axis.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-013`), `docs/source-fact-boundary.md` (`SF-003`), and
  `docs/zzz-formula-mechanics.md` (`FM-009`).
- Supporting requirements affected:
  `docs/brainstorms/2026-08-15-ben-koleda-vertical-requirements.md` and
  `docs/brainstorms/2026-08-15-caesar-vertical-requirements.md`, plus their
  completed milestone descriptions.
- Production and tests affected:
  `src/workbench/calculation/agents/ben.ts` and `caesar.ts` shield metrics and
  operations; Shield Effect projection; `src/workbench/content/discs.ts` Ben
  and Caesar Proto Punk two-piece membership and both four-piece package
  comparisons; `src/workbench/content/representatives.ts` Caesar's prepared
  Disc; and the corresponding calculation, policy, flow, Setup, and Result
  tests. Ben's DEF remains an ATK axis, Caesar's Impact remains a Daze axis,
  and Tusks remains independently usable. Shield-gated CRIT, ATK, RES
  Reduction, Daze, and party-DMG effects keep their source-local conditions.
- Visible Setup or Result consequence: Result no longer shows Shield Effect or
  shield-amount operations, and survival value no longer admits or strengthens
  a setup choice. Caesar's M0-M1 Focus ATK remains one Fully Enabled ATK
  contribution under Core Passive; M2 replaces it with one `+1500` contribution
  under Mindscape 2 rather than exposing a historical `+1000` and `+500` split.
  M1 RES Reduction remains under Mindscape 1. Radiant Aegis and its trigger
  actions do not become source labels or a separate Result chain. Compressed
  selected or candidate package copy may still name an exact shield clause when
  the independently admitted whole package needs it.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-16T16:58:14.5796847+09:00`
