// 特性（traits）・指標（metrics）・材料の分類の「名前」をまとめたデータ。
// 数値そのものは materials.js などに書く。

/**
 * 材料や部品の特性。値は 0〜5（constants.js の TRAIT_MAX）。
 * ここにない名前を材料データやテストで使うと validateData.js が知らせる。
 * @type {Record<string, {label: string}>}
 */
export const TRAITS = {
  strength: { label: '{強|つよ}さ' },
  hardness: { label: '{硬|かた}さ' },
  toughness: { label: '{粘|ねば}り{強|づよ}さ（{割|わ}れにくさ）' },
  lightness: { label: '{軽|かる}さ' },
  weather: { label: '{雨|あめ}や{水|みず}への{強|つよ}さ' },
  heatResistance: { label: '{熱|ねつ}で{軟|やわ}らかくなりにくい' },
  insulation: { label: '{熱|ねつ}の{伝|つた}わりにくさ' },
  workability: { label: '{加工|かこう}のしやすさ' },
  stability: { label: '{変形|へんけい}のしにくさ' },
  eco: { label: '{環境|かんきょう}への{負荷|ふか}の{小|ちい}ささ' },
  transparency: { label: '{透明|とうめい}さ' },
  reclose: { label: '{何度|なんど}でも{開|あ}け{閉|し}めできる' },
};

/**
 * 製品全体の特性（部品ではなく組み立て方で決まるもの）。
 * 依頼データの baseStructure と、工夫の productEffects で決まる。
 */
export const PRODUCT_TRAITS = {
  structure: { label: '{構造|こうぞう}の{強|つよ}さ（ぐらつきにくさ）' },
};

/**
 * 結果に出す5つの指標。並び順はレーダーチャートの並び順（上から時計回り）。
 * @type {{id: MetricId, label: string}[]}
 */
export const METRICS = [
  { id: 'strength', label: '{強|つよ}さ' },
  { id: 'durability', label: '{耐久性|たいきゅうせい}' },
  { id: 'usability', label: '{使|つか}い{心地|ごこち}' },
  { id: 'cost', label: 'コスト' },
  { id: 'environment', label: '{環境|かんきょう}' },
];

/** @typedef {'strength'|'durability'|'usability'|'cost'|'environment'} MetricId */

/**
 * 材料の分類。カードの色札に使う。
 * kinds は「加工方法が向いているか」を決めるときの細かい種類（processes.js で使う）。
 */
export const CATEGORIES = {
  wood: { label: '{木材|もくざい}', tone: 'wood' },
  woodBased: { label: '{木質材料|もくしつざいりょう}', tone: 'wood' },
  metal: { label: '{金属|きんぞく}', tone: 'metal' },
  alloy: { label: '{合金|ごうきん}', tone: 'metal' },
  plastic: { label: 'プラスチック', tone: 'plastic' },
  glass: { label: 'ガラス', tone: 'glass' },
};

/**
 * 加工方法の向き・不向きを決める「材料の種類」。
 * プラスチックだけは、熱可塑性と熱硬化性で加工のしかたが違うので分ける。
 */
export const MATERIAL_KINDS = {
  wood: { label: '{木材|もくざい}' },
  woodBased: { label: '{木質材料|もくしつざいりょう}' },
  metal: { label: '{金属|きんぞく}' },
  alloy: { label: '{合金|ごうきん}' },
  thermoplastic: { label: '{熱可塑性|ねつかそせい}プラスチック' },
  thermoset: { label: '{熱硬化性|ねつこうかせい}プラスチック' },
  glass: { label: 'ガラス' },
};
