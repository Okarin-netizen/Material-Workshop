// ステップ2「材料を選ぶ」の右の列：部品ごとの材料カード。

import { h, fill, formatNumber } from '../../dom.js';
import { UI } from '../../../data/uiText.js';
import { CATEGORIES } from '../../../data/traits.js';
import { STEP } from '../../../core/constants.js';
import { allMaterialsChosen } from '../../../core/rules.js';
import { chooseMaterial, goToStep, selectPart } from '../../../core/gameState.js';
import { renderChoiceCard, renderSwatch } from '../../components/choiceCard.js';
import { renderPartTabs, nextUndonePart } from '../../components/partTabs.js';
import { renderStepFooter } from '../../components/stepFooter.js';

/**
 * @param {import('../../../main.js').App} app
 * @param {import('../../../data/requests.js').GameRequest} request
 * @returns {HTMLElement}
 */
export function renderStepMaterial(app, request) {
  const { design, partId } = app.progress.session;
  const part = request.parts.find((item) => item.id === partId);
  const isDone = (id) => Boolean(design.materials[id]);

  return h(
    'section',
    { class: 'panel panel--choices', 'aria-labelledby': 'choices-heading' },
    h('h2', { class: 'panel__heading', id: 'choices-heading', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.stepMaterial.heading),
    renderPartTabs(app, request, isDone),
    h(
      'div',
      { class: 'panel__scroll' },
      h('div', { class: 'card-grid card-grid--two' }, part.materialIds.map((id) => renderMaterialCard(app, request, part, id))),
    ),
    renderMaterialFooter(app, request, part, isDone),
  );
}

function renderMaterialCard(app, request, part, materialId) {
  const material = app.catalog.materials.get(materialId);
  const category = CATEGORIES[material.category];
  const selected = app.progress.session.design.materials[part.id] === materialId;
  return renderChoiceCard(
    {
      key: `material-${part.id}-${materialId}`,
      selected,
      onSelect: () => app.update((progress) => chooseMaterial(progress, request, app.catalog, part.id, materialId)),
    },
    [
      h(
        'span',
        { class: 'choice-card__top' },
        h('span', { class: `tag tag--${category.tone}` }, category.label),
        h('span', { class: 'choice-card__price' }, fill(UI.stepMaterial.price, { price: formatNumber(material.price * part.size) })),
      ),
      h('span', { class: 'choice-card__name' }, material.name),
      renderSwatch(material.look),
      h('span', { class: 'choice-card__text' }, material.summary),
      material.fact ? h('span', { class: 'choice-card__fact' }, material.fact) : null,
      part.materialNotes?.[materialId] ? h('span', { class: 'choice-card__note' }, part.materialNotes[materialId]) : null,
    ],
  );
}

/** 次の部品がまだなら「次の部品へ」、全部決まったら「加工方法を選ぶ」 */
function renderMaterialFooter(app, request, part, isDone) {
  const next = isDone(part.id) ? nextUndonePart(request, part.id, isDone) : null;
  if (next) {
    return renderStepFooter({
      label: fill(UI.stepMaterial.nextPart, { part: next.name }),
      enabled: true,
      key: 'next-part',
      onClick: () => app.update((progress) => selectPart(progress, next.id)),
    });
  }
  return renderStepFooter({
    label: UI.stepMaterial.next,
    enabled: allMaterialsChosen(request, app.progress.session.design),
    note: UI.stepMaterial.needAll,
    key: 'next-step',
    onClick: () => app.update((progress) => goToStep(selectPart(progress, request.parts[0].id), request, STEP.process)),
  });
}
