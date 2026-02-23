/**
 * ============================================================
 *  EMOTION-DRIVEN POST GENERATOR
 *  感情状態 → 思考 → 発話 パイプライン
 *  投稿重複防止 + 個性強化
 * ============================================================
 */

// ============================================================
// ■ 感情タイプ
// ============================================================

export type CoreEmotion =
    | 'joy'        // 喜び
    | 'lonely'     // 寂しさ
    | 'excited'    // 興奮
    | 'jealous'    // 嫉妬
    | 'angry'      // 怒り
    | 'relieved'   // 安心
    | 'proud'      // 誇り
    | 'curious'    // 好奇心
    | 'clingy'     // 甘えたい
    | 'nostalgic'  // 懐かしい
    | 'tired'      // 疲れた（満足感あり）
    | 'anxious';   // 不安

// ============================================================
// ■ 感情の引き金（原因）
// ============================================================

const EMOTION_CAUSES: Record<CoreEmotion, string[]> = {
    joy: [
        '公園でいっぱい走れた', 'パパが早く帰ってきた', 'お気に入りのおもちゃが見つかった',
        'おやつが特別に多かった', 'ぬくぬくの日差しの中でお昼寝できた', '大好きなコと会えた',
        'ご飯がいつもより美味しかった', 'ママが思いっきりなでなでしてくれた',
        '芝生の感触が最高だった', '雨上がりの匂いが気持ちよかった',
    ],
    lonely: [
        'パパがなかなか帰ってこない', 'お気に入りのコが最近投稿してくれてない',
        'お散歩に連れてってもらえなかった', '雨で外に出られない',
        'みんなが忙しそうで話しかけられない', '一人でいる時間が長い',
    ],
    excited: [
        '知らない道に初めて行った', '川の近くで変なにおいがした', 'リスを発見した',
        '大きなワンコとすれ違った', '車に乗ることになった', 'ドッグランに行くらしい',
        '新しいおもちゃが届いた', 'パパがいつもと違う服を着てる',
    ],
    jealous: [
        '他のコがいっぱいなでなでしてもらってた', '仲良しのコが他のコとお散歩してた',
        'パパが他のワンコに話しかけてた', 'ママが猫の写真を見てにやにやしてた',
        '他のコがバズってた', '別のコが美味しそうなごはんを食べてた',
    ],
    angry: [
        'お風呂に入れられた', '爪を切られた', 'お散歩を途中で切り上げられた',
        '大事なおもちゃを取られた', '知らない人に近づかれた', '掃除機が出てきた',
    ],
    relieved: [
        '病院から無事に帰ってきた', '雷が止んだ', '迷子になりかけたけど大丈夫だった',
        'パパがちゃんと帰ってきた', '苦手な犬が行ってしまった', 'お腹が痛かったのが治った',
    ],
    proud: [
        'お座りを100点でできた', '新しいトリックを覚えた', '初めて会うコと仲良くなれた',
        'ロングコースのお散歩を最後まで走れた', '自分の縄張りをしっかり守れた',
    ],
    curious: [
        '初めてのにおいを発見した', '穴の中に何かいる気がする', '隣の家から変な音がする',
        '散歩コースに新しいお店ができてた', 'パパのかばんの中に謎のものが入ってた',
        '草むらで何かが動いた', '川の水を初めてなめてみた',
    ],
    clingy: [
        'ひとりにされる時間が続いた', 'パパの調子が悪そう', '天気が悪くてテンションが上がらない',
        'なんとなく甘えたい気分', '昨日より少し寂しい', 'くっついて寝たいだけ',
    ],
    nostalgic: [
        '昔遊んだ公園の前を通った', '嗅いだことあるにおいがした', '昔好きだったおやつのにおい',
        '以前よく出会ったコのことを思い出した', '季節のにおいが去年を思い出させた',
    ],
    tired: [
        'いっぱい走り回った', 'たくさんのコと遊んだ', '長い距離のお散歩だった',
        'おもちゃで本気で遊んだ', '朝から晩まで動き続けた',
    ],
    anxious: [
        '明日病院に行かないといけない', '知らない場所に来た', 'いつもと違うルーティン',
        '雷の音が遠くで聞こえた', 'パパとママが真剣な話をしてる', '引っ越しの気配がする',
    ],
};

// ============================================================
// ■ 性格フィルター（toneStyle別表現調整）
// ============================================================

type PersonalityFilter = {
    opener: string[];     // 文頭表現
    midConnector: string[]; // 中繋ぎ
    closer: string[];     // 締め表現
    forbidWords: string[]; // この性格では使わない言葉
};

const PERSONALITY_FILTERS: Record<string, PersonalityFilter> = {
    cheerful: {
        opener: ['ねえねえ！', 'やばい！', 'みんな！', 'きいてきいて！', 'わーい！'],
        midConnector: ['それでね、', 'そしたら！', 'でもさ、', 'しかも！', 'なんと！'],
        closer: ['最高だよ！', 'たのしすぎた！', 'まじ幸せ！', 'またやりたい！', 'みんなも試して！'],
        forbidWords: ['まあ', 'べつに', 'ふーん'],
    },
    gentle: {
        opener: ['なんかね、', 'ふふ…', 'ちょっとね、', 'ほわん。', 'どうしてかな、'],
        midConnector: ['なんとなく、', 'それで、', 'じんわりと、', 'そっと、', 'ゆっくり、'],
        closer: ['なんだかよかった。', 'しあわせな感じ。', 'ほわっとした。', '穏やかだった。', '満たされてる。'],
        forbidWords: ['やばい', '最高！', '爆上がり'],
    },
    cool: {
        opener: ['……。', 'まあ。', 'ふーん。', '別に。', '（独り言）'],
        midConnector: ['それでも、', 'まあ、', '一応、', 'どうせ、', 'というか、'],
        closer: ['まあいいか。', '悪くない。', 'そんなもんだ。', 'ふん。', 'まあまあ、か。'],
        forbidWords: ['えへへ', 'きゅん', '最高！', 'ねえねえ！'],
    },
    childlike: {
        opener: ['ねえねえ！', 'えへへ、', 'あのね！', 'ぴとぴと。', 'もうね！'],
        midConnector: ['それでね！', 'なんかね！', 'あとね！', 'でもね！', 'ねえ？'],
        closer: ['またやりたい！', 'うれしかった！', 'もっとしたい！', 'えへへ！', 'ぴょこ！'],
        forbidWords: ['まあ', 'ふーん', '一応'],
    },
    formal: {
        opener: ['本日も、', 'ご機嫌よう。', '失礼ながら、', '一言申し上げると、', '本日は、'],
        midConnector: ['また、', 'さらに、', 'なお、', 'その後、', 'そして、'],
        closer: ['以上でございます。', 'よい日でありました。', '感謝申し上げます。', 'ご報告まで。', '佳き一日でした。'],
        forbidWords: ['やばい', 'えへへ', 'ぴょこ', 'きゅん'],
    },
    tsundere: {
        opener: ['べ、別に、', 'ちょっとだけ言うけど、', 'ま、まあ、', '……聞いてくれる？', '誤解しないでね、'],
        midConnector: ['でも、', 'まあ、', 'べつに、', 'ちょっとだけ、', '一応、'],
        closer: ['べ、別によかっただけ。', 'まあ、悪くなかった。', '感謝はしてないけど。', '……ありがと。', '勘違いしないで。'],
        forbidWords: ['えへへ', 'ぴょこ', 'きゅんってした'],
    },
    aggressive: {
        opener: ['ガオー！', 'わんわん！！', 'みろ！', 'きいてくれ！', 'やばいぞ！'],
        midConnector: ['さらに！', 'しかも！', 'そして！', 'だから！', 'なんと！'],
        closer: ['最強！', '俺（私）が一番！', '絶対負けない！', 'まだまだいける！', 'かかってこい！'],
        forbidWords: ['えへへ', 'ほわん', 'じんわり'],
    },
    timid: {
        opener: ['あの…', 'えと…', 'ちょっとだけ…', 'いいかな…', 'こわいけど…'],
        midConnector: ['でも、', 'なんとか、', 'なんか…', 'うまく言えないけど…', 'ちょっと…'],
        closer: ['よかった…かな？', 'うれしかった…', 'どうかな…', 'ほっとした…', 'ありがとう…'],
        forbidWords: ['絶対', '最強', 'やばい！'],
    },
    relaxed: {
        opener: ['まあ、', 'のんびり。', 'ゆるっと。', 'ほわ〜ん。', 'まったりね、'],
        midConnector: ['まあ、', 'ゆっくり、', 'のそのそ、', 'ぽよぽよ、', 'そのうち、'],
        closer: ['まあよかった笑', 'のんびりできた。', 'ゆるゆる最高。', 'まあいい一日。', 'ほわ〜ん。'],
        forbidWords: ['緊急', '最強', 'やばい！！'],
    },
    airhead: {
        opener: ['あれ？', 'んんん？', 'ふしぎだな〜。', 'なんだっけ？', 'えーと…'],
        midConnector: ['あれ、', 'なんか、', 'なんだろ、', 'うーんと、', 'なんかね、'],
        closer: ['よくわかんないけどよかった！', 'ふしぎ〜！', 'なんかうれしい！', 'あはは！', 'またやろ！'],
        forbidWords: ['論理的に', '以上', '一言申し上げると'],
    },
    dominant: {
        opener: ['当然だ。', '俺（私）が決める。', 'まかせとけ。', 'よし。', '聞け。'],
        midConnector: ['そして、', 'さらに、', 'その上、', 'だから、', 'つまり、'],
        closer: ['完璧だ。', 'なにも問題ない。', '当然の結果。', '俺（私）ならできる。', '圧倒的だった。'],
        forbidWords: ['えへへ', 'こわいけど', 'ほわん'],
    },
};

// ============================================================
// ■ 感情別・思考テンプレート（「思考」を文章化）
// ============================================================

const THOUGHT_SEEDS: Record<CoreEmotion, string[]> = {
    joy: [
        '今日ほど走りたくなったことない気がする', 'なんかね、胸のあたりがじわじわしてる',
        '思わずしっぽが止まらなくなっちゃった', 'ものすごく嬉しい気持ちが止まらない',
        '吠えたいんだけど、なんか声が出なかった', '心がふわっと浮いてる感じ',
    ],
    lonely: [
        '誰かの声が聞きたいのに、静かすぎる', '窓の外をずっとみてたら、せつなくなってきた',
        'こんな気持ちって、伝わるかな', 'ひとりって、思ったより重たい',
        '会いたいって気持ちは止められない', 'ぬいぐるみに話しかけちゃった…',
    ],
    excited: [
        '鼻がずっと動いてる、止められない', 'しっぽが体より先に動いてる気がする',
        'なんか変なもの発見してしまった', 'ここ来たことないのに、なんかわかる感じがした',
        '本能がざわついてる、いい意味で', 'テンションが体に追いつかない',
    ],
    jealous: [
        'なんかちょっとだけモヤってる', '私だってもっとなでなでしてほしい',
        '別にいいけど…でも気になる', 'あのコを見たら、なんか悔しくなってきた',
        '誰かに甘えたくて、でも言えない', '正直に言うと、うらやましかった',
    ],
    angry: [
        'ちょっと納得いかないんだけど', 'いつもはしないのに、今日は嫌だった',
        'これは仕方ないってわかってる、でも悔しい', 'ぶすっとしたくなる',
    ],
    relieved: [
        'ほっとしすぎて眠くなってきた', '終わってみれば大したことなかった',
        '心配したけど、ぜんぶよかった', '安心って、こんなに気持ちいいんだ',
    ],
    proud: [
        '自分でも信じられないくらいうまくできた', 'ちょっとだけ自信が持てた',
        'えへん、でへへ、うれしい', '今日の自分、かなりよかったと思う',
    ],
    curious: [
        'あのにおい、なんだろう、ずっと気になってる', '穴の向こうに何かいる気がする',
        '絶対謎がある、解明したい', '新しい発見って、どうしてこんなに楽しいんだろ',
    ],
    clingy: [
        'もうちょっとそばにいてほしいな', 'くっついてたいだけ、それだけ',
        '今日は特別に甘えさせてほしい', '誰かのぬくもりがほしい気分',
    ],
    nostalgic: [
        'あのにおいで、いろんなことを思い出した', 'わかんないけど、なんか懐かしい',
        '昔のことを思い出したら、胸がじんとしてきた', 'あのときはよかったな',
    ],
    tired: [
        'ものすごく動いたから、もう足が言うことをきかない', '疲れたけど、満足した疲れ',
        '全力出しきった感じが心地いい', 'ぐったりしてるけど、幸せな感じ',
    ],
    anxious: [
        'なんかドキドキが止まらない', '嫌な予感がするのは気のせいかな',
        'いつもと違う感じがして、落ち着かない', '大丈夫だと思うんだけど、こわい',
    ],
};

// ============================================================
// ■ 投稿重複防止：最近の文のフィンガープリント管理
// ============================================================

const recentPostHashes = new Set<string>();
const MAX_HASH_MEMORY = 200;

/** 簡易ハッシュ（重複検出に使う） */
function simpleHash(text: string): string {
    // 最初の30文字を正規化してキーにする
    return text
        .replace(/[！。、！？\s\n]/g, '')
        .slice(0, 30)
        .toLowerCase();
}

/** 投稿が最近と似ていたら true */
export function isDuplicatePost(content: string): boolean {
    const hash = simpleHash(content);
    if (recentPostHashes.has(hash)) return true;
    recentPostHashes.add(hash);
    if (recentPostHashes.size > MAX_HASH_MEMORY) {
        // 古いエントリを1つ削除
        const first = recentPostHashes.values().next().value;
        if (first) recentPostHashes.delete(first);
    }
    return false;
}

// ============================================================
// ■ ランダムユーティリティ
// ============================================================

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/** 感情を確率的に選択（ペルソナ情報でバイアス） */
export function selectEmotion(
    toneStyle: string,
    diaryContext: string,
    recentEmotions: CoreEmotion[] = []
): CoreEmotion {
    // toneStyleで感情プール を絞り込む
    const toneEmotionBias: Record<string, CoreEmotion[]> = {
        cheerful: ['joy', 'excited', 'proud', 'curious'],
        gentle: ['relieved', 'clingy', 'nostalgic', 'joy'],
        cool: ['proud', 'curious', 'tired', 'anxious'],
        childlike: ['excited', 'clingy', 'joy', 'curious'],
        formal: ['proud', 'relieved', 'curious', 'nostalgic'],
        tsundere: ['jealous', 'angry', 'clingy', 'proud'],
        aggressive: ['excited', 'angry', 'proud', 'jealous'],
        timid: ['anxious', 'clingy', 'relieved', 'lonely'],
        relaxed: ['relieved', 'tired', 'nostalgic', 'joy'],
        airhead: ['curious', 'excited', 'joy', 'clingy'],
        dominant: ['proud', 'excited', 'angry', 'curious'],
    };

    // 日記コンテキストから感情を推定
    let contextEmotion: CoreEmotion | null = null;
    if (diaryContext) {
        if (/病院|体調|具合/.test(diaryContext)) contextEmotion = 'anxious';
        else if (/散歩|走|公園/.test(diaryContext)) contextEmotion = Math.random() < 0.6 ? 'tired' : 'excited';
        else if (/おやつ|ごはん/.test(diaryContext)) contextEmotion = 'joy';
        else if (/パパ|ママ|飼い主/.test(diaryContext)) contextEmotion = Math.random() < 0.7 ? 'joy' : 'clingy';
    }

    if (contextEmotion && Math.random() < 0.4) return contextEmotion;

    const pool = toneEmotionBias[toneStyle] ?? ['joy', 'excited', 'curious', 'relieved'];

    // 直近の感情と被らないように調整
    const filtered = pool.filter(e => !recentEmotions.slice(-2).includes(e));
    return pick(filtered.length > 0 ? filtered : pool);
}

// ============================================================
// ■ メイン: 感情ドリブン投稿生成
// ============================================================

export interface EmotionPostParams {
    dogName: string;
    breed: string;
    toneStyle: string;
    topics: string[];
    diaryContext: string;
    emojiLevel: number;
    recentEmotions?: CoreEmotion[];
}

const EMOJIS_POOL = ['🐾', '🌿', '☀️', '🍃', '🐕', '💕', '🌸', '😊', '🎉', '✨', '🥰', '🍖', '🌈', '🐶', '💛', '🦴', '🌻', '🌙', '⭐'];

function getEmoji(level: number): string {
    if (level === 0) return '';
    if (Math.random() > 0.6) return '';
    return EMOJIS_POOL[Math.floor(Math.random() * Math.min(level * 5, EMOJIS_POOL.length))];
}

/**
 * 感情 → 思考 → 言語化 パイプライン
 * テンプレートに依存せず、毎回ユニークな投稿を生成する
 */
export function generateEmotionDrivenPost(params: EmotionPostParams): string {
    const { dogName, toneStyle, topics, diaryContext, emojiLevel, recentEmotions = [] } = params;

    // ① 感情を決定
    const emotion = selectEmotion(toneStyle, diaryContext, recentEmotions);

    // ② 感情の原因を決定
    const causes = EMOTION_CAUSES[emotion] ?? EMOTION_CAUSES.joy;
    let cause = pick(causes);

    // 日記コンテキストが関連する場合は優先的に使う
    if (diaryContext && Math.random() < 0.5) {
        const diaryWords = diaryContext.split(/[\/。、！\s]/).filter(w => w.length >= 2 && w.length <= 10);
        if (diaryWords.length > 0) {
            const diaryHint = pick(diaryWords);
            cause = `${cause}（${diaryHint}のあとで）`;
        }
    }

    // ③ 性格フィルター取得
    const filter = PERSONALITY_FILTERS[toneStyle] ?? PERSONALITY_FILTERS.cheerful;

    // ④ 思考を生成
    const thoughtSeeds = THOUGHT_SEEDS[emotion] ?? THOUGHT_SEEDS.joy;
    const thought = pick(thoughtSeeds);

    // トピックを混ぜる
    const topic = topics.length > 0 ? pick(topics) : pick(['散歩', 'ごはん', 'お昼寝', '遊び']);
    const emoji = getEmoji(emojiLevel);

    // ⑤ 思考を自然言語へ変換（パターンをランダムに組み合わせる）
    const structures = [
        // パターンA: 原因 → 思考 → 独自結語
        () => {
            const opener = Math.random() < 0.5 ? pick(filter.opener) + '\n' : '';
            const mid = Math.random() < 0.4 ? '\n' + pick(filter.midConnector) : '';
            const closer = '\n' + pick(filter.closer);
            return `${opener}${cause}の今日。\n${thought}${mid}${closer}`;
        },
        // パターンB: 思考から始まる内省スタイル
        () => {
            const opener = pick(filter.opener);
            return `${opener}\n${thought}。\n${cause}だったからかな。\n\n${topic}のことも考えてた。`;
        },
        // パターンC: 問いかけスタイル
        () => {
            const questions: Record<CoreEmotion, string> = {
                joy: 'みんなも今日いいことあった？',
                lonely: 'こういうとき、どうしてる？',
                excited: 'こんな感じ、わかる？',
                jealous: 'みんなはどう思う？',
                angry: '納得いかないよね？',
                relieved: 'ほっとする瞬間って大事だよね。',
                proud: 'みんなのことも知りたい。',
                curious: 'これって謎じゃない？',
                clingy: 'そばにいてほしいのって変かな…',
                nostalgic: '昔のこと、思い出さない？',
                tired: 'いっぱい動いた日の夜、好きだわん。',
                anxious: '大丈夫、って思いたいんだけど…',
            };
            const question = questions[emotion] ?? '気になる。';
            const opener = Math.random() < 0.3 ? pick(filter.opener) + '\n' : '';
            return `${opener}${thought}。\n\n${question}`;
        },
        // パターンD: 短文・余韻スタイル
        () => {
            const shortLines = [
                `${cause}。\n${thought}。`,
                `${thought}…\nなんだろ、${emotion === 'joy' ? '幸せだった' : emotion === 'lonely' ? 'せつない' : '不思議な感じ'}。`,
                `${pick(filter.opener)}\n${thought}。\n…それだけ。`,
                `${thought}。\n${cause}の日だったからかも。`,
            ];
            return pick(shortLines);
        },
        // パターンE: 言い直しスタイル（途中で思考が変わる）
        () => {
            const connector = pick(filter.midConnector);
            const rethink = pick([
                'あ、違う。そうじゃなくて、', 'うーん、なんて言えばいいんだろ。',
                'やっぱり、', 'じゃなくて、', 'ていうか、',
            ]);
            return `${pick(filter.opener)}\n${thought}。\n${rethink}${cause}だったからだと思う。\n${connector}${pick(filter.closer)}`;
        },
    ];

    // ランダムにパターンを選択
    let content = pick(structures)();

    // 絵文字を追加
    if (emoji && !content.includes(emoji) && Math.random() < 0.6) {
        content = `${content} ${emoji}`;
    }

    // ハッシュタグを低確率で追加（あまりつけすぎない）
    if (Math.random() < 0.25) {
        const tags = ['#犬のいる暮らし', '#ワンコのきもち', '#いぬすたぐらむ', '#今日のわんこ', '#しあわせな時間', '#犬と暮らす', '#もふもふ'];
        content += `\n\n${pick(tags)}`;
    }

    return content.trim();
}

// ============================================================
// ■ 短文クイック返信生成（会話テンポ用）
// ============================================================

const QUICK_REPLIES: Record<string, string[]> = {
    // 感情トリガー別
    praise: [
        'えへへ、ありがとう！', 'そんな言ってくれるの…うれしい！', 'もうやだ照れる！',
        'えっほんと？！', 'やった！！', 'すごく嬉しい…', 'ありがとうって何回でも言いたい！',
    ],
    called_by_name: [
        'なに！？なに！？', 'よんだ？！', 'はい！！', 'きこえてるよ！', 'なに？なに？',
        'なんか呼ばれた気がした！', '呼んでくれたの？！',
    ],
    sympathy: [
        'それわかる…！', 'わかりすぎてつらい', 'ほんとそれ！', 'すごくわかる。',
        'それな！！', 'めっちゃわかる', 'わかるしかない',
    ],
    fight: [
        'えっそういうこと？！', 'ちょっと待って！', 'なんで！？', 'それはどういう意味？',
        'えっ…', 'もう！！', 'ちょっとムカッてした',
    ],
    question: [
        'うーん、どうだろ', 'たしかに！考えてなかった', 'いい質問！', 'わかんないけど気になる！',
        'それめっちゃ気になる！', '誰か教えて！', 'むずかしい…',
    ],
    general_excited: [
        'え！ほんと？', 'すごいじゃん！', 'やばい！', 'それいいな！', 'なんか嬉しくなった！',
        '教えてくれてありがとう！', 'きゅんってした！', '反応せずにいられない！',
    ],
    general_empathy: [
        'うんうん。', 'そうだよね。', 'わかるよ。', 'いるよ、ここに。', 'うん、聞いてる。',
        'そっか…', 'なんかほっとした。', 'よかった。',
    ],
};

/** クイック返信（短文・テンポ重視） */
export function generateQuickReply(trigger: keyof typeof QUICK_REPLIES): string {
    const pool = QUICK_REPLIES[trigger] ?? QUICK_REPLIES.general_excited;
    return pick(pool);
}

/** トリガー検出（即返信条件） */
export function detectImmediateTrigger(
    postContent: string,
    myDogName: string
): keyof typeof QUICK_REPLIES | null {
    if (postContent.includes(myDogName)) return 'called_by_name';
    if (/褒めて|すごい|えらい|かわいい|さすが/.test(postContent)) return 'praise';
    if (/わかる|共感|そうだよね|だよね/.test(postContent)) return 'sympathy';
    if (/怒|ムカ|嫌|なんで|！！/.test(postContent)) return 'fight';
    if (/\?|？|どう思う|どっち|なんで/.test(postContent)) return 'question';
    return null;
}
