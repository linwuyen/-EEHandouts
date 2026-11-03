/* Independent original PPTX upper P.83–88: 3-phase neutral and six-pulse bridge. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const g=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const map={83:'neutral',84:'neutral',85:'neutral',86:'sixpulse',87:'sixpulse',88:'sixpulse'};
const titles=new Set();
for(let p=83;p<=88;p++){
 const x=g[p],lesson=lessons.find(l=>l.id===x?.lesson);
 assert.ok(x&&lesson,'P.'+p+' original source guide and lesson required');
 assert.equal(x.lesson,map[p],'P.'+p+' wrong chapter mapping');
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(p>=range[0]&&p<=(range[1]??range[0]),'P.'+p+' outside original lesson');
 assert.ok(!titles.has(x.title),'P.'+p+' duplicate title');titles.add(x.title);
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof x[k]==='string'&&x[k].length>=16,'P.'+p+' thin '+k);
 assert.ok(x.intuition.length===2&&x.intuition.every(y=>y.length>=35),'P.'+p+' incomplete intuition');
 assert.ok(x.steps.length>=3&&x.steps.every(y=>y.title.length>=7&&y.detail.length>=35),
  'P.'+p+' physical and signal current paths');
 assert.ok(x.equations.length>=2&&x.equations.every(y=>y.label&&y.tex&&y.plain&&y.why.length>=24),
  'P.'+p+' derivation and validity');
 assert.ok(x.worked.given.length>=24&&x.worked.steps.length>=3&&x.worked.result.length>=30,
  'P.'+p+' numeric example');
 assert.ok(x.assumptions.length>=2&&x.assumptions.every(y=>y.length>=25),
  'P.'+p+' nonideal and safety limits');
 assert.ok(x.check.q.length>=16&&x.check.a.length>=20,'P.'+p+' knowledge check');
}
const near=(got,expected,tol,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-expected)<=tol,
 label+': actual '+got+' expected '+expected);
// P83: balanced wye voltage, balanced fundamental cancellation, triplen summation.
near(Math.sqrt(3)*120,207.84609690826525,1e-10,'P83 wye line-to-line RMS');
near(3*2,6,1e-12,'P83 equal in-phase 3rd harmonic neutral RMS');
// P84: complex phase vector sum of h-th harmonic; h=3,9 adds, h=1,5,7 cancels.
function harmonicPhaseSum(h){
 let real=0,imag=0;
 for(const phase of [0,-2*Math.PI*h/3,-4*Math.PI*h/3]){
  real+=Math.cos(phase);imag+=Math.sin(phase);
 }
 return Math.hypot(real,imag);
}
for(const h of [1,2,4,5,7,8,10])
 near(harmonicPhaseSum(h),0,1e-10,'P84 balanced non-triplen h='+h);
for(const h of [3,6,9,12])
 near(harmonicPhaseSum(h),3,1e-10,'P84 balanced triplen h='+h);
near(3*Math.hypot(2,.5),6.18465843842649,1e-10,'P84 3rd and 9th orthogonal neutral RMS');
assert.ok(Math.abs(3*(2+.5)-3*Math.hypot(2,.5))>1,'P84 cannot add different harmonic RMS directly');
// P85: neutral with significant 3rd may exceed phase conductor RMS even when fundamental balanced.
const Iphase=Math.hypot(10,4),Ineutral=3*4;
near(Iphase,10.770329614269007,1e-10,'P85 phase conductor total RMS');
near(Ineutral,12,1e-12,'P85 neutral third harmonic RMS');
assert.ok(Ineutral>Iphase,'P85 neutral current may exceed phase current');
// P86–88: derive six-pulse DC voltage and line current from independent time sampling.
const phRms=400/Math.sqrt(3),Vp=phRms*Math.SQRT2,Id=10;
function phaseVoltages(theta){return [Math.sin(theta),Math.sin(theta-2*Math.PI/3),Math.sin(theta+2*Math.PI/3)].map(x=>Vp*x)}
function bridge(theta){
 const phases=phaseVoltages(theta);
 const hi=phases.indexOf(Math.max(...phases)),lo=phases.indexOf(Math.min(...phases));
 const currents=[0,0,0];currents[hi]=Id;currents[lo]=-Id;
 return {hi,lo,vd:phases[hi]-phases[lo],currents};
}
const states=new Set();
const N=60000,dx=2*Math.PI/N;
let vmean=0,i2=0,cosTerm=0,sinTerm=0;
for(let j=0;j<N;j++){
 const theta=(j+.5)*dx,b=bridge(theta);
 states.add(b.hi+'-'+b.lo);
 vmean+=b.vd/N;
 i2+=(b.currents[0]**2)/N;
 cosTerm+=b.currents[0]*Math.cos(theta)/N;
 sinTerm+=b.currents[0]*Math.sin(theta)/N;
 near(b.currents.reduce((a,b)=>a+b,0),0,1e-9,'P87 3-wire KCL at sample '+j);
}
assert.equal(states.size,6,'P87 exactly six unique conducting pairs per full mains cycle');
const analyticAvg=3*Math.SQRT2/Math.PI*400;
near(vmean,analyticAvg,.00001,'P88 six-segment DC average independent waveform integration');
near(vmean,540.1897896942637,.00001,'P88 400V line RMS output average');
near(Math.sqrt(i2),Math.sqrt(2/3)*Id,1e-8,'P88 120/0/120 line-current RMS');
const fundamentalRms=Math.hypot(2*cosTerm,2*sinTerm)/Math.SQRT2;
near(fundamentalRms,Math.sqrt(6)/Math.PI*Id,.000001,'P88 first harmonic RMS independent Fourier integral');
near(fundamentalRms/Math.sqrt(i2),3/Math.PI,.000001,'P88 PF for sinusoidal source and aligned fundamental');
near(Math.abs(cosTerm),0,.000001,'P88 DPF=1 in symmetrical ideal bridge');
near(6*50,300,1e-12,'P88 six-pulse ripple fundamental');
const example=bridge(Math.PI/2);
assert.equal(example.hi,0,'P86 peak voltage from phase A at chosen instant');
assert.ok(g[86].assumptions.some(x=>x.includes('電容')),'P86 actual output Cd invalidates direct raw max-min voltage');
assert.ok(g[88].assumptions.some(x=>x.includes('電容')||x.includes('Id')),
 'P88 1.35*VLL and 3/pi PF cannot be generalized to capacitor-input bridge');
console.log('PASS upper P83–88 neutral triplen, six conducting pairs, Vdc six-pulse integration and Fourier PF');
