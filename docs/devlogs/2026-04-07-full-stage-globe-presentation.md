# 2026-04-07 Full-Stage Globe Presentation

## 為什麼現在做這個

第 4 個 commit 已經有 current service corridor、unavailable candidate corridor、以及極少量 service-relevant satellites，但 presentation shell 仍然有三個明顯問題：

1. globe 被包在 card 內，看起來像 dashboard 中的一塊 stage
2. camera / zoom 的使用感還不夠自然，無法明確建立完整地球到 corridor 的閱讀範圍
3. 右側常駐資訊太多，畫面重心又被拉回 status panel

所以這一輪不是增加新的 truth，而是把 scene hierarchy 修回 globe-first。

## 這次主要改了哪些檔案

### `src/App.tsx`

把原本的 stage-card + sidebar 版型改成：

- 全螢幕 stage
- 左上 hero copy
- 右上 compact HUD
- 左下 current visible relay path ribbon
- 右下 legend
- 可展開的 details drawer

也就是說，詳細資訊仍然存在，但不再長時間佔住主要版面。

### `src/components/globe/HeroGlobeScene.tsx`

調整 camera / controls：

- 初始 framing 改成更適合 full-screen stage 的視角
- `minDistance` / `maxDistance` 放寬到能同時支援完整地球與較近 corridor 檢視
- 繼續禁止 pan，避免使用者把 stage 拖離主體

這裡的目標不是追求 cinematic fly-through，而是讓 reviewer 的滑鼠互動穩定、可預期。

### `src/styles/main.css`

整份改寫成新的 shell：

- `viewer-stage` 變成 full-browser scene layer
- `viewer-overlay` 只作輔助資訊層，預設不攔截 scene 互動
- `floating-card` 只保留少量高價值資訊
- `truth-drawer` 取代原本長時間常駐的 dashboard rail

這裡最重要的邊界是：overlay 是輔助層，不是主體。

## 現在的畫面如何避免再像 dashboard

目前長時間常駐在畫面上的資訊只有四塊：

1. hero copy
2. compact current-state HUD
3. current visible relay path ribbon
4. active / unavailable legend

其他細節，例如 capability profile、candidate corridors、endpoint / satellite 座標，都進入可展開 drawer。

這樣做的結果是：

- reviewer 第一眼先讀到 globe、endpoints、corridor
- 第二眼才去看 overlay
- 詳細 truth 說明仍保留，但不再壓過主舞台

## 為什麼這一輪先不接 `estnet-bootstrap-kit`

這一輪刻意暫停 reference replay smoke，因為 presentation shell 還沒完全站穩前，不適合把外部 reference surface 接進來。

若現在提早接入，很容易出現兩個問題：

1. viewer shell 反過來被 producer data shape 綁架
2. 為了配合 smoke data 而容忍不理想的 overlay / layout / framing

所以這次先把主舞台修正到位，再決定是否進入下一輪整合。

## 這一版仍刻意沒做

這次沒有新增：

- 新的 truth contract
- replay adapter
- `estnet-bootstrap-kit` integration
- derived event cue
- focus lens
- hero site
- premium world content / site assets

原因很直接：這一輪的責任只有 presentation stabilization。

## 驗證重點

這次驗證會特別檢查：

- 初始畫面能否直接理解整顆地球是主舞台
- 使用者能否自然縮放看完整地球
- 也能否拉近看 corridor
- overlay 是否已經不再像 dashboard
- current service corridor 是否仍然清楚可見

## 下一步

如果這一版 presentation 被接受，下一個候選 commit 才會重新考慮：

- `add reference replay smoke via estnet-bootstrap-kit`

但那一步的前提，是 globe-first scene 已經不再需要先做 shell 修正。
