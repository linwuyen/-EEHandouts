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
assert.equal(Object.keys(models).length,47);
for(const [id,[model,key,focus,index]] of Object.entries(catalog)){
  assert.ok(models[model],'missing model for '+id);
  assert.ok(models[model].knobs.some(k=>k.key===focus),'invalid focus '+id);
  const out=make(model);
  assert.ok(Number.isFinite(out.metrics[index||0].value),'invalid main metric '+id);
  assert.ok(typeof models[model].assumption==='string' && models[model].assumption.length>=20,'missing model assumptions '+id);
  for(const knob of models[model].knobs){
    const aligned=(value)=>Math.abs((value-knob.min)/knob.step-Math.round((value-knob.min)/knob.step))<1e-7;
    assert.ok(aligned(knob.value)&&aligned(knob.max),'Range input default/max not on step grid '+id+':'+knob.key);
  }
}
// The target must follow the lesson's question, not simply increase every slider.
for(const [id,[modelName,,focus]] of Object.entries(catalog)){
  const k=models[modelName].knobs.find(k=>k.key===focus);
  const target=window.EE_INTERACTIVE.comparisonTarget(id,k);
  assert.ok(Number.isFinite(target)&&target>=k.min-1e-9&&target<=k.max+1e-9,
    id+' target within physical UI range');
  assert.ok(Math.abs((target-k.min)/k.step-Math.round((target-k.min)/k.step))<1e-7,
    id+' target on slider grid');
  assert.notEqual(target,k.value,id+' target different from baseline');
}
const expectedTarget={
  power:-2,blocks:80,op:7,'mid-boost-rl':70,
  wbg:45,
  'mid-bidirectional':-2,'mid-quadrants':-2,
  'mid-ccm-dcm':0.1,'mid-bcm':0.3,'mid-buck-dcm':0.1,
  'mid-boost-dcm':0.2,'mid-buckboost-dcm':0.1,'mid-flyback-dcm':0.1
};
for(const [id,expected] of Object.entries(expectedTarget)){
  const [modelName,,focus]=catalog[id];
  const k=models[modelName].knobs.find(k=>k.key===focus);
  eq(window.EE_INTERACTIVE.comparisonTarget(id,k),expected,1e-8,'Question-specific target '+id);
}
function atLessonTarget(id){
  const [modelName,,focus]=catalog[id],m=models[modelName];
  const k=m.knobs.find(k=>k.key===focus);
  return make(modelName,{[focus]:window.EE_INTERACTIVE.comparisonTarget(id,k)});
}
for(const id of ['mid-ccm-dcm','mid-buck-dcm','mid-boost-dcm','mid-buckboost-dcm','mid-flyback-dcm'])
  assert.equal(atLessonTarget(id).mode,'DCM',id+' experiment must actually enter DCM');
assert.equal(atLessonTarget('mid-bcm').mode,'BCM','BCM experiment must reach its boundary');
assert.ok(atLessonTarget('mid-quadrants').metrics[1].value<0,'Quadrants must reverse output power');
assert.ok(atLessonTarget('mid-bidirectional').primary<0,'Bidirectional must reverse sign');
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
const pi=make('pi',{kp:1,ki:600,f:100});
eq(pi.metrics[0].value,Math.hypot(1,600/(2*Math.PI*100)),1e-10,'Inverting PI magnitude');
eq(pi.metrics[1].value,180-Math.atan2(600/(2*Math.PI*100),1)*180/Math.PI,1e-10,'Inverting PI phase reference');
const dcmb=make('buck',{vin:24,duty:50,l:100,freq:100,io:0.1});
const buckVsw=dcmb.series.find(x=>x.label==='Vsw 開關節點');
const buckGate=dcmb.series.find(x=>x.label==='Gate 指令');
eq(buckGate.points[0],1,1e-10,'Buck gate is a logic level');
eq(buckGate.points[75],0,1e-10,'Buck gate off at t=0.75');
eq(buckVsw.points[75],18,1e-8,'Buck DCM floating node follows Vout, not zero');
eq(dcmb.series.find(x=>x.label==='VL 電感兩端').points[75],0,1e-8,'Buck DCM VL zero interval');
const boostVsw=bd.series.find(x=>x.label==='Vsw 開關節點');
eq(boostVsw.points[25],0,1e-10,'Boost on-state drain at zero');
eq(boostVsw.points[75],48,1e-8,'Boost DCM idle switch node equals Vin');
const fbd=make('flyback',{vin:96,duty:40,ratio:2,lm:200,freq:100,io:0.1});
assert.equal(fbd.series.some(x=>x.label==='Primary Gate'),false,'Flyback must not label Vin as gate voltage');
eq(fbd.series.find(x=>x.label==='Gate 指令').points[20],1,1e-8,'Flyback gate logic');
eq(fbd.series.find(x=>x.label==='一次側磁化電壓').points[20],96,1e-8,'Flyback primary winding voltage on');
eq(fbd.series.find(x=>x.label==='MOSFET VDS 理想值').points[75],96,1e-8,'Flyback idle ideal VDS');
assert.ok(fbd.metrics[4].value>0,'Flyback DCM zero-time metric');
for(const [id,expected] of [['mid-bcm','IL Valley'],['mid-buck-dcm','理想 Vout'],['mid-flyback-dcm','零電流時間比例']]){
 const [model,,,index]=catalog[id];
 assert.equal(models[model].compute(Object.fromEntries(models[model].knobs.map(k=>[k.key,k.value]))).metrics[index||0].label,expected,
   id+' metric must match learning question');
}
const opto=make('optocoupler',{if:5,ctr:100});
eq(opto.primary,5,1e-8,'Optocoupler CTR');
const diode=make('scr',{vac:48,alpha:180});
eq(diode.primary,0,1e-8,'SCR 180 degrees no conduction');
const cap=make('capRipple',{cap:220,load:3});
assert.ok(cap.warning,'Large ripple approximation must be flagged');
const adc=make('adc',{i:30,gain:20});
assert.ok(Number.isNaN(adc.metrics[1].value),'Out-of-range ADC must not present a valid code');
assert.ok(adc.warning,'Out-of-range ADC must warn');
assert.equal(adc.validity?.scorable,false,'Out-of-range ADC input must never be scored as an effective measurement');

const six=make('sixPulseHarmonics',{idc:6,order:5});
const sixI1=6*Math.sqrt(6)/Math.PI;
eq(six.metrics[1].value,sixI1,0.025,'Six-pulse constant DC line fundamental');
eq(six.metrics[0].value,sixI1/5,0.025,'Six-pulse line fifth harmonic');
assert.ok(Math.abs(six.metrics[3].value-31.08)<1,'Six-pulse THDi of ideal 120-degree line current');
const six3=make('sixPulseHarmonics',{idc:6,order:3});
assert.ok(six3.metrics[0].value<0.025,'Six-pulse three-times zero-sequence harmonic vanishes');
const bus=make('threeBus',{cap:990,io:2,rs:1,vphase:120});
assert.ok(bus.metrics[0].value>200 && bus.metrics[0].value<300,'Three-phase capacitor bus voltage plausible');
assert.ok(bus.metrics[1].value>0,'Three-phase capacitor bus ripple positive');
assert.ok(bus.metrics[2].value>0,'Three-phase AC line RMS positive');
assert.ok(bus.metrics[3].value>1,'Capacitor-input rectifier AC current crest factor above one');
assert.ok(bus.metrics[4].value>0,'Capacitor-input current has harmonics');
const balance=bus.balance;
assert.ok(Math.abs(balance.pin-balance.pout-balance.rloss)<Math.max(8,0.05*balance.pin),
  'Three-phase capacitor/input/output/source-loss power must approximately balance');
const smallC=make('threeBus',{cap:330,io:2,rs:1,vphase:120});
const largeC=make('threeBus',{cap:1980,io:2,rs:1,vphase:120});
assert.ok(largeC.metrics[1].value<smallC.metrics[1].value,'Larger DC capacitor reduces switching-free ripple for fixed test fixture');
const invalidCCM=make('boostCopper',{vin:48,duty:10,rl:0,load:100,l:40,freq:50});
assert.equal(invalidCCM.mode,'OUT_OF_DOMAIN','CCM copper-loss model must validate valley current');
assert.ok(Number.isNaN(invalidCCM.metrics[0].value),'Do not present DCM output as valid CCM voltage');
assert.ok(invalidCCM.warning?.includes('CCM'),'Invalid CCM must carry warning');
const validCCM=make('boostCopper',{vin:48,duty:50,rl:0.5,load:40,l:100,freq:100});
assert.equal(validCCM.mode,'CCM','Original copper-loss default remains CCM');
const capDCM=make('boostCap',{vin:48,duty:50,l:100,freq:100,io:0.2});
assert.equal(capDCM.mode,'DCM','Boost capacitor model needs mode labeling');
assert.ok(capDCM.warning?.includes('Vpp'),'ON-capacitor droop cannot be sold as full cycle Vpp');
const fwdBad=make('forward',{vin:100,vreset:100,duty:70,freq:100});
assert.equal(fwdBad.stage.resetIncomplete,true,'Forward incomplete reset stage must be flagged');
const pushBalanced=make('pushPullBalance',{da:30,db:30});
const pushUnbalanced=make('pushPullBalance',{da:30,db:35});
eq(pushBalanced.metrics[0].value,0,1e-12,'Balanced push-pull net flux zero');
assert.ok(pushUnbalanced.metrics[0].value<0,'Unbalanced B leg accumulates opposite flux');
assert.ok(pushUnbalanced.warning?.includes('flux walking'),'Push-pull imbalance needs warning');
const halfFull=make('bridgeFamily',{vin:300,ratio:0.5,duty:30});
eq(halfFull.metrics[0].value,45,1e-9,'Half bridge lecture duty definition');
eq(halfFull.metrics[1].value,90,1e-9,'Full bridge lecture duty definition');
const multi=make('multiSecondary',{vp:96,r1:2,r2:4});
eq(multi.metrics[0].value,48,1e-9,'First secondary');
eq(multi.metrics[1].value,24,1e-9,'Second secondary');
const coreLoss=make('coreLoss',{freq:200,b:0.1,alpha:1.5,beta:2.5});
eq(coreLoss.metrics[0].value,Math.pow(2,1.5),1e-10,'Normalized Steinmetz frequency ratio');
for(const [id,model]of [['harmonics','sixPulseHarmonics'],['bus','threeBus'],['mid-coreloss','coreLoss'],
                         ['mid-pushpull','pushPullBalance'],['mid-half-full','bridgeFamily'],['mid-multi-output','multiSecondary']]){
  assert.equal(catalog[id][0],model,'Lesson must bind matching physical model: '+id);
}

/* Explicit lesson contracts: verify what is taught rather than just asserting
   that a range input can be moved or some finite number was rendered. */
const lessonSeeds={
  half:{full:0},
  op:{gain:5.5,vin:2},
  'mid-boost-rl':{duty:55,rl:2,load:10}
};
const contracts=[
  {id:'power',metric:'瞬時功率 p',direction:'down',before:48,after:-48},
  {id:'blocks',metric:'輸入功率',direction:'up',before:300/.9,after:300/.8},
  {id:'linear',metric:'Pass 元件耗散功率',direction:'up',before:14,after:16},
  {id:'igbt',metric:'兩者損耗差',direction:'up',before:18.4,after:20.064},
  {id:'bridge',metric:'正半週平均輸出',direction:'same',before:2*48*Math.SQRT2/Math.PI,after:2*48*Math.SQRT2/Math.PI},
  {id:'ampere',metric:'線性模型 B',direction:'down',before:0.22175948142986776,after:0.18849555921538763},
  {id:'mid-unipolar',metric:'VAB 零電壓比例',direction:'down',before:50,after:45},
  {id:'op',metric:'理想裁切狀態',direction:'up',before:0,after:1},
  {id:'mid-boost-rl',metric:'CCM 有效 Vout',direction:'down',
    before:48*.45/(.45*.45+2/10),after:48*.30/(.30*.30+2/10)},
  {id:'half',metric:'平均整流電壓',direction:'up',before:48*Math.SQRT2/Math.PI,after:54*Math.SQRT2/Math.PI},
  {id:'capacitor',metric:'有效小漣波估計 ΔV',direction:'down',before:1/(100*1650e-6),after:1/(100*1760e-6)}
];
for(const c of contracts){
  const [name,,focus,index=0]=catalog[c.id],m=models[name],
    baselineInput=Object.assign(Object.fromEntries(m.knobs.map(k=>[k.key,k.value])),lessonSeeds[c.id]||{});
  const knob=m.knobs.find(k=>k.key===focus),target=window.EE_INTERACTIVE.comparisonTarget(c.id,knob);
  const before=m.compute(baselineInput),after=m.compute({...baselineInput,[focus]:target});
  const metricBefore=before.metrics[index],metricAfter=after.metrics[index];
  assert.equal(metricBefore.label,c.metric,c.id+' must grade the observed physical quantity');
  eq(metricBefore.value,c.before,2e-5,c.id+' baseline model');
  eq(metricAfter.value,c.after,2e-5,c.id+' target model');
  const delta=metricAfter.value-metricBefore.value,observed=
    delta>1e-7?'up':delta< -1e-7?'down':'same';
  assert.equal(observed,c.direction,c.id+' physical prediction direction');
  assert.ok(before.validity?.scorable!==false&&after.validity?.scorable!==false,
    c.id+' graded setup must stay within defined model domain');
}
const cDefault=make('capRipple');
assert.equal(cDefault.validity.scorable,true,'Initial capacitor model must be in the stated small-ripple domain');
const cOutside=make('capRipple',{cap:220,load:3});
assert.equal(cOutside.validity.scorable,false,'Large ripple is invalid for graded small-ripple approximation');
assert.ok(Number.isNaN(cOutside.metrics[0].value),'Invalid model must not provide valid Vpp estimation');
assert.ok(cOutside.warning?.includes('超出'),'Invalid ripple needs a domain warning');
const magnetExtrap=make('magnetic',{gap:0,turns:100,amps:3});
assert.equal(magnetExtrap.validity.scorable,false,'Unphysical linear B extrapolation must be marked invalid');
assert.ok(magnetExtrap.metrics[1].value>5,'Keep explicitly marked extrapolation for demonstration');
assert.ok(magnetExtrap.warning?.includes('外插'),'Never present fixed-mu extrapolation as real magnetic design');
const linearInvalid=make('linearRegulator',{vin:8,vout:12,io:2});
assert.equal(linearInvalid.validity.scorable,false,'Linear regulator Vin <= Vout is out of range');
assert.ok(Number.isNaN(linearInvalid.metrics[0].value));
const adc09=make('adc',{i:-24,gain:5});
eq(adc09.metrics[0].value,0.9,1e-12,'ADC input for quantization');
eq(adc09.metrics[1].value,1228,1e-12,'ADC floor 4096-bin quantizer at 0.9 V');
eq(make('adc',{i:30,gain:10}).metrics[1].value,4095,1e-12,'ADC 3V full-scale endpoint');
const rectHalf=make('rectifier',{vac:48,full:0});
const rectFull=make('rectifier',{vac:48,full:1});
eq(rectHalf.metrics[2].value,rectFull.metrics[2].value,1e-12,
  'Rectifier positive-half cycle must not change with full-wave selection');
eq(rectFull.metrics[3].value,2*48*Math.SQRT2/Math.PI,1e-9,
  'Rectifier negative half is rectified for full-wave operation');
eq(rectHalf.metrics[3].value,0,1e-12,'No negative-half output in half-wave mode');
const zeroBridge=make('bridge',{da:75,db:25,bipolar:0});
const moreDuty=make('bridge',{da:80,db:25,bipolar:0});
eq(zeroBridge.metrics[4].value,50,1e-9,'Unipolar H bridge zero-state fraction');
eq(moreDuty.metrics[4].value,45,1e-9,'Zero-state duration decreases when A duty rises');
assert.ok(make('threeRect').note.includes('上橋二極體')&&
  make('threeRect').note.includes('下橋二極體'),
  'Three-phase bridge must name the current-conducting diode pair');
assert.ok(models.multiSecondary.assumption.includes('純電阻負載')&&
  models.multiSecondary.assumption.includes('同相'),
  'Multi-output current arithmetic requires explicitly same-phase resistive loads');

console.log('PASS independent interactive model fixtures: 72 lessons, 47 models, explicit model domains and topic-consistent prediction contracts');
