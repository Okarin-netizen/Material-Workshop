// 「このアプリについて」の画面：バージョン・作者・変更履歴。文は uiText.js の about と data/about.js にある。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { CREDITS, CHANGELOG, APP_VERSION } from '../../data/about.js';

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderAbout(app) {
  return h(
    'main',
    { class: 'screen screen--page', id: 'main' },
    h(
      'div',
      { class: 'page-card about-card' },
      h('h1', { class: 'page-title', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.about.heading),
      h(
        'dl',
        { class: 'about-info' },
        h('dt', {}, UI.about.appName),
        h('dd', {}, UI.appName),
        h('dt', {}, UI.about.version),
        h('dd', {}, APP_VERSION),
        h('dt', {}, UI.about.author),
        h('dd', {}, fill(UI.about.authorValue, { author: CREDITS.author, github: CREDITS.github })),
      ),
      h('p', { class: 'about-note' }, UI.about.note),
      h('h2', { class: 'about-heading' }, UI.about.changelog),
      h(
        'ol',
        { class: 'changelog' },
        CHANGELOG.map((entry) =>
          h(
            'li',
            { class: 'changelog__entry' },
            h('h3', { class: 'changelog__version' }, fill(UI.about.versionValue, { version: entry.version }), h('span', { class: 'changelog__date' }, entry.date)),
            h('ul', { class: 'changelog__changes' }, entry.changes.map((line) => h('li', {}, line))),
          ),
        ),
      ),
      h('div', { class: 'page-actions' }, h('button', { type: 'button', class: 'btn btn--primary', dataset: { focusKey: 'about-back' }, onClick: () => app.back() }, UI.about.back)),
    ),
  );
}
