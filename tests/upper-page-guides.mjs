import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const u={},c={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:u});
runInNewContext(readFileSync('data.js','utf8'),{window:c});
const g=u.EE_UPPER_PAGE_GUIDES,lessons=c.EE_DATA.chapters.flatMap(c=>c.lessons);
assert.deepEqual(Object.keys(g).map(Number).sort((a,b)=>a-b),Array.from({length:98},(_,i)=>i+3));
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
83:'neutral',84:'neutral',85:'neutral',86:'sixpulse',87:'sixpulse',88:'sixpulse',89:'harmonics',90:'commutation',91:'commutation',92:'commutation',93:'bus',94:'bus',95:'bus',96:'bus',97:'op',98:'op',99:'diff',100:'filter'};
for(let p=3;p<=100;p++){
 const x=g[p];assert.equal(x.lesson,links[p],'wrong page lesson '+p);
 assert.ok(lessons.some(l=>l.id===x.lesson),'broken lesson link '+p);
 assert.ok(x.intuition.length===2&&x.intuition.every(t=>t.length>=32),'thin intuition '+p);
 assert.ok(x.steps.length>=3&&x.steps.every(t=>t.title.length>=7&&t.detail.length>=35),'energy flow '+p);
 assert.ok(x.equations.length>=2&&x.equations.every(t=>t.tex&&t.plain&&t.why.length>=24),'equations '+p);
 assert.ok(x.worked.steps.length>=3&&x.worked.given.length>=24,'worked '+p);
 assert.ok(x.assumptions.length>=2&&x.check.q&&x.check.a,'limits or understanding '+p);
}
const near=(x,y,msg)=>assert.ok(Math.abs(x-y)<1e-8,msg+' '+x);
near(12*2,24,'P3 input power');
near(Math.sqrt((9+9)/2),3,'P4 RMS');
near(100*10*.5,500,'P5 P');
near(Math.sqrt(3)*220,381.051177665153,'P6 VLL');
near(2**2*5,20,'P7 resistor dissipation');
near(Math.sqrt(4+9/2+16/2),Math.sqrt(16.5),'P8 Parseval');
near(4*10/Math.PI,12.732395447351628,'P9 square fundamental');
near(5/Math.hypot(5,3),0.8574929257125441,'P10 PF');
near(1/Math.sqrt(1+.75**2),.8,'P11 THD PF');
const html=readFileSync('index.html','utf8'),app=readFileSync('app.js','utf8');
assert.ok(html.includes('./upper-page-guides.js')&&html.includes('./middle-page-guides.css'));
assert.ok(app.includes('EE_UPPER_PAGE_GUIDES')&&app.includes("pageCount===52?'中冊':'上冊'"));
console.log('PASS upper volume P.3-100 contiguous page coverage and chapter-link contracts');
