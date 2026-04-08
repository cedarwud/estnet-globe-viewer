# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前已完成十一個早期 baseline：

1. `init estnet-globe-viewer repo skeleton`
2. `add offline hero globe shell baseline`
3. `add canonical truth interfaces and mock truth path`
4. `add selective service corridor baseline`
5. `refine full-stage globe shell and overlay presentation`
6. `add earth asset governance and imagery seam`
7. `reset offline earth appearance foundation`
8. `add day-night earth shader baseline`
9. `add corridor-aware framing and semantic scene polish`
10. `add restrained atmosphere and overlay reduction`
11. `harden earth asset performance and appearance seam`

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
- corridor-aware first screen，而不是任意 globe rotation
- 明確的 `Home` / `Fit Corridor` framing actions
- 最小 in-scene endpoint labels
- 更清楚的 endpoint / relay / active corridor / unavailable candidate hierarchy
- 更貼近 relay altitude 的 corridor arc geometry
- restrained atmosphere shell，補行星感但不搶 corridor 主角
- approved NASA GSFC cloud runtime derivative and restrained cloud shell baseline
- 更收斂的 persistent overlay
- named Earth appearance profile 與 texture runtime policy
- capped anisotropy 與較保守的 Earth surface detail budget
- build chunk hardening，將 globe stack 從單一大 bundle 拆成較清楚的 vendor/runtime slices
- build warning 已從單一 app bundle 收斂成隔離的 `three-core` vendor warning；目前刻意不再往更脆弱的 `three` source-entry split 推進
- 明確保留但不作為主路徑的 placeholder fallback

目前仍尚未加入：

- KTX2 / bloom
- `estnet-bootstrap-kit` 整合
- focus lens
- producer-backed events
- premium world content / site assets

## 凍結方向

- Product direction: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`
- First implementation slice: `offline-hero-globe-canonical-replay-baseline`

## Commit 邊界

前十一個 baseline commit 目前分工如下：

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

9. `add corridor-aware framing and semantic scene polish`
   - 首屏改為 corridor-aware hero framing，而不是任意地球轉角
   - 新增 `Home` 與 `Fit Corridor`
   - scene 維持 globe-centered interaction，不開 generic free pan
   - 最小 endpoint labels 與更清楚的 endpoint / relay / corridor hierarchy
   - active corridor 幾何高度回收，避免明顯高於 relay altitude

10. `add restrained atmosphere and overlay reduction`
   - 以克制的程序式 atmosphere rim 補行星感與空間深度
   - 不引入新的 runtime cloud asset，也不把 imagery seam 膨脹成 asset framework
   - persistent overlay 再縮一層，把重複解說下沉到 drawer
   - 保住 Step 3 的 first-screen comprehension 與 corridor hierarchy

11. `harden earth asset performance and appearance seam`
   - 引入 named Earth appearance profile 與 texture runtime policy
   - Earth shader / atmosphere / texture runtime config 不再散在 scene 邏輯
   - build chunk hardening 把 React / globe runtime / `three` 相關 bundle 邊界拆開
   - 先不做 KTX2，因為目前兩個 WebP runtime derivatives 已可控，且 Basis/KTX2 tooling + fallback chain 會讓 pipeline 顯著膨脹

12. `add approved cloud shell baseline`
   - 正式納入一個 approved NASA GSFC Blue Marble cloud derivative
   - Earth surface / cloud shell / atmosphere 的主路徑 layering 正式成形
   - 雲層維持克制，只補行星深度，不蓋掉 current corridor story
   - 不引入 bloom、weather animation、ocean specular、grading、或新的 provider decision

目前仍刻意不做：

- KTX2、bloom
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
Earth imagery seam 已進入承載 day / night / cloud runtime asset 的 `approved-runtime` 狀態；scene 主路徑已改為 formal day-night Earth shader v1，加上 restrained cloud shell 與 atmosphere，並掛上 Step 5 的 appearance profile / texture runtime policy。Step 1 day-only fallback 與 placeholder fallback 仍存在，但只作 guard。
首屏 framing 現在會先對準 endpoint pair 與 current service corridor，並提供 `Home` / `Fit Corridor` 作為最小直接的 framing controls。
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

這一輪接在 offline Earth reset track 的 `Step 5` 之後，完成 visual-first Commit 2 的 approved cloud shell baseline，不是 replay/provider integration。

目前 repo 已經有：

- Earth asset governance 文件
- approved runtime NASA day texture derivative
- approved runtime NASA Black Marble night texture derivative
- imagery seam 的 `approved-runtime` day/night 路徑
- named Earth appearance profile 與 runtime texture quality metadata
- formal day-night Earth shader v1
- approved NASA GSFC cloud runtime derivative
- restrained cloud shell baseline
- restrained atmosphere shell
- corridor-aware first-screen framing
- `Home` / `Fit Corridor` controls
- minimal in-scene endpoint labels
- tightened corridor / relay geometry consistency
- scene 端保留的 Step 1 day-only 與 placeholder fallback guard

目前 repo 刻意還沒有：

- KTX2 / Basis runtime path
- bloom

KTX2 也先不做，因為現在只有三個 repo-safe WebP derivatives；若要轉 KTX2，必須一併處理 Basis preprocessing、runtime transcoder、與 clear fallback chain，這在目前這個 mainline baseline 不值得為了三張已可控 asset 強行擴管線。
目前 approved runtime Earth asset set 已擴充到 day / night / cloud 三張 WebP derivatives；雲層主路徑仍維持克制，不做 weather animation、bloom、或更大的特效堆疊。
目前 `vite build` 的 chunk hardening 已把 React / globe runtime / `three` 邊界拆開；剩餘 warning 被隔離在 `three-core`，原因是 `three` 仍以 monolithic published module 進入 bundle。這一輪不再用更脆弱的 source-entry alias 來硬拆它。
目前的 approved cloud shell 也不代表會自動膨脹成 replay/provider integration、bloom、ocean specular、grading、focus lens、或更大的 camera/control overhaul，更不代表 `estnet-bootstrap-kit` 會回到主線。
