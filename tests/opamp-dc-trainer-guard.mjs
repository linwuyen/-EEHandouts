import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../workbench/12_opamp_slew_rate/assets/opamp-dc-trainer.js');
const {createGuard}=require('../workbench/ee-opamp-dc-entry.js');
const KEY='opamp-dc-reasoning-trainer-v2';
function fixture(raw=null){
 const data=new Map(raw===null?[]:[[KEY,raw]]);let quota=false;
 const store={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem(k,v){if(quota)throw new DOMException('full','QuotaExceededError');data.set(k,v);},
  removeItem:k=>data.delete(k),
  fail:v=>quota=v,
  raw:()=>store.getItem(KEY),
  foreign:v=>data.set(KEY,v)
 };
 return store;
}
const snapshot=()=>JSON.stringify(new T.MasteryTracker().snapshot());
test('original deterministic model unchanged',()=>{
 const result=T.Solver.solve(new T.CircuitModel({vplus:1.8,vleft:1.2,rleftK:20,rfK:40}));
 assert.equal(result.leftCurrentMagnitudeUa,30);assert.equal(result.feedbackDropV,1.2);assert.equal(result.vout,3);
});
test('guard persists the original trainer mastery while keeping source solver owner',()=>{
 const store=fixture(),events=[],guard=createGuard(store,e=>events.push(e));
 assert.equal(guard.ok(),true);
 const session=new T.SessionManager({storage:guard.storage,seed:'guard'});
 session.current={skill:'UNIT_CONVERSION',answerType:'number',expected:1.2,errorType:'UNIT_CONVERSION',signature:'unit',kind:'main',hints:[]};
 session.submit(1.2);
 assert.equal(JSON.parse(store.raw()).skills.UNIT_CONVERSION.attempts,1);
 assert.equal(events.at(-1).type,'saved');
});
test('source reset never deletes stored bytes before successful replacement',()=>{
 const old=snapshot(),store=fixture(old),guard=createGuard(store);
 guard.storage.removeItem(KEY);assert.equal(store.raw(),old);
 store.fail(true);assert.throws(()=>guard.storage.setItem(KEY,snapshot()),/QuotaExceededError/);
 assert.equal(store.raw(),old);assert.equal(guard.ok(),false);
});
test('failed save keeps raw bytes, exposes in-memory draft, blocks subsequent mutation',()=>{
 const old=snapshot(),store=fixture(old),guard=createGuard(store);
 const session=new T.SessionManager({storage:guard.storage,seed:'quota'});
 store.fail(true);
 session.current={skill:'UNIT_CONVERSION',answerType:'number',expected:1,errorType:'UNIT_CONVERSION',signature:'q',kind:'main',hints:[]};
 session.submit(1);
 assert.equal(guard.ok(),false);assert.equal(store.raw(),old);
 assert.equal(JSON.parse(guard.backup().draft).skills.UNIT_CONVERSION.attempts,1);
 assert.throws(()=>guard.storage.setItem(KEY,snapshot()),/protected/);
});
test('unknown and malformed existing records stay byte-identical and fail closed',()=>{
 for(const raw of ['broken',JSON.stringify({version:'999.0.0',skills:{}}),JSON.stringify({version:'1.1.0',skills:{}})]){
  const store=fixture(raw),guard=createGuard(store);
  assert.equal(guard.ok(),false);assert.equal(store.raw(),raw);assert.equal(guard.backup().raw,raw);
 }
});
test('same-version unknown fields and fractional counters preserve raw bytes',()=>{
 const base=JSON.parse(snapshot());
 const extraTop=JSON.stringify({...base,future:'unrecognized'});
 const extraSkill=JSON.stringify({...base,skills:{...base.skills,UNIT_CONVERSION:{...base.skills.UNIT_CONVERSION,future:1}}});
 const fractional=JSON.stringify({...base,skills:{...base.skills,UNIT_CONVERSION:{...base.skills.UNIT_CONVERSION,attempts:0.5,correct_count:0.5}}});
 for(const raw of [extraTop,extraSkill,fractional]){
  const store=fixture(raw),guard=createGuard(store);
  assert.equal(guard.ok(),false);assert.equal(store.raw(),raw);assert.equal(guard.backup().raw,raw);
 }
});
test('foreign tab winner is protected against stale same-version write',()=>{
 const old=snapshot(),store=fixture(old),guard=createGuard(store);
 const winner=JSON.stringify({version:'999.0.0',owner:'other'});
 store.foreign(winner);
 assert.throws(()=>guard.storage.setItem(KEY,snapshot()),/changed/);
 assert.equal(store.raw(),winner);assert.equal(guard.ok(),false);
});
test('storage clear and same-key events trigger protection, unrelated keys do not',()=>{
 const store=fixture(snapshot()),guard=createGuard(store);
 guard.onStorage({key:'unrelated'});assert.equal(guard.ok(),true);
 store.foreign(null);guard.onStorage({key:null});assert.equal(guard.ok(),false);
});
test('storage access exception rejects initialization without inventing progress',()=>{
 const store={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const guard=createGuard(store);assert.equal(guard.ok(),false);assert.equal(guard.backup().raw,null);
});
console.log('PASS OP DC trainer storage: quota, atomic reset, version, conflict, source truth and backup');