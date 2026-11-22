// 右の列のいちばん下にある「次へ」ボタン。押せないときは理由を横に出す。

import { h, fill } from '../dom.js';
import { goToStep, selectPart } from '../../core/gameState.js';
import { nextUndonePart } from './partTabs.js';

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

/**
 * 部品ごとに選ぶステップ（材料・加工方法）の「次へ」。
 * 選んだ部品の次にまだの部品があれば「○○を選ぶ ▶」、全部決まったら次のステップへ進むボタンにする。
 * 次のステップは最初の部品から始める。
 * @param {import('../../main.js').App} app
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {{id: string}} part 今選んでいる部品
 * @param {(partId: string) => boolean} isDone その部品の選択が済んでいるか
 * @param {Object} options
 * @param {{nextPart: string, next: string, needAll: string}} options.texts ボタンの文（uiText.js の stepMaterial など）
 * @param {boolean} options.allDone すべての部品が決まっているか
 * @param {number} options.nextStep 進む先のステップ
 * @returns {HTMLElement}
 */
export function renderPartStepFooter(app, request, part, isDone, { texts, allDone, nextStep }) {
  const next = isDone(part.id) ? nextUndonePart(request, part.id, isDone) : null;
  if (next) {
    return renderStepFooter({
      label: fill(texts.nextPart, { part: next.name }),
      enabled: true,
      key: 'next-part',
      onClick: () => app.update((progress) => selectPart(progress, next.id)),
    });
  }
  return renderStepFooter({
    label: texts.next,
    enabled: allDone,
    note: texts.needAll,
    key: 'next-step',
    onClick: () => app.update((progress) => goToStep(selectPart(progress, request.parts[0].id), request, nextStep)),
  });
}
