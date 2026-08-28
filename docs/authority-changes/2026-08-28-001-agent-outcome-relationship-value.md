---
id: ACR-2026-08-28-001
date: 2026-08-28
status: accepted
supersedes: none
superseded_by: none
---

# Derive setup value from Agent outcome relationships

## One decision

Decide whether every candidate-bearing setup input derives Agent-realized value
from one common set of outcome relationships before applying its own package and
finite-opportunity rules.

## Context

The product currently authors competitive W-Engine, Drive Disc, main-stat, and
effective-substat choices, but the permanent product contract explains their
inspection in separate sections without one owner for the Agent relationships
that make a source clause valuable. Current content therefore records the final
candidate identities more directly than the shared reason a stat, modifier,
action, resource, or recipient outcome matters to that Agent.

This makes two opposite errors possible. A legal or matching-Specialty source
can be treated as competitive without proving an Agent outcome, while a partial
package can be discarded because one clause is unusable even though another
clause creates a competitive complete setup. Repeating bespoke value logic for
each equipment identity avoids neither error and prevents ordinary new content
from closing through established concepts.

## Existing rule

- Owning Rule IDs: `SW-004`, `SW-005`, `SW-006`, `SW-007`, `SW-008`,
  `GV-001`, `GV-006`, and `FM-007`
- Conflict: the listed product rules require candidate preparation before
  representative preparation and require realized packages, competitive range,
  complete setups, and finite opportunity. The listed vocabulary rules
  separate W-Engine passive eligibility from Base ATK and the advanced stat and
  separate source-local trigger, action, and recipient conditions. The listed
  formula rule separates formula-family consequences. No current Rule ID owns
  the common Agent-centered relationship model that composes those meanings
  across all four candidate-bearing input surfaces. The separate surface rules
  can therefore be followed without proving the same underlying value edge.

## Proposed change

Amend the permanent product contract so every W-Engine, Drive Disc, main-stat,
and effective-substat candidate first projects its usable source value through
the current Agent's authored outcome relationships:

1. a basis, threshold, or conversion relationship, where a supplied stat
   changes another retained outcome or preparation boundary;
2. a delivery-topology relationship, where an action or operating interval
   delivers the Agent's retained Daze, damage, buff, or other setup outcome;
3. a role-resource relationship, where a resource such as Impact or Energy
   materially enables that delivery or retained outcome; or
4. an external-outcome relationship, where a party or enemy effect reaches an
   exact current recipient and applicable formula.

Specialty, Attribute, holder, activation, action, recipient, interval, and
other source-local qualifiers gate individual clauses; they are not standalone
competitive axes. An unusable clause contributes zero value and no penalty.
A qualifying relationship proves only usable value, not candidate admission.
The applicable input-surface rule must still compare complete setups, finite
opportunity, acquisition or allocation role where applicable, the nearest
usable same-axis comparator, material setup direction, and a reversing
countercase. Compress an alternative only when another option is at least as
strong in every usable outcome under the same applicability and opportunity
context.

Keep this an authoring rule rather than a runtime optimizer or equipment
catalogue. It does not require action-share, uptime, or rotation precision that
the retained source condition and current workbench consumer do not already
use. A genuinely new operation remains an explicit common-mechanism or
authority decision instead of being forced into these relationships.

## Evidence

- `src/workbench/content/setup-options.ts` already authors setup and Result
  formula participation independently per Agent. This establishes one current
  formula consumer but does not by itself explain resource access, thresholds,
  delivery topology, or external recipient value.
- `src/workbench/formula-policy.ts` derives CRIT and DEF-region participation
  from that authored formula direction and resolves explicitly authored source
  formula scope against a recipient. This demonstrates that formula reach is a
  relationship join rather than a consequence of Specialty or equipment
  identity.
- `src/workbench/calculation/delivery.ts` evaluates recipient, exact Agent,
  Specialty, Attribute, and formula constraints independently. Those fields
  already behave as clause-level gates rather than one combined equipment
  ranking.
- `src/workbench/content/setup-policies.ts` composes candidate identities,
  operating interval, holder allocation, and pool-specific representative
  authoring for each Agent. The final setup policy is therefore Agent-centered,
  while the candidate arrays in `src/workbench/content/engines.ts`,
  `src/workbench/content/discs.ts`, and
  `src/workbench/content/setup-options.ts` currently preserve little of the
  common value relationship that justified membership.
- `src/workbench/candidate-context.ts` and `src/workbench/candidates.ts` already
  keep source applicability, selected-input pressure, and effective candidate
  reconciliation separate from the authored base candidate. This is the
  established composition boundary the proposed authoring rule would precede,
  not replace.
- The accepted source-package visibility decision preserves the complete
  source-owned Setup package while assigning no negative value to unused
  clauses. The accepted acquisition-role decision separately requires a
  realized W-Engine package to be compared in its actual acquisition role.
  The proposed common relationship model preserves both decisions and extends
  neither into a runtime score.

## Nearest current consumer

`formulaScopeAppliesToMetric` in `src/workbench/formula-policy.ts`, composed
through `providerAppliesToRecipient` in
`src/workbench/calculation/delivery.ts`, is the nearest established consumer.
It preserves the source formula scope, current recipient formula participation,
modifier identity, recipient class, Attribute, and exact eligibility as
independent edges before delivering one effect. Broad DEF-region effects can
therefore reach both general and anomaly damage without treating those formula
families as identical, while CRIT still reaches only CRIT-consuming formulas.
The proposed rule applies the same relationship discipline to candidate value
before the input-specific competitive comparison.

## Contrast

`GV-001` provides the closest disproof of an over-broad rule. A holder whose
Specialty does not match a W-Engine can still realize its Base ATK and advanced
stat while the passive is unavailable. The package must therefore be valued
clause by clause, but partial usability alone does not make it competitive.
Conversely, a unique post-delivery gauge or replacement operation cannot be
admitted merely because its input stat fits one of the four relationships; its
operation must remain explicitly retained and consumed. These contrasts prevent
the common model from becoming either a Specialty shortlist or a universal
effect graph.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md` must
  own the common Agent outcome relationship and make the W-Engine, Drive Disc,
  main-stat, and effective-substat rules consume it. The terminology and
  formula owners may need boundary-preserving clarifications to `GV-001`,
  `GV-006`, and `FM-007`, but must not take ownership of competitiveness.
- Supporting requirements affected: current Agent requirements remain owners
  of settled local candidate and representative identities. When re-audited,
  they retain only usable and unused axes, the nearest comparator, finite
  opportunity consequence, contrary condition, and local lifecycle or visible
  consequence needed by that outcome; detailed research stays transient.
- Production and tests affected: a later bounded refactor may separate shared
  equipment facts from Agent candidate policy, derive ordinary effect
  applicability through common relationships, and leave only genuinely unique
  operations in item-specific handlers. Shared mechanism tests should cover an
  equivalent full package, partial package, dominance compression, distinct
  finite-opportunity direction, recipient/formula join, and contextual
  lifecycle without freezing a Named-Agent catalogue.
- Visible Setup or Result consequence: candidate selectors continue to expose
  a small competitive set with deterministic full and non-limited prepared
  choices. Setup preserves the admitted equipment's complete source-owned
  package, while Result includes only effects consumed by the current holder,
  context, recipient, action, and formula. Role-irrelevant rows are not created
  and then hidden by presentation code.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-28T22:37:46+09:00`
