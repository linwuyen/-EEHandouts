/* Integration contracts: existing physics/evidence owners, local routes, safe persistence. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
assert.ok(existsSync('workbench/topology.html'),'Buck/Boost comparison must be owned by EEHandouts');
const manifest=JSON.parse(readFileSync('workbench/source-manifest.json'));
for(const path of ['assets/learning/workspace-core.js','assets/learning/topology-transfer-v1.js','assets/learning/model-registry.js','assets/learning/engineering-curriculum.js','assets/learning/learning-evidence.js','assets/learning/core-flow-v1.js']){
 const f=manifest.files.find(x=>x.path===path),b=readFileSync('workbench/'+path);
 assert.equal(f?.adapted,false,'unchanged owner '+path);
 assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),f.sourceBlob);
}
const ui=manifest.files.find(x=>x.path==='assets/learning/workspace-topology-ui.js');
assert.equal(ui?.sourceBlob,'c2095128f2e540c61084c056e5edd74b58c344d8');
assert.equal(ui?.adapted,true,'UI adapts navigation and guards, not solver');
const html=readFileSync('workbench/topology.html','utf8');
for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const u=m[1];if(u.startsWith('#'))continue;
 assert.ok(!/^(?:https?:)?\/\//i.test(u),'no remote execution dependency');
 assert.ok(existsSync(new URL(u,new URL('workbench/topology.html','file://'+process.cwd()+'/'))),'dependency '+u);
}
assert.ok(html.includes('workspace-topology-ui.js')&&html.includes('ee-topology-entry.js'));
assert.ok(!html.includes('workspace-experiment-ui.js'),'do not mount both route owners');
const pkg=JSON.parse(readFileSync('package.json'));
for(const key of ['test:browser','test:cross-browser'])assert.ok(pkg.scripts[key].includes('tests/topology-workbench-smoke.mjs'),key);
for(const path of ['tests/topology-workspace.test.mjs','tests/topology-transfer.test.mjs'])assert.ok(manifest.testFiles.includes(path),'unchanged source tests '+path);
const W=require('../workbench/assets/learning/workspace-core.js');
const p=W.topologyPlan().params,c=W.topologyCompare(p);
assert.equal(c.valid,true);assert.equal(c.buck.after.vout,24);assert.equal(c.boost.after.vout,96);
assert.ok(c.boost.after.rhpzHz<c.boost.before.rhpzHz);
assert.equal(W.topologyCompare({...p,loadOhm:1000,inductanceH:20e-6}).valid,false);
const manual={...W.experimentPlan('demand').after,vin:36},fault=W.experimentPlan('protection').after;
const history=[{config:manual},{config:fault}];const snapshot=JSON.stringify(history);
const plan=W.topologyPlan({benchmark:{learningWorkspace:{experiment:{history,currentConfig:fault}}}});
assert.equal(plan.params.vin,36);assert.equal(plan.params.loadOhm,24);assert.equal(plan.params.tripCurrent,undefined);assert.equal(JSON.stringify(history),snapshot);
function fixture(){
 const status={textContent:''},main={inert:false},storage=new Map(),events={},nav=[];
 const document={documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:null,querySelector:()=>main};
 const ctx={document,URL,console,localStorage:{getItem:k=>storage.get(k)??null},location:{href:'https://example.test/-EEHandouts/workbench/index.html',assign:u=>nav.push(u)},CircuitEvidence:{flush:async()=>({saved:true})}};
 ctx.window=ctx;ctx.addEventListener=(n,fn)=>events[n]=fn;vm.createContext(ctx);vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),ctx);
 return {ctx,H:ctx.EEWorkbenchHost,main,storage,events,nav,status};
}
for(const path of ['topology.html','index.html#experiment','index.html#experiment-energy','../middle.html#lesson/mid-boost/mid-boost-ccm']){
 const f=fixture();f.H.markReady();assert.equal(await f.H.leave(path),true,'allow local route '+path);assert.equal(f.nav[0],new URL(path,f.ctx.location.href).href);
}
let f=fixture();assert.equal(f.H.referenceHref('index.html#topology'),'topology.html');
assert.equal(f.H.referenceHref('17_power_topology_control/index.html#guided-applications'),'applications.html#guided-applications');
f=fixture();f.H.markReady();assert.equal(await f.H.complete(),true);assert.match(f.nav[0],/\/workbench\/topology\.html$/);
for(const reason of ['pending','conflict','quota']){
 f=fixture();f.H.markReady();f.ctx.CircuitEvidence.flush=async()=>({saved:false,reason});assert.equal(await f.H.complete(),false);assert.deepEqual(f.nav,[]);
}
f=fixture();f.H.markReady();f.H.protectEvidence('comparison record changed');assert.equal(f.main.inert,true);assert.equal(await f.H.leave('topology.html'),false);assert.deepEqual(f.nav,[]);
f=fixture();f.H.markReady();const raw=JSON.stringify({schema:'circuit-learning-state',version:6,keep:'foreign'});
f.ctx.CircuitEvidence.flush=async()=>{f.storage.set('circuit-learning-state-v5',raw);return {saved:true};};
assert.equal(await f.H.leave('topology.html'),false,'recheck raw version after asynchronous flush');assert.deepEqual(f.nav,[]);assert.equal(f.storage.get('circuit-learning-state-v5'),raw);
for(const path of ['https://attacker.invalid','topology.html?from=https://attacker.invalid','../index.html#topology','//attacker.invalid']){f=fixture();assert.equal(await f.H.leave(path),false);assert.deepEqual(f.nav,[]);}
console.log('PASS topology migration: unchanged owners, CCM/manual provenance, local dependencies, flush and conflict boundaries');
