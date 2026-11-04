/* F06: a legal sub-grid pulse must retain its physical duration in every trace. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const view={};runInNewContext(readFileSync('advanced-models.js','utf8'),{window:view});
const M=view.EE_ADVANCED_MODELS;
const near=(a,b,tol,label)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${label}: ${a} vs ${b}`);
const cases=[{vac:240,bus:340,phase:90,power:1000,l:460,fs:100},
  {},{phase:5,power:100,l:800},{vac:200,bus:400,phase:45,power:200,l:500,fs:100}];
for(const [idx,v] of cases.entries()){
 const p=M.params('pfc',v),r=M.calculate('pfc',v),T=1000/p.fs;
 assert.ok(r.validity);const gate=r.traces.find(t=>t.key==='gate');
 assert.ok(Array.isArray(gate.x),'F06: explicit switching-event times required');
 const endOn=gate.values.findIndex((value,j)=>j>0&&value===0);
 if(idx===0)near(gate.x[endOn],0.01731603030756257,1e-10,'17.316 ns pulse, not a 41.667 ns display bin');
 for(const tr of r.traces){
  assert.deepEqual(tr.x,gate.x,'synchronized physical time axis');
  assert.equal(tr.xUnit,'µs');near(tr.x[0],0,0,'start');near(tr.x.at(-1),T,1e-12,'end');
  assert.ok(tr.x.every((x,j)=>j===0||x>tr.x[j-1]),'strictly increasing event times');
 }
 const volt=r.traces.find(t=>t.key==='vl'),current=r.traces.find(t=>t.key==='il');
 let voltTime=0,area=0;
 for(let j=0;j<gate.x.length-1;j++){
  const dt=gate.x[j+1]-gate.x[j];voltTime+=volt.values[j]*dt;
  area+=(current.values[j]+current.values[j+1])*dt/2;
  near((current.values[j+1]-current.values[j])*p.l,volt.values[j]*dt,1e-7,'piecewise L di = v dt (µH/µs)');
 }
 near(voltTime,0,1e-8,'display-data volt-second balance');near(area/T,r.data.iref,1e-8,'display-data current mean');
 for(const tr of r.traces){
  const key={gate:'gate',il:'il',vl:'vL',vsw:'vSW',diode:'diode'}[tr.key];
  tr.values.forEach((value,j)=>near(value,r.probe(tr.x[j]/T)[key],1e-7,'probe/event sample consistency'));
 }
}
console.log('PASS F06: event-aligned CCM/DCM/BCM traces, narrow pulse, KVL, mean current and probe');
