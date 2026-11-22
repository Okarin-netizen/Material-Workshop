// 画面の行き来の履歴（「もどる」の行き先）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rememberScreen } from '../js/core/navigation.js';

/** 画面を順に移ったあとの履歴 */
function walk(screens) {
  let history = [];
  for (let i = 1; i < screens.length; i += 1) history = rememberScreen(history, screens[i - 1], screens[i]);
  return history;
}

test('進んだ画面は履歴に積まれ、もどると1つ前になる', () => {
  assert.deepEqual(walk(['title', 'board', 'workshop', 'zukan']), ['title', 'board', 'workshop']);
});

test('図鑑 → まとめ → 図鑑 と行き来しても、もどる先は図鑑の前の画面になる', () => {
  // 以前は「もどる」が図鑑とまとめを行き来し続け、依頼の画面に戻れなかった
  assert.deepEqual(walk(['title', 'board', 'workshop', 'zukan', 'summary', 'zukan']), ['title', 'board', 'workshop']);
});

test('同じ画面を開き直しても履歴は変わらない', () => {
  assert.deepEqual(rememberScreen(['title'], 'board', 'board'), ['title']);
});

test('タイトルに戻ると履歴は空になる', () => {
  assert.deepEqual(walk(['title', 'board', 'workshop', 'title']), []);
});
