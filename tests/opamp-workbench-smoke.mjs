/* Real DOM/canvas integration. Original numerical and grading owners are not replaced. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const COURSE='/index.html#lesson/analog/op';
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type]of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await type.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage();
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>requests.push(r.url()));
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());
 const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.eeOpampState==='ready');
 const raw=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
 const set=async(id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 try{
  await page.goto(BASE+COURSE);await page.locator('#opamp-workbench-entry').waitFor();
  await page.evaluate(()=>{localStorage.setItem('ee.done','["op"]');localStorage.setItem('circuit-learning-state-v5','{"schema":"circuit-learning-state","version":999,"preserve":true}');localStorage.setItem('legacy-opamp-evidence','{"firstAttempt":false}');});
  const before=await raw();await page.locator('#opamp-workbench-entry a').first().click();await page.waitForURL(BASE+'/workbench/opamp-step.html');await ready();
  assert.equal(await page.locator('#op-step-time').innerText(),'4.00 µs');assert.match(await page.locator('#ee-opamp-boundary').innerText(),/不授予正式通過/);
  await set('op-sr-plus',20);await set('op-sr-minus',.2);assert.equal(await page.locator('#op-step-time').innerText(),'0.40 µs');await set('op-step',-8);assert.equal(await page.locator('#op-step-time').innerText(),'40.00 µs');assert.match(await page.locator('#op-state').innerText(),/NEGATIVE/);
  await set('op-step',0);assert.equal(await page.locator('#op-settle-time').innerText(),'0.00 µs');await set('op-step',8);
  // Inject invalid hidden configuration to exercise the guard without browser range sanitization.
  await set('op-freq','');await page.waitForFunction(()=>document.documentElement.dataset.eeOpampState==='invalid');assert.equal(await page.locator('#op-scope').isHidden(),true);assert.equal(await page.locator('#op-step-time').textContent(),'');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#op-scope').isHidden(),true);await set('op-freq',100);await ready();
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),name+' step mobile '+width);}
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-opamp-step.png',fullPage:true});
  assert.ok(await page.locator('#op-scope').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)),'actual canvas painted');
  await page.locator('.nav a[href="opamp-sine.html"]').click();await ready();assert.equal(await page.locator('#op-required-sr').innerText(),'3.142 V/µs');assert.equal(await page.locator('#op-margin').innerText(),'1.31');
  await set('op-sr-minus',.2);assert.match(await page.locator('#op-state').innerText(),/SLEW LIMITED/);await page.reload();await ready();assert.equal(await page.locator('#op-sr-minus').inputValue(),'4.1','stateless input resets, not a restore');
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),name+' sine mobile '+width);}
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-opamp-sine.png',fullPage:true});assert.deepEqual(await raw(),before,'stateless labs must preserve all foreign and original records');
  await page.goto(BASE+'/workbench/opamp-step.html?from=https://attacker.invalid&op-step=-8');await ready();assert.equal(await page.locator('#op-step').inputValue(),'8','no implicit query parameters');await page.locator('#ee-opamp-return').click();await page.waitForURL(BASE+COURSE);
  await page.goto(BASE+'/workbench/adc.html');await page.locator('a[href="opamp-step.html"]').click();await ready();assert.deepEqual(await raw(),before);
  for(const asset of ['ee-opamp.js','12_opamp_slew_rate/assets/opamp.js']){
   const fail=await browser.newContext(),q=await fail.newPage();await fail.route('**/workbench/'+asset,r=>r.abort());await q.goto(BASE+'/workbench/opamp-step.html');await q.waitForFunction(()=>document.documentElement.dataset.eeOpampState==='failed');assert.equal(await q.locator('#op-step').isDisabled(),true);assert.equal(await q.locator('#op-scope').isHidden(),true);assert.equal(await q.locator('.metrics').isHidden(),true);await q.locator('#ee-opamp-return').click();await q.waitForURL(BASE+COURSE);await fail.close();
  }
  // Actual host/Evidence owners: save refusal, then successful local navigation.
  const saved=await browser.newContext(),s=await saved.newPage();await s.goto(BASE+'/workbench/index.html#experiment-energy');await s.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved);
  await s.evaluate(()=>{EEWorkbenchHost.reference('12_opamp_slew_rate/lab_step.html','OP');window.originalFlush=CircuitEvidence.flush;CircuitEvidence.flush=async()=>({saved:false,reason:'quota'});});await s.locator('#reference-links button').click();assert.match(s.url(),/index\.html#experiment-energy$/);assert.match(await s.locator('#ee-host-status').innerText(),/取消離開/);
  await s.evaluate(()=>CircuitEvidence.flush=window.originalFlush);await s.locator('#reference-links button').click();await s.waitForURL(BASE+'/workbench/opamp-step.html');await s.waitForFunction(()=>document.documentElement.dataset.eeOpampState==='ready');await saved.close();
  assert.deepEqual(errors,[]);assert.ok(!requests.some(u=>u.includes('Circuit-Simulation')));
  console.log('PASS OP labs '+name+': actual lesson, signed/zero step, sine margin, canvas, invalid recovery, fixed returns, original/future storage preserved, missing assets, guarded host entry and mobile');
 }finally{await ctx.close();await browser.close();}
}
