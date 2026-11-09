/* Static local lesson reading in the actual three browser engines; reuses the existing calculator as model owner. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173',PATH='/workbench/adc-course.html',CALC='/workbench/adc.html';
mkdirSync('tests/screenshots',{recursive:true});
for(const [name,type] of Object.entries(process.argv.includes('--cross-browser')?{firefox,webkit}:{chromium})){
 const browser=await type.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await ctx.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 ctx.on('request',r=>{if(new URL(r.url()).origin!==new URL(BASE).origin)external.push(r.url());});
 try{
   await page.goto(BASE+PATH);
   const original='{"schema":"circuit-learning-state","version":999,"preserve":"unknown"}';
   await page.evaluate(raw=>{localStorage.setItem('circuit-learning-state-v5',raw);localStorage.setItem('c2000_adc_progress','{"1":1}');localStorage.setItem('ee.done','["adc"]');},original);
   const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
   assert.equal(await page.locator('[data-ee-adc-course]').count(),1);
   for(let i=0;i<=5;i++)assert.equal(await page.locator('#lesson-'+i).count(),1);
   for(let i=1;i<=5;i++){
     await page.locator('nav.toc a[href="#lesson-'+i+'"]').click();
     await page.waitForURL(BASE+PATH+'#lesson-'+i);
     await page.locator('#lesson-'+i+' details summary').click();
     assert.equal(await page.locator('#lesson-'+i+' details').evaluate(el=>el.open),true);
   }
   await page.locator('nav.toc a[href="#formulas"]').click();await page.waitForURL(BASE+PATH+'#formulas');
   assert.match(await page.locator('#formulas').innerText(),/C2000|datasheet/);
   for(const width of [320,390]){
     await page.setViewportSize({width,height:844});
     const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(m.scroll<=m.width+2,name+' horizontal overflow '+width+' '+JSON.stringify(m));
   }
   await page.screenshot({path:'tests/screenshots/cross-'+name+'-adc-course.png',fullPage:true});
   assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),before,'reading cannot rewrite unknown evidence or old course progress');
   await page.locator('#lesson-3 a[href^="adc.html?current=-20"]').click();
   await page.waitForURL(u=>u.pathname===CALC&&u.searchParams.get('current')==='-20');
   await page.waitForFunction(()=>document.documentElement.dataset.eeAdcState==='ready');
   assert.match(await page.locator('#currentResults').innerText(),/1030/);
   await page.goBack();await page.waitForURL(BASE+PATH+'#formulas');
   assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),before);
   const saved=await browser.newContext(),s=await saved.newPage();
   try{
     await s.goto(BASE+'/workbench/index.html#experiment-energy');
     await s.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='ready'&&CircuitEvidence.storageStatus().saved);
     await s.evaluate(()=>{EEWorkbenchHost.reference('1_c2000_adc_calculator/3_why_offset.html','ADC Offset');window.oldFlush=CircuitEvidence.flush;CircuitEvidence.flush=async()=>({saved:false,reason:'quota'});});
     await s.locator('#reference-links button').click();
     assert.match(s.url(),/index\.html#experiment-energy$/);
     await s.evaluate(()=>{CircuitEvidence.flush=window.oldFlush;});
     await s.locator('#reference-links button').click();await s.waitForURL(BASE+PATH+'#lesson-3');
   }finally{await saved.close();}
   assert.deepEqual(errors,[]);
   assert.deepEqual(external,[],'no old site/network/runtime dependencies');
   console.log('PASS ADC lesson '+name+': sequence, native calculator, exact save-gated host navigation, old history intact, 320/390');
 }finally{await ctx.close();await browser.close();}
}
