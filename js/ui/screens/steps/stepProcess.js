// ステップ3「加工方法を選ぶ」の右の列：部品ごとの加工方法カード。
// 選んだ材料に合わない加工方法は、うすく表示して理由を出し、選べないようにする。

import { h, fill, formatNumber } from '../../dom.js';
import { UI } from '../../../data/uiText.js';
import { STEP } from '../../../core/constants.js';
import { allProcessesChosen, processAvailability } from '../../../core/rules.js';
import { chooseProcess } from '../../../core/gameState.js';
import { renderChoiceCard } from '../../components/choiceCard.js';
import { renderPartTabs } from '../../components/partTabs.js';
import { renderPartStepFooter } from '../../components/stepFooter.js';
import { renderProsCons } from '../../components/prosCons.js';

/**
 * @param {import('../../../main.js').App} app
 * @param {import('../../../data/requests.js').GameRequest} request
 * @returns {HTMLElement}
 */
export function renderStepProcess(app, request) {
  const { design, partId } = app.progress.session;
  const part = request.parts.find((item) => item.id === partId);
  const material = app.catalog.materials.get(design.materials[part.id]);
  const isDone = (id) => Boolean(design.processes[id]);

  return h(
    'section',
    { class: 'panel panel--choices', 'aria-labelledby': 'choices-heading' },
    h('h2', { class: 'panel__heading', id: 'choices-heading', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.stepProcess.heading),
    renderPartTabs(app, request, isDone),
    h('p', { class: 'choices-lead' }, fill(UI.stepProcess.forMaterial, { material: material.name })),
    h(
      'div',
      { class: 'panel__scroll' },
      h('div', { class: 'card-grid card-grid--one' }, part.processIds.map((id) => renderProcessCard(app, request, part, material, id))),
    ),
    renderProcessFooter(app, request, part, isDone),
  );
}

function renderProcessCard(app, request, part, material, processId) {
  const process = app.catalog.processes.get(processId);
  const availability = processAvailability(process, material);
  return renderChoiceCard(
    {
      key: `process-${part.id}-${processId}`,
      selected: app.progress.session.design.processes[part.id] === processId,
      disabled: !availability.ok,
      onSelect: () => app.update((progress) => chooseProcess(progress, request, app.catalog, part.id, processId)),
    },
    [
      h(
        'span',
        { class: 'choice-card__top' },
        h('span', { class: 'choice-card__name' }, process.name),
        h('span', { class: 'choice-card__price' }, fill(UI.stepProcess.costPlus, { cost: formatNumber(process.costPerUnit * part.size) })),
      ),
      availability.ok
        ? [h('span', { class: 'choice-card__text' }, process.summary), renderProsCons(part.processNotes?.[processId])]
        : h('span', { class: 'choice-card__reason' }, h('strong', {}, UI.stepProcess.unsuitable), availability.reason),
    ],
  );
}

function renderProcessFooter(app, request, part, isDone) {
  return renderPartStepFooter(app, request, part, isDone, {
    texts: UI.stepProcess,
    allDone: allProcessesChosen(request, app.progress.session.design),
    nextStep: STEP.reinforce,
  });
}
