import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const Q=require('../workbench/assets/learning/quiz-bank.js');
const A=require('../workbench/assets/learning/learning-assessment.js');
const E=require('../workbench/assets/learning/learning-evidence.js');
const context={CircuitQuizBank:Q,CircuitAssessment:A};
runInNewContext(readFileSync('workbench/assets/learning/power-firmware-assessment.js','utf8'),context,{filename:'power-firmware-assessment.js'});
const FW=context.CircuitPowerFirmwareAssessment;
const H=require('../workbench/ee-power-firmware-assessment.js');
const KEY=H.KEY,FAMILIES=['power-sync-deadline','protection-trip-latency','capstone-signal-chain'];
const store=(data={})=>({getItem:k=>Object.hasOwn(data,k)?data[k]:null});
const gate=data=>H.gate(store(data),A,Q,FW);
const questions=H.familyModel(A,Q);
const snapshot=s=>({[KEY]:JSON.stringify(s)});
const at=n=>new Date(n).toISOString();
const find=(family,variant)=>questions.find(q=>q.familyId===family&&q.variantId===variant);
test('original power firmware extension with three distinct formal family owners',()=>{
 assert.ok(FW&&A.__powerFirmwareInstalled);
 assert.deepEqual(Array.from(H.FAMILIES),FAMILIES);
 assert.equal(questions.length,24);
 const modules=['power-sync','protection','power-capstone'];
 for(const [n,id] of FAMILIES.entries()){
  const items=questions.filter(q=>q.familyId===id);
  assert.equal(items.length,8);assert.equal(items[0].moduleId,modules[n]);
  assert.deepEqual(items.map(q=>q.variantId),['A','B','C','D','R1','R2','R3','R4']);
  assert.deepEqual(items.map(q=>q.assessmentRole),['baseline','transfer','transfer','retention','retention','retention','retention','retention']);
  assert.equal(items.every(q=>q.options.filter(o=>o.correct).length===1),true);
  assert.notEqual(items[0].prompt,items[1].prompt);
 }
});
test('all three new source-manifest rows pin exact source and current SHA-256',()=>{
 const m=JSON.parse(readFileSync('workbench/source-manifest.json','utf8'));
 assert.equal(m.sourceCommit,'11ef4e4801b5283f265dc349a4afec0027603228');
 for(const [path,blob,sourcePath,adapted] of [
  ['assets/learning/power-firmware-assessment.js','5579ff0338656507dab45ac7bd7a4dc3d6388048','assets/learning/power-firmware-assessment.js',false],
  ['power-firmware-assessment.html','61ad104246926cea2ea5b94ce9ded605c34340da','quiz.html',true],
  ['ee-power-firmware-assessment.js','61ad104246926cea2ea5b94ce9ded605c34340da','quiz.html',true]
 ]){
  const rows=m.files.filter(r=>r.path===path);assert.equal(rows.length,1,path);
  assert.equal(rows[0].sourceBlob,blob);assert.equal(rows[0].sourcePath,sourcePath);
  assert.equal(rows[0].adapted,adapted);
  assert.equal(rows[0].sha256,createHash('sha256').update(readFileSync('workbench/'+path)).digest('hex'),path+' exact bytes');
 }
 const html=readFileSync('workbench/power-firmware-assessment.html','utf8');
 assert.match(html,/id="ee-firmware-formal-root"/);
 assert.match(html,/src="assets\/learning\/power-firmware-assessment\.js"/);
 assert.match(html,/src="ee-power-firmware-assessment\.js"/);
});
test('future/legacy/foreign V5 state is preserved but cannot be accepted',()=>{
 assert.equal(gate(snapshot(E.emptyState())).ok,true);
 for(const raw of ['{broken',JSON.stringify({schema:'circuit-learning-state',version:100,questions:{}}),JSON.stringify({schema:'circuit-learning-state',version:5,questions:[]})]){
  const result=gate({[KEY]:raw});assert.equal(result.ok,false);assert.equal(result.raw,raw);
 }
 assert.equal(gate({'circuit-learning-state-v4':'{"version":4}'}).ok,false);
 for(const section of ['evidence','reports','predictions','benchmark','migrations','identityAliases']){
  const data=E.emptyState();data[section]='future schema';assert.equal(gate(snapshot(data)).ok,false,section);
 }
 for(const id of FAMILIES){const data=E.emptyState();data.questions[id]={history:'foreign'};assert.equal(gate(snapshot(data)).ok,false,id);}
 const foreign=E.emptyState(),adc=Q.questions.find(q=>q.id==='adc-levels-vs-codes'),q=A.expandQuestions([adc])[1];
 A.recordAttempt(foreign,q,q.options.find(o=>o.correct),{at:at(Date.now()-500000)});
 foreign.questions[FAMILIES[0]]={history:foreign.questions[adc.id].history};
 assert.equal(gate(snapshot(foreign)).ok,false,'ADC evidence cannot impersonate Power Firmware');
});
test('baseline wrong answer remains immutable and next transfer/1-7-30-90 scheduling belongs to original source',()=>{
 const s=E.emptyState(),t=Date.parse('2026-11-09T09:00:00Z');
 let p=H.projection(A,questions,s,t);
 assert.equal(p.next.familyId,FAMILIES[0]);assert.equal(p.next.variantId,'A');
 const first=A.recordAttempt(s,p.next,p.next.options.find(o=>!o.correct),{at:at(t),confidence:undefined});
 assert.equal(first.correct,false);assert.equal(first.confidence,null);
 assert.equal(gate(snapshot(s)).ok,true);
 p=H.projection(A,questions,s,t+100);assert.equal(p.next.variantId,'B');
 A.recordAttempt(s,p.next,p.next.options.find(o=>o.correct),{at:at(t+1000)});
 assert.equal(s.questions[FAMILIES[0]].history[0].correct,false);
 for(let i=1;i<FAMILIES.length;i++){
  p=H.projection(A,questions,s,t+2000+i*2200);
  assert.equal(p.next.familyId,FAMILIES[i]);assert.equal(p.next.variantId,'A');
  A.recordAttempt(s,p.next,p.next.options.find(o=>o.correct),{at:at(t+2000+i*2200)});
  p=H.projection(A,questions,s,t+3000+i*2200);
  assert.equal(p.next.variantId,'B');
  A.recordAttempt(s,p.next,p.next.options.find(o=>o.correct),{at:at(t+3000+i*2200)});
 }
 assert.equal(gate(snapshot(s)).ok,true);
 assert.equal(H.projection(A,questions,s,t+20000).next,null);
 p=H.projection(A,questions,s,t+20000+A.DAY_MS+1);
 assert.equal(p.next.familyId,FAMILIES[0]);assert.equal(p.next.assessmentRole,'retention');assert.equal(p.next.variantId,'D');
 A.recordAttempt(s,p.next,p.next.options.find(o=>o.correct),{at:at(t+20000+A.DAY_MS+1)});
 p=H.projection(A,questions,s,t+20000+A.DAY_MS+2);
 assert.equal(p.rows[0].metrics.retentionStage,1);
 assert.equal(Date.parse(p.rows[0].metrics.nextReviewAt),t+20000+A.DAY_MS+1+7*A.DAY_MS);
 assert.equal(gate(snapshot(s)).ok,true);
});
test('source-generated dynamic Tn is verified; spoofed role, seed and answer cannot acquire credit',()=>{
 const s=E.emptyState(),id=FAMILIES[0],t=Date.now()-220000,grp=questions.filter(q=>q.familyId===id);
 for(const [i,variant] of ['A','B','C'].entries()){
  const q=find(id,variant),bad=q.options.find(o=>!o.correct);
  A.recordAttempt(s,q,bad,{at:at(t+i*1000)});
 }
 const q=A.nextQuestion(grp,s.questions[id],t+3500);
 assert.equal(q.variantId,'T1');assert.equal(q.transferDepth,4);
 A.recordAttempt(s,q,q.options.find(o=>o.correct),{at:at(t+4000)});
 assert.equal(gate(snapshot(s)).ok,true);
 const entry=s.questions[id].history.at(-1);
 entry.correct=false;assert.equal(gate(snapshot(s)).ok,false,'outcome tampering');entry.correct=true;
 entry.seed++;assert.equal(gate(snapshot(s)).ok,false,'source seed tampering');entry.seed--;
 entry.assessmentRole='retention';assert.equal(gate(snapshot(s)).ok,false,'role-swapped transfer');
});
test('V5 Web Lock rechecks preflight before source load and never accepts a stale snapshot',async()=>{
 const baseline=JSON.stringify(E.emptyState()),future=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},preserve:'foreign'}),memory={[KEY]:baseline};
 let loads=0;const owner={load(){loads++;return E.emptyState();}};
 const win={navigator:{locks:{request:async(key,options,fn)=>{assert.equal(key,KEY);memory[KEY]=future;return fn();}}},CircuitPowerFirmwareAssessment:FW};
 await assert.rejects(H.checkedLoad(win,store(memory),A,Q,owner,baseline),/V5 changed/);
 assert.equal(loads,0);assert.equal(memory[KEY],future);
 const s=E.emptyState();
 assert.equal(H.snapshotMatches(JSON.stringify(s),s),true);
 assert.equal(H.startupConsistent(null,s,JSON.stringify({...s,events:[{type:'external'}]})),false);
});
test('source firmware transfer physics, safety priority and independent numerical references',()=>{
 const sync=find('power-sync-deadline','B'),ps=sync.parameters;
 const period=1e6/ps.fsw,margin=period-(period*ps.samplePct/100+ps.lat);
 assert.ok(Math.abs(Number.parseFloat(sync.options.find(o=>o.correct).text)-margin)<0.051);
 const protect=find('protection-trip-latency','B'),correct=protect.options.find(o=>o.correct);
 assert.match(correct.text,/×$/);assert.match(protect.prompt,/software protection path/);
 const cap=find('capstone-signal-chain','B'),pc=cap.parameters;
 assert.ok(Math.abs(Number.parseFloat(cap.options.find(o=>o.correct).text)-(pc.periodUs-pc.sense-pc.control-pc.commit))<0.051);
 assert.match(find('protection-trip-latency','A').options.find(o=>o.correct).text,/Trip/);
});
console.log('PASS 6b-5 Power Firmware: source, 3x8 variants, V5, dynamic Tn, physics, Web Lock negative control');
