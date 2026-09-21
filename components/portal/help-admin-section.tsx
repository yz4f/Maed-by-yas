'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderPlus,
  HelpCircle,
  Layers,
  ListOrdered,
  Loader2,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type { FaqCategory, FaqItem, FaqStats } from '@/types';

interface HelpAdminSectionProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onNotify: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type AdminTab = 'faqs' | 'categories' | 'stats';

export function HelpAdminSection({ lang, isDark, onNotify }: HelpAdminSectionProps) {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<AdminTab>('faqs');

  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [stats, setStats] = useState<FaqStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search for FAQs table
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned' | 'unpinned'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'order'>('order');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // FAQ Modal (Add/Edit)
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState({
    category_id: '',
    question_ar: '',
    question_en: '',
    answer_ar: '',
    answer_en: '',
    keywords: '',
    is_pinned: false,
    is_published: true,
    sort_order: 0,
  });
  const [editorPreviewMode, setEditorPreviewMode] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);

  // Category Modal (Add/Edit)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [catForm, setCatForm] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    icon: 'HelpCircle',
    sort_order: 0,
    is_active: true,
  });
  const [savingCat, setSavingCat] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', action: async () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [faqsRes, catsRes, statsRes] = await Promise.all([
        fetch('/api/admin/help/faqs', { cache: 'no-store' }),
        fetch('/api/admin/help/categories', { cache: 'no-store' }),
        fetch('/api/admin/help/stats', { cache: 'no-store' }),
      ]);

      const faqsData = await faqsRes.json();
      const catsData = await catsRes.json();
      const statsData = await statsRes.json();

      if (faqsData.success) setFaqs(faqsData.faqs || []);
      if (catsData.success) setCategories(catsData.categories || []);
      if (statsData.success) setStats(statsData.stats || null);
    } catch (err: any) {
      console.error('Failed to load admin help data:', err);
      onNotify(isAr ? 'فشل تحميل بيانات مركز المساعدة.' : 'Failed to load Help Center data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted FAQs
  const filteredFaqs = useMemo(() => {
    let list = [...faqs];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.question_ar?.toLowerCase().includes(q) ||
          f.question_en?.toLowerCase().includes(q) ||
          f.answer_ar?.toLowerCase().includes(q) ||
          f.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      list = list.filter((f) => f.category_id === categoryFilter);
    }

    if (statusFilter === 'published') {
      list = list.filter((f) => f.is_published);
    } else if (statusFilter === 'hidden') {
      list = list.filter((f) => !f.is_published);
    }

    if (pinnedFilter === 'pinned') {
      list = list.filter((f) => f.is_pinned);
    } else if (pinnedFilter === 'unpinned') {
      list = list.filter((f) => !f.is_pinned);
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      return a.sort_order - b.sort_order;
    });

    return list;
  }, [faqs, searchFilter, categoryFilter, statusFilter, pinnedFilter, sortBy]);

  // Paginated FAQs
  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / pageSize));
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFaqs.slice(start, start + pageSize);
  }, [filteredFaqs, currentPage]);

  // FAQ Modal Form handlers
  const openAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      category_id: categories[0]?.id || '',
      question_ar: '',
      question_en: '',
      answer_ar: '',
      answer_en: '',
      keywords: '',
      is_pinned: false,
      is_published: true,
      sort_order: faqs.length + 1,
    });
    setEditorPreviewMode(false);
    setFaqModalOpen(true);
  };

  const openEditFaq = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFaqForm({
      category_id: faq.category_id,
      question_ar: faq.question_ar,
      question_en: faq.question_en || '',
      answer_ar: faq.answer_ar,
      answer_en: faq.answer_en || '',
      keywords: Array.isArray(faq.keywords) ? faq.keywords.join(', ') : '',
      is_pinned: faq.is_pinned,
      is_published: faq.is_published,
      sort_order: faq.sort_order || 0,
    });
    setEditorPreviewMode(false);
    setFaqModalOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question_ar.trim()) {
      onNotify(isAr ? 'عنوان السؤال بالعربية مطلوب.' : 'Arabic question title is required.', 'warning');
      return;
    }
    if (!faqForm.answer_ar.trim()) {
      onNotify(isAr ? 'إجابة السؤال بالعربية مطلوبة.' : 'Arabic answer is required.', 'warning');
      return;
    }
    if (!faqForm.category_id) {
      onNotify(isAr ? 'يرجى اختيار التصنيف.' : 'Please select a category.', 'warning');
      return;
    }

    setSavingFaq(true);
    try {
      const url = editingFaq
        ? `/api/admin/help/faqs/${encodeURIComponent(editingFaq.id)}`
        : '/api/admin/help/faqs';
      const method = editingFaq ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...faqForm,
          keywords: faqForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error saving FAQ');
      }

      onNotify(
        editingFaq
          ? (isAr ? 'تم تعديل السؤال بنجاح.' : 'FAQ updated successfully.')
          : (isAr ? 'تم إنشاء السؤال بنجاح.' : 'FAQ created successfully.'),
        'success'
      );
      setFaqModalOpen(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || (isAr ? 'فشل حفظ السؤال.' : 'Failed to save FAQ.'), 'error');
    } finally {
      setSavingFaq(false);
    }
  };

  // Toggle quick states
  const handleTogglePublish = async (faq: FaqItem) => {
    try {
      const res = await fetch(`/api/admin/help/faqs/${encodeURIComponent(faq.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !faq.is_published }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === faq.id ? { ...f, is_published: !f.is_published } : f))
        );
        onNotify(
          !faq.is_published
            ? (isAr ? 'تم نشر السؤال.' : 'FAQ published.')
            : (isAr ? 'تم إخفاء/تعطيل السؤال.' : 'FAQ unpublished.'),
          'info'
        );
      }
    } catch {
      onNotify(isAr ? 'تعذر تغيير حالة السؤال.' : 'Failed to toggle FAQ status.', 'error');
    }
  };

  const handleTogglePin = async (faq: FaqItem) => {
    try {
      const res = await fetch(`/api/admin/help/faqs/${encodeURIComponent(faq.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !faq.is_pinned }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === faq.id ? { ...f, is_pinned: !f.is_pinned } : f))
        );
        onNotify(
          !faq.is_pinned
            ? (isAr ? 'تم تثبيت السؤال.' : 'FAQ pinned.')
            : (isAr ? 'تم إلغاء تثبيت السؤال.' : 'FAQ unpinned.'),
          'info'
        );
      }
    } catch {
      onNotify(isAr ? 'تعذر تغيير حالة التثبيت.' : 'Failed to toggle pin status.', 'error');
    }
  };

  const promptDeleteFaq = (faq: FaqItem) => {
    setConfirmModal({
      open: true,
      title: isAr ? 'حذف السؤال' : 'Delete FAQ',
      message: isAr
        ? `هل أنت متأكد من رغبتك في حذف سؤال: «${faq.question_ar}» بشكل نهائي؟`
        : `Are you sure you want to permanently delete: "${faq.question_ar}"?`,
      action: async () => {
        setConfirmLoading(true);
        try {
          const res = await fetch(`/api/admin/help/faqs/${encodeURIComponent(faq.id)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Delete failed');
          }
          setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
          onNotify(isAr ? 'تم حذف السؤال بنجاح.' : 'FAQ deleted successfully.', 'success');
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (err: any) {
          onNotify(err.message || (isAr ? 'فشل حذف السؤال.' : 'Failed to delete FAQ.'), 'error');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  // Category Handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatForm({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      icon: 'HelpCircle',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: FaqCategory) => {
    setEditingCategory(cat);
    setCatForm({
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      description_ar: cat.description_ar,
      description_en: cat.description_en,
      icon: cat.icon || 'HelpCircle',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active,
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name_ar.trim()) {
      onNotify(isAr ? 'اسم التصنيف بالعربية مطلوب.' : 'Arabic category name is required.', 'warning');
      return;
    }

    setSavingCat(true);
    try {
      const url = editingCategory
        ? `/api/admin/help/categories/${encodeURIComponent(editingCategory.id)}`
        : '/api/admin/help/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed saving category');
      }

      onNotify(
        editingCategory
          ? (isAr ? 'تم تعديل التصنيف بنجاح.' : 'Category updated successfully.')
          : (isAr ? 'تم إنشاء التصنيف بنجاح.' : 'Category created successfully.'),
        'success'
      );
      setCatModalOpen(false);
      loadData();
    } catch (err: any) {
      onNotify(err.message || (isAr ? 'فشل حفظ التصنيف.' : 'Failed to save category.'), 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const promptDeleteCategory = (cat: FaqCategory) => {
    setConfirmModal({
      open: true,
      title: isAr ? 'حذف التصنيف' : 'Delete Category',
      message: isAr
        ? `هل أنت متأكد من حذف تصنيف «${cat.name_ar}»؟`
        : `Are you sure you want to delete category "${cat.name_ar}"?`,
      action: async () => {
        setConfirmLoading(true);
        try {
          const res = await fetch(`/api/admin/help/categories/${encodeURIComponent(cat.id)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Delete category failed');
          }
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          onNotify(isAr ? 'تم حذف التصنيف بنجاح.' : 'Category deleted successfully.', 'success');
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (err: any) {
          onNotify(err.message || (isAr ? 'فشل حذف التصنيف.' : 'Failed to delete category.'), 'error');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  // Editor helper: insert markdown templates into answer_ar
  const insertTemplate = (prefix: string, placeholder: string) => {
    setFaqForm((prev) => ({
      ...prev,
      answer_ar: prev.answer_ar ? `${prev.answer_ar}\n${prefix} ${placeholder}` : `${prefix} ${placeholder}`,
    }));
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Section Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#24343e] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#94e6c3]/10 text-[#94e6c3] border border-[#94e6c3]/20">
              <BookOpen className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-[#eef4f2]">
              {isAr ? 'إدارة مركز المساعدة' : 'Help Center Management'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#93a9ad]">
            {isAr
              ? 'التحكم بالأسئلة الشائعة، التصنيفات، المحرر التفاعلي، وإحصائيات الاستخدام.'
              : 'Control FAQs, categories, rich editor content, and analytics.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#24343e] bg-[#101b23] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-bold transition ${
              activeTab === 'faqs'
                ? 'bg-[#14222b] text-[#94e6c3] shadow-sm border border-[#94e6c3]/30'
                : 'text-[#93a9ad] hover:text-[#eef4f2]'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{isAr ? 'الأسئلة الشائعة' : 'FAQs'}</span>
            <span className="rounded-full bg-[#0b121a] px-1.5 py-0.2 text-[10px] font-mono text-[#93a9ad]">
              {faqs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-bold transition ${
              activeTab === 'categories'
                ? 'bg-[#14222b] text-[#94e6c3] shadow-sm border border-[#94e6c3]/30'
                : 'text-[#93a9ad] hover:text-[#eef4f2]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isAr ? 'التصنيفات' : 'Categories'}</span>
            <span className="rounded-full bg-[#0b121a] px-1.5 py-0.2 text-[10px] font-mono text-[#93a9ad]">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-bold transition ${
              activeTab === 'stats'
                ? 'bg-[#14222b] text-[#94e6c3] shadow-sm border border-[#94e6c3]/30'
                : 'text-[#93a9ad] hover:text-[#eef4f2]'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#94e6c3]" />
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: FAQS MANAGEMENT                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              {/* Action Bar & Filters */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Filter */}
                  <div className="relative min-w-[200px]">
                    <Search className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-[#93a9ad] h-3.5 w-3.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder={isAr ? 'بحث في الأسئلة...' : 'Filter questions...'}
                      className="w-full rounded-xl border border-[#24343e] bg-[#101b23] py-2 ps-9 pe-3 text-xs text-[#eef4f2] placeholder-[#93a9ad]/60 outline-none focus:border-[#94e6c3]"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-[#24343e] bg-[#101b23] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    <option value="all">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-[#24343e] bg-[#101b23] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    <option value="all">{isAr ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="published">{isAr ? 'المنشورة فقط' : 'Published Only'}</option>
                    <option value="hidden">{isAr ? 'المعطلة / المخفية' : 'Hidden / Drafts'}</option>
                  </select>

                  {/* Pinned Filter */}
                  <select
                    value={pinnedFilter}
                    onChange={(e: any) => setPinnedFilter(e.target.value)}
                    className="rounded-xl border border-[#24343e] bg-[#101b23] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    <option value="all">{isAr ? 'الكل (المثبت وغير المثبت)' : 'All Pins'}</option>
                    <option value="pinned">{isAr ? 'المثبتة فقط' : 'Pinned Only'}</option>
                    <option value="unpinned">{isAr ? 'غير مثبتة' : 'Unpinned Only'}</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="rounded-xl border border-[#24343e] bg-[#101b23] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    <option value="order">{isAr ? 'الترتيب اليدوي' : 'Manual Order'}</option>
                    <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
                    <option value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</option>
                    <option value="views">{isAr ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
                  </select>
                </div>

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={openAddFaq}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#94e6c3] px-4 py-2 text-xs font-black text-[#0b121a] hover:brightness-110 transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isAr ? 'إضافة سؤال جديد' : 'Add New Question'}</span>
                </button>
              </div>

              {/* FAQs Table */}
              <div className="overflow-hidden rounded-2xl border border-[#24343e] bg-[#101b23]">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="border-b border-[#24343e] bg-[#0b121a] text-[#93a9ad]">
                      <tr>
                        <th className="py-3 px-4 text-start font-bold">{isAr ? 'السؤال' : 'Question'}</th>
                        <th className="py-3 px-4 text-start font-bold">{isAr ? 'التصنيف' : 'Category'}</th>
                        <th className="py-3 px-4 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-3 px-4 text-center font-bold">{isAr ? 'مثبت' : 'Pinned'}</th>
                        <th className="py-3 px-4 text-center font-bold">{isAr ? 'المشاهدات' : 'Views'}</th>
                        <th className="py-3 px-4 text-center font-bold">{isAr ? 'الترتيب' : 'Order'}</th>
                        <th className="py-3 px-4 text-end font-bold">{isAr ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24343e]/70 text-[#eef4f2]">
                      {paginatedFaqs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[#93a9ad]">
                            {isAr ? 'لا توجد أسئلة مطابقة للفلتر.' : 'No questions matching the filters.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedFaqs.map((faq) => (
                          <tr key={faq.id} className="hover:bg-[#14222b]/60 transition">
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold truncate">{faq.question_ar}</div>
                              {faq.question_en && (
                                <div className="text-[11px] text-[#93a9ad] truncate">{faq.question_en}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="rounded-lg bg-[#0b121a] px-2.5 py-1 text-[11px] text-[#94e6c3] border border-[#24343e]">
                                {isAr ? faq.category_name_ar : faq.category_name_en}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(faq)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                                  faq.is_published
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                                }`}
                              >
                                {faq.is_published ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>{isAr ? 'منشور' : 'Published'}</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    <span>{isAr ? 'مخفي' : 'Hidden'}</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleTogglePin(faq)}
                                className={`p-1.5 rounded-lg border transition ${
                                  faq.is_pinned
                                    ? 'border-[#94e6c3]/40 bg-[#94e6c3]/15 text-[#94e6c3]'
                                    : 'border-[#24343e] text-[#93a9ad] hover:text-[#eef4f2]'
                                }`}
                                title={faq.is_pinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin') : (isAr ? 'تثبيت' : 'Pin')}
                              >
                                <Pin className="h-3.5 w-3.5" />
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs whitespace-nowrap text-[#93a9ad]">
                              {faq.views || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs whitespace-nowrap text-[#93a9ad]">
                              {faq.sort_order || 0}
                            </td>
                            <td className="py-3 px-4 text-end whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditFaq(faq)}
                                  className="p-1.5 rounded-lg border border-[#24343e] bg-[#0b121a] text-[#93a9ad] hover:border-[#94e6c3]/40 hover:text-[#94e6c3] transition"
                                  title={isAr ? 'تعديل' : 'Edit'}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => promptDeleteFaq(faq)}
                                  className="p-1.5 rounded-lg border border-[#24343e] bg-[#0b121a] text-[#93a9ad] hover:border-rose-500/40 hover:text-rose-400 transition"
                                  title={isAr ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[#24343e] px-4 py-3 text-xs text-[#93a9ad]">
                    <div>
                      {isAr ? 'الصفحة' : 'Page'} {currentPage} {isAr ? 'من' : 'of'} {totalPages}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-[#24343e] disabled:opacity-40 hover:bg-[#14222b] transition"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-lg border border-[#24343e] disabled:opacity-40 hover:bg-[#14222b] transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CATEGORIES MANAGEMENT                                              */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#93a9ad]">
                  {isAr
                    ? 'إدارة أقسام الأسئلة وتحديد مسمياتها وأيقوناتها وحالاتها.'
                    : 'Manage FAQ categories, names, icons, and visibility.'}
                </p>
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#94e6c3] px-4 py-2 text-xs font-black text-[#0b121a] hover:brightness-110 transition shadow-sm"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>{isAr ? 'إضافة تصنيف جديد' : 'Add New Category'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#94e6c3]/10 text-[#94e6c3] border border-[#94e6c3]/20 font-mono text-xs">
                          {cat.icon}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                              cat.is_active
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {cat.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'مخفي' : 'Hidden')}
                          </span>
                          <span className="font-mono text-[10px] text-[#93a9ad]">
                            #{cat.sort_order}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[#eef4f2]">{cat.name_ar}</h3>
                      {cat.name_en && <p className="text-xs text-[#93a9ad]">{cat.name_en}</p>}
                      <p className="mt-2 text-xs leading-relaxed text-[#93a9ad]/80 line-clamp-2">
                        {cat.description_ar}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#24343e]/70">
                      <span className="text-[11px] font-mono text-[#93a9ad]">
                        {faqs.filter((f) => f.category_id === cat.id).length} {isAr ? 'سؤال' : 'FAQs'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCategory(cat)}
                          className="p-1.5 rounded-lg border border-[#24343e] bg-[#0b121a] text-[#93a9ad] hover:border-[#94e6c3]/40 hover:text-[#94e6c3] transition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteCategory(cat)}
                          className="p-1.5 rounded-lg border border-[#24343e] bg-[#0b121a] text-[#93a9ad] hover:border-rose-500/40 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: STATS & ANALYTICS                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#93a9ad] text-xs">
                    <span>{isAr ? 'إجمالي الأسئلة' : 'Total Questions'}</span>
                    <HelpCircle className="h-4 w-4 text-[#94e6c3]" />
                  </div>
                  <div className="text-2xl font-mono font-black text-[#eef4f2]">
                    {stats?.totalFaqs ?? 0}
                  </div>
                  <div className="text-[11px] text-[#93a9ad]">
                    {stats?.publishedFaqs ?? 0} {isAr ? 'سؤال منشور' : 'published'}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#93a9ad] text-xs">
                    <span>{isAr ? 'عدد التصنيفات' : 'Categories'}</span>
                    <Layers className="h-4 w-4 text-[#94e6c3]" />
                  </div>
                  <div className="text-2xl font-mono font-black text-[#eef4f2]">
                    {stats?.totalCategories ?? 0}
                  </div>
                  <div className="text-[11px] text-[#93a9ad]">
                    {isAr ? 'أقسام معتمدة' : 'active sections'}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#93a9ad] text-xs">
                    <span>{isAr ? 'إجمالي عمليات البحث' : 'Search Queries'}</span>
                    <Search className="h-4 w-4 text-[#94e6c3]" />
                  </div>
                  <div className="text-2xl font-mono font-black text-[#eef4f2]">
                    {stats?.totalSearches ?? 0}
                  </div>
                  <div className="text-[11px] text-[#93a9ad]">
                    {isAr ? 'بحث مسجل في المركز' : 'recorded searches'}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#93a9ad] text-xs">
                    <span>{isAr ? 'عمليات بدون نتائج' : 'Zero-Result Searches'}</span>
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-300">
                    {stats?.zeroResultQueries.reduce((acc, curr) => acc + curr.count, 0) ?? 0}
                  </div>
                  <div className="text-[11px] text-[#93a9ad]">
                    {isAr ? 'استفسارات تحتاج شروحات' : 'queries need guides'}
                  </div>
                </div>
              </div>

              {/* Analytics Tables: Most Viewed & Top Search Queries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Viewed Questions */}
                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#eef4f2]">
                    <TrendingUp className="h-4 w-4 text-[#94e6c3]" />
                    <span>{isAr ? 'أكثر الأسئلة مشاهدة' : 'Most Viewed Questions'}</span>
                  </div>

                  {!stats?.mostViewedFaqs || stats.mostViewedFaqs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#93a9ad]">
                      {isAr ? 'لا توجد بيانات حتى الآن.' : 'No data available yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.mostViewedFaqs.map((f, i) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between rounded-xl border border-[#24343e] bg-[#0b121a] p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#101b23] font-mono text-[10px] text-[#94e6c3]">
                              {i + 1}
                            </span>
                            <span className="truncate font-medium text-[#eef4f2]">{f.question_ar}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#94e6c3] ps-3">
                            {f.views} {isAr ? 'مشاهدة' : 'views'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Search Queries & Zero-Results */}
                <div className="rounded-2xl border border-[#24343e] bg-[#101b23] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#eef4f2]">
                    <Search className="h-4 w-4 text-[#94e6c3]" />
                    <span>{isAr ? 'أكثر الكلمات بحثاً واستفسارات دون نتائج' : 'Top Search Queries'}</span>
                  </div>

                  {!stats?.topSearchQueries || stats.topSearchQueries.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#93a9ad]">
                      {isAr ? 'لا توجد بيانات حتى الآن.' : 'No data available yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.topSearchQueries.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-[#24343e] bg-[#0b121a] p-3 text-xs"
                        >
                          <span className="font-medium text-[#eef4f2]">«{item.query}»</span>
                          <span className="font-mono text-xs text-[#94e6c3]">
                            {item.count} {isAr ? 'مرة' : 'times'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* FAQ MODAL: ADD / EDIT WITH RICH ANSWER EDITOR & PREVIEW                    */}
      {/* ========================================================================= */}
      {faqModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !savingFaq && setFaqModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#24343e] bg-[#101b23] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#24343e] pb-4">
              <h3 className="text-base font-bold text-[#eef4f2]">
                {editingFaq
                  ? (isAr ? 'تعديل السؤال' : 'Edit Question')
                  : (isAr ? 'إضافة سؤال جديد' : 'Add New Question')}
              </h3>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="rounded-lg p-1 text-[#93a9ad] hover:text-[#eef4f2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 text-xs">
              {/* Category & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-[#93a9ad]">
                    {isAr ? 'التصنيف *' : 'Category *'}
                  </label>
                  <select
                    value={faqForm.category_id}
                    onChange={(e) => setFaqForm({ ...faqForm, category_id: e.target.value })}
                    className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3 py-2.5 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#93a9ad]">
                    {isAr ? 'الترتيب' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={faqForm.sort_order}
                    onChange={(e) => setFaqForm({ ...faqForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3 py-2.5 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  />
                </div>
              </div>

              {/* Questions Ar / En */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'عنوان السؤال (بالعربية) *' : 'Question Title (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={faqForm.question_ar}
                  onChange={(e) => setFaqForm({ ...faqForm, question_ar: e.target.value })}
                  placeholder={isAr ? 'مثال: كيف أقوم بتفعيل المفتاح؟' : 'e.g. How do I activate key?'}
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2.5 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'عنوان السؤال (بالإنجليزية)' : 'Question Title (English)'}
                </label>
                <input
                  type="text"
                  value={faqForm.question_en}
                  onChange={(e) => setFaqForm({ ...faqForm, question_en: e.target.value })}
                  placeholder="e.g. How do I activate my key?"
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2.5 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              {/* Rich Answer Editor Header & Quick Formatting Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#24343e]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#93a9ad]">
                    {isAr ? 'محرر الإجابة (بالعربية) *' : 'Answer Content (Arabic) *'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode(false)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        !editorPreviewMode
                          ? 'bg-[#14222b] text-[#94e6c3] border border-[#94e6c3]/30'
                          : 'text-[#93a9ad] hover:text-[#eef4f2]'
                      }`}
                    >
                      {isAr ? 'المحرر' : 'Editor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode(true)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        editorPreviewMode
                          ? 'bg-[#14222b] text-[#94e6c3] border border-[#94e6c3]/30'
                          : 'text-[#93a9ad] hover:text-[#eef4f2]'
                      }`}
                    >
                      {isAr ? 'معاينة مباشرة' : 'Preview'}
                    </button>
                  </div>
                </div>

                {/* Quick Insert Actions */}
                {!editorPreviewMode && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#0b121a] border border-[#24343e] text-[11px]">
                    <button
                      type="button"
                      onClick={() => insertTemplate('1.', 'اكتب الخطوة الأولى هنا...')}
                      className="rounded-lg bg-[#101b23] border border-[#24343e] px-2 py-1 text-[#93a9ad] hover:text-[#94e6c3] transition"
                    >
                      + {isAr ? 'خطوة مرقمة' : 'Step'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('-', 'نقطة فرعية...')}
                      className="rounded-lg bg-[#101b23] border border-[#24343e] px-2 py-1 text-[#93a9ad] hover:text-[#94e6c3] transition"
                    >
                      + {isAr ? 'قائمة نقطية' : 'Bullet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('[warning]', 'تنبيه: تأكد من تشغيل اللودر كمسؤول')}
                      className="rounded-lg bg-[#101b23] border border-[#24343e] px-2 py-1 text-amber-300 hover:bg-amber-400/10 transition"
                    >
                      + {isAr ? 'صندوق تنبيه' : 'Warning Box'}
                    </button>
                  </div>
                )}

                {/* Editor or Preview Pane */}
                {!editorPreviewMode ? (
                  <textarea
                    rows={6}
                    value={faqForm.answer_ar}
                    onChange={(e) => setFaqForm({ ...faqForm, answer_ar: e.target.value })}
                    placeholder={isAr ? 'اكتب خطوات الإجابة أو الشرح بالتفصيل...' : 'Enter the detailed answer...'}
                    className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] p-3 text-xs text-[#eef4f2] placeholder-[#93a9ad]/60 outline-none focus:border-[#94e6c3] font-mono leading-relaxed"
                  />
                ) : (
                  <div className="rounded-xl border border-[#24343e] bg-[#0b121a] p-4 text-xs leading-relaxed text-[#c3d3d6] space-y-2 min-h-[140px]">
                    {faqForm.answer_ar.trim() ? (
                      faqForm.answer_ar.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))
                    ) : (
                      <p className="text-[#93a9ad] italic">
                        {isAr ? 'لا يوجد نص للمعاينة.' : 'Nothing to preview.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* English Answer */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'محتوى الإجابة (بالإنجليزية)' : 'Answer Content (English)'}
                </label>
                <textarea
                  rows={3}
                  value={faqForm.answer_en}
                  onChange={(e) => setFaqForm({ ...faqForm, answer_en: e.target.value })}
                  placeholder="Answer in English..."
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] p-3 text-xs text-[#eef4f2] placeholder-[#93a9ad]/60 outline-none focus:border-[#94e6c3]"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'الكلمات المفتاحية (مفصولة بفاصلة)' : 'Keywords (comma separated)'}
                </label>
                <input
                  type="text"
                  value={faqForm.keywords}
                  onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                  placeholder="تفعيل, مفتاح, سبوفر, activate, license"
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              {/* Checkboxes: Pinned & Published */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faqForm.is_pinned}
                    onChange={(e) => setFaqForm({ ...faqForm, is_pinned: e.target.checked })}
                    className="rounded border-[#24343e] text-[#94e6c3] focus:ring-[#94e6c3]"
                  />
                  <span className="font-bold text-[#eef4f2]">
                    {isAr ? 'تثبيت السؤال في أعلى مركز المساعدة (Pinned)' : 'Pin question at top'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faqForm.is_published}
                    onChange={(e) => setFaqForm({ ...faqForm, is_published: e.target.checked })}
                    className="rounded border-[#24343e] text-[#94e6c3] focus:ring-[#94e6c3]"
                  />
                  <span className="font-bold text-[#eef4f2]">
                    {isAr ? 'نشر السؤال للعملاء (Active)' : 'Publish to users'}
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#24343e]">
              <button
                type="button"
                disabled={savingFaq}
                onClick={() => setFaqModalOpen(false)}
                className="rounded-xl border border-[#24343e] bg-[#14222b] px-4 py-2 text-xs font-bold text-[#93a9ad] hover:text-[#eef4f2] transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={savingFaq}
                onClick={handleSaveFaq}
                className="inline-flex items-center gap-2 rounded-xl bg-[#94e6c3] px-5 py-2 text-xs font-black text-[#0b121a] hover:brightness-110 transition disabled:opacity-50"
              >
                {savingFaq && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAr ? 'حفظ السؤال' : 'Save Question'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY MODAL: ADD / EDIT                                                */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !savingCat && setCatModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#24343e] bg-[#101b23] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#24343e] pb-3">
              <h3 className="text-sm font-bold text-[#eef4f2]">
                {editingCategory
                  ? (isAr ? 'تعديل التصنيف' : 'Edit Category')
                  : (isAr ? 'إضافة تصنيف جديد' : 'Add Category')}
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="rounded-lg p-1 text-[#93a9ad] hover:text-[#eef4f2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'اسم التصنيف (بالعربية) *' : 'Category Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={catForm.name_ar}
                  onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })}
                  placeholder="المفاتيح والتفعيل"
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'اسم التصنيف (بالإنجليزية)' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  value={catForm.name_en}
                  onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                  placeholder="Keys & Activation"
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#93a9ad]">
                  {isAr ? 'وصف التصنيف (بالعربية)' : 'Description (Arabic)'}
                </label>
                <input
                  type="text"
                  value={catForm.description_ar}
                  onChange={(e) => setCatForm({ ...catForm, description_ar: e.target.value })}
                  placeholder="كل ما يتعلق بالتراخيص والمفاتيح..."
                  className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3.5 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#93a9ad]">
                    {isAr ? 'اسم الأيقونة' : 'Icon Name'}
                  </label>
                  <select
                    value={catForm.icon}
                    onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                    className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  >
                    <option value="KeyRound">KeyRound (مفتاح)</option>
                    <option value="Package">Package (منتجات)</option>
                    <option value="Wrench">Wrench (مشاكل وحلول)</option>
                    <option value="Shield">Shield (أمان وحساب)</option>
                    <option value="BookOpen">BookOpen (شروحات)</option>
                    <option value="HelpCircle">HelpCircle (مساعدة عامة)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#93a9ad]">
                    {isAr ? 'الترتيب' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={catForm.sort_order}
                    onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#24343e] bg-[#0b121a] px-3 py-2 text-xs text-[#eef4f2] outline-none focus:border-[#94e6c3]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })}
                  className="rounded border-[#24343e] text-[#94e6c3] focus:ring-[#94e6c3]"
                />
                <span className="font-bold text-[#eef4f2]">
                  {isAr ? 'تصنيف نشط ومعروض للعملاء' : 'Category is active and visible'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24343e]">
              <button
                type="button"
                disabled={savingCat}
                onClick={() => setCatModalOpen(false)}
                className="rounded-xl border border-[#24343e] bg-[#14222b] px-4 py-2 text-xs font-bold text-[#93a9ad]"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={savingCat}
                onClick={handleSaveCategory}
                className="inline-flex items-center gap-2 rounded-xl bg-[#94e6c3] px-5 py-2 text-xs font-black text-[#0b121a] hover:brightness-110 transition disabled:opacity-50"
              >
                {savingCat && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAr ? 'حفظ التصنيف' : 'Save Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL (No Browser confirm())                                 */}
      {/* ========================================================================= */}
      {confirmModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !confirmLoading && setConfirmModal((prev) => ({ ...prev, open: false }))}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#24343e] bg-[#101b23] p-6 text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#eef4f2]">{confirmModal.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#93a9ad]">
                {confirmModal.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="rounded-xl border border-[#24343e] bg-[#14222b] py-2.5 text-xs font-bold text-[#93a9ad] hover:text-[#eef4f2] transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => confirmModal.action()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-500 transition disabled:opacity-50"
              >
                {confirmLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAr ? 'نعم، حذف' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
