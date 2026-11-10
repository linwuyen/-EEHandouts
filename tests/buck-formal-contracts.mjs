import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Q=require('../workbench/assets/learning/quiz-bank.js');
const A=require('../workbench/assets/learning/learning-assessment.js');
const E=require('../workbench/assets/learning/learning-evidence.js');
const H=require('../workbench/ee-buck-assessment.js');
const KEY=H.KEY;
const gated=storage=>H.gate(storage,A,Q);
const store=(data={})=>({getItem:k=>Object.hasOwn(data,k)?data[k]:null});
const questions=H.familyModel(A,Q);
test('three original source Buck question families, no grade copy',()=>{
 assert.deepEqual(Array.from(H.FAMILIES),['buck-ripple-inductance-transfer','buck-dcm-boundary','buck-model-validity']);
 assert.equal(questions.length,12);
 for(const id of H.FAMILIES){
  const family=questions.filter(q=>q.familyId===id);
  assert.deepEqual(family.map(q=>q.assessmentRole),['baseline','transfer','transfer','retention']);
  assert.equal(family.every(q=>q.options.filter(o=>o.correct).length===1),true);
  assert.notEqual(family[0].prompt,family[1].prompt,'source has changed-condition question '+id);
 }
});
test('unknown/future V5, malformed nested sections and Buck family records fail closed',()=>{
 const raw=JSON.stringify(E.emptyState());assert.equal(gated(store({[KEY]:raw})).ok,true);
 for(const bad of ['{broken',JSON.stringify({schema:'circuit-learning-state',version:999,questions:{}}),JSON.stringify({schema:'circuit-learning-state',version:5,questions:[]} )]){
  const g=gated(store({[KEY]:bad}));assert.equal(g.ok,false);assert.equal(g.raw,bad);
 }
 for(const id of H.FAMILIES){
  const data=E.emptyState();data.questions[id]={history:'foreign bytes'};
  const before=JSON.stringify(data);
  const g=gated(store({[KEY]:before}));assert.equal(g.ok,false,id);assert.equal(g.raw,before,id);
 }
 for(const section of ['evidence','reports','predictions','benchmark','migrations','identityAliases']){
  const data=E.emptyState();data[section]='future section';
  const g=gated(store({[KEY]:JSON.stringify(data)}));assert.equal(g.ok,false,section);
 }
 const legacy=gated(store({'circuit-learning-state-v4':'{"version":4}'}));assert.equal(legacy.ok,false);
 const inaccessible=gated({getItem(){throw new Error('denied');}});assert.equal(inaccessible.ok,false);
});
test('cross-family foreign identities and swapped role/variant cannot earn Buck credit',()=>{
 const id=H.FAMILIES[0],original=E.emptyState();
 const foreignQ=Q.questions.find(q=>q.id==='adc-levels-vs-codes');
 const fake=A.expandQuestions([foreignQ])[1];
 A.recordAttempt(original,fake,fake.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 const other=original.questions[foreignQ.id].history[0];
 original.questions[id]={history:[{...other,variantId:'B',assessmentRole:'transfer',correct:true,firstAttemptForVariant:true}]};
 assert.equal(gated(store({[KEY]:JSON.stringify(original)})).ok,false,'foreign ADC evidence cannot unlock Buck transfer');
 const valid=E.emptyState(),q=questions.find(x=>x.familyId===id&&x.variantId==='A');
 A.recordAttempt(valid,q,q.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 const raw=JSON.stringify(valid);assert.equal(gated(store({[KEY]:raw})).ok,true,'original Buck baseline remains compatible');
 valid.questions[id].history[0].assessmentRole='transfer';
 assert.equal(gated(store({[KEY]:JSON.stringify(valid)})).ok,false,'A cannot masquerade as transfer');
 const transferOnly=E.emptyState(),t=questions.find(x=>x.familyId===id&&x.variantId==='B');
 A.recordAttempt(transferOnly,t,t.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 assert.equal(gated(store({[KEY]:JSON.stringify(transferOnly)})).ok,false,'transfer cannot be first family attempt');
});
test('startup cannot adopt a new V5 raw baseline beside the previously loaded question state',()=>{
 const state=E.emptyState(),before=JSON.stringify(state);
 assert.equal(H.startupConsistent(before,state,before),true);
 const changed={...state,events:[...state.events,{at:'2026-11-09T10:00:00Z',event:'other-tab'}]};
 assert.equal(H.startupConsistent(before,state,JSON.stringify(changed)),false,'foreign valid V5 raw cannot be treated as this snapshot');
 assert.equal(H.startupConsistent(null,state,JSON.stringify(state)),true,'initial first write of the exact loaded state is expected');
 assert.equal(H.startupConsistent(null,state,JSON.stringify(changed)),false,'first write must not silently adopt another state');
});
test('original option outcome / choice ID and future-dated retention cannot impersonate Buck mastery',()=>{
 const id=H.FAMILIES[0],base=questions.find(q=>q.familyId===id&&q.variantId==='A'),transfer=questions.find(q=>q.familyId===id&&q.variantId==='B'),retention=questions.find(q=>q.familyId===id&&q.variantId==='D');
 const state=E.emptyState(),t=Date.now()-2*A.DAY_MS;
 A.recordAttempt(state,base,base.options.find(o=>o.correct),{at:new Date(t).toISOString()});
 A.recordAttempt(state,transfer,transfer.options.find(o=>!o.correct),{at:new Date(t+1000).toISOString()});
 assert.equal(gated(store({[KEY]:JSON.stringify(state)})).ok,true);
 const history=state.questions[id].history;
 history[1].correct=true;
 assert.equal(gated(store({[KEY]:JSON.stringify(state)})).ok,false,'flipping a wrong choice to correct must not grant transfer');
 history[1].correct=false;history[1].choiceId='nonexistent';
 assert.equal(gated(store({[KEY]:JSON.stringify(state)})).ok,false,'missing source option must not be accepted');
 history[1].choiceId=transfer.options.find(o=>!o.correct).id;
 const due=new Date(Date.now()+30*A.DAY_MS).toISOString();
 A.recordAttempt(state,retention,retention.options.find(o=>o.correct),{at:due});
 assert.equal(gated(store({[KEY]:JSON.stringify(state)})).ok,false,'future review must not be counted as due or retained');
});
test('storage-key Web Lock gates source loading before any auto-migration can overwrite a new schema',async()=>{
 const baseline=JSON.stringify(E.emptyState()),future=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},keep:'future-raw'});
 const data={[KEY]:baseline};let loaded=0,locks=0;
 const source={load(){loaded++;return E.emptyState();},flush(){throw Error('must never flush inside held lock');}};
 const win={navigator:{locks:{request:async(key,options,callback)=>{
  assert.equal(key,KEY);assert.equal(options.mode,'exclusive');locks++;
  data[KEY]=future;return callback();
 }}}};
 await assert.rejects(H.checkedLoad(win,store(data),A,Q,source,baseline),/V5 changed/);
 assert.equal(loaded,0,'source load must not normalize or queue a write after competitor sets future V5');
 assert.equal(data[KEY],future,'other tab raw is byte-identical after rejection');assert.equal(locks,1);
 const stable={[KEY]:baseline};
 const safe={load(){loaded++;return JSON.parse(stable[KEY]);},flush(){throw Error('flush cannot run under lock');}};
 const passWin={navigator:{locks:{request:async(key,opts,callback)=>{
  assert.equal(key,KEY);return callback();
 }}}};
 assert.deepEqual(await H.checkedLoad(passWin,store(stable),A,Q,safe,baseline),JSON.parse(baseline));
 assert.equal(loaded,1,'valid source load executes exactly once');
});
test('loaded source snapshot must match the preflight raw exactly',()=>{
 const state=E.emptyState(),raw=JSON.stringify(state);
 assert.equal(H.snapshotMatches(raw,state),true);
 const changed=structuredClone(state);changed.questions.foreign={history:[]};
 assert.equal(H.snapshotMatches(raw,changed),false);
 assert.equal(H.snapshotMatches(null,state),false);
});
test('first wrong answer never becomes passed baseline; three families advance with source transfer and due logic',()=>{
 const state=E.emptyState(),t0=Date.parse('2026-11-09T10:00:00.000Z');
 let v=H.projection(A,questions,state,t0);
 assert.equal(v.next.familyId,H.FAMILIES[0]);assert.equal(v.next.assessmentRole,'baseline');
 const first=A.recordAttempt(state,v.next,v.next.options.find(o=>!o.correct),{at:new Date(t0).toISOString(),confidence:undefined});
 assert.equal(first.correct,false);assert.equal(first.confidence,null,'skipped confidence must remain missing');
 v=H.projection(A,questions,state,t0+100);
 assert.equal(v.next.familyId,H.FAMILIES[0]);assert.equal(v.next.assessmentRole,'transfer');
 A.recordAttempt(state,v.next,v.next.options.find(o=>o.correct),{at:new Date(t0+1000).toISOString()});
 v=H.projection(A,questions,state,t0+2000);
 assert.equal(v.rows[0].metrics.baseline,false);assert.equal(v.rows[0].metrics.transfer,true);
 assert.equal(v.next.familyId,H.FAMILIES[1]);assert.equal(v.next.assessmentRole,'baseline');
 for(let i=1;i<3;i++){
  A.recordAttempt(state,v.next,v.next.options.find(o=>o.correct),{at:new Date(t0+i*3000).toISOString()});
  v=H.projection(A,questions,state,t0+i*3000+1);
  assert.equal(v.next.familyId,H.FAMILIES[i]);assert.equal(v.next.assessmentRole,'transfer');
  A.recordAttempt(state,v.next,v.next.options.find(o=>o.correct),{at:new Date(t0+i*3000+1000).toISOString()});
  v=H.projection(A,questions,state,t0+i*3000+1200);
 }
 assert.equal(v.next,null,'no repeat scoring before due');
 assert.equal(v.rows.every(row=>row.metrics.transfer),true);
 assert.equal(v.rows[0].history[0].correct,false);
 assert.equal(v.rows[0].metrics.due,false);
 const t1=t0+7000+A.DAY_MS+1;
 v=H.projection(A,questions,state,t1);
 assert.equal(v.next.familyId,H.FAMILIES[0]);assert.equal(v.next.assessmentRole,'retention');
 A.recordAttempt(state,v.next,v.next.options.find(o=>o.correct),{at:new Date(t1).toISOString()});
 v=H.projection(A,questions,state,t1+1);
 assert.equal(v.rows[0].metrics.retentionStage,1);
 assert.equal(Date.parse(v.rows[0].metrics.nextReviewAt),t1+7*A.DAY_MS);
 assert.equal(v.next.familyId,H.FAMILIES[1],'other due families remain independently queued');
});
test('due review outranks unseen family baseline',()=>{
 const state=E.emptyState(),t=Date.parse('2026-11-09T10:00:00Z');
 let q=H.projection(A,questions,state,t).next;
 A.recordAttempt(state,q,q.options.find(o=>o.correct),{at:new Date(t).toISOString()});
 q=H.projection(A,questions,state,t+100).next;
 A.recordAttempt(state,q,q.options.find(o=>o.correct),{at:new Date(t+100).toISOString()});
 const view=H.projection(A,questions,state,t+100+A.DAY_MS+1);
 assert.equal(view.next.familyId,H.FAMILIES[0]);assert.equal(view.next.assessmentRole,'retention');
});
console.log('PASS Buck formal V5: 3 original families, source first attempt/transfer/due, future/nested data safeguards');
