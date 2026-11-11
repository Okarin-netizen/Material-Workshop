// 部品が2つある依頼で、どの部品を選んでいるかを切りかえるボタン。
// 部品が1つのときは何も出さない。

import { h } from '../dom.js';
import { UI } from '../../data/uiText.js';
import { selectPart } from '../../core/gameState.js';
import { plain } from './ruby.js';

/**
 * @param {import('../../main.js').App} app
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {(partId: string) => boolean} isDone その部品の選択が済んでいるか
 * @returns {HTMLElement|null}
 */
export function renderPartTabs(app, request, isDone) {
  if (request.parts.length < 2) return null;
  const current = app.progress.session.partId;
  return h(
    'div',
    { class: 'part-tabs', role: 'group', 'aria-label': plain(UI.stepMaterial.partTabs) },
    request.parts.map((part) =>
      h(
        'button',
        {
          type: 'button',
          class: `part-tab${part.id === current ? ' is-current' : ''}`,
          'aria-pressed': String(part.id === current),
          dataset: { focusKey: `part-tab-${part.id}` },
          onClick: () => app.update((progress) => selectPart(progress, part.id)),
        },
        h('span', { class: `part-tab__mark${isDone(part.id) ? ' is-done' : ''}`, 'aria-hidden': 'true' }, isDone(part.id) ? '✓' : '・'),
        part.name,
      ),
    ),
  );
}

/**
 * 選択がまだ済んでいない、次の部品（なければ null）。
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {string} currentPartId
 * @param {(partId: string) => boolean} isDone
 */
export function nextUndonePart(request, currentPartId, isDone) {
  return request.parts.find((part) => part.id !== currentPartId && !isDone(part.id)) ?? null;
}
