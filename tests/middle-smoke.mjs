/** Middle-volume UI and engineering-math regression. Run after starting local http.server. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { PDFDocument, StandardFonts } from 'pdf-lib';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir('tests/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],failures=[];
const desktop=await browser.newContext({viewport:{width:1440,height:900}});
const page=await desktop.newPage();
page.on('pageerror',err=>errors.push(err.message));
await page.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/**',route=>route.abort());
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
await run('P.2–9 original deep explanations, math, references and answer reveal',async()=>{
  const titles=new Set();
  for(let p=2;p<=9;p++){
    await visit('middle.html#slide/'+p,'.page-guide');
    const g=page.locator('[data-guide-page="'+p+'"]');
    assert.equal(await g.count(),1,'P.'+p+' exactly one guide');
    const title=await g.locator('h2').innerText();
    assert.ok(title.length>15,'P.'+p+' requires a real title');
    titles.add(title);
    assert.ok(await g.locator('.guide-steps li').count()>=3,'P.'+p+' physical stages');
    assert.ok(await g.locator('.guide-equation').count()>=2,'P.'+p+' equations');
    assert.ok(await g.locator('.guide-worked li').count()>=3,'P.'+p+' worked example');
    assert.ok(await g.locator('.guide-assumptions li').count()>=2,'P.'+p+' scope and caveats');
    const check=g.locator('details.guide-check');
    assert.equal(await check.evaluate(el=>el.open),false,'Answer must begin hidden');
    await check.locator('summary').click();
    assert.equal(await check.evaluate(el=>el.open),true,'P.'+p+' reveal answer');
    assert.ok((await check.locator('p').innerText()).length>20);
    assert.equal(await g.locator('.guide-link').count(),1,'P.'+p+' links existing lesson');
    assert.equal(await page.locator('#source-pdf-file').count(),1,'Original local PDF input intact');
    const eq=g.locator('.guide-equation').first();
    const ready=await eq.evaluate(el=>el.classList.contains('guide-ready'));
    assert.ok(ready||await eq.locator('.guide-math-fallback').isVisible(),
      'Readable fallback when formula CDN is unavailable');
    if(p===6||p===9)await page.screenshot({path:'tests/screenshots/middle-page-'+p+'-guide.png',fullPage:true});
  }
  assert.equal(titles.size,8,'Do not reuse a generic title for different pages');
  await visit('middle.html#slide/23','#source-pdf-file');
  assert.equal(await page.locator('.page-guide').count(),0,'Unreviewed P.23 must not show invented explanation');
  await visit('middle.html#home','.subject-card');
  await page.locator('#search-trigger').click();
  await page.locator('#search-input').fill('伏秒平衡');
  assert.ok(await page.locator('#search-results a[href="#slide/6"]').count()>0,'Guide searchable by concept');
  await page.keyboard.press('Escape');
  const mobile=await browser.newPage({viewport:{width:320,height:720}});
  await mobile.goto(BASE+'/middle.html#slide/9');
  await mobile.locator('[data-guide-page="9"]').waitFor();
  const widths=await mobile.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(widths.scroll<=widths.viewport+2,'Deep guide P.9 overflow on 320px '+JSON.stringify(widths));
  await mobile.close();
});

await run('P.10–22 Boost deep guides, physical text, equations, answer and mobile layout',async()=>{
  const titles=new Set();
  const expected={
    10:'mid-boost-ccm',11:'mid-boost-rl',12:'mid-boost-rl',13:'mid-boost-efficiency',
    14:'mid-boost-efficiency',15:'mid-boost-parasitic',16:'mid-boost-parasitic',
    17:'mid-boost-parasitic',18:'mid-boost-parasitic',19:'mid-boost-parasitic',
    20:'mid-boost-parasitic',21:'mid-boost-dcm',22:'mid-boost-dcm'
  };
  for(let p=10;p<=22;p++){
    await visit('middle.html#slide/'+p,'[data-guide-page="'+p+'"]');
    const g=page.locator('[data-guide-page="'+p+'"]');
    assert.equal(await g.count(),1,'Boost P.'+p+' must mount exactly one deep guide');
    titles.add(await g.locator('h2').innerText());
    assert.ok(await g.locator('.guide-steps li').count()>=3,'P.'+p+' energy stages');
    assert.ok(await g.locator('.guide-equation').count()>=2,'P.'+p+' formula sources');
    assert.ok(await g.locator('.guide-worked li').count()>=3,'P.'+p+' independent example');
    assert.ok(await g.locator('.guide-assumptions li').count()>=2,'P.'+p+' model limits');
    const linked=await g.locator('.guide-link').getAttribute('href');
    assert.ok(linked.endsWith('/'+expected[p]),'P.'+p+' links the correct existing lesson');
    assert.equal(await page.locator('#source-pdf-file').count(),1,'P.'+p+' still has local PDF reader');
    assert.ok((await page.locator('.slide-transcript').innerText()).length>10,'P.'+p+' source summary is intact');
    const eq=g.locator('.guide-equation').first();
    const mathReady=await eq.evaluate(el=>el.classList.contains('guide-ready'));
    assert.ok(mathReady||await eq.locator('.guide-math-fallback').isVisible(),
      'P.'+p+' equation fallback must remain readable');
    const answer=g.locator('.guide-check');
    assert.equal(await answer.evaluate(el=>el.open),false,'P.'+p+' answer initially hidden');
    await answer.locator('summary').click();
    assert.equal(await answer.evaluate(el=>el.open),true,'P.'+p+' answer revealed');
    assert.ok((await answer.locator('p').innerText()).length>=20,'P.'+p+' real answer');
    if([10,19,22].includes(p))await page.screenshot({
      path:'tests/screenshots/middle-boost-page-'+p+'.png',fullPage:true
    });
  }
  assert.equal(titles.size,13,'Each Boost source page must have its own specific explanation');
  await visit('middle.html#slide/23','#source-pdf-file');
  assert.equal(await page.locator('.page-guide').count(),0,'P.23 is the untouched next unit');
  await visit('middle.html#home','.subject-card');
  await page.locator('#search-trigger').click();
  await page.locator('#search-input').fill('二極體電流三角形');
  assert.ok(await page.locator('#search-results a[href="#slide/22"]').count()>0,
    'Boost DCM deep explanation is discoverable via search');
  await page.keyboard.press('Escape');
  for(const width of [320,390]){
    const mobile=await browser.newPage({viewport:{width,height:720}});
    for(let p=10;p<=22;p++){
      await mobile.goto(BASE+'/middle.html#slide/'+p);
      await mobile.locator('[data-guide-page="'+p+'"]').waitFor({timeout:20000});
      const sizes=await mobile.evaluate(()=>{
        const vw=innerWidth,sw=document.documentElement.scrollWidth;
        const culprits=sw>vw+2?Array.from(document.querySelectorAll('.page-guide *'))
          .map(el=>({tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,65):'',
            right:Math.round(el.getBoundingClientRect().right),scroll:el.scrollWidth,client:el.clientWidth}))
          .filter(x=>x.right>vw+2&&x.scroll>x.client+2).slice(0,6):[];
        return {vw,sw,culprits};
      });
      assert.ok(sizes.sw<=sizes.vw+2,'P.'+p+' Boost guide '+width+'px overflow: '+JSON.stringify(sizes));
    }
    await mobile.close();
  }
});

async function makeMiddlePdf(count,kind='valid'){
  const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
  const anchors={
    1:'DC-DC Converters',
    2:'Basic Topologies of Switching-mode DC-DC Converters',
    7:'Operation Modes',
    10:'Boost Converter',
    23:'Buck-Boost Converter',
    33:'Basic Topologies of Switching-mode DC-DC Converters With Isolation',
    37:'Flyback Converter',
    41:'Forward Converter',
    51:'B-H Curve Core Loss Curve'
  };
  for(let p=1;p<=count;p++){
    const pg=doc.addPage([720,540]);
    let title=anchors[p]||'Middle Lecture Page '+p;
    if(kind==='unrelated')title=p===1?'Unrelated Course':p===37?'Unrelated Example':'Other lecture page '+p;
    if(kind==='generic')title=p===1||p===37?'Generic Converter':'Other lecture page '+p;
    if(kind==='wrong-chapter'&&p===33)title='Generic Converter';
    pg.drawText(title,{x:55,y:440,size:20,font});
    pg.drawText('Page '+p,{x:55,y:365,size:15,font});
  }
  return Buffer.from(await doc.save());
}
async function awaitMiddlePdf(pg){
  await page.waitForFunction(n=>{
    const c=document.getElementById('source-pdf-canvas');
    const status=document.getElementById('source-pdf-feedback');
    return c&&c.width>150&&c.height>150&&status?.textContent?.startsWith('已驗證講義：第 '+n+'／52 頁');
  },pg,{timeout:30000});
}
await run('52-page PDF identity, render, navigation and separate local cache',async()=>{
  await visit('middle.html#slide/37','#source-pdf-file');
  const badCount=await makeMiddlePdf(51,'valid');
  await page.locator('#source-pdf-file').setInputFiles({name:'middle-51.pdf',mimeType:'application/pdf',buffer:badCount});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('頁數不符'),null,{timeout:30000});
  assert.equal(await page.locator('#source-pdf-canvas').count(),0);
  const badIdentity=await makeMiddlePdf(52,'unrelated');
  await page.locator('#source-pdf-file').setInputFiles({name:'other-52.pdf',mimeType:'application/pdf',buffer:badIdentity});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('中冊標題識別不符'),null,{timeout:30000});
  assert.equal(await page.locator('#source-pdf-canvas').count(),0);
  // This 52-page file would pass the old two-keyword check (Converter on pages
  // 1 and 37) but must now fail the cross-chapter source identification.
  const generic=await makeMiddlePdf(52,'generic');
  await page.locator('#source-pdf-file').setInputFiles({name:'generic-52.pdf',mimeType:'application/pdf',buffer:generic});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('中冊標題識別不符'),null,{timeout:30000});
  assert.equal(await page.locator('#source-pdf-canvas').count(),0);
  // One wrong chapter is enough to reject a near-matching 52-page document.
  const badChapter=await makeMiddlePdf(52,'wrong-chapter');
  await page.locator('#source-pdf-file').setInputFiles({name:'wrong-chapter-52.pdf',mimeType:'application/pdf',buffer:badChapter});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('第 33 頁'),null,{timeout:30000});
  assert.equal(await page.locator('#source-pdf-canvas').count(),0);
  const valid=await makeMiddlePdf(52,'valid');
  await page.locator('#source-pdf-file').setInputFiles({name:'middle-valid.pdf',mimeType:'application/pdf',buffer:valid});
  await awaitMiddlePdf(37);
  const image37=await page.locator('#source-pdf-canvas').evaluate(el=>el.toDataURL());
  assert.ok(image37.length>1000);
  await visit('middle.html#slide/38','#source-pdf-canvas');
  await awaitMiddlePdf(38);
  const image38=await page.locator('#source-pdf-canvas').evaluate(el=>el.toDataURL());
  assert.notEqual(image37,image38);
  await page.reload();
  await awaitMiddlePdf(38);
  assert.ok((await page.locator('#source-pdf-feedback').innerText()).includes('已驗證講義'));
  await visit('index.html#slide/24','#source-pdf-file');
  assert.equal(await page.locator('#source-pdf-canvas').count(),0,'Upper viewer must not show the middle PDF');
  await visit('middle.html#slide/38','#source-pdf-canvas');
  await awaitMiddlePdf(38);
  await page.locator('#source-pdf-remove').click();
  assert.equal(await page.locator('.source-pdf-placeholder').count(),1);
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