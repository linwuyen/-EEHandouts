import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Q=require('../workbench/assets/learning/quiz-bank.js');
const A=require('../workbench/assets/learning/learning-assessment.js');
const E=require('../workbench/assets/learning/learning-evidence.js');
const H=require('../workbench/ee-adc-assessment.js');
const KEY=H.KEY;
const store=(data={})=>({getItem:k=>Object.hasOwn(data,k)?data[k]:null});
const questions=H.familyModel(A,Q);
test('three original source ADC question families, no grade copy',()=>{
 assert.deepEqual(Array.from(H.FAMILIES),['adc-levels-vs-codes','adc-divider-power','adc-offset-purpose']);
 assert.equal(questions.length,12);
 for(const id of H.FAMILIES){
  const family=questions.filter(q=>q.familyId===id);
  assert.deepEqual(family.map(q=>q.assessmentRole),['baseline','transfer','transfer','retention']);
  assert.equal(family.every(q=>q.options.filter(o=>o.correct).length===1),true);
  assert.notEqual(family[0].prompt,family[1].prompt,'source has changed-condition question '+id);
 }
});
test('unknown/future V5, malformed nested sections and ADC family records fail closed',()=>{
 const raw=JSON.stringify(E.emptyState());assert.equal(H.gate(store({[KEY]:raw})).ok,true);
 for(const bad of ['{broken',JSON.stringify({schema:'circuit-learning-state',version:999,questions:{}}),JSON.stringify({schema:'circuit-learning-state',version:5,questions:[]} )]){
  const g=H.gate(store({[KEY]:bad}));assert.equal(g.ok,false);assert.equal(g.raw,bad);
 }
 for(const id of H.FAMILIES){
  const data=E.emptyState();data.questions[id]={history:'foreign bytes'};
  const before=JSON.stringify(data);
  const g=H.gate(store({[KEY]:before}));assert.equal(g.ok,false,id);assert.equal(g.raw,before,id);
 }
 for(const section of ['evidence','reports','predictions','benchmark','migrations','identityAliases']){
  const data=E.emptyState();data[section]='future section';
  const g=H.gate(store({[KEY]:JSON.stringify(data)}));assert.equal(g.ok,false,section);
 }
 const legacy=H.gate(store({'circuit-learning-state-v4':'{"version":4}'}));assert.equal(legacy.ok,false);
 const inaccessible=H.gate({getItem(){throw new Error('denied');}});assert.equal(inaccessible.ok,false);
});
test('cross-family foreign identities and swapped role/variant cannot earn ADC credit',()=>{
 const id=H.FAMILIES[0],original=E.emptyState();
 const foreignQ=Q.questions.find(q=>q.id==='spi-clock-throughput');
 const fake=A.expandQuestions([foreignQ])[1];
 A.recordAttempt(original,fake,fake.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 const other=original.questions[foreignQ.id].history[0];
 original.questions[id]={history:[{...other,variantId:'B',assessmentRole:'transfer',correct:true,firstAttemptForVariant:true}]};
 assert.equal(H.gate(store({[KEY]:JSON.stringify(original)})).ok,false,'foreign SPI evidence cannot unlock ADC transfer');
 const valid=E.emptyState(),q=questions.find(x=>x.familyId===id&&x.variantId==='A');
 A.recordAttempt(valid,q,q.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 const raw=JSON.stringify(valid);assert.equal(H.gate(store({[KEY]:raw})).ok,true,'original ADC baseline remains compatible');
 valid.questions[id].history[0].assessmentRole='transfer';
 assert.equal(H.gate(store({[KEY]:JSON.stringify(valid)})).ok,false,'A cannot masquerade as transfer');
 const transferOnly=E.emptyState(),t=questions.find(x=>x.familyId===id&&x.variantId==='B');
 A.recordAttempt(transferOnly,t,t.options.find(o=>o.correct),{at:'2026-11-09T10:00:00Z'});
 assert.equal(H.gate(store({[KEY]:JSON.stringify(transferOnly)})).ok,false,'transfer cannot be first family attempt');
});
test('startup cannot adopt a new V5 raw baseline beside the previously loaded question state',()=>{
 const state=E.emptyState(),before=JSON.stringify(state);
 assert.equal(H.startupConsistent(before,state,before),true);
 const changed={...state,events:[...state.events,{at:'2026-11-09T10:00:00Z',event:'other-tab'}]};
 assert.equal(H.startupConsistent(before,state,JSON.stringify(changed)),false,'foreign valid V5 raw cannot be treated as this snapshot');
 assert.equal(H.startupConsistent(null,state,JSON.stringify(state)),true,'initial first write of the exact loaded state is expected');
 assert.equal(H.startupConsistent(null,state,JSON.stringify(changed)),false,'first write must not silently adopt another state');
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
console.log('PASS ADC formal V5: 3 original families, source first attempt/transfer/due, future/nested data safeguards');
