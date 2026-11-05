/* Validation boundary only: never repairs, normalizes, grades or writes source evidence. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.EEApplicationsContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
 function sameValues(actual,expected,tolerance=1e-11){
  if(!object(actual)||Object.keys(actual).length!==Object.keys(expected).length)return false;
  return Object.entries(expected).every(([key,value])=>typeof value==='number'
   ? typeof actual[key]==='number'&&Number.isFinite(actual[key])&&Math.abs(actual[key]-value)<=tolerance*Math.max(1,Math.abs(value))
   : actual[key]===value);
 }
 function hasModel(R,id){
  const card=R.describe(id);
  return card?.id===id&&typeof card.version==='string'&&card.version.trim().length>0;
 }
 function attempt(value,answer,choices){
  return object(value)&&choices.includes(value.answer)&&typeof value.correct==='boolean'&&value.correct===(value.answer===answer);
 }
 function validate(record,W,R){
  if(record===undefined)return null;
  if(!object(record)||record.version!==1||!object(record.rows))return '電路練習紀錄版本或格式不相容';
  const lessons=W.applicationLessons(),ids=lessons.map(l=>l.id);
  if(Object.keys(record.rows).some(id=>!ids.includes(id)))return '紀錄含有尚未支援的電路練習';
  if(own(record,'currentLesson')&&!ids.includes(record.currentLesson))return '已存電路選擇不相容';
  if(own(record,'completed')&&typeof record.completed!=='boolean')return '完成狀態格式不符';
  for(const lesson of lessons){
   if(!own(record.rows,lesson.id))continue;
   const row=record.rows[lesson.id];
   if(!object(row))return lesson.id+' 判斷紀錄格式不符';
   for(const key of ['prepared','operated','observationPassed','reasonPassed'])if(own(row,key)&&typeof row[key]!=='boolean')return lesson.id+' 狀態格式不符';
   if(own(row,'protocol')&&row.protocol!=='topology-application-v1')return lesson.id+' 判斷協定不相容';
   for(const [key,answer,choices]of [['first',lesson.answer,['lower','higher','same']],['observationFirst',lesson.answer,['lower','higher','same']],['reasonFirst','reason',['reason','other']]]){
    if(own(row,key)&&(!attempt(row[key],answer,choices)||row.protocol!=='topology-application-v1'))return lesson.id+' 首次判斷不完整或不一致';
   }
   if(row.first&&row.prepared!==true)return lesson.id+' 缺少明確套用起始條件';
   if(row.operated!==true){
    if(row.observationPassed===true||row.reasonPassed===true||own(row,'before')||own(row,'after')||own(row,'observationFirst')||own(row,'reasonFirst')||own(row,'model')||own(row,'controls'))return lesson.id+' 未操作卻帶有結果或判定';
    continue;
   }
   if(row.protocol!=='topology-application-v1'||!row.first||row.prepared!==true)return lesson.id+' 操作前的判斷不完整';
   if(!hasModel(R,lesson.modelId))return lesson.id+' 缺少模型版本契約';
   const card=R.describe(lesson.modelId);
   if(!object(row.model)||row.model.id!==lesson.modelId||typeof row.model.version!=='string'||row.model.version!==card.version)return lesson.id+' 已存模型 ID／版本不相容';
   const plan=W.applicationPlan(lesson.id);
   if(!object(row.controls)||!sameValues(row.controls.before,plan.before)||!sameValues(row.controls.after,plan.after))return lesson.id+' 已存條件與此版練習不一致';
   for(const phase of ['before','after']){
    const saved=row[phase];if(!object(saved)||!object(saved.result))return lesson.id+' 已有模型對照不完整';
    let expected;try{expected=W.applicationRun(lesson.id,plan[phase]);}catch{return lesson.id+' 模型無法驗證既有對照';}
    if(!sameValues(saved.params,expected.params))return lesson.id+' 已存參數或單位不一致';
    if(!sameValues(saved.result,expected.result,1e-10))return lesson.id+' 已有模型對照不完整或不一致';
   }
   if((row.observationPassed===true&&!row.observationFirst)||(row.observationFirst?.correct&&row.observationPassed!==true))return lesson.id+' 觀察判斷與通過狀態不一致';
   if((row.reasonFirst&&row.observationPassed!==true)||(row.reasonPassed===true&&!row.reasonFirst)||(row.reasonFirst?.correct&&row.reasonPassed!==true))return lesson.id+' 原因與觀察判斷不一致';
  }
  if(record.completed===true&&!lessons.every(l=>W.applicationProof(record.rows[l.id])))return '完成標記沒有完整練習證據';
  return null;
 }
 function storage(raw,W,R){
  if(raw===null)return null;
  let state;try{state=JSON.parse(raw);}catch{return '原始紀錄無法讀取';}
  if(!object(state)||state.schema!=='circuit-learning-state'||state.version!==5)return '原始紀錄版本不相容';
  if(own(state,'benchmark')&&!object(state.benchmark))return '原始 benchmark 格式不相容';
  const workspace=state.benchmark?.learningWorkspace;
  if(state.benchmark&&own(state.benchmark,'learningWorkspace')&&(!object(workspace)||workspace.version!==1))return '原始工作台紀錄版本不相容';
  return validate(workspace?.topologyApplications,W,R);
 }
 return Object.freeze({hasModel,validate,storage});
});
