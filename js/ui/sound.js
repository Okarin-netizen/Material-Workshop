// 効果音。音のファイルは使わず、Web Audio でその場で短い音を作る（外部ファイルなしの方針のため）。
// 教室で一斉に鳴らないよう、はじめは鳴らさない（ヘッダーの「音」で切りかえる）。
// 鳴らすのは、プレイヤーにとって大事な順に「合格・不合格」「星」「称号」だけ。

/** @type {AudioContext|null} */
let context = null;

function audio() {
  if (context) return context;
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
  } catch {
    context = null;
  }
  return context;
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
 * @param {{tests: {passed: boolean|null}[], stars: number, newTitle: boolean}} result
 * @param {number} step テスト1つあたりの秒数
 */
export function playResultSound({ tests, stars, newTitle }, step) {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
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
