// 起動と画面の切りかえ。
// 進行状況（progress）はここだけが持ち、変えるときは app.update(変える関数) を使う。
// update のたびに自動で保存し、画面を描き直す。

import { MATERIALS } from './data/materials.js';
import { PROCESSES } from './data/processes.js';
import { REINFORCEMENTS } from './data/reinforcements.js';
import { REQUESTS, RANKS } from './data/requests.js';
import { UI } from './data/uiText.js';
import { CHANGELOG } from './data/about.js';
import { TITLES } from './data/rewards.js';
import { buildCatalog } from './core/rules.js';
import { createProgress, hasSavedPlay, restartProgress, startRequest } from './core/gameState.js';
import { loadProgress, saveProgress, clearProgress } from './core/storage.js';
import { validateData } from './core/validateData.js';
import { rememberScreen } from './core/navigation.js';
import { h } from './ui/dom.js';
import { setFuriganaEnabled, plain } from './ui/components/ruby.js';
import { setSoundEnabled } from './ui/sound.js';
import { installJuice } from './ui/juice.js';
import { renderHeader } from './ui/components/header.js';
import { confirmDialog } from './ui/components/dialog.js';
import { ART_DRAWERS } from './ui/art/index.js';
import { renderTitle } from './ui/screens/title.js';
import { renderHowto } from './ui/screens/howto.js';
import { renderBoard } from './ui/screens/board.js';
import { renderWorkshop } from './ui/screens/workshop.js';
import { renderZukan } from './ui/screens/zukan.js';
import { renderSummary } from './ui/screens/summary.js';
import { renderAbout } from './ui/screens/about.js';

/** @typedef {'title'|'howto'|'board'|'workshop'|'zukan'|'summary'|'about'} ScreenName */

/** 画面の名前と、その画面を作る関数 */
const SCREENS = {
  title: renderTitle,
  howto: renderHowto,
  board: renderBoard,
  workshop: renderWorkshop,
  zukan: renderZukan,
  summary: renderSummary,
  about: renderAbout,
};

/**
 * 画面から使う「アプリ」。
 * @typedef {Object} App
 * @property {{materials: any[], processes: any[], reinforcements: any[], requests: any[], ranks: any[]}} data
 * @property {import('./core/rules.js').Catalog} catalog
 * @property {import('./core/gameState.js').Progress} progress
 * @property {ScreenName} screen
 * @property {Record<string, any>} screenParams 画面の中だけの一時的な状態（図鑑で選んでいる項目など）
 * @property {() => (import('./data/requests.js').GameRequest|null)} currentRequest
 * @property {(change: (progress: any) => any) => void} update        進行状況を変えて、保存して、描き直す
 * @property {(change: (progress: any) => any) => void} updateQuietly 進行状況を変えて保存する（描き直さない。文字入力用）
 * @property {(screen: ScreenName) => void} navigate
 * @property {(change: (progress: any) => any, screen: ScreenName) => void} updateAndNavigate 進行状況を変えてから画面を移る（描き直しは1回）
 * @property {() => void} back 1つ前の画面へ戻る（なければタイトル）
 * @property {(params: Record<string, any>) => void} setScreenParams
 * @property {() => Promise<void>} confirmReset
 * @property {() => Promise<void>} restart タイトルの「はじめから」。記録があれば確かめてから消し、依頼1を始める
 */

const data = { materials: MATERIALS, processes: PROCESSES, reinforcements: REINFORCEMENTS, requests: REQUESTS, ranks: RANKS };
const catalog = buildCatalog(data);
const dataProblems = validateData({ ...data, uiText: [UI, TITLES], changelog: CHANGELOG }, catalog, { artNames: Object.keys(ART_DRAWERS) });
let saveWorks = true;
/** @type {ScreenName[]} これまでに通った画面（「もどる」で使う。同じ画面は1回だけ） */
let screenHistory = [];
let lastViewKey = '';

/** @type {App} */
const app = {
  data,
  catalog,
  progress: loadProgress(catalog),
  screen: 'title',
  screenParams: {},

  currentRequest() {
    return catalog.requests.get(this.progress.session?.requestId) ?? null;
  },

  update(change) {
    this.updateQuietly(change);
    render();
  },

  updateQuietly(change) {
    this.progress = change(this.progress);
    saveWorks = saveProgress(this.progress);
  },

  navigate(screen) {
    // 取り組み中の依頼がないのに作業画面へは行けないので、依頼ボードにする
    const target = screen === 'workshop' && !this.currentRequest() ? 'board' : screen;
    screenHistory = rememberScreen(screenHistory, this.screen, target);
    this.screen = target;
    this.screenParams = {};
    render();
  },

  updateAndNavigate(change, screen) {
    this.updateQuietly(change);
    this.navigate(screen);
  },

  back() {
    // 戻り先は履歴のいちばん後ろにあるので、navigate がそこまで巻き戻す
    this.navigate(screenHistory.at(-1) ?? 'title');
  },

  setScreenParams(params) {
    this.screenParams = { ...this.screenParams, ...params };
    render();
  },

  async confirmReset() {
    const ok = await confirmDialog({ title: UI.dialog.resetTitle, body: UI.dialog.resetBody, yes: UI.dialog.resetYes, no: UI.dialog.cancel });
    if (!ok) return;
    clearProgress();
    this.progress = createProgress();
    this.navigate('title');
    screenHistory = [];
  },

  async restart() {
    // 記録があるときだけ確かめる（まちがえて押しても、前の記録が消えないように）
    if (hasSavedPlay(this.progress)) {
      const ok = await confirmDialog({ title: UI.dialog.restartTitle, body: UI.dialog.restartBody, yes: UI.dialog.restartYes, no: UI.dialog.cancel });
      if (!ok) return;
    }
    const first = data.requests[0];
    screenHistory = [];
    // 依頼1がそのまま遊び方の練習になっているので、依頼ボードを飛ばしてすぐに始める
    this.updateAndNavigate((progress) => {
      const fresh = restartProgress(progress);
      return first ? startRequest(fresh, first, catalog) : fresh;
    }, first ? 'workshop' : 'board');
  },
};

// ── 描画 ───────────────────────────────────

function render() {
  setFuriganaEnabled(app.progress.furigana);
  setSoundEnabled(app.progress.sound);
  const focusKey = document.activeElement?.dataset?.focusKey;
  const root = document.getElementById('app');
  root.replaceChildren(...renderBanners(), renderHeader(app), SCREENS[app.screen](app));
  // 今の「場所」（画面とステップ）。juice.js も、画面が変わったかをこれで見分ける
  root.dataset.view = `${app.screen}:${app.screen === 'workshop' ? (app.progress.session?.step ?? '') : ''}`;
  document.title = plain(UI.appName);
  restoreFocus(focusKey);
}

/** データの問題や、保存できないことを知らせる帯 */
function renderBanners() {
  const banners = [];
  if (dataProblems.length) {
    banners.push(h('div', { class: 'banner banner--error', role: 'alert' }, h('strong', {}, UI.dataProblem), h('ul', {}, dataProblems.map((text) => h('li', { text })))));
  }
  if (!saveWorks) banners.push(h('div', { class: 'banner banner--warning', role: 'status' }, UI.saveFailed));
  return banners;
}

/**
 * 画面やステップが変わったときは見出しへ、同じ画面の描き直しなら直前に操作していたボタンへフォーカスを置く。
 * （キーボードで操作している人が、描き直しのたびに先頭へ戻されないようにするため）
 */
function restoreFocus(focusKey) {
  const viewKey = document.getElementById('app').dataset.view;
  const changedView = viewKey !== lastViewKey;
  lastViewKey = viewKey;
  if (changedView) {
    window.scrollTo(0, 0);
    const target = document.querySelector('[data-autofocus]') ?? document.querySelector('main h1, main h2');
    // 見出しはフォーカスできるようにする（ボタンは Tab の順番から外さないよう、そのまま）
    if (target && target.tagName !== 'BUTTON') target.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
    return;
  }
  if (focusKey) document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}

// ── 起動 ───────────────────────────────────

if (dataProblems.length) {
  console.error(`データの点検で ${dataProblems.length} 件の問題が見つかりました。\n${dataProblems.join('\n')}`);
}
installJuice();
render();
