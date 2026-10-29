/* Explicit math notation for EE Handouts. Every TeX string is authored, never inferred from a free-form sentence. */
window.EE_MATH = {
  "mid-topologies": [
    {
      "label": "Buck · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=D"
    },
    {
      "label": "Boost · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{1}{1-D}"
    },
    {
      "label": "反相 Buck–Boost · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=-\\frac{D}{1-D}"
    }
  ],
  "mid-buck-pwm": [
    {
      "label": "PWM 責任週期",
      "tex": "D=\\frac{t_{\\mathrm{on}}}{T_s}"
    },
    {
      "label": "Buck 理想 CCM 穩態",
      "tex": "V_o=D\\,V_{\\mathrm{in}}"
    }
  ],
  "mid-switching-lc": [
    {
      "label": "電感電流峰對峰漣波",
      "tex": "\\Delta I_L\\approx\\frac{(V_{\\mathrm{in}}-V_o)\\,D}{L f_s}"
    }
  ],
  "mid-resonance": [
    {
      "label": "自然諧振角頻率",
      "tex": "\\omega_0=\\frac{1}{\\sqrt{LC}}"
    },
    {
      "label": "自然諧振頻率",
      "tex": "f_0=\\frac{1}{2\\pi\\sqrt{LC}}"
    },
    {
      "label": "品質因數（此講義理想模型）",
      "tex": "Q=R\\sqrt{\\frac{C}{L}}"
    },
    {
      "label": "阻尼比",
      "tex": "\\zeta=\\frac{1}{2Q}"
    }
  ],
  "mid-voltsecond": [
    {
      "label": "電感伏秒平衡",
      "tex": "(V_{\\mathrm{in}}-V_o)D T_s-V_o(1-D)T_s=0"
    },
    {
      "label": "理想 Buck CCM",
      "tex": "V_o=D\\,V_{\\mathrm{in}}"
    }
  ],
  "mid-ccm-dcm": [
    {
      "label": "CCM · 電流不歸零",
      "tex": "I_{L,\\min}>0"
    },
    {
      "label": "BCM · 電流谷值恰好為零",
      "tex": "I_{L,\\min}=0"
    },
    {
      "label": "DCM · 存在零電流區間",
      "tex": "i_L(t)=0\\quad\\text{for part of }T_s"
    }
  ],
  "mid-bcm": [
    {
      "label": "Buck 臨界輸出電流",
      "tex": "I_{o,\\mathrm{BCM}}=\\frac{\\Delta I_L}{2}=\\frac{V_{\\mathrm{in}}D(1-D)}{2L f_s}"
    }
  ],
  "mid-buck-dcm": [
    {
      "label": "DCM 兩段伏秒平衡",
      "tex": "(V_{\\mathrm{in}}-V_o)D T_s-V_o\\Delta_1 T_s=0"
    },
    {
      "label": "Buck DCM 轉壓比",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{D}{D+\\Delta_1}"
    }
  ],
  "mid-boost-ccm": [
    {
      "label": "Boost 理想 CCM 增益",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{1}{1-D}"
    },
    {
      "label": "理想輸入／輸出電流",
      "tex": "\\frac{I_o}{I_{\\mathrm{in}}}\\approx1-D"
    }
  ],
  "mid-boost-ripple": [
    {
      "label": "電感電流漣波",
      "tex": "\\Delta I_L\\approx\\frac{V_{\\mathrm{in}}D}{L f_s}"
    },
    {
      "label": "輸出電壓漣波（忽略 ESR）",
      "tex": "\\Delta V_o\\approx\\frac{I_oD}{C f_s}"
    }
  ],
  "mid-boost-rl": [
    {
      "label": "只計電感銅阻的 Boost 增益",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{1}{1-D}\\cdot\\frac{1}{1+\\dfrac{R_L}{(1-D)^2R}}"
    }
  ],
  "mid-boost-efficiency": [
    {
      "label": "只計電感銅阻的效率近似",
      "tex": "\\eta\\approx\\frac{1}{1+\\dfrac{R_L}{(1-D)^2R}}"
    }
  ],
  "mid-boost-parasitic": [
    {
      "label": "MOSFET 導通損耗",
      "tex": "P_{\\mathrm{cond,MOS}}\\approx I_{\\mathrm{rms,MOS}}^2R_{\\mathrm{DS(on)}}"
    },
    {
      "label": "二極體導通損耗（粗估）",
      "tex": "P_{\\mathrm{diode}}\\approx V_D I_{\\mathrm{avg,D}}"
    }
  ],
  "mid-boost-dcm": [
    {
      "label": "DCM 伏秒平衡",
      "tex": "V_{\\mathrm{in}}D T_s+(V_{\\mathrm{in}}-V_o)\\Delta_1T_s=0"
    },
    {
      "label": "Boost DCM 轉壓比",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{D+\\Delta_1}{\\Delta_1}"
    }
  ],
  "mid-buckboost-ccm": [
    {
      "label": "反相 Buck–Boost · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=-\\frac{D}{1-D}"
    }
  ],
  "mid-buckboost-dcm": [
    {
      "label": "反相 Buck–Boost · DCM 幅值",
      "tex": "\\frac{|V_o|}{V_{\\mathrm{in}}}=\\frac{D}{\\Delta_1}"
    },
    {
      "label": "BCM 輸出臨界電流",
      "tex": "I_{o,\\mathrm{BCM}}=\\frac{T_s|V_o|(1-D)^2}{2L}"
    }
  ],
  "mid-sepic-zeta": [
    {
      "label": "典型 Ćuk（反相）· 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=-\\frac{D}{1-D}"
    },
    {
      "label": "SEPIC / ZETA（非反相）· 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}\\approx\\frac{D}{1-D}"
    }
  ],
  "mid-four-switch": [
    {
      "label": "中間電感兩端電壓",
      "tex": "v_L=v_{\\mathrm{SW,buck}}-v_{\\mathrm{SW,boost}}"
    },
    {
      "label": "穩態平均電感電壓",
      "tex": "\\langle v_L\\rangle=0"
    }
  ],
  "mid-bidirectional": [
    {
      "label": "帶正負號的端點功率",
      "tex": "P=VI"
    },
    {
      "label": "被動符號慣例下回送能量",
      "tex": "P<0"
    }
  ],
  "mid-quadrants": [
    {
      "label": "全橋差動輸出電壓",
      "tex": "V_{AB}=V_A-V_B"
    },
    {
      "label": "負載端功率",
      "tex": "P_{\\mathrm{load}}=V_{AB}I_{AB}"
    }
  ],
  "mid-motor-hbridge": [
    {
      "label": "直流馬達電樞方程",
      "tex": "L_a\\frac{\\mathrm{d}i_a}{\\mathrm{d}t}+R_a i_a=v_{AB}-e_a"
    },
    {
      "label": "橋臂狀態決定輸出",
      "tex": "v_{AB}=(S_A-S_B)V_{\\mathrm{dc}}"
    }
  ],
  "mid-bipolar": [
    {
      "label": "Bipolar 理想差動輸出",
      "tex": "v_{AB}\\in\\{-V_{\\mathrm{dc}},+V_{\\mathrm{dc}}\\}"
    }
  ],
  "mid-unipolar": [
    {
      "label": "Unipolar 理想差動輸出",
      "tex": "v_{AB}\\in\\{-V_{\\mathrm{dc}},0,+V_{\\mathrm{dc}}\\}"
    }
  ],
  "mid-isolated-types": [
    {
      "label": "理想變壓器瞬時電壓比",
      "tex": "\\frac{V_s}{V_p}=\\frac{N_s}{N_p}"
    }
  ],
  "mid-isolation-feedback": [
    {
      "label": "隔離回授的訊號流",
      "tex": "V_o\\xrightarrow{\\text{measurement}}\\mathrm{Error}\\xrightarrow{\\text{isolation}}\\mathrm{PWM}"
    }
  ],
  "mid-multi-output": [
    {
      "label": "理想變壓器繞組電壓比",
      "tex": "\\frac{V_2}{V_1}\\approx\\frac{N_2}{N_1}"
    }
  ],
  "mid-flyback-ccm": [
    {
      "label": "Flyback · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}=\\frac{N_s}{N_p}\\frac{D}{1-D}"
    }
  ],
  "mid-flyback-dcm": [
    {
      "label": "一次側磁化峰值電流",
      "tex": "I_p\\approx\\frac{V_{\\mathrm{in}}D}{L_m f_s}"
    },
    {
      "label": "DCM 能量與輸出功率近似",
      "tex": "P_o\\approx\\eta\\,\\frac{1}{2}L_m I_p^2 f_s"
    }
  ],
  "mid-forward-reset": [
    {
      "label": "Forward · 理想 CCM",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}\\approx\\frac{N_s}{N_p}D"
    },
    {
      "label": "講義第三復位繞組架構",
      "tex": "D_{\\max}=\\frac{1}{1+\\dfrac{N_3}{N_p}}"
    }
  ],
  "mid-double-forward": [
    {
      "label": "理想開關耐壓應力",
      "tex": "V_{\\mathrm{switch,max}}\\approx V_{\\mathrm{in,max}}"
    },
    {
      "label": "典型最大 Duty",
      "tex": "D_{\\max}\\leq0.5"
    }
  ],
  "mid-half-full": [
    {
      "label": "半橋（講義 D 定義）",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}\\approx\\frac{N_s}{N_p}D"
    },
    {
      "label": "全橋（講義 D 定義）",
      "tex": "\\frac{V_o}{V_{\\mathrm{in}}}\\approx2\\frac{N_s}{N_p}D"
    },
    {
      "label": "每半週脈衝責任週期範圍",
      "tex": "0<D<0.5"
    }
  ],
  "mid-pushpull": [
    {
      "label": "電壓源型 Push–Pull 理想開關耐壓",
      "tex": "V_{\\mathrm{switch,max}}\\approx2V_{\\mathrm{in,max}}"
    }
  ],
  "mid-magnetization": [
    {
      "label": "磁通密度擺幅",
      "tex": "\\Delta B\\approx\\frac{1}{N_pA_e}\\int V_p\\,\\mathrm{d}t"
    },
    {
      "label": "週期伏秒平衡",
      "tex": "\\int_0^{T_s}V_p(t)\\,\\mathrm{d}t\\approx0"
    }
  ],
  "mid-coreloss": [
    {
      "label": "Steinmetz 型經驗近似",
      "tex": "\\frac{P_{\\mathrm{core}}}{\\mathrm{Volume}}\\approx k f_s^{a}(\\Delta B)^b"
    }
  ],
  "power": [
    {
      "label": "瞬時功率（被動符號慣例）",
      "tex": "p(t)=v(t)\\,i(t)"
    }
  ],
  "rms": [
    {
      "label": "離散樣本的 RMS",
      "tex": "I_{\\mathrm{rms}}=\\sqrt{\\frac{1}{N}\\sum_{k=1}^{N}i_k^2}"
    }
  ],
  "pqs": [
    {
      "label": "實功率",
      "tex": "P=VI\\cos\\varphi"
    },
    {
      "label": "無功功率",
      "tex": "Q=VI\\sin\\varphi"
    },
    {
      "label": "視在功率",
      "tex": "S=VI"
    },
    {
      "label": "功率因數",
      "tex": "\\mathrm{PF}=\\frac{P}{S}"
    }
  ],
  "threephase": [
    {
      "label": "平衡三相線／相電壓",
      "tex": "V_{LL}=\\sqrt{3}\\,V_{\\mathrm{phase}}"
    },
    {
      "label": "平衡三相實功率",
      "tex": "P_{3\\varphi}=\\sqrt{3}\\,V_{LL}I_L\\cos\\varphi"
    }
  ],
  "fourier": [
    {
      "label": "週期波形的傅立葉展開",
      "tex": "f(t)=\\mathrm{DC}+\\sum_{h=1}^{\\infty}\\left[a_h\\cos(h\\omega t)+b_h\\sin(h\\omega t)\\right]"
    }
  ],
  "thd": [
    {
      "label": "理想正弦電壓條件下的 PF",
      "tex": "\\mathrm{PF}=\\frac{\\cos\\varphi_1}{\\sqrt{1+\\mathrm{THD}_i^2}}"
    }
  ],
  "ampere": [
    {
      "label": "安培環路定律",
      "tex": "\\oint \\boldsymbol{H}\\cdot\\mathrm{d}\\boldsymbol{\\ell}=NI"
    },
    {
      "label": "具氣隙磁路近似",
      "tex": "H_c\\ell_c+H_g\\ell_g=NI"
    }
  ],
  "bh": [
    {
      "label": "線性磁性材料",
      "tex": "B=\\mu H"
    },
    {
      "label": "磁通與磁通密度",
      "tex": "\\Phi=BA"
    },
    {
      "label": "增量電感模型",
      "tex": "v=L_{\\mathrm{inc}}\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    }
  ],
  "reluctance": [
    {
      "label": "磁阻模型",
      "tex": "NI=\\Phi\\,\\mathcal{R}"
    },
    {
      "label": "均勻磁路",
      "tex": "\\mathcal{R}=\\frac{\\ell}{\\mu A}"
    },
    {
      "label": "磁通連續性",
      "tex": "\\sum \\Phi=0"
    }
  ],
  "faraday": [
    {
      "label": "法拉第感應電壓幅值",
      "tex": "|e|=N\\left|\\frac{\\mathrm{d}\\Phi}{\\mathrm{d}t}\\right|"
    }
  ],
  "inductor": [
    {
      "label": "線性磁路電感",
      "tex": "L=\\frac{N^2}{\\mathcal{R}}"
    },
    {
      "label": "電感儲能",
      "tex": "E=\\frac{1}{2}LI^2"
    },
    {
      "label": "電感電壓電流關係",
      "tex": "v=L\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    }
  ],
  "transformer": [
    {
      "label": "理想變壓器匝比",
      "tex": "\\frac{e_2}{e_1}=\\frac{N_2}{N_1}"
    },
    {
      "label": "二次側阻抗折算到一次側",
      "tex": "Z'_2=\\left(\\frac{N_1}{N_2}\\right)^2Z_2"
    },
    {
      "label": "鐵芯損耗近似",
      "tex": "P_{\\mathrm{core}}\\approx\\frac{E_1^2}{R_m}"
    }
  ],
  "blocks": [
    {
      "label": "穩態功率守恆（含損耗）",
      "tex": "P_{\\mathrm{out}}\\approx P_{\\mathrm{in}}-P_{\\mathrm{loss}}"
    }
  ],
  "linear": [
    {
      "label": "線性穩壓器功率損耗",
      "tex": "P_{\\mathrm{linear}}\\approx(V_{\\mathrm{in}}-V_o)I_o"
    }
  ],
  "pwm": [
    {
      "label": "PWM 責任週期",
      "tex": "D=\\frac{t_{\\mathrm{on}}}{T_s}"
    },
    {
      "label": "Buck 理想 CCM",
      "tex": "V_o\\approx D V_{\\mathrm{in}}"
    }
  ],
  "timing": [
    {
      "label": "從量測到功率級的響應時間",
      "tex": "t_{\\mathrm{total}}\\approx t_{\\mathrm{measure}}+t_{\\mathrm{compute}}+t_{\\mathrm{PWM}}+t_{\\mathrm{plant}}"
    }
  ],
  "diodes": [
    {
      "label": "二極體導通損耗估算",
      "tex": "P_{\\mathrm{cond}}\\approx V_F I_{\\mathrm{avg}}"
    },
    {
      "label": "反向恢復損耗粗估",
      "tex": "P_{\\mathrm{rr}}\\approx Q_{\\mathrm{rr}}V_R f_{\\mathrm{sw}}"
    }
  ],
  "mosfet": [
    {
      "label": "MOSFET 導通損",
      "tex": "P_{\\mathrm{cond}}\\approx I_{\\mathrm{rms}}^2R_{\\mathrm{DS(on)}}"
    },
    {
      "label": "Gate 驅動損耗",
      "tex": "P_{\\mathrm{gate}}\\approx Q_g V_g f_{\\mathrm{sw}}"
    }
  ],
  "switchloss": [
    {
      "label": "開關損耗",
      "tex": "P_{\\mathrm{sw}}\\approx(E_{\\mathrm{on}}+E_{\\mathrm{off}})f_{\\mathrm{sw}}"
    },
    {
      "label": "部分功率損耗總和",
      "tex": "P_{\\mathrm{total}}\\approx P_{\\mathrm{cond}}+P_{\\mathrm{sw}}+P_{\\mathrm{gate}}+\\cdots"
    }
  ],
  "igbt": [
    {
      "label": "IGBT 導通損耗粗估",
      "tex": "P_{\\mathrm{IGBT,cond}}\\approx V_{\\mathrm{CE(sat)}}I_{\\mathrm{avg}}"
    }
  ],
  "wbg": [
    {
      "label": "寄生電感造成的過衝近似",
      "tex": "V_{\\mathrm{overshoot}}\\approx L_{\\mathrm{par}}\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    }
  ],
  "half": [
    {
      "label": "理想半波純電阻負載",
      "tex": "i_R(t)\\approx\\frac{\\max(v_s(t),0)}{R}"
    }
  ],
  "bridge": [
    {
      "label": "理想單相全橋整流輸出",
      "tex": "v_{\\mathrm{DC}}(t)\\approx|v_{\\mathrm{AC}}(t)|"
    }
  ],
  "overlap": [
    {
      "label": "交流側電感關係",
      "tex": "v_L=L_s\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    }
  ],
  "capacitor": [
    {
      "label": "單相全波整流小漣波近似",
      "tex": "\\Delta V\\approx\\frac{I_{\\mathrm{load}}}{2f_{\\mathrm{line}}C}"
    }
  ],
  "notching": [
    {
      "label": "PCC 瞬時電壓關係",
      "tex": "v_{\\mathrm{PCC}}(t)=v_s(t)-R_s i(t)-L_s\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    },
    {
      "label": "第 h 次諧波相量式",
      "tex": "\\underline{V}_{\\mathrm{PCC},h}=\\underline{V}_{s,h}-\\underline{Z}_h\\underline{I}_h"
    }
  ],
  "neutral": [
    {
      "label": "中性線瞬時電流",
      "tex": "i_N(t)=-\\left[i_A(t)+i_B(t)+i_C(t)\\right]"
    }
  ],
  "sixpulse": [
    {
      "label": "理想三相六脈波整流",
      "tex": "v_{\\mathrm{DC}}(t)\\approx\\max(v_a,v_b,v_c)-\\min(v_a,v_b,v_c)"
    }
  ],
  "harmonics": [
    {
      "label": "理想六脈波特徵諧波",
      "tex": "h=6n\\pm1"
    }
  ],
  "commutation": [
    {
      "label": "交流源電感",
      "tex": "v_L=L_{\\mathrm{source}}\\frac{\\mathrm{d}i}{\\mathrm{d}t}"
    }
  ],
  "bus": [
    {
      "label": "電流峰值因數",
      "tex": "\\mathrm{CF}=\\frac{I_{\\mathrm{peak}}}{I_{\\mathrm{rms}}}"
    },
    {
      "label": "真功率因數",
      "tex": "\\mathrm{PF}=\\frac{P}{V_{\\mathrm{rms}}I_{\\mathrm{rms}}}"
    }
  ],
  "op": [
    {
      "label": "反相放大器",
      "tex": "A_{v,\\mathrm{inv}}=-\\frac{R_f}{R_{\\mathrm{in}}}"
    },
    {
      "label": "非反相放大器",
      "tex": "A_{v,\\mathrm{noninv}}=1+\\frac{R_f}{R_g}"
    }
  ],
  "diff": [
    {
      "label": "理想差動訊號調理",
      "tex": "V_o=V_{\\mathrm{ref}}+G(V_+-V_-)"
    }
  ],
  "filter": [
    {
      "label": "一階 RC 低通截止頻率",
      "tex": "f_c=\\frac{1}{2\\pi RC}"
    }
  ],
  "differentiator": [
    {
      "label": "頻寬受限微分器轉移函數",
      "tex": "H(s)=\\frac{-R_fC_{\\mathrm{in}}s}{(1+R_iC_{\\mathrm{in}}s)(1+R_fC_f s)}"
    }
  ],
  "pi": [
    {
      "label": "PI 補償器",
      "tex": "G(s)=-\\left(K_p+\\frac{K_i}{s}\\right)"
    },
    {
      "label": "比例係數",
      "tex": "K_p=\\frac{R_f}{R_{\\mathrm{in}}}"
    },
    {
      "label": "積分係數",
      "tex": "K_i=\\frac{1}{R_{\\mathrm{in}}C}"
    }
  ],
  "adc": [
    {
      "label": "雙向電流 ADC 映射",
      "tex": "V_{\\mathrm{ADC}}=1.5+14\\times0.005I=1.5+0.07I"
    }
  ]
};
