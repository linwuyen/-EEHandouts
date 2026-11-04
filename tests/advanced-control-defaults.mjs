/* F07: catch a browser-normalized default before it splits DOM and model state. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const view={};runInNewContext(readFileSync('advanced-models.js','utf8'),{window:view});
const M=view.EE_ADVANCED_MODELS;
let checked=0;
for(const [id,spec] of Object.entries(M.catalog))for(const knob of spec.knobs){
 const {min,max,step,value}=knob,where=id+'.'+knob.key;
 assert.ok(Number.isFinite(value)&&value>=min&&value<=max,where+' default in bounds');
 assert.ok(Number.isFinite(step)&&step>0,where+' positive step');
 const count=(value-min)/step;
 assert.ok(Math.abs(count-Math.round(count))<1e-8,where+' default must be exactly selectable by native range');
 assert.equal(M.params(id)[knob.key],value,where+' model default');checked++;
}
assert.equal(M.params('nonideal').c,470,'Keep the existing 470uF operating point');
console.log(`PASS F07: ${checked} catalog defaults on legal native range grids; Buck 470uF retained`);
