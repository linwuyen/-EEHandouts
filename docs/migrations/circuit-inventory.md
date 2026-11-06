# Circuit → EEHandouts 遷移清單

## 終點與本批範圍
只有 EEHandouts 是正式維護與發布來源；舊 repo 退役需全部必要能力驗收及備份後另行確認，不能把第一批完成當作全部搬完。
固定來源 Circuit `11ef4e4801b5283f265dc349a4afec0027603228`；EE 起點 `b1e41595e4602b67d0dbbb353f92dddddd0c5484`。

| 能力 / 來源 | 本批處置 | 後續處置 |
|---|---|---|
| 現行 Buck 八步連續實驗 | PR #45 已發布，正式版本 9a4a2603 | 串到更多相關教材 |
| generic-power-causal-kernel / curriculum / registry | 原樣搬必要依賴；不改物理模型 | 保持 owner / unit / model validity |
| Evidence V5、CoreFlow、首次判斷、transfer | 必要 owner 原樣搬入、鍵值與鎖不變 | 真正需要時才設計 schema 遷移 |
| 深層工程來源面板 | 搬入唯讀資料與必要延遲載入；無效入口顯示未遷入 | 按能力逐批接上 |
| 舊八課、獨立評量、retention | 既有紀錄保留、可唯讀備份；頁面未搬 | 各自驗收再遷移，不能以閱讀標記替代 |
| Buck / Boost 比較 | PR #46 已發布，正式版本 84162dd4；workbench/topology.html | 僅原 owner 的手動設定；CCM 穩態，不帶儲能或故障狀態 |
| Module 17 四應用 | PR #47 已發布，正式版本 36abe27f；workbench/applications.html | 各自原工具條件；不自動套 Buck 參數或授予正式能力成績 |
| Module 1 ADC | PR #48 已發布獨立訊號鏈計算器，版本 2b9c516f；舊逐課頁未搬 | 保留舊課 LSB 矛盾待核對 |
| Module 12 OP AMP | PR #49 已發布階躍／正弦實驗（b4a3588e）；本批接入六篇觀念課 | 六篇靜態觀念課與原實驗銜接；診斷、DC Trainer 與正式評量未搬 |
| Module 9 AFE 雙向功率控制 | 尚未遷入；不是 ADC 類比前端 | 列為功率控制批次，不能以 ADC 教材入口代替 |
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

## 第二批：Buck / Boost 比較
EE 起點 9a4a2603c974ae22998bdfe4348890c00e146300；來源仍固定 11ef4e4801b5283f265dc349a4afec0027603228。
新增 topology.html / ee-topology-entry.js 與來源比較 UI。Numerical registry、Workspace core、Evidence、CoreFlow、curriculum 維持原樣。共用 ee-host 的白名單、flush、raw schema guard，並在 await 保存後再驗原始版本；跨分頁比較紀錄衝突停止並保留唯讀備份。
原數值契約只允許前後工作點的 Buck/Boost 均 CCM；無效或不相容紀錄不重設成預設成功。八步已讀、引導比較通過、正式評量與 Board evidence 仍分開。
新增來源 topology-workspace / topology-transfer tests、整合契約與三瀏覽器實際 DOM 驗收。發布 SHA 檢查同時驗工作台入口、比較 UI 與模型契約資產。

## 第三批：四種電路應用（PR #47 已發布）
EE 起點 `84162dd465385f0b467ca3584ba4cc1cfa15a3f9`；Circuit 來源固定 `11ef4e4801b5283f265dc349a4afec0027603228`。

- 從 Buck／Boost 完成按鈕與現行 applications 建議路線進入本站 `applications.html`；返回經原 host / Evidence.flush，未知目標不放行。
- 原 Module 17 主內容、控制範圍與圖形保留。僅移除未遷入的全站 tutor／learning-bridge 和 p5 正式轉移評量 bootstrap；正式評量、複習、韌體與 Board evidence 尚未遷入。
- PFC 只改 C=500→1000 µF；PSFB 只改主側電流 10→2 A，保留 Ns/Np=.08 與 Ceq=1 nF；LLC 只改 120→180 kHz；LCL 只改 10→20 µF。原規劃、單位轉換與計算／proof owner 不變。
- 操作、觀察與原因各自記錄。首次答錯原樣保存；已保存對照不是目前控制項狀態。初次開啟／重載不自動套參、不寫入成功證據。
- 新的 `ee-applications-contract.js` 僅讀取並拒絕不相容／不完整紀錄，不是另一套評分器。模型 ID／版本、條件、單位與結果須吻合原 owner；舊 raw bytes 不能被重標或正常化。跨分頁、鎖等待、quota 與異步版本變更保留原防護。
- 原 `learning-evidence`、`workspace-core`、`model-registry`、`topology-transfer-v1`、curriculum、CoreFlow、PlainCourse 等數值／判定／儲存 owner 保持原樣。`topology-application-ui.js` 的適配記錄在 source-manifest。
- 新增四個 Node 整合契約檔和一個三瀏覽器真 DOM suite；原有測試全部保留。發布檢查新增頁面／entry／validator／UI／style／atlas 資產。
- 原本地交接階段的環境限制已解除；PR #47 的獨立審查、PR CI、main CI 與 Pages 驗收已完成（36abe27f）。後續批次仍各自驗收。

## 第四批 4a：ADC 訊號鏈計算器（PR #48 已發布，2b9c516f）
基準 EE `36abe27f619bcb39397913ada3fb1832ca49ca6b`；Circuit 來源仍固定 `11ef4e4801b5283f265dc349a4afec0027603228`。
僅遷入 `1_c2000_adc_calculator/c2000_adc_calculator.html` 的獨立計算器至 `workbench/adc.html`。原數值核心不改；教材入口、保存後引用路徑與固定本地返回接入。計算器沒有讀寫學習儲存，輸入僅在本頁及使用者複製的參數 URL 中；教材已讀、實驗與評量狀態不合併。
失效輸入、數值溢位或資產缺失會清除舊結果並禁止複製 C 參數；正常輸入可恢復。預設 Gain=8.2 / Offset=1.65 V，與 EE P.106 的 Gain=14 / Offset=1.5 V 明確分開。

### 待解來源一致性（未帶入本站）
固定來源 `1_adc_basics.html` 的提示與回顧將 `Vref/(2^N-1)` 稱為 LSB，並使用 rounding；同一來源的完整計算器及 `engineering-models.js` 則定義 LSB=`Vref/2^N`、code=floor。這是來源內部矛盾，並非本次改寫。舊 ADC 逐課頁、lessons.js 進度機制、AFE/OP 及硬體 ADCRESULT 時序均仍待分批核對與遷移；不能把本計算器當成整個 Module 1 或板級驗證已完成。

## 第四批 4b：OP 階躍／正弦實驗（PR #49 已發布，b4a3588e）
基準 EE `2b9c516fc57538f7d7bd5f33881a0cdd3884362f`；來源維持 `11ef4e4801b5283f265dc349a4afec0027603228`。

- 來源 `12_opamp_slew_rate/lab_step.html` 與 `lab_sine.html` 遷為本站 `opamp-step.html`、`opamp-sine.html`。原 `assets/opamp.js` 數值與繪圖核心、`opamp.css` 原樣保留；只適配導覽、載入與輸入保護、無障礙標示與行動版佈局。
- 從上冊 OP 教材及 ADC 計算器可進入。工作台引用僅接受兩個精確來源路徑，仍由原 `EEWorkbenchHost.leave` 執行保存前後檢查與 `Evidence.flush`。尚未搬入的 OP 逐課、診斷、reasoning trainer 入口明確導向範圍說明。
- 不匯入 tutor、learning-bridge、評量 oracle 或作答紀錄寫入器。正弦來源的 Pass contract 文字保留，但明示本批未啟用；不授予 A 級、正式通過、已讀或 BOARD_PASS。
- 兩頁不讀寫學習儲存，不承接或保存 ADC／Buck 參數。離開及重載回到各頁原預設值。非法輸入清除舊讀值並隱藏曲線；資產或繪圖失敗維持停用狀態。
- 分類更正依來源 `9.afe-tutorial/README.md`：Module 9 是「AFE 雙向控制模擬器」，並非類比前端。移除將這個未遷入工具導到 ADC 教材的錯誤對應，原來源內容不改。
- 舊 ADC 逐課 LSB 矛盾及其他未遷入功能繼續列案。完整瀏覽器 CI、獨立審查、正式發布必須另驗；本地套件不是發布證明。

## 第四批 4c：OP 六課觀念（本批範圍；發布狀態以對應 PR／CI 為準）
基準 EE `b4a3588ec121c7b685e3aa4ac6044d8de1ee2d31`；Circuit 仍固定 `11ef4e4801b5283f265dc349a4afec0027603228`。
六個 `12_opamp_slew_rate/01...06` 概念頁與 `opamp-course.html` 在本站直接閱讀；原課順序、例題、推導保留，透過上冊 OP 與既有 step/sine 實驗進出。精確來源入口仍經原 host 保存；未知、診斷、DC trainer 與評量路徑維持未遷入。
全部新頁是無腳本靜態閱讀，不讀寫已讀或實驗紀錄，不授予正式分數／實機通過。沒有另建模型、資料格式或第二套學習首頁。
明示內容修訂：第六課原句的 `noise gain / GBW` 與頻寬量綱不符；改為主導單極點電壓回授近似 `BW ≈ GBW / noise gain`。頁內保留原句與官方 Analog Devices AN-940 Noise Gain 段依據；此改動不回寫舊來源，也不修改原數值／繪圖核心。
新增 source-body 雜湊、精確路由與保存失敗／版本變動測試、無 JavaScript 與三瀏覽器閱讀流程、各新資產缺失發布反例。舊整站測試不刪除。合併與發布仍須 exact-head review、PR CI、new-main CI、Pages／hosted SHA；不以本地 Node 成績替代。
