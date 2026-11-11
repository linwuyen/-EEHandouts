/* Execute the real private SVG renderer in an isolated VM. Instrument only its
 * existing export boundary in memory; do not add test hooks to production. The
 * companion browser suite checks the real EE_LABS.mount -> SVG call path. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {assertBridgePaths} from './helpers/bridge-paths.mjs';
const source=readFileSync('middle-labs.js','utf8');
const anchor='window.EE_LABS={mount:mount,definitions:defs};';
assert.equal(source.split(anchor).length,2,'Instrument the known renderer closure once');
const root={};
runInNewContext(readFileSync('interactive-lessons.js','utf8'),{window:root});
runInNewContext(source.replace(anchor,'window.reviewBridgeWave=bridgeWave;'+anchor),{window:root});
let cases=0;
for(const mode of ['unipolar','bipolar'])for(let da=0;da<=100;da+=5)for(let db=0;db<=100;db+=5){
 const values={mode,da,db};
 const paths=[...root.reviewBridgeWave(values).matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
 assertBridgePaths(paths,values);cases++;
}
console.log('PASS F02: '+cases+' PWM cases, nondecreasing time, endpoints, mean voltage and differential lanes');
