'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'food', label: 'フード（ごはん）' },
    { id: 'snack', label: 'おやつ' },
    { id: 'toy', label: 'おもちゃ' },
    { id: 'care', label: 'ケア用品' },
    { id: 'fashion', label: '服・アクセサリー' },
    { id: 'other', label: 'その他' },
];

export default function ProductEditPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    const [form, setForm] = useState({
        title: '',
        amazonUrl: '',
        category: 'food',
        price: '',
        imageUrl: '',
        isFeatured: false,
        displayOrder: 0,
    });

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            try {
                // Check Admin
                const authRes = await fetch('/api/auth/me');
                if (authRes.ok) {
                    const authData = await authRes.json();
                    if (authData.isAdmin) {
                        setIsAdmin(true);
                        // Load Product
                        const productRes = await fetch(`/api/products/${productId}`);
                        if (productRes.ok) {
                            const productData = await productRes.json();
                            setForm({
                                title: productData.title || '',
                                amazonUrl: productData.amazonUrl || '',
                                category: productData.category || 'food',
                                price: productData.price || '',
                                imageUrl: productData.imageUrl || '',
                                isFeatured: productData.isFeatured || false,
                                displayOrder: productData.displayOrder || 0,
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setAuthChecking(false);
                setLoading(false);
            }
        };
        checkAuthAndLoad();
    }, [productId]);

    const fetchMetadata = async () => {
        if (!form.amazonUrl) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/products/metadata?url=${encodeURIComponent(form.amazonUrl)}`);
            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    price: data.price || prev.price,
                    imageUrl: data.imageUrl || prev.imageUrl
                }));
            }
        } catch (err) {
            console.error('Fetch metadata failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                alert('商品を更新しました！ワン！🐾');
                router.push('/admin/shopping');
            } else {
                const data = await res.json();
                alert(`エラー: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました。');
        } finally {
            setSaving(false);
        }
    };

    if (authChecking || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...🐾</div>;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="text-6xl mb-6">🚫</div>
                <h1 className="text-2xl font-bold mb-4">アクセスできません</h1>
                <Link href="/app/shopping" className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold">
                    ショッピングへ戻る
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF7] pb-20">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-orange-50 px-6 py-4 flex items-center justify-between">
                <Link href="/admin/shopping" className="p-2 -ml-2 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="font-black text-lg tracking-tight">EDIT PRODUCT</h1>
                <div className="w-10"></div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-10">
                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[3rem] shadow-xl shadow-orange-50/50 border border-orange-50">
                    <div>
                        <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">商品名</label>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 transition-all focus:bg-white focus:border-orange-400"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">Amazon URL</label>
                        <div className="flex gap-3">
                            <input
                                type="url"
                                required
                                value={form.amazonUrl}
                                onChange={e => setForm({ ...form, amazonUrl: e.target.value })}
                                className="flex-1 bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold text-gray-800 focus:bg-white focus:border-orange-400"
                            />
                            <button
                                type="button"
                                onClick={fetchMetadata}
                                className="bg-orange-100 text-orange-600 px-6 rounded-[1.5rem] font-black text-xs hover:bg-orange-200 transition-colors"
                            >
                                再取得 ✨
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">商品画像URL</label>
                        <input
                            type="text"
                            value={form.imageUrl}
                            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-400"
                        />
                        {form.imageUrl && (
                            <div className="mt-4 p-2 bg-gray-50 rounded-2xl flex justify-center">
                                <img src={form.imageUrl} alt="Preview" className="h-32 object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center gap-4 bg-orange-50 p-6 rounded-[1.5rem] border-2 border-orange-100">
                            <label className="flex-1 text-xs font-black text-orange-900 uppercase tracking-widest cursor-pointer select-none">
                                ✨ おすすめ商品
                            </label>
                            <input
                                type="checkbox"
                                checked={form.isFeatured}
                                onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                                className="w-6 h-6 rounded-lg text-orange-500 focus:ring-orange-400 border-orange-200"
                            />
                        </div>
                        <div className="bg-gray-50 p-2 px-6 rounded-[1.5rem] border-2 border-transparent focus-within:bg-white focus-within:border-orange-400 transition-all">
                            <label className="text-[11px] font-black text-gray-400 mb-1 block uppercase tracking-widest">並び順</label>
                            <input
                                type="number"
                                value={form.displayOrder}
                                onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                                className="w-full bg-transparent border-none p-0 text-base font-bold text-gray-800 focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">カテゴリ</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 appearance-none focus:bg-white focus:border-orange-400 transition-all"
                            >
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">参考価格</label>
                            <input
                                type="text"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 focus:bg-white focus:border-orange-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg transition-all transform active:scale-[0.98] shadow-2xl disabled:opacity-50"
                    >
                        {saving ? '保存中...' : '変更を保存する 🐾'}
                    </button>
                </form>
            </main>
        </div>
    );
}
