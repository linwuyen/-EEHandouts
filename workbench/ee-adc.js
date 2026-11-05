/* Adapted standalone source UI. All equations remain in unchanged CircuitModels. No learning persistence. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id),ids=["vref","bits","current","shunt","gain","offset","bus","rtop","rbot","seriesCount"];
  const n=id=>Number($(id).value);
  const outputs=["adcResults","currentResults","dividerResults","currentWarns","dividerWarns"];
  function invalidate(message,state="invalid"){
    outputs.forEach(id=>$(id).innerHTML="");
    ["code","formula"].forEach(id=>$(id).textContent="");
    ["currentFill","voltageFill"].forEach(id=>$(id).style.width="0%");
    ["currentMark","currentZero","voltageMark"].forEach(id=>$(id).style.left="0%");
    $("copy").disabled=true;$("share").disabled=true;
    document.documentElement.dataset.eeAdcState=state;
    $("ee-adc-status").textContent=message+"；先前結果與 C 參數已清除。輸入不會寫入學習紀錄。";
  }
  function validate(){
    for(const id of ids)if(String($(id).value).trim()===""||!Number.isFinite(n(id)))throw new RangeError(id+" 必須是有限數值，不可留空");
    for(const id of ["vref","shunt","gain","rtop","rbot"])if(n(id)<=0)throw new RangeError(id+" 必須大於零");
    if(![10,12,14,16].includes(n("bits")))throw new RangeError("解析度必須是 10、12、14 或 16 bit");
    if(n("bus")<0)throw new RangeError("母線電壓不可小於零");
    if(!Number.isSafeInteger(n("seriesCount"))||n("seriesCount")<1)throw new RangeError("串聯顆數必須是正整數");
  }
  function finiteResult(result){
    for(const value of Object.values(result)){
      if(typeof value==="number"&&!Number.isFinite(value))throw new RangeError("數值超出本計算器範圍");
      if(value&&typeof value==="object")finiteResult(value);
    }
  }
  if(!window.CircuitModels){invalidate("計算核心載入失敗，請返回教材或重新載入","failed");return;}
  ids.forEach(id=>$(id).disabled=false);
  const fmt=(v,d=4)=>Number.isFinite(v)?Number(v).toFixed(d):"—";
  const metric=(label,value,note="")=>`<article class="metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:""}</article>`;
  const alert=(text,kind)=>`<div class="alert ${kind}">${text}</div>`;
  function pct(v,max){return max>0?CircuitModels.clamp(v/max*100,0,100):0;}
  function update(){
    try{
      validate();
      const vref=n("vref"),bits=n("bits");
      const q=CircuitModels.quantizeAdc({voltageV:0,vrefV:vref,bits});
      const c=CircuitModels.calculateCurrentChain({currentA:n("current"),shuntOhm:n("shunt"),gain:n("gain"),offsetV:n("offset"),vrefV:vref,bits});
      const d=CircuitModels.calculateDivider({busV:n("bus"),topOhm:n("rtop")*1000,bottomOhm:n("rbot")*1000,vrefV:vref,bits});
      [q,c,d].forEach(finiteResult);
      $("adcResults").innerHTML=metric("Code 數",String(q.levels),"2^N")+metric("最大 code",String(q.maxCount),"2^N − 1")+metric("理想 LSB",fmt(q.lsbV*1000,4)+" mV","Vref / 2^N")+metric("端點顯示步距",fmt(vref/q.maxCount*1000,4)+" mV","只用於 0…maxCount 端點對映");

      $("currentResults").innerHTML=metric("Shunt 電壓",fmt(c.shuntV*1000,3)+" mV")+metric("ADC 輸入",fmt(c.adcInputV,4)+" V")+metric("ADC code",String(c.adc.count),c.adc.saturated?"已飽和":"未飽和")+metric("A / count",fmt(c.ampsPerCount,7)+" A")+metric("可量正電流",fmt(c.maxCurrentA,2)+" A")+metric("可量負電流",fmt(c.minCurrentA,2)+" A");
      $("currentFill").style.width=pct(c.adcInputV,vref)+"%";$("currentMark").style.left=pct(c.adcInputV,vref)+"%";$("currentZero").style.left=pct(c.offsetV,vref)+"%";
      let cw="";if(c.adc.saturatedHigh)cw+=alert("ADC 輸入高於或等於 Vref，code 已飽和。","bad");if(c.adc.saturatedLow)cw+=alert("ADC 輸入低於 0 V，負方向訊號已截斷。","bad");if(!c.adc.saturated)cw+=alert("目前電流訊號位於 ADC 可量範圍內。","good");$("currentWarns").innerHTML=cw;

      const count=Math.max(1,Math.trunc(n("seriesCount"))),perResV=d.topVoltageV/count,perResW=d.topPowerW/count;
      $("dividerResults").innerHTML=metric("分壓比例",fmt(d.ratio,8))+metric("ADC 輸入",fmt(d.adcInputV,4)+" V")+metric("分壓電流",fmt(d.currentA*1e6,3)+" µA")+metric("Rtop 總功耗",fmt(d.topPowerW*1000,3)+" mW")+metric("Rbot 功耗",fmt(d.bottomPowerW*1000,3)+" mW")+metric("每顆 Rtop",fmt(perResV,2)+" V / "+fmt(perResW*1000,3)+" mW","仍須對照工作電壓與 surge rating")+metric("理想最大母線",fmt(d.maxBusV,2)+" V","尚未保留 transient 裕度")+metric("V / count",fmt(d.voltsPerCount,5)+" V");
      $("voltageFill").style.width=pct(d.adcInputV,vref)+"%";$("voltageMark").style.left=pct(d.adcInputV,vref)+"%";
      let dw="";if(d.adc.saturated)dw+=alert("分壓後超出 ADC 範圍，需降低分壓比 Rbot/(Rtop+Rbot)（例如增大 Rtop），或降低最大母線規格。","bad");if(d.maxBusV<n("bus")*1.2)dw+=alert("最大母線餘裕低於 20%，未涵蓋 transient、容差與校準誤差。","warn");if(perResV>150)dw+=alert("每顆高側電阻承受電壓偏高，請檢查元件 working voltage，而不只看瓦數。","warn");if(!dw)dw=alert("目前分壓與 ADC 範圍有基本裕度；仍須驗證容差、取樣窗與過壓保護。","good");$("dividerWarns").innerHTML=dw;

      $("code").textContent=`#define ADC_LEVELS             (${q.levels}.0f)\n#define ADC_MAX_COUNT          (${q.maxCount}.0f)\n#define ADC_REF_VOLTAGE_V      (${fmt(vref,6)}f)\n#define ADC_VOLT_PER_COUNT_V   (${fmt(q.lsbV,9)}f)\n\n#define CURRENT_A_PER_COUNT    (${fmt(c.ampsPerCount,9)}f)\n#define CURRENT_ZERO_COUNT     (${c.zeroCount}.0f)\n#define BUS_V_PER_COUNT        (${fmt(d.voltsPerCount,9)}f)\n\n// amps = (adc_count - CURRENT_ZERO_COUNT) * CURRENT_A_PER_COUNT\n// bus_v = adc_count * BUS_V_PER_COUNT`;
      $("formula").textContent=`ADC: levels = 2^N, LSB = Vref / levels, code = floor(Vin / LSB)\nCurrent: Vadc = I × Rshunt × Gain + Offset\nDivider current: Idiv = Vbus / (Rtop + Rbot)\nRtop power: Ptop = Idiv² × Rtop = Vbus² × Rtop / (Rtop + Rbot)²\n\n注意：實際 C2000 ADC 還需檢查 source impedance、ACQPS、reference settling、INL/DNL、offset/gain error 與校準資料。`;
      document.documentElement.dataset.eeAdcState="ready";
      $("copy").disabled=false;$("share").disabled=false;
      $("ee-adc-status").textContent="計算已更新；數值僅供理想訊號鏈分析。控制項暫存於此頁，可複製參數連結保留；不寫入學習紀錄。";
    }catch(error){invalidate(error.message);}
  }
  ids.forEach(id=>{$(id).addEventListener("input",update);$(id).addEventListener("change",update);});
  const query=new URLSearchParams(location.search);ids.forEach(id=>{if(query.has(id))$(id).value=query.get(id);});
  $("copy").addEventListener("click",async()=>{if($("copy").disabled)return;try{await navigator.clipboard.writeText($("code").textContent);$("copy").textContent="已複製";}catch(e){prompt("複製程式碼",$("code").textContent);}});
  $("share").addEventListener("click",async()=>{if($("share").disabled)return;const q=new URLSearchParams();ids.forEach(id=>q.set(id,$(id).value));const url=location.origin+location.pathname+"?"+q;try{await navigator.clipboard.writeText(url);$("share").textContent="連結已複製";}catch(e){prompt("複製連結",url);}});
  update();
})();
