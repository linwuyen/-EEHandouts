"""Reconstruct only the exact tested PR46 navigation delta in an isolated checkout."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

BASE = 'cf43c2c05bf367f130199cd1239ecab00071a936'
TREE = '3006a222a9dc865902df337633fa44d436bce1f8'
root = Path.cwd()
product = root / 'product'
payload = root / 'payload/.migration-pr46-navigation'
def git(*args):
    return subprocess.check_output(['git', '-C', str(product), *args], text=True).strip()
def replace(path, old, new):
    p = product / path
    text = p.read_text()
    assert text.count(old) == 1, path
    p.write_text(text.replace(old, new))
assert git('rev-parse', 'HEAD') == BASE
assert not git('status', '--porcelain')
test = product / 'tests/workbench-route-contracts.mjs'
assert not test.exists()
shutil.copyfile(payload / test.name, test)
red = subprocess.run(['node', 'tests/workbench-route-contracts.mjs'], cwd=product, capture_output=True, text=True)
(root / 'navigation-red.log').write_text(red.stdout + red.stderr)
assert red.returncode != 0 and 'mounted #topology must open' in red.stderr
replace('workbench/assets/learning/workspace-experiment-ui.js',
    "window.addEventListener('hashchange',()=>{if(!location.hash.startsWith('#experiment'))",
    "window.addEventListener('hashchange',()=>{if(location.hash==='#topology'){history.replaceState(null,'','#experiment-'+id);return EEWorkbenchHost.leave('topology.html');}if(!location.hash.startsWith('#experiment'))")
replace('package.json',
    'node tests/topology-provenance-contracts.mjs && npm run test:workbench',
    'node tests/topology-provenance-contracts.mjs && node tests/workbench-route-contracts.mjs && npm run test:workbench')
add = r'''  // The legacy #topology alias must use the same save gate after mounting.
  const routeQuota=await fresh(),rq=await routeQuota.newPage();await rq.goto(BASE+'/workbench/index.html');await ready(rq);
  const routeRaw=await rq.evaluate(k=>localStorage.getItem(k),key);
  await rq.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='circuit-learning-state-v5')throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};});
  await rq.locator('input[name="experiment-answer"][value="up"]').check();await rq.locator('#workspace-submit').click();
  await rq.waitForFunction(()=>!CircuitEvidence.storageStatus().saved&&document.getElementById('ws-save').textContent.includes('尚未'));
  await rq.evaluate(()=>location.hash='topology');
  await rq.waitForFunction(()=>location.hash==='#experiment-energy'&&document.getElementById('ee-host-status').textContent.includes('取消離開'));
  assert.match(rq.url(),/index\.html#experiment-energy$/);assert.equal(await rq.evaluate(k=>localStorage.getItem(k),key),routeRaw);
  assert.equal(await rq.evaluate(()=>CircuitEvidence.load().benchmark.learningWorkspace.experiment.rows.energy.first.answer),'up','unsaved judgment remains in the draft');
  await routeQuota.close();
  const routeFuture=await fresh(),rf=await routeFuture.newPage();await rf.goto(BASE+'/workbench/index.html');await ready(rf);
  const routeFutureRaw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'hash-route-future'});
  await rf.evaluate(({key,raw})=>{localStorage.setItem(key,raw);location.hash='topology';},{key,raw:routeFutureRaw});
  await rf.waitForFunction(()=>document.documentElement.dataset.eeWorkbenchState==='protected'&&location.hash==='#experiment-energy');
  assert.match(rf.url(),/index\.html#experiment-energy$/);assert.equal(await rf.evaluate(k=>localStorage.getItem(k),key),routeFutureRaw);
  assert.equal(await rf.evaluate(()=>localStorage.getItem('circuit-learning-state-v5-corrupt-backup')),null);await routeFuture.close();
'''
anchor = '  // Version update while contract fetch is pending: no legacy normalizer/write.\n'
replace('tests/topology-workbench-smoke.mjs', anchor, add + anchor)
ui = product / 'workbench/assets/learning/workspace-experiment-ui.js'
replace('workbench/source-manifest.json',
    '556995ce5be49d05552add2e7174932ff3ca5dbbc979d33a92cc43d52f1ce759',
    hashlib.sha256(ui.read_bytes()).hexdigest())
git('add', '--all')
assert set(git('diff', '--cached', '--name-only').splitlines()) == {
    'workbench/assets/learning/workspace-experiment-ui.js', 'workbench/source-manifest.json',
    'tests/workbench-route-contracts.mjs', 'tests/topology-workbench-smoke.mjs', 'package.json'}
assert git('write-tree') == TREE, git('write-tree')
green = subprocess.run(['node', 'tests/workbench-route-contracts.mjs'], cwd=product, capture_output=True, text=True)
(root / 'navigation-green.log').write_text(green.stdout + green.stderr)
assert green.returncode == 0, green.stderr
(root / 'navigation-tree.txt').write_text(TREE + '\n')
print('Verified original failure, exact five-file tree and repaired route:', TREE)
