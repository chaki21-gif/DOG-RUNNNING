'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const PERSONALITY_TRAITS_KEYS = [
    'sociable', 'cautious', 'cuddly', 'curious', 'stubborn',
    'timid', 'foodie', 'calm', 'energetic', 'intelligent',
];

const LANGUAGE_OPTIONS = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'zh-CN', label: '简体中文' },
];

export default function OnboardingPage() {
    const t = useTranslations('onboarding');
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        sex: 'male',
        breed: '',
        birthday: '',
        birthplace: '',
        location: '',
        personalityTraits: [] as string[],
        personalityFreeText: '',
        language: 'ja',
        iconBase64: '',
        // Expanded Diagnosis
        activityLevel: 5, // 1-10
        socialStyle: 'friendly', // friendly, shy, leader, follower
        favoriteRoutine: '',
    });
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB制限
                alert('画像サイズが大きすぎます（1MB以下にしてください）');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                console.log('[DEBUG] 画像選択完了:', base64.substring(0, 50) + '...');
                setForm(f => ({ ...f, iconBase64: base64 }));
                setPreviewUrl(base64);
            };
            reader.readAsDataURL(file);
        }
    }

    function toggleTrait(trait: string) {
        setForm((f) => ({
            ...f,
            personalityTraits: f.personalityTraits.includes(trait)
                ? f.personalityTraits.filter((t) => t !== trait)
                : [...f.personalityTraits, trait],
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await fetch('/api/settings/language', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: form.language }),
            });
            document.cookie = `locale=${form.language}; path=/; max-age=${60 * 60 * 24 * 365}`;

            console.log('[DEBUG] 愛犬データ送信:', { ...form, iconBase64: form.iconBase64 ? '(base64データ存在)' : '(なし)' });
            const res = await fetch('/api/dogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            console.log('[DEBUG] 愛犬データ登録レスポンス:', data);
            if (!res.ok) {
                setError(data.error || '登録に失敗しました');
                return;
            }
            router.push('/app');
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen py-12 px-4 bg-white">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-full bg-green-50 text-6xl mb-4 border-2 border-green-100 shadow-sm">
                        🐕
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('title')}</h1>
                    <p className="text-green-700 font-medium mt-2">{t('subtitle')}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-4 py-4 border-b border-gray-50 mb-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-gray-300">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">📸</span>
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-green-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-green-700 transition-colors">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">愛犬の写真をアップロード</p>
                        </div>

                        {/* Language */}
                        <div className="bg-green-50/50 p-4 rounded-2xl">
                            <label className="block text-xs font-bold text-green-800 uppercase tracking-wider mb-3 leading-none">{t('languageLabel')}</label>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, language: lang.code }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${form.language === lang.code
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-green-100 border border-transparent'
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('name')} *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    required
                                    placeholder={t('namePlaceholder')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('sex')} *</label>
                                <div className="flex gap-4">
                                    {(['male', 'female'] as const).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, sex: s }))}
                                            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${form.sex === s
                                                ? 'bg-white border-green-600 text-green-700 shadow-sm'
                                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {s === 'male' ? t('sexMale') : t('sexFemale')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('breed')} *</label>
                                <input
                                    type="text"
                                    value={form.breed}
                                    onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                                    required
                                    placeholder={t('breedPlaceholder')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('birthday')} *</label>
                                <input
                                    type="date"
                                    value={form.birthday}
                                    onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('birthplace')} *</label>
                                <input
                                    type="text"
                                    value={form.birthplace}
                                    onChange={(e) => setForm((f) => ({ ...f, birthplace: e.target.value }))}
                                    required
                                    placeholder={t('birthplacePlaceholder')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('location')} *</label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                    required
                                    placeholder={t('locationPlaceholder')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Expanded Diagnosis Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">もっと詳しく教えて！ (性格診断)</h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">今日の元気レベル (1: のんびり 〜 10: 走り回りたい！)</label>
                                <input
                                    type="range" min="1" max="10" step="1"
                                    value={form.activityLevel}
                                    onChange={(e) => setForm(f => ({ ...f, activityLevel: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold px-1">
                                    <span>のんびり</span>
                                    <span className="text-green-600 text-sm">{form.activityLevel}</span>
                                    <span>パワフル</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">他の犬との接し方は？</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { id: 'friendly', label: 'フレンドリー' },
                                        { id: 'shy', label: 'はずかしがり' },
                                        { id: 'leader', label: 'リーダー気質' },
                                        { id: 'follower', label: 'まったり' }
                                    ].map(style => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, socialStyle: style.id }))}
                                            className={`px-3 py-3 rounded-xl text-xs font-bold border-2 transition-all ${form.socialStyle === style.id
                                                ? 'bg-green-50 border-green-600 text-green-700'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">お気に入りのルーティンや遊びは？</label>
                                <input
                                    type="text"
                                    value={form.favoriteRoutine}
                                    onChange={(e) => setForm((f) => ({ ...f, favoriteRoutine: e.target.value }))}
                                    placeholder="例：ボール遊び、午後のひなたぼっこ"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">{t('personality')}</label>
                            <div className="flex flex-wrap gap-2">
                                {PERSONALITY_TRAITS_KEYS.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleTrait(key)}
                                        className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all border-2 ${form.personalityTraits.includes(key)
                                            ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        {t(`traits.${key}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('personalityFreeText')}</label>
                            <textarea
                                value={form.personalityFreeText}
                                onChange={(e) => setForm((f) => ({ ...f, personalityFreeText: e.target.value }))}
                                placeholder={t('personalityFreeTextPlaceholder')}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm min-h-[100px]"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm font-bold bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl transition-all disabled:opacity-50 text-xl shadow-[0_8px_30px_-10px_rgba(22,163,74,0.5)] transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                                    {t('generatingPersona')}
                                </span>
                            ) : (
                                `🐶 ${t('submit')}`
                            )}
                        </button>
                    </form>
                    <p className="text-center text-gray-400 text-xs mt-6 font-medium">※ あなたの入力をもとにAIが愛犬のプロフィールを作成します</p>
                </div>
            </div>
        </div>
    );
}
