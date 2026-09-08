---
id: ACR-2026-09-08-001
date: 2026-09-08
status: accepted
supersedes: none
superseded_by: none
---

# Permit a copied Setup shortcut to initialize one session

## One decision

Permit the current complete Setup inputs to be copied as a public-workbench
shortcut that atomically initializes one in-memory session from an immutable,
replayable Setup snapshot while Result is recalculated from current product
meaning.

## Context

The publicly delivered workbench now has one stable browser URL, but users
cannot carry an adjusted three-Agent Setup into another browser session or
share it with another user. Re-entering the same party, Focus, Agent setup, and
finite tuning choices by hand adds friction to the workbench's existing setup
comparison outcome.

The intended Copy action is a Setup shortcut, not a saved document. It carries
only the complete user-selected inputs needed to reconstruct the current Setup.
The receiving client resolves the current canonical identities, opens the
applied workbench, and recalculates Result through the current calculator.
Viewed-Agent state, editable target context, displayed Result values, and
language preference are not Setup inputs and do not travel with the shortcut.
The initial viewed-Agent presentation after shortcut entry is a separate
decision and is not authorized by this record.

An incomplete, malformed, or unsupported shortcut cannot safely establish the
claimed Setup. It therefore initializes nothing: the client follows its normal
fresh-entry flow and may disclose that the shortcut could not be opened. The
product does not partially recover, migrate, or guess missing selections.

## Existing rule

- Owning Rule IDs: `SW-016`, `SW-022`
- Conflict: the current non-goals rule excludes address-derived and cross-visit
  session state and states that a reload or later visit starts a fresh session.
  It therefore forbids an immutable copied address from replaying the otherwise
  session-owned Setup. The current user-flow rule defines initial entry only
  through party and Focus selection followed by prepared initialization, so it
  does not permit a shortcut to establish an already-selected complete Setup
  without replacing those selections with prepared first choices. The accepted
  public-delivery exception explicitly left the masthead Copy action and its
  serialization contract for a later authority decision.

## Proposed change

Allow one bounded address-derived input: a user may copy a shortcut for the
current complete Setup, and opening that shortcut may initialize one fresh
in-memory session with the same three ordered Agent identities, Focus, and each
Agent's selected Setup inputs. The copied payload is an immutable, replayable
Setup snapshot that may be retained, reopened, bookmarked, or shared by the
user. It is an explicit shortcut into the existing session boundary, not
automatic persistence of a mutable working session.

The shortcut is all-or-nothing. The current client must accept every carried
identity and selection as one complete valid Setup or apply none of them. A
valid shortcut recalculates Result from the restored inputs using the current
calculation and source facts. It does not carry Result values, target context,
language preference, or viewed-Agent selection, and this decision does not
choose which Agent is initially viewed.

Keep accounts, APIs, server-side application processing, ongoing URL
synchronization, automatic browser storage of the mutable working session,
partial recovery, inferred replacement selections, and automatic compatibility
migration outside the product. A future incompatible Setup contract may make
an older shortcut unsupported; any later compatibility promise requires its
own current product decision.

## Evidence

- `docs/setup-workbench-product-contract.md#static-preparation-and-dynamic-session`
  (`SW-015`) already assigns party, Focus, pool, Mindscape, refinement,
  editable selections, completeness, calculation, and Result to the session.
  The shortcut carries those existing session inputs into one new session; it
  does not create a second owner for their meaning.
- `docs/setup-workbench-product-contract.md#party-context-and-recipient-distribution`
  (`SW-012`) already treats applying party or Focus as creation of a new party
  context and recalculates Result from its three current setups.
- `docs/setup-workbench-product-contract.md#user-flow-contract` (`SW-016`)
  requires normal initial entry to prepare all three Agents after party and
  Focus selection. A shortcut must become a distinct authorized initial-entry
  transition before it may retain the carried selected Setup instead.
- `docs/setup-workbench-product-contract.md#observable-result-information`
  (`SW-013`) owns Result projection. Recalculation preserves that current
  authority, whereas serializing displayed outputs would create an unsupported
  competing result snapshot.
- Accepted `ACR-2026-09-06-002` and current `SW-022` permit the generated client
  at one stable public URL while explicitly withholding permission for the
  masthead Copy action and address-derived Setup state until this separate
  decision.
- `src/workbench/state.ts#workbenchSessionReducer` currently accepts a complete
  party draft through `applyPartyEdit` and creates one prepared in-memory state.
  This demonstrates atomic party-and-Focus entry, but it does not validate or
  install carried selected setups.
- `src/workbench/candidates.ts#invalidRequiredSelections` and
  `src/workbench/state.ts#isCompleteWorkbench` are the nearest current
  consumers for selected-Setup validity and completeness. They evaluate an
  already-constructed state; neither atomically admits an arbitrary carried
  Setup.
- `src/App.tsx#AppliedWorkbench` calculates Result from current state and keeps
  viewed Agent and target context as presentation-local state. Those consumers
  support recalculation and exclusion of non-Setup presentation state; they do
  not establish permission to serialize Setup in an address.
- The current client has no address-state decoder, Copy control, browser
  working-session storage, account, or server persistence consumer. That
  absence is the stopping countermodel for dependent requirements and
  implementation until this decision is accepted and `SW-016` and `SW-022`
  are amended.

## Nearest current consumer

`src/workbench/state.ts#workbenchSessionReducer` is the nearest established
lifecycle consumer. Its `applyPartyEdit` path accepts one complete ordered party
and Focus, creates the party context, and prepares all three Agent setups before
the applied workbench exists. `src/App.tsx#App` then selects the applied
surface, while `src/App.tsx#AppliedWorkbench` recalculates Result from that
in-memory state.

The shortcut is similar because it must establish one complete party context
before Result exists. It differs by restoring the user's complete selected
Setup instead of preparing new representative choices and by receiving that
bounded input from the copied address. `invalidRequiredSelections` and
`isCompleteWorkbench` are the nearest validity and completeness consumers, but
they inspect an already-constructed state. No current consumer atomically
validates and installs an arbitrary carried selected Setup. The existing
consumers demonstrate the lifecycle, validity, completeness, and recalculation
destinations but cannot supply that new entry mechanism or its missing
authority.

## Contrast

A normal visit without a valid shortcut remains the primary contrast. It starts
with the existing Party Edit flow and carries no hidden party, setup, Result, or
view state from an earlier visit. The shortcut does not change that default or
turn the browser address into a continuously synchronized working copy.

A direct party or Focus edit is a second contrast. Under `SW-012` it prepares a
new party context and may replace setup selections according to current
preparation rules. A valid shortcut instead reconstructs the explicitly
carried complete selected Setup; silently re-preparing it would not reproduce
the shared user choice.

An incomplete, malformed, unknown-identity, invalid-selection, or unsupported
shortcut is the failure contrast. Applying its surviving fields, substituting
current defaults, or retaining a partial party would invent a Setup the sender
did not copy. Rejecting the whole shortcut preserves the ordinary fresh-entry
state and the existing completeness boundary.

Automatic browser storage of the mutable working session, an account-backed
saved Setup, a server request containing the Setup, or serialized Result values
would add storage, mutable persistence, server transmission, or stale derived
output beyond the explicitly copied immutable shortcut and remain prohibited
by `SW-022`.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md`
  requires a later owner-only amendment. `SW-022` must permit one explicitly
  copied, immutable, replayable Setup shortcut as a narrow exception to its
  address-derived and cross-visit state exclusions while retaining the
  neighboring automatic mutable-session persistence, account, API, telemetry,
  server-processing, and stored-output exclusions. `SW-016` must permit
  shortcut opening as a distinct initial-entry transition that atomically
  establishes an already-selected complete Setup without prepared
  initialization. `SW-012`, `SW-013`, and `SW-015` continue to own ordinary
  party application, Result, and session meaning without amendment.
- Supporting requirements affected: after the owner amendment, one bounded
  Copy-shortcut requirement may define the exact complete Setup payload,
  stable-public-URL copy interaction, atomic acceptance, normal-entry failure
  behavior, and accessibility feedback. It must keep Result, target context,
  language preference, and viewed-Agent state outside the carried Setup. A
  separate authority decision must settle the initially viewed Agent.
- Production and tests affected: later work may add the masthead Copy action,
  bounded Setup serialization and startup restoration, current-identity and
  current-selection validation, and shared valid/invalid behavior coverage. It
  may not add automatic mutable-session persistence, partial recovery,
  automatic compatibility migration, ongoing address synchronization, result
  serialization, or item-by-item catalogue tests.
- Visible Setup or Result consequence: a valid shortcut opens the same complete
  Setup and recalculates the current Result. Without a valid shortcut, the
  ordinary fresh Party Edit entry remains. This decision does not select the
  initial viewed Agent and introduces no additional Result quantity or
  calculation meaning.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-08T19:33:21.4248425+09:00`
