/** Engineering fixture regression: independent expected values for all seven middle-volume labs. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const jsErrors=[];
page.on('pageerror',error=>jsErrors.push(error.message));
await page.goto(BASE+'/middle.html#chapter/mid-basics');
await page.locator('#lab-holder .lab').waitFor();
const labs=await page.evaluate(()=>Object.keys(window.EE_LABS.definitions).sort());
assert.deepEqual(labs,[
  'mid-boost','mid-bridge','mid-buck','mid-buckboost','mid-core','mid-flyback','mid-modes'
]);
const checks=[];
function pass(name){checks.push(name);console.log('PASS engineering',name)}
function near(name,a,b,tol=1e-6){
  assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b)<=tol,
    name+' expected '+b+' got '+a);
}
function numeric(result,contains){
  const row=result.values.find(x=>x[0].includes(contains));
  assert.ok(row,'missing result '+contains);
  const v=parseFloat(row[1]);
  assert.ok(Number.isFinite(v),'not numeric '+contains+': '+row[1]);
  return v;
}
async function calc(id,params){
  return await page.evaluate(({id,params})=>window.EE_LABS.definitions[id].compute(params),{id,params});
}
function referenceBuck({vin,duty,l,freq,io}){
  const D=duty/100,L=l*1e-6,fs=freq*1000;
  const boundary=vin*D*(1-D)/(2*L*fs);
  if(io>=boundary){
    const delta=vin*D*(1-D)/(L*fs);
    return {mode:Math.abs(io-boundary)<1e-9?'BCM':'CCM',vo:vin*D,peak:io+delta/2,valley:io-delta/2,
      freewheel:1-D,zero:0,boundary};
  }
  const vo=vin/(1+2*L*fs*io/(vin*D*D));
  const peak=(vin-vo)*D/(L*fs);
  const freewheel=D*(vin/vo-1);
  return {mode:'DCM',vo,peak,valley:0,freewheel,zero:1-D-freewheel,boundary};
}
function validateBuck(variant,model){
  const ref=referenceBuck(variant);
  assert.equal(model.mode,ref.mode,'unexpected Buck mode');
  for(const [name,actual,expected] of [
    ['Vout',model.vout,ref.vo],['peak',model.peak,ref.peak],
    ['valley',model.valley,Math.max(0,ref.valley)],
    ['freewheel fraction',model.freewheel,ref.freewheel],
    ['zero fraction',model.zero,ref.zero],['BCM threshold',model.boundary,ref.boundary]
  ]) near(name,actual,expected,1e-6);
  near('all time fractions sum to one',model.on+model.freewheel+model.zero,1,1e-8);
  assert.ok(model.valley>=0,'Non-synchronous Buck must not show negative actual current');
  if(model.mode==='DCM'){
    near('DCM output current via triangular area',.5*model.peak*(model.on+model.freewheel),variant.io,1e-6);
    near('DCM inductor voltage-second balance',
      (variant.vin-model.vout)*model.on-model.vout*model.freewheel,0,1e-6);
    assert.ok(model.zero>0,'DCM must have a real zero-current interval');
  }
}
const buckFixtures=[
  {vin:24,duty:50,l:100,freq:100,io:2},
  {vin:24,duty:50,l:100,freq:100,io:.3},
  {vin:24,duty:50,l:100,freq:100,io:.1},
  {vin:60,duty:50,l:20,freq:25,io:3},
  {vin:12,duty:10,l:300,freq:250,io:.1},
  {vin:100,duty:90,l:20,freq:25,io:8}
];
for(const params of buckFixtures) {
  const model=(await calc('mid-buck',params)).model;
  validateBuck(params,model);
  const modeModel=(await calc('mid-modes',params)).model;
  validateBuck(params,modeModel);
}
pass('Buck & CCM/BCM/DCM match independent 3-interval equations across six operating points');
const buckCCM=await calc('mid-buck',buckFixtures[0]);
near('Buck Vout in CCM',numeric(buckCCM,'Vout'),12,.01);
near('Buck CCM ripple',numeric(buckCCM,'漣波'),.6,.01);
const buckDCM=await calc('mid-buck',buckFixtures[2]);
near('Buck DCM output is not D*Vin',numeric(buckDCM,'Vout'),18,.01);
near('Buck DCM valley is 0',numeric(buckDCM,'谷值'),0,.01);
assert.ok(buckDCM.warning.includes('DCM'));
const buckExtreme=await calc('mid-buck',buckFixtures[3]);
near('high ripple DCM Vout',buckExtreme.model.vout,50);
near('high ripple DCM valley',buckExtreme.model.valley,0);
pass('Buck negative-CCM-valley counterexample now shows 0 A and correct DCM Vout');
for(const [io,mode] of [[.05,'DCM'],[.3,'BCM'],[.301,'CCM']]){
  const p={vin:24,duty:50,l:100,freq:100,io};
  const m=(await calc('mid-modes',p)).model;
  assert.equal(m.mode,mode);
}
pass('BCM threshold is precise; 0.301 A is CCM rather than falsely classified as BCM');
await page.goto(BASE+'/middle.html#chapter/mid-modes');
await page.locator('#lab-holder .lab').waitFor();
await page.locator('[data-lab-input="io"]').evaluate(el=>{
  el.value='0.05';el.dispatchEvent(new Event('input',{bubbles:true}));
});
assert.ok((await page.locator('[data-middle-output]').innerText()).includes('DCM'));
const plot=await page.locator('[data-middle-chart] svg polyline').getAttribute('points');
const pts=plot.trim().split(/\s+/).map(x=>x.split(',').map(Number));
near('DCM waveform valley at zero',pts[0][1],158,.05);
near('DCM waveform flat zero until period end',pts[2][1],pts[3][1],.05);
assert.ok(pts[3][0]>pts[2][0]+10,'zero-current period needs visible width');
pass('DCM SVG shows computed triangular rise, discharge, then a zero-current plateau');

const boost={vin:48,duty:50,freq:100,l:100,io:2};
const b=await calc('mid-boost',boost);
near('Boost ideal Vout',numeric(b,'Vout'),96,.1);
near('Boost input average current',numeric(b,'輸入平均'),4,.01);
near('Boost peak inductor current',numeric(b,'峰值'),5.2,.01);
near('Boost output capacitor ripple mVpp',numeric(b,'電容漣波'),45.45,.02);
near('Boost output capacitor ripple model Vpp',b.model.rippleVpp,.04545454545,.00000002);
const bInvalid=await calc('mid-boost',{vin:12,duty:70,freq:50,l:40,io:.5});
assert.ok(bInvalid.warning.includes('DCM'));
assert.equal(bInvalid.model.mode,'DCM');
const boostDcmCase={vin:12,duty:70,freq:50,l:40,io:.5};
const boostDcm=await calc('mid-boost',boostDcmCase);
near('Boost DCM output from independent energy equation',boostDcm.model.vout,47.28,1e-7);
near('Boost DCM inductor peak',boostDcm.model.peak,4.2,1e-7);
near('Boost DCM valley is zero',boostDcm.model.valley,0);
near('Boost DCM time fractions',boostDcm.model.on+boostDcm.model.freewheel+boostDcm.model.zero,1,1e-9);
assert.ok(boostDcm.model.zero>0);
near('Boost DCM diode energy / average current',
  boostDcm.model.peak*boostDcm.model.freewheel/2,boostDcmCase.io,1e-8);
near('Boost DCM volt-second balance',
  boostDcmCase.vin*boostDcm.model.on+(boostDcmCase.vin-boostDcm.model.vout)*boostDcm.model.freewheel,0,1e-8);
const boostBoundary={vin:12,duty:70,freq:50,l:40,io:4.2*.3/2};
assert.equal((await calc('mid-boost',boostBoundary)).model.mode,'BCM');
const boostAbove={...boostBoundary,io:boostBoundary.io+.05};
assert.equal((await calc('mid-boost',boostAbove)).model.mode,'CCM');
assert.ok(numeric(boostDcm,'Vout')>40,'DCM should not present the CCM Vout');
await page.goto(BASE+'/middle.html#chapter/mid-boost');
await page.locator('[data-middle-chart] svg polyline').waitFor();
const boostTrace=await page.locator('[data-middle-chart] svg polyline').getAttribute('points');
assert.equal(boostTrace.trim().split(/\s+/).length,4,'Boost current waveform must contain calculated ON/rectify/zero segments');
pass('Boost CCM/BCM/DCM transfer, DCM volt-second, average output current and waveform');

function referenceBoostCapRipple(p,m){
  // Independent midpoint integration of diode current, not the production
  // analytic extremum formula. Charge is in A * cycle-fraction units.
  const N=120000,dt=1/N,cap=220e-6,fs=p.freq*1000;
  let q=0,qMin=0,qMax=0;
  for(let i=0;i<N;i++){
    const t=(i+.5)*dt;
    const diode=t<m.on?0:
      t<m.on+m.freewheel?m.peak+(m.valley-m.peak)*(t-m.on)/m.freewheel:0;
    q+=(diode-p.io)*dt;
    qMin=Math.min(qMin,q);
    qMax=Math.max(qMax,q);
  }
  near('Boost capacitor period charge balance',q,0,.00006);
  return (qMax-qMin)/(cap*fs);
}
const boostRippleFixtures=[
  {vin:48,duty:50,freq:100,l:100,io:2}, // CCM diode valley above Io
  {vin:48,duty:50,freq:100,l:100,io:1}, // CCM diode crosses Io during OFF
  {vin:72,duty:10,freq:50,l:40,io:.5}, // DCM: CCM Ripple underestimates by >7x
  {vin:12,duty:70,freq:50,l:40,io:.5}, // DCM large Duty
  {vin:72,duty:10,freq:50,l:40,io:1.62}, // BCM
  {vin:72,duty:10,freq:50,l:40,io:1.61999}, // just below BCM
  {vin:72,duty:10,freq:50,l:40,io:1.62001} // just above BCM
];
const boostRippleResults=[];
for(const fixture of boostRippleFixtures){
  const result=await calc('mid-boost',fixture);
  near('Boost capacitor ripple independent waveform integration',result.model.rippleVpp,
    referenceBoostCapRipple(fixture,result.model),.000035);
  near('Boost capacitor ripple displayed in mVpp',numeric(result,'電容漣波'),
    result.model.rippleVpp*1000,.015);
  assert.ok(result.values.find(x=>x[0].includes('電容漣波'))[1].endsWith('mVpp'));
  boostRippleResults.push(result);
}
const lowDutyRipple=boostRippleResults[2];
assert.equal(lowDutyRipple.model.mode,'DCM');
near('Boost DCM low Duty 72V/0.5A output',lowDutyRipple.model.vout,97.92,.00001);
near('Boost DCM low Duty exact capacitor ripple',lowDutyRipple.model.rippleVpp,.03370510662,.000001);
near('Boost DCM low Duty displayed mVpp',numeric(lowDutyRipple,'電容漣波'),33.71,.01);
near('DCM to BCM ripple continuity',boostRippleResults[5].model.rippleVpp,boostRippleResults[4].model.rippleVpp,.000001);
near('BCM to CCM ripple continuity',boostRippleResults[6].model.rippleVpp,boostRippleResults[4].model.rippleVpp,.000001);
pass('Boost capacitor Ripple matches independent integration across CCM/BCM/DCM and continuous boundary');


const twoWay={vin:48,vout:24,power:300};
const forward=await calc('mid-buckboost',twoWay);
assert.equal(forward.values[1][1],'Buck 降壓');
near('left current',numeric(forward,'左側'),6.25,.01);
near('right current',numeric(forward,'右側'),12.5,.01);
const reverse=await calc('mid-buckboost',{...twoWay,power:-300});
assert.equal(reverse.values[1][1],'Boost 升壓');
assert.ok(reverse.values[0][1].includes('右側'));
const noFlow=await calc('mid-buckboost',{...twoWay,power:0});
assert.equal(noFlow.values[1][1],'無淨傳能');
await page.goto(BASE+'/middle.html#chapter/mid-buckboost');
await page.locator('[data-lab-input="power"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
assert.equal((await page.locator('[data-middle-chart] svg polyline').getAttribute('points')).trim().split(/\s+/).length,2,'zero-power chart is neutral');

pass('Four-switch Buck-Boost direction reversal and zero-power state');

const bridge={vbus:100,da:75,db:25,current:2};
const q1=await calc('mid-bridge',bridge);
near('bridge VAB',numeric(q1,'VAB'),50,.01);
near('bridge absorbed P',numeric(q1,'負載功率'),100,.01);
assert.ok(q1.values[2][1].includes('I 象限'));
for(const [da,db,current,q,back] of [
  [75,25,-2,'IV',true],[25,75,2,'II',true],[25,75,-2,'III',false]
]){
  const v=await calc('mid-bridge',{vbus:100,da,db,current});
  assert.ok(v.values[2][1].includes(q+' 象限'));
  assert.equal(v.values[3][1],back?'負載回送':'負載吸收');
}
const bipolar=await calc('mid-bridge',{...bridge,mode:'bipolar'});
near('bipolar complementary duty mean VAB',numeric(bipolar,'VAB'),50,.01);
const uni=await calc('mid-bridge',{...bridge,mode:'unipolar'});
near('unipolar synchronized carrier mean VAB',numeric(uni,'VAB'),50,.01);
await page.goto(BASE+'/middle.html#chapter/mid-bridge');
await page.locator('[data-bridge-mode]').waitFor();
assert.equal(await page.locator('[data-bridge-mode]').inputValue(),'unipolar');
assert.equal(await page.locator('[data-middle-chart] svg path').count(),3);
const bridgeWavePaths=await page.locator('[data-middle-chart] svg path').evaluateAll(
 nodes=>nodes.map(node=>node.getAttribute('d')));
assert.ok(bridgeWavePaths.every(d=>/ H/.test(d)&&/ V/.test(d)&&!/ L/.test(d)),
 'Bridge-leg SVG must use horizontal/vertical ideal switching edges, no diagonal lines');
// B Duty is user-owned in Unipolar; Bipolar derives B=100%-A.
const bControl=page.locator('[data-lab-input="db"]');
const aControl=page.locator('[data-lab-input="da"]');
await bControl.evaluate(el=>{el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}));});
assert.equal(await bControl.inputValue(),'80');
assert.equal(await page.locator('[data-lab-value="db"]').innerText(),'80%');
await page.locator('[data-bridge-mode]').selectOption('bipolar');
assert.equal(await page.locator('[data-bridge-mode]').inputValue(),'bipolar');
assert.equal(await bControl.isDisabled(),true);
assert.equal(await bControl.inputValue(),'25');
assert.equal(await page.locator('[data-lab-value="db"]').innerText(),'25%');
assert.ok((await page.locator('[data-bridge-db-hint]').innerText()).includes('100% − A'));
assert.ok((await page.locator('[data-middle-output]').innerText()).includes('50.0 V'));
await aControl.evaluate(el=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));});
assert.equal(await bControl.inputValue(),'40');
assert.equal(await page.locator('[data-lab-value="db"]').innerText(),'40%');
assert.ok((await page.locator('[data-middle-output]').innerText()).includes('20.0 V'));
await page.screenshot({path:'tests/screenshots/middle-bridge-bipolar.png',fullPage:true});
await page.locator('[data-bridge-mode]').selectOption('unipolar');
assert.equal(await bControl.isEnabled(),true);
assert.equal(await bControl.inputValue(),'80');
assert.equal(await page.locator('[data-lab-value="db"]').innerText(),'80%');
assert.ok((await page.locator('[data-middle-output]').innerText()).includes('-20.0 V'));
await page.screenshot({path:'tests/screenshots/middle-bridge-unipolar.png',fullPage:true});
assert.ok((await page.locator('[data-middle-chart] svg').getAttribute('aria-label')).includes('PWM'));
pass('H-Bridge Bipolar derived B Duty is disabled and shown; Unipolar B value is restored');
pass('H-Bridge voltage difference, power sign, and four quadrant classification');

const flyback=await calc('mid-flyback',{vin:96,duty:40,ratio:2,lm:200,freq:100});
near('Flyback CCM Vout',numeric(flyback,'Vo'),32,.01);
near('Flyback ripple',numeric(flyback,'ΔIm'),1.92,.01);
near('Flyback ideal OFF VDS',numeric(flyback,'VDS'),160,.1);
near('Flyback period',numeric(flyback,'週期'),10,.01);
assert.ok(flyback.warning.includes('不含漏感'));
pass('Flyback ideal CCM transfer, magnetizing current, and voltage stress');

const core=await calc('mid-core',{vin:100,duty:40,turns:30,area:150,freq:100});
near('Core flux swing',numeric(core,'ΔB'),.08889,.001);
near('Core applied volt-seconds',numeric(core,'伏秒'),400,.01);
near('Core ON time',numeric(core,'ON 時間'),4,.01);
const highFlux=await calc('mid-core',{vin:400,duty:50,turns:10,area:50,freq:25});
assert.ok(highFlux.warning.includes('0.2 T'));
pass('Magnetic flux swing units, applied volt-seconds, and material-limit warning');

await page.goto(BASE+'/middle.html#lesson/mid-flyback/mid-isolation-feedback');
await page.locator('.equation-list.math-ready').waitFor();
const labels=await page.locator('.equation-label').allTextContents();
assert.equal(labels.length,2);
assert.ok(labels[0].includes('第 34 頁')&&labels[0].includes('二次側'));
assert.ok(labels[1].includes('第 35 頁')&&labels[1].includes('一次側'));
const explanation=await page.locator('.reading-block').first().innerText();
assert.ok(explanation.includes('脈衝變壓器')&&explanation.includes('光耦'));
pass('Slide 34 secondary-side PWM and slide 35 primary-side PWM remain distinct');

assert.deepEqual(jsErrors,[]);
await browser.close();
console.log('ENGINEERING REGRESSION PASS',checks.length,'checks:',checks.join(' | '));