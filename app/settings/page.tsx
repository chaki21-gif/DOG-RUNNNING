'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
    { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
];

export default function SettingsPage() {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedLang, setSelectedLang] = useState(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/locale=([^;]+)/);
            return match?.[1] || 'ja';
        }
        return 'ja';
    });

    // Account states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountMessage, setAccountMessage] = useState('');

    // Dog settings
    const [ownerCalling, setOwnerCalling] = useState('');
    const [dogId, setDogId] = useState<string | null>(null);
    const [dogSaving, setDogSaving] = useState(false);
    const [dogSaved, setDogSaved] = useState(false);

    useEffect(() => {
        fetch('/api/dogs')
            .then(r => r.json())
            .then(data => {
                if (data) {
                    setOwnerCalling(data.ownerCalling || 'パパ');
                    setDogId(data.id);
                }
            })
            .catch(() => { });
    }, []);

    const presets = ['パパ', 'ママ', 'お父さん', 'お母さん', 'ご隠居', 'お姉ちゃん', 'お兄ちゃん'];

    async function handleSave() {
        setSaving(true);
        try {
            await fetch('/api/settings/language', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: selectedLang }),
            });
            document.cookie = `locale=${selectedLang}; path=/; max-age=${60 * 60 * 24 * 365}`;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            // Reload to apply new language
            setTimeout(() => window.location.reload(), 500);
        } finally {
            setSaving(false);
        }
    }

    async function handleAccountSave() {
        if (!currentPassword) {
            setAccountMessage('⚠️ 現在のパスワードを入力してください');
            return;
        }
        setAccountSaving(true);
        setAccountMessage('');
        try {
            const res = await fetch('/api/settings/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newEmail, newPassword }),
            });
            const data = await res.json();
            if (data.error) {
                setAccountMessage(`❌ ${data.error}`);
            } else {
                setAccountMessage(`✅ ${t('saved')}`);
                setCurrentPassword('');
                setNewEmail('');
                setNewPassword('');
            }
        } catch {
            setAccountMessage('❌ エラーが発生しました');
        } finally {
            setAccountSaving(false);
        }
    }
    async function handleDogSave() {
        if (!dogId) return;
        setDogSaving(true);
        try {
            const res = await fetch(`/api/dogs/${dogId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerCalling }),
            });
            if (res.ok) {
                setDogSaved(true);
                setTimeout(() => setDogSaved(false), 3000);
            }
        } catch {
            setAccountMessage('❌ 愛犬の設定保存に失敗しました');
        } finally {
            setDogSaving(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {t('preferences')}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/app')}
                    className="group bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 px-4 py-2 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                    <span className="text-[10px] font-black text-gray-400 group-hover:text-green-600 uppercase tracking-widest leading-none mt-0.5">
                        {t('backToApp')}
                    </span>
                    <span className="text-gray-400 group-hover:text-green-600 transition-transform group-hover:translate-x-1">➜</span>
                </button>
            </div>

            <div className="px-6 space-y-8">
                {/* Language section */}
                <div className="bg-white border-2 border-green-50 rounded-[2.5rem] p-8 hover:border-green-100 transition-all shadow-xl shadow-green-100/10">
                    <h2 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="text-lg">🌐</span> {t('language')}
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left border-2 ${selectedLang === lang.code
                                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200'
                                    : 'bg-gray-50 border-gray-50 text-gray-500 hover:bg-white hover:border-green-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-2xl transform group-hover:scale-110 transition-transform">{lang.flag}</span>
                                <span className="font-black text-sm">{lang.label}</span>
                                {selectedLang === lang.code && (
                                    <span className="ml-auto bg-white/20 p-1 rounded-full text-xs">✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-green-100 transform active:scale-95"
                    >
                        {saving ? tCommon('saving') : `✨ ${t('save')}`}
                    </button>

                    {saved && (
                        <p className="text-center text-green-600 font-black text-xs mt-4 animate-bounce">
                            ✅ {t('saved')}
                        </p>
                    )}
                </div>

                {/* Dog Preferences Section */}
                <div className="bg-white border-2 border-green-50 rounded-[2.5rem] p-8 hover:border-green-100 transition-all shadow-xl shadow-green-100/10">
                    <h2 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="text-lg">🐕</span> 愛犬の設定
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-2">
                                愛犬からの呼び方 (あなたの呼び名)
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                {[...presets, 'その他'].map(call => {
                                    const isSelected = call === 'その他'
                                        ? !presets.includes(ownerCalling)
                                        : ownerCalling === call;

                                    return (
                                        <button
                                            key={call}
                                            type="button"
                                            onClick={() => {
                                                if (call === 'その他') {
                                                    if (presets.includes(ownerCalling)) setOwnerCalling('');
                                                } else {
                                                    setOwnerCalling(call);
                                                }
                                            }}
                                            className={`px-3 py-3 rounded-xl text-xs font-bold border-2 transition-all ${isSelected
                                                ? 'bg-green-600 border-green-600 text-white shadow-md'
                                                : 'bg-white border-green-50 text-gray-400 hover:border-green-100'}`}
                                        >
                                            {call}
                                        </button>
                                    );
                                })}
                            </div>

                            {(!presets.includes(ownerCalling)) && (
                                <input
                                    type="text"
                                    value={ownerCalling}
                                    onChange={(e) => setOwnerCalling(e.target.value)}
                                    placeholder="自由に入力（例：ご主人、あだ名など）"
                                    className="w-full bg-gray-50 border-2 border-green-100 rounded-2xl px-6 py-4 focus:bg-white focus:border-green-500 transition-all text-gray-900 font-bold outline-none animate-in fade-in slide-in-from-top-1 duration-200"
                                />
                            )}
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium px-2 leading-relaxed">
                            ※ここでの設定は、愛犬の自己紹介文や投稿、あなたへのコメントに反映されます。<br />
                            変更を保存すると、AIが新しい呼び方に合わせて自己紹介文を自動修正します。
                        </p>

                        <button
                            onClick={handleDogSave}
                            disabled={dogSaving}
                            className={`w-full font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg transform active:scale-95 ${dogSaved ? 'bg-emerald-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {dogSaving ? tCommon('saving') : dogSaved ? '✅ 保存しました！' : '✨ 呼び方を保存する'}
                        </button>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 hover:border-gray-100 transition-all">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <span className="text-lg">👤</span> {t('account')}
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                                {t('email')}
                            </label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="new@example.com"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 focus:bg-white focus:border-green-100 transition-all text-gray-900 font-bold outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                                {t('newPassword')}
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 focus:bg-white focus:border-green-100 transition-all text-gray-900 font-bold outline-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 block ml-2">
                                {t('currentPassword')} (Required)
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-red-50/30 border-2 border-red-50/30 rounded-2xl px-6 py-4 focus:bg-white focus:border-red-100 transition-all text-gray-900 font-bold outline-none"
                            />
                        </div>

                        <button
                            onClick={handleAccountSave}
                            disabled={accountSaving}
                            className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg active:scale-95"
                        >
                            {accountSaving ? tCommon('processing') : `🔐 ${t('updateAccount')}`}
                        </button>

                        {accountMessage && (
                            <p className="text-center font-black text-xs animate-pulse">
                                {accountMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50/30 border-2 border-red-100 rounded-[2.5rem] p-8 transition-all mb-12">
                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="text-lg">⚠️</span> {t('deleteAccount')}
                    </h2>

                    <p className="text-xs text-red-700/70 font-bold leading-relaxed mb-6 px-2">
                        {t('deleteDescription')}
                    </p>

                    <button
                        onClick={async () => {
                            if (confirm(t('deleteConfirmation'))) {
                                setAccountSaving(true);
                                try {
                                    const res = await fetch('/api/owner/delete', { method: 'DELETE' });
                                    if (res.ok) {
                                        router.push('/login');
                                    } else {
                                        const data = await res.json();
                                        alert(data.error || '削除に失敗しました');
                                    }
                                } catch {
                                    alert('通信エラーが発生しました');
                                } finally {
                                    setAccountSaving(false);
                                }
                            }
                        }}
                        disabled={accountSaving}
                        className="w-full bg-white border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        {accountSaving ? tCommon('processing') : t('deleteAccount')}
                    </button>
                </div>

            </div>
        </div>
    );
}
