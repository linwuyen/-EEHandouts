import assert from 'node:assert/strict';
// Deliberately restricted to P106's authored numeric affine mapping, not a TeX
// evaluator. Parse the actual displayed coefficients AND dimensions; compare
// against independent literal physical fixtures, never generated expectations.
const N='(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
const fixtures=[[-20,.1,136],[-10,.8,1092],[0,1.5,2048],[10,2.2,3003],[20,2.9,3959]];
const clean=s=>String(s).replace(/\s+/g,'').replace(/−/g,'-');
function need(ok,label){assert.ok(ok,'ADC_DISPLAY_CONTRACT: '+label);}
function near(actual,want,label){need(Number.isFinite(actual)&&Math.abs(actual-want)<1e-9,label+': '+actual+' != '+want);}
function capture(text,pattern,label){const m=clean(text).match(pattern);need(m,label+' has unsupported or incomplete numeric form');return m;}
function scale(unit,kind){
 const units=kind==='current'?{A:1,mA:.001}:kind==='voltage'?{V:1,mV:.001}:{'Ω':1,'mΩ':.001,'kΩ':1000};
 need(Object.hasOwn(units,unit),'unsupported '+kind+' unit '+unit);return units[unit];
}
function affine(bias,gain,inputUnit,outputUnit,label){
 const iScale=scale(inputUnit,'current'),vScale=scale(outputUnit,'voltage');
 for(const [amps,volts] of fixtures)near((bias+gain*amps/iScale)*vScale,volts,label+' at '+amps+' A');
}
function expanded(text,label){
 const s=clean(text).replace('V_{\\mathrm{ADC}}','VADC').replace('Vadc','VADC').replaceAll('\\times','×');
 const p=new RegExp('^VADC=('+N+')([+-])('+N+')×('+N+')(?:×)?I=('+N+')([+-])('+N+')I$');
 const m=capture(s,p,label);
 affine(Number(m[1]),(m[2]==='-'?-1:1)*Number(m[3])*Number(m[4]),'A','V',label+' expanded');
 affine(Number(m[5]),(m[6]==='-'?-1:1)*Number(m[7]),'A','V',label+' simplified');
}
export function assertAdcPage106({tex,plain,given,worked,answer}){
 const t=clean(tex).replaceAll('\\,','').replaceAll('\\quad','');
 const tm=capture(t,new RegExp('^V_\\{\\\\rmADC\\}=('+N+')([+-])('+N+')I_\\{\\\\rm\\[([A-Za-z]+)\\]\\}\\\\mathrm\\{([A-Za-z]+)\\}$'),'page TeX');
 affine(Number(tm[1]),(tm[2]==='-'?-1:1)*Number(tm[3]),tm[4],tm[5],'page TeX');
 const pm=capture(plain,new RegExp('^I以([A-Za-z]+)代入：VADC\\[([A-Za-z]+)\\]=('+N+')([+-])('+N+')I\\[([A-Za-z]+)\\]$'),'page fallback');
 need(pm[1]===pm[6],'fallback input unit must match its instruction');
 affine(Number(pm[3]),(pm[4]==='-'?-1:1)*Number(pm[5]),pm[6],pm[2],'page fallback');
 const sh=capture(given,new RegExp('Shunt=('+N+')(mΩ|Ω)'),'given shunt');
 const ri=capture(given,new RegExp('R1=R3=('+N+')(kΩ|Ω)'),'given input resistors');
 const rf=capture(given,new RegExp('Rf=R4=('+N+')(kΩ|Ω)'),'given feedback resistors');
 const bias=capture(given,new RegExp('Vref=('+N+')(mV|V)'),'given bias');
 const gain=Number(rf[1])*scale(rf[2],'resistance')/(Number(ri[1])*scale(ri[2],'resistance'));
 affine(Number(bias[1]),gain*Number(sh[1])*scale(sh[2],'resistance'),'A',bias[2],'given physical components');
 need(Array.isArray(worked)&&worked.length===3,'three worked steps');
 const equation=capture(worked[0],/VADC=([^。；]+)/,'worked affine mapping');
 expanded('VADC='+equation[1],'worked mapping');
 const values=[...clean(worked[1]).matchAll(new RegExp('I=([+-]?'+N+')(A|mA)?→('+N+')(mV|V)','g'))];
 need(values.length===3,'three signed/zero worked points');
 [[10,2.2],[-10,.8],[0,1.5]].forEach(([amps,volts],j)=>{
  const m=values[j];near(Number(m[1])*scale(m[2]||'A','current'),amps,'worked current');
  near(Number(m[3])*scale(m[4],'voltage'),volts,'worked voltage');
 });
 const ends=capture(worked[2],new RegExp('I=±('+N+')(A|mA)對應('+N+')(mV|V)/('+N+')(mV|V)'),'worked endpoints');
 near(Number(ends[1])*scale(ends[2],'current'),20,'endpoint current');
 near(Number(ends[3])*scale(ends[4],'voltage'),.1,'negative endpoint voltage');
 near(Number(ends[5])*scale(ends[6],'voltage'),2.9,'positive endpoint voltage');
 const inv=capture(answer,new RegExp('I=\\(VADC-('+N+')\\)/('+N+')'),'inverse current answer');
 for(const [amps,volts] of fixtures)near((volts-Number(inv[1]))/Number(inv[2]),amps,'inverse answer');
}
export function assertAdcLesson({mathTex,formula,example}){
 expanded(mathTex,'lesson math');expanded(formula,'lesson fallback');
 const points=[...clean(example).matchAll(new RegExp('I=([+-]?'+N+')(A|mA)→Vadc=('+N+')(mV|V)','g'))];
 need(points.length===2,'lesson two signed examples');
 [[10,2.2],[-10,.8]].forEach(([amps,volts],j)=>{
  const m=points[j];near(Number(m[1])*scale(m[2],'current'),amps,'lesson example current');
  near(Number(m[3])*scale(m[4],'voltage'),volts,'lesson example voltage');
 });
}
export function assertAdcModel(model){
 need(model&&typeof model.compute==='function','actual interactive ADC model');
 const gain=model.knobs.find(k=>k.key==='gain')?.value;
 near(gain,14,'interactive default gain');
 for(const [i,wantV,wantCode] of fixtures){
  const r=model.compute({i,gain});
  near(r.metrics[0].value,wantV,'interactive voltage at '+i+' A');
  near(r.metrics[1].value,wantCode,'interactive code at '+i+' A');
  need(r.metrics[0].unit.trim()==='V','interactive voltage dimension');
  need(r.metrics[1].unit.trim()==='count','interactive code dimension');
  need(r.validity.scorable===true,'fixture in physical model domain');
 }
}
