/**
 * EE Handouts browser smoke/regression.
 * Run against a local static server using PLAYWRIGHT_BASE_URL (default http://127.0.0.1:4173).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { PDFDocument, StandardFonts } from 'pdf-lib';

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
async function makeSourceFixture(count,validTitle=true,variant='A'){
  const file=await PDFDocument.create(),font=await file.embedFont(StandardFonts.Helvetica);
  const anchors={1:'Power Electronics - Beginner Course',2:'THD Fourier Principles',
    12:'Ampere Law',24:'Transformer Equivalent Circuit',27:'Power Semiconductor Device',
    59:'Power Electronics System',97:'OP Amplifier Circuit',106:'ADC Current Sensing',
    107:'Thank you for your attention'};
  for(let p=1;p<=count;p++){
    const slide=file.addPage([720,540]);
    let heading=anchors[p]||('Original Lecture Slide '+p);
    if(!validTitle && p===106)heading='Unrelated Content Page';
    slide.drawText(heading,{x:70,y:450,size:26,font});
    slide.drawText('Page '+p+' Variant '+variant,{x:70,y:350,size:16,font});
  }
  return Buffer.from(await file.save());
}
async function waitSourceReady(page,p){
  await page.waitForFunction((pg)=>{
    const c=document.querySelector('#source-pdf-canvas');
    const status=document.querySelector('#source-pdf-feedback');
    return c && c.width>150 && c.height>150 &&
      status && status.textContent.includes('第 '+pg+'／107 頁');
  },p,{timeout:30000});
}
await run('實際 PDF 頁數與內容驗證，以及 canvas 逐頁呈現',async()=>{
  await navigate(page,'#slide/24');
  assertCheck('第24頁仍能看到原講義抽取文字',await page.locator('.slide-transcript').innerText().then(t=>t.includes('變壓器等效電路')));
  assertCheck('PDF 檔案選擇器',await page.locator('#source-pdf-file').count()===1);

  const badCount=await makeSourceFixture(106,true);
  await page.locator('#source-pdf-file').setInputFiles({name:'wrong-count.pdf',mimeType:'application/pdf',buffer:badCount});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('頁數不符'),null,{timeout:30000});
  assertCheck('拒絕106頁 PDF',await page.locator('#source-pdf-canvas').count()===0);

  const badIdentity=await makeSourceFixture(107,false);
  await page.locator('#source-pdf-file').setInputFiles({name:'unrelated-107.pdf',mimeType:'application/pdf',buffer:badIdentity});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('內容識別不符'),null,{timeout:30000});
  assertCheck('拒絕無關的107頁 PDF',await page.locator('#source-pdf-canvas').count()===0);

  const valid=await makeSourceFixture(107,true);
  await page.locator('#source-pdf-file').setInputFiles({name:'ee-source-107.pdf',mimeType:'application/pdf',buffer:valid});
  await waitSourceReady(page,24);
  const pixels24=await page.locator('#source-pdf-canvas').evaluate(c=>c.toDataURL());
  assertCheck('第24頁確實已渲染圖像',pixels24.length>1000);
  await page.screenshot({path:outDir+'/source-p24-desktop.png',fullPage:true});

  await navigate(page,'#slide/25');
  await waitSourceReady(page,25);
  const pixels25=await page.locator('#source-pdf-canvas').evaluate(c=>c.toDataURL());
  assertCheck('第24、25頁像素不同',pixels24!==pixels25);
  await page.reload();
  await waitSourceReady(page,25);
  assertCheck('重整後可從 IndexedDB 恢復有效 PDF',await page.locator('#source-pdf-feedback').innerText().then(t=>t.includes('已驗證講義')));
  // Rapid import/replace/clear must not allow an older asynchronous cache write to revive the file.
  const alternative=await makeSourceFixture(107,true,'B');
  await page.locator('#source-pdf-file').setInputFiles({name:'source-a.pdf',mimeType:'application/pdf',buffer:valid});
  await page.locator('#source-pdf-file').setInputFiles({name:'source-b.pdf',mimeType:'application/pdf',buffer:alternative});
  await page.waitForFunction(()=>document.querySelector('#source-pdf-feedback')?.textContent?.includes('source-b.pdf'),null,{timeout:30000});
  await page.locator('#source-pdf-remove').click();
  await page.waitForTimeout(300);
  assertCheck('清除後返回未載入狀態',await page.locator('.source-pdf-placeholder').count()===1);
  await page.reload();
  await page.waitForTimeout(500);
  assertCheck('清除後不會重新恢復 PDF',await page.locator('.source-pdf-placeholder').count()===1);
  const cached=await page.evaluate(async()=>{
    const db=await new Promise((ok,fail)=>{const r=indexedDB.open('eehandouts-source-pdf');r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
    const tx=db.transaction('source','readonly'),req=tx.objectStore('source').get('upper-volume-r2');
    const data=await new Promise((ok,fail)=>{req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error)});
    db.close();return Boolean(data);
  });
  assertCheck('清除後 IndexedDB 無殘留 PDF',!cached);
});
await run('沒有文字的投影片顯示正確提示',async()=>{
  for(const p of [23,52,84,92]){
    await navigate(page,'#slide/'+p);
    assertCheck('第 '+p+' 頁有圖片提示',await page.locator('.content-note').innerText().then(t=>t.includes('只有頁碼')));
  }
});
await run('全部 7 個互動實驗',async()=>{
  for(const id of ['ac','magnetics','architecture','devices','rect1','rect3','analog']){
    await navigate(page,'#chapter/'+id);
    assertCheck(id+' 四項輸出',await page.locator('#lab-outputs .output-card').count()===4);
    assertCheck(id+' SVG 圖',await page.locator('#lab-chart svg').count()===1);
  }
});
await run('磁路圖與線性磁阻公式一致',async()=>{
  await navigate(page,'#chapter/magnetics');
  const chart=page.locator('#lab-chart');
  assertCheck('不是假造的 B-H 曲線',await chart.innerText().then(x=>x.includes('B(I)')));
  assertCheck('圖明確標註門檻不是材料飽和點',await chart.innerText().then(x=>x.includes('非材料飽和點')));
  await setRange(page,'current',2);
  const initialB=await page.locator('#lab-outputs').innerText();
  await setRange(page,'turns',100);
  const laterB=await page.locator('#lab-outputs').innerText();
  assertCheck('增加匝數會改變工作點磁通密度',initialB!==laterB);
  const check=await page.evaluate(()=>{
    const val=name=>Number(document.querySelector('[data-lab-input="'+name+'"]').value);
    const mu0=4*Math.PI*1e-7, A=1e-4;
    const N=val('turns'), I=val('current'), g=val('gap')/1000;
    const R=.1/(mu0*2000*A)+g/(mu0*A);
    const expectedB=N*I/(R*A);
    const cards=[...document.querySelectorAll('#lab-outputs .output-card')];
    const displayed=cards.find(x=>x.textContent.includes('磁通密度 B'));
    return {expectedB,displayedB:Number(displayed.querySelector('strong').textContent.split(' ')[0])};
  });
  assertCheck('磁通密度與線性磁阻算式相符',Math.abs(check.expectedB-check.displayedB)<.002);
});
await run('PCC 時域與頻域符號分開',async()=>{
  await navigate(page,'#lesson/rect1/notching');
  const formula=await page.locator('.formula-text').innerText();
  assertCheck('PCC 時域公式包含 Ldi/dt',formula.includes('Ls·di/dt'));
  assertCheck('PCC 頻域公式有諧波阻抗 Z',formula.includes('Z̲h'));
});
await run('磁路與 ADC 超出物理模型時拒絕數值',async()=>{
  await navigate(page,'#chapter/magnetics');
  await setRange(page,'gap',0);
  await setRange(page,'turns',150);
  await setRange(page,'current',3);
  assertCheck('磁路顯示範圍警告',await page.locator('#lab-validation').isVisible());
  assertCheck('不再輸出無效電感估值',(await page.locator('#lab-outputs').innerText()).includes('— 模型未驗證'));
  assertCheck('不再輸出 11.31 T 當有效 B',(await page.locator('#lab-outputs').innerText()).includes('— 超出教學門檻'));
  assertCheck('超界工作點無標記',(await page.locator('#lab-chart').innerText()).includes('工作點超出模型範圍'));
  await setRange(page,'gap',.3);
  await setRange(page,'turns',50);
  await setRange(page,'current',1);
  assertCheck('正常模型可復原',!(await page.locator('#lab-validation').isVisible()));
  assertCheck('正常模型仍算得 0.180 T',(await page.locator('#lab-outputs').innerText()).includes('0.180 T'));
  await navigate(page,'#chapter/analog');
  await setRange(page,'amps',-25);
  await setRange(page,'gain',16);
  await setRange(page,'offset',1.2);
  const out=await page.locator('#lab-outputs').innerText();
  assertCheck('ADC -0.8 V 超界有警告',await page.locator('#lab-validation').isVisible());
  assertCheck('ADC 超界不提供 Code',out.includes('— 無有效轉換碼'));
  assertCheck('ADC 超界不當作軟體保護',out.includes('不代表已限壓'));
  await setRange(page,'amps',10);
  await setRange(page,'gain',14);
  await setRange(page,'offset',1.5);
  assertCheck('ADC 合法範圍恢復 Code',(await page.locator('#lab-outputs').innerText()).includes('3003 / 4095'));
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
  await page.locator('#search-input').fill('ESR');
  assertCheck('搜尋索引包含教材工程注意事項',await page.locator('.search-result[href="#lesson/rect1/capacitor"]').count()>=1);
  await page.locator('#search-input').fill('頁碼 25');
  assertCheck('搜尋提示頁碼25可找到正確頁',await page.locator('.search-result[href="#slide/25"]').count()>=1);
  await page.locator('#search-input').fill('107');
  assertCheck('搜尋包含第107頁',await page.locator('.search-result[href="#slide/107"]').count()>=1);
  await page.locator('.search-result[href="#slide/107"]').click();
  await page.waitForFunction(()=>document.querySelector('#main-content h1')?.textContent?.includes('第 107 頁'));
  assertCheck('搜尋開啟原講義第107頁',await page.locator('h1').first().innerText().then(t=>t.includes('第 107 頁')));
  await page.locator('#theme-toggle').click();
  assertCheck('深色模式生效',await page.locator('html').getAttribute('data-theme')==='dark');
  await page.screenshot({path:outDir+'/slide-dark-desktop.png',fullPage:true});
});
await run('特殊網址與搜尋視窗焦點限制',async()=>{
  await navigate(page,'#home');
  await page.locator('#search-trigger').click();
  await page.locator('#search-input').focus();
  await page.keyboard.press('Shift+Tab');
  assertCheck('Shift+Tab 不會離開搜尋對話框',await page.evaluate(()=>document.querySelector('#search-overlay').contains(document.activeElement)));
  await page.locator('#search-close').focus();
  await page.keyboard.press('Tab');
  assertCheck('Tab 最後回到對話框內',await page.evaluate(()=>document.querySelector('#search-overlay').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  assertCheck('Escape 可關閉搜尋',!(await page.locator('#search-overlay').isVisible()));
  await page.goto(BASE+'/#%E0%A4%A');
  await page.locator('#main-content .hero').waitFor();
  assertCheck('錯誤 percent encoding 不使首頁崩潰',await page.locator('.subject-card').count()===7);
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
  await mobile.waitForFunction(()=>!document.body.classList.contains('menu-open'));
  await mobile.locator('#sidebar').evaluate(async(node)=>{await Promise.all(node.getAnimations().map(a=>a.finished.catch(()=>{})))});
  await mobile.screenshot({path:outDir+'/chapter-mobile.png',fullPage:true});
  await mobile.goto(BASE+'/#slide/24');
  assertCheck('原講義頁手機無水平溢位',await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  await ctx.close();
});
await run('320px 與平板布局沒有橫向溢位',async()=>{
  for(const w of [320,768]){
    const ctx=await browser.newContext({viewport:{width:w,height:740}});
    const p=await ctx.newPage();
    for(const hash of ['#home','#chapter/magnetics','#chapter/analog','#slide/24']){
      await navigate(p,hash);
      const status=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      assertCheck(w+'px '+hash+' 無水平溢位',status.scroll<=status.width+2);
    }
    await ctx.close();
  }
});
await run('沒有未捕捉的 JavaScript exception',async()=>assertCheck('pageerror count',pageErrors.length===0));
await desktop.close();await browser.close();
console.log('RESULT',JSON.stringify({passed:checks.length,failed:failures.length,failures},null,2));
if(failures.length)process.exitCode=1;
