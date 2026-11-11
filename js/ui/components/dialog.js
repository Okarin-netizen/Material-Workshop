// 確認ダイアログ（「最初からやり直す」など、もとに戻せない操作の前に出す）。
// ブラウザの <dialog> を使うので、Esc で閉じられ、フォーカスもダイアログの中に閉じこめられる。

import { h } from '../dom.js';

/**
 * @param {{title: string, body: string, yes: string, no: string}} texts
 * @returns {Promise<boolean>} 「はい」なら true
 */
export function confirmDialog({ title, body, yes, no }) {
  return new Promise((resolve) => {
    const dialog = h(
      'dialog',
      { class: 'confirm-dialog', 'aria-labelledby': 'confirm-title' },
      h('h2', { id: 'confirm-title', class: 'confirm-dialog__title' }, title),
      h('p', { class: 'confirm-dialog__body' }, body),
      h(
        'div',
        { class: 'confirm-dialog__buttons' },
        h('button', { type: 'button', class: 'btn btn--sub', onClick: () => dialog.close('no') }, no),
        h('button', { type: 'button', class: 'btn btn--danger', onClick: () => dialog.close('yes') }, yes),
      ),
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(dialog.returnValue === 'yes');
    });
    document.body.append(dialog);
    dialog.showModal();
    // まちがえて消さないよう、最初のフォーカスは「やめる」に置く
    dialog.querySelector('.btn--sub').focus();
  });
}
