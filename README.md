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

中冊提供 **52 頁原講義的人工摘要**，不公開原 PPTX/PDF 或原投影片圖片。要對照圖表，請先把中冊 PPTX 匯出成 52 頁 PDF，於中冊任一頁自行載入。PDF.js 會檢查 **52 頁**和封面／第 37 頁標題，成功後才在本機 Canvas 顯示。PDF 位元組僅存於瀏覽器本機 IndexedDB，與上冊資料分開。

**工程限制：** 各個可調參數實驗都是理想或簡化模型，必須依 CCM/DCM、Duty、寄生與磁芯材料等假設解讀，不能代替硬體設計驗收。

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
- KaTeX CSS/JS 由 jsDelivr 載入；若 CDN 被封鎖或暫時不可用，保留原本的文字公式作為可閱讀備援，不影響章節導覽與測驗。
- 長公式在手機僅於公式區域水平捲動，不造成整頁橫向溢位。
- 每個主題提供一個可調參數的工程小實驗
- **全部 107 頁**可搜尋的標題與原講義文字索引（含封面、課程安排與結語）
- 每頁皆可在瀏覽器**載入本機原講義 PDF**。使用 PDF.js 解析，先驗證 **107 頁**與首頁／第 24 頁的講義標題，再將真正的 PDF 頁面渲染為 Canvas；PDF 位元組儲存於本機 IndexedDB，不會上傳到伺服器
- 閱讀完成標記、學習進度保存於瀏覽器本機、深色／淺色模式
- 手機及桌面版自適應；純 HTML/CSS/JavaScript，不需 npm 或伺服器後端

## 使用方式
直接開啟 `index.html`，或在本資料夾啟動任何靜態網站伺服器。

### GitHub Pages（驗證後發布）

正式網站：<https://linwuyen.github.io/-EEHandouts/>。

在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，Repository Variable `EEHANDOUTS_ACTIONS_PAGES=true` 啟用後，`.github/workflows/publish-verified.yml` 只會發布**通過 Verify EEHandouts 的 main SHA**。

發布前會再次向 GitHub 查詢最新 `main` HEAD；若測試 SHA 已過時便略過發布，並在打包前、部署前各核對一次，降低舊版覆蓋新版的風險。部署與 CI 分開執行；已通過 CI 不代表 CI 能阻止直接 push 到 `main`。仍應設定 Rulesets 要求 PR 與必要狀態檢查。

### 本機與 CI 驗證

測試依賴由 `package.json` 與 **`package-lock.json`** 固定。使用 Node.js 22（網站本身不需 npm）：

```bash
npm ci --ignore-scripts
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
4. PDF 在瀏覽器本機 IndexedDB 儲存，可按「清除這台裝置的 PDF」移除。瀏覽器需要連網載入固定版本 Mozilla PDF.js 的解析程式與 Worker（cdnjs 4.10.38）。不支援／無法讀取文字的掃描版 PDF 可能無法通過身分校驗。

網站不附帶原 PPTX/PDF 二進位檔，避免未經確認公開轉載講義；你在網站載入的檔案不會傳送到 GitHub。若瀏覽器禁止 IndexedDB，重新整理後可能需重新選取。

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
- `slide-text.js`：從使用者提供的 107 頁 PPTX 擷取的原文
- `source-viewer.js`：PDF.js（動態 CDN 程式）解析及身分／頁數驗證、Canvas 繪製、IndexedDB 本機保存；不向網站後端上傳 PDF
- `tests/smoke.mjs`：Playwright 真實瀏覽器測試
- `.github/workflows/verify.yml`：每次推送執行桌機／手機及數學邊界回歸測試
- `.nojekyll`：GitHub Pages 靜態資產處理

## 驗證

在 Node 22 下執行 `npm ci`、啟動靜態伺服器後執行 `npm test`。內含 `tests/release-guard.mjs`、`tests/smoke.mjs`（上冊）、`tests/middle-smoke.mjs`（中冊）、`tests/math-smoke.mjs`（數學排版、手機與備援）。GitHub Actions 提供自動化跑法與測試截圖。測試使用 `pdf-lib` 產生 106 頁、錯誤內容 107 頁及正確內容 107 頁 PDF，驗證頁數／身分拒絕、真實頁面渲染、切頁像素差異與本機清除。測試驗證網站行為，不代表工程模型可直接用於硬體設計。

本專案由使用者提供的講義與前述學習討論整理而成。
## 內容權利提示

此 repository 是公開的，`slide-text.js` 含有從使用者提供之講義擷取的原文字。公開文字應取得適當使用／散布權限；程式與 PDF 私有載入機制本身無法替代權利確認。如果講義並非自己所有或可公開散布，請停止公開擷取原文並向權利人確認。**Git 歷史可能保留既有公開內容**，後續直接刪除檔案不一定等於刪除歷史。
