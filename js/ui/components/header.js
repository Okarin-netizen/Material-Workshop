// 全画面共通のヘッダー：ロゴ、取り組み中の依頼、ふりがな切りかえ、依頼ボード・図鑑・まとめ。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { setFurigana } from '../../core/gameState.js';
import { plain } from './ruby.js';

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderHeader(app) {
  const request = app.screen === 'workshop' ? app.currentRequest() : null;
  const zukanTotal = app.data.materials.length + app.data.processes.length + app.data.reinforcements.length;
  const zukanCount = Object.values(app.progress.zukan).reduce((sum, list) => sum + list.length, 0);

  return h(
    'header',
    { class: 'app-header' },
    h('button', { class: 'app-logo', type: 'button', onClick: () => app.navigate('title'), dataset: { focusKey: 'header-logo' } }, UI.appName),
    request
      ? h('div', { class: 'stage-pill' }, h('span', { class: 'stage-pill__number' }, fill(UI.header.stageLabel, { number: request.number })), ' ', request.title)
      : null,
    h(
      'nav',
      { class: 'header-nav', 'aria-label': plain(UI.header.menu) },
      furiganaButton(app),
      navButton(app, 'board', UI.header.board),
      navButton(app, 'zukan', fill(UI.header.zukanCount, { count: zukanCount, total: zukanTotal })),
      navButton(app, 'summary', UI.header.summary),
    ),
  );
}

function furiganaButton(app) {
  const on = app.progress.furigana;
  return h(
    'button',
    {
      class: `header-btn header-btn--furigana${on ? ' is-on' : ''}`,
      type: 'button',
      'aria-pressed': String(on),
      dataset: { focusKey: 'header-furigana' },
      onClick: () => app.update((progress) => setFurigana(progress, !progress.furigana)),
    },
    h('span', { class: 'visually-hidden' }, UI.header.furiganaLabel),
    on ? UI.header.furiganaOn : UI.header.furiganaOff,
  );
}

function navButton(app, screen, label) {
  const current = app.screen === screen;
  return h(
    'button',
    {
      class: `header-btn${current ? ' is-current' : ''}`,
      type: 'button',
      'aria-current': current ? 'page' : null,
      dataset: { focusKey: `header-${screen}` },
      onClick: () => app.navigate(screen),
    },
    label,
  );
}
