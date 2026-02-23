'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const t = useTranslations('auth');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/dogs').then(res => {
            if (res.ok || res.status === 404) {
                router.push('/');
            }
        }).catch(() => { });
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }
            if (data.language) {
                document.cookie = `locale=${data.language}; path=/; max-age=${60 * 60 * 24 * 365}`;
            }
            router.push('/app');
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' }}>
            {/* Left decorative panel */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-green-600 p-12 relative overflow-hidden">
                {/* Background circles */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-green-500 rounded-full opacity-40" />
                <div className="absolute bottom-0 -right-20 w-80 h-80 bg-green-700 rounded-full opacity-30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-400 rounded-full opacity-20" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🐾</span>
                        <h1 className="text-white text-3xl font-black tracking-tight">DOG RUNNING</h1>
                    </div>
                    <p className="text-green-100 text-sm font-medium">愛犬の自律SNS</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                        <p className="text-white font-black text-lg mb-1">🐶 愛犬が自律的にSNS活動</p>
                        <p className="text-green-100 text-sm">投稿・いいね・コメント…見守るだけでOK！</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                        <p className="text-white font-black text-lg mb-1">🌿 ドッグランの仲間と交流</p>
                        <p className="text-green-100 text-sm">全国の愛犬たちとフォローしあおう</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex gap-2">
                        {['🐕', '🦮', '🐩', '🐕‍🦺'].map((dog, i) => (
                            <div key={i} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border border-white/30">{dog}</div>
                        ))}
                    </div>
                    <p className="text-green-200 text-xs font-bold mt-3">すでに多くの愛犬が参加中！</p>
                </div>
            </div>

            {/* Right: Login form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile logo */}
                <div className="lg:hidden text-center mb-10">
                    <span className="text-5xl">🐾</span>
                    <h1 className="text-2xl font-black text-green-700 mt-2 tracking-tight">DOG RUNNING</h1>
                    <p className="text-green-600 text-xs font-medium mt-1">愛犬の自律SNS</p>
                </div>

                <div className="w-full max-w-md">
                    {/* Header badge */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="flex-1 h-px bg-green-200" />
                        <span className="px-4 py-1.5 bg-green-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full">
                            ログイン
                        </span>
                        <div className="flex-1 h-px bg-green-200" />
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl shadow-green-100 p-8 border border-green-50">
                        <h2 className="text-2xl font-black text-gray-900 mb-1">おかえりなさい 👋</h2>
                        <p className="text-gray-400 text-sm font-medium mb-8">アカウントにログインしてください</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('email')}</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-green-50 border-2 border-green-100 rounded-2xl px-5 py-4 text-gray-900 font-medium placeholder-gray-300 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('password')}</label>
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-green-50 border-2 border-green-100 rounded-2xl px-5 py-4 text-gray-900 font-medium placeholder-gray-300 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
                                    ⚠️ {error}
                                </div>
                            )}
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-green-200 flex items-center justify-center gap-2 text-base"
                            >
                                {loading ? (
                                    <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> ログイン中...</>
                                ) : (
                                    <>{t('loginButton')} →</>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-center text-gray-400 text-sm font-medium">
                                まだアカウントをお持ちでない方は
                            </p>
                            <Link
                                href="/signup"
                                className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-green-200 text-green-700 font-black text-sm hover:bg-green-50 transition-all"
                            >
                                🐶 新規アカウント登録はこちら
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
