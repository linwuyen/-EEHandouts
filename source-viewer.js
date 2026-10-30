/* Browser-local source PDF viewer.
   Uses Mozilla PDF.js 4.10.38 for actual page parsing/rendering.
   The selected PDF stays in browser storage; no PDF file bytes are uploaded.
*/
(function () {
  'use strict';
  var CFG=window.EE_SOURCE_CONFIG||{};
  var DB_NAME='eehandouts-source-pdf', STORE='source', KEY=CFG.key||'upper-volume-r2';
  var pageCount=Number(CFG.pageCount)||107;
  var sourceLabel=CFG.label||'電力電子初級班講義（上）R2';
  var middle=pageCount===52;
  var referencePage=middle?37:24;
  var PDF_ASSET_BASE='./vendor/pdfjs/'; // Pinned, npm SHA-512-verified build assets on the site's own origin.
  var pdfLibraryPromise=null, documentProxy=null, selectedBlob=null, selectedName='';
  var currentPage=1, mountTarget=null, cacheAttempted=false, loadVersion=0, renderVersion=0, loadedFromCache=false;
  var storageQueue=Promise.resolve();
  function queueStorage(action,value,epoch){
    var operation=storageQueue.then(function(){
      if(action==='put'&&epoch!==loadVersion)return null;
      return localStore(action,value);
    });
    storageQueue=operation.catch(function(){});
    return operation;
  }

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
      pdfLibraryPromise=import(PDF_ASSET_BASE+'pdf.min.mjs').then(function(lib){
        lib.GlobalWorkerOptions.workerSrc=PDF_ASSET_BASE+'pdf.worker.min.mjs';
        return lib;
      }).catch(function(err){
        pdfLibraryPromise=null;
        throw new Error('本機 PDF 解析元件無法載入（需先建置 vendor/pdfjs 資產）：'+err.message);
      });
    }
    return pdfLibraryPromise;
  }
  async function verifyPdf(file){
    if(!(file instanceof Blob)||file.size<100||file.size>50*1024*1024)throw new Error('請選擇 100 bytes–50 MB 的 PDF');
    if(await file.slice(0,5).text()!=='%PDF-')throw new Error('檔案不是 PDF');
    var lib=await pdfLibrary(),task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
    var pdf=await task.promise;
    try{
      if(pdf.numPages!==pageCount)throw new Error('頁數不符：目前 '+pdf.numPages+' 頁，'+sourceLabel+' 必須是 '+pageCount+' 頁');
      if(middle){
        // Nine independent chapter anchors from the original 52-page source.
        // "Converter" alone is too generic to establish this is the user's booklet.
        // The normalized text removes whitespace, so match the slide-specific terms.
        var anchorsMiddle=[
          [1,/dc.?dcconverters?/i],
          [2,/basictopologiesofswitching.?mode|buckconverter.*boostconverter/i],
          [7,/operationmodes|continuousconductionmode.*discontinuousconductionmode/i],
          [10,/boostconverter/i],
          [23,/buck.?boostconverter/i],
          [33,/withisolation|dc.?dcconverterswithisolation/i],
          [37,/flybackconverter/i],
          [41,/forwardconverter/i],
          [51,/coreloss|b.?hcurve|鐵損曲線/i]
        ];
        var failedMiddle=[];
        for(var n=0;n<anchorsMiddle.length;n++){
          var target=anchorsMiddle[n],middlePage=await pdf.getPage(target[0]);
          var middleText=normalizeText((await middlePage.getTextContent()).items.map(function(x){return x.str||''}).join(''));
          if(!target[1].test(middleText))failedMiddle.push(target[0]);
        }
        if(failedMiddle.length){
          throw new Error('中冊標題識別不符：第 '+failedMiddle.join('、')+' 頁缺少對應章節特徵。請確認 PDF 是中冊原講義的可搜尋文字匯出檔。');
        }
      }else{
        // Exact known 107-page upper-volume export; independently re-exported PDFs require nine anchors.
        var sourceHash='9cf8f8e2c4ac0876414b29eca7d2ef47f00a2b66dbead96a25abb5b1609280c1',exact=false;
        if(window.crypto&&window.crypto.subtle){
          var digest=await window.crypto.subtle.digest('SHA-256',await file.arrayBuffer());
          var hex=Array.from(new Uint8Array(digest)).map(function(v){return v.toString(16).padStart(2,'0')}).join('');
          exact=(hex===sourceHash);
        }
        if(!exact){
          var anchors=[[1,/電力電子|powerelectronics/i],[2,/thd|傅立葉|功因/i],
            [12,/安培|ampere/i],[24,/變壓器|transformer/i],
            [27,/功率半導體|powersemiconductor/i],[59,/電力電子系統|powerelectronicssystem/i],
            [97,/op|operationalamplifier/i],[106,/adc/i],[107,/thankyou|謝謝/i]];
          var failed=[];
          for(var k=0;k<anchors.length;k++){
            var pg=anchors[k][0],part=await pdf.getPage(pg);
            var text=normalizeText((await part.getTextContent()).items.map(function(x){return x.str||''}).join(''));
            if(!anchors[k][1].test(text))failed.push(pg);
          }
          if(failed.length)throw new Error('內容識別不符：原講義第 '+failed.join('、')+' 頁不符合課程文字特徵。');
        }
      }
      return pdf;
    }catch(err){await pdf.destroy();throw err}
  }
  function html(){
    var yes=!!documentProxy;
    return '<section class="source-pdf-panel">'+
      '<div class="source-pdf-top"><div><h3>原始投影片 PDF 對照</h3><p>先驗證 '+pageCount+' 頁和內容特徵，再顯示第 '+currentPage+' 頁的原始圖文。PDF 只留在瀏覽器本機。</p></div>'+
      '<label class="btn btn-primary source-pdf-picker" for="source-pdf-file">'+(yes?'更換 PDF':'載入原始講義 PDF')+'</label><input id="source-pdf-file" type="file" class="sr-only" accept="application/pdf,.pdf"></div>'+
      '<div id="source-pdf-feedback" class="source-pdf-feedback" role="status" aria-live="polite">'+
      (yes?'已驗證 '+pageCount+' 頁及來源內容特徵：'+e(selectedName):'尚未驗證原始 PDF，請先載入講義檔案。')+'</div>'+
      (yes?
        '<div class="source-pdf-canvas-wrap"><canvas id="source-pdf-canvas" role="img" aria-label="原始講義第 '+currentPage+' 頁 PDF 圖文"></canvas></div>'+
        '<div class="source-pdf-actions"><button class="btn btn-muted" type="button" id="source-pdf-remove">清除這台裝置的 PDF</button></div>':
        '<div class="source-pdf-placeholder"><div class="source-pdf-symbol">▧</div><strong>等待載入已驗證的 '+pageCount+' 頁講義</strong><p>本檢視器會檢查頁數與課程文字特徵，確認後才能顯示 PDF 原圖。</p></div>')+
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
    feedback('正在呈現原講義第 '+pg+'／'+pageCount+' 頁…',false);
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
        feedback('已驗證講義：第 '+pg+'／'+pageCount+' 頁 · '+selectedName+(loadedFromCache?'（從本機儲存恢復）':''),false);
        root.dispatchEvent(new CustomEvent('eehandouts-pdf-page-rendered',{bubbles:true,detail:{page:pg,total:pageCount}}));
      }
    }catch(err){
      if(seq===renderVersion)feedback('PDF 第 '+pg+' 頁呈現失敗：'+err.message,true);
    }
  }
  async function adopt(file,name,fromCache){
    var seq=++loadVersion;
    feedback('檢查 PDF 格式、'+pageCount+' 頁及講義內容中…',false);
    var newDocument;
    try{
      newDocument=await verifyPdf(file);
      if(seq!==loadVersion){await newDocument.destroy();return}
      var old=documentProxy;
      documentProxy=newDocument;selectedBlob=file;selectedName=name||'原始講義.pdf';loadedFromCache=!!fromCache;
      if(old){renderVersion++;await old.destroy()}
      if(mountTarget&&mountTarget.isConnected){mountTarget.innerHTML=html();await renderCurrent()}
      if(seq!==loadVersion||newDocument!==documentProxy)return;
      if(!fromCache){
        try{await queueStorage('put',{file:file,name:selectedName},seq)}
        catch(err){if(seq===loadVersion)feedback('已顯示原講義，但無法永久儲存：'+err.message,true)}
      }
    }catch(err){
      if(seq===loadVersion){
        feedback('檔案未接受：'+err.message,true);
        if(fromCache)queueStorage('delete').catch(function(){});
      }
    }
  }
  function mount(el,page){
    currentPage=Math.min(pageCount,Math.max(1,Math.floor(Number(page)||1)));
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
    var deleting=queueStorage('delete');
    try{if(old)await old.destroy()}catch(err){}
    try{await deleting}catch(err){feedback('PDF 已從目前畫面清除，但本機儲存未能刪除：'+err.message,true)}
  });
  window.EE_SOURCE_PDF={mount:mount};
})();