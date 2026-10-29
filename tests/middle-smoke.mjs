/** Middle-volume UI and engineering-math regression. Run after starting local http.server. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir('tests/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],failures=[];
const desktop=await browser.newContext({viewport:{width:1440,height:900}});
const page=await desktop.newPage();
page.on('pageerror',err=>errors.push(err.message));
async function visit(route,marker){await page.goto(BASE+'/'+route);await page.locator(marker).first().waitFor({timeout:10000})}
async function run(name,fn){try{await fn();console.log('PASS middle',name)}catch(err){failures.push({name,message:err.stack});console.error('FAIL middle',name,err.stack)}}
const chapters=['mid-basics','mid-modes','mid-boost','mid-buckboost','mid-bridge','mid-flyback','mid-magnetic'];
await run('seven topics, 34 lessons and independent progress',async()=>{
  await visit('middle.html#home','.subject-card');
  assert.equal(await page.locator('.subject-card').count(),7);
  assert.equal(await page.evaluate(()=>EE_DATA.chapters.reduce((n,c)=>n+c.lessons.length,0)),34);
  assert.equal(await page.evaluate(()=>EE_DATA.pageCount),52);
  assert.equal(await page.locator('a[href="./index.html"]').count()>0,true);
  assert.equal(await page.locator('a[href="#slides/all"]').count()>0,true);
  await page.screenshot({path:'tests/screenshots/middle-home-desktop.png',fullPage:true});
});
await run('all seven chapter views, engineering labs and controls',async()=>{
  for(const id of chapters){
    await visit('middle.html#chapter/'+id,'#lab-holder .lab');
    const count=await page.locator('#lab-holder [data-lab-input]').count();
    assert.ok(count>=3,'Missing controls '+id);
    assert.equal(await page.locator('#lab-holder .output-card').count(),4);
    const slider=page.locator('#lab-holder [data-lab-input]').first();
    const old=await slider.inputValue();
    const max=Number(await slider.getAttribute('max'));
    const min=Number(await slider.getAttribute('min'));
    const next=String(Math.abs(Number(old)-min)<.0001?max:min);
    await slider.evaluate((el,val)=>{el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}))},next);
    assert.equal(await slider.inputValue(),next);
    assert.equal(await page.locator('#lab-holder .lab-chart svg').count(),1);
    if(id==='mid-modes')await page.screenshot({path:'tests/screenshots/middle-modes-desktop.png',fullPage:true});
  }
});
await run('all 34 lessons and inline quiz',async()=>{
  const lessons=await page.evaluate(()=>EE_DATA.chapters.flatMap(c=>c.lessons.map(l=>[c.id,l.id,l.title])));
  assert.equal(lessons.length,34);
  for(const [chapter,lesson,title] of lessons){
    await visit('middle.html#lesson/'+chapter+'/'+lesson,'.lesson-header h1');
    assert.equal(await page.locator('.lesson-header h1').innerText(),title);
    assert.equal(await page.locator('.reading-block').count()>=4,true);
    assert.equal(await page.locator('#quick-check .quiz-choice').count(),3);
    assert.equal(await page.locator('.formula-panel').count(),1);
  }
  await visit('middle.html#lesson/mid-basics/mid-topologies','.lesson-header h1');
  await page.locator('#quick-check .quiz-choice').nth(2).click();
  assert.ok((await page.locator('#quick-check .quiz-feedback').innerText()).includes('答對'));
  await page.locator('[data-action="complete"]').click();
  assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('ee.middle.done')||'[]'))).includes('mid-topologies'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('ee.done')),null);
});
await run('52 slide summaries, local PDF viewer placeholder, boundary pages',async()=>{
  await visit('middle.html#slides/all','.slide-card');
  assert.equal(await page.locator('.slide-card').count(),52);
  for(const n of [1,2,5,23,33,40,51,52]){
    await visit('middle.html#slide/'+n,'.slide-transcript');
    const text=await page.locator('.slide-transcript').innerText();
    assert.ok(text.length>5,'missing summary '+n);
    assert.equal(await page.locator('#source-pdf-holder input[type="file"]').count(),1);
    assert.ok((await page.locator('.reading-block h2').last().innerText()).includes('摘要'));
  }
  await visit('middle.html#slide/52','.slide-transcript');
  assert.equal(await page.locator('.lesson-pager a[href="#slide/53"]').count(),0);
  await page.screenshot({path:'tests/screenshots/middle-slide-desktop.png',fullPage:true});
});
await run('search, chapter quiz, upper-volume switch',async()=>{
  await visit('middle.html#home','.subject-card');
  await page.locator('#search-trigger').click();
  await page.locator('#search-input').fill('Flyback');
  assert.ok(await page.locator('#search-results .search-result').count()>0);
  await page.locator('#search-input').press('Escape');
  assert.equal(await page.locator('#search-overlay').isHidden(),true);
  await visit('middle.html#quiz/mid-modes','.quiz-card');
  assert.equal(await page.locator('.quiz-choice').count(),3);
  await page.locator('.quiz-choice').nth(1).click();
  assert.ok(await page.locator('.quiz-feedback').count()>0);
  await page.locator('[data-action="quiz-next"]').click();
  assert.ok((await page.locator('.quiz-meter').innerText()).includes('第 2 / 3'));
  await visit('index.html#home','.subject-card');
  assert.equal(await page.locator('.subject-card').count(),7);
  assert.equal(await page.locator('a[href="./middle.html"]').count()>0,true);
});
await run('mobile navigation, no horizontal overflow',async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const mobile=await ctx.newPage();
  mobile.on('pageerror',err=>errors.push(err.message));
  await mobile.goto(BASE+'/middle.html#home');
  await mobile.locator('.subject-card').first().waitFor();
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  await mobile.locator('#menu-toggle').click();
  assert.equal(await mobile.getAttribute('#menu-toggle','aria-expanded'),'true');
  await mobile.locator('.side-chapter').nth(5).click();
  await mobile.locator('.chapter-hero h1').waitFor();
  assert.ok((await mobile.locator('.chapter-hero h1').innerText()).includes('Flyback'));
  await mobile.screenshot({path:'tests/screenshots/middle-mobile.png',fullPage:true});
  await ctx.close();
});
await run('no uncaught JavaScript exceptions',async()=>assert.deepEqual(errors,[]));
await browser.close();
if(failures.length){console.error(failures.length+' middle-volume tests failed.');process.exit(1)}
console.log('All middle-volume browser tests passed.');