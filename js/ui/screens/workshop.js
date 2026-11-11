// 依頼に取り組む画面。ステップ1〜4は「依頼カード｜設計台｜選ぶカード」の3列、ステップ5は結果画面。

import { h } from '../dom.js';
import { STEP } from '../../core/constants.js';
import { evaluateDesign } from '../../core/scoring.js';
import { renderStepBar } from '../components/stepBar.js';
import { renderRequestPanel } from '../components/requestPanel.js';
import { renderDesignBoard } from '../components/designBoard.js';
import { renderStepRead } from './steps/stepRead.js';
import { renderStepMaterial } from './steps/stepMaterial.js';
import { renderStepProcess } from './steps/stepProcess.js';
import { renderStepReinforce } from './steps/stepReinforce.js';
import { renderResult } from './result.js';

/** ステップごとの右の列 */
const STEP_PANELS = {
  [STEP.read]: renderStepRead,
  [STEP.material]: renderStepMaterial,
  [STEP.process]: renderStepProcess,
  [STEP.reinforce]: renderStepReinforce,
};

/**
 * @param {import('../../main.js').App} app
 * @returns {HTMLElement}
 */
export function renderWorkshop(app) {
  const request = app.currentRequest();
  const { session } = app.progress;
  const evaluation = evaluateDesign(request, session.design, app.catalog);
  const body =
    session.step === STEP.result
      ? renderResult(app, request, evaluation)
      : h(
          'div',
          { class: 'three-columns' },
          renderRequestPanel(request, evaluation),
          renderDesignBoard(app, request, evaluation),
          STEP_PANELS[session.step](app, request),
        );
  return h('main', { class: 'screen screen--workshop', id: 'main' }, renderStepBar(app, request), body);
}
