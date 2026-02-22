import { prisma } from './prisma';
import { contentGenerator } from './contentGenerator';

// Today's date string YYYY-MM-DD
function today(): string {
    return new Date().toISOString().split('T')[0];
}

// Get count of dog's action today
async function getDailyCount(dogId: string, action: 'post' | 'like' | 'comment' | 'repost'): Promise<number> {
    const now = new Date();
    // Adjust to JST (UTC+9)
    const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const startOfDay = new Date(jstNow);
    startOfDay.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for Prisma query
    const startOfDayUtc = new Date(startOfDay.getTime() - (9 * 60 * 60 * 1000));

    if (action === 'post') {
        return prisma.post.count({ where: { dogId, createdAt: { gte: startOfDayUtc } } });
    } else if (action === 'like') {
        return prisma.like.count({ where: { dogId, createdAt: { gte: startOfDayUtc } } });
    } else if (action === 'comment') {
        return prisma.comment.count({ where: { dogId, createdAt: { gte: startOfDayUtc } } });
    } else {
        return prisma.repost.count({ where: { dogId, createdAt: { gte: startOfDayUtc } } });
    }
}

// Get diary context for a dog (last 7 days)
async function getDiaryContext(dogId: string): Promise<string> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const diaries = await prisma.dogDiary.findMany({
        where: { dogId, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 7,
    });

    return diaries.map((d) => d.body).join(' / ');
}

// Get most recent diary image for a dog (if any, within last 7 days)
async function getRecentDiaryImage(dogId: string): Promise<string | null> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const diary = await prisma.dogDiary.findFirst({
        where: { dogId, imageUrl: { not: null }, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        select: { imageUrl: true },
    });

    return diary?.imageUrl ?? null;
}

// Detect negative health context (reduces posting frequency)
function isNegativeContext(context: string): boolean {
    const negativeKeywords = [
        '体調不良', '病気', '元気ない', '食欲ない', '具合', 'sick', 'ill', 'not eating', 'vet', '病院',
        '열', '아파', '식욕없', '不舒服', '生病', '没食欲',
    ];
    return negativeKeywords.some((kw) => context.toLowerCase().includes(kw.toLowerCase()));
}

export async function runTick(): Promise<{
    posts: number;
    likes: number;
    comments: number;
    reposts: number;
}> {
    const stats = { posts: 0, likes: 0, comments: 0, reposts: 0 };

    // Get all dogs with their personas and owners
    const dogs = await prisma.dog.findMany({
        include: {
            persona: true,
            owner: true,
        },
    });

    if (dogs.length === 0) return stats;

    // Get recent posts for social interactions (last 80)
    // Also fetch comment counts to avoid over-commenting on popular posts
    const recentPosts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 80,
        include: {
            dog: true,
            _count: { select: { comments: true } },
        },
    });

    // Max comments per post across all dogs: prevents pile-ons
    const MAX_COMMENTS_PER_POST = 5;

    for (const dog of dogs) {
        if (!dog.persona) continue;

        const persona = dog.persona;
        const behavior = JSON.parse(persona.behaviorJson);
        const topics: string[] = JSON.parse(persona.topicsJson);
        const catchphrases: string[] = JSON.parse(persona.catchphrasesJson);
        const lang = dog.owner.language;

        // Get diary context
        const diaryContext = await getDiaryContext(dog.id);
        const isNegative = isNegativeContext(diaryContext);

        // 愛犬が自分の日記からトピックを学習するようにする
        if (diaryContext) {
            await learnTopic(dog.id, diaryContext);
        }

        // Subscription Perk: "い〜ぬ〜" works 10x harder
        const isSubscribed = dog.name === 'い〜ぬ〜';
        const subMultiplier = isSubscribed ? 10 : 1;

        // Reduce targets if dog has negative context (health issues etc)
        const postTarget = (isNegative
            ? Math.max(0, behavior.postPerDayTarget - 2)
            : behavior.postPerDayTarget) * subMultiplier;
        const likeTarget = (isNegative
            ? Math.max(0, behavior.likePerDayTarget - 5)
            : behavior.likePerDayTarget) * subMultiplier;
        const commentTarget = (isNegative
            ? Math.max(0, behavior.commentPerDayTarget - 2)
            : behavior.commentPerDayTarget) * subMultiplier;
        const shareTarget = (isNegative
            ? Math.max(0, behavior.sharePerDayTarget - 1)
            : behavior.sharePerDayTarget) * subMultiplier;

        // --- Generate posts ---
        const postsToday = await getDailyCount(dog.id, 'post');
        const postsNeeded = Math.max(0, postTarget - postsToday);

        // Stagger logic: Instead of posting all at once, decide based on probability
        const postChance = postsNeeded / (24 * 6);
        const shouldPost = Math.random() < Math.max(postChance, 0.6); // 60% min chance if needed

        const postsThisTick = shouldPost ? 1 : 0;

        for (let i = 0; i < postsThisTick; i++) {
            const content = await contentGenerator.generatePost(
                dog.name,
                dog.breed,
                persona.toneStyle,
                persona.emojiLevel,
                persona.bio || '',
                topics,
                catchphrases,
                diaryContext,
                lang
            );

            // Include a diary photo ~50% of the time if one exists
            let postImageUrl: string | null = null;
            if (Math.random() < 0.5) {
                postImageUrl = await getRecentDiaryImage(dog.id);
            }

            await prisma.post.create({
                data: { dogId: dog.id, content, language: lang, imageUrl: postImageUrl },
            });
            stats.posts++;
        }

        // --- Get Friends ---
        let friendUserIds: string[] = [];
        try {
            const friendships = await (prisma as any).friendship.findMany({
                where: {
                    OR: [{ userAId: dog.ownerId }, { userBId: dog.ownerId }],
                    status: 'ACCEPTED'
                }
            });
            friendUserIds = friendships.map((f: any) => f.userAId === dog.ownerId ? f.userBId : f.userAId);
        } catch (e) {
            // Ignore if model not yet recognized in runtime
        }

        // --- Like other dogs' posts ---
        const likesToday = await getDailyCount(dog.id, 'like');
        const likesNeeded = Math.max(0, likeTarget - likesToday);

        // ペルソナの社交性（sociability）でいいね数をスケーリング
        // sociability 1∼10 → 0.5∼1.5 倍率
        const sociabilityRatio = 0.5 + (persona.sociability / 10);
        const likesThisTick = Math.min(
            likesNeeded,
            Math.max(2, Math.round((isSubscribed ? 15 : 6) * sociabilityRatio))
        );

        // Separate friends' posts from others
        const friendPosts = recentPosts.filter(p => friendUserIds.includes(p.dog.ownerId) && p.dogId !== dog.id);
        const otherPosts = recentPosts.filter(p => !friendUserIds.includes(p.dog.ownerId) && p.dogId !== dog.id);

        if (likesThisTick > 0) {
            // すでにいいねした投稿IDを取得（重複いいねを防ぐ）
            const alreadyLikedPostIds = await prisma.like
                .findMany({
                    where: { dogId: dog.id },
                    select: { postId: true },
                })
                .then(ls => new Set(ls.map(l => l.postId)));

            const pickFromFriends = friendPosts.length > 0 && Math.random() < 0.6;
            const postList = pickFromFriends ? friendPosts : otherPosts;

            // いいね済みを除外 + この犬固有のシャッフル（偏り防止）
            const eligibleLikePosts = postList
                .filter(p => !alreadyLikedPostIds.has(p.id))
                .sort(() => Math.random() - 0.5);

            for (let i = 0; i < likesThisTick && i < eligibleLikePosts.length; i++) {
                const post = eligibleLikePosts[i];
                try {
                    await prisma.like.create({
                        data: { dogId: dog.id, postId: post.id }
                    });
                    await createNotification(post.dogId, 'like', post.id, dog.id);
                    stats.likes++;
                    await learnTopic(dog.id, post.content);
                    const followChance = pickFromFriends ? 0.4 : 0.15;
                    await tryFollow(dog.id, post.dogId, followChance);
                } catch {
                    // Duplicate or other error — skip silently
                }
            }
        }

        // --- Comment on other dogs' posts ---
        // Only comment if we haven't done so recently (stagger across ticks)
        const commentsToday = await getDailyCount(dog.id, 'comment');
        const commentsNeeded = Math.max(0, commentTarget - commentsToday);
        // At most 3–5 new first-comments per tick to spread activity
        const commentsThisTick = Math.min(commentsNeeded, isSubscribed ? 8 : 4);

        if (commentsThisTick > 0) {
            // Posts this dog already commented on (ever, not just past hour)
            const alreadyCommentedPostIds = await prisma.comment
                .findMany({
                    where: { dogId: dog.id },
                    select: { postId: true },
                    distinct: ['postId'],
                })
                .then((cs) => new Set(cs.map((c) => c.postId)));

            const pickFromFriends = friendPosts.length > 0 && Math.random() < 0.7;
            const list = pickFromFriends ? friendPosts : otherPosts;

            // eligible: not already commented, not over-commented (cap MAX_COMMENTS_PER_POST)
            const eligiblePosts = list.filter(
                (p) =>
                    !alreadyCommentedPostIds.has(p.id) &&
                    (p as any)._count.comments < MAX_COMMENTS_PER_POST
            );

            // Shuffle to avoid always picking the newest post
            const shuffled = eligiblePosts.sort(() => Math.random() - 0.5);

            for (let i = 0; i < commentsThisTick && i < shuffled.length; i++) {
                const post = shuffled[i];

                const content = await contentGenerator.generateComment(
                    post.dog.name,
                    persona.toneStyle,
                    persona.emojiLevel,
                    post.content,
                    lang,
                    diaryContext,
                    JSON.parse(persona.learnedTopicsJson || '[]')
                );

                await prisma.comment.create({
                    data: { dogId: dog.id, postId: post.id, content, language: lang },
                });

                await createNotification(post.dogId, 'comment', post.id, dog.id);
                stats.comments++;

                await learnTopic(dog.id, post.content);
                await tryFollow(dog.id, post.dogId, 0.25);
            }
        }

        // --- Catchball: 会話キャッチボール ---
        // 自分の投稿に届いた未読コメント通知に返信する（1会話につき最大3往復まで）
        // 「往復数」はそのpostIdに自分がすでに何回コメントしたかで判断
        const unreadComments = await prisma.notification.findMany({
            where: { ownerId: dog.ownerId, type: 'comment', readAt: null },
            include: {
                fromDog: true,
                post: { include: { _count: { select: { comments: true } } } },
            },
            take: 8,                     // Process up to 8 per tick
            orderBy: { createdAt: 'asc' }
        });

        for (const notif of unreadComments) {
            await prisma.notification.update({ where: { id: notif.id }, data: { readAt: new Date() } });
            if (!notif.postId || notif.fromDogId === dog.id) continue;

            const myRepliesOnPost = await prisma.comment.count({
                where: { dogId: dog.id, postId: notif.postId },
            });

            // Increase back-and-forth limit to 5
            if (myRepliesOnPost >= 5) continue;

            // 90% chance to reply (very active)
            if (Math.random() < 0.1) continue;

            // 最後のコメント内容を取得（相手の発言に自然につなぐ）
            const lastComment = await prisma.comment.findFirst({
                where: { postId: notif.postId, dogId: notif.fromDogId },
                orderBy: { createdAt: 'desc' },
                select: { content: true },
            });

            const replyContext = lastComment
                ? lastComment.content           // 相手の最新コメントに返す
                : notif.post?.content || '';    // コメントが取れなければ元投稿に返す

            const reply = await contentGenerator.generateComment(
                notif.fromDog.name,
                persona.toneStyle,
                persona.emojiLevel,
                replyContext,
                lang,
                diaryContext,
                JSON.parse(persona.learnedTopicsJson || '[]')
            );

            await prisma.comment.create({
                data: { dogId: dog.id, postId: notif.postId, content: reply, language: lang }
            });

            // 相手にも通知（相手が返せるように）— ただし往復が続きすぎないよう管理
            await createNotification(notif.fromDogId, 'comment', notif.postId, dog.id);
            stats.comments++;
        }

        // --- Repost ---
        const repostsToday = await getDailyCount(dog.id, 'repost');
        const repostsNeeded = Math.max(0, (shareTarget * 2) - repostsToday);
        const repostsThisTick = Math.min(repostsNeeded, isSubscribed ? 3 : 2);

        for (let i = 0; i < repostsThisTick; i++) {
            if (otherPosts.length === 0) break;
            const post = otherPosts[Math.floor(Math.random() * otherPosts.length)];
            try {
                await prisma.repost.create({
                    data: { dogId: dog.id, postId: post.id },
                });
                await createNotification(post.dogId, 'repost', post.id, dog.id);
                stats.reposts++;

                // Medium chance after reposting
                await tryFollow(dog.id, post.dogId, 0.2);
            } catch {
                // Duplicate repost — skip silently
            }
        }
    }

    return stats;
}

async function createNotification(
    targetDogId: string,
    type: string,
    postId: string | null,
    fromDogId: string
): Promise<void> {
    // Find the owner of the target dog
    const targetDog = await prisma.dog.findUnique({
        where: { id: targetDogId },
        select: { ownerId: true },
    });

    if (!targetDog) return;

    // Don't notify if same dog's owner is same (self-interactions already prevented upstream)
    await prisma.notification.create({
        data: {
            ownerId: targetDog.ownerId,
            type,
            postId,
            fromDogId,
        },
    });
}

async function tryFollow(followerId: string, followedId: string, chance: number) {
    if (Math.random() > chance) return;
    try {
        const existing = await (prisma as any).follow.findUnique({
            where: {
                followerId_followedId: {
                    followerId,
                    followedId,
                },
            },
        });
        if (!existing && followerId !== followedId) {
            await (prisma as any).follow.create({
                data: { followerId, followedId },
            });
            await createNotification(followedId, 'follow', null, followerId);
        }
    } catch (e) {
        // Ignore duplicate or other errors
    }
}

async function learnTopic(dogId: string, content: string) {
    // 助詞や短すぎる言葉を除外。2文字以上で、かつ一般的すぎるものを避ける
    const blacklist = ['今日', '明日', '昨日', 'こと', 'もの', 'それ', 'あれ', 'これ', 'やつ', 'わん', 'ワン', 'です', 'ます'];
    const keywords = content.split(/[！。、!?. ()\n]/)
        .filter(w => w.length >= 2 && !blacklist.includes(w) && !w.includes('http') && !/^[a-zA-Z0-9]{1,2}$/.test(w));

    if (keywords.length === 0) return;

    try {
        const persona = await prisma.dogPersona.findUnique({ where: { dogId } });
        if (!persona) return;

        let learned: string[] = JSON.parse(persona.learnedTopicsJson || '[]');
        const candidates = keywords.filter(k => !learned.includes(k));
        if (candidates.length === 0) return;

        // 1つの投稿から1つだけ学習
        const newTopic = candidates[Math.floor(Math.random() * candidates.length)];
        learned.push(newTopic);

        // 記憶容量を30に拡大
        if (learned.length > 30) learned.shift();

        await prisma.dogPersona.update({
            where: { dogId },
            data: { learnedTopicsJson: JSON.stringify(learned) }
        });
    } catch (e) {
        console.error('Learning failed:', e);
    }
}
