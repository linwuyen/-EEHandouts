/* Layout-free DOM fixture for actual UI/evidence lifecycle. Not browser evidence. */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
export function applicationsFixture(){
 const ids=new Map(),nodes=new Set(),data=new Map(),writes=[],events=new Map(),navigations=[];
 const html=readFileSync('workbench/applications.html','utf8');
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.dataset={};this.style={};this.textContent='';this.disabled=false;this.hidden=false;this.inert=false;this.isConnected=true;nodes.add(this);}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id||'';}
  append(...cs){for(const c of cs)if(c&&typeof c==='object'){c.parentNode=this;this.children.push(c);}}
  prepend(n){n.parentNode=this;this.children.unshift(n);}appendChild(n){this.append(n);return n;}
  replaceChildren(...cs){for(const c of [...this.children])c.remove();this.children=[];this.textContent='';this.append(...cs);}
  remove(){this.isConnected=false;if(this.id)ids.delete(this.id);nodes.delete(this);for(const c of [...this.children])c.remove();}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='hidden')this.hidden=true;}
  removeAttribute(k){delete this.attrs[k];if(k==='hidden')this.hidden=false;}
  toggleAttribute(k,on){if(on)this.setAttribute(k,'');else this.removeAttribute(k);}
  addEventListener(type,fn){this.listeners||={};(this.listeners[type]||=[]).push(fn);}dispatchEvent(event){for(const fn of this.listeners?.[event.type]||[])fn(event);}scrollIntoView(){}focus(){}before(n){this.parentNode?.append(n);}
  closest(s){for(let n=this;n;n=n.parentNode)if(match(n,s))return n;return null;}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  querySelectorAll(s){const found=[];const visit=n=>{for(const c of n.children){if(match(c,s))found.push(c);visit(c);}};visit(this);return found;}
 }
 function match(n,s){return s.split(',').some(x=>{x=x.trim();if(x==='input:checked')return n.tagName==='INPUT'&&n.checked;if(x.startsWith('#'))return n.id===x.slice(1);if(x.startsWith('.'))return (n.className||'').split(' ').includes(x.slice(1));if(x.startsWith('['))return x.slice(1,-1)in n.attrs;return n.tagName.toLowerCase()===x;});}
 const body=new Element('body'),main=new Element('main'),head=new Element('head');body.append(main);
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
  const n=new Element(m[1]);n.id=m[2];main.append(n);
  for(const a of m[0].matchAll(/([\w-]+)="([^"]*)"/g))if(a[1]!=='id'){n.attrs[a[1]]=a[2];n[a[1]]=a[2];}
  if(n.tagName==='SELECT'){n.value='lc';n.options=[{value:'lc'},{value:'lcl'}];}
 }
 const doc={body,main,head,readyState:'complete',documentElement:new Element('html'),getElementById:id=>ids.get(id)||null,createElement:t=>new Element(t),querySelector:s=>s==='main'?main:[...nodes].find(n=>match(n,s))||null,querySelectorAll:s=>[...nodes].filter(n=>n.isConnected&&match(n,s))};
 let waitContracts=Promise.resolve(),lock=Promise.resolve(),lockGate=Promise.resolve(),quota=false,contractMissing=false;
 const location={href:'https://example.test/EE/workbench/applications.html',pathname:'/EE/workbench/applications.html',hash:'',search:'',assign:u=>navigations.push(u)};
 const ctx={document:doc,URL,URLSearchParams,console,Blob,setTimeout,clearTimeout,structuredClone,location,
  history:{replaceState(a,b,href){const u=new URL(href,location.href);location.href=u.href;location.pathname=u.pathname;location.search=u.search;location.hash=u.hash;}},
  localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(quota&&k==='circuit-learning-state-v5')throw new Error('QuotaExceededError');data.set(k,String(v));writes.push({key:k,value:String(v)});},removeItem:k=>data.delete(k)},
  navigator:{locks:{request(name,options,fn){const p=lock.then(()=>lockGate).then(fn);lock=p.catch(()=>{});return p;}}},
  Event:class{constructor(type){this.type=type;}},
  CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},HashChangeEvent:class{constructor(type){this.type=type;}},
  fetch:async url=>{assert.ok(String(url).endsWith('/assets/learning/model-contracts-v1.json'));await waitContracts;return {ok:!contractMissing,status:404,json:async()=>JSON.parse(readFileSync('workbench/assets/learning/model-contracts-v1.json','utf8'))};}};
 ctx.window=ctx;ctx.addEventListener=(type,fn)=>{const list=events.get(type)||[];list.push(fn);events.set(type,list);};
 ctx.removeEventListener=(type,fn)=>events.set(type,(events.get(type)||[]).filter(f=>f!==fn));
 ctx.dispatchEvent=e=>{let stopped=false;e.stopImmediatePropagation=()=>stopped=true;e.preventDefault=()=>{};for(const fn of events.get(e.type)||[]){fn(e);if(stopped)break;}};
 vm.createContext(ctx);
 // The original atlas renderer is not invoked in this layout-free fixture; real canvas/controls are a browser gate.
 for(const m of html.matchAll(/<script src="([^"]+)"/g))if(!['17_power_topology_control/app.js','ee-applications-entry.js'].includes(m[1]))vm.runInContext(readFileSync('workbench/'+m[1],'utf8'),ctx,{filename:m[1]});
 const E=ctx.CircuitEvidence,W=ctx.CircuitWorkspace,R=ctx.CircuitModelRegistry,H=ctx.EEWorkbenchHost;
 return {ctx,E,W,R,H,ids,data,writes,main,navigations,
  async seed(record){const s=E.load();s.benchmark.learningWorkspace={version:1,experiment:{version:1,preserve:'experiment'},topologyTransfer:{version:1,preserve:'comparison'}};if(record!==undefined)s.benchmark.learningWorkspace.topologyApplications=record;E.save(s);await E.flush();data.set('ee.middle.done','["mid-buck-pwm"]');writes.length=0;return data.get(E.KEY);},
  async mount(){const result=await W.mountApplications();if(result)H.markReady();return result;},
  async answer(value){const panel=ids.get('guided-applications');for(const input of panel.querySelectorAll('input'))input.checked=input.value===value;await ids.get('application-submit').onclick();},
  async choose(id){const l=W.applicationLessons().find(l=>l.id===id);const b=ids.get('guided-applications').children.find(n=>n.tagName==='NAV').children.find(n=>n.textContent.startsWith(l.label));await b.onclick();},
  async flush(){return E.flush();},
  quota(value){quota=value;},
  failContracts(){contractMissing=true;},
  pauseContracts(){let release;waitContracts=new Promise(r=>release=r);return release;},
  holdLock(){let release;lockGate=new Promise(r=>release=r);return release;},
  tick:()=>new Promise(r=>setTimeout(r,0))};
}
