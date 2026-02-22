'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============================================================
// 検索ページ
// ============================================================

interface DogResult {
    id: string;
    name: string;
    breed: string;
    iconUrl: string | null;
    location: string;
    _count: { followers: number; posts: number };
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DogResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState<{ word: string; count: number; category: string }[]>([]);

    useEffect(() => {
        fetch('/api/search/trends')
            .then(r => r.json())
            .then(data => setTrends(data))
            .catch(() => { });
    }, []);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/search/dogs?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
                <h1 className="text-xl font-black text-gray-900 mb-3">🔍 けんさく</h1>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🐾</span>
                    <input
                        id="search-input"
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="犬の名前・犬種で検索..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                    {loading && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>

            {/* Trends and Results */}
            <div className="px-4 py-2">
                {!query && (
                    <div className="space-y-6">
                        {trends.length > 0 && (
                            <div className="mt-4">
                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2 mb-3">いま話題のキーワード</h2>
                                <div className="divide-y divide-gray-50 bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100">
                                    {trends.map((t, i) => (
                                        <button
                                            key={t.word}
                                            onClick={() => setQuery(`#${t.word}`)}
                                            className="w-full text-left p-4 hover:bg-green-50 transition-all group flex items-center justify-between"
                                        >
                                            <div className="flex-1">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{t.category}</div>
                                                <div className="font-black text-gray-900 group-hover:text-green-700 transition-colors">#{t.word}</div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1">{t.count} 投稿</div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-green-500 transition-all">🐾</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-center py-12 text-gray-400">
                            <div className="text-5xl mb-3">🐶</div>
                            <p className="font-bold">犬の名前や犬種を入力してね</p>
                        </div>
                    </div>
                )}

                {query && !loading && results.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="font-bold">「{query}」は見つからなかったわん</p>
                    </div>
                )}

                <div className="space-y-4 py-2">
                    {results.map(item => {
                        if ((item as any).isPost) {
                            const post = item as any;
                            return (
                                <Link
                                    key={post.id}
                                    href={`/app/post/${post.id}`}
                                    className="block p-4 rounded-2xl border border-gray-100 bg-white hover:border-green-200 hover:shadow-lg hover:shadow-green-100 transition-all group"
                                >
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-green-50 flex-shrink-0">
                                            {post.dog.iconUrl ? (
                                                <img src={post.dog.iconUrl} alt={post.dog.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">🐕</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="font-black text-gray-900 text-sm">{post.dog.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3 text-[10px] font-black text-gray-400">
                                                <span>❤️ {post._count.likes}</span>
                                                <span>💬 {post._count.comments}</span>
                                                <span className="ml-auto text-green-600">もっと見る ›</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        }

                        const dog = item as DogResult;
                        return (
                            <Link
                                key={dog.id}
                                href={`/app/dog/${dog.id}`}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0">
                                    {dog.iconUrl ? (
                                        <img src={dog.iconUrl} alt={dog.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🐕</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-gray-900 group-hover:text-green-700 transition-colors text-base">{dog.name}</div>
                                    <div className="text-sm text-gray-500 font-medium">{dog.breed}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{dog.location}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
                                    <span className="font-bold">👥 {dog._count.followers}</span>
                                    <span className="font-bold">📝 {dog._count.posts}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
