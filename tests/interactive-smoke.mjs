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
      assert.equal(await host.getAttribute('data-learning-state'),'READY',x.id+' initial learning state');
      assert.equal(await host.locator('.interactive-svg').count(),0,x.id+' must not leak sweep or waveform before prediction');
      assert.ok((await host.locator('.interactive-chart-placeholder').innerText()).length>12,x.id+' chart placeholder');
      assert.ok(await host.locator('[data-verify-target]').isDisabled(),x.id+' verification locked before prediction');
      assert.ok((await host.locator('[data-knob]').count())>=1,x.id+' controls');
      assert.ok((await host.locator('.interactive-assumptions').innerText()).length>20,x.id+' model limits');

      const focus=await page.evaluate(id=>window.EE_INTERACTIVE.catalog[id][2],x.id);
      const control=host.locator('[data-knob="'+focus+'"]');
      const start=await control.evaluate(el=>Number(el.value));
      const max=await control.evaluate(el=>Number(el.max));
      const min=await control.evaluate(el=>Number(el.min));
      const step=await control.evaluate(el=>Number(el.step));
      const end=await page.evaluate(id=>{
        const [model,,key]=window.EE_INTERACTIVE.catalog[id];
        const knob=window.EE_INTERACTIVE.models[model].knobs.find(k=>k.key===key);
        return window.EE_INTERACTIVE.comparisonTarget(id,knob);
      },x.id);
      assert.ok(end>=min&&end<=max&&Math.abs((end-min)/step-Math.round((end-min)/step))<1e-7,
        x.id+' comparison must land on a valid slider step');
      const original=await host.locator('.interactive-metric strong').first().innerText();
      await host.locator('[data-predict="up"]').click();
      assert.equal(await host.getAttribute('data-learning-state'),'PREDICTED',x.id+' prediction recorded');
      assert.equal(await host.locator('.interactive-svg').count(),0,x.id+' result stays hidden until verification');
      assert.ok(await host.locator('[data-predict="down"]').isDisabled(),x.id+' prevent changing answer after prediction');
      assert.ok(await host.locator('[data-verify-target]').isEnabled(),x.id+' verification enabled after prediction');
      await host.locator('[data-verify-target]').click();
      assert.equal(await host.getAttribute('data-learning-state'),'REVIEWED',x.id+' post-verification state');
      assert.ok((await host.locator('.interactive-svg').count())>=1,x.id+' chart revealed after verification');
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
      assert.equal(await host.getAttribute('data-learning-state'),'READY',x.id+' reset learning state');
      assert.equal(await host.locator('.interactive-svg').count(),0,x.id+' answer hidden again after reset');
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
    await page.locator('#lesson-interactive [data-explore]').waitFor({timeout:10000});
    await page.locator('#lesson-interactive [data-explore]').click();
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
      assert.equal(await host.locator('[data-knob="db"]').evaluate(el=>Number(el.value)),25,'Restored independent B duty must remain 25%');
    }
  }

  await page.goto(BASE+'/index.html#home');
  await page.locator('.subject-card').first().waitFor({timeout:10000});
  // Resolve lesson hash from the actual curriculum, never assume chapter IDs.
  const pqsRoute=await page.evaluate(()=>{
    const c=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id==='pqs'));
    return '#lesson/'+c.id+'/pqs';
  });
  await page.evaluate(target=>{location.hash=target},pqsRoute);
  const pqsHost=page.locator('#lesson-interactive');
  await pqsHost.locator('[data-knob="angle"]').waitFor({timeout:10000});
  await pqsHost.locator('[data-predict="up"]').click();
  await pqsHost.locator('[data-knob="thd"]').evaluate(el=>{
    el.value=String(Number(el.value)+Number(el.step));
    el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await pqsHost.getAttribute('data-learning-state'),'EXPLORING',
    'Changing an unrelated parameter revokes graded prediction state');
  assert.ok(await pqsHost.locator('[data-verify-target]').isDisabled(),
    'Invalidated prediction may not submit an answer');
  assert.ok((await pqsHost.locator('.interactive-feedback').innerText()).includes('同時變更其他參數'),
    'Changing a second parameter must invalidate causal prediction grading');
  await pqsHost.locator('.interactive-reset').click();
  assert.ok((await pqsHost.locator('.interactive-feedback').innerText()).includes('先選擇預測'),'Reset clears causal invalidation');
  await page.goto(BASE+'/middle.html#home');
  await page.locator('.subject-card').first().waitFor({timeout:10000});
  const boostRoute=await page.evaluate(()=>{
    const c=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id==='mid-boost-rl'));
    return '#lesson/'+c.id+'/mid-boost-rl';
  });
  await page.evaluate(target=>{location.hash=target},boostRoute);
  const boostHost=page.locator('#lesson-interactive');
  await boostHost.locator('[data-knob="l"]').waitFor({timeout:10000});
  // Recreate the specific CCM-valid / invalid / valid islands independently
  // from the lesson's high-copper-loss teaching defaults.
  for(const [knob,value] of [['rl',0.5],['load',40],['l',40],['freq',50]]){
    await boostHost.locator('[data-knob="'+knob+'"]').evaluate((el,n)=>{
      el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));
    },value);
  }
  const sweepPath=await boostHost.locator('.interactive-chart path[stroke="#159c81"]').getAttribute('d');
  assert.ok((sweepPath.match(/M/g)||[]).length>=2,
    'Invalid Boost CCM duty ranges must create separate SVG subpaths without bridging the gap');

  await page.goto(BASE+'/index.html#home');
  await page.locator('.subject-card').first().waitFor({timeout:10000});
  const powerRoute=await page.evaluate(()=>{
    const c=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id==='power'));
    return '#lesson/'+c.id+'/power';
  });
  await page.evaluate(target=>{location.hash=target},powerRoute);
  const powerHost=page.locator('#lesson-interactive');
  await powerHost.locator('[data-knob="i"]').waitFor({timeout:10000});
  await powerHost.locator('[data-knob="i"]').evaluate(el=>{
    el.value='-2';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await powerHost.getAttribute('data-learning-state'),'EXPLORING',
    'Seeing the changed answer before guessing must revoke prediction credit');
  assert.ok(await powerHost.locator('[data-predict="down"]').isDisabled(),
    'Cannot submit a prediction after viewing a manipulated result');
  assert.ok((await powerHost.locator('.interactive-feedback').innerText()).includes('自由探索'));
  await powerHost.locator('.interactive-reset').click();
  assert.equal(await powerHost.getAttribute('data-learning-state'),'READY');
  await powerHost.locator('[data-predict="down"]').click();
  await powerHost.locator('[data-verify-target]').click();
  assert.ok((await powerHost.locator('.interactive-feedback').innerText()).includes('符合預測'),
    '24 V x +2A to -2A is a real sign reversal');
  assert.equal(await powerHost.locator('[data-knob="i"]').evaluate(el=>Number(el.value)),-2);
  // Explicit out-of-domain fixtures must not be used for graded predictions.
  const capRoute=await page.evaluate(()=>{
    const c=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id==='capacitor'));
    return '#lesson/'+c.id+'/capacitor';
  });
  await page.evaluate(target=>{location.hash=target},capRoute);
  const capHost=page.locator('#lesson-interactive');
  await capHost.locator('[data-knob="cap"]').waitFor({timeout:10000});
  await capHost.locator('[data-knob="cap"]').evaluate(el=>{
    el.value='220';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await capHost.getAttribute('data-learning-state'),'EXPLORING');
  assert.ok((await capHost.locator('.interactive-validity').innerText()).includes('超出適用域'),
    'Large ripple must explicitly report invalid model domain');
  assert.ok(await capHost.locator('[data-predict="down"]').isDisabled(),
    'Out-of-domain result cannot be graded after observation');
  await ctx.close();
}finally{await browser.close();}
assert.deepEqual(errors,[],'No uncaught page JavaScript errors');
assert.deepEqual(failures,[],'Every chapter investigation must mount and work');
assert.equal(checked,72,'All 72 published lessons exercised');
assert.ok(changed>=55,'Interactive models must actually react to user input');
assert.equal(verified,72,'Prediction + reset smoke count');
console.log('PASS interactive lesson regression:',JSON.stringify({checked,changed,verified,errors:errors.length}));
