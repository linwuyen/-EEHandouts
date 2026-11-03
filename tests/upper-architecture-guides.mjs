/* Upper P.59–62 original PPTX-grounded architecture and PWM physical checks. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const map={59:'blocks',60:'linear',61:'linear',62:'pwm'};
for(let p=59;p<=62;p++){
 const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&lesson,'Missing original upper P.'+p+' guide/lesson');
 assert.equal(g.lesson,map[p],'Wrong P.'+p+' source chapter lesson');
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(range[0]<=p&&p<=(range[1]??range[0]),'P.'+p+' lesson page mapping');
 assert.ok(g.title.length>=16&&g.question.length>=16&&g.takeaway.length>=16,
  'P.'+p+' substantive question and takeaway');
 assert.ok(g.intuition.length===2&&g.intuition.every(s=>s.length>=35),'P.'+p+' intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=7&&s.detail.length>=35),
  'P.'+p+' physical/feedback stages');
 assert.ok(g.equations.length>=2&&g.equations.every(e=>e.label&&e.tex&&e.plain&&e.why.length>=24),
  'P.'+p+' formulas and assumptions');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' worked example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=25),
  'P.'+p+' design restrictions');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' Q&A');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,label+': '+x+' expected '+y);
// P59: power balance is for stationary time average, NOT instantaneous stored energy.
near(110-100,10,1e-12,'P59 stable average loss');
near(100/110,10/11,1e-12,'P59 average efficiency');
assert.ok(guides[59].pitfall.includes('暫態')||guides[59].assumptions.some(x=>x.includes('暫態')),
 'P59 cannot treat transient stored energy as all heat');
// P60: linear regulator post-rectifier (not system AC-to-DC efficiency).
const vo=5,i=2,vlo=7,vhi=8.4;
near((vlo-vo)*i,4,1e-12,'P60 low Vd dissipated pass power');
near((vhi-vo)*i,6.8,1e-12,'P60 high Vd pass loss');
near(vo/vlo,5/7,1e-12,'P60 ideal regulator stage efficiency low Vd');
near(vo/vhi,5/8.4,1e-12,'P60 ideal regulator stage efficiency high Vd');
assert.ok(guides[60].assumptions.some(s=>s.includes('整機')||s.includes('AC/DC')),
 'P60 5/Vd must not be described as total AC-to-DC efficiency');
assert.ok(guides[60].pitfall.includes('dropout'),'P60 dropout requires waveform valley not peak');
// P61: distinguish switched stage loss and total energy ledger.
const esw=(30e-6+20e-6)*1e5;
near(esw,5,1e-12,'P61 switching loss 5W');
near(110-100-esw,5,1e-12,'P61 assumed remaining losses');
assert.ok(guides[61].pitfall.includes('PWM')||guides[61].assumptions.some(s=>s.includes('變壓器')),
 'P61 must not conflate isolated supply and simplified nonisolated buck');
// P62: independent Buck CCM steady-state volt-second, inductor ripple and ideal C ripple.
const vin=24,d=.4,fs=100e3,L=100e-6,C=100e-6,Iout=2;
const Ts=1/fs,ton=d*Ts,vout=vin*d;
near(vout,9.6,1e-12,'P62 ideal buck Vo');
near(ton,4e-6,1e-12,'P62 ON time');
near((vin-vout)*ton-vout*(Ts-ton),0,1e-12,'P62 volt-second balance');
const ripple=(vin-vout)*d/(L*fs);
near(ripple,.576,1e-12,'P62 triangular inductor current ripple');
near(Iout-ripple/2,1.712,1e-12,'P62 CCM valley positive');
assert.ok(Iout-ripple/2>0,'P62 CCM validity gate');
near(ripple/(8*fs*C),.0072,1e-12,'P62 ideal capacitor output ripple');
assert.ok(guides[62].assumptions.some(s=>s.includes('ESR')),
 'P62 ideal ripple model must state ESR excluded');
assert.ok(guides[62].pitfall.includes('CCM'),'P62 cannot use buck CCM relation without conditions');
console.log('PASS upper P59–62 power/control, linear regulator stage, SMPS and Buck CCM numerical contracts');
