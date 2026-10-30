/* EEHandouts advanced teaching models. No hardware control; no SPICE claims.
 * Every numerical limit and approximation is surfaced with the result.
 * Maintained independently from the 72 foundational lessons.
 */
(function (root, factory) {
  var models=factory();
  if (typeof module !== 'undefined' && module.exports) module.exports=models;
  if (root) root.EE_ADVANCED_MODELS=models;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var PI=Math.PI;
  function k(key,label,min,max,step,value,unit){return {key:key,label:label,min:min,max:max,step:step,value:value,unit:unit||''};}
  function m(label,value,unit,digits){return {label:label,value:value,unit:unit||'',digits:digits===undefined?2:digits};}
  function sample(key,label,unit,fn,step){
    var points=[];
    for(var i=0;i<=240;i++)points.push(fn(i/240));
    return {key:key,label:label,unit:unit||'',values:points,step:!!step};
  }
  function valid(result){
    if(!result||!Array.isArray(result.metrics)||!Array.isArray(result.traces))throw Error('Incomplete advanced model result');
    result.metrics.forEach(function(x){if(!Number.isFinite(x.value) && !Number.isNaN(x.value))throw Error('Invalid metric '+x.label);});
    result.traces.forEach(function(s){if(!s.values.every(Number.isFinite))throw Error('Invalid trace '+s.key);});
    return result;
  }
  function pos(t){return t>=1?0:t;}
  function limit(x,a,b){return Math.max(a,Math.min(b,x));}
  function unsupported(note){return valid({mode:'OUT_OF_DOMAIN',validity:false,note:note,warning:note,
    metrics:[m('模型狀態',NaN,'')],traces:[],stages:[]});}

  function pfc(v){
    var vac=v.vac,rect=Math.SQRT2*vac*Math.abs(Math.sin(v.phase*PI/180)),bus=v.bus,
      fs=v.fs*1000,L=v.l*1e-6,iref=v.power*rect/(vac*vac);
    if(rect<1||rect>=bus||iref<=0)return unsupported('整流線電壓接近零點或高於 Bus：此固定相位 Boost 穩態模型不適用。');
    var dcmBoundary=rect*(1-rect/bus)/(2*L*fs), mode=iref>dcmBoundary+1e-8?'CCM':iref<dcmBoundary-1e-8?'DCM':'BCM';
    var d=mode==='DCM'?Math.sqrt(2*L*fs*iref*(bus-rect)/(rect*bus)):1-rect/bus;
    var discharge=mode==='DCM'?rect*d/(bus-rect):1-d;
    var gap=Math.max(0,1-d-discharge),ripple=rect*d/(L*fs);
    var valley=mode==='CCM'?iref-ripple/2:0,peak=valley+ripple;
    function state(t){
      t=pos(t);
      if(t<d)return {gate:1,diode:0,il:valley+ripple*t/d,vL:rect,vSW:0,stage:'ON'};
      if(t<d+discharge)return {gate:0,diode:1,il:peak-(peak-(mode==='CCM'?valley:0))*(t-d)/discharge,
        vL:rect-bus,vSW:bus,stage:'DIODE'};
      return {gate:0,diode:0,il:0,vL:0,vSW:rect,stage:'ZERO'};
    }
    var io=(peak+(mode==='CCM'?valley:0))/2*discharge,pin=rect*iref,pout=bus*io;
    return valid({mode:mode,validity:true,note:'此圖把 50/60 Hz 線電壓凍結在指定相位，只解析單一 PWM 週期；平均電流命令按理想正弦電流整形給定。',
      warning:'不含電流迴路、整流橋損耗、DC Bus 電容、交流一整週期電流，因此不計算實際 PF/THD 或硬體保護。',
      assumptions:'理想單相整流後 Boost PFC；DC Bus 固定、L 線性、輸入電流參考與整流電壓成比例，CCM/DCM 選擇不同穩態 Duty。',
      metrics:[m('整流瞬時電壓',rect,'V'),m('Duty',d*100,'%'),m('電流參考／週期平均',iref,'A',3),m('電感谷值',valley,'A',3),
        m('電感峰值',peak,'A',3),m('零電流時間',gap*100,'%'),m('AC→Bus 平均功率',pout,'W',1),m('功率平衡殘差',pin-pout,'W',4)],
      stages:[{id:'ON',label:'MOSFET ON：整流輸入 → L 儲能',start:0,end:d},{id:'DIODE',label:'MOSFET OFF：L + 輸入 → 二極體 → Bus',start:d,end:d+discharge},
        {id:'ZERO',label:'DCM 歸零：二極體截止',start:d+discharge,end:1}],
      traces:[sample('gate','Gate 指令','0/1',function(t){return state(t).gate;},true),
        sample('il','電感電流 iL','A',function(t){return state(t).il;}),
        sample('vl','電感電壓 vL','V',function(t){return state(t).vL;},true),
        sample('vsw','開關節點 vSW','V',function(t){return state(t).vSW;},true),
        sample('diode','整流二極體導通','0/1',function(t){return state(t).diode;},true)],
      probe:function(t){return state(t);},data:{rect:rect,bus:bus,iref:iref,io:io,pin:pin,pout:pout,on:d,freewheel:discharge,zero:gap,peak:peak,valley:valley}});
  }

  function psfb(v){
    var vin=v.vin,n=v.n,phase=v.phase,fs=v.fs*1000,L=v.lout*1e-6,io=v.io;
    var delta=phase/360,d=2*delta,vsec=vin/n,feff=2*fs;
    if(d<=0||d>=1||L<=0||io<=0)return unsupported('相移必須大於 0°、小於 180°，且負載及電感必須為正。');
    var bound=vsec*d*(1-d)/(2*L*feff);
    var mode=io>bound+1e-9?'CCM':io<bound-1e-9?'DCM':'BCM';
    var vo=mode==='DCM'?vsec/(1+2*L*feff*io/(vsec*d*d)):vsec*d;
    var on=delta,free=mode==='DCM'?delta*(vsec/vo-1):0.5-delta;
    var zero=Math.max(0,.5-on-free),peak=mode==='CCM'?io+(vsec-vo)*on/(2*L*fs):(vsec-vo)*on/(L*fs);
    var valley=mode==='CCM'?io-(vsec-vo)*on/(2*L*fs):0;
    function state(t){
      t=pos(t);var half=t>=.5?1:0,within=t-half*.5;
      var gateA=t<.5?1:0,gateB=(t-delta+1)%1<.5?1:0,primary=(gateA-gateB)*vin;
      var il,stage;if(within<on){il=valley+(peak-valley)*within/on;stage:'ON';stage='TRANSFER';}
      else if(within<on+free){il=peak-(peak-(mode==='CCM'?valley:0))*(within-on)/free;stage='FREEWHEEL';}
      else {il=0;stage='ZERO';}
      return {gateA:gateA,gateB:gateB,vab:primary,vrect:Math.abs(primary)/n,
        il:il,ip:primary===0?0:Math.sign(primary)*il/n,stage:stage};
    }
    var pout=vo*io,pin=vsec*delta*(peak+valley); // two active pulses, each of length delta*T
    return valid({mode:mode,validity:true,
      note:'每個全週期有兩段相移功率傳輸脈波。改變相移角會改變整流後有效 Duty，CCM/DCM 使用各自穩態解。',
      warning:'此模型未包含變壓器漏感換流重疊、零電壓切換 ZVS、同步整流時序、死區或循環電流。實際有效 Duty 可能低於理想值。',
      assumptions:'理想 50% 雙橋臂相移，全橋一次側 ±Vin／0；理想全波整流、次級非同步 L 濾波、固定輸出電流。忽略漏感與損耗。',
      metrics:[m('有效整流 Duty',d*100,'%'),m('理想輸出 Vout',vo,'V'),m('輸出 IL 峰值',peak,'A',3),m('輸出 IL 谷值',valley,'A',3),
        m('每半週零電流時間',zero*200,'%'),m('平均輸出功率',pout,'W'),m('一次側傳輸功率殘差',pin-pout,'W',4)],
      stages:[{id:'TRANSFER',label:'對角橋臂導通：一次側 ±Vin，次級整流向輸出傳能',start:0,end:on},
        {id:'FREEWHEEL',label:'一次側零電壓狀態，輸出電感經續流路徑供電',start:on,end:on+free},
        {id:'ZERO',label:'輕載 DCM：次級電感電流歸零',start:on+free,end:.5}],
      traces:[sample('ga','A 臂高側命令','0/1',function(t){return state(t).gateA;},true),
        sample('gb','B 臂高側命令','0/1',function(t){return state(t).gateB;},true),
        sample('vab','一次側差動 vAB','V',function(t){return state(t).vab;},true),
        sample('vr','次級整流電壓','V',function(t){return state(t).vrect;},true),
        sample('il','輸出電感 iL','A',function(t){return state(t).il;}),
        sample('ip','一次側理想傳能電流','A',function(t){return state(t).ip;})],
      probe:function(t){return state(t);},data:{d:d,delta:delta,on:on,free:free,zero:zero,peak:peak,valley:valley,vo:vo,pout:pout,pin:pin,io:io}});
  }

  function llc(v){
    // Half-bridge square excitation of Lr-Cr-(Lm||Rac): time-domain switched tank,
    // FHA-equivalent rectifier load. This is not a physical switching diode model.
    var vin=v.vin,fs=v.fs*1000,n=v.n,lr=v.lr*1e-6,cr=v.cr*1e-9,lm=v.lm*1e-6,
      rac=8*n*n*v.rdc/(PI*PI),T=1/fs,N=240,settle=160;
    var y=[0,0,0],trace={drive:[],ir:[],im:[],vcr:[],vp:[],energy:[]},driveAmp=vin/2,avgIn=0,avgLoss=0;
    // A-stable implicit trapezoid, solved algebraically for iLr, vCr and iLm.
    // Explicit RK4 can diverge when Rac/Lr creates a fast load-current time scale.
    function advance(q,u,dt){
      var h=dt/2,a=h/cr,b=h/lm,d=h/lr,p=rac*(q[0]-q[2]),
        alpha=rac/(1+rac*b),beta=-rac*(q[2]+b*p)/(1+rac*b);
      var ir=(q[0]+d*(2*u-2*q[1]-a*q[0]-p-beta))/(1+d*(a+alpha));
      var nextP=alpha*ir+beta;
      return [ir,q[1]+a*(q[0]+ir),q[2]+b*(p+nextP)];
    }
    var dt=T/N;
    for(var cyc=0;cyc<settle;cyc++){
      for(var j=0;j<N;j++){
        if(cyc===settle-1){
          var vp=rac*(y[0]-y[2]);trace.drive.push(j<N/2?driveAmp:-driveAmp);
          trace.ir.push(y[0]);trace.im.push(y[2]);trace.vcr.push(y[1]);trace.vp.push(vp);
          trace.energy.push((lr*y[0]*y[0]+cr*y[1]*y[1]+lm*y[2]*y[2])/2);
        }
        var u=j<N/2?driveAmp:-driveAmp;
        var next=advance(y,u,dt);
        if(cyc===settle-1){
          var v0=rac*(y[0]-y[2]),v1=rac*(next[0]-next[2]);
          avgIn+=u*(y[0]+next[0])/(2*N);
          avgLoss+=Math.pow((v0+v1)/2,2)/(rac*N);
        }
        y=next;
      }
    }
    function close(a,last){return a.concat(last===undefined?a[0]:last);}
    var vpCos=0,vpSin=0,ir2=0,im2=0;
    for(var i=0;i<N;i++){
      var a=2*PI*i/N;
      vpCos+=trace.vp[i]*Math.cos(a)*2/N;
      vpSin+=trace.vp[i]*Math.sin(a)*2/N;
      ir2+=trace.ir[i]*trace.ir[i]/N;im2+=trace.im[i]*trace.im[i]/N;
    }
    var vp1=Math.hypot(vpCos,vpSin)/Math.SQRT2;
    var vo=PI*vp1/(2*Math.SQRT2*n),fhaPower=vo*vo/v.rdc;
    var f0=1/(2*PI*Math.sqrt(lr*cr)),wlm=2*PI*fs*lm,
      imag=2*PI*fs*lr-1/(2*PI*fs*cr)+rac*rac*wlm/(rac*rac+wlm*wlm),
      real=rac*wlm*wlm/(rac*rac+wlm*wlm),angle=Math.atan2(imag,real)*180/PI,
      energyDrift=((lr*y[0]*y[0]+cr*y[1]*y[1]+lm*y[2]*y[2])/2-trace.energy[0])/T;
    var residual=avgIn-avgLoss-energyDrift;
    // Pin-Pload = dE/dt is also true during transients. Verify all state
    // variables close over the switching cycle before claiming steady state.
    var maxAbs=function(arr,min){return Math.max(min,Math.max.apply(null,arr.map(Math.abs)));},
      closeIr=Math.abs(y[0]-trace.ir[0])/maxAbs(trace.ir,0.05),
      closeCr=Math.abs(y[1]-trace.vcr[0])/maxAbs(trace.vcr,0.5),
      closeIm=Math.abs(y[2]-trace.im[0])/maxAbs(trace.im,0.05),
      periodicityError=Math.max(closeIr,closeCr,closeIm),
      lastEnergy=(lr*y[0]*y[0]+cr*y[1]*y[1]+lm*y[2]*y[2])/2,
      energyCycleError=Math.abs(lastEnergy-trace.energy[0])/Math.max(lastEnergy,trace.energy[0],1e-9);
    var validity=periodicityError<=0.02&&energyCycleError<=0.02&&avgIn>0&&avgLoss>0&&vo>0&&
      Math.abs(residual)<=Math.max(0.1,0.02*avgIn);
    return valid({mode:validity?(angle>=0?'INDUCTIVE':'CAPACITIVE'):'UNSETTLED',validity:validity,
      assumptions:'半橋 ±Vin/2 方波激勵，串聯 Lr、Cr，並聯 Lm 與 FHA 等效電阻 Rac=8n²Rdc/π²；隱式梯形積分取最後一週期，忽略真實二極體換向、Coss、Dead Time、磁芯非線性。',
      note:'開關頻率相對於串聯共振 f0，以及輸入阻抗相位，決定所見電感性／電容性；時間波形是 FHA 負載近似下的切換方波響應。',
      warning:!validity?'LLC 週期未充分收斂、輸入功率異常或儲能漂移：目前波形不可當穩態輸出。請調整 Lr／Cr／Lm、負載或頻率。':'此 R_ac 線性時域模型也消耗高次諧波：FHA 基波換算功率不等於 R_ac 全頻帶耗散，不能視為實際 DC 功率／效率。阻抗呈電感性不代表已 ZVS。',
      metrics:[m('串聯共振 f0',f0/1000,'kHz'),m('fSW/f0',fs/f0,'',3),m('FHA 估計輸出 DC',validity?vo:NaN,'V'),
        m('一次側諧振電流 RMS',validity?Math.sqrt(ir2):NaN,'A',3),
        m('磁化電流 RMS',validity?Math.sqrt(im2):NaN,'A',3),
        m('基波輸入阻抗相位',angle,'°',2),
        m('FHA 基波換算功率',validity?fhaPower:NaN,'W'),
        m('Rac 含諧波等效耗散',validity?avgLoss:NaN,'W'),
        m('週期狀態閉合誤差',periodicityError*100,'%',2),
        m('週期儲能漂移',energyCycleError*100,'%',2),
        m('等效回路能量殘差',residual,'W',3)],
      stages:[{id:'POSITIVE',label:'半橋正向激勵：Lr/Cr/Lm 儲放能',start:0,end:.5},
        {id:'NEGATIVE',label:'半橋反向激勵：諧振電流可能跨零與回灌',start:.5,end:1}],
      traces:[{key:'drive',label:'半橋驅動電壓',unit:'V',values:close(trace.drive),step:true},
        {key:'ir',label:'諧振電流 iLr',unit:'A',values:close(trace.ir,y[0]),step:false},
        {key:'im',label:'磁化電流 iLm',unit:'A',values:close(trace.im,y[2]),step:false},
        {key:'vcr',label:'諧振電容電壓',unit:'V',values:close(trace.vcr,y[1]),step:false},
        {key:'vp',label:'一次側等效負載電壓',unit:'V',values:close(trace.vp,rac*(y[0]-y[2])),step:false},
        {key:'energy',label:'諧振槽總儲能',unit:'mJ',values:close(trace.energy.map(function(e){return e*1000;}),lastEnergy*1000),step:false}],
      data:{fs:fs,f0:f0,rac:rac,vo:vo,avgIn:avgIn,avgLoad:avgLoss,energyDrift:energyDrift,energyResidual:residual,fhaPower:fhaPower,angle:angle,
        startEnergy:trace.energy[0],endEnergy:lastEnergy,periodicityError:periodicityError,energyCycleError:energyCycleError}});
  }

  function c(re,im){return {re:re,im:im||0};}
  function mul(a,b){return c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);}
  function div(a,b){var x=b.re*b.re+b.im*b.im;return c((a.re*b.re+a.im*b.im)/x,(a.im*b.re-a.re*b.im)/x);}
  function loop(v){
    var L=v.l*1e-6,C=v.c*1e-6,R=v.r,esr=v.esr/1000,vin=v.vin,fs=v.fs*1000,
      kp=v.kp,fz=v.fz,fp=v.fp,delay=v.delay*1e-6;
    var fo=vin/2,io=fo/R,ripple=(vin-fo)*.5/(L*fs),ccm=io>ripple/2;
    var points=[],N=220,fmin=10,fmax=fs*.45,prev=null,cross=[],pcross=[];
    function transfer(f){
      var w=2*PI*f,plant=div(c(vin,w*vin*esr*C),c(1-w*w*L*C*(1+esr/R),w*(L/R+esr*C))),
        comp=div(c(kp,-kp*2*PI*fz/w),c(1,w/(2*PI*fp))),
        L0=mul(plant,comp);L0=mul(L0,c(Math.cos(w*delay),-Math.sin(w*delay)));
      L0.re/=v.ramp;L0.im/=v.ramp;
      return {db:20*Math.log10(Math.hypot(L0.re,L0.im)),raw:Math.atan2(L0.im,L0.re)*180/PI};
    }
    for(var i=0;i<N;i++){
      var f=fmin*Math.pow(fmax/fmin,i/(N-1)),z=transfer(f),phase=z.raw;
      if(prev){while(phase-prev.phase>180)phase-=360;while(phase-prev.phase< -180)phase+=360;}
      var q={t:i/(N-1),f:f,db:z.db,phase:phase};
      if(prev){
        if((prev.db>=0&&q.db<0)||(prev.db<=0&&q.db>0)){
          var u=(0-prev.db)/(q.db-prev.db);
          cross.push({f:Math.exp(Math.log(prev.f)+u*(Math.log(q.f)-Math.log(prev.f))),phase:prev.phase+u*(phase-prev.phase)});
        }
        if(prev.phase>-180&&phase<=-180){
          var t=(-180-prev.phase)/(phase-prev.phase);
          pcross.push({f:Math.exp(Math.log(prev.f)+t*(Math.log(q.f)-Math.log(prev.f))),db:prev.db+t*(q.db-prev.db)});
        }
      }
      points.push(q);prev=q;
    }
    var primary=cross.length?cross[0]:null,pm=primary?180+primary.phase:NaN,
      gm=pcross.length?-pcross[0].db:NaN;
    return valid({mode:!ccm?'OUT_OF_DOMAIN':!primary?'NO_CROSSOVER':pm<=0?'UNSTABLE_MARGIN':'LINEAR_MODEL',
      validity:ccm,assumptions:'固定 CCM 電壓模式 Buck 小訊號 Gvd；負載純電阻、包含輸出電容 ESR 零點；連續時間 PI + 高頻單極點 + 固定取樣到 PWM 延遲。未包含 ZOH 完整離散化、電流內迴路、限幅及非線性。',
      note:'Bode 曲線為複數頻率響應；用 0 dB 交越附近開迴路相位估計相位裕度，若有多重交越需全部檢視。',
      warning:!ccm?'初始工作點落入 DCM：此 CCM 植物模型不適用，請調整負載／L／fs。':
        !primary?'掃描頻段找不到 0 dB 交越，不能報告相位裕度。':
        (cross.length>1?'出現多個 0 dB 交越，不可只依第一個 PM 斷定穩定。':
        primary.f>fs/10?'交越頻率超過 fs/10 教學準則，需以取樣／離散模型再驗證。':'相位裕度只是線性模型指標，不能替代功率級實機閉迴路驗證。'),
      metrics:[m('0 dB 首次交越頻率',ccm&&primary?primary.f:NaN,'Hz'),m('首次交越相位裕度',ccm?pm:NaN,'°'),
        m('增益裕度（第一 −180° 交越）',ccm?gm:NaN,'dB'),m('0 dB 交越次數',ccm?cross.length:NaN,'',0),
        m('LC 自然頻率',1/(2*PI*Math.sqrt(L*C)),'Hz'),m('BCM 臨界 Io',ripple/2,'A')],
      stages:[],traces:[{key:'gain',label:'開迴路增益',unit:'dB',values:points.map(function(p){return p.db;}),x:points.map(function(p){return p.f;}),step:false},
        {key:'phase',label:'開迴路相位',unit:'°',values:points.map(function(p){return p.phase;}),x:points.map(function(p){return p.f;}),step:false}],
      data:{crossovers:cross,phaseCrossings:pcross,fc:primary?primary.f:NaN,pm:pm,gm:gm,ccm:ccm,fs:fs,points:points}});
  }

  function timing(v){
    var tbclk=v.tbclk*1e6,desiredFs=v.fs*1000,periodCounts=Math.round(tbclk/(2*desiredFs));
    if(periodCounts<2)return unsupported('TBPRD 小於 2：目前解析度無效。');
    var T=2*periodCounts/tbclk*1e6,cmp=Math.round(periodCounts*v.cmp/100),cmpUp=cmp/periodCounts*T/2,
      cmpDown=T-cmpUp,source={ZERO:0,PERIOD:T/2,CMP_UP:cmpUp,CMP_DOWN:cmpDown},soc=source[v.soca],
      acqEnd=soc+v.acq/1000,eoc=acqEnd+v.conv/1000,isr=eoc+v.entry/1000,
      finish=isr+v.isr/1000,loads=[];
    for(var cycle=0;cycle<32;cycle++){
      var t=cycle*T;
      if(v.shadow==='ZERO'||v.shadow==='BOTH')loads.push(t);
      if(v.shadow==='PERIOD'||v.shadow==='BOTH')loads.push(t+T/2);
    }
    loads.sort(function(a,b){return a-b;});
    var load=loads.find(function(t){return t>finish+1/tbclk*1e6});
    if(load===undefined)return unsupported('計算延遲超出展示的 32 個 PWM 週期，請減少 ISR 預算。');
    var nextSoc=soc+T,overrun=finish>=nextSoc,latency=load-soc;
    var events=[{key:'SOCA',label:'ePWM SOCA',at:soc},{key:'ACQ',label:'ADC 取樣窗結束',at:acqEnd},
      {key:'EOC',label:'ADC EOC',at:eoc},{key:'ENTRY',label:'CPU ISR 進入',at:isr},
      {key:'FINISH',label:'計算完成／shadow 寫入',at:finish},{key:'LOAD',label:'下一次 PWM shadow→active',at:load}];
    var width=Math.max(3*T,load+T*.4),renderTimes=[];
    for(var i=0;i<241;i++)renderTimes.push(i*width/240);
    function counter(t){var z=(t%T)/T;return z<=.5?2*z:2*(1-z);}
    return valid({mode:overrun?'CPU_OVERRUN':load>=soc+T?'NEXT_CYCLE':'SAME_CYCLE',validity:!overrun,
      assumptions:'F28004x 型 ePWM UP-DOWN 計數示意：TBCLK、TBPRD、CMPA 由輸入設定量化；SOCA 可由 ZERO／PERIOD／CMPA up/down 觸發。ADC 取樣、轉換、ISR 進入和執行時間均是使用者假設值，不是 TRM 保證值。假設 ISR 由 EOC 觸發，CMP shadow load 於 ZERO／PERIOD，無其他 ISR 或匯流排競用。',
      note:'從 SOCA→取樣→EOC→CPU ISR→寫 CMP shadow→下一個 load event。未完成計算時不能把新 PWM 值套用到已經發生的 load。',
      warning:overrun?'ISR 完成時間已跨過下一個相同 SOCA，可能堆積觸發／錯過即時預算；此模型判定為失敗。':
        '此圖不是晶片實測或暫存器設定產生器；須以 F28004x TRM、ePWM/ADC DriverLib 及 GPIO 示波驗證 shadow load、ADCINT 與實際 WCET。',
      metrics:[m('量化後 TBPRD',periodCounts,'count',0),m('實際 PWM 週期',T,'µs',3),m('SOCA 時刻',soc,'µs',3),
        m('ADC EOC 時刻',eoc,'µs',3),m('ISR 計算完成',finish,'µs',3),m('新 Duty 生效',load,'µs',3),
        m('取樣到 PWM 生效延遲',latency,'µs',3),m('下個 SOCA 前 CPU 裕度',nextSoc-finish,'µs',3)],
      stages:events.map(function(e){return {id:e.key,label:e.label,start:e.at/width,end:e.at/width};}),
      traces:[{key:'counter',label:'UP-DOWN TBCTR / TBPRD',unit:'ratio',x:renderTimes,values:renderTimes.map(counter),step:false}],
      events:events,data:{tbprd:periodCounts,cmpa:cmp,T:T,soc:soc,acqEnd:acqEnd,eoc:eoc,isrStart:isr,finish:finish,load:load,latency:latency,
        nextSoc:nextSoc,overrun:overrun,width:width}});
  }

  function nonideal(v){
    var d=v.duty/100,td=v.dead*1e-9*v.fs*1000,fs=v.fs*1000,L=v.l*1e-6,C=v.c*1e-6,
      rh=v.rh/1000,rl=v.rl/1000,rdcr=v.dcr/1000,esr=v.esr/1000;
    if(td>=Math.min(d,1-d))return unsupported('Dead Time 佔比過大，已與占空比重疊；此簡化同步 Buck 模型失效。');
    var high=d-td,low=1-d-td,body=2*td,r=v.load;
    var vo=(high*v.vin-body*v.vdiode)/(1+(rh*high+rl*low+rdcr)/r),io=vo/r;
    if(vo<=0||io<=0)return unsupported('有效輸出為非正，需重新確認工況；本模型僅支援正向電流同步 Buck。');
    var pHigh=io*io*rh*high,pLow=io*io*rl*low,pDcr=io*io*rdcr,
      pDead=io*body*v.vdiode,pSwitch=v.esum*1e-6*fs,po=vo*io,
      pin=high*v.vin*io+pSwitch;
    var N=480,iWalk=[0],slopeIntegral=0;
    function state(t){
      t=pos(t);
      if(t<td||t>=d&&t<d+td)return {stage:'DEAD',gate:0,vsw:-v.vdiode};
      if(t<d)return {stage:'HIGH',gate:1,vsw:v.vin-rh*io};
      return {stage:'LOW',gate:0,vsw:-rl*io};
    }
    for(var j=0;j<N;j++){
      var z=state((j+.5)/N);
      slopeIntegral+=((z.vsw-vo-rdcr*io)/L)/(fs*N);
      iWalk.push(slopeIntegral);
    }
    var mean=iWalk.slice(0,N).reduce(function(a,b){return a+b;},0)/N;
    var currents=iWalk.map(function(x){return io+x-mean;}),charge=[0];
    for(var j=0;j<N;j++)charge.push(charge[j]+(currents[j]+currents[j+1]-2*io)/(2*N*fs*C));
    var capMean=charge.slice(0,N).reduce(function(a,b){return a+b;},0)/N;
    var fullV=currents.map(function(x,i){return vo+charge[i]-capMean+esr*(x-io);});
    var ripple=Math.max.apply(null,currents)-Math.min.apply(null,currents),rV=Math.max.apply(null,fullV)-Math.min.apply(null,fullV);
    function valueAt(arr,t){return arr[Math.min(N,Math.round(pos(t)*N))];}
    var conduction=pHigh+pLow+pDcr+pDead,poutIdeal=v.vin*d*v.vin*d/r,eff=100*po/pin;
    return valid({mode:currents.some(function(x){return x<=0;})?'OUT_OF_DOMAIN':'CCM_SYNC_BUCK',validity:currents.every(function(x){return x>0;}),
      assumptions:'固定負載 R、連續導通同步 Buck；2 個等長 Dead Time 內以低側 Body Diode 續流；高／低 MOSFET RDS(on)、電感 DCR、理想固定 Eon+Eoff、電容 ESR；電流取週期穩態且忽略溫度、Coss、磁芯與非線性。',
      note:'理想 Vout=D Vin；非理想 Vout 由導通壓降伏秒平衡求得；電容漣波積分 iC=iL−Io，再疊加 ESR 電壓。',
      warning:currents.some(function(x){return x<=0;})?'電感電流可能歸零，CCM 模型不適用；不要使用此非理想數值選型。':
        'Eon/Eoff 固定能量只計入輸入損耗，不反推輸出調節量；未包含切換過衝、佈線環路寄生與實際熱效應。',
      metrics:[m('理想 Buck Vout',v.vin*d,'V'),m('非理想 Buck Vout',vo,'V'),m('非理想效率',eff,'%'),
        m('MOS＋DCR 導通損',pHigh+pLow+pDcr,'W',3),m('Dead Time 二極體損耗',pDead,'W',3),
        m('固定開關損耗',pSwitch,'W',3),m('電感 ΔIL',ripple,'A',3),m('電容＋ESR ΔVpp',rV*1000,'mVpp',2)],
      stages:[{id:'DEAD1',label:'高側開啟前 Dead Time：Body Diode 續流',start:0,end:td},
        {id:'HIGH',label:'高側導通：Vin → MOSFET → L → Load',start:td,end:d},
        {id:'DEAD2',label:'低側導通前 Dead Time：Body Diode 續流',start:d,end:d+td},
        {id:'LOW',label:'低側同步續流',start:d+td,end:1}],
      traces:[sample('gate','高側 Gate 指令','0/1',function(t){return state(t).gate;},true),
        sample('vsw','開關節點 vSW','V',function(t){return state(t).vsw;},true),
        sample('il','電感電流 iL','A',function(t){return valueAt(currents,t);}),
        sample('vo','含 ESR 電容端電壓','V',function(t){return valueAt(fullV,t);})],
      probe:function(t){return state(t);},data:{ideal:v.vin*d,vo:vo,io:io,ripple:ripple,rV:rV,pin:pin,po:po,conduction:conduction,pSwitch:pSwitch,pLoss:conduction+pSwitch,
        energyError:pin-po-conduction-pSwitch,td:td,high:high,low:low,body:body}});
  }

  function zvs(v){
    var L=v.leak*1e-6,I=v.ip,C=2*v.coss*1e-12,V=v.vin,dead=v.dead*1e-9,fs=v.fs*1000,
      eL=L*I*I/2,eC=C*V*V/2,tReq=I>0?C*V/I:Infinity,
      energy=eL>=eC,time=dead>=tReq;
    return valid({mode:energy&&time?'ENERGY_AND_TIME':'INSUFFICIENT',validity:true,
      assumptions:'PSFB 某橋臂換流能量門檻的簡化檢查：Llk 中 E=1/2 Llk Ipri²，兩顆等效定值 Coss 合成 Ceq=2Coss，電容充放 E=1/2 Ceq Vbus²；假設換流電流固定，t≈Ceq V/I。',
      note:'漏感能量與 Dead Time 只是 ZVS 必要條件的粗估，兩者達標也不代表 MOSFET 真正達成 ZVS。',
      warning:'未模擬非線性 Coss(V)、磁化電流、死區 Body Diode、變壓器寄生、領先／落後橋臂差異、能量可用比例及電感電流換向。不得作為 ZVS 合格判定。',
      metrics:[m('Llk 可用儲能',eL*1e6,'µJ',3),m('兩顆 Coss 所需能量',eC*1e6,'µJ',3),
        m('能量比 E_L/E_C',eC>0?eL/eC:NaN,'',3),m('粗估換流時間',Number.isFinite(tReq)?tReq*1e9:NaN,'ns',2),
        m('設定 Dead Time',dead*1e9,'ns',2),m('能量足夠？',energy?1:0,'0/1',0),m('時間足夠？',time?1:0,'0/1',0)],
      stages:[],traces:[{key:'energy',label:'換流能量比較',unit:'µJ',values:[eL*1e6,eC*1e6],labels:['Llk','Coss'],step:false}].concat(
        Number.isFinite(tReq)?[{key:'time',label:'時間預算比較',unit:'ns',values:[dead*1e9,tReq*1e9],labels:['Dead Time','所需換流'],step:false}]:[]),
      data:{eL:eL,eC:eC,tReq:tReq,energy:energy,time:time,fs:fs}});
  }

  var catalog={
    pfc:{title:'Boost PFC｜CCM / BCM / DCM',category:'power',knobs:[k('vac','AC 電壓 RMS',100,240,10,230,'V'),k('bus','DC Bus',300,450,10,400,'V'),k('phase','市電相位',5,175,5,60,'°'),k('power','理想目標輸入功率',100,3000,100,1000,'W'),k('l','Boost L',100,800,20,460,'µH'),k('fs','PWM 頻率',50,200,10,100,'kHz')],compute:pfc,
      source:'https://www.ti.com/document-viewer/lit/html/SLUAAO8/GUID-86F7AD2D-7DF0-45E7-B7A9-79F8DC862F14'},
    llc:{title:'LLC｜半橋諧振槽逐週期',category:'power',knobs:[k('vin','DC Bus',250,450,25,400,'V'),k('fs','開關頻率',60,200,10,110,'kHz'),k('lr','Lr',10,60,5,20,'µH'),k('cr','Cr',40,200,20,100,'nF'),k('lm','Lm',60,300,20,120,'µH'),k('rdc','二次側 DC 負載電阻',4,32,2,8,'Ω'),k('n','Np/Ns',4,12,1,8,'')],compute:llc,
      source:'https://www.ti.com/seclit/ml/slup263/slup263.pdf'},
    psfb:{title:'PSFB｜相移、整流與輸出電感',category:'power',knobs:[k('vin','一次側 DC Bus',200,500,20,400,'V'),k('phase','橋臂相移角',10,170,10,90,'°'),k('n','Np/Ns',4,12,1,8,''),k('fs','PWM 頻率',50,200,10,100,'kHz'),k('lout','輸出濾波 L',20,200,20,100,'µH'),k('io','輸出定電流負載',.1,10,.1,3,'A')],compute:psfb,
      source:'https://www.ti.com/document-viewer/lit/html/SLUP414/GUID-C4C4C20D-3B3D-4298-813F-5E3A9DA91B12'},
    loop:{title:'Buck 電壓迴路｜Bode 與裕度',category:'control',knobs:[k('vin','輸入電壓',24,72,4,48,'V'),k('fs','PWM 頻率',50,250,25,100,'kHz'),k('l','輸出 L',20,300,20,100,'µH'),k('c','輸出 C',20,500,20,100,'µF'),k('r','負載 R',2,24,2,8,'Ω'),k('esr','電容 ESR',0,200,10,20,'mΩ'),k('kp','PI 比例 Kp',.002,.05,.002,.01,''),k('fz','PI 零點',100,3000,100,500,'Hz'),k('fp','補償高頻極點',5000,60000,5000,30000,'Hz'),k('delay','控制固定延遲',0,10,.5,2,'µs'),k('ramp','PWM ramp 峰對峰',.5,3,.5,1,'V')],compute:loop,
      source:'https://www.ti.com/lit/ug/sprui33c/sprui33c.pdf'},
    timing:{title:'C2000｜ePWM SOCA → ADC → ISR → Shadow',category:'control',knobs:[k('tbclk','ePWM TBCLK',50,200,25,100,'MHz'),k('fs','PWM 頻率',25,200,25,100,'kHz'),k('cmp','CMPA/TBPRD',10,90,5,35,'%'),k('acq','ADC ACQ 假設時間',50,600,25,125,'ns'),k('conv','ADC conversion 假設',100,800,50,300,'ns'),k('entry','ISR 入口延遲',50,600,25,150,'ns'),k('isr','ISR WCET',100,30000,100,1000,'ns')],
      selectors:[{key:'soca',label:'SOCA 事件',options:[['ZERO','TBCTR ZERO'],['PERIOD','TBCTR PERIOD'],['CMP_UP','CMPA up'],['CMP_DOWN','CMPA down']],value:'CMP_UP'},
        {key:'shadow',label:'CMP Shadow load',options:[['ZERO','ZERO'],['PERIOD','PERIOD'],['BOTH','ZERO + PERIOD']],value:'ZERO'}],compute:timing,
      source:'https://www.ti.com/lit/ug/sprui33c/sprui33c.pdf'},
    nonideal:{title:'同步 Buck｜理想與非理想比較',category:'nonideal',knobs:[k('vin','Vin',12,60,4,48,'V'),k('duty','Duty',10,90,5,50,'%'),k('fs','PWM 頻率',50,200,25,100,'kHz'),k('l','輸出 L',40,300,20,100,'µH'),k('c','輸出 C',100,1000,100,470,'µF'),k('load','負載 R',2,20,2,8,'Ω'),k('rh','高側 RDS(on)',2,80,2,20,'mΩ'),k('rl','低側 RDS(on)',2,80,2,20,'mΩ'),k('dcr','電感 DCR',5,100,5,40,'mΩ'),k('dead','每次 Dead Time',0,800,25,150,'ns'),k('vdiode','Body Diode Vf',.4,1.2,.1,.7,'V'),k('esr','電容 ESR',0,100,5,20,'mΩ'),k('esum','Eon+Eoff',0,200,10,40,'µJ')],compute:nonideal,
      source:'https://www.ti.com/lit/ug/sprui33c/sprui33c.pdf'},
    zvs:{title:'PSFB 漏感、Coss 與 Dead Time',category:'nonideal',knobs:[k('vin','DC Bus',200,600,20,400,'V'),k('ip','換流一次側電流',0,20,1,4,'A'),k('leak','變壓器漏感 Llk',1,20,1,5,'µH'),k('coss','每顆 MOSFET 等效 Coss',100,2000,100,300,'pF'),k('dead','Dead Time',50,1000,50,200,'ns'),k('fs','PWM 頻率',50,200,25,100,'kHz')],compute:zvs,
      source:'https://www.ti.com/document-viewer/lit/html/SLUP414/GUID-C4C4C20D-3B3D-4298-813F-5E3A9DA91B12'}
  };
  function params(id,overrides){
    var d=catalog[id];if(!d)throw Error('Unknown advanced lab: '+id);
    var input={};d.knobs.forEach(function(k){input[k.key]=k.value;});
    (d.selectors||[]).forEach(function(s){input[s.key]=s.value;});
    return Object.assign(input,overrides||{});
  }
  function calculate(id,overrides){var d=catalog[id];if(!d)throw Error('Unknown lab '+id);return d.compute(params(id,overrides));}
  return {catalog:catalog,params:params,calculate:calculate};
});