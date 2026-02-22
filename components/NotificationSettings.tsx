'use client';
import { useState, useEffect } from 'react';

// ============================================================
// 通知設定ページ（通知ページ内で使うパネル）
// ============================================================

interface NotificationSetting {
    id: string;
    notifyLike: boolean;
    notifyComment: boolean;
    notifyFollow: boolean;
    notifyFriend: boolean;
}

interface Toggle {
    key: keyof Omit<NotificationSetting, 'id'>;
    label: string;
    desc: string;
    icon: string;
}

const TOGGLES: Toggle[] = [
    { key: 'notifyLike', label: 'いいね', desc: 'あなたの犬の投稿がいいねされたとき', icon: '❤️' },
    { key: 'notifyComment', label: 'コメント', desc: 'あなたの犬の投稿にコメントがついたとき', icon: '💬' },
    { key: 'notifyFollow', label: 'フォロー', desc: '誰かがあなたの犬をフォローしたとき', icon: '👥' },
    { key: 'notifyFriend', label: 'かいぬし', desc: 'かいぬし関連のお知らせ', icon: '🏡' },
];

export function NotificationSettingsPanel() {
    const [setting, setSetting] = useState<NotificationSetting | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/notifications/settings')
            .then(r => r.json())
            .then(d => setSetting(d))
            .catch(() => { });
    }, []);

    const toggle = async (key: keyof Omit<NotificationSetting, 'id'>) => {
        if (!setting) return;
        const newVal = !setting[key];
        const updated = { ...setting, [key]: newVal };
        setSetting(updated);
        setSaving(true);
        try {
            await fetch('/api/notifications/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newVal }),
            });
        } finally {
            setSaving(false);
        }
    };

    if (!setting) return <div className="p-4 text-gray-400 text-sm animate-pulse">設定を読み込み中...</div>;

    const allOn = TOGGLES.every(t => setting[t.key]);
    const allOff = TOGGLES.every(t => !setting[t.key]);

    const setAll = async (val: boolean) => {
        const update: Partial<NotificationSetting> = {};
        TOGGLES.forEach(t => { update[t.key] = val; });
        const updated = { ...setting, ...update };
        setSetting(updated as NotificationSetting);
        setSaving(true);
        try {
            await fetch('/api/notifications/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-gray-900 text-base">🔔 通知の設定</h3>
                {saving && <span className="text-xs text-green-500 font-bold animate-pulse">保存中…</span>}
            </div>

            {/* Preset buttons */}
            <div className="flex gap-2 pb-1">
                <button
                    id="notify-all-on-btn"
                    onClick={() => setAll(true)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${allOn ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                        }`}
                >
                    すべて通知
                </button>
                <button
                    id="notify-comment-only-btn"
                    onClick={async () => {
                        const u = { notifyLike: false, notifyComment: true, notifyFollow: false, notifyFriend: false };
                        setSetting(s => s ? { ...s, ...u } : s);
                        setSaving(true);
                        await fetch('/api/notifications/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) });
                        setSaving(false);
                    }}
                    className="flex-1 py-2 text-xs font-black rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-green-300 transition-all"
                >
                    コメントのみ
                </button>
                <button
                    id="notify-all-off-btn"
                    onClick={() => setAll(false)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${allOff ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-200'
                        }`}
                >
                    通知しない
                </button>
            </div>

            {/* Individual toggles */}
            <div className="space-y-2">
                {TOGGLES.map(t => (
                    <button
                        key={t.key}
                        id={`notify-toggle-${t.key}`}
                        onClick={() => toggle(t.key)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${setting[t.key]
                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                            }`}
                    >
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1 text-left">
                            <div className={`font-black text-sm ${setting[t.key] ? 'text-green-800' : 'text-gray-500'}`}>
                                {t.label}
                            </div>
                            <div className={`text-xs ${setting[t.key] ? 'text-green-600' : 'text-gray-400'}`}>
                                {t.desc}
                            </div>
                        </div>
                        {/* Toggle switch */}
                        <div className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${setting[t.key] ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${setting[t.key] ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}
                                style={{ left: setting[t.key] ? '22px' : '2px' }} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
