import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Package, Download, Key, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { apiFetch, getAuthToken } from '../../api.ts';
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

interface MyProductsPageProps {
  toast: ToastFunctions;
  onNavigate?: (page: AppPage) => void;
}

export function MyProductsPage({ toast, onNavigate }: MyProductsPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showKeysMap, setShowKeysMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const res = await apiFetch('/user/dashboard');
        if (mounted && res.success && res.products) {
          setProducts(res.products);
        } else if (mounted && res.success === false) {
          toast.error('خطأ', 'فشل تحميل المنتجات');
        }
      } catch (err: any) {
        if (mounted) toast.error('خطأ', err.message || 'تعذر الاتصال بالخادم');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { mounted = false; };
  }, [toast]);

  const toggleShowKey = (productId: string) => {
    setShowKeysMap(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleCopyKey = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    setCopiedKey(keyValue);
    toast.success('تم النسخ', 'تم نسخ مفتاح الترخيص بنجاح');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async (productId: string, files: any[]) => {
    if (!files || files.length === 0) {
      toast.error('عذراً', 'لا يوجد ملفات متاحة للتحميل حالياً');
      return;
    }
    
    const fileToDownload = files[0];
    const fileId = fileToDownload.id;
    
    setDownloading(productId);
    toast.info('جاري التحميل...', 'يتم الآن تحضير ملف اللودر للتحميل');
    
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل التحميل من الخادم');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileToDownload.original_name || 'discord.gg_t3n.rar';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('تم التحميل', 'بدأ التنزيل بنجاح');
    } catch (err) {
      toast.error('خطأ', 'حدث خطأ أثناء تحميل الملف');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton h-80 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card variant="glass" className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh] border-sky-900/20 bg-[#0D1829]">
        <div className="w-20 h-20 bg-[#070E1A] border border-sky-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Package className="w-10 h-10 text-sky-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-alexandria mb-3">لا توجد منتجات مفعلة</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm leading-relaxed">
          لم تقم بتفعيل أي تراخيص بعد. قم بإدخال مفتاح ترخيص للحصول على اللودر.
        </p>
        <Button variant="primary" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white border-0" leftIcon={<Key className="w-4 h-4" />} onClick={() => onNavigate?.('redeem')}>
          تفعيل مفتاح ترخيص
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="gradient" className="flex items-center justify-between border-sky-900/25 bg-gradient-to-l from-sky-500/5 via-[#0D1829] to-[#0D1829] p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 font-alexandria tracking-wide">
            <Package className="w-6 h-6 text-sky-400" />
            منتجاتي النشطة
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            جميع التراخيص المفعلة بحسابك جاهزة للتحميل والاستخدام.
          </p>
        </div>
        <Badge variant="info" className="hidden sm:inline-flex bg-sky-500/10 text-sky-400 border-sky-500/20">
          {products.length} منتجات
        </Badge>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product, idx) => {
          const isRevealed = showKeysMap[product.id];
          const keyValue = product.key_value || 'TA3N-UNKNOWN-KEY';
          const productImage = product.image || '/spoofer_bg.png';
          const isCopied = copiedKey === keyValue;

          return (
            <motion.div
              key={product.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card variant="glass" className="flex flex-col h-full group hover:border-sky-500/30 border-sky-900/20 bg-[#0D1829] transition-all p-0 overflow-hidden" noPadding>
                {/* Header Image */}
                <div className="h-40 bg-[#070E1A] relative overflow-hidden">
                  <img
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>مفعّل</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#070E1A]/80 border border-sky-900/20 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                    v2.0
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-grow space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-alexandria mb-1">{product.name}</h3>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                      {product.description || 'حماية كاملة من الحظر مع دعم وتحديث مستمر'}
                    </p>
                  </div>

                  {/* Key Box */}
                  <div className="bg-[#070E1A] rounded-xl p-3 flex items-center justify-between border border-sky-900/20 group-hover:border-sky-500/20 transition-colors">
                    <div className={`font-mono text-xs font-bold tracking-wider truncate ${isRevealed ? 'text-sky-400' : 'text-gray-500'}`}>
                      {isRevealed ? keyValue : '••••-••••-••••-••••'}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-gray-500 hover:text-white"
                        onClick={() => toggleShowKey(product.id)}
                        title={isRevealed ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-7 h-7 ${isCopied ? 'text-emerald-400' : 'text-gray-500 hover:text-sky-400'}`}
                        onClick={() => handleCopyKey(keyValue)}
                        title="نسخ المفتاح"
                      >
                        {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 mt-auto">
                    <Button
                      variant="primary"
                      className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white border-0 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                      fullWidth
                      isLoading={downloading === product.id}
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={() => handleDownload(product.id, product.files)}
                    >
                      تحميل اللودر
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
