// ステップ1「依頼を読む」の右の列：作る部品と進め方。

import { h } from '../../dom.js';
import { UI } from '../../../data/uiText.js';
import { STEP } from '../../../core/constants.js';
import { goToStep } from '../../../core/gameState.js';
import { renderStepFooter } from '../../components/stepFooter.js';

/**
 * @param {import('../../../main.js').App} app
 * @param {import('../../../data/requests.js').GameRequest} request
 * @returns {HTMLElement}
 */
export function renderStepRead(app, request) {
  return h(
    'section',
    { class: 'panel panel--choices', 'aria-labelledby': 'choices-heading' },
    h('h2', { class: 'panel__heading', id: 'choices-heading', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.stepRead.heading),
    h(
      'div',
      { class: 'panel__scroll' },
      h('h3', { class: 'sub-heading' }, UI.stepRead.parts),
      h('ul', { class: 'read-parts' }, request.parts.map((part) => h('li', {}, part.name))),
      h('h3', { class: 'sub-heading' }, UI.stepRead.flow),
      h('ol', { class: 'read-flow' }, UI.stepRead.flowLines.map((line) => h('li', {}, line))),
    ),
    renderStepFooter({
      label: UI.stepRead.next,
      enabled: true,
      key: 'next-step',
      onClick: () => app.update((progress) => goToStep(progress, request, STEP.material)),
    }),
  );
}
