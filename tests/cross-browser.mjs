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
  // Verify the new page-specific text and source-PDF link on Firefox/WebKit.
  for(const p of [2,9,10,16,22,23,25,27,29,32,33,35,38,40,41,42,43,44,45,46,47,48,49,50,51]){
    await page.goto(BASE+'/middle.html#slide/'+p);
    await page.locator('[data-guide-page="'+p+'"]').waitFor({timeout:15000});
    assert.ok(await page.locator('.guide-equation').count()>=2,
      engineName+' middle P.'+p+' deep formulas');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' middle P.'+p+' original PDF viewer');
    const size=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(size.s<=size.v+2,engineName+' middle P.'+p+' horizontal overflow');
  }
  // Upper-volume new source-grounded AC guides stay usable on mobile Firefox/WebKit.
  for(const p of [3,4,5,6,7,8,9,10,11]){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper P.'+p+' formula or fallback');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper P.'+p+' original PDF viewer');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper P.'+p+' overflow '+JSON.stringify(sz));
  }
  // Upper magnetics source-specific guides: full P12-26 mobile Firefox/WebKit.
  for(let p=12;p<=26;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const g=page.locator('[data-guide-page="'+p+'"]');
    await g.waitFor({timeout:15000});
    assert.ok(await g.locator('.guide-equation').count()>=2,
      engineName+' upper magnetics P.'+p+' math/fallback');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper magnetics P.'+p+' original PDF viewer');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper magnetics P.'+p+' horizontal overflow');
  }
  // Upper P.27–40: source-specific power semiconductor pages in mobile Firefox/WebKit.
  for(let p=27;p<=40;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper semiconductor P.'+p+' math/fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper semiconductor P.'+p+' numerical reasoning');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper semiconductor P.'+p+' original PDF source');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,
      engineName+' upper semiconductor P.'+p+' horizontal overflow');
  }
  // Upper P.41-48: original gate-controlled device families on mobile Firefox/WebKit.
  for(let p=41;p<=48;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper P.'+p+' math/fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper P.'+p+' numeric steps');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper P.'+p+' source PDF control');
    const size=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(size.s<=size.v+2,engineName+' upper P.'+p+' mobile overflow');
  }
  // Upper WBG P49-58 from actual PPTX images, mobile Firefox/WebKit.
  for(let p=49;p<=58;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper WBG P.'+p+' math or fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper WBG P.'+p+' numerical reasoning');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper WBG P.'+p+' original local PDF');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper WBG P.'+p+' mobile width overflow');
  }
  // Upper P59–62 power/control architecture, linear and PWM on mobile Firefox/WebKit.
  for(let p=59;p<=62;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper P.'+p+' math/fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper P.'+p+' numerical explanation');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper P.'+p+' original PDF reader');
    const size=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(size.s<=size.v+2,engineName+' upper P.'+p+' horizontal overflow');
  }
  // Upper P63–70: R/RL half-wave and diode bridge with source-grounded waveforms.
  for(let p=63;p<=70;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper P.'+p+' math/fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper P.'+p+' independent worked reasoning');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper P.'+p+' original source reader');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper P.'+p+' horizontal overflow');
  }
  // Upper P71-72: source-inductance commutation and simultaneous bridge paths.
  for(const p of [71,72]){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper overlap P.'+p+' equations');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper overlap P.'+p+' stepwise numerical proof');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper overlap P.'+p+' original source PDF');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper overlap P.'+p+' mobile width');
  }
  // Upper P73–76: fixed-voltage rectifier conduction angle, THD/PF and CF.
  for(let p=73;p<=76;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper capacitor P.'+p+' formulas and fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper capacitor P.'+p+' complete numeric steps');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper capacitor P.'+p+' local source PDF');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper capacitor P.'+p+' mobile overflow');
  }
  // Upper practical diode bridge capacitor, PCC and 115/230V doubler P77–82.
  for(let p=77;p<=82;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper practical P.'+p+' equations and fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper practical P.'+p+' verified steps');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper practical P.'+p+' original local source');
    const sz=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(sz.s<=sz.v+2,engineName+' upper practical P.'+p+' mobile overflow');
  }
  // Upper P83-88: three-phase triplen neutral and ideal six-pulse diode bridge.
  for(let p=83;p<=88;p++){
    await page.goto(BASE+'/index.html#slide/'+p);
    const guide=page.locator('[data-guide-page="'+p+'"]');
    await guide.waitFor({timeout:15000});
    assert.ok(await guide.locator('.guide-equation').count()>=2,
      engineName+' upper P.'+p+' math or fallback');
    assert.ok(await guide.locator('.guide-worked li').count()>=3,
      engineName+' upper P.'+p+' worked numeric proof');
    assert.equal(await page.locator('#source-pdf-file').count(),1,
      engineName+' upper P.'+p+' original source PDF');
    const size=await page.evaluate(()=>({v:innerWidth,s:document.documentElement.scrollWidth}));
    assert.ok(size.s<=size.v+2,engineName+' upper P.'+p+' mobile layout overflow');
  }
  // Advanced engineering page: no test may silently degrade to a missing lab.
  for (const lab of ['pfc','llc','psfb','loop','timing','nonideal','zvs']){
    await page.goto(BASE+'/advanced.html#'+lab);
    await page.locator('.advanced-metric').first().waitFor({timeout:20000});
    assert.equal(await page.locator('.advanced-model-status').getAttribute('data-valid'),'true',
      engineName+' advanced '+lab+' default validity');
    assert.ok(await page.locator('.advanced-chart svg').count()>0,engineName+' advanced '+lab+' chart');
    const w=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    assert.ok(w.sw<=w.vw+2,engineName+' advanced '+lab+' mobile overflow '+JSON.stringify(w));
  }
  await page.screenshot({path:'tests/screenshots/cross-'+engineName+'-advanced.png',fullPage:true});
  assert.deepEqual(errors,[],engineName+' uncaught JavaScript errors');
  await context.close();
  await browser.close();
}
console.log('PASS cross-browser Firefox/WebKit over upper + middle volumes');
