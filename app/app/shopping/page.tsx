'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Product {
    id: string;
    title: string;
    description: string | null;
    amazonUrl: string;
    imageUrl: string | null;
    category: string;
    price: string | null;
}

const CATEGORIES = [
    { id: 'all', label: 'すべて', icon: '🐾' },
    { id: 'food', label: 'フード', icon: '🍚' },
    { id: 'snack', label: 'おやつ', icon: '🦴' },
    { id: 'toy', label: 'おもちゃ', icon: '🧸' },
    { id: 'walk', label: 'お散歩', icon: '🦮' },
    { id: 'dental', label: 'デンタル', icon: '🦷' },
    { id: 'goods', label: '生活用品', icon: '🎒' },
    { id: 'health', label: 'ヘルスケア', icon: '💊' },
];

const CATEGORY_LABEL: Record<string, string> = {
    all: 'すべて', food: 'フード（ごはん）', snack: 'おやつ',
    toy: 'おもちゃ', walk: 'お散歩グッズ', dental: 'デンタルケア',
    goods: '生活用品', health: 'ヘルスケア',
};

export default function ShoppingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json().catch(() => ({})))
            .then((data) => { if (data.isAdmin) setIsAdmin(true); });
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const url = activeCategory === 'all' ? '/api/products' : `/api/products?category=${activeCategory}`;
            const res = await fetch(url);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) => {
            const catLabel = CATEGORY_LABEL[p.category] ?? p.category;
            return (
                p.title.toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q) ||
                catLabel.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        });
    }, [products, searchQuery]);

    return (
        /* ── 全幅コンテナ: スクロール可・下ナビ分パディング ── */
        <div className="w-full min-h-screen bg-gray-50 pb-28">

            {/* ── ヘッダー ── */}
            <div className="w-full bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 pt-10 pb-16 px-4 text-white shadow-lg relative overflow-hidden">
                {/* 装飾サークル */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 left-1/3 w-24 h-24 bg-white/10 rounded-full" />

                <p className="text-[10px] text-white/70 mb-2 font-medium relative z-10">
                    ※当ページには広告（Amazonアソシエイトリンク）が含まれています。
                </p>
                <h1 className="text-2xl sm:text-3xl font-black mb-1 relative z-10">
                    Dog Shopping 🛍️
                </h1>
                <p className="text-xs text-white/90 font-medium bg-white/20 px-3 py-2 rounded-2xl border border-white/30 mt-3 backdrop-blur-sm relative z-10 inline-block">
                    ⚠️ 価格は参考価格。実際の価格はサイトへ
                </p>

                {isAdmin && (
                    <div className="mt-4 relative z-10">
                        <Link
                            href="/app/shopping/register"
                            className="inline-flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            <span>✨</span> 商品を登録する
                        </Link>
                    </div>
                )}
            </div>

            {/* ── 検索バー ── */}
            <div className="w-full px-4 -mt-5 relative z-10 mb-3">
                <div className="bg-white rounded-2xl shadow-md border border-orange-100 flex items-center gap-3 px-4 py-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        id="shopping-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="商品名・カテゴリで検索..."
                        className="flex-1 min-w-0 text-sm font-medium text-gray-800 placeholder-gray-300 bg-transparent outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-xs text-gray-400 font-medium mt-1.5 ml-1">
                        「{searchQuery}」— {filteredProducts.length}件
                    </p>
                )}
            </div>

            {/* ── カテゴリタブ（横スクロール） ── */}
            <div className="w-full overflow-x-auto no-scrollbar px-4 mb-4">
                <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                setSearchQuery('');
                            }}
                            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-[11px] font-bold transition-all min-w-[56px] ${activeCategory === cat.id
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200 scale-105'
                                    : 'bg-white text-gray-500 border border-gray-100 active:scale-95'
                                }`}
                        >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="leading-tight text-center">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 商品グリッド ── */}
            <div className="px-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-3" />
                        <p className="text-sm">いいものを探しています...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl text-gray-400 mx-0">
                        {searchQuery ? (
                            <>
                                <p className="text-4xl mb-3">🔍</p>
                                <p className="text-sm font-medium">「{searchQuery}」に一致する商品なし</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-3 text-xs text-orange-500 font-bold"
                                >
                                    検索をクリア
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-4xl mb-3">🐾</p>
                                <p className="text-sm font-medium">このカテゴリにはまだ商品がありません</p>
                            </>
                        )}
                    </div>
                ) : (
                    /* 2列グリッド: 画面幅が大きい場合は3〜4列に */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all flex flex-col"
                            >
                                {/* 画像エリア */}
                                <div className="relative aspect-square bg-gray-50">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.title}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                                    )}
                                    {/* 価格バッジ */}
                                    {product.price && (
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                            {product.price}
                                        </div>
                                    )}
                                    {/* カテゴリバッジ */}
                                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-0.5">
                                        <span>{CATEGORIES.find((c) => c.id === product.category)?.icon ?? '🐾'}</span>
                                        <span>{CATEGORY_LABEL[product.category] ?? product.category}</span>
                                    </div>
                                </div>

                                {/* テキスト・ボタンエリア */}
                                <div className="p-3 flex flex-col flex-1 gap-2">
                                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 flex-1 leading-snug">
                                        {product.title}
                                    </h3>
                                    <a
                                        href={product.amazonUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-orange-50 text-orange-600 text-center py-2 rounded-xl text-[10px] font-bold hover:bg-orange-100 active:scale-95 transition-all"
                                    >
                                        Amazonで見る 🔗
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 管理者FAB ── */}
            {isAdmin && (
                <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
                    <Link
                        href="/admin/shopping"
                        title="管理ダッシュボード"
                        className="bg-slate-800 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </Link>
                    <Link
                        href="/app/shopping/register"
                        title="商品を追加"
                        className="bg-orange-500 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-transform group"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
}
