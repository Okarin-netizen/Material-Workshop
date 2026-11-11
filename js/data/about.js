// 「このアプリについて」の画面に出す、作者・バージョン・変更履歴。
// 新しい版を出すときは CHANGELOG のいちばん上に1つ追加し、package.json の version もそろえる
// （そろっていないと node --test が失敗する）。表示しているバージョンは CHANGELOG の先頭のもの。

/**
 * @typedef {Object} ChangelogEntry
 * @property {string} version 例 '1.1.0'
 * @property {string} date    'YYYY-MM-DD'
 * @property {string[]} changes 変わったこと（ふりがな記法が使える）
 */

/** 作者・クレジット */
export const CREDITS = {
  author: '{技術科|ぎじゅつか}　{岡田|おかだ}',
};

/** @type {ChangelogEntry[]} 新しい順 */
export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-11-11',
    changes: [
      '「このアプリについて」の{画面|がめん}を{追加|ついか}。バージョン・{作者|さくしゃ}・{変更履歴|へんこうりれき}が{見|み}られるようになりました。',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-11',
    changes: [
      '{最初|さいしょ}の{公開|こうかい}。{依頼|いらい}8{件|けん}・{材料|ざいりょう}13{種類|しゅるい}・{加工方法|かこうほうほう}8{種類|しゅるい}。',
      '{材料図鑑|ざいりょうずかん}と、A4 1{枚|まい}に{印刷|いんさつ}できる「まとめ」の{画面|がめん}。',
    ],
  },
];

/** 今のバージョン */
export const APP_VERSION = CHANGELOG[0].version;
