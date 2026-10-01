'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Check,
  Compass,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Layers,
  Package,
  Pin,
  RefreshCw,
  Shield,
  Sparkles,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { FaqCategory, FaqItem } from '@/types';

interface HelpCenterProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onNavigateTab?: (tab: string) => void;
  initialCategoryId?: string | null;
}

const ICON_MAP: Record<string, LucideIcon> = {
  KeyRound,
  Package,
  Wrench,
  Shield,
  BookOpen,
  HelpCircle,
  Compass,
  Layers,
};

export function HelpCenter({
  lang,
  isDark,
  onNavigateTab,
  initialCategoryId,
}: HelpCenterProps) {
  const isAr = lang === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const viewedFaqsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!zoomedImage) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomedImage(null);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [zoomedImage]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load categories and FAQs
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, faqRes] = await Promise.all([
        fetch('/api/help/categories', { cache: 'no-store' }),
        fetch('/api/help/faqs', { cache: 'no-store' }),
      ]);

      if (!catRes.ok || !faqRes.ok) {
        throw new Error('Failed to load help center data');
      }

      const catData = await catRes.json();
      const faqData = await faqRes.json();

      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
      if (faqData.success && Array.isArray(faqData.faqs)) {
        setFaqs(faqData.faqs);
      }
    } catch (err: any) {
      console.error('HelpCenter loading error:', err);
      setError(
        isAr
          ? 'تعذر تحميل مركز المساعدة حالياً. حاول مرة أخرى.'
          : 'Unable to load the Help Center right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Log search query after debounce
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return;
    const count = faqs.filter((f) => {
      const q = debouncedQuery.toLowerCase();
      return (
        f.question_ar?.toLowerCase().includes(q) ||
        f.question_en?.toLowerCase().includes(q) ||
        f.answer_ar?.toLowerCase().includes(q) ||
        f.answer_en?.toLowerCase().includes(q) ||
        f.keywords?.some((kw) => kw.toLowerCase().includes(q))
      );
    }).length;

    fetch('/api/help/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: debouncedQuery,
        resultsCount: count,
        lang,
      }),
    }).catch(() => {});
  }, [debouncedQuery, lang, faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    let result = faqs;

    if (selectedCategoryId) {
      result = result.filter((f) => f.category_id === selectedCategoryId);
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter((f) => {
        const titleMatch =
          (f.question_ar && f.question_ar.toLowerCase().includes(q)) ||
          (f.question_en && f.question_en.toLowerCase().includes(q));
        const answerMatch =
          (f.answer_ar && f.answer_ar.toLowerCase().includes(q)) ||
          (f.answer_en && f.answer_en.toLowerCase().includes(q));
        const keywordMatch =
          Array.isArray(f.keywords) &&
          f.keywords.some((kw) => kw.toLowerCase().includes(q));
        return titleMatch || answerMatch || keywordMatch;
      });
    }

    return result;
  }, [faqs, selectedCategoryId, debouncedQuery]);

  // Pinned FAQs (if not searching and no specific category or category pinned)
  const pinnedFaqs = useMemo(() => {
    if (debouncedQuery) return [];
    if (selectedCategoryId) {
      return filteredFaqs.filter((f) => f.is_pinned);
    }
    return faqs.filter((f) => f.is_pinned);
  }, [faqs, filteredFaqs, debouncedQuery, selectedCategoryId]);

  const regularFaqs = useMemo(() => {
    if (debouncedQuery) return filteredFaqs;
    return filteredFaqs.filter((f) => !f.is_pinned);
  }, [filteredFaqs, debouncedQuery]);

  // Handle accordion toggle + register view
  const toggleFaq = (id: string) => {
    if (expandedFaqId === id) {
      setExpandedFaqId(null);
    } else {
      setExpandedFaqId(id);
      if (!viewedFaqsRef.current.has(id)) {
        viewedFaqsRef.current.add(id);
        fetch(`/api/help/faqs/${encodeURIComponent(id)}/view`, {
          method: 'POST',
        }).catch(() => {});
      }
    }
  };

  // Selected category info
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Search quick suggestions
  const searchSuggestions = isAr
    ? ['طريقة تفعيل المفتاح', 'كيف أعرف مدة اشتراكي؟', 'حلول مشاكل Spoofer', 'أين أجد اللودر؟']
    : ['How to activate key', 'License duration', 'Spoofer troubleshooting', 'Download loader'];

  // Render Rich Answer Content
  const renderAnswerContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-[#c3d3d6]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Step with number: e.g. "1. ..."
          const stepMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
          if (stepMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 py-0.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#94e6c3]/15 text-[#94e6c3] font-mono text-[10px] font-bold border border-[#94e6c3]/25 mt-0.5">
                  {stepMatch[1]}
                </span>
                <span className="text-[#eef4f2]">{stepMatch[2]}</span>
              </div>
            );
          }

          // Bullet item: e.g. "- ..." or "• ..."
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-2 py-0.5 ps-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#94e6c3] mt-2 shrink-0" />
                <span>{trimmed.slice(2)}</span>
              </div>
            );
          }

          // Warning / Alert Callout: e.g. "[warning] ..." or "تنبيه: ..."
          if (
            trimmed.toLowerCase().startsWith('[warning]') ||
            trimmed.startsWith('تنبيه:') ||
            trimmed.startsWith('تحذير:') ||
            trimmed.startsWith('ملاحظة:')
          ) {
            const cleanText = trimmed.replace(/^\[warning\]\s*/i, '');
            return (
              <div
                key={idx}
                className="my-2 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-amber-200 text-xs"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span className="leading-5">{cleanText}</span>
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{trimmed}</p>;
        })}
      </div>
    );
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label={isAr ? 'مسار التنقل' : 'Breadcrumb'}
        className="flex items-center gap-2 text-xs font-medium text-[#93a9ad]"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId(null);
            setSearchQuery('');
            onNavigateTab?.('overview');
          }}
          className="hover:text-[#94e6c3] transition"
        >
          {isAr ? 'الرئيسية' : 'Home'}
        </button>
        <span className="text-[#24343e]">/</span>
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId(null);
            setSearchQuery('');
          }}
          className={selectedCategoryId ? 'hover:text-[#94e6c3] transition' : 'text-[#eef4f2] font-semibold'}
        >
          {isAr ? 'مركز المساعدة' : 'Help Center'}
        </button>
        {activeCategory && (
          <>
            <span className="text-[#24343e]">/</span>
            <span className="text-[#94e6c3] font-semibold">
              {isAr ? activeCategory.name_ar : activeCategory.name_en}
            </span>
          </>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#24343e] bg-[#101b23] px-6 py-10 sm:px-10 sm:py-12 shadow-sm">
        {/* Subtle Ambient Background */}
        <div className="pointer-events-none absolute -top-24 end-0 h-64 w-64 rounded-full bg-[#94e6c3]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 start-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#94e6c3]/25 bg-[#94e6c3]/10 px-3.5 py-1 text-[11px] font-bold text-[#94e6c3]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'مركز المساعدة' : 'Help Center'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#eef4f2]">
            {isAr ? 'كل ما تحتاجه، في مكان واحد.' : 'Everything you need, in one place.'}
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed text-[#93a9ad] max-w-xl mx-auto">
            {isAr
              ? 'تصفح الأسئلة الشائعة واختر القسم المناسب لمعرفة الخطوات المطلوبة.'
              : 'Browse the common questions and choose the right category to follow the required steps.'}
          </p>
        </div>
      </section>

      {/* Issue-only support policy */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-200/15 bg-[linear-gradient(135deg,rgba(48,35,20,.78),rgba(16,27,35,.96)_58%,rgba(12,24,31,.98))] p-5 shadow-[0_16px_38px_rgba(0,0,0,.18)] sm:p-6">
        <div className="pointer-events-none absolute -top-16 end-0 h-40 w-40 rounded-full bg-amber-300/[.08] blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5 text-start">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-[.14em] text-amber-200/70">{isAr ? 'الدعم المخصص للمشكلات فقط' : 'ISSUE-ONLY SUPPORT'}</p>
              <h2 className="mt-1 text-base font-black text-[#fff8e7] sm:text-lg">{isAr ? 'تقديم مشكلة' : 'Submit an issue'}</h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-[#c8c0af]">{isAr ? 'هذا القسم مخصص لمشكلة حدثت فعلياً في المنتج أو الحساب أو الطلب أو الموقع. اذكر ما حدث بوضوح وأرفق التفاصيل اللازمة للمراجعة.' : 'Use this for a real issue with a product, account, order, or website. Explain what happened clearly and include the details needed for review.'}</p>
            </div>
          </div>
          <a href="/support" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200/25 bg-amber-300/10 px-4 py-2.5 text-xs font-black text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-200/45 hover:bg-amber-300/16">
            <span>{isAr ? 'تقديم المشكلة للدعم' : 'Submit issue to support'}</span>
            <Arrow className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="relative mt-4 grid gap-2 border-t border-amber-100/10 pt-4 text-[11px] leading-5 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/10 bg-emerald-300/[.05] px-3 py-2.5 text-emerald-100/80"><strong className="text-emerald-200">{isAr ? 'مقبول:' : 'Accepted:'}</strong> {isAr ? 'تعطل المنتج، مشكلة الحساب أو المفتاح، مشكلة الطلب، أو خطأ ظهر في الموقع.' : 'Product failure, account or key issue, order problem, or an error shown by the website.'}</div>
          <div className="rounded-xl border border-rose-200/10 bg-rose-300/[.05] px-3 py-2.5 text-rose-100/75"><strong className="text-rose-200">{isAr ? 'غير مخصص له:' : 'Not for:'}</strong> {isAr ? 'طلب شرح منتج أو خطوات موجودة في الشروحات أو مساعدة عامة لا تتعلق بعطل.' : 'Product explanations, steps already covered in guides, or general help unrelated to a fault.'}</div>
        </div>
      </section>

      {/* 3. Error State with Retry */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center space-y-3">
          <p className="text-xs font-bold text-rose-300">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl bg-[#101b23] border border-[#24343e] px-4 py-2 text-xs font-bold text-[#eef4f2] hover:bg-[#14222b] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* 4. Skeleton Loading */}
      {loading && !error && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-[#24343e] bg-[#101b23] p-5 animate-pulse space-y-3"
              >
                <div className="h-8 w-8 rounded-lg bg-[#24343e]/50" />
                <div className="h-4 w-1/2 rounded bg-[#24343e]/50" />
                <div className="h-3 w-3/4 rounded bg-[#24343e]/30" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl border border-[#24343e] bg-[#101b23] p-4 animate-pulse flex items-center justify-between"
              >
                <div className="h-4 w-1/3 rounded bg-[#24343e]/50" />
                <div className="h-4 w-4 rounded bg-[#24343e]/50" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 5. Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#eef4f2]">
                {isAr ? 'تصفح حسب القسم' : 'Browse by Category'}
              </h2>
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-xs font-bold text-[#94e6c3] hover:underline"
                >
                  {isAr ? 'عرض جميع الأقسام' : 'Show All Categories'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const IconComponent = ICON_MAP[cat.icon] || HelpCircle;
                const count = faqs.filter((f) => f.category_id === cat.id && f.is_published).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(isSelected ? null : cat.id);
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-start transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-1 focus:ring-[#94e6c3] ${
                      isSelected
                        ? 'border-[#94e6c3] bg-[#14222b] shadow-md shadow-[#94e6c3]/5'
                        : 'border-[#24343e] bg-[#101b23] hover:border-[#94e6c3]/40 hover:bg-[#14222b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                            isSelected
                              ? 'border-[#94e6c3]/40 bg-[#94e6c3]/15 text-[#94e6c3]'
                              : 'border-[#24343e] bg-[#0b121a] text-[#93a9ad] group-hover:border-[#94e6c3]/30 group-hover:text-[#94e6c3]'
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#93a9ad]">
                          {count} {isAr ? 'أسئلة' : 'FAQs'}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#eef4f2] group-hover:text-[#94e6c3] transition">
                        {isAr ? cat.name_ar : cat.name_en}
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#93a9ad] line-clamp-2">
                        {isAr ? cat.description_ar : cat.description_en}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-[#94e6c3] transition-opacity">
                      <span>{isSelected ? (isAr ? 'تم الاختيار' : 'Selected') : (isAr ? 'تصفح الأسئلة' : 'View questions')}</span>
                      <Arrow className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Pinned Questions (الأسئلة الأكثر شيوعًا) */}
          {pinnedFaqs.length > 0 && !debouncedQuery && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#eef4f2]">
                <Pin className="h-3.5 w-3.5 text-[#94e6c3]" />
                <span>{isAr ? 'الأسئلة الأكثر شيوعاً' : 'Most Popular Questions'}</span>
              </div>

              <div className="space-y-2.5">
                {pinnedFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                        isExpanded
                          ? 'border-[#94e6c3]/40 bg-[#14222b]'
                          : 'border-[#24343e] bg-[#101b23] hover:border-[#94e6c3]/25'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between p-4 sm:p-5 text-start transition focus:outline-none"
                      >
                        <div className="flex items-center gap-3 pe-4">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#94e6c3]/10 text-[#94e6c3] border border-[#94e6c3]/20">
                            <Pin className="h-3 w-3" />
                          </span>
                          <span className="text-xs sm:text-[14px] font-bold text-[#eef4f2]">
                            {isAr ? faq.question_ar : faq.question_en}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#93a9ad] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#94e6c3]' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#24343e]/70 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 space-y-4 animate-in fade-in duration-200">
                          {renderAnswerContent(isAr ? faq.answer_ar : faq.answer_en)}
                          {faq.image_url && <button type="button" onClick={() => setZoomedImage(faq.image_url || null)} aria-label={isAr ? 'تكبير صورة الشرح' : 'Enlarge guide image'} className="block w-full overflow-hidden rounded-xl border border-[#24343e] bg-[#0b121a] p-2 text-center transition hover:border-[#94e6c3]/40">
                            <img src={faq.image_url} alt={isAr ? `صورة توضيحية: ${faq.question_ar}` : `Illustration: ${faq.question_en}`} loading="lazy" className="mx-auto max-h-[460px] w-full object-contain" />
                            <span className="mt-2 block text-[11px] font-bold text-[#94e6c3]">{isAr ? 'اضغط لتكبير الصورة' : 'Click to enlarge image'}</span>
                          </button>}

                          {/* Related items */}
                          <div className="pt-2 border-t border-[#24343e]/40 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#93a9ad]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#93a9ad]/70">{isAr ? 'التصنيف:' : 'Category:'}</span>
                              <span className="rounded-md bg-[#0b121a] px-2 py-0.5 text-[#94e6c3] border border-[#24343e]">
                                {isAr ? faq.category_name_ar : faq.category_name_en}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-[#93a9ad]/60">
                              {faq.views || 0} {isAr ? 'مشاهدة' : 'views'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Regular FAQs List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#eef4f2]">
                {debouncedQuery
                  ? `${isAr ? 'نتائج البحث عن:' : 'Search results for:'} "${debouncedQuery}"`
                  : activeCategory
                  ? `${isAr ? 'أسئلة' : 'Questions in'} ${isAr ? activeCategory.name_ar : activeCategory.name_en}`
                  : (isAr ? 'جميع الأسئلة الشائعة' : 'All Frequently Asked Questions')}
              </h2>
              <span className="text-xs font-mono text-[#93a9ad]">
                {filteredFaqs.length} {isAr ? 'سؤال' : 'results'}
              </span>
            </div>

            {/* Empty State */}
            {filteredFaqs.length === 0 && (
              <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b121a] border border-[#24343e] text-[#93a9ad]">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-[#eef4f2]">
                  {debouncedQuery
                    ? (isAr ? 'لم نجد نتيجة مطابقة لبحثك.' : 'No matching results found.')
                    : (isAr ? 'لا توجد أسئلة متاحة حالياً.' : 'No questions available at this time.')}
                </h3>
                <p className="text-xs text-[#93a9ad] max-w-md mx-auto">
                  {debouncedQuery
                    ? (isAr
                        ? 'جرّب استخدام كلمات مختلفة أو تصفح الأقسام للعثور على الإجابة المطلوبة.'
                        : 'Try using different search terms or browse categories to find what you need.')
                    : (isAr
                        ? 'سيتم إضافة أسئلة وشروحات جديدة قريباً.'
                        : 'New questions and guides will be added soon.')}
                </p>
                {debouncedQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryId(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#14222b] border border-[#24343e] px-4 py-2 text-xs font-bold text-[#94e6c3] hover:bg-[#24343e] transition"
                  >
                    <span>{isAr ? 'مسح البحث وعرض كل الأسئلة' : 'Clear search and show all'}</span>
                  </button>
                )}
              </div>
            )}

            {/* FAQs Accordion */}
            {regularFaqs.length > 0 && (
              <div className="space-y-2.5">
                {regularFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  const related = faqs
                    .filter((f) => f.category_id === faq.category_id && f.id !== faq.id)
                    .slice(0, 3);

                  return (
                    <div
                      key={faq.id}
                      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                        isExpanded
                          ? 'border-[#94e6c3]/40 bg-[#14222b]'
                          : 'border-[#24343e] bg-[#101b23] hover:border-[#94e6c3]/25 hover:bg-[#14222b]/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between p-4 sm:p-5 text-start transition focus:outline-none"
                      >
                        <span className="pe-4 text-xs sm:text-[14px] font-bold text-[#eef4f2]">
                          {isAr ? faq.question_ar : faq.question_en}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#93a9ad] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#94e6c3]' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#24343e]/70 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 space-y-4 animate-in fade-in duration-200">
                          {renderAnswerContent(isAr ? faq.answer_ar : faq.answer_en)}
                          {faq.image_url && <button type="button" onClick={() => setZoomedImage(faq.image_url || null)} aria-label={isAr ? 'تكبير صورة الشرح' : 'Enlarge guide image'} className="block w-full overflow-hidden rounded-xl border border-[#24343e] bg-[#0b121a] p-2 text-center transition hover:border-[#94e6c3]/40">
                            <img src={faq.image_url} alt={isAr ? `صورة توضيحية: ${faq.question_ar}` : `Illustration: ${faq.question_en}`} loading="lazy" className="mx-auto max-h-[460px] w-full object-contain" />
                            <span className="mt-2 block text-[11px] font-bold text-[#94e6c3]">{isAr ? 'اضغط لتكبير الصورة' : 'Click to enlarge image'}</span>
                          </button>}

                          {/* Related FAQs ("قد يفيدك أيضًا") */}
                          {related.length > 0 && (
                            <div className="pt-3 border-t border-[#24343e]/40 space-y-2">
                              <p className="text-[11px] font-bold text-[#93a9ad]">
                                {isAr ? 'قد يفيدك أيضاً:' : 'You may also find useful:'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {related.map((rel) => (
                                  <button
                                    key={rel.id}
                                    type="button"
                                    onClick={() => setExpandedFaqId(rel.id)}
                                    className="rounded-lg border border-[#24343e] bg-[#0b121a] px-3 py-1.5 text-[11px] text-[#c3d3d6] hover:border-[#94e6c3]/40 hover:text-[#94e6c3] transition text-start"
                                  >
                                    {isAr ? rel.question_ar : rel.question_en}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer details */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#93a9ad]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#93a9ad]/70">{isAr ? 'التصنيف:' : 'Category:'}</span>
                              <span className="rounded-md bg-[#0b121a] px-2 py-0.5 text-[#94e6c3] border border-[#24343e]">
                                {isAr ? faq.category_name_ar : faq.category_name_en}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-[#93a9ad]/60">
                              {faq.views || 0} {isAr ? 'مشاهدة' : 'views'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'صورة الشرح مكبرة' : 'Enlarged guide image'}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#24343e]">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              aria-label={isAr ? 'إغلاق الصورة' : 'Close image'}
              className="absolute top-3 end-3 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={zoomedImage} alt={isAr ? 'صورة الشرح مكبرة' : 'Enlarged guide image'} className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
