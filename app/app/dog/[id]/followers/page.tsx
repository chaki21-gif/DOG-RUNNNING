'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Follower {
    follower: {
        id: string;
        name: string;
        breed: string;
        iconUrl: string | null;
    };
}

export default function FollowersPage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations('dog');
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/dogs/${id}/followers`)
            .then(r => r.json())
            .then(data => {
                setFollowers(data);
                setLoading(false);
            });
    }, [id]);

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-2xl hover:bg-gray-100 p-2 rounded-full transition-colors">
                    ←
                </button>
                <h1 className="text-xl font-black text-gray-900">{t('followers')}</h1>
            </div>

            <div className="px-4 space-y-2">
                {loading ? (
                    <p className="text-center py-10 text-gray-400 font-bold">読み込み中...</p>
                ) : followers.length === 0 ? (
                    <p className="text-center py-20 text-gray-400 font-bold">まだフォロワーがいません 🐾</p>
                ) : (
                    followers.map((f) => (
                        <Link
                            key={f.follower.id}
                            href={`/app/dog/${f.follower.id}`}
                            className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl hover:bg-green-50/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-green-50 flex items-center justify-center border-2 border-green-50 shadow-sm group-hover:scale-105 transition-transform">
                                {f.follower.iconUrl ? (
                                    <img src={f.follower.iconUrl} alt={f.follower.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🐶</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-gray-900 truncate">{f.follower.name}</h3>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{f.follower.breed}</p>
                            </div>
                            <span className="text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all">➜</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
