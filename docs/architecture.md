# ESTNET Globe Viewer Architecture Boundary

## 專案角色

`estnet-globe-viewer` 是新的 globe-first 交付 viewer。它不是 `estnet-bootstrap-kit` 的附屬 UI，也不是把既有本地場景 viewer 直接換成全球背景版。

它的核心任務是：

1. 用單一 hero globe 作為唯一 primary stage。
2. 讓兩個遠距 endpoints 與目前的 service corridor 成為第一主角。
3. 在沒有 dashboard 幫忙解說的前提下，讓 active / unavailable 差異一眼可懂。

## Presentation Shell Boundary

目前的 presentation model 明確要求：

1. globe 必須是 full-stage / full-browser primary scene。
2. overlay 只能是輔助資訊層，不是新的 dashboard rail。
3. 長時間常駐資訊必須收斂成 compact HUD；詳細內容進入可展開 drawer。
4. camera / controls 必須同時支援完整地球 framing 與較近的 corridor inspection。

## 產品 claim

在大約 10 秒內，reviewer 應能理解：

1. 有兩個相距很遠的 endpoints。
2. 目前服務是透過衛星中繼走廊提供。
3. active / unavailable 差異清楚可見。
4. globe 是主舞台，不是 panel 背景。

## 交付邊界

這個 repo 只追蹤交付所需的程式碼、資產與正式文件。以下內容預設不進 repo：

- `AGENTS.md`
- prompt packs
- reviewer scratch notes
- workspace continuity files
- 一次性 debug / export artifacts

## Truth 邊界

viewer 必須對 truth 保持保守語言：

- `activePath` 只可描述為 `current service corridor`、`current active relay path`、或 `current visible relay path`
- 不可把 `activePath` 直接改叫 `network route`、`routing decision`、或 `optimal path`
- viewer-side 推導事件必須標記為 `derived`
- 若 truth 不存在，viewer 可以降級，但不可假裝它存在

## 依賴邊界

`estnet-bootstrap-kit` 之後只作第一個 `ReferenceReplayTruthProvider`。它不是本 repo 的核心骨架。

早期硬規則：

1. 第一個 commit 必須能獨立成立。
2. 最小 offline hero globe shell 完成前，不接真實 producer。
3. viewer core 不依賴 bootstrap-kit 的 branch 命名、scenario 命名、資料夾結構或 exporter internals。

## Earth Imagery And Asset Boundary

目前 execution authority 對 Earth imagery 仍要求最小 seam，而 Step 2 只在這條 seam 上做必要擴充：

- `EarthTextureSet`
- `ImageryProvider`
- `useEarthTextures()`

這條 seam 現在已被用來承接 Step 1 的 approved runtime day texture，以及 Step 2 的 approved runtime night texture，但仍維持最小同步邊界，不擴張成更大的 async/provider framework。

目前規則如下：

1. 已批准的 Earth runtime assets 之後只放在 `public/assets/earth/`
2. asset manifest / attribution / provenance / preprocessing 記錄放在 `docs/assets/earth-assets.md`
3. preprocessing helper scripts 之後只放在 `scripts/assets/`
4. 若 night derivative 不存在，scene 最多只能退回 Step 1 day-only surface；若 day derivative 也不存在，scene 必須明確退回 placeholder globe
5. `TerrainProvider`、`Context3DTilesProvider`、`SiteAssetProvider` 在這一輪仍停留在文件 authority，不進空殼 runtime 程式碼

## Repo 內文件結構

repo 內的正式文件分為五層：

1. `README.md`
2. `docs/assets/`
3. `docs/sdd/`
4. `docs/phases/` 與 `docs/devlogs/`
5. `archive/`

這個結構的目的不是增加文件量，而是避免 authority、工作紀錄與過時草稿混在一起。

## 目前 runtime baseline

目前 repo 已有最小可執行 runtime baseline，且畫面已改由 mock truth path 驅動：

- Vite + React + TypeScript shell
- Three.js / React Three Fiber globe scene
- full-stage globe shell
- orbit / zoom camera baseline with wider usable framing range
- canonical truth vocabulary
- minimal `TruthProvider`
- minimal `ImageryProvider` seam with `EarthTextureSet` and `useEarthTextures()`
- approved runtime NASA day texture derivative under `public/assets/earth/`
- approved runtime NASA Black Marble night texture derivative under `public/assets/earth/`
- mock truth seed + adapter + provider
- endpoint anchors sourced from `WorldGeometryTruth`
- service-relevant satellites sourced from `WorldGeometryTruth`
- one current service corridor plus one unavailable candidate corridor
- active / unavailable 的第一版保守差異
- compact HUD plus on-demand details drawer instead of a permanent dashboard side rail
- formal day-night Earth shader v1 with explicit `sunDirection` control
- fallback guards that no longer act as the main success path

這個 baseline 的用途是先證明 `HeroGlobeScene` 能獨立站起來，且 scene / UI 已能透過同一份 canonical snapshot 讀值，而不是提前宣稱 service truth 已完整存在。

## 目前刻意未做

目前 baseline 不包含：

- cloud shell / atmosphere
- bloom
- derived event cue
- focus lens
- premium world content
- hero site module
- KPI dashboard
- producer-backed replay integration

而且目前刻意延後：

- Step 3 visual follow-ons after the Step 2 shader baseline
- `estnet-bootstrap-kit` reference replay smoke

原因是 Step 2 只解決 formal day/night Earth baseline、terminator control、與 restrained dark-side readability，不處理 clouds、atmosphere、或 bloom。

目前對 truth 的保守邊界是：

- `WorldGeometryTruth` 已提供 endpoint global positions
- `WorldGeometryTruth` 目前只保留極少量 service-relevant satellites，不做 full constellation
- `ServiceAvailabilityTruth` 已提供當前 availability 與極少量 candidate path availability
- `ServiceSelectionTruth` 已提供 `activePath`，但只用 `current service corridor` / `current active relay path` / `current visible relay path` 語言
- `EventTruth` 仍只保留 `derived` 型別，且目前是空集合
- `estnet-bootstrap-kit` 尚未接入，之後只作 reference producer
