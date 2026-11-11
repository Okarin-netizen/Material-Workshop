// 文章データの小さな記法を、表示用の「かたまり」の配列に分ける。
// DOM には触らない（node --test で確かめられるようにするため）。
//
// 記法：
//   {漢字|かんじ}  … ふりがな（ruby）
//   *強調したい文*  … 強調（依頼人のせりふの大事なところなど）。中に {…|…} を書いてもよい。

/**
 * @typedef {Object} TextSegment
 * @property {'text'|'ruby'} type
 * @property {string} text   表示する文字（ruby のときは漢字の部分）
 * @property {string} [reading] ふりがな（ruby のときだけ）
 * @property {boolean} emphasis 強調するかどうか
 */

const RUBY_PATTERN = /\{([^{}|]+)\|([^{}|]+)\}/g;

/**
 * 記法つきの文字列を TextSegment の配列にする。
 * @param {string} source
 * @returns {TextSegment[]}
 */
export function parseMarkup(source) {
  const segments = [];
  // 「*」で区切ると、奇数番目が強調の中身になる
  String(source).split('*').forEach((chunk, index) => {
    const emphasis = index % 2 === 1;
    segments.push(...parseRuby(chunk, emphasis));
  });
  return segments.filter((segment) => segment.text !== '');
}

/**
 * {漢字|かんじ} だけを読み取る。
 * @param {string} chunk
 * @param {boolean} emphasis
 * @returns {TextSegment[]}
 */
function parseRuby(chunk, emphasis) {
  const result = [];
  let last = 0;
  for (const match of chunk.matchAll(RUBY_PATTERN)) {
    result.push({ type: 'text', text: chunk.slice(last, match.index), emphasis });
    result.push({ type: 'ruby', text: match[1], reading: match[2], emphasis });
    last = match.index + match[0].length;
  }
  result.push({ type: 'text', text: chunk.slice(last), emphasis });
  return result;
}

/**
 * 記法を取り除いた、ふつうの文字列にする（aria-label や title、印刷用の短い文に使う）。
 * @param {string} source
 * @returns {string}
 */
export function toPlainText(source) {
  return parseMarkup(source).map((segment) => segment.text).join('');
}
