/* EEHandouts 中冊 P.2–9 原創逐頁導讀。保留來源 PDF 的本機對照；未附原投影片影像。 */
(function(root){
  'use strict';
  root.EE_PAGE_GUIDES = {
  "2": {
    "lesson": "mid-topologies",
    "title": "Buck、Boost、反相 Buck-Boost、Bridge 到底差在哪？",
    "question": "看見一張電路圖，如何判斷它會降壓、升壓、反相，還是控制正負方向？",
    "takeaway": "先找「電感、開關節點、續流路徑」，再追每一個開關狀態的能量流，不要先背公式。",
    "intuition": [
      "電感像一個不能突然改變電流的儲能元件；MOSFET 不是憑空製造電壓，而是快速改變電感連接的路徑。輸出電容則把高頻能量脈動平滑成比較穩定的電壓。",
      "Buck、Boost、Buck-Boost 改變的是電感在 ON／OFF 時接到哪裡；Bridge 則是控制負載兩端施加的電壓極性與大小。因此 Bridge 不能直接套前面三個單開關轉壓公式。"
    ],
    "steps": [
      {
        "title": "Buck｜讓輸入只在部分時間供能",
        "detail": "開關 ON 時，Vin 經開關與電感向負載送能；OFF 時，電感沿續流路徑繼續供電。在理想 CCM 下，輸出平均電壓低於 Vin。"
      },
      {
        "title": "Boost｜電感先充能，再與輸入一起供能",
        "detail": "ON 時電感接在輸入側儲能，二極體不向輸出導通，負載暫由電容供電；OFF 時電感電流經二極體流入輸出，輸入與電感共同提供能量。"
      },
      {
        "title": "反相 Buck-Boost｜充能、放能分時進行",
        "detail": "ON 時電感充能，OFF 時電感向負極性輸出與負載釋能。輸出電壓的正負必須先依圖面標示的參考極性辨識。"
      },
      {
        "title": "H-Bridge｜兩個橋臂決定負載兩端電壓",
        "detail": "控制左右橋臂中點，可讓負載看到正電壓、負電壓或零電壓；配合電流方向，就能討論四象限與功率回送。"
      }
    ],
    "equations": [
      {
        "label": "Buck｜理想 CCM",
        "tex": "V_o=D V_{in}",
        "plain": "Vo = D × Vin",
        "why": "來自電感 ON／OFF 的伏秒平衡；D 是 ON 時間占週期的比例。"
      },
      {
        "label": "Boost｜理想 CCM",
        "tex": "V_o=\\frac{V_{in}}{1-D}",
        "plain": "Vo = Vin / (1−D)",
        "why": "OFF 時電感與輸入共同對輸出送能；當 D 接近 1，實際寄生與電流限制不能忽略。"
      },
      {
        "label": "反相 Buck-Boost｜理想 CCM",
        "tex": "\\frac{V_o}{V_{in}}=-\\frac{D}{1-D}",
        "plain": "Vo/Vin = −D/(1−D)",
        "why": "負號代表依講義所採參考極性，輸出方向與輸入相反。"
      }
    ],
    "worked": {
      "given": "假設 Vin = 48 V、Duty = 25%，且三種單電感轉換器都處於理想 CCM。",
      "steps": [
        "Buck：48 × 0.25 = 12 V。",
        "Boost：48 ÷ (1−0.25) = 64 V。",
        "反相 Buck-Boost：−48 × 0.25 ÷ 0.75 = −16 V。"
      ],
      "result": "同一個 Vin、D，可以得到三種不同輸出；原因不是公式魔法，而是電感 ON／OFF 的連接路徑不同。"
    },
    "assumptions": [
      "上述三個轉壓比僅限理想、週期穩態的 CCM；輕載 DCM 或存在明顯損耗時不可直接套用。",
      "效率小於 100%，所以升高電壓不表示輸出功率被放大；通常要付出較小輸出電流與額外損耗。"
    ],
    "pitfall": "把 Boost 當成「用電流換出額外功率」，或把四開關 H-Bridge 和三相六開關逆變器視為同一種拓樸。",
    "check": {
      "q": "48 V、Duty 25% 的理想 CCM Boost，輸出為什麼不是 12 V？",
      "a": "12 V 是 Buck 的理想式。Boost 的 ON／OFF 能量路徑不同，Vo = 48/(1−0.25) = 64 V。"
    },
    "tryIt": "先進入「四種基本拓樸怎麼分」的互動題，固定 Vin 與 Duty，再比較各拓樸的轉壓關係。"
  },
  "3": {
    "lesson": "mid-buck-pwm",
    "title": "Buck 怎麼知道輸出電壓掉了？PWM 又怎麼救回來？",
    "question": "負載突然變重，為什麼控制器通常會把 Duty 調大？",
    "takeaway": "負回授不是魔法：先量測 Vout，形成誤差，補償器再改變 PWM 指令；新的 Duty 必須等實際更新事件才能生效。",
    "intuition": [
      "把輸出想成水槽液面：負載變重像排水變快，輸出電容先補足差額，電壓暫時下降。控制器讀到這個下降，才逐步增加輸入端平均供能。",
      "在一般電壓模式 Buck，回授分壓 Vfb 與參考 Vref 比較得到誤差；補償器產生 Vcontrol，PWM 比較器再決定開關時間。這個過程存在取樣、計算與功率級響應延遲。"
    ],
    "steps": [
      {
        "title": "1. 負載拉走更多電流",
        "detail": "在新 Duty 尚未生效時，電感平均電流一時跟不上，輸出電容電流 iC = iL − Io 變負，造成 Vout 下降。"
      },
      {
        "title": "2. 感測與比較",
        "detail": "回授網路將輸出電壓縮小成 Vfb，與 Vref 比較。必須先檢查負回授極性：Vout 下降應使供能命令增加。"
      },
      {
        "title": "3. 誤差經補償器轉成命令",
        "detail": "PI／Type-II／Type-III 等補償器決定誤差如何隨時間影響 Vcontrol；限幅、保護與軟啟動可能阻止立即增加 Duty。"
      },
      {
        "title": "4. PWM 生效、電感電流跟著改變",
        "detail": "比較器把 Vcontrol 對照斜坡產生 PWM。電感先因較高 ON 伏秒而增流，輸出才逐步回到目標。"
      }
    ],
    "equations": [
      {
        "label": "控制誤差（示例極性）",
        "tex": "e(t)=V_{ref}-V_{fb}(t)",
        "plain": "e(t) = Vref − Vfb(t)",
        "why": "Vfb 下降時 e 增大；真正控制方向還要看補償器與 PWM 比較極性。"
      },
      {
        "label": "PWM 時間比例",
        "tex": "D=\\frac{t_{on}}{T_s}",
        "plain": "D = ton / Ts",
        "why": "Duty 的定義與載波形狀無關，但 Duty 與 Vcontrol 的關係取決於調變器。"
      },
      {
        "label": "特定鋸齒斜坡模型",
        "tex": "D=\\frac{V_{control}}{V_{ramp,pk}}",
        "plain": "D = Vcontrol / Vramp,pk",
        "why": "僅當斜坡從 0 線性上升到峰值、無 offset／限幅且比較極性相符時成立。"
      }
    ],
    "worked": {
      "given": "Vin = 48 V、目標 Vo = 12 V、理想 CCM；先忽略損耗與動態。",
      "steps": [
        "穩態需要 D ≈ 12/48 = 0.25，也就是 25%。",
        "若負載變重、Vout 短暫降到 11 V，回授值下降，正常負回授應提高供能指令。",
        "Duty 增加後，ON 階段電感電流斜率與 ON 伏秒提高；但 Vout 不是下一瞬間直接跳回 12 V。"
      ],
      "result": "穩態公式只描述最後可能的工作點；恢復快慢、過衝及穩定性由補償器、取樣／PWM 延遲與 LC 共同決定。"
    },
    "assumptions": [
      "以電壓模式 Buck、固定輸入電壓、負回授與理想 CCM 描述；未指定實際補償器係數，不宣稱瞬態一定穩定。",
      "數位系統要另行確認 ADC 極性與尺度、ISR 計算時間、CMP Shadow Load 事件及保護限制。"
    ],
    "pitfall": "看到 Vout 掉壓就認為 Duty 必須立刻增大，或認為控制器只要計算出 Duty 就已經輸出新 PWM。",
    "check": {
      "q": "輸出從 12 V 暫時掉到 11 V，為什麼不能立刻斷言 PWM 端已增大 Duty？",
      "a": "因為回授可能尚未取樣、補償器有延遲／限幅、保護可能介入，而且 PWM Shadow 更新要等硬體載入事件。"
    },
    "tryIt": "到「Buck 的 PWM 與電壓負回授」課節調整 Duty，先看平均電壓趨勢，再對照進階 C2000 時序模型。"
  },
  "4": {
    "lesson": "mid-switching-lc",
    "title": "PWM 明明是方波，輸出為什麼可以接近直流？",
    "question": "提高切換頻率，電感與輸出電壓漣波會怎麼變？",
    "takeaway": "電感抵抗電流快速改變，電容吸收／釋放電荷。頻率升高通常讓每個週期的電流變化量更小，但不代表效率一定提高。",
    "intuition": [
      "Buck 開關節點在 0 與 Vin（理想化）之間快速切換。電感利用 vL = L·diL/dt，把開關節點的階梯電壓轉換成斜坡電流；電容再把電感電流與負載電流的差額轉成較小的輸出電壓變化。",
      "想成有人一桶一桶往水槽倒水：改成更頻繁、更小桶的補水，液面通常比較平穩；但每次切換都有開關損耗與 EMI 代價。"
    ],
    "steps": [
      {
        "title": "開關 ON：電感看到正電壓",
        "detail": "理想 Buck vL = Vin − Vo，因此 iL 以固定正斜率上升；不是電容直接把方波『剪掉』。"
      },
      {
        "title": "開關 OFF：電感接續流路徑",
        "detail": "理想 Buck vL ≈ −Vo，iL 下降但仍持續供電；對負載而言電流並不隨 Gate 瞬間歸零。"
      },
      {
        "title": "電容補上電流差",
        "detail": "iC = iL − Io。當 iL > Io，電容充電；當 iL < Io，電容放電。電容 ESR 則額外造成近似與電流漣波同形的電壓跳動。"
      },
      {
        "title": "頻率提高的代價",
        "detail": "相同 Vin、D、L 下 Ts 變短，ΔIL 下降；但每秒發生更多次開關事件，切換損耗與 EMI 設計往往更困難。"
      }
    ],
    "equations": [
      {
        "label": "電感電流漣波（理想 Buck CCM）",
        "tex": "\\Delta I_L\\approx\\frac{(V_{in}-V_o)D}{L f_s}",
        "plain": "ΔIL ≈ (Vin−Vo)×D/(L×fs)",
        "why": "vL/L 決定斜率，ON 時間 D/fs 決定爬升多久。"
      },
      {
        "label": "電容電流",
        "tex": "i_C(t)=i_L(t)-I_o",
        "plain": "iC = iL − Io",
        "why": "從輸出端節點 KCL 得到，決定電容什麼時候充電／放電。"
      },
      {
        "label": "理想電容電壓漣波",
        "tex": "\\Delta V_{o,pp}\\approx\\frac{\\Delta I_L}{8f_s C}",
        "plain": "ΔVo,pp ≈ ΔIL/(8 fs C)",
        "why": "限三角波電流、理想電容、固定負載及小漣波近似，不包含 ESR。"
      }
    ],
    "worked": {
      "given": "Vin = 24 V、Vo = 12 V、D = 50%、L = 100 µH、C = 100 µF，且為理想 CCM。",
      "steps": [
        "fs = 50 kHz 時，ΔIL ≈ 12×0.5/(100 µH×50 kHz) = 1.2 App。",
        "fs 改 100 kHz 時，ΔIL ≈ 0.6 App，變成一半。",
        "忽略 ESR 時，電容漣波由約 30 mVpp 變成 7.5 mVpp；在這組理想條件下近似為四分之一。"
      ],
      "result": "電流漣波大致跟 1/fs 成比例；理想電容造成的電壓漣波還會再乘一次 1/fs，所以近似跟 1/fs² 成比例。"
    },
    "assumptions": [
      "需維持 CCM、固定 Duty、線性 L/C 及小漣波；實際 ESR、ESL、量測頻寬與佈線寄生會改變波形。",
      "提高 fs 不保證效率更好；MOSFET 切換能量、磁芯損耗和 EMI 都必須另算。"
    ],
    "pitfall": "把輸出 LC 當成會瞬間消除所有方波，或認為只要 fs 加倍就一定讓損耗變小。",
    "check": {
      "q": "同樣 Vin、Vo、L、C、Duty，fs 從 50 kHz 加到 100 kHz，理想 ΔIL 變成多少？",
      "a": "約一半；若只看理想電容且忽略 ESR，ΔVo,pp 近似還會降到四分之一。"
    },
    "tryIt": "到「切換頻率與 LC 低通濾波」模型，保持 L 與輸入不動，只改 fs，比較電流漣波與頻率的反比關係。"
  },
  "5": {
    "lesson": "mid-resonance",
    "title": "LC 為什麼會振鈴？Q 值跟阻尼到底在講什麼？",
    "question": "為什麼同樣的 LC，有時波形晃很多下才停，有時很快就安定？",
    "takeaway": "L 與 C 交換能量造成振盪，電阻消耗能量造成阻尼；f0 決定自然時間尺度，Q 與 ζ 描述振鈴強弱。",
    "intuition": [
      "電感把能量存進磁場，電容把能量存進電場。放開一個受擾動的 LC 系統時，兩者會來回交換能量，就像彈簧與質量互相交換位能和動能。",
      "只要系統存在損耗，振盪能量會逐步被耗散。對本頁特定「串聯 L、並聯 C 與電阻負載」的模型，較小的 R 代表負載更重，也提供較強的阻尼。"
    ],
    "steps": [
      {
        "title": "1. 電感與電容形成二階狀態",
        "detail": "電感電流、電容電壓是兩個可以儲能的狀態；輸入突變後無法同時瞬間跳到新值。"
      },
      {
        "title": "2. 自然頻率由 L、C 決定",
        "detail": "L、C 越大，能量交換一般越慢，f0 越低。但 f0 不等於所有工作條件下的 −3 dB 截止點。"
      },
      {
        "title": "3. 負載與阻抗決定阻尼",
        "detail": "對特定 LC＋R 模型，Q = R√(C/L)，ζ = 1/(2Q)。Q 大表示弱阻尼，可能看到更尖的共振峰與較久振鈴。"
      },
      {
        "title": "4. 控制器會改變閉迴路響應",
        "detail": "實際 Buck 的負回授、ESR、PCB 寄生、工作模式及補償器會影響波形；單看 LC 的 Q 無法保證閉迴路穩定。"
      }
    ],
    "equations": [
      {
        "label": "自然頻率",
        "tex": "f_0=\\frac{1}{2\\pi\\sqrt{LC}}",
        "plain": "f0 = 1/(2π√(LC))",
        "why": "單位要先統一成 H、F；由 LC 的二階特徵頻率得到。"
      },
      {
        "label": "本頁指定 LC＋R 模型",
        "tex": "H(s)=\\frac{1}{LCs^2+(L/R)s+1}",
        "plain": "H(s) = 1 / (LCs² + (L/R)s + 1)",
        "why": "是串聯 L、輸出端 C 與 R 並聯、忽略 ESR 的電壓傳遞函數。"
      },
      {
        "label": "Q 與阻尼比",
        "tex": "Q=R\\sqrt{\\frac{C}{L}},\\qquad \\zeta=\\frac{1}{2Q}",
        "plain": "Q = R√(C/L)；ζ = 1/(2Q)",
        "why": "僅對上面的理想二階模型成立，不能把它當所有拓樸通用公式。"
      }
    ],
    "worked": {
      "given": "L = 100 µH、C = 100 µF；先令 R = 10 Ω，再假設 R 降到 2 Ω。",
      "steps": [
        "f0 = 1/(2π√(100 µH×100 µF)) ≈ 1.59 kHz。",
        "R = 10 Ω 時，Q = 10，ζ = 0.05，代表弱阻尼。",
        "R = 2 Ω 時，Q = 2，ζ = 0.25；此模型阻尼比提高，振鈴傾向更快衰減。"
      ],
      "result": "L、C 不變時 f0 沒變，但負載電阻改變了阻尼；不要把『振鈴頻率』與『振鈴幅度』混為一談。"
    },
    "assumptions": [
      "這是理想被動 LC＋R 的開迴路電壓濾波模型，不是已完成補償設計的 Buck 閉迴路。",
      "真實電感 DCR、電容 ESR、控制器極點／零點會影響 Q、峰值及阻尼，不能直接用此式預測實機過衝。"
    ],
    "pitfall": "認為 Q 越大就是品質越好，或把自然頻率直接叫成所有情況的 −3 dB 頻率。",
    "check": {
      "q": "L、C 固定，只把並聯負載 R 從 10 Ω 降成 2 Ω，本頁模型的 Q 會怎麼變？",
      "a": "Q 與 R 成正比，所以從 10 降成 2；阻尼比 ζ 從 0.05 增為 0.25。"
    },
    "tryIt": "到「LC 自然諧振頻率、Q 與阻尼」課節，固定 L/C 改變 R，比較共振尖峰與衰減直覺。"
  },
  "6": {
    "lesson": "mid-voltsecond",
    "title": "Buck 的 Vo = D×Vin，是怎麼從電感物理推導出來的？",
    "question": "一個週期內 iL 明明先上升又下降，為什麼平均輸出電壓可以穩定？",
    "takeaway": "電感電流在週期穩態的起點與終點相同，因此整個週期正、負伏秒必須互相抵消。",
    "intuition": [
      "想像爬坡：ON 時電感電流往上爬，OFF 時又往下走。如果每一圈都比前一圈多爬一些，電流就會一路偏移，不可能是穩定的週期波形。",
      "電感的基本式 vL = L·diL/dt 告訴你，電壓乘上持續時間就是造成電流變化的原因。週期電流淨變化為零，就代表電感正負伏秒總和為零。"
    ],
    "steps": [
      {
        "title": "ON：電感兩端是 Vin − Vo",
        "detail": "理想 Buck 開關節點接 Vin，電感承受正電壓；diL/dt = (Vin−Vo)/L，電流線性上升。"
      },
      {
        "title": "OFF：電感兩端近似 −Vo",
        "detail": "開關關閉後二極體或同步開關提供續流路徑，電感承受負電壓；diL/dt = −Vo/L，電流線性下降。"
      },
      {
        "title": "週期起點和終點必須重合",
        "detail": "週期穩態下 iL(Ts) = iL(0)，所以正伏秒 (Vin−Vo)DTs 和負伏秒 −Vo(1−D)Ts 相加為零。"
      },
      {
        "title": "消去 Ts，才得到轉壓比",
        "detail": "整理式子：Vin D − Vo D − Vo(1−D) = 0 → Vin D − Vo = 0，因此 Vo = D Vin。"
      }
    ],
    "phases": [
      {
        "name": "ON：電流上升",
        "pct": 40
      },
      {
        "name": "OFF：電流下降",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "電感基本物理式",
        "tex": "v_L=L\\frac{di_L}{dt}",
        "plain": "vL = L × diL/dt",
        "why": "電感兩端電壓越大，電流改變得越快；L 越大，電流越不容易變。"
      },
      {
        "label": "一個完整週期的伏秒",
        "tex": "(V_{in}-V_o)DT_s-V_o(1-D)T_s=0",
        "plain": "(Vin−Vo)D Ts − Vo(1−D)Ts = 0",
        "why": "ON 正伏秒與 OFF 負伏秒必須抵消，這是推導的核心。"
      },
      {
        "label": "整理後的穩態轉壓比",
        "tex": "V_o=D V_{in}",
        "plain": "Vo = D × Vin",
        "why": "僅是理想 Buck CCM 週期穩態結果；不是任意負載、任意時間都成立。"
      }
    ],
    "worked": {
      "given": "Vin = 100 V、Vo = 40 V、Duty = 40%、fs = 100 kHz、L = 100 µH。",
      "steps": [
        "週期 Ts = 10 µs；ON = 4 µs、OFF = 6 µs。",
        "ON 伏秒 = (100−40)×4 = +240 V·µs → ΔiL = +2.4 A。",
        "OFF 伏秒 = −40×6 = −240 V·µs → ΔiL = −2.4 A。"
      ],
      "result": "+2.4 A 與 −2.4 A 正好抵消；平均電流可以不變，但電流漣波仍有 2.4 App。"
    },
    "assumptions": [
      "理想 Buck、CCM、固定 Vin、週期穩態，忽略開關壓降與電感 DCR。",
      "伏秒平衡只能說電感電流無週期漂移；不能單憑它判斷電容電壓漣波或控制器穩定。"
    ],
    "pitfall": "把 OFF 階段的 iL 當成零，或以為伏秒平衡代表一整個週期完全沒有電流漣波。",
    "check": {
      "q": "如果 ON 階段電流增加 2.4 A，週期穩態的 OFF 階段必須改變多少？",
      "a": "必須下降 2.4 A，否則下一個週期的電流起點就會改變，不符合週期穩態。"
    },
    "tryIt": "到伏秒平衡課節改變 Duty，再觀察 ON／OFF 伏秒和 iL 漣波如何一起變化。"
  },
  "7": {
    "lesson": "mid-ccm-dcm",
    "title": "CCM、DCM 看的是誰的電流？為什麼不是看 Gate？",
    "question": "MOSFET 每週期都會關掉，為什麼 Buck 還可以叫『連續導通』？",
    "takeaway": "CCM／DCM 判斷的是電感電流（或磁化電流）是否在週期內降為零，而不是 MOSFET Gate 有沒有關。",
    "intuition": [
      "MOSFET 關掉不代表電感就沒電流：電感討厭電流瞬間中斷，會透過二極體或同步開關讓電流繼續流。因此在 CCM，Gate 可以反覆開關，但 iL 整個週期都維持正值。",
      "負載變輕時平均 iL 下降，若漣波仍差不多大，電流谷值就可能碰到 0。對非同步 Buck，二極體不允許反向電流，電感可能多出一段零電流時間，進入 DCM。"
    ],
    "steps": [
      {
        "title": "CCM｜整個週期 iL 都大於零",
        "detail": "ON 正斜率上升，OFF 沿續流路徑下降；下一次 ON 來之前仍保有正電流。"
      },
      {
        "title": "BCM｜谷值剛好碰到零",
        "detail": "OFF 下降到 0 的瞬間恰好銜接下一次 ON，這是 CCM 與 DCM 的邊界。"
      },
      {
        "title": "DCM｜出現真正的零電流區段",
        "detail": "ON 電流從 0 上升，OFF 下降到 0；之後在非同步 Buck 中二極體截止，直到下一次 ON 前 iL = 0。"
      },
      {
        "title": "別把非同步與同步 Buck 混在一起",
        "detail": "強制同步導通的 Buck 可能容許電感負電流；那不是本頁非同步二極體式 DCM 的假設，不能直接用同一套三段公式。"
      }
    ],
    "equations": [
      {
        "label": "電感電流谷值（CCM 三角漣波近似）",
        "tex": "I_{L,min}=I_o-\\frac{\\Delta I_L}{2}",
        "plain": "IL,min = Io − ΔIL/2",
        "why": "穩態理想 Buck 的平均電感電流約等於負載電流 Io。"
      },
      {
        "label": "導通模式的判準",
        "tex": "\\mathrm{CCM}:\\ I_{L,min}>0;\\quad \\mathrm{BCM}:\\ I_{L,min}=0",
        "plain": "CCM：IL,min > 0；BCM：IL,min = 0",
        "why": "只在指定非同步／非負電流條件下，負載繼續減小才會出現 DCM 零電流區。"
      }
    ],
    "worked": {
      "given": "先按理想 Buck CCM 工作點計算：Vin = 24 V、Duty = 50%、L = 100 µH、fs = 100 kHz。",
      "steps": [
        "CCM 假設下 Vo = 12 V，電感漣波 ΔIL = (24−12)×0.5/(100 µH×100 kHz) = 0.6 App。",
        "若 Io = 0.6 A，谷值約 0.6−0.3 = 0.3 A，仍是 CCM。",
        "若把 Io 降到 0.1 A，照 CCM 假設會得到負谷值 −0.2 A；這是『CCM 假設失效』的訊號，不是允許把非同步 Buck 的實際 iL 畫成負值。"
      ],
      "result": "此時應改用 DCM 的三段模型重新求 Vo／電流波形，不能把 12 V 與 −0.2 A 當作新的實際解。"
    },
    "assumptions": [
      "上述漣波、谷值用理想 Buck CCM 假設作邊界判定，超出後必須切換模型。",
      "非同步 Buck 的二極體會阻止反向電感電流；同步整流與特殊控制模式需要另外分析。"
    ],
    "pitfall": "把 Gate OFF 當 DCM，或在理想 CCM 式算出負谷值後，仍把負值當成非同步 Buck 的真實電流。",
    "check": {
      "q": "MOSFET OFF 時二極體續流且電感仍有 0.3 A，這屬於 CCM 還是 DCM？",
      "a": "CCM。判準是電感電流在週期內是否曾有零電流區段，不是 Gate 有沒有關。"
    },
    "tryIt": "操作「CCM 與 DCM」模型，把負載電流慢慢降低，追蹤谷值到零的瞬間，再看零電流區出現。"
  },
  "8": {
    "lesson": "mid-bcm",
    "title": "BCM 是什麼？為什麼它剛好卡在 CCM 和 DCM 之間？",
    "question": "怎麼算出 Buck 在多輕的負載下，電感電流會碰到零？",
    "takeaway": "BCM 就是三角波谷值恰好等於 0。此時平均電感電流等於峰值的一半，也等於漣波峰峰值的一半。",
    "intuition": [
      "想像電感電流是一座三角形：當負載逐漸變輕，三角形整體往下移。它的最低點第一次碰到 0 A，就是邊界導通 BCM。",
      "BCM 並不是『整段時間都是 0 A』，而是只在週期交界碰到零；再減小平均電流，非同步 Buck 才會出現額外的零電流平台。"
    ],
    "steps": [
      {
        "title": "1. 從已知 CCM 漣波出發",
        "detail": "理想 Buck Vo = D Vin，ON 時 vL = Vin(1−D)，所以 ΔIL = Vin D(1−D)/(L fs)。"
      },
      {
        "title": "2. 在 BCM 強制谷值等於 0",
        "detail": "三角波上升與下降的面積正好讓平均 Io = ΔIL/2；峰值 Ipk = ΔIL。"
      },
      {
        "title": "3. 算出臨界負載",
        "detail": "Icrit = Vin D(1−D)/(2 L fs)，再由 Rcrit = Vo/Icrit 轉成對應電阻。"
      },
      {
        "title": "4. 判斷兩側而不是直接套 CCM",
        "detail": "Io 高於 Icrit 通常為 CCM；低於 Icrit 時對非同步 Buck 應改以 DCM 求穩態，Vo 也會依負載改變。"
      }
    ],
    "phases": [
      {
        "name": "ON：0 → Ipk",
        "pct": 50
      },
      {
        "name": "OFF：Ipk → 0",
        "pct": 50
      }
    ],
    "equations": [
      {
        "label": "Buck BCM 臨界平均電流",
        "tex": "I_{o,crit}=\\frac{\\Delta I_L}{2}=\\frac{V_{in}D(1-D)}{2Lf_s}",
        "plain": "Io,crit = ΔIL/2 = Vin D(1−D)/(2 L fs)",
        "why": "用理想 Buck CCM 伏秒平衡得到 ΔIL，再施加 IL,min = 0。"
      },
      {
        "label": "臨界電阻",
        "tex": "R_{crit}=\\frac{V_{o,crit}}{I_{o,crit}}",
        "plain": "Rcrit = Vo,crit / Io,crit",
        "why": "在臨界點可用 Vo,crit = D Vin；較大的 R 代表較輕的電阻負載。"
      }
    ],
    "worked": {
      "given": "Vin = 24 V、D = 50%、L = 100 µH、fs = 100 kHz，理想非同步 Buck。",
      "steps": [
        "Vo,crit = 24 × 0.5 = 12 V。",
        "ΔIL = 24×0.5×0.5/(100 µH×100 kHz) = 0.6 App，因此 Icrit = 0.3 A。",
        "Rcrit = 12/0.3 = 40 Ω；R ≈ 40 Ω 時正好位於邊界。"
      ],
      "result": "R < 40 Ω（負載較重）一般維持 CCM；R > 40 Ω（較輕）將進入 DCM 區域，需重算 DCM Vo。"
    },
    "assumptions": [
      "理想、固定頻率、固定 Duty 的非同步 Buck，且電感為線性，沒有同步反向電流、Burst 或 PFM。",
      "BCM 門檻隨 Vin、D、L、fs 改變；不能把 40 Ω 當任何 Buck 通用臨界負載。"
    ],
    "pitfall": "以為 BCM 是 MOSFET 在 ON 時電流才流動，或把 BCM 與具有長時間 0 A 平台的 DCM 混同。",
    "check": {
      "q": "同樣 Vin、D、L、fs，若 L 增大兩倍，Buck 的 Icrit 約變成多少？",
      "a": "Icrit 與 L 成反比，因此約降為一半；這表示在相同平均負載電流下更容易保持 CCM。"
    },
    "tryIt": "操作「BCM：連續與不連續的臨界點」，先固定輸入及頻率，再改 L／負載，觀察電流谷值。"
  },
  "9": {
    "lesson": "mid-buck-dcm",
    "title": "Buck 進了 DCM，為什麼 Vo 不再等於 D×Vin？",
    "question": "Duty 沒變、Vin 沒變，為什麼只改負載就能改變輸出電壓？",
    "takeaway": "DCM 多出零電流區段，電感只在 ON 與 OFF-續流階段有電流。必須同時用伏秒平衡與平均電流面積求輸出，不能只看 Duty。",
    "intuition": [
      "CCM 時電感一直有電流，ON／OFF 幾乎覆蓋整個週期；DCM 則像每次先把電感充起來、送完能量後休息一段時間。多出的休息時間會改變 OFF 伏秒和平均能量。",
      "在非同步 Buck，二極體讓 iL 降至零就停止導通。此時開關週期分成 ON、續流、ZERO 三段，輸出電壓必須與負載一起求解。"
    ],
    "steps": [
      {
        "title": "ON：電流由 0 上升到 Ipk",
        "detail": "開關節點接 Vin，vL = Vin−Vo；Ipk = (Vin−Vo)DTs/L。"
      },
      {
        "title": "OFF-續流：電流下降到 0",
        "detail": "二極體導通，vL = −Vo，下降持續時間記為 Δ1 Ts；由正負伏秒得到 (Vin−Vo)D = Vo Δ1。"
      },
      {
        "title": "ZERO：電感電流保持 0",
        "detail": "二極體截止後 iL 不再反向，直到下次 ON 前都為 0；這段比例為 1−D−Δ1。"
      },
      {
        "title": "電荷平衡：電流三角形面積就是 Io",
        "detail": "平均負載電流等於整段 iL 三角形面積除以 Ts，即 Io = Ipk(D+Δ1)/2。兩條關係合起來才能解出 Vo。"
      }
    ],
    "phases": [
      {
        "name": "ON：升流",
        "pct": 25
      },
      {
        "name": "OFF：續流降至零",
        "pct": 33.333333
      },
      {
        "name": "ZERO：電流為零",
        "pct": 41.666667
      }
    ],
    "equations": [
      {
        "label": "DCM 伏秒平衡",
        "tex": "(V_{in}-V_o)D=V_o\\Delta_1",
        "plain": "(Vin−Vo)D = Vo Δ1",
        "why": "ZERO 時電感電壓近似 0，所以只有 ON 與 OFF-續流的伏秒互相抵消。"
      },
      {
        "label": "輸出電流等於三角形平均面積",
        "tex": "I_o=\\frac{I_{pk}}{2}(D+\\Delta_1)",
        "plain": "Io = Ipk(D+Δ1)/2",
        "why": "導通的 ON＋OFF 有三角電流，ZERO 區域面積為 0。"
      },
      {
        "label": "固定輸出電流負載下的理想 Buck DCM",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{1}{1+\\frac{2Lf_sI_o}{V_{in}D^2}}",
        "plain": "Vo/Vin = 1 / [1 + 2 L fs Io/(Vin D²)]",
        "why": "聯立上述兩式得到；若採固定 R 負載，需要再以 Io=Vo/R 聯立求解。"
      }
    ],
    "worked": {
      "given": "Vin = 24 V、Duty = 25%、L = 100 µH、fs = 100 kHz、定電流負載 Io = 0.1 A。",
      "steps": [
        "先算 K = 2 L fs Io/(Vin D²) = 2×100 µH×100 kHz×0.1/(24×0.25²) = 1.333。",
        "因此 Vo/Vin = 1/(1+1.333) ≈ 0.4286，Vo ≈ 10.29 V；不是 CCM 式的 6 V。",
        "Ipk ≈ (24−10.29)×0.25/(100 µH×100 kHz) = 0.343 A；Δ1 ≈ 0.333，ZERO ≈ 0.417。"
      ],
      "result": "電流平均 0.343×(0.25+0.333)/2 ≈ 0.10 A，且 ZERO 比例為正，反過來驗證這組 DCM 工況自洽。"
    },
    "assumptions": [
      "固定輸出電流、固定頻率及 Duty 的理想非同步 Buck；若使用純電阻負載，Io 必須依 Vo/R 隨輸出改變。",
      "忽略二極體壓降、電感 DCR、同步整流、輸出大漣波與閉迴路；若 ZERO 比例不為正，不能當有效 DCM 解。"
    ],
    "pitfall": "把 DCM 的 OFF 時間直接寫成 1−D，忽略 ZERO 區段，於是錯誤沿用 Vo=D Vin；或拿定電流公式直接代入固定電阻負載而不聯立。",
    "check": {
      "q": "在理想非同步 Buck DCM，Duty 固定而負載越輕，Vo 會完全固定在 D×Vin 嗎？",
      "a": "不會。因為 OFF-續流與 ZERO 的時間比例會改變；必須依伏秒和電荷平衡重新求 Vo。"
    },
    "tryIt": "到「Buck 在 DCM 為何轉壓比會變」課節，調小 Io，觀察 ON／OFF／ZERO 三段如何重新分配。"
  }
};
})(window);
