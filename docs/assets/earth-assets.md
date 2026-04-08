# Earth Asset Governance

This document is the repo-local governance record for Earth imagery intake.

It defines what may become an approved runtime Earth asset inside `estnet-globe-viewer`, and it records the approved Step 1 day derivative plus the approved Step 2 night derivative.

## Current Step 4 Status

- Step 0 established the governance boundary and minimal imagery seam.
- Step 1 promoted one approved NASA Blue Marble day derivative into the runtime baseline.
- Step 2 keeps that day baseline, adds an approved NASA Black Marble night derivative, and promotes a formal day-night Earth shader v1.
- Step 4 adds a restrained procedural atmosphere shell without introducing another runtime asset.
- Approved runtime filenames:
  - `public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp`
  - `public/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp`
- The scene now uses a controlled day-night Earth surface plus a restrained atmosphere shell on the main path.
- Step 1 day-only fallback and placeholder fallback still exist, but they are explicit guards instead of the intended success path.
- No cloud runtime asset is currently approved. Cloud shell remains intentionally deferred until a formal intake record exists.

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

| asset id | status | output filename | source URL | source provider | license basis | download date | preprocessing steps | output dimensions | output format | owning change | reviewer / approver |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| earth-day-nasa-blue-marble-ng-4096x2048-webp | approved-runtime | `public/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp` | `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg` | NASA Earth Observatory / NASA Science | NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`; NASA should be acknowledged as the source of the material | 2026-04-08 | download official JPEG, resize to `4096x2048`, compress to WebP via `scripts/assets/preprocess-earth-day-texture.py` | `4096x2048` | `webp` | `reset offline earth appearance foundation` | Step 1 authority-aligned runtime intake (2026-04-08) |
| earth-night-nasa-black-marble-2016-4096x2048-webp | approved-runtime | `public/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp` | `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg` | NASA Earth Observatory / NASA Science / Black Marble 2016 | NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`; NASA should be acknowledged as the source of the material | 2026-04-08 | download official JPEG, resize to `4096x2048`, compress to WebP via `scripts/assets/preprocess-earth-night-texture.py` | `4096x2048` | `webp` | `add day-night earth shader baseline` | Step 2 authority-aligned runtime intake (2026-04-08) |

## Attribution And Provenance Notes

### Day Baseline

- Approved source family: NASA Blue Marble: Next Generation base map
- Source page: `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/`
- Direct source file: `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg`
- Usage boundary: NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`
- Runtime status in this repo: downloaded, preprocessed, approved for Step 1, committed as a runtime derivative

### Night Baseline

- Approved source family: NASA Earth at Night / Black Marble flat maps
- Source page: `https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/`
- Direct source file: `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg`
- Source credit boundary: Black Marble 2016 flat maps on the source page attribute the imagery to NASA Earth Observatory with Suomi NPP VIIRS data from NASA GSFC
- Usage boundary: NASA images and media usage guidance at `https://www.nasa.gov/nasa-brand-center/images-and-media/`
- Runtime status in this repo: downloaded, preprocessed, approved for Step 2, committed as a runtime derivative

### Deferred Follow-ons

- Cloud shell and bloom remain follow-on surfaces, not part of the current approved runtime asset intake.
- Step 4 atmosphere is procedural and therefore does not add a new governed runtime texture file.
- Natural Earth may still be considered later only for helper masks or support textures, not as the final main day albedo.

## Preprocessing Record

### Step 1 Day Derivative

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

### Step 2 Night Derivative

The approved Step 2 runtime derivative was built with the following reproducible flow:

1. Download source JPEG outside the repo:
   - `curl -L -o /tmp/estnet-earth-night-source-direct.jpg https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg`
2. Run the committed preprocessing helper:
   - `python3 scripts/assets/preprocess-earth-night-texture.py --source /tmp/estnet-earth-night-source-direct.jpg --output public/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp --width 4096 --height 2048 --quality 88`
3. Result:
   - output file: `public/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp`
   - dimensions: `4096x2048`
   - size: `353326` bytes
   - sha256: `f3a163932526c589670e7869b162b8d59d6f6dd6364abf48cf46e9cd5eec785e`

This keeps the repo on compressed runtime derivatives instead of raw masters.

## Step Boundary Reminder

This document exists so that Earth appearance can evolve without blurring approval state.

Step 0 meant:

- governance exists
- the imagery seam exists
- the placeholder globe remains honest

Step 1 meant:

- one approved runtime day derivative is committed
- the imagery seam returns `approved-runtime`
- the globe is recognizable at a glance
- dark-side treatment is still intentionally deferred to Step 2

Step 2 now means:

- an approved runtime night derivative is also committed
- the imagery seam carries both day and night runtime asset identifiers
- the globe uses a formal day-night shader v1 with explicit `sunDirection` control
- twilight handling and dark-side readability are solved by controlled texture mixing, not by global fill light
- clouds, atmosphere, and bloom remain intentionally deferred beyond this step

Step 4 now means:

- the globe keeps the approved Step 1/2 day-night runtime asset set
- atmosphere is added as a restrained procedural shell, not as a new runtime texture claim
- no cloud shell is introduced unless a formal, approved cloud runtime asset intake is recorded first
