/* Real browsers and source calculator; no separate reference implementation in UI. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const COURSE='/index.html#lesson/analog/adc',PATH='/workbench/adc.html';
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type]of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await type.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1280,height:900}});
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());
 const page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>requests.push(r.url()));
 const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='ready');
 const raw=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
 const metric=async(group,label)=>page.locator('#'+group+' .metric').filter({has:page.locator('span',{hasText:new RegExp('^'+label+'$')})}).locator('strong').innerText();
 try{
  await page.goto(BASE+COURSE);await page.locator('#adc-workbench-entry a').waitFor();
  await page.evaluate(()=>{localStorage.setItem('ee.done','["adc"]');localStorage.setItem('ee.middle.done','["mid-buck-pwm"]');localStorage.setItem('c2000_adc_progress','{"2":1}');localStorage.setItem('circuit-learning-state-v5','{"schema":"circuit-learning-state","version":999,"preserve":"foreign evidence"}');});
  const before=await raw();await page.locator('#adc-workbench-entry a').click();await page.waitForURL(BASE+PATH);await ready();
  assert.equal(await metric('adcResults','Code 數'),'4096');assert.equal(await metric('adcResults','理想 LSB'),'0.8057 mV');
  assert.equal(await metric('currentResults','ADC 輸入'),'2.4700 V');assert.equal(await metric('currentResults','ADC code'),'3065');
  assert.match(await page.locator('#ee-adc-boundary').innerText(),/8\.2.*1\.65/);
  await page.locator('#current').fill('-20');assert.equal(await metric('currentResults','ADC 輸入'),'0.8300 V');assert.equal(await metric('currentResults','ADC code'),'1030');
  await page.locator('#current').fill('100');assert.match(await page.locator('#currentWarns').innerText(),/飽和/);assert.equal(await metric('currentResults','ADC code'),'4095');
  await page.locator('#current').fill('-100');assert.match(await page.locator('#currentWarns').innerText(),/截斷/);assert.equal(await metric('currentResults','ADC code'),'0');
  await page.locator('#bus').fill('600');assert.match(await page.locator('#dividerWarns').innerText(),/超出 ADC 範圍/);
  await page.locator('#vref').fill('');await page.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='invalid');
  for(const id of ['adcResults','currentResults','dividerResults','code','formula'])assert.equal(await page.locator('#'+id).innerText(),'');
  assert.equal(await page.locator('#copy').isDisabled(),true);assert.equal(await page.locator('#share').isDisabled(),true);
  await page.locator('#vref').fill('3.3');await page.locator('#current').fill('20');await page.locator('#bus').fill('400');await ready();
  // Finite W values can overflow mW; both typed input and shared URLs fail closed.
  for(const via of ['input','query']){
   if(via==='input')await page.locator('#bus').fill('1e156');else await page.goto(BASE+PATH+'?bus=1e156');
   await page.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='invalid');
   for(const id of ['adcResults','currentResults','dividerResults','code','formula'])assert.equal(await page.locator('#'+id).innerText(),'');
   assert.equal(await page.locator('#copy').isDisabled(),true);assert.equal(await page.locator('#share').isDisabled(),true);
   await page.locator('#bus').fill('400');await ready();assert.equal(await metric('currentResults','ADC code'),'3065');
  }
  // User-gesture clipboard failure must preserve the source prompt fallback.
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('clipboard denied'))}});});
  let code='';page.once('dialog',async d=>{code=d.defaultValue();await d.dismiss();});await page.locator('#copy').click();await page.waitForFunction(()=>document.getElementById('copy').disabled===false);assert.match(code,/ADC_LEVELS\s+\(4096\.0f\)/);
  let shared='';page.once('dialog',async d=>{shared=d.defaultValue();await d.dismiss();});await page.locator('#share').click();assert.equal(new URL(shared).pathname,PATH);assert.equal(new URL(shared).searchParams.get('current'),'20');
  await page.goto(shared);await ready();assert.equal(await metric('currentResults','ADC code'),'3065');
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),name+' ADC mobile '+width);}
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-adc-signal-chain.png',fullPage:true});
  assert.deepEqual(await raw(),before,'calculator, inputs, share and reload cannot mutate any learning keys');
  await page.goto(BASE+PATH+'?current=-20&bits=16&from=https://attacker.invalid');await ready();assert.equal(await metric('adcResults','Code 數'),'65536');assert.equal(await metric('currentResults','ADC 輸入'),'0.8300 V');
  await page.locator('#ee-adc-return').click();await page.waitForURL(BASE+COURSE);
  // The calculator is independent of unknown learning schemas, even in another tab.
  const writer=await ctx.newPage();await writer.goto(BASE+'/workbench/records.html');
  await page.goto(BASE+PATH);await ready();const future='{"schema":"circuit-learning-state","version":1000,"keep":true}';
  await writer.evaluate(s=>localStorage.setItem('circuit-learning-state-v5',s),future);await page.locator('#current').fill('0');assert.equal(await metric('currentResults','ADC code'),'2048');assert.equal(await page.evaluate(()=>localStorage.getItem('circuit-learning-state-v5')),future);await writer.close();
  // Actual saved-workbench entry: host maps source link, flush blocks quota, retry succeeds.
  const saved=await browser.newContext(),s=await saved.newPage();await s.goto(BASE+'/workbench/index.html#experiment-energy');await s.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved);
  await s.evaluate(()=>{EEWorkbenchHost.reference('1_c2000_adc_calculator/c2000_adc_calculator.html','ADC');window.originalFlush=CircuitEvidence.flush;CircuitEvidence.flush=async()=>({saved:false,reason:'quota'});});
  await s.locator('#reference-links button').click();assert.match(s.url(),/index\.html#experiment-energy$/);assert.match(await s.locator('#ee-host-status').innerText(),/取消離開/);
  await s.evaluate(()=>CircuitEvidence.flush=window.originalFlush);await s.locator('#reference-links button').click();await s.waitForURL(BASE+PATH);await s.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='ready');await saved.close();
  for(const asset of ['assets/learning/engineering-models.js','ee-adc.js']){
   const fail=await browser.newContext(),q=await fail.newPage();await fail.route('**/workbench/'+asset,r=>r.abort());await q.goto(BASE+PATH);await q.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='failed');assert.equal(await q.locator('#copy').isDisabled(),true);assert.equal(await q.locator('#vref').isDisabled(),true);assert.equal(await q.locator('#code').innerText(),'');await q.locator('#ee-adc-return').click();await q.waitForURL(BASE+COURSE);await fail.close();
  }
  assert.ok(!requests.some(u=>u.includes('Circuit-Simulation')));assert.deepEqual(errors,[]);
  console.log('PASS ADC migration '+name+': actual lesson/calculator/return, physical fixtures, invalid recovery, URL/clipboard fallback, zero storage writes, missing assets, guarded workbench entry and mobile');
 }finally{await ctx.close();await browser.close();}
}
