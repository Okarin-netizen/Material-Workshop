// 5つの指標のメーター（設計台の下に出す）。

import { h } from '../dom.js';
import { METRICS } from '../../data/traits.js';
import { METER_LEVEL } from '../../core/constants.js';
import { UI } from '../../data/uiText.js';
import { plain } from './ruby.js';

/**
 * 指標の値から色分けの段階を決める。
 * @param {number|null} value
 * @returns {'good'|'fair'|'poor'|'none'}
 */
export function meterLevel(value) {
  if (value === null || value === undefined) return 'none';
  if (value >= METER_LEVEL.good) return 'good';
  if (value >= METER_LEVEL.fair) return 'fair';
  return 'poor';
}

/**
 * @param {Record<string, number|null>} metrics
 * @returns {HTMLElement}
 */
export function renderMeters(metrics) {
  return h(
    'div',
    { class: 'meters', role: 'group', 'aria-label': plain(UI.designBoard.metricsLabel) },
    METRICS.map(({ id, label }) => renderMeter(label, metrics[id])),
  );
}

function renderMeter(label, value) {
  const level = meterLevel(value);
  const known = level !== 'none';
  return h(
    'div',
    { class: `meter meter--${level}` },
    h('div', { class: 'meter__label' }, label),
    h(
      'div',
      {
        class: 'meter__bar',
        role: 'meter',
        'aria-label': plain(label),
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': known ? String(value) : null,
        'aria-valuetext': known ? `${value}（${plain(UI.metricLevel[level])}）` : plain(UI.designBoard.noValue),
      },
      h('i', { style: { width: `${known ? value : 0}%` } }),
    ),
    h('div', { class: 'meter__value', 'aria-hidden': 'true' }, known ? String(value) : UI.designBoard.noValue),
  );
}
