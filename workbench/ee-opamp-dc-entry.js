/* EE-only persistence boundary. Original Solver, SkillGraph and grading are
 * left in the pinned Circuit source; this file owns only storage semantics. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const KEY='opamp-dc-reasoning-trainer-v2',VERSION='1.1.0';
const SKILLS=['UNIT_CONVERSION','VIRTUAL_SHORT','VOLTAGE_DIFFERENCE','OHMS_LAW','CURRENT_DIRECTION','KCL','FEEDBACK_DROP','VOUT_CALCULATION'];
function valid(raw){
  if(raw===null)return true;
  let data;
  try{data=JSON.parse(raw);}catch(_){return false;}
  if(!data||Array.isArray(data)||data.version!==VERSION||!data.skills||typeof data.skills!=='object'||Array.isArray(data.skills))return false;
  // A same-version extension must not be silently rewritten by source snapshot().
  if(Object.keys(data).length!==2||Object.keys(data.skills).length!==SKILLS.length)return false;
  const fields=['skill_id','attempts','correct_count','incorrect_count','current_streak','best_streak','mastery_score','hint_count','last_error_type','last_seen_at','recent','clean_streak','parameter_signatures'];
  for(const key of SKILLS){
    const s=data.skills[key];if(!s||s.skill_id!==key||Object.keys(s).length!==fields.length||fields.some(f=>!Object.prototype.hasOwnProperty.call(s,f)))return false;
    for(const field of ['attempts','correct_count','incorrect_count','current_streak','best_streak','mastery_score','hint_count','clean_streak'])if(!Number.isFinite(s[field])||s[field]<0)return false;
    for(const f of ['attempts','correct_count','incorrect_count','current_streak','best_streak','hint_count','clean_streak'])if(!Number.isSafeInteger(s[f]))return false;
    if(s.correct_count+s.incorrect_count!==s.attempts||s.mastery_score>1||s.current_streak>s.best_streak||s.best_streak>s.attempts||s.clean_streak>s.current_streak||s.hint_count>s.attempts)return false;
    if(s.last_error_type!==null&&typeof s.last_error_type!=='string')return false;
    if(!Array.isArray(s.recent)||s.recent.length>5||s.recent.some(x=>typeof x!=='boolean'))return false;
    if(!Array.isArray(s.parameter_signatures)||s.parameter_signatures.length>12||s.parameter_signatures.some(x=>typeof x!=='string'))return false;
    if(!(s.last_seen_at===null||typeof s.last_seen_at==='string'))return false;
  }
  return true;
}
function createGuard(nativeStorage,notify=()=>{}){
  let baseline=null,blocked=false,draft=null,reason='';
  const fail=(why,attempted=null)=>{
    if(attempted!==null)draft=attempted;
    if(!blocked){blocked=true;reason=why;notify({type:'protected',reason:why});}
    throw new Error('trainer protected: '+why);
  };
  try{baseline=nativeStorage.getItem(KEY);if(!valid(baseline))fail('unsupported stored progress');}
  catch(e){if(!blocked){blocked=true;reason='storage unavailable';notify({type:'protected',reason});}}
  const ensure=()=>{
    if(blocked)throw new Error('trainer protected: '+reason);
    let current;
    try{current=nativeStorage.getItem(KEY);}catch(e){return fail('storage read failed');}
    if(current!==baseline)return fail('stored history changed');
    return current;
  };
  const storage={
    getItem(key){if(key!==KEY)throw Error('invalid key');return ensure();},
    setItem(key,value){
      if(key!==KEY)throw Error('invalid key');
      const bytes=String(value);
      ensure();
      if(!valid(bytes))return fail('invalid trainer snapshot',bytes);
      try{nativeStorage.setItem(KEY,bytes);}catch(e){return fail('save failed: '+(e.name||'storage error'),bytes);}
      let readback;
      try{readback=nativeStorage.getItem(KEY);}catch(e){return fail('readback failed',bytes);}
      if(readback!==bytes)return fail('readback mismatch',bytes);
      baseline=bytes;draft=null;notify({type:'saved'});
    },
    // Source reset calls removeItem then save; make it one replacement write.
    removeItem(key){if(key!==KEY)throw Error('invalid key');ensure();}
  };
  return Object.freeze({storage,ok:()=>!blocked,onStorage(event){if((event.key===KEY||event.key===null)&&!blocked){try{ensure();}catch(_){}}},backup(){let current=null,readError=false;try{current=nativeStorage.getItem(KEY);}catch(_){readError=true;}return {key:KEY,version:VERSION,raw:baseline,currentRaw:current,currentReadError:readError,draft,protected:blocked,reason};}});
}
function boot(win){
  const doc=win.document,root=doc.querySelector('[data-opamp-dc-trainer]'),status=doc.getElementById('ee-trainer-status'),exportButton=doc.getElementById('ee-trainer-export');
  if(!root||!status||!exportButton)return;
  const lock=reason=>{doc.documentElement.dataset.eeTrainerState='protected';root.inert=true;status.textContent='儲存或紀錄版本發生問題：'+reason+'。練習已停止，資料可能未成功保存。請下載可讀的原始紀錄與本次草稿備份。';};
  // Some privacy modes throw while reading the localStorage property itself.
  let nativeStorage=null;try{nativeStorage=win.localStorage;}catch(_){}
  const guard=createGuard(nativeStorage,event=>{if(event.type==='protected')lock(event.reason);else if(event.type==='saved')status.textContent='本題 mastery 進度已保存於此瀏覽器（非正式評量）';});
  win.EETrainerStorage=guard.storage;
  exportButton.disabled=false;
  exportButton.addEventListener('click',()=>{
    const data=guard.backup(),session=root.__trainer?.session;
    if(session)data.currentInMemory=session.mastery.snapshot();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=doc.createElement('a');a.href=url;a.download='eehandouts-opamp-dc-trainer-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  win.addEventListener('storage',event=>guard.onStorage(event));
  win.addEventListener('beforeunload',event=>{if(!guard.ok()){event.preventDefault();event.returnValue='';}});
  // Source's unguarded reset uses removeItem->save. We handle the click first;
  // removeItem is a no-op and the following setItem is the atomic replacement.
  doc.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-trainer-reset]');if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!guard.ok()||!win.confirm('確定重設本機 DC Trainer mastery？原資料會被新的空紀錄取代。請先匯出備份。'))return;
    const ui=root.__trainer;if(!ui)return;
    ui.session.reset();
    if(!guard.ok())return;
    ui.root.querySelector('[data-trainer-report]').hidden=true;
    ui.root.querySelector('[data-trainer-question-card]').hidden=false;
    ui.renderQuestion(ui.session.next());
  },true);
  if(!guard.ok()){lock(guard.backup().reason);return;}
  const script=doc.createElement('script');script.src='12_opamp_slew_rate/assets/opamp-dc-trainer.js';
  script.onload=()=>{
    try{
      if(!win.CircuitOpampDcTrainer)throw Error('missing trainer module');
      win.CircuitOpampDcTrainer.autoMount();
      if(!root.__trainer||!guard.ok())throw Error('trainer not ready');
      for(const button of root.querySelectorAll('[data-trainer-submit],[data-trainer-hint],[data-trainer-reset]'))button.disabled=false;
      doc.documentElement.dataset.eeTrainerState='ready';status.textContent='練習可用。Mastery 只記錄於此瀏覽器，未授予正式成績。';
    }catch(e){lock('boot failed');}
  };
  script.onerror=()=>lock('trainer script missing');
  doc.body.append(script);
}
return {createGuard,valid,boot};
});