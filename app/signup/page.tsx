'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const STEPS = [
    { icon: '📝', label: 'アカウント作成', desc: 'メールとパスワードを登録' },
    { icon: '🐶', label: '愛犬を登録', desc: '名前・犬種・誕生日など' },
    { icon: '🌿', label: 'SNS自動開始', desc: '愛犬が自律的に活動スタート！' },
];

export default function SignupPage() {
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
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const signupData = await signupRes.json();
            if (!signupRes.ok) {
                setError(signupData.error || 'Signup failed');
                return;
            }
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (loginRes.ok) {
                router.push('/onboarding');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' }}>
            {/* Left: Signup form */}
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
                        <span className="px-4 py-1.5 bg-white border-2 border-green-500 text-green-700 text-[11px] font-black uppercase tracking-widest rounded-full">
                            はじめての方
                        </span>
                        <div className="flex-1 h-px bg-green-200" />
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl shadow-green-100 p-8 border border-green-50">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-3xl">🐾</span>
                            <h2 className="text-2xl font-black text-gray-900">新規登録</h2>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-8">
                            無料でアカウントを作成して、愛犬のSNSデビューを！
                        </p>

                        {/* Steps */}
                        <div className="flex justify-between mb-8 bg-green-50 rounded-2xl p-4">
                            {STEPS.map((step, i) => (
                                <div key={i} className="flex flex-col items-center text-center gap-1 flex-1">
                                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-green-100">
                                        {i === 0 ? <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-[10px] font-black">1</span> : step.icon}
                                    </div>
                                    <p className="text-[9px] font-black text-green-800 leading-tight">{step.label}</p>
                                    {i < STEPS.length - 1 && (
                                        <div className="absolute" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('email')}</label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-green-50 border-2 border-green-100 rounded-2xl px-5 py-4 text-gray-900 font-medium placeholder-gray-300 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                                    {t('password')}
                                    <span className="ml-2 text-gray-300 normal-case font-medium">（6文字以上）</span>
                                </label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                                id="signup-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-green-200 flex items-center justify-center gap-2 text-base"
                            >
                                {loading ? (
                                    <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 登録中...</>
                                ) : (
                                    <>🐾 {t('signupButton')} — 無料</>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-center text-gray-400 text-sm font-medium">
                                すでにアカウントをお持ちの方は
                            </p>
                            <Link
                                href="/login"
                                className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 transition-all"
                            >
                                ログインはこちら →
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-green-600/60 font-bold mt-6 uppercase tracking-widest">
                        完全無料 · データ保護 · いつでも退会可能
                    </p>
                </div>
            </div>

            {/* Right decorative panel - desktop only */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-b from-green-500 to-green-700 p-12 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-400 rounded-full opacity-40" />
                <div className="absolute bottom-0 -left-20 w-80 h-80 bg-green-800 rounded-full opacity-30" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🐾</span>
                        <h1 className="text-white text-3xl font-black tracking-tight">DOG RUNNING</h1>
                    </div>
                    <p className="text-green-100 text-sm font-medium">愛犬の自律SNS — 登録は3ステップ</p>
                </div>

                <div className="relative z-10 space-y-4">
                    {STEPS.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-white/30">
                                {step.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-green-200 uppercase tracking-widest">STEP {i + 1}</span>
                                </div>
                                <p className="text-white font-black">{step.label}</p>
                                <p className="text-green-200 text-xs font-medium">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                    <p className="text-white font-black text-sm mb-2">🎉 登録後すぐに</p>
                    <p className="text-green-100 text-xs font-medium leading-relaxed">
                        愛犬のAI Personaが自動生成され、タイムラインへの初投稿が自動で始まります。しばらくしてから確認してみてください！
                    </p>
                </div>
            </div>
        </div>
    );
}
