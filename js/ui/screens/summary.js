// 学習のまとめ（提出用）。A4 1枚に収まるようにし、window.print() で印刷・PDF保存する。
// 年・組・番・名前はこの画面の中だけで覚えておき、保存しない（再読み込みすると消える）。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { TEXT_LIMIT } from '../../core/constants.js';
import { recordOf, setReflection, totalStars } from '../../core/gameState.js';
import { renderStars } from '../components/stars.js';
import { plain } from '../components/ruby.js';

const MAX_STARS_PER_REQUEST = 3;

/** 氏名など（保存しない。画面を描き直しても消えないように、ここで覚えておく） */
const identity = { year: '', klass: '', number: '', name: '' };

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderSummary(app) {
  return h(
    'main',
    { class: 'screen screen--page screen--summary', id: 'main' },
    h(
      'div',
      { class: 'summary-actions no-print' },
      h('button', { type: 'button', class: 'btn btn--primary', dataset: { focusKey: 'summary-print' }, onClick: () => window.print() }, UI.summary.print),
      h('button', { type: 'button', class: 'btn btn--sub', dataset: { focusKey: 'summary-back' }, onClick: () => app.back() }, UI.summary.back),
    ),
    h(
      'article',
      { class: 'sheet' },
      renderSheetHeader(app),
      renderIdentityFields(),
      h('p', { class: 'sheet__note no-print' }, UI.summary.nameNote),
      renderRecordTable(app),
      renderReflection(app),
    ),
  );
}

function renderSheetHeader(app) {
  const cleared = app.data.requests.filter((request) => recordOf(app.progress, request.id).latestPassed).length;
  const total = app.data.requests.length;
  return h(
    'header',
    { class: 'sheet__header' },
    h('div', {}, h('h1', { class: 'sheet__title', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.summary.heading), h('p', { class: 'sheet__subtitle' }, UI.summary.subtitle)),
    h(
      'div',
      { class: 'sheet__totals' },
      h('p', {}, fill(UI.summary.totals, { cleared, total, stars: totalStars(app.progress), maxStars: total * MAX_STARS_PER_REQUEST })),
      h('p', { class: 'sheet__date' }, UI.summary.printDate, '：', h('span', { text: new Date().toLocaleDateString('ja-JP') })),
    ),
  );
}

/** 年・組・番・名前の入力欄（保存しない） */
function renderIdentityFields() {
  const field = (key, label, size) =>
    h(
      'label',
      { class: `identity__field identity__field--${key}` },
      h('input', {
        type: 'text',
        class: 'identity__input',
        size: String(size),
        value: identity[key],
        autocomplete: 'off',
        dataset: { focusKey: `identity-${key}` },
        onInput: (event) => {
          identity[key] = event.target.value;
        },
      }),
      h('span', {}, label),
    );
  return h('div', { class: 'identity' }, field('year', UI.summary.year, 2), field('klass', UI.summary.klass, 2), field('number', UI.summary.number, 3), field('name', UI.summary.name, 16));
}

function renderRecordTable(app) {
  return h(
    'table',
    { class: 'record-table' },
    h('thead', {}, h('tr', {}, [UI.summary.colRequest, UI.summary.colStars, UI.summary.colDesign, UI.summary.colReason].map((label) => h('th', { scope: 'col' }, label)))),
    h('tbody', {}, app.data.requests.map((request) => renderRecordRow(app, request))),
  );
}

function renderRecordRow(app, request) {
  const record = recordOf(app.progress, request.id);
  const shown = record.latestPassed;
  return h(
    'tr',
    { class: shown ? '' : 'is-empty' },
    h('th', { scope: 'row' }, `${request.number}. `, request.title),
    h('td', { class: 'record-table__stars' }, renderStars(shown ? shown.stars : 0)),
    h('td', {}, shown ? describeDesign(app, request, shown.design) : UI.summary.notCleared),
    // 生徒が書いた文なので、ふりがな記法を通さず textContent で入れる
    h('td', { class: 'record-table__reason', text: shown ? record.reason : '' }),
  );
}

/** 「座面：スギ／切って削る」「工夫：塗装」のような説明 */
function describeDesign(app, request, design) {
  const parts = request.parts.map((part) => {
    const material = app.catalog.materials.get(design.materials[part.id]);
    const process = app.catalog.processes.get(design.processes[part.id]);
    return h('span', { class: 'design-line' }, part.name, '：', material?.name ?? '－', '／', process?.name ?? '－');
  });
  const reinforcementNames = design.reinforcements.map((id) => app.catalog.reinforcements.get(id)?.name).filter(Boolean);
  const reinforcementLine = reinforcementNames.length ? reinforcementNames.flatMap((name, index) => (index ? ['・', name] : [name])) : [UI.summary.noReinforcement];
  return [parts, h('span', { class: 'design-line design-line--sub' }, reinforcementLine)];
}

/** ふり返り。入力のたびに保存し、印刷用の写し（textarea は印刷で切れることがあるため）も更新する */
function renderReflection(app) {
  const id = 'reflection-input';
  const mirror = h('div', { class: 'reflection__mirror print-only', text: app.progress.reflection });
  return h(
    'section',
    { class: 'reflection' },
    h('label', { class: 'reflection__label', for: id }, UI.summary.reflection),
    h('textarea', {
      id,
      class: 'reflection__input no-print',
      rows: 4,
      maxlength: String(TEXT_LIMIT.reflection),
      placeholder: plain(UI.summary.reflectionPlaceholder),
      value: app.progress.reflection,
      dataset: { focusKey: id },
      onInput: (event) => {
        mirror.textContent = event.target.value;
        app.updateQuietly((progress) => setReflection(progress, event.target.value));
      },
    }),
    mirror,
  );
}
