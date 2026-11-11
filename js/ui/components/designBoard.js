// 設計中の中央の列：設計台（製品の絵・部品ごとの選択・5つの指標・費用）。

import { h, fill, formatNumber } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { CATEGORIES } from '../../data/traits.js';
import { renderProductArt } from '../art/index.js';
import { renderMeters } from './meter.js';

/**
 * @param {import('../../main.js').App} app
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {import('../../core/scoring.js').Evaluation} evaluation
 * @returns {HTMLElement}
 */
export function renderDesignBoard(app, request, evaluation) {
  const { design } = app.progress.session;
  return h(
    'section',
    { class: 'panel panel--board', 'aria-labelledby': 'board-heading' },
    h('h2', { class: 'panel__heading', id: 'board-heading' }, UI.designBoard.heading),
    h('div', { class: 'art-frame' }, renderProductArt(request, design, app.catalog)),
    h('ul', { class: 'part-slots' }, request.parts.map((part) => renderPartSlot(app, part, design))),
    renderMeters(evaluation.metrics),
    renderCostBar(request, evaluation.cost),
  );
}

/** 「座面：スギ（木材）／切って削る」のような、部品ごとの今の選択 */
function renderPartSlot(app, part, design) {
  const material = app.catalog.materials.get(design.materials[part.id]);
  const process = app.catalog.processes.get(design.processes[part.id]);
  if (!material) {
    return h('li', { class: 'part-slot part-slot--empty' }, h('strong', {}, part.name), h('span', {}, UI.designBoard.notChosen));
  }
  return h(
    'li',
    { class: 'part-slot' },
    h('strong', {}, part.name),
    h('span', {}, material.name, '（', CATEGORIES[material.category].label, '）', process ? ['／', process.name] : null),
  );
}

function renderCostBar(request, cost) {
  const over = cost > request.budget;
  const ratio = Math.min(1, cost / request.budget);
  return h(
    'div',
    { class: `cost-bar${over ? ' is-over' : ''}` },
    h('span', { class: 'cost-bar__label' }, UI.designBoard.cost),
    h('span', { class: 'cost-bar__track', 'aria-hidden': 'true' }, h('i', { style: { width: `${ratio * 100}%` } })),
    h('span', { class: 'cost-bar__value' }, fill(UI.designBoard.costValue, { cost: formatNumber(cost), budget: formatNumber(request.budget) })),
    over ? h('span', { class: 'cost-bar__over' }, UI.designBoard.overBudget) : null,
  );
}
