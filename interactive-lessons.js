/* Lesson-level investigations: explicit educational models, not SPICE or bench measurements. */
(function () {
  'use strict';

  function knob(key, label, min, max, step, value, unit) {
    return {key:key,label:label,min:min,max:max,step:step,value:value,unit:unit||''};
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function fmt(value, digits) {
    if (!Number.isFinite(value)) return '—';
    var d=digits===undefined?2:digits;
    return Number(value.toFixed(d)).toLocaleString('zh-TW',{maximumFractionDigits:d});
  }
  function metric(label,value,unit,digits) {
    return {label:label,value:value,unit:unit||'',digits:digits===undefined?2:digits};
  }
  function trace(label,unit,fn) {
    var points=[];
    for(var i=0;i<=100;i++) points.push(fn(i/100));
    return {label:label,unit:unit,points:points};
  }
  function result(metrics,note,extra) {
    var output={metrics:metrics,primary:metrics[0].value,note:note||''};
    return Object.assign(output,extra||{});
  }
  function tri(t) { return t-Math.floor(t); }
  function sin(t,p) { return Math.sin(2*Math.PI*t+(p||0)); }
  function clamp(x,lo,hi) { return Math.max(lo,Math.min(hi,x)); }

  var M={
    signed:{
      title:'瞬時功率與能量方向', knobs:[knob('v','參考電壓',-48,48,2,24,' V'),knob('i','參考電流',-10,10,1,2,' A')],
      assumption:'採被動符號約定：電流流入標示的電壓正端；假設兩者為定值。負功率代表元件向外供能。',
      compute:function(v){var p=v.v*v.i;return result([metric('瞬時功率 p',p,' W'),metric('1 秒能量變化',p,' J')],p>0?'元件吸收功率。':p<0?'元件送出功率。':'瞬時淨功率為零。');}
    },
    sine:{
      title:'正弦波與有效值',knobs:[knob('vp','正弦峰值',10,340,10,170,' V'),knob('f','頻率',40,120,10,60,' Hz')],
      assumption:'純正弦、無直流偏壓；RMS 公式不適用於任意非正弦波。',
      compute:function(v){return result([metric('正弦 RMS',v.vp/Math.sqrt(2),' V'),metric('週期',1000/v.f,' ms'),metric('整流後平均絕對值',2*v.vp/Math.PI,' V')],
        '同一波形的峰值與有效值不同。',{series:[trace('正弦電壓','V',function(t){return v.vp*sin(t,0);}),trace('絕對值','V',function(t){return Math.abs(v.vp*sin(t,0));})]});}
    },
    powerFactor:{
      title:'位移、失真與總功率因數',knobs:[knob('angle','基波電流落後角',0,80,5,30,' °'),knob('thd','電流 THD',0,100,5,20,' %')],
      assumption:'電壓為理想正弦波、基波電流 5 A RMS；所有失真用三次諧波示意。Q 為基波無功，非總非有功功率。',
      compute:function(v){var a=v.angle*Math.PI/180,d=v.thd/100,p=230*5*Math.cos(a),q=230*5*Math.sin(a),s=230*5*Math.sqrt(1+d*d);
        return result([metric('總功率因數 PF',p/s,'' ,3),metric('有功功率 P',p,' W'),metric('基波無功 Q1',q,' var'),metric('視在功率 S',s,' VA')],
          'PF = cos(角度) / √(1+THDi²)。',{series:[trace('v(t)','V',function(t){return 230*Math.SQRT2*sin(t);}),trace('i(t)','A',function(t){return 5*Math.SQRT2*(sin(t,-a)+d*sin(3*t));})]});}
    },
    phases:{
      title:'三相相量與線電壓',knobs:[knob('phase','觀察相位',0,360,15,30,' °'),knob('vrms','相電壓 RMS',100,240,10,220,' V')],
      assumption:'對稱三相 ABC 正相序，理想純正弦；VA、VB、VC 相差 120°。',
      compute:function(v){var angle=v.phase*Math.PI/180,pk=v.vrms*Math.SQRT2,va=pk*Math.sin(angle),vb=pk*Math.sin(angle-2*Math.PI/3);
        return result([metric('當下 VAB',va-vb,' V'),metric('線電壓 RMS',Math.sqrt(3)*v.vrms,' V')],
          '線電壓是兩條相電壓的瞬時差，不是只把峰值相加。',{series:[trace('VA','V',function(t){return pk*sin(t,angle);}),trace('VB','V',function(t){return pk*sin(t,angle-2*Math.PI/3);}),trace('VAB','V',function(t){return pk*(sin(t,angle)-sin(t,angle-2*Math.PI/3));})]});}
    },
    harmonics:{
      title:'傅立葉分量與波形失真',knobs:[knob('h3','3 次諧波／基波',0,80,5,25,' %'),knob('h5','5 次諧波／基波',0,50,5,10,' %')],
      assumption:'基波電流 5 A RMS；三次與五次正弦諧波互相正交，且無其他頻率分量。',
      compute:function(v){var d3=v.h3/100,d5=v.h5/100;
        return result([metric('THDi',100*Math.sqrt(d3*d3+d5*d5),' %'),metric('總電流 RMS',5*Math.sqrt(1+d3*d3+d5*d5),' A')],
          '諧波均方和決定 RMS；峰值形狀也會隨相位改變。',{series:[trace('基波 i1','A',function(t){return 5*Math.SQRT2*sin(t);}),trace('疊加 i','A',function(t){return 5*Math.SQRT2*(sin(t)+d3*sin(3*t)+d5*sin(5*t));})]});}
    },
    magnetic:{
      title:'匝數、氣隙、磁阻與電感',knobs:[knob('gap','氣隙長度',0,2,0.1,0.5,' mm'),knob('turns','匝數',40,160,10,100,' 圈'),knob('amps','電流',0.2,3,0.2,1,' A')],
      assumption:'固定磁芯路長 0.1 m、截面 1 cm²、相對導磁係數 1500，線性定 μ；不代表真實 B-H、飽和或邊緣磁通。',
      compute:function(v){var mu=4*Math.PI*1e-7,r=.1/(mu*1500*1e-4)+v.gap/1000/(mu*1e-4),L=v.turns*v.turns/r,B=v.turns*v.amps/(r*1e-4);
        return result([metric('電感量 L',L*1e3,' mH',3),metric('磁通密度 B',B,' T',3),metric('儲能 ½LI²',.5*L*v.amps*v.amps*1000,' mJ',3)],
          '增加氣隙會增大磁阻；固定匝數時 L 通常下降。',{warning:B>0.3?'B 高於 0.3 T 教學提醒值，實際飽和須查磁材資料。':''});}
    },
    faraday:{
      title:'磁通變化與感應電壓',knobs:[knob('freq','磁通頻率',10,300,10,60,' Hz'),knob('b','磁通密度峰值',0.02,0.3,0.02,0.1,' T')],
      assumption:'100 匝、截面 1 cm²，均勻正弦 B(t)；正負取自選定繞組參考方向。',
      compute:function(v){var pk=100*1e-4*2*Math.PI*v.freq*v.b;
        return result([metric('感應電壓峰值',pk,' V',3),metric('感應電壓 RMS',pk/Math.SQRT2,' V',3)],
          'e = −N·A·dB/dt；磁通過零時感應電壓幅度反而最大。',{series:[trace('B(t)','T',function(t){return v.b*sin(t);}),trace('e(t)','V',function(t){return -pk*Math.cos(2*Math.PI*t);})]});}
    },
    transformer:{
      title:'理想變壓器匝數與電流',knobs:[knob('ratio','一次／二次匝數比',1,8,0.5,2,''),knob('vp','一次側 RMS 電壓',24,240,12,96,' V')],
      assumption:'單相理想變壓器、固定二次側電流 2 A RMS；忽略磁化電流、漏感、壓降與損耗。',
      compute:function(v){var vs=v.vp/v.ratio,ip=2/v.ratio;
        return result([metric('二次側 RMS 電壓',vs,' V'),metric('一次側 RMS 電流',ip,' A'),metric('二次側視在功率',vs*2,' VA')],
          '降壓時電流變比反向；實際磁化與損耗不可忽略。');}
    },
    efficiency:{
      title:'功率平衡與損耗',knobs:[knob('eta','效率',70,99,1,90,' %'),knob('pout','輸出功率',50,1000,50,300,' W')],
      assumption:'穩態單方向功率傳輸；將所有損耗合併成效率參數，不推定實際損耗機制。',
      compute:function(v){var pin=v.pout/(v.eta/100);
        return result([metric('總損耗',pin-v.pout,' W'),metric('輸入功率',pin,' W'),metric('輸出功率',v.pout,' W')],
          '能量不會因為升壓或降壓而增加；額外輸入功率轉為損耗。');}
    },
    pwm:{
      title:'PWM Duty、週期與平均值',knobs:[knob('duty','占空比',5,95,5,50,' %'),knob('freq','PWM 頻率',20,200,10,100,' kHz')],
      assumption:'理想 0/24 V 開關節點、固定占空比；平均值不是實際有載轉換器的瞬態輸出。',
      compute:function(v){var d=v.duty/100;
        return result([metric('PWM 平均電壓',24*d,' V'),metric('ON 時間',1000*d/v.freq,' μs',3),metric('週期',1000/v.freq,' μs',3)],
          '增加 Duty 會延長 ON 區間。',{series:[trace('PWM','V',function(t){return t<d?24:0;}),trace('理想平均','V',function(){return 24*d;})],stage:{on:d,off:1-d,kind:'pwm'}});}
    },
    timing:{
      title:'取樣與控制時序預算',knobs:[knob('delay','從觸發到生效延遲',0,25,0.5,2,' μs'),knob('freq','控制頻率',20,200,10,100,' kHz')],
      assumption:'只計算週期相對延遲；不代表實際 MCU 的 ADC、ISR、PWM shadow 更新或 closed-loop phase margin。',
      compute:function(v){var T=1000/v.freq,ratio=v.delay/T;
        return result([metric('占週期比例',100*ratio,' %'),metric('控制週期',T,' μs'),metric('剩餘週期時間',T-v.delay,' μs')],
          '總延遲需要逐一量測；若超過週期，控制資料可能跨週期生效。',{warning:ratio>=1?'延遲已達或超過一個更新週期，需重新確認確定性時序。':''});}
    },
    semiconductor:{
      title:'MOSFET 與 IGBT 導通損耗比較',knobs:[knob('current','通電電流',1,30,1,10,' A'),knob('rds','MOSFET RDS(on)',2,80,2,15,' mΩ'),knob('vce','IGBT 假設 VCE(sat)',1,3,0.2,2,' V')],
      assumption:'比較固定電流下的簡化導通損耗，不包含 Duty、熱阻、RDS(on) 溫升、IGBT Tail Current 或切換損耗。',
      compute:function(v){var pm=v.current*v.current*v.rds/1000,pi=v.current*v.vce;
        return result([metric('MOSFET 導通損耗',pm,' W'),metric('IGBT 導通損耗',pi,' W'),metric('兩者損耗差',pi-pm,' W')],
          '元件技術不能只看此數值決策；耐壓、頻率與溫度仍是重要條件。');}
    },
    switching:{
      title:'切換能量與開關頻率',knobs:[knob('energy','每次 ON／OFF 能量',5,250,5,50,' μJ'),knob('freq','切換頻率',20,250,10,100,' kHz'),knob('qg','總 Gate Charge',10,150,10,50,' nC')],
      assumption:'假設 Eon=Eoff=設定值且不隨電流、溫度、母線電壓變化；Vgate=12 V。Gate 功率是驅動端近似能量預算。',
      compute:function(v){var ps=2*v.energy*v.freq/1000,pg=v.qg*12*v.freq/1e6;
        return result([metric('開關切換損耗',ps,' W'),metric('Gate 驅動功率',pg,' W',3)],
          '頻率提高通常使固定單次損耗的總功率增加。');}
    },
    diode:{
      title:'二極體導通與恢復應力',knobs:[knob('i','正向平均電流',0.5,15,0.5,5,' A'),knob('vf','假設正向壓降',0.3,1.5,0.1,0.9,' V')],
      assumption:'導通損耗用平均電流×固定 VF；Qrr=200 nC、VR=48 V、100 kHz 的附加量只作粗估，不取代 datasheet 的反向恢復波形。',
      compute:function(v){return result([metric('正向導通損耗',v.i*v.vf,' W'),metric('Qrr·VR·fs 粗估',200e-9*48*100000,' W',3)],
        '切換恢復應力與 di/dt、電路電感、溫度相關，不可只用 VF 評估。');}
    },
    rectifier:{
      title:'半波與全波整流',knobs:[knob('vac','輸入電壓 RMS',12,230,6,48,' V'),knob('full','全波模式 0=半波 1=全波',0,1,1,1,'')],
      assumption:'理想二極體、純電阻負載、無濾波電容；輸出平均值不等於加電容後的 DC Bus。',
      compute:function(v){var pk=v.vac*Math.SQRT2,full=Boolean(v.full),f=full?2:1;
        return result([metric('平均整流電壓',pk*f/Math.PI,' V'),metric('輸入峰值',pk,' V')],
          full?'全波每個半週都有脈動。':'半波只有正半週供電。',{series:[trace('輸入 AC','V',function(t){return pk*sin(t);}),trace('負載電壓','V',function(t){var a=pk*sin(t);return full?Math.abs(a):Math.max(a,0);})]});}
    },
    capRipple:{
      title:'整流後電容漣波近似',knobs:[knob('cap','輸出電容',220,2200,110,1000,' μF'),knob('load','負載電流',0.1,3,0.1,1,' A')],
      assumption:'50 Hz 全波、固定電流負載、Vpeak=24√2 V。ΔV≈I/(2fC) 只適用小漣波近似，非充電尖峰電流精確模擬。',
      compute:function(v){var dv=v.load/(100*v.cap*1e-6),pk=24*Math.SQRT2,valid=dv/pk<=0.2;
        return result([metric('小漣波估計 ΔV',dv,' V'),metric('ΔV／Vpeak',100*dv/pk,' %'),metric('輸入峰值',pk,' V')],
          valid?'此處小漣波近似可作教學估算。':'超出教學近似門檻，勿將估計當成實際 DC 電壓。',{warning:valid?'':'ΔV／Vpeak > 20%；模型不再用於宣稱實際輸出平均電壓。'});}
    },
    sourceL:{
      title:'交流源電感與換向壓降',knobs:[knob('l','源側電感',1,200,5,25,' μH'),knob('didt','電流變化率',0.1,15,0.1,2,' A/μs')],
      assumption:'僅估算元件瞬時電感電壓大小 |vL|=L|di/dt|；不能代替整流器重疊角、PCC Notch 深度與完整換向解。',
      compute:function(v){return result([metric('電感電壓幅值',v.l*v.didt,' V')], '電流無法瞬間跳變；電感壓降會影響換向。');}
    },
    threeRect:{
      title:'理想三相六脈波整流',knobs:[knob('phase','觀察電角度',0,360,10,30,' °'),knob('vrms','相電壓 RMS',100,240,10,220,' V')],
      assumption:'理想三相平衡、無源側電感、無導通壓降、無儲能電容；VDC=max(VA,VB,VC)−min(VA,VB,VC)。',
      compute:function(v){var a=v.phase*Math.PI/180,pk=v.vrms*Math.SQRT2,ph=function(t){return [pk*sin(t,a),pk*sin(t,a-2*Math.PI/3),pk*sin(t,a+2*Math.PI/3)];},p=ph(0);
        return result([metric('當下 DC 輸出',Math.max.apply(null,p)-Math.min.apply(null,p),' V'),metric('平均 DC 輸出',3*Math.sqrt(6)/Math.PI*v.vrms,' V')],
          '每 60° 改變最大／最小相的二極體配對。',{series:[trace('VA','V',function(t){return ph(t)[0];}),trace('VB','V',function(t){return ph(t)[1];}),trace('VDC','V',function(t){var x=ph(t);return Math.max.apply(null,x)-Math.min.apply(null,x);})]});}
    },
    neutral:{
      title:'三相三次諧波與中性線電流',knobs:[knob('h3','每相 3 次諧波／基波',0,60,5,15,' %'),knob('i1','每相基波 RMS',1,20,1,5,' A')],
      assumption:'理想平衡基波、相同相位的三次零序諧波，且有可導通中性線；忽略其他不平衡與諧波。',
      compute:function(v){return result([metric('中性線 RMS',3*v.i1*v.h3/100,' A'),metric('單相 3 次 RMS',v.i1*v.h3/100,' A')],
        '平衡基波在中性線抵消，同相位三次諧波卻會相加。',{series:[trace('IA','A',function(t){return v.i1*Math.SQRT2*(sin(t)+v.h3/100*sin(3*t));}),trace('IB','A',function(t){return v.i1*Math.SQRT2*(sin(t,-2*Math.PI/3)+v.h3/100*sin(3*t));}),trace('IN','A',function(t){return -3*v.i1*Math.SQRT2*v.h3/100*sin(3*t);})]});}
    },
    op:{
      title:'反相放大器與線性工作範圍',knobs:[knob('gain','理想反相增益絕對值',1,10,0.5,3,''),knob('vin','輸入電壓',-2,2,0.1,0.5,' V')],
      assumption:'理想負回授反相放大器；假設輸出供電軌 ±12 V 並用理想裁切示意超界，非特定 OP 的實際擺幅規格。',
      compute:function(v){var y=-v.gain*v.vin,limited=clamp(y,-12,12);
        return result([metric('輸出電壓（示意）',limited,' V'),metric('理想未限制輸出',y,' V')],
          '輸入極性反相；超過供電軌時理想線性公式失效。',{warning:y!==limited?'超出假設供電軌，輸出已用示意裁切，實際需查 datasheet。':''});}
    },
    diff:{
      title:'差動訊號調理與共模',knobs:[knob('vdiff','差動輸入',-0.2,0.2,0.01,0.05,' V'),knob('gain','理想差動增益',1,20,1,10,''),knob('vcm','共模電壓',-3,3,0.5,1,' V')],
      assumption:'理想無限 CMRR 差動放大器，只顯示差動增益；真實元件共模輸入範圍與輸出擺幅需查規格。',
      compute:function(v){return result([metric('理想差動輸出',v.vdiff*v.gain,' V'),metric('正端電壓',v.vcm+v.vdiff/2,' V'),metric('負端電壓',v.vcm-v.vdiff/2,' V')],
          '理想輸出對共模不敏感；實際共模過高會使 OP 失去線性。');}
    },
    filter:{
      title:'一階 RC 濾波頻率響應',knobs:[knob('r','電阻',1,20,1,10,' kΩ'),knob('c','電容',1,100,1,10,' nF'),knob('f','輸入頻率',100,20000,100,1000,' Hz')],
      assumption:'純一階被動 RC 低通示意；不能直接代表二階 Sallen-Key 或帶限微分器的完整轉移函數。',
      compute:function(v){var fc=1/(2*Math.PI*v.r*1000*v.c*1e-9),mag=1/Math.sqrt(1+(v.f/fc)*(v.f/fc));
        return result([metric('截止頻率 fc',fc,' Hz'),metric('指定頻率增益',mag,' V/V',3),metric('指定頻率增益',20*Math.log10(mag),' dB')],
          '輸入頻率接近 fc 時，增益約 −3 dB。');}
    },
    pi:{
      title:'PI 補償器頻率響應',knobs:[knob('kp','Kp',0.1,5,0.1,1,''),knob('ki','Ki',10,3000,10,600,' s⁻¹'),knob('f','分析頻率',10,2000,10,100,' Hz')],
      assumption:'連續時間 Gc(s)=Kp+Ki/s、Kp 無量綱；只計算補償器，不包含功率級、ADC、PWM 延遲或閉迴路穩定性。',
      compute:function(v){var b=v.ki/(2*Math.PI*v.f),mag=Math.hypot(v.kp,b);
        return result([metric('PI 幅值',mag,' V/V',3),metric('PI 相位',-Math.atan2(b,v.kp)*180/Math.PI,' °'),metric('PI 零點頻率',v.ki/(2*Math.PI*v.kp),' Hz')],
          '降低頻率會增加積分項影響；不能只看這張圖判斷迴路穩定。');}
    },
    adc:{
      title:'Shunt、偏壓與 ADC 量化',knobs:[knob('i','待量測電流',-30,30,1,10,' A'),knob('gain','差動放大增益',5,20,1,10,'')],
      assumption:'Rshunt=5 mΩ、偏壓=1.5 V、12-bit ADC、理想 0–3 V 輸入。超界不輸出有效 ADC code；不代表硬體腳位已受保護。',
      compute:function(v){var vad=1.5+.005*v.i*v.gain,valid=vad>=0&&vad<=3,code=valid?Math.round(vad/3*4095):NaN;
        return result([metric('ADC 腳電壓',vad,' V',3),metric('理想有效 Code',code,' count',0)],
          valid?'符合模型設定的 ADC 輸入範圍。':'ADC 超出輸入範圍，不可將理論轉換碼當成有效資料。',{warning:valid?'':'輸入超出 0–3 V；需額外確認前端保護及絕對最大額定值。'});}
    },
    topology:{
      title:'三種基本 DC-DC 轉壓比',knobs:[knob('duty','占空比',10,80,5,40,' %'),knob('vin','輸入電壓',12,96,6,48,' V')],
      assumption:'理想穩態 CCM，不含效率、同步整流模式及輸出負載；傳統 Buck-Boost 為反相型。',
      compute:function(v){var d=v.duty/100;return result([metric('Buck 輸出',v.vin*d,' V'),metric('Boost 輸出',v.vin/(1-d),' V'),metric('反相 Buck-Boost',-v.vin*d/(1-d),' V')],
        '不同電感位置與續流路徑決定不同的轉壓比。');}
    },
    lc:{
      title:'LC 二階系統與共振峰',knobs:[knob('l','電感',10,300,10,100,' μH'),knob('c','電容',10,500,10,100,' nF'),knob('q','品質因數 Q',0.5,5,0.5,1.5,'')],
      assumption:'標準二階低通 H(s)=ω0²/(s²+(ω0/Q)s+ω0²)，Q 是可調的等效阻尼參數；不是任一真實 LC 拓樸的自動 Q 推導。',
      compute:function(v){var f0=1/(2*Math.PI*Math.sqrt(v.l*1e-6*v.c*1e-9)),f=50000,x=f/f0,mag=1/Math.sqrt(Math.pow(1-x*x,2)+Math.pow(x/v.q,2));
        return result([metric('自然頻率 f0',f0,' Hz'),metric('50 kHz 幅值',mag,' V/V',3),metric('50 kHz 增益',20*Math.log10(mag),' dB')],
          '在相同 ω0 下，Q 越大代表阻尼越小；是否產生峰值由 Q 決定。');}
    },
    buck:{
      title:'Buck：PWM／CCM／BCM／DCM',knobs:[knob('io','輸出定電流負載',0.05,5,0.05,2,' A'),knob('duty','Duty',10,90,5,50,' %'),knob('vin','Vin',12,60,4,24,' V'),knob('l','電感',20,300,20,100,' μH'),knob('freq','開關頻率',25,250,25,100,' kHz')],
      assumption:'理想非同步 Buck、固定 Duty、定電流負載之穩態三區間模型；忽略寄生、電容漣波、閉迴路暫態及同步整流負電流。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,voC=v.vin*d,diC=v.vin*d*(1-d)/(L*fs),bound=diC/2,mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM';
        var vo=mode==='DCM'?v.vin/(1+2*L*fs*v.io/(v.vin*d*d)):voC,di=(v.vin-vo)*d/(L*fs),peak=mode==='CCM'?v.io+di/2:di,valley=mode==='CCM'?Math.max(0,v.io-di/2):0;
        var fw=mode==='DCM'?d*(v.vin/vo-1):1-d,zero=clamp(1-d-fw,0,1),tt=function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:0;};
        return result([metric('理想 Vout',vo,' V'),metric('IL Peak',peak,' A'),metric('BCM 臨界 Io',bound,' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：電流歸零後第三區間不再續流，Vout≠D·Vin。':mode==='BCM'?'BCM：谷值恰為零，為 CCM 與 DCM 分界。':'CCM：電感電流不歸零。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'buck'},series:[trace('PWM','V',function(t){return t<d?v.vin:0;}),trace('VL','V',function(t){return t<d?v.vin-vo:t<d+fw?-vo:0;}),trace('IL','A',tt)]});}
    },
    boost:{
      title:'Boost：能量、工作模式與電壓增益',knobs:[knob('io','輸出定電流負載',0.2,5,0.2,2,' A'),knob('duty','Duty',10,80,5,50,' %'),knob('vin','Vin',12,72,4,48,' V'),knob('l','電感',40,300,20,100,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想非同步 Boost、固定 Duty、定電流負載；小漣波與動態未納入，不等於實測效率或元件安全裕度。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,di=v.vin*d/(L*fs),iinC=v.io/(1-d),mode=iinC>di/2+1e-9?'CCM':iinC<di/2-1e-9?'DCM':'BCM',vo=mode==='DCM'?v.vin+v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin/(1-d);
        var peak=mode==='CCM'?iinC+di/2:di,valley=mode==='CCM'?Math.max(0,iinC-di/2):0,fw=mode==='DCM'?v.vin*d/(vo-v.vin):1-d,zero=clamp(1-d-fw,0,1),IL=function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:0;};
        return result([metric('理想 Vout',vo,' V'),metric('IL Peak',peak,' A'),metric('BCM 輸出 Io',.5*di*(1-d),' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：不可沿用 CCM 的 1/(1−D) 增益。':'ON 儲能、OFF 由輸入與電感一起向輸出送能。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'boost'},series:[trace('PWM','V',function(t){return t<d?v.vin:0;}),trace('VL','V',function(t){return t<d?v.vin:t<d+fw?v.vin-vo:0;}),trace('IL','A',IL)]});}
    },
    buckboost:{
      title:'反相 Buck-Boost：CCM／DCM',knobs:[knob('io','輸出定電流負載',0.1,4,0.1,2,' A'),knob('duty','Duty',10,80,5,40,' %'),knob('vin','Vin',12,60,4,24,' V'),knob('l','電感',40,300,20,100,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想非同步反相 Buck-Boost、固定 Duty、輸出定電流負載。Vout 為負；忽略 ESR、效率及控制暫態。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,di=v.vin*d/(L*fs),bound=v.vin*d*(1-d)/(2*L*fs),mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM',mag=mode==='DCM'?v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin*d/(1-d);
        var fw=mode==='DCM'?v.vin*d/mag:1-d,zero=clamp(1-d-fw,0,1),avg=v.io/(1-d),peak=mode==='CCM'?avg+di/2:di,valley=mode==='CCM'?Math.max(0,avg-di/2):0;
        return result([metric('反相輸出 Vout',-mag,' V'),metric('IL Peak',peak,' A'),metric('BCM 輸出 Io',bound,' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：需要第三段零電流時間，電壓不服從 CCM 轉壓比。':'輸出極性與輸入相反。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'buckboost'},series:[trace('PWM','V',function(t){return t<d?v.vin:0;}),trace('IL','A',function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:0;})]});}
    },
    bridge:{
      title:'H-Bridge：橋臂、PWM 與四象限',knobs:[knob('da','A 臂高電位 Duty',0,100,5,75,' %'),knob('db','B 臂高電位 Duty',0,100,5,25,' %'),knob('i','IAB 電流',-10,10,1,2,' A'),knob('bipolar','雙極性互補模式',0,1,1,0,'')],
      assumption:'理想同步前緣 PWM，單極性同載波比較或雙極性 A/B 瞬時互補；忽略死區、二極體續流、換向瞬態與 Bus 回生吸收限制。',
      compute:function(v){var a=v.da/100,b=v.bipolar?1-a:v.db/100,avg=v.bipolar?(2*a-1)*100:(a-b)*100,p=avg*v.i,mode=v.bipolar?'雙極性互補':'同載波單極性';
        return result([metric('平均差動 VAB',avg,' V'),metric('平均輸出功率',p,' W'),metric('A 臂平均電壓',a*100,' V')],
          mode+'；'+(p<0?'負載回送能量，DC Bus 必須可吸收。':'平均功率方向由 VAB 與 IAB 共同決定。'),{series:[trace('VA','V',function(t){return t<a?100:0;}),trace('VB','V',function(t){return (v.bipolar?t>=a:t<b)?100:0;}),trace('VAB','V',function(t){return (t<a?100:0)-((v.bipolar?t>=a:t<b)?100:0);})],stage:{kind:'bridge',on:a,mode:mode}});}
    },
    flyback:{
      title:'Flyback：激磁、放能與工作模式',knobs:[knob('io','輸出定電流負載',0.1,4,0.1,1.5,' A'),knob('duty','Duty',10,70,5,40,' %'),knob('vin','Vin',24,240,12,96,' V'),knob('ratio','Np／Ns',1,6,0.5,2,''),knob('lm','磁化電感',100,600,50,200,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想隔離 Flyback、固定 Duty、定電流輸出、無漏感及寄生；VDS 只計理想反射電壓，不含 Spike 或 Clamp 動態。',
      compute:function(v){var d=v.duty/100,L=v.lm*1e-6,fs=v.freq*1000,n=v.ratio,di=v.vin*d/(L*fs),bound=n*di*(1-d)/2,mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM';
        var vo=mode==='DCM'?v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin*d/(n*(1-d)),fw=mode==='DCM'?v.vin*d/(n*vo):1-d,zero=clamp(1-d-fw,0,1),avg=v.io/(n*(1-d)),peak=mode==='CCM'?avg+di/2:di,valley=mode==='CCM'?Math.max(0,avg-di/2):0;
        return result([metric('理想輸出 Vout',vo,' V'),metric('理想 OFF VDS',v.vin+n*vo,' V'),metric('磁化電流 Peak',peak,' A'),metric('BCM 輸出 Io',bound,' A')],
          mode==='DCM'?'DCM：OFF 退磁結束後第三段零電流。':'ON 時激磁、OFF 時經二次側放能。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'flyback'},series:[trace('Primary Gate','V',function(t){return t<d?v.vin:0;}),trace('磁化電流','A',function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:0;})]});}
    },
    core:{
      title:'伏秒、匝數與磁通密度擺幅',knobs:[knob('vin','一次側 ON 電壓',40,400,20,100,' V'),knob('duty','單次 ON Duty',10,50,5,40,' %'),knob('turns','一次側匝數',10,80,5,30,' 圈'),knob('area','Ae',50,300,25,150,' mm²'),knob('freq','頻率',25,250,25,100,' kHz')],
      assumption:'理想均勻磁通，ΔB=Vton/(NAe) 只算單次 ON 的磁通擺幅；非材料 Bsat、B-H 回線及鐵損模型。',
      compute:function(v){var deltaB=v.vin*(v.duty/100)/(v.turns*v.area*1e-6*v.freq*1000);
        return result([metric('單次 ΔB',deltaB,' T',3),metric('ON 伏秒',v.vin*(v.duty/100)/(v.freq*1000)*1e6,' V·μs'),metric('ON 時間',1000*v.duty/100/v.freq,' μs')],
          '提高匝數或有效截面可降低每次 ON 期間的磁通擺幅。',{warning:deltaB>0.2?'ΔB > 0.2 T：教學提示，非實際飽和判定。':''});}
    }
  };

  /* Every published lesson resolves to a concrete model and an individual investigation. */
  var C={
    power:['signed','反轉參考電流時，瞬時功率方向如何改變？','i'],
    rms:['sine','增加峰值後，RMS 會怎麼變？','vp'],
    pqs:['powerFactor','基波電流落後角變大，總 PF 怎麼變？','angle'],
    threephase:['phases','改變觀察相位，瞬時線電壓如何變化？','phase'],
    fourier:['harmonics','增加三次諧波會如何改變總 THD？','h3'],
    thd:['harmonics','增加第三諧波，RMS 與失真率如何變化？','h3'],
    ampere:['magnetic','氣隙增大時，同樣 NI 能維持相同 B 嗎？','gap'],
    bh:['magnetic','線性磁路模型的 B 是否能直接當作飽和判定？','amps'],
    reluctance:['magnetic','增加氣隙使磁阻變大時，L 如何改變？','gap'],
    faraday:['faraday','B(t) 變化更快時，感應電壓峰值如何改變？','freq'],
    inductor:['magnetic','匝數改變時，線性模型的 L 如何改變？','turns'],
    transformer:['transformer','提高一次／二次匝比，次級電壓如何改變？','ratio'],
    blocks:['efficiency','效率降低時，固定輸出功率需要多大的輸入功率？','eta'],
    linear:['efficiency','同樣 Pout 下，轉換效率改變對熱損有何影響？','eta'],
    pwm:['pwm','延長 PWM 導通比例，平均開關節點電壓怎麼變？','duty'],
    timing:['timing','控制路徑延遲增加時，佔週期比例會怎麼變？','delay'],
    diodes:['diode','正向電流上升，簡化導通損耗如何變化？','i'],
    legacy:['rectifier','由半波改成全波，理想平均整流電壓如何變化？','full'],
    mosfet:['semiconductor','通電電流提高時，MOSFET I²R 損耗如何變化？','current'],
    switchloss:['switching','單次 Eon/Eoff 變大時，總切換損耗如何變化？','energy'],
    igbt:['semiconductor','同樣電流下 IGBT 與 MOSFET 的導通損耗差怎麼變？','current'],
    wbg:['switching','降低單次切換能量時，固定頻率的切換損耗如何變化？','energy'],
    half:['rectifier','半波整流的電壓平均值由哪段波形貢獻？','vac'],
    bridge:['rectifier','全波相較半波，輸出正半週如何變化？','full'],
    overlap:['sourceL','源側電感變大，指定 di/dt 所需的電感壓降如何變化？','l'],
    capacitor:['capRipple','電容增加時，小漣波公式預測 ΔV 如何改變？','cap'],
    notching:['sourceL','換向電流斜率增加時，PCC 可能受到的電感壓降如何變化？','didt'],
    neutral:['neutral','提高三次零序諧波，平衡系統的中性線電流如何改變？','h3'],
    sixpulse:['threeRect','三相相位移動時，最大最小相的導通組合如何切換？','phase'],
    harmonics:['threeRect','觀察理想六脈波 VDC 的週期性波動。','phase'],
    commutation:['sourceL','換向迴路 Ls 增大，對電流變換速度有何約束？','l'],
    bus:['capRipple','DC Bus 電容越大，小漣波公式預測如何改變？','cap'],
    op:['op','反相增益增加時，輸出是否可能碰到供電限制？','gain'],
    diff:['diff','差動輸入增加時，理想差動輸出會如何變化？','vdiff'],
    filter:['filter','電阻增大時，一階 RC 截止頻率如何改變？','r'],
    differentiator:['filter','先用 RC 的截止頻率看頻寬限制，能否直接把它當理想微分器？','r'],
    pi:['pi','Kp 變大時，指定頻率下 PI 幅值如何變化？','kp'],
    adc:['adc','電流從負值變正值時，ADC 腳位電壓與 code 怎麼變？','i'],

    'mid-topologies':['topology','同樣 Vin 下改變 Duty，三種拓樸的輸出有何差別？','duty'],
    'mid-buck-pwm':['buck','負載固定時改變 Duty，Buck 的穩態電壓如何變化？','duty'],
    'mid-switching-lc':['lc','L 變大時，理想 LC 自然頻率怎麼變？','l'],
    'mid-resonance':['lc','阻尼降低（Q 增加）時，二階系統的峰值行為如何改變？','q'],
    'mid-voltsecond':['buck','改變 Duty，ON 正伏秒與 OFF 負伏秒如何重新平衡？','duty'],
    'mid-ccm-dcm':['buck','減小負載電流，IL 何時會出現第三段零電流？','io'],
    'mid-bcm':['buck','把 Io 逐步調到 BCM 臨界值，IL 谷值會如何變化？','io'],
    'mid-buck-dcm':['buck','進入 DCM 後，Vout 還等於 D×Vin 嗎？','io'],
    'mid-boost-ccm':['boost','Boost 的 ON/OFF 區間各由誰供應負載？','duty'],
    'mid-boost-ripple':['boost','固定 L 時 Duty 提高，電感峰值與三段時間如何變化？','duty'],
    'mid-boost-rl':['boost','先觀察理想升壓增益：實際銅損為何會使曲線下降？','duty'],
    'mid-boost-efficiency':['boost','增大 Duty 後，為何不能把理想 Vout 當成實際可達輸出？','duty'],
    'mid-boost-parasitic':['switching','增大單次開關損耗，Boost 元件熱負擔如何改變？','energy'],
    'mid-boost-dcm':['boost','減少負載後，Boost 何時離開 CCM？','io'],
    'mid-buckboost-ccm':['buckboost','增加 Duty，反相輸出電壓與 IL 如何變化？','duty'],
    'mid-buckboost-dcm':['buckboost','降低 Io 後，反相 Buck-Boost 的 DCM 比例如何改變？','io'],
    'mid-sepic-zeta':['topology','對照基本升降壓轉壓比，這些拓樸的極性差異是什麼？','duty'],
    'mid-four-switch':['topology','固定 Vin 改變 Duty，升降壓理想增益區如何切換？','duty'],
    'mid-bidirectional':['signed','反轉電流正負後，功率方向如何改變？','i'],
    'mid-quadrants':['bridge','維持 VAB 為正、反轉 IAB，功率象限會如何切換？','i'],
    'mid-motor-hbridge':['bridge','改變 A/B 橋臂 Duty，平均負載電壓如何變化？','da'],
    'mid-bipolar':['bridge','切換瞬時互補模式後，VAB 會出現哪些電平？','bipolar'],
    'mid-unipolar':['bridge','單極性橋臂 Duty 改變時，VAB 的零狀態如何改變？','da'],
    'mid-isolated-types':['transformer','匝比增加時，隔離變壓器的理想二次電壓如何變化？','ratio'],
    'mid-isolation-feedback':['op','回授放大器增益提高時，線性輸出電壓如何變化？','gain'],
    'mid-multi-output':['transformer','單組輸入透過不同匝比得到多少理想二次電壓？','ratio'],
    'mid-flyback-ccm':['flyback','ON 時存入磁化電感的電流，OFF 時如何釋出？','duty'],
    'mid-flyback-dcm':['flyback','減少 Io，退磁結束後會不會出現零電流區間？','io'],
    'mid-forward-reset':['core','每次 ON 伏秒增加時，磁通擺幅如何變化？','duty'],
    'mid-double-forward':['core','增加匝數，理想正伏秒造成的 ΔB 如何降低？','turns'],
    'mid-half-full':['core','同樣一次側伏秒，磁芯截面增大如何影響 ΔB？','area'],
    'mid-pushpull':['core','兩側磁通不平衡可能累積偏磁：單次 ΔB 如何受電壓影響？','vin'],
    'mid-magnetization':['core','改變 ON Duty，單次磁通擺幅如何改變？','duty'],
    'mid-coreloss':['core','提高頻率時，單次 ΔB 估計如何改變？它能直接代表鐵損嗎？','freq']
  };

  function phaseLabel(stage,t) {
    if(!stage)return '';
    if(stage.kind==='bridge')return '橋臂瞬時高低電位：請同步觀察 VA、VB 與 VAB';
    if(t<stage.on-1e-8){
      if(stage.kind==='buck')return 'ON：Vin → MOSFET → L → Load，電感儲能';
      if(stage.kind==='boost')return 'ON：Vin → L → MOSFET → GND；輸出電容供應負載';
      if(stage.kind==='flyback')return 'ON：一次側磁化電感儲能，二次側整流二極體截止';
      if(stage.kind==='buckboost')return 'ON：Vin 使電感儲能，輸出電容供應負載';
      return 'PWM ON：開關節點為高電位';
    }
    if(t<stage.on+(stage.freewheel||stage.off||0)-1e-8){
      if(stage.kind==='buck')return 'OFF：L → Diode → Load 續流，電感放能';
      if(stage.kind==='boost')return 'OFF：Vin＋L → Diode → 輸出，電感放能';
      if(stage.kind==='flyback')return 'OFF：一次側關斷，二次側由變壓器放能';
      if(stage.kind==='buckboost')return 'OFF：電感經二極體向反相輸出放能';
      return 'PWM OFF：開關節點為低電位';
    }
    return 'ZERO：理想 DCM 電感電流為 0，主要由輸出電容供應負載';
  }
  function svgLine(data,w,h,yMin,yMax) {
    var range=yMax-yMin||1;
    return data.map(function(val,i){
      var x=50+(w-78)*i/(data.length-1),y=22+(h-54)*(yMax-val)/range;
      return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);
    }).join(' ');
  }
  var colors=['#159c81','#377bd5','#a176d9','#d49231'];
  function waveChart(series,cursor) {
    var w=700,h=series.length*115+24,markup='<svg class="interactive-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="同時間軸對齊的互動波形" xmlns="http://www.w3.org/2000/svg">';
    series.forEach(function(s,idx){
      var y=idx*115,lo=Math.min.apply(null,s.points),hi=Math.max.apply(null,s.points),pad=Math.max((hi-lo)*.1,.001);
      lo-=pad;hi+=pad;
      var plot=svgLine(s.points,w,104,lo,hi).replace(/(M|L)([\d.]+) ([\d.]+)/g,function(_,cmd,x,v){return cmd+x+' '+(Number(v)+y);});
      var at=s.points[Math.min(100,Math.round(cursor*100))];
      markup+='<rect x="45" y="'+(y+18)+'" width="632" height="62" rx="5" fill="currentColor" fill-opacity=".035"/>'+
        '<line x1="45" x2="677" y1="'+(y+80)+'" y2="'+(y+80)+'" stroke="currentColor" stroke-opacity=".12"/>'+
        '<text x="49" y="'+(y+14)+'" font-size="13" fill="currentColor">'+esc(s.label)+'  '+esc(fmt(at,3))+' '+esc(s.unit)+'</text>'+
        '<text x="683" y="'+(y+35)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".65">'+esc(fmt(hi,2))+'</text>'+
        '<text x="683" y="'+(y+79)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".65">'+esc(fmt(lo,2))+'</text>'+
        '<path d="'+plot+'" fill="none" stroke="'+colors[idx%colors.length]+'" stroke-width="2.8" stroke-linejoin="round"/>'+
        '<line x1="'+(50+622*cursor)+'" x2="'+(50+622*cursor)+'" y1="'+(y+19)+'" y2="'+(y+82)+'" stroke="#d49231" stroke-width="1.5" stroke-dasharray="4 3"/>';
    });
    markup+='</svg>';
    return markup;
  }
  function sweepChart(spec,v,focus,mainValue) {
    var kn=spec.knobs.find(function(k){return k.key===focus;})||spec.knobs[0];
    var xs=[],ys=[];
    for(var i=0;i<=80;i++){
      var copy=Object.assign({},v);copy[kn.key]=kn.min+(kn.max-kn.min)*i/80;
      var computed=spec.compute(copy);
      var y=computed.primary;
      if(Number.isFinite(y)){xs.push(i);ys.push(y);}
    }
    if(!ys.length)return '<div role="status">模型超出數值有效範圍。</div>';
    var w=700,lo=Math.min.apply(null,ys),hi=Math.max.apply(null,ys),pad=Math.max((hi-lo)*0.12,1e-8),range=hi-lo+2*pad,points=xs.map(function(x,i){
      return (i?'L':'M')+(50+x*7.7).toFixed(1)+' '+(184-(ys[i]-(lo-pad))/range*149).toFixed(1);
    }).join(' ');
    var xmark=50+616*(v[kn.key]-kn.min)/(kn.max-kn.min),ymark=184-(mainValue-(lo-pad))/range*149;
    return '<svg class="interactive-svg" viewBox="0 0 700 222" role="img" aria-label="'+esc(kn.label)+' 對 '+esc(spec.title)+' 模型主要輸出影響曲線">'+
      '<rect x="46" y="28" width="622" height="164" rx="6" fill="currentColor" fill-opacity=".035"/>'+
      '<path d="'+points+'" fill="none" stroke="#159c81" stroke-width="3" stroke-linejoin="round"/>'+
      '<line x1="'+xmark.toFixed(1)+'" y1="28" x2="'+xmark.toFixed(1)+'" y2="192" stroke="#d49231" stroke-width="1.5" stroke-dasharray="5 4"/>'+
      (Number.isFinite(ymark)?'<circle cx="'+xmark.toFixed(1)+'" cy="'+ymark.toFixed(1)+'" r="5" fill="#d49231"/>':'')+
      '<text x="46" y="18" font-size="12" fill="currentColor">'+esc(spec.title)+' · 第一項輸出</text>'+
      '<text x="46" y="210" font-size="12" fill="currentColor">'+esc(fmt(kn.min))+' '+esc(kn.unit)+'</text>'+
      '<text x="668" y="210" text-anchor="end" font-size="12" fill="currentColor">'+esc(fmt(kn.max))+' '+esc(kn.unit)+'</text>'+
      '</svg>';
  }
  function mount(chapter,lesson,host) {
    if(!host)return;
    var entry=C[lesson.id];
    if(!entry||!M[entry[0]]) {
      host.textContent='本節互動模型尚未設定，請勿以其他章節模型替代。';
      return;
    }
    var spec=M[entry[0]],focus=entry[2],knobs=spec.knobs.slice(),first=knobs.find(function(k){return k.key===focus;});
    if(!first){host.textContent='互動參數設定錯誤';return;}
    var v={};knobs.forEach(function(k){v[k.key]=k.value;});
    var baseline=spec.compute(v).primary,guess=null,changed=false,cursor=.25;
    host.innerHTML='<div class="interactive-head"><span class="pill">ACTIVE LEARNING</span><h3>'+esc(spec.title)+'</h3>'+
      '<p>'+esc(entry[1])+'</p></div>'+
      '<div class="interactive-prediction"><strong>先預測：調整「'+esc(first.label)+'」後，第一項輸出會？</strong>'+
      '<div class="interactive-choices"><button type="button" class="btn btn-muted" data-predict="up">增加</button>'+
      '<button type="button" class="btn btn-muted" data-predict="down">減少</button><button type="button" class="btn btn-muted" data-predict="same">不變</button></div>'+
      '<p class="interactive-feedback" aria-live="polite">選擇預測，再拖曳對應參數驗證。</p></div>'+
      '<div class="interactive-knobs">'+knobs.map(function(k){return '<label class="interactive-knob"><span>'+esc(k.label)+'</span><strong data-knob-value="'+esc(k.key)+'">'+esc(fmt(k.value))+' '+esc(k.unit)+'</strong>'+
        '<input type="range" min="'+k.min+'" max="'+k.max+'" step="'+k.step+'" value="'+k.value+'" data-knob="'+esc(k.key)+'" aria-label="'+esc(k.label)+'"></label>';}).join('')+'</div>'+
      '<div class="interactive-metrics" aria-live="polite"></div><div class="interactive-chart"></div>'+
      '<div class="interactive-clock" hidden><label>同步時間游標：<strong data-cursor-value>25%</strong>'+
      '<input type="range" min="0" max="100" step="1" value="25" data-time aria-label="波形時間游標"></label></div>'+
      '<p class="interactive-stage" aria-live="polite"></p><p class="interactive-note"></p><p class="interactive-warning" role="status" hidden></p>'+
      '<p class="interactive-assumptions"><strong>模型條件：</strong>'+esc(spec.assumption)+'</p>'+
      '<button type="button" class="btn btn-muted interactive-reset">重設實驗與預測</button>';
    var prediction=host.querySelector('.interactive-feedback');
    function refresh(){
      var r=spec.compute(v),units=r.metrics.map(function(item){return '<div class="interactive-metric"><small>'+esc(item.label)+'</small><strong>'+esc(fmt(item.value,item.digits))+' '+esc(item.unit)+'</strong></div>';}).join('');
      host.querySelector('.interactive-metrics').innerHTML=units;
      host.querySelectorAll('[data-knob-value]').forEach(function(node){
        var key=node.getAttribute('data-knob-value'),k=knobs.find(function(x){return x.key===key;});
        node.textContent=fmt(v[key])+' '+k.unit;
      });
      host.querySelector('.interactive-chart').innerHTML=r.series?waveChart(r.series,cursor):sweepChart(spec,v,focus,r.primary);
      host.querySelector('.interactive-clock').hidden=!r.series;
      host.querySelector('.interactive-stage').textContent=r.stage?phaseLabel(r.stage,cursor):'';
      host.querySelector('.interactive-note').textContent=r.note||'';
      var warn=host.querySelector('.interactive-warning');warn.hidden=!r.warning;warn.textContent=r.warning||'';
      if(changed&&guess){
        var tolerance=Math.max(1e-7,Math.abs(baseline)*1e-7),delta=r.primary-baseline,observed=delta>tolerance?'up':delta< -tolerance?'down':'same';
        var textValue={up:'增加',down:'減少',same:'不變'};
        prediction.textContent=(guess===observed?'符合預測。':'與預測不同，重新觀察。')+
          '基準 '+fmt(baseline,3)+' → 現在 '+fmt(r.primary,3)+'；觀察結果：'+textValue[observed]+'。';
      }else if(changed)prediction.textContent='已調整參數；先選擇預測，或重設實驗再預測。';
      else prediction.textContent=guess?'預測已記錄。請拖曳「'+first.label+'」觀察結果。':'選擇預測，再拖曳對應參數驗證。';
    }
    host.querySelectorAll('[data-knob]').forEach(function(input){
      input.addEventListener('input',function(){
        v[input.dataset.knob]=Number(input.value);
        if(input.dataset.knob===focus && v[focus]!==first.value)changed=true;
        refresh();
      });
    });
    host.querySelectorAll('[data-predict]').forEach(function(button){
      button.addEventListener('click',function(){
        guess=button.dataset.predict;
        host.querySelectorAll('[data-predict]').forEach(function(node){node.setAttribute('aria-pressed',String(node===button));});
        refresh();
      });
    });
    host.querySelector('[data-time]').addEventListener('input',function(ev){
      cursor=Number(ev.target.value)/100;
      host.querySelector('[data-cursor-value]').textContent=Math.round(cursor*100)+'%';
      refresh();
    });
    host.querySelector('.interactive-reset').addEventListener('click',function(){
      knobs.forEach(function(k){v[k.key]=k.value;host.querySelector('[data-knob="'+k.key+'"]').value=String(k.value);});
      guess=null;changed=false;cursor=.25;
      host.querySelector('[data-time]').value='25';
      host.querySelector('[data-cursor-value]').textContent='25%';
      host.querySelectorAll('[data-predict]').forEach(function(node){node.setAttribute('aria-pressed','false');});
      refresh();
    });
    refresh();
  }
  window.EE_INTERACTIVE={mount:mount,catalog:C,models:M};
})();
