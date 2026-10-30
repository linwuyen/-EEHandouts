/* Advanced teaching lab UI: model inputs have exactly one local owner. */
(function () {
  'use strict';
  var engine=window.EE_ADVANCED_MODELS,nav=document.getElementById('advanced-nav'),root=document.getElementById('advanced-lab');
  if(!engine||!nav||!root){if(root)root.textContent='進階模型未能載入，請重新整理。';return;}
  var categories={power:'功率級週期',control:'控制與 MCU',nonideal:'非理想設計'};
  var names={pfc:'PFC',llc:'LLC',psfb:'PSFB',loop:'Bode',timing:'C2000',nonideal:'Buck 損耗',zvs:'ZVS 前提'};
  var ids=Object.keys(engine.catalog),selected=null,values={},cursor=.25,job=null,lastResult=null;
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"': '&quot;'}[c];});}
  function fmt(x,n){if(!Number.isFinite(x))return '—';return Number(x.toFixed(n===undefined?2:n)).toLocaleString('zh-TW',{maximumFractionDigits:n===undefined?2:n});}
  function configValue(x){return esc(fmt(x,Number.isInteger(x)?0:3));}
  function safeId(){var slug;try{slug=decodeURIComponent(location.hash.slice(1)).replace(/^\//,'');}catch(err){slug='pfc';}return ids.includes(slug)?slug:'pfc';}
  function controls(spec){
    var knobs=spec.knobs.map(function(k){return '<div class="advanced-control"><label class="advanced-control-label" for="adv-'+esc(k.key)+'"><span>'+esc(k.label)+'</span><output data-value="'+esc(k.key)+'">'+configValue(values[k.key])+' '+esc(k.unit)+'</output></label>'+ 
      '<input id="adv-'+esc(k.key)+'" type="range" data-knob="'+esc(k.key)+'" min="'+k.min+'" max="'+k.max+'" step="'+k.step+'" value="'+values[k.key]+'"></div>';}).join('');
    var selectors=(spec.selectors||[]).map(function(s){return '<div class="advanced-control"><label class="advanced-control-label" for="adv-'+esc(s.key)+'">'+esc(s.label)+'</label><select id="adv-'+esc(s.key)+'" data-selector="'+esc(s.key)+'">'+s.options.map(function(o){return '<option value="'+esc(o[0])+'" '+(values[s.key]===o[0]?'selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select></div>';}).join('');
    return '<aside class="advanced-controls"><h3>可調參數</h3>'+knobs+selectors+'<button type="button" class="advanced-reset">重設本模型</button></aside>';
  }
  function calc(){lastResult=engine.calculate(selected,values);return lastResult;}
  function graph(t,index){
    var vals=t.values,n=vals.length,lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals),span=hi-lo;
    if(!Number.isFinite(lo)||!Number.isFinite(hi))return '';
    var pad=Math.max(span*.12,.001),ymin=lo-pad,ymax=hi+pad,x0=48,y0=11,w=600,h=110;
    function px(i){if(selected==='loop'&&t.x&&t.x.length>1&&t.x[0]>0){return x0+Math.log(t.x[i]/t.x[0])/Math.log(t.x[n-1]/t.x[0])*w;}return x0+i*w/(n-1);}
    function py(a){return y0+(ymax-a)/(ymax-ymin)*h;}
    if(n===2&&t.labels){
      var lim=Math.max(hi,0.001),bars=vals.map(function(v,i){var x=80+280*i,b=92*Math.max(0,v)/lim;return '<rect x="'+x+'" y="'+(122-b)+'" width="90" height="'+b+'" rx="4" fill="'+(i?'#d39a47':'#3986d6')+'"/><text x="'+(x+45)+'" y="140" text-anchor="middle" class="advanced-chart-axis">'+esc(t.labels[i])+'</text><text x="'+(x+45)+'" y="'+(116-b)+'" text-anchor="middle" class="advanced-chart-axis">'+esc(fmt(v,2))+'</text>';}).join('');
      return '<svg role="img" aria-label="'+esc(t.label)+'" viewBox="0 0 700 150">'+bars+'</svg>';
    }
    var path='M'+px(0).toFixed(2)+' '+py(vals[0]).toFixed(2);
    for(var j=1;j<n;j++){path+=(t.step?' H':' L')+px(j).toFixed(2)+(t.step?' V':' ')+py(vals[j]).toFixed(2);}
    var ix=Math.round(cursor*(n-1)),vx=px(ix),vxVal=vals[ix];
    var left=t.x?fmt(t.x[0],1):'0%',right=t.x?fmt(t.x[n-1],1):'100%',xUnit=t.x?(selected==='loop'?'Hz':'µs'):'';
    return '<svg role="img" aria-label="'+esc(t.label)+'" viewBox="0 0 700 153">'+
      '<line x1="48" y1="11" x2="48" y2="121" stroke="currentColor" stroke-opacity=".22"/>'+ 
      '<line x1="48" y1="121" x2="648" y2="121" stroke="currentColor" stroke-opacity=".22"/>'+ 
      '<path d="'+path+'" class="advanced-chart-plot"/>'+ 
      '<line x1="'+vx.toFixed(2)+'" y1="11" x2="'+vx.toFixed(2)+'" y2="121" class="advanced-chart-cursor"/>'+ 
      '<text x="50" y="9" class="advanced-chart-axis">'+esc(fmt(hi,2))+'</text>'+
      '<text x="50" y="135" class="advanced-chart-axis">'+esc(fmt(lo,2))+'</text>'+
      '<text x="50" y="151" class="advanced-chart-axis">'+esc(left+' '+xUnit)+'</text>'+
      '<text x="647" y="151" text-anchor="end" class="advanced-chart-axis">'+esc(right+' '+xUnit)+'</text>'+
      '<text x="647" y="9" text-anchor="end" class="advanced-chart-axis">'+esc(fmt(vxVal,3)+' '+t.unit)+'</text></svg>';
  }
  function stageHTML(r){
    var stages=r.stages||[];if(!stages.length)return '';
    if(selected==='psfb')stages=stages.concat(stages.map(function(s){return Object.assign({},s,{start:s.start+.5,end:s.end+.5,id:s.id+'2'});}));
    return '<div class="advanced-stage-list">'+stages.filter(function(s){return s.end>s.start;}).map(function(s){return '<div class="advanced-stage"><b>'+esc(s.id)+'</b><div><div class="advanced-stage-meter"><span style="width:'+Math.max(0,Math.min(100,(s.end-s.start)*100))+'%"></span></div><small>'+esc(s.label)+'</small></div></div>';}).join('')+'</div>';
  }
  function metricHTML(r){return '<div class="advanced-summary">'+r.metrics.map(function(x){return '<div class="advanced-metric"><small>'+esc(x.label)+'</small><strong>'+esc(fmt(x.value,x.digits))+' '+esc(x.unit)+'</strong></div>';}).join('')+'</div>';}
  function probeHTML(r){
    var st=typeof r.probe==='function'?r.probe(cursor):null;
    if(st){
      var a=[];if(st.stage)a.push('區間：'+st.stage);
      for(var key of ['il','vL','vSW','vab','vrect','ip'])if(Number.isFinite(st[key]))a.push(key+'='+fmt(st[key],3));
      return '游標 '+fmt(cursor*100,0)+'% ／ '+a.join('　');
    }
    if(r.events){var t=r.data.width*cursor;var closest=r.events.reduce(function(best,e){return Math.abs(e.at-t)<Math.abs(best.at-t)?e:best;},r.events[0]);
      return '時間 '+fmt(t,3)+' µs；最近事件：'+closest.label+' ('+fmt(closest.at,3)+' µs)';}
    if(selected==='loop'){var i=Math.round(cursor*(r.data.points.length-1)),p=r.data.points[i];return '頻率 '+fmt(p.f,2)+' Hz ／ Gain '+fmt(p.db,2)+' dB ／ 相位 '+fmt(p.phase,2)+'°';}
    if(selected==='zvs')return '此圖為換流能量與時間預算；電流為 0 時換流時間不可定義，不繪成 0 ns。';
    return '游標：'+fmt(cursor*100,0)+'% PWM 週期（LLC 未收斂時顯示最後一週期過渡波形）。';
  }
  function refresh(){
    if(job){clearTimeout(job);job=null;}
    var r;try{r=calc();}catch(err){root.querySelector('.advanced-panel').textContent='模型計算失敗：'+err.message;console.error(err);return;}
    root.querySelector('.advanced-data').innerHTML=metricHTML(r)+
      '<div class="advanced-model-status" data-valid="'+String(!!r.validity)+'"><strong>工作模式：</strong>'+esc(r.mode)+' · '+(r.validity?'限定條件下可比較':'超出有效域／不可用於工程判定')+'</div>'+
      '<div class="advanced-explain">'+esc(r.note||'')+'</div>'+
      '<div class="advanced-warning" role="status">'+esc(r.warning||'')+'</div>';
    var chart=root.querySelector('.advanced-chart-list');
    chart.innerHTML=r.traces.map(function(t,i){return '<div class="advanced-chart"><p class="advanced-chart-title">'+esc(t.label)+' <small>('+esc(t.unit)+')</small></p>'+graph(t,i)+'</div>';}).join('')||'<p class="muted">此工況無有效波形。</p>';
    root.querySelector('.advanced-probe').textContent=probeHTML(r);
    root.querySelector('.advanced-stage-holder').innerHTML=stageHTML(r);
    root.querySelector('.advanced-assumptions').innerHTML='<strong>計算邊界與模型條件：</strong>'+esc(r.assumptions||r.note||'')+' <a href="'+esc(engine.catalog[selected].source)+'" target="_blank" rel="noopener noreferrer">對照第一手資料</a>';
  }
  function update(){root.querySelectorAll('[data-value]').forEach(function(node){var k=node.dataset.value,s=engine.catalog[selected].knobs.find(function(x){return x.key===k;});node.textContent=fmt(values[k],Number.isInteger(s.step)?0:3)+' '+s.unit;});
    if(job)clearTimeout(job);job=setTimeout(refresh,selected==='llc'?100:35);}
  function mount(id){
    selected=id;values=engine.params(id);cursor=.25;
    var spec=engine.catalog[id];
    root.innerHTML='<article class="advanced-shell"><header class="advanced-head"><div class="advanced-tag">'+esc(categories[spec.category])+' · '+esc(names[id])+'</div><h2>'+esc(spec.title)+'</h2><p>可調參數 → 同一份模型 → 數值與同步波形。請留意模型限制與警告。</p></header>'+ 
      '<div class="advanced-workspace">'+controls(spec)+'<div class="advanced-panel"><div class="advanced-data"></div>'+ 
      '<div class="advanced-plot-header"><h3>波形／頻率響應</h3><label class="advanced-cursor">游標 <output id="advanced-cursor-label">25%</output><input id="advanced-cursor" type="range" min="0" max="100" step="1" value="25" aria-label="波形時間／頻率游標"></label></div>'+ 
      '<div class="advanced-probe" role="status"></div><div class="advanced-chart-list"></div><div class="advanced-stage-holder"></div></div></div>'+ 
      '<div class="advanced-assumptions"></div></article>';
    nav.querySelectorAll('a[data-lab]').forEach(function(el){if(el.dataset.lab===id)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    root.querySelectorAll('[data-knob]').forEach(function(el){el.addEventListener('input',function(){values[el.dataset.knob]=Number(el.value);update();});});
    root.querySelectorAll('[data-selector]').forEach(function(el){el.addEventListener('change',function(){values[el.dataset.selector]=el.value;update();});});
    root.querySelector('.advanced-reset').addEventListener('click',function(){mount(selected);});
    root.querySelector('#advanced-cursor').addEventListener('input',function(e){cursor=Number(e.target.value)/100;root.querySelector('#advanced-cursor-label').textContent=fmt(cursor*100,0)+'%';
      if(lastResult){root.querySelector('.advanced-chart-list').innerHTML=lastResult.traces.map(function(t,i){return '<div class="advanced-chart"><p class="advanced-chart-title">'+esc(t.label)+' <small>('+esc(t.unit)+')</small></p>'+graph(t,i)+'</div>';}).join('');root.querySelector('.advanced-probe').textContent=probeHTML(lastResult);}
    });
    refresh();
  }
  var oldTheme='light';try{oldTheme=localStorage.getItem('ee.theme')||'light';}catch(err){}
  document.documentElement.dataset.theme=oldTheme;
  document.getElementById('advanced-theme').addEventListener('click',function(){var next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem('ee.theme',next);}catch(err){}});
  nav.innerHTML=ids.map(function(id){var spec=engine.catalog[id];return '<a data-lab="'+id+'" href="#'+id+'" title="'+esc(categories[spec.category])+'">'+esc(names[id])+'</a>';}).join('');
  window.addEventListener('hashchange',function(){var id=safeId();if(id!==selected)mount(id);});
  mount(safeId());
})();