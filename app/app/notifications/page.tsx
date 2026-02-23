'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { NotificationSettingsPanel } from '@/components/NotificationSettings';

interface Notification {
    id: string;
    type: string;
    createdAt: string;
    readAt: string | null;
    fromDog: { id: string; name: string; breed: string };
    post: { id: string; content: string } | null;
    postId: string | null;
}

export default function NotificationsPage() {
    const t = useTranslations('notifications');
    const tTimeline = useTranslations('timeline');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [affinity, setAffinity] = useState<any[]>([]);

    useEffect(() => {
        // Fetch notifications
        fetch('/api/notifications')
            .then((r) => r.json())
            .then((data) => {
                setNotifications(data);
                setLoading(false);
                // Mark all as read
                fetch('/api/notifications', { method: 'PATCH' });
            });

        // Fetch affinity analysis
        fetch('/api/dogs/analysis/affinity')
            .then(r => r.json())
            .then(data => setAffinity(data))
            .catch(() => { });
    }, []);

    const typeIcon: Record<string, string> = {
        like: '❤️',
        comment: '💬',
        repost: '🔁',
        follow: '🐾',
        buzz_small: '✨',
        buzz_mid: '🔥',
        buzz_max: '🌟'
    };

    function getTimeAgo(dateStr: string) {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        if (diffMin < 1) return tTimeline('ago.justNow');
        if (diffMin < 60) return tTimeline('ago.minutesAgo', { n: diffMin });
        if (diffHour < 24) return tTimeline('ago.hoursAgo', { n: diffHour });
        return tTimeline('ago.daysAgo', { n: Math.floor(diffHour / 24) });
    }

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 mb-2 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        {t('recentActivity')}
                    </p>
                </div>
                <Link href="/app" className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            </div>

            {/* 通知設定パネル */}
            <div className="mx-6 mb-6 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <NotificationSettingsPanel />
            </div>

            {/* Affinity Analysis */}
            {affinity.length > 0 && (
                <div className="px-6 mb-8">
                    <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-100">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-90">
                            <span>📊</span> 仲良し犬の分析
                        </h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {affinity.map((a, i) => (
                                <Link key={i} href={`/app/dog/${a.dog.id}`} className="shrink-0 group">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 group-hover:border-white transition-all shadow-md relative">
                                        {a.dog.iconUrl ? (
                                            <img src={a.dog.iconUrl} alt={a.dog.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl">🐶</div>
                                        )}
                                        <div className="absolute bottom-0 right-0 bg-red-500 text-[8px] font-black px-1 rounded-tl-lg shadow-sm">
                                            {a.score}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black mt-1.5 text-center truncate max-w-[56px] opacity-80">{a.dog.name}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="text-6xl animate-bounce">🔔</div>
                        <p className="text-green-600 font-black animate-pulse uppercase tracking-widest text-[10px]">{t('fetching')}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-6 grayscale opacity-20">🔔</div>
                        <p className="text-gray-400 font-bold">{t('empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((n) => {
                            const isBuzz = n.type.startsWith('buzz');
                            const targetHref = n.type === 'follow' ? `/app/dog/${n.fromDog.id}` : `/app/post/${n.postId || n.post?.id}`;
                            const isMaxBuzz = n.type === 'buzz_max';

                            return (
                                <Link
                                    key={n.id}
                                    href={targetHref}
                                    className={`flex gap-4 p-5 rounded-3xl transition-all border-2 ${!n.readAt
                                            ? isMaxBuzz ? 'bg-amber-50 border-amber-200 shadow-md ring-2 ring-amber-100' : 'bg-green-50 border-green-100 shadow-sm'
                                            : isMaxBuzz ? 'bg-white border-amber-200 hover:border-amber-300' : 'bg-white border-green-50 hover:border-green-100 hover:shadow-lg hover:shadow-green-100/50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0 border ${isMaxBuzz ? 'border-amber-200' : 'border-green-50'}`}>
                                        {typeIcon[n.type] || '📢'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 leading-tight">
                                            {isBuzz ? (
                                                <span className="font-black text-amber-600">DOG RUNNING事務局</span>
                                            ) : (
                                                <>
                                                    <span className="font-black hover:underline">{n.fromDog.name}</span>
                                                    <span className="text-gray-400 font-bold text-xs ml-1">({n.fromDog.breed})</span>
                                                </>
                                            )}
                                            <span className="mx-1 text-gray-400">·</span>
                                            <span className={`font-bold ${isMaxBuzz ? 'text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-lg' : isBuzz ? 'text-orange-600' : 'text-green-700'}`}>
                                                {t(`types.${n.type}`)}
                                            </span>
                                        </p>
                                        {n.post && (
                                            <p className="text-xs text-gray-500 mt-2 font-medium italic line-clamp-1 border-l-2 border-green-100 pl-2">
                                                "{n.post.content}"
                                            </p>
                                        )}
                                        <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-tighter">
                                            {getTimeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {!n.readAt && (
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shadow-lg animate-pulse ${isMaxBuzz ? 'bg-amber-500' : 'bg-green-500'}`} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
