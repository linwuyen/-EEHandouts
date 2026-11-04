/* Real-DOM migration acceptance; all computations and proof gates use existing owners. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const course='/middle.html#lesson/mid-basics/mid-buck-pwm';
const boostCourse='/middle.html#lesson/mid-boost/mid-boost-ccm';
const key='circuit-learning-state-v5';
mkdirSync('tests/screenshots',{recursive:true});
for(const [engine,type] of process.argv.includes('--cross-browser')?[['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]]){
 const browser=await type.launch({headless:true});const contexts=[];
 async function fresh(){const c=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(c);await c.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());return c;}
 async function ready(p){await p.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready');await p.waitForFunction(()=>CircuitEvidence.storageStatus().saved);}
 async function stage(p,n){await p.waitForFunction(n=>document.body.dataset.workspaceStage===String(n)&&CircuitEvidence.storageStatus().saved,n);}
 async function answer(p,value,n){await p.locator(`input[name="topology-answer"][value="${value}"]`).check();await p.locator('#topology-submit').click();await stage(p,n);}
 const c=await fresh(),p=await c.newPage(),errors=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));c.on('request',r=>requests.push(r.url()));
 try{
  // Start from the real course entry and make one real manual experiment.
  await p.goto(BASE+course);await p.evaluate(()=>localStorage.setItem('ee.middle.done','["mid-buck-pwm"]'));await p.reload();
  await p.locator('#buck-workbench-entry a').click();await ready(p);
  await p.locator('input[name="experiment-answer"][value="up"]').check();await p.locator('#workspace-submit').click();
  await p.waitForFunction(()=>document.body.dataset.workspaceStage==='1'&&CircuitEvidence.storageStatus().saved);
  await p.locator('#experiment-run').click();await p.waitForFunction(()=>CircuitEvidence.storageStatus().saved&&CircuitEvidence.load().benchmark.learningWorkspace.experiment.rows.energy.operated);
  const originalExperiment=await p.evaluate(()=>JSON.stringify(CircuitEvidence.load().benchmark.learningWorkspace.experiment));
  await p.locator('details.route summary').click();await p.locator('#workspace-route a[href="topology.html"]').click();await p.waitForURL(BASE+'/workbench/topology.html');await ready(p);
  assert.match(await p.locator('#ws-title').innerText(),/降壓和升壓/);
  assert.match(await p.locator('#scope-note').innerText(),/CCM/);assert.match(await p.locator('#scope-note').innerText(),/並非|不模擬/);
  assert.equal(await p.locator('#ws-voltage').innerText(),'先預測');assert.equal(await p.locator('#topology-comparison').isVisible(),false);
  const storedParams=await p.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.topologyTransfer.params);
  assert.equal(storedParams.duty,.4);assert.equal(storedParams.vin,48);assert.equal(storedParams.esrOhm,0);
  // Intentionally wrong first attempts must remain wrong after remediation.
  await answer(p,'buck',1);assert.equal(await p.locator('#topology-submit').isEnabled(),false);
  await p.locator('#topology-run').click();await p.waitForFunction(()=>CircuitEvidence.storageStatus().saved&&!document.getElementById('topology-comparison').hidden);
  assert.equal(await p.locator('#ws-voltage').innerText(),'24.00 V');assert.equal(await p.locator('#ws-current').innerText(),'96.00 V');
  assert.match(await p.locator('#topology-comparison').innerText(),/40% → 50%/);
  await answer(p,'faster',1);await p.waitForFunction(()=>document.getElementById('ws-feedback').textContent.includes('首次判斷'));
  assert.equal(await p.locator('#ws-steps button').nth(2).isEnabled(),false);
  await answer(p,'separate',2);await answer(p,'path',3);await p.reload();await ready(p);await stage(p,3);
  await answer(p,'copy',3);assert.equal(await p.locator('#ws-result').isVisible(),false);
  await answer(p,'recheck',4);assert.equal(await p.locator('#ws-result').isVisible(),true);
  const result=await p.evaluate(()=>CircuitEvidence.load());
  assert.equal(result.benchmark.learningWorkspace.topologyTransfer.rows.prediction.first.correct,false);
  assert.equal(result.benchmark.learningWorkspace.topologyTransfer.rows.observation.first.correct,false);
  assert.equal(result.benchmark.learningWorkspace.topologyTransfer.rows.return.first.correct,false);
  assert.equal(result.benchmark.learningWorkspace.topologyTransfer.completed,true);
  assert.equal(result.benchmark.outcomeV1,undefined);assert.equal(result.benchmark.beginnerLessons,undefined);
  assert.equal(JSON.stringify(result.benchmark.learningWorkspace.experiment),originalExperiment);
  await p.reload();await ready(p);await stage(p,4);
  for(const width of [320,390]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),engine+' topology width '+width);}
  await p.screenshot({path:`tests/screenshots/cross-${engine}-topology-migration.png`,fullPage:true});
  await p.locator('#ee-experiment').click();await p.waitForURL(/index\.html#experiment-energy$/);await ready(p);
  assert.equal(await p.evaluate(()=>JSON.stringify(CircuitEvidence.load().benchmark.learningWorkspace.experiment)),originalExperiment);
  await p.goto(BASE+'/workbench/index.html#topology');await p.waitForURL(BASE+'/workbench/topology.html');await ready(p);await stage(p,4);
  await p.locator('#deeper').click();await p.waitForURL(BASE+boostCourse);
  assert.equal(await p.evaluate(()=>localStorage.getItem('ee.middle.done')),'["mid-buck-pwm"]');
  await p.goto(BASE+'/workbench/topology.html?from=https://attacker.invalid');await ready(p);await p.locator('#ee-return').click();await p.waitForURL(BASE+course);
  await p.goto(BASE+'/workbench/topology.html');await ready(p);await p.locator('#ee-records').click();await p.waitForURL(/records\.html$/);
  const dl=p.waitForEvent('download');await p.locator('#ee-export-raw').click();assert.match((await dl).suggestedFilename(),/backup/);
  // Invalid CCM and unsupported/malformed nested records must not be rewritten.
  for(const kind of ['dcm','future','malformed']){
   const ctx=await fresh(),q=await ctx.newPage();await q.goto(BASE+'/workbench/index.html');await ready(q);
   const raw=await q.evaluate(kind=>{const e=CircuitEvidence.load(),params=CircuitWorkspace.topologyPlan().params;
    e.benchmark.learningWorkspace||={version:1};e.benchmark.learningWorkspace.topologyTransfer=kind==='future'?{version:999,preserve:'future'}:kind==='malformed'?{version:1,protocol:'unknown',rows:{},preserve:'malformed'}:{version:1,protocol:'topology-workbench-v1',rows:{},params:{...params,loadOhm:1000,inductanceH:20e-6},source:'test invalid CCM',operated:false};
    const raw=JSON.stringify(e);localStorage.setItem('circuit-learning-state-v5',raw);return raw;},kind);
   await q.goto(BASE+'/workbench/topology.html');await q.waitForFunction(()=>['failed','protected'].includes(document.documentElement.dataset.eeWorkbenchState));
   assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),raw,kind+' primary bytes');
   assert.equal(await q.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);
   assert.equal(await q.locator('main').evaluate(n=>n.inert),true);
   await ctx.close();
  }
  // Quota failure: no accepted stage/leave, and the draft remains exportable.
  const quota=await fresh(),q=await quota.newPage();await q.goto(BASE+'/workbench/topology.html');await ready(q);
  await q.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='circuit-learning-state-v5')throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};});
  await q.locator('input[name="topology-answer"][value="both"]').check();await q.locator('#topology-submit').click();await q.waitForFunction(()=>!CircuitEvidence.storageStatus().saved&&document.getElementById('ws-save').textContent.includes('尚未'));
  assert.equal(await q.evaluate(()=>EEWorkbenchHost.leave('index.html#experiment')),false);assert.match(q.url(),/topology\.html$/);assert.equal(await q.locator('#learning-storage-status').isVisible(),true);await quota.close();
  // Same-version conflict uses the real storage event and leaves the winner intact.
  const conflict=await fresh(),a=await conflict.newPage(),b=await conflict.newPage();
  await a.goto(BASE+'/workbench/topology.html');await ready(a);await b.goto(BASE+'/workbench/topology.html');await ready(b);
  await answer(b,'buck',1);await a.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');
  const winner=await b.evaluate(k=>localStorage.getItem(k),key);assert.equal(await a.evaluate(()=>EEWorkbenchHost.leave('index.html#experiment')),false);
  assert.equal(await a.evaluate(k=>localStorage.getItem(k),key),winner);assert.equal(await a.locator('main').evaluate(n=>n.inert),true);
  const popup=a.waitForEvent('popup');await a.locator('#ee-records').click();const backup=await popup;await backup.waitForLoadState('domcontentloaded');assert.match(backup.url(),/records\.html/);await conflict.close();
  // Version update while contract fetch is pending: no legacy normalizer/write.
  const loading=await fresh();let release;const barrier=new Promise(resolve=>release=resolve);
  await loading.route('**/assets/learning/model-contracts-v1.json',async r=>{await barrier;await r.continue();});
  const pending=await loading.newPage(),writer=await loading.newPage();await pending.goto(BASE+'/workbench/topology.html',{waitUntil:'domcontentloaded'});await writer.goto(BASE+'/workbench/records.html');
  const raw6=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'during-contract-fetch'});await writer.evaluate(({key,raw6})=>localStorage.setItem(key,raw6),{key,raw6});
  await pending.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');release();
  await pending.waitForFunction(()=>CircuitModelRegistry.cards.some(c=>c.id==='boost-ccm-control-output'));
  assert.equal(await pending.evaluate(k=>localStorage.getItem(k),key),raw6);assert.equal(await pending.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);await loading.close();
  // Missing model contract fails closed; no initial comparison proof is created.
  const missing=await fresh(),m=await missing.newPage();await missing.route('**/assets/learning/model-contracts-v1.json',r=>r.abort());await m.goto(BASE+'/workbench/topology.html');
  await m.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='failed');assert.equal(await m.locator('main').evaluate(n=>n.inert),true);
  assert.equal(await m.evaluate(()=>JSON.parse(localStorage.getItem('circuit-learning-state-v5')||'{}').benchmark?.learningWorkspace?.topologyTransfer),undefined);await missing.close();
  assert.ok(!requests.some(u=>u.includes('Circuit-Simulation')),'no old site dependency');assert.deepEqual(errors,[]);
  console.log('PASS topology migration '+engine+': local lesson/8-step/comparison return, physical/proof boundaries, reload, invalid CCM, quota, conflicts, future schema, failed contract, mobile');
 }finally{for(const ctx of contexts)await ctx.close().catch(()=>{});await browser.close();}
}
