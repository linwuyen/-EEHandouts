/* Browser-local source PDF viewer.
   Uses Mozilla PDF.js 4.10.38 for actual page parsing/rendering.
   The selected PDF stays in browser storage; no PDF file bytes are uploaded.
*/
(function () {
  'use strict';
  var DB_NAME='eehandouts-source-pdf', STORE='source', KEY='upper-volume-r2';
  var CDN='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/';
  var pdfLibraryPromise=null, documentProxy=null, selectedBlob=null, selectedName='';
  var currentPage=1, mountTarget=null, cacheAttempted=false, loadVersion=0, renderVersion=0, loadedFromCache=false;

  function e(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function normalizeText(t){return String(t||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase()}
  function db(){
    return new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){reject(new Error('此瀏覽器不支援 IndexedDB'));return}
      var req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=function(){if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
      req.onerror=function(){reject(req.error||new Error('無法開啟本機資料庫'))};
      req.onsuccess=function(){resolve(req.result)};
    });
  }
  async function localStore(action,value){
    var database=await db();
    return new Promise(function(resolve,reject){
      var tx=database.transaction(STORE,action==='get'?'readonly':'readwrite'),object=tx.objectStore(STORE);
      var req=action==='get'?object.get(KEY):action==='put'?object.put(value,KEY):object.delete(KEY);
      req.onsuccess=function(){resolve(req.result||null)};
      req.onerror=function(){reject(req.error||new Error('本機儲存失敗'))};
      tx.oncomplete=function(){database.close()};
      tx.onerror=function(){database.close()};
    });
  }
  function pdfLibrary(){
    if(!pdfLibraryPromise){
      pdfLibraryPromise=import(CDN+'pdf.min.mjs').then(function(lib){
        lib.GlobalWorkerOptions.workerSrc=CDN+'pdf.worker.min.mjs';
        return lib;
      }).catch(function(err){
        pdfLibraryPromise=null;
        throw new Error('PDF 解析元件無法載入（需要連上 cdnjs）：'+err.message);
      });
    }
    return pdfLibraryPromise;
  }
  async function verifyPdf(file){
    if(!(file instanceof Blob) || file.size<100 || file.size>50*1024*1024){
      throw new Error('請選擇 100 bytes–50 MB 的 PDF 檔案');
    }
    if(await file.slice(0,5).text()!=='%PDF-')throw new Error('選取的檔案不是 PDF');
    var lib=await pdfLibrary(),task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
    var pdf=await task.promise;
    try{
      if(pdf.numPages!==107)throw new Error('頁數不符：目前 '+pdf.numPages+' 頁，這份上冊必須是 107 頁');
      var first=await pdf.getPage(1),reference=await pdf.getPage(24);
      var firstText=normalizeText((await first.getTextContent()).items.map(function(x){return x.str||''}).join(''));
      var referenceText=normalizeText((await reference.getTextContent()).items.map(function(x){return x.str||''}).join(''));
      // The reference PDF is a PPTX export with searchable Chinese headings.
      // Do not silently accept an arbitrary document that happens to have 107 pages.
      var coverOK=/電力電子|powerelectronics/i.test(firstText);
      var page24OK=/變壓器|transformer/i.test(referenceText);
      if(!coverOK || !page24OK){
        throw new Error('頁數正確，但內容識別不符：需要首頁「電力電子學」與第 24 頁「變壓器」相關標題。掃描版或不同講義請先轉成可搜尋文字的本課程 PDF。');
      }
      return pdf;
    }catch(err){await pdf.destroy();throw err}
  }
  function html(){
    var yes=!!documentProxy;
    return '<section class="source-pdf-panel">'+
      '<div class="source-pdf-top"><div><h3>原始投影片 PDF 對照</h3><p>先驗證 107 頁和內容，再直接顯示第 '+currentPage+' 頁的原始圖文。PDF 只留在瀏覽器本機。</p></div>'+
      '<label class="btn btn-primary source-pdf-picker" for="source-pdf-file">'+(yes?'更換 PDF':'載入原始講義 PDF')+'</label><input id="source-pdf-file" type="file" class="sr-only" accept="application/pdf,.pdf"></div>'+
      '<div id="source-pdf-feedback" class="source-pdf-feedback" role="status" aria-live="polite">'+
      (yes?'已核對 107 頁及首頁／第 24 頁標題：'+e(selectedName):'尚未驗證原始 PDF，請先載入講義檔案。')+'</div>'+
      (yes?
        '<div class="source-pdf-canvas-wrap"><canvas id="source-pdf-canvas" role="img" aria-label="原始講義第 '+currentPage+' 頁 PDF 圖文"></canvas></div>'+
        '<div class="source-pdf-actions"><button class="btn btn-muted" type="button" id="source-pdf-remove">清除這台裝置的 PDF</button></div>':
        '<div class="source-pdf-placeholder"><div class="source-pdf-symbol">▧</div><strong>等待載入已驗證的 107 頁講義</strong><p>本檢視器會檢查實際頁數及部分講義標題，確認後才能顯示 PDF 原圖。</p></div>')+
      '</section>';
  }
  function feedback(message,isError){
    if(!mountTarget||!mountTarget.isConnected)return;
    var node=mountTarget.querySelector('#source-pdf-feedback');
    if(node){node.textContent=message;node.classList.toggle('error',!!isError)}
  }
  async function renderCurrent(){
    var seq=++renderVersion,root=mountTarget,doc=documentProxy,pg=currentPage;
    if(!root||!root.isConnected||!doc)return;
    var canvas=root.querySelector('#source-pdf-canvas');
    if(!canvas)return;
    feedback('正在呈現原講義第 '+pg+'／107 頁…',false);
    try{
      var page=await doc.getPage(pg);
      if(seq!==renderVersion || root!==mountTarget || doc!==documentProxy)return;
      var width=Math.max(260,Math.min(920,root.clientWidth-36));
      var basis=page.getViewport({scale:1}),scale=width/basis.width;
      var pixelRatio=Math.min(2,window.devicePixelRatio||1);
      var viewport=page.getViewport({scale:scale*pixelRatio});
      canvas.width=Math.round(viewport.width);
      canvas.height=Math.round(viewport.height);
      canvas.style.width=(viewport.width/pixelRatio)+'px';
      canvas.style.height=(viewport.height/pixelRatio)+'px';
      var ctx=canvas.getContext('2d',{alpha:false});
      await page.render({canvasContext:ctx,viewport:viewport}).promise;
      if(seq===renderVersion && root===mountTarget && doc===documentProxy){
        feedback('已驗證講義：第 '+pg+'／107 頁 · '+selectedName+(loadedFromCache?'（從本機儲存恢復）':''),false);
        root.dispatchEvent(new CustomEvent('eehandouts-pdf-page-rendered',{bubbles:true,detail:{page:pg,total:107}}));
      }
    }catch(err){
      if(seq===renderVersion)feedback('PDF 第 '+pg+' 頁呈現失敗：'+err.message,true);
    }
  }
  async function adopt(file,name,fromCache){
    var seq=++loadVersion;
    feedback('檢查 PDF 格式、107 頁及講義內容中…',false);
    var newDocument;
    try{
      newDocument=await verifyPdf(file);
      if(seq!==loadVersion){await newDocument.destroy();return}
      var old=documentProxy;
      documentProxy=newDocument;selectedBlob=file;selectedName=name||'原始講義.pdf';loadedFromCache=!!fromCache;
      if(old){renderVersion++;await old.destroy()}
      if(mountTarget&&mountTarget.isConnected){mountTarget.innerHTML=html();await renderCurrent()}
      if(!fromCache){
        try{await localStore('put',{file:file,name:selectedName})}
        catch(err){feedback('已顯示原講義，但無法永久儲存：'+err.message,true)}
      }
    }catch(err){if(seq===loadVersion)feedback('檔案未接受：'+err.message,true)}
  }
  function mount(el,page){
    currentPage=Math.min(107,Math.max(1,Math.floor(Number(page)||1)));
    mountTarget=el;renderVersion++;
    if(!el)return;
    el.innerHTML=html();
    if(documentProxy){renderCurrent();return}
    if(!cacheAttempted){
      cacheAttempted=true;
      // If user imports a new file while cache is being restored, that choice wins.
      var seq=loadVersion;
      localStore('get').then(function(data){
        if(data&&data.file instanceof Blob && seq===loadVersion)adopt(data.file,data.name,true);
      }).catch(function(){/* continue without persistence; manual upload remains available */});
    }
  }
  document.addEventListener('change',function(ev){
    if(ev.target && ev.target.id==='source-pdf-file'){
      var file=ev.target.files&&ev.target.files[0];
      if(file)adopt(file,file.name,false);
    }
  });
  document.addEventListener('click',async function(ev){
    if(!ev.target || ev.target.id!=='source-pdf-remove')return;
    ++loadVersion;++renderVersion;
    var old=documentProxy;documentProxy=null;selectedBlob=null;selectedName='';loadedFromCache=false;
    if(mountTarget&&mountTarget.isConnected)mountTarget.innerHTML=html();
    if(old)await old.destroy();
    try{await localStore('delete')}catch(err){feedback('PDF 已從目前畫面清除，但本機儲存未能刪除：'+err.message,true)}
  });
  window.EE_SOURCE_PDF={mount:mount};
})();