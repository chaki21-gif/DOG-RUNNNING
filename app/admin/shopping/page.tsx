'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
    id: string;
    title: string;
    amazonUrl: string;
    imageUrl: string;
    category: string;
    price: string;
    isFeatured: boolean;
    displayOrder: number;
    createdAt: string;
}

const CATEGORIES: Record<string, string> = {
    food: 'ごはん・おやつ',
    toy: 'おもちゃ',
    care: 'ケア用品',
    fashion: '服・アクセサリー',
    other: 'その他',
};

export default function AdminShoppingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                setError('商品の取得に失敗しました');
            }
        } catch (err) {
            setError('通信エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`「${title}」を削除してもよろしいですか？ ワン？🐾`)) return;

        try {
            const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
                alert('削除完了だわん！');
            } else {
                alert('削除に失敗しました');
            }
        } catch (err) {
            alert('通信エラーが発生しました');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading Shopping Data...🐾</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shopping Management</h2>
                    <p className="text-slate-500 text-sm font-bold mt-1">おすすめ商品のセレクトと管理ができます</p>
                </div>
                <Link
                    href="/app/shopping/register"
                    className="bg-orange-500 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-orange-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="text-xl">✨</span>
                    新規商品を追加
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
                    <p className="text-3xl font-black text-slate-900">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Featured items</p>
                    <p className="text-3xl font-black text-blue-500">{products.filter(p => p.isFeatured).length}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Deals</p>
                    <p className="text-3xl font-black text-orange-500">{products.filter(p => p.price).length}</p>
                </div>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">商品</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">おすすめ</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">表示順</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">価格</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">カテゴリ</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">
                                        まだ登録された商品がありません。新しいおすすめを追加しましょう！🐾
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                                                    <a href={p.amazonUrl} target="_blank" rel="noopener" className="text-[10px] text-orange-500 font-bold hover:underline">Amazon 🔗</a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {p.isFeatured ? (
                                                <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black border border-blue-100">✨ おすすめ</span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">---</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black border border-slate-200">
                                                {p.displayOrder}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{p.price || '---'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">
                                                {CATEGORIES[p.category] || p.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/shopping/edit/${p.id}`}
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                                >
                                                    編集
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(p.id, p.title)}
                                                    className="bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
