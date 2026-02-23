'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface DiaryEntry {
    id: string;
    date: string;
    body: string;
    imageUrl: string | null;
    createdAt: string;
}

export default function DiaryPage() {
    const t = useTranslations('diary');
    const tCommon = useTranslations('common');
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirm state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/diary')
            .then((r) => r.json())
            .then((data) => {
                setEntries(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, []);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function clearImage() {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        setSaving(true);
        try {
            let imageUrl: string | null = null;
            if (imagePreview) {
                if (imagePreview.length > 2 * 1024 * 1024) {
                    alert('画像サイズが大きすぎます。もう少し小さい画像を選択してください。');
                    setSaving(false);
                    return;
                }
                imageUrl = imagePreview;
            }

            const res = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, date, imageUrl }),
            });
            const data = await res.json();
            if (res.ok) {
                setEntries((prev) => [data, ...prev]);
                setBody('');
                clearImage();
                setSaved(true);
                setShowForm(false);
                setTimeout(() => setSaved(false), 3000);
            }
        } finally {
            setSaving(false);
        }
    }

    function startEdit(entry: DiaryEntry) {
        setEditingId(entry.id);
        setEditBody(entry.body);
        setEditDate(entry.date);
        setEditImagePreview(entry.imageUrl || null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditBody('');
        setEditDate('');
        setEditImagePreview(null);
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editBody.trim() || !editingId) return;
        setEditSaving(true);
        try {
            if (editImagePreview && editImagePreview.startsWith('data:') && editImagePreview.length > 2 * 1024 * 1024) {
                alert('画像サイズが大きすぎます。');
                return;
            }
            const res = await fetch(`/api/diary/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: editBody, date: editDate, imageUrl: editImagePreview }),
            });
            if (res.ok) {
                const updated = await res.json();
                setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
                cancelEdit();
            } else {
                alert('編集に失敗しました。');
            }
        } finally {
            setEditSaving(false);
        }
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/diary/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setEntries((prev) => prev.filter((e) => e.id !== id));
            setDeletingId(null);
        } else {
            alert('削除に失敗しました。');
        }
    }

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {t('privateNote')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-black px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-green-100 transform active:scale-95"
                    >
                        {showForm ? '閉じる' : `+ ${t('newEntry')}`}
                    </button>
                </div>
            </div>

            <div className="px-6">
                {/* Add form */}
                {showForm && (
                    <div className="bg-green-50/30 border-2 border-green-100/50 rounded-3xl p-6 mb-8 shadow-inner">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                                <label className="block text-[10px] font-black text-green-800 uppercase tracking-wider mb-2">{t('date')}</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-gray-900 font-bold focus:ring-0 text-sm"
                                />
                            </div>

                            <div className="bg-white p-4 rounded-3xl border border-green-100 shadow-sm">
                                <label className="block text-[10px] font-black text-green-800 uppercase tracking-wider mb-2">{t('body')}</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={4}
                                    placeholder={t('bodyPlaceholder')}
                                    required
                                    className="w-full bg-transparent border-none p-0 text-gray-900 font-medium placeholder-gray-300 text-sm focus:ring-0 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Photo upload */}
                            <div className="bg-white p-4 rounded-3xl border border-green-100 shadow-sm">
                                <label className="block text-[10px] font-black text-green-800 uppercase tracking-wider mb-3">
                                    📷 {t('photo')}
                                    <span className="ml-2 text-gray-400 normal-case font-bold text-[9px]">{t('photoNote')}</span>
                                </label>
                                {imagePreview ? (
                                    <div className="relative">
                                        <img src={imagePreview} alt="preview" className="w-full max-h-56 object-cover rounded-2xl border border-green-100" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black hover:bg-black/80 transition-colors"
                                        >✕</button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-green-200 rounded-2xl py-8 flex flex-col items-center gap-2 text-green-400 hover:text-green-600 hover:border-green-400 transition-colors"
                                    >
                                        <span className="text-3xl">📷</span>
                                        <span className="text-xs font-black uppercase tracking-widest">{t('addPhoto')}</span>
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={saving || !body.trim()}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-green-100"
                                >
                                    {saving ? t('saving') : `📝 ${t('submit')}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-black rounded-2xl transition-all"
                                >{tCommon('cancel')}</button>
                            </div>
                        </form>
                    </div>
                )}

                {saved && (
                    <div className="bg-green-600 text-white text-xs font-black rounded-2xl px-6 py-4 mb-8 shadow-lg shadow-green-100">
                        <span className="flex items-center gap-2">✨ {t('saved')} {t('impactNote')}</span>
                    </div>
                )}

                {/* Entry list */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="text-6xl animate-bounce">📓</div>
                        <p className="text-green-600 font-black animate-pulse uppercase tracking-widest text-[10px]">Loading Memories...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-6 grayscale opacity-20">📓</div>
                        <p className="text-gray-400 font-bold">{t('empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {entries.map((entry) => (
                            <div key={entry.id} className="group bg-white border-2 border-green-50 hover:border-green-100 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-green-100/50">
                                {/* Edit Mode */}
                                {editingId === entry.id ? (
                                    <form onSubmit={handleEdit} className="p-6 space-y-4">
                                        <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-2">✏️ 編集中</p>
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">{t('date')}</label>
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-gray-900 font-bold text-sm focus:ring-0"
                                            />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">{t('body')}</label>
                                            <textarea
                                                value={editBody}
                                                onChange={(e) => setEditBody(e.target.value)}
                                                rows={4}
                                                required
                                                className="w-full bg-transparent border-none p-0 text-gray-900 font-medium text-sm focus:ring-0 resize-none leading-relaxed"
                                            />
                                        </div>
                                        {/* Edit image */}
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">📷 写真</label>
                                            {editImagePreview ? (
                                                <div className="relative">
                                                    <img src={editImagePreview} alt="edit preview" className="w-full max-h-48 object-cover rounded-xl border border-gray-200" />
                                                    <button type="button" onClick={() => setEditImagePreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/80">✕</button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => editFileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors text-xs font-black">
                                                    📷 写真を追加
                                                </button>
                                            )}
                                            <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditFileChange} className="hidden" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" disabled={editSaving} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-black py-3 rounded-2xl disabled:opacity-50 transition-all">
                                                {editSaving ? '保存中...' : '✓ 保存する'}
                                            </button>
                                            <button type="button" onClick={cancelEdit} className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-black rounded-2xl transition-all">
                                                キャンセル
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {/* Photo */}
                                        {entry.imageUrl && (
                                            <div className="w-full aspect-video overflow-hidden bg-gray-50">
                                                <img src={entry.imageUrl} alt="diary photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-xl">
                                                        {entry.imageUrl ? '📸' : '📅'}
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Diary Entry</span>
                                                        <p className="text-sm font-black text-gray-900">{entry.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest border border-gray-100 px-2 py-0.5 rounded-full">{t('private')}</span>
                                                    {/* Edit / Delete buttons */}
                                                    <button
                                                        onClick={() => startEdit(entry)}
                                                        className="p-2 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                                        title="編集"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(entry.id)}
                                                        className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 text-[15px] font-medium leading-[1.8] whitespace-pre-wrap">{entry.body}</p>
                                        </div>
                                    </>
                                )}

                                {/* Delete confirmation dialog */}
                                {deletingId === entry.id && (
                                    <div className="mx-6 mb-6 bg-red-50 border-2 border-red-100 rounded-2xl p-5">
                                        <p className="text-sm font-black text-red-700 mb-4">⚠️ このログを削除しますか？この操作は取り消せません。</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleDelete(entry.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-black py-3 rounded-2xl transition-all">
                                                削除する
                                            </button>
                                            <button onClick={() => setDeletingId(null)} className="px-5 bg-white hover:bg-gray-50 text-gray-600 text-sm font-black rounded-2xl border border-gray-200 transition-all">
                                                キャンセル
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
