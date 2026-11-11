// 遊び方の画面。文はすべて uiText.js の howto にある。

import { h } from '../dom.js';
import { UI } from '../../data/uiText.js';

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderHowto(app) {
  return h(
    'main',
    { class: 'screen screen--page', id: 'main' },
    h(
      'div',
      { class: 'page-card' },
      h('h1', { class: 'page-title', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.howto.heading),
      h(
        'div',
        { class: 'howto-grid' },
        UI.howto.sections.map((section) =>
          h('section', { class: 'howto-section' }, h('h2', {}, section.title), h('ul', {}, section.lines.map((line) => h('li', {}, line)))),
        ),
      ),
      h('div', { class: 'page-actions' }, h('button', { type: 'button', class: 'btn btn--primary', dataset: { focusKey: 'howto-back' }, onClick: () => app.back() }, UI.howto.back)),
    ),
  );
}
