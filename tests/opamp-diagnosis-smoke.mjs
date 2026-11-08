/* Actual-browser formative diagnosis and saved-host integration; not a formal grade test. */
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {mkdirSync} from 'node:fs';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const HUB=BASE+'/workbench/opamp-diagnosis.html';
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type] of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 let phase='launch';const watchdog=setTimeout(()=>{console.error('FAIL OP diagnosis '+name+' stalled at '+phase);process.exit(1);},120000);
 const browser=await type.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage();
 ctx.setDefaultTimeout(15000);ctx.setDefaultNavigationTimeout(15000);
 const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));ctx.on('request',r=>requests.push(r.url()));
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());
 await ctx.addInitScript(()=>{window.eeDiagnosisStorageCalls=[];for(const name of ['getItem','setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.eeDiagnosisStorageCalls.push(name);return Reflect.apply(original,this,args);};}});
 try{
  phase='course entry';await page.goto(BASE+'/workbench/opamp-course.html');await page.locator('a[href="opamp-diagnosis.html"]').first().click();await page.waitForURL(HUB);
  await page.waitForFunction(()=>document.documentElement.dataset.eeDiagnosisState==='ready');
  assert.equal(await page.locator('.choice').count(),3);
  assert.equal(await page.locator('.choice button:disabled').count(),0);
  assert.equal(await page.locator('#diagnose-score').innerText(),'0/3 completed · 僅此頁練習，未寫入正式成績');
  assert.deepEqual(await page.evaluate(()=>window.eeDiagnosisStorageCalls),[]);
  phase='first answer immutable';await page.locator('[data-case="A"] [data-choice="gbw"]').click();
  assert.match(await page.locator('#diagnose-score').innerText(),/0\/3 first choices correct · 1\/3 completed/);
  assert.match(await page.locator('#feedback-A').innerText(),/這次選擇不正確/);
  await page.locator('[data-case="A"] [data-choice="sr"]').click();
  assert.match(await page.locator('#diagnose-score').innerText(),/0\/3 first choices correct · 1\/3 completed/);
  assert.match(await page.locator('#feedback-A').innerText(),/這次選擇正確/);
  assert.match(await page.locator('#feedback-A').innerText(),/首次判斷不正確/);
  await page.locator('[data-case="B"] [data-choice="gbw"]').click();
  await page.locator('[data-case="C"] [data-choice="settling"]').click();
  assert.match(await page.locator('#diagnose-score').innerText(),/2\/3 first choices correct · 3\/3 completed/);
  assert.match(await page.locator('#ee-diagnosis-boundary').innerText(),/不授予正式通過/);
  assert.deepEqual(await page.evaluate(()=>window.eeDiagnosisStorageCalls),[],'no storage calls in formative diagnosis');
  phase='reload and mobile';await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.eeDiagnosisState==='ready');
  assert.equal(await page.locator('#diagnose-score').innerText(),'0/3 completed · 僅此頁練習，未寫入正式成績');
  assert.equal(await page.locator('.choice button[aria-pressed="true"]').count(),0);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:800});await page.waitForFunction(w=>innerWidth===w,width);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow at '+width);
  }
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-opamp-diagnosis.png',fullPage:true});
  phase='missing JS fails closed';const bad=await browser.newContext();await bad.route('**/ee-opamp-diagnosis.js',r=>r.abort());const bp=await bad.newPage();
  await bp.goto(HUB);assert.equal(await bp.locator('.choice button:disabled').count(),9);assert.match(await bp.locator('#diagnose-score').innerText(),/互動載入中/);await bad.close();
  phase='JS disabled fails closed';const staticCtx=await browser.newContext({javaScriptEnabled:false});const sp=await staticCtx.newPage();await sp.goto(HUB);assert.equal(await sp.locator('.choice button:disabled').count(),9);assert.match(await sp.locator('noscript').innerText(),/互動保持停用/);await staticCtx.close();
  phase='original host save gate';const sc=await browser.newContext(),saved=await sc.newPage();sc.setDefaultTimeout(15000);
  await saved.goto(BASE+'/workbench/index.html#experiment-energy');await saved.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved);
  await saved.evaluate(()=>{EEWorkbenchHost.reference('12_opamp_slew_rate/lab_diagnose.html','診斷');window.oldFlush=CircuitEvidence.flush;CircuitEvidence.flush=async()=>({saved:false,reason:'quota'});});
  await saved.locator('#reference-links button').click();assert.match(saved.url(),/index\.html#experiment-energy$/);assert.match(await saved.locator('#ee-host-status').innerText(),/取消離開/);
  await saved.evaluate(()=>{CircuitEvidence.flush=window.oldFlush;});await saved.locator('#reference-links button').click();await saved.waitForURL(HUB);await saved.waitForFunction(()=>document.documentElement.dataset.eeDiagnosisState==='ready');
  await sc.close();
  assert.deepEqual(errors,[]);assert.ok(!requests.some(x=>x.includes('Circuit-Simulation')),'old-site request');
  console.log('PASS OP diagnosis '+name+': source cases, first-choice immutability, reload, storage isolation, JS failure, mobile, saved-host quota guard');
 }catch(error){console.error('FAIL OP diagnosis '+name+' phase '+phase);throw error;}finally{await ctx.close();await browser.close();clearTimeout(watchdog);}
}
