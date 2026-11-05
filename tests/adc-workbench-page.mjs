/* Execute the actual page controller and unchanged source numerical owner; no layout claims. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
assert.ok(existsSync('workbench/ee-adc.js'),'ADC page controller must exist');
const ui=readFileSync('workbench/ee-adc.js','utf8');
function fixture({query='',missing=false}={}){
 const nodes=new Map(),listeners=new Map(),copied=[];
 for(const id of ['adcResults','currentResults','dividerResults','currentWarns','dividerWarns','formula','code','currentFill','currentZero','currentMark','voltageFill','voltageMark','copy','share','ee-adc-status'])nodes.set(id,{id,textContent:'',innerHTML:'',style:{},disabled:true,addEventListener(type,fn){listeners.set(id+':'+type,fn);}});
 for(const [id,value]of Object.entries({vref:3.3,bits:12,current:20,shunt:.005,gain:8.2,offset:1.65,bus:400,rtop:1000,rbot:6.8,seriesCount:4}))nodes.set(id,{id,value:String(value),disabled:true,addEventListener(type,fn){listeners.set(id+':'+type,fn);}});
 const document={documentElement:{dataset:{}},getElementById:id=>nodes.get(id)};
 const c={document,URLSearchParams,console,location:{origin:'https://example.test',pathname:'/-EEHandouts/workbench/adc.html',search:query},navigator:{clipboard:{writeText:async text=>copied.push(text)}},prompt:(title,text)=>copied.push(text)};
 Object.defineProperty(c,'localStorage',{get(){throw Error('must not access learning storage');}});c.window=c;vm.createContext(c);
 if(!missing)vm.runInContext(readFileSync('workbench/assets/learning/engineering-models.js','utf8'),c);
 vm.runInContext(ui,c);return {c,nodes,listeners,copied,set(id,value){nodes.get(id).value=String(value);listeners.get(id+':input')();},metric(group,label){const s=nodes.get(group).innerHTML;return s.match(new RegExp('<span>'+label+'<\/span><strong>([^<]+)'))?.[1];}};
}
let f=fixture();assert.equal(f.c.document.documentElement.dataset.eeAdcState,'ready');
assert.equal(f.metric('adcResults','Code 數'),'4096');assert.equal(f.metric('adcResults','理想 LSB'),'0.8057 mV');assert.equal(f.metric('currentResults','ADC 輸入'),'2.4700 V');assert.equal(f.metric('currentResults','ADC code'),'3065');
f.set('bus',600);assert.match(f.nodes.get('dividerWarns').innerHTML,/降低分壓比 Rbot/,'overrange remedy must reduce bottom/total ratio');f.set('bus',400);
f.set('current',0);assert.equal(f.metric('currentResults','ADC code'),'2048');
f.set('current',-20);assert.equal(f.metric('currentResults','ADC 輸入'),'0.8300 V');assert.equal(f.metric('currentResults','ADC code'),'1030');
f.set('current',100);assert.equal(f.metric('currentResults','ADC code'),'4095');assert.match(f.nodes.get('currentWarns').innerHTML,/飽和/);
f.set('current',-100);assert.equal(f.metric('currentResults','ADC code'),'0');assert.match(f.nodes.get('currentWarns').innerHTML,/截斷/);
const invalids=[['vref',''],['vref',0],['vref',-1],['vref','NaN'],['bits',11],['bits',12.5],['shunt',0],['gain',0],['current',''],['offset',''],['bus',-1],['rtop',0],['rbot',0],['seriesCount',0],['seriesCount',1.5],['seriesCount',''],['current',Infinity],['current','1e308']];
for(const [id,value]of invalids){const g=fixture();if(id==='current'&&value==='1e308')g.set('gain','1e308');g.set(id,value);assert.equal(g.c.document.documentElement.dataset.eeAdcState,'invalid',id+' '+value);for(const field of ['adcResults','currentResults','dividerResults','code','formula'])assert.equal(g.nodes.get(field)[field==='code'||field==='formula'?'textContent':'innerHTML'],'','stale '+field);assert.equal(g.nodes.get('copy').disabled,true);assert.equal(g.nodes.get('share').disabled,true);}
f=fixture();f.set('vref',0);f.set('vref',3.3);assert.equal(f.c.document.documentElement.dataset.eeAdcState,'ready');assert.equal(f.nodes.get('copy').disabled,false);
await f.listeners.get('copy:click')();assert.match(f.copied[0],/ADC_LEVELS\s+\(4096\.0f\)/);
await f.listeners.get('share:click')();const shared=new URL(f.copied[1]);assert.equal(shared.pathname,'/-EEHandouts/workbench/adc.html');assert.equal(shared.searchParams.get('gain'),'8.2');
f=fixture({query:'?current=-20&bits=16&from=https://attacker.invalid'});assert.equal(f.metric('adcResults','Code 數'),'65536');assert.equal(f.metric('currentResults','ADC 輸入'),'0.8300 V');
f=fixture({missing:true});assert.equal(f.c.document.documentElement.dataset.eeAdcState,'failed');assert.equal(f.nodes.get('copy').disabled,true);assert.equal(f.nodes.get('vref').disabled,true);
// review-overflow: finite owner values can still overflow display-unit conversion.
for(const mode of ['power-input','power-query','shunt-input']){
 const g=mode==='power-query'?fixture({query:'?bus=1e156'}):fixture();
 if(mode==='power-input')g.set('bus','1e156');
 if(mode==='shunt-input'){g.set('shunt',1);g.set('gain',.01);g.set('current','1e306');}
 assert.equal(g.c.document.documentElement.dataset.eeAdcState,'invalid',mode+' display-unit overflow must fail closed');
 for(const id of ['adcResults','currentResults','dividerResults','currentWarns','dividerWarns','code','formula'])assert.equal(g.nodes.get(id)[id==='code'||id==='formula'?'textContent':'innerHTML'],'',mode+' clears '+id);
 assert.equal(g.nodes.get('copy').disabled,true);assert.equal(g.nodes.get('share').disabled,true);
 g.set('current',20);g.set('shunt',.005);g.set('gain',8.2);g.set('bus',400);
 assert.equal(g.c.document.documentElement.dataset.eeAdcState,'ready',mode+' recovery');
 assert.equal(g.metric('currentResults','ADC code'),'3065');
}
f=fixture({query:'?bus=1e150'});assert.equal(f.c.document.documentElement.dataset.eeAdcState,'ready','large but finite converted power is not arbitrarily rejected');
console.log('PASS ADC actual UI/owner: literal points, signed current, rails, 18 invalid inputs, 3 derived-unit overflow cases, stale output removal, recovery, copy/share and missing model; storage inaccessible');
