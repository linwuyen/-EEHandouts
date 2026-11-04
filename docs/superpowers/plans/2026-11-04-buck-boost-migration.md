# Buck / Boost Migration Implementation Plan

> Execution: superpowers:executing-plans, inline with test-driven-development.

**Goal:** 八步 Buck → 本站 Buck/Boost 比較 → 保存後返回原教材。
**Architecture:** `topology.html` 是本地獨立 document，沿用現有 owner，避免雙重 mount/listener。
**Tech Stack:** 既有靜態 HTML/JS、Node、Playwright 1.56.1，依賴版本不變。
**Spec:** `docs/superpowers/specs/2026-11-04-buck-boost-migration.md`

## Global Constraints
固定 EE 9a4a2603 / Circuit 11ef4e48；模型、Evidence、CoreFlow、題目判定不改；無外站執行依賴；不改儲存 key、不刪紀錄；原回歸和發布守門保留。

## Review Focus
1. 舊/新版與另一分頁在模型契約 await 期間更新：讀取、保存和離頁前 guard，停止但可備份。
2. 初始化失敗/CCM 無效不可標 ready，也不可建立假完成。
3. 導航必須等待真實渲染和持久保存；保留所有既有回歸。
4. 尚未遷入應用只到 coverage，不死連結或冒充全部遷完。
5. 公開資產缺工作台檔案必須發布驗證失敗，不只檢首頁。

## Tasks
- [ ] 1. 新增 `tests/topology-migration-contracts.mjs`：本地比較入口、owner 不變、實際 host allowlist/flush/版本保護；觀察缺頁/入口 RED。
- [ ] 2. 新增 `workbench/topology.html`、`ee-topology-entry.js`，遷入 `assets/learning/workspace-topology-ui.js`；小改 ee-host、八步的轉接目錄；更新來源 manifest；GREEN 後提交。
- [ ] 3. 原樣搬 `tests/topology-workspace.test.mjs`、`tests/topology-transfer.test.mjs`；新增 `tests/topology-workbench-smoke.mjs` 實際 DOM 測試，更新既有八步結尾檢查且不刪原案例；加入兩個原 CI 命令。
- [ ] 4. 擴充公開發布資產檢查及其缺檔失敗測試；更新 README/inventory/coverage；執行完整 `npm test` 與跨瀏覽器（缺環境明報，遠端 CI 必驗）。
- [ ] 5. 核對 exact tree/來源雜湊、開隔離分支 PR、請獨立 Review，僅在 exact-head 全綠後進入合併/發布驗收。

## Commands / PASS
`node tests/topology-migration-contracts.mjs`；`npm run test:ci`；`npm test`；`npm run test:cross-browser`。每項 exit 0 才算 PASS；不能沿用基準版的成績。
