# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前已完成八個早期 baseline：

1. `init estnet-globe-viewer repo skeleton`
2. `add offline hero globe shell baseline`
3. `add canonical truth interfaces and mock truth path`
4. `add selective service corridor baseline`
5. `refine full-stage globe shell and overlay presentation`
6. `add earth asset governance and imagery seam`
7. `reset offline earth appearance foundation`
8. `add day-night earth shader baseline`

目前已可在沒有外部 producer 的情況下看到並驗證：

- 最小 app shell
- 最小 `HeroGlobeScene`
- 最小 camera / orbit / zoom
- 兩個遠距 endpoint anchors
- canonical truth vocabulary
- 最小同步 `TruthProvider`
- scene 與 UI 共用的 mock truth snapshot
- 一條 current service corridor
- 一條 unavailable candidate corridor
- 極少量 service-relevant satellites
- active / unavailable 的第一版可視差異
- full-stage globe-first shell
- compact HUD + on-demand details drawer
- 可從完整地球讀取一路縮放到 corridor 的 camera framing
- 最小 `EarthTextureSet`
- 最小 `ImageryProvider`
- `useEarthTextures()` imagery seam
- 一個已批准的 NASA day texture runtime derivative
- 一個已批准的 NASA Black Marble night runtime derivative
- texture-backed Earth baseline 取代抽象藍球
- formal day-night Earth shader v1
- 更保守的單主光 lighting foundation
- 受控 terminator 與 restrained dark-side readability
- 明確保留但不作為主路徑的 placeholder fallback

目前仍尚未加入：

- clouds / atmosphere / bloom
- `estnet-bootstrap-kit` 整合
- focus lens
- producer-backed events
- premium world content / site assets

## 凍結方向

- Product direction: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`
- First implementation slice: `offline-hero-globe-canonical-replay-baseline`

## Commit 邊界

前八個 baseline commit 目前分工如下：

1. `init estnet-globe-viewer repo skeleton`
   - `.gitignore` 與交付 hygiene baseline
   - README 與 `docs/` 入口
   - repo-local architecture / SDD / phase / devlog 文件
   - `archive/` 規則入口

2. `add offline hero globe shell baseline`
   - Vite + React + TypeScript app shell
   - minimal hero globe
   - minimal camera / orbit / zoom
   - placeholder endpoint anchors

3. `add canonical truth interfaces and mock truth path`
   - `WorldGeometryTruth`
   - `ServiceAvailabilityTruth`
   - `ServiceSelectionTruth`
   - `EventTruth`
   - `DatasetCapabilityProfile`
   - 最小同步 `TruthProvider`
   - mock truth seed + adapter + provider
   - hero globe 與 UI 共用的 single canonical snapshot

4. `add selective service corridor baseline`
   - 最小 satellite geometry
   - 第一版 `ServiceAvailabilityTruth`
   - 第一版 `ServiceSelectionTruth`
   - 1 條 current service corridor
   - 1 條 unavailable candidate corridor
   - active / unavailable 的第一版差異
   - scene 與 UI 仍共用同一份 canonical snapshot

5. `refine full-stage globe shell and overlay presentation`
   - globe 回到 full-browser primary stage
   - camera / controls 調整為可自然看完整顆地球，也可拉近 corridor
   - 右側長側欄收斂成 compact HUD + on-demand drawer
   - 保留 mock truth 與 selective corridor baseline，不開始 external producer integration

6. `add earth asset governance and imagery seam`
   - repo 內建立 Earth asset governance 入口
   - 新增 `EarthTextureSet`、`ImageryProvider`、`useEarthTextures()`
   - scene 接上最小 imagery seam，但尚不導入正式 runtime texture
   - 明確保留 placeholder globe fallback，避免誤判為 Step 1 已完成

7. `reset offline earth appearance foundation`
   - 正式納入一個 approved NASA day texture derivative
   - `offlineEarthImageryProvider` 從 `none-approved` 進入 `approved-runtime`
   - `HeroGlobe` 改為 texture-backed Earth baseline
   - lighting 收斂為單主 sun 加極低 ambient，不偷做 Step 2

8. `add day-night earth shader baseline`
   - 正式納入一個 approved NASA Black Marble night derivative
   - imagery seam 最小擴充為 day + night runtime asset set
   - `HeroGlobe` 改為 formal day-night Earth shader v1
   - dark-side readability 來自受控 day/night mixing 與 twilight band，不用整體補光偷渡

目前仍刻意不做：

- cloud shell、atmosphere、bloom
- replay adapter、reference dataset smoke、producer integration
- `focus lens`、hero site、premium world content
- KPI dashboard 或任何超出 truth 邊界的 claims

## 建議閱讀順序

1. [docs/README.md](./docs/README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [docs/assets/earth-assets.md](./docs/assets/earth-assets.md)
4. [docs/sdd/service-driven-hero-globe-sdd-v1.md](./docs/sdd/service-driven-hero-globe-sdd-v1.md)
5. [docs/phases/phase-00-repo-init.md](./docs/phases/phase-00-repo-init.md)
6. [docs/phases/phase-01-offline-hero-globe-shell.md](./docs/phases/phase-01-offline-hero-globe-shell.md)
7. [docs/phases/phase-02-canonical-truth-mock-path.md](./docs/phases/phase-02-canonical-truth-mock-path.md)
8. [docs/phases/phase-03-selective-service-corridor.md](./docs/phases/phase-03-selective-service-corridor.md)
9. [docs/phases/phase-04-full-stage-globe-presentation.md](./docs/phases/phase-04-full-stage-globe-presentation.md)
10. [docs/devlogs/2026-04-07-full-stage-globe-presentation.md](./docs/devlogs/2026-04-07-full-stage-globe-presentation.md)

## 快速開始

### 環境需求

- Node.js `>= 18`
- npm `>= 9`

### 安裝

```bash
npm install
```

### 開發與建置

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

目前畫面由 repo 內的 mock truth provider 驅動，不依賴任何外部 replay producer。
`activePath` 只被描述為 current service corridor / current active relay path / current visible relay path，不宣稱 routing truth。
Earth imagery seam 已進入承載 day/night runtime asset 的 `approved-runtime` 狀態；scene 主路徑已改為 formal day-night Earth shader v1。Step 1 day-only fallback 與 placeholder fallback 仍存在，但只作 guard。
`estnet-bootstrap-kit` integration 會等到 presentation shell 穩定後再重新開啟。

## 目錄

```text
estnet-globe-viewer/
├── archive/
├── docs/
│   ├── assets/
│   ├── devlogs/
│   ├── phases/
│   └── sdd/
├── public/
│   └── assets/
│       └── earth/
├── scripts/
│   └── assets/
├── src/
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## 目前 Earth 狀態

這一輪是 offline Earth reset track 的 `Step 2`，不是 `Step 3`。

目前 repo 已經有：

- Earth asset governance 文件
- approved runtime NASA day texture derivative
- approved runtime NASA Black Marble night texture derivative
- imagery seam 的 `approved-runtime` day/night 路徑
- formal day-night Earth shader v1
- scene 端保留的 Step 1 day-only 與 placeholder fallback guard

目前 repo 刻意還沒有：

- clouds
- atmosphere
- bloom

下一個視覺 approval 目標若要前進，必須等 Step 3 authority 另行 promotion；Step 2 不能自己膨脹成完整 planet rendering stack，也不代表 `estnet-bootstrap-kit` 會回到主線。
