# 2026-04-07 Offline Hero Globe Shell

## 為什麼現在做這個

authority 已明確要求第二個 commit 先建立離線可執行的 hero globe shell，證明新 repo 的主舞台能獨立站起來，再談 canonical truth 或 reference producer。

這一步的實際價值是：

1. 把 repo 從「只有文件」推進到「已可執行」
2. 先驗證 globe-first 畫面本身的閱讀性
3. 避免在沒有主舞台的前提下太早綁死 replay / provider 介面

## 這次建立了哪些技術面

### Runtime Shell

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`

用途是建立最小 Vite + React + TypeScript viewer shell。

### Scene Layer

- `src/components/globe/HeroGlobeScene.tsx`
- `src/components/globe/HeroGlobe.tsx`
- `src/components/globe/GlobeGraticule.tsx`
- `src/components/globe/EndpointAnchor.tsx`
- `src/lib/geo.ts`

用途是建立：

- earth sphere
- atmosphere shell
- graticule
- orbit / zoom camera baseline
- 兩個遠距 endpoint placeholder anchors

### Placeholder Data

- `src/data/placeholderEndpoints.ts`

這裡刻意只放 placeholder endpoints，目的是讓畫面能站起來，但不假裝已經有 canonical truth。

### Styling

- `src/styles/main.css`

這一版的 styling 目標不是做 full product UI，而是讓：

- globe 是視覺主角
- side panel 清楚標示此階段已做與未做內容
- 畫面在桌面與手機都能維持可讀

## 關鍵邊界

這次沒有加入：

- active corridor
- availability state
- satellite visibility logic
- replay timeline
- truth contracts
- provider seams

原因不是不需要，而是它們都屬於下一個或後續 commit 的責任。

## 資料流

目前資料流非常刻意地簡單：

1. `placeholderEndpoints.ts` 提供兩個靜態 endpoint anchors
2. `App.tsx` 把 placeholder data 傳進 `HeroGlobeScene`
3. `HeroGlobeScene` 建立 camera、lights、stars 與 `HeroGlobe`
4. `HeroGlobe` 產生 earth shell、graticule 與 `EndpointAnchor`
5. `EndpointAnchor` 只做 marker、pulse、label，不承擔任何 truth 推論

## 驗證

這次驗證的最低要求是：

1. 依賴可安裝
2. TypeScript lint 通過
3. production build 可完成

若本地瀏覽器啟動，應能看到：

- 一顆可旋轉與縮放的地球
- 兩個相距很遠的 placeholder endpoints
- 清楚標示這只是 offline shell baseline

## 下一步

下一個 commit 應集中在：

- canonical truth interfaces
- `DatasetCapabilityProfile`
- mock truth path

這一步完成後，才適合往 selective corridor baseline 與 reference replay smoke 前進。
