'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Search, X } from 'lucide-react';
import type { Product, ProductFaq } from '@/types';
import { weightedFaqSample } from '@/lib/weighted-faq-sampling';

type Language = 'ar' | 'en';
interface FaqPageProps {
  lang: Language;
  products: Product[];
  preferredProductIds: string[];
  onOpenProducts: () => void;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ar').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ـ/g, '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
}

export function FaqPage({ lang, products, preferredProductIds, onOpenProducts }: FaqPageProps) {
  const [allFaqs, setAllFaqs] = useState<ProductFaq[]>([]);
  const [visibleFaqs, setVisibleFaqs] = useState<ProductFaq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const ar = lang === 'ar';
  const preferredProductKey = preferredProductIds.join('|');
  const productNames = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/product-faqs', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('faq-load-failed');
        const faqs = Array.isArray(data.faqs) ? data.faqs as ProductFaq[] : [];
        setAllFaqs(faqs);
        setVisibleFaqs(weightedFaqSample(faqs, preferredProductKey.split('|').filter(Boolean), 24));
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [preferredProductKey]);

  const filtered = useMemo(() => (debouncedSearch.trim() || productFilter !== 'all' ? allFaqs : visibleFaqs).filter((faq) => {
    const matchesProduct = productFilter === 'all' || faq.productId === productFilter;
    const query = normalizeSearch(debouncedSearch);
    const matchesSearch = !query || normalizeSearch(`${faq.questionAr} ${faq.questionEn} ${faq.answerAr} ${faq.answerEn} ${productNames.get(faq.productId) || ''} ${faq.category}`).includes(query);
    return matchesProduct && matchesSearch;
  }), [allFaqs, visibleFaqs, productFilter, productNames, debouncedSearch]);

  const refreshQuestions = () => setVisibleFaqs(weightedFaqSample(allFaqs, preferredProductKey.split('|').filter(Boolean), 24));

  return <section dir={ar ? 'rtl' : 'ltr'} className="faq-experience mx-auto max-w-5xl space-y-5 pb-8">
    <header className="border-b pb-5" style={{ borderColor: 'var(--luxe-line)' }}>
      <h2 className="text-2xl font-semibold" style={{ color: 'var(--luxe-ink)' }}>{ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--luxe-muted)' }}>{ar ? 'إجابات عن المنتجات المتاحة وطريقة التفعيل والاستخدام.' : 'Answers about available products, activation, and usage.'}</p>
    </header>
    <label className="flex min-h-11 items-center gap-2 rounded-xl border px-3" style={{ borderColor: 'var(--luxe-line)', background: 'var(--luxe-panel)', color: 'var(--luxe-ink)' }}>
      <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--luxe-accent)' }} />
      <span className="sr-only">{ar ? 'ابحث عن سؤال أو اسم منتج' : 'Search a question or product'}</span>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? 'ابحث عن سؤال أو اسم منتج...' : 'Search a question or product...'} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-60" />
      {search && <button type="button" onClick={() => setSearch('')} aria-label={ar ? 'مسح البحث' : 'Clear search'}><X size={16} /></button>}
    </label>
    <div className="flex flex-wrap gap-2" aria-label={ar ? 'تصفية حسب المنتج' : 'Filter by product'}>
      <button type="button" onClick={() => setProductFilter('all')} className={`rounded-lg border px-3 py-2 text-xs ${productFilter === 'all' ? 'faq-filter-active' : ''}`} style={{ borderColor: productFilter === 'all' ? 'var(--luxe-accent-line)' : 'var(--luxe-line)', color: productFilter === 'all' ? 'var(--luxe-accent)' : 'var(--luxe-muted)' }}>{ar ? 'الكل' : 'All products'}</button>
      {products.filter((product) => !product.isArchived).map((product) => <button key={product.id} type="button" onClick={() => setProductFilter(product.id)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: productFilter === product.id ? 'var(--luxe-accent-line)' : 'var(--luxe-line)', color: productFilter === product.id ? 'var(--luxe-accent)' : 'var(--luxe-muted)', background: productFilter === product.id ? 'var(--luxe-soft)' : 'transparent' }}>{product.name}</button>)}
    </div>
    {isLoading ? <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--luxe-line)', color: 'var(--luxe-muted)' }}>{ar ? 'جارٍ تحميل الأسئلة...' : 'Loading questions...'}</div> : loadError ? <div role="alert" className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--luxe-line)', color: 'var(--luxe-muted)' }}>{ar ? 'تعذر تحميل الأسئلة الآن.' : 'Questions could not be loaded.'}</div> : filtered.length ? <div className="divide-y rounded-xl border" style={{ borderColor: 'var(--luxe-line)', background: 'var(--luxe-panel)' }}>
      {filtered.map((faq) => {
        const isOpen = openFaqId === faq.id;
        return <article key={faq.id} className="px-4 sm:px-5">
          <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaqId(isOpen ? null : faq.id)} className="flex min-h-[62px] w-full items-center gap-4 py-3 text-start">
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--luxe-accent)' }} />
            <span className="min-w-0 flex-1 text-sm font-medium" style={{ color: 'var(--luxe-ink)' }}>{ar ? faq.questionAr : faq.questionEn}</span>
            <span className="hidden rounded-md px-2 py-1 text-[10px] sm:inline" style={{ background: 'var(--luxe-soft)', color: 'var(--luxe-muted)' }}>{productNames.get(faq.productId) || faq.category}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--luxe-muted)' }} />
          </button>
          {isOpen && <p className="pb-4 ps-8 text-sm leading-7" style={{ color: 'var(--luxe-muted)' }}>{ar ? faq.answerAr : faq.answerEn}</p>}
        </article>;
      })}
    </div> : <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--luxe-line)', color: 'var(--luxe-muted)' }}>
      <p className="text-sm">{allFaqs.length ? (ar ? 'لا توجد أسئلة مطابقة.' : 'No matching questions.') : (ar ? 'لا توجد أسئلة منشورة لهذه المنتجات بعد.' : 'No questions have been published for these products yet.')}</p>
      {!allFaqs.length && <button type="button" onClick={onOpenProducts} className="mt-4 text-sm font-medium" style={{ color: 'var(--luxe-accent)' }}>{ar ? 'عرض المنتجات' : 'View products'}</button>}
    </div>}
    {!isLoading && allFaqs.length > visibleFaqs.length && <button type="button" onClick={refreshQuestions} className="text-xs font-medium" style={{ color: 'var(--luxe-accent)' }}>{ar ? 'عرض مجموعة أخرى' : 'Show another set'}</button>}
  </section>;
}
