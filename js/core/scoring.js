// 設計を評価する：費用・特性・5つの指標・テスト・得点・星。DOM には触らない。
//
// 計算の流れ（上から順に）
//   1. 部品の特性 = 材料の特性 + 依頼での上書き + 加工方法の効果 + 工夫の効果（0〜5に収める）
//   2. 製品の特性（構造の強さ）= 依頼の baseStructure + 工夫の効果
//   3. 指標 = 依頼の計算式（特性の重みつき平均）を 0〜100 にし、加工・工夫の指標効果を足す
//      コストだけは「費用 ÷ 予算」から計算する
//   4. テスト（必須条件）を判定する
//   5. 得点 = 指標の重みつき平均。星は テスト全合格 → ★1、70点以上 → ★2、85点以上 → ★3

import { TRAIT_MAX, METRIC_MAX, STAR_SCORE, COST_SCORE } from './constants.js';
import { findRequestReinforcement, materialKind } from './rules.js';
import { METRICS, TRAITS } from '../data/traits.js';

const ZERO_TRAITS = Object.freeze(Object.fromEntries(Object.keys(TRAITS).map((key) => [key, 0])));

/**
 * @typedef {Object} TestResult
 * @property {string} id
 * @property {boolean|null} passed  null は「まだ判定できない」（部品が未選択）
 * @property {string|null} reason   合格・不合格の説明
 */

/**
 * @typedef {Object} Evaluation
 * @property {number} cost
 * @property {boolean} complete       すべての部品の材料と加工が決まっているか
 * @property {Record<string, Record<string, number>>} partTraits
 * @property {Record<string, number>} productTraits
 * @property {Record<string, number|null>} metrics 0〜100（計算できないものは null）
 * @property {TestResult[]} tests
 * @property {boolean} allPassed
 * @property {number} score
 * @property {0|1|2|3} stars
 */

/**
 * 設計を評価する。設計の途中（部品が未選択）でも、わかる範囲で計算する。
 * @param {import('../data/requests.js').GameRequest} request
 * @param {import('./rules.js').Design} design
 * @param {import('./rules.js').Catalog} catalog
 * @returns {Evaluation}
 */
export function evaluateDesign(request, design, catalog) {
  const partTraits = computePartTraits(request, design, catalog);
  const productTraits = computeProductTraits(request, design, catalog);
  const cost = computeCost(request, design, catalog);
  const metrics = computeMetrics(request, design, { partTraits, productTraits, cost });
  const complete = request.parts.every((part) => design.materials[part.id] && design.processes[part.id]);
  const context = { request, design, catalog, partTraits, productTraits, metrics, cost };
  const tests = request.tests.map((test) => runTest(test, context));
  const allPassed = complete && tests.every((test) => test.passed === true);
  const score = totalScore(metrics, request.scoreWeights);
  return { cost, complete, partTraits, productTraits, metrics, tests, allPassed, score, stars: starsFor(allPassed, score) };
}

// ── 1. 部品の特性 ──────────────────────────────

function computePartTraits(request, design, catalog) {
  const result = {};
  for (const part of request.parts) {
    const material = catalog.materials.get(design.materials[part.id]);
    if (!material) continue;
    // 材料データに書いていない特性は 0 とする（例：缶の「開け閉め」）
    const traits = { ...ZERO_TRAITS, ...material.traits, ...(part.traitOverrides?.[material.id] ?? {}) };
    addEffects(traits, catalog.processes.get(design.processes[part.id])?.traitEffects);
    for (const id of design.reinforcements) {
      const entry = findRequestReinforcement(request, id);
      if (!entry?.parts?.includes(part.id)) continue;
      addEffects(traits, entry.traitEffects ?? catalog.reinforcements.get(id)?.partEffects);
    }
    result[part.id] = clampAll(traits);
  }
  return result;
}

function addEffects(traits, effects) {
  for (const [key, delta] of Object.entries(effects ?? {})) {
    traits[key] = (traits[key] ?? 0) + delta;
  }
}

function clampAll(traits) {
  return Object.fromEntries(Object.entries(traits).map(([key, value]) => [key, clamp(value, 0, TRAIT_MAX)]));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ── 2. 製品の特性 ──────────────────────────────

function computeProductTraits(request, design, catalog) {
  let structure = request.baseStructure;
  for (const id of design.reinforcements) {
    structure += catalog.reinforcements.get(id)?.productEffects?.structure ?? 0;
  }
  return { structure: clamp(structure, 0, TRAIT_MAX) };
}

// ── 費用 ──────────────────────────────────────

/**
 * 費用（材料費 + 加工費 + 工夫の費用）。
 * @returns {number}
 */
export function computeCost(request, design, catalog) {
  let cost = 0;
  for (const part of request.parts) {
    cost += (catalog.materials.get(design.materials[part.id])?.price ?? 0) * part.size;
    cost += (catalog.processes.get(design.processes[part.id])?.costPerUnit ?? 0) * part.size;
  }
  for (const id of design.reinforcements) {
    cost += reinforcementCost(request, id, catalog);
  }
  return cost;
}

/** 工夫の費用（依頼データで上書きされていればそれを使う） */
export function reinforcementCost(request, reinforcementId, catalog) {
  const entry = findRequestReinforcement(request, reinforcementId);
  return entry?.cost ?? catalog.reinforcements.get(reinforcementId)?.cost ?? 0;
}

// ── 3. 指標 ──────────────────────────────────

function computeMetrics(request, design, { partTraits, productTraits, cost }) {
  // 材料を1つも選んでいないうちは、どの指標も「まだわからない」にする
  const started = Object.keys(partTraits).length > 0;
  const metrics = {};
  for (const { id } of METRICS) {
    if (!started) metrics[id] = null;
    else if (id === 'cost') metrics[id] = costMetric(cost, request.budget);
    else metrics[id] = formulaMetric(request.metrics[id] ?? [], partTraits, productTraits);
  }
  applyMetricEffects(metrics, collectMetricEffects(request, design));
  return metrics;
}

/**
 * 特性の重みつき平均を 0〜100 にする。まだ選ばれていない部品の項は飛ばす。
 * @returns {number|null}
 */
function formulaMetric(terms, partTraits, productTraits) {
  let sum = 0;
  let weightSum = 0;
  for (const term of terms) {
    const value = term.product ? productTraits[term.product] : partTraits[term.part]?.[term.trait];
    if (value === undefined) continue;
    const weight = term.weight ?? 1;
    sum += (value / TRAIT_MAX) * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? null : Math.round((sum / weightSum) * METRIC_MAX);
}

/**
 * コストの指標。予算の fullScoreRatio 倍までは満点、予算ちょうどで scoreAtBudget 点、超えたら 0 点。
 * @param {number} cost
 * @param {number} budget
 * @returns {number}
 */
export function costMetric(cost, budget) {
  if (cost > budget) return 0;
  const ratio = cost / budget;
  if (ratio <= COST_SCORE.fullScoreRatio) return METRIC_MAX;
  const progress = (ratio - COST_SCORE.fullScoreRatio) / (1 - COST_SCORE.fullScoreRatio);
  return Math.round(METRIC_MAX - progress * (METRIC_MAX - COST_SCORE.scoreAtBudget));
}

/** 加工方法と工夫の「指標への直接の効果」を集める */
function collectMetricEffects(request, design) {
  const effects = [];
  for (const part of request.parts) {
    const processId = design.processes[part.id];
    if (processId && part.processMetricEffects?.[processId]) effects.push(part.processMetricEffects[processId]);
  }
  for (const id of design.reinforcements) {
    const entry = findRequestReinforcement(request, id);
    if (entry?.metricEffects) effects.push(entry.metricEffects);
  }
  return effects;
}

function applyMetricEffects(metrics, effectsList) {
  for (const effects of effectsList) {
    for (const [id, delta] of Object.entries(effects)) {
      if (metrics[id] !== null && metrics[id] !== undefined) metrics[id] = clamp(metrics[id] + delta, 0, METRIC_MAX);
    }
  }
}

// ── 4. テスト ─────────────────────────────────

/**
 * 1つのテストを判定する。
 * @returns {TestResult}
 */
function runTest(test, context) {
  const value = checkedValue(test.check, context);
  if (value === null || value === undefined) return { id: test.id, passed: null, reason: null };
  const passed = test.check.budget ? value : value >= test.check.min;
  return { id: test.id, passed, reason: passed ? test.pass : failReason(test, context) };
}

/** テストで調べる値（予算テストは true/false） */
function checkedValue(check, { partTraits, productTraits, metrics, cost, request, design }) {
  if (check.budget) return request.parts.some((part) => design.materials[part.id]) ? cost <= request.budget : null;
  if (check.metric) return metrics[check.metric];
  if (check.product) return productTraits[check.product];
  return partTraits[check.part]?.[check.trait] ?? null;
}

/** failReasons を上から調べ、最初に当てはまった理由を返す */
function failReason(test, context) {
  const match = (test.failReasons ?? []).find(({ when }) => conditionMatches(when, test.check.part, context));
  return match ? match.text : test.fail;
}

/**
 * 不合格理由の条件に当てはまるか。
 * @param {import('../data/requests.js').FailCondition} when
 * @param {string|undefined} defaultPart
 */
export function conditionMatches(when, defaultPart, { design, catalog, request }) {
  const partId = when.part ?? defaultPart ?? request.parts[0].id;
  const material = catalog.materials.get(design.materials[partId]);
  if (when.materials && !(material && when.materials.includes(material.id))) return false;
  if (when.kinds && !(material && when.kinds.includes(materialKind(material)))) return false;
  if (when.has && !when.has.every((id) => design.reinforcements.includes(id))) return false;
  if (when.lacks && when.lacks.some((id) => design.reinforcements.includes(id))) return false;
  return true;
}

// ── 5. 得点と星 ───────────────────────────────

/**
 * 指標の重みつき平均（0〜100の整数）。計算できない指標は 0 点として数える。
 * @returns {number}
 */
export function totalScore(metrics, weights) {
  let sum = 0;
  let weightSum = 0;
  for (const [id, weight] of Object.entries(weights)) {
    sum += (metrics[id] ?? 0) * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? 0 : Math.round(sum / weightSum);
}

/**
 * 星の数。テストに1つでも不合格があれば 0。
 * @param {boolean} allPassed
 * @param {number} score
 * @returns {0|1|2|3}
 */
export function starsFor(allPassed, score) {
  if (!allPassed) return 0;
  if (score >= STAR_SCORE.three) return 3;
  if (score >= STAR_SCORE.two) return 2;
  return 1;
}

/**
 * 結果画面の「もし別の材料だったら」を1つ選ぶ。
 * 材料の文は「その材料を選んでいなかったとき」、工夫の文は「その工夫を選んでいたとき」に出す。
 * @param {import('../data/requests.js').GameRequest} request
 * @param {import('./rules.js').Design} design
 * @returns {import('../data/requests.js').WhatIf|null}
 */
export function pickWhatIf(request, design) {
  return (
    request.whatIf.find((item) =>
      item.without ? design.reinforcements.includes(item.without) : design.materials[item.part] !== item.material,
    ) ?? null
  );
}
