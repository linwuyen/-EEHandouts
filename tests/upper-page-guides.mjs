import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const u={},c={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:u});
runInNewContext(readFileSync('data.js','utf8'),{window:c});
const g=u.EE_UPPER_PAGE_GUIDES,lessons=c.EE_DATA.chapters.flatMap(c=>c.lessons);
assert.deepEqual(Object.keys(g).map(Number).sort((a,b)=>a-b),Array.from({length:104},(_,i)=>i+3));
const links={3:'power',4:'rms',5:'pqs',6:'threephase',7:'fourier',8:'fourier',9:'fourier',10:'thd',11:'thd',12:'ampere',13:'ampere',14:'bh',
15:'reluctance',16:'reluctance',17:'reluctance',18:'reluctance',19:'reluctance',
20:'faraday',21:'inductor',22:'transformer',23:'transformer',24:'transformer',
25:'transformer',26:'transformer',
27:'diodes',28:'diodes',29:'diodes',30:'diodes',
31:'legacy',32:'legacy',33:'legacy',34:'legacy',35:'legacy',
36:'mosfet',37:'mosfet',38:'mosfet',39:'mosfet',40:'switchloss',
41:'legacy',42:'legacy',43:'igbt',44:'legacy',45:'legacy',46:'legacy',47:'switchloss',48:'igbt',
49:'wbg',50:'wbg',51:'wbg',52:'wbg',53:'wbg',54:'wbg',55:'wbg',56:'wbg',57:'wbg',58:'wbg',
59:'blocks',60:'linear',61:'linear',62:'pwm',
63:'half',64:'half',65:'half',66:'bridge',67:'bridge',68:'bridge',69:'bridge',70:'bridge',71:'overlap',72:'overlap',73:'capacitor',74:'capacitor',75:'capacitor',76:'capacitor',77:'capacitor',78:'capacitor',79:'capacitor',80:'notching',81:'notching',82:'notching',
83:'neutral',84:'neutral',85:'neutral',86:'sixpulse',87:'sixpulse',88:'sixpulse',89:'harmonics',90:'commutation',91:'commutation',92:'commutation',93:'bus',94:'bus',95:'bus',96:'bus',97:'op',98:'op',99:'diff',100:'filter',101:'filter',102:'filter',103:'filter',104:'differentiator',105:'pi',106:'adc'};
for(let p=3;p<=106;p++){
 const x=g[p];assert.equal(x.lesson,links[p],'wrong page lesson '+p);
 assert.ok(lessons.some(l=>l.id===x.lesson),'broken lesson link '+p);
 assert.ok(x.intuition.length===2&&x.intuition.every(t=>t.trim()),'physical explanation '+p);
 assert.ok(x.steps.length>=3&&x.steps.every(t=>t.title.trim()&&t.detail.trim()),'energy flow '+p);
 assert.ok(x.equations.length>=2&&x.equations.every(t=>t.tex&&t.plain&&t.why.trim()),'equations '+p);
 assert.ok(x.worked.steps.length>=3&&x.worked.given.trim(),'worked '+p);
 assert.ok(x.assumptions.length>=2&&x.check.q&&x.check.a,'limits or understanding '+p);
 if(p<=11){
  // Repeated boilerplate across these sections previously obscured the figure and example.
  const explanations=[...x.intuition,...x.steps.map(s=>s.detail),...x.equations.map(e=>e.why)];
  const sentences=explanations.flatMap(s=>s.split('。').map(v=>v.trim()).filter(Boolean));
  assert.equal(new Set(sentences).size,sentences.length,'repeated explanation P.'+p);
 }else{
  assert.ok(x.intuition.every(t=>t.length>=32),'physical context '+p);
  assert.ok(x.steps.every(t=>t.title.length>=7&&t.detail.length>=35),'detailed steps '+p);
  assert.ok(x.equations.every(e=>e.why.length>=24)&&x.worked.given.length>=24,'formula and example context '+p);
 }
}
const near=(x,y,msg)=>assert.ok(Math.abs(x-y)<1e-8,msg+' '+x);
near(12*2,24,'P3 input power');
near(Math.sqrt((9+9)/2),3,'P4 RMS');
const totalRms=Math.sqrt((2**2+4**2)/2);
near(totalRms**2,10,'P4 heating with DC and ripple');
assert.ok(g[4].worked.steps.some(s=>s.includes('10 W'))&&g[4].pitfall.includes('直流電流'),'P4 preserve DC in total RMS');
near(100*10*.5,500,'P5 P');
near(Math.sqrt(3)*220,381.051177665153,'P6 VLL');
near(Math.atan2(220*Math.sin(Math.PI/3),330)*180/Math.PI,30,'P6 Vab leads Va');
assert.ok(g[6].steps.some(s=>s.detail.includes('3-3(c)'))&&g[6].worked.steps.some(s=>s.includes('381.05∠30°')),'P6 figure and phasor');
near(2**2*5,20,'P7 resistor dissipation');
near(Math.sqrt(4+9/2+16/2),Math.sqrt(16.5),'P8 Parseval');
near(4*10/Math.PI,12.732395447351628,'P9 square fundamental');
near(5/Math.hypot(5,3),0.8574929257125441,'P10 PF');
near(1/Math.sqrt(1+.75**2),.8,'P11 THD PF');
const html=readFileSync('index.html','utf8'),app=readFileSync('app.js','utf8');
assert.ok(html.includes('./upper-page-guides.js')&&html.includes('./middle-page-guides.css'));
assert.ok(app.includes('EE_UPPER_PAGE_GUIDES')&&/D\.volume\s*===\s*['"]middle['"]/.test(app));
const idealQ=0.5728073049705201, frequencyRatio=17.23/22.15362435;
assert.ok(Math.abs(1/Math.hypot(1-frequencyRatio**2,frequencyRatio/idealQ)-Math.SQRT1_2)<.0001);
assert.ok(g[102].worked.steps.some(s=>s.includes('17.23 kHz'))&&g[102].worked.result.includes('−4.84 dB'),'P102 half-power frequency relative to passband');
console.log('PASS upper volume P.3-106 contiguous page coverage and chapter-link contracts');
