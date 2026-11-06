/* Actual unchanged source controller plus stateless adapter; no layout assertions. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
assert.ok(existsSync('workbench/ee-opamp.js'),'stateless OP page boundary must exist');
const adapter=readFileSync('workbench/ee-opamp.js','utf8'),source=readFileSync('workbench/12_opamp_slew_rate/assets/opamp.js','utf8');
function fixture(mode='step',{missing=false}={}){
 const nodes=new Map(),listeners=new Map(),inputs=[];let draws=0;
 const defaults={'op-step':8,'op-sr-plus':mode==='step'?2:4.1,'op-sr-minus':mode==='step'?2:4.1,'op-gbw':mode==='step'?5:20,'op-gain':mode==='step'?2:1,'op-tol':.1,'op-freq':100,'op-vpp':mode==='step'?2:10};
 for(const [id,value] of Object.entries(defaults)){
  const el={id,value:String(value),disabled:true,addEventListener(){}};inputs.push(el);nodes.set(id,el);nodes.set(id+'-value',{textContent:''});
 }
 for(const id of ['op-required-sr','op-fpbw','op-margin','op-step-time','op-settle-time','op-cl-bw','op-state','ee-opamp-status'])nodes.set(id,{id,textContent:'',className:''});
 const context=new Proxy({clearRect(){},setTransform(){},stroke(){draws++;}},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={id:'op-scope',hidden:true,width:0,height:0,clientWidth:600,clientHeight:300,getContext:()=>context};nodes.set(canvas.id,canvas);
 const c={console,document:{body:{dataset:{mode}},documentElement:{dataset:{eeOpampState:'loading'}},getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>inputs},devicePixelRatio:1,addEventListener(type,fn){const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);}};c.window=c;
 for(const key of ['localStorage','sessionStorage'])Object.defineProperty(c,key,{get(){throw Error('lab must not access '+key);}});
 vm.createContext(c);vm.runInContext(adapter,c);if(!missing)vm.runInContext(source,c);c.EEOpampPage.start();
 function fire(type,target){let stopped=false;const ev={type,target,stopImmediatePropagation(){stopped=true;},preventDefault(){}};for(const fn of listeners.get(type)||[]){fn(ev);if(stopped)break;}}
 return {c,nodes,inputs,canvas,fire,draws:()=>draws,set(id,value){nodes.get(id).value=String(value);fire('input',nodes.get(id));}};
}
let f=fixture();assert.equal(f.c.document.documentElement.dataset.eeOpampState,'ready');assert.equal(f.canvas.hidden,false);assert.ok(f.draws()>0);assert.equal(f.nodes.get('op-step-time').textContent,'4.00 µs');assert.ok(f.inputs.every(e=>!e.disabled));
f.set('op-sr-plus',20);f.set('op-sr-minus',.2);assert.equal(f.nodes.get('op-step-time').textContent,'0.40 µs');f.set('op-step',-8);assert.equal(f.nodes.get('op-step-time').textContent,'40.00 µs');assert.match(f.nodes.get('op-state').textContent,/NEGATIVE/);assert.equal(f.nodes.get('op-step-value').textContent,'-8');f.set('op-step',0);assert.equal(f.nodes.get('op-settle-time').textContent,'0.00 µs');
for(const [id,v]of [['op-step',''],['op-step','NaN'],['op-step',Infinity],['op-step',13],['op-sr-plus',0],['op-sr-minus',21],['op-gbw',1e308],['op-gain',0],['op-gain',1.5],['op-tol',0],['op-freq',1001],['op-vpp',0]]){
 const g=fixture();g.set(id,v);assert.equal(g.c.document.documentElement.dataset.eeOpampState,'invalid',id+' '+v);assert.equal(g.canvas.hidden,true);
 for(const field of ['op-required-sr','op-fpbw','op-margin','op-step-time','op-settle-time','op-cl-bw','op-state'])assert.equal(g.nodes.get(field).textContent,'','clear stale '+field);
 const before=g.draws();g.fire('resize',g.c);assert.equal(g.draws(),before,'resize cannot redraw stale invalid canvas');
}
f=fixture();f.set('op-sr-plus',0);f.set('op-sr-plus',2);assert.equal(f.c.document.documentElement.dataset.eeOpampState,'ready');assert.equal(f.nodes.get('op-step-time').textContent,'4.00 µs');
f=fixture('sine');assert.equal(f.nodes.get('op-required-sr').textContent,'3.142 V/µs');assert.equal(f.nodes.get('op-margin').textContent,'1.31');f.set('op-sr-minus',.2);assert.match(f.nodes.get('op-state').textContent,/SLEW LIMITED/);
f=fixture('step',{missing:true});assert.equal(f.c.document.documentElement.dataset.eeOpampState,'failed');assert.ok(f.inputs.every(e=>e.disabled));assert.equal(f.canvas.hidden,true);
f=fixture();f.c.CircuitOpampSimulator.update=()=>{throw Error('render failure');};f.set('op-step',6);assert.equal(f.c.document.documentElement.dataset.eeOpampState,'failed');assert.equal(f.canvas.hidden,true);assert.ok(f.inputs.every(e=>e.disabled));
console.log('PASS actual OP owner/adapter: signed and zero steps, 12 invalid fixtures, stale clearing, resize refusal, recovery, missing core, rendering failure and zero storage access');
