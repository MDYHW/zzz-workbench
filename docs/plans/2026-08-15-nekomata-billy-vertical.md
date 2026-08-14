---
date: 2026-08-15
topic: nekomata-billy-vertical
status: active
origin: docs/brainstorms/2026-08-15-nekomata-billy-vertical-requirements.md
---

# Nekomata And Billy Vertical Plan

## Summary

Extend the established typed content, preparation, Agent-local calculation,
and responsive UI paths for Nekomata and Billy. The implementation reuses
current general-damage, action hierarchy, Seed Vanguard, Focus-to-King,
contextual Puffer, broad pre-PEN pressure, exact equipment identity, and
incomplete-Result mechanisms. It adds only two equipment identities and the
smallest pressure-safe prepared-package adjustment required by Nekomata's
authored Puffer 2-piece representative.

## Authority and settled contrasts

- Permanent owners: `docs/setup-workbench-product-contract.md`,
  `docs/source-fact-boundary.md`, `docs/zzz-formula-mechanics.md`,
  `docs/zzz-game-vocabulary.md`, and `docs/workbench-ui-design-rules.md`.
- Local owner:
  `docs/brainstorms/2026-08-15-nekomata-billy-vertical-requirements.md`.
- Closest consumers: Corin/Harumasa for Physical/general damage and exact
  equipment/action projection; Seed/Ellen for Vanguard and contextual Puffer;
  Zhu Yuan/Ellen/Soldier 11 for broad pre-PEN lifecycle; current crit-capable
  Focus parties for King preparation.
- Preserved contrasts: Nekomata consumes Steel's back clause through completed
  Potential while Billy only reaches it conditionally; Billy activates Replica
  through range while Nekomata does not; Billy's Crouching Core excludes Chain
  and Assist; `sheer_damage` stays outside pre-PEN pressure.
- Applicable learning:
  `docs/solutions/workflow-issues/prevent-secondary-requirements-from-validating-themselves-2026-08-12.md`.

## Scope boundaries and rejected implementation alternatives

- No Purr Energy, Assault, distance, enemy-position, Crouching, rotation,
  uptime, raw damage, or raw Daze runtime model.
- No W-Engine score, package registry, named-party matrix, or candidate
  catalogue. Cloudcleave and Replica remain ordinary typed equipment entries.
- No per-Agent pressure pass. Extend the current prepared broad pre-PEN package
  adjustment because the same active pressure already owns Nekomata's Puffer
  and PEN invalidation.
- No generic Potential input or historical kit branch. Nekomata consumes only
  the completed current Potential identity.
- No UI redesign or per-Agent test suites.

## Implementation units

### U1. Typed content and prepared packages

**Goal:** Admit both Agent identities, Cloudcleave Radiance, Starlight Engine
Replica, pool-specific candidates and representatives, Disc/main/substat
choices, retained values, and Initial ATK at zero supplied substats.

**Requirements:** R1-R16, R27; AE1-AE2.

**Files:** `src/workbench/content/*`,
`src/workbench/calculation/initial-atk.ts`, shared content/preparation tests.

**Acceptance:** Nekomata prepares Steel/Woodpecker/Puffer/CRIT/PEN/ATK in both
pools; Billy prepares Cloudcleave in full and Brimstone in non-limited with
Woodpecker/Branch/CRIT/PEN/ATK. Candidate copy is complete, non-limited excludes
limited S-Ranks, every effective substat count is zero, and Cloudcleave/Replica
retain full package facts without projecting inactive clauses.

### U2. Qualification, contextual candidates, and composed preparation

**Goal:** Add exact Additional conditions, Seed Vanguard admission, Dialyn
Puffer context, Focus-to-King participation, and pressure-safe authorized
preparation without changing direct-edit reconciliation.

**Requirements:** R3-R4, R11-R16, R26; AE5-AE6.

**Files:** `src/workbench/party-conditions.ts`,
`src/workbench/provider-effects.ts`, `src/workbench/preparation.ts`,
`src/workbench/state.ts`, `src/workbench/candidates.ts`, shared mechanism tests.

**Acceptance:** One reducer journey traverses base representative, Seed
Vanguard, Focus King, Dialyn Puffer, broad pre-PEN pressure, removal,
reselection, incomplete Result, and repair. Authorized preparation substitutes
Nekomata Branch/ATK under pressure; direct edits clear without fallback or
history. An unaffected Sheer or non-Vanguard contrast remains unchanged.

### U3. Agent-local calculation and exact projection

**Goal:** Register Nekomata and Billy observation/provider/calculation modules
with exact Core, Potential, Additional, Mindscape, W-Engine, Disc, action, and
recipient surfaces.

**Requirements:** R17-R25; AE3-AE5.

**Files:** create `src/workbench/calculation/agents/nekomata.ts` and
`src/workbench/calculation/agents/billy.ts`; modify shared provider/calculation
routing and behavior-oriented calculation tests.

**Acceptance:** Nekomata shows completed Potential CRIT DMG/back reachability,
Core DMG, qualified EX/Dodge +70, M1 RES Ignore, M2 Energy, M4 CRIT, and M6
CRIT DMG. Billy shows Crouching-compatible actions but not Chain/Assist,
qualified Ultimate +100, M2 Dodge +25, M4 EX CRIT +32, and M6 broad DMG +30.
Cloudcleave Ether clauses and other inactive equipment clauses produce no
Result contribution.

### U4. Visible integration and portrait proof

**Goal:** Wire current original portraits and prove complete Setup/Result
interactions on shared responsive surfaces.

**Requirements:** R26-R29; AE2-AE7.

**Files:** `src/components/agentPortraits.ts`, identity marks, and shared App /
component flow tests.

**Acceptance:** Inspect each original asset, then calibrate scale, head top,
and face X in order. At `127.0.0.1:5173`, verify desktop and narrow expanded /
compact cards, Party Editor, selected/candidate copy, pool/Mindscape changes,
action rows, pressure incomplete/repair, clipping, overflow, and console state.

### U5. Verification, review, commits, and closure

**Goal:** Prove implementation fidelity and permanent-authority support, commit
the bounded units, then preserve only a compact completed milestone.

**Requirements:** all; AE1-AE7.

**Files:** `docs/plans/README.md`; delete this plan only after its committed
checkpoint and implementation are preserved.

**Acceptance:** Focused and full tests, TypeScript, build, diff hygiene,
browser proof, and correctness/testing/adversarial review pass. Supported
findings are fixed and reverified. Commit implementation, add one milestone,
remove this active plan in a separate closure commit, and leave a clean tree.

## System impact and stop conditions

- Typed Agent/engine unions expand; exhaustive maps and orchestration switches
  must fail compilation until both identities are wired deliberately.
- Preparation gains one current-consumer package substitution beside the
  existing broad pre-PEN main substitution; direct edits retain the established
  no-fallback lifecycle.
- The Seed Vanguard comparison and Focus-to-King pass reuse formula-derived
  membership; no named-Agent priority is added.
- Stop if current facts cannot settle an exact clause, if a candidate requires
  an unowned runtime state, if Cloudcleave/Replica need a new public schema, or
  if responsive portrait acceptance cannot be completed in-app.

