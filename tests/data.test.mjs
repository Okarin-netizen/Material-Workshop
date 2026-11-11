// データの点検（validateData）と、ふりがな記法の読み取り（rubyParse）を確かめる。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData, findMarkupProblem } from '../js/core/validateData.js';
import { parseMarkup, toPlainText } from '../js/core/rubyParse.js';
import { buildCatalog } from '../js/core/rules.js';
import { UI } from '../js/data/uiText.js';
import { DATA, CATALOG } from './helpers.mjs';

const ART_NAMES = ['parkBench', 'handrail', 'panHandle', 'bookshelf', 'stationBench', 'drinkBottle', 'bicycleFrame', 'kitchenKnife'];

test('今のデータには問題がない', () => {
  assert.deepEqual(validateData({ ...DATA, uiText: [UI] }, CATALOG, { artNames: ART_NAMES }), []);
});

test('存在しない材料IDを書くと見つかる', () => {
  const requests = structuredClone(DATA.requests);
  requests[0].parts[0].materialIds.push('mithril');
  const data = { ...DATA, requests };
  const problems = validateData(data, buildCatalog(data));
  assert.ok(problems.some((text) => text.includes('mithril')), problems.join('\n'));
});

test('テストの部品名をまちがえると見つかる', () => {
  const requests = structuredClone(DATA.requests);
  requests[0].tests[0].check.part = 'zabuton';
  const data = { ...DATA, requests };
  assert.ok(validateData(data, buildCatalog(data)).some((text) => text.includes('zabuton')));
});

test('ふりがなの記法がこわれていると見つかる', () => {
  assert.equal(findMarkupProblem('{木材|もくざい}と{金属|きんぞく}'), null);
  assert.equal(findMarkupProblem('{予算|よさん} {budget}円'), null);
  assert.ok(findMarkupProblem('{木材|もくざい'));
  assert.ok(findMarkupProblem('{木材}'));
  assert.ok(findMarkupProblem('*強調が閉じていない'));
});

test('ふりがな記法と強調を読み取る', () => {
  assert.deepEqual(parseMarkup('{鋼|こう}は*{硬|かた}い*'), [
    { type: 'ruby', text: '鋼', reading: 'こう', emphasis: false },
    { type: 'text', text: 'は', emphasis: false },
    { type: 'ruby', text: '硬', reading: 'かた', emphasis: true },
    { type: 'text', text: 'い', emphasis: true },
  ]);
  assert.equal(toPlainText('{焼|や}き{入|い}れ'), '焼き入れ');
});
