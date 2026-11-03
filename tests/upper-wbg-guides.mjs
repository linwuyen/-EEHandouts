/* Independent WBG/device physics tests, original PPTX upper P.49-58. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const g=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const titles=new Set();
for(let p=49;p<=58;p++){
 const x=g[p],lesson=lessons.find(l=>l.id===x?.lesson);
 assert.ok(x&&lesson,'P.'+p+' source-specific guide and lesson required');
 assert.equal(x.lesson,'wbg','P.'+p+' WBG lesson mapping');
 assert.ok(!titles.has(x.title),'P.'+p+' duplicated title');titles.add(x.title);
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(range[0]<=p&&p<=(range[1]??range[0]),'P.'+p+' outside original lesson');
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof x[k]==='string'&&x[k].length>=16,'P.'+p+' incomplete '+k);
 assert.ok(x.intuition.length===2&&x.intuition.every(t=>t.length>=35),'P.'+p+' intuition');
 assert.ok(x.steps.length>=3&&x.steps.every(t=>t.title.length>=7&&t.detail.length>=35),
  'P.'+p+' signal and physics stages');
 assert.ok(x.equations.length>=2&&x.equations.every(t=>t.label&&t.tex&&t.plain&&t.why.length>=24),
  'P.'+p+' formula and validity');
 assert.ok(x.worked.given.length>=24&&x.worked.steps.length>=3&&x.worked.result.length>=30,
  'P.'+p+' numerical worked example');
 assert.ok(x.assumptions.length>=2&&x.assumptions.every(t=>t.length>=25),
  'P.'+p+' safety and model assumptions');
 assert.ok(x.check.q.length>=16&&x.check.a.length>=20,'P.'+p+' comprehension');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,label+': '+x+' vs '+y);
// P49: breakdown-field length *scale* (not actual epitaxial layer specifications).
const bv=1200;
const si=bv/(.3e6)*1e4,sic=bv/(3e6)*1e4; // cm to micrometers
near(si,40,1e-10,'P49 Si ideal field length (um)');
near(sic,4,1e-10,'P49 SiC ideal field length (um)');
near(si/sic,10,1e-10,'P49 Ec scaling only');
assert.ok(g[49].assumptions.some(x=>x.includes('終端')||x.includes('結構')),
 'P49 real device drift/geometry limits required');
// P50: Baliga theoretical drift only and thermal material ratio only.
near(1/10**3,.001,1e-12,'P50 ideal Ec cube effect');
near(400/150,8/3,1e-12,'P50 raw material conductivity ratio');
assert.ok(g[50].pitfall.includes('1/1000'),'P50 must not claim same ratio for total Rds(on)');
// P51: third-quadrant finite reverse conduction with no intrinsic PN diode.
near(3*8*.05,1.2,1e-12,'P51 GaN illustrative reverse conduction');
near(4*8*.05,1.6,1e-12,'P51 second operating point');
assert.ok(g[51].pitfall.includes('反向')||g[51].pitfall.includes('體二極體'),
 'P51 no body diode does NOT mean no reverse loss');
// P52: voltage block BEFORE any frequency comparison.
assert.ok(650<800,'P52 650V device cannot block 800V bus');
near(1200-800,400,1e-12,'P52 unqualified rating difference');
near(100e-6*100e3,10,1e-12,'P52 switching power scale');
// P53: Kelvin-source and L*di/dt magnitude, gate supply not junction heat.
near(20e-9*5e9,100,1e-12,'P53 20nH transient voltage');
near(100e-9*18*100e3,.18,1e-12,'P53 gate supply power scale');
assert.ok(g[53].pitfall.includes('SiC'),'P53 gate voltage not universal');
// P54: illustrative E-mode Vgs absolute maximum violation.
near(5+1.5,6.5,1e-12,'P54 gate peak');
near(6.5-6,.5,1e-12,'P54 gate excess over specified example limit');
assert.ok(g[54].assumptions.some(x=>x.includes('絕對')||x.includes('額定')),
 'P54 specific GaN Vgs only, no universal limit');
// P55: D-mode normally-on and negative gate-off margin failure.
near(-5+1.5,-3.5,1e-12,'P55 gate off under noise');
assert.ok(-3.5>-4,'P55 violates assumed -4 V gate-off threshold');
assert.ok(g[55].pitfall.includes('互鎖'),'P55 hard startup interlock required');
// P56: third-quadrant conduction for two deadtime intervals.
near(2*3*8*50e-9*200e3,.48,1e-12,'P56 50ns each deadtime loss');
near(2*3*8*100e-9*200e3,.96,1e-12,'P56 doubled deadtime loss');
assert.ok(g[56].pitfall.includes('Dead Time')||g[56].pitfall.includes('Qrr'),
 'P56 deadtime cannot be zeroed solely because of low Qrr');
// P57: same fixed ON-current and D independent device conduction budgets.
for(const [R,expected] of [[.100,5],[.080,4],[.060,3]])
 near(10**2*.5*R,expected,1e-12,'P57 MOS conduction comparison');
near(2*10*.5,10,1e-12,'P57 IGBT VCEsat budget');
assert.ok(g[57].assumptions.some(x=>x.includes('假設')||x.includes('人為')),
 'P57 example is not representative of all product families');
// P58: stored-inductor energy threshold does not by itself prove ZVS.
const EL=.5*20e-6*4**2,Eoss=100e-6;
near(EL,160e-6,1e-12,'P58 commutation inductance stored energy');
near(EL-Eoss,60e-6,1e-12,'P58 positive but insufficient ZVS energy difference');
assert.ok(g[58].check.a.includes('Dead Time')||g[58].check.a.includes('Qoss'),
 'P58 requires charge and timing verification beyond simple energy comparison');
console.log('PASS original upper P49-58 WBG, GaN, SiC and topology-specific physics and numeric checks');