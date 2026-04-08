# Earth Asset Governance

This document is the repo-local governance record for Earth imagery intake.

It defines what may become an approved runtime Earth asset inside `estnet-globe-viewer`, and it records the current approved Step 1 runtime derivative.

## Current Step 1 Status

- Step 0 already established the governance boundary and minimal imagery seam.
- Step 1 promotes one approved NASA Blue Marble day derivative into the runtime baseline.
- Approved runtime filename: `public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp`
- The scene now uses a texture-backed Earth surface on the main path.
- Placeholder fallback remains only as a runtime guard if the approved texture set cannot load.

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

| asset id | status | output filename | source URL | source provider | license basis | download date | preprocessing steps | output dimensions | output format | owning change | reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| earth-day-nasa-blue-marble-ng-4096x2048-webp | approved-runtime | `public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp` | `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg` | NASA Earth Observatory / NASA Science | NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`; NASA should be acknowledged as the source of the material | 2026-04-08 | download official JPEG, resize to `4096x2048`, compress to WebP via `scripts/assets/preprocess-earth-day-texture.py` | `4096x2048` | `webp` | `reset offline earth appearance foundation` | Step 1 authority-aligned runtime intake (2026-04-08) |

## Attribution And Provenance Notes

### Candidate Day Baseline

- Approved source family: NASA Blue Marble: Next Generation base map
- Source page: `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/`
- Direct source file: `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg`
- Usage boundary: NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`
- Runtime status in this repo: downloaded, preprocessed, approved for Step 1, committed as a runtime derivative

### Deferred Follow-ons

- NASA Black Marble night lights remain a later Step 2 candidate, not a Step 0 or Step 1 runtime asset.
- Natural Earth may be considered later only for helper masks or support textures, not as the final main day albedo.

## Preprocessing Record

The approved Step 1 runtime derivative was built with the following reproducible flow:

1. Download source JPEG outside the repo:
   - `curl -L -o /tmp/estnet-earth-day-source-direct.jpg https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg`
2. Run the committed preprocessing helper:
   - `python3 scripts/assets/preprocess-earth-day-texture.py --source /tmp/estnet-earth-day-source-direct.jpg --output public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp --width 4096 --height 2048 --quality 88`
3. Result:
   - output file: `public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp`
   - dimensions: `4096x2048`
   - size: `714108` bytes
   - sha256: `b606b5ba7a577e9e361fecb8b4e6e9399a642fbb8cb81f354a5a9692cb7f2f72`

This keeps the repo on a compressed runtime derivative instead of a raw master.

## Step Boundary Reminder

This document exists so that Earth appearance can evolve without blurring approval state.

Step 0 meant:

- governance exists
- the imagery seam exists
- the placeholder globe remains honest

Step 1 now means:

- one approved runtime day derivative is committed
- the imagery seam returns `approved-runtime`
- the globe is recognizable at a glance
- dark-side treatment is still intentionally deferred to Step 2
