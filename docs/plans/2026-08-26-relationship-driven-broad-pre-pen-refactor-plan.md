# Relationship-driven broad pre-PEN preparation refactor plan

**Status:** active
**Requirements:**
[relationship-driven broad pre-PEN requirements](../brainstorms/2026-08-26-relationship-driven-broad-pre-pen-refactor-requirements.md)

## Scope boundaries

Implement only the approved bounded relationship-to-Setup pressure consumer and
co-locate the currently live authored pressure-safe representative outcomes.
Do not build a universal effect graph, introduce Result feedback, rank setup
alternatives at runtime, add equipment/content catalogue tests, or change UI.

## Rejected alternatives

- Extending `activeCandidatePressures` with more Agent IDs is rejected because
  every new source can drift from Result delivery again.
- Feeding calculated Result values into Setup is rejected because incomplete
  selections must still expose candidates and because it creates a preparation
  cycle.
- A universal effect graph is rejected because current consumers require only
  broad pre-PEN applicability and local authored packages.

## Implementation units

### U1: Share active relationship applicability with Setup pressure

**Goal:** Source-owned broad DEF relationships are constructed once and
consumed by Result and candidate pressure with distinct recipient formula
contexts.

**Files:**

- Modify `src/workbench/calculation/delivery.ts`
- Modify `src/workbench/candidate-context.ts`
- Modify applicable files under `src/workbench/content/agent-sources/`
- Create only the smallest source-local relationship helper files required to
  avoid import cycles
- Test in the nearest shared relationship/candidate test file

**Approach:** Export the established delivery matcher, factor the currently
qualifying Agent and W-Engine relationships out of their inline Result builders,
and let candidate pressure consume those exact factories. Normalize a local
broad modifier as self delivery; inspect the retained Cissia gauge emission;
reject action-scoped effects. Keep Setup primary+residual formulas separate from
Result formulas.

**Execution note:** Test-first for the shared applicability fixture.

**Testing delta:** Existing Result delivery tests cannot prove Setup formula
carrier use or action-scoped rejection. The new assertions remain meaningful
with equivalent source and Agent fixture identities.

**Verification:** Shared test fails before the refactor and passes after it;
current Alice/Evelyn/Ye/Sunna relationships reach candidate pressure without
identity branches; Cordis remains non-pressure.

### U2: Replace central patches with authored local representative variants

**Goal:** Every pressure-invalidated prepared representative resolves to a
complete locally authored package without a central main/two-piece patch map.

**Files:**

- Modify `src/workbench/content/representatives.ts`
- Modify `src/workbench/content/setup-policies.ts`
- Modify `src/workbench/preparation.ts`
- Modify `src/workbench/state.ts`
- Modify `src/workbench/lifecycle.test.ts`

**Approach:** Put the approved pressure-safe transformation beside
representative authoring, pass the complete party context needed for Nicole-M6
CRIT balance, and invoke it only in authorized Party Apply or target rebuild
preparation. Remove dead current entries. Preserve allocation, zero-substat,
reconciliation, direct-edit, and target-only lifecycle order.

**Execution note:** Test-first for the non-Nicole Spectral Party Apply failure;
reuse the existing direct-edit lifecycle test.

**Testing delta:** Existing Nicole flows do not prove that provider-neutral
broad pressure prepares Ellen/Soldier completely. One composed current flow
proves completion without asserting a catalogue of every local replacement.

**Verification:** Trigger/Spectral Party Apply with the representative contrast
is complete; target-only and direct-edit behavior remain unchanged; no dead
policy map remains.

### U3: Integration and regression verification

**Goal:** Prove the bounded change preserves established Result delivery,
candidate lifecycle, source ownership, and build integrity.

**Files:** No production scope expansion.

**Approach:** Run focused relationship/lifecycle/integration tests, the root
suite, TypeScript, production build, governance tests, and `git diff --check`.
Review the final diff for source duplication, Agent-ID calculation branches,
unused relationship structure, and accidental UI/content changes.

**Testing delta:** No additional test beyond U1 and U2 unless verification
reveals a distinct mechanism failure that those tests cannot prove.

**Verification:** All applicable checks pass; visual baseline is explicitly not
applicable because layout, copy, portraits, and styling are unchanged.
