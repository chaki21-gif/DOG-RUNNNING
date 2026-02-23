'use client';

import { useState, useEffect } from 'react';

interface Stats {
    userCount: number;
    dogCount: number;
    postCount: number;
    diaryCount: number;
    activeUserCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.stats) setStats(data.stats);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const cards = [
        { label: '総ユーザー数', value: stats?.userCount || 0, icon: '👥', color: 'bg-blue-500' },
        { label: '登録ワンちゃん数', value: stats?.dogCount || 0, icon: '🐶', color: 'bg-orange-500' },
        { label: '総投稿数', value: stats?.postCount || 0, icon: '📝', color: 'bg-green-500' },
        { label: 'アクティブユーザー (24h)', value: stats?.activeUserCount || 0, icon: '✨', color: 'bg-purple-500' },
        { label: '毎日ログ総数', value: stats?.diaryCount || 0, icon: '📓', color: 'bg-pink-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">システム状況</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">DOG SNS の稼働状況と数値を把握します</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                    🔄 更新
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                        <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                            {card.icon}
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-4xl font-black text-slate-900 tabular-nums">
                            {card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                        <span className="text-orange-500">Notice</span> 管理者のみなさまへ
                    </h3>
                    <p className="text-slate-400 font-bold leading-relaxed max-w-2xl">
                        このダッシュボードは <code className="text-orange-400 bg-orange-400/10 px-2 py-1 rounded">inu-admin@example.com</code> 専用の管理画面です。<br />
                        ユーザー数やアクティブ数を確認し、必要に応じてショッピング情報の更新を行ってください。
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <span className="text-[12rem] leading-none">📊</span>
                </div>
            </div>
        </div>
    );
}
