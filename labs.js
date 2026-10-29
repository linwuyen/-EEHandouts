(function () {
  'use strict';
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function k(id,name,min,max,step,value,unit){return {id:id,name:name,min:min,max:max,step:step,value:value,unit:unit}}
  var defs={
    pf:{name:'PF、相位差與諧波',hint:'固定輸入電壓 100 V RMS、基波電流 8 A RMS',knobs:[k('theta','基波相位差',0,90,5,0,'°'),k('thd','電流 THDi',0,100,5,75,'%')],note:'假設電壓為理想正弦波、THD 是相對基波 RMS。若電壓有諧波，此簡化公式不能直接套用。',compute:function(v){var a=Math.cos(v.theta*Math.PI/180),d=v.thd/100,P=800*a,S=800*Math.sqrt(1+d*d);return [['實功率 P',P.toFixed(0)+' W'],['視在功率 S',S.toFixed(0)+' VA'],['DPF',a.toFixed(3)],['整體 PF',(P/S).toFixed(3)]]}},
    magnetic:{name:'磁阻、氣隙與電感量',hint:'固定磁路長 10 cm、截面積 1 cm²、相對導磁係數 2000',knobs:[k('turns','線圈匝數',20,150,10,50,' 圈'),k('gap','氣隙',0,1.2,0.1,0.3,' mm'),k('current','線圈電流',0,3,0.25,1,' A')],note:'本模型只適用固定導磁率的線性磁路；0.35 T 是本站為示範設定的保守計算顯示門檻，並非所有材料的飽和磁通密度。超界後停止顯示設計估值，必須提供磁芯 B-H 曲線重新分析。忽略漏磁、氣隙 fringing、磁滯與溫度。',validate:function(v){var mu0=4*Math.PI*1e-7,R=.1/(mu0*2000*1e-4)+(v.gap/1000)/(mu0*1e-4),B=v.turns*v.current/(R*1e-4);return B>.35?'線性模型預估 B='+B.toFixed(3)+' T，已超出本網站設定的 0.35 T 教學顯示門檻。這不是材料飽和判定，故停止輸出有效電感及磁通密度估值；請使用磁材 B-H 資料或實測驗證。':''},compute:function(v){var mu0=4*Math.PI*1e-7,R=.1/(mu0*2000*1e-4)+(v.gap/1000)/(mu0*1e-4),L=v.turns*v.turns/R,B=v.turns*v.current/(R*1e-4),valid=B<=.35;return [['線性電感估值',valid?(L*1e6).toFixed(1)+' μH':'— 模型未驗證'],['磁通密度 B',valid?B.toFixed(3)+' T':'— 超出教學門檻'],['磁阻（線性假設）',(R/1e6).toFixed(2)+' MA/Wb'],['工作點提示',valid?'未超過示意門檻':'需磁材 B-H 資料']]}},
    pwm:{name:'PWM Duty 與理想 Buck',hint:'理想 Buck CCM、電感 100 μH',knobs:[k('duty','Duty',10,90,5,45,'%'),k('vin','輸入電壓',12,48,4,24,' V'),k('freq','開關頻率',50,200,25,100,' kHz')],note:'本模型只適用理想 Buck CCM；忽略寄生、損耗與實際暫態，不能套用 LLC、PSFB 或 DCM。',compute:function(v){var d=v.duty/100,o=v.vin*d,r=(v.vin-o)*d/(100e-6*v.freq*1000);return [['理想 Vout',o.toFixed(2)+' V'],['PWM Duty',v.duty+'%'],['電感漣波 ΔI',r.toFixed(2)+' A'],['開關週期',(1000/v.freq).toFixed(2)+' μs']]}},
    loss:{name:'MOSFET 導通／切換損耗',hint:'比較 RMS 電流、導通電阻與切換頻率的影響',knobs:[k('amps','電流 RMS',2,30,2,10,' A'),k('rds','RDS(on)',10,100,5,40,' mΩ'),k('fs','切換頻率',25,250,25,100,' kHz'),k('esum','Eon + Eoff',10,150,10,50,' μJ')],note:'只計 I²R 與 Ecycle×fsw；假設 MOSFET 全週期等效 RMS 已知，未納入 Qrr、Gate、Coss、寄生及溫度。',compute:function(v){var a=v.amps*v.amps*v.rds/1000,b=v.esum*v.fs/1000;return [['導通損耗',a.toFixed(2)+' W'],['切換損耗',b.toFixed(2)+' W'],['合計（部分）',(a+b).toFixed(2)+' W'],['切換占比',(100*b/(a+b)).toFixed(1)+'%']]}},
    rectify:{name:'橋式整流＋濾波電容',hint:'50 Hz 單相全波、定電流負載、忽略導通損耗',knobs:[k('acv','交流電壓 RMS',110,240,10,220,' V'),k('cap','濾波電容',220,1500,10,470,' μF'),k('load','負載電流',.5,5,.5,2,' A')],note:'ΔV≈I/(2fC) 僅用於漣波相對峰值足夠小的單相全波電容輸入整流器。本教學採 ΔV/Vpeak≤20% 作為保守的近似顯示門檻，這不是通用設計規範。超出時停止輸出 DC 均值估算。未計入源阻抗、充電尖峰、二極體應力、ESR 與安全設計；高壓電容須遵守放電規範。',validate:function(v){var peak=v.acv*Math.sqrt(2),r=v.load/(100*v.cap*1e-6),ratio=r/peak;return ratio>.20?'目前 ΔV/Vpeak 約 '+(ratio*100).toFixed(1)+'%，超過教學設定的 20% 小漣波近似門檻。此時不應使用 ΔV/2 修正估算 DC 平均電壓，請改用整流電路動態模擬或實際量測。':''},compute:function(v){var peak=v.acv*Math.sqrt(2),r=v.load/(100*v.cap*1e-6),valid=r/peak<=.20;return [['AC 峰值',peak.toFixed(1)+' V'],['漣波公式結果',r.toFixed(1)+' Vpp'+(valid?'':'（不適用）')],['近似 DC 均值',valid?(peak-r/2).toFixed(1)+' V':'— 模型失效'],['模型判斷',valid?'小漣波粗估':'超出適用範圍']]}},
    three:{name:'三相 120° 與線電壓',hint:'對稱三相；電壓、電流示意只顯示電壓波形',knobs:[k('phase','目前角度',0,360,5,30,'°'),k('vphase','相電壓 RMS',100,240,20,220,' V')],note:'假設 ABC 正相序及同幅同頻；線電壓瞬時值 VAB=VA−VB，與 VLL RMS=√3 Vphase 是不同的數值。',compute:function(v){var t=v.phase*Math.PI/180,A=v.vphase*Math.sqrt(2),a=A*Math.sin(t),b=A*Math.sin(t-2*Math.PI/3);return [['A 相瞬時',a.toFixed(0)+' V'],['B 相瞬時',b.toFixed(0)+' V'],['A−B 瞬時',(a-b).toFixed(0)+' V'],['線電壓 RMS',(v.vphase*Math.sqrt(3)).toFixed(1)+' V']]}},
    adc:{name:'雙向 Shunt 感測與 ADC',hint:'Shunt 5 mΩ、單極性 0–3 V、12-bit ADC',knobs:[k('amps','實際電流',-25,25,1,10,' A'),k('gain','差動增益',10,16,1,14,' 倍'),k('offset','零點偏壓',1.2,1.8,.1,1.5,' V')],note:'僅示範理想傳遞函數；超出 0–3 V 時 ADC 轉換碼未定義，不能以軟體限幅保證類比腳位安全。實際硬體須檢查 OP 共模、輸出擺幅、ADC 絕對最大額定值與輸入保護。',validate:function(v){var raw=v.offset+.005*v.gain*v.amps;return raw<0||raw>3?'計算的類比輸入電壓為 '+raw.toFixed(3)+' V，超出假設的 ADC 0–3 V 工作範圍。硬體可能超出規格，無有效轉換碼；請檢查硬體限壓、運算放大器輸出與 MCU 絕對最大額定值。':''},compute:function(v){var raw=v.offset+.005*v.gain*v.amps,valid=raw>=0&&raw<=3;return [['理論 Vadc',raw.toFixed(3)+' V'],['0–3 V 工作範圍',valid?'範圍內':'超出（不代表已限壓）'],['ADC 12-bit Code',valid?Math.round(raw/3*4095)+' / 4095':'— 無有效轉換碼'],['硬體設計狀態',valid?'仍需檢查類比規格':'需硬體保護與量測驗證']]}}
  };
  function path(fn,scale,color,count){if(typeof color==='number'){count=color;color=count===700?'#29b7a6':'#9c80ea'}count=count||180;color=color||'#1686C8';var s='';for(var i=0;i<=count;i++){var x=i/count,y=105-scale*fn(x);s+=(i?' L':'M')+(22+320*x).toFixed(1)+' '+y.toFixed(1)}return '<path d="'+s+'" stroke="'+color+'" fill="none" stroke-width="2.8" stroke-linejoin="round"/>'}
  function svg(segments,caption){return '<svg viewBox="0 0 366 218" role="img" aria-label="'+esc(caption)+'"><line x1="22" y1="105" x2="343" y2="105" stroke="currentColor" stroke-opacity=".2"/><line x1="22" y1="15" x2="22" y2="192" stroke="currentColor" stroke-opacity=".2"/>'+segments+'<text x="22" y="209" fill="currentColor" opacity=".65" font-size="11">'+esc(caption)+'</text></svg>'}
  function graph(id,v){
    if(id==='pf'){var a=v.theta*Math.PI/180,d=v.thd/100;return svg(path(function(x){return Math.sin(2*Math.PI*x)},55,'',180)+path(function(x){return (Math.sin(2*Math.PI*x-a)+d*Math.sin(6*Math.PI*x))/(1+d*.5)},48,'#e39b37',180),'藍：電壓　橘：失真電流（比例示意）').replace(/stroke="" /g,'stroke="#1686C8" ')}
    if(id==='magnetic'){
      // Plot B(I) only inside an explicitly modelled teaching range, not a material saturation curve.
      var mu0=4*Math.PI*1e-7,area=1e-4,reluctance=.1/(mu0*2000*area)+(v.gap/1000)/(mu0*area);
      var bPerAmp=v.turns/(reluctance*area),B=bPerAmp*v.current,limit=.35;
      var X=function(i){return 44+295*i/3},Y=function(b){return 180-150*b/limit};
      var allowedEnd=Math.max(0,Math.min(3,limit/bPerAmp));
      var trace='<path d="M44 180 L'+X(allowedEnd).toFixed(1)+' '+Y(bPerAmp*allowedEnd).toFixed(1)+'" fill="none" stroke="#9c80ea" stroke-width="3.5"/>';
      var point=B<=limit?'<circle cx="'+X(v.current).toFixed(1)+'" cy="'+Y(B).toFixed(1)+'" r="6" fill="#e39b37" stroke="white" stroke-width="1.5"/>':
        '<text x="62" y="119" fill="#c5812a" font-size="13">工作點超出模型範圍，不繪製數值</text>';
      return '<svg viewBox="0 0 366 218" role="img" aria-label="線性磁路 B 隨電流 I 的關係，只呈現示意門檻以下">'+
        '<line x1="44" y1="180" x2="347" y2="180" stroke="currentColor" stroke-opacity=".4"/>'+
        '<line x1="44" y1="21" x2="44" y2="180" stroke="currentColor" stroke-opacity=".4"/>'+
        '<line x1="44" y1="30" x2="347" y2="30" stroke="#c5812a" stroke-dasharray="3 5" stroke-opacity=".7"/>'+
        '<text x="7" y="23" fill="currentColor" font-size="11">B (T)</text>'+
        '<text x="43" y="195" fill="currentColor" font-size="11">0</text>'+
        '<text x="323" y="195" fill="currentColor" font-size="11">3 A</text>'+
        '<text x="7" y="35" fill="#c5812a" font-size="11">0.35</text>'+
        trace+point+
        '<text x="44" y="213" fill="currentColor" opacity=".75" font-size="11">B(I)＝NI／(ℜA)；0.35 T 為教學警示門檻，非材料飽和點</text></svg>';
    }
    if(id==='pwm'){var d=v.duty/100,cycles=v.freq/10,avg=105-58*d;return svg(path(function(x){return ((x*cycles)%1)<d?1:0},58,'#29b7a6',1200)+'<line x1="22" y1="'+avg.toFixed(1)+'" x2="342" y2="'+avg.toFixed(1)+'" stroke="#e39b37" stroke-dasharray="5 4" stroke-width="2.5"/>','固定觀察窗 100 μs：'+cycles+' 個 PWM 週期（綠）｜橘色為平均值')}
    if(id==='loss'){var a=v.amps*v.amps*v.rds/1000,b=v.esum*v.fs/1000,t=a+b;return '<svg viewBox="0 0 366 218" role="img" aria-label="損耗比例"><text x="22" y="48" font-size="14" fill="currentColor">導通與切換損耗</text><rect x="22" y="65" width="'+(320*a/t).toFixed(2)+'" height="52" rx="5" fill="#1686C8"/><rect x="'+(22+320*a/t).toFixed(2)+'" y="65" width="'+(320*b/t).toFixed(2)+'" height="52" rx="5" fill="#e39b37"/><circle cx="29" cy="155" r="5" fill="#1686C8"/><text x="42" y="160" fill="currentColor" font-size="12">導通 '+a.toFixed(2)+' W</text><circle cx="29" cy="186" r="5" fill="#e39b37"/><text x="42" y="191" fill="currentColor" font-size="12">切換 '+b.toFixed(2)+' W</text></svg>'}
    if(id==='rectify'){var peak=v.acv*Math.sqrt(2),C=v.cap*1e-6,delta=v.load/(100*C),valid=delta/peak<=.20,source=path(function(x){return Math.abs(Math.sin(2*Math.PI*x))},64,'#1686C8',360);if(!valid)return svg(source+'<text x="40" y="177" font-size="14" fill="#c5812a">漣波過大：不呈現失效模型波形</text>','藍：整流後正弦波；橘色波形已停用');var N=360,dt=0.02/N,vCap=peak,trace='';for(var k=0;k<5*N;k++){var phase=(k%N)/N,src=peak*Math.abs(Math.sin(2*Math.PI*phase));vCap=Math.max(src,vCap-v.load/C*dt);if(k>=4*N){var xx=22+320*((k-4*N)/N),yy=105-64*(vCap/peak);trace+=(k===4*N?'M':' L')+xx.toFixed(1)+' '+yy.toFixed(1)}}return svg(source+'<path d="'+trace+'" fill="none" stroke="#e39b37" stroke-width="2.8"/>','藍：整流輸入；橘：理想電容充放電（100 ms 窗內取最後 20 ms）')}
    if(id==='three'){var s=path(function(x){return Math.sin(2*Math.PI*x)},55,'#1686C8',180)+path(function(x){return Math.sin(2*Math.PI*x-2*Math.PI/3)},55,'#e39b37',180)+path(function(x){return Math.sin(2*Math.PI*x+2*Math.PI/3)},55,'#32b497',180);s+='<line x1="'+(22+320*v.phase/360).toFixed(1)+'" y1="17" x2="'+(22+320*v.phase/360).toFixed(1)+'" y2="190" stroke="currentColor" stroke-opacity=".5" stroke-dasharray="4 5"/>';return svg(s,'藍 A　橘 B　綠 C；虛線為目前角度')}
    if(id==='adc'){var raw=v.offset+.005*v.gain*v.amps,valid=raw>=0&&raw<=3;if(!valid)return svg('<text x="35" y="105" fill="#c5812a" font-size="14">ADC 輸入超界：不提供有效轉換波形</text>','超過 0–3 V 工作範圍，不可推定實際 ADC 轉換碼');var fn=function(x){var vout=v.offset+(x*50-25)*.005*v.gain;return (Math.max(0,Math.min(3,vout))-1.5)/1.5};var pos=(v.amps+25)/50;var trace=path(fn,66,'#32b497',180)+'<circle cx="'+(22+320*pos).toFixed(1)+'" cy="'+(105-66*fn(pos)).toFixed(1)+'" r="6" fill="#e39b37"/>';return svg(trace,'示意 0–3 V 內的理論 ADC 轉換；超界會停用輸出')}
    return '';
  }
  function mount(id,el){
    var def=defs[id];if(!def||!el)return;
    var values={};
    def.knobs.forEach(function(k){values[k.id]=k.value});
    var controls=def.knobs.map(function(o){return '<div class="control-group"><div class="control-head"><span>'+esc(o.name)+'</span><strong data-lab-value="'+o.id+'">'+o.value+esc(o.unit)+'</strong></div><input class="control-range" type="range" min="'+o.min+'" max="'+o.max+'" step="'+o.step+'" value="'+o.value+'" data-lab-input="'+o.id+'" aria-label="'+esc(o.name)+'"></div>'}).join('');
    el.innerHTML='<section class="lab"><div class="lab-top"><div><h3>'+esc(def.name)+'</h3><small>'+esc(def.hint)+'</small></div><span class="pill">INTERACTIVE</span></div><div class="lab-body"><div class="lab-grid"><div class="lab-chart" id="lab-chart"></div><div>'+controls+'<div class="output-grid" id="lab-outputs"></div><div class="lab-validation" id="lab-validation" role="status" hidden></div></div></div></div><div class="lab-disclaimer">'+esc(def.note)+'</div></section>';
    var outputs=el.querySelector('#lab-outputs'),chart=el.querySelector('#lab-chart');
    function refresh(){
      def.knobs.forEach(function(o){el.querySelector('[data-lab-value="'+o.id+'"]').textContent=values[o.id]+o.unit});
      outputs.innerHTML=def.compute(values).map(function(a){return '<div class="output-card"><small>'+esc(a[0])+'</small><strong>'+esc(a[1])+'</strong></div>'}).join('');
      chart.innerHTML=graph(id,values);var warn=el.querySelector('#lab-validation');var msg=typeof def.validate==='function'?def.validate(values):'';warn.hidden=!msg;warn.textContent=msg;
    }
    el.querySelectorAll('[data-lab-input]').forEach(function(input){input.addEventListener('input',function(){values[input.dataset.labInput]=Number(input.value);refresh()})});
    refresh();
  }
  window.EE_LABS={mount:mount};
})();