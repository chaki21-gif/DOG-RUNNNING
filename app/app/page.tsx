'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    language: string;
    createdAt: string;
    dog: { id: string; name: string; breed: string; iconUrl: string | null };
    _count: { likes: number; comments: number; reposts: number };
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    dog: { id: string; name: string; breed: string; iconUrl: string | null };
}

import Link from 'next/link';

function PostCard({ post }: { post: Post }) {
    const t = useTranslations('timeline');

    const getTimeAgo = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        if (diffMin < 1) return t('ago.justNow');
        if (diffMin < 60) return t('ago.minutesAgo', { n: diffMin });
        if (diffHour < 24) return t('ago.hoursAgo', { n: diffHour });
        return t('ago.daysAgo', { n: Math.floor(diffHour / 24) });
    };

    return (
        <div className="bg-white border-b border-gray-100 hover:bg-green-50/30 transition-all group relative">
            <Link href={`/app/post/${post.id}`} className="absolute inset-0 z-0" aria-label="View conversation" />
            <div className="p-4 md:p-6 flex gap-4 relative z-10 pointer-events-none">
                <Link href={`/app/dog/${post.dog.id}`} className="shrink-0 pt-1 pointer-events-auto">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-green-50 shadow-sm bg-green-50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        {post.dog.iconUrl ? (
                            <img src={post.dog.iconUrl} alt={post.dog.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>🐶</span>
                        )}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Link href={`/app/dog/${post.dog.id}`} className="font-black text-gray-900 hover:underline decoration-green-500 decoration-2 pointer-events-auto">
                                {post.dog.name} <span className="text-[9px] font-normal text-gray-400">({post.dog.id.slice(-6)})</span>
                            </Link>
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-tight truncate max-w-[80px]">{post.dog.breed}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            {getTimeAgo(post.createdAt)}
                        </span>
                    </div>

                    <p className="text-[15px] text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap font-medium">
                        {post.content}
                    </p>
                </div>
            </div>

            {/* Post image */}
            {post.imageUrl && (
                <div className="mx-4 mb-4 md:mx-6 rounded-2xl overflow-hidden border border-green-100 shadow-sm relative z-10">
                    <img
                        src={post.imageUrl}
                        alt="post photo"
                        className="w-full max-h-96 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                </div>
            )}

            <div className="px-4 pb-4 md:px-6 md:pb-6 flex items-center gap-6 text-gray-400 relative z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 hover:text-green-600 transition-colors pointer-events-auto">
                    <span className="text-lg">💬</span>
                    <span className="text-[10px] font-black">{post._count.comments}</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-green-600 transition-colors pointer-events-auto">
                    <span className="text-lg">🔁</span>
                    <span className="text-[10px] font-black">{post._count.reposts}</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors pointer-events-auto">
                    <span className="text-lg">❤️</span>
                    <span className="text-[10px] font-black">{post._count.likes}</span>
                </div>
                {post._count.comments > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest animate-pulse">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        {t('conversation')}
                    </div>
                )}
            </div>
        </div>
    );
}

type TimelineTab = 'all' | 'following' | 'recommended';

export default function TimelinePage() {
    const t = useTranslations('timeline');
    const tCommon = useTranslations('common');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<TimelineTab>('all');

    const fetchPosts = useCallback(async (cursor?: string, tab: TimelineTab = 'all') => {
        const base = cursor
            ? `/api/timeline?cursor=${cursor}&type=${tab}`
            : `/api/timeline?t=${Date.now()}&type=${tab}`;
        const res = await fetch(base);
        return await res.json();
    }, []);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetchPosts(undefined, activeTab).then((data) => {
            if (!isMounted) return;
            if (data.posts) {
                setPosts(data.posts);
                setNextCursor(data.nextCursor);
            }
            setLoading(false);
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false; };
    }, [fetchPosts, activeTab]);

    const handleRefresh = () => {
        setLoading(true);
        fetchPosts(undefined, activeTab).then((data) => {
            if (data.posts) {
                setPosts(data.posts);
                setNextCursor(data.nextCursor);
            }
            setLoading(false);
        });
    };

    async function loadMore() {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const data = await fetchPosts(nextCursor, activeTab);
        setPosts((p) => [...p, ...(data.posts || [])]);
        setNextCursor(data.nextCursor);
        setLoadingMore(false);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="text-6xl animate-bounce">🌱</div>
                <p className="text-green-600 font-black animate-pulse">{t('fetching')}</p>
            </div>
        );
    }

    const TABS: { key: TimelineTab; label: string; icon: string }[] = [
        { key: 'all', label: 'すべて', icon: '🌍' },
        { key: 'following', label: 'フォロー中', icon: '🐾' },
        { key: 'recommended', label: 'おすすめ', icon: '✨' },
    ];

    return (
        <div className="bg-white min-h-screen">
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100">
                {/* Title bar */}
                <div className="px-6 pt-4 pb-0 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span className="text-2xl">🐕</span> {t('title')}
                        </h1>
                        <p className="text-[10px] font-bold text-green-600 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            {t('autoPostingNote')}
                        </p>
                    </div>
                    <button
                        id="refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-all active:scale-95 disabled:opacity-50 shadow-sm border border-green-100/50"
                        title={t('refresh')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L19 9M21 15a9 9 0 01-14.85 3.36L5 15" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-2 pt-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            id={`timeline-tab-${tab.key}`}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black border-b-2 transition-all ${activeTab === tab.key
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="divide-y divide-gray-50 mb-20">
                {posts.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="text-6xl mb-6 animate-pulse">🦴</div>
                        <p className="text-gray-900 font-black text-lg mb-2">{t('empty')}</p>
                        <p className="text-gray-400 text-sm font-medium mb-8">
                            {t('refreshNote')}
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                        >
                            <span>🔄</span> {t('refresh')}
                        </button>
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                        {nextCursor && (
                            <div className="text-center py-8">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 px-6 py-2 rounded-full text-sm font-black transition-all disabled:opacity-50"
                                >
                                    {loadingMore ? tCommon('loading') : t('loadMore')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
