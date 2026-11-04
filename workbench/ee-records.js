/* Read-only export: never calls Evidence.load/save/migrate on an unknown version. */
(()=>{
 'use strict';const keys=['circuit-learning-state-v5','circuit-learning-state-v4','circuit-learning-state-v3','circuit-learning-state-v2','circuit-core-flow-v1'];
 const $=id=>document.getElementById(id);let snapshot={};
 function capture(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(keys.includes(k)||k.startsWith('circuit-learning-state-')||k.startsWith('circuit-core-flow-'))out[k]=localStorage.getItem(k);}return out;}
 function download(value,name){const u=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 try{snapshot=capture();$('record-status').textContent='已讀取 '+Object.keys(snapshot).length+' 個儲存項目；沒有修改原資料。';$('record-summary').textContent=Object.keys(snapshot).map(k=>k+'（'+snapshot[k].length+' 字元）').join('\n')||'目前沒有已存實驗紀錄。';
  let state;try{state=JSON.parse(snapshot['circuit-learning-state-v5']);}catch{}
  if(state?.schema==='circuit-learning-state'&&state.version===5){$('ee-export-v5').hidden=false;$('ee-export-v5').onclick=()=>{const now=JSON.parse(capture()['circuit-learning-state-v5']);if(now?.schema!=='circuit-learning-state'||now.version!==5){$('record-status').textContent='紀錄版本已變動；請改用原始備份。';return;}const raw=capture(),backup=structuredClone(now);backup.auxiliary={};if(raw['circuit-core-flow-v1'])backup.auxiliary.coreFlow=JSON.parse(raw['circuit-core-flow-v1']);download(backup,'eehandouts-learning-backup-v5.json');};}
 }catch(error){$('record-status').textContent='無法讀取瀏覽器儲存：'+error.message;}
 $('ee-export-raw').onclick=()=>{try{download({format:'eehandouts-raw-storage-backup-v1',values:capture()},'eehandouts-raw-learning-backup.json');}catch(error){$('record-status').textContent='備份失敗：'+error.message;}};
})();
