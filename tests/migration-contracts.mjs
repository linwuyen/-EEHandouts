import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
assert.ok(existsSync('workbench/index.html'),'Buck workbench must live inside EEHandouts');
const manifest=JSON.parse(readFileSync('workbench/source-manifest.json','utf8'));
assert.equal(manifest.sourceCommit,'11ef4e4801b5283f265dc349a4afec0027603228');
for(const f of manifest.files){
 const b=readFileSync('workbench/'+f.path);
 assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256,'migrated hash '+f.path);
 if(!f.adapted)assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),f.sourceBlob,'unchanged source owner '+f.path);
}
for(const f of ['assets/engineering-sandbox-core.js','assets/learning/learning-evidence.js','assets/learning/core-flow-v1.js','assets/learning/plain-course-core.js','assets/learning/workspace-core.js'])assert.equal(manifest.files.find(x=>x.path===f)?.adapted,false,'do not rewrite '+f);
const html=readFileSync('workbench/index.html','utf8');
for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const u=m[1];if(!u.startsWith('#')){assert.ok(!/^(?:https?:)?\/\//i.test(u),'no remote runtime dependency '+u);assert.ok(existsSync(new URL(u,new URL('workbench/index.html','file://'+process.cwd()+'/'))),'local dependency '+u);}
}
assert.ok(readFileSync('app.js','utf8').includes('workbench/index.html?from=mid-buck-pwm'),'actual lesson entry');
assert.equal(JSON.parse(readFileSync('workbench/package.json')).type,'commonjs');
console.log('PASS migration: internal entry, source-owner hashes, package boundary');
