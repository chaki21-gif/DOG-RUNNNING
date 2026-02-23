'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { label: '状況ダッシュボード', href: '/admin', icon: '📊' },
    { label: 'ショッピング管理', href: '/admin/shopping', icon: '🛒' },
    { label: 'ユーザー管理', href: '/admin/users', icon: '👥' },
    { label: '犬管理', href: '/admin/dogs', icon: '🐶' },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col">
            <div className="p-8 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
                    🐾
                </div>
                <div>
                    <h1 className="text-white font-black tracking-tight">DOG SNS</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Admin Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold ${isActive
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-slate-800">
                <Link href="/app" className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:text-white transition-colors">
                    <span>← SNSへ戻る</span>
                </Link>
            </div>
        </aside>
    );
}
