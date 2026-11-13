// 依頼ボード：ランクごとの依頼の一覧、星、ロック状態。先生用の設定（すべての依頼を開く・最初からやり直す）。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { CLEARS_TO_UNLOCK_NEXT_RANK } from '../../core/constants.js';
import { isRankUnlocked, recordOf, setUnlockAll, startRequest, totalStars, titleIndex, nextTitle } from '../../core/gameState.js';
import { TITLES } from '../../data/rewards.js';
import { renderStars } from '../components/stars.js';
import { renderClientArt } from '../components/clientArt.js';

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderBoard(app) {
  const { ranks, requests } = app.data;
  return h(
    'main',
    { class: 'screen screen--page', id: 'main' },
    h(
      'div',
      { class: 'page-card page-card--board' },
      h(
        'div',
        { class: 'board-head' },
        h('h1', { class: 'page-title', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.board.heading),
        renderStatus(app),
      ),
      totalStars(app.progress) >= TITLES.at(-1).stars ? h('p', { class: 'board-master' }, UI.board.allMaster) : null,
      h('p', { class: 'page-lead' }, fill(UI.board.lead, { need: CLEARS_TO_UNLOCK_NEXT_RANK })),
      ranks.map((rank) => renderRank(app, rank, requests.filter((request) => request.rank === rank.id))),
      renderTeacherSettings(app),
    ),
  );
}

/** 星の合計・工房の称号・次の称号まで・予想の的中 */
function renderStatus(app) {
  const stars = totalStars(app.progress);
  const title = TITLES[titleIndex(stars)];
  const next = nextTitle(stars);
  const { hits, total } = app.progress.predictions;
  return h(
    'div',
    { class: 'board-status' },
    h('p', { class: 'board-title' }, UI.board.titleLabel, ' ', h('span', { class: 'board-title__name' }, title.name)),
    h('p', { class: 'board-total' }, fill(UI.board.starsTotal, { count: stars })),
    next ? h('p', { class: 'board-sub' }, fill(UI.board.nextTitle, { need: next.need, title: TITLES[next.index].name })) : null,
    total > 0 ? h('p', { class: 'board-sub' }, fill(UI.board.predictions, { hits, total })) : null,
  );
}

function renderRank(app, rank, requests) {
  const unlocked = isRankUnlocked(app.progress, app.data.ranks, rank.id, app.data.requests);
  return h(
    'section',
    { class: `rank${unlocked ? '' : ' is-locked'}`, 'aria-labelledby': `rank-${rank.id}` },
    h(
      'h2',
      { class: 'rank__title', id: `rank-${rank.id}` },
      rank.name,
      unlocked ? null : h('span', { class: 'rank__lock' }, fill(UI.board.lockedRank, { need: CLEARS_TO_UNLOCK_NEXT_RANK })),
    ),
    h('ul', { class: 'request-list' }, requests.map((request) => h('li', {}, renderRequestCard(app, request, unlocked)))),
  );
}

function renderRequestCard(app, request, unlocked) {
  const record = recordOf(app.progress, request.id);
  const status = !unlocked ? UI.board.locked : record.bestStars > 0 ? UI.board.cleared : UI.board.notStarted;
  return h(
    'button',
    {
      type: 'button',
      class: `request-card${unlocked ? '' : ' is-locked'}${record.bestStars > 0 ? ' is-cleared' : ''}`,
      'aria-disabled': unlocked ? null : 'true',
      dataset: { focusKey: `request-${request.id}` },
      onClick: () => {
        if (!unlocked) return;
        app.update((progress) => startRequest(progress, request, app.catalog));
        app.navigate('workshop');
      },
    },
    h('span', { class: 'request-card__number' }, String(request.number)),
    renderClientArt(request.client.look, 44),
    h(
      'span',
      { class: 'request-card__body' },
      h('strong', { class: 'request-card__title' }, request.title),
      h('span', { class: 'request-card__client' }, request.client.name),
    ),
    h('span', { class: 'request-card__status' }, renderStars(record.bestStars), h('small', {}, status)),
  );
}

function renderTeacherSettings(app) {
  const on = app.progress.unlockAll;
  return h(
    'section',
    { class: 'teacher-settings', 'aria-labelledby': 'teacher-heading' },
    h('h2', { class: 'teacher-settings__title', id: 'teacher-heading' }, UI.board.teacherSettings),
    h(
      'button',
      {
        type: 'button',
        class: `toggle${on ? ' is-on' : ''}`,
        role: 'switch',
        'aria-checked': String(on),
        dataset: { focusKey: 'unlock-all' },
        onClick: () => app.update((progress) => setUnlockAll(progress, !progress.unlockAll)),
      },
      h('span', { class: 'toggle__knob', 'aria-hidden': 'true' }),
      UI.board.unlockAll,
    ),
    h('button', { type: 'button', class: 'btn btn--text', dataset: { focusKey: 'board-reset' }, onClick: () => app.confirmReset() }, UI.board.reset),
  );
}
