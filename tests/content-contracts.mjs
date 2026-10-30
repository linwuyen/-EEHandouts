/* Static course fixture and README count contract; no test-derived expectations. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function load(file,key){
  const root={};runInNewContext(readFileSync(file,'utf8'),{window:root});
  assert.ok(root[key],file+' did not initialize '+key);
  return root[key];
}
const upper=load('data.js','EE_DATA'),middle=load('middle-data.js','EE_DATA');
const equations=load('formula-math.js','EE_MATH');
const upperSlides=load('slide-text.js','EE_SOURCE_TEXT');
const middleSlides=load('middle-slide-text.js','EE_SOURCE_TEXT');
assert.equal(upper.chapters.length,7,'upper chapters');
assert.equal(middle.chapters.length,7,'middle chapters');
assert.equal(upper.chapters.reduce((n,c)=>n+c.lessons.length,0),38,'upper lessons');
assert.equal(middle.chapters.reduce((n,c)=>n+c.lessons.length,0),34,'middle lessons');
assert.equal(Object.keys(upperSlides).length,107,'upper slide-page text count');
assert.equal(Object.keys(middleSlides).length,52,'middle slide-page text count');
const lessonCount=Object.keys(equations).length;
const equationCount=Object.values(equations).reduce((n,group)=>n+group.length,0);
assert.equal(lessonCount,71,'typed-math lesson count');
assert.equal(equationCount,120,'reviewed actual equation count');
const readme=readFileSync('README.md','utf8');
assert.ok(readme.includes(lessonCount+' 節、'+equationCount+' 條公式'),
  'README equation counts must match the committed model data');
console.log('PASS course content contract:',JSON.stringify({upper:38,middle:34,typedMath:lessonCount,equations:equationCount}));
