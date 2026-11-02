/* 中冊原創逐頁導讀：由物理現象到工程驗證，原講義 PDF 不公開存放。 */
(function(root){'use strict';root.EE_PAGE_GUIDES={
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
  },
  "10": {
    "lesson": "mid-boost-ccm",
    "title": "Boost 為什麼能升壓？ON／OFF 時能量到底走哪裡？",
    "question": "MOSFET ON 時二極體不導通，負載為什麼還有電？關掉 MOSFET 又為什麼能升壓？",
    "takeaway": "ON 時輸入使電感電流上升，輸出電容先供電；OFF 時電感維持電流、抬高開關節點，輸入與電感一起送能到輸出。",
    "intuition": [
      "先不要把 Boost 想成『把電流變成電壓』。MOSFET 只是在每個週期切換電感的連接方式；電感電流不能瞬間改變，這個物理限制使 OFF 階段開關節點電壓升高，直到二極體能向輸出導通。",
      "輸出電容在 ON 階段像小型儲能桶，補上二極體暫時沒有供電的缺口；OFF 階段電感電流經二極體流入輸出，電容可能重新充電。每個週期的能量必須來自輸入，不能靠增加 Duty 產生額外功率。"
    ],
    "steps": [
      {
        "title": "1. ON：輸入向電感儲能",
        "detail": "MOSFET 將開關節點拉近地電位，電感兩端近似 Vin，電流 iL 線性增加；二極體反偏，負載電流主要由電容供應。"
      },
      {
        "title": "2. OFF：輸入與電感共同輸出",
        "detail": "MOSFET 截止，電感要延續電流，開關節點上升使二極體正偏；iL 經二極體流入輸出，電感承受 Vin−Vo 的負電壓，電流下降。"
      },
      {
        "title": "3. 穩態：正負伏秒抵消",
        "detail": "CCM 週期結束時 iL 回到起點，ON 的 Vin·D·Ts 與 OFF 的 (Vin−Vo)(1−D)Ts 相加等於零。"
      },
      {
        "title": "4. 功率：升壓不等於功率放大",
        "detail": "理想無損時 Vin·Iin=Vo·Io。Vo 升高時，通常 Io 低於輸入平均電流；高 Duty 也會增加器件的電流與損耗負擔。"
      }
    ],
    "phases": [
      {
        "name": "ON：儲能，電容供電",
        "pct": 50
      },
      {
        "name": "OFF：電感與輸入向輸出供能",
        "pct": 50
      }
    ],
    "equations": [
      {
        "label": "電感伏秒平衡",
        "tex": "V_{in}D+(V_{in}-V_o)(1-D)=0",
        "plain": "Vin×D +(Vin−Vo)×(1−D)=0",
        "why": "iL 在一個週期內的正負變化量必須互相抵消，兩段的 vL 分別約是 Vin 與 Vin−Vo。"
      },
      {
        "label": "理想 Boost CCM 電壓比",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{1}{1-D}",
        "plain": "Vo/Vin=1/(1−D)",
        "why": "由上式整理。只對固定頻率、週期穩態、理想 CCM 模型成立。"
      },
      {
        "label": "理想輸入與輸出電流",
        "tex": "I_o=(1-D)I_{in}",
        "plain": "Io=(1−D)×Iin",
        "why": "由理想輸入／輸出功率守恆及上面的轉壓比得到，不能據此忽略損耗。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=50%、fs=100 kHz、L=100 µH；假設 Vo 的定電流負載 Io=1 A，處於理想 CCM。",
      "steps": [
        "Vo=48/(1−0.5)=96 V；理想輸出功率 Po=96×1=96 W。",
        "輸入平均電流 Iin=Io/(1−D)=2 A；ON 電感漣波 ΔIL=48×0.5/(100 µH×100 kHz)=2.4 App。",
        "電感谷值=2−2.4/2=0.8 A，峰值=3.2 A，確實符合 CCM（谷值大於零）。"
      ],
      "result": "Boost 將 48 V、2 A 對應成約 96 V、1 A；電流漣波仍在輸入電感上，不能只看 96 V 忽略峰值電流。"
    },
    "assumptions": [
      "理想二極體、MOSFET、電感與輸出電容；輸出電壓在單週期內近似固定，無控制延遲、電阻與開關損耗。",
      "CCM 要先確認電感谷值大於零；D 趨近 1 的理想公式不能外推成實際可用的無限輸出電壓。"
    ],
    "pitfall": "把 ON 階段說成負載完全沒電，或認為 Vo 倍增時功率也一定倍增；實際短路時傳統 Boost 仍可能存在輸入經電感和二極體的導通路徑。",
    "check": {
      "q": "Boost 的 MOSFET ON 時，二極體截止，那負載當下主要由誰供能？",
      "a": "主要由輸出電容供電；電感此時由輸入儲能，OFF 時再經二極體向輸出傳能。"
    },
    "tryIt": "回到 Boost CCM 既有互動課節，比對電感 iL、Gate、二極體路徑與輸入／輸出功率。"
  },
  "11": {
    "lesson": "mid-boost-rl",
    "title": "電感有銅阻 RL，Boost 為什麼開始升不到理想電壓？",
    "question": "電感線圈只多一點電阻，為什麼高 Duty 的升壓效果就會明顯變差？",
    "takeaway": "電感平均電流越大，銅阻的壓降 IL·RL 與熱損 I²·RL 越大；伏秒平衡要把 RL 納入，不能只套 1/(1−D)。",
    "intuition": [
      "電感不是一根沒有電阻的理想導線。繞線電阻 RL 在 ON、OFF 兩段都伴隨電感電流。電感流過越大的電流，就越多電壓掉在銅線上、越多能量變熱。",
      "升壓很高時輸入平均電流通常比輸出大，而且輸出電流只在 OFF 的一部分時間由二極體傳遞；把 RL 忽略，看似只少幾十或幾百毫歐，但它對高 Duty 的影響會被放大。"
    ],
    "steps": [
      {
        "title": "1. 先寫 ON 的電感電壓",
        "detail": "用週期平均電流 IL 代表電阻壓降，近似 vL,ON=Vin−IL·RL。MOSFET 開通時二極體不供能。"
      },
      {
        "title": "2. 寫 OFF 的電感電壓",
        "detail": "OFF 時電感向輸出放能，近似 vL,OFF=Vin−Vo−IL·RL；電流在一個完整週期仍要回到起點。"
      },
      {
        "title": "3. 伏秒平衡多出 RL·IL",
        "detail": "ON×D 加 OFF×(1−D) 得到 Vin=(1−D)Vo+IL·RL，與理想式多了銅阻平均壓降。"
      },
      {
        "title": "4. 用輸出電容電荷平衡消去 IL",
        "detail": "理想二極體只有 OFF 導通，平均 Io=(1−D)IL；若電阻負載 Io=Vo/R，就可解出含 RL 的電壓增益。"
      }
    ],
    "equations": [
      {
        "label": "電感平均伏秒平衡",
        "tex": "V_{in}=(1-D)V_o+I_LR_L",
        "plain": "Vin=(1−D)Vo+IL·RL",
        "why": "以近似不變的週期平均 IL 計算銅阻壓降；ON、OFF 期間都要扣除 RL 的壓降。"
      },
      {
        "label": "輸出電流的平均關係",
        "tex": "I_o=(1-D)I_L=\\frac{V_o}{R}",
        "plain": "Io=(1−D)IL=Vo/R",
        "why": "電感向輸出送電的路徑只在 OFF 導通，使用理想 CCM 與小漣波平均模型。"
      },
      {
        "label": "只考慮 RL 的 Boost 增益",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{1-D}{(1-D)^2+R_L/R}",
        "plain": "Vo/Vin=(1−D)/[(1−D)²+RL/R]",
        "why": "用兩個平均關係聯立求解；高 Duty 時分母的 RL/R 不再能忽略。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=50%、電阻負載 R=20 Ω、電感銅阻 RL=0.2 Ω；只計導通銅損並假設 CCM。",
      "steps": [
        "設 x=1−D=0.5，RL/R=0.2/20=0.01；理想增益是 1/x=2。",
        "含銅阻的增益 M=x/(x²+RL/R)=0.5/(0.25+0.01)=1.9231，所以 Vo≈92.31 V。",
        "Io=Vo/R≈4.615 A，IL=Io/0.5≈9.231 A；RL 平均壓降≈1.846 V，符合 Vin≈0.5×92.31+1.846=48 V。"
      ],
      "result": "同樣 Duty 的輸出由理想 96 V 變成約 92.31 V；這些減少的輸出能力與電感銅損有直接關係。"
    },
    "assumptions": [
      "只納入電感串聯銅阻 RL，假設 CCM、固定 R 負載、平均 iL 近似；沒有 MOSFET RDS(on)、二極體壓降或切換損失。",
      "銅阻受溫度影響，真實繞線電流 RMS 應計入漣波；這裡的 IL²RL 是簡化平均值估算。"
    ],
    "pitfall": "看到 0.2 Ω 遠小於 20 Ω 就以為完全能忽略；要先算的是 RL/[R(1−D)²]，不是只看 RL/R。",
    "check": {
      "q": "理想 Boost 的轉壓比不受負載電阻影響；加上 RL 後為什麼會依 R 改變？",
      "a": "因為負載越重，平均電感電流越大，RL 壓降與銅損就越大；帶入電荷平衡後增益分母出現 RL/R。"
    },
    "tryIt": "在「加入電感銅損的平均等效電路」課節固定 Duty，增加 RL 並觀察輸出電壓下降。"
  },
  "12": {
    "lesson": "mid-boost-rl",
    "title": "等效電路怎麼看？為什麼 RL 會被 (1−D)² 放大？",
    "question": "看著含 RL 的 Boost 等效電路，怎麼從輸入側的電感銅阻看出輸出側的壓降？",
    "takeaway": "利用 D′=1−D 的平均變比，把輸入側銅阻換算到輸出端後，相當於 RL/D′²；Duty 高時負載端感受到的等效阻抗會急速上升。",
    "intuition": [
      "與其記一個很長的增益分數，可以把理想 Boost 想成一個依 Duty 改變的平均轉換器：理想空載輸出相當於 Vin/D′，但內部有會吃掉部分電壓的銅阻。",
      "這個銅阻並不是元件本身突然變大。電流和電壓被不同的平均變比換算到輸出端，所以同一個物理 RL 會呈現 RL/D′² 的等效效果。"
    ],
    "steps": [
      {
        "title": "1. 先定義 OFF 比例 D′",
        "detail": "令 D′=1−D；在理想 CCM，Vo=Vin/D′，而 Io=D′IL。這兩條是把一次側／輸出端量換算的基礎。"
      },
      {
        "title": "2. 將銅阻壓降改寫",
        "detail": "由 Vin=D′Vo+RL·IL，兩邊除以 D′，得到 Vin/D′=Vo+(RL/D′)IL。"
      },
      {
        "title": "3. 將 IL 換成 Io",
        "detail": "代入 IL=Io/D′，可得 Vin/D′=Vo+Io·RL/D′²，這就是平均輸出側的串聯等效電阻。"
      },
      {
        "title": "4. 當作有內阻的理想電壓源理解",
        "detail": "以 R 作負載，輸出電壓相當於 Vin/D′ 乘上 R/(R+RL/D′²)；高 Duty 的等效銅阻可能遠大於實際 0.2 Ω。"
      }
    ],
    "equations": [
      {
        "label": "輸出側平均等效關係",
        "tex": "\\frac{V_{in}}{D'}=V_o+I_o\\frac{R_L}{D'^2}",
        "plain": "Vin/D′=Vo+Io·(RL/D′²)",
        "why": "由平均伏秒與 Io=D′IL 聯立而得，不是實體多了一顆電阻。"
      },
      {
        "label": "等效串聯電阻",
        "tex": "R_{eq,out}=\\frac{R_L}{(1-D)^2}",
        "plain": "Req,out=RL/(1−D)²",
        "why": "隨 D 增加，D′ 減少，等效內阻很快變大。"
      },
      {
        "label": "等效電壓分配",
        "tex": "V_o=\\frac{V_{in}}{D'}\\frac{R}{R+R_L/D'^2}",
        "plain": "Vo=(Vin/D′)×R/(R+RL/D′²)",
        "why": "同 P.11 的銅阻模型，只是重新寫成容易直覺理解的電壓源＋內阻。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=80%、RL=0.2 Ω、負載 R=20 Ω，假設理想 CCM 加單一電感銅阻。",
      "steps": [
        "D′=0.2，理想 Boost 的平均空載電壓源 Vin/D′=240 V。",
        "輸出側等效銅阻 Req=0.2/(0.2²)=5 Ω，雖然元件實際銅阻仍只有 0.2 Ω。",
        "Vo=240×20/(20+5)=192 V，比理想 240 V 低；IL=Vo/(R D′)=48 A，代表這組例子電流壓力非常大。"
      ],
      "result": "真正需留意的是高 Duty 對電流與熱設計的放大效應，不能拿 192 V 當作不受硬體限制的可用輸出。"
    },
    "assumptions": [
      "此平均變比僅在固定 Duty、穩態 CCM 和單一 RL 損失模型成立；它不是真實的高頻隔離變壓器。",
      "這組高 Duty／高電流純為示範等效阻抗；實際器件額定、電感飽和、二極體恢復及溫升都可能先超界。"
    ],
    "pitfall": "把 RL/D′² 誤認成元件溫度瞬間增加而變成 5 Ω，或者拿平均等效模型推斷 MOSFET 的切換過衝。",
    "check": {
      "q": "實際 RL=0.2 Ω，為什麼 D=80% 的輸出側等效阻抗會是 5 Ω？",
      "a": "因為 D′=0.2，電壓／電流的平均變比使 Req,out=RL/D′²=0.2/0.04=5 Ω；元件本身的物理銅阻沒有變。"
    },
    "tryIt": "回到 Boost RL 課節，固定負載 R，把 D 往上調，觀察輸出側等效阻抗為何快速放大。"
  },
  "13": {
    "lesson": "mid-boost-efficiency",
    "title": "Boost Duty 越大為什麼反而可能升壓變差？",
    "question": "理想 Boost 的 D 越接近 100% 增益越大，為什麼含 RL 的曲線可能先升後降？",
    "takeaway": "含 RL 的平均增益 M=D′/(D′²+RL/R) 有真正的最大值；超過最佳 Duty，增加的電流損耗會比理想升壓效果更強。",
    "intuition": [
      "理想公式把所有電流都當成不需付出代價，所以 Duty 越大，模型只看到可用的高轉壓比。但電感銅阻吃掉的是電流平方相關功率，高 Duty 的電流應力足以把額外升壓抵消。",
      "轉壓增益曲線在某個 Duty 後掉下來，並不是電感突然失去儲能能力，而是模型中的內部電阻壓降成為主導，輸出端所剩的電壓反而減少。"
    ],
    "steps": [
      {
        "title": "1. 用 D′ 與 q 簡化模型",
        "detail": "設 x=D′=1−D、q=RL/R，則 M(x)=x/(x²+q)。這讓曲線的兩個競爭項更容易辨識。"
      },
      {
        "title": "2. x 接近 1 時轉壓較低",
        "detail": "D 小，Boost 的 ON 儲能時間較短，理想升壓作用弱，所以增益通常不大。"
      },
      {
        "title": "3. x 持續縮小時銅損開始占優勢",
        "detail": "D 接近 1 時，分母中的 x² 趨近 0，但 q 仍存在；M 不會像理想 1/x 一樣無限上升。"
      },
      {
        "title": "4. 求曲線最大值",
        "detail": "對 x 微分 dM/dx=(q−x²)/(x²+q)²，令導數為 0 可得 x=√q；當 0<q<1，D*=1−√q。"
      }
    ],
    "equations": [
      {
        "label": "Boost RL 平均增益",
        "tex": "M=\\frac{x}{x^2+q},\\quad x=1-D,\\ q=\\frac{R_L}{R}",
        "plain": "M=x/(x²+q)，x=1−D，q=RL/R",
        "why": "只考慮電感銅阻，且使用 CCM 固定電阻負載平均模型。"
      },
      {
        "label": "峰值條件（0<q<1）",
        "tex": "D^*=1-\\sqrt{q}",
        "plain": "D*=1−√(RL/R)",
        "why": "由 M(x) 的局部極值求得；必須檢查極值真的在 0<D<1 的範圍內。"
      },
      {
        "label": "可達到的最大增益（RL-only）",
        "tex": "M_{max}=\\frac{1}{2\\sqrt{q}}",
        "plain": "Mmax=1/[2√(RL/R)]",
        "why": "此上限只是 RL 平均模型的數學最大值，實機通常有更早的電流或溫度限制。"
      }
    ],
    "worked": {
      "given": "假設 RL/R=0.01，令 x=1−D，保持 Vin 與 R 固定，理想 CCM。",
      "steps": [
        "最佳 x*=√0.01=0.1，所以數學峰值 D*=90%，Mmax=1/(2×0.1)=5。",
        "當 D=80%，x=0.2，M=0.2/(0.04+0.01)=4。",
        "當 D=95%，x=0.05，M=0.05/(0.0025+0.01)=4，已經比 D=90% 時低。"
      ],
      "result": "同一電源由 Duty 80% 增到 90% 時增益由 4 增至 5，但再增到 95% 卻回落到 4；理想 CCM 公式在此已明顯失真。"
    },
    "assumptions": [
      "只有單一電感銅阻 RL，忽略 MOSFET／二極體／開關損，且沿路都假設有符合條件的 CCM 穩態。",
      "D* 是數學峰值，不代表控制器應實際操作在此點；器件飽和、熱限制和回授可先限制 Duty。"
    ],
    "pitfall": "把『找到增益最大值』誤認為『找到效率最佳點』；最大增益所在 Duty 未必具有良好效率，也可能完全不能安全運作。",
    "check": {
      "q": "RL/R=0.01 的 Boost，D=90% 已達銅損模型的增益峰值；再增加到 95% 會發生什麼？",
      "a": "依 M=D′/(D′²+0.01)，增益會從 5 降到約 4；高 Duty 的電感銅損限制了可用增益。"
    },
    "tryIt": "在「輸出電壓與效率對 Duty」課節，先固定 RL/R 再掃 Duty，找出增益轉折，而非只看最右端。"
  },
  "14": {
    "lesson": "mid-boost-efficiency",
    "title": "Boost 的效率為何可能在高 Duty 急速惡化？",
    "question": "只看電感銅阻，不算 MOSFET 或二極體損耗，為什麼效率也可能從 67% 掉到 11%？",
    "takeaway": "當負載不變而 D′ 越小，維持 Io 所需的平均電感電流越大；RL 的 I² 損耗會快速增加，使 RL-only 效率 η=1/[1+RL/(R D′²)] 降低。",
    "intuition": [
      "一個電源不是因為輸出電壓高就有效率。效率看的是真正抵達負載的功率，占輸入功率的比例。若為了少量輸出電流，就要在電感裡搬運很大的電流，銅線會先發熱。",
      "電感 RL 的功率損耗以 IL² 放大，而輸出只在 OFF 時間由二極體收能，因此 D′ 變小會使銅損在能量帳裡越來越顯著。"
    ],
    "steps": [
      {
        "title": "1. 先定義效率與電流",
        "detail": "η=Po/Pin；理想二極體平均 Io=D′IL，負載電阻 R 對應 Po=Io²R。"
      },
      {
        "title": "2. 只計電感銅損",
        "detail": "以平均電流估計 Pcu≈IL²RL，先不計 MOSFET、二極體、電容、磁芯與切換能量。"
      },
      {
        "title": "3. 把損失與輸出功率相比",
        "detail": "Pcu/Po≈(IL²RL)/(D′²IL²R)=RL/(D′²R)，因此 η≈1/[1+RL/(D′²R)]。"
      },
      {
        "title": "4. 不要把模型當真機效率",
        "detail": "器件損失還有 Eon/Eoff、導通阻抗、二極體恢復、驅動、磁芯與溫升，且 RL 隨溫度變；實際 η 往往更低。"
      }
    ],
    "equations": [
      {
        "label": "效率的基本定義",
        "tex": "\\eta=\\frac{P_o}{P_{in}}=\\frac{P_o}{P_o+P_{loss}}",
        "plain": "η=Po/Pin=Po/(Po+Ploss)",
        "why": "每一個忽略的損失都會使預測偏樂觀；此處只把電感銅損納入 Ploss。"
      },
      {
        "label": "RL-only Boost 效率",
        "tex": "\\eta_{RL}=\\frac{1}{1+\\frac{R_L}{R(1-D)^2}}",
        "plain": "ηRL=1/[1+RL/(R(1−D)²)]",
        "why": "利用 Io=D′IL 及 Po=Io²R，推得損失占比如何隨 Duty 變化。"
      },
      {
        "label": "銅損與輸出功率比",
        "tex": "\\frac{P_{cu}}{P_o}\\approx\\frac{R_L}{R(1-D)^2}",
        "plain": "Pcu/Po≈RL/[R(1−D)²]",
        "why": "它指出高 Duty 的損耗放大因素，使用平均 IL，不代表完整的 RMS 損失分析。"
      }
    ],
    "worked": {
      "given": "只考慮電感銅阻，固定 RL/R=0.02，分別測 D=80%、90%、95%。",
      "steps": [
        "D=80%，D′=0.2，η=1/[1+0.02/0.04]≈66.7%。",
        "D=90%，D′=0.1，η=1/[1+0.02/0.01]≈33.3%。",
        "D=95%，D′=0.05，η=1/[1+0.02/0.0025]≈11.1%；Duty 只多 5 個百分點，損失占比卻急升。"
      ],
      "result": "只要 RL/R 非零，高 Duty 就可能付出龐大的損耗代價。設計時要先確認電流、熱與保護，不是只追求更高的轉壓比。"
    },
    "assumptions": [
      "RL-only 平均 CCM 模型，不是完整 Boost 效率預測；只計 RL，忽略所有其他真實元件及開關損失。",
      "把 IL²RL 當銅損的近似只在電流漣波相對平均值小時較適合；大漣波須改用 RMS 電流。"
    ],
    "pitfall": "看到 η=66.7% 就說產品實測效率是 66.7%，或把 RL-only 理論曲線拿來推斷整台 PFC 的效率。",
    "check": {
      "q": "RL/R 固定，Boost D 從 90% 增加到 95%，為什麼只有小小的 Duty 變化卻可能讓效率大幅下降？",
      "a": "因為控制效率的分母含 D′²；D′ 從 0.1 降到 0.05，對應的銅損占比放大四倍。"
    },
    "tryIt": "在「輸出電壓與效率對 Duty」課節，同時比較 Gain 與 η，觀察增益峰值不等於良好效率。"
  },
  "15": {
    "lesson": "mid-boost-parasitic",
    "title": "Boost 開始計算 MOSFET、二極體損耗時，先畫哪兩張等效電路？",
    "question": "除了電感 RL，MOSFET RDS(on)、二極體 Vf／RD 分別在哪一段造成壓降？",
    "takeaway": "同一電感在 ON、OFF 的導通路徑不同；電阻壓降與二極體固定 Vf 必須按實際導通階段分開列出，再用平均伏秒和電荷平衡求輸出。",
    "intuition": [
      "每個元件的損耗不是隨便塞進一個『效率折扣』。MOSFET 只在 ON 承受主要電感電流；二極體在 OFF 導通才有 Vf 和 RD 壓降；電感 RL 則在兩段都承受電流。",
      "先逐段畫出導通路徑，才能知道哪些電阻該乘 D、哪些該乘 (1−D)。即使算出平均電壓，也還不代表算到切換瞬間的 Eon、Eoff 或 Qrr。"
    ],
    "steps": [
      {
        "title": "1. ON：MOSFET 與電感銅阻導通",
        "detail": "二極體反偏，電感兩端約 vL,ON=Vin−IL(RL+RON)；電容暫供負載電流。"
      },
      {
        "title": "2. OFF：二極體導通，MOSFET 截止",
        "detail": "電感兩端約 vL,OFF=Vin−Vo−VD−IL(RL+RD)；OFF 時 MOSFET RON 不在主要續流路徑。"
      },
      {
        "title": "3. 伏秒平衡找出等效串聯阻抗",
        "detail": "把 ON 和 OFF 各乘導通比例並相加，可得 Vin=(1−D)(Vo+VD)+IL[RL+D RON+(1−D)RD]。"
      },
      {
        "title": "4. 再使用平均輸出電流解出 Vo",
        "detail": "理想 CCM 且忽略二極體反向恢復時，Io≈(1−D)IL=Vo/R。最後才能得到含 RL、RON、RD、VD 的平均增益。"
      }
    ],
    "equations": [
      {
        "label": "ON／OFF 的電感壓降",
        "tex": "v_{L,on}\\approx V_{in}-I_L(R_L+R_{on})",
        "plain": "vL,on≈Vin−IL(RL+Ron)",
        "why": "僅 ON 時 MOSFET RDS(on) 出現在主要電流路徑，並以平均 IL 近似瞬時電流。"
      },
      {
        "label": "含寄生壓降的平均伏秒",
        "tex": "V_{in}=D'(V_o+V_D)+I_L(R_L+DR_{on}+D'R_D)",
        "plain": "Vin=D′(Vo+VD)+IL(RL+D Ron+D′RD)",
        "why": "D′=1−D；二極體固定壓降只出現在 OFF，電感 RL 則兩段都有。"
      },
      {
        "label": "等效增益（R 負載、CCM）",
        "tex": "V_o=\\frac{(V_{in}-D'V_D)D'}{D'^2+[R_L+DR_{on}+D'R_D]/R}",
        "plain": "Vo=(Vin−D′VD)D′/[D′²+(RL+D Ron+D′RD)/R]",
        "why": "由 Io=D′IL=Vo/R 消去 IL；尚不含開關損、電流漣波造成的 RMS 差異。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=50%、R=20 Ω、RL=0.2 Ω、RON=0.1 Ω、RD=0.05 Ω、VD=0.7 V，假設 CCM。",
      "steps": [
        "D′=0.5，等效導通電阻 rEff=0.2+0.5×0.1+0.5×0.05=0.275 Ω。",
        "Vo=(48−0.5×0.7)×0.5/[0.5²+0.275/20]=23.825/0.26375≈90.33 V。",
        "Io≈4.52 A，IL≈9.03 A。相較理想 96 V，寄生導通壓降使輸出降低，實際熱損仍需另行計算。"
      ],
      "result": "不要把每顆電阻無條件相加成同一個導通路徑；正確係數由 ON／OFF 導通時間與路徑決定。"
    },
    "assumptions": [
      "非同步 Boost 固定 Duty、CCM、小漣波、固定 R 負載；RON、RD、RL 與 VD 都視為常數。",
      "未包含二極體反向恢復、MOSFET 切換過渡、Coss、驅動損、佈線寄生、磁芯損耗或熱效應。"
    ],
    "pitfall": "把二極體 Vf 放進 ON 時段、把 MOSFET RDS(on) 放進 OFF 時段，或把平均等效的增益當作完整效率與切換波形。",
    "check": {
      "q": "為什麼 Boost 的 MOSFET RDS(on) 前面乘 D，而二極體 RD 前面乘 D′？",
      "a": "因為 MOSFET 主要在 ON 導通，二極體主要在 OFF 導通；兩者在電感伏秒平均中各自只貢獻對應導通區間。"
    },
    "tryIt": "到 Boost 寄生損耗既有課節，先畫 ON／OFF 電流路徑，再逐一提高 RON 或二極體 Vf，檢查增益變化。"
  },
  "16": {
    "lesson": "mid-boost-parasitic",
    "title": "Boost 的 ON／OFF 波形：iL、iC、vL、vSW 怎麼互相對應？",
    "question": "為什麼 MOSFET 的 Gate 是方波，電感電流是三角波，電容電流甚至會在同一 OFF 階段跨過零？",
    "takeaway": "每段電流都有自己的物理路徑：ON 時 iL 上升、iC≈−Io；OFF 時 iL 下降、iC≈iL−Io。Gate 指令和開關節點電壓不能混成一條曲線。",
    "intuition": [
      "看示波器時，先問『探棒到底在量什麼』：Gate 是控制命令，vSW 是功率節點電壓，iL 是元件內電流，iC 是電感／二極體送進輸出和負載抽走之間的差額。它們在同一 PWM 週期內有時間關係，但不是同一種訊號。",
      "Boost 的輸出電容並不只在 OFF 時無條件充電。如果 OFF 初期 iL>Io，它會充電；當 iL 降到 Io 以下，就算二極體仍導通，電容也會開始放電。"
    ],
    "steps": [
      {
        "title": "ON｜Gate 指令高、vSW 接近低電位",
        "detail": "MOSFET 導通，二極體截止，理想 vL≈Vin，iL 以正斜率上升；輸出電容供負載，iC≈−Io。"
      },
      {
        "title": "OFF｜Gate 指令低、vSW 被輸出側箝位",
        "detail": "MOSFET 關斷，電感迫使開關節點上升使二極體導通；理想 vL≈Vin−Vo 為負，iL 沿斜坡下降。"
      },
      {
        "title": "OFF 的電容電流可以先正再負",
        "detail": "因為 iC=iD−Io≈iL−Io，隨 iL 下降，若跨過 Io，電容電流就由充電變成放電；不要只用 Gate 判定電容正在充電。"
      },
      {
        "title": "把寄生壓降加回真實電路",
        "detail": "ON 的 vL 會扣 RL／RON，OFF 再扣 VD／RD；示波器上 vSW 還可能出現 Coss、寄生 L 與二極體反向恢復造成的振鈴。"
      }
    ],
    "phases": [
      {
        "name": "ON：iL 上升／C 放電",
        "pct": 40
      },
      {
        "name": "OFF：iL 下降／C 可充或放電",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "電感電流斜率",
        "tex": "\\frac{di_L}{dt}=\\frac{v_L}{L}",
        "plain": "diL/dt=vL/L",
        "why": "ON 的 vL 通常為正，OFF 在 Vo>Vin 時為負，所以 iL 為近似三角波。"
      },
      {
        "label": "電容電流分段關係",
        "tex": "i_C=\\begin{cases}-I_o,&ON\\\\i_L-I_o,&OFF\\end{cases}",
        "plain": "iC=−Io（ON）；iC=iL−Io（OFF）",
        "why": "ON 時輸出二極體截止，OFF 時理想二極體電流等於電感電流；由輸出端 KCL 得到。"
      },
      {
        "label": "理想 CCM 電感漣波",
        "tex": "\\Delta I_L=\\frac{V_{in}D}{Lf_s}",
        "plain": "ΔIL=Vin×D/(L×fs)",
        "why": "這是理想 Buck/Boost 不同拓樸要分清的公式：Boost ON 階段 vL≈Vin。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=40%、fs=100 kHz、L=120 µH、理想 Vo=80 V、Io=1 A，假設 CCM。",
      "steps": [
        "週期 10 µs，ON=4 µs、OFF=6 µs；vL,ON=+48 V、vL,OFF=48−80=−32 V。",
        "ΔIL,ON=48×4µs/120µH=+1.6 A，OFF 下降 32×6µs/120µH=−1.6 A。",
        "Iin≈Io/(1−D)=1.667 A，因此 iL 谷值約 0.867 A、峰值約 2.467 A；OFF 初期 iC 約 +1.467 A，末期約 −0.133 A。"
      ],
      "result": "輸出二極體仍在 OFF 導通時，電容電流也能由正轉負；電流方向一定要靠 KCL 判定，不能只看 Gate。"
    },
    "assumptions": [
      "理想非同步 Boost、固定 Vo／Io、CCM；用三角電感電流和理想二極體建立波形，尚未包含換流短暫過渡。",
      "實際 vSW、VDS、Gate VGS 波形及反向恢復，需要元件資料與示波器確認；本頁只示範時序和電流關係。"
    ],
    "pitfall": "把 Gate 0/1 當成真正的 VGS 波形；或以為 OFF 的二極體有電流時，輸出電容一定整段都在充電。",
    "check": {
      "q": "Boost OFF 時 iL 由 2.5 A 降到 0.9 A，Io=1 A，電容電流可能發生什麼變化？",
      "a": "iC≈iL−Io，所以會先為正、跨過 iL=1 A 變成負；即使二極體仍導通也可能有這種轉換。"
    },
    "tryIt": "回到 Boost 波形相關互動模型，固定 Duty 觀察 iL／vL 的斜率，再區分二極體電流與電容電流。"
  },
  "17": {
    "lesson": "mid-boost-parasitic",
    "title": "從 ON／OFF 等效電路，如何自己推導 Boost 的平均增益？",
    "question": "看到一張包含 RL、RON、VD、RD 的 Boost 電路，怎麼有順序地整理，而不是硬背一串長公式？",
    "takeaway": "先寫兩段電感 KVL，再寫輸出電容平均電流為零，最後聯立。ON／OFF 電阻必須按各自的導通比例加權。",
    "intuition": [
      "平均模型的好處不是把元件『變不見』，而是把非常快的開關過程濃縮成每週期可理解的兩個平衡：電感電流不能逐週發散，電容電壓也不能逐週無限制飄移。",
      "電感有伏秒平衡，電容有電荷平衡。前者找電壓和電感電流的關係，後者告訴你哪一段有電流流入輸出；兩者缺一不可。"
    ],
    "steps": [
      {
        "title": "第一步｜指定參考方向",
        "detail": "設 iL 正方向由 Vin 流向開關節點，Vo 為正輸出，Io=Vo/R；讓每一個 KVL、KCL 都沿相同方向，避免莫名其妙的負號。"
      },
      {
        "title": "第二步｜寫 ON 的 vL",
        "detail": "MOSFET 導通：vL,on≈Vin−IL(RL+RON)；二極體截止，電容平均在 ON 提供 −Io。"
      },
      {
        "title": "第三步｜寫 OFF 的 vL",
        "detail": "MOSFET 截止、二極體導通：vL,off≈Vin−Vo−VD−IL(RL+RD)。"
      },
      {
        "title": "第四步｜伏秒＋電荷雙平衡",
        "detail": "D·vL,on+(1−D)·vL,off≈0，且 Io=(1−D)IL；代入 Io=Vo/R，即可得到含寄生的平均增益。"
      }
    ],
    "equations": [
      {
        "label": "電感電壓平均為零",
        "tex": "D v_{L,on}+(1-D)v_{L,off}=0",
        "plain": "D×vL,on+(1−D)×vL,off=0",
        "why": "穩態平均電感電壓為零，必須使用 ON／OFF 各自的導通路徑。"
      },
      {
        "label": "輸出端平均電容電流為零",
        "tex": "D(-I_o)+(1-D)(I_L-I_o)=0",
        "plain": "D(−Io)+(1−D)(IL−Io)=0",
        "why": "理想 CCM 輸出電容在完整週期的淨電荷變化為零；整理得 Io=(1−D)IL。"
      },
      {
        "label": "平均電路結果",
        "tex": "V_{in}=D'(V_o+V_D)+I_L(R_L+DR_{on}+D'R_D)",
        "plain": "Vin=D′(Vo+VD)+IL(RL+D Ron+D′RD)",
        "why": "由電感平均方程整理，D′=1−D；再與 Io=Vo/R 聯立才能解 Vout。"
      }
    ],
    "worked": {
      "given": "用只含 RL 的簡化特例驗算：Vin=48 V、D=50%、RL=0.2 Ω、R=20 Ω，VD／RON／RD 暫設為零。",
      "steps": [
        "伏秒平衡：48=0.5Vo+0.2IL；電荷平衡：Io=0.5IL，且 Io=Vo/20。",
        "將 IL=Vo/(20×0.5)=Vo/10 代入，得 48=(0.5+0.02)Vo=0.52Vo。",
        "因此 Vo≈92.31 V、Io≈4.615 A、IL≈9.231 A；反代原式：0.5×92.31+0.2×9.231≈48 V。"
      ],
      "result": "兩個獨立的平衡關係一起成立，才表示你寫的平均路徑和導通比例自洽；只用一條伏秒式通常還解不出負載電流。"
    },
    "assumptions": [
      "固定 Duty、電阻負載、CCM、平均 IL 代表導通期間電流，忽略 ESR 對直流平均的影響。",
      "本頁是簡化平均模型，不等於含換流過渡與控制補償的實機時域模擬；波形 RMS 與切換損耗另算。"
    ],
    "pitfall": "只寫電感的伏秒平衡就任意指定 IL，或漏掉輸出電容電荷平衡，導致產生不符合負載的輸出結果。",
    "check": {
      "q": "Boost 若只知道 Vin、D、RL、R，為什麼不能只靠 Vin=D′Vo+RL IL 直接解 Vo？",
      "a": "這一條同時有 Vo、IL 兩個未知數，還要由輸出端電容電荷平衡得到 Io=D′IL=Vo/R，才能聯立求解。"
    },
    "tryIt": "在既有 Boost 含寄生課節，選一組參數，逐一核對 ON／OFF 伏秒和輸出平均電流關係。"
  },
  "18": {
    "lesson": "mid-boost-parasitic",
    "title": "Boost 的理想變比等效電路，是把什麼換算到輸出端？",
    "question": "平均模型裡出現像變壓器的符號，是不是 Boost 裡真的藏著一顆隔離變壓器？",
    "takeaway": "這是非隔離 Boost 的平均功率變比表示法，不是實體磁耦合元件；用 D′=1−D 換算電壓、電流，就能把電感銅阻視為輸出端等效內阻。",
    "intuition": [
      "理想無損 Boost 的功率守恆和變壓器很像：電壓在一端放大，電流在另一端縮小。畫成依 Duty 變化的『理想變比元件』只是方便分析的數學等效。",
      "有 RL 時，不能直接把原本 0.1 Ω 拿到輸出端串聯不變。因為電壓與電流各經過一個 D′ 的換算因子，等效電阻必須按平方比例換算。"
    ],
    "steps": [
      {
        "title": "定義平均轉換倍率",
        "detail": "設 D′=1−D。理想 Boost CCM 的 Vo=Vin/D′，Io=D′IL；這是平均電壓和電流的相依關係。"
      },
      {
        "title": "把輸入伏秒式改寫成輸出側",
        "detail": "Vin=D′Vo+RL IL；兩邊除以 D′ 得 Vin/D′=Vo+RL IL/D′。"
      },
      {
        "title": "將電感電流換成輸出電流",
        "detail": "IL=Io/D′，於是 Vin/D′=Vo+Io RL/D′²，對輸出側就像串聯 Req=RL/D′²。"
      },
      {
        "title": "記得『平均等效』不是『瞬態元件』",
        "detail": "此等效電路用來快速估 Vo、效率與電流壓力，不能直接用來推導 MOSFET VDS 尖峰或電容 ESR 高頻漣波。"
      }
    ],
    "equations": [
      {
        "label": "理想平均電壓／電流換算",
        "tex": "V_o=\\frac{V_{in}}{D'},\\qquad I_o=D'I_L",
        "plain": "Vo=Vin/D′，Io=D′IL",
        "why": "理想 CCM 下的功率關係，D′ 代表 Boost 二極體的導通比例。"
      },
      {
        "label": "銅阻反映至輸出端",
        "tex": "R_{eq,out}=\\frac{R_L}{D'^2}",
        "plain": "Req,out=RL/D′²",
        "why": "每換算一次平均電壓與電流，都會引入 D′ 因子；此等效是數學換算，不是物理阻值變動。"
      },
      {
        "label": "輸出端電壓分壓",
        "tex": "V_o=\\frac{V_{in}}{D'}\\frac{R}{R+R_{eq,out}}",
        "plain": "Vo=(Vin/D′)×R/(R+Req,out)",
        "why": "輸出端等效電壓源與串聯內阻分壓，結果與直接用伏秒／電荷平衡相同。"
      }
    ],
    "worked": {
      "given": "Vin=24 V、D=50%、RL=0.1 Ω、負載 R=12 Ω，假設 RL-only CCM 平均模型。",
      "steps": [
        "D′=0.5，平均等效理想輸出電壓=24/0.5=48 V。",
        "反映到輸出側的銅阻 Req=0.1/0.5²=0.4 Ω。",
        "負載端 Vo=48×12/(12+0.4)≈46.45 V；IL=Vo/(12×0.5)≈7.74 A，RL 本體仍為 0.1 Ω。"
      ],
      "result": "以等效電路看，內阻是 0.4 Ω 的『輸出端數學表示』；實際感測或溫升還是發生在 0.1 Ω 的電感繞線上。"
    },
    "assumptions": [
      "只計電感銅阻且 CCM、電阻負載、固定 Duty；等效元件不是有隔離繞組的實體變壓器。",
      "高 Duty 會使等效電阻大幅升高，但真實器件可能先受飽和、熱、過流與頻率相關效應限制。"
    ],
    "pitfall": "把平均變比符號當成 Boost 真的隔離了輸入輸出，或直接拿輸出端等效阻抗當成電感的熱功耗電阻。",
    "check": {
      "q": "RL=0.1 Ω，D=50% 時，輸出端等效電阻是 0.1 Ω 還是 0.4 Ω？",
      "a": "在此 RL-only 平均 Boost 模型裡，輸出端等效為 RL/(1−D)²=0.1/0.25=0.4 Ω；實體銅阻仍是 0.1 Ω。"
    },
    "tryIt": "回到銅損等效電路課節，比較輸出側分壓法和輸入側伏秒法是否算出相同 Vo。"
  },
  "19": {
    "lesson": "mid-boost-parasitic",
    "title": "Boost 含 RL、RDS(on)、二極體 VD/RD，怎麼算增益與損耗？",
    "question": "同一個 Boost 加入好幾種寄生元件後，如何先算直流工作點，再做正確的功率帳？",
    "takeaway": "先用伏秒／電荷平衡解出 Vo 與 IL，再計算 RL、MOSFET、二極體分段導通損；這仍不是完整切換損耗與熱模型。",
    "intuition": [
      "公式的目的是把現實電路的限制拆成可觀察的來源。電感 RL 全週期有電流，MOSFET 只在 ON 主要導通，二極體只在 OFF 主要導通，二極體固定壓降 VD 也只在它導通時生效。",
      "當一組參數讓計算結果出現非常大的 IL，就代表你應先擔心元件額定及溫升，而不是因為程式能算出 Vo，就認定實機一定能工作。"
    ],
    "steps": [
      {
        "title": "先確認每段導通路徑",
        "detail": "ON：RL+RON；OFF：RL+RD+VD。令 D′=1−D，得到加權電阻 rEff=RL+D RON+D′RD。"
      },
      {
        "title": "求穩態 Vo，再回推電流",
        "detail": "由 Vin=D′(Vo+VD)+rEff IL 和 IL=Vo/(R D′)，可解 Vo=[Vin−D′VD]D′/[D′²+rEff/R]。"
      },
      {
        "title": "逐項計算導通損耗",
        "detail": "以平均 IL 的小漣波近似：PL≈IL²RL，PMOS≈D IL²RON，PD≈D′ IL²RD+VD Io。"
      },
      {
        "title": "核對平均輸入、輸出能量帳",
        "detail": "比較 Vin IL 與 Vo Io+各導通損。此平均式應相符，但並未計算 Eon/Eoff、Qrr、Coss、磁芯與寄生振鈴損失。"
      }
    ],
    "equations": [
      {
        "label": "ON／OFF 加權導通電阻",
        "tex": "r_{eff}=R_L+D R_{on}+(1-D)R_D",
        "plain": "rEff=RL+D Ron+(1−D)RD",
        "why": "RL 兩段都承受 iL，RON 只在 ON、RD 只在 OFF 主要導通。"
      },
      {
        "label": "含導通寄生的平均輸出",
        "tex": "V_o=\\frac{[V_{in}-(1-D)V_D](1-D)}{(1-D)^2+r_{eff}/R}",
        "plain": "Vo=[Vin−(1−D)VD](1−D)/[(1−D)²+rEff/R]",
        "why": "取穩態 CCM、定 R 負載與平均電流近似；若失去正輸出或 CCM，不能宣稱該值有效。"
      },
      {
        "label": "二極體平均導通損",
        "tex": "P_D\\approx (1-D)I_L^2R_D+V_DI_o",
        "plain": "PD≈(1−D)IL² RD+VD Io",
        "why": "固定壓降由二極體平均輸出電流 Io 計算；動態電阻需要導通時間加權，漣波大時應改用 RMS。"
      }
    ],
    "worked": {
      "given": "Vin=48 V、D=50%、R=20 Ω、RL=0.2 Ω、RON=0.1 Ω、RD=0.05 Ω、VD=0.7 V，忽略開關損。",
      "steps": [
        "rEff=0.2+0.5×0.1+0.5×0.05=0.275 Ω；Vo=23.825/(0.25+0.275/20)≈90.33 V。",
        "Io=Vo/20≈4.52 A，IL=Io/0.5≈9.03 A；按各時段導通電阻估 Pcond,res≈IL²×0.275≈22.44 W。",
        "二極體固定壓降損約 VD×Io≈3.16 W；輸入 Vin IL≈433.6 W、負載 Vo Io≈408.0 W，差額約 25.6 W。"
      ],
      "result": "平均功率差額可對應成已納入的寄生導通損。這個帳算平，不代表真實 switching loss、溫升或過衝已驗證。"
    },
    "assumptions": [
      "CCM、固定 D、電阻負載、小漣波、常數 RL／RON／RD／VD；利用 IL 平均值近似導通 RMS。",
      "實際損耗還有 MOSFET 電流 RMS、切換能量、二極體 Qrr／反恢復、Gate 驅動、磁芯與熱效應；不要用這條平均式做完整產品效率承諾。"
    ],
    "pitfall": "把 IL 直接乘各個電阻當成損耗 W，漏掉電流平方與導通比例；或把這些簡化導通損當成真實完整效率。",
    "check": {
      "q": "Boost 二極體固定 Vf 損耗為什麼近似 VD×Io，而不是 VD×IL？",
      "a": "因為二極體只在 OFF 的 D′ 比例導通，平均二極體電流就是 Io=D′IL，所以固定壓降的平均耗損為 VD Io。"
    },
    "tryIt": "在寄生平均模型課節提高 RON 或 VD，重新核對輸入與負載功率，最後再對比電流漣波帶來的 RMS 差異。"
  },
  "20": {
    "lesson": "mid-boost-parasitic",
    "title": "電流漣波很大時，為什麼不能只用平均電流估 MOSFET 損耗？",
    "question": "兩個電路的 MOSFET 平均導通電流一樣，為什麼三角電流漣波比較大的那一個更熱？",
    "takeaway": "電阻發熱取決於 RMS 電流的平方，不是平均電流的平方。Boost MOSFET 只在 ON 承受 iL，正確週期均方值還要乘導通比例 D。",
    "intuition": [
      "電阻熱量與電流平方成正比。就算有兩段較大和較小的電流互相抵消成相同平均值，高電流那段的平方會放大更多，因此 RMS 電流會高於平均值。",
      "在 Boost，MOSFET 只於 ON 時段導通，OFF 由二極體送能。計算 MOSFET 整個開關週期 RMS，必須同時考慮電感三角漣波和 MOSFET 導通時間；這和直接拿 iL 的週期平均值乘 D 再平方不一樣。"
    ],
    "steps": [
      {
        "title": "先畫出 MOSFET 電流波形",
        "detail": "理想 CCM 開關 ON 時 iMOS=iL，並從谷值線性升到峰值；OFF 時 iMOS≈0。"
      },
      {
        "title": "計算 ON 區段的三角波均方",
        "detail": "若 iL=IL+線性三角漣波，ON 區段平均 iL²=IL²+(ΔIL)²/12；後項就是漣波造成的額外熱。"
      },
      {
        "title": "換算到完整週期 RMS",
        "detail": "MOSFET 只導通 D 比例，故 IMOS,rms²≈D[IL²+(ΔIL)²/12]；乘上 RDS(on) 得近似導通損。"
      },
      {
        "title": "把導通損與切換損分開",
        "detail": "開關過渡期間 vDS、iD 同時非零會產生 Eon/Eoff，另需 Qrr、Coss、死區與溫度資料，不能混成 I²R 一項。"
      }
    ],
    "equations": [
      {
        "label": "電阻導通發熱的真正自變量",
        "tex": "P_R=I_{rms}^2R",
        "plain": "PR=Irms² R",
        "why": "平方發熱的平均值，才是能量耗散的正確基礎。"
      },
      {
        "label": "理想 Boost CCM MOSFET 週期 RMS",
        "tex": "I_{MOS,rms}^2=D\\left(I_L^2+\\frac{\\Delta I_L^2}{12}\\right)",
        "plain": "IMOS,rms²=D[IL²+(ΔIL)²/12]",
        "why": "ON 區段 iL 為線性三角波，OFF MOSFET 電流近零；若電流波形不是理想三角形需直接積分。"
      },
      {
        "label": "MOSFET 導通損",
        "tex": "P_{MOS,cond}\\approx R_{DS(on)}I_{MOS,rms}^2",
        "plain": "PMOS,cond≈RDS(on) IMOS,rms²",
        "why": "忽略 RDS(on) 溫度變化、切換過渡與反向電流路徑。"
      }
    ],
    "worked": {
      "given": "Boost D=50%、IL 平均=4 A、ΔIL=4 App、MOSFET RDS(on)=40 mΩ，先只估導通損。",
      "steps": [
        "若忽略漣波，只按 IL=4 A 估：PMOS≈0.5×4²×0.04=0.320 W。",
        "加入三角漣波：IMOS,rms²=0.5×[4²+4²/12]=8.667 A²，因此 PMOS≈0.347 W。",
        "漣波額外增加約 0.0267 W（相較無漣波近似約 +8.33%）；如果錯拿 MOSFET 的平均電流 D IL=2 A 平方，還會低估更多。"
      ],
      "result": "同樣平均 IL，漣波越大 RMS 越大、導通損越高。平均模型適合先抓趨勢，但高漣波和熱設計須用真正的 RMS 波形。"
    },
    "assumptions": [
      "理想 CCM、ON 電感電流為線性斜坡、OFF MOSFET 無主要導通電流，RDS(on) 固定。",
      "本頁只比較導通損，不包含 switching loss、二極體反恢復、Coss、MOSFET 體二極體、溫度變化與 PCB 寄生。"
    ],
    "pitfall": "用 (D×IL)²RON 來估整週期 MOSFET 損耗，卻漏了開關 OFF 時電流為零以及 ON 的均方電流；或以為 ΔIL 變大不會影響熱。",
    "check": {
      "q": "Boost MOSFET 的 iL 平均為 4 A，D=50%，ΔIL 從 0 增到 4 App，RDS(on) 固定，導通熱會如何變？",
      "a": "會上升，因為週期 RMS² 從 D IL² 增加到 D[IL²+ΔIL²/12]；本例約由 0.320 W 升到 0.347 W。"
    },
    "tryIt": "回到寄生損耗課節，先比較平均模型，再用相同 Duty 下不同漣波的 RMS 公式交叉驗證。"
  },
  "21": {
    "lesson": "mid-boost-dcm",
    "title": "Boost 的 BCM 門檻怎麼算？為什麼 IL,crit 和 Io,crit 曲線不一樣？",
    "question": "同一個 Boost 的臨界輸入電感電流與臨界輸出負載電流，為什麼不是同一條曲線？",
    "takeaway": "BCM 電感谷值剛好碰 0，所以 IL,crit=ΔIL/2；輸出只在 OFF 時接收電感電流，Io,crit=(1−D)IL,crit。固定 Vo 時兩者對 D 的變化並不同。",
    "intuition": [
      "把電感電流想成一個三角形：負載越輕，整個三角形往下移；當最底點第一次碰 0 A，就是 CCM 與 DCM 的邊界。這個判斷看的是電感電流，不是 MOSFET Gate。",
      "Boost 的輸入電流在電感裡整個週期都有，而輸出二極體只在 OFF 的一段時間導通。因此即使 BCM 的電感電流平均已知，輸出電流仍要再乘上 OFF 比例。"
    ],
    "steps": [
      {
        "title": "1. 找到 BCM 的三角電流",
        "detail": "谷值=0、峰值=ΔIL，因此週期平均 IL,crit=Ipk/2；理想 CCM 邊界的漣波 ΔIL=Vin D/(Lfs)。"
      },
      {
        "title": "2. 轉成輸出臨界電流",
        "detail": "輸出只在 OFF 接收電流，Io,crit=(1−D)IL,crit=Vin D(1−D)/(2Lfs)。"
      },
      {
        "title": "3. 若固定 Vo，就把 Vin 換成 Vo(1−D)",
        "detail": "理想邊界仍有 Vo=Vin/(1−D)，因此 IL,crit=Vo D(1−D)/(2Lfs)，Io,crit=Vo D(1−D)²/(2Lfs)。"
      },
      {
        "title": "4. 比較曲線的峰值",
        "detail": "固定 Vo 時，IL,crit 隨 D(1−D) 變化，在 D=0.5 取峰值；Io,crit 隨 D(1−D)² 變化，在 D=1/3 取峰值。"
      }
    ],
    "equations": [
      {
        "label": "BCM 臨界電感電流（固定 Vin）",
        "tex": "I_{L,crit}=\\frac{V_{in}D}{2Lf_s}",
        "plain": "IL,crit=Vin D/(2 L fs)",
        "why": "谷值為零，電感平均就是正三角形峰值的一半。"
      },
      {
        "label": "輸出電流的臨界關係",
        "tex": "I_{o,crit}=(1-D)I_{L,crit}",
        "plain": "Io,crit=(1−D)IL,crit",
        "why": "Boost 二極體只於 OFF 導通，輸出端平均只接收其對應時段的電感電流。"
      },
      {
        "label": "固定 Vo 時的輸出臨界曲線",
        "tex": "I_{o,crit}=\\frac{V_oD(1-D)^2}{2Lf_s}",
        "plain": "Io,crit=Vo D(1−D)²/(2 L fs)",
        "why": "只在理想 BCM 邊界 Vo=Vin/(1−D) 可代換 Vin，才能得到固定 Vo 的曲線。"
      }
    ],
    "worked": {
      "given": "固定 Vo=100 V、D=50%、L=100 µH、fs=100 kHz，假設理想 Boost BCM。",
      "steps": [
        "理想邊界對應 Vin=Vo(1−D)=50 V。",
        "電感漣波 ΔIL=50×0.5/(100 µH×100 kHz)=2.5 App；IL,crit=1.25 A。",
        "Io,crit=(1−D)×1.25=0.625 A；Rcrit=100/0.625=160 Ω，電阻再增大則負載更輕，進入 DCM。"
      ],
      "result": "臨界輸入電感電流 1.25 A 與臨界輸出電流 0.625 A 不相等；使用固定 Vo 畫不同臨界曲線時，必須分清橫軸假設。"
    },
    "assumptions": [
      "理想非同步 Boost，固定頻率、線性 L、固定 Vo 的邊界掃描；不包含 Burst、PFM、同步反向電流或大漣波寄生。",
      "在 DCM 側的 Vo 與 Vin 關係會改變，不能把固定 Vo 邊界公式拿去當任意 DCM 工作點的輸出電流。"
    ],
    "pitfall": "把 IL,crit 和 Io,crit 畫成相同曲線，或忽略固定 Vo 條件，使 D 掃描時混用固定 Vin 的公式。",
    "check": {
      "q": "固定 Vo、L、fs 的理想 Boost，IL,crit 的 Duty 峰值在 50%；Io,crit 也在 50% 嗎？",
      "a": "不是。Io,crit 比 IL,crit 多乘一個 (1−D)，因此固定 Vo 時與 D(1−D)² 成正比，峰值在 D=1/3。"
    },
    "tryIt": "在 Boost BCM 課節，先固定 Vo、改 D，分別觀察臨界 IL 與臨界 Io 的曲線，確認兩者高點不同。"
  },
  "22": {
    "lesson": "mid-boost-dcm",
    "title": "Boost DCM 為什麼多出 ZERO 區段，還會讓轉壓比依負載改變？",
    "question": "輸入、Duty 都固定，Boost 輕載時電感電流先降到 0，為什麼 Vo 不再是 Vin/(1−D)？",
    "takeaway": "非同步 Boost DCM 由 ON、二極體續流、ZERO 三段組成；除了伏秒平衡，還要算二極體電流三角形面積才能解出 Vo 與負載。",
    "intuition": [
      "CCM 的 OFF 電流會一直流到下次 ON；當負載很輕時，電感電流可能提早放到 0 A，二極體因不能反向導通而停止。剩下的時間是 ZERO，不再把能量輸送到輸出。",
      "零電流區多出來後，真正釋能時間不再等於 1−D。即使 Duty 相同，輸出電流需求不同會改變二極體導通時間，也會使 DC 輸出電壓不同。"
    ],
    "steps": [
      {
        "title": "ON：電感由 0 升到 Ipk",
        "detail": "MOSFET ON，二極體截止，vL≈Vin。Ipk=Vin D/(Lfs)，輸出電容暫供負載。"
      },
      {
        "title": "DIODE：MOSFET OFF，電感下降到 0",
        "detail": "二極體導通，vL≈Vin−Vo<0，經過 Δ1 Ts 時間電流由 Ipk 降到零，故 Vin D=(Vo−Vin)Δ1。"
      },
      {
        "title": "ZERO：電感電流為零",
        "detail": "二極體截止，開關也關閉，iL=0；剩餘比例 1−D−Δ1 必須大於零，才能稱為 DCM。"
      },
      {
        "title": "輸出端用三角電流面積求平均",
        "detail": "只有二極體導通區把電流送給輸出，所以 Io=Ipk Δ1/2（注意不是 Ipk(D+Δ1)/2，那是 Buck DCM 的面積關係）。"
      },
      {
        "title": "若負載是 R，還要聯立 Io=Vo/R",
        "detail": "代入 Ipk 與 Δ1，求得增益 M=Vo/Vin 滿足 M(M−1)=R D²/(2Lfs)；此式需另外檢查 DCM 模式自洽。"
      }
    ],
    "phases": [
      {
        "name": "ON：升流",
        "pct": 30
      },
      {
        "name": "DIODE：釋能降至零",
        "pct": 39.22
      },
      {
        "name": "ZERO：電感電流為零",
        "pct": 30.78
      }
    ],
    "equations": [
      {
        "label": "ON 與二極體導通時間的伏秒平衡",
        "tex": "V_{in}D=(V_o-V_{in})\\Delta_1",
        "plain": "Vin D=(Vo−Vin)Δ1",
        "why": "ZERO 區段 iL=0，理想電感電壓近似零，因此只有前兩段提供伏秒。"
      },
      {
        "label": "DCM 二極體電流三角形平均",
        "tex": "I_o=\\frac{1}{2}I_{pk}\\Delta_1,\\quad I_{pk}=\\frac{V_{in}D}{Lf_s}",
        "plain": "Io=Ipk×Δ1/2，Ipk=Vin D/(Lfs)",
        "why": "只把二極體實際導通的三角面積算作輸出電流；ON 時電容仍然供電。"
      },
      {
        "label": "DCM 固定電阻負載的理想增益",
        "tex": "M=\\frac{1+\\sqrt{1+2RD^2/(Lf_s)}}{2}",
        "plain": "M=Vo/Vin=[1+√(1+2 R D²/(L fs))]/2",
        "why": "將 Io=Vo/R 與伏秒／電荷平衡聯立；算出 M 後還必須檢查 D+Δ1<1。"
      }
    ],
    "worked": {
      "given": "Vin=24 V、D=30%、L=100 µH、fs=100 kHz、負載 R=300 Ω，假設理想非同步 Boost DCM。",
      "steps": [
        "K=2 R D²/(Lfs)=2×300×0.3²/(100 µH×100 kHz)=5.4，M=(1+√6.4)/2≈1.765。",
        "Vo≈24×1.765=42.36 V；Ipk=24×0.3/(100 µH×100 kHz)=0.72 A。",
        "Δ1=D/(M−1)≈0.392，ZERO≈1−0.3−0.392=0.308>0；輸出 Io=0.72×0.392/2≈0.141 A，與 Vo/R≈0.141 A 相符。"
      ],
      "result": "DCM 的數值需同時符合輸出電流面積與正的 ZERO 時間；若 ZERO≤0，就不能把這個結果標示成有效 DCM。"
    },
    "assumptions": [
      "理想非同步 Boost、固定電阻負載、固定頻率與 Duty、零電流區二極體截止；Vo 在單週期內近似固定。",
      "無二極體恢復、寄生振鈴、切換損耗或閉迴路調節；若電流反向、ZERO≤0 或能量不平衡，應使用對應的其他工作模式。"
    ],
    "pitfall": "把 Boost DCM 的輸出平均電流誤寫成 Ipk(D+Δ1)/2（Buck DCM 形式），或拿 CCM 的 Vo=Vin/(1−D) 算全部輕載。",
    "check": {
      "q": "Boost DCM 的 iL 在 ON 和 OFF-DIODE 都有電流，為什麼輸出平均 Io 只用 Ipk×Δ1/2？",
      "a": "因為 ON 時輸出二極體截止，電感不直接向輸出送能；只有 OFF-DIODE 的三角電流面積對輸出平均電流有貢獻。"
    },
    "tryIt": "在 Boost BCM／DCM 課節從輕載往重載調，觀察 ZERO 消失，再比較 DCM 與 CCM 的輸出計算差別。"
  },
  "23": {
    "lesson": "mid-buckboost-ccm",
    "title": "反相 Buck-Boost 為何能升降壓，而且輸出是負電壓？",
    "question": "同一顆電感先充能再放能，怎樣從 ON／OFF 推出 24 V 輸入、Duty 40% 時 Vo=−16 V？",
    "takeaway": "先固定輸出參考極性；ON 時輸入讓電感充能，OFF 才經二極體向輸出放能，理想 CCM 有號比為 −D/(1−D)。",
    "intuition": [
      "反相 Buck-Boost 像在電感中先『存一桶能量』，再換一條路倒給輸出。ON 階段電感從輸入吸能、輸出電容暫時供負載；OFF 時二極體導通，電感改向輸出送能，所以不能把它當成 Buck 的相同供電路徑。",
      "負號不是能量變成負數，而是相對輸入共同參考地，典型反相拓樸的輸出端電壓極性與輸入相反。量測前要先確認正負端，尤其一般接地示波器的地夾不能任意接負輸出。"
    ],
    "steps": [
      {
        "title": "ON：電感儲能、輸出由電容供電",
        "detail": "MOSFET 導通、二極體截止，依選定電感方向 vL≈+Vin，iL 線性上升；此時輸入端電流只在開關導通路徑流過。"
      },
      {
        "title": "OFF：二極體導通、電感向負極性輸出釋能",
        "detail": "MOSFET 截止後電感電流不能突變，沿二極體向輸出供能；同一電感電壓方向下 vL≈−|Vo|，iL 線性下降。"
      },
      {
        "title": "穩態正負伏秒互相抵消",
        "detail": "一週期 iL 起點與終點相同，Vin·D·Ts−|Vo|·(1−D)·Ts=0，消去 Ts 後 |Vo|/Vin=D/(1−D)。"
      },
      {
        "title": "分別算輸入與輸出平均電流",
        "detail": "只有 ON 時輸入經開關供電感，只有 OFF 時電感經二極體供輸出；理想 CCM 下 Iin≈D IL,avg，Io≈(1−D)IL,avg。"
      }
    ],
    "phases": [
      {
        "name": "ON：儲能",
        "pct": 40
      },
      {
        "name": "OFF：向負輸出放能",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "週期電感伏秒",
        "tex": "V_{in}D-|V_o|(1-D)=0",
        "plain": "Vin×D−|Vo|×(1−D)=0",
        "why": "穩態電流不逐週漂移，兩段電感電壓乘時間的正負面積必須相等。"
      },
      {
        "label": "理想 CCM 有號轉壓比",
        "tex": "\\frac{V_o}{V_{in}}=-\\frac{D}{1-D}",
        "plain": "Vo/Vin=−D/(1−D)",
        "why": "先由伏秒求幅值，再按典型反相輸出相對共同地的極性加負號。"
      },
      {
        "label": "輸出電流與負載功率幅值",
        "tex": "I_o=(1-D)\\overline I_L,\\quad P_o=|V_o|I_o",
        "plain": "Io=(1−D)IL,avg；Po=|Vo|Io",
        "why": "OFF 二極體導通期間才有輸出電流，不能把整週期電感電流直接當 Io。"
      }
    ],
    "worked": {
      "given": "理想反相 Buck-Boost，Vin=24 V、D=0.4、R=8 Ω、L=100 µH、fs=100 kHz，先假設 CCM。",
      "steps": [
        "伏秒求 |Vo|=24×0.4/0.6=16 V，故有號 Vo=−16 V；輸出電流幅值 Io=16/8=2 A。",
        "電感平均 IL=2/(1−0.4)=3.333 A；漣波 ΔIL=24×0.4/(100 µH×100 kHz)=0.96 App。",
        "谷值約 3.333−0.48=2.853 A，大於零，CCM 假設成立；Iin≈D IL=1.333 A。",
        "輸入功率 24×1.333≈32 W，輸出功率幅值 16×2=32 W，符合理想功率守恆。"
      ],
      "result": "24 V 可得到 −16 V，但負號是極性而非負損耗；電流谷值、OFF 放能路徑和元件耐壓都要另外確認。"
    },
    "assumptions": [
      "適用理想固定頻率、二極體式反相 Buck-Boost、CCM、電阻負載，忽略導通壓降和切換損耗。",
      "開關與二極體的實際耐壓還需包含 Vin+|Vo| 與寄生過衝；公式不是元件額定或閉迴路穩定保證。"
    ],
    "pitfall": "把幅值 |Vo|=16 V 誤寫成共地輸出 +16 V，或用示波器接地夾接到負輸出節點造成短路。",
    "check": {
      "q": "為什麼 Vin=24 V、Duty 40% 的典型反相 Buck-Boost 有號 Vo=−16 V？",
      "a": "伏秒平衡決定輸出幅值 16 V；典型反相拓樸相對共同地的輸出極性與輸入相反，所以有號值為 −16 V。"
    },
    "tryIt": "到「傳統反相 Buck-Boost 的 CCM」課節，對照 ON／OFF 電感電壓與負載功率。"
  },
  "24": {
    "lesson": "mid-buckboost-dcm",
    "title": "BCM 是反相 Buck-Boost 哪個電流剛好碰到零？",
    "question": "非同步 Buck-Boost 的電感三角波下降到 0 A 時，怎麼計算臨界輸出電流和負載電阻？",
    "takeaway": "BCM 電感谷值恰好為零，但輸出只在 OFF 收到電感電流，因此 Io,B=(1−D)Ipk/2，而不是 Ipk/2。",
    "intuition": [
      "想像一個三角電流波形整體往下移：重載時谷值大於零是 CCM；谷值剛好碰到零是 BCM；更輕載時二極體截止後就會出現零電流區段。這個分類看 iL，不是看 Gate 有沒有關。",
      "輸出平均電流不能拿整個電感三角形直接求平均，因為反相 Buck-Boost 在 MOSFET ON 時二極體截止，電感並沒有向輸出送能；只有 OFF 的電流面積能計入負載。"
    ],
    "steps": [
      {
        "title": "ON：算從零上升的峰值",
        "detail": "理想 vL=Vin、ON 時間 D Ts，BCM 時 Ipk=Vin D/(Lfs)，此處電感谷值恰為 0。"
      },
      {
        "title": "OFF：電流降至零，剛好接上下一個 ON",
        "detail": "理想 BCM 沒有長的 ZERO 區；輸出只在 OFF 接收由 Ipk 線性下降到 0 的二極體電流。"
      },
      {
        "title": "OFF 面積轉成輸出平均電流",
        "detail": "OFF 比例是 1−D，三角電流面積為 Ipk(1−D)/2，故 Io,B=(1−D)Ipk/2。"
      },
      {
        "title": "由臨界輸出幅值換算 R",
        "detail": "邊界伏秒得 |Vo|=Vin D/(1−D)，代回可得 Io,B=|Vo|(1−D)²/(2Lfs)；R_B=|Vo|/Io,B。"
      }
    ],
    "phases": [
      {
        "name": "ON：0→Ipk",
        "pct": 40
      },
      {
        "name": "OFF：Ipk→0",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "BCM 峰值與臨界輸出電流",
        "tex": "I_{pk}=\\frac{V_{in}D}{Lf_s},\\quad I_{o,B}=\\frac{(1-D)I_{pk}}{2}",
        "plain": "Ipk=Vin D/(Lfs)；Io,B=(1−D)Ipk/2",
        "why": "只有二極體的 OFF 導通階段向輸出供電，因此三角面積需乘 OFF 比例。"
      },
      {
        "label": "以輸出幅值表示的臨界電流",
        "tex": "I_{o,B}=\\frac{|V_o|(1-D)^2}{2Lf_s}",
        "plain": "Io,B=|Vo|(1−D)²/(2Lfs)",
        "why": "將理想邊界 Vin D=|Vo|(1−D) 代換，不能把它當任意 DCM 點的負載式。"
      }
    ],
    "worked": {
      "given": "Vin=24 V、D=40%、L=100 µH、fs=100 kHz，理想反相 Buck-Boost 的 BCM。",
      "steps": [
        "先算輸出幅值 |Vo|=24×0.4/0.6=16 V。",
        "峰值 Ipk=24×0.4/(100 µH×100 kHz)=0.96 A，整週期平均電感電流為 0.48 A。",
        "負載臨界 Io,B=0.6×0.96/2=0.288 A；R_B=16/0.288≈55.56 Ω。"
      ],
      "result": "電感平均是 0.48 A，輸出平均只有 0.288 A；差異來自電感的 ON 儲能段沒有向輸出送電。"
    },
    "assumptions": [
      "僅適用理想、非同步、固定 Duty/頻率的反相 Buck-Boost BCM，忽略二極體恢復和寄生振鈴。",
      "同步整流可容許反向電流，或採 PFM/Burst 的控制時，零電流邊界需用相應模式重新分析。"
    ],
    "pitfall": "把 Ipk/2 直接當輸出 Io，漏掉輸出只在 OFF 有電流這個關鍵條件。",
    "check": {
      "q": "D=40%、BCM 時 Ipk=0.96 A，輸出臨界 Io 是 0.48 A 嗎？",
      "a": "不是；OFF 占比只有 60%，Io,B=(1−0.4)×0.96/2=0.288 A。"
    },
    "tryIt": "到「Buck-Boost 的臨界模式與 DCM」觀察電感谷值從正值下降到零的邊界。"
  },
  "25": {
    "lesson": "mid-buckboost-dcm",
    "title": "反相 Buck-Boost 進入 DCM，為什麼增益會跟負載有關？",
    "question": "電感提前把能量放完、多出 ZERO 區段後，為何不能直接套 CCM 的 D/(1−D)？",
    "takeaway": "DCM 的二極體放能區是 Δ₁Ts，並非整段 (1−D)Ts；需同時使用伏秒平衡和二極體電流三角形面積求解負載。",
    "intuition": [
      "當負載變輕，電感電流可能在 OFF 中途降到零，二極體因不能讓電流反向而截止，剩下的時間電感不再向輸出送能。這個『休息時間』叫 ZERO，是 DCM 的重要特徵。",
      "此時電感放能多久，取決於輸出電壓和負載需要多少電荷；同樣的 Vin、Duty，DCM 下的 Vo 會跟 L、fs 以及電阻 R 一起改變。"
    ],
    "steps": [
      {
        "title": "ON：電感從 0 A 上升到 Ipk",
        "detail": "vL≈Vin，Ipk=Vin D/(Lfs)；二極體截止，負載由輸出電容供電。"
      },
      {
        "title": "DIODE：電感在 Δ₁Ts 內降回 0 A",
        "detail": "vL≈−|Vo|，伏秒平衡給 Vin D=|Vo|Δ₁；此 Δ₁ 不一定等於 1−D。"
      },
      {
        "title": "ZERO：OFF 剩下的電感電流等於零",
        "detail": "二極體截止，直到下一次 ON 才恢復導通；比例 1−D−Δ₁ 必須大於零才是有效 DCM。"
      },
      {
        "title": "用輸出電流面積求固定 R 的增益",
        "detail": "Io=Ipk Δ₁/2，並令 Io=|Vo|/R；聯立後 |Vo|/Vin=D√[R/(2Lfs)]，仍須檢查 ZERO>0。"
      }
    ],
    "phases": [
      {
        "name": "ON：升流",
        "pct": 30
      },
      {
        "name": "DIODE：放能",
        "pct": 44.72135955
      },
      {
        "name": "ZERO：截止",
        "pct": 25.27864045
      }
    ],
    "equations": [
      {
        "label": "DCM 正負伏秒",
        "tex": "V_{in}D=|V_o|\\Delta_1",
        "plain": "Vin×D=|Vo|×Δ₁",
        "why": "ZERO 時理想電感電壓近似零，只有前兩段參與伏秒平衡。"
      },
      {
        "label": "二極體平均輸出電流",
        "tex": "I_o=\\frac{I_{pk}\\Delta_1}{2},\\quad I_{pk}=\\frac{V_{in}D}{Lf_s}",
        "plain": "Io=Ipk Δ₁/2；Ipk=Vin D/(Lfs)",
        "why": "輸出只收到二極體導通區的電流三角形面積；不能加上 ON 的電感電流。"
      },
      {
        "label": "固定 R 的理想 DCM 輸出幅值",
        "tex": "\\frac{|V_o|}{V_{in}}=D\\sqrt{\\frac{R}{2Lf_s}}",
        "plain": "|Vo|/Vin=D√[R/(2 L fs)]",
        "why": "伏秒與 Io=|Vo|/R 聯立而得，算完必須確認放能區和 ZERO 都是合理正值。"
      }
    ],
    "worked": {
      "given": "Vin=24 V、D=30%、L=100 µH、fs=100 kHz、R=100 Ω，假設理想反相 Buck-Boost DCM。",
      "steps": [
        "R/(2Lfs)=100/[2×100 µH×100 kHz]=5；|Vo|/Vin=0.3√5≈0.6708，因此 Vo≈−16.10 V。",
        "Ipk=24×0.3/(100 µH×100 kHz)=0.72 A，Δ₁=Vin D/|Vo|≈0.4472。",
        "ZERO=1−0.3−0.4472≈0.2528>0；二極體輸出平均 0.72×0.4472/2≈0.161 A，等於 |Vo|/100 Ω。"
      ],
      "result": "這是一組自洽 DCM 解：不只得到 Vo，還驗證了二極體電流面積與正的零電流空檔。"
    },
    "assumptions": [
      "固定電阻負載、固定 Duty/頻率、理想非同步反相 Buck-Boost DCM；不適用 CCM 的固定轉壓式。",
      "忽略開關壓降、ESR、磁芯損耗、同步整流與控制迴路；若 ZERO≤0，必須改用 BCM／CCM 解。"
    ],
    "pitfall": "把 OFF 全部當成二極體有電流，硬套 Δ₁=1−D；或把 Buck DCM 的 ON＋OFF 全三角面積誤算成此電路的 Io。",
    "check": {
      "q": "為何固定 Duty 的反相 Buck-Boost DCM 會隨電阻負載 R 改變 Vo？",
      "a": "因為 OFF 二極體放能時間會隨負載需求改變，聯立伏秒、二極體三角形電流面積與 Io=|Vo|/R 才能求 Vo。"
    },
    "tryIt": "在「Buck-Boost 的臨界模式與 DCM」課節改變 R，對照 ZERO 區段是否為正。"
  },
  "26": {
    "lesson": "mid-sepic-zeta",
    "title": "Ćuk、SEPIC、ZETA 的輸出極性和電流波形到底差在哪？",
    "question": "三者都可升降壓，為什麼 Ćuk 常是負輸出、SEPIC/ZETA 則常是正輸出？",
    "takeaway": "先認出能量轉移電容和兩顆電感的位置。典型 Ćuk 反相、SEPIC/ZETA 非反相，理想 CCM 比值幅度可相同，電流脈動卻不同。",
    "intuition": [
      "這些拓樸不只是換一顆二極體方向：它們用耦合電容在不同時段搬運能量，兩側電感又會改變電流的連續性。只背 D/(1−D) 看不出元件電流 RMS、輸出極性或 EMI 差異。",
      "當輸入電源怕脈動，常會注意典型 Ćuk/SEPIC 的輸入串聯電感；當輸出希望較平滑，常會注意典型 Ćuk/ZETA 的輸出串聯電感。這些只是拓樸特徵，不是保證 EMI 或效率的規格。"
    ],
    "steps": [
      {
        "title": "找到兩個電感和中間傳能電容",
        "detail": "確認輸入側、輸出側是否有串聯電感，電容如何經開關與二極體連結；它不是只用來抑制雜訊的旁路電容。"
      },
      {
        "title": "Ćuk：典型拓樸的輸出極性反相",
        "detail": "能量透過傳能電容轉移，理想 CCM 的有號增益為 −D/(1−D)，輸入與輸出電感可讓電流較連續。"
      },
      {
        "title": "SEPIC／ZETA：典型拓樸的輸出非反相",
        "detail": "它們的理想 CCM 增益為 +D/(1−D)；SEPIC 通常有較連續的輸入電流，ZETA 通常有較連續的輸出電流。"
      },
      {
        "title": "把理想增益當起點，非終點",
        "detail": "下一步仍需查各電感峰值、傳能電容耐壓與 RMS、開關電壓應力，以及可能進入 DCM 的情況。"
      }
    ],
    "equations": [
      {
        "label": "典型 Ćuk 理想 CCM",
        "tex": "\\frac{V_o}{V_{in}}=-\\frac{D}{1-D}",
        "plain": "Ćuk：Vo/Vin=−D/(1−D)",
        "why": "負號對應典型反相輸出；同幅值增益不代表能量傳遞路徑完全相同。"
      },
      {
        "label": "典型 SEPIC 與 ZETA 理想 CCM",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{D}{1-D}",
        "plain": "SEPIC/ZETA：Vo/Vin=+D/(1−D)",
        "why": "限定理想穩態 CCM、典型接線和明確的 PWM Duty 定義，不代表所有改型都相同。"
      }
    ],
    "worked": {
      "given": "Vin=12 V、Duty=40%，假設典型 Ćuk、SEPIC 和 ZETA 都在理想 CCM。",
      "steps": [
        "共同的理想幅值比 D/(1−D)=0.4/0.6≈0.6667，輸出幅值 8 V。",
        "Ćuk 有號輸出約 −8 V；SEPIC、ZETA 輸出約 +8 V。",
        "若 D 升至 60%，理想幅值比 1.5，輸出幅值會變成 18 V；但傳能電容 RMS 與元件應力不一定相同。"
      ],
      "result": "相同增益不等於可互換：極性、輸入／輸出脈動、傳能電容電流與元件應力才是選型關鍵。"
    },
    "assumptions": [
      "比較典型拓樸的理想 CCM DC 增益；沒有建模耦合電感、寄生電阻、電容 ESR 或控制環路。",
      "實際電流是否連續、開關耐壓／EMI 與效率要由真實接線和元件參數驗證；此頁不是選型工具。"
    ],
    "pitfall": "看到都叫升降壓就認為全部反相；或只因為理想增益相同就假設其輸入與輸出漣波相同。",
    "check": {
      "q": "Vin=12 V、D=40% 時，典型 Ćuk 與 SEPIC 的理想輸出幅值都約 8 V，極性也一樣嗎？",
      "a": "不一樣；典型 Ćuk 輸出為 −8 V，SEPIC 輸出為 +8 V，且傳能電容與電感的路徑不同。"
    },
    "tryIt": "從「Ćuk、SEPIC、ZETA 與四開關拓樸」課節的電感位置開始辨識，不要先套公式。"
  },
  "27": {
    "lesson": "mid-four-switch",
    "title": "四開關 Buck-Boost 怎麼用兩個橋臂中點讓電感升流或降流？",
    "question": "左右各有一組半橋，為什麼要先求兩個中點電壓差，而不能只看一個 Gate？",
    "takeaway": "以左向右電感方向定義 vL=vSW,left−vSW,right。不同模式是用不同橋臂狀態產生正、負伏秒，再透過電感傳能。",
    "intuition": [
      "四開關非隔離 Buck-Boost 是『左半橋 → 電感 → 右半橋』。兩橋臂中點都能切換，因此電感兩端電壓是它們的差值；MOSFET Gate 只是命令，不等於真實開關節點電壓。",
      "Vin 高於 Vo 時，可能讓左端作 Buck PWM、右端保持適當固定狀態；Vin 低於 Vo 時則可令右端作 Boost PWM。接近交界時還有混合方式，但模式切換與 dead time 必須由實際控制器規定。"
    ],
    "steps": [
      {
        "title": "先定義左、右電壓與電感電流方向",
        "detail": "令 iL 正方向由左向右、vL=vSW,left−vSW,right；每個橋臂上下管都不能同時開通。"
      },
      {
        "title": "Buck：左端 PWM、右端近似固定 Vo",
        "detail": "左節點切 Vin／0，右節點維持 Vo；左上管 ON 時 vL=Vin−Vo，左下管導通時 vL=−Vo，平均伏秒得 Vo≈Dbuck Vin。"
      },
      {
        "title": "Boost：左端固定 Vin、右端 PWM",
        "detail": "右側低管導通時右中點≈0，vL≈+Vin；右側高管送能時右中點≈Vo，vL≈Vin−Vo，得到 Vo≈Vin/(1−Dboost)。"
      },
      {
        "title": "把時序與保護加回現實世界",
        "detail": "兩半橋要處理 dead time、body diode、電流正負、PWM Shadow 更新與模式切換；不能只把兩個 Duty 公式拼起來就完成控制。"
      }
    ],
    "equations": [
      {
        "label": "真正控制電感斜率的是兩中點差",
        "tex": "v_L=v_{SW,L}-v_{SW,R}=L\\frac{di_L}{dt}",
        "plain": "vL=vSW,L−vSW,R=L diL/dt",
        "why": "當 vSW,L>vSW,R，沿定義方向電感電流增加；反之下降。"
      },
      {
        "label": "指定 Buck 工作策略的平均式",
        "tex": "V_o\\approx D_{buck}V_{in}",
        "plain": "Vo≈Dbuck×Vin",
        "why": "右橋臂高側保持適當導通、左橋臂以 Dbuck PWM 且為理想 CCM。"
      },
      {
        "label": "指定 Boost 工作策略的平均式",
        "tex": "V_o\\approx\\frac{V_{in}}{1-D_{boost}}",
        "plain": "Vo≈Vin/(1−Dboost)",
        "why": "左橋臂高側導通、右橋臂低側的佔比為 Dboost，且理想 CCM、忽略損耗。"
      }
    ],
    "worked": {
      "given": "電感 L=100 µH、PWM=100 kHz。比較 Vin=24 V→Vo=12 V 降壓，以及 Vin=12 V→Vo=24 V 升壓。",
      "steps": [
        "Buck 選 Dbuck=0.5，左端 ON/OFF 分別 24／0 V，右端近似 12 V，因此 vL=+12／−12 V。",
        "每段 5 µs，電感上升或下降 12×5 µs/100 µH=0.6 A，正負伏秒抵消。",
        "Boost 選 Dboost=0.5，左端近似 12 V；右低側導通時 vL=+12 V，右高側送能時 vL=12−24=−12 V，也能週期閉合。"
      ],
      "result": "同樣得到正負 12 V 電感電壓，但切換的是不同橋臂；要由兩個開關節點決定真實 vL，不能把兩套模式混用。"
    },
    "assumptions": [
      "只演示非隔離四開關、固定橋臂＋單 PWM 的理想正向 CCM 策略，沒有模擬雙橋同時 PWM。",
      "不含 body diode、MOSFET dead time、混合模式、反向功率或保護停機；實機必須依硬體 PWM／故障時序驗證。"
    ],
    "pitfall": "把四開關 Buck-Boost 當成負載直接接在 H-Bridge 兩中點的馬達驅動，忽略它中間串著能量轉移電感。",
    "check": {
      "q": "左橋臂中點 24 V、右橋臂中點 12 V，電感兩端 vL 是多少？",
      "a": "依左減右的參考方向，vL=24−12=+12 V，因此電感正方向電流開始上升。"
    },
    "tryIt": "到「四開關 Buck-Boost 的橋臂與控制」課節分別找 Buck／Boost 的固定橋臂和 PWM 橋臂。"
  },
  "28": {
    "lesson": "mid-bidirectional",
    "title": "雙向 Buck-Boost 怎樣判斷電池正在充電，還是在回送功率？",
    "question": "兩端電壓都維持正值時，為什麼只改變電流方向就能把輸出從充電改成放電？",
    "takeaway": "先定義各端『電流流入正端為正』的被動符號：P=VI；電池電流正向流入正端是吸收，電流反向則是送出能量。",
    "intuition": [
      "四開關非隔離雙向 DC-DC 不是讓電壓突然變負，而是利用同步 MOSFET 與電感控制能量傳送方向。電池正端電壓仍是 +24 V，但電池電流若由外流入，是充電；若由電池往外流，就是放電。",
      "控制器不能只判斷 Duty 大小來決定是否充電：電壓大小、電感電流的參考方向、充／放電命令、續流路徑、保護狀態與 DC Bus 是否能接收能量，都需要一致。"
    ],
    "steps": [
      {
        "title": "先在左右兩個直流端定義電流正方向",
        "detail": "對任一個端口，電流流入該端標示的正電壓端時，定義 Pabs=VI 為正；這時該端吸收能量。"
      },
      {
        "title": "48 V Bus → 24 V Battery：充電",
        "detail": "讓 24 V 電池端電流流入正端，例如 +5 A，電池吸收 24×5=120 W；理想情況由 48 V 母線提供約 2.5 A。"
      },
      {
        "title": "24 V Battery → 48 V Bus：放電回送",
        "detail": "當電池端電流 −5 A 代表從電池正端流出，Pabs=24×(−5)=−120 W；理想情況 48 V Bus 接收約 120 W。"
      },
      {
        "title": "零電流換向與故障保護分開設計",
        "detail": "過零時需處理電感電流方向、死區 Body Diode、過／欠壓、過流、接觸器／預充與失去接收端等情況；控制命令不代表能量立即安全換向。"
      }
    ],
    "equations": [
      {
        "label": "被動符號約定下的端口功率",
        "tex": "P_{abs}=V\\,I_{\\mathrm{into+}}",
        "plain": "Pabs=V×I_into_positive_terminal",
        "why": "正值代表端口吸收功率、負值代表端口向外提供功率，前提是量測方向固定。"
      },
      {
        "label": "理想雙端功率平衡",
        "tex": "P_{abs,left}+P_{abs,right}=0",
        "plain": "Pabs,left+Pabs,right=0（理想無損）",
        "why": "兩個端口用相同被動符號定義，忽略儲能變化和損耗時，一端送出的能量等於另一端吸收。"
      },
      {
        "label": "電感電壓與電流方向",
        "tex": "v_L=v_{SW,left}-v_{SW,right}=L\\frac{di_L}{dt}",
        "plain": "vL=vSW,left−vSW,right=L diL/dt",
        "why": "雙向控制仍然用兩橋臂中點電壓差調節電感電流斜率，正負電流不等於無需保護。"
      }
    ],
    "worked": {
      "given": "48 V 母線連 24 V 電池，理想雙向功率級。定義電池電流流入其正端為正，忽略功率損耗。",
      "steps": [
        "充電：電池 I=+5 A，Pabs,battery=24×5=+120 W，48 V Bus 必須送出約 120 W，電流幅值約 120/48=2.5 A。",
        "放電：電池 I=−5 A，Pabs,battery=24×(−5)=−120 W，表示電池送出 120 W。",
        "若 48 V Bus 能安全接收，它的吸收電流約 +120/48=+2.5 A；電池端電壓仍為正，不代表功率方向沒改。"
      ],
      "result": "同樣 +24 V 電池端電壓，+5 A 與 −5 A 就對應不同能量方向；做雙向控制首先要把量測極性和功率符號固定下來。"
    },
    "assumptions": [
      "正負號以端口被動符號約定說明，不預設不同產品的 firmware 電流 register 都使用相同正向；實際需依量測架構確認。",
      "忽略效率、控制暫態與儲能變化的理想功率平衡；再生回送須有可吸收能量的母線或負載，不可只靠 PWM 命令推定安全。"
    ],
    "pitfall": "看到兩端電壓都為正就判斷只有正向功率，或把負電流當成 ADC 故障而沒有先確認電流感測器極性。",
    "check": {
      "q": "電池保持 24 V，但定義流入電池正端的電流為 −5 A，代表它在充電嗎？",
      "a": "不是。Pabs=24×(−5)=−120 W，電池正在向外提供約 120 W（理想瞬時或平均條件下）。"
    },
    "tryIt": "到「雙向 Buck-Boost 的能量方向」課節固定兩端電壓，改變電流符號並對照功率與故障保護。"
  },
  "29": {
    "lesson": "mid-quadrants",
    "title": "H-Bridge 四象限其實是哪四種？如何判斷吸能與回送？",
    "question": "負載電壓正負和電流正負都能變化，怎麼用一張符號表分清驅動與回生？",
    "takeaway": "四象限是 (VAB,IAB) 的四種正負組合，不是四種輸出電壓。固定 IAB 為由 A 流入負載、B 流出的方向，Pload=VAB×IAB。",
    "intuition": [
      "H-Bridge 的四顆 MOSFET 組成左右兩個橋臂，負載跨在兩個橋臂中點 A、B 之間。控制兩端的電壓差可得到正、負和零電壓；但負載如果有電感或馬達反電勢，電流未必和電壓同號。",
      "電壓與電流同號時，電能平均流入負載；異號時，負載可能把能量送回母線。這是電氣端口的功率符號；馬達機械的轉速／轉矩四象限還需結合反電勢、銅損與儲能判斷，兩者不能直接畫等號。"
    ],
    "steps": [
      {
        "title": "先寫差動電壓和負載電流方向",
        "detail": "以 VAB=VA−VB、IAB 正方向由 A 流進負載到 B，在被動符號約定下 Pload=VAB IAB。"
      },
      {
        "title": "I 象限：V>0、I>0，負載吸收電功率",
        "detail": "例如 +100 V、+2 A，Pload=+200 W，能量由功率級流向負載。"
      },
      {
        "title": "II 與 IV 象限：電壓電流異號，負載送出電功率",
        "detail": "例如 VAB=−100 V、IAB=+2 A 或 VAB=+100 V、IAB=−2 A，Pload 都是 −200 W。"
      },
      {
        "title": "III 象限：V<0、I<0，電氣上仍是負載吸收",
        "detail": "例如 −100 V、−2 A，Pload=+200 W；兩個負號不是功率回送，不能以電壓單一極性分類。"
      }
    ],
    "equations": [
      {
        "label": "兩橋臂中點的差動電壓",
        "tex": "V_{AB}=V_A-V_B",
        "plain": "VAB=VA−VB",
        "why": "用差動值才是負載真正承受的電壓；只量 VA 對地不能代表 VAB。"
      },
      {
        "label": "被動符號下負載端電功率",
        "tex": "P_{load}=V_{AB}I_{AB}",
        "plain": "Pload=VAB×IAB",
        "why": "電壓與電流同號時吸收，異號時提供能量；瞬時功率與週期平均功率仍需區分。"
      }
    ],
    "worked": {
      "given": "橋式負載電壓幅值為 100 V、電流幅值為 2 A，固定 IAB 正方向為 A→B。",
      "steps": [
        "I 象限：+100×(+2)=+200 W，負載吸收。",
        "II 象限：−100×(+2)=−200 W，負載向母線回送。",
        "III 象限：−100×(−2)=+200 W，負載吸收；IV 象限：+100×(−2)=−200 W，負載回送。"
      ],
      "result": "分類要同時看差動電壓與電流方向。真正回生時必須確認 DC Bus 能量去處、母線過壓與負載機械狀態。"
    },
    "assumptions": [
      "以負載端差動電壓和被動方向電流定義電氣四象限，沒有宣稱馬達轉速與轉矩象限與電功率符號完全等價。",
      "理想橋臂只是用來說明符號；實際回生需要接收端、續流與保護，不會因為 Pload<0 就保證母線安全。"
    ],
    "pitfall": "把四象限誤認成四個輸出電壓檔位，或把 VAB<0 當成一定是再生回送。",
    "check": {
      "q": "VAB=−100 V、IAB=−2 A 時負載功率是負的、正在回送嗎？",
      "a": "不是，Pload=(−100)×(−2)=+200 W，兩者同號，負載仍在吸收電功率。"
    },
    "tryIt": "到「H-Bridge 的四象限」互動課節用四種正負組合核對 Pload，不要只看 Duty 或電壓正負。"
  },
  "30": {
    "lesson": "mid-motor-hbridge",
    "title": "H-Bridge 驅動直流馬達，為什麼不能只用 V=IR？",
    "question": "馬達已在旋轉時，為什麼同樣的 H-Bridge 電壓，不一定讓電流朝同一方向變化？",
    "takeaway": "電樞電感阻止電流突變、電阻造成壓降、旋轉反電勢抵消部分外加電壓；真正決定電流斜率的是 vAB−Ra ia−ea。",
    "intuition": [
      "馬達不只是電阻，它有一顆等效電樞電感，也會因為旋轉產生反電勢。即使 H-Bridge 對馬達施加 +24 V，若當下反電勢與電阻壓降很大，電流不見得會繼續快速上升。",
      "兩橋臂中點差動電壓 vAB 是外部驅動，馬達內部還有電阻、電感和反電勢。要理解驅動、煞車和回生，必須看電流與速度的時間演化，不能只從 Gate 高低猜扭矩。"
    ],
    "steps": [
      {
        "title": "先由左右橋臂開關狀態寫 vAB",
        "detail": "理想高低位開關函數 SA、SB∈{0,1}，中點 VA=SA Vdc、VB=SB Vdc，馬達 vAB=(SA−SB)Vdc。"
      },
      {
        "title": "用電樞 KVL 找電感兩端電壓",
        "detail": "令正方向電流由 A 到 B，電樞電感 La dia/dt=vAB−Ra ia−ea；電流可因外加電壓和反電勢的相對大小而上升或下降。"
      },
      {
        "title": "反電勢由轉速決定",
        "detail": "基本模型 ea=Ke ω，當 ω 改變，抵消外加電壓的程度也改變；扭矩可寫 T=Kt ia，但實際機械負載另需分析。"
      },
      {
        "title": "PWM 平均與瞬時要分開看",
        "detail": "PWM 的平均 vAB 對慢速電流／轉速有意義，但瞬時橋臂差動仍是高頻脈波；La、開關頻率和採樣時間決定電流漣波。"
      }
    ],
    "equations": [
      {
        "label": "理想橋臂差動輸出",
        "tex": "v_{AB}=(S_A-S_B)V_{dc}",
        "plain": "vAB=(SA−SB)Vdc",
        "why": "SA／SB 是各橋臂中點理想狀態，不等於同一橋臂上下管都可以 ON。"
      },
      {
        "label": "直流馬達電樞電壓方程",
        "tex": "L_a\\frac{di_a}{dt}+R_ai_a+e_a=v_{AB}",
        "plain": "La dia/dt+Ra ia+ea=vAB",
        "why": "真正造成電流斜率的是外加差動電壓扣掉電阻壓降與反電勢後的餘額。"
      },
      {
        "label": "反電勢與轉矩的簡化關係",
        "tex": "e_a=K_e\\omega,\\quad T_e=K_t i_a",
        "plain": "ea=Ke ω；Te=Kt ia",
        "why": "Ke、Kt 的數值與單位需按一致的 SI 定義；實際還會有摩擦和機械負載。"
      }
    ],
    "worked": {
      "given": "理想 H-Bridge 瞬時 Vdc=48 V、SA=1、SB=0；馬達 La=10 mH、Ra=2 Ω，當下 ia=5 A、ea=30 V。",
      "steps": [
        "橋臂差動 vAB=(1−0)×48=+48 V，不是只看單端 VA 就當全部電壓。",
        "電阻壓降 Ra ia=2×5=10 V，因此電感剩餘電壓 vL=48−10−30=+8 V。",
        "電流斜率 dia/dt=8/0.01=800 A/s，約 0.8 A/ms；若瞬間切換成 vAB=−48 V，斜率將明顯變負。"
      ],
      "result": "同樣正向橋臂電壓，馬達電流是否增加取決於反電勢、電阻與電感；PWM 控制和保護必須依這些狀態設計。"
    },
    "assumptions": [
      "簡化有刷直流馬達的電樞 RL＋反電勢模型，忽略電刷壓降、飽和、換向火花與機械暫態耦合細節。",
      "示例是單一瞬時工作點的 di/dt，不代表一毫秒內轉速、反電勢或電阻電流必然保持不變。"
    ],
    "pitfall": "將 H-Bridge 的單端 VA 對地電壓當成馬達 vAB，或把有反電勢的馬達硬當成純電阻負載。",
    "check": {
      "q": "當 vAB=48 V、Ra ia=10 V、反電勢 ea=30 V、La=10 mH 時，電流增加斜率有多大？",
      "a": "電感剩下 48−10−30=8 V，所以 dia/dt=8/0.01=800 A/s，約每毫秒增加 0.8 A 的瞬時斜率。"
    },
    "tryIt": "到「直流馬達模型與 PWM 平均電壓」課節調整橋臂差動電壓，分清 vAB、反電勢和電樞電流。"
  },
  "31": {
    "lesson": "mid-bipolar",
    "title": "Bipolar PWM：平均電壓可以是零，為什麼開關仍在 ±Vdc 切換？",
    "question": "H-Bridge 的兩個橋臂互補時，為什麼 D=50% 仍會有 +100 V 和 −100 V 的差動電壓？",
    "takeaway": "理想 Bipolar 每次切到 +Vdc 或 −Vdc，正電壓佔比 D 時，平均 vAB=(2D−1)Vdc；平均零並不代表沒有高頻階躍。",
    "intuition": [
      "在理想互補雙極 PWM，左橋臂高時右橋臂低，負載看到 +Vdc；左低右高時負載看到 −Vdc。即使兩邊各佔一半時間、平均恰好零，實際負載電壓仍然大幅交替變號。",
      "馬達或負載電感不是只感受到平均值。它會根據每一段的 vL/L 產生電流漣波，這些高頻階躍影響元件損失、共模／差模 EMI 和電流採樣時序。"
    ],
    "steps": [
      {
        "title": "寫出橋臂互補狀態",
        "detail": "定義 SA=1 時 A 接近 +Vdc、B 接近 0；SA=0 時 A 接近 0、B 接近 +Vdc，即 SB=1−SA。"
      },
      {
        "title": "差動電壓只會是兩個極性",
        "detail": "由 vAB=(SA−SB)Vdc=(2SA−1)Vdc，瞬時只有 +Vdc 與 −Vdc，沒有理想的零差動狀態。"
      },
      {
        "title": "由正電壓佔比求平均",
        "detail": "+Vdc 維持 D Ts、−Vdc 維持 (1−D)Ts，所以平均 vAB=[D−(1−D)]Vdc=(2D−1)Vdc。"
      },
      {
        "title": "反推高頻電流漣波",
        "detail": "在開關週期內假設反電勢加 Ra ia 變化緩慢，電樞電感斜率近似 (vAB−e_a−R_a i_a)/La；強迫電壓每次切換跨約 2Vdc。"
      }
    ],
    "phases": [
      {
        "name": "+Vdc（正向橋臂）",
        "pct": 70
      },
      {
        "name": "−Vdc（反向橋臂）",
        "pct": 30
      }
    ],
    "equations": [
      {
        "label": "Bipolar 橋臂互補的差動值",
        "tex": "v_{AB}=(2S_A-1)V_{dc}",
        "plain": "vAB=(2SA−1)Vdc，SB=1−SA",
        "why": "用兩橋臂的理想互補狀態推得，實際高／低側 Gate 需要死區，不能直接用邏輯反相當驅動。"
      },
      {
        "label": "正向狀態時間比例的平均輸出",
        "tex": "\\overline V_{AB}=(2D-1)V_{dc}",
        "plain": "平均 VAB=(2D−1)Vdc",
        "why": "D 是 +Vdc 差動狀態的時間比例；並非同一支 MOSFET 的任意 PWM 設定都可套此式。"
      }
    ],
    "worked": {
      "given": "Vdc=100 V、fs=20 kHz、Bipolar 正狀態 Duty D=70%；示例馬達 La=1 mH，假設每週期內 Ra ia+ea 約為 40 V。",
      "steps": [
        "+100 V 維持 70% 即 35 µs；−100 V 維持 30% 即 15 µs，平均 vAB=(2×0.7−1)×100=40 V。",
        "+100 V 階段電感承受 100−40=+60 V，電流增加 Δi≈60×35 µs/1 mH=+2.1 A。",
        "−100 V 階段電感承受 −100−40=−140 V，電流下降 Δi≈−140×15 µs/1 mH=−2.1 A，週期電流閉合。"
      ],
      "result": "平均輸出只有 +40 V，但瞬時在 ±100 V 間切換，跨越 200 V 電壓階躍；電感電流漣波不能只拿平均 40 V 估。"
    },
    "assumptions": [
      "理想 Bipolar 互補差動 PWM、固定週期、忽略 MOSFET dead time 與切換過渡，負載的 Ra ia+ea 在單週期近似常數。",
      "這是電壓／電感電流的教學模型，不宣稱真實 MOSFET VGS、VDS 或回生能力；死區與保護需實機驗證。"
    ],
    "pitfall": "D=50% 時平均 VAB 為零，就以為兩橋臂已停止切換或電感電流沒有漣波。",
    "check": {
      "q": "Vdc=100 V、Bipolar D=50%，負載瞬時差動電壓會一直是 0 V 嗎？",
      "a": "不會。瞬時在 +100 V 和 −100 V 間各占一半時間，平均才是 0 V；開關和電流漣波仍存在。"
    },
    "tryIt": "到「Bipolar PWM」課節同步觀察 VA、VB、VAB，確認兩中點互補以及平均值和瞬時差動的差異。"
  },
  "32": {
    "lesson": "mid-unipolar",
    "title": "Unipolar PWM 多了一個零電壓狀態，跟 Bipolar 差在哪？",
    "question": "同樣要讓 H-Bridge 平均輸出 +40 V，為什麼 Unipolar 可以讓 vAB 在 0／+100 V 間切換？",
    "takeaway": "兩個橋臂分別比較 PWM 參考，使差動輸出可取 −Vdc、0、+Vdc；在此同載波示例，DA=70%、DB=30% 就有平均 VAB=40 V。",
    "intuition": [
      "兩組橋臂不再每次都必須一高一低。當兩個中點同時為高或同時為低時，負載看到的差動電壓 VAB=0；只有中點不同時才看到 ±Vdc，因此差動電壓可能多了零狀態。",
      "這能把部分差動切換階躍從 Bipolar 的 2Vdc 改成 Vdc，往往有利於負載電感漣波。但實際波形取決於使用相同或反相參考、載波相位、死區與元件寄生，不能只以『Unipolar 一定更好』概括。"
    ],
    "steps": [
      {
        "title": "先分別追兩個橋臂中點",
        "detail": "在理想高／低狀態下，VA=SA Vdc、VB=SB Vdc；VAB=(SA−SB)Vdc，可同時出現 −Vdc、0、+Vdc。"
      },
      {
        "title": "用相同載波、不同 Duty 建立單極正輸出例子",
        "detail": "假設同相同一條前緣載波，左端 DA=0.7、右端 DB=0.3；前 30% 兩邊都高 VAB=0，接著 40% 只有左高 VAB=+Vdc，最後 30% 都低 VAB=0。"
      },
      {
        "title": "平均差動由兩橋臂 Duty 之差決定",
        "detail": "平均 VAB=(DA−DB)Vdc，此例是 (0.7−0.3)×100=40 V；也可用對稱調變 DA=(1+m)/2、DB=(1−m)/2 得 m Vdc。"
      },
      {
        "title": "Dead Time 要驗證真正的硬體換流",
        "detail": "同一橋臂上下管必須有不重疊時間；兩管全 OFF 時電感電流可能走 Body Diode，造成極性相關的輸出誤差，不能當成額外的安全零電壓狀態。"
      }
    ],
    "phases": [
      {
        "name": "零差動（兩邊高）",
        "pct": 30
      },
      {
        "name": "+Vdc（左高右低）",
        "pct": 40
      },
      {
        "name": "零差動（兩邊低）",
        "pct": 30
      }
    ],
    "equations": [
      {
        "label": "兩個橋臂差動輸出",
        "tex": "v_{AB}=(S_A-S_B)V_{dc}",
        "plain": "vAB=(SA−SB)Vdc",
        "why": "當 SA=SB 時差動電壓為 0；SA≠SB 時才有正或負母線電壓。"
      },
      {
        "label": "理想平均輸出與兩橋臂 Duty",
        "tex": "\\overline V_{AB}=(D_A-D_B)V_{dc}",
        "plain": "平均 VAB=(DA−DB)Vdc",
        "why": "從兩中點平均電壓相減得到，不必先假設單一橋臂 Duty 能代表全部差動狀態。"
      },
      {
        "label": "對稱調變的平均命令",
        "tex": "D_A=\\frac{1+m}{2},\\quad D_B=\\frac{1-m}{2}",
        "plain": "DA=(1+m)/2；DB=(1−m)/2",
        "why": "在此特定同載波／理想對稱調變下，平均 VAB=mVdc，−1≤m≤1；不是任意控制器的硬體設定保證。"
      }
    ],
    "worked": {
      "given": "Vdc=100 V，兩橋臂使用同一條前緣載波；DA=70%、DB=30%，忽略 dead time 與換流寄生。",
      "steps": [
        "兩個橋臂前 30% 都輸出 100 V，差動 VAB=100−100=0 V。",
        "接下來 40% 只有左橋臂輸出 100 V、右為 0，差動 VAB=+100 V；最後 30% 兩邊都 0，差動仍 0 V。",
        "週期平均 VAB=0×0.3+100×0.4+0×0.3=+40 V，等於 (DA−DB)×100。"
      ],
      "result": "與 Bipolar 平均 +40 V 相同，但這個 Unipolar 示例的瞬時差動只在 0／+100 V 間切換；真正的電流漣波仍需加上 L、反電勢和 Dead Time 計算。"
    },
    "assumptions": [
      "示例限定理想 H-Bridge、同載波前緣 PWM、固定正向平均輸出和互斥橋臂狀態；其他 Unipolar PWM 時序可不同。",
      "死區、Body Diode、逆向電流與換流寄生會改變瞬時中點電壓；此示意不能取代 MOSFET Gate／VDS 實際驗收。"
    ],
    "pitfall": "以為三態輸出允許同一橋臂上下管同時 ON，或把 Dead Time 期間 Body Diode 的實際導通當作永遠等於 0 V。",
    "check": {
      "q": "同一載波、DA=70%、DB=30%、Vdc=100 V 的理想 Unipolar，平均差動輸出是多少？",
      "a": "VAB,avg=(0.7−0.3)×100=40 V；兩中點同高或同低時差動為 0 V。"
    },
    "tryIt": "到「Unipolar PWM 與 Dead Time」課節同步觀察 VA、VB、VAB 和零電壓狀態，再思考死區與電流方向。"
  },
  "33": {
    "lesson": "mid-isolated-types",
    "title": "隔離式 DC-DC 不只是加變壓器：Flyback 和 Forward 的能量流哪裡不同？",
    "question": "同樣有一次側開關與高頻變壓器，為什麼 Flyback 主要在 OFF 送能，而 Forward 在 ON 就能送能？",
    "takeaway": "隔離是兩側沒有直流導電通路；能量如何穿越磁性元件則由拓樸與整流極性決定。Flyback 用磁化電感儲能，Forward 導通時就傳能。",
    "intuition": [
      "先想像磁芯有兩種不同的工作方式：Flyback 更像『耦合電感』，先把能量存入磁場，再在開關關閉後釋放到二次側；Forward 則讓輸入在開關導通時透過變壓器將功率傳到輸出濾波電感。它們都能隔離，但主要能量流的時間不一樣。",
      "Push-Pull、Half/Full-Bridge、電流饋入型又會改變原邊電壓方向、磁通復位與開關壓力。看到變壓器的圖示，不要直接認為它能像 50/60 Hz 變壓器那樣全時段傳輸功率。"
    ],
    "steps": [
      {
        "title": "1. 先畫出真正的電氣隔離邊界",
        "detail": "辨認一次側與二次側電路沒有直接金屬導電連接；磁耦合可傳遞能量，但爬電距離、電氣間隙、絕緣耐壓等規範仍須核對。"
      },
      {
        "title": "2. Flyback：ON 使磁化電流上升，二次側整流器截止",
        "detail": "利用點標極性讓 ON 時二次側二極體反偏，由輸出電容供負載；MOSFET OFF 後二次側導通，磁化儲能再傳到輸出。"
      },
      {
        "title": "3. Forward：ON 就由變壓器向二次側送能",
        "detail": "ON 時原邊施壓，二次側整流器正向導通，輸出電感接收能量；OFF 時輸出電感續流，磁化電感須有明確的復位途徑。"
      },
      {
        "title": "4. 橋式與 Current-fed 需要另外追蹤磁通與續流",
        "detail": "Push-Pull、Full-Bridge 可以交替施加正負原邊電壓；電流饋入型通常還有輸入儲能電感。不能只依 MOSFET 數量套某一條轉壓比。"
      }
    ],
    "equations": [
      {
        "label": "理想磁耦合繞組電壓比",
        "tex": "\\frac{v_s}{v_p}=\\frac{N_s}{N_p}",
        "plain": "vs/vp=Ns/Np（同極性參考方向）",
        "why": "這是繞組瞬時感應電壓關係，不等於所有拓樸的最終 DC 輸出增益。"
      },
      {
        "label": "Flyback 理想 CCM 直流增益",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{N_s}{N_p}\\frac{D}{1-D}",
        "plain": "Flyback CCM：Vo/Vin=(Ns/Np) D/(1−D)",
        "why": "Flyback 需按 ON／OFF 磁化伏秒平衡，不能直接只乘匝數比。"
      },
      {
        "label": "單開關 Forward 理想 CCM 近似",
        "tex": "\\frac{V_o}{V_{in}}\\approx\\frac{N_s}{N_p}D",
        "plain": "Forward CCM：Vo/Vin≈(Ns/Np) D",
        "why": "ON 向輸出濾波電感供能、OFF 續流，並假設變壓器能完成復位；實際 Duty 上限受復位設計約束。"
      }
    ],
    "worked": {
      "given": "Vin=100 V，理想匝比 Np:Ns=2:1，Duty=40%；比較 Flyback CCM 與具有完整復位的單開關 Forward CCM。",
      "steps": [
        "理想繞組瞬時電壓幅值 |vs|=(Ns/Np)Vin=0.5×100=50 V，但 Flyback ON 時二極體截止，並不是立刻輸出 50 V。",
        "Flyback CCM 平均輸出 Vo≈0.5×100×0.4/(1−0.4)=33.33 V；能量主要在 MOSFET OFF 時送到二次側。",
        "Forward CCM 在 ON 時向輸出電感供能，理想 Vo≈0.5×100×0.4=20 V；磁化復位必須在開關關閉時完成。"
      ],
      "result": "相同 Vin、匝比與 Duty，Flyback 和 Forward 的 DC 輸出不一樣。先確認能量在什麼時候送到輸出，再選擇正確公式。"
    },
    "assumptions": [
      "這是理想磁耦合、CCM 與特定 PWM 極性下的拓樸比較；沒有包含整流壓降、漏感、磁化復位時間或真實開關過渡。",
      "隔離式電源是否符合安規不由匝比或原理圖決定，還需核對絕緣結構、爬電距離、電氣間隙和耐壓試驗。"
    ],
    "pitfall": "把 Flyback 當成 MOSFET ON 就向二次側直接送能的 Forward，或認為只要畫了變壓器就已經符合安全隔離要求。",
    "check": {
      "q": "相同 Vin、匝比、Duty，為什麼 Flyback 和 Forward 理想 DC 輸出不同？",
      "a": "Flyback 先在磁化電感儲能、OFF 再送到二次側，其增益含 D/(1−D)；Forward ON 時直接經變壓器送能到輸出電感，增益近似含 D。"
    },
    "tryIt": "到「隔離式 DC-DC 的五種基本型態」課節，先標 ON／OFF 二極體狀態，再比較不同拓樸的磁化復位路徑。"
  },
  "34": {
    "lesson": "mid-isolation-feedback",
    "title": "控制器在二次側時，PWM 怎麼跨過隔離邊界驅動一次側 MOSFET？",
    "question": "高電壓一次側和低電壓二次側沒有共同地，二次側 PWM 要如何控制一次側 Gate，又不破壞隔離？",
    "takeaway": "本頁是『二次側 Error Amplifier／PWM → 脈衝變壓器 → 一次側 Driver』架構。脈衝變壓器傳控制脈衝，不是主功率變壓器，也不能無條件傳 DC Duty。",
    "intuition": [
      "把隔離電源拆成兩條完全不同的路：主功率透過高頻功率磁件跨越隔離邊界；小功率控制訊號則可以透過另一顆脈衝變壓器送過去。若把兩者混淆，會誤解誰在決定 PWM 與誰承受主電流。",
      "脈衝變壓器靠電壓變化建立磁通，若長時間加單方向的 DC 電壓、沒有復位，就可能磁通累積而飽和。即使波形看起來是 0/1 數位命令，也需要確認原邊正負伏秒與次級整形／驅動。"
    ],
    "steps": [
      {
        "title": "1. 先找出控制器與誤差放大器的位置",
        "detail": "本頁特定方塊圖中，誤差放大器和 PWM Controller 位於低壓二次側；一次側只有接收隔離脈衝並驅動功率開關的 Driver。"
      },
      {
        "title": "2. PWM 脈衝透過獨立的脈衝變壓器",
        "detail": "控制訊號施加在脈衝變壓器一次側，磁通變化在隔離後繞組產生脈衝，經整形與驅動器轉成需要的 MOSFET VGS。"
      },
      {
        "title": "3. 一個週期內檢查變壓器伏秒復位",
        "detail": "對脈衝變壓器繞組應使週期正負伏秒積分接近零。若沒有反向復位或合適 AC 耦合，單方向脈衝可能令磁芯飽和，不能當成可靠 Duty 傳送。"
      },
      {
        "title": "4. 隔離後仍要確認驅動電源及保護責任",
        "detail": "Gate Driver 需要適當的一次側供電、UVLO、關斷、過流與 Miller 效應處理；隔離只解決電氣連接邊界，不會自動保證安全 PWM 時序。"
      }
    ],
    "equations": [
      {
        "label": "脈衝變壓器基本感應關係",
        "tex": "v_p=N_p A_e\\frac{dB}{dt}",
        "plain": "vp=Np Ae dB/dt",
        "why": "繞組正負電壓伏秒會造成磁通密度位移，不能長期累積而超過磁芯工作範圍。"
      },
      {
        "label": "每次施加電壓造成的磁通位移",
        "tex": "\\Delta B=\\frac{V_p\\,t_p}{N_pA_e}",
        "plain": "ΔB=Vp tp/(Np Ae)",
        "why": "假設繞組電壓在該脈衝期間近似恆定，忽略漏感、銅阻與磁芯非線性。"
      },
      {
        "label": "週期穩態的復位條件",
        "tex": "\\oint v_p(t)\\,dt=0",
        "plain": "完整週期 ∫vp(t)dt=0",
        "why": "正負伏秒若無法抵消，磁通工作點逐週漂移，會增大飽和風險。"
      }
    ],
    "worked": {
      "given": "示例脈衝變壓器 Np=20 匝、有效截面 Ae=20 mm²；輸入脈衝 +12 V 持續 2 µs，忽略損耗。",
      "steps": [
        "換算截面積 Ae=20×10⁻⁶ m²，脈衝正伏秒=12×2 µs=24 V·µs。",
        "磁通密度位移 ΔB=24×10⁻⁶/(20×20×10⁻⁶)=0.060 T。",
        "若下一段能安全施加 −12 V，至少同樣 2 µs 才能抵消 +24 V·µs；這是伏秒復位示例，不代表已確定實際驅動脈衝設計。"
      ],
      "result": "控制訊號的頻率、Duty 和正負伏秒會限制脈衝變壓器；要把這條路與主功率磁件及 MOSFET 真實 VGS 驅動分開驗證。"
    },
    "assumptions": [
      "只針對講義 P.34 的二次側 PWM 經脈衝變壓器送往一次側 Driver 架構；P.35 的光耦回授是另一種不同的訊號流。",
      "磁通密度示例忽略磁芯初始偏磁、飽和磁通密度、AC 耦合、寄生電容、負載與 Gate Driver 細節；不能以單次 ΔB 保證變壓器不飽和。"
    ],
    "pitfall": "把脈衝變壓器當成可永久傳輸不帶復位的 DC Gate 命令，或把控制脈衝變壓器和承載主功率的 Flyback 磁件混為一談。",
    "check": {
      "q": "+12 V 加在 20 匝、20 mm² 的脈衝變壓器 2 µs，若沒有反向復位，會發生什麼風險？",
      "a": "每次脈衝增加約 0.06 T 的磁通密度位移，無法在週期內抵消時可能讓磁通逐週偏移甚至磁芯飽和。"
    },
    "tryIt": "到「隔離式回授：脈衝變壓器與光耦」課節辨識 P.34 控制訊號與主功率路徑的隔離邊界。"
  },
  "35": {
    "lesson": "mid-isolation-feedback",
    "title": "光耦回授如何讓一次側控制器知道二次側輸出偏高或偏低？",
    "question": "一次側 PWM Controller 不能直接與二次側共地，輸出誤差是怎麼跨越安全隔離邊界的？",
    "takeaway": "本頁採『二次側誤差放大器 → 光耦 LED／光電晶體 → 一次側 PWM Controller／Driver』架構；光耦傳控制資訊，不負責傳主功率。",
    "intuition": [
      "把輸出回授想成一封跨越隔離邊界的訊息：二次側先量出 12 V 是否偏離目標，再改變光耦 LED 電流；一次側光電晶體收到光後形成控制訊號，使 PWM Controller 做出負回授修正。",
      "光耦兩端沒有導電連接，但 CTR、溫度、老化與非線性會改變同樣 LED 電流所對應的輸出電流。光耦不是理想的無延遲數位線，補償設計還要檢查極性、帶寬和飽和。"
    ],
    "steps": [
      {
        "title": "1. 二次側分壓量測 Vout",
        "detail": "輸出電壓透過電阻分壓與參考比較，建立電壓誤差；在選定的負回授方向，Vout 偏高應讓控制器減少輸入到功率級的能量。"
      },
      {
        "title": "2. 誤差控制 LED 電流",
        "detail": "次級誤差放大器或參考元件改變光耦 LED 正向電流 If，不是把主輸出功率送到一次側。"
      },
      {
        "title": "3. 光電晶體將光訊號還原成一次側電流",
        "detail": "光耦輸出電流 Ic 近似 CTR×If；不同工作電流、溫度與老化後 CTR 可能不同，因此控制器需在可能的範圍內維持迴路可控。"
      },
      {
        "title": "4. 一次側 PWM 與 Driver 執行輸出調整",
        "detail": "一次側控制器讀入隔離回授，再改變 PWM Duty／峰值電流命令。光耦光電晶體的拉高或拉低方向依控制 IC 接法而定，必須驗證真正是負回授。"
      }
    ],
    "equations": [
      {
        "label": "輸出分壓比（示例）",
        "tex": "V_{fb}=V_o\\frac{R_2}{R_1+R_2}",
        "plain": "Vfb=Vo×R2/(R1+R2)",
        "why": "分壓比例是實際可量測的閉迴路參數；不能只靠宣稱 CTR 固定來決定輸出電壓。"
      },
      {
        "label": "CTR 的定義（指定測試工況）",
        "tex": "\\mathrm{CTR}=\\frac{I_C}{I_F}",
        "plain": "CTR=Ic/If",
        "why": "CTR 是光電晶體電流與 LED 正向電流比值，取決於測試條件，不能視為全工作域常數。"
      },
      {
        "label": "控制誤差（明確範例極性）",
        "tex": "e=V_{ref}-V_{fb}",
        "plain": "e=Vref−Vfb",
        "why": "誤差定義只是一個正負參考，真正一次側控制器 PWM 方向必須依整條回授訊號流確認。"
      }
    ],
    "worked": {
      "given": "12 V 隔離輸出、2.5 V 回授參考；光耦 If=2 mA，比較 CTR=50% 與 100% 兩個指定測試工況。",
      "steps": [
        "分壓係數 β=2.5/12≈0.2083；若設下方 R2=10 kΩ，則上方 R1≈38 kΩ，理想 Vfb≈2.5 V。",
        "若 CTR=50%，Ic≈0.5×2 mA=1 mA；若 CTR=100%，Ic≈2 mA。這只是不同 CTR 工況的預估，不表示兩條回授都能穩壓。",
        "一次側 PWM 接收到不同 Ic 時，控制電壓與 Duty 的反應需回到實際 IC、光耦線性範圍和補償器確認。"
      ],
      "result": "隔離回授必須同時處理二次側量測比例、光耦 CTR 範圍、一次側控制極性和迴路穩定性；不能單靠 If/Ic 算式保證輸出 12 V。"
    },
    "assumptions": [
      "這是講義 P.35 的一次側 PWM／Driver 與二次側誤差放大器、光耦訊號流，不是 P.34 的二次側 PWM 經脈衝變壓器方案。",
      "CTR 只用來解釋光耦在指定條件下的電流比例，不含光耦動態頻率響應、溫漂、LED 老化、共模暫態、線性補償及安規驗證。"
    ],
    "pitfall": "把光耦當成輸出功率能流通的變壓器，或把 CTR=100% 當全溫度、全 LED 電流與全壽命都保證的常數。",
    "check": {
      "q": "光耦 LED If=2 mA、CTR=50% 時，為什麼一次側光電晶體電流不必然是 2 mA？",
      "a": "CTR=Ic/If=0.5，因此在該測試工況 Ic 近似 1 mA；真正控制端反應與負回授極性仍要看控制器接法。"
    },
    "tryIt": "到「隔離式回授：脈衝變壓器與光耦」課節，把 P.34 的次級 PWM 和 P.35 的一次側 PWM 兩種訊號流分開畫。"
  },
  "36": {
    "lesson": "mid-multi-output",
    "title": "Flyback 同一顆變壓器拉出 12 V、5 V，為什麼只回授 12 V 不代表 5 V 也準？",
    "question": "多組次級繞組有固定匝比，但當其中一組負載改變時，為什麼另一組輸出還是可能漂移？",
    "takeaway": "匝數比只給理想感應電壓關係；DC 整流壓降、繞組耦合與負載不同會造成 Cross Regulation，單一路回授不能保證全部路精準。",
    "intuition": [
      "一顆磁芯能繞多組次級，就像同一個水源接出幾條管線。每條分支的匝數可決定理想電壓比例，但二極體、繞組電阻、漏感和負載都會讓實際輸出不同；只量一條管線，不代表能感知其他管線上的全部變化。",
      "在 Flyback，各次級整流器可能因為各路輸出、壓降與耦合差異而在不同時刻導通。不能直接把一次側感應電壓乘匝數比後，當成負載切換後每一個 DC 輸出都必然保持不變。"
    ],
    "steps": [
      {
        "title": "1. 先確定哪一路被直接回授調節",
        "detail": "若控制器感測主輸出 12 V，補償器主要改變 PWM 讓這一路維持目標；其他輔助輸出的誤差不會直接進入相同的回授感測。"
      },
      {
        "title": "2. 用次級匝數比求理想繞組電壓",
        "detail": "在同一磁通變化下，v2/v1=N2/N1。這是交流感應繞組電壓，不等於二極體整流後的所有輸出都精準按比例。"
      },
      {
        "title": "3. 再扣整流壓降與繞組寄生",
        "detail": "若兩路二極體都在指定時刻導通，近似 (V2+Vf2)/(V1+Vf1)=N2/N1；不同 Vf、繞組阻抗與漏感可讓 V2 偏離簡單匝比結果。"
      },
      {
        "title": "4. 驗證交叉負載與必要的後級調節",
        "detail": "應分別測試主路滿載、輔路滿載、單路空載與啟動／停機；需要精準 5 V 時，可考慮在輔路加 Buck、LDO 或獨立調節。"
      }
    ],
    "equations": [
      {
        "label": "理想次級感應電壓比",
        "tex": "\\frac{v_2}{v_1}=\\frac{N_2}{N_1}",
        "plain": "v2/v1=N2/N1",
        "why": "只有共同磁通、相同參考極性下的感應電壓比例，與 DC 整流後穩壓精度是不同問題。"
      },
      {
        "label": "兩路同時導通時的近似整流關係",
        "tex": "\\frac{V_2+V_{F2}}{V_1+V_{F1}}\\approx\\frac{N_2}{N_1}",
        "plain": "(V2+Vf2)/(V1+Vf1)≈N2/N1",
        "why": "這一近似需要指定兩路同時導通且忽略繞組阻抗，並非任意負載、任意時間都必定成立。"
      },
      {
        "label": "交叉負載調節的概念",
        "tex": "\\Delta V_{aux}=V_{aux,actual}-V_{aux,ideal}",
        "plain": "ΔVaux=Vaux,actual−Vaux,ideal",
        "why": "輔輸出實際電壓與理想匝比預測不同，必須依負載測量確認，不能只用主路回授推論。"
      }
    ],
    "worked": {
      "given": "Flyback 主次級繞組 N1=24 匝、輔次級 N2=10 匝；主路由回授維持 V1=12 V，兩路二極體壓降暫假設都為 0.5 V，並假設同時導通。",
      "steps": [
        "主路導通時繞組端電壓約 V1+Vf1=12.5 V；按匝比，另一繞組感應約 12.5×(10/24)=5.208 V。",
        "輔路扣二極體壓降後，預估 V2≈5.208−0.5=4.708 V，並不是直接以 12×10/24=5.000 V。",
        "若輔路負載變化使二極體導通時段、繞組壓降或耦合改變，V2 可能再偏離 4.708 V，主路 12 V 回授不一定能補償。"
      ],
      "result": "即便主路精準 12 V、匝數比固定，輔輸出也可能落在 4.7 V 附近或隨負載改變；真正的交叉調節需以各路電流、溫度與工作模式驗證。"
    },
    "assumptions": [
      "本例採簡化的兩次級繞組同時整流導通、固定 Vf、忽略漏感與繞組銅阻；真實多輸出 Flyback 可能不是同時導通。 ",
      "主路回授與輔路交叉調節只是概念示範，沒有聲稱任何輔路固定電壓、啟動順序或單路負載的保證。"
    ],
    "pitfall": "認為只要 24:10 的匝比就能保證 12 V 主輸出旁必然有精準 5 V，不檢查二極體、負載和交叉調節。",
    "check": {
      "q": "主路穩在 12 V、繞組 24:10、兩路各有 0.5 V 二極體壓降時，輔路在此同時導通近似下約多少伏特？",
      "a": "V2≈(12+0.5)×10/24−0.5≈4.708 V；實際還可能受負載、繞組阻抗與導通時序改變。"
    },
    "tryIt": "到「單一變壓器供多組隔離輸出」課節，固定主路調節，再思考改變輔路負載會如何影響交叉調節。"
  },
  "37": {
    "lesson": "mid-flyback-ccm",
    "title": "Flyback 為什麼更像耦合電感，而不是 ON 就傳能的理想變壓器？",
    "question": "MOSFET ON 時二次側二極體不導通，那麼輸入能量究竟存在哪裡，關斷時才怎麼交給輸出？",
    "takeaway": "Flyback 的關鍵狀態是磁化電流與磁場儲能 E=½Lm i²；ON 時累積，OFF 時透過變壓器耦合及二極體送到輸出，負載在 ON 時靠輸出電容支撐。",
    "intuition": [
      "把 Flyback 先想成『帶隔離繞組的儲能電感』，而不是一般把一次側正弦波立刻變成二次側正弦波的理想變壓器。當 MOSFET 接通，磁化電感電流沿一次側路徑上升；因點標及整流方向，二次側二極體反偏，磁場能量增加。",
      "當 MOSFET 截止，為了維持磁化電流對應的磁通，變壓器繞組極性翻轉，二次側二極體開始導通；儲存的磁場能量透過二次側釋放。CCM 並不是每圈從零開始儲能，而是磁化電流有大於零的谷值。"
    ],
    "steps": [
      {
        "title": "先辨識磁化電感 Lm 和漏感 Llk",
        "detail": "Lm 表示磁芯共同磁通的儲能路徑，Llk 是沒有完整耦合到二次側的寄生漏感；兩者不能混成同一個能量項處理 MOSFET 尖峰。"
      },
      {
        "title": "ON：一次側磁化電流沿 Vin／Lm 上升",
        "detail": "MOSFET ON，理想一次側磁化電感 vLm≈Vin，斜率 diLm/dt≈Vin/Lm；輸出二極體截止，負載主要由 Co 供能。"
      },
      {
        "title": "OFF：次級接收磁化能量",
        "detail": "MOSFET OFF 時二次側二極體導通；以原邊折算的磁化電壓約 −(Np/Ns)(Vo+Vf)，電流由峰值下降到谷值。"
      },
      {
        "title": "用磁化能量差核對單週期傳輸",
        "detail": "磁化能量 E=½Lm i²；在理想 CCM、週期穩態、忽略其他能量路徑時，每圈可向輸出傳遞的儲能差為 ½Lm(Ipk²−Ivalley²)，不是一律 ½Lm Ipk²。"
      }
    ],
    "phases": [
      {
        "name": "ON：磁化儲能",
        "pct": 40
      },
      {
        "name": "OFF：二次側釋能",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "磁化電感的瞬時儲能",
        "tex": "E_m(t)=\\frac{1}{2}L_m i_m^2(t)",
        "plain": "Em(t)=½ Lm im²",
        "why": "儲能與電流平方成正比；CCM 週期初還保留磁化能量，因此谷值不是零。"
      },
      {
        "label": "ON 的磁化電流變化",
        "tex": "\\Delta I_m=\\frac{V_{in}D}{L_m f_s}",
        "plain": "ΔIm=Vin D/(Lm fs)",
        "why": "ON 時理想磁化電感承受 Vin，電流斜率由 v=L di/dt 決定。"
      },
      {
        "label": "CCM 單週期轉移的理想磁化能量",
        "tex": "\\Delta E=\\frac{1}{2}L_m(I_{pk}^2-I_{valley}^2)",
        "plain": "ΔE=½ Lm(Ipk²−Ivalley²)",
        "why": "若磁化電流谷值不是零，不能把 ½Lm Ipk² 當每次完全釋放的能量。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Lm=200 µH、fs=100 kHz、D=40%，假設磁化電流 ON 前谷值 1 A，理想 CCM。",
      "steps": [
        "Ts=10 µs，ON=4 µs；ΔIm=100×4µs/(200µH)=2 A，所以一次側磁化電流從 1 A 上升到 3 A。",
        "OFF 前磁化能量 Epk=½×200µH×3²=900 µJ；ON 前能量 Evalley=½×200µH×1²=100 µJ。",
        "理想單週期新增且釋出的能量差 ΔE=900−100=800 µJ；每秒 100000 圈，等效傳能約 80 W。",
        "此範例必須由 OFF 磁化伏秒抵消 ON 的 +400 V·µs，才能回到同樣的 1 A 谷值，否則不是週期穩態。"
      ],
      "result": "CCM Flyback 在每圈保留一部分磁化能量；功率來自磁化能量的增減，而不是每圈都從零開始用 ½Lm Ipk²。"
    },
    "assumptions": [
      "示例假設理想耦合、CCM、固定 Vin／Duty、Lm 與週期穩態，忽略漏感、磁芯損耗、開關及二極體壓降。",
      "實際磁化電流谷值、MOSFET 峰值、磁芯磁通密度、漏感尖峰和二次側導通時序均需量測或另以完整模型驗證。"
    ],
    "pitfall": "把 Flyback 當 ON 時直接傳功率的 Forward，或 CCM 仍套用 DCM 每圈全放空的 ½Lm Ipk² 計算傳能。",
    "check": {
      "q": "Flyback CCM 電感谷值 1 A、峰值 3 A 時，單次送出能量能用 ½Lm×3² 全部計算嗎？",
      "a": "不行；CCM 週期末仍保留 1 A 的磁化儲能，應計 ½Lm(3²−1²) 這個能量差。"
    },
    "tryIt": "在「Flyback CCM 的 ON／OFF 與轉壓比」課節，把二極體 ON/OFF、一次側磁化電流與電感儲能分開追蹤。"
  },
  "38": {
    "lesson": "mid-flyback-ccm",
    "title": "Flyback CCM 怎麼由伏秒平衡求 Vo、二次側電流和 MOSFET VDS？",
    "question": "一次側 MOSFET 關閉後，為什麼 VDS 不只是 Vin，而會出現反射輸出電壓與漏感尖峰？",
    "takeaway": "由 ON 正伏秒與 OFF 反射電壓負伏秒求 CCM 增益；二次側電流按匝比放大，MOSFET 關斷應力至少考慮 Vin+(Np/Ns)(Vo+Vf)，再加漏感過衝。",
    "intuition": [
      "Flyback 有兩種不同的『匝比』用途：一次與二次側磁化電壓可彼此反射，因此決定 OFF 復位斜率；當二次側二極體導通，折算的磁化電流又會依匝比換算到次級電流。電壓與電流的倍率方向相反，這是功率傳遞的基本條件。",
      "MOSFET OFF 並不是元件兩端只剩下原來的 Vin。二次側輸出電壓被匝比反射回一次側，疊加輸入電壓形成理想 VDS 平台；漏感能量不能立即耦合到次級，常需 RCD／TVS／有源 Clamp 處理額外尖峰。"
    ],
    "steps": [
      {
        "title": "ON：一次側施加 Vin",
        "detail": "MOSFET 導通，原邊磁化電感斜率 diLm/dt=Vin/Lm；二次側二極體截止，Co 供應負載。"
      },
      {
        "title": "OFF：次級電壓反射至原邊",
        "detail": "二次側二極體導通時，理想原邊磁化電壓約 −(Np/Ns)(Vo+Vf)，iLm 由峰值下降；主開關承受的關斷平台電壓變高。"
      },
      {
        "title": "正負伏秒平衡求理想 CCM Vo",
        "detail": "Vin D=(Np/Ns)Vo(1−D)，所以 Vo/Vin=(Ns/Np)D/(1−D)，此處忽略二極體壓降。"
      },
      {
        "title": "輸出平均電流從次級 OFF 電流求",
        "detail": "理想磁化電流以原邊折算，OFF 時二次側導通電流約 iS=(Np/Ns)iLm；二極體只在 OFF 時送能，所以 Io=(1−D)(Np/Ns)Im,avg。"
      }
    ],
    "phases": [
      {
        "name": "ON：一次側磁化電流上升",
        "pct": 40
      },
      {
        "name": "OFF：次級二極體導通",
        "pct": 60
      }
    ],
    "equations": [
      {
        "label": "CCM 磁化伏秒平衡",
        "tex": "V_{in}D=\\frac{N_p}{N_s}V_o(1-D)",
        "plain": "Vin D=(Np/Ns)Vo(1−D)",
        "why": "OFF 時輸出電壓經匝比反射至原邊，若固定週期磁化電流不漂移，正負伏秒必須相等。"
      },
      {
        "label": "理想 Flyback CCM 電壓增益",
        "tex": "\\frac{V_o}{V_{in}}=\\frac{N_s}{N_p}\\frac{D}{1-D}",
        "plain": "Vo/Vin=(Ns/Np)×D/(1−D)",
        "why": "與 Forward 的 (Ns/Np)D 不同；當零電流區出現後則不能直接套 CCM 比值。"
      },
      {
        "label": "理想 MOSFET 關斷 VDS 平台",
        "tex": "V_{DS,off}\\approx V_{in}+\\frac{N_p}{N_s}(V_o+V_F)",
        "plain": "VDS,off≈Vin+(Np/Ns)(Vo+Vf)",
        "why": "僅反射輸出與二極體壓降平台，沒有計入 Llk 尖峰、Coss 振鈴及布局寄生。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Np:Ns=2:1、Duty=40%、Lm=200 µH、fs=100 kHz。原邊折算磁化電流谷值 1 A、峰值 3 A；理想不計二極體壓降。",
      "steps": [
        "CCM 輸出 Vo=100×(1/2)×0.4/0.6≈33.33 V，ON 磁化漣波 2 A。",
        "OFF 時原邊反射電壓 (Np/Ns)Vo≈66.67 V，持續 6 µs 使原邊折算 iLm 下降約 66.67×6µs/200µH≈2 A，週期閉合。",
        "OFF 二次側二極體電流隨原邊磁化電流由 (Np/Ns)×3=6 A 降至 2 A，整週期平均 Io=(1−D)×(6+2)/2=2.4 A。",
        "輸出功率 Po≈33.33×2.4≈80 W，與 P.37 儲能差 800 µJ×100 kHz 相符；理想 MOSFET VDS 平台為 100+2×33.33≈166.67 V。"
      ],
      "result": "電壓反射、二次側電流換算和磁化能量帳在理想 CCM 可自洽；實機 MOSFET VDS 必須額外考慮漏感過衝。"
    },
    "assumptions": [
      "理想 Flyback、固定 Vin、CCM、忽略二極體正向壓降與漏感傳能損失；電壓平台與實際峰值必須區分。",
      "二次側電流是 ON 二極體截止、OFF 導通的反射磁化電流，不是原邊 MOSFET 截止後仍有原邊 MOSFET 電流；安全額定需留裕度與量測。"
    ],
    "pitfall": "把 MOSFET 關斷耐壓只選 Vin，忽略反射 Vo 和漏感尖峰；或把二次側二極體平均電流當成全週期的原邊峰值電流。",
    "check": {
      "q": "Vin=100 V、Np/Ns=2、Vo≈33.33 V，Flyback 理想 OFF 平台 VDS 大約多少？",
      "a": "VDS,off≈100+2×33.33≈166.67 V；實際峰值還可能因漏感與寄生而更高。"
    },
    "tryIt": "在「Flyback CCM 的 ON／OFF 與轉壓比」課節核對磁化電流三角波、OFF 二極體電流及 MOSFET 的反射電壓。"
  },
  "39": {
    "lesson": "mid-flyback-dcm",
    "title": "Flyback DCM 為什麼有 ON、DIODE、ZERO 三段？每段電流流向哪裡？",
    "question": "MOSFET OFF 之後二極體電流先下降到零，那麼剩下的時間誰給負載供電，VDS 又為何可能振鈴？",
    "takeaway": "DCM 磁化電流每圈從零開始、OFF 二極體釋放到零，剩下的 ZERO 區由輸出電容供負載；必須確認 D+δ<1，不能只看波形表面振鈴。",
    "intuition": [
      "與 CCM 不同，DCM Flyback 像每圈重新把磁化電流從 0 往上推，然後把儲存的能量完全放掉。當次級二極體電流降至零，二次側停止供電，輸出電容要撐到下一圈。",
      "ZERO 階段在理想簡化模型裡 iLm 已是零、輸入端不再把功率送到輸出；實機卻常能看到漏感、磁化電感與 MOSFET／二極體寄生電容造成振鈴。因此看到 VDS 有波形，不等於二次側仍在導通。"
    ],
    "steps": [
      {
        "title": "ON：一次側磁化電流由零上升",
        "detail": "MOSFET ON，理想 iLm 斜率 Vin/Lm；二次側整流二極體反偏，輸出電容提供負載電流。"
      },
      {
        "title": "DIODE：MOSFET OFF，磁化儲能傳到二次側",
        "detail": "二次側二極體導通，原邊折算磁化電流以 −(Np/Ns)(Vo+Vf)/Lm 斜率下降；次級電流從 (Np/Ns)Ipk 線性下降到零。"
      },
      {
        "title": "ZERO：二極體截止、磁化電流為零",
        "detail": "在比例 1−D−δ>0 的區段，理想磁化儲能已釋放完，負載主要由 Co 供電；真實 MOSFET VDS 可仍有寄生振鈴。"
      },
      {
        "title": "用電流面積核對負載電流",
        "detail": "理想 DCM 的平均輸出 Io=(Np/Ns)Ipk δ/2，只有 DIODE 時段的三角電流面積會流到輸出。"
      }
    ],
    "phases": [
      {
        "name": "ON：儲能",
        "pct": 30
      },
      {
        "name": "DIODE：釋能到零",
        "pct": 30
      },
      {
        "name": "ZERO：二極體截止",
        "pct": 40
      }
    ],
    "equations": [
      {
        "label": "一次側磁化峰值",
        "tex": "I_{pk}=\\frac{V_{in}D}{L_m f_s}",
        "plain": "Ipk=Vin D/(Lm fs)",
        "why": "DCM 下每圈磁化電流起點是零，ON 時 Vin 施加 D Ts 的伏秒。"
      },
      {
        "label": "DIODE 比例與理想復位",
        "tex": "\\delta=\\frac{V_{in}D}{(N_p/N_s)V_o}",
        "plain": "δ=Vin D/[(Np/Ns)Vo]",
        "why": "由一次側磁化伏秒平衡，OFF 次級導通時將輸出電壓反射回一次側；需另檢查 D+δ<1。"
      },
      {
        "label": "平均次級輸出電流",
        "tex": "I_o=\\frac{1}{2}\\frac{N_p}{N_s}I_{pk}\\delta",
        "plain": "Io=½(Np/Ns) Ipk δ",
        "why": "二次側電流只在 DIODE 區段是三角形，ON 和 ZERO 時整流器都截止。"
      }
    ],
    "worked": {
      "given": "Vin=24 V、Np:Ns=2:1、Vo=12 V、Lm=200 µH、fs=50 kHz、D=30%，理想非同步 Flyback DCM。",
      "steps": [
        "ON 峰值 Ipk=24×0.3/(200 µH×50 kHz)=0.72 A，次級初始導通電流約 2×0.72=1.44 A。",
        "反射電壓為 (Np/Ns)Vo=2×12=24 V，所以 DIODE 比例 δ=24×0.3/24=0.3，磁化電流可在 30% 週期內歸零。",
        "ZERO 比例 1−0.3−0.3=0.4>0，理想 DCM 成立；平均輸出 Io=½×1.44×0.3=0.216 A。",
        "理想輸出 Po=12×0.216=2.592 W，與磁化能量 ½×200 µH×0.72²×50 kHz=2.592 W 一致。"
      ],
      "result": "完整驗證了磁化電流峰值、二極體電流三角形、正的 ZERO 時間與理想功率帳，不能只由 Duty 單獨宣稱 DCM。"
    },
    "assumptions": [
      "理想 DCM、線性 Lm、非同步整流、固定 Vo／Vin／fs、忽略 diode Vf、銅阻、漏感與控制暫態；真實 ZERO 可能存在寄生振鈴。",
      "若次級整流電流未在下個週期前歸零或 D+δ≥1，就必須用 BCM／CCM 模型分析，不能套此 DCM 面積公式。"
    ],
    "pitfall": "把 DIODE 電流面積算成 ON＋OFF 全部磁化三角形，或以為 ZERO 階段 MOSFET VDS 的振鈴就是電感仍在向輸出傳能。",
    "check": {
      "q": "Flyback DCM 的 D=0.3、二極體導通比例 δ=0.3，最後 40% 週期的負載靠誰維持？",
      "a": "二極體已截止，負載主要靠輸出電容支撐；在理想簡化模型裡磁化電流已降到零，寄生 VDS 振鈴不代表仍在向輸出送能。"
    },
    "tryIt": "到「Flyback DCM、峰值電流與設計限制」課節對照 iLm、二極體電流、VDS，確認 D+δ 與 ZERO 區段。"
  },
  "40": {
    "lesson": "mid-flyback-dcm",
    "title": "Flyback DCM 實際算一次：Lm、Ipk、效率、MOSFET 耐壓怎麼排順序？",
    "question": "講義假設效率 80%，用 ½Lm Ipk²fs 求功率時，還有哪些條件必須另外驗證才能拿去做電源設計？",
    "takeaway": "先由 Vin、D、Lm、fs 求一次側峰值與每圈磁化儲能，再以明確假設的 η 估輸出；先確認 D+δ<1 磁化能完全復位，再分別檢查開關耐壓、漏感 Clamp、輸出電容 RMS／ESR 與磁芯飽和。",
    "intuition": [
      "DCM 的好處是磁化電流每圈從 0 開始，因此每圈在磁化電感中累積的能量近似為 ½Lm Ipk²。乘上每秒開關次數，得到可輸入到理想磁化能量路徑的功率估算；這個數值不是自動等於負載真正拿到的瓦數。",
      "假設效率 80% 只是在總能量帳裡先留出損耗預算，並不表示 MOSFET、二極體、Clamp 和電容 ESR 的損耗都已精確求出。要真的設計 Flyback，還需要逐項核對元件電壓、電流與熱應力。"
    ],
    "steps": [
      {
        "title": "先由 ON 伏秒計算一次側磁化峰值",
        "detail": "若真為 DCM，磁化電流起點為 0；Ipk≈Vin D/(Lm fs)。Ipk 還要和 current sense、磁芯飽和及 MOSFET 峰值額定比較。"
      },
      {
        "title": "算單圈儲能與總輸入功率預算",
        "detail": "理想 ON 儲能 Ecycle≈½Lm Ipk²；Pin,model≈Ecycle fs。DCM 的能量式不能直接拿來算 CCM，因為 CCM 谷值不為零。"
      },
      {
        "title": "以假設效率得到輸出功率和損耗總額",
        "detail": "給定 η=0.8，Po,estimate=0.8 Pin,model、總損耗預算約 0.2 Pin,model；不能把 η 當成已測得的真實效率。"
      },
      {
        "title": "獨立檢查 VDS 與整流器反向耐壓",
        "detail": "初級 MOSFET OFF 理想平台約 Vin+(Np/Ns)(Vo+Vf)，還有漏感過衝；次級二極體反向耐壓約 Vo+(Ns/Np)Vin。需加上元件規格餘裕。"
      },
      {
        "title": "檢查電容 ESR、漏感 Clamp 和 DCM 的 ZERO",
        "detail": "電容有 iC=iD−Io 的紋波，ESR 耗損 P≈IC,rms² ESR；漏感能量需要 Clamp 處理。用 δ=Vin D/[(Np/Ns)(Vo+Vf)] 算退磁比例並檢查 D+δ<1；若失敗，就不得用 DCM 全釋能估算。"
      }
    ],
    "equations": [
      {
        "label": "DCM 退磁與 ZERO 區段判定",
        "tex": "\\delta=\\frac{V_{in}D}{(N_p/N_s)(V_o+V_F)},\\quad D+\\delta<1",
        "plain": "δ=Vin D/[(Np/Ns)(Vo+Vf)]；必須 D+δ<1 才有 ZERO 區段",
        "why": "這是指定電壓平台的理想分段斜率估算；等於 1 是 BCM，大於 1 則此 DCM 假設無效。"
      },
      {
        "label": "磁化峰值和每圈儲能",
        "tex": "I_{pk}=\\frac{V_{in}D}{L_mf_s},\\quad E_{cycle}=\\frac{1}{2}L_mI_{pk}^2",
        "plain": "Ipk=Vin D/(Lm fs)；Ecycle=½Lm Ipk²",
        "why": "只對電感磁化電流從零開始的 DCM 做此全儲能公式；CCM 必須扣除谷值能量。"
      },
      {
        "label": "假設效率的輸出與損失預算",
        "tex": "P_{o,est}=\\eta E_{cycle}f_s,\\quad P_{loss,est}=(1-\\eta)E_{cycle}f_s",
        "plain": "Po,est=η Ecycle fs；Ploss,est=(1−η) Ecycle fs",
        "why": "η 是使用者假設的彙總效率，不是已求出各元件溫升、電流 RMS 或開關尖峰。"
      },
      {
        "label": "關斷應力理想參考",
        "tex": "V_{DS,off}\\approx V_{in}+\\frac{N_p}{N_s}(V_o+V_F)",
        "plain": "VDS,off≈Vin+(Np/Ns)(Vo+Vf)",
        "why": "僅為未加漏感尖峰的理想關斷平台；Clamp、吸收器、額定餘裕仍需另算。"
      }
    ],
    "worked": {
      "given": "Lm=200 µH、fs=50 kHz、Vin=80 V、Duty=25%，假設 DCM 且總效率 η=80%；另以 Np:Ns=2:1、Vo=20 V、Vf=0.7 V 示意 MOSFET 理想關斷應力。",
      "steps": [
        "Ts=20 µs、ON=5 µs。由輸出平台與二極體壓降估退磁比例 δ=80×0.25/[2×(20+0.7)]≈0.4831，即 DIODE≈9.66 µs；ZERO≈5.34 µs，D+δ≈0.7331<1，分段斜率的 DCM 時序條件通過。",
        "峰值 Ipk=80×0.25/(200 µH×50 kHz)=2.0 A；每次磁化儲能 Ecycle=½×200 µH×2²=400 µJ。",
        "輸入磁化能量功率預算 Pin≈400 µJ×50 kHz=20 W；若假設 η=0.8，則輸出估 16 W、未分配的總損耗預算 4 W。",
        "在假設總效率 80% 的能量預算中，20 V 負載電流估算為 16/20=0.8 A；它不是由理想二極體三角波積分得出的電流。若直接以理想電流面積計算，½×(2×2 A)×0.4831≈0.966 A，對應 20 V 時約 19.32 W；這個理想波形參考與含 80% 損耗的輸出估算不可同時當成同一個完整、已自洽的有損模型。",
        "MOSFET OFF 理想平台 VDS≈80+2×(20+0.7)=121.4 V，尚未加上漏感尖峰；實際元件額定不能直接選 121.4 V。"
      ],
      "result": "先建立能量和負載預算，再核對 DCM、耐壓、磁芯飽和與各項損耗。η=80% 只能代表設計假設，不能拿這個數字宣稱實機驗收完成。"
    },
    "assumptions": [
      "退磁時間使用指定 20 V、0.7 V 二極體壓降與理想磁化電流斜率作工作模式檢查；含二極體壓降時理想次級電流面積包含二極體耗損，不能把面積乘 Vo 誤認成全部磁化能量。效率 80% 為獨立的彙總設計假設，並非完整耦合求解的有損波形或實測結果。",
      "示例未計算磁芯 Bmax、實際漏感能量、RCD/TVS/主動 Clamp、二極體恢復、MOSFET/Coss、整流 RMS、電容 ESR／溫升或安規耐壓。",
      "若還無法證明磁化電流在每個週期起點前降回零，就不能使用 DCM 的 Ecycle=½Lm Ipk² 全釋能假設。"
    ],
    "pitfall": "把 η=80% 當元件真的只損失 4 W 的量測結果，或看到 MOSFET 理想反射平台 121.4 V 就依此選耐壓，忽略漏感尖峰。",
    "check": {
      "q": "Lm=200 µH、Ipk=2 A、fs=50 kHz 時，假設 η=80%，可以說 Flyback 已證明實際輸出必為 16 W 嗎？",
      "a": "不行。模型磁化能量預算是 20 W，套假設效率得到 Po,est=16 W；真正輸出還受各種元件損耗、模式及保護條件影響。"
    },
    "tryIt": "到「Flyback DCM、峰值電流與設計限制」課節，先驗證 Ipk 與每圈能量，再回頭檢查 OFF 反射電壓和 DCM 歸零條件。"
  },

  "41": {
    "lesson": "mid-forward-reset",
    "title": "Forward 為何沒有去磁路徑就不能工作？",
    "question": "輸出電感已達伏秒平衡，為什麼變壓器還可能飽和？",
    "takeaway": "Forward ON 時能量直接透過變壓器送到輸出電感，但磁化支路也積累正伏秒，OFF 須另有復位通路。",
    "intuition": [
      "Forward 的輸出濾波電感就像 Buck 的電感，ON 時充能、OFF 時續流；主變壓器的磁化電感卻是另一條支路，不會因輸出電感穩態就自動復位。",
      "若原邊電壓一圈只有正伏秒，磁芯 B-H 工作點會逐週向飽和方向移動，理想 Vo=匝比×Duty 雖成立於濾波電感卻不能證明電路可長期運作。"
    ],
    "steps": [
      {
        "title": "辨認主變壓器與輸出濾波電感",
        "detail": "先在講義 P.41 圖中找主變壓器與右側 L：磁化電流由原邊電壓決定，而輸出 L 的斜率由整流節點與 Vo 決定。"
      },
      {
        "title": "ON 期間輸出電感電流上升",
        "detail": "開關 ON 時二次側 D1 導通，輸出電感約承受 (Ns/Np)Vin−Vo；主磁芯亦承受正的原邊磁化電壓。"
      },
      {
        "title": "OFF 期間輸出電感繼續供電",
        "detail": "開關 OFF 時 D2 形成負載續流路徑，輸出 L 的電壓約 −Vo，但原邊磁化支路若沒有去磁路徑就無法抵消先前伏秒。"
      },
      {
        "title": "磁通必須從上一圈回到同一起點",
        "detail": "用 ΔB=∫vpdt/(Np Ae) 檢查原邊正負伏秒，若無反向復位，磁通將逐週偏移並可能造成磁芯飽和。"
      }
    ],
    "equations": [
      {
        "label": "輸出 ON 斜率",
        "tex": "v_L=(N_s/N_p)V_{in}-V_o",
        "plain": "vL=(Ns/Np)Vin−Vo",
        "why": "理想 Forward CCM 的輸出濾波電感 KVL。"
      },
      {
        "label": "理想 CCM 輸出增益",
        "tex": "V_o=(N_s/N_p)DV_{in}",
        "plain": "Vo=(Ns/Np)D Vin",
        "why": "這只由輸出濾波電感伏秒平衡推得，不代表變壓器磁化復位已完成。"
      },
      {
        "label": "磁通位移",
        "tex": "\\Delta B=V_{in}t_{on}/(N_pA_e)",
        "plain": "ΔB=Vin ton/(Np Ae)",
        "why": "原邊施加近似固定電壓時成立，仍需 OFF 的反向伏秒。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Np:Ns=2:1、D=0.4、fs=100 kHz、Np=20 匝、Ae=100 mm² 的理想 Forward 示意。",
      "steps": [
        "輸出平均電壓 Vo=(1/2)×100×0.4=20 V。",
        "ON 時間 ton=4 µs，原邊正伏秒為 100×4 µs=400 V·µs。",
        "單圈 ON 磁通位移 ΔB=400×10⁻⁶/(20×100×10⁻⁶)=0.20 T。"
      ],
      "result": "只有輸出電感平衡不夠，若沒有負伏秒復位不能把 0.20 T 視為每圈固定重複的磁通。"
    },
    "assumptions": [
      "理想輸出電感 CCM、匝比與開關電壓，未計算二極體壓降和磁芯非線性。",
      "0.20 T 是單一 ON 區間磁通變化，不是實際磁芯工作點或飽和裕度。"
    ],
    "pitfall": "把輸出電感的伏秒平衡誤認為變壓器磁芯也會自動復位。",
    "check": {
      "q": "Forward 輸出電壓算出 20 V，為何還需要復位繞組？",
      "a": "輸出 L 的伏秒平衡與主變壓器磁化支路是兩個不同條件，磁芯必須得到 OFF 反向伏秒。"
    },
    "tryIt": "對照原講義 P.41 的 B-H 曲線，分開追蹤輸出電感與磁芯磁化支路。"
  },
  "42": {
    "lesson": "mid-forward-reset",
    "title": "單開關 Forward 第三繞組如何去磁並限制 Duty？",
    "question": "為何 N3/D3 復位路徑能讓磁芯不飽和，卻限制最大 Duty？",
    "takeaway": "第三繞組在 OFF 提供原邊約 −(Np/N3)Vin 的復位電壓，所需時間為 (N3/Np)ton。",
    "intuition": [
      "第三繞組 N3 不是主功率輸出，而是讓磁化電流經復位二極體回到輸入母線，形成與 ON 相反的磁化伏秒。",
      "復位所需時間受 N3/Np 決定，並不能超過 OFF 時間；因此輸出還沒超載以前，Duty 也可能因磁芯復位限制而不可再增加。"
    ],
    "steps": [
      {
        "title": "ON 時原邊加上正向輸入電壓",
        "detail": "MOSFET ON 時原邊 +Vin，主次級向輸出 L 傳能；第三繞組的復位二極體在這段時間保持截止。"
      },
      {
        "title": "OFF 時第三繞組反射負電壓",
        "detail": "MOSFET OFF 後 D3 導通，原邊約承受 −(Np/N3)Vin，反向磁化伏秒把磁通拉回。"
      },
      {
        "title": "計算復位區段與 Duty 上限",
        "detail": "正負伏秒平衡得 treset=(N3/Np)ton；若 treset 超過 Ts−ton，磁芯不能在下一圈前復位。"
      },
      {
        "title": "檢查關斷平台與寄生尖峰",
        "detail": "MOSFET 理想 VDS 平台約 Vin[1+Np/N3]，仍要留最大 Vin、漏感尖峰與元件耐壓餘裕。"
      }
    ],
    "equations": [
      {
        "label": "磁芯伏秒復位",
        "tex": "V_{in}t_{on}=(N_p/N_3)V_{in}t_{reset}",
        "plain": "Vin ton=(Np/N3)Vin treset",
        "why": "在理想復位二極體導通期間，原邊正負伏秒必須相等。"
      },
      {
        "label": "復位上限",
        "tex": "D_{max}=1/(1+N_3/N_p)",
        "plain": "Dmax=1/(1+N3/Np)",
        "why": "由 treset≤Ts−ton 推導，實務必須另外留裕度。"
      },
      {
        "label": "理想 MOSFET 受壓",
        "tex": "V_{DS,off}\\approx V_{in}(1+N_p/N_3)",
        "plain": "VDS≈Vin(1+Np/N3)",
        "why": "僅限講義單開關第三繞組復位拓樸，不含漏感尖峰。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Np=N3=20 匝、fs=100 kHz、Duty=0.4，假設理想二極體與完整復位。",
      "steps": [
        "Ts=10 µs、ON=4 µs，一次側正伏秒=400 V·µs。",
        "N3/Np=1，復位需 4 µs，OFF 共 6 µs，仍有 2 µs 裕度。",
        "最大理想 Duty=1/(1+1)=0.5；理想 VDS 平台=100×(1+1)=200 V。"
      ],
      "result": "Duty 若增至 0.55，需 5.5 µs 復位，OFF 卻只有 4.5 µs，無法滿足週期磁化平衡。"
    },
    "assumptions": [
      "只適用講義 P.42 的第三繞組與復位二極體接法，不是所有 Forward 共同的 Duty 上限。",
      "忽略二極體壓降、開關尖峰、磁芯非線性、輸入母線漣波與啟動暫態。"
    ],
    "pitfall": "把第三繞組 N3/Np 放反，或認為任何 Forward 都只能使用 50% Duty。",
    "check": {
      "q": "N3=Np 時若 D=0.55，磁芯能在每圈完成去磁嗎？",
      "a": "不能。需要 0.55Ts 的復位時間，OFF 只有 0.45Ts，正負伏秒無法平衡。"
    },
    "tryIt": "根據 P.42 實際 N3、D3 與 v1 圖，標出 ON、RESET、IDLE 三個時段。"
  },
  "43": {
    "lesson": "mid-double-forward",
    "title": "雙開關 Forward 怎麼回收磁化能量？",
    "question": "兩顆 MOSFET 同時開關，為何不會形成同橋臂直通？關閉後能量回到哪裡？",
    "takeaway": "雙開關 Forward 在 ON 以 Q1/Q2 串接主變壓器承受 +Vin，OFF 經復位二極體回送母線並施加約 −Vin。",
    "intuition": [
      "講義的兩顆 MOSFET 不是一組上下管直接短路，而是分別位於變壓器一次側上下端，同時導通時形成穿過變壓器的功率通路。",
      "OFF 後磁化電流不能瞬間消失，兩顆復位二極體提供回流至輸入母線的路徑，使磁芯受到反向伏秒，也降低理想開關耐壓平台。"
    ],
    "steps": [
      {
        "title": "ON 兩顆主開關串接一次側",
        "detail": "Q1 與 Q2 同時導通時，Vin 透過變壓器一次側施壓並在次級向輸出濾波電感送能。"
      },
      {
        "title": "OFF 兩顆二極體形成回收路徑",
        "detail": "兩個 MOSFET 同時關閉後，磁化電流驅動兩顆復位二極體，把磁化能量送回 DC Bus，原邊電壓反轉。"
      },
      {
        "title": "用正負伏秒求最大 Duty",
        "detail": "理想 ON 為 +Vin、RESET 為 −Vin，因此回復同一磁通所需復位時間約等於 ON，典型 D≤0.5。"
      },
      {
        "title": "理想夾位不能等於耐壓保證",
        "detail": "MOSFET 的理想關斷平台約 Vin，但實際寄生電感、二極體動態與板上迴路仍可能造成額外尖峰。"
      }
    ],
    "equations": [
      {
        "label": "雙開關磁化復位",
        "tex": "V_{in}t_{on}=V_{in}t_{reset}",
        "plain": "Vin ton=Vin treset",
        "why": "復位二極體建立回流路徑，將原邊反向電壓夾到約 −Vin。"
      },
      {
        "label": "理想工作 Duty",
        "tex": "D\\leq 0.5",
        "plain": "D≤0.5",
        "why": "正向磁化所需的復位時間不能超過週期內可用 OFF 時間。"
      },
      {
        "label": "理想元件關斷平台",
        "tex": "V_{DS,ideal}\\approx V_{in}",
        "plain": "VDS≈Vin",
        "why": "只代表理想夾位，不能直接據此選 MOSFET 額定。"
      }
    ],
    "worked": {
      "given": "雙開關 Forward 的 DC Bus Vin=400 V、fs=100 kHz、D=0.4，假設理想回收二極體。",
      "steps": [
        "ON=4 µs，原邊 +400 V 正伏秒合計 1600 V·µs。",
        "關斷期間回送母線時原邊約 −400 V，需 4 µs 復位。",
        "OFF=6 µs，所以可留 2 µs 空白；理想單顆 MOSFET VDS 平台約 400 V。"
      ],
      "result": "真正元件耐壓仍需最大母線電壓、尖峰、熱與失效模式餘裕，不能照平台選 400 V 額定。"
    },
    "assumptions": [
      "依原講義 P.43 兩 MOSFET、兩復位二極體拓樸，忽略二極體壓降與非理想寄生。",
      "本頁講的是理想母線回收和磁化復位，不等同於真實 ZVS、尖峰或短路保護設計完成。"
    ],
    "pitfall": "把兩顆 MOSFET 同時 ON 當成橋臂直通，或以為二極體夾位可保證 VDS 永遠不超過 Vin。",
    "check": {
      "q": "Vin=400 V、D=0.4 的雙開關 Forward 理想復位需多久？",
      "a": "每週期 ON 4 µs，需約 4 µs 反向復位；實際 VDS 額定仍應大於最大平台並留尖峰餘裕。"
    },
    "tryIt": "依 P.43 原圖追蹤 Q1/Q2、D1/D2 和輸入 DC Bus 的回收電流路徑。"
  },

  "44": {
    "lesson": "mid-half-full",
    "title": "隔離半橋為何一次側只有約一半母線電壓？",
    "question": "同樣接在 Vin 的 DC Bus 上，為何半橋一次側施加約 ±Vin/2，而不是 ±Vin？",
    "takeaway": "半橋由兩個分壓電容建立中點，變壓器原邊夾在橋臂中點與電容中點；講義 D=ton/Ts<0.5 時理想增益為 nD。",
    "intuition": [
      "兩個串接的 Bus 電容先把 Vin 分成上下兩半，切換 T1/T2 時原邊相對電容中點受到 +Vin/2 與 −Vin/2，故瞬時電壓只是一半。",
      "次級使用中心抽頭全波整流，正負半週都變成向輸出電感送能的正脈衝；每整週有兩段長度 ton 的送能區間，不能漏乘兩次。"
    ],
    "steps": [
      {
        "title": "讀出半橋中點與電容中點",
        "detail": "上管與下管交替切換，變壓器另一端接 C1/C2 中點；平衡且理想時兩電容各分得 Vin/2。"
      },
      {
        "title": "每半週 ON 二次側送能",
        "detail": "原邊承受 +Vin/2 或 −Vin/2，各自對應中心抽頭整流器的一顆二極體導通，輸出電感 vL≈nVin/2−Vo。"
      },
      {
        "title": "無送能區間仍有輸出電感續流",
        "detail": "兩個送能脈衝以外，輸出 L 透過次級整流器形成續流路徑，仍維持電流向負載供電，這時 vL≈−Vo，電感電流逐漸下降。"
      },
      {
        "title": "完整週期積分並標明 Duty 定義",
        "detail": "每個脈衝長 ton，整週正向整流總時間 2ton=2DTs，所以 Vo=(nVin/2)×2D=nVinD。"
      }
    ],
    "equations": [
      {
        "label": "原邊電壓幅值",
        "tex": "|v_p|\\approx V_{in}/2",
        "plain": "|vp|≈Vin/2",
        "why": "前提是兩串接母線電容分壓平衡、忽略開關壓降。"
      },
      {
        "label": "講義定義下的理想 CCM 增益",
        "tex": "V_o/V_{in}\\approx(N_s/N_p)D",
        "plain": "Vo/Vin≈(Ns/Np)D",
        "why": "D=ton/Ts、每半週一脈衝且 0<D<0.5；Ns 為每半邊次級匝數。"
      },
      {
        "label": "整週兩次送能",
        "tex": "D_{effective}=2t_{on}/T_s=2D",
        "plain": "有效整流占空=2D",
        "why": "這是整流後輸出電感的有效送能比例，不是單顆開關的 Duty。"
      }
    ],
    "worked": {
      "given": "Vin=400 V、次級每半繞組 Ns/Np=0.25、D=0.30，理想半橋 CCM 且 C1=C2 平衡。",
      "steps": [
        "原邊幅值 |vp|≈200 V，每次整流到輸出前電壓幅值≈0.25×200=50 V。",
        "週期有兩個 0.30Ts 的送能脈衝，有效總占空=0.60。",
        "輸出平均 Vo≈50×0.60=30 V，也等於 400×0.25×0.30。"
      ],
      "result": "母線電容中點不平衡或占空不對稱時，原邊伏秒及開關應力可能偏離此理想值。"
    },
    "assumptions": [
      "原始 P.44 是電容分壓半橋與中心抽頭次級整流，採每半週單脈衝 Duty 定義。",
      "忽略死區、C1/C2 不平衡、磁化偏流、漏感與二極體換流，不能當真實元件額定。"
    ],
    "pitfall": "把每個開關的 D 和整週整流有效占空 2D 混用，或忘記半橋原邊只有 Vin/2。",
    "check": {
      "q": "Vin=400 V、Ns/Np=0.25、D=0.30，為何理想 Vo 是 30 V 不是 60 V？",
      "a": "原邊只有 200 V，次級整流幅值 50 V，整週有效占空 0.60，因此 Vo=30 V。"
    },
    "tryIt": "參照原講義 P.44 的 C1/C2、T1/T2 與中心抽頭次級，標出兩半週的整流電流。"
  },
  "45": {
    "lesson": "mid-half-full",
    "title": "隔離全橋為何輸出增益可比半橋高一倍？",
    "question": "同樣匝比與單脈衝 Duty，四 MOSFET 全橋如何讓原邊看到 ±Vin？",
    "takeaway": "全橋由對角開關讓一次側得到 +Vin/−Vin；講義兩段 ton 的送能脈衝使 Vo/Vin≈2(Ns/Np)D。",
    "intuition": [
      "全橋不再使用中點電容取 Vin/2，而讓變壓器兩端跨接完整 Bus；對角 MOSFET 組合決定原邊電壓的正負方向。",
      "中心抽頭次級把兩種原邊極性整流成正向輸出，輸出濾波 L 平均看到兩個幅值 nVin 的脈衝；真正電流還由負載與漣波決定。"
    ],
    "steps": [
      {
        "title": "正向對角開關導通",
        "detail": "左上與右下（依 P.45 圖標記）形成 +Vin 一次側電壓，次級其中一顆整流二極體供應輸出電感。"
      },
      {
        "title": "反向對角開關導通",
        "detail": "另一組對角 MOSFET 產生 −Vin，中心抽頭次級換另一顆二極體仍給輸出同方向能量。"
      },
      {
        "title": "零電壓區維持輸出電感續流",
        "detail": "兩段送能以外，整流節點近似 0 V，輸出電感 vL≈−Vo，電流不能瞬間消失。"
      },
      {
        "title": "兩段 ON 形成有效 Duty",
        "detail": "在講義 D=ton/Ts<0.5 條件下，整週有效送能比例為 2D，因此輸出增益為 2nD。"
      }
    ],
    "equations": [
      {
        "label": "理想全橋一次側電壓",
        "tex": "v_p\\in\\{-V_{in},0,+V_{in}\\}",
        "plain": "vp∈{−Vin,0,+Vin}",
        "why": "依對角 Gate 與續流狀態而定，不能只以單臂 Gate 判斷。"
      },
      {
        "label": "講義 CCM 增益",
        "tex": "V_o/V_{in}\\approx2(N_s/N_p)D",
        "plain": "Vo/Vin≈2(Ns/Np)D",
        "why": "每半週一個 ton，D=ton/Ts<0.5，中心抽頭 Ns 是單半邊匝數。"
      },
      {
        "label": "輸出 L 的平均伏秒",
        "tex": "2D(nV_{in}-V_o)+(1-2D)(-V_o)=0",
        "plain": "2D(nVin−Vo)+(1−2D)(−Vo)=0",
        "why": "此式為輸出電感伏秒平衡，忽略整流壓降及死區。"
      }
    ],
    "worked": {
      "given": "Vin=400 V、Ns/Np=0.25、D=0.30，理想全橋固定 Duty PWM/CCM，和 P.44 半橋對照。",
      "steps": [
        "全橋 ON 時原邊幅值 400 V，次級半繞組整流幅值約 100 V。",
        "整週有效送能占空=2D=0.60，輸出 Vo≈100×0.60=60 V。",
        "半橋同參數原邊只有 200 V，理想輸出 30 V，因此全橋增益為兩倍。"
      ],
      "result": "這不是 PSFB 含漏感換流與有效占空損失的模型，不應直接用來承諾相移控制輸出。"
    },
    "assumptions": [
      "P.45 的固定 Duty 對角 PWM、中心抽頭整流、理想 CCM 輸出電感，不是所有相移全橋控制方式。",
      "Dead Time、ZVS/硬切換、漏感有效 Duty 損失、磁通偏壓與損耗需另驗證。"
    ],
    "pitfall": "把 P.45 的 D<0.5 定義直接改成 0–100% 並照套 2D 公式，或把全橋誤當 PSFB 完整模型。",
    "check": {
      "q": "同 Vin、匝比、D 條件下，半橋 30 V、全橋 60 V 的主因是什麼？",
      "a": "全橋原邊每個有效脈衝可施加約 Vin，半橋只施加約 Vin/2；整週兩者都是兩次 ton。"
    },
    "tryIt": "參照 P.45 四 MOSFET 對角組合、次級整流二極體與輸出 L，標三種 vp 狀態。"
  },
  "46": {
    "lesson": "mid-pushpull",
    "title": "電壓源型 Push-Pull 為何 MOSFET 可能承受 2Vin？",
    "question": "兩顆 MOSFET 輪流導通且都在低側，關閉的另一顆為何不是只承受 Vin？",
    "takeaway": "中心抽頭原邊一半施加 +Vin 時，另一半感應出同幅電壓疊到 DC Bus，未導通開關理想 VDS 約 2Vin。",
    "intuition": [
      "Push-Pull 的兩個原邊半繞組共享中心抽頭，兩顆低側 MOSFET 輪流導通，使兩次磁化電壓方向相反。",
      "未導通的半繞組也會感應電壓，該 MOSFET Drain 因而可能被抬到母線以上；這種反射關斷應力與兩管數量無關。"
    ],
    "steps": [
      {
        "title": "第一顆開關施加單側原邊 Vin",
        "detail": "T1 ON 時，第一半原邊承受 Vin，次級 D1 送能，未導通第二半原邊同時感應相應極性電壓。"
      },
      {
        "title": "另一顆開關承受疊加電壓",
        "detail": "理想等匝數兩半原邊，T2 OFF 的 Drain 約被抬到 Vin+Vin=2Vin，不含漏感尖峰。"
      },
      {
        "title": "換半週由第二顆主開關供能",
        "detail": "T2 ON 時極性反轉，由次級另一顆整流二極體供能，輸出電感電流仍維持同一方向。"
      },
      {
        "title": "磁通平衡與 Dead Time",
        "detail": "兩半週有效磁化伏秒必須匹配，開關延遲或導通電壓差可能導致 Flux Walking，需有非重疊時序和保護。"
      }
    ],
    "equations": [
      {
        "label": "等匝半繞組未導通管耐壓",
        "tex": "V_{DS,off,ideal}\\approx2V_{in}",
        "plain": "VDS,off≈2Vin",
        "why": "中心抽頭原邊兩半匝數相等，未包含漏感尖峰。"
      },
      {
        "label": "講義理想 CCM 輸出增益",
        "tex": "V_o/V_{in}\\approx2(N_s/N_p)D",
        "plain": "Vo/Vin≈2(Ns/Np)D",
        "why": "每半週單脈衝 D=ton/Ts<0.5，Np 指單側一次半繞組。"
      },
      {
        "label": "磁芯每圈復位",
        "tex": "\\int_0^{T_s}v_p(t)dt\\approx0",
        "plain": "原邊全週期 ∫vp dt≈0",
        "why": "兩個半週施加相反電壓，若有偏差則可能磁通走偏。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Np 半繞組與另一半匝數相同，Ns/Np=0.25、D=0.30，理想 Push-Pull。",
      "steps": [
        "一顆 MOSFET ON 時單側一次繞組受 100 V；另一側也感應 100 V。",
        "關斷的另一 MOSFET 理想 VDS≈100+100=200 V，實際須另加漏感尖峰。",
        "整週次級有效整流幅值 25 V，兩個 ON 共 0.60Ts，Vo≈25×0.60=15 V。"
      ],
      "result": "若左右半週不平衡，磁芯可能逐週偏磁，耐壓正確也不能保證安全。"
    },
    "assumptions": [
      "P.46 電壓源型、等匝數中心抽頭一次繞組及中心抽頭次級全波整流。",
      "理想無寄生、無開關壓降、兩半週伏秒對稱；實機須考慮 DC 偏磁、突波及 MOSFET 額定。"
    ],
    "pitfall": "認為每顆低側 MOSFET 只需耐 Vin，或把電流源型 Push-Pull 的重疊導通套到電壓源型。",
    "check": {
      "q": "Vin=100 V 時電壓源型 Push-Pull 關閉的 MOSFET 為何理想可看到 200 V？",
      "a": "另一半一次側的 100 V 感應電壓疊加在中心抽頭 Vin 上，故關斷管約承受 2Vin。"
    },
    "tryIt": "依 P.46 的中心抽頭原邊，在 T1 ON 和 T2 ON 時追每半繞組點標極性與 VDS。"
  },
  "47": {
    "lesson": "mid-pushpull",
    "title": "電流源型 Push-Pull 為何允許兩開關重疊導通？",
    "question": "第47頁 D>0.5 與電壓源型 D<0.5 有什麼物理差別？",
    "takeaway": "輸入串聯電感使輸入電流近似連續，重疊導通時先儲能，單側導通時向輸出送能；理想增益為 (Ns/Np)/[2(1−D)]。",
    "intuition": [
      "電流源型 Push-Pull 不是把電壓源型的兩顆 Gate 照抄，因為輸入有儲能電感 Ld，兩管重疊 ON 用來建立輸入電感電流。",
      "與電壓源型相反，真正危險的是突然讓輸入電感電流完全沒有合法通路；先找每個 Gate 組合的電流路徑，再談負載或保護。"
    ],
    "steps": [
      {
        "title": "兩顆 MOSFET 重疊導通",
        "detail": "當 T1/T2 同時 ON，電感 Ld 近似承受 +Vin，輸入電流增加，此階段不以正常次級輸出傳能為主。"
      },
      {
        "title": "只有單側 MOSFET 導通",
        "detail": "由一側繞組將電流送到次級，Ld 承受 Vin−(Np/Ns)Vo，若輸出反射電壓大於 Vin 則電流下降。"
      },
      {
        "title": "依重疊與單側時間做伏秒平衡",
        "detail": "各管 D>0.5，整週重疊比例 2D−1、單側傳能總比例 2(1−D)，推得講義理想增益。"
      },
      {
        "title": "保護電感與開關節點",
        "detail": "輸入電感不能任意斷路；還要檢查漏感造成的節點過壓、主開關重疊與次級整流應力。"
      }
    ],
    "equations": [
      {
        "label": "輸入電感的平均伏秒",
        "tex": "V_{in}(2D-1)+[V_{in}-(N_p/N_s)V_o]2(1-D)=0",
        "plain": "Vin(2D−1)+[Vin−(Np/Ns)Vo]2(1−D)=0",
        "why": "重疊階段 Ld 加壓 +Vin，單側傳能階段 Ld 加壓 Vin−反射 Vo。"
      },
      {
        "label": "講義理想轉壓比",
        "tex": "V_o/V_{in}=(N_s/N_p)/[2(1-D)]",
        "plain": "Vo/Vin=(Ns/Np)/[2(1−D)]",
        "why": "僅在連續輸入電感電流、正確重疊時序且 D>0.5 的模型。"
      },
      {
        "label": "重疊比例",
        "tex": "D_{overlap}=2D-1",
        "plain": "重疊時間比例=2D−1",
        "why": "若 D≤0.5，此教學模型的重疊儲能區間已不存在。"
      }
    ],
    "worked": {
      "given": "Vin=100 V、Ns/Np=0.5、每管 D=0.75，假設電流源型 Push-Pull 輸入電感 CCM。",
      "steps": [
        "重疊導通占空=2×0.75−1=0.50，單側送能總占空=0.50。",
        "依增益 Vo/Vin=0.5/[2(1−0.75)]=1，所以 Vo≈100 V。",
        "單側送能時原邊反射輸出=(Np/Ns)Vo=200 V，Ld 電壓=100−200=−100 V。"
      ],
      "result": "正負電感伏秒=100×0.5+(-100)×0.5=0；仍須確認輸入電感與主開關安全通路。"
    },
    "assumptions": [
      "以 P.47 輸入串聯 Ld、兩管重疊的電流源型中心抽頭推挽為主，忽略整流器壓降和死區。",
      "需輸入電感電流連續、固定開關週期與正確的功率路徑；不應把本模型直接套到電壓源型 Push-Pull。"
    ],
    "pitfall": "看到兩管重疊導通就判斷為電壓源型橋臂短路，或移除重疊造成電感無合法續流路徑。",
    "check": {
      "q": "D=0.75 的電流源型 Push-Pull 為何有 50% 重疊區？",
      "a": "兩管各導通 75% 週期，重疊比例 2D−1=0.50，是輸入電感儲能的區段。"
    },
    "tryIt": "依 P.47 原始 Gate 與輸入電感 id 波形，驗證重疊、單側傳能及 Ld 正負伏秒。"
  },

  "48": {
    "lesson": "mid-magnetization",
    "title": "為何變壓器等效電路要分 Lm 與漏感？",
    "question": "同一顆變壓器，為何 Flyback 把磁化電感當儲能主角，Forward 卻主要利用即時傳能？",
    "takeaway": "P.48 的等效電路分成理想匝比、磁化支路 Lm 與一次/二次漏感；它們分別決定磁通、耦合與寄生尖峰。",
    "intuition": [
      "實際變壓器的磁通不會百分之百耦合。能共同穿過一次與二次繞組的磁通構成理想耦合；磁化支路代表建立主磁通所需電流，漏感代表未完整耦合的場能。",
      "Flyback 透過磁化支路儲能再釋放，Forward 在 ON 對次級送能但磁化電流仍須復位。相同外型的磁件不能僅由符號認定工作機理相同。"
    ],
    "steps": [
      {
        "title": "從原圖找磁化與漏感分支",
        "detail": "講義 P.48 的等效圖包括一次側 L_l1、並聯磁化支路 Lm、理想變壓器與二次側 L_l2，辨認能量作用和參考方向。"
      },
      {
        "title": "磁化電流與磁通相關",
        "detail": "原邊加 vp 時，磁化電流以 vp/Lm 改變，決定主磁通位移；若正負伏秒不平衡就可能偏磁。"
      },
      {
        "title": "漏感與非理想耦合相關",
        "detail": "開關關斷時漏感電流不能瞬變，與 Coss、寄生電容等形成電壓尖峰和振鈴，不能把全部漏感當成可送到次級的磁化能量。"
      },
      {
        "title": "比較 Flyback 與 Forward 功率路徑",
        "detail": "Flyback 通常 ON 儲能、OFF 向次級釋能；Forward ON 經變壓器與輸出濾波電感直接傳能，OFF 需主磁化復位。"
      }
    ],
    "equations": [
      {
        "label": "理想繞組瞬時電壓",
        "tex": "v_s/v_p=N_s/N_p",
        "plain": "vs/vp=Ns/Np",
        "why": "只針對相同參考極性的理想耦合繞組電壓關係。"
      },
      {
        "label": "磁化電流斜率",
        "tex": "di_m/dt=v_p/L_m",
        "plain": "di_m/dt=vp/Lm",
        "why": "只在線性磁化電感 Lm 且磁芯尚未進入飽和區域時成立。"
      },
      {
        "label": "漏感局部儲能",
        "tex": "E_{lk}=(1/2)L_{lk}i^2",
        "plain": "Elk=½ Llk i²",
        "why": "實際需按漏感的折算位置、支路電流與磁通耦合確認。"
      }
    ],
    "worked": {
      "given": "簡化示例 Lm=200 µH、vp=100 V、ON=4 µs、原邊漏感 Llk=2 µH、關斷前原邊電流 2 A。",
      "steps": [
        "磁化電流增量 Δim=vp ton/Lm=100×4µs/(200µH)=2 A。",
        "以指定漏感及 2 A 瞬間電流估漏感儲能 Elk≈½×2µH×2²=4 µJ。",
        "若開關頻率 100 kHz，4 µJ×100 kHz=0.4 W 只是每週期漏感能量規模示意，不等同全部變成 Clamp 損失。"
      ],
      "result": "磁化能量與漏感能量屬不同路徑，元件的真實尖峰須回到寄生網路、Clamp 與量測。"
    },
    "assumptions": [
      "本頁採 P.48 理想變壓器加磁化與漏感支路的簡化模型，不代表所有繞組耦合可用單一漏感。",
      "局部漏感能量與 0.4 W 只為指定電流和開關頻率的估算，沒有對波形及能量回收完整建模。"
    ],
    "pitfall": "把漏感當作能全部送往次級的磁化能量，或忽略 Forward 也有磁化電流需復位。",
    "check": {
      "q": "Lm=200 µH、Llk=2 µH 能否把兩者直接相加計算 Flyback 每圈輸出功率？",
      "a": "不能。Lm 是主磁化儲能，Llk 的場能不會依同一理想耦合通路全部轉給次級，必須分開建模。"
    },
    "tryIt": "在 P.48 原始變壓器等效圖標出 Lm、L_l1、L_l2 與理想匝比，畫出各支路流向。"
  },
  "49": {
    "lesson": "mid-magnetization",
    "title": "單向與雙向激磁的 B 波形差在哪裡？",
    "question": "同樣的正負磁化伏秒，為何一種 B 波形在零附近以上擺動，另一種跨越正負 B？",
    "takeaway": "磁通工作點由初始磁化、復位路徑與正負伏秒決定；單向激磁偏同側工作，雙向激磁可跨正負 B，但兩者都必須避免 flux walking。",
    "intuition": [
      "把 B 想成磁芯的工作位置，而不是把正負電壓直接當成正負磁通。電壓決定 dB/dt，起始 B 和每一段伏秒共同決定整段 B 波形。",
      "單向激磁可從某個復位工作點爬到正側峰值再返回；雙向激磁可從負 B 向正 B 移動。若正負伏秒不相等，雙向也會逐圈走偏。"
    ],
    "steps": [
      {
        "title": "辨識 P.49 上方電壓與下方 B",
        "detail": "上方正負電壓脈衝決定每段 dB/dt，下面鋸齒狀磁通由電壓積分而來，不能直接把 v 的大小當成 B。"
      },
      {
        "title": "單向激磁先升再復位到起點",
        "detail": "正伏秒讓 B 上升、負伏秒拉回同一非負工作區間，常見於需要復位的單端拓樸。"
      },
      {
        "title": "雙向激磁在正負 B 區往返",
        "detail": "推挽、半橋、全橋可交替施加正負原邊電壓，設計上可讓 B 從負值走到正值再返回。"
      },
      {
        "title": "檢查周期伏秒偏差與飽和距離",
        "detail": "即使正反電壓幅值近似相同，也必須檢查導通時間、器件壓降與起始磁偏，避免磁通逐週漂移。"
      }
    ],
    "equations": [
      {
        "label": "磁通變化由伏秒積分",
        "tex": "B(t_2)-B(t_1)=\\int_{t_1}^{t_2}v_pdt/(N_pA_e)",
        "plain": "ΔB=∫vp dt/(Np Ae)",
        "why": "假設磁芯有效截面 Ae 和繞組匝數固定，且電壓參考極性已明確。"
      },
      {
        "label": "週期回到相同磁化狀態",
        "tex": "\\int_0^{T_s}v_p(t)dt=0",
        "plain": "每週期原邊正負伏秒總和=0",
        "why": "這是必要穩態條件，仍不保證工作點低於溫度下的飽和磁通。"
      },
      {
        "label": "對稱雙向峰峰值",
        "tex": "B_{pp}=2B_{pk}\\quad(\\mathrm{centered})",
        "plain": "對稱以零為中心時 Bpp=2Bpk",
        "why": "必須明確區分峰值 Bpk 與峰峰擺幅 Bpp。"
      }
    ],
    "worked": {
      "given": "Np=20、Ae=100 mm²，vp=+100 V 作用 4 µs，後接 −100 V 作用 4 µs。",
      "steps": [
        "正向伏秒=400 V·µs，正向磁通位移 ΔB=0.20 T。",
        "反向伏秒=−400 V·µs，使 B 回到同一週期起點。",
        "若以 Bstart=−0.10 T 開始，先到 +0.10 T 再回 −0.10 T，這是理想中心對稱雙向擺幅。"
      ],
      "result": "若改以 Bstart=0 T 開始，會在 0～0.20 T 擺動；正負伏秒一樣，但磁通工作點不同。"
    },
    "assumptions": [
      "P.49 B 波形為概念示意，工作點位置需由實際復位、磁芯殘磁及電路初始條件決定。",
      "本例忽略磁芯非線性、氣隙、繞組壓降與磁化電流飽和，不能以 ΔB 單獨判斷安全。"
    ],
    "pitfall": "認為雙向激磁一定不飽和，或把正負伏秒相同誤解成一定以 B=0 為中心。",
    "check": {
      "q": "同樣 +400 與 −400 V·µs，為何 B 可以在 0～0.2 T 或 −0.1～+0.1 T？",
      "a": "電壓積分只決定 ΔB，磁芯起始 B 與偏磁決定工作區間的位置。"
    },
    "tryIt": "把 P.49 的兩種 B 波形與上方 vp 正負脈衝逐段對齊，觀察磁通起點的差異。"
  },
  "50": {
    "lesson": "mid-magnetization",
    "title": "雙端式 PWM 要怎麼讀 Gate 時序與磁芯電壓？",
    "question": "P.50 為什麼 T1/T2 交替，而全橋卻要兩顆對角 MOSFET 同時 ON？",
    "takeaway": "雙端式 PWM 以週期內交替磁化方向利用變壓器；Gate 組合依 Push-Pull、Half-Bridge、Full-Bridge 接線不同，不能只靠相同 PWM 圖類推。",
    "intuition": [
      "P.50 上方三種拓樸雖然都能產生正負原邊電壓，但電壓源 Push-Pull 是兩個原邊半繞組輪流導通，半橋則以單橋臂切換，完整全橋必須用對角導通組合。",
      "鋸齒載波與控制電壓決定每個脈衝長度，兩個半週交替送能，中間 None 是無主動傳能或續流區段；真正安全 Dead Time 不能只靠示意圖。"
    ],
    "steps": [
      {
        "title": "先從載波交點決定 ton",
        "detail": "鋸齒與控制電壓比較，形成每半週所需的有效脈衝寬度；較高控制命令不代表可以超過拓樸的合法 Duty。"
      },
      {
        "title": "Push-Pull 交替開不同原邊半繞組",
        "detail": "T1 ON 然後 T2 ON 的區間使用不同一半中心抽頭原邊，讓主磁通方向交替而不是兩管任意同時開。"
      },
      {
        "title": "Half-Bridge 交替上管與下管",
        "detail": "T1 與 T2 分別把原邊連到母線上下半部，產生約 +Vin/2 與 −Vin/2，需防止橋臂直通。"
      },
      {
        "title": "Full-Bridge 使用對角成對導通",
        "detail": "講義所示兩組 T1/T2 與 T3/T4 交替，形成 +Vin/−Vin；無主動施壓區間仍須分析電感續流與實際換流路徑。"
      }
    ],
    "equations": [
      {
        "label": "單脈衝 Duty 定義",
        "tex": "D=t_{on}/T_s,\\quad 0<D<0.5",
        "plain": "D=ton/Ts，且每半週脈衝 D<0.5",
        "why": "對應 P.50 的雙端 PWM 兩個半週有效脈衝。"
      },
      {
        "label": "對稱原邊磁通平衡",
        "tex": "V_+t_+-V_-t_-=0",
        "plain": "正向伏秒=反向伏秒",
        "why": "若電壓幅值不同，不能只要求兩個 Gate 脈寬相同。"
      },
      {
        "label": "理想全橋一次側電壓",
        "tex": "v_p\\in\\{+V_{in},0,-V_{in}\\}",
        "plain": "vp∈{+Vin,0,−Vin}",
        "why": "由兩組對角開關實際導通與續流時序共同決定一次側電壓。"
      }
    ],
    "worked": {
      "given": "假設全橋 Vin=400 V、fs=100 kHz，每整週正向對角組與負向對角組各 ON 3 µs。",
      "steps": [
        "Ts=10 µs，每一段 Duty=3/10=0.30，兩段送能總占空為 0.60。",
        "正向原邊伏秒 +400×3 µs=+1200 V·µs。",
        "負向原邊伏秒 −400×3 µs=−1200 V·µs，理想磁通每週期回到起點。"
      ],
      "result": "若正向 3.2 µs 而負向 3.0 µs，則殘餘 +80 V·µs，可能造成 flux walking，不能把波形視為正常對稱。"
    },
    "assumptions": [
      "本頁針對 P.50 的雙端固定 PWM 示意，並非 PSFB 相移控制的完整有效 Duty 或 ZVS 模型。",
      "未示範死區、寄生換流、控制保護和磁通 DC 偏置消除電路，不能照圖直接寫 Gate 驅動韌體。"
    ],
    "pitfall": "把不同拓樸的 Gate 命名對應混用、忽略橋臂短路與磁通偏移，或拿示意圖當正式 Dead Time 設定。",
    "check": {
      "q": "全橋兩組對角各 ON 3 µs，Vin=400 V，為何原邊伏秒能平衡？",
      "a": "正負電壓各為 400 V、持續時間相同，+1200 和 −1200 V·µs 抵消。"
    },
    "tryIt": "逐一對照 P.50 Push-Pull、Half-Bridge、Full-Bridge 的開關群組，標正負 vp 與 None 區段。"
  },
  "51": {
    "lesson": "mid-coreloss",
    "title": "B-H 曲線與鐵損曲線怎麼用來避免磁芯過熱？",
    "question": "磁芯沒有達 Bsat，為什麼仍可能因高頻、磁通擺幅與溫度造成過熱？",
    "takeaway": "Bsat 限制磁通工作區，Steinmetz 類經驗式描述特定材料、頻率、波形與溫度下的鐵損密度；兩者需獨立驗證。",
    "intuition": [
      "磁芯即使沒有瞬間飽和，磁化方向每週期變化仍會產生磁滯與其他高頻損失，這些能量最後變成熱。",
      "P.51 左圖關注 B 隨 H 的磁性行為及溫度差異，右圖關注頻率、磁通擺幅與損耗密度的關係；不能只看一張曲線就宣稱可以安全使用。"
    ],
    "steps": [
      {
        "title": "先從電壓伏秒求磁通擺幅",
        "detail": "由 vp=NAe dB/dt 求每個激磁區段的 ΔB，特別注意匝數、有效截面與使用的是峰值或峰峰值。"
      },
      {
        "title": "再確認實際 B 工作區間",
        "detail": "ΔB 之外還需知道初始偏磁、殘磁與溫度下 Bsat，單向/雙向工作點可具有不同的飽和裕度。"
      },
      {
        "title": "依材料資料查鐵損密度",
        "detail": "Steinmetz 近似 Pcv=k fs^a (ΔB)^b 需使用對應材質、溫度、頻率與波形的實測係數，不能把示意圖直接量產設計。"
      },
      {
        "title": "將損耗與熱設計連結",
        "detail": "鐵損乘以磁芯有效體積，加上繞組銅損與鄰近效應後，仍須用熱阻、熱點與實測驗證溫度。"
      }
    ],
    "equations": [
      {
        "label": "磁通由電壓積分",
        "tex": "\\Delta B=\\int v_pdt/(N_pA_e)",
        "plain": "ΔB=∫vp dt/(Np Ae)",
        "why": "由法拉第定律而來，需指定區段及磁通方向。"
      },
      {
        "label": "材料經驗式",
        "tex": "P_{cv}\\approx kf_s^a(\\Delta B)^b",
        "plain": "損耗密度 Pcv≈k fs^a (ΔB)^b",
        "why": "只有指定材料、溫度、波形、頻率與 ΔB 定義範圍內可使用。"
      },
      {
        "label": "總磁芯損耗近似",
        "tex": "P_{core}\\approx P_{cv}V_e",
        "plain": "Pcore≈Pcv×有效磁芯體積 Ve",
        "why": "需確認資料手冊的損耗密度與體積單位一致。"
      }
    ],
    "worked": {
      "given": "給定某磁材同一溫度與適用區間，假設 Steinmetz 指數 a=1.5、b=2.5，固定 ΔB 與材料係數。",
      "steps": [
        "若 fs 從 50 kHz 加倍到 100 kHz，損耗密度比例約為 2^1.5≈2.83。",
        "若 ΔB 在同一適用區間增加 20%，其他固定，損耗比例約 1.2^2.5≈1.58。",
        "若頻率與 ΔB 都變化，比例約 2.83×1.58≈4.46，並非只增加 2 倍。"
      ],
      "result": "以上只表示相同材料模型下的相對損耗，不是所有鐵氧體通用係數或實測溫升。"
    },
    "assumptions": [
      "a、b 數值只為指定示例，不代表 P.51 左右曲線任意材料的真實參數。",
      "Steinmetz 係數、波形、溫度與數據擬合區間必須查原廠資料；磁芯損耗與繞組熱點須分開量測。"
    ],
    "pitfall": "只檢查 Bsat 就以為不會熱失控，或把 Steinmetz 指數套到所有材質和任意非正弦 PWM。",
    "check": {
      "q": "若同材料適用區間內 a=1.5，頻率加倍而 ΔB 固定，鐵損密度是否只加倍？",
      "a": "不是。假定係數與適用條件固定，密度比例約 2^1.5=2.83，仍須按實際材料曲線確認。"
    },
    "tryIt": "同時對照原講義 P.51 的 B-H 與 Core Loss 曲線，分別找磁通工作區與頻率損耗影響。"
  }

};})(window);
