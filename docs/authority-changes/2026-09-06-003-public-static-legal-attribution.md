---
id: ACR-2026-09-06-003
date: 2026-09-06
status: accepted
supersedes: none
superseded_by: none
---

# Permit required legal attribution in public static delivery

## One decision

Permit public static delivery to add one minimal, non-interactive legal
attribution surface required for the workbench's game-derived material.

## Context

The current client contains the Zenless Zone Zero header lockup plus Agent,
W-Engine, Drive Disc, Attribute, Rank, and Specialty images. Public GitHub Pages
delivery would distribute those generated assets beyond the private development
environment. The current official Zenless Zone Zero Fan Creations Guide
describes conditions for qualifying non-commercial personal fan creation,
including a placed rights notice and legal statement and no implication of
official sponsorship, endorsement, or approval. It also excludes named regions,
distinguishes derivative creation from simple copying, and does not transfer or
grant rights. Attribution is therefore one release condition, not evidence that
any bundled asset is authorized for public redistribution.

The current public-delivery rule authorizes the same complete client and says
delivery changes only how it is reached. It does not decide whether a legally
required, delivery-related attribution may become visible without changing Setup,
Result, calculation, candidate, preparation, party, or session meaning.

## Existing rule

- Owning Rule IDs: `SW-022`
- Conflict: the owning rule permits public generated-client delivery while
  preserving current product behavior, but it does not decide whether one
  delivery-related legal attribution surface may become part of the client.

## Proposed change

Permit the publicly deliverable client, including its local build, to include
one minimal, persistent, non-interactive attribution surface that identifies
the workbench as an unofficial non-commercial fan project, places the rights
notice and legal statement required for the applicable release conditions, and
links to no application behavior. It creates no Setup or Result meaning,
product state, input, account, feedback transport, telemetry, analytics,
persistence, or address state. Any further release copy, branding, promotional
content, or legal surface remains outside this decision.

This surface grants no license and establishes no asset's eligibility. Public
release remains separately contingent on a current, manual provenance and
rights-basis review accounting for every publicly emitted asset, the operator
and use model, and every served jurisdiction. Files may share one grouped
conclusion only when they are proven to share the same provenance, rightsholder,
and applicable redistribution basis; this transient release evidence does not
become a permanent asset registry. Unsupported assets or jurisdictions must be
removed, replaced, restricted under an independently supported basis, or
resolved by appropriate professional advice before publication.

## Evidence

- The current consumer imports
  `src/assets/ui/zenless-zone-zero-header-lockup.png` and renders it in the
  masthead in `src/App.tsx`; the generated client also imports game-derived
  Agent, equipment, Attribute, Rank, and Specialty images.
- The official *Zenless Zone Zero Fan Creations Guide v1.0*, published by the
  Zenless Zone Zero account on HoYoLAB, states that relevant rights remain with
  the right holders, conditions qualifying personal fan use on a placed rights
  notice and legal statement, disallows implying official status, and names
  regional exclusions and other eligibility conditions:
  <https://www.hoyolab.com/article/30075725>.
- No current repository `LICENSE`, `NOTICE`, disclaimer, or visible legal
  attribution surface was found for these assets.

## Nearest current consumer

`App` in `src/App.tsx` renders the persistent masthead around both Party Edit
and the applied workbench. It is the nearest established page-wide presentation
consumer because any delivery-related attribution must remain available across
both current client states without entering Setup or Result.

## Contrast

The current private local-development client is not itself the new public
distribution consumer authorized by `SW-022`. Its prior lack of attribution
therefore does not establish that public delivery may omit one; the accepted
change permits the shared client to keep the same surface locally instead of
creating divergent presentation builds. Conversely, ordinary release labels,
announcements, feedback links, or promotional copy are not required legal
attribution and remain excluded by the proposal.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  (`SW-022` only)
- Supporting requirements affected:
  `docs/brainstorms/2026-09-06-public-static-release-candidate-requirements.md`
- Production and tests affected: the shared page-wide App presentation in local
  and public builds, plus responsive, accessibility, and browser verification
  for one static attribution surface; separate release inspection must close
  asset provenance, rights basis, operator/use eligibility, applicable current
  wording, and served-jurisdiction coverage before any public write
- Visible Setup or Result consequence: none; Setup and Result remain unchanged

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-06T22:23:41+09:00`
