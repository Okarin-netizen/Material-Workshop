// 画面の行き来の履歴（ヘッダーや各画面の「もどる」で使う）。DOM には触らない。

/**
 * 画面を移ったあとの履歴を返す。行き先がすでに履歴にあれば、そこまで巻き戻す。
 * （「図鑑 → まとめ → もどる → 図鑑」で、もどるが図鑑とまとめを行き来し続けないように）
 * 履歴には同じ画面が2回入らず、今いる画面も入らない。
 * @template {string} T
 * @param {T[]} history これまでに通った画面（古い順）
 * @param {T} from 今の画面
 * @param {T} to   行き先
 * @returns {T[]}
 */
export function rememberScreen(history, from, to) {
  if (from === to) return history;
  const index = history.indexOf(to);
  return index >= 0 ? history.slice(0, index) : [...history, from];
}
