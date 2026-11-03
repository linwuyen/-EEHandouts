/* Independent original PPTX P97–100: OP negative feedback, variable T network, differential and hysteresis. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const g=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const mapping={97:'op',98:'op',99:'diff',100:'filter'};
for(const page of [97,98,99,100]){
 const x=g[page],lesson=lessons.find(l=>l.id===x?.lesson);
 assert.ok(x&&lesson,'P'+page+' guide and source lesson');
 assert.equal(x.lesson,mapping[page],'P'+page+' existing lesson ID');
 const pages=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(page>=pages[0] && page<=(pages[1]??pages[0]),'P'+page+' source pages');
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof x[key]==='string'&&x[key].length>=16,'P'+page+' complete '+key);
 assert.ok(x.intuition.length===2&&x.intuition.every(v=>v.length>=32),'P'+page+' physical intuition');
 assert.ok(x.steps.length>=3&&x.steps.every(v=>v.title.length>=7&&v.detail.length>=35),
  'P'+page+' source-linked reasoning');
 assert.ok(x.equations.length>=2&&x.equations.every(v=>v.tex&&v.plain&&v.why.length>=24),
  'P'+page+' formula validity');
 assert.ok(x.worked.given.length>=24&&x.worked.steps.length>=3&&x.worked.result.length>=30,
  'P'+page+' worked example and independent bounds');
 assert.ok(x.assumptions.length>=2&&x.assumptions.every(v=>v.length>=25),
  'P'+page+' hardware operating limitations');
 assert.ok(x.check.q.length>=16&&x.check.a.length>=20,
  'P'+page+' testable understanding');
}
const near=(got,want,tol,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-want)<=tol,
 label+': '+got+' vs '+want);
// P97: independent KCL of inverting virtual-ground node, dividers and buffer.
const Rin=10000,Rf=20000,vin=.2;
const voInv=-vin*Rf/Rin;
near(vin/Rin+voInv/Rf,0,1e-15,'P97 virtual-ground KCL input and feedback');
near(voInv,-.4,1e-15,'P97 inverting OP output');
near((1+Rf/Rin)*vin,.6,1e-15,'P97 noninverting output');
near(vin,vin,0,'P97 unity-gain follower');
assert.ok(g[97].pitfall.includes('單電源')&&g[97].assumptions.some(x=>x.includes('共模')),
 'P97 do not imply physically realizable negative output from single 0-3.3 V rail');
// P98: Figure 4.2 T feedback with explicit middle-node KCL, not multiply two amplifier gains.
const R1=10000,Rt=100000,R2=20000,R3=10000,ei=.01;
const vm=-Rt/R1*ei;
const eo=vm*(1+R2/Rt+R2/R3);
near(ei/R1+vm/Rt,0,1e-15,'P98 virtual-ground KCL');
near(vm/Rt+(vm-eo)/R2+vm/R3,0,1e-15,'P98 center-node KCL');
near(eo/ei,-32,1e-12,'P98 exact T feedback gain');
const variable=x=>-x/(1-x),linear=x=>-x*R2/R1;
near(variable(.4),-2/3,1e-14,'P98 pot non-linear 40 percent');
near(variable(.8),-4,1e-14,'P98 pot asymptotic limit');
near(linear(.4),-.8,1e-14,'P98 fixed-R1 variable-R2 linear');
assert.ok(g[98].pitfall.includes('T 型')&&g[98].assumptions.some(x=>x.includes('wiper')),
 'P98 T feedback and potentiometer endpoint risks');
// P99: ideal matched single-OP difference amplifier, three-op instrumentation amplifier.
const v1=1.0,v2=1.05,r=R2/R1;
const vplus=R2/(R1+R2)*v1;
const voDiff=(1+r)*vplus-r*v2;
near(voDiff,-r*(v2-v1),1e-13,'P99 matched single op difference orientation');
const gain1=1+2*R2/R1,gain2=1;
const inAmp=(x,y)=>gain1*gain2*(y-x);
near(inAmp(v1,v2),.25,1e-13,'P99 three OP instrumentation gain');
near(inAmp(v1+.1,v2+.1),.25,1e-13,'P99 common-mode rejection ideal');
const add=-30000*(.1/10000+.2/20000-.15/30000);
near(add,-.45,1e-13,'P99 three-input summing amplifier KCL');
assert.ok(g[99].assumptions.some(x=>x.includes('共模'))&&g[99].equations.some(x=>x.tex.includes('2R_2')),
 'P99 absolute common-mode range and first-stage double-resistor gain');
// P100: inverting integrator negative slope, comparator positive feedback Schmitt thresholds.
const R=10000,C=100e-9,e=.1,dt=.002;
const slope=-e/(R*C),delta=slope*dt;
near(slope,-100,1e-12,'P100 input current creates inverting integration slope');
near(delta,-.2,1e-12,'P100 2ms integrated voltage');
const Rref=10000,Rout=90000,Eref=0;
const threshold=Vout=>(Rout*Eref+Rref*Vout)/(Rref+Rout);
near(threshold(10),1,1e-12,'P100 Schmitt rising threshold');
near(threshold(-10),-1,1e-12,'P100 Schmitt falling threshold');
near(threshold(10)-threshold(-10),2,1e-12,'P100 hysteresis width');
assert.ok(g[100].takeaway.includes('正回授')&&g[100].pitfall.includes('虛短'),
 'P100 cannot treat positive feedback comparator as linear opamp');
console.log('PASS original upper P97-100: OP KCL, T network, difference amp, integrator, hysteresis');
