/* Independent physics, validity-domain and page-to-lesson contracts for upper P.12-26. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={},course={};
runInNewContext(readFileSync('upper-page-guides.js','utf8'),{window:context});
runInNewContext(readFileSync('data.js','utf8'),{window:course});
const guides=context.EE_UPPER_PAGE_GUIDES,lessons=course.EE_DATA.chapters.flatMap(c=>c.lessons);
const mapping={12:'ampere',13:'ampere',14:'bh',15:'reluctance',16:'reluctance',
17:'reluctance',18:'reluctance',19:'reluctance',20:'faraday',21:'inductor',
22:'transformer',23:'transformer',24:'transformer',25:'transformer',26:'transformer'};
const titles=new Set();
for(let p=12;p<=26;p++){
  const g=guides[p],lesson=lessons.find(l=>l.id===g?.lesson);
  assert.ok(g&&lesson,'Missing original magnetic page or linked lesson P.'+p);
  assert.equal(g.lesson,mapping[p],'Wrong lesson reference P.'+p);
  assert.ok(!titles.has(g.title),'Duplicate guide title P.'+p);titles.add(g.title);
  const range=String(lesson.pages).match(/\d+/g).map(Number);
  assert.ok(range[0]<=p&&p<=(range[1]??range[0]),'Outside original lesson range P.'+p);
  for(const k of ['title','question','takeaway','pitfall','tryIt'])
    assert.ok(typeof g[k]==='string'&&g[k].length>=16,'thin '+k+' P.'+p);
  assert.ok(g.intuition.length===2&&g.intuition.every(s=>s.length>=35),'physical intuition P.'+p);
  assert.ok(g.steps.length>=3&&g.steps.every(s=>s.title.length>=7&&s.detail.length>=35),'signal/magnetic flow P.'+p);
  assert.ok(g.equations.length>=2&&g.equations.every(s=>s.tex&&s.plain&&s.why.length>=24),'formula/domain P.'+p);
  assert.ok(g.worked.given.length>=24&&g.worked.steps.length>=3&&g.worked.result.length>=30,'numerical exercise P.'+p);
  assert.ok(g.assumptions.length>=2&&g.assumptions.every(s=>s.length>=25),'validity boundaries P.'+p);
  assert.ok(g.check.q.length>=16&&g.check.a.length>=20,'comprehension P.'+p);
}
function near(x,y,tolerance,msg){
  assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tolerance,msg+': '+x+' expected '+y);
}
const mu0=4*Math.PI*1e-7;
// P12: Ampere circuit with a single uniform-area gap.
const gapB=mu0*100/(.001+.10/2000);
near(gapB,.11967972013675404,1e-12,'P12 flux density');
near(gapB/mu0*.001,95.23809523809524,1e-9,'P12 gap ampere turns');
near(gapB/(mu0*2000)*.10,4.761904761904762,1e-9,'P12 core ampere turns');
// P13: toroid magnetomotive force and H.
near(50*1.2/.30,200,1e-10,'P13 mean H');
// P14: two local B-H slopes, magnetizing current ramps.
const muLinear=(.30-.20)/(200-100),muFlat=(.85-.80)/(1000-800);
near(muLinear,.001,1e-12,'P14 linear example');
near(muFlat,.00025,1e-12,'P14 flat example');
near(muLinear/muFlat,4,1e-12,'P14 Linc ratio');
// P15: signed flux continuity, area and B.
const flux3=-(80e-6+20e-6);
near(flux3,-100e-6,1e-15,'P15 signed flux');
near(Math.abs(flux3)/(400e-6),.25,1e-12,'P15 B');
// P16 magnetic reluctance, flux and B.
const reluctance=.20/(mu0*1000*100e-6);
near(reluctance,1591549.4309189536,1e-5,'P16 reluctance');
near(50/reluctance,Math.PI*1e-5,1e-12,'P16 flux');
near((50/reluctance)/(100e-6),Math.PI/10,1e-12,'P16 B');
// P17: physical units differ even for a formal analogy.
near(50/2e6,25e-6,1e-12,'P17 magnet flux');
// P18 series reluctance and MMF drops.
near(100/(2e6+3e6),20e-6,1e-12,'P18 series flux');
near(20e-6*2e6+20e-6*3e6,100,1e-12,'P18 loop MMF');
// P19 common center plus parallel return limbs.
const parallel=(2e6*3e6)/(2e6+3e6),center=120/(1e6+parallel);
const left=center*parallel/2e6,right=center*parallel/3e6;
near(parallel,1.2e6,1e-9,'P19 parallel return');
near(center,120/2.2e6,1e-12,'P19 shared flux');
near(left,32.727272727272725e-6,1e-12,'P19 left');
near(right,21.81818181818182e-6,1e-12,'P19 right');
near(left+right,center,1e-12,'P19 continuity');
assert.ok(left>right,'P19 lower reluctance must carry higher flux');
// P20 Faraday: voltage magnitude and sign reference are separate.
near(100*.0005/.010,5,1e-12,'P20 Faraday emf');
// P21 inductance, energy and current slope.
const L=100**2/2e6;
near(L,.005,1e-12,'P21 L');
near(.5*L*1**2,.0025,1e-12,'P21 stored energy');
near(L*1000,5,1e-12,'P21 voltage');
near((200**2/2e6)/L,4,1e-12,'P21 N squared');
// P22 magnetizing current vs load-reflected primary component.
const im=2-(50/100)*3;
near(im,.5,1e-12,'P22 magnetizing current');
near(100*im/1e6,50e-6,1e-12,'P22 main flux');
// P23 distinct magnetizing and winding leakage terms.
near(100**2/2e6,5e-3,1e-12,'P23 magnetizing inductance');
near(100**2/100e6,100e-6,1e-12,'P23 primary leakage');
near(50**2/100e6,25e-6,1e-12,'P23 secondary leakage');
// P24 ideal transformer current, port power, Z reflection.
near(100*(50/100),50,1e-12,'P24 E2');
near(50/10,5,1e-12,'P24 I2');
near(10*(100/50)**2,40,1e-12,'P24 reflected resistance');
near(100/40,2.5,1e-12,'P24 I1');
near(50*5,100*2.5,1e-12,'P24 ideal power balance');
// P25 iron-loss branch versus referred R and L.
near(.20*(100/50)**2,.8,1e-12,'P25 referred R');
near(50e-6*(100/50)**2,200e-6,1e-12,'P25 referred L');
near(100**2/10000,1,1e-12,'P25 modeled core loss');
// P26 B-H loop energy density, volume and traversal frequency.
near(200*2e-6,.0004,1e-12,'P26 E cycle');
near(200*2e-6*50e3,20,1e-12,'P26 hysteresis power');
console.log('PASS upper magnetics P12-26: 15 source pages, domain caveats and independent numeric evidence');
