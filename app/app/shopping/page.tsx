'use client';
import { useState, useEffect } from 'react';
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
    { id: 'food', label: 'フード・おやつ', icon: '🍖' },
    { id: 'toy', label: 'おもちゃ', icon: '🧸' },
    { id: 'goods', label: 'お散歩・生活用品', icon: '🎒' },
    { id: 'health', label: 'ヘルスケア', icon: '💊' },
];

export default function ShoppingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // アドミン用フォームステート
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProduct, setNewProduct] = useState({
        title: '',
        description: '',
        amazonUrl: '',
        category: 'food',
        price: ''
    });

    useEffect(() => {
        const checkAuth = async () => {
            const res = await fetch('/api/auth/me');
            const data = await res.json().catch(() => ({}));
            if (data.isAdmin) setIsAdmin(true);
        };
        checkAuth();
        fetchProducts();
    }, [activeCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const url = activeCategory === 'all' ? '/api/products' : `/api/products?category=${activeCategory}`;
            const res = await fetch(url);
            const data = await res.json();

            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                console.error('API returned non-array data:', data);
                setProducts([]);
            }
        } catch (error) {
            console.error('Fetch products failed:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                body: JSON.stringify(newProduct),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (res.ok) {
                setShowAddForm(false);
                setNewProduct({ title: '', description: '', amazonUrl: '', category: 'food', price: '' });
                fetchProducts();
            } else {
                alert(`登録に失敗しました: ${data.error || '不明なエラー'}`);
            }
        } catch (error) {
            alert('通信エラーが発生しました。ネットワークを確認してください。');
        }
    };

    return (
        <div className="pb-24">
            {/* ヒーローセクション */}
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 pt-10 pb-20 px-6 text-white rounded-b-[3rem] shadow-lg mb-8 relative">
                <p className="text-[10px] text-white/70 mb-2 font-medium">※当ページには広告（Amazonアソシエイトリンク）が含まれています。</p>
                <h1 className="text-3xl font-bold mb-2 text-center md:text-left">Dog Shopping 🛍️</h1>

                {isAdmin && (
                    <div className="flex justify-center md:justify-start mt-6">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-white text-orange-600 px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-orange-100"
                        >
                            <span className="text-xl">✨</span> 商品を新しく登録する
                        </button>
                    </div>
                )}
            </div>

            {/* カテゴリタブ */}
            <div className="px-6 mb-8 overflow-x-auto no-scrollbar flex items-center gap-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 px-4 py-3 rounded-2xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${activeCategory === cat.id
                            ? 'bg-orange-500 text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-500'
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3"></div>
                        <p>いいものを探しています...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl text-gray-400">
                        <p>このカテゴリにはまだ商品がありません 🐾</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {products.map((product) => (
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

            {/* 管理者用リンク集 */}
            {isAdmin && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
                    <Link
                        href="/admin/shopping"
                        title="管理ダッシュボード"
                        className="bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
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
