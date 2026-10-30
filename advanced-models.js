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
    var L=v.l*1e-6,C=v.c*1e-6,R=v.r,esr=v.esr/1000,vin=v.vin,fs=v.fs*1000,kp=v.kp,
      fz=v.fz,fp=v.fp,delay=v.delay*1e-6,fo=vin/2,io=fo/R,
      ripple=(vin-fo)*.5/(L*fs),ccm=io>ripple/2;
    var fmin=10,fmax=fs*.45,low=Math.log(fmin),high=Math.log(fmax),N=220,cross=[],pcross=[];
    function transfer(f){
      var w=2*PI*f,plant=div(c(vin,w*vin*esr*C),c(1-w*w*L*C*(1+esr/R),w*(L/R+esr*C))),
        comp=div(c(kp,-kp*2*PI*fz/w),c(1,w/(2*PI*fp))),z=mul(plant,comp);
      z=mul(z,c(Math.cos(w*delay),-Math.sin(w*delay)));
      z.re/=v.ramp;z.im/=v.ramp;
      return {db:20*Math.log10(Math.hypot(z.re,z.im)),raw:Math.atan2(z.im,z.re)*180/PI};
    }
    // An LC resonance can go above AND below 0 dB inside a single coarse
    // plotting segment. Find log-gain extrema before searching for roots.
    function slope(x){var h=1e-5;return (transfer(Math.exp(x+h)).db-transfer(Math.exp(x-h)).db)/(2*h);}
    function bisect(fn,a,b){
      var va=fn(a),vb=fn(b);if(!Number.isFinite(va)||!Number.isFinite(vb)||va*vb>0)return null;
      for(var j=0;j<55;j++){var mid=(a+b)/2,vm=fn(mid);if(!Number.isFinite(vm))return null;
        if(va*vm>0){a=mid;va=vm;}else{b=mid;vb=vm;}}
      return (a+b)/2;
    }
    var xs=[];for(var i=0;i<N;i++)xs.push(low+(high-low)*i/(N-1));
    [1/(2*PI*Math.sqrt(L*C)),fz,fp,esr?1/(2*PI*esr*C):NaN].forEach(function(f){
      if(f>fmin&&f<fmax)xs.push(Math.log(f));
    });
    xs.sort(function(a,b){return a-b;});
    xs=xs.filter(function(v,i,a){return i===0||v-a[i-1]>1e-9;});
    var extrema=[];
    for(var i=1;i<xs.length;i++){
      var a=xs[i-1],b=xs[i];
      if(slope(a)*slope(b)<0){var root=bisect(slope,a,b);if(root!==null)extrema.push(root);}
    }
    xs=xs.concat(extrema).sort(function(a,b){return a-b;}).filter(function(v,i,a){return i===0||v-a[i-1]>1e-9;});
    function unwrap(p,last){while(p-last>180)p-=360;while(p-last< -180)p+=360;return p;}
    var points=xs.map(function(x){var f=Math.exp(x),z=transfer(f);
      return {f:f,db:z.db,phase:z.raw,logf:x,t:(x-low)/(high-low)};});
    for(var i=1;i<points.length;i++)points[i].phase=unwrap(points[i].phase,points[i-1].phase);
    function appendUnique(list,item){if(!list.length||Math.abs(Math.log(list[list.length-1].f/item.f))>1e-7)list.push(item);}
    for(var i=1;i<points.length;i++){
      var left=points[i-1],right=points[i];
      if(left.db*right.db<=0&&left.db!==right.db){
        var at=bisect(function(x){return transfer(Math.exp(x)).db;},left.logf,right.logf);
        if(at!==null){var f=Math.exp(at),z=transfer(f),phase=unwrap(z.raw,left.phase);
          appendUnique(cross,{f:f,phase:phase,pm:180+phase});}
      }
      if(left.phase> -180&&right.phase<= -180){
        var at=bisect(function(x){return unwrap(transfer(Math.exp(x)).raw,left.phase)+180;},left.logf,right.logf);
        if(at!==null){var f=Math.exp(at);appendUnique(pcross,{f:f,db:transfer(f).db});}
      }
    }
    // Render actual peak and crossing points. The viewer positions these
    // nonuniform samples by log(f), not array-index spacing.
    var plot=points.concat(cross.map(function(p){var z=transfer(p.f);
      return {f:p.f,db:z.db,phase:p.phase,logf:Math.log(p.f),t:(Math.log(p.f)-low)/(high-low)};}))
      .sort(function(a,b){return a.f-b.f;})
      .filter(function(p,i,a){return i===0||Math.abs(Math.log(p.f/a[i-1].f))>1e-9;});
    for(var i=1;i<plot.length;i++)plot[i].phase=unwrap(plot[i].phase,plot[i-1].phase);
    var first=cross.length?cross[0]:null,pm=first?first.pm:NaN,
      minPm=cross.length?Math.min.apply(null,cross.map(function(q){return q.pm;})):NaN,
      gm=pcross.length?-pcross[0].db:NaN;
    return valid({mode:!ccm?'OUT_OF_DOMAIN':!first?'NO_CROSSOVER':cross.length>1?'MULTIPLE_CROSSOVERS':pm<=0?'UNSTABLE_MARGIN':'LINEAR_MODEL',
      validity:ccm,assumptions:'固定 CCM 電壓模式 Buck 小訊號 Gvd；負載純電阻、包含輸出電容 ESR 零點；連續時間 PI + 高頻單極點 + 固定取樣到 PWM 延遲。未包含 ZOH 完整離散化、電流內迴路、限幅及非線性。',
      note:'Bode 曲線為複數頻率響應，先找對數頻率增益極值，再對 0 dB 交越精確求根。各交越有獨立 PM；有多個交越時不可只看第一個 PM 判斷穩定。',
      warning:!ccm?'初始工作點落入 DCM：此 CCM 植物模型不適用，請調整負載／L／fs。':
        !first?'頻段內及局部極值均未發現 0 dB 交越，不能報告相位裕度。':
        cross.length>1?'存在多個 0 dB 交越，需逐一檢視各 PM，不能僅依第一個判斷穩定。':
        first.f>fs/10?'交越頻率超過 fs/10 教學準則，需以離散模型再驗證。':'相位裕度只是線性模型指標，不能替代實機閉迴路驗證。',
      metrics:[m('0 dB 首次交越頻率',ccm&&first?first.f:NaN,'Hz'),
        m('首次交越相位裕度',ccm?pm:NaN,'°'),m('增益裕度（第一 −180° 交越）',ccm?gm:NaN,'dB'),
        m('0 dB 交越次數',ccm?cross.length:NaN,'',0),m('LC 自然頻率',1/(2*PI*Math.sqrt(L*C)),'Hz'),
        m('BCM 臨界 Io',ripple/2,'A'),m('全部交越最小 PM',ccm?minPm:NaN,'°')],
      stages:[],traces:[{key:'gain',label:'開迴路增益',unit:'dB',values:plot.map(function(p){return p.db;}),x:plot.map(function(p){return p.f;}),step:false},
        {key:'phase',label:'開迴路相位',unit:'°',values:plot.map(function(p){return p.phase;}),x:plot.map(function(p){return p.f;}),step:false}],
      data:{crossovers:cross,phaseCrossings:pcross,fc:first?first.f:NaN,pm:pm,minPm:minPm,gm:gm,ccm:ccm,fs:fs,points:plot}});
  }

  function timing(v){
    // F28004x-specific clock tree: no arbitrary TBCLK up to 200 MHz.
    // EPWMCLK = SYSCLK / EPWMCLKDIV; TBCLK = EPWMCLK / HSPCLKDIV / CLKDIV.
    // ADC tSH=(ACQPS+1)/SYSCLK. The conversion, ISR entry and WCET remain
    // explicit teaching assumptions; this is not a register generator.
    function deviceInvalid(note){
      var r=unsupported(note);r.mode='OUT_OF_DEVICE_DOMAIN';return r;
    }
    var sysclk=v.sysclk,epwmDiv=Number(v.epwmdiv),hsp=Number(v.hspdiv),
      clkDiv=Number(v.clkdiv),adclkDiv=Number(v.adclkdiv),acqps=v.acqps;
    var legalHsp=[1,2,4,6,8,10,12,14],legalClk=[1,2,4,8,16,32,64,128];
    if(!Number.isFinite(sysclk)||sysclk<=0||sysclk>100||
        ![1,2].includes(epwmDiv)||!legalHsp.includes(hsp)||!legalClk.includes(clkDiv)||
        ![2,4,6,8].includes(adclkDiv))
      return deviceInvalid('F28004x 時脈或分頻值超出本教學可設定範圍（SYSCLK 最高 100 MHz）。');
    var tbclk=sysclk/epwmDiv/hsp/clkDiv,adclk=sysclk/adclkDiv,
      tSH=(acqps+1)/sysclk*1000, // ns; integer ACQPS cycles from SYSCLK.
      minimumSH=Math.max(75,1000/adclk);
    if(v.tbclk!==undefined||v.acq!==undefined)
      return deviceInvalid('TBCLK 與 ADC 取樣窗不接受任意外部覆寫；請由 SYSCLK／ePWM 分頻與 ACQPS 推導。');
    if(!Number.isInteger(acqps)||acqps<0||acqps>511||tSH+1e-9<minimumSH)
      return deviceInvalid('ADC ACQPS 不合法或 S+H 過短：F28004x 規格至少 75 ns，且不得短於 1 ADCCLK 週期；須另考慮前端 RC settling。');
    var desiredFs=v.fs*1000,periodCounts=Math.round(tbclk*1e6/(2*desiredFs));
    if(periodCounts<2||periodCounts>65535)
      return deviceInvalid('由硬體分頻計算的 TBPRD 超出可用 16-bit 計數範圍；請調整 SYSCLK／分頻或 PWM 頻率。');
    var T=2*periodCounts/tbclk, // μs, because MHz count denominator.
      cmp=Math.round(periodCounts*v.cmp/100),cmpUp=cmp/periodCounts*T/2,
      cmpDown=T-cmpUp,source={ZERO:0,PERIOD:T/2,CMP_UP:cmpUp,CMP_DOWN:cmpDown},soc=source[v.soca],
      acqEnd=soc+tSH/1000,eoc=acqEnd+v.conv/1000,isr=eoc+v.entry/1000,
      finish=isr+v.isr/1000,loads=[];
    for(var cycle=0;cycle<32;cycle++){
      var t=cycle*T;
      if(v.shadow==='ZERO'||v.shadow==='BOTH')loads.push(t);
      if(v.shadow==='PERIOD'||v.shadow==='BOTH')loads.push(t+T/2);
    }
    loads.sort(function(a,b){return a-b;});
    // At a coincident load event, assume the CPU missed this reload. The
    // extra 1 TBCLK setup guard is a pedagogical assumption, not TRM timing.
    var load=loads.find(function(t){return t>finish+1/tbclk});
    if(load===undefined)return deviceInvalid('計算延遲超出展示的 32 個 PWM 週期，請減少 ISR 預算。');
    var nextSoc=soc+T,overrun=finish>=nextSoc,latency=load-soc,
      loadPwmCycle=Math.floor(load/T+1e-9),samePwm=loadPwmCycle===Math.floor(soc/T),
      withinSocBudget=finish<nextSoc;
    var events=[{key:'SOCA',label:'ePWM SOCA',at:soc},
      {key:'ACQ',label:'ADC 取樣窗結束（ACQPS）',at:acqEnd},
      {key:'EOC',label:'ADC EOC 假設',at:eoc},
      {key:'ENTRY',label:'CPU ISR 進入',at:isr},
      {key:'FINISH',label:'計算完成／shadow 寫入',at:finish},
      {key:'LOAD',label:'下一個 CMP shadow→active',at:load}];
    var width=Math.max(3*T,load+T*.4),renderTimes=[];
    for(var i=0;i<241;i++)renderTimes.push(i*width/240);
    function counter(t){var z=(t%T)/T;return z<=.5?2*z:2*(1-z);}
    return valid({mode:overrun?'CPU_OVERRUN':samePwm?'SAME_PWM_CYCLE':'NEXT_PWM_CYCLE',validity:!overrun,
      assumptions:'F28004x ePWM UP-DOWN 示意：SYSCLK≤100 MHz，EPWMCLK=SYSCLK/EPWMCLKDIV，TBCLK=EPWMCLK/HSPCLKDIV/CLKDIV；TBPRD、CMPA 整數量化。ADC tSH=(ACQPS+1)/SYSCLK，檢查器件 S+H 下限 75 ns 與一個 ADCCLK 週期。EOC／ISR 進入／WCET 仍是使用者假設值，未模擬 ADCINT 早晚脈衝、ADCRESULT latch、其他中斷或匯流排競用。',
      note:'明確區分兩件事：(1) 計算是否在下一個 SOCA 前完成；(2) CMP Shadow 是同一 PWM 週期內還是下一個 TBCTR ZERO/PERIOD 才載入。',
      warning:overrun?'計算完成時間超過下一次相同 SOCA，可能發生即時預算失敗；不代表 ISR 本身必然排隊。':
        '本模型的轉換、ISR 和 PWM Shadow setup guard 仍屬假設；實機需以 F28004x datasheet、TRM、driverlib、GPIO 示波與 WCET 驗證。ADC 前端可能需要更長 S+H。',
      metrics:[m('SYSCLK',sysclk,'MHz'),m('由分頻得 TBCLK',tbclk,'MHz',3),m('ADCCLK',adclk,'MHz',3),
        m('ADC ACQPS',acqps,'count',0),m('ADC 實際 S+H',tSH,'ns',2),
        m('量化後 TBPRD',periodCounts,'count',0),m('PWM 週期',T,'µs',3),
        m('SOCA 時刻',soc,'µs',3),m('ADC EOC 時刻',eoc,'µs',3),
        m('ISR 計算完成',finish,'µs',3),m('新 Duty 生效',load,'µs',3),
        m('SOCA→PWM 生效',latency,'µs',3),m('生效 PWM 週期編號',loadPwmCycle,'',0),
        m('下一次 SOCA 前裕度',nextSoc-finish,'µs',3)],
      stages:events.map(function(e){return {id:e.key,label:e.label,start:e.at/width,end:e.at/width};}),
      traces:[{key:'counter',label:'UP-DOWN TBCTR / TBPRD',unit:'ratio',x:renderTimes,values:renderTimes.map(counter),step:false}],
      events:events,data:{sysclk:sysclk,epwmclk:sysclk/epwmDiv,tbclk:tbclk,adclk:adclk,acqps:acqps,tSH:tSH,
        tbprd:periodCounts,cmpa:cmp,T:T,soc:soc,acqEnd:acqEnd,eoc:eoc,isrStart:isr,finish:finish,load:load,
        latency:latency,nextSoc:nextSoc,overrun:overrun,withinSocBudget:withinSocBudget,
        samePwm:samePwm,loadPwmCycle:loadPwmCycle,width:width}});
  }

  function nonideal(v){
    var d=v.duty/100,fs=v.fs*1000,td=v.dead*1e-9*fs,L=v.l*1e-6,C=v.c*1e-6,
      rh=v.rh/1000,rl=v.rl/1000,rdcr=v.dcr/1000,esr=v.esr/1000;
    if(td>=Math.min(d,1-d))return unsupported('Dead Time 佔比過大，已與占空比重疊；此簡化同步 Buck 模型失效。');
    var high=d-td,low=1-d-td,body=2*td,r=v.load;
    // Average-current, fixed-Duty approximation. ESR has zero DC voltage drop
    // because the mean capacitor current is zero; its ripple dissipation is
    // included separately in the required input-power budget.
    var vo=(high*v.vin-body*v.vdiode)/(1+(rh*high+rl*low+rdcr)/r),io=vo/r;
    if(vo<=0||io<=0)return unsupported('有效輸出為非正，需重新確認工況；本模型僅支援正向電流同步 Buck。');

    // Integrate exactly over the four physical switch intervals. An arbitrary
    // uniform midpoint grid can misclassify the CCM boundary (and fabricate a
    // periodic waveform by wrapping its final sample to the first).
    var edges=[0,td,d,d+td,1],
      vSwitch=[-v.vdiode,v.vin-rh*io,-v.vdiode,-rl*io],
      slopes=vSwitch.map(function(x){return (x-vo-rdcr*io)/(L*fs);}),
      walk=[0],walkMean=0;
    for(var seg=0;seg<4;seg++){
      var span=edges[seg+1]-edges[seg],end=walk[seg]+slopes[seg]*span;
      walkMean+=span*(walk[seg]+end)/2;
      walk.push(end);
    }
    function segmentAt(t){return t<td?0:t<d?1:t<d+td?2:3;}
    function currentAt(t){
      var q=Math.max(0,Math.min(1,t)),idx=segmentAt(q);
      return io+walk[idx]+slopes[idx]*(q-edges[idx])-walkMean;
    }
    var boundaryCurrent=walk.map(function(x){return io+x-walkMean;}),
      ilMin=Math.min.apply(null,boundaryCurrent),
      ilMax=Math.max.apply(null,boundaryCurrent),
      ripple=ilMax-ilMin,ilClosure=boundaryCurrent[4]-boundaryCurrent[0];

    // iC=iL-Io is exactly linear within each stage. Analytic integrals yield
    // capacitor ripple-current RMS, charge and ESR dissipation independently of
    // the 240 chart samples. Account for extrema INSIDE a stage as well.
    var charges=[0],chargeMean=0,capRmsSquared=0;
    for(var j=0;j<4;j++){
      var h=edges[j+1]-edges[j],ic0=walk[j]-walkMean,s=slopes[j];
      capRmsSquared+=ic0*ic0*h+ic0*s*h*h+s*s*h*h*h/3;
      chargeMean+=charges[j]*h+(ic0*h*h/2+s*h*h*h/6)/(fs*C);
      charges.push(charges[j]+(ic0*h+s*h*h/2)/(fs*C));
    }
    function capacitorAt(t){
      var q=Math.max(0,Math.min(1,t)),idx=segmentAt(q),
        h=q-edges[idx],ic0=walk[idx]-walkMean,s=slopes[idx];
      var charge=charges[idx]+(ic0*h+s*h*h/2)/(fs*C);
      return vo+charge-chargeMean+esr*(ic0+s*h);
    }
    var extrema=[];
    for(var j=0;j<4;j++){
      var h=edges[j+1]-edges[j],s=slopes[j],ic0=walk[j]-walkMean;
      extrema.push(capacitorAt(edges[j]),capacitorAt(edges[j+1]));
      if(Math.abs(s)>1e-14){
        var candidate=-ic0/s-esr*fs*C;
        if(candidate>0&&candidate<h)extrema.push(capacitorAt(edges[j]+candidate));
      }
    }
    var rV=Math.max.apply(null,extrema)-Math.min.apply(null,extrema),
      icRms=Math.sqrt(Math.max(0,capRmsSquared)),pEsr=esr*icRms*icRms;

    var pHigh=io*io*rh*high,pLow=io*io*rl*low,pDcr=io*io*rdcr,
      pDead=io*body*v.vdiode,pSwitch=v.esum*1e-6*fs,po=vo*io,
      conduction=pHigh+pLow+pDcr+pDead;
    // An incremental fixed-operating-point budget, NOT a fully coupled
    // loss-dependent switching solution. Pin includes the capacitor loss
    // needed to sustain the assumed current ripple and average output.
    var pinBase=high*v.vin*io+pSwitch,pin=pinBase+pEsr,
      pLoss=conduction+pSwitch+pEsr,eff=100*po/pin;
    var cycleClosed=Math.abs(ilClosure)<=1e-9*Math.max(1,io,ripple)&&
      Math.abs(charges[4])<=1e-9,ccm=ilMin>0&&cycleClosed;
    function state(t){
      t=pos(t);
      if(t<td||t>=d&&t<d+td)return {stage:'DEAD',gate:0,vsw:-v.vdiode};
      if(t<d)return {stage:'HIGH',gate:1,vsw:v.vin-rh*io};
      return {stage:'LOW',gate:0,vsw:-rl*io};
    }
    return valid({mode:ccm?'CCM_SYNC_BUCK':'OUT_OF_DOMAIN',validity:ccm,
      assumptions:'固定負載 R、固定 Duty／平均 Io 的同步 Buck CCM 近似。Dead Time 的四段電流斜率及電容 iC 電荷用精確分段積分；電容 ESR 耗損視為維持相同平均輸出時的額外輸入功率預算。RDS(on)／DCR 以平均電流估計，不是含所有電流紋波與 ESR 耦合的完整暫態解；忽略溫度、Coss、磁芯與非線性。',
      note:'理想 Vo=D Vin；非理想 Vo 由平均伏秒推導。電感峰谷與電容漣波用真實切換邊界解析積分，P_ESR=R_ESR×I_C,rms²；同一平均工作點下 ESR 增加會增加所需 Pin 並降低效率。',
      warning:!ccm?'切換區間精確積分顯示電感可能歸零／為負，或周期狀態未閉合：CCM 模型不適用；請不要將這些結果用於元件選型。':
        '效率與所需 Pin 是平均 Io 下的增量損耗預算（包含電容 ESR），不是完整耦合的電路暫態或實機效率；固定 Eon/Eoff 不反推輸出電壓。',
      metrics:[m('理想 Buck Vout',v.vin*d,'V'),m('非理想 Buck Vout',vo,'V'),m('非理想效率',ccm?eff:NaN,'%'),
        m('MOS＋DCR 導通損',pHigh+pLow+pDcr,'W',3),m('Dead Time 二極體損耗',pDead,'W',3),
        m('固定開關損耗',pSwitch,'W',3),m('電感 ΔIL',ripple,'A',3),m('電容＋ESR ΔVpp',rV*1000,'mVpp',2),
        m('電容 ESR 耗損',pEsr,'W',3),m('電容漣波電流 RMS',icRms,'A',3)],
      stages:[{id:'DEAD1',label:'高側開啟前 Dead Time：Body Diode 續流',start:0,end:td},
        {id:'HIGH',label:'高側導通：Vin → MOSFET → L → Load',start:td,end:d},
        {id:'DEAD2',label:'低側導通前 Dead Time：Body Diode 續流',start:d,end:d+td},
        {id:'LOW',label:'低側同步續流',start:d+td,end:1}],
      traces:[sample('gate','高側 Gate 指令','0/1',function(t){return state(t).gate;},true),
        sample('vsw','開關節點 vSW','V',function(t){return state(t).vsw;},true),
        sample('il','電感電流 iL','A',currentAt),
        sample('vo','含 ESR 電容端電壓','V',capacitorAt)],
      probe:function(t){return state(t);},data:{ideal:v.vin*d,vo:vo,io:io,ripple:ripple,ilMin:ilMin,ilMax:ilMax,ilClosure:ilClosure,
        capChargeClosure:charges[4],capCurrentRms:icRms,capCurrentRmsSquared:capRmsSquared,pEsr:pEsr,rV:rV,
        pin:pin,po:po,pinBase:pinBase,conduction:conduction,pSwitch:pSwitch,pLoss:pLoss,
        energyError:pin-po-pLoss,td:td,high:high,low:low,body:body}});
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
    timing:{title:'F28004x｜ePWM SOCA → ADC → ISR → Shadow',category:'control',
      knobs:[k('sysclk','F28004x SYSCLK',50,100,25,100,'MHz'),k('fs','PWM 頻率',25,200,25,100,'kHz'),
        k('cmp','CMPA/TBPRD',10,90,5,35,'%'),k('acqps','ADC ACQPS 暫存器值',0,60,1,12,'count'),
        k('conv','ADC EOC 假設延遲',100,800,50,300,'ns'),k('entry','ISR 入口延遲',50,600,25,150,'ns'),
        k('isr','ISR WCET',100,30000,100,1000,'ns')],
      selectors:[
        {key:'epwmdiv',label:'EPWMCLK / SYSCLK',options:[['1','÷1'],['2','÷2']],value:'1'},
        {key:'hspdiv',label:'HSPCLKDIV',options:[['1','÷1'],['2','÷2'],['4','÷4'],['6','÷6'],['8','÷8'],['10','÷10'],['12','÷12'],['14','÷14']],value:'1'},
        {key:'clkdiv',label:'CLKDIV',options:[['1','÷1'],['2','÷2'],['4','÷4'],['8','÷8'],['16','÷16'],['32','÷32'],['64','÷64'],['128','÷128']],value:'1'},
        {key:'adclkdiv',label:'ADCCLK / SYSCLK（教學）',options:[['2','÷2'],['4','÷4'],['6','÷6'],['8','÷8']],value:'2'},
        {key:'soca',label:'SOCA 事件',options:[['ZERO','TBCTR ZERO'],['PERIOD','TBCTR PERIOD'],['CMP_UP','CMPA up'],['CMP_DOWN','CMPA down']],value:'CMP_UP'},
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