/* DC-DC middle-volume learning content based on 52 user-provided slides; educational rewrite. */
window.EE_DATA = {
  "version": "2026-10-29",
  "source": "電力電子初級班講義（中）／52 頁",
  "pageCount": 52,
  "progressKey": "ee.middle.done",
  "heroDescription": "中冊聚焦 DC-DC：從 Buck、Boost、導通模式，到雙向電源、H-Bridge、Flyback、Forward 和磁芯設計。依主題自由跳讀，對照原講義頁碼。",
  "indexNote": "中冊共 52 頁：P.1 是封面，P.2–51 為 DC-DC 教材，P.52 是結語。本站用主題重整與自行撰寫的導讀取代逐頁翻投影片；圖像、完整公式及波形請載入本機原講義 PDF 對照。理想公式需先核對 CCM/DCM 與 PWM Duty 定義。",
  "chapters": [
    {
      "id": "mid-basics",
      "number": "01",
      "title": "DC-DC 與 Buck 控制",
      "short": "DC-DC、PWM、LC",
      "range": [
        2,
        6
      ],
      "minutes": 65,
      "icon": "pulse",
      "accent": "#3286D9",
      "subtitle": "看懂能量流、PWM 責任週期、LC 濾波與電感伏秒平衡。",
      "goals": [
        "區分 Buck／Boost／反相 Buck-Boost／Bridge",
        "用伏秒平衡推導 Buck 轉壓比",
        "解釋 Q 值、濾波與切換頻率的取捨"
      ],
      "lab": "mid-buck",
      "lessons": [
        {
          "id": "mid-topologies",
          "title": "四種基本拓樸怎麼分",
          "pages": "2",
          "lead": "不是把電流變成電壓，而是透過開關與儲能元件重新分配電壓、電流。",
          "explain": [
            "Buck 以開關節點、電感與輸出電容降壓；Boost 在開關導通時增加電感電流、關斷時由電感與輸入共同向輸出供能。",
            "講義的傳統 Buck-Boost 是反相型，輸出極性與輸入相反；Bridge 是四開關橋，可控制負載端的正負電壓和雙向電流。",
            "這四種是基本概念，實際隔離與三相應用還會衍生多種橋臂組合。"
          ],
          "formula": "理想 CCM：Buck |Vo/Vin|=D；Boost Vo/Vin=1/(1−D)；反相 Buck-Boost Vo/Vin=−D/(1−D)",
          "example": "Vin=48 V、D=0.25：Buck≈12 V，Boost≈64 V，反相 Buck-Boost≈−16 V。",
          "points": [
            "先辨識電感在哪、開關節點在哪、電流如何續流。",
            "電壓升高不代表功率增加：Pin≈Pout/η。"
          ],
          "trap": "把 6 顆 MOSFET 的三相橋當成只有 4 顆開關的單相 H-Bridge。",
          "quiz": {
            "q": "哪個基本拓樸在講義中會讓輸出極性反轉？",
            "choices": [
              "Buck",
              "Boost",
              "傳統反相 Buck-Boost"
            ],
            "correct": 2,
            "reason": "第 2 頁畫的是反相 Buck-Boost，輸出極性與輸入相反。"
          }
        },
        {
          "id": "mid-buck-pwm",
          "title": "Buck 的 PWM 與電壓負回授",
          "pages": "3",
          "lead": "負載變重、輸出掉壓，回授控制器通常增加 Duty 以拉回目標。",
          "explain": [
            "誤差放大器比較參考電壓 Vref 與分壓回授 Vfb，產生控制電壓 Vcontrol；PWM 比較器再將它與斜坡電壓比較，決定開關導通比例。",
            "在講義的 0 到 V̂st 線性斜坡模型，D=Vcontrol/V̂st。這是 PWM 調變器模型，不是所有 PWM 控制器都直接遵守的公式。",
            "數位電源可以由 ADC 取樣、PI 補償，再更新 C2000 ePWM 比較值；實際方向還需核對比較極性與計數模式。"
          ],
          "formula": "D=ton/Ts；理想 Buck CCM 穩態：Vo=D·Vin",
          "example": "Vin=100 V、D=0.4 時 Vo≈40 V；如果負載讓 Vo 降到 36 V，控制器需要提供更多能量。",
          "points": [
            "先核對 PWM 的輸出極性、Dead Time 和更新事件。",
            "輸出回授的分壓比例、ADC offset 與飽和限幅都會影響控制。"
          ],
          "trap": "看到 Vo 掉壓就以為 Duty 一定會立即增加：補償器、保護及限制可能介入。",
          "quiz": {
            "q": "理想 Buck 的輸出電壓低於目標時，正常負回授會如何調整？",
            "choices": [
              "減少 Duty",
              "增加 Duty",
              "直接提高切換頻率"
            ],
            "correct": 1,
            "reason": "提高 Duty 可以在下一些開關週期中增加供給負載的平均能量。"
          }
        },
        {
          "id": "mid-switching-lc",
          "title": "切換頻率與 LC 低通濾波",
          "pages": "4",
          "lead": "PWM 是方波，LC 讓負載看到接近直流的電壓。",
          "explain": [
            "電感限制電流變化，電容限制電壓瞬變，因此可以抑制開關節點高頻波動。理想 Buck 在相同 Duty 下，切換週期愈短，電感的三角電流漣波通常愈小。",
            "提高 fs 可減少所需 L、C 的體積，但會增加開關事件數量、EMI 與可能的開關損耗；因此頻率不是越高越好。",
            "輕載時有些電源會使用 PFM 或 Burst 降低固定頻率切換成本；抖頻則是分散頻譜峰值，不等於消除 EMI 能量。"
          ],
          "formula": "ΔIL≈(Vin−Vo)·D/(L·fs)（理想 Buck CCM）",
          "example": "Vin=24 V、Vo=12 V、L=100 μH：fs=50 kHz 時 ΔIL≈1.2 A；改 100 kHz 時≈0.6 A。",
          "points": [
            "量測 Ripple 必須確認示波器探棒接地與頻寬限制。",
            "EMI 除 fs 外仍高度受迴路面積、dv/dt 與寄生參數影響。"
          ],
          "trap": "認為把 fs 加倍就一定效率增加；切換損耗可能恰好相反。",
          "quiz": {
            "q": "同樣 L、Vin、Vo，fs 加倍，理想 Buck 的 ΔIL 約變成？",
            "choices": [
              "原本的一半",
              "原本兩倍",
              "沒有影響"
            ],
            "correct": 0,
            "reason": "ΔIL 與 fs 成反比，其他條件固定時頻率加倍，漣波約減半。"
          }
        },
        {
          "id": "mid-resonance",
          "title": "LC 自然諧振頻率、Q 與阻尼",
          "pages": "4–5",
          "lead": "f0 決定自然振盪快慢；Q 決定共振有多尖銳、振鈴衰減得多快。",
          "explain": [
            "理想電感與電容互相交換磁場／電場能量，形成二階系統；電阻消耗能量，造成阻尼。Q 越大，對此模型而言阻尼越弱。",
            "這份講義採串聯電感、並聯電容與電阻負載的理想濾波器：其 H(s) 分母中間項應為 s/(R·C)，而不是 s·L/R。",
            "實際 Buck 暫態還受到 ESR、控制補償器與工作模式影響，不能只看 LC 的 Q。"
          ],
          "formula": "ω0=1/√(LC)；f0=1/(2π√(LC))；Q=R√(C/L)；ζ=1/(2Q)",
          "example": "L=C=100 μ（分別是 100 μH、100 μF）時 f0≈1.59 kHz；L 增成四倍，f0 降成一半。",
          "points": [
            "自然諧振頻率不等於任意 Q 下的 −3 dB 截止頻率。",
            "示波器上看到振鈴要區分 LC、寄生 L/C 與補償迴路。"
          ],
          "trap": "把 Q 高當作電源一定比較好；高 Q 可能表示較大的 overshoot 或 ringing。",
          "quiz": {
            "q": "電感增成原本四倍、電容不變，f0 會？",
            "choices": [
              "變四倍",
              "變兩倍",
              "變成一半"
            ],
            "correct": 2,
            "reason": "f0 與 √L 成反比，因此 L×4 時 f0×1/2。"
          }
        },
        {
          "id": "mid-voltsecond",
          "title": "用伏秒平衡推導 Buck 轉壓比",
          "pages": "6",
          "lead": "週期穩態下，電感電流每個週期淨變化為零。",
          "explain": [
            "電感滿足 vL=L·diL/dt。對整個開關週期積分，如果穩態下 iL(Ts)=iL(0)，則正負電壓對時間的積分相加必為零。",
            "理想 Buck ON 時 vL=Vin−Vo；OFF 續流時 vL≈−Vo。因此 (Vin−Vo)·ton=Vo·toff。",
            "這個工具同樣能推導 Boost、Flyback 的平均轉壓關係；磁化電感不滿足伏秒平衡時，變壓器磁通可能逐週偏移。"
          ],
          "formula": "(Vin−Vo)·D·Ts−Vo·(1−D)·Ts=0 ⇒ Vo=D·Vin",
          "example": "Vin=100 V、Vo=40 V、ton=4 μs、toff=6 μs：正負伏秒分別為 +240、−240 V·μs。",
          "points": [
            "推導前要標明 ON/OFF 電感電壓極性。",
            "伏秒平衡只保證週期電流無淨變化，不代表沒有漣波。"
          ],
          "trap": "把『ON 時電感儲能』誤認為『OFF 時輸出完全沒有電流』。",
          "quiz": {
            "q": "理想 Buck Vin=100 V、Vo=40 V，OFF 時電感電壓為？",
            "choices": [
              "+40 V",
              "−40 V",
              "−60 V"
            ],
            "correct": 1,
            "reason": "OFF 時電感續流，近似 vL=−Vo=−40 V。"
          }
        }
      ]
    },
    {
      "id": "mid-modes",
      "number": "02",
      "title": "CCM、DCM 與 BCM",
      "short": "導通模式與邊界",
      "range": [
        7,
        9
      ],
      "minutes": 40,
      "icon": "wave",
      "accent": "#16A3A7",
      "subtitle": "以電感電流是否降到零，理解控制模式與轉壓比的差異。",
      "goals": [
        "辨識電感電流波形與零電流區段",
        "算出 Buck 的 BCM 臨界負載電流",
        "理解 DCM 為何不能直接套 Vo=D·Vin"
      ],
      "lab": "mid-modes",
      "lessons": [
        {
          "id": "mid-ccm-dcm",
          "title": "CCM 與 DCM：看電感電流，不看 MOSFET",
          "pages": "7",
          "lead": "CCM 和 DCM 的分界，是電感電流在週期內有沒有落到零。",
          "explain": [
            "CCM（Continuous Conduction Mode）：電感電流最低值仍大於零，通常呈連續三角波。DCM（Discontinuous Conduction Mode）：電感能量放盡，電流先落到零，接著有一段零電流時間。",
            "MOSFET 本來就會 ON/OFF，不能因為 MOSFET 斷續開關就叫 DCM；判斷的是電感電流。",
            "兩種模式會改變控制對象、平均模型、負載關係與損耗。某些同步整流設計可允許反向電流，此時要明確定義控制模式。"
          ],
          "formula": "CCM：IL,min>0；BCM：IL,min=0；DCM：IL=0 持續一段時間",
          "example": "若電感平均 2 A、ΔIL=1 A p-p，IL,min=1.5 A，屬 CCM。",
          "points": [
            "先用示波器電流探棒或分流器確認電流波形。",
            "從 CCM 跨入 DCM 時，負載特性與控制小訊號模型可能改變。"
          ],
          "trap": "把平均電感電流很小但仍未降到零的狀態直接判斷成 DCM。",
          "quiz": {
            "q": "哪個條件明確表示傳統非同步 Buck 進入 DCM？",
            "choices": [
              "Duty 小於 50%",
              "每個週期出現一段電感電流為零",
              "輸出電壓下降"
            ],
            "correct": 1,
            "reason": "必須出現零電感電流區段，而不只是 PWM 變窄。"
          }
        },
        {
          "id": "mid-bcm",
          "title": "BCM：連續與不連續的臨界點",
          "pages": "8",
          "lead": "BCM 是電感谷值剛好等於零的邊界。",
          "explain": [
            "在臨界模式，電流剛從零上升至峰值，又恰好在下一周期開始前降回零，平均電流是峰值的一半。",
            "Buck 的電感電流漣波 ΔIL=(Vin−Vo)·D·Ts/L。在 BCM 時 IL,avg=ΔIL/2，而對 Buck 輸出平均電流就是 Io。",
            "因此固定 Vin、L、fs 時，Duty 接近 0.5 的臨界平均電流最大。"
          ],
          "formula": "Io,BCM = ΔIL/2 = Vin·D(1−D)/(2L·fs)（理想 Buck）",
          "example": "Vin=24 V、D=0.5、L=100 μH、fs=100 kHz：ΔIL=0.6 A，Io,BCM=0.3 A。",
          "points": [
            "BCM 不是固定的『幾安培』，它與 Vin、Duty、L、fs 都有關。",
            "電感量受偏磁與溫度改變時，真實分界也會偏移。"
          ],
          "trap": "忽略 L 電流額定或容差，直接以名目 L 計算做精準模式切換。",
          "quiz": {
            "q": "BCM 的電感電流最低值為？",
            "choices": [
              "0 A",
              "平均電流",
              "一定為負"
            ],
            "correct": 0,
            "reason": "BCM 正是 IL,min=0 的邊界。"
          }
        },
        {
          "id": "mid-buck-dcm",
          "title": "Buck 在 DCM 為何轉壓比會變",
          "pages": "9",
          "lead": "進入 DCM 後，Duty 不再單獨決定輸出電壓。",
          "explain": [
            "CCM 中電感 ON 與 OFF 覆蓋整個週期；DCM 則另外出現第三段：電感電流已經是零。",
            "因此 DCM 的電感伏秒平衡應使用 ON 的 DTs 與續流的 Δ1Ts，而不是直接把所有 OFF 時間乘上 −Vo。",
            "輸出電壓同時會受到負載電流、L、fs 的影響；這也是輕載常用不同控制策略的原因。"
          ],
          "formula": "(Vin−Vo)·D·Ts−Vo·Δ1·Ts=0 ⇒ Vo/Vin=D/(D+Δ1)",
          "example": "若 D=0.30、Δ1=0.15，則理想 Vo/Vin=0.30/0.45≈0.667（還需符合負載電流關係）。",
          "points": [
            "先判斷是否真的進入 DCM，才選用對應公式。",
            "同步 Buck 若允許負電流，與非同步 DCM 的零電流區段不同。"
          ],
          "trap": "在 DCM 仍直接用 Vo=D·Vin 計算全部負載條件。",
          "quiz": {
            "q": "DCM Buck 的轉壓比是否只由 Duty 決定？",
            "choices": [
              "是",
              "否，還受負載與 L、fs 影響",
              "只由 fs 決定"
            ],
            "correct": 1,
            "reason": "DCM 多了一段零電流時間，導通區間也受負載條件控制。"
          }
        }
      ]
    },
    {
      "id": "mid-boost",
      "number": "03",
      "title": "Boost 升壓與損耗",
      "short": "Boost、效率與 DCM",
      "range": [
        10,
        22
      ],
      "minutes": 85,
      "icon": "rectifier",
      "accent": "#E19A45",
      "subtitle": "從電感能量、漣波與寄生損耗理解 Boost 為何不是無限升壓。",
      "goals": [
        "用伏秒平衡推導 Boost 的理想增益",
        "估算電感／電容 Ripple 與元件應力",
        "理解高 Duty 時效率反而崩落"
      ],
      "lab": "mid-boost",
      "lessons": [
        {
          "id": "mid-boost-ccm",
          "title": "Boost 的 CCM 能量流與轉壓比",
          "pages": "10",
          "lead": "開關 ON 時電感充能，OFF 時輸入和電感一起向輸出送能量。",
          "explain": [
            "Boost ON 時 MOSFET 把電感右端拉向地，二極體截止，負載主要由輸出電容供電；電感兩端近似 Vin，因此電流上升。",
            "Boost OFF 時電感電流無法瞬斷，推動開關節點電壓升高，使二極體導通，將能量交給輸出。",
            "穩態 CCM 對電感伏秒平衡得 Vin·D+(Vin−Vo)(1−D)=0。"
          ],
          "formula": "Vo/Vin=1/(1−D)；Io/Iin≈(1−D)（理想無損）",
          "example": "Vin=50 V、D=0.5，理想 Vo=100 V；若輸入 2 A，輸出約 1 A，仍為 100 W。",
          "points": [
            "MOSFET、二極體的耐壓與開關過衝不能只用 Vo 名目值選定。",
            "輸出短路時，傳統 Boost 的輸入可能經電感和二極體持續供能，需額外保護設計。"
          ],
          "trap": "『Boost 把電流轉換成電壓』不等於憑空增加能量；輸出電流通常下降。",
          "quiz": {
            "q": "理想 Boost 由 48 V 升到 96 V，需要 Duty 約？",
            "choices": [
              "25%",
              "50%",
              "75%"
            ],
            "correct": 1,
            "reason": "96/48=2=1/(1−D)，因此 D=0.5。"
          }
        },
        {
          "id": "mid-boost-ripple",
          "title": "電感 Ripple 與輸出電容設計",
          "pages": "10",
          "lead": "Boost ON 時輸出由電容支撐，所以 C 的放電時間很關鍵。",
          "explain": [
            "電感的電流變化取決於 ON 時的 Vin、Duty、L 與 fs；理想 Boost 的輸入電感平均電流接近輸入電流。",
            "開關 ON 時二極體截止，輸出電容提供負載電流；因此輸出電壓漣波與 Io·D·Ts/C 相關。",
            "講義的漣波公式忽略 ESR、ESL、脈動 RMS 與控制器暫態，實際電容選型還要看額定溫度和壽命。"
          ],
          "formula": "ΔIL≈Vin·D/(L·fs)；ΔVo≈Io·D/(C·fs)（理想 CCM，小漣波）",
          "example": "Vin=48 V、D=0.5、L=100 μH、fs=100 kHz：ΔIL≈2.4 A p-p。",
          "points": [
            "確認最小 Vin、最大功率時的 IL,peak 與電感飽和電流。",
            "C 的 RMS 漣波電流可能比容量本身更早成為限制。"
          ],
          "trap": "只用 C=Io·D/(fs·ΔVo) 選電容，完全不檢查 ESR 及額定 RMS 電流。",
          "quiz": {
            "q": "同其他條件固定，Boost 電感 L 加倍，理想 ΔIL 約會？",
            "choices": [
              "減半",
              "加倍",
              "不變"
            ],
            "correct": 0,
            "reason": "漣波與 L 成反比。"
          }
        },
        {
          "id": "mid-boost-rl",
          "title": "加入電感銅損的平均等效電路",
          "pages": "11–12",
          "lead": "有串聯電阻的真實 Boost，不可能照理想公式無限制升壓。",
          "explain": [
            "電感線圈電阻 RL 會隨 Iin 產生 I²RL 損耗；在高增益、高 Duty 下平均輸入電流變大，銅損更明顯。",
            "講義使用穩態平均模型與類比理想變壓器，將 D′=1−D 與 RL 引入輸出端等效電阻，方便計算增益與效率。",
            "這裡只考慮 RL，尚未包括 MOSFET RDS(on)、二極體壓降與開關損。"
          ],
          "formula": "Vo/Vin = [1/(1−D)] / [1+RL/((1−D)²·R)]",
          "example": "D=0.8、RL=0.2 Ω、R=20 Ω：理想增益 5 倍；此 RL 模型增益≈4 倍。",
          "points": [
            "RL 需要在工作溫度下估算，銅阻會隨溫度上升。",
            "模型是理想化穩態平均值，無法預測開關瞬間過衝。"
          ],
          "trap": "只比較理想增益 1/(1−D)，忽略高 Duty 下電流應力。",
          "quiz": {
            "q": "RL 不為零時，把 Duty 推近 100% 會怎樣？",
            "choices": [
              "電壓無限上升",
              "銅損限制增益，甚至掉壓",
              "完全沒有影響"
            ],
            "correct": 1,
            "reason": "等效串聯損耗在大 Duty、高電流條件會顯著降低有效增益。"
          }
        },
        {
          "id": "mid-boost-efficiency",
          "title": "輸出電壓與效率對 Duty 的曲線",
          "pages": "13–14",
          "lead": "理想公式 Duty 越大增益越高，但實際可能先達峰值再跌落。",
          "explain": [
            "講義的增益曲線顯示：當 RL/R 不為零，隨著 Duty 增大，增益會到達峰值，之後反而下降。",
            "效率 η=Po/Pin，在只考慮 RL 的模型中等於 1/[1+RL/(D′²R)]；D′ 變小，效率急劇下降。",
            "高 Duty 的高 RMS 電流、MOSFET 開關損與二極體損耗會進一步限制產品可用範圍。"
          ],
          "formula": "η≈1 / [1 + RL/((1−D)²·R)]（僅含電感銅損）",
          "example": "RL/R=0.02、D=0.8：η≈1/(1+0.02/0.04)=66.7%（銅損模型）。",
          "points": [
            "效率需以實際 Pin、Po 與溫升量測驗證。",
            "PFC 或 Boost 產品不應以 D=100% 為可用升壓狀態。"
          ],
          "trap": "把 η 模型誤當成整台電源的完整效率預測。",
          "quiz": {
            "q": "以講義的 RL 模型，D 接近 1 時效率趨勢為？",
            "choices": [
              "趨近 100%",
              "趨近 0%",
              "永遠 50%"
            ],
            "correct": 1,
            "reason": "因 D′²R 趨近零，RL/(D′²R) 趨近很大，效率下降。"
          }
        },
        {
          "id": "mid-boost-parasitic",
          "title": "MOSFET、二極體與 Ripple 的損耗",
          "pages": "15–20",
          "lead": "平均模型可快速估算，但電流波形的 RMS 也很重要。",
          "explain": [
            "講義把 RL、MOSFET RDS(on)、二極體正向壓降 VD 與二極體動態電阻 RD 放入導通期間的等效模型。",
            "MOSFET 的導通損耗要用 I²R，若電感 Ripple 很大，RMS 電流就高於只用平均電流估的值；第 20 頁專門比較不同 Ripple 下平均模型的誤差。",
            "開關損耗、二極體恢復損耗、Coss、Gate drive 與寄生感抗等仍需另列，不能將講義等效式視為總損耗。"
          ],
          "formula": "Pcond,MOS≈I²rms,MOS·RDS(on)；Pdiode≈VD·Iavg,D（粗估）",
          "example": "MOSFET I_rms=8 A，RDS(on)=40 mΩ，導通損耗約 2.56 W（未計溫度）。",
          "points": [
            "使用電流 RMS 而非只用平均值估 I²R。",
            "有大電流漣波或高頻切換時，應核對 RMS、Qrr 和熱設計。"
          ],
          "trap": "電流 Ripple 很大時仍直接以平均電流平方預估開關損耗。",
          "quiz": {
            "q": "同一電阻下，RMS 電流變兩倍，導通損耗約？",
            "choices": [
              "變兩倍",
              "變四倍",
              "不變"
            ],
            "correct": 1,
            "reason": "Pcond=I²rmsR，因此電流兩倍，損耗四倍。"
          }
        },
        {
          "id": "mid-boost-dcm",
          "title": "Boost 的 BCM 與 DCM",
          "pages": "21–22",
          "lead": "當負載太輕，Boost 的電感電流可能在 OFF 階段先降到零。",
          "explain": [
            "Boost BCM 的電感電流谷值剛好到零；在 DCM，OFF 導通二極體的一段時間後電感電流變成零，剩下第三個區段。",
            "講義第 21 頁針對固定 Vo 推導臨界電感／輸出電流與 Duty 的曲線；第 22 頁將零電流區段納入 DCM 伏秒關係。",
            "DCM 的轉壓比不再只由 D 決定，也會隨負載與 L、fs 改變。"
          ],
          "formula": "DCM：Vin·D·Ts + (Vin−Vo)·Δ1·Ts=0 ⇒ Vo/Vin=(D+Δ1)/Δ1",
          "example": "當 D=0.3、Δ1=0.2，Vo/Vin=2.5；這只是該 DCM 區段關係，仍需配合平均負載方程。",
          "points": [
            "量測時要注意二極體恢復與寄生振鈴可能模糊真正的零電流點。",
            "CCM/BCM/DCM 控制器不能未經確認直接共用同一控制小訊號模型。"
          ],
          "trap": "套用 CCM 的 Vo=Vin/(1−D) 算所有 DCM 工作點。",
          "quiz": {
            "q": "Boost DCM 中會多出哪一段？",
            "choices": [
              "電感電流歸零的區段",
              "MOSFET 永久導通",
              "輸出電容永久斷路"
            ],
            "correct": 0,
            "reason": "DCM 的定義是週期內出現電感電流為零的第三段。"
          }
        }
      ]
    },
    {
      "id": "mid-buckboost",
      "number": "04",
      "title": "Buck-Boost 與雙向 DC-DC",
      "short": "升降壓與雙向能量",
      "range": [
        23,
        28
      ],
      "minutes": 65,
      "icon": "triphase",
      "accent": "#9368DE",
      "subtitle": "理解反相升降壓、Ćuk／SEPIC／ZETA 與四開關雙向轉換。",
      "goals": [
        "區分反相型和非反相型 Buck-Boost",
        "認識 4-switch Buck-Boost 的雙橋臂",
        "用電壓、電流符號判斷功率方向"
      ],
      "lab": "mid-buckboost",
      "lessons": [
        {
          "id": "mid-buckboost-ccm",
          "title": "傳統反相 Buck-Boost 的 CCM",
          "pages": "23",
          "lead": "一顆電感先儲能、再向負極性輸出釋能。",
          "explain": [
            "在傳統反相 Buck-Boost，開關 ON 時電感由輸入充能，輸出電容供應負載；OFF 時電感經二極體把能量交給輸出。",
            "講義以 Vo 的幅值推導 |Vo|/Vin=D/(1−D)；若用與輸入共地的有號輸出電壓表示，應加負號。",
            "負載的輸出電流並不是全週期都流經電感；輸出電容必須承受電流脈動。"
          ],
          "formula": "Vo/Vin=−D/(1−D)（反相有號值，理想 CCM）",
          "example": "Vin=24 V，D=0.25 得 Vo≈−8 V；D=0.75 得 Vo≈−72 V。",
          "points": [
            "先核對輸出正負端與控制板地參考，避免量測短路。",
            "驗證開關、二極體耐壓應考慮 Vin+|Vo| 與過衝。"
          ],
          "trap": "把講義的輸出幅值公式直接當成不反相正輸出。",
          "quiz": {
            "q": "傳統反相 Buck-Boost 在 D=0.5 時，Vo 為？",
            "choices": [
              "等於 +Vin",
              "等於 −Vin",
              "等於 0 V"
            ],
            "correct": 1,
            "reason": "增益絕對值為 1，但輸出相對輸入參考地反相。"
          }
        },
        {
          "id": "mid-buckboost-dcm",
          "title": "Buck-Boost 的臨界模式與 DCM",
          "pages": "24–25",
          "lead": "當電感一週期內放能到零，轉壓比也受到負載影響。",
          "explain": [
            "在 BCM，電感電流剛好從零開始上升、再降回零；平均輸出電流只存在釋能階段。",
            "進入 DCM 後，除了導通 D 與放能 Δ1，還有零電流階段。針對同一拓樸，伏秒關係成為 Vin·D·Ts=|Vo|·Δ1·Ts。",
            "DCM 下的 Duty 解需要把 Io、L、fs、Vin 與 |Vo| 一起帶入，不能只靠理想 CCM 增益。"
          ],
          "formula": "|Vo|/Vin=D/Δ1（DCM）；BCM：IoB=Ts·|Vo|·(1−D)²/(2L)",
          "example": "若 Vin=20 V、D=0.25、Δ1=0.5，理想 DCM |Vo|≈10 V。",
          "points": [
            "規劃控制時要辨識 DCM 與是否同步整流。",
            "電感峰值與 MOSFET 電流能力不可只看輸出電流。"
          ],
          "trap": "將 DCM 與 CCM 共用同一個固定轉壓比。",
          "quiz": {
            "q": "反相 Buck-Boost DCM 的放電區間是？",
            "choices": [
              "整個 (1−D)Ts",
              "Δ1Ts，可能小於 (1−D)Ts",
              "永遠沒有放電"
            ],
            "correct": 1,
            "reason": "電感電流降到零後，剩餘 OFF 時間屬於零電流區段。"
          }
        },
        {
          "id": "mid-sepic-zeta",
          "title": "Ćuk、SEPIC、ZETA 與四開關拓樸",
          "pages": "26",
          "lead": "升降壓不是只能用一顆開關、一顆電感的反相結構。",
          "explain": [
            "講義第 26 頁列出 Conventional（反相）、Ćuk、SEPIC、ZETA 及 Bridge。它們的儲能、耦合電容與輸出極性不同。",
            "SEPIC 與 ZETA 能做非反相升降壓；Ćuk 的典型結構是反相輸出，並用能量轉移電容傳能。",
            "哪個適合產品，還得看輸入電流連續性、輸出電流、效率、元件電壓電流應力與 EMI。"
          ],
          "formula": "理想 CCM：Ćuk 典型型式 Vo/Vin=−D/(1−D)；SEPIC/ZETA Vo/Vin≈D/(1−D)",
          "example": "Vin=12 V、D=0.4 的理想 SEPIC，Vo≈8 V；當 D 超過 0.5 時可升壓。",
          "points": [
            "不要只依升降壓功能選拓樸，還須看輸出極性與輸入源特性。",
            "耦合電容的 RMS 電流與耐壓是必要設計項目。"
          ],
          "trap": "把所有 Buck-Boost 拓樸都看成反相輸出或只差 MOSFET 顆數。",
          "quiz": {
            "q": "典型 SEPIC 的輸出極性相對輸入是？",
            "choices": [
              "非反相",
              "必然反相",
              "完全由開關頻率決定"
            ],
            "correct": 0,
            "reason": "SEPIC 可提供非反相的升降壓輸出。"
          }
        },
        {
          "id": "mid-four-switch",
          "title": "四開關 Buck-Boost 的橋臂與控制",
          "pages": "27",
          "lead": "左邊 Buck-arm、右邊 Boost-arm，中間用電感連接。",
          "explain": [
            "四個 MOSFET 分成兩組半橋，一組接輸入、另一組接輸出，兩個橋臂的中點以電感相接。",
            "在降壓模式，Buck-arm 做 PWM、Boost-arm 通常維持適當固定導通狀態；在升壓模式則相反。輸入與輸出接近時可能使用混合模式，具體取決於控制器策略。",
            "講義以兩組三角波與 Vcontrol 的比較波形示意橋臂時序，實際驅動需具備 Dead Time 及 Shoot-through 防護。"
          ],
          "formula": "vL = vSW,buck − vSW,boost；平均穩態〈vL〉=0",
          "example": "Vin=24 V、Vo=12 V 可以採降壓控制；Vin=12 V、Vo=24 V 採升壓控制。",
          "points": [
            "每個橋臂上、下管不可同時導通。",
            "切模式時要有電流方向與電壓條件的 transition protection。"
          ],
          "trap": "把它當成單相 H-Bridge 馬達驅動：拓樸相似，但輸入、輸出、電感位置與控制目標不同。",
          "quiz": {
            "q": "四開關 Buck-Boost 中間的電感接在哪？",
            "choices": [
              "輸入與地之間",
              "兩組半橋的中點之間",
              "直接跨接輸出電容"
            ],
            "correct": 1,
            "reason": "兩組半橋中點之間的電感是能量轉換的核心。"
          }
        },
        {
          "id": "mid-bidirectional",
          "title": "雙向 Buck-Boost 的能量方向",
          "pages": "28",
          "lead": "同一組功率開關可在允許的控制下改變電流方向，做到充電與回送。",
          "explain": [
            "講義把電力方向畫成雙箭頭，表示四開關拓樸可支援由左向右、或由右向左傳輸功率。",
            "電壓極性不一定改變，能量方向主要看電流參考方向與瞬時功率 p=v·i 的符號。",
            "要實現安全雙向，控制器需管理預充電、輸入輸出 OV/UV、電流符號、同步整流、零電流交越和故障停機。"
          ],
          "formula": "P=V·I；在固定被動符號約定下，P<0 代表該端送出能量",
          "example": "電池 48 V、充電 +5 A（流入電池正端）→ 電池吸收 240 W；電流 −5 A → 電池送出約 240 W。",
          "points": [
            "雙向應用必須明定電流正負與能量 owner。",
            "保護要同時涵蓋 charge/discharge 的最壞條件。"
          ],
          "trap": "把電壓仍為正就認定功率只能正向流動。",
          "quiz": {
            "q": "電池端固定 +48 V，電流從正端流出，對電池而言功率符號為？",
            "choices": [
              "吸收正功率",
              "釋出負功率",
              "一定為零"
            ],
            "correct": 1,
            "reason": "以電流流入電池正端為正方向時，放電電流為負，p=vi<0。"
          }
        }
      ]
    },
    {
      "id": "mid-bridge",
      "number": "05",
      "title": "H-Bridge 與 PWM 四象限",
      "short": "全橋、四象限 PWM",
      "range": [
        29,
        32
      ],
      "minutes": 45,
      "icon": "signal",
      "accent": "#DB6B62",
      "subtitle": "看懂全橋輸出正負電壓、馬達功率流、雙極性與單極性 PWM。",
      "goals": [
        "用兩組橋臂描述 H-Bridge 的三種輸出電平",
        "區分 Bipolar 與 Unipolar PWM 波形",
        "了解四象限驅動與防止直通"
      ],
      "lab": "mid-bridge",
      "lessons": [
        {
          "id": "mid-quadrants",
          "title": "H-Bridge 的四象限是什麼",
          "pages": "29",
          "lead": "四象限是輸出電壓正負與輸出電流正負的四種組合。",
          "explain": [
            "單相 H-Bridge 由四個功率開關組成兩個橋臂，負載接在兩個橋臂中點之間；兩端電壓差可以為正、負或零。",
            "若電壓與電流都用被動符號約定，正功率代表負載吸收能量，負功率代表負載回送能量。",
            "DC 馬達可以正反轉與再生煞車；但四象限能力仍取決於負載、驅動器及 DC Bus 是否能吸收回送能量。"
          ],
          "formula": "VAB=VA−VB；Pload=VAB·IAB",
          "example": "VAB=+100 V，IAB=−2 A，負載功率=−200 W，表示此刻向 DC Bus 回送能量。",
          "points": [
            "再生能量需要 DC Bus 有可吸收路徑或煞車電阻。",
            "死區與高低側保護是四象限控制的前提。"
          ],
          "trap": "認為四象限就是輸出有 4 個不同電壓值；其實是電壓與電流符號組合。",
          "quiz": {
            "q": "VAB>0、IAB<0 的負載功率為？",
            "choices": [
              "正功率",
              "負功率",
              "無法判斷"
            ],
            "correct": 1,
            "reason": "兩者相乘為負，負載對外送出能量。"
          }
        },
        {
          "id": "mid-motor-hbridge",
          "title": "直流馬達模型與 PWM 平均電壓",
          "pages": "30",
          "lead": "馬達不是純電阻，電樞電感與反電勢共同決定電流。",
          "explain": [
            "講義以電樞電阻 Ra、電感 La、反電勢 ea 建立 DC 馬達模型：La·dia/dt+Ra·ia=vAB−ea。",
            "H-Bridge 的兩個開關函數 SA、SB 決定輸出電壓 vAB=(SA−SB)Vdc。",
            "不論 Bipolar 或 Unipolar，在講義選定的調變條件下，平均輸出電壓可由控制量映射；但切換瞬間與電流 Ripple 不相同。"
          ],
          "formula": "La·dia/dt+Ra·ia=vAB−ea；vAB=(SA−SB)Vdc",
          "example": "Vdc=100 V，SA=1、SB=0 時，vAB=+100 V；交換後變 −100 V。",
          "points": [
            "看電流時務必記住馬達電樞有 L 與反電勢。",
            "橋臂中點 PWM 波形與馬達兩端差動電壓不是同一個訊號。"
          ],
          "trap": "只量一個橋臂對地，就當成馬達兩端電壓。",
          "quiz": {
            "q": "馬達兩端電壓 vAB 應量什麼？",
            "choices": [
              "VA 對地",
              "VB 對地",
              "VA−VB 差動電壓"
            ],
            "correct": 2,
            "reason": "負載跨接兩個橋臂中點，應以兩端電位差判讀。"
          }
        },
        {
          "id": "mid-bipolar",
          "title": "Bipolar PWM：輸出在 +Vdc 與 −Vdc 間切換",
          "pages": "31",
          "lead": "兩組橋臂互補時，負載電壓是雙極性切換。",
          "explain": [
            "Bipolar PWM 的兩個橋臂常以互補狀態切換：當一個中點高、另一個低時，vAB=+Vdc；交換則是 −Vdc。",
            "輸出每個切換週期都在兩個極性間跳變，電感電流 Ripple、切換損及 EMI 會受到電壓階躍幅度影響。",
            "即使平均輸出電壓接近 0，瞬時差動電壓仍可能在 ±Vdc 間切換。"
          ],
          "formula": "vAB∈{+Vdc,−Vdc}（理想 Bipolar 模型）",
          "example": "Vdc=100 V，正負各占一半週期時，平均輸出 0 V，但瞬時仍是 ±100 V。",
          "points": [
            "橋臂互補需要加入 Dead Time，不可將邏輯反相直接視作安全驅動。",
            "功率方向仍由電流符號決定，不能只看 PWM 電壓極性。"
          ],
          "trap": "看到平均輸出 0 V 就以為 MOSFET 完全停止切換。",
          "quiz": {
            "q": "Bipolar PWM 在平均輸出 0 V 時，理想瞬時 vAB 仍可能是？",
            "choices": [
              "固定 0 V",
              "在 +Vdc 與 −Vdc 間切換",
              "固定 +Vdc"
            ],
            "correct": 1,
            "reason": "正負脈波時間相等時平均值是 0，但瞬時不是 0。"
          }
        },
        {
          "id": "mid-unipolar",
          "title": "Unipolar PWM 與 Dead Time",
          "pages": "32",
          "lead": "單極性調變讓差動輸出包含零電壓狀態。",
          "explain": [
            "Unipolar PWM 對兩組橋臂使用相反參考訊號，當目標平均電壓為正時，vAB 通常在 0 與 +Vdc 間切換；目標為負則在 0 與 −Vdc 間切換。",
            "與 Bipolar 相比，差動電壓每次跳變幅度可較小，且有效差動切換頻率可提高，通常有利於輸出電流漣波，但仍取決於驅動與控制細節。",
            "實際 H-Bridge 必須有 Dead Time；如果控制器過短或上、下管同時導通，會造成 DC Bus Shoot-through。"
          ],
          "formula": "Unipolar：vAB∈{−Vdc,0,+Vdc}；Dead Time 是避免同臂上下管直通的空檔",
          "example": "Vdc=100 V，正向操作時可在 0/+100 V 之間 PWM；平均值 40 V 並不表示峰值只有 40 V。",
          "points": [
            "Dead Time 過短有直通風險；過長會帶來輸出誤差與死區失真。",
            "以示波器同時量兩管 Gate 和 VDS，驗證真正硬體時序。"
          ],
          "trap": "認為『三態輸出』代表同一瞬間允許上下 MOSFET 同時 ON。",
          "quiz": {
            "q": "Unipolar PWM 理想差動輸出多了哪個狀態？",
            "choices": [
              "只有 +Vdc",
              "0 V",
              "只有 −Vdc"
            ],
            "correct": 1,
            "reason": "Unipolar 調變可在差動輸出形成零電壓狀態。"
          }
        }
      ]
    },
    {
      "id": "mid-flyback",
      "number": "06",
      "title": "隔離式電源與 Flyback",
      "short": "隔離回授、Flyback",
      "range": [
        33,
        40
      ],
      "minutes": 70,
      "icon": "magnet",
      "accent": "#2B9F78",
      "subtitle": "理解隔離邊界、變壓器耦合、Flyback 的 CCM/DCM 與元件應力。",
      "goals": [
        "分清主電路隔離與控制訊號跨隔離",
        "用磁化電感的伏秒平衡推導 Flyback 增益",
        "估算 DCM 儲能與 MOSFET 耐壓"
      ],
      "lab": "mid-flyback",
      "lessons": [
        {
          "id": "mid-isolated-types",
          "title": "隔離式 DC-DC 的五種基本型態",
          "pages": "33",
          "lead": "隔離式不是只加變壓器：能量傳遞時序也跟拓樸有關。",
          "explain": [
            "講義列出 Flyback（Buck-Boost 衍生）、Forward、Push-Pull、Full-Bridge，以及 Current-fed（Boost 衍生）轉換器。",
            "Flyback 主要依磁化電感先儲能後釋能；Forward 等多種拓樸則在開關導通時透過變壓器將能量傳到二次側，輸出電感再濾波。",
            "不同拓樸的磁通復位、開關壓力、功率範圍和整流方式不同，不能只用 MOSFET 數量分類。"
          ],
          "formula": "變壓器理想電壓比 Vs/Vp=Ns/Np；實際電能流另由拓樸時序決定",
          "example": "Np:Ns=2:1 且一次側施加 100 V 的理想變壓器，瞬時二次側電壓幅值約 50 V。",
          "points": [
            "隔離要核對爬電距離、電氣間隙、耐壓與安規；不能只靠原理圖上有變壓器。",
            "同一圖可能把磁化電感與漏感省略，應回到等效模型。"
          ],
          "trap": "把 Flyback 當成理想變壓器每次 ON 就直接供給二次側。",
          "quiz": {
            "q": "Flyback 與 Forward 最大的能量流差異是？",
            "choices": [
              "Flyback 先儲能再釋能",
              "Forward 沒有變壓器",
              "兩者完全相同"
            ],
            "correct": 0,
            "reason": "Flyback 主要在 OFF 時把先前儲存在磁化電感的能量交給二次側。"
          }
        },
        {
          "id": "mid-isolation-feedback",
          "title": "隔離式回授：脈衝變壓器與光耦",
          "pages": "34–35",
          "lead": "主功率路徑與控制訊號跨越隔離邊界，是兩個需要處理的問題。",
          "explain": [
            "講義第 34 頁用 Pulse Transformer 示意控制器與 PWM 在二次側時，如何把驅動訊號隔離送回一次側。",
            "第 35 頁展示另一種架構：誤差訊號在二次側處理，透過光耦回到一次側 PWM 控制器。",
            "實務還有數位隔離器、隔離驅動器及初級側調節方法；選型需兼顧延遲、頻寬、共模暫態抗擾與安全規格。"
          ],
          "formula": "隔離鏈：輸出感測 → 誤差控制 →（光耦或隔離傳輸）→ 一次側 PWM",
          "example": "一次側 400 V Bus、二次側 12 V 輸出：若以光耦回授，12 V 側訊號可穿越隔離邊界但不直接導通。",
          "points": [
            "隔離元件要查 CMTI、耐壓和壽命規格。",
            "控制器在哪一側，決定 PWM、驅動與量測訊號需要怎麼跨隔離。"
          ],
          "trap": "以為光耦把功率能量送到二次側；它主要傳遞回授訊號。",
          "quiz": {
            "q": "光耦在講義第 35 頁主要承擔什麼角色？",
            "choices": [
              "主功率能量傳遞",
              "回授訊號跨隔離",
              "輸出整流"
            ],
            "correct": 1,
            "reason": "主功率經高頻變壓器，光耦負責回授訊號傳遞。"
          }
        },
        {
          "id": "mid-multi-output",
          "title": "單一變壓器供多組隔離輸出",
          "pages": "36",
          "lead": "多組次級繞組可以有多組電壓，但通常不能同樣精準穩壓。",
          "explain": [
            "講義畫出多組二次側線圈與整流濾波，每組可提供不同輸出電壓。",
            "若只量測其中一路來閉迴路調整，其餘未直接回授的輸出受交叉負載調節（Cross Regulation）、繞組耦合及整流壓降影響。",
            "要求多路精準輸出時，可在次級增加 LDO、Buck 或其他後級調節。"
          ],
          "formula": "理想次級電壓比 V2/V1≈N2/N1；實際 DC 輸出還取決於整流與負載",
          "example": "一顆高頻變壓器可有 12 V、5 V、−12 V 繞組；若只回授 12 V，其餘不保證同樣穩。",
          "points": [
            "啟動、空載、單路滿載等交叉調節需分別測試。",
            "不要拿匝數比直接當成多路負載下的精準電壓。"
          ],
          "trap": "一組輸出穩壓正常，就假設所有副輸出都在規格內。",
          "quiz": {
            "q": "只以 Vout1 作回授，Vout2 一定同樣穩壓嗎？",
            "choices": [
              "是",
              "否，可能需要次級後級調節",
              "只要 MOSFET 很大就會"
            ],
            "correct": 1,
            "reason": "其他次級受交叉調節影響，未必達到同樣精度。"
          }
        },
        {
          "id": "mid-flyback-ccm",
          "title": "Flyback CCM 的 ON／OFF 與轉壓比",
          "pages": "37–38",
          "lead": "Flyback 的能量先儲存在磁化電感，再交給二次側。",
          "explain": [
            "MOSFET ON 時，一次側磁化電流上升，因繞組極性使輸出二極體截止，負載由 Co 提供。",
            "MOSFET OFF 時磁化電流向二次側反射，整流二極體導通，磁芯儲存的能量釋放到輸出。",
            "穩態磁化電感伏秒平衡：Vin·ton=(Np/Ns)·Vo·toff，忽略壓降與漏感。"
          ],
          "formula": "Vo/Vin=(Ns/Np)·D/(1−D)（理想 Flyback CCM）",
          "example": "Vin=100 V、Np:Ns=2:1、D=0.4：Vo≈33.3 V。",
          "points": [
            "MOSFET 關斷時 VDS≈Vin+(Np/Ns)Vo，額外漏感尖峰需 Clamp/Snubber。",
            "電流波形與磁芯 B-H 工作點都需要核對避免飽和。"
          ],
          "trap": "把 Flyback 當成 ON 時二次側直接充電的 Forward 電路。",
          "quiz": {
            "q": "理想 Flyback 主要在何時對二次側送能？",
            "choices": [
              "MOSFET ON",
              "MOSFET OFF",
              "整個週期完全相同"
            ],
            "correct": 1,
            "reason": "Flyback 的磁化能量通常在開關 OFF 期間經二次側釋放。"
          }
        },
        {
          "id": "mid-flyback-dcm",
          "title": "Flyback DCM、峰值電流與設計限制",
          "pages": "39–40",
          "lead": "DCM 的磁化電流在每週期釋放到零，可以由每週期能量估算輸出。",
          "explain": [
            "在 DCM，Flyback 有 ON 儲能、OFF 放能、電流歸零後的空白三段；電壓轉換增益與負載、磁化電感 Lm、fs 都有關。",
            "講義第 40 頁為方便計算假設效率 η=80%，採能量平衡 Pin≈(1/2)Lm·Ip²·fs、Po≈η·Pin。",
            "設計必須檢查 MOSFET VDS、二極體反壓、一次／二次 RMS、磁芯飽和、Clamp、EMI 和電容 ESR，不能只求出匝數比。"
          ],
          "formula": "Ip≈Vin·D/(Lm·fs)；Po≈η·(1/2)·Lm·Ip²·fs（理想 DCM 能量近似）",
          "example": "Lm=200 μH、Ip=2 A、fs=50 kHz、η=0.8：Po≈16 W（未含更多寄生效應）。",
          "points": [
            "確認能量在下個週期開始前確實釋放完，才使用 DCM 模型。",
            "Clamp 電路需涵蓋漏感能量，MOSFET 額定 VDS 不只看反射電壓。"
          ],
          "trap": "講義用 80% 效率計算就認為實際機器一定會有 80% 效率。",
          "quiz": {
            "q": "Flyback DCM 每週期儲能近似是多少？",
            "choices": [
              "½·Lm·Ip²",
              "Lm·Ip",
              "Vin×Ip 永遠固定"
            ],
            "correct": 0,
            "reason": "電感儲存的磁場能量為 ½LI²。"
          }
        }
      ]
    },
    {
      "id": "mid-magnetic",
      "number": "07",
      "title": "Forward、橋式與磁芯設計",
      "short": "Forward、橋式、磁材",
      "range": [
        41,
        51
      ],
      "minutes": 90,
      "icon": "chip",
      "accent": "#4962B0",
      "subtitle": "從去磁與雙向激磁，延伸到半橋、全橋、Push-Pull 和鐵損。",
      "goals": [
        "理解 Forward 為什麼需要去磁通路",
        "分辨半橋／全橋／Push-Pull 的開關應力",
        "把 ΔB、fs 與磁芯損耗連在一起"
      ],
      "lab": "mid-core",
      "lessons": [
        {
          "id": "mid-forward-reset",
          "title": "Forward 為什麼一定要去磁",
          "pages": "41–42",
          "lead": "Forward 在 ON 期間就向二次側送能，但磁化電感也累積磁通。",
          "explain": [
            "Forward 的次級整流後接輸出電感與電容，平均轉換關係類似 Buck 加變壓器匝數比。",
            "如果一次側每個週期的磁化電感沒有反向伏秒去磁，磁通會逐週偏移，最後導致磁芯飽和。",
            "講義第 42 頁展示第三繞組 N3 與二極體 D3 的復位方法；Dmax 受去磁繞組匝數比限制。"
          ],
          "formula": "Vo/Vin≈(Ns/Np)·D（理想 Forward CCM）；Dmax=1/(1+N3/Np)（該復位架構）",
          "example": "N3=Np 時，復位所需時間與 ON 時間對應，理想 Dmax≤0.5。",
          "points": [
            "去磁繞組和 Clamp 的極性必須核對，磁通重置是硬體安全條件。",
            "MOSFET 關斷耐壓要加上去磁反射電壓與寄生尖峰。"
          ],
          "trap": "把 Forward 當成 Flyback：Forward 不是主要靠 OFF 時磁化能量供電。",
          "quiz": {
            "q": "為何 Forward 需要復位／去磁？",
            "choices": [
              "降低電感成本",
              "避免磁通逐週累積使磁芯飽和",
              "讓輸出頻率變 50 Hz"
            ],
            "correct": 1,
            "reason": "若不平衡一次側正負伏秒，磁通可能持續偏移而飽和。"
          }
        },
        {
          "id": "mid-double-forward",
          "title": "雙開關 Forward（Double-Ended Forward）",
          "pages": "43",
          "lead": "兩顆主開關同時導通、同時關斷，藉回收二極體復位磁通。",
          "explain": [
            "講義的雙開關 Forward 在 ON 時兩顆 MOSFET 同時導通，將 Vin 施於一次側；OFF 時利用兩顆二極體將磁化與漏感能量回送輸入端。",
            "相較單開關第三繞組去磁，此拓樸可將開關電壓理想夾在 Vin 左右，且在該復位方式下去磁時間約等於 ON 時間。",
            "實際仍有寄生與瞬態過衝，選 MOSFET 額定值不能直接等於 Vin。"
          ],
          "formula": "理想電壓應力：Vswitch,max≈Vin,max；典型 Dmax≤0.5",
          "example": "若 Vin=400 V，開關理想阻斷電壓約 400 V，實際還要設安全裕度。",
          "points": [
            "二極體路徑需能可靠回收磁化能量。",
            "兩顆主開關 Gate 必須在合法時序下同步動作。"
          ],
          "trap": "把『理想夾位約 Vin』誤解成不用考慮任何寄生尖峰。",
          "quiz": {
            "q": "雙開關 Forward 的一次側復位能量主要流向？",
            "choices": [
              "直接消失",
              "透過二極體回到輸入 Bus",
              "永久留在磁芯"
            ],
            "correct": 1,
            "reason": "講義的 D1/D2 在關斷時提供去磁能量回流路徑。"
          }
        },
        {
          "id": "mid-half-full",
          "title": "隔離式半橋與全橋 DC-DC",
          "pages": "44–45",
          "lead": "半橋以約 Vin/2 驅動一次側，全橋可把約 Vin 加到一次側。",
          "explain": [
            "隔離式半橋的兩個 MOSFET 與分壓電容中點配合，使變壓器一次側獲得交替正負電壓，幅值近似 Vin/2。",
            "全橋使用四個 MOSFET，對角開關導通可在一次側施加 +Vin 或 −Vin，具有較高電壓利用率。",
            "講義列的理想轉壓比使用單脈衝 Duty D 定義（每半週一個脈衝），因此要小心 D 的定義不同於整週有效 Duty。"
          ],
          "formula": "講義定義 0<D<0.5：半橋 Vo/Vin≈(Ns/Np)·D；全橋 Vo/Vin≈2·(Ns/Np)·D",
          "example": "相同 Vin、匝數與 D 定義下，全橋輸出可約為半橋兩倍（理想情況）。",
          "points": [
            "全橋上下管死區、變壓器偏磁、漏感與整流應力都需實測。",
            "PSFB 的相移控制不等於這份講義此處固定 Duty PWM 的全部內容。"
          ],
          "trap": "直接拿另一篇資料的 0–100% Duty 定義，套用講義的 2D 公式。",
          "quiz": {
            "q": "以講義的 Duty 定義，全橋一次側電壓幅值近似？",
            "choices": [
              "Vin/2",
              "Vin",
              "2Vin"
            ],
            "correct": 1,
            "reason": "全橋對角導通時一次側承受的電壓幅值約等於 DC Bus。"
          }
        },
        {
          "id": "mid-pushpull",
          "title": "Push-Pull 與電流源型推挽",
          "pages": "46–47",
          "lead": "Push-Pull 兩顆開關交替激磁；Current-fed 類型則在輸入加電感。",
          "explain": [
            "一般電壓源型 Push-Pull 使用中心抽頭一次繞組，兩個 MOSFET 交替導通，形成雙向磁化；其理想開關電壓應力常接近 2Vin。",
            "第 47 頁的電流源型 Push-Pull 由 Boost 概念衍生，輸入加電感，兩開關存在重疊導通區段（講義 D>0.5 的定義）。",
            "兩種看似都是兩顆開關、中心抽頭變壓器，但儲能位置、控制與故障機制不同。"
          ],
          "formula": "電壓源 Push-Pull：Vswitch,max≈2Vin,max（理想）；電流源型需另用講義 P.47 模型",
          "example": "Vin=100 V 的電壓源型 Push-Pull，關斷 MOSFET 理想可能要承受約 200 V。",
          "points": [
            "要避免兩半週脈寬不對稱造成磁通不平衡。",
            "電流源型輸入電感與開路/關斷保護不可沿用電壓源型做法。"
          ],
          "trap": "只因都是 2 MOSFET 就認為 Forward、半橋與 Push-Pull 能共用 Gate 時序。",
          "quiz": {
            "q": "傳統電壓源 Push-Pull 的 MOSFET 理想耐壓應力約？",
            "choices": [
              "Vin/2",
              "Vin",
              "2Vin"
            ],
            "correct": 2,
            "reason": "中心抽頭一次側關斷開關常承受約兩倍輸入電壓，另需處理尖峰。"
          }
        },
        {
          "id": "mid-magnetization",
          "title": "單向激磁、雙向激磁與 PWM",
          "pages": "48–50",
          "lead": "磁通方向與工作範圍，決定磁芯可利用的 ΔB 空間。",
          "explain": [
            "Flyback 和 Forward 等常見單端架構在 B-H 曲線的一側工作，必須靠去磁/復位把磁通拉回。",
            "Push-Pull、半橋與全橋的正負一次側電壓可使磁通往兩方向擺動，通常能更充分利用磁芯 B-H 工作範圍。",
            "講義第 49–50 頁對比單向／雙向激磁與雙端 PWM。即使是雙向激磁，仍需確保正負伏秒對稱，否則會出現 Flux Walking。"
          ],
          "formula": "ΔB≈∫Vp dt/(Np·Ae)；磁通平衡需滿足每週期 ∫Vp dt≈0",
          "example": "Vp=200 V、ton=2 μs、Np=20 匝、Ae=100 mm²：ON 階段 ΔB≈0.2 T。",
          "points": [
            "磁芯需要留 Bsat、溫度及材料批次裕度。",
            "偏磁可來自驅動不平衡、寄生與控制誤差。"
          ],
          "trap": "認為雙向激磁就保證不飽和；不對稱時仍可能磁通走偏。",
          "quiz": {
            "q": "雙向激磁也需要什麼條件？",
            "choices": [
              "正負伏秒長期平衡",
              "只要頻率高就夠",
              "不用量測一次側電壓"
            ],
            "correct": 0,
            "reason": "正負伏秒偏差會造成磁通逐週漂移。"
          }
        },
        {
          "id": "mid-coreloss",
          "title": "B-H 曲線、磁芯損耗與設計取捨",
          "pages": "51",
          "lead": "磁芯不只會飽和；高頻與大磁通擺幅也會造成鐵損。",
          "explain": [
            "講義第 51 頁同時展示 B-H 曲線與 Core Loss vs Flux Density，並給出 Steinmetz 類型經驗式：損耗密度與頻率的 a 次方及磁通擺幅的 b 次方有關。",
            "提高 fs 雖可降低磁芯所需尺寸，但可能提高鐵損；減小 ΔB、改材料與磁芯幾何都影響結果。",
            "圖中係數 k、a、b 需取自特定磁材和工作溫度，不可把一條教材曲線直接套用所有磁芯。"
          ],
          "formula": "Pcore/Volume≈k·fs^a·(ΔB)^b（材料/波形限定的近似式）",
          "example": "若固定 k、a、ΔB，fs 加倍時損耗密度的比例約為 2^a，而非必然剛好 2。",
          "points": [
            "查磁材 Datasheet 在實際溫度、B、fs 的曲線。",
            "除磁芯損耗還要量銅損、繞組熱點與漏感。"
          ],
          "trap": "只看 Bsat 避免飽和，就忽略鐵損與溫升。",
          "quiz": {
            "q": "高頻下磁芯鐵損通常還受哪項重要參數影響？",
            "choices": [
              "磁通密度擺幅 ΔB",
              "只有輸出端 PWM 腳號",
              "只看輸出電容數量"
            ],
            "correct": 0,
            "reason": "磁芯損耗密度通常對 fs 與 ΔB 都很敏感。"
          }
        }
      ]
    }
  ],
  "slideTitles": {
    "1": "DC-DC Converters",
    "2": "四種基本 DC-DC 拓樸",
    "3": "Buck 的電壓回授與 PWM",
    "4": "切換頻率與 LC 低通濾波",
    "5": "自然諧振頻率與 Q 值",
    "6": "Buck 電感伏秒平衡",
    "7": "CCM 與 DCM 波形比較",
    "8": "Buck 的 BCM 臨界條件",
    "9": "Buck 的 DCM 分析",
    "10": "Boost CCM 與漣波",
    "11": "Boost 含 RL 的平均等效電路 I",
    "12": "Boost 含 RL 的平均等效電路 II",
    "13": "Boost 輸出電壓與 Duty",
    "14": "Boost 效率與 Duty",
    "15": "Boost 含開關及二極體寄生損耗 I",
    "16": "Boost 寄生電路的伏秒／電荷平衡",
    "17": "Boost 寄生等效電路",
    "18": "Boost 寄生等效變壓器模型",
    "19": "Boost 完整平均轉壓比與效率",
    "20": "電感 Ripple 對平均損耗估計的影響",
    "21": "Boost BCM 邊界條件",
    "22": "Boost DCM 模式分析",
    "23": "Buck-Boost CCM",
    "24": "Buck-Boost BCM 邊界",
    "25": "Buck-Boost DCM",
    "26": "Buck-Boost 拓樸：Ćuk、SEPIC、ZETA",
    "27": "四開關 Bridge Buck-Boost",
    "28": "Bi-directional Buck-Boost",
    "29": "H-Bridge 四象限控制",
    "30": "全橋直流馬達驅動器",
    "31": "雙極性 PWM（Bipolar）",
    "32": "單極性 PWM（Unipolar）",
    "33": "隔離式 DC-DC 基本拓樸",
    "34": "脈衝變壓器隔離回授",
    "35": "光耦隔離回授",
    "36": "隔離變壓器多組輸出",
    "37": "Flyback 電路演變",
    "38": "Flyback CCM 運作",
    "39": "Flyback DCM 運作",
    "40": "Flyback DCM 設計與應力",
    "41": "Forward 去磁問題",
    "42": "單開關 Forward 的復位與應力",
    "43": "雙開關 Forward",
    "44": "隔離式半橋",
    "45": "隔離式全橋",
    "46": "Push-Pull 電壓源式",
    "47": "電流源型 Push-Pull",
    "48": "單向激磁及變壓器等效電路",
    "49": "單向與雙向激磁比較",
    "50": "雙端式 PWM",
    "51": "B-H 與磁芯損耗",
    "52": "結語"
  }
};
window.EE_SOURCE_CONFIG = {"key":"middle-volume-52","pageCount":52,"label":"電力電子初級班講義（中）"};
