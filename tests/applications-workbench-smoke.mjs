/* Real browser gate. Source controls/models/proof and real Evidence/Web Locks remain active.
 * Local Node lifecycle fixtures do NOT substitute for this suite. */
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const course='/middle.html#lesson/mid-basics/mid-buck-pwm';
const app='/workbench/applications.html',key='circuit-learning-state-v5';
mkdirSync('tests/screenshots',{recursive:true});
for(const [engine,type]of process.argv.includes('--cross-browser')?[['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]]){
 const browser=await type.launch({headless:true}),contexts=[],errors=[],oldRequests=[];
 async function fresh(){const c=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(c);
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  c.on('request',r=>{if(r.url().includes('Circuit-Simulation'))oldRequests.push(r.url());});
  await c.route('**/*',r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());return c;}
 async function ready(p){await p.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved&&!document.querySelector('main').inert);}
 async function stage(p,id,n){await p.waitForFunction(({id,n})=>{const panel=document.getElementById('guided-applications');return panel?.dataset.applicationId===id&&panel.dataset.applicationStage===String(n)&&CircuitEvidence.storageStatus().saved;},{id,n});}
 async function answer(p,value,id,n,wrong=false){await p.locator(`input[name="application-answer"][value="${value}"]`).check();await p.locator('#application-submit').click();
  if(wrong)await p.waitForFunction(()=>CircuitEvidence.storageStatus().saved&&document.getElementById('application-status').textContent.includes('首次判斷'));
  else await stage(p,id,n);}
 async function prepare(p,id){await p.locator('#application-prepare').click();await p.waitForFunction(id=>CircuitEvidence.storageStatus().saved&&CircuitEvidence.load().benchmark.learningWorkspace.topologyApplications.rows[id]?.prepared&&document.getElementById('application-status').textContent.includes('起始條件'),id);}
 async function topologyAnswer(p,value,n){await p.locator(`input[name="topology-answer"][value="${value}"]`).check();await p.locator('#topology-submit').click();await p.waitForFunction(n=>document.body.dataset.workspaceStage===String(n)&&CircuitEvidence.storageStatus().saved,n);}
 try{
  const c=await fresh(),p=await c.newPage();
  await p.goto(BASE+course);await p.evaluate(()=>localStorage.setItem('ee.middle.done','["mid-buck-pwm"]'));await p.reload();
  await p.locator('#buck-workbench-entry a').click();await ready(p);
  await p.locator('input[name="experiment-answer"][value="up"]').check();await p.locator('#workspace-submit').click();
  await p.waitForFunction(()=>document.body.dataset.workspaceStage==='1'&&CircuitEvidence.storageStatus().saved);
  await p.locator('#experiment-run').click();await p.waitForFunction(()=>CircuitEvidence.load().benchmark.learningWorkspace.experiment.rows.energy.operated&&CircuitEvidence.storageStatus().saved);
  const experiment=await p.evaluate(()=>JSON.stringify(CircuitEvidence.load().benchmark.learningWorkspace.experiment));
  await p.locator('details.route summary').click();await p.locator('#workspace-route a[href="topology.html"]').click();await p.waitForURL(BASE+'/workbench/topology.html');await ready(p);
  await topologyAnswer(p,'both',1);await p.locator('#topology-run').click();await p.waitForFunction(()=>CircuitEvidence.storageStatus().saved&&!document.getElementById('topology-comparison').hidden);
  await topologyAnswer(p,'separate',2);await topologyAnswer(p,'path',3);await topologyAnswer(p,'recheck',4);
  const comparison=await p.evaluate(()=>JSON.stringify(CircuitEvidence.load().benchmark.learningWorkspace.topologyTransfer));
  await p.locator('#ws-next').click();await p.waitForURL(BASE+app);await ready(p);
  assert.equal(await p.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.topologyApplications),undefined,'initial viewing creates no exercise proof');
  assert.equal(await p.locator('main').evaluate(n=>n.inert),false);
  const lessons=await p.evaluate(()=>CircuitWorkspace.applicationLessons());assert.equal(lessons.length,4);
  for(const l of lessons){
   await p.locator('#guided-applications > nav[aria-label="四種電路練習"] button').filter({hasText:l.label}).click();await stage(p,l.id,0);
   assert.equal(await p.locator('#application-comparison').count(),0,'no revealed source result before operation');
   await prepare(p,l.id);
   const native=await p.evaluate(id=>{const plan=CircuitWorkspace.applicationPlan(id);return Object.entries(plan.before).map(([id,want])=>({id,want,got:document.getElementById(id).tagName==='SELECT'?document.getElementById(id).value:Number(document.getElementById(id).value)}));},l.id);
   for(const value of native)assert.equal(value.got,value.want,'native grid '+value.id);
   await answer(p,'higher',l.id,1);
   // Alter a real native control: the source operation must refuse noncanonical input.
   const drifted=await p.evaluate(id=>{
    const name=Object.keys(CircuitWorkspace.applicationPlan(id).before).find(key=>document.getElementById(key).type==='range');
    const input=document.getElementById(name),before=input.value;
    input.stepUp();if(input.value===before)input.stepDown();
    input.dispatchEvent(new Event('input',{bubbles:true}));return input.value!==before;
   },l.id);
   assert.equal(drifted,true,l.id+' native control moved off its baseline');
   assert.equal(await p.locator('#application-run').isEnabled(),false);
   await prepare(p,l.id);await p.locator('#application-run').click();
   await p.waitForFunction(id=>CircuitEvidence.storageStatus().saved&&CircuitEvidence.load().benchmark.learningWorkspace.topologyApplications.rows[id]?.operated&&!!document.getElementById('application-comparison'),l.id);
   const observed=await p.evaluate(id=>{const row=CircuitEvidence.load().benchmark.learningWorkspace.topologyApplications.rows[id],lesson=CircuitWorkspace.applicationLessons().find(l=>l.id===id),plan=CircuitWorkspace.applicationPlan(id);return {row,expected:CircuitWorkspace.applicationRun(id,plan.after),metrics:lesson.metrics,values:Object.entries(plan.after).map(([id,want])=>({id,want,got:document.getElementById(id).tagName==='SELECT'?document.getElementById(id).value:Number(document.getElementById(id).value)}))};},l.id);
   for(const v of observed.values)assert.equal(v.got,v.want,'actual operation '+v.id);
   for(const [metric]of observed.metrics)assert.equal(observed.row.after.result[metric],observed.expected.result[metric]);
   assert.equal(observed.row.model.id,l.modelId);assert.equal(observed.row.first.correct,false);
   assert.match(await p.locator('.application-boundary').innerText(),new RegExp(l.boundary.slice(0,8)));
   await answer(p,'higher',l.id,1,true);await answer(p,'lower',l.id,2);
   await answer(p,'other',l.id,2,true);await answer(p,'reason',l.id,3);
   await p.reload();await ready(p);await stage(p,l.id,3);
   assert.match(await p.locator('#application-live-state').innerText(),/原工具目前/,'saved snapshot not silently applied as current controls');
   for(const width of [320,390]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),engine+' '+l.id+' '+width+'px overflow');}
   await p.screenshot({path:`tests/screenshots/cross-${engine}-applications-${l.id}.png`,fullPage:true});await p.setViewportSize({width:1280,height:900});
  }
  const saved=await p.evaluate(()=>CircuitEvidence.load()),record=saved.benchmark.learningWorkspace.topologyApplications;
  assert.equal(record.completed,true);for(const l of lessons){const row=record.rows[l.id];assert.equal(row.first.correct,false);assert.equal(row.observationFirst.correct,false);assert.equal(row.reasonFirst.correct,false);assert.equal(row.reasonPassed,true);}
  assert.equal(saved.benchmark.outcomeV1,undefined);assert.equal(saved.benchmark.beginnerLessons,undefined);
  assert.equal(JSON.stringify(saved.benchmark.learningWorkspace.experiment),experiment);assert.equal(JSON.stringify(saved.benchmark.learningWorkspace.topologyTransfer),comparison);
  assert.equal(await p.evaluate(()=>localStorage.getItem('ee.middle.done')),'["mid-buck-pwm"]');
  await p.locator('#application-next').click();await p.waitForURL(BASE+'/workbench/coverage.html');assert.match(await p.locator('body').innerText(),/評量.*待遷入/);
  await p.locator('a[href="applications.html"]').click();await ready(p);await stage(p,'inverter',3);
  await p.locator('#ee-comparison').click();await p.waitForURL(BASE+'/workbench/topology.html');await ready(p);
  await p.locator('#ee-experiment').click();
  await p.waitForURL(url=>url.pathname===new URL(BASE+'/workbench/index.html').pathname&&url.hash.startsWith('#experiment'));
  await ready(p);await p.evaluate(()=>location.hash='applications');await p.waitForURL(BASE+app);await ready(p);
  await p.goto(BASE+'/workbench/topology.html');await ready(p);
  await p.goto(BASE+'/workbench/index.html#applications');await p.waitForURL(BASE+app);await ready(p);
  await p.goBack();await p.waitForURL(BASE+'/workbench/topology.html');await ready(p);
  await p.goForward();await p.waitForURL(BASE+app);await ready(p);
  await p.locator('#ee-return').click();await p.waitForURL(BASE+course);
  // Malformed/future/model-mismatched source evidence is preserved byte for byte.
  for(const kind of ['future','nested','model','snapshot']){
   const qctx=await fresh(),q=await qctx.newPage();await q.goto(BASE+app);await ready(q);
   const raw=await q.evaluate(({saved,kind})=>{const s=structuredClone(saved);if(kind==='future')s.version=6;else if(kind==='nested')s.benchmark.learningWorkspace.topologyApplications.version=999;else if(kind==='model')s.benchmark.learningWorkspace.topologyApplications.rows.llc.model.version='999.0.0';else s.benchmark.learningWorkspace.topologyApplications.rows.psfb.after.result.idealSecondaryV*=10;const raw=JSON.stringify(s);localStorage.setItem('circuit-learning-state-v5',raw);return raw;},{saved,kind});
   await q.reload();await q.waitForFunction(()=>['protected','failed'].includes(document.documentElement.dataset.eeWorkbenchState));
   assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),raw,kind+' raw bytes');assert.equal(await q.locator('main').evaluate(n=>n.inert),true);
   assert.equal(await q.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);
   const pop=q.waitForEvent('popup');await q.locator('#ee-records').click();const backup=await pop;await backup.waitForLoadState('domcontentloaded');
   const download=backup.waitForEvent('download');await backup.locator('#ee-export-raw').click();assert.match((await download).suggestedFilename(),/backup/);await qctx.close();
  }
  // Deliberately defer storage-event delivery. Exercise the actual host both
  // before flush and in its awaited boundary, without replacing Evidence.flush.
  for(const timing of ['before-flush','after-flush-start']){
   for(const kind of ['same-version','nested-future']){
    const ctx=await fresh(),q=await ctx.newPage();await q.goto(BASE+app);await ready(q);await prepare(q,'pfc');
    const result=await q.evaluate(async({key,timing,kind})=>{
     const s=JSON.parse(localStorage.getItem(key));
     if(kind==='same-version')s.benchmark.learningWorkspace.topologyApplications.currentLesson='psfb';
     else s.benchmark.learningWorkspace.topologyApplications.version=999;
     const winner=JSON.stringify(s);let leaving;
     if(timing==='after-flush-start')leaving=EEWorkbenchHost.leave('topology.html');
     localStorage.setItem(key,winner);
     if(!leaving)leaving=EEWorkbenchHost.leave('topology.html');
     return {left:await leaving,winner,actual:localStorage.getItem(key),state:document.documentElement.dataset.eeWorkbenchState};
    },{key,timing,kind});
    assert.equal(result.left,false,kind+' '+timing+' must cancel navigation');
    assert.equal(result.actual,result.winner,kind+' '+timing+' preserves raw winner');
    assert.equal(result.state,'protected');assert.match(q.url(),/applications\.html/);
    assert.equal(await q.locator('main').evaluate(n=>n.inert),true);
    const popup=q.waitForEvent('popup');await q.locator('#ee-records').click();const backup=await popup;await backup.waitForLoadState('domcontentloaded');
    const download=backup.waitForEvent('download');await backup.locator('#ee-export-raw').click();assert.match((await download).suggestedFilename(),/backup/);
    await ctx.close();
   }
  }
  // Real cross-tab conflict: stale page cannot navigate or overwrite winner.
  {
   const ctx=await fresh(),a=await ctx.newPage(),b=await ctx.newPage();await a.goto(BASE+app);await ready(a);await prepare(a,'pfc');await b.goto(BASE+app);await ready(b);
   await answer(b,'higher','pfc',1);await a.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');const winner=await b.evaluate(k=>localStorage.getItem(k),key);
   assert.equal(await a.evaluate(()=>EEWorkbenchHost.leave('topology.html')),false);assert.equal(await a.evaluate(k=>localStorage.getItem(k),key),winner);await ctx.close();
  }
  // Browser quota injection tests only the storage contract, not a bypass of any runtime policy.
  {
   const ctx=await fresh(),q=await ctx.newPage();await q.goto(BASE+app);await ready(q);
   await q.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='circuit-learning-state-v5')throw new DOMException('full','QuotaExceededError');return window.originalSetItem.call(this,k,v);};});
   await q.locator('#application-prepare').click();await q.waitForFunction(()=>!CircuitEvidence.storageStatus().saved&&document.getElementById('application-status').textContent.includes('尚未'));
   assert.equal(await q.locator('#application-submit').isEnabled(),false);assert.equal(await q.evaluate(()=>EEWorkbenchHost.leave('topology.html')),false);
   await q.evaluate(async()=>{Storage.prototype.setItem=window.originalSetItem;CircuitEvidence.retrySave();await CircuitEvidence.flush();});await q.waitForFunction(()=>CircuitEvidence.storageStatus().saved&&!document.getElementById('application-submit').disabled);await ctx.close();
  }
  // Held real Web Lock: accepted stage cannot precede durable save.
  {
   const ctx=await fresh(),q=await ctx.newPage(),locker=await ctx.newPage();await q.goto(BASE+app);await ready(q);await prepare(q,'pfc');await locker.goto(BASE+'/workbench/records.html');
   await locker.evaluate(k=>{window.lockReady=false;window.lockPromise=navigator.locks.request(k,()=>new Promise(resolve=>{window.releaseLock=resolve;window.lockReady=true;}));},key);await locker.waitForFunction(()=>window.lockReady);
   await q.locator('input[name="application-answer"][value="higher"]').check();await q.locator('#application-submit').click();await q.waitForFunction(()=>document.getElementById('application-status').textContent.includes('尚未'));
   assert.equal(await q.locator('#guided-applications').getAttribute('data-application-stage'),'0');assert.equal(await q.locator('#application-submit').isEnabled(),false);
   await locker.evaluate(()=>window.releaseLock());await stage(q,'pfc',1);await ctx.close();
  }
  // A protected cross-tab conflict still allows a read-only download of the pending draft.
  for(const kind of ['nested','root']){
   const ctx=await fresh(),q=await ctx.newPage(),writer=await ctx.newPage();
   await q.goto(BASE+app);await ready(q);await prepare(q,'pfc');
   await writer.goto(BASE+'/workbench/records.html');
   await writer.evaluate(k=>{window.lockPromise=navigator.locks.request(k,()=>new Promise(resolve=>{window.releaseLock=resolve;}));},key);
   await writer.waitForFunction(()=>typeof window.releaseLock==='function');
   await q.locator('input[name="application-answer"][value="higher"]').check();
   await q.locator('#application-submit').click();
   await q.waitForFunction(()=>!CircuitEvidence.storageStatus().saved);
   const winner=await writer.evaluate(({key,kind})=>{
    const state=JSON.parse(localStorage.getItem(key));
    if(kind==='root')state.version=6;
    else state.benchmark.learningWorkspace.topologyApplications.version=999;
    const raw=JSON.stringify(state);localStorage.setItem(key,raw);return raw;
   },{key,kind});
   await q.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');
   const downloading=q.waitForEvent('download');await q.locator('#ee-application-draft-backup').click();
   const download=await downloading;
   assert.equal(download.suggestedFilename(),'circuit-applications-unsaved-draft.json');
   const draft=JSON.parse(readFileSync(await download.path(),'utf8'));
   assert.equal(draft.rows.pfc.first.answer,'higher');
   await writer.evaluate(()=>window.releaseLock());await q.evaluate(()=>CircuitEvidence.flush());
   assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),winner);await ctx.close();
  }
  // New root version while contract request is pending cannot enter the source normalizer.
  {
   const ctx=await fresh();let release,requested;const barrier=new Promise(r=>release=r),seen=new Promise(r=>requested=r);
   await ctx.route('**/assets/learning/model-contracts-v1.json',async r=>{requested();await barrier;await r.continue();});
   const q=await ctx.newPage(),writer=await ctx.newPage();await q.goto(BASE+app,{waitUntil:'domcontentloaded'});await seen;await writer.goto(BASE+'/workbench/records.html');
   const raw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'while-loading'});await writer.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
   await q.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected');release();await q.waitForFunction(()=>CircuitModelRegistry.cards.some(c=>c.id==='llc-normalized-fha'));
   assert.equal(await q.evaluate(k=>localStorage.getItem(k),key),raw);assert.equal(await q.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);await ctx.close();
  }
  {
   const ctx=await fresh();await ctx.route('**/assets/learning/model-contracts-v1.json',r=>r.abort());const q=await ctx.newPage();await q.goto(BASE+app);await q.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='failed');assert.equal(await q.locator('main').evaluate(n=>n.inert),true);assert.equal(await q.evaluate(()=>JSON.parse(localStorage.getItem('circuit-learning-state-v5')||'{}').benchmark?.learningWorkspace?.topologyApplications),undefined);await ctx.close();
  }
  assert.deepEqual(oldRequests,[],'no old site dependency');assert.deepEqual(errors,[],'no uncaught browser errors');
  console.log('PASS applications migration '+engine+': course/comparison route, four original controls/models, wrong-first remediation, reload, saved return, quota/Web Locks/conflict/version/assets and mobile');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();}
}
