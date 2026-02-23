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
    { id: 'food', label: 'フード（ごはん）', icon: '🍚' },
    { id: 'snack', label: 'おやつ', icon: '🦴' },
    { id: 'toy', label: 'おもちゃ', icon: '🧸' },
    { id: 'walk', label: 'お散歩グッズ', icon: '🦮' },
    { id: 'dental', label: 'デンタルケア', icon: '🦷' },
    { id: 'goods', label: '生活用品', icon: '🎒' },
    { id: 'health', label: 'ヘルスケア', icon: '💊' },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, c.label])
);

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

    // activeCategory が変わったら再取得
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

    // クライアントサイドでのキーワード絞り込み
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
        <div className="pb-24">
            {/* ヒーローセクション */}
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 pt-10 pb-20 px-6 text-white rounded-b-[3rem] shadow-lg mb-4 relative">
                <p className="text-[10px] text-white/70 mb-2 font-medium">
                    ※当ページには広告（Amazonアソシエイトリンク）が含まれています。
                </p>
                <h1 className="text-3xl font-bold mb-2 text-center md:text-left">Dog Shopping 🛍️</h1>
                <p className="text-xs text-white/80 font-bold bg-white/10 p-3 rounded-2xl border border-white/20 mt-4 backdrop-blur-sm">
                    ⚠️ 価格は参考価格です。実際の価格はサイトにてご確認ください。
                </p>

                {isAdmin && (
                    <div className="flex justify-center md:justify-start mt-6">
                        <Link
                            href="/app/shopping/register"
                            className="bg-white text-orange-600 px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-orange-100"
                        >
                            <span className="text-xl">✨</span> 商品を新しく登録する
                        </Link>
                    </div>
                )}
            </div>

            {/* 🔍 検索バー */}
            <div className="px-6 mb-4">
                <div className="relative">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        id="shopping-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="商品名・カテゴリで検索..."
                        className="w-full bg-white border-2 border-orange-100 rounded-2xl pl-12 pr-10 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-xs text-gray-400 font-medium mt-2 ml-1">
                        「{searchQuery}」の検索結果：{filteredProducts.length}件
                    </p>
                )}
            </div>

            {/* カテゴリタブ */}
            <div className="px-6 mb-8 overflow-x-auto no-scrollbar flex items-center gap-3 pb-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setActiveCategory(cat.id);
                            setSearchQuery('');
                        }}
                        className={`flex-shrink-0 px-4 py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 min-w-[64px] ${activeCategory === cat.id
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200 transform scale-105'
                                : 'bg-white text-gray-500 border border-gray-100'
                            }`}
                    >
                        <span className="text-xl">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* 商品リスト */}
            <div className="px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3" />
                        <p>いいものを探しています...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl text-gray-400">
                        {searchQuery
                            ? <><p className="text-2xl mb-3">🔍</p><p>「{searchQuery}」に一致する商品が見つかりませんでした</p></>
                            : <><p>このカテゴリにはまだ商品がありません 🐾</p></>
                        }
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 relative">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                                    )}
                                    {product.price && (
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            {product.price}
                                        </div>
                                    )}
                                    {/* カテゴリバッジ */}
                                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        {CATEGORIES.find((c) => c.id === product.category)?.icon ?? '🐾'}{' '}
                                        {CATEGORY_LABEL[product.category] ?? product.category}
                                    </div>
                                </div>
                                <h3 className="text-xs font-bold text-gray-800 line-clamp-2 mb-2 h-8">
                                    {product.title}
                                </h3>
                                <a
                                    href={product.amazonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-orange-50 text-orange-600 text-center py-2 rounded-xl text-[10px] font-bold hover:bg-orange-100 transition-colors"
                                >
                                    Amazonで見る 🔗
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 管理者FAB */}
            {isAdmin && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
                    <Link
                        href="/admin/shopping"
                        title="管理ダッシュボード"
                        className="bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </Link>
                    <Link
                        href="/app/shopping/register"
                        title="商品を追加"
                        className="bg-orange-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
                    >
                        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
}
