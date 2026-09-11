---
id: ACR-2026-09-11-001
date: 2026-09-11
status: accepted
supersedes: none
superseded_by: none
---

# Permit a bounded local gear companion and its public download

## One decision

Permit an explicitly invoked local HoYoLAB gear companion to produce an existing-format complete Setup shortcut, and permit its generated runtime download with minimal help under the current release boundary.

## Context

The owner verified the separate 0.3.3 experiment and approved version-managing it, adding download and usage guidance, and preparing public delivery. Users first choose party and Focus in the workbench; the companion reads those Agents' visible equipment and opens a comparison Setup. A copied address from localhost remains intentionally unsupported in this experiment.

## Existing rule

- Owning Rule IDs: `SW-016`, `SW-022`, `UI-005`.
- Conflict: the non-goals rule excludes provider ingestion and permits only the static workbench artifact. The user-flow rule admits explicitly copied shortcuts but does not authorize a companion to create them. The party-slot presentation rule describes carried-Focus entry only for that copied-shortcut case. The current serializer and successful experiment cannot authorize these expanded product and delivery boundaries.

## Proposed change

Allow only user-invoked local reading of visible official HoYoLAB equipment for the workbench's selected party, conversion to current supported inputs, and explicit opening of a complete valid shortcut. Preserve party and Focus, use the full pool and completed-growth assumptions, and do not predict additional upgrades. Permit automatic 2-piece identity correspondence only through an authored same-effect relationship and the current legal candidate; otherwise require a comparison choice or stop. Disclose exclusions and identity changes. Preserve atomic shortcut acceptance and carried-Focus entry presentation. Permit generated companion downloads and minimal help under the existing exact-artifact release review while retaining the private-source, credential, API, storage, telemetry, and remote-processing exclusions.

## Evidence

- The owner supplied a three-Agent equipment sample and confirmed the installed companion's collection and opening behavior. The separate experiment converted supported values through the existing serializer and parser; authored equivalent 2-piece identities were normalized without changing the four-piece identity or acquired substats.
- `src/workbench/setup-shortcut.ts#stateFromPayload` accepts only complete, jointly valid current selections. `createSetupShortcutUrl` serializes Focus explicitly, including slot zero. A localhost rejection in the experiment was traced to its origin allowlist rather than missing Focus.
- The six relationships in `src/workbench/content/discs.ts#SAME_EFFECT_TWO_PIECE_RELATIONSHIPS` and `src/workbench/candidates.ts#effectiveTwoPieceIds` demonstrate the current bounded identity compression. Equal-looking amounts outside those authored relationships do not establish interchangeability.
- The private experiment is feasibility evidence, not a permanent product owner or an already approved public artifact. Its tests and account fixtures must not be shipped. The current public-release requirement's artifact allowlist and review need a dependent update before adding a download.

## Nearest current consumer

`src/workbench/setup-shortcut.ts#createSetupShortcutUrl` and `stateFromPayload` form the existing complete-input serialization and acceptance boundary. `src/App.tsx#WorkbenchApp` initializes a valid shortcut with its carried Focus as the viewed Agent. The companion proposes inputs before that boundary; it does not add another Result calculator or receiving-state path.

## Contrast

`src/workbench/state.ts#workbenchSessionReducer` still owns ordinary draft, preparation, and direct-edit lifecycles. Automatic equivalent-name conversion before creating an import URL does not authorize repairing an invalid direct edit or migrating an invalid incoming URL. Unknown equipment, non-equivalent effects, and incomplete parties remain blocked unless explicit supported comparison choices yield one complete URL. Reading credentials or hidden account responses, calling authenticated APIs, saving gear across visits, and publishing private build provenance remain outside the exception.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md` (`SW-016`, `SW-022`) and `docs/workbench-ui-design-rules.md` (`UI-005`). No game, formula, source-retention, candidate-admission, or ordinary direct-edit rule changes.
- Supporting requirements affected: a bounded companion requirement and the current public-static-release requirement must define reproducible runtime-only download packaging and review, without publishing private source identities or account fixtures.
- Production and tests affected: later version-managed companion collection/conversion, reproducible packaging, minimal help and download UI, artifact checks, and focused integration/security tests. Existing shortcut serialization and atomic acceptance remain the receiving contract.
- Visible Setup or Result consequence: imported supported inputs can initialize the selected party with the carried Focus; Result is recalculated by the existing client. Source exclusions and equivalent identity changes are disclosed before opening. No new Result surface or calculation is authorized.

Only the affected permanent owners accompany this decision. Dependent requirements, code, tests, and release artifacts wait for their amendment to merge.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-11T18:34:27+09:00`
