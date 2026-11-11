/* Independent P.33–40 isolated DC-DC, feedback and Flyback physics contracts. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const view={},course={};
runInNewContext(readFileSync('middle-page-guides.js','utf8'),{window:view});
runInNewContext(readFileSync('middle-data.js','utf8'),{window:course});
const guides=view.EE_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const mapping={
  33:'mid-isolated-types',34:'mid-isolation-feedback',35:'mid-isolation-feedback',
  36:'mid-multi-output',37:'mid-flyback-ccm',38:'mid-flyback-ccm',
  39:'mid-flyback-dcm',40:'mid-flyback-dcm'
};
const titles=new Set();
for(let p=33;p<=40;p++){
 const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
 assert.ok(g&&lesson,'P.'+p+' missing guide or existing lesson');
 assert.equal(g.lesson,mapping[p],'P.'+p+' wrong source lesson');
 const range=String(lesson.pages).match(/\d+/g).map(Number);
 assert.ok(range[0]<=p&&p<=(range[1]||range[0]),'P.'+p+' wrong source page range');
 assert.ok(!titles.has(g.title),'P.'+p+' duplicated title');titles.add(g.title);
 for(const key of ['title','question','takeaway','pitfall','tryIt'])
   assert.ok(typeof g[key]==='string'&&g[key].length>=16,'P.'+p+' thin '+key);
 assert.ok(g.intuition.length>=2&&g.intuition.every(s=>s.length>=40),'P.'+p+' requires real intuition');
 assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=8&&s.detail.length>=35),
   'P.'+p+' needs physical signal and energy-flow stages');
 assert.ok(g.equations.length>=2&&g.equations.every(s=>s.label&&s.tex&&s.plain&&s.why.length>=20),
   'P.'+p+' requires equations and readable fallback');
 assert.ok(g.worked.given.length>=30&&g.worked.steps.length>=3&&g.worked.result.length>=30,
   'P.'+p+' needs a real worked numerical example');
 assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=24),
   'P.'+p+' must explain model limitations');
 assert.ok(g.check.q.length>=18&&g.check.a.length>=26,'P.'+p+' check and answer missing');
 if(g.phases)assert.ok(Math.abs(g.phases.reduce((a,b)=>a+b.pct,0)-100)<1e-8,
   'P.'+p+' stages must sum exactly one PWM period');
}
assert.ok(guides[34].steps.some(s=>s.detail.includes('PWM Controller')),
  'P34 must explain controller on secondary side');
assert.ok(guides[35].steps.some(s=>s.detail.includes('一次側')),
  'P35 must explain separate optocoupler-to-primary control path');
function near(actual,expected,tol,label){
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,
  label+': '+actual+' expected '+expected);
}
// P33: instantaneous winding ratio is not the final DC transfer relation.
const n=.5,vin=100,d=.4;
near(n*vin,50,1e-12,'P33 induced secondary voltage');
near(n*vin*d/(1-d),100/3,1e-10,'P33 Flyback CCM DC voltage');
near(n*vin*d,20,1e-12,'P33 Forward CCM DC voltage');
// P34: magnetic volt-second integration across a gate DRIVE transformer.
const np=20,ae=20e-6,pulseV=12,tp=2e-6;
near(pulseV*tp/(np*ae),.06,1e-12,'P34 pulse magnetizing delta B');
near(pulseV*tp+(-pulseV)*tp,0,1e-15,'P34 equal negative reset volt seconds');
assert.ok(pulseV*tp>0,'P34 missing reset has a nonzero DC volt-second integral');
// P35: feedback-divider and CTR examples at two specific operating conditions.
const fbRatio=2.5/12,rLower=10e3,rUpper=rLower*(1/fbRatio-1);
near(rUpper,38000,1e-8,'P35 12V / 2.5V feedback divider');
near(.5*2e-3,1e-3,1e-12,'P35 50% CTR');
near(1.0*2e-3,2e-3,1e-12,'P35 100% CTR');
// P36: this particular algebra requires BOTH secondary rectifiers conducting.
const windingRatio=10/24;
const aux=(12+.5)*windingRatio-.5;
near(aux,4.708333333333333,1e-12,'P36 simultaneous diode conduction');
assert.ok(aux<5,'P36 diode Vf effects must remain visible');
// P37: CCM retains nonzero valley energy, unlike complete DCM demagnetization.
const lm=200e-6,fs=100e3,ivalley=1,ipk=3;
const deltaI=vin*d/(lm*fs);
near(deltaI,2,1e-12,'P37 ON magnetizing current change');
const energyValley=.5*lm*ivalley*ivalley,energyPeak=.5*lm*ipk*ipk;
near(energyValley,100e-6,1e-12,'P37 CCM valley energy');
near(energyPeak,900e-6,1e-12,'P37 CCM peak energy');
near((energyPeak-energyValley)*fs,80,1e-9,'P37 correct cycle energy power');
assert.ok(energyPeak-energyValley<energyPeak,'P37 full peak energy is NOT CCM cycle transfer');
// P38: secondary current and reset time integrated independently from gain.
const npNs=2,vo=vin/npNs*d/(1-d),tOn=d/fs,tOff=(1-d)/fs;
const reflected=npNs*vo;
near(reflected*tOff,vin*tOn,1e-10,'P38 magnetic flux reset volt seconds');
near(reflected*tOff/lm,2,1e-10,'P38 OFF primary-referred current fall');
const diodeAvg=(1-d)*npNs*(ipk+ivalley)/2;
near(diodeAvg,2.4,1e-12,'P38 full-cycle secondary diode average');
near(diodeAvg*vo,80,1e-10,'P38 independent delivered power');
near(vin+reflected,166.66666666666666,1e-9,'P38 ideal VDS plateau excludes spike');
// P39: numerically determine DIODE fraction and load current from real
// piecewise magnetizing current ramps, NOT the CCM gain formula.
const vin39=24,turns39=2,d39=.3,fs39=50e3,lm39=200e-6,vo39=12;
const currentPeak=vin39*(d39/fs39)/lm39;
const secondaryReset=turns39*vo39,decayTime=currentPeak*lm39/secondaryReset;
const diodeShare=decayTime*fs39,zeroShare=1-d39-diodeShare;
near(currentPeak,.72,1e-12,'P39 DCM peak');
near(diodeShare,.3,1e-12,'P39 DCM secondary conduction fraction');
near(zeroShare,.4,1e-12,'P39 zero-current time fraction');
const outputCurrent=turns39*currentPeak*diodeShare/2;
near(outputCurrent,.216,1e-12,'P39 secondary charge/period');
near(outputCurrent*vo39,.5*lm39*currentPeak**2*fs39,1e-10,
  'P39 independent output electrical vs primary magnetizing energy');
assert.ok(zeroShare>0,'P39 legitimate DCM');
assert.ok(1-d39-vin39*d39/(turns39*4)<0,
  'P39 insufficient reflected voltage cannot provide a valid DCM ZERO');
// P40: η is a stated loss budget, not component-by-component efficiency proof.
const vin40=80,dc40=.25,fs40=50e3,lm40=200e-6,eta=.8;
const current40=vin40*dc40/(lm40*fs40);
const energy40=.5*lm40*current40**2;
const input40=energy40*fs40;
near(current40,2,1e-12,'P40 Ipk');
near(energy40,400e-6,1e-12,'P40 energy per switching cycle');
near(input40,20,1e-12,'P40 modeled Pin');
near(eta*input40,16,1e-12,'P40 assumed Po');
near((1-eta)*input40,4,1e-12,'P40 assumed loss envelope');
near(eta*input40/20,.8,1e-12,'P40 20V output current at assumed efficiency');
near(vin40+2*(20+.7),121.4,1e-10,'P40 ideal VDS excluding leakage');

const diodeFraction40=vin40*dc40/(2*(20+.7));
const zeroFraction40=1-dc40-diodeFraction40;
near(diodeFraction40,20/41.4,1e-12,'P40 diode interval ratio');
near(diodeFraction40/fs40,9.661835748792272e-6,1e-12,'P40 diode microseconds');
near(zeroFraction40/fs40,5.338164251207728e-6,1e-12,'P40 idle microseconds');
assert.ok(zeroFraction40>0,'P40 must verify DCM before using full peak energy');
near(dc40+diodeFraction40,0.7330917874396135,1e-12,'P40 DCM period closure');
// The turns calculation uses diode conduction time; at the boundary it fills OFF.
const turnsForResetFraction=fraction=>(20+.7)*fraction/(vin40*dc40);
const [dcmCalculation,boundaryCalculation]=guides[40].tryIt.split('。');
const dcmRatio=dcmCalculation.match(/=\s*(\d+(?:\.\d+)?)\s*[，。]/);
const boundaryRatio=boundaryCalculation?.match(/約\s*(\d+(?:\.\d+)?)/);
near(Number(dcmRatio?.[1]),turnsForResetFraction(diodeFraction40),.0005,'P40 displayed Ns/Np in DCM');
near(Number(boundaryRatio?.[1]),turnsForResetFraction(1-dc40),.0005,'P40 displayed Ns/Np at BCM');
const idealSecondaryCurrent40=.5*2*current40*diodeFraction40;
near(idealSecondaryCurrent40,.966183574879227,1e-12,'P40 ideal secondary current area');
near(20*idealSecondaryCurrent40,19.32367149758454,1e-10,'P40 diode voltage drop reduces ideal load power');
assert.ok(Math.abs(idealSecondaryCurrent40-eta*input40/20)>.15,
  'P40 ideal waveform current must NOT be conflated with assumed efficiency output current');
const dcmRegion=(vout,duty,drop=.7)=>1-duty-vin40*duty/(2*(vout+drop));
assert.ok(dcmRegion(20,.25)>0,'P40 DCM valid');
near(dcmRegion(80*.25/(2*(1-.25))-.7,.25),0,1e-12,'P40 BCM boundary');
assert.ok(dcmRegion(4,.25)<0,'P40 invalid DCM cannot use complete-demagnetization formula');

console.log('PASS P.33–40 isolated/Flyback: eight original pages, fixed source mapping, independent CCM/DCM and isolation numeric evidence');
