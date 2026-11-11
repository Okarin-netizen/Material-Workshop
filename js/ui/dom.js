// 画面を組み立てるための小さな関数。
//
// h('button', { class: 'btn', onClick: fn }, '{依頼|いらい}ボード')
//   ・子に書いた文字列は、ふりがな記法を通して表示する（表示文はすべてこれを通る）。
//   ・生徒が入力した文字は、子に書かずに { text: 値 } で渡す（textContent で入れるので安全）。
//   ・innerHTML は使わない。

import { rubyNodes } from './components/ruby.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * HTML の要素を作る。
 * @param {string} tag
 * @param {Record<string, any>} [props]
 *   class, text（textContent）, onClick など on〜（イベント）, dataset, style（オブジェクト）, それ以外は属性
 * @param {...any} children 文字列・数・ノード・配列・null
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  applyProps(element, props);
  appendChildren(element, children);
  return element;
}

/**
 * SVG の要素を作る（製品の絵やレーダーチャートに使う）。
 * 子に文字列を書くと、そのまま textContent として入る（SVG の中ではふりがなを使わない）。
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param {...any} children
 * @returns {SVGElement}
 */
export function s(tag, attrs = {}, ...children) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null && value !== false) element.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

function applyProps(element, props) {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = String(value);
    else if (key === 'value') element.value = String(value);
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key === 'style') applyStyle(element, value);
    else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in element && typeof value !== 'string') element[key] = value;
    else element.setAttribute(key, value === true ? '' : String(value));
  }
}

/** CSS 変数（--name）は setProperty でないと入らないので分けて扱う */
function applyStyle(element, style) {
  for (const [name, value] of Object.entries(style)) {
    if (name.startsWith('--')) element.style.setProperty(name, value);
    else element.style[name] = value;
  }
}

function appendChildren(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    if (child instanceof Node) element.append(child);
    else element.append(textChild(String(child)));
  }
}

/**
 * 文字列の子を1つのノードにする。ふりがなを含むと複数のノードになるので <span> で包む
 * （親が flex のとき、ふりがなの部分だけが別の並びにならないようにするため）。
 */
function textChild(text) {
  const nodes = rubyNodes(text);
  if (nodes.length === 1) return nodes[0];
  const span = document.createElement('span');
  span.append(...nodes);
  return span;
}

/**
 * 数を「1,800」のように3けたごとに区切る。
 * @param {number} value
 */
export function formatNumber(value) {
  return Math.round(value).toLocaleString('ja-JP');
}

/**
 * テンプレートの {name} を値でうめる。ふりがな記法の {漢字|かんじ} はそのまま残す。
 * @param {string} template 例：'{予算|よさん} {budget}円'
 * @param {Record<string, string|number>} values
 */
export function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}
