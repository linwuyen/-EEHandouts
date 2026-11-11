import assert from 'node:assert/strict';
// Inspect actual SVG geometry, not the code that generated it. The diagram's
// fixed axes are x=38..356 and lane baselines 48/111/169, 23 px per logical 1.
export function assertBridgePaths(paths,{mode,da,db}){
 assert.equal(paths.length,3,'F02 VA/VB/VAB must share three lanes');
 const lanes=paths.map((path,lane)=>{
  assert.doesNotMatch(path,/\bL/,'F02 switching edges must not be diagonal');
  const tokens=[...path.matchAll(/([MHV])\s*(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/g)];
  const points=[];let x,y;
  for(const [,cmd,one,two] of tokens){
   if(cmd==='M'){x=Number(one);y=Number(two);points.push([x,y]);}
   else if(cmd==='H'){x=Number(one);points.push([x,y]);}
   else{y=Number(one);points.push([x,y]);}
  }
  assert.ok(points.length>2,'F02 nonempty path');
  assert.equal(points[0][0],38,'F02 left time boundary');
  for(let j=1;j<points.length;j++)assert.ok(points[j][0]>=points[j-1][0],
   'F02 time must not go backwards: '+points[j-1][0]+' -> '+points[j][0]);
  assert.equal(points.at(-1)[0],356,'F02 right time boundary');
  const offset=[48,111,169][lane];
  return points.map(([xx,yy])=>[xx,(offset-yy)/23]);
 });
 const b=mode==='bipolar'?1-da/100:db/100,means=[da/100,b,da/100-b];
 for(let lane=0;lane<3;lane++){
  const points=lanes[lane];let area=0;
  for(let j=1;j<points.length;j++)area+=points[j-1][1]*(points[j][0]-points[j-1][0])/318;
  // Sample the actual SVG away from any switch. A leading-edge pulse can
  // have the correct mean but twice the motor current ripple of P.32.
  for(let k=0;k<40;k++){
   const phase=(k+.5)/40,x=38+318*phase;
   const carrier=mode==='bipolar'?phase:2*Math.min(phase,1-phase);
   const va=Number(carrier<da/100);
   const vb=mode==='bipolar'?1-va:Number(carrier<db/100);
   assert.equal(points.findLast(([t])=>t<=x)[1],[va,vb,va-vb][lane],
    'Bridge state at phase '+phase+' on lane '+lane);
  }
  assert.ok(Math.abs(area-means[lane])<1e-10,'F02 waveform average must agree with duty on lane '+lane);
  for(let j=0;j<points.length;j++){
   assert.equal(points[j][0],lanes[0][j][0],'F02 synchronized time axes');
   assert.equal(lanes[2][j][1],lanes[0][j][1]-lanes[1][j][1],'F02 VAB = VA - VB');
  }
 }
}
