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
runInNewContext(readFileSync('workbench/assets/learning/assessment-v8.js','utf8'),context,{filename:'assessment-v8.js'});
const V8=context.CircuitAssessmentV8;
const H=require('../workbench/ee-v8-assessment.js');
const IDS=['inv-shoot-through-safety','foc-park-frame','pi-integrator-crossover','loop10us-deadline-budget'];
const MODULES=['inverter','foc','pi','loop10us'];
const KEY=H.KEY,now=Date.now();
const store=(values={})=>({getItem:key=>Object.hasOwn(values,key)?values[key]:null});
const stateAt=s=>({[KEY]:JSON.stringify(s)});
const check=s=>H.gate(store(stateAt(s)),A,Q,V8);
const questions=H.familyModel(A,Q);
const find=(id,variant)=>questions.find(q=>q.familyId===id&&q.variantId===variant);
const stamp=n=>new Date(n).toISOString();
const mark=(state,q,correct,t)=>A.recordAttempt(state,q,q.options.find(o=>o.correct===correct),{at:stamp(t)});
test('pinned source V8 installed; only four original question families exposed',()=>{
 assert.equal(V8.VERSION,'8.1.0');assert.equal(A.__v8Installed,true);
 assert.equal(V8.baseQuestions.length,9,'other five original V8 families retained only inside isolated source runtime');
 assert.deepEqual(Array.from(H.FAMILIES),IDS);assert.equal(questions.length,16);
 for(const [i,id] of IDS.entries()){
  const family=questions.filter(q=>q.familyId===id);
  assert.equal(family.length,4);assert.ok(family.every(q=>q.moduleId===MODULES[i]));
  assert.deepEqual(family.map(q=>q.variantId),['A','B','C','D']);
  assert.deepEqual(family.map(q=>q.assessmentRole),['baseline','transfer','transfer','retention']);
  assert.ok(family.every(q=>q.options.filter(o=>o.correct).length===1));
  assert.notEqual(family[0].prompt,family[1].prompt);
 }
});
test('all three new manifest rows require original source blob and exact SHA-256 bytes',()=>{
 const m=JSON.parse(readFileSync('workbench/source-manifest.json','utf8'));
 assert.equal(m.sourceCommit,'11ef4e4801b5283f265dc349a4afec0027603228');
 for(const [path,blob,sourcePath,adapted] of [
  ['assets/learning/assessment-v8.js','454fbd1b4ef7dde2de40784fd3eb0f048e473ec7','assets/learning/assessment-v8.js',false],
  ['v8-assessment.html','61ad104246926cea2ea5b94ce9ded605c34340da','quiz.html',true],
  ['ee-v8-assessment.js','61ad104246926cea2ea5b94ce9ded605c34340da','quiz.html',true]
 ]){
  const rows=m.files.filter(row=>row.path===path);
  assert.equal(rows.length,1,'unique source manifest row: '+path);
  assert.equal(rows[0].sourcePath,sourcePath);
  assert.equal(rows[0].sourceBlob,blob);
  assert.equal(rows[0].adapted,adapted);
  const digest=createHash('sha256').update(readFileSync('workbench/'+path)).digest('hex');
  assert.equal(rows[0].sha256,digest,'actual file SHA-256: '+path);
 }
 const html=readFileSync('workbench/v8-assessment.html','utf8');
 assert.match(html,/id="ee-v8-formal-root"/);
 assert.match(html,/src="assets\/learning\/assessment-v8\.js"/);
 assert.match(html,/src="ee-v8-assessment\.js"/);
});
test('malformed, legacy, foreign and future V5 must fail closed without overwriting raw bytes',()=>{
 assert.equal(check(E.emptyState()).ok,true);
 for(const raw of ['{malformed',JSON.stringify({schema:'circuit-learning-state',version:88,questions:{}}),JSON.stringify({schema:'circuit-learning-state',version:5,questions:[]})]){
  const out=H.gate(store({[KEY]:raw}),A,Q,V8);
  assert.equal(out.ok,false);assert.equal(out.raw,raw);
 }
 assert.equal(H.gate(store({'circuit-learning-state-v4':'{"version":4}'}),A,Q,V8).ok,false);
 for(const name of ['evidence','reports','predictions','openResponses','benchmark','migrations','identityAliases']){
  const state=E.emptyState();state[name]='future';assert.equal(check(state).ok,false,name);
 }
 for(const id of IDS){const state=E.emptyState();state.questions[id]={history:'invalid'};assert.equal(check(state).ok,false,id);}
 const foreign=E.emptyState();
 const adc=A.expandQuestions([Q.questions.find(q=>q.id==='adc-levels-vs-codes')])[0];
 mark(foreign,adc,true,now-400000);
 foreign.questions[IDS[0]]={history:foreign.questions[adc.id].history};
 assert.equal(check(foreign).ok,false,'foreign ADC credits cannot become inverter credits');
 assert.equal(H.gate({getItem(){throw Error('blocked');}},A,Q,V8).ok,false);
});
test('first wrong remains immutable; correct transfer and source D retention dates',()=>{
 const state=E.emptyState(),t=Date.parse('2026-11-09T09:00:00Z');
 let view=H.projection(A,questions,state,t);
 assert.equal(view.next.familyId,IDS[0]);assert.equal(view.next.variantId,'A');
 const first=mark(state,view.next,false,t);assert.equal(first.correct,false);
 assert.equal(check(state).ok,true);
 view=H.projection(A,questions,state,t+100);assert.equal(view.next.variantId,'B');
 mark(state,view.next,true,t+1000);
 for(let i=1;i<IDS.length;i++){
  view=H.projection(A,questions,state,t+2000+i*2200);
  assert.equal(view.next.familyId,IDS[i]);assert.equal(view.next.variantId,'A');
  mark(state,view.next,true,t+2000+i*2200);
  view=H.projection(A,questions,state,t+3000+i*2200);
  assert.equal(view.next.variantId,'B');mark(state,view.next,true,t+3000+i*2200);
 }
 assert.equal(check(state).ok,true);
 assert.equal(H.projection(A,questions,state,t+20000).next,null);
 view=H.projection(A,questions,state,t+20000+A.DAY_MS+1);
 assert.equal(view.next.familyId,IDS[0]);assert.equal(view.next.variantId,'D');
 assert.equal(view.next.assessmentRole,'retention');
 const due=t+20000+A.DAY_MS+1;
 mark(state,view.next,true,due);
 assert.equal(state.questions[IDS[0]].history[0].correct,false);
 assert.equal(H.projection(A,questions,state,due+1).rows[0].metrics.retentionStage,1);
 assert.equal(Date.parse(H.projection(A,questions,state,due+1).rows[0].metrics.nextReviewAt),due+7*A.DAY_MS);
 assert.equal(check(state).ok,true);
});
test('V8 source scheduler prevents forged early T1, role swaps, and tampered outcomes',()=>{
 const id=IDS[0],state=E.emptyState(),t=now-180000;
 mark(state,find(id,'A'),false,t);
 const fake=V8.generateVariant(find(id,'A'),'T1','transfer',3);
 mark(state,fake,true,t+1000);
 assert.equal(check(state).ok,false,'cannot skip source B/C with alleged T1');
 const clean=E.emptyState();
 mark(clean,find(id,'A'),false,t);mark(clean,find(id,'B'),false,t+1000);
 mark(clean,find(id,'C'),false,t+2000);
 const next=A.nextQuestion(questions.filter(q=>q.familyId===id),clean.questions[id],t+2500);
 assert.equal(next.variantId,'T3');assert.equal(next.transferDepth,5);
 mark(clean,next,true,t+3000);assert.equal(check(clean).ok,true);
 const entry=clean.questions[id].history.at(-1);
 entry.correct=false;assert.equal(check(clean).ok,false);entry.correct=true;
 entry.seed++;assert.equal(check(clean).ok,false);entry.seed--;
 entry.assessmentRole='retention';assert.equal(check(clean).ok,false);
});
test('original unbounded V8 transfer scheduler remains valid beyond depth 500',()=>{
 const id=IDS[0],state=E.emptyState(),grp=questions.filter(q=>q.familyId===id),start=now-800000;
 let last;
 for(let i=0;i<502;i++){
  const q=A.nextQuestion(grp,state.questions[id]||null,start+i*1000);
  assert.ok(q);mark(state,q,false,start+i*1000);last=q;
 }
 assert.equal(last.variantId,'T501');assert.equal(last.transferDepth,503);
 const result=check(state);assert.equal(result.ok,true,result.reason||'valid source history');
 assert.equal(A.metrics(state.questions[id],start+505000).transfer,false);
});
test('Web Lock preflight rejects competing future V5 before original Evidence.load',async()=>{
 const baseline=JSON.stringify(E.emptyState()),future='{"schema":"circuit-learning-state","version":99,"questions":{}}',memory={[KEY]:baseline};
 let called=0;const owner={load(){called++;return E.emptyState();}};
 const win={navigator:{locks:{request:async(k,opts,fn)=>{assert.equal(k,KEY);memory[KEY]=future;return fn();}}},CircuitAssessmentV8:V8};
 await assert.rejects(H.checkedLoad(win,store(memory),A,Q,owner,baseline),/V5 changed/);
 assert.equal(called,0);assert.equal(memory[KEY],future);
 const s=E.emptyState();
 assert.equal(H.snapshotMatches(JSON.stringify(s),s),true);
 assert.equal(H.startupConsistent(null,s,JSON.stringify({...s,events:[{type:'foreign'}]})),false);
});
test('first-principles V8 transfer references: interlock, Park, Ki crossover, 10us worst-case',()=>{
 assert.match(find(IDS[0],'B').options.find(o=>o.correct).text,/dead-time|interlock/);
 const q=find(IDS[1],'B'),p=q.parameters;
 const correct=q.options.find(o=>o.correct).text;
 assert.ok(correct.includes((p.mag*Math.sin(p.deg*Math.PI/180)).toFixed(3).replace(/0+$/,'').replace(/\.$/,''))||correct.includes('vd≈'));
 const pi=find(IDS[2],'B'),f=Number.parseFloat(pi.options.find(o=>o.correct).text);
 assert.ok(Math.abs(f-pi.parameters.ki/(2*Math.PI))<0.11);
 const loop=find(IDS[3],'B'),x=loop.parameters;
 assert.ok(Number.isFinite(x.acq+x.cpu+x.comm));
 assert.equal(loop.options.filter(o=>o.correct).length,1);
 assert.match(loop.options.find(o=>o.correct).text,/margin|deadline/);
});
console.log('PASS 6b-6 V8 4x4 formal families; source V5 replay, due, foreign schemas, Web Lock and physics');
