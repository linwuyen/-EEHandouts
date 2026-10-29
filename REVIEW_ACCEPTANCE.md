# EEHandouts｜驗收矩陣與發布規則

這份文件定義每次修改都要覆蓋的固定範圍，避免只對上一個發現的問題新增單一測試，就宣告「完整驗收」。

## 固定範圍

1. **導覽與內容**：上冊七章、38 個小節、107 頁索引；搜尋標題、前言、公式、例題、工程注意、常見誤解、測驗及完整擷取文字；錯誤 URL 不使頁面停止運作。
2. **工程計算**：PF、理想 Buck PWM、磁路、MOSFET 損耗、單相整流、三相及 ADC。每個實驗分別測預設、有效範圍與超界輸入；超出物理模型適用範圍不得顯示可誤認為有效的估值。中冊 Buck / CCM / DCM 必須用獨立伏秒與電荷平衡公式驗證 Vout、IL peak/valley、續流與零電流時間；非同步 Buck DCM 谷值不得為負。其餘六個中冊模型須有跨功率方向、四象限和磁通極值的數值 fixture。
3. **PDF**：檔案格式、大小、107 頁、既定來源 PDF SHA-256 或九個跨頁文字錨點；拒絕 106 頁及錯誤來源；實際繪製的頁面需隨頁碼不同；更換／清除／重新整理／異步交錯時不得讓舊 PDF 復活。中冊 52 頁必須通過九個跨章節辨識錨點；僅第 1、37 頁出現泛用 Converter 或其中一章錯誤的 PDF 必須拒絕。
4. **使用性**：桌機、320px／390px 手機、768px 平板；側欄、搜尋鍵盤焦點、深淺模式、學習完成紀錄及測驗。KaTeX JS 或 CSS 任一無法載入時仍必須顯示可讀的原始文字公式。
5. **部署**：測試須通過，發布須使用**被驗證過的 exact SHA**；新 PR 不可任意覆寫別人的分支修改。

## CI 與部署安全條件

1. **Verify EEHandouts** 應使用 Node.js 22 跑測試、Actions Node.js 24 Runtime（checkout/setup-node/upload-artifact v7）、`ubuntu-24.04`，並以已提交的 `package-lock.json` 執行 `npm ci`。這避免浮動 Ubuntu 與 npm 轉依賴影響可重現性。
2. `npm test` 先執行 `tests/release-guard.mjs`，檢查 release guard 的「最新 HEAD、過時 SHA、GitHub API 失敗」三種情況及工作流程結構，再跑上冊、中冊、Buck DCM 工程模型、KaTeX 公式 Regression。
3. **Publish EEHandouts only after verified CI** 只能回應 GitHub 自己 repository 中 `main` 的成功 Verify；上傳及部署均必須使用該次 `workflow_run.head_sha`。
4. 部署前要查詢最新 `main` HEAD **兩次**：打包前與部署前。若 SHA 不符，該次部署略過；GitHub API 查詢失敗則 fail-closed。請勿讓舊的 CI 重新覆蓋新版。這可降低回退風險，但最後一次檢查與 GitHub Pages 實際發布間，仍不是原子交易。
5. 在 GitHub **Settings → Pages** 使用 `Source = GitHub Actions`，並設定 **Repository Actions Variable** `EEHANDOUTS_ACTIONS_PAGES=true`。必須從 Actions 確認真正的 `deploy` 步驟 success，不能把 `skipped` 當成部署。
6. 在 **Settings → Rules → Rulesets**（或 Branch Protection）另行要求 `main` 由 PR 合併、`browser-regression` 必須成功，並限制 force-push。這是 GitHub 管理設定，目前無法由現有的 Github Chat connector 代改；沒有確認之前不能宣稱分支已被強制保護。

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
