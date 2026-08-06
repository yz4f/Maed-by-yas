'use client';

import { Disc as Discord, ShieldCheck, Crown, UserCheck, KeyRound } from 'lucide-react';

export function DiscordBanner() {
  const roles = [
    { title: 'boss', id: '1396965033316978839', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { title: 'co boss', id: '1510079414422212659', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
    { title: 'عميل', id: '1397221350095192074', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
    { title: 'بيرم', id: '1500092886467870720', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { title: 'فورت نايت', id: '1483330317040484364', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    { title: 'عضو', id: '1422761753573593088', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
  ];

  return (
    <section className="py-16 relative" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-500/30 relative overflow-hidden bg-gradient-to-r from-indigo-950/60 via-slate-950 to-slate-950">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-xl text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/40">
                <Discord className="w-4 h-4 text-indigo-400" />
                <span>ربط آلي بالكامل مع Discord Bot</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                توزيع الرتب تلقائياً فور تفعيل المفتاح
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                عند تفعيل أي مفتاح في المتجر، يتواصل البوت مع سيرفر الديسكورد فوراً ويمنحك الرتبة المستحقة مثل رتبة (عميل)، (بيرم)، أو (فورت نايت).
              </p>
            </div>

            {/* Roles Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              {roles.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border ${r.color} backdrop-blur-md flex flex-col items-center justify-center text-center gap-1 shadow-md`}
                >
                  <Crown className="w-4 h-4" />
                  <span className="font-bold text-xs">{r.title}</span>
                  <span className="font-mono text-[10px] opacity-70">ID: {r.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
