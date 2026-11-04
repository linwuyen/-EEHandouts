/* F05: independent ODE fixtures, not values derived from the implementation. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {performance} from 'node:perf_hooks';
const view={};
runInNewContext(readFileSync('advanced-models.js','utf8'),{window:view});
const model=view.EE_ADVANCED_MODELS;
const reference=JSON.parse(readFileSync('tests/fixtures/llc-linear-reference.json','utf8'));
const near=(got,want,label)=>assert.ok(Number.isFinite(got)&&Math.abs(got-want)<=1e-5*(1+Math.abs(want)),`${label}: ${got} vs independent ${want}`);
let maximumMs=0,validCount=0;
for(const [caseIndex,fixture] of reference.fixtures.entries()){
  const began=performance.now(),result=model.calculate('llc',fixture.params);
  const ms=performance.now()-began;maximumMs=Math.max(maximumMs,ms);
  assert.ok(ms<1500,'LLC bounded evaluation budget, case '+caseIndex+': '+ms+'ms');
  const trace=Object.fromEntries(result.traces.map(t=>[t.key,t.values]));
  // First assertion deliberately names the reviewed false-ringing counterexample.
  if(caseIndex===0)near(trace.vp[121],-188.14199952889223,'F05 vp 41.666667ns after negative edge');
  for(const sample of fixture.samples)for(const field of ['ir','im','vcr','vp'])
    near(trace[field][sample.index],sample[field],`case ${caseIndex}, ${field}, phase ${sample.index}/240`);
  for(const field of ['vo','avgIn','avgLoad','energyDrift'])near(result.data[field],fixture.metrics[field],`case ${caseIndex} integral ${field}`);
  assert.ok(result.data.quadratureConverged,'No valid-looking result after numeric integration budget failure');
  if(result.validity){
    validCount++;
    assert.ok(result.data.periodicityError<=.02&&result.data.energyCycleError<=.02,'Keep original settling gates');
    near(result.metrics[3].value,fixture.metrics.irRms,'reported full-period resonant RMS');
    near(result.metrics[4].value,fixture.metrics.imRms,'reported full-period magnetizing RMS');
  }else{
    assert.equal(result.mode,'UNSETTLED');
    assert.ok(Number.isNaN(result.metrics[2].value),'Unsettled DC estimate stays hidden');
  }
  assert.ok(Math.abs(result.data.energyResidual)<1e-5*(1+Math.abs(result.data.avgIn)),
    'Independent power integrands and state energy must agree');
}
assert.ok(model.calculate('llc').validity,'Default operating point remains usable');
console.log(`PASS F05: ${reference.fixtures.length} independent transient-waveform/integral fixtures; ${validCount} settled; worst ${maximumMs.toFixed(1)}ms`);
