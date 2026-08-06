'use client';

import { useSession } from 'next-auth/react';
import { Crown, ShieldAlert, Bell, Disc as Discord } from 'lucide-react';

export function AdminHeader() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'Boss';

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-30" dir="rtl">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-black text-white">لوحة الإدارة الشاملة</h2>
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          رتبة الإدارة: {userRole}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 bg-slate-900 p-1.5 px-3 rounded-2xl border border-slate-800">
          <img
            src={session?.user?.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
            alt="Admin Avatar"
            className="w-8 h-8 rounded-xl border border-amber-500/40"
          />
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">{session?.user?.name || 'T3N Owner'}</span>
            <span className="text-[10px] text-sky-400 font-mono">ID: {session?.user?.discordId || '1396965033316978839'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
