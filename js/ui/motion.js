// 「動きを減らす」設定（OS のアクセシビリティ設定）を見る。juice.js と結果画面の演出で使う。

/** 動きを減らす設定になっているか */
export function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
