import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../workbench/',import.meta.url));
const files=JSON.parse(readFileSync(new URL('../workbench/source-manifest.json',import.meta.url))).testFiles;
if(!files.length||files.some(f=>!/^tests\/[a-z0-9-]+\.test\.mjs$/.test(f)))throw Error('Invalid source test manifest');
const r=spawnSync(process.execPath,['--test',...files],{cwd,stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
