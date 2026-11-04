#!/usr/bin/env python3
"""One-time local-source import, NOT a build dependency. Never downloads sources."""
from pathlib import Path
import argparse,hashlib,json,re,shutil
P=argparse.ArgumentParser();P.add_argument('source',type=Path);P.add_argument('--target',type=Path,default=Path(__file__).resolve().parents[1]);a=P.parse_args()
s=a.source.resolve();d=a.target.resolve()/'workbench';d.mkdir(exist_ok=True)
sha='11ef4e4801b5283f265dc349a4afec0027603228'
# Complete runtime dependency closure for the current eight-step Buck route.
html=(s/'index.html').read_text()
roots=set(re.findall(r'<script src="([^"]+)"',html))
roots-= {'assets/learning/workspace-ui.js','assets/learning/workspace-topology-ui.js'}
roots.update('assets/learning/'+n for n in ['workspace.css','workbench-context.css','curriculum.js','opamp-module.js','power-firmware-modules.js','control-transforms-module.js','power-topology-control-module.js','control-unification-module.js','curriculum-schema-v3.js','engineering-models.js','engineering-context.js','model-contracts-v1.json'])
tests=['continuous-course','continuous-kernel','experiment-causal-readout','switching-lesson-v1','evidence-concurrency','evidence-v4','core-flow','plain-course','workspace','kernel-event-accuracy','engineering-context','beginner-causal-guides']
roots.update('tests/'+n+'.test.mjs' for n in tests)
files={};pending=list(roots)
while pending:
 p=pending.pop()
 if p in files:continue
 src=s/p
 if not src.is_file():raise SystemExit('Missing source dependency: '+p)
 b=src.read_bytes();files[p]=b
 if src.suffix not in ('.js','.mjs','.css'):continue
 text=b.decode()
 # Static CJS/ES imports and URL-relative test fixtures (no runtime network).
 deps=re.findall(r'(?:require|nodeRequire)\([\'"](\.[^\'"]+)[\'"]\)',text)
 deps+=re.findall(r'from\s+[\'"](\.[^\'"]+)[\'"]',text)
 deps+=re.findall(r'new URL\([\'"](\.[^\'"]+)[\'"]\s*,\s*import.meta.url',text)
 for dep in deps:
  target=(src.parent/dep).resolve()
  if not target.is_relative_to(s):raise SystemExit('Dependency escapes source: '+dep)
  if target.is_file():pending.append(target.relative_to(s).as_posix())
# Include the named registry kernel; dynamic dispatch is preserved, not rewritten.
assert 'assets/engineering-sandbox-core.js' in files

def once(text,old,new):
 if text.count(old)!=1:raise SystemExit('Source contract drift: '+old[:100])
 return text.replace(old,new)
lock=json.loads((a.target/'scripts/circuit-buck-source-lock.json').read_text())
assert lock['commit']==sha
for p,b in {**files,'index.html':(s/'index.html').read_bytes()}.items():
 actual=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
 if lock['files'].get(p)!=actual:raise SystemExit('Pinned source changed: '+p)
assert set(lock['files'])==set(files)|{'index.html'}
ui='assets/learning/workspace-experiment-ui.js';t=files[ui].decode()
t=once(t,'function protectRecord(){','function protectRecord(){if(!EEWorkbenchHost.guardEvidence())return true;')
t=once(t,"link.href='map.html';","link.href='records.html';")
t=once(t,"const legacy=el('a','重看原有八課與作答',document.querySelector('footer'));legacy.href='index.html#duty';","// Legacy exercise records are retained; their pages are a later migration slice.")
t=once(t,"const transferLink=el('a','沿用條件，比較降壓與升壓',el('li',undefined,$('workspace-route')));transferLink.href='#topology';","const transferLink=el('a','後續遷移範圍：降壓／升壓與進階課程',el('li',undefined,$('workspace-route')));transferLink.href='coverage.html';transferLink.onclick=e=>{e.preventDefault();EEWorkbenchHost.leave('coverage.html');};")
t=once(t,'function reference(href,title){','function reference(href,title){if(window.EEWorkbenchHost){EEWorkbenchHost.reference(href,title);return;}')
t=once(t,"function recommendation(){if(saving)return;","function recommendation(){if(saving)return;if(window.EEWorkbenchHost){if(!EEWorkbenchHost.guardEvidence())return;EEWorkbenchHost.recommendation(U.next(E.load(),CircuitCoreFlowV1.snapshot()),$('resume-task'));return;}")
t=once(t,"else location.hash='topology';","else EEWorkbenchHost.complete();")
t=once(t,"if(!location.hash.startsWith('#experiment')){durableNavigate(()=>location.reload());return;}","if(!location.hash.startsWith('#experiment')){history.replaceState(null,'','#experiment-'+id);EEWorkbenchHost.notice('這個進階入口尚未遷入；目前實驗與既有紀錄仍保留。');return;}")
files[ui]=t.encode()
context='assets/learning/workbench-context.js';t=files[context].decode()
t=once(t,'function draw(){','function draw(){if(!root.EEWorkbenchHost.guardEvidence())return;')
t=once(t,"a.href=new URL(U.route(task,origin),base).href;return a;","a.href=root.EEWorkbenchHost.referenceHref(U.route(task,origin));a.onclick=event=>{event.preventDefault();root.EEWorkbenchHost.reference(U.route(task,origin),label);};return a;")
t=once(t,"if(next.remediation){resume.href=", "if(next.remediation&&!root.EEWorkbenchHost){resume.href=")
files[context]=t.encode()
# Leave original source document/IDs/circuit geometry in place. Only host navigation changes.
html=once(html,'<title>一台電路，一起學懂｜電子模擬工作台</title>','<title>Buck 連續實驗｜EEHandouts</title>')
html=once(html,'</head>','<link rel="stylesheet" href="ee-host.css"></head>')
html=once(html,'<body data-learning-workspace>','<body data-learning-workspace data-ee-workbench><nav class="ee-workbench-shell" aria-label="EEHandouts 教材導航"><strong>EEHandouts · Buck 連續實驗</strong><button type="button" id="ee-return">保存後返回 Buck 教材</button><a id="ee-records" href="records.html">紀錄與備份</a><p id="ee-host-status" role="status">正在載入本站實驗…</p></nav>')
html=html.replace('<script src="assets/learning/workspace-topology-ui.js"></script>','').replace('<script src="assets/learning/workspace-ui.js"></script>','<script src="ee-entry.js"></script>')
html=once(html,'<script src="assets/learning/learning-evidence.js">','<script src="ee-host.js"></script><script src="assets/learning/learning-evidence.js">')
html=html.replace('href="catalog.html"','href="../middle.html#lesson/mid-basics/mid-buck-pwm"').replace('href="teaching-review.html"','href="coverage.html"')
files['index.html']=html.encode()
manifest=[]
for p,b in sorted(files.items()):
 out=d/p;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(b)
 orig=(s/p).read_bytes()
 manifest.append({'path':p,'sourceBlob':hashlib.sha1(b'blob '+str(len(orig)).encode()+b'\0'+orig).hexdigest(),'sha256':hashlib.sha256(b).hexdigest(),'adapted':b!=orig})
(d/'source-manifest.json').write_text(json.dumps({'sourceRepository':'linwuyen/Circuit-Simulation','sourceCommit':sha,'scope':'Eight-step Buck experiment; not whole-project retirement','files':manifest,'testFiles':['tests/'+n+'.test.mjs' for n in tests]},ensure_ascii=False,indent=2)+'\n')
(d/'package.json').write_text('{"name":"eehandouts-buck-workbench","private":true,"type":"commonjs"}\n')
print('Imported',len(files),'source files;',sum(x['adapted'] for x in manifest),'navigation/document adaptations; numerical/evidence owners unchanged.')
