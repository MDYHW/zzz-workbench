---
id: ACR-2026-08-25-002
date: 2026-08-25
status: accepted
supersedes: none
superseded_by: none
---

# Preserve source-package visibility without assigning unused-clause cost

## One decision

Keep every materially distinct clause of an admitted W-Engine's compressed
source-owned package visible in Setup without treating a clause the current
Agent cannot consume as opportunity cost, negative value, or candidate
rationale.

## Context

The accepted Agent-realized W-Engine value boundary now defines an unusable
contribution as zero: it is neither a bonus nor a penalty, and actual
opportunity cost belongs to the competing realized setup displaced by the
selection. `UI-001` still says the same unusable clauses remain visible "as
whole-package opportunity cost." That wording gives Setup copy a value meaning
owned by candidate policy and directly contradicts the current product
contract.

The visible behavior itself is correct. Selected and candidate W-Engine
surfaces need the complete compressed source package so users can compare what
the equipment offers, while Result needs only the clauses the current Agent and
setup consume. The owner wording must preserve that separation without adding
an unused-clause badge, holder-filtered Setup copy, or explanation payload.

## Existing rule

- Owning Rule ID: `UI-001`
- Conflict: the current rule correctly owns source-package visibility and compressed
  Setup copy, but incorrectly labels an unusable visible clause as whole-package
  opportunity cost. `SW-004`, `SW-005`, `SW-008`, and `SW-010` now own the
  Agent-realized candidate comparison and define unusable W-Engine contributions
  as zero rather than cost.

## Proposed change

Retain the source-owned, holder-unfiltered W-Engine passive summary. It shows
every materially distinct clause in the admitted competitive package for both
the current selection and candidate surfaces, including a clause that the
current Agent cannot consume. That visibility preserves the equipment's
complete offering and lets the same compressed package remain legible across
holders; it does not assign the clause positive value, negative value,
opportunity cost, or independent candidate meaning.

Candidate membership and prepared priority continue to consume only the
Agent-realized comparison owned by the product contract. Result continues to
project only holder-, interval-, recipient-, action-, Attribute-, and formula-
applicable relationships. Do not add holder-specific Setup filtering, an
"unused" status, candidate rationale, or runtime value explanation merely to
express this separation.

## Evidence

- `docs/setup-workbench-product-contract.md` (`SW-005`, `SW-008`) defines an
  unusable W-Engine contribution as zero and assigns opportunity cost to the
  realized competing setup displaced by the selection.
- `src/workbench/content/engines.ts` (`W_ENGINES`) owns one compressed
  `passiveLines` package per W-Engine rather than one holder-specific copy.
- `src/components/AgentSetup.tsx` (`EngineCard`) renders that same package for
  the selected W-Engine and its candidate controls, including their accessible
  descriptions.
- `src/workbench/content/agent-sources/w-engine-relationships.ts`
  (`selectedWEngineRelationships`) separately projects only consumable selected
  relationships into Result and creates no negative row for an omitted clause.
- `docs/source-fact-boundary.md` (`SF-001`) retains only source structure needed
  by a current candidate, prepared choice, Setup copy, applicability, or Result;
  source completeness by itself does not authorize a value explanation.

## Nearest current consumer

Promeia selecting Angel in the Shell is the nearest current case. `EngineCard`
shows the complete compressed Angel package, including both damage clauses,
while `selectedWEngineRelationships` projects only the AP relationship she can
consume. The visible clauses describe Angel's complete offering; their absence
from Promeia's Result contributes zero rather than a deduction.

## Contrast

Aria receives Angel's AP and both damage relationships because her Attribute
and on-field-compatible interval satisfy them. Off-field Vivian receives AP
only because her interval removes the damage relationships. All three holders
retain the same source-owned Setup package, while Result differs through the
common holder and interval resolvers. This shows why Setup visibility and
Agent-realized value must remain separate without a named-Agent branch.

## Impact

- Permanent owner affected: `docs/workbench-ui-design-rules.md` (`UI-001`).
- Supporting requirements affected: any current rationale that calls an
  unusable visible clause an opportunity-cost charge must use the product
  contract's realized competing-setup meaning instead. No candidate roster or
  representative follows from this record.
- Production and tests affected: none. Current `W_ENGINES`, `EngineCard`, and
  selected-relationship behavior already preserve the intended separation.
  The later owner amendment changes authority wording only and adds no
  item-specific snapshot, holder-filtering branch, or explanation model.
- Visible Setup or Result consequence: none. Setup continues to show the
  complete compressed selected and candidate package; Result continues to show
  only consumable relationships.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-25T13:13:33.5589921+09:00`
