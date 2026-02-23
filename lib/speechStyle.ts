/**
 * ======================================================
 *  DOG SPEECH STYLE ENGINE — ULTRA EXPANDED
 *  犬種別語尾システム（35犬種・300+語尾）
 * ======================================================
 */

// ============================================================
// ■ 語尾ライブラリ（感情別グループ）
// ============================================================

export const GOBI = {
    /** 喜び系 — 伸ばし・感嘆 */
    joy: [
        'だワン！', 'なのワン！', 'だよ〜！', 'だねぇ！', 'なの〜！',
        'なんだもん！', 'だよぉ！', 'よぉ〜！', 'えへへなのだ！', 'だぜぇ！',
        'なのさぁ！', 'だもーん！', 'ワンよ！', 'ワンだよ！', 'だよん！',
        'なのよ！', 'だもんね！', 'だよねぇ！', 'かなぁ…！', 'えへなの！',
    ],
    /** 甘え系 — 柔らか・伸ばし */
    clingy: [
        'なのぉ', 'だよぉ', 'なの〜', 'だもんよ', 'だよね', 'かなぁ…',
        'なのよね', 'だよねぇ', 'だもんっ', 'えへなの', 'えへへなの',
        'なのだよ', 'なのかなぁ', 'ふふなのよ', 'なんだもんね', 'だよぉね',
        'なのかな', 'かなって', 'なのさぁ', 'よぉ〜',
    ],
    /** 怒り系 — 短・鋭語尾 */
    anger: [
        'だぞ', 'だ', 'なのだ', 'である', 'であるぞ', 'だな', 'だぜ',
        'だろ', 'だぞぉ', 'なのだぞ', 'であるな', 'だぜよ', 'だろな',
        'なのだよ', 'だなぁ', 'であるよ', 'なのだぞぉ', 'だなだぞ', 'であるかな', 'だぜな',
    ],
    /** 悲しみ系 — 弱・省略 */
    sad: [
        'かな…', 'なの…', 'かなぁ…', 'だもん…', 'なのかな…',
        'かもね…', 'だよね…', 'かなって…', 'なのよ…', 'かもなぁ…',
        'かも…', 'だな…', 'だよ…', 'なのかなぁ…', 'だもんよ…',
        'えへなのよ…', 'ふふなの…', 'よぉ…', 'なのさ…', 'かもかも…',
    ],
    /** 興奮系 — 強・連続！ */
    excited: [
        'だワン！！', 'なのっ！！', 'だよっ！', 'だもんっ！', 'かなっ！',
        'だぞっ！', 'だなっ！！', 'よっ！！', 'ねっ！！', '〜なのっ！！',
        'ワンワン！！', 'だよっ！！', 'なのだっ！！', 'わふっ！！', 'ブヒっ！！',
        'だぜっ！！', 'なのだっ！', 'えへへっ！！', 'だもんっ！！', 'ぷぐっ！！',
    ],
    /** 疑問系 — 語尾上げ */
    question: [
        'かな？', 'なの？', 'だよね？', 'だろ？', 'かも？',
        'なのかな？', 'かなって？', 'でござるか？', 'であるか？', 'だな？',
        'なのかなぁ？', 'かなだよ？', 'かもだよね？', 'なのさ？', 'だぜ？',
        'なのだろ？', 'よぉ？', 'かもね？', 'だよな？', 'なのよ？',
    ],
    /** ニュートラル — 自然な語尾 */
    neutral: [
        'だよ', 'だね', 'なの', 'かな', 'だな', 'かも', 'よ',
        'だよね', 'なのよ', 'なのだよ', 'なのさ', 'だろ', 'だぜ',
        'だなぁ', 'よぉ', 'だもん', 'えへなの', 'ふふなの', 'なのだ', 'かもね',
    ],
};

// ============================================================
// ■ 擬音語尾（犬種特有）
// ============================================================

export const GION_GOBI = {
    フレンチブルドッグ: ['ブヒ', 'ブヒだ', 'ブヒよ', 'ブヒね', 'ブヒなの', 'ブヒかも', 'ブヒだよ', 'ブヒだね', 'ブヒなのだ', 'ブヒだぞ', 'ブヒっ'],
    パグ: ['ぷぐ', 'ぷぐだ', 'ぷぐよ', 'ぷぐね', 'ぷぐなの', 'ぷぐだよ', 'ぷぐだね', 'ぷぐかも', 'ぷぐだぞ', 'ぷぐなのだ', 'ぷぐっ'],
    柴犬: ['わん', 'だワン', 'なのワン', 'ワンよ', 'ワンね', 'ワンだよ', 'ワンなの', 'ワンかも', 'ワンだね', 'ワンだぞ', 'ワンっ'],
    秋田犬: ['わん', 'だワン', 'なのワン', 'ワンよ', 'ワンね', 'ワンだよ', 'ワンなの', 'ワンかも', 'ワンだね', 'ワンだぞ', 'ワンっ'],
    ビーグル: ['わふ', 'わふだ', 'わふね', 'わふよ', 'わふなの', 'わふだよ', 'わふかも', 'わふだね', 'わふなのだ', 'わふだぞ', 'わふっ'],
    ゴールデンレトリバー: ['わふ', 'わふだ', 'わふね', 'わふよ', 'わふなの', 'わふだよ', 'わふかも', 'わふだね', 'わふなのだ', 'わふだぞ'],
    ラブラドール: ['わふ', 'わふだ', 'わふね', 'わふよ', 'わふなの', 'わふだよ', 'わふかも', 'わふだね', 'わふなのだ', 'わふだぞ'],
    ジャーマンシェパード: ['でござる', 'でござるよ', 'でござるな', 'でござるぞ', 'でござるか', 'でござるかな', 'でござるね', 'でござるのだ', 'でござるよぉ', 'でござるなぁ'],
    ドーベルマン: ['である', 'であるぞ', 'であるな', 'であるよ', 'であるなぁ', 'であるか', 'であるかな', 'であるぞぉ', 'であるのだ', 'であるよね'],
    ロットワイラー: ['だぞ', 'だぜ', 'だな', 'である', 'であるぞ', 'だろ', 'なのだ', 'なのだぞ', 'だなぁ', 'だぜよ'],
};

// ============================================================
// ■ 犬種ベース語尾マッピング（35犬種）
// ============================================================

export const BREED_GOBI_MAP: Record<string, keyof typeof GION_GOBI | 'neutral_soft' | 'neutral_formal' | 'neutral_cute' | 'neutral_energetic'> = {
    // 擬音語尾あり
    柴犬: '柴犬',
    秋田犬: '秋田犬',
    フレンチブルドッグ: 'フレンチブルドッグ',
    パグ: 'パグ',
    ビーグル: 'ビーグル',
    ゴールデンレトリバー: 'ゴールデンレトリバー',
    ラブラドール: 'ラブラドール',
    ジャーマンシェパード: 'ジャーマンシェパード',
    ドーベルマン: 'ドーベルマン',
    ロットワイラー: 'ロットワイラー',
    // 柔らか系
    トイプードル: 'neutral_cute',
    チワワ: 'neutral_cute',
    ポメラニアン: 'neutral_cute',
    シーズー: 'neutral_cute',
    マルチーズ: 'neutral_cute',
    ヨークシャーテリア: 'neutral_cute',
    キャバリア: 'neutral_cute',
    ペキニーズ: 'neutral_cute',
    ミックス犬: 'neutral_cute',
    日本スピッツ: 'neutral_cute',
    // 元気系
    コーギー: 'neutral_energetic',
    ボーダーコリー: 'neutral_energetic',
    ジャックラッセル: 'neutral_energetic',
    ボストンテリア: 'neutral_energetic',
    ウェルシュテリア: 'neutral_energetic',
    イタリアングレーハウンド: 'neutral_energetic',
    ウィペット: 'neutral_energetic',
    // 穏やか系
    バーニーズマウンテン: 'neutral_soft',
    サモエド: 'neutral_soft',
    グレートピレニーズ: 'neutral_soft',
    シベリアンハスキー: 'neutral_soft',
    チャウチャウ: 'neutral_soft',
    アメリカンコッカー: 'neutral_soft',
    // フォーマル系
    ミニチュアシュナウザー: 'neutral_formal',
    ダックスフンド: 'neutral_formal',
};

// ============================================================
// ■ ベース語尾グループ（擬音以外）
// ============================================================

const NEUTRAL_CUTE_BASE = [
    'なのっ', 'だよぉ', 'えへへなの', 'なの〜', 'だもんっ',
    'かなぁ', 'えへなのよ', 'ふふなの', 'だよん', 'なのかなぁ',
    'なのさぁ', 'だもんよ', 'なのだよ', 'よぉ〜', 'なのよね',
];
const NEUTRAL_ENERGETIC_BASE = [
    'だよっ！', 'なのっ！', 'だぜっ！', 'だワン！', 'わふっ！',
    'なのだっ！', 'だよっ！！', 'だもんっ！', 'えへへっ！', 'ワンワン！',
    'だよね！', 'なのだぞっ！', 'だぞっ！', 'よっ！', 'かなっ！',
];
const NEUTRAL_SOFT_BASE = [
    'だよ', 'だね', 'なのだよ', 'かなぁ…', 'だもん', 'なのかな',
    'よぉ', 'だなぁ', 'かもね', 'なのよ', 'だよね', 'ふふなの',
    'えへなの', 'なのさ', 'だろ',
];
const NEUTRAL_FORMAL_BASE = [
    'でござる', 'でございます', 'なのだ', 'である', 'なのです',
    'でございますよ', 'であります', 'なのでございます', 'でござるよ', 'であろう',
    'なのだよ', 'でございますかな', 'なのであります', 'であるぞ', 'でございますな',
];

// ============================================================
// ■ 流行語尾の状態（サーバーサイドシングルトン）
// ============================================================

interface TrendEntry { gobi: string; score: number; usedAt: Date }

const MAX_TREND_GOBIS = 5;
const trendingGobis: TrendEntry[] = [];

/** 語尾の流行スコアを加算 */
export function boostTrendGobi(gobi: string, amount = 1) {
    const existing = trendingGobis.find(e => e.gobi === gobi);
    if (existing) {
        existing.score += amount;
        existing.usedAt = new Date();
    } else {
        trendingGobis.push({ gobi, score: amount, usedAt: new Date() });
    }
    // スコア上位5件を保持
    trendingGobis.sort((a, b) => b.score - a.score);
    if (trendingGobis.length > MAX_TREND_GOBIS) trendingGobis.length = MAX_TREND_GOBIS;
}

/** 現在の流行語尾一覧を取得 */
export function getTrendingGobis(): string[] {
    return trendingGobis.map(e => e.gobi);
}

// ============================================================
// ■ メイン語尾選択ロジック
// ============================================================

export type Emotion = 'joy' | 'clingy' | 'anger' | 'sad' | 'excited' | 'question' | 'neutral';

export interface SpeechContext {
    breed: string;
    emotion: Emotion;
    relationshipScore?: number; // 0-10: 仲良し度
    toneStyle?: string;
    followingBreeds?: string[]; // フォロー中の犬種（語尾伝染）
    customBreedGobi?: string; // ユーザー定義語尾
}

function pickFromArr<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * ブリードに対応するベース語尾プールを返す
 */
function getBreedGobiPool(breed: string): string[] {
    const key = BREED_GOBI_MAP[breed];
    if (!key) return NEUTRAL_CUTE_BASE;
    if (key in GION_GOBI) return GION_GOBI[key as keyof typeof GION_GOBI];
    if (key === 'neutral_cute') return NEUTRAL_CUTE_BASE;
    if (key === 'neutral_energetic') return NEUTRAL_ENERGETIC_BASE;
    if (key === 'neutral_soft') return NEUTRAL_SOFT_BASE;
    if (key === 'neutral_formal') return NEUTRAL_FORMAL_BASE;
    return NEUTRAL_CUTE_BASE;
}

/**
 * 感情から語尾プールを返す
 */
function getEmotionGobiPool(emotion: Emotion): string[] {
    return GOBI[emotion] ?? GOBI.neutral;
}

/**
 * メインの語尾選択関数
 *
 * アルゴリズム:
 * 1. 毎回必ず語尾を付けるわけではない（自然な頻度）
 * 2. 流行語尾を確率的に採用
 * 3. 犬種ベース語尾と感情語尾を混合
 * 4. 仲良し度が高い犬の語尾が伝染する
 */
export function selectGobi(ctx: SpeechContext): string {
    const { breed, emotion, relationshipScore = 5, toneStyle = 'cheerful', followingBreeds = [] } = ctx;

    // 30%の確率で語尾なし（自然さ）→ただし感情が強い場合は85%
    const isStrongEmotion = emotion === 'excited' || emotion === 'joy' || emotion === 'anger';
    const useGobiProb = isStrongEmotion ? 0.85 : 0.60;
    if (Math.random() > useGobiProb) return '';

    // 流行語尾の採用（人気ワンちゃんの語尾が伝染する効果）
    const trends = getTrendingGobis();
    if (trends.length > 0 && Math.random() < 0.18) {
        return pickFromArr(trends);
    }

    // フォロー中の犬の語尾伝染（仲良し度高いほど確率UP）
    if (followingBreeds.length > 0 && Math.random() < (relationshipScore / 10) * 0.3) {
        const randomFollowBreed = pickFromArr(followingBreeds);
        const pool = getBreedGobiPool(randomFollowBreed);
        return pickFromArr(pool);
    }

    // toneStyleによる補正
    let emotionToUse = emotion;
    if (toneStyle === 'cool' && emotion === 'clingy') emotionToUse = 'neutral';
    if (toneStyle === 'aggressive' && emotion === 'clingy') emotionToUse = 'anger';
    if (toneStyle === 'timid' && emotion === 'anger') emotionToUse = 'sad';
    if (toneStyle === 'formal') emotionToUse = 'neutral';

    // 犬種ベース語尾 vs 感情語尾（60:40で混合）
    const useBreedGobi = Math.random() < 0.60;
    if (useBreedGobi) {
        const pool = getBreedGobiPool(breed);
        const chosen = pickFromArr(pool);
        // 流行スコアを加算
        boostTrendGobi(chosen, 0.5);
        return chosen;
    } else {
        const pool = getEmotionGobiPool(emotionToUse);
        const chosen = pickFromArr(pool);
        boostTrendGobi(chosen, 0.3);
        return chosen;
    }
}

/**
 * テキストの末尾に語尾を自然に付ける
 * 文章が「。」「！」「？」などで終わる場合は末尾の記号を調整
 */
export function applyGobi(text: string, ctx: SpeechContext): string {
    const gobi = selectGobi(ctx);
    if (!gobi) return text;

    // 文章の最後の記号を取り除いて語尾をつける
    const trimmed = text.trimEnd();
    const lastChar = trimmed[trimmed.length - 1];
    const removeLastPunct = ['。', '、', '…', '～', '〜'].includes(lastChar);
    const base = removeLastPunct ? trimmed.slice(0, -1) : trimmed;
    return `${base}${gobi}`;
}

/**
 * 感情推定（テキストから自動判定）
 */
export function estimateEmotion(text: string): Emotion {
    if (/！！|やばい|すごい|たまらない|うれし|最高|優勝|テンションMAX/.test(text)) return 'excited';
    if (/かな[…？]|なの[…？]|悲し|さみし|しゅん|辛い/.test(text)) return 'sad';
    if (/怒|ムカ|嫌|納得いかない|ガウ|ガオー|吠え/.test(text)) return 'anger';
    if (/えへ|くっつき|そばにい|ぴと|甘え|だいすき|大好き/.test(text)) return 'clingy';
    if (/うれし|しあわせ|最高|天国|優勝|ありがと|よかった/.test(text)) return 'joy';
    if (/\?|？|どう|なに|なぜ|どこ|どっち|どれ|どなた/.test(text)) return 'question';
    return 'neutral';
}

// ============================================================
// ■ ショートカット関数
// ============================================================

/**
 * 投稿テキストに語尾を付与する（コンテンツジェネレーターから呼ぶ）
 */
export function addSpeechStyle(
    content: string,
    breed: string,
    toneStyle: string,
    followingBreeds: string[] = []
): string {
    const emotion = estimateEmotion(content);
    return applyGobi(content, { breed, emotion, toneStyle, followingBreeds });
}
