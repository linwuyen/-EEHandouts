# Circuit → EEHandouts 遷移清單

## 終點與本批範圍
只有 EEHandouts 是正式維護與發布來源；舊 repo 退役需全部必要能力驗收及備份後另行確認，不能把第一批完成當作全部搬完。
固定來源 Circuit `11ef4e4801b5283f265dc349a4afec0027603228`；EE 起點 `b1e41595e4602b67d0dbbb353f92dddddd0c5484`。

| 能力 / 來源 | 本批處置 | 後續處置 |
|---|---|---|
| 現行 Buck 八步連續實驗 | 已實作搬入 workbench；待本批 exact-head CI / Review / 發布驗收 | 串到更多相關教材 |
| generic-power-causal-kernel / curriculum / registry | 原樣搬必要依賴；不改物理模型 | 保持 owner / unit / model validity |
| Evidence V5、CoreFlow、首次判斷、transfer | 必要 owner 原樣搬入、鍵值與鎖不變 | 真正需要時才設計 schema 遷移 |
| 深層工程來源面板 | 搬入唯讀資料與必要延遲載入；無效入口顯示未遷入 | 按能力逐批接上 |
| 舊八課、獨立評量、retention | 既有紀錄保留、可唯讀備份；頁面未搬 | 各自驗收再遷移，不能以閱讀標記替代 |
| Buck / Boost 比較與 Module 17 四應用 | 未搬入頁面；本批不自動傳參 | 匝比/格點、Pin/Pout、Ceq、FHA 邊界核對後接入 |
| Module 1 / 9 / 12 ADC / AFE / OP | 連到既有 EE 對應教材，不冒稱遷入原工具 | 逐模組遷移量測鏈與 UI |
| Module 4 / 16 / 18 PI / transforms / control | 連到 EE 原類比 PI / 工具，不混用係數 | 各自離散化、模型、單位契約 |
| Module 6 / 13 timing / synchronization | 連到 EE 原時序頁，不授予實機 PASS | 指定器件與 ADCRESULT 證據另驗 |
| Module 14 / 15 / 19 safety / debug / firmware | 頁面、firmware、HIL 與 Board evidence 未搬 | 保留實機未驗證界線與 authority |
| Module 0 舊 Buck、2 code artifact、3 FOC、5 SPI、7 BMS、8 AD5543、10 ACMC、11 DDS | 本批未搬 | 按功能等價性決定搬入/整併，不因重複名稱刪除 |
| 舊站導覽與部署 | 不引入第二套正式首頁或部署管線 | 全面驗收後停止舊發布；不自動刪 repo |

## 已知邊界
每次零初值重跑 16 ms；不是能量 checkpoint。kernel 契約仍 PARTIAL，BOARD_PASS 未授予。讀完教材與實驗證據分開。
本批 workbench assets 實體存在 EE；Node / CI / Pages 不需要 clone、fetch 或連線 Circuit repo。來源 lock / manifest 僅紀錄 provenance，不是執行依賴。
學習狀態同源共用原 key；保留 Web Locks 與衝突保護，禁止偷偷改 key 或清空舊紀錄。新的 records 頁唯讀；原始備份是保全格式，沒有自動 restore。
教材公開授權 Issue #20 不因本批搬移而結案。

## 檔案責任
`workbench/source-manifest.json` 列出逐檔來源 blob/hash。只有 index、workspace-experiment-ui、workbench-context 改導航；numerical kernel、Evidence、CoreFlow、PlainCourse 與 Workspace core 保持原樣。
`ee-host.js` 管導航與 flush gate；`ee-entry.js` 管初始化與版本保護；`ee-records.js` 唯讀匯出；原實驗 owner 執行所有作答/操作/判定。
`tests/migration-contracts.mjs`、`workbench-host-contracts.mjs`、`buck-workbench-smoke.mjs` 驗交界，`workbench/tests/` 保留來源測試。

## 退役通過條件
所有必要能力清單有去向、資料匯出/遷移有證據、停用舊站後 EE 獨立建置與運作、exact main CI / Pages / hosted SHA 通過。未符合前不得刪除原專案。
