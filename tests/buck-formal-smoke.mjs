/* Actual browser V5 acceptance: original source 3 Buck families, no secondary score owner. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const PAGE=BASE+'/workbench/buck-assessment.html',KEY='circuit-learning-state-v5';
const FAMILIES=['buck-ripple-inductance-transfer','buck-dcm-boundary','buck-model-validity'];
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,engine] of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await engine.launch({headless:true});
 try{
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  const page=await ctx.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  ctx.on('request',r=>{if(new URL(r.url()).origin!==new URL(BASE).origin)external.push(r.url());});
  const ready=()=>page.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
  const current=async()=>({family:await page.locator('#ee-formal-question').getAttribute('data-family'),role:await page.locator('#ee-formal-question').getAttribute('data-role'),variant:await page.locator('#ee-formal-question').getAttribute('data-variant')});
  // Next now validates V5 under an async Web Lock. A click only triggers that
  // operation; assert the actual destination state, not the pre-await DOM.
  async function advance(family=null,role=null){
    await page.locator('#ee-formal-next').click();
    await page.waitForFunction(([expectedFamily,expectedRole])=>{
      const root=document.querySelector('#ee-buck-formal-root');
      const panel=document.querySelector('#ee-formal-question');
      const feedback=document.querySelector('#ee-formal-feedback');
      const next=document.querySelector('#ee-formal-next');
      if(root?.dataset.state==='protected')return true;
      if(root?.dataset.state!=='ready'||!panel||!feedback?.hidden||!next?.hidden)return false;
      return expectedFamily===null?panel.hidden:
        !panel.hidden&&panel.dataset.family===expectedFamily&&panel.dataset.role===expectedRole;
    },[family,role],{timeout:15000});
    assert.equal(await page.locator('#ee-buck-formal-root').getAttribute('data-state'),'ready',
      'Next must not fail closed during normal saved V5 navigation');
    if(family!==null){
      const updated=await current();
      assert.equal(updated.family,family);
      assert.equal(updated.role,role);
    }else{
      assert.equal(await page.locator('#ee-formal-question').isVisible(),false,
        'no question must appear before retention becomes due');
    }
  }
  async function answer(incorrect=false){
    const cur=await current();
    const option=await page.evaluate(({family,variant,incorrect})=>{
      const q=window.CircuitQuizBank.questions.find(x=>x.id===family);
      const v=window.CircuitAssessment.expandQuestions([q]).find(x=>x.variantId===variant);
      return v.options.find(o=>o.correct!==incorrect).id;
    },{...cur,incorrect});
    await page.locator('input[name="ee-formal-choice"][value="'+option+'"]').check();
    await page.locator('#ee-formal-submit').click();
    await page.waitForFunction(()=>document.querySelector('#ee-formal-feedback')?.hidden===false);
    assert.equal(await page.locator('#ee-formal-question').evaluate(el=>el.inert),false,'after durable save feedback must be accessible');
    assert.equal(await page.locator('#ee-formal-next').isEnabled(),true);
    return cur;
  }
  try{
   await page.goto(PAGE);await ready();
   assert.deepEqual(await current(),{family:FAMILIES[0],role:'baseline',variant:'A'});
   await answer(true);
   let state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   assert.equal(state.questions[FAMILIES[0]].history.length,1);
   assert.equal(state.questions[FAMILIES[0]].history[0].correct,false);
   assert.equal(state.questions[FAMILIES[0]].history[0].confidence,null,'omitted confidence is not zero');
   await page.reload();await ready();
   assert.deepEqual(await current(),{family:FAMILIES[0],role:'transfer',variant:'B'});
   await answer();await advance(FAMILIES[1],'baseline');
   for(const [index,family] of FAMILIES.slice(1).entries()){
     assert.deepEqual(await current(),{family,role:'baseline',variant:'A'});
     await answer();await advance(family,'transfer');
     await answer();
     if(index<FAMILIES.length-2)await advance(FAMILIES[index+2],'baseline');
     else await advance();
   }
   state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   for(const id of FAMILIES){
     assert.equal(state.questions[id].history.length,2,id+' history');
     assert.equal(state.questions[id].history[0].firstAttemptForVariant,true);
     assert.equal(state.questions[id].history[1].assessmentRole,'transfer');
   }
   assert.equal(state.questions[FAMILIES[0]].history[0].correct,false);
   assert.match(await page.locator('#ee-formal-summary').innerText(),/Buck CCM\/DCM 邊界/);
   for(const width of [320,390]){
      await page.setViewportSize({width,height:850});
      const metrics=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(metrics.scroll<=metrics.viewport+2,name+' overflow '+width+': '+JSON.stringify(metrics));
   }
   await page.screenshot({path:'tests/screenshots/cross-'+name+'-buck-formal.png',fullPage:true});
   const backupRequest=page.waitForEvent('download');await page.locator('#ee-formal-backup').click();
   const backup=JSON.parse(readFileSync(await (await backupRequest).path(),'utf8'));
   assert.ok(backup.currentRaw?.includes('buck-ripple-inductance-transfer'));
   await ctx.close();
   // Quota: no accepted feedback and preserve original raw, with exportable V5 draft.
   const quota=await browser.newContext({acceptDownloads:true}),qp=await quota.newPage();
   await qp.goto(PAGE);await qp.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
   const original=await qp.evaluate(k=>localStorage.getItem(k),KEY);
   await qp.evaluate(k=>{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(key,v){if(key===k)throw new DOMException('full','QuotaExceededError');return orig.call(this,key,v);};},KEY);
   await qp.locator('input[name="ee-formal-choice"]').first().check();await qp.locator('#ee-formal-submit').click();
   await qp.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   assert.equal(await qp.evaluate(k=>localStorage.getItem(k),KEY),original,'quota must not clobber baseline');
   const dl=qp.waitForEvent('download');await qp.locator('#ee-formal-backup').click();
   const backupQuota=JSON.parse(readFileSync(await (await dl).path(),'utf8'));
   assert.ok(backupQuota.evidence?.questions?.[FAMILIES[0]]?.history?.length>=1,'draft attempt must remain exportable');
   await quota.close();
   // Unknown future V5 never gets normalized over existing user bytes.
   const future=await browser.newContext(),fp=await future.newPage();
   await fp.goto(BASE+'/workbench/opamp-course.html');
   const raw=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},future:'keep'});
   await fp.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,raw]);await fp.goto(PAGE);
   await fp.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   assert.equal(await fp.evaluate(k=>localStorage.getItem(k),KEY),raw);
   assert.equal(await fp.locator('#ee-formal-submit').isEnabled(),false);await future.close();
   // Explicit P2 negative control: replace an empty/valid V5 with a future
   // schema in the narrow interval between the entry's raw preflight and the
   // original Evidence.load() call. Source load must NOT be invoked on it,
   // since source migration would queue an empty V5 overwrite.
   const preflightRace=await browser.newContext({acceptDownloads:true}),race=await preflightRace.newPage();
   const futureDuringLoad=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},competitor:'retain exact bytes'});
   await race.addInitScript(({key,foreign})=>{
     const originalGet=Storage.prototype.getItem,originalSet=Storage.prototype.setItem;
     let keyReads=0;
     Storage.prototype.getItem=function(name){
       const value=originalGet.call(this,name);
       if(name===key&&location.pathname.endsWith('/buck-assessment.html')){
         keyReads++;
         if(keyReads===2){originalSet.call(this,name,foreign);window.__foreignInjectedBeforeLoad=true;}
       }
       return value;
     };
   },{key:KEY,foreign:futureDuringLoad});
   await race.goto(PAGE);
   await race.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   assert.equal(await race.evaluate(()=>window.__foreignInjectedBeforeLoad),true,'negative test must actually intercept preflight');
   await race.waitForTimeout(200);
   assert.equal(await race.evaluate(k=>localStorage.getItem(k),KEY),futureDuringLoad,'Evidence migration cannot overwrite foreign schema before protection');
   const raceExport=race.waitForEvent('download');await race.locator('#ee-formal-backup').click();
   const rawExport=JSON.parse(readFileSync(await (await raceExport).path(),'utf8'));
   assert.equal(rawExport.currentRaw,futureDuringLoad,'retained raw must remain exportable without invoking unsafe source load');
   await race.waitForTimeout(120);
   assert.equal(await race.evaluate(k=>localStorage.getItem(k),KEY),futureDuringLoad,'backup must not trigger auto-migration');
   await preflightRace.close();
   // Held Web Lock: a foreign tab wins BEFORE the source V5 load/write.
   // The new guard must stop safely without requiring an Evidence conflict notice.
   // The ordinary backup button remains clickable and keeps both raw snapshots.
   // Missing storage event is not enough to allow a stale displayed baseline.
   // Make Evidence.load observe a competing valid V5 snapshot right after
   // this page has checked its old raw baseline, before it records the answer.
   const snapshotCtx=await browser.newContext(),sc=await snapshotCtx.newPage();
   await sc.goto(PAGE);await sc.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
   await sc.evaluate(k=>{
     const E=window.CircuitEvidence,original=E.load;let injected=false;
     E.load=function(){
       if(!injected){
         injected=true;const snapshot=original(),changed=JSON.parse(JSON.stringify(snapshot));
         changed.events.push({at:new Date().toISOString(),event:'competing-tab'});
         localStorage.setItem(k,JSON.stringify(changed));
       }
       return original();
     };
   },KEY);
   const prior=await sc.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const firstCorrect=await sc.evaluate(()=>window.CircuitQuizBank.questions.find(q=>q.id==='buck-ripple-inductance-transfer').options.find(o=>o.correct).id);
   await sc.locator('input[name="ee-formal-choice"][value="'+firstCorrect+'"]').check();
   await sc.locator('#ee-formal-submit').click();
   await sc.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   const after=await sc.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   assert.equal(after.questions['buck-ripple-inductance-transfer'],undefined,'stale displayed baseline must not write accepted answer');
   assert.equal(after.events.length,prior.events.length+1,'only the other tab writes V5');
   await snapshotCtx.close();
   const otherCtx=await browser.newContext({acceptDownloads:true}),a=await otherCtx.newPage(),b=await otherCtx.newPage();
   await a.goto(PAGE);await a.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
   const before=await a.evaluate(k=>localStorage.getItem(k),KEY);
   await b.goto(BASE+'/workbench/opamp-course.html');
   await b.evaluate(k=>{navigator.locks.request(k,{mode:'exclusive'},()=>new Promise(resolve=>{window.__releaseBuck=resolve;}));},KEY);
   await b.waitForFunction(()=>typeof window.__releaseBuck==='function');
   await a.locator('input[name="ee-formal-choice"]').first().check();await a.locator('#ee-formal-submit').click();
   const winner=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},winner:'other'});
   await b.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,winner]);
   await a.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   // The competing V5 lock deliberately stays held during the backup click.
   // Retained raw and draft must download promptly WITHOUT source E.load/flush.
   const exportReq=a.waitForEvent('download',{timeout:4000});await a.locator('#ee-formal-backup').click();
   const safe=JSON.parse(readFileSync(await (await exportReq).path(),'utf8'));
   assert.equal(safe.baselineRaw,before);assert.equal(safe.currentRaw,winner);
   assert.equal(await a.evaluate(k=>localStorage.getItem(k),KEY),winner);
   // Only after the raw backup succeeds may the other tab release the lock.
   await b.evaluate(()=>window.__releaseBuck());
   assert.equal(await a.evaluate(()=>window.CircuitEvidence.storageStatus().saved),true);
   await otherCtx.close();
   // Actual source-writer conflict is distinct: queue a real Evidence.save()
   // while another tab holds the V5 key lock and then changes the stored raw.
   // Only THIS scenario may require the permitted conflict-notice backup.
   const sourceConflict=await browser.newContext({acceptDownloads:true});
   const sourcePage=await sourceConflict.newPage(),sourceWriter=await sourceConflict.newPage();
   await sourcePage.goto(PAGE);
   await sourcePage.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
   const sourceBaseline=await sourcePage.evaluate(k=>localStorage.getItem(k),KEY);
   await sourceWriter.goto(BASE+'/workbench/opamp-course.html');
   // Queue one key lock at the moment the REAL Buck grader produces an answer,
   // ahead of Evidence.save()'s deferred writer. Do not create a fake unrelated
   // source event: the exported pending draft must contain the Buck answer.
   await sourcePage.evaluate(k=>{
     const A=window.CircuitAssessment,original=A.recordAttempt;
     A.recordAttempt=function(...args){
       const entry=original.apply(this,args);
       navigator.locks.request(k,{mode:'exclusive'},()=>new Promise(resolve=>{window.__releaseSourceBuck=resolve;}));
       return entry;
     };
   },KEY);
   await sourcePage.locator('input[name="ee-formal-choice"]').first().check();
   await sourcePage.locator('#ee-formal-submit').click();
   await sourcePage.waitForFunction(()=>typeof window.__releaseSourceBuck==='function');
   await sourcePage.waitForFunction(()=>window.CircuitEvidence.storageStatus().saved===false);
   const sourceWinner=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},winner:'source-conflict'});
   await sourceWriter.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,sourceWinner]);
   await sourcePage.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   // Real Buck formal attempt still awaits source commit.
   // Both the external winner and our unsaved Buck attempt must be exportable
   // while this pending writer remains blocked by the held V5 lock.
   const pendingDownload=sourcePage.waitForEvent('download',{timeout:4000});
   await sourcePage.locator('#ee-formal-backup').click();
   const pendingExport=JSON.parse(readFileSync(await (await pendingDownload).path(),'utf8'));
   assert.equal(pendingExport.baselineRaw,sourceBaseline);
   assert.equal(pendingExport.currentRaw,sourceWinner);
   assert.ok(pendingExport.pendingDraft?.questions?.[FAMILIES[0]]?.history?.length>=1,
      'uncommitted Buck draft must download while the lock is still held');
   await sourcePage.evaluate(()=>window.__releaseSourceBuck());
   await sourcePage.waitForFunction(()=>window.CircuitEvidence.storageStatus().reason==='conflict');
   await sourcePage.waitForFunction(()=>document.querySelector('#ee-buck-safe-backup')!==null);
   const sourceDownload=sourcePage.waitForEvent('download');
   await sourcePage.locator('#ee-buck-safe-backup').click();
   const sourceExport=JSON.parse(readFileSync(await (await sourceDownload).path(),'utf8'));
   assert.equal(sourceExport.baselineRaw,sourceBaseline);
   assert.equal(sourceExport.currentRaw,sourceWinner);
   assert.ok(sourceExport.pendingDraft?.questions?.[FAMILIES[0]]?.history?.length>=1,
      'actual Buck submitted but uncommitted answer must remain exportable');
   assert.equal(await sourcePage.evaluate(k=>localStorage.getItem(k),KEY),sourceWinner);
   await sourceConflict.close();
   // Deterministic startup interleaving. Delay the source flush response, edit
   // valid V5 bytes during the await (same-tab injection deliberately avoids a
   // storage event), then verify the loaded stale question cannot be displayed.
   const startup=await browser.newContext(),sp=await startup.newPage();
   await sp.goto(PAGE);await sp.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='ready');
   await sp.close();
   const held=await startup.newPage();
   await held.addInitScript(()=>{
     let evidence=null;
     Object.defineProperty(window,'CircuitEvidence',{
       configurable:true,get(){return evidence;},set(owner){
         evidence=owner;
         const sourceFlush=owner.flush.bind(owner);
         let first=true;
         owner.flush=async function(){
           if(first){first=false;window.__buckStartupFlushHeld=true;
             await new Promise(resolve=>{window.__releaseBuckStartupFlush=resolve;});}
           return sourceFlush();
         };
       }
     });
   });
   await held.goto(PAGE);
   await held.waitForFunction(()=>window.__buckStartupFlushHeld===true);
   await held.evaluate(k=>{
     const state=JSON.parse(localStorage.getItem(k));
     state.events.push({at:new Date().toISOString(),type:'cross-tab-like-startup-change'});
     localStorage.setItem(k,JSON.stringify(state));
   },KEY);
   await held.evaluate(()=>window.__releaseBuckStartupFlush());
   await held.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   assert.equal(await held.locator('#ee-formal-submit').isEnabled(),false);
   await startup.close();
   // Source omission must fail closed, not show a valid grade or allow writing.
   const missing=await browser.newContext(),mp=await missing.newPage();
   await mp.route('**/workbench/assets/learning/learning-assessment.js',route=>route.abort());
   await mp.goto(PAGE);await mp.waitForFunction(()=>document.querySelector('#ee-buck-formal-root')?.dataset.state==='protected');
   assert.equal(await mp.locator('#ee-formal-submit').isEnabled(),false);await missing.close();
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   console.log('PASS Buck formal '+name+': 3 original families, wrong baseline→transfer, persisted V5, quotas, conflict backup, future schema, mobile');
  }finally{try{await ctx.close();}catch(_){}}
 }finally{await browser.close();}
}
