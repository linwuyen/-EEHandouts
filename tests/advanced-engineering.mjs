/* Independent power-stage, timing and control contracts; no self-derived expected assertions. */
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
const view={};
runInNewContext(readFileSync('advanced-models.js','utf8'),{window:view});
const {catalog,params,calculate}=view.EE_ADVANCED_MODELS;
function near(actual,expect,tol,label){assert.ok(Number.isFinite(actual),label+' must be finite');assert.ok(Math.abs(actual-expect)<=tol,label+': '+actual+' != '+expect);}
function checkWave(id,r){for(const s of r.traces){assert.ok(s.values.every(Number.isFinite),id+' invalid trace '+s.key);assert.ok(s.values.length>=2,id+' empty trace '+s.key);}}
assert.deepEqual(Object.keys(catalog).sort(),['llc','loop','nonideal','pfc','psfb','timing','zvs'].sort());
for(const id of Object.keys(catalog)){
 const cfg=catalog[id];assert.ok(cfg.title&&cfg.source&&cfg.knobs.length>=4,id+' incomplete metadata');
 const p=params(id);for(const k of cfg.knobs){assert.ok(k.min<=p[k.key]&&p[k.key]<=k.max);}
 const result=calculate(id);assert.equal(result.validity,true,id+' must have usable default');checkWave(id,result);
}
const ccm=calculate('pfc'),dcm=calculate('pfc',{phase:5,power:100,l:800});
assert.equal(ccm.mode,'CCM');assert.equal(dcm.mode,'DCM');assert.ok(ccm.data.valley>0&&dcm.data.zero>0);
for(const r of [ccm,dcm]){
 near(r.data.on+r.data.freewheel+r.data.zero,1,1e-10,'PFC stage sum');
 near(r.data.pin,r.data.pout,1e-7,'PFC power conservation');
 near(r.traces[1].values[0],r.traces[1].values.at(-1),1e-10,'PFC periodic boundary');
}
const pfcParams=params('pfc',{phase:5,power:100,l:800});
const rect=Math.SQRT2*pfcParams.vac*Math.sin(Math.PI*pfcParams.phase/180);
const inputRef=pfcParams.power*rect/(pfcParams.vac**2);
near(dcm.data.iref,inputRef,1e-11,'ideal sinusoidal current reference');
near(dcm.data.peak*(dcm.data.on+dcm.data.freewheel)/2,inputRef,1e-10,'DCM trapezoid area');
const phase90=calculate('psfb'),phase30=calculate('psfb',{phase:30}),psfbDCM=calculate('psfb',{io:.1,phase:90});
assert.equal(phase90.mode,'CCM');assert.equal(psfbDCM.mode,'DCM');
near(phase90.data.vo,400/8*.5,1e-12,'PSFB ideal rectified mean');
near(phase30.data.d,1/6,1e-12,'PSFB effective duty');
near(phase90.data.pin,phase90.data.pout,1e-10,'PSFB energy transfer');
near(psfbDCM.data.pin,psfbDCM.data.pout,1e-8,'PSFB DCM power');
assert.ok(psfbDCM.data.zero>0&&psfbDCM.data.valley===0);
near(phase90.traces[2].values[0],400,1e-12,'PSFB primary positive pulse');
near(phase90.traces[2].values[120],-400,1e-12,'PSFB primary negative pulse');
const tank=calculate('llc'),tankSlow=calculate('llc',{fs:60,lr:10,cr:40,lm:60,rdc:4});
near(tank.data.f0,1/(2*Math.PI*Math.sqrt(20e-6*100e-9)),1e-6,'LLC resonance');
assert.ok(tank.data.vo>0&&tank.data.avgIn>0);
assert.ok(tank.data.periodicityError<=.02,'Default LLC must close all tank states over a switching period');
assert.ok(tank.data.energyCycleError<=.02,'Default LLC period energy drift is bounded');
assert.ok(Math.abs(tank.traces[1].values.at(-1)-tank.traces[1].values[0])<=.02*Math.max(.05,...tank.traces[1].values.map(Math.abs)),
  'Reported periodic LLC tank current must close at t/T=1');
assert.ok(Math.abs(tank.data.energyResidual)<Math.max(1,tank.data.avgIn*.02),'LLC energy residual');
assert.ok(Math.abs(tankSlow.data.energyResidual)<Math.max(1,tankSlow.data.avgIn*.02),'LLC low-frequency residual');
// Numerical stiffness counterexamples (high Rac/Lr): explicit RK4 used to overflow.
for(const v of [
  {vin:250,fs:120,lr:10,cr:40,lm:240,rdc:18,n:10},
  {vin:275,fs:200,lr:15,cr:80,lm:260,rdc:30,n:11},
  {vin:425,fs:60,lr:10,cr:160,lm:200,rdc:26,n:8}
]){
  const r=calculate('llc',v);
  assert.ok(r.traces.every(t=>t.values.every(Number.isFinite)),'LLC stiff traces must remain finite');
  assert.ok(Number.isFinite(r.data.periodicityError)&&Number.isFinite(r.data.energyCycleError),
    'LLC stiff tank must report finite state/energy closure');
  if(r.validity){
    assert.ok(r.data.periodicityError<=.02&&r.data.energyCycleError<=.02&&r.data.avgIn>0,
      'LLC stiff tank may only be called steady once all closure conditions pass');
    assert.ok(Math.abs(r.data.energyResidual)<Math.max(.1,r.data.avgIn*.02),'LLC valid energy residual');
  }else{
    assert.equal(r.mode,'UNSETTLED','Unsettled stiffness must never carry a valid operating-mode label');
    assert.ok(Number.isNaN(r.metrics[2].value),'Unsettled LLC must hide estimated Vout');
  }
}
assert.ok(Math.abs(tank.data.avgLoad-tank.data.fhaPower)>0.01,
  'Equivalent resistor absorbs harmonics; FHA first-harmonic DC estimate must not be mislabeled actual output power');
assert.ok(tank.warning.includes('高次諧波'),'Must disclose FHA harmonics versus total resistor power');
const edgeTank=calculate('llc',{fs:200,lr:60,cr:200,lm:60,rdc:32});
assert.ok(Number.isFinite(edgeTank.data.periodicityError),'Edge tank closure metric must be finite');
if(edgeTank.data.periodicityError>.02||edgeTank.data.energyCycleError>.02||edgeTank.data.avgIn<=0){
  assert.equal(edgeTank.validity,false,'Power balance alone cannot make an unsettled LLC valid');
  assert.equal(edgeTank.mode,'UNSETTLED');
  assert.ok(Number.isNaN(edgeTank.metrics[2].value),'Out-of-domain LLC must not report valid Vout');
}
assert.equal(tank.traces[0].step,true);assert.ok(tank.traces[1].values.some(x=>x<0)&&tank.traces[1].values.some(x=>x>0),'LLC tank current reverses');
const bode=calculate('loop');assert.ok(bode.data.ccm&&bode.data.crossovers.length>0);
assert.ok(bode.data.points.every((p,i,a)=>i===0||p.f>a[i-1].f),'Bode frequency must rise');
assert.ok(Number.isFinite(bode.data.pm),'Bode phase margin exists at default');
const invalidBode=calculate('loop',{r:24,l:20,fs:50});
assert.equal(invalidBode.validity,false,'DCM outside CCM small-signal plant');
assert.ok(Number.isNaN(invalidBode.metrics[0].value),'Invalid CCM plant must not show crossover as valid');
const schedule=calculate('timing');near(schedule.data.tbprd,500,0,'TBPRD 100MHz/100kHz updown');
near(schedule.data.T,10,1e-12,'PWM period 100kHz');
near(schedule.data.soc,1.75,1e-12,'CMPA UP trigger');
near(schedule.data.eoc,2.175,1e-9,'ADC EOC');
near(schedule.data.load,10,1e-12,'Next ZERO load');
assert.ok(schedule.data.load>schedule.data.finish);
assert.equal(calculate('timing',{soca:'ZERO',shadow:'ZERO',fs:200,isr:30000}).mode,'CPU_OVERRUN');
const buck=calculate('nonideal'),ideal=calculate('nonideal',{rh:0,rl:0,dcr:0,dead:0,esr:0,esum:0});
assert.ok(buck.data.vo<buck.data.ideal);assert.ok(buck.data.ripple>0&&buck.data.rV>0);
near(buck.data.energyError,0,1e-9,'Nonideal loss and input/output energy');
near(ideal.data.vo,24,1e-10,'Zero-loss ideal limit');
assert.ok(buck.traces.every(s=>s.values.length===241),'Buck common time grid');
assert.equal(calculate('nonideal',{dead:800,fs:200,duty:10}).validity,false,'Dead time invalid gate overlap');
const soft=calculate('zvs'),enough=calculate('zvs',{ip:15}),none=calculate('zvs',{ip:0});
assert.equal(soft.mode,'INSUFFICIENT');assert.equal(enough.mode,'ENERGY_AND_TIME');assert.equal(none.mode,'INSUFFICIENT');
assert.ok(Number.isNaN(none.metrics[3].value),'zero current has no finite commutation time');
assert.equal(none.traces.length,1,'Zero-current ZVS time must not be drawn as an immediate 0 ns commutation');
console.log('ADVANCED ENGINEERING PASS: 7 models, PFC/LLC/PSFB power balance, Bode, PWM timing, loss and ZVS edges');