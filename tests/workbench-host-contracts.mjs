import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function fixture(){
 const status={textContent:''},main={inert:false},button={addEventListener(){}};
 const events={},nav=[];
 const document={documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:id==='ee-return'?button:null,querySelector:()=>main};
 const ctx={document,URL,console,location:{href:'https://example.test/-EEHandouts/workbench/index.html?from=untrusted',assign:u=>nav.push(u)},CircuitEvidence:{flush:async()=>({saved:true})}};ctx.window=ctx;ctx.addEventListener=(n,fn)=>events[n]=fn;vm.createContext(ctx);vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),ctx);
 return {ctx,host:ctx.EEWorkbenchHost,status,main,events,nav};
}
let f=fixture();f.host.markReady();assert.equal(await f.host.leave(),true);assert.equal(f.nav[0],'https://example.test/-EEHandouts/middle.html#lesson/mid-basics/mid-buck-pwm');
for(const target of ['https://attacker.invalid','javascript:alert(1)','//attacker.invalid','../middle.html#evil','../index.html?redirect=evil']){f=fixture();assert.equal(await f.host.leave(target),false);assert.equal(f.nav.length,0);}
for(const reason of ['pending','conflict','concurrency-lock-unavailable','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave(),false);assert.equal(f.nav.length,0);assert.match(f.status.textContent,/取消離開/);}
f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>{throw Error('failure');};assert.equal(await f.host.leave(),false);assert.equal(f.nav.length,0);
f=fixture();f.host.fail('載入失敗');assert.equal(f.host.markReady(),false);assert.equal(f.main.inert,true);assert.equal(f.ctx.document.documentElement.dataset.eeWorkbenchState,'failed');
assert.equal(f.host.referenceHref('map.html'),'records.html');assert.equal(f.host.referenceHref('19_c2000_buck_firmware_lab/index.html'),'coverage.html');
const src=readFileSync('workbench/assets/learning/learning-evidence.js','utf8');assert.ok(src.includes('circuit-learning-state-v5'));
const record=readFileSync('workbench/ee-records.js','utf8');assert.ok(!/localStorage\.(setItem|removeItem|clear)\(/.test(record),'backup page must not mutate evidence');
const pkg=JSON.parse(readFileSync('package.json'));for(const key of ['test:browser','test:cross-browser'])assert.ok(pkg.scripts[key].includes('tests/buck-workbench-smoke.mjs'));
console.log('PASS host: allowlisted local return, fail-closed flush, source failure, read-only backup and CI wiring');
