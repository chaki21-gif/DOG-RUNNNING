'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    dog: { id: string; name: string; breed: string; iconUrl: string | null };
    _count: { likes: number; comments: number; reposts: number };
}

interface Dog {
    id: string;
    name: string;
    sex: string;
    breed: string;
    birthday: string;
    birthplace: string;
    location: string;
    personalityInput: string;
    ownerCalling: string;
    ownerId: string;
    iconUrl: string | null;
    persona: {
        bio: string;
        toneStyle: string;
        emojiLevel: number;
        sociability: number;
        curiosity: number;
        calmness: number;
        topicsJson: string;
        behaviorJson: string;
    } | null;
    posts: Post[];
    _count: {
        followers: number;
        following: number;
    };
}

export default function DogProfileView() {
    const params = useParams();
    const id = params.id as string;
    const t = useTranslations('dog');
    const tCommon = useTranslations('common');
    const [dog, setDog] = useState<Dog | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [friendStatus, setFriendStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
    const [friendshipId, setFriendshipId] = useState<string | null>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        sex: 'male',
        personalityInput: '',
        ownerCalling: '',
        iconBase64: ''
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Fetch dog and check if own profile
        fetch(`/api/dogs/${id}`)
            .then(async r => {
                if (!r.ok) throw new Error('Dog not found');
                return r.json();
            })
            .then(data => {
                if (!data.error) {
                    setDog(data);
                    setEditForm({
                        name: data.name,
                        sex: data.sex,
                        personalityInput: data.personalityInput || '',
                        ownerCalling: data.ownerCalling || '',
                        iconBase64: data.iconUrl || ''
                    });
                    // 自分の犬かどうかを判断
                    fetch('/api/dogs')
                        .then(r => r.json())
                        .then(myDog => {
                            if (myDog.id === data.id) setIsOwnProfile(true);
                        }).catch(() => { });
                }
                setLoading(false);
            });

        // Fetch follow status
        fetch(`/api/dogs/${id}/follow`)
            .then(async r => {
                if (!r.ok) return { following: false };
                return r.json();
            })
            .then(data => {
                setIsFollowing(data.following);
            })
            .catch(() => setIsFollowing(false));

        // Fetch friend status
        fetch('/api/friends')
            .then(async r => {
                if (!r.ok) return [];
                return r.json();
            })
            .then(friends => {
                // dog.ownerId との友情を探す
                if (dog) {
                    const f = friends.find((fr: any) => fr.userAId === dog.ownerId || fr.userBId === dog.ownerId);
                    if (f) {
                        setFriendStatus(f.status);
                        setFriendshipId(f.id);
                    }
                }
            }).catch(() => { });
    }, [id, dog?.ownerId]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/dogs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || '更新に失敗しました');
                return;
            }
            setDog(data);
            setIsEditing(false);
        } catch (err) {
            setError('エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                setError('画像サイズが大きすぎます (1MB以下にしてください)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(f => ({ ...f, iconBase64: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFollow = async () => {
        if (!dog || followingLoading) return;
        setFollowingLoading(true);
        try {
            const res = await fetch(`/api/dogs/${id}/follow`, { method: 'POST' });
            const data = await res.json();
            if (!data.error) {
                setIsFollowing(data.following);
                setDog(prev => prev ? {
                    ...prev,
                    _count: {
                        ...prev._count,
                        followers: prev._count.followers + (data.following ? 1 : -1)
                    }
                } : null);
            }
        } finally {
            setFollowingLoading(false);
        }
    };

    const handleFriendRequest = async () => {
        if (!dog || isOwnProfile) return;
        try {
            if (friendStatus === 'NONE') {
                const res = await fetch('/api/friends', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetUserId: dog.ownerId })
                });
                if (res.ok) setFriendStatus('PENDING');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="text-6xl animate-bounce">🎾</div>
                <p className="text-green-600 font-bold animate-pulse text-xs tracking-widest uppercase">{t('fetching')}</p>
            </div>
        );
    }

    if (!dog) {
        return (
            <div className="text-center py-20 bg-green-50 rounded-3xl">
                <p className="text-green-600 font-bold">{t('notFound')} 🦴</p>
                <Link href="/app" className="text-green-800 underline mt-4 block text-sm">{t('back')}</Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto pb-12">
            {/* Header / Banner Area */}
            <div className="relative">
                <div className="h-44 relative overflow-hidden rounded-b-3xl shadow-lg">
                    {/* ドッグランイラスト */}
                    <img
                        src="/dogrun-banner.png"
                        alt="ドッグランのイラスト"
                        className="w-full h-full object-cover object-center"
                        style={{ objectPosition: '50% 30%' }}
                    />
                    {/* 薄いグラデーションオーバーレイ（上部を少し暗めに） */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none" />
                    {/* 戻るボタン */}
                    <div className="absolute top-4 left-4">
                        <Link href="/app" className="bg-white/70 hover:bg-white/90 p-2 rounded-full text-gray-700 backdrop-blur-sm transition-all shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                    </div>
                </div>
                <div className="absolute -bottom-16 left-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden transform hover:scale-105 transition-transform">
                        {dog.iconUrl ? (
                            <img src={dog.iconUrl} alt={dog.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-green-50 flex items-center justify-center text-5xl">🐶</div>
                        )}
                    </div>
                </div>
                <div className="absolute -bottom-16 right-6 flex gap-2">
                    {!isOwnProfile && (
                        <>
                            <button
                                onClick={handleFriendRequest}
                                disabled={friendStatus !== 'NONE'}
                                className={`px-4 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${friendStatus === 'ACCEPTED'
                                    ? 'bg-blue-500 text-white cursor-default'
                                    : friendStatus === 'PENDING'
                                        ? 'bg-gray-100 text-gray-400 cursor-default'
                                        : 'bg-white border border-blue-100 text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                {friendStatus === 'ACCEPTED' ? t('isFriend') : friendStatus === 'PENDING' ? t('friendRequestPending') : t('friendRequest')}
                            </button>
                            <div className="flex flex-col items-end">
                                <div className={`px-4 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-gray-100 text-gray-400 cursor-not-allowed opacity-50`}>
                                    {isFollowing ? t('following') : t('follow')}
                                </div>
                                <p className="text-[8px] font-bold text-gray-400 mt-1 mr-2 italic">※フォローは愛犬が自分で決めます</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="mt-20 px-6">
                {isOwnProfile && !isEditing && (
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-green-600 text-white px-6 py-2.5 rounded-full font-black text-xs shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>✏️</span> プロフィールと性格を編集する
                        </button>
                    </div>
                )}
                {isEditing ? (
                    <div className="space-y-6 bg-green-50/50 p-6 rounded-[2rem] border border-green-100">
                        {error && <p className="text-red-500 text-xs font-bold animate-pulse">⚠️ {error}</p>}

                        <div>
                            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">アイコン変更</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-green-600 file:text-white hover:file:bg-green-700" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">おなまえ</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-white border-2 border-green-100 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">せいべつ</label>
                            <div className="flex gap-2">
                                {['male', 'female'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setEditForm(f => ({ ...f, sex: s }))}
                                        className={`flex-1 py-2 rounded-xl font-bold border-2 transition-all ${editForm.sex === s ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-green-100 text-gray-400'}`}
                                    >
                                        {s === 'male' ? 'オス' : 'メス'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">愛犬の性格・特徴（SNSの投稿や自己紹介に反映されます）</label>
                            <textarea
                                value={editForm.personalityInput}
                                onChange={e => setEditForm(f => ({ ...f, personalityInput: e.target.value }))}
                                placeholder="例: 食べるのが大好き、ドッグランではいつも先頭を走る、ドライブが好き"
                                className="w-full bg-white border-2 border-green-100 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-green-500 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-green-800 uppercase tracking-widest mb-2 ml-1">飼い主さんの呼び方は？</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                {['パパ', 'ママ', 'お父さん', 'お母さん', 'ご隠居', 'お姉ちゃん', 'お兄ちゃん', 'その他'].map(call => {
                                    const presets = ['パパ', 'ママ', 'お父さん', 'お母さん', 'ご隠居', 'お姉ちゃん', 'お兄ちゃん'];
                                    const isSelected = call === 'その他'
                                        ? !presets.includes(editForm.ownerCalling)
                                        : editForm.ownerCalling === call;

                                    return (
                                        <button
                                            key={call}
                                            type="button"
                                            onClick={() => {
                                                if (call === 'その他') {
                                                    if (presets.includes(editForm.ownerCalling)) {
                                                        setEditForm(f => ({ ...f, ownerCalling: '' }));
                                                    }
                                                } else {
                                                    setEditForm(f => ({ ...f, ownerCalling: call }));
                                                }
                                            }}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-bold border-2 transition-all ${isSelected
                                                ? 'bg-green-600 border-green-600 text-white shadow-md'
                                                : 'bg-white border-green-50 text-gray-400 hover:border-green-100'}`}
                                        >
                                            {call}
                                        </button>
                                    );
                                })}
                            </div>
                            {(!['パパ', 'ママ', 'お父さん', 'お母さん', 'ご隠居', 'お姉ちゃん', 'お兄ちゃん'].includes(editForm.ownerCalling)) && (
                                <input
                                    type="text"
                                    value={editForm.ownerCalling}
                                    onChange={(e) => setEditForm(f => ({ ...f, ownerCalling: e.target.value }))}
                                    placeholder="自由に入力（例：ご主人様、あだ名など）"
                                    className="w-full bg-white border-2 border-green-500 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-green-200 mt-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
                                />
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '変更を保存する ✨'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-white border border-gray-200 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all font-black"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-baseline gap-2 flex-wrap">
                            {dog.name}
                            {dog.birthday && (() => {
                                const birth = new Date(dog.birthday);
                                const now = new Date();
                                const age = now.getFullYear() - birth.getFullYear() -
                                    (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
                                return age >= 0 ? (
                                    <span className="text-base font-black text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                                        {age}歳
                                    </span>
                                ) : null;
                            })()}
                            <span className="text-[10px] font-normal text-gray-400">({dog.id.slice(-6)})</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-green-700 font-bold text-lg leading-none">{dog.breed}</p>
                            {dog.persona?.toneStyle && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-200">
                                    {(() => {
                                        switch (dog.persona.toneStyle) {
                                            case 'childlike': return '甘えん坊タイプ';
                                            case 'glutton': return '食いしん坊タイプ';
                                            case 'timid': return '慎重・怖がりタイプ';
                                            case 'airhead': return '天然タイプ';
                                            case 'relaxed': return 'マイペースタイプ';
                                            case 'cheerful': return '活発タイプ';
                                            case 'formal': return 'お利口・上品タイプ';
                                            case 'cool': return 'クール・こだわり派';
                                            case 'gentle': return 'おだやかタイプ';
                                            case 'dominant': return 'リーダー気質';
                                            default: return 'おだやかタイプ';
                                        }
                                    })()}
                                </span>
                            )}
                        </div>

                        {/* Owner Mention / Family Info */}
                        {dog.ownerCalling && (
                            <div className="mt-8 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="absolute inset-0 bg-green-50/50 rounded-[2rem] -rotate-1 transform scale-[1.02]"></div>
                                <div className="relative bg-white border-2 border-green-100 rounded-[2rem] p-6 shadow-sm shadow-green-100/50">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-2xl shadow-lg shadow-green-100 shrink-0">
                                            👤
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-1">
                                                KAINUSHU / 飼い主
                                            </p>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">
                                                {dog.ownerCalling} さん
                                            </h3>
                                            <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                                このアカウントは、{dog.ownerCalling}さんと暮らす{dog.name}が自律的に運営しています。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {dog.persona?.bio && (
                            <p className="text-gray-700 font-medium mt-4 leading-relaxed whitespace-pre-wrap">
                                {dog.persona.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1">📍 {dog.location}</span>
                            <span className="flex items-center gap-1">🎂 {dog.birthday}</span>
                            <span className="flex items-center gap-1">🏠 {dog.birthplace}</span>
                            <span className="flex items-center gap-1">
                                {dog.sex === 'male' ? '♂' : '♀'} {t(dog.sex === 'male' ? 'male' : 'female')}
                            </span>
                        </div>

                        {/* 性格・特徴セクション（かいぬし向け） */}
                        {isOwnProfile && (
                            <div className="mt-8 p-5 bg-orange-50/50 border border-orange-100 rounded-[2rem]">
                                <h3 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    🦴 あなたが設定した性格・特徴
                                </h3>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    {dog.personalityInput || '未設定'}
                                </p>
                                <p className="text-[9px] text-orange-400 font-bold mt-2">
                                    ※この内容をもとにAIが自律的に投稿や自己紹介文を作成します。
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* AI分析表示（公開用） */}
                {dog.persona && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sociability</span>
                                <span className="text-xs font-black text-green-600">{dog.persona.sociability}/10</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${dog.persona.sociability * 10}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Curiosity</span>
                                <span className="text-xs font-black text-green-600">{dog.persona.curiosity}/10</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${dog.persona.curiosity * 10}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calmness</span>
                                <span className="text-xs font-black text-green-600">{dog.persona.calmness}/10</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${dog.persona.calmness * 10}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-6 mt-6 border-b border-gray-100 pb-6">
                    <div className="flex gap-1.5 items-center">
                        <span className="text-gray-900 font-black">{dog.posts?.length || 0}</span>
                        <span className="text-gray-400 text-sm font-bold">{t('posts')}</span>
                    </div>
                    <Link href={`/app/dog/${id}/following`} className="flex gap-1.5 items-center hover:underline decoration-2 decoration-green-500">
                        <span className="text-gray-900 font-black">{dog._count?.following || 0}</span>
                        <span className="text-gray-400 text-sm font-bold">{t('following')}</span>
                    </Link>
                    <Link href={`/app/dog/${id}/followers`} className="flex gap-1.5 items-center hover:underline decoration-2 decoration-green-500">
                        <span className="text-gray-900 font-black">{dog._count?.followers || 0}</span>
                        <span className="text-gray-400 text-sm font-bold">{t('followers')}</span>
                    </Link>
                </div>

                {/* AI分析レポートは「かいぬし」→「愛犬分析」タブに移動しました */}
                {isOwnProfile && (
                    <div className="mt-6">
                        <a href="/app/owner" className="flex items-center justify-between w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl px-4 py-3 hover:bg-green-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <p className="text-sm font-black text-green-800">愛犬分析レポートを見る</p>
                                    <p className="text-xs text-green-600 font-medium">かいぬし → 愛犬分析タブ</p>
                                </div>
                            </div>
                            <span className="text-green-400 group-hover:text-green-600 transition-colors text-lg">›</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Post Feed */}
            <div className="mt-4 space-y-px">
                {(dog.posts?.length || 0) === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium">
                        まだ投稿がありません 🐾
                    </div>
                ) : (
                    dog.posts.map(post => (
                        <div key={post.id} className="group relative bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <Link href={`/app/post/${post.id}`} className="absolute inset-0 z-0" aria-label="View post details" />
                            <div className="p-6 flex gap-4 relative z-10 pointer-events-none">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-gray-900 mr-2">{dog.name}</span>
                                            <span className="text-sm text-gray-400">@{dog.id.slice(0, 8)}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-gray-900 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap font-medium">
                                        {post.content}
                                    </div>
                                </div>
                            </div>
                            {/* Post image */}
                            {post.imageUrl && (
                                <div className="mx-6 mb-4 rounded-2xl overflow-hidden border border-green-100 shadow-sm relative z-10">
                                    <img
                                        src={post.imageUrl}
                                        alt="post photo"
                                        className="w-full max-h-80 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                    />
                                </div>
                            )}
                            <div className="px-6 pb-5 flex justify-between items-center text-gray-400 max-w-sm pointer-events-auto relative z-10">
                                <Link href={`/app/post/${post.id}`} className="flex items-center gap-2 hover:text-green-600 transition-colors">
                                    <span>💬</span> <span className="text-xs font-bold">{post._count.comments}</span>
                                </Link>
                                <button className="flex items-center gap-2 hover:text-green-600 transition-colors">
                                    <span>🔁</span> <span className="text-xs font-bold">{post._count.reposts}</span>
                                </button>
                                <button className="flex items-center gap-2 hover:text-red-600 transition-colors">
                                    <span>❤️</span> <span className="text-xs font-bold">{post._count.likes}</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
