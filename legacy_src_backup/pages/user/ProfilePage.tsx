import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, Clock, Package, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth.tsx';
import { apiFetch } from '../../api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

export function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ products: any[]; account: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        const res = await apiFetch('/user/dashboard');
        if (mounted && res.success) {
          setData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card variant="gradient" className="flex items-center justify-between border-sky-900/25 bg-gradient-to-l from-sky-500/5 via-[#0D1829] to-[#0D1829] p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <User className="w-6 h-6 text-sky-400" />
            الملف الشخصي والحساب
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            إدارة إعدادات حسابك والاطلاع على التراخيص الخاصة بك.
          </p>
        </div>
        <Badge variant="success" icon={<Sparkles className="w-3.5 h-3.5" />} className="hidden sm:inline-flex bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          حساب موثق
        </Badge>
      </Card>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="overflow-hidden p-8 sm:p-10 bg-[#0D1829] border border-sky-900/20 shadow-none rounded-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-900/40 rounded-3xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(14,165,233,0.1)] relative overflow-hidden group">
              <span className="text-5xl font-black text-sky-400 font-alexandria relative z-10">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            
            <div className="flex-grow text-center md:text-right space-y-8 w-full">
              {/* Header Info */}
              <div>
                <h2 className="text-3xl font-black text-white font-alexandria mb-3 flex items-center justify-center md:justify-start gap-2">
                  <span>{user?.name || 'مستخدم'}</span>
                  <Zap className="w-5 h-5 text-sky-400 animate-pulse" />
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {user?.role === 'owner' ? 'مالك المنصة' : user?.role === 'admin' ? 'مدير النظام' : 'عضو مفعّل'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-[#070E1A] p-4 rounded-2xl border border-sky-900/20">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1 font-bold">البريد الإلكتروني</p>
                    <p className="text-zinc-200 text-sm font-mono truncate tracking-wide">{user?.email || 'لا يوجد'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#070E1A] p-4 rounded-2xl border border-sky-900/20">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1 font-bold">تاريخ الانضمام</p>
                    <p className="text-zinc-200 text-sm font-mono tracking-wide">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '2026/01/01'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#070E1A] p-4 rounded-2xl border border-sky-900/20">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1 font-bold">المنتجات المفعلة</p>
                    <p className="text-zinc-200 text-sm font-bold">
                      {loading ? '...' : `${data?.products?.length || 0} تراخيص نشطة`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#070E1A] p-4 rounded-2xl border border-sky-900/20">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1 font-bold">آخر تسجيل دخول</p>
                    <p className="text-zinc-200 text-sm font-mono tracking-wide">
                      {user?.last_login ? new Date(user.last_login).toLocaleDateString('ar-EG') : 'اليوم'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
