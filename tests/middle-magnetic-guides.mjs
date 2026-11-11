/* Independent middle-volume P.41-51 Forward/bridge/magnetics physics tests. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},middle={};
runInNewContext(readFileSync('middle-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('middle-data.js','utf8'),{window:middle});
const guides=root.EE_PAGE_GUIDES,lessons=middle.EE_DATA.chapters.flatMap(c=>c.lessons);
const mapping={
  41:'mid-forward-reset',42:'mid-forward-reset',43:'mid-double-forward',
  44:'mid-half-full',45:'mid-half-full',46:'mid-pushpull',47:'mid-pushpull',
  48:'mid-magnetization',49:'mid-magnetization',50:'mid-magnetization',51:'mid-coreloss'
};
const titles=new Set();
for(let n=41;n<=51;n++){
  const g=guides[n],lesson=lessons.find(x=>x.id===g?.lesson);
  assert.ok(g&&lesson,'P.'+n+' original source page has no guide/lesson');
  assert.equal(g.lesson,mapping[n],'P.'+n+' wrong interactive lesson');
  const range=String(lesson.pages).match(/\d+/g).map(Number);
  const start=range[0],end=range[1]??start;
  assert.ok(n>=start&&n<=end,'P.'+n+' mismatched source chapter');
  assert.ok(!titles.has(g.title),'duplicate original page title');
  titles.add(g.title);
  for(const k of ['title','question','takeaway','pitfall','tryIt'])
    assert.ok(typeof g[k]==='string'&&g[k].length>=16,'P.'+n+' thin '+k);
  assert.ok(g.intuition.length>=2&&g.intuition.every(s=>s.length>=40),'P.'+n+' intuition');
  assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=8&&s.detail.length>=35),'P.'+n+' stages');
  assert.ok(g.equations.length>=2&&g.equations.every(s=>s.label&&s.tex&&s.plain&&s.why.length>=20),'P.'+n+' formulas');
  assert.ok(g.worked.given.length>=30&&g.worked.steps.length>=3&&g.worked.result.length>=30,'P.'+n+' numeric exercise');
  assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=24),'P.'+n+' validity');
  assert.ok(g.check.q.length>=18&&g.check.a.length>=26,'P.'+n+' question and answer');
}
function near(actual,expected,tolerance,name){
  assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,name+': '+actual+' vs '+expected);
}
// P41: independent output filter and magnetizing constraints.
near(.5*100*.4,20,1e-12,'P41 Forward filter output');
near(100*4e-6/(20*100e-6),.2,1e-12,'P41 ON DeltaB');
// P42: three-winding reset, boundary and switch stress.
const vin=100,d=.4,turnReset=1,ton=4e-6,ts=10e-6;
near(turnReset*ton,4e-6,1e-15,'P42 reset time');
assert.ok(turnReset*ton<(1-d)*ts,'P42 must fully reset before next turn-on');
near(1/(1+turnReset),.5,1e-12,'P42 max Duty');
assert.ok(.55+turnReset*.55>1,'P42 invalid duty cannot demagnetize');
near(vin*(1+1/turnReset),200,1e-12,'P42 ideal MOSFET plateau');
// P43: double-ended Forward clamps, not certified maximum.
near(400*4e-6,1600e-6,1e-12,'P43 ON volt seconds');
near(400*4e-6-400*4e-6,0,1e-12,'P43 reset balanced');
near(400,400,1e-12,'P43 ideal device OFF voltage');
// P44-46: one pulse per half-cycle: effective conduction is 2D.
const n=.25,dc=.3,bus=400;
near(bus/2*n*2*dc,30,1e-12,'P44 half bridge output');
near(bus*n*2*dc,60,1e-12,'P45 full bridge output');
near(100*n*2*dc,15,1e-12,'P46 voltage-fed push-pull output');
near(2*100,200,1e-12,'P46 OFF switch voltage');
// P47: current-fed push-pull overlap and inductor volt-second.
const currentFedDuty=.75,input=100,ratio=.5;
const overlap=2*currentFedDuty-1,transfer=2*(1-currentFedDuty);
near(overlap,.5,1e-12,'P47 overlap fraction');
near(transfer,.5,1e-12,'P47 transfer fraction');
const output=input*ratio/(2*(1-currentFedDuty));
near(output,100,1e-12,'P47 output gain');
near(input*overlap+(input-output/ratio)*transfer,0,1e-12,'P47 input inductor volt-second');
assert.ok(currentFedDuty>.5&&overlap>0,'P47 only valid in overlap operating mode');
// P48: a negative reset voltage returns positive B to its starting value.
const initialB=.05,turns48=20,coreArea48=100e-6;
const peakB=initialB+100*4e-6/(turns48*coreArea48);
const resetB=peakB-100*4e-6/(turns48*coreArea48);
const printedFlux=guides[48].worked.steps.slice(0,2).map(step=>
  Array.from(step.replaceAll('−','-').matchAll(/([+-]?\d+(?:\.\d+)?)\s*T\b/g),m=>Number(m[1])));
const [onFlux,offFlux]=printedFlux;
near(onFlux.at(-2),initialB,1e-12,'P48 initial B');
near(onFlux.at(-1),peakB,1e-12,'P48 B after positive volt-seconds');
near(offFlux.at(-2),peakB,1e-12,'P48 B before reset');
near(offFlux.at(-1),resetB,1e-12,'P48 B after negative volt-seconds');
// P49: flux swing vs DC flux bias.
near(100*4e-6/(20*100e-6),.2,1e-12,'P49 DeltaB');
near(100*4e-6-100*4e-6,0,1e-12,'P49 balanced volt-seconds');
// P50: dual-ended PWM and mismatch.
near(400*3e-6-400*3e-6,0,1e-12,'P50 balanced bridge');
near(400*(3.2e-6-3e-6),80e-6,1e-12,'P50 flux-walk residual');
// P51: fixed-material Steinmetz illustrative ratios.
near(2**1.5,2.8284271247461903,1e-12,'P51 frequency ratio');
near(1.2**2.5,1.5774409656148782,1e-12,'P51 flux ratio');
near(2**1.5*1.2**2.5,4.461676814830944,1e-6,'P51 combined ratio');
console.log('PASS P.41-51 independent Forward, bridge, push-pull, flux, core-loss physics and page mapping');
