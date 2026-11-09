/* EE-only presentation for three original Circuit ADC assessment families.
 * CircuitAssessment grades and schedules; CircuitEvidence exclusively writes V5.
 * This controller neither creates an independent assessment nor a new store. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.boot(root));
    else api.boot(root);
  }
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const KEY='circuit-learning-state-v5';
const FAMILIES=Object.freeze(['adc-levels-vs-codes','adc-divider-power','adc-offset-purpose']);
const LABELS=Object.freeze({'adc-levels-vs-codes':'量化 levels / code','adc-divider-power':'分壓器功耗','adc-offset-purpose':'雙向 Offset'});
const LEGACY=['circuit-learning-state-v4','circuit-learning-state-v3','circuit-learning-state-v2'];
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function gate(storage){
  try{
    const raw=storage.getItem(KEY);
    if(raw===null){
      if(LEGACY.some(k=>storage.getItem(k)!==null))return {ok:false,raw,reason:'legacy requires explicit migration'};
      return {ok:true,raw};
    }
    let data;try{data=JSON.parse(raw);}catch(_){return {ok:false,raw,reason:'malformed V5'};}
    if(!plain(data)||data.schema!=='circuit-learning-state'||data.version!==5||!plain(data.questions))return {ok:false,raw,reason:'unsupported V5 record'};
    // Evidence.normalizeState silently replaces unknown section types: reject before load.
    for(const key of ['evidence','reports','predictions','openResponses','diagnosticGames','benchmark','migrations','identityAliases'])
      if(!plain(data[key]))return {ok:false,raw,reason:'unsupported V5 section '+key};
    if(!Array.isArray(data.events)||typeof data.updatedAt!=='string')return {ok:false,raw,reason:'unsupported V5 metadata'};
    for(const id of FAMILIES){
      const rec=data.questions[id];if(rec===undefined)continue;
      const allowed=['history','choiceId','correct','attempts','updatedAt'];
      if(!plain(rec)||!Array.isArray(rec.history)||Object.keys(rec).some(k=>!allowed.includes(k))||
        rec.history.some(h=>!plain(h)||typeof h.at!=='string'||typeof h.variantId!=='string'||typeof h.correct!=='boolean'||typeof h.firstAttemptForVariant!=='boolean'))
        return {ok:false,raw,reason:'unsupported ADC family history '+id};
    }
    return {ok:true,raw};
  }catch(_){return {ok:false,raw:null,reason:'storage unavailable'};}
}
function familyModel(assessment,bank){
  if(typeof assessment?.expandQuestions!=='function'||!Array.isArray(bank?.questions))throw Error('assessment source missing');
  const items=[];
  for(const id of FAMILIES){
    const source=bank.questions.find(q=>q.id===id);
    if(!source||source.moduleId!=='adc')throw Error('missing ADC family '+id);
    const variants=assessment.expandQuestions([source]);
    if(!variants.some(q=>q.assessmentRole==='baseline')||!variants.some(q=>q.assessmentRole==='transfer')||!variants.some(q=>q.assessmentRole==='retention'))throw Error('missing original variants '+id);
    for(const q of variants){if(q.familyId!==id||q.options?.filter(o=>o.correct).length!==1)throw Error('invalid original question '+id);}
    items.push(...variants);
  }
  return items;
}
function projection(assessment,variants,state,nowMs){
  const rows=FAMILIES.map(id=>{
    const answer=state?.questions?.[id]||null;
    const items=variants.filter(q=>q.familyId===id);
    return {id,metrics:assessment.metrics(answer,nowMs),next:assessment.nextQuestion(items,answer,nowMs),history:answer?.history||[]};
  });
  // Due retention outranks fresh baseline/transfer; preserve original family order otherwise.
  const selected=rows.find(row=>row.metrics.due&&row.next)||rows.find(row=>row.next)||null;
  return {rows,next:selected?.next||null,selectedId:selected?.id||null,metrics:selected?.metrics||null};
}
function boot(win){
  const doc=win.document,root=doc.getElementById('ee-adc-formal-root');if(!root)return;
  const $=id=>doc.getElementById(id),panel=$('ee-formal-question'),status=$('ee-formal-status'),prompt=$('ee-formal-prompt'),choices=$('ee-formal-choices'),submit=$('ee-formal-submit'),next=$('ee-formal-next'),feedback=$('ee-formal-feedback'),summary=$('ee-formal-summary'),backup=$('ee-formal-backup'),confidence=$('ee-formal-confidence');
  const A=win.CircuitAssessment,E=win.CircuitEvidence,bank=win.CircuitQuizBank;
  let storage=null,initialRaw=null,baselineRaw=null,variants=[],current=null,busy=false,blocked=false,startedAt=0,canExportDraft=false;
  try{storage=win.localStorage;}catch(_){}
  function readRaw(){try{return storage?.getItem(KEY)??null;}catch(_){return null;}}
  function download(payload){
    const url=win.URL.createObjectURL(new win.Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=doc.createElement('a');link.download='eehandouts-adc-formal-v5-backup.json';link.href=url;link.click();
    win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  }
  function exportBackup(){
    let evidence=null;try{if(E&&canExportDraft)evidence=JSON.parse(E.exportBackup());}catch(_){}
    download({format:'eehandouts-adc-formal-backup-v1',key:KEY,families:FAMILIES,initialRaw,baselineRaw,currentRaw:readRaw(),evidence,reason:blocked?status.textContent:null});
  }
  backup.addEventListener('click',exportBackup);
  // Source Evidence stops outside click events in conflict mode. This is its permitted surface.
  function installSafeBackup(){
    const notice=doc.getElementById('learning-storage-status');if(!notice||notice.querySelector('#ee-adc-safe-backup'))return;
    const button=doc.createElement('button');button.type='button';button.id='ee-adc-safe-backup';
    button.textContent='下載保留的 ADC 原始 V5 與草稿';button.addEventListener('click',exportBackup);notice.append(button);
  }
  const observer=new win.MutationObserver(installSafeBackup);observer.observe(doc.body,{childList:true,subtree:true});installSafeBackup();
  function lock(reason){
    if(blocked)return;blocked=true;root.dataset.state='protected';panel.inert=true;submit.disabled=true;next.disabled=true;
    status.textContent='紀錄未安全保存，ADC 正式題已停止：'+reason+'。請下載保留的原始紀錄與草稿；未認定通過。';
    installSafeBackup();
  }
  initialRaw=readRaw();const preflight=gate(storage);baselineRaw=preflight.raw;
  if(!preflight.ok){lock(preflight.reason);return;}
  if(!A||!E||!bank){lock('source assessment or Evidence missing');return;}
  if(typeof win.navigator?.locks?.request!=='function'){lock('Web Locks unavailable');return;}
  try{variants=familyModel(A,bank);canExportDraft=true;}catch(e){lock(e.message);return;}
  win.addEventListener('storage',event=>{
    if(blocked||(event.key!==KEY&&event.key!==null))return;
    const fresh=gate(storage);if(!fresh.ok||fresh.raw!==baselineRaw)lock('another tab changed V5 history');
  });
  win.addEventListener('beforeunload',event=>{if(!busy)return;event.preventDefault();event.returnValue='';});
  function show(state){
    if(blocked)return;
    const view=projection(A,variants,state,Date.now());
    summary.textContent=view.rows.map(row=>LABELS[row.id]+': '+row.metrics.attempts+' 筆／遷移 '+(row.metrics.transfer?'PASS':'未過')+'／複習 '+row.metrics.retentionStage+'/4'+(row.metrics.nextReviewAt?'（下次 '+new Date(row.metrics.nextReviewAt).toLocaleDateString('zh-TW')+'）':'')).join('；');
    current=view.next;feedback.hidden=true;next.hidden=true;
    if(!current){
      panel.hidden=true;status.textContent=view.rows.every(row=>row.metrics.fullyRetained)?'三個題族均已完成四階段到期複習。':'目前沒有到期題目；待指定的複習日期再回來。';root.dataset.state='ready';return;
    }
    panel.hidden=false;panel.inert=false;choices.inert=false;choices.replaceChildren();
    panel.dataset.role=current.assessmentRole;panel.dataset.variant=current.variantId;panel.dataset.family=current.familyId;
    prompt.textContent=LABELS[current.familyId]+'｜'+current.prompt;
    for(const opt of current.options){
      const label=doc.createElement('label'),input=doc.createElement('input'),span=doc.createElement('span');
      input.type='radio';input.name='ee-formal-choice';input.value=opt.id;span.textContent=opt.text;
      label.append(input,span);choices.append(label);
    }
    confidence.value='';submit.disabled=false;startedAt=Date.now();root.dataset.state='ready';
    status.textContent=current.assessmentRole==='baseline'?'首次作答將永久記錄。':current.assessmentRole==='transfer'?'遷移題：條件變更後重新作答。':'已到期：此題使用原始複習排程。';
  }
  async function start(){
    try{
      const state=E.load(),ack=await E.flush();if(!ack.saved)throw Error(ack.reason||'initial V5 pending');
      const fresh=gate(storage);if(blocked||!fresh.ok)throw Error(fresh.reason||'V5 conflict');
      baselineRaw=fresh.raw;show(state);
    }catch(e){lock(e.message||'initialization failed');}
  }
  submit.addEventListener('click',async()=>{
    if(blocked||busy||!current)return;
    const selected=panel.querySelector('input[name="ee-formal-choice"]:checked');if(!selected){status.textContent='請先選一個選項。';return;}
    const fresh=gate(storage);if(!fresh.ok||fresh.raw!==baselineRaw){lock('V5 changed before submit');return;}
    const opt=current.options.find(o=>o.id===selected.value);if(!opt){lock('invalid selected option');return;}
    busy=true;submit.disabled=true;panel.inert=true;status.textContent='正在儲存，目前未認定通過。';
    const q=current;
    try{
      const previous=await E.flush();if(!previous.saved)throw Error(previous.reason||'previous save pending');
      const again=gate(storage);
      if(blocked||!again.ok||again.raw!==baselineRaw)throw Error('V5 changed during previous flush');
      const state=E.load();
      // Do not turn an omitted confidence into 0%: the original owner maps null to 0.
      const entry=A.recordAttempt(state,q,opt,{at:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-startedAt),confidence:confidence.value===''?undefined:Number(confidence.value)});
      E.save(state);const ack=await E.flush();if(!ack.saved)throw Error(ack.reason||'write failed');
      const written=gate(storage),history=written.ok?JSON.parse(written.raw).questions?.[q.familyId]?.history:[];
      if(!written.ok||!history?.some(x=>x.id===entry.id))throw Error('readback mismatch');
      if(blocked)throw Error('stale conflict');
      baselineRaw=written.raw;status.textContent='ADC 本題首次結果已安全保存於正式 V5（非硬體認證）。';
      feedback.textContent=(entry.correct?'本題正確。':'本題錯誤。')+' '+(opt.feedback||'')+' 首答歷史不會因重做而覆寫。';
      feedback.hidden=false;next.hidden=false;next.disabled=false;choices.inert=true;panel.inert=false;
    }catch(e){lock(e.message||'save failed');}finally{busy=false;}
  });
  next.addEventListener('click',()=>{
    if(blocked||busy)return;
    try{if(!E.storageStatus().saved)throw Error('unsaved V5');const fresh=gate(storage);if(!fresh.ok||fresh.raw!==baselineRaw)throw Error('V5 changed before next');show(E.load());}catch(e){lock(e.message);}
  });
  start();
}
return {KEY,FAMILIES,gate,familyModel,projection,boot};
});
