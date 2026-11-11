// 「このアプリについて」のデータ（バージョン・変更履歴）を確かめる。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANGELOG, APP_VERSION, CREDITS } from '../js/data/about.js';
import { findMarkupProblem } from '../js/core/validateData.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const SEMVER = /^\d+\.\d+\.\d+$/;

const compare = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

test('表示するバージョンは package.json の version と同じ', () => {
  assert.equal(APP_VERSION, pkg.version);
});

test('変更履歴は新しい順で、書き方がそろっている', () => {
  assert.ok(CHANGELOG.length > 0);
  CHANGELOG.forEach((entry, index) => {
    assert.match(entry.version, SEMVER, entry.version);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, entry.date);
    assert.ok(entry.changes.length > 0, `${entry.version} に変わったことが書かれていません`);
    for (const line of entry.changes) assert.equal(findMarkupProblem(line), null, line);
    const older = CHANGELOG[index + 1];
    if (older) {
      assert.ok(compare(entry.version, older.version) > 0, `${entry.version} は ${older.version} より新しくしてください`);
      assert.ok(entry.date >= older.date, `${entry.version} の日付が ${older.version} より前です`);
    }
  });
});

test('作者名が書かれている', () => {
  assert.ok(CREDITS.author);
});
