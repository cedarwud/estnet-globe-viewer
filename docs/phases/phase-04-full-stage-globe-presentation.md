# Phase 04 Full-Stage Globe Presentation

## Status

- Status: completed as the fifth baseline commit
- Commit message target: `refine full-stage globe shell and overlay presentation`

## Phase Goal

修正第 4 個 commit 之後仍然偏向 dashboard 的 presentation shell，讓 reviewer 一打開畫面就先看到：

1. 完整地球是唯一主舞台
2. 兩個遠距 endpoints
3. 目前的 current service corridor
4. active / unavailable 的最小差異提示

## In Scope

- 把 globe 改成 full-stage / full-browser primary scene
- 調整 camera / controls，讓完整地球 framing 與 corridor inspection 都自然可用
- 把長側欄收斂成 compact HUD + on-demand details drawer
- 保留 mock truth path 與 selective service corridor baseline
- 保持 scene 與 overlay 共用同一份 canonical truth snapshot

## Explicitly Out Of Scope

- `estnet-bootstrap-kit` integration
- reference replay smoke
- truth contract 重命名或 provider framework 擴張
- focus lens
- hero site
- premium world content / 3D tiles / terrain / site assets
- KPI dashboard
- producer-backed event truth

## Deliverables

- `src/App.tsx`
- `src/components/globe/HeroGlobeScene.tsx`
- `src/styles/main.css`
- README / docs / devlog 更新

## Presentation Corrections

本輪修正的核心問題是：

1. globe 不再被包在 stage card 裡
2. 右側長側欄改成可收合的 details drawer
3. 畫面長時間只保留：
   - current availability
   - current visible relay path
   - active / unavailable legend
4. 使用者可用滑鼠從完整地球一路縮放到較近的 corridor 視角

## Why `estnet-bootstrap-kit` Is Delayed

這一輪刻意暫停 `estnet-bootstrap-kit` integration，原因不是方向改變，而是先把 globe-first presentation 站穩。

若在 shell、framing、overlay hierarchy 還沒修正前就接 reference replay，viewer 很容易被暫時的 producer surface 帶回 dashboard 或 data-first layout。

## Validation

- `npm run lint`
- `npm run build`
- 本地 dev server + Playwright 畫面檢查

## Next Commit

下一個 commit 不預設直接開始資料整合；只有在這一版 presentation 被接受後，才建議進下一個候選 commit：

- `add reference replay smoke via estnet-bootstrap-kit`
