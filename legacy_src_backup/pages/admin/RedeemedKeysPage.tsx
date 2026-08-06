import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Search, Download, Shield, Calendar, Clock, User, HardDrive, Cpu, Network } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { StatsCard } from '../../components/ui/StatsCard.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import type { RedeemedKeyRecord } from '../../types.ts';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export function AdminRedeemedKeysPage({ toast }: { toast?: ToastFunctions }) {
  const [keys, setKeys] = useState<RedeemedKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  const fetchRedeemedKeys = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/keys/redeemed');
      if (res && res.success) {
        setKeys(res.keys || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      toast?.error('خطأ', err.message || 'فشل جلب المفاتيح المفعلة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedeemedKeys();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/admin/keys/export?format=csv&status=used', '_blank');
  };

  const columns: Column<RedeemedKeyRecord>[] = [
    {
      key: 'key_value',
      title: 'مفتاح الترخيص',
      sortable: true,
      width: '200px',
      render: (item) => (
        <div className="font-mono text-xs tracking-widest text-sky-400 font-bold bg-sky-500/10 px-3 py-1.5 rounded border border-sky-500/20 inline-block">
          {item.key_value}
        </div>
      ),
    },
    {
      key: 'product_name',
      title: 'المنتج',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-white">{item.product_name || 'منتج غير معروف'}</span>
      ),
    },
    {
      key: 'username',
      title: 'المستخدم',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>{item.username || 'مستخدم'}</span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.user_email}</div>
        </div>
      ),
    },
    {
      key: 'redeem_date',
      title: 'التفعيل والمدة',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-xs text-gray-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{new Date(item.redeem_date).toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            الترخيص: <span className="text-emerald-400 font-bold">{item.license_type || 'مدى الحياة'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'ip',
      title: 'بيانات الجهاز',
      render: (item) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded inline-flex">
            <Network className="w-3 h-3" />
            {item.ip || '127.0.0.1'}
          </div>
          <div className="text-[10px] text-gray-500 truncate max-w-[160px] mt-1 flex items-center gap-1" title={item.user_agent}>
            <Cpu className="w-3 h-3" />
            {item.user_agent ? item.user_agent.substring(0, 30) + '...' : 'غير متوفر'}
          </div>
        </div>
      ),
    },
    {
      key: 'download_count',
      title: 'التحميلات',
      sortable: true,
      render: (item) => (
        <div className="text-center">
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            {item.download_count || 0} مرات
          </span>
          {item.last_download && (
            <div className="text-[10px] text-gray-500 mt-1">
              آخر تنزيل: {new Date(item.last_download).toLocaleDateString('ar-SA')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (item) => (
        <Badge variant={item.status === 'active' ? 'success' : item.status === 'expired' ? 'error' : 'neutral'} dot>
          {item.status === 'active' ? 'نشط' : item.status === 'expired' ? 'منتهي' : 'معطل'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-emerald-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            سجل التفعيلات
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            سجل شامل لجميع المفاتيح التي تم تفعيلها مع تفاصيل الأجهزة.
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleExportCSV} 
          leftIcon={<Download className="w-4 h-4" />}
          className="mt-4 sm:mt-0"
        >
          تصدير السجل (CSV)
        </Button>
      </Card>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <StatsCard
          title="إجمالي المفاتيح المفعّلة"
          value={keys.length}
          icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
          color="emerald"
          subtitle="تراخيص مستخدمة فعلياً"
        />
        <StatsCard
          title="التراخيص النشطة"
          value={keys.filter(k => k.status === 'active').length}
          icon={<Shield className="w-6 h-6 text-sky-400" />}
          color="sky"
          subtitle="تراخيص سارية المفعول"
        />
        <StatsCard
          title="إجمالي التحميلات"
          value={keys.reduce((acc, k) => acc + (k.download_count || 0), 0)}
          icon={<HardDrive className="w-6 h-6 text-indigo-400" />}
          color="indigo"
          subtitle="عمليات التنزيل للبرامج"
        />
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="glass" noPadding className="overflow-hidden">
          <div className="p-6">
            <DataTable
              data={keys}
              columns={columns}
              searchable
              searchPlaceholder="ابحث بالمفتاح، البريد، المستخدم، أو IP..."
              pageSize={15}
              loading={loading}
              emptyMessage="لا توجد مفاتيح مفعّلة حالياً"
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
