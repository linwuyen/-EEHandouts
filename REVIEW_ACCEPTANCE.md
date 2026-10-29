# EEHandouts｜驗收矩陣與發布規則

這份文件定義每次修改都要覆蓋的固定範圍，避免只對上一個發現的問題新增單一測試，就宣告「完整驗收」。

## 固定範圍

1. **導覽與內容**：上冊七章、38 個小節、107 頁索引；搜尋標題、前言、公式、例題、工程注意、常見誤解、測驗及完整擷取文字；錯誤 URL 不使頁面停止運作。
2. **工程計算**：PF、理想 Buck PWM、磁路、MOSFET 損耗、單相整流、三相及 ADC。每個實驗分別測預設、有效範圍與超界輸入；超出物理模型適用範圍不得顯示可誤認為有效的估值。中冊 Buck / CCM / DCM 必須用獨立伏秒與電荷平衡公式驗證 Vout、IL peak/valley、續流與零電流時間；非同步 Buck DCM 谷值不得為負。其餘六個中冊模型須有跨功率方向、四象限和磁通極值的數值 fixture。
3. **PDF**：檔案格式、大小、107 頁、既定來源 PDF SHA-256 或九個跨頁文字錨點；拒絕 106 頁及錯誤來源；實際繪製的頁面需隨頁碼不同；更換／清除／重新整理／異步交錯時不得讓舊 PDF 復活。中冊 52 頁必須通過九個跨章節辨識錨點；僅第 1、37 頁出現泛用 Converter 或其中一章錯誤的 PDF 必須拒絕。
4. **使用性**：桌機、320px／390px 手機、768px 平板；側欄、搜尋鍵盤焦點、深淺模式、學習完成紀錄及測驗。KaTeX JS 或 CSS 任一無法載入時仍必須顯示可讀的原始文字公式。
5. **部署**：測試須通過，發布須使用**被驗證過的 exact SHA**；新 PR 不可任意覆寫別人的分支修改。

## 發布狀態及必要設定

`.github/workflows/verify.yml` 會執行 Chromium 自動驗收。目前 GitHub Pages 仍可能使用「Deploy from a branch」，**其原生自動部署不會等這份測試完成**。

本專案新增 `.github/workflows/publish-verified.yml`，它會在上冊／中冊測試工作流程成功後，取該測試的 **exact HEAD** 做 Pages 發布。必須先一次性進行以下管理設定，這套 gate 才真正生效：

1. 在 GitHub **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. 在 **Settings → Secrets and variables → Actions → Variables** 新增 **`EEHANDOUTS_ACTIONS_PAGES` = `true`**。
3. 在 **Settings → Rules → Rulesets**（或 Branch protection）對 `main` 要求 Pull Request、通過狀態檢查 `browser-regression`，並禁止 force push。若規則因方案或政策限制不能設定，要明確告知而非聲稱已強制啟用。
4. 設定後在 main 執行一次 **Verify EEHandouts**，確認「Publish EEHandouts only after verified CI」由成功的測試紀錄觸發，且 Pages 顯示部署相同 SHA。

**沒有完成 GitHub Pages Source 設定前，Verified Pages workflow 只處於待啟用狀態。** 不要將「GitHub Pages 原生部署成功」當成被 CI Gate 保護的證據。

## 模型限制

- **磁路**：線性 `μr = 2000`、等效截面與氣隙模型。本站 `0.35 T` 是教學時用的顯示警示門檻，並非磁芯飽和額定值。超界會停止提供電感與 B 工作點估值；需要實際材料 B-H 曲線。
- **ADC**：理論輸入離開 0–3 V 時不提供有效轉換碼；**不存在**軟體裁切就能保護類比腳位的保證。額定值、保護、共模、取樣與校正需要另外驗證。
- **整流**：`ΔV≈I/(2fC)` 僅為小漣波近似；`ΔV/Vpeak≤20%` 是教學門檻，不是業界通用標準。
- **PDF**：SHA-256 精確比對已確認的 107 頁匯出檔；不同匯出則檢查九頁文字錨點，**並非防偽或內容完全一致的保證**。不支援掃描版無法抽出文字時的自動驗證。
- **資料權利**：Repository 為公開可見，包含從使用者講義擷取的文字；權利應由內容持有人確認。此限制無法用 CI 自動裁定。
- **瀏覽器覆蓋**：CI 以 Chromium 及指定 viewport 驗證；Firefox、Safari、極慢網路與裝置異常仍非完全涵蓋。

## 驗收口徑

- **Code-level PASS**：語法、資料、公式與程式邏輯已驗證。
- **Browser PASS**：實際 Chromium 流程通過，附 log 與 screenshot。
- **Deployment PASS**：GitHub Pages 實際發布 exact SHA。
- **Gate enforced**：已切 GitHub Actions Source，且受保護 main / 測試成功觸發已確認。
- **Engineering release PASS**：另外需要磁芯、實際 MCU、datasheet、波形與安全測試；教材網站驗收不等於硬體安全設計驗收。

未列入本次範圍的異常，不能聲稱「永遠沒有問題」。新增需求或新環境可能產生新測試案例；新的 Review 必須區分**新發現缺陷、原已知限制、功能需求變更**。
