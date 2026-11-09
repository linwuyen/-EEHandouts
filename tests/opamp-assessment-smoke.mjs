import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173',KEY='circuit-learning-state-v5';
const engines=process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium};
for(const [name,type] of Object.entries(engines)){
 const browser=await type.launch({headless:true});
 try{
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/workbench/opamp-assessment.html');
  await page.waitForFunction(()=>document.querySelector('#ee-formal-root')?.dataset.state==='ready');
  assert.equal(await page.locator('#ee-formal-question').getAttribute('data-role'),'baseline');
  const id=await page.evaluate(()=>window.CircuitOpampAssessment.baseQuestion.options.find(x=>!x.correct).id);
  await page.locator('input[name="ee-formal-choice"][value="'+id+'"]').check();
  await page.locator('#ee-formal-submit').click();
  await page.waitForFunction(()=>document.querySelector('#ee-formal-feedback')?.hidden===false);
  let info=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).questions['opamp-slew-large-signal'],KEY);
  assert.equal(info.history.length,1);assert.equal(info.history[0].correct,false);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#ee-formal-root')?.dataset.state==='ready');
  assert.equal(await page.locator('#ee-formal-question').getAttribute('data-role'),'transfer');
  const variant=await page.locator('#ee-formal-question').getAttribute('data-variant');
  const correct=await page.evaluate(variant=>{
   const original=window.CircuitQuizBank.questions.find(x=>x.id==='opamp-slew-large-signal');
   return window.CircuitAssessment.expandQuestions([original]).find(x=>x.variantId===variant).options.find(o=>o.correct).id;
  },variant);
  await page.locator('input[name="ee-formal-choice"][value="'+correct+'"]').check();
  await page.locator('#ee-formal-submit').click();
  await page.waitForFunction(()=>document.querySelector('#ee-formal-feedback')?.hidden===false);
  await page.locator('#ee-formal-next').click();
  await page.waitForFunction(()=>document.querySelector('#ee-formal-question')?.hidden===true);
  info=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).questions['opamp-slew-large-signal'],KEY);
  assert.equal(info.history.length,2);assert.equal(info.history[0].correct,false);
  for(const width of [320,390]){await page.setViewportSize({width,height:850});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'overflow '+width);}
  const old=await page.evaluate(k=>localStorage.getItem(k),KEY);assert.ok(old);
  const backupPromise=page.waitForEvent('download');await page.locator('#ee-formal-backup').click();
  assert.match((await backupPromise).suggestedFilename(),/backup\.json$/);
  await ctx.close();
  const future=await browser.newContext(),fp=await future.newPage();await fp.goto(BASE+'/workbench/opamp-course.html');
  const raw=JSON.stringify({schema:'circuit-learning-state',version:999,questions:{},future:'keep'});
  await fp.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,raw]);
  await fp.goto(BASE+'/workbench/opamp-assessment.html');
  await fp.waitForFunction(()=>document.querySelector('#ee-formal-root')?.dataset.state==='protected');
  assert.equal(await fp.evaluate(k=>localStorage.getItem(k),KEY),raw);
  assert.equal(await fp.locator('#ee-formal-submit').isEnabled(),false);await future.close();
  assert.deepEqual(errors,[]);
  console.log('PASS OP formal assessment '+name+': first answer, transfer/reload, due boundary, V5, backup, 320/390');
 }finally{await browser.close();}
}