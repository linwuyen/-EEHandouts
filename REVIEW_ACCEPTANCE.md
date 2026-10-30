# EEHandouts｜驗收矩陣與發布規則

這份文件定義每次修改都要覆蓋的固定範圍，避免只對上一個發現的問題新增單一測試，就宣告「完整驗收」。

## 全課節互動的新增驗收

- 上冊 38 節、中冊 34 節，每節必須對應具體研究模型，不可靜默退回不相干的圖形或虛構數字。
- 對每節測『READY → 先預測 → 套用指定比較值 → REVIEWED → 重設』；先調整參數、自由探索、事後選答案或同時改變其他參數，必須進入 EXPLORING 且不能評分。反轉功率／降低負載／進入 DCM 的題目，指定比較值必須真正跨過方向或導通模式邊界，不能一律把滑桿增加一格。有波形者另測同步時間游標。390px 手機不得整頁橫向溢位。
- Buck／Boost／Buck-Boost／Flyback 的 CCM/BCM/DCM 波形必須符合電流連續與 DCM 不為負；Gate 指令、Vsw、VL、VDS 需分開命名、單位正確，並驗證 ON／OFF／ZERO 區間。Forward OFF 伏秒不足要警告，不能聲稱復位完成。
- 所有模型明確標示假設；PI 相位需符合所採用的反相傳遞函數；三相電容整流、固定 DC 電流六脈波諧波不得混用；Boost CCM 銅損越界不可顯示有效穩態值，數值參數掃描遇到無效區間必須斷線，不能連接無效區間兩側的有效點；磁芯損耗只做相對比例。整流電容超過 ΔV/Vpeak 20% 時不得用外插值進行有效預測評分；磁路固定 μ 超過教學門檻時必須標示數學外插，不能當有效磁芯設計數據；ADC 教學量化必須用相同 4096 區間政策。未建模的磁材、補償迴路、換向暫態、器件保護不可宣稱已經模擬或驗收。
- 執行 `npm test`，包括 `tests/interactive-smoke.mjs`，並保留截圖 evidence。

- 三相線電壓與三相六二極體整流應以相位偏移加單一時間游標的同一份模型狀態更新即時數值、VA/VB/VC/VAB/VDC 波形與導通相別；0%、25%、75% 各點需以獨立公式驗證，拖曳游標不可改變已完成的事前預測評分。理想 30°／90° 相電位相等的換相點須顯示候選二極體，而非虛構唯一導通相或瞬時分流。
- 六脈波固定 DC 電流模型必須在同一 Idc 下同時呈現第 5、7 次 RMS 與約 7/5 的理想比值；改變「觀察諧波次數」不許被當成第 5 次物理幅值變化，課節預測只更動 Idc 並維持評分指標名稱。
- ADC 課節預設增益須與講義一致為 14：5 mΩ、+10 A、1.5 V 中點→2.20 V 與 floor(4096×2.2/3)=3003；保留獨立滑桿做其他增益的有效域驗證。

## 固定範圍

1. **導覽與內容**：上冊七章、38 個小節、107 頁索引；搜尋標題、前言、公式、例題、工程注意、常見誤解、測驗及完整擷取文字；錯誤 URL 不使頁面停止運作。
2. **工程計算**：PF、理想 Buck PWM、磁路、MOSFET 損耗、單相整流、三相及 ADC。每個實驗分別測預設、有效範圍與超界輸入；超出物理模型適用範圍不得顯示可誤認為有效的估值。中冊 Buck / CCM / DCM 必須用獨立伏秒與電荷平衡公式驗證 Vout、IL peak/valley、續流與零電流時間；非同步 Buck DCM 谷值不得為負。其餘六個中冊模型須有跨功率方向、四象限和磁通極值的數值 fixture。Boost 電容漣波要用與產品公式獨立的二極體電流數值時間積分，在 CCM／BCM／DCM、零電流區段及 BCM 兩側驗證，且小漣波以 mVpp 清楚顯示。
3. **PDF**：檔案格式、大小、107 頁、既定來源 PDF SHA-256 或九個跨頁文字錨點；拒絕 106 頁及錯誤來源；實際繪製的頁面需隨頁碼不同；更換／清除／重新整理／異步交錯時不得讓舊 PDF 復活。中冊 52 頁必須通過九個跨章節辨識錨點；僅第 1、37 頁出現泛用 Converter 或其中一章錯誤的 PDF 必須拒絕。
4. **使用性**：桌機、320px／390px 手機、768px 平板；側欄、搜尋鍵盤焦點、深淺模式、學習完成紀錄及測驗。KaTeX JS 或 CSS 任一無法載入時仍必須顯示可讀的原始文字公式。H-Bridge 切換 Bipolar 時 B Duty 必須停用、顯示 100%−A 的有效值；切回 Unipolar 時恢復先前 B Duty，不得讓 UI 與運算值不一致。
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

## 2026-10-30 追加驗收

- Pages workflow 必須 `queue: max` 且 `cancel-in-progress: false`，舊／新 CI 反序完成仍不得取消最新部署，維持部署前後 exact SHA 對齊（佇列容量上限不在保證範圍內）。
- `VA`、`VB`、`VAB` 理想 H-Bridge PWM 使用水平／垂直階梯波，包含週期邊界，不能以斜線誤示切換斜率；保持原平均值、Duty ownership 與 Unipolar/Bipolar 切換。
- PDF.js 4.10.38 必須在建置階段驗證 npm tarball SHA-512 後部署同源 module + worker，Chromium 測試須在封鎖舊 PDF.js CDN 下仍能驗證並渲染 107／52 頁講義。
- `main` Repository Ruleset 未確認之前，不可聲稱它已強制 PR／required status checks；此管理設定不能靠 repo 檔案替代。

- Firefox、WebKit 至少覆蓋上／中冊首頁、搜尋焦點恢復、手機選單、課節預測／探索／重設、H-Bridge 階梯波、PDF.js 本地模組與無整頁橫向溢位；CI 需分開顯示 `cross-browser` status。


## 進階電力電子實驗室（新功能）工程 Gate

- 新建 `advanced.html`，不改舊 72 個課節 IDs/47 個模型，且上／中冊均有入口。GitHub Pages 必須打包三個新資產 `advanced.html` / `advanced-models.js` / `advanced-app.js` 及 `advanced.css`。
- Boost PFC 在給定瞬時整流相位的 **CCM/DCM** 需滿足電流面積、伏秒、週期 ON/OFF/ZERO 時間和理想功率平衡。不能用單週期波形宣稱整個市電週期 PF/THD。
- PSFB 的主橋一次側 +Vin/0/−Vin、對稱雙脈波與次級全波整流，平均有效 Duty 和輸出 L 的 CCM/DCM 峰谷/功率平衡由獨立 fixture 驗證，ZVS/死區/漏感不在此模型內。
- LLC 使用 A-stable 隱式梯形積分，應通過高 Rac/Lr 的剛性工作點回歸，且必須顯示有用的非零諧振波形，Lr/Cr 所算 f0 與獨立公式相符；最後週期的平均輸入功率與 FHA 負載耗散、儲能變化能量平衡殘差應在容差內。磁化電流、Rac、阻抗相位不可當實際 ZVS 判定。
- Buck Bode 的所有 0dB 交越需保留，頻域複數算式納入 L/C/ESR、補償 PI、高頻 pole、固定 delay；超出 CCM 要標 out of domain。不得以正 PM 保證實機穩定。
- C2000 時序 TBPRD 與 CMPA 整數量化，SOCA/ADC EOC/ISR/Shadow load 具嚴格先後，超過下一個 SOCA 要視為 WCET 警告；不得將滑桿值當真實 F28004x 延遲規格。
- Buck 非理想電壓、損耗與效率需要 P_in=P_out+P_loss 的獨立檢查；遇負電流/Dead Time 重疊禁止標有效。PSFB Coss/Llk 只檢查 ZVS 必要前提，不得標成 ZVS 已驗收。
- Chromium/Firefox/WebKit 至少驗證七模型初始有效、波形可呈現、320px/390px 不橫向溢位、游標與滑桿可操作，以及上中冊既有測試無回歸。

- 進階同步 Buck 必須以真正的 DEAD/HIGH/DEAD/LOW 切換邊界解析積分，並以**區間端點的精確 IL min/max**判斷 CCM；115–125 kHz 之類取樣格點不對齊時也不可誤把負電流判成有效 CCM。週期首尾連續、電容電荷閉合需可觀測。
- 電容 ESR 要用整個週期 iC=IL−Io 的 RMS² 計算耗損，明列於總損失／輸入功率／效率；ESR 100 mΩ、6 App 理想三角電流應新增約 0.3 W。以獨立數值積分交叉驗證，不能僅依 Pin−Pout−Ploss 的恆等式宣稱真實功率守恆。模型固定 Io 近似、非完全動態耦合的限制應公開。
