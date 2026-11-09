/* Actual browser V5 acceptance: original source 3 ADC families, no secondary score owner. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const URL=BASE+'/workbench/adc-assessment.html',KEY='circuit-learning-state-v5';
const FAMILIES=['adc-levels-vs-codes','adc-divider-power','adc-offset-purpose'];
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,engine] of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await engine.launch({headless:true});
 try{
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  const page=await ctx.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  ctx.on('request',r=>{if(new URL(r.url()).origin!==new URL(BASE).origin)external.push(r.url());});
  const ready=()=>page.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='ready');
  const current=async()=>({family:await page.locator('#ee-formal-question').getAttribute('data-family'),role:await page.locator('#ee-formal-question').getAttribute('data-role'),variant:await page.locator('#ee-formal-question').getAttribute('data-variant')});
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
   await page.goto(URL);await ready();
   assert.deepEqual(await current(),{family:FAMILIES[0],role:'baseline',variant:'A'});
   await answer(true);
   let state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   assert.equal(state.questions[FAMILIES[0]].history.length,1);
   assert.equal(state.questions[FAMILIES[0]].history[0].correct,false);
   assert.equal(state.questions[FAMILIES[0]].history[0].confidence,null,'omitted confidence is not zero');
   await page.reload();await ready();
   assert.deepEqual(await current(),{family:FAMILIES[0],role:'transfer',variant:'B'});
   await answer();await page.locator('#ee-formal-next').click();
   assert.equal((await current()).family,FAMILIES[1]);
   for(const family of FAMILIES.slice(1)){
     assert.deepEqual(await current(),{family,role:'baseline',variant:'A'});
     await answer();await page.locator('#ee-formal-next').click();
     assert.equal((await current()).family,family);
     assert.equal((await current()).role,'transfer');
     await answer();await page.locator('#ee-formal-next').click();
   }
   assert.equal(await page.locator('#ee-formal-question').isVisible(),false,'not due must not repeat first attempts');
   state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   for(const id of FAMILIES){
     assert.equal(state.questions[id].history.length,2,id+' history');
     assert.equal(state.questions[id].history[0].firstAttemptForVariant,true);
     assert.equal(state.questions[id].history[1].assessmentRole,'transfer');
   }
   assert.equal(state.questions[FAMILIES[0]].history[0].correct,false);
   assert.match(await page.locator('#ee-formal-summary').innerText(),/分壓器功耗/);
   for(const width of [320,390]){
      await page.setViewportSize({width,height:850});
      const metrics=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(metrics.scroll<=metrics.viewport+2,name+' overflow '+width+': '+JSON.stringify(metrics));
   }
   await page.screenshot({path:'tests/screenshots/cross-'+name+'-adc-formal.png',fullPage:true});
   const backupRequest=page.waitForEvent('download');await page.locator('#ee-formal-backup').click();
   const backup=JSON.parse(readFileSync(await (await backupRequest).path(),'utf8'));
   assert.ok(backup.currentRaw?.includes('adc-levels-vs-codes'));
   await ctx.close();
   // Quota: no accepted feedback and preserve original raw, with exportable V5 draft.
   const quota=await browser.newContext({acceptDownloads:true}),qp=await quota.newPage();
   await qp.goto(URL);await qp.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='ready');
   const original=await qp.evaluate(k=>localStorage.getItem(k),KEY);
   await qp.evaluate(k=>{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(key,v){if(key===k)throw new DOMException('full','QuotaExceededError');return orig.call(this,key,v);};},KEY);
   await qp.locator('input[name="ee-formal-choice"]').first().check();await qp.locator('#ee-formal-submit').click();
   await qp.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='protected');
   assert.equal(await qp.evaluate(k=>localStorage.getItem(k),KEY),original,'quota must not clobber baseline');
   const dl=qp.waitForEvent('download');await qp.locator('#ee-formal-backup').click();
   const backupQuota=JSON.parse(readFileSync(await (await dl).path(),'utf8'));
   assert.ok(backupQuota.evidence?.questions?.[FAMILIES[0]]?.history?.length>=1,'draft attempt must remain exportable');
   await quota.close();
   // Unknown future V5 never gets normalized over existing user bytes.
   const future=await browser.newContext(),fp=await future.newPage();
   await fp.goto(BASE+'/workbench/adc-course.html');
   const raw=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},future:'keep'});
   await fp.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,raw]);await fp.goto(URL);
   await fp.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='protected');
   assert.equal(await fp.evaluate(k=>localStorage.getItem(k),KEY),raw);
   assert.equal(await fp.locator('#ee-formal-submit').isEnabled(),false);await future.close();
   // Held Web Lock: foreign tab wins; retained baseline backup remains reachable
   // from the original Evidence conflict notice's permitted click surface.
   const otherCtx=await browser.newContext({acceptDownloads:true}),a=await otherCtx.newPage(),b=await otherCtx.newPage();
   await a.goto(URL);await a.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='ready');
   const before=await a.evaluate(k=>localStorage.getItem(k),KEY);
   await b.goto(BASE+'/workbench/adc-course.html');
   await b.evaluate(k=>{navigator.locks.request(k,{mode:'exclusive'},()=>new Promise(resolve=>{window.__releaseADC=resolve;}));},KEY);
   await b.waitForFunction(()=>typeof window.__releaseADC==='function');
   await a.locator('input[name="ee-formal-choice"]').first().check();await a.locator('#ee-formal-submit').click();
   const winner=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},winner:'other'});
   await b.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,winner]);
   await a.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='protected');
   await b.evaluate(()=>window.__releaseADC());
   await a.waitForFunction(()=>document.querySelector('#ee-adc-safe-backup')!==null);
   const exportReq=a.waitForEvent('download');await a.locator('#ee-adc-safe-backup').click();
   const safe=JSON.parse(readFileSync(await (await exportReq).path(),'utf8'));
   assert.equal(safe.baselineRaw,before);assert.equal(safe.currentRaw,winner);
   await otherCtx.close();
   // Source omission must fail closed, not show a valid grade or allow writing.
   const missing=await browser.newContext(),mp=await missing.newPage();
   await mp.route('**/workbench/assets/learning/learning-assessment.js',route=>route.abort());
   await mp.goto(URL);await mp.waitForFunction(()=>document.querySelector('#ee-adc-formal-root')?.dataset.state==='protected');
   assert.equal(await mp.locator('#ee-formal-submit').isEnabled(),false);await missing.close();
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   console.log('PASS ADC formal '+name+': 3 original families, wrong baseline→transfer, persisted V5, quotas, conflict backup, future schema, mobile');
  }finally{try{await ctx.close();}catch(_){}}
 }finally{await browser.close();}
}
