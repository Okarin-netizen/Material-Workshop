// 全画面共通のヘッダー：ロゴ、取り組み中の依頼、ふりがな切りかえ、依頼ボード・図鑑・まとめ・タイトルへ。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { setFurigana, setSound } from '../../core/gameState.js';
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
      toggleButton(app, {
        key: 'header-furigana',
        on: app.progress.furigana,
        label: UI.header.furiganaLabel,
        texts: [UI.header.furiganaOn, UI.header.furiganaOff],
        toggle: (progress) => setFurigana(progress, !progress.furigana),
      }),
      toggleButton(app, {
        key: 'header-sound',
        on: app.progress.sound,
        label: UI.header.soundLabel,
        texts: [UI.header.soundOn, UI.header.soundOff],
        toggle: (progress) => setSound(progress, !progress.sound),
      }),
      navButton(app, 'board', UI.header.board),
      navButton(app, 'zukan', fill(UI.header.zukanCount, { count: zukanCount, total: zukanTotal })),
      navButton(app, 'summary', UI.header.summary),
      // タイトルにいるときは出さない。進み具合は自動で保存されるので、確かめずにすぐもどる
      app.screen === 'title' ? null : navButton(app, 'title', UI.header.title),
    ),
  );
}

/**
 * 「ふりがな あり／なし」「音 あり／なし」のような、押すたびに切りかわるボタン。
 * @param {import('../../main.js').App} app
 * @param {Object} options
 * @param {string} options.key  フォーカスを戻すための名前（juice.js も header-sound を見ている）
 * @param {boolean} options.on
 * @param {string} options.label 読み上げ用の名前
 * @param {[string, string]} options.texts [あり のときの文, なし のときの文]
 * @param {(progress: any) => any} options.toggle
 */
function toggleButton(app, { key, on, label, texts, toggle }) {
  return h(
    'button',
    {
      class: `header-btn header-btn--toggle${on ? ' is-on' : ''}`,
      type: 'button',
      'aria-pressed': String(on),
      dataset: { focusKey: key },
      onClick: () => app.update(toggle),
    },
    h('span', { class: 'visually-hidden' }, label),
    on ? texts[0] : texts[1],
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
