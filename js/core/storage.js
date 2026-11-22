// 進行状況を localStorage に保存・読み込みする。
// 氏名などの個人情報は保存しない（Progress に入れていない）。
// localStorage が使えない環境（プライベートウィンドウなど）でも、ゲームは止まらずに遊べるようにする。

import { STORAGE_KEY, SAVE_VERSION, STEP } from './constants.js';
import { createProgress, sanitizeDesign, setReason, setReflection, canEnterStep } from './gameState.js';
import { allMaterialsChosen, allProcessesChosen } from './rules.js';

/**
 * 保存されている進行状況を読む。なければ（または読めなければ）新しい進行状況を返す。
 * @param {import('./rules.js').Catalog} catalog
 * @returns {import('./gameState.js').Progress}
 */
export function loadProgress(catalog) {
  try {
    const text = globalThis.localStorage?.getItem(STORAGE_KEY);
    return text ? normalizeProgress(JSON.parse(text), catalog) : createProgress();
  } catch (error) {
    console.warn('保存データを読めなかったので、最初から始めます。', error);
    return createProgress();
  }
}

/**
 * 進行状況を保存する。
 * @param {import('./gameState.js').Progress} progress
 * @returns {boolean} 保存できたか
 */
export function saveProgress(progress) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.warn('進行状況を保存できませんでした。', error);
    return false;
  }
}

/** 保存データを消す（「最初からやり直す」） */
export function clearProgress() {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('保存データを消せませんでした。', error);
  }
}

/**
 * 読み込んだデータを、今のデータ形式に合わせて安全な形に直す。
 * 知らない依頼や材料の id は捨てる（データを書きかえたあとでも動くように）。
 * @param {any} raw
 * @param {import('./rules.js').Catalog} catalog
 * @returns {import('./gameState.js').Progress}
 */
export function normalizeProgress(raw, catalog) {
  let progress = createProgress();
  if (!raw || typeof raw !== 'object' || raw.version !== SAVE_VERSION) return progress;

  progress.furigana = raw.furigana !== false;
  progress.unlockAll = raw.unlockAll === true;
  progress.sound = raw.sound === true;
  const total = toInteger(raw.predictions?.total, 0, 100000);
  progress.predictions = { hits: Math.min(total, toInteger(raw.predictions?.hits, 0, 100000)), total };
  progress = setReflection(progress, typeof raw.reflection === 'string' ? raw.reflection : '');
  progress.zukan = normalizeZukan(raw.zukan, catalog);
  progress = normalizeRecords(progress, raw.records, catalog);
  progress.session = normalizeSession(raw.session, catalog);
  return progress;
}

function normalizeZukan(zukan, catalog) {
  const pick = (list, map) => (Array.isArray(list) ? list.filter((id) => map.has(id)) : []);
  return {
    materials: pick(zukan?.materials, catalog.materials),
    processes: pick(zukan?.processes, catalog.processes),
    reinforcements: pick(zukan?.reinforcements, catalog.reinforcements),
  };
}

function normalizeRecords(progress, records, catalog) {
  let next = progress;
  for (const [requestId, record] of Object.entries(records ?? {})) {
    const request = catalog.requests.get(requestId);
    if (!request || !record || typeof record !== 'object') continue;
    const latestPassed = normalizeDesignRecord(record.latestPassed, request, catalog);
    // v1.3.1 までの保存データには bestPassed がないので、最後に合格した設計で代わりにする
    const bestPassed = normalizeDesignRecord(record.bestPassed, request, catalog) ?? latestPassed;
    next = {
      ...next,
      records: {
        ...next.records,
        [requestId]: {
          bestStars: toInteger(record.bestStars, 0, 3),
          bestScore: toInteger(record.bestScore, 0, 100),
          latestPassed,
          bestPassed,
          reason: '',
        },
      },
    };
    next = setReason(next, requestId, typeof record.reason === 'string' ? record.reason : '');
  }
  return next;
}

/** 保存されていた「テストした設計の記録」を今のデータに合わせて直す（なければ null） */
function normalizeDesignRecord(saved, request, catalog) {
  if (!saved || typeof saved !== 'object') return null;
  return { design: sanitizeDesign(request, saved.design, catalog), score: toInteger(saved.score, 0, 100), stars: toInteger(saved.stars, 0, 3) };
}

function normalizeSession(session, catalog) {
  const request = session && catalog.requests.get(session.requestId);
  if (!request) return null;
  const partId = request.parts.some((part) => part.id === session.partId) ? session.partId : request.parts[0].id;
  const design = sanitizeDesign(request, session.design, catalog);
  // データを書きかえたあとなどで、設計の一部が使えなくなっていることがある。
  // テスト済みは「すべての部品が決まっている」ときだけ認め、ステップもその設計で入れるところまで戻す
  // （材料が決まっていないのに加工のステップを開くと、画面が描けなくなるため）
  const tested = session.tested === true && allMaterialsChosen(request, design) && allProcessesChosen(request, design);
  let step = toInteger(session.step, STEP.read, STEP.result);
  while (step > STEP.read && !canEnterStep({ design, tested }, request, step)) step -= 1;
  return {
    requestId: request.id,
    step,
    partId,
    design,
    tested,
    newEntries: [],
    prediction: null,
    predictionHit: null,
    reveal: false,
    newTitle: null,
  };
}

function toInteger(value, min, max) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}
