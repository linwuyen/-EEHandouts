/* Seven interactive learning labs for the middle DC-DC volume. Idealized / educational models only. */
(function () {
  'use strict';
  function esc(s){return String(s).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
  function k(id,name,min,max,step,value,unit){return {id:id,name:name,min:min,max:max,step:step,value:value,unit:unit}}
  function f(x,n){return Number.isFinite(x)?x.toFixed(n===undefined?2:n):'—'}
  var defs={
    'mid-buck':{
      name:'Buck Duty、電感漣波與 BCM',hint:'理想 CCM；可同時觀察頻率、負載與漣波的關係',
      knobs:[k('vin','輸入電壓',12,100,4,24,' V'),k('duty','Duty',10,90,5,50,'%'),k('freq','切換頻率',25,250,25,100,' kHz'),k('l','電感',20,300,20,100,' μH'),k('io','輸出負載',.1,8,.1,2,' A')],
      note:'理想 Buck：忽略死區、ESR、壓降與暫態。當 IL,min≤0 時 CCM 轉壓比不再是可直接採用的 DCM 結論。',
      compute:function(v){var d=v.duty/100,vo=v.vin*d,di=(v.vin-vo)*d/(v.l*1e-6*v.freq*1000),min=v.io-di/2;
        return {values:[['理想 CCM Vout',f(vo,2)+' V'],['電感漣波 p-p',f(di,2)+' A'],['推估電感谷值',f(min,2)+' A'],['BCM 臨界 Io',f(di/2,2)+' A']],warning:min<=0?'目前平均負載太小，CCM 谷值≤0；此理想 CCM Vout 只是參考，真實 DCM 需另解負載。':''}
      }
    },
    'mid-modes':{
      name:'CCM / BCM / DCM 電流模式分界',hint:'固定 Duty 下推算理想 Buck 的 BCM 負載門檻',
      knobs:[k('vin','輸入電壓',12,60,4,24,' V'),k('duty','Duty',15,85,5,50,'%'),k('l','電感',20,300,20,100,' μH'),k('freq','切換頻率',25,250,25,100,' kHz'),k('io','負載電流',.05,3,.05,.3,' A')],
      note:'模式判斷依理想 Buck / 非同步零電流續流模型。DCM 時不能把 CCM 的 Vo = D·Vin 當作已確立輸出。',
      compute:function(v){var d=v.duty/100,di=v.vin*d*(1-d)/(v.l*1e-6*v.freq*1000),bound=di/2,margin=v.io-bound;
        var state=Math.abs(margin)<.025?'BCM 臨界':margin>0?'CCM 連續':'DCM 不連續';
        return {values:[['BCM 邊界 Io',f(bound,3)+' A'],['理想 CCM ΔIL',f(di,3)+' A'],['電感谷值估計',f(margin,3)+' A'],['推估模式',state]],warning:margin<-.025?'DCM：上方電感漣波公式以 CCM 的理想輸出計算，僅用於估算邊界；不可直接視作實際 DCM 波形。':''}
      }
    },
    'mid-boost':{
      name:'Boost 增益、電感與輸出漣波',hint:'理想 Boost CCM，測試 Duty 增大造成的電流應力',
      knobs:[k('vin','輸入電壓',12,72,4,48,' V'),k('duty','Duty',10,80,5,50,'%'),k('freq','切換頻率',50,250,25,100,' kHz'),k('l','電感',40,300,20,100,' μH'),k('io','輸出電流',.5,5,.5,2,' A')],
      note:'C 固定為 220 μF，理想 CCM 並忽略所有損耗和 ESR；高 Duty 的實際效率受 RL、RDS(on)、二極體與熱限制。',
      compute:function(v){var d=v.duty/100,vo=v.vin/(1-d),iin=v.io/(1-d),di=v.vin*d/(v.l*1e-6*v.freq*1000),dv=v.io*d/(220e-6*v.freq*1000);
        return {values:[['理想 CCM Vout',f(vo,1)+' V'],['輸入平均電流',f(iin,2)+' A'],['電感峰值估計',f(iin+di/2,2)+' A'],['電容漣波 p-p',f(dv,2)+' V']],warning:iin<=di/2?'由電感谷值推算可能進 DCM；此 CCM 增益不能直接用。':d>.7?'Duty 高，須特別考慮損耗、峰值電流與熱；理想增益不可當作實測規格。':''}
      }
    },
    'mid-buckboost':{
      name:'四開關升降壓與雙向功率',hint:'改變兩端電壓與有號功率，辨識 Buck / Boost / 回送',
      knobs:[k('vin','左側 DC Bus',12,60,4,48,' V'),k('vout','右側 DC Bus',12,60,4,24,' V'),k('power','左→右功率',-500,500,50,300,' W')],
      note:'僅示範端點功率與等效電流：假設 η=100%，未推導橋臂 PWM / 電感電流；實機必須檢查方向切換、預充與保護。',
      compute:function(v){var forward=v.power>=0,src=forward?v.vin:v.vout,dst=forward?v.vout:v.vin,mode=src>dst?'Buck 降壓':src<dst?'Boost 升壓':'同壓區';
        return {values:[['功率方向',v.power===0?'無淨傳能':forward?'左側 → 右側':'右側 → 左側'],['此方向模式',mode],['左側電流大小',f(Math.abs(v.power)/v.vin,2)+' A'],['右側電流大小',f(Math.abs(v.power)/v.vout,2)+' A']],warning:v.power===0?'功率為零時無法從電流推導轉換模式；實際仍可能有循環電流。':''}
      }
    },
    'mid-bridge':{
      name:'H-Bridge 四象限與平均差動電壓',hint:'兩個橋臂平均占空比決定 VAB，電流方向決定功率符號',
      knobs:[k('vbus','DC Bus',40,300,20,100,' V'),k('da','A 橋臂高電位時間',0,100,5,75,'%'),k('db','B 橋臂高電位時間',0,100,5,25,'%'),k('current','負載電流 IAB',-10,10,1,2,' A')],
      note:'平均電壓理想式，兩橋臂獨立平均 Duty；不涵蓋實際調變同步、Dead Time、Body Diode 與再生能量吸收能力。',
      compute:function(v){var vab=(v.da-v.db)*v.vbus/100,p=vab*v.current,quad=(vab>=0?(v.current>=0?'I':'IV'):(v.current>=0?'II':'III'));
        return {values:[['平均 VAB',f(vab,1)+' V'],['負載功率 P',f(p,1)+' W'],['電壓／電流象限',vab===0||v.current===0?'軸上':('第 '+quad+' 象限')],['能量方向',p>0?'負載吸收':p<0?'負載回送':'淨功率 0']],warning:p<0?'此條件為回送功率，須確保 DC Bus 能吸收再生能量。':''}
      }
    },
    'mid-flyback':{
      name:'Flyback CCM、匝數比與電壓應力',hint:'以磁化伏秒平衡計算理想輸出與 OFF 時 VDS',
      knobs:[k('vin','輸入電壓',24,240,12,96,' V'),k('duty','Duty',10,70,5,40,'%'),k('ratio','Np/Ns 匝數比',1,6,.5,2,''),k('lm','磁化電感',100,600,50,200,' μH'),k('freq','切換頻率',50,250,25,100,' kHz')],
      note:'理想 CCM：忽略壓降、漏感尖峰與負載；不能僅用本輸出電壓／應力值選 MOSFET 或驗證磁芯不飽和。',
      compute:function(v){var d=v.duty/100,vo=v.vin/v.ratio*d/(1-d),dIm=v.vin*d/(v.lm*1e-6*v.freq*1000),stress=v.vin+v.ratio*vo;
        return {values:[['理想 CCM Vo',f(vo,2)+' V'],['磁化電流 ΔIm',f(dIm,2)+' A'],['理想 OFF VDS',f(stress,1)+' V'],['切換週期',f(1000/v.freq,2)+' μs']],warning:'VDS 不含漏感 Spike；需加 Clamp/Snubber 與耐壓裕度。實際工作模式需用負載電流確認。'}
      }
    },
    'mid-core':{
      name:'磁通擺幅 ΔB 與激磁時序',hint:'由伏秒估算磁芯磁通密度變化，理解提高頻率的效果',
      knobs:[k('vin','一次側 ON 電壓',40,400,20,100,' V'),k('duty','單次 ON Duty',10,50,5,40,'%'),k('turns','一次側匝數',10,80,5,30,' turns'),k('area','有效截面 Ae',50,300,25,150,' mm²'),k('freq','切換頻率',25,250,25,100,' kHz')],
      note:'ΔB=V·ton/(N·Ae) 為理想伏秒估計，並非任何磁材的 PASS/FAIL 準則；不同拓樸與激磁方向的允許 ΔB 要另查 B-H 與 Core Loss 曲線。',
      compute:function(v){var db=v.vin*(v.duty/100)/(v.turns*v.area*1e-6*v.freq*1000),voltsecs=v.vin*(v.duty/100)/(v.freq*1000);
        return {values:[['單次 ΔB',f(db,3)+' T'],['ON 伏秒',f(voltsecs*1e6,2)+' V·μs'],['ON 時間',f(v.duty*10/v.freq,2)+' μs'],['核心風險',db>.2?'需核對磁材':'仍需查 B-H／損耗']],warning:db>.2?'ΔB > 0.2 T：僅作提醒門檻，不代表絕對飽和；須查材料、溫度、偏磁與損耗曲線。':''}
      }
    }
  };
  function graph(id,v,metrics){
    var d=Number(v.duty||50)/100,points;
    if(id==='mid-bridge') {
      var amp=Math.max(-1,Math.min(1,(v.da-v.db)/100));
      points=[[0,.5-amp*.35],[.15,.5-amp*.35],[.15,.5+amp*.3],[.4,.5+amp*.3],[.4,.5-amp*.35],[.65,.5-amp*.35],[.65,.5+amp*.3],[.9,.5+amp*.3],[.9,.5-amp*.35],[1,.5-amp*.35]];
    } else if(id==='mid-buckboost') {
      var sign=v.power>=0?1:-1;
      points=[[0,sign>0?.2:.8],[.27,sign>0?.2:.8],[.45,.5],[.55,.5],[.73,sign>0?.8:.2],[1,sign>0?.8:.2]];
    } else if(id==='mid-modes') {
      var bound=v.vin*d*(1-d)/(v.l*1e-6*v.freq*1000)/2;
      var fraction=Math.min(1,Math.max(.1,v.io/Math.max(.001,bound)));
      var stop=v.io<bound?d+(1-d)*fraction:1;
      points=[[0,.88],[d,.14],[stop,.88],[1,.88]];
    } else if(id==='mid-core') {
      points=[[0,.86],[d,.12],[1,.86]];
    } else if(id==='mid-boost'||id==='mid-buck'||id==='mid-flyback') {
      points=[[0,.83],[d,.16],[1,.83]];
    } else {
      points=[[0,.8],[d,.2],[1,.8]];
    }
    var w=330,h=140,x0=25,y0=20;
    var p=points.map(function(z){return (x0+z[0]*w).toFixed(1)+','+(y0+z[1]*h).toFixed(1)}).join(' ');
    var onx=x0+d*w;
    var labels={'mid-buck':'電感電流形狀（示意）','mid-modes':'BCM / DCM 電流概念（示意）','mid-boost':'電感電流形狀（示意）','mid-buckboost':'功率方向概念（示意）','mid-bridge':'差動 PWM 波形概念（示意）','mid-flyback':'一次側磁化電流（示意）','mid-core':'磁通擺幅形狀（示意）'};
    return '<svg viewBox="0 0 380 204" role="img" aria-label="'+esc(labels[id])+'" xmlns="http://www.w3.org/2000/svg">'+
       '<line x1="25" y1="90" x2="357" y2="90" stroke="currentColor" opacity=".12"/>'+
       '<line x1="25" y1="160" x2="357" y2="160" stroke="currentColor" opacity=".28"/>'+
       '<line x1="'+f(onx,1)+'" y1="20" x2="'+f(onx,1)+'" y2="169" stroke="#8494a7" stroke-dasharray="4 5"/>'+
       '<polyline points="'+p+'" fill="none" stroke="#26a58d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'+
       '<text x="26" y="12" fill="currentColor" font-size="11" opacity=".75">'+esc(labels[id])+'</text>'+
       '<text x="26" y="188" fill="currentColor" font-size="11">週期開始</text>'+
       '<text x="356" y="188" text-anchor="end" fill="currentColor" font-size="11">週期結束</text>'+
       '<text x="190" y="201" text-anchor="middle" fill="currentColor" font-size="10" opacity=".65">縱軸未按實際值比例繪製</text></svg>';
  }
  function mount(id,el){
    var def=defs[id];if(!def||!el)return;
    var v={};def.knobs.forEach(function(x){v[x.id]=x.value});
    el.innerHTML='<section class="lab"><div class="lab-top"><div><h3>'+esc(def.name)+'</h3><small>'+esc(def.hint)+'</small></div><span class="pill">INTERACTIVE</span></div>'+
      '<div class="lab-body"><div class="lab-grid"><div class="lab-chart" data-middle-chart></div><div>'+
      def.knobs.map(function(x){return '<div class="control-group"><div class="control-head"><span>'+esc(x.name)+'</span><strong data-lab-value="'+x.id+'"></strong></div><input class="control-range" type="range" data-lab-input="'+x.id+'" min="'+x.min+'" max="'+x.max+'" step="'+x.step+'" value="'+x.value+'" aria-label="'+esc(x.name)+'"></div>'}).join('')+
      '<div class="output-grid" data-middle-output></div><div class="lab-validation" data-middle-warning role="status" hidden></div></div></div></div><div class="lab-disclaimer">'+esc(def.note)+'</div></section>';
    var out=el.querySelector('[data-middle-output]'),warn=el.querySelector('[data-middle-warning]'),chart=el.querySelector('[data-middle-chart]');
    function refresh(){
      def.knobs.forEach(function(x){el.querySelector('[data-lab-value="'+x.id+'"]').textContent=v[x.id]+x.unit});
      var m=def.compute(v);
      out.innerHTML=m.values.map(function(x){return '<div class="output-card"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>'}).join('');
      warn.hidden=!m.warning;warn.textContent=m.warning||'';
      chart.innerHTML=graph(id,v,m);
    }
    el.querySelectorAll('[data-lab-input]').forEach(function(x){
      x.addEventListener('input',function(){v[x.dataset.labInput]=Number(x.value);refresh()});
    });
    refresh();
  }
  window.EE_LABS={mount:mount,definitions:defs};
})();