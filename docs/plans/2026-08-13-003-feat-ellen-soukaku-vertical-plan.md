---
title: "feat: Add Ellen and Soukaku vertical"
type: feat
status: active
date: 2026-08-13
origin: docs/brainstorms/2026-08-13-ellen-soukaku-vertical-requirements.md
---

# Add Ellen And Soukaku Vertical

## Outcome

Users can apply Ellen and Soukaku, receive deterministic full/non-limited
starting setups, edit bounded competitive choices, and read their current
personal, party, enemy, action, threshold, and equipment consequences through
the existing Setup-to-Result flow.

## Preserved boundaries

- No raw damage, rotations, resource cadence, optimizer, evidence payload,
  historical-version toggle, named-party rule, or Agent-specific framework.
- Current candidate, same-effect, contextual Puffer, preparation,
  completeness, provider, action, Result, rank, faction, and portrait
  mechanisms remain shared.
- External research remains ephemeral; implementation takes settled facts from
  the origin requirements and permanent authorities.

## Units

### U1. Admit typed content and prepared packages

Own `src/workbench/content/` and shared candidate/preparation tests. Add both
Agent identities, Section 6 faction, Deep Sea Visitor, bounded
pool/disc/main/substat candidates, retained values/source
labels, and both pool representatives. Extend shared tests for exact package,
zero-substat, rank, pool, same-effect, and contextual candidate behavior.

### U2. Add Agent-local calculations and provider relationships

Own the new Ellen/Soukaku calculation modules, the narrow shared
`pufferElectroFourPieceClauses` supported-Agent widening in `effects.ts`, and
their exhaustive wiring in provider/calculate dispatch. Reuse composition
helpers for ATK/CRIT/DMG/PEN,
action applicability, Potential, Mindscape, equipment, enemy Ice RES, and
Focus-recipient delivery. Add shared mechanics/policy/flow assertions for
qualification, capped CRIT, capped Soukaku output, exact recipients, action
contrasts, Puffer lifecycle, and incomplete Result.

Depends on U1.

### U3. Integrate portraits and shared UI journeys

Own portrait/identity maps and only the representative UI tests required by the
new identities. Inspect original assets, calibrate face position/head top/
optical scale, retain shared geometry, and verify rank, selectors, repair,
source display, keyboard behavior, and Result at the fixed local server.

Depends on U1-U2.

### U4. Integrate, review, verify, and close

Controller inspects the complete diff and settled contrasts, runs focused then
full tests and build, performs browser verification at `127.0.0.1:5173`, and
runs proportionate correctness, maintainability, testing, standards, and
conditional semantic review. Fix confirmed findings, commit the implementation,
add a compact milestone, remove this committed plan body, and continue to the
next vertical if no new meaning is encountered.

## Execution posture

- Controller owns semantic authoring, candidate/representative decisions, and
  final integration at frontier/high reasoning.
- Use one `gpt-5.6-terra` high-reasoning mutating worker for settled U1-U3 in
  the shared checkout. The worker must not edit the origin requirement,
  roadmap, permanent authorities, or unrelated files and must report changed
  files, tests, browser work, and deviations.
- Use balanced medium reviewers for ordinary correctness/testing/standards;
  escalate only a genuinely novel or high-risk semantic finding. Do not run
  multiple mutating workers in the shared checkout.

## Verification

- Focused content, candidate, preparation, state, mechanics, policy, flow, and
  UI tests pass.
- Full `npm test`, `npx tsc -b --pretty false`, `npm run build`, and
  `git diff --check` pass.
- Browser verification covers one desktop and one narrow viewport, both
  portraits and ranks, full/non-limited setup, an equipment edit, incomplete
  repair, and Soukaku-to-Focus Result delivery. Add a breakpoint-specific case
  only if changed CSS affects it or a defect appears.
- Final diff contains no external receipts, URLs, copied source prose,
  evidence registry, per-Agent framework, or unrelated changes.
