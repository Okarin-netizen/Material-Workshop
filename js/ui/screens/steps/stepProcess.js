// ステップ3「加工方法を選ぶ」の右の列：部品ごとの加工方法カード。
// 選んだ材料に合わない加工方法は、うすく表示して理由を出し、選べないようにする。

import { h, fill, formatNumber } from '../../dom.js';
import { UI } from '../../../data/uiText.js';
import { STEP } from '../../../core/constants.js';
import { allProcessesChosen, processAvailability } from '../../../core/rules.js';
import { chooseProcess, goToStep, selectPart } from '../../../core/gameState.js';
import { renderChoiceCard } from '../../components/choiceCard.js';
import { renderPartTabs, nextUndonePart } from '../../components/partTabs.js';
import { renderStepFooter } from '../../components/stepFooter.js';

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
        ? [h('span', { class: 'choice-card__text' }, process.summary), renderProcessNote(part.processNotes?.[processId])]
        : h('span', { class: 'choice-card__reason' }, h('strong', {}, UI.stepProcess.unsuitable), availability.reason),
    ],
  );
}

/** この依頼での、その加工方法のよい点（◯）と注意点（△） */
function renderProcessNote(note) {
  if (!note) return null;
  return h(
    'span',
    { class: 'pros-cons' },
    note.good ? h('span', { class: 'pros-cons__good' }, `${UI.stepReinforce.good} `, note.good) : null,
    note.bad ? h('span', { class: 'pros-cons__bad' }, `${UI.stepReinforce.bad} `, note.bad) : null,
  );
}

function renderProcessFooter(app, request, part, isDone) {
  const next = isDone(part.id) ? nextUndonePart(request, part.id, isDone) : null;
  if (next) {
    return renderStepFooter({
      label: fill(UI.stepProcess.nextPart, { part: next.name }),
      enabled: true,
      key: 'next-part',
      onClick: () => app.update((progress) => selectPart(progress, next.id)),
    });
  }
  return renderStepFooter({
    label: UI.stepProcess.next,
    enabled: allProcessesChosen(request, app.progress.session.design),
    note: UI.stepProcess.needAll,
    key: 'next-step',
    onClick: () => app.update((progress) => goToStep(progress, request, STEP.reinforce)),
  });
}
