/* Real browser checks for the static reading slice; no replacement numerical or Evidence owner. */
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const HUB='/workbench/opamp-course.html',COURSE='/index.html#lesson/analog/op';
const lessons=JSON.parse(readFileSync('tests/fixtures/opamp-course-source.json'));
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type]of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 let phase='launch';
 const watchdog=setTimeout(()=>{console.error('FAIL OP course '+name+' stalled at '+phase);process.exit(1);},120000);
 const browser=await type.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage();
 ctx.setDefaultTimeout(15000);ctx.setDefaultNavigationTimeout(15000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>requests.push(r.url()));
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());
 await ctx.addInitScript(()=>{
  window.eeStorageCalls=[];const get=Storage.prototype.getItem;
  for(const name of ['getItem','setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.eeStorageCalls.push(name);return Reflect.apply(original,this,args);};}
  window.eeRawStorage=()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,Reflect.apply(get,localStorage,[k])]));
 });
 const readOnly=async expected=>{assert.deepEqual(await page.evaluate(()=>window.eeStorageCalls),[],'new reading document must not access any storage');assert.deepEqual(await page.evaluate(()=>window.eeRawStorage()),expected);};
 try{
  phase='real course entry';await page.goto(BASE+COURSE);await page.locator('#opamp-course-entry').click();await page.waitForURL(BASE+HUB);
  assert.equal(await page.locator('#ee-course-lessons li').count(),6);
  await page.evaluate(()=>{localStorage.setItem('ee.done','["op"]');localStorage.setItem('circuit-learning-state-v5','{"schema":"circuit-learning-state","version":999,"preserve":true}');localStorage.setItem('legacy-opamp-evidence','{"firstAttempt":false}');});
  const before=await page.evaluate(()=>window.eeRawStorage());await page.reload();await readOnly(before);
  phase='six chapters in source order';await page.locator('#ee-course-lessons a').first().click();
  for(let i=0;i<lessons.length;i++){
   const lesson=lessons[i];await page.waitForURL(BASE+'/workbench/'+lesson.sourcePath);
   assert.equal(await page.locator('h1').innerText(),lesson.heading);
   assert.equal(await page.locator('.ee-course-pager [aria-current="page"]').getAttribute('href'),lesson.file);
   assert.match(await page.locator('#ee-course-boundary').innerText(),/不記錄已讀/);
   await readOnly(before);
   for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.waitForFunction(w=>innerWidth===w,width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),name+' reading layout '+lesson.file+' '+width);}
   if(i===0||i===5)await page.screenshot({path:'tests/screenshots/cross-'+name+'-opamp-course-'+(i+1)+'.png',fullPage:true});
   if(i<lessons.length-1)await page.locator('.footer a[href="'+lessons[i+1].file+'"]').click();
  }
  assert.match(await page.locator('#ee-gbw-correction').innerText(),/來源修訂/);assert.match(await page.locator('#ee-gbw-correction').innerText(),/BW ≈ GBW \/ noise gain/);
  assert.match(await page.locator('.footer a[href="../coverage.html#opamp-unavailable"]').innerText(),/尚未遷入/);
  await page.locator('.footer a[href="../coverage.html#opamp-unavailable"]').click();await page.waitForURL(BASE+'/workbench/coverage.html#opamp-unavailable');assert.match(await page.locator('#opamp-unavailable').innerText(),/正式診斷與評量尚未遷入/);
  phase='existing labs and fixed return';await page.goto(BASE+HUB);
  for(const lab of ['opamp-step.html','opamp-sine.html']){
   await page.locator('header a[href="'+lab+'"]').click();await page.waitForFunction(()=>document.documentElement.dataset.eeOpampState==='ready');await readOnly(before);
   await page.locator('#ee-opamp-course-link').click();await page.waitForURL(BASE+HUB);await readOnly(before);
  }
  await page.goto(BASE+HUB+'?from=https://attacker.invalid&complete=true');await page.locator('#ee-course-return').click();await page.waitForURL(BASE+COURSE);
  phase='no JavaScript required';const staticCtx=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});staticCtx.setDefaultTimeout(15000);staticCtx.setDefaultNavigationTimeout(15000);const staticPage=await staticCtx.newPage();
  await staticPage.goto(BASE+HUB);await staticPage.locator('#ee-course-lessons a').first().click();
  for(let i=0;i<lessons.length;i++){await staticPage.waitForURL(BASE+'/workbench/'+lessons[i].sourcePath);assert.equal(await staticPage.locator('h1').innerText(),lessons[i].heading);if(i<lessons.length-1)await staticPage.locator('.footer a[href="'+lessons[i+1].file+'"]').click();}
  await staticPage.locator('header a[href="../opamp-course.html"]').click();await staticPage.waitForURL(BASE+HUB);await staticCtx.close();
  phase='original host save gate';const savedCtx=await browser.newContext(),saved=await savedCtx.newPage();savedCtx.setDefaultTimeout(15000);savedCtx.setDefaultNavigationTimeout(15000);
  await saved.goto(BASE+'/workbench/index.html#experiment-energy');await saved.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved);
  await saved.evaluate(()=>{EEWorkbenchHost.reference('12_opamp_slew_rate/02_step_response.html','Step reading');window.originalFlush=CircuitEvidence.flush;CircuitEvidence.flush=async()=>({saved:false,reason:'quota'});});
  await saved.locator('#reference-links button').click();assert.match(saved.url(),/index\.html#experiment-energy$/);assert.match(await saved.locator('#ee-host-status').innerText(),/取消離開/);
  await saved.evaluate(()=>CircuitEvidence.flush=window.originalFlush);await saved.locator('#reference-links button').click();await saved.waitForURL(BASE+'/workbench/12_opamp_slew_rate/02_step_response.html');assert.equal(await saved.locator('h1').innerText(),lessons[1].heading);await savedCtx.close();
  assert.deepEqual(errors,[]);assert.ok(!requests.some(u=>u.includes('Circuit-Simulation')),'no old-site request');
  console.log('PASS OP course '+name+': six source lessons, visible correction, unavailable Transfer, both existing labs, fixed returns, no storage access, unknown records preserved, JS-disabled/mobile reading, actual host save gate');
 }catch(error){console.error('FAIL OP course '+name+' at '+phase);throw error;}finally{await ctx.close();await browser.close();clearTimeout(watchdog);}
}
