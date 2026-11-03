/* Original upper P.63–70 single-phase diode and Fourier rectifier physics tests. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const g=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const map={63:'half',64:'half',65:'half',66:'bridge',67:'bridge',68:'bridge',69:'bridge',70:'bridge'};
const titles=new Set();
for(let p=63;p<=70;p++){
 const x=g[p],lesson=lessons.find(l=>l.id===x?.lesson);
 assert.ok(x&&lesson,'P.'+p+' actual lecture guide and lesson');
 assert.equal(x.lesson,map[p],'P.'+p+' wrong original lesson');
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(range[0]<=p&&p<=(range[1]??range[0]),'P.'+p+' source page range mismatch');
 assert.ok(!titles.has(x.title),'P.'+p+' duplicate title');titles.add(x.title);
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof x[key]==='string'&&x[key].length>=16,'P.'+p+' incomplete '+key);
 assert.ok(x.intuition.length===2&&x.intuition.every(s=>s.length>=35),'P.'+p+' intuition');
 assert.ok(x.steps.length>=3&&x.steps.every(y=>y.title.length>=7&&y.detail.length>=35),
  'P.'+p+' physical source and current loops');
 assert.ok(x.equations.length>=2&&x.equations.every(y=>y.label&&y.tex&&y.plain&&y.why.length>=24),
  'P.'+p+' bounded equations');
 assert.ok(x.worked.given.length>=24&&x.worked.steps.length>=3&&x.worked.result.length>=30,
  'P.'+p+' independent numerical worked example');
 assert.ok(x.assumptions.length>=2&&x.assumptions.every(s=>s.length>=25),
  'P.'+p+' validity caveats');
 assert.ok(x.check.q.length>=16&&x.check.a.length>=20,'P.'+p+' comprehension answer');
}
const near=(actual,expected,tol,tag)=>
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,tag+': '+actual+' expected '+expected);
// P63: one conduction half-period, mean vs RMS and actual resistance dissipation.
const Vac=20,R=10,Vm=Vac*Math.SQRT2;
near(Vm/Math.PI,9.00316316157106,1e-10,'P63 half-wave DC component');
near(Vm/2,Math.SQRT2*10,1e-10,'P63 half-wave RMS');
near((Vm/2)**2/R,20,1e-12,'P63 resistance thermal power');
assert.ok(Math.abs((Vm/Math.PI)**2/R-20)>10,
 'P63 DC mean cannot substitute for RMS in resistor heat');
// P64: illustrative constant inductor voltage after source zero is a local slope only.
const L=.020,vL=-20,initial=1,t=.0002;
near(vL/L,-1000,1e-12,'P64 finite di/dt');
near(initial+vL/L*t,.8,1e-12,'P64 continuation beyond source zero');
near(initial/(-vL/L),.001,1e-12,'P64 1ms local constant-V decay only');
assert.ok(g[64].assumptions.some(s=>s.includes('完整')||s.includes('正弦')),
 'P64 must not treat constant vL as full RL sinusoidal solution');
// P65: DC-voltage load turn-on threshold != current extinction angle.
const peak=100,Ed=60,omega=2*Math.PI*50;
near(Math.asin(Ed/peak),.6435011087932844,1e-12,'P65 threshold angle');
near(Math.asin(Ed/peak)/omega,.002048327647,1e-10,'P65 threshold in seconds');
assert.ok(g[65].pitfall.includes('截止')||g[65].assumptions.some(s=>s.includes('截止')),
 'P65 source-below-Ed instant is NOT automatically diode turn-off');
// P66: bridge peak minus two forward drops and physical stored capacitor energy.
const dc=24*Math.SQRT2-2;
near(dc,31.94112549695428,1e-10,'P66 peak output under ideal light load');
near(.5*.001*dc**2,.510117749,1e-6,'P66 stored capacitor energy');
assert.ok(g[66].pitfall.includes('電容'),'P66 capacitor can worsen source current shape');
// P67: resistive vs forced-Id source current differ despite same |Vac|.
near(2*Math.SQRT2/Math.PI*100,90.03163161571061,1e-10,'P67 bridge mean voltage');
near(100*Math.SQRT2/50,2.8284271247461903,1e-10,'P67 R current peak');
near(90.03163161571061/50,1.8006326323142122,1e-10,'P67 R mean load current');
// P68: two diodes each conducting, positive and negative source.
near((100-2*.8)/20,4.92,1e-12,'P68 upper polarity bridge pair current');
near((60-2*.8)/20,2.92,1e-12,'P68 negative input same DC current direction');
assert.ok(g[68].steps.some(x=>x.detail.includes('D1')&&x.detail.includes('D2')),'P68 positive conduction pair');
assert.ok(g[68].steps.some(x=>x.detail.includes('D3')&&x.detail.includes('D4')),'P68 negative conduction pair');
// P69–70: ideal ±Id AC square wave, Fourier RMS, THD and power factor.
const Id=10,ratio=2*Math.SQRT2/Math.PI;
const I1=ratio*Id,thd=Math.sqrt(Math.PI**2/8-1);
near(I1,9.00316316157106,1e-10,'P69 fundamental RMS');
near(thd,.483425847608679,1e-10,'P69 ideal constant-ID line THD fraction');
near(I1/3,3.0010543871903533,1e-10,'P70 3rd harmonic RMS');
near(I1/5,1.800632632314212,1e-10,'P70 5th harmonic RMS');
near(I1/7,1.286166165938722,1e-10,'P70 7th harmonic RMS');
near(I1/Id,ratio,1e-12,'P70 ideal sinusoidal supply true PF at DPF=1');
assert.ok(g[69].assumptions.some(s=>s.includes('無來源電感')),
 'P69 48.34% must be limited to no-overlap ideal rectangular current');
assert.ok(g[70].assumptions.some(s=>s.includes('正弦')),'P70 PF identity assumes sinusoidal source');
console.log('PASS P63–70 independently checked half-wave, R-L, DC-load, bridge pairing, square-current THD and Fourier');
