---
id: ACR-2026-08-31-001
date: 2026-08-31
status: accepted
supersedes: none
superseded_by: none
---

# Separate equipment reachability from operation-aligned candidate value

## One decision

Require a source-reachable W-Engine passive or Drive Disc 4-piece clause whose
value depends on activation, action, interval, or operation to align with the
Agent's authored delivery topology before it contributes competitive candidate
value, without changing the source condition or turning that alignment into
rotation or uptime scoring.

## Context

The current product contract correctly separates source qualifiers, Agent
outcome relationships, whole-package comparison, and Fully Enabled
reachability. It does not explicitly decide how those stages compose when an
Agent can legally perform an equipment trigger but doing so requires inserting
or repeating an action outside the authored operation that makes the Agent's
setup competitive.

That ambiguity permits two incompatible conclusions. One reading grants the
clause full candidate value because a legal repeatable route can reach its
Fully Enabled maximum. Another treats any uncommon trigger as unusable through
an unstated uptime or frequency threshold. Current accepted Agent outcomes use
neither reading: they distinguish a source-reachable trigger from whether that
trigger belongs to the holder's authored delivery topology, then compare the
complete realized package without a numerical rotation model.

The permanent owner needs this order before later content can consistently
evaluate W-Engine passives and Disc 4-piece effects. The decision does not
change current candidate rosters by itself.

## Existing rule

- Owning Rule IDs: `SW-004`, `SW-005`, `SW-006`, `SW-008`, `SW-014`, and
  `SW-017`
- Conflict: the relationship gate requires a retained delivery-topology
  relationship and says a qualifying source relationship proves only usable
  value, while the Fully Enabled rule lets a legal repeatable trigger route
  reach its cap without action-share, uptime, or frequency modeling. The
  W-Engine and Disc package rules then compare realized complete packages, but
  none of these rules explicitly
  states that selected-Result reachability and operation-aligned candidate
  value are separate gates. A controller can therefore promote mere trigger
  reachability into full competitive value, or reject an exact retained route
  by inventing a frequency requirement.

## Proposed change

For a W-Engine passive or Drive Disc 4-piece clause, first preserve and apply
its exact source-local holder, Specialty, Attribute, activation, action,
recipient, interval, threshold, stack, and other qualifiers. An exact retained
holder action, state, or intentionally controllable party operation that
satisfies those qualifiers establishes source reachability. Do not add an
in-combat, duration, frequency, action-share, rotation, or uptime condition the
source does not state.

Candidate valuation then asks a different question: whether that reachable
route belongs to the Agent's authored delivery topology or an intentionally
controlled party operation used by the current direction, without inserting,
repeating, or displacing a material core action solely to activate the
equipment. Only an operation-aligned clause contributes value through the
applicable `SW-017` relationship. A reachable but operation-misaligned clause
cannot establish a competitive axis, preserve a same-direction alternative, or
determine a representative. It receives no penalty and remains part of the
complete source-owned Setup package.

This additional operation-alignment question applies only where a clause's
realized value depends on activation, affected action, interval, or operation.
W-Engine Base ATK and advanced stats, Disc 2-piece effects, main stats,
effective substats, and unconditional supply continue through their existing
relationships and surface-specific opportunity gates without inventing an
action route.

Operation alignment proves neither admission nor priority. After this gate,
`SW-005` or `SW-006` still compares the complete realized package, advanced or
set stat supply, finite investment opportunity, nearest same-axis and
acquisition-role alternatives, material setup direction, and reversing
countercase under `SW-008`. A different trigger remains insufficient by
itself.

Selected Result projection remains a separate conclusion under the exact
source relationship and `SW-014`. Candidate admission cannot create a Result
relationship, and a Fully Enabled reachable value cannot create candidate
value. Retain only the smallest action, activation, threshold, or operation
distinction required by a current candidate, prepared setup, Setup package, or
Result; do not create a rotation model, equipment compatibility catalogue, or
runtime score.

## Evidence

- `docs/zzz-game-vocabulary.md` (`GV-006`) already separates trigger action,
  affected action, recipient, holder, Specialty, Attribute, interval, and
  source-local conditions. It also forbids adding timing or rotation
  qualifiers to an exact retained holder route. The proposed candidate gate
  consumes that grammar without changing it.
- `docs/source-fact-boundary.md` (`SF-005`) retains an action, activation,
  threshold, stack, or operation distinction only when it changes a current
  candidate, prepared setup, Setup package, applicability, or Result. This
  permits the exact distinctions needed by the gate without authorizing a
  catalogue.
- `src/workbench/content/agent-setup-candidates.ts`
  (`ENGINE_CANDIDATES_BY_AGENT`, `ENGINE_IDS_BY_AGENT_AND_POOL`, and
  `DISC_IDS_BY_AGENT_AND_PIECE`) authors candidate identity per Agent rather
  than deriving membership from legal activation or selected Result output.
- `src/workbench/content/representatives.ts` (`pulchraRepresentative`,
  `qingyiRepresentative`, `burniceRepresentative`, and
  `miyabiRepresentative`) separately authors deterministic complete setups
  after candidate closure. The current consumer does not rank equipment at
  runtime.
- `src/workbench/content/agent-equipment-effect-applicability.ts`
  (`AGENT_W_ENGINE_EFFECT_OVERRIDES`) and
  `src/workbench/content/agent-sources/w-engine-relationships.ts`
  (`selectedWEngineRelationships`) demonstrate that selected W-Engine
  projection is a clause-level holder conclusion rather than proof supplied by
  candidate membership.
- `src/workbench/content/agent-sources/drive-disc-relationships.ts`
  (`selectedDriveDiscRelationships`) and
  `src/workbench/content/agent-sources/drive-disc-effect-materializer.ts`
  (`materializeSelectedDriveDiscEffects`) likewise project selected Disc facts
  independently from `DISC_IDS_BY_AGENT_AND_PIECE`.
- `docs/brainstorms/2026-08-14-orphie-pulchra-vertical-requirements.md`
  (R9-R12 and R19) retains Blazing Laurel through Pulchra's frequent Assist
  route and usable Impact while assigning zero candidate value to its repeated-
  Basic squad clause. The same requirement excludes Ice-Jade Teapot and
  Shockstar Disco 4-piece because their Basic-centered effects miss Pulchra's
  EX, Assist, Chain, Ultimate, and off-field Aftershock direction, while
  retaining Shockstar's operation-independent Impact 2-piece.
- `docs/brainstorms/2026-08-14-harumasa-qingyi-vertical-requirements.md`
  (R10-R12) supplies the positive same-Specialty contrast: Qingyi's repeated
  Basic route aligns with Ice-Jade Teapot, The Restrained, and Shockstar Disco
  4-piece. The equipment categories do not decide the result; the authored
  holder operation does.
- `docs/brainstorms/2026-08-21-burnice-anomaly-vertical-requirements.md`
  (R9-R13) applies the same boundary outside Stun. Chaos Jazz aligns with
  Burnice's off-field interval, brief EX entry, and source-classified Assist
  Afterburn, while legal short on-field packages that cannot preserve that
  operation are excluded without an uptime score.
- `docs/brainstorms/2026-08-25-miyabi-general-damage-expansion-requirements.md`
  (R6-R7) shows why operation alignment is only a gate. Polar Metal and
  Woodpecker Electro have usable action packages for Miyabi, but Branch & Blade
  Song still wins the complete-package and finite-opportunity comparison, so
  those usable packages do not become 4-piece candidates.

## Nearest current consumer

Pulchra is the nearest established consumer because one current Agent closes
both equipment surfaces. `ENGINE_CANDIDATES_BY_AGENT.pulchra` admits Blazing
Laurel and excludes Ice-Jade Teapot;
`AGENT_W_ENGINE_EFFECT_OVERRIDES.pulchra.blazingLaurel` retains only the Impact
clause for selected projection; and `pulchraRepresentative` prepares Blazing
in the full pool. On the Disc surface,
`DISC_IDS_BY_AGENT_AND_PIECE.pulchra` retains Shockstar Disco as a 2-piece but
not a 4-piece. The accepted Pulchra requirement binds those outcomes to her
Assist-aligned Impact and EX/Assist/Chain/Ultimate/off-field delivery topology,
not to Stun Specialty, legal Basic access, or item identity.

## Contrast

Qingyi is the closest opposite outcome. Her authored repeated Basic delivery
aligns with Ice-Jade Teapot, The Restrained, and Shockstar Disco 4-piece, so
`ENGINE_CANDIDATES_BY_AGENT.qingyi` and
`DISC_IDS_BY_AGENT_AND_PIECE.qingyi` retain those packages and
`qingyiRepresentative` prepares Ice-Jade in the full pool. If the proposed
rule excluded a clause merely because it stacks, needs repeated actions, or is
not continuously active, Qingyi would be rejected incorrectly.

Miyabi supplies the over-admission contrast. Polar Metal and Woodpecker
Electro can align with retained actions, yet her current complete-package and
finite-opportunity comparison still excludes them as 4-piece candidates. If
operation alignment admitted a package automatically, that current outcome
would be reversed incorrectly.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-004`, `SW-005`, `SW-006`, `SW-008`, `SW-014`, and `SW-017`).
  `GV-006` and `SF-005` constrain the amendment but require no changed meaning.
- Supporting requirements affected: later W-Engine and Disc 4-piece authoring,
  and any bounded re-audit whose current rationale promotes legal trigger
  reachability into competitive value or rejects an exact authored route through
  an unstated frequency threshold. No Agent roster or candidate correction
  follows automatically from this record.
- Production and tests affected: none in this ACR. A later bounded source or
  Agent-local correction may change only the retained action/activation fact,
  candidate identity, representative, or selected relationship required by an
  exact current consumer. Existing shared source, relationship, candidate,
  preparation, and lifecycle coverage remains the default unless that review
  discovers a new mechanism failure.
- Visible Setup or Result consequence: none from this ACR or its owner
  amendment alone. Setup continues to show the complete source-owned admitted
  package. Candidate selectors remain a small Agent-authored competitive set,
  and Result continues to project only independently closed selected
  relationships.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-08-31T00:05:14.9249699+09:00`
