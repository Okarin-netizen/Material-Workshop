// 「この材料にこの加工は使えるか」「この工夫は選べるか」などのきまり。
// scoring.js と画面の両方から使う（同じ判定を2か所に書かないため）。DOM には触らない。

import { DEFAULT_UNSUITABLE_REASON } from '../data/processes.js';

/**
 * @typedef {Object} Catalog データを id で引けるようにしたもの
 * @property {Map<string, import('../data/materials.js').Material>} materials
 * @property {Map<string, import('../data/processes.js').Process>} processes
 * @property {Map<string, import('../data/reinforcements.js').Reinforcement>} reinforcements
 * @property {Map<string, import('../data/requests.js').GameRequest>} requests
 */

/**
 * @typedef {Object} Design 生徒の設計
 * @property {Record<string, string|null>} materials  部品id → 材料id
 * @property {Record<string, string|null>} processes  部品id → 加工方法id
 * @property {string[]} reinforcements 選んだ工夫のid
 */

/** @typedef {{ok: true} | {ok: false, reason: string}} Availability */

const OK = Object.freeze({ ok: true });

/**
 * 配列のデータを id で引ける Map にまとめる。
 * @param {{materials: any[], processes: any[], reinforcements: any[], requests: any[]}} data
 * @returns {Catalog}
 */
export function buildCatalog(data) {
  const byId = (list) => new Map(list.map((item) => [item.id, item]));
  return {
    materials: byId(data.materials),
    processes: byId(data.processes),
    reinforcements: byId(data.reinforcements),
    requests: byId(data.requests),
  };
}

/**
 * 加工方法の向き不向きを決めるときの「材料の種類」。
 * プラスチックは熱可塑性か熱硬化性かで加工のしかたが違うので分ける。
 * @param {import('../data/materials.js').Material} material
 * @returns {string}
 */
export function materialKind(material) {
  return material.plasticType ?? material.category;
}

/**
 * 空の設計を作る。
 * @param {import('../data/requests.js').GameRequest} request
 * @returns {Design}
 */
export function createEmptyDesign(request) {
  const empty = Object.fromEntries(request.parts.map((part) => [part.id, null]));
  return { materials: { ...empty }, processes: { ...empty }, reinforcements: [] };
}

/**
 * その材料に、その加工方法が使えるか。
 * @param {import('../data/processes.js').Process} process
 * @param {import('../data/materials.js').Material} material
 * @returns {Availability}
 */
export function processAvailability(process, material) {
  const kind = materialKind(material);
  if (process.suitableKinds.includes(kind)) return OK;
  return { ok: false, reason: process.unsuitableReasons[kind] ?? DEFAULT_UNSUITABLE_REASON };
}

/**
 * 依頼の中の工夫の設定（どの部品に効くか、など）を探す。
 * @param {import('../data/requests.js').GameRequest} request
 * @param {string} reinforcementId
 */
export function findRequestReinforcement(request, reinforcementId) {
  return request.reinforcements.find((entry) => entry.id === reinforcementId);
}

/**
 * 工夫が今の設計で選べるか（材料の条件・先に必要な工夫・いっしょに選べない工夫）。
 * @param {import('../data/requests.js').GameRequest} request
 * @param {Design} design
 * @param {string} reinforcementId
 * @param {Catalog} catalog
 * @returns {Availability}
 */
export function reinforcementAvailability(request, design, reinforcementId, catalog) {
  const reinforcement = catalog.reinforcements.get(reinforcementId);
  const entry = findRequestReinforcement(request, reinforcementId);
  if (!reinforcement || !entry) return { ok: false, reason: DEFAULT_UNSUITABLE_REASON };

  if (reinforcement.onlyForMaterials) {
    const targetParts = entry.parts ?? request.parts.map((part) => part.id);
    const fits = targetParts.some((partId) => reinforcement.onlyForMaterials.includes(design.materials[partId]));
    if (!fits) return { ok: false, reason: reinforcement.onlyForReason ?? DEFAULT_UNSUITABLE_REASON };
  }

  const missing = (reinforcement.requires ?? []).filter((id) => !design.reinforcements.includes(id));
  if (missing.length > 0) return { ok: false, reason: reinforcement.requiresReason ?? DEFAULT_UNSUITABLE_REASON };

  const conflict = design.reinforcements.find((otherId) => reinforcementsConflict(reinforcement, catalog.reinforcements.get(otherId)));
  if (conflict) {
    const reason = reinforcement.excludesReason ?? catalog.reinforcements.get(conflict)?.excludesReason;
    return { ok: false, reason: reason ?? DEFAULT_UNSUITABLE_REASON };
  }
  return OK;
}

/** excludes は片方にだけ書けばよいように、両方向を調べる */
function reinforcementsConflict(a, b) {
  if (!a || !b || a.id === b.id) return false;
  return (a.excludes ?? []).includes(b.id) || (b.excludes ?? []).includes(a.id);
}

/**
 * 材料を変えたあとなどに、使えなくなった加工方法や工夫を外した設計を返す。
 * （例：鋼から別の材料に変えたら、焼き入れは外す）
 * @param {import('../data/requests.js').GameRequest} request
 * @param {Design} design
 * @param {Catalog} catalog
 * @returns {Design}
 */
export function pruneDesign(request, design, catalog) {
  const processes = { ...design.processes };
  for (const part of request.parts) {
    const material = catalog.materials.get(design.materials[part.id]);
    const process = catalog.processes.get(processes[part.id]);
    if (process && (!material || !processAvailability(process, material).ok)) processes[part.id] = null;
  }

  // 工夫は、外すと別の工夫が選べなくなることがある（焼き入れ → 焼き戻し）。
  // 変化がなくなるまでくり返す。
  let reinforcements = [...design.reinforcements];
  let changed = true;
  while (changed) {
    const current = { ...design, processes, reinforcements };
    const kept = reinforcements.filter((id) =>
      reinforcementAvailability(request, { ...current, reinforcements: reinforcements.filter((other) => other !== id) }, id, catalog).ok,
    );
    changed = kept.length !== reinforcements.length;
    reinforcements = kept;
  }
  return { materials: { ...design.materials }, processes, reinforcements };
}

/** すべての部品の材料が決まっているか */
export function allMaterialsChosen(request, design) {
  return request.parts.every((part) => Boolean(design.materials[part.id]));
}

/** すべての部品の加工方法が決まっているか */
export function allProcessesChosen(request, design) {
  return request.parts.every((part) => Boolean(design.processes[part.id]));
}
