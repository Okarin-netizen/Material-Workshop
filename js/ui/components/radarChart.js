// 結果画面のレーダーチャート（5つの指標）。インライン SVG で描く。

import { s } from '../dom.js';
import { METRICS } from '../../data/traits.js';
import { METRIC_MAX } from '../../core/constants.js';
import { plain } from './ruby.js';

const SIZE = 300; // viewBox の大きさ（表示の大きさは CSS で決める）
const CENTER = SIZE / 2;
const RADIUS = 92;
const LABEL_RADIUS = 124;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

/** i 番目の軸の角度（上から時計回り） */
function axisAngle(index) {
  return -Math.PI / 2 + (index * 2 * Math.PI) / METRICS.length;
}

function pointAt(index, ratio, radius = RADIUS) {
  const angle = axisAngle(index);
  return [CENTER + Math.cos(angle) * radius * ratio, CENTER + Math.sin(angle) * radius * ratio];
}

function polygonPoints(ratios) {
  return ratios.map((ratio, index) => pointAt(index, ratio).map((n) => n.toFixed(1)).join(',')).join(' ');
}

/**
 * @param {Record<string, number|null>} metrics
 * @returns {SVGElement}
 */
export function renderRadarChart(metrics) {
  const values = METRICS.map(({ id }) => (metrics[id] ?? 0) / METRIC_MAX);
  const description = METRICS.map(({ id, label }) => `${plain(label)} ${metrics[id] ?? 0}`).join('、');

  return s(
    'svg',
    { class: 'radar', viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img', 'aria-label': description },
    GRID_LEVELS.map((level) => s('polygon', { class: 'radar__grid', points: polygonPoints(METRICS.map(() => level)) })),
    METRICS.map((_, index) => {
      const [x, y] = pointAt(index, 1);
      return s('line', { class: 'radar__axis', x1: CENTER, y1: CENTER, x2: x, y2: y });
    }),
    s('polygon', { class: 'radar__value', points: polygonPoints(values) }),
    METRICS.map(({ id, label }, index) => {
      const [x, y] = pointAt(index, 1, LABEL_RADIUS);
      return s(
        'text',
        { class: 'radar__label', x, y, 'text-anchor': 'middle', 'dominant-baseline': 'middle' },
        s('tspan', {}, plain(label)),
        s('tspan', { class: 'radar__num', x, dy: '1.1em' }, String(metrics[id] ?? 0)),
      );
    }),
  );
}
