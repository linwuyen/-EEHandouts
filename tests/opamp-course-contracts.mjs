import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join,delimiter} from 'node:path';
import {tmpdir} from 'node:os';
const read=p=>readFileSync(p,'utf8');
const lessons=JSON.parse(read('tests/fixtures/opamp-course-source.json'));
const assets=['workbench/opamp-course.html','workbench/ee-opamp-course.css',...lessons.map(x=>'workbench/12_opamp_slew_rate/'+x.file)];
const allowedExternal=new Set(['https://www.analog.com/en/resources/app-notes/an-940.html']);
const old='用 noise gain / GBW 估一階起點';
const fixed='對主導單極點的電壓回授 OP，使用 BW ≈ GBW / noise gain 估一階起點';
for(const path of assets)assert.ok(existsSync(path),'missing local course asset: '+path);
for(const path of assets.filter(x=>x.endsWith('.html'))){
 const html=read(path);
 assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|<iframe\b/i,'reading pages must work without scripts');
 assert.doesNotMatch(html,/localStorage|sessionStorage|CircuitEvidence|BOARD_PASS/,'no implied storage or board qualification');
 assert.match(html,/不記錄已讀/);assert.match(html,/正式評量.*尚未遷入/);
 assert.match(html,/11ef4e48/);assert.match(html,/ee-opamp-course\.css/);
 for(const m of html.matchAll(/\b(src|href)="([^"]+)"/g)){
  const u=new URL(m[2],new URL(path,'file://'+process.cwd()+'/'));
  if(u.protocol!=='file:'){assert.equal(m[1],'href');assert.ok(allowedExternal.has(u.href),'unapproved external link '+u.href);continue;}
  assert.ok(existsSync(u),'missing local link '+m[2]);
  if(u.hash){const text=readFileSync(u,'utf8');if(!u.pathname.endsWith('/index.html'))assert.ok(text.includes('id="'+u.hash.slice(1)+'"'),'missing anchor '+m[2]);}
 }
}
const manifest=JSON.parse(read('workbench/source-manifest.json'));
for(const lesson of lessons){
 const path='12_opamp_slew_rate/'+lesson.file,html=read('workbench/'+path);
 let body=html.match(/<!-- BEGIN PINNED LESSON -->([\s\S]*?)<!-- END PINNED LESSON -->/)?.[1];
 assert.ok(body,'original instructional body marked '+path);
 if(lesson.file==='06_datasheet_selection.html'){
  assert.ok(body.includes(fixed),'bandwidth division must not be inverted');
  body=body.replace(fixed,old);
  assert.match(html,/id="ee-gbw-correction"/);assert.match(html,/來源修訂/);assert.match(html,/noise gain \/ GBW/);assert.match(html,/AN-940/);
 }
 assert.equal(createHash('sha256').update(body).digest('hex'),lesson.bodySha256,'undocumented source-content change '+path);
 const entry=manifest.files.find(x=>x.path===path);assert.equal(entry?.sourceBlob,lesson.sourceBlob);assert.equal(entry?.adapted,true);
 assert.equal(entry.sha256,createHash('sha256').update(html).digest('hex'));
 assert.ok(read('workbench/opamp-course.html').includes(path),'contents must include '+path);
}
for(const page of ['workbench/opamp-step.html','workbench/opamp-sine.html'])assert.match(read(page),/id="ee-opamp-course-link" href="opamp-course\.html"/);
assert.match(read('workbench/coverage.html'),/id="opamp-unavailable"/);
const note=read('workbench/12_opamp_slew_rate/06_datasheet_selection.html');assert.doesNotMatch(note,/href="[^"\n]*quiz\.html/);assert.match(note,/正式 Transfer（尚未遷入）/);
assert.match(read('workbench/12_opamp_slew_rate/04_gbw_vs_slew.html'),/診斷 Lab（尚未遷入）/);
const pkg=JSON.parse(read('package.json'));
assert.ok(pkg.scripts['test:ci'].includes('tests/opamp-course-contracts.mjs'));
assert.ok(pkg.scripts['test:ci'].includes('tests/opamp-course-host.mjs'));
for(const key of ['test:browser','test:cross-browser'])assert.ok(pkg.scripts[key].includes('tests/opamp-course-smoke.mjs'));
// Exercise the actual release script: each new missing asset must fail, not only string-match it.
const temp=mkdtempSync(join(tmpdir(),'ee-op-course-'));
try{
 const curl=join(temp,'curl');writeFileSync(curl,'#!/usr/bin/env bash\nset -euo pipefail\nfor arg in "$@"; do\n if [[ -n "${MISSING:-}" && "$arg" == *"${MISSING}"* ]]; then exit 22; fi\n if [[ "$arg" == *release-sha.txt* ]]; then printf "%s\\n" "$VERIFIED_SHA"; exit 0; fi\ndone\n');chmodSync(curl,0o755);
 const run=missing=>spawnSync('bash',['scripts/check-published-head.sh'],{encoding:'utf8',env:{...process.env,PATH:temp+delimiter+process.env.PATH,PAGES_URL:'https://example.invalid/site',VERIFIED_SHA:'a'.repeat(40),VERIFY_ATTEMPTS:'1',VERIFY_DELAY_SECONDS:'0',MISSING:missing}});
 assert.equal(run('').status,0);
 for(const asset of assets)assert.notEqual(run(asset).status,0,'release must reject missing '+asset);
}finally{rmSync(temp,{recursive:true,force:true});}
console.log('PASS OP course: six pinned instructional bodies, documented BW correction, stateless local closure, existing labs, deferred assessment, CI and eight missing-publication-asset guards');
