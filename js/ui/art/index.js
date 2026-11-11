// 設計台と結果画面に出す製品の絵。依頼データの art の名前で、どの絵を描くかを決める。
// 部品は選んだ材料の色で塗る。まだ選んでいない部品は、点線のオレンジで描く。
// 新しい依頼の絵を足すときは、furniture.js か tools.js に関数を書き、下の ART_DRAWERS に加える。

import { s } from '../dom.js';
import { plain } from '../components/ruby.js';
import { drawParkBench, drawHandrail, drawBookshelf, drawStationBench } from './furniture.js';
import { drawPanHandle, drawDrinkBottle, drawBicycleFrame, drawKitchenKnife } from './tools.js';

/** @type {Record<string, (ctx: ArtContext) => SVGElement[]>} */
export const ART_DRAWERS = {
  parkBench: drawParkBench,
  handrail: drawHandrail,
  panHandle: drawPanHandle,
  bookshelf: drawBookshelf,
  stationBench: drawStationBench,
  drinkBottle: drawDrinkBottle,
  bicycleFrame: drawBicycleFrame,
  kitchenKnife: drawKitchenKnife,
};

export const ART_VIEWBOX = { width: 600, height: 400 };

const OUTLINE = '#5b3a1e';
const UNSELECTED = { fill: '#fff6c9', stroke: '#ff8a3d', dash: '10 7' };

/**
 * @typedef {Object} ArtContext 絵を描く関数に渡すもの
 * @property {(partId: string, extra?: object) => object} paint 部品の塗り（SVG の属性）
 * @property {(partId: string) => (string|null)} materialId
 * @property {(partId: string) => (import('../../data/materials.js').MaterialLook|null)} look
 * @property {(reinforcementId: string) => boolean} has 工夫を選んでいるか
 * @property {string} outline 線の色
 */

/**
 * @param {import('../../data/requests.js').GameRequest} request
 * @param {import('../../core/rules.js').Design} design
 * @param {import('../../core/rules.js').Catalog} catalog
 * @returns {SVGElement}
 */
export function renderProductArt(request, design, catalog) {
  const drawer = ART_DRAWERS[request.art];
  const ctx = createContext(design, catalog);
  return s(
    'svg',
    {
      class: 'product-art',
      viewBox: `0 0 ${ART_VIEWBOX.width} ${ART_VIEWBOX.height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': plain(request.title),
    },
    s('rect', { x: 10, y: 330, width: 580, height: 62, rx: 14, fill: '#e9dcc3' }),
    drawer ? drawer(ctx) : null,
  );
}

/** @returns {ArtContext} */
function createContext(design, catalog) {
  const look = (partId) => catalog.materials.get(design.materials[partId])?.look ?? null;
  return {
    outline: OUTLINE,
    look,
    materialId: (partId) => design.materials[partId] ?? null,
    has: (id) => design.reinforcements.includes(id),
    paint: (partId, extra = {}) => {
      const chosen = look(partId);
      const base = chosen
        ? { fill: chosen.base, stroke: OUTLINE }
        : { fill: UNSELECTED.fill, stroke: UNSELECTED.stroke, 'stroke-dasharray': UNSELECTED.dash };
      return { 'stroke-width': 4, 'stroke-linejoin': 'round', ...base, ...extra };
    },
  };
}
