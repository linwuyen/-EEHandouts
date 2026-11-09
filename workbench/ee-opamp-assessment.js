/* EE-only interface for the pinned Circuit formal assessment and V5 Evidence owners. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.boot(root));
    else api.boot(root);
  }
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const KEY='circuit-learning-state-v5',FAMILY='opamp-slew-large-signal';
const LEGACY=['circuit-learning-state-v4','circuit-learning-state-v3','circuit-learning-state-v2'];
function gate(storage){
  try{
    const raw=storage.getItem(KEY);
    if(raw===null){
      if(LEGACY.some(key=>storage.getItem(key)!==null))return {ok:false,raw,reason:'legacy needs explicit migration'};
      return {ok:true,raw};
    }
    let data;
    try{data=JSON.parse(raw);}catch(_){return {ok:false,raw,reason:'malformed V5'};}
    if(!data||Array.isArray(data)||data.schema!=='circuit-learning-state'||data.version!==5||!data.questions||typeof data.questions!=='object'||Array.isArray(data.questions))return {ok:false,raw,reason:'unsupported V5 record'};
    return {ok:true,raw};
  }catch(_){return {ok:false,raw:null,reason:'storage unavailable'};}
}
function familyModel(assessment,bank){
  const original=bank?.questions?.find(q=>q.id===FAMILY);
  if(!original)throw Error('source OP assessment question missing');
  const variants=assessment.expandQuestions([original]);
  if(!variants.length||!variants.some(q=>q.assessmentRole==='retention'))throw Error('source retention variants missing');
  for(const q of variants){
    if(q.familyId!==FAMILY||q.options?.filter(o=>o.correct).length!==1)throw Error('source question contract invalid');
  }
  return variants;
}
function projection(assessment,variants,state,nowMs){
  const answer=state?.questions?.[FAMILY]||null;
  return {metrics:assessment.metrics(answer,nowMs),next:assessment.nextQuestion(variants,answer,nowMs),history:answer?.history||[]};
}
function boot(win){
  const doc=win.document,root=doc.getElementById('ee-formal-root');
  if(!root)return;
  const $=id=>doc.getElementById(id);
  const panel=$('ee-formal-question'),status=$('ee-formal-status'),prompt=$('ee-formal-prompt'),choices=$('ee-formal-choices');
  const submit=$('ee-formal-submit'),next=$('ee-formal-next'),feedback=$('ee-formal-feedback'),summary=$('ee-formal-summary');
  const backup=$('ee-formal-backup'),confidence=$('ee-formal-confidence');
  const A=win.CircuitAssessment,E=win.CircuitEvidence,bank=win.CircuitQuizBank;
  let storage=null,initialRaw=null,baselineRaw=null,variants=[],current=null,busy=false,blocked=false,startedAt=0,canExportDraft=false;
  try{storage=win.localStorage;}catch(_){}
  function readRaw(){try{return storage?.getItem(KEY)??null;}catch(_){return null;}}
  function lock(reason){
    if(blocked)return;
    blocked=true;root.dataset.state='protected';panel.inert=true;submit.disabled=true;next.disabled=true;
    status.textContent='紀錄未安全保存，已停止作答：'+reason+'。可先下載備份；不會宣稱已取得正式成績。';
  }
  function download(payload){
    const url=win.URL.createObjectURL(new win.Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=doc.createElement('a');a.download='eehandouts-opamp-assessment-v5-backup.json';a.href=url;a.click();
    win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  }
  backup.addEventListener('click',()=>{
    let evidence=null;try{if(E&&canExportDraft)evidence=JSON.parse(E.exportBackup());}catch(_){}
    download({format:'eehandouts-opamp-assessment-backup-v1',key:KEY,initialRaw,baselineRaw,currentRaw:readRaw(),evidence,reason:blocked?status.textContent:null});
  });
  try{initialRaw=readRaw();}catch(_){}
  const preflight=gate(storage);
  baselineRaw=preflight.raw;
  if(!preflight.ok){lock(preflight.reason);return;}
  if(!A||!E||!bank||!win.CircuitOpampAssessment){lock('assessment source missing');return;}
  if(typeof win.navigator?.locks?.request!=='function'){lock('Web Locks unavailable');return;}
  try{variants=familyModel(A,bank);canExportDraft=true;}catch(e){lock(e.message);return;}
  win.addEventListener('storage',event=>{
    if(blocked||(event.key!==KEY&&event.key!==null))return;
    const fresh=gate(storage);
    if(!fresh.ok||fresh.raw!==baselineRaw)lock('another tab changed V5 history');
  });
  win.addEventListener('beforeunload',event=>{
    if(!busy)return;event.preventDefault();event.returnValue='';
  });
  function show(state){
    if(blocked)return;
    const view=projection(A,variants,state,Date.now());
    const m=view.metrics;
    const detail='紀錄 '+m.attempts+' 筆｜遷移題 '+(m.transfer?'已通過':'尚未通過')+
      '｜複習階段 '+m.retentionStage+'/4';
    summary.textContent=detail+(m.nextReviewAt?'｜下次複習 '+new Date(m.nextReviewAt).toLocaleString('zh-TW'):'');
    current=view.next;
    feedback.hidden=true;next.hidden=true;
    if(!current){
      panel.hidden=true;
      status.textContent=m.fullyRetained?'已完成四階段到期複習。':'目前沒有到期題目。下一次複習前不會重複計分。';
      root.dataset.state='ready';
      return;
    }
    panel.hidden=false;panel.inert=false;choices.replaceChildren();
    panel.dataset.role=current.assessmentRole;panel.dataset.variant=current.variantId;
    prompt.textContent=current.prompt;
    for(const opt of current.options){
      const label=doc.createElement('label'),input=doc.createElement('input'),span=doc.createElement('span');
      input.type='radio';input.name='ee-formal-choice';input.value=opt.id;span.textContent=opt.text;
      label.append(input,span);choices.append(label);
    }
    confidence.value='';
    submit.disabled=false;startedAt=Date.now();
    root.dataset.state='ready';
    status.textContent=current.assessmentRole==='baseline'?'首題：首次作答將永久記錄。':current.assessmentRole==='transfer'?'遷移題：依變更條件判斷。':'到期複習：只在到期時記錄。';
  }
  async function start(){
    try{
      const state=E.load(),ack=await E.flush();
      if(!ack.saved)throw Error(ack.reason||'initial evidence pending');
      const fresh=gate(storage);
      if(!fresh.ok)throw Error(fresh.reason);
      baselineRaw=fresh.raw;show(state);
    }catch(e){lock(e.message||'initialization failed');}
  }
  submit.addEventListener('click',async()=>{
    if(blocked||busy||!current)return;
    const selected=panel.querySelector('input[name="ee-formal-choice"]:checked');
    if(!selected){status.textContent='請先選擇一個答案。';return;}
    const fresh=gate(storage);
    if(!fresh.ok||fresh.raw!==baselineRaw){lock('V5 changed before submit');return;}
    const opt=current.options.find(x=>x.id===selected.value);
    if(!opt){lock('invalid answer option');return;}
    busy=true;submit.disabled=true;panel.inert=true;status.textContent='提交中，尚未保存。';
    const q=current;
    try{
      const previous=await E.flush();if(!previous.saved)throw Error(previous.reason||'previous save pending');
      const state=E.load();
      const entry=A.recordAttempt(state,q,opt,{at:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-startedAt),confidence:confidence.value===''?null:Number(confidence.value)});
      E.save(state);
      const ack=await E.flush();
      if(!ack.saved)throw Error(ack.reason||'write failed');
      const written=gate(storage);
      const history=written.ok?JSON.parse(written.raw).questions?.[FAMILY]?.history:[];
      if(!written.ok||!history?.some(x=>x.id===entry.id))throw Error('readback mismatch');
      baselineRaw=written.raw;status.textContent='首次作答結果已安全保存（站內正式評量，非板級認證）。';
      feedback.textContent=(entry.correct?'本題正確。':'本題錯誤。')+' '+(opt.feedback||'')+' 首次結果不會因重新作答而覆寫。';
      feedback.hidden=false;next.hidden=false;next.disabled=false;
    }catch(e){lock(e.message||'save failed');}
    finally{busy=false;}
  });
  next.addEventListener('click',()=>{
    if(blocked||busy)return;
    try{if(!E.storageStatus().saved)throw Error('unsaved state');show(E.load());}
    catch(e){lock(e.message);}
  });
  start();
}
return {KEY,FAMILY,gate,familyModel,projection,boot};
});