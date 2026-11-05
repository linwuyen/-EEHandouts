# EEHandouts 第二批：Buck / Boost 比較

## Objective / Scope
依使用者已批准的單一 EEHandouts 遷移方向，接上已發布八步實驗後的四階段 Buck/Boost 比較。新頁及必要程式、測試都由 EEHandouts 擁有；不依賴舊站，不搬整個 Module 17，不改數值核心或成績語意。

## Known Facts / Authority
EE baseline `9a4a2603c974ae22998bdfe4348890c00e146300` (tree `ddbbcdc43af00b5f731402a09ecd18ffa1d1b2a8`)；Circuit source `11ef4e4801b5283f265dc349a4afec0027603228`。
依 `docs/migrations/circuit-inventory.md` 與既有吸收規格。原 `workspace-core.js` 的 topologyPlan/Compare/Proof、model registry、topology-transfer、curriculum、Evidence V5、CoreFlow 全部不改。來源比較是無損耗、零 ESR、前後兩工作點都在 CCM 的穩態比較，不是八步暫態的能量 checkpoint。

## Design decisions / Target
獨立 `workbench/topology.html` 共用既有工作台殼。這比在同一 document 重掛兩組全域事件安全，又不維護第二網站。原八步結尾、已遷入能力的建議入口和目錄透過保存後導航到本地比較頁；比較頁可返回八步實驗或原 Buck/Boost 教材。
遷入原 `workspace-topology-ui.js`，只調整導航、原始版本/紀錄衝突 guard、初始化失敗和狀態呈現；保持原 prediction→operation/observation→reason→return 判定與錯誤首次作答。後續四拓樸工具仍明示未遷入。
參數只取原 owner 選定的手動實驗設定（或明確預設），不自動套用 EE 不同模型的參數；無效/BCM/DCM/新版/損壞資料停止，不改造成完成。原 storage keys/locks 不變，不清資料，備份仍唯讀。

## Verification / Stop / Rollback
原全部 test:ci、來源 topology-workspace/transfer tests、本批模型/入口/保存/發布契約與真實 DOM 三瀏覽器。核對首次判斷、不提前揭露答案、重載、八步↔比較↔教材、讀完≠練習通過、無效 CCM、缺契約資產、quota、同版衝突、運行中新版、手機 320/390px。
Exact-head CI/獨立 Review 未過不得合併；新 main 發布驗收分開。遇來源漂移、改 schema/核心、資料損失即停。回退本批導航及檔案，保留所有 localStorage。Issue #20 與舊 repo 退役不在本批結案。
