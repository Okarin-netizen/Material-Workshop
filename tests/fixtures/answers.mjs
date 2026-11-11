// 各依頼の「模範解（★3になるはず）」「典型的な誤答（不合格になるはず）」「惜しい答え（★1〜2になるはず）」。
// scoring.test.mjs と E2E テストが使う。依頼を書き足したら、ここにも書き足す。
//
// 書き方：
//   materials: { 部品id: 材料id }, processes: { 部品id: 加工id }, reinforcements: [工夫id...]
//   wrong には、どのテストで不合格になるはずか（failTests）も書く。

/**
 * @typedef {Object} Answer
 * @property {string} label
 * @property {Record<string, string>} materials
 * @property {Record<string, string>} processes
 * @property {string[]} reinforcements
 * @property {string[]} [failTests]  wrong のときだけ：不合格になるテストの id
 * @property {number[]} [stars]      near のときだけ：ありうる星の数
 */

/** @type {Record<string, {model: Answer, wrong: Answer[], near: Answer[]}>} */
export const ANSWERS = {
  parkBench: {
    model: { label: 'スギ＋切って削る＋塗装', materials: { seat: 'sugi' }, processes: { seat: 'sawPlane' }, reinforcements: ['paint'] },
    wrong: [
      { label: '鋼の座面（冷たい）', materials: { seat: 'steel' }, processes: { seat: 'sawPlane' }, reinforcements: ['paint'], failTests: ['warm'] },
      { label: 'アクリルの座面', materials: { seat: 'acrylic' }, processes: { seat: 'heatBend' }, reinforcements: [], failTests: ['warm'] },
    ],
    near: [
      { label: 'シラカシ（加工しにくく高い）', materials: { seat: 'shirakashi' }, processes: { seat: 'sawPlane' }, reinforcements: [], stars: [1, 2] },
      { label: 'スギだが塗装なし', materials: { seat: 'sugi' }, processes: { seat: 'sawPlane' }, reinforcements: [], stars: [1, 2] },
    ],
  },
  handrail: {
    model: { label: 'ステンレス＋曲げ加工', materials: { rail: 'stainless' }, processes: { rail: 'bend' }, reinforcements: [] },
    wrong: [
      { label: '鋼で塗装なし（さびる）', materials: { rail: 'steel' }, processes: { rail: 'bend' }, reinforcements: [], failTests: ['rust'] },
      { label: 'アルミニウム（弱い）', materials: { rail: 'aluminum' }, processes: { rail: 'bend' }, reinforcements: ['paint'], failTests: ['strong'] },
      { label: 'スギ', materials: { rail: 'sugi' }, processes: { rail: 'sawPlane' }, reinforcements: [], failTests: ['strong', 'rust'] },
    ],
    near: [{ label: '鋼＋塗装', materials: { rail: 'steel' }, processes: { rail: 'bend' }, reinforcements: ['paint'], stars: [1, 2] }],
  },
  panHandle: {
    model: { label: 'フェノール樹脂＋型', materials: { handle: 'phenol' }, processes: { handle: 'cast' }, reinforcements: [] },
    wrong: [
      { label: 'ポリプロピレン（熱可塑性）', materials: { handle: 'polypropylene' }, processes: { handle: 'cast' }, reinforcements: [], failTests: ['heat'] },
      { label: 'アクリル（熱可塑性）', materials: { handle: 'acrylic' }, processes: { handle: 'heatBend' }, reinforcements: [], failTests: ['heat'] },
      { label: 'ステンレス（熱を通す）', materials: { handle: 'stainless' }, processes: { handle: 'cast' }, reinforcements: [], failTests: ['grip'] },
    ],
    near: [{ label: 'フェノール樹脂を削り出す', materials: { handle: 'phenol' }, processes: { handle: 'sawPlane' }, reinforcements: [], stars: [1, 2] }],
  },
  bookshelf: {
    model: { label: '集成材＋背板（面構造）', materials: { body: 'glulam' }, processes: { body: 'sawPlane' }, reinforcements: ['panel'] },
    wrong: [
      { label: '集成材で補強なし', materials: { body: 'glulam' }, processes: { body: 'sawPlane' }, reinforcements: [], failTests: ['sway'] },
      { label: 'スギの製材品', materials: { body: 'sugi' }, processes: { body: 'sawPlane' }, reinforcements: ['panel'], failTests: ['warp', 'load'] },
      { label: 'アクリル', materials: { body: 'acrylic' }, processes: { body: 'heatBend' }, reinforcements: ['panel'], failTests: ['warp', 'load'] },
    ],
    near: [
      { label: '集成材＋三角形（空間が狭い）', materials: { body: 'glulam' }, processes: { body: 'sawPlane' }, reinforcements: ['triangle'], stars: [1, 2] },
      { label: '集成材＋補強金具だけ', materials: { body: 'glulam' }, processes: { body: 'sawPlane' }, reinforcements: ['bracket'], stars: [1, 2] },
    ],
  },
  stationBench: {
    model: {
      label: 'スギ座面＋ステンレス脚＋三角形',
      materials: { seat: 'sugi', frame: 'stainless' },
      processes: { seat: 'sawPlane', frame: 'weld' },
      reinforcements: ['triangle', 'paint'],
    },
    wrong: [
      { label: '補強なし', materials: { seat: 'sugi', frame: 'stainless' }, processes: { seat: 'sawPlane', frame: 'weld' }, reinforcements: [], failTests: ['load'] },
      { label: '鋼の脚（塗装なし）', materials: { seat: 'sugi', frame: 'steel' }, processes: { seat: 'sawPlane', frame: 'weld' }, reinforcements: ['triangle'], failTests: ['rust'] },
      { label: 'ステンレスの座面', materials: { seat: 'stainless', frame: 'stainless' }, processes: { seat: 'sawPlane', frame: 'weld' }, reinforcements: ['triangle'], failTests: ['warm'] },
    ],
    near: [
      {
        label: '鋼の脚＋塗装',
        materials: { seat: 'sugi', frame: 'steel' },
        processes: { seat: 'sawPlane', frame: 'weld' },
        reinforcements: ['triangle', 'paint'],
        stars: [1, 2],
      },
    ],
  },
  drinkBottle: {
    model: { label: 'PET＋ブロー成形＋溝', materials: { body: 'pet' }, processes: { body: 'blow' }, reinforcements: ['crossSection'] },
    wrong: [
      { label: 'ガラスの瓶', materials: { body: 'glass' }, processes: { body: 'blow' }, reinforcements: [], failTests: ['light', 'drop'] },
      { label: 'アルミ缶', materials: { body: 'aluminumAlloy' }, processes: { body: 'press' }, reinforcements: [], failTests: ['see', 'reclose'] },
      { label: 'PETで工夫なし', materials: { body: 'pet' }, processes: { body: 'blow' }, reinforcements: [], failTests: ['squeeze'] },
    ],
    near: [{ label: 'PETを厚くする', materials: { body: 'pet' }, processes: { body: 'blow' }, reinforcements: ['thicken'], stars: [1, 2] }],
  },
  bicycleFrame: {
    model: {
      label: 'アルミニウム合金＋溶接＋パイプ＋三角形',
      materials: { frame: 'aluminumAlloy' },
      processes: { frame: 'weld' },
      reinforcements: ['crossSection', 'triangle'],
    },
    wrong: [
      { label: '鋼（重い）', materials: { frame: 'steel' }, processes: { frame: 'weld' }, reinforcements: ['crossSection', 'triangle'], failTests: ['light'] },
      { label: 'アルミニウム（弱い）', materials: { frame: 'aluminum' }, processes: { frame: 'weld' }, reinforcements: ['crossSection', 'triangle'], failTests: ['strong'] },
      { label: 'アルミニウム合金で工夫なし', materials: { frame: 'aluminumAlloy' }, processes: { frame: 'weld' }, reinforcements: [], failTests: ['strong'] },
    ],
    near: [{ label: 'アルミニウム合金＋三角形だけ', materials: { frame: 'aluminumAlloy' }, processes: { frame: 'weld' }, reinforcements: ['triangle'], stars: [1, 2] }],
  },
  kitchenKnife: {
    model: { label: '鋼＋鍛造＋焼き入れ＋焼き戻し', materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: ['quench', 'temper'] },
    wrong: [
      { label: '焼き入れだけ（もろい）', materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: ['quench'], failTests: ['chip'] },
      { label: '熱処理なし', materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: [], failTests: ['sharp'] },
      { label: '焼きなまし', materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: ['anneal'], failTests: ['sharp'] },
      { label: 'アルミニウム合金', materials: { blade: 'aluminumAlloy' }, processes: { blade: 'forge' }, reinforcements: [], failTests: ['sharp'] },
    ],
    near: [
      { label: '鋼を削り出し＋焼き入れ＋焼き戻し', materials: { blade: 'steel' }, processes: { blade: 'sawPlane' }, reinforcements: ['quench', 'temper'], stars: [1, 2] },
    ],
  },
};
