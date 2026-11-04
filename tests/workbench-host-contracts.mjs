import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function fixture(){
 const status={textContent:''},main={inert:false},button={addEventListener(){}};
 const events={},nav=[],storage=new Map();
 const document={documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:id==='ee-return'?button:null,querySelector:()=>main};
 const ctx={document,URL,console,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},location:{href:'https://example.test/-EEHandouts/workbench/index.html?from=untrusted',assign:u=>nav.push(u)},CircuitEvidence:{flush:async()=>({saved:true})}};ctx.window=ctx;ctx.addEventListener=(n,fn)=>events[n]=fn;vm.createContext(ctx);vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),ctx);
 return {ctx,host:ctx.EEWorkbenchHost,status,main,events,nav,storage};
}
let f=fixture();f.host.markReady();assert.equal(await f.host.leave(),true);assert.equal(f.nav[0],'https://example.test/-EEHandouts/middle.html#lesson/mid-basics/mid-buck-pwm');
for(const target of ['https://attacker.invalid','javascript:alert(1)','//attacker.invalid','../middle.html#evil','../index.html?redirect=evil']){f=fixture();assert.equal(await f.host.leave(target),false);assert.equal(f.nav.length,0);}
for(const reason of ['pending','conflict','concurrency-lock-unavailable','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave(),false);assert.equal(f.nav.length,0);assert.match(f.status.textContent,/取消離開/);}
f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>{throw Error('failure');};assert.equal(await f.host.leave(),false);assert.equal(f.nav.length,0);
f=fixture();f.host.fail('載入失敗');assert.equal(f.host.markReady(),false);assert.equal(f.main.inert,true);assert.equal(f.ctx.document.documentElement.dataset.eeWorkbenchState,'failed');
f=fixture();f.host.markReady();f.events.error({target:{tagName:'SCRIPT',src:'https://example.test/-EEHandouts/workbench/assets/learning/curriculum.js'}});assert.equal(f.main.inert,false,'optional source panel failure must not disable a running experiment or its retry');assert.equal(f.ctx.document.documentElement.dataset.eeWorkbenchState,'ready');assert.match(f.status.textContent,/來源面板/);
f=fixture();f.events.error({target:{tagName:'SCRIPT',src:'https://example.test/-EEHandouts/workbench/assets/engineering-sandbox-core.js'}});assert.equal(f.main.inert,true,'required boot asset failure must still fail closed');
assert.equal(f.host.referenceHref('map.html'),'records.html');assert.equal(f.host.referenceHref('19_c2000_buck_firmware_lab/index.html'),'coverage.html');
// A foreign newer top-level version must stop BEFORE the original owner's normalizing read.
f=fixture();f.host.markReady();const future=JSON.stringify({schema:'circuit-learning-state',version:999,evidence:{preserve:true}});f.storage.set('circuit-learning-state-v5',future);let stopped=false;f.events.storage?.({key:'circuit-learning-state-v5',stopImmediatePropagation(){stopped=true;}});assert.equal(f.main.inert,true,'runtime newer evidence must suspend the workbench');assert.equal(stopped,true);assert.equal(f.ctx.document.documentElement.dataset.eeWorkbenchState,'protected');let flushCalls=0;f.ctx.CircuitEvidence.flush=async()=>{flushCalls++;return {saved:true};};assert.equal(await f.host.leave(),false);assert.equal(flushCalls,0);assert.equal(f.storage.get('circuit-learning-state-v5'),future);
f=fixture();f.host.markReady();f.storage.set('circuit-learning-state-v5','{invalid');let prevented=false;f.events.click?.({target:{closest:()=>null},preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert.equal(prevented,true,'check raw evidence even before a storage event is delivered');assert.equal(f.main.inert,true);
const src=readFileSync('workbench/assets/learning/learning-evidence.js','utf8');assert.ok(src.includes('circuit-learning-state-v5'));
const record=readFileSync('workbench/ee-records.js','utf8');assert.ok(!/localStorage\.(setItem|removeItem|clear)\(/.test(record),'backup page must not mutate evidence');
const pkg=JSON.parse(readFileSync('package.json'));for(const key of ['test:browser','test:cross-browser'])assert.ok(pkg.scripts[key].includes('tests/buck-workbench-smoke.mjs'));
console.log('PASS host: allowlisted local return, fail-closed flush, source failure, read-only backup and CI wiring');
// Integration-level source owner: a newer raw record cannot advance the legacy
// normalizer's observed baseline. This uses the actual imported Evidence code.
{
 const data=new Map(),listeners=new Map(),status={textContent:''},main={inert:false};let queue=Promise.resolve(),ownerReads=0;
 const ctx={URL,console,document:{body:null,documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:null,querySelector:()=>main},location:{href:'https://example.test/workbench/index.html',assign:()=>{throw Error('must not navigate');}},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},navigator:{locks:{request(name,options,fn){const p=queue.then(fn);queue=p.catch(()=>{});return p;}}},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}}};
 ctx.window=ctx;ctx.addEventListener=(type,fn)=>{const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);};ctx.dispatchEvent=ev=>{let stopped=false;ev.stopImmediatePropagation=()=>{stopped=true;};ev.preventDefault=()=>{};for(const fn of listeners.get(ev.type)||[]){fn(ev);if(stopped)break;}};
 vm.createContext(ctx);vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),ctx);vm.runInContext(src,ctx);
 const E=ctx.CircuitEvidence;E.save(E.load());await E.flush();ctx.EEWorkbenchHost.markReady();
 ctx.addEventListener('storage',()=>{ownerReads++;E.recordEvidence('should-not-be-written',1,'test');});
 const futureRaw=JSON.stringify({schema:'circuit-learning-state',version:6,evidence:{preserved:true}});data.set(E.KEY,futureRaw);ctx.dispatchEvent({type:'storage',key:E.KEY});await E.flush();
 assert.equal(ownerReads,0);assert.equal(data.get(E.KEY),futureRaw);assert.equal(data.has(E.KEY+'-corrupt-backup'),false);assert.equal(main.inert,true);
 const backup={target:'',rel:''};let prevented=false,stopped=false;listeners.get('click')[0]({target:{closest:()=>backup},preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});assert.equal(stopped,true);assert.equal(prevented,false);assert.equal(backup.target,'_blank');
 console.log('PASS actual Evidence owner: unsupported cross-tab version preserved byte-for-byte before normalization');
}
