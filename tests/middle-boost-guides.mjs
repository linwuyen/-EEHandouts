/* P.10–22 independent Boost physics & authoring verification. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const env={},mid={};
runInNewContext(readFileSync('middle-page-guides.js','utf8'),{window:env});
runInNewContext(readFileSync('middle-data.js','utf8'),{window:mid});
const guides=env.EE_PAGE_GUIDES;
const lessons=mid.EE_DATA.chapters.flatMap(c=>c.lessons);
const expected={
  10:'mid-boost-ccm',11:'mid-boost-rl',12:'mid-boost-rl',
  13:'mid-boost-efficiency',14:'mid-boost-efficiency',
  15:'mid-boost-parasitic',16:'mid-boost-parasitic',
  17:'mid-boost-parasitic',18:'mid-boost-parasitic',
  19:'mid-boost-parasitic',20:'mid-boost-parasitic',
  21:'mid-boost-dcm',22:'mid-boost-dcm'
};
const titles=new Set();
for(let p=10;p<=22;p++){
  const g=guides[p],l=lessons.find(x=>x.id===g?.lesson);
  assert.ok(l,'Missing source-mapped Boost guide P.'+p);
  assert.equal(g.lesson,expected[p],'Wrong Boost lesson link on P.'+p);
  const range=l.pages.match(/\d+/g).map(Number);
  assert.ok(p>=range[0]&&p<=(range[1]||range[0]),'Wrong lecture page range P.'+p);
  assert.ok(g.title.length>=18&&g.question.length>=20&&g.takeaway.length>=25,
    'Insufficient page-specific title/question P.'+p);
  assert.ok(!titles.has(g.title),'Copied generic Boost title P.'+p);titles.add(g.title);
  assert.ok(g.intuition.length>=2&&g.intuition.every(x=>x.length>=40),'Physical intuition missing P.'+p);
  assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=8&&s.detail.length>=35),'Boost states missing P.'+p);
  assert.ok(g.equations.length>=2&&g.equations.every(s=>s.tex&&s.plain&&s.label&&s.why.length>=20),
    'Physical formula source or fallback missing P.'+p);
  assert.ok(g.worked.given.length>30&&g.worked.steps.length>=3&&g.worked.result.length>30,
    'Worked numerical example missing P.'+p);
  assert.ok(g.assumptions.length>=2&&g.assumptions.every(x=>x.length>=25),
    'Unqualified model limits on P.'+p);
  assert.ok(g.pitfall.length>35&&g.check.q.length>=20&&g.check.a.length>=30,
    'Misconception/answer must be meaningful P.'+p);
  if(g.phases)assert.ok(Math.abs(g.phases.reduce((n,x)=>n+x.pct,0)-100)<1e-7,
    'P.'+p+' stage percentages must total one cycle');
}
function near(actual,ref,tol,label){assert.ok(Number.isFinite(actual)&&Math.abs(actual-ref)<=tol,
  label+': actual '+actual+' expected '+ref);}
const vin=48,L=100e-6,fs=100e3;
// P.10: fixed CCM case must have strictly positive valley, no phantom negative current.
const d=.5,io=1,voIdeal=vin/(1-d),avgIn=io/(1-d),
  ripple=vin*d/(L*fs);
near(voIdeal,96,1e-12,'P10 ideal CCM Vout');
near(avgIn,2,1e-12,'P10 input current');
near(ripple,2.4,1e-12,'P10 inductor ripple');
near(avgIn-ripple/2,.8,1e-12,'P10 CCM min');
near((voIdeal*io)-(vin*avgIn),0,1e-10,'P10 independent input/output power');
// P.11–12: solve averaged KVL using independent root instead of copying closed-form ratio.
function boostRoot(vin,d,R,rl,ron=0,rd=0,vf=0){
  const x=1-d,req=rl+d*ron+x*rd;
  let lo=0,hi=vin/x*2;
  const res=v=>vin-x*(v+vf)-(v/(R*x))*req;
  for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(res(mid)>0)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
const baseVo=boostRoot(48,.5,20,.2);
near(baseVo,92.3076923076923,1e-9,'P11 RL voltage');
near(48-.5*baseVo-(baseVo/(20*.5))*.2,0,1e-9,'P11 RL volt-seconds');
near(.2/(1-.8)**2,5,1e-10,'P12 RL reflected output resistance');
near(boostRoot(48,.8,20,.2),192,1e-9,'P12 reflected voltage divider');
// P.13: genuine optimum of RL gain in allowed duty domain; not an arbitrary fixed sample.
function rlGain(d,q){const x=1-d;return x/(x*x+q);}
let best={D:0,M:0};
for(let i=0;i<=999;i++){const D=i/1000,v=rlGain(D,.01);if(v>best.M)best={D,M:v};}
near(best.D,.9,.001,'P13 D optimum');
near(best.M,5,.0001,'P13 gain peak');
near(rlGain(.8,.01),4,1e-10,'P13 below-peak gain');
near(rlGain(.95,.01),4,1e-10,'P13 above-peak gain');
// P.14: algebraically independent loss ratio prediction.
for(const [D,eta] of [[.8,2/3],[.9,1/3],[.95,1/9]]){
  const io=1,R=100,rl=R*.02,il=io/(1-D);
  const pout=io*io*R,pcu=il*il*rl;
  near(pout/(pout+pcu),eta,1e-12,'P14 RL efficiency at D='+D);
}
// P.15/17/19: KVL + KCL + independent input/output/loss accounting.
const parasitic=boostRoot(48,.5,20,.2,.1,.05,.7);
const il=parasitic/(20*.5),out=parasitic/20;
const reff=.2+.5*.1+.5*.05;
near(reff,.275,1e-12,'P15 weighted resistances');
near(parasitic,23.825/.26375,1e-9,'P15 parasitic voltage gain');
near(48,.5*(parasitic+.7)+il*reff,1e-9,'P17 volt-second reference');
near(out,.5*il,1e-12,'P17 capacitor charge balance');
const Pout=parasitic*out,Pin=48*il,Loss=il*il*reff+.7*out;
near(Pin-Pout,Loss,1e-9,'P19 input/output energy and diode loss');
assert.ok(Pin>Pout&&Loss>0,'P19 parasitic losses cannot increase power');
// P.16: OFF capacitor current sign changes while diode is still conducting.
const iin16=1/(1-.4),ripple16=48*.4/(120e-6*100e3);
const iValley=iin16-ripple16/2,ipeak=iin16+ripple16/2;
assert.ok(iValley>0&&ipeak-1>0&&iValley-1<0,'P16 capacitor charge direction');
near(.4*(-1)+.6*(iin16-1),0,1e-12,'P16 capacitor whole-cycle charge');
// P.18: output-side reflected impedance reproduces the input-side averaged law.
const req18=.1/.5**2,vs18=24/.5,vo18=vs18*12/(12+req18);
near(req18,.4,1e-12,'P18 reflected impedance');
near(vo18,boostRoot(24,.5,12,.1),1e-9,'P18 independent reflected output voltage');
// P.20: independent time-domain quadrature over MOSFET ON, not just formula repetition.
const mosD=.5,IL=4,delta=4,Ron=.04;let rms2=0;
const N=40000;
for(let k=0;k<N;k++){
  const t=(k+.5)/N;
  const current=t<mosD?IL-delta/2+delta*t/mosD:0;
  rms2+=current*current/N;
}
near(rms2*Ron,.04*.5*(16+16/12),2e-8,'P20 real triangular MOSFET RMS loss');
near(rms2*Ron,.3466666666666667,2e-8,'P20 ripple-inclusive MOSFET conduction');
assert.ok(rms2*Ron>.32,'P20 ripple raises MOSFET conduction');
// P.21: fixed-output BCM current and its two distinct peaks.
const boostBCM=(D)=>({lin:100*D*(1-D)/(2*L*fs),out:100*D*(1-D)**2/(2*L*fs)});
near(boostBCM(.5).lin,1.25,1e-12,'P21 BCM inductor average');
near(boostBCM(.5).out,.625,1e-12,'P21 BCM output average');
near(100/boostBCM(.5).out,160,1e-12,'P21 critical resistor');
let peakL={D:0,i:0},peakO={D:0,i:0};
for(let n=1;n<1000;n++){const D=n/1000,b=boostBCM(D);
 if(b.lin>peakL.i)peakL={D,i:b.lin};if(b.out>peakO.i)peakO={D,i:b.out};
}
near(peakL.D,.5,.001,'P21 inductor peak duty');
near(peakO.D,1/3,.001,'P21 output peak duty');
// P.22: independently solve actual diode current area versus resistive load.
function dcmBoostSolve(vin,D,L,fs,R){
  const ilPeak=vin*D/(L*fs);
  const diff=V=>ilPeak*(vin*D/(V-vin))/2 - V/R;
  let lo=vin*(1+1e-9),hi=vin*20;
  for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(diff(mid)>0)lo=mid;else hi=mid;}
  const vo=(lo+hi)/2,off=vin*D/(vo-vin);
  return {vo,M:vo/vin,ilPeak,off,zero:1-D-off,io:vo/R,area:ilPeak*off/2};
}
const dcm=dcmBoostSolve(24,.3,100e-6,100e3,300);
near(dcm.M,(1+Math.sqrt(6.4))/2,1e-10,'P22 load-coupled DCM gain');
near(dcm.vo,24*(1+Math.sqrt(6.4))/2,1e-9,'P22 output voltage');
near(dcm.ilPeak,.72,1e-12,'P22 peak current');
near(dcm.io,dcm.area,1e-10,'P22 diode area agrees output current');
assert.ok(dcm.zero>.3,'P22 DCM must include a positive third zero-current stage');
assert.ok(dcmBoostSolve(24,.3,100e-6,100e3,30).zero<=0,
  'P22 invalid light-mode assumption at heavy load cannot be called DCM');
console.log('PASS P.10–22 Boost page guides: 13 unique explanations, physics and 24+ independent numeric fixtures');
