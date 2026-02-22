'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// かいぬしページ（友達 + 掲示板 + 愛犬分析）
// ============================================================

type Tab = 'friends' | 'bulletin' | 'analysis';

interface OwnerFriend {
    id: string;
    friendId: string;
    memo: string;
    createdAt: string;
    friend: {
        id: string;
        email: string;
        dogs: { id: string; name: string; breed: string; iconUrl: string | null }[];
    };
}

interface BulletinTopic {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    pinned: boolean;
    isNew: boolean;
    isMyTopic: boolean;
    owner: { id: string; dogs: { name: string; iconUrl: string | null }[] };
    _count: { posts: number };
}

function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'たったいま';
    if (mins < 60) return `${mins}分前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}時間前`;
    return `${Math.floor(hrs / 24)}日前`;
}

// ──────────────────────────────────────────────
// 愛犬分析タブ
// ──────────────────────────────────────────────
function AnalysisTab() {
    const [data, setData] = useState<any>(null);
    const [dogId, setDogId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dogs/my')
            .then(r => r.json())
            .then(dog => {
                if (dog?.id) {
                    setDogId(dog.id);
                    return fetch(`/api/dogs/${dog.id}/analysis`);
                }
            })
            .then(r => r?.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">🐾 分析中...</div>;
    if (!data || data.error) return (
        <div className="p-8 text-center text-gray-400">
            <div className="text-5xl mb-3">🐕</div>
            <p className="font-bold">データがまだありません</p>
            <p className="text-sm mt-1">愛犬が投稿やいいねをするとここに表示されます</p>
        </div>
    );

    const moodBarColor = (val: number) =>
        val > 60 ? 'bg-green-500' : val > 30 ? 'bg-yellow-400' : 'bg-gray-300';

    const hourLabel = (h: number) => {
        if (h < 6) return '深夜';
        if (h < 12) return '朝';
        if (h < 18) return '昼';
        return '夜';
    };

    return (
        <div className="space-y-5 px-4 pb-8">
            {/* プロフィールカード */}
            <div className="mt-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-5 text-white shadow-xl shadow-green-200">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30 flex items-center justify-center">
                        {data.iconUrl ? (
                            <img src={data.iconUrl} alt={data.dogName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">🐶</span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-80">MY DOG</p>
                        <h2 className="text-2xl font-black flex items-baseline gap-2">
                            {data.dogName}
                            {data.birthday && (() => {
                                const birth = new Date(data.birthday);
                                const now = new Date();
                                const age = now.getFullYear() - birth.getFullYear() -
                                    (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
                                return age >= 0 ? (
                                    <span className="text-sm font-black bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                                        {age}歳
                                    </span>
                                ) : null;
                            })()}
                            <span className="text-[10px] font-normal opacity-60">({data.dogId.slice(-6).toUpperCase()})</span>
                        </h2>
                        <p className="text-sm font-bold opacity-80">{data.breed} / {data.location}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                        { label: '投稿数', value: data.totalPosts, icon: '✍️' },
                        { label: 'いいね数', value: data.totalLikes, icon: '❤️' },
                        { label: 'コメント数', value: data.totalComments, icon: '💬' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
                            <div className="text-xl">{s.icon}</div>
                            <div className="text-2xl font-black mt-1">{s.value}</div>
                            <div className="text-[10px] font-bold opacity-70 uppercase tracking-wide">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 今の気分 + 個性タグ */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">🎭 今のムード</h3>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{data.recentMood.includes('ごきげん') ? '🎉' : data.recentMood.includes('まったり') ? '😴' : data.recentMood.includes('ワクワク') ? '🔍' : '😊'}</span>
                    <div>
                        <p className="text-xl font-black text-gray-900">{data.recentMood}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">直近5件の投稿をもとに分析</p>
                    </div>
                </div>
                {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {data.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black border border-green-100">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* AI性格診断レポート */}
            {data.aiReport && (
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-0.5 shadow-xl shadow-purple-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white/95 backdrop-blur-sm rounded-[1.4rem] p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">✨</span>
                            <h3 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-widest">AI 性格診断レポート</h3>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                            {data.aiReport}
                        </p>
                        <div className="mt-4 pt-4 border-t border-purple-50 flex items-center justify-between text-[10px] font-bold text-purple-400">
                            <span>BY DOG-AI ANALYZER</span>
                            <span>PRECISION: HIGH</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 感情傾向バー */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">📊 投稿の感情傾向</h3>
                <div className="space-y-3">
                    {[
                        { label: 'ポジティブ 🎊', value: data.mood.positive },
                        { label: '好奇心旺盛 🔍', value: data.mood.curious },
                        { label: 'まったり 😴', value: data.mood.calm },
                    ].map(m => (
                        <div key={m.label}>
                            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                <span>{m.label}</span>
                                <span>{m.value}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${moodBarColor(m.value)}`}
                                    style={{ width: `${m.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                        <div className="text-xs text-gray-400 font-bold">社交性スコア</div>
                        <div className="text-2xl font-black text-green-600">{data.socialScore}</div>
                        <div className="text-[10px] text-gray-400">/ 100</div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                        <div className="text-xs text-gray-400 font-bold">活動スタイル</div>
                        <div className="text-lg font-black text-gray-700 mt-1">
                            {data.persona?.sociability > 7 ? '社交家 🤝' :
                                data.persona?.calmness > 7 ? 'おっとり 😌' :
                                    data.persona?.curiosity > 7 ? '探検家 🔭' : 'バランス型 ⚖️'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 好きな犬 */}
            {data.favoriteDogs.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="mb-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">❤️ 好きな犬ランキング</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 leading-tight">
                            ※分析の結果、あなたの愛犬が特に関心を持っている「他のお友達のわんこ」です。
                        </p>
                    </div>
                    <div className="space-y-3">
                        {data.favoriteDogs.map((d: any, i: number) => (
                            <Link key={d.id} href={`/app/dog/${d.id}`} className="flex items-center gap-3 hover:bg-green-50 rounded-2xl p-2 transition-colors group">
                                <span className="text-lg font-black text-gray-300 w-6 text-center">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                </span>
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-green-100 border border-green-50 flex items-center justify-center flex-shrink-0">
                                    {d.iconUrl ? (
                                        <img src={d.iconUrl} alt={d.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg">🐕</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 group-hover:text-green-700 transition-colors">{d.name}</p>
                                    <p className="text-xs text-gray-400 font-medium">{d.breed}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-green-600">スコア {d.score}</p>
                                    <p className="text-[10px] text-gray-400">相性度</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 好きな言葉 */}
            {data.favoriteWords.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">💬 よく使う言葉</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.favoriteWords.map((w: any, i: number) => {
                            const size = i === 0 ? 'text-2xl' : i < 3 ? 'text-lg' : i < 6 ? 'text-base' : 'text-sm';
                            const opacity = i === 0 ? 'opacity-100' : i < 3 ? 'opacity-80' : 'opacity-60';
                            return (
                                <span key={w.word} className={`${size} ${opacity} font-black text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100`}>
                                    {w.word}
                                    <span className="text-xs text-green-400 ml-1">×{w.count}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 活発な時間帯 */}
            {data.activeTimes.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">⏰ 活発な時間帯</h3>
                    <div className="space-y-3">
                        {data.activeTimes.map((t: any) => (
                            <div key={t.hour} className="flex items-center gap-3">
                                <div className="w-20 text-xs font-black text-gray-700">
                                    {String(t.hour).padStart(2, '0')}:00 {hourLabel(t.hour)}
                                </div>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                        style={{ width: `${Math.min(100, t.count * 15)}%` }}
                                    />
                                </div>
                                <div className="text-xs font-black text-green-600 w-12 text-right">{t.count}件</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">最も多く投稿する時間帯トップ3</p>
                </div>
            )}

            {/* チャットへのリンク */}
            <Link href="/app/chat"
                className="flex items-center justify-between w-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 text-white shadow-lg shadow-orange-200 hover:opacity-90 transition-opacity">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">CHAT</p>
                    <p className="text-xl font-black">愛犬と話してみる 💬</p>
                    <p className="text-xs font-bold opacity-80 mt-1">{data.dogName}があなたを待っています！</p>
                </div>
                <span className="text-4xl">🐾</span>
            </Link>
        </div>
    );
}

// ──────────────────────────────────────────────
// 友達タブ
// ──────────────────────────────────────────────
function FriendsTab() {
    const [friends, setFriends] = useState<OwnerFriend[]>([]);
    const [myInfo, setMyInfo] = useState<{ id: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [friendMemo, setFriendMemo] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const [editingMemo, setEditingMemo] = useState<string | null>(null);
    const [memoText, setMemoText] = useState('');
    const [copied, setCopied] = useState(false);

    const load = async () => {
        setLoading(true);
        const [friendsRes, meRes] = await Promise.all([
            fetch('/api/owner/friends'),
            fetch('/api/owner/me')
        ]);
        const friendsData = await friendsRes.json();
        const meData = await meRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : []);
        if (!meData.error) setMyInfo(meData);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const copyId = () => {
        if (!myInfo) return;
        navigator.clipboard.writeText(myInfo.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addFriend = async () => {
        setError('');
        if (!friendEmail.trim()) return;
        setAdding(true);
        try {
            const res = await fetch('/api/owner/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: friendEmail.trim(), memo: friendMemo }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.error || '追加に失敗しました');
            } else {
                setShowAdd(false);
                setFriendEmail('');
                setFriendMemo('');
                await load();
            }
        } finally {
            setAdding(false);
        }
    };

    const removeFriend = async (friendId: string) => {
        if (!confirm('お友達リストから削除しますか？')) return;
        await fetch('/api/owner/friends', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId }),
        });
        await load();
    };

    const saveMemo = async (friendId: string) => {
        await fetch(`/api/owner/friends/${friendId}/memo`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memo: memoText }),
        });
        setEditingMemo(null);
        await load();
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>;

    return (
        <div>
            {/* My ID Section */}
            {myInfo && (
                <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">あなたの「かいぬしID」</h3>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">お友達に教えてあげよう！</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100/50 p-3 rounded-2xl border border-gray-100">
                        <code className="flex-1 text-xs font-mono text-gray-600 break-all select-all">{myInfo.id}</code>
                        <button
                            onClick={copyId}
                            className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${copied ? 'bg-green-600 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'}`}
                        >
                            {copied ? 'コピーしました！' : 'コピー'}
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 font-medium">※SNS内の友達追加や、掲示板での本人確認に使用されます。</p>
                </div>
            )}

            <div className="px-4 py-4 flex justify-between items-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">お友達リスト</p>
                <button id="add-friend-btn" onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-100">
                    ＋ お友達を追加
                </button>
            </div>

            {showAdd && (
                <div className="mx-4 mb-6 p-6 bg-green-50 rounded-[2rem] border-2 border-green-100 space-y-4 animate-in slide-in-from-top duration-300">
                    <h3 className="font-black text-green-800 text-lg">お友達を登録する 🐾</h3>
                    <div>
                        <label className="text-xs font-black text-green-700 uppercase tracking-widest mb-1.5 block leading-none">かいぬしID または メールアドレス</label>
                        <input id="friend-id-input" type="text" value={friendEmail} onChange={e => setFriendEmail(e.target.value)}
                            placeholder="ID または email@example.com"
                            className="w-full px-4 py-3 bg-white border-2 border-green-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-green-500 transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-green-700 uppercase tracking-widest mb-1.5 block leading-none">メモ（お名前など）</label>
                        <input id="friend-memo-input" type="text" value={friendMemo} onChange={e => setFriendMemo(e.target.value)}
                            placeholder="例: 田中さん（ポメラニアンの飼い主）"
                            className="w-full px-4 py-3 bg-white border-2 border-green-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-green-500 transition-all shadow-sm" />
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100">
                            ⚠️ {error}
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button onClick={addFriend} disabled={adding}
                            className="flex-1 py-3.5 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-200">
                            {adding ? '追加中…' : 'お友達に追加する'}
                        </button>
                        <button onClick={() => setShowAdd(false)}
                            className="px-6 py-3.5 bg-white border-2 border-green-100 rounded-2xl font-black text-sm text-green-700 hover:bg-green-50 transition-all">
                            キャンセル
                        </button>
                    </div>
                </div>
            )}

            {friends.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-3">🤝</div>
                    <p className="font-bold">まだお友達がいません</p>
                    <p className="text-sm mt-1">リアルで犬友達のかいぬしを追加してみよう！</p>
                </div>
            ) : (
                <div className="space-y-3 px-4 pb-4">
                    {friends.map(f => (
                        <div key={f.id} className="p-4 border border-gray-100 rounded-2xl hover:border-green-200 transition-all">
                            <div className="flex items-start gap-3">
                                <div className="flex -space-x-2">
                                    {f.friend.dogs.slice(0, 3).map(dog => (
                                        <div key={dog.id} className="w-10 h-10 rounded-xl overflow-hidden bg-green-100 border-2 border-white">
                                            {dog.iconUrl ? (
                                                <img src={dog.iconUrl} alt={dog.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-lg">🐕</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-gray-900">{f.friend.dogs.map(d => d.name).join('・') || 'わんこ'}</div>
                                    <div className="text-xs text-gray-500 font-medium mt-0.5">{f.friend.dogs.map(d => d.breed).join('・')}</div>
                                    {editingMemo === f.friendId ? (
                                        <div className="mt-2 flex gap-2">
                                            <input type="text" value={memoText} onChange={e => setMemoText(e.target.value)}
                                                className="flex-1 text-xs px-2 py-1 border border-green-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400"
                                                placeholder="メモを入力" />
                                            <button onClick={() => saveMemo(f.friendId)} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg font-bold">保存</button>
                                            <button onClick={() => setEditingMemo(null)} className="text-xs px-2 py-1 bg-gray-100 rounded-lg font-bold">✕</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditingMemo(f.friendId); setMemoText(f.memo); }}
                                            className="mt-1 text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                                            📝 {f.memo ? f.memo : 'メモを追加'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {f.friend.dogs[0] && (
                                        <Link href={`/app/dog/${f.friend.dogs[0].id}`}
                                            className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 transition-colors">
                                            プロフィール
                                        </Link>
                                    )}
                                    <button onClick={() => removeFriend(f.friendId)}
                                        className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">✕</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// 掲示板タブ
// ──────────────────────────────────────────────
function BulletinTab() {
    const [topics, setTopics] = useState<BulletinTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [posting, setPosting] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const loadTopics = async () => {
        setLoading(true);
        const res = await fetch('/api/bulletin');
        const data = await res.json();
        setTopics(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { loadTopics(); }, []);

    const createTopic = async () => {
        if (!newTitle.trim()) return;
        setPosting(true);
        try {
            const res = await fetch('/api/bulletin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, body: newBody }),
            });
            if (res.ok) { setShowNew(false); setNewTitle(''); setNewBody(''); await loadTopics(); }
        } finally { setPosting(false); }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>;
    if (selectedTopic) return <TopicDetail topicId={selectedTopic} onBack={() => { setSelectedTopic(null); loadTopics(); }} />;

    return (
        <div>
            <div className="px-4 py-3 flex justify-between items-center">
                <p className="text-sm text-gray-500 font-medium">かいぬし同士の掲示板</p>
                <button id="new-topic-btn" onClick={() => setShowNew(!showNew)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
                    ＋ 新しいトピック
                </button>
            </div>

            {showNew && (
                <div className="mx-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl space-y-3">
                    <h3 className="font-black text-green-800">新しいトピックを作る</h3>
                    <input id="topic-title-input" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder="トピックのタイトル"
                        className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <textarea id="topic-body-input" value={newBody} onChange={e => setNewBody(e.target.value)}
                        placeholder="詳しい内容（任意）" rows={3}
                        className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <div className="flex gap-2">
                        <button onClick={createTopic} disabled={posting}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                            {posting ? '作成中…' : 'トピックを作成'}
                        </button>
                        <button onClick={() => setShowNew(false)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                    </div>
                </div>
            )}

            {topics.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="font-bold">まだトピックがありません</p>
                    <p className="text-sm mt-1">最初のトピックを作ってみよう！</p>
                </div>
            ) : (
                <div className="space-y-2 px-4 pb-4">
                    {topics.map(topic => (
                        <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}
                            className="w-full text-left p-4 border border-gray-100 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all group">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {topic.pinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">📌 固定</span>}
                                        {topic.isNew && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black animate-pulse">✨ NEW</span>}
                                        {topic.isMyTopic && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">✍️ 自分</span>}
                                        <span className="font-black text-gray-900 group-hover:text-green-700 transition-colors">{topic.title}</span>
                                    </div>
                                    {topic.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.body}</p>}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                        <span>✍️ {topic.owner.dogs[0]?.name ?? '—'}</span>
                                        <span>💬 {topic._count.posts}件</span>
                                        <span>🕐 {formatRelative(topic.updatedAt)}</span>
                                    </div>
                                </div>
                                <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg mt-1">›</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// トピック詳細（編集・削除つき）
// ──────────────────────────────────────────────
interface TopicDetailData {
    id: string;
    title: string;
    body: string;
    isMyTopic: boolean;
    createdAt: string;
    owner: { id: string; dogs: { name: string; iconUrl: string | null }[] };
    posts: {
        id: string;
        content: string;
        createdAt: string;
        isMyPost?: boolean;
        owner: { id: string; dogs: { name: string; iconUrl: string | null }[] };
    }[];
}

function TopicDetail({ topicId, onBack }: { topicId: string; onBack: () => void }) {
    const [topic, setTopic] = useState<TopicDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [posting, setPosting] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const load = async () => {
        const res = await fetch(`/api/bulletin/${topicId}`);
        const data = await res.json();
        setTopic(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, [topicId]);

    const sendReply = async () => {
        if (!reply.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/bulletin/${topicId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: reply }),
            });
            if (res.ok) { setReply(''); await load(); }
        } finally { setPosting(false); }
    };

    const deletePost = async (postId: string) => {
        if (!confirm('この返信を削除しますか？')) return;
        await fetch(`/api/bulletin/${topicId}/posts/${postId}`, { method: 'DELETE' });
        await load();
    };

    const saveEdit = async (postId: string) => {
        if (!editText.trim()) return;
        await fetch(`/api/bulletin/${topicId}/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editText }),
        });
        setEditingPostId(null);
        await load();
    };

    if (loading || !topic) return <div className="p-8 text-center text-gray-400 animate-pulse">読み込み中...</div>;

    return (
        <div>
            <div className="px-4 py-4 border-b border-gray-100">
                <button onClick={onBack} className="flex items-center gap-2 text-green-600 font-bold text-sm hover:text-green-700 mb-3">
                    ← 掲示板に戻る
                </button>
                <h2 className="text-xl font-black text-gray-900">{topic.title}</h2>
                {topic.body && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{topic.body}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>✍️ {topic.owner.dogs[0]?.name ?? '—'}</span>
                    <span>🕐 {formatRelative(topic.createdAt)}</span>
                </div>
            </div>

            <div className="divide-y divide-gray-50 pb-[160px]">
                {topic.posts.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                        <p className="font-bold">まだ返信がないよ</p>
                        <p className="text-sm mt-1">最初の返信をしてみよう！</p>
                    </div>
                )}
                {topic.posts.map((p, i) => (
                    <div key={p.id} className="px-4 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-green-100 flex-shrink-0">
                                {p.owner.dogs[0]?.iconUrl ? (
                                    <img src={p.owner.dogs[0].iconUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-base">🐕</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="font-black text-sm text-gray-900">{p.owner.dogs[0]?.name ?? 'かいぬし'}</span>
                                    <span className="text-xs text-gray-400">#{i + 1}</span>
                                    {p.isMyPost && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">自分</span>}
                                    <span className="text-xs text-gray-400 ml-auto">{formatRelative(p.createdAt)}</span>
                                </div>

                                {editingPostId === p.id ? (
                                    <div className="mt-2 space-y-2">
                                        <textarea
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-green-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => saveEdit(p.id)}
                                                className="flex-1 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700">
                                                保存
                                            </button>
                                            <button onClick={() => setEditingPostId(null)}
                                                className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
                                                キャンセル
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                                )}

                                {p.isMyPost && editingPostId !== p.id && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => { setEditingPostId(p.id); setEditText(p.content); }}
                                            className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-0.5 hover:bg-blue-50 px-2 py-0.5 rounded-lg transition-colors">
                                            ✏️ 編集
                                        </button>
                                        <button
                                            onClick={() => deletePost(p.id)}
                                            className="text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-0.5 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors">
                                            🗑 削除
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply form */}
            <div className="fixed bottom-[100px] md:bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-100 p-4 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-2xl mx-auto flex gap-3">
                    <textarea id="reply-input" value={reply} onChange={e => setReply(e.target.value)}
                        placeholder="返信を入力…" rows={2}
                        className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" />
                    <button id="send-reply-btn" onClick={sendReply} disabled={posting || !reply.trim()}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-40 transition-colors self-end">
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// メインページ
// ──────────────────────────────────────────────
export default function OwnerPage() {
    const [tab, setTab] = useState<Tab>('analysis');

    const TABS: { key: Tab; label: string; icon: string }[] = [
        { key: 'analysis', label: '愛犬分析', icon: '📊' },
        { key: 'friends', label: 'お友達', icon: '🤝' },
        { key: 'bulletin', label: '掲示板', icon: '📋' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-100">
                <div className="px-4 pt-4 pb-0 flex items-center justify-between">
                    <h1 className="text-xl font-black text-gray-900 mb-3">🏡 かいぬし</h1>
                    <Link href="/app/chat"
                        className="mb-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-200 transition-colors">
                        💬 愛犬と話す
                    </Link>
                </div>
                <div className="flex gap-0">
                    {TABS.map(t => (
                        <button key={t.key} id={`owner-tab-${t.key}`} onClick={() => setTab(t.key)}
                            className={`flex-1 py-3 text-xs font-black border-b-2 transition-all flex items-center justify-center gap-1 ${tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}>
                            <span>{t.icon}</span><span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'analysis' && <AnalysisTab />}
            {tab === 'friends' && <FriendsTab />}
            {tab === 'bulletin' && <BulletinTab />}
        </div>
    );
}
