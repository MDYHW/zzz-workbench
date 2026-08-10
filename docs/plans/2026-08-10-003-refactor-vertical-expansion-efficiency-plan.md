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

- R3. Treat the lean post-contract implementation workflow as one predefined
  bundle: targeted code/exemplar reads, a compact settled worker brief, focused
  checks at unit boundaries, and one complete final gate. Compare it with the
  current implementation workflow at a fixed model; vary only worker
  model/reasoning in the next pair. Requirements, planning, and fact settlement
  remain fixed inputs and are not part of the causal workflow claim.
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
  and competitive setup meaning still close in U2 before implementation.
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
| Evelyn | Approved calibration target | Version 1.5 Fire Attack Agent with existing portrait, W-Engine, and Disc assets. Her standard damage, ATK/CRIT, Chain/Ultimate, Astra, Seed, and Dialyn/Puffer relationships appear to fit current consumers; U2 must close the exact retained facts and prove no new common semantic. |
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
| Workflow pair | Same pre-unit commit, closed contract, files, tests, `gpt-5.6-sol` xhigh worker, blinded reviewer | Current versus lean post-contract implementation bundle |
| Model pair | Same pre-unit commit, contract, files, tests, lean workflow, blinded reviewer | Reference worker versus one lower credible worker assignment |
| Confirmation | Frozen lean workflow, routing, acceptance, reviewer, metrics, and version-2.8 ceiling | Independently approved version-2.8-or-earlier product vertical and its existing seams |

The current implementation bundle uses broad applicable code-pattern reading,
checks after each change cluster, and the normal intermediate review breadth.
The lean bundle uses the frozen requirements/plan as input, reads the owning
code plus one concrete exemplar, checks at bounded-unit completion, and relies
on the same complete final acceptance. Either path exits conforming mode when a
new semantic or authority conflict appears. Requirements and planning remain
ordinary reviewed product work; their end-to-end cost is observed, not paired.

### Fixed Acceptance Checklist

Every paired attempt and product run uses the same checklist:

1. Trace retained facts and visible outcomes to the owning authorities and
   approved target requirements. Preserve selected and candidate Setup surfaces,
   accessible complete equipment descriptions, Result parent values and
   breakdowns, action differences, gauges, lifecycle, and incomplete Result.
2. Add behavior coverage to the shared source-owned equipment-summary,
   mechanism, policy, representative-flow, component, or App families without
   creating a default per-Agent suite.
3. Pass focused affected tests, `npm run check`, and `git diff --check`.
4. For every complete Agent product run, pre-register and run the same in-app-
   browser flow: desktop and narrow Party Apply; selected and candidate Setup
   inspection; one required selection made incomplete and repaired; completed
   Setup-to-Result projection; keyboard traversal and focus return; and a clean
   console. Add source-focus states when the target supplies or receives a
   visible cross-Agent contribution. W1 and M1 are deliberately smaller than an
   Agent admission and have no reachable standalone App route; their paired
   attempts use the exact component behavior named below, while the accepted
   integrations receive this full Evelyn browser gate in the completed product
   run.
5. Run an independent semantic/correctness review with a frozen prompt and
   severity rubric using `gpt-5.6-sol` xhigh. Paired diffs are anonymized for
   first-pass review.
6. Accept only when there are no P0/P1/P2 findings and no correction of already
   settled product meaning. Record findings before any correction.

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

### Frozen Paired Units (Protocol V1)

Both units are below the size of a vertical and contain no open product meaning.
The controller creates two isolated worktrees from the stated checkpoint, gives
each attempt the same product contract, exact owned files, mutation limits,
behavior cases, and final reviewer prompt, and varies only the registered
independent variable. The one-exemplar read cap applies only to a lean attempt;
the current-workflow W1 attempt may perform its registered broad applicable
reads. Every attempt may modify only owned files.

#### W1 — Existing Result scale presentation

| Field | Frozen value |
|---|---|
| Work class | Bounded existing-Result representation |
| Product behavior | Existing operations/gauges can present an action-local `×1.25` scale at Combat or Fully Enabled, including threshold `Active`/inactive output; current `+2s` and `+50%` additive output is unchanged |
| Owned production | `src/workbench/calculation/result.ts`; `src/components/ResultPanel.tsx` |
| Owned test | `src/components/ResultPanel.test.tsx` |
| Excluded | Evelyn identity/content, calculation, new component/region, generic operator or expression schema |
| Fixed worker | `gpt-5.6-sol`, xhigh for both attempts |
| Variable | Current implementation workflow versus the lean post-contract bundle defined in R3 |
| Focused gate | ResultPanel tests covering additive preservation, Combat/Fully scale formatting, active/inactive gauge output, and visible/accessibility parity |
| Complete gate | `npm run check`, `git diff --check`, frozen blind semantic/correctness review |
| Common checkpoint | The user-authorized U2 documentation commit; record its hash before worktree creation |

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
| Owned test | Create `src/workbench/content/equipment.test.ts` as one shared source-owned equipment-summary family |
| Excluded | Evelyn identity/pools/representative/calculation, candidate policy, new content schema, trigger/duration prose, Base ATK disclosure |
| Fixed workflow | Lean post-contract bundle defined in R3 |
| Reference worker | `gpt-5.6-sol`, xhigh |
| Lower worker | `gpt-5.6-terra`, low — the lowest credible assignment for exact settled content with no semantic decision |
| Focused gate | Table-driven W1/W5 source vectors and compressed summary outputs; existing generic selected/candidate accessibility regressions remain green |
| Complete gate | `npm run check`, `git diff --check`, frozen blind semantic/correctness review |
| Common checkpoint | The verified, user-authorized accepted-W1 integration commit; record its hash before either attempt starts |

The fixed brief supplies the exact retained vectors and compressed output from
the Evelyn requirements. It does not force an unreachable candidate UI before
Evelyn's closed identity maps exist; the integrated vertical later verifies the
same summaries through both selected and candidate controls. One semantic
correction, missing source-owned clause, scope invention, or failed gate ends
the lower attempt. It is recorded as failed and is not retried at the same level
inside M1.

#### Deterministic integration rule

Apply this rule separately to W1 and M1 after blind first-pass review:

1. If exactly one attempt passes every gate, integrate that attempt.
2. If both pass, integrate the attempt with the lower exact measured total.
3. If both pass and total cost is unavailable or tied, integrate the current-
   workflow attempt for W1 and the reference-worker attempt for M1.
4. If neither passes, retain both failed rows and complete the real product unit
   through the reference route before continuing.

The rule is fixed before measurements and prevents controller preference from
choosing the prerequisite checkpoint after results are known.

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
| W1 | Current versus lean post-contract implementation pair | Existing Result scale presentation | V1 | User-authorized U2 documentation commit; hash pending | Not run |
| M1 | Reference versus lower worker pair | Source-owned Evelyn equipment facts and summaries | V1 | Verified accepted-W1 integration commit; hash pending | Not run |
| C1 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C2 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C3 | Approved version-2.8-or-earlier confirmation vertical | Pending product approval | Pending | Pending | Not run |
| C4 | Single permitted replacement | Only after one failed confirmation | Pending | Pending | Not run |

---

## Key Technical Decisions

- Pair only two small pre-registered units, not whole verticals: one isolates
  workflow with a fixed high-reference worker; the other isolates worker level
  with the lean workflow fixed.
- Run paired attempts from the same pre-implementation commit in separate
  worktrees. Review anonymized diffs before integrating the accepted attempt;
  the comparison is not a historical replay after the unit has landed.
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
  fixed browser route are authored and reviewed. U2 remains open only for the
  explicit documentation-checkpoint commit gate.
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

**Status:** Completed pending the user-authorized documentation checkpoint commit

**Goal:** Capture the approved target's exact retained requirements, then
pre-register two independent settled implementation units and all instruments
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
- Choose two similar small units only after meaning is closed. Freeze brief
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
  exact pre-implementation checkpoint is named now; M1's checkpoint rule is
  fixed as the verified post-W1 integration commit and is recorded before either
  M1 attempt begins.

- U3. **Run the workflow pair**

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
- After accepted W1 integration is verified, request explicit authorization for
  the logical post-W1 checkpoint commit that will become M1's common base.

**Test scenarios:**
- Both attempts must satisfy the same focused behavior test and review.
- If exact total resource measurement is unavailable, record quality
  non-regression only; do not claim workflow efficiency.

**Verification:**
- The result supports only the tested post-contract bundle and work class; it
  says nothing causal about requirements or planning cost.

- U4. **Run the model pair and complete the calibration vertical**

**Goal:** Compare one lower credible worker against the reference worker on the
second frozen unit with the lean workflow fixed, integrate the accepted result,
then finish the real product vertical.

**Requirements:** R3-R6, R9-R10

**Dependencies:** U3

**Files:** Use separate worktrees for the second unit; finish only the target
plan's owned production/test/UI files and update this experiment record.

**Approach:**
- Use identical lean prompts and acceptance; vary only worker model/reasoning.
- Start both M1 attempts from the same verified post-W1 integration commit,
  recorded before either attempt begins; never reuse W1's original checkpoint.
- Blind first-pass review, integrate the accepted unit, finish the remaining
  target work with supported routing, and run the Fixed Acceptance Checklist.
- Freeze only supported reductions. Unsupported work classes keep the reference
  route during confirmation.

**Test scenarios:**
- The complete target has a prepared setup, incomplete-state behavior, Result,
  representative mixed-party flow, and existing regression coverage as required
  by its own plan.

**Verification:**
- The product vertical is independently acceptable and the confirmation protocol
  is frozen with failed attempts preserved.

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
| Easy targets overstate generality | Keep failures in the denominator and limit conclusions to observed work and seam classes |
| Experiment redirects the roadmap | Require user approval for every target and observe later approved work opportunistically |
| A version-3.0+ Agent shapes the unfinished service model | Reject it from calibration/confirmation until version-2.8 content is complete; use it later as pressure testing |
| Paired attempts lack a reproducible Git base | End U2 and U3 at explicit commit-authorization gates; never stage or commit a checkpoint implicitly |
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
