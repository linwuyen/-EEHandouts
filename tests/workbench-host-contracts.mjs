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
// Slice 4a: source calculator is a local read-only destination, not a bypass around flush.
for(const source of ['index.html','0_index.html']){f=fixture();assert.equal(f.host.referenceHref('1_c2000_adc_calculator/'+source),'adc-course.html#lesson-0');}
for(const source of ['6_full_calculator.html','c2000_adc_calculator.html']){f=fixture();assert.equal(f.host.referenceHref('1_c2000_adc_calculator/'+source),'adc.html');}
for(const source of ['../evil','c2000_adc_calculator.html?from=evil','1_adc_basics.html?done=true','4_voltage_divider.html#passed','unknown.html']){f=fixture();assert.equal(f.host.referenceHref('1_c2000_adc_calculator/'+source),'coverage.html');}
f=fixture();assert.equal(f.host.referenceHref('1_c2000_adc_calculator/1_adc_basics.html'),'adc-course.html#lesson-1');
f=fixture();f.host.markReady();assert.equal(await f.host.leave('adc.html'),true);assert.equal(f.nav[0],'https://example.test/-EEHandouts/workbench/adc.html');
for(const reason of ['pending','conflict','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave('adc.html'),false);assert.equal(f.nav.length,0);}
f=fixture();f.host.markReady();let release;f.ctx.CircuitEvidence.flush=()=>new Promise(resolve=>release=resolve);const adcPending=f.host.leave('adc.html');assert.equal(f.nav.length,0);assert.equal(await f.host.leave('adc.html'),false);release({saved:true});assert.equal(await adcPending,true);assert.equal(f.nav.length,1);
f=fixture();f.host.markReady();f.host.setNavigationGuard(()=>false);assert.equal(await f.host.leave('adc.html'),false);assert.equal(f.nav.length,0);
for(const target of ['adc.html?from=https://attacker.invalid','adc.html#untrusted']){f=fixture();assert.equal(await f.host.leave(target),false);}
f=fixture();assert.equal(f.host.referenceHref('quiz.html?module=adc'),'adc-assessment.html');
f=fixture();assert.equal(f.host.referenceHref('quiz.html?module=spi'),'spi-assessment.html');
f=fixture();assert.equal(f.host.referenceHref('quiz.html?module=buck'),'buck-assessment.html');
for(const src of ['quiz.html?module=buck#passed','quiz.html?module=buck&score=100','quiz.html?module=bucks']){f=fixture();assert.equal(f.host.referenceHref(src),'coverage.html');}
for(const dest of ['buck-assessment.html?grade=pass','buck-assessment.html#passed']){f=fixture();assert.equal(await f.host.leave(dest),false);}
for(const reason of ['pending','conflict','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave('buck-assessment.html'),false);assert.equal(f.nav.length,0);}
f=fixture();f.host.markReady();assert.equal(await f.host.leave('buck-assessment.html'),true);assert.match(f.nav[0],/buck-assessment\.html$/);

for(const src of ['quiz.html?module=spi#passed','quiz.html?module=spi&score=100','quiz.html?module=spix']){f=fixture();assert.equal(f.host.referenceHref(src),'coverage.html');}
for(const dest of ['spi-assessment.html?grade=pass','spi-assessment.html#passed']){f=fixture();assert.equal(await f.host.leave(dest),false);}
for(const reason of ['pending','conflict','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave('spi-assessment.html'),false);assert.equal(f.nav.length,0);}
f=fixture();f.host.markReady();assert.equal(await f.host.leave('spi-assessment.html'),true);assert.match(f.nav[0],/spi-assessment\.html$/);
for(const dest of ['adc-assessment.html?grade=pass','adc-assessment.html#passed']){f=fixture();assert.equal(await f.host.leave(dest),false);}
for(const reason of ['pending','conflict','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave('adc-assessment.html'),false);assert.equal(f.nav.length,0);}
console.log('PASS ADC reference allowlist, deferred legacy pages, existing save/record guard, pending and duplicate navigation');
// Slice 4b: only the two migrated OP labs are new destinations. AFE is power control, not an ADC lesson.
for(const [source,target]of [['12_opamp_slew_rate/lab_step.html','opamp-step.html'],['12_opamp_slew_rate/lab_sine.html','opamp-sine.html'],['12_opamp_slew_rate/lab_diagnose.html','opamp-diagnosis.html']]){
 f=fixture();assert.equal(f.host.referenceHref(source),target);f.host.markReady();assert.equal(await f.host.leave(target),true);
 for(const reason of ['pending','conflict','quota']){f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.host.leave(target),false);assert.equal(f.nav.length,0);}
 f=fixture();f.host.markReady();f.host.setNavigationGuard(()=>false);assert.equal(await f.host.leave(target),false);assert.equal(f.nav.length,0);
 f=fixture();f.host.markReady();let release;f.ctx.CircuitEvidence.flush=()=>new Promise(resolve=>release=resolve);const pending=f.host.leave(target);assert.equal(f.nav.length,0);f.storage.set('circuit-learning-state-v5',future);release({saved:true});assert.equal(await pending,false);assert.equal(f.nav.length,0);
}
f=fixture();assert.equal(f.host.referenceHref('12_opamp_slew_rate/index.html'),'opamp-course.html');
for(const source of ['12_opamp_slew_rate/lab_diagnose.html?formal=true','12_opamp_slew_rate/lab_step.html?from=evil','12_opamp_slew_rate/../evil','9.afe-tutorial/afe.html']){f=fixture();assert.equal(f.host.referenceHref(source),'coverage.html');}
for(const target of ['opamp-step.html?from=evil','opamp-sine.html#unexpected']){f=fixture();assert.equal(await f.host.leave(target),false);}
console.log('PASS OP exact routes, unported AFE/OP coverage, pending-save/conflict/quota/future-schema guards and no arbitrary destinations');

// 6b-4: exact power-topology-control source quiz route, guarded navigation.
f=fixture();assert.equal(f.host.referenceHref('quiz.html?module=power-topology-control'),'topology-assessment.html');
for(const source of ['quiz.html?module=power-topology-control#passed','quiz.html?module=power-topology-control&score=100','quiz.html?module=power-topology-control-extra']){
 f=fixture();assert.equal(f.host.referenceHref(source),'coverage.html');
}
for(const destination of ['topology-assessment.html?grade=pass','topology-assessment.html#passed']){
 f=fixture();assert.equal(await f.host.leave(destination),false);assert.equal(f.nav.length,0);
}
for(const reason of ['pending','conflict','quota']){
 f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});
 assert.equal(await f.host.leave('topology-assessment.html'),false);assert.equal(f.nav.length,0);
}
f=fixture();f.host.markReady();assert.equal(await f.host.leave('topology-assessment.html'),true);
assert.match(f.nav[0],/topology-assessment\.html$/);
console.log('PASS 6b-4 topology quiz exact allowlist, hostile suffix denial, blocked stale Evidence navigation');

// 6b-5: source power-firmware formal routes are exact, and source V5 must flush before leaving.
for(const module of ['power-sync','protection','power-capstone']){
 f=fixture();assert.equal(f.host.referenceHref('quiz.html?module='+module),'power-firmware-assessment.html');
 for(const suffix of ['#passed','&score=100']){
  f=fixture();assert.equal(f.host.referenceHref('quiz.html?module='+module+suffix),'coverage.html');
 }
}
for(const path of ['power-firmware-assessment.html#passed','power-firmware-assessment.html?grade=pass']){
 f=fixture();assert.equal(await f.host.leave(path),false);assert.equal(f.nav.length,0);
}
for(const reason of ['pending','conflict','quota']){
 f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});
 assert.equal(await f.host.leave('power-firmware-assessment.html'),false);assert.equal(f.nav.length,0);
}
f=fixture();f.host.markReady();assert.equal(await f.host.leave('power-firmware-assessment.html'),true);
assert.match(f.nav[0],/power-firmware-assessment\.html$/);
console.log('PASS 6b-5 firmware exact allowlist and guarded V5 navigation');

// Source route disclosure must describe a FORMAL V5 write, not an OP concept lesson.
for(const module of ['power-sync','protection','power-capstone']){
 const s=fixture();
 const nodes={
  'workspace-reference':{hidden:true,scrollIntoView(){}},
  'reference-frame':{hidden:false,removeAttribute(){}},
  'reference-title':{textContent:''},
  'reference-links':{children:[],replaceChildren(){this.children=[];},append(x){this.children.push(x);}}
 };
 s.ctx.document.getElementById=id=>nodes[id]||null;
 s.ctx.document.createElement=tag=>({tag,textContent:'',type:null});
 s.host.reference('quiz.html?module='+module,'Formal '+module);
 assert.equal(nodes['workspace-reference'].hidden,false);
 assert.equal(nodes['reference-links'].children.length,2);
 const [text,button]=nodes['reference-links'].children;
 assert.match(text.textContent,/三題族.*V5 Evidence/,'explicit formal V5 disclosure');
 assert.doesNotMatch(text.textContent,/六課觀念/,'must not suggest no official grade');
 assert.equal(button.textContent,'保存後開啟電源韌體正式題目');
}
console.log('PASS 6b-5 actual formal V5 reference text and button labels');

// 6b-6: V8 exact source route allowlist and honest V5 disclosure, no arbitrary suffixes.
const focusedModules = ['bms','ad5543','c2000-dds','afe','acmc-pro'];
const legacyModules = ['inverter','foc','pi','loop10us'];
for(const module of [...legacyModules, ...focusedModules]){
 const destination = focusedModules.includes(module) ? 'v8-assessment.html?module=' + module : 'v8-assessment.html';
 f=fixture();assert.equal(f.host.referenceHref('quiz.html?module='+module),destination);
 f.host.markReady();assert.equal(await f.host.leave(destination),true);assert.equal(new URL(f.nav[0]).search,new URL(destination,'https://example.test/').search);
 for(const suffix of ['#passed','&score=100']){f=fixture();assert.equal(f.host.referenceHref('quiz.html?module='+module+suffix),'coverage.html');}
}
for(const path of ['v8-assessment.html#passed','v8-assessment.html?grade=pass']){
 f=fixture();assert.equal(await f.host.leave(path),false);assert.equal(f.nav.length,0);
}
for(const reason of ['pending','conflict','quota']){
 f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});
 assert.equal(await f.host.leave('v8-assessment.html'),false);assert.equal(f.nav.length,0);
}
f=fixture();f.host.markReady();assert.equal(await f.host.leave('v8-assessment.html'),true);assert.match(f.nav[0],/v8-assessment\.html$/);
for(const module of [...legacyModules, ...focusedModules]){
 const f=fixture(),nodes={
  'workspace-reference':{hidden:true,scrollIntoView(){}},
  'reference-frame':{hidden:false,removeAttribute(){}},
  'reference-title':{textContent:''},
  'reference-links':{children:[],replaceChildren(){this.children=[];},append(x){this.children.push(x);}}
 };
 f.ctx.document.getElementById=id=>nodes[id]||null;
 f.ctx.document.createElement=tag=>({tag,textContent:'',type:null});
 f.host.reference('quiz.html?module='+module,'Formal '+module);
 const [text,button]=nodes['reference-links'].children;
 assert.match(text.textContent,/V5 Evidence/);assert.doesNotMatch(text.textContent,/六課觀念/);
 assert.match(button.textContent,/保存.*V8.*正式/);
}

for (const module of focusedModules) {
 const target = 'v8-assessment.html?module=' + module;
 for (const suffix of ['#passed', '&score=100', '&module=' + module]) {
  f=fixture();assert.equal(await f.host.leave(target + suffix),false);assert.equal(f.nav.length,0);
 }
 for (const reason of ['pending', 'conflict', 'quota']) {
  f=fixture();f.host.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});
  assert.equal(await f.host.leave(target),false);assert.equal(f.nav.length,0);
 }
}
console.log('PASS V8 exact routes, hostile suffix rejection and formal V5 disclosures');
