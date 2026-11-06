/* Stateless page boundary. All equations and curves belong to the unchanged source owner. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const bounds={'op-step':[-12,12],'op-sr-plus':[.2,20],'op-sr-minus':[.2,20],'op-gbw':[.5,100],'op-gain':[1,20],'op-tol':[.01,1],'op-freq':[10,1000],'op-vpp':[.5,12]};
 const readings=['op-required-sr','op-fpbw','op-margin','op-step-time','op-settle-time','op-cl-bw','op-state'];
 let started=false,failed=false;
 function clearCanvas(){
  const canvas=$('op-scope');if(canvas){canvas.hidden=true;try{canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);}catch{}}
 }
 function clear(message,state){
  document.documentElement.dataset.eeOpampState=state;
  for(const id of readings)if($(id))$(id).textContent='';
  clearCanvas();
  $('ee-opamp-status').textContent=message+'；先前讀值與曲線已隱藏，沒有保存或評分。';
 }
 function fail(message){failed=true;for(const id of Object.keys(bounds))if($(id))$(id).disabled=true;clear(message,'failed');}
 function validate(){
  for(const [id,[min,max]]of Object.entries(bounds)){
   const el=$(id),value=el?Number(el.value):NaN;
   if(!el||String(el.value).trim()===''||!Number.isFinite(value)||value<min||value>max)throw new RangeError(id+' 超出本實驗輸入範圍');
   if(id==='op-gain'&&!Number.isInteger(value))throw new RangeError('Closed-loop gain 必須為本頁允許的整數');
  }
 }
 function render(){
  if(failed){clearCanvas();return false;}
  try{validate();}catch(error){clear(error.message,'invalid');return false;}
  try{
   const owner=window.CircuitOpampSimulator;
   if(!owner||typeof owner.metrics!=='function'||typeof owner.update!=='function')throw new Error('原數值核心未載入');
   const metrics=owner.metrics();
   if(Object.values(metrics).some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new Error('數值核心回傳非有限結果');
   $('op-scope').hidden=false;owner.update();
   for(const id of Object.keys(bounds))if($(id+'-value'))$(id+'-value').textContent=$(id).value;
   document.documentElement.dataset.eeOpampState='ready';
   $('ee-opamp-status').textContent='本頁模型已就緒；數值與曲線是教學估計，不代表正式評量通過或實機驗證。輸入不會自動保存。';
   return true;
  }catch(error){fail('實驗無法完成計算或繪圖：'+error.message);return false;}
 }
 function start(){
  if(started)return false;started=true;
  // The original owner has registered its resize draw by now. Validate/clear
  // afterwards without swallowing native viewport or unrelated observer events.
  window.addEventListener('resize',()=>{render();});
  if(failed)return false;
  if(!['step','sine'].includes(document.body.dataset.mode)){fail('未知實驗模式');return false;}
  if(!window.CircuitOpampSimulator){fail('必要計算資產載入失敗');return false;}
  for(const id of Object.keys(bounds))if($(id))$(id).disabled=false;
  return render();
 }
 // Capture before the original owner listeners: reject bad edits before its permissive fallback/clamp.
 window.addEventListener('input',event=>{
  if(!Object.hasOwn(bounds,event.target?.id))return;
  event.stopImmediatePropagation();
  if(started&&!failed)render();
 },true);
 window.EEOpampPage=Object.freeze({start,fail});
})();
