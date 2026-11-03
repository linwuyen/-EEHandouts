/* Independent upper original PPTX P101–106: analog filters, RC phase, PI, shunt/ADC. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const g=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const map={101:'filter',102:'filter',103:'filter',104:'differentiator',105:'pi',106:'adc'};
for(let p=101;p<=106;p++){
 const x=g[p],lesson=lessons.find(l=>l.id===x?.lesson);
 assert.ok(x&&lesson,'P.'+p+' guide and existing lesson');
 assert.equal(x.lesson,map[p],'P.'+p+' source topic');
 assert.ok(String(lesson.pages).includes(String(p))||(
  x.lesson==='filter'&&p<=103&&lesson.pages==='100–103'),'P.'+p+' original source mapping');
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof x[k]==='string'&&x[k].length>=16,'P.'+p+' complete '+k);
 assert.ok(x.intuition.length===2&&x.intuition.every(s=>s.length>=32),'P.'+p+' physical intuition');
 assert.ok(x.steps.length>=3&&x.steps.every(s=>s.title.length>=7&&s.detail.length>=35),
  'P.'+p+' physical stages');
 assert.ok(x.equations.length>=2&&x.equations.every(s=>s.tex&&s.plain&&s.why.length>=24),
  'P.'+p+' bounded equations');
 assert.ok(x.worked.given.length>=24&&x.worked.steps.length>=3&&x.worked.result.length>=30,
  'P.'+p+' worked example');
 assert.ok(x.assumptions.length>=2&&x.assumptions.every(s=>s.length>=25),
  'P.'+p+' model limitations');
 assert.ok(x.check.q.length>=16&&x.check.a.length>=20,'P.'+p+' answerable quiz');
}
const near=(x,y,tol,name)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,
 name+': '+x+' expected '+y);
// P101: RC low-pass and limited differentiating high-pass from independent frequency ratios.
const R=1000,C=10e-9,tau=R*C,fc=1/(2*Math.PI*tau);
near(fc,15915.494309189537,1e-9,'P101 cutoff');
const x=2*Math.PI*1000*tau;
near(1/Math.hypot(1,x),0.9980319045036449,1e-12,'P101 1 kHz low pass');
near(x/Math.hypot(1,x),0.06270819262525788,1e-12,'P101 1 kHz bounded differentiator');
near(1/Math.hypot(1,1),Math.SQRT1_2,1e-15,'P101 LP at corner');
near(1/Math.hypot(1,1),Math.SQRT1_2,1e-15,'P101 HP at corner');
assert.ok(g[101].pitfall.includes('低通')&&g[101].pitfall.includes('高通'),'P101 distinct two signs and filters');
// P102: Sallen-Key exact second-order denominator and physical damping.
const R1=3300,R2=1000,C1=6.8e-9,C2=2.3e-9,K=3.2;
const a2=R1*R2*C1*C2,a1=R1*C1+R2*C1+R1*C2*(1-K);
const f0=1/(2*Math.PI*Math.sqrt(a2)),Q=Math.sqrt(a2)/a1;
near(f0,22153.62435294354,1e-7,'P102 natural frequency');
near(Q,.5728073049705201,1e-12,'P102 quality factor');
assert.ok(a1>0,'P102 physical stable positive damping');
const Kcrit=1+(R1*C1+R2*C1)/(R1*C2);
assert.ok(Kcrit>K,'P102 gain below zero damping threshold');
assert.ok(g[102].assumptions.some(s=>s.includes('3dB')||s.includes('3dB')||s.includes('−3dB')),
 'P102 must distinguish natural frequency and -3dB');
// P103: two RC+OP allpass circuits have opposite signs but unit magnitude.
const rPhase=10000,cPhase=10e-9,fPhase=1/(2*Math.PI*rPhase*cPhase);
near(fPhase,1591.5494309189535,1e-9,'P103 phase-shift corner');
for(const q of [.1,.5,1,2,10]){
 const real=(1-q*q)/(1+q*q),imag=-2*q/(1+q*q);
 near(Math.hypot(real,imag),1,1e-12,'P103 left allpass magnitude '+q);
 near(Math.hypot(-real,-imag),1,1e-12,'P103 right allpass magnitude '+q);
}
near((1-1)/(1+1),0,1e-15,'P103 real at corner');
near(-2/(1+1),-1,1e-15,'P103 left phase at corner -90deg');
near(2/(1+1),1,1e-15,'P103 right phase at corner +90deg');
assert.ok(g[103].equations.some(s=>s.tex.includes('H_L'))&&g[103].equations.some(s=>s.tex.includes('H_R')),
 'P103 must not conflate the two R-C topologies');
// P104: two independent poles attenuate a 1-kHz 1Vpk sinusoid.
const Ri=1000,Cin=10e-9,Rf=10000,Cf=1e-9,ff=1000;
const f1=1/(2*Math.PI*Ri*Cin),f2=1/(2*Math.PI*Rf*Cf);
near(f1,15915.494309189537,1e-9,'P104 input pole');
near(f2,15915.494309189537,1e-9,'P104 feedback pole');
const amplitude=Rf*Cin*2*Math.PI*ff/
 (Math.hypot(1,2*Math.PI*ff*Ri*Cin)*Math.hypot(1,2*Math.PI*ff*Rf*Cf));
near(amplitude,.6258477827057167,1e-12,'P104 bounded differentiator exact gain');
assert.ok(amplitude<2*Math.PI*ff*Rf*Cin,'P104 poles reduce nominal derivative');
assert.ok(g[104].assumptions.some(s=>s.includes('15.9')),'P104 two source-specific 15.9kHz poles');
// P105: actual series RC negative feedback yields Kp and Ki/s and zero.
const Rin=10000,RF=20000,Cpi=100e-9;
const Kp=RF/Rin,Ki=1/(Rin*Cpi),fz=Ki/(2*Math.PI*Kp);
near(Kp,2,1e-12,'P105 proportional gain');
near(Ki,1000,1e-10,'P105 integrator coefficient');
near(fz,79.57747154594767,1e-10,'P105 PI zero');
assert.ok(g[105].takeaway.includes('負')&&g[105].assumptions.some(s=>s.includes('離散')),
 'P105 analog sign and discrete control must remain explicit');
// P106: 5mOhm and matched 14x input gain with 1.5V offset and ±20A range.
const Rshunt=.005,Vref=1.5,G=140000/10000;
near(G,14,1e-15,'P106 resistor ratio');
const sense=I=>Vref+G*Rshunt*I;
for(const [i,v] of [[-20,.1],[-10,.8],[0,1.5],[10,2.2],[20,2.9]])
 near(sense(i),v,1e-12,'P106 ADC voltage at '+i+' A');
for(const i of [-20,-10,0,10,20]){
 const v=sense(i);
 near((v-Vref)/(G*Rshunt),i,1e-12,'P106 inverse current mapping '+i);
 assert.ok(v>=0&&v<=3,'P106 ideal 0-3V input range');
}
assert.ok(g[106].assumptions.some(s=>s.includes('共模'))&&g[106].takeaway.includes('0.1–2.9V'),
 'P106 offset, headroom and OP common-mode bounds');
console.log('PASS upper P101–106: RC/Bode, Sallen-Key, allpass, differentiator, analog PI, bipolar ADC sense');
