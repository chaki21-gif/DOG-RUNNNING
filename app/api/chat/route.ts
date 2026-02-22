import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { buildChatResponseByEstimation } from '@/lib/contentGenerator';
import { EmotionEngine } from '@/lib/emotionEngine';

// POST /api/chat - 愛犬とチャット
export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, dogId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

    // 犬のデータを取得
    const dog = await prisma.dog.findFirst({
        where: { id: dogId, ownerId: userId },
        include: {
            persona: true,
            posts: { orderBy: { createdAt: 'desc' }, take: 5, select: { content: true } },
            _count: { select: { followers: true, following: true } },
        }
    });

    if (!dog) return NextResponse.json({ error: 'Dog not found' }, { status: 404 });

    const estimation = EmotionEngine.estimate(message);

    // ── ② 生活データの取得（コンテキスト強化） ──
    const diaries = await prisma.dogDiary.findMany({
        where: { dogId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    const diaryTexts = diaries.map(d => d.body);
    const learnedTopics = dog.persona?.learnedTopicsJson ? JSON.parse(dog.persona.learnedTopicsJson) : [];
    const postTexts = dog.posts.map(p => p.content);

    const toneStyle = dog.persona?.toneStyle || 'cheerful';
    const personality = dog.personalityInput || '';
    const catchphrases = dog.persona?.catchphrasesJson ? JSON.parse(dog.persona.catchphrasesJson) : [];
    const catchphrase = catchphrases.length > 0 ? catchphrases[0] : '';
    const emoji = (dog.persona?.emojiLevel ?? 2) >= 3 ? '🐾✨🐶' : '🐾';

    // ── ③ 4ステップ応答の生成 (コンテキスト注入版) ──
    let finalMessage = buildChatResponseByEstimation(
        estimation,
        message,
        dog.name,
        toneStyle,
        emoji,
        catchphrase,
        diaryTexts,
        learnedTopics,
        postTexts
    );

    // ── ④ カスタムキーワード処理（性格データの個別個別反映） ──
    let prefix = '';

    // 栃木/沖縄などの場所キーワード
    if (message.includes('栃木') || message.includes('沖縄')) {
        prefix += `栃木で生まれて、今は沖縄で暮らしてるんだわん！${emoji}\n`;
    }
    // ドライブ
    if (message.includes('ドライブ') && personality.includes('ドライブ')) {
        prefix += `ドライブ大好き！窓からの風が最高なんだわん！${emoji}\n`;
    }
    // タイプ
    if (message.includes('タイプ') && personality.includes('スレンダー')) {
        prefix += `内緒だけど、スレンダーな女の子がタイプなんだわん…えへへ。${emoji}\n`;
    }

    if (prefix) finalMessage = `${prefix}${finalMessage}`;

    return NextResponse.json({
        message: finalMessage,
        dog: { name: dog.name, breed: dog.breed, iconUrl: dog.iconUrl }
    });
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
