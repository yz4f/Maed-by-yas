'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Key, Users, FileText, Disc as Discord, Shield, ArrowRight } from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'الإحصائيات العامة', icon: LayoutDashboard },
    { href: '/admin/products', label: 'إدارة المنتجات والمخزون', icon: Box },
    { href: '/admin/keys', label: 'مفاتيح التفعيل', icon: Key },
    { href: '/admin/customers', label: 'إدارة العملاء', icon: Users },
    { href: '/admin/logs', label: 'سجلات النظام (Logs)', icon: FileText },
    { href: '/admin/discord', label: 'ربط الديسكورد والرتب', icon: Discord },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-l border-slate-800/80 p-6 flex flex-col justify-between hidden md:flex min-h-screen" dir="rtl">
      <div className="space-y-8">
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 p-0.5 shadow-neon-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-black text-white font-mono tracking-wider">T3N ADMIN</h3>
            <p className="text-[10px] text-amber-400 font-semibold uppercase">Discord Master Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Return to Store */}
      <div className="pt-6 border-t border-slate-900">
        <Link
          href="/"
          className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors"
        >
          <span>الرجوع للمتجر</span>
          <ArrowRight className="w-4 h-4 text-sky-400 rotate-180" />
        </Link>
      </div>
    </aside>
  );
}
