// 進行状況の変わり方・保存データの読み直し・ランクの解放を確かめる。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgress,
  startRequest,
  chooseMaterial,
  chooseProcess,
  toggleReinforcement,
  runTest,
  goToStep,
  canEnterStep,
  isRankUnlocked,
  setReason,
  setUnlockAll,
  recordOf,
  finishReveal,
  titleIndex,
  nextTitle,
  totalStars,
} from '../js/core/gameState.js';
import { TITLES } from '../js/data/rewards.js';
import { normalizeProgress } from '../js/core/storage.js';
import { STEP, TEXT_LIMIT } from '../js/core/constants.js';
import { ANSWERS } from './fixtures/answers.mjs';
import { CATALOG, DATA, requestById } from './helpers.mjs';

/** 答えのとおりに選んでテストまでする */
function playAnswer(progress, request, answer) {
  let next = startRequest(progress, request, CATALOG);
  for (const part of request.parts) {
    next = chooseMaterial(next, request, CATALOG, part.id, answer.materials[part.id]);
    next = chooseProcess(next, request, CATALOG, part.id, answer.processes[part.id]);
  }
  for (const id of answer.reinforcements) next = toggleReinforcement(next, request, CATALOG, id);
  return runTest(next, request, CATALOG);
}

test('依頼を始めるとステップ1、材料を全部選ぶまでステップ3には進めない', () => {
  const request = requestById('stationBench');
  let progress = startRequest(createProgress(), request, CATALOG);
  assert.equal(progress.session.step, STEP.read);
  assert.equal(canEnterStep(progress.session, request, STEP.process), false);
  progress = chooseMaterial(progress, request, CATALOG, 'seat', 'sugi');
  assert.equal(goToStep(progress, request, STEP.process).session.step, STEP.read, '脚が未選択なので進めない');
  progress = chooseMaterial(progress, request, CATALOG, 'frame', 'stainless');
  assert.equal(goToStep(progress, request, STEP.process).session.step, STEP.process);
});

test('テストすると記録と図鑑が増え、設計を変えるとテスト済みでなくなる', () => {
  const request = requestById('parkBench');
  let progress = playAnswer(createProgress(), request, ANSWERS.parkBench.model);
  assert.equal(progress.session.step, STEP.result);
  assert.equal(recordOf(progress, request.id).bestStars, 3);
  assert.ok(progress.zukan.materials.includes('sugi'));
  assert.ok(progress.zukan.reinforcements.includes('paint'));
  assert.ok(progress.session.newEntries.length > 0);
  progress = toggleReinforcement(progress, request, CATALOG, 'paint');
  assert.equal(progress.session.tested, false);
  assert.equal(canEnterStep(progress.session, request, STEP.result), false);
});

test('不合格のテストでは「最後に合格した設計」は変わらない', () => {
  const request = requestById('parkBench');
  let progress = playAnswer(createProgress(), request, ANSWERS.parkBench.model);
  progress = playAnswer(progress, request, ANSWERS.parkBench.wrong[0]);
  const record = recordOf(progress, request.id);
  assert.equal(record.bestStars, 3);
  assert.equal(record.latestPassed.design.materials.seat, 'sugi');
});

test('職人ランクは見習いの依頼を2件達成すると開く。先生用の設定で全部開く', () => {
  let progress = createProgress();
  const open = (p) => isRankUnlocked(p, DATA.ranks, 'craftsman', DATA.requests);
  assert.equal(open(progress), false);
  assert.equal(isRankUnlocked(progress, DATA.ranks, 'apprentice', DATA.requests), true);
  progress = playAnswer(progress, requestById('parkBench'), ANSWERS.parkBench.model);
  assert.equal(open(progress), false);
  progress = playAnswer(progress, requestById('handrail'), ANSWERS.handrail.model);
  assert.equal(open(progress), true);
  assert.equal(isRankUnlocked(progress, DATA.ranks, 'master', DATA.requests), false);
  assert.equal(isRankUnlocked(setUnlockAll(progress, true), DATA.ranks, 'master', DATA.requests), true);
});

test('選んだ理由は文字数の上限で切る', () => {
  const progress = setReason(createProgress(), 'parkBench', 'あ'.repeat(TEXT_LIMIT.reason + 20));
  assert.equal(recordOf(progress, 'parkBench').reason.length, TEXT_LIMIT.reason);
});

test('保存データを読み直しても同じ進行状況になる（JSON を通しても壊れない）', () => {
  const request = requestById('kitchenKnife');
  let progress = playAnswer(createProgress(), request, ANSWERS.kitchenKnife.model);
  progress = setReason(progress, request.id, '焼き入れのあと焼き戻しをした');
  const restored = normalizeProgress(JSON.parse(JSON.stringify(progress)), CATALOG);
  assert.deepEqual(restored.records, progress.records);
  assert.deepEqual(restored.zukan, progress.zukan);
  assert.deepEqual(restored.session.design, progress.session.design);
  assert.equal(restored.session.step, STEP.result);
});

test('知らない依頼・材料や、こわれた保存データは捨てて読み込む', () => {
  const broken = {
    version: 1,
    furigana: false,
    records: { nothing: { bestStars: 3 }, parkBench: { bestStars: 9, reason: 123 } },
    zukan: { materials: ['sugi', 'unobtainium'], processes: 'x' },
    session: { requestId: 'parkBench', step: 5, tested: false, design: { materials: { seat: 'unobtainium' } } },
  };
  const progress = normalizeProgress(broken, CATALOG);
  assert.equal(progress.furigana, false);
  assert.deepEqual(Object.keys(progress.records), ['parkBench']);
  assert.equal(progress.records.parkBench.bestStars, 3);
  assert.equal(progress.records.parkBench.reason, '');
  assert.deepEqual(progress.zukan.materials, ['sugi']);
  assert.deepEqual(progress.zukan.processes, []);
  assert.equal(progress.session.design.materials.seat, null);
  assert.equal(progress.session.step, STEP.reinforce, 'テスト済みでないので結果画面には戻らない');
  assert.equal(normalizeProgress({ version: 999 }, CATALOG).records.parkBench, undefined);
  assert.equal(normalizeProgress(null, CATALOG).furigana, true);
});

test('テスト前の予想：当たり・外れを数え、予想しなければ数えない', () => {
  const request = requestById('parkBench');
  let progress = playAnswer(createProgress(), request, ANSWERS.parkBench.model);
  assert.equal(progress.session.predictionHit, null);
  assert.deepEqual(progress.predictions, { hits: 0, total: 0 });

  const play = (start, answer, prediction) => {
    let next = startRequest(start, request, CATALOG);
    next = chooseMaterial(next, request, CATALOG, 'seat', answer.materials.seat);
    next = chooseProcess(next, request, CATALOG, 'seat', answer.processes.seat);
    return runTest(next, request, CATALOG, prediction);
  };
  progress = play(progress, ANSWERS.parkBench.model, 'pass');
  assert.equal(progress.session.predictionHit, true);
  progress = play(progress, ANSWERS.parkBench.wrong[0], 'pass');
  assert.equal(progress.session.predictionHit, false);
  progress = play(progress, ANSWERS.parkBench.wrong[0], 'fail');
  assert.deepEqual(progress.predictions, { hits: 2, total: 3 });
  // 保存して読み直しても残る
  assert.deepEqual(normalizeProgress(JSON.parse(JSON.stringify(progress)), CATALOG).predictions, { hits: 2, total: 3 });
});

test('称号：星の合計で上がり、上がったテストでだけ newTitle が入る', () => {
  assert.equal(titleIndex(0), 0);
  assert.equal(titleIndex(TITLES[1].stars), 1);
  assert.equal(titleIndex(TITLES.at(-1).stars), TITLES.length - 1);
  assert.deepEqual(nextTitle(TITLES[1].stars - 2), { index: 1, need: 2 });
  assert.equal(nextTitle(TITLES.at(-1).stars), null);
  // 全依頼を模範解で★3にすると最後の称号になる
  let progress = createProgress();
  for (const request of DATA.requests) progress = playAnswer(progress, request, ANSWERS[request.id].model);
  assert.equal(titleIndex(totalStars(progress)), TITLES.length - 1);
  assert.equal(TITLES.at(-1).stars, DATA.requests.length * 3, 'いちばん上の称号は全依頼★3');
});

test('結果の演出はテスト直後だけ（finishReveal で終わる）', () => {
  const request = requestById('parkBench');
  let progress = playAnswer(createProgress(), request, ANSWERS.parkBench.model);
  assert.equal(progress.session.reveal, true);
  progress = finishReveal(progress);
  assert.equal(progress.session.reveal, false);
  assert.equal(normalizeProgress(JSON.parse(JSON.stringify(playAnswer(createProgress(), request, ANSWERS.parkBench.model))), CATALOG).session.reveal, false);
});
