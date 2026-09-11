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
- A3. Neutral bootstrap/stop App: receives short-lived elevated authority for
  the one-time creation and hardening of the public destination, performs the
  first accepted publication, then remains dormant with the Pages and repository-
  administration authority that GitHub's Pages-delete API jointly requires for
  fail-closed unpublishing. It has no online key or token while dormant, and its
  fixed controller still permits only Pages deletion. Repository deletion and
  recreation are deliberate owner-run incident actions, not controller commands.
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
    owner completes the current provider and public-metadata checklist. Using a fresh
    bootstrap-App key and short-lived installation token, it creates the private root
    Pages repository and its `.nojekyll` placeholder, makes that placeholder-only
    repository public, installs an active ruleset with only the bootstrap App as
    its temporary bypass, writes the first accepted artifact, replaces that bypass
    with the publisher App alone, and only then configures Pages. The owner then inspects every public organization,
    repository, commit, event, deployment, and URL surface for actor or identity disclosure.
    The bootstrap command confirms token revocation before it returns. After the
    live RC checks, the used key and contents permission are retired and the App
    enters its dormant stop posture with the minimum provider-required Pages and
    repository-administration permissions.
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
    one-time bootstrap App to create the destination, expose only its inert
    placeholder while installing temporary bootstrap-only protection, write the
    generated tree through its neutral bot identity, and finalize publisher-only
    protection before Pages exists. For later publication, it
    mints a destination-only publisher-App installation token and updates only
    the generated tree. The controller verifies the resulting commit and
    complete tree and attempts immediate token revocation in cleanup; Pages and
    live behavior remain open until the owner completes the read-only RC checklist.
  - **Outcome:** One public commit and URL correspond to the accepted artifact;
    no credential or private-source access crosses into the destination.
  - **Covered by:** R3, R4, R11-R13b, R19
- F4. RC verification and Beta announcement
  - **Trigger:** The unannounced URL is live.
  - **Steps:** The product owner verifies the static client, attribution,
    responsive behavior, fresh-session behavior, asset resolution, and network
    boundary in a clean browser session. Bootstrap completion has already
    confirmed token revocation; the owner privately rotates the used bootstrap
    key and removes its contents permission, and
    then verifies the dormant stop posture and public metadata with the
    read-only checklist. Only then
    is the same URL announced
    to the ZZZ community as a Public Beta.
  - **Outcome:** Community members receive one complete client and may provide
    free-form feedback through the public repository's Issues or community chat.
  - **Covered by:** R13a, R13c, R14-R18, R20-R22
- F5. Failed or withdrawn release
  - **Trigger:** A gate fails, published bytes are wrong, a credential is
    exposed, or the release basis is withdrawn.
  - **Steps:** Stop publication and revoke active publisher access. Use the
    publisher App to restore a still-supported accepted artifact, or use the
    dormant bootstrap/stop App through its fixed break-glass controller path to
    disable Pages. If the public repository itself is contaminated, automation
    stops and the owner follows the confirmed manual incident guide before a
    later one-time bootstrap.
  - **Outcome:** A known unsupported artifact is not left as the active client.
  - **Covered by:** R12, R13, R13c, R23

---

## Requirements

**Public identity and repository boundary**

- R1. No second personal GitHub account is created. The product owner's existing
  account privately administers a neutral-named GitHub Organization, keeps that
  membership private, enables GitHub two-factor authentication, and stores
  recovery material offline and outside both repositories. The personal account
  does not create or mutate the public repository or Pages configuration and
  performs no public commit, deployment, Issue, comment, close, label, or triage
  activity there. After Pages is verified disabled, a confirmed contamination
  incident may require the owner to delete the exact destination through private
  Organization administration; that exceptional action must leave no personal
  identity on a surviving public surface, and recreation still uses the neutral
  bootstrap App. Private organization or App administration is otherwise permitted only
  while current provider behavior keeps the account absent from every public
  organization, repository, App, event, deployment, and audit-adjacent surface.
  If that cannot be established before publication, the neutral-organization
  path is unsupported and publication stops; there is no personal-account
  fallback for publication or ordinary recovery.
- R2. The destination is the neutral Organization's public root Pages
  repository, `<neutral-organization>.github.io`, and initially uses the
  corresponding HTTPS root URL without a custom domain. The Organization is
  dedicated to this delivery surface and contains no other repository, allowing
  the two Apps to be installed before repository creation without granting them
  access beyond the one eventual destination. The concrete Organization,
  repository, and URL names remain operational configuration outside product
  meaning.
- R3. The public repository contains only the generated runtime tree, the
  minimum host control file, and the bounded companion download and minimal
  installation/use help authorized by `SW-022`. The download contains generated
  runtime files and required extension installation metadata only. It contains no private source
  tree, source history, project documentation, development package metadata, test input,
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
  The companion ZIP is inspected entry by entry, including its exact required
  manifest permissions and local-only runtime boundary; opaque archives are
  not accepted. Only explicit navigation to the official HoYoLAB record page
  and the workbench is added. This does not permit external application-data
  requests, broad extension host access, or hidden account-data access.
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
  key is read for a restore, a current controller seal independently binds that
  clean commit/tree, Git and Node identities, the complete regular-file npm
  package-tree identity, fixed-child bytes, and destination;
  the historical artifact decision cannot authorize its own privileged code.
  Every direct Git or npm process receives an operation-specific minimal
  environment and never inherits repository/config overrides, Node preload
  options, npm user/global configuration, credentials, or private release values.
  A project `.npmrc` is not an accepted extracted build input.
  Before the public repository exists, an organization-owned neutral bootstrap App is
  installed with the minimum temporary repository-administration, Pages, and
  contents authority needed to create and harden that destination and perform
  the first accepted publication. While the dedicated Organization has no
  repository, a separate neutral publisher App is installed for all of that
  Organization's current and future repositories with the minimum metadata-read
  and contents-write permissions needed for later updates. R2 ensures that this
  resolves to the one public destination when it is created. Neither App has
  private-repository access.
  GitHub Free is the selected Organization plan. Because repository rulesets are
  unavailable to a private repository on that plan, bootstrap may make public only
  the verified neutral `.nojekyll` placeholder before creating protection. Pages
  remains disabled, no client artifact is present, and no personal actor performs
  the transition. The controller must install and verify temporary bootstrap-only
  protection before publishing artifact files.
- R12. Each publication or emergency-stop window uses a dedicated fresh App private
  key at one absolute
  external path outside every repository. The controller completes the build
  and all non-credential preflight checks before a reviewed repository-owned
  minting module reads the key; build tools and third-party Actions never receive
  it. Neither private key nor token enters command arguments, inherited general
  environment, output, logs, caches, or artifacts. The minted installation token
  enters only the single publishing child process. The controller attempts
  immediate revocation in `finally` and supported signal handling after success,
  failure, or interruption; an unconfirmed revocation is a release failure, and
  the installation token's provider-enforced one-hour expiry is the hard
  containment bound. The owner then uses private Organization App settings to
  revoke and delete the used window key and deletes its external file. When the
  provider requires one registration key to remain, the owner generates the
  protected offline replacement before deleting the used key; the replacement
  does not enter a controller, repository, or online environment before a later
  authorized window. The public repository stores no credential and has
  no private-repository read authority. Suspected exposure, loss of operator
  control, or retirement of either App or the destination immediately starts
  revocation of every affected key, token, and installation and blocks another
  release until their state is confirmed.
- R13. The publisher constructs and verifies the complete destination tree
  before one branch-ref update, so one public commit identifies one complete
  accepted artifact. It binds that update to the inspected destination tip (or
  verified absence for the first commit), serializes release and rollback
  mutations, and rejects a changed tip or non-fast-forward result. It verifies
  the destination commit and complete tree before reporting content success and must not
  silently treat a partial push, stale deployment, or unknown mutation result as
  a completed content release; Pages and live-client readiness remain open until
  the owner completes the read-only RC checklist. Before the accepted artifact enters
  the public branch, an active public branch
  ruleset blocks force pushes, deletion, and direct updates while granting the
  currently authorized neutral App the sole update bypass. Bootstrap temporarily
  grants that bypass only to the bootstrap App, then replaces it with the publisher
  App as the sole normal update bypass before Pages is enabled; the owner does not
  use an admin bypass for release content.
- R13a. Bootstrap is a distinct one-time privileged transaction. Its App creates
  the private root repository and one neutral `.nojekyll` commit, makes that
  placeholder-only repository public, installs and verifies the R13 ruleset with
  the bootstrap App as its sole temporary bypass, publishes the first
  R7-R10-accepted artifact, and then updates and verifies the same ruleset with the
  steady-state publisher App as the sole normal content-update bypass. Only after
  that final protection is observed does it enable branch-based Pages. The owner then verifies
  the exact public commit, deployment, and actor metadata through the read-only
  RC checklist. The bootstrap transaction confirms token revocation before it
  returns, while the bootstrap App and its used key remain available through
  the live RC checks so R23 can mint a fresh stop-scoped token if they fail.
  After those checks pass, the product owner uses only private Organization App
  settings to generate the required protected offline replacement key, delete
  the used bootstrap key, and remove the App's contents permission. GitHub's current
  Pages-delete API requires both Pages-write and repository-administration-write,
  so those two permissions remain in the dormant stop posture. The owner then verifies the resulting installation,
  permission, credential-file, and public-metadata state through the read-only
  checklist before accepting the
  transition to R13c. The personal account performs no public repository, Pages,
  commit, or deployment mutation. Failure to complete or verify the transition
  is a release failure and blocks steady-state publication and Beta announcement.
- R13b. Immediately before the first public mutation and again after the first
  deployment, the owner completes a read-only checklist against current provider
  documentation and unauthenticated public organization, repository, App, event, commit,
  deployment, Pages, and URL metadata. The acceptable actor set is limited to
  the neutral organization-owned Apps and necessary provider service identities.
  Any personal-account identity, private-development identity, unexpected actor,
  or public path whose actor boundary cannot be inspected stops publication and
  triggers R23; private membership alone is not treated as proof.
- R13c. After R13a closes, the same organization-owned App remains installed on
  the dedicated destination as a dormant stop actor with Pages-write and repository-
  administration-write authority, but no contents permission, no
  token, and no private key present in an online or controller environment. Its
  provider-required registration key remains protected offline. The App is
  constrained by a reviewed fixed controller schema that can only disable Pages
  under R23; release-state inspection remains an owner-run read-only checklist.
  Although its provider permission could reach broader repository administration,
  the reviewed fixed controller accepts only the exact Pages-delete endpoint and
  no repository-setting or content mutation. It never performs a routine release,
  content update, repository deletion, or repository recreation.
  A still-supported artifact restore uses the contents-only publisher App. A
  break-glass Pages-disable mutation requires the R12 fresh stop window, exact
  destination and incident preflight, post-mutation public verification, token
  revocation, and private owner key rotation. Any later repository deletion is
  a separate manual owner action performed only after Pages is disabled, the
  exact destination and preservation needs are reconfirmed, and the controller
  has stopped. Recreation returns to the one-time R13a bootstrap flow.

**Shared client and attribution**

- R14. Local, RC, and Beta builds render the same client. Delivery does not
  change Setup, Result, calculation, candidates, preparation, party behavior,
  or in-memory session state; reload or a later visit starts a fresh session
  unless an explicitly requested valid Setup shortcut is opened under `SW-016`.
  The header provides the official HoYoLAB shortcut beside Copy Setting and a
  subordinate expandable companion download/help action. Help identifies the
  desktop browser/manual-install boundary and the sequence: choose party and
  Focus, copy Setting, log in on HoYoLAB, read the three Agents, inspect any
  exclusions or explicit alternatives, and open the complete workbench URL.
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
  persisted release state. Immediately before announcement, the owner reruns the
  read-only RC checklist to revalidate the expected destination tip, public artifact digest, completed
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
- R23. The release procedure includes a tested stop path. It first disables new
  publication and revokes every active token and affected key. If a prior
  artifact still has a current supported R7-R10 decision, the publisher App
  restores it through R13 and cleans up its publication window. Otherwise the
  bootstrap/stop App opens one R12 break-glass window and disables Pages.
  If forbidden private data or a credential entered any public commit, ordinary
  rollback is insufficient: the stop App immediately disables Pages and the
  automated controller stops. It reports the exact observed repository, active
  artifact, and irreversible exposure, then provides a manual incident guide.
  Only after the owner reconfirms the fixed target and preserves required
  evidence may the owner delete that repository through private Organization
  administration. A later recreation uses the one-time R13a bootstrap flow; no
  controller command deletes or recreates a repository. Deletion does not retract public forks, clones,
  archives, or caches: the operator treats the disclosure as irreversible,
  inspects the known public fork network, requests provider cache or sensitive-
  data removal where supported, and explicitly resolves the remaining privacy,
  credential, and legal risk before publication may resume. The publisher App
  may then restore only a still-supported accepted artifact after a fresh R13a
  bootstrap transaction re-establishes the destination, protection, and Pages
  and the owner repeats the full read-only checklist. Every
  stop token is revoked and its used key privately rotated afterward; the
  stop installation returns to R13c unless it was itself affected, in which
  case it is uninstalled and publication remains blocked until a replacement
  passes R1 and R13b. Recovery never deletes or publishes the private
  development repository.

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
- AE3. **Covers R11-R13c.** Given every gate passes and no destination exists, the
  private controller uses only the temporary bootstrap App to create the private
  repository and placeholder, publicize that neutral placeholder for GitHub Free,
  install temporary bootstrap-only protection, publish one complete accepted tree,
  finalize publisher-only protection, and then configure Pages. It reports only
  the resulting content commit/tree. The owner separately
  verifies public actors, Pages/live bytes, key retirement, and dormant posture.
  It keeps Pages-disable capability through live RC checks. A later update uses only the
  destination-scoped publisher App. Given a dirty or stale private checkout,
  missing owner-controlled key, unexpected public actor, failed or ambiguous
  push, incomplete bootstrap transition, or provider path that requires a
  personal public mutation, it stops before advancing release.
- AE4. **Covers R14-R18.** In clean desktop and narrow browser sessions, Party
  Edit and the applied workbench both end with the same readable footer; it has
  no focusable or clickable descendant. Using the workbench produces only
  same-origin static requests, and reload restores a fresh session.
- AE5. **Covers R19-R22.** The unannounced RC URL works for an unauthenticated
  visitor and resolves every emitted asset. After acceptance, the identical URL
  is announced as Public Beta with short feedback keywords and external GitHub
  Issues/community-chat channels; the client gains no feedback UI.
- AE6. **Covers R12, R13c, R23.** Given a deliberately failed release rehearsal,
  the publisher credential is revoked and the publisher restores a still-
  supported prior artifact, or the fixed recovery path disables Pages. The used
  stop token is revoked and its key is privately rotated, with no personal
  public action or private-source mutation. A simulated forbidden-data incident
  stops after disabling Pages and emits a manual exact-destination incident
  guide without claiming to retract an external fork, clone, archive, or cache.

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
  child-internal authenticated-tip checks, complete-tree commits, stale/partial
  failure, supported historical restore, and Pages disable. Keep actor,
  Pages/live, key-retirement, and dormant-posture conclusions open for the owner
  checklist rather than simulating them in the controller. Network mutation
  remains disabled in ordinary tests.
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
- one organization-owned neutral bootstrap/stop GitHub App, installed before
  the public repository exists, initially restricted to the R11 bootstrap
  authority, and prepared to transition to the dormant R13c Pages-write plus
  repository-administration-write authority with no contents permission;
- one organization-owned neutral publisher GitHub App prepared for the eventual
  public destination and restricted to steady-state R11 authority;
- separate fresh bootstrap and publication-window App keys stored at protected
  absolute paths outside every repository, plus the provider-required protected
  offline replacement key needed for a later R13c emergency stop, with every used key
  privately rotated under R12;
- a current provider-capability and public-metadata preflight satisfying R1 and
  R13b; and
- one current exact-artifact release decision satisfying R7-R10.

The trusted controller, authenticated only as the bootstrap App, creates the
Organization's private root Pages repository and neutral placeholder, makes only
that placeholder repository public, installs temporary bootstrap-only protection,
publishes the first accepted artifact, finalizes publisher-only R13 protection,
then configures HTTPS Pages delivery and confirms token
revocation before returning. The owner verifies the public actor boundary
through the read-only checklist, while the App and used key retain the ability
to mint a fresh stop-scoped token through the live RC checks. After they pass,
the product owner rotates the used key and removes contents permission in private
Organization settings, retains the provider-required Pages and repository-
administration permissions, and
verifies the R13c dormant posture through the read-only checklist before any later update or Beta
announcement. A transient public repository state contains only the neutral
`.nojekyll` placeholder, has Pages disabled, and exists solely to make GitHub Free
rulesets available. It is not a served client, completed bootstrap, accepted RC,
or rollback target. Concrete names, IDs, keys, URLs, capability
evidence, and review evidence stay outside this document. Bootstrap is a
one-time operator-authorized App transaction; its stop posture does not
create a second client configuration or runtime account dependency.

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
  cookies, storage, service worker, ongoing address synchronization, or custom
  domain. The explicitly copied complete Setup shortcut authorized by `SW-016`
  and `SW-022` is the sole address-derived initial state.
- Do not add an in-client feedback link, issue template, changelog, promotional
  panel, RC badge, Beta badge, or second legal surface.
- Do not treat a footer, repository notice, non-commercial intent, or GitHub
  Pages availability as a license or rights determination.
- Do not create a permanent asset-rights registry, named-file test catalogue, or
  runtime release validator.

### Explicit Setup shortcut

- R24. The masthead exposes one Copy action for the current Setup. It is
  unavailable before a complete applied Setup exists and whenever a required
  applied selection is incomplete.
- R25. Activating Copy writes one immutable address shortcut to the clipboard
  without changing the current browser address. The shortcut carries the three
  ordered admitted Agents, Focus, and each Agent's Mindscape, pool, W-Engine,
  refinement, four-piece and two-piece Drive Discs, Slot 4–6 main stats, and
  complete effective-substat counts. It carries no Result, target context,
  language, or viewed-Agent state.
- R26. Opening a valid current-version shortcut atomically establishes the
  complete carried Setup, bypasses initial Party Edit, recalculates Result, and
  initially views the carried Focus. A malformed, incomplete, invalid, or
  unsupported-version shortcut applies none of its fields and follows the
  ordinary empty initial Party Edit without repair, substitution, migration, or
  partial recovery.
- R27. Copy feedback is visible and announced accessibly. Copying does not add
  browser storage, file export, server-held state, application transmission, or
  ongoing URL synchronization.

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
- An organization-owned bootstrap/stop App isolates elevated repository and
  Pages authority from the steady-state path. After live RC verification its
  used key and contents permission are retired. GitHub requires the dormant App
  to retain both Pages and repository-administration permission for the fixed-
  command stop route, while the absence of an online key/token and the controller
  schema prevent that broader provider permission from becoming a routine mutation
  path. Repository
  deletion and recreation remain explicitly confirmed manual incident actions.
  A separate
  destination-only publisher App gives later releases short-lived, revocable
  contents authority without exposing the private repository or reusing the
  personally named development App.
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
  temporary permissions; GitHub Free continues to allow repository rulesets once
  the repository is public; Pages creation and deletion continue to require both
  Pages-write and repository-administration-write; and installation tokens remain short-lived and
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
