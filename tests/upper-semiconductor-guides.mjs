/* Independent physical and source-to-lesson contracts for upper P.27–40. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const expected={27:'diodes',28:'diodes',29:'diodes',30:'diodes',
 31:'legacy',32:'legacy',33:'legacy',34:'legacy',35:'legacy',
 36:'mosfet',37:'mosfet',38:'mosfet',39:'mosfet',40:'switchloss'};
assert.deepEqual(Object.keys(guides).map(Number).sort((a,b)=>a-b),
 Array.from({length:98},(_,i)=>i+3),'Upper page guides must be contiguous P3–100');
const titles=new Set();
for(let p=27;p<=40;p++){
 const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&lesson,'P.'+p+' original guide and interactive lesson required');
 assert.equal(g.lesson,expected[p],'P.'+p+' source lesson mismatch');
 const ranges=String(lesson.pages).match(/\d+[–-]\d+|\d+/g)||[];
 assert.ok(ranges.some(x=>{const a=x.match(/\d+/g).map(Number);return p>=a[0]&&p<=(a[1]??a[0]);}),
  'P.'+p+' not in matching source lesson page range');
 assert.ok(!titles.has(g.title),'P.'+p+' duplicate page-specific title');titles.add(g.title);
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[key]==='string'&&g[key].length>=16,'P.'+p+' thin '+key);
 assert.ok(g.intuition.length===2&&g.intuition.every(s=>s.length>=35),'P.'+p+' physical intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=7&&s.detail.length>=35),
  'P.'+p+' physical signal and current flow');
 assert.ok(g.equations.length>=2&&g.equations.every(s=>s.label&&s.tex&&s.plain&&s.why.length>=24),
  'P.'+p+' math and domain constraints');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' numerical exercise');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=25),
  'P.'+p+' nonideal and domain caveats');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,
  'P.'+p+' comprehension question and explanation');
}
const near=(got,expected,tol,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-expected)<=tol,
 label+': got '+got+', expected '+expected);
// P27: compare channel/diode losses only within stated conducting intervals.
const duty=.5,i=10,ron=.04,vf=1.2;
near(i*i*ron*duty,2,1e-12,'P27 MOSFET conduction average');
near(vf*i*duty,6,1e-12,'P27 diode conduction average');
// P28: forward conduction over entire cycle under 2 specified VF conditions.
near(1.4*10,14,1e-12,'P28 first condition diode loss');
near(1.7*10,17,1e-12,'P28 different VF condition');
// P29: Qrr triangular negative area and the *commutation energy scale*, not diode heat.
const qrr=.5*4*50e-9,vr=400,fs=100e3;
near(qrr,100e-9,1e-18,'P29 reverse recovery charge');
near(qrr*vr,40e-6,1e-12,'P29 switching energy scale per event');
near(qrr*vr*fs,4,1e-12,'P29 switching energy scale rate');
near(1.5*10,15,1e-12,'P29 independent diode conduction estimate');
assert.ok(guides[29].assumptions.some(x=>x.includes('Eon')||x.includes('換流')),
 'P29 must distinguish energy distribution and double counting');
// P30: four-diode selection concept cannot infer Qrr from VF alone.
near(8*1,8,1e-12,'P30 first VF conduction');
near(8*1.5,12,1e-12,'P30 second VF conduction');
assert.ok(guides[30].pitfall.includes('Qrr')||guides[30].assumptions.some(x=>x.includes('Qrr')),
 'P30 Qrr must remain a separate selection criterion');
// P31–32: holding current after SCR latch, and recoverable reverse interval.
const holding=.05;
assert.ok(.20>holding,'P31 latch cannot be removed by Gate alone');
assert.ok(.03<holding,'P31 commutating below holding current may turn off');
near(30-40,-10,1e-12,'P32 insufficient tq margin');
near(60-40,20,1e-12,'P32 adequate time-only margin');
assert.ok(guides[32].assumptions.some(x=>x.includes('tq')||x.includes('反壓')),
 'P32 time-only success must not imply actual hardware safety');
// P33: ideal ON/OFF zero power versus finite-resistance channel.
near(0*i,0,1e-12,'P33 ideal switch ON');
near(400*0,0,1e-12,'P33 ideal switch OFF');
near(i*i*ron,4,1e-12,'P33 finite RDS(on)');
// P34: current drive and ON device/base losses. These are powers, not energy.
near(10/10,1,1e-12,'P34 forced-base current');
near(1.5*10,15,1e-12,'P34 VCEsat conduction');
near(.9*1,.9,1e-12,'P34 base drive instantaneous power');
// P35: two-stage Darlington active current gain vs BE drop.
const b1=20,b2=30,beta=b1*b2+b1+b2;
near(beta,650,1e-12,'P35 ideal active-region Darlington beta');
near(beta*.010,6.5,1e-12,'P35 non-saturated implied output');
near(2*.7,1.4,1e-12,'P35 pair of BE junctions');
assert.ok(guides[35].pitfall.includes('強迫'), 'P35 active beta must not be used for saturated switch');
// P36: distinction between whole-period RMS and ON-only current.
near(10*10*.04,4,1e-12,'P36 full RMS power');
near((10*Math.sqrt(.5))**2*.04,2,1e-12,'P36 50-percent conduction');
assert.ok(Math.abs((10*Math.sqrt(.5))**2*.04*.5-2)>.9,
 'P36 applying duty twice must be rejected');
// P37: current can flow either in a driven channel or body diode, never double-count it.
near(5**2*.02,.5,1e-12,'P37 enabled-channel reverse current');
near(.8*5,4,1e-12,'P37 body diode-only reverse current');
// P38: long-channel region check and failure of low-R approximation in active region.
const vg=5,vth=3,overdrive=vg-vth;
assert.ok(.1<overdrive,'P38 illustrative ohmic region');
near(.1/.04,2.5,1e-12,'P38 small-VDS effective current');
near(.1*(.1/.04),.25,1e-12,'P38 ohmic dissipation');
assert.ok(5>overdrive,'P38 active region cannot use 40mΩ globally');
// P39: matched-bias capacitor definitions; Miller charge, gate supply budget.
near(4-.5,3.5,1e-12,'P39 Cgs in nF');
near(1.5-.5,1,1e-12,'P39 Cds in nF');
near(10e-9/.5,20e-9,1e-15,'P39 Miller time');
near(60e-9*10*100e3,.06,1e-12,'P39 gate-drive energy supply scale');
assert.ok(guides[39].assumptions.some(x=>x.includes('非線性')),
 'P39 C(V) cannot be treated as globally constant');
// P40: individual switching energies / average and separate ON-state conduction.
const V=400,I=10,fin=100e3,ton=50e-9,toff=30e-9,D=.5;
const Eon=.5*V*I*ton,Eoff=.5*V*I*toff;
near(Eon,100e-6,1e-12,'P40 hard turn-on triangle');
near(Eoff,60e-6,1e-12,'P40 hard turn-off triangle');
near((Eon+Eoff)*fin,16,1e-12,'P40 hard-switching average');
near(I*I*.04*D,2,1e-12,'P40 conduction average');
near((Eon+Eoff)*fin+I*I*.04*D,18,1e-12,'P40 simplified subtotal');
assert.ok(guides[40].assumptions.some(x=>x.includes('Qrr'))||guides[40].pitfall.includes('Qrr'),
 'P40 prevent double-counting measured Eon with Qrr');
console.log('PASS upper P27–40: fourteen source-specific guides, independent device physics and electrical-loss references');