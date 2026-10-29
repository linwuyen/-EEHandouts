/**
 * EE Handouts browser smoke/regression.
 * Run against a local static server using PLAYWRIGHT_BASE_URL (default http://127.0.0.1:4173).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const outDir='tests/screenshots';
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const checks=[];
const failures=[];
function assertCheck(label,condition){checks.push(label);assert.ok(condition,label)}
async function navigate(page,route){await page.goto(BASE+'/'+route);await page.locator('#main-content h1').first().waitFor()}
async function setRange(page,id,value){
  await page.locator('[data-lab-input="'+id+'"]').evaluate((node,v)=>{
    node.value=String(v);
    node.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
}
async function run(label,fn){
  try{await fn();console.log('PASS',label)}
  catch(err){failures.push({label,error:err.message});console.error('FAIL',label,err.stack)}
}
let desktop=await browser.newContext({viewport:{width:1440,height:900}});
let page=await desktop.newPage();
const pageErrors=[];
page.on('pageerror',err=>pageErrors.push(err.message));

await run('首頁與 7 個主題卡片',async()=>{
  await navigate(page,'#home');
  assertCheck('七個主題',await page.locator('.subject-card').count()===7);
  assertCheck('完整索引導覽',await page.locator('a[href="#slides/all"]').count()>=1);
  await page.screenshot({path:outDir+'/home-desktop.png',fullPage:true});
});
await run('完整 107 頁索引與複合頁碼',async()=>{
  await navigate(page,'#slides/all');
  assertCheck('全部 107 頁',await page.locator('.slide-card').count()===107);
  for(const pg of [1,2,41,42,107]){
    await navigate(page,'#slide/'+pg);
    assertCheck('頁碼 '+pg,await page.locator('#main-content h1').innerText().then(t=>t.includes('第 '+pg+' 頁')));
  }
  await navigate(page,'#slide/41');
  assertCheck('GTO 第 41 頁有對應教材',await page.locator('a[href="#lesson/devices/legacy"]').count()>=1);
  await navigate(page,'#slide/42');
  assertCheck('GTO 第 42 頁有對應教材',await page.locator('a[href="#lesson/devices/legacy"]').count()>=1);
});
await run('逐頁原講義文字以及 PDF 對照',async()=>{
  await navigate(page,'#slide/24');
  assertCheck('第24頁有源文字',await page.locator('.slide-transcript').innerText().then(t=>t.includes('變壓器等效電路')));
  assertCheck('PDF 載入控制',await page.locator('#source-pdf-file').count()===1);
  const pdf=await page.pdf({format:'A4'});
  await page.locator('#source-pdf-file').setInputFiles({name:'sample-source.pdf',mimeType:'application/pdf',buffer:pdf});
  await page.locator('#source-pdf-frame').waitFor({state:'visible'});
  assertCheck('開啟指定原始頁碼',await page.locator('#source-pdf-frame').getAttribute('src').then(s=>s.includes('#page=24')));
  await navigate(page,'#slide/25');
  assertCheck('切頁更新 PDF 錨點',await page.locator('#source-pdf-frame').getAttribute('src').then(s=>s.includes('#page=25')));
  await page.reload();
  await page.locator('#source-pdf-frame').waitFor({state:'visible',timeout:7000});
  assertCheck('重整後本機 PDF 快取可用',await page.locator('#source-pdf-frame').getAttribute('src').then(s=>s.includes('#page=25')));
  await page.locator('#source-pdf-remove').click();
  assertCheck('清除 PDF 後檢視器回到佔位狀態',await page.locator('.source-pdf-placeholder').count()===1);
});
await run('全部 7 個互動實驗',async()=>{
  for(const id of ['ac','magnetics','architecture','devices','rect1','rect3','analog']){
    await navigate(page,'#chapter/'+id);
    assertCheck(id+' 四項輸出',await page.locator('#lab-outputs .output-card').count()===4);
    assertCheck(id+' SVG 圖',await page.locator('#lab-chart svg').count()===1);
  }
});
await run('整流器：滑桿對齊、適用範圍與恢復',async()=>{
  await navigate(page,'#chapter/rect1');
  assertCheck('預設電容 470 μF',await page.locator('[data-lab-input="cap"]').inputValue()==='470');
  await setRange(page,'acv',110);
  await setRange(page,'cap',220);
  await setRange(page,'load',5);
  assertCheck('失效時顯示警告',await page.locator('#lab-validation').isVisible());
  assertCheck('失效時停止估算均值',await page.locator('#lab-outputs').innerText().then(s=>s.includes('模型失效')));
  assertCheck('失效時不顯示誤導的電容曲線',await page.locator('#lab-chart').innerText().then(s=>s.includes('不呈現失效模型波形')));
  await setRange(page,'acv',220);
  await setRange(page,'cap',470);
  await setRange(page,'load',2);
  assertCheck('有效範圍警告隱藏',!(await page.locator('#lab-validation').isVisible()));
  assertCheck('有效範圍有 DC 平均估算',await page.locator('#lab-outputs').innerText().then(s=>s.includes('289.9 V')));
  await page.screenshot({path:outDir+'/rectifier-desktop.png',fullPage:true});
});
await run('PWM：頻率調整與畫面週期一致',async()=>{
  await navigate(page,'#chapter/architecture');
  assertCheck('100kHz 對應 10 pulse/100us',await page.locator('#lab-chart').innerText().then(t=>t.includes('10 個 PWM 週期')));
  await setRange(page,'freq',200);
  assertCheck('200kHz 對應 20 pulse/100us',await page.locator('#lab-chart').innerText().then(t=>t.includes('20 個 PWM 週期')));
  assertCheck('200kHz 對應 5us',await page.locator('#lab-outputs').innerText().then(t=>t.includes('5.00 μs')));
});
await run('PF 與小測驗',async()=>{
  await navigate(page,'#chapter/ac');
  assertCheck('預設 PF 0.8',await page.locator('#lab-outputs').innerText().then(t=>t.includes('0.800')));
  await setRange(page,'theta',60);
  assertCheck('DPF 半值導致 PF 0.4',await page.locator('#lab-outputs').innerText().then(t=>t.includes('0.400')));
  await navigate(page,'#lesson/ac/power');
  await page.locator('#quick-check button[data-action="quick"][data-index="1"]').click();
  assertCheck('快問快答給出解析',await page.locator('#quick-check .quiz-feedback').count()===1);
  await page.locator('[data-action="complete"]').click();
  assertCheck('已標記完成',await page.locator('#side-progress-count').innerText().then(t=>t.includes('1 / 38')));
  await page.reload();
  assertCheck('完成進度儲存成功',await page.locator('#side-progress-count').innerText().then(t=>t.includes('1 / 38')));
  await navigate(page,'#quiz/ac');
  await page.locator('[data-action="quiz-answer"][data-index="1"]').click();
  await page.locator('[data-action="quiz-next"]').click();
  assertCheck('章末測驗換題',await page.locator('.quiz-meter').innerText().then(t=>t.includes('第 2 / 6')));
});
await run('搜尋、深色模式',async()=>{
  await navigate(page,'#home');
  await page.locator('#search-trigger').click();
  await page.locator('#search-input').fill('107');
  assertCheck('搜尋包含第107頁',await page.locator('.search-result[href="#slide/107"]').count()>=1);
  await page.locator('.search-result[href="#slide/107"]').click();
  await page.waitForFunction(()=>document.querySelector('#main-content h1')?.textContent?.includes('第 107 頁'));
  assertCheck('搜尋開啟原講義第107頁',await page.locator('h1').first().innerText().then(t=>t.includes('第 107 頁')));
  await page.locator('#theme-toggle').click();
  assertCheck('深色模式生效',await page.locator('html').getAttribute('data-theme')==='dark');
  await page.screenshot({path:outDir+'/slide-dark-desktop.png',fullPage:true});
});
await run('手機 390px：目錄與水平溢位',async()=>{
  let ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  let mobile=await ctx.newPage();
  await navigate(mobile,'#home');
  await mobile.screenshot({path:outDir+'/home-mobile.png',fullPage:true});
  assertCheck('首頁無水平溢位',await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  await mobile.locator('#menu-toggle').click();
  assertCheck('手機目錄展開',await mobile.evaluate(()=>document.body.classList.contains('menu-open')));
  await mobile.locator('#chapter-nav a[href="#chapter/rect1"]').click();
  await mobile.waitForFunction(()=>location.hash==='#chapter/rect1' && document.querySelector('#main-content h1')?.textContent?.includes('單相整流'));
  assertCheck('手機切章成功',await mobile.locator('#main-content h1').first().innerText().then(t=>t.includes('單相整流')));
  assertCheck('章節頁無水平溢位',await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  await mobile.screenshot({path:outDir+'/chapter-mobile.png',fullPage:true});
  await mobile.goto(BASE+'/#slide/24');
  assertCheck('原講義頁手機無水平溢位',await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  await ctx.close();
});
await run('沒有未捕捉的 JavaScript exception',async()=>assertCheck('pageerror count',pageErrors.length===0));
await desktop.close();await browser.close();
console.log('RESULT',JSON.stringify({passed:checks.length,failed:failures.length,failures},null,2));
if(failures.length)process.exitCode=1;
