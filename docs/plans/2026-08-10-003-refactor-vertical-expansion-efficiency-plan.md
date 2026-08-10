---
title: "refactor: Validate vertical expansion efficiency"
type: refactor
status: active
date: 2026-08-10
---

# refactor: Validate vertical expansion efficiency

## Summary

Use the approved version-2.8-or-earlier Evelyn vertical to compare current and
lean post-contract implementation workflows on one settled unit and worker
intelligence on a second. Observe the frozen result only across later approved
verticals needed to complete content through version 2.8. Version 3.0+ content
is deferred until that service boundary is complete, when it will pressure-test
the established model rather than shape the current one.

---

## Problem Frame

The current extension boundaries are substantially better than during the
first vertical, but the Dialyn/Puffer checkpoint still spent more work on
requirements, planning, coverage, review, and correction than its production
delta alone suggests. A single successful lean expansion would not show that a
smaller workflow or lower-intelligence worker is dependable. Conversely,
reimplementing whole verticals only to compare models would spend the savings
the experiment is intended to find.

This plan separates workflow calibration from model calibration, uses a paired
same-checkpoint comparison only for a small settled unit, and then freezes the
result for three materially different conforming verticals.

---

## Requirements

**Eligibility and service boundary**

- R1. Base every run on closed product meaning and bounded exact-fact research;
  research or product-decision time must not be hidden inside only some run
  measurements.
- R2. Classify a target as conforming only when it reuses current formula,
  candidate, preparation, Result, lifecycle, and UI boundaries. A new common
  semantic is a product-authoring stop, not an experiment failure.
- R2a. Until the service completes content through version 2.8, calibration and
  confirmation targets must come from version 2.8 or earlier. Version 3.0+
  Agents and equipment are deferred pressure tests, not current admission
  candidates or evidence for shaping the version-2.8 product model.

**Paired calibration**

- R3. Treat each lean post-contract implementation workflow version as one
  predefined bundle: targeted code/exemplar reads, a compact settled worker
  brief, a controller-authored contract-to-assertion matrix, focused checks at
  unit boundaries, and one complete final gate. Compare it with the current
  implementation workflow at a fixed model; vary only worker model/reasoning in
  the next pair. Requirements, planning, and fact settlement remain fixed inputs
  and are not part of the causal workflow claim.
- R3a. W1's two first-pass failures retire Lean V1 for later paired work. M1 uses
  a staged Lean V2 calibration: first compare current and Lean V2 workflows with
  the same `gpt-5.6-sol` xhigh worker, then run the lower-model arm only if the
  Lean V2 attempt passes. V2 requires production-default fixtures and paired
  positive/negative assertions for the `exact`, `replace`, `omit`, `preserve`,
  and `default` contract language that is actually present in the unit; M1 marks
  `replace` not applicable. Once M1 starts, do not revise V2 inside any attempt.
- R4. Use the lowest credible worker level for a settled bounded unit, not the
  lowest available model for every task. Escalate on evidence rather than
  retrying an unsuitable level repeatedly.
- R5. Apply the single Fixed Acceptance Checklist below to every attempt and
  product run. A cheaper workflow or model cannot change its gates or reviewer.
- R6. Validate model routing on the same closed bounded unit from the same Git
  checkpoint in separate worktrees. Do not duplicate an entire vertical merely
  to create a model comparison.

**Confirmation and failure policy**

- R7. After calibration, freeze workflow and routing and observe them on the
  next independently approved conforming verticals within the version-2.8
  completion sequence. Do not choose product work merely to complete an
  experimental seam matrix; limit conclusions to local, provider,
  contextual-candidate, and action seams actually observed.
- R8. A run fails if review finds a P0/P1/P2 defect, already-settled product
  meaning needs correction, or a fixed gate fails. Keep every failure and
  substitution in the denominator. Allow at most one recalibration and one
  replacement confirmation attempt before ending with a negative or
  inconclusive result. Version any changed protocol or routing and never pool
  pre- and post-recalibration successes for the changed work-class claim.
- R8a. M1-R is the single user-approved diagnostic exception to R4, M1's
  same-level no-retry rule, and the ordinary recalibration count. It does not
  revise, replace, or pool with M1-M. It repeats only the lower-model arm after
  the controller has removed the recorded package-manager deviation and
  calibrated the pre-existing timeout boundary. Its maximum three fresh
  attempts form a separate denominator and may establish repeatability only for
  the exact settled M1 packet. M1-R does not count toward C1-C4 or R10's
  confirmation series and authorizes no workflow revision, artifact correction,
  replacement attempt, or later model comparison.

**Measurement and promotion**

- R9. Record exact resource metrics only when the platform exposes them. Never
  estimate token use or infer active time from commit timestamps.
- R10. Promote a reusable workflow to `docs/solutions/` or repository guidance
  only after the confirmation series succeeds. Do not create a skill, registry,
  universal Agent schema, or generic calculator as part of the experiment.

---

## Scope Boundaries

- Evelyn is the user-approved calibration target and Soldier 11 is the approved
  reserve. This approval fixes experiment ordering; exact retained requirements
  and competitive setup meaning were closed in completed efficiency-plan U2
  before W1/M1 implementation.
- The active product boundary completes content through version 2.8 first.
  Version 3.0+ content, including Sigrid and Remielle, is excluded from current
  calibration and confirmation and returns later as pressure testing.
- A calibration target must reuse an existing formula family and Result
  vocabulary, with no new provider-resolution, holder-allocation, or preparation-
  adjustment mechanism, product operation category, or UI surface. A target-
  specific authored adjustment may use an already-established preparation
  mechanism. Evelyn's first use of
  the already-authorized action-local scale operation may add only the bounded
  presentation mode needed by that current consumer. Existing provider,
  candidate, and action consumers may otherwise be exercised without adding
  semantics.
- Exact game-source facts remain ephemeral until a target's current consumer
  passes the retention gate; no source registry or research archive is added.
- Each product vertical keeps its own compact requirements delta, target plan,
  logical commit, and ordinary acceptance. Confirmation observes later approved
  roadmap work; it does not reserve three product slots for the experiment.
- Raw file count, diff size, test count, or document length are diagnostics,
  not optimization goals. Required distinctions and behavior-bearing coverage
  may increase them.
- UI redesign, test deletion for its own sake, broad content refactoring,
  CI/telemetry infrastructure, external issue tracking, and unrelated
  `CONTRIBUTING.md` cleanup are outside scope.

---

## Context & Research

### Current Extension Seams

- Closed content owners live under `src/workbench/content/`, with
  `src/workbench/content.ts` as the facade. New Agent identity, equipment,
  retained values, setup direction, and representative choices remain explicit
  rather than registry-driven.
- `src/workbench/preparation.ts`, `src/workbench/candidates.ts`, and
  `src/workbench/state.ts` separate authored first choices, effective candidate
  membership, direct edits, and complete-setup lifecycle.
- `src/workbench/provider-effects.ts` owns observation, recipient delivery,
  candidate pressure, and bounded opportunity queries. Agent-local modules in
  `src/workbench/calculation/agents/` own projection.
- Shared tests are already organized around state/preparation, calculation
  mechanisms, authored policies, representative flows, component behavior, and
  integrated Party/Setup/Result journeys. A new vertical should not recreate a
  per-Agent suite.

### Reference Baseline

Commit `e965371` is a cross-cutting contextual-candidate reference, not an
equivalent control for a local Agent admission.

| Dimension | Dialyn/Puffer reference |
|---|---:|
| Changed files | 17 |
| Documentation delta | +661 / -7 |
| Production delta | +121 / -14 |
| Test delta | +415 / -1 |
| New requirements and plan lines | 649 |
| Final automated result | 144 tests and production build passed |
| Review corrections | P1 base-ATK basis; P2 Cissia/Cordis composition; P2 root-hierarchy coverage |
| Exact token and active-time baseline | unavailable; do not estimate |

The earlier `22e836d` and `e3a27c4` refactors already paid for split content
owners and mechanism/policy/flow tests. This experiment therefore evaluates the
post-refactor extension path rather than comparing current work directly with
pre-refactor verticals.

### Approved Target Screen

This screen classifies experiment fit; it does not approve a product admission
or retain external research evidence.

| Candidate | Classification | Current conclusion |
|---|---|---|
| Evelyn | Approved calibration target | Version 1.5 Fire Attack Agent with existing portrait, W-Engine, and Disc assets. Her standard damage, ATK/CRIT, Chain/Ultimate, Astra, Seed, and Dialyn/Puffer relationships fit current consumers; the reviewed Evelyn requirements and plan close the retained facts without a new common semantic. |
| Soldier 11 | Approved reserve | Version 1.0 Fire Attack Agent with existing Brimstone and Disc assets. Use only if Evelyn hits an authoring stop; revalidate her current competitive representative package before substitution. |
| Aria | Version-2.8 completion, not experiment-conforming | Version 2.6 Anomaly behavior requires new formula/product meaning. Its own normal-workflow vertical never counts as an experiment run; only a later target reusing already-landed Anomaly semantics may be screened as conforming. |
| Sigrid / Remielle | Deferred version-3.0+ pressure | Outside the current completion boundary regardless of apparent implementation fit or source availability. Revisit only after version-2.8 service completion. |

### Institutional Learning

- `docs/brainstorms/2026-08-06-first-vertical-completion-review-requirements.md`
  requires a shorter next-vertical sequence without weakening fact review,
  lifecycle correctness, or browser acceptance.
- `docs/ideation/2026-08-07-agent-slot-extensibility-ideation.md` requires a
  concrete consumer to prove another abstraction or test compression.
- `docs/solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md`
  requires preserved baseline, explicit variables, authority gaps, and
  representative interaction states before visual comparison.
- `CONTRIBUTING.md` fixes `npm run check`, applicable real-browser verification,
  complete-diff review, and completed checkpoint plans as the repository's
  definition of done.

---

## Experiment Design

### Variables and Controls

| Pair / run | Fixed | Variable |
|---|---|---|
| Workflow calibration | Same clean base commit and hashed controller-authored red patch, closed contract, immutable tests, `gpt-5.6-sol` xhigh worker, serial complete gates, blinded reviewer | Current workflow versus Lean V2 |
| Model calibration | Reuse the passing Lean V2/sol artifact as reference; same base and patch hash, contract, immutable tests, Lean V2, serial gates, and blinded reviewer | `gpt-5.6-sol` xhigh versus one lower credible worker assignment |
| Confirmation | Only workflow/routing demonstrated by the applicable same-version calibration; otherwise current/reference workflow, fixed acceptance, reviewer, metrics, and version-2.8 ceiling | Independently approved version-2.8-or-earlier product vertical and its existing seams |

The current implementation bundle uses broad applicable code-pattern reading,
checks after each change cluster, and the normal intermediate review breadth.
The Lean V2 bundle uses the frozen requirements/plan and its contract-to-
assertion matrix as input, reads the owning code plus one concrete exemplar,
checks at bounded-unit completion, and relies on the same complete final
acceptance. Either path exits conforming mode when a new semantic or authority
conflict appears. Requirements and planning remain ordinary reviewed product
work; their end-to-end cost is observed, not paired.

### Fixed Acceptance Checklist

Every paired attempt and product run uses the same checklist:

1. Before worker dispatch, freeze a contract-to-assertion matrix and one
   controller-authored executable acceptance suite for the bounded
   unit. Each row names the observable contract, production default path,
   required output, forbidden output, preserved baseline, and owning test
   family. A fixture cannot supply an optional override that production is
   expected to default, and workers cannot weaken or replace the frozen suite.
2. Trace retained facts and visible outcomes to the owning authorities and
   approved target requirements. Preserve selected and candidate Setup surfaces,
   accessible complete equipment descriptions, Result parent values and
   breakdowns, action differences, gauges, lifecycle, and incomplete Result.
3. Add behavior coverage to the shared source-owned equipment-summary,
   mechanism, policy, representative-flow, component, or App families without
   creating a default per-Agent suite.
4. Pass focused affected tests, `npm run check`, and `git diff --check`.
5. For every complete Agent product run, pre-register and run the same in-app-
   browser flow: desktop and narrow Party Apply; selected and candidate Setup
   inspection; one required selection made incomplete and repaired; completed
   Setup-to-Result projection; keyboard traversal and focus return; and a clean
   console. Add source-focus states when the target supplies or receives a
   visible cross-Agent contribution. W1 and M1 are deliberately smaller than an
   Agent admission and have no reachable standalone App route; their paired
   attempts use the exact component behavior named below, while the accepted
   integrations receive this full Evelyn browser gate in the completed product
   run.
6. Run an independent semantic/correctness review with a frozen prompt and
   severity rubric using `gpt-5.6-sol` xhigh. Paired diffs are anonymized for
   first-pass review.
7. Accept only when there are no P0/P1/P2 findings and no correction of already
   settled product meaning. Record findings before any correction.

### Lean Post-Contract Bundle V2

Lean V2 changes the validation shape, not the accepted product scope:

1. The controller supplies the exact owned files, one allowed code exemplar per
   changed content family,
   frozen values/copy, exclusions, and the contract-to-assertion matrix. The
   worker never broadens discovery unilaterally. A missing owner, consumer, or
   authority conflict stops M1 and records the packet invalid. Any expanded
   packet is a new protocol version that must repeat pre-dispatch document review
   and verification; it is never a restart counted as V2 evidence.
2. Tests exercise production defaults. Optional precision, presentation,
   fallback, or formatting inputs are omitted unless that override is itself the
   contract under test.
3. Each observable normative verb present in the matrix is bidirectional:
   `exact` compares the full
   value/copy, `replace` requires the successor and excludes the predecessor,
   `omit` asserts absence, `preserve` keeps a representative existing behavior,
   and `default` reaches the result without a test-only override.
4. One shared table-driven family carries repeated content cases. New Agent- or
   equipment-specific files are forbidden unless a distinct policy or mechanism
   cannot be expressed by the current family.
5. The controller authors one named expected-red unified patch in a controller-
   owned experiment-artifact directory outside the product repository, records
   its resolved path and SHA-256 in the ledger, creates every attempt worktree
   from the same clean commit, verifies the patch there, and applies that exact
   patch to each. The acceptance patch is never committed alone. Workers may
   change only owned production files, then record one green focused run. An
   unexpected failure, new semantic, acceptance-test edit, or fixture-only
   workaround stops the attempt.
6. Workers stop after their focused gate and diff check. The controller runs a
   complete `npm run check` serially for every newly produced arm, reusing rather
   than rerunning the passing Stage A Lean artifact in Stage B, then performs
   anonymized review. The complete-diff review includes both each production
   diff and the named acceptance patch; its pre-apply check covers patch
   whitespace that ordinary `git diff --check` cannot see for an untracked test.
   Concurrent worktree load cannot become an uncontrolled variable.
   Every Node command uses the repository-approved npm executable. If npm is not
   on a worker's `PATH`, the controller supplies its already-verified absolute
   path; the worker stops instead of substituting pnpm/yarn or installing or
   rearranging shared dependencies.
7. The frozen reviewer explicitly checks production-default coverage, required
   and forbidden outputs, preserved baselines, schema restraint, and whether a
   test fixture is carrying behavior that belongs to production.

Before M1 worktrees are created, apply one broad plan review, resolve its
actionable findings, and run one targeted verification review over the revised
M1 packet. If that verification finds an actionable issue, permit one bounded
correction and one final targeted verification. A further P0/P1/P2 finding ends
M1 as an authoring stop rather than expanding the process again. V2 remains a
draft during these authoring rounds and is frozen only after a finding-free
verification; once stable, no further pre-emptive process expansion is allowed.

### Initial Routing Hypotheses

| Work class | Lower starting hypothesis | Escalation signal |
|---|---|---|
| Inventory and exact file mapping | `gpt-5.6-terra`, low | Missed owner, consumer, or dependency |
| Exact source-owned content with frozen values and no semantic decision | `gpt-5.6-terra`, low | Missing clause, wrong value, scope drift, or representation invention |
| Broader settled content and behavior work | `gpt-5.6-terra`, medium | Scope drift, representation invention, or repeated gate failure |
| Existing provider/calculation composition | `gpt-5.6-terra`, high | Formula, timing, recipient, or action-scope uncertainty |
| Product meaning and final review | `gpt-5.6-sol`, high/xhigh | Never automatically downshifted during this experiment |

One correction cycle, authority conflict, or inability to state the visible
consequence ends the lower attempt and records escalation.

### Frozen Calibration Units (W1 V1 / M1 V2)

Both units are below the size of a vertical and contain no open product meaning.
The controller creates isolated worktrees from the stated checkpoint, gives each
attempt the same product contract, immutable acceptance suite, exact owned
production files, mutation limits, behavior cases, and final reviewer prompt,
and varies only the registered independent variable. A current-workflow attempt
may perform its registered broad applicable reads; a Lean attempt receives only
the named exemplars. Every worker may modify only owned production files.

#### W1 — Existing Result scale presentation

| Field | Frozen value |
|---|---|
| Work class | Bounded existing-Result representation |
| Product behavior | Existing operations/gauges can present an action-local `×1.25` scale at Combat or Fully Enabled, including threshold `Active`/inactive output; current `+2s` and `+50%` additive output is unchanged |
| Owned production | `src/workbench/calculation/result.ts`; `src/components/ResultPanel.tsx` |
| Owned test | `src/components/ResultPanel.test.tsx` |
| Excluded | Evelyn identity/content, calculation, new component/region, generic operator or expression schema |
| Fixed worker | `gpt-5.6-sol`, xhigh for both attempts |
| Variable | Current implementation workflow versus the pre-registered Lean V1 bundle captured at `8dcf7e0`; Lean V2 does not redefine this historical run |
| Focused gate | ResultPanel tests covering additive preservation, Combat/Fully scale formatting, active/inactive gauge output, and visible/accessibility parity |
| Complete gate | `npm run check`, `git diff --check`, frozen blind semantic/correctness review |
| Common checkpoint | Evelyn documentation checkpoint `8dcf7e039b79b0104cad8f0aeddcc622d0188e2d` |

The fixed brief asks for the smallest typed distinction that preserves additive
output and renders multiplication without `+` or `%`. It forbids a new product
operation category, free-form operator strings, a generic arithmetic AST, or an
Evelyn-specific conditional in `ResultPanel`.

#### M1 — Source-owned equipment facts and compressed summaries

| Field | Frozen value |
|---|---|
| Work class | Settled source-owned equipment content and summary behavior |
| Product behavior | Heartstring Nocturne, Steel Cushion, Inferno Metal 2-piece, and Hormone Punk 4-piece retain exact source-owned values and semantically compressed summaries; their reachable selected/candidate descriptions are verified when Evelyn identity is admitted |
| Owned production | `src/workbench/content/types.ts`; `src/workbench/content/engines.ts`; `src/workbench/content/discs.ts` |
| Controller-owned immutable test | Create `src/workbench/content/equipment.test.ts` as one shared source-owned equipment-summary patch, record its resolved external path and SHA-256 outside the product tree, and apply it identically without a standalone commit; workers cannot edit it |
| Excluded | Evelyn identity/pools/representative/calculation, candidate policy, new content schema, trigger/duration prose, Base ATK disclosure |
| Fixed workflow | Stabilized Lean V2 bundle defined in R3a and below |
| Stage A workflow workers | Current workflow and Lean V2 both use `gpt-5.6-sol`, xhigh |
| Stage B reference | Reuse the passing Lean V2/sol artifact from Stage A |
| Lower worker | `gpt-5.6-terra`, low — the lowest credible assignment for exact settled content with no semantic decision |
| Named exemplars | W-Engine: `W_ENGINE_FACTS.serpentineSeeker` plus `W_ENGINES.serpentineSeeker`; Disc: `DRIVE_DISC_FACTS.pufferElectro` plus `DRIVE_DISCS.pufferElectro` |
| Focused gate | Table-driven W1-W5 source vectors, metadata, assets, and compressed summary outputs; existing representative equipment-summary and selected/candidate accessibility regressions remain green |
| Complete gate | `npm run check`, `git diff --check`, frozen blind semantic/correctness review |
| Contract matrix | Exact W1-W5 vectors, identity/availability metadata, asset bindings, and compressed lines; one rank-derived production-default summary call; explicit remaining refinements; required fragments; forbidden Base ATK and trigger/duration/refresh prose; preserved generic equipment summaries and accessibility regressions; `replace` is not applicable |
| Gate sequence | Controller records the clean base commit plus the resolved external path and SHA-256 of the shared uncommitted red-suite patch; it verifies and applies that exact patch to every arm; each worker runs the green focused equipment tests and production diff check; controller runs complete gates serially and reviews both production diff and acceptance patch |
| Common checkpoint | The stable Lean V2 documentation commit after `8513e80` plus the identical uncommitted acceptance patch's resolved external path and SHA-256; record all before Stage A starts |
| Product retention boundary | No M1 content or test artifact is applied, staged, or committed to the product branch alone. Preserve the final production and immutable acceptance patches by resolved external path and SHA-256 until Evelyn identity/current candidates land with both atomically in Evelyn-plan U3 |

The frozen M1 contract-to-assertion matrix is:

| Record | Production default path | Exact retained/source-owned facts | Required compressed output | Forbidden or preserved output |
|---|---|---|---|---|
| Heartstring Nocturne | Assert the rank-derived default through `passiveLines(defaultRefinementFor(W_ENGINES.heartstringNocturne.rank))`; assert W2-W5 explicitly | ID/name `heartstringNocturne` / `Heartstring Nocturne`; S-rank; limited; `heartstring-nocturne.webp`; Base ATK `713`; CRIT Rate `+24%`; CRIT DMG `[50, 57.5, 65, 72.5, 80]`; per-stack Chain/Ultimate Fire RES Ignore `[12.5, 14.5, 16.5, 18.5, 20]`; reachable maximum is two stacks | W1-W5 respectively: `CRIT DMG +50/57.5/65/72.5/80%`; `Chain Attack & Ultimate Fire RES Ignore +25/29/33/37/40%` | Passive lines omit Base ATK, entry, stack-acquisition, refresh, and duration prose; advanced CRIT Rate remains source-owned metadata |
| Steel Cushion | Assert the rank-derived default through `passiveLines(defaultRefinementFor(W_ENGINES.steelCushion.rank))`; assert W2-W5 explicitly | ID/name `steelCushion` / `Steel Cushion`; S-rank; non-limited; `steel-cushion.webp`; Base ATK `684`; CRIT Rate `+24%`; Physical DMG `[20, 25, 30, 35, 40]`; back-attack DMG `[25, 31.5, 38, 44, 50]` | W1-W5 respectively: `Physical DMG +20/25/30/35/40%`; `Back Attack DMG +25/31.5/38/44/50%` | Passive lines omit Base ATK and trigger/duration prose; both clauses remain even when one current Agent projector consumes only back-attack DMG |
| Inferno Metal | `DRIVE_DISC_FACTS.infernoMetal` and `DRIVE_DISCS.infernoMetal.twoPieceEffect` with no optional input | ID/name `infernoMetal` / `Inferno Metal`; `inferno-metal.webp`; Fire DMG `+10%` | `Fire DMG +10%` | M1 adds no Inferno 4-piece fact or unrelated clause |
| Hormone Punk | Existing `DRIVE_DISC_FACTS.hormonePunk` and `DRIVE_DISCS.hormonePunk` with no optional input | Preserve ID/name `hormonePunk` / `Hormone Punk`, `hormone-punk.webp`, and 2-piece ATK `+10%`; add 4-piece ATK `+25%` | 2-piece `ATK +10%`; 4-piece `ATK +25%` | Omit entry, trigger, and duration prose; do not change the existing 2-piece output |

The controller-authored equipment test asserts Base ATK, advanced stat, rank,
limited status, identity, asset binding, complete stored vectors, and every
W1-W5 passive line. It checks every forbidden fragment and keeps one
representative existing W-Engine and Disc row green so the new records cannot
replace or specialize the common summary behavior. The S-rank default path must
resolve W1; W2-W5 are explicit refinement behavior, not defaults.

The fixed brief supplies the exact retained vectors and compressed output from
the Evelyn requirements as matrix rows rather than leaving workers to restate
the contract. The immutable tests pair every required fragment with the approved
forbidden-fragment set. They do not force an unreachable candidate UI before
Evelyn's closed identity maps exist; Evelyn-plan U3 later verifies the final
production and immutable acceptance patches through reachable selected and
candidate controls. A later U3 defect
attributable to M1 identity, metadata, asset, or summary work retroactively fails
that M1 arm and its routing claim. One semantic correction, missing source-owned
clause, scope invention, acceptance-test edit, fixture-only workaround, or
failed gate ends the lower attempt; it is not retried at the same level.

#### Deterministic selection and deferred-integration rule

W1 retains its recorded V1 rule. Apply the following staged rule to M1:

1. Stage A compares current/sol and Lean-V2/sol from the same clean base commit
   with the same hashed acceptance patch applied. The arms run in fresh isolated
   contexts and receive no reasoning or artifact from the other arm.
2. If Lean V2 fails, do not run Stage B. The passing current artifact is the
   product artifact; if neither passes, end M1 and correct through the reference
   route outside the experiment.
3. If Lean V2 passes, its exact artifact becomes the provisional product artifact
   and Stage B reference; Stage A's current artifact remains a workflow control
   and cannot later replace it. The Lean-V2/terra-low arm starts fresh from the
   same base and acceptance patch.
4. In Stage B, select terra-low only when it alone passes every gate or when both
   pass with equal quality and it has a lower exact measured total. Otherwise,
   including unavailable or tied comparable totals, retain the Lean-V2/sol
   reference. This Stage B choice is the final product artifact and supersedes
   Stage A's control outcome.
5. Resource-unavailable runs still record workflow/model correctness capability,
   but support no workflow- or cost-efficiency claim and promote no default. Use
   of one passing artifact for Evelyn is not reusable-workflow promotion.
6. Export the final production diff as a second named external patch, record its
   resolved path and SHA-256, and preserve the source worktree. Without applying,
   staging, or committing either patch to the product branch alone, Evelyn-plan
   U3 applies both the final production patch and the immutable acceptance patch
   together with Evelyn identity, candidate/preparation consumers, and reachable
   selected/candidate verification as one atomic product diff.

This rule is fixed before measurements, preserves the current-consumer retention
gate, and prevents controller preference from choosing the artifact or
prerequisite checkpoint after results are known. Lean V2 is validated only for
the settled source-owned content work class exercised by Stage A; other work
classes retain the current/reference workflow.

#### Fixed Evelyn browser route after integration

The complete U4 product run, regardless of which paired diffs are accepted,
uses this exact route at desktop and narrow widths:

1. Apply Evelyn/Astra/Dialyn at full/M0 with Evelyn Focus. Inspect Evelyn's
   complete local Hormone representative plus both Astral and Puffer candidate
   descriptions.
2. Select Puffer with keyboard, verify fixed-surface focus return and unchanged
   Astra/Dialyn setups, then inspect Evelyn's Chain/Ultimate parent, Ultimate
   child, active 80% gauge, `×1.25` operation, and selected Puffer description.
3. Switch Evelyn to non-limited in that context and verify a Fully Enabled
   68.4% inactive gauge with `×1.00`, no scale operation, and readable selected/
   candidate descriptions.
4. Stage Seed at M2, then apply slots Seed/Evelyn/Anby at full with Evelyn Focus.
   Verify full Hormone Evelyn's exact `2614.8` Initial ATK, Fire Slot 5
   preparation, and Seed source focus. Directly select Woodpecker 4-piece to make
   Evelyn the earlier exact-`2450.6` tied Attack and verify the slot fallback.
5. Change Seed to M1, directly select Evelyn PEN Ratio, then change only Seed
   back to M2. Verify PEN clears, party Result becomes empty, invalid PEN choices
   remain absent, and keyboard selection of Fire DMG returns focus and restores
   Result without changing the other setups or the tied Vanguard.
6. Run both contexts at desktop and the repository's current narrow breakpoint,
   preserve source focus without view expansion, and require a clean console.

### Measurement and Claims

Freeze the bounded unit, prompt granularity, models, reviewer, and acceptance
before either paired attempt begins. A paired envelope starts when its worktrees
are created and ends after first-pass blind review. A product-run envelope starts
with its bounded source screen and ends after final independent acceptance;
research, controller, worker, reviewer, and correction cost all belong to its
total. Record per attempt and per whole vertical:

| Field | Required record |
|---|---|
| Scope | seam class, exact file/test ownership, new common semantics (must be zero) |
| Resource | exact tokens and active elapsed time when exposed, turns, tool calls; controller/research/worker/reviewer split and total |
| Routing | protocol version, model/reasoning, escalation, start/end checkpoint |
| Artifacts | requirements/plan, production, and test line deltas |
| Quality | gate attempts, browser states, interventions, semantic corrections, P0/P1/P2 findings |
| Outcome | first-pass accepted, corrected product result plus failed experiment row, authoring stop, or inconclusive |

Do not infer unavailable tokens or active time. Controller interventions are a
quality diagnostic, not a substitute for lower total cost. Claim causal
efficiency only for a paired post-contract unit with a lower measured total and
equal quality. Requirements/plan and whole-vertical totals support only
observational non-regression unless later paired separately. Generalize neither
claim beyond the tested work class and observed seam classes.

### Bounded Failure Policy

- Pre-register each target's eligibility, version, and seam class after product
  approval but before implementation. A substitute also requires product
  approval and must remain within version 2.8 or earlier.
- A failed product run is corrected and completed normally; valid user-facing
  work is never reverted solely for the experiment. Its experiment row remains
  failed.
- Permit one recalibration of the affected work class and at most one later
  independently approved replacement confirmation. Maximum confirmation count
  is four attempts for three successes.
- A recalibration creates a new protocol version. Product acceptance rows remain
  valid, but a changed work class may use only same-version evidence; if the
  bounded attempts cannot repeat it sufficiently, U6 marks that class
  inconclusive instead of pooling earlier successes.
- A second failure, exhausted target eligibility, or missing fixed measurement
  ends the experiment as negative or inconclusive and proceeds to U6. There is
  no loop until three easy successes appear.

### Experiment Ledger

Fill the resource and quality fields defined above; keep this table as the
index, not a second rationale document.

| ID | Purpose | Target / unit | Protocol | Checkpoint | Outcome |
|---|---|---|---|---|---|
| W1 | Current versus lean post-contract implementation pair | Existing Result scale presentation | V1 | `8dcf7e039b79b0104cad8f0aeddcc622d0188e2d` | Both first-pass attempts failed; corrected reference result committed at `8513e80` |
| M1-W | Current versus Lean V2 workflow calibration | Source-owned Evelyn equipment facts and summaries | V2, then the single permitted V3 recalibration | `ac068c2551359a9f20dcd1a470d48f42cbf6448b`; acceptance patch SHA-256 `ACAD6933579977CCC8112095F8B56C65C80F8B2FF91E7063E0372FAE7C554B36`; baseline-stability patch SHA-256 `2AE805DBE380D5B5023E052D3A372A5A30FC9FAD8099D1E986F01A865D691848` | V2 failed on a shared baseline timeout; after the one recalibration, both V3 arms passed 152/152, build, diff check, and blind review with equivalent quality |
| M1-M | Lean V2 reference versus lower-worker calibration | The same source-owned Evelyn equipment facts and summaries | V3 | Same base and hashed patches; exact passing Lean-V2/sol artifact reused as reference | terra-low passed 5/5 focused checks but introduced a package-manager tooling deviation and failed the controller full gate at 149/152 on three 5-second integration-test timeouts; later inspection also found two Disc summaries duplicating retained numeric facts instead of deriving from them; Lean-V2/sol retained procedurally, without a model-superiority claim |
| M1-R | Lower-model routing diagnostic repetition after harness calibration | The unchanged M1 source-owned equipment facts and summaries | V3-R | Protocol commit; acceptance SHA-256 `ACAD6933579977CCC8112095F8B56C65C80F8B2FF91E7063E0372FAE7C554B36`; applied test SHA-256 `C60961AAAB94F356A86A82032B4C6C086DFB5FD04E5243FDBFB3AF0E37BF41E5`; worker packet SHA-256 `6E5C1E61BC04CA7056987107D20E4C021D42B1A047F055EA14F1B9F806A721CC`; review packet SHA-256 `FB4DB6411886E64153AD93594F75204EA011DA1408244CF16A511F62CE4D6426` | Pending; run up to three independent Lean-V2/terra-low attempts, stopping on the first non-pass and never pooling M1-M |
| C1 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C2 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C3 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C4 | Single permitted replacement | Only after one failed confirmation | Pending | Pending | Not run |

#### W1 V1 result

| Field | Current / reference | Lean |
|---|---|---|
| Scope | Result operation/gauge scale presentation; the same three owned files; zero new common semantics beyond the approved typed presentation | Same |
| Routing | `gpt-5.6-sol`, xhigh; current workflow | `gpt-5.6-sol`, xhigh; lean post-contract workflow |
| Resource | 38 worker tool calls reported; exact tokens, active elapsed time, turns, and controller/reviewer split unavailable | Exact tokens, active elapsed time, turns, tool calls, and controller/reviewer split unavailable |
| Artifacts | Production/test `+223/-8`; no requirements change | Production/test `+223/-8`; no requirements change |
| Quality | Focused 4/4 and full 147/147 passed before review; blind P1 found scale-gauge default rounding `×1.25` to `×1.3` | Focused 3/3 passed after one scale-format correction; repeated worker full gates and the controller full gate timed out in existing App Setup tests; blind P1 found active gauges retained visible threshold-scale copy |
| Browser | Not applicable before an admitted production scale consumer exists | Same |
| Outcome | First-pass failed; reference route corrected the precision default, then focused 4/4, full 147/147, build, and diff check passed | First-pass failed; not integrated |

No workflow-efficiency claim is supported: both first-pass attempts failed the
frozen review gate, and exact comparable resource totals were unavailable. The
corrected reference result completes the product unit but remains part of the
failed W1 experiment row.

#### M1 staged calibration result

| Field | Current / sol-xhigh | Lean V2 / sol-xhigh | Lean V2 / terra-low |
|---|---|---|---|
| Fixed input | Base `ac068c2551359a9f20dcd1a470d48f42cbf6448b`; acceptance patch SHA-256 `ACAD6933579977CCC8112095F8B56C65C80F8B2FF91E7063E0372FAE7C554B36` | Same | Same |
| V2 first attempt | Focused 5/5 and production diff check passed; full gate failed on the same existing App Setup timeout reproduced on the clean base | Same | Not run because Stage A had not passed |
| V3 recalibration | Baseline-stability patch SHA-256 `2AE805DBE380D5B5023E052D3A372A5A30FC9FAD8099D1E986F01A865D691848`; focused 5/5, full 152/152, strict build, and diff check passed | Same | Same fixed input; focused 5/5 and diff check passed |
| Blind review | Pass; no findings | Pass; no findings; semantically equivalent to current apart from declaration order | Not run after the failed complete gate |
| Post-gate artifact inspection | Source-owned summaries derive from retained facts | Same | `types.ts` and `engines.ts` are byte-identical to the Lean-V2/sol artifact; `discs.ts` preserves the same visible values but hard-codes `ATK +25%` and `Fire DMG +10%` instead of deriving those summaries from the retained facts |
| Complete-gate deviation | None | None | Worker used `pnpm` after failing to locate npm, moving shared npm packages into `.ignored`; the controller restored dependencies without retaining a lockfile change, then the full gate stopped at 149/152 on three existing 5-second integration-test timeouts |
| Production artifact | 39 additions / 1 deletion in the three owned content files | 39 additions / 1 deletion in the three owned content files | Same scope and size |
| Resource evidence | Exact tokens, active elapsed time, turns, and comparable total cost unavailable | Same | Same; worker also reported no exact aggregate metrics |
| Outcome | Passing workflow control; cannot replace the pre-registered Lean reference after Lean passes | **Selected final M1 production artifact** | Failed fixed gate; no retry at the same level |

The selected production patch is preserved outside the product repository at
`C:\Users\mdy06\.codex\visualizations\2026\08\09\019fe6ab-6e74-7213-8dc4-947536edfd55\m1-v3\artifacts\m1-final-production.patch`
with SHA-256
`273559587DDC3B911781D5D031D8FBD6BA79CB0B9AD6BE016B5AD9107A8B110C`.
The immutable acceptance patch remains at
`C:\Users\mdy06\.codex\visualizations\2026\08\09\019fe6ab-6e74-7213-8dc4-947536edfd55\m1-v2\artifacts\m1-equipment-acceptance.patch`
with SHA-256
`ACAD6933579977CCC8112095F8B56C65C80F8B2FF91E7063E0372FAE7C554B36`.
Neither patch is applied, staged, or committed to the product branch alone;
Evelyn U3 must apply them atomically with the admitted identity and candidate
consumers.

M1 demonstrates that Lean V2 can preserve correctness for this settled
source-owned equipment-content seam at the reference model. The frozen rule's
selection of Lean-V2/sol is procedural, not evidence that sol-xhigh is inherently
superior: exact comparable resource totals were unavailable, terra-low's full
gate was confounded by the execution environment, and its otherwise correct
visible output retained one source-derivation quality gap. M1 therefore supports
neither a workflow-efficiency claim nor a lower-model default.

#### M1-R routing diagnostic repetition

M1-R answers only whether `gpt-5.6-terra`, low can repeatedly implement the
already-settled M1 content seam under the stabilized Lean V2 workflow. It is not
a replay that can turn M1-M into a pass, and it does not compare workflow cost.
The selected Lean-V2/sol patch remains the deferred Evelyn production artifact
regardless of M1-R's outcome. This diagnostic is the current user-approved
experiment task, but it is not a product dependency: it cannot block or replace
Evelyn U3/U4, any approved version-2.8 delivery, or the later C1-C4 series.

The controller calibrated the harness before freezing V3-R. Three serial clean
full-suite controls at commit `61334ce` passed 147/147. The longest integrated
Setup journey took `4.949-6.515s`; its local `10s` timeout is therefore a measured
guard for a valid long interaction, not a global timeout relaxation. The next
slowest measured test peaked at `4.310s`; this calibration changed no other
timeout setting. The causal boundary is: a correct multi-step App journey
normally crosses its previous default limit, the runner can interrupt it before
its assertions, and one test-local limit preserves both those assertions and a
finite hang guard.

Freeze the following V3-R protocol before dispatch:

1. Create a maximum of three fresh isolated worktrees from the same clean
   protocol commit and apply the immutable acceptance patch whose SHA-256 is
   `ACAD6933579977CCC8112095F8B56C65C80F8B2FF91E7063E0372FAE7C554B36`.
   Do not apply either prior M1 production artifact.
2. Give each worker the input-only packet at
   `C:\Users\mdy06\.codex\visualizations\2026\08\09\019fe6ab-6e74-7213-8dc4-947536edfd55\m1-r\artifacts\m1-r-worker-packet.md`,
   SHA-256 `6E5C1E61BC04CA7056987107D20E4C021D42B1A047F055EA14F1B9F806A721CC`.
   It fixes exact values, default paths, named exemplars, ownership, omissions,
   and stop rules without exposing earlier results. Each fresh
   `gpt-5.6-terra`, low context may read only that packet, repository instructions,
   the three owned files, named exemplars, and immutable test. Reading the
   experiment ledger, Git history, sibling worktrees, external prior patches, or
   attempt reports fails the attempt; the controller audits reported/tool-visible
   reads. Dispatch every worker with no inherited conversation/session history
   (`fork_turns: "none"` or equivalent) and pass only the frozen packet and
   assigned worktree. Share no prior result, patch, review, or reasoning between
   attempts.
3. Before dispatch, record one external runtime manifest with the protocol commit,
   absolute `npm.cmd` path, Node/npm versions, package-lock SHA-256, immutable
   patch and packet hashes, prepared `node_modules` source, and attempt paths.
   Record the no-inherited-history dispatch mode for workers and reviewers.
   Each worktree may junction to that one dependency runtime because execution is
   serial; clear only its writable `.tmp` and `.vite` caches before every attempt
   and control, then verify package-lock and dependency layout are unchanged.
   Workers must not install dependencies, switch package managers, rearrange
   `node_modules`, edit tests, or change the fixed timeout.
4. The worker runs only the focused immutable equipment suite and
   `git diff --check`, using the exact commands frozen in its packet. Before and
   after every worker/controller gate, verify the untracked applied
   `equipment.test.ts` SHA-256 remains
   `C60961AAAB94F356A86A82032B4C6C086DFB5FD04E5243FDBFB3AF0E37BF41E5`
   and status contains only that test plus the three owned production files. The
   controller then runs, in order,
   `& 'C:\Users\mdy06\AppData\Roaming\npm\npm.cmd' test`,
   `& 'C:\Users\mdy06\AppData\Roaming\npm\npm.cmd' run build`, and
   `git diff --check` for each unchanged first-pass artifact. The build command
   remains separate even when the full suite enters the harness-control branch.
5. Judge semantic/source-retention independently from the harness. Every exact
   W1-W5 value, default path, identity, asset, compressed output, omission, and
   preserved generic case must pass. Where a retained fact owns a displayed
   number, the summary must derive from that fact; duplicating `25` or `10` as
   separate display literals is a semantic/source-retention failure even when
   visible text matches. Dispatch a fresh blind reviewer with no inherited
   conversation/session history and give it only one anonymized diff, the
   immutable acceptance-test diff, and the frozen packet at
   `C:\Users\mdy06\.codex\visualizations\2026\08\09\019fe6ab-6e74-7213-8dc4-947536edfd55\m1-r\artifacts\m1-r-review-packet.md`,
   SHA-256 `FB4DB6411886E64153AD93594F75204EA011DA1408244CF16A511F62CE4D6426`;
   it must find no P0/P1/P2 defect.
6. A failed immutable equipment assertion, build/type error in owned production,
   prohibited read/edit, source-retention defect, or P0/P1/P2 blind-review
   finding fails that attempt. Do not correct or retry its artifact.
7. If the complete gate instead fails only in a pre-existing test, immediately
   use a dedicated control worktree at the protocol commit with neither the
   acceptance patch nor any M1 production patch applied. After the same runtime-
   cache reset, run the frozen baseline full-suite command. Harness-inconclusive
   requires the exact Vitest test ID, identical configured `5s` or `10s`
   boundary, and matching timeout failure signature. Still complete every
   buildable semantic, source-retention, diff, and blind-review gate; any artifact
   defect takes precedence and fails the attempt. A passing control or any other
   complete-gate failure leaves the attempt failed.
8. Run sequentially and stop at the first failure or harness-inconclusive result;
   every started slot remains in the denominator and later slots are recorded as
   not run. Three independent first-pass passes record repeatability only for the
   exact M1 packet. Any failure ends M1-R `not repeatable`; any harness-
   inconclusive result ends it `inconclusive`. Neither outcome authorizes a retry,
   harness repair inside M1-R, or another model comparison. A later model
   experiment requires separate user approval and a separately frozen protocol.
   If the harness cannot establish no-inherited-history worker and reviewer
   contexts, end M1-R `inconclusive` before crediting the affected attempt.
9. M1-R's full-suite results are regression and harness evidence only. Record
   product-UI confirmation as `not applicable - not credited`: Evelyn's reachable
   selected/candidate descriptions, Result, accessibility, desktop/narrow browser
   route, keyboard/focus behavior, and incomplete repair flow remain mandatory
   only after atomic Evelyn U3/U4 integration.

Record each started attempt separately below this section after its first-pass
outcome is known. Do not average, replace, or hide a failed or inconclusive
attempt. Even three passes do not count as C1-C4 evidence, authorize repository
guidance changes, prove cost efficiency, or change the Initial Routing
Hypotheses. A later approved product unit uses the already-existing routing
hypothesis and supplies the first independent work-class evidence.

---

## Key Technical Decisions

- Calibrate only small pre-registered units, not whole verticals. W1 historically
  compared current and Lean V1 at one fixed high-reference worker. M1 first
  compares current and Lean V2 at that same worker, then compares Lean V2 across
  worker levels only if the V2 arm passes.
- Run paired attempts from the same pre-implementation commit in separate
  worktrees. Review anonymized diffs before selecting an artifact; the comparison
  is not a historical replay after the unit has landed. M1 selection is deferred
  worktree state, not authorization to integrate source facts before their current
  Evelyn consumer exists.
- Treat experiment fit as a feasibility filter, not product priority. Evelyn
  and the Soldier 11 reserve are approved; every later target or substitute
  still requires user approval and must respect the version-2.8 ceiling.
- Keep one mutating worker per worktree. The controller owns the target's
  retained meaning, inspects the accepted diff, and runs final gates.
- Use targeted authority reads through the owning definition during conforming
  runs. A new or contradictory semantic expands the read and review scope and
  exits conforming mode.
- Treat Puffer and Seed/Cissia as directional references only. Their different
  semantic surfaces make raw duration, unit count, or diff-size comparisons
  invalid controls.
- Keep the experiment record in this plan. Create a `docs/solutions/` learning
  only after confirmed repetition; change `AGENTS.md` or `CONTRIBUTING.md` only
  if the evidence supports a durable repository rule.

### Rejected Alternatives

- **Downshift every task immediately:** likely to increase retries and confound
  model limits with incomplete semantic settlement.
- **Compare different verticals as if they were identical:** scope and new
  semantic boundaries dominate raw resource totals.
- **Implement the same entire vertical several times:** causally cleaner but
  disproportionate; bounded paired units provide the useful model comparison.
- **Choose three roadmap verticals for coverage:** experimental seam coverage
  cannot outrank independently approved user value.
- **Choose the next Agent from repository assets:** asset availability is not
  product admission or competitive setup policy.
- **Automate the protocol now:** no repeated successful consumer yet justifies
  a skill, workflow engine, telemetry system, or universal content contract.

---

## Decision and Blocker Status

- **Resolved:** Evelyn is the calibration target; Soldier 11 is the reserve.
  Evelyn's exact retained requirements, implementation plan, paired units, and
  fixed browser route are authored and reviewed. W1 is completed at `8513e80`;
  M1 selected the externally preserved Lean-V2/sol production patch recorded in
  the ledger, which remains gated on atomic application with Evelyn U3.
- **Version boundary:** Complete content through version 2.8 first. Sigrid and
  Remielle are version-3.0+ pressure tests and are not current alternatives even
  if exact release facts later become available.
- **Non-conforming version-2.8 work:** Aria remains within the completion
  boundary but requires new Anomaly meaning, so its own vertical uses the normal
  full workflow and never counts as a conforming efficiency run. Only a later
  approved target that reuses the already-landed meaning may be screened.
- Puffer is a directional reference, not a time/token control. Exact telemetry
  remains environment-dependent and is recorded as unavailable when absent.
- No skill, permanent routing policy, or new product abstraction is warranted
  before the bounded pairs and repeated product observations succeed.
- **M1-R diagnostic:** The user authorized the separate V3-R repetition after
  harness calibration. It is non-gating and cannot change the selected M1
  artifact, delay an approved version-2.8 product unit by dependency, count as
  C1-C4 confirmation, or establish permanent repository guidance.

---

## Implementation Units

- U1. **Record the approved calibration target**

**Status:** Completed

**Goal:** Record Evelyn as the approved calibration target, Soldier 11 as the
reserve, and the version-2.8 completion ceiling.

**Requirements:** R1-R2a, R9-R10

**Dependencies:** None

**Files:** Modify this plan only to record the approved names and eligibility.

**Approach:**
- Keep source evidence ephemeral. Recheck Evelyn's exact current release facts
  before U2 retention; use Soldier 11 only after an Evelyn authoring stop.
- Route a non-conforming version-2.8-or-earlier Agent through the normal
  workflow and defer all version-3.0+ Agents until the service completion
  boundary is met.

**Test scenarios:**
- Test expectation: none -- this unit selects a research target and changes no
  product behavior.

**Verification:**
- The target and reserve are user-approved; both are version 2.8 or earlier.

- U2. **Close meaning and freeze both paired comparisons**

**Status:** Completed

**Goal:** Capture the approved target's exact retained requirements, then
pre-register two independent settled calibration units and all instruments
before either unit is implemented.

**Requirements:** R1-R6 including R2a, R9-R10

**Dependencies:** U1

**Files:** Create a compact target requirements delta and target plan; modify
this plan with unit ownership, checkpoints, prompts, reference/lower models,
reviewer protocol, acceptance tests, and measurement boundaries.

**Approach:**
- Apply the retention gate and settle candidate, representative, preparation,
  provider, calculation, Result, Mindscape, lifecycle, and visible acceptance.
- Pre-register the exact Evelyn desktop/narrow and keyboard browser route for the
  integrated product run. The smaller W1/M1 attempts use their frozen component
  gates because neither admits a reachable Evelyn App route by itself.
- Choose two small calibration units only after meaning is closed. Freeze brief
  granularity and the Fixed Acceptance Checklist before work begins.
- After document review, stop and request explicit authorization for one logical
  checkpoint commit containing the requirements, target plan, and experiment
  update. Do not stage or commit implicitly; W1 cannot start without this base.

**Test scenarios:**
- Documentation only: trace every retained fact to a current choice or Result.
- Experiment eligibility: either unit introducing a new common semantic ends
  paired calibration and returns to ordinary planning.

**Verification:**
- Requirements review is complete; both units and instruments are frozen. W1's
  historical pre-implementation checkpoint is named. M1 starts only after the
  stable Lean V2 documentation commit and then records one identical uncommitted
  red-suite patch's resolved external path and SHA-256 before any M1 arm begins.

- U3. **Run the workflow pair**

**Status:** Completed — both W1 V1 first passes failed; the corrected reference
result is committed at `8513e80`.

**Goal:** Compare current and lean post-contract implementation bundles on the
first frozen unit using the same `gpt-5.6-sol` xhigh worker and acceptance
instruments.

**Requirements:** R3, R5-R6, R9

**Dependencies:** U2

**Files:** Use separate worktrees for the first unit's exact owned files/tests;
record results in this plan.

**Approach:**
- Give both attempts the same closed contract and mutation limits without
  sharing one attempt's reasoning. Only workflow instructions differ.
- Anonymize the diffs for first-pass review. Record results before correction,
  integrate the accepted result only after review, and retain both worktrees
  until integration is verified.
- W1's corrected result landed at `8513e80`. M1 uses the separately authorized
  stable Lean V2 documentation commit after it plus the recorded uncommitted
  acceptance-patch path and SHA-256; `8513e80` alone is not M1's base.

**Test scenarios:**
- Both attempts must satisfy the same focused behavior test and review.
- If exact total resource measurement is unavailable, record quality
  non-regression only; do not claim workflow efficiency.

**Verification:**
- The result supports only the tested post-contract bundle and work class; it
  says nothing causal about requirements or planning cost.

- U4. **Run the staged M1 calibration and complete the Evelyn vertical**

**Goal:** Validate Lean V2 against the current workflow at a fixed reference
worker, compare one lower credible worker only if Lean V2 passes, preserve the
final production and immutable acceptance patches without standalone
integration, then finish the real product vertical through Evelyn-plan U3 and
later units.

**Requirements:** R3-R6, R9-R10

**Dependencies:** Efficiency-plan U3, the stable Lean V2 documentation commit,
and the recorded resolved external path and SHA-256 for the identical
uncommitted red acceptance patch

**Files:** Use separate worktrees for the M1 content unit and its immutable
controller-authored acceptance test; finish only the Evelyn plan's owned
production/test/UI files and update this experiment record.

**Approach:**
- From the same clean base commit with the same hashed acceptance patch, first
  run current/sol-xhigh and Lean-V2/sol-xhigh with identical product scope and
  acceptance. This is the workflow calibration.
- If and only if Lean V2 passes, reuse that exact passing artifact as the
  reference and run Lean-V2/terra-low from the same base and patch. This is the
  model calibration; do not rerun or reconstruct the reference arm.
- Start every newly dispatched arm in a fresh isolated context and share no
  reasoning, worker-authored artifact, or result across arms. Stage B receives
  only the fixed packet and identifies the already-passing Lean/sol diff as the
  controller-held reference.
- Workers cannot edit the controller-authored acceptance suite. The controller
  runs complete gates serially, then performs the frozen blind review and applies
  the deterministic selection rule.
- Preserve the final M1 production patch and immutable acceptance patch as named
  external artifacts with resolved paths and SHA-256 values, plus the source
  worktree. Evelyn-plan U3 applies both atomically with Evelyn identity, current
  candidate/prepared consumers, and reachable selected/candidate verification.
- Freeze only supported reductions. Unsupported work classes keep the reference
  route during confirmation.

**Test scenarios:**
- M1's immutable suite covers both new W-Engines at W1-W5, rank-derived W1
  defaults, exact metadata/assets, both new Disc clauses, forbidden summary
  prose, and preserved representative existing equipment.
- The complete Evelyn target has a prepared setup, incomplete-state behavior,
  Result, representative mixed-party flow, and existing regression coverage as
  required by its own plan.

**Verification:**
- Every arm's first-pass outcome and gate evidence is preserved. A later Evelyn
  U3 defect attributable to the final M1 production patch's facts, metadata,
  assets, or summaries retroactively fails that arm.
- Exact resource totals being unavailable does not cancel M1's correctness-
  capability observation, but it supports no efficiency claim, routing default,
  or workflow promotion. The product vertical remains independently acceptable.

- U4a. **Run the optional M1-R routing diagnostic repetition**

**Status:** Authorized; frozen-input review in progress

**Goal:** Determine whether the exact settled M1 packet is repeatable in up to
three fresh Lean-V2/terra-low first-pass attempts after package-manager and
timeout calibration, without changing M1 selection or product delivery.

**Requirements:** R3a, R5-R6, R8a, R9-R10

**Dependencies:** Completed M1-M selection, the V3-R protocol commit, and the
hashed immutable acceptance, worker, and blind-review packets

**Files:** Modify only the three frozen content files in isolated worktrees;
update this plan's ledger/result after the diagnostic. External manifests,
anonymized patches, and gate records remain outside the product repository.

**Approach:**
- Execute the V3-R protocol exactly as frozen in the M1-R section. Run
  sequentially and stop at the first non-pass.
- Preserve M1-M and the selected Lean-V2/sol production patch unchanged.
- Treat three passes as exact-packet repeatability only. The first later approved
  matching product unit still supplies independent routing evidence.

**Test scenarios:**
- Each started attempt receives the same input-only packet and immutable test,
  with no prior result or artifact disclosure.
- Separate semantic/source-retention, harness, build, diff, and blind-review
  outcomes; product-UI confirmation is not applicable and not credited.

**Verification:**
- Three passes complete the diagnostic as `repeatable`. Any failure ends it
  `not repeatable`; any matched control timeout ends it `inconclusive`. Remaining
  slots are recorded as not run, and no result blocks Evelyn U3/U4 or U5 or
  changes the pre-existing Initial Routing Hypotheses.

- U5. **Run three conforming confirmation verticals**

**Goal:** Seek three successful independently approved, eligible
version-2.8-or-earlier confirmation verticals, allowing one replacement for at
most four attempted verticals, without using experiment coverage to set
priorities.

**Requirements:** R1-R10

**Dependencies:** U4

**Files:**
- Create: one compact requirements delta and target plan per vertical under
  `docs/brainstorms/` and `docs/plans/`
- Modify/Test: only the current consumer files named by each target plan, using
  the existing content, state/preparation, mechanism/policy/flow, component, and
  integrated App test families
- Modify: `docs/plans/2026-08-10-003-refactor-vertical-expansion-efficiency-plan.md`

**Approach:**
- Before implementation, record each approved target's version, eligibility,
  and seams. Do not tune successful routes. Apply the Bounded Failure Policy on
  failure; do not substitute version-3.0+ content.

**Test scenarios:**
- Each eligible Agent uses existing formula, lifecycle, Result, and UI
  vocabulary without a new Agent-specific suite or semantic registry.
- Record any local, provider, contextual-candidate, and action-hierarchy seams
  actually exercised; do not manufacture missing coverage.
- Regression: every run passes its representative browser flow when visible
  content changes and the complete repository gate in all cases.

**Verification:**
- U5 completes with either three successful rows within at most four recorded
  attempts or a recorded bounded-stop condition. All failed, stopped, and
  substituted attempts remain visible; unobserved seam classes are excluded
  from the final claim. A work-class claim may combine only rows using the same
  protocol version; recalibrated classes without sufficient same-version
  repetition are inconclusive. Either outcome permits U6.

- U6. **Distill or reject the workflow learning**

**Goal:** Decide from the recorded series which reductions are repeatable and
which must be reverted or remain task-specific.

**Requirements:** R7-R10

**Dependencies:** U5

**Files:**
- Create when warranted: `docs/solutions/workflow-issues/` learning for the
  demonstrated vertical-expansion protocol
- Modify only when evidence warrants: `AGENTS.md` or `CONTRIBUTING.md`
- Modify: `docs/plans/2026-08-10-003-refactor-vertical-expansion-efficiency-plan.md`

**Approach:**
- Separate reusable evidence by work class. Preserve exceptions and failed
  downshifts rather than forcing one global model rule.
- Mark this plan completed only after the final learning/rejection and all
  confirmation artifacts are reviewed.

**Test scenarios:**
- Test expectation: none -- documentation captures measured workflow evidence;
  product behavior was verified in U5.

**Verification:**
- The repository gains either a bounded proven learning or an explicit finding
  that no lower default is reliable; neither outcome creates unsupported policy.

---

## System-Wide Impact

- **Interaction graph:** Each vertical remains authored facts → candidates and
  representative → preparation/selection → provider delivery → Agent-local
  projection → shared Result. The experiment does not enter that graph.
- **State lifecycle risks:** Fixed acceptance preserves party rebuild, target-
  only rebuild, direct-edit locality, invalidation, and empty incomplete Result.
- **API surface parity:** No new runtime API or data contract is introduced by
  the experiment plan.
- **Integration coverage:** Target plans must preserve representative mixed-party
  and real Setup/Result flows; worker self-report is not acceptance.
- **Unchanged invariants:** Exact-three party, authored candidate policy,
  deterministic prepared first choice, current formula families, source
  identity, and no Result-to-Setup feedback remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Different verticals make resource totals incomparable | Classify seam and semantic-boundary count; use paired same-unit worktrees for the model comparison |
| Measurement overhead erases savings | Keep one compact row per run and use existing Git/test outputs; add no telemetry system |
| Lower model creates hidden semantic drift | Keep controller settlement and the frozen blind reviewer fixed; fail on P0/P1/P2 |
| Worker edits make the acceptance bar differ between arms | Controller authors one immutable red-suite patch, records its SHA-256, and gives workers production-only ownership |
| An uncommitted acceptance file is omitted from review or later transfer | Preserve a named external unified patch, resolved path, and SHA-256; verify it before apply and include it beside every production diff in review |
| Experimental source facts become durable before a current consumer exists | Keep the acceptance and final production patches outside the product repository and uncommitted in experiment worktrees; apply both only atomically with Evelyn identity/current candidates |
| Concurrent complete gates create timing noise or flaky failures | Workers stop after focused checks; the controller runs every new arm's complete gate serially and does not rerun the reused Stage A reference |
| Easy targets overstate generality | Keep failures in the denominator and limit conclusions to observed work and seam classes |
| Experiment redirects the roadmap | Require user approval for every target and observe later approved work opportunistically |
| A version-3.0+ Agent shapes the unfinished service model | Reject it from calibration/confirmation until version-2.8 content is complete; use it later as pressure testing |
| Paired attempts lack a reproducible base | Record the stable documentation commit and acceptance-patch SHA-256 before dispatch; apply that exact patch to every arm |
| Source ambiguity is misreported as workflow failure | Stop authoring or request approval for the reserve before implementation measurement |
| UI browser scope becomes ceremonial | Apply the Fixed Acceptance Checklist only to affected visible consumers |
| Exact tokens or active time are unavailable | Mark unavailable and limit the conclusion to quality non-regression; never estimate |

---

## Documentation / Operational Notes

- This active plan is the experiment protocol and compact result ledger. It is
  not a permanent product authority.
- Target requirements and plans own each product vertical. They should link to
  this plan only for the experimental execution posture, not for game or product
  meaning.
- A final `docs/solutions/` record may summarize demonstrated workflow learning.
  Do not duplicate permanent product definitions there.
- No production, test, UI, asset, staging, or commit mutation belongs to this
  planning checkpoint.

---

## Sources & References

- [First Vertical Completion Review](../brainstorms/2026-08-06-first-vertical-completion-review-requirements.md)
- [Agent-slot Extensibility Ideation](../ideation/2026-08-07-agent-slot-extensibility-ideation.md)
- [Seed and Cissia Vertical Plan](2026-08-10-001-feat-seed-cissia-vertical-plan.md)
- [Seed and Cissia Vertical Requirements](../brainstorms/2026-08-09-seed-cissia-astra-vertical-requirements.md)
- [Dialyn/Puffer Contextual Candidate Plan](2026-08-10-002-feat-dialyn-puffer-contextual-candidate-plan.md)
- [Evelyn Vertical Requirements](../brainstorms/2026-08-10-evelyn-vertical-requirements.md)
- [Evelyn Vertical Plan](2026-08-10-004-feat-evelyn-vertical-plan.md)
- [Preserve Interaction Fidelity](../solutions/workflow-issues/preserve-interaction-fidelity-in-ui-explorations-2026-08-05.md)
- [Repository Development Workflow](../../CONTRIBUTING.md)
- [Setup Workbench Product Contract](../setup-workbench-product-contract.md)
- [ZZZ Formula Mechanics](../zzz-formula-mechanics.md)
- [ZZZ Game Vocabulary](../zzz-game-vocabulary.md)
- [Source-Fact Boundary](../source-fact-boundary.md)
- [Workbench UI Design Rules](../workbench-ui-design-rules.md)
