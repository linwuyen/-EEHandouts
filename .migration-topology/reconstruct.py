"""Apply a digest-pinned, data-only edit recipe to an immutable source tree."""
import gzip
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

BASE = '9a4a2603c974ae22998bdfe4348890c00e146300'
SOURCE = '11ef4e4801b5283f265dc349a4afec0027603228'
TREE = '89e44c629d0994b21c1c9605b197e19a2a76be35'
DIGEST = '8b21e358131776dd9eab50b54838b48768b528d671691d6921dcb1d97fedeeb7'
root = Path.cwd()
product, source = root / 'product', root / 'source'

def git(directory, *args):
    return subprocess.check_output(['git', '-C', str(directory), *args], text=True).strip()

def safe(directory, path):
    p = Path(path)
    assert not p.is_absolute() and '..' not in p.parts
    assert p.parts and p.parts[0] not in ('.git', '.github', '.migration-topology')
    resolved = (directory / p).resolve()
    assert resolved.is_relative_to(directory.resolve())
    return resolved

assert git(product, 'rev-parse', 'HEAD') == BASE
assert git(source, 'rev-parse', 'HEAD') == SOURCE
assert not git(product, 'status', '--porcelain')
parts = sorted((root / 'payload/.migration-topology').glob('*.gzpart'))
assert len(parts) == 10
packed = b''.join(p.read_bytes() for p in parts)
assert hashlib.sha256(packed).hexdigest() == DIGEST
recipe = json.loads(gzip.decompress(packed))
assert (recipe['base'], recipe['source'], recipe['targetTree']) == (BASE, SOURCE, TREE)
for seed in recipe['seeds']:
    origin = {'circuit': source, 'ee': product}[seed['from']]
    src, dst = safe(origin, seed['source']), safe(product, seed['target'])
    assert git(origin, 'hash-object', str(src)) == seed['blob']
    assert not dst.exists()
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)
for entry in recipe['files']:
    dst = safe(product, entry['path'])
    raw = dst.read_bytes() if dst.exists() else b''
    if entry['before'] is None:
        assert not dst.exists()
    else:
        assert hashlib.sha256(raw).hexdigest() == entry['before'], entry['path']
    text = raw.decode('utf-8')
    limit = len(text)
    for start, end, replacement in reversed(entry['edits']):
        assert 0 <= start <= end <= limit
        text = text[:start] + replacement + text[end:]
        limit = start
    data = text.encode('utf-8')
    assert hashlib.sha256(data).hexdigest() == entry['after'], entry['path']
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(data)
git(product, 'add', '--all')
assert git(product, 'write-tree') == TREE
(root / 'submission-tree.txt').write_text(TREE + '\n')
print('Verified immutable source, payload digest and exact product tree:', TREE)
