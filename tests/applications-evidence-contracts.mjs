/* Pure boundary checks use actual pinned application owners, not duplicate formulae. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
const require=createRequire(import.meta.url);
assert.ok(existsSync('workbench/ee-applications-contract.js'),'application raw-record guard must exist');
const V=require('../workbench/ee-applications-contract.js');
const W=require('../workbench/assets/learning/workspace-core.js');
const R=require('../workbench/assets/learning/model-registry.js');
const lessons=W.applicationLessons(),clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const rows={};for(const l of lessons){const plan=W.applicationPlan(l.id);rows[l.id]={protocol:'topology-application-v1',prepared:true,first:{answer:'higher',correct:false},operated:true,controls:plan,before:W.applicationRun(l.id,plan.before),after:W.applicationRun(l.id,plan.after),model:{id:l.modelId,version:R.describe(l.modelId).version},observationFirst:{answer:l.answer,correct:true},observationPassed:true,reasonFirst:{answer:'reason',correct:true},reasonPassed:true};}return {version:1,rows,completed:true,currentLesson:'llc'};}
function validate(record){return V.validate(record,W,R);}
assert.equal(validate(undefined),null,'absent record');
assert.equal(validate({version:1,rows:{}}),null,'new empty session');
assert.equal(validate({version:1,rows:{pfc:{prepared:true}}}),null,'original preparation-only record');
const good=fixture(),before=JSON.stringify(good);assert.equal(validate(good),null);assert.equal(JSON.stringify(good),before,'validator is read-only');
for(const bad of [null,false,0,'future',[],{}, {version:999,rows:{}},{version:1,rows:[]},{version:1,rows:{alien:{}}}])assert.ok(validate(bad),'unsupported raw shape '+JSON.stringify(bad));
const mutations=[
 ['future model',r=>r.rows.pfc.model.version='999.0.0'],
 ['wrong model ID',r=>r.rows.psfb.model.id='other-model'],
 ['missing model',r=>delete r.rows.llc.model],
 ['numeric model version',r=>r.rows.inverter.model.version=1],
 ['wrong protocol',r=>r.rows.pfc.protocol='unknown'],
 ['missing stored output',r=>delete r.rows.pfc.after],
 ['nonfinite output',r=>r.rows.pfc.after.result.busRippleVpk=null],
 ['relabeled output',r=>r.rows.pfc.after.result.busRippleVpk*=10],
 ['wrong physical units',r=>r.rows.pfc.after.params.busCapF*=1e6],
 ['wrong condition',r=>r.rows.psfb.controls.after.psfbN=8],
 ['missing first answer',r=>delete r.rows.llc.first],
 ['false first attribution',r=>r.rows.llc.first.correct=true],
 ['completion without operation',r=>r.rows.inverter.operated=false],
 ['missing non-displayed output',r=>delete r.rows.pfc.after.result.inputCurrentRms],
 ['wrong operating-region flag',r=>r.rows.pfc.before.result.boostBusAboveLinePeak=false],
 ['reason attempted before observation passed',r=>{r.completed=false;Object.assign(r.rows.pfc,{observationPassed:false,observationFirst:{answer:'higher',correct:false},reasonPassed:false});}],
 ['correct observation without pass',r=>{r.completed=false;r.rows.pfc.observationPassed=false;delete r.rows.pfc.reasonFirst;r.rows.pfc.reasonPassed=false;}],
 ['correct reason without pass',r=>{r.completed=false;r.rows.pfc.reasonPassed=false;}],
 ['unsupported current lesson',r=>r.currentLesson='future-lesson']
];
for(const [name,mutate]of mutations){const bad=clone(good);mutate(bad);const raw=JSON.stringify(bad);assert.ok(validate(bad),name);assert.equal(JSON.stringify(bad),raw,'unchanged '+name);}
for(const l of lessons){const partial={version:1,rows:{[l.id]:{protocol:'topology-application-v1',prepared:true,first:{answer:'higher',correct:false}}}};assert.equal(validate(partial),null,l.id+' valid original partial record');}
const orphan={version:1,rows:{pfc:{protocol:'topology-application-v1',prepared:true,first:{answer:'higher',correct:false},model:{id:lessons[0].modelId,version:'999.0.0'},controls:W.applicationPlan('pfc')}}};
assert.ok(validate(orphan),'unoperated record cannot carry orphan model attribution');
assert.ok(validate({version:1,rows:{pfc:{protocol:'topology-application-v1',first:{answer:'higher',correct:false}}}}),'first judgment requires original explicit preparation');
assert.doesNotThrow(()=>assert.ok(V.validate(good,W,{describe:()=>null})),'missing model registry fails closed rather than throwing');
console.log('PASS applications record contract: 19 corrupt provenance/snapshot/proof cases, 9 invalid shapes, 3 orphan/preparation/registry cases, readonly compatible/new/partial controls');
