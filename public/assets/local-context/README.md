# Offline Local Context Assets

This folder stores bounded offline AOI context assets for `estnet-globe-viewer`.

## Endpoint Alpha Official Place Context v1

- Output file: `endpoint-alpha-taipei-official-place-context-v1.json`
- Purpose: add reviewer-visible AOI-local place context without changing the globe-home posture or adding any runtime API dependency
- Runtime policy: this JSON is lazy-loaded only after the app enters the Endpoint Alpha local route

## Accepted Sources

1. `臺北市建築執照套繪圖`
   - Dataset page: `https://data.taipei/dataset/detail?id=af4281e7-ae72-4f8f-9a14-65b6f8d4b9ed`
   - Direct resource download:
     `https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=ccdfe8df-ef54-4c13-a93d-ba42968ced3b`
   - Publisher: Taipei City Government
   - License / terms: Taipei City Government Open Data License
   - License page: `https://data.taipei/rule`

2. `臺北市標線型人行道`
   - Dataset page: `https://data.taipei/dataset/detail?id=d647b3af-4bbd-4e8f-b420-8f6c1bc1b597`
   - Direct resource download:
     `https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=2d82d5f1-8f97-45db-89df-162ba161dedb`
   - Publisher: Taipei City Government
   - License / terms: Taipei City Government Open Data License
   - License page: `https://data.taipei/rule`

## Evaluated But Not Kept

1. `臺北市道路寬度`
   - Dataset page: `https://data.taipei/dataset/detail?id=068be2c7-eea1-4303-91f8-fbf50c9b2aec`
   - It was downloaded and inspected during this slice.
   - It was not integrated because the geometry behaved like width-annotation segments instead of a strong AOI-local street-network uplift, so it did not produce a better baseline than the accepted building + sidewalk combination.

## Rebuild

1. Download the accepted source zips into `/tmp` and unzip them.
2. Run:

```bash
node scripts/assets/build-endpoint-alpha-official-place-context.mjs
```

The script expects extracted shapefiles under:

- `/tmp/taipei-buildings/`
- `/tmp/taipei-sidewalks/`

Override with:

- `TAIPEI_BUILDINGS_DIR`
- `TAIPEI_SIDEWALKS_DIR`

## Scope Guard

This asset pack is intentionally bounded:

1. one AOI only
2. offline local mode only
3. no globe-home eager load
4. no runtime provider migration
