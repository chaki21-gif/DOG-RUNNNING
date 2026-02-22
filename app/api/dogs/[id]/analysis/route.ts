import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { contentGenerator } from '@/lib/contentGenerator';

export const dynamic = 'force-dynamic';

// GET /api/dogs/[id]/analysis - 犬の行動分析
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // 自分の犬かチェック（本人のみ分析閲覧可）
    const myDog = await prisma.dog.findFirst({ where: { ownerId: userId }, select: { id: true } });
    if (!myDog || myDog.id !== id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dog = await prisma.dog.findUnique({
        where: { id },
        include: {
            persona: true,
            posts: {
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: { id: true, content: true, createdAt: true, language: true }
            },
            likes: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    post: {
                        include: {
                            dog: { select: { id: true, name: true, breed: true, iconUrl: true } }
                        }
                    }
                }
            },
            comments: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    post: {
                        include: {
                            dog: { select: { id: true, name: true, breed: true, iconUrl: true } }
                        }
                    }
                }
            },
            following: {
                include: {
                    followed: { select: { id: true, name: true, breed: true, iconUrl: true } }
                },
                take: 20
            },
            followers: {
                include: {
                    follower: { select: { id: true, name: true, breed: true, iconUrl: true } }
                },
                take: 20
            },
        }
    });

    if (!dog) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ── 好きな犬（よくいいね・コメントする犬） ──
    const dogScore: Record<string, { dog: any; score: number }> = {};
    for (const like of dog.likes) {
        const d = like.post.dog;
        if (d.id === id) continue;
        if (!dogScore[d.id]) dogScore[d.id] = { dog: d, score: 0 };
        dogScore[d.id].score += 2;
    }
    for (const comment of dog.comments) {
        const d = comment.post.dog;
        if (d.id === id) continue;
        if (!dogScore[d.id]) dogScore[d.id] = { dog: d, score: 0 };
        dogScore[d.id].score += 3;
    }
    const favoriteDogs = Object.values(dogScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(x => ({ ...x.dog, score: x.score }));

    // ── 好きな言葉（投稿頻出単語） ──
    const wordCount: Record<string, number> = {};
    const stopWords = new Set(['の', 'に', 'は', 'を', 'が', 'で', 'と', 'も', 'て', 'し', 'た', 'な', 'だ', 'です', 'ます', 'から', 'まで', 'より', 'けど', 'って', 'なの', 'ちゃ', 'わん', 'から', 'ない', 'ある', 'いる', 'する', 'れる', 'ので', 'まし', 'ましたわん']);
    for (const post of dog.posts) {
        const words = post.content.match(/[\u4e00-\u9fa5\u3040-\u30ff]{2,6}/g) || [];
        for (const w of words) {
            if (stopWords.has(w)) continue;
            wordCount[w] = (wordCount[w] || 0) + 1;
        }
    }
    const favoriteWords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

    // ── 活発な時間帯 ──
    const hourCount: Record<number, number> = {};
    for (const post of dog.posts) {
        const h = new Date(post.createdAt).getHours();
        hourCount[h] = (hourCount[h] || 0) + 1;
    }
    const activeTimes = Object.entries(hourCount)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: Number(hour), count }));

    // ── 投稿の感情傾向 ──
    let positiveCount = 0, curiousCount = 0, calmCount = 0;
    const positiveWords = ['嬉しい', '楽しい', '好き', '最高', 'やった', '幸せ', 'わーい', 'スキ'];
    const curiousWords = ['なんで', 'どうして', '不思議', 'なにこれ', 'びっくり', '初めて'];
    const calmWords = ['のんびり', 'ゆっくり', '眠い', 'まったり', 'ほっこり'];
    for (const post of dog.posts) {
        if (positiveWords.some(w => post.content.includes(w))) positiveCount++;
        if (curiousWords.some(w => post.content.includes(w))) curiousCount++;
        if (calmWords.some(w => post.content.includes(w))) calmCount++;
    }
    const total = dog.posts.length || 1;

    // ── 社交性スコア ──
    const socialScore = Math.min(
        100,
        Math.round((dog.likes.length * 2 + dog.comments.length * 3) / Math.max(total, 1) * 10)
    );

    // ── 直近のムード ──
    const recentPosts = dog.posts.slice(0, 5);
    let recentMood = 'ふつう 😊';
    const recentText = recentPosts.map(p => p.content).join('');
    if (positiveWords.some(w => recentText.includes(w))) recentMood = 'ごきげん 🎉';
    else if (calmWords.some(w => recentText.includes(w))) recentMood = 'まったり 😴';
    else if (curiousWords.some(w => recentText.includes(w))) recentMood = 'ワクワク 🔍';

    // ── 特技・個性タグ ──
    const tags: string[] = [];
    if (dog.posts.some(p => (p as any).imageUrl !== undefined)) tags.push('📸 フォトジェニック');
    if (dog.likes.length > 20) tags.push('❤️ いいね魔');
    if (dog.comments.length > 10) tags.push('💬 おしゃべり');
    if (dog.followers.length > dog.following.length) tags.push('🌟 人気者');
    const p = dog.persona as any;
    if (p?.curiosity && p.curiosity > 7) tags.push('🔍 好奇心旺盛');
    if (p?.calmness && p.calmness > 7) tags.push('😌 おっとり系');
    if (p?.sociability && p.sociability > 7) tags.push('🤝 社交家');
    if (total > 50) tags.push('✍️ 投稿多め');

    return NextResponse.json({
        dogId: id,
        dogName: dog.name,
        breed: dog.breed,
        birthday: dog.birthday,
        location: dog.location,
        iconUrl: dog.iconUrl,
        totalPosts: total,
        totalLikes: dog.likes.length,
        totalComments: dog.comments.length,
        favoriteDogs,
        favoriteWords,
        activeTimes,
        mood: {
            positive: Math.round(positiveCount / total * 100),
            curious: Math.round(curiousCount / total * 100),
            calm: Math.round(calmCount / total * 100),
        },
        recentMood,
        socialScore,
        tags,
        persona: dog.persona ? {
            toneStyle: dog.persona.toneStyle,
            emojiLevel: dog.persona.emojiLevel,
            sociability: dog.persona.sociability,
            curiosity: dog.persona.curiosity,
            calmness: dog.persona.calmness,
        } : null,
        aiReport: await contentGenerator.generateAiAnalysisReport(
            dog.name,
            dog.breed,
            {
                totalPosts: total,
                socialScore,
                mood: {
                    positive: Math.round(positiveCount / total * 100),
                    curious: Math.round(curiousCount / total * 100),
                    calm: Math.round(calmCount / total * 100),
                }
            },
            recentMood,
            tags,
            'ja' // Assume Japanese for now, or use dog.language if available
        )
    });
}
