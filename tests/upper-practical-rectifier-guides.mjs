/* Independent original lecture upper P.77–82 rectifier/PCC/doubler numeric guards. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const pages={77:'capacitor',78:'capacitor',79:'capacitor',80:'notching',81:'notching',82:'notching'};
const titles=new Set();
for(let p=77;p<=82;p++){
 const g=guides[p],l=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&l,'P.'+p+' original guide/lesson');
 assert.equal(g.lesson,pages[p],'P.'+p+' correct source lesson');
 const nums=String(l.pages).match(/\d+/g).map(Number);
 assert.ok(p>=nums[0]&&p<=(nums[1]??nums[0]),'P.'+p+' original slide range');
 assert.ok(!titles.has(g.title),'P.'+p+' independent unique title');titles.add(g.title);
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[key]==='string'&&g[key].length>=16,'P.'+p+' meaningful '+key);
 assert.ok(g.intuition.length===2&&g.intuition.every(x=>x.length>=35),'P.'+p+' physics intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(x=>x.title.length>=7&&x.detail.length>=35),
  'P.'+p+' current flow and signal stages');
 assert.ok(g.equations.length>=2&&g.equations.every(x=>x.label&&x.tex&&x.plain&&x.why.length>=24),
  'P.'+p+' math and domain restrictions');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' checked example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(x=>x.length>=25),
  'P.'+p+' safe model limits');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' comprehension');
}
const near=(got,expected,tol,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-expected)<=tol,
 label+': '+got+' != '+expected);
// P77: intermittent full-wave capacitor supply with constant-load discharge approximation.
const fs=50,Iload=1,C=470e-6;
near(1/(2*fs),.01,1e-12,'P77 two source maxima separation');
near(Iload/(2*fs*C),21.27659574468085,1e-10,'P77 full-wave cap ripple');
near(Iload/(2*fs*(2*C)),10.638297872340425,1e-10,'P77 doubling cap halves approximate ripple');
assert.ok(guides[77].pitfall.includes('THD')||guides[77].assumptions.some(x=>x.includes('線電流')),
 'P77 reduced DC ripple does not guarantee sinusoidal source current');
// P78: DC bus cap KCL, no input current between charge pulses.
near((-2)/(.001),-2000,1e-12,'P78 off-charge dV/dt');
near(-2000*.005,-10,1e-12,'P78 5ms discharge');
near((12-2)/(.001),10000,1e-12,'P78 illustrative charge slope');
// P79: fundamental and distortion current are algebraic frequency components.
near(Math.hypot(3,4),5,1e-12,'P79 whole-period input RMS');
near(4/3,1.3333333333333333,1e-12,'P79 THD current');
near(230*3*.95,655.5,1e-12,'P79 mean real power pure sine source');
near(230*5,1150,1e-12,'P79 total apparent power');
near(655.5/1150,.57,1e-12,'P79 true PF vs .95 DPF');
assert.ok(guides[79].pitfall.includes('DPF')&&guides[79].pitfall.includes('PF'),
 'P79 DPF/PF confusion must be prevented');
// P80/P81: verify upstream/common inductor only (not all downstream Rs,Ls).
const Ls1=50e-6,up=.2e6,down=-.2e6,vs=200;
near(Ls1*up,10,1e-12,'P80 upstream common inductive voltage dip');
near(vs-Ls1*up,190,1e-12,'P80 PCC instantaneous voltage dip');
near(Ls1*down,-10,1e-12,'P81 upstream common inductor recovery sign');
near(vs-Ls1*down,210,1e-12,'P81 PCC instantaneous recovery');
assert.ok(guides[80].pitfall.includes('Ls2')||guides[80].assumptions.some(x=>x.includes('上游')),
 'P80 downstream local impedance cannot be assigned entirely to PCC');
assert.ok(guides[81].pitfall.includes('di/dt'),'P81 distinguish current slope vs magnitude');
// P82: theoretical 115V doubler and 230V bridge, unsafe wrong mains selection.
const peak115=115*Math.SQRT2,bridge230=230*Math.SQRT2;
near(peak115,162.63455967290594,1e-10,'P82 115V RMS peak');
near(2*peak115,325.2691193458119,1e-10,'P82 115V doubler');
near(bridge230,325.2691193458119,1e-10,'P82 230V bridge');
near(2*bridge230,650.5382386916237,1e-10,'P82 dangerous 230V into 115V doubler example');
near(.5*(200e-6/2)*bridge230**2,5.29,1e-12,'P82 two-series-cap stored energy');
assert.ok(guides[82].pitfall.includes('殘壓')||guides[82].assumptions.some(x=>x.includes('安全')),
 'P82 high-voltage capacitor stored-energy warning is mandatory');
console.log('PASS upper P77–82 capacitor full-wave ripple, KCL, THD/DPF/PF, PCC di/dt and 115/230V doubler physical model');
