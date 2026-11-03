/* Original upper P73–76, fixed-Vdc rectifier current pulses and power quality. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:root});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const pages=root.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const titles=new Set();
for(let p=73;p<=76;p++){
 const g=pages[p],l=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&l,'P.'+p+' source-specific rectifier guide/lesson');
 assert.equal(g.lesson,'capacitor','P.'+p+' source-appropriate existing lesson');
 const range=String(l.pages).match(/\d+/g).map(Number);
 assert.ok(p>=range[0]&&p<=(range[1]??range[0]),'P.'+p+' lesson range');
 assert.ok(!titles.has(g.title),'P.'+p+' duplicated original title');titles.add(g.title);
 for(const k of ['title','question','takeaway','pitfall','tryIt'])
  assert.ok(typeof g[k]==='string'&&g[k].length>=16,'P.'+p+' incomplete '+k);
 assert.ok(g.intuition.length===2&&g.intuition.every(x=>x.length>=35),'P.'+p+' physical intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(x=>x.title.length>=7&&x.detail.length>=35),
  'P.'+p+' current paths and stages');
 assert.ok(g.equations.length>=2&&g.equations.every(x=>x.label&&x.tex&&x.plain&&x.why.length>=24),
  'P.'+p+' math domain');
 assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,
  'P.'+p+' worked numerical example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(x=>x.length>=25),
  'P.'+p+' assumptions and nonideal limitations');
 assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'P.'+p+' comprehension');
}
const near=(x,y,tol,label)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,
 label+': computed '+x+' expected '+y);
function integrate(f,a,b,n=12000){
 const h=(b-a)/n;
 let sum=f(a)+f(b);
 for(let k=1;k<n;k++)sum+=(k%2===0?2:4)*f(a+k*h);
 return sum*h/3;
}
function model(r){
 if(!(r>0&&r<1))return {valid:false};
 const Vs=100,Vm=Vs*Math.SQRT2,f=50,omega=2*Math.PI*f,Ls=.01,Vd=r*Vm;
 const thetaB=Math.asin(r),thetaP=Math.PI-thetaB;
 const flux=theta=>Vm*(Math.cos(thetaB)-Math.cos(theta))-Vd*(theta-thetaB);
 if(!(flux(thetaP)>0&&flux(Math.PI)<0))return {valid:false,reason:'overlapping current intervals or topology mode invalid'};
 let lo=thetaP,hi=Math.PI;
 for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(flux(mid)>0)lo=mid;else hi=mid;}
 const thetaF=(lo+hi)/2;
 const current=theta=>flux(theta)/(omega*Ls);
 const Id=integrate(current,thetaB,thetaF)/Math.PI;
 const Irms=Math.sqrt(integrate(theta=>current(theta)**2,thetaB,thetaF)/Math.PI);
 const a1=2/Math.PI*integrate(theta=>current(theta)*Math.cos(theta),thetaB,thetaF);
 const b1=2/Math.PI*integrate(theta=>current(theta)*Math.sin(theta),thetaB,thetaF);
 const I1=Math.hypot(a1,b1)/Math.SQRT2;
 const THD=Math.sqrt(Math.max(0,Irms**2-I1**2))/I1;
 const DPF=b1/Math.hypot(a1,b1),PF=DPF*I1/Irms;
 const peak=current(thetaP),CF=peak/Irms;
 const Vdo=2*Vm/Math.PI,Ishort=Vs/(omega*Ls);
 return {valid:true,thetaB,thetaP,thetaF,Id,Irms,I1,THD,DPF,PF,CF,peak,
  Vd,Vdo,VdNorm:Vd/Vdo,Ishort,IdNorm:Id/Ishort,omega,Vm};
}
const s=model(.90),light=model(.95);
assert.ok(s.valid&&light.valid,'P73-76 source-current model in valid isolated-pulse region');
near(s.thetaB,1.1197695149986342,1e-8,'P73 first threshold angle');
near(s.thetaP,2.021823138591159,1e-8,'P73 current peak angle');
near(s.thetaF,2.4824327944545423,1e-8,'P73 current extinction angle');
assert.ok(s.thetaB<s.thetaP&&s.thetaP<s.thetaF&&s.thetaF<Math.PI,'P73 actual turn-off is after source drops below Vdc');
near(s.peak,2.697866601891822,2e-6,'P73 pulse peak');
near(s.Id,.6582041828505741,2e-6,'P73 averaged DC current');
near(s.VdNorm,1.413716694115407,1e-8,'P74 Vdc / original unfiltered fullwave average');
near(s.Ishort,31.830988618379067,1e-8,'P74 short-current normalization uses source RMS');
near(s.IdNorm,0.02067809425405437,1e-5,'P74 Id/Ishort normalized ratio');
// P74 open-circuit limit: at zero current Vd approaches Vm; Vd/Vdo -> pi/2.
near(Math.PI/2,1.5707963267948966,1e-12,'P74 Vm/Vdo limit');
assert.ok(light.Id<s.Id,'P74 pulse current decreases as held Vdc approaches Vm');
assert.ok(!model(1).valid,'P74 at Vdc >= peak cannot build forward current from zero');
// P75 independent Fourier integral vs RMS and average power, not simply DPF.
near(s.Irms,1.1703907899260202,3e-6,'P75 total source Irms');
near(s.I1,.8968479789768108,3e-6,'P75 first harmonic RMS');
near(s.THD,.8384731104489563,3e-6,'P75 THDi = 83.85%');
near(s.DPF,.9341127745350537,3e-6,'P75 displacement PF');
near(s.PF,.7157926747109301,3e-6,'P75 true PF');
near(s.PF,s.DPF/Math.sqrt(1+s.THD**2),1e-10,'P75 PF identity for purely sinusoidal input voltage');
near(light.THD,1.15649281991947,3e-6,'P75 light-load THDi=115.65%');
near(light.PF,.6328408562925872,3e-6,'P75 light-load true PF');
assert.ok(light.DPF>s.DPF&&light.PF<s.PF,'P75 DPF can improve while true PF declines');
// P76 Crest factor must use whole-period AC source RMS, not DC average current.
near(s.CF,2.3050989678946063,3e-6,'P76 source-current crest factor');
near(light.CF,2.752022226956464,3e-6,'P76 light-load crest factor');
assert.ok(light.peak<s.peak&&light.CF>s.CF,
 'P76 higher CF does NOT imply higher actual current peak');
assert.ok(pages[76].pitfall.includes('平均值')||pages[76].pitfall.includes('Id'),
 'P76 average Id is not the crest-factor denominator');
console.log('PASS P73–76 fixed Vd source-Ls, numerical conduction angles and Fourier THD/DPF/PF/CF physical bounds');
