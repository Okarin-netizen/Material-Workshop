// 道具・乗り物・容器の絵：フライパンの取っ手、飲み物の容器、自転車のフレーム、包丁。（座標は 600×400 の中）

import { s } from '../dom.js';

const PAN = '#4a4f55';
const TIRE = '#2d2a28';
const WOOD_HANDLE = '#c98a4e';

export function drawPanHandle(ctx) {
  const handle = ctx.paint('handle');
  return [
    s('ellipse', { cx: 200, cy: 250, rx: 170, ry: 60, fill: PAN, stroke: ctx.outline, 'stroke-width': 5 }),
    s('ellipse', { cx: 200, cy: 240, rx: 150, ry: 46, fill: '#5f656c' }),
    // 熱が伝わるようすを、ゆらゆらした線で描く
    s('g', { stroke: '#e86a1a', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 },
      [130, 200, 270].map((x) => s('path', { d: `M${x} 180 q-12 -20 0 -40 q12 -20 0 -40` })),
    ),
    s('rect', { x: 352, y: 228, width: 34, height: 26, fill: PAN, stroke: ctx.outline, 'stroke-width': 4 }),
    s('path', { d: 'M380 222 L560 206 Q578 218 562 236 L380 262Z', ...handle }),
    ctx.has('crossSection') ? s('path', { d: 'M392 242 L552 224', stroke: ctx.outline, 'stroke-width': 3, opacity: 0.6 }) : null,
    ctx.has('bracket') ? [s('circle', { cx: 366, cy: 234, r: 5, fill: '#9aa3ab', stroke: ctx.outline, 'stroke-width': 2 }), s('circle', { cx: 366, cy: 250, r: 5, fill: '#9aa3ab', stroke: ctx.outline, 'stroke-width': 2 })] : null,
  ];
}

/** 材料によって形を変える：ガラス → 瓶、金属 → 缶、PET・未選択 → ペットボトル */
export function drawDrinkBottle(ctx) {
  const body = ctx.paint('body', ctx.has('thicken') ? { 'stroke-width': 9 } : {});
  const material = ctx.materialId('body');
  const shape = material === 'glass' ? glassBottle(body) : material === 'steel' || material === 'aluminumAlloy' ? can(body) : petBottle(body);
  const drink = s('rect', { x: 250, y: 190, width: 100, height: 130, fill: '#ffd257', opacity: material === 'glass' || material === 'pet' ? 0.55 : 0 });
  const grooves = ctx.has('crossSection')
    ? s('g', { stroke: ctx.outline, 'stroke-width': 3, opacity: 0.55 }, [170, 200, 280, 310].map((y) => s('line', { x1: 248, y1: y, x2: 352, y2: y })))
    : null;
  return [drink, shape, grooves];
}

function petBottle(body) {
  return [
    s('path', { d: 'M270 60 L330 60 L330 90 Q362 110 362 150 L362 330 Q362 344 348 344 L252 344 Q238 344 238 330 L238 150 Q238 110 270 90Z', ...body, 'fill-opacity': 0.75 }),
    s('rect', { x: 266, y: 34, width: 68, height: 30, rx: 6, fill: '#ff8a3d', stroke: '#5b3a1e', 'stroke-width': 4 }),
  ];
}

function glassBottle(body) {
  return [
    s('path', { d: 'M282 40 L318 40 L318 110 Q362 130 362 170 L362 334 Q362 344 352 344 L248 344 Q238 344 238 334 L238 170 Q238 130 282 110Z', ...body, 'fill-opacity': 0.75 }),
    s('rect', { x: 278, y: 22, width: 44, height: 22, rx: 5, fill: '#c9a227', stroke: '#5b3a1e', 'stroke-width': 4 }),
  ];
}

function can(body) {
  return [
    s('rect', { x: 236, y: 110, width: 128, height: 234, rx: 14, ...body }),
    s('ellipse', { cx: 300, cy: 112, rx: 64, ry: 12, fill: '#c3cad1', stroke: '#5b3a1e', 'stroke-width': 4 }),
    s('rect', { x: 286, y: 104, width: 28, height: 8, rx: 3, fill: '#8f9aa5' }),
  ];
}

export function drawBicycleFrame(ctx) {
  const frame = ctx.paint('frame');
  const hollow = ctx.has('crossSection');
  // 三角形の構造を選ぶと、前と後ろが三角形になる「ダイヤモンド形」のフレームにする
  const tubes = ctx.has('triangle')
    ? [[160, 290, 290, 290], [290, 290, 250, 160], [250, 160, 420, 160], [420, 160, 290, 290], [160, 290, 250, 160], [420, 160, 440, 290]]
    : [[160, 290, 290, 290], [290, 290, 270, 160], [270, 160, 420, 160], [420, 160, 440, 290]];
  return [
    wheel(160, 290),
    wheel(440, 290),
    tubes.map(([x1, y1, x2, y2]) => tube(x1, y1, x2, y2, frame, hollow)),
    s('path', { d: 'M232 150 L276 150', stroke: '#2d2a28', 'stroke-width': 12, 'stroke-linecap': 'round' }),
    s('path', { d: 'M420 160 L428 118 L460 112', fill: 'none', stroke: '#2d2a28', 'stroke-width': 8, 'stroke-linecap': 'round' }),
    ctx.has('paint') ? s('line', { x1: 280, y1: 154, x2: 400, y2: 154, stroke: 'rgba(255,255,255,.6)', 'stroke-width': 3 }) : null,
  ];
}

function wheel(cx, cy) {
  return s('g', {},
    s('circle', { cx, cy, r: 82, fill: 'none', stroke: TIRE, 'stroke-width': 12 }),
    s('circle', { cx, cy, r: 6, fill: TIRE }),
    [0, 45, 90, 135].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      return s('line', { x1: cx - Math.cos(rad) * 76, y1: cy - Math.sin(rad) * 76, x2: cx + Math.cos(rad) * 76, y2: cy + Math.sin(rad) * 76, stroke: '#9b938a', 'stroke-width': 2 });
    }),
  );
}

/** パイプ（断面形状の工夫）を選ぶと、中が空洞に見えるように二重線で描く */
function tube(x1, y1, x2, y2, paint, hollow) {
  const common = { x1, y1, x2, y2, 'stroke-linecap': 'round' };
  return [
    s('line', { ...common, stroke: paint.stroke, 'stroke-width': 18 }),
    s('line', { ...common, stroke: paint.fill, 'stroke-width': 12, 'stroke-dasharray': paint['stroke-dasharray'] }),
    hollow ? s('line', { ...common, stroke: paint.stroke, 'stroke-width': 3, opacity: 0.5 }) : null,
  ];
}

export function drawKitchenKnife(ctx) {
  const blade = ctx.paint('blade');
  return [
    s('path', { d: 'M90 200 L400 186 L400 250 Q250 262 120 236 Q84 226 90 200Z', ...blade }),
    // 焼き入れをすると刃先が硬くなる。刃先に沿った線（刃文のような線）で表す
    ctx.has('quench') ? s('path', { d: 'M110 226 Q250 248 396 236', fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.8 }) : null,
    ctx.has('temper') ? s('path', { d: 'M140 210 L380 200', fill: 'none', stroke: '#c9a227', 'stroke-width': 3, opacity: 0.7 }) : null,
    s('rect', { x: 398, y: 196, width: 26, height: 48, rx: 4, fill: '#8f9aa5', stroke: ctx.outline, 'stroke-width': 4 }),
    s('rect', { x: 422, y: 200, width: 150, height: 40, rx: 14, fill: WOOD_HANDLE, stroke: ctx.outline, 'stroke-width': 4 }),
  ];
}
