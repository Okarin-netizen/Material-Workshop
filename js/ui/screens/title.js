// タイトル画面：ゲームの顔。ロゴ・作品のショーケース・工房の称号と、はじめから／つづきから／遊び方／このアプリについて（バージョン）。
// 「はじめから」は、記録があれば消してよいか確かめてから、依頼1を始める（app.restart）。
//
// 演出の方針（待たせない・押して何も起きないをなくす）：
//   ・ロゴが1文字ずつはずんで出るのは、ページを開いて最初に出たときだけ（ふりがなの切りかえなどの描き直しでは出さない）。
//     出ている途中でもボタンはすぐ押せる。
//   ・ショーケースは依頼の作品が順に替わる。押すとすぐ次の作品になる（はずむ・音）。
//   ・動きを減らす設定のときは、ロゴも作品も動かさず、作品は押したときだけ替える。

import { h, fill } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { TITLES } from '../../data/rewards.js';
import { APP_VERSION } from '../../data/about.js';
import { renderProductArt } from '../art/index.js';
import { playUiSound } from '../sound.js';
import { hasSavedPlay, totalStars, titleIndex, nextTitle } from '../../core/gameState.js';
import { TITLE_SCREEN } from '../../core/constants.js';
import { plain } from '../components/ruby.js';

/**
 * ショーケースに出す作品（見た目だけ。進行には関係しない）。依頼ごとの★3の設計の材料で塗る。
 * 依頼にない id は飛ばすので、依頼を減らしても壊れない。
 */
const SHOWCASE = [
  { requestId: 'stationBench', materials: { seat: 'sugi', frame: 'stainless' }, reinforcements: ['triangle'] },
  { requestId: 'drinkBottle', materials: { body: 'pet' }, reinforcements: ['crossSection'] },
  { requestId: 'parkBench', materials: { seat: 'sugi' }, reinforcements: ['paint'] },
  { requestId: 'bicycleFrame', materials: { frame: 'aluminumAlloy' }, reinforcements: ['crossSection', 'triangle'] },
  { requestId: 'panHandle', materials: { handle: 'phenol' }, reinforcements: [] },
  { requestId: 'bookshelf', materials: { body: 'glulam' }, reinforcements: ['panel'] },
  { requestId: 'kitchenKnife', materials: { blade: 'steel' }, reinforcements: ['quench', 'temper'] },
  { requestId: 'handrail', materials: { rail: 'stainless' }, reinforcements: [] },
];

/** 材料のかけら（うしろに浮かぶ飾り）。木・金属・プラスチックの3種類をくり返す */
const CHIP_KINDS = ['wood', 'metal', 'plastic'];

/** 何番目の作品を出しているか（描き直しても戻らないように、画面の外に持つ） */
let showcaseIndex = 0;
/** ロゴの登場演出をもう見せたか */
let introShown = false;
/** 自動で作品を替えるタイマー */
let showcaseTimer = 0;

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderTitle(app) {
  const intro = !introShown && !reducedMotion();
  introShown = true;

  return h(
    'main',
    { class: `screen screen--title${intro ? ' is-intro' : ''}`, id: 'main' },
    renderChips(),
    h(
      'div',
      { class: 'title-card' },
      renderLogo(),
      h('p', { class: 'title-lead' }, UI.title.lead),
      renderShowcase(app),
      renderRank(app),
      renderMainButtons(app),
      h('p', { class: 'title-autosave' }, UI.title.autoSave),
      h(
        'div',
        { class: 'title-links' },
        h('button', { type: 'button', class: 'btn btn--text', dataset: { focusKey: 'title-howto' }, onClick: () => app.navigate('howto') }, UI.title.howto),
        h('button', { type: 'button', class: 'btn btn--text', dataset: { focusKey: 'title-about' }, onClick: () => app.navigate('about') }, UI.title.about),
      ),
      h('p', { class: 'title-version' }, fill(UI.title.version, { version: APP_VERSION })),
    ),
  );
}

/** ロゴ：1文字ずつの箱にして、--i の順にはずませる。読み上げはまとめて1つの名前にする */
function renderLogo() {
  return h(
    'h1',
    { class: 'title-logo', 'aria-label': plain(UI.appName) },
    h('span', { class: 'title-logo__ribbon', 'aria-hidden': 'true' }, UI.title.ribbon),
    h(
      'span',
      { class: 'title-logo__word', 'aria-hidden': 'true' },
      UI.title.logo.map((part, index) => h('span', { class: 'title-logo__char', style: { '--i': String(index) } }, part)),
    ),
  );
}

/** うしろに浮かぶ材料のかけら（飾り） */
function renderChips() {
  const chips = [];
  for (let index = 0; index < TITLE_SCREEN.chips; index += 1) {
    chips.push(h('span', { class: `title-chip title-chip--${CHIP_KINDS[index % CHIP_KINDS.length]}`, style: { '--n': String(index) } }));
  }
  return h('div', { class: 'title-chips', 'aria-hidden': 'true' }, chips);
}

/** 依頼の作品が順に替わるショーケース。押すとすぐ次へ */
function renderShowcase(app) {
  const items = SHOWCASE.filter((item) => app.catalog.requests.has(item.requestId));
  if (!items.length) return null;
  showcaseIndex %= items.length;

  const stage = h('span', { class: 'title-showcase__stage' });
  const caption = h('span', { class: 'title-showcase__caption' });
  const button = h(
    'button',
    {
      type: 'button',
      class: 'title-showcase',
      'aria-label': plain(UI.title.showcaseLabel),
      dataset: { focusKey: 'title-showcase' },
      onClick: () => {
        playUiSound('select');
        show(showcaseIndex + 1, true);
        restartTimer();
      },
    },
    stage,
    caption,
  );

  /** @param {number} index @param {boolean} bounce */
  function show(index, bounce) {
    showcaseIndex = ((index % items.length) + items.length) % items.length;
    const item = items[showcaseIndex];
    const request = app.catalog.requests.get(item.requestId);
    const art = renderProductArt(request, { materials: item.materials, processes: {}, reinforcements: item.reinforcements }, app.catalog);
    if (bounce && !reducedMotion()) art.classList.add('is-entering');
    stage.replaceChildren(art);
    caption.replaceChildren(h('span', {}, fill(UI.title.showcase, { number: request.number, title: request.title })));
  }

  function restartTimer() {
    clearInterval(showcaseTimer);
    if (reducedMotion()) return;
    showcaseTimer = setInterval(() => {
      // タイトル画面を離れたら（描き直しで別のショーケースになったら）止める
      if (!button.isConnected) {
        clearInterval(showcaseTimer);
        return;
      }
      if (document.hidden) return;
      show(showcaseIndex + 1, true);
    }, TITLE_SCREEN.showcaseMs);
  }

  show(showcaseIndex, false);
  restartTimer();
  return button;
}

/** 星を集めたことがある人には、工房の称号と次の目標を出す（目標を目の前に） */
function renderRank(app) {
  const stars = totalStars(app.progress);
  if (stars <= 0) return null;
  const current = TITLES[titleIndex(stars)];
  const next = nextTitle(stars);
  return h(
    'p',
    { class: 'title-rank' },
    h('span', { class: 'title-rank__now' }, fill(UI.title.rank, { title: current.name, stars })),
    next ? h('span', { class: 'title-rank__next' }, fill(UI.title.rankNext, { need: next.need, title: TITLES[next.index].name })) : null,
  );
}

/**
 * 「はじめから」と「つづきから」。記録があれば「つづきから」を大きく（Enter だけで続けられる）、
 * なければ「はじめから」を大きくする。大きいほうにフォーカスを置く。
 */
function renderMainButtons(app) {
  const saved = hasSavedPlay(app.progress);
  const session = app.progress.session;
  const resumeRequest = session ? app.catalog.requests.get(session.requestId) : null;

  const startButton = h(
    'button',
    {
      type: 'button',
      class: `btn btn--big ${saved ? 'btn--sub' : 'btn--primary title-main'}`,
      dataset: saved ? { focusKey: 'title-start' } : { focusKey: 'title-start', autofocus: 'true' },
      onClick: () => app.restart(),
    },
    UI.title.start,
    h('small', { class: 'btn__note' }, saved ? UI.title.startNoteSaved : UI.title.startNote),
  );

  let resumeNote = UI.title.resumeNone;
  if (resumeRequest) resumeNote = fill(UI.title.resumeNote, { number: resumeRequest.number, title: resumeRequest.title });
  else if (saved) resumeNote = UI.title.resumeNoteBoard;

  const resumeButton = h(
    'button',
    {
      type: 'button',
      class: `btn btn--big ${saved ? 'btn--primary title-main' : 'btn--sub'}`,
      'aria-disabled': saved ? null : 'true',
      dataset: saved ? { focusKey: 'title-resume', autofocus: 'true' } : { focusKey: 'title-resume' },
      onClick: () => {
        if (!saved) return;
        // 取り組み中の依頼があればその続きへ、なければ依頼ボードへ
        app.navigate(resumeRequest ? 'workshop' : 'board');
      },
    },
    UI.title.resume,
    h('small', { class: 'btn__note' }, resumeNote),
  );

  // 大きいほうを左に置く
  return h(
    'div',
    { class: 'title-buttons' },
    saved ? [resumeButton, startButton] : [startButton, resumeButton],
    h('p', { class: 'title-enter-hint', 'aria-hidden': 'true' }, UI.title.enterHint),
  );
}
