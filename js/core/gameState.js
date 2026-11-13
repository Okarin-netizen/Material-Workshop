// ゲームの進行状況と、その変え方。DOM には触らない。
// どの関数も、元の progress を書きかえずに新しい progress を返す（どこで変わったか追いやすくするため）。

import { STEP, CLEARS_TO_UNLOCK_NEXT_RANK, SAVE_VERSION, TEXT_LIMIT } from './constants.js';
import { createEmptyDesign, pruneDesign, allMaterialsChosen, allProcessesChosen } from './rules.js';
import { evaluateDesign } from './scoring.js';
import { TITLES } from '../data/rewards.js';

/**
 * @typedef {Object} DesignRecord テストした設計の記録
 * @property {import('./rules.js').Design} design
 * @property {number} score
 * @property {number} stars
 */

/**
 * @typedef {Object} RequestRecord 依頼ごとの記録
 * @property {number} bestStars           いちばんよかった星
 * @property {number} bestScore           いちばんよかった得点
 * @property {DesignRecord|null} latestPassed 最後に合格した設計（まとめ画面に載せる）
 * @property {string} reason              生徒が書いた「選んだ理由」
 */

/**
 * @typedef {Object} Session 今取り組んでいる依頼
 * @property {string} requestId
 * @property {number} step        1〜5
 * @property {string} partId      材料・加工を選んでいる部品
 * @property {import('./rules.js').Design} design
 * @property {boolean} tested     今の設計でテスト済みか（設計を変えると false）
 * @property {{type: string, id: string}[]} newEntries 直前のテストで図鑑に増えたもの
 * @property {'pass'|'fail'|null} [prediction] テストの前にした予想（全部合格すると思うか）
 * @property {boolean|null} [predictionHit]   予想が当たったか（予想していなければ null）
 * @property {boolean} [reveal]   テストした直後か（結果の演出を1回だけ見せるため。保存はしない）
 * @property {number|null} [newTitle] このテストで上がった称号の番号（上がっていなければ null）
 */

/**
 * @typedef {Object} Progress 保存する進行状況（氏名は持たない）
 * @property {number} version
 * @property {boolean} furigana
 * @property {boolean} unlockAll   先生用：すべての依頼を開く
 * @property {boolean} sound       効果音を鳴らすか（はじめは鳴らさない）
 * @property {{hits: number, total: number}} predictions テスト前の予想の当たった数と、予想した数
 * @property {Record<string, RequestRecord>} records
 * @property {{materials: string[], processes: string[], reinforcements: string[]}} zukan
 * @property {string} reflection   まとめ画面のふり返り
 * @property {Session|null} session
 */

/** @returns {Progress} */
export function createProgress() {
  return {
    version: SAVE_VERSION,
    furigana: true,
    unlockAll: false,
    sound: false,
    predictions: { hits: 0, total: 0 },
    records: {},
    zukan: { materials: [], processes: [], reinforcements: [] },
    reflection: '',
    session: null,
  };
}

/** @returns {RequestRecord} */
function createRecord() {
  return { bestStars: 0, bestScore: 0, latestPassed: null, reason: '' };
}

/** 依頼の記録（なければ空の記録） */
export function recordOf(progress, requestId) {
  return progress.records[requestId] ?? createRecord();
}

// ── 依頼の開始と移動 ─────────────────────────

/**
 * 依頼を始める。同じ依頼の途中ならその続きから、前に合格していればその設計から始める。
 * @param {Progress} progress
 * @param {import('../data/requests.js').GameRequest} request
 * @param {import('./rules.js').Catalog} catalog
 * @returns {Progress}
 */
export function startRequest(progress, request, catalog) {
  if (progress.session?.requestId === request.id) {
    return withSession(progress, { step: STEP.read });
  }
  const previous = progress.records[request.id]?.latestPassed?.design;
  const session = {
    requestId: request.id,
    step: STEP.read,
    partId: request.parts[0].id,
    design: previous ? sanitizeDesign(request, previous, catalog) : createEmptyDesign(request),
    tested: false,
    newEntries: [],
    prediction: null,
    predictionHit: null,
    reveal: false,
    newTitle: null,
  };
  return { ...progress, session };
}

/**
 * そのステップに進めるか。
 * @param {Session} session
 * @param {import('../data/requests.js').GameRequest} request
 * @param {number} step
 */
export function canEnterStep(session, request, step) {
  switch (step) {
    case STEP.read:
    case STEP.material:
      return true;
    case STEP.process:
      return allMaterialsChosen(request, session.design);
    case STEP.reinforce:
      return allMaterialsChosen(request, session.design) && allProcessesChosen(request, session.design);
    case STEP.result:
      return session.tested;
    default:
      return false;
  }
}

/** ステップを移る（進めないステップなら何もしない） */
export function goToStep(progress, request, step) {
  if (!progress.session || !canEnterStep(progress.session, request, step)) return progress;
  return withSession(progress, { step });
}

/** 材料・加工を選ぶ部品を切りかえる */
export function selectPart(progress, partId) {
  return withSession(progress, { partId });
}

// ── 設計の変更 ───────────────────────────────

/**
 * 保存されていた設計を、今の依頼データに合う形に直す。
 * （データを書きかえたあとでも、古い保存データでこわれないようにするため）
 * @returns {import('./rules.js').Design}
 */
export function sanitizeDesign(request, design, catalog) {
  const clean = createEmptyDesign(request);
  for (const part of request.parts) {
    const materialId = design?.materials?.[part.id];
    const processId = design?.processes?.[part.id];
    if (part.materialIds.includes(materialId)) clean.materials[part.id] = materialId;
    if (part.processIds.includes(processId)) clean.processes[part.id] = processId;
  }
  const allowed = new Set(request.reinforcements.map((entry) => entry.id));
  clean.reinforcements = (design?.reinforcements ?? []).filter((id) => allowed.has(id));
  return pruneDesign(request, clean, catalog);
}

/** 部品の材料を選ぶ（使えなくなった加工や工夫は外す） */
export function chooseMaterial(progress, request, catalog, partId, materialId) {
  const design = progress.session.design;
  return updateDesign(progress, request, catalog, { ...design, materials: { ...design.materials, [partId]: materialId } });
}

/** 部品の加工方法を選ぶ */
export function chooseProcess(progress, request, catalog, partId, processId) {
  const design = progress.session.design;
  return updateDesign(progress, request, catalog, { ...design, processes: { ...design.processes, [partId]: processId } });
}

/** 工夫を選ぶ／外す */
export function toggleReinforcement(progress, request, catalog, reinforcementId) {
  const current = progress.session.design.reinforcements;
  const reinforcements = current.includes(reinforcementId)
    ? current.filter((id) => id !== reinforcementId)
    : [...current, reinforcementId];
  return updateDesign(progress, request, catalog, { ...progress.session.design, reinforcements });
}

function updateDesign(progress, request, catalog, design) {
  return withSession(progress, { design: pruneDesign(request, design, catalog), tested: false, newEntries: [], predictionHit: null, newTitle: null });
}

// ── テスト ──────────────────────────────────

/**
 * テストをして結果を記録し、ステップ5へ進む。
 * @param {Progress} progress
 * @param {import('../data/requests.js').GameRequest} request
 * @param {import('./rules.js').Catalog} catalog
 * @param {'pass'|'fail'|null} [prediction] テストの前の予想（全部合格すると思う＝'pass'）
 * @returns {Progress}
 */
export function runTest(progress, request, catalog, prediction = null) {
  const { design } = progress.session;
  const evaluation = evaluateDesign(request, design, catalog);
  if (!evaluation.complete) return progress;

  const { zukan, newEntries } = unlockZukan(progress.zukan, request, design);
  const records = { ...progress.records, [request.id]: updatedRecord(recordOf(progress, request.id), design, evaluation) };
  const predictionHit = prediction ? (prediction === 'pass') === evaluation.allPassed : null;
  const predictions = prediction
    ? { hits: progress.predictions.hits + (predictionHit ? 1 : 0), total: progress.predictions.total + 1 }
    : progress.predictions;
  const next = { ...progress, zukan, records, predictions };
  const titleBefore = titleIndex(totalStars(progress));
  const titleAfter = titleIndex(totalStars(next));
  return withSession(next, {
    tested: true,
    step: STEP.result,
    newEntries,
    prediction,
    predictionHit,
    reveal: true,
    newTitle: titleAfter > titleBefore ? titleAfter : null,
  });
}

/** 結果の演出を見せ終わった（もう一度描き直しても演出しない） */
export function finishReveal(progress) {
  if (!progress.session?.reveal) return progress;
  return withSession(progress, { reveal: false });
}

function updatedRecord(record, design, evaluation) {
  const updated = {
    ...record,
    bestStars: Math.max(record.bestStars, evaluation.stars),
    bestScore: evaluation.allPassed ? Math.max(record.bestScore, evaluation.score) : record.bestScore,
  };
  if (evaluation.allPassed) {
    updated.latestPassed = { design: structuredClone(design), score: evaluation.score, stars: evaluation.stars };
  }
  return updated;
}

/** 設計で使った材料・加工方法・工夫を図鑑に加え、新しく加わったものも返す */
function unlockZukan(zukan, request, design) {
  const used = {
    materials: Object.values(design.materials),
    processes: Object.values(design.processes),
    reinforcements: design.reinforcements,
  };
  const next = {};
  const newEntries = [];
  for (const type of Object.keys(used)) {
    const known = new Set(zukan[type]);
    for (const id of used[type]) {
      if (id && !known.has(id)) {
        known.add(id);
        newEntries.push({ type, id });
      }
    }
    next[type] = [...known];
  }
  return { zukan: next, newEntries };
}

// ── 記入と設定 ───────────────────────────────

/** 「選んだ理由」を書く */
export function setReason(progress, requestId, text) {
  const record = { ...recordOf(progress, requestId), reason: String(text).slice(0, TEXT_LIMIT.reason) };
  return { ...progress, records: { ...progress.records, [requestId]: record } };
}

/** ふり返りを書く */
export function setReflection(progress, text) {
  return { ...progress, reflection: String(text).slice(0, TEXT_LIMIT.reflection) };
}

export function setFurigana(progress, enabled) {
  return { ...progress, furigana: Boolean(enabled) };
}

export function setSound(progress, enabled) {
  return { ...progress, sound: Boolean(enabled) };
}

export function setUnlockAll(progress, enabled) {
  return { ...progress, unlockAll: Boolean(enabled) };
}

// ── ランクと解放 ─────────────────────────────

/** 依頼が達成済み（★1以上）か */
export function isCleared(progress, requestId) {
  return recordOf(progress, requestId).bestStars > 0;
}

/**
 * ランクが開いているか。最初のランクはいつも開いている。
 * それ以外は、1つ前のランクの依頼を CLEARS_TO_UNLOCK_NEXT_RANK 件達成すると開く。
 * @param {Progress} progress
 * @param {{id: string}[]} ranks
 * @param {string} rankId
 * @param {import('../data/requests.js').GameRequest[]} requests
 */
export function isRankUnlocked(progress, ranks, rankId, requests) {
  const index = ranks.findIndex((rank) => rank.id === rankId);
  if (index <= 0 || progress.unlockAll) return true;
  const previousRank = ranks[index - 1].id;
  const clears = requests.filter((request) => request.rank === previousRank && isCleared(progress, request.id)).length;
  return clears >= Math.min(CLEARS_TO_UNLOCK_NEXT_RANK, requests.filter((r) => r.rank === previousRank).length);
}

/** 星の合計 */
export function totalStars(progress) {
  return Object.values(progress.records).reduce((sum, record) => sum + record.bestStars, 0);
}

// ── 称号と図鑑 ───────────────────────────────

/**
 * 星の合計から、工房の称号の番号（TITLES の何番目か）を返す。
 * @param {number} stars
 * @returns {number}
 */
export function titleIndex(stars) {
  let index = 0;
  TITLES.forEach((title, i) => {
    if (stars >= title.stars) index = i;
  });
  return index;
}

/**
 * 次の称号と、そこまでに必要な星の数。いちばん上の称号ならnull。
 * @param {number} stars
 * @returns {{index: number, need: number}|null}
 */
export function nextTitle(stars) {
  const index = titleIndex(stars) + 1;
  return index < TITLES.length ? { index, need: TITLES[index].stars - stars } : null;
}

/** 図鑑がすべてそろったか */
export function isZukanComplete(progress, catalog) {
  return (
    progress.zukan.materials.length >= catalog.materials.size &&
    progress.zukan.processes.length >= catalog.processes.size &&
    progress.zukan.reinforcements.length >= catalog.reinforcements.size
  );
}

/** session の一部を変えた progress を返す */
function withSession(progress, changes) {
  return { ...progress, session: { ...progress.session, ...changes } };
}
