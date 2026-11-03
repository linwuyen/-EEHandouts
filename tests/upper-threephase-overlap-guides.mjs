/* Independent original PPTX P89–92: characteristic harmonics and source-Ls overlap. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const expected={89:'harmonics',90:'commutation',91:'commutation',92:'commutation'};
for(let p=89;p<=92;p++){
 const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&lesson,'P.'+p+' guide with existing lesson required');
 assert.equal(g.lesson,expected[p],'P.'+p+' source chapter mapping');
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(p>=range[0]&&p<=(range[1]??range[0]),'P.'+p+' lesson source pages');
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[k]==='string'&&g[k].length>=16,'P.'+p+' complete '+k);
 assert.ok(g.intuition.length===2&&g.intuition.every(x=>x.length>=35),'P.'+p+' physical intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(x=>x.title.length>=7&&x.detail.length>=35),
  'P.'+p+' staged current and energy flow');
 assert.ok(g.equations.length>=2&&g.equations.every(x=>x.label&&x.tex&&x.plain&&x.why.length>=24),
  'P.'+p+' formula and validity conditions');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' full worked numeric');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(x=>x.length>=25),
  'P.'+p+' engineering model limits');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' question and answer');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,
 label+': '+x+' vs '+y);
// P89: independent Fourier coefficient integration of ideal 120° phase current.
const Id=10,N=180000,dTheta=2*Math.PI/N;
function sourceCurrent(theta){
 const v=[Math.sin(theta),Math.sin(theta-2*Math.PI/3),Math.sin(theta+2*Math.PI/3)];
 const hi=v.indexOf(Math.max(...v)),lo=v.indexOf(Math.min(...v));
 return hi===0?Id:(lo===0?-Id:0);
}
let square=0;
for(let j=0;j<N;j++)square+=sourceCurrent((j+.5)*dTheta)**2/N;
const Irms=Math.sqrt(square);
near(Irms,Math.sqrt(2/3)*Id,1e-9,'P89 phase rectangular wave total RMS');
function harmonic(h){
 let a=0,b=0;
 for(let j=0;j<N;j++){const t=(j+.5)*dTheta,i=sourceCurrent(t);a+=i*Math.cos(h*t)/N;b+=i*Math.sin(h*t)/N;}
 return Math.hypot(2*a,2*b)/Math.SQRT2;
}
const I1=harmonic(1);
near(I1,Math.sqrt(6)/Math.PI*Id,1e-7,'P89 fundamental RMS of 120deg current');
for(const h of [2,3,4,6,8,9,10,12,15])
 near(harmonic(h),0,1e-7,'P89 forbidden harmonic h='+h);
for(const h of [5,7,11,13])
 near(harmonic(h)/I1,1/h,1e-7,'P89 ideal 6n±1 harmonic fraction h='+h);
near(Math.sqrt(Irms**2-I1**2)/I1,Math.sqrt(Math.PI**2/9-1),1e-7,'P89 ideal six-pulse THDi');
near(Math.sqrt(Math.PI**2/9-1),.310841939307023,1e-12,'P89 ideal sixpulse THD 31.08%');
assert.ok(guides[89].assumptions.some(x=>x.includes('固定')&&x.includes('Ls')),
 'P89 harmonic fraction only for fixed Id and zero source Ls');
// P90: three conducting diodes in top-pair commutation, not four-bridge single-phase overlap.
const pair=(iNew)=>({old:10-iNew,down:10});
for(const iNew of [0,4,5,10]){
 const p=pair(iNew);
 near(iNew+p.old,p.down,1e-12,'P90 upper pair conservation at '+iNew);
}
assert.ok(guides[90].pitfall.includes('四顆'),'P90 threephase commutation not singlephase fourdiode overlap');
// P91: two *separate equal* source inductors give factor 2.
const Ls=.001,Vdiff=100;
near(Vdiff/(2*Ls),50000,1e-12,'P91 di/dt via two per-phase inductors');
near(Vdiff/(2*Ls)*.0001,5,1e-12,'P91 0.1ms local current step');
assert.ok(guides[91].pitfall.includes('2'),'P91 half-V pair sharing cannot be omitted');
// P92: integrate source sinusoidal line-line difference in equal source inductances.
const VLL=400,f=50,w=2*Math.PI*f,VLLpk=VLL*Math.SQRT2,Iout=10;
const ratio=2*w*Ls*Iout/VLLpk;
const mu=Math.acos(1-ratio);
near(ratio,.011107207345395914,1e-12,'P92 normalized line volt-radian area');
near(mu,.14918331100765952,1e-12,'P92 three-phase overlap angle rad');
near(mu*180/Math.PI,8.547574094526448,1e-10,'P92 angle degrees');
near(VLLpk*(1-Math.cos(mu))/2,w*Ls*Iout,1e-10,'P92 a/c pair Ls volt-radian area');
const Vd0=3*VLLpk/Math.PI,deficit=3*w*Ls*Iout/Math.PI;
near(Vd0,540.1897896942637,1e-10,'P92 no-overlap average');
near(deficit,3,1e-12,'P92 DC voltage deficit');
near(Vd0-deficit,537.1897896942637,1e-10,'P92 overlapped DC average');
assert.ok(mu<Math.PI/3,'P92 overlap must be below next 60deg commutation in this simple model');
const largeL=.1,largeRatio=2*w*largeL*Iout/VLLpk;
assert.ok(largeRatio>1-Math.cos(Math.PI/3),
 'P92 sufficiently large source L must reject isolated 60deg overlap formulas');
assert.ok(guides[92].pitfall.includes('熱損')||guides[92].assumptions.some(x=>x.includes('耗')),
 'P92 source-L voltage deficit not equal real inductor heat');
console.log('PASS upper P89-92 Fourier characteristic harmonics, three-phase 2Ls switching and DC-voltage deficit');
