// =========================================================
// 犬の感情推定エンジン (Emotion Estimation Engine)
// 投稿から犬の「主感情」「意図」「求めている反応」を抽出
// =========================================================

export type Emotion =
    | 'JOY' | 'EXCITEMENT' | 'RELIEF' | 'AFFECTION' | 'PRIDE'
    | 'ANTICIPATION' | 'SURPRISE' | 'ANXIETY' | 'LONELINESS'
    | 'ANGER' | 'SADNESS' | 'CONFUSION' | 'JEALOUSY';

export type Intent =
    | 'SHARE_JOY' | 'SHOW_OFF' | 'SEEK_EMPATHY' | 'SEEK_SUPPORT'
    | 'ASK_ADVICE' | 'SEEK_ATTENTION' | 'SHARE_INFO' | 'SMALL_TALK'
    | 'VENT' | 'INVITE';

export type Need = 'PRAISE' | 'EMPATHY' | 'REASSURE' | 'ADVICE' | 'CELEBRATE' | 'ENGAGE';

export interface EstimationResult {
    emotion_primary: Emotion;
    emotion_secondary: Emotion[];
    intent_primary: Intent;
    needs: Need[];
    confidence: number;
    tone: 'light' | 'serious' | 'clingy' | 'brag' | 'consult';
    risk_flags: string[];
}

// ── キーワード辞書 ──
const KEYWORDS: Record<string, { emotion: Emotion; weight: number }[]> = {
    // 喜び
    '最高': [{ emotion: 'JOY', weight: 2 }, { emotion: 'EXCITEMENT', weight: 1 }],
    'うれしい': [{ emotion: 'JOY', weight: 2 }],
    'しあわせ': [{ emotion: 'JOY', weight: 2 }, { emotion: 'RELIEF', weight: 1 }],
    'やった': [{ emotion: 'JOY', weight: 1 }, { emotion: 'EXCITEMENT', weight: 2 }],
    '楽しい': [{ emotion: 'JOY', weight: 2 }],
    // 寂しさ
    'さみしい': [{ emotion: 'LONELINESS', weight: 3 }, { emotion: 'SADNESS', weight: 1 }],
    '寂しい': [{ emotion: 'LONELINESS', weight: 3 }],
    'ひとり': [{ emotion: 'LONELINESS', weight: 2 }],
    '一人': [{ emotion: 'LONELINESS', weight: 1 }],
    '会いたい': [{ emotion: 'LONELINESS', weight: 1 }, { emotion: 'AFFECTION', weight: 2 }],
    'かまって': [{ emotion: 'LONELINESS', weight: 2 }],
    // 不安
    'こわい': [{ emotion: 'ANXIETY', weight: 3 }],
    'どうしよう': [{ emotion: 'ANXIETY', weight: 2 }, { emotion: 'CONFUSION', weight: 2 }],
    '不安': [{ emotion: 'ANXIETY', weight: 3 }],
    '苦手': [{ emotion: 'ANXIETY', weight: 1 }],
    // 自慢・誇り
    '見て': [{ emotion: 'PRIDE', weight: 2 }],
    'みて': [{ emotion: 'PRIDE', weight: 1 }],
    '褒めて': [{ emotion: 'PRIDE', weight: 3 }],
    'できた': [{ emotion: 'PRIDE', weight: 2 }, { emotion: 'JOY', weight: 1 }],
    'すごくない': [{ emotion: 'PRIDE', weight: 2 }],
    // 相談
    'どう思う': [{ emotion: 'CONFUSION', weight: 2 }],
    '教えて': [{ emotion: 'ANTICIPATION', weight: 1 }],
    '助けて': [{ emotion: 'ANXIETY', weight: 2 }, { emotion: 'SADNESS', weight: 1 }],
    'おすすめ': [{ emotion: 'ANTICIPATION', weight: 1 }],
    // 不満・怒り
    'なんで': [{ emotion: 'ANGER', weight: 1 }, { emotion: 'CONFUSION', weight: 2 }],
    'ありえない': [{ emotion: 'ANGER', weight: 2 }],
    'ムカつく': [{ emotion: 'ANGER', weight: 3 }],
    'しゅん': [{ emotion: 'SADNESS', weight: 2 }],
    // 嫉妬
    'いいなあ': [{ emotion: 'JEALOUSY', weight: 3 }],
    '羨ましい': [{ emotion: 'JEALOUSY', weight: 3 }],
    'ずるい': [{ emotion: 'JEALOUSY', weight: 2 }],
    '私じゃない': [{ emotion: 'JEALOUSY', weight: 2 }],
    'いいな': [{ emotion: 'JEALOUSY', weight: 1.5 }],
};

const SYMBOLS: Record<string, { emotion: Emotion; weight: number }[]> = {
    '!': [{ emotion: 'EXCITEMENT', weight: 0.5 }],
    '！': [{ emotion: 'EXCITEMENT', weight: 0.5 }],
    '…': [{ emotion: 'LONELINESS', weight: 0.5 }, { emotion: 'SADNESS', weight: 0.5 }, { emotion: 'CONFUSION', weight: 0.3 }],
    '?': [{ emotion: 'ANXIETY', weight: 0.3 }, { emotion: 'CONFUSION', weight: 0.5 }],
};

const EMOJIS: Record<string, { emotion: Emotion; weight: number }[]> = {
    '😭': [{ emotion: 'SADNESS', weight: 1.5 }],
    '😢': [{ emotion: 'SADNESS', weight: 1 }],
    '😤': [{ emotion: 'ANGER', weight: 1.5 }],
    '💢': [{ emotion: 'ANGER', weight: 2 }],
    '✨': [{ emotion: 'JOY', weight: 0.5 }, { emotion: 'ANTICIPATION', weight: 0.5 }],
    '💕': [{ emotion: 'AFFECTION', weight: 1 }],
    '🐾': [{ emotion: 'JOY', weight: 0.3 }],
};

export class EmotionEngine {
    static estimate(text: string): EstimationResult {
        const scores: Record<Emotion, number> = {
            JOY: 0, EXCITEMENT: 0, RELIEF: 0, AFFECTION: 0, PRIDE: 0,
            ANTICIPATION: 0, SURPRISE: 0, ANXIETY: 0, LONELINESS: 0,
            ANGER: 0, SADNESS: 0, CONFUSION: 0, JEALOUSY: 0
        };

        // 1. キーワードスコアリング
        for (const [kw, effects] of Object.entries(KEYWORDS)) {
            if (text.includes(kw)) {
                effects.forEach(e => scores[e.emotion] += e.weight);
            }
        }

        // 2. 記号スコアリング
        for (const [sym, effects] of Object.entries(SYMBOLS)) {
            const count = (text.match(new RegExp(`\\${sym}`, 'g')) || []).length;
            if (count > 0) {
                effects.forEach(e => scores[e.emotion] += e.weight * Math.min(count, 3));
            }
        }

        // 3. 絵文字スコアリング
        for (const [emo, effects] of Object.entries(EMOJIS)) {
            if (text.includes(emo)) {
                effects.forEach(e => scores[e.emotion] += e.weight);
            }
        }

        // 4. スコア順にソート
        const sortedEmotions = (Object.entries(scores) as [Emotion, number][])
            .sort((a, b) => b[1] - a[1]);

        const top1 = sortedEmotions[0];
        const top2 = sortedEmotions[1];

        const emotion_primary = top1[1] > 0 ? top1[0] : 'JOY';
        const emotion_secondary = sortedEmotions.slice(1, 3)
            .filter(e => e[1] > 0.5)
            .map(e => e[0]);

        // 5. 意図推定
        let intent_primary: Intent = 'SMALL_TALK';
        if (text.includes('どう思う') || text.includes('教えて') || text.includes('どっち')) intent_primary = 'ASK_ADVICE';
        else if (text.includes('見て') || text.includes('褒めて') || text.includes('できた')) intent_primary = 'SHOW_OFF';
        else if (scores.JOY > 2 || scores.EXCITEMENT > 2) intent_primary = 'SHARE_JOY';
        else if (scores.SADNESS > 1.5 || scores.LONELINESS > 1.5) intent_primary = 'SEEK_SUPPORT';
        else if (scores.ANGER > 1.5) intent_primary = 'VENT';
        else if (scores.JEALOUSY > 2) intent_primary = 'VENT';
        else if (text.includes('わかる') || text.includes('ねえ')) intent_primary = 'SEEK_EMPATHY';

        // 6. Needs抽出
        const needs: Need[] = [];
        if (intent_primary === 'SHOW_OFF') needs.push('PRAISE', 'CELEBRATE');
        else if (intent_primary === 'SHARE_JOY') needs.push('CELEBRATE', 'ENGAGE');
        else if (intent_primary === 'SEEK_SUPPORT' || emotion_primary === 'SADNESS' || emotion_primary === 'ANXIETY') needs.push('EMPATHY', 'REASSURE');
        else if (intent_primary === 'ASK_ADVICE') needs.push('ADVICE', 'ENGAGE');
        else if (intent_primary === 'VENT') needs.push('EMPATHY');
        else needs.push('ENGAGE');

        // 7. Tone & Confidence
        const confidence = Math.min(1, (top1[1] - (top2?.[1] || 0)) / 2 + 0.3);

        let tone: EstimationResult['tone'] = 'light';
        if (scores.LONELINESS > 2 || scores.AFFECTION > 2) tone = 'clingy';
        else if (scores.PRIDE > 2) tone = 'brag';
        else if (intent_primary === 'ASK_ADVICE') tone = 'consult';
        else if (scores.SADNESS > 2 || scores.ANXIETY > 2) tone = 'serious';

        return {
            emotion_primary,
            emotion_secondary,
            intent_primary,
            needs,
            confidence,
            tone,
            risk_flags: []
        };
    }
}
