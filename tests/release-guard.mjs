import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';

const verify=readFileSync('.github/workflows/verify.yml','utf8');
const publish=readFileSync('.github/workflows/publish-verified.yml','utf8');
const smoke=readFileSync('tests/smoke.mjs','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const upperHtml=readFileSync('index.html','utf8');
const middleHtml=readFileSync('middle.html','utf8');
const advancedHtml=readFileSync('advanced.html','utf8');
assert.ok(upperHtml.includes('href="./advanced.html"')&&middleHtml.includes('href="./advanced.html"'),
  'Advanced lab link must exist on both original volumes');
assert.ok(advancedHtml.includes('./advanced-models.js')&&advancedHtml.includes('./advanced-app.js'),
  'Advanced page must load model and viewer code');
assert.ok(pkg.scripts['test:ci'].includes('tests/advanced-engineering.mjs'),
  'Advanced engineering model regression must be required');
assert.ok(pkg.scripts['test:browser'].includes('tests/advanced-smoke.mjs'),
  'Advanced Chromium UI regression must be required');
assert.ok(readFileSync('tests/cross-browser.mjs','utf8').includes("['pfc','llc','psfb','loop','timing','nonideal','zvs']"),
  'Keep all seven advanced models in WebKit/Firefox regression');
const sourceViewer=readFileSync('source-viewer.js','utf8');
const pdfBuildScript=readFileSync('scripts/prepare-pdfjs.sh','utf8');
assert.ok(sourceViewer.includes("'./vendor/pdfjs/'"),'PDF.js browser runtime must use local assets');
assert.ok(!sourceViewer.includes('cdnjs.cloudflare.com'),'PDF.js must not run downloaded CDN code');
assert.ok(pdfBuildScript.includes('openssl dgst -sha512 -binary'),'PDF.js release must have SHA-512 integrity verification');
assert.ok(pdfBuildScript.includes('4.10.38'),'PDF.js version must remain pinned');
assert.ok(verify.includes('run: bash scripts/prepare-pdfjs.sh'),'CI must prepare the same PDF.js artifacts that the deploy uses');
assert.ok(publish.includes('run: bash scripts/prepare-pdfjs.sh'),'Pages must bundle verified PDF.js assets');

assert.ok(pkg.scripts['test:browser'].includes('tests/middle-engineering.mjs'), 'Keep the newer middle-volume DCM engineering regression in the suite');
assert.equal(pkg.scripts['test:cross-browser'],'node tests/cross-browser.mjs','Firefox/WebKit smoke is a separate CI job');
assert.ok(verify.includes('  cross-browser:'),'Firefox/WebKit job must exist');
assert.ok(verify.includes('npx playwright install --with-deps firefox webkit'),'Firefox/WebKit binaries must be installed');
assert.ok(verify.includes('npm run test:cross-browser'),'Cross-browser smoke must actually execute');

const count=(hay,needle)=>hay.split(needle).length-1;
assert.equal(count(smoke,"await run('磁路與 ADC 超出物理模型時拒絕數值'"),1,'Duplicated regression block');
assert.match(verify,/runs-on: ubuntu-24\.04/);
assert.match(publish,/runs-on: ubuntu-24\.04/);
for(const action of ['actions/checkout@v7','actions/setup-node@v7','actions/upload-artifact@v7']) {
  assert.ok(verify.includes(action),'Node24 runtime action missing: '+action);
}
for(const action of ['actions/checkout@v7','actions/configure-pages@v6','actions/upload-pages-artifact@v5','actions/deploy-pages@v5']){
  assert.ok(publish.includes(action),'Node24 runtime publish action missing: '+action);
}
assert.ok(verify.includes('npm ci --ignore-scripts'),'CI must install from committed lockfile');
assert.ok(!verify.includes('npm install --package-lock-only'),'CI must not regenerate lockfile');
assert.ok(publish.includes("workflow_run.conclusion == 'success'"),'Publish must require successful CI');
assert.match(publish,/^\s*queue:\s*max\s*$/m,'Keep all out-of-order verified deployment events pending');
assert.match(publish,/^\s*cancel-in-progress:\s*false\s*$/m,'Older CI completions must not cancel newer deployment');
assert.ok(publish.includes("head_repository.full_name == github.repository"),'Reject foreign workflow runs');
assert.ok(publish.includes("head_branch == 'main'"),'Publish only main');
assert.ok(publish.includes("if: steps.final_freshness.outputs.current == 'true'"),'Deploy missing freshness guard');
assert.equal(count(publish,'run: bash scripts/check-verified-head.sh'),2,'Freshness guard must run twice');
assert.equal(lock.lockfileVersion,3);
for (const [name,version] of Object.entries(pkg.devDependencies)){
  assert.equal(lock.packages['node_modules/'+name]?.version,version,'Lockfile drift: '+name);
}
const directory=mkdtempSync(join(tmpdir(),'eehandouts-ci-guard-'));
try{
  const gh=join(directory,'gh');
  writeFileSync(gh,`#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" != "api" || "$2" != "repos/linwuyen/-EEHandouts/git/ref/heads/main" ]]; then
  echo "Unexpected mock gh call" >&2; exit 14
fi
if [[ "\${MOCK_GH_FAIL:-0}" == "1" ]]; then exit 42; fi
printf '%s\\n' "$MOCK_REMOTE_SHA"
`);
  chmodSync(gh,0o755);
  const verified='a'.repeat(40);
  function check(remote,shouldFail=false){
    const output=join(directory,'result-'+(remote||'error')+'.txt');
    const result=spawnSync('bash',['scripts/check-verified-head.sh'],{
      encoding:'utf8',env:{...process.env,
        PATH:directory+delimiter+process.env.PATH,
        GITHUB_REPOSITORY:'linwuyen/-EEHandouts',
        GITHUB_OUTPUT:output,
        VERIFIED_SHA:verified,
        MOCK_REMOTE_SHA:remote,
        MOCK_GH_FAIL:shouldFail?'1':'0'}
    });
    let txt='';
    try{txt=readFileSync(output,'utf8')}catch(e){}
    return {result,txt};
  }
  let matched=check(verified);
  assert.equal(matched.result.status,0,'Matching main SHA should succeed');
  assert.match(matched.txt,/current=true/);
  let outdated=check('b'.repeat(40));
  assert.equal(outdated.result.status,0,'Stale CI is not a script error; it must skip publishing');
  assert.match(outdated.txt,/current=false/);
  assert.doesNotMatch(outdated.txt,/current=true/);
  let unavailable=check('c'.repeat(40),true);
  assert.notEqual(unavailable.result.status,0,'API failure must prevent deployment');
  assert.doesNotMatch(unavailable.txt,/current=true/);
}finally{rmSync(directory,{recursive:true,force:true})}
console.log('PASS release safety regression: current / stale / API unavailable; action versions, lockfile, duplicate tests');
