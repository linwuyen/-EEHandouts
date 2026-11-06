import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const path='workbench/12_opamp_slew_rate/assets/opamp.js';
assert.ok(existsSync(path),'original OP numerical owner must be imported');
const c={console};vm.createContext(c);vm.runInContext(readFileSync(path,'utf8'),c);const M=c.CircuitOpampSimulator;
const near=(actual,want,eps=1e-10)=>assert.ok(Math.abs(actual-want)<=eps*Math.max(1,Math.abs(want)),`${actual} != ${want}`);
const tau=1/(2*Math.PI*2.5);
for(const step of [8,-8,0]){
 const m=M.calculateMetrics({step,srp:20,srn:.2,gbw:5,gain:2,tol:.1},'step');
 near(m.slewUs,step===8?.4:step===-8?40:0);near(m.tauUs,tau);
 const A=Math.abs(step),sr=step>=0?20:.2,band=A*.001,threshold=sr*tau;
 const ramp=Math.max(0,(A-threshold)/sr);
 const settling=A===0?0:band>=threshold?(A-band)/sr:ramp+tau*Math.log(Math.min(A,threshold)/band);
 near(m.settleUs,settling);assert.equal(m.stepDirection,step>0?'POSITIVE':step<0?'NEGATIVE':'ZERO');
 const trace=M.simulate(m,'step');assert.equal(trace.actual.length,900);
 for(let i=0;i<900;i++){
  const age=Math.max(0,trace.timeUs[i]-trace.stepStartUs);
  const expected=age<=ramp?Math.sign(step)*sr*age:step-Math.sign(step)*Math.min(A,threshold)*Math.exp(-(age-ramp)/tau);
  near(trace.actual[i],expected);assert.ok(Number.isFinite(trace.actual[i]));
  if(i){const slope=(trace.actual[i]-trace.actual[i-1])/trace.dtUs;assert.ok(slope<=20+1e-9&&slope>=-.2-1e-9,'directional rate limit');}
 }
}
const small=M.calculateMetrics({step:.5,srp:20,srn:20,gbw:.5,gain:20,tol:1},'step');
assert.ok(Math.abs(small.step)<small.activeStepSr*small.tauUs);near(small.settleUs,Math.log(100)*small.tauUs);
const sine=M.calculateMetrics({fKHz:100,vpp:10,srp:4.1,srn:4.1,gbw:20,gain:1},'sine');
near(sine.required,Math.PI);near(sine.margin,4.1/Math.PI);near(sine.fpbw,4.1e6/(2*Math.PI*5)/1000);assert.equal(sine.slewLimited,false);
const limiting=M.calculateMetrics({...sine,srn:.2},'sine');assert.equal(limiting.slewLimited,true);
for(const m of [sine,limiting]){const t=M.simulate(m,'sine');assert.equal(t.timeUs.length,900);for(const v of [...t.cmd,...t.filtered,...t.actual])assert.ok(Number.isFinite(v));}
console.log('PASS unchanged OP owner: signed/zero step, directional rate bound, exact ramp/tail, linear settling, sine SR/FPBW/margin and finite traces');
