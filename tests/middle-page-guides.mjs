/* Independent content, page mapping and physical-example contracts for P.2–9. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function load(file,key){
  const root={};
  runInNewContext(readFileSync(file,'utf8'),{window:root});
  assert.ok(root[key],file+' missing '+key);
  return root[key];
}
const guides=load('middle-page-guides.js','EE_PAGE_GUIDES');
const middle=load('middle-data.js','EE_DATA');
const pages=Object.keys(guides).map(Number).sort((a,b)=>a-b);
assert.deepEqual(pages,Array.from({length:31},(_,i)=>i+2),'Middle guides must cover P.2–32 with no holes');
const lessons=middle.chapters.flatMap(c=>c.lessons);
const corresponding={
  2:'mid-topologies',3:'mid-buck-pwm',4:'mid-switching-lc',5:'mid-resonance',
  6:'mid-voltsecond',7:'mid-ccm-dcm',8:'mid-bcm',9:'mid-buck-dcm',
  10:'mid-boost-ccm',11:'mid-boost-rl',12:'mid-boost-rl',
  13:'mid-boost-efficiency',14:'mid-boost-efficiency',
  15:'mid-boost-parasitic',16:'mid-boost-parasitic',17:'mid-boost-parasitic',
  18:'mid-boost-parasitic',19:'mid-boost-parasitic',20:'mid-boost-parasitic',
  21:'mid-boost-dcm',22:'mid-boost-dcm',
  23:'mid-buckboost-ccm',24:'mid-buckboost-dcm',25:'mid-buckboost-dcm',
  26:'mid-sepic-zeta',27:'mid-four-switch',28:'mid-bidirectional',
  29:'mid-quadrants',30:'mid-motor-hbridge',31:'mid-bipolar',32:'mid-unipolar'
};
for(const p of pages){
  const g=guides[p],lesson=lessons.find(l=>l.id===g.lesson);
  assert.ok(lesson,'P.'+p+' missing target lesson');
  assert.equal(g.lesson,corresponding[p],'P.'+p+' wrong target');
  const range=String(lesson.pages).match(/\d+/g).map(Number);
  assert.ok(p>=range[0]&&p<=(range[1]||range[0]),'P.'+p+' not in linked lesson range');
  for(const name of ['title','question','takeaway','pitfall','tryIt']){
    assert.ok(typeof g[name]==='string'&&g[name].length>15,'P.'+p+' missing '+name);
  }
  assert.ok(g.intuition.length>=2&&g.intuition.every(s=>s.length>40),'P.'+p+' physical intuition must be substantive');
  assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>6&&s.detail.length>35),'P.'+p+' energy-flow steps missing');
  assert.ok(g.equations.length>=2&&g.equations.every(s=>s.label&&s.tex&&s.plain&&s.why.length>=15),'P.'+p+' equation or fallback missing');
  assert.ok(g.worked.given.length>=25&&g.worked.steps.length>=3&&g.worked.result.length>=30,'P.'+p+' incomplete worked example');
  assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=20),'P.'+p+' conditions missing');
  assert.ok(g.check.q.length>=15&&g.check.a.length>=20,'P.'+p+' check/answer missing');
  if(g.phases)assert.ok(Math.abs(g.phases.reduce((n,s)=>n+s.pct,0)-100)<.0001,'P.'+p+' time fractions must total 100%');
}
const middleHtml=readFileSync('middle.html','utf8'),upperHtml=readFileSync('index.html','utf8'),app=readFileSync('app.js','utf8');
assert.ok(middleHtml.includes('src="./middle-page-guides.js"'),'Middle guide source missing');
assert.ok(middleHtml.indexOf('middle-page-guides.js')<middleHtml.indexOf('app.js'),'Guide script must precede app');
assert.ok(middleHtml.includes('href="./middle-page-guides.css"'),'Guide stylesheet missing');
assert.ok(!upperHtml.includes('middle-page-guides.js'),'Upper must not import middle guide data');
assert.ok(app.includes('pageGuide(p)')&&app.includes('typesetPageGuide()'),'Page routes and math fallback must mount');
assert.ok(app.includes('guideSearchText(p)'),'Deep guide must participate in search');
function near(actual,expected,eps,label){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<eps,label+': '+actual+' expected '+expected);}
// Independent reference equations, not derived from the authored guide text.
near(48*.25,12,1e-10,'P2 Buck');
near(48/(1-.25),64,1e-10,'P2 Boost');
near(-48*.25/(1-.25),-16,1e-10,'P2 inverting Buck-Boost');
const L=100e-6,C=100e-6,D=.5,Vin=24,Vo=12;
const ripple50=(Vin-Vo)*D/(L*50e3),ripple100=(Vin-Vo)*D/(L*100e3);
near(ripple50,1.2,1e-10,'P4 50kHz IL ripple');
near(ripple100,.6,1e-10,'P4 100kHz IL ripple');
near(ripple50/(8*50e3*C),.03,1e-10,'P4 C ripple 30mV');
near(ripple100/(8*100e3*C),.0075,1e-10,'P4 C ripple 7.5mV');
near(1/(2*Math.PI*Math.sqrt(L*C)),1591.54943091895,1e-8,'P5 resonant frequency');
near(10*Math.sqrt(C/L),10,1e-10,'P5 Q10');
near(2*Math.sqrt(C/L),2,1e-10,'P5 Q2');
near((100-40)*4e-6/L,2.4,1e-10,'P6 ON current');
near(-40*6e-6/L,-2.4,1e-10,'P6 OFF current');
const critical=Vin*.5*.5/(2*L*100e3);
near(critical,.3,1e-10,'P8 critical Io');
near(12/critical,40,1e-10,'P8 critical R');
const d=.25,io=.1,fs=100e3;
const m=1/(1+2*L*fs*io/(Vin*d*d)),vo=m*Vin;
const delta=(Vin-vo)*d/vo,pk=(Vin-vo)*d/(L*fs);
near(m,3/7,1e-10,'P9 DCM ratio');
near(vo,72/7,1e-9,'P9 DCM Vo');
near(delta,1/3,1e-10,'P9 diode interval');
near(pk*(d+delta)/2,.1,1e-10,'P9 average current area');
assert.ok(1-d-delta>.4,'P9 must have a nonzero DCM idle interval');
console.log('PASS P.2–32 middle page guides: all page mappings, authoring depth and original P.2–9 numerical fixtures');
