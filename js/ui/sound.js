// 効果音。音のファイルは使わず、Web Audio でその場で短い音を作る（外部ファイルなしの方針のため）。
// 教室で一斉に鳴らないよう、はじめは鳴らさない（ヘッダーの「音」で切りかえる）。
// 大事な順に「合格・不合格」「星」「称号」（結果画面）＞「選んだ・はずした・進んだ・押せない」（操作の手ごたえ）。
// 操作の音は小さく短くして、結果の音より目立たないようにする。

/** @type {AudioContext|null} */
let context = null;

/** 音を鳴らすかどうか。画面を描くたびに main.js が設定に合わせて変える */
let enabled = false;

/** @param {boolean} on */
export function setSoundEnabled(on) {
  enabled = Boolean(on);
}

/** 音を作る AudioContext（はじめて鳴らすときに作る。使えない環境では null） */
function audio() {
  if (context || !globalThis.AudioContext) return context;
  try {
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

/**
 * 鳴らしてよければ、止まっていた AudioContext を動かして返す。鳴らさないときは null。
 * （ブラウザは、操作の前に作った AudioContext を止めておくことがある）
 * @returns {AudioContext|null}
 */
function readyAudio() {
  if (!enabled) return null;
  const ctx = audio();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * 短い音を1つ鳴らす。
 * @param {number} frequency 高さ（Hz）
 * @param {number} start     今から何秒後か
 * @param {number} length    長さ（秒）
 * @param {OscillatorType} [type]
 * @param {number} [volume]
 */
function tone(frequency, start, length, type = 'triangle', volume = 0.18) {
  const ctx = audio();
  if (!ctx) return;
  const at = ctx.currentTime + start;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  // 立ち上がりは速く（アタック強め）、余韻は短く
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + length + 0.02);
}

/**
 * テスト結果の音。演出（screens.css の --reveal-step）と同じ間隔で、テスト1つずつ鳴らしてから星を鳴らす。
 * 音が「なし」のときは何もしない。
 * @param {{tests: {passed: boolean|null}[], stars: number, newTitle: boolean}} result
 * @param {number} step テスト1つあたりの秒数
 */
export function playResultSound({ tests, stars, newTitle }, step) {
  if (!readyAudio()) return;
  tests.forEach((test, index) => {
    const at = (index + 1) * step;
    if (test.passed) tone(880, at, 0.12);
    else tone(196, at, 0.25, 'square', 0.08);
  });
  const afterTests = (tests.length + 1) * step;
  const notes = [523, 659, 784];
  for (let index = 0; index < stars; index += 1) tone(notes[index], afterTests + index * 0.15, 0.3);
  if (newTitle) {
    const at = afterTests + stars * 0.15 + 0.2;
    [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, at + index * 0.08, 0.35, 'triangle', 0.14));
  }
}

/**
 * 操作の手ごたえの音（結果の音より小さく短く）。音が「なし」のときは何もしない。
 * select：カードを選んだ（ポッ）／ deselect：はずした（下がる音）／ step：次へ進んだ（ピコッ）
 * blocked：押せないものを押した（ブブッ）／ on：音を「あり」にした（鳴ることを確かめる音）
 * @param {'select'|'deselect'|'step'|'blocked'|'on'} kind
 */
export function playUiSound(kind) {
  if (!readyAudio()) return;
  switch (kind) {
    case 'select':
      tone(660, 0, 0.06, 'triangle', 0.12);
      tone(990, 0.04, 0.08, 'triangle', 0.1);
      break;
    case 'deselect':
      tone(660, 0, 0.06, 'triangle', 0.1);
      tone(440, 0.04, 0.08, 'triangle', 0.08);
      break;
    case 'step':
      tone(784, 0, 0.06, 'square', 0.05);
      tone(1175, 0.06, 0.1, 'square', 0.05);
      break;
    case 'blocked':
      tone(147, 0, 0.08, 'square', 0.06);
      tone(147, 0.11, 0.1, 'square', 0.06);
      break;
    case 'on':
      tone(523, 0, 0.08, 'triangle', 0.12);
      tone(784, 0.07, 0.12, 'triangle', 0.12);
      break;
    default:
      break;
  }
}
