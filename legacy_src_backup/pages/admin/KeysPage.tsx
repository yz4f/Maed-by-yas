import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Key, Trash2, Download, Copy, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { DataTable } from '../../components/ui/DataTable.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { StatsCard } from '../../components/ui/StatsCard.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export function AdminKeysPage({ toast }: { toast: ToastFunctions }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate keys state
  const [genProduct, setGenProduct] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [genDuration, setGenDuration] = useState('lifetime');
  const [generatedKeys, setGeneratedKeys] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Import keys state
  const [importProduct, setImportProduct] = useState('');
  const [importDuration, setImportDuration] = useState('lifetime');
  const [importKeys, setImportKeys] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Export keys state
  const [exportProduct, setExportProduct] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [keysRes, prodRes, statsRes] = await Promise.all([
          apiFetch('/admin/keys').catch(() => ({ keys: [] })),
          apiFetch('/admin/products').catch(() => ({ products: [] })),
          apiFetch('/admin/keys/stats').catch(() => ({ stats: null }))
        ]);
        if (mounted) {
          setKeys(keysRes.keys || []);
          setProducts(prodRes.products || []);
          setStats(statsRes.stats);
          if (prodRes.products && prodRes.products.length > 0) {
            setGenProduct(prodRes.products[0].id);
            setImportProduct(prodRes.products[0].id);
          }
        }
      } catch (error) {
        if (mounted) toast.error('خطأ', 'فشل في جلب البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [toast]);

  const refreshData = async () => {
    try {
      const [keysRes, statsRes] = await Promise.all([
        apiFetch('/admin/keys').catch(() => ({ keys: [] })),
        apiFetch('/admin/keys/stats').catch(() => ({ stats: null }))
      ]);
      setKeys(keysRes.keys || []);
      setStats(statsRes.stats);
    } catch (e) {}
  };

  const handleGenerate = async () => {
    if (!genProduct || genCount < 1) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch('/admin/keys/generate', {
        method: 'POST',
        body: JSON.stringify({ productId: genProduct, count: genCount, duration: genDuration })
      });
      if (res.keys) {
        setGeneratedKeys(res.keys.join('\n'));
        toast.success('نجاح', `تم إنشاء ${res.keys.length} مفتاح`);
        refreshData();
      }
    } catch (error) {
      toast.error('خطأ', 'فشل في إنشاء المفاتيح');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!importProduct || !importKeys.trim()) return;
    setIsImporting(true);
    try {
      const res = await apiFetch('/admin/keys/import', {
        method: 'POST',
        body: JSON.stringify({ productId: importProduct, rawKeys: importKeys, duration: importDuration })
      });
      if (res.success) {
        toast.success('نجاح', 'تم استيراد المفاتيح بنجاح');
        setImportKeys('');
        refreshData();
      }
    } catch (error) {
      toast.error('خطأ', 'فشل في استيراد المفاتيح');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتاح؟')) return;
    try {
      await apiFetch(`/admin/keys/${id}`, { method: 'DELETE' });
      toast.success('نجاح', 'تم حذف المفتاح');
      refreshData();
    } catch (error) {
      toast.error('خطأ', 'فشل في حذف المفتاح');
    }
  };

  const handleExport = (format: string) => {
    const url = `/api/admin/keys/export?productId=${exportProduct}&format=${format}`;
    window.open(url, '_blank');
  };

  const columns = [
    { 
      key: 'key_code', 
      title: 'المفتاح', 
      width: '250px',
      render: (item: any) => (
        <div className="flex items-center gap-2 group">
          <span className="font-mono text-sm tracking-widest bg-white/[0.03] px-2 py-1 rounded text-gray-300">
            {item.key_code}
          </span>
          <button 
            onClick={() => { navigator.clipboard.writeText(item.key_code); toast.success('تم النسخ'); }}
            className="text-gray-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="نسخ"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      ) 
    },
    { key: 'product_name', title: 'المنتج', render: (item: any) => <span className="font-bold text-white">{item.product_name}</span> },
    { 
      key: 'status', 
      title: 'الحالة', 
      render: (item: any) => {
        let variant: 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
        if (item.status === 'unused') variant = 'success';
        else if (item.status === 'used') variant = 'warning';
        else if (item.status === 'expired') variant = 'error';
        
        const labels: Record<string, string> = {
          'unused': 'متاح',
          'used': 'مستخدم',
          'expired': 'منتهي',
          'disabled': 'معطل'
        };
        
        return <Badge variant={variant}>{labels[item.status] || item.status}</Badge>;
      }
    },
    { 
      key: 'duration', 
      title: 'المدة',
      render: (item: any) => {
        const labels: Record<string, string> = {
          'lifetime': 'مدى الحياة',
          '30days': '30 يوم',
          '7days': '7 أيام',
          '1day': 'يوم واحد'
        };
        return <span className="text-gray-400 text-xs">{labels[item.duration] || item.duration}</span>;
      }
    },
    { 
      key: 'user_name', 
      title: 'مستخدم بواسطة', 
      render: (item: any) => item.user_name ? (
        <span className="text-sky-400 text-xs font-bold bg-sky-500/10 px-2 py-1 rounded">{item.user_name}</span>
      ) : (
        <span className="text-gray-600 text-xs">-</span>
      ) 
    },
    { key: 'created_at', title: 'تاريخ الإنشاء', render: (item: any) => <span className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString('ar-SA')}</span> },
    {
      key: 'actions',
      title: 'إجراءات',
      width: '80px',
      render: (item: any) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleDelete(item.id)} 
          className="text-gray-500 hover:text-rose-400 w-8 h-8"
          title="حذف المفتاح"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <Key className="w-6 h-6 text-sky-400" />
            إدارة المفاتيح
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            قم بإنشاء، استيراد، وإدارة مفاتيح التفعيل الخاصة بمنتجاتك.
          </p>
        </div>
      </Card>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <StatsCard title="الإجمالي" value={stats?.total || 0} icon={<Key className="w-5 h-5" />} color="sky" />
        <StatsCard title="متاح" value={stats?.unused || 0} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
        <StatsCard title="مستخدم" value={stats?.used || 0} icon={<Key className="w-5 h-5" />} color="indigo" />
        <StatsCard title="منتهي" value={stats?.expired || 0} icon={<AlertCircle className="w-5 h-5" />} color="rose" />
        <StatsCard title="معطل" value={stats?.disabled || 0} icon={<AlertCircle className="w-5 h-5" />} color="amber" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Keys Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="glass" className="h-full">
            <h2 className="text-lg font-bold text-white mb-6 font-alexandria flex items-center gap-2">
              <Key className="w-5 h-5 text-sky-400" />
              إنشاء مفاتيح جديدة
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">المنتج</label>
                <select value={genProduct} onChange={(e) => setGenProduct(e.target.value)} className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all">
                  <option value="" disabled>اختر المنتج</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">العدد</label>
                  <input type="number" min="1" max="1000" value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value))} className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all text-center font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">المدة</label>
                  <select value={genDuration} onChange={(e) => setGenDuration(e.target.value)} className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all">
                    <option value="lifetime">مدى الحياة</option>
                    <option value="30days">30 يوم</option>
                    <option value="7days">7 أيام</option>
                    <option value="1day">يوم واحد</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleGenerate} variant="primary" fullWidth isLoading={isGenerating}>
                إنشاء المفاتيح
              </Button>
              
              <AnimatePresence>
                {generatedKeys && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-white/[0.05]"
                  >
                    <label className="block text-xs font-bold text-gray-400 mb-2 flex justify-between items-center">
                      <span>المفاتيح المنشأة</span>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generatedKeys); toast.success('تم النسخ'); }} className="h-6 text-[10px] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" leftIcon={<Copy className="w-3 h-3" />}>
                        نسخ الكل
                      </Button>
                    </label>
                    <textarea readOnly value={generatedKeys} className="w-full bg-[#030712] border border-white/[0.08] rounded-xl p-3 text-xs text-sky-300 font-mono tracking-widest h-32 resize-none custom-scrollbar focus:outline-none" dir="ltr" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Import Keys Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="glass" className="h-full border-emerald-500/10">
            <h2 className="text-lg font-bold text-white mb-6 font-alexandria flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              استيراد مفاتيح (دفعات)
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">المنتج</label>
                  <select value={importProduct} onChange={(e) => setImportProduct(e.target.value)} className="w-full bg-[#030712] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all">
                    <option value="" disabled>اختر المنتج</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">المدة</label>
                  <select value={importDuration} onChange={(e) => setImportDuration(e.target.value)} className="w-full bg-[#030712] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all">
                    <option value="lifetime">مدى الحياة</option>
                    <option value="30days">30 يوم</option>
                    <option value="7days">7 أيام</option>
                    <option value="1day">يوم واحد</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 flex justify-between">
                  <span>المفاتيح (مفتاح واحد لكل سطر)</span>
                </label>
                <textarea 
                  value={importKeys} 
                  onChange={(e) => setImportKeys(e.target.value)} 
                  className="w-full bg-[#030712] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl p-4 text-xs text-emerald-300 font-mono tracking-widest h-[184px] resize-none outline-none transition-all custom-scrollbar" 
                  placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY" 
                  dir="ltr"
                />
              </div>
              <Button 
                onClick={handleImport} 
                variant="primary" 
                fullWidth 
                isLoading={isImporting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border-emerald-500"
              >
                استيراد المفاتيح
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card variant="glass" noPadding className="overflow-hidden">
          <div className="p-5 border-b border-white/[0.05] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-alexandria">
              <FileText className="w-5 h-5 text-sky-400" />
              سجل المفاتيح
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select value={exportProduct} onChange={(e) => setExportProduct(e.target.value)} className="bg-[#030712] border border-white/[0.08] rounded-xl px-4 py-2 text-xs text-white outline-none flex-grow md:flex-grow-0 min-w-[150px]">
                <option value="">كل المنتجات</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="ghost" onClick={() => handleExport('txt')} leftIcon={<Download className="w-3.5 h-3.5" />} className="h-9 px-4 text-xs border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]">
                TXT
              </Button>
              <Button variant="ghost" onClick={() => handleExport('csv')} leftIcon={<Download className="w-3.5 h-3.5" />} className="h-9 px-4 text-xs border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]">
                CSV
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <DataTable 
              data={keys} 
              columns={columns} 
              loading={loading} 
              searchable 
              pageSize={15} 
              emptyMessage="لا توجد مفاتيح مسجلة" 
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
