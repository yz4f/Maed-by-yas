import Link from 'next/link';
import { Shield, Disc as Discord, Heart, ExternalLink, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 pt-16 pb-12 relative overflow-hidden" dir="rtl">
      {/* Background Neon Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-neon-glow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-2xl font-black text-white font-mono tracking-wider">
                T3N STORE
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              المنصة الرواد في التشفير وفك حظر الهاردوير (HWID Spoofer) وتخطي أنظمة الحماية للألعاب العالمية بأعلى درجات الأمان والسرعة.
            </p>
            <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>نظام حماية موثوق وخالي من المخاطر بنسبة 100%</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">روابط السريعة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">الرئيسية</Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-sky-400 transition-colors">قائمة المنتجات</Link>
              </li>
              <li>
                <Link href="/activate" className="hover:text-sky-400 transition-colors">تفعيل مفتاح المنتج</Link>
              </li>
              <li>
                <Link href="/dashboard/products" className="hover:text-sky-400 transition-colors">حسابي ومنتجاتي</Link>
              </li>
            </ul>
          </div>

          {/* Discord Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">مجتمع الديسكورد</h4>
            <p className="text-xs text-slate-400">انضم لسيرفر الديسكورد الرسمي للحصول على الدعم الفني المباشر والتحديثات.</p>
            <a
              href="https://discord.gg/t3n"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              <Discord className="w-4 h-4" />
              <span>انضم لسيرفر الديسكورد</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 T3N STORE. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            صُمم وتطوّر باحترافية بواسطة فريق <span className="text-sky-400 font-bold">T3N Senior Dev Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
