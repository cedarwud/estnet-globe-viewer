# ESTNET Globe Viewer Docs

這裡只放交付導向的正式文件，不放 workspace-internal prompt、review scratch、或一次性協作筆記。

## 建議閱讀順序

1. [../README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [sdd/service-driven-hero-globe-sdd-v1.md](./sdd/service-driven-hero-globe-sdd-v1.md)
4. [phases/README.md](./phases/README.md)
5. [phases/phase-00-repo-init.md](./phases/phase-00-repo-init.md)
6. [phases/phase-01-offline-hero-globe-shell.md](./phases/phase-01-offline-hero-globe-shell.md)
7. [phases/phase-02-canonical-truth-mock-path.md](./phases/phase-02-canonical-truth-mock-path.md)
8. [devlogs/README.md](./devlogs/README.md)
9. [devlogs/2026-04-07-canonical-truth-mock-path.md](./devlogs/2026-04-07-canonical-truth-mock-path.md)

## 文件分類

- [architecture.md](./architecture.md)
  - repo 角色、產品 claim、truth 邊界、依賴邊界
- [sdd/service-driven-hero-globe-sdd-v1.md](./sdd/service-driven-hero-globe-sdd-v1.md)
  - 第一個 globe-first 交付線的正式 kickoff SDD
- [phases/README.md](./phases/README.md)
  - phase 記錄入口與當前開發節點
- [phases/phase-00-repo-init.md](./phases/phase-00-repo-init.md)
  - 第一個 commit 的範圍、輸出、排除項與驗證
- [phases/phase-01-offline-hero-globe-shell.md](./phases/phase-01-offline-hero-globe-shell.md)
  - 第二個 commit 的 app shell、hero globe baseline 與排除項
- [phases/phase-02-canonical-truth-mock-path.md](./phases/phase-02-canonical-truth-mock-path.md)
  - 第三個 commit 的 canonical truth model、mock provider seam 與排除項
- [devlogs/README.md](./devlogs/README.md)
  - 開發日誌索引
- [devlogs/2026-04-07-offline-hero-globe-shell.md](./devlogs/2026-04-07-offline-hero-globe-shell.md)
  - 第二個 commit 的 runtime 選型、場景組成與驗證記錄
- [devlogs/2026-04-07-canonical-truth-mock-path.md](./devlogs/2026-04-07-canonical-truth-mock-path.md)
  - 第三個 commit 的 truth contracts、mock adapter、provider seam 與驗證記錄
- [../archive/README.md](../archive/README.md)
  - 過時或被替換文件的安置規則

## 文件原則

1. authority 文件、phase 記錄、devlog、archive 必須分開。
2. 文件超連結以 repo-relative 路徑為主，不使用本機絕對路徑。
3. 交付 repo 只保留對外有價值的正式文件。
4. 過時草稿不得繼續混在 live authority 路徑中，應移到 `archive/`。
