import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {chromium} from 'playwright';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const modules = ['inverter', 'foc', 'pi', 'loop10us', 'bms', 'ad5543', 'c2000-dds', 'afe', 'acmc-pro'];
const key = 'circuit-learning-state-v5';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openModule(page, moduleId) {
  await page.goto(base + '/workbench/v8-assessment.html?module=' + moduleId);
  await page.locator('#ee-formal-question[data-variant="A"]').waitFor();
}

test('the correct baseline choice appears in all four positions across the nine learner pages', async () => {
  const page = await browser.newPage();
  try {
    const positions = new Set();
    for (const moduleId of modules) {
      await openModule(page, moduleId);
      const correctId = await page.evaluate(id =>
        window.CircuitAssessmentV8.baseQuestions.find(q => q.moduleId === id).options.find(o => o.correct).id, moduleId);
      const choices = await page.locator('#ee-formal-choices input').evaluateAll(nodes => nodes.map(node => node.value));
      assert.equal(choices.length, 4, moduleId);
      assert.ok(choices.includes(correctId), moduleId);
      positions.add(choices.indexOf(correctId));
    }
    assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
  } finally { await page.close(); }
});

async function seedFocHistory(page, includeOldSwap) {
  await openModule(page, 'foc');
  const history = await page.evaluate(async ({key, includeOldSwap}) => {
    const assessment = window.CircuitAssessment, evidence = window.CircuitEvidence;
    const family = 'foc-park-frame';
    const items = assessment.expandQuestions([window.CircuitQuizBank.questions.find(q => q.id === family)]);
    const state = evidence.load(), start = Date.now() - 60_000;
    // Each failure is recorded against the next variant actually offered by the original scheduler.
    for (let n = 0; n < 38; n++) {
      const at = start + n * 1000;
      const q = assessment.nextQuestion(items, state.questions[family], at);
      assessment.recordAttempt(state, q, q.options.find(o => !o.correct), {at: new Date(at).toISOString()});
    }
    const at = start + 38_000;
    const next = assessment.nextQuestion(items, state.questions[family], at);
    if (next.variantId !== 'T38') throw Error('fixture expected T38, got ' + next.variantId);
    if (includeOldSwap) {
      assessment.recordAttempt(state, next, next.options.find(o => o.id === 'swap'), {at: new Date(at).toISOString()});
    }
    evidence.save(state);
    if (!(await evidence.flush()).saved) throw Error('failed to save FOC history');
    return JSON.parse(localStorage.getItem(key)).questions[family].history;
  }, {key, includeOldSwap});
  await page.reload();
  return history;
}

function readFocHistory(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)).questions['foc-park-frame'].history, key);
}

test('selecting the unique numeric answer at 45° earns T38 credit and preserves previous attempts', async () => {
  const page = await browser.newPage();
  try {
    const previous = await seedFocHistory(page, false);
    await page.locator('#ee-formal-question[data-variant="T38"]').waitFor();
    const answer = page.getByRole('radio', {name: 'vd≈0.566, vq≈0.566', exact: true});
    assert.equal(await answer.count(), 1, 'the correct and swapped choices coincide at 45°');
    await answer.check();
    await page.locator('#ee-formal-submit').click();
    await page.locator('#ee-formal-feedback').waitFor();
    await page.reload();
    await page.locator('#ee-v8-formal-root[data-state="ready"]').waitFor();
    const stored = await readFocHistory(page);
    assert.deepEqual(stored.slice(0, -1), previous);
    const {variantId, choiceId, correct} = stored.at(-1);
    assert.deepEqual({variantId, choiceId, correct}, {variantId: 'T38', choiceId: 'correct', correct: true});
  } finally { await page.close(); }
});

test('an old wrong T38 swap keeps its original grade when the learner reopens the module', async () => {
  const page = await browser.newPage();
  try {
    const previous = await seedFocHistory(page, true);
    await page.locator('#ee-formal-question[data-variant="T39"]').waitFor();
    assert.deepEqual(await readFocHistory(page), previous);
    assert.equal(previous.at(-1).choiceId, 'swap');
    assert.equal(previous.at(-1).correct, false);
  } finally { await page.close(); }
});
