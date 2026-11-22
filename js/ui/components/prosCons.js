// カードの中の「◯ よい点」「△ 注意点」（加工方法・丈夫にする工夫のカードで共通）。

import { h } from '../dom.js';
import { UI } from '../../data/uiText.js';

/**
 * @param {{good?: string, bad?: string}|null|undefined} note
 * @returns {HTMLElement|null} よい点も注意点もなければ null
 */
export function renderProsCons(note) {
  if (!note?.good && !note?.bad) return null;
  return h(
    'span',
    { class: 'pros-cons' },
    note.good ? h('span', { class: 'pros-cons__good' }, `${UI.stepReinforce.good} `, note.good) : null,
    note.bad ? h('span', { class: 'pros-cons__bad' }, `${UI.stepReinforce.bad} `, note.bad) : null,
  );
}
