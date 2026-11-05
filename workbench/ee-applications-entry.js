/* One isolated local mount; unsupported raw evidence is never normalized on entry. */
(async()=>{
 'use strict';const H=window.EEWorkbenchHost;if(!H)return;
 const main=document.querySelector('main');if(main)main.inert=true;
 try{
  if(H.hasFailed()||!H.guardEvidence())return;
  for(const name of ['CircuitEvidence','CircuitWorkspace','CircuitModelRegistry','CircuitEngineeringCurriculum','CircuitTopologyTransferV1','CircuitTopologyAtlas','EEApplicationsContract'])if(!window[name])throw Error('缺少必要元件 '+name);
  if(!CircuitTopologyAtlas.ready)throw Error('原工具尚未完成初始化');
  const mounted=await CircuitWorkspace.mountApplications();
  if(mounted!==true||H.hasFailed()||!H.guardEvidence())return;
  if(H.markReady()&&main)main.inert=false;
 }catch(error){H.fail('電路應用初始化失敗：'+error.message);}
})();
