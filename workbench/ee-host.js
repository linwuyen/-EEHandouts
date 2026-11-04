/* EE navigation only. Numerical work and evidence remain owned by imported modules. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const course='../middle.html#lesson/mid-basics/mid-buck-pwm';
 const sourceCommit='11ef4e4801b5283f265dc349a4afec0027603228';
 let loadFailed=false,leaving=false,mounted=false,evidenceBlocked=false;
 document.documentElement.dataset.eeWorkbenchState='loading';
 function notice(text){const n=$('ee-host-status');if(n)n.textContent=text;}
 function fail(text){loadFailed=true;document.documentElement.dataset.eeWorkbenchState='failed';const main=document.querySelector('main');if(main)main.inert=true;notice(text+'；請保留學習備份，原教材與已存紀錄不會被清除。');}
 window.addEventListener('error',event=>{if(event.target?.tagName!=='SCRIPT')return;const name=new URL(event.target.src).pathname.split('/').pop();if(mounted)notice('來源面板載入失敗：'+name+'；目前實驗與保存功能仍可使用，可在面板重試。');else fail('實驗資產載入失敗：'+name);},true);
 function protectEvidence(text){
  evidenceBlocked=true;document.documentElement.dataset.eeWorkbenchState='protected';
  const main=document.querySelector('main');if(main)main.inert=true;
  notice(text+'；請用「紀錄與備份」另開唯讀頁，本頁草稿仍保留。');return false;
 }
 // Registered before Evidence's listeners: never normalize an unsupported raw version.
 function guardEvidence(){
  if(evidenceBlocked)return false;
  try{
   const raw=localStorage.getItem('circuit-learning-state-v5');
   if(!raw)return true;
   const state=JSON.parse(raw);
   if(state?.schema==='circuit-learning-state'&&state.version===5)return true;
  }catch{}
  return protectEvidence('紀錄版本已變動或無法讀取，操作與儲存已暫停');
 }
 window.addEventListener('storage',event=>{if((event.key===null||event.key==='circuit-learning-state-v5')&&!guardEvidence())event.stopImmediatePropagation();},true);
 for(const type of ['click','input','change','submit','keydown'])window.addEventListener(type,event=>{
  if(guardEvidence())return;
  event.stopImmediatePropagation();
  const backup=event.target?.closest?.('#ee-records');
  if(backup&&(type==='click'||type==='keydown')){backup.target='_blank';backup.rel='noopener';return;}
  event.preventDefault();
 },true);
 const destinations=new Set([course,'topology.html','index.html#experiment','index.html#experiment-energy','../middle.html#lesson/mid-boost/mid-boost-ccm','records.html','coverage.html','../index.html','../index.html#lesson/analog/adc','../index.html#lesson/analog/op','../index.html#lesson/analog/pi','../advanced.html#timing']);
 function safeDestination(path){
  const u=new URL(path,location.href);
  return [...destinations].some(p=>new URL(p,location.href).href===u.href)?u:null;
 }
 async function leave(path=course){
  if(leaving||!guardEvidence())return false;const url=safeDestination(path);if(!url){notice('返回目標不在本站允許清單；未離開目前實驗。');return false;}
  leaving=true;
  try{
   const E=window.CircuitEvidence;
   // Never treat missing persistence after mount as a successful save.
   if(mounted&&!E){notice('儲存元件不可用；已取消離開。');return false;}
   if(E){const status=await E.flush();if(!status.saved){notice('學習紀錄尚未儲存（'+(status.reason||'pending')+'）；已取消離開，請先匯出備份或解決衝突。');return false;}}
   if(!guardEvidence())return false;
   location.assign(url.href);return true;
  }catch(error){notice('儲存失敗，已取消離開：'+error.message);return false;}
  finally{leaving=false;}
 }
 function referenceHref(source){
  if(source==='index.html#topology')return 'topology.html';
  if(source==='map.html')return 'records.html';
  if(source==='catalog.html')return '../index.html';
  if(source.startsWith('0_buck_converter_'))return course;
  if(source.startsWith('1_c2000_adc_calculator')||source.startsWith('9.afe-tutorial'))return '../index.html#lesson/analog/adc';
  if(source.startsWith('12_opamp_slew_rate'))return '../index.html#lesson/analog/op';
  if(source.startsWith('4_PI')||source.startsWith('18_control_unification'))return '../index.html#lesson/analog/pi';
  if(source.startsWith('6.')||source.startsWith('13_power_sync'))return '../advanced.html#timing';
  return 'coverage.html';
 }
 function reference(source,title){
  const box=$('workspace-reference');if(!box)return;
  box.hidden=false;$('reference-frame').hidden=true;$('reference-frame').removeAttribute('src');
  $('reference-title').textContent=title||'返回教材';const links=$('reference-links');links.replaceChildren();
  const destination=referenceHref(source),p=document.createElement('p');
  p.textContent=source==='map.html'?'實驗、舊課及正式評量紀錄各自保留。可開啟唯讀紀錄頁並匯出完整備份。':destination==='coverage.html'?'這個進階功能尚未遷入 EEHandouts。既有作答仍保留，不會改成已完成；本批不連回舊網站。':'開啟 EEHandouts 對應教材；它的模型與參數不會自動套用到本實驗。';links.append(p);
  const b=document.createElement('button');b.type='button';b.textContent=source==='map.html'?'保存後查看紀錄與備份':destination==='coverage.html'?'保存後查看遷移範圍':'保存後開啟本站教材';b.onclick=()=>leave(destination);links.append(b);box.scrollIntoView({block:'start'});
 }
 function recommendation(next,button){
  if(next.id==='topology'){button.hidden=false;button.textContent='保存後接續 Buck／Boost 比較';button.dataset.route='topology.html';button.onclick=()=>leave('topology.html');return;}
  button.hidden=next.id==='experiment'||/^(basic|bridge)-/.test(next.id);
  button.textContent=['formal','quiz'].includes(next.id)?'到期複習紀錄仍保留（評量頁待遷入）':'進階紀錄仍保留（功能待遷入）';
  button.dataset.route=window.CircuitUnifiedLearning.route(next.id);
  button.onclick=()=>reference(button.dataset.route,'進階紀錄與後續遷移');
 }
 function complete(){return leave('topology.html');}
 function markReady(){if(loadFailed||!guardEvidence())return false;mounted=true;document.documentElement.dataset.eeWorkbenchState='ready';notice('EEHandouts 內建實驗 · 來源 '+sourceCommit.slice(0,8)+' · 實驗證據與教材已讀分開保存。');return true;}
 $('ee-return')?.addEventListener('click',()=>leave(course));
 $('ee-experiment')?.addEventListener('click',()=>leave('index.html#experiment'));
 $('ee-records')?.addEventListener('click',event=>{event.preventDefault();leave('records.html');});
 window.addEventListener('circuit:evidence-persistence',event=>{if(evidenceBlocked)return;if(event.detail.saved){if(mounted&&!loadFailed)notice('實驗紀錄已儲存；可返回原 Buck 教材。');}else notice('實驗紀錄尚未儲存；請保留備份，離開前會再次檢查。');});
 window.EEWorkbenchHost=Object.freeze({leave,notice,fail,referenceHref,reference,recommendation,complete,markReady,guardEvidence,protectEvidence,hasFailed:()=>loadFailed,course,sourceCommit});
})();
