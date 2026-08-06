import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, Download, Key, ArrowRight, Activity, Clock, ShieldCheck, 
  Calendar, BookOpen, ChevronLeft, Flame, CheckCircle2, MessageSquare, Box
} from 'lucide-react';
import { useAuth } from '../../auth.tsx';
import { apiFetch } from '../../api.ts';
import type { AppPage } from '../../types.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

interface OverviewPageProps {
  onNavigate: (page: AppPage) => void;
  toast: ToastFunctions;
}

export function UserOverviewPage({ onNavigate, toast }: OverviewPageProps) {
  const { user } = useAuth();
  const [data, setData] = useState<{ products: any[]; account: any; logs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        const res = await apiFetch('/user/dashboard');
        if (mounted && res.success) {
          setData(res);
        } else if (mounted) {
          toast.error('حدث خطأ', 'فشل في تحميل بيانات لوحة التحكم');
        }
      } catch (err: any) {
        if (mounted) toast.error('حدث خطأ', err.message || 'تأكد من اتصالك بالشبكة');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, [toast]);

  const stats = [
    { icon: Package, value: data?.products?.length || 0, label: 'المنتجات النشطة', color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { icon: Download, value: data?.products?.reduce((acc: number, p: any) => acc + (p.downloads || 0), 0) || 0, label: 'مرات التحميل', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: Calendar, value: data?.account?.created_at ? new Date(data.account.created_at).toLocaleDateString('ar-EG') : 'جديد', label: 'عضو منذ', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { icon: ShieldCheck, value: 'نشط', label: 'حالة الحساب', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-l from-sky-500/5 via-[#0D1829] to-[#0D1829] border border-sky-900/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative shadow-none">
          <div className="space-y-3 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              مرحباً بك، {user?.name || 'مستخدم'} 👋
            </h1>
            <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
              إليك نظرة عامة شاملة على حسابك والتراخيص المفعلة. اكتشف أحدث التحديثات والشروحات.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
            <Button variant="primary" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white border-0" onClick={() => onNavigate('redeem')} fullWidth>
              تفعيل ترخيص
            </Button>
            <Button variant="ghost" onClick={() => onNavigate('docs')} fullWidth>
              الشروحات
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-[#0D1829] border border-sky-900/20 h-32 w-full rounded-xl" />)
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#0D1829] border border-sky-900/20 rounded-xl p-5 flex flex-col items-start justify-between h-full shadow-none">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Two-column layout below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Products */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">المنتجات النشطة</h2>
            <button className="text-sm text-sky-400 hover:text-sky-300 transition-colors" onClick={() => onNavigate('products')}>
              عرض الكل
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              Array(2).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-[#0D1829] border border-sky-900/20 h-24 w-full rounded-xl" />)
            ) : (!data?.products || data.products.length === 0) ? (
              <div className="col-span-full p-8 text-center bg-[#0D1829] border border-sky-900/20 rounded-xl">
                <p className="text-zinc-500 text-sm">لا توجد منتجات نشطة حالياً.</p>
              </div>
            ) : (
              data.products.slice(0, 4).map((product: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-[#0D1829] border border-sky-900/20 rounded-xl p-4 flex gap-4 h-full shadow-none">
                    <div className="w-16 h-16 rounded-lg bg-[#070E1A] overflow-hidden shrink-0 border border-sky-900/20 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-sky-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Key className="w-3 h-3 text-zinc-500" />
                          <span className="text-xs text-zinc-500 font-mono truncate">{product.key || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge variant="success">نشط</Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right - Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="bg-[#0D1829] border border-sky-900/20 rounded-xl p-5 shadow-none h-full flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4">الوصول السريع</h3>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { id: 'products', icon: Box, title: 'منتجاتي', sub: 'عرض وإدارة المنتجات', color: 'text-sky-400', bg: 'bg-sky-400/10' },
                { id: 'redeem', icon: Key, title: 'تفعيل مفتاح', sub: 'تفعيل ترخيص جديد', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { id: 'docs', icon: BookOpen, title: 'مركز الشروحات', sub: 'تصفح الأدلة والتعليمات', color: 'text-violet-400', bg: 'bg-violet-400/10' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => onNavigate(action.id as AppPage)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sky-900/10 border border-transparent hover:border-sky-900/20 transition-all group text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.bg} transition-colors group-hover:bg-opacity-20`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{action.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{action.sub}</div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Activity Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#0D1829] border border-sky-900/20 rounded-xl overflow-hidden p-0 shadow-none">
          <div className="px-5 py-4 border-b border-sky-900/20 flex items-center justify-between bg-sky-900/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              سجل النشاط
            </h3>
            <span className="text-[10px] text-sky-400 font-mono tracking-widest uppercase bg-sky-400/10 px-2 py-1 rounded-md">LIVE LOGS</span>
          </div>
          <div className="divide-y divide-sky-900/20">
            {loading ? (
               <div className="p-5 space-y-3">
                 <div className="animate-pulse h-12 w-full rounded-lg bg-[#070E1A] border border-sky-900/20" />
                 <div className="animate-pulse h-12 w-full rounded-lg bg-[#070E1A] border border-sky-900/20" />
               </div>
            ) : !data?.logs || data.logs.length === 0 ? (
               <div className="p-10 text-center text-zinc-500 text-xs font-medium">لا توجد أنشطة مسجلة مؤخراً</div>
            ) : (
              data.logs.slice(0, 5).map((log: any, idx: number) => (
                <div key={log.id || idx} className="px-5 py-4 flex items-center justify-between hover:bg-sky-900/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-sky-500/30 group-hover:bg-sky-400 group-hover:shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{log.action}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{log.details}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Clock className="w-3 h-3 text-zinc-600 group-hover:text-sky-500/50 transition-colors" />
                     <div className="text-[11px] text-zinc-500 font-mono shrink-0">
                       {new Date(log.created_at).toLocaleString('ar-EG')}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
