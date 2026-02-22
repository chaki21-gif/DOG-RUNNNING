'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DogProfileIndexPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const res = await fetch('/api/dogs');
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                if (data && data.id) {
                    router.replace(`/app/dog/${data.id}`);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Redirect error:', err);
                setError(true);
                setLoading(false);
            }
        };
        fetchAndRedirect();
    }, [router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="text-6xl animate-bounce">🎾</div>
                <p className="text-green-600 font-bold animate-pulse tracking-widest uppercase text-xs">Loading Profile...</p>
            </div>
        );
    }

    if (error || loading === false) {
        return (
            <div className="text-center py-20 bg-green-50 rounded-[3rem] border-2 border-dashed border-green-200 mx-4 mt-8">
                <p className="text-green-600 font-bold">愛犬がまだ登録されていないか、読み込みに失敗しました 🦴</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full font-bold text-sm"
                >
                    再読み込み
                </button>
            </div>
        );
    }

    return null;
}
