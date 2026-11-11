// 選べるカード（材料・加工方法・工夫で共通）。
// <button> で作るので、Tab で移動し Enter / Space で選べる。
// 選べないカードは aria-disabled にして、理由を読めるようにフォーカスは受けつける。

import { h } from '../dom.js';

/**
 * @param {Object} options
 * @param {string} options.key        フォーカスを戻すための名前（画面内で重ならないもの）
 * @param {boolean} options.selected
 * @param {boolean} [options.disabled]
 * @param {'single'|'multi'} [options.mode] single は1つだけ選ぶ（材料・加工）、multi は複数（工夫）
 * @param {() => void} options.onSelect
 * @param {string} [options.extraClass]
 * @param {any[]} children カードの中身
 * @returns {HTMLElement}
 */
export function renderChoiceCard({ key, selected, disabled = false, mode = 'single', onSelect, extraClass = '' }, children) {
  const classes = ['choice-card', selected ? 'is-selected' : '', disabled ? 'is-disabled' : '', extraClass].filter(Boolean).join(' ');
  return h(
    'button',
    {
      type: 'button',
      class: classes,
      'aria-pressed': String(selected),
      'aria-disabled': disabled ? 'true' : null,
      dataset: { focusKey: key, mode },
      onClick: () => {
        if (!disabled) onSelect();
      },
    },
    children,
  );
}

/**
 * 材料の色見本。模様は材料データの look.pattern で決まる。
 * @param {import('../../data/materials.js').MaterialLook} look
 * @returns {HTMLElement}
 */
export function renderSwatch(look) {
  return h('span', {
    class: `swatch swatch--${look.pattern}`,
    'aria-hidden': 'true',
    style: { '--swatch-base': look.base, '--swatch-dark': look.dark },
  });
}
