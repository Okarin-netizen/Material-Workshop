// 画面上部のステップ表示（① 依頼を読む 〜 ⑤ テストと結果）。
// 今いるステップがわかり、済んだステップ（進めるステップ）へはボタンで移れる。

import { h } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { canEnterStep, goToStep } from '../../core/gameState.js';
import { plain } from './ruby.js';

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

/**
 * @param {import('../../main.js').App} app
 * @param {import('../../data/requests.js').GameRequest} request
 * @returns {HTMLElement}
 */
export function renderStepBar(app, request) {
  const session = app.progress.session;
  const items = UI.steps.map((label, index) => {
    const step = index + 1;
    const current = session.step === step;
    const reachable = canEnterStep(session, request, step);
    const state = current ? 'current' : reachable ? 'done' : 'locked';
    return h(
      'li',
      {},
      h(
        'button',
        {
          type: 'button',
          class: `step-btn step-btn--${state}`,
          'aria-current': current ? 'step' : null,
          'aria-disabled': reachable ? null : 'true',
          dataset: { focusKey: `step-${step}` },
          onClick: () => reachable && !current && app.update((progress) => goToStep(progress, request, step)),
        },
        h('span', { class: 'step-btn__num', 'aria-hidden': 'true' }, CIRCLED_NUMBERS[index]),
        h('span', { class: 'visually-hidden' }, `${UI.stepLabel}${step} `),
        label,
        reachable ? null : h('span', { class: 'visually-hidden' }, `（${UI.stepLocked}）`),
      ),
    );
  });
  return h('nav', { class: 'step-bar', 'aria-label': plain(UI.stepLabel) }, h('ol', {}, items));
}
