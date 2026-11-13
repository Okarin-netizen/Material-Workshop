// ブラウザで実際にクリックして、依頼1〜8を最後まで通す E2E テスト。
//
// 使い方（リポジトリのいちばん上で）：
//   node tests/e2e/playthrough.e2e.cjs [スクリーンショットの保存先]
// Playwright（require('playwright')）が使える環境が必要。配信用のサーバー（python3 -m http.server）はこのスクリプトが起動する。
//
// 確かめること：
//   ・1366×650 で依頼1〜8を模範解でクリック操作して★3になる（誤答も1つ試す）
//   ・コンソールエラーがない
//   ・どの画面も横スクロールがない。設計台と結果は縦スクロールもない
//   ・カードの中で文字が切れていない（パネルの外にはみ出す要素がない）
//   ・ふりがな ON/OFF、再読み込み後の「つづきから」、キーボード操作
//   ・まとめ画面の印刷レイアウト（PDF が A4 1枚）
//   ・1024×600 とタッチ幅 800 で崩れない

const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..', '..');
const SHOTS = path.resolve(process.argv[2] ?? path.join(ROOT, '..', 'material-koubou-shots'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASE = `http://127.0.0.1:${PORT}/index.html`;

const problems = [];
const notes = [];
let shotCount = 0;

function problem(text) {
  problems.push(text);
  console.log(`  ✗ ${text}`);
}

function ok(text) {
  console.log(`  ✓ ${text}`);
}

async function loadAnswers() {
  const url = 'file://' + path.join(ROOT, 'tests', 'fixtures', 'answers.mjs');
  const requestsUrl = 'file://' + path.join(ROOT, 'js', 'data', 'requests.js');
  const [{ ANSWERS }, { REQUESTS }] = await Promise.all([import(url), import(requestsUrl)]);
  return { ANSWERS, REQUESTS };
}

function startServer() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  return server;
}

async function waitForServer(page) {
  for (let i = 0; i < 50; i += 1) {
    try {
      await page.goto(BASE);
      return;
    } catch {
      await page.waitForTimeout(100);
    }
  }
  throw new Error('サーバーに接続できませんでした');
}

async function shot(page, name) {
  shotCount += 1;
  const file = path.join(SHOTS, `${String(shotCount).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

/** 画面のはみ出しを調べる。fitHeight が true なら縦スクロールもないことを求める */
async function checkLayout(page, label, { fitHeight = false } = {}) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const hScroll = doc.scrollWidth > doc.clientWidth + 1;
    const main = document.querySelector('main');
    const vScroll = doc.scrollHeight > window.innerHeight + 1 || (main && main.scrollHeight > main.clientHeight + 1 && getComputedStyle(main).overflowY !== 'visible');
    // パネル（カード）の外に、中身がはみ出していないか
    const clipped = [];
    for (const panel of document.querySelectorAll('.panel, .page-card, .title-card, .sheet')) {
      const box = panel.getBoundingClientRect();
      for (const child of panel.querySelectorAll('*')) {
        if (child.closest('.panel__scroll') && child.closest('.panel__scroll') !== child) continue; // スクロール欄の中は別に調べる
        if (child instanceof SVGElement && child.tagName.toLowerCase() !== 'svg') continue; // 絵の中の図形は svg ごとに調べる
        const r = child.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || getComputedStyle(child).position === 'absolute') continue;
        if (r.right > box.right + 1 || r.left < box.left - 1 || r.bottom > box.bottom + 1) {
          clipped.push(`${child.tagName.toLowerCase()}.${String(child.className).split(' ')[0]}「${(child.textContent || '').trim().slice(0, 14)}」`);
        }
      }
    }
    // 文字が横に切れていないか（1行の要素で中身が箱より広い）
    const cut = [];
    for (const el of document.querySelectorAll('main button, main .choice-card__name, main .condition, main .meter__label, main .step-btn, header button')) {
      if (el.scrollWidth > el.clientWidth + 2) cut.push(`${el.tagName.toLowerCase()}「${el.textContent.trim().slice(0, 14)}」`);
    }
    // 中でスクロールが必要になっている欄
    const innerScroll = [...document.querySelectorAll('.panel__scroll, .panel')]
      .filter((el) => el.scrollHeight > el.clientHeight + 2)
      .map((el) => el.className.split(' ').slice(-1)[0]);
    return { hScroll, vScroll, clipped: [...new Set(clipped)].slice(0, 6), cut: [...new Set(cut)].slice(0, 6), innerScroll };
  });
  if (result.hScroll) problem(`${label}：横スクロールがある`);
  if (fitHeight && result.vScroll) problem(`${label}：縦スクロールがある`);
  if (result.clipped.length) problem(`${label}：パネルの外にはみ出し ${result.clipped.join(' / ')}`);
  if (result.cut.length) problem(`${label}：文字が横に切れている ${result.cut.join(' / ')}`);
  if (fitHeight && result.innerScroll.length) notes.push(`${label}：カードの中でスクロールが必要（${result.innerScroll.join(', ')}）`);
  return result;
}

const click = (page, key) => page.locator(`[data-focus-key="${key}"]`).click();

/** 答えのとおりにクリックして、テストまで進める */
async function playDesign(page, request, answer, { screenshots = false, viewportLabel = '', fitHeight = true, predict = 'pass', skipReveal = true } = {}) {
  await click(page, `request-${request.id}`);
  await page.locator('#choices-heading').waitFor();
  if (screenshots) {
    await shot(page, `${request.id}-step1${viewportLabel}`);
    await checkLayout(page, `依頼${request.number} ステップ1${viewportLabel}`, { fitHeight });
  }
  await click(page, 'next-step');

  // 材料：部品ごとに選ぶ（2つ目の部品へは「次の部品へ」ボタンで移る）
  for (const [index, part] of request.parts.entries()) {
    if (index > 0) await click(page, 'next-part');
    await click(page, `material-${part.id}-${answer.materials[part.id]}`);
  }
  if (screenshots) {
    await shot(page, `${request.id}-step2${viewportLabel}`);
    await checkLayout(page, `依頼${request.number} ステップ2${viewportLabel}`, { fitHeight });
  }
  await click(page, 'next-step');

  for (const [index, part] of request.parts.entries()) {
    if (index > 0) await click(page, 'next-part');
    await click(page, `process-${part.id}-${answer.processes[part.id]}`);
  }
  if (screenshots) {
    await shot(page, `${request.id}-step3${viewportLabel}`);
    await checkLayout(page, `依頼${request.number} ステップ3${viewportLabel}`, { fitHeight });
  }
  await click(page, 'next-step');

  for (const id of answer.reinforcements) await click(page, `reinforcement-${id}`);
  if (screenshots) {
    await shot(page, `${request.id}-step4${viewportLabel}`);
    await checkLayout(page, `依頼${request.number} ステップ4${viewportLabel}`, { fitHeight });
  }
  await click(page, predict === 'pass' ? 'run-test' : 'run-test-fail');
  await page.locator('#tests-heading').waitFor();
  // 結果の演出は、クリックすると飛ばせる（スクリーンショットとはみ出しの点検のため、すぐに全部出す）
  if (skipReveal) await page.locator('#tests-heading').click();
}

async function starsOnResult(page) {
  const label = await page.locator('.verdict .stars').getAttribute('aria-label');
  return Number(label.match(/\d/)[0]);
}

// ── 1366×650：依頼1〜8を通す ─────────────────

async function playAllRequests(browser, ANSWERS, REQUESTS) {
  console.log('\n[1366×650] 依頼1〜8をクリック操作で通す');
  const context = await browser.newContext({ viewport: { width: 1366, height: 650 } });
  const page = await context.newPage();
  watchConsole(page, '1366');
  await waitForServer(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await shot(page, 'title');
  await checkLayout(page, 'タイトル', { fitHeight: true });
  // はじめての「はじめる」は、依頼ボードを飛ばして依頼1が始まる
  await click(page, 'title-start');
  await page.locator('#choices-heading').waitFor();
  if (!(await page.locator('.stage-pill').textContent()).includes('1')) problem('はじめての「はじめる」で依頼1が始まらない');
  else ok('はじめての「はじめる」で依頼1がすぐ始まる');
  await shot(page, 'first-start');
  await click(page, 'header-board');
  await shot(page, 'board-start');
  await checkLayout(page, '依頼ボード（最初）');

  // 職人ランクは最初は開いていない
  if ((await page.locator('[data-focus-key="request-bookshelf"]').getAttribute('aria-disabled')) !== 'true') {
    problem('最初から職人ランクが開いている');
  } else ok('最初は職人ランクがロックされている');

  // 依頼3は、まず誤答（熱可塑性）を試してから模範解にする
  for (const request of REQUESTS) {
    const answers = ANSWERS[request.id];
    const answer = answers.model;
    const detailed = request.id === 'parkBench' || request.id === 'stationBench' || request.id === 'drinkBottle';
    if (request.id === 'panHandle') {
      const wrong = answers.wrong[0];
      // 効果音をオンにして、「不合格だと思う」と予想し、演出を最後まで見る
      await click(page, 'header-sound');
      await playDesign(page, request, wrong, { predict: 'fail', skipReveal: false });
      await shot(page, `${request.id}-result-revealing`);
      await page.waitForTimeout(2200);
      if (!(await page.locator('.result-note--hit').count())) problem('「不合格だと思う」の予想が当たったと出ない');
      else ok('効果音オン・「不合格だと思う」の予想・演出を最後まで表示');
      await click(page, 'header-sound');
      const stars = await starsOnResult(page);
      const failedText = await page.locator('.test-row--fail').first().textContent();
      if (stars !== 0 || !failedText.includes('軟化')) problem(`依頼3の誤答が不合格にならない（★${stars}）`);
      else ok(`依頼3 誤答「${wrong.label}」→ 不合格（理由に「軟化」）`);
      await shot(page, `${request.id}-result-wrong`);
      await checkLayout(page, '依頼3 結果（不合格）', { fitHeight: true });
      // 「設計をやり直す」で材料からやり直せる
      await click(page, 'retry');
      await page.locator('[data-focus-key="material-handle-phenol"]').waitFor();
      await click(page, 'header-board');
    }

    await playDesign(page, request, answer, { screenshots: detailed });
    const stars = await starsOnResult(page);
    if (stars !== 3) problem(`依頼${request.number}「${answer.label}」が★${stars}`);
    else ok(`依頼${request.number} 模範解「${answer.label}」→ ★3`);

    if (request.id === 'parkBench') {
      const hit = await page.locator('.result-note--hit').count();
      if (!hit) problem('予想（合格）が当たったと結果に出ない');
      else ok('テスト前の予想が当たったと結果に出る');
      // 演出が終わったあと、描き直しても演出をくり返さない
      await page.locator('#reason-input').focus();
      await click(page, 'header-furigana');
      await click(page, 'header-furigana');
      if (await page.locator('.is-revealing').count()) problem('描き直すと結果の演出がくり返される');
      else ok('結果の演出はテスト直後の1回だけ');
    }
    await page.locator('#reason-input').fill(`依頼${request.number}の理由：教科書の特性をもとに選んだ`);
    await shot(page, `${request.id}-result`);
    await checkLayout(page, `依頼${request.number} 結果`, { fitHeight: true });
    await click(page, 'to-board');
  }

  await shot(page, 'board-all-cleared');
  await checkLayout(page, '依頼ボード（全達成）');

  // 惜しい答え（★1〜2）も1つクリックで確かめる
  const near = ANSWERS.bookshelf.near[0];
  await playDesign(page, REQUESTS.find((r) => r.id === 'bookshelf'), near);
  const nearStars = await starsOnResult(page);
  if (nearStars < 1 || nearStars > 2) problem(`惜しい答え「${near.label}」が★${nearStars}`);
  else ok(`惜しい答え「${near.label}」→ ★${nearStars}`);
  const goal = (await page.locator('.result-note--goal').textContent()) ?? '';
  if (!goal.includes('あと')) problem(`★${nearStars}なのに「★3まであと○点」が出ない：${goal}`);
  else ok(`次の目標が出る（${goal.replace(/\s+/g, '')}）`);
  await click(page, 'to-board');

  await checkFurigana(page);
  await checkZukan(page);
  await checkResume(page);
  await checkKeyboard(page);
  await checkSummaryPrint(page);
  await context.close();
}

async function checkFurigana(page) {
  console.log('\n[ふりがな]');
  const before = await page.locator('rt').count();
  await click(page, 'header-furigana');
  const off = await page.locator('rt').count();
  const pressed = await page.locator('[data-focus-key="header-furigana"]').getAttribute('aria-pressed');
  await shot(page, 'board-furigana-off');
  await click(page, 'header-furigana');
  const on = await page.locator('rt').count();
  if (before > 0 && off === 0 && on === before && pressed === 'false') ok(`ふりがな ON ${before}個 → OFF 0個 → ON ${on}個`);
  else problem(`ふりがなの切りかえがおかしい（${before} → ${off} → ${on}, aria-pressed=${pressed}）`);
}

async function checkZukan(page) {
  console.log('\n[図鑑]');
  await click(page, 'header-zukan');
  await click(page, 'zukan-materials-stainless');
  await shot(page, 'zukan');
  await checkLayout(page, '図鑑');
  const text = await page.locator('.zukan-detail').textContent();
  if (text.includes('クロム') && text.includes('p.34')) ok('図鑑でステンレスの説明と教科書ページが読める');
  else problem('図鑑の説明が出ない');
  const unknown = await page.locator('.zukan-entry.is-unknown').count();
  notes.push(`図鑑：全依頼の模範解のあとで未発見 ${unknown} 件`);
  await click(page, 'zukan-back');
}

async function checkResume(page) {
  console.log('\n[再読み込み → つづきから]');
  await click(page, 'header-board');
  await click(page, 'request-stationBench');
  await click(page, 'next-step');
  await click(page, 'material-seat-glulam');
  await page.reload();
  const resume = page.locator('[data-focus-key="title-resume"]');
  if ((await resume.getAttribute('aria-disabled')) === 'true') problem('再読み込み後に「つづきから」が押せない');
  await resume.click();
  const selected = await page.locator('[data-focus-key="material-seat-glulam"]').getAttribute('aria-pressed');
  const stars = await page.evaluate(() => JSON.parse(localStorage.getItem('material-koubou-v1')).records.kitchenKnife.bestStars);
  if (selected === 'true' && stars === 3) ok('つづきから：駅のベンチの材料選びの途中に戻り、記録（★）も残っている');
  else problem(`つづきからで状態が戻らない（集成材 ${selected}, 依頼8の星 ${stars}）`);
  const savedName = await page.evaluate(() => localStorage.getItem('material-koubou-v1').includes('name'));
  notes.push(`保存データに "name" という文字列：${savedName ? 'あり（要確認）' : 'なし'}`);
  await click(page, 'header-board');
}

async function checkKeyboard(page) {
  console.log('\n[キーボード操作]');
  await page.goto(BASE);
  // Tab で「はじめる」まで進み、Enter で依頼ボードへ
  let reached = false;
  for (let i = 0; i < 12 && !reached; i += 1) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.dataset?.focusKey === 'title-start');
  }
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  await page.keyboard.press('Enter');
  const onBoard = await page.locator('h1.page-title').textContent();
  // 依頼カードに Tab で移り、Space で開く
  let onCard = false;
  for (let i = 0; i < 20 && !onCard; i += 1) {
    await page.keyboard.press('Tab');
    onCard = await page.evaluate(() => document.activeElement?.dataset?.focusKey === 'request-parkBench');
  }
  await page.keyboard.press('Space');
  const inWorkshop = await page.locator('#choices-heading').count();
  if (reached && outline !== 'none' && onBoard.includes('ボード') && onCard && inWorkshop) ok('Tab で移動し Enter / Space で操作できる（フォーカスの枠あり）');
  else problem(`キーボード操作に問題（はじめる:${reached} 枠:${outline} 依頼カード:${onCard} 作業画面:${inWorkshop}）`);
  // 設計中でも Enter で材料を選べる
  await page.keyboard.press('Tab');
  await page.locator('[data-focus-key="next-step"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-focus-key="material-seat-sugi"]').focus();
  await page.keyboard.press('Enter');
  const picked = await page.locator('[data-focus-key="material-seat-sugi"]').getAttribute('aria-pressed');
  const stillFocused = await page.evaluate(() => document.activeElement?.dataset?.focusKey);
  if (picked === 'true' && stillFocused === 'material-seat-sugi') ok('Enter で材料カードを選べ、描き直してもフォーカスが残る');
  else problem(`キーボードで材料を選べない（${picked}, フォーカス ${stillFocused}）`);
  await click(page, 'header-board');
}

async function checkSummaryPrint(page) {
  console.log('\n[まとめ・印刷]');
  await click(page, 'header-summary');
  await page.locator('[data-focus-key="identity-year"]').fill('1');
  await page.locator('[data-focus-key="identity-klass"]').fill('2');
  await page.locator('[data-focus-key="identity-number"]').fill('15');
  await page.locator('[data-focus-key="identity-name"]').fill('技術 花子');
  await page.locator('#reflection-input').fill('同じベンチでも、使う場所によって合う材料が違うことがわかった。'.repeat(3));
  await shot(page, 'summary');
  await checkLayout(page, 'まとめ（画面）');
  const saved = await page.evaluate(() => localStorage.getItem('material-koubou-v1'));
  if (saved.includes('花子')) problem('名前が localStorage に保存されている');
  else ok('名前は保存されていない');
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: path.join(SHOTS, `${String(++shotCount).padStart(2, '0')}-summary-print.png`), fullPage: true });
  await page.emulateMedia({ media: 'screen' });
  const pdfPath = path.join(SHOTS, 'summary.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', preferCSSPageSize: true, printBackground: true });
  const pages = (fs.readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages === 1) ok('まとめの PDF は A4 1枚');
  else problem(`まとめの PDF が ${pages} 枚になった`);
}

// ── ほかの画面の大きさ ───────────────────────

async function checkOtherSizes(browser, ANSWERS, REQUESTS, { width, height, touch, label }) {
  console.log(`\n[${label}]`);
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  watchConsole(page, label);
  await waitForServer(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const fit = width >= 1024;
  await shot(page, `title-${label}`);
  await checkLayout(page, `${label} タイトル`, { fitHeight: fit });
  await click(page, 'title-start');
  await click(page, 'header-board');
  await click(page, 'unlock-all');
  await shot(page, `board-${label}`);
  await checkLayout(page, `${label} 依頼ボード`);
  for (const id of ['stationBench', 'kitchenKnife', 'drinkBottle']) {
    const request = REQUESTS.find((r) => r.id === id);
    await playDesign(page, request, ANSWERS[id].model, { screenshots: id === 'stationBench', viewportLabel: `-${label}`, fitHeight: fit });
    await shot(page, `${id}-result-${label}`);
    await checkLayout(page, `${label} 依頼${request.number} 結果`, { fitHeight: fit });
    await click(page, 'to-board');
  }
  await click(page, 'header-zukan');
  await click(page, 'zukan-materials-sugi');
  await shot(page, `zukan-${label}`);
  await checkLayout(page, `${label} 図鑑`);
  await click(page, 'header-summary');
  await shot(page, `summary-${label}`);
  await checkLayout(page, `${label} まとめ`);
  await click(page, 'header-board');
  await page.locator('[data-focus-key="board-reset"]').click();
  await shot(page, `reset-dialog-${label}`);
  await page.getByRole('button', { name: 'やめる' }).click();
  ok(`${label}：画面を一通り表示`);
  await context.close();
}

function watchConsole(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') problem(`コンソールエラー（${label}）：${message.text()}`);
  });
  page.on('pageerror', (error) => problem(`ページのエラー（${label}）：${error.message}`));
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const { ANSWERS, REQUESTS } = await loadAnswers();
  const server = startServer();
  const browser = await chromium.launch();
  try {
    await playAllRequests(browser, ANSWERS, REQUESTS);
    await checkOtherSizes(browser, ANSWERS, REQUESTS, { width: 1024, height: 600, touch: false, label: '1024x600' });
    await checkOtherSizes(browser, ANSWERS, REQUESTS, { width: 800, height: 1100, touch: true, label: 'touch800' });
  } catch (error) {
    problem(`実行中のエラー：${error.message}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\nスクリーンショット ${shotCount} 枚 → ${SHOTS}`);
  if (notes.length) console.log(`メモ:\n  ${notes.join('\n  ')}`);
  console.log(problems.length ? `\n問題 ${problems.length} 件` : '\n問題なし');
  process.exit(problems.length ? 1 : 0);
})();
