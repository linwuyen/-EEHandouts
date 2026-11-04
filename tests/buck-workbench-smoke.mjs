/* Actual DOM acceptance of the local Buck migration, not a mock workbench. */
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';
const offline=process.argv.includes('--offline');
const BASE=process.env.PLAYWRIGHT_BASE_URL||(offline?'https://eehandouts.test':'http://127.0.0.1:4173');
async function routeLocal(context,forbidden=[]){await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(BASE).origin){if(u.href.includes('Circuit-Simulation'))forbidden.push(u.href);return r.abort();}if(!offline)return r.continue();const root=process.cwd(),file=resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+sep)||!existsSync(file))return r.fulfill({status:404,body:'Not found'});return r.fulfill({status:200,body:readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[extname(file)]||'application/octet-stream'});});}
const lesson='/middle.html#lesson/mid-basics/mid-buck-pwm';
const cross=process.argv.includes('--cross-browser'),quick=process.argv.includes('--quick');
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type] of cross?[['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]]){
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
 const errors=[],forbidden=[];page.on('pageerror',e=>errors.push(e.message));
 await routeLocal(context,forbidden);
 async function ready(p=page){await p.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready',null,{timeout:8000});}
 async function answer(value){await page.locator(`input[name="experiment-answer"][value="${value}"]`).check();await page.locator('#workspace-submit').click();await page.waitForFunction(()=>CircuitEvidence.storageStatus().saved);}
 try{
  await page.goto(BASE+lesson,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.setItem('ee.middle.done',JSON.stringify(['mid-buck-pwm'])));await page.reload();
  await page.locator('#buck-workbench-entry a').click();await ready();
  assert.equal(new URL(page.url()).pathname,'/workbench/index.html');assert.match(await page.locator('#ws-title').innerText(),/開久一點/);
  assert.match(await page.locator('.experiment-boundary').innerText(),/16 ms/);
  await answer('up');await page.locator('#experiment-run').click();await page.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
  assert.equal(await page.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.experiment.rows.energy.operated),true);
  await page.locator('#ee-return').click();await page.waitForURL(BASE+lesson);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ee.middle.done')),'["mid-buck-pwm"]');
  await page.locator('#buck-workbench-entry a').click();await ready();
  assert.equal(await page.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.experiment.rows.energy.operated),true);
  if(quick){console.log('PASS migration '+name+': lesson/internal experiment/durable return');continue;}
  await page.evaluate(async()=>{await CircuitEvidence._resetForTests();});await page.reload();await ready();
  const lessons=await page.evaluate(()=>CircuitWorkspace.experimentLessons());assert.equal(lessons.length,8);
  for(const l of lessons){
   // A click changes the hash; the queued hashchange handler renders and saves later.
   // Wait for the expected route AND rendered lesson, not merely click completion.
   await page.waitForFunction(({id,title})=>location.hash==='#experiment-'+id&&
    document.getElementById('ws-title')?.textContent===title&&CircuitEvidence.storageStatus().saved,
    {id:l.id,title:l.title},{timeout:8000});
   assert.equal(new URL(page.url()).hash,'#experiment-'+l.id);
   assert.equal(await page.locator('#ws-title').innerText(),l.title);
   assert.equal(await page.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.experiment.currentLesson),l.id);
   if(l.prepare)await page.locator('#apply-setup').click();
   await answer(l.answer);await page.locator('#experiment-run').click();await page.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
   await answer(l.answer);await answer('reason');assert.equal(await page.locator('#ws-voltage').innerText(),'先預測');assert.equal(await page.locator('#ws-plot').isVisible(),false);
   await answer(l.answer);assert.equal(await page.locator('#ws-result').isVisible(),true);
   if(l.id!=='protection')await page.locator('#ws-next').click();
  }
  assert.match(await page.locator('#workspace-progress').innerText(),/8 \/ 8/);
  assert.equal(await page.evaluate(()=>CircuitEvidence.load().benchmark.beginnerLessons),undefined);
  await page.locator('#ws-next').click();assert.equal(new URL(page.url()).hash,'#experiment-protection');assert.match(await page.locator('#workspace-reference').innerText(),/完成/);
  await page.reload();await ready();assert.match(await page.locator('#workspace-progress').innerText(),/8 \/ 8/);
  await page.locator('#workbench-context-slot summary').click();await page.waitForSelector('.ec-model');assert.match(await page.locator('.ec-model').first().innerText(),/generic-power-causal-kernel/);
  await page.locator('#show-progress').click();await page.locator('#detailed-records').click();assert.match(await page.locator('#workspace-reference').innerText(),/備份/);
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
  await page.screenshot({path:`tests/screenshots/cross-${name}-buck-migration.png`,fullPage:true});
  await page.goto(BASE+'/workbench/index.html?from=https://attacker.invalid/#experiment-energy');await ready();await page.locator('#ee-return').click();await page.waitForURL(BASE+lesson);
  await page.goto(BASE+'/workbench/index.html#experiment-energy');await ready();
  const future=await page.evaluate(async()=>{const s=CircuitEvidence.load();s.benchmark.learningWorkspace.experiment.version=999;CircuitEvidence.save(s);await CircuitEvidence.flush();return localStorage.getItem(CircuitEvidence.KEY);});
  await page.reload();await page.waitForSelector('#experiment-record-protection');assert.equal(await page.evaluate(()=>localStorage.getItem('circuit-learning-state-v5')),future);
  await page.locator('#experiment-record-protection a').click();await page.waitForURL(/records\.html/);assert.equal(await page.evaluate(()=>localStorage.getItem('circuit-learning-state-v5')),future);
  const download=page.waitForEvent('download');await page.locator('#ee-export-raw').click();assert.match((await download).suggestedFilename(),/backup/);
  const c2=await browser.newContext(),q=await c2.newPage();await routeLocal(c2);await q.goto(BASE+'/workbench/index.html#experiment-energy');await ready(q);
  await q.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='circuit-learning-state-v5')throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};});
  await q.locator('input[name="experiment-answer"][value="up"]').check();await q.locator('#workspace-submit').click();await q.waitForFunction(()=>!CircuitEvidence.storageStatus().saved);
  await q.evaluate(()=>EEWorkbenchHost.leave('../middle.html#lesson/mid-basics/mid-buck-pwm'));assert.match(q.url(),/workbench\/index\.html/);assert.equal(await q.locator('#learning-storage-status').isVisible(),true);await c2.close();
  const c3=await browser.newContext(),broken=await c3.newPage();await routeLocal(c3);await c3.route('**/assets/engineering-sandbox-core.js',r=>r.abort());await broken.goto(BASE+'/workbench/index.html');
  await broken.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='failed');assert.equal(await broken.locator('main').evaluate(n=>n.inert),true);assert.match(await broken.locator('#ee-host-status').innerText(),/載入|失敗/);await c3.close();
  const c4=await browser.newContext();await routeLocal(c4);const first=await c4.newPage(),second=await c4.newPage();
  await first.goto(BASE+'/workbench/index.html#experiment-energy');await ready(first);await first.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
  await second.goto(BASE+'/workbench/index.html#experiment-energy');await ready(second);await second.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
  await second.locator('input[name="experiment-answer"][value="down"]').check();await second.locator('#workspace-submit').click();await second.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
  await first.waitForSelector('#experiment-record-protection');assert.equal(await first.evaluate(()=>JSON.parse(localStorage.getItem('circuit-learning-state-v5')).benchmark.learningWorkspace.experiment.rows.energy.first.answer),'down');
  await c4.close();
  // Foreign top-level version while the page is already open, not only startup.
  const c5=await browser.newContext();await routeLocal(c5);const running=await c5.newPage(),writer=await c5.newPage();
  await running.goto(BASE+'/workbench/index.html#experiment-energy');await ready(running);await running.waitForFunction(()=>CircuitEvidence.storageStatus().saved);
  await writer.goto(BASE+'/workbench/records.html');
  const raw6=await writer.evaluate(()=>{const s=JSON.parse(localStorage.getItem('circuit-learning-state-v5'));s.version=6;s.foreignMarker='preserve-exact';const raw=JSON.stringify(s);localStorage.setItem('circuit-learning-state-v5',raw);return raw;});
  await running.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');assert.equal(await running.locator('main').evaluate(n=>n.inert),true);
  assert.equal(await running.evaluate(()=>localStorage.getItem('circuit-learning-state-v5')),raw6);assert.equal(await running.evaluate(()=>EEWorkbenchHost.leave()),false);
  const popup=running.waitForEvent('popup');await running.locator('#ee-records').click();const backup=await popup;await backup.waitForLoadState('domcontentloaded');assert.match(backup.url(),/records\.html/);assert.equal(await backup.evaluate(()=>localStorage.getItem('circuit-learning-state-v5')),raw6);assert.equal(await backup.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);await c5.close();
  assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);
  console.log('PASS migration '+name+': original eight steps, return, reading isolation, backup, future record, quota, asset failure, mobile');
 }finally{await context.close();await browser.close();}
}
