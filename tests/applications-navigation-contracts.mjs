/* Real host/Evidence save boundary, without a browser or layout claims. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applicationsFixture} from './helpers/applications-fixture.mjs';
const routes=['applications.html','applications.html#guided-applications',...['buck','boost','pfc','psfb','llc','inverter'].map(id=>'applications.html#'+id),...['pfc','psfb','llc','inverter'].map(id=>'applications.html?lesson='+id+'#guided-applications')];
for(const route of routes){
 const f=applicationsFixture();await f.seed();f.H.markReady();const raw=f.data.get(f.E.KEY);
 assert.equal(await f.H.leave(route),true,'new local application destination '+route);
 assert.equal(f.navigations[0],new URL(route,f.ctx.location.href).href);
 assert.equal(f.data.get(f.E.KEY),raw,'navigation does not grade or change evidence');
}
for(const route of ['applications.html?lesson=alien#guided-applications','applications.html?from=https://attacker.invalid','https://attacker.invalid/applications.html','//attacker.invalid/applications.html','applications.html?lesson=pfc&from=elsewhere#guided-applications']){
 const f=applicationsFixture();await f.seed();f.H.markReady();assert.equal(await f.H.leave(route),false,route);assert.equal(f.navigations.length,0);
}
{
 const f=applicationsFixture();await f.seed();f.H.markReady();
 assert.equal(f.H.referenceHref('17_power_topology_control/index.html#guided-applications'),'applications.html#guided-applications');
 assert.equal(f.H.referenceHref('17_power_topology_control/index.html?lesson=llc#guided-applications'),'applications.html?lesson=llc#guided-applications');
 assert.equal(f.H.referenceHref('17_power_topology_control/index.html?lesson=alien#guided-applications'),'coverage.html');
 for(const id of ['buck','boost','pfc','psfb','llc','inverter'])assert.equal(f.H.referenceHref('17_power_topology_control/index.html#'+id),'applications.html#'+id,'source deep link '+id);
 assert.equal(f.H.referenceHref('17_power_topology_control/index.html#unknown'),'coverage.html');
 assert.equal(f.H.referenceHref('index.html#applications'),'applications.html');
 const b=f.ctx.document.createElement('button');f.H.recommendation({id:'applications'},b);assert.equal(b.hidden,false);assert.equal(b.dataset.route,'applications.html');await b.onclick();assert.match(f.navigations[0],/applications\.html$/);
}
{
 const f=applicationsFixture();await f.seed();f.H.markReady();const release=f.holdLock(),s=f.E.load();s.benchmark.navigationDraft='preserve';f.E.save(s);
 const pending=f.H.leave('applications.html');await f.tick();assert.equal(f.navigations.length,0);release();assert.equal(await pending,true);assert.equal(JSON.parse(f.data.get(f.E.KEY)).benchmark.navigationDraft,'preserve');
}
{
 const f=applicationsFixture();await f.seed();f.H.markReady();f.quota(true);const s=f.E.load();s.benchmark.navigationDraft='not saved';f.E.save(s);
 assert.equal(await f.H.leave('applications.html'),false);assert.equal(f.navigations.length,0);assert.equal(f.E.storageStatus().saved,false);
}
{
 const f=applicationsFixture();await f.seed();f.H.markReady();const release=f.holdLock(),s=f.E.load();s.benchmark.navigationDraft='stale';f.E.save(s);
 const pending=f.H.leave('applications.html'),raw=JSON.stringify({schema:'circuit-learning-state',version:6,preserve:'future'});f.data.set(f.E.KEY,raw);release();assert.equal(await pending,false);assert.equal(f.navigations.length,0);assert.equal(f.data.get(f.E.KEY),raw);
}
// Every route entry must resolve to a real owned page, not silently remain unavailable.
const ui=readFileSync('workbench/assets/learning/workspace-topology-ui.js','utf8');
assert.ok(ui.includes("if(W.topologyProof(session))EEWorkbenchHost.leave('applications.html')"),'completed comparison uses source proof before local applications');
const entry=readFileSync('workbench/ee-entry.js','utf8');assert.ok(entry.includes("'#applications'"),'startup resolves the application hash');
console.log('PASS application navigation: exact local routes, source recommendation, proof gate, flush, quota and version guard');

// Real source Evidence can report saved while a same-version storage event is
// still queued. The mounted application's record guard must run at BOTH
// navigation boundaries; root schema validation alone cannot see this change.
for(const timing of ['before-flush','after-flush-start']){
 for(const kind of ['same-version','nested-future']){
  const f=applicationsFixture();await f.seed();assert.equal(await f.mount(),true);
  await f.ids.get('application-prepare').onclick();
  const state=JSON.parse(f.data.get(f.E.KEY));
  if(kind==='same-version')state.benchmark.learningWorkspace.topologyApplications.currentLesson='psfb';
  else state.benchmark.learningWorkspace.topologyApplications.version=999;
  const winner=JSON.stringify(state);let leaving;
  if(timing==='after-flush-start')leaving=f.H.leave('topology.html');
  f.data.set(f.E.KEY,winner); // intentionally no storage event delivered yet
  f.writes.length=0;
  if(!leaving)leaving=f.H.leave('topology.html');
  assert.equal(await leaving,false,kind+' '+timing+' must cancel stale-page navigation');
  assert.deepEqual(f.navigations,[],kind+' '+timing+' does not leave');
  assert.equal(f.data.get(f.E.KEY),winner,kind+' '+timing+' preserves winner bytes');
  assert.equal(f.writes.length,0,kind+' '+timing+' does not repair/write evidence');
  assert.equal(f.ctx.document.documentElement.dataset.eeWorkbenchState,'protected');
  assert.equal(f.main.inert,true);
 }
}
{
 const f=applicationsFixture();await f.seed();assert.equal(await f.mount(),true);
 await f.ids.get('application-prepare').onclick();const raw=f.data.get(f.E.KEY);f.writes.length=0;
 assert.equal(await f.H.leave('topology.html'),true,'compatible mounted record can still leave');
 assert.equal(f.data.get(f.E.KEY),raw);assert.equal(f.writes.length,0);
}
{
 const f=applicationsFixture();await f.seed();assert.equal(await f.mount(),true);
 await f.ids.get('application-prepare').onclick();const release=f.holdLock();
 const answer=f.answer('higher');await f.tick();
 const leaving=f.H.leave('topology.html');await f.tick();assert.deepEqual(f.navigations,[],'registered guard still waits for pending real commit');
 release();await answer;assert.equal(await leaving,true);
 assert.equal(JSON.parse(f.data.get(f.E.KEY)).benchmark.learningWorkspace.topologyApplications.rows.pfc.first.answer,'higher');
}
{
 const f=applicationsFixture();await f.seed();assert.equal(await f.mount(),true);f.quota(true);
 await f.ids.get('application-prepare').onclick();
 assert.equal(await f.H.leave('topology.html'),false,'registered guard cannot bypass a quota failure');
 assert.deepEqual(f.navigations,[]);f.quota(false);f.E.retrySave();await f.flush();await f.tick();
 assert.equal(await f.H.leave('topology.html'),true,'retry saves the same draft before navigation');
}
console.log('PASS mounted application navigation: queued updates rejected before/after flush; compatible/pending/retry paths retained');
