/* Boot only the migrated route. No legacy/topology route is silently treated as migrated. */
(()=>{
 'use strict';const H=window.EEWorkbenchHost;if(!H)return;
 try{
  if(H.hasFailed())return;
  for(const name of ['CircuitEvidence','CircuitPlainCourse','CircuitWorkspace','CircuitUnifiedLearning','CircuitCoreFlowV1','CircuitEngineeringSandboxCore','CircuitModelRegistry','CircuitEngineeringCurriculum','CircuitSwitchingLessonV1'])if(!window[name])throw Error('缺少必要元件 '+name);
  const raw=localStorage.getItem(CircuitEvidence.KEY);
  if(raw){const stored=JSON.parse(raw);if(stored.schema!==CircuitEvidence.SCHEMA||stored.version!==CircuitEvidence.VERSION){H.fail('紀錄版本不相容；未啟動或覆寫實驗');return;}}
  const ids=CircuitWorkspace.experimentLessons().map(l=>l.id),hash=location.hash;
  if(hash&&hash!=='#experiment'&&!ids.some(id=>hash==='#experiment-'+id))history.replaceState(null,'','#experiment');
  CircuitWorkspace.mountExperiment();
  if(document.getElementById('experiment-record-protection')){document.documentElement.dataset.eeWorkbenchState='protected';H.notice('紀錄受到保護：請先查看與備份，不會覆寫。');return;}
  H.markReady();
 }catch(error){H.fail('實驗初始化失敗：'+error.message);}
})();
