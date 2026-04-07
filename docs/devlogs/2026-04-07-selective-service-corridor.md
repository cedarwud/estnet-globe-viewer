# 2026-04-07 Selective Service Corridor

## 為什麼現在做這個

第三個 commit 已經把 canonical truth vocabulary、mock adapter 與 provider seam 建起來，但畫面仍只有 endpoints，還沒有把「目前透過衛星被服務」這件事真的畫出來。

所以第四個 commit 的目標是：

1. 補上第一版 current service corridor
2. 補上 unavailable candidate corridor，建立 active / unavailable 的對比
3. 維持 no-spaghetti 原則，不讓 scene 退化成 full constellation / all links

## 這次新增了哪些 truth

### `WorldGeometryTruth`

新增：

- 2 顆 service-relevant satellites

這一版仍刻意不提供 full constellation 或任何 unrelated satellite。

### `ServiceAvailabilityTruth`

從 `unsupported` 升級成 supported，新增：

- `currentAvailability = available`
- 一條 `available` candidate path
- 一條 `unavailable` candidate path

### `ServiceSelectionTruth`

從 `unsupported` 升級成 supported，新增：

- 一條 `activePath`
- `selectedRelayId`

但 UI wording 仍只把它描述為：

- `current service corridor`
- `current active relay path`
- `current visible relay path`

不把它改叫 route / routing decision / optimal path。

### `EventTruth`

仍然保持：

- `source = derived`
- 事件集合為空

本輪沒有 path-change cue，所以不把 `supportsDerivedEvents` 提前改成 `true`。

## 這次新增了哪些檔案

### Mock Truth

- `src/mock/mockTruthSeed.ts`
- `src/mock/mockTruthAdapter.ts`

這裡把 mock truth seed 擴充成：

- endpoint geometry
- satellite geometry
- current availability
- candidate path availability
- active path

### Scene Components

- `src/components/globe/SatelliteMarker.tsx`
- `src/components/globe/ServiceCorridorOverlay.tsx`

用途：

- `SatelliteMarker.tsx`
  - 渲染 service-relevant satellites
  - active relay 與 unavailable candidate relay 用不同強度表現
- `ServiceCorridorOverlay.tsx`
  - 渲染一條 active corridor
  - 渲染一條 unavailable candidate corridor

### Shared Geometry Helpers

- `src/lib/geo.ts`

新增 globe scene 座標 helper 與 elevated arc helper，讓 endpoint-to-satellite-to-endpoint corridor 可以以弧線方式呈現，而不是直接穿過地球。

## 目前資料流

這一版資料流仍維持單一路徑：

1. `mockTruthSeed.ts` 提供 raw mock seed
2. `mockTruthAdapter.ts` 轉成 canonical truth snapshot
3. `mockTruthProvider.ts` 透過 `getSnapshot()` 暴露 snapshot
4. `App.tsx` 同時把 snapshot 傳給 scene 與 sidebar UI
5. `HeroGlobeScene` / `HeroGlobe` / `ServiceCorridorOverlay` 從同一份 snapshot 取：
   - endpoints
   - satellites
   - availability truth
   - selection truth

所以 scene 與 UI 仍共用同一份 canonical truth snapshot，沒有拆出第二套展示專用資料。

## 這一版如何避免變成 spaghetti

本輪只允許：

- 1 條 active corridor
- 1 條 unavailable candidate corridor
- 2 顆 service-relevant satellites

而且：

- 沒有 full constellation fallback
- 沒有 all-links 模式
- 沒有 unrelated satellite
- candidate corridor 比 active corridor 更弱、更淡

這讓 active story 仍然是畫面主角。

## 哪些內容仍刻意沒做

這次沒有加入：

- derived event cue
- replay adapter
- `estnet-bootstrap-kit` integration
- reference replay smoke
- focus lens
- hero site
- premium world content

原因是這些都屬於後續 commit，若在這裡一起做，會把第 4 個 commit 的邊界打散。

## 驗證

本次驗證要求：

- `npm run lint`
- `npm run build`
- 本地 dev server + 瀏覽器檢查

檢查重點：

- hero globe 仍正常顯示
- 只出現極少量 service-relevant satellites
- current service corridor 清楚可見
- unavailable candidate corridor 可辨識但不搶主角
- UI wording 沒有越過 truth 邊界

## 下一步

下一個 commit 應集中在：

- canonical replay adapter
- 第一批 `estnet-bootstrap-kit` reference dataset smoke

也就是 `add reference replay smoke via estnet-bootstrap-kit`。
