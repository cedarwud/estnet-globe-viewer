# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前已完成兩個早期 baseline：

1. `init estnet-globe-viewer repo skeleton`
2. `add offline hero globe shell baseline`

目前已可在沒有外部 producer 的情況下看到：

- 最小 app shell
- 最小 `HeroGlobeScene`
- 最小 camera / orbit / zoom
- 兩個遠距 placeholder endpoint anchors

目前仍尚未加入：

- canonical truth interfaces
- service corridor / active vs unavailable baseline
- satellites / candidate context
- mock truth provider
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

目前仍刻意不做：

- replay adapter、mock dataset、producer integration
- canonical truth interfaces
- service corridor baseline
- `focus lens`、hero site、premium world content
- KPI dashboard 或任何超出 truth 邊界的 claims

## 建議閱讀順序

1. [docs/README.md](./docs/README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [docs/sdd/service-driven-hero-globe-sdd-v1.md](./docs/sdd/service-driven-hero-globe-sdd-v1.md)
4. [docs/phases/phase-00-repo-init.md](./docs/phases/phase-00-repo-init.md)
5. [docs/phases/phase-01-offline-hero-globe-shell.md](./docs/phases/phase-01-offline-hero-globe-shell.md)
6. [docs/devlogs/2026-04-07-offline-hero-globe-shell.md](./docs/devlogs/2026-04-07-offline-hero-globe-shell.md)

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

目前畫面只使用 repo 內的 placeholder endpoint data，不依賴任何外部 replay producer。

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

- `add canonical truth interfaces and mock truth path`

它應該先把 canonical truth vocabulary 與 mock truth path 建起來，仍不接外部 producer。
