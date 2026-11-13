// 依頼（ステージ）のデータ。
// 新しい依頼を作るときは、いちばん上の「公園のベンチの座面」をまねして書き足す。
// 書き足したら、ブラウザで開いたときに画面上部に赤い「データの点検」が出ないか確かめる
// （存在しない材料IDなどを書くと、validateData.js がそこで知らせる）。
// tests/fixtures/answers.mjs に模範解と誤答を書けば、node --test で星の数も確かめられる。

/**
 * @typedef {Object} ClientLook 依頼人の絵
 * @property {string} skin   肌の色
 * @property {string} hair   髪の色
 * @property {string} outfit 服の色
 * @property {'none'|'cap'|'chef'|'band'|'bun'|'glasses'} hat 帽子など
 */

/**
 * @typedef {Object} RequestPart 部品
 * @property {string} id
 * @property {string} name
 * @property {number} size  大きさ（材料費と加工費にかける数）
 * @property {string[]} materialIds 選べる材料（4つまでがおすすめ。カードが画面に収まるため）
 * @property {string[]} processIds  選べる加工方法
 * @property {Record<string, string>} [materialNotes] 材料カードに足す一言（例：「瓶になる」）
 * @property {Record<string, Partial<import('./materials.js').Traits>>} [traitOverrides]
 *           この依頼でだけ材料の特性を上書きする（例：缶は1度開けたら閉められない）
 * @property {Record<string, Partial<Record<import('./traits.js').MetricId, number>>>} [processMetricEffects]
 *           この依頼でだけ、加工方法が指標に与える増減
 * @property {Record<string, {good?: string, bad?: string}>} [processNotes]
 *           この依頼での加工方法のよい点（◯）と注意点（△）。加工カードに出す。
 *           processMetricEffects で点数に差をつけたら、その理由をここに書く
 */

/**
 * @typedef {Object} RequestReinforcement 依頼で選べる工夫
 * @property {string} id      reinforcements.js の id
 * @property {string[]} [parts] 効き目がある部品（partEffects を持つ工夫で使う）
 * @property {string} [detail]  この依頼での具体的なやり方（カードに出す）
 * @property {number} [cost]    費用を上書き
 * @property {Partial<import('./materials.js').Traits>} [traitEffects] partEffects を上書き
 * @property {Partial<Record<import('./traits.js').MetricId, number>>} [metricEffects] 指標を直接増減
 */

/**
 * @typedef {Object} TestCheck テストの判定（どれか1つの書き方）
 * @property {string} [part]    部品の特性を調べる：{ part: 'seat', trait: 'insulation', min: 4 }
 * @property {string} [trait]
 * @property {string} [product] 製品全体の特性を調べる：{ product: 'structure', min: 4 }
 * @property {string} [metric]  指標を調べる：{ metric: 'strength', min: 60 }
 * @property {true} [budget]    予算内かを調べる：{ budget: true }
 * @property {number} [min]     この値以上なら合格
 */

/**
 * @typedef {Object} FailCondition 不合格の理由を選ぶ条件（書いたものすべてに当てはまるとき）
 * @property {string} [part]        調べる部品（省略するとテストの part）
 * @property {string[]} [materials] その部品の材料がこのどれか
 * @property {string[]} [kinds]     その部品の材料の種類がこのどれか
 * @property {string[]} [has]       この工夫をすべて選んでいる
 * @property {string[]} [lacks]     この工夫をどれも選んでいない
 */

/**
 * @typedef {Object} RequestTest 必須条件（テスト）
 * @property {string} id
 * @property {string} name       テスト名（結果画面）
 * @property {string} condition  依頼カードのチェックリストに出す条件
 * @property {TestCheck} check
 * @property {string} pass       合格のときの説明
 * @property {string} fail       不合格のときの説明（failReasons に当てはまらないとき）
 * @property {{when: FailCondition, text: string}[]} [failReasons] 上から順に調べ、最初に当てはまった文を出す
 * @property {string} page       教科書のページ
 */

/**
 * @typedef {Object} MetricTerm 指標の計算に使う項
 * @property {string} [part]    部品の特性を使う
 * @property {string} [trait]
 * @property {string} [product] 製品全体の特性を使う
 * @property {number} [weight]  重み（省略すると 1）
 */

/**
 * @typedef {Object} WhatIf 「もし別の材料だったら」
 * @property {string} [part]     材料についての文のとき：部品
 * @property {string} [material] その部品をこの材料にしていなかったときに出す
 * @property {string} [without]  工夫についての文のとき：この工夫を選んでいたときに「なかったら」として出す
 * @property {string} text
 */

/**
 * @typedef {Object} GameRequest 依頼
 * @property {string} id
 * @property {number} number     依頼の番号（表示用）
 * @property {string} rank       ranks の id
 * @property {string} title
 * @property {{name: string, look: ClientLook}} client
 * @property {string} message    依頼人のせりふ（*強調* が使える）
 * @property {number} budget     予算（円・ゲーム用の目安）
 * @property {string} art        製品の絵の種類（ui/art/ にある絵の名前）
 * @property {number} baseStructure 工夫をしないときの「構造の強さ」（0〜5）
 * @property {RequestPart[]} parts 部品（1〜2個）
 * @property {RequestReinforcement[]} reinforcements
 * @property {RequestTest[]} tests
 * @property {Record<string, MetricTerm[]>} metrics strength / durability / usability / environment の計算式（cost は自動）
 * @property {Record<import('./traits.js').MetricId, number>} scoreWeights 得点の重み（合計 100）
 * @property {{text: string, page: string}} hint
 * @property {{failed: string, star1: string, star2: string, star3: string}} comments 依頼人のコメント
 * @property {{title: string, text: string, page: string}[]} learningPoints 学びのポイント
 * @property {WhatIf[]} whatIf
 */

/** 工房のランク。依頼ボードでこの順に並ぶ */
export const RANKS = [
  { id: 'apprentice', name: '{見習|みなら}い' },
  { id: 'craftsman', name: '{職人|しょくにん}' },
  { id: 'master', name: '{名人|めいじん}' },
];

/** どの依頼にもある「予算内」のテスト。tests の最後に入れる */
const BUDGET_TEST = {
  id: 'budget',
  name: '{予算|よさん}チェック',
  condition: '{予算|よさん}の{範囲内|はんいない}でつくる',
  check: { budget: true },
  pass: '{予算|よさん}の{範囲内|はんいない}におさまった',
  fail: '{予算|よさん}をこえてしまった。{材料|ざいりょう}や{工夫|くふう}を{見直|みなお}そう',
  page: 'p.30',
};

/** @type {GameRequest[]} */
export const REQUESTS = [
  // ───────────────────────────────────────────────
  // 依頼1：公園のベンチの座面（見本としてくわしくコメントをつけている）
  // ねらい：木材は温かい感じがし、切ったり削ったりしやすい（p.30〜31）
  // ───────────────────────────────────────────────
  {
    id: 'parkBench', // 英数字。ほかの依頼と重ならない名前にする
    number: 1, // 依頼ボードに出る番号
    rank: 'apprentice', // RANKS の id（見習い／職人／名人）
    title: '{公園|こうえん}のベンチの{座面|ざめん}',
    client: {
      name: '{公園|こうえん}の{管理人|かんりにん}さん',
      // 依頼人の絵の色。hat は none / cap / chef / band / bun / glasses から選ぶ
      look: { skin: '#ffd9b0', hair: '#6b4a2b', outfit: '#4f9a4a', hat: 'cap' },
    },
    // せりふ。*〜* で囲むと強調（赤い太字）になる
    message:
      '{公園|こうえん}のベンチの{座面|ざめん}を、{地域|ちいき}の{人|ひと}たちと{手|て}づくりで{直|なお}したいの。' +
      '*{切|き}ったり{削|けず}ったりしやすく*、{冬|ふゆ}に{座|すわ}っても*{冷|つめ}たく{感|かん}じにくい*{材料|ざいりょう}がいいな。' +
      '{雨|あめ}にもぬれる{場所|ばしょ}よ。',
    budget: 4000, // 予算（円）
    art: 'parkBench', // 製品の絵（js/ui/art/index.js の ART_DRAWERS の名前）
    baseStructure: 3, // 工夫なしの構造の強さ（0〜5）。この依頼では脚は今のものを使うので中くらい
    parts: [
      {
        id: 'seat',
        name: '{座面|ざめん}',
        size: 4, // 材料費 = 材料の price × size、加工費 = 加工の costPerUnit × size
        materialIds: ['sugi', 'shirakashi', 'steel', 'acrylic'],
        processIds: ['sawPlane', 'cast', 'heatBend'],
      },
    ],
    reinforcements: [
      { id: 'paint', parts: ['seat'], detail: '{座面|ざめん}に{屋外用|おくがいよう}の{塗料|とりょう}をぬる' },
      { id: 'crossSection', parts: ['seat'], detail: '{座面|ざめん}を{支|ささ}える{角材|かくざい}を、{荷重|かじゅう}の{方向|ほうこう}に{高|たか}くなる{向|む}きに{使|つか}う' },
    ],
    // テスト＝必須条件。全部合格で依頼達成（★1以上）
    tests: [
      {
        id: 'warm',
        name: 'さわり{心地|ごこち}テスト（{冬|ふゆ}の{朝|あさ}）',
        condition: '{座|すわ}っても{冷|つめ}たく{感|かん}じにくい',
        check: { part: 'seat', trait: 'insulation', min: 4 }, // 座面の「熱の伝わりにくさ」が4以上
        pass: '{木材|もくざい}の{座面|ざめん}は、さわっても{冷|つめ}たく{感|かん}じにくい',
        fail: 'さわると{冷|つめ}たく{感|かん}じた',
        // 不合格の理由を、選んだ材料に合わせて出し分ける（上から順に調べる）
        failReasons: [
          { when: { kinds: ['metal', 'alloy'] }, text: '{金属|きんぞく}は{熱|ねつ}をよく{通|とお}すので、{冬|ふゆ}は{座|すわ}ると{冷|つめ}たく{感|かん}じる' },
          { when: { kinds: ['thermoplastic', 'thermoset'] }, text: 'プラスチックは、{木材|もくざい}ほど{温|あたた}かい{感|かん}じがしない' },
        ],
        page: 'p.30〜31',
      },
      {
        id: 'load',
        name: '{荷重|かじゅう}テスト（{大人|おとな}が{座|すわ}る）',
        condition: '{大人|おとな}が{座|すわ}ってもこわれない',
        check: { metric: 'strength', min: 40 }, // 指標「強さ」が40以上
        pass: '{大人|おとな}が{座|すわ}ってもこわれなかった',
        fail: '{座面|ざめん}がたわんでしまった',
        page: 'p.30, p.53',
      },
      BUDGET_TEST,
    ],
    // 指標の計算式。特性（0〜5）に重みをかけた平均を 0〜100 にする。cost は予算から自動で計算する
    metrics: {
      strength: [{ part: 'seat', trait: 'strength', weight: 2 }, { product: 'structure', weight: 1 }],
      durability: [{ part: 'seat', trait: 'weather' }],
      usability: [{ part: 'seat', trait: 'insulation', weight: 2 }, { part: 'seat', trait: 'workability', weight: 1 }],
      environment: [{ part: 'seat', trait: 'eco' }],
    },
    // 得点の重み（合計100）。この依頼で大事なことほど大きくする
    scoreWeights: { strength: 15, durability: 20, usability: 35, cost: 15, environment: 15 },
    hint: {
      text: '{木材|もくざい}・{金属|きんぞく}・プラスチックの「さわった{感|かん}じ」と「{加工|かこう}のしやすさ」をくらべよう',
      page: 'p.30〜31',
    },
    comments: {
      star3: 'さわっても{温|あたた}かいし、みんなで{作|つく}りやすかった！ありがとう！',
      star2: 'いい{座面|ざめん}ね。もうひと{工夫|くふう}あると、もっと{長持|ながも}ちしそう。',
      star1: '{使|つか}えるけれど、{作|つく}るのが{大変|たいへん}だったわ…。',
      failed: 'うーん、この{座面|ざめん}では{困|こま}るわ…。テストの{結果|けっか}を{見|み}てみて。',
    },
    learningPoints: [
      { title: '{材料|ざいりょう}の{特性|とくせい}を{生|い}かす', text: '{使用目的|しようもくてき}や{使用条件|しようじょうけん}に{合|あ}った{材料|ざいりょう}を{選|えら}ぶと、よい{製品|せいひん}になる。', page: 'p.30' },
      { title: '{木材|もくざい}は{温|あたた}かい{感|かん}じ', text: '{木材|もくざい}は{比較的|ひかくてき}{軟|やわ}らかく、{小|ちい}さな{力|ちから}で{切|き}ったり{削|けず}ったりできる。さわると{温|あたた}かい{感|かん}じがする。', page: 'p.30〜31' },
      { title: '{木材|もくざい}の{密度|みつど}と{堅|かた}さ', text: '{密度|みつど}が{大|おお}きい（{重|おも}い）{木材|もくざい}ほど{堅|かた}くて{加工|かこう}しにくい。', page: 'p.32' },
    ],
    // 結果画面の「もし別の材料だったら」。上から順に、今の設計と違うものを1つ出す
    whatIf: [
      { part: 'seat', material: 'steel', text: '{丈夫|じょうぶ}だが、{金属|きんぞく}は{熱|ねつ}をよく{通|とお}すので{冬|ふゆ}は{冷|つめ}たく、{雨|あめ}でさびやすい。' },
      { part: 'seat', material: 'sugi', text: '{軽|かる}くて{軟|やわ}らかく、{手|て}づくりでも{切|き}ったり{削|けず}ったりしやすい。{温|あたた}かい{感|かん}じもする。' },
    ],
  },

  // ── 依頼2：屋外の階段の手すり（ステンレス＝鉄＋クロム・ニッケル、さびにくい） ──
  {
    id: 'handrail',
    number: 2,
    rank: 'apprentice',
    title: '{屋外|おくがい}の{階段|かいだん}の{手|て}すり',
    client: {
      name: 'アパートの{大家|おおや}さん',
      look: { skin: '#f7cfa5', hair: '#cfcfcf', outfit: '#7a5ca8', hat: 'glasses' },
    },
    message:
      '{外|そと}の{階段|かいだん}に{手|て}すりを{付|つ}けたいんじゃ。{雨|あめ}や{雪|ゆき}にぬれても*さびにくい*ものがいい。' +
      'お{年寄|としよ}りが*{体重|たいじゅう}をかけても{曲|ま}がらない*{強|つよ}さも{必要|ひつよう}じゃよ。{長|なが}く{使|つか}いたいのう。',
    budget: 7000,
    art: 'handrail',
    baseStructure: 3,
    parts: [
      {
        id: 'rail',
        name: '{手|て}すり',
        size: 4,
        materialIds: ['steel', 'stainless', 'aluminum', 'aluminumAlloy'],
        processIds: ['bend', 'weld', 'cast', 'sawPlane'],
        // 加工方法ごとに得と損をつける（どれを選んでも同じ点にならないように）
        processMetricEffects: {
          bend: { durability: 10 },
          weld: { strength: 10 },
          cast: { strength: -20 },
          sawPlane: { strength: -10, durability: -15 },
        },
        processNotes: {
          bend: { good: '1{本|ぽん}のパイプを{曲|ま}げるので、つなぎ{目|め}が{少|すく}なく{水|みず}が{入|はい}りにくい', bad: '{細|こま}かい{形|かたち}は{作|つく}りにくい' },
          weld: { good: 'つなぎ{目|め}を{溶|と}かして{一体|いったい}にするので{強|つよ}い', bad: '{加工費|かこうひ}が{高|たか}い' },
          cast: { good: '{複雑|ふくざつ}な{形|かたち}も{作|つく}れる', bad: '{長|なが}い{手|て}すりを{型|かた}で{作|つく}ると、もろくて{折|お}れやすい' },
          sawPlane: { good: '{加工費|かこうひ}が{安|やす}い', bad: '{短|みじか}い{部品|ぶひん}をつなぐので、つなぎ{目|め}から{弱|よわ}くなり、{傷|いた}みやすい' },
        },
      },
    ],
    reinforcements: [
      { id: 'paint', parts: ['rail'], detail: '{手|て}すりにさび{止|ど}めの{塗料|とりょう}をぬる' },
      { id: 'bracket', detail: '{手|て}すりの{柱|はしら}の{根元|ねもと}を{金具|かなぐ}で{固定|こてい}する' },
    ],
    tests: [
      {
        id: 'strong',
        name: '{体重|たいじゅう}テスト',
        condition: '{体重|たいじゅう}をかけても{曲|ま}がらない',
        check: { part: 'rail', trait: 'strength', min: 4 },
        pass: '{体重|たいじゅう}をかけても{曲|ま}がらなかった',
        fail: '{手|て}すりが{曲|ま}がってしまった',
        failReasons: [
          { when: { materials: ['aluminum'] }, text: 'アルミニウムは{軽|かる}いが{弱|よわ}い。{体重|たいじゅう}をかけると{曲|ま}がった' },
          { when: { kinds: ['wood'] }, text: 'スギは{軟|やわ}らかく、{細|ほそ}い{手|て}すりでは{強|つよ}さが{足|た}りない' },
        ],
        page: 'p.32, p.34',
      },
      {
        id: 'rust',
        name: '{雨|あめ}テスト（1{年後|ねんご}）',
        condition: '{雨|あめ}にぬれてもさびにくい',
        check: { part: 'rail', trait: 'weather', min: 3 },
        pass: '1{年|ねん}たっても、さびや{傷|いた}みが{出|で}ていない',
        fail: '{雨|あめ}で{傷|いた}んでしまった',
        failReasons: [
          { when: { materials: ['steel'] }, text: '{鋼|こう}は{水|みず}にぬれるとさびやすい。1{年|ねん}でさびが{出|で}た' },
          { when: { kinds: ['wood'] }, text: '{木材|もくざい}は{雨|あめ}で{水分|すいぶん}を{吸|す}って{膨張|ぼうちょう}し、{変形|へんけい}して{傷|いた}んだ' },
        ],
        page: 'p.34',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'rail', trait: 'strength', weight: 2 }, { product: 'structure', weight: 1 }],
      durability: [{ part: 'rail', trait: 'weather' }],
      usability: [{ part: 'rail', trait: 'workability' }, { product: 'structure' }],
      environment: [{ part: 'rail', trait: 'eco' }],
    },
    scoreWeights: { strength: 25, durability: 40, usability: 5, cost: 15, environment: 15 },
    hint: {
      text: '{鉄|てつ}に{何|なに}を{加|くわ}えると、さびにくくなるかな？「{合金|ごうきん}による{性質|せいしつ}の{変化|へんか}」の{表|ひょう}を{見|み}よう',
      page: 'p.34',
    },
    comments: {
      star3: 'これなら{雨|あめ}の{日|ひ}も{安心|あんしん}じゃ。{長|なが}く{使|つか}えるのう！',
      star2: 'しっかりした{手|て}すりじゃ。{何年|なんねん}も{先|さき}まで{大丈夫|だいじょうぶ}かのう？',
      star1: '{使|つか}えるが、{手入|てい}れが{大変|たいへん}になりそうじゃな…。',
      failed: 'これでは{安心|あんしん}して{使|つか}えんのう…。テストの{結果|けっか}を{見|み}てごらん。',
    },
    learningPoints: [
      { title: 'ステンレスはさびにくい', text: '{鉄|てつ}にクロムやニッケルを{加|くわ}えた{合金|ごうきん}。{屋外|おくがい}の{手|て}すりなどに{使|つか}われる。', page: 'p.34' },
      { title: '{合金|ごうきん}で{性質|せいしつ}が{変|か}わる', text: '{金属|きんぞく}を{溶|と}かして{別|べつ}の{金属|きんぞく}などと{混|ま}ぜると、{組織|そしき}が{変|か}わり{性質|せいしつ}も{変|か}わる。', page: 'p.34' },
      { title: '{表面|ひょうめん}を{保護|ほご}する', text: '{塗装|とそう}などの{表面処理|ひょうめんしょり}で、きず・{汚|よご}れ・さびを{防|ふせ}ぎ、{耐久性|たいきゅうせい}を{高|たか}める。', page: 'p.52〜53' },
    ],
    whatIf: [
      { part: 'rail', material: 'aluminumAlloy', text: 'アルミニウム{合金|ごうきん}は{軽|かる}くて{強|つよ}い。{塗装|とそう}などの{表面処理|ひょうめんしょり}をすれば、{屋外|おくがい}の{手|て}すりにも{使|つか}える。ステンレスとは{別|べつ}の{答|こた}えになる。' },
      { part: 'rail', material: 'stainless', text: '{鉄|てつ}にクロムやニッケルを{加|くわ}えた{合金|ごうきん}なので、{塗装|とそう}しなくてもさびにくい。' },
      { part: 'rail', material: 'steel', text: '{安|やす}くて{強|つよ}いが、{水|みず}にぬれるとさびやすい。{塗装|とそう}で{保護|ほご}すれば{使|つか}えるが、{塗装|とそう}がはがれるとさびてしまう。' },
    ],
  },

  // ── 依頼3：フライパンの取っ手（熱硬化性プラスチック＝フェノール樹脂） ──
  {
    id: 'panHandle',
    number: 3,
    rank: 'apprentice',
    title: 'フライパンの{取|と}っ{手|て}',
    client: {
      name: 'キッチン{用品|ようひん}メーカーの{開発者|かいはつしゃ}さん',
      look: { skin: '#ffe0c2', hair: '#2f2a28', outfit: '#d9534f', hat: 'bun' },
    },
    message:
      '{新|あたら}しいフライパンの{取|と}っ{手|て}を{作|つく}りたいの。{料理中|りょうりちゅう}は{本体|ほんたい}がとても{熱|あつ}くなるから、' +
      '*{熱|ねつ}で{軟|やわ}らかくならず*、*{持|も}つところが{熱|あつ}くなりにくい*{材料|ざいりょう}がいいわ。' +
      'たくさん{売|う}るから、*{型|かた}で{大量生産|たいりょうせいさん}*したいの。',
    budget: 1500,
    art: 'panHandle',
    baseStructure: 3,
    parts: [
      {
        id: 'handle',
        name: '{取|と}っ{手|て}',
        size: 1,
        materialIds: ['phenol', 'polypropylene', 'acrylic', 'stainless'],
        processIds: ['cast', 'sawPlane', 'heatBend'],
        // 型を使うと、にぎりやすい複雑な形も同じ形で大量に作れる（p.35 鋳造, p.36 型を使った大量生産）
        processMetricEffects: { cast: { usability: 15 } },
        processNotes: {
          cast: { good: 'にぎりやすい{形|かたち}を、{型|かた}で{同|おな}じように{大量|たいりょう}に{作|つく}れる', bad: '{型|かた}を{作|つく}る{費用|ひよう}がかかる' },
          sawPlane: { good: '{型|かた}がなくても{作|つく}れる', bad: '1{本|ぽん}ずつ{削|けず}るので、{大量生産|たいりょうせいさん}に{向|む}かない' },
          heatBend: { good: '{簡単|かんたん}な{道具|どうぐ}で{曲|ま}げられる', bad: '{曲|ま}げた{形|かたち}しか{作|つく}れない' },
        },
      },
    ],
    reinforcements: [
      { id: 'crossSection', parts: ['handle'], detail: '{取|と}っ{手|て}の{断面|だんめん}を、{力|ちから}のかかる{向|む}きに{高|たか}い{形|かたち}にする' },
      { id: 'bracket', detail: '{取|と}っ{手|て}と{本体|ほんたい}のつなぎ{目|め}を{金具|かなぐ}で{固定|こてい}する' },
    ],
    tests: [
      {
        id: 'heat',
        name: '{加熱|かねつ}テスト（{強火|つよび}で10{分|ぷん}）',
        condition: '{熱|ねつ}で{軟|やわ}らかくならない',
        check: { part: 'handle', trait: 'heatResistance', min: 4 },
        pass: '{熱|ねつ}を{受|う}けても{軟|やわ}らかくならなかった',
        fail: '{取|と}っ{手|て}が{熱|ねつ}で{変形|へんけい}した',
        failReasons: [
          { when: { kinds: ['thermoplastic'] }, text: '{熱可塑性|ねつかそせい}プラスチックは、{加熱|かねつ}すると{軟化|なんか}して{溶|と}ける。{取|と}っ{手|て}が{変形|へんけい}した' },
        ],
        page: 'p.36',
      },
      {
        id: 'grip',
        name: 'にぎりテスト（{料理中|りょうりちゅう}）',
        condition: '{持|も}つところが{熱|あつ}くなりにくい',
        check: { part: 'handle', trait: 'insulation', min: 3 },
        pass: '{持|も}つところは{熱|あつ}くならなかった',
        fail: '{持|も}つところが{熱|あつ}くなった',
        failReasons: [
          { when: { kinds: ['metal', 'alloy'] }, text: '{金属|きんぞく}は{熱|ねつ}をよく{通|とお}すので、{取|と}っ{手|て}まで{熱|あつ}くなった' },
        ],
        page: 'p.34, p.36',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'handle', trait: 'strength' }],
      durability: [{ part: 'handle', trait: 'heatResistance' }],
      usability: [{ part: 'handle', trait: 'insulation', weight: 2 }, { part: 'handle', trait: 'lightness', weight: 1 }],
      environment: [{ part: 'handle', trait: 'eco' }],
    },
    scoreWeights: { strength: 10, durability: 30, usability: 35, cost: 15, environment: 10 },
    hint: {
      text: 'プラスチックには2つの{種類|しゅるい}がある。{加熱|かねつ}したときの{違|ちが}いを{調|しら}べよう',
      page: 'p.36',
    },
    comments: {
      star3: '{熱|あつ}くならないし、{型|かた}でたくさん{作|つく}れる！すぐに{商品|しょうひん}にできるわ！',
      star2: 'いい{取|と}っ{手|て}ね。{作|つく}り{方|かた}をもう{少|すこ}し{工夫|くふう}できそう。',
      star1: '{使|つか}えるけれど、たくさん{作|つく}るには{向|む}いていないかも…。',
      failed: 'これでは{料理|りょうり}に{使|つか}えないわ…。テストの{結果|けっか}を{見|み}てみて。',
    },
    learningPoints: [
      { title: '{熱硬化性|ねつこうかせい}プラスチック', text: '{一度|いちど}{固|かた}まると{加熱|かねつ}しても{軟化|なんか}しない。フェノール{樹脂|じゅし}はフライパンや{鍋|なべ}の{取|と}っ{手|て}に{使|つか}われる。', page: 'p.36' },
      { title: '{熱可塑性|ねつかそせい}プラスチック', text: '{加熱|かねつ}すると{軟化|なんか}して{溶|と}ける。アクリル・PET・ポリプロピレンなど。', page: 'p.36' },
      { title: 'プラスチックに{共通|きょうつう}する{性質|せいしつ}', text: '{一般|いっぱん}に{熱|ねつ}や{電気|でんき}を{通|とお}しにくい。{着色|ちゃくしょく}が{容易|ようい}で、{型|かた}を{使|つか}った{大量生産|たいりょうせいさん}ができる。', page: 'p.36' },
    ],
    whatIf: [
      { part: 'handle', material: 'polypropylene', text: '{軽|かる}くて{安|やす}いが、{熱可塑性|ねつかそせい}なので{熱|ねつ}で{軟|やわ}らかくなり、{取|と}っ{手|て}が{変形|へんけい}してしまう。' },
      { part: 'handle', material: 'phenol', text: '{熱硬化性|ねつこうかせい}なので、{一度|いちど}{固|かた}まると{加熱|かねつ}しても{軟化|なんか}しない。{熱|ねつ}も{伝|つた}わりにくい。' },
    ],
  },

  // ── 依頼4：教室の本棚（合板・集成材、背板による面構造） ──
  {
    id: 'bookshelf',
    number: 4,
    rank: 'craftsman',
    title: '{教室|きょうしつ}の{本棚|ほんだな}',
    client: {
      name: '{担任|たんにん}の{先生|せんせい}',
      look: { skin: '#f9d3ad', hair: '#3a2c22', outfit: '#3f7fbf', hat: 'none' },
    },
    message:
      '{教室|きょうしつ}に{本棚|ほんだな}がほしいんだ。{重|おも}い{本|ほん}を{長|なが}い{間|あいだ}{載|の}せても*{反|そ}ったりたわんだりしない*{板|いた}で、' +
      '*{横|よこ}から{押|お}されてもぐらつかない*つくりにしてね。{本|ほん}を{入|い}れる*{空間|くうかん}は{広|ひろ}く*{使|つか}いたいな。',
    budget: 8000,
    art: 'bookshelf',
    baseStructure: 2,
    parts: [
      {
        id: 'body',
        name: '{側板|がわいた}・{棚板|たないた}',
        size: 6,
        materialIds: ['glulam', 'plywood', 'sugi', 'acrylic'],
        processIds: ['sawPlane', 'cast', 'heatBend'],
      },
    ],
    reinforcements: [
      { id: 'panel', detail: '{本棚|ほんだな}の{後|うし}ろに{背板|せいた}を{付|つ}ける' },
      { id: 'triangle', detail: '{棚|たな}に{斜|なな}め{材|ざい}（すじかい）を{入|い}れる', metricEffects: { usability: -30 } },
      // 本棚は角が多いので、金具がたくさん必要になる（そのぶん費用を上書きしている）
      { id: 'bracket', detail: '{側板|がわいた}と{棚板|たないた}の{角|かど}をすべて{補強金具|ほきょうかなぐ}で{固定|こてい}する', cost: 1400 },
    ],
    tests: [
      {
        id: 'warp',
        name: '{反|そ}りテスト（1{年後|ねんご}）',
        condition: '{長|なが}く{使|つか}っても{反|そ}ったり{変形|へんけい}したりしない',
        check: { part: 'body', trait: 'stability', min: 4 },
        pass: '{板|いた}が{反|そ}ったり{変形|へんけい}したりしなかった',
        fail: '{板|いた}が{変形|へんけい}してしまった',
        failReasons: [
          { when: { kinds: ['wood'] }, text: '{木材|もくざい}をそのまま{切|き}り{出|だ}した{板|いた}（{製材品|せいざいひん}）は、{乾燥|かんそう}や{湿気|しっけ}で{収縮|しゅうしゅく}・{膨張|ぼうちょう}して{反|そ}りやすい' },
          { when: { kinds: ['thermoplastic'] }, text: 'アクリルの{板|いた}は、{重|おも}い{本|ほん}を{載|の}せ{続|つづ}けると{変形|へんけい}した' },
        ],
        page: 'p.32〜33, p.54',
      },
      {
        id: 'load',
        name: '{荷重|かじゅう}テスト（{本|ほん}をぎっしり）',
        condition: '{重|おも}い{本|ほん}を{載|の}せてもたわまない',
        check: { part: 'body', trait: 'strength', min: 3 },
        pass: '{本|ほん}をぎっしり{載|の}せても、{棚板|たないた}はたわまなかった',
        fail: '{棚板|たないた}がたわんでしまった',
        failReasons: [
          { when: { kinds: ['wood'] }, text: 'スギは{軟|やわ}らかく、{重|おも}い{本|ほん}で{棚板|たないた}がたわんだ' },
          { when: { kinds: ['thermoplastic'] }, text: 'プラスチックの{強|つよ}さは{金属|きんぞく}ほど{大|おお}きくない。{棚板|たないた}がたわんだ' },
        ],
        page: 'p.32〜33, p.36',
      },
      {
        id: 'sway',
        name: 'ゆさぶりテスト',
        condition: '{横|よこ}から{押|お}されてもぐらつかない',
        check: { product: 'structure', min: 4 },
        pass: '{横|よこ}から{押|お}しても、ぐらつかなかった',
        fail: '{横|よこ}から{押|お}すと、{四角形|しかくけい}の{枠|わく}がゆがんでしまった',
        page: 'p.52',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'body', trait: 'strength', weight: 1 }, { product: 'structure', weight: 2 }],
      durability: [{ part: 'body', trait: 'stability' }],
      usability: [{ part: 'body', trait: 'lightness' }, { part: 'body', trait: 'workability' }],
      environment: [{ part: 'body', trait: 'eco' }],
    },
    scoreWeights: { strength: 25, durability: 25, usability: 20, cost: 15, environment: 15 },
    hint: {
      text: '{木質材料|もくしつざいりょう}の{特徴|とくちょう}と、「{構造|こうぞう}を{強|つよ}くする{方法|ほうほう}」3つの{長所|ちょうしょ}・{短所|たんしょ}をくらべよう',
      page: 'p.33, p.52',
    },
    comments: {
      star3: 'たくさん{本|ほん}が{入|はい}るし、ぐらつかない！クラスのみんなも{喜|よろこ}ぶよ！',
      star2: 'しっかりした{本棚|ほんだな}だね。もう{少|すこ}し{使|つか}いやすくできるかな？',
      star1: '{使|つか}えるけれど、ちょっと{気|き}になるところがあるなあ…。',
      failed: 'これだと{本|ほん}を{安心|あんしん}して{置|お}けないね…。テストの{結果|けっか}を{見|み}てみよう。',
    },
    learningPoints: [
      { title: '{面構造|めんこうぞう}', text: '{面|めん}を{板|いた}で{固定|こてい}すると{補強|ほきょう}の{効果|こうか}が{大|おお}きい。{本棚|ほんだな}の{背板|せいた}がその{例|れい}。', page: 'p.52' },
      { title: '{合板|ごうはん}・{集成材|しゅうせいざい}', text: '{木質材料|もくしつざいりょう}は「{大|おお}きな{材料|ざいりょう}を{作|つく}る」「{強度|きょうど}を{高|たか}める」「{変形|へんけい}を{少|すく}なくする」ために{開発|かいはつ}された。', page: 'p.33' },
      { title: '{構造|こうぞう}を{強|つよ}くする3つの{方法|ほうほう}', text: '{三角形|さんかくけい}の{構造|こうぞう}は{空間|くうかん}が{狭|せま}くなり、{接合部|せつごうぶ}の{固定|こてい}は{内部|ないぶ}の{空間|くうかん}を{使|つか}える。', page: 'p.52' },
    ],
    whatIf: [
      { part: 'body', material: 'sugi', text: '{軽|かる}くて{木目|もくめ}を{生|い}かせるが、{製材品|せいざいひん}は{収縮|しゅうしゅく}や{変形|へんけい}が{起|お}こりやすく、{棚板|たないた}も{軟|やわ}らかい。' },
      { part: 'body', material: 'plywood', text: '{合板|ごうはん}は{繊維方向|せんいほうこう}による{性質|せいしつ}の{違|ちが}いが{少|すく}なく、{大|おお}きな{板|いた}でも{変形|へんけい}しにくい。' },
    ],
  },

  // ── 依頼5：駅のホームのベンチ（座面＝木材、脚＝ステンレス、三角形の構造） ──
  {
    id: 'stationBench',
    number: 5,
    rank: 'craftsman',
    title: '{駅|えき}のホームのベンチ',
    client: {
      name: '{駅長|えきちょう}さん',
      look: { skin: '#ffd9b0', hair: '#3b2a1a', outfit: '#2f5f9e', hat: 'cap' },
    },
    message:
      'ホームに{置|お}くベンチを{作|つく}ってほしい。*{屋外|おくがい}で{雨|あめ}にぬれる*{場所|ばしょ}なんだ。' +
      '{冬|ふゆ}に{座|すわ}っても*{冷|つめ}たく{感|かん}じにくい*{座面|ざめん}にしたいし、*{大人|おとな}3{人|にん}*が{座|すわ}ってもぐらつかないようにね。',
    budget: 8000,
    art: 'stationBench',
    baseStructure: 2,
    parts: [
      {
        id: 'seat',
        name: '{座面|ざめん}',
        size: 3,
        materialIds: ['sugi', 'glulam', 'stainless', 'acrylic'],
        processIds: ['sawPlane', 'cast', 'heatBend'],
      },
      {
        id: 'frame',
        name: '{脚|あし}・フレーム',
        size: 3,
        materialIds: ['stainless', 'steel', 'sugi', 'aluminumAlloy'],
        processIds: ['weld', 'bend', 'sawPlane'],
        processMetricEffects: {
          weld: { strength: 8 },
          bend: { durability: 8 },
          sawPlane: { strength: -15 },
        },
        processNotes: {
          weld: { good: '{脚|あし}のつなぎ{目|め}を{一体|いったい}にするので{強|つよ}い', bad: '{加工費|かこうひ}が{高|たか}い' },
          bend: { good: 'パイプを{曲|ま}げてつなぎ{目|め}を{減|へ}らすので、{雨|あめ}に{強|つよ}い', bad: '{曲|ま}げた{形|かたち}しか{作|つく}れない' },
          sawPlane: { good: '{加工費|かこうひ}が{安|やす}い', bad: '{切|き}った{部品|ぶひん}をボルトでつなぐので、ぐらつきやすい' },
        },
      },
    ],
    reinforcements: [
      { id: 'triangle', detail: '{脚|あし}に{斜|なな}め{材|ざい}を{入|い}れる' },
      { id: 'bracket', detail: '{脚|あし}と{座面|ざめん}のつなぎ{目|め}を{金具|かなぐ}で{固定|こてい}する' },
      { id: 'paint', parts: ['seat', 'frame'], detail: '{座面|ざめん}と{脚|あし}に{屋外用|おくがいよう}の{塗料|とりょう}をぬる', cost: 700 },
    ],
    tests: [
      {
        id: 'warm',
        name: 'さわり{心地|ごこち}テスト（{冬|ふゆ}の{朝|あさ}）',
        condition: '{座面|ざめん}：{冷|つめ}たく{感|かん}じにくい',
        check: { part: 'seat', trait: 'insulation', min: 4 },
        pass: '{木材|もくざい}の{座面|ざめん}は、{冷|つめ}たく{感|かん}じにくい',
        fail: '{座面|ざめん}が{冷|つめ}たく{感|かん}じた',
        failReasons: [
          { when: { kinds: ['metal', 'alloy'] }, text: '{金属|きんぞく}は{熱|ねつ}をよく{通|とお}すので、{冬|ふゆ}は{座|すわ}ると{冷|つめ}たい' },
          { when: { kinds: ['thermoplastic'] }, text: 'プラスチックは、{木材|もくざい}ほど{温|あたた}かい{感|かん}じがしない' },
        ],
        page: 'p.30',
      },
      {
        id: 'rust',
        name: '{雨|あめ}テスト（1{年後|ねんご}）',
        condition: '{脚|あし}：{雨|あめ}でもさびたり{傷|いた}んだりしにくい',
        check: { part: 'frame', trait: 'weather', min: 3 },
        pass: '{脚|あし}にさびや{傷|いた}みが{出|で}ていない',
        fail: '{脚|あし}が{雨|あめ}で{傷|いた}んでしまった',
        failReasons: [
          { when: { materials: ['steel'] }, text: '{鋼|こう}は{水|みず}にぬれるとさびやすい。{脚|あし}がさびてしまった' },
          { when: { kinds: ['wood'] }, text: '{木材|もくざい}は{雨|あめ}で{水分|すいぶん}を{吸|す}って{膨張|ぼうちょう}し、{変形|へんけい}して{傷|いた}んだ' },
        ],
        page: 'p.34',
      },
      {
        id: 'load',
        name: '{荷重|かじゅう}テスト（{大人|おとな}3{人|にん}）',
        condition: '{大人|おとな}3{人|にん}が{座|すわ}ってもぐらつかない',
        check: { metric: 'strength', min: 75 },
        pass: '{大人|おとな}3{人|にん}が{座|すわ}っても、ぐらつかなかった',
        fail: '{大人|おとな}3{人|にん}が{座|すわ}ると、ぐらついた',
        failReasons: [
          { when: { part: 'frame', materials: ['sugi'] }, text: 'スギの{脚|あし}は{軟|やわ}らかく、{大人|おとな}3{人|にん}の{重|おも}さに{耐|た}えられなかった' },
          { when: { lacks: ['triangle', 'bracket'] }, text: '{四角形|しかくけい}の{枠|わく}は{横|よこ}から{押|お}すと{倒|たお}れやすい。{脚|あし}がゆがんでぐらついた' },
        ],
        page: 'p.52',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [
        { part: 'frame', trait: 'strength', weight: 2 },
        { part: 'seat', trait: 'strength', weight: 1 },
        { product: 'structure', weight: 2 },
      ],
      durability: [{ part: 'seat', trait: 'weather', weight: 1 }, { part: 'frame', trait: 'weather', weight: 2 }],
      usability: [{ part: 'seat', trait: 'insulation' }],
      environment: [{ part: 'seat', trait: 'eco' }, { part: 'frame', trait: 'eco' }],
    },
    scoreWeights: { strength: 25, durability: 25, usability: 20, cost: 15, environment: 15 },
    hint: {
      text: '{座面|ざめん}と{脚|あし}では、{求|もと}められる{性質|せいしつ}が{違|ちが}う。{部品|ぶひん}ごとに{考|かんが}えよう',
      page: 'p.30, p.34, p.52',
    },
    comments: {
      star3: '{座|すわ}っても{冷|つめ}たくないし、{雨|あめ}でもさびない。ありがとう！',
      star2: 'いいベンチだね。もうひと{工夫|くふう}で、もっとよくなりそうだ。',
      star1: '{使|つか}えるけれど、{長|なが}く{使|つか}えるか{少|すこ}し{心配|しんぱい}だなあ…。',
      failed: 'これではお{客|きゃく}さまに{座|すわ}ってもらえないな…。テストの{結果|けっか}を{見|み}てみよう。',
    },
    learningPoints: [
      { title: '{材料|ざいりょう}の{特性|とくせい}を{生|い}かす', text: '{使|つか}う{人|ひと}や{場所|ばしょ}、{目的|もくてき}によって、{求|もと}められる{性質|せいしつ}が{違|ちが}う。{部品|ぶひん}ごとに{合|あ}う{材料|ざいりょう}を{選|えら}ぶ。', page: 'p.30' },
      { title: 'ステンレス', text: '{鉄|てつ}にクロムやニッケルを{加|くわ}えた{合金|ごうきん}。さびにくい。', page: 'p.34' },
      { title: '{三角形|さんかくけい}の{構造|こうぞう}', text: '{斜|なな}め{材|ざい}を{入|い}れると、{細|ほそ}い{材料|ざいりょう}でも{構造|こうぞう}を{強|つよ}くできる。', page: 'p.52' },
    ],
    whatIf: [
      { part: 'frame', material: 'steel', text: '{安|やす}くできるが、{雨|あめ}でさびて{耐久性|たいきゅうせい}が{下|さ}がる。{塗装|とそう}で{表面|ひょうめん}を{保護|ほご}すれば{使|つか}えるかも？' },
      { part: 'seat', material: 'stainless', text: 'さびにくいが、{金属|きんぞく}は{熱|ねつ}をよく{通|とお}すので、{冬|ふゆ}は{座|すわ}ると{冷|つめ}たい。' },
    ],
  },

  // ── 依頼6：飲み物の容器（瓶・缶・ペットボトルの長所と短所、最適化） ──
  {
    id: 'drinkBottle',
    number: 6,
    rank: 'craftsman',
    title: '{飲|の}み{物|もの}の{容器|ようき}',
    client: {
      name: '{飲|の}み{物|もの}メーカーの{開発者|かいはつしゃ}さん',
      look: { skin: '#f6cfa8', hair: '#55331f', outfit: '#2aa198', hat: 'band' },
    },
    message:
      '{部活|ぶかつ}で{持|も}ち{歩|ある}くスポーツドリンクの{容器|ようき}を{考|かんが}えているんだ。*{軽|かる}くて、{落|お}としても{割|わ}れない*ものがいい。' +
      '*{中身|なかみ}が{見|み}えて*、*{何度|なんど}でも{開|あ}け{閉|し}め*できるとうれしい。リサイクルもできるといいね。',
    budget: 1200,
    art: 'drinkBottle',
    baseStructure: 3,
    parts: [
      {
        id: 'body',
        name: '{容器|ようき}の{本体|ほんたい}',
        size: 1,
        materialIds: ['glass', 'steel', 'aluminumAlloy', 'pet'],
        processIds: ['blow', 'press', 'cast'],
        processMetricEffects: {
          blow: { environment: 10, usability: 5 },
          press: { usability: -10 },
          cast: { environment: -10, usability: -10 },
        },
        processNotes: {
          blow: { good: '{中|なか}が{空|から}の{形|かたち}を{薄|うす}く{作|つく}れるので、{材料|ざいりょう}が{少|すく}なくてすむ', bad: '{型|かた}が{必要|ひつよう}' },
          press: { good: '{缶|かん}の{作|つく}り{方|かた}。{金属|きんぞく}の{板|いた}を{速|はや}く{形|かたち}にできる', bad: 'ペットボトルや{瓶|びん}の、{細|ほそ}い{口|くち}の{形|かたち}は{作|つく}りにくい' },
          cast: { good: '{複雑|ふくざつ}な{形|かたち}を{作|つく}れる', bad: '{中|なか}が{空|から}の{容器|ようき}は{厚|あつ}く{重|おも}くなり、{材料|ざいりょう}が{多|おお}くなる' },
        },
        materialNotes: {
          glass: '→ {瓶|びん}になる',
          steel: '→ スチール{缶|かん}になる',
          aluminumAlloy: '→ アルミ{缶|かん}になる',
          pet: '→ ペットボトルになる',
        },
        // 瓶とペットボトルはふたで何度でも開け閉めできるが、缶は1度開けたら閉められない（p.54）
        traitOverrides: { glass: { reclose: 5 }, pet: { reclose: 5 } },
      },
    ],
    reinforcements: [
      {
        id: 'crossSection',
        parts: ['body'],
        detail: '{薄|うす}くして、{溝|みぞ}や{凹凸|おうとつ}で{形|かたち}を{保|たも}つ（{材料|ざいりょう}が{少|すく}なくてすむ）',
        // この依頼では「にぎってもへこまない＝変形しにくい」ことが大事なので、変形のしにくさに効かせる
        traitEffects: { stability: 2, eco: 1 },
      },
      {
        id: 'thicken',
        parts: ['body'],
        detail: '{容器|ようき}の{全体|ぜんたい}を{厚|あつ}くする',
        traitEffects: { stability: 1, lightness: -1, eco: -1 },
      },
    ],
    tests: [
      {
        id: 'light',
        name: '{持|も}ち{歩|ある}きテスト',
        condition: '{軽|かる}い',
        check: { part: 'body', trait: 'lightness', min: 3 },
        pass: '{軽|かる}くて{持|も}ち{歩|ある}きやすい',
        fail: '{重|おも}くて{持|も}ち{歩|ある}きにくい',
        failReasons: [{ when: { materials: ['glass'] }, text: 'ガラスの{瓶|びん}は{重|おも}い' }],
        page: 'p.54',
      },
      {
        id: 'drop',
        name: '{落下|らっか}テスト',
        condition: '{落|お}としても{割|わ}れない',
        check: { part: 'body', trait: 'toughness', min: 3 },
        pass: '{落|お}としても{割|わ}れなかった',
        fail: '{落|お}とすと{割|わ}れてしまった',
        failReasons: [{ when: { materials: ['glass'] }, text: 'ガラスの{瓶|びん}は、{落|お}とすと{割|わ}れる' }],
        page: 'p.54',
      },
      {
        id: 'see',
        name: '{中身|なかみ}チェック',
        condition: '{中身|なかみ}が{見|み}える',
        check: { part: 'body', trait: 'transparency', min: 4 },
        pass: '{透明|とうめい}で{中身|なかみ}が{見|み}える',
        fail: '{中身|なかみ}が{見|み}えない',
        failReasons: [{ when: { kinds: ['metal', 'alloy'] }, text: '{缶|かん}は{中身|なかみ}が{見|み}えない' }],
        page: 'p.54',
      },
      {
        id: 'reclose',
        name: '{開|あ}け{閉|し}めテスト',
        condition: '{何度|なんど}でも{開|あ}け{閉|し}めできる',
        check: { part: 'body', trait: 'reclose', min: 4 },
        pass: 'ふたで{何度|なんど}でも{開|あ}け{閉|し}めできる',
        fail: '{一度|いちど}{開|あ}けたら{閉|し}められない',
        failReasons: [{ when: { kinds: ['metal', 'alloy'] }, text: '{缶|かん}は1{度|ど}{開|あ}けたら{閉|し}められない' }],
        page: 'p.54',
      },
      {
        id: 'squeeze',
        name: 'にぎりテスト',
        condition: '{持|も}っても{形|かたち}がくずれない',
        check: { part: 'body', trait: 'stability', min: 4 },
        pass: 'にぎっても{形|かたち}がくずれなかった',
        fail: '{薄|うす}い{容器|ようき}が、にぎるとへこんでしまった',
        page: 'p.53, p.78〜79',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'body', trait: 'stability' }],
      durability: [{ part: 'body', trait: 'toughness' }, { part: 'body', trait: 'weather' }],
      usability: [{ part: 'body', trait: 'lightness' }, { part: 'body', trait: 'transparency' }, { part: 'body', trait: 'reclose' }],
      environment: [{ part: 'body', trait: 'eco' }],
    },
    scoreWeights: { strength: 15, durability: 15, usability: 35, cost: 15, environment: 20 },
    hint: {
      text: '{瓶|びん}・{缶|かん}・ペットボトルの「よい{点|てん}・{問題点|もんだいてん}」の{表|ひょう}を{見|み}よう',
      page: 'p.54〜55',
    },
    comments: {
      star3: '{軽|かる}くて{割|わ}れないし、{材料|ざいりょう}も{少|すく}なくてすむ。これで{売|う}り{出|だ}そう！',
      star2: 'いい{容器|ようき}だね。{材料|ざいりょう}をもっと{減|へ}らせないかな？',
      star1: '{使|つか}えるけれど、もう{少|すこ}し{工夫|くふう}がほしいなあ…。',
      failed: 'これだと{部活|ぶかつ}では{使|つか}いにくいなあ…。テストの{結果|けっか}を{見|み}てみよう。',
    },
    learningPoints: [
      { title: '{瓶|びん}・{缶|かん}・ペットボトル', text: 'それぞれによい{点|てん}と{問題点|もんだいてん}がある。{使|つか}う{人|ひと}と{開発者|かいはつしゃ}の{願|ねが}いに{折|お}り{合|あ}いをつけて{選|えら}ぶ。', page: 'p.54〜55' },
      { title: '{技術|ぎじゅつ}の{最適化|さいてきか}', text: '{同|おな}じペットボトルでも、{中身|なかみ}によって{形|かたち}や{材質|ざいしつ}を{変|か}えている。{薄|うす}くして{溝|みぞ}で{強|つよ}さを{保|たも}つものもある。', page: 'p.78〜79' },
      { title: '{断面形状|だんめんけいじょう}の{工夫|くふう}', text: '{波形|なみがた}や{折|お}り{曲|ま}げなどの{形|かたち}にすると、{材料|ざいりょう}を{増|ふ}やさずに{強|つよ}くできる。', page: 'p.53' },
    ],
    whatIf: [
      { part: 'body', material: 'glass', text: '{瓶|びん}は{透明|とうめい}で{何度|なんど}でも{開|あ}け{閉|し}めでき、リユース・リサイクルできるが、{重|おも}く、{落|お}とすと{割|わ}れる。' },
      { part: 'body', material: 'aluminumAlloy', text: '{缶|かん}は{瓶|びん}より{軽|かる}く{割|わ}れないが、1{度|ど}{開|あ}けたら{閉|し}められず、{中身|なかみ}も{見|み}えない。' },
    ],
  },

  // ── 依頼7：軽くて強い自転車のフレーム（アルミニウム合金、パイプ＝断面形状の工夫） ──
  {
    id: 'bicycleFrame',
    number: 7,
    rank: 'master',
    title: '{軽|かる}くて{強|つよ}い{自転車|じてんしゃ}のフレーム',
    client: {
      name: '{自転車店|じてんしゃてん}の{店長|てんちょう}さん',
      look: { skin: '#eebd8f', hair: '#1f1a17', outfit: '#e08a1e', hat: 'band' },
    },
    message:
      '{通学用|つうがくよう}の{自転車|じてんしゃ}のフレームを{作|つく}りたい。{坂道|さかみち}も{楽|らく}なように*{軽|かる}く*、' +
      'でも{段差|だんさ}を{走|はし}っても*{曲|ま}がらない{強|つよ}さ*がほしい。{雨|あめ}の{日|ひ}も{乗|の}るよ。',
    budget: 6000,
    art: 'bicycleFrame',
    baseStructure: 2,
    parts: [
      {
        id: 'frame',
        name: 'フレーム',
        size: 3,
        materialIds: ['aluminumAlloy', 'aluminum', 'steel', 'stainless'],
        processIds: ['weld', 'cast', 'sawPlane'],
        processMetricEffects: {
          weld: { strength: 10 },
          cast: { strength: -10, usability: -10 },
          sawPlane: { strength: -5, environment: -15 },
        },
        processNotes: {
          weld: { good: 'パイプどうしを{溶|と}かしてつなぐので、{軽|かる}くて{強|つよ}いフレームになる', bad: '{加工費|かこうひ}が{高|たか}い' },
          cast: { good: '{形|かたち}を{一度|いちど}に{作|つく}れる', bad: '{中|なか}を{空洞|くうどう}にしにくく、{重|おも}くてもろい' },
          sawPlane: { good: '{加工費|かこうひ}が{安|やす}い', bad: '{大|おお}きな{塊|かたまり}から{削|けず}り{出|だ}すので、{材料|ざいりょう}のむだが{多|おお}い' },
        },
      },
    ],
    reinforcements: [
      {
        id: 'crossSection',
        parts: ['frame'],
        detail: 'パイプの{形|かたち}にする（{中|なか}を{空洞|くうどう}にして、{軽|かる}くて{強|つよ}く）',
        traitEffects: { strength: 1, lightness: 1 },
      },
      { id: 'triangle', detail: 'フレームを{三角形|さんかくけい}に{組|く}む' },
      { id: 'paint', parts: ['frame'], detail: 'フレームを{塗装|とそう}する' },
    ],
    tests: [
      {
        id: 'light',
        name: '{重|おも}さチェック',
        condition: '{軽|かる}い（{坂道|さかみち}も{楽|らく}）',
        check: { part: 'frame', trait: 'lightness', min: 4 },
        pass: '{軽|かる}くて、{坂道|さかみち}も{楽|らく}に{上|のぼ}れた',
        fail: 'フレームが{重|おも}く、{坂道|さかみち}がつらい',
        failReasons: [
          { when: { materials: ['steel', 'stainless'] }, text: '{鋼|こう}やステンレスは{強|つよ}いが{重|おも}い（{鉄|てつ}の{密度|みつど}は 7.87 g/cm³）' },
        ],
        page: 'p.30, p.34〜35',
      },
      {
        id: 'strong',
        name: '{段差|だんさ}テスト',
        condition: '{段差|だんさ}を{走|はし}っても{曲|ま}がらない',
        check: { metric: 'strength', min: 80 },
        pass: '{段差|だんさ}を{走|はし}っても、フレームは{曲|ま}がらなかった',
        fail: 'フレームが{曲|ま}がってしまった',
        failReasons: [
          { when: { materials: ['aluminum'] }, text: 'アルミニウムは{軽|かる}いが{弱|よわ}く、フレームが{曲|ま}がった' },
          { when: { lacks: ['triangle', 'crossSection'] }, text: '{材料|ざいりょう}だけでは{強|つよ}さが{足|た}りず、フレームが{曲|ま}がった。{構造|こうぞう}や{部材|ぶざい}の{形|かたち}も{考|かんが}えよう' },
        ],
        page: 'p.34, p.52〜53',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'frame', trait: 'strength', weight: 2 }, { product: 'structure', weight: 1 }],
      durability: [{ part: 'frame', trait: 'weather' }],
      usability: [{ part: 'frame', trait: 'lightness' }],
      environment: [{ part: 'frame', trait: 'eco' }],
    },
    scoreWeights: { strength: 25, durability: 15, usability: 30, cost: 15, environment: 15 },
    hint: {
      text: '{合金|ごうきん}にすると{性質|せいしつ}が{変|か}わる。「{部材|ぶざい}を{強|つよ}くする{方法|ほうほう}」も{見|み}よう',
      page: 'p.34, p.53',
    },
    comments: {
      star3: '{軽|かる}くて{強|つよ}い！これなら{坂道|さかみち}の{多|おお}い{通学路|つうがくろ}でも{楽|らく}だね！',
      star2: 'いいフレームだ。もう{少|すこ}し{軽|かる}く{強|つよ}くできないかな？',
      star1: '{走|はし}れるけれど、もっとよくできそうだね…。',
      failed: 'これでは{安心|あんしん}して{乗|の}れないなあ…。テストの{結果|けっか}を{見|み}てみよう。',
    },
    learningPoints: [
      { title: 'アルミニウム{合金|ごうきん}', text: 'アルミニウムは{軽|かる}いが{弱|よわ}い。{銅|どう}やマグネシウムを{加|くわ}えた{合金|ごうきん}にすると、{軽|かる}くて{強|つよ}くなる。', page: 'p.34' },
      { title: '{断面形状|だんめんけいじょう}の{工夫|くふう}', text: 'パイプなどの{断面形状|だんめんけいじょう}にすると、{材料|ざいりょう}を{増|ふ}やさずに{部材|ぶざい}を{強|つよ}くできる。', page: 'p.53' },
      { title: '{三角形|さんかくけい}の{構造|こうぞう}', text: '{三角形|さんかくけい}に{組|く}むと、{細|ほそ}い{材料|ざいりょう}でも{構造|こうぞう}を{強|つよ}くできる。', page: 'p.52' },
    ],
    whatIf: [
      { part: 'frame', material: 'steel', text: '{鋼|こう}は{強|つよ}くて{安|やす}いが、{重|おも}く、{雨|あめ}でさびやすい。' },
      { part: 'frame', material: 'aluminumAlloy', text: 'アルミニウム{合金|ごうきん}は{軽|かる}く{強|つよ}い。パイプの{形|かたち}にすると、さらに{軽|かる}くて{強|つよ}くできる。' },
    ],
  },

  // ── 依頼8：よく切れて折れにくい包丁（鋼＋焼き入れ→焼き戻し） ──
  {
    id: 'kitchenKnife',
    number: 8,
    rank: 'master',
    title: 'よく{切|き}れて{折|お}れにくい{包丁|ほうちょう}',
    client: {
      name: '{料理人|りょうりにん}さん',
      look: { skin: '#f3c9a0', hair: '#2a2420', outfit: '#f4f4f4', hat: 'chef' },
    },
    message:
      '{毎日|まいにち}{使|つか}う{包丁|ほうちょう}を{作|つく}ってほしい。*よく{切|き}れる*ように{刃|は}は{硬|かた}くしたいけれど、' +
      '{硬|かた}いだけで*{欠|か}けたり{折|お}れたり*したら{困|こま}る。*{粘|ねば}り{強|づよ}さ*もほしいんだ。',
    budget: 3000,
    art: 'kitchenKnife',
    baseStructure: 3,
    parts: [
      {
        id: 'blade',
        name: '{刃|は}',
        size: 1,
        materialIds: ['steel', 'aluminumAlloy', 'acrylic'],
        processIds: ['forge', 'cast', 'sawPlane'],
        // 鍛造はたたいて強度を高める（日本刀や包丁に使われる, p.35）
        processMetricEffects: { forge: { strength: 10 }, cast: { strength: -10 } },
        processNotes: {
          forge: { good: 'たたいて{強度|きょうど}を{高|たか}める。{日本刀|にほんとう}や{包丁|ほうちょう}の{作|つく}り{方|かた}', bad: '{手間|てま}と{加工費|かこうひ}がかかる' },
          cast: { good: '{同|おな}じ{形|かたち}をたくさん{作|つく}れる', bad: '{型|かた}で{固|かた}めただけの{刃|は}はもろい' },
          sawPlane: { good: '{加工費|かこうひ}が{安|やす}い', bad: '{材料|ざいりょう}の{強|つよ}さはそのまま。{強度|きょうど}は{上|あ}がらない' },
        },
      },
    ],
    reinforcements: [
      { id: 'quench', parts: ['blade'], detail: '{刃|は}を800℃{程度|ていど}に{加熱|かねつ}し、{水|みず}で{急|きゅう}に{冷|ひ}やす' },
      { id: 'temper', parts: ['blade'], detail: '{焼|や}き{入|い}れした{刃|は}を、{低|ひく}い{温度|おんど}で{再加熱|さいかねつ}する' },
      { id: 'anneal', parts: ['blade'], detail: '{刃|は}を{加熱|かねつ}し、{炉|ろ}の{中|なか}でゆっくり{冷|ひ}やす' },
    ],
    tests: [
      {
        id: 'sharp',
        name: '{切|き}れ{味|あじ}テスト',
        condition: 'よく{切|き}れる（{刃|は}が{硬|かた}い）',
        check: { part: 'blade', trait: 'hardness', min: 5 },
        pass: '{刃|は}が{硬|かた}く、よく{切|き}れる',
        fail: '{刃|は}が{軟|やわ}らかく、すぐに{切|き}れなくなった',
        failReasons: [
          { when: { has: ['anneal'] }, text: '{焼|や}きなましで{軟|やわ}らかくなり、{刃|は}がすぐに{切|き}れなくなった' },
          { when: { materials: ['steel'] }, text: '{鋼|こう}のままでは、{包丁|ほうちょう}の{刃|は}としては{硬|かた}さが{足|た}りなかった' },
          { when: { materials: ['aluminumAlloy'] }, text: 'アルミニウム{合金|ごうきん}は{軽|かる}くて{強|つよ}いが、{刃物|はもの}にするには{硬|かた}さが{足|た}りない' },
          { when: { kinds: ['thermoplastic'] }, text: 'プラスチックの{強|つよ}さや{硬|かた}さは、{金属|きんぞく}ほど{大|おお}きくない' },
        ],
        page: 'p.35',
      },
      {
        id: 'chip',
        name: '{欠|か}けテスト（かたい{食材|しょくざい}）',
        condition: '{欠|か}けたり{折|お}れたりしにくい',
        check: { part: 'blade', trait: 'toughness', min: 3 },
        pass: 'かたい{食材|しょくざい}を{切|き}っても、{刃|は}が{欠|か}けなかった',
        fail: '{刃|は}が{欠|か}けてしまった',
        failReasons: [
          { when: { has: ['quench'], lacks: ['temper'] }, text: '{焼|や}き{入|い}れしただけの{鋼|こう}は、{硬|かた}いがもろい。{刃|は}が{欠|か}けてしまった' },
        ],
        page: 'p.35',
      },
      BUDGET_TEST,
    ],
    metrics: {
      strength: [{ part: 'blade', trait: 'strength' }, { part: 'blade', trait: 'toughness' }],
      durability: [{ part: 'blade', trait: 'hardness' }, { part: 'blade', trait: 'toughness' }],
      usability: [{ part: 'blade', trait: 'hardness' }],
      environment: [{ part: 'blade', trait: 'eco' }],
    },
    scoreWeights: { strength: 25, durability: 25, usability: 25, cost: 10, environment: 15 },
    hint: {
      text: '「{鋼|こう}の{熱処理|ねつしょり}」の{表|ひょう}で、{処理|しょり}のしかたと{処理後|しょりご}の{性質|せいしつ}をくらべよう',
      page: 'p.35',
    },
    comments: {
      star3: 'よく{切|き}れて、{欠|か}けない！これぞ{職人|しょくにん}の{包丁|ほうちょう}だ！',
      star2: 'いい{包丁|ほうちょう}だ。{作|つく}り{方|かた}しだいで、もっと{強|つよ}くなるぞ。',
      star1: '{使|つか}えるが、{名人|めいじん}の{包丁|ほうちょう}にはもう{一歩|いっぽ}だな…。',
      failed: 'これでは{料理|りょうり}に{使|つか}えないな…。テストの{結果|けっか}を{見|み}てごらん。',
    },
    learningPoints: [
      { title: '{鋼|こう}の{熱処理|ねつしょり}', text: '{焼|や}き{入|い}れ＝{硬|かた}く、もろくなる。{焼|や}き{戻|もど}し＝{粘|ねば}り{強|づよ}くなる。{焼|や}きなまし＝{軟|やわ}らかくなる。', page: 'p.35' },
      { title: '{鍛造|たんぞう}', text: 'たたいて{圧力|あつりょく}を{加|くわ}え、{強度|きょうど}を{高|たか}めて{成形|せいけい}する。{日本刀|にほんとう}や{包丁|ほうちょう}に{使|つか}われる。', page: 'p.35' },
      { title: '{鋼|こう}は{合金|ごうきん}', text: 'ふだん「{鉄|てつ}」と{呼|よ}ぶものの{多|おお}くは{鋼|こう}（{鉄|てつ}と{炭素|たんそ}の{合金|ごうきん}）。', page: 'p.34' },
    ],
    whatIf: [
      { without: 'temper', text: '{焼|や}き{入|い}れだけだと、{硬|かた}いがもろく、かたい{食材|しょくざい}で{刃|は}が{欠|か}けてしまう。' },
      { part: 'blade', material: 'aluminumAlloy', text: '{軽|かる}くて{強|つよ}いが、{刃|は}の{硬|かた}さが{足|た}りず、よく{切|き}れる{包丁|ほうちょう}にはならない。' },
      { part: 'blade', material: 'steel', text: '{鋼|こう}は{焼|や}き{入|い}れで{硬|かた}く、{焼|や}き{戻|もど}しで{粘|ねば}り{強|づよ}くできる。' },
    ],
  },
];
