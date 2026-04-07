# ESTNET Globe Viewer

`estnet-globe-viewer` 是新的 globe-first 交付 repo。它的第一責任是用單一 hero globe，讓 reviewer 在大約 10 秒內看懂兩個相距很遠的 endpoints 目前如何透過衛星服務走廊被服務。

## 目前狀態

目前只完成 `repo init` baseline。這個階段刻意只建立交付骨架與正式文件入口，尚未加入：

- 可執行 app shell
- globe runtime / renderer
- mock truth provider
- `estnet-bootstrap-kit` 整合

## 凍結方向

- Product direction: `Service-Driven Hero Globe`
- Post-V1 expansion model: `Service-Driven Hero Globe + Single Focus Lens`
- First implementation slice: `offline-hero-globe-canonical-replay-baseline`

## 第一個 commit 的邊界

這個 baseline commit 只做 repo skeleton，包含：

- `main` 分支上的新 repo 初始化
- `.gitignore` 與交付 hygiene baseline
- README 與 `docs/` 入口
- repo-local architecture / SDD / phase / devlog 文件
- `archive/` 規則入口

這個 baseline commit 刻意不做：

- app shell、相機控制、endpoint anchors
- runtime / engine 選型與套件安裝
- replay adapter、mock dataset、producer integration
- `focus lens`、hero site、premium world content
- KPI dashboard 或任何超出 truth 邊界的 claims

## 建議閱讀順序

1. [docs/README.md](./docs/README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [docs/sdd/service-driven-hero-globe-sdd-v1.md](./docs/sdd/service-driven-hero-globe-sdd-v1.md)
4. [docs/phases/phase-00-repo-init.md](./docs/phases/phase-00-repo-init.md)
5. [docs/devlogs/2026-04-07-repo-init.md](./docs/devlogs/2026-04-07-repo-init.md)

## 目錄

```text
estnet-globe-viewer/
├── archive/
├── docs/
│   ├── devlogs/
│   ├── phases/
│   └── sdd/
├── .gitignore
└── README.md
```

## 下一個 commit

下一個建議 commit 是：

- `add offline hero globe shell baseline`

它應該只證明 globe-first 主舞台能獨立站起來，仍不接外部 producer。
