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
  function trace(label,unit,fn,step) {
    var points=[];
    for(var i=0;i<=100;i++) points.push(fn(i/100));
    return {label:label,unit:unit,points:points,step:Boolean(step)};
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
      assumption:'對稱三相 ABC 正相序、理想純正弦；相位旋鈕是起始角，時間游標 t/T 對應額外 360°×t/T，所有數值與波形取自同一觀測時刻。',
      compute:function(v){
        var a=v.phase*Math.PI/180,pk=v.vrms*Math.SQRT2;
        function stateAt(t){
          var fraction=t>=1?0:t,angle=a+2*Math.PI*fraction,deg=((v.phase+360*fraction)%360+360)%360;
          var va=pk*Math.sin(angle),vb=pk*Math.sin(angle-2*Math.PI/3),vc=pk*Math.sin(angle+2*Math.PI/3);
          return {va:va,vb:vb,vc:vc,vab:va-vb,angleDegrees:deg};
        }
        function probe(t){
          var st=stateAt(t);
          return {metrics:[metric('當下 VAB',st.vab,' V'),metric('線電壓 RMS',Math.sqrt(3)*v.vrms,' V')],
            note:'游標電角度 '+fmt(st.angleDegrees,1)+'°；VAB = VA − VB，VA='+fmt(st.va,2)+' V、VB='+fmt(st.vb,2)+' V。',
            angleDegrees:st.angleDegrees,va:st.va,vb:st.vb,vc:st.vc};
        }
        return result(probe(0).metrics,'線電壓是同一瞬間兩條相電壓的差；拖曳游標時數值、波形同步更新。',
          {probe:probe,series:[trace('VA','V',function(t){return stateAt(t).va;}),
            trace('VB','V',function(t){return stateAt(t).vb;}),
            trace('VC','V',function(t){return stateAt(t).vc;}),
            trace('VAB','V',function(t){return stateAt(t).vab;})]});
      }
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
        return result([metric('線性模型 L',L*1e3,' mH',3),metric('線性模型 B',B,' T',3),metric('線性模型儲能 ½LI²',.5*L*v.amps*v.amps*1000,' mJ',3)],
          '增加氣隙會增大磁阻；固定匝數時 L 通常下降。超過 0.3 T 時數值僅是固定導磁率的數學外插。',{validity:{scorable:B<=0.3,status:B<=0.3?'IN_DOMAIN':'LINEAR_EXTRAPOLATION'},warning:B>0.3?'固定 μ 模型外插（B > 0.3 T 教學門檻）：此 B、L 與儲能非實際磁芯工作點，禁止用於有效預測評分或磁芯選型。':''});}
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
          '增加 Duty 會延長 ON 區間。',{series:[trace('Vsw 開關節點','V',function(t){return (t>=1?0:t)<d?24:0;},true),trace('理想平均','V',function(){return 24*d;})],stage:{on:d,off:1-d,kind:'pwm'}});}
    },
    timing:{
      title:'取樣與控制時序預算',knobs:[knob('delay','從觸發到生效延遲',0,25,0.5,2,' μs'),knob('freq','控制頻率',20,200,10,100,' kHz')],
      assumption:'只計算週期相對延遲；不代表實際 MCU 的 ADC、ISR、PWM shadow 更新或 closed-loop phase margin。',
      compute:function(v){var T=1000/v.freq,ratio=v.delay/T;
        return result([metric('占週期比例',100*ratio,' %'),metric('控制週期',T,' μs'),metric('剩餘週期時間',T-v.delay,' μs')],
          '總延遲需要逐一量測；若超過週期，控制資料可能跨週期生效。',{warning:ratio>=1?'延遲已達或超過一個更新週期，需重新確認確定性時序。':''});}
    },
    semiconductor:{
      title:'MOSFET 與 IGBT 導通損耗比較',knobs:[knob('current','通電電流',1,30,1,10,' A'),knob('rds','MOSFET RDS(on)',2,80,2,16,' mΩ'),knob('vce','IGBT 假設 VCE(sat)',1,3,0.2,2,' V')],
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
      title:'半波與全波整流',knobs:[knob('vac','輸入電壓 RMS',12,228,6,48,' V'),knob('full','全波模式 0=半波 1=全波',0,1,1,1,'')],
      assumption:'理想二極體、純電阻負載、無濾波電容；輸出平均值不等於加電容後的 DC Bus。',
      compute:function(v){var pk=v.vac*Math.SQRT2,full=Boolean(v.full),f=full?2:1;
        return result([metric('平均整流電壓',pk*f/Math.PI,' V'),metric('輸入峰值',pk,' V'),metric('正半週平均輸出',2*pk/Math.PI,' V'),metric('負半週平均輸出',full?2*pk/Math.PI:0,' V')],
          full?'全波每個半週都有脈動。':'半波只有正半週供電。',{series:[trace('輸入 AC','V',function(t){return pk*sin(t);}),trace('負載電壓','V',function(t){var a=pk*sin(t);return full?Math.abs(a):Math.max(a,0);})]});}
    },
    capRipple:{
      title:'整流後電容漣波近似',knobs:[knob('cap','輸出電容',220,2200,110,1650,' μF'),knob('load','負載電流',0.1,3,0.1,1,' A')],
      assumption:'50 Hz 全波、固定電流負載、Vpeak=24√2 V。ΔV≈I/(2fC) 只適用小漣波近似，非充電尖峰電流精確模擬。',
      compute:function(v){var dv=v.load/(100*v.cap*1e-6),pk=24*Math.SQRT2,valid=dv/pk<=0.2;
        var values=[metric('有效小漣波估計 ΔV',valid?dv:NaN,' V'),
          metric('ΔV／Vpeak',100*dv/pk,' %'),metric('輸入峰值',pk,' V')];
        if(!valid)values.push(metric('超域公式外插（不可用於設計）',dv,' V'));
        return result(values,
          valid?'此處小漣波近似可作教學估算。':'超出教學近似門檻，勿將估計當成實際 DC 電壓。',{validity:{scorable:valid,status:valid?'IN_DOMAIN':'OUT_OF_DOMAIN'},warning:valid?'':'ΔV／Vpeak > 20%；超出本站小漣波教學模型，不能把外插值當成有效漣波估值或預測正確的依據。'});}
    },
    sourceL:{
      title:'交流源電感與換向壓降',knobs:[knob('l','源側電感',1,196,5,26,' μH'),knob('didt','電流變化率',0.1,15,0.1,2,' A/μs')],
      assumption:'僅估算元件瞬時電感電壓大小 |vL|=L|di/dt|；不能代替整流器重疊角、PCC Notch 深度與完整換向解。',
      compute:function(v){return result([metric('電感電壓幅值',v.l*v.didt,' V')], '電流無法瞬間跳變；電感壓降會影響換向。');}
    },
    threeRect:{
      title:'理想三相六脈波整流',knobs:[knob('phase','觀察電角度',0,360,10,30,' °'),knob('vrms','相電壓 RMS',100,240,10,220,' V')],
      assumption:'理想平衡三相、無源側電感、無導通壓降、無儲能電容；VDC=max(VA,VB,VC)−min(VA,VB,VC)。相位為起始角，游標增加 360°×t/T；相電壓相等處只知換相候選，無法決定瞬時分流。',
      compute:function(v){
        var a=v.phase*Math.PI/180,pk=v.vrms*Math.SQRT2,names=['A','B','C'],avg=3*Math.sqrt(6)/Math.PI*v.vrms;
        function stateAt(t){
          var fraction=t>=1?0:t,angle=a+2*Math.PI*fraction,deg=((v.phase+360*fraction)%360+360)%360;
          var values=[pk*Math.sin(angle),pk*Math.sin(angle-2*Math.PI/3),pk*Math.sin(angle+2*Math.PI/3)];
          var vmax=Math.max.apply(null,values),vmin=Math.min.apply(null,values);
          // Purely numerical tie tolerance; not a physical commutation-overlap angle.
          var tol=Math.max(1e-8,pk*1e-9),upper=[],lower=[];
          for(var i=0;i<3;i++){
            if(Math.abs(values[i]-vmax)<=tol)upper.push(names[i]);
            if(Math.abs(values[i]-vmin)<=tol)lower.push(names[i]);
          }
          return {values:values,vdc:vmax-vmin,upper:upper,lower:lower,
            angleDegrees:deg,boundary:upper.length>1||lower.length>1};
        }
        function probe(t){
          var st=stateAt(t);
          return {metrics:[metric('當下 DC 輸出',st.vdc,' V'),metric('平均 DC 輸出',avg,' V')],
            note:'游標電角度 '+fmt(st.angleDegrees,1)+'°；上橋二極體：'+st.upper.join('／')+' 相；下橋二極體：'+st.lower.join('／')+' 相。'+
              (st.boundary?'換相邊界：理想無換相重疊模型僅標示候選相，無法決定瞬間電流分配。':'理想最高／最低相導通，未計換相重疊。'),
            angleDegrees:st.angleDegrees,upper:st.upper,lower:st.lower,boundary:st.boundary,
            va:st.values[0],vb:st.values[1],vc:st.values[2]};
        }
        return result(probe(0).metrics,
          '上橋二極體接最高相，下橋二極體接最低相；實際導通相與換相邊界請看同步時間游標。',
          {probe:probe,series:[trace('VA','V',function(t){return stateAt(t).values[0];}),
            trace('VB','V',function(t){return stateAt(t).values[1];}),
            trace('VC','V',function(t){return stateAt(t).values[2];}),
            trace('VDC','V',function(t){return stateAt(t).vdc;})]});
      }
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
        return result([metric('輸出電壓（示意）',limited,' V'),metric('理想未限制輸出',y,' V'),metric('理想裁切狀態',y!==limited?1:0,' 0/1',0)],
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
      title:'反相 PI 補償器頻率響應',knobs:[knob('kp','Kp',0.1,5,0.1,1,''),knob('ki','Ki',10,3000,10,600,' s⁻¹'),knob('f','分析頻率',10,2000,10,100,' Hz')],
      assumption:'連續時間反相補償器 G(s)=−(Kp+Ki/s)，相位使用補償器輸入到輸出的參考定義；只計算補償器，不包含功率級、ADC、PWM 或閉迴路穩定性。',
      compute:function(v){var b=v.ki/(2*Math.PI*v.f),mag=Math.hypot(v.kp,b);
        return result([metric('PI 幅值',mag,' V/V',3),metric('反相 PI 相位',180-Math.atan2(b,v.kp)*180/Math.PI,' °'),metric('PI 零點頻率',v.ki/(2*Math.PI*v.kp),' Hz')],
          '反相 PI 的相位採 +90° 至 +180° 分支；若重新定義誤差極性，需一併更新傳遞函數符號。');}
    },
    adc:{
      title:'Shunt、偏壓與 ADC 量化',knobs:[knob('i','待量測電流',-30,30,1,10,' A'),knob('gain','差動放大增益',5,20,1,14,'')],
      assumption:'Rshunt=5 mΩ、偏壓=1.5 V、12-bit ADC、理想 0–3 V 輸入；假設 4096 等間距量化區間，Code=floor(4096×Vadc/3)，最高輸入端點限制為 4095，非指定 MCU 的 ADCRESULT 轉移曲線。超界不輸出有效 ADC code；不代表硬體腳位已受保護。',
      compute:function(v){var vad=1.5+.005*v.i*v.gain,valid=vad>=0&&vad<=3,code=valid?Math.min(4095,Math.floor(vad/3*4096)):NaN;
        return result([metric('ADC 腳電壓',vad,' V',3),metric('理想有效 Code',code,' count',0)],
          valid?'符合模型設定的 ADC 輸入範圍。':'ADC 超出輸入範圍，不可將理論轉換碼當成有效資料。',{validity:{scorable:valid,status:valid?'IN_DOMAIN':'OUT_OF_DOMAIN'},warning:valid?'':'輸入超出 0–3 V；需額外確認前端保護及絕對最大額定值。'});}
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
      title:'Buck：PWM／CCM／BCM／DCM',knobs:[knob('io','輸出定電流負載',0.05,5,0.05,0.5,' A'),knob('duty','Duty',10,90,5,50,' %'),knob('vin','Vin',12,60,4,24,' V'),knob('l','電感',20,300,20,100,' μH'),knob('freq','開關頻率',25,250,25,100,' kHz')],
      assumption:'理想非同步 Buck、固定 Duty、定電流負載之穩態三區間模型。Gate 指令為 0/1（非 VGS），Vsw 是開關節點對地電壓；忽略寄生、電容漣波、暫態與同步整流負電流。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,voC=v.vin*d,diC=v.vin*d*(1-d)/(L*fs),bound=diC/2,mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM';
        var vo=mode==='DCM'?v.vin/(1+2*L*fs*v.io/(v.vin*d*d)):voC,di=(v.vin-vo)*d/(L*fs),peak=mode==='CCM'?v.io+di/2:di,valley=mode==='CCM'?Math.max(0,v.io-di/2):0;
        var fw=mode==='DCM'?d*(v.vin/vo-1):1-d,zero=clamp(1-d-fw,0,1),tt=function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:(mode==='CCM'?valley:0);};
        return result([metric('理想 Vout',vo,' V'),metric('IL Peak',peak,' A'),metric('IL Valley',valley,' A'),metric('BCM 臨界 Io',bound,' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：電流歸零後第三區間不再續流，Vout≠D·Vin。':mode==='BCM'?'BCM：谷值恰為零，為 CCM 與 DCM 分界。':'CCM：電感電流不歸零。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'buck'},series:[trace('Gate 指令','0/1',function(t){return (t>=1?0:t)<d?1:0;},true),trace('Vsw 開關節點','V',function(t){t=t>=1?0:t;return t<d?v.vin:t<d+fw?0:vo;},true),trace('VL 電感兩端','V',function(t){t=t>=1?0:t;return t<d?v.vin-vo:t<d+fw?-vo:0;},true),trace('IL','A',tt)]});}
    },
    boost:{
      title:'Boost：能量、工作模式與電壓增益',knobs:[knob('io','輸出定電流負載',0.2,5,0.2,0.8,' A'),knob('duty','Duty',10,80,5,50,' %'),knob('vin','Vin',12,72,4,48,' V'),knob('l','電感',40,300,20,100,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想非同步 Boost、固定 Duty、定電流負載；Gate 指令為 0/1（非 VGS），Vsw 為 MOSFET Drain 開關節點，DCM 歸零區忽略寄生振鈴；小漣波與動態未納入。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,di=v.vin*d/(L*fs),iinC=v.io/(1-d),mode=iinC>di/2+1e-9?'CCM':iinC<di/2-1e-9?'DCM':'BCM',vo=mode==='DCM'?v.vin+v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin/(1-d);
        var peak=mode==='CCM'?iinC+di/2:di,valley=mode==='CCM'?Math.max(0,iinC-di/2):0,fw=mode==='DCM'?v.vin*d/(vo-v.vin):1-d,zero=clamp(1-d-fw,0,1),IL=function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:(mode==='CCM'?valley:0);};
        return result([metric('理想 Vout',vo,' V'),metric('IL Peak',peak,' A'),metric('IL Valley',valley,' A'),metric('BCM 輸出 Io',.5*di*(1-d),' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：不可沿用 CCM 的 1/(1−D) 增益。':'ON 儲能、OFF 由輸入與電感一起向輸出送能。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'boost'},series:[trace('Gate 指令','0/1',function(t){return (t>=1?0:t)<d?1:0;},true),trace('Vsw 開關節點','V',function(t){t=t>=1?0:t;return t<d?0:t<d+fw?vo:v.vin;},true),trace('VL 電感兩端','V',function(t){t=t>=1?0:t;return t<d?v.vin:t<d+fw?v.vin-vo:0;},true),trace('IL','A',IL)]});}
    },
    buckboost:{
      title:'反相 Buck-Boost：CCM／DCM',knobs:[knob('io','輸出定電流負載',0.1,4,0.1,0.5,' A'),knob('duty','Duty',10,80,5,40,' %'),knob('vin','Vin',12,60,4,24,' V'),knob('l','電感',40,300,20,100,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想非同步反相 Buck-Boost、固定 Duty、輸出定電流負載。Vout 為負；忽略 ESR、效率及控制暫態。',
      compute:function(v){var d=v.duty/100,L=v.l*1e-6,fs=v.freq*1000,di=v.vin*d/(L*fs),bound=v.vin*d*(1-d)/(2*L*fs),mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM',mag=mode==='DCM'?v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin*d/(1-d);
        var fw=mode==='DCM'?v.vin*d/mag:1-d,zero=clamp(1-d-fw,0,1),avg=v.io/(1-d),peak=mode==='CCM'?avg+di/2:di,valley=mode==='CCM'?Math.max(0,avg-di/2):0;
        return result([metric('反相輸出 Vout',-mag,' V'),metric('IL Peak',peak,' A'),metric('BCM 輸出 Io',bound,' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：需要第三段零電流時間，電壓不服從 CCM 轉壓比。':'輸出極性與輸入相反。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'buckboost'},series:[trace('Gate 指令','0/1',function(t){return (t>=1?0:t)<d?1:0;},true),trace('VL 電感兩端','V',function(t){t=t>=1?0:t;return t<d?v.vin:t<d+fw?-mag:0;},true),trace('IL','A',function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:(mode==='CCM'?valley:0);})]});}
    },
    bridge:{
      title:'H-Bridge：橋臂、PWM 與四象限',knobs:[knob('da','A 臂高電位 Duty',0,100,5,75,' %'),knob('db','B 臂高電位 Duty',0,100,5,25,' %'),knob('i','IAB 電流',-10,10,1,2,' A'),knob('bipolar','雙極性互補模式',0,1,1,0,'')],
      assumption:'理想同步前緣 PWM，單極性同載波比較或雙極性 A/B 瞬時互補；忽略死區、二極體續流、換向瞬態與 Bus 回生吸收限制。',
      compute:function(v){var a=v.da/100,b=v.bipolar?1-a:v.db/100,avg=v.bipolar?(2*a-1)*100:(a-b)*100,p=avg*v.i,mode=v.bipolar?'雙極性互補':'同載波單極性';
        return result([metric('平均差動 VAB',avg,' V'),metric('平均輸出功率',p,' W'),metric('A 臂平均電壓',a*100,' V'),metric('0.9T 的 VAB',(0.9<a?100:0)-((v.bipolar?0.9>=a:0.9<b)?100:0),' V'),metric('VAB 零電壓比例',v.bipolar?0:100*(1-Math.abs(a-b)),' %')],
          mode+'；'+(p<0?'負載回送能量，DC Bus 必須可吸收。':'平均功率方向由 VAB 與 IAB 共同決定。'),{series:[trace('VA','V',function(t){t=t>=1?0:t;return t<a?100:0;},true),trace('VB','V',function(t){t=t>=1?0:t;return (v.bipolar?t>=a:t<b)?100:0;},true),trace('VAB','V',function(t){t=t>=1?0:t;return (t<a?100:0)-((v.bipolar?t>=a:t<b)?100:0);},true)],stage:{kind:'bridge',on:a,b:b,bipolar:Boolean(v.bipolar),mode:mode}});}
    },
    flyback:{
      title:'Flyback：激磁、放能與工作模式',knobs:[knob('io','輸出定電流負載',0.1,4,0.1,1.5,' A'),knob('duty','Duty',10,70,5,40,' %'),knob('vin','Vin',24,240,12,96,' V'),knob('ratio','Np／Ns',1,6,0.5,2,''),knob('lm','磁化電感',100,600,50,200,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
      assumption:'理想隔離 Flyback、固定 Duty、定電流輸出；Gate 指令為 0/1（非 VGS），一次側磁化電壓和 VDS 各自顯示；忽略漏感 Spike、寄生與 Clamp 動態。',
      compute:function(v){var d=v.duty/100,L=v.lm*1e-6,fs=v.freq*1000,n=v.ratio,di=v.vin*d/(L*fs),bound=n*di*(1-d)/2,mode=v.io>bound+1e-9?'CCM':v.io<bound-1e-9?'DCM':'BCM';
        var vo=mode==='DCM'?v.vin*v.vin*d*d/(2*L*fs*v.io):v.vin*d/(n*(1-d)),fw=mode==='DCM'?v.vin*d/(n*vo):1-d,zero=clamp(1-d-fw,0,1),avg=v.io/(n*(1-d)),peak=mode==='CCM'?avg+di/2:di,valley=mode==='CCM'?Math.max(0,avg-di/2):0;
        return result([metric('理想輸出 Vout',vo,' V'),metric('理想 OFF VDS',v.vin+n*vo,' V'),metric('磁化電流 Peak',peak,' A'),metric('BCM 輸出 Io',bound,' A'),metric('零電流時間比例',zero*100,' %')],
          mode==='DCM'?'DCM：OFF 退磁結束後第三段零電流。':'ON 時激磁、OFF 時經二次側放能。',{mode:mode,stage:{on:d,freewheel:fw,zero:zero,kind:'flyback'},series:[trace('Gate 指令','0/1',function(t){return (t>=1?0:t)<d?1:0;},true),trace('一次側磁化電壓','V',function(t){t=t>=1?0:t;return t<d?v.vin:t<d+fw?-n*vo:0;},true),trace('MOSFET VDS 理想值','V',function(t){t=t>=1?0:t;return t<d?0:t<d+fw?v.vin+n*vo:v.vin;},true),trace('磁化電流','A',function(t){return t<d?valley+(peak-valley)*t/d:t<d+fw?peak-(peak-(mode==='CCM'?valley:0))*(t-d)/fw:(mode==='CCM'?valley:0);})]});}
    },
    core:{
      title:'伏秒、匝數與磁通密度擺幅',knobs:[knob('vin','一次側 ON 電壓',40,400,20,100,' V'),knob('duty','單次 ON Duty',10,50,5,40,' %'),knob('turns','一次側匝數',10,80,5,30,' 圈'),knob('area','Ae',50,300,25,150,' mm²'),knob('freq','頻率',25,250,25,100,' kHz')],
      assumption:'理想均勻磁通，ΔB=Vton/(NAe) 只算單次 ON 的磁通擺幅；非材料 Bsat、B-H 回線及鐵損模型。',
      compute:function(v){var deltaB=v.vin*(v.duty/100)/(v.turns*v.area*1e-6*v.freq*1000);
        return result([metric('單次 ΔB',deltaB,' T',3),metric('ON 伏秒',v.vin*(v.duty/100)/(v.freq*1000)*1e6,' V·μs'),metric('ON 時間',1000*v.duty/100/v.freq,' μs')],
          '提高匝數或有效截面可降低每次 ON 期間的磁通擺幅。',{warning:deltaB>0.2?'ΔB > 0.2 T：教學提示，非實際飽和判定。':''});}
    }
  };


  M.scr={
    title:'SCR：觸發角與半波導通',knobs:[knob('alpha','觸發角 α',0,180,5,60,' °'),knob('vac','輸入 RMS',24,228,6,48,' V')],
    assumption:'純電阻負載、單相半波 SCR、理想鎖存與自然換向；不描述 RL 保持電流、Gate 驅動或 GTO 關斷特性。',
    compute:function(v){var a=v.alpha*Math.PI/180,pk=v.vac*Math.SQRT2,avg=pk*(1+Math.cos(a))/(2*Math.PI);
      return result([metric('半波平均 Vout',avg,' V'),metric('導通角',180-v.alpha,' °')],
        'SCR 在正半週觸發後導通至電流自然過零。',{series:[trace('AC 電壓','V',function(t){return pk*sin(t);}),trace('SCR 負載','V',function(t){var th=2*Math.PI*t;return th>=a&&th<Math.PI?pk*Math.sin(th):0;})]});}
  };
  M.optocoupler={
    title:'光耦隔離回授的電流傳遞',knobs:[knob('if','LED 正向電流',0.5,15,0.5,5,' mA'),knob('ctr','假設 CTR',30,200,10,100,' %')],
    assumption:'靜態 Ic≈CTR×If 示意，CTR 不是固定元件常數；忽略 CTR 對溫度、老化、線性區、CTR bin 與補償網路之影響。',
    compute:function(v){return result([metric('次級光電晶體電流',v.if*v.ctr/100,' mA'),metric('輸入 LED 電流',v.if,' mA')],
      '隔離回授靠光學傳遞誤差信號；CTR 不穩定，控制設計需保留餘裕。');}
  };
  M.differentiator={
    title:'實務帶限微分器的頻率響應',knobs:[knob('freq','分析頻率',100,100000,100,1000,' Hz'),knob('cf','回授高頻限制 Cf',100,2000,100,500,' pF')],
    assumption:'反相輸入路徑 Cin=10 nF 串 Rin=1 kΩ；回授 Rf=10 kΩ 並聯 Cf。H(jω)=−jωRfCin/((1+jωRinCin)(1+jωRfCf))，不含 OP GBW。',
    compute:function(v){var w=2*Math.PI*v.freq,rin=1000,cin=10e-9,rf=10000,cf=v.cf*1e-12;
      var mag=w*rf*cin/(Math.hypot(1,w*rin*cin)*Math.hypot(1,w*rf*cf));
      return result([metric('微分器幅值',mag,' V/V',3),metric('增益',20*Math.log10(mag),' dB'),metric('高頻回授轉折',1/(2*Math.PI*rf*cf),' Hz')],
        '低頻近似微分，中高頻被輸入與回授 RC 限制；不可以當成無限放大高頻雜訊。');}
  };
  M.boostCopper={
    title:'含電感銅損的 Boost CCM 平均模型',
    knobs:[knob('duty','Duty',10,80,5,50,' %'),knob('rl','電感等效電阻',0,2,0.1,0.5,' Ω'),
           knob('load','負載電阻',10,100,5,40,' Ω'),knob('vin','Vin',24,72,4,48,' V'),
           knob('l','電感',40,300,20,100,' μH'),knob('freq','開關頻率',50,250,25,100,' kHz')],
    assumption:'理想開關、二極體、電容；電感串聯電阻 rL、純電阻負載。CCM 平均 Vout=Vin(1−D)/((1−D)²+rL/R)，以 ON 電流斜率估算 IL 谷值以核對 CCM。低於 BCM 時不顯示有效 CCM 電壓；不等於完整 DCM 或熱模型。',
    compute:function(v){
      var d=v.duty/100,q=1-d,vo=v.vin*q/(q*q+v.rl/v.load),ideal=v.vin/q,il=vo/(v.load*q);
      var ripple=(v.vin-v.rl*il)*d/(v.l*1e-6*v.freq*1000),valley=il-ripple/2,valid=valley>1e-9&&ripple>0;
      return result([metric('CCM 有效 Vout',valid?vo:NaN,' V'),metric('理想無損 CCM Vout',valid?ideal:NaN,' V'),
                     metric('電感銅損（僅 CCM）',valid?il*il*v.rl:NaN,' W'),metric('CCM IL 谷值估算',valley,' A')],
        valid?'高 Duty 下，電感銅損可能抵銷理想 Boost 增益。':'CCM 假設不成立，請改用分段 DCM 模型或調整 L、fs、負載。',
        {mode:valid?'CCM':'OUT_OF_DOMAIN',validity:{scorable:valid,status:valid?'IN_DOMAIN':'OUT_OF_DOMAIN'},warning:valid?'':'計算得到非正 IL 谷值或不合理斜率；CCM 平均模型失效，Vout 與銅損不顯示為有效設計值。'});
    }
  };
  M.boostCap={
    title:'Boost：輸出電容 ON 放電近似',
    knobs:[knob('cap','輸出電容',47,470,47,235,' μF'),knob('io','輸出平均電流',0.2,5,0.2,2,' A'),
           knob('duty','Duty',10,75,5,50,' %'),knob('freq','頻率',50,250,25,100,' kHz'),
           knob('vin','Vin',12,72,4,48,' V'),knob('l','電感',40,300,20,100,' μH')],
    assumption:'理想非同步 Boost、固定定電流輸出，ON 時二極體截止、電容供應負載，因此 ΔV_ON≈Io·D/(Cfs)。此值僅是 ON 期間的放電幅度，並非自動等於整週期 Vpp；BCM/DCM 時完整漣波要積分 iC=iD−Io。',
    compute:function(v){
      var d=v.duty/100,delta=v.io*d/(v.cap*1e-6*v.freq*1000);
      var threshold=v.vin*d*(1-d)/(2*v.l*1e-6*v.freq*1000),mode=v.io>threshold+1e-9?'CCM':v.io<threshold-1e-9?'DCM':'BCM';
      return result([metric('ON 期間電容放電 ΔV',delta,' V',4),
                     metric('ON 放電電荷',v.io*d/(v.freq*1000)*1e6,' μC',3),
                     metric('BCM 輸出電流門檻',threshold,' A',3)],
        '更大的 C 通常減少 ON 放電幅度；完整峰峰漣波還受 OFF 充電波形與 ESR 影響。',
        {mode:mode,warning:mode!=='CCM'?mode+'：ON 放電 ΔV 仍可計算，但不可當作整週期輸出電容 Vpp。':''});
    }
  };
  M.forward={
    title:'Forward：ON 伏秒與 OFF 去磁',knobs:[knob('duty','主開關 ON Duty',10,70,5,35,' %'),knob('vin','ON 一次側電壓',40,200,10,100,' V'),knob('vreset','OFF 重置電壓幅值',40,200,10,100,' V'),knob('freq','頻率',25,200,25,100,' kHz')],
    assumption:'假設固定 N=30、Ae=150 mm²，線性理想磁芯；ON +Vin、OFF −Vreset，忽略拓樸的二極體壓降與飽和。累積偏磁需跨週期分析。',
    compute:function(v){var on=v.duty/100,offNeeded=v.vin*on/v.vreset,available=1-on,off=Math.min(offNeeded,available),margin=100*(available-offNeeded),den=30*150e-6*v.freq*1000,step=v.vin*on/den,end=Math.max(0,(v.vin*on-v.vreset*available)/den);
      return result([metric('剩餘去磁時間裕度',margin,' %'),metric('單次 ON ΔB',step,' T',3),metric('週期殘留 ΔB 風險',end,' T',3)],
        margin<0?'去磁伏秒不足，可能發生 flux walking；不可視為穩態安全。':'OFF 時負伏秒足夠回復一次側磁通。',{warning:margin<0?'去磁失敗：OFF 有效伏秒小於 ON 伏秒，必須停止設計推導並重新檢查。':'',stage:{kind:'forward',on:on,freewheel:off,zero:Math.max(0,1-on-off),resetIncomplete:margin<0},series:[trace('一次側 Vp','V',function(t){return t<on?v.vin:t<on+off?-v.vreset:0;}),trace('相對 ΔB(t)','T',function(t){return t<on?v.vin*t/den:t<on+off?step-v.vreset*(t-on)/den:Math.max(0,step-v.vreset*off/den);})]});}
  };
  M.converterFamily={
    title:'Ćuk、SEPIC、ZETA：極性與理想 CCM 增益',knobs:[knob('duty','Duty',10,80,5,40,' %'),knob('vin','輸入電壓',12,72,4,36,' V')],
    assumption:'理想穩態 CCM、無損耗：Ćuk 反相，SEPIC 與 ZETA 非反相。僅比較轉壓比，不代替耦合電容電流或元件應力設計。',
    compute:function(v){var g=v.duty/(100-v.duty);
      return result([metric('SEPIC／ZETA Vout',v.vin*g,' V'),metric('Ćuk Vout',-v.vin*g,' V'),metric('轉壓比絕對值',g,'',3)],
        '數值增益相似，輸出極性、能量元件位置與電流紋波不同。');}
  };
  M.fourSwitch={
    title:'四開關升降壓：兩橋臂占空比',knobs:[knob('dbuck','輸入 Buck 橋臂 Duty',20,100,5,75,' %'),knob('dboost','輸出 Boost 橋臂充電 Duty',0,80,5,25,' %'),knob('vin','Vin',12,72,4,48,' V')],
    assumption:'將四開關升降壓以理想平均關係 Vout/Vin≈Dbuck/(1−Dboost) 示範，忽略跨模式換流、死區、同步整流與控制策略。',
    compute:function(v){var g=v.dbuck/100/(1-v.dboost/100),vo=g*v.vin;
      return result([metric('理想平均 Vout',vo,' V'),metric('相對 Vin 增益',g,'',3)],
        vo>v.vin?'此設定為升壓等效區；實際橋臂時序還需控制器決定。':vo<v.vin?'此設定為降壓等效區。':'理想等壓區。');}
  };


  // Six-pulse bridge with a stiff DC current sink: distinct from a capacitor-input rectifier.
  M.sixPulseHarmonics={
    title:'三相六脈波線電流與特徵諧波',
    knobs:[knob('idc','固定直流側電流',1,15,1,6,' A'),knob('order','觀察諧波次數',1,25,2,5,' 次')],
    assumption:'三相對稱、理想二極體、無源側電感與換向重疊，DC 側有平滑電感保持電流 Idc 常數。最高相流入 +Idc、最低相流出 −Idc；不是大電容輸入整流模型。',
    compute:function(v){
      var N=720,ia=[],ib=[],ic=[],sum=0,sumSq=0,peak=0;
      function currents(t){
        var a=Math.sin(2*Math.PI*t),b=Math.sin(2*Math.PI*t-2*Math.PI/3),c=Math.sin(2*Math.PI*t+2*Math.PI/3);
        var values=[a,b,c],hi=0,lo=0;
        for(var j=1;j<3;j++){if(values[j]>values[hi])hi=j;if(values[j]<values[lo])lo=j;}
        return [0,1,2].map(function(k){return k===hi?v.idc:k===lo?-v.idc:0;});
      }
      for(var k=0;k<N;k++){
        var x=currents(k/N);ia.push(x[0]);ib.push(x[1]);ic.push(x[2]);sumSq+=x[0]*x[0];
      }
      function coeff(order){
        var re=0,im=0;
        for(var k=0;k<N;k++){var a=2*Math.PI*order*k/N;re+=ia[k]*Math.cos(a);im+=ia[k]*Math.sin(a);}
        return [2*re/N,2*im/N];
      }
      var c1=coeff(1),c5=coeff(5),c7=coeff(7),cn=coeff(v.order),i1=Math.hypot(c1[0],c1[1])/Math.SQRT2,ih=Math.hypot(cn[0],cn[1])/Math.SQRT2,i5=Math.hypot(c5[0],c5[1])/Math.SQRT2,i7=Math.hypot(c7[0],c7[1])/Math.SQRT2;
      var irms=Math.sqrt(sumSq/N),thd=100*Math.sqrt(Math.max(0,irms*irms-i1*i1))/i1;
      return result([metric('第 '+v.order+' 次線電流 RMS',ih,' A',3),metric('線電流基波 RMS',i1,' A',3),metric('線電流總 RMS',irms,' A',3),metric('THDi',thd,' %'),
        metric('第 5 次線電流 RMS',i5,' A',3),metric('第 7 次線電流 RMS',i7,' A',3),metric('5 次／7 次 RMS 比',i7>0?i5/i7:NaN,'',3)],
        '同一固定 DC 電流下，第 5 與第 7 次線電流 RMS 可直接比較；改變觀察次數不會改變物理諧波。提高 Idc 才會改變兩者幅值。大電容輸入整流不適用本模型。',
        {series:[trace('IA 線電流','A',function(t){return ia[Math.min(N-1,Math.floor((t>=1?0:t)*N))];},true),
                 trace('IB 線電流','A',function(t){return ib[Math.min(N-1,Math.floor((t>=1?0:t)*N))];},true),
                 trace('選定諧波分量','A',function(t){return cn[0]*Math.cos(2*Math.PI*v.order*t)+cn[1]*Math.sin(2*Math.PI*v.order*t);})]});
    }
  };

  // Three-phase capacitor-input bridge with bounded source resistance and load current.
  // This is an explicit switched diode/RC approximation, not a SPICE or ideal stiff current bridge.
  M.threeBus={
    title:'三相電容輸入整流：DC Bus、電流尖峰與 THD',
    knobs:[knob('cap','輸出電容',220,2200,110,990,' μF'),knob('io','直流負載電流',0.5,6,0.5,2,' A'),
           knob('rs','三相導通路徑合計電阻',0.5,4,0.5,1,' Ω'),knob('vphase','相電壓 RMS',100,220,10,120,' V')],
    assumption:'50 Hz 對稱三相、六二極體橋、等效導通迴路電阻 Rs、固定電流負載與理想電容。當整流瞬時電壓高於 Vdc 時，充電電流=(Vrect−Vdc)/Rs；未模擬源側電感、二極體反向恢復、電容 ESR、浪湧或真實熱負荷。',
    compute:function(v){
      var N=1200,cycles=12,dt=1/(50*N),cap=v.cap*1e-6,pk=Math.SQRT2*v.vphase,vc=Math.sqrt(6)*v.vphase;
      var bus=[],ia=[],ic=[],sourceP=0,loadP=0,rLoss=0,min=Infinity,max=-Infinity,total=0,ir2=0,ip=0;
      for(var k=0;k<N*cycles;k++){
        var t=(k%N)/N,ph=[pk*Math.sin(2*Math.PI*t),pk*Math.sin(2*Math.PI*t-2*Math.PI/3),pk*Math.sin(2*Math.PI*t+2*Math.PI/3)];
        var hi=0,lo=0;
        for(var j=1;j<3;j++){if(ph[j]>ph[hi])hi=j;if(ph[j]<ph[lo])lo=j;}
        var vrect=ph[hi]-ph[lo],iCharge=Math.max(0,(vrect-vc)/v.rs),dc=vc+(iCharge-v.io)*dt/cap;
        vc=Math.max(0,dc);
        if(k<(cycles-1)*N)continue;
        var phaseCurrent=hi===0?iCharge:lo===0?-iCharge:0;
        bus.push(vc);ia.push(phaseCurrent);ic.push(iCharge);
        min=Math.min(min,vc);max=Math.max(max,vc);total+=vc;ir2+=phaseCurrent*phaseCurrent;ip=Math.max(ip,Math.abs(phaseCurrent));
        sourceP+=vrect*iCharge;loadP+=vc*v.io;rLoss+=v.rs*iCharge*iCharge;
      }
      var avg=total/N,rms=Math.sqrt(ir2/N),cos=0,sin=0;
      for(var k=0;k<N;k++){var angle=2*Math.PI*k/N;cos+=ia[k]*Math.cos(angle);sin+=ia[k]*Math.sin(angle);}
      var i1=Math.SQRT2*Math.hypot(cos,sin)/N;
      var thd=i1>1e-9?100*Math.sqrt(Math.max(0,rms*rms-i1*i1))/i1:NaN;
      function sample(series,t){return series[Math.min(N-1,Math.floor((t>=1?0:t)*N))];}
      return result([metric('平均 DC Bus',avg,' V'),metric('DC Bus 漣波 p-p',max-min,' V'),metric('A 相線電流 RMS',rms,' A'),
                     metric('A 相 Crest Factor',rms?ip/rms:NaN,'',3),metric('A 相 THDi',thd,' %')],
        '電容、負載與來源阻抗會一起改變導通角、Bus 漣波及輸入電流尖峰，並非固定 DC 電流的六脈波諧波模型。',
        {series:[trace('DC Bus','V',function(t){return sample(bus,t);}),trace('A 相線電流','A',function(t){return sample(ia,t);}),
                 trace('二極體充電電流','A',function(t){return sample(ic,t);})],
         balance:{pin:sourceP/N,pout:loadP/N,rloss:rLoss/N,deltaE:0},
         warning:'Rs 是整條導通路徑的等效電阻；本近似不含 Lsource、di/dt、電感尖峰及啟動浪湧，不能作為實際元件額定值。'});
    }
  };


  // Normalized core-loss comparison. No absolute material loss is inferred.
  M.coreLoss={
    title:'磁芯損耗：頻率與磁通擺幅的相對影響',
    knobs:[knob('freq','磁通激磁頻率',25,250,25,100,' kHz'),knob('b','磁通擺幅 ΔB',0.02,0.3,0.02,0.1,' T'),
           knob('alpha','材料頻率指數 α',1,2.5,0.25,1.5,''),knob('beta','材料磁通指數 β',1.5,3.5,0.25,2.5,'')],
    assumption:'示範 Steinmetz 類型的相對損耗比 P/P_ref=(f/100kHz)^α(ΔB/0.1T)^β，假定 ΔB 為獨立控制且磁芯材料、激磁波形及溫度不變。α、β 是教學假設，不是任何實際磁材參數；不計算 W 或 W/m³。',
    compute:function(v){
      var ratio=Math.pow(v.freq/100,v.alpha)*Math.pow(v.b/.1,v.beta);
      return result([metric('相對參考損耗 P/P_ref',ratio,'',3),metric('相對參考頻率',v.freq/100,'',3),metric('相對參考 ΔB',v.b/.1,'',3)],
        '固定 ΔB 提高頻率通常使相對損耗升高。若固定輸入伏秒條件，ΔB 也可能隨頻率改變，須另外聯立分析。',
        {warning:'僅為歸一化比例模型；任何絕對鐵損、溫升與飽和都需磁材資料和實測。'});
    }
  };
  M.pushPullBalance={
    title:'Push-Pull：雙側激磁伏秒與 Flux Walking',
    knobs:[knob('vin','一次側半繞組施加電壓',40,240,20,100,' V'),
           knob('da','A 開關 ON Duty',10,45,5,30,' %'),knob('db','B 開關 ON Duty',10,45,5,30,' %'),
           knob('turns','每半繞組匝數',10,80,10,30,' 圈'),knob('area','Ae',50,300,25,150,' mm²'),knob('freq','PWM 週期頻率',50,250,25,100,' kHz')],
    assumption:'理想中心抽頭 Push-Pull，A 在 0–Da、B 在 0.5–0.5+Db 對磁芯施加大小相同、方向相反的電壓；每個半繞組匝數 N 相同，零區間 Vp=0。不含 B-H 非線性、磁化電流、寄生或電流平衡控制；B(t) 是相對單週期變化。',
    compute:function(v){
      var a=v.da/100,b=v.db/100,scale=v.vin/(v.turns*v.area*1e-6*v.freq*1000),net=scale*(a-b),plus=scale*a,minus=scale*b;
      return result([metric('單週期殘留 ΔB',net,' T',4),metric('A 正向 ΔB',plus,' T',4),metric('B 反向 |ΔB|',minus,' T',4)],
        Math.abs(net)>1e-9?'正負伏秒不相等，多週期可能累積偏磁；須檢查電流平衡與保護。':'正負伏秒平衡，但仍須確認初始偏磁、材料及驅動時序。',
        {series:[trace('一次側等效磁化電壓','V',function(t){return t<a?v.vin:t>=0.5&&t<0.5+b?-v.vin:0;},true),
                 trace('相對磁通密度變化','T',function(t){return t<a?scale*t:t<0.5?plus:t<0.5+b?plus-scale*(t-0.5):net;})],
         warning:Math.abs(net)>1e-9?'每週期淨伏秒非零：flux walking 風險，不可用單次 ΔB 判斷設計安全。':''});
    }
  };
  M.bridgeFamily={
    title:'Half-Bridge 與 Full-Bridge 的理想輸出比較',
    knobs:[knob('vin','輸入 DC Bus',50,450,50,300,' V'),knob('ratio','Ns/Np 匝數比',0.1,1,0.1,0.5,''),
           knob('duty','每次主開關 Duty',10,45,5,30,' %')],
    assumption:'使用講義的 0<D<0.5 定義：兩個對稱脈波，每次 ON 持續 D×Ts；Half-Bridge 一次側施加 ±Vin/2，Full-Bridge 施加 ±Vin，理想全波整流、CCM、無死區或壓降。其他 Duty 定義不一定能套用。',
    compute:function(v){
      var d=v.duty/100,half=v.ratio*v.vin*d,full=2*v.ratio*v.vin*d;
      return result([metric('Half-Bridge 理想 Vo',half,' V'),metric('Full-Bridge 理想 Vo',full,' V'),
                     metric('HB 一次側脈波幅值',v.vin/2,' V'),metric('FB 一次側脈波幅值',v.vin,' V')],
        '在相同一次側匝數、開關定義及整流方式下，全橋一次側脈波幅值是半橋兩倍。');
    }
  };
  M.multiSecondary={
    title:'多繞組隔離變壓器：輸出電壓與交叉調節限制',
    knobs:[knob('vp','一次側理想 RMS 電壓',24,240,12,96,' V'),
           knob('r1','Np/Ns1',1,8,0.5,2,''),knob('r2','Np/Ns2',1,8,0.5,4,'')],
    assumption:'理想變壓器，固定兩組二次側純電阻負載，同相電流 I1=1A、I2=0.5A，且一次側極性定義一致；Vp/Vs=Np/Ns。僅呈現多組繞組，未計漏感、繞組電阻、二極體壓降、負載互擾及 Cross Regulation。',
    compute:function(v){
      var a=v.vp/v.r1,b=v.vp/v.r2;
      return result([metric('次級 1 理想 RMS',a,' V'),metric('次級 2 理想 RMS',b,' V'),
                     metric('總次級視在功率',a+0.5*b,' VA'),metric('理想一次側電流',(1/v.r1+0.5/v.r2),' A')],
        '二次側電流同相時，折算到一次側可以代數相加；若有不同 PF、相位或極性，必須相量相加。');
    }
  };

  M.linearRegulator={
    title:'線性串聯穩壓器：壓差、熱損與效率',
    knobs:[knob('vin','輸入電壓',8,36,1,12,' V'),knob('vout','設定輸出電壓',1,12,1,5,' V'),knob('io','輸出電流',0.5,10,0.5,2,' A')],
    assumption:'理想串聯線性穩壓器，假設輸入高於輸出、Iq=0、未考慮 Dropout、SOA、瞬態、熱阻及負載限制；Ppass=(Vin−Vout)Io 只對穩壓成功的條件有效。',
    compute:function(v){
      var ok=v.vin>v.vout,heat=ok?(v.vin-v.vout)*v.io:NaN,eff=ok?100*v.vout/v.vin:NaN;
      return result([metric('Pass 元件耗散功率',heat,' W'),metric('輸出功率',ok?v.vout*v.io:NaN,' W'),
                     metric('輸入功率',ok?v.vin*v.io:NaN,' W'),metric('理想效率',eff,' %')],
        '在 Vout、Io 固定時，Vin 越高，線性串聯元件的熱損越大。',
        {validity:{scorable:ok,status:ok?'IN_DOMAIN':'OUT_OF_DOMAIN'},
         warning:ok?'':'Vin <= Vout：不符合此串聯線性調節器的穩壓條件，不能宣稱負載輸出或 Pass 損耗有效。'});
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
    ampere:['magnetic','氣隙增大時，同樣 NI 能維持相同 B 嗎？','gap',1],
    bh:['magnetic','線性磁路模型的 B 是否能直接當作飽和判定？','amps',1],
    reluctance:['magnetic','增加氣隙使磁阻變大時，L 如何改變？','gap'],
    faraday:['faraday','B(t) 變化更快時，感應電壓峰值如何改變？','freq'],
    inductor:['magnetic','匝數改變時，線性模型的 L 如何改變？','turns'],
    transformer:['transformer','提高一次／二次匝比，次級電壓如何改變？','ratio'],
    blocks:['efficiency','效率降低時，固定輸出功率需要多大的輸入功率？','eta',1],
    linear:['linearRegulator','在 Vout、Io 固定時增加 Vin，線性串聯穩壓器的發熱如何變化？','vin'],
    pwm:['pwm','延長 PWM 導通比例，平均開關節點電壓怎麼變？','duty'],
    timing:['timing','控制路徑延遲增加時，佔週期比例會怎麼變？','delay'],
    diodes:['diode','正向電流上升，簡化導通損耗如何變化？','i'],
    legacy:['scr','延後 SCR 觸發角，平均輸出如何改變？','alpha'],
    mosfet:['semiconductor','通電電流提高時，MOSFET I²R 損耗如何變化？','current'],
    switchloss:['switching','單次 Eon/Eoff 變大時，總切換損耗如何變化？','energy'],
    igbt:['semiconductor','同樣電流下 IGBT 與 MOSFET 的導通損耗差怎麼變？','current',2],
    wbg:['switching','降低單次切換能量時，固定頻率的切換損耗如何變化？','energy'],
    half:['rectifier','半波整流的電壓平均值由哪段波形貢獻？','vac'],
    bridge:['rectifier','切換全波與半波，輸出正半週平均電壓會改變嗎？','full',2],
    overlap:['sourceL','源側電感變大，指定 di/dt 所需的電感壓降如何變化？','l'],
    capacitor:['capRipple','電容增加時，小漣波公式預測 ΔV 如何改變？','cap'],
    notching:['sourceL','換向電流斜率增加時，PCC 可能受到的電感壓降如何變化？','didt'],
    neutral:['neutral','提高三次零序諧波，平衡系統的中性線電流如何改變？','h3'],
    sixpulse:['threeRect','三相相位移動時，最大最小相的導通組合如何切換？','phase'],
    harmonics:['sixPulseHarmonics','增加固定直流側電流 Idc，第 5 次線電流 RMS 如何變化？並比較第 5 次與第 7 次幅值。','idc',4],
    commutation:['sourceL','換向迴路 Ls 增大，對電流變換速度有何約束？','l'],
    bus:['threeBus','保持其他參數不變，增加 DC Bus 電容後，三相整流器輸出漣波如何改變？','cap',1],
    op:['op','增加反相增益，理想輸出是否由線性區跨到 ±12 V 的裁切區？','gain',2],
    diff:['diff','差動輸入增加時，理想差動輸出會如何變化？','vdiff'],
    filter:['filter','電阻增大時，一階 RC 截止頻率如何改變？','r'],
    differentiator:['differentiator','提高分析頻率後，帶限微分器增益如何變化？','freq'],
    pi:['pi','Kp 變大時，指定頻率下 PI 幅值如何變化？','kp'],
    adc:['adc','電流從負值變正值時，ADC 腳位電壓與 code 怎麼變？','i'],

    'mid-topologies':['topology','同樣 Vin 下改變 Duty，三種拓樸的輸出有何差別？','duty'],
    'mid-buck-pwm':['buck','負載固定時改變 Duty，Buck 的穩態電壓如何變化？','duty'],
    'mid-switching-lc':['lc','L 變大時，理想 LC 自然頻率怎麼變？','l'],
    'mid-resonance':['lc','阻尼降低（Q 增加）時，50 kHz 的幅值如何變化？','q',1],
    'mid-voltsecond':['buck','改變 Duty，ON 正伏秒與 OFF 負伏秒如何重新平衡？','duty'],
    'mid-ccm-dcm':['buck','減小負載電流，IL 何時會出現第三段零電流？','io',4],
    'mid-bcm':['buck','把 Io 逐步調到 BCM 臨界值，IL 谷值會如何變化？','io',2],
    'mid-buck-dcm':['buck','進入 DCM 後，Vout 還等於 D×Vin 嗎？','io',0],
    'mid-boost-ccm':['boost','提高 Boost Duty 時理想 CCM 輸出電壓如何變化？並觀察 ON/OFF 能量流。','duty'],
    'mid-boost-ripple':['boostCap','固定 Duty 時提高輸出電容，ON 放電壓降怎麼變？','cap'],
    'mid-boost-rl':['boostCopper','電感銅損存在時提高 Duty，輸出是否必定一直上升？','duty'],
    'mid-boost-efficiency':['boostCopper','增大電感等效電阻時，實際 CCM 平均輸出如何變化？','rl'],
    'mid-boost-parasitic':['switching','增大單次開關損耗，Boost 元件熱負擔如何改變？','energy'],
    'mid-boost-dcm':['boost','減少負載後，Boost 何時離開 CCM？','io',4],
    'mid-buckboost-ccm':['buckboost','增加 Duty，反相輸出電壓與 IL 如何變化？','duty'],
    'mid-buckboost-dcm':['buckboost','降低 Io 後，反相 Buck-Boost 的 DCM 比例如何改變？','io',3],
    'mid-sepic-zeta':['converterFamily','提高 Duty，SEPIC／ZETA 輸出增益如何變化？並比較反相 Ćuk。','duty'],
    'mid-four-switch':['fourSwitch','改變輸入橋臂 Duty，四開關升降壓的平均增益如何變化？','dbuck'],
    'mid-bidirectional':['signed','反轉電流正負後，功率方向如何改變？','i'],
    'mid-quadrants':['bridge','維持 VAB 為正、反轉 IAB，平均功率方向會如何切換？','i',1],
    'mid-motor-hbridge':['bridge','改變 A/B 橋臂 Duty，平均負載電壓如何變化？','da'],
    'mid-bipolar':['bridge','切換瞬時互補模式後，週期後段的 VAB 如何改變？','bipolar',3],
    'mid-unipolar':['bridge','增加 A 臂 Duty，單極性 VAB 的零電壓時間比例如何改變？','da',4],
    'mid-isolated-types':['transformer','匝比增加時，隔離變壓器的理想二次電壓如何變化？','ratio'],
    'mid-isolation-feedback':['optocoupler','光耦 CTR 改變時，隔離傳遞的回授電流如何變化？','ctr'],
    'mid-multi-output':['multiSecondary','當第二組次級匝比增加時，該組輸出電壓如何變化？','r2',1],
    'mid-flyback-ccm':['flyback','提高 Flyback Duty 時理想 CCM 輸出電壓如何變化？並觀察 ON/OFF 磁化電流。','duty'],
    'mid-flyback-dcm':['flyback','減少 Io，退磁結束後會不會出現零電流區間？','io',4],
    'mid-forward-reset':['forward','提高 ON Duty 後，OFF 去磁時間還夠嗎？','duty'],
    'mid-double-forward':['core','增加匝數，理想正伏秒造成的 ΔB 如何降低？','turns'],
    'mid-half-full':['bridgeFamily','提高兩橋式的相同 Duty，全橋理想輸出電壓會如何變化？','duty',1],
    'mid-pushpull':['pushPullBalance','保持 A 側 Duty 不變，增加 B 側 Duty，每週期淨磁通偏移如何改變？','db'],
    'mid-magnetization':['core','改變 ON Duty，單次磁通擺幅如何改變？','duty'],
    'mid-coreloss':['coreLoss','固定磁通擺幅 ΔB，將頻率提高一格後，假設材料的相對鐵損如何改變？','freq']
  };

  // Per-lesson starting points may differ from reusable model defaults. This
  // preserves each lesson's physics without mutating shared model definitions.
  var lessonInitialValues={
    half:{full:0},
    op:{gain:5.5,vin:2},
    'mid-boost-rl':{duty:55,rl:2,load:10}
  };
  // Lesson-specific comparisons must match the investigation's requested
  // direction and cross the relevant mode or power-flow boundary when needed.
  // All targets are on the published knob's step grid.
  var comparisonTargets={
    power:-2,
    blocks:80,
    op:7,
    'mid-boost-rl':70,
    wbg:45,
    'mid-bidirectional':-2,
    'mid-quadrants':-2,
    'mid-ccm-dcm':0.1,
    'mid-bcm':0.3,
    'mid-buck-dcm':0.1,
    'mid-boost-dcm':0.2,
    'mid-buckboost-dcm':0.1,
    'mid-flyback-dcm':0.1
  };
  function comparisonTarget(lessonId,knob) {
    var initial=lessonInitialValues[lessonId]||{};
    var baseline=Object.prototype.hasOwnProperty.call(initial,knob.key)?initial[knob.key]:knob.value;
    var specified=Object.prototype.hasOwnProperty.call(comparisonTargets,lessonId);
    var value=specified?comparisonTargets[lessonId]:
      (baseline<knob.max?Math.min(knob.max,Number((baseline+knob.step).toFixed(8))):
        Math.max(knob.min,Number((baseline-knob.step).toFixed(8))));
    var grid=(value-knob.min)/knob.step,baseGrid=(baseline-knob.min)/knob.step;
    if(!Number.isFinite(value)||!Number.isFinite(baseline)||Math.abs(value-baseline)<1e-9||
       baseline<knob.min-1e-9||baseline>knob.max+1e-9||
       value<knob.min-1e-9||value>knob.max+1e-9||
       Math.abs(grid-Math.round(grid))>1e-7||
       Math.abs(baseGrid-Math.round(baseGrid))>1e-7) {
      throw Error('Invalid lesson target: '+lessonId+'/'+knob.key);
    }
    return value;
  }

  function phaseLabel(stage,t) {
    if(!stage)return '';
    if(t>=1)t=0;
    if(stage.kind==='bridge'){
      var ah=t<stage.on,bh=stage.bipolar?!ah:t<stage.b;
      return 'A 臂 '+(ah?'HIGH':'LOW')+'／B 臂 '+(bh?'HIGH':'LOW')+'；差動 VAB = '+(ah===bh?'0':ah?'＋Vbus':'−Vbus')+'（理想，未加死區）';
    }
    if(t<stage.on-1e-8){
      if(stage.kind==='buck')return 'ON：Vin → MOSFET → L → Load，電感儲能';
      if(stage.kind==='boost')return 'ON：Vin → L → MOSFET → GND；輸出電容供應負載';
      if(stage.kind==='flyback')return 'ON：一次側磁化電感儲能，二次側整流二極體截止';
      if(stage.kind==='forward')return 'ON：一次側正伏秒，使磁芯 ΔB 增加';
      if(stage.kind==='buckboost')return 'ON：Vin 使電感儲能，輸出電容供應負載';
      return 'PWM ON：開關節點為高電位';
    }
    if(t<stage.on+(stage.freewheel||stage.off||0)-1e-8){
      if(stage.kind==='buck')return 'OFF 續流：GND → Diode → Switch Node → L → Load → GND；電感放能';
      if(stage.kind==='boost')return 'OFF：Vin＋L → Diode → 輸出，電感放能';
      if(stage.kind==='flyback')return 'OFF：一次側關斷，磁化電感的能量經二次側二極體送往輸出';
      if(stage.kind==='forward')return stage.resetIncomplete?'OFF：去磁伏秒不足，無法回到起始磁通，存在 flux walking 風險':'OFF：負重置伏秒，使磁通返回起始位置';
      if(stage.kind==='buckboost')return 'OFF：電感經二極體向反相輸出放能';
      return 'PWM OFF：開關節點為低電位';
    }
    if(stage.kind==='forward')return '去磁完成：一次側假設不再施加電壓，磁通停在復位位置；不是 DCM 零電流區間';
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
       if(s.step){
         var ordinate=function(val){return (y+22+50*(hi-val)/(hi-lo||1)).toFixed(1);};
         plot='M50 '+ordinate(s.points[0]);
         for(var j=1;j<s.points.length;j++)plot+=' H'+(50+622*j/(s.points.length-1)).toFixed(1)+' V'+ordinate(s.points[j]);
       }
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
  function sweepChart(spec,v,focus,mainValue,metricIndex) {
    var kn=spec.knobs.find(function(k){return k.key===focus;})||spec.knobs[0];
    var samples=[],ys=[];
    for(var i=0;i<=80;i++){
      var copy=Object.assign({},v);copy[kn.key]=kn.min+(kn.max-kn.min)*i/80;
      var computed=spec.compute(copy);
      var y=computed.metrics[metricIndex].value;
      // Preserve the original x index. An invalid sample creates a visible
      // gap: joining the adjacent valid samples would misrepresent the model.
      samples.push(Number.isFinite(y)?y:null);
      if(Number.isFinite(y))ys.push(y);
    }
    if(!ys.length)return '<div role="status">模型超出數值有效範圍。</div>';
    var w=700,lo=Math.min.apply(null,ys),hi=Math.max.apply(null,ys),pad=Math.max((hi-lo)*0.12,1e-8),range=hi-lo+2*pad;
    var points=samples.map(function(y,i){
      if(y===null)return '';
      var cmd=i>0&&samples[i-1]!==null?'L':'M';
      return cmd+(50+i*7.7).toFixed(1)+' '+(184-(y-(lo-pad))/range*149).toFixed(1);
    }).filter(Boolean).join(' ');
    var xmark=50+616*(v[kn.key]-kn.min)/(kn.max-kn.min),ymark=184-(mainValue-(lo-pad))/range*149;
    return '<svg class="interactive-svg" viewBox="0 0 700 222" role="img" aria-label="'+esc(kn.label)+' 對 '+esc(spec.title)+' 模型主要輸出影響曲線">'+
      '<rect x="46" y="28" width="622" height="164" rx="6" fill="currentColor" fill-opacity=".035"/>'+
      '<path d="'+points+'" fill="none" stroke="#159c81" stroke-width="3" stroke-linejoin="round"/>'+
      '<line x1="'+xmark.toFixed(1)+'" y1="28" x2="'+xmark.toFixed(1)+'" y2="192" stroke="#d49231" stroke-width="1.5" stroke-dasharray="5 4"/>'+
      (Number.isFinite(ymark)?'<circle cx="'+xmark.toFixed(1)+'" cy="'+ymark.toFixed(1)+'" r="5" fill="#d49231"/>':'')+
      '<text x="46" y="18" font-size="12" fill="currentColor">'+esc(spec.title)+' · '+esc(spec.compute(v).metrics[metricIndex].label)+'</text>'+
      '<text x="46" y="210" font-size="12" fill="currentColor">'+esc(fmt(kn.min))+' '+esc(kn.unit)+'</text>'+
      '<text x="668" y="210" text-anchor="end" font-size="12" fill="currentColor">'+esc(fmt(kn.max))+' '+esc(kn.unit)+'</text>'+
      '</svg>';
  }
  // Prediction is a one-shot experiment. Any observation of manipulated
  // values before predicting is exploration and must never earn a prediction grade.
  function mount(chapter,lesson,host) {
    if(!host)return;
    var entry=C[lesson.id];
    if(!entry||!M[entry[0]]) {
      host.textContent='本節互動模型尚未設定，請勿以其他章節模型替代。';
      return;
    }
    var spec=M[entry[0]],focus=entry[2],knobs=spec.knobs.slice(),first=knobs.find(function(k){return k.key===focus;});
    if(!first){host.textContent='互動參數設定錯誤';return;}
    var v={};
    knobs.forEach(function(k){v[k.key]=k.value;});
    var starting=lessonInitialValues[lesson.id]||{};
    Object.keys(starting).forEach(function(key){
      var k=knobs.find(function(x){return x.key===key;});
      if(!k)throw Error('Unknown lesson initial parameter: '+lesson.id+'/'+key);
      var value=starting[key],grid=(value-k.min)/k.step;
      if(value<k.min||value>k.max||Math.abs(grid-Math.round(grid))>1e-7)
        throw Error('Invalid lesson initial parameter: '+lesson.id+'/'+key);
      v[key]=value;
    });
    var initial=Object.assign({},v),metricIndex=entry[3]||0,gradeCursor=.25;
    function viewAt(r,t){return typeof r.probe==='function'?r.probe(t):r;}
    var initialResult=spec.compute(v),initialView=viewAt(initialResult,gradeCursor);
    var baseline=initialView.metrics[metricIndex].value;
    var target=comparisonTarget(lesson.id,first),targetDirection=target>initial[focus]?'增加':'降低';
    var guess=null,phase='READY',exploreReason='',cursor=gradeCursor;
    function scorable(r) {
      return r&&viewAt(r,gradeCursor).metrics&&viewAt(r,gradeCursor).metrics[metricIndex]&&
        Number.isFinite(viewAt(r,gradeCursor).metrics[metricIndex].value)&&
        (!r.validity||r.validity.scorable!==false);
    }
    var baselineUsable=scorable(initialResult);
    host.innerHTML='<div class="interactive-head"><span class="pill">ACTIVE LEARNING</span><h3>'+esc(spec.title)+'</h3>'+
      '<p>'+esc(entry[1])+'</p></div>'+
      '<div class="interactive-prediction"><strong>先預測：其他參數不變，將「'+esc(first.label)+'」由 '+fmt(initial[focus])+' '+esc(first.unit)+' '+targetDirection+'至 '+fmt(target)+' '+esc(first.unit)+' 後，「'+esc(initialView.metrics[metricIndex].label)+'」會？</strong>'+
      '<div class="interactive-choices"><button type="button" class="btn btn-muted" data-predict="up">增加</button>'+
      '<button type="button" class="btn btn-muted" data-predict="down">減少</button>'+
      '<button type="button" class="btn btn-muted" data-predict="same">不變</button></div>'+
      '<button type="button" class="btn btn-muted" data-verify-target disabled>套用指定變更並驗證</button>'+
      '<button type="button" class="btn btn-muted" data-explore>直接探索（不計入預測）</button>'+
      '<p class="interactive-feedback" aria-live="polite">先選擇預測，再套用指定變更；或選擇自由探索。</p></div>'+
      '<div class="interactive-knobs">'+knobs.map(function(k){return '<label class="interactive-knob"><span>'+esc(k.label)+'</span><strong data-knob-value="'+esc(k.key)+'">'+esc(fmt(v[k.key]))+' '+esc(k.unit)+'</strong>'+
        '<input type="range" min="'+k.min+'" max="'+k.max+'" step="'+k.step+'" value="'+v[k.key]+'" data-knob="'+esc(k.key)+'" aria-label="'+esc(k.label)+'"></label>';}).join('')+'</div>'+
      '<div class="interactive-metrics" aria-live="polite"></div>'+
      '<p class="interactive-validity" role="status"></p><div class="interactive-chart"></div>'+
      '<div class="interactive-clock" hidden><label>同步時間游標：<strong data-cursor-value>25%</strong>'+
      '<input type="range" min="0" max="100" step="1" value="25" data-time aria-label="波形時間游標"></label></div>'+
      '<p class="interactive-stage" aria-live="polite"></p><p class="interactive-note"></p><p class="interactive-warning" role="status" hidden></p>'+
      '<p class="interactive-assumptions"><strong>模型條件：</strong>'+esc(spec.assumption)+'</p>'+
      '<button type="button" class="btn btn-muted interactive-reset">重設實驗與預測</button>';
    var prediction=host.querySelector('.interactive-feedback');
    function isolated() {
      return knobs.every(function(k){return k.key===focus||Math.abs(v[k.key]-initial[k.key])<=1e-9;});
    }
    function refresh() {
      var r=spec.compute(v),view=viewAt(r,cursor);
      host.dataset.learningState=phase;
      host.querySelector('.interactive-metrics').innerHTML=view.metrics.map(function(item){
        return '<div class="interactive-metric"><small>'+esc(item.label)+'</small><strong>'+
          esc(fmt(item.value,item.digits))+' '+esc(item.unit)+'</strong></div>';
      }).join('');
      host.querySelectorAll('[data-knob-value]').forEach(function(node){
        var key=node.getAttribute('data-knob-value'),k=knobs.find(function(x){return x.key===key;});
        node.textContent=fmt(v[key])+' '+k.unit;
      });
      var reveal=phase==='REVIEWED'||phase==='EXPLORING';
      host.querySelector('.interactive-chart').innerHTML=reveal?
        (r.series?waveChart(r.series,cursor):sweepChart(spec,v,focus,view.metrics[metricIndex].value,metricIndex)):
        '<p class="interactive-chart-placeholder">波形／曲線將在驗證後揭曉；直接調參數將轉為自由探索。</p>';
      host.querySelector('.interactive-clock').hidden=!reveal||!r.series;
      host.querySelector('.interactive-stage').textContent=reveal?(typeof r.probe==='function'?view.note||'':(r.stage?phaseLabel(r.stage,cursor):'')):'';
      host.querySelector('.interactive-note').textContent=r.note||'';
      var warn=host.querySelector('.interactive-warning');
      warn.hidden=!r.warning;warn.textContent=r.warning||'';
      var validity=host.querySelector('.interactive-validity');
      validity.textContent=scorable(r)?
        '模型狀態：限定假設下可比較（非實機設計驗證）':
        '模型狀態：超出適用域／僅為數學外插，不可給予有效預測評分';
      if(spec===M.bridge){
        var bipolar=Boolean(v.bipolar),bControl=host.querySelector('[data-knob="db"]');
        bControl.disabled=bipolar;
        bControl.value=String(bipolar?100-v.da:v.db);
        host.querySelector('[data-knob-value="db"]').textContent=
          fmt(bipolar?100-v.da:v.db)+' %'+(bipolar?'（互補推導，不可調）':'');
      }
      host.querySelectorAll('[data-predict]').forEach(function(button){
        button.disabled=phase!=='READY'||!baselineUsable;
        button.setAttribute('aria-pressed',String(guess===button.dataset.predict));
      });
      host.querySelector('[data-verify-target]').disabled=phase!=='PREDICTED';
      if(phase==='READY') {
        prediction.textContent=baselineUsable?
          '先選擇預測，再套用指定變更；或選擇自由探索。':
          '初始工況已超出模型適用範圍；請選擇自由探索，不可評分。';
      }else if(phase==='PREDICTED') {
        prediction.textContent='預測已記錄；請按「套用指定變更並驗證」。結果在驗證前不顯示。';
      }else if(phase==='EXPLORING') {
        prediction.textContent=exploreReason||'自由探索中：不計入事前預測，重設後才能重新作答。';
      }else if(phase==='REVIEWED') {
        var selected=viewAt(r,gradeCursor).metrics[metricIndex].value;
        if(!isolated())prediction.textContent='已同時變更其他參數，無法進行單一變數預測評分；請重設。';
        else if(!baselineUsable||!scorable(r)){
          prediction.textContent='模型超出適用範圍或僅為外插，不能判定事前預測正確；請查看模型條件。';
        }else{
          var tol=Math.max(1e-7,Math.abs(baseline)*1e-7),delta=selected-baseline;
          var observed=delta>tol?'up':delta< -tol?'down':'same';
          var labels={up:'增加',down:'減少',same:'不變'};
          prediction.textContent=(guess===observed?'符合預測。':'與預測不同，請核對物理原因。')+
            '基準 '+fmt(baseline,3)+' → 指定變更後 '+fmt(selected,3)+
            '；觀察結果：'+labels[observed]+'。'+(typeof r.probe==='function'?'（評分固定在 25% 時間游標；拖曳只更新即時觀測。）':'');
        }
      }
    }
    host.querySelectorAll('[data-knob]').forEach(function(input){
      input.addEventListener('input',function(){
        if(input.disabled)return;
        var key=input.dataset.knob,next=Number(input.value);
        if(next===v[key])return;
        v[key]=next;
        if(phase==='PREDICTED'&&key===focus&&
           Math.abs(v[focus]-target)<=1e-9&&isolated())phase='REVIEWED';
        else if(phase!=='EXPLORING'){
          exploreReason=key!==focus&&phase==='PREDICTED'?
            '已同時變更其他參數，無法比較單一變數；請重設後重新預測。':
            '已先觀察或更改其他工況，這次僅屬自由探索；請重設後重新預測。';
          phase='EXPLORING';
        }
        refresh();
      });
    });
    host.querySelectorAll('[data-predict]').forEach(function(button){
      button.addEventListener('click',function(){
        if(phase!=='READY'||!baselineUsable)return;
        guess=button.dataset.predict;
        phase='PREDICTED';
        refresh();
      });
    });
    host.querySelector('[data-verify-target]').addEventListener('click',function(){
      if(phase!=='PREDICTED')return;
      v[focus]=target;
      host.querySelector('[data-knob="'+focus+'"]').value=String(target);
      phase=isolated()?'REVIEWED':'EXPLORING';
      if(phase==='EXPLORING')exploreReason='已同時變更其他參數，無法比較單一變數；請重設。';
      refresh();
    });
    host.querySelector('[data-explore]').addEventListener('click',function(){
      if(phase==='READY'||phase==='PREDICTED'){
        phase='EXPLORING';
        exploreReason='自由探索中：可以查看波形、調整參數，但不計入事前預測。';
        refresh();
      }
    });
    host.querySelector('[data-time]').addEventListener('input',function(ev){
      if(phase!=='REVIEWED'&&phase!=='EXPLORING')return;
      cursor=Number(ev.target.value)/100;
      host.querySelector('[data-cursor-value]').textContent=Math.round(cursor*100)+'%';
      refresh();
    });
    host.querySelector('.interactive-reset').addEventListener('click',function(){
      knobs.forEach(function(k){
        v[k.key]=initial[k.key];
        host.querySelector('[data-knob="'+k.key+'"]').value=String(initial[k.key]);
      });
      phase='READY';guess=null;cursor=.25;exploreReason='';
      host.querySelector('[data-time]').value='25';
      host.querySelector('[data-cursor-value]').textContent='25%';
      refresh();
    });
    refresh();
  }
  window.EE_INTERACTIVE={mount:mount,catalog:C,models:M,comparisonTarget:comparisonTarget};
})();
