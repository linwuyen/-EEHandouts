/* Original upper P.71-72: source-inductance bridge commutation overlap. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
for(const p of [71,72]){
 const g=guides[p],l=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&l,'P.'+p+' source-specific page guide/lesson');
 assert.equal(g.lesson,'overlap','P.'+p+' existing source-inductor overlap lesson');
 const a=String(l.pages).match(/\d+/g).map(Number);
 assert.ok(p>=a[0]&&p<=(a[1]??a[0]),'P.'+p+' source page range');
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[key]==='string'&&g[key].length>=16,'P.'+p+' thin '+key);
 assert.ok(g.intuition.length===2&&g.intuition.every(x=>x.length>=35),'P.'+p+' physical intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(x=>x.title.length>=7&&x.detail.length>=35),
  'P.'+p+' physical source / diode current flow');
 assert.ok(g.equations.length>=2&&g.equations.every(x=>x.label&&x.tex&&x.plain&&x.why.length>=24),
  'P.'+p+' formulas and operating assumptions');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' numeric worked');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(x=>x.length>=25),
  'P.'+p+' model limits');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' comprehension');
}
const near=(got,expected,tol,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-expected)<=tol,
 label+': actual '+got+' expected '+expected);
const f=50,L=.001,Id=10,Vs=100,omega=2*Math.PI*f,Vm=Vs*Math.SQRT2;
const k=2*omega*L*Id/Vm;
const modeOk=({v,r,load})=>2*omega*r*load/v>0&&2*omega*r*load/v<1; // conservative mu<pi/2 for single isolated overlap
assert.ok(modeOk({v:Vm,r:L,load:Id}),'P71 small overlap mode');
const mu=Math.acos(1-k);
near(k,.04442882938158366,1e-12,'P71 normalized source volt-seconds');
near(mu,.2992048478374428,1e-12,'P71 overlap angle rad');
near(mu*180/Math.PI,17.143174990939468,1e-9,'P71 overlap degrees');
near(Vm*(1-Math.cos(mu)),2*omega*L*Id,1e-10,'P71 current step -Id to +Id volt-second');
const Vdo=2*Vm/Math.PI,drop=2*omega*L*Id/Math.PI;
near(Vdo,90.03163161571061,1e-10,'P71 no-overlap DC average');
near(drop,2,1e-12,'P71 commutation average DC voltage deficit');
near(Vdo-drop,88.03163161571061,1e-10,'P71 overlapped average voltage');
assert.ok(!modeOk({v:Vm,r:.1,load:10}),'P71 invalid large source inductance requires different regime');
assert.ok(guides[71].pitfall.includes('熱損')||guides[71].assumptions.some(x=>x.includes('耗熱')),
 'P71 commutation voltage reduction is NOT actual I²R heat');
const id=10;
const pair=(is)=>({iNew:(id+is)/2,iOld:(id-is)/2});
for(const [is,expectedNew,expectedOld] of [[-10,0,10],[0,5,5],[10,10,0]]){
 const p=pair(is);
 near(p.iNew,expectedNew,1e-12,'P72 new pair current at is='+is);
 near(p.iOld,expectedOld,1e-12,'P72 old pair current at is='+is);
 near(p.iNew+p.iOld,id,1e-12,'P72 DC current conservation');
 near(p.iNew-p.iOld,is,1e-12,'P72 source current difference');
}
assert.ok(guides[72].assumptions.some(x=>x.includes('理想')),
 'P72 diode overlap requires the idealized device domain');
console.log('PASS upper P.71–72 source-Ls commutation angle, DC voltage deficit and four-diode loop current partition');
