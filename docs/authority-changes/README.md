# Authority Change Records

Authority Change Records preserve why one permanent rule changed. They are
subordinate decision history, not a sixth permanent authority, product
requirement, source archive, or implementation plan. Current meaning remains
only in the five permanent Markdown owners directly under `docs/`.

Repository-governance rule [`GOV-001`](../../AGENTS.md#authority-change-and-trace-governance)
owns the transaction. One protected PR carries one proposed decision and ACR
files only. An accepted record must merge before a separate owner-only
amendment; dependent requirements, code, and tests follow in later changes.

## File identity

Name a record `YYYY-MM-DD-NNN-short-decision.md` and give it the stable ID
`ACR-YYYY-MM-DD-NNN`. Numbers are monotonically allocated within the date and
never reused. Every new number must be greater than the highest number already
present for that date in the protected base; a deleted, rejected, or
superseded record does not release its number. A filename, ID, or accepted
decision is never repurposed.

Use exactly one status:

- `proposed`: review or owner decision is not complete; it authorizes nothing;
- `accepted`: the product owner accepted the recorded change on the latest
  revision; a separate owner-only amendment may follow after merge;
- `rejected`: the proposed change was not accepted and the existing owner
  remains current; or
- `superseded`: a later accepted record replaced this accepted decision and is
  linked as its successor.

Before its initial merge, a record moves from `proposed` to exactly one owner
outcome: `accepted` or `rejected`. After merge, `rejected` and `superseded` are
terminal. An `accepted` record may move only to `superseded`, and only in the
same ACR-only transaction that adds one later accepted successor whose
`supersedes` points back to it. The earlier record's `superseded_by` must point
to that successor. No record may supersede itself. The named predecessor must
be `accepted` in the protected base revision and transition atomically to
`superseded` with those reciprocal links in the same ACR-only PR.

Except for that reciprocal `accepted` to `superseded` link update, a merged
record's decision, evidence, impact, owner outcome, and decision time are
immutable. Rejected and superseded records remain readable permanent history.
They never authorize an owner amendment.

## Required shape

Create records with this structure. Replace every placeholder; use `none` only
where the field genuinely does not apply.

```markdown
---
id: ACR-YYYY-MM-DD-NNN
date: YYYY-MM-DD
status: proposed
supersedes: none
superseded_by: none
---

# Decision title

## One decision

One sentence naming the single product decision under review.

## Context

Why the current product needs this decision now.

## Existing rule

- Owning Rule IDs: `SW-###`, `SF-###`, `UI-###`, `FM-###`, or `GV-###`
- Conflict: the exact boundary the current owners do not decide or contradict.

## Proposed change

The smallest owner-level meaning proposed. Do not include dependent design or
implementation instructions.

## Evidence

Facts and observations that support or challenge the proposal, with exact
source references where applicable.

## Nearest current consumer

The closest established current consumer and why it is similar.

## Contrast

The current case that could disprove an over-broad proposal and why it differs.

## Impact

- Permanent owners affected:
- Supporting requirements affected:
- Production and tests affected:
- Visible Setup or Result consequence:

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `pending`, `accepted`, or `rejected`
- Decided at:
```

Independent semantic review and exact PR, base SHA, head SHA, and diff-digest
binding are external PR evidence required by `GOV-001`. They are deliberately
not embedded in the record: adding evidence created from a commit back into
that commit would immediately make the binding stale. The owner records the
product decision and decision time in the ACR before its final revision. A
fresh GitHub approval then certifies that the exact latest revision faithfully
records that decision; approval of a rejected record does not accept its
rejected proposal.

## Transaction checks

Before merging an ACR PR, verify all of the following:

- the record contains exactly one decision and every required section;
- every existing-rule reference resolves to one stable ID in its owning
  permanent file;
- every later owner-amendment PR cites an already-merged accepted record whose
  Existing rule intersects the amendment trace on the same current Rule ID in
  that permanent file; an unrelated accepted record, including one for a
  different rule in the same owner, cannot authorize the amendment;
- external independent review evidence reconstructs the owner, consumer,
  similar case, contrast, and impact instead of accepting this record as its
  premise, and binds the exact latest PR revision as required by `GOV-001`;
- the PR changes no permanent owner, supporting requirement, plan, production
  file, test, or audit-completion entry;
- `accepted` or `rejected` matches the recorded owner outcome at the exact
  latest head and has fresh owner approval; and
- any `superseded` transition has reciprocal links to exactly one later
  accepted record while preserving the earlier decision and owner outcome.

Merging an accepted ACR changes no current product meaning by itself. The next
authorized transaction is a separate protected amendment to the affected
permanent owner. Merging a rejected or superseded record authorizes no such
amendment.
