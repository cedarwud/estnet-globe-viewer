# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前已完成四個早期 baseline：

1. `init estnet-globe-viewer repo skeleton`
2. `add offline hero globe shell baseline`
3. `add canonical truth interfaces and mock truth path`
4. `add selective service corridor baseline`

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

目前仍尚未加入：

- `estnet-bootstrap-kit` 整合
- focus lens
- producer-backed events
- premium world content / site assets

## 凍結方向

- Product direction: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`
- First implementation slice: `offline-hero-globe-canonical-replay-baseline`

## Commit 邊界

前四個 baseline commit 目前分工如下：

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

目前仍刻意不做：

- replay adapter、reference dataset smoke、producer integration
- `focus lens`、hero site、premium world content
- KPI dashboard 或任何超出 truth 邊界的 claims

## 建議閱讀順序

1. [docs/README.md](./docs/README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [docs/sdd/service-driven-hero-globe-sdd-v1.md](./docs/sdd/service-driven-hero-globe-sdd-v1.md)
4. [docs/phases/phase-00-repo-init.md](./docs/phases/phase-00-repo-init.md)
5. [docs/phases/phase-01-offline-hero-globe-shell.md](./docs/phases/phase-01-offline-hero-globe-shell.md)
6. [docs/phases/phase-02-canonical-truth-mock-path.md](./docs/phases/phase-02-canonical-truth-mock-path.md)
7. [docs/phases/phase-03-selective-service-corridor.md](./docs/phases/phase-03-selective-service-corridor.md)
8. [docs/devlogs/2026-04-07-selective-service-corridor.md](./docs/devlogs/2026-04-07-selective-service-corridor.md)

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

## 目錄

```text
estnet-globe-viewer/
├── archive/
├── docs/
│   ├── devlogs/
│   ├── phases/
│   └── sdd/
├── src/
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## 下一個 commit

下一個建議 commit 是：

- `add reference replay smoke via estnet-bootstrap-kit`

它才開始接 canonical replay adapter 與第一批 reference dataset smoke；在那之前，viewer core 仍保持對外部 producer 低耦合。
