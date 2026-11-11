import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {after, before, test} from 'node:test';
import {chromium} from 'playwright';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const url = base + '/workbench/v8-assessment.html?module=afe';
const key = 'circuit-learning-state-v5';
const family = 'afe-phase-power';
const question = '#ee-formal-question';
const summary = '#ee-formal-summary';
const confidence = '#ee-formal-confidence';
const ready = '#ee-v8-formal-root[data-state="ready"]';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(ctx) {
  const page = await ctx.newPage();
  await page.goto(url);
  await page.locator(ready).waitFor();
  return page;
}
async function select(page, choice) {
  await page.locator('input[name="ee-formal-choice"][value="' + choice + '"]').check();
}
async function answer(page, choice) {
  await select(page, choice);
  await page.locator('#ee-formal-submit').click();
  await page.locator('#ee-formal-feedback').waitFor();
}
async function context(t) {
  const ctx = await browser.newContext({acceptDownloads:true});
  t.after(() => ctx.close());
  return ctx;
}
async function downloadBackup(page) {
  const safe = page.locator('#ee-v8-safe-backup');
  const button = await safe.isVisible() ? safe : page.locator('#ee-formal-backup');
  const downloaded = page.waitForEvent('download');
  await button.click();
  return JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
}

test('export keeps the selected answer and confidence when another tab commits', async t => {
  const ctx = await context(t);
  const writer = await open(ctx);
  const learner = await open(ctx);
  await select(learner, 'sin');
  await learner.locator(confidence).selectOption('0.75');
  await answer(writer, 'cos');
  await learner.locator('#ee-v8-formal-root[data-state="protected"]').waitFor();

  const data = await downloadBackup(learner);
  assert.equal(data.unsubmittedAnswer?.status, 'unsubmitted');
  assert.equal(data.unsubmittedAnswer.questionId, family);
  assert.equal(data.unsubmittedAnswer.familyId, family);
  assert.equal(data.unsubmittedAnswer.variantId, 'A');
  assert.equal(data.unsubmittedAnswer.choiceId, 'sin');
  assert.equal(data.unsubmittedAnswer.confidence, 0.75);
  assert.equal(data.pendingDraft, null);
  const history = JSON.parse(data.currentRaw).questions[family].history;
  assert.deepEqual(history.map(entry => entry.choiceId), ['cos']);
  assert.equal(await writer.evaluate(k => localStorage.getItem(k), key), data.currentRaw);
});

test('successful submission shows persisted progress and locks the saved confidence', async t => {
  const page = await open(await context(t));
  await page.locator(confidence).selectOption('0.75');
  await answer(page, 'sin');
  assert.match(await page.locator(summary).innerText(), /1 筆/);
  assert.ok(await page.locator(confidence).isDisabled());
  assert.match(await page.locator('#ee-formal-feedback').innerText(), /把正交分量當實功/);
  assert.match(await page.locator('#ee-formal-feedback').innerText(), /PF = cosφ/);
  assert.match(await page.locator('#ee-formal-feedback').innerText(), /P=Vrms·Irms·cosφ/);
  assert.equal((await downloadBackup(page)).unsubmittedAnswer, null);
  await page.locator('#ee-formal-next').click();
  await page.locator(question + '[data-role="transfer"]').waitFor();
  assert.ok(await page.locator(confidence).isEnabled());
  assert.equal(await page.locator(confidence).inputValue(), '');
  await answer(page, 'correct');
  assert.match(await page.locator(summary).innerText(), /2 筆／遷移 PASS/);
});

for (const wake of ['timer', 'foreground']) {
  test('a waiting lesson becomes available at the scheduled time via ' + wake, async t => {
    const page = await open(await context(t));
    await answer(page, 'cos');
    await page.locator('#ee-formal-next').click();
    await page.locator(question + '[data-role="transfer"]').waitFor();
    await answer(page, 'correct');
    await page.locator('#ee-formal-next').click();
    await page.locator(question).waitFor({state:'hidden'});
    const raw = await page.evaluate(k => localStorage.getItem(k), key);
    const last = JSON.parse(raw).questions[family].history.at(-1);
    const due = Date.parse(last.at) + 86400000;
    await page.clock.install({time:new Date(due - 30000)});
    await page.reload();
    await page.locator(ready).waitFor();
    assert.equal(await page.locator(question).isVisible(), false);
    assert.match(await page.locator(summary).innerText(), /\d{1,2}:\d{2}/, 'display the review time within the date');
    if (wake === 'timer') {
      await page.clock.fastForward(60000);
    } else {
      // setSystemTime simulates a suspended tab without running its scheduled callbacks.
      await page.clock.setSystemTime(new Date(due + 30000));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    }
    await page.locator(question + '[data-role="retention"]').waitFor({timeout:3000});
    await select(page, 'sin');
    await page.locator(confidence).selectOption('0.5');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.clock.fastForward(120000);
    assert.equal(await page.locator('input:checked').inputValue(), 'sin');
    assert.equal(await page.locator(confidence).inputValue(), '0.5');
    assert.equal(await page.evaluate(k => localStorage.getItem(k), key), raw);
    await answer(page, 'correct');
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    assert.ok(await page.locator('#ee-formal-feedback').isVisible());
    assert.match(await page.locator(summary).innerText(), /複習 1\/4/);
  });
}
