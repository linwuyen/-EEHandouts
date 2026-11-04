"""Independent reference generator. Not imported by production or JavaScript tests.
Same physical ODE, zero initial state, 160 cycles. SciPy expm state solution,
quad_vec moments and Radau edge crosscheck; no production-derived expectations.
"""
import json,numpy as np
from scipy.linalg import expm
from scipy.integrate import quad_vec,solve_ivp
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,default=Path(__file__).with_name('llc-linear-reference.json'))
args=parser.parse_args()
default=dict(vin=400,fs=110,lr=20,cr=100,lm=120,rdc=8,n=8)
params=[dict(fs=100,lr=10,rdc=20),{},dict(vin=250,fs=120,lr=10,cr=40,lm=240,rdc=18,n=10),dict(vin=275,fs=200,lr=15,cr=80,lm=260,rdc=30,n=11),dict(vin=425,fs=60,lr=10,cr=160,lm=200,rdc=26,n=8),dict(fs=200,lr=60,cr=200,lm=60,rdc=32),dict(vin=450,fs=60,lr=10,cr=40,lm=60,rdc=32,n=12),dict(vin=250,fs=200,lr=60,cr=200,lm=300,rdc=4,n=4),dict(vin=350,fs=90,lr=45,cr=40,lm=60,rdc=32,n=8)]
indices=[0,1,2,3,10,30,60,90,119,120,121,122,123,124,128,180,239,240]
fixtures=[]
for j,over in enumerate(params):
 v=default|over;L=v['lr']*1e-6;C=v['cr']*1e-9;M=v['lm']*1e-6;R=8*v['n']**2*v['rdc']/np.pi**2;T=1/(v['fs']*1000);U=v['vin']/2
 A=np.array([[-R/L,-1/L,R/L],[1/C,0,0],[R/M,0,-R/M]]);E=expm(A*T/2);q=np.zeros(3);eq=np.array([0.,U,0.])
 for _ in range(159):q=eq+E@(q-eq);q=-eq+E@(q+eq)
 start=q.copy();half=eq+E@(start-eq);end=-eq+E@(half+eq)
 def state(t,neg=False):
  e=-eq if neg else eq;s=half if neg else start
  return e+expm(A*t)@(s-e)
 samples=[]
 for i in indices:
  q=state(i*T/240) if i<120 else state((i-120)*T/240,True)
  samples.append(dict(index=i,ir=q[0],vcr=q[1],im=q[2],vp=R*(q[0]-q[2])))
 def moment(t,neg):
  a,b,c=state(t*T,neg);vp=R*(a-c);ang=2*np.pi*(t+(0.5 if neg else 0));u=-U if neg else U
  return np.array([u*a,vp*vp/R,a*a,c*c,2*vp*np.cos(ang),2*vp*np.sin(ang)])
 sums=np.zeros(6);err=0
 for neg in [False,True]:
  r,e=quad_vec(lambda t:moment(t,neg),0,.5,epsabs=1e-9,epsrel=1e-10,points=np.arange(1,120)/240)
  sums+=r;err+=e
 energy=lambda q:(L*q[0]**2+C*q[1]**2+M*q[2]**2)/2
 vo=np.pi*np.hypot(sums[4],sums[5])/(4*v['n'])
 metrics=dict(vo=vo,avgIn=sums[0],avgLoad=sums[1],irRms=np.sqrt(sums[2]),imRms=np.sqrt(sums[3]),energyDrift=(energy(end)-energy(start))/T)
 fixtures.append(dict(params=v,samples=samples,metrics=metrics,quadEstimatedError=float(err)))
 if j==0:
  sol=solve_ivp(lambda t,x:A@x+np.array([-U/L,0,0]),(0,T/2),half,method='Radau',rtol=1e-11,atol=1e-11,dense_output=True)
  assert sol.success
  cross=max(abs(R*((sol.sol(i*T/240)[0]-sol.sol(i*T/240)[2])-(state(i*T/240,True)[0]-state(i*T/240,True)[2]))) for i in range(9))
  assert cross<1e-5,cross
  print('Independent Radau/expm edge crosscheck max error (V):',cross,flush=True)
 print(j,v,'vp121',next(x['vp'] for x in samples if x['index']==121),'vo',vo,flush=True)
out=dict(method='SciPy expm + independent quad_vec moments; zero initial state and 160 full periods',samplesPerCycle=240,fixtures=fixtures)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text('{\n  \"method\":'+json.dumps(out['method'])+',\n  \"samplesPerCycle\":240,\n  \"fixtures\":[\n'+',\n'.join('    '+json.dumps(f,separators=(',',':')) for f in fixtures)+'\n  ]\n}\n',encoding='utf-8')
