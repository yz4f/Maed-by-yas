'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { Download, ExternalLink, Sparkles, Key, ShieldCheck, Box } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ProductsGridProps {
  products: Product[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <section id="products" className="py-16 relative" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>المنتجات المتاحة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              برامج وتطبيقات <span className="text-sky-400 text-glow-blue">T3N STORE</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            جميع البرامج مفحوصة ومجربة وتعمل بأحدث أنظمة التشفير لضمان الأمان الكامل وتخطي أنظمة الحماية.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group border border-slate-800"
            >
              {/* Product Cover Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Category & Stock Badges */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <CategoryBadge category={product.category} />
                </div>
                
                {/* Stock Counter Badge */}
                {product.stockKeysCount !== undefined && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                    <Box className="w-3.5 h-3.5" />
                    <span>المخزون: {product.stockKeysCount}</span>
                  </div>
                )}

                {/* Version Badge */}
                <div className="absolute bottom-3 right-3 font-mono text-xs font-bold text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                  {product.version}
                </div>
              </div>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                {/* Stats & Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      {product.downloadsCount} تحميل
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      آمن 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>التفاصيل</span>
                    </Link>

                    <Link
                      href="/activate"
                      className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-neon-glow transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>تفعيل</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
