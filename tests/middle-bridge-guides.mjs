/* Original, independent P.23–32 physical examples and page-source contracts. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const env={},course={};
runInNewContext(readFileSync('middle-page-guides.js','utf8'),{window:env});
runInNewContext(readFileSync('middle-data.js','utf8'),{window:course});
const g=env.EE_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const mapping={
  23:'mid-buckboost-ccm',24:'mid-buckboost-dcm',25:'mid-buckboost-dcm',
  26:'mid-sepic-zeta',27:'mid-four-switch',28:'mid-bidirectional',
  29:'mid-quadrants',30:'mid-motor-hbridge',31:'mid-bipolar',32:'mid-unipolar'
};
const titles=new Set();
for(let p=23;p<=32;p++){
  const x=g[p];assert.ok(x,'Missing original page guide P.'+p);
  const l=lessons.find(y=>y.id===x.lesson);
  assert.ok(l,'Missing existing lesson for P.'+p);
  assert.equal(x.lesson,mapping[p],'Incorrect source-page to lesson mapping P.'+p);
  const range=String(l.pages).match(/\d+/g).map(Number);
  assert.ok(range[0]<=p&&p<=(range[1]||range[0]),'Lecture source page range mismatch P.'+p);
  assert.ok(!titles.has(x.title),'Reused guide title P.'+p);titles.add(x.title);
  for(const name of ['title','question','takeaway','pitfall','tryIt'])
    assert.ok(typeof x[name]==='string'&&x[name].length>=16,'Thin '+name+' P.'+p);
  assert.ok(x.intuition.length>=2&&x.intuition.every(t=>t.length>=40),'Missing physical intuition P.'+p);
  assert.ok(x.steps.length>=3&&x.steps.every(t=>t.title.length>=8&&t.detail.length>=30),
    'Missing real signal/energy paths P.'+p);
  assert.ok(x.equations.length>=2&&x.equations.every(t=>t.tex&&t.plain&&t.label&&t.why.length>=20),
    'Formula source/fallback/assumptions P.'+p);
  assert.ok(x.worked.given.length>28&&x.worked.steps.length>=3&&x.worked.result.length>=30,
    'Missing stepwise numerical example P.'+p);
  assert.ok(x.assumptions.length>=2&&x.assumptions.every(t=>t.length>=24),
    'Missing operational/model scope P.'+p);
  assert.ok(x.check.q.length>=18&&x.check.a.length>=23,'Understanding question lacks answer P.'+p);
  if(x.phases)assert.ok(Math.abs(x.phases.reduce((s,v)=>s+v.pct,0)-100)<1e-8,
    'Exemplary PWM stages must total 100% P.'+p);
}
function near(actual,expected,tol,label){
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,
  label+': '+actual+' vs '+expected);
}
const Vin=24,D=.4,fs=100e3,L=100e-6;
// P23 independent ripple + separate input/diode current-time equations.
const VoMag=Vin*D/(1-D),Io=VoMag/8,IL=Io/(1-D),ILpp=Vin*D/(L*fs);
near(VoMag,16,1e-12,'P23 output magnitude');near(-VoMag,-16,1e-12,'P23 signed output');
near(ILpp,.96,1e-12,'P23 inductor ripple');
near(IL-ILpp/2,2.8533333333333335,1e-9,'P23 CCM valley');
near((Vin*D)*IL,VoMag*Io,1e-10,'P23 input/output energy');
// P24 BCM output diode triangle is NOT the full ON+OFF inductor area.
const bcmPeak=Vin*D/(L*fs),bcmOut=(1-D)*bcmPeak/2;
near(bcmPeak,.96,1e-12,'P24 BCM peak');
near(bcmOut,.288,1e-12,'P24 BCM diode-only output current');
near(VoMag/bcmOut,55.55555555555556,1e-9,'P24 critical load R');
assert.ok(Math.abs(bcmOut-bcmPeak/2)>.1,'P24 output must not use total inductor average');
// P25 solve Vout from two separately written DCM physical laws by bisection,
// not by using the authored closed-form gain.
function invertDcm(vin,d,L,fs,R){
 const peak=vin*d/(L*fs);
 const f=vo=>peak*(vin*d/vo)/2-vo/R;
 let lo=1e-9,hi=vin*10;
 for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
 const vo=(lo+hi)/2,diode=vin*d/vo;
 return {vo,peak,diode,zero:1-d-diode,io:vo/R,diodeArea:peak*diode/2};
}
const dcm=invertDcm(24,.3,100e-6,100e3,100);
near(dcm.vo,24*.3*Math.sqrt(5),1e-8,'P25 fixed-R DCM output');
near(dcm.peak,.72,1e-12,'P25 Ipk');
near(dcm.diode,.4472135954999579,1e-9,'P25 diode duty');
near(dcm.io,dcm.diodeArea,1e-12,'P25 capacitor charge balance');
assert.ok(dcm.zero>.25&&dcm.zero<.26,'P25 positive DCM idle');
assert.ok(invertDcm(24,.3,100e-6,100e3,20).zero<0,
  'P25 heavy-load false DCM must be rejected');
// P26 polarity and magnitude across distinct ideal topologies.
const gain=.4/(1-.4);near(-12*gain,-8,1e-12,'P26 Cuk signed output');
near(+12*gain,8,1e-12,'P26 SEPIC/ZETA positive output');
near(12*.6/(1-.6),18,1e-12,'P26 D=.6 gain');
// P27 independent piecewise circuit node differences and volt-seconds.
function voltsAndDelta(states,L,fs){
 let voltSeconds=0,positive=0,negative=0;
 for(const s of states){const vl=s.a-s.b,dt=s.share/fs;
  voltSeconds+=vl*dt; if(vl>0)positive+=vl*dt/L;
  if(vl<0)negative+=vl*dt/L;}
 return {voltSeconds,positive,negative};
}
// Read the worked states, then independently infer node voltages from the conducting pair.
const authoredStates=g[27].worked.steps.flatMap(s=>{
 const m=s.replaceAll('−','-').match(/(Q[12]p?)[、/](Q[12]p?) 導通.*?vSW,L=([+-]?[\d.]+)\s*V.*?vSW,R=([+-]?[\d.]+)\s*V.*?vL=([+-]?[\d.]+)\s*V.*?diL\/dt=([+-]?[\d.]+)\s*A\/µs.*?t=([\d.]+)\s*µs/);
 return m?[{on:[m[1],m[2]],a:Number(m[3]),b:Number(m[4]),vl:Number(m[5]),slope:Number(m[6]),us:Number(m[7])}]:[];
});
assert.equal(authoredStates.length,3,'P27 main example must resolve all three dual-carrier states');
const seenPairs=new Set();
for(const state of authoredStates){
 assert.equal(state.on.filter(q=>q.startsWith('Q1')).length,1,'P27 one conducting switch in left arm');
 assert.equal(state.on.filter(q=>q.startsWith('Q2')).length,1,'P27 one conducting switch in right arm');
 const a=state.on.includes('Q1')?24:0,b=state.on.includes('Q2p')?24:0;
 near(state.a,a,1e-12,'P27 left midpoint follows conducting switch');
 near(state.b,b,1e-12,'P27 right midpoint follows conducting switch');
 near(state.vl,a-b,1e-12,'P27 authored vL is left minus right');
 near(state.slope,(a-b)/100e-6*1e-6,1e-12,'P27 authored current slope follows L di/dt');
 seenPairs.add(state.on.join('/'));
}
assert.deepEqual([...seenPairs].sort(),['Q1/Q2','Q1/Q2p','Q1p/Q2p'].sort(),
 'P27 includes positive, transfer and negative voltage states');
near(authoredStates.reduce((sum,s)=>sum+s.us,0),10,1e-12,'P27 intervals fill one 100 kHz period');
const dualCarrier=voltsAndDelta(authoredStates.map(s=>({...s,share:s.us/10})),100e-6,100e3);
near(dualCarrier.voltSeconds,0,1e-15,'P27 three-state volt-second closure');
near(dualCarrier.positive,.24,1e-12,'P27 red pulse current rise');
near(dualCarrier.negative,-.24,1e-12,'P27 green pulse current fall');
// P28 both passive-power signs and input-source balancing.
const batV=24,busV=48;
for(const ibat of [5,-5]){
 const pbat=batV*ibat,pbus=-pbat,ibus=pbus/busV;
 near(pbus+pbat,0,1e-12,'P28 energy balance');
 near(Math.abs(ibus),2.5,1e-12,'P28 bus current magnitude');
 assert.equal(Math.sign(pbat),Math.sign(ibat),'P28 charging/discharging polarity');
}
// P29 signed voltage/current quadrants independently.
const cases=[{v:100,i:2,p:200},{v:-100,i:2,p:-200},
 {v:-100,i:-2,p:200},{v:100,i:-2,p:-200}];
for(let k=0;k<cases.length;k++)
 near(cases[k].v*cases[k].i,cases[k].p,1e-12,'P29 quadrant '+(k+1));
// P30 direct voltage balance (not a steady V=IR assumption).
const vAB=(1-0)*48,di=(vAB-2*5-30)/.01;
near(di,800,1e-12,'P30 motor instantaneous di/dt');
near(di*.001,.8,1e-12,'P30 equivalent one-ms slope');
// P31 direct trapezoidal PWM average and voltage-driven current closure.
const dc=100,positiveShare=.7,period=1/20e3,backdrop=40,la=.001;
const pAvg=dc*positiveShare-dc*(1-positiveShare);
near(pAvg,40,1e-12,'P31 bipolar average');
near((dc-backdrop)*positiveShare*period/la,2.1,1e-12,'P31 positive current ramp');
near((-dc-backdrop)*(1-positiveShare)*period/la,-2.1,1e-12,'P31 negative ramp');
near(dc-(-dc),200,1e-12,'P31 full bus differential step');
// P32: each reference crosses the up/down carrier twice per period.
const DA=.7,DB=.3,N=20000;let total=0,zero=0,positive=0,negative=0,pulses=0;
let current=0,minimum=0,maximum=0,lastV=0;
for(let k=0;k<N;k++){
 const t=(k+.5)/N,carrier=2*Math.min(t,1-t);
 const SA=carrier<DA?1:0,SB=carrier<DB?1:0,v=(SA-SB)*dc;
 if(v>0&&lastV===0)pulses++;
 total+=v/N;if(v===0)zero++;else if(v>0)positive++;else negative++;
 current+=(v-backdrop)*(period/N)/la;
 minimum=Math.min(minimum,current);maximum=Math.max(maximum,current);lastV=v;
}
near(total,40,1e-8,'P32 two-arm average');
near(positive/N,.4,1e-10,'P32 +bus duration');
near(zero/N,.6,1e-10,'P32 differential zero duration');
assert.equal(negative,0,'P32 positive unipolar command must not create a negative state');
assert.equal(pulses,2,'P32 symmetric carrier produces two +100V pulses per carrier period');
near((positive/N/pulses)*period,10e-6,1e-12,'P32 each positive pulse lasts 10 µs');
near(current,0,1e-10,'P32 motor current closes over the full carrier period');
near(maximum-minimum,.6,1e-10,'P32 peak-to-peak motor current ripple is 0.6 A');
console.log('PASS P.23–32 middle guides: 10 source-linked explanations and independent CCM/BCM/DCM, H-Bridge, motor/PWM fixtures');
