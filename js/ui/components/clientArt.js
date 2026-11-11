// 依頼人の顔の絵（インライン SVG）。色と帽子の種類は依頼データの client.look で決まる。

import { s } from '../dom.js';

const OUTLINE = '#5b3a1e';
const EYE = '#3b2a1a';

/** 帽子・髪型ごとの絵 */
const HATS = {
  none: (look) => s('path', { d: 'M22 40 Q52 4 82 40 Q78 22 52 18 Q26 22 22 40Z', fill: look.hair, stroke: OUTLINE, 'stroke-width': 3 }),
  cap: (look) => [
    s('path', { d: 'M20 38 Q52 2 84 38 L84 30 Q52 -6 20 30Z', fill: look.outfit, stroke: OUTLINE, 'stroke-width': 3 }),
    s('rect', { x: 18, y: 30, width: 68, height: 10, rx: 4, fill: look.outfit, stroke: OUTLINE, 'stroke-width': 3 }),
  ],
  chef: () => [
    s('path', { d: 'M24 34 Q14 12 34 12 Q40 0 52 6 Q64 0 70 12 Q90 12 80 34Z', fill: '#ffffff', stroke: OUTLINE, 'stroke-width': 3 }),
    s('rect', { x: 24, y: 28, width: 56, height: 10, rx: 3, fill: '#ffffff', stroke: OUTLINE, 'stroke-width': 3 }),
  ],
  band: (look) => [
    HATS.none(look),
    s('rect', { x: 22, y: 26, width: 60, height: 8, rx: 4, fill: look.outfit, stroke: OUTLINE, 'stroke-width': 2 }),
  ],
  bun: (look) => [s('circle', { cx: 52, cy: 12, r: 10, fill: look.hair, stroke: OUTLINE, 'stroke-width': 3 }), HATS.none(look)],
  glasses: (look) => [
    HATS.none(look),
    s('g', { fill: 'none', stroke: EYE, 'stroke-width': 2.5 }, s('circle', { cx: 41, cy: 50, r: 8 }), s('circle', { cx: 63, cy: 50, r: 8 }), s('path', { d: 'M49 50 L55 50' })),
  ],
};

/**
 * @param {import('../../data/requests.js').ClientLook} look
 * @param {number} [size] 表示の幅（px）
 * @returns {SVGElement}
 */
export function renderClientArt(look, size = 64) {
  const hat = HATS[look.hat] ?? HATS.none;
  return s(
    'svg',
    { class: 'client-art', viewBox: '0 0 104 110', width: size, height: size * (110 / 104), 'aria-hidden': 'true', focusable: 'false' },
    s('ellipse', { cx: 52, cy: 100, rx: 40, ry: 24, fill: look.outfit, stroke: OUTLINE, 'stroke-width': 3 }),
    s('circle', { cx: 52, cy: 48, r: 30, fill: look.skin, stroke: OUTLINE, 'stroke-width': 4 }),
    hat(look),
    s('circle', { cx: 41, cy: 50, r: 4, fill: EYE }),
    s('circle', { cx: 63, cy: 50, r: 4, fill: EYE }),
    s('path', { d: 'M42 62 Q52 70 62 62', stroke: EYE, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }),
  );
}
