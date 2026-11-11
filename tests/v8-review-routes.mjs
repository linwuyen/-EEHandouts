import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {chromium, firefox, webkit} from 'playwright';

const base = (process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173') + '/workbench/';
const key = 'circuit-learning-state-v5';
const engines = process.argv.includes('--cross-browser') ? {firefox, webkit} : {chromium};
for (const [name, engine] of Object.entries(engines)) {
  let browser;
  before(async () => { browser = await engine.launch(); });
  after(async () => { await browser.close(); });

  test(name + ' prerequisite links open the named family without grading another question', async () => {
    const page = await browser.newPage();
    try {
      const routes = [
        ['acmc-pro', 'Buck 理想模型適用條件', 'buck-model-validity'],
        ['afe', 'ADC 分壓與功率', 'adc-divider-power'],
        ['bms', 'ADC 電流量測偏移', 'adc-offset-purpose'],
        ['ad5543', 'SPI 時脈極性與相位', 'spi-cpol-cpha'],
      ];
      for (const [module, label, family] of routes) {
        await page.goto(base + 'v8-assessment.html?module=' + module);
        await page.getByRole('link', {name:label, exact:true}).click();
        await page.waitForSelector('#ee-formal-choices input');
        assert.equal(await page.locator('#ee-formal-question').getAttribute('data-family'), family, label);
      }
      assert.deepEqual(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).questions, key), {});
    } finally { await page.close(); }
  });

  test(name + ' workbench opens the oldest migrated due family and advances after real review', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(base + 'v8-assessment.html');
      await page.waitForSelector('#ee-formal-choices input');
      await page.evaluate(async () => {
        const A = window.CircuitAssessment, E = window.CircuitEvidence, state = E.load();
        for (const [id, days] of [['afe-phase-power',2], ['buck-model-validity',3]]) {
          const baseQuestion = window.CircuitQuizBank.questions.find(q => q.id === id);
          const group = A.expandQuestions([baseQuestion]);
          for (const [i, q] of group.slice(0, 2).entries()) {
            A.recordAttempt(state, q, q.options.find(o => o.correct), {
              at:new Date(Date.now() - days * A.DAY_MS + i).toISOString(),
            });
          }
        }
        E.save(state);
        if (!(await E.flush()).saved) throw Error('Unable to seed due reviews');
      });
      for (const [family, route] of [['buck-model-validity','buck-assessment.html?family=buck-model-validity'], ['afe-phase-power','v8-assessment.html?module=afe']]) {
        await page.goto(base + 'index.html#experiment');
        const resume = page.locator('#resume-task');
        await resume.waitFor({state:'visible'});
        assert.equal(await resume.getAttribute('data-route'), route);
        await resume.click();
        await page.waitForSelector('#ee-formal-question[data-role="retention"]');
        assert.equal(await page.locator('#ee-formal-question').getAttribute('data-family'), family);
        const correct = await page.evaluate(id => {
          const q = window.CircuitQuizBank.questions.find(q => q.id === id);
          const group = window.CircuitAssessment.expandQuestions([q]);
          const answer = window.CircuitEvidence.load().questions[id];
          return window.CircuitAssessment.nextQuestion(group,answer,Date.now()).options.find(o => o.correct).id;
        }, family);
        await page.locator('#ee-formal-choices input[value="' + correct + '"]').check();
        await page.locator('#ee-formal-submit').click();
        await page.waitForSelector('#ee-formal-feedback:visible');
        assert.equal(await page.evaluate(([k,id]) => JSON.parse(localStorage.getItem(k)).questions[id].history.length,[key,family]), 3);
      }
    } finally { await page.close(); }
  });

  for (const workbench of ['index.html#experiment','topology.html']) {
    test(name + ' ' + workbench + ' reflects cross-tab due reviews and preserves the benchmark fallback', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const writer = await context.newPage();
      try {
        await writer.goto(base + 'v8-assessment.html?module=afe');
        await writer.waitForSelector('#ee-formal-choices input');
        await writer.evaluate(async () => {
          const A = window.CircuitAssessment, E = window.CircuitEvidence, state = E.load();
          const group = A.expandQuestions([window.CircuitQuizBank.questions.find(q => q.id === 'afe-phase-power')]);
          for (const [i, q] of group.slice(0, 2).entries()) {
            A.recordAttempt(state, q, q.options.find(o => o.correct), {at:new Date(Date.now() - 2*A.DAY_MS + i).toISOString()});
          }
          state.questions['historical-unmigrated-family'] = JSON.parse(JSON.stringify(state.questions['afe-phase-power']));
          state.benchmark.outcomeV1 = {sessions:{post:{completedAt:'2020-01-01T00:00:00Z'}}, retention:{r1:{dueAt:'2020-01-02T00:00:00Z'}}};
          E.save(state);
          if (!(await E.flush()).saved) throw Error('Unable to seed scheduled benchmark');
        });
        await page.goto(base + workbench);
        const resume = page.locator('#resume-task');
        await resume.waitFor({state:'visible'});
        assert.match(await resume.getAttribute('data-route'), /19_c2000_buck_firmware_lab/);
        await resume.click();
        await page.locator('#reference-links').getByRole('button', {name:'保存後查看遷移範圍'}).waitFor();
        await writer.evaluate(async () => {
          const E = window.CircuitEvidence, state = E.load();
          delete state.benchmark.outcomeV1;
          E.save(state);
          if (!(await E.flush()).saved) throw Error('Unable to update benchmark');
        });
        await page.waitForSelector('#resume-task[data-route="v8-assessment.html?module=afe"]',{timeout:6000});
        await writer.evaluate(async () => {
          const A = window.CircuitAssessment, E = window.CircuitEvidence, state = E.load();
          const id = 'afe-phase-power', baseQuestion = window.CircuitQuizBank.questions.find(q => q.id === id);
          const q = A.nextQuestion(A.expandQuestions([baseQuestion]), state.questions[id], Date.now());
          A.recordAttempt(state, q, q.options.find(o => o.correct), {at:new Date().toISOString()});
          E.save(state);
          if (!(await E.flush()).saved) throw Error('Unable to save retention attempt');
        });
        await page.waitForSelector('#resume-task[data-route="quiz.html"]');
        await resume.click();
        await page.locator('#reference-links').getByRole('button', {name:'保存後查看遷移範圍'}).waitFor();
        assert.equal(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).questions['historical-unmigrated-family'].history.length, key), 2);
      } finally { await context.close(); }
    });
  }

  test(name + ' invalid focused-family URLs fail closed and preserve raw history', async () => {
    const page = await browser.newPage();
    try {
      for (const [category, family] of [['adc','adc-divider-power'], ['buck','buck-model-validity'], ['spi','spi-cpol-cpha'], ['topology','topology-llc-scaling'], ['power-firmware','protection-trip-latency']]) {
        const target = base + category + '-assessment.html?family=' + family;
        await page.goto(target);
        await page.waitForSelector('#ee-formal-choices input');
        assert.equal(await page.locator('#ee-formal-question').getAttribute('data-family'), family);
        const original = await page.evaluate(k => localStorage.getItem(k), key);
        for (const suffix of ['#passed','&score=100','&family=' + family]) {
          await page.goto(target + suffix);
          await page.reload();
          await page.waitForFunction(() => ['ready','protected'].includes(document.querySelector('main').dataset.state));
          assert.equal(await page.locator('main').getAttribute('data-state'), 'protected', target + suffix);
          assert.equal(await page.evaluate(k => localStorage.getItem(k), key), original);
        }
      }
    } finally { await page.close(); }
  });
}
