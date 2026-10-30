/* Compact Firefox + WebKit regression: navigation, learning state,
 * keyboard focus, local PDF assets and responsive layout.
 * Chromium's deeper 72-lesson/PDF suite remains the authoritative full regression.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { firefox, webkit } from 'playwright';

const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir('tests/screenshots',{recursive:true});
for(const [engineName,engine] of [['firefox',firefox],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  // PDF.js is served locally: CDN failures must not break this site's PDF loader.
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/**',route=>route.abort());
  for(const [volume,lessonId,expectedCount] of [
    ['index.html','threephase',38],
    ['middle.html','mid-bipolar',34]
  ]){
    await page.goto(BASE+'/'+volume+'#home');
    await page.locator('.subject-card').first().waitFor({timeout:20000});
    assert.equal(await page.locator('.subject-card').count(),7,engineName+'/'+volume+' chapters');
    const route=await page.evaluate(id=>{
      const chapter=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id===id));
      if(!chapter)throw Error('Missing target lesson '+id);
      return '#lesson/'+chapter.id+'/'+id;
    },lessonId);
    assert.equal(await page.evaluate(()=>window.EE_DATA.chapters.reduce((n,c)=>n+c.lessons.length,0)),
      expectedCount,engineName+'/'+volume+' lesson count');

    // Search dialog must close with Escape and restore keyboard focus.
    await page.locator('#search-trigger').click();
    await page.locator('#search-input').fill('PWM');
    assert.ok(await page.locator('#search-results .search-result').count()>0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#search-overlay').isHidden(),true);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'search-trigger',
      engineName+'/'+volume+' search focus restoration');

    // Mobile navigation and scrim must not trap focus/leave the overlay open.
    await page.locator('#menu-toggle').click();
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
    await page.locator('#sidebar-scrim').click({position:{x:380,y:400}});
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');

    await page.goto(BASE+'/'+volume+route);
    const host=page.locator('#lesson-interactive');
    await host.locator('.interactive-prediction').waitFor({timeout:20000});
    assert.equal(await host.getAttribute('data-learning-state'),'READY');
    await host.locator('[data-explore]').click();
    assert.equal(await host.getAttribute('data-learning-state'),'EXPLORING');
    await host.locator('.interactive-svg').first().waitFor({timeout:15000});
    await host.locator('[data-time]').evaluate(input=>{
      input.value='75';input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    assert.equal(await host.locator('[data-cursor-value]').innerText(),'75%');
    if(volume==='middle.html'){
      const bridgePaths=await host.locator('.interactive-svg path').evaluateAll(
        paths=>paths.map(p=>p.getAttribute('d')));
      assert.equal(bridgePaths.length,3,'H-Bridge should display VA, VB, VAB');
      assert.ok(bridgePaths.every(path=>/ H/.test(path)&&/ V/.test(path)&&!/ L/.test(path)),
        'H-Bridge must have stepped edges on Firefox/WebKit');
    }
    await host.locator('.interactive-reset').click();
    assert.equal(await host.getAttribute('data-learning-state'),'READY');
    const pageWidth=await page.evaluate(()=>({
      viewport:innerWidth,scroll:document.documentElement.scrollWidth
    }));
    assert.ok(pageWidth.scroll<=pageWidth.viewport+2,
      engineName+'/'+volume+' mobile overflow '+JSON.stringify(pageWidth));
    await page.screenshot({path:'tests/screenshots/cross-'+engineName+'-'+volume+'.png',fullPage:true});

    // Local module/worker must be packaged in the website, independent of CDN.
    const local=await page.evaluate(async()=>Promise.all([
      './vendor/pdfjs/pdf.min.mjs','./vendor/pdfjs/pdf.worker.min.mjs'
    ].map(async url=>(await fetch(url)).ok)));
    assert.ok(local.every(Boolean),engineName+'/'+volume+' missing self-hosted PDF.js assets');
    console.log('PASS cross-browser',engineName,volume,'search/nav/interactive/step/RWD/vendor');
  }
  assert.deepEqual(errors,[],engineName+' uncaught JavaScript errors');
  await context.close();
  await browser.close();
}
console.log('PASS cross-browser Firefox/WebKit over upper + middle volumes');
