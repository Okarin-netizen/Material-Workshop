// 星（★☆☆）の表示。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { plain } from './ruby.js';

const MAX_STARS = 3;

/**
 * @param {number} count 0〜3
 * @param {'small'|'large'} [size]
 * @returns {HTMLElement}
 */
export function renderStars(count, size = 'small') {
  const label = plain(fill(UI.result.starsLabel, { count }));
  const marks = Array.from({ length: MAX_STARS }, (_, index) =>
    h('span', { class: index < count ? 'star star--on' : 'star star--off', 'aria-hidden': 'true' }, index < count ? '★' : '☆'),
  );
  return h('span', { class: `stars stars--${size}`, role: 'img', 'aria-label': label }, marks);
}
