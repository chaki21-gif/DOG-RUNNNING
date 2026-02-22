'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    dog: { id: string; name: string; breed: string; iconUrl: string | null };
}

interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    dog: { id: string; name: string; breed: string; iconUrl: string | null };
    comments: Comment[];
    _count: { likes: number; reposts: number; comments: number };
}

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const t = useTranslations('timeline');
    const tCommon = useTranslations('common');
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/posts/${id}`)
            .then(r => r.json())
            .then(data => {
                if (!data.error) setPost(data);
                setLoading(false);
            });
    }, [id]);

    function getTimeAgo(dateStr: string) {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        if (diffMin < 1) return t('ago.justNow');
        if (diffMin < 60) return t('ago.minutesAgo', { n: diffMin });
        if (diffHour < 24) return t('ago.hoursAgo', { n: diffHour });
        return t('ago.daysAgo', { n: Math.floor(diffHour / 24) });
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="text-6xl animate-bounce">🎾</div>
                <p className="text-green-600 font-bold animate-pulse text-[10px] uppercase tracking-widest">{t('fetching')}</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="text-center py-20 bg-green-50 rounded-[3rem] mx-6 mt-6">
                <div className="text-6xl mb-6 grayscale opacity-20">🦴</div>
                <p className="text-green-800 font-black">{tCommon('error')}</p>
                <button onClick={() => router.back()} className="text-green-600 font-black text-sm underline mt-4 block mx-auto">{tCommon('back')}</button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-6 px-6 py-4">
                <button onClick={() => router.back()} className="text-gray-900 h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">ポスト</h1>
            </div>

            {/* Main Post */}
            <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex gap-4 mb-5">
                    <Link href={`/app/dog/${post.dog.id}`} className="shrink-0 group">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-green-50 bg-green-50 flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform">
                            {post.dog.iconUrl ? (
                                <img src={post.dog.iconUrl} alt={post.dog.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>🐶</span>
                            )}
                        </div>
                    </Link>
                    <div className="flex flex-col justify-center">
                        <Link href={`/app/dog/${post.dog.id}`} className="font-black text-lg text-gray-900 hover:underline decoration-green-500 decoration-2 block leading-tight">
                            {post.dog.name}
                        </Link>
                        <span className="text-green-600 text-xs font-black uppercase tracking-tight">{post.dog.breed}</span>
                    </div>
                </div>

                <div className="text-xl font-medium text-gray-900 leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                </div>

                {post.imageUrl && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-green-100 shadow-sm">
                        <img
                            src={post.imageUrl}
                            alt="post photo"
                            className="w-full max-h-[60vh] object-cover"
                        />
                    </div>
                )}

                <div className="text-gray-400 text-xs font-black uppercase tracking-tighter mb-4 flex gap-2">
                    <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                <div className="border-t border-b border-gray-100 py-4 flex gap-8">
                    <div className="flex gap-1.5 items-center">
                        <span className="text-gray-900 font-black text-lg">{post._count.likes}</span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t('likes')}</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                        <span className="text-gray-900 font-black text-lg">{post._count.reposts}</span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t('reposts')}</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                        <span className="text-gray-900 font-black text-lg">{post._count.comments}</span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t('comments')}</span>
                    </div>
                </div>

                {/* Social Actions (Mock) */}
                <div className="flex justify-between items-center py-4 px-10 text-xl border-b border-gray-50">
                    <button className="h-10 w-10 flex items-center justify-center hover:bg-green-50 rounded-full transition-colors text-gray-400 hover:text-green-600">💬</button>
                    <button className="h-10 w-10 flex items-center justify-center hover:bg-green-50 rounded-full transition-colors text-gray-400 hover:text-green-600">🔁</button>
                    <button className="h-10 w-10 flex items-center justify-center hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500">❤️</button>
                    <button className="h-10 w-10 flex items-center justify-center hover:bg-green-50 rounded-full transition-colors text-gray-400 hover:text-green-600">📤</button>
                </div>
            </div>

            {/* Comments List */}
            <div className="bg-white">
                <div className="px-6 py-4 border-b border-gray-50">
                    <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        {t('conversation')}
                    </h3>
                </div>
                {post.comments.map((comment, idx) => (
                    <div key={comment.id} className="p-6 border-b border-gray-100 flex gap-4 hover:bg-green-50/20 transition-all">
                        <Link href={`/app/dog/${comment.dog.id}`} className="shrink-0 mt-1">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-green-50 bg-green-50 flex items-center justify-center text-2xl shadow-sm hover:scale-105 transition-transform">
                                {comment.dog.iconUrl ? (
                                    <img src={comment.dog.iconUrl} alt={comment.dog.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>🐶</span>
                                )}
                            </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col mb-1.5">
                                <div className="flex items-center justify-between">
                                    <Link href={`/app/dog/${comment.dog.id}`} className="font-black text-gray-900 hover:underline decoration-green-500 decoration-2">
                                        {comment.dog.name}
                                    </Link>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                        {getTimeAgo(comment.createdAt)}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold -mt-0.5">{comment.dog.breed}</span>
                            </div>
                            <div className="text-gray-700 text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                ))}

                {post.comments.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="text-6xl mb-6 grayscale opacity-10">🐾</div>
                        <p className="text-gray-300 font-black text-sm uppercase tracking-widest">返信がまだありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
