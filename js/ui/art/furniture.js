// 家具・建具の絵：公園のベンチ、手すり、本棚、駅のベンチ。（座標は 600×400 の中）

import { s } from '../dom.js';

const IRON = '#6d6258'; // 依頼に関係しない、もとからある部分の色
const GLOSS = 'rgba(255,255,255,.55)';

/** 塗装を選んだときのつやの線 */
function glossLines(segments) {
  return s('g', { stroke: GLOSS, 'stroke-width': 4, 'stroke-linecap': 'round' }, segments.map(([x1, y1, x2, y2]) => s('line', { x1, y1, x2, y2 })));
}

/** 補強金具（L字の板） */
function bracket(x, y, flip = 1, outline) {
  return s('path', { d: `M${x} ${y} l${22 * flip} 0 l0 6 l${-16 * flip} 0 l0 16 l-${6 * flip} 0z`, fill: '#9aa3ab', stroke: outline, 'stroke-width': 2 });
}

/** 太い線で描く部材（斜め材・手すりのパイプ）。ふちの線を先に太く描き、その上に材料の色を描く */
function bar(x1, y1, x2, y2, paint, width = 10) {
  const common = { x1, y1, x2, y2, 'stroke-linecap': 'round' };
  return [
    s('line', { ...common, stroke: paint.stroke, 'stroke-width': width + 6 }),
    s('line', { ...common, stroke: paint.fill, 'stroke-width': width, 'stroke-dasharray': paint['stroke-dasharray'] }),
  ];
}

export function drawParkBench(ctx) {
  const seat = ctx.paint('seat');
  const slats = [0, 1, 2].map((i) => s('rect', { x: 90, y: 196 + i * 24, width: 420, height: 20, rx: 6, ...seat }));
  return [
    s('g', { fill: IRON, stroke: ctx.outline, 'stroke-width': 4 },
      s('rect', { x: 110, y: 262, width: 22, height: 90, rx: 4 }),
      s('rect', { x: 468, y: 262, width: 22, height: 90, rx: 4 }),
      s('rect', { x: 110, y: 120, width: 18, height: 80, rx: 4 }),
      s('rect', { x: 472, y: 120, width: 18, height: 80, rx: 4 }),
      s('rect', { x: 100, y: 128, width: 400, height: 22, rx: 8 }),
    ),
    ctx.has('crossSection') ? s('rect', { x: 150, y: 262, width: 300, height: 26, rx: 4, ...ctx.paint('seat') }) : null,
    slats,
    ctx.has('paint') ? glossLines([[110, 202, 200, 202], [110, 226, 170, 226], [110, 250, 190, 250]]) : null,
  ];
}

const STAIR = { left: 80, right: 530, bottom: 330, rise: 40, run: 90, count: 5 };
const RAIL = { x1: 100, y1: 160, x2: 520, y2: 4 };

/** 階段の、x の位置の段の上面の高さ */
function stairTop(x) {
  const index = Math.min(STAIR.count - 1, Math.floor((x - STAIR.left) / STAIR.run));
  return STAIR.bottom - (index + 1) * STAIR.rise;
}

/** 手すりの、x の位置の高さ */
function railY(x) {
  return RAIL.y1 + ((RAIL.y2 - RAIL.y1) * (x - RAIL.x1)) / (RAIL.x2 - RAIL.x1);
}

export function drawHandrail(ctx) {
  const rail = ctx.paint('rail');
  const steps = Array.from({ length: STAIR.count }, (_, i) =>
    s('rect', { x: STAIR.left + i * STAIR.run, y: STAIR.bottom - (i + 1) * STAIR.rise, width: STAIR.right - STAIR.left - i * STAIR.run, height: STAIR.rise, fill: '#c9c3b8', stroke: ctx.outline, 'stroke-width': 3 }),
  );
  const postX = [130, 300, 470];
  return [
    steps,
    postX.map((x) => bar(x, railY(x), x, stairTop(x), rail, 10)),
    bar(RAIL.x1, RAIL.y1, RAIL.x2, RAIL.y2, rail, 16),
    ctx.has('bracket') ? postX.map((x) => s('rect', { x: x - 14, y: stairTop(x) - 10, width: 28, height: 10, fill: '#9aa3ab', stroke: ctx.outline, 'stroke-width': 2 })) : null,
    ctx.has('paint') ? glossLines([[150, railY(150) - 3, 280, railY(280) - 3]]) : null,
  ];
}

export function drawBookshelf(ctx) {
  const body = ctx.paint('body');
  const left = 170;
  const right = 430;
  const top = 40;
  const bottom = 340;
  const shelves = [130, 220, 310];
  const bookColors = ['#d9534f', '#3f7fbf', '#4fae45', '#e0a21a', '#7a5ca8'];
  const books = shelves.flatMap((y, row) =>
    bookColors.map((color, i) => s('rect', { x: left + 22 + i * 34 + row * 6, y: y - 62 + (i % 2) * 8, width: 26, height: 62 - (i % 2) * 8, fill: color, stroke: ctx.outline, 'stroke-width': 2 })),
  );
  const backFill = ctx.look('body')?.dark ?? '#fff6c9';
  return [
    ctx.has('panel') ? s('rect', { x: left, y: top, width: right - left, height: bottom - top, fill: backFill, opacity: 0.55, stroke: ctx.outline, 'stroke-width': 3 }) : null,
    books,
    s('rect', { x: left - 20, y: top, width: 20, height: bottom - top, ...body }),
    s('rect', { x: right, y: top, width: 20, height: bottom - top, ...body }),
    s('rect', { x: left - 20, y: top - 18, width: right - left + 40, height: 18, ...body }),
    shelves.map((y) => s('rect', { x: left, y, width: right - left, height: 14, ...body })),
    ctx.has('triangle') ? [bar(left + 6, top + 6, right - 6, 124, body, 8), bar(left + 6, 214, right - 6, 144, body, 8)] : null,
    ctx.has('bracket') ? [bracket(left, top, 1, ctx.outline), bracket(right, top, -1, ctx.outline), bracket(left, 296, 1, ctx.outline), bracket(right, 296, -1, ctx.outline)] : null,
  ];
}

export function drawStationBench(ctx) {
  const seat = ctx.paint('seat');
  const frame = ctx.paint('frame');
  return [
    s('rect', { x: 120, y: 96, width: 20, height: 130, ...frame }),
    s('rect', { x: 460, y: 96, width: 20, height: 130, ...frame }),
    s('rect', { x: 110, y: 100, width: 380, height: 30, rx: 8, ...seat }),
    s('rect', { x: 110, y: 140, width: 380, height: 30, rx: 8, ...seat }),
    s('path', { d: 'M84 222 L516 222 L546 262 L54 262Z', ...seat }),
    s('rect', { x: 54, y: 262, width: 492, height: 20, ...seat }),
    s('rect', { x: 92, y: 282, width: 24, height: 70, ...frame }),
    s('rect', { x: 484, y: 282, width: 24, height: 70, ...frame }),
    s('rect', { x: 116, y: 316, width: 368, height: 16, ...frame }),
    ctx.has('triangle') ? [bar(118, 288, 176, 320, frame, 8), bar(482, 288, 424, 320, frame, 8)] : null,
    ctx.has('bracket') ? [bracket(116, 282, 1, ctx.outline), bracket(484, 282, -1, ctx.outline)] : null,
    ctx.has('paint') ? glossLines([[130, 108, 260, 108], [100, 232, 220, 232]]) : null,
  ];
}
