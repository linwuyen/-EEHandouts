# EE Handouts｜電力電子主題學習網站

以《電力電子學（初級班）上冊 R2》107 頁講義為學習脈絡，重新編排成 7 個可自由跳讀的主題。文字採繁體中文，重點放在物理直覺、訊號／能量流、公式條件，以及數位電源工程應用。

## 分冊入口

- **上冊（原有網站）**：[index.html](./index.html)，107 頁、原有七個主題與完整實驗功能保留。
- **中冊（新網站）**：[middle.html](./middle.html)，預設為 R2 的 169 頁逐頁導讀及索引。前 51 頁與 [52 頁版](./middle.html?edition=52) 共用，舊版結語在 P.52，R2 結語在 P.169。
- 兩冊沿用同一份導覽／互動程式和 CSS，學習進度獨立儲存（上冊 `ee.done`、中冊 `ee.middle.done`）。
- 在主頁或側欄點擊「中冊 · DC-DC R2 · 169 頁」即可切換。

### 中冊前 51 頁的七大主題

1. **DC-DC 與 Buck 控制**（P.2–6）：基本拓樸、PWM、LC、Q 值與伏秒平衡
2. **CCM、DCM 與 BCM**（P.7–9）：電感電流波形、邊界及 DCM 轉壓比
3. **Boost 升壓與損耗**（P.10–22）：漣波、寄生平均模型、效率與 DCM
4. **Buck-Boost 與雙向 DC-DC**（P.23–28）：Ćuk、SEPIC、ZETA、四開關升降壓
5. **H-Bridge 與 PWM 四象限**（P.29–32）：DC 馬達、Bipolar、Unipolar
6. **隔離式電源與 Flyback**（P.33–40）：隔離回授、多組輸出、CCM/DCM
7. **Forward、橋式與磁芯設計**（P.41–51）：Forward 去磁、半橋、全橋、Push-Pull、B-H／鐵損

中冊的 P.52–168 對應 R2 新增的驅動、保護、Buck 控制與 Flyback 內容。可從首頁主題連結或完整頁碼索引進入。原圖請以自己持有的中冊 PPTX 匯出可搜尋的 52 或 169 頁 PDF，於任一頁載入。網站按版本核對並顯示對應頁，舊版沒有對應圖的頁面仍可閱讀導讀。PDF 僅保存在本機瀏覽器，與上冊分開。

**第三輪模型與圖形修正：** 中冊 Boost 以理想非同步 CCM／BCM／DCM 分段穩態模型計算，在 DCM 不再顯示失效的 CCM 增益與峰值電流；中冊 H-Bridge 單極性採用原圖的同一對稱三角載波，一個週期出現兩個差動脈衝；雙極性兩臂互補。VA、VB、VAB 依理想橋臂狀態繪製，忽略 Dead Time。上冊 ADC 只繪 0–3 V 有效理論區間，超界處以警告區域表示。雙向電源零功率圖改為中性狀態。這些都是**教材中的理想模型**，不得當成元件選型或實測證據。

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
- 全部可數學排版的重點公式使用 **KaTeX 0.19.1**（固定版號與 SRI 完整性校驗），上冊／中冊共 71 節、120 條公式；每條獨立標示適用場景，分數與上下標依數學格式排版。另有一節純文字選型觀念維持原文。
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
npx playwright install --with-deps chromium
python3 -m http.server 4173
# 另開終端機：
npm test
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
- 72 節有可調模型。逐頁讀圖可載入本機的原始 PDF 對照。
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
- 維護者在 Settings → Rules → Rulesets 設定 `main` 保護，要求透過 PR 合併並禁止 force-push。必要狀態檢查只選 `browser-regression`，它會執行 Node 測試及 Chromium 桌機、手機回歸。如果現有規則仍勾選舊的 `cross-browser`，請從必要檢查中移除。


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

### 2026-10-30 非理想同步 Buck Review 修正

- 四段 DEAD1/HIGH/DEAD2/LOW 直接以實際切換邊界解析積分電感電流，不再用固定 480 midpoint 樣本推斷零電流邊界，也不將最後一個樣本強制連回起點。輸出電容依 iC=iL−Io 計算連續電荷和電流 RMS，並求含 ESR 電壓漣波的區間內極值。
- 新增 P_ESR=R_ESR×I_C,rms² 至總損耗、等效所需輸入功率與效率預算。**重要限制**：Vo 與電流斜率仍採固定 Duty、平均 Io 近似；ESR 視為維持同一平均輸出所需的額外功率，並非完整耦合的 RLC switching transient。MOS 與 DCR 的導通損仍採平均 Io 近似，能量帳的代數殘差為 0 不是實機準確證據。
- Regression 加入 125 kHz、40% Duty、175 ns Dead Time、16 Ω、40 µH 的 −1.53 mA CCM 失效反例，以及 ESR 0→100 mΩ、6 App 漣波新增 0.30 W 損耗的獨立分析／UI 測試。

### 2026-10-30 Bode／教學曲線有效域修正

- Buck CCM Bode 不再只靠固定 220 個顯示點判斷交越，改為定位對數頻率增益局部極值，對有號變化的區間二分求出每個 0 dB 交越，保存各自 PM；遇多交越會顯示警告，而非以第一個 PM 宣稱穩定。Bode 圖以實際 log(f) 放置非等距的極值和交越樣本。
- 72 節互動課的參數掃描要求數值有限且 `validity.scorable !== false`。磁性件固定 μ 超過 0.3 T 模型有效域與 ADC 超界時，將該區段斷開且不畫有效值標記。數學外插仍可依文字警示說明，但不可混入有效工程曲線。

### F28004x 時序模型的硬體限制（2026/10/30）

- 由 **SYSCLK → EPWMCLKDIV → HSPCLKDIV／CLKDIV → TBCLK** 推導計數時脈（F28004x 最大 100 MHz SYSCLK），不再讓使用者將 200 MHz TBCLK 假設成合法設定。TBPRD、CMPA 依衍生時脈量化，過小／不可能的設定顯示 `OUT_OF_DEVICE_DOMAIN`。
- ADC 取樣窗由整數 **ACQPS** 計算：`tSH=(ACQPS+1)/SYSCLK`；依 TI F28004x 最新 datasheet 的 75 ns 下限（Rs≤50 Ω）和至少 1 ADCCLK 週期檢查。100 MHz SYSCLK 下最短整數可設定值為 80 ns；高源阻抗仍需更多 settling 時間，不能把下限當成足夠取樣保證。
- `SAME_PWM_CYCLE` 代表 shadow load 位於當前 TBCTR ZERO–ZERO 週期，`NEXT_PWM_CYCLE` 代表下一個週期，不再誤把『早於下一次 SOCA』等同『同 PWM 週期』。CPU overrun 另依下一個 SOCA 判斷。
- EOC／ADCINT／ISR 入口／WCET 與 shadow setup guard 仍為教學假設，不能當真實 F280049C 延遲 datasheet 或 register configuration generator。
- 第一手來源：[TI F28004x Datasheet Rev. H](https://www.ti.com/lit/ds/symlink/tms320f280049c-q1.pdf)、[TI F28004x TRM](https://www.ti.com/lit/ug/sprui33c/sprui33c.pdf)。

### 品質與正式站版本驗收（2026/10/30）

- `tests/content-contracts.mjs` 直接比對 38＋34 節、107＋52 頁、71 節 KaTeX／120 條公式及 README 數量；避免文件和教材資料悄悄漂移。
- `tests/accessibility-smoke.mjs` 檢查上／中／進階的語意標籤、skip link、鍵盤第一焦點、可見表單名稱、SVG 無障礙名稱及重複 ID；這只是 smoke test，不能宣稱完整 WCAG、螢幕閱讀器、色彩對比或真實手機驗收。
- Pages 部署時將已通過 CI 的 exact SHA 另寫入 `release-sha.txt`（由部署環境生成，非原始 Repo 檔案），部署後對公開網址做限時重試，確認該 SHA 與三個課程入口和 `advanced-models.js` 皆可取得。若 GitHub Pages 邊緣快取延遲或站點未發佈，發布 workflow 會顯示失敗，不會把 skipped 誤判成成功。
- GitHub Ruleset 的 Require conversation resolution 與 Require branch up to date 需具備管理權限的維護者在 GitHub UI 開啟；教材擷取文字的公開散布權利也仍需權利人核可，不會因 CI PASS 自動視為合法授權。

## 中冊逐頁深化導讀｜第一批 P.2–9

中冊 P.2–9 共八頁已加入原創、分層的逐頁解說。依序呈現：本頁核心問題與白話直覺、ON/OFF 或系統訊號流、明確適用條件的公式、逐步數值例題、常見誤解，以及可以點開答案的理解題。並連回已存在的課節與互動模型。

此內容由 middle-page-guides.js 管理；app.js 的中冊逐頁路由負責顯示，middle-page-guides.css 負責排版。原講義摘要及使用者本機 PDF 檢視器都保留；導讀不是投影片逐字稿，也不提供公開原投影片圖片。KaTeX 缺少 JS 或 CSS 時仍顯示可閱讀的文字公式。

中冊 P.2–51 的 50 張教學頁已建立原創逐頁深度導讀；P.1 封面與 P.52 結語不套工程課程格式。上冊其他頁面仍待逐頁深化，不應宣稱全部 159 頁都已完成。對應的數值及頁碼覆蓋檢查位於 tests/middle-page-guides.mjs、tests/middle-smoke.mjs，並納入既有的 Chromium／Firefox／WebKit CI。

## 中冊第二批逐頁深化｜Boost P.10–22

- 在原本 P.2–9 導讀基礎上，補齊 Boost 第 10–22 頁 13 份原創逐頁說明（中冊已完成 P.2–22 共 21 頁）。每頁含核心問題、物理直覺、ON/OFF/零電流時段、公式與條件、完整數值例題、常見錯誤與理解檢核；沿用已有的 PDF 對照和互動課節，沒有新增計算模擬引擎。
- P.10 Boost CCM 能量流；P.11–12 RL 銅損與反映到輸出端的等效內阻；P.13–14 高 Duty 增益峰值與 RL-only 效率；P.15–19 MOSFET／二極體寄生、分段波形及輸入／輸出功率帳；P.20 MOSFET RMS 導通損；P.21 BCM 臨界輸入／輸出電流；P.22 DCM ON／DIODE／ZERO 三區段、輸出三角電流面積及固定電阻負載增益。
- 每頁明示理想 CCM、平均電流或 DCM 的適用範圍；所有損耗與輸出電壓皆為教學近似，不代表元件額定、實機效率或閉迴路的安全運作。
- 新增 `tests/middle-boost-guides.mjs` 做獨立數值 fixture，既有 `tests/middle-page-guides.mjs` 要求 P.2–32 無缺頁；Chromium 測試 13 頁可閱讀、問答、連結、搜尋、320px/390px 與既有 PDF，Firefox／WebKit 擴充到 P.10/P.16/P.22。

## 中冊第三批逐頁深化｜Buck-Boost／四開關／H-Bridge P.23–32

- 中冊 P.23–32 再新增 10 頁原創、獨立的白話深入解說（與 P.2–22 合計 **31 頁**）。逐頁包含核心問題、能量與訊號方向、ON／OFF／ZERO 區段、公式推導與適用條件、逐步數值例題、常見誤解、可展開答案及原有互動課節連結。
- P.23 反相 Buck-Boost CCM：有號負輸出與輸入／輸出不同導通時間；P.24 BCM 電感峰值與臨界輸出電流；P.25 DCM 的 OFF-DIODE 電流面積和負載相關增益；P.26 Ćuk／SEPIC／ZETA 的輸出極性與電流波形差異。
- P.27 四開關 Buck-Boost：分開推導 Buck／Boost 的兩個橋臂中點與電感伏秒；P.28 雙向端口電流參考與功率符號；P.29 H-Bridge 電壓／電流四象限；P.30 直流馬達電樞 La/Ra/反電勢；P.31 Bipolar 差動兩態 PWM；P.32 Unipolar 的零差動狀態、兩橋臂 Duty 與 Dead Time。
- 本批不修改既有物理模型或原 PPTX 摘要、PDF 檢視／保存機制、全站路由。新 `tests/middle-bridge-guides.mjs` 使用獨立數值、分段電流／功率計算，`tests/middle-page-guides.mjs` 檢查 P.2–32 無缺頁與正確連結；Chromium、Firefox／WebKit 額外驗證新頁面與手機版。
- 內容均為理想或明確限定條件下的教學式推導，不是 MOSFET Gate 驅動保護、變壓器隔離、實機回生驗收或系統穩定性保證。P.41–51 已增設逐頁導讀；原講義公開散布授權仍須另案確認。

## 中冊第四批逐頁深化｜隔離式電源與 Flyback P.33–40

- 本批八頁新增原創白話教學：P.33 Flyback vs Forward 能量時序；P.34 次級 PWM 脈衝變壓器的磁通復位；P.35 次級誤差透過光耦回傳一次側的訊號流；P.36 多路次級 Cross Regulation；P.37 磁化能量；P.38 CCM 反射電壓與次級電流；P.39 DCM 三區間；P.40 DCM 峰值、效率假設與元件應力預算。
- **歷史階段：中冊 P.2–40 共 39 頁**在第四批合併時完成連續覆蓋。第五批擴充至 P.2–51 共 50 張教學頁。保留原始本機 PDF、摘要、34 節主題、原有互動模型與部署架構；此批只有教學資料、驗收及文件修改，沒有新增模擬引擎。
- 狀態與適用條件明確區分：CCM 單圈傳能使用 ½Lm(Ipk²−Ivalley²)；DCM 磁化電流谷值為 0 時才使用 ½LmIpk²。效率 80% 是明示的假設，不代表真實開關損耗／耐壓／安規已驗收。多路輸出算例明定同時導通的簡化假設。
- 使用獨立 `tests/middle-flyback-guides.mjs` 核對磁化儲能、伏秒、次級平均電流、DCM ZERO、匝比反射、控制脈衝 ΔB、光耦 CTR、跨輸出整流與能量帳；Chromium 逐頁測試、320／390px 不溢位及 Firefox／WebKit 新頁面。
- 參考 TI [Flyback Parameters Design (SNVA761A)](https://www.ti.com/tw/lit/pdf/snva761)、[Designing a CCM Flyback](https://www.ti.com/document-viewer/lit/html/SSZTCY0)、[Designing a DCM Flyback](https://www.ti.com/document-viewer/lit/html/SSZTCW6)、[Gate-drive Transformer Volt-second Reset](https://www.ti.com/document-viewer/lit/html/SSZTBW1)。

## 中冊第五批逐頁深化｜Forward、橋式、Push-Pull、磁芯 P.41–51

- 依原始中冊 PPTX 的 11 張圖面分別撰寫：P.41 Forward 無去磁問題；P.42 第三繞組 N3/D3、伏秒復位、Dmax 與 MOSFET 應力；P.43 雙開關 Forward 回收；P.44–46 半橋／全橋／電壓源型 Push-Pull 的單脈衝 Duty 定義與開關耐壓；P.47 電流源型 Push-Pull 的重疊導通與輸入電感伏秒；P.48 等效磁件；P.49 單向／雙向激磁；P.50 雙端 PWM；P.51 B-H 與鐵損。
- 第五批完成後，**中冊 50 張工程教學頁 P.2–51** 應全部擁有白話直覺、階段能量流、公式條件、逐步數值例題、假設限制、理解測驗與既有互動課程連結；封面和結語保留原樣。
- `tests/middle-magnetic-guides.mjs` 提供 P.41–51 獨立數值驗證，`tests/middle-page-guides.mjs` 與 `tests/content-contracts.mjs` 確保總頁數和 mapping，Chromium + Firefox/WebKit 檢查數學備援、原始 PDF、搜尋與 320/390px 版面。
- 教學公式使用明確的理想工作條件；不代表實際元件額定、磁芯熱設計、Flux Walking 防護、ZVS 或絕緣認證。

## 上冊第一批逐頁深化｜交流、功率與諧波 P.3–11

- 對照原始 R2 PPTX 的 P.3–11 圖片逐頁建立九份原創導讀：功率符號、效率與 RMS、R-L 複數功率、平衡三相、非正弦波、傅立葉係數、對稱性、輸入電流失真、THD／CF／DPF／PF。
- 三層教學沿用中冊現有逐頁導讀，包含白話直覺、物理及訊號流、公式及適用條件、數值例題、常見誤解與理解測驗。既有 38 節上冊主題課程、47 個互動模型與本機 PDF 閱讀器不變。
- 新增 `upper-page-guides.js`、`tests/upper-page-guides.mjs`，同一個 `app.js` 依分冊選擇獨立導讀資料；避免把上冊導讀誤套到中冊。
- P.3–11 九頁為本次深化範圍，P.12–26 與 P.27–58 已由後續獨立批次深化；P.59–62 已於第六批深化，P.63–106 尚待後續批次；原始 PPTX 和原圖不公開再散布，真實儀器量測與安全額定仍需工程驗證。

## 上冊第二批逐頁深化｜磁路、自感與變壓器 P.12–26

- 逐張核對原始 R2 PPTX 的 P.12–26 電路、磁場、B-H、磁路類比與變壓器公式；不公開原 PPTX、PDF 或截圖。P.23 可擷取文字僅有頁碼，已以原始公式圖確認。
- **P.12–14**：含氣隙安培定律與安匝分配、直導線／環形線圈右手定則、B-H 增量導磁率與電流斜率。
- **P.15–19**：帶符號磁通連續、磁阻與磁導、磁電數學類比與其耗損限制、串並聯磁路／三柱磁芯分流。
- **P.20–21**：法拉第電壓與楞次方向、自感、匝數平方與線性儲能，區分增量電感與標稱 L。
- **P.22–26**：原副邊淨磁化電流、共同磁通與漏磁、Lm/Llk、變壓器等效電路、二次側阻抗折算、鐵心損失 Rm 與 B-H 迴圈面積。
- 每頁包含物理直覺、階段磁通／能流、公式及工作域、獨立數值例題、誤解與理解測驗，全部連向既有課節；**沒有新增模擬器**。
- tests/upper-magnetic-guides.mjs 提供 15 頁獨立參考數值；tests/upper-page-guides.mjs 保證上冊 P.3–26 共 24 頁連續覆蓋；Chromium、Firefox/WebKit 測試數學備援、本機 PDF、搜尋、測驗和手機 320/390 px。
- 內容是明確限界的教育模型，不代表實際磁芯 Bsat、鐵損／熱、漏感尖峰或安規驗收，需依材料規格與量測確認。

## 上冊第三批逐頁深化｜功率二極體、SCR、BJT、MOSFET P.27–40

- 逐張核對原始 R2 PPTX P.27–40 的符號、電流箭頭、I–V 曲線、SCR 復位時間、達靈頓連接、MOSFET 工作區、Ciss/Coss/Crss、Miller 平台及硬切換功率三角形；原始講義圖不公開重製。
- **P.27–30**：二極體與受控開關選型差異、I–V 與反向額定、PN 二極體 Qrr／對側 MOSFET turn-on 應力、四類二極體應用及 Cj；P.29 的 `Qrr×VR×fs` 是換流能量尺度估算，不是「二極體本身一定發熱這麼多」，且不能與已含該事件的 Eon 重複計算。
- **P.31–35**：SCR 鎖存／保持電流、自然換流與 tq、理想受控開關模型、BJT 強迫 β 飽和驅動、二／三級 Darlington 的增益與接面壓降。
- **P.36–40**：MOSFET RDS(on) 的 VGS／Tj 工作域、body diode 與反向通道導流、Ohmic 與 Active/Saturation 區別、Miller 電荷與時序、硬切換 Eon/Eoff 與導通損分帳。
- 每頁建立原創白話直覺、電流／電荷／能量路徑、公式適用條件、三步數值算例、常見錯誤、獨立問答及既有課節連結。延用相同渲染器，不增設模擬器、不改動原有 72 節課、47 個模型、7 個進階實驗或本機 PDF 閱讀器。
- `tests/upper-semiconductor-guides.mjs` 提供 14 頁獨立電路與功率數值；`tests/upper-page-guides.mjs` 驗證上冊 P.3–40 **38 頁**連續覆蓋。Chromium、Firefox／WebKit 驗證公式可讀備援、搜尋、問答、本機 PDF、手機 320/390px 不溢位及下一批 P.41 邊界。
- 工程參考：[Infineon MOSFET Datasheet Explanation](https://www.infineon.com/assets/row/public/documents/24/42/infineon-mosfet-optimos-datasheet-explanation-applicationnotes-en.pdf)、[Infineon Hard Commutation Application Note](https://www.infineon.com/assets/row/public/documents/24/42/infineon-power-mosfet-optimos-fd-200v-250v-hard-diode-commutation-an-en.pdf?fileId=db3a304344ae06150144b1d2f8250165)、[TI MOSFET Miller Plateau and Gate Driver](https://www.ti.com/document-viewer/lit/html/SSZT070/GUID-C487B538-63ED-4542-B1B2-618D8EDEC16F)。
- 本批為教育用近似模型，沒有確認任何器件實際 SOA、tq、Qrr、dv/dt、熱分布、保護或實機示波器波形。

## 上冊第四批逐頁深化｜GTO、IGBT、MCT 與實際開關能力 P.41–48

- 核對原始 R2 PPTX P.41–48 圖面；P.41 GTO 主動關斷與負向 Gate 電流、P.42 RCD Snubber 分流與電容能量、P.43 IGBT 導通電壓及少數載子尾電流、P.44 MCT 控制結構、P.45–46 歷史功率開關比較表／三維能力圖、P.47 導通／切換／Gate／Qrr 的損耗 ownership、P.48 各元件控制與電壓應力篩選。
- 對 P.45 與 P.46 原表明示**歷史技術情境**，不得把舊講義的元件家族排名當成現代絕對耐壓、電流或頻率上限；P.43 的 IGBT 工作頻率亦依器件世代、開關能量與熱限制判定，不能用舊講義固定敘述當通用規格。
- RCD Snubber 的 `½CV²` 首先是電容儲能變化，不能在未知回收路徑時直接當作電阻發熱；`Qg×Vdrive×fs` 代表 Driver 供電能量尺度，**不全是 MOSFET 晶片內熱**；`QrrVRfs` 與 Eon 需避免計入同一換流事件兩次。
- `tests/upper-device-guides.mjs` 對 GTO 負向 Gate 驅動比、Snubber 電荷能量、IGBT 導通／Eoff、MCT、歷史選型表、電熱限制、Gate 供電分帳及 Lpar di/dt 做獨立算例。上冊 P.3–48 46 頁連續資料契約及 Chromium、Firefox/WebKit、原始 PDF、320/390px 手機版測試也已納入 CI。
- 本批不修改既有模擬器、72 節主題、47 個互動模型、7 個進階實驗、路由、PDF.js 或正式發布流程。講義是物理／工程教育近似，不能替代特定器件的 SOA、RBSOA、datasheet 或實機熱測。

## 上冊第五批逐頁深化｜Si／SiC／GaN、Gate 驅動與 Topology 選型 P.49–58

- 核對原始 R2 PPTX 的 P.49–58，包括 P.52 圖片內容（原始擷取文字僅有頁碼）。**P.49–50**：能隙 Eg 與臨界電場 Ec、理想漂移層厚度尺度、Baliga `Ron,sp∝BV²/(εµEc³)` 理論極限及熱導率與封裝熱阻的差異。
- **P.51–52**：Si MOSFET、IGBT、SiC MOSFET、GaN HEMT 的載子與第三象限反向導通，原表的典型電壓與頻率**不是所有當代型號的絕對上限**，電壓×頻率座標只能用於初步篩選。
- **P.53–56**：SiC Gate/Source Kelvin、Miller／CMTI／寄生 Ldi/dt、E-mode GaN／Cascode D-mode、Direct-drive D-mode 的上電負壓互鎖、整合 GaN Power Stage 的 UVLO、GaN 低 Qg/Qoss 與 Dead Time／第三象限熱損。**各種 SiC/GaN 的 VGS 最大值、負偏壓需求與短路耐受必須依具體器件 datasheet**；不將講義例示數值當作通用規格。
- **P.57–58**：四種器件在同一工作點下的導通／切換損耗比較，以及 Buck、Totem-Pole PFC、LLC／CLLC、DAB/SST 的能流先行選型。ZVS 的 `½LI²≥Eoss` 是必要能量尺度檢查之一，**不保證 Qoss 在 Dead Time 內完成轉移**，更不能當作各負載的 ZVS PASS。
- `tests/upper-wbg-guides.mjs` 提供十頁獨立數值參考：阻斷電場、Baliga 極限、第三象限耗散、Gate 窗口、SiC Ldi/dt、Direct D-mode 關斷偏壓、Dead Time 損失、器件導通損比較與 ZVS 能量／時序條件。正式整合時須同時驗證上冊 P.3–58 **56 頁**連續覆蓋、Chromium、Firefox／WebKit、公式、測驗、搜尋與手機 320／390px。
- 不新增模擬器、不修改既有課節／互動引擎／進階實驗／本機原始 PDF 檢視器。所有算例是教育上有明確條件的簡化示意，不是硬體選型、熱、SOA、EMI 或安規驗收。
- 廠商第一手延伸資料：[TI GaN device gate driver considerations](https://www.ti.com/document-viewer/lit/html/SSZT092/GUID-DE35FC6E-02C7-459F-B843-9D7786DAFC5F)、[TI Third quadrant operation of GaN](https://www.ti.com/lit/snoaa36)、[Infineon CoolSiC Kelvin Source](https://www.infineon.com/assets/row/public/documents/24/42/infineon-infineon-coolsic-400-v-and-440-v-g2-mosfets-an-en-applicationnotes-en.pdf)。

## 上冊第六批逐頁深化｜功率系統、線性電源、SMPS 與 PWM P.59–62

- 已核對原始 R2 PPTX P.59–62 的電路和圖面。P.59 Power processor/Controller/Measurements/Reference 清楚分開功率流、回授與控制訊號，暫態能量帳需另計儲能變化。
- **P.60**：100／120 Vac 經低頻變壓器及整流後的 DC 代表電壓 7／8.4 V，在 5 V 線性調節器下的導通損、熱和 `ηreg≈Vo/Vd`；**原圖 5/7、5/8.4 只是理想調節級效率，絕非整機 AC-to-DC 效率**。還須檢查整流濾波後 Vd(t) 谷值、Dropout、變壓器與整流器實際損失。
- **P.61**：原圖上方高頻變壓器、次級整流和 LC，下方簡化非隔離開關、二極體及 LC，不能未核對繞組與復位就宣稱它們全是同一種 Flyback、Forward 或 Buck。開關／整流／磁件、電容及回授各自有損失與動態。
- **P.62**：原圖兩狀態 PWM、固定 fs、電感電流三角漣波、LC 濾波及開關頻譜。限定在**理想 Buck CCM 週期穩態**推導 `Vo≈D Vin`，再用 `ΔIL=(Vin−Vo)D/(Lfs)` 與電感 valley 驗證 CCM；電容的 `ΔVo≈ΔIL/(8fsC)` 僅限理想三角漣波、忽略 ESR／ESL 的近似。
- 新增 `tests/upper-architecture-guides.mjs` 獨立驗證 P.59–62 數值、效率邊界、損失分帳、CCM 條件及輸出漣波；上冊 P.3–62 **60 張連續教學頁**的原始課節 mapping、Chromium、Firefox／WebKit、公式／備援、問答、搜尋、本機 PDF 和 320/390px 手機版也納入 CI。
- 本批不新增模擬器、不改動原有 72 節主題、47 個模型、7 個進階實驗、共用渲染器或正式部署流程。原始講義仍須由使用者本機載入，未公開散布。

## 上冊第七批逐頁深化｜半波、橋式整流與輸入電流諧波 P.63–70

- 依原始 R2 PPTX 第 63–70 頁的**實際電路圖及波形**撰寫八頁獨立導讀，保留本機載入原始 PDF 機制，不公開重製來源圖片。
- **P.63**：純 R 半波，正半週有電流、負半週截止；`VDC=Vm/π` 與 `Vrms=Vm/2` 不可互換，更不能用 VDC²/R 代替電阻發熱。
- **P.64**：串聯 R–L 半波的電感 i(t) 由 `Ldi/dt=vs−Ri` 決定；在交流源過零後，電感仍可用儲能讓二極體持續導通，直到真正 extinction 時刻。Area A/B 是帶符號的電感伏秒而非兩段任意相加。
- **P.65**：交流源供固定 DC 電壓 Ed、串聯 L 的充電情境，`θ1=asin(Ed/Vm)` 只代表從 i=0 開始的首次正向導通門檻，**不是截止角**；截止需繼續積分 `vs−Ed` 的電感伏秒。
- **P.66–68**：含來源 Ls、四二極體整流橋與輸出 Cd 的儲能／充電尖峰；無 Ls 的理想 R vs 固定 Id 負載；展開圖依 AC 正負半週分別由 D1/D2 或 D3/D4 供電。加大輸出電容不代表 AC 電流自然變正弦。
- **P.69–70**：在**來源 Ls=0、固定連續 DC 電流 Id、理想全波橋**的限制下，AC 線電流是 ±Id 方波；`I1,rms=2√2 Id/π`、奇數次諧波相對基波為 `1/h`、`THDi=sqrt(π²/8−1)≈48.34%`。P.69 原圖的約 48.43% 與解析式略有差異，導讀採精確公式，不把結果推廣到帶電容的整流器。
- 本批把 **P.71–72 的來源電感換向重疊**視為下一批獨立物理模型，不直接將無 Ls 的理想電流與電壓式套用；電壓凹陷和電感換向需重新畫導通迴路。
- 新增 `tests/upper-rectifier-guides.mjs` 的八頁獨立數值／模式邊界檢查、上冊 P.3–70 **68 頁**連續來源對應，以及 Chromium、Firefox／WebKit、公式／備援、問答、搜尋、本機 PDF 與 320／390px 手機版驗證；不新增模擬器、不修改既有 72 節課、47 個模型、7 個進階實驗。

## 上冊第八批逐頁深化｜來源電感造成的單相橋式換向重疊 P.71–72

- 對照原始 R2 PPTX P.71（圖 5-14）與 P.72（圖 5-15），獨立解釋**單相橋式二極體在 AC 側存在來源電感 Ls、DC 側固定連續 Id** 時的換向重疊。無 Ls 的 P.69–70 矩形線電流不能被假設在實際電路瞬間翻轉。
- P.71：四二極體在短重疊時同時導流，理想 `vd≈0`，來源 `vL=Ls dis/dt=Vm sinωt`，將線電流從 `−Id` 轉至 `+Id` 的 **2Id** 變化積分得到 `cosμ=1−2ωLsId/Vm`。在短重疊、對稱每半週一次換向的理想模型下 `Vd,avg≈2Vm/π−2ωLsId/π`。其中減少的平均電壓是**換向壓降／輸出伏秒缺口，不代表來源電感真的以 I²R 消耗同等熱**。
- P.72：依來源圖面追新舊二極體成對路徑；理想重疊時 `inew+iold=Id`、`is=inew−iold`，電流經 `−Id→0→+Id` 時兩條通路由 `0/Id→Id/2/Id/2→Id/0` 重新分配，不能把四顆二極體每顆都當作流完整 Id。
- 分段模型明確限定理想二極體、單一串聯來源 Ls、DC 側固定連續 Id、沒有大電容充電脈衝、簡單短換向區。若來源阻抗、二極體恢復、多重換向或負載波形不符，必須重建狀態與 KVL，不可直接套平均電壓式。
- `tests/upper-commutation-guides.mjs` 獨立驗算 `Vs=100 Vrms, f=50 Hz, Ls=1 mH, Id=10 A` 的 `μ≈0.2992 rad (17.14°)`、`Vd0≈90.03 V`、`ΔVd=2.00 V`、`Vd≈88.03 V`，及三個重疊時段的 KCL／AC 電流連續性和超出模式邊界的拒用檢查。
- 上冊 P.3–72 **70 頁**連續原始資料／課程對應，Chromium、Firefox／WebKit 確認 P.71–72 的公式備援、問答、搜尋、原始本機 PDF 及 320／390px 不溢位；P.73–82 留待固定 DC 電壓與大濾波電容的另一批。既有課程、模擬器、進階實驗與網站渲染器均不修改。

## 上冊第九批逐頁深化｜固定 DC 電壓整流器與 THD／DPF／PF／CF P.73–76

- 逐張核對原始 R2 PPTX P.73–76 圖 5-16／5-17／5-18／5-19。此批分析**單相橋式二極體、來源感抗 Ls、直流側維持近似固定 Vd** 的正向充電脈衝，與 P.69–70 的「固定 DC 電流 Id」和 P.71–72 的重疊換向是**不同**工作模式。
- **P.73**：對理想來源 `Vm sinθ`，首次門檻 `θb=asin(Vd/Vm)`；導通期間 `ωLs di/dθ=Vm sinθ−Vd`。電流在來源再次降到 Vd 的 `θp=π−θb` **達峰值而非截止**；真正 `θf` 須由正負伏秒積分直到 i=0 求出。
- **P.74**：以 `Vd0=2Vm/π`（理想無濾波全波平均）作電壓正規化，`Vd/Vd0` 可以大於 1 並趨近 `π/2≈1.5708`；來源充電電流 `Id=(1/π)∫θb→θf i(θ)dθ`，電流正規化需明確指定 `Ishort=Vs,rms/(ωLs)`，避免混用 AC 峰值造成 √2 誤差。
- **P.75**：正半週脈衝及負半週反號，分別積分電流總 RMS 和基波 RMS／角度，得到 THDi、DPF、PF；**純正弦來源**下 `PF=DPF/sqrt(1+THDi²)`。在此模型輕載可讓 DPF 改善但 THD 更大、真 PF 反而下降。
- **P.76**：Crest Factor 使用 **整週線電流 RMS**，不是 DC 平均電流。輕載時脈衝縮窄，即使絕對峰值下降，`CF=Ipeak/Irms` 仍可能升高；真正零電流時比值及 THD/PF 不應當成有定義的工程量。
- `tests/upper-capacitor-guides.mjs` 使用**獨立角度根求解 + Simpson 積分 + 傅立葉係數**，驗證 `Vs=100 Vrms、50 Hz、Ls=10 mH` 在 `Vd=0.90Vm` 及 `0.95Vm` 的 θb、θp、θf、平均 Id、Ipeak、Irms、THD、DPF、PF、CF，並拒用跨重疊區、固定電壓大於峰值等失效域。
- 正式整合後上冊 P.3–76 為**74 張連續教學頁**，Chromium、Firefox／WebKit 驗證公式／備援、數值例題、理解測驗、搜尋、來源本機 PDF 與 320／390px 手機版。後續 P.77–82 再分析**實際濾波電容、來源 Rs/Ls、PCC 失真與倍壓**，不直接把固定 Vd 公式當成實際有漣波的 DC Bus。
- 本批不新增模擬器、不改動原有課程、進階實驗、渲染核心或原始 PDF 閱讀方式。所有公式限於明確指定物理模型，並不代表已驗證真實二極體應力、溫升、電網 THD 或 EMC。

## 上冊第十批逐頁深化｜大電容整流、線電流失真、PCC 與倍壓 P.77–82

- 已逐張對照原始 R2 PPTX P.77–82 的圖 5-20、5-23、5-24、5-25、5-26、5-27。**P.77–79** 為實際單相橋式整流、來源 Ls/Rs、濾波電容 Cd、Rload 的充放電電流與失真；不是 P.73–76 的完全固定 DC Vd 模型，也不是 P.69–70 的恆定 DC Id。
- **P.77**：正常導通兩顆二極體補電，截止時 `Cd dvd/dt≈−Iload`；全波 `ΔVpp≈Iload/(2flineCd)` 只是短充電、近似固定負載、忽略 ESR/ESL 與來源阻抗的一階漣波估算。大 Cd 使 Bus 較平，**不能保證輸入線電流較平滑或 THD 下降**。
- **P.78**：對齊來源 `vs`、輸出 `vd`、真實充電線電流 `is`、傅立葉基波 `is1`；以 `iC=id−iLoad` 建立充電／放電 KCL。基波不是另一條可以獨立量測的真實導線電流。
- **P.79**：以真實線電流與基波、諧波分量辨認 THDi、DPF、PF。在**來源電壓純正弦**且無 DC／非諧波電流時 `PF=DPF/√(1+THDi²)`；高 DPF 不保證高 PF，也不可直接將 THDi 換算成瓦特損失。
- **P.80–81**：PCC 為與其他設備共用的電力連接節點，須區分上游共用 `Ls1` 與 PCC 下游整流器自己的 `Ls2/Rs`；忽略上游電阻時 `vPCC=vs−Ls1 dis/dt`。PCC 凹痕與回彈依**電流斜率的正負和上游共用阻抗**，不能把下游 Ls2 壓降全扣在 PCC，亦不能只用 RMS 看瞬間凹痕。
- **P.82**：原講義切換式 115／230 V 倍壓與一般橋式模式。理想輕載時 115 Vrms 倍壓 `2√2×115≈325.27 V`，230 Vrms 全橋 `√2×230≈325.27 V`；**若 230 V 錯用 115 V 倍壓模式，理想 Bus 可達約 650.54 V，存在嚴重人身與元件超額定危險**。兩顆串接電容有均壓、能量存留、放電與過壓需求。本頁只作物理教學，不提供市電實作接線流程。
- `tests/upper-practical-rectifier-guides.mjs` 對 P.77–82 的電容漣波、充放電斜率、整流 PF/THD、PCC `Ls1 di/dt` 正負及 115/230 倍壓電壓／存留能量做獨立數值與安全警示檢查。上冊 P.3–82 應為 **80 頁連續教學資料**；Chromium、Firefox/WebKit、公式可讀備援、來源本機 PDF、答題、搜尋、手機 320/390px 全部需在正式 PR 完成。
- 不修改任何模擬器、原有課程、進階實驗、網站共用渲染器或原始講義檔，所有模型須明確區分電壓電流的量測邊界、理想近似與真實硬體安全。


## 上冊第十一批逐頁深化｜三相四線零序諧波與六脈波整流 P.83–88

- 對照原始 R2 PPTX P.83–88 的**實際圖面**，建立六頁獨立逐頁導讀：三相四線 120/208 V／共用中性線、諧波相位平移、Triplen 中性線 RMS、三相六二極體橋、最高／最低相導通選擇及六脈波輸出與 PF。原始 PPTX／圖片不公開重製。
- **P.83**：平衡 Y 接 `VLL=√3VLN`；三相基波相差 120° 可在中性線相消，但三次諧波的位移為 `3×120°=360°`，在三相同相時中性線三次 RMS 為 `3Iφ,3`。實機不平衡仍可能有其他中性線電流。
- **P.84–85**：對稱 h 次諧波的相位差是 **h×120°**，不是固定 120°；h=3、9、15… 同相，非 Triplen 在完全平衡時相消。若不同 Triplen 頻率正交，`In,rms=3√ΣIφ,h²`，不得算術加總 RMS。例題每相 I1=10 A、I3=4 A 時，中性線 12 A 可以大於每相總 RMS≈10.77 A；配線與熱仍應依實際量測及適用標準。
- **P.86**：原圖三相六橋包含**來源 Ls、輸出 Cd、Rload**。理想無來源感抗、無保持電容時 `vd,raw=max(va,vb,vc)−min(va,vb,vc)`；有 Cd 時，電容可供電並使橋路截止，不能直接把理想瞬時 max−min 當成有大電容的真實 DC Bus。
- **P.87**：單獨限定**理想固定連續 DC 電流 Id、無換向重疊、無大 DC 保持電容**的六橋：上橋選最高相、下橋選最低相，導通對每 60° 更換、每顆元件導通 120°，每相線電流在 +Id／0／−Id 三態切換。
- **P.88**：理想六脈波 `Vd0=(3√2/π)VLL≈1.3505VLL`，50 Hz 時六脈波主漣波 300 Hz；`Is,rms=√(2/3)Id≈0.8165Id`，`Is1,rms=√6Id/π≈0.7797Id`，來源純正弦且位移因數 DPF=1 時，真 PF=`3/π≈0.95493`。不可套到 P.86 的大電容/來源 Ls 情境。
- `tests/upper-threephase-guides.mjs` 提供三相 h 次相位相消與零序累加、不同頻率 RMS 正交、六個導通對獨立波形取樣／積分、六脈波 Vd 與傅立葉基波、真 PF 等物理驗證。
- 上冊 P.3–88 為 **86 張連續原始教學頁**；Chromium、Firefox／WebKit 檢查本批六頁的公式／備援、例題、問答、搜尋、本機 PDF 和 320/390px 手機版，P.89 特徵諧波列為下一批，避免跳頁。
- 無新增模擬器、無修改既有 72 節課程、47 個模型、7 個進階實驗或渲染器。模型用於學習，非三相高壓整流的元件額定、安規或配線驗收。


## 上冊第十二批逐頁深化｜六脈波特徵諧波與三相來源電感換向 P.89–92

- 以原始 R2 PPTX P.89–92 圖 5-33、5-34、5-35 及 P.92 的原始推導，針對三相六脈波固定 DC 電流與來源電感建立**不同於 P.86 的大電容整流橋**的逐頁原理解說；不重新發布原 PPTX／圖片。
- **P.89**：在三相平衡、固定 Id、`Ls=0`、無大電容的理想 120° 線電流下，非零特徵諧波為 `h=6n±1`（5、7、11、13…），其 RMS 相對基波為 `1/h`；理想相線 `Is,rms=√(2/3)Id`、`I1=√6Id/π`、`THDi=√(π²/9−1)≈31.08%`。不能類推到三相不平衡、PFC 或大電容充電尖峰。
- **P.90**：原圖**a/b/c 每相各有串聯 Ls**、DC 側 Id 固定。某次上橋由 c 相換至 a 相時，原本 b 相下橋仍導流，新舊上橋電流合計 Id，理想換向時**三顆二極體**同時導通，與 P.72 的單相四顆換向不同。
- **P.91**：以兩相相同來源電感的差動 KVL 推出 `ia=iu`、`ic=Id−iu`、`van−vcn=2Ls di_u/dt`；**不是只除一顆 Ls**。圖中負載電流未因此瞬斷或在三顆器件各自增加成 Id。
- **P.92**：線對線換向電壓 `van−vcn=√2VLL sinθ`，得 `cosμ=1−2ωLsId/(√2VLL)`；單次缺口角面積 `Au=ωLsId`，六次對稱平均 `ΔVd=3ωLsId/π`，理想 `Vd≈1.3505VLL−3ωLsId/π`。此模型要求**μ 小於下一次 60° 換向**且沒有多次重疊；輸出下降不是來源 Ls 等量 I²R 發熱。
- 用例 `VLL=400 Vrms, f=50 Hz, Ls=1mH/phase, Id=10A`：`μ≈0.14918 rad=8.548°`、`ΔVd=3.00 V`、`Vd0≈540.19 V`、`Vd≈537.19 V`。屬指定理想工況，非實際整流器額定或效率保證。
- `tests/upper-threephase-overlap-guides.mjs` 對理想 120° 線電流做獨立傅立葉係數積分，驗證 6n±1 與 THD；並檢查三相兩顆來源 Ls 斜率、KCL、角度／伏秒／DC 平均缺口及多次重疊失效條件。上冊 P.3–92 共 **90 張連續導讀**的來源對應、Chromium/Firefox/WebKit、公式備援、問答、搜尋、PDF 和手機端亦納入測試。
- 本批不新增模擬器、不修改現有 72 節課、47 個模型與 7 個進階實驗。下一批 P.93–96 的來源 Ls／DC 濾波電容與失真將另列模型，不能偷換成固定 Id 情境。

## 上冊第十三批逐頁深化｜三相大電容整流與輸入電流品質 P.93–96

- 經核對《上冊 R2》原圖 **P.93 圖 5-36、P.94 圖 5-37、P.95 圖 5-38、P.96 圖 5-39** 建立四頁獨立教學；不公開原始 PPTX、投影片圖片或轉貼公式截圖。
- **P.93**：三相源側每相有 `Ls`，輸出以大電容近似固定 `Vd`；若一次只有一個上、下二極體導通對，`vin−Vd=2Ls·di/dt`。電壓低於 `Vd` 時，已建立的正電感電流會先逐步下降到零才理想截止；不能當成 P.89 固定 `Id` 的 120° 方波。
- **P.94**：圖 5-37 的橫軸為 `Id/Ishort circuit`，曲線代表**指定固定 Vd、來源 Ls 模型**的負載效應。對純正弦來源且無 DC 電流偏移，`THDi=√(Is²−Is1²)/Is1`、`DPF=cosφ1`、`PF=DPF/√(1+THDi²)`；DPF 接近 1 並不保證真 PF 很高。示例 `I1=10Arms`、非基波 `6Arms`、`DPF=0.98` 得 PF≈0.8403，是教學用自選例子，**不是原圖曲線資料擬合**。
- **P.95**：圖 5-38 **左軸 `Vd/Vd0`、右軸 `CF`**，共用負載橫軸；不得將兩個縱軸混讀。`CF=Ipeak/Irms`，以等幅且正負對稱的假想脈衝例題，導通角縮窄會增加 CF，但不聲稱重建真實二極體電流。原始圖左軸有疑似 `1.995` 排印問題，教材不將此值當作量測真值。
- **P.96**：圖 5-39 **明確引用圖 5-30／例題 5-7**，不是圖 5-36 的同一個固定 Vd 模型。按原圖辨認 `van`、`ia`、各線電壓、`vd`、`id`，由 `C·dvd/dt=id−iload` 追蹤充電／放電能量流；例題 `C=2200μF, Iload=5A, Δt=2ms` 算出不充電區近似 ΔV≈4.545 V，未以此冒充原圖例題參數。
- `tests/upper-threephase-cap-guides.mjs` 以獨立時域電壓／電流取樣及數值驗證來源 Ls 正負斜率、P94 週期有功與 Fourier THD/DPF/PF、P95 脈衝 CF、P96 電容 KCL 及不同圖號限制。Chromium、Firefox/WebKit 對四頁均驗證 KaTeX/備援、逐頁導讀、問答、原始 PDF 入口與手機排版。
- 上冊 P.3–96 為 **94 張連續原始頁面導讀**；原有 38 節上冊、34 節中冊課、47 種互動模型及七個進階實驗皆保留。下一批為上冊 P.97–106 類比與 ADC 深化，不新增模擬器。

## 上冊第十四批逐頁深化｜OP 負回授、T 網、差動與磁滯 P.97–100

- 原始《上冊 R2》P.97 **Figure 4.1**、P.98 **Figure 4.2/4.3**、P.99 **Figure 4.7/4.9**、P.100 **Figure 6.1/7.3** 已逐頁核對實際電路圖，而非只摘取文字。沒有將原 PPTX／圖片納入公開網站。
- **P.97**：反相 OP、非反相 OP 與 Buffer，虛短只在穩定負回授且 OP 未飽和下成立。R1=10kΩ、R2=20kΩ、ei=+0.2V 時，反相輸出理想 −0.4V、非反相 +0.6V；**單電源 0–3.3V 不能因理想公式就保證負輸出**。原圖 Rc≈R1||R2 屬選用偏流補償，不保證消除全部 offset。
- **P.98**：上圖是單顆 OP 與 T 型 Rf/R2/R3 回授網，須對虛地與中點各寫 KCL；依本頁接法精確增益 `−[(Rf+R2)/R1+Rf·R2/(R1·R3)]`，指定示例 R1=10kΩ、Rf=100kΩ、R2=20kΩ、R3=10kΩ 得 −32。下方分段電位器 `−x/(1−x)` 與可變回授 `−xR2/R1` 有不同增益曲線與端點風險。
- **P.99**：反相加法器、電阻比匹配的單 OP 差動級及三 OP 高輸入阻抗差動架構；Figure 4.9 理想差動倍率 `(1+2R2/R1)(R4/R3)`。以 50mV 差值和 5 倍前級增益驗算 0.25V，加入同量共模偏壓時理想輸出不變；**共模抵消不代表 OP 的絕對共模輸入安全**。
- **P.100**：負回授反相積分器 `dvo/dt=−vi/(RC)` 與正回授 Schmitt 比較器嚴格區分。R=10kΩ、C=100nF、vi=0.1V 則輸出斜率 −100V/s；Schmitt Eref=0、R1=10kΩ、R2=90kΩ、VOH/VOL=±10V 的切換門檻為 ±1V，磁滯寬度 2V。
- `tests/upper-analog-op-guides.mjs` 驗證虛地 KCL、T 中點 KCL、可變增益、差動／儀表放大器共模不變性、電容積分與 Schmitt 閾值。Chromium、Firefox/WebKit 檢查 P.97–100 的導讀、公式、問答、原講義 PDF、搜尋與 320/390px。未改動 72 節課、47 個互動模型或既有進階實驗。
- 上冊 P.3–100 共 **98 張連續原始頁導讀**。下一個獨立 PR 為 P.101–106 的低通、微分、Sallen-Key、移相、PI、ADC。

## 上冊第十五批逐頁深化｜RC 濾波、Sallen-Key、移相、PI 與 ADC P.101–106

- 對照原始上冊 R2 P.101–103 電路圖，並依 P.104–106 原投影片提供的元件接法、阻值和公式逐頁建立獨立導讀。原 PPTX/PDF 圖片不提交公開網站；P.104–106 沒有額外聲稱已完成影像細節 OCR/臨摹。
- **P.101**：左上反相低通 `−1/(1+sRC)`、左下 RC Buffer 低通 `1/(1+sRC)`；右側串聯 C/R 有界高通／微分 `−sRC/(1+sRC)` 等與有限通帶的差別。R=1kΩ、C=10nF 得 fc≈15.915kHz，−3dB 不是瞬間截止。
- **P.102**：Figure Sallen-Key 傳遞分母的 s² 項 `R1R2C1C2`、s 項 `R1C1+R2C1+R1C2(1−K)`，K=1+R4/R3。原圖 R1=3.3kΩ、R2=1kΩ、C1=6.8nF、C2=2.3nF、K=3.2 得 f0≈22.154kHz、Q≈0.5728，與原講義的四捨五入 22.16kHz／0.572 相符。**f0 在一般 Q 下不必等於 −3dB。**
- **P.103**：Figure 9.23 左側 RC 低通接同相端、右側 RC 高通接同相端，反相端皆以等值 R 同時接 Vin、Vo；分別得到 `HL=(1−sR′C)/(1+sR′C)`、`HR=−HL`。理想兩式幅度皆為 1，R′=10kΩ/C=10nF 在 f≈1.5915kHz 時相位為 −90°／+90°；**兩個電路不能忽略輸出極性差異**。
- **P.104**：輸入 Cin 串 Ri，回授 Rf 並 Cf 的有界微分器 `H=−RfCin·s/[(1+RiCin s)(1+RfCf s)]`；Ri=1k/Cin=10n、Rf=10k/Cf=1n 的兩個極點都約 15.915kHz；1kHz、1Vpk 正弦的輸出約 0.62585Vpk，對應講義 0.626V。
- **P.105**：反相 PI 回授 Rf 與 C **串聯**，理想 `H=−(Kp+Ki/s)`、`Kp=Rf/Rin`、`Ki=1/(Rin C)`；Rin=10k、Rf=20k、C=100n→Kp=2、Ki=1000s⁻¹、fz≈79.577Hz。回授極性、OP 飽和與數位離散化需另行定義。
- **P.106**：5mΩ Shunt、Vref=1.5V、匹配的 R1=R3=10kΩ、Rf=R4=140kΩ → 差動增益 k=14，`VADC=1.5+0.07I[A]`。±20A 映射理想 0.1–2.9V、±10A 映射 0.8/2.2V；3.3V OP 供電**不能保證共模或輸出 headroom 足夠**，仍需核對 ADC 取樣充電與 OCP latency。
- `tests/upper-analog-control-guides.mjs` 以獨立 RC 頻率響應、Sallen-Key 極點/Q、兩種全通幅相、有限微分器正弦振幅、PI 零點及 ADC 正反向映射做數值驗證。Chromium／Firefox／WebKit 回歸 P.101–106 公式、例題、測驗、PDF、搜尋與手機 320/390px。
- 上冊 P.3–106 共 **104 張連續逐頁深入導讀**，覆蓋除封面、課表、結語外的每一張原始講義頁。保留既有 72 節課、47 種互動模型和 7 個進階實驗。下一步為整冊物理一致性 Review、網站回歸與正式 Pages SHA 驗收。

## Circuit 工作台吸收｜第一批 Buck 連續實驗

中冊 Buck PWM 課節新增本站 `workbench/` 入口。包含原八步預測／操作／觀察／原因／transfer 流程；數值與 Evidence V5 owner 保留，不把教材已讀當成實驗通過。
資產與必要測試已實體搬入 EEHandouts，不依賴舊 Circuit 網站或在建置時下載舊 repo。每次從零初值重跑 16 ms；不是實機或儲能 checkpoint。
返回教材前必須保存成功。quota／衝突／較新紀錄不會靜默覆寫，可開唯讀備份頁。非本批模組明示待遷入，不提供失效連結。
範圍、來源與退役門檻見 `docs/migrations/circuit-inventory.md`；第一批不等於整個 Circuit 遷移完成。

## Circuit 吸收第二批：Buck／Boost 比較

從中冊 Buck 的本站八步實驗接續 `workbench/topology.html`，完成預測、操作／觀察、原因、回到原問題的比較練習，再保存後返回八步或 Boost 教材。獨立 document 不代表另一個網站；資產與正常建置都由 EEHandouts 擁有。

沿用來源 `11ef4e48` 的 topologyPlan / Compare / Proof、模型登錄與 Evidence V5；不改數值/評量/儲存 owner。只帶入原 owner 選定的手動設定，沒有將暫態儲能、閉迴路或 fault state 當作穩態比較初值。CCM 邊界、零 ESR、RHP 零點非實測頻寬的限制保留。

第二批新增 `tests/topology-migration-contracts.mjs`、`tests/topology-workbench-smoke.mjs` 及原樣搬入的 topology-workspace/transfer tests。完整八步回歸保留並驗實際轉接；發布守門增加比較頁、UI、模型契約的缺檔拒絕。舊 repo、未遷入功能與 Issue #20 並未因此退役或結案。來源與驗收範圍見 `docs/migrations/circuit-inventory.md`。

## Circuit 遷移第三批｜四種電路應用（尚未發布）

從已發布 PR #46 的 `84162dd4` 接續，新增本站 `workbench/applications.html`，銜接 Buck／Boost 比較與 source-defined PFC、PSFB、LLC、逆變器四種引導練習。原始來源固定 `11ef4e48`，不建立第二套網站，也不在 runtime/build 存取舊 repository。

保留原 Module 17 控制項／圖形與數值、作答及 Evidence owners。只有點擊「明確套用這次的起始條件」才套用指定條件；不自動搬 Buck 參數、儲能或控制器狀態。舊模型／快照不相容時保留原始紀錄並停止寫入，可從頁首另開唯讀備份。引導練習通過不是正式測驗或實機認證。

新增 `tests/applications-{migration,evidence,lifecycle,navigation}-contracts.mjs` 與 `tests/applications-workbench-smoke.mjs`。後者加入原 Chromium、Firefox／WebKit 命令；整合後必須真的執行，不能以 Node 契約測試替代瀏覽器結果。無套件版本變更，原發布守門與 stale-main 防護保留。完整遷移清單見 `docs/migrations/circuit-inventory.md`。

此批目前只在隔離本地工作樹實作。是否可合併取決於 exact-head 的完整 CI 與獨立 Review；合併後還需新 main CI、Pages、公開 SHA 與新增資產驗收。尚未關閉 Issue #20、移除舊 repository 或清理學習紀錄。
