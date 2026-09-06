---
date: 2026-09-06
topic: public-static-release-candidate
status: approved
---

# Public Static Release Candidate Requirements

## Summary

Prepare one privacy-preserving, artifact-only GitHub Pages delivery path for the
current workbench, verify an unannounced but publicly reachable Release
Candidate at one stable URL, and announce that same URL as a Public Beta only
after the release, legal-attribution, asset-rights, privacy, and browser gates
all pass.

---

## Problem Frame

The current Vite build already produces a browser-only static client, but the
private development repository and personal GitHub identity must not become the
public product surface. A public host also distributes the workbench's
game-derived images and branding, so a successful build alone cannot authorize
publication. The delivery path needs a neutral public identity, a one-way
least-privilege publisher, a complete generated-output boundary, and a manual
release gate that fails closed on unsupported assets, operator/use conditions,
wording, or served jurisdictions.

The first public stage is an unannounced Release Candidate, not a private
preview. It must be safe if discovered immediately. The later Public Beta uses
the same URL and client behavior; the label changes release confidence and
announcement state only.

---

## Actors

- A1. Product owner: performs the manual public-release decision and controls
  the private source repository, neutral public identity, destination
  repository, and publisher credential.
- A2. Private release controller: runs from a clean local checkout of exact
  trusted `main`, builds and validates it, then publishes only its accepted
  generated tree.
- A3. Neutral bootstrap App: receives short-lived elevated authority for the
  one-time creation and hardening of the public destination, performs the first
  accepted publication, and is then retired.
- A4. Neutral publisher App: receives short-lived write authority only for
  later artifact updates to the public destination and has no access to the
  private repository.
- A5. GitHub Pages: serves the public artifact tree and performs provider-level
  transport logging under GitHub's current policy.
- A6. Public visitor: uses the same fresh-session workbench as the local client
  without an account, persistence, or application telemetry.

---

## Key Flows

- F1. Neutral delivery bootstrap
  - **Trigger:** The supporting requirement is approved and implementation is
    ready for a destination.
  - **Steps:** The product owner uses the existing personal account to create a
    neutral GitHub Organization and organization-owned bootstrap and publisher
    Apps while membership remains private. Before any repository is public, the
    controller verifies the current provider metadata boundary. Using a fresh
    bootstrap-App key and short-lived installation token, it creates the root
    Pages repository, writes the first accepted artifact, configures the branch
    ruleset and Pages, and inspects every public organization, repository,
    commit, event, deployment, and URL surface for actor or identity disclosure.
    The bootstrap App and its credentials are then retired.
  - **Outcome:** The destination exposes only a neutral project identity and
    generated-client delivery metadata.
  - **Covered by:** R1-R4, R11, R13a-R13b, R16
- F2. Candidate build and release gate
  - **Trigger:** A trusted private `main` revision is selected for RC delivery.
  - **Steps:** The private controller builds once, inventories every emitted file,
    rejects forbidden output, and binds the private source revision to the
    artifact digest. The product owner completes the current manual asset,
    operator/use, wording, and jurisdiction review against that exact artifact.
  - **Outcome:** Publication remains disabled unless every automated and manual
    gate closes for the exact bytes to be published.
  - **Covered by:** R5-R10, R17-R19
- F3. One-way publication
  - **Trigger:** The exact candidate passes F2.
  - **Steps:** For the first publication, the private controller uses the
    one-time bootstrap App to create and harden the destination and write the
    generated tree through its neutral bot identity. For later publication, it
    mints a destination-only publisher-App installation token and updates only
    the generated tree. The controller verifies the resulting commit and Pages
    deployment and attempts immediate token revocation in cleanup.
  - **Outcome:** One public commit and URL correspond to the accepted artifact;
    no credential or private-source access crosses into the destination.
  - **Covered by:** R3, R4, R11-R13b, R19
- F4. RC verification and Beta announcement
  - **Trigger:** The unannounced URL is live.
  - **Steps:** The product owner verifies the static client, attribution,
    responsive behavior, fresh-session behavior, asset resolution, and network
    boundary in a clean browser session. Only then is the same URL announced to
    the ZZZ community as a Public Beta.
  - **Outcome:** Community members receive one complete client and may provide
    free-form feedback through the public repository's Issues or community chat.
  - **Covered by:** R14-R18, R20-R22
- F5. Failed or withdrawn release
  - **Trigger:** A gate fails, published bytes are wrong, a credential is
    exposed, or the release basis is withdrawn.
  - **Steps:** Stop publication, revoke publisher access, and either restore the
    last accepted public artifact or disable Pages while the problem is fixed.
  - **Outcome:** A known unsupported artifact is not left as the active client.
  - **Covered by:** R12, R13, R23

---

## Requirements

**Public identity and repository boundary**

- R1. No second personal GitHub account is created. The product owner's existing
  account privately administers a neutral-named GitHub Organization, keeps that
  membership private, enables GitHub two-factor authentication, and stores
  recovery material offline and outside both repositories. The personal account
  does not create or mutate the public repository or Pages configuration and
  performs no public commit, deployment, Issue, comment, close, label, or triage
  activity there. Private organization or App administration is permitted only
  while current provider behavior keeps the account absent from every public
  organization, repository, App, event, deployment, and audit-adjacent surface.
  If that cannot be established before publication, the neutral-organization
  path is unsupported and publication stops; there is no manual-account
  fallback.
- R2. The destination is the neutral Organization's public root Pages
  repository, `<neutral-organization>.github.io`, and initially uses the
  corresponding HTTPS root URL without a custom domain. The Organization is
  dedicated to this delivery surface and contains no other repository, allowing
  the two Apps to be installed before repository creation without granting them
  access beyond the one eventual destination. The concrete Organization,
  repository, and URL names remain operational configuration outside product
  meaning.
- R3. The public repository contains only the generated runtime tree and the
  minimum host control file required to serve it. It contains no private source
  tree, source history, project documentation, package metadata, test input,
  development configuration, credential, source map, absolute local path, or
  private-repository identity.
- R4. Public commits use only the neutral bootstrap or publisher App identity as
  author and committer, with a no-reply address. Their messages and public
  metadata may identify a release stage and artifact digest but do not expose
  the private repository name, private source commit, personal account, local
  path, or workflow secret. Provider-owned service actors may appear only when
  required by Pages and must not reveal the personal operator.

**Exact candidate and legal release gate**

- R5. A release candidate is built once from an exact current revision of the
  protected private `main`. The private release execution binds that revision,
  build command, complete generated-file manifest, artifact-tree digest, and
  resulting public commit without copying the binding into the public client or
  creating a repository release registry. It uses a controlled Node version and
  a clean install of the exact lockfile dependency graph with lifecycle scripts
  disabled before the single build; no pre-existing `node_modules` participates.
- R6. Generated-output validation allowlists the minimum static tree needed by
  the current client and rejects source maps, unexpected file kinds or paths,
  symlinks, embedded credentials, personal identifiers, private URLs, absolute
  local paths, and external resource or application-request targets. It
  inventories embedded URL strings and permits an inert dependency diagnostic
  reference only after proving that the client never requests it. A browser
  bundle is public output and is never treated as a secret.
- R7. Before any public write, one current manual review accounts for the
  provenance and rights basis of every publicly emitted asset in the exact
  generated manifest, including bundled code/library output and game-derived
  material. A grouped conclusion is permitted only for assets with the same
  provenance, rightsholder, and applicable redistribution basis.
- R8. The same manual review closes the operator and non-commercial use model,
  the current required notice and legal-statement wording, and every jurisdiction
  the host serves. An unsupported file, operator/use model, wording, or served
  jurisdiction blocks publication; lack of announcement is not a restriction.
- R9. A blocking item is resolved only by removing or replacing it, changing or
  independently restricting delivery to a supported basis, or obtaining
  appropriate professional advice. Automated checks, repository ownership, a
  disclaimer, or the RC label cannot substitute for that decision.
- R10. The release review is an exact-artifact decision rather than a permanent
  asset catalogue. A changed generated manifest, changed attribution wording,
  changed operator/use model, changed served-jurisdiction set, or materially
  changed applicable guidance invalidates it and requires a fresh decision.

**One-time bootstrap, one-way publisher, and hosting**

- R11. Publication is an owner-initiated local operation that starts only from a
  clean private `main` checkout whose HEAD equals `origin/main`. The controller
  verifies its absolute trusted controller path, expected private repository and
  remote identity, fixed destination repository identity and branch, and that
  clean exact-head boundary before reading an App key or building. Before the
  public repository exists, an organization-owned neutral bootstrap App is
  installed with the minimum temporary repository-administration, Pages, and
  contents authority needed to create and harden that destination and perform
  the first accepted publication. While the dedicated Organization has no
  repository, a separate neutral publisher App is installed for all of that
  Organization's current and future repositories with the minimum metadata-read
  and contents-write permissions needed for later updates. R2 ensures that this
  resolves to the one public destination when it is created. Neither App has
  private-repository access.
- R12. Each publication window uses a fresh App private key at one absolute
  external path outside every repository. The controller completes the build
  and all non-credential preflight checks before a reviewed repository-owned
  minting module reads the key; build tools and third-party Actions never receive
  it. Neither private key nor token enters command arguments, inherited general
  environment, output, logs, caches, or artifacts. The minted installation token
  enters only the single publishing child process. The controller attempts
  immediate revocation in `finally` and supported signal handling after success,
  failure, or interruption; an unconfirmed revocation is a release failure, and
  the installation token's provider-enforced one-hour expiry is the hard
  containment bound. The owner then revokes the publication-window key and
  deletes its external file. The public repository stores no credential and has
  no private-repository read authority. Suspected exposure, loss of operator
  control, or retirement of the publisher or destination immediately starts
  revocation of every affected key, token, and installation and blocks another
  release until their state is confirmed.
- R13. The publisher constructs and verifies the complete destination tree
  before one branch-ref update, so one public commit identifies one complete
  accepted artifact. It binds that update to the inspected destination tip (or
  verified absence for the first commit), serializes release and rollback
  mutations, and rejects a changed tip or non-fast-forward result. It verifies
  the destination commit and Pages result before reporting success and must not
  silently treat a partial push, stale deployment, or unknown mutation result as
  a completed release. After the first branch exists, an active public branch
  ruleset blocks force pushes, deletion, and direct updates while granting the
  publisher App the sole normal update bypass; the owner does not use an admin
  bypass for release content.
- R13a. Bootstrap is a distinct one-time privileged transaction. Its App creates
  the public root repository, publishes the first R7-R10-accepted artifact,
  installs the R13 ruleset with the steady-state publisher App as the sole normal
  content-update bypass, enables branch-based Pages, and verifies the exact
  public commit, deployment, and actor metadata. The controller then revokes the
  bootstrap installation token, revokes and deletes every bootstrap key,
  uninstalls the bootstrap App, and deletes or disables it so its elevated
  permissions cannot be reused. The personal account performs none of those
  public mutations. Failure to complete or verify retirement is a release
  failure and blocks steady-state publication.
- R13b. Immediately before the first public mutation and again after the first
  deployment, the controller verifies current provider documentation and
  inspects unauthenticated public organization, repository, App, event, commit,
  deployment, Pages, and URL metadata. The acceptable actor set is limited to
  the neutral organization-owned Apps and necessary provider service identities.
  Any personal-account identity, private-development identity, unexpected actor,
  or public path whose actor boundary cannot be inspected stops publication and
  triggers R23; private membership alone is not treated as proof.

**Shared client and attribution**

- R14. Local, RC, and Beta builds render the same client. Delivery does not
  change Setup, Result, calculation, candidates, preparation, party behavior,
  or in-memory session state; reload or a later visit starts a fresh session.
- R15. One semantic page footer follows the application content in both Party
  Edit and applied-workbench states. It is visually subordinate but readable at
  supported desktop and narrow viewports, does not obscure or shift interactive
  workbench controls, and remains non-interactive: no link, button, form,
  feedback action, or tracking surface.
- R16. The footer identifies the project as an unofficial, non-commercial
  fan-made website with no HoYoverse sponsorship, endorsement, or approval. It
  also renders the exact current copyright notice and legal statement accepted
  by R8. A concise Korean summary that the project is fan-made and that rights
  in game-related images and assets remain with HoYoverse and applicable
  rightsholders may accompany those required statements, but it does not
  replace or paraphrase away wording that the applicable release conditions
  require verbatim.
- R17. The application creates no account, cookies, local or session storage,
  service worker, analytics, telemetry, or deliberate Setup/session
  transmission. Runtime network requests are limited to the document and
  same-origin static files needed to render the selected current state.
- R18. Provider request metadata, including visitor IP information handled under
  GitHub's current policy, is acknowledged as unavoidable host operation rather
  than application telemetry. The Beta announcement does not promise anonymity
  from the hosting provider.

**RC, Beta, and feedback**

- R19. The first publication is an unannounced, publicly reachable RC at the
  final stable URL. It is tested as immediately discoverable and receives no
  access-control, secret-URL, or private-preview assumption.
- R20. The same URL becomes Public Beta only after all RC acceptance checks pass.
  Beta adds no alternate client mode, end date, formal graduation criterion, or
  persisted release state. Immediately before announcement, the controller
  revalidates the expected destination tip, public artifact digest, completed
  Pages deployment, live manifest URLs, and current R7-R10 release decision; an
  intervening change returns the candidate to RC verification.
- R21. The Beta targets the whole ZZZ community with the same UI. The public
  artifact repository keeps GitHub Issues available as an intake-only channel
  for voluntary reports, while replies and discussion occur in community chat.
  Neither channel is embedded in or linked from the client under this
  requirement.
- R22. Suggested feedback keywords are `UI`, `Setup`, `Result`, `source`, and
  `operation`, with browser/device context or a redacted screenshot when useful.
  Announcement copy states that repository Issues and community chat are public
  third-party-hosted submissions, discourages personal or game-account
  identifiers, and asks users to remove such details from screenshots. No issue
  template or exhaustive report form is required. The personal account does not
  reply, close, label, or triage publicly; if unsafe disclosure requires
  operator removal, the owner pauses Issues and uses GitHub's private support or
  moderation path rather than exposing the personal account.
- R23. The release procedure includes a tested stop path: disable further
  publication, revoke every active bootstrap or publisher installation and
  credential, and restore the last artifact whose R7-R10 decision remains
  current and supported, or disable Pages when no such artifact exists.
  Recovery never deletes or publishes the
  private development repository. If forbidden private data or a credential
  entered any public commit, ordinary rollback is insufficient: immediately
  unpublish and revoke affected credentials, purge all reachable public refs and
  history or recreate the artifact repository when complete purge cannot be
  established, request cache removal where the provider permits, and rescan the
  clean destination before resuming.

---

## Acceptance Examples

- AE1. **Covers R1-R6, R13b.** Given a trusted private `main` build, validation accepts
  `index.html`, hashed same-origin runtime assets, and the required host control
  file, but rejects a `.map`, private repository URL, personal username, local
  `C:\\Users\\...` path, externally loaded resource/request endpoint, or
  non-runtime file without maintaining a hand-authored list of every Agent
  asset. An inert framework diagnostic URL is recorded and proven non-requesting
  rather than mistaken for telemetry.
- AE2. **Covers R7-R10, R16.** Given one exact build manifest, the release review
  accounts for each emitted third-party-derived file and the current notice,
  legal statement, operator/use model, and served jurisdictions. One unresolved
  portrait or excluded jurisdiction blocks the public write even when the
  footer and build tests pass.
- AE3. **Covers R11-R13b.** Given every gate passes and no destination exists, the
  private controller uses only the temporary bootstrap App to create the public
  repository, publish one complete accepted tree, configure protection and
  Pages, verify the public actors, and retire all elevated access. A later
  update uses only the destination-scoped publisher App. Given a dirty or stale
  private checkout, missing owner-controlled key, unexpected public actor,
  failed or ambiguous push, incomplete bootstrap retirement, or provider path
  that requires a personal public mutation, it stops before advancing release.
- AE4. **Covers R14-R18.** In clean desktop and narrow browser sessions, Party
  Edit and the applied workbench both end with the same readable footer; it has
  no focusable or clickable descendant. Using the workbench produces only
  same-origin static requests, and reload restores a fresh session.
- AE5. **Covers R19-R22.** The unannounced RC URL works for an unauthenticated
  visitor and resolves every emitted asset. After acceptance, the identical URL
  is announced as Public Beta with short feedback keywords and external GitHub
  Issues/community-chat channels; the client gains no feedback UI.
- AE6. **Covers R23.** Given a deliberately failed release rehearsal, the
  publisher credential is revoked and the served site remains on the prior
  accepted commit or Pages is disabled, with no private-source mutation.

---

## Verification Strategy

- Extend shared App behavior tests to prove one semantic, non-interactive footer
  exists in both Party Edit and applied states. Test the shared behavior and
  accessibility properties, not a catalogue of Agents or assets.
- Build with the production command and validate the generated tree by generic
  path, file-kind, content, URL, source-map, secret, personal-identity, and local
  path rules. Derive the asset manifest from output rather than hard-coding the
  current Agent, W-Engine, or Drive Disc roster.
- Exercise publication logic with a temporary destination or dry-run transport
  to verify trusted path and repository identities, clean exact-source and locked
  dependency binding, pre-key preflight, token scope, secret redaction, cleanup,
  expected-tip serialization, complete-tree commits, stale/partial failure, and
  supported rollback. Network mutation remains disabled in ordinary tests.
- Verify the exact Pages URL in a clean unauthenticated browser at one desktop
  and one narrow viewport. Check direct navigation, every manifest URL, footer
  placement and contrast, keyboard traversal, no horizontal overflow, fresh
  reload state, and the runtime request boundary.
- Require the existing behavior, type, production-build, and visual-baseline
  checks for implementation. The visual comparison covers both Party Edit and
  applied states at desktop and narrow sizes because the footer changes a shared
  page boundary.
- Keep the manual rights and jurisdiction review manual and exact-artifact
  bound. Tests may require its fresh pass/fail release decision but must not
  infer rights from filenames, attribution presence, or an asset catalogue.

---

## Manual Bootstrap

The product owner must create and retain control of the following operational
resources before the first public write:

- one neutral-named GitHub Organization administered by the existing account
  with private membership;
- two-factor authentication and offline recovery for the existing account;
- one organization-owned neutral bootstrap GitHub App, installed before the
  public repository exists and restricted to the temporary R11 authority;
- one organization-owned neutral publisher GitHub App prepared for the eventual
  public destination and restricted to steady-state R11 authority;
- separate fresh bootstrap and publication-window App keys stored at protected
  absolute paths outside every repository and revoked after their transactions;
- a current provider-capability and public-metadata preflight satisfying R1 and
  R13b; and
- one current exact-artifact release decision satisfying R7-R10.

The trusted controller, authenticated only as the bootstrap App, creates the
Organization's root Pages repository, publishes the first accepted artifact,
configures the R13 branch ruleset and HTTPS Pages delivery, verifies the public
actor boundary, and retires the elevated App before live RC checks or any later
content update. There is no publicly served empty/bootstrap state and no such
state can be a rollback target. Concrete names, IDs, keys, URLs, capability
evidence, and review evidence stay outside this document. Bootstrap is a
one-time operator-authorized App transaction; it does not create a second client
configuration or runtime account dependency.

---

## Success Criteria

- The public URL and repository disclose no personal operator identity or
  private-development metadata beyond intentionally public neutral delivery
  information.
- Every public byte comes from one accepted trusted build and can be related
  privately to its source revision and public commit.
- Publication is impossible while automated privacy checks or the manual
  asset/operator/wording/jurisdiction gate is open.
- Local, RC, and Beta clients remain behaviorally identical except for the one
  owner-authorized shared legal attribution surface.
- The unannounced RC is safe for immediate discovery, and the same URL can be
  announced as Public Beta without rebuilding or migrating user state.

---

## Scope Boundaries

- Do not publish the private repository, its source history, or a public source
  mirror, and do not make the public destination a development repository.
- Do not add a backend, API, authentication, persistence, analytics, telemetry,
  cookies, storage, service worker, address-derived state, or custom domain.
- Do not add a Copy button or encoded Setup URL. That older sharing direction is
  outside current `SW-022` and requires its own later authority decision and
  supporting requirement before implementation.
- Do not add an in-client feedback link, issue template, changelog, promotional
  panel, RC badge, Beta badge, or second legal surface.
- Do not treat a footer, repository notice, non-commercial intent, or GitHub
  Pages availability as a license or rights determination.
- Do not create a permanent asset-rights registry, named-file test catalogue, or
  runtime release validator.

---

## Key Decisions

- A neutral Organization whose public repository and Pages surface are created
  only by a temporary neutral bootstrap App can keep personal and private-
  development identities outside the public surface without creating a second
  personal account. Private membership is necessary but not sufficient, so
  publication also fails closed on current provider capabilities and observed
  public actor metadata. The root Pages repository matches the current root-
  relative Vite asset paths without adding a project-path mode.
- Branch-based artifact hosting keeps the public repository limited to generated
  files; publication intelligence stays in the trusted private repository and
  credentials remain outside both repositories.
- A temporary organization-owned bootstrap App isolates the elevated repository
  and Pages setup authority from the steady-state path and is retired after the
  first accepted deployment. A separate destination-only publisher App then
  gives later releases short-lived, revocable contents authority without
  exposing the private repository or reusing the personally named development
  App.
- RC and Beta share one URL because they differ in confidence and announcement,
  not product behavior. The RC is still fully public.
- GitHub Issues are an intake-only public channel; replies and discussion stay
  in community chat. Keeping both out of the client and keeping the personal
  account inactive in the public repository preserves the current privacy and
  no-feedback-transport boundaries.
- A concise Korean rights summary is useful context but is not by itself the
  current official rights notice and legal statement. The exact accepted
  release wording remains part of the fail-closed manual gate.

---

## Dependencies / Assumptions

- `SW-022`, amended through accepted `ACR-2026-09-06-002` and
  `ACR-2026-09-06-003`, owns public static delivery, fresh-session behavior, the
  single attribution permission, provider metadata, and the fail-closed release
  review.
- GitHub Pages continues to support static root-site delivery; an
  organization-installed GitHub App can create an organization repository and
  configure repository, ruleset, and Pages settings with explicitly granted
  temporary permissions; and installation tokens remain short-lived and
  repository/permission scoped. These capabilities are reverified before
  bootstrap rather than assumed. A material platform or public-metadata change
  reopens the affected delivery requirement and may make this path unsupported.
- The first public release remains blocked until the manual review can support
  every emitted asset and served jurisdiction. This document does not claim
  that current repository ownership or the proposed footer has already closed
  that gate.

---

## Outstanding Questions

None. Operational names and credentials are supplied during Manual Bootstrap;
an unsupported legal-release condition is a defined blocker, not an unanswered
product choice.
