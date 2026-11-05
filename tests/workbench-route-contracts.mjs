/* Execute the actual mounted hash listener with the real host and Evidence owner.
 * This layout-free fixture supplements, not replaces, browser navigation tests. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ui=readFileSync('workbench/assets/learning/workspace-experiment-ui.js','utf8');
const start=ui.indexOf("window.addEventListener('hashchange',");
const end=ui.indexOf("\n  window.addEventListener('storage',",start);
assert.ok(start>=0&&end>start,'locate the real mounted route listener');
const route=ui.slice(start,end);
async function fixture(){
 const data=new Map(),listeners=new Map(),assigned=[],chosen=[],status={textContent:''},main={inert:false};
 let url=new URL('https://example.test/workbench/index.html#experiment-energy');
 let queue=Promise.resolve(),barrier=Promise.resolve(),quota=false;
 const location={get href(){return url.href;},get hash(){return url.hash;},set hash(v){url.hash=v;},
  assign(v){assigned.push(v);url=new URL(v,url);}};
 const ctx={URL,console,location,history:{replaceState(a,b,v){url=new URL(v,url);}},
  document:{body:null,documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?status:null,querySelector:()=>main},
  localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(quota&&k==='circuit-learning-state-v5')throw Error('quota');data.set(k,String(v));},removeItem:k=>data.delete(k)},
  navigator:{locks:{request(name,options,fn){const b=barrier,p=queue.then(()=>b).then(fn);queue=p.catch(()=>{});return p;}}},
  CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},
  id:'energy',session:{currentLesson:'energy'},lessons:[{id:'energy'},{id:'storage'}],choose:id=>chosen.push(id)};
 ctx.window=ctx;ctx.addEventListener=(type,fn)=>{const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);};
 ctx.removeEventListener=(type,fn)=>listeners.set(type,(listeners.get(type)||[]).filter(f=>f!==fn));
 ctx.dispatchEvent=event=>{let stopped=false;event.stopImmediatePropagation=()=>stopped=true;event.preventDefault=()=>{};for(const fn of listeners.get(event.type)||[]){fn(event);if(stopped)break;}};
 vm.createContext(ctx);
 for(const file of ['workbench/ee-host.js','workbench/assets/learning/learning-evidence.js'])vm.runInContext(readFileSync(file,'utf8'),ctx,{filename:file});
 const E=ctx.CircuitEvidence,H=ctx.EEWorkbenchHost;
 const initial=E.load();initial.benchmark.learningWorkspace={version:1,experiment:{version:1,currentLesson:'energy',rows:{energy:{first:{answer:'up',correct:true}}},history:[]}};
 E.save(initial);assert.equal((await E.flush()).saved,true);H.markReady();
 vm.runInContext(route,ctx,{filename:'actual-mounted-hash-listener.js'});
 const navigate=hash=>{location.hash=hash;return listeners.get('hashchange')[0]();};
 return {E,H,data,assigned,chosen,status,main,ctx,navigate,get hash(){return location.hash;},
  hold(){let release;barrier=new Promise(resolve=>release=resolve);return release;},setQuota(){quota=true;}};
}
{
 const f=await fixture(),raw=f.data.get(f.E.KEY);await f.navigate('#topology');
 assert.deepEqual(f.assigned,['https://example.test/workbench/topology.html'],'mounted #topology must open the local comparator, not be reset as unavailable');
 assert.deepEqual(f.chosen,[],'navigation must not reset/recompute the experiment');assert.equal(f.data.get(f.E.KEY),raw,'navigation must not change saved answers');
}
{
 const f=await fixture(),release=f.hold(),s=f.E.load();s.benchmark.navigationDraft='must survive';f.E.save(s);
 const leaving=f.navigate('#topology');await Promise.resolve();assert.equal(f.assigned.length,0,'do not navigate before the actual Evidence lock commits');
 assert.equal(f.hash,'#experiment-energy','retain canonical current route while save is pending');release();await leaving;
 assert.equal(f.assigned.length,1);assert.equal(JSON.parse(f.data.get(f.E.KEY)).benchmark.navigationDraft,'must survive');
}
{
 const f=await fixture(),raw=f.data.get(f.E.KEY);f.setQuota();const s=f.E.load();s.benchmark.navigationDraft='not yet saved';f.E.save(s);
 await f.navigate('#topology');assert.equal(f.assigned.length,0,'quota failure prevents leaving');assert.equal(f.hash,'#experiment-energy');
 assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.E.storageStatus().saved,false);assert.match(f.status.textContent,/取消離開/);
}
{
 const f=await fixture(),release=f.hold(),s=f.E.load();s.benchmark.navigationDraft='stale draft';f.E.save(s);
 const leaving=f.navigate('#topology'),winner=JSON.parse(f.data.get(f.E.KEY));winner.benchmark.remote='winner';const raw=JSON.stringify(winner);f.data.set(f.E.KEY,raw);
 release();await leaving;assert.equal(f.assigned.length,0,'same-version write conflict prevents leaving');assert.equal(f.hash,'#experiment-energy');assert.equal(f.data.get(f.E.KEY),raw);
}
{
 const f=await fixture(),raw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'future'});f.data.set(f.E.KEY,raw);
 await f.navigate('#topology');assert.equal(f.assigned.length,0);assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.data.has(f.E.KEY+'-corrupt-backup'),false);assert.equal(f.main.inert,true);
}
{
 const f=await fixture();await f.navigate('#not-migrated');assert.equal(f.assigned.length,0);assert.equal(f.hash,'#experiment-energy');assert.match(f.status.textContent,/尚未遷入/);
 await f.navigate('#experiment-storage');assert.deepEqual(f.chosen,['storage'],'ordinary experiment route remains owned by the original UI');
}
{
 const f=await fixture(),release=f.hold(),s=f.E.load();s.benchmark.navigationDraft='coalesced';f.E.save(s);
 const a=f.navigate('#topology'),b=f.navigate('#topology');release();await Promise.all([a,b]);assert.equal(f.assigned.length,1,'repeated requests must not race the save gate');
}
console.log('PASS mounted workbench route: local topology, pending-save gate, quota, conflict, future schema, unknown/normal routes and duplicate requests');
