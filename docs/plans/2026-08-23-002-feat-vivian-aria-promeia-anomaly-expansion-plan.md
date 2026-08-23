---
title: "feat: Add Vivian, Aria, and Promeia anomaly setups"
type: feat
status: completed
date: 2026-08-23
origin: docs/brainstorms/2026-08-23-vivian-aria-promeia-anomaly-expansion-requirements.md
---

# feat: Add Vivian, Aria, and Promeia anomaly setups

## Summary

Extend the existing typed content, shared Anomaly relationship harness,
preparation lifecycle, Setup/Result interaction, and portrait surface for
Vivian, Aria, and Promeia. Add only the exact Abloom and Corruption action
identities needed to scope current modifiers; reuse ordinary linear evaluation
and provider delivery for Promeia's two-output Core relationship.

## Rejected Alternatives

- Do not map Vivian M1 to `dmgTaken`; the permanent formula owner places the
  stated Anomaly/Disorder increase in `anomaly_buff_multiplier`.
- Do not add an Abloom formula family, reaction registry, base/final damage
  evaluator, or runtime history. The visible consumer is an exact action scope.
- Do not add a second derived-delivery pass for Promeia. Existing linear
  evaluation already precedes ordinary provider delivery and supports local
  stat plus provider outputs.
- Do not add Agent-specific catalogue tests or a runtime candidate scorer.
  Candidate outcomes stay in content and the bounded requirement; tests prove
  shared mechanisms and representative flows.
- Do not build a generic equipment compiler in this unit. The existing shared
  equipment fact owners plus explicit holder applicability are sufficient for
  the bounded consumers.

## Implementation Units

### U1. Correct Timeweaver formula-region harness expectation

**Requirements:** permanent `FM-002`-`FM-004`; prerequisite correction

**Files:**
- Modify: `src/workbench/calculation/profile-harness.test.ts`

**Work:**
- Project the AP-thresholded Disorder bonus through `anomalyDmgBonus`, including
  its action row and post-delivery gauge.
- Keep AP as the threshold basis and preserve the existing action/recipient
  behavior.

**Verification:** targeted profile-harness test.

### U2. Add typed identities, equipment facts, candidates, and representatives

**Requirements:** R1, R4-R6, R9-R11, R14-R18

**Files:**
- Modify: `docs/plans/README.md`
- Modify: `src/workbench/content/types.ts`
- Modify: `src/workbench/content/agents.ts`
- Modify: `src/workbench/content/engines.ts`
- Modify: `src/workbench/content/discs.ts`
- Modify: `src/workbench/content/setup-options.ts`
- Modify: `src/workbench/content/representatives.ts`
- Modify: `src/workbench/content/setup-policies.ts`
- Modify: `src/workbench/content/retained-values.ts`

**Work:**
- Extend every exhaustive typed map for the three Agents, two new factions,
  three signature W-Engines, two new Disc sets, pool-local candidate rosters,
  legal main stats, effective substats, prepared packages, and holder operating
  intervals.
- Preserve Angel in the Shell as Vivian's distinct full-pool AP/AM candidate,
  while Flight remains the prepared complete package. Its off-field interval
  retains unconditional AP and excludes the passive clauses removed off field.
- Add Shining Aria/Chaotic Metal to the shared same-effect 2-piece relationship:
  expose one Ether identity at a time while preserving Aria's legal transition
  between Phaethon 4-piece and Shining 4-piece.
- Retain numeric equipment clauses only in equipment-owned fact tables. Add
  compressed selected/candidate Setup summaries separately. Before closing the
  unit, compare each new summary with its fact: omit activation, repeat-stack,
  duration, and maintenance prose while retaining recipient and affected
  Attribute, outcome, or target-state scope.
- Add Phaethon's Melody 4-piece facts because Vivian and Aria create its first
  current Result consumers; preserve its existing 2-piece meaning.
- Extend the existing equipment activation union only with the holder-trigger
  fields consumed by the three signatures: trigger action/Attribute or field
  entry, duration, off-field removal, and stack threshold. Effect magnitude and
  recipient/action scope remain separate. U3 reads these facts for explicit
  holder applicability; it does not compile them generically or copy them into
  Agent values.

**Verification:** type/reference sweeps and prepared-state lifecycle tests.

### U3. Project Abloom and the three Agent profiles

**Requirements:** R2-R3, R7-R8, R12-R13, R16-R19

**Files:**
- Modify: `src/workbench/actions.ts`
- Modify: `src/workbench/content/agent-sources/anomaly.ts`
- Modify as needed: `src/workbench/calculation/profile-harness.test.ts`
- Modify as needed: `src/workbench/calculation/composition.test.ts`
- Modify: `src/workbench/calculate.integration.test.ts`

**Work:**
- Add exact shared Abloom and Corruption action targets without a new formula
  family.
- Add Agent base/core/Mindscape relationships, action projections, provider
  delivery, source-stated operations, and applicable equipment passives.
- Implement Promeia's selected initial-AM conversion as one generic linear
  relationship with local AP and all-party Abloom outputs.
- Preserve action inheritance: broad anomaly effects reach Abloom; Abloom-only
  effects remain exact.

**Verification:** reuse the shared action-composition, linear/provider, and
formula-delivery mechanism tests; extend only exhaustive profile routing for
the admitted Agents. Do not duplicate settled mechanics with Agent-specific
final-value assertions.

### U4. Connect visible Setup, Result interaction, and portraits

**Requirements:** R20

**Files:**
- Modify: `src/components/agentPortraits.ts`
- Modify: `src/components/PartyWorkbench.tsx`
- Modify only if a new shared observable failure requires it:
  `src/App.integration.test.tsx`, `src/components/ResultPanel.test.tsx`
- Modify: `tests/visual/workbench-portraits.spec.ts`
- Generate after live calibration:
  `tests/visual/workbench-portraits.spec.ts-snapshots/`

**Work:**
- Import the existing original portrait assets and add calibrated metadata.
- Extend the exhaustive identity-mark map with Ether/Anomaly marks for Vivian
  and Aria and Ice/Anomaly marks for Promeia.
- Verify selected and candidate equipment descriptions, source hover/focus,
  expanded/compact state, and responsive geometry through existing shared UI.
- Use one dense Promeia party flow at desktop and narrow widths: open the
  anomaly metric, expand Abloom source details, and verify readable hierarchy
  labels, reachable disclosure controls, no horizontal overflow, and correct
  pointer and keyboard-focus destinations for Agent, Mindscape, W-Engine, and
  Disc sources.

**Verification:** behavior tests plus in-app Browser comparison at desktop and
one narrow viewport for all three changed portraits. Any clipping, unreadable
name, control collision, or horizontal overflow blocks completion.

### U5. Integrated closure

**Requirements:** R18-R20; AE1-AE8

**Work:**
- Run shared behavior tests, type check, production build, and visual baseline.
- Exercise Party Apply, target-only pool/Mindscape rebuild, direct edit,
  invalid-selection clearing, zero-count initialization, incomplete Result,
  same-effect 4-piece role-swap without fallback, and a preserved non-Anomaly
  party flow.
- Inspect the final diff for copied equipment values, Agent-catalogue tests,
  hidden state, generic Result rows, broadened formula meaning, or Setup copy
  that exposes a trigger or maintenance path instead of the final effect.
- Mark this plan completed only after all applicable verification succeeds;
  otherwise report the exact remaining blocker. Then add the compact milestone
  to `docs/plans/README.md` and follow its committed-plan removal sequence.

## Execution Order

`U1 -> U2 -> U3 -> U4 -> U5`

U2 through U4 form one atomic production admission: identities must not land
without calculation profiles or exhaustive visible identity/portrait records,
and profiles must not reference absent content.
