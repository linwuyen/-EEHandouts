/* Independent engineering checks for upper PPTX P.93–96: source-Ls capacitor rectifier. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
for(let page=93;page<=96;page++){
 const g=guides[page];
 assert.ok(g&&g.lesson==='bus','P'+page+' must map to existing bus lesson');
 const lesson=lessons.find(l=>l.id===g.lesson);
 assert.ok(lesson&&lesson.pages==='93–96','P'+page+' original slide-page lesson match');
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[key]==='string'&&g[key].length>=16,'P'+page+' substantive '+key);
 assert.ok(g.intuition.length===2&&g.intuition.every(s=>s.length>=35),'P'+page+' physics');
 assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=7&&s.detail.length>=35),
  'P'+page+' ordered physical reasoning');
 assert.ok(g.equations.length>=2&&g.equations.every(s=>s.tex&&s.plain&&s.why.length>=24),
  'P'+page+' formulas bounded to model');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P'+page+' independent worked example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=25),
  'P'+page+' clear invalid regimes');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P'+page+' self-check');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,
 label+': '+x+' vs '+y);
// P93: constant Vd ≠ constant Id. Two separate AC source inductors in one conducting pair.
const Ls=.001,Vd=540;
near((550-Vd)/(2*Ls),5000,1e-12,'P93 source-Ls rising charging current slope');
near((530-Vd)/(2*Ls),-5000,1e-12,'P93 current fall even before diode turns off');
assert.ok(guides[93].equations.some(x=>x.tex.includes('2L_s')),
 'P93 must retain both phase inductors in pair KVL');
assert.ok(guides[93].takeaway.includes('電流')&&guides[93].pitfall.includes('立即'),
 'P93 source inductance forbids instantaneous current extinction');
// P94: independently sample non-sinusoidal current vs sinusoidal source, not merely algebraic tautology.
const N=72000,phi=Math.acos(.98),I1=10,I5=6;
let sumV2=0,sumI2=0,sumVI=0,sum5S=0,sum5C=0,sum1S=0,sum1C=0;
for(let j=0;j<N;j++){
 const t=(j+.5)*2*Math.PI/N;
 const v=Math.SQRT2*Math.sin(t);
 const i=Math.SQRT2*(I1*Math.sin(t-phi)+I5*Math.sin(5*t));
 sumV2+=v*v/N;sumI2+=i*i/N;sumVI+=v*i/N;
 sum1S+=i*Math.sin(t)/N;sum1C+=i*Math.cos(t)/N;
 sum5S+=i*Math.sin(5*t)/N;sum5C+=i*Math.cos(5*t)/N;
}
const Irms=Math.sqrt(sumI2),Vrms=Math.sqrt(sumV2);
const I1meas=Math.hypot(sum1S,sum1C)*Math.SQRT2;
const I5meas=Math.hypot(sum5S,sum5C)*Math.SQRT2;
const thd=I5meas/I1meas,pf=sumVI/(Vrms*Irms);
near(Irms,Math.sqrt(136),1e-10,'P94 full distorted line current rms');
near(thd,.6,1e-10,'P94 Fourier THD from sampled current');
near(sumVI/(Vrms*I1meas),.98,1e-10,'P94 fundamental displacement factor');
near(pf,.98/Math.sqrt(1+.6**2),1e-10,'P94 true PF from time-domain sampled P/Vrms/Irms');
assert.ok(guides[94].equations.some(x=>x.tex.includes('THD_i')),
 'P94 must distinguish THD from PF and DPF');
// P95: independent time-domain CF of equal-amplitude positive/negative current pulses.
function pulseCF(deg){
 const alpha=deg*Math.PI/180,peak=12;
 let ss=0,ip=0;
 for(let j=0;j<N;j++){
  const t=(j+.5)*2*Math.PI/N;
  const on=Math.abs(t-Math.PI/2)<alpha/2||Math.abs(t-3*Math.PI/2)<alpha/2;
  const i=on?(t<Math.PI?peak:-peak):0;
  ss+=i*i/N;ip=Math.max(ip,Math.abs(i));
 }
 return ip/Math.sqrt(ss);
}
near(pulseCF(60),Math.sqrt(3),1e-10,'P95 wide equal-amplitude pulse CF');
near(pulseCF(30),Math.sqrt(6),1e-10,'P95 narrow equal-amplitude pulse CF');
assert.ok(pulseCF(30)>pulseCF(60),'P95 narrower pulses increase CF at same peak');
assert.ok(guides[95].intuition.some(s=>s.includes('左軸')&&s.includes('右軸')),
 'P95 must distinguish normalized DC voltage from CF axis');
// P96: C charge balance during no-conduction window. Figure 5-39 is from 5-30.
const C=.0022,Iload=5,dt=.002;
near(Iload*dt/C,4.545454545454546,1e-12,'P96 capacitor no-charge voltage droop');
assert.ok(guides[96].takeaway.includes('圖 5-30')&&guides[96].takeaway.includes('圖 5-36'),
 'P96 must distinguish original figure 5-30 from figure 5-36 model');
assert.ok(guides[96].equations.some(x=>x.tex.includes('i_d-i_')),
 'P96 DC rectifier current must differ from DC load current');
console.log('PASS upper P93-96: source-L 2Ls KVL, sampled THD/DPF/PF, CF and capacitor energy flow');
