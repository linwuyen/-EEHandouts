import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
assert.ok(existsSync('workbench/adc.html'),'ADC calculator must exist locally');
const html=readFileSync('workbench/adc.html','utf8'),ui=readFileSync('workbench/ee-adc.js','utf8');
for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const href=match[1];if(href.startsWith('#'))continue;
 assert.ok(!/^(?:https?:)?\/\//i.test(href),'no external dependency '+href);
 assert.ok(existsSync(new URL(href,new URL('workbench/adc.html','file://'+process.cwd()+'/'))),'local '+href);
}
for(const bad of ['tutor.js','learning-bridge.js','lessons.js','learning-evidence.js'])assert.ok(!html.includes(bad),'no progress writer '+bad);
assert.doesNotMatch(ui,/localStorage|sessionStorage|CircuitEvidence|fetch\(/,'calculator is stateless');
for(const text of ['Vref / 2','2<sup>N</sup>','不代表','8.2','1.65','暫存','等值'])assert.ok(html.includes(text),'explicit boundary '+text);
assert.ok(readFileSync('app.js','utf8').includes('adc-workbench-entry'),'real lesson entry');
const m=JSON.parse(readFileSync('workbench/source-manifest.json'));
for(const entry of m.files){const b=readFileSync('workbench/'+entry.path);assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256,entry.path);}
const owner=m.files.find(f=>f.path==='assets/learning/engineering-models.js');assert.equal(owner.adapted,false);
const b=readFileSync('workbench/'+owner.path);assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),owner.sourceBlob);
for(const id of ['test:browser','test:cross-browser'])assert.ok(JSON.parse(readFileSync('package.json')).scripts[id].includes('tests/adc-workbench-smoke.mjs'));
console.log('PASS ADC local closure, source owner, independent defaults, storage boundary and browser wiring');
