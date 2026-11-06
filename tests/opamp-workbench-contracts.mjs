import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='workbench/';
for(const page of ['opamp-step.html','opamp-sine.html']){
 assert.ok(existsSync(root+page),'local OP lab is missing: '+page);
 const html=readFileSync(root+page,'utf8');
 for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  assert.doesNotMatch(m[1],/^(?:https?:)?\/\//i,'no external runtime dependency');
  assert.ok(existsSync(new URL(m[1],new URL(root+page,'file://'+process.cwd()+'/'))),'local link '+m[1]);
 }
 for(const forbidden of ['tutor.js','learning-bridge.js','learning-evidence.js','lab-oracles.js','opamp-verification.js'])assert.ok(!html.includes(forbidden),'no unported grade/progress writer '+forbidden);
 assert.ok(html.includes('不代表'),'clear non-hardware/grade boundary');
 assert.ok(html.includes('ee-opamp-status')&&html.includes('ee-opamp.js'),'fail-closed page bootstrap');
 assert.ok(html.includes('hidden id="op-scope"'),'canvas starts hidden until bootstrap completes');
 assert.ok(html.includes('lab_diagnose.html')===false,'unmigrated diagnosis cannot be a live link');
 for(const m of html.matchAll(/<input[^>]*>/g))assert.match(m[0],/disabled/,'inputs initially disabled');
}
const owner=readFileSync(root+'12_opamp_slew_rate/assets/opamp.js');
assert.equal(createHash('sha1').update('blob '+owner.length+'\0').update(owner).digest('hex'),'5eb7fb9b4f49a22794d1c5f500c5449f5f6c775c','original numerical and plot owner must be byte-identical');
for(const path of ['12_opamp_slew_rate/assets/opamp.js','ee-opamp.js'])assert.doesNotMatch(readFileSync(root+path,'utf8'),/localStorage|sessionStorage|CircuitEvidence|fetch\(/,'stateless lab '+path);
assert.match(readFileSync('app.js','utf8'),/opamp-workbench-entry/,'actual OP lesson entry');
assert.match(readFileSync(root+'adc.html','utf8'),/opamp-step\.html/,'static chain to dynamic lab');
const manifest=JSON.parse(readFileSync(root+'source-manifest.json'));
for(const entry of manifest.files){const b=readFileSync(root+entry.path);assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256,entry.path);}
for(const path of ['12_opamp_slew_rate/assets/opamp.js','12_opamp_slew_rate/assets/opamp.css'])assert.equal(manifest.files.find(x=>x.path===path)?.adapted,false,path);
for(const key of ['test:browser','test:cross-browser'])assert.ok(JSON.parse(readFileSync('package.json')).scripts[key].includes('tests/opamp-workbench-smoke.mjs'));
console.log('PASS OP labs: local closure, original source hash, stateless pages, explicit assessment boundary and browser wiring');
