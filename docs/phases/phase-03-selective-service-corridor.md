# Phase 03 Selective Service Corridor

## Status

- Status: completed as the fourth baseline commit
- Commit message target: `add selective service corridor baseline`

## Phase Goal

在既有 canonical truth + mock truth path 基礎上，補上第一版 selective service corridor baseline，讓 reviewer 已能直接看出：

1. 兩個遠距 endpoints
2. 一條 current service corridor
3. 一條 unavailable candidate corridor
4. active / unavailable 的第一版可視差異

## In Scope

- 擴充 mock truth path，加入最小 satellite geometry
- 擴充 `ServiceAvailabilityTruth`
- 擴充 `ServiceSelectionTruth`
- 只渲染極少量 service-relevant satellites
- 加入一條 active corridor 與一條 unavailable candidate corridor
- 保持 `EventTruth` 為 derived-only surface，且目前仍為空集合

## Explicitly Out Of Scope

- `estnet-bootstrap-kit` integration
- canonical replay adapter
- reference replay smoke
- focus lens
- hero site
- premium world content / 3D tiles / site assets
- KPI dashboard
- producer-backed event truth

## Deliverables

- `src/mock/mockTruthSeed.ts`
- `src/mock/mockTruthAdapter.ts`
- `src/components/globe/SatelliteMarker.tsx`
- `src/components/globe/ServiceCorridorOverlay.tsx`
- `src/components/globe/HeroGlobe.tsx`
- `src/components/globe/HeroGlobeScene.tsx`
- `src/App.tsx`
- README / docs / devlog 更新

## Capability Flags

本輪只有在真有 truth 時才更新 capability flags：

- `supportsGlobalPositions = true`
  - 已有 endpoint 與 satellite global positions
- `supportsPathAvailability = true`
  - 已提供當前 availability 與 candidate path availability
- `supportsActivePath = true`
  - 已提供一條 activePath
- `supportsDerivedEvents = false`
  - 本輪沒有真正提供 derived event cue

其餘 capability 仍保持 `false`。

## No-Spaghetti Rule In This Baseline

這一版刻意限制為：

- 1 條 active corridor
- 1 條 unavailable candidate corridor
- 2 顆 service-relevant satellites
- 不提供 full constellation fallback

也就是說，場景是先保 clarity，再談 completeness。

## Validation

- `npm run lint`
- `npm run build`
- 本地 dev server 畫面檢查

## Next Commit

下一個 commit 應是：

- `add reference replay smoke via estnet-bootstrap-kit`

它才開始接 canonical replay adapter 與第一批 reference dataset smoke，並維持 viewer core 對 bootstrap-kit 的低耦合。
