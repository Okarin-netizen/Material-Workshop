// 起動時にデータを点検する。存在しない材料IDを書いた、ふりがなの { } が閉じていない、などを見つける。
// 見つかった問題は日本語の文の配列で返す（main.js が console と画面に出す）。DOM には触らない。

import { TRAITS, PRODUCT_TRAITS, METRICS, CATEGORIES, MATERIAL_KINDS } from '../data/traits.js';
import { processAvailability } from './rules.js';
import { TRAIT_MAX } from './constants.js';

const METRIC_IDS = new Set(METRICS.map((metric) => metric.id));
const FORMULA_METRICS = ['strength', 'durability', 'usability', 'environment'];
const SCORE_WEIGHT_TOTAL = 100;
const MAX_PARTS = 2;

/**
 * データ全体を点検する。
 * @param {{materials: any[], processes: any[], reinforcements: any[], requests: any[], ranks: any[]}} data
 * @param {import('./rules.js').Catalog} catalog
 * @param {{artNames?: string[]}} [options] artNames：使える製品の絵の名前
 * @returns {string[]} 問題の一覧（問題がなければ空）
 */
export function validateData(data, catalog, options = {}) {
  const problems = [];
  const report = (where, message) => problems.push(`${where}：${message}`);

  checkUniqueIds('材料', data.materials, report);
  checkUniqueIds('加工方法', data.processes, report);
  checkUniqueIds('工夫', data.reinforcements, report);
  checkUniqueIds('依頼', data.requests, report);

  data.materials.forEach((material) => checkMaterial(material, report));
  data.processes.forEach((process) => checkProcess(process, report));
  data.reinforcements.forEach((reinforcement) => checkReinforcement(reinforcement, catalog, report));
  data.requests.forEach((request) => checkRequest(request, catalog, data.ranks, options.artNames, report));

  checkMarkupEverywhere(data, report);
  return problems;
}

function checkUniqueIds(label, list, report) {
  const seen = new Set();
  for (const item of list) {
    if (!item.id) report(label, 'id のないデータがあります');
    else if (seen.has(item.id)) report(`${label}「${item.id}」`, 'id が重なっています');
    seen.add(item.id);
  }
}

// ── 材料・加工・工夫 ─────────────────────────

function checkMaterial(material, report) {
  const where = `材料「${material.id}」`;
  if (!CATEGORIES[material.category]) report(where, `分類「${material.category}」は traits.js の CATEGORIES にありません`);
  if (material.category === 'plastic' && !MATERIAL_KINDS[material.plasticType]) {
    report(where, 'プラスチックには plasticType（thermoplastic か thermoset）が必要です');
  }
  if (!(material.price > 0)) report(where, 'price（価格）は 0 より大きい数にしてください');
  checkTraitValues(where, material.traits, report, { requireAll: true });
}

function checkTraitValues(where, traits, report, { requireAll = false, allowNegative = false } = {}) {
  for (const [key, value] of Object.entries(traits ?? {})) {
    if (!TRAITS[key]) report(where, `特性「${key}」は traits.js の TRAITS にありません`);
    const min = allowNegative ? -TRAIT_MAX : 0;
    if (typeof value !== 'number' || value < min || value > TRAIT_MAX) report(where, `特性「${key}」の値 ${value} が範囲外です`);
  }
  if (requireAll) {
    const missing = Object.keys(TRAITS).filter((key) => key !== 'reclose' && !(key in (traits ?? {})));
    if (missing.length) report(where, `特性 ${missing.join('・')} が書かれていません`);
  }
}

function checkProcess(process, report) {
  const where = `加工方法「${process.id}」`;
  for (const kind of process.suitableKinds ?? []) {
    if (!MATERIAL_KINDS[kind]) report(where, `材料の種類「${kind}」はありません`);
  }
  for (const kind of Object.keys(process.unsuitableReasons ?? {})) {
    if (!MATERIAL_KINDS[kind]) report(where, `理由の種類「${kind}」はありません`);
  }
  checkTraitValues(where, process.traitEffects, report, { allowNegative: true });
}

function checkReinforcement(reinforcement, catalog, report) {
  const where = `工夫「${reinforcement.id}」`;
  for (const id of [...(reinforcement.requires ?? []), ...(reinforcement.excludes ?? [])]) {
    if (!catalog.reinforcements.has(id)) report(where, `requires / excludes の「${id}」という工夫はありません`);
  }
  for (const id of reinforcement.onlyForMaterials ?? []) {
    if (!catalog.materials.has(id)) report(where, `onlyForMaterials の「${id}」という材料はありません`);
  }
  checkTraitValues(where, reinforcement.partEffects, report, { allowNegative: true });
  for (const key of Object.keys(reinforcement.productEffects ?? {})) {
    if (!PRODUCT_TRAITS[key]) report(where, `製品の特性「${key}」はありません`);
  }
}

// ── 依頼 ────────────────────────────────────

function checkRequest(request, catalog, ranks, artNames, report) {
  const where = `依頼「${request.id}」`;
  if (!ranks.some((rank) => rank.id === request.rank)) report(where, `ランク「${request.rank}」はありません`);
  if (artNames && !artNames.includes(request.art)) report(where, `製品の絵「${request.art}」はありません`);
  if (!request.parts?.length || request.parts.length > MAX_PARTS) report(where, `部品は 1〜${MAX_PARTS} 個にしてください`);
  if (!(request.budget > 0)) report(where, 'budget（予算）は 0 より大きい数にしてください');

  const partIds = new Set((request.parts ?? []).map((part) => part.id));
  (request.parts ?? []).forEach((part) => checkPart(request, part, catalog, report));
  checkRequestReinforcements(request, partIds, catalog, report);
  (request.tests ?? []).forEach((test) => checkTest(request, test, partIds, catalog, report));
  checkMetricFormulas(request, partIds, report);
  checkScoreWeights(request, report);
  checkWhatIf(request, partIds, catalog, report);
}

function checkPart(request, part, catalog, report) {
  const where = `依頼「${request.id}」の部品「${part.id}」`;
  for (const id of part.materialIds) {
    if (!catalog.materials.has(id)) report(where, `材料「${id}」はありません`);
  }
  for (const id of part.processIds) {
    if (!catalog.processes.has(id)) report(where, `加工方法「${id}」はありません`);
  }
  // 選べる材料それぞれに、使える加工方法が1つはないと先へ進めなくなる
  for (const id of part.materialIds) {
    const material = catalog.materials.get(id);
    const processes = part.processIds.map((processId) => catalog.processes.get(processId)).filter(Boolean);
    if (material && !processes.some((process) => processAvailability(process, material).ok)) {
      report(where, `材料「${id}」に使える加工方法がありません`);
    }
  }
  for (const id of [...Object.keys(part.materialNotes ?? {}), ...Object.keys(part.traitOverrides ?? {})]) {
    if (!part.materialIds.includes(id)) report(where, `materialNotes / traitOverrides の「${id}」は選べる材料にありません`);
  }
  for (const [processId, effects] of Object.entries(part.processMetricEffects ?? {})) {
    if (!part.processIds.includes(processId)) report(where, `processMetricEffects の「${processId}」は選べる加工方法にありません`);
    checkMetricKeys(where, effects, report);
  }
}

function checkRequestReinforcements(request, partIds, catalog, report) {
  for (const entry of request.reinforcements ?? []) {
    const where = `依頼「${request.id}」の工夫「${entry.id}」`;
    const reinforcement = catalog.reinforcements.get(entry.id);
    if (!reinforcement) {
      report(where, 'この工夫は reinforcements.js にありません');
      continue;
    }
    for (const partId of entry.parts ?? []) {
      if (!partIds.has(partId)) report(where, `部品「${partId}」はありません`);
    }
    const hasPartEffects = entry.traitEffects || reinforcement.partEffects;
    if (hasPartEffects && !entry.parts?.length) report(where, '部品に効く工夫なので parts を書いてください');
    checkTraitValues(where, entry.traitEffects, report, { allowNegative: true });
    checkMetricKeys(where, entry.metricEffects, report);
  }
}

function checkTest(request, test, partIds, catalog, report) {
  const where = `依頼「${request.id}」のテスト「${test.id}」`;
  const check = test.check ?? {};
  if (check.part !== undefined) {
    if (!partIds.has(check.part)) report(where, `部品「${check.part}」はありません`);
    if (!TRAITS[check.trait]) report(where, `特性「${check.trait}」はありません`);
  } else if (check.product !== undefined) {
    if (!PRODUCT_TRAITS[check.product]) report(where, `製品の特性「${check.product}」はありません`);
  } else if (check.metric !== undefined) {
    if (!METRIC_IDS.has(check.metric)) report(where, `指標「${check.metric}」はありません`);
  } else if (!check.budget) {
    report(where, 'check の書き方がわかりません（part / product / metric / budget のどれかを書く）');
  }
  if (!check.budget && typeof check.min !== 'number') report(where, 'check.min（合格の下限）を数で書いてください');
  for (const { when } of test.failReasons ?? []) checkFailCondition(where, when, partIds, catalog, report);
}

function checkFailCondition(where, when = {}, partIds, catalog, report) {
  if (when.part && !partIds.has(when.part)) report(where, `failReasons の部品「${when.part}」はありません`);
  for (const id of when.materials ?? []) {
    if (!catalog.materials.has(id)) report(where, `failReasons の材料「${id}」はありません`);
  }
  for (const kind of when.kinds ?? []) {
    if (!MATERIAL_KINDS[kind]) report(where, `failReasons の種類「${kind}」はありません`);
  }
  for (const id of [...(when.has ?? []), ...(when.lacks ?? [])]) {
    if (!catalog.reinforcements.has(id)) report(where, `failReasons の工夫「${id}」はありません`);
  }
}

function checkMetricFormulas(request, partIds, report) {
  for (const metricId of FORMULA_METRICS) {
    const terms = request.metrics?.[metricId];
    const where = `依頼「${request.id}」の指標「${metricId}」`;
    if (!terms?.length) {
      report(where, '計算式がありません');
      continue;
    }
    for (const term of terms) {
      if (term.product) {
        if (!PRODUCT_TRAITS[term.product]) report(where, `製品の特性「${term.product}」はありません`);
      } else {
        if (!partIds.has(term.part)) report(where, `部品「${term.part}」はありません`);
        if (!TRAITS[term.trait]) report(where, `特性「${term.trait}」はありません`);
      }
    }
  }
}

function checkScoreWeights(request, report) {
  const weights = request.scoreWeights ?? {};
  checkMetricKeys(`依頼「${request.id}」の scoreWeights`, weights, report);
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total !== SCORE_WEIGHT_TOTAL) report(`依頼「${request.id}」`, `scoreWeights の合計が ${total} です（${SCORE_WEIGHT_TOTAL} にしてください）`);
}

function checkMetricKeys(where, effects, report) {
  for (const key of Object.keys(effects ?? {})) {
    if (!METRIC_IDS.has(key)) report(where, `指標「${key}」はありません`);
  }
}

function checkWhatIf(request, partIds, catalog, report) {
  for (const item of request.whatIf ?? []) {
    const where = `依頼「${request.id}」の whatIf`;
    if (item.without) {
      if (!request.reinforcements.some((entry) => entry.id === item.without)) report(where, `工夫「${item.without}」はこの依頼にありません`);
    } else {
      if (!partIds.has(item.part)) report(where, `部品「${item.part}」はありません`);
      if (!catalog.materials.has(item.material)) report(where, `材料「${item.material}」はありません`);
    }
  }
}

// ── ふりがな・強調の記法 ─────────────────────

const VALID_RUBY = /\{[^{}|]+\|[^{}|]+\}/g;
const PLACEHOLDER = /\{\w+\}/g;

/**
 * 文字列の記法がこわれていないか（{ } | が余っている、* が奇数個）。
 * @param {string} text
 * @returns {string|null} 問題の説明（問題なければ null）
 */
export function findMarkupProblem(text) {
  // {budget} のような「数を入れる場所」（英数字だけ）は記法の問題ではないので先に外す
  const leftover = text.replace(VALID_RUBY, '').replace(PLACEHOLDER, '');
  if (/[{}|]/.test(leftover)) return 'ふりがなの記法 {漢字|かんじ} がこわれています';
  if ((text.match(/\*/g) ?? []).length % 2 === 1) return '強調の * が閉じていません';
  return null;
}

function checkMarkupEverywhere(data, report) {
  const visit = (value, path) => {
    if (typeof value === 'string') {
      const problem = findMarkupProblem(value);
      if (problem) report(path, `${problem}（${value.slice(0, 30)}…）`);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${item?.id ?? index}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
    }
  };
  for (const [name, list] of Object.entries(data)) visit(list, name);
}
