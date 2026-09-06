---
id: ACR-2026-09-06-002
date: 2026-09-06
status: accepted
supersedes: none
superseded_by: none
---

# Permit public delivery of the generated static client

## One decision

Permit the generated static client for the current workbench to be published at one stable public URL without making the private development repository, its source history, credentials, or personal operator information part of the public release and without adding an API, persistence, or authentication.

## Context

The current workbench is a complete browser client that prepares a three-Agent setup and calculates Result from session state. It can already produce a production build, but the product contract classifies all deployment as a non-goal and the repository contains no current public-hosting consumer.

The intended release path is a publicly reachable but unannounced Release Candidate check followed by a Public Beta at the same URL. The Release Candidate is safe for immediate public discovery; lack of announcement is not access control. The development repository remains private. A separate public delivery tree would contain only the generated files required to run the client; the surrounding host still exposes public repository, commit, workflow, and URL metadata. GitHub organization and repository names and the final URL are operational identities that need not enter permanent product meaning.

Because browser-delivered JavaScript is necessarily downloadable by a visitor, this decision does not claim that the shipped bundle is secret. It keeps the private development repository, its complete source tree and history, credentials, and personal metadata outside the release rather than treating generated client artifacts as private material.

## Existing rule

- Owning Rule IDs: `SW-022`
- Conflict: the owning rule names deployment as a current non-goal together with API, persistence, authentication, and hidden build history. It therefore forbids the intended static public delivery even though the proposal requires none of the neighboring excluded capabilities. The current owners do not define a narrower exception for publishing the already-built browser client.

## Proposed change

Allow one bounded deployment outcome: generated static client artifacts may be published for public browser access at one stable URL. Public delivery changes how the current client is reached; it does not change the workbench's Setup, Result, calculation, candidate, preparation, party, or in-memory session meaning.

Keep API, persistence, authentication, provider ingestion, application telemetry, server-side application processing, hidden build history as a product surface, and address-derived or cross-visit session state outside the product. Do not publish credentials, private development history, personal operator information, or files not required by the generated client. A secret or private fact embedded in a client artifact would become public and is therefore not an acceptable deployment input. Static hosting necessarily receives transport request metadata under the host's own policy; this decision neither turns that provider logging into a product feature nor authorizes optional analytics or transmission of workbench Setup or session state.

An unannounced Release Candidate and the later Public Beta may use the same stable public URL because those labels describe release confidence, not different product behavior or stored user state. Both stages are publicly reachable. The permanent owner need not encode GitHub organization names, repository names, branch names, workflow topology, or the final URL. Those bounded implementation choices belong to later supporting requirements and operational work after the owner amendment.

This decision does not authorize the masthead Copy action or its serialization contract. That is a separate user-visible feature whose requirement may depend on the stable public URL after public delivery is authorized.

## Evidence

- `docs/setup-workbench-product-contract.md#purpose` defines a browser-facing workbench outcome while explicitly declining to own runtime, transport, storage, or UI architecture. Public delivery can therefore remain transport of the same product meaning rather than a new calculation or session feature.
- `docs/setup-workbench-product-contract.md#static-preparation-and-dynamic-session` (`SW-015`) confines current editable party and setup state to the session boundary. Static delivery does not require that state to survive a reload, URL change, or later visit.
- `docs/setup-workbench-product-contract.md#observable-result-information` (`SW-013`) owns the complete visible Result. Serving the same generated client changes neither the retained quantities nor their projection.
- `package.json#scripts.build` already creates a production client through TypeScript and Vite without a server build, API, or persistence step.
- `src/main.tsx#createRoot` mounts the application directly in the browser, and `src/App.tsx#App` owns the current client surface.
- `src/workbench/state.ts#workbenchSessionReducer` owns party and setup edits in memory. Current production code contains no local-storage, session-storage, network-fetch, authentication, router, or address-state consumer.
- The repository has no Pages workflow, hosting manifest, deployment script, or other current public-deployment consumer. This absence prevents implementation now; it supports making the authority decision before any hosting requirement or code is authored.

## Nearest current consumer

`package.json#scripts.build` is the nearest current consumer because it compiles and bundles the exact browser client that would be delivered. `src/main.tsx#createRoot` then runs that generated client as one page, and `src/App.tsx#App` presents the same party, Setup, and Result workbench in a local development session today.

The similarity stops at artifact production and browser execution. None of these consumers publishes the artifact, chooses a public identity, or establishes a stable URL, so they demonstrate feasibility and preserved product behavior but cannot supply the missing deployment permission.

## Contrast

`src/workbench/state.ts#workbenchSessionReducer` is the primary contrast. It holds the user's draft party, applied party, focus, equipment, and tuning edits only in the running client. Persisting those edits across reloads or visits, encoding them in the address, attaching them to an account, or accepting them through an API would change the session boundary and remains excluded.

A server-rendered or authenticated service is a second contrast. It could expose API, credential, user-data, storage, and server-processing boundaries that this static-client decision deliberately does not admit. Likewise, publishing the private development repository or embedding a credential in a client bundle is not an alternate implementation of this proposal: it violates the proposed public-artifact boundary.

The absence of a current deployment consumer is the stopping countermodel. A later implementation may proceed only after an accepted record amends `SW-022`; this ACR cannot infer deployment permission from the existence of a build command.

## Impact

- Permanent owners affected: `docs/setup-workbench-product-contract.md` (`SW-022`) requires a later owner-only amendment that replaces the blanket deployment non-goal with a narrow public-static-client exception while retaining the neighboring API, persistence, authentication, provider-ingestion, and hidden-build-history exclusions. No other permanent owner requires semantic amendment.
- Supporting requirements affected: after the owner amendment, one bounded public-release requirement may select GitHub Pages, a separate neutral public artifact repository, a publicly reachable but unannounced Release Candidate followed by Public Beta at the same URL, and privacy checks for generated output plus public repository, commit, workflow, URL, and hosting metadata. It must define one-way publication from the trusted private build with least-privilege, short-lived write authority scoped to the public destination, no private-repository read credential in the public destination, and explicit revocation. It must also assess unavoidable provider request logging and exclude optional analytics and workbench-state transmission. A later separate requirement may define the masthead Copy action against that stable URL.
- Production and tests affected: later work may add static-host build-path configuration, artifact-only publication and deployment automation, public-output and operational-metadata privacy checks, source-map and secret rejection, exact-build provenance, and release verification. It may not add an API, account, persistence, application telemetry, address-state contract, secret-bearing client configuration, or public copy of the private development repository under this decision.
- Visible Setup or Result consequence: none. The public page presents the same current Setup and Result behavior. Release Candidate and Beta change release confidence and discoverability, not calculation, session, or display semantics; the separate Copy feature is not part of this outcome.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-06T21:07:15.7918304+09:00`
