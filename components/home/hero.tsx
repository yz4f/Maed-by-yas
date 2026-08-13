'use client';

import Link from 'next/link';
import { Shield, Key, Download, Sparkles, Disc as Discord, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden" dir="rtl">
      {/* Glow Effects */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-sky-500/30 text-sky-400 text-xs font-semibold mb-8 shadow-neon-glow"
        >
          <Zap className="w-4 h-4 animate-pulse text-amber-400" />
          <span>إصدار تعن v3.5 المتطور - دعم كامل لفك حظر جميع الألعاب بنسبة 100%</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight"
        >
          منصة <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 text-glow-blue">T3N STORE</span> الاحترافية لفك الحظر
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          أقوى نظام تفعيل مفاتيح وتخطي حظر الهاردوير (HWID Spoofer) لجميع الألعاب مثل Fortnite و Valorant و Warzone بأمان تام وتفعيل فوري عبر الديسكورد.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/activate"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white font-bold text-base shadow-neon-glow hover:shadow-neon-hover hover:scale-105 transition-all flex items-center gap-3"
          >
            <Key className="w-5 h-5" />
            <span>تفعيل المفتاح الآن</span>
          </Link>

          <Link
            href="/dashboard/products"
            className="px-8 py-4 rounded-2xl glass-panel hover:bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white font-bold text-base transition-all flex items-center gap-3"
          >
            <Download className="w-5 h-5 text-sky-400" />
            <span>صفحة منتجاتي</span>
          </Link>

          <a
            href="https://discord.gg/t3n"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-base transition-all flex items-center gap-3"
          >
            <Discord className="w-5 h-5 text-indigo-400" />
            <span>سيرفر الديسكورد</span>
          </a>
        </motion.div>

        {/* Feature Checkmarks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تفعيل فوري وآلي</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>إعطاء رتب الديسكورد تلقائياً</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>حماية من الكشف 100%</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
