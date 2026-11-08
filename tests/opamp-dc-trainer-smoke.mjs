/* Real browser acceptance, not a mock grade or model. */
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {mkdirSync} from 'node:fs';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const PAGE=BASE+'/workbench/opamp-dc-trainer.html',KEY='opamp-dc-reasoning-trainer-v2';
mkdirSync('tests/screenshots',{recursive:true});
for(const [engine,type] of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await type.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage();
 const errors=[],old=[];page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>{if(r.url().includes('Circuit-Simulation'))old.push(r.url());});
 try{
  await page.goto(PAGE);await page.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='ready');
  assert.match(await page.locator('[data-current-level]').innerText(),/Level 0/);
  assert.equal(await page.locator('[data-mastery-list] .mastery-row').count(),8);
  const q=await page.evaluate(()=>document.querySelector('[data-opamp-dc-trainer]').__trainer.session.current);
  assert.equal(q.skill,'UNIT_CONVERSION');
  await page.locator('[data-trainer-answer]').fill(String(q.expected));await page.locator('[data-trainer-submit]').click();
  await page.waitForFunction(k=>Boolean(JSON.parse(localStorage.getItem(k)||'null')?.skills?.UNIT_CONVERSION?.attempts),KEY);
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).skills.UNIT_CONVERSION.attempts,KEY),1);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='ready');
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).skills.UNIT_CONVERSION.attempts,KEY),1);
  assert.equal(await page.locator('[data-trainer-choices]').isVisible(),false,'unused choice UI must remain hidden');
  assert.equal(await page.locator('[data-trainer-report]').isVisible(),false,'unfinished report must remain hidden');
  for(const width of [320,390]){
    await page.setViewportSize({width,height:800});
    const metrics=await page.evaluate(()=>({
      viewport:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      offenders:[...document.body.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>innerWidth+2).slice(0,8).map(el=>({tag:el.tagName,className:el.getAttribute('class'),right:Math.round(el.getBoundingClientRect().right)}))
    }));
    assert.ok(metrics.scrollWidth<=metrics.viewport+2,'overflow '+width+': '+JSON.stringify(metrics));
  }
  await page.screenshot({path:'tests/screenshots/cross-'+engine+'-opamp-dc-trainer.png',fullPage:true});
  const quota=await browser.newContext(),qp=await quota.newPage();await qp.goto(PAGE);await qp.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='ready');
  const original=await qp.evaluate(k=>localStorage.getItem(k),KEY);
  await qp.evaluate(()=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='opamp-dc-reasoning-trainer-v2')throw new DOMException('full','QuotaExceededError');return old.call(this,k,v);};});
  const q2=await qp.evaluate(()=>document.querySelector('[data-opamp-dc-trainer]').__trainer.session.current);
  await qp.locator('[data-trainer-answer]').fill(String(q2.expected));await qp.locator('[data-trainer-submit]').click();
  await qp.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='protected');
  assert.equal(await qp.evaluate(k=>localStorage.getItem(k),KEY),original);
  const dl=qp.waitForEvent('download');await qp.locator('#ee-trainer-export').click();assert.match((await dl).suggestedFilename(),/backup\.json/);await quota.close();
  const future=await browser.newContext(),fp=await future.newPage();await fp.goto(BASE+'/workbench/opamp-course.html');
  const raw=JSON.stringify({version:'999.0.0',skills:{},foreign:'untouched'});
  await fp.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,raw]);await fp.goto(PAGE);
  await fp.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='protected');
  assert.equal(await fp.evaluate(k=>localStorage.getItem(k),KEY),raw);
  assert.equal(await fp.locator('[data-trainer-submit]').isEnabled(),false);await future.close();
  const conflict=await browser.newContext(),a=await conflict.newPage(),b=await conflict.newPage();await a.goto(PAGE);await b.goto(PAGE);
  await a.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='ready');await b.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='ready');
  const q3=await b.evaluate(()=>document.querySelector('[data-opamp-dc-trainer]').__trainer.session.current);
  await b.locator('[data-trainer-answer]').fill(String(q3.expected));await b.locator('[data-trainer-submit]').click();
  await a.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='protected');await conflict.close();
  const missing=await browser.newContext(),mp=await missing.newPage();await missing.route('**/assets/opamp-dc-trainer.js',r=>r.abort());await mp.goto(PAGE);
  await mp.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='protected');
  assert.equal(await mp.locator('[data-trainer-submit]').isEnabled(),false);await missing.close();
  const denied=await browser.newContext(),dp=await denied.newPage();
  await dp.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError');}}));
  await dp.goto(PAGE);
  await dp.waitForFunction(()=>document.documentElement.dataset.eeTrainerState==='protected');
  assert.equal(await dp.locator('[data-trainer-submit]').isEnabled(),false);
  assert.equal(await dp.locator('#ee-trainer-export').isEnabled(),true);
  await denied.close();
  assert.deepEqual(errors,[]);assert.deepEqual(old,[]);
  console.log('PASS OP DC Trainer '+engine+': original model, persisted mastery, reload, quota draft, conflict, future schema, mobile, missing JS');
 }finally{await ctx.close();await browser.close();}
}