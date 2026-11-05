/* Boot the locally owned comparison; numerical/evidence owners remain unchanged. */
(async()=>{
 'use strict';const H=window.EEWorkbenchHost;if(!H)return;
 try{
  if(H.hasFailed()||!H.guardEvidence())return;
  for(const name of ['CircuitEvidence','CircuitPlainCourse','CircuitWorkspace','CircuitUnifiedLearning','CircuitCoreFlowV1','CircuitModelRegistry','CircuitEngineeringCurriculum','CircuitTopologyTransferV1'])if(!window[name])throw Error('缺少必要元件 '+name);
  const mounted=await CircuitWorkspace.mountTopology();
  if(mounted!==true||!H.guardEvidence()||H.hasFailed())return;
  H.markReady();
 }catch(error){H.fail('比較初始化失敗：'+error.message);}
})();
