# ESTNET Globe Viewer Architecture Boundary

## 專案角色

`estnet-globe-viewer` 是新的 globe-first 交付 viewer。它不是 `estnet-bootstrap-kit` 的附屬 UI，也不是把既有本地場景 viewer 直接換成全球背景版。

它的核心任務是：

1. 用單一 hero globe 作為唯一 primary stage。
2. 讓兩個遠距 endpoints 與目前的 service corridor 成為第一主角。
3. 在沒有 dashboard 幫忙解說的前提下，讓 active / unavailable 差異一眼可懂。

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

## Repo 內文件結構

repo 內的正式文件分為四層：

1. `README.md`
2. `docs/sdd/`
3. `docs/phases/` 與 `docs/devlogs/`
4. `archive/`

這個結構的目的不是增加文件量，而是避免 authority、工作紀錄與過時草稿混在一起。

## 目前刻意未做

目前 baseline 不包含：

- hero globe runtime
- focus lens
- premium world content
- hero site module
- KPI dashboard
- producer-backed replay integration
