import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Q=require('../workbench/assets/learning/quiz-bank.js');
const A=require('../workbench/assets/learning/learning-assessment.js');
require('../workbench/assets/learning/opamp-assessment.js');
const E=require('../workbench/assets/learning/learning-evidence.js');
const H=require('../workbench/ee-opamp-assessment.js');
const KEY=H.KEY,F=H.FAMILY;
const store=(data={})=>({getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null});
test('formal route reuses pinned original OP question family and variants',()=>{
 const variants=H.familyModel(A,Q);
 assert.equal(variants.length,8);assert.equal(variants[0].assessmentRole,'baseline');
 assert.equal(variants.filter(x=>x.assessmentRole==='transfer').length,3);
 assert.equal(variants.filter(x=>x.assessmentRole==='retention').length,4);
 assert.equal(variants.every(q=>q.options.filter(o=>o.correct).length===1),true);
});
test('V5 gate preserves unknown/future/malformed bytes, no silent legacy migration',()=>{
 const ok=JSON.stringify(E.emptyState());
 assert.equal(H.gate(store({[KEY]:ok})).ok,true);
 for(const raw of ['{broken',JSON.stringify({schema:'circuit-learning-state',version:999,questions:{}}),JSON.stringify({schema:'circuit-learning-state',version:5,questions:[]} )]){
   const check=H.gate(store({[KEY]:raw}));assert.equal(check.ok,false);assert.equal(check.raw,raw);
 }
 const malformed=E.emptyState();malformed.evidence='original payload';
 const badEvidence=JSON.stringify(malformed);
 assert.equal(H.gate(store({[KEY]:badEvidence})).ok,false);
 malformed.evidence={};
 malformed.questions[F]={history:'original history',extra:'keep'};
 const badHistory=JSON.stringify(malformed);
 assert.equal(H.gate(store({[KEY]:badHistory})).ok,false);
 assert.equal(H.gate(store({[KEY]:badHistory})).raw,badHistory);
 const legacy=H.gate(store({'circuit-learning-state-v4':'{"version":4}'}));
 assert.equal(legacy.ok,false);assert.match(legacy.reason,/legacy/);
});
test('first answer immutable, transfer creates due review, source retention intervals preserved',()=>{
 const variants=H.familyModel(A,Q),state=E.emptyState(),t0=Date.parse('2026-11-09T10:00:00.000Z');
 let q=H.projection(A,variants,state,t0).next;
 assert.equal(q.assessmentRole,'baseline');
 A.recordAttempt(state,q,q.options.find(o=>!o.correct),{at:new Date(t0).toISOString()});
 q=H.projection(A,variants,state,t0+1).next;
 assert.equal(q.assessmentRole,'transfer');
 A.recordAttempt(state,q,q.options.find(o=>o.correct),{at:new Date(t0+1000).toISOString()});
 const m=H.projection(A,variants,state,t0+2000);
 assert.equal(m.metrics.baseline,false);assert.equal(m.metrics.transfer,true);
 assert.equal(m.next,null);assert.equal(m.metrics.due,false);
 assert.equal(Date.parse(m.metrics.nextReviewAt),t0+1000+A.DAY_MS);
 const due=H.projection(A,variants,state,t0+1000+A.DAY_MS+1);
 assert.equal(due.metrics.due,true);assert.equal(due.next.assessmentRole,'retention');
 A.recordAttempt(state,due.next,due.next.options.find(o=>o.correct),{at:new Date(t0+1000+A.DAY_MS+1).toISOString()});
 const after=H.projection(A,variants,state,t0+1000+A.DAY_MS+2);
 assert.equal(after.metrics.retentionStage,1);
 assert.equal(Date.parse(after.metrics.nextReviewAt),t0+1000+A.DAY_MS+1+7*A.DAY_MS);
 assert.equal(state.questions[F].history[0].correct,false);
 assert.equal(state.questions[F].history[0].firstAttemptForVariant,true);
});
console.log('PASS OP formal assessment: original first attempt, transfer, retention and V5 record gates');