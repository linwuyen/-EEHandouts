# EE Handouts｜電力電子主題學習網站

以《電力電子學（初級班）上冊 R2》107 頁講義為學習脈絡，重新編排成 7 個可自由跳讀的主題。文字採繁體中文，重點放在物理直覺、訊號／能量流、公式條件，以及數位電源工程應用。

## 分冊入口

- **上冊（原有網站）**：[index.html](./index.html)，107 頁、原有七個主題與完整實驗功能保留。
- **中冊（新網站）**：[middle.html](./middle.html)，52 頁、七大主題、34 個教學小節、七種可調參數工程實驗、每節的觀念測驗。
- 兩冊沿用同一份導覽／互動程式和 CSS，學習進度獨立儲存（上冊 `ee.done`、中冊 `ee.middle.done`）。
- 在主頁或側欄點擊「中冊 · DC-DC 52 頁」即可切換。

### 中冊的七大主題

1. **DC-DC 與 Buck 控制**（P.2–6）：基本拓樸、PWM、LC、Q 值與伏秒平衡
2. **CCM、DCM 與 BCM**（P.7–9）：電感電流波形、邊界及 DCM 轉壓比
3. **Boost 升壓與損耗**（P.10–22）：漣波、寄生平均模型、效率與 DCM
4. **Buck-Boost 與雙向 DC-DC**（P.23–28）：Ćuk、SEPIC、ZETA、四開關升降壓
5. **H-Bridge 與 PWM 四象限**（P.29–32）：DC 馬達、Bipolar、Unipolar
6. **隔離式電源與 Flyback**（P.33–40）：隔離回授、多組輸出、CCM/DCM
7. **Forward、橋式與磁芯設計**（P.41–51）：Forward 去磁、半橋、全橋、Push-Pull、B-H／鐵損

中冊提供 **52 頁原講義的人工摘要**，不公開原 PPTX/PDF 或原投影片圖片。要對照圖表，請先把中冊 PPTX 匯出成 52 頁 PDF，於中冊任一頁自行載入。PDF.js 會檢查 **52 頁**及第 1、2、7、10、23、33、37、41、51 頁的跨章節文字特徵，通過後才在本機 Canvas 顯示；泛用的 Converter 字樣不再足以通過。PDF 位元組僅存於瀏覽器本機 IndexedDB，與上冊資料分開。

**第三輪模型與圖形修正：** 中冊 Boost 以理想非同步 CCM／BCM／DCM 分段穩態模型計算，在 DCM 不再顯示失效的 CCM 增益與峰值電流；中冊 H-Bridge 明定兩種可切換的理想同步前緣 PWM（單極性同載波／雙極性互補），三條波形 VA、VB、VAB 由橋臂狀態生成，未包含 Dead Time；上冊 ADC 只繪 0–3 V 有效理論輸入區間，超界處以警告區域表示，絕不暗示硬體具有限幅。雙向電源零功率圖改為中性狀態。這些都是**教材中的理想模型**，不得當成元件選型或實測證據。

**第四輪模型與 UI 修正：** Boost 220 μF 輸出電容的電壓漣波依理想二極體導通波形積分 \(i_C=i_D-I_o\) 計算，涵蓋 CCM／BCM／DCM 與 OFF 區段內電容電流換向；顯示單位改為 **mVpp**，避免小漣波被四捨五入成 `0.00 V`。此模型假設定電流負載、輸出電壓每個開關週期僅小幅變動，未包含 ESR／ESL、寄生與實機暫態。H-Bridge 的 Bipolar 模式會停用 B Duty 滑桿並顯示 `B = 100% − A` 的有效值；切回 Unipolar 時恢復使用者先前的獨立 B Duty 設定。

**工程限制：** 各個可調參數實驗都是理想或簡化模型，必須依 CCM/DCM、Duty、寄生與磁芯材料等假設解讀，不能代替硬體設計驗收。Buck／模式實驗以非同步 Buck、固定 Duty、定電流負載推導三段穩態 DCM；進入 DCM 後電感電流不會變負。其他實驗中的部分 SVG 仍是明確標示的示意波形，不是實測。

## 七大主題
1. 交流電與功率（講義 P.3–11）
2. 磁路、電感與變壓器（P.12–26）
3. 電力電子系統與 PWM（P.59–62）
4. 功率半導體與損耗（P.27–58）
5. 單相整流器（P.63–82）
6. 三相系統與整流器（P.83–96）
7. OP、類比回授與 ADC（P.97–106）

## 功能
- 首頁主題卡片、側欄章節切換、課節導航與全文關鍵字搜尋
- 每個課節有白話解說、重要公式、例題、常見誤解與自我測驗
- 全部可數學排版的重點公式使用 **KaTeX 0.19.1**（固定版號與 SRI 完整性校驗），上冊／中冊共 71 節、119 條公式；每條獨立標示適用場景，分數與上下標依數學格式排版。另有一節純文字選型觀念維持原文。
- KaTeX CSS/JS 由 jsDelivr 載入；若 KaTeX JavaScript 或 CSS 任一資產無法載入，保留原本的文字公式作為可閱讀備援，不影響章節導覽與測驗。
- 長公式在手機僅於公式區域水平捲動，不造成整頁橫向溢位。
- 每個主題提供一個可調參數的工程小實驗
- **上冊 38 節＋中冊 34 節，共 72 節都有獨立研究問題和即時互動操作**。`interactive-lessons.js` 提供 47 種明確標示適用條件的工程模型，以「預測指定單一參數變更 → 套用比較值 → 觀察 → 比對」流程操作；每節有滑桿、數值輸出、曲線／同步波形和重設。
- Buck、Boost、反相 Buck-Boost、Flyback、Forward 等提供同步 Gate **邏輯指令（0/1）**、開關節點／繞組電壓、電感或磁化電流；時間游標對齊 ON／OFF／ZERO 區間。指令不是 MOSFET 的實際 VGS，也不是開關節點電壓。
- SCR 觸發角、Boost 串聯銅損、輸出電容近似、光耦 CTR、帶限微分器、四開關升降壓、H-Bridge 單極性／互補波形、ADC 超界等使用專題模型。這些是**教學用理想或簡化模型**，不是 SPICE、元件選型或實機測量。
- **全部 107 頁**可搜尋的標題與原講義文字索引（含封面、課程安排與結語）
- 每頁皆可在瀏覽器**載入本機原講義 PDF**。使用 PDF.js 解析，先驗證 **107 頁**與首頁／第 24 頁的講義標題，再將真正的 PDF 頁面渲染為 Canvas；PDF 位元組儲存於本機 IndexedDB，不會上傳到伺服器
- 閱讀完成標記、學習進度保存於瀏覽器本機、深色／淺色模式
- 手機及桌面版自適應；純 HTML/CSS/JavaScript，不需 npm 或伺服器後端

## 使用方式
直接開啟 `index.html`，或在本資料夾啟動任何靜態網站伺服器。

### GitHub Pages（驗證後發布）

正式網站：<https://linwuyen.github.io/-EEHandouts/>。

在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，Repository Variable `EEHANDOUTS_ACTIONS_PAGES=true` 啟用後，`.github/workflows/publish-verified.yml` 只會發布**通過 Verify EEHandouts 的 main SHA**。

發布流程使用 `queue: max`（不取消正在執行的驗證版本部署），避免較早完成的 CI 事件取消新版部署。發布前會再次向 GitHub 查詢最新 `main` HEAD；若測試 SHA 已過時便略過發布，並在打包前、部署前各核對一次，降低舊版覆蓋新版的風險。部署與 CI 分開執行；已通過 CI 不代表 CI 能阻止直接 push 到 `main`。仍應設定 Rulesets 要求 PR 與必要狀態檢查。

### 本機與 CI 驗證

測試依賴由 `package.json` 與 **`package-lock.json`** 固定。使用 Node.js 22（正式網站不需要 npm；本機 PDF 閱讀前需準備一次 PDF.js 資產）：

```bash
npm ci --ignore-scripts
bash scripts/prepare-pdfjs.sh  # PDF.js 4.10.38；檢查 npm tarball SHA-512 後產生 vendor/pdfjs/
npx playwright install --with-deps chromium firefox webkit
python3 -m http.server 4173
# 另開終端機：
npm test
npm run test:cross-browser  # Firefox / WebKit 額外小型回歸
```

`npm test` 先檢查部署防回退守門程式（current/stale/API-error）、Action Runtime／lockfile／重複測試，再跑上冊、中冊、KaTeX 公式的 Chromium Regression。CI 固定 `ubuntu-24.04`，GitHub Actions 使用 Node.js 24 Runtime 的新版 Action。

### 原講義 PDF 對照

1. 將你持有的《電力電子初級班講義（上）R2.pptx》以 PowerPoint 或 LibreOffice 匯出成 **107 頁 PDF**。
2. 網站選 **完整 107 頁講義** → 任一頁 → **載入原始講義 PDF**。
3. 網站會檢查實際頁數與首頁／第 24 頁的標題；驗證通過才可閱讀、儲存。本機檢視器真正渲染每頁影像（不是只改 PDF iframe 錨點）。
4. PDF 在瀏覽器本機 IndexedDB 儲存，可按「清除這台裝置的 PDF」移除。PDF.js 4.10.38 解析模組與 Worker 由建置時以 npm SHA-512 校驗後複製至同源 `vendor/pdfjs/`，瀏覽器讀取 PDF 不再依賴 PDF.js CDN；本機開發請先執行 `bash scripts/prepare-pdfjs.sh`（此建置步驟需要網路）。不支援／無法讀取文字的掃描版 PDF 可能無法通過身分校驗。

網站不附帶原 PPTX/PDF 二進位檔，避免未經確認公開轉載講義；你在網站載入的檔案不會傳送到 GitHub。若瀏覽器禁止 IndexedDB，重新整理後可能需重新選取。

## 新增互動研究範圍
- **事前預測狀態機：** READY → PREDICTED → REVIEWED。先調整參數或選「直接探索」則進入 EXPLORING，不能事後看答案再評為預測正確，重設才能重新作答。波形與曲線在作答／探索前不顯示。
- **適用域：** 小漣波整流模型預設使用 1650 μF，超過 20% 教學門檻時只顯示外插提示、不提供有效漣波估值或有效預測評分；磁路超過 0.3 T 教學門檻時明確標示固定 μ 外插。警告不等於硬體限幅。
- **專題反例：** 功率方向實驗翻轉 ±2 A；降低效率看 Pin；線性穩壓器看 (Vin−Vo)Io；高銅損 Boost 在 CCM 顯示 Duty 增加而 Vout 下降；OP 增益跨越理想 ±12 V 裁切邊界；H-Bridge 顯示 VAB 零電壓比例。
- **ADC：** 上冊章節實驗與課節模型統一使用教學用 12-bit、4096 等間距量化區間（對 0–3 V 取 floor，3 V 端點為 4095）；ADC 課節預設 Shunt 5 mΩ、Gain 14、偏壓 1.5 V，I=+10 A 時 Vadc=2.20 V、Code=3003，與教材公式一致。實際 C2000 ADCRESULT 仍須核對型號 TRM、參考電壓及轉換誤差。
- 三相六脈波線電流使用固定 DC 電流、120° 導通模型；三相電容輸入整流使用含等效來源電阻的逐時充放電模型。兩者**不可混用**，後者省略源側電感、二極體與 ESR 等寄生。六脈波諧波課節固定顯示第 5、7 次線電流 RMS 與比值，預測改由調整 Idc 驗證同一物理量，而非把切換觀察階次誤認為諧波變動。
- 磁芯損耗只做固定磁通擺幅的歸一化相對比較，不推算材料實際 W；Push-Pull 以 A/B 伏秒差顯示 flux walking 風險。
- Half/Full-Bridge 的輸出比僅使用講義約定的 `0<D<0.5` 兩個對稱脈波定義，其他 PWM 定義不可直接代入。
- 72 節都有可調模型；**不是全部 159 張原投影片都能逐像素操作**。原始 PDF 仍由使用者本機載入對照。
- 模型有適用條件，例如 Sallen-Key 章先用一階 RC 基礎對照、Boost 銅損只示範已驗證 CCM 的平均穩態、Forward 只計伏秒，不能推定硬體安全或迴路穩定。
- 預測功能固定其他參數與初始工況，指定單一比較方向與值；必須先作答才能揭曉曲線。先看到改變後的結果或直接探索，不能補作答取得事前預測分數。超出模型適用域也不宣稱預測正確；非單調曲線只比較指定變更，不預設全範圍單調。

- **三相時間游標：** 三相線電壓與六脈波整流使用同一時間快照產生數值、波形與導通相別。相位旋鈕是起始角、游標 t/T 對應額外 360°×t/T；0%、25%、75% 的瞬時值應一致。相電壓相等時標示「換相邊界」與候選相，無源側 L 的理想模型不能決定瞬間電流分配。拖曳游標更新即時數值，但事前預測評分仍固定使用 25% 的初始比較時刻。

## 範圍與限制
- 文字搜尋支援「25」「P.25」「第25頁」「頁碼 25」。抽取結果只有頁碼的圖形型投影片會提示必須查看原始 PDF。
- 本站提供主題重整、教學補充、完整頁碼及文字擷取。原始 PPTX 中以圖片形式存在的公式、波形及示波器截圖**不會被文字擷取取代**，請在原講義 PDF 檢視器核對；此 PDF 須使用者自行載入。
- 磁路互動圖顯示 **固定 μ 的線性磁路 B(I)** 工作關係，不宣稱模擬磁性材料的 B-H 曲線或飽和。
- PCC 公式分開標示時域 R/L 壓降與頻域第 h 次諧波的相量阻抗；不可直接將複數阻抗乘上時間訊號。
- 整流器的 ΔV≈I/(2fC) 為小漣波模型；本站設 ΔV/Vpeak≤20% 為教學近似的顯示門檻（不是設計標準），超界便停止給出 DC 平均值與該模型的電容波形。
- 小實驗使用理想或簡化模型，已標示適用條件；不得取代 datasheet、TRM、實機驗證或安全設計。
- 使用者的閱讀記錄僅保存在瀏覽器的 localStorage，不會送往伺服器。

## 結構
- `index.html`：語意化網站結構
- `styles.css`：響應式視覺設計
- `data.js`：七章課程與講義頁碼資料
- `app.js`：導航、搜尋、測驗、學習進度和 KaTeX 公式插入
- `formula-math.js`：上冊／中冊經人工編寫並分段呈現的數學式資料
- `labs.js`：七個互動實驗與數學模型
- `interactive-lessons.js`：72 節的研究題、47 種可重用模型及同步波形（上冊／中冊共用）
- `slide-text.js`：從使用者提供的 107 頁 PPTX 擷取的原文
- `source-viewer.js`：同源固定 PDF.js 模組解析及身分／頁數驗證、Canvas 繪製、IndexedDB 本機保存；不向網站後端上傳 PDF
- `tests/smoke.mjs`：Playwright 真實瀏覽器測試
- `tests/interactive-smoke.mjs`：逐一操作上、下冊 72 節的預測、滑桿、時間游標、重設和手機版檢查
- `tests/interactive-engineering.mjs`：獨立數值 fixture，驗證 CCM/DCM、Boost 適用域、反相 PI 相位、Gate/Vsw/VL、三相整流諧波與電容能量平衡、Push-Pull、Forward、Bridge、SCR、CTR、ADC 模型
- `tests/middle-engineering.mjs`：七個中冊互動模型、Buck CCM／BCM／DCM 公式與實際模型電流波形的獨立預期值測試
- `.github/workflows/verify.yml`：每次推送執行桌機／手機及數學邊界回歸測試
- `.nojekyll`：GitHub Pages 靜態資產處理

## 驗證

Node.js 22 開發環境：執行 `npm ci --ignore-scripts`，再安裝 Chromium、啟動本機靜態網站後執行 `npm test`。完整測試分為守門程式 `tests/release-guard.mjs`、上冊 `tests/smoke.mjs`、中冊 `tests/middle-smoke.mjs`、中冊工程模式與 Buck DCM `tests/middle-engineering.mjs`、公式排版 `tests/math-smoke.mjs`、`tests/interactive-smoke.mjs`。上冊／中冊都有 PDF 測試、手機顯示與錯誤條件檢查；工具程式和固定相依版本見 `package.json`、`package-lock.json`。

本專案由使用者提供的講義與前述學習討論整理而成。
## 內容權利提示

此 repository 是公開的，`slide-text.js` 含有從使用者提供之講義擷取的原文字。公開文字應取得適當使用／散布權限；程式與 PDF 私有載入機制本身無法替代權利確認。如果講義並非自己所有或可公開散布，請停止公開擷取原文並向權利人確認。**Git 歷史可能保留既有公開內容**，後續直接刪除檔案不一定等於刪除歷史。

### 2026-10-30 Release / Browser Review

- H-Bridge 的 VA、VB、VAB 是理想同步數位切換波形，切換點以垂直邊緣顯示；不代表有限上升／下降時間或 Dead Time。
- `queue: max` 允許多個 CI 完成事件待部署，仍需經過雙重 SHA freshness guard；大量事件超過 GitHub concurrency queue 上限時可能被拒絕，不能視為完整的排隊保證。
- 上／中冊 PDF.js 模組和 Worker 由 `scripts/prepare-pdfjs.sh` 於 CI 與發布時取得固定版號的 npm 發行包並驗證 SHA-512，再一起部署。這仍需要 CI runner 在建置時能存取 npm registry，但學員瀏覽器不需要 PDF.js CDN。
- GitHub Repository Ruleset 必須由具備管理權限者於 Settings → Rules → Rulesets 設定；至少保護 `main`、要求 PR、`browser-regression` 等必要檢查、禁止 force-push。**未完成設定前不可宣稱 `main` 已受到強制保護。**

- CI 新增獨立 `cross-browser` job，執行 Firefox + WebKit 的手機導覽、搜尋鍵盤焦點、互動預測狀態、H-Bridge 階梯波及同源 PDF.js 資產回歸；保留原 `browser-regression` Chromium 完整回歸。設定 Ruleset 時須同時要求兩個 job 成功。


## 進階電力電子實驗室（獨立於 72 節教材）

第三入口 [advanced.html](./advanced.html) 提供七種參數互動模型；不改變上冊 38 節、中冊 34 節、47 個原有課節模型與讀書進度。

1. **Boost PFC**：單相整流源的指定市電相位，固定 DC Bus，理想 CCM／BCM／DCM 分段 Duty、Gate/IL/VL/VSW 同步波形；由理想線電流命令導出整流瞬時輸入功率。**不是**整個 50/60Hz 週期的 PF/THD、外電壓迴路或整流橋損耗模擬。
2. **LLC**：半橋 ±Vin/2 方波、Lr/Cr/Lm 開關週期時域隱式梯形積分，使用經 FHA 近似的整流等效負載 Rac=8 n² Rdc/π²；觀察諧振電流、磁化電流、電容電壓、儲能及基波輸入阻抗相位。Rac 線性等效負載會吸收高次諧波，所以 FHA 基波換算 DC 功率與 Rac 全頻帶耗散不一定相等；兩者已分開顯示。無法由電感性相位直接確認實機 ZVS，不計非線性二極體與 Coss。
3. **PSFB**：雙橋臂 50% 相移、一個週期內 ±Vin/0、次級理想全波整流和輸出濾波 L CCM/BCM/DCM；只示範理想有效 Duty，未計循環電流、漏感換流 Duty Loss 或 ZVS。
4. **Bode / 補償**：電壓模式 Buck **CCM** 小訊號 L/C/ESR 電壓植物，PI + 高頻極點、PWM ramp 和固定延遲；掃描所有 0dB 交越，顯示相位與增益裕度。多重交越警告；無完整 z-domain/ZOH、電流內迴路或大訊號穩定證據。
5. **C2000 ePWM/ADC/ISR**：以 F28004x UP-DOWN TBCLK 量化，SOCA ZERO/PERIOD/CMPA up/down → ADC acquisition/EOC → ISR → CMP shadow load；ADC 與 CPU 延遲為使用者假設值，不是特定晶片測得時間或可直接套用的暫存器設定。
6. **同步 Buck 非理想**：高低側 RDS(on)、DCR、Body Diode Dead Time、Eon+Eoff 和 ESR；比較電壓、效率、電感/電容波形，並做平均能量平衡。僅適用正向 CCM。
7. **PSFB ZVS 前提**：Llk 電流儲能對兩顆等效 Coss 充放能量、Dead Time 粗估需求，不宣稱完整換流或 ZVS 已達成。

測試：`npm test` 必須執行 `tests/advanced-engineering.mjs`、`tests/advanced-smoke.mjs`；`cross-browser` 額外在 Firefox/WebKit 驗證 7 個新實驗與 390px 顯示。原有基礎教材和 PDF Regression 保持完整。

工程參考：
- TI [Boost PFC Modes](https://www.ti.com/document-viewer/lit/html/SLUAAO8/GUID-86F7AD2D-7DF0-45E7-B7A9-79F8DC862F14)
- TI [PSFB Operational Principles](https://www.ti.com/document-viewer/lit/html/SLUP414/GUID-C4C4C20D-3B3D-4298-813F-5E3A9DA91B12)
- TI [TMS320F28004x TRM](https://www.ti.com/lit/ug/sprui33c/sprui33c.pdf)
