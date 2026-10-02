'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Key as KeyIcon,
  Layers,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  Sparkles,
} from 'lucide-react';
import { Product, Key, KeyStatus, KeyDuration, ProductCustomField } from '@/types';
import { toast } from '@/lib/toast';

interface ProductStockModalProps {
  isOpen: boolean;
  product: Product | null;
  initialTab?: ModalTab;
  lang?: 'ar' | 'en';
  onClose: () => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

type ModalTab = 'keys' | 'custom' | 'details';

const KEY_DURATION_OPTIONS: KeyDuration[] = ['3 Days', 'Lifetime'];

function maskKeyString(keyStr: string): string {
  if (!keyStr || keyStr.length <= 8) return keyStr;
  const start = keyStr.slice(0, 7);
  const end = keyStr.slice(-4);
  return `${start}••••••••${end}`;
}

export function ProductStockModal({
  isOpen,
  product,
  initialTab = 'keys',
  lang = 'ar',
  onClose,
  onProductUpdated,
}: ProductStockModalProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

  // Keys state
  const [keys, setKeys] = useState<Key[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [stockStats, setStockStats] = useState({
    total: 0,
    available: 0,
    used: 0,
    disabled: 0,
    reserved: 0,
    duplicateCodes: 0,
  });

  // Pagination & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);

  // Masking state
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());

  // Add Keys (Section 1)
  const [bulkInputText, setBulkInputText] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<KeyDuration>('3 Days');
  const allowDuplicates = false;
  const [isSubmittingKeys, setIsSubmittingKeys] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Key operations & Confirmations
  const [deletingKey, setDeletingKey] = useState<Key | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingKeyId, setTogglingKeyId] = useState<string | null>(null);

  // Unsaved Changes & Product Form State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Form Fields for Product Details
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    image: '',
    sku: '',
    category: '',
    version: '',
    fileSize: '',
    fileUrl: '',
    videoUrl: '',
    guideUrl: '',
    cardColor: 'blue' as 'blue' | 'cyan' | 'purple' | 'gold',
    isDisabled: false,
    isVisible: true,
    displayOrder: 0,
    downloadsCount: 0,
  });

  // Custom Fields State
  const [customFields, setCustomFields] = useState<ProductCustomField[]>([]);
  const [newFieldModalOpen, setNewFieldModalOpen] = useState(false);
  const [newFieldData, setNewFieldData] = useState<{
    name: string;
    key: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'boolean';
    value: string;
    required: boolean;
    options: string;
  }>({
    name: '',
    key: '',
    type: 'text',
    value: '',
    required: false,
    options: '',
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize or reset form data when product changes
  useEffect(() => {
    if (!product) return;

    setProductFormData({
      name: product.name || '',
      description: product.description || '',
      image: product.image || '',
      sku: product.sku || product.id,
      category: product.category || '',
      version: product.version || '',
      fileSize: product.fileSize || '',
      fileUrl: product.fileUrl || '',
      videoUrl: product.videoUrl || '',
      guideUrl: product.guideUrl || '',
      cardColor: product.cardColor || 'blue',
      isDisabled: Boolean(product.isDisabled),
      isVisible: product.isVisible !== false,
      displayOrder: Number(product.displayOrder || 0),
      downloadsCount: product.downloadsCount || 0,
    });

    // Populate custom fields or initialize default ones
    const initialFields: ProductCustomField[] = product.customFields && product.customFields.length > 0
      ? [...product.customFields]
      : [
          {
            id: 'cf-video',
            name: lang === 'ar' ? 'رابط الشرح / فيديو' : 'Video Tutorial URL',
            key: 'videoUrl',
            type: 'text',
            value: product.videoUrl || '',
            required: false,
            order: 1,
          },
          {
            id: 'cf-guide',
            name: lang === 'ar' ? 'رابط دليل الاستخدام' : 'User Guide URL',
            key: 'guideUrl',
            type: 'text',
            value: product.guideUrl || '',
            required: false,
            order: 2,
          },
          {
            id: 'cf-file',
            name: lang === 'ar' ? 'رابط تحميل الملف' : 'Download File URL',
            key: 'fileUrl',
            type: 'text',
            value: product.fileUrl || '',
            required: false,
            order: 3,
          },
        ];

    setCustomFields(initialFields);
    setHasUnsavedChanges(false);
    setBulkInputText('');
    setAddFeedback(null);
    setCurrentPage(1);
    setRevealedKeyIds(new Set());
  }, [product, lang]);

  // Load paginated keys from backend
  const loadKeys = useCallback(async (targetPage: number = currentPage) => {
    if (!product || product.id === 'new') return;

    setIsLoadingKeys(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery.trim(),
        status: statusFilter,
        sort: sortBy,
      });

      const res = await fetch(`/api/admin/products/${product.id}/stock?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === 'ar' ? 'تعذر جلب مفاتيح المخزون.' : 'Failed to fetch inventory keys.'));
      }

      setKeys(data.keys || []);
      setTotalPages(data.totalPages || 1);
      setTotalFilteredCount(data.total || 0);
      if (data.stockSummary) {
        setStockStats(data.stockSummary);
      }
    } catch (error: any) {
      console.error('Error fetching stock keys:', error);
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ أثناء تحميل المخزون.' : 'Error loading stock.'));
    } finally {
      setIsLoadingKeys(false);
    }
  }, [product, currentPage, pageSize, searchQuery, statusFilter, sortBy, lang]);

  useEffect(() => {
    if (isOpen && product && product.id !== 'new') {
      void loadKeys(currentPage);
    }
  }, [isOpen, product, currentPage, pageSize, statusFilter, sortBy, loadKeys]);

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen || !product || product.id === 'new') return;
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      void loadKeys(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Parse bulk input in real-time
  const parsedBulkAnalysis = useMemo(() => {
    const rawLines = bulkInputText
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const totalEntered = rawLines.length;
    if (totalEntered === 0) {
      return { totalEntered: 0, newValid: 0, duplicates: 0, cleanKeys: [] };
    }

    const seenInInput = new Set<string>();
    const existingActiveKeys = new Set(
      keys
        .filter((k) => k.status === 'available' || k.status === 'activated_pending_start' || !k.status)
        .map((k) => (k.key || '').trim().toUpperCase())
    );

    let duplicates = 0;
    const cleanKeys: string[] = [];

    for (const raw of rawLines) {
      const normalized = raw.toUpperCase();
      const isDup = seenInInput.has(normalized) || existingActiveKeys.has(normalized);
      if (isDup) {
        duplicates++;
        if (allowDuplicates) {
          cleanKeys.push(raw);
        }
      } else {
        cleanKeys.push(raw);
      }
      seenInInput.add(normalized);
    }

    return {
      totalEntered,
      newValid: cleanKeys.length,
      duplicates,
      cleanKeys,
    };
  }, [bulkInputText, keys, allowDuplicates]);

  // Bulk add keys handler
  const handleBulkAdd = async () => {
    if (!product || isSubmittingKeys) return;
    if (parsedBulkAnalysis.cleanKeys.length === 0) {
      toast.warning(lang === 'ar' ? 'يرجى إدخال كود مفتاح واحد على الأقل.' : 'Please enter at least one key code.');
      return;
    }

    setIsSubmittingKeys(true);
    setAddFeedback({
      type: 'info',
      text: lang === 'ar' ? 'جارٍ إضافة المفاتيح إلى المخزون...' : 'Adding keys to stock...',
    });

    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock/keys/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: parsedBulkAnalysis.cleanKeys,
          duration: selectedDuration,
          allowDuplicates,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === 'ar' ? 'تعذر إضافة المفاتيح. حاول مرة أخرى.' : 'Failed to add keys.'));
      }

      const inserted = data.inserted || parsedBulkAnalysis.cleanKeys.length;

      const successMsg = lang === 'ar'
        ? `✓ تمت إضافة ${inserted} كود بنجاح إلى المخزون.`
        : `✓ Successfully added ${inserted} keys to stock.`;

      setAddFeedback({ type: 'success', text: successMsg });
      toast.success(successMsg);
      setBulkInputText('');
      void loadKeys(1);

      // Notify parent to refresh stock counters
      if (onProductUpdated && product) {
        onProductUpdated({
          ...product,
          stockKeysCount: (product.stockKeysCount || 0) + inserted,
        });
      }
    } catch (error: any) {
      console.error('Failed to add keys:', error);
      const errMsg = error.message || (lang === 'ar' ? 'تعذر إضافة المفاتيح. حاول مرة أخرى.' : 'Failed to add keys.');
      setAddFeedback({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSubmittingKeys(false);
    }
  };

  // Toggle reveal/hide key
  const toggleKeyReveal = (keyId: string) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  // Copy key to clipboard
  const handleCopyKey = async (keyString: string) => {
    try {
      await navigator.clipboard.writeText(keyString);
      toast.success(lang === 'ar' ? 'تم نسخ المفتاح بنجاح!' : 'Key copied to clipboard!');
    } catch {
      toast.error(lang === 'ar' ? 'تعذر نسخ المفتاح تلقائياً.' : 'Failed to copy key.');
    }
  };

  // Toggle key status (available <-> disabled)
  const handleToggleKeyStatus = async (targetKey: Key) => {
    if (!product || togglingKeyId) return;
    if (targetKey.status === 'activated_pending_start' || targetKey.status === 'active' || targetKey.status === 'expired' || targetKey.isUsed) {
      toast.warning(lang === 'ar' ? 'لا يمكن تعديل حالة مفتاح مستخدم بالفعل.' : 'Cannot toggle status of an active used key.');
      return;
    }

    const nextStatus: KeyStatus = targetKey.status === 'disabled' || targetKey.isDisabled ? 'available' : 'disabled';
    setTogglingKeyId(targetKey.id);

    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock/keys/${targetKey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === 'ar' ? 'تعذر تغيير حالة المفتاح.' : 'Failed to change key status.'));
      }

      toast.success(nextStatus === 'available' ? (lang === 'ar' ? 'تم تفعيل المفتاح بنجاح.' : 'Key activated.') : (lang === 'ar' ? 'تم تعطيل المفتاح.' : 'Key disabled.'));
      void loadKeys(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTogglingKeyId(null);
    }
  };

  // Safe delete key
  const handleExecuteDeleteKey = async () => {
    if (!product || !deletingKey || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock/keys/${deletingKey.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === 'ar' ? 'تعذر إتمام عملية الحذف.' : 'Failed to delete key.'));
      }

      toast.success(data.message || (lang === 'ar' ? 'تم حذف المفتاح من المخزون بنجاح.' : 'Key deleted successfully.'));
      setDeletingKey(null);
      void loadKeys(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Save product details & custom fields
  const handleSaveProduct = async () => {
    if (!product || isSavingProduct) return;

    setIsSavingProduct(true);
    setSaveSuccessNotice(null);

    try {
      const payload: Partial<Product> = {
        name: productFormData.name.trim(),
        description: productFormData.description.trim(),
        image: productFormData.image.trim(),
        sku: productFormData.sku.trim(),
        category: productFormData.category.trim(),
        version: productFormData.version.trim(),
        fileSize: productFormData.fileSize.trim(),
        fileUrl: productFormData.fileUrl.trim(),
        videoUrl: productFormData.videoUrl.trim(),
        guideUrl: productFormData.guideUrl.trim(),
        cardColor: productFormData.cardColor,
        isDisabled: productFormData.isDisabled,
        isVisible: productFormData.isVisible,
        displayOrder: productFormData.displayOrder,
        downloadsCount: productFormData.downloadsCount,
        stockType: 'digital_keys',
        customFields: customFields,
      };

      const endpoint = product.id === 'new' ? '/api/admin/products' : `/api/admin/products/${product.id}`;
      const method = product.id === 'new' ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product.id === 'new' ? { ...payload, id: `prod-${Date.now()}` } : payload),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.product)) {
        throw new Error(data.message || (lang === 'ar' ? 'تعذر حفظ التغييرات. تحقق من البيانات.' : 'Failed to save changes.'));
      }

      const updated = data.product || { ...product, ...payload };
      setHasUnsavedChanges(false);
      setSaveSuccessNotice(lang === 'ar' ? '✓ تم حفظ جميع التغييرات بنجاح!' : '✓ All changes saved successfully!');
      toast.success(lang === 'ar' ? 'تم حفظ التغييرات بنجاح.' : 'Changes saved successfully.');

      if (onProductUpdated) {
        onProductUpdated(updated);
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.message || (lang === 'ar' ? 'تعذر حفظ التغييرات.' : 'Failed to save changes.'));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Safe Exit verification
  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // Keyboard navigation & Shortcuts (ESC, Ctrl+S)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSavingProduct) {
          void handleSaveProduct();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnsavedChanges, isSavingProduct]);

  // Custom field helpers
  const handleAddCustomField = () => {
    if (!newFieldData.name.trim() || !newFieldData.key.trim()) {
      toast.warning(lang === 'ar' ? 'اسم الحقل ومعرفه مطلوبان.' : 'Field name and key are required.');
      return;
    }

    const newField: ProductCustomField = {
      id: `cf-${Date.now()}`,
      name: newFieldData.name.trim(),
      key: newFieldData.key.trim(),
      type: newFieldData.type,
      value: newFieldData.type === 'boolean' ? false : newFieldData.value,
      required: newFieldData.required,
      options: newFieldData.type === 'select' ? newFieldData.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      order: customFields.length + 1,
    };

    setCustomFields((prev) => [...prev, newField]);
    setHasUnsavedChanges(true);
    setNewFieldModalOpen(false);
    setNewFieldData({
      name: '',
      key: '',
      type: 'text',
      value: '',
      required: false,
      options: '',
    });
    toast.success(lang === 'ar' ? 'تمت إضافة الحقل المخصص.' : 'Custom field added.');
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleMoveCustomField = (index: number, direction: 'up' | 'down') => {
    setCustomFields((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((f, i) => ({ ...f, order: i + 1 }));
    });
    setHasUnsavedChanges(true);
  };

  const handleCustomFieldValueChange = (id: string, value: any) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
    setHasUnsavedChanges(true);
  };

  if (!isOpen || !product) return null;

  const isRtl = lang === 'ar';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ar' ? 'إدارة المخزون' : 'Stock Management'}
    >
      {/* Modal Dialog Card */}
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="stock-management-modal w-full max-w-5xl h-[90vh] max-h-[880px] bg-[#090d16] border border-white/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-200 relative select-none"
      >
        {/* ====================================================================
            1. FIXED HEADER & STATS SUMMARY
            ==================================================================== */}
        <div className="stock-modal-header shrink-0 px-6 py-4 border-b border-white/10 bg-[#0d1424]/90 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <KeyIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                    {lang === 'ar' ? 'إدارة مخزون' : 'Stock Management'} —{' '}
                    <span className="text-blue-400">{product.name}</span>
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400">
                    {productFormData.sku || 'SKU-DIGITAL'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-normal truncate">
                  {lang === 'ar'
                    ? 'التحكم الشامل في المفاتيح الرقمية، الحقول المخصصة، والتزامن مع الطلبات الحقيقية.'
                    : 'Manage digital product keys, custom properties, and real-time order stock.'}
                </p>
              </div>
            </div>

            {/* Close Button X */}
            <button
              onClick={handleAttemptClose}
              className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-slate-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title={lang === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)'}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Stock Summary Badges */}
          <div className="stock-modal-summary flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-xs font-semibold">
            <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 flex items-center gap-2">
              <span className="text-slate-400">{lang === 'ar' ? 'المخزون:' : 'Total:'}</span>
              <span className="font-bold text-white font-mono">{stockStats.total}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'ar' ? 'المتاح:' : 'Available:'}</span>
              <span className="font-bold font-mono text-emerald-300">{stockStats.available}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-slate-600/30 bg-slate-800/40 text-slate-300 flex items-center gap-2">
              <span>{lang === 'ar' ? 'المستخدم:' : 'Used:'}</span>
              <span className="font-bold font-mono text-slate-200">{stockStats.used}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-400 flex items-center gap-2">
              <span>{lang === 'ar' ? 'المعطل:' : 'Disabled:'}</span>
              <span className="font-bold font-mono text-rose-300">{stockStats.disabled}</span>
            </div>

            {stockStats.duplicateCodes > 0 && (
              <div className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-1.5 ml-auto text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar'
                    ? `الأكواد المكررة: ${stockStats.duplicateCodes} — التفعيل يختار أول غير مستخدم`
                    : `Duplicate codes: ${stockStats.duplicateCodes} — first unused is activated`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            2. FIXED TABS BAR
            ==================================================================== */}
        <div className="stock-modal-tabs shrink-0 px-6 py-2 bg-[#0b0f19] border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'keys'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <KeyIcon className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الأكواد المتاحة' : 'Available Keys'}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {stockStats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'custom'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الحقول المخصصة' : 'Custom Fields'}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {customFields.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'ar' ? 'بيانات المنتج' : 'Product Details'}</span>
          </button>
        </div>

        {/* ====================================================================
            3. SCROLLABLE CONTENT BODY (ONLY THIS MOVES)
            ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* TAB 1: KEYS MANAGEMENT */}
          {activeTab === 'keys' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SECTION 1: ADD NEW KEYS */}
              <div className="stock-modal-add-panel rounded-xl border border-white/10 bg-[#0c121e]/80 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>{lang === 'ar' ? 'إضافة الأكواد للمخزون' : 'Add Keys to Stock'}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lang === 'ar'
                        ? 'أدخل أو الصق كود مفرد أو مجموعة أكواد (كود في كل سطر أو مفصولة بفواصل).'
                        : 'Enter single or multiple keys (one per line or comma-separated).'}
                    </p>
                  </div>

                  {/* Options row: duration */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Duration Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{lang === 'ar' ? 'المدة:' : 'Duration:'}</span>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value as KeyDuration)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#090d16] text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {KEY_DURATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    rows={5}
                    value={bulkInputText}
                    onChange={(e) => {
                      setBulkInputText(e.target.value);
                      setAddFeedback(null);
                    }}
                    placeholder={
                      lang === 'ar'
                        ? `أدخل الأكواد هنا...\nكود واحد في كل سطر أو مفصولة بفواصل\n\nمثال:\nKEY-ABC123\nKEY-XYZ456\nKEY-TEST789`
                        : `Enter keys here...\nOne key per line or comma-separated\n\nExample:\nKEY-ABC123\nKEY-XYZ456\nKEY-TEST789`
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all resize-y min-h-[110px]"
                    dir="ltr"
                    disabled={isSubmittingKeys}
                  />
                </div>

                {/* Live Client-Side Analysis Chip */}
                {parsedBulkAnalysis.totalEntered > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">
                        {parsedBulkAnalysis.totalEntered} {lang === 'ar' ? 'كود تم إدخالها' : 'keys entered'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span className="text-emerald-400 font-bold font-mono">
                        {parsedBulkAnalysis.cleanKeys.length} {lang === 'ar' ? 'جاهز للإضافة' : 'ready to add'}
                      </span>
                      {parsedBulkAnalysis.duplicates > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span className={allowDuplicates ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>
                            {parsedBulkAnalysis.duplicates} {lang === 'ar' ? (allowDuplicates ? 'مكرر (سيتم إضافته)' : 'مكرر (سيتم تخطيه)') : 'duplicate'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-[11px] font-bold">
                      <span className="text-emerald-400">
                        {lang === 'ar'
                          ? `✓ جاهز لإضافة ${parsedBulkAnalysis.cleanKeys.length} كود إلى المخزون.`
                          : `✓ Ready to add ${parsedBulkAnalysis.cleanKeys.length} keys to stock.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Feedback message if available */}
                {addFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                      addFeedback.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : addFeedback.type === 'error'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <span>{addFeedback.text}</span>
                    {addFeedback.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
                    {addFeedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                  </div>
                )}

                {/* Action button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleBulkAdd}
                    disabled={isSubmittingKeys || parsedBulkAnalysis.cleanKeys.length === 0}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isSubmittingKeys ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {lang === 'ar'
                            ? `إضافة الأكواد للمخزون (${parsedBulkAnalysis.cleanKeys.length})`
                            : `Add Keys to Stock (${parsedBulkAnalysis.cleanKeys.length})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION 2: CURRENT KEYS LIST */}
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute top-3 right-3 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'بحث بكود المفتاح، رقم الطلب، أو الحالة...'
                          : 'Search by key, order ID, or status...'
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#070a12] pr-9 pl-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filters */}
                    <div className="flex items-center rounded-xl border border-white/10 bg-[#070a12] p-0.5 text-xs font-semibold">
                      {[
                        { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                        { id: 'available', label: lang === 'ar' ? 'متاح' : 'Available' },
                        { id: 'activated_pending_start', label: lang === 'ar' ? 'بانتظار البدء' : 'Pending start' },
                        { id: 'active', label: lang === 'ar' ? 'نشط' : 'Active' },
                        { id: 'expired', label: lang === 'ar' ? 'منتهي' : 'Expired' },
                        { id: 'disabled', label: lang === 'ar' ? 'معطل' : 'Disabled' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setStatusFilter(item.id);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            statusFilter === item.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort Order */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-[#070a12] text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
                      <option value="oldest">{lang === 'ar' ? 'الأقدم' : 'Oldest'}</option>
                    </select>

                    {/* Page Size */}
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-[#070a12] text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Table / Cards Container */}
                <div className="rounded-xl border border-white/10 bg-[#0c121e]/80 overflow-hidden shadow-sm">
                  {isLoadingKeys ? (
                    /* Skeleton Loading State */
                    <div className="p-6 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-14 rounded-xl bg-white/[0.03] animate-pulse flex items-center justify-between px-4 border border-white/5"
                        />
                      ))}
                    </div>
                  ) : keys.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 px-4 space-y-3">
                      <KeyIcon className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-slate-300">
                        {lang === 'ar' ? 'لا توجد مفاتيح تطابق معايير البحث' : 'No keys match your criteria'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lang === 'ar'
                          ? 'يمكنك إضافة مفاتيح جديدة من النموذج أعلاه أو تعديل الفلترة.'
                          : 'You can add keys above or adjust your search filter.'}
                      </p>
                    </div>
                  ) : (
                    /* Table View (Responsive) */
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-[#070a12]/70 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">{lang === 'ar' ? 'المفتاح' : 'Key'}</th>
                            <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الإضافة' : 'Added At'}</th>
                            <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الاستخدام' : 'Used At'}</th>
                            <th className="py-3 px-4">{lang === 'ar' ? 'الطلب / العميل' : 'Order / Customer'}</th>
                            <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans">
                          {keys.map((item) => {
                            const isRevealed = revealedKeyIds.has(item.id);
                            const currentStatus: KeyStatus = item.status || (item.isUsed ? 'activated_pending_start' : item.isDisabled ? 'disabled' : 'available');

                            return (
                              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                {/* Key with Masking & Copy */}
                                <td className="py-3.5 px-4 font-mono text-slate-200">
                                  <div className="flex items-center gap-2" dir="ltr">
                                    <span className="font-bold select-all">
                                      {isRevealed ? item.key : maskKeyString(item.key)}
                                    </span>
                                    <button
                                      onClick={() => toggleKeyReveal(item.id)}
                                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                      title={isRevealed ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'إظهار' : 'Reveal')}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopyKey(item.key)}
                                      className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                                      title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy Key'}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                                {/* Status Badge */}
                                <td className="py-3.5 px-4">
                                  {currentStatus === 'available' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {lang === 'ar' ? 'متاح' : 'Available'}
                                    </span>
                                  )}
                                  {currentStatus === 'activated_pending_start' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      {lang === 'ar' ? 'مفعّل — بانتظار البدء' : 'Activated — pending start'}
                                    </span>
                                  )}
                                  {currentStatus === 'disabled' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                      {lang === 'ar' ? 'معطل' : 'Disabled'}
                                    </span>
                                  )}
                                  {(currentStatus === 'active' || currentStatus === 'expired') && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      {currentStatus === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'منتهي' : 'Expired')}
                                    </span>
                                  )}
                                </td>

                                {/* Created At */}
                                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                                </td>

                                {/* Used At */}
                                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                  {item.usedAt ? new Date(item.usedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                                </td>

                                {/* Order & Customer */}
                                <td className="py-3.5 px-4 text-slate-300">
                                  {item.orderId ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-mono text-blue-400 text-[11px]">#{item.orderId}</span>
                                      <span className="text-[10px] text-slate-400">{item.customerName || item.usedByUserName || item.customerId || '—'}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {/* Enable / Disable Button */}
                                    {currentStatus !== 'activated_pending_start' && currentStatus !== 'active' && currentStatus !== 'expired' && (
                                      <button
                                        onClick={() => handleToggleKeyStatus(item)}
                                        disabled={togglingKeyId === item.id}
                                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                          currentStatus === 'disabled'
                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                                        }`}
                                        title={
                                          currentStatus === 'disabled'
                                            ? (lang === 'ar' ? 'إعادة التفعيل' : 'Activate')
                                            : (lang === 'ar' ? 'تعطيل المفتاح' : 'Disable')
                                        }
                                      >
                                        {currentStatus === 'disabled' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                      </button>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => setDeletingKey(item)}
                                      className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                      title={lang === 'ar' ? 'حذف المفتاح' : 'Delete Key'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Footer Bar */}
                  <div className="p-3 border-t border-white/5 bg-[#070a12]/50 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      {lang === 'ar' ? 'إجمالي النتائج:' : 'Total Results:'}{' '}
                      <span className="font-bold text-white font-mono">{totalFilteredCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoadingKeys}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'السابق' : 'Previous'}
                      >
                        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </button>

                      <span className="font-mono px-2">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoadingKeys}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'التالي' : 'Next'}
                      >
                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM FIELDS */}
          {activeTab === 'custom' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>{lang === 'ar' ? 'الحقول والخصائص المخصصة' : 'Custom Product Fields'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تعديل أو إنشاء حقول بيانات إضافية للمنتج دون التأثير على التراخيص القديمة.'
                      : 'Create or adjust custom attributes safely without breaking customer licenses.'}
                  </p>
                </div>

                <button
                  onClick={() => setNewFieldModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إضافة حقل جديد' : 'Add New Field'}</span>
                </button>
              </div>

              {/* Custom Fields List */}
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-white/10 bg-[#0c121e]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{field.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400">
                          {field.key}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            *{lang === 'ar' ? 'إجباري' : 'Required'}
                          </span>
                        )}
                      </div>

                      {/* Input based on type */}
                      <div className="pt-2">
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            value={field.value || ''}
                            onChange={(e) => handleCustomFieldValueChange(field.id, e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[#070a12] p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        ) : field.type === 'boolean' ? (
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(field.value)}
                              onChange={(e) => handleCustomFieldValueChange(field.id, e.target.checked)}
                              className="rounded border-white/10 bg-[#070a12] text-blue-600 focus:ring-0"
                            />
                            <span>{field.name}</span>
                          </label>
                        ) : field.type === 'select' ? (
                          <select
                            value={field.value || ''}
                            onChange={(e) => handleCustomFieldValueChange(field.id, e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[#070a12] p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">{lang === 'ar' ? 'اختر قيمة...' : 'Select value...'}</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={field.value || ''}
                            onChange={(e) => handleCustomFieldValueChange(field.id, e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[#070a12] p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Order & Delete actions */}
                    <div className="flex sm:flex-col items-center gap-1 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCustomField(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title={lang === 'ar' ? 'تحريك لأعلى' : 'Move up'}
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveCustomField(index, 'down')}
                          disabled={index === customFields.length - 1}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title={lang === 'ar' ? 'تحريك لأسفل' : 'Move down'}
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'حذف الحقل' : 'Delete field'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>{lang === 'ar' ? 'بيانات المنتج الأساسية' : 'Core Product Details'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'المعلومات الهامة فقط المرتبطة بنوع المخزون والـ SKU وحالة العرض.'
                    : 'Vital properties relating to digital keys stock and catalog state.'}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-200">{lang === 'ar' ? 'صورة المنتج' : 'Product Image'}</label>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">{lang === 'ar' ? 'ألصق رابط الصورة أو اختر صورة من جهازك، وستظهر المعاينة فوراً.' : 'Paste an image URL or choose a file; the preview updates instantly.'}</p>
                  </div>
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <img src={productFormData.image || '/logo.png'} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = '/logo.png'; }} />
                  </div>
                </div>
                <input
                  type="url"
                  value={productFormData.image}
                  onChange={(event) => { setProductFormData({ ...productFormData, image: event.target.value }); setHasUnsavedChanges(true); }}
                  placeholder={lang === 'ar' ? 'https://... أو /products/image.png' : 'https://... or /products/image.png'}
                  className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.09]">
                  <span>{lang === 'ar' ? 'اختيار صورة من الجهاز' : 'Choose image file'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error(lang === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 2 ميغابايت.' : 'Image size must not exceed 2 MB.');
                        event.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProductFormData((current) => ({ ...current, image: String(reader.result || '') }));
                        setHasUnsavedChanges(true);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'اسم المنتج' : 'Product Name'}
                  </label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, name: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'رمز التخزين التعريفي (SKU)' : 'Product SKU'}
                  </label>
                  <input
                    type="text"
                    value={productFormData.sku}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, sku: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Stock Type & Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'نوع المخزون' : 'Stock Type'}
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-blue-400 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'مفاتيح رقمية (Digital Keys)' : 'Digital Keys'}</span>
                    <KeyIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'حالة المنتج' : 'Product Status'}
                  </label>
                  <select
                    value={productFormData.isDisabled ? 'disabled' : 'active'}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, isDisabled: e.target.value === 'disabled' });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">{lang === 'ar' ? 'نشط في المتجر' : 'Active in Store'}</option>
                    <option value="disabled">{lang === 'ar' ? 'معطل / غير متاح' : 'Disabled / Suspended'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{lang === 'ar' ? 'ظهور المنتج في المتجر' : 'Store Visibility'}</label>
                  <select
                    value={productFormData.isVisible ? 'visible' : 'hidden'}
                    onChange={(event) => { setProductFormData({ ...productFormData, isVisible: event.target.value === 'visible' }); setHasUnsavedChanges(true); }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="visible">{lang === 'ar' ? 'ظاهر للعملاء' : 'Visible to customers'}</option>
                    <option value="hidden">{lang === 'ar' ? 'مخفي من المتجر' : 'Hidden from store'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{lang === 'ar' ? 'ترتيب العرض' : 'Display Order'}</label>
                  <input
                    type="number"
                    min="0"
                    value={productFormData.displayOrder}
                    onChange={(event) => { setProductFormData({ ...productFormData, displayOrder: Math.max(0, Number(event.target.value) || 0) }); setHasUnsavedChanges(true); }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Version & File Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'الإصدار (Version)' : 'Version'}
                  </label>
                  <input
                    type="text"
                    value={productFormData.version}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, version: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'حجم الملف (File Size)' : 'File Size'}
                  </label>
                  <input
                    type="text"
                    value={productFormData.fileSize}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, fileSize: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Total Downloads / Sales */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'المبيعات / مرات التحميل' : 'Total Downloads / Sales'}
                  </label>
                  <input
                    type="number"
                    value={productFormData.downloadsCount}
                    onChange={(e) => {
                      setProductFormData({ ...productFormData, downloadsCount: Number(e.target.value) });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Last Updated */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono text-slate-400">
                    {product.updatedAt ? new Date(product.updatedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'ar' ? 'الوصف الشامل للمنتج' : 'Product Description'}
                </label>
                <textarea
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) => {
                    setProductFormData({ ...productFormData, description: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#070a12] p-3.5 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            4. STICKY FOOTER (ALWAYS VISIBLE AT BOTTOM)
            ==================================================================== */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-[#0d1424] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAttemptClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            {saveSuccessNotice && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{saveSuccessNotice}</span>
              </span>
            )}
          </div>

          <button
            onClick={handleSaveProduct}
            disabled={!hasUnsavedChanges || isSavingProduct}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isSavingProduct ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'Saving... جارٍ الحفظ' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ التغييرات (Ctrl+S)' : 'Save Changes (Ctrl+S)'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ====================================================================
          CONFIRMATION MODAL: DELETE KEY
          ==================================================================== */}
      <AnimatePresence>
        {deletingKey && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl border border-rose-500/20 bg-[#0f172a] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'تأكيد حذف المفتاح' : 'Confirm Key Deletion'}
                </h3>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  {lang === 'ar' ? 'هل أنت متأكد من حذف هذا المفتاح من المخزون؟' : 'Are you sure you want to delete this key?'}
                </p>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-center text-blue-400 font-bold select-all" dir="ltr">
                  {deletingKey.key}
                </div>
                {deletingKey.isUsed || deletingKey.status === 'activated_pending_start' || deletingKey.status === 'active' || deletingKey.status === 'expired' ? (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold text-[11px]">
                    {lang === 'ar'
                      ? 'ملاحظة هامة: هذا المفتاح مستخدم في طلب عميل، ولن يُحذف نهائياً بل سيتم تعطيله (Disabled) للحفاظ على سلامة سجلات المبيعات والعميل.'
                      : 'Notice: This key has been redeemed in an order. It will be set to Disabled instead of deleted to protect order audit integrity.'}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingKey(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleExecuteDeleteKey}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : (lang === 'ar' ? 'نعم، تابع الإجراء' : 'Yes, Proceed')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          CONFIRMATION MODAL: UNSAVED CHANGES EXIT GUARD
          ==================================================================== */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl border border-amber-500/25 bg-[#0f172a] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'تغييرات غير محفوظة' : 'Unsaved Changes'}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? 'لديك تغييرات غير محفوظة. هل تريد الخروج بدون حفظ؟'
                  : 'You have unsaved changes. Do you want to discard them and exit?'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'متابعة التعديل' : 'Keep Editing'}
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setHasUnsavedChanges(false);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'تجاهل التغييرات والخروج' : 'Discard & Exit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MODAL: ADD NEW CUSTOM FIELD
          ==================================================================== */}
      <AnimatePresence>
        {newFieldModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>{lang === 'ar' ? 'إضافة حقل مخصص جديد' : 'Add New Custom Field'}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'ar' ? 'اسم الحقل الظاهر' : 'Field Label'}
                  </label>
                  <input
                    type="text"
                    value={newFieldData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewFieldData({ ...newFieldData, name, key: newFieldData.key || key });
                    }}
                    placeholder={lang === 'ar' ? 'مثال: رابط الديسكورد الإضافي' : 'e.g. Extra Support Link'}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'ar' ? 'معرف الحقل البرمجي (Key)' : 'Field Key'}
                  </label>
                  <input
                    type="text"
                    value={newFieldData.key}
                    onChange={(e) => setNewFieldData({ ...newFieldData, key: e.target.value })}
                    placeholder="e.g. extra_support_link"
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {lang === 'ar' ? 'نوع الحقل' : 'Field Type'}
                  </label>
                  <select
                    value={newFieldData.type}
                    onChange={(e) => setNewFieldData({ ...newFieldData, type: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-[#070a12] p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="text">Text (نص قصير)</option>
                    <option value="number">Number (رقم)</option>
                    <option value="select">Select (قائمة اختيار)</option>
                    <option value="textarea">Textarea (نص متعدد الأسطر)</option>
                    <option value="boolean">Boolean (نعم / لا)</option>
                  </select>
                </div>

                {newFieldData.type === 'select' && (
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      {lang === 'ar' ? 'الخيارات (مفصولة بفاصلة)' : 'Options (comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={newFieldData.options}
                      onChange={(e) => setNewFieldData({ ...newFieldData, options: e.target.value })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full rounded-xl border border-white/10 bg-[#070a12] p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newFieldReq"
                    checked={newFieldData.required}
                    onChange={(e) => setNewFieldData({ ...newFieldData, required: e.target.checked })}
                    className="rounded border-white/10 bg-[#070a12] text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="newFieldReq" className="text-xs text-slate-300 cursor-pointer select-none">
                    {lang === 'ar' ? 'حقل إجباري' : 'Required Field'}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setNewFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleAddCustomField}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إضافة الحقل' : 'Add Field'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
