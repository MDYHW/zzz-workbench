---
id: ACR-2026-08-25-001
date: 2026-08-25
status: accepted
supersedes: none
superseded_by: none
---

# Evaluate W-Engine candidates from Agent-realized value

## One decision

Author W-Engine candidates from the competitive value and materially distinct
setup produced by only the package contributions the current Agent can realize,
without rewarding package completeness or penalizing unusable clauses.

## Context

The workbench must expose a small set of competitive setup choices rather than
an equipment catalogue or a single ranked recommendation. Current W-Engine
wording instead directs authoring to charge each unusable advanced stat or
passive clause as opportunity cost and to compare fully usable packages before
partial packages. That framing can make the source package, clause count, or
complete/partial label influence value independently of what the current Agent
actually receives. It can also suppress a strong realized partial package or
favour a weak package merely because every small clause activates.

Candidate authoring needs one Agent-centered value boundary before the pending
Miyabi unit or a re-audit of established candidate rosters can proceed.

## Existing rule

- Owning Rule IDs: `SW-004`, `SW-005`, `SW-008`, `SW-010`
- Conflict: the preparation dependency begins from the exact Agent direction,
  kit, activation, opportunity, availability, and current competitive practice.
  The package-inspection and competitive-set rules then charge unusable clauses
  as opportunity cost and prioritize complete packages as a package-level
  comparison class. The availability rule separately re-compares pool
  membership even though full is the admitted candidate set
  and non-limited is that set with limited S-Rank identities removed. These
  later instructions can make source-package completeness or pool partitioning
  replace the earlier Agent-realized setup comparison.

## Proposed change

For each legal W-Engine, compare only the Base ATK, advanced stat, passive
clauses, conditions, scopes, and operations the current Agent can actually
realize. A usable contribution adds its realized value; an unusable contribution
adds zero and is neither a bonus nor a penalty. Complete and partial remain
descriptions of applicability, not value terms or candidate priorities.

Recompose the Agent's bounded setup and finite investment opportunity around
each realized package. Select the strongest Agent-appropriate setup as the
prepared representative, use it to calibrate the minimum competitive range,
and reject alternatives whose realized setup value is too remote to remain a
material user choice. Among the remaining alternatives, keep only the stronger
package when finite main-stat and substat reallocation makes them express the
same setup direction; keep different directions only while each remains
competitive for that Agent. The opportunity cost of selecting one W-Engine is
the realized value of the competing selection it displaces, not the source
text of an unusable clause.

Limited acquisition remains part of the user decision. A limited S-Rank whose
realized package is partial is not penalized for the unusable text, but its
realized value and distinct setup direction must still justify the acquisition
beside competitive standard S-Rank and A-Rank alternatives. After one admitted
candidate set is authored, full contains that complete set and non-limited is
derived by removing limited S-Rank identities. Do not create a runtime score,
universal numerical cutoff, package-completeness bonus, or candidate-count
target.

## Evidence

- `docs/setup-workbench-product-contract.md` (`SW-004`) already requires exact
  Agent direction, role, formula, action, operation, kit, activation, finite
  opportunity, availability, and current competitive practice before retaining
  materially distinct candidates. These are Agent-realized consumers rather
  than source-package clause counts.
- `src/workbench/content/agent-sources/w-engine-relationships.ts`
  (`selectedWEngineRelationships`) materializes only holder-compatible,
  interval-compatible, recipient-compatible, and formula-compatible selected
  contributions. It creates no negative modifier for a source clause the
  holder cannot consume.
- `src/workbench/content/engines.ts` keeps the source-owned complete Setup copy
  separately from that Result projection. An unusable clause can therefore
  remain visible as part of the selected source package without entering the
  holder's realized value.
- The current `angelInTheShell` fact supplies unconditional Anomaly Mastery and
  Anomaly Proficiency while gating its two damage clauses by holder Attribute
  and operating interval. The common relationship mapper consequently produces
  different realized packages for Aria, Promeia, and Vivian without changing
  the source package or subtracting unusable effects.
- `src/workbench/content/engines.ts` (`enginePools`) already expresses the
  final availability relation as all admitted identities in full and the same
  list filtered by limited ownership in non-limited. Pool lifecycle can remain
  deterministic without treating pool partitioning as an independent source
  of candidate value.

## Nearest current consumer

Promeia selecting Angel in the Shell is the nearest current partial-package
consumer. `selectedWEngineRelationships` retains the engine's Anomaly
Proficiency contribution for her non-Ether on-field setup and omits the two
Ether-holder damage clauses. The omitted clauses create neither a negative
Result modifier nor a hidden deduction from the AP that Promeia receives. Her
Setup still displays the complete source-owned package, while Result projects
only the consumable contribution. Candidate membership remains an authored
Agent-local conclusion rather than proof supplied by the mapper.

## Contrast

Aria is the same-engine complete-applicability contrast: her Ether on-field
setup receives the AP and both damage clauses. Vivian is the interval contrast:
her Ether holder capability is insufficient while her authored off-field
interval removes the two on-field-compatible damage clauses, leaving AP only.
These cases show that more activated clauses may produce more realized value
when their actual contributions matter, but completeness itself contributes no
value. A hypothetical fully activated package containing only negligible
values would not outrank a competitive partial package with one strong realized
contribution merely because it activates more source text.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-004`, `SW-005`, `SW-008`, `SW-010`).
- Supporting requirements affected: the pending Miyabi requirement and current
  Agent requirements whose candidate or representative rationale charges
  unusable W-Engine clauses as a negative value, prefers completeness by
  itself, or authors membership independently by pool require a bounded
  Agent-centered re-audit. No roster conclusion follows from this record.
- Production and tests affected: no shared calculation or lifecycle mechanism
  is changed by the owner amendment itself. Later bounded audits may change
  Agent-local `ENGINE_IDS_BY_AGENT_AND_POOL` entries and representatives in
  `src/workbench/content/engines.ts` and
  `src/workbench/content/representatives.ts`. Existing generic reference,
  preparation, and completeness coverage remains the applicable harness unless
  an audit discovers a new shared mechanism failure.
- Visible Setup or Result consequence: none from the ACR or owner amendment
  alone. A later accepted Agent-local correction may remove a noncompetitive or
  duplicate choice, restore a competitive realized partial choice, or change a
  prepared representative. Selected Setup continues to show the complete
  source-owned package and Result continues to project only consumable clauses.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-25T10:43:43.5409628+09:00`
