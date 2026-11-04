/* Actual DOM/SVG regression for F05-F07; CI uses HTTP, --offline is a local fallback. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const offline=process.argv.includes('--offline'),cross=process.argv.includes('--cross-browser');
const only=process.argv.find(a=>a.startsWith('--case='))?.split('=')[1];
const BASE=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
const near=(a,b,t,label)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t,`${label}: ${a} vs ${b}`);
mkdirSync('tests/screenshots',{recursive:true});
function observeModel(){
 Object.defineProperty(window,'EE_ADVANCED_MODELS',{configurable:true,set(engine){
  const calculate=engine.calculate;
  engine.calculate=function(id,values){
   const started=performance.now(),r=calculate(id,values);
   window.__round2={id,values:{...values},result:r,elapsed:performance.now()-started};return r;
  };
  Object.defineProperty(window,'EE_ADVANCED_MODELS',{value:engine,writable:true,configurable:true});
 }});
}
for(const [name,type] of (cross?[['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]])){
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const errors=[];let page;
 async function go(id){
  if(page)await page.close();page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(observeModel);
  if(offline){
   await page.route('**/*',r=>r.abort());
   let html=readFileSync('advanced.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
   html=html.replace('</head>','<style>'+readFileSync('advanced.css','utf8')+'</style></head>');
   await page.setContent(html);await page.evaluate(observeModel);await page.evaluate(id=>{location.hash=id;},id);
   await page.addScriptTag({content:readFileSync('advanced-models.js','utf8')});
   await page.addScriptTag({content:readFileSync('advanced-app.js','utf8')});
  }else await page.goto(BASE+'/advanced.html#'+id);
  await page.locator('.advanced-metric').first().waitFor();
 }
 async function change(values){
  for(const [key,value] of Object.entries(values))await page.locator('#adv-'+key).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.waitForFunction(v=>Object.entries(v).every(([k,x])=>window.__round2?.values[k]===x),values);
 }
 try{
  if(!only||only==='f05'){
   await go('llc');await change({vin:400,fs:100,lr:10,cr:100,lm:120,rdc:20,n:8});
   const r=await page.evaluate(()=>({vp:window.__round2.result.traces.find(t=>t.key==='vp').values[121],elapsed:window.__round2.elapsed,valid:window.__round2.result.validity}));
   near(r.vp,-188.14199952889223,.002,'F05 actual UI model switch-edge fixture');
   assert.ok(r.elapsed<1500,'F05 UI computation budget');assert.equal(r.valid,true);
   await page.screenshot({path:`tests/screenshots/${cross?'cross-':''}${name}-round2-llc.png`,fullPage:true});
  }
  if(!only||only==='f06'){
   await go('pfc');await change({vac:240,bus:340,phase:90,power:1000,l:460,fs:100});
   const path=await page.locator('.advanced-chart-plot').first().getAttribute('d');
   const firstH=Number(path.match(/H([\d.]+)/)[1]);
   near((firstH-48)/600,0.001731603030756368,1e-5,'F06 actual SVG narrow pulse duty');
   await page.locator('#advanced-cursor').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));});
   const axes=await page.locator('.advanced-chart-cursor').evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute('x1'))));
   axes.forEach(x=>near(x,198,.01,'physical 25% cursor, not event index'));
   const readouts=await page.locator('.advanced-chart svg').evaluateAll(nodes=>nodes.map(n=>n.querySelector('text[y="9"][text-anchor="end"]').textContent));
   const p=await page.evaluate(()=>window.__round2.result.probe(.25));
   [p.gate,p.il,p.vL,p.vSW,p.diode].forEach((v,i)=>near(Number(readouts[i].split(' ')[0].replaceAll(',','')),v,.00051,'chart/probe value at cursor'));
   await page.screenshot({path:`tests/screenshots/${cross?'cross-':''}${name}-round2-pfc.png`,fullPage:true});
   // Other regimes use the same event-coordinate and interpolation contracts.
   for(const values of [{vac:200,bus:400,phase:45,power:200,l:500,fs:100},{phase:5,power:100,l:800}]){
    await change(values);
    const r=await page.evaluate(()=>window.__round2.result);
    assert.ok(r.validity&&['BCM','DCM'].includes(r.mode));
    await page.locator('#advanced-cursor').evaluate(el=>{el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}));});
    (await page.locator('.advanced-chart-cursor').evaluateAll(ns=>ns.map(n=>+n.getAttribute('x1')))).forEach(x=>near(x,498,.01,'75% event cursor'));
   }
   // Shared renderer must still display the old Bode/log-x, timing and PSFB data.
   for(const id of ['loop','timing','psfb']){
    await go(id);assert.ok(await page.locator('.advanced-chart-plot').count()>0);
    const paths=await page.locator('.advanced-chart-plot').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));
    assert.ok(paths.every(s=>!s.includes('NaN')&&!s.includes('Infinity')),id+' finite SVG');
   }
  }
  if(!only||only==='f07'){
   await go('nonideal');
   async function checkC(want){
    near(Number(await page.locator('#adv-c').inputValue()),want,0,'F07 native range value');
    near(Number((await page.locator('[data-value="c"]').innerText()).split(' ')[0].replaceAll(',','')),want,0,'F07 label');
    near(await page.evaluate(()=>window.__round2.values.c),want,0,'F07 input actually consumed by model');
   }
   await checkC(470);await page.locator('#adv-c').focus();await page.keyboard.press('ArrowRight');
   await page.waitForFunction(()=>window.__round2.values.c===480);await checkC(480);
   await page.keyboard.press('Home');await page.waitForFunction(()=>window.__round2.values.c===100);await checkC(100);
   await page.keyboard.press('End');await page.waitForFunction(()=>window.__round2.values.c===1000);await checkC(1000);
   await page.locator('.advanced-reset').click();await checkC(470);
   await page.screenshot({path:`tests/screenshots/${cross?'cross-':''}${name}-round2-buck.png`,fullPage:true});
  }
  assert.deepEqual(errors,[],'No page errors');
  console.log(`PASS round2 UI ${name} ${browser.version()} (${offline?'offline source':'HTTP site'}): ${only||'F05 F06 F07'}`);
 }finally{await browser.close();}
}
