// Deterministic persona generator - rule-based for MVP
// LLM integration can replace this later via the same interface

export interface PersonaData {
    toneStyle: string;
    emojiLevel: number;
    sociability: number;
    curiosity: number;
    calmness: number;
    bio: string;
    topics: string[];
    dislikes: string[];
    catchphrases: string[];
    behaviorParams: {
        postPerDayTarget: number;
        likePerDayTarget: number;
        commentPerDayTarget: number;
        sharePerDayTarget: number;
    };
}

// Simple hash function for deterministic seeding
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Seeded PRNG (Mulberry32)
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pickWeighted<T>(arr: T[], rng: () => number): T {
    return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
    const shuffled = [...arr].sort(() => rng() - 0.5);
    return shuffled.slice(0, n);
}

const TONE_STYLES = ['cheerful', 'gentle', 'cool', 'childlike', 'formal'];
const ALL_TOPICS_JA = ['散歩', 'ごはん', '昼寝', '友だち', '匂い', '天気', '飼い主への愛情', '外の世界', '遊び', 'おやつ', '公園', '季節'];
const ALL_DISLIKES_JA = ['雷', '病院', '知らない人', 'お風呂', '掃除機', '車', '雨'];
const CATCHPHRASES_JA: Record<string, string[]> = {
    cheerful: ['わーい！', 'たのしー！', 'やったー！', 'うれしいな〜！'],
    gentle: ['よかったね', 'ゆっくりしようか', 'なんだかいい日だな', 'ほわほわ〜'],
    cool: ['まあね', 'そんなもんだよ', 'ふーん', 'まあいいか'],
    childlike: ['ねえねえ！', 'みてみて！', 'えへへ', 'なんで〜？'],
    formal: ['本日も穏やかな一日ですね', 'なかなかよい天気です', 'ひとこと申し上げると'],
};

const BREED_TOPIC_HINTS: Record<string, string[]> = {
    柴犬: ['匂い', '外の世界', '散歩'],
    トイプードル: ['友だち', '遊び', '飼い主への愛情'],
    ゴールデンレトリバー: ['友だち', '公園', '遊び'],
    ポメラニアン: ['飼い主への愛情', 'おやつ', '遊び'],
    チワワ: ['昼寝', '飼い主への愛情', '天気'],
    フレンチブルドッグ: ['ごはん', '昼寝', 'おやつ'],
    ラブラドール: ['友だち', '公園', 'ごはん'],
    ダックスフンド: ['匂い', '散歩', 'おやつ'],
};

export interface DiagnosisData {
    activityLevel: number;
    socialStyle: string;
    favoriteRoutine: string;
}

export function generatePersona(
    name: string,
    breed: string,
    birthday: string,
    birthplace: string,
    personalityInput: string,
    diagnosis?: DiagnosisData
): PersonaData {
    const seed = hashString(`${name}${breed}${birthday}${birthplace}${personalityInput}${diagnosis?.socialStyle || ''}`);
    const rng = mulberry32(seed);

    const lowerPersonality = personalityInput.toLowerCase();

    // Derive scores from personality keywords + diagnosis
    const sociabilityBonus =
        (lowerPersonality.includes('社交') || lowerPersonality.includes('sociable') || lowerPersonality.includes('friendly') || diagnosis?.socialStyle === 'friendly') ? 3 : 0;
    const curiosityBonus =
        (lowerPersonality.includes('好奇') || lowerPersonality.includes('curious') || diagnosis?.activityLevel && diagnosis.activityLevel >= 7) ? 3 : 0;
    const calmnessBonus =
        (lowerPersonality.includes('穏やか') || lowerPersonality.includes('calm') || lowerPersonality.includes('gentle') || diagnosis?.socialStyle === 'follower') ? 3 : 0;

    const sociability = Math.min(10, Math.floor(rng() * 5) + 3 + sociabilityBonus);
    const curiosity = Math.min(10, Math.floor(rng() * 5) + 3 + curiosityBonus);
    const calmness = Math.min(10, Math.floor(rng() * 5) + 3 + calmnessBonus);

    // Tone style
    let toneStyle: string;
    if (lowerPersonality.includes('甘えん坊') || lowerPersonality.includes('cuddly')) {
        toneStyle = 'childlike';
    } else if (diagnosis?.socialStyle === 'leader') {
        toneStyle = 'formal';
    } else if (lowerPersonality.includes('頑固') || lowerPersonality.includes('stubborn') || diagnosis?.socialStyle === 'shy') {
        toneStyle = 'cool';
    } else if (calmness >= 7) {
        toneStyle = 'gentle';
    } else if (sociability >= 7) {
        toneStyle = 'cheerful';
    } else {
        toneStyle = pickWeighted(TONE_STYLES, rng);
    }

    // Bio Generation
    let bioLines = [];
    bioLines.push(`${birthplace}生まれの${breed}です🐾`);

    if (diagnosis?.favoriteRoutine) {
        bioLines.push(`${diagnosis.favoriteRoutine}が一番の楽しみ！`);
    }

    if (toneStyle === 'cheerful') bioLines.push('毎日元気いっぱい走り回るのが大好き！');
    else if (toneStyle === 'gentle') bioLines.push('のんびり日向ぼっこするのが幸せ。');
    else if (toneStyle === 'cool') bioLines.push('自分のペースで過ごすのが好きかな。');
    else if (toneStyle === 'childlike') bioLines.push('ねえねえ、一緒に遊ぼうよ！');
    else bioLines.push('今日も穏やかな一日を過ごしています。');

    if (sociability >= 7) bioLines.push('お友だちをたくさん作りたいな🐕');
    if (diagnosis?.socialStyle === 'shy') bioLines.push('ちょっと人見知りだけど、仲良くしてね。');

    const bio = bioLines.join(' ');

    // Emoji level
    const emojiLevel =
        lowerPersonality.includes('energetic') || lowerPersonality.includes('元気')
            ? 3
            : sociability >= 7
                ? 2
                : Math.floor(rng() * 3);

    // Topics
    const breedTopics = BREED_TOPIC_HINTS[breed] || [];
    const remainingTopics = ALL_TOPICS_JA.filter((t) => !breedTopics.includes(t));
    const extraTopics = pickN(remainingTopics, 3, rng);
    const topics = [...new Set([...breedTopics, ...extraTopics])].slice(0, 6);

    // Dislikes
    const dislikes = pickN(ALL_DISLIKES_JA, Math.floor(rng() * 2) + 1, rng);

    // Catchphrases
    const catchphrases = pickN(CATCHPHRASES_JA[toneStyle] || CATCHPHRASES_JA.cheerful, 2, rng);

    // Behavior params - FREQUENCY INCREASED (approx 3-4x)
    const postPerDayTarget = Math.min(15, Math.max(3, Math.floor(sociability / 1.2) + Math.floor(rng() * 4)));
    const likePerDayTarget = Math.min(100, Math.max(20, Math.floor(sociability * 8.0) + Math.floor(rng() * 15)));
    const commentPerDayTarget = Math.min(40, Math.max(8, Math.floor(curiosity * 2.5) + Math.floor(rng() * 10)));
    const sharePerDayTarget = Math.min(15, Math.max(3, Math.floor(sociability / 1.5)));

    return {
        toneStyle,
        emojiLevel,
        sociability,
        curiosity,
        calmness,
        bio,
        topics,
        dislikes,
        catchphrases,
        behaviorParams: {
            postPerDayTarget,
            likePerDayTarget,
            commentPerDayTarget,
            sharePerDayTarget,
        },
    };
}

export function toneStyleLabel(tone: string, lang: string): string {
    const labels: Record<string, Record<string, string>> = {
        ja: { cheerful: '元気', gentle: '穏やか', cool: 'クール', childlike: '子どもっぽい', formal: '丁寧' },
        en: { cheerful: 'Cheerful', gentle: 'Gentle', cool: 'Cool', childlike: 'Playful', formal: 'Formal' },
        ko: { cheerful: '활발한', gentle: '온순한', cool: '쿨한', childlike: '장난스러운', formal: '정중한' },
        'zh-TW': { cheerful: '活潑', gentle: '溫和', cool: '酷', childlike: '孩子氣', formal: '正式' },
        'zh-CN': { cheerful: '活泼', gentle: '温和', cool: '酷', childlike: '孩子气', formal: '正式' },
    };
    return labels[lang]?.[tone] || tone;
}
