'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SignupPage() {
    const t = useTranslations('auth');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Rescue: If already logged in, redirect to root which handles dog check
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
            // Auto-login
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
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)' }}>
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="text-6xl mb-4">🐾</div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        WanSNS
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">{t('subtitle')}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6">{t('signup')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">{t('email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">{t('password')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="••••••••"
                            />
                        </div>
                        {error && (
                            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t('signupButton')}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        {t('haveAccount')}{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            {t('here')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
