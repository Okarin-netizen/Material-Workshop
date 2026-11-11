// タイトル画面：はじめる／つづきから／遊び方／最初からやり直す／このアプリについて（バージョン）。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { APP_VERSION } from '../../data/about.js';
import { renderProductArt } from '../art/index.js';

/** タイトルの絵に使う依頼と設計（見た目だけ。進行には関係しない） */
const TITLE_ART = { requestId: 'stationBench', design: { materials: { seat: 'sugi', frame: 'stainless' }, processes: {}, reinforcements: ['triangle'] } };

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderTitle(app) {
  const session = app.progress.session;
  const resumeRequest = session ? app.catalog.requests.get(session.requestId) : null;
  const artRequest = app.catalog.requests.get(TITLE_ART.requestId);

  return h(
    'main',
    { class: 'screen screen--title', id: 'main' },
    h(
      'div',
      { class: 'title-card' },
      h('h1', { class: 'title-logo', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.appName),
      h('p', { class: 'title-lead' }, UI.title.lead),
      artRequest ? h('div', { class: 'title-art' }, renderProductArt(artRequest, TITLE_ART.design, app.catalog)) : null,
      h(
        'div',
        { class: 'title-buttons' },
        h('button', { type: 'button', class: 'btn btn--primary btn--big', dataset: { focusKey: 'title-start' }, onClick: () => app.navigate('board') }, UI.title.start),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn--sub btn--big',
            'aria-disabled': resumeRequest ? null : 'true',
            dataset: { focusKey: 'title-resume' },
            onClick: () => resumeRequest && app.navigate('workshop'),
          },
          UI.title.resume,
          resumeRequest ? h('small', { class: 'btn__note' }, fill(UI.title.resumeNote, { number: resumeRequest.number, title: resumeRequest.title })) : null,
        ),
        h('button', { type: 'button', class: 'btn btn--sub btn--big', dataset: { focusKey: 'title-howto' }, onClick: () => app.navigate('howto') }, UI.title.howto),
      ),
      h(
        'div',
        { class: 'title-links' },
        h('button', { type: 'button', class: 'btn btn--text', dataset: { focusKey: 'title-reset' }, onClick: () => app.confirmReset() }, UI.title.reset),
        h('button', { type: 'button', class: 'btn btn--text', dataset: { focusKey: 'title-about' }, onClick: () => app.navigate('about') }, UI.title.about),
      ),
      h('p', { class: 'title-version' }, fill(UI.title.version, { version: APP_VERSION })),
    ),
  );
}
