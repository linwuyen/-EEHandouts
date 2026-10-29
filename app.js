(function () {
  'use strict';
  var D=window.EE_DATA;
  var pageCount=Number(D&&D.pageCount)||107;
  var progressKey=D&&D.progressKey||'ee.done';
  var sourceText=window.EE_SOURCE_TEXT||{};
  var main=document.getElementById('main-content');
  if(!D||!D.chapters||!window.EE_LABS){main.textContent='課程資料未能載入。請重新整理頁面。';return}
  var flat=[],byId={};
  D.chapters.forEach(function(c){byId[c.id]=c;c.lessons.forEach(function(l){flat.push({chapter:c,lesson:l})})});
  var done=[];
  var theme='light';
  try{done=JSON.parse(localStorage.getItem(progressKey)||'[]');theme=localStorage.getItem('ee.theme')||'light'}catch(e){done=[]}
  if(!Array.isArray(done))done=[];
  var completed=new Set(done.filter(function(id){return flat.some(function(x){return x.lesson.id===id})}));
  var state={quiz:null,quickAnswer:{},searchItems:[],searchIndex:0,lastFocus:null};
  document.documentElement.dataset.theme=theme;
  var icons={wave:'∿',magnet:'⊗',pulse:'▥',chip:'▦',rectifier:'⇄',triphase:'△',signal:'⌁'};
  function $ (sel,root){return (root||document).querySelector(sel)}
  function escapeHTML(s){return String(s==null?'':s).replace(/[&<>"']/g,function(k){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]})}
  function e(s){return escapeHTML(s)}

  // Math notation comes from authored TeX, not fragile regex conversions of prose.
  // Original source text stays available for search and if the external renderer is unavailable.
  function formulaMarkup(lesson){
    var items=window.EE_MATH && window.EE_MATH[lesson.id];
    if(!Array.isArray(items)||items.length===0){
      return '<div class="formula-text formula-plain">'+e(lesson.formula)+'</div>';
    }
    return '<div class="equation-list" data-lesson-math="'+e(lesson.id)+'">'+
      items.map(function(item){
        return '<div class="equation-row"><div class="equation-label">'+e(item.label)+'</div>'+
          '<div class="equation-math" data-tex="'+e(item.tex)+'"></div></div>';
      }).join('')+
      '<div class="equation-original"><span>無法載入數學排版，顯示文字版本：</span><div>'+e(lesson.formula)+'</div></div></div>';
  }
  function typesetFormulas(){
    if(!window.katex)return;
    main.querySelectorAll('.equation-list').forEach(function(list){
      try{
        list.querySelectorAll('[data-tex]').forEach(function(el){
          window.katex.render(el.dataset.tex,el,{
            displayMode:true,throwOnError:true,trust:false,strict:'warn'
          });
        });
        list.classList.add('math-ready');
      }catch(err){
        // Preserve the readable original text rather than showing raw TeX or a broken expression.
        list.dataset.mathError='true';
        console.warn('Math typesetting failed for '+list.dataset.lessonMath,err);
      }
    });
  }

  function chapterPath(c){return '#chapter/'+c.id}
  function lessonPath(c,l){return '#lesson/'+c.id+'/'+l.id}
  function pct(a,b){return b?Math.round(100*a/b):0}
  function chapterDone(c){return c.lessons.filter(function(l){return completed.has(l.id)}).length}
  function route(){var s=decodeURIComponent(location.hash.slice(1)).replace(/^\/+/,'').split('/');return {type:s[0]||'home',id:s[1]||'',sub:s[2]||''}}
  function current(){var r=route(),c=byId[r.id],l=c&&c.lessons.find(function(x){return x.id===r.sub});return {r:r,c:c,l:l}}
  function pill(s){return '<span class="pill">'+e(s)+'</span>'}
  function buttonLink(url,label,active){return '<a class="btn '+(active?'btn-primary':'btn-muted')+'" href="'+e(url)+'">'+e(label)+'</a>'}
  function updateSidebar(r){
    $('#chapter-nav').innerHTML=D.chapters.map(function(c){var n=chapterDone(c);return '<a href="'+chapterPath(c)+'" class="side-chapter '+(r.id===c.id?'active ':'')+(n===c.lessons.length?'complete':'')+'" style="--c:'+c.accent+'"><span class="chapter-number">'+c.number+'</span><span class="chapter-name">'+e(c.short)+'</span><span class="chapter-state"></span></a>'}).join('');
    $('.side-home').classList.toggle('active',r.type==='home');
    $('.side-index').classList.toggle('active',r.type==='slides'&&r.id==='all'||r.type==='slide');
    $('#side-percent').textContent=pct(completed.size,flat.length)+'%';
    $('#side-progress-count').textContent=completed.size+' / '+flat.length+' 節完成';
    $('#side-progress-fill').style.width=pct(completed.size,flat.length)+'%';
  }
  function updateBreadcrumb(r,c,l){
    var html='<a href="#home">學習總覽</a>';
    if(c){html+='<span class="crumb-sep">/</span><a href="'+chapterPath(c)+'">'+e(c.short)+'</a>'}
    if(l)html+='<span class="crumb-sep">/</span><strong>'+e(l.title)+'</strong>';
    if(c&&r.type==='slides')html+='<span class="crumb-sep">/</span><strong>講義索引</strong>';
    if(c&&r.type==='quiz')html+='<span class="crumb-sep">/</span><strong>小測驗</strong>';
    if(r.type==='slides'&&r.id==='all')html+='<span class="crumb-sep">/</span><strong>全 '+pageCount+' 頁索引</strong>';
    if(r.type==='slide')html+='<span class="crumb-sep">/</span><a href="#slides/all">全講義索引</a><span class="crumb-sep">/</span><strong>第 '+Number(r.id)+' 頁</strong>';
    $('#breadcrumb').innerHTML=html;
  }
  function home(){
    var next=flat.find(function(x){return !completed.has(x.lesson.id)})||flat[0];
    var cards=D.chapters.map(function(c){
      var n=chapterDone(c),p=pct(n,c.lessons.length);
      return '<a class="subject-card" href="'+chapterPath(c)+'" style="--c:'+c.accent+'"><div class="card-top"><span class="subject-icon">'+icons[c.icon]+'</span><span class="card-index">CH '+c.number+'</span></div><h3>'+e(c.title)+'</h3><p>'+e(c.subtitle)+'</p><div class="card-bottom"><span>P.'+c.range[0]+'–'+c.range[1]+'　·　'+c.lessons.length+' 節　·　完成 '+n+'</span><span class="card-arrow">↗</span></div><div class="mini-track"><span style="width:'+p+'%"></span></div></a>';
    }).join('');
    return '<section class="hero"><div class="hero-decoration"></div><div class="hero-copy"><div class="hero-kicker">POWER ELECTRONICS · LEARNING HUB</div><h1>把電力電子，<br>學成真正能用的知識。</h1><p>'+e(D.heroDescription||'從物理、磁性元件、功率開關，到 PFC、整流與 MCU 量測。想看哪一章就看哪一章。')+'</p><a class="hero-cta" href="'+lessonPath(next.chapter,next.lesson)+'">接著學習 →</a><div class="hero-stats"><div class="hero-stat"><strong>07</strong><span>大主題</span></div><div class="hero-stat"><strong>'+flat.length+'</strong><span>觀念小節</span></div><div class="hero-stat"><strong>'+pageCount+'</strong><span>講義頁碼</span></div><div class="hero-stat"><strong>'+pct(completed.size,flat.length)+'%</strong><span>完成進度</span></div></div></div></section>'+
      '<div class="section-title"><h2>選一個你想學的主題</h2><a class="text-link" href="#slides/all">或瀏覽原講義 '+pageCount+' 頁 →</a></div><div class="subject-grid">'+cards+'</div>'+
      '<div class="secondary-panels"><div class="panel continue-panel"><span class="continue-orb">↗</span><div><h3>接著學：'+e(next.chapter.short)+'</h3><p>'+e(next.lesson.title)+'</p><a class="text-link" href="'+lessonPath(next.chapter,next.lesson)+'">開啟這一節 →</a></div></div><div class="panel tip-panel"><h3>閱讀方式</h3><p>先看物理現象，再看公式與工程條件。每章有實驗與小測驗，學習記錄保存在這台裝置的瀏覽器。</p></div></div>';
  }
  function chapter(c){
    var n=chapterDone(c);
    var goals=c.goals.map(function(g){return '<div class="objective"><span>✓</span>'+e(g)+'</div>'}).join('');
    var list=c.lessons.map(function(l,i){var read=completed.has(l.id);return '<a href="'+lessonPath(c,l)+'" class="lesson-row '+(read?'done':'')+'"><span class="lesson-n">'+(read?'✓':String(i+1).padStart(2,'0'))+'</span><div><h3>'+e(l.title)+'</h3><p>'+e(l.lead)+' · P.'+e(l.pages)+'</p></div><span class="lesson-state">'+(read?'已完成':'閱讀')+'</span><span class="row-arrow">›</span></a>'}).join('');
    var first=c.lessons.find(function(l){return !completed.has(l.id)})||c.lessons[0];
    return '<div style="--c:'+c.accent+'"><section class="chapter-hero"><div class="chapter-heading"><span class="chapter-badge">'+icons[c.icon]+'</span><div><span class="chapter-number-label">CHAPTER '+c.number+' · P.'+c.range[0]+'–'+c.range[1]+'</span><h1>'+e(c.title)+'</h1><p>'+e(c.subtitle)+'</p></div></div><div class="chapter-meta">'+pill(c.lessons.length+' 個學習小節')+pill('約 '+c.minutes+' 分鐘')+pill('已學 '+n+'/'+c.lessons.length)+'</div><div class="chapter-actions">'+buttonLink(lessonPath(c,first),'開始／繼續學習 →',true)+buttonLink('#slides/'+c.id,'講義頁碼索引')+buttonLink('#quiz/'+c.id,'章末測驗')+'</div><div class="mini-track" style="margin-top:22px"><span style="width:'+pct(n,c.lessons.length)+'%;background:var(--c)"></span></div></section><div class="objectives">'+goals+'</div><div class="subhead"><h2>本章學習路線</h2><span class="muted">自由選讀 · '+c.lessons.length+' 節</span></div><div class="lesson-list">'+list+'</div><div class="subhead"><h2>互動工程小實驗</h2><span class="muted">即時計算 · 可調參數</span></div><div id="lab-holder"></div></div>';
  }
  function quick(l){
    var selected=state.quickAnswer[l.id];
    var buttons=l.quiz.choices.map(function(choice,i){
      var mark=selected===undefined?'':(i===l.quiz.correct?'correct':i===selected?'wrong':'');
      return '<button type="button" class="quiz-choice '+mark+'" data-action="quick" data-index="'+i+'" '+(selected===undefined?'':'disabled')+'><span class="choice-letter">'+String.fromCharCode(65+i)+'</span>'+e(choice)+'</button>';
    }).join('');
    return '<div class="quiz-prompt">'+e(l.quiz.q)+'</div><div class="quiz-choices">'+buttons+'</div>'+(selected===undefined?'':'<div class="quiz-feedback"><strong>'+(selected===l.quiz.correct?'答對了':'再確認一次')+'</strong><div>'+e(l.quiz.reason)+'</div></div>');
  }
  function lesson(c,l){
    var idx=flat.findIndex(function(x){return x.lesson.id===l.id}),prev=flat[idx-1],next=flat[idx+1];
    return '<div class="lesson-layout" style="--c:'+c.accent+'"><a class="back-link" href="'+chapterPath(c)+'">← 返回 '+e(c.short)+'</a><header class="lesson-header"><div class="eyebrow">CH '+c.number+' · '+e(c.short)+'</div><h1>'+e(l.title)+'</h1><p class="lesson-lead">'+e(l.lead)+'</p><div class="lesson-meta">'+pill('講義 P.'+l.pages)+pill('白話導讀')+'</div></header>'+
      '<article class="reading-block"><h2>先理解物理現象</h2>'+l.explain.map(function(p){return '<p>'+e(p)+'</p>'}).join('')+'</article>'+
      '<article class="reading-block"><h2>核心公式與條件</h2><div class="formula-panel"><div class="formula-icon">ƒ</div><div><strong>KEY RELATION</strong>'+formulaMarkup(l)+'</div></div><h3>帶入數字看看</h3><div class="example">'+e(l.example)+'</div></article>'+
      '<article class="reading-block"><h2>工程現場要注意</h2><div class="point-list">'+l.points.map(function(p){return '<div class="point-item"><span class="point-dot"></span><span>'+e(p)+'</span></div>'}).join('')+'</div><div class="warning-note"><strong>!</strong><div><strong>常見誤解</strong><div>'+e(l.trap)+'</div></div></div></article>'+
      '<section class="reading-block"><h2>30 秒觀念確認</h2><div id="quick-check">'+quick(l)+'</div></section>'+
      '<div class="lesson-bottom"><button type="button" class="btn '+(completed.has(l.id)?'btn-muted':'btn-primary')+'" data-action="complete">'+(completed.has(l.id)?'✓ 已標記完成':'✓ 標記這節已完成')+'</button><div class="lesson-pager">'+(prev?buttonLink(lessonPath(prev.chapter,prev.lesson),'← 上一節'):'')+(next?buttonLink(lessonPath(next.chapter,next.lesson),'下一節 →',true):buttonLink('#home','返回總覽 →',true))+'</div></div></div>';
  }
  // Page references may contain multiple ranges, e.g. "31–35、41–46".
  function pageNumbers(spec){
    var pages=new Set(),pattern=/(\d+)\s*[–—-]\s*(\d+)|(\d+)/g,match;
    while((match=pattern.exec(spec||''))!==null){
      if(match[3]){pages.add(Number(match[3]));continue}
      var start=Number(match[1]),end=Number(match[2]);
      for(var p=start;p<=Math.min(end,pageCount);p++)pages.add(p);
    }
    return pages;
  }
  function related(c,p){
    if(!c)return [];
    return c.lessons.filter(function(l){return pageNumbers(l.pages).has(p)});
  }
  function chapterForPage(p){return D.chapters.find(function(c){return c.range[0]<=p&&p<=c.range[1]})||null}
  function slideCards(start,end){
    var cards=[];
    for(var p=start;p<=end;p++){
      var c=chapterForPage(p),matches=related(c,p),text=sourceText[p]||'',preview=/^\d+\s*$/.test(text.trim())?'本頁以圖片／公式為主，請載入原始 PDF':text.trim().replace(/\s+/g,' ').slice(0,110);
      var links=matches.map(function(l){return '<a href="'+lessonPath(c,l)+'" class="slide-lesson-link">'+e(l.title)+' →</a>'}).join('');
      cards.push('<article class="slide-card" id="slide-p'+p+'"><span class="slide-pageno">P.'+p+'</span><div><a class="slide-title-link" href="#slide/'+p+'"><h3>'+e(D.slideTitles[p]||('第 '+p+' 頁'))+'</h3></a><p>'+(c?e(c.short):'原講義資訊頁')+(preview?' · '+e(preview):'')+'</p><div class="slide-card-links"><a href="#slide/'+p+'">'+e(D.pageTextLink||'查看原始文字與 PDF 對照')+' →</a>'+links+'</div></div></article>');
    }
    return cards;
  }
  function slides(c){
    var all=!c,start=all?1:c.range[0],end=all?pageCount:c.range[1],cards=slideCards(start,end),title=all?'完整原講義 '+pageCount+' 頁索引':c.title+' · 頁碼索引';
    return '<div style="--c:'+(c?c.accent:'#4899EF')+'"><a class="back-link" href="'+(c?chapterPath(c):'#home')+'">← 返回'+(c?' '+e(c.title):'總覽')+'</a><header class="page-header"><div class="eyebrow">ORIGINAL LECTURE INDEX</div><h1>'+e(title)+'</h1><p>共 '+cards.length+' 頁。'+e(D.pageTextIntro||'點擊任一頁即可查看原講義抽取文字，並可在本機載入原始 PDF，對照圖片與電路圖。')+'</p></header><div class="content-note">'+e(D.indexNote||'原講義共 107 頁：第 1–2 頁為封面／課表，第 3–106 頁為教材，第 107 頁為結尾。文字來自 PPTX 擷取，公式圖與電路圖請以原始 PDF 視覺內容為準。')+'</div><div class="slides-toolbar"><strong>'+cards.length+' 頁完整標題索引</strong>'+(c?buttonLink('#quiz/'+c.id,'章末測驗 →'):buttonLink('#home','返回主題首頁'))+'</div><div class="slide-grid">'+cards.join('')+'</div></div>';
  }
  function sourcePage(p){
    var c=chapterForPage(p),matches=related(c,p);
    var links=matches.map(function(l){return buttonLink(lessonPath(c,l),'學習：'+l.title)}).join('');
    var text=sourceText[p]||'';
    var hasOnlyPageNumber=/^\d+\s*$/.test(text.trim()) || !text.trim();
    var transcript=hasOnlyPageNumber?
      '<div class="content-note">本頁的可抽取文字只有頁碼或完全空白，表示主要資訊位於圖片／公式中。請載入原始 PDF 查看完整內容。</div>':
      '<pre class="slide-transcript">'+e(text)+'</pre>';
    return '<div class="lesson-layout" style="--c:'+(c?c.accent:'#4899EF')+'">'+
      '<a class="back-link" href="#slides/all">← 返回完整講義索引</a>'+
      '<header class="lesson-header"><div class="eyebrow">ORIGINAL SLIDE / '+p+' OF '+pageCount+'</div>'+
      '<h1>第 '+p+' 頁｜'+e(D.slideTitles[p])+'</h1>'+
      '<p class="lesson-lead">'+(c?'對應主題：'+e(c.title):'封面、課程資訊或結語')+'</p>'+
      '<div class="chapter-actions">'+links+'</div></header>'+
      '<div id="source-pdf-holder"></div>'+
      '<section class="reading-block"><h2>'+e(D.pageTextTitle||'原講義抽取文字')+'</h2>'+
      '<p class="muted">'+e(D.pageTextNote||'文字由原始 PPTX 擷取，可能缺漏圖片形式的公式與電路圖；原講義 PDF 才是圖形內容的依據。')+'</p>'+
      transcript+'</section>'+
      '<div class="lesson-bottom"><div class="lesson-pager">'+
      (p>1?buttonLink('#slide/'+(p-1),'← 上一頁'):'')+
      (p<pageCount?buttonLink('#slide/'+(p+1),'下一頁 →',true):'')+
      '</div>'+buttonLink('#slides/all',pageCount+' 頁完整索引')+'</div></div>';
  }
  function initQuiz(c){state.quiz={chapter:c.id,index:0,score:0,answer:null,done:false}}
  function quiz(c){
    if(!state.quiz||state.quiz.chapter!==c.id)initQuiz(c);
    var q=state.quiz,n=c.lessons.length;
    if(q.done)return '<div class="quiz-shell"><a class="back-link" href="'+chapterPath(c)+'">← 返回本章</a><div class="panel quiz-result"><div class="eyebrow" style="justify-content:center">QUIZ COMPLETE</div><div class="score">'+q.score+' / '+n+'</div><h2>章末測驗完成</h2><p class="muted">測驗可以重複練習，不代表實機驗證。</p><button class="btn btn-primary" data-action="restart">重新作答</button></div></div>';
    var item=c.lessons[q.index].quiz;
    var choices=item.choices.map(function(v,i){var cls=q.answer===null?'':(i===item.correct?'correct':q.answer===i?'wrong':'');return '<button class="quiz-choice '+cls+'" data-action="quiz-answer" data-index="'+i+'" '+(q.answer===null?'':'disabled')+'><span class="choice-letter">'+String.fromCharCode(65+i)+'</span>'+e(v)+'</button>'}).join('');
    return '<div class="quiz-shell" style="--c:'+c.accent+'"><a class="back-link" href="'+chapterPath(c)+'">← 返回 '+e(c.title)+'</a><div class="page-header"><div class="eyebrow">KNOWLEDGE CHECK</div><h1>'+e(c.short)+' · 章末測驗</h1><p>每節一題，選完會顯示正確答案與原因。</p></div><div class="quiz-meter"><span>第 '+(q.index+1)+' / '+n+' 題</span><span>目前答對 '+q.score+' 題</span></div><div class="quiz-progress"><div class="progress-track"><div class="progress-fill" style="width:'+pct(q.index,n)+'%"></div></div></div><div class="panel quiz-card"><span class="pill">第 '+(q.index+1)+' 題</span><div class="quiz-prompt">'+e(item.q)+'</div><div class="quiz-choices">'+choices+'</div>'+(q.answer===null?'':'<div class="quiz-feedback">'+e(item.reason)+'</div><div style="margin-top:18px;text-align:right"><button class="btn btn-primary" data-action="quiz-next">'+(q.index===n-1?'查看結果':'下一題 →')+'</button></div>')+'</div></div>';
  }
  function closeMenu(){document.body.classList.remove('menu-open');$('#sidebar-scrim').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false')}
  function render(){
    var data=current(),r=data.r,c=data.c,l=data.l,pg=Number(r.id);
    var isSource=r.type==='slide'&&/^\d+$/.test(r.id)&&pg>=1&&pg<=pageCount;
    var allSlides=r.type==='slides'&&r.id==='all';
    if(!['home','chapter','lesson','slides','quiz','slide'].includes(r.type)||(r.type!=='home'&&!c&&!allSlides&&!isSource)||(r.type==='lesson'&&!l)){
      location.hash='#home';return;
    }
    updateSidebar(r);updateBreadcrumb(r,c,l);
    if(r.type==='home')main.innerHTML=home();
    else if(r.type==='chapter'){main.innerHTML=chapter(c);window.EE_LABS.mount(c.lab,$('#lab-holder'))}
    else if(r.type==='lesson')main.innerHTML=lesson(c,l);
    else if(r.type==='slides')main.innerHTML=slides(c);
    else if(r.type==='slide'){main.innerHTML=sourcePage(pg);if(window.EE_SOURCE_PDF)window.EE_SOURCE_PDF.mount($('#source-pdf-holder'),pg)}
    else if(r.type==='quiz')main.innerHTML=quiz(c);
    document.title=(r.type==='home'?'總覽':isSource?'第 '+pg+' 頁原講義':l?l.title:allSlides?pageCount+' 頁講義索引':c.title)+'｜EE Handouts';
    if(r.type==='lesson')typesetFormulas();
    closeMenu();
    window.scrollTo(0,0);
  }
  var searchOverlay=$('#search-overlay'),searchInput=$('#search-input');
  function searchItems(q){
    var s=q.trim().toLowerCase().replace(/^頁碼\s*/,'').replace(/^第\s*(\d+)\s*頁$/,'$1'),items=[];
    D.chapters.forEach(function(c){
      items.push({type:'chapter',title:c.title,subtitle:'主題 · P.'+c.range[0]+'–'+c.range[1],url:chapterPath(c),text:c.title+' '+c.short+' '+c.subtitle});
      c.lessons.forEach(function(l){items.push({type:'lesson',title:l.title,subtitle:c.short+' · P.'+l.pages,url:lessonPath(c,l),text:l.title+' '+l.lead+' '+l.explain.join(' ')+' '+l.formula})});
    });
    for(var p=1;p<=pageCount;p++){
      var c=chapterForPage(p),raw=(sourceText[p]||'').slice(0,600);
      items.push({type:'slide',title:'P.'+p+' '+D.slideTitles[p],subtitle:(c?c.short:'原講義資訊頁')+' · 原講義第 '+p+' 頁',url:'#slide/'+p,text:'P.'+p+' 第'+p+'頁 '+D.slideTitles[p]+' '+raw});
    }
    if(!s)return items.filter(function(x){return x.type==='chapter'});
    return items.filter(function(x){return (x.text+' '+x.subtitle).toLowerCase().includes(s)}).sort(function(a,b){function score(x){return (x.title.toLowerCase().startsWith(s)?3:0)+(x.title.toLowerCase().includes(s)?2:0)+(x.type==='lesson'?1:0)}return score(b)-score(a)}).slice(0,35);
  }
  function drawSearch(){
    var items=state.searchItems;
    $('#search-results').innerHTML=items.length?'<div class="result-group">'+(searchInput.value?'搜尋結果':'選擇主題')+' · '+items.length+' 筆</div>'+items.map(function(x,i){return '<a href="'+e(x.url)+'" class="search-result '+(i===state.searchIndex?'selected':'')+'"><span>'+(x.type==='chapter'?'◈':x.type==='lesson'?'↗':'#')+'</span><div><strong>'+e(x.title)+'</strong><small>'+e(x.subtitle)+'</small></div></a>'}).join(''):'<div class="search-empty">沒有找到結果。試試「電感」「THD」「PWM」「25」「ADC」。</div>';
  }
  function refreshSearch(){state.searchItems=searchItems(searchInput.value);state.searchIndex=0;drawSearch()}
  function openSearch(){state.lastFocus=document.activeElement;searchOverlay.hidden=false;searchInput.value='';refreshSearch();searchInput.focus()}
  function closeSearch(){searchOverlay.hidden=true;if(state.lastFocus&&state.lastFocus.focus)state.lastFocus.focus()}
  $('#search-trigger').addEventListener('click',openSearch);
  $('#search-close').addEventListener('click',closeSearch);
  $('#search-backdrop').addEventListener('click',closeSearch);
  searchInput.addEventListener('input',refreshSearch);
  searchInput.addEventListener('keydown',function(ev){
    if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();if(state.searchItems.length){state.searchIndex=(state.searchIndex+(ev.key==='ArrowDown'?1:-1)+state.searchItems.length)%state.searchItems.length;drawSearch();var targets=$('.search-result.selected');if(targets)targets.scrollIntoView({block:'nearest'})}}
    if(ev.key==='Enter'&&state.searchItems.length){ev.preventDefault();location.hash=state.searchItems[state.searchIndex].url;closeSearch()}
  });
  $('#search-results').addEventListener('click',function(ev){if(ev.target.closest('a'))closeSearch()});
  $('#menu-toggle').addEventListener('click',function(){var opened=document.body.classList.toggle('menu-open');$('#sidebar-scrim').hidden=!opened;$('#menu-toggle').setAttribute('aria-expanded',String(opened))});
  $('#sidebar-scrim').addEventListener('click',closeMenu);
  $('#theme-toggle').addEventListener('click',function(){theme=theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('ee.theme',theme)}catch(ev){}});
  document.addEventListener('keydown',function(ev){if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();openSearch()}else if(ev.key==='Escape'){if(!searchOverlay.hidden)closeSearch();else closeMenu()}});
  main.addEventListener('click',function(ev){
    var b=ev.target.closest('button[data-action]');if(!b)return;
    var d=current(),c=d.c,l=d.l,act=b.dataset.action;
    if(act==='complete'&&l){
      if(completed.has(l.id))completed.delete(l.id);else completed.add(l.id);
      try{localStorage.setItem(progressKey,JSON.stringify(Array.from(completed)))}catch(err){}
      updateSidebar(d.r);b.textContent=completed.has(l.id)?'✓ 已標記完成':'✓ 標記這節已完成';
      b.classList.toggle('btn-primary',!completed.has(l.id));b.classList.toggle('btn-muted',completed.has(l.id));
    }
    if(act==='quick'&&l&&state.quickAnswer[l.id]===undefined){state.quickAnswer[l.id]=Number(b.dataset.index);$('#quick-check').innerHTML=quick(l)}
    if(act==='quiz-answer'&&c&&state.quiz&&state.quiz.answer===null){var answer=Number(b.dataset.index);state.quiz.answer=answer;if(answer===c.lessons[state.quiz.index].quiz.correct)state.quiz.score++;main.innerHTML=quiz(c)}
    if(act==='quiz-next'&&c&&state.quiz){state.quiz.index++;state.quiz.answer=null;if(state.quiz.index>=c.lessons.length)state.quiz.done=true;main.innerHTML=quiz(c);window.scrollTo(0,0)}
    if(act==='restart'&&c){initQuiz(c);main.innerHTML=quiz(c)}
  });
  window.addEventListener('hashchange',render);
  render();
})();