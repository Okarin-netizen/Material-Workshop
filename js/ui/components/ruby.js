// 記法つきの文字列（{漢字|かんじ}、*強調*）を DOM に変える。
// ふりがなの表示・非表示はここで切りかえる。innerHTML は使わない（文字はすべて textContent で入れる）。

import { parseMarkup, toPlainText } from '../../core/rubyParse.js';

let furiganaEnabled = true;

/** ふりがなを付けるかどうかを決める（設定が変わったら main.js が呼ぶ） */
export function setFuriganaEnabled(enabled) {
  furiganaEnabled = Boolean(enabled);
}

/**
 * 記法つきの文字列から DOM ノードの配列を作る。
 * @param {string} source
 * @returns {Node[]}
 */
export function rubyNodes(source) {
  return parseMarkup(source).map(segmentToNode);
}

function segmentToNode(segment) {
  const inner = segment.type === 'ruby' && furiganaEnabled ? rubyElement(segment) : document.createTextNode(segment.text);
  if (!segment.emphasis) return inner;
  const em = document.createElement('em');
  em.append(inner);
  return em;
}

function rubyElement(segment) {
  const ruby = document.createElement('ruby');
  const rt = document.createElement('rt');
  ruby.textContent = segment.text;
  rt.textContent = segment.reading;
  ruby.append(rt);
  return ruby;
}

/** 記法を外したふつうの文字列（aria-label などに使う） */
export const plain = toPlainText;
