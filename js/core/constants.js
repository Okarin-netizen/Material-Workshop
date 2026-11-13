// ゲーム全体で使う数値をここにまとめる。
// 数値を変えるときはこのファイルだけを直せばよいようにしている。

/** 材料の特性値（traits）の最大値。特性は 0〜5 の6段階で表す。 */
export const TRAIT_MAX = 5;

/** 5つの指標と得点の最大値（100点満点） */
export const METRIC_MAX = 100;

/** 星の基準。全テスト合格で★1、さらに得点がこの値以上で★2・★3 */
export const STAR_SCORE = Object.freeze({ two: 80, three: 85 });

/**
 * コスト指標の計算に使う値。
 * 予算に対する費用の割合が fullScoreRatio 以下なら 100 点、
 * 予算ちょうどで scoreAtBudget 点になるように直線で下がる。予算を超えたら 0 点。
 * （安ければ安いほどよい、ではなく「予算の中でうまく使う」ことを評価したいので、
 *   ある程度より安くても満点のまま増えないようにしている）
 */
export const COST_SCORE = Object.freeze({ fullScoreRatio: 0.6, scoreAtBudget: 60 });

/** メーターの色分けの境目（指標がこれ以上なら緑、fair 以上なら黄、未満は赤） */
export const METER_LEVEL = Object.freeze({ good: 60, fair: 40 });

/** 次のランクを開くために必要な、前のランクの達成数 */
export const CLEARS_TO_UNLOCK_NEXT_RANK = 2;

/** 入力欄の最大文字数 */
export const TEXT_LIMIT = Object.freeze({ reason: 80, reflection: 300 });

/** localStorage のキー。保存形式を大きく変えたときは末尾の番号を上げる */
export const STORAGE_KEY = 'material-koubou-v1';

/** 保存データの形式の版。storage.js で古いデータを見分けるのに使う */
export const SAVE_VERSION = 1;

/** 1つの依頼のステップ数（依頼を読む〜テストと結果） */
export const STEP = Object.freeze({ read: 1, material: 2, process: 3, reinforce: 4, result: 5 });
