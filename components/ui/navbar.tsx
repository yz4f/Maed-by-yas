'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Key, Download, LayoutDashboard, Disc as Discord, Sparkles, User as UserIcon } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Shield },
    { href: '/#products', label: 'المنتجات', icon: Sparkles },
    { href: '/activate', label: 'تفعيل المفتاح', icon: Key },
    { href: '/dashboard/products', label: 'منتجاتي', icon: Download },
  ];

  const isAdmin = session?.user?.role === 'Boss' || session?.user?.role === 'Co-Boss' || session?.user?.role === 'Admin';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 shadow-lg shadow-sky-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between" dir="rtl">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 p-0.5 shadow-neon-glow group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              <img src="/logo.png?v=6" alt="تعن" className="w-full h-full rounded-[14px] object-cover select-none" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 font-bold notranslate" translate="no">
              تعن
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl bg-sky-500/10 border border-sky-500/30"
                  />
                )}
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Admin Link if Admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                pathname.startsWith('/admin')
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة الإدارة</span>
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/activate"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-sm shadow-neon-glow hover:shadow-neon-hover hover:scale-105 transition-all duration-300"
          >
            <Key className="w-4 h-4" />
            <span>تفعيل المفتاح</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 pr-3 rounded-xl border border-slate-800">
              <img
                src={session.user?.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt="Avatar"
                className="w-8 h-8 rounded-lg border border-sky-500/40"
              />
              <span className="text-xs font-semibold text-slate-200 hidden lg:inline">
                {session.user?.name}
              </span>
            </div>
          ) : (
            <button
              onClick={() => signIn('discord')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold text-sm transition-all"
            >
              <Discord className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">ربط Discord</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
