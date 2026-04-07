# 2026-04-07 Canonical Truth Mock Path

## 為什麼現在做這個

第二個 commit 只證明 hero globe 主舞台可以獨立站起來，但當時 scene 與 UI 仍直接讀 placeholder data。若不先補 canonical truth vocabulary 與 provider seam，下一步做 corridor baseline 時就會開始把展示邏輯和資料來源硬綁在一起。

所以第三個 commit 的作用是：

1. 讓 scene 與 UI 改吃同一份 canonical snapshot
2. 凍結 `truth`、`unsupported`、`derived-only` 的基礎語意
3. 先建立 mock path，而不是過早接上 reference producer

## 這次建立了哪些檔案

### Truth Contracts

- `src/truth/contracts.ts`

這裡定義：

- `WorldGeometryTruth`
- `ServiceAvailabilityTruth`
- `ServiceSelectionTruth`
- `EventTruth`
- `DatasetCapabilityProfile`
- `CanonicalTruthSnapshot`

這些型別的關鍵作用是把 globe scene 可以安全使用的 truth，和目前仍不存在的 truth 分開。

### Provider Seam

- `src/truth/provider.ts`
- `src/truth/useTruthSnapshot.ts`

這裡把 `TruthProvider` 凍結成最小同步介面：

- `providerId`
- `providerKind`
- `getSnapshot()`

目前故意不做 async loader、live bridge 或 API lifecycle。這個 commit 的責任只是先把 seam 建立好。

### Mock Path

- `src/mock/mockTruthSeed.ts`
- `src/mock/mockTruthAdapter.ts`
- `src/mock/mockTruthProvider.ts`

這三個檔案負責把原本直接給 UI 用的 placeholder 概念，轉成一條明確的 mock truth path：

1. `mockTruthSeed.ts`
   - 放原始 mock seed
2. `mockTruthAdapter.ts`
   - 把 mock seed 轉成 canonical truth snapshot
3. `mockTruthProvider.ts`
   - 透過 `TruthProvider` seam 暴露這份 snapshot

## App 和 Scene 現在怎麼取資料

目前資料流是：

1. `mockTruthSeed.ts` 提供 raw mock endpoint seed
2. `mockTruthAdapter.ts` 轉成 canonical snapshot
3. `mockTruthProvider.ts` 透過 `getSnapshot()` 暴露這份 snapshot
4. `useTruthSnapshot()` 在 `App.tsx` 中讀取 snapshot
5. `App.tsx` 把 `worldGeometry.endpoints` 傳進 `HeroGlobeScene`
6. sidebar UI 也直接從同一份 snapshot 顯示 capability / unsupported truth

這樣 scene 與 UI 已不再各自維護不同資料來源。

## 哪些 truth 目前是空或 unsupported

### `WorldGeometryTruth`

目前只有 endpoint geometry，satellites 為空集合。

### `ServiceAvailabilityTruth`

目前是 `unsupported`，原因是這一版沒有 path availability 或 availability envelope truth。

### `ServiceSelectionTruth`

目前是 `unsupported`，原因是這一版沒有 `activePath` 或 selected relay truth。

### `EventTruth`

目前是 `derived` 型別，但事件集合為空。這是刻意的，因為本輪既沒有 path diff，也沒有 producer-backed event truth。

### `DatasetCapabilityProfile`

目前只有 global positions 被標為 supported。其餘能力全部明確標為 unsupported。

## 這次刻意沒做什麼

這次沒有加入：

- service corridor
- active / unavailable rendering
- selective satellite visibility
- derived event cue logic
- replay adapter
- `estnet-bootstrap-kit` integration

原因很直接：這些都屬於下一個或後續 commit，若在這裡偷做，會讓第 3 個 commit 邊界失焦。

## 驗證

本次驗證重點是兩件事：

1. repo 仍能正常 build / lint
2. 畫面已改由 mock truth path 驅動，而不是直接讀 placeholder UI data

執行：

- `npm run lint`
- `npm run build`
- 本地 dev server + 瀏覽器檢查

檢查結果應包含：

- hero globe 仍正常顯示
- 兩個 endpoint anchors 仍可見
- side panel 顯示 capability profile
- side panel 明確標示 availability / selection / events 目前的 unsupported 或空集合狀態

## 下一步

下一個 commit 應集中在：

- selective satellite visibility
- service corridor baseline
- active / unavailable baseline
- minimal derived event cue

也就是 `add selective service corridor baseline`，但仍先不接 `estnet-bootstrap-kit`。
