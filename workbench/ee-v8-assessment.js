/* EE-only presentation for the released Circuit Assessment V8 families.
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
const catalog = Object.freeze({
  'inv-shoot-through-safety': {module: 'inverter', label: '逆變器直通安全'},
  'foc-park-frame': {module: 'foc', label: 'FOC Park 座標'},
  'pi-integrator-crossover': {module: 'pi', label: 'PI 積分交越'},
  'loop10us-deadline-budget': {module: 'loop10us', label: '10 µs Deadline'},
  'bms-failsafe-convergence': {module: 'bms', label: 'BMS 故障隔離'},
  'ad5543-code-mapping': {module: 'ad5543', label: 'AD5543 目標電壓與數位碼'},
  'dds-real-power': {module: 'c2000-dds', label: 'DDS 相位與實功率'},
  'afe-phase-power': {module: 'afe', label: 'AFE 位移功率因數'},
  'acmc-protection-boundary': {module: 'acmc-pro', label: 'ACMC 保護模型邊界'},
});
const FAMILIES = Object.freeze(Object.keys(catalog));
const prerequisiteLinks = {
  'adc.divider.power': ['ADC 分壓與功率', 'adc-assessment.html?family=adc-divider-power'],
  'afe.phase.power': ['AFE 位移功率因數', 'v8-assessment.html?module=afe'],
  'buck.model.validity': ['Buck 理想模型適用條件', 'buck-assessment.html?family=buck-model-validity'],
  'adc.quantization.levels': ['ADC 量化階數', 'adc-assessment.html?family=adc-levels-vs-codes'],
  'adc.current.offset': ['ADC 電流量測偏移', 'adc-assessment.html?family=adc-offset-purpose'],
  'spi.throughput.clock': ['SPI 時脈與傳輸時間', 'spi-assessment.html?family=spi-clock-throughput'],
  'spi.mode.cpol-cpha': ['SPI 時脈極性與相位', 'spi-assessment.html?family=spi-cpol-cpha'],
};
// Source options can round to the same number. Show the calculation alongside the
// value so the learner can distinguish methods while the source grades the same ID.
const calculationMethods = {
  'afe-phase-power': {correct: 'cos φ', sin: 'sin φ', degree: '相位角的度數', one: '固定為 1'},
  'ad5543-code-mapping': {correct: 'Vtarget/Vref × 65536', '12bit': 'Vtarget/Vref × 4096', inverse: 'Vref/Vtarget × 65536，再限幅', max: '固定滿刻度'},
  'dds-real-power': {correct: 'Vrms × Irms × cos φ', va: 'Vrms × Irms', sin: 'Vrms × Irms × sin φ'},
};
function optionText(question, option) {
  const method = question.assessmentRole !== 'baseline' && calculationMethods[question.familyId]?.[option.id];
  return method ? `${option.text}（${method}）` : option.text;
}
function displayOptions(question) {
  const options = question.options;
  if (question.assessmentRole === 'baseline') {
    // Original baselines put the answer first. The source seed gives each family a stable order.
    const offset = question.seed % options.length;
    return options.slice(offset).concat(options.slice(0, offset));
  }
  if (question.familyId === 'foc-park-frame') {
    // At 45° swapping d and q gives the same numeric answer. Offer it once, under the credited ID.
    const correct = options.find(option => option.correct);
    return options.filter(option => option.correct || option.text !== correct.text);
  }
  return options;
}
function familiesForLocation(href) {
  const suffix = new URL(href).href.match(/[?#].*$/)?.[0] || '';
  if (!suffix) return FAMILIES;
  return FAMILIES.filter(id => suffix === '?module=' + catalog[id].module);
}
const LEGACY=['circuit-learning-state-v4','circuit-learning-state-v3','circuit-learning-state-v2'];
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function gate(storage,assessment,bank,source){
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
    // Compare persisted answers against the original source questions, not an EE scorer.
    // When source libraries are missing we can still export the raw V5, but not trust credit.
    let sourceVariants=[];
    if(FAMILIES.some(id=>data.questions[id]!==undefined)){
      try{sourceVariants=familyModel(assessment,bank);}catch(_){return {ok:false,raw,reason:'V8 控制與安全 source grading model missing'};}
    }
    // Reconstruct each attempted question via the original scheduler and
    // the preceding history. Matching a claimed seed or option is insufficient:
    // the source must have actually offered this variant at this timestamp.
    // Source transfer/review generation is intentionally unbounded.
    const sourceFor=(id,h,previous)=>{
      if(!source||source.VERSION!=='8.1.0'||typeof source.generateVariant!=='function'||typeof assessment?.nextQuestion!=='function')return null;
      const items=sourceVariants.filter(q=>q.familyId===id);
      const q=assessment.nextQuestion(items,{history:previous},Date.parse(h.at));
      return q&&q.familyId===id&&q.variantId===h.variantId?q:null;
    };
    const sourceMatch=(id,h,previous)=>{
      const q=sourceFor(id,h,previous);
      const chosen=q?.options?.find(o=>o.id===h.choiceId);
      return !!(q&&chosen&&q.id===h.questionId&&q.familyId===id&&
        q.assessmentRole===h.assessmentRole&&h.correct===!!chosen.correct&&
        h.competency===q.competency&&h.seed===q.seed&&h.transferDepth===Number(q.transferDepth||0)&&
        (h.representation??null)===(q.representation??null));
    };
    for(const id of FAMILIES){
      const rec=data.questions[id];if(rec===undefined)continue;
      const allowed=['history','choiceId','correct','attempts','updatedAt'];
      const roleFor=v=>v==='A'?'baseline':v==='B'||v==='C'||/^T[1-9]\d*$/.test(v)?'transfer':v==='D'||/^R[1-4]-[1-9]\d*$/.test(v)?'retention':null;
      if(!plain(rec)||!Array.isArray(rec.history)||Object.keys(rec).some(k=>!allowed.includes(k))||
        rec.history.some((h,index)=>!plain(h)||typeof h.at!=='string'||!Number.isFinite(Date.parse(h.at))||Date.parse(h.at)>Date.now()+60000||
          h.familyId!==id||h.questionId!==(h.variantId==='A'?id:id+'-'+String(h.variantId).toLowerCase())||
          h.assessmentRole!==roleFor(h.variantId)||typeof h.correct!=='boolean'||typeof h.firstAttemptForVariant!=='boolean'||
          (index===0&&h.assessmentRole!=='baseline')||
          h.firstAttemptForVariant===rec.history.slice(0,index).some(prev=>prev.variantId===h.variantId)||
          !sourceMatch(id,h,rec.history.slice(0,index))))
        return {ok:false,raw,reason:'unsupported V8 控制與安全 family history '+id};
    }
    return {ok:true,raw};
  }catch(_){return {ok:false,raw:null,reason:'storage unavailable'};}
}
// The state passed to show() must be derived from the same raw V5 bytes
// acknowledged after the awaited startup flush; never adopt an updated raw
// baseline beside a stale in-memory question snapshot.
function snapshotMatches(raw,state){
  return typeof raw==='string'&&JSON.stringify(state)===raw;
}
function startupConsistent(beforeRaw,loadedState,afterRaw){
  return afterRaw===(beforeRaw===null?JSON.stringify(loadedState):beforeRaw);
}
// Evidence.load() may auto-migrate unsupported V5 and queue an overwrite.
// Serialize the raw preflight AND synchronous source load under the SAME
// storage-key Web Lock as Evidence.commitPending. Do NOT await E.flush() here:
// its queued commit needs this lock after our callback returns.
async function checkedLoad(win,storage,assessment,bank,owner,expectedRaw){
  if(typeof win.navigator?.locks?.request!=='function')throw Error('V5 Web Lock unavailable');
  return win.navigator.locks.request(KEY,{mode:'exclusive'},()=>{
    const before=gate(storage,assessment,bank,win.CircuitAssessmentV8);
    if(!before.ok||before.raw!==expectedRaw)
      throw Error('V5 changed before source load: '+(before.reason||'conflict'));
    const state=owner.load();
    const after=gate(storage,assessment,bank,win.CircuitAssessmentV8);
    if(!after.ok||after.raw!==expectedRaw||
       (expectedRaw!==null&&!snapshotMatches(expectedRaw,state)))
      throw Error('V5 changed while source loading: '+(after.reason||'conflict'));
    return state;
  });
}
function familyModel(assessment,bank){
  if(typeof assessment?.expandQuestions!=='function'||!Array.isArray(bank?.questions))throw Error('assessment source missing');
  const items=[];
  for(const id of FAMILIES){
    const source=bank.questions.find(q=>q.id===id);
    if(!source||source.moduleId!==catalog[id].module)throw Error('missing V8 控制與安全 family '+id);
    const variants=assessment.expandQuestions([source]);
    if(!variants.some(q=>q.assessmentRole==='baseline')||!variants.some(q=>q.assessmentRole==='transfer')||!variants.some(q=>q.assessmentRole==='retention'))throw Error('missing original variants '+id);
    for(const q of variants){if(q.familyId!==id||q.options?.filter(o=>o.correct).length!==1)throw Error('invalid original question '+id);}
    items.push(...variants);
  }
  return items;
}
function projection(assessment,variants,state,nowMs,families=FAMILIES){
  const rows=families.map(id=>{
    const answer=state?.questions?.[id]||null;
    const items=variants.filter(q=>q.familyId===id);
    return {id,metrics:assessment.metrics(answer,nowMs),next:assessment.nextQuestion(items,answer,nowMs),history:answer?.history||[]};
  });
  // Due retention outranks fresh baseline/transfer; preserve original family order otherwise.
  const selected=rows.find(row=>row.metrics.due&&row.next)||rows.find(row=>row.next)||null;
  return {rows,next:selected?.next||null,selectedId:selected?.id||null,metrics:selected?.metrics||null};
}
function boot(win){
  const doc=win.document,root=doc.getElementById('ee-v8-formal-root');if(!root)return;
  const $=id=>doc.getElementById(id),panel=$('ee-formal-question'),status=$('ee-formal-status'),prompt=$('ee-formal-prompt'),choices=$('ee-formal-choices'),submit=$('ee-formal-submit'),next=$('ee-formal-next'),feedback=$('ee-formal-feedback'),summary=$('ee-formal-summary'),backup=$('ee-formal-backup'),confidence=$('ee-formal-confidence');
  const A=win.CircuitAssessment,E=win.CircuitEvidence,bank=win.CircuitQuizBank,V8=win.CircuitAssessmentV8;
  let storage=null,initialRaw=null,baselineRaw=null,variants=[],current=null,busy=false,blocked=false,startedAt=0,canExportDraft=false,pendingDraft=null;
  let waitingState=null,reviewTimer=null;
  try{storage=win.localStorage;}catch(_){}
  function readRaw(){try{return storage?.getItem(KEY)??null;}catch(_){return null;}}
  function download(payload){
    const url=win.URL.createObjectURL(new win.Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=doc.createElement('a');link.download='eehandouts-v8-formal-formal-v5-backup.json';link.href=url;link.click();
    win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  }
  function readUnsubmittedAnswer(){
    if(!current||!feedback.hidden)return null;
    const choice=choices.querySelector('input:checked');
    if(!choice&&confidence.value==='')return null;
    return {
      status:'unsubmitted',familyId:current.familyId,questionId:current.id,
      variantId:current.variantId,assessmentRole:current.assessmentRole,seed:current.seed,
      choiceId:choice?.value??null,confidence:confidence.value===''?null:Number(confidence.value)
    };
  }
  async function exportBackup(){
    let evidence=null;
    // Evidence.exportBackup itself calls E.load. Guard the validation and
    // synchronous source export under the same V5 Web Lock as source writes.
    // Never await E.flush() inside this lock: the original writer needs it.
    try{
      if(E&&canExportDraft&&typeof win.navigator?.locks?.request==='function'){
        const raw=await win.navigator.locks.request(KEY,{mode:'exclusive',ifAvailable:true},lock=>{
          // A held lock must not block recovery of retained raw data/draft.
          // Only the source export needs the lock; raw-only fallback does not.
          if(!lock)return null;
          const before=gate(storage,A,bank,V8);
          if(!before.ok||before.raw!==baselineRaw)return null;
          const exported=E.exportBackup();
          const after=gate(storage,A,bank,V8);
          return after.ok&&after.raw===baselineRaw?exported:null;
        });
        if(raw!==null)evidence=JSON.parse(raw);
      }
    }catch(_){}
    // This read-only snapshot keeps our unsaved answer recoverable if the
    // competing tab replaces V5 with a schema the source must not load.
    download({format:'eehandouts-v8-formal-formal-backup-v1',key:KEY,families:FAMILIES,initialRaw,baselineRaw,currentRaw:readRaw(),evidence,pendingDraft,unsubmittedAnswer:readUnsubmittedAnswer(),reason:blocked?status.textContent:null});
  }
  backup.addEventListener('click',exportBackup);
  // Source Evidence stops outside click events in conflict mode. This is its permitted surface.
  function installSafeBackup(){
    const notice=doc.getElementById('learning-storage-status');if(!notice||notice.querySelector('#ee-v8-safe-backup'))return;
    const button=doc.createElement('button');button.type='button';button.id='ee-v8-safe-backup';
    button.textContent='下載保留的 V8 控制與安全 原始 V5 與草稿';button.addEventListener('click',exportBackup);notice.append(button);
  }
  const observer=new win.MutationObserver(installSafeBackup);observer.observe(doc.body,{childList:true,subtree:true});installSafeBackup();
  function lock(reason){
    if(blocked)return;blocked=true;root.dataset.state='protected';panel.inert=true;submit.disabled=true;next.disabled=true;
    win.clearTimeout(reviewTimer);waitingState=null;
    status.textContent='紀錄未安全保存，V8 控制與安全 正式題已停止：'+reason+'。請下載保留的原始紀錄與草稿；未認定通過。';
    installSafeBackup();
  }
  const visibleFamilies=familiesForLocation(win.location.href);
  initialRaw=readRaw();
  if(!visibleFamilies.length){lock('無法辨識題組連結，請由遷入範圍頁重新進入');return;}
  const preflight=gate(storage,A,bank,V8);baselineRaw=preflight.raw;
  if(!preflight.ok){lock(preflight.reason);return;}
  if(!A||!E||!bank||!V8){lock('source assessment or Evidence missing');return;}
  if(typeof win.navigator?.locks?.request!=='function'){lock('Web Locks unavailable');return;}
  try{variants=familyModel(A,bank);canExportDraft=true;}catch(e){lock(e.message);return;}
  win.addEventListener('storage',event=>{
    if(blocked||(event.key!==KEY&&event.key!==null))return;
    const fresh=gate(storage,A,bank,V8);if(!fresh.ok||fresh.raw!==baselineRaw)lock('another tab changed V5 history');
  });
  win.addEventListener('beforeunload',event=>{if(!busy)return;event.preventDefault();event.returnValue='';});
  function refreshWaiting(){
    if(blocked||busy||!waitingState)return;
    if(readRaw()!==baselineRaw){lock('V5 changed while waiting for review');return;}
    show(waitingState);
  }
  win.addEventListener('focus',refreshWaiting);
  win.addEventListener('pageshow',refreshWaiting);
  doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)refreshWaiting();});
  const reviewDate=new Intl.DateTimeFormat('zh-TW',{dateStyle:'short',timeStyle:'medium',hour12:false});
  function updateSummary(rows){
    summary.textContent=rows.map(({id,metrics})=>{
      const due=metrics.nextReviewAt?'（下次 '+reviewDate.format(new Date(metrics.nextReviewAt))+'）':'';
      return catalog[id].label+': '+metrics.attempts+' 筆／遷移 '+(metrics.transfer?'PASS':'未過')+'／複習 '+metrics.retentionStage+'/4'+due;
    }).join('；');
  }
  function show(state){
    if(blocked)return;
    win.clearTimeout(reviewTimer);waitingState=null;
    const view=projection(A,variants,state,Date.now(),visibleFamilies);
    const active=view.next || (visibleFamilies.length===1 ? variants.find(q=>q.familyId===visibleFamilies[0]) : null);
    const prerequisites=$('ee-formal-prerequisites');
    prerequisites.replaceChildren();
    if(active){
      for(const competency of A.prerequisitesFor(active.competency)){
        const destination=prerequisiteLinks[competency];
        if(!destination)continue;
        const link=doc.createElement('a');link.href=destination[1];link.textContent=destination[0];
        prerequisites.append(prerequisites.childElementCount?'、':'建議先複習：',link);
      }
    }
    updateSummary(view.rows);
    current=view.next;feedback.hidden=true;next.hidden=true;
    if(!current){
      const dueTimes=view.rows.filter(row=>row.metrics.nextReviewAt).map(row=>Date.parse(row.metrics.nextReviewAt));
      if(dueTimes.length){
        waitingState=state;
        // The browser timer limit is shorter than the 30- and 90-day intervals.
        const delay=Math.min(2147483647,Math.max(0,Math.min(...dueTimes)-Date.now()));
        reviewTimer=win.setTimeout(refreshWaiting,delay);
      }
      panel.hidden=true;status.textContent=view.rows.every(row=>row.metrics.fullyRetained)?'所選題族已完成四階段到期複習。':'目前沒有到期題目；待指定的複習日期再回來。';root.dataset.state='ready';return;
    }
    panel.hidden=false;panel.inert=false;choices.inert=false;choices.replaceChildren();
    panel.dataset.role=current.assessmentRole;panel.dataset.variant=current.variantId;panel.dataset.family=current.familyId;
    prompt.textContent=catalog[current.familyId].label+'｜'+current.prompt;
    for(const opt of displayOptions(current)){
      const label=doc.createElement('label'),input=doc.createElement('input'),span=doc.createElement('span');
      input.type='radio';input.name='ee-formal-choice';input.value=opt.id;span.textContent=optionText(current,opt);
      label.append(input,span);choices.append(label);
    }
    confidence.value='';confidence.disabled=false;submit.disabled=false;startedAt=Date.now();root.dataset.state='ready';
    status.textContent=current.assessmentRole==='baseline'?'首次作答將永久記錄。':current.assessmentRole==='transfer'?'遷移題：條件變更後重新作答。':'已到期：此題使用原始複習排程。';
  }
  async function start(){
    try{
      const expectedBefore=preflight.raw;
      const state=await checkedLoad(win,storage,A,bank,E,expectedBefore);
      const ack=await E.flush();if(!ack.saved)throw Error(ack.reason||'initial V5 pending');
      const fresh=gate(storage,A,bank,V8);if(blocked||!fresh.ok)throw Error(fresh.reason||'V5 conflict');
      // A fresh empty V5 is initialized by the source Evidence owner; existing
      // records must not change during awaited flush or we'd render a stale quiz.
      if(!startupConsistent(expectedBefore,state,fresh.raw)||!snapshotMatches(fresh.raw,state))throw Error('V5 source snapshot changed while initializing assessment');
      baselineRaw=fresh.raw;show(state);
    }catch(e){lock(e.message||'initialization failed');}
  }
  submit.addEventListener('click',async()=>{
    if(blocked||busy||!current)return;
    const selected=panel.querySelector('input[name="ee-formal-choice"]:checked');if(!selected){status.textContent='請先選一個選項。';return;}
    const fresh=gate(storage,A,bank,V8);if(!fresh.ok||fresh.raw!==baselineRaw){lock('V5 changed before submit');return;}
    const opt=current.options.find(o=>o.id===selected.value);if(!opt){lock('invalid selected option');return;}
    busy=true;submit.disabled=true;panel.inert=true;status.textContent='正在儲存，目前未認定通過。';
    const q=current;
    try{
      const previous=await E.flush();if(!previous.saved)throw Error(previous.reason||'previous save pending');
      const again=gate(storage,A,bank,V8);
      if(blocked||!again.ok||again.raw!==baselineRaw)throw Error('V5 changed during previous flush');
      const state=await checkedLoad(win,storage,A,bank,E,baselineRaw);
      // The source's Web Lock protects its loaded state, not the displayed q; the
      // source owner's Web Lock protects its *loaded* state, not this displayed q.
      const loaded=gate(storage,A,bank,V8);
      if(blocked||!loaded.ok||loaded.raw!==baselineRaw||!snapshotMatches(baselineRaw,state))
        throw Error('V5 source snapshot changed before answering');
      // Do not turn an omitted confidence into 0%: the original owner maps null to 0.
      const entry=A.recordAttempt(state,q,opt,{at:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-startedAt),confidence:confidence.value===''?undefined:Number(confidence.value)});
      pendingDraft=JSON.parse(JSON.stringify(state));
      E.save(state);const ack=await E.flush();if(!ack.saved)throw Error(ack.reason||'write failed');
      const written=gate(storage,A,bank,V8);
      const persisted=written.ok&&written.raw?JSON.parse(written.raw):null;
      const history=persisted?.questions?.[q.familyId]?.history;
      if(!written.ok||!history?.some(x=>x.id===entry.id))throw Error('readback mismatch');
      if(blocked)throw Error('stale conflict');
      baselineRaw=written.raw;pendingDraft=null;status.textContent='V8 控制與安全 本題首次結果已安全保存於正式 V5（非硬體認證）。';
      updateSummary(projection(A,variants,persisted,Date.now(),visibleFamilies).rows);
      const misconception=!entry.correct&&opt.misconception?'作答盲點：'+opt.misconception+'。 ':'';
      const correctOption=q.options.find(option=>option.correct);
      const explanation=entry.correct?'本題正確。 ':'本題錯誤。 '+misconception+'正解為「'+optionText(q,correctOption)+'」。 ';
      feedback.textContent=explanation+(correctOption.feedback||'')+' 首答歷史不會因重做而覆寫。';
      feedback.hidden=false;next.hidden=false;next.disabled=false;choices.inert=true;confidence.disabled=true;panel.inert=false;
    }catch(e){lock(e.message||'save failed');}finally{busy=false;}
  });
  next.addEventListener('click',async()=>{
    if(blocked||busy)return;
    busy=true;next.disabled=true;
    try{
      if(!E.storageStatus().saved)throw Error('unsaved V5');
      const fresh=gate(storage,A,bank,V8);
      if(!fresh.ok||fresh.raw!==baselineRaw)throw Error('V5 changed before next');
      const state=await checkedLoad(win,storage,A,bank,E,baselineRaw);
      const after=gate(storage,A,bank,V8);
      if(blocked||!after.ok||after.raw!==baselineRaw)throw Error('V5 changed during next');
      show(state);
    }catch(e){lock(e.message||'next failed');}finally{busy=false;}
  });
  start();
}
return {KEY,FAMILIES,optionText,displayOptions,gate,snapshotMatches,startupConsistent,checkedLoad,familyModel,projection,boot};
});
