/* Local-first original slide PDF viewer. The selected PDF never leaves the user's browser. */
(function(){
  'use strict';
  var CFG=window.EE_SOURCE_CONFIG||{};
  var DB_NAME='eehandouts-source-pdf',STORE='source',KEY=CFG.key||'upper-volume-r2';
  var pageCount=Number(CFG.pageCount)||107;
  var label=CFG.label||'電力電子初級班講義（上）R2';
  var blob=null,blobUrl=null,filename='',loading=null,currentPage=1,mountTarget=null;
  function e(s){return String(s).replace(/[&<>"']/g,function(k){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]})}
  function db(){
    return new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){reject(new Error('此瀏覽器不支援 IndexedDB'));return}
      var req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=function(){if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
      req.onerror=function(){reject(req.error||new Error('無法開啟本機資料庫'))};
      req.onsuccess=function(){resolve(req.result)};
    });
  }
  async function readCached(){
    var database=await db();
    return new Promise(function(resolve,reject){
      var t=database.transaction(STORE,'readonly'),r=t.objectStore(STORE).get(KEY);
      r.onsuccess=function(){resolve(r.result||null)};
      r.onerror=function(){reject(r.error)};
      t.oncomplete=function(){database.close()};
    });
  }
  async function writeCached(value){
    var database=await db();
    return new Promise(function(resolve,reject){
      var t=database.transaction(STORE,'readwrite');
      t.objectStore(STORE).put(value,KEY);
      t.oncomplete=function(){database.close();resolve()};
      t.onerror=function(){reject(t.error)};
    });
  }
  async function clearCached(){
    var database=await db();
    return new Promise(function(resolve,reject){
      var t=database.transaction(STORE,'readwrite');
      t.objectStore(STORE).delete(KEY);
      t.oncomplete=function(){database.close();resolve()};
      t.onerror=function(){reject(t.error)};
    });
  }
  function setBlob(file,name){
    if(blobUrl)URL.revokeObjectURL(blobUrl);
    blob=file;filename=name||'原始講義.pdf';
    blobUrl=URL.createObjectURL(file);
  }
  function html(){
    var yes=!!blob;
    return '<div class="source-pdf-panel">'+
      '<div class="source-pdf-top"><div><h3>原始投影片 PDF 對照</h3><p>選取講義 PDF 後，可以在本站直接看第 '+currentPage+' 頁的原始電路圖與公式。檔案只存放在你的瀏覽器，不會上傳。</p></div>'+
      '<label class="btn btn-primary source-pdf-picker" for="source-pdf-file">'+(yes?'更換 PDF':'載入原始講義 PDF')+'</label><input type="file" id="source-pdf-file" class="sr-only" accept=".pdf,application/pdf"></div>'+
      '<div id="source-pdf-feedback" class="source-pdf-feedback" aria-live="polite">'+(yes?'已載入：'+e(filename)+'（這台裝置）':'尚未載入 PDF；先使用下方的「原講義抽取文字」閱讀。')+'</div>'+
      (yes?'<div class="source-pdf-frame-wrap"><iframe title="原講義第 '+currentPage+' 頁" id="source-pdf-frame" src="'+e(blobUrl+'#page='+currentPage+'&zoom=page-width')+'" loading="lazy" referrerpolicy="no-referrer"></iframe></div><div class="source-pdf-actions"><a class="btn" href="'+e(blobUrl)+'" target="_blank" rel="noopener">獨立開啟 PDF</a><button type="button" class="btn btn-muted" id="source-pdf-remove">清除這台裝置儲存的 PDF</button></div>':
      '<div class="source-pdf-placeholder"><div class="source-pdf-symbol">▧</div><strong>尚無原始圖文</strong><p>載入《'+e(label)+'》的 '+pageCount+' 頁 PDF，即可逐頁查看原始投影片。</p></div>')+
      '</div>';
  }
  function update(){if(mountTarget&&mountTarget.isConnected)mountTarget.innerHTML=html()}
  function mount(el,page){
    mountTarget=el;currentPage=Math.max(1,Math.min(pageCount,Number(page)||1));if(!el)return;
    el.innerHTML=html();
    if(!blob&&loading===null){
      loading=readCached().then(function(data){if(data&&data.file instanceof Blob)setBlob(data.file,data.name);update()}).catch(function(){/* browsing without persistent storage remains supported */}).finally(function(){loading=false});
    }
  }
  document.addEventListener('change',async function(ev){
    if(!ev.target||ev.target.id!=='source-pdf-file')return;
    var file=ev.target.files&&ev.target.files[0];if(!file)return;
    if(file.size>50*1024*1024||file.size<100){alert('請選擇 50 MB 以下的有效 PDF。');return}
    try{
      var magic=await file.slice(0,5).text();
      if(magic!=='%PDF-'){alert('選取的檔案不是有效的 PDF，請先把 PPTX 匯出成 PDF。');return}
      setBlob(file,file.name);update();
      try{await writeCached({file:file,name:file.name})}catch(err){
        var tip=document.getElementById('source-pdf-feedback');
        if(tip)tip.textContent='已載入 PDF，但無法永久儲存；重新開啟網站後可能需要再選一次。';
      }
    }catch(err){alert('載入 PDF 失敗：'+err.message)}
  });
  document.addEventListener('click',async function(ev){
    if(!ev.target||ev.target.id!=='source-pdf-remove')return;
    if(blobUrl)URL.revokeObjectURL(blobUrl);
    blob=null;blobUrl=null;filename='';update();
    try{await clearCached()}catch(err){}
  });
  window.addEventListener('beforeunload',function(){if(blobUrl)URL.revokeObjectURL(blobUrl)});
  window.EE_SOURCE_PDF={mount:mount};
})();