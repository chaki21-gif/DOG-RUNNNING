import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const userId = await getSession();

    if (!userId) {
        redirect('/login');
    }

    const user = await prisma.ownerUser.findUnique({
        where: { id: userId },
        select: { email: true, isAdmin: true }
    });

    // 制限: inu-admin@example.com もしくは isAdmin フラグが立っているユーザーのみ
    if (!user || (user.email !== 'inu-admin@example.com' && !user.isAdmin)) {
        redirect('/app'); // 一般ユーザーはアプリへ戻す
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <AdminSidebar />

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                        <span>Admin</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Logged in as</p>
                            <p className="text-xs font-black text-slate-900">{user.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            👤
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
