/* Browser regression: every published lesson has an operable investigation. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
await fs.mkdir('tests/screenshots',{recursive:true});
const errors=[],failures=[];
let checked=0,changed=0,verified=0;

async function inspect(file,expectedCount,width) {
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',err=>errors.push(file+': '+err.message));
  await page.goto(BASE+'/'+file+'#home');
  await page.locator('.subject-card').first().waitFor({timeout:15000});
  const lessons=await page.evaluate(()=>window.EE_DATA.chapters.flatMap(c=>c.lessons.map(l=>({chapter:c.id,id:l.id}))));
  assert.equal(lessons.length,expectedCount,file+' lesson count');
  const missing=await page.evaluate(ls=>ls.filter(x=>!window.EE_INTERACTIVE?.catalog[x.id]),lessons);
  assert.deepEqual(missing,[],file+' must have a configured model for every lesson');

  for(const x of lessons){
    const hash='#lesson/'+x.chapter+'/'+x.id;
    try{
      await page.evaluate(target=>{location.hash=target},hash);
      await page.waitForFunction(id=>document.querySelector('.lesson-header h1') &&
        window.location.hash.endsWith('/'+id) &&
        document.querySelector('#lesson-interactive .interactive-knobs'),x.id,{timeout:10000});
      const host=page.locator('#lesson-interactive');
      assert.ok((await host.locator('.interactive-head').innerText()).length>8,x.id+' investigation title');
      assert.ok((await host.locator('.interactive-metric').count())>=1,x.id+' computed result');
      assert.ok((await host.locator('.interactive-svg').count())>=1,x.id+' chart');
      assert.ok((await host.locator('[data-knob]').count())>=1,x.id+' controls');
      assert.ok((await host.locator('.interactive-assumptions').innerText()).length>20,x.id+' model limits');

      const focus=await page.evaluate(id=>window.EE_INTERACTIVE.catalog[id][2],x.id);
      const control=host.locator('[data-knob="'+focus+'"]');
      const start=await control.evaluate(el=>Number(el.value));
      const max=await control.evaluate(el=>Number(el.max));
      const min=await control.evaluate(el=>Number(el.min));
      const step=await control.evaluate(el=>Number(el.step));
      const end=start<max?Math.min(max,Number((start+step).toFixed(8))):Math.max(min,Number((start-step).toFixed(8)));
      const original=await host.locator('.interactive-metric strong').first().innerText();
      await host.locator('[data-predict="up"]').click();
      await host.locator('[data-verify-target]').click();
      assert.ok(Math.abs((await control.evaluate(el=>Number(el.value)))-end)<1e-8,x.id+' target application');
      const current=await host.locator('.interactive-metric strong').first().innerText();
      const feedback=await host.locator('.interactive-feedback').innerText();
      assert.ok(feedback.includes('觀察結果'),x.id+' isolated prediction feedback');
      const hasBad=await host.evaluate(node=>/NaN|Infinity|undefined/.test(
        node.querySelector('.interactive-metrics').innerText+' '+
        node.querySelector('.interactive-stage').innerText));
      assert.equal(hasBad,false,x.id+' finite metrics');
      const change=original!==current;
      if(change)changed++;
      if(await host.locator('.interactive-clock:not([hidden])').count()){
        await host.locator('[data-time]').evaluate(el=>{
          el.value='75';
          el.dispatchEvent(new Event('input',{bubbles:true}));
        });
        assert.equal(await host.locator('[data-cursor-value]').innerText(),'75%',x.id+' waveform cursor');
      }
      await host.locator('.interactive-reset').click();
      assert.equal(await control.evaluate(el=>Number(el.value)),start,x.id+' reset slider');
      assert.ok((await host.locator('.interactive-feedback').innerText()).includes('選擇預測'),x.id+' reset prediction');
      verified++;
      checked++;
    }catch(error){
      failures.push({file,id:x.id,error:String(error.stack||error)});
      if(failures.length>8)break;
    }
  }
  if(width===1440)await page.screenshot({path:'tests/screenshots/interactive-'+file.replace('.html','')+'-desktop.png',fullPage:true});
  await ctx.close();
}
try{
  await inspect('index.html',38,1440);
  await inspect('middle.html',34,1440);
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  page.on('pageerror',err=>errors.push('mobile: '+err.message));
  for(const [file,chapter,lesson] of [
    ['index.html','analog','adc'],
    ['middle.html','mid-modes','mid-buck-dcm'],
    ['middle.html','mid-bridge','mid-bipolar']
  ]){
    await page.goto(BASE+'/'+file+'#lesson/'+chapter+'/'+lesson);
    await page.locator('#lesson-interactive .interactive-svg').waitFor({timeout:10000});
    const size=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    if(size.scroll>size.client+2){
      const offenders=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(n=>{
        const b=n.getBoundingClientRect();
        const cs=getComputedStyle(n);
        return b.right>document.documentElement.clientWidth+3 && cs.position!=='fixed' && cs.position!=='absolute';
      }).slice(0,15).map(n=>({tag:n.tagName,cls:n.className?.baseVal||n.className,width:Math.round(n.getBoundingClientRect().width),right:Math.round(n.getBoundingClientRect().right),scroll:n.scrollWidth,client:n.clientWidth})));
      console.error('MOBILE_OVERFLOW',file,lesson,size,offenders);
    }
    assert.ok(size.scroll<=size.client+2,file+' '+lesson+' mobile no viewport overflow '+JSON.stringify(size));
    await page.locator('#lesson-interactive [data-knob]').first().evaluate(el=>{
      el.value=el.max;
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    assert.ok(await page.locator('#lesson-interactive .interactive-metric').count()>0);
    if(lesson==='mid-buck-dcm')
      await page.screenshot({path:'tests/screenshots/interactive-buck-mobile.png',fullPage:true});
    if(lesson==='mid-bipolar'){
      const host=page.locator('#lesson-interactive');
      await host.locator('[data-knob="bipolar"]').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.ok(await host.locator('[data-knob="db"]').isDisabled(),'B duty must be disabled in bipolar mode');
      assert.ok((await host.locator('[data-knob-value="db"]').innerText()).includes('互補推導'));
      await host.locator('[data-knob="bipolar"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.ok(await host.locator('[data-knob="db"]').isEnabled(),'B duty must be restored in unipolar mode');
    }
  }
  await ctx.close();
}finally{await browser.close();}
assert.deepEqual(errors,[],'No uncaught page JavaScript errors');
assert.deepEqual(failures,[],'Every chapter investigation must mount and work');
assert.equal(checked,72,'All 72 published lessons exercised');
assert.ok(changed>=55,'Interactive models must actually react to user input');
assert.equal(verified,72,'Prediction + reset smoke count');
console.log('PASS interactive lesson regression:',JSON.stringify({checked,changed,verified,errors:errors.length}));
