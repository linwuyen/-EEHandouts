import hashlib
import json
from pathlib import Path
import subprocess
import sys

BASE='10f17130924632946651ee02a13dbdd158f927d0'
TREE='97009d67050f5a288d034dc4f61f1f005aa0f691'
DIGEST='38829427b3a940a85145541e296a9d6f3e6b71383bb076b35de517020868cd23'
root=Path.cwd(); product=root/'product'
def git(*args):
    return subprocess.check_output(['git','-C',str(product),*args],text=True).strip()
def digest(data):
    return hashlib.sha256(data).hexdigest()
raw=(root/'payload/.adc-review/repair.json').read_bytes()
assert digest(raw)==DIGEST
recipe=json.loads(raw)
assert recipe['base']==BASE and recipe['tree']==TREE
assert git('rev-parse','HEAD')==BASE
assert git('rev-parse','HEAD^{tree}')==recipe['baseTree']
assert not git('status','--porcelain')
allowed={'tests/adc-workbench-page.mjs','tests/adc-workbench-smoke.mjs','workbench/ee-adc.js','workbench/source-manifest.json'}
assert {f['path'] for f in recipe['files']}==allowed and len(recipe['files'])==4
for f in recipe['files']:
    if '--test-only' in sys.argv and f['path']!='tests/adc-workbench-page.mjs':
        continue
    path=product/f['path']; data=path.read_bytes()
    assert digest(data)==f['before'],f['path']
    text=data.decode('utf-8');limit=len(text)
    for start,end,replacement in reversed(f['edits']):
        assert 0<=start<=end<=limit
        text=text[:start]+replacement+text[end:];limit=start
    data=text.encode('utf-8');assert digest(data)==f['after'],f['path']
    path.write_bytes(data)
if '--test-only' not in sys.argv:
    git('add','--all');git('diff','--cached','--check')
    assert git('write-tree')==TREE
    (root/'repair-tree.txt').write_text(TREE+'\n')
print('Verified ADC correction', 'test-only' if '--test-only' in sys.argv else TREE)
