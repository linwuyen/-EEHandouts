/* Actual imported UI/registry/proof/Evidence owners, with a layout-free DOM. */
import assert from 'node:assert/strict';
import {applicationsFixture} from './helpers/applications-fixture.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
async function completed(){const f=applicationsFixture();await f.seed();assert.equal(await f.mount(),true);
 for(const l of f.W.applicationLessons()){
  await f.choose(l.id);await f.ids.get('application-prepare').onclick();await f.answer('higher');
  await f.ids.get('application-run').onclick();await f.answer('higher');await f.answer('lower');await f.answer('other');await f.answer('reason');
 }
 await f.flush();return f;
}
const fresh=applicationsFixture();await fresh.seed();const original=fresh.data.get(fresh.E.KEY);
assert.equal(await fresh.mount(),true);assert.equal(fresh.data.get(fresh.E.KEY),original,'viewing native tools must not create application evidence');
const f=await completed(),state=JSON.parse(f.data.get(f.E.KEY)),saved=state.benchmark.learningWorkspace.topologyApplications;
assert.equal(saved.completed,true);
for(const l of f.W.applicationLessons()){
 const row=saved.rows[l.id];assert.equal(row.first.correct,false);assert.equal(row.observationFirst.correct,false);assert.equal(row.reasonFirst.correct,false);assert.equal(f.W.applicationProof(row),true);
}
assert.equal(state.benchmark.learningWorkspace.experiment.preserve,'experiment');assert.equal(state.benchmark.learningWorkspace.topologyTransfer.preserve,'comparison');assert.equal(state.benchmark.outcomeV1,undefined);assert.equal(f.data.get('ee.middle.done'),'["mid-buck-pwm"]');
{
 const resumed=applicationsFixture(),raw=await resumed.seed(saved);assert.equal(await resumed.mount(),true);await resumed.flush();assert.equal(resumed.data.get(resumed.E.KEY),raw,'resume never rewrites first answers or model provenance');
}
for(const bad of [null,{version:999,rows:{}},Object.assign(clone(saved),{rows:{alien:{}}}),(()=>{const x=clone(saved);x.rows.pfc.model.version='999.0.0';return x;})(),(()=>{const x=clone(saved);x.rows.psfb.after.result.idealSecondaryV*=2;return x;})()]){
 const g=applicationsFixture(),raw=await g.seed(bad);assert.equal(await g.mount(),false,'unsupported mounted record');await g.flush();assert.equal(g.data.get(g.E.KEY),raw,'raw preserved');assert.equal(g.writes.filter(w=>w.key===g.E.KEY).length,0);assert.equal(g.main.inert,true);
}
// Replaying the native tool must not replace a saved snapshot or its timestamp.
{
 const resumed=applicationsFixture(),existing=clone(saved);
 existing.rows.pfc.operatedAt='2026-11-04T00:00:00.000Z';
 await resumed.seed(existing);assert.equal(await resumed.mount(),true);
 await resumed.choose('pfc');await resumed.ids.get('application-prepare').onclick();
 const panel=resumed.ids.get('guided-applications');
 panel.querySelectorAll('button').find(button=>button.textContent.startsWith('2. ')).onclick();
 await resumed.ids.get('application-run').onclick();await resumed.flush();
 const result=JSON.parse(resumed.data.get(resumed.E.KEY)).benchmark.learningWorkspace.topologyApplications.rows.pfc;
 assert.deepEqual(result,existing.rows.pfc,'saved snapshot, timestamp and attempts remain intact');
}
// Newer data during contract load must never be normalized or written.
{
 const g=applicationsFixture();await g.seed();const release=g.pauseContracts(),mount=g.mount();const raw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'future'});g.data.set(g.E.KEY,raw);release();assert.equal(await mount,false);assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.data.has(g.E.KEY+'-corrupt-backup'),false);
}
// Another tab can change the record before its storage event is delivered.
{
 const g=applicationsFixture();await g.seed();await g.mount();await g.ids.get('application-prepare').onclick();const state=JSON.parse(g.data.get(g.E.KEY));state.benchmark.learningWorkspace.topologyApplications.rows.pfc.first={answer:'higher',correct:false};state.benchmark.learningWorkspace.topologyApplications.rows.pfc.protocol='topology-application-v1';const raw=JSON.stringify(state);g.data.set(g.E.KEY,raw);await g.answer('lower');assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.main.inert,true);assert.equal(await g.H.leave('topology.html'),false);
}
// A winner arriving during the guarded action's reads must not become its write baseline.
for(const [kind,readNumber] of [['future',6],['first-attempt',7]]){
 const g=applicationsFixture();await g.seed();assert.equal(await g.mount(),true);
 if(kind==='first-attempt')await g.ids.get('application-prepare').onclick();
 const state=JSON.parse(g.data.get(g.E.KEY));
 if(kind==='future')state.version=6;
 else Object.assign(state.benchmark.learningWorkspace.topologyApplications.rows.pfc,{protocol:'topology-application-v1',first:{answer:'higher',correct:false}});
 const winner=JSON.stringify(state);let reads=0;
 const read=g.ctx.localStorage.getItem;
 g.ctx.localStorage.getItem=k=>{if(k===g.E.KEY&&++reads===readNumber)g.data.set(k,winner);return read(k);};
 if(kind==='future')await g.ids.get('application-prepare').onclick();
 else await g.answer('lower');
 await g.flush();
 assert.ok(reads>=readNumber,kind+' reached the racing read');
 assert.equal(g.data.get(g.E.KEY),winner,kind+' winning bytes remain intact');
 assert.equal(g.data.has(g.E.KEY+'-corrupt-backup'),false);
 assert.equal(await g.H.leave('topology.html'),false);
}
// A fulfilled fetch does not imply that every required model has versioned provenance.
for(const kind of ['missing-card','missing-version','empty-version']){
 const g=applicationsFixture(),raw=await g.seed(),fetch=g.ctx.fetch;
 g.ctx.fetch=async url=>{const response=await fetch(url);return {...response,json:async()=>{
  const payload=await response.json();
  if(kind==='missing-card')payload.visuals=payload.visuals.filter(v=>v.modelId!=='llc-normalized-fha');
  if(kind==='missing-version')delete payload.version;
  if(kind==='empty-version')payload.version='';
  return payload;
 }};};
 assert.equal(await g.mount(),false,kind+' prevents mounting');
 await g.flush();assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.writes.length,0);
}
// A held write lock cannot show next stage or accepted result.
{
 const g=applicationsFixture();await g.seed();await g.mount();await g.ids.get('application-prepare').onclick();const release=g.holdLock(),pending=g.answer('lower');await g.tick();assert.equal(g.ids.get('guided-applications').dataset.applicationStage,'0');assert.equal(g.ids.get('application-submit').disabled,true);release();await pending;assert.equal(g.ids.get('guided-applications').dataset.applicationStage,'1');
}
// Quota failure retains draft and prevents accepted stage/navigation.
{
 const g=applicationsFixture();await g.seed();await g.mount();const raw=g.data.get(g.E.KEY);g.quota(true);await g.ids.get('application-prepare').onclick();assert.equal(g.E.storageStatus().saved,false);assert.equal(g.ids.get('application-submit').disabled,true);assert.equal(g.data.get(g.E.KEY),raw);assert.equal(await g.H.leave('topology.html'),false);g.quota(false);g.E.retrySave();await g.flush();assert.equal(g.E.storageStatus().saved,true);assert.equal(g.ids.get('application-submit').disabled,false);
}
// The host must stop Evidence listeners on a V6 update without hiding the
// in-memory draft backup, even after the original save has returned on quota.
{
 const g=applicationsFixture();await g.seed();await g.mount();
 await g.ids.get('application-prepare').onclick();
 g.quota(true);await g.answer('higher');
 const raw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'other-tab'});
 g.data.set(g.E.KEY,raw);g.ctx.dispatchEvent({type:'storage',key:g.E.KEY});
 assert.equal(g.main.inert,true);
 assert.ok(g.ids.get('ee-application-draft-backup'),'protected quota draft remains exportable');
 assert.equal(g.data.get(g.E.KEY),raw);
}
// Reject incompatible parent objects before the legacy owner normalizes them.
for(const kind of ['workspace','benchmark']){
 const g=applicationsFixture();await g.seed();const s=JSON.parse(g.data.get(g.E.KEY));if(kind==='workspace')s.benchmark.learningWorkspace={version:999,preserve:true};else s.benchmark=null;
 const raw=JSON.stringify(s);g.data.set(g.E.KEY,raw);assert.equal(await g.mount(),false);assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.data.has(g.E.KEY+'-corrupt-backup'),false);
}
{
 const g=applicationsFixture();await g.seed();const raw=g.data.get(g.E.KEY);g.failContracts();assert.equal(await g.mount(),false);assert.equal(g.H.hasFailed(),true);assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.main.inert,true);
}
// Same-version replacement while a real Evidence commit is blocked must win unchanged.
{
 const g=applicationsFixture();await g.seed();await g.mount();await g.ids.get('application-prepare').onclick();const release=g.holdLock(),pending=g.answer('lower');await g.tick();
 const s=JSON.parse(g.data.get(g.E.KEY));s.benchmark.learningWorkspace.topologyApplications.currentLesson='llc';const raw=JSON.stringify(s);g.data.set(g.E.KEY,raw);release();await pending;
 assert.equal(g.data.get(g.E.KEY),raw);assert.equal(g.ids.get('guided-applications').dataset.applicationStage,'0');assert.equal(g.ids.get('application-submit').disabled,true);assert.equal(await g.H.leave('topology.html'),false);
}
console.log('PASS applications lifecycle: actual four-exercise flow, wrong-first preservation, no formal grade, readonly resume, raw version/model guard, async overwrite, held lock and quota');
