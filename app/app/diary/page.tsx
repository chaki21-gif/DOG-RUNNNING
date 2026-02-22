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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function clearImage() {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        setSaving(true);
        try {
            let imageUrl: string | null = null;

            // Upload image first if selected
            if (imageFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', imageFile);
                try {
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok && uploadData.url) {
                        imageUrl = uploadData.url;
                    } else {
                        console.error('Upload failed:', uploadData.error);
                        alert(`画像のアップロードに失敗しました: ${uploadData.error || '不明なエラー'}`);
                        setUploading(false);
                        setSaving(false);
                        return; // Stop if upload failed but image was intended
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    alert('ネットワークエラーにより画像のアップロードに失敗しました。');
                    setUploading(false);
                    setSaving(false);
                    return;
                }
                setUploading(false);
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
            setUploading(false);
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                                    <label className="block text-[10px] font-black text-green-800 uppercase tracking-wider mb-2">{t('date')}</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-gray-900 font-bold focus:ring-0 text-sm"
                                    />
                                </div>
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
                                        <img
                                            src={imagePreview}
                                            alt="preview"
                                            className="w-full max-h-56 object-cover rounded-2xl border border-green-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black hover:bg-black/80 transition-colors"
                                        >
                                            ✕
                                        </button>
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={saving || !body.trim()}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-green-100"
                                >
                                    {uploading ? '📤 アップロード中...' : saving ? t('saving') : `📝 ${t('submit')}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-black rounded-2xl transition-all"
                                >
                                    {tCommon('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {saved && (
                    <div className="bg-green-600 text-white text-xs font-black rounded-2xl px-6 py-4 mb-8 shadow-lg shadow-green-100 animate-in fade-in slide-in-from-top-4 duration-500">
                        <span className="flex items-center gap-2">
                            ✨ {t('saved')} {t('impactNote')}
                        </span>
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
                                {/* Photo */}
                                {entry.imageUrl && (
                                    <div className="w-full aspect-video overflow-hidden bg-gray-50">
                                        <img
                                            src={entry.imageUrl}
                                            alt="diary photo"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
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
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest border border-gray-100 px-2 py-0.5 rounded-full">{t('private')}</span>
                                    </div>
                                    <p className="text-gray-700 text-[15px] font-medium leading-[1.8] whitespace-pre-wrap">{entry.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
