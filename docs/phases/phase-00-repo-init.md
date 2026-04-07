# Phase 00 Repo Init

## Status

- Status: completed as the first baseline commit
- Commit message target: `init estnet-globe-viewer repo skeleton`

## Phase Goal

把 `estnet-globe-viewer` 從不存在的資料夾，建立成一個有清楚交付邊界、文件入口與 commit discipline 的新 repo。

這個 phase 的重點不是「讓 globe 跑起來」，而是先把第一個 commit 的邊界凍結好，避免一開始就混入 producer、dataset、或過多 runtime 假設。

## In Scope

- 初始化 git repo 與 `main`
- 設定 `origin`
- 建立 `.gitignore`
- 建立 `README.md`
- 建立正式 `docs/` 入口
- 建立 repo-local architecture / SDD / phase / devlog 文件
- 建立 `archive/` 安置規則

## Explicitly Out Of Scope

- 可執行 app shell
- globe renderer / engine choice
- 相機控制、orbit、zoom
- endpoint anchors
- canonical truth interfaces 的程式碼
- mock truth provider
- `estnet-bootstrap-kit` 整合
- demo dataset
- focus lens、hero site、premium world content、KPI dashboard

## Deliverables

### Repository Baseline

- `.gitignore`
- `README.md`
- `archive/README.md`

### Formal Docs

- `docs/README.md`
- `docs/architecture.md`
- `docs/sdd/service-driven-hero-globe-sdd-v1.md`
- `docs/phases/README.md`
- `docs/phases/phase-00-repo-init.md`
- `docs/devlogs/README.md`
- `docs/devlogs/2026-04-07-repo-init.md`

## Why This Phase Stops Here

`repo init` 必須先和 `offline hero globe shell` 分開，原因是：

1. 第一個 commit 需要能獨立成立，且完全不依賴 `estnet-bootstrap-kit`。
2. runtime / engine 選型不應在文件與交付邊界還沒乾淨前就偷帶進來。
3. 後續每個 commit 需要保有清楚的因果關係與回看價值。

## Validation

- `estnet-globe-viewer/` 已建立
- git repo 已初始化為 `main`
- `origin` 已設定為 `https://github.com/cedarwud/estnet-globe-viewer.git`
- README 與 docs 入口已存在
- authority、phase、devlog、archive 已分開
- repo 內沒有 producer adapter、dataset、或 internal-only scratch 文件

## Next Commit

下一個 commit 應是：

- `add offline hero globe shell baseline`

它的目標只是證明 `HeroGlobeScene` 作為主舞台可以獨立站起來，仍不導入外部 producer。
