/* EEHandouts adaptation of pinned Circuit Module 12 diagnosis: first choices are
 * immutable in this in-memory session. This is not an Evidence/grading owner. */
function createSession(answers) {
  const expected=new Map(Object.entries(answers));
  if(expected.size!==3 || [...expected.values()].some(v=>!['sr','gbw','rail','settling'].includes(v)))throw new TypeError('invalid diagnostic contract');
  const first=new Map();
  return Object.freeze({
    choose(key,choice) {
      if(!expected.has(key)||!['sr','gbw','rail','settling'].includes(choice))throw new TypeError('invalid diagnostic choice');
      const correct=choice===expected.get(key);
      if(!first.has(key))first.set(key,correct);
      return {correct,firstWasCorrect:first.get(key),firstCorrect:[...first.values()].filter(Boolean).length,done:first.size,total:expected.size};
    }
  });
}

function mount(doc) {
  const score=doc.getElementById('diagnose-score');
  const boxes=[...doc.querySelectorAll('.choice[data-case][data-answer]')];
  if(!score||boxes.length!==3||new Set(boxes.map(box=>box.dataset.case)).size!==3)throw new Error('diagnosis markup incomplete');
  const answers=Object.fromEntries(boxes.map(box=>[box.dataset.case,box.dataset.answer]));
  if(answers.A!=='sr'||answers.B!=='gbw'||answers.C!=='settling')throw new Error('diagnosis source answers mismatch');
  const controls=boxes.map(box=>{
    const buttons=[...box.querySelectorAll('button[data-choice]')];
    const feedback=doc.getElementById('feedback-'+box.dataset.case);
    if(buttons.length!==3||!feedback||!buttons.some(b=>b.dataset.choice===box.dataset.answer))throw new Error('diagnosis buttons missing');
    return {box,buttons,feedback};
  });
  const session=createSession(answers);
  for(const {box,buttons,feedback} of controls) {
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const result=session.choose(box.dataset.case,button.dataset.choice);
      for(const b of buttons){b.classList.toggle('correct',b===button&&result.correct);b.classList.toggle('wrong',b===button&&!result.correct);b.setAttribute('aria-pressed',String(b===button));}
      feedback.textContent=result.firstWasCorrect?'本題首次判斷正確。':'本題首次判斷不正確；後續改選不會更改首次得分。';
      score.textContent=`${result.firstCorrect}/3 first choices correct · ${result.done}/3 completed（僅此頁練習，不是正式成績）`;
      score.className='status '+(result.done===3&&result.firstCorrect===3?'':'warn');
    }));
  }
  // Enable only after all three valid cases and feedback elements are installed.
  for(const {buttons} of controls)for(const button of buttons)button.disabled=false;
  score.textContent='0/3 completed · 僅此頁練習，未寫入正式成績';
  doc.documentElement.dataset.eeDiagnosisState='ready';
  return session;
}

const api=Object.freeze({createSession,mount});
if(typeof module!=='undefined' && module.exports) module.exports=api;
if(typeof window!=='undefined') window.EEOpampDiagnosis=api;
if(typeof document!=='undefined') {
  try{mount(document);}catch(error){
    document.documentElement.dataset.eeDiagnosisState='failed';
    const status=document.getElementById('diagnose-score');
    if(status)status.textContent='診斷互動無法載入；未記錄任何得分。可返回觀念課。';
  }
}
