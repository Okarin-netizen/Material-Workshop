// 設計中の左の列：依頼カード（依頼人・せりふ・合格の条件・予算・ヒント）。

import { h, fill, formatNumber } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { renderClientArt } from './clientArt.js';

/** 条件がこれより多いときは2列に並べる（短い条件が多い依頼でも、縦に収まるように） */
const COMPACT_CONDITIONS_FROM = 5;

/**
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {import('../../core/scoring.js').Evaluation} evaluation 今の設計の評価（予算の印に使う）
 * @returns {HTMLElement}
 */
export function renderRequestPanel(request, evaluation) {
  return h(
    'section',
    { class: 'panel panel--request', 'aria-labelledby': 'request-heading' },
    h('h2', { class: 'panel__heading', id: 'request-heading' }, UI.requestPanel.heading),
    h(
      'div',
      { class: 'client' },
      renderClientArt(request.client.look, 56),
      h('div', { class: 'client__name' }, h('small', {}, UI.requestPanel.client), h('strong', {}, request.client.name)),
    ),
    h(
      'div',
      { class: 'panel__scroll panel__scroll--request' },
      h('p', { class: 'speech' }, request.message),
      h('h3', { class: 'sub-heading' }, UI.requestPanel.conditions),
      h(
        'ul',
        { class: `conditions${request.tests.length > COMPACT_CONDITIONS_FROM ? ' conditions--compact' : ''}` },
        request.tests.map((test) => renderCondition(request, test, evaluation)),
      ),
      h('p', { class: 'hint' }, fill(UI.requestPanel.hint, { page: request.hint.page }), '「', request.hint.text, '」'),
    ),
  );
}

/** 予算の条件だけは、設計中も予算内かどうかを印で見せる（ほかの条件はテストで確かめる） */
function renderCondition(request, test, evaluation) {
  if (!test.check.budget) {
    return h('li', { class: 'condition' }, h('span', { class: 'condition__box', 'aria-hidden': 'true' }), test.condition);
  }
  const result = evaluation.tests.find((item) => item.id === test.id);
  const state = result?.passed === true ? 'ok' : result?.passed === false ? 'ng' : 'unknown';
  return h(
    'li',
    { class: `condition condition--${state}` },
    h('span', { class: 'condition__box', 'aria-hidden': 'true' }, state === 'ok' ? '✓' : state === 'ng' ? '✕' : ''),
    fill(UI.requestPanel.budget, { budget: formatNumber(request.budget) }),
  );
}
