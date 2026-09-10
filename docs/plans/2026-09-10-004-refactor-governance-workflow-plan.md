---
title: Simplify authority transactions and documentation verification
type: refactor
status: active
date: 2026-09-10
---

# Simplify authority transactions and documentation verification

## Summary

Implement the product owner's approved operating-rule cleanup: distinguish
meaning-preserving corrections from changed decisions, join an accepted
decision record with its affected permanent owners, and avoid runtime suites
for a trusted documentation-only diff. Preserve independent semantic review,
fresh protected approval, the six required contexts, and trusted App execution.

## Problem and accepted scope

PRs #222 and #223 needed separate approvals and full runtime checks to record
and apply one settled Party Edit decision. Current enforcement also requires
an already-merged ACR for wording corrections. The owner approved correcting
these costs before integrating the prepared maintenance fixes and publishing
the generated site. This is repository governance, not a new product/game rule.

- R1. A protected, single-owner meaning-preserving correction needs no ACR.
  Independent review must establish unchanged meaning and rule identities;
  short text, unchanged Rule IDs, implementation, or tests cannot prove that.
- R2. One accepted ACR and the permanent owners it changes may form one
  protected decision transaction. Every changed owner must match the same
  accepted record and trace through its own current Rule ID. No dependent
  requirement, plan, code, test, or audit index belongs to that transaction.
- R3. Keep standalone ACR decisions and amendments using previously accepted
  merged records valid. Preserve immutable records and historical review
  identities. Rejected/proposed decisions never authorize amendments.
- R4. Keep six exact required contexts. Known regular supporting, permanent-
  owner, or ACR-instance Markdown may use explicit trusted N/A results for
  runtime suites. Governance source/configuration, build inputs, runtime,
  tests, assets, unknown paths, mixed scope, or nonregular files run full checks.
  Repository/rule validation remains required for documentation.
- R5. Clarify applicability and remove duplicated operating instructions;
  preserve product authoring, source/consumer/contrast review, candidate and
  prepared policy, lifecycle, meaningful testing, and visual acceptance.
- R6. Keep trusted-main execution, fixed App/repository/permissions, current
  exact-head independent evidence, owner approval, run identity, and token
  cleanup. Do not retire recovery finalization or change public release policy.

## Decisions and rejected alternatives

Replace GOV-001 with a new monotonic governance identity because transaction
meaning changes; retain GOV-001 in the local retired ledger. The correction
claim is an explicit structured PR trace field, bound by the existing review
digest, not a prose keyword or automatic semantic-equivalence classifier.
The accepted-decision path is derived from exact changed files and validated
records. Identifier-only bootstrap retains its separate exact-byte proof.

Do not remove review from structurally Agent-local content: new candidate or
representative judgments still need semantic review. Do not reduce required
context identities or allow PR labels/body claims to select N/A. Do not add a
runtime framework, registry, semantic answer catalogue, or public UI feature.

The existing local verification-cost commits are the starting point. Extend
their trusted file/mode/workflow comparison rather than creating a second
exemption policy. Do not duplicate expensive setup in documentation-only jobs.

## Implementation units

- U1. **Governance and operating text**
  - Owner: controller. Dependencies: accepted task scope and prior advisory
    review of current enforcement.
  - Files: `AGENTS.md`, `CONTRIBUTING.md`,
    `docs/authority-changes/README.md`, `.github/pull_request_template.md`,
    `docs/brainstorms/2026-08-15-authority-governance-recovery-requirements.md`.
  - Approach: define the three transaction forms and preserved trust boundary;
    keep ACR state/shape in its existing owner, distinguish recovery-only
    procedure, and route specialized authoring checks by actual changed meaning.
  - Patterns: current Rule ID retirement and one-definition ownership.
  - Test expectation: no prose-mirroring tests. Repository validation and the
    U2/U3 behavioral gates verify actual enforcement.

- U2. **Authority transaction enforcement**
  - Owner: controller after U3's isolated code commit is integrated.
  - Files: `scripts/governance/check-policy.mjs`,
    `scripts/governance/trusted-github.mjs`, their `.node.mjs` tests.
  - Approach: validate correction shape and unchanged current/retired IDs;
    admit only coherent ACR-plus-owner transactions; derive ACR changes from
    ACR paths, validate their state first, then use the accepted same-transaction
    record for every affected owner. Bind correction claims in trace digests.
    Apply the same checks to current evidence and historical finalization.
  - Patterns: `evaluateChangeMatrix`, `validateAuthorityTrace`,
    `validateAcrTransaction`, `derivePolicyState`, `evaluateEvidence`.
  - Scenarios: valid correction; invalid claim/value/owner shape/ID changes;
    one accepted decision with one or multiple matched owners; unmatched owner;
    rejected/proposed/multiple/unrelated records; mixed dependent artifacts;
    existing merged-record amendment; unchanged historical evidence; mutated
    body/head, premature approval and malformed record rejection.
  - Verification: shared policy and trusted adapter suites pass, including
    end-to-end snapshot/evidence paths rather than helper tests alone.

- U3. **Proportionate runtime verification**
  - Owner: one isolated worker. Dependencies: R4/R6 settled above.
  - Files: `.github/workflows/pr-validation.yml`,
    `.github/workflows/visual-baseline.yml`, `package.json`,
    `scripts/governance/check-policy.mjs`,
    `scripts/governance/trusted-github.mjs`, their `.node.mjs` tests; at most
    one small shared scope helper and its test if needed by both workflows.
  - Approach: explicit successful N/A steps in existing required jobs; cheap
    repository/rule validation for documents; independent trusted comparison
    of exact scope, modes, unchanged approved workflow/scope inputs, and step
    outcomes. Preserve full jobs for the governance change itself.
  - Patterns: existing visual N/A implementation and raw Git diff tests.
  - Scenarios: supporting/owner/ACR documents; add/delete/mode changes; all
    disallowed/mixed paths; malformed raw diff; changed verification helper or
    workflow; absent/duplicate/failed/forged N/A markers; current and historical
    run binding; no missing or skipped required jobs.
  - Verification: policy/adapter and real scope-script cases agree; ordinary
    source changes still run runtime checks; required context names unchanged.

## Testing delta and rollout

Existing policy tests deliberately reject mixed authority transactions and
only allow visual N/A for supporting Markdown. They cannot prove either new
transaction form or runtime N/A across all four jobs. Extend their generic
Git-tree, ACR, trace, run and approval fixtures; no Agent identity/value tests.

Run the shared governance/App suite, current repository validation, behavior,
type and production gates. Review the combined diff once with a qualified
independent reviewer after the PR body and head are final. Merge this protected
governance change under the still-current trusted evaluator and fresh owner
approval. Subsequent PRs use the merged policy; existing approvals/evidence
must be refreshed when their base/head/body changes.

Integrate the separately prepared UI wording and product-maintenance changes,
then build a new accepted public artifact from clean trusted main, publish,
and verify deployed bytes plus desktop/narrow interaction before community
announcement. Publication does not post an announcement.

## Deferred

Recovery digest/schema/finalization removal, portrait roster-policy changes,
new game content, candidate/representative re-authoring, and broad performance
optimization are outside this bounded cleanup.
