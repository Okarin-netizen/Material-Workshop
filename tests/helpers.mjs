// テストで共通に使うもの：データ一式と catalog。

import { MATERIALS } from '../js/data/materials.js';
import { PROCESSES } from '../js/data/processes.js';
import { REINFORCEMENTS } from '../js/data/reinforcements.js';
import { REQUESTS, RANKS } from '../js/data/requests.js';
import { buildCatalog } from '../js/core/rules.js';

export const DATA = { materials: MATERIALS, processes: PROCESSES, reinforcements: REINFORCEMENTS, requests: REQUESTS, ranks: RANKS };
export const CATALOG = buildCatalog(DATA);

/** id から依頼を取り出す（なければテストを失敗させる） */
export function requestById(id) {
  const request = CATALOG.requests.get(id);
  if (!request) throw new Error(`依頼「${id}」がありません`);
  return request;
}

/** 答えの書き方（answers.mjs）から設計を作る */
export function designOf(answer) {
  return { materials: { ...answer.materials }, processes: { ...answer.processes }, reinforcements: [...answer.reinforcements] };
}
