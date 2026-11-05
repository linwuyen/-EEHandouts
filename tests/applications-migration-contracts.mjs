/* Source-defined application route: pinned owners and physical/parameter boundaries. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
assert.ok(existsSync('workbench/applications.html'),'four-application page must exist inside EEHandouts');
const manifest=JSON.parse(readFileSync('workbench/source-manifest.json'));
for(const path of ['assets/learning/topology-transfer-v1.js','assets/learning/model-registry.js','assets/learning/engineering-curriculum.js','assets/learning/workspace-core.js','assets/learning/learning-evidence.js']){
 const item=manifest.files.find(f=>f.path===path),bytes=readFileSync('workbench/'+path);
 assert.equal(item.adapted,false,'unchanged source owner '+path);
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),item.sourceBlob);
}
const html=readFileSync('workbench/applications.html','utf8');
for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const u=match[1];if(u.startsWith('#'))continue;
 assert.ok(!/^(?:https?:)?\/\//i.test(u),'no external execution/link '+u);
 assert.ok(existsSync(new URL(u,new URL('workbench/applications.html','file://'+process.cwd()+'/'))),'local asset '+u);
}
assert.ok(html.indexOf('ee-host.js')<html.indexOf('learning-evidence.js'),'raw root guard precedes evidence');
for(const token of ['Ns/Np','Ceq (nF)','FHA','LC','LCL'])assert.ok(html.includes(token),'source physical definition '+token);
assert.ok(!html.includes('tutor.js')&&!html.includes('learning-bridge.js'),'no nonmigrated global navigation injection');
const W=require('../workbench/assets/learning/workspace-core.js');
const R=require('../workbench/assets/learning/model-registry.js');
for(const l of W.applicationLessons()){
 const p=W.applicationPlan(l.id);
 for(const values of [p.before,p.after])for(const [id,value]of Object.entries(values)){
  const tag=html.match(new RegExp('<(?:input|select)[^>]*id="'+id+'"[^>]*>'))?.[0];assert.ok(tag,'native control '+id);
  if(typeof value==='number'){
   const attr=n=>Number(tag.match(new RegExp(n+'="([^"]+)"'))?.[1]??(n==='step'?1:NaN));
   assert.ok(value>=attr('min')&&value<=attr('max'),'range '+id);
   assert.ok(Math.abs((value-attr('min'))/attr('step')-Math.round((value-attr('min'))/attr('step')))<1e-7,'exact native grid '+id);
  }
 }
 const before=W.applicationRun(l.id,p.before),after=W.applicationRun(l.id,p.after);
 assert.equal(R.describe(l.modelId).owner,'assets/learning/topology-transfer-v1.js');
 assert.equal(Object.keys(p.before).filter(k=>p.before[k]!==p.after[k]).length,1);
 assert.ok(after.result[l.metrics[0][0]]<before.result[l.metrics[0][0]],l.id+' source counterfactual');
}
console.log('PASS applications source closure: local page/assets, unchanged owners, exact native grids and four original counterfactuals');
