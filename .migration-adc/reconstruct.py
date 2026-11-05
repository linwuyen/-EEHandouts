"""One-time data transport. Never include this script or its branch in production."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess

BASE = '36abe27f619bcb39397913ada3fb1832ca49ca6b'
BASE_TREE = '953d0f82eb1f0cf03dfe59a299ca55938a838c6d'
SOURCE = '11ef4e4801b5283f265dc349a4afec0027603228'
TREE = 'f6421150139936fe4134624d8f33013548599e49'
DIGEST = 'd2a81c2db77d796409e75375b5d6dd5573ca769f938eaa700938a2188bd0e50c'
root = Path.cwd()
product, source = root / 'product', root / 'source'

def git(directory, *args):
    return subprocess.check_output(['git', '-C', str(directory), *args], text=True).strip()

def digest(data):
    return hashlib.sha256(data).hexdigest()

def safe(directory, name):
    p = Path(name)
    assert p.parts and not p.is_absolute() and '..' not in p.parts
    assert p.parts[0] not in ('.git', '.github', '.migration-adc')
    resolved = (directory / p).resolve()
    assert resolved.is_relative_to(directory.resolve())
    return resolved

assert git(product, 'rev-parse', 'HEAD') == BASE
assert git(product, 'rev-parse', 'HEAD^{tree}') == BASE_TREE
assert git(source, 'rev-parse', 'HEAD') == SOURCE
assert not git(product, 'status', '--porcelain')
parts = sorted((root / 'payload/.migration-adc').glob('data-??.b64'))
assert [p.name for p in parts] == [f'data-{i:02d}.b64' for i in range(9)]
encoded = ''.join(p.read_text(encoding='ascii').strip() for p in parts)
assert len(encoded) == 18364
packed = base64.b64decode(encoded, validate=True)
assert len(packed) == 13772 and digest(packed) == DIGEST
recipe = json.loads(gzip.decompress(packed))
assert (recipe['base'], recipe['baseTree'], recipe['source'], recipe['tree']) == (BASE, BASE_TREE, SOURCE, TREE)
assert len(recipe['files']) == 18 and len(recipe['seeds']) == 4
paths = [entry['path'] for entry in recipe['files']]
assert len(set(paths)) == 18
for seed in recipe['seeds']:
    src, dst = safe(source, seed['source']), safe(product, seed['path'])
    data = src.read_bytes()
    assert digest(data) == seed['sourceSha256'], seed['source']
    assert not dst.exists()
    if 'extract' in seed:
        assert seed['extract'] == 'calculator-script'
        match = re.search(r'<script>\s*((?:\(function\(\))[\s\S]*?)</script>', data.decode('utf-8'))
        assert match
        data = (match.group(1).rstrip() + '\n').encode('utf-8')
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(data)
for entry in recipe['files']:
    dst = safe(product, entry['path'])
    data = dst.read_bytes() if dst.exists() else b''
    assert digest(data) == entry['before'], entry['path']
    text = data.decode('utf-8')
    limit = len(text)
    for start, end, replacement in reversed(entry['edits']):
        assert 0 <= start <= end <= limit
        text = text[:start] + replacement + text[end:]
        limit = start
    data = text.encode('utf-8')
    assert digest(data) == entry['after'], entry['path']
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(data)
git(product, 'add', '--all')
git(product, 'diff', '--cached', '--check')
assert git(product, 'write-tree') == TREE
(root / 'submission-tree.txt').write_text(TREE + '\n')
print('Verified base/source SHAs, compressed recipe SHA256, all file hashes and exact tree:', TREE)
