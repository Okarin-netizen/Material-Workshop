// 操作の手ごたえ（押した・選んだ・変わった が目と耳でわかるようにする）。
//
// 画面は操作のたびに全部描き直すので、「何が変わったか」は描き直しの前後をくらべて見つける。
// document の click を、描き直しの前（capture）と後（bubble）で1回ずつ受け取る：
//   前：押したボタン・指標・費用・製品の絵を覚えておく。押せないボタンなら、ゆらして理由を光らせる。
//   後：選んだカードをはずませ、変わった指標のバーを前の値から動かし「+12」のように差を出す。
// 各画面のコードはさわらずにすむ。動きを減らす設定のときは動かさない（音だけ鳴る）。

import { playUiSound } from './sound.js';
import { JUICE } from '../core/constants.js';

/** @type {{key: string, kind: string, meters: (number|null)[], cost: string, art: string, view: string}|null} */
let before = null;

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** 今の画面の「場所」。ちがっていれば別の画面・ステップに進んだということ */
function viewKey() {
  const step = document.querySelector('.step-btn[aria-current="step"]');
  return `${document.querySelector('main')?.className ?? ''}|${step?.textContent ?? ''}`;
}

function readMeters() {
  return [...document.querySelectorAll('.meters .meter__bar')].map((bar) => {
    const value = bar.getAttribute('aria-valuenow');
    return value === null ? null : Number(value);
  });
}

function readCost() {
  return document.querySelector('.cost-bar__track i')?.style.width ?? '';
}

function readArt() {
  return document.querySelector('.panel--board .art-frame')?.innerHTML ?? '';
}

/**
 * アニメーション用のクラスをつけ直す（同じものを続けて押しても毎回動くように）。
 * @param {Element|null} element
 * @param {string} className
 */
function replay(element, className) {
  if (!element || reducedMotion()) return;
  element.classList.remove(className);
  void element.getBoundingClientRect(); // つけ直しを反映させる
  element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
}

function onClickBefore(event) {
  before = null;
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  if (!button) return;
  if (button.getAttribute('aria-disabled') === 'true') {
    // 押して何も起きない、をなくす：ゆれて「ブブッ」、押せない理由（あれば）を光らせる
    playUiSound('blocked');
    replay(button, 'is-shaking');
    const noteId = button.getAttribute('aria-describedby');
    replay(noteId ? document.getElementById(noteId) : button.querySelector('.choice-card__reason'), 'is-flashing');
    return;
  }
  before = {
    key: button.dataset.focusKey ?? '',
    kind: button.classList.contains('choice-card') ? 'card' : 'button',
    meters: readMeters(),
    cost: readCost(),
    art: readArt(),
    view: viewKey(),
  };
}

function onClickAfter() {
  if (!before) return;
  const { key, kind, meters, cost, art, view } = before;
  before = null;
  const button = key ? document.querySelector(`[data-focus-key="${CSS.escape(key)}"]`) : null;

  if (key === 'header-sound') {
    if (button?.getAttribute('aria-pressed') === 'true') playUiSound('on');
    return;
  }
  if (kind === 'card' && button) {
    const selected = button.getAttribute('aria-pressed') === 'true';
    playUiSound(selected ? 'select' : 'deselect');
    replay(button, selected ? 'is-popping' : 'is-dropping');
  } else if (viewKey() !== view) {
    playUiSound('step');
  }

  // 絵は枠ではなく中の svg をはずませる（枠の大きさは変えない）
  if (art && readArt() !== art) replay(document.querySelector('.panel--board .art-frame > svg'), 'is-popping');
  animateMeters(meters);
  animateCost(cost);
}

/** 変わった指標だけ、前の値からバーを伸び縮みさせ、差（+12 / −8）を浮かせる */
function animateMeters(previous) {
  const bars = [...document.querySelectorAll('.meters .meter__bar')];
  if (bars.length !== previous.length) return;
  bars.forEach((bar, index) => {
    const value = bar.getAttribute('aria-valuenow');
    const old = previous[index];
    if (value === null || Number(value) === old) return;
    const meter = bar.closest('.meter');
    if (!reducedMotion()) {
      // はじめて値が出たときは 0 から伸ばす
      const fillBar = bar.querySelector('i');
      const target = fillBar.style.width;
      fillBar.style.transition = 'none';
      fillBar.style.width = `${old ?? 0}%`;
      void fillBar.getBoundingClientRect();
      fillBar.style.transition = '';
      fillBar.style.width = target;
    }
    if (old === null) return;
    const diff = Number(value) - old;
    if (Math.abs(diff) < JUICE.minMeterDiff) return;
    const chip = document.createElement('span');
    chip.className = `meter__diff ${diff > 0 ? 'is-up' : 'is-down'}`;
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = diff > 0 ? `+${diff}` : `−${-diff}`;
    meter.append(chip);
    setTimeout(() => chip.remove(), JUICE.diffShowMs);
  });
}

function animateCost(previousWidth) {
  const fillBar = document.querySelector('.cost-bar__track i');
  if (!fillBar || !previousWidth || fillBar.style.width === previousWidth || reducedMotion()) return;
  const target = fillBar.style.width;
  fillBar.style.transition = 'none';
  fillBar.style.width = previousWidth;
  void fillBar.getBoundingClientRect();
  fillBar.style.transition = '';
  fillBar.style.width = target;
}

/**
 * 数字キー 1〜9 で、右の列の n 番目のカードを選ぶ（キーボードだけでもテンポよく遊べるように）。
 * 文字を入力している欄では何もしない。
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (!/^[1-9]$/.test(event.key)) return;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
  if (document.querySelector('dialog[open]')) return;
  const cards = document.querySelectorAll('.panel--choices .choice-card');
  const card = cards[Number(event.key) - 1];
  if (!card) return;
  event.preventDefault();
  card.focus();
  card.click();
}

/** 1回だけ呼ぶ（main.js の起動時） */
export function installJuice() {
  document.addEventListener('click', onClickBefore, true);
  document.addEventListener('click', onClickAfter, false);
  document.addEventListener('keydown', onKeyDown);
}
