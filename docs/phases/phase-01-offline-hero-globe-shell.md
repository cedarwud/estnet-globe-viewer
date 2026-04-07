# Phase 01 Offline Hero Globe Shell

## Status

- Status: completed as the second baseline commit
- Commit message target: `add offline hero globe shell baseline`

## Phase Goal

在不依賴任何外部 producer 的前提下，先把 `HeroGlobeScene` 主舞台建立起來，讓 repo 從純文件骨架進入可執行 viewer baseline。

這個 phase 的目標不是 service truth integration，而是先證明：

1. globe-first 主舞台可以獨立成立
2. reviewer 已能看到兩個遠距 endpoint anchors
3. camera / orbit / zoom baseline 已具備

## In Scope

- 建立 frontend runtime baseline
- 建立 app shell 與基本閱讀型 side panel
- 建立 `HeroGlobeScene`
- 建立最小 earth sphere、atmosphere、graticule
- 建立 orbit / zoom camera baseline
- 建立兩個 placeholder endpoint anchors

## Explicitly Out Of Scope

- canonical truth interfaces
- `DatasetCapabilityProfile`
- service corridor
- active / unavailable distinction
- selective satellite visibility
- derived event cue
- provider skeletons
- `estnet-bootstrap-kit` integration

## Deliverables

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/` runtime baseline
- README / docs 更新

## Why This Phase Stops Here

這個 phase 故意不跨到 replay/truth contract，原因是 commit 邊界要保持清楚：

1. `repo init` 解的是 repo 邊界與正式文件入口
2. `offline hero globe shell` 解的是主舞台是否能獨立站起來
3. `canonical truth interfaces` 應是下一個明確 commit，而不是混在同一包

## Validation

- `npm install`
- `npm run build`
- `npm run lint`

這個 baseline 應可在本地啟動為一個不依賴外部 producer 的最小 globe shell。

## Next Commit

下一個 commit 應是：

- `add canonical truth interfaces and mock truth path`

它要把 truth vocabulary 與 mock provider seam 建起來，但仍先不做外部 producer smoke。
