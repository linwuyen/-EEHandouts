/* Lifecycle regression with the actual UI, Evidence, registry and numerical/proof
 * owners. The minimal DOM below is a layout-free test fixture, not browser evidence.
 * Real visibility, navigation and storage events are covered by the browser suite. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture(){
 const ids=new Map(),nodes=new Set(),data=new Map(),writes=[],listeners=new Map();
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attrs={};this.textContent='';this.hidden=false;this.disabled=false;this.inert=false;this.isConnected=true;nodes.add(this);}
  set id(value){this._id=value;ids.set(value,this);}get id(){return this._id||'';}
  append(...children){for(const child of children){if(typeof child==='object'){child.parentNode=this;this.children.push(child);}}}
  appendChild(child){this.append(child);return child;}
  replaceChildren(...children){for(const n of this.children)n.remove();this.children=[];this.textContent='';this.append(...children);}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='hidden')this.hidden=true;}
  removeAttribute(k){delete this.attrs[k];if(k==='hidden')this.hidden=false;}
  addEventListener(){} scrollIntoView(){} focus(){}
  remove(){this.isConnected=false;if(this.id)ids.delete(this.id);nodes.delete(this);}
  before(node){this.parentNode?.append(node);}
  closest(selector){for(let n=this;n;n=n.parentNode)if(matches(n,selector))return n;return null;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){const all=[];const visit=n=>{for(const child of n.children){if(matches(child,selector))all.push(child);visit(child);}};visit(this);return all;}
 }
 function matches(n,s){return s.split(',').some(s=>{s=s.trim();if(s.startsWith('#'))return n.id===s.slice(1);if(s.startsWith('.'))return (n.className||'').split(' ').includes(s.slice(1));if(s.startsWith('['))return s.slice(1,-1) in n.attrs;return n.tagName.toLowerCase()===s;});}
 const body=new Element('body'),main=new Element('main'),head=new Element('head');body.append(main);
 for(const m of readFileSync('workbench/topology.html','utf8').matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"/g)){const n=new Element(m[1]);n.id=m[2];main.append(n);}
 const eyebrow=new Element('p');eyebrow.className='eyebrow';ids.get('workspace-surface').append(eyebrow);
 for(const id of ['ws-voltage','ws-current']){const p=new Element('p');p.firstChild={textContent:''};p.append(ids.get(id));}
 const document={body,head,documentElement:new Element('html'),createElement:tag=>new Element(tag),getElementById:id=>ids.get(id)||null,
  querySelector:s=>s==='main'?main:[...nodes].find(n=>n.isConnected&&matches(n,s))||null,
  querySelectorAll:s=>[...nodes].filter(n=>n.isConnected&&matches(n,s))};
 let lock=Promise.resolve(),waitContracts=Promise.resolve();
 const ctx={document,URL,console,Blob,setTimeout,clearTimeout,location:{href:'https://example.test/workbench/topology.html',pathname:'/workbench/topology.html',search:'',hash:'',assign:()=>{throw Error('unexpected navigation');}},
  localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,String(v));writes.push({key:k,value:String(v)});},removeItem:k=>data.delete(k)},
  navigator:{locks:{request(name,options,fn){const p=lock.then(fn);lock=p.catch(()=>{});return p;}}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
  fetch:async url=>{assert.ok(String(url).endsWith('/assets/learning/model-contracts-v1.json'));await waitContracts;return {ok:true,json:async()=>JSON.parse(readFileSync('workbench/assets/learning/model-contracts-v1.json','utf8'))};}};
 ctx.window=ctx;ctx.addEventListener=(type,fn)=>{const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);};
 ctx.removeEventListener=(type,fn)=>listeners.set(type,(listeners.get(type)||[]).filter(f=>f!==fn));
 ctx.dispatchEvent=event=>{let stopped=false;event.stopImmediatePropagation=()=>stopped=true;event.preventDefault=()=>{};for(const fn of listeners.get(event.type)||[]){fn(event);if(stopped)break;}};
 vm.createContext(ctx);
 for(const m of readFileSync('workbench/topology.html','utf8').matchAll(/<script src="([^"]+)"/g))if(m[1]!=='ee-topology-entry.js')vm.runInContext(readFileSync('workbench/'+m[1],'utf8'),ctx,{filename:m[1]});
 const E=ctx.CircuitEvidence,W=ctx.CircuitWorkspace,R=ctx.CircuitModelRegistry,H=ctx.EEWorkbenchHost;
 return {ctx,E,W,R,H,ids,main,data,writes,async seed(record){const s=E.load();s.benchmark.learningWorkspace={version:1,topologyTransfer:record,experiment:{version:1,preserve:'original-experiment'}};E.save(s);await E.flush();data.set('ee.middle.done','["mid-buck-pwm"]');writes.length=0;return data.get(E.KEY);},
  async supported(){await R.loadTopologyContracts(new URL('.',ctx.location.href));return ['buck-ccm-control-output-esr','boost-ccm-control-output'].map(id=>({id,version:R.describe(id).version}));},
  pauseContracts(){let release;waitContracts=new Promise(r=>release=r);return release;}};
}
function record(f,models){return {version:1,protocol:'topology-workbench-v1',params:f.W.topologyPlan().params,source:'existing completed source record',models,
 rows:{prediction:{first:{answer:'buck',correct:false,at:'2026-11-04T00:00:00Z'}},observation:{passed:true},reason:{passed:true},return:{passed:true}},operated:true,completed:true};}
const invalid=[
 ['future model version',m=>m.map(x=>({...x,version:'999.0.0'}))],
 ['wrong model ID',m=>[{...m[0],id:'other-model'},m[1]]],
 ['duplicate ID',m=>[m[0],m[0]]],
 ['missing provenance',()=>undefined],
 ['incomplete model set',m=>[m[0]]],
 ['additional model',m=>[...m,{id:'extra',version:'1.0.0'}]],
 ['numeric version',m=>[{...m[0],version:1},m[1]]],
 ['malformed entry',m=>[null,m[1]]]
];
for(const [label,change] of invalid){
 const f=fixture(),models=await f.supported(),raw=await f.seed(record(f,change(models)));
 const mounted=await f.W.mountTopology();await f.E.flush();
 assert.equal(mounted,false,label+': incompatible evidence must not mount as a completed current-model result');
 assert.equal(f.data.get(f.E.KEY),raw,label+': preserve original primary bytes');
 assert.equal(f.data.has(f.E.KEY+'-corrupt-backup'),false,label+': do not misclassify model provenance as corrupted data');
 assert.equal(f.writes.filter(w=>w.key===f.E.KEY).length,0,label+': no evidence writes');
 assert.equal(f.main.inert,true,label+': suspend input');
 assert.equal(f.data.get('ee.middle.done'),'["mid-buck-pwm"]');
 assert.equal(f.H.markReady(),false,label+': no false ready');
}
// An explicitly present malformed record is not equivalent to an absent record.
for(const saved of [null,false,0,'unsupported-record']){
 const f=fixture(),raw=await f.seed(saved);assert.equal(await f.W.mountTopology(),false);await f.E.flush();
 assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.writes.filter(w=>w.key===f.E.KEY).length,0);assert.equal(f.main.inert,true);
}
// Exact compatible provenance can resume, even if its ordered list is reversed.
for(const reverse of [false,true]){
 const f=fixture(),models=await f.supported();if(reverse)models.reverse();const saved=record(f,models);await f.seed(saved);
 assert.equal(await f.W.mountTopology(),true);await f.E.flush();
 const result=JSON.parse(f.data.get(f.E.KEY)).benchmark.learningWorkspace;
 assert.deepEqual(result.topologyTransfer.models,models,'resume does not rewrite provenance order or identity');
 assert.deepEqual(result.topologyTransfer.rows,saved.rows,'immutable first attempt survives');
 assert.equal(result.topologyTransfer.completed,true);assert.equal(result.experiment.preserve,'original-experiment');
}
// Only a genuinely new record receives the current registry's provenance.
{
 const f=fixture();assert.equal(await f.W.mountTopology(),true);await f.E.flush();
 const saved=JSON.parse(f.data.get(f.E.KEY)).benchmark.learningWorkspace.topologyTransfer;
 assert.deepEqual(saved.models,await f.supported());assert.equal(saved.completed,false);
}
// Contract data may arrive after another tab has replaced the comparison record.
{
 const f=fixture(),models=await f.supported();await f.seed(record(f,models));const release=f.pauseContracts(),mount=f.W.mountTopology();
 const state=JSON.parse(f.data.get(f.E.KEY));state.benchmark.learningWorkspace.topologyTransfer.models[0].version='999.0.0';
 const raw=JSON.stringify(state);f.data.set(f.E.KEY,raw);release();
 assert.equal(await mount,false);await f.E.flush();assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.main.inert,true);
}
// Recheck provenance at the next user action even before a storage event arrives.
{
 const f=fixture();assert.equal(await f.W.mountTopology(),true);await f.E.flush();f.H.markReady();
 const state=JSON.parse(f.data.get(f.E.KEY));state.benchmark.learningWorkspace.topologyTransfer.models[0].version='999.0.0';
 const raw=JSON.stringify(state);f.data.set(f.E.KEY,raw);f.writes.length=0;
 await f.ids.get('topology-submit').onclick();await f.E.flush();
 assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.writes.filter(w=>w.key===f.E.KEY).length,0);
 assert.equal(f.main.inert,true);assert.equal(f.H.markReady(),false);
}
console.log('PASS topology provenance: actual UI/Evidence/registry, 8 incompatible model sets, 4 malformed records, compatible resume, fresh record and runtime/async guards');
