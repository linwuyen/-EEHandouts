import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const lessons=JSON.parse(readFileSync('tests/fixtures/opamp-course-source.json'));
const routes=[['12_opamp_slew_rate/index.html','opamp-course.html'],['12_opamp_slew_rate/lab_diagnose.html','opamp-diagnosis.html'],...lessons.map(x=>[x.sourcePath,x.sourcePath])];
function fixture(){
 const nav=[],data=new Map(),main={inert:false},status={textContent:''};
 const c={URL,console,document:{documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:null,querySelector:()=>main},location:{href:'https://example.test/-EEHandouts/workbench/index.html#experiment-energy',assign:u=>nav.push(u)},localStorage:{getItem:k=>data.get(k)??null},CircuitEvidence:{flush:async()=>({saved:true})}};
 c.window=c;c.addEventListener=()=>{};vm.createContext(c);vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),c);return{c,host:c.EEWorkbenchHost,nav,data};
}
for(const [source,dest] of routes){
 let f=fixture();assert.equal(f.host.referenceHref(source),dest,'exact source mapping '+source);f.host.markReady();assert.equal(await f.host.leave(dest),true);assert.equal(f.nav[0],new URL(dest,f.c.location.href).href);
 for(const reason of ['pending','quota','conflict']){f=fixture();f.host.markReady();f.c.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave(dest),false);assert.equal(f.nav.length,0);}
 f=fixture();f.host.markReady();let calls=0;const raw='{"schema":"circuit-learning-state","version":999,"keep":true}';f.data.set('circuit-learning-state-v5',raw);f.c.CircuitEvidence.flush=async()=>{calls++;return{saved:true};};assert.equal(await f.host.leave(dest),false);assert.equal(calls,0);assert.equal(f.data.get('circuit-learning-state-v5'),raw);
 f=fixture();f.host.markReady();f.c.CircuitEvidence.flush=async()=>{f.data.set('circuit-learning-state-v5',raw);return{saved:true};};assert.equal(await f.host.leave(dest),false,'version change during flush');assert.equal(f.nav.length,0);
 f=fixture();f.host.markReady();let release;f.c.CircuitEvidence.flush=()=>new Promise(r=>{release=r;});const pending=f.host.leave(dest);assert.equal(f.nav.length,0);release({saved:true});assert.equal(await pending,true);
}
let f=fixture();
for(const src of ['12_opamp_slew_rate/01_slew_rate.html?done=true','12_opamp_slew_rate/01_slew_rate.html#grade','12_opamp_slew_rate/unknown.html'])assert.equal(f.host.referenceHref(src),'coverage.html','unported path '+src);
for(const dest of ['opamp-course.html?from=https://evil.invalid','12_opamp_slew_rate/lab_diagnose.html?grade=A','https://evil.invalid/01_slew_rate.html','//evil.invalid/opamp-course.html','12_opamp_slew_rate/01_slew_rate.html?done=true'])assert.equal(await f.host.leave(dest),false,'not allowlisted '+dest);
f=fixture();assert.equal(f.host.referenceHref('12_opamp_slew_rate/reasoning_trainer.html'),'opamp-dc-trainer.html');
assert.equal(f.host.referenceHref('quiz.html?module=opamp'),'opamp-assessment.html');
for(const bad of ['quiz.html?module=opamp#passed','quiz.html?module=opamp&score=100','12_opamp_slew_rate/reasoning_trainer.html?x=1','12_opamp_slew_rate/reasoning_trainer.html#grade'])assert.equal(f.host.referenceHref(bad),'coverage.html');
console.log('PASS OP course host: 8 exact routes, pending/quota/conflict/future versions, async flush and unknown/query destinations');
