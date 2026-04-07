# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前已完成兩個早期 baseline：

1. `init estnet-globe-viewer repo skeleton`
2. `add offline hero globe shell baseline`
3. `add canonical truth interfaces and mock truth path`

目前已可在沒有外部 producer 的情況下看到並驗證：

- 最小 app shell
- 最小 `HeroGlobeScene`
- 最小 camera / orbit / zoom
- 兩個遠距 endpoint anchors
- canonical truth vocabulary
- 最小同步 `TruthProvider`
- scene 與 UI 共用的 mock truth snapshot

目前仍尚未加入：

- service corridor / active vs unavailable baseline
- satellites / candidate context
- `estnet-bootstrap-kit` 整合

## 凍結方向

- Product direction: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`
- First implementation slice: `offline-hero-globe-canonical-replay-baseline`

## 第一個 commit 的邊界

前兩個 baseline commit 目前分工如下：

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

目前仍刻意不做：

- replay adapter、reference dataset smoke、producer integration
- service corridor baseline
- `focus lens`、hero site、premium world content
- KPI dashboard 或任何超出 truth 邊界的 claims

## 建議閱讀順序

1. [docs/README.md](./docs/README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [docs/sdd/service-driven-hero-globe-sdd-v1.md](./docs/sdd/service-driven-hero-globe-sdd-v1.md)
4. [docs/phases/phase-00-repo-init.md](./docs/phases/phase-00-repo-init.md)
5. [docs/phases/phase-01-offline-hero-globe-shell.md](./docs/phases/phase-01-offline-hero-globe-shell.md)
6. [docs/phases/phase-02-canonical-truth-mock-path.md](./docs/phases/phase-02-canonical-truth-mock-path.md)
7. [docs/devlogs/2026-04-07-canonical-truth-mock-path.md](./docs/devlogs/2026-04-07-canonical-truth-mock-path.md)

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

- `add selective service corridor baseline`

它應該開始補 selective satellite visibility、service corridor、active / unavailable baseline，以及最小 derived event cue，但仍先不接 `estnet-bootstrap-kit`。
