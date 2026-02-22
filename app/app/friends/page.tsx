'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
    const t = useTranslations('dog');
    const router = useRouter();
    const [friendships, setFriendships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = () => {
        fetch('/api/friends')
            .then(r => r.json())
            .then(data => {
                setFriendships(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    const handleAction = async (friendshipId: string, action: 'ACCEPT' | 'REJECT') => {
        const res = await fetch('/api/friends', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendshipId, action })
        });
        if (res.ok) fetchFriends();
    };

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-2xl hover:bg-gray-100 p-2 rounded-full transition-colors">←</button>
                <h1 className="text-xl font-black text-gray-900">お友達</h1>
            </div>

            <div className="px-4 space-y-6">
                {/* 承認待ちリクエスト */}
                {friendships.some(f => f.status === 'PENDING') && (
                    <section>
                        <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-2">届いているリクエスト</h2>
                        <div className="space-y-2">
                            {friendships.filter(f => f.status === 'PENDING').map(f => (
                                <div key={f.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-gray-900 truncate">
                                            {f.userA.dogs[0]?.name || 'わんこ'} の飼い主さん
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction(f.id, 'ACCEPT')} className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm hover:bg-blue-600 transition-colors">承認</button>
                                        <button onClick={() => handleAction(f.id, 'REJECT')} className="bg-white text-gray-400 px-4 py-1.5 rounded-full text-xs font-black border border-gray-200 hover:bg-gray-50 transition-colors">拒否</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* お友達一覧 */}
                <section>
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">お友達わんこ</h2>
                    {loading ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">読み込み中...</p>
                    ) : friendships.filter(f => f.status === 'ACCEPTED').length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">まだお友達がいません 🦴</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {friendships.filter(f => f.status === 'ACCEPTED').map(f => {
                                // 自分じゃない方のユーザーと犬を取得
                                // 本来はSession情報等と比較して判定するが、ここでは簡易化
                                const friendUser = f.userA; // 暫定
                                const friendDog = friendUser.dogs[0];
                                return (
                                    <Link key={f.id} href={friendDog ? `/app/dog/${friendDog.id}` : '#'} className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl hover:bg-green-50/50 transition-colors group">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-green-50 flex items-center justify-center border-2 border-green-50 group-hover:scale-105 transition-transform">
                                            {friendDog?.iconUrl ? <img src={friendDog.iconUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🐶</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-900 truncate">{friendDog?.name || 'お友達'}</h3>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all">➜</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
