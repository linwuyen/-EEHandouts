/* Independent numerical fixtures for the lesson-level educational models. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const window={};
runInNewContext(readFileSync('interactive-lessons.js','utf8'),{window});
const {models,catalog}=window.EE_INTERACTIVE;
function eq(actual,expected,tolerance,label){
  assert.ok(Number.isFinite(actual),label+' must be finite');
  assert.ok(Math.abs(actual-expected)<=tolerance,label+': '+actual+' != '+expected);
}
function make(name,overrides={}){
  const m=models[name],params=Object.fromEntries(m.knobs.map(k=>[k.key,k.value]));
  return m.compute(Object.assign(params,overrides));
}
function isPositive(arr){
  assert.ok(arr.every(x=>x>=-1e-9),'A nonsynchronous magnetizing/inductor current cannot reverse');
}
assert.equal(Object.keys(catalog).length,72);
assert.ok(Object.keys(models).length>=40);
for(const [id,[model,key,focus,index]] of Object.entries(catalog)){
  assert.ok(models[model],'missing model for '+id);
  assert.ok(models[model].knobs.some(k=>k.key===focus),'invalid focus '+id);
  const out=make(model);
  assert.ok(Number.isFinite(out.metrics[index||0].value),'invalid main metric '+id);
  assert.ok(typeof models[model].assumption==='string' && models[model].assumption.length>=20,'missing model assumptions '+id);
}
const ccm=make('buck',{vin:24,duty:50,l:100,freq:100,io:2});
assert.equal(ccm.mode,'CCM');eq(ccm.metrics[0].value,12,1e-8,'Buck CCM Vo');eq(ccm.metrics[1].value,2.3,1e-8,'Buck CCM IL peak');
const dcm=make('buck',{vin:24,duty:50,l:100,freq:100,io:0.1});
assert.equal(dcm.mode,'DCM');eq(dcm.metrics[0].value,18,1e-8,'Buck DCM Vo');
isPositive(dcm.series.find(x=>x.label==='IL').points);
eq(dcm.stage.on+dcm.stage.freewheel+dcm.stage.zero,1,1e-8,'Buck 3 stages');
const bcm=make('buck',{vin:24,duty:50,l:100,freq:100,io:0.3});
assert.equal(bcm.mode,'BCM');
const bc=make('boost',{vin:48,duty:50,l:100,freq:100,io:2});
assert.equal(bc.mode,'CCM');eq(bc.metrics[0].value,96,1e-8,'Boost CCM Vo');
const bd=make('boost',{vin:48,duty:50,l:100,freq:100,io:0.2});
assert.equal(bd.mode,'DCM');eq(bd.metrics[0].value,192,1e-8,'Boost DCM Vo');
isPositive(bd.series.find(x=>x.label==='IL').points);
const bbd=make('buckboost',{vin:24,duty:40,l:100,freq:100,io:0.1});
assert.equal(bbd.mode,'DCM');eq(bbd.metrics[0].value,-46.08,1e-6,'Inverting Buck Boost DCM Vo');
const fb=make('flyback',{vin:96,duty:40,ratio:2,lm:200,freq:100,io:0.1});
assert.equal(fb.mode,'DCM');isPositive(fb.series.find(x=>x.label==='磁化電流').points);
for(const modelName of ['buck','boost','buckboost','flyback']){
 const output=make(modelName,{io:modelName==='boost'?2:2});
 if(output.mode==='CCM'){
   const series=output.series.find(x=>x.label==='IL'||x.label==='磁化電流');
   eq(series.points[0],series.points[100],1e-6,modelName+' switching period continuity');
 }
}
const fwd=make('forward',{vin:100,vreset:100,duty:70,freq:100});
assert.ok(fwd.metrics[0].value<0,'Forward must report inadequate reset');
assert.ok(fwd.warning?.includes('去磁失敗'),'Forward must warn when volt-seconds do not reset');
const bri=make('bridge',{da:75,db:25,bipolar:0});
const brb=make('bridge',{da:75,db:25,bipolar:1});
eq(bri.metrics[3].value,0,1e-8,'Unipolar late period zero state');
eq(brb.metrics[3].value,-100,1e-8,'Bipolar late period negative voltage');
const opto=make('optocoupler',{if:5,ctr:100});
eq(opto.primary,5,1e-8,'Optocoupler CTR');
const diode=make('scr',{vac:48,alpha:180});
eq(diode.primary,0,1e-8,'SCR 180 degrees no conduction');
const cap=make('capRipple',{cap:220,load:3});
assert.ok(cap.warning,'Large ripple approximation must be flagged');
const adc=make('adc',{i:30,gain:20});
assert.ok(Number.isNaN(adc.metrics[1].value),'Out-of-range ADC must not present a valid code');
assert.ok(adc.warning,'Out-of-range ADC must warn');
console.log('PASS independent interactive model fixtures: 72 lessons, 40 models, CCM/DCM, Forward, bridge, SCR, CTR, ADC');
