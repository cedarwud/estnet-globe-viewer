# Earth Asset Governance

This document is the Step 0 repo-local governance record for Earth imagery intake.

It defines what may become an approved runtime Earth asset inside `estnet-globe-viewer`, and it records the current status of Earth imagery sources without pretending that a runtime texture is already approved.

## Current Step 0 Status

- Step 0 is complete only when the repo has a clear asset approval boundary and a minimal imagery seam.
- No approved runtime Earth texture is committed in this step.
- The runtime globe must remain on the placeholder material until Step 1 approves a reviewed day-texture derivative.

## Storage Boundary

- Approved runtime Earth assets belong under `public/assets/earth/`.
- Asset governance records belong in this file.
- Helper scripts for reproducible preprocessing belong under `scripts/assets/`.
- Raw downloads, scratch conversions, and review screenshots stay outside the delivery repo.

## Intake Rules

Any Earth asset that becomes a committed runtime asset must satisfy all of these rules:

1. The source must be official and traceable.
2. The license basis must be recorded before the asset is treated as approved.
3. The download date must be recorded.
4. The preprocessing recipe must be reproducible and documented.
5. The output dimensions and format must be recorded.
6. The owning commit or intake change must be recorded.
7. The reviewer or approver must be recorded.
8. No single committed Earth runtime asset should exceed 10 MB without explicit approval.
9. The first Earth runtime asset batch should stay within a conservative repo-safe budget.
10. Source-unknown, redistribution-restricted, commercial-pack, and third-party mirror assets are rejected.

## Approved Runtime Manifest

No approved runtime Earth assets are committed as of Step 0.

| asset id | status | output filename | source URL | source provider | license basis | download date | preprocessing steps | output dimensions | output format | owning change | reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| none | none-approved | not committed | n/a | n/a | n/a | n/a | n/a | n/a | n/a | `add earth asset governance and imagery seam` | pending |

## Pending Candidate Intake Record

This table records the currently preferred official source for the future Step 1 day baseline. Recording it here does not approve it as a runtime asset yet.

| asset id | status | output filename | source URL | source provider | license basis | download date | preprocessing steps | output dimensions | output format | owning change | reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| earth-day-nasa-blue-marble-ng | candidate-not-yet-intaked | not committed | `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/` | NASA Earth Observatory / Visible Earth | NASA imagery usage must stay consistent with `https://www.nasa.gov/nasa-brand-center/images-and-media/` | not-downloaded | pending Step 1 derivative recipe and approval | target 4096x2048 derivative | webp preferred | pending | pending |

## Attribution And Provenance Notes

### Candidate Day Baseline

- Candidate source: NASA Blue Marble: Next Generation base map
- Source page: `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/`
- Usage boundary: NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`
- Runtime status in this repo: not downloaded, not preprocessed, not approved, not committed

### Deferred Follow-ons

- NASA Black Marble night lights remain a later Step 2 candidate, not a Step 0 or Step 1 runtime asset.
- Natural Earth may be considered later only for helper masks or support textures, not as the final main day albedo.

## Preprocessing Record

No Earth asset preprocessing has been run in Step 0 because no runtime Earth texture is being committed yet.

When Step 1 begins, record the exact derivative recipe here before the output is treated as approved. At minimum, capture:

1. original download location outside the repo
2. source filename or archive member
3. resize or crop command
4. format conversion command
5. output filename under `public/assets/earth/`
6. resulting dimensions
7. resulting file size

## Step Boundary Reminder

This document exists so that Step 1 can add a recognizable Earth baseline without blurring approval state.

Step 0 means:

- governance exists
- the imagery seam exists
- the placeholder globe remains honest

Step 1 will begin only when an approved runtime day texture derivative is actually intaked, documented, and wired into the scene.
