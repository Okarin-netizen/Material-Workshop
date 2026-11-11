// ステップ5「テストと結果」：テスト｜評価（星・得点・レーダーチャート・依頼人のコメント）｜学びのポイントなど。

import { h, fill, formatNumber } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { STEP, TEXT_LIMIT } from '../../core/constants.js';
import { pickWhatIf } from '../../core/scoring.js';
import { goToStep, recordOf, setReason } from '../../core/gameState.js';
import { renderProductArt } from '../art/index.js';
import { renderRadarChart } from '../components/radarChart.js';
import { renderStars } from '../components/stars.js';
import { renderClientArt } from '../components/clientArt.js';
import { plain } from '../components/ruby.js';

/**
 * @param {import('../../main.js').App} app
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {import('../../core/scoring.js').Evaluation} evaluation
 * @returns {HTMLElement}
 */
export function renderResult(app, request, evaluation) {
  return h(
    'div',
    { class: 'three-columns three-columns--result' },
    renderTestsPanel(app, request, evaluation),
    renderEvaluationPanel(app, request, evaluation),
    renderLearningPanel(app, request),
  );
}

// ── 左：テスト ───────────────────────────────

function renderTestsPanel(app, request, evaluation) {
  return h(
    'section',
    { class: 'panel panel--tests', 'aria-labelledby': 'tests-heading' },
    h('h2', { class: 'panel__heading', id: 'tests-heading', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.result.testsHeading),
    h('div', { class: 'art-frame art-frame--result' }, renderProductArt(request, app.progress.session.design, app.catalog)),
    h('div', { class: 'panel__scroll panel__scroll--tests' }, h('ul', { class: 'test-list' }, request.tests.map((test) => renderTestRow(test, evaluation)))),
  );
}

function renderTestRow(test, evaluation) {
  const result = evaluation.tests.find((item) => item.id === test.id);
  const passed = result.passed === true;
  return h(
    'li',
    { class: `test-row ${passed ? 'test-row--pass' : 'test-row--fail'}` },
    h('span', { class: 'test-row__badge' }, passed ? UI.result.pass : UI.result.fail),
    h(
      'span',
      { class: 'test-row__body' },
      h('strong', {}, test.name),
      h('span', { class: 'page-tag' }, test.page),
      h('span', { class: 'test-row__reason' }, result.reason),
    ),
  );
}

// ── 中央：評価（星・得点・レーダーチャート・図鑑に追加・依頼人のコメント） ──

function renderEvaluationPanel(app, request, evaluation) {
  const comment = evaluation.allPassed ? request.comments[`star${evaluation.stars}`] : request.comments.failed;
  return h(
    'section',
    { class: 'panel panel--evaluation', 'aria-labelledby': 'evaluation-heading' },
    h('h2', { class: 'panel__heading', id: 'evaluation-heading' }, UI.result.evaluation),
    h(
      'div',
      { class: 'verdict' },
      renderStars(evaluation.stars, 'large'),
      h(
        'p',
        { class: `verdict__text${evaluation.allPassed ? '' : ' is-failed'}` },
        evaluation.allPassed ? UI.result.achieved : UI.result.notAchieved,
        h('span', { class: 'verdict__score' }, String(evaluation.score), UI.result.scoreUnit),
      ),
      h('p', { class: 'verdict__cost' }, fill(UI.result.cost, { cost: formatNumber(evaluation.cost), budget: formatNumber(request.budget) })),
    ),
    renderNewEntries(app),
    h('div', { class: 'radar-frame' }, renderRadarChart(evaluation.metrics)),
    h('div', { class: 'comment' }, renderClientArt(request.client.look, 48), h('p', { class: 'comment__text' }, comment)),
  );
}

// ── 右：学びのポイント・もし別の材料だったら・選んだ理由・ボタン ──

function renderLearningPanel(app, request) {
  return h(
    'section',
    { class: 'panel panel--learning', 'aria-labelledby': 'learning-heading' },
    h('h2', { class: 'panel__heading', id: 'learning-heading' }, UI.result.learning),
    h(
      'div',
      { class: 'panel__scroll' },
      h('ul', { class: 'points' }, request.learningPoints.map(renderPoint)),
      renderWhatIf(app, request),
    ),
    renderReasonInput(app, request),
    h(
      'div',
      { class: 'result-buttons' },
      h('button', { type: 'button', class: 'btn btn--sub', dataset: { focusKey: 'retry' }, onClick: () => app.update((progress) => goToStep(progress, request, STEP.material)) }, UI.result.retry),
      h('button', { type: 'button', class: 'btn btn--primary', dataset: { focusKey: 'to-board' }, onClick: () => app.navigate('board') }, UI.result.toBoard),
    ),
  );
}

function renderPoint(point) {
  return h('li', { class: 'point' }, h('span', { class: 'page-tag' }, point.page), h('strong', {}, point.title), h('span', {}, point.text));
}

function renderWhatIf(app, request) {
  const item = pickWhatIf(request, app.progress.session.design);
  if (!item) return null;
  const title = item.without
    ? fill(UI.result.whatIfWithout, { reinforcement: app.catalog.reinforcements.get(item.without).name })
    : fill(UI.result.whatIfMaterial, {
        part: request.parts.find((part) => part.id === item.part).name,
        material: app.catalog.materials.get(item.material).name,
      });
  return h('div', { class: 'what-if' }, h('strong', {}, title), h('span', {}, item.text));
}

/** 直前のテストで図鑑に加わったもの（場所をとらないよう、名前を「・」でつないだ1〜2行にする） */
function renderNewEntries(app) {
  const entries = app.progress.session.newEntries;
  if (!entries.length) return h('p', { class: 'new-entries new-entries--none' }, UI.result.noNewEntries);
  const sources = { materials: app.catalog.materials, processes: app.catalog.processes, reinforcements: app.catalog.reinforcements };
  const names = entries.flatMap(({ type, id }, index) => [index > 0 ? '・' : null, sources[type].get(id).name]);
  return h('p', { class: 'new-entries' }, h('span', { class: 'new-entries__heading' }, UI.result.newEntries), ' ', names);
}

/** 選んだ理由。入力のたびに保存する（画面は描き直さない） */
function renderReasonInput(app, request) {
  const id = 'reason-input';
  return h(
    'div',
    { class: 'reason' },
    h('label', { class: 'reason__label', for: id }, UI.result.reasonLabel),
    h('textarea', {
      id,
      class: 'reason__input',
      rows: 2,
      maxlength: String(TEXT_LIMIT.reason),
      placeholder: plain(UI.result.reasonPlaceholder),
      value: recordOf(app.progress, request.id).reason,
      dataset: { focusKey: id },
      onInput: (event) => app.updateQuietly((progress) => setReason(progress, request.id, event.target.value)),
    }),
  );
}
