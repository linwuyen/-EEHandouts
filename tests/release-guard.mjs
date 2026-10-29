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
assert.ok(pkg.scripts['test:browser'].includes('tests/middle-engineering.mjs'), 'Keep the newer middle-volume DCM engineering regression in the suite');

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
