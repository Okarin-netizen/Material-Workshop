// 右の列のいちばん下にある「次へ」ボタン。押せないときは理由を横に出す。

import { h } from '../dom.js';

/**
 * @param {Object} options
 * @param {string} options.label
 * @param {boolean} options.enabled
 * @param {string} [options.note]  押せないときに出す説明
 * @param {() => void} options.onClick
 * @param {string} options.key     フォーカスを戻すための名前
 * @returns {HTMLElement}
 */
export function renderStepFooter({ label, enabled, note, onClick, key }) {
  return h(
    'div',
    { class: 'step-footer' },
    !enabled && note ? h('p', { class: 'step-footer__note', id: `${key}-note` }, note) : null,
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn--primary btn--wide',
        'aria-disabled': enabled ? null : 'true',
        'aria-describedby': !enabled && note ? `${key}-note` : null,
        dataset: { focusKey: key },
        onClick: () => enabled && onClick(),
      },
      label,
    ),
  );
}
