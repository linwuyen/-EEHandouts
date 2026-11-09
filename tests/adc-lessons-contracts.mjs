import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const C=require('../workbench/assets/learning/engineering-models.js');
const page=readFileSync('workbench/adc-course.html','utf8');
const css=readFileSync('workbench/ee-adc-course.css','utf8');
const manifest=JSON.parse(readFileSync('workbench/source-manifest.json','utf8'));
const entry=manifest.files.find(x=>x.path==='adc-course.html');
assert.ok(entry && entry.adapted,'original tutorial must be pinned as an adapted source');
assert.equal(entry.sourceBlob,'c7998688fdb9af9db5d62570c089ec5fc423595e');
assert.equal(entry.sha256,createHash('sha256').update(page).digest('hex'));
assert.equal(manifest.adcCourseSourcePages.length,7,'original 0-5 and reference page provenance');
const expected=[
 ['0_index.html','c7998688fdb9af9db5d62570c089ec5fc423595e'],
 ['1_adc_basics.html','9173bc8a71e24c536486d79f01f4d0fb493f46f4'],
 ['2_current_to_voltage.html','a4a4a9cceb97f6e11234f367beb3e4171edd1eb0'],
 ['3_why_offset.html','bca4b4385253b4aee802c35b6c97b1a61b354070'],
 ['4_voltage_divider.html','d66f990d808514fd56aec0098ca56f62564bda0d'],
 ['5_firmware_scaling.html','d4595923d462f8c11798a42424a1bee1c239cadd'],
 ['ref_formulas.html','e1350daa05ac45da2a8c3f3ce83c0cf7b9a9da8b']
];
for(let i=0;i<expected.length;i++){
 assert.equal(manifest.adcCourseSourcePages[i].sourcePath,'1_c2000_adc_calculator/'+expected[i][0]);
 assert.equal(manifest.adcCourseSourcePages[i].sourceBlob,expected[i][1]);
}
for(let i=0;i<=5;i++)assert.ok(page.includes('id="lesson-'+i+'"'),'lesson '+i+' missing');
assert.ok(page.includes('id="formulas"'));
for(const s of ['4096','4095','0.805664','2048','1030','3065','4.5 W','2.685','ACQPS','80 ns','Rs','12-bit'])assert.ok(page.includes(s),'missing distinct engineering context '+s);
assert.ok(page.includes('Vref / 2^N')&&page.includes('Vref / (2^N−1)'),'LSB convention must be explicit');
assert.ok(page.includes('F28004x')&&page.includes('75 ns'));
assert.doesNotMatch(page,/<script|localStorage\.|setItem\(|CircuitEvidence\.|BOARD_PASS.*授予/,'read-only lessons must not claim progress or write history');
assert.match(css,/@media\(max-width:680px\)/);
for(const m of page.matchAll(/(?:src|href)="([^"]+)"/g)){
 const href=m[1].replace(/&amp;/g,'&');if(href.startsWith('#')||/^https:\/\//.test(href))continue;
 assert.ok(!href.includes('Circuit-Simulation'),'no old runtime');
 const url=new URL(href,'file://'+process.cwd()+'/workbench/adc-course.html');
 assert.ok(existsSync(url.pathname),'local dependency '+href);
}
const quant=C.quantizeAdc({voltageV:1.65,vrefV:3.3,bits:12});
assert.equal(quant.levels,4096);assert.equal(quant.maxCount,4095);
assert.equal(quant.count,2048);assert.equal(quant.lsbV,3.3/4096);
assert.equal(C.quantizeAdc({voltageV:3.3,vrefV:3.3,bits:12}).count,4095);
const chain=i=>C.calculateCurrentChain({currentA:i,shuntOhm:0.005,gain:8.2,offsetV:1.65,vrefV:3.3,bits:12});
assert.equal(chain(-20).adc.count,1030);assert.equal(chain(20).adc.count,3065);assert.equal(chain(30).adcInputV,2.88);
assert.ok(Math.abs(chain(20).ampsPerCount-0.01965034298780488)<1e-13);
const divider=r=>C.calculateDivider({busV:800,topOhm:r,bottomOhm:8250,vrefV:3.3,bits:12});
assert.ok(Math.abs(divider(2e6).adcInputV-3.2864434208888333)<1e-10);
assert.ok(Math.abs(divider(2.45e6).adcInputV-2.6848367741279366)<1e-10);
assert.equal((7+1)/100e6*1e9,80,'ACQPS teaching assumption: 8 SYSCLK periods');
function host(){
 const notices=[],main={inert:false};
 const doc={documentElement:{dataset:{}},getElementById:id=>id==='ee-host-status'?{set textContent(v){notices.push(v)}}:null,querySelector:()=>main};
 const ctx={URL,console,document:doc,location:{href:'https://example.invalid/-EEHandouts/workbench/index.html#experiment',assign:u=>notices.push(u)},localStorage:{getItem:()=>null},CircuitEvidence:{flush:async()=>({saved:true})}};
 ctx.window=ctx;ctx.addEventListener=()=>{};vm.createContext(ctx);
 vm.runInContext(readFileSync('workbench/ee-host.js','utf8'),ctx);
 return {host:ctx.EEWorkbenchHost,notices};
}
const f=host();
for(let i=0;i<=5;i++){
 const path='1_c2000_adc_calculator/'+(i===0?'0_index.html':['','1_adc_basics.html','2_current_to_voltage.html','3_why_offset.html','4_voltage_divider.html','5_firmware_scaling.html'][i]);
 assert.equal(f.host.referenceHref(path),'adc-course.html#lesson-'+i,path);
}
assert.equal(f.host.referenceHref('1_c2000_adc_calculator/index.html'),'adc-course.html#lesson-0');
assert.equal(f.host.referenceHref('1_c2000_adc_calculator/ref_formulas.html'),'adc-course.html#formulas');
for(const path of ['1_c2000_adc_calculator/6_full_calculator.html','1_c2000_adc_calculator/c2000_adc_calculator.html'])assert.equal(f.host.referenceHref(path),'adc.html');
for(const bad of ['1_c2000_adc_calculator/1_adc_basics.html?grade=pass','1_c2000_adc_calculator/4_voltage_divider.html#done','1_c2000_adc_calculator/unknown.html'])assert.equal(f.host.referenceHref(bad),'coverage.html');
assert.equal(await f.host.leave('adc-course.html#lesson-1'),true);
assert.equal(await f.host.leave('adc-course.html?grade=1'),false);
console.log('PASS ADC slice 6a: pinned seven source pages, native model fixtures, exact routes, read-only local closure');
