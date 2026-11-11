/* EE navigation only. Numerical work and evidence remain owned by imported modules. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const course='../middle.html#lesson/mid-basics/mid-buck-pwm';
 const sourceCommit='11ef4e4801b5283f265dc349a4afec0027603228';
 let loadFailed=false,leaving=false,mounted=false,evidenceBlocked=false,navigationGuard=null;
 document.documentElement.dataset.eeWorkbenchState='loading';
 function notice(text){const n=$('ee-host-status');if(n)n.textContent=text;}
 function fail(text){loadFailed=true;document.documentElement.dataset.eeWorkbenchState='failed';const main=document.querySelector('main');if(main)main.inert=true;notice(text+'；請保留學習備份，原教材與已存紀錄不會被清除。');}
 window.addEventListener('error',event=>{if(event.target?.tagName!=='SCRIPT')return;const name=new URL(event.target.src).pathname.split('/').pop();if(mounted)notice('來源面板載入失敗：'+name+'；目前實驗與保存功能仍可使用，可在面板重試。');else fail('實驗資產載入失敗：'+name);},true);
 function protectEvidence(text){
  const newlyBlocked=!evidenceBlocked;
  evidenceBlocked=true;document.documentElement.dataset.eeWorkbenchState='protected';
  const main=document.querySelector('main');if(main)main.inert=true;
  notice(text+'；請用「紀錄與備份」另開唯讀頁，本頁草稿仍保留。');
  if(newlyBlocked)window.dispatchEvent?.(new CustomEvent('ee:evidence-protected',{detail:{reason:text}}));
  return false;
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
  if((type==='click'||type==='keydown')&&event.target?.id==='ee-application-draft-backup')return;
  event.stopImmediatePropagation();
  const backup=event.target?.closest?.('#ee-records');
  if(backup&&(type==='click'||type==='keydown')){backup.target='_blank';backup.rel='noopener';return;}
  event.preventDefault();
 },true);
 const applicationRoutes=['applications.html','applications.html#guided-applications',...['buck','boost','pfc','psfb','llc','inverter'].map(id=>'applications.html#'+id),...['pfc','psfb','llc','inverter'].map(id=>'applications.html?lesson='+id+'#guided-applications')];
 const opampCourseFiles=["01_slew_rate.html","02_step_response.html","03_sine_fpbw.html","04_gbw_vs_slew.html","05_settling_time.html","06_datasheet_selection.html"];
 const opampCourseRoutes=opampCourseFiles.map(file=>'12_opamp_slew_rate/'+file);
 const destinations=new Set([...applicationRoutes,'opamp-course.html','opamp-diagnosis.html','opamp-dc-trainer.html','opamp-assessment.html','adc-assessment.html','spi-assessment.html','buck-assessment.html','topology-assessment.html','power-firmware-assessment.html','v8-assessment.html',...opampCourseRoutes,course,'opamp-step.html','opamp-sine.html','adc.html','adc-course.html',...['lesson-0','lesson-1','lesson-2','lesson-3','lesson-4','lesson-5','formulas'].map(id=>'adc-course.html#'+id),'topology.html','index.html#experiment','index.html#experiment-energy','../middle.html#lesson/mid-boost/mid-boost-ccm','records.html','coverage.html','../index.html','../index.html#lesson/analog/adc','../index.html#lesson/analog/op','../index.html#lesson/analog/pi','../advanced.html#timing']);
 function safeDestination(path){
  const u=new URL(path,location.href);
  return [...destinations].some(p=>new URL(p,location.href).href===u.href)?u:null;
 }
 // One guard belongs to the isolated mounted page; the host still owns flush/navigation.
 function setNavigationGuard(guard){
  if(typeof guard!=='function')throw new TypeError('Navigation guard must be a function');
  if(navigationGuard&&navigationGuard!==guard)throw new Error('Navigation guard already registered');
  navigationGuard=guard;
 }
 async function leave(path=course,{replace=false}={}){
  if(leaving||!guardEvidence())return false;const url=safeDestination(path);if(!url){notice('返回目標不在本站允許清單；未離開目前實驗。');return false;}
  leaving=true;
  try{
   if(navigationGuard&&navigationGuard(url)!==true)return false;
   const E=window.CircuitEvidence;
   // Never treat missing persistence after mount as a successful save.
   if(mounted&&!E){notice('儲存元件不可用；已取消離開。');return false;}
   if(E){const status=await E.flush();if(!status.saved){notice('學習紀錄尚未儲存（'+(status.reason||'pending')+'）；已取消離開，請先匯出備份或解決衝突。');return false;}}
   if(!guardEvidence()||(navigationGuard&&navigationGuard(url)!==true))return false;
   if(replace)location.replace(url.href);else location.assign(url.href);return true;
  }catch(error){notice('儲存失敗，已取消離開：'+error.message);return false;}
  finally{leaving=false;}
 }
 function referenceHref(source){
  if(source==='index.html#topology')return 'topology.html';
  if(source==='index.html#applications')return 'applications.html';
  if(source==='17_power_topology_control/index.html')return 'applications.html';
  if(source==='17_power_topology_control/index.html#guided-applications')return 'applications.html#guided-applications';
  const atlasSection=/^17_power_topology_control\/index\.html#(buck|boost|pfc|psfb|llc|inverter)$/.exec(source);
  if(atlasSection)return 'applications.html#'+atlasSection[1];
  const application=/^17_power_topology_control\/index\.html\?lesson=(pfc|psfb|llc|inverter)#guided-applications$/.exec(source);
  if(application)return 'applications.html?lesson='+application[1]+'#guided-applications';
  if(source==='map.html')return 'records.html';
  if(source==='catalog.html')return '../index.html';
  if(source.startsWith('0_buck_converter_'))return course;
  if(['1_c2000_adc_calculator/index.html','1_c2000_adc_calculator/0_index.html'].includes(source))return 'adc-course.html#lesson-0';
  const adcLessons=['1_adc_basics.html','2_current_to_voltage.html','3_why_offset.html','4_voltage_divider.html','5_firmware_scaling.html'];
  const adcIndex=adcLessons.indexOf(source.replace(/^1_c2000_adc_calculator\//,''));
  if(source.startsWith('1_c2000_adc_calculator/')&&adcIndex!==-1)return 'adc-course.html#lesson-'+(adcIndex+1);
  if(source==='1_c2000_adc_calculator/ref_formulas.html')return 'adc-course.html#formulas';
  if(['1_c2000_adc_calculator/6_full_calculator.html','1_c2000_adc_calculator/c2000_adc_calculator.html'].includes(source))return 'adc.html';
  if(source.startsWith('1_c2000_adc_calculator'))return 'coverage.html';
  if(source.startsWith('9.afe-tutorial'))return 'coverage.html'; // Source Module 9 is bidirectional power control, not an ADC analog front end.
  if(source==='12_opamp_slew_rate/index.html')return 'opamp-course.html';
  if(opampCourseRoutes.includes(source))return source;
  if(source==='12_opamp_slew_rate/lab_step.html')return 'opamp-step.html';
  if(source==='12_opamp_slew_rate/lab_sine.html')return 'opamp-sine.html';
  if(source==='12_opamp_slew_rate/lab_diagnose.html')return 'opamp-diagnosis.html';
  if(source==='12_opamp_slew_rate/reasoning_trainer.html')return 'opamp-dc-trainer.html';
  if(source==='quiz.html?module=opamp')return 'opamp-assessment.html';
  if(source==='quiz.html?module=adc')return 'adc-assessment.html';
  if(source==='quiz.html?module=spi')return 'spi-assessment.html';
  if(source==='quiz.html?module=buck')return 'buck-assessment.html';
   if(source==='quiz.html?module=power-topology-control')return 'topology-assessment.html';
   if(['power-sync','protection','power-capstone'].some(id=>source==='quiz.html?module='+id))return 'power-firmware-assessment.html';
  if(['inverter','foc','pi','loop10us'].some(id=>source==='quiz.html?module='+id))return 'v8-assessment.html';
  if(source.startsWith('12_opamp_slew_rate'))return 'coverage.html';
  if(source.startsWith('4_PI')||source.startsWith('18_control_unification'))return '../index.html#lesson/analog/pi';
  if(source.startsWith('6.')||source.startsWith('13_power_sync'))return '../advanced.html#timing';
  return 'coverage.html';
 }
 function reference(source,title){
  const box=$('workspace-reference');if(!box)return;
  box.hidden=false;$('reference-frame').hidden=true;$('reference-frame').removeAttribute('src');
  $('reference-title').textContent=title||'返回教材';const links=$('reference-links');links.replaceChildren();
  const destination=referenceHref(source),p=document.createElement('p');
  p.textContent=(destination==='opamp-course.html'||opampCourseRoutes.includes(destination))?'本站六課觀念不記錄已讀或評量通過；進入前先保存目前實驗。':destination==='opamp-diagnosis.html'?'本站 OP 三題診斷只在本頁記錄首次選擇，不授予正式成績；進入前先保存目前實驗。':destination==='topology-assessment.html'?'本站 PFC／PSFB／LLC／逆變器四題族正式首答、遷移與到期複習使用既有 V5 Evidence；非實板或控制安全認證。':destination==='buck-assessment.html'?'本站 Buck 三題族首答、遷移與到期複習共用原 V5 Evidence；不表示硬體、故障保護或控制迴路通過。':destination==='spi-assessment.html'?'本站 SPI 三題族首答、遷移與到期複習共用原 V5 Evidence；不代表 SPI 周邊時序、FIFO 或硬體已驗收。':destination==='adc-assessment.html'?'本站 ADC 三題族首答、遷移與到期複習共用原 V5 Evidence，不能替代實板認證；進入前先保存實驗。':destination==='opamp-assessment.html'?'本站 OP Slew Rate 首答、遷移與到期複習使用原有 V5 Evidence 記錄，不是 BOARD_PASS；進入前先保存目前實驗。':destination==='opamp-dc-trainer.html'?'本站 OP DC Trainer Level 0–5 只將 mastery 儲存在瀏覽器本地，不授予正式成績；進入前先保存目前實驗。':destination.startsWith('opamp-')?'本站 OP 實驗不帶入目前實驗參數、不保存輸入或授予評量通過；進入前先保存目前實驗。':destination.startsWith('adc-course.html')?'本站 ADC 逐課閱讀不記錄正式成績、不改寫舊進度；進入前先儲存目前實驗。':destination==='adc.html'?'本站 ADC 計算器只暫存自己的輸入，不帶入實驗參數，也不改寫作答紀錄；離開前先保存目前實驗。':source==='map.html'?'實驗、舊課及正式評量紀錄各自保留。可開啟唯讀紀錄頁並匯出完整備份。':destination==='coverage.html'?'這個進階功能尚未遷入 EEHandouts。既有作答仍保留，不會改成已完成；本批不連回舊網站。':'開啟 EEHandouts 對應教材；它的模型與參數不會自動套用到本實驗。';if(destination==='power-firmware-assessment.html')p.textContent='本站 PWM／ADC Deadline、Protection Trip 與 Capstone 三題族沿用原始 V5 Evidence；不代表硬體時序、Trip 安全或 BOARD_PASS。';if(destination==='v8-assessment.html')p.textContent='本站逆變器安全、FOC Park、PI 積分與 10 µs Deadline 四題族沿用原始 Assessment V8 與唯一 V5 Evidence；不是實板、保護認證或控制器時序測試。';links.append(p);
  const b=document.createElement('button');b.type='button';b.textContent=(destination==='opamp-course.html'||opampCourseRoutes.includes(destination))?'保存後開啟 OP 觀念課':destination==='opamp-diagnosis.html'?'保存後開啟 OP 診斷練習':destination==='topology-assessment.html'?'保存後開啟功率拓撲正式題目':destination==='buck-assessment.html'?'保存後開啟 Buck 正式題目':destination==='spi-assessment.html'?'保存後開啟 SPI 正式題目':destination==='adc-assessment.html'?'保存後開啟 ADC 正式題目':destination==='opamp-assessment.html'?'保存後開啟 OP 正式題目':destination==='opamp-dc-trainer.html'?'保存後開啟 OP DC 推理訓練':destination.startsWith('opamp-')?'保存後開啟 OP 實驗':destination.startsWith('adc-course.html')?'保存後開啟 ADC 逐課導讀':destination==='adc.html'?'保存後開啟 ADC 計算器':source==='map.html'?'保存後查看紀錄與備份':destination==='coverage.html'?'保存後查看遷移範圍':'保存後開啟本站教材';if(destination==='power-firmware-assessment.html')b.textContent='保存後開啟電源韌體正式題目';if(destination==='v8-assessment.html')b.textContent='保存後開啟 V8 四題族正式題目';b.onclick=()=>leave(destination);links.append(b);box.scrollIntoView({block:'start'});
 }
 function recommendation(next,button){
  if(next.id==='applications'){button.hidden=false;button.textContent='保存後接續四種電路應用';button.dataset.route='applications.html';button.onclick=()=>leave('applications.html');return;}
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
 $('ee-comparison')?.addEventListener('click',()=>leave('topology.html'));
 $('ee-records')?.addEventListener('click',event=>{event.preventDefault();leave('records.html');});
 window.addEventListener('circuit:evidence-persistence',event=>{if(evidenceBlocked)return;if(event.detail.saved){if(mounted&&!loadFailed)notice('實驗紀錄已儲存；可返回原 Buck 教材。');}else notice('實驗紀錄尚未儲存；請保留備份，離開前會再次檢查。');});
 window.EEWorkbenchHost=Object.freeze({leave,setNavigationGuard,notice,fail,referenceHref,reference,recommendation,complete,markReady,guardEvidence,protectEvidence,hasFailed:()=>loadFailed,course,sourceCommit});
})();
