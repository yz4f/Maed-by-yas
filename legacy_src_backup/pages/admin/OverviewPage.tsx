import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Package, Key, Download, Activity, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { StatsCard } from '../../components/ui/StatsCard.tsx';
import { DataTable } from '../../components/ui/DataTable.tsx';
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/admin/stats');
        if (mounted && data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonTable />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  const activationColumns = [
    { key: 'product_name', title: 'المنتج', width: '25%' },
    { key: 'user_name', title: 'المستخدم', width: '25%' },
    { key: 'key_code', title: 'المفتاح', render: (item: any) => <span className="font-mono text-xs">{item.key_code}</span> },
    { key: 'created_at', title: 'الوقت', render: (item: any) => <span className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleString('ar-SA')}</span> },
  ];

  const userColumns = [
    { key: 'name', title: 'الاسم' },
    { key: 'email', title: 'البريد الإلكتروني', render: (item: any) => <span className="font-mono text-xs">{item.email}</span> },
    { key: 'created_at', title: 'تاريخ التسجيل', render: (item: any) => <span className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleDateString('ar-SA')}</span> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-alexandria flex items-center gap-3 tracking-wide">
            <BarChart3 className="w-8 h-8 text-sky-400" />
            لوحة التحكم الإحصائية
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
            نظرة عامة شاملة على أداء المنصة، المبيعات، ونشاط المستخدمين.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <Badge variant="success" icon={<Activity className="w-3.5 h-3.5" />}>النظام مستقر</Badge>
          <Badge variant="info" icon={<TrendingUp className="w-3.5 h-3.5" />}>معدل نمو ممتاز</Badge>
        </div>
      </Card>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatsCard
          title="إجمالي المستخدمين"
          value={stats?.totalUsers || 0}
          icon={<Users className="w-6 h-6 text-sky-400" />}
          color="sky"
          trend={{ value: 12, isUp: true }}
          subtitle="مقارنة بالشهر الماضي"
        />
        <StatsCard
          title="التراخيص النشطة"
          value={stats?.usedKeys || 0}
          icon={<Key className="w-6 h-6 text-emerald-400" />}
          color="emerald"
          trend={{ value: 8, isUp: true }}
          subtitle="إجمالي المفاتيح المستخدمة"
        />
        <StatsCard
          title="المفاتيح المتبقية"
          value={stats?.unusedKeys || 0}
          icon={<AlertCircle className="w-6 h-6 text-amber-400" />}
          color="amber"
          subtitle="جاهزة للبيع والتفعيل"
        />
        <StatsCard
          title="إجمالي المنتجات"
          value={stats?.totalProducts || 0}
          icon={<Package className="w-6 h-6 text-indigo-400" />}
          color="indigo"
          subtitle="المنتجات المتوفرة بالمتجر"
        />
      </motion.div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" className="h-full border-sky-500/10 flex flex-col" noPadding>
            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-alexandria flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                أحدث التفعيلات
              </h2>
              <Badge variant="neutral">آخر 24 ساعة</Badge>
            </div>
            <div className="p-4 flex-1">
              <DataTable
                data={stats?.recentActivations || []}
                columns={activationColumns}
                emptyMessage="لا توجد تفعيلات حديثة"
                searchable={false}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass" className="h-full border-indigo-500/10 flex flex-col" noPadding>
            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-alexandria flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                المستخدمين الجدد
              </h2>
              <Badge variant="neutral">أحدث المنضمين</Badge>
            </div>
            <div className="p-4 flex-1">
              <DataTable
                data={stats?.recentUsers || []}
                columns={userColumns}
                emptyMessage="لا يوجد مستخدمين جدد"
                searchable={false}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
