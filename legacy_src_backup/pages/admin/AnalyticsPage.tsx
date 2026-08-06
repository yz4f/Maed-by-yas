import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, PieChart, BarChart2, Activity, Users, Package, Download } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { SkeletonCard } from '../../components/ui/Skeleton.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

export function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/admin/stats');
        if (mounted && data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard height="h-64" />
          <SkeletonCard height="h-64" />
        </div>
      </div>
    );
  }

  const totalKeys = stats?.totalKeys || 1;
  const usedPercent = ((stats?.usedKeys || 0) / totalKeys) * 100;
  const unusedPercent = ((stats?.unusedKeys || 0) / totalKeys) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-sky-400" />
            الإحصائيات والتحليلات
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            مؤشرات الأداء الرئيسية والرسوم البيانية لنشاط المنصة.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Badge variant="success" icon={<Activity className="w-3.5 h-3.5" />}>البيانات محدثة</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keys Distribution */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="glass" className="h-full border-indigo-500/10">
            <div className="flex items-center gap-2 mb-8">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white font-alexandria">توزيع المفاتيح</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                    المفاتيح المستخدمة
                  </span>
                  <span className="text-rose-400 font-mono font-bold text-lg">{stats?.usedKeys || 0} <span className="text-xs text-rose-500/70">({usedPercent.toFixed(1)}%)</span></span>
                </div>
                <div className="w-full bg-[#030712] rounded-full h-2 border border-white/[0.05] overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-600 to-rose-400 h-2 rounded-full relative" style={{ width: `${usedPercent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-shimmer"></div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    المفاتيح المتبقية
                  </span>
                  <span className="text-emerald-400 font-mono font-bold text-lg">{stats?.unusedKeys || 0} <span className="text-xs text-emerald-500/70">({unusedPercent.toFixed(1)}%)</span></span>
                </div>
                <div className="w-full bg-[#030712] rounded-full h-2 border border-white/[0.05] overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full relative" style={{ width: `${unusedPercent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* General Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="glass" className="h-full border-sky-500/10">
            <div className="flex items-center gap-2 mb-8">
              <BarChart2 className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white font-alexandria">إحصائيات عامة</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-gray-300 font-bold">إجمالي المستخدمين</span>
                </div>
                <span className="text-white font-mono text-xl font-black">{stats?.totalUsers || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-gray-300 font-bold">إجمالي المنتجات</span>
                </div>
                <span className="text-white font-mono text-xl font-black">{stats?.totalProducts || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="text-gray-300 font-bold">إجمالي التحميلات</span>
                </div>
                <span className="text-indigo-400 font-mono text-xl font-black">{stats?.totalDownloads || 0}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
