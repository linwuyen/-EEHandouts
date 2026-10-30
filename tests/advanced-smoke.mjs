/* Full Chromium smoke for the isolated advanced labs and old-volume entry links. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir('tests/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function go(id){await page.goto(BASE+'/advanced.html#'+id);await page.locator('.advanced-metric').first().waitFor({timeout:20000});return page.locator('.advanced-shell');}
async function knob(key,val){const input=page.locator('[data-knob="'+key+'"]');await input.evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},val);}
async function waitMode(mode){await page.waitForFunction(expect=>document.querySelector('.advanced-model-status')?.textContent?.includes(expect),mode,{timeout:20000});}
async function output(label){return page.locator('.advanced-metric').filter({has:page.locator('small', {hasText:label})}).locator('strong').first().innerText();}
for(const id of ['pfc','llc','psfb','loop','timing','nonideal','zvs']){
  const shell=await go(id);
  assert.equal(await shell.locator('.advanced-controls input[type=range]').count()>3,true,id+' controls');
  assert.ok(await shell.locator('.advanced-chart svg').count()>=1,id+' SVG');
  assert.equal(await shell.locator('.advanced-model-status').getAttribute('data-valid'),'true',id+' initial valid');
  assert.ok((await shell.locator('.advanced-assumptions').innerText()).length>50,id+' assumptions');
  assert.ok((await page.locator('.advanced-lab-nav a[aria-current=page]').getAttribute('href')).endsWith(id));
  const slider=page.locator('#advanced-cursor');await slider.evaluate(el=>{el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#advanced-cursor-label').innerText(),'75%');
  assert.ok((await page.locator('.advanced-probe').innerText()).length>10);
}
await go('pfc');await knob('phase',5);await knob('power',100);await knob('l',800);await waitMode('DCM');
assert.equal(await page.locator('.advanced-model-status').getAttribute('data-valid'),'true');
await page.locator('.advanced-reset').click();await waitMode('CCM');
await go('llc');const before=await output('FHA 估計輸出 DC');await knob('fs',160);
await page.waitForFunction(old=>document.querySelectorAll('.advanced-metric strong')[2]?.textContent!==old,before,{timeout:20000});
await go('psfb');const initial=await output('理想輸出 Vout');await knob('phase',110);
await page.waitForFunction(old=>document.querySelectorAll('.advanced-metric strong')[1]?.textContent!==old,initial,{timeout:15000});
await go('loop');assert.ok(await page.locator('.advanced-chart').count()===2);
assert.ok((await page.locator('.advanced-metric').first().innerText()).includes('Hz'));
await go('timing');await page.locator('[data-selector="soca"]').selectOption('ZERO');
await page.locator('[data-selector="shadow"]').selectOption('ZERO');await knob('fs',200);await knob('isr',30000);await waitMode('CPU_OVERRUN');
assert.equal(await page.locator('.advanced-model-status').getAttribute('data-valid'),'false');
await page.locator('.advanced-reset').click();await waitMode('SAME_CYCLE');
await go('nonideal');const vo=await output('非理想 Buck Vout');await knob('rh',80);
await page.waitForFunction(old=>document.querySelectorAll('.advanced-metric strong')[1]?.textContent!==old,vo,{timeout:15000});
await go('nonideal');await knob('fs',125);await knob('duty',40);await knob('dead',175);await knob('load',16);await knob('l',40);
await waitMode('OUT_OF_DOMAIN');
assert.equal(await page.locator('.advanced-model-status').getAttribute('data-valid'),'false','Dead-time boundary invalidates CCM');
await go('nonideal');await knob('fs',50);await knob('l',40);await knob('load',2);await knob('dead',0);await knob('esr',100);
await page.waitForFunction(()=>document.querySelectorAll('.advanced-metric strong')[8]?.textContent?.trim().startsWith('0.3'),null,{timeout:15000});
assert.ok((await output('電容 ESR 耗損')).includes('0.3'),'UI must expose capacitor loss in watts');
await go('zvs');await waitMode('INSUFFICIENT');await knob('ip',15);await waitMode('ENERGY_AND_TIME');
for(const file of ['index.html','middle.html']){
 await page.goto(BASE+'/'+file+'#home');await page.locator('.subject-card').first().waitFor();
 assert.ok(await page.locator('a[href="./advanced.html"]').count()>0,file+' advanced entry');
}
const mobile=await browser.newPage({viewport:{width:320,height:720}});
mobile.on('pageerror',e=>errors.push(e.message));
for(const id of ['pfc','llc','psfb','loop','timing','nonideal','zvs']){
 await mobile.goto(BASE+'/advanced.html#'+id);
 await mobile.locator('.advanced-metric').first().waitFor({timeout:20000});
 const widths=await mobile.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(widths.scroll<=widths.viewport+2,id+' 320px overflow: '+JSON.stringify(widths));
 if(id==='pfc'||id==='llc'||id==='timing')await mobile.screenshot({path:'tests/screenshots/advanced-'+id+'-mobile.png',fullPage:true});
}
await page.goto(BASE+'/advanced.html#pfc');
await page.screenshot({path:'tests/screenshots/advanced-pfc-desktop.png',fullPage:true});
await page.locator('#advanced-theme').click();
assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
assert.deepEqual(errors,[],'No uncaught browser errors');
await browser.close();
console.log('ADVANCED BROWSER PASS 7 models, controls, timing limits, old volume navigation, 320px, dark theme');