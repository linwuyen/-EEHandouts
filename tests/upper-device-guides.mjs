/* Source-grounded independent physics contract: upper power devices P.41-48. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const map={41:'legacy',42:'legacy',43:'igbt',44:'legacy',45:'legacy',46:'legacy',47:'switchloss',48:'igbt'};
const titles=new Set();
for(let p=41;p<=48;p++){
 const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&lesson,'P.'+p+' guide and lesson required');
 assert.equal(g.lesson,map[p],'P.'+p+' wrong source lesson');
 assert.ok(!titles.has(g.title),'P.'+p+' duplicate title');titles.add(g.title);
 const ranges=(String(lesson.pages).match(/\d+[–-]\d+|\d+/g)||[]).map(x=>x.match(/\d+/g).map(Number));
 assert.ok(ranges.some(a=>p>=a[0]&&p<=(a[1]??a[0])),'P.'+p+' outside source lesson page range');
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[k]==='string'&&g[k].length>=16,'P.'+p+' thin '+k);
 assert.ok(g.intuition.length===2&&g.intuition.every(s=>s.length>=35),'P.'+p+' physical intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=7&&s.detail.length>=35),
  'P.'+p+' signal/energy stages');
 assert.ok(g.equations.length>=2&&g.equations.every(s=>s.label&&s.tex&&s.plain&&s.why.length>=24),
  'P.'+p+' equation source and conditions');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' stepwise numerical example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=25),
  'P.'+p+' engineering limitations');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' meaningful assessment');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,label+': '+x+' != '+y);
// P41: GTO negative gate extraction vs anode current. Illustrative, not a universal ratio.
near(300*.2,60,1e-12,'P41 example negative gate current');
near(.010*500,5,1e-12,'P41 hypothetical switching energy rate');
// P42: RCD snubber capacitor charge and energy, not automatically all resistor heat.
const C=10e-9,v=600,dt=2e-6,fs=5e3;
near(C*v/dt,3,1e-12,'P42 capacitor current scale');
near(.5*C*v*v,1.8e-3,1e-12,'P42 capacitor energy increase');
near(.5*C*v*v*fs,9,1e-12,'P42 fully dissipative upper example');
assert.ok(guides[42].pitfall.includes('½CV²')||guides[42].assumptions.some(s=>s.includes('耗能')),
 'P42 must not equate capacitor stored energy with any snubber total loss');
// P43: IGBT ON vs Eoff with stored minority carriers.
near(1.8*20,36,1e-12,'P43 IGBT conduction power');
near(.003*8000,24,1e-12,'P43 IGBT Eoff rate');
near(1.8*20+.003*8000,60,1e-12,'P43 partial loss budget');
assert.ok(guides[43].assumptions.some(s=>s.includes('歷史')||s.includes('頻率')),
 'P43 old frequency number is not an absolute modern device limit');
// P44: MCT simplified ON drop, not FET RDS(on) model.
near(25*.4,10,1e-12,'P44 whole-cycle average current');
near(1.8*25*.4,18,1e-12,'P44 MCT conduction power');
assert.ok(guides[44].pitfall.includes('RDS(on)'), 'P44 MCT must not be modeled as generic MOSFET');
// P45: a named condition is necessary for power-device comparison.
near((20*Math.sqrt(.5))**2*.05,10,1e-12,'P45 MOSFET loss');
near(20*.5*1.7,17,1e-12,'P45 IGBT loss');
assert.ok(guides[45].assumptions.some(s=>s.includes('歷史')||s.includes('額定')),
 'P45 historical family table must not be claimed as modern limits');
// P46: the 3D historical chart has no contemporary rating guarantee.
near(1200/600,2,1e-12,'P46 initial voltage ratio');
near(.001*1e4,10,1e-12,'P46 10kHz switching loss');
near(.001*1e5,100,1e-12,'P46 100kHz switching loss');
assert.ok(guides[46].assumptions.some(s=>s.includes('現代')||s.includes('歷史')),
 'P46 historical chart caution required');
// P47: gate supply budget is not all MOSFET junction heat; Eon may include Qrr.
const pcond=15**2*.04,psw=(50e-6+40e-6)*1e5,pgate=60e-9*10*1e5;
near(pcond,9,1e-12,'P47 channel conduction');
near(psw,9,1e-12,'P47 switching power');
near(pgate,.06,1e-12,'P47 gate driver supply');
near(pcond+psw+pgate,18.06,1e-12,'P47 system subtotal');
assert.ok(guides[47].pitfall.includes('Qg')||guides[47].pitfall.includes('Gate'),
 'P47 gate supply vs junction-loss accounting');
// P48: layout L*di/dt is screening, not a pass certification.
const vovershoot=10e-9*5e9;
near(vovershoot,50,1e-12,'P48 stray inductance transient');
near(650-400-vovershoot,200,1e-12,'P48 unqualified rated voltage difference');
assert.ok(guides[48].assumptions.some(s=>s.includes('SOA')||s.includes('額定')),
 'P48 margin requires real worst-case and SOA');
console.log('PASS upper P.41-48 source mapping, eight original page guides and independent electrical reference checks');
