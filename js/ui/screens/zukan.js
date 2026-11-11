// 材料図鑑：テストで使った材料・加工方法・工夫が加わり、説明と教科書のページを読み返せる。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { CATEGORIES, MATERIAL_KINDS, TRAITS } from '../../data/traits.js';
import { TRAIT_MAX } from '../../core/constants.js';
import { renderSwatch } from '../components/choiceCard.js';
import { plain } from '../components/ruby.js';

/** 図鑑のグループ（並び順） */
const GROUPS = [
  { type: 'materials', label: UI.zukan.materials },
  { type: 'processes', label: UI.zukan.processes },
  { type: 'reinforcements', label: UI.zukan.reinforcements },
];

/** 図鑑に出す特性（加工方法と開け閉めは材料そのものの性質ではないので出さない） */
const ZUKAN_TRAITS = Object.keys(TRAITS).filter((key) => key !== 'reclose');

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderZukan(app) {
  const selection = app.screenParams.zukanSelection ?? null;
  return h(
    'main',
    { class: 'screen screen--page', id: 'main' },
    h(
      'div',
      { class: 'page-card page-card--zukan' },
      h('h1', { class: 'page-title', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.zukan.heading),
      h('p', { class: 'page-lead' }, UI.zukan.lead),
      h(
        'div',
        { class: 'zukan-layout' },
        h('div', { class: 'zukan-lists' }, GROUPS.map((group) => renderGroup(app, group, selection))),
        h('aside', { class: 'zukan-detail', 'aria-live': 'polite' }, selection ? renderDetail(app, selection) : h('p', { class: 'zukan-detail__empty' }, UI.zukan.pickOne)),
      ),
      h('div', { class: 'page-actions' }, h('button', { type: 'button', class: 'btn btn--primary', dataset: { focusKey: 'zukan-back' }, onClick: () => app.back() }, UI.zukan.back)),
    ),
  );
}

function renderGroup(app, group, selection) {
  const known = new Set(app.progress.zukan[group.type]);
  const items = app.data[group.type];
  return h(
    'section',
    { class: 'zukan-group', 'aria-labelledby': `zukan-${group.type}` },
    h('h2', { class: 'zukan-group__title', id: `zukan-${group.type}` }, group.label, ` ${known.size}/${items.length}`),
    h(
      'ul',
      { class: 'zukan-grid' },
      items.map((item) => h('li', {}, known.has(item.id) ? renderEntryButton(app, group.type, item, selection) : renderUnknown())),
    ),
  );
}

function renderEntryButton(app, type, item, selection) {
  const selected = selection?.type === type && selection.id === item.id;
  return h(
    'button',
    {
      type: 'button',
      class: `zukan-entry${selected ? ' is-selected' : ''}`,
      'aria-pressed': String(selected),
      dataset: { focusKey: `zukan-${type}-${item.id}` },
      onClick: () => app.setScreenParams({ zukanSelection: { type, id: item.id } }),
    },
    type === 'materials' ? renderSwatch(item.look) : null,
    item.name,
  );
}

function renderUnknown() {
  return h('span', { class: 'zukan-entry is-unknown' }, UI.zukan.unknown);
}

// ── 説明の欄 ─────────────────────────────────

function renderDetail(app, { type, id }) {
  const item = app.data[type].find((entry) => entry.id === id);
  const header = h(
    'div',
    { class: 'zukan-detail__head' },
    h('h2', { class: 'zukan-detail__name' }, item.name),
    h('span', { class: 'page-tag' }, fill(UI.zukan.page, { page: item.page })),
  );
  if (type === 'materials') return [header, ...materialDetail(item)];
  if (type === 'processes') return [header, ...processDetail(item)];
  return [header, ...reinforcementDetail(item)];
}

function materialDetail(material) {
  const category = CATEGORIES[material.category];
  return [
    h('p', {}, h('span', { class: `tag tag--${category.tone}` }, category.label), material.plasticType ? [' ', MATERIAL_KINDS[material.plasticType].label] : null),
    renderSwatch(material.look),
    h('p', { class: 'zukan-detail__text' }, material.detail),
    material.fact ? h('p', { class: 'zukan-detail__fact' }, material.fact) : null,
    h('h3', { class: 'sub-heading' }, UI.zukan.traits),
    h('dl', { class: 'trait-list' }, ZUKAN_TRAITS.map((key) => renderTraitRow(key, material.traits[key] ?? 0))),
  ];
}

function renderTraitRow(key, value) {
  const label = TRAITS[key].label;
  return h(
    'div',
    { class: 'trait-row' },
    h('dt', {}, label),
    h('dd', { role: 'img', 'aria-label': `${plain(label)} ${value} / ${TRAIT_MAX}` }, Array.from({ length: TRAIT_MAX }, (_, index) => h('span', { class: index < value ? 'pip is-on' : 'pip', 'aria-hidden': 'true' }))),
  );
}

function processDetail(process) {
  return [
    h('p', { class: 'zukan-detail__text' }, process.detail),
    h('h3', { class: 'sub-heading' }, UI.zukan.suitable),
    h('ul', { class: 'kind-list' }, process.suitableKinds.map((kind) => h('li', { class: 'chip' }, MATERIAL_KINDS[kind].label))),
  ];
}

function reinforcementDetail(reinforcement) {
  return [
    h('p', { class: 'zukan-detail__text' }, reinforcement.detail),
    reinforcement.good ? h('p', { class: 'pros-cons__good' }, `${UI.stepReinforce.good} `, reinforcement.good) : null,
    reinforcement.bad ? h('p', { class: 'pros-cons__bad' }, `${UI.stepReinforce.bad} `, reinforcement.bad) : null,
  ];
}
