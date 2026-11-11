// 材料のデータ。ここに1つ書き足すと、依頼データ（requests.js）から使えるようになる。
//
// 特性（traits）の数値は 0〜5 の「ゲーム用の目安」。教科書に書かれている性質
// （例：スギは軽くて軟らかい、ステンレスはさびにくい）が大小関係で表れるように決めている。
// 密度など教科書に数値があるものは、教科書の数値をそのまま表示する。
// 価格（price）も「ゲーム用の目安」で、実際の値段ではない。

/**
 * @typedef {Object} Traits 材料の特性（0〜5）。キーは traits.js の TRAITS。
 * @property {number} strength
 * @property {number} hardness
 * @property {number} toughness
 * @property {number} lightness
 * @property {number} weather
 * @property {number} heatResistance
 * @property {number} insulation
 * @property {number} workability
 * @property {number} stability
 * @property {number} eco
 * @property {number} transparency
 */

/**
 * @typedef {Object} MaterialLook 製品の絵とカードの色
 * @property {string} base  主な色
 * @property {string} dark  線や木目の色
 * @property {'grain'|'layer'|'metal'|'clear'|'plain'} pattern カードの見本の模様
 */

/**
 * @typedef {Object} Material
 * @property {string} id         英数字の名前（ほかのデータから参照する）
 * @property {string} name       表示名（ふりがな記法 {漢字|かんじ} が使える）
 * @property {keyof import('./traits.js').CATEGORIES} category 分類
 * @property {'thermoplastic'|'thermoset'} [plasticType] プラスチックのときだけ
 * @property {string} summary    カードに出す短い説明（2行くらい）
 * @property {string} detail     図鑑に出す説明
 * @property {string} [fact]     教科書の数値など（あれば図鑑とカードに出す）
 * @property {string} page       教科書のページ
 * @property {number} price      1単位あたりの価格（円・ゲーム用の目安）
 * @property {Traits} traits
 * @property {MaterialLook} look
 */

/** @type {Material[]} */
export const MATERIALS = [
  {
    id: 'sugi',
    name: 'スギ',
    category: 'wood',
    summary: '{針葉樹材|しんようじゅざい}。{軽|かる}くて{軟|やわ}らかく、{切|き}ったり{削|けず}ったりしやすい。{温|あたた}かい{感|かん}じ',
    detail:
      '{針葉樹材|しんようじゅざい}の{代表|だいひょう}。{木目|もくめ}が{通|とお}り、{比較的|ひかくてき}{軽|かる}く、{軟|やわ}らかい。' +
      'さわると{温|あたた}かい{感|かん}じがする（{管状|かんじょう}の{細胞|さいぼう}の{空洞|くうどう}にふくまれる{空気|くうき}で{熱|ねつ}が{伝|つた}わりにくい）。' +
      '{乾燥|かんそう}や{湿気|しっけ}で{収縮|しゅうしゅく}・{膨張|ぼうちょう}して{変形|へんけい}することがある。',
    fact: '{密度|みつど} 0.38 g/cm³',
    page: 'p.30〜33',
    price: 500,
    traits: { strength: 2, hardness: 1, toughness: 3, lightness: 5, weather: 2, heatResistance: 3, insulation: 5, workability: 5, stability: 2, eco: 5, transparency: 0 },
    look: { base: '#e3ae74', dark: '#b97b40', pattern: 'grain' },
  },
  {
    id: 'shirakashi',
    name: 'シラカシ',
    category: 'wood',
    summary: '{広葉樹材|こうようじゅざい}。{重|おも}く、{堅|かた}い。{加工|かこう}しにくい',
    detail:
      '{広葉樹材|こうようじゅざい}の{例|れい}。{重|おも}く、{堅|かた}く、{加工|かこう}しにくい。' +
      '{木材|もくざい}は{密度|みつど}が{大|おお}きい（{重|おも}い）ほど、{堅|かた}くて{加工|かこう}しにくい。' +
      '{広葉樹材|こうようじゅざい}は{主|おも}に{家具|かぐ}に{使|つか}われる。',
    page: 'p.32',
    price: 900,
    traits: { strength: 4, hardness: 4, toughness: 3, lightness: 2, weather: 2, heatResistance: 3, insulation: 4, workability: 2, stability: 2, eco: 5, transparency: 0 },
    look: { base: '#c99a62', dark: '#8a5a2b', pattern: 'grain' },
  },
  {
    id: 'plywood',
    name: '{合板|ごうはん}',
    category: 'woodBased',
    summary: '{単板|たんばん}を{奇数枚|きすうまい}はり{合|あ}わせた{板|いた}。{繊維方向|せんいほうこう}による{性質|せいしつ}の{違|ちが}いが{少|すく}ない',
    detail:
      '{丸太|まるた}をかつらむきにした{単板|たんばん}（ベニヤ）を{乾燥|かんそう}させ、{奇数枚|きすうまい}を{接着剤|せっちゃくざい}ではり{合|あ}わせた{木質材料|もくしつざいりょう}。' +
      '{繊維方向|せんいほうこう}による{性質|せいしつ}の{違|ちが}いが{少|すく}ない。{切断|せつだん}したときの{木|き}くずが{少|すく}ない。{建物|たてもの}の{壁|かべ}などに{使|つか}われる。',
    page: 'p.33',
    price: 650,
    traits: { strength: 3, hardness: 2, toughness: 3, lightness: 4, weather: 2, heatResistance: 3, insulation: 4, workability: 4, stability: 5, eco: 4, transparency: 0 },
    look: { base: '#e8c48e', dark: '#b98a4e', pattern: 'layer' },
  },
  {
    id: 'glulam',
    name: '{集成材|しゅうせいざい}',
    category: 'woodBased',
    summary: '{板材|いたざい}を{繊維方向|せんいほうこう}を{合|あ}わせて{接着|せっちゃく}。{変形|へんけい}が{少|すく}なく{強度|きょうど}がある',
    detail:
      '{大|おお}きな{節|ふし}や{割|わ}れを{取|と}り{除|のぞ}いた{板材|いたざい}を、{繊維方向|せんいほうこう}を{合|あ}わせてつなぎ{合|あ}わせたり{積|つ}み{重|かさ}ねたりして{接着|せっちゃく}した{木質材料|もくしつざいりょう}。' +
      '{変形|へんけい}が{少|すく}なく{強度|きょうど}があるが、{作|つく}る{手間|てま}がかかる。{大規模|だいきぼ}な{木造建築物|もくぞうけんちくぶつ}にも{使|つか}われる。',
    page: 'p.33',
    price: 800,
    traits: { strength: 4, hardness: 2, toughness: 3, lightness: 3, weather: 2, heatResistance: 3, insulation: 4, workability: 4, stability: 5, eco: 4, transparency: 0 },
    look: { base: '#e9c08c', dark: '#b97b40', pattern: 'layer' },
  },
  {
    id: 'steel',
    name: '{鋼|こう}',
    category: 'alloy',
    summary: '{鉄|てつ}と{炭素|たんそ}の{合金|ごうきん}。{硬|かた}く、{強|つよ}い。{水|みず}にぬれるとさびやすい',
    detail:
      'ふだん「{鉄|てつ}」と{呼|よ}ぶものの{多|おお}くは{鋼|こう}（{鉄|てつ}と{炭素|たんそ}の{合金|ごうきん}）。{硬|かた}く、{強|つよ}い。' +
      '{熱処理|ねつしょり}（{焼|や}き{入|い}れ・{焼|や}き{戻|もど}し・{焼|や}きなまし）で{性質|せいしつ}を{変|か}えられる。' +
      '{金属|きんぞく}は{熱|ねつ}や{電気|でんき}をよく{通|とお}し、{重|おも}い。スチール{缶|かん}も{鋼|こう}でできている。',
    fact: '{鉄|てつ}の{密度|みつど} 7.87 g/cm³',
    page: 'p.34〜35',
    price: 700,
    traits: { strength: 5, hardness: 3, toughness: 4, lightness: 1, weather: 1, heatResistance: 5, insulation: 1, workability: 3, stability: 5, eco: 3, transparency: 0 },
    look: { base: '#8d969f', dark: '#5d666e', pattern: 'metal' },
  },
  {
    id: 'stainless',
    name: 'ステンレス',
    category: 'alloy',
    summary: '{鉄|てつ}にクロム・ニッケルを{加|くわ}えた{合金|ごうきん}。さびにくい',
    detail:
      '{鉄|てつ}にクロムやニッケルを{加|くわ}えた{合金|ごうきん}。さびにくい。' +
      '{屋外|おくがい}の{手|て}すりや{台所用品|だいどころようひん}など、{水|みず}にぬれる{場所|ばしょ}で{使|つか}われる。{金属|きんぞく}なので{熱|ねつ}をよく{通|とお}す。',
    page: 'p.34',
    price: 1100,
    traits: { strength: 5, hardness: 3, toughness: 4, lightness: 1, weather: 5, heatResistance: 5, insulation: 1, workability: 2, stability: 5, eco: 3, transparency: 0 },
    look: { base: '#d5dde4', dark: '#8f9aa5', pattern: 'metal' },
  },
  {
    id: 'aluminum',
    name: 'アルミニウム',
    category: 'metal',
    summary: '{軽|かる}いが、{弱|よわ}い。{加工|かこう}しやすい',
    detail:
      '{鉄|てつ}よりとても{軽|かる}く、{加工|かこう}しやすい{金属|きんぞく}。そのままでは{弱|よわ}い。' +
      '{銅|どう}やマグネシウムを{加|くわ}えてアルミニウム{合金|ごうきん}にすると、{軽|かる}くて{強|つよ}くなる。',
    page: 'p.34〜35',
    price: 600,
    traits: { strength: 1, hardness: 1, toughness: 3, lightness: 4, weather: 3, heatResistance: 4, insulation: 1, workability: 5, stability: 4, eco: 4, transparency: 0 },
    look: { base: '#e6e9ec', dark: '#a9b0b6', pattern: 'metal' },
  },
  {
    id: 'aluminumAlloy',
    name: 'アルミニウム{合金|ごうきん}',
    category: 'alloy',
    summary: 'アルミニウムに{銅|どう}・マグネシウムを{加|くわ}えた{合金|ごうきん}。{軽|かる}く、{強|つよ}い',
    detail:
      'アルミニウムに{銅|どう}やマグネシウムを{加|くわ}えた{合金|ごうきん}。{軽|かる}く、{強|つよ}い。' +
      'ジュラルミンは{鋼材|こうざい}に{匹敵|ひってき}する{強度|きょうど}がある。アルミ{缶|かん}もアルミニウム{合金|ごうきん}でできている。',
    page: 'p.34〜35',
    price: 1000,
    traits: { strength: 4, hardness: 2, toughness: 3, lightness: 4, weather: 3, heatResistance: 4, insulation: 1, workability: 4, stability: 5, eco: 4, transparency: 0 },
    look: { base: '#dfe3e6', dark: '#9aa3ab', pattern: 'metal' },
  },
  {
    id: 'acrylic',
    name: 'アクリル',
    category: 'plastic',
    plasticType: 'thermoplastic',
    summary: '{熱可塑性|ねつかそせい}。{透明|とうめい}で、{加熱|かねつ}すると{曲|ま}げられる',
    detail:
      '{熱可塑性|ねつかそせい}プラスチック（{加熱|かねつ}すると{軟化|なんか}して{溶|と}ける）。{透明|とうめい}で、{曲|ま}げ{用|よう}ヒータで{加熱|かねつ}して{曲|ま}げられる。' +
      '{浴槽|よくそう}や{水族館|すいぞくかん}の{水槽|すいそう}にも{使|つか}われる。{強|つよ}さや{硬|かた}さ、{耐熱性|たいねつせい}は{金属|きんぞく}ほど{大|おお}きくない。',
    fact: '{密度|みつど} 1.18 g/cm³',
    page: 'p.30, p.36〜37',
    price: 800,
    traits: { strength: 2, hardness: 2, toughness: 2, lightness: 3, weather: 4, heatResistance: 1, insulation: 3, workability: 4, stability: 3, eco: 2, transparency: 5 },
    look: { base: '#bfeaf2', dark: '#6fbccc', pattern: 'clear' },
  },
  {
    id: 'polypropylene',
    name: 'ポリプロピレン',
    category: 'plastic',
    plasticType: 'thermoplastic',
    summary: '{熱可塑性|ねつかそせい}。{軽|かる}くて{割|わ}れにくい。ペットボトルのふたなど',
    detail:
      '{熱可塑性|ねつかそせい}プラスチック（{加熱|かねつ}すると{軟化|なんか}して{溶|と}ける）。{軽|かる}く、{型|かた}を{使|つか}って{大量生産|たいりょうせいさん}できる。' +
      'ペットボトルのふたなどに{使|つか}われる。',
    page: 'p.36',
    price: 450,
    traits: { strength: 2, hardness: 1, toughness: 4, lightness: 4, weather: 4, heatResistance: 1, insulation: 3, workability: 4, stability: 3, eco: 2, transparency: 2 },
    look: { base: '#f4f1e8', dark: '#bdb6a3', pattern: 'plain' },
  },
  {
    id: 'phenol',
    name: 'フェノール{樹脂|じゅし}',
    category: 'plastic',
    plasticType: 'thermoset',
    summary: '{熱硬化性|ねつこうかせい}。{一度|いちど}{固|かた}まると、{加熱|かねつ}しても{軟化|なんか}しない',
    detail:
      '{熱硬化性|ねつこうかせい}プラスチック。{分子|ぶんし}が{網目状|あみめじょう}につながっていて、{一度|いちど}{固|かた}まると{加熱|かねつ}しても{軟化|なんか}しない。' +
      'フライパンや{鍋|なべ}の{取|と}っ{手|て}に{使|つか}われる。プラスチックは{一般|いっぱん}に{熱|ねつ}や{電気|でんき}を{通|とお}しにくい。',
    page: 'p.36',
    price: 700,
    traits: { strength: 3, hardness: 3, toughness: 2, lightness: 3, weather: 4, heatResistance: 5, insulation: 4, workability: 3, stability: 4, eco: 2, transparency: 0 },
    look: { base: '#4a3a33', dark: '#1d1714', pattern: 'plain' },
  },
  {
    id: 'pet',
    name: 'PET（ペット）',
    category: 'plastic',
    plasticType: 'thermoplastic',
    summary: '{熱可塑性|ねつかそせい}。{透明|とうめい}で{軽|かる}く、{割|わ}れにくい。リサイクルできる',
    detail:
      '{熱可塑性|ねつかそせい}プラスチック。ペットボトルの{本体|ほんたい}に{使|つか}われる。{透明|とうめい}で{軽|かる}く、{割|わ}れにくい。' +
      '{成分|せいぶん}や{温度|おんど}に{応|おう}じて{材料|ざいりょう}や{形状|けいじょう}を{工夫|くふう}でき、{比較的|ひかくてき}{安|やす}く{大量生産|たいりょうせいさん}できる。リサイクルできる。',
    page: 'p.36, p.54〜55',
    price: 300,
    traits: { strength: 2, hardness: 1, toughness: 4, lightness: 5, weather: 4, heatResistance: 1, insulation: 3, workability: 5, stability: 3, eco: 3, transparency: 5 },
    look: { base: '#d8f1f7', dark: '#8cc9d8', pattern: 'clear' },
  },
  {
    id: 'glass',
    name: 'ガラス',
    category: 'glass',
    summary: '{透明|とうめい}で{中身|なかみ}が{見|み}える。{重|おも}く、{落|お}とすと{割|わ}れる',
    detail:
      '{瓶|びん}に{使|つか}われる。{透明|とうめい}で{中身|なかみ}が{見|み}え、{何度|なんど}でも{開|あ}け{閉|し}めできる{瓶|びん}にできる。' +
      'リユース・リサイクルできる。{一方|いっぽう}で、{重|おも}く、{落|お}とすと{割|わ}れる。',
    page: 'p.54',
    price: 500,
    traits: { strength: 2, hardness: 4, toughness: 0, lightness: 1, weather: 5, heatResistance: 4, insulation: 3, workability: 1, stability: 5, eco: 5, transparency: 5 },
    look: { base: '#b9e3cf', dark: '#5f9f86', pattern: 'clear' },
  },
];
