import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types.ts';
import { apiFetch } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { Shield, Key, Download, CheckCircle2, AlertCircle, Users, Layers, Sparkles, ArrowLeft } from 'lucide-react';

interface HomePageProps {
  onNavigateToActivate: (productId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToActivate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiFetch('/products');
        if (res && res.products) {
          setProducts(res.products);
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تحميل قائمة المنتجات');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8 pb-16 pt-2">
      
      {/* Products Grid Section - Minimalist & Clean like screenshot */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                المنتجات المتوفرة
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">حلول احترافية مصممة بدقة وجودة عالية</p>
            </div>
          </div>

          <div className="bg-gray-900/90 border border-gray-800 text-gray-300 text-xs font-black px-4 py-1.5 rounded-full shadow">
            <span>{products.length} منتج</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-gray-900/50 border border-gray-800 animate-pulse p-6 space-y-4">
                <div className="h-44 bg-gray-800 rounded-2xl w-full" />
                <div className="h-6 bg-gray-800 rounded w-3/4" />
                <div className="h-10 bg-gray-800 rounded-xl w-full pt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-300 space-y-2">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-400" />
            <p className="font-bold text-base">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 rounded-3xl bg-gray-900/40 border border-gray-800 text-center space-y-3">
            <Layers className="w-12 h-12 mx-auto text-gray-600" />
            <h3 className="text-lg font-bold text-gray-300">لا توجد منتجات منشورة حالياً</h3>
            <p className="text-sm text-gray-500">سيتم إضافة برمجيات ومنتجات جديدة قريباً من قبل إدارة الموقع</p>
          </div>
        ) : (
          <div className="space-y-8">
            {products.map((product) => {
              const hasKeys = (product.keys_remaining || 0) > 0;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-[#121826] border border-[#273449] hover:border-[#3B82F6]/50 rounded-[22px] overflow-hidden shadow-xl flex flex-col md:flex-row transition-all duration-300"
                >
                  {/* Clean Product Cover Banner - Left/Right side on Desktop */}
                  <div className="relative h-48 md:h-auto md:w-2/5 lg:w-1/3 bg-[#171F2F] overflow-hidden border-b md:border-b-0 md:border-l border-[#273449]">
                    {product.image ? (
                      <img 
                        src={product.image.startsWith('/') || product.image.startsWith('http') ? product.image : `/uploads/${product.image}`} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121826] to-[#171F2F] text-[#94A3B8]">
                        <Shield className="w-12 h-12 mb-2 text-[#3B82F6]/40" />
                        <span className="text-xs font-bold text-[#94A3B8]">{product.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#121826] via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Clean Product Details & Action - Right Side */}
                  <div className="p-6 md:p-8 flex flex-col justify-between flex-1 text-right space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                          hasKeys ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                        }`}>
                          {hasKeys ? 'متوفر للتفعيل' : 'نفذت الكمية'}
                        </span>
                        <h3 className="font-black text-2xl text-[#FFFFFF] group-hover:text-[#3B82F6] transition-colors tracking-tight">
                          {product.name}
                        </h3>
                      </div>
                      
                      <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xl ml-auto">
                        {product.description || 'لا يوجد وصف متاح لهذا المنتج.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#273449] flex justify-end">
                      <button
                        onClick={() => onNavigateToActivate(product.id)}
                        disabled={!hasKeys}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-[14px] font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all ${
                          hasKeys 
                            ? 'bg-[#3B82F6] hover:bg-[#4F9BFF] text-white shadow-[#3B82F6]/25 cursor-pointer transform hover:-translate-y-0.5' 
                            : 'bg-[#171F2F] text-[#94A3B8] cursor-not-allowed border border-[#273449]'
                        }`}
                      >
                        <Key className="w-4 h-4" />
                        <span>{hasKeys ? 'ابدأ تفعيل المنتج' : 'المنتج غير متاح'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
