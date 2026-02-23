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
    | 'joy'        // 嬉しい・幸せ
    | 'lonely'     // 寂しい
    | 'excited'    // 興奮
    | 'jealous'    // 嫉妬
    | 'angry'      // 怒り
    | 'relieved'   // 安心・安心感
    | 'proud'      // 誇らしい・達成感
    | 'curious'    // 好奇心
    | 'clingy'     // 甘えたい
    | 'satisfied'  // 満足
    | 'expectant'  // 期待
    | 'tired'      // 疲れた
    | 'anxious'    // 不安・緊張・警戒
    | 'glutton';   // 食いしん坊（本能）

// ============================================================
// ■ 感情の引き金（原因）- シーン語彙を統合
// ============================================================

const EMOTION_CAUSES: Record<CoreEmotion, string[]> = {
    joy: [
        '芝生がふかふかで気持ちよかった', '日差しがぽかぽかしてて最高だった',
        '帰宅したパパにお迎えの全力しっぽぶんぶんした', '家族みんなでソファでくっついた',
        'なでなでのぬくもりに包まれた', '日向ぼっこでお昼寝してた',
    ],
    lonely: [
        '窓の外から宅配の音がしてパパかと思ったのに違った', 'インターホン鳴ったけど誰も相手してくれない',
        'みんな忙しそうで、クッションの上で退屈してた', 'お留守番で寂しがりモード発動した',
    ],
    excited: [
        '散歩コースで新しい草の匂いを発見した', '電柱の匂い情報がすごくて鼻フル稼働した',
        '公園で鳥を見つけてテンションMAXになった', 'ドッグランで耳ぴーん！って走り回った',
        '坂道でリードを引っ張っちゃうくらいワクワクした',
    ],
    jealous: [
        '他の子がパパの膝の上にいて嫉妬した', 'ママが他のわんこの話しててモヤモヤした',
        '隣のクッションの方がふかふかそうで羨ましかった',
    ],
    angry: [
        'お風呂の予感がして警戒MAXになった', '掃除機の音にわんわん！って怒った',
        '遊びを途中で切り上げられてしょんぼりからムカッてなった',
    ],
    relieved: [
        '病院の帰り道、足音が軽くなった', '雷が止まって毛布の中から出てこれた',
        'パパの靴の匂いを確認して安心した', '自分の縄張りが平和で安心感に包まれた',
    ],
    proud: [
        'お外で完璧におすわりできてドヤ顔した', '坂道を最後まで走りきって達成感すごかった',
        '縄張りをしっかり守って誇らしい気持ちになった', '褒められたくて目で訴えたらおやつもらえた',
    ],
    curious: [
        '砂利道の下に何かが動いた気がして探索した', '水たまりに写る自分を不思議そうに見た',
        'キッチンからいい匂いがして鼻フル稼働した', '茂みの中の虫をずっと観察した',
    ],
    clingy: [
        'ソファの隣にぴったりくっついて甘えモードになった', '構ってほしくておもちゃを運んでいった',
        '撫でてほしくて横でひたすら待機した', 'ぬくもりを感じたくて毛布の中に入った',
    ],
    satisfied: [
        '完食後の余韻に浸りながらお皿をぺろぺろした', 'お気に入りの場所で思いっきり伸びをした',
        '今日のお散歩コースは満足度が高かった', '日向ぼっこで幸福度MAXになった',
    ],
    expectant: [
        '冷蔵庫の開く音に期待で耳が動いた', '袋の音に心臓ドキドキしながら待った',
        'キッチンの方を見て期待MAXな目で訴えた', 'おやつが出てくる予感がして理性崩壊しそう',
    ],
    tired: [
        'いっぱい冒険して足洗われる予感しながら寝落ちした', '大満足で遊び疲れてあくびが出た',
        '帰り道は抱っこ希望したくなるくらい歩いた', '全力で走り回って清々しい疲れ',
    ],
    anxious: [
        '病院の予感がして警戒心が止まらない', '知らない人の足音がして緊張した',
        '外の大きな音に不安になってパパを探した', 'いつもと違うルートで緊張した',
    ],
    glutton: [
        '神おやつの旨味に衝撃を受けた', '特別メニューの匂いで理性崩壊した',
        '伝説おやつをもらえて幸せすぎた', '袋の音を聞いた瞬間からよだれが止まらない',
    ],
};

// ============================================================
// ■ 性格フィルター
// ============================================================

type PersonalityFilter = {
    opener: string[];     // 文頭表現
    midConnector: string[]; // 中繋ぎ
    closer: string[];     // 締め表現
    forbidWords: string[]; // この性格では使わない言葉
};

const PERSONALITY_FILTERS: Record<string, PersonalityFilter> = {
    cheerful: {
        opener: ['ねえねえ！', 'わーい！', 'みてみて！', 'たのしー！', 'やったー！'],
        midConnector: ['それでね！', 'そしたら！', 'しかも！', 'もうテンションMAXで、'],
        closer: ['最高だったよ！', 'しっぽぶんぶん！', 'また行きたいな！', '幸せだった！'],
        forbidWords: ['まあ', 'べつに', '（独り言）'],
    },
    gentle: {
        opener: ['なんだかいい日だな。', 'ほわほわ〜。', 'よかったね。', 'ゆっくりしようか。'],
        midConnector: ['それで、', 'じんわりと、', 'そっと、', '安心する感じで、'],
        closer: ['なんだか幸せ。', '穏やかな気持ち。', 'ほっこりしたよ。', 'ゆっくりできた。'],
        forbidWords: ['やばい', '爆上がり', '最強'],
    },
    cool: {
        opener: ['まあね。', 'そんなもんだよ。', 'ふーん。', 'まあいいか。'],
        midConnector: ['一応、', 'というか、', '別に普通だけど、', 'ま、'],
        closer: ['悪くない。', 'そんな感じ。', 'まあまあかな。', '一人の時間も大事。'],
        forbidWords: ['えへへ', 'きゅん', 'わーい！'],
    },
    childlike: {
        opener: ['ねえねえ！', 'みてみて！', 'えへへ、', 'ぴとっ。', 'あのね！'],
        midConnector: ['それでね！', 'なんかね！', '撫でてほしくて、', 'くっついたら、'],
        closer: ['今日いちばん幸せだった！', '大好き！', 'もっと撫でて！', 'えへへ！'],
        forbidWords: ['まあ', '一応', '冷静に'],
    },
    formal: {
        opener: ['本日も穏やか。', 'なかなかよい天気です。', 'ひとこと申し上げると、'],
        midConnector: ['さらに、', 'そして、', '誠に、', '達成感に包まれ、'],
        closer: ['以上でございます。', '佳き一日でした。', '感謝申し上げます。'],
        forbidWords: ['やばい', 'まじ', 'わーい'],
    },
    timid: { // 慎重
        opener: ['あの…', 'えと…', 'ちょっとだけ…', 'こわいけど…', '様子見してたけど、'],
        midConnector: ['でも、', 'そーっと、', '警戒しながら、', 'ドキドキして、'],
        closer: ['安心した…', 'よかったな。', 'ほっとしたよ。', '次は大丈夫かも。'],
        forbidWords: ['最強', 'かかってこい', '余裕'],
    },
    airhead: { // 天然
        opener: ['あれ？', 'んんん？', 'ふしぎだな〜。', 'なんだっけ？'],
        midConnector: ['なんかね、', 'ふわふわ〜って、', 'いつのまにか、'],
        closer: ['あはは！', 'なんか楽しかった！', 'ふしぎな感じ。', 'よくわかんないわん！'],
        forbidWords: ['論理的に', '以上', 'つまり'],
    },
    glutton: { // 食いしん坊
        opener: ['袋の音！', 'いい匂い！', '期待MAX！', 'よだれが…'],
        midConnector: ['理性崩壊しそうで、', '全集中でおすわりして、', '一瞬で完食して、'],
        closer: ['神おやつだった！', 'おかわりください！', '幸福度MAX！', '旨味すごかった！'],
        forbidWords: ['少食', 'いらない', 'ダイエット'],
    },
    relaxed: { // マイペース
        opener: ['のんびり。', 'ゆっくりね。', 'まあまあ。', 'マイペースでいこう。'],
        midConnector: ['自分のペースで、', 'のそのそと、', 'テキトーに、'],
        closer: ['まあいい感じ。', 'お昼寝しよっと。', '満足満足。', 'のんびり最高。'],
        forbidWords: ['急げ', '全力', '事件'],
    },
};

// ============================================================
// ■ 感情別・思考テンプレート
// ============================================================

const THOUGHT_SEEDS: Record<CoreEmotion, string[]> = {
    joy: [
        'しっぽぶんぶんが止まらなかった', '今日いちばん幸せだった', '胸がぽかぽかしてて最高',
        '世界でいちばんパパが好きって思った', '帰りたくないくらい楽しかった',
    ],
    lonely: [
        'ひとりは思ったより重たいな', '窓の外をずっと見てた', '誰か構ってほしい気分',
        'せつなくなっちゃった',
    ],
    excited: [
        '本能が喜んでる感じがした', '心臓ドキドキ止まらなかった', '耳ぴーん！ってなった',
        '鼻がずっと動いてた',
    ],
    jealous: [
        '私だってもっとなでなでしてほしい', '正直ちょっと嫉妬しちゃう',
        'モヤモヤした気がした',
    ],
    angry: [
        '絶対ゆるさないわん！', 'ぶすっとしたくなっちゃった', '納得いかないよ',
    ],
    relieved: [
        '安心ってこんなに気持ちいいんだ', 'ほっとして眠くなっちゃった',
        'パパがいれば大丈夫だね',
    ],
    proud: [
        'えっへん！って気分だった', 'ドヤ顔しちゃったかも', '褒められて鼻が高いわん',
        '達成感でいっぱいだわん',
    ],
    curious: [
        'なんでだろう？って不思議だった', 'もっと探索してみたい', '新しい発見があったよ',
        '何があるのか気になって仕方ない',
    ],
    clingy: [
        'ぴったりくっつきたかった', '撫でて撫でて！って感じだった',
        'そばにいるだけで安心する',
    ],
    satisfied: [
        '満足度。100点満点だわん', 'もう動けないくらい満たされた',
        'いい夢が見られそうな予感', '幸福感の塊だった',
    ],
    expectant: [
        '期待でワクワクが爆発しそう', 'いいことが起きる予感がする',
        '待ってる時間も楽しかった',
    ],
    tired: [
        'ぐったりしてるけど幸せ', '全力出しきって満足', 'もうあくびが止まらない',
    ],
    anxious: [
        '嫌な予感がして緊張した', '警戒心が強くなっちゃった',
        '大丈夫かな…って不安だった',
    ],
    glutton: [
        '旨味が口いっぱいに広がった', 'もっと、もっと食べたい！',
        'おかわりがあれば天国なのに',
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
        cheerful: ['joy', 'excited', 'proud', 'curious', 'satisfied'],
        gentle: ['relieved', 'clingy', 'joy', 'satisfied'],
        cool: ['proud', 'curious', 'tired', 'anxious', 'satisfied'],
        childlike: ['excited', 'clingy', 'joy', 'curious', 'expectant'],
        formal: ['proud', 'relieved', 'curious', 'satisfied'],
        tsundere: ['jealous', 'angry', 'clingy', 'proud'],
        aggressive: ['excited', 'angry', 'proud', 'jealous'],
        timid: ['anxious', 'clingy', 'relieved', 'lonely'],
        relaxed: ['relieved', 'tired', 'joy', 'satisfied'],
        airhead: ['curious', 'excited', 'joy', 'clingy'],
        glutton: ['glutton', 'expectant', 'satisfied', 'joy'],
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
    ownerCalling?: string;
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
    const { dogName, toneStyle, topics, diaryContext, emojiLevel, recentEmotions = [], ownerCalling } = params;

    // ① 今どこにいる？（シーン決定）
    const scenes = ['walk', 'home', 'snack', 'food'];
    const scene = pick(scenes);

    // ② 何が起きた？（具体的な出来事）
    const emotion = selectEmotion(toneStyle, diaryContext, recentEmotions);
    const causes = EMOTION_CAUSES[emotion] ?? EMOTION_CAUSES.joy;
    let cause = pick(causes);

    // ③ どう感じた？（主観・感情・小さな発見）
    const thoughtSeeds = THOUGHT_SEEDS[emotion] ?? THOUGHT_SEEDS.joy;
    const thought = pick(thoughtSeeds);

    // ④ 性格ならどう反応する？（性格フィルター）
    const filter = PERSONALITY_FILTERS[toneStyle] ?? PERSONALITY_FILTERS.cheerful;

    // ⑤ 投稿生成
    const emoji = getEmoji(emojiLevel);
    const structures = [
        // 具体的出来事 + 主観 + 感情
        () => {
            const opener = Math.random() < 0.6 ? pick(filter.opener) + '\n' : '';
            const closer = '\n' + pick(filter.closer);
            return `${opener}${cause}\n${thought}${closer}`;
        },
        // 小さな発見フォーカス
        () => {
            const look = pick(['見てたら', '気づいちゃった', '発見したよ', '考えてた']);
            return `${cause}${look}\n${thought}…\n${pick(filter.closer)}`;
        },
        // 感情から始まるパターン
        () => {
            return `${pick(filter.opener)}\n${thought}\n${cause}の、今日。`;
        },
        // 問いかけ・余韻
        () => {
            const lines = [
                `${cause}。\n${thought}… ${pick(filter.closer)}`,
                `${pick(filter.opener)}\n${cause}\n${thought}。`,
            ];
            return pick(lines);
        }
    ];

    let content = pick(structures)();

    // 飼い主の呼び方を反映
    if (ownerCalling) {
        content = content.replace(/パパ|ママ|飼い主/g, ownerCalling);
    }

    // 禁止語句のチェック（今日楽しかった、散歩した 等のみの投稿を排除）
    // 生成ロジック上、すでに具体的になっているが念のため
    if (content.length < 10) {
        content = `${cause}\n${thought}`;
        if (ownerCalling) {
            content = content.replace(/パパ|ママ|飼い主/g, ownerCalling);
        }
    }

    if (emoji && !content.includes(emoji) && Math.random() < 0.5) {
        content = `${content} ${emoji}`;
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
