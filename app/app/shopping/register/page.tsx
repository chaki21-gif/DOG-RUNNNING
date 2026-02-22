'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'food', label: 'ごはん・おやつ' },
    { id: 'toy', label: 'おもちゃ' },
    { id: 'care', label: 'ケア用品' },
    { id: 'fashion', label: '服・アクセサリー' },
    { id: 'other', label: 'その他' },
];

export default function ProductRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    const [form, setForm] = useState({
        title: '',
        amazonUrl: '',
        category: 'food',
        price: '',
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.isAdmin) setIsAdmin(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                alert('商品を登録しました！ワン！🐾');
                router.push('/app/shopping');
            } else {
                const data = await res.json();
                alert(`エラー: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    if (authChecking) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">認証中...🐾</div>;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="text-6xl mb-6">🚫</div>
                <h1 className="text-2xl font-bold mb-4">アクセスできません</h1>
                <p className="text-gray-500 mb-8 max-w-xs">
                    このページは、DOG RUNNINGのスタッフ専用です。
                </p>
                <Link href="/app/shopping" className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold">
                    ショッピングへ戻る
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF7] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-orange-50 px-6 py-4 flex items-center justify-between">
                <Link href="/app/shopping" className="p-2 -ml-2 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="font-black text-lg tracking-tight">SHOP REGISTRY</h1>
                <div className="w-10"></div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-10">
                <div className="relative mb-12 rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100 aspect-video group">
                    <img
                        src="/shopping_registration_banner_1771694380353.png"
                        alt="Banner"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                        <p className="text-orange-300 font-bold text-xs mb-1 uppercase tracking-widest">Admin Workspace</p>
                        <h2 className="text-white text-3xl font-black">究極のセレクトを、<br />みんなに届けよう。</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[3rem] shadow-xl shadow-orange-50/50 border border-orange-50">
                    <div>
                        <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">商品名（キャッチコピーを含めてもOK）</label>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="例: 【最高級】鹿肉100%ジャーキー 極み"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 transition-all focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 placeholder-gray-300"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">Amazon URL</label>
                        <input
                            type="url"
                            required
                            value={form.amazonUrl}
                            onChange={e => setForm({ ...form, amazonUrl: e.target.value })}
                            placeholder="https://www.amazon.co.jp/..."
                            className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold text-gray-800 transition-all focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 placeholder-gray-300"
                        />
                        <div className="flex items-center gap-2 mt-3 ml-1">
                            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
                            <p className="text-[10px] font-bold text-gray-400">画像、説明文はAmazonから自動魔法で取得されます ✨</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">カテゴリ</label>
                            <div className="relative">
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 appearance-none focus:bg-white focus:border-orange-400 transition-all cursor-pointer"
                                >
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-gray-400 mb-2 ml-1 block uppercase tracking-widest">表示価格（参考）</label>
                            <input
                                type="text"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                placeholder="例: ¥2,480"
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-base font-bold text-gray-800 transition-all focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 placeholder-gray-300"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-[1.5rem] font-black text-lg transition-all transform active:scale-[0.98] shadow-2xl shadow-orange-200/50 flex items-center justify-center gap-3 ${loading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:brightness-105'
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                魔法で登録中...
                            </>
                        ) : (
                            <>
                                おすすめ商品として登録する 🐾
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        Selection with Love and Intelligence
                    </p>
                </form>

                <div className="mt-12 text-center">
                    <Link href="/app/shopping" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">
                        🛒 商品一覧に戻る
                    </Link>
                </div>
            </main>
        </div>
    );
}
