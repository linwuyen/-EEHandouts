/* F04: prove the page-contract test rejects wrong displayed physics.
 * Every mutation lives in a temporary source copy; production files are never
 * modified. A nonzero exit must name the ADC contract, not a syntax/import error. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const root=resolve('.'),w={};
for(const file of ['upper-page-guides.js','data.js','formula-math.js'])
 runInNewContext(readFileSync(file,'utf8'),{window:w});
const g=w.EE_UPPER_PAGE_GUIDES[106],lesson=w.EE_DATA.chapters.flatMap(c=>c.lessons).find(l=>l.id==='adc');
const cases=[
 ['TeX coefficient x10','upper-page-guides.js',g.equations[1].tex,g.equations[1].tex.replace('0.07','0.7')],
 ['TeX sign','upper-page-guides.js',g.equations[1].tex,g.equations[1].tex.replace('+0.07','-0.07')],
 ['TeX current unit','upper-page-guides.js',g.equations[1].tex,g.equations[1].tex.replace('[A]','[mA]')],
 ['TeX voltage unit','upper-page-guides.js',g.equations[1].tex,g.equations[1].tex.replace('\\mathrm{V}','\\mathrm{mV}')],
 ['fallback coefficient','upper-page-guides.js',g.equations[1].plain,g.equations[1].plain.replace('0.07','0.7')],
 ['fallback current unit','upper-page-guides.js',g.equations[1].plain,g.equations[1].plain.replace('I[A]','I[mA]')],
 ['given Shunt unit','upper-page-guides.js',g.worked.given,g.worked.given.replace('5mΩ','5Ω')],
 ['worked +10 A result','upper-page-guides.js',g.worked.steps[1],g.worked.steps[1].replace('2.20V','8.50V')],
 ['worked endpoint','upper-page-guides.js',g.worked.steps[2],g.worked.steps[2].replace('2.90V','3.90V')],
 ['answer inverse gain','upper-page-guides.js',g.check.a,g.check.a.replace('/0.07','/0.7')],
 ['lesson math gain','formula-math.js',w.EE_MATH.adc[0].tex,w.EE_MATH.adc[0].tex.replace('0.07','0.7')],
 ['lesson fallback gain','data.js',lesson.formula,lesson.formula.replace('0.07','0.7')]
];
const tmp=mkdtempSync(join(tmpdir(),'ee-adc-mutations-'));
try{
 for(const file of ['upper-page-guides.js','data.js','formula-math.js','interactive-lessons.js'])cpSync(join(root,file),join(tmp,file));
 mkdirSync(join(tmp,'tests'));cpSync(join(root,'tests/upper-analog-control-guides.mjs'),join(tmp,'tests/upper-analog-control-guides.mjs'));
 cpSync(join(root,'tests/helpers'),join(tmp,'tests/helpers'),{recursive:true});
 function run(){const p=spawnSync(process.execPath,['tests/upper-analog-control-guides.mjs'],{cwd:tmp,encoding:'utf8',timeout:20000});if(p.error)throw p.error;return p;}
 const baseline=run();assert.equal(baseline.status,0,'F04 original page contract must pass: '+baseline.stderr);
 const results=[];
 for(const [name,file,before,after] of cases){
  const source=readFileSync(join(root,file),'utf8'),needle=JSON.stringify(before);
  assert.notEqual(before,after,'Mutation must change content: '+name);
  assert.equal(source.split(needle).length,2,'Mutation target must be unique: '+name);
  writeFileSync(join(tmp,file),source.replace(needle,JSON.stringify(after)));
  const p=run();
  results.push({name,exit:p.status,killed:p.status!==0&&p.stderr.includes('ADC_DISPLAY_CONTRACT')});
  writeFileSync(join(tmp,file),source);
 }
 console.log(JSON.stringify(results,null,2));
 const survivors=results.filter(x=>!x.killed);
 assert.equal(survivors.length,0,'F04 incorrect display/units/results survived or failed for the wrong reason: '+survivors.map(x=>x.name).join(', '));
 assert.equal(run().status,0,'F04 restored original still passes');
 console.log('PASS F04: '+results.length+' wrong coefficient/sign/unit/example mutations rejected; source untouched');
}finally{rmSync(tmp,{recursive:true,force:true});}
