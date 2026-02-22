'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();

    const [myDogId, setMyDogId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        fetch('/api/dogs')
            .then(r => r.json())
            .then(data => {
                if (data && data.id) setMyDogId(data.id);
            })
            .catch(() => { });

        // Initial fetch
        const checkUnread = () => {
            fetch('/api/notifications/unread')
                .then(r => r.json())
                .then(data => setUnreadCount(data.count || 0))
                .catch(() => { });
        };
        checkUnread();

        // Poll every 30 seconds
        const interval = setInterval(checkUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { href: '/app', icon: '🏠', label: t('timeline'), id: 'home' },
        { href: '/app/notifications', icon: '🔔', label: t('notifications'), id: 'notifications' },
        { href: myDogId ? `/app/dog/${myDogId}` : '/app/dog', icon: '🐕', label: t('myProfile'), id: 'profile' },
        { href: '/app/diary', icon: '📓', label: '毎日ログ', id: 'diary' },
        { href: '/app/chat', icon: '💬', label: '愛犬と話す', id: 'chat' },
        { href: '/app/search', icon: '🔍', label: '検索', id: 'search' },
        { href: '/app/owner', icon: '🏡', label: 'かいぬし', id: 'owner' },
        { href: '/app/shopping', icon: '🛒', label: 'ショッピング', id: 'shopping' },
        { href: '/settings', icon: '⚙️', label: t('settings'), id: 'settings' },
    ];

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-gray-100 flex-col py-8 px-6 z-20 bg-white">
                {/* Logo */}
                <Link href="/app" className="mb-10 flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">
                        🐾
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                        Dog<span className="text-green-600">Running</span>
                    </span>
                </Link>

                {/* Nav */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const hasBadge = item.id === 'notifications' && unreadCount > 0;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold group relative ${isActive
                                    ? 'bg-green-50 text-green-700 shadow-sm border border-green-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                                {hasBadge && (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-red-200 animate-bounce">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all font-bold mt-auto"
                >
                    <span className="text-xl">🚪</span>
                    <span>{t('logout')}</span>
                </button>

                {/* Note */}
                <div className="mt-6 p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                    <p className="text-green-700 text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">
                        {t('observerNote')}
                    </p>
                </div>
            </aside>

            {/* Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-2 py-3 pb-8 flex justify-evenly items-center z-50 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] rounded-t-[40px]">
                {navItems.slice(0, 4).map((item) => {
                    const isActive = pathname === item.href;
                    const hasBadge = item.id === 'notifications' && unreadCount > 0;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all relative ${isActive ? 'text-green-600 scale-110' : 'text-gray-400'}`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-center max-w-[60px] truncate">{item.label}</span>
                            {hasBadge && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
                {/* More Menu Trigger */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-all"
                >
                    <span className="text-2xl">☰</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Menu</span>
                </button>
            </nav>

            {/* Full Menu Overlay (Mobile) */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                    <div className="p-8 min-h-full flex flex-col pt-16">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-3xl font-black tracking-tighter uppercase px-2">
                                Menu
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex flex-col items-start gap-4 p-6 rounded-[32px] border transition-all ${isActive
                                            ? 'bg-green-600 border-green-700 text-white shadow-xl shadow-green-200'
                                            : 'bg-gray-50/50 border-gray-100 text-gray-900 active:bg-gray-100'
                                            }`}
                                    >
                                        <span className={`text-4xl p-2 rounded-2xl ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="font-black text-lg tracking-tight leading-none break-all">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-8 flex items-center justify-center gap-3 p-6 rounded-[32px] bg-red-50 text-red-600 font-black text-lg mb-8"
                        >
                            <span>🚪</span>
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="md:ml-64 flex-1 min-h-screen bg-white">
                <div className="max-w-2xl mx-auto min-h-screen border-x border-gray-50 flex flex-col pb-24 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
