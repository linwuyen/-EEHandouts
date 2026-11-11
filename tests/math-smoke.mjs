/** Browser regression: authored KaTeX formulas must render in both lecture volumes.
 * Run against static site at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:4173).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir('tests/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const issues=[];
let inspected=0,typed=0,plain=0;
async function openBusFromGuide(page,number){
  await page.goto(BASE+'/index.html#home');
  await page.locator('.section-title a[href="#slides/all"]').click();
  await page.locator('.slide-title-link[href="#slide/'+number+'"]').click();
  await page.locator('[data-guide-page="'+number+'"] .guide-link[href$="/bus"]').click();
  await page.locator('.equation-list[data-lesson-math="bus"]').waitFor();
}
const compactMath=text=>text.normalize('NFKC').replace(/[\s\u200b]/g,'');
const busEntries=await browser.newContext({viewport:{width:1440,height:900}});
const busPage=await busEntries.newPage();
busPage.on('pageerror',err=>issues.push('bus guide entry: '+err.message));
for(const number of [93,94,95,96]){
  await openBusFromGuide(busPage,number);
  await busPage.locator('.equation-list.math-ready').waitFor();
  const pf=busPage.locator('.equation-row').filter({has:busPage.locator('.equation-label', {hasText:/功率因數/})});
  const fraction=pf.locator('.katex-html .mfrac');
  assert.equal(await fraction.count(),1,'P'+number+' bus PF is a visible typeset fraction');
  assert.ok(await fraction.isVisible(),'P'+number+' bus PF fraction must be visible');
  // Read the visible numerator/denominator above/below the fraction rule,
  // rather than the hidden TeX annotation or the authored formula map.
  const parts=await fraction.evaluate(node=>Array.from(node.querySelector('.vlist').children)
    .filter(n=>n.textContent.trim()).map(n=>({text:n.textContent,y:n.getBoundingClientRect().top}))
    .sort((a,b)=>a.y-b.y).map(n=>n.text));
  assert.equal(parts.length,2,'P'+number+' PF has a numerator and denominator');
  assert.match(compactMath(parts[0]),/^P3[φϕ]$/,'P'+number+' numerator is three-phase total active power P3φ');
  assert.match(compactMath(parts[1]),/^3[×⋅·*]?V相,?rms[×⋅·*]?I線,?rms$/,
    'P'+number+' denominator is 3 × phase-voltage RMS × line-current RMS');
  assert.match(await busPage.locator('#main-content').innerText(),/三相總有功功率/,
    'P'+number+' bus lesson must explain what P3φ measures');
  if(number===93)await busPage.locator('.formula-panel').screenshot({path:'tests/screenshots/r2-threephase-pf.png'});
}
await busEntries.close();

async function checkVolume(file,expectedCount){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',err=>issues.push(file+': '+err.message));
  await page.goto(BASE+'/'+file+'#home');
  await page.locator('.subject-card').first().waitFor({timeout:20000});
  const lessons=await page.evaluate(()=>window.EE_DATA.chapters.flatMap(c=>c.lessons.map(l=>({ch:c.id,id:l.id}))));
  assert.equal(lessons.length,expectedCount,file+' lesson count');
  assert.equal(await page.evaluate(()=>!!window.katex),true,file+' KaTeX library loaded');
  const count=await page.evaluate(()=>Object.keys(window.EE_MATH||{}).length);
  assert.ok(count>=70,'Equation map not loaded');
  for(const x of lessons){
    const target='#lesson/'+x.ch+'/'+x.id;
    await page.evaluate(hash=>{location.hash=hash},target);
    await page.waitForFunction(id=>document.querySelector('.lesson-header h1') &&
      (document.querySelector('.equation-list')?.dataset.lessonMath===id ||
       (id==='legacy' && document.querySelector('.formula-plain'))),x.id,{timeout:7000});
    const has=await page.locator('.equation-list').count()===1;
    if(has){
      await page.locator('.equation-list.math-ready').waitFor({timeout:7000});
      const nums=await page.locator('.equation-row').count();
      assert.ok(nums>=1,'Missing equations '+x.id);
      assert.equal(await page.locator('.equation-math .katex').count(),nums,'Missing rendered math '+x.id);
      assert.equal(await page.locator('.equation-math .katex-error').count(),0,'KaTeX error '+x.id);
      assert.equal(await page.locator('.equation-list[data-math-error]').count(),0,'TeX parse error '+x.id);
      assert.equal(await page.locator('.equation-original').isVisible(),false,'Fallback shown despite KaTeX loaded '+x.id);
      typed++;
    }else{
      assert.equal(x.id,'legacy','Unexpected raw math fallback '+x.id);
      assert.equal(await page.locator('.formula-plain').count(),1);
      plain++;
    }
    inspected++;
  }
  if(file==='middle.html'){
    await page.evaluate(()=>{location.hash='#lesson/mid-basics/mid-topologies'});
    await page.waitForFunction(()=>document.querySelector('[data-lesson-math]')?.dataset.lessonMath==='mid-topologies');
    assert.equal(await page.locator('.equation-row').count(),3,'Three converter formulas displayed separately');
    assert.ok(await page.locator('.equation-math .mfrac').count()>=3,'Fractions must use stacked KaTeX typography');
    await page.screenshot({path:'tests/screenshots/formula-middle-desktop.png',fullPage:true});
  }else{
    await page.evaluate(()=>{location.hash='#lesson/analog/differentiator'});
    await page.waitForFunction(()=>document.querySelector('[data-lesson-math]')?.dataset.lessonMath==='differentiator');
    await page.screenshot({path:'tests/screenshots/formula-upper-desktop.png',fullPage:true});
  }
  await ctx.close();
}
await checkVolume('middle.html',34);
await checkVolume('index.html',38);

const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
const m=await mobile.newPage();
m.on('pageerror',err=>issues.push('mobile: '+err.message));
for(const [file,route] of [
  ['middle.html','#lesson/mid-boost/mid-boost-rl'],
  ['index.html','#lesson/rect1/notching']
]){
  await m.goto(BASE+'/'+file+route);
  await m.locator('.equation-list.math-ready .katex').first().waitFor({timeout:20000});
  const width=await m.evaluate(()=>({
    viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    panelWidth:document.querySelector('.formula-panel').getBoundingClientRect().width,
    rowWidth:document.querySelector('.equation-row').getBoundingClientRect().width
  }));
  assert.ok(width.scrollWidth<=width.viewport+2,JSON.stringify({file,width}));
  assert.ok(width.rowWidth<=width.panelWidth,'Equation row spills out of panel '+file);
  if(file==='middle.html')await m.screenshot({path:'tests/screenshots/formula-middle-mobile.png',fullPage:true});
}
await mobile.close();

const missing=await browser.newContext({viewport:{width:390,height:844}});
await missing.route(/katex\.min\.js/,route=>route.abort());
const offline=await missing.newPage();
offline.on('pageerror',err=>issues.push('fallback: '+err.message));
await offline.goto(BASE+'/middle.html#lesson/mid-basics/mid-topologies');
await offline.locator('.equation-original').waitFor();
assert.equal(await offline.locator('.equation-original').isVisible(),true,'Text fallback when CDN script is unavailable');
assert.equal(await offline.locator('.equation-list.math-ready').count(),0,'KaTeX should not claim ready when blocked');
assert.ok((await offline.locator('.equation-original').innerText()).includes('Buck'),'Fallback lost original formula');
for(const number of [93,94,95,96]){
  await openBusFromGuide(offline,number);
  const fallback=offline.locator('.equation-original');
  assert.ok(await fallback.isVisible(),'P'+number+' bus plain formula remains visible with KaTeX blocked');
  assert.equal(await offline.locator('.equation-list.math-ready').count(),0);
  const text=compactMath(await fallback.innerText());
  assert.match(text,/PF=P3[φϕ]\//,'P'+number+' fallback names total three-phase power in the PF numerator');
  assert.match(text,/\(3[×⋅·*]?V相,?rms[×⋅·*]?I線,?rms\)/,
    'P'+number+' fallback includes the factor 3 and unambiguous phase-voltage/line-current RMS');
  assert.match(await offline.locator('#main-content').innerText(),/三相總有功功率/,
    'P'+number+' total three-phase active power definition survives blocked KaTeX');
}
await missing.close();

// Failure mode previously missed: KaTeX JS loads successfully, but CSS fails.
// The generated HTML/MathML must not replace the readable text fallback.
const cssOffline=await browser.newContext({viewport:{width:390,height:844}});
await cssOffline.route(/katex\.min\.css/,route=>route.abort());
const noStyle=await cssOffline.newPage();
noStyle.on('pageerror',err=>issues.push('css-fallback: '+err.message));
await noStyle.goto(BASE+'/middle.html#lesson/mid-basics/mid-topologies');
await noStyle.locator('.equation-original').waitFor();
assert.equal(await noStyle.evaluate(()=>!!window.katex),true,'KaTeX JS must still load when CSS is blocked');
assert.equal(await noStyle.locator('.equation-original').isVisible(),true,'Original readable formula must remain when CSS fails');
assert.equal(await noStyle.locator('.equation-list.math-ready').count(),0,'Do not claim math-ready without CSS');
assert.ok((await noStyle.locator('.equation-original').innerText()).includes('Boost'));
assert.ok(await noStyle.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),
  'CSS fallback should not cause horizontal document overflow');
await cssOffline.close();
await browser.close();
assert.deepEqual(issues,[],'Uncaught JavaScript exceptions');
assert.equal(inspected,72,'Every lesson must have a tested formula block');
assert.equal(typed,71,'All math-bearing lessons should be typeset');
assert.equal(plain,1,'The switch-selection note stays prose, not fake mathematics');
console.log('RESULT math regression:',JSON.stringify({inspected,typed,plain,issues:issues.length,desktop:true,mobile:true,fallback:true,cssFallback:true}));
