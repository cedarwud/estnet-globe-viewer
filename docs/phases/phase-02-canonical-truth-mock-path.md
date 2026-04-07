# Phase 02 Canonical Truth Mock Path

## Status

- Status: completed as the third baseline commit
- Commit message target: `add canonical truth interfaces and mock truth path`

## Phase Goal

把第二個 commit 的 offline hero globe shell 從「直接讀死 placeholder UI data」提升為「透過 single canonical truth snapshot 驅動」。

這個 phase 的重點不是開始畫 service corridor，而是先把 truth vocabulary、provider seam、mock adapter 與資料流邊界凍結好。

## In Scope

- 定義 canonical truth contracts
- 定義 `TruthProvider` 的最小同步 seam
- 建立 mock truth seed / adapter / provider
- 讓 scene 與 UI 都共用同一份 mock truth snapshot
- 明確把 unsupported truth 標出來，不假裝 availability / activePath / events 已存在

## Explicitly Out Of Scope

- `estnet-bootstrap-kit` integration
- replay adapter
- service corridor baseline
- active / unavailable 最終視覺語法
- selective satellite visibility
- reference replay smoke
- producer-backed events

## Deliverables

- `src/truth/contracts.ts`
- `src/truth/provider.ts`
- `src/truth/useTruthSnapshot.ts`
- `src/mock/mockTruthSeed.ts`
- `src/mock/mockTruthAdapter.ts`
- `src/mock/mockTruthProvider.ts`
- `src/App.tsx` 與 globe components 更新
- README / docs / devlog 更新

## Canonical Truth Split

### `WorldGeometryTruth`

目前只提供：

- endpoint global positions
- endpoint labels / region labels
- endpoint accent colors

satellite geometry 仍保留為空集合。

### `ServiceAvailabilityTruth`

目前明確標記為 `unsupported`，因為本輪沒有 path availability truth。

### `ServiceSelectionTruth`

目前明確標記為 `unsupported`，因為本輪沒有 `activePath` 或 selected relay truth。

### `EventTruth`

目前保留為 `derived` 型別，但事件集合為空。這可避免未來 producer-backed event truth 和 viewer-derived event truth 混在一起。

### `DatasetCapabilityProfile`

目前只有 `supportsGlobalPositions = true`。其餘能力預設為 `false`，因為本輪不假裝資料已存在。

## Validation

- `npm run lint`
- `npm run build`
- 本地 dev server 畫面檢查，確認 scene 與 UI 都由 mock truth path 讀值

## Next Commit

下一個 commit 應是：

- `add selective service corridor baseline`

它才開始補 selective satellite visibility、service corridor、active / unavailable baseline 與最小 derived event cue，但仍先不接 `estnet-bootstrap-kit`。
