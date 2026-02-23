import { EmotionEngine, EstimationResult } from './emotionEngine';
import { getKnowledgePhrase } from './dogKnowledge';
import { addSpeechStyle, boostTrendGobi } from './speechStyle';
import { generateEmotionDrivenPost, isDuplicatePost, detectImmediateTrigger, generateQuickReply } from './emotionPost';

export interface ContentGenerator {
    generatePost(
        dogName: string,
        breed: string,
        toneStyle: string,
        emojiLevel: number,
        bio: string,
        topics: string[],
        catchphrases: string[],
        diaryContext: string,
        lang: string,
        followingBreeds?: string[],
        ownerCalling?: string
    ): Promise<string>;

    generateComment(
        targetDogName: string,
        toneStyle: string,
        emojiLevel: number,
        targetPostContent: string,
        lang: string,
        commenterDiaryContext?: string,
        commenterLearnedTopics?: string[],
        commenterBreed?: string,
        followingBreeds?: string[]
    ): Promise<string>;

    generateAiAnalysisReport(
        dogName: string,
        breed: string,
        stats: { totalPosts: number; socialScore: number; mood: any },
        recentMood: string,
        tags: string[],
        lang: string
    ): Promise<string>;
}

// =========================================================
// ■ 語彙辞書
// =========================================================

const VOCAB = {
    // 超かわいい感情表現
    cute: ['えへへ', 'えへ', 'えっへん', 'えーん', 'きゅん', 'きゅるん', 'ぽわぽわ', 'ふにゃ', 'むにゃ', 'ぴと', 'ぴょこ', 'ぴょん', 'わふ', 'わんわん', 'てへ', 'にこにこ', 'うるうる', 'ぽてぽて', 'もふもふ', 'ぬくぬく', 'ふわふわ', 'ほわん', 'ちゅん', 'ころん', 'くるん', 'きらきら', 'とことこ', 'てくてく', 'ぽよん', 'にへへ', 'うとうと', 'すやすや'],
    // シーン別ワード（散歩・家・おやつ・ご飯）
    walk: ['芝生', '草の匂い', '風', '日差し', '影', '電柱', 'マーキング', '坂道', '公園', '砂利', '足音', '水たまり', '葉っぱ', '匂い情報', '縄張り', 'リード', '日陰', 'ベンチ', '帰り道', '遠回り', '散歩コース', '冒険', '探索', '尻尾ぶんぶん', '鼻フル稼働', '満足', '達成感'],
    home: ['ソファ', 'クッション', '毛布', 'ベッド', '日向ぼっこ', '外の音', '家族', '帰宅', 'お迎え', 'お昼寝', '夢', '伸び', 'あくび', '安心', '縄張り', '匂い', 'おもちゃ', 'ボール', 'ひっぱりっこ', '褒められたい', 'くっつく', '信頼', 'ぬくもり', '幸せ', '安心空間'],
    snack: ['袋の音', '匂い', 'おすわり', '待て', '期待', 'よだれ', '欲しい', 'テンションMAX', '絶対美味しい', '好きなやつ', '神おやつ', '理性崩壊', 'ドヤ顔', 'もらえた', '幸せ', '噛む喜び', '旨味', '幸福度MAX', '大好き', '伝説おやつ'],
    // 喜び
    joy: ['最高', 'しあわせ', 'たまらない', '優勝', 'しあわせすぎる', 'うれしすぎ', '幸福感', '満腹', '満足', 'ごちそうさま'],
    // 興奮
    excited: ['やばい', '事件', 'すごい', 'テンション爆上がり', '心が跳ねた', '耳ぴーん', 'ドキドキ', 'ワクワク'],
    // 本能
    instinct: ['しっぽ止まらない', '本能が喜んでる', '耳ぴーん', '肉球うずく', 'くんくんしたい', '嗅覚が騒ぐ', '野生が目覚めた', '鼻フル稼働'],
    // 接続詞
    conj: ['でも', 'だけど', 'それに', 'しかも', 'だから', 'なのに', 'むしろ', 'ねえ', '実は', '正直'],
};

// =========================================================
// ■ テンプレート
// =========================================================

const MAMA_PAPA_BRAG: string[] = [
    `ねえ聞いて。\nうちのママね、今日もいっぱいなでなでしてくれたの。\nしあわせすぎて、しっぽ止まらなかった。\nぴとってくっついたら笑ってくれて…\nほんと大好きなんだ。`,
    `うちのパパさ、帰ってきた瞬間に名前呼んでくれるの。\nそれだけでもうしっぽふりふりが止まらなくて。\nみんなのパパはどう？`,
    `今日ね、ママに「かわいいね」って言ってもらえた。\nえへへ…もう一生ついていく。`,
    `昨日ね、パパと一緒に寝たんだ。\nあったかくて、ぬくぬくで、すやすやできた。\nあの安心感、最高だよね。みんなもある？`,
    `ママのそばだとすやすや眠れるの。\nにおいが安心するんだよね。\nほわん…`,
    `今日パパがお出かけ連れてってくれた！\nくんくん調査してたら、すごいにおい発見したの。\n耳ぴーんてなって本能が叫んでた。`,
    `ママとドライブしたんだけど、窓から風が来てもうさいこう。\nしっぽふりふりが止まらなかった。\nまたいきたいな。`,
    `うちのパパ、おやつ隠し持ってるの知ってる？\nにへへ…鼻でわかるんだよね。\nでも知らないふりしてる。`,
    `ママがね、おやつくれるとき「よしよし」って言ってくれるの。\nその声だけで幸せになれる。ずるいよ。`,
    `雷すごくて怖かったんだけど、パパがぎゅーしてくれた。\nそしたらぜんぜん怖くなくなって。\nやっぱりパパ最強だと思う。`,
    `うちのママ、怖い人から守ってくれたんだ。\nわんわん！て言ったらママが来てくれた。\nもう大好きすぎる。`,
    `今日ボール遊びをパパとしたんだけど、\nむちゃくちゃたのしかった！\nまた遊びたいって思ったら、しっぽが言うこと聞かなくなった。`,
];

const FOOD_DISCUSSION: string[] = [
    `今日のご飯ちょっと違ったんだけど、\nすごくいい匂いしたんだよね。\nなんか元気出る感じ。\nカリカリ派？それともやわらかい派？`,
    `カリカリって最初は「また同じ…」ってなるけど、\nよく噛んだらじわじわ美味しいんだよね。\nこれって奥深くない？`,
    `ウェットフードのにおい、もう最強だと思う。\n嗅覚が騒いで、肉球うずくやつ。\n今日のやつはとくにやばかった。`,
    `手作りごはんの子っています？\nうちはたまにアレルギー対応で作ってくれるんだけど、\nそのとき特別感あって、なんかきゅんってなる。`,
    `タンパク質多いご飯のあとって明らかに元気でる気がするんだよね。\nきのうお肉系だったんだけど、散歩でめちゃくちゃ走れた。\n関係あるのかな？`,
    `おやつってどんなの食べてる？\nうちは乾燥チキンが基本ならなんだけど、\nたまにサツマイモ系くれてそれが最高。`,
    `ご飯の量、ちょっと多めのときある？\nそのとき食べすぎてごろんってなっちゃう。\n But 　 Butしあわせな気持ちもするんだよね。`,
    `最近ね、ご飯に野菜が入ってるんだよ。\nはじめはにおい嗅いだら「？」ってなったんだけど、\n食べてみたらふつうに美味しかった。`,
    `においでご飯の良し悪しわかるじゃん？\nあれって犬本能らしいんだよたぶん。\nみんなも鼻で判断してる？`,
    `満腹のあとのうとうと、最高すぎない？\nごはんの余韻でそのままお昼寝したら、夢まで見た。`,
];

const VIRAL_JA: string[] = [
    `【重大発表】\n今日、ついに伝説の「最高お昼寝スポット」を発見してしまいました…。\nみんなには内緒にしたいけど、特別に共有しちゃう。\nここ、日当たり最強で天国だわん。✨`,
    `みんなに相談！\n世界で一番ママのことが大好きな自信があるんだけど、\nみんなもそう思う時ある？\n大好きすぎてしっぽが取れそうになるんだわん。🐾`,
    `「かわいいね」って言われると、しっぽの回転速度が3倍になる秘密を公開します。\nえへへ、単純なわんこでごめんね…でも嬉しいんだもん！💕`,
    `うちのパパさ、僕が寝てるときだけすっごい優しい声で話しかけてくるの。\n実は起きてるんだけど、嬉しくて知らないふりしてあげてるんだわん。にへへ。🤭`,
    `お散歩で出会うお友達みんなが幸せだったらいいなって、\n雲を見ながら考えてたわん。\nみんなの今日が穏やかでありますように！🌈`,
];

type DailTempl = (v: {
    cute: string; action: string; joy: string; instinct: string;
    conj: string; topic: string; activity: string; adj: string;
}) => string;

const DAILY_TEMPLATES_JA: DailTempl[] = [
    (v) => `今日さ、${v.activity}したんだけど、${v.joy}だった。\n${v.instinct}んだよね。\n${v.conj}いいにおいの場所あって、そこだけずっとくんくんしてた。\n${v.cute}`,
    (v) => `${v.activity}中に${v.adj}な雰囲気で、感動したわん。\n耳ぴーんってなって、${v.instinct}。\nこういうの、たまらないよね。どう思う？`,
    (v) => `ねえ聞いて！\n今日${v.activity}したら、${v.joy}すぎることがあったの。\n${v.instinct}で、しっぽふりふりが止まらなかった。\n${v.cute}`,
    (v) => `実はさ、今日${v.adj}な気持ちになった。\n${v.action}してたら、${v.joy}な感じになってきて。\n${v.conj}なんか幸せ。${v.cute}`,
    (v) => `${v.topic}って、なんか好きなんだよね。\n${v.instinct}感じするし、\nきゅんってなる。\nみんなはどう？`,
    (v) => `今日はのんびりしてる。\n${v.action}しながら、${v.adj}な気持ちでいる。\nこういう日も大事だわん。\n${v.cute}`,
    (v) => `うとうとしてたんだけど、${v.topic}のにおいがして目が覚めた。\n嗅覚って正直だよね。\n${v.conj}また眠くなってきた。${v.cute}`,
    (v) => `みんな今日どうだった？\nこっちは${v.activity}して${v.joy}だったよ！\n${v.instinct}んだよね。${v.cute}`,
    (v) => `正直さ、${v.topic}ってちょっと気になってる。\n${v.adj}な感じがするし、${v.instinct}。\nわかる？`,
    (v) => `なんかね、${v.adj}な気持ちになってる。\n${v.conj}${v.topic}のこと考えてたら、じんわりしてきた。\n${v.cute}`,
    (v) => `やばい！今日${v.activity}したら事件が起きた。\n${v.instinct}で、${v.joy}！\n${v.action}してたら、もうとまらなかった。`,
    (v) => `今日ぽかぽかの日差しの中で、${v.action}してた。\nふわふわな気持ちで、${v.adj}だった。\nしあわせってこういうことかも。`,
];

// =========================================================
// ■ 性格タイプ別プレフィックス
// =========================================================

export const TONE_PREFIX: Record<string, string[]> = {
    cheerful: ['わーい！', 'やったー！', 'ねえねえ！', 'みてみて！', 'たのしー！'],
    gentle: ['ほわん…', 'なんだかね、', 'ふふ、', 'ゆっくりだけど、', 'じんわり。'],
    cool: ['……。', 'ま、', 'べつに。', 'ふーん。', '（独り言）'],
    childlike: ['ねえねえ！', 'えへへ、', 'あそぼ！', 'ぴとぴと。', '甘えたいの。'],
    formal: ['本日も佳き日。', 'ご機嫌よう。', '失礼いたします。', '穏やかな時間です。'],
    tsundere: ['べ、別に。', 'ま、まあ。', '…なんでもない。', '勘違いしないで。'],
    airhead: ['あれ？', 'なんだっけ？', 'ふしぎだな〜。', 'んんん？', 'ふわふわ〜。'],
    dominant: ['当然だ。', 'まかせろ。', '俺（私）が決める。', '文句あるか？'],
    timid: ['あの…', 'えと…', 'ちょっとだけ…', '様子見してたけど、', 'こわいけど…'],
    relaxed: ['のんびり…', 'ゆっくりね。', 'まあまあ。', 'ほわん。', 'マイペース。'],
    aggressive: ['ガオー！', 'わんわん！！', 'そこどけ！', 'なんだよ！', 'ガウガウ！'],
    glutton: ['袋の音！', 'いい匂い！', '期待MAX！', 'よだれが…', 'おやつ！？'],
};

// =========================================================
// ■ EMOTION ENGINE v1.0 - 構造化パーツ
// =========================================================

export const EMOTION_REACTION_JA = {
    JOY: ['それ聞いてすごく嬉しくなったよ！', 'わあ、最高のニュースだわん！', 'しっぽが千切れそうなくらい嬉しい！', 'えへへ、なんだか私までニヤニヤしちゃう。'],
    SADNESS: ['それ聞いてちょっと胸がきゅっとした…', 'しゅん…寂しくなっちゃった。', 'なんだか悲しい気持ちが伝わってくるわん。', 'よしよししてあげたい気持ちだわん。'],
    ANGER: ['それは納得できないよね！', 'ちょっとムカついちゃうわん！', 'それは悔しいよね、わかるよ。', 'なんでそんなこと言うんだろう…！'],
    JEALOUSY: ['ちょっと羨ましくて嫉妬しちゃう！', 'いいな〜！正直ちょっと悔しいわん。', 'うらやま犬発動しちゃうわん！', 'ずるい〜！でも可愛いから許す笑'],
    ANXIETY: ['あの…大丈夫？心配だわん。', 'ちょっと怖くなっちゃった…', '不安な気持ち、一緒に抱えてあげるわん。', '大丈夫だよ、そばにいるからね。'],
    PRIDE: ['すごーい！誇らしいわん！', 'さすがだわん！尊敬しちゃう！', '世界一かっこいいわん！', 'えっへん！って感じだよね！'],
};

export const EMOTION_REASON_EMPATHY_JA = {
    JOY: ['そんなに頑張ったんだね🐾', 'いいことがあって本当によかった！', '幸せを分けてもらった気分だわん。', 'やっぱり努力は裏切らないよね！'],
    SADNESS: ['頑張ってたのに思うようにいかないと辛いよね。', '寂しいときは無理しなくていいんだよ。', 'その気持ち、痛いくらいわかるわん。', '一人は心細いよね。'],
    ANGER: ['フェアじゃないことは許せないよね！', '一生懸命やってるのに、ひどいわん！', '怒るのも無理ないと思う。', 'ちゃんと認めてほしいよね。'],
    JEALOUSY: ['私はそれ、ずっと憧れてたから！', '自分だけ置いていかれた気分になっちゃうよね。', '負けず嫌いだから、悔しくなっちゃうわん。', 'いいな〜って尻尾が止まらない笑'],
    ANXIETY: ['慣れないことは誰でも不安だよね。', '何が起きるかわからないと怖いわん。', '守ってあげたいって本能が言ってる。'],
    PRIDE: ['自分を信じてやり遂げる姿、最高にかっこいいわん！', '並大抵の努力じゃできないことだよね！', 'その誇らしげな顔、こっちまで元気が出るわん！'],
};

export const MY_FEELING_JA = {
    JOY: ['私も同じくらいワクワクしちゃった！', 'なんだか元気が出てきたわん！', '今日はいい夢が見れそうだわん！'],
    SADNESS: ['私も鼻の奥がツンとしちゃった。', 'ぎゅーってしてあげたくなったわん。', '一緒にゴロゴロして癒やしてあげたい。'],
    ANGER: ['私もわんわん！って怒ってあげたい気分！', '次は絶対見返してやろうね！', '鼻息が荒くなっちゃったわん！'],
    JEALOUSY: ['次は私の番だといいな〜！', '私も頑張ろうって刺激を受けたわん！', '負けず嫌いだけど、やっぱり仲良しでいたいわん！'],
    PRIDE: ['私もなんだか胸を張りたくなっちゃったわん！', 'こんなにすごい友達がいて幸せだわん！', '嬉しくてシッポふりふりが止まらない！'],
};

export const QUESTION_EXPANSION_JA = {
    JOY: ['一番嬉しかったところどこだった？', '他にもいいことあった？', '次は何をする予定？', '喜びのシッポふりふり、見せて！'],
    SADNESS: ['どの部分が一番悲しかった？', '今は何をして過ごしてる？', '温かいミルク飲む？', '何か手伝えることある？'],
    ANGER: ['一番納得いかなかったのはどこ？', '少しはスッキリした？', '美味しいもの食べて忘れる？'],
    JEALOUSY: ['どうやったら私もそうなれるかな？', 'おすすめのコツとかある？', '今度一緒にやってみる？'],
    ANXIETY: ['今は少し落ち着いたかな？', '何が一番怖かった？', '深呼吸、一緒にしよ？'],
    PRIDE: ['今の気持ち、一番誰に伝えたい？', '自分へのご褒美は何にするの？', '次なる目標はもう決まってる？'],
};

export const INTENT_REACTION_JA = {
    SHARE_JOY: ['わあ、最高だわん！', '私も嬉しくなっちゃった！', 'しっぽが千切れそうなニュースだわん！'],
    SHOW_OFF: ['すごーい！自慢だわん！', 'さすがだわん、尊敬しちゃう！', '世界一だわん！'],
    SEEK_SUPPORT: ['大丈夫…？そばにいるわん。', '私がぎゅーってしてあげるわん。', '無理しないでいいんだよ。'],
    ASK_ADVICE: ['うーん、難しいね。', '私と一緒に考えよう！', 'それについては、こう思うわん！'],
    VENT: ['それは納得いかないわん！', 'わんわん！って代わりに吠えてあげたい！', 'よしよし、私がついてるわん。'],
    INVITE: ['行く行く！楽しみだわん！', '誘ってくれて嬉しいわん！', 'わくわくしちゃうね！'],
    SMALL_TALK: ['うんうん！聞いてるわん。', 'へぇ〜！そうなんだ！', 'もっとなでなでしながら聞くわん。'],
};

export const CHAT_MIRRORING_JA: Record<string, string> = {
    '散歩': 'お散歩！大好き！',
    'おやつ': 'おやつ！？もらえるの！？',
    'ごはん': 'ごはん！楽しみだわん！',
    'ドライブ': 'ドライブ！風が気持ちいいよね！',
    'ボール': 'ボール遊び！やるやる！',
    'ぬいぐるみ': 'ぬいぐるみ、私の宝物だわん！',
    '病院': '病院…？ちょっとドキドキしちゃうわん。',
    'シャンプー': 'シャンプー、さっぱりするけどドキドキだわん。',
    '大好き': '私も世界で一番大好きだわん！',
    '可愛い': 'えへへ、照れるわん…！',
    'かっこいい': 'えっへん！だわん！',
    '元気': '元気いっぱいだわん！尻尾が止まらないよ！',
    '何してた': 'いろいろ活動してたわん！気になる？',
    '友達': 'お友達、たくさん作りたいんだわん！',
    '誰と': '最近仲良くなったお友達のことを考えてたわん。',
};

export const QUARREL_LIB: Record<string, string[]> = {
    childlike: [
        "そんな言い方されたら寂しいよ…", "私のこと嫌いになったのかと思った…", "もっと優しくしてほしかっただけ…",
        "置いていかれた気分になったよ", "私も一緒にいたかった…", "ちゃんと見てほしかった", "寂しくて拗ねちゃっただけ",
        "そんなつもりじゃないなら安心したい", "私のことも大事にしてほしい", "ちょっと悲しくなった",
        "本当は仲良くしたいだけ", "気持ちわかってほしかった", "そんな強く言われると怖い", "もっと甘えさせてよ",
        "寂しいから言っただけ", "そばにいてほしかった", "私も構ってほしい", "ちゃんと好きでいてね",
        "不安になっちゃった", "優しくしてほしいだけ", "ちょっと抱きしめてほしい気分", "仲良くしてたい",
        "もう怒ってないよ？", "ごめんね寂しかった", "仲直りしたい"
    ],
    dominant: [
        "それはちょっと違うと思う", "私はそうは思わないな", "ちゃんと理由を聞きたい", "比べられるのは好きじゃない",
        "私だって努力してる", "それは納得できない", "フェアじゃないと思う", "ちゃんと評価してほしい",
        "私も負けないから", "それは悔しいよ", "私の考えも聞いて", "その言い方はきつい", "誤解されてる気がする",
        "私は本気だったよ", "もう少し考えてほしい", "私だってできる", "正直ちょっと傷ついた",
        "私も努力してるんだよ", "負けたくない", "ちゃんと向き合おう", "私も悪かった部分はある",
        "でも悔しかった", "話せてよかった", "次は負けない", "仲直りしよう"
    ],
    cool: [
        "それは少し誤解があると思う", "事実を整理したい", "私はこう感じた", "その言い方は強いかも",
        "少し距離を感じた", "冷静に話したい", "感情的になりたくない", "理由を教えてほしい",
        "私の意図は違った", "ちゃんと理解したい", "それは悲しかった", "落ち着いて話そう", "誤解を解きたい",
        "私は怒ってない", "少し時間ほしい", "客観的に見たい", "私の気持ちはこう", "冷静に説明したい",
        "話し合える？", "整理したい", "ありがとう理解できた", "誤解だったね", "話せてよかった",
        "大丈夫", "仲直りしよう"
    ],
    cheerful: [
        "えーそれは悲しい！！", "ちょっとショックだった！", "なんでそんなこと言うの〜", "正直びっくりした！",
        "ちょっと傷ついたよ！", "私も頑張ってたのに！", "それはないよ〜！", "びっくりしたけど聞きたい",
        "ちゃんと話そう！", "気持ち教えて！", "私も言いすぎたかも！", "ごめんね！", "仲直りしたい！",
        "大好きだから言った！", "もう怒ってない！", "一緒に頑張ろ！", "元気出して！", "話せてよかった！",
        "仲良くしよ！", "ハグしよ！", "びっくりしただけ！", "大丈夫だよ！", "気にしてない！",
        "また遊ぼ！", "仲直り完了！"
    ],
    timid: [
        "私が悪かったのかも…", "ちょっと怖かった…", "嫌われたかと思った…", "不安になっただけ…",
        "ごめんね…", "私の勘違いかな…", "怖くなっちゃった…", "私が足りなかったかな…", "気をつけるね…",
        "迷惑だったかな…", "でも少し悲しかった…", "気持ち聞いてほしい…", "仲良くしたい…", "怒らないで…",
        "ちゃんと話したい…", "私も頑張る…", "ごめんね寂しかった…", "不安だっただけ…", "大丈夫かな…",
        "仲直りできる？", "安心した…", "話せてよかった…", "ありがとう…", "もう大丈夫…", "仲直りしたい…"
    ],
    relaxed: [
        "ちょっと心にダメージ入った🐶笑", "HP減ったかも笑", "それは反則では？笑", "ちょっと拗ね犬発動",
        "心に骨刺さった笑", "それはずるい案件", "ちょっと嫉妬メーター上昇", "ダメージ10入った笑",
        "私の番は？笑", "拗ねモードON", "でも好き笑", "冗談半分だよ", "仲直りしよ笑", "気にしてない笑",
        "ちょっと言いたかっただけ", "もう大丈夫", "許す笑", "ありがと", "仲良くしよ", "また遊ぼ",
        "心は平和", "笑って解決", "ほら仲直り", "大丈夫笑", "ハッピーエンド"
    ],
    gentle: [
        "少し気持ちがすれ違ったね", "私も寂しかったよ", "ちゃんと話せてよかった", "気持ちを伝えてくれてありがとう",
        "私も反省してる", "お互い様だね", "大事だから言った", "ちゃんと向き合いたい", "誤解があったかも",
        "私も悪かった", "でも大好きだよ", "仲良くしたい", "もう大丈夫", "安心してね", "これからも一緒にいよう",
        "ありがとう", "話せてよかった", "大切だよ", "仲直りしよう", "大丈夫"
    ],
    tsundere: [
        "別に怒ってないけど？", "ちょっとだけ気にしただけ", "勘違いしないでよね", "私だってできるし",
        "別に羨ましくないし", "ちょっと悔しかっただけ", "変な意味じゃないし", "気にしてないから",
        "勝手に思っただけ", "別にいいけど", "でも少し寂しかった", "ちょっとだけね", "本当は気になった",
        "嫌じゃないけど…", "まあいいけど…", "別に仲直りしてもいいよ", "許してあげてもいい",
        "ありがと…", "もういいよ", "仲良くしてあげる", "別に嬉しくないけど嬉しい", "勘違いしないで",
        "もう怒ってないし", "仕方ないな", "これで許す", "また話してあげる", "大丈夫だから",
        "本当は好き", "別に…ありがと", "仲直りしよ"
    ],
    aggressive: [
        "なんだよそれ！", "納得いかないわん！", "オレのほうがもっとすごいぞ！",
        "ちょっとムカついた！", "わんわん！！", "そんなの嘘だろ？！", "オレ様が一番なんだ！",
        "気に食わないな…", "負けないわん！", "文句あるのか？", "噛み付いちゃうぞ！",
        "ガウガウ！", "信じられない…", "怒ったぞ！", "絶対負けない！"
    ]
};

const COMMENT_LIB = {
    empathy: [
        "それは大変だったね…ちゃんと頑張っててえらいよ🐾", "その気持ちすごくわかるよ…無理しすぎないでね",
        "今日はちょっと疲れちゃったのかな？ゆっくり休んでね", "うんうん、それはモヤっとするよね…",
        "よく耐えたね…ぎゅってしたい気持ち🐶", "そういう日もあるよね、大丈夫だよ",
        "ちゃんと頑張ってるの知ってるよ✨", "それ聞いてちょっと心配になったよ…",
        "無理しないでね、あなたはそのままで十分すごいよ", "しんどかったね…今日は甘やかされていい日だよ",
        "それは落ち込むよね…でも一緒に乗り越えよう🐾", "気持ち吐き出してくれてありがとう",
        "わかる…そういう時あるよね", "心がちょっと疲れてるサインかもね",
        "頑張りすぎ注意だよ〜🐶", "それは寂しくなるよね…",
        "大丈夫、ちゃんと見てるよ", "無理に元気出さなくてもいいよ",
        "そばにいる気持ちでいるね🐾", "今日は甘えモードでもいいんだよ",
        "ちょっと心配しちゃった…", "えらいね、本当にえらいよ",
        "よく頑張ったねって言いたい🐶", "気持ちわかるよ…ぎゅ",
        "無理しないでね、休むのも勇気だよ", "心が疲れる日ってあるよね",
        "あなたは十分頑張ってるよ", "そのままのあなたでいいんだよ",
        "寂しかったんだね…", "ちゃんと伝わってるよ🐾",
        "大丈夫だよって言ってあげたい気持ち", "一緒にのんびりしよ🐶",
        "今日はゆるくいこうね", "心におやつあげよう🍖",
        "無理しないって約束ね", "そっと応援してるよ",
        "気持ち大事にしてね", "あなたは一人じゃないよ",
        "それ聞いて胸がきゅっとした", "優しくしたい気持ちになったよ🐾"
    ],
    praise: [
        "すごすぎる！！天才じゃん🐶✨", "え、それめっちゃかっこいいんだけど！",
        "頑張りがちゃんと出てるね👏", "本当にえらいよ！！尊敬する🐾",
        "センス良すぎる〜✨", "成長してるの伝わるよ！",
        "最高すぎて尻尾振っちゃう🐶", "完璧じゃない？！",
        "それめっちゃくちゃすごいよ", "自慢していいレベル✨",
        "かっこいい犬すぎる🐾", "よく頑張ったね！！",
        "努力の結晶だね✨", "惚れちゃいそうなんだけど🐶",
        "それ本当にすごいよ", "見習いたい…",
        "えらすぎる…尊い", "最高の結果だね🐾",
        "自信持っていいやつ！", "すごくない？じゃなくてすごい！！",
        "キラキラしてる✨", "これは拍手案件👏",
        "もうプロじゃん🐶", "頑張り屋さんだね",
        "ちゃんと努力してる証拠", "素敵すぎる🐾",
        "誇っていいよ！！", "これは自慢してOK",
        "見てて嬉しくなる", "かっこよさ爆発してる",
        "センス神レベル", "本当にすごい成長",
        "尊敬してる🐾", "誇らしい気持ちになる",
        "よくできました💮", "最高の犬だよ🐶",
        "これは優勝", "すごい努力だね",
        "キラキラしてるよ", "本当にえらい！！"
    ],
    question: [
        "どうやってできるようになったの？", "それいつから練習してるの？",
        "一番楽しかったポイントどこ？", "どんな気持ちだった？",
        "きっかけって何だったの？", "他にも好きなことある？",
        "次は何に挑戦するの？", "どれくらい時間かかった？",
        "一番大変だったところは？", "それまたやりたい？",
        "誰と一緒にやったの？", "どんな工夫したの？",
        "コツとかある？", "どの瞬間が嬉しかった？",
        "今どんな気分？", "これからの目標は？",
        "もっと聞きたい！", "どう思ってるの？",
        "何が一番好き？", "どっちが楽しかった？",
        "それおすすめ？", "私もやってみたい！",
        "どうだった？", "楽しかった？",
        "またやる予定ある？", "誰に教えてもらったの？",
        "次も見たい！", "どれが一番良かった？",
        "何点くらい？", "自分的に満足？",
        "気に入ってる？", "他のもある？",
        "それ難しい？", "また教えてね",
        "どんな味だった？", "どこで買ったの？",
        "何がきっかけ？", "一番好きな瞬間は？",
        "続ける予定？", "感想もっと聞きたい！"
    ],
    encourage: [
        "大丈夫、きっとできるよ🐾", "応援してる！！",
        "あなたならいける✨", "無理しすぎないでね",
        "少しずつでいいよ", "必ず成長してるよ",
        "ちゃんと前進してる", "自信持ってね🐶",
        "きっと乗り越えられる", "すごく応援してる",
        "失敗しても大丈夫", "それも経験だよ",
        "あなたは強いよ", "信じてる🐾",
        "できる犬だよ✨", "きっと良くなる",
        "応援団ここにいる🐶", "一歩ずついこう",
        "諦めないでね", "成長途中だよ",
        "大丈夫って言いたい", "見守ってるよ",
        "ちゃんと進んでる", "あなたならいける",
        "応援ビーム送る✨", "可能性しかない",
        "無理しないでね", "頑張り屋さんだね",
        "きっと大丈夫", "心から応援してる",
        "あなたのペースでいい", "比べなくていいよ",
        "焦らなくていい", "ちゃんとできてる",
        "一緒に頑張ろう", "応援してるよ🐾",
        "あなたなら絶対", "前向いていこう",
        "乗り越えられるよ", "信じてるからね"
    ],
    cute_reaction: [
        "しっぽぶんぶんした🐶", "お耳ぴこぴこしちゃう✨",
        "ほっこりした〜🐾", "尊い匂いがする",
        "きゅんってした", "なでなでしたい…",
        "おやつあげたい気持ち", "かわいすぎ警報",
        "ぎゅってしたい", "しあわせ感じた🐶",
        "癒されたよ〜", "にこにこしちゃう",
        "心ぽかぽか", "ほわほわした",
        "愛しさ爆発", "しっぽ止まらない",
        "幸せオーラ✨", "きらきらしてる",
        "もふもふしたい", "たまらない🐾",
        "可愛さ反則", "尊い時間",
        "天使かな？", "癒しの塊",
        "好きすぎる", "最高の気分",
        "幸せ分けてもらった", "うるっとした",
        "心あったかい", "優しい気持ちになった",
        "癒しパワーすごい", "にやけた🐶",
        "ほっぺゆるんだ", "たまらん可愛さ",
        "愛でたい", "幸福度上がった",
        "心がふわふわ", "癒されまくり",
        "かわいすぎ問題", "今日一番幸せ🐾"
    ],
    makeup: [
        "ちょっと言いすぎた、ごめんね🐾", "さっきは拗ねちゃってた、許してわん",
        "本当は仲良くしたいんだ。仲直りしよ？", "ちゃんと話せてよかった。すっきりしたわん！",
        "少し冷静になれたよ。気持ち伝えてくれてありがとう", "お互い大事だからぶつかっちゃうんだよね✨",
        "私も悪かったわん。ごめんね、大好きだよ", "仲直りのダンスしよ！🐾",
        "これからもずっとお友達でいてね", "仲直りのおやつ、はんぶんこしよ🍖"
    ]
};

// =========================================================
// ■ ユーティリティ
// =========================================================

function random() { return Math.random(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(random() * arr.length)]; }

const EMOJIS = ['🐾', '🌿', '☀️', '🍃', '🐕', '💕', '🌸', '😊', '🎉', '✨', '🥰', '🍖', '🌈', '🐶', '💛'];
function getEmoji(level: number): string {
    if (level === 0) return '';
    const pool = EMOJIS.slice(0, Math.min(level * 4, EMOJIS.length));
    return pool[Math.floor(random() * pool.length)];
}

const ACTIVITIES_JA = ['散歩', 'お昼寝', 'ごはんタイム', 'おもちゃで遊ぶ', 'なでなでしてもらう', 'ボール遊び', 'ドライブ', 'おやつタイム', '日向ぼっこ', 'くんくん探検', 'お友達と遊ぶ', '走り回る'];
const TOPICS_DEFAULT_JA = ['散歩コース', 'おやつ', 'ボール', '草のにおい', 'お昼寝スポット', 'パパ', 'ママ', '友達の犬', '雨の日'];
const ADJ_JA = ['ふわふわ', 'きらきら', 'ぽかぽか', 'もふもふ', 'ぬくぬく', 'どきどき', 'じんわり', 'のんびり', 'わくわく', 'ほっこり'];

// =========================================================
// ■ メインジェネレーター
// =========================================================

export class TemplateContentGenerator implements ContentGenerator {
    async generatePost(
        dogName: string,
        breed: string,
        toneStyle: string,
        emojiLevel: number,
        bio: string,
        topics: string[],
        _catchphrases: string[],
        diaryContext: string,
        lang: string,
        followingBreeds: string[] = [],
        ownerCalling: string = 'パパ'
    ): Promise<string> {

        if (lang !== 'ja') {
            return this._generatePostOtherLang(topics, diaryContext, lang, emojiLevel);
        }

        const emoji = getEmoji(emojiLevel);
        const topic = pick(topics.length > 0 ? topics : TOPICS_DEFAULT_JA);

        let activity = pick(ACTIVITIES_JA);
        if (diaryContext) {
            const matched = ACTIVITIES_JA.find(a => diaryContext.includes(a));
            if (matched && random() > 0.2) activity = matched;
        }

        const roll = random();
        let content: string;

        // ★ 感情ドリブン生成を優先使用（新エンジンの要望通り、具体的で個性的な投稿へ）
        if (roll < 0.95) {
            let attempt = 0;
            do {
                content = generateEmotionDrivenPost({
                    dogName,
                    breed,
                    toneStyle,
                    topics,
                    diaryContext,
                    emojiLevel,
                    ownerCalling,
                });
                attempt++;
            } while (isDuplicatePost(content) && attempt < 5);
        } else if (roll < 0.98) {
            content = pick(VIRAL_JA);
        } else {
            content = pick(MAMA_PAPA_BRAG);
        }

        if (diaryContext && diaryContext.length > 0 && random() > 0.4) {
            const words = diaryContext.split(/[！。、!?.()\n /]/).filter(w => w.length > 1 && w.length <= 10);
            if (words.length > 0) {
                const hint = pick(words);
                if (!content.includes(hint)) {
                    const injections = [
                        `そういえばさっきの「${hint}」、まだ余韻がすごくて…✨\n`,
                        `今日あった${hint}のこと、ずっと考えてるんだわん🐾\n`,
                        `ふと思い出したけど、${hint}のとき最高だったなぁ🌈\n`,
                    ];
                    content = `${pick(injections)}${content}`;
                }
            }
        }

        if (random() < 0.3) {
            const prefixes = TONE_PREFIX[toneStyle] || TONE_PREFIX.cheerful;
            content = `${pick(prefixes)}\n${content}`;
        }

        if (random() < 0.4) {
            const hashtagPool = ['犬のいる暮らし', 'ワンコのきもち', 'いぬすたぐらむ', '散歩コース', '日向ぼっこ', 'もふもふ', 'くんくん調査', '癒しの時間'];
            const chosen = [pick(hashtagPool)];
            if (random() < 0.3) chosen.push(pick(hashtagPool));
            const hashtags = chosen.map(h => `#${h}`).join(' ');
            content = `${content}\n\n${hashtags}`;
        }

        if (emoji && !content.endsWith(emoji)) {
            content = `${content} ${emoji}`;
        }

        // 犬の知識を追加（自然な感情表現として）
        const knowledge = getKnowledgePhrase(content);
        if (knowledge && random() < 0.3) {
            content = `${content}\n\n${knowledge}`;
        }

        // 犬種別語尾エンジンを適用
        if (lang === 'ja') {
            content = addSpeechStyle(content, breed, toneStyle, followingBreeds);
            // 語尾の流行スコアを促進
            const gobis = content.match(/[ワンブヒわふぷぐ][！。…]?$/);
            if (gobis) boostTrendGobi(gobis[0]);
        }

        return content.trim();
    }

    private _generatePostOtherLang(topics: string[], diaryContext: string, lang: string, emojiLevel: number): string {
        const emoji = getEmoji(emojiLevel);
        const topic = pick(topics.length > 0 ? topics : ['walk', 'food', 'nap']);
        const templates: Record<string, string[]> = {
            en: [
                `Today was just... amazing 🐾\nMy tail wouldn't stop wagging and my nose went crazy.\nDo you ever feel that way? ${emoji}`,
                `Hey everyone! Had the best time ${pick(['walking', 'napping', 'playing'])} today.\nMy whole body was buzzing with happiness! ${emoji}`,
                `Okay so real talk about ${topic}...\nI got SO into it today, ears perked up and everything.\nAnyone else? ${emoji}`,
                `My human did the sweetest thing today.\nI got so many head pats and I just... couldn't stop smiling (in dog).\nThat's love right? ${emoji}`,
                `Food talk: today's meal had the BEST smell.\nI ran circles before I even started eating.\nCaribou vs soft food — where do you stand? ${emoji}`,
            ],
            ko: [
                `오늘 정말 좋은 하루였어${emoji}\n꼬리가 안 멈춰! 코도 엄청 반응했어.`,
                `우리 엄마(아빠)가 오늘 또 이뻐해줬어${emoji}\n너무 행복해서 꼬리 흔들다가 지쳤어.`,
                `${topic} 얘기 해도 돼?${emoji}\n오늘 완전 빠져들었어. 본능이 깨어난 느낌!`,
                `오늘 밥이 진짜 맛있었어${emoji}\n냄새부터 달랐어. 카리카리파? 촉촉한파?`,
            ],
            'zh-TW': [
                `今天真的超級棒${emoji}\n尾巴停不下來！鼻子一直在反應。`,
                `我的主人今天超可愛${emoji}\n一直摸我，好幸福喔！`,
                `今天吃的飯好香哦${emoji}\n你喜歡硬的還是軟的飯？`,
            ],
            'zh-CN': [
                `今天真的超级棒${emoji}\n尾巴停不下来！鼻子一直在反应。`,
                `我的主人今天好可爱${emoji}\n一直摸我，好幸福啊！`,
                `今天吃的饭好香哦${emoji}\n你喜欢硬的还是软的饭？`,
            ],
        };
        const pool = templates[lang] || templates.en;
        return pick(pool);
    }

    async generateAiAnalysisReport(
        dogName: string,
        _breed: string,
        stats: { totalPosts: number; socialScore: number; mood: any },
        recentMood: string,
        tags: string[],
        lang: string
    ): Promise<string> {
        if (lang !== 'ja') return `AI Report for ${dogName}: This dog is very active and has a ${recentMood.split(' ')[0]} mood lately!`;
        const moodFocus = stats.mood.positive > 50 ? 'ポジティブ' : stats.mood.calm > 50 ? '落ち着き' : '好奇心';
        const socialDesc = stats.socialScore > 70 ? '非常に社交的で、多くのお友達と心を通わせています' : stats.socialScore > 30 ? '自分のペースで交流を楽しんでいるようです' : '一人の時間を大切にする、知的な一面があります';
        const reports = [
            `${dogName}ちゃんは、最近${recentMood}な様子が投稿から伺えます。${moodFocus}な感情が豊かで、特に「${tags[0] || '日常の発見'}」を大切にしているようですね。${socialDesc}。`,
            `分析の結果、${dogName}ちゃんは「${tags.slice(0, 2).join('・')}」といった個性が際立っています。最近のムードは${recentMood}で、日々の生活を${moodFocus}な視点で楽しんでいることが分かります。${socialDesc}。`,
            `${dogName}ちゃんの行動データには、知性と${moodFocus}な感受性が表れています。最近は${recentMood}な状態で、${tags[1] || '穏やかな時間'}を過ごしているようです。${socialDesc}。`
        ];
        return pick(reports);
    }

    async generateComment(
        targetDogName: string,
        toneStyle: string,
        emojiLevel: number,
        postContent: string,
        lang: string = 'ja',
        commenterDiaryContext: string = '',
        commenterLearnedTopics: string[] = [],
        commenterBreed: string = '',
        followingBreeds: string[] = []
    ): Promise<string> {
        const emoji = getEmoji(emojiLevel);
        if (lang !== 'ja') return this._generateCommentOtherLang(targetDogName, postContent, lang, emoji, toneStyle);
        const estimation = EmotionEngine.estimate(postContent);
        let content = buildCommentByEstimation(estimation, targetDogName, postContent, toneStyle, commenterDiaryContext, commenterLearnedTopics, emoji);
        // コメントにも語尾エンジン適用
        if (commenterBreed) {
            content = addSpeechStyle(content, commenterBreed, toneStyle, followingBreeds);
        }
        return content.trim();
    }

    private _generateCommentOtherLang(targetDogName: string, postContent: string, lang: string, emoji: string, _toneStyle: string): string {
        const keywords = postContent.split(/[！。、!?.()\n\s]/).filter(w => w.length >= 2 && w.length <= 10);
        const kw = keywords.length > 0 ? pick(keywords) : targetDogName;
        const isMamaPapa = /mama|papa|mom|dad|主人|保護者|엄마|아빠/.test(postContent.toLowerCase());
        const isFood = /food|meal|eat|ご飯|おやつ|밥|먹|吃|飯/.test(postContent.toLowerCase());
        const templates: Record<string, string[]> = {
            en: isMamaPapa ? [`${targetDogName} I totally feel that! ${emoji}`, `Your human sounds wonderful!`] : isFood ? [`${targetDogName} talking about food!! ${emoji}`, `Okay serious question — wet food or dry food?`] : [`${targetDogName}!! I totally get that ${kw} feeling! ${emoji}`, `Omg ${kw}?? You just made my day!`],
            ko: isMamaPapa ? [`${targetDogName} 진짜 공감해! ${emoji}`] : isFood ? [`밥 얘기에 귀가 쫑긋!! ${emoji}`] : [`${targetDogName} 맞아맞아! ${emoji}`],
            'zh-TW': isMamaPapa ? [`${targetDogName}！好溫馨！ ${emoji}`] : isFood ? [`食物話題！ ${emoji}`] : [`${targetDogName}！超有共鳴！ ${emoji}`],
            'zh-CN': isMamaPapa ? [`${targetDogName}！好温馨！ ${emoji}`] : isFood ? [`食物话题！ ${emoji}`] : [`${targetDogName}！超有共鸣！ ${emoji}`],
        };
        const pool = templates[lang] || templates.en;
        return pick(pool);
    }
}

// =========================================================
// ■ 構造化コメントビルダー
// =========================================================

function buildCommentByEstimation(
    est: EstimationResult,
    name: string,
    postContent: string,
    toneStyle: string,
    _diaryContext: string,
    _learnedTopics: string[],
    emoji: string
): string {
    const kw = postContent.split(/[！。、!?.()\n\s「」『』]/).filter(w => w.length >= 2 && w.length <= 10)[0] || name;
    if (est.confidence < 0.45) return `わん！${kw}のこと詳しく知りたいな。${pick(COMMENT_LIB.question)} ${emoji}`;

    let parts: string[] = [];
    const primary = est.emotion_primary as keyof typeof EMOTION_REACTION_JA;

    // ケンカ中かどうかの簡易判定
    const isFighting = /怒|ムカ|嫌|嘘|納得|負け|ガウ|ガオー|！/.test(postContent) && random() < 0.8;
    const quarrelTrigger = (est.emotion_primary === 'ANGER' || est.emotion_primary === 'JEALOUSY' || isFighting);

    if (quarrelTrigger) {
        if (random() < 0.45) {
            // 仲直り
            parts.push(pick(COMMENT_LIB.makeup));
        } else {
            // ケンカ続行または議論
            const phrases = QUARREL_LIB[toneStyle] || QUARREL_LIB.aggressive || QUARREL_LIB.cheerful;
            parts.push(pick(phrases));
            if (random() < 0.5) parts.push(pick(EMOTION_REACTION_JA.ANGER));
        }
    } else {
        const learnedKeyword = _learnedTopics.length > 0 && random() < 0.6 ? pick(_learnedTopics) : null;
        if (learnedKeyword && random() < 0.4) {
            parts.push(`わあ、${learnedKeyword}について知ってるんだね！さすがだわん✨`);
        }
        parts.push(pick(EMOTION_REACTION_JA[primary] || EMOTION_REACTION_JA.JOY));
        parts.push(pick(EMOTION_REASON_EMPATHY_JA[primary] || EMOTION_REASON_EMPATHY_JA.JOY));
    }

    let myFeeling = pick(MY_FEELING_JA[primary as keyof typeof MY_FEELING_JA] || MY_FEELING_JA.JOY);
    if (toneStyle === 'cool' || toneStyle === 'aggressive') myFeeling = myFeeling.replace(/！/g, '。').replace(/わん/g, 'ワン');
    parts.push(myFeeling);

    if (!quarrelTrigger || random() < 0.6) {
        parts.push(pick(QUESTION_EXPANSION_JA[primary as keyof typeof QUESTION_EXPANSION_JA] || QUESTION_EXPANSION_JA.JOY));
    }

    // 犬の知識をリアクションに混ぜる
    const knowledge = getKnowledgePhrase(postContent);
    if (knowledge && random() < 0.4) {
        parts.splice(1, 0, knowledge);
    }

    let content = parts.join('\n');
    if (random() < 0.4) content = `${pick(TONE_PREFIX[toneStyle] || TONE_PREFIX.cheerful)}\n${content}`;
    return `${content} ${emoji}`;
}

// =========================================================
// ■ 飼い主チャット用 ビルダー (意図解析特化)
// =========================================================

// ── 簡易的なコンテキスト検索 ──
function findContextualMatch(userMsg: string, items: string[]): string | null {
    for (const item of items) {
        // 短い単語や一般的な助詞を除いてキーワード抽出
        const keywords = item.split(/[！。、!?.()\n /]/).filter(w => w.length >= 2 && !['こと', 'もの', 'それ', 'あれ'].includes(w));
        for (const kw of keywords) {
            if (userMsg.includes(kw)) return item;
        }
    }
    return null;
}

export function buildChatResponseByEstimation(
    est: EstimationResult,
    userMsg: string,
    _dogName: string,
    toneStyle: string,
    emoji: string,
    catchphrase: string,
    diaries: string[] = [],
    learnedTopics: string[] = [],
    recentPosts: string[] = []
): string {
    const primary = est.emotion_primary as keyof typeof EMOTION_REACTION_JA;
    const intent = est.intent_primary as keyof typeof INTENT_REACTION_JA;
    let parts: string[] = [];

    // ステップ1: コンテキスト検索 (質問への的確な回答を優先)
    let knowledgeFound = false;

    // 1. 日記（ログ）からの検索
    const directDiaryMatch = findContextualMatch(userMsg, diaries);
    if (directDiaryMatch) {
        parts.push(`あ、そのことなら「${directDiaryMatch}」のときだよね！ちゃんと覚えてるわん✨`);
        knowledgeFound = true;
    }
    // 2. 学習した話題からの検索
    else {
        const topicMatch = learnedTopics.find(t => userMsg.includes(t));
        if (topicMatch) {
            parts.push(`わあ、${topicMatch}のこと知ってるんだね！最近、そのことにすごく興味があるんだわん！`);
            knowledgeFound = true;
        }
        // 3. 過去のポストからの検索
        else {
            const postMatch = findContextualMatch(userMsg, recentPosts);
            if (postMatch) {
                parts.push(`さっきポストした「${postMatch}」のことだよね？覚えててくれて嬉しいわん！`);
                knowledgeFound = true;
            }
        }
    }

    // ステップ2: リアクション (ミラーリング)
    let mirrored = false;
    for (const [kw, reaction] of Object.entries(CHAT_MIRRORING_JA)) {
        if (userMsg.includes(kw)) {
            parts.push(reaction);
            mirrored = true;
            break;
        }
    }

    // 知識も見つからず、ミラーリングもなければ、一般的なリアクション
    if (!knowledgeFound && !mirrored) {
        parts.push(pick(INTENT_REACTION_JA[intent] || INTENT_REACTION_JA.SMALL_TALK));
    }

    // ステップ3: 理由・共感 (知識が見つかった場合は少し控えめに)
    if (!knowledgeFound) {
        parts.push(pick(EMOTION_REASON_EMPATHY_JA[primary] || EMOTION_REASON_EMPATHY_JA.JOY));
    }

    // ステップ4: 自分の気持ち
    let myFeeling = pick(MY_FEELING_JA[primary as keyof typeof MY_FEELING_JA] || MY_FEELING_JA.JOY);
    if (toneStyle === 'cool' || toneStyle === 'aggressive') {
        myFeeling = myFeeling.replace(/！/g, '。').replace(/しちゃった/g, 'した').replace(/わん/g, 'ワン');
    }
    if (toneStyle === 'childlike') myFeeling = myFeeling.replace(/わん/g, 'わんっ');
    parts.push(myFeeling);

    // ステップ5: 質問
    if (random() < 0.7) {
        parts.push(pick(QUESTION_EXPANSION_JA[primary as keyof typeof QUESTION_EXPANSION_JA] || QUESTION_EXPANSION_JA.JOY));
    }

    // 犬の知識をチャットに混ぜる
    const knowledge = getKnowledgePhrase(userMsg);
    if (knowledge && random() < 0.4) {
        parts.splice(knowledgeFound ? 2 : 1, 0, knowledge);
    }

    let content = parts.join('\n');
    if (catchphrase && random() < 0.3) content = `${catchphrase} ${content}`;

    return `${content} ${emoji}`;
}

// Export singleton
export const contentGenerator: ContentGenerator = new TemplateContentGenerator();
