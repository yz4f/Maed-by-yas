import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, CheckCircle, Info, RefreshCcw, ScrollText } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { DataTable } from '../../components/ui/DataTable.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Card } from '../../components/ui/Card.tsx';

export function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const data = await apiFetch('/admin/logs?limit=200&action=all');
        if (mounted && data.logs) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch logs', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { mounted = false; };
  }, []);

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login')) return 'sky';
    if (act.includes('delete') || act.includes('ban')) return 'error';
    if (act.includes('create') || act.includes('add') || act.includes('generate')) return 'success';
    if (act.includes('update') || act.includes('edit')) return 'warning';
    return 'neutral';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('ban')) return <ShieldAlert className="w-3.5 h-3.5" />;
    if (act.includes('create') || act.includes('add') || act.includes('generate')) return <CheckCircle className="w-3.5 h-3.5" />;
    if (act.includes('update') || act.includes('edit')) return <RefreshCcw className="w-3.5 h-3.5" />;
    return <Info className="w-3.5 h-3.5" />;
  };

  const columns = [
    { 
      key: 'action', 
      title: 'العملية', 
      width: '150px',
      render: (item: any) => (
        <Badge variant={getActionColor(item.action)} icon={getActionIcon(item.action)}>
          {item.action}
        </Badge>
      )
    },
    { 
      key: 'details', 
      title: 'التفاصيل', 
      render: (item: any) => (
        <span className="text-gray-300 text-xs sm:text-sm">{item.details}</span>
      ) 
    },
    { 
      key: 'user_email', 
      title: 'المستخدم / البريد', 
      width: '200px',
      render: (item: any) => (
        item.user_email ? (
          <span className="text-sky-400 font-mono text-xs bg-sky-500/10 px-2 py-1 rounded inline-block truncate max-w-[180px]" title={item.user_email}>
            {item.user_email}
          </span>
        ) : <span className="text-gray-600 text-xs">-</span>
      ) 
    },
    { 
      key: 'ip_address', 
      title: 'عنوان IP', 
      width: '120px',
      render: (item: any) => (
        item.ip_address ? (
          <span className="font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">
            {item.ip_address}
          </span>
        ) : <span className="text-gray-600 text-xs">-</span>
      ) 
    },
    { 
      key: 'created_at', 
      title: 'الوقت', 
      width: '150px',
      render: (item: any) => (
        <span className="text-gray-500 text-xs font-mono">
          {new Date(item.created_at).toLocaleString('ar-SA')}
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-sky-400" />
            سجل النظام (Logs)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            متابعة دقيقة لجميع العمليات والأحداث التي تمت على المنصة.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge variant="info">سجلات حية</Badge>
        </div>
      </Card>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" noPadding className="overflow-hidden">
          <div className="p-4">
            <DataTable 
              data={logs} 
              columns={columns} 
              loading={loading} 
              searchable 
              searchPlaceholder="ابحث في السجلات (العملية، التفاصيل، البريد)..."
              pageSize={20} 
              emptyMessage="لا توجد سجلات حالياً" 
              emptyIcon={<Activity className="w-12 h-12 text-gray-500" />} 
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
