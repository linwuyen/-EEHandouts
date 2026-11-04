# EEHandouts 吸收 Circuit：第一批 Buck 實驗

## Objective / Scope
最終一個 repository / 一個 EEHandouts 網站。第一批交付中冊 Buck 教材 → 本站八步連續實驗 → 返回教材，不使用舊站 iframe 或 runtime fetch。使用者已批准依序遷移；舊 repo 不在本批刪除。

## Known Facts / Constraints
固定 EE b1e41595e4602b67d0dbbb353f92dddddd0c5484 / Circuit 11ef4e4801b5283f265dc349a4afec0027603228。
workbench/ 保留獨立 document 與 CommonJS 邊界；資產實際提交 EE，沒有 submodule 或 build 時下載舊 repo。原 kernel、Evidence V5、CoreFlow、首次作答與 transfer 判定不改。
模型為 generic-power-causal-kernel 3.3.0、每次零初值重跑 16 ms，不是真板或器件時序認證。EE 閱讀標記與實驗證據分開。
本批搬必要腳本、資料、CSS 和測試完整依賴。尚未遷入的模組必須明示，不提供死連結、不導回舊站。

## Approach / Target
拒絕外站依賴、同 DOM 全腳本合併。採內部 workbench 文件與 EE 返回殼，後續逐步融合 UX。
mid-buck-pwm → workbench/index.html?from=mid-buck-pwm#experiment-energy → 原 prediction / operation / observation / reason / transfer → Evidence.flush 成功才返回。
保留 storage keys / locks；quota、conflict、新版紀錄 fail closed，保留完整備份匯出。返回只接受固定課節 ID，不接受任意 URL。

## Verification / Stop / Rollback
原 EE 29 檔、搬入來源 unit tests、actual DOM 八步及返回、quota/conflict/newer record、重載、小螢幕、資產失敗。來源 manifest hashes、物理模型及證據不可放寬。
Exact-head CI、獨立 Review 後才合併；發布仍需新 main CI / Pages / hosted SHA。來源漂移或需要重寫 kernel/schema 時停止該擴張。
回退移除本批入口及 workbench，不刪除 Evidence V5 或 EE 進度、不改寫 main 歷史。
