---
id: ACR-2026-09-03-001
date: 2026-09-03
status: accepted
supersedes: none
superseded_by: none
---

# Normalize Agent portrait presentation sources before optical calibration

## One decision

Require every consumed Agent portrait to use one normalized transparent
presentation source before the shared three-input optical calibration, with the
named Agent as the compact identity priority and an identity-defining companion
preserved in expanded presentation.

## Context

The workbench currently asks `scale`, `headTopY`, and `faceX` to absorb both
source-canvas irregularities and final optical calibration. The written order is
precise, but repeated portrait work has still completed with inconsistent scale
or registration. Existing metadata may itself have been authored from the wrong
visual anchor or accepted against only part of the required destination set.

The current roster also contains compositions that a single unconstrained source
canvas makes unusually difficult to compare. Aria contains a primary figure and
a companion, Remielle uses an extremely wide composition, and Sigrid uses a tall
composition dominated by an extended weapon. These are not rare CSS offsets;
they expose an unstable boundary between source preparation and rendered optical
calibration.

## Existing rule

- Owning Rule IDs: `UI-003`
- Conflict: the current rule gives an arbitrary source asset exactly three normalized
  portrait inputs and says the current square crop does not become an image-
  pipeline requirement. It also correctly rejects transparent bounds, full
  silhouette mass, and detached props as identity anchors. It does not decide
  whether a consumed source must first use a common presentation canvas, where
  coarse source composition ends and fine runtime calibration begins, or which
  figure has priority when one Agent identity contains multiple figures. The
  three inputs can therefore compensate for incompatible source geometry, and a
  square canvas or alpha trim can be mistaken for a completed optical decision.

## Proposed change

The locally consumed Agent artwork first becomes one normalized transparent
presentation source with common canvas geometry. Source preparation establishes
only a coarse, comparable identity composition. It preserves aspect ratio and
uses the named Agent's face and connected upper-body mass as the optical anchor;
transparent bounds, full-body extent, detached props, weapons, wings, tails, and
other extended forms remain clipping or dominance constraints rather than scale
or centering anchors. Automatic alpha trimming, bounding-box fitting, stretching,
and full-silhouette fitting do not satisfy this requirement.

The same normalized presentation source continues across compact and expanded
states. For a multi-figure identity, compact presentation prioritizes immediate
recognition of the named primary Agent and may crop the companion. Expanded
presentation preserves the primary Agent while keeping an identity-defining
companion recognizable. A companion does not force the compact primary figure
to become materially smaller.

After source preparation, `scale`, `headTopY`, and `faceX` remain the only
Agent-specific runtime portrait inputs and retain the current fixed authoring
order. They perform fine optical calibration across the shared destination
frames rather than repairing arbitrary canvas dimensions or aspect ratios. A
current metadata value has no presumptive authority: acceptance rests on the
original-source comparison and all required rendered destinations.

This rule establishes neither automatic portrait generation nor a separate
compact asset. It does not make source pixel dimensions, alpha bounds, or one
silhouette template into a visual-equivalence test.

## Evidence

- `src/assets/agents/portraits/` currently contains 58 RGBA WebP files. Fifty-
  four use a `2048x2048` canvas, while Norma, Pyrois, Remielle, and Sigrid use
  materially different source dimensions and aspect ratios. Canvas dimensions
  are therefore not currently a shared input invariant.
- `src/assets/agents/portraits/aria.webp` already uses a square transparent
  canvas but contains two connected identity figures. It demonstrates that a
  common pixel size alone cannot decide optical focus or compact readability.
- `src/assets/agents/portraits/remielle.webp` uses a wide `2128x1324` canvas and
  its non-transparent content reaches every canvas edge. Removing transparent
  margins would not normalize the composition or make the primary face
  comparable with an ordinary portrait.
- `src/assets/agents/portraits/sigrid.webp` uses a tall `1816x2524` canvas whose
  extended weapon constrains clipping but should not determine perceived Agent
  scale.
- `docs/workbench-ui-design-rules.md` (`UI-003`) already establishes the optical
  identity cluster, rejects alpha bounds and detached forms as anchors, fixes
  the `scale -> headTopY -> faceX` order, and requires desktop and narrow,
  expanded and compact rendered comparison. The proposed change preserves
  those meanings and adds the missing source-preparation boundary.
- `src/components/agentPortraits.ts` records the same three inputs for every
  Agent, including source values spanning materially different ranges. Their
  presence proves structural wiring but not that the current values were
  optically measured or remain acceptable.
- `tests/visual/workbench-portraits.spec.ts` exercises the four shared
  destinations but manually enumerates only a subset of the admitted roster.
  Current regression coverage can therefore pass without proving that every
  existing portrait has completed the same acceptance pass.

## Nearest current consumer

`AGENT_PORTRAITS` and `portraitSourceStyle` in
`src/components/agentPortraits.ts`, consumed by `PortraitArt` in
`src/components/PartyWorkbench.tsx` and by the Party Editor, are the nearest
current mechanism. They already retain one artwork identity and one shared set
of source variables across responsive portrait surfaces. The many existing
`2048x2048` transparent assets are the nearest similar source case because they
already behave like presentation canvases before the common CSS frames apply,
although their optical calibration still requires reinspection rather than
presumed acceptance.

## Contrast

Aria prevents the proposed common canvas from becoming a mechanical square-
conversion rule: the source is already square, yet its primary and companion
figures still require a focal hierarchy. Remielle supplies the opposite aspect-
ratio case: its wide wings reach the canvas edges, so alpha trimming changes
nothing and full-silhouette fitting would make the primary identity too small.
Together they disprove both automatic transparent-bound trimming and automatic
fit-all-visible-content normalization while supporting a common presentation-
source boundary.

Drive Disc assets are an additional presentation contrast rather than a model
for Agent normalization. A Disc's bounded object silhouette can determine
comparable perceived object weight. Agent art contains poses, companions, and
extended forms that `UI-003` already excludes as identity anchors.

## Impact

- Permanent owners affected: `docs/workbench-ui-design-rules.md` (`UI-003`).
- Supporting requirements affected: the accepted ZZZ-style and integrated-slot
  direction, later Agent portrait acceptance requirements, and the bounded
  requirement for a full current-roster portrait re-audit after the common
  destination frames stabilize.
- Production and tests affected: none in this ACR. Later bounded work may update
  only failed portrait presentation assets and metadata, preserve passing
  assets, and make changed or newly admitted portraits impossible to omit from
  the required four-destination visual acceptance path.
- Visible Setup or Result consequence: Setup and Result meaning do not change.
  Compact identity gives the named Agent immediate visual priority; expanded
  identity preserves that Agent and any identity-defining companion at a
  comparable perceived scale without allowing extreme canvas geometry to
  dominate or shrink the workbench identity surface.

This is an impact inventory, not permission to edit those artifacts in this PR.

## Approval result

- Product owner: `Min-DongYoung`
- Result: `accepted`
- Decided at: `2026-09-03T00:57:41.5089932+09:00`
