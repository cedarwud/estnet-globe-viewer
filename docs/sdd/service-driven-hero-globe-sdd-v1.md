# Service-Driven Hero Globe SDD v1

## 0. Status

- Status: Active kickoff SDD for the new globe-first delivery line
- Intended repo name: `estnet-globe-viewer`
- Local supporting context:
  - [../architecture.md](../architecture.md)
  - [../phases/phase-00-repo-init.md](../phases/phase-00-repo-init.md)

This document defines the first executable SDD surface for the project. It is the authority for:

- repo identity
- V1 product claim
- truth / capability / wording boundary
- provider seam
- reference producer strategy
- first implementation slice

## 1. Project Identity And Delivery Boundary

### 1.1 Project Identity

- Repo / folder name: `estnet-globe-viewer`
- Product direction name: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`

### 1.2 Delivery Boundary

`estnet-globe-viewer` is a deliverable repo. It must not quietly absorb workspace-internal governance or scratch material.

Must stay out of the repo by default:

- `AGENTS.md`
- agent prompt packs
- reviewer scratch notes
- one-off export/debug artifacts
- local environment notes
- workspace-only continuity files

### 1.3 Repo Hygiene

The repo must establish `.gitignore` early enough to keep transient or internal-only files out of the shipped surface.

The repo must also maintain:

- a clear README entry path
- a clear `docs/` authority path
- explicit archive handling for stale drafts
- meaningful commit messages
- phase-sized commits instead of mixed-purpose dumps

## 2. Product Claim

Within roughly 10 seconds, the viewer must let a reviewer understand:

1. there are two distant endpoints on the globe;
2. service is currently being provided through a satellite-mediated corridor;
3. active / unavailable differences are visible without reading a dashboard;
4. the globe is the primary stage, not a background behind panels.

## 3. Non-Goals

V1 does not attempt to deliver:

- KPI dashboard as the primary interface
- full routing-policy explanation
- handover-cause truth unless a producer explicitly provides it
- SLA-facing latency / throughput / jitter claims
- quality field / coverage field as the main presentation model
- dual lens / dual portal / split-screen primary layout
- hero site GLB transition
- premium photogrammetry deep zoom

## 4. Presentation Model

### 4.1 Primary Stage

`HeroGlobeScene` is the only primary stage.

It must carry:

- endpoint anchors
- selective satellite context
- service corridor
- active / unavailable contrast

### 4.2 Visual Grammar

The main visual grammar is:

- selective service corridor
- active relay emphasis
- candidate context with strict limits
- beam / pulse / halo as supporting accent only

The viewer must never treat "show more lines" as a substitute for clarity.

### 4.3 Focus Lens Rule

`FocusLensScene` is not V1 core. It is a Phase 2 follow-on interface.

When introduced, it must obey:

- single lens only
- on-demand only
- not always-on
- not a second co-equal primary stage
- not dual portal
- not permanent split-screen

### 4.4 Event Layer Rule

Event cues and camera choreography are secondary explanatory layers. They may strengthen readability, but they must not replace the steady-state product model.

## 5. Scene Decomposition

The SDD freezes the following scene decomposition:

- `HeroGlobeScene`
- `ServiceCorridorOverlay`
- `FocusLensScene` (reserved for follow-on, not required for V1 completion)

Presentation / selection state such as focused endpoint, lens open/closed, camera mode, or current comparison target belongs to scene-layer state. It is not `EventTruth`.

## 6. Canonical Truth Model

The canonical truth vocabulary is:

- `WorldGeometryTruth`
- `ServiceAvailabilityTruth`
- `ServiceSelectionTruth`
- `EventTruth`
- `DatasetCapabilityProfile`

### 6.1 WorldGeometryTruth

Contains geometry that the viewer may safely place on the globe:

- endpoint global positions
- satellite global positions
- optional altitude / geometry metadata

### 6.2 ServiceAvailabilityTruth

Contains availability-level truth such as:

- whether service is available
- candidate path availability
- availability envelope inputs where supported

### 6.3 ServiceSelectionTruth

Contains selection-level truth such as:

- optional `activePath`
- optional selected relay / selected path identity

Until stronger producer truth exists, `activePath` must be described conservatively as:

- `current service corridor`
- `current active relay path`
- `current visible relay path`

It must not be relabeled as:

- `network route`
- `routing decision`
- `optimal path`

### 6.4 EventTruth

In V1, `EventTruth` only contains viewer-side derived events, such as path-change cues inferred from `activePath` frame diff.

Requirements:

- these events must be labeled `derived`
- they must not claim true handover cause
- producer-backed events are Phase 6 follow-on, not V1 baseline truth

### 6.5 DatasetCapabilityProfile

At minimum, the capability profile must define:

- `supportsGlobalPositions`
- `supportsPathAvailability`
- `supportsActivePath`
- `supportsDerivedEvents`
- `supportsProducerEvents`
- `supportsContext3DTilesHints`
- `supportsSiteAssetAnchors`

## 7. Truth Insufficiency Rules

If truth is missing, the viewer may degrade, but it must not pretend the truth exists.

Rules:

- if `supportsActivePath = false`, do not draw active service corridor
- instead show only `candidate corridor` or `availability envelope`
- if `supportsProducerEvents = false`, derived event cues are allowed but must be labeled `derived`
- if quality truth is absent, do not show authoritative SLA-like numbers
- if site anchors are absent, keep the hero site module disabled without blocking the globe flow

## 8. Provider Seams

The provider seam is frozen as:

- `TruthProvider`
- `ImageryProvider`
- `TerrainProvider`
- `Context3DTilesProvider`
- `SiteAssetProvider`

Responsibilities:

- `TruthProvider`
  - replay / truth / event / capability
- `ImageryProvider`
  - globe imagery
- `TerrainProvider`
  - height / terrain mesh
- `Context3DTilesProvider`
  - buildings / photogrammetry / world context tiles
- `SiteAssetProvider`
  - hero site GLB / site-local assets

This split exists so that:

- offline / API can switch partially rather than monolithically
- the globe can start with imagery-only or imagery + light terrain
- premium world context and hero site remain independent add-ons

## 9. No-Spaghetti Rules

The viewer must explicitly limit scene clutter.

Minimum rules:

- only service-relevant satellites should be foreground-visible
- active corridor is primary; candidate context is secondary and numerically limited
- inactive or unrelated links must fade or remain hidden
- no "show full constellation + all links" fallback is allowed as the default globe mode

The exact numeric thresholds should be defined in implementation, but the intent is fixed:

- clarity beats completeness

## 10. Reference Producer Strategy

`estnet-bootstrap-kit` is the first `ReferenceReplayTruthProvider`, not the permanent authority producer.

Rules:

- the first commit of `estnet-globe-viewer` must stand alone without any external producer
- the minimum offline hero globe shell must be built before real producer integration
- integration with `estnet-bootstrap-kit` begins only after canonical truth boundaries are in place
- viewer core must not depend on bootstrap-kit branch names, exporter internals, folder layout, or viewer-specific scenario naming

## 11. Branching And Milestone Strategy

Recommended early approach:

- keep validated baseline work on `main`
- let the first repo-init commit land on `main`
- let early low-risk baseline work also land on `main`
- use meaningful commits, SDD updates, and devlog checkpoints to mark phase boundaries
- open a feature branch only when risk isolation is needed

Typical branch triggers:

- risky integration
- engine/runtime experiment
- parallel implementation
- temporary reference-producer smoke isolation

## 12. First Implementation Slice

Slice name:

- `offline-hero-globe-canonical-replay-baseline`

### 12.1 Must Do

- initialize `estnet-globe-viewer`
- establish `.gitignore` and delivery hygiene baseline
- create offline hero globe shell
- add endpoint anchors
- add minimal camera / orbit / zoom
- define canonical truth interfaces
- define `DatasetCapabilityProfile`
- add selective satellite visibility baseline
- add selective service corridor baseline
- add active / unavailable visual distinction
- add minimal derived event cue
- add provider skeletons

### 12.2 May Use Placeholder

- low/mid-resolution imagery
- no-terrain or very-light terrain
- simple satellite geometry
- simple beam / pulse accents
- mock truth provider

### 12.3 Must Not Include

- dual lens UX
- premium API world content
- producer event truth
- hero site module
- KPI / SLA-facing panel claims
- truth-heavy coverage / quality field

## 13. First External Data Integration

The first real external data integration should occur only after the offline shell and canonical truth model exist.

Recommended sequence:

1. repo init
2. offline hero globe shell
3. canonical truth interfaces + mock truth path
4. canonical replay adapter
5. first `estnet-bootstrap-kit` reference dataset smoke

This means `estnet-bootstrap-kit` is needed early, but not at commit zero.

## 14. Acceptance Criteria For V1 Baseline

The first baseline is acceptable when:

- a reviewer can understand the two endpoints as the main actors within roughly 10 seconds
- active / unavailable difference is visible
- the active corridor is understandable without reading a dashboard
- the globe does not devolve into spaghetti
- switching future world-content providers does not require rewriting replay / truth / service logic

## 15. Documentation And Archive Rules

The repo should maintain a clear distinction between:

- authority SDDs
- README / delivery docs
- phase records
- devlogs
- archived or stale documents

When a draft or interim plan stops being active authority, it should move to `archive/` rather than remain mixed with live docs.
