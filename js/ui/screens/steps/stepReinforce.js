// ステップ4「丈夫にする工夫」の右の列：工夫のカード（0個以上選べる）と「テストする」ボタン。

import { h, fill, formatNumber } from '../../dom.js';
import { UI } from '../../../data/uiText.js';
import { reinforcementAvailability } from '../../../core/rules.js';
import { reinforcementCost } from '../../../core/scoring.js';
import { toggleReinforcement, runTest } from '../../../core/gameState.js';
import { renderChoiceCard } from '../../components/choiceCard.js';
import { renderStepFooter } from '../../components/stepFooter.js';

/**
 * @param {import('../../../main.js').App} app
 * @param {import('../../../data/requests.js').GameRequest} request
 * @returns {HTMLElement}
 */
export function renderStepReinforce(app, request) {
  return h(
    'section',
    { class: 'panel panel--choices', 'aria-labelledby': 'choices-heading' },
    h('h2', { class: 'panel__heading', id: 'choices-heading', tabindex: '-1', dataset: { autofocus: 'true' } }, UI.stepReinforce.heading),
    h('p', { class: 'choices-lead' }, UI.stepReinforce.lead),
    h(
      'div',
      { class: 'panel__scroll' },
      h('div', { class: 'card-grid card-grid--one' }, request.reinforcements.map((entry) => renderReinforcementCard(app, request, entry))),
    ),
    renderStepFooter({
      label: UI.stepReinforce.test,
      enabled: true,
      key: 'run-test',
      onClick: () => app.update((progress) => runTest(progress, request, app.catalog)),
    }),
  );
}

function renderReinforcementCard(app, request, entry) {
  const { design } = app.progress.session;
  const reinforcement = app.catalog.reinforcements.get(entry.id);
  const selected = design.reinforcements.includes(entry.id);
  // 選んでいる工夫は、外せるようにいつでも押せる
  const availability = selected ? { ok: true } : reinforcementAvailability(request, design, entry.id, app.catalog);
  return renderChoiceCard(
    {
      key: `reinforcement-${entry.id}`,
      selected,
      disabled: !availability.ok,
      mode: 'multi',
      onSelect: () => app.update((progress) => toggleReinforcement(progress, request, app.catalog, entry.id)),
    },
    [
      h(
        'span',
        { class: 'choice-card__top' },
        h('span', { class: 'choice-card__check', 'aria-hidden': 'true' }, selected ? '✓' : ''),
        h('span', { class: 'choice-card__name' }, reinforcement.name),
        h('span', { class: 'choice-card__price' }, fill(UI.stepReinforce.costPlus, { cost: formatNumber(reinforcementCost(request, entry.id, app.catalog)) })),
      ),
      h('span', { class: 'choice-card__text' }, entry.detail ?? reinforcement.summary),
      availability.ok ? renderProsCons(reinforcement) : h('span', { class: 'choice-card__reason' }, h('strong', {}, UI.stepReinforce.unavailable), availability.reason),
    ],
  );
}

function renderProsCons(reinforcement) {
  if (!reinforcement.good && !reinforcement.bad) {
    return h('span', { class: 'choice-card__sub' }, reinforcement.summary);
  }
  return h(
    'span',
    { class: 'pros-cons' },
    reinforcement.good ? h('span', { class: 'pros-cons__good' }, `${UI.stepReinforce.good} `, reinforcement.good) : null,
    reinforcement.bad ? h('span', { class: 'pros-cons__bad' }, `${UI.stepReinforce.bad} `, reinforcement.bad) : null,
  );
}
