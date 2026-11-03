/* Review regression against real DOM, computed model and visible values.
 * Default: Chromium. --cross-browser: Firefox + WebKit (separate CI job).
 * The optional Chromium path is for an explicitly reported local-system run;
 * CI leaves it unset and uses the repository's pinned Playwright browser.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {assertBridgePaths} from './helpers/bridge-paths.mjs';
import {assertAdcPage106,assertAdcLesson} from './helpers/adc-page-contract.mjs';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const engines=process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium};
await fs.mkdir('tests/screenshots',{recursive:true});
for(const [name,engine] of Object.entries(engines)){
 const options={headless:true};
 if(name==='chromium'&&process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
  options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 const browser=await engine.launch(options);
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(BASE+'/advanced.html#psfb');
  await page.locator('[data-knob="io"]').evaluate(el=>{
   el.value='0.1';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('.advanced-model-status')?.textContent.includes('DCM'));
  await page.locator('#advanced-cursor').evaluate(el=>{
   el.value='42';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const probe=await page.locator('.advanced-probe').innerText();
  assert.match(probe,/區間：ZERO/,'F01 actual UI cursor reaches ZERO');
  assert.match(probe,/vrect=37\.879(?:\s|$)/,'F01 actual node floats to Vo, not zero');
  assert.match(probe,/vraw=0(?:\s|$)/,'F01 raw candidate stays distinct');
  assert.match(probe,/vL=0(?:\s|$)/,'F01 ZERO has zero inductor voltage');
  const titles=await page.locator('.advanced-chart-title').allTextContents();
  assert.ok(titles.some(t=>t.includes('電感輸入節點')),'F01 actual node named in chart');
  assert.ok(titles.some(t=>t.includes('整流候選')),'F01 raw candidate named separately');
  const size=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));
  assert.ok(size.s<=size.w+2,'F01 mobile chart does not overflow');
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-review-psfb.png',fullPage:true});
  await page.goto(BASE+'/middle.html#chapter/mid-bridge');
  await page.locator('[data-bridge-mode]').waitFor();
  for(const mode of ['unipolar','bipolar']){
   await page.locator('[data-bridge-mode]').selectOption(mode);
   for(const [da,db] of [[0,0],[100,100],[75,25],[25,75],[40,80]]){
    for(const [key,value] of [['da',da],['db',db]]){
     const input=page.locator('[data-lab-input="'+key+'"]');
     if(await input.isEnabled())await input.evaluate((el,v)=>{
      el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
     },value);
    }
    const paths=await page.locator('[data-middle-chart] svg path').evaluateAll(
     nodes=>nodes.map(n=>n.getAttribute('d')));
    assertBridgePaths(paths,{mode,da,db});
   }
  }
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-review-bridge.png',fullPage:true});
  const multiRoute=await page.evaluate(()=>{
   const c=window.EE_DATA.chapters.find(c=>c.lessons.some(l=>l.id==='mid-multi-output'));
   return '#lesson/'+c.id+'/mid-multi-output';
  });
  await page.goto(BASE+'/middle.html'+multiRoute);
  await page.locator('.interactive-assumptions').waitFor();
  const assumption=await page.locator('.interactive-assumptions').innerText();
  assert.match(assumption,/各工作點指定.*RMS 電流/,'F03 visible fixed-current assumption');
  assert.match(assumption,/並非固定電阻/,'F03 no fixed-resistance claim');
  async function metric(label){
   const row=page.locator('.interactive-metric').filter({hasText:label});
   return Number.parseFloat((await row.locator('strong').innerText()).replace(/,/g,''));
  }
  assert.equal(await metric('總次級視在功率'),60,'F03 initial 60 VA');
  await page.locator('[data-knob="vp"]').evaluate(el=>{
   el.value='192';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await metric('總次級視在功率'),120,'F03 voltage doubling keeps secondary currents fixed');
  assert.equal(await metric('理想一次側電流'),.63,'F03 displayed .625 A rounded to .63 A');
  await page.locator('.interactive-reset').click();
  await page.locator('[data-predict="down"]').click();
  await page.locator('[data-verify-target]').click();
  assert.match(await page.locator('.interactive-feedback').innerText(),/^符合預測/,
   'F03 original turns-ratio prediction remains correct');
  await page.goto(BASE+'/index.html#slide/106');
  await page.locator('[data-guide-page="106"]').waitFor();
  async function checkPage(){
   const g=page.locator('[data-guide-page="106"]');
   const eq=g.locator('.guide-equation').nth(1);
   const tex=await eq.locator('[data-guide-tex]').getAttribute('data-guide-tex');
   assertAdcPage106({tex,plain:await eq.locator('.guide-math-fallback').textContent(),
    given:await g.locator('.guide-given').innerText(),
    worked:await g.locator('.guide-worked li').allTextContents(),
    answer:await g.locator('.guide-check p').textContent()});
   if(await eq.evaluate(el=>el.classList.contains('guide-ready'))){
    assert.equal(await eq.locator('annotation[encoding="application/x-tex"]').textContent(),tex,
     'F04 rendered KaTeX consumes the validated equation');
   }else assert.equal(await eq.locator('.guide-math-fallback').isVisible(),true,
    'F04 fallback equation must be readable');
  }
  await checkPage();
  await page.locator('.guide-link').click();
  await page.locator('[data-lesson-math="adc"]').waitFor();
  assertAdcLesson({mathTex:await page.locator('[data-lesson-math="adc"] [data-tex]').getAttribute('data-tex'),
   formula:await page.locator('[data-lesson-math="adc"] .equation-original div').textContent(),
   example:await page.locator('.example').innerText()});
  for(const [i,volts,code] of [[-20,.1,136],[-10,.8,1092],[0,1.5,2048],[10,2.2,3003],[20,2.9,3959]]){
   await page.locator('[data-knob="i"]').evaluate((el,value)=>{
    el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
   },i);
   assert.ok(Math.abs(await metric('ADC 腳電壓')-volts)<1e-9,'F04 UI voltage at '+i+' A');
   assert.equal(await metric('理想有效 Code'),code,'F04 UI code at '+i+' A');
  }
  // Exercise this same page with KaTeX deliberately unavailable.
  await page.route('**/*katex*',route=>route.abort());
  await page.goto(BASE+'/index.html#slide/106');
  // Hash navigation alone retains the already loaded KaTeX global.
  await page.reload();
  await page.locator('[data-guide-page="106"]').waitFor();
  await checkPage();
  assert.equal(await page.locator('[data-guide-page="106"] .guide-equation').nth(1)
   .locator('.guide-math-fallback').isVisible(),true,'F04 forced fallback remains readable');
  await page.screenshot({path:'tests/screenshots/cross-'+name+'-review-adc-fallback.png',fullPage:true});
  await page.goto(BASE+'/advanced.html#timing');
  await page.locator('[data-timing-check="result"]').waitFor();
  assert.equal(await page.locator('[data-timing-check="clock"]').getAttribute('data-status'),'IN_DOMAIN');
  assert.equal(await page.locator('[data-timing-check="budget"]').getAttribute('data-status'),'WITHIN_ASSUMED_BUDGET');
  assert.equal(await page.locator('[data-timing-check="result"]').getAttribute('data-status'),'NOT_VERIFIED');
  assert.match(await page.locator('.advanced-model-status').innerText(),/硬體時序未驗證/);
  await page.locator('[data-knob="isr"]').evaluate(el=>{
   el.value='30000';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('[data-timing-check="budget"]')?.dataset.status==='OVERRUN');
  await page.locator('[data-knob="acqps"]').evaluate(el=>{
   el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('[data-timing-check="clock"]')?.dataset.status==='OUT_OF_DOMAIN');
  assert.equal(await page.locator('[data-timing-check="budget"]').getAttribute('data-status'),'NOT_EVALUATED');
  assert.equal(await page.locator('[data-timing-check="result"]').getAttribute('data-status'),'NOT_VERIFIED');
  assert.deepEqual(errors,[],name+' review UI has no uncaught error');
  console.log('PASS review UI '+name+': F01-F04 physics, geometry, load semantics, ADC page/lesson/calculator/fallback');
 }finally{await browser.close();}
}
