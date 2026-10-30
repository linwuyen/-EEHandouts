/* Browser-level keyboard, accessible-name and semantic regression.
 * Not a WCAG audit; does not replace axe, color-contrast or a screen reader.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  for(const route of ['index.html#home','middle.html#home','advanced.html#pfc']){
    await page.goto(BASE+'/'+route);
    await page.locator('main h1').first().waitFor({timeout:20000});
    const structural=await page.evaluate(()=>{
      const main=document.querySelector('main'),skip=document.querySelector('a.skip-link');
      const ids=Array.from(document.querySelectorAll('[id]')).map(n=>n.id);
      const controls=Array.from(document.querySelectorAll('input,select,textarea')).filter(n=>n.getClientRects().length>0);
      const unlabeled=controls.filter(n=>!n.labels?.length&&!n.getAttribute('aria-label')&&!n.getAttribute('aria-labelledby'));
      const buttons=Array.from(document.querySelectorAll('button')).filter(n=>n.getClientRects().length>0);
      const nameless=buttons.filter(n=>!n.textContent.trim()&&!n.getAttribute('aria-label')&&!n.getAttribute('title'));
      return {lang:document.documentElement.lang,skip:!!(main&&skip&&skip.getAttribute('href')==='#'+main.id),
        unique:ids.length===new Set(ids).size,unlabeled:unlabeled.map(n=>n.id||n.type),nameless:nameless.map(n=>n.id||n.className),
        headings:document.querySelectorAll('main h1').length};
    });
    assert.equal(structural.lang,'zh-Hant',route+' language');
    assert.equal(structural.skip,true,route+' skip-to-content target');
    assert.equal(structural.unique,true,route+' duplicate id');
    assert.deepEqual(structural.unlabeled,[],route+' unlabeled inputs');
    assert.deepEqual(structural.nameless,[],route+' unnamed buttons');
    assert.equal(structural.headings,1,route+' main H1 landmark');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('skip-link')),true,route+' skip-link first keyboard stop');
    console.log('PASS accessibility semantics',route);
  }
  for(const id of ['pfc','llc','psfb','loop','timing','nonideal','zvs']){
    await page.goto(BASE+'/advanced.html#'+id);
    await page.locator('.advanced-chart svg').first().waitFor({timeout:20000});
    const missing=await page.locator('.advanced-chart svg').evaluateAll(nodes=>nodes.filter(n=>!n.getAttribute('aria-label')).length);
    assert.equal(missing,0,id+' SVG chart accessible names');
  }
  console.log('PASS keyboard/landmark/control SVG labels for all volumes');
}finally{await browser.close();}
