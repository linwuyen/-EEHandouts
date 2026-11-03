# 工程 Review 修正與驗收契約

基準：`462f860bea52f7bffe936e6eacd2f3e359d5cbdd`。
本批限於既有 Review 的 F01–F04，以及 O01 的 UI 能力邊界標示。
不新增拓樸模擬器，不變更 72 節課、154 頁逐頁導讀或硬體控制。

## 逐項修正

- **F01 / PSFB**：`vraw=abs(vAB)/n` 是原始整流候選電壓；`vrect` 是輸出電感左端節點。DCM ZERO 時二極體路徑截止、`iL=0` 不變，因此 `vrect=Vo`、`vL=vrect-Vo=0`。trace 與 probe 共用同一 state。未加入漏感、循環電流、ZVS、寄生振鈴或同步整流。
- **F02 / H-Bridge**：電氣 phase 可在週期末重置，但顯示時間不重置。在右端 `x=356` 畫下一週期的垂直重置邊；不得倒畫回 `x=38`。Unipolar/Bipolar 的平均值、互補 B 與使用者設定 ownership 不變。
- **F03 / 多次級變壓器**：保留各工作點指定同相次級 RMS 電流的模型（1 A / 0.5 A），移除「固定電阻」矛盾。調壓時若以電阻實現此條件，電阻須重設。沒有新增真正 cross-regulation 計算。
- **F04 / P.106**：正式公式本來正確，不改教材內容。測試讀取實際 TeX／備援文字中的係數與單位、給定元件、例題及反算，連同課節公式與實際 ADC 模型，對照獨立固定數值 oracle。解析器只支援這一頁已知的仿射格式，非通用 TeX parser；未知格式 fail-closed，需人工檢查。
- **O01 / 時序 UI**：分別顯示時脈／取樣窗、本模型假設性運算預算、ADCRESULT 可讀時刻。最後一項一律 `NOT_VERIFIED`；不新增 datasheet 延遲常數或宣稱實機 timing sign-off。原本時序計算與 `validity` 語意保留。

## 必要驗證

`npm test` 與 `npm run test:cross-browser` 都必須通過。既有測試不可刪除。

- `advanced-engineering.mjs`：原始 DCM 反例、CCM/BCM/DCM 兩半週內部取點 KVL、trace/probe 一致性、BCM 邊界連續性與平均功率；時序驗證範圍保持分離。
- `bridge-wave-contracts.mjs`：882 組模式/Duty 組合；實際 SVG 的 x 單調、38/356 端點、VA−VB=VAB 與面積平均值。只在 VM 內暫時暴露原 private renderer，不寫入產品 test hook。
- `interactive-engineering.mjs`：96 V / 192 V / 匝比變化的指定電流數值、VA 平衡與原預測題標的。
- `upper-analog-control-guides.mjs`：P.106 顯示→例題→課節→計算器契約，獨立檢查 −20/−10/0/10/20 A。
- `adc-content-mutations.mjs`：12 個係數／符號／單位／例題／反算錯誤，必須由 ADC 顯示契約拒絕；mutation 僅在暫存副本，測後刪除。
- `review-fixes-smoke.mjs`：真實 DOM 的 PSFB ZERO 游標、H-Bridge SVG、變壓器預測與功率、P.106 公式/例題/計算器，以及強制 KaTeX 備援。於 Chromium 與獨立 Firefox/WebKit job 執行。

## 發布與回滾

僅在 exact PR HEAD 的原有與新增回歸成功、Review 問題結案後考慮合併。合併後仍需 main CI、Pages 部署與 hosted SHA 驗證；PR CI 不代表已上線。

根因修正採獨立提交。回滾時一併回退該根因的實作與對應測試／測試接線，不以刪除斷言掩蓋失敗。F04 不變動產品公式；O01 不改硬體模型參數。
