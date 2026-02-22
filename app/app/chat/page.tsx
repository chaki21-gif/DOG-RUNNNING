'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'dog';
    text: string;
    ts: number;
}

interface DogInfo {
    name: string;
    breed: string;
    iconUrl: string | null;
}

const QUICK_MESSAGES = [
    '今日も会いたかったよ！',
    '今日の散歩どうだった？',
    'おやつ食べた？',
    '何してたの？',
    '好きだよ！',
    '最近どんな子と遊んでるの？',
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [dogId, setDogId] = useState<string | null>(null);
    const [dog, setDog] = useState<DogInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 自分の犬を取得
    useEffect(() => {
        fetch('/api/dogs/my')
            .then(r => r.json())
            .then(data => {
                if (data?.id) {
                    setDogId(data.id);
                    setDog({ name: data.name, breed: data.breed, iconUrl: data.iconUrl });
                    // 最初のメッセージ
                    setMessages([{
                        id: 'init',
                        role: 'dog',
                        text: `わん！${data.name}だよ！🐾 かいぬしに会えて嬉しいわん！何でも話しかけてね！`,
                        ts: Date.now(),
                    }]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || !dogId || sending) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msg, ts: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, dogId }),
            });
            const data = await res.json();
            const dogMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'dog',
                text: data.message || '...わん？',
                ts: Date.now(),
            };
            setMessages(prev => [...prev, dogMsg]);
            if (data.dog && !dog) setDog(data.dog);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now().toString(), role: 'dog',
                text: 'ごめんね、うまく聞こえなかったわん…😢', ts: Date.now()
            }]);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-6xl animate-bounce">🐶</div>
                <p className="text-green-600 font-black animate-pulse text-sm uppercase tracking-widest">愛犬を呼んでいます…</p>
            </div>
        );
    }

    if (!dogId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
                <div className="text-6xl">🐾</div>
                <p className="font-black text-gray-900 text-xl">まだ犬がいません</p>
                <p className="text-gray-400 text-center text-sm">先に愛犬のプロフィールを作成してください</p>
                <Link href="/app" className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold">ホームへ</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 px-5 py-4">
                    <Link href="/app" className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    {dog && (
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-green-100 shadow-sm bg-green-50 flex items-center justify-center">
                                    {dog.iconUrl ? (
                                        <img src={dog.iconUrl} alt={dog.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl">🐶</span>
                                    )}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                            </div>
                            <div>
                                <p className="font-black text-gray-900 leading-tight">{dog.name}</p>
                                <p className="text-xs text-green-600 font-bold">{dog.breed} • オンライン中</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-[160px]">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {msg.role === 'dog' && dog && (
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-green-100 flex-shrink-0 shadow-sm">
                                {dog.iconUrl ? (
                                    <img src={dog.iconUrl} alt={dog.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-base">🐶</div>
                                )}
                            </div>
                        )}
                        <div className={`max-w-[72%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed font-medium ${msg.role === 'user'
                            ? 'bg-green-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">🐶</div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1 items-center h-4">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick messages */}
            <div className="fixed bottom-[172px] md:bottom-[72px] left-0 right-0 md:left-64 px-4 pb-2 z-[60]">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {QUICK_MESSAGES.map(q => (
                        <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            disabled={sending}
                            className="shrink-0 px-3 py-1.5 bg-white border border-green-200 text-green-700 text-xs font-bold rounded-2xl hover:bg-green-50 disabled:opacity-40 transition-colors shadow-sm whitespace-nowrap"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="fixed bottom-[100px] md:bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-100 px-4 py-3 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex gap-3 items-end max-w-2xl mx-auto">
                    <textarea
                        id="chat-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder={`${dog?.name ?? '愛犬'}に話しかける…`}
                        rows={1}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent font-medium"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                        id="chat-send-btn"
                        onClick={() => sendMessage()}
                        disabled={sending || !input.trim()}
                        className="w-11 h-11 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
