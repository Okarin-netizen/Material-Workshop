// 全依頼について「模範解は★3」「典型的な誤答は不合格（決まったテストで）」「惜しい答えは★1〜2」を確かめる。

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDesign, costMetric, starsFor, totalScore, pickWhatIf } from '../js/core/scoring.js';
import { processAvailability, pruneDesign, reinforcementAvailability } from '../js/core/rules.js';
import { ANSWERS } from './fixtures/answers.mjs';
import { CATALOG, DATA, requestById, designOf } from './helpers.mjs';

test('すべての依頼に模範解・誤答・惜しい答えが用意されている', () => {
  for (const request of DATA.requests) {
    const answers = ANSWERS[request.id];
    assert.ok(answers, `${request.id} の答えがない`);
    assert.ok(answers.wrong.length >= 1, `${request.id} の誤答がない`);
    assert.ok(answers.near.length >= 1, `${request.id} の惜しい答えがない`);
  }
});

for (const request of DATA.requests) {
  const answers = ANSWERS[request.id];
  describe(`依頼${request.number}（${request.id}）`, () => {
    test(`模範解「${answers.model.label}」は全テスト合格で★3`, () => {
      const result = evaluateDesign(request, designOf(answers.model), CATALOG);
      const failed = result.tests.filter((item) => !item.passed).map((item) => item.id);
      assert.deepEqual(failed, [], '不合格のテストがある');
      assert.equal(result.stars, 3, `得点 ${result.score}`);
    });

    for (const wrong of answers.wrong) {
      test(`誤答「${wrong.label}」は ${wrong.failTests.join('・')} で不合格`, () => {
        const result = evaluateDesign(request, designOf(wrong), CATALOG);
        assert.equal(result.allPassed, false);
        assert.equal(result.stars, 0);
        const failed = result.tests.filter((item) => item.passed === false).map((item) => item.id);
        for (const id of wrong.failTests) assert.ok(failed.includes(id), `「${id}」が不合格になっていない（不合格：${failed.join(',')}）`);
        // 不合格には必ず理由の文がある
        for (const item of result.tests.filter((t) => t.passed === false)) assert.ok(item.reason, `${item.id} の理由がない`);
      });
    }

    for (const near of answers.near) {
      test(`惜しい答え「${near.label}」は★${near.stars.join('か★')}`, () => {
        const result = evaluateDesign(request, designOf(near), CATALOG);
        assert.equal(result.allPassed, true, '全テスト合格のはず');
        assert.ok(near.stars.includes(result.stars), `★${result.stars}（${result.score}点）`);
      });
    }

    for (const alt of answers.alt ?? []) {
      test(`別の道「${alt.label}」でも★3`, () => {
        const result = evaluateDesign(request, designOf(alt), CATALOG);
        assert.equal(result.stars, 3, `得点 ${result.score}`);
      });
    }

    test('答えの設計は、ゲームの中で実際に選べる組み合わせになっている', () => {
      for (const answer of [answers.model, ...answers.wrong, ...answers.near, ...(answers.alt ?? [])]) {
        const design = designOf(answer);
        assert.deepEqual(pruneDesign(request, design, CATALOG), design, `「${answer.label}」に選べないものがある`);
      }
    });
  });
}

describe('不合格の理由は選んだものに合わせて変わる', () => {
  test('依頼3：熱可塑性プラスチックは「軟化して溶ける」と説明される', () => {
    const request = requestById('panHandle');
    const result = evaluateDesign(request, { materials: { handle: 'polypropylene' }, processes: { handle: 'cast' }, reinforcements: [] }, CATALOG);
    assert.match(result.tests.find((t) => t.id === 'heat').reason, /軟化/);
  });

  test('依頼8：焼き入れだけだと「もろい」と説明される', () => {
    const request = requestById('kitchenKnife');
    const result = evaluateDesign(request, { materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: ['quench'] }, CATALOG);
    assert.match(result.tests.find((t) => t.id === 'chip').reason, /もろい/);
  });
});

describe('加工方法と工夫のきまり', () => {
  test('木材は型に流し込めず、理由が出る', () => {
    const result = processAvailability(CATALOG.processes.get('cast'), CATALOG.materials.get('sugi'));
    assert.equal(result.ok, false);
    assert.match(result.reason, /溶|と/);
  });

  test('熱硬化性プラスチックは加熱して曲げられない', () => {
    assert.equal(processAvailability(CATALOG.processes.get('heatBend'), CATALOG.materials.get('phenol')).ok, false);
    assert.equal(processAvailability(CATALOG.processes.get('heatBend'), CATALOG.materials.get('acrylic')).ok, true);
  });

  test('焼き戻しは焼き入れのあとでないと選べず、焼き入れを外すといっしょに外れる', () => {
    const request = requestById('kitchenKnife');
    const base = { materials: { blade: 'steel' }, processes: { blade: 'forge' }, reinforcements: [] };
    assert.equal(reinforcementAvailability(request, base, 'temper', CATALOG).ok, false);
    const both = { ...base, reinforcements: ['quench', 'temper'] };
    assert.equal(reinforcementAvailability(request, { ...base, reinforcements: ['quench'] }, 'temper', CATALOG).ok, true);
    assert.deepEqual(pruneDesign(request, { ...both, reinforcements: ['temper'] }, CATALOG).reinforcements, []);
  });

  test('鋼でない刃には熱処理を選べない（材料を変えると外れる）', () => {
    const request = requestById('kitchenKnife');
    const design = { materials: { blade: 'aluminumAlloy' }, processes: { blade: 'forge' }, reinforcements: ['quench', 'temper'] };
    assert.deepEqual(pruneDesign(request, design, CATALOG).reinforcements, []);
  });

  test('材料を変えて加工方法が合わなくなったら、加工方法は外れる', () => {
    const request = requestById('parkBench');
    const design = { materials: { seat: 'sugi' }, processes: { seat: 'heatBend' }, reinforcements: [] };
    assert.equal(pruneDesign(request, design, CATALOG).processes.seat, null);
  });
});

describe('得点の計算', () => {
  test('コストの指標：安い範囲は満点、予算ちょうどで60点、予算オーバーは0点', () => {
    assert.equal(costMetric(500, 1000), 100);
    assert.equal(costMetric(1000, 1000), 60);
    assert.equal(costMetric(1001, 1000), 0);
  });

  test('星：不合格なら0、80点で★2、85点で★3', () => {
    assert.equal(starsFor(false, 99), 0);
    assert.equal(starsFor(true, 79), 1);
    assert.equal(starsFor(true, 80), 2);
    assert.equal(starsFor(true, 85), 3);
  });

  test('得点は重みつき平均', () => {
    assert.equal(totalScore({ strength: 100, durability: 0 }, { strength: 50, durability: 50 }), 50);
  });

  test('設計の途中（材料が未選択）では、テストは「まだわからない」', () => {
    const request = requestById('stationBench');
    const result = evaluateDesign(request, { materials: { seat: 'sugi', frame: null }, processes: { seat: null, frame: null }, reinforcements: [] }, CATALOG);
    assert.equal(result.complete, false);
    assert.equal(result.tests.find((t) => t.id === 'rust').passed, null);
  });

  test('「もし別の材料だったら」は今の設計と違う材料の文を選ぶ', () => {
    const request = requestById('stationBench');
    const item = pickWhatIf(request, { materials: { seat: 'sugi', frame: 'stainless' }, processes: {}, reinforcements: [] });
    assert.equal(item.material, 'steel');
  });
});

describe('加工方法の選び方で得点が変わる', () => {
  // 使える加工方法が2つ以上ある部品では、模範解の材料のまま加工だけを変えると5点以上の差が出る
  // （どれを選んでも同じ点だと、加工方法を選ぶ意味がなくなるため）
  for (const request of DATA.requests) {
    const model = designOf(ANSWERS[request.id].model);
    for (const part of request.parts) {
      const material = CATALOG.materials.get(model.materials[part.id]);
      const usable = part.processIds.filter((id) => processAvailability(CATALOG.processes.get(id), material).ok);
      if (usable.length < 2) continue;
      test(`依頼${request.number}の${part.id}（${material.id}）`, () => {
        const scores = usable.map((id) => evaluateDesign(request, { ...model, processes: { ...model.processes, [part.id]: id } }, CATALOG).score);
        assert.ok(Math.max(...scores) - Math.min(...scores) >= 5, `得点：${scores.join(', ')}`);
      });
    }
  }
});
