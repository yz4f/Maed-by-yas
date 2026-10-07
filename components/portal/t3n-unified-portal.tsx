'use client';

import { GuideArticleView, GuideCard, GuideDialog, GuideVideo } from '@/components/guides/guide-ui';
import { articlesForProduct } from '@/lib/guide-library';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ActivationSuccessState } from '@/components/portal/ActivationSuccessState';
import { useSession, signOut } from 'next-auth/react';
import {
  Shield,
  Key,
  Download,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Play,
  Users,
  Package,
  Activity,
  Layers,
  Sparkles,
  Plus,
  Search,
  UserCheck,
  UserX,
  FileText,
  HelpCircle,
  Clock,
  Laptop,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Bot,
  Edit3,
  Save,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  User,
  Globe,
  AlertTriangle,
  Info,
  Unlock,
  Hash,
  Megaphone,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditEvent, Product, UserProduct, SystemLog, Key as KeyType, User as UserType, KeyDuration } from '@/types';
import { durationLabel, KEY_DURATION_OPTIONS } from '@/lib/license-duration';
import { DashboardLayout } from './DashboardLayout';
import { PortalNavigation, type PortalTab } from './portal-navigation';
import { DiscordMark as DiscordIcon } from './discord-mark';
import { LoginPage } from './login-page';
import { Footer } from '@/components/ui/footer';
import { ProductNotice } from '@/components/guides/product-notice';
const HelpCenter = dynamic(() => import('./help-center').then((module) => module.HelpCenter), { ssr: false });
const HelpAdminSection = dynamic(() => import('./help-admin-section').then((module) => module.HelpAdminSection), { ssr: false });
const SiteUpdatesAdmin = dynamic(() => import('./site-updates-admin').then((module) => module.SiteUpdatesAdmin), { ssr: false });
const ResetKeyRequestsAdmin = dynamic(() => import('./reset-key-requests-admin').then((module) => module.ResetKeyRequestsAdmin), { ssr: false });
const SitePresenceAdmin = dynamic(() => import('./site-presence-admin').then((module) => module.SitePresenceAdmin), { ssr: false });
const loadProductStockModal = () => import('@/components/admin/stock/ProductStockModal').then((module) => module.ProductStockModal);
const ProductStockModal = dynamic(loadProductStockModal, { ssr: false });
import { ToastContainer } from '@/components/ui/toast';
import { toast as centralToast } from '@/lib/toast';

const DIRECT_TUTORIAL_VIDEO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/mHiKjOdRBJBDsCnu.mp4';

interface T3NUnifiedPortalProps {
  initialProducts: Product[];
}



export function T3NUnifiedPortal({ initialProducts }: T3NUnifiedPortalProps) {
  const { data: session, status } = useSession();
  const sessionUserId = (session?.user as any)?.discordId as string | undefined;

  useEffect(() => {
    if (!sessionUserId) return;
    let requestInFlight = false;
    const heartbeat = () => {
      if (document.visibilityState !== 'visible' || requestInFlight) return;
      requestInFlight = true;
      void fetch('/api/presence', { method: 'POST', credentials: 'same-origin' })
        .catch(() => undefined)
        .finally(() => { requestInFlight = false; });
    };
    heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    window.addEventListener('focus', heartbeat);
    document.addEventListener('visibilitychange', heartbeat);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', heartbeat);
      document.removeEventListener('visibilitychange', heartbeat);
    };
  }, [sessionUserId]);

  // Helper to split brand names to prevent browser translation tools from altering them to EON
  const renderBrandText = (text: string) => {
    return (
      <span className="notranslate" translate="no">
        {text}
      </span>
    );
  };

  // Helper to get exact user-provided product image
  const getProductImage = (product?: Partial<Product> | null): string => {
    if (!product) return '/logo.png';
    if (product.image && product.image !== '/logo.png?v=6' && product.image !== '/logo.png' && product.image !== '') {
      return product.image;
    }
    const name = (product.name || '').toLowerCase();
    if (name.includes('فورت') || name.includes('fortnite') || name.includes('فك باند')) {
      return '/fortnite-unban-logo.png';
    }
    if (name.includes('سبوفر') || name.includes('spoofer')) {
      return '/spoofer-logo.png';
    }
    return '/logo.png';
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  } | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const askConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>, onCancel?: () => void) => {
    setConfirmSubmitting(false);
    setConfirmModal({ isOpen: true, title, message, onConfirm, onCancel });
  };

  const dismissConfirm = () => {
    if (confirmSubmitting) return;
    confirmModal?.onCancel?.();
    setConfirmModal(null);
  };

  const submitConfirm = async () => {
    if (!confirmModal || confirmSubmitting) return;
    setConfirmSubmitting(true);
    try {
      await confirmModal.onConfirm();
      setConfirmModal(null);
    } finally {
      setConfirmSubmitting(false);
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('self-delivery.theme');
    const savedLanguage = window.localStorage.getItem('self-delivery.language');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    if (savedLanguage === 'ar' || savedLanguage === 'en') setLang(savedLanguage);
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'tickets' || tabParam === 'overview' || tabParam === 'my-products' || tabParam === 'redeem' || tabParam === 'profile' || tabParam === 'admin') {
      setActiveTab(tabParam as PortalTab);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('self-delivery.theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('self-delivery.language', lang);
  }, [lang]);

  // Demo Local Authentication for instant local testing
  const [demoUser, setDemoUser] = useState<UserType | null>(null);

  // Dynamic Products State (Firestore-synced)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const dbProductsRequestInFlightRef = useRef(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const loadDbProducts = async (): Promise<boolean> => {
    if (dbProductsRequestInFlightRef.current) return true;
    dbProductsRequestInFlightRef.current = true;
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (!res.ok || !data.success || !data.products) return false;
      const nextProducts = data.products as Product[];
      setProducts((current) => JSON.stringify(current) === JSON.stringify(nextProducts) ? current : nextProducts);
      return true;
    } catch (error) {
      console.error('Failed to load db products:', error);
      return false;
    } finally {
      dbProductsRequestInFlightRef.current = false;
    }
  };

  // User Products State
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [userActivity, setUserActivity] = useState<AuditEvent[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showExpiredLicenses, setShowExpiredLicenses] = useState(false);
  const [newUserWelcome, setNewUserWelcome] = useState<{ name: string } | null>(null);
  const userProductsRequestInFlightRef = useRef(false);
  const userProductsRevisionRef = useRef('');
  const [licenseClock, setLicenseClock] = useState(() => Date.now());

  useEffect(() => {
    if (activeTab !== 'my-products') return;
    const refreshLicenseClock = () => setLicenseClock(Date.now());
    refreshLicenseClock();
    const timer = window.setInterval(refreshLicenseClock, 30_000);
    return () => window.clearInterval(timer);
  }, [activeTab]);


  // Key Redemption State
  const [keyInput, setKeyInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<{ duration: '3 Days' | 'Lifetime'; productName?: string; closing?: boolean } | null>(null);

  // Copy Key Feedback State
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [updatingProductIds, setUpdatingProductIds] = useState<Set<string>>(() => new Set());

  // Guest Key Activation Modal State (Screenshot 2 "Buy / Activate license first")
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Guide Modal States
  const [guideView, setGuideView] = useState<'notice' | 'video' | 'format' | 'issues' | 'wrp' | null>(null);
  const [guideModalProduct, setGuideModalProduct] = useState<UserProduct | null>(null);
  const [guideFlashVersion, setGuideFlashVersion] = useState<'win11' | 'win10' | null>(null);
  const [guideIssueId, setGuideIssueId] = useState<string | null>(null);
  const [openingGuideProductId, setOpeningGuideProductId] = useState<string | null>(null);
  const [resetRequestProduct, setResetRequestProduct] = useState<UserProduct | null>(null);
  const [resetRequestReason, setResetRequestReason] = useState('');
  const [isSubmittingResetRequest, setIsSubmittingResetRequest] = useState(false);
  const [resetCompletionNotice, setResetCompletionNotice] = useState<{ id: string; title: string; message: string } | null>(null);
  const [isAcknowledgingResetCompletion, setIsAcknowledgingResetCompletion] = useState(false);


  const guideTitle = lang === 'ar'
    ? `شرح ${guideModalProduct?.product?.name || 'المنتج'}`
    : `${guideModalProduct?.product?.name || 'Product'} guide`;
  const guideIssues = articlesForProduct(guideModalProduct?.product).filter(article => article.stage === 6);
  const selectedGuideIssue = guideIssues.find(article => article.id === guideIssueId);
  // Admin Panel States
  const [adminStats, setAdminStats] = useState<any>(null);
  const adminStatsRequestInFlightRef = useRef(false);
  const adminCustomersRequestInFlightRef = useRef(false);
  const adminKeysRequestInFlightRef = useRef(false);
  const [isAdminRefreshing, setIsAdminRefreshing] = useState(false);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);
  const [bulkProductId, setBulkProductId] = useState<string>(initialProducts[0]?.id || '');
  const [bulkKeysText, setBulkKeysText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [adminLogs, setAdminLogs] = useState<SystemLog[]>([]);
  const [adminLogQuery, setAdminLogQuery] = useState('');
  const [adminLogAction, setAdminLogAction] = useState('all');

  // Inventory Modal States
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryInitialTab, setInventoryInitialTab] = useState<'keys' | 'custom' | 'details'>('keys');
  const [inventoryKeys, setInventoryKeys] = useState<KeyType[]>([]);
  const [inventoryStock, setInventoryStock] = useState({ total: 0, available: 0, used: 0, disabled: 0, archived: 0, duplicateCodes: 0 });
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [singleAddOpen, setSingleAddOpen] = useState(false);
  const [singleKeyText, setSingleKeyText] = useState('');
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [isAddingSingleKey, setIsAddingSingleKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [inventoryKeyDuration, setInventoryKeyDuration] = useState<KeyDuration>('3 Days');

  // Extended Inventory Editing States
  const [editProductData, setEditProductData] = useState<{
    name: string;
    description: string;
    version: string;
    fileSize: string;
    category: string;
    downloadsCount: number;
    image: string;
    videoUrl: string;
    guideUrl: string;
    fileUrl: string;
    cardColor: string;
  }>({
    name: '',
    description: '',
    version: '',
    fileSize: '',
    category: '',
    downloadsCount: 0,
    image: '',
    videoUrl: '',
    guideUrl: '',
    fileUrl: '',
    cardColor: 'blue',
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveMessage, setProductSaveMessage] = useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingKeyText, setEditingKeyText] = useState<string>('');
  const [keyActionMessage, setKeyActionMessage] = useState<string | null>(null);

  // Language State: 'ar' or 'en'
  // Central Toast Helper Wrapper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    centralToast.show({ message, type });
  };

  // Translations Object
  const t = {
    ar: {
      siteTitle: 'تسليم ذاتي',
      loginSubtitle: 'المنصة الاحترافية الأولى لفك حظر الألعاب والتجربة الآمنة',
      continueDiscord: 'تسجيل الدخول عبر ديسكورد',
      loginYaser: 'دخول كـ YASER',
      loginAdmin: 'دخول الأدمن',
      newHere: 'عضو جديد؟',
      redeemLicense: 'تفعيل مفتاح جديد',
      copyright: '© 2026 جميع الحقوق محفوظة لمنصة تعن',
      overview: 'النظرة العامة',
      myProducts: 'منتجاتي',
      redeemKey: 'تفعيل مفتاح',
      adminControl: 'لوحة الإدارة',
      logout: 'تسجيل الخروج',
      productsTab: 'قسم المنتجات والمخزون',
      customersTab: 'قسم العملاء والاشتراكات',
      keysTab: 'البحث عن المفاتيح',
      logsTab: 'سجلات الأمان والنشاط',
      statsTab: 'النظرة العامة والإحصائيات',
      download: 'تحميل الملف',
      copyKey: 'نسخ الكود',
      active: 'مفعل',
      expired: 'منتهي',
      searchCustomer: 'ابحث باسم العميل أو إيميله أو Discord ID...',
      searchKeys: 'ابحث بكود المفتاح...',
    },
    en: {
      siteTitle: 'SELF DELIVERY',
      loginSubtitle: 'The Premier Gaming Unban & Protection Platform',
      continueDiscord: 'Continue with Discord',
      loginYaser: 'Login as YASER',
      loginAdmin: 'Admin Login',
      newHere: 'New here?',
      redeemLicense: 'Activate License Key',
      copyright: '© 2026 TA3N Platform. All rights reserved.',
      overview: 'Overview',
      myProducts: 'My Products',
      redeemKey: 'Redeem Key',
      adminControl: 'Admin Control',
      logout: 'Logout',
      productsTab: 'Products & Stock',
      customersTab: 'Customers',
      keysTab: 'Search Keys',
      logsTab: 'Audit Logs',
      statsTab: 'Statistics & Overview',
      download: 'Download File',
      copyKey: 'Copy Key',
      active: 'Active',
      expired: 'Expired',
      searchCustomer: 'Search customer name, email or Discord ID...',
      searchKeys: 'Search license key...',
    }
  }[lang];

  // Admin Categorized Dashboard Sub-Tabs
  const [adminSectionTab, setAdminSectionTab] = useState<'overview' | 'products' | 'customers' | 'sitePresence' | 'help' | 'updates' | 'resetRequests' | 'keys' | 'logs'>('overview');
  const [allCustomersList, setAllCustomersList] = useState<any[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState<any | null>(null);
  const [selectedCustomerProducts, setSelectedCustomerProducts] = useState<any[]>([]);
  const [selectedProductToGrant, setSelectedProductToGrant] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banTypeInput, setBanTypeInput] = useState<'temporary' | 'permanent'>('permanent');
  const [banExpiresAtInput, setBanExpiresAtInput] = useState('');
  const [warningMessageInput, setWarningMessageInput] = useState('');
  const [discordDirectMessageInput, setDiscordDirectMessageInput] = useState('');
  const [isProcessingAdminAction, setIsProcessingAdminAction] = useState(false);
  const [allKeysList, setAllKeysList] = useState<KeyType[]>([]);
  const [searchKeysQuery, setSearchKeysQuery] = useState('');
  const [keyStatusFilter, setKeyStatusFilter] = useState<'all' | 'unused' | 'used'>('all');

  // Current active user (either NextAuth session or Demo User)
  const currentUser = React.useMemo<UserType | null>(() => {
    if (demoUser) return demoUser;
    if (session?.user) {
      return {
        id: (session.user as any).id || (session.user as any).discordId || 'user-discord-active',
        discordId: (session.user as any).discordId || '1396965033316978839',
        name: session.user.name || 'T3N User',
        email: session.user.email || 'user@t3n-store.com',
        image: session.user.image || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role: ((session.user as any).role || 'Customer') as 'Boss' | 'Co-Boss' | 'Admin' | 'Customer',
        discordRoles: [],
        createdAt: new Date().toISOString()
      } as UserType;
    }
    return null;
  }, [demoUser, session?.user]);

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'Boss' || currentUser?.role === 'Co-Boss' || currentUser?.role === 'Admin' || currentUser?.email === 'boss@t3n-store.com';

  useEffect(() => {
    if (activeTab !== 'my-products' || !currentUser) return;
    let active = true;
    const loadResetCompletion = async () => {
      try {
        const response = await fetch('/api/ai?view=notifications', { credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !active) return;
        const next = (Array.isArray(data.notifications) ? data.notifications : []).find((item: any) => item.type === 'RESET_COMPLETED' && !item.seenAt) || null;
        setResetCompletionNotice((current) => current?.id === next?.id ? current : next);
      } catch {
        // A reset completion notice is non-blocking and will be retried on the next visit.
      }
    };
    void loadResetCompletion();
    return () => { active = false; };
  }, [activeTab, currentUser?.id]);
  const getLicenseTiming = (license: UserProduct) => {
    const parsedExpiry = license.expiresAt ? new Date(license.expiresAt).getTime() : Number.NaN;
    const hasValidExpiry = Number.isFinite(parsedExpiry) && parsedExpiry > 0;
    const isPendingStart = license.status === 'Active' && !license.startedAt;
    const isLifetime = Boolean(license.startedAt) && !license.expiresAt;
    const expiresAtMs = hasValidExpiry ? parsedExpiry : 0;
    const remainingMs = hasValidExpiry ? Math.max(0, expiresAtMs - licenseClock) : 0;
    const isExpired = !isLifetime && hasValidExpiry && remainingMs === 0;
    const isUsable = license.status === 'Active' && (isPendingStart || isLifetime || (hasValidExpiry && remainingMs > 0));
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const countdown = isPendingStart
      ? (lang === 'ar' ? 'تبدأ عند فتح دليل المنتج' : 'Starts when the guide is opened')
      : isLifetime
      ? (lang === 'ar' ? 'مدى الحياة' : 'Lifetime')
      : lang === 'ar'
        ? `${days}ي ${hours}س ${minutes}د`
        : `${days}d ${hours}h ${minutes}m`;
    return { expiresAtMs, remainingMs, isExpired, isUsable, countdown, isLifetime, isPendingStart };
  };
  const activeProductCount = userProducts.filter((product) => getLicenseTiming(product).isUsable).length;
  const availableProductCount = userProducts.filter((product) => !product.product?.isDisabled && !product.product?.isArchived && !getLicenseTiming(product).isExpired).length;

  useEffect(() => {
    if (!resetRequestProduct) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingResetRequest) {
        setResetRequestProduct(null);
        setResetRequestReason('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetRequestProduct, isSubmittingResetRequest]);
  const sortedUserProducts = [...userProducts].sort((a, b) => {
    const aTiming = getLicenseTiming(a);
    const bTiming = getLicenseTiming(b);
    const aPriority = aTiming.isUsable ? 0 : aTiming.isExpired ? 2 : 1;
    const bPriority = bTiming.isUsable ? 0 : bTiming.isExpired ? 2 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aActivatedAt = new Date(a.activatedAt || 0).getTime() || 0;
    const bActivatedAt = new Date(b.activatedAt || 0).getTime() || 0;
    return bActivatedAt - aActivatedAt;
  });
  const activeLicenses = sortedUserProducts.filter((product) => getLicenseTiming(product).isUsable);
  const inactiveLicenses = sortedUserProducts.filter((product) => !getLicenseTiming(product).isUsable);
  const groupedUserProducts = [...activeLicenses, ...inactiveLicenses];
  const memberSince = React.useMemo(() => {
    if (!currentUser?.createdAt) return '—';
    const joined = new Date(currentUser.createdAt);
    if (Number.isNaN(joined.getTime())) return '—';
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }).format(joined);
  }, [currentUser?.createdAt, lang]);

  // Keep the portal responsive: load customer data once, then fetch each heavy admin section only when opened.
  useEffect(() => {
    if (!currentUser?.id) return;
    void loadUserProducts();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const syncVisiblePage = () => {
      if (document.visibilityState === 'visible') void loadUserProducts(true);
    };
    const interval = window.setInterval(syncVisiblePage, 20_000);
    window.addEventListener('focus', syncVisiblePage);
    document.addEventListener('visibilitychange', syncVisiblePage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncVisiblePage);
      document.removeEventListener('visibilitychange', syncVisiblePage);
    };
  }, [currentUser?.id, activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab !== 'admin' || !isAdmin) return;
    if (adminSectionTab === 'overview' || adminSectionTab === 'logs') void loadAdminStats();
    if (adminSectionTab === 'products') {
      void loadProductStockModal();
      void loadDbProducts();
      void loadAdminStats();
    }
    if (adminSectionTab === 'customers') void loadAdminCustomersList();
    if (adminSectionTab === 'keys') void loadAllKeysList();
  }, [activeTab, adminSectionTab, isAdmin]);

  useEffect(() => {
    if (activeTab !== 'admin' || !isAdmin || adminSectionTab !== 'logs') return;
    const timer = window.setInterval(() => { void loadAdminStats(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [activeTab, adminSectionTab, isAdmin]);

  const loadUserProducts = async (silent = false): Promise<void> => {
    if (!currentUser || userProductsRequestInFlightRef.current) return;
    userProductsRequestInFlightRef.current = true;
    if (!silent) setIsLoadingProducts(true);
    try {
      const res = await fetch(silent ? '/api/user/products?sync=1' : '/api/user/products', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: silent && userProductsRevisionRef.current ? { 'X-Sync-Revision': userProductsRevisionRef.current } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.unchanged) return;
        if (typeof data.revision === 'string') userProductsRevisionRef.current = data.revision;
        const nextProducts = Array.isArray(data.products) ? data.products as UserProduct[] : [];
        setUserProducts((current) => JSON.stringify(current) === JSON.stringify(nextProducts) ? current : nextProducts);
        if (Array.isArray(data.activity)) {
          const nextActivity = data.activity as AuditEvent[];
          setUserActivity((current) => JSON.stringify(current) === JSON.stringify(nextActivity) ? current : nextActivity);
        }
        if (Array.isArray(data.catalog) && !(isAdmin && activeTab === 'admin')) {
          const nextCatalog = data.catalog as Product[];
          setProducts((current) => JSON.stringify(current) === JSON.stringify(nextCatalog) ? current : nextCatalog);
        }
        setGuideModalProduct(current => current ? nextProducts.find(item => item.id === current.id) || current : null);
        if (data.isNewUser && !sessionStorage.getItem('t3n-new-user-welcome-shown')) {
          sessionStorage.setItem('t3n-new-user-welcome-shown', '1');
          setNewUserWelcome({ name: data.user?.name || currentUser.name });
        }
      }
    } catch (e) {
      console.error('Failed to load user products:', e);
    } finally {
      userProductsRequestInFlightRef.current = false;
      if (!silent) setIsLoadingProducts(false);
    }
  };

  const updateUserProductStatus = async (userProduct: UserProduct, nextStatus: 'Active' | 'Inactive') => {
    if (userProduct.status === nextStatus || updatingProductIds.has(userProduct.id)) return;

    const previousStatus = userProduct.status;
    setUpdatingProductIds((current) => new Set(current).add(userProduct.id));
    setUserProducts((current) => current.map((item) => (
      item.id === userProduct.id ? { ...item, status: nextStatus } : item
    )));

    try {
      const response = await fetch(`/api/user/products/${encodeURIComponent(userProduct.productId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'تعذر حفظ حالة المنتج.');
      }

      setUserProducts((current) => current.map((item) => (
        item.id === userProduct.id ? { ...item, status: data.status } : item
      )));
      showToast(
        nextStatus === 'Active'
          ? (lang === 'ar' ? 'تم تفعيل المنتج' : 'Product Activated')
          : (lang === 'ar' ? 'المنتج غير مفعل' : 'Product Inactive'),
        'success',
      );
    } catch (error) {
      setUserProducts((current) => current.map((item) => (
        item.id === userProduct.id ? { ...item, status: previousStatus } : item
      )));
      showToast(
        lang === 'ar' ? 'تعذر حفظ التغيير. تمت استعادة الحالة السابقة.' : 'Could not save the change. The previous status was restored.',
        'error',
      );
    } finally {
      setUpdatingProductIds((current) => {
        const next = new Set(current);
        next.delete(userProduct.id);
        return next;
      });
    }
  };

  const loadAdminStats = async (): Promise<boolean> => {
    if (adminStatsRequestInFlightRef.current) return true;
    adminStatsRequestInFlightRef.current = true;
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) return false;
      const nextStats = data.success && data.stats ? data.stats : (data.stats || data.recentLogs ? data.stats || data : null);
      const nextLogs = data.success && data.stats ? data.stats.recentLogs || [] : data.stats?.recentLogs || data.recentLogs || [];
      if (!nextStats) return false;
      setAdminStats((current: any) => JSON.stringify(current) === JSON.stringify(nextStats) ? current : nextStats);
      setAdminLogs((current) => JSON.stringify(current) === JSON.stringify(nextLogs) ? current : nextLogs);
      return true;
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      return false;
    } finally {
      adminStatsRequestInFlightRef.current = false;
    }
  };

  const loadAdminCustomersList = async (): Promise<boolean> => {
    if (adminCustomersRequestInFlightRef.current) return true;
    adminCustomersRequestInFlightRef.current = true;
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (!res.ok || !data.success && !Array.isArray(data.users)) return false;
      const nextCustomers = Array.isArray(data.users) ? data.users : [];
      setAllCustomersList((current) => JSON.stringify(current) === JSON.stringify(nextCustomers) ? current : nextCustomers);
      return true;
    } catch (error) {
      console.error('Failed to load customers:', error);
      return false;
    } finally {
      adminCustomersRequestInFlightRef.current = false;
    }
  };

  const openCustomerModal = async (customer: any) => {
    setSelectedAdminCustomer(customer);
    setSelectedCustomerProducts([]);
    setDiscordDirectMessageInput('');
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setSelectedAdminCustomer(data.user);
        }
        if (data.products) {
          setSelectedCustomerProducts(data.products);
        }
      }
    } catch (e) {
      console.error("Failed to load customer details:", e);
    }
  };

  const loadAllKeysList = async (): Promise<boolean> => {
    if (adminKeysRequestInFlightRef.current) return true;
    adminKeysRequestInFlightRef.current = true;
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (!res.ok || !data.success) return false;
      const nextKeys = Array.isArray(data.keys) ? data.keys as KeyType[] : [];
      setAllKeysList((current) => JSON.stringify(current) === JSON.stringify(nextKeys) ? current : nextKeys);
      return true;
    } catch (error) {
      console.error('Failed to load keys:', error);
      return false;
    } finally {
      adminKeysRequestInFlightRef.current = false;
    }
  };

  const refreshAdminPanel = async () => {
    if (!isAdmin || isAdminRefreshing) return;
    setIsAdminRefreshing(true);
    setAdminLoadError(null);
    try {
      const requests: Promise<boolean>[] = [];
      if (adminSectionTab === 'overview' || adminSectionTab === 'logs') requests.push(loadAdminStats());
      if (adminSectionTab === 'products') {
        requests.push(loadDbProducts());
        requests.push(loadAdminStats());
      }
      if (adminSectionTab === 'customers') requests.push(loadAdminCustomersList());
      if (adminSectionTab === 'keys') requests.push(loadAllKeysList());
      if (requests.length === 0) return;
      const results = await Promise.all(requests);
      if (results.some((result) => !result)) throw new Error('refresh-failed');
    } catch (error) {
      const message = lang === 'ar' ? 'تعذر تحديث هذه القائمة. تحقق من الاتصال ثم حاول مجدداً.' : 'Could not refresh this section. Check your connection and try again.';
      setAdminLoadError(message);
      showToast(message, 'error');
    } finally {
      setIsAdminRefreshing(false);
    }
  };

  const handleRevokeUserProduct = async (userId: string, productId: string) => {
    askConfirm(
      lang === 'ar' ? 'سحب المنتج من العميل' : 'Revoke Product from Customer',
      lang === 'ar' ? 'هل أنت متأكد من سحب هذا المنتج من حساب المشترك؟' : 'Are you sure you want to revoke this product from the subscriber\'s account?',
      async () => {
        try {
          const res = await fetch('/api/admin/customers/manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'remove_product',
              userId,
              productId,
              adminName: currentUser?.name || 'Admin',
              adminId: currentUser?.id || 'admin-system'
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast('License restored!', 'success');
            if (selectedAdminCustomer && selectedAdminCustomer.id === userId) {
              const detailRes = await fetch(`/api/admin/customers/${userId}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                setSelectedAdminCustomer(detailData.user || detailData);
              }
            }
            loadAdminCustomersList();
            loadAdminStats();
          } else {
            showToast(data.message || (lang === 'ar' ? 'فشل استرجاع المنتج.' : 'Failed to restore product.'), 'error');
          }
        } catch (err) {
          showToast('Something went wrong.', 'error');
        }
      }
    );
  };

  const handleGrantProduct = async (userId: string) => {
    if (!selectedProductToGrant) {
      showToast('يرجى تحديد منتج أولاً', 'warning');
      return;
    }
    setIsProcessingAdminAction(true);
    try {
      const res = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_product',
          userId,
          productId: selectedProductToGrant,
          adminName: currentUser?.name || 'Admin',
          adminId: currentUser?.id || 'admin-system'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'ar' ? 'تم منح المنتج للعميل!' : 'Product activated!', 'success');
        setSelectedProductToGrant('');
        // Refresh detail view
        const detailRes = await fetch(`/api/admin/customers/${userId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedAdminCustomer(detailData.user || detailData);
        }
        loadAdminCustomersList();
        loadAdminStats();
      } else {
        showToast(data.message || 'فشل منح المنتج', 'error');
      }
    } catch (e) {
      showToast(lang === 'ar' ? 'فشل منح المنتج.' : 'Failed to activate product.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleWarnUser = async (userId: string) => {
    if (!warningMessageInput.trim()) {
      showToast('يرجى كتابة رسالة التحذير', 'warning');
      return;
    }
    setIsProcessingAdminAction(true);
    try {
      const res = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'warn_user',
          userId,
          warningMessage: warningMessageInput,
          adminName: currentUser?.name || 'Admin',
          adminId: currentUser?.id || 'admin-system'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم إرسال التحذير بنجاح');
        setWarningMessageInput('');
        // Refresh detail view
        const detailRes = await fetch(`/api/admin/customers/${userId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedAdminCustomer(detailData.user || detailData);
        }
        loadAdminCustomersList();
        loadAdminStats();
      } else {
        showToast(data.message || 'فشل إرسال التحذير', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء إرسال التحذير.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleSendCustomerDiscordMessage = async (userId: string) => {
    const message = discordDirectMessageInput.trim();
    if (message.length < 2) {
      showToast(lang === 'ar' ? 'اكتب رسالة للعميل أولاً.' : 'Write a message for the customer first.', 'warning');
      return;
    }
    const customerName = selectedAdminCustomer?.name || (lang === 'ar' ? 'هذا العميل' : 'this customer');
    askConfirm(
      lang === 'ar' ? 'تأكيد رسالة Discord الخاصة' : 'Confirm Discord Direct Message',
      lang === 'ar' ? `سيتم إرسال رسالة واحدة من دعم تعن إلى ${customerName} في الخاص. لا يمكن التراجع عن الإرسال.` : `One private Ta3n Support message will be sent to ${customerName}. This cannot be undone.`,
      async () => {
        setIsProcessingAdminAction(true);
        try {
          const res = await fetch('/api/admin/customers/manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ action: 'send_discord_message', userId, directMessage: message }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) throw new Error(data?.message || (lang === 'ar' ? 'تعذر إرسال الرسالة الخاصة.' : 'Could not send the private message.'));
          setDiscordDirectMessageInput('');
          showToast(data.message || (lang === 'ar' ? 'تم إرسال الرسالة إلى Discord العميل.' : 'Message sent to the customer on Discord.'), 'success');
          void loadAdminStats();
        } catch (error) {
          showToast(error instanceof Error ? error.message : (lang === 'ar' ? 'تعذر إرسال الرسالة الخاصة.' : 'Could not send the private message.'), 'error');
        } finally {
          setIsProcessingAdminAction(false);
        }
      }
    );
  };

  const handleBanUser = async (userId: string) => {
    if (!banReasonInput.trim()) {
      showToast('يرجى كتابة سبب الحظر', 'warning');
      return;
    }
    if (banTypeInput === 'temporary' && !banExpiresAtInput) {
      showToast('يرجى تحديد تاريخ انتهاء الحظر المؤقت', 'warning');
      return;
    }
    setIsProcessingAdminAction(true);
    try {
      const res = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban_user',
          userId,
          banReason: banReasonInput,
          banType: banTypeInput,
          banExpiresAt: banTypeInput === 'temporary' ? new Date(banExpiresAtInput).toISOString() : null,
          adminName: currentUser?.name || 'Admin',
          adminId: currentUser?.id || 'admin-system'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حظر العميل بنجاح');
        setBanReasonInput('');
        setBanExpiresAtInput('');
        // Refresh detail view
        const detailRes = await fetch(`/api/admin/customers/${userId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedAdminCustomer(detailData.user || detailData);
        }
        loadAdminCustomersList();
        loadAdminStats();
      } else {
        showToast(data.message || 'فشل فرض الحظر', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء فرض الحظر.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setIsProcessingAdminAction(true);
    try {
      const res = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban_user',
          userId,
          adminName: currentUser?.name || 'Admin',
          adminId: currentUser?.id || 'admin-system'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم إلغاء حظر العميل بنجاح');
        // Refresh detail view
        const detailRes = await fetch(`/api/admin/customers/${userId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedAdminCustomer(detailData.user || detailData);
        }
        loadAdminCustomersList();
        loadAdminStats();
      } else {
        showToast(data.message || 'فشل إلغاء الحظر', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء إلغاء الحظر.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleDeleteUserAccount = async (userId: string, userName: string) => {
    askConfirm(
      lang === 'ar' ? 'حذف حساب العميل' : 'Delete Customer Account',
      lang === 'ar' ? `هل أنت متأكد من حذف حساب العميل ${userName} نهائياً؟` : `Are you sure you want to delete customer ${userName}'s account permanently?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/customers/${userId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || (lang === 'ar' ? 'تم حذف حساب العميل بنجاح.' : 'Customer account deleted successfully.'));
            setSelectedAdminCustomer(null);
            loadAdminCustomersList();
            loadAdminStats();
          }
        } catch (e) {
          showToast(lang === 'ar' ? 'حدث خطأ أثناء حذف العميل.' : 'Error deleting customer.');
        }
      }
    );
  };

  // Redeem Key Handler
  const handleRedeemKey = async (e: React.FormEvent, keyToRedeem?: string) => {
    if (e) e.preventDefault();
    const key = keyToRedeem || keyInput;
    if (!key.trim()) return;

    setIsRedeeming(true);
    setRedeemMessage(null);

    try {
      const res = await fetch('/api/keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ keyString: key.trim() })
      });

      const data = await res.json();

      if (data.success) {
        setActivationSuccess({ duration: data.duration === 'Lifetime' ? 'Lifetime' : '3 Days', productName: data.product?.name });
        setRedeemMessage(null);
        setKeyInput('');

        // Auto login demo user if guest activated
        if (!currentUser && data.user) {
          setDemoUser(data.user);
        }

        window.setTimeout(() => setActivationSuccess((current) => current ? { ...current, closing: true } : current), 2700);
        window.setTimeout(async () => {
          await loadUserProducts();
          setActiveTab('my-products');
          setGuestModalOpen(false);
          setActivationSuccess(null);
        }, 3000);
      } else {
        setRedeemMessage({ type: 'error', text: data.message });
        showToast(data.message || 'Failed to activate license.', 'error');
      }
    } catch (err) {
      setRedeemMessage({ type: 'error', text: 'حدث خطأ غير متوقع أثناء التفعيل.' });
      showToast('Failed to activate license.', 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Copy Key to Clipboard
  const copyKeyToClipboard = (keyStr: string, id: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const submitResetRequest = async () => {
    if (!resetRequestProduct || isSubmittingResetRequest) return;
    const reason = resetRequestReason.trim();
    if (reason.length < 3) {
      showToast(lang === 'ar' ? 'اكتب سبب الرستات بشكل مختصر.' : 'Please provide a short reset reason.', 'error');
      return;
    }
    setIsSubmittingResetRequest(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'reset_request', productId: resetRequestProduct.productId, reason, language: lang }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر إرسال الطلب.');
      showToast(data.duplicate ? (lang === 'ar' ? 'لديك طلب رستات مفتوح لهذا المنتج بالفعل.' : 'You already have an open reset request for this product.') : (lang === 'ar' ? 'تم إرسال طلب رستات المفتاح إلى الإدارة.' : 'Key reset request sent to staff.'), data.duplicate ? 'info' : 'success');
      setResetRequestProduct(null);
      setResetRequestReason('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : (lang === 'ar' ? 'تعذر إرسال الطلب.' : 'Could not send the request.'), 'error');
    } finally {
      setIsSubmittingResetRequest(false);
    }
  };

  const handleOpenProductGuide = async (license: UserProduct) => {
    if (openingGuideProductId || !license.productId) return;
    setOpeningGuideProductId(license.productId);
    try {
      const response = await fetch(`/api/products/${license.productId}/guide/open`, { method: 'POST', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (lang === 'ar' ? 'تعذر فتح دليل المنتج.' : 'Could not open the product guide.'));
      const updated = { ...license, startedAt: data.startedAt || license.startedAt, expiresAt: data.expiresAt ?? license.expiresAt };
      setUserProducts((current) => current.map((item) => item.id === license.id ? updated : item));
      setGuideModalProduct(updated);
      setGuideView('notice');
      setGuideFlashVersion(null);
      setGuideIssueId(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (lang === 'ar' ? 'تعذر فتح دليل المنتج.' : 'Could not open the product guide.'), 'error');
    } finally {
      setOpeningGuideProductId(null);
    }
  };

  // Download Handler
  const handleDownload = async (productId: string, productName: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        window.open(data.fileUrl, '_blank');
      } else {
        showToast(data.message || 'عذراً، فشل التحميل.', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ في طلب التحميل.', 'error');
    }
  };

  // HWID Reset Handler
  const handleHwidReset = async (productId: string, productName: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/user/hwid-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (lang === 'ar' ? 'تمت إعادة تعيين الجهاز بنجاح!' : 'HWID reset successful!'), 'success');
      } else {
        showToast(data.message || (lang === 'ar' ? 'فشل إعادة تعيين الجهاز.' : 'HWID reset failed.'), 'error');
      }
    } catch (e) {
      showToast(lang === 'ar' ? 'حدث خطأ في إعادة تعيين الجهاز.' : 'Error resetting HWID.', 'error');
    }
  };

  // Demo Login Quick Action
  const loginAsDemoCustomer = () => {
    setDemoUser({
      id: 'user-demo-customer',
      discordId: '1422761753573593088',
      name: '^Y a S e R^',
      email: 'yaser@t3n-store.com',
      image: 'https://cdn.discordapp.com/embed/avatars/1.png',
      role: 'Customer',
      discordRoles: [],
      createdAt: new Date().toISOString()
    });
  };

  const loginAsDemoAdmin = () => {
    setDemoUser({
      id: 'user-admin-1',
      discordId: '1396965033316978839',
      name: 'T3N Owner',
      email: 'boss@t3n-store.com',
      image: 'https://cdn.discordapp.com/embed/avatars/0.png',
      role: 'Boss',
      discordRoles: [],
      createdAt: new Date().toISOString()
    });
  };

  // Inventory Management
  const openInventoryModal = (product: Product, defaultTab: 'keys' | 'custom' | 'details' = 'keys') => {
    setInventoryProduct(product);
    setInventoryInitialTab(defaultTab);
    setInventoryModalOpen(true);
  };

  const openAddProductModal = () => {
    const blankProduct: Product = {
      id: 'new',
      name: '',
      description: '',
      version: 'v1.0.0',
      fileSize: '10 MB',
      category: 'Spoofer',
      downloadsCount: 0,
      image: '/products/fortnite-unban.png',
      videoUrl: '',
      guideUrl: '',
      fileUrl: '',
      cardColor: 'blue',
      displayOrder: 0,
      isVisible: true,
      isDisabled: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    openInventoryModal(blankProduct, 'details');
  };

  const handleSaveProductChanges = async () => {
    if (!inventoryProduct) return;
    setIsSavingProduct(true);
    setProductSaveMessage(null);
    try {
      const isNew = inventoryProduct.id === 'new';
      const newId = isNew ? `prod-${Date.now()}` : inventoryProduct.id;
      const res = await fetch('/api/admin/products', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? { id: newId, ...editProductData } : { id: inventoryProduct.id, ...editProductData })
      });
      const data = await res.json();
      if (data.success && data.product) {
        setInventoryProduct(data.product);
        setProductSaveMessage(isNew ? 'تم إضافة المنتج الجديد بنجاح!' : 'تم حفظ تعديلات المنتج بنجاح!');
        
        if (isNew) {
          setProducts(prev => [...prev, data.product]);
        } else {
          setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
        }
        
        const idx = initialProducts.findIndex((p) => p.id === data.product.id);
        if (idx !== -1) {
          initialProducts[idx] = { ...initialProducts[idx], ...data.product };
        } else if (isNew) {
          initialProducts.push(data.product);
        }
        
        loadAdminStats();
        loadUserProducts();
      } else {
        setProductSaveMessage(data.message || 'حدث خطأ أثناء حفظ التعديلات');
      }
    } catch (e) {
      setProductSaveMessage('فشل الاتصال بالخادم أثناء الحفظ');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const loadInventoryKeys = async (productId: string) => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch(`/api/keys?productId=${productId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر جلب مفاتيح المخزون.');
      }

      const stock = data.stock || { total: 0, available: 0, used: 0, disabled: 0, archived: 0, duplicateCodes: 0 };
      setInventoryKeys(data.keys || []);
      setInventoryStock(stock);
      setInventoryProduct((current) => current && current.id === productId
        ? { ...current, stockKeysCount: Number(stock.available || 0) }
        : current);
      setProducts((current) => current.map((product) => product.id === productId
        ? { ...product, stockKeysCount: Number(stock.available || 0) }
        : product));
    } catch (error: any) {
      console.error('Failed to load inventory keys:', error);
      showToast(error?.message || 'تعذر تحميل المخزون. حاول مجدداً.', 'error');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleDeleteKey = (keyId: string) => {
    if (deletingKeyId) return;
    const keyItem = inventoryKeys.find((item) => item.id === keyId);
    askConfirm(
      lang === 'ar' ? 'حذف المفتاح من المخزون' : 'Delete key from inventory',
      lang === 'ar'
        ? keyItem?.isUsed
          ? `سيُزال المفتاح المستخدم من قائمة المخزون مع بقاء ترخيص العميل فعالاً وسجله محفوظاً. لن يصبح المفتاح قابلاً لإعادة الاستخدام. هل تريد المتابعة؟`
          : `سيُحذف المفتاح من مخزون ${keyItem?.productName || inventoryProduct?.name || 'هذا المنتج'} ويمكنك إدخاله من جديد لاحقاً. هل تريد المتابعة؟`
        : keyItem?.isUsed
          ? `The used key will be removed from inventory while the customer license remains active. It cannot be reused. Continue?`
          : `This unused key will be removed and can be added again later. Continue?`,
      async () => handleDeleteKeyNow(keyId)
    );
  };

  const handleDeleteKeyNow = async (keyId: string) => {
    if (deletingKeyId) return;
    setDeletingKeyId(keyId);
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر حذف المفتاح.');
      }
      setKeyActionMessage(data.message || 'تم حذف المفتاح من قائمة المخزون بنجاح.');
      showToast(data.message || 'تم حذف المفتاح من قائمة المخزون بنجاح.', 'success');
      if (inventoryProduct) {
        await Promise.all([
          loadInventoryKeys(inventoryProduct.id),
          loadAdminStats(),
          loadDbProducts(),
          loadAllKeysList()
        ]);
      }
    } catch (error: any) {
      console.error('Failed to delete key:', error);
      showToast(error?.message || 'تعذر حذف المفتاح. حاول مجدداً.', 'error');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleRevokeAndBan = async (userId: string | null | undefined, keyId: string) => {
    if (!userId) return;
    askConfirm(
      lang === 'ar' ? 'حظر المستخدم وسحب المنتج' : 'Ban User & Revoke Product',
      lang === 'ar' ? 'هل أنت متأكد من حظر المستخدم وإلغاء مفتاحه وسحب المنتج منه؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to ban this user, invalidate their key, and revoke their product access? This action is permanent.',
      async () => {
        try {
          const res = await fetch('/api/admin/keys/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, keyId })
          });
          const data = await res.json();
          if (data.success) {
            showToast(lang === 'ar' ? 'تم حظر العميل واسترجاع المنتج.' : 'User banned and product restored!', 'success');
            await loadAllKeysList();
            loadAdminStats();
          } else {
            showToast(data.message || (lang === 'ar' ? 'فشل الحظر والإلغاء.' : 'Failed.'));
          }
        } catch (e) {
          showToast('Something went wrong.', 'error');
        }
      }
    );
  };

  const handleDeleteAllKeys = async () => {
    if (!inventoryProduct) return;
    askConfirm(
      lang === 'ar' ? 'حذف جميع الأكواد' : 'Delete All Keys',
      lang === 'ar' ? `هل أنت متأكد من حذف جميع المفاتيح غير المستخدمة (${inventoryStock.total - inventoryStock.used} مفتاح) لهذا المنتج؟ لن تُحذف المفاتيح المستخدمة.` : `Are you sure you want to delete all unused keys (${inventoryStock.total - inventoryStock.used} keys) for this product? Used keys will be preserved.`,
      async () => {
        try {
          const res = await fetch('/api/keys', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteAllForProductId: inventoryProduct.id })
          });
          const data = await res.json();
          if (data.success) {
            setKeyActionMessage(data.message || (lang === 'ar' ? `تم حذف ${data.count || 0} مفتاح غير مستخدم.` : `Deleted ${data.count || 0} unused keys.`));
            await Promise.all([
              loadInventoryKeys(inventoryProduct.id),
              loadAdminStats(),
              loadDbProducts(),
              loadAllKeysList()
            ]);
          } else {
            throw new Error(data.message || 'تعذر حذف المفاتيح غير المستخدمة.');
          }
        } catch (error: any) {
          const message = error?.message || (lang === 'ar' ? 'حدث خطأ أثناء حذف جميع المفاتيح غير المستخدمة.' : 'Error deleting unused keys.');
          showToast(message, 'error');
        }
      }
    );
  };

  const handleStartEditKey = (keyItem: KeyType) => {
    setEditingKeyId(keyItem.id);
    setEditingKeyText(keyItem.key);
  };

  const handleSaveKeyEdit = async (keyId: string) => {
    if (!editingKeyText.trim()) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, newKey: editingKeyText })
      });
      const data = await res.json();
      if (data.success && inventoryProduct) {
        setEditingKeyId(null);
        setKeyActionMessage('تم تعديل الكود بنجاح');
        await loadInventoryKeys(inventoryProduct.id);
      }
    } catch (e) {
      console.error('Failed to update key:', e);
    }
  };

  const handleDeleteProductPermanently = async () => {
    if (!inventoryProduct) return;
    askConfirm(
      lang === 'ar' ? 'حذف المنتج نهائياً' : 'Delete Product Permanently',
      lang === 'ar' ? `هل أنت متأكد من حذف المنتج "${inventoryProduct.name}" نهائياً من المتجر وكافة العملاء؟` : `Are you sure you want to delete product "${inventoryProduct.name}" permanently from store and all customers?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/products?id=${inventoryProduct.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setProducts(prev => prev.filter(p => p.id !== inventoryProduct.id));
            const idx = initialProducts.findIndex((p) => p.id === inventoryProduct.id);
            if (idx !== -1) initialProducts.splice(idx, 1);
            setInventoryModalOpen(false);
            loadAdminStats();
            loadUserProducts();
          }
        } catch (e) {
          showToast(lang === 'ar' ? 'حدث خطأ أثناء حذف المنتج.' : 'Error deleting product.');
        }
      }
    );
  };

  const handleLogout = async () => {
    setDemoUser(null);
    if (session) {
      try {
        await fetch('/api/presence', { method: 'PATCH', credentials: 'same-origin' });
      } catch {
        // Do not block the customer from leaving if audit delivery is temporarily unavailable.
      }
      await signOut();
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER STATE 1: NOT LOGGED IN (SPIRITX SIGN-IN SCREEN - SCREENSHOT 2)
  // ---------------------------------------------------------------------------
  const isDark = theme === 'dark';

  // Dynamic Theme Styling Object
  const styles = {
    bgApp: isDark ? 'bg-[#050505] text-[#F4F4F5]' : 'bg-[#FAFAFA] text-[#09090B]',
    bgPanel: isDark ? 'bg-[#0D0D0F]/95 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-black/[0.06] shadow-sm backdrop-blur-xl',
    bgCard: isDark ? 'bg-[#111113] border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md hover:border-purple-500/20 transition-all duration-300' : 'bg-white border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:border-purple-500/20 transition-all duration-300',
    bgSidebar: isDark ? 'bg-[#0D0D0F]/95 border-white/[0.06]' : 'bg-white border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.01)]',
    bgInput: isDark ? 'bg-[#050505] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-purple-500/40 transition-all duration-300' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500/40 transition-all duration-300',
    bgInnerCard: isDark ? 'bg-[#08080A] border-white/[0.05]' : 'bg-slate-50 border-slate-200/[0.6]',
    bgInnerCardDarkOnly: isDark ? 'bg-[#08080A] border-white/[0.05]' : 'bg-slate-100 border-slate-200',
    textTitle: isDark ? 'text-white' : 'text-slate-950',
    textBody: isDark ? 'text-[#F4F4F5]' : 'text-slate-800',
    textMuted: isDark ? 'text-[#A1A1AA]' : 'text-slate-500',
    textLightMuted: isDark ? 'text-[#71717A]' : 'text-slate-450',
    borderSubtle: isDark ? 'border-white/[0.04]' : 'border-slate-100',
    borderNormal: isDark ? 'border-white/10' : 'border-slate-200',
    sidebarActive: isDark ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-bold' : 'bg-purple-50/80 border border-purple-500/10 text-purple-650 shadow-sm font-bold',
    sidebarInactive: isDark ? 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.01]' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50',
    btnSecondary: isDark ? 'border-white/[0.05] hover:border-white/20 hover:bg-white/5 text-[#A1A1AA] hover:text-white' : 'border-slate-200 hover:border-slate-350 hover:bg-black/[0.02] text-slate-700 hover:text-slate-950',
    btnPrimary: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/15 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0',
    borderHover: isDark ? 'border-purple-500/50' : 'border-purple-650/50'
  };

  if (!isLoggedIn) {
    return (
      <>
        <ToastContainer />
        <LoginPage lang={lang} isDark={isDark} onLanguageChange={setLang} onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')} />
        {/* Guest Key Redemption Modal */}
        {guestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card border border-brand-border rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
              <button
                onClick={() => !isRedeeming && !activationSuccess && setGuestModalOpen(false)}
                disabled={isRedeeming || !!activationSuccess}
                className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>

              {activationSuccess ? <ActivationSuccessState lang={lang} duration={activationSuccess.duration} productName={activationSuccess.productName} closing={activationSuccess.closing} /> : <>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">تفعيل مفتاح جديد</h3>
                  <p className="text-xs text-brand-muted">أدخل مفتاح التفعيل للانضمام التلقائي للموقع والديسكورد</p>
                </div>
              </div>

              <form onSubmit={handleRedeemKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">مفتاح التفعيل (License Key)</label>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    disabled={isRedeeming}
                    placeholder="T3N-FORT-99999-PERM"
                    className="w-full bg-brand-sidebar border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono tracking-wider"
                  />
                </div>

                {redeemMessage && redeemMessage.type === 'error' && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-300/50 text-[11px] font-black">!</span>
                    <span>{redeemMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRedeeming || !!activationSuccess}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRedeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>تفعيل المفتاح الآن</span>
                </button>
              </form></>}
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER STATE 2: LOGGED IN (SPIRITX DASHBOARD PANEL)
  // ---------------------------------------------------------------------------
  if (currentUser?.isBanned) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#030303] text-[#F4F4F5]' : 'bg-[#FAFAFA] text-[#09090B]'} flex flex-col items-center justify-center p-4 relative overflow-hidden select-none`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(239,68,68,0.15),transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-rose-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md ${isDark ? 'bg-[#0A0707]/90 border-red-500/25 shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl' : 'bg-red-55/90 border-red-200 shadow-xl'} border rounded-[32px] p-8 text-center space-y-6 relative z-10`}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/35 flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-[20px] font-black text-red-500">
              {lang === 'ar' ? 'تم حظر حسابك' : 'Your Account is Banned'}
            </h2>
            <p className={`text-xs ${styles.textMuted} leading-relaxed px-2`}>
              {lang === 'ar' ? 'عذراً، لقد تم تقييد وصولك إلى هذه المنصة بسبب مخالفة شروط الاستخدام أو بطلب من الإدارة.' : 'Your access to this platform has been restricted due to terms violation or administrative block.'}
            </p>
          </div>

          <div className={`p-5 rounded-2xl ${isDark ? 'bg-black/50 border-white/5' : 'bg-white border-slate-200'} border text-right space-y-3.5`}>
            <div>
              <span className={`text-[10px] font-bold ${styles.textLightMuted} block mb-0.5`}>{lang === 'ar' ? 'سبب الحظر' : 'Ban Reason'}</span>
              <span className={`text-xs font-extrabold ${styles.textTitle}`}>{currentUser.banReason || (lang === 'ar' ? 'غير محدد' : 'Not specified')}</span>
            </div>
            <div>
              <span className={`text-[10px] font-bold ${styles.textLightMuted} block mb-0.5`}>{lang === 'ar' ? 'نوع الحظر' : 'Ban Type'}</span>
              <span className={`text-xs font-extrabold ${styles.textTitle}`}>
                {currentUser.banType === 'temporary' ? (lang === 'ar' ? 'مؤقت' : 'Temporary') : (lang === 'ar' ? 'دائم' : 'Permanent')}
              </span>
            </div>
            {currentUser.banType === 'temporary' && currentUser.banExpiresAt && (
              <div>
                <span className={`text-[10px] font-bold ${styles.textLightMuted} block mb-0.5`}>{lang === 'ar' ? 'تاريخ انتهاء الحظر' : 'Ban Expiration'}</span>
                <span className="text-xs font-mono font-extrabold text-red-500">
                  {new Date(currentUser.banExpiresAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-550 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const activePageTitle = {
    overview: lang === 'ar' ? 'الرئيسية' : 'Overview',
    'my-products': lang === 'ar' ? 'منتجاتي' : 'My Products',
    redeem: lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key',
    tickets: lang === 'ar' ? 'مركز المساعدة' : 'Help center',
    profile: lang === 'ar' ? 'الملف الشخصي' : 'Profile',
    admin: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Control',
  }[activeTab];
  const adminLogActions = Array.from(new Set(adminLogs.map((log) => log.action))).sort();
  const normalizedLogQuery = adminLogQuery.trim().toLowerCase();
  const visibleAdminLogs = adminLogs.filter((log) => {
    const matchesAction = adminLogAction === 'all' || log.action === adminLogAction;
    const haystack = `${lang === 'ar' ? ({ 'Key Started': 'بدء مدة المنتج', 'Key Activation': 'تفعيل مفتاح', 'Stock Keys Added': 'إضافة مفاتيح للمخزون', 'Login': 'تسجيل الدخول', 'Register': 'تسجيل حساب' } as Record<string, string>)[log.action] || log.action : log.action} ${log.details} ${log.userName || ''} ${log.ipAddress || ''}`.toLowerCase();
    return matchesAction && (!normalizedLogQuery || haystack.includes(normalizedLogQuery));
  });

  return (
    <div
      className={`portal-shell portal-luxe portal-protected-content ${isDark ? 'portal-shell--dark' : 'portal-shell--light'} flex h-screen overflow-hidden transition-colors duration-500 relative`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onCopy={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('input, textarea, [contenteditable="true"], [data-allow-copy]')) event.preventDefault();
      }}
      onContextMenu={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('input, textarea, [contenteditable="true"], [data-allow-context-menu]')) event.preventDefault();
      }}
      onDragStart={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('input, textarea, [contenteditable="true"], [data-allow-drag]')) event.preventDefault();
      }}
    >
      {/* Layered luxury background */}
      <div className="portal-ambient" aria-hidden="true" />
      <div className="portal-grid" aria-hidden="true" />
      <div className="portal-noise" aria-hidden="true" />

      {/* Compact mobile top bar and navigation drawer */}
      <PortalNavigation
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'redeem') setGuestModalOpen(true);
          else setActiveTab(tab);
        }}
        lang={lang}
        isDark={isDark}
        isAdmin={isAdmin}
        productCount={activeProductCount}
        mobileOpen={mobileMenuOpen}
        onMobileChange={setMobileMenuOpen}
        onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
        onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        onLogout={handleLogout}
        user={currentUser}
      />

      {/* Main Content Area */}
      <main className="portal-main-content portal-scroll-region min-w-0 flex-grow h-full overflow-y-auto p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-8 relative z-10">
        <div className="portal-content-frame mx-auto flex min-h-full max-w-[1520px] flex-col gap-6">

        {currentUser?.warningMessage && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black">{lang === 'ar' ? 'تنبيه إداري رسمي لحسابك' : 'Official System Warning'}</div>
                <div className="text-xs mt-0.5 font-medium">{currentUser.warningMessage}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setDemoUser(prev => prev ? { ...prev, warningMessage: null } : null);
                fetch('/api/admin/customers/manage', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'warn_user', userId: currentUser.id, warningMessage: '' })
                }).catch(() => {});
              }}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[10px] font-black rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              {lang === 'ar' ? 'لقد فهمت' : 'I Understand'}
            </button>
          </div>
        )}

        {/* Structured portal header */}
        <header className={`portal-page-header flex items-center justify-between gap-4 animate-fade-in ${isDark ? 'border-sky-100/[0.12]' : 'border-slate-900/[0.10]'}`}>
          <div className="portal-page-header__copy min-w-0">
            <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'} className={`portal-breadcrumbs ${isDark ? 'text-sky-200/65' : 'text-sky-700/70'}`}>
              <button type="button" onClick={() => setActiveTab('overview')}>{lang === 'ar' ? 'بوابة تعن الرئيسية' : 'Ta3n Portal'}</button>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{activePageTitle}</span>
            </nav>
            <h1 className={`portal-page-header__title text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{activePageTitle}</h1>
          </div>

          <div className="portal-page-header__actions flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              title={lang === 'ar' ? 'English' : 'العربية'}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              className={`portal-header-action h-10 min-w-10 rounded-xl border px-2 text-[10px] font-black tracking-wide ${isDark ? 'border-sky-100/15 bg-sky-100/[0.07] text-sky-100 hover:bg-sky-100/[0.14]' : 'border-sky-900/10 bg-white/70 text-sky-800 hover:bg-white shadow-sm'}`}
            >
              <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
              aria-label={isDark ? (lang === 'ar' ? 'تفعيل الوضع الفاتح' : 'Enable light mode') : (lang === 'ar' ? 'تفعيل الوضع الداكن' : 'Enable dark mode')}
              className={`portal-header-action h-10 w-10 rounded-xl border flex items-center justify-center ${isDark ? 'border-sky-100/15 bg-sky-100/[0.07] text-sky-100 hover:bg-sky-100/[0.14]' : 'border-sky-900/10 bg-white/70 text-sky-800 hover:bg-white shadow-sm'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* HELP CENTER */}
        {activeTab === 'tickets' && (
          <HelpCenter
            lang={lang}
            isDark={isDark}
            products={products.filter(product => product.isVisible && !product.isArchived)}
            onNavigateTab={(tab) => {
              if (tab === 'overview' || tab === 'my-products' || tab === 'redeem') {
                setActiveTab(tab as any);
              }
            }}
          />
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="portal-section-enter overview-dashboard grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              {newUserWelcome && (
                <section className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-sky-300/20 bg-gradient-to-br from-sky-400/[.16] via-[#171b22]/95 to-[#171b22]/95 text-white' : 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-slate-950 shadow-[0_18px_38px_rgba(30,120,180,0.12)]'}`}>
                  <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />
                  <button type="button" onClick={() => setNewUserWelcome(null)} className={`absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'} rounded-lg p-2 transition ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'}`} aria-label={lang === 'ar' ? 'إغلاق رسالة الترحيب' : 'Close welcome message'}>
                    <X className="h-4 w-4" />
                  </button>
                  <div className="relative flex items-start gap-3 pe-8">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${isDark ? 'border-sky-200/20 bg-sky-200/10 text-sky-100' : 'border-sky-200 bg-white text-sky-700'}`}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-sky-200/80' : 'text-sky-700/80'}`}>{lang === 'ar' ? 'مرحباً بك في تعن' : 'Welcome to T3N'}</p>
                      <h2 className="mt-1 text-base font-extrabold sm:text-lg">{lang === 'ar' ? `أهلاً ${newUserWelcome.name}، تم تجهيز حسابك بنجاح.` : `Welcome ${newUserWelcome.name}, your account is ready.`}</h2>
                      <p className={`mt-1.5 text-xs leading-6 sm:text-sm ${isDark ? 'text-slate-200/75' : 'text-slate-600'}`}>{lang === 'ar' ? 'يمكنك الآن تفعيل مفتاحك، الوصول إلى منتجاتك وفتح دليل الاستخدام عند الحاجة.' : 'You can now redeem your key, access your products and open the product guide whenever you need it.'}</p>
                    </div>
                  </div>
                </section>
              )}
              {/* Welcome banner: the spacious anchor of the dashboard. */}
              <section className={`overview-welcome-card relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-white/[0.14] bg-[#171b22]/92 text-white' : 'border-slate-200 bg-white text-slate-950 shadow-[0_18px_38px_rgba(30,64,95,0.08)]'}`}>
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(110deg,rgba(255,255,255,0.055),transparent_42%,rgba(88,172,234,0.10))]" />
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <img
                    src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={currentUser.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.3)] shrink-0"
                    onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  />
                  <div className={`min-w-0 flex-1 flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.95)]" />
                      <span className={`text-[10px] font-black tracking-[0.16em] uppercase ${isDark ? 'text-sky-100/70' : 'text-sky-700/70'}`}>{lang === 'ar' ? 'حسابك متصل' : 'Account Online'}</span>
                    </div>
                    <h2 className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {lang === 'ar' ? `مرحباً بعودتك، ${currentUser.name}!` : `Welcome back, ${currentUser.name}!`}
                    </h2>
                    <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-300/75' : 'text-slate-500'}`}>
                      {lang === 'ar' ? `لديك ${activeProductCount} منتجات مفعلة بحسابك.` : `You have ${activeProductCount} active product(s) on your account.`}
                    </p>
                  </div>
                </div>
              </section>

              {/* Dashboard statistics: useful context before taking an action. */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className={`overview-stat-card rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/[0.13] bg-[#171b22]/90' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.07)]'}`}>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 ${isDark ? 'border-white/[0.12] bg-white/[0.055] text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><Package className="w-[18px] h-[18px]" /></div>
                  <p className={`text-2xl sm:text-3xl leading-none font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{activeProductCount}</p>
                  <p className={`text-[11px] sm:text-xs mt-2 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'منتجات مفعلة' : 'Active Products'}</p>
                </div>
                <div className={`overview-stat-card rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/[0.13] bg-[#171b22]/90' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.07)]'}`}>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 ${isDark ? 'border-white/[0.12] bg-white/[0.055] text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><CheckCircle2 className="w-[18px] h-[18px]" /></div>
                  <p className={`text-xl sm:text-2xl leading-none font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{lang === 'ar' ? 'فعال' : 'Active'}</p>
                  <p className={`text-[11px] sm:text-xs mt-2 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'حالة الحساب' : 'Account Status'}</p>
                </div>
                <div className={`overview-stat-card rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/[0.13] bg-[#171b22]/90' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.07)]'}`}>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 ${isDark ? 'border-white/[0.12] bg-white/[0.055] text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><Clock className="w-[18px] h-[18px]" /></div>
                  <p className={`text-base sm:text-lg leading-none font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>{memberSince}</p>
                  <p className={`text-[11px] sm:text-xs mt-2 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'عضو منذ' : 'Member Since'}</p>
                </div>
              </section>

            </div>

            {/* Quick actions: a graphite side panel with a precise white separator system. */}
            <section className={`overview-quick-actions quick-actions-panel overflow-hidden rounded-2xl border shadow-[0_20px_48px_rgba(0,0,0,0.22)] ${isDark ? 'bg-[#15171b]/94 border-white/[0.14]' : 'bg-white border-slate-200 shadow-[0_16px_38px_rgba(30,64,95,0.10)]'}`}>
              <div className={`px-5 py-3.5 border-b ${isDark ? 'bg-white/[0.025] border-white/[0.08]' : 'bg-neutral-50 border-neutral-200'}`}>
                <p className={`text-[11px] font-extrabold tracking-[0.12em] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </p>
              </div>

              <div>
                <button
                  onClick={() => setActiveTab('my-products')}
                  className={`w-full min-h-[76px] px-5 py-3.5 flex items-center justify-between gap-4 text-start transition-all duration-200 group ${isDark ? 'hover:bg-white/[0.035]' : 'hover:bg-neutral-50'}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-white/[0.045] border-white/[0.11] text-neutral-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                      <Package className="w-[19px] h-[19px]" />
                    </div>
                    <div className={`min-w-0 flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-neutral-950'}`}>{lang === 'ar' ? 'منتجاتي' : 'My Products'}</span>
                      <span className={`text-xs font-medium mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{lang === 'ar' ? 'عرض المفاتيح والتحميلات' : 'View keys & downloads'}</span>
                    </div>
                  </div>
                  <ArrowLeft className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-neutral-600 group-hover:text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-800'} ${lang === 'ar' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
                </button>

                <a
                  href="https://discord.gg/t3n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full min-h-[76px] px-5 py-3.5 border-t flex items-center justify-between gap-4 text-start transition-all duration-200 group ${isDark ? 'border-white/[0.10] bg-[#161a22] hover:bg-[#1b2029]' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-[#252a34] border-white/[0.12]' : 'bg-slate-100 border-slate-200'}`}>
                      <DiscordIcon className="h-5 w-5" />
                    </div>
                    <div className={`min-w-0 flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-neutral-950'}`}>{lang === 'ar' ? 'انضم إلى ديسكورد' : 'Join Discord'}</span>
                      <span className="text-xs font-medium mt-1 text-neutral-500">{lang === 'ar' ? 'التحديثات والمجتمع' : 'Updates and community'}</span>
                    </div>
                  </div>
                  <ArrowLeft className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-neutral-600 group-hover:text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-800'} ${lang === 'ar' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
                </a>

                <a
                  href="https://t3nnn.com/ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full min-h-[76px] px-5 py-3.5 border-t flex items-center justify-between gap-4 text-start transition-all duration-200 group ${isDark ? 'border-white/[0.08] hover:bg-white/[0.035]' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-white/[0.045] border-white/[0.11] text-neutral-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                      <ShoppingCart className="w-[19px] h-[19px]" />
                    </div>
                    <div className={`min-w-0 flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-neutral-950'}`}>{lang === 'ar' ? 'المتجر' : 'Shop'}</span>
                      <span className="text-xs font-medium mt-1 text-neutral-500">{lang === 'ar' ? 'استعرض المنتجات والرخص المتاحة' : 'Browse available products and licenses'}</span>
                    </div>
                  </div>
                  <ArrowLeft className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-neutral-600 group-hover:text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-800'} ${lang === 'ar' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
                </a>

                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full min-h-[76px] px-5 py-3.5 border-t flex items-center justify-between gap-4 text-start transition-all duration-200 group ${isDark ? 'border-white/[0.08] hover:bg-white/[0.035]' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-white/[0.045] border-white/[0.11] text-neutral-200' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                      <HelpCircle className="w-[19px] h-[19px]" />
                    </div>
                    <div className={`min-w-0 flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-neutral-950'}`}>{lang === 'ar' ? 'مركز المساعدة' : 'Help center'}</span>
                      <span className="text-xs font-medium mt-1 text-neutral-500">{lang === 'ar' ? 'الأسئلة والشروحات وحلول المشاكل' : 'Questions, guides, and solutions'}</span>
                    </div>
                  </div>
                  <ArrowLeft className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-neutral-600 group-hover:text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-800'} ${lang === 'ar' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MY PRODUCTS */}
        {activeTab === 'my-products' && (
          <div className="portal-section-enter products-experience space-y-7">
            {resetCompletionNotice && <section dir={lang === 'ar' ? 'rtl' : 'ltr'} role="alert" className={`relative overflow-hidden rounded-[24px] border p-5 shadow-[0_22px_48px_rgba(16,185,129,.14)] sm:p-6 ${isDark ? 'border-emerald-300/[.28] bg-[linear-gradient(135deg,rgba(6,78,59,.88),rgba(10,36,42,.94))] text-emerald-50' : 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f0fdfa)] text-emerald-950'}`}>
              <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${isDark ? 'border-emerald-200/25 bg-emerald-300/[.14] text-emerald-100' : 'border-emerald-200 bg-white text-emerald-600'}`}><CheckCircle2 className="h-6 w-6" /></span><div><p className={`text-[10px] font-black tracking-[.16em] ${isDark ? 'text-emerald-200/75' : 'text-emerald-700/75'}`}>{lang === 'ar' ? 'تحديث الترخيص' : 'LICENSE UPDATE'}</p><h3 className="mt-1 text-base font-black sm:text-lg">{lang === 'ar' ? 'تم رستات المفتاح الخاص بك بنجاح' : 'Your license key was reset successfully'}</h3><p className={`mt-1.5 max-w-2xl text-xs leading-6 ${isDark ? 'text-emerald-50/80' : 'text-emerald-900/75'}`}>{resetCompletionNotice.message}</p><p className={`mt-1 text-[11px] font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{lang === 'ar' ? 'يمكنك الآن التسجيل أو تشغيل المنتج من جديد.' : 'You can now register or start the product again.'}</p></div></div>
                <button type="button" disabled={isAcknowledgingResetCompletion} onClick={async () => { const notice = resetCompletionNotice; if (!notice || isAcknowledgingResetCompletion) return; setIsAcknowledgingResetCompletion(true); setResetCompletionNotice(null); try { const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'notification_seen', notificationId: notice.id }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error('mark-seen-failed'); } catch { setResetCompletionNotice(notice); } finally { setIsAcknowledgingResetCompletion(false); } }} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{isAcknowledgingResetCompletion ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isAcknowledgingResetCompletion ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (lang === 'ar' ? 'متابعة' : 'Continue')}</button>
              </div>
            </section>}

            <section className={`products-page-hero flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-sky-100/[0.14] bg-[#0d1c2f]/82' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.08)]'}`}>
              <div className="min-w-0">
                <p className={`text-[10px] font-black tracking-[0.16em] uppercase ${isDark ? 'text-sky-200/70' : 'text-sky-700/70'}`}>{lang === 'ar' ? 'مكتبة التراخيص' : 'License Library'}</p>
                <h2 className={`mt-1 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{lang === 'ar' ? 'منتجاتي' : 'My Products'}</h2>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-300/75' : 'text-slate-600'}`}>{lang === 'ar' ? 'إدارة منتجاتك وحالات التفعيل بسهولة من مكان واحد.' : 'Manage your products and activation states from one place.'}</p>
              </div>
              <button
                onClick={() => setGuestModalOpen(true)}
                className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.14)] transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:scale-95"
              >
                <Key className="h-4 w-4" />
                <span>{lang === 'ar' ? 'استرداد مفتاح' : 'Redeem Key'}</span>
              </button>
            </section>


            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{
                    background: 'rgba(16,23,42,0.65)',
                    border: '1px solid rgba(127,184,255,0.16)',
                    borderRadius: '22px',
                    padding: '26px',
                    overflow: 'hidden',
                  }} className="animate-pulse space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-[42px] h-[42px] rounded-xl" style={{ background: 'rgba(127,184,255,0.08)' }} />
                        <div className="space-y-2">
                          <div className="h-4 w-28 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                          <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                        </div>
                      </div>
                      <div className="h-6 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                    <div className="h-12 w-full rounded-[14px]" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(127,184,255,0.16)' }} />
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="h-12 rounded-[13px]" style={{ background: 'rgba(255,255,255,0.035)' }} />
                      <div className="h-12 rounded-[13px]" style={{ background: 'rgba(255,255,255,0.035)' }} />
                      <div className="h-12 col-span-2 rounded-[13px]" style={{ background: 'rgba(94,205,240,0.08)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : userProducts.length === 0 ? (
              /* EMPTY STATE MATCHING SCREENSHOT 1 EXACTLY */
              <div className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden group my-8">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                  <Package className="w-7 h-7 stroke-1" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white mb-1.5">
                  {lang === 'ar' ? 'لا توجد منتجات حتى الآن' : 'No products yet'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mb-6 font-medium max-w-md mx-auto">
                  {lang === 'ar' ? 'قم بتفعيل مفتاح الترخيص للبدء في استخدام الخدمات.' : 'Redeem a license key to get started.'}
                </p>
                <button
                  onClick={() => setGuestModalOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                >
                  <Key className="w-4 h-4 text-black" />
                  <span>{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</span>
                </button>
              </div>
            ) : (
              <div className="product-library mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
                <div className={`col-span-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 sm:px-5 ${isDark ? 'border-emerald-300/20 bg-emerald-300/[0.06]' : 'border-emerald-200 bg-emerald-50'}`}>
                  <div className="flex min-w-0 items-start gap-3">
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`} />
                    <div className="min-w-0">
                      <h3 className={`text-sm font-extrabold sm:text-base ${isDark ? 'text-white' : 'text-slate-950'}`}>{lang === 'ar' ? 'المنتجات الفعّالة' : 'Active products'}</h3>
                      <p className={`mt-1 text-[11px] leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{lang === 'ar' ? 'تراخيصك المتاحة للاستخدام والتحميل.' : 'Licenses ready to use and download.'}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${isDark ? 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100' : 'border-emerald-200 bg-white text-emerald-800'}`}>{activeLicenses.length}</span>
                </div>
                {activeLicenses.length === 0 && <p className={`col-span-full rounded-2xl border px-5 py-6 text-center text-sm ${isDark ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>{lang === 'ar' ? 'لا توجد منتجات فعّالة حاليًا.' : 'No active products right now.'}</p>}
                {groupedUserProducts.map((up, index) => {
                  const displayKey = up.keyString || (lang === 'ar' ? 'من تعن' : 'From TA3N');
                  const timing = getLicenseTiming(up);
                  const canUseProduct = timing.isUsable;
                  const startsInactiveSection = index === activeLicenses.length;
                  const productImg = getProductImage(up.product);

                  return (
                    <React.Fragment key={up.id}>
                      {startsInactiveSection && (
                        <div className="col-span-full mt-6 flex flex-col gap-3 border-t border-white/[0.12] pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <Clock className={`mt-0.5 h-5 w-5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                            <div className="min-w-0">
                              <h3 className={`text-sm font-extrabold sm:text-base ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{lang === 'ar' ? 'المنتجات المنتهية' : 'Expired products'}</h3>
                              <p className={`mt-1 text-[11px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{lang === 'ar' ? 'التراخيص المنتهية أو غير الفعّالة محفوظة هنا.' : 'Expired or inactive licenses are kept here.'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowExpiredLicenses((current) => !current)}
                            aria-expanded={showExpiredLicenses}
                            className={`inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-300/30 hover:bg-sky-300/[0.07]' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'}`}
                          >
                            <span>{showExpiredLicenses ? (lang === 'ar' ? 'إخفاء المنتجات' : 'Hide products') : (lang === 'ar' ? 'عرض المنتجات' : 'Show products')}</span>
                            <span className="rounded-md bg-slate-400/10 px-2 py-0.5 text-[10px]">{inactiveLicenses.length}</span>
                            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${showExpiredLicenses ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      )}
                    {(canUseProduct || showExpiredLicenses) && <article
                      className={`product-license-card product-license-card--premium group ${canUseProduct ? '' : 'opacity-75 grayscale-[0.15]'}`}
                      data-active={canUseProduct ? 'true' : 'false'}
                    >
                      <div className="product-license-card__media" aria-hidden="true">
                        <img className="product-license-card__image" src={productImg} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                        <div className="product-license-card__media-overlay" />
                        <div className={`product-license-card__expiry ${timing.isExpired ? 'product-license-card__expiry--expired' : ''}`}>
                          <Clock size={12} />
                          <span>{timing.isExpired ? (lang === 'ar' ? 'انتهت صلاحية الترخيص' : 'License expired') : timing.isPendingStart ? timing.countdown : `${lang === 'ar' ? 'متبقي' : 'Remaining'} · ${timing.countdown}`}</span>
                        </div>
                        <span className={`product-license-card__status ${canUseProduct ? 'product-license-card__status--active' : ''}`}>
                          <span className="product-license-card__status-dot" />
                          {timing.isPendingStart ? (lang === 'ar' ? 'مفعّل — لم تبدأ المدة' : 'Activated — pending start') : canUseProduct ? (lang === 'ar' ? 'مفعّل' : 'Active') : timing.isExpired ? (lang === 'ar' ? 'منتهٍ' : 'Expired') : (lang === 'ar' ? 'غير فعّال' : 'Inactive')}
                        </span>
                        <div className="product-license-card__media-brand">{lang === 'ar' ? 'تعن · ترخيص رقمي' : 'TA3N · DIGITAL LICENSE'}</div>
                      </div>
                      <div className="product-license-card__body">
                        <div className="product-license-card__heading">
                          <div className="min-w-0 flex-1">
                            <div className="product-license-card__title text-base leading-tight sm:text-lg">{up.product?.name || (lang === 'ar' ? 'المنتج' : 'Product')}</div>
                            <div className="product-license-card__category mt-1 text-[10px] font-semibold text-slate-500">{up.product?.category || (lang === 'ar' ? 'ترخيص رقمي' : 'Digital license')}</div>
                          </div>
                        </div>

                        <ProductNotice product={up.product} placement="afterPurchase" lang={lang} />

                        {/* License key: only provided by the authenticated owner's /api/user/products response. */}
                        <div className="product-license-card__key">
                          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-cyan-100/65"><span className="inline-flex items-center gap-1.5"><Key size={10} />{lang === 'ar' ? 'مفتاح الترخيص' : 'License key'}</span><span>{lang === 'ar' ? 'خاص بحسابك' : 'Account license'}</span></div>
                          <div className="flex items-center gap-1.5">
                            <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap rounded-lg border border-white/[0.07] bg-black/30 px-2.5 py-2 text-[9px] font-bold tracking-[0.045em] text-cyan-100 scrollbar-none">{displayKey}</code>
                            {up.keyString && (
                              <button
                                onClick={() => copyKeyToClipboard(up.keyString!, up.id)}
                                title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy key'}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-[9px] font-black transition-all active:scale-95 ${copiedKeyId === up.id ? 'border-emerald-300/25 bg-emerald-400/[0.15] text-emerald-100' : 'border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100 hover:bg-cyan-300/[0.18]'}`}
                              >
                                {copiedKeyId === up.id ? <Check size={14} /> : <Copy size={14} />}
                                <span className="hidden sm:inline">{copiedKeyId === up.id ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="product-license-card__actions">
                          <button
                            onClick={() => handleDownload(up.productId, up.product?.name || (lang === 'ar' ? 'المنتج' : 'Product'))}
                            disabled={!canUseProduct}
                            className="product-download-button"
                          >
                            <Download size={14} />
                            {lang === 'ar' ? 'تحميل اللودر' : 'Download Loader'}
                          </button>
                          <button
                            onClick={() => void handleOpenProductGuide(up)}
                            disabled={!canUseProduct || openingGuideProductId === up.productId}
                            className="product-guide-button"
                          >
                            <HelpCircle size={13} />
                            {openingGuideProductId === up.productId ? (lang === 'ar' ? 'جارٍ فتح الدليل...' : 'Opening guide...') : (lang === 'ar' ? 'دليل المنتج' : 'Product guide')}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setResetRequestProduct(up); setResetRequestReason(''); }}
                          disabled={!canUseProduct}
                          className="product-reset-button"
                        >
                          <span className="product-reset-button__icon"><RefreshCw size={15} /></span>
                          <span className="min-w-0 text-start">
                            <span className="block text-[10px] font-black">{lang === 'ar' ? 'طلب رستات المفتاح' : 'Request key reset'}</span>
                            <span className="mt-0.5 block text-[8px] font-bold opacity-70">{lang === 'ar' ? 'للمشاكل الفعلية في الجهاز أو الترخيص فقط' : 'For genuine device or license issues only'}</span>
                          </span>
                        </button>
                      </div>
                    </article>}
                    </React.Fragment>
                  );
                })}
                {inactiveLicenses.length === 0 && (
                  <div className={`col-span-full mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-6 ${isDark ? 'border-white/[0.12]' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <Clock className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                      <div>
                        <h3 className={`text-sm font-extrabold sm:text-base ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{lang === 'ar' ? 'المنتجات المنتهية' : 'Expired products'}</h3>
                        <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{lang === 'ar' ? 'لا توجد تراخيص منتهية حاليًا.' : 'No expired licenses right now.'}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'}`}>0</span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}


        {/* TAB 3: REDEEM KEY (Integrated into My Products) */}
        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <div className="portal-section-enter space-y-8 max-w-2xl mx-auto py-6 animate-slide-up">
            <div>
              <h1 className={`text-3xl font-extrabold ${styles.textTitle} tracking-tight`}>
                {lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}
              </h1>
              <p className={`text-xs ${styles.textMuted} mt-1.5 font-medium`}>
                {lang === 'ar' ? 'إدارة بيانات حسابك وتفضيلات المظهر واللغة' : 'Manage your account details, appearance, and language preferences'}
              </p>
            </div>

            {/* Profile Info Card */}
            <div className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur opacity-30 group-hover:opacity-50 transition duration-500" />
                <img
                  src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={currentUser.name}
                  className={`w-20 h-20 rounded-full object-cover relative z-10 border-2 border-indigo-500/20 shadow-md ${isDark ? 'grayscale opacity-90' : ''}`}
                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center sm:justify-start">
                  <h2 className={`text-xl font-bold ${styles.textTitle}`}>{currentUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 w-fit mx-auto sm:mx-0">
                    {(currentUser.role === 'Boss' || currentUser.role === 'Admin' || currentUser.role === 'Co-Boss') ? (lang === 'ar' ? 'مسؤول النظام' : 'Administrator') : (lang === 'ar' ? 'عميل' : 'Customer')}
                  </span>
                </div>
                <p className={`text-xs ${styles.textMuted} mt-1 font-mono`}>
                  Discord ID: {currentUser.id || 'N/A'}
                </p>
                <p className={`text-[11px] ${styles.textLightMuted} mt-3`}>
                  {lang === 'ar' ? 'تاريخ الانضمام:' : 'Joined:'} {new Date(currentUser.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Preferences & Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Appearance Setting */}
              <div className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className={`text-sm font-bold ${styles.textTitle} mb-1 flex items-center gap-2`}>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'ar' ? 'المظهر والمرئيات' : 'Appearance & Theme'}</span>
                  </h3>
                  <p className={`text-[11px] ${styles.textMuted} mb-5`}>
                    {lang === 'ar' ? 'اختر الوضع المفضل لديك لتصفح مريح' : 'Choose your preferred color theme for the portal'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isDark 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    {lang === 'ar' ? 'فاتح' : 'Light Mode'}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    {lang === 'ar' ? 'داكن' : 'Dark Mode'}
                  </button>
                </div>
              </div>

              {/* Language Setting */}
              <div className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className={`text-sm font-bold ${styles.textTitle} mb-1 flex items-center gap-2`}>
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'ar' ? 'لغة المنصة' : 'Language Settings'}</span>
                  </h3>
                  <p className={`text-[11px] ${styles.textMuted} mb-5`}>
                    {lang === 'ar' ? 'تغيير لغة عرض الواجهة والتقارير' : 'Switch the display language for portal elements'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLang('ar')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      lang === 'ar' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      lang === 'en' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}



        {/* TAB 4: ADMIN PANEL (Categorized Dashboard with Sub-Tabs) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="portal-section-enter admin-workspace space-y-5 w-full max-w-[1440px] mx-auto">
            {/* Top Admin Header */}
            <div className={`admin-hero ${styles.bgCard} border ${styles.borderNormal} rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="min-w-0">
                <p className={`admin-hero__eyebrow ${styles.textMuted}`}>{lang === 'ar' ? 'إدارة المنصة' : 'PLATFORM MANAGEMENT'}</p>
                <h1 className={`text-2xl font-extrabold ${styles.textTitle} tracking-wide flex items-center gap-3`}>
                  <div className={`p-2 bg-black/5 dark:bg-white/5 rounded-xl border ${styles.borderSubtle}`}>
                    {adminSectionTab === 'overview' && <Activity className="w-6 h-6 text-sky-500 dark:text-sky-400" />}
                    {adminSectionTab === 'products' && <Package className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    {adminSectionTab === 'customers' && <Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />}
                    {adminSectionTab === 'help' && <HelpCircle className="w-6 h-6 text-teal-500 dark:text-teal-400" />}
                    {adminSectionTab === 'updates' && <Megaphone className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />}
                    {adminSectionTab === 'resetRequests' && <RefreshCw className="w-6 h-6 text-amber-500 dark:text-amber-300" />}
                    {adminSectionTab === 'keys' && <Key className="w-6 h-6 text-indigo-600 dark:text-primary" />}
                    {adminSectionTab === 'logs' && <FileText className="w-6 h-6 text-orange-500 dark:text-orange-400" />}
                  </div>
                  <span>
                    {adminSectionTab === 'overview' && (lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Overview & Stats')}
                    {adminSectionTab === 'products' && (lang === 'ar' ? 'إدارة المنتجات والمخزون' : 'Products & Inventory')}
                    {adminSectionTab === 'customers' && (lang === 'ar' ? 'إدارة العملاء' : 'Customers Management')}
                    {adminSectionTab === 'help' && (lang === 'ar' ? 'إدارة مركز المساعدة والأسئلة الشائعة' : 'Help Center & FAQ Management')}
                    {adminSectionTab === 'updates' && (lang === 'ar' ? 'تحديثات الموقع الرسمية' : 'Official Website Updates')}
                    {adminSectionTab === 'resetRequests' && (lang === 'ar' ? 'طلبات الريست' : 'Reset requests')}
                    {adminSectionTab === 'keys' && (lang === 'ar' ? 'البحث في المفاتيح' : 'Keys Search')}
                    {adminSectionTab === 'logs' && (lang === 'ar' ? 'سجلات النظام' : 'System Logs')}
                  </span>
                </h1>
                <p className={`text-xs ${styles.textMuted} mt-2`}>
                  {adminSectionTab === 'overview' && (lang === 'ar' ? <>إحصائيات شاملة ومباشرة لمنصة {renderBrandText('تعن')} الرقمية.</> : 'Comprehensive live stats for the TA3N portal.')}
                  {adminSectionTab === 'products' && (lang === 'ar' ? 'تحكم كامل في إعدادات المنتجات وإضافة المفاتيح اليدوية.' : 'Full control over product settings and manual key addition.')}
                  {adminSectionTab === 'customers' && (lang === 'ar' ? 'استعراض بيانات العملاء، حظر، ومراجعة أنشطتهم.' : 'Browse customer data, manage bans, and audit their activities.')}
                  {adminSectionTab === 'help' && (lang === 'ar' ? 'إدارة تصنيفات وأسئلة مركز المساعدة، وتتبع الأسئلة الأكثر بحثاً وتعديل الإجابات باحترافية.' : 'Manage Help Center categories and FAQs, view real search stats, and edit rich answers.')}
                  {adminSectionTab === 'updates' && (lang === 'ar' ? 'أنشئ تحديثاً موثقاً بصورة، اعتمده، ثم انشره مرة واحدة إلى Discord.' : 'Create an image-backed update, approve it, then publish it once to Discord.')}
                  {adminSectionTab === 'resetRequests' && (lang === 'ar' ? 'طلبات العملاء لإعادة ضبط الترخيص، مع السبب والمفتاح ووقت الطلب.' : 'Customer license reset requests with their reason, key, and request time.')}
                  {adminSectionTab === 'keys' && (lang === 'ar' ? 'تتبع سريع للمفاتيح المباعة والمتاحة في النظام.' : 'Quick tracking of sold and available license keys in the system.')}
                  {adminSectionTab === 'logs' && (lang === 'ar' ? 'مراقبة حية لجميع حركات دخول وخروج واستخدام الموقع.' : 'Live auditing of all logins, transactions, and site usage.')}
                </p>
              </div>

              <div className="admin-hero__actions flex flex-wrap items-center gap-3 text-xs">
                <button
                  onClick={refreshAdminPanel}
                  disabled={isAdminRefreshing}
                  className="px-3 py-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-indigo-500/20 text-indigo-650 dark:text-primary rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title={lang === 'ar' ? 'تحديث بيانات القسم الحالي' : 'Refresh current section'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAdminRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isAdminRefreshing ? (lang === 'ar' ? 'جارٍ التحديث' : 'Refreshing') : (lang === 'ar' ? 'تحديث' : 'Refresh')}</span>
                </button>
              {adminStats && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-4 py-2 bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20 text-indigo-650 dark:text-primary rounded-xl font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-primary animate-pulse" />
                    <span>{adminStats.unusedKeys} {lang === 'ar' ? 'مفتاح متاح' : 'keys available'}</span>
                  </span>
                  <span className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl font-bold">
                    {adminStats.totalUsers} {lang === 'ar' ? 'عميل مسجل' : 'registered users'}
                  </span>
                </div>
              )}
              </div>
            </div>

            {adminLoadError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center justify-between gap-3">
                <span>{adminLoadError}</span>
                <button onClick={refreshAdminPanel} className="underline underline-offset-4 hover:text-rose-500">{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
              </div>
            )}

            {/* Admin Sub-Tabs Navigation */}
            <div role="tablist" aria-label={lang === 'ar' ? 'أقسام لوحة الإدارة' : 'Admin sections'} className={`admin-navigation grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 bg-black/5 dark:bg-[#090b10] border ${styles.borderSubtle} rounded-2xl w-full`}>
              {[
                { id: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: Activity },
                { id: 'products', label: lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock', icon: Package },
                { id: 'customers', label: lang === 'ar' ? 'العملاء' : 'Customers', icon: Users },
                { id: 'help', label: lang === 'ar' ? 'مركز المساعدة' : 'Help center', icon: HelpCircle },
                { id: 'updates', label: lang === 'ar' ? 'تحديثات الموقع' : 'Website Updates', icon: Megaphone },
                { id: 'resetRequests', label: lang === 'ar' ? 'طلبات الريست' : 'Reset requests', icon: RefreshCw },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = adminSectionTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setAdminSectionTab(tab.id as any)}
                    className={`admin-navigation__item flex min-w-0 items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.textMuted} hover:${styles.textTitle} hover:bg-black/5 dark:hover:bg-white/5`
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <details className="relative"><summary className="cursor-pointer rounded-xl px-3 py-2 text-sm">{lang==='ar'?'المزيد':'More'}</summary><div className="absolute end-0 top-full z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-white/15 bg-[#101e29] p-2 shadow-lg">{[{id:'sitePresence',ar:'نشاط الموقع',en:'Site activity'},{id:'keys',ar:'بحث المفاتيح',en:'Key search'},{id:'logs',ar:'سجل النظام',en:'System log'}].map(item=><button key={item.id} aria-pressed={adminSectionTab===item.id} onClick={event=>{setAdminSectionTab(item.id as any);event.currentTarget.closest('details')?.removeAttribute('open')}} className="rounded-lg px-3 py-2 text-start text-xs text-slate-200 hover:bg-white/10">{lang==='ar'?item.ar:item.en}</button>)}</div></details>
            </div>

            {/* ==================== SUB-TAB 1: PRODUCTS & INVENTORY ==================== */}
            {adminSectionTab === 'products' && (
              <div className="admin-section space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${styles.textTitle} flex items-center gap-2`}>
                      <Package className="w-5 h-5 text-indigo-500 dark:text-sky-400" />
                      <span>{lang === 'ar' ? 'منتجات المتجر والمخزون المتاح' : 'Store Products & Available Stock'}</span>
                    </h3>
                    <div className={`text-xs ${styles.textMuted} font-medium`}>{lang === 'ar' ? 'انقر على أي منتج لفتحه وتعديله وتعبئة مفاتيحه' : 'Click on any product to modify or add license keys'}</div>
                  </div>
                  <button
                    onClick={openAddProductModal}
                    className="py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/10 flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة منتج جديد' : 'Add Product'}</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 border border-dashed border-indigo-500/20 dark:border-primary/20 bg-black/40 backdrop-blur-md rounded-[24px] text-center space-y-6 animate-slide-up">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20 flex items-center justify-center text-indigo-500 dark:text-primary shadow-lg shadow-indigo-500/5">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className={`text-base font-extrabold ${styles.textTitle}`}>
                        {lang === 'ar' ? 'لا توجد منتجات مضافة حتى الآن' : 'No Products Added Yet'}
                      </h4>
                      <p className={`text-xs ${styles.textMuted} leading-relaxed`}>
                        {lang === 'ar' 
                          ? 'ابدأ بإضافة منتجك الأول لربط مفاتيح التراخيص، وإدارة التحميلات والشروحات، وتفعيل رتب ديسكورد للعملاء تلقائياً.' 
                          : 'Add your first product to link license keys, manage downloads and guides, and auto-assign Discord roles.'}
                      </p>
                    </div>
                    <button
                      onClick={openAddProductModal}
                      className="py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-650 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-indigo-500/10 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إضافة منتج جديد الآن' : 'Add First Product'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="admin-product-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-slide-up">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="admin-product-card glass-card rounded-[24px] overflow-hidden hover:border-indigo-500/40 dark:hover:border-primary/40 transition-all duration-300 flex flex-col group"
                      >
                        {/* Top Image Banner - Full Width */}
                        <div className={`relative h-48 w-full bg-black/[0.02] dark:bg-[#050505] overflow-hidden border-b ${styles.borderSubtle}`}>
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full transition-transform duration-700 group-hover:scale-110 object-cover"
                            onError={(e) => { 
                              e.currentTarget.src = '/logo.png'; 
                              e.currentTarget.className = 'w-full h-full transition-transform duration-700 group-hover:scale-110 object-contain p-6 opacity-80'; 
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-[#0a0a0a] via-transparent to-transparent" />
                          
                          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-indigo-500/20 dark:border-primary/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{lang === 'ar' ? 'المخزون المتاح:' : 'Stock:'}</span>
                            <span className="text-xs font-black text-indigo-400 dark:text-primary">{product.stockKeysCount || 0}</span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 flex-1 flex flex-col">
                          {/* Title & Icon Row */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20 flex items-center justify-center shrink-0 shadow-sm`}>
                              <Package className="w-6 h-6 text-indigo-650 dark:text-primary" />
                            </div>
                            <div>
                              <h3 className={`font-extrabold ${styles.textTitle} text-lg leading-tight tracking-wide group-hover:text-indigo-650 dark:group-hover:text-primary transition-colors`}>{product.name}</h3>
                              <div className={`text-[11px] ${styles.textMuted} mt-1 flex items-center gap-2 font-mono`}>
                                <span className="text-indigo-600 dark:text-primary font-bold bg-indigo-500/10 dark:bg-primary/10 px-2 py-0.5 rounded-md border border-indigo-500/20 dark:border-primary/20">{product.version}</span>
                                <span className="text-slate-400">·</span>
                                <span className={`font-bold ${styles.textTitle}`}>{product.category}</span>
                              </div>
                            </div>
                          </div>

                          <p className={`text-sm ${styles.textMuted} leading-relaxed line-clamp-2 mb-6 flex-1`}>
                            {product.description}
                          </p>

                          {/* Action Buttons Row */}
                          <div className="grid grid-cols-2 gap-3 mt-auto">
                            <button
                              onClick={() => openInventoryModal(product, 'keys')}
                              className="py-3 px-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white dark:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-indigo-500/20"
                            >
                              <Key className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'إضافة مفاتيح' : 'Add Keys'}</span>
                            </button>

                            <button
                              onClick={() => openInventoryModal(product, 'details')}
                              className={`py-3 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border ${styles.borderNormal} rounded-xl text-xs font-bold ${styles.textTitle} transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5`}
                            >
                              <Edit3 className={`w-4 h-4 ${styles.textMuted}`} />
                              <span>{lang === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== SUB-TAB 2: CUSTOMERS MANAGEMENT ==================== */}
            {adminSectionTab === 'customers' && (
              <div className="space-y-4 animate-slide-up">
                <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className={`text-lg font-black ${styles.textTitle} flex items-center gap-2`}>
                      <Users className="w-5 h-5 text-indigo-500 dark:text-primary" />
                      <span>{lang === 'ar' ? 'قائمة العملاء وإدارة الاشتراكات' : 'Customers list & subscriptions'}</span>
                    </h3>

                    {/* Search Bar for Customers */}
                    <div className="relative w-full md:w-80">
                      <Search className={`w-4 h-4 absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-3.5 ${styles.textMuted}`} />
                      <input
                        type="text"
                        value={searchCustomerQuery}
                        onChange={(e) => setSearchCustomerQuery(e.target.value)}
                        placeholder={lang === 'ar' ? 'ابحث باسم العميل أو إيميله أو Discord ID...' : 'Search by name, email, or Discord ID...'}
                        className={`w-full ${styles.bgInnerCard} border ${styles.borderNormal} focus:border-indigo-500/50 dark:focus:border-primary/50 rounded-xl ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-xs ${styles.textTitle} placeholder:${styles.textLightMuted} focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:focus:ring-primary/30 transition-all shadow-inner`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className={`border-b ${styles.borderNormal} ${styles.textMuted} font-bold`}>
                          <th className="pb-3.5 pr-2">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'البريد / Discord' : 'Email / Discord'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'الرتبة' : 'Role'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'عنوان IP' : 'IP Address'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'الإجراءات والاشتراكات' : 'Actions & Licenses'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${styles.borderSubtle}`}>
                        {allCustomersList
                          .filter(
                            (u) =>
                              !searchCustomerQuery ||
                              u.name?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                              u.email?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                              u.discordId?.includes(searchCustomerQuery)
                          )
                          .map((customer) => (
                            <tr key={customer.id} className={`${styles.textTitle} hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors duration-150`}>
                              <td className="py-3.5 pr-2 font-bold flex items-center gap-2">
                                <img
                                  src={customer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                  alt={customer.name}
                                  className={`w-8 h-8 rounded-full border ${styles.borderNormal} ${isDark ? 'grayscale' : ''}`}
                                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                                />
                                <div>
                                  <div className="font-extrabold">{customer.name}</div>
                                  <div className={`text-[10px] ${styles.textLightMuted} font-mono`}>ID: {customer.id}</div>
                                </div>
                              </td>
                              <td className={`py-3.5 ${styles.textTitle}`}>
                                <div className="font-medium">{customer.email || (lang === 'ar' ? 'لا يوجد إيميل' : 'No email')}</div>
                                <div className="text-[10px] text-indigo-500 dark:text-primary font-mono">Discord: {customer.discordId}</div>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${customer.role === 'Boss' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent'}`}>
                                  {customer.role}
                                </span>
                              </td>
                              <td className={`py-3.5 font-mono text-[11px] ${styles.textMuted}`}>{customer.lastIp || '127.0.0.1'}</td>
                              <td className="py-3.5 space-y-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openCustomerModal(customer)}
                                    className="px-3 py-1.5 bg-indigo-500/10 dark:bg-primary/10 hover:bg-indigo-500/25 dark:hover:bg-primary/20 border border-indigo-500/30 dark:border-primary/30 rounded-lg text-[10px] font-black text-indigo-600 dark:text-primary transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                                    title={lang === 'ar' ? 'عرض تفاصيل العميل وإدارة اشتراكاته ومفاتيحه' : 'View customer profile and manage licenses'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{lang === 'ar' ? 'إدارة العميل' : 'Manage'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUserAccount(customer.id, customer.name)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-lg transition-colors cursor-pointer hover:scale-[1.02]"
                                    title={lang === 'ar' ? 'حذف العميل نهائياً' : 'Delete user permanently'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {adminSectionTab === 'sitePresence' && (
              <SitePresenceAdmin lang={lang} isDark={isDark} />
            )}


            {adminSectionTab === 'updates' && (
              <SiteUpdatesAdmin lang={lang} isDark={isDark} onNotify={showToast} />
            )}

            {adminSectionTab === 'resetRequests' && (
              <div className="animate-slide-up">
                <ResetKeyRequestsAdmin lang={lang} isDark={isDark} onNotify={showToast} />
              </div>
            )}

            {/* ==================== SUB-TAB 4: SEARCH ALL KEYS ==================== */}
            {adminSectionTab === 'keys' && (
              <div className="space-y-4 animate-slide-up">
                <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className={`text-lg font-black ${styles.textTitle} flex items-center gap-2`}>
                      <Key className="w-5 h-5 text-indigo-500 dark:text-primary" />
                      <span>{lang === 'ar' ? 'البحث الشامل وتفتيش المفاتيح في النظام' : 'Global system keys audit'}</span>
                    </h3>

                    {/* Key Search Input */}
                    <div className="relative w-full md:w-80">
                      <Search className={`w-4 h-4 absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-3.5 ${styles.textMuted}`} />
                      <input
                        type="text"
                        value={searchKeysQuery}
                        onChange={(e) => setSearchKeysQuery(e.target.value)}
                        placeholder={lang === 'ar' ? 'ابحث بكود المفتاح (e.g. T3N-FORT...)...' : 'Search key code...'}
                        className={`w-full ${styles.bgInnerCard} border ${styles.borderNormal} focus:border-indigo-500/50 dark:focus:border-primary/50 rounded-xl ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-xs ${styles.textTitle} placeholder:${styles.textLightMuted} focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:focus:ring-primary/30 transition-all font-mono shadow-inner`}
                      />
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setKeyStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'all' ? 'bg-indigo-600 text-white dark:bg-primary dark:text-black font-extrabold shadow-sm' : `bg-black/5 dark:bg-white/5 border ${styles.borderNormal} ${styles.textMuted} hover:bg-black/10 dark:hover:bg-white/10`}`}
                    >
                      {lang === 'ar' ? 'الكل' : 'All'} ({allKeysList.length})
                    </button>
                    <button
                      onClick={() => setKeyStatusFilter('unused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'unused' ? 'bg-indigo-600 text-white dark:bg-primary dark:text-black font-extrabold shadow-sm' : `bg-black/5 dark:bg-white/5 border ${styles.borderNormal} ${styles.textMuted} hover:bg-black/10 dark:hover:bg-white/10`}`}
                    >
                      {lang === 'ar' ? 'متاح فقط' : 'Available only'} ({allKeysList.filter((k) => !k.isUsed).length})
                    </button>
                    <button
                      onClick={() => setKeyStatusFilter('used')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'used' ? 'bg-indigo-600 text-white dark:bg-primary dark:text-black font-extrabold shadow-sm' : `bg-black/5 dark:bg-white/5 border ${styles.borderNormal} ${styles.textMuted} hover:bg-black/10 dark:hover:bg-white/10`}`}
                    >
                      {lang === 'ar' ? 'مستعمل' : 'Used'} ({allKeysList.filter((k) => k.isUsed).length})
                    </button>
                  </div>

                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-right text-xs font-mono">
                      <thead>
                        <tr className={`border-b ${styles.borderNormal} ${styles.textMuted} font-sans font-bold`}>
                          <th className="pb-3.5 pr-2">{lang === 'ar' ? 'الكود (Key)' : 'Key'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'المنتج المرتبط' : 'Associated Product'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'المدة' : 'Duration'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'المستخدم' : 'Used By'}</th>
                          <th className="pb-3.5">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                          <th className={`pb-3.5 ${lang === 'ar' ? 'text-left pl-2' : 'text-right pr-2'}`}>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${styles.borderSubtle}`}>
                        {allKeysList
                          .filter((k) => {
                            if (keyStatusFilter === 'unused' && k.isUsed) return false;
                            if (keyStatusFilter === 'used' && !k.isUsed) return false;
                            if (!searchKeysQuery) return true;
                            return k.key.toLowerCase().includes(searchKeysQuery.toLowerCase());
                          })
                          .map((keyObj) => (
                            <tr key={keyObj.id} className={`${styles.textTitle} hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors duration-150`}>
                              <td className="py-3.5 pr-2 font-bold text-indigo-500 dark:text-primary select-all">{keyObj.key}</td>
                              <td className={`py-3.5 font-sans ${styles.textTitle} font-semibold`}>
                                {products.find((p) => p.id === keyObj.productId)?.name || keyObj.productId}
                              </td>
                              <td className={`py-3.5 font-sans ${styles.textMuted} text-[11px] font-bold`}>
                                {durationLabel(keyObj.duration, lang)}
                              </td>
                              <td className="py-3.5 font-sans">
                                {keyObj.isUsed ? (
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold border border-slate-200 dark:border-transparent">
                                    {lang === 'ar' ? 'مستعمل' : 'Used'}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold">
                                    {lang === 'ar' ? 'متاح' : 'Available'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 font-sans text-indigo-600 dark:text-primary font-semibold text-xs">
                                {keyObj.isUsed ? (
                                  allCustomersList.find((u: any) => u.id === keyObj.usedByUserId)?.name || 
                                  allCustomersList.find((u: any) => u.id === keyObj.usedByUserId)?.discordId || 
                                  (lang === 'ar' ? 'مستخدم غير معروف' : 'Unknown User')
                                ) : (
                                  <span className={`${styles.textLightMuted} font-mono`}>-</span>
                                )}
                              </td>
                              <td className={`py-3.5 ${styles.textMuted} text-[11px]`}>
                                {new Date(keyObj.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                              </td>
                              <td className={`py-3.5 font-sans flex items-center ${lang === 'ar' ? 'justify-end pl-2' : 'justify-start pr-2'} gap-2`}>
                                {keyObj.isUsed && (
                                  <button
                                    onClick={() => handleRevokeAndBan(keyObj.usedByUserId, keyObj.id)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    title={lang === 'ar' ? 'حظر المستخدم وإلغاء المفتاح' : 'Revoke key and ban user'}
                                  >
                                    {lang === 'ar' ? 'إلغاء وحظر' : 'Revoke & Ban'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteKey(keyObj.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-bold text-rose-500 transition-all cursor-pointer hover:scale-105"
                                >
                                  {lang === 'ar' ? 'حذف' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB 4: SYSTEM AUDIT LOGS ==================== */}
            {adminSectionTab === 'logs' && (
              <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6 animate-slide-up">
                <h3 className={`text-lg font-black ${styles.textTitle} flex items-center gap-2`}>
                  <FileText className="w-5 h-5 text-indigo-500 dark:text-primary" />
                  <span>{lang === 'ar' ? 'سجلات الأمان والنشاط المباشرة (System Audit Logs)' : 'Live security audit logs'}</span>
                </h3>

                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[.05] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span>
                    <div>
                      <p className="text-xs font-black text-emerald-500">{lang === 'ar' ? 'مراقبة مباشرة مفعلة' : 'Live monitoring enabled'}</p>
                      <p className={`mt-0.5 text-[10px] ${styles.textMuted}`}>{lang === 'ar' ? 'يتم تحديث السجلات تلقائياً وإرسال الأحداث الخاصة إلى قناة Discord السرية.' : 'Logs refresh automatically and private events are forwarded to Discord.'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className={`rounded-lg border ${styles.borderNormal} px-2.5 py-1.5 ${styles.textMuted}`}>{visibleAdminLogs.length} {lang === 'ar' ? 'ظاهر' : 'visible'}</span>
                    <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-500">Discord • private audit</span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="relative block">
                    <Search className={`pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 ${styles.textMuted}`} />
                    <input value={adminLogQuery} onChange={(event) => setAdminLogQuery(event.target.value)} placeholder={lang === 'ar' ? 'ابحث في الحدث أو التفاصيل أو المستخدم أو IP...' : 'Search action, details, user, or IP...'} className={`h-11 w-full rounded-xl border ${styles.borderNormal} ${styles.bgInnerCard} ps-10 pe-3 text-xs ${styles.textTitle} outline-none focus:border-emerald-400`} />
                  </label>
                  <select value={adminLogAction} onChange={(event) => setAdminLogAction(event.target.value)} className={`h-11 rounded-xl border ${styles.borderNormal} ${styles.bgInnerCard} px-3 text-xs ${styles.textTitle} outline-none focus:border-emerald-400`}>
                    <option value="all">{lang === 'ar' ? 'كل الأحداث' : 'All events'}</option>
                    {adminLogActions.map((action) => <option key={action} value={action}>{action}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto scrollbar-none">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className={`border-b ${styles.borderNormal} ${styles.textMuted} font-bold`}>
                        <th className="pb-4">{lang === 'ar' ? 'الحدث' : 'Action'}</th>
                        <th className="pb-4">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                        <th className="pb-4">{lang === 'ar' ? 'المستخدم / Discord' : 'User / Discord'}</th>
                        <th className="pb-4">{lang === 'ar' ? 'عنوان IP' : 'IP Address'}</th>
                        <th className="pb-4">{lang === 'ar' ? 'التوقيت' : 'Time'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.borderSubtle}`}>
                      {visibleAdminLogs.map((log) => {
                        const logUser = allCustomersList.find(c => c.id === log.userId || c.discordId === log.discordId);
                        const logAvatar = logUser?.image || 'https://cdn.discordapp.com/embed/avatars/0.png';
                        const logRole = logUser?.role || 'Guest';
                        
                        // Custom Action Badge Style
                        let actionBadgeClass = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
                        if (log.action.includes('Register') || log.action.includes('Activation') || log.action.includes('Login')) {
                          actionBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        } else if (log.action.includes('Grant') || log.action.includes('Add')) {
                          actionBadgeClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                        } else if (log.action.includes('Warn') || log.action.includes('Update')) {
                          actionBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                        } else if (log.action.includes('Ban') || log.action.includes('Revoke') || log.action.includes('Delete')) {
                          actionBadgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                        }

                        return (
                          <tr key={log.id} className={`${styles.textTitle} hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors duration-200`}>
                            <td className="py-4 font-extrabold pr-2">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide ${actionBadgeClass}`}>
                                {lang === 'ar' ? ({ 'Key Started': 'بدء مدة المنتج', 'Key Activation': 'تفعيل مفتاح', 'Stock Keys Added': 'إضافة مفاتيح للمخزون', 'Login': 'تسجيل الدخول', 'Register': 'تسجيل حساب' } as Record<string, string>)[log.action] || log.action : log.action}
                              </span>
                            </td>
                            <td className="py-4 font-medium text-slate-350 max-w-xs truncate" title={log.details}>
                              {log.details}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={logAvatar}
                                  alt={log.userName || 'User'}
                                  className="w-7 h-7 rounded-full border border-white/5 object-cover"
                                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                                />
                                <div>
                                  <div className="font-extrabold text-[12px] flex items-center gap-1.5">
                                    <span>{log.userName || logUser?.name || (lang === 'ar' ? 'زائر' : 'Guest')}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${logRole === 'Boss' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                                      {logRole}
                                    </span>
                                  </div>
                                  {logUser?.discordId && (
                                    <div className="text-[9px] text-slate-500 font-mono">ID: {logUser.discordId}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 font-mono text-[11px] ${styles.textMuted}`}>{log.ipAddress}</td>
                            <td className={`py-4 ${styles.textMuted} font-medium`}>
                              {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                      {visibleAdminLogs.length === 0 && (
                        <tr><td colSpan={5} className={`py-12 text-center text-sm ${styles.textMuted}`}>{lang === 'ar' ? 'لا توجد سجلات مطابقة للبحث الحالي.' : 'No audit events match the current filters.'}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB 5: OVERVIEW & STATS ==================== */}
            {adminSectionTab === 'overview' && adminStats && (
              <div className="space-y-6">
                {/* Primary Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="admin-stat-card glass-card rounded-[20px] p-6 relative overflow-hidden group transition-colors duration-200">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className={`text-xs ${styles.textMuted} mb-2 font-bold uppercase tracking-wider`}>{lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}</div>
                        <div className={`text-3xl font-black ${styles.textTitle}`}>{adminStats.totalUsers}</div>
                      </div>
                      <div className={`p-3 ${styles.bgInnerCard} rounded-xl border ${styles.borderNormal} group-hover:scale-110 transition-transform`}>
                        <Users className="w-6 h-6 text-indigo-500 dark:text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="admin-stat-card glass-card rounded-[20px] p-6 relative overflow-hidden group transition-colors duration-200">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className={`text-xs ${styles.textMuted} mb-2 font-bold uppercase tracking-wider`}>{lang === 'ar' ? 'المفاتيح المتاحة' : 'Available Keys'}</div>
                        <div className="text-3xl font-black text-indigo-500 dark:text-primary">{adminStats.unusedKeys}</div>
                      </div>
                      <div className={`p-3 ${styles.bgInnerCard} rounded-xl border ${styles.borderNormal} group-hover:scale-110 transition-transform`}>
                        <Key className="w-6 h-6 text-indigo-500 dark:text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="admin-stat-card glass-card rounded-[20px] p-6 relative overflow-hidden group transition-colors duration-200">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className={`text-xs ${styles.textMuted} mb-2 font-bold uppercase tracking-wider`}>{lang === 'ar' ? 'المنتجات النشطة' : 'Active Products'}</div>
                        <div className={`text-3xl font-black ${styles.textTitle}`}>{adminStats.activeProducts}</div>
                      </div>
                      <div className={`p-3 ${styles.bgInnerCard} rounded-xl border ${styles.borderNormal} group-hover:scale-110 transition-transform`}>
                        <Package className="w-6 h-6 text-indigo-500 dark:text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="admin-stat-card glass-card rounded-[20px] p-6 relative overflow-hidden group transition-colors duration-200">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className={`text-xs ${styles.textMuted} mb-2 font-bold uppercase tracking-wider`}>{lang === 'ar' ? 'إجمالي التحميلات' : 'Total Downloads'}</div>
                        <div className={`text-3xl font-black ${styles.textTitle}`}>{adminStats.totalDownloads}</div>
                      </div>
                      <div className={`p-3 ${styles.bgInnerCard} rounded-xl border ${styles.borderNormal} group-hover:scale-110 transition-transform`}>
                        <Download className="w-6 h-6 text-indigo-500 dark:text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Row: Recent Activity & Quick Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {/* Recent Logs Summary */}
                  <div className="glass-card rounded-[24px] p-6 space-y-6">
                    <div className={`flex items-center justify-between border-b ${styles.borderNormal} pb-4`}>
                      <h3 className={`font-extrabold ${styles.textTitle} flex items-center gap-2`}>
                        <Activity className="w-5 h-5 text-indigo-500 dark:text-primary" />
                        {lang === 'ar' ? 'آخر الأنشطة في المنصة' : 'Recent platform activity'}
                      </h3>
                      <button onClick={() => setAdminSectionTab('logs')} className="text-[11px] text-indigo-650 dark:text-primary hover:text-indigo-500 dark:hover:text-primary-hover font-bold transition-colors uppercase tracking-wider cursor-pointer">
                        {lang === 'ar' ? 'عرض الكل' : 'View all'} &rarr;
                      </button>
                    </div>
                    <div className="space-y-3">
                      {adminLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className={`flex items-center gap-4 p-3 ${styles.bgInnerCard} rounded-xl border ${styles.borderSubtle} hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}>
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-primary/10 flex items-center justify-center shrink-0 border border-indigo-500/20 dark:border-primary/20">
                            <UserCheck className="w-4 h-4 text-indigo-500 dark:text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold ${styles.textTitle} truncate`}>{lang === 'ar' ? ({ 'Key Started': 'بدء مدة المنتج', 'Key Activation': 'تفعيل مفتاح', 'Stock Keys Added': 'إضافة مفاتيح للمخزون', 'Login': 'تسجيل الدخول', 'Register': 'تسجيل حساب' } as Record<string, string>)[log.action] || log.action : log.action}</div>
                            <div className={`text-xs ${styles.textMuted} truncate mt-0.5`}>{log.details}</div>
                          </div>
                          <div className={`text-[10px] ${styles.textMuted} font-mono shrink-0 bg-black/5 dark:bg-black/40 px-2 py-1 rounded-md`}>
                            {new Date(log.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                      {adminLogs.length === 0 && (
                        <div className={`text-center text-sm ${styles.textMuted} py-6`}>{lang === 'ar' ? 'لا توجد أنشطة مسجلة مؤخراً' : 'No recent activities'}</div>
                      )}
                    </div>
                  </div>

                  {/* Quick System Status */}
                  <div className="glass-card rounded-[24px] p-6 space-y-6">
                    <div className={`border-b ${styles.borderNormal} pb-4`}>
                      <h3 className={`font-extrabold ${styles.textTitle} flex items-center gap-2`}>
                        <Sparkles className="w-5 h-5 text-indigo-500 dark:text-primary" />
                        {lang === 'ar' ? 'حالة النظام والإشعارات' : 'System status & notifications'}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl group hover:bg-emerald-500/20 transition-colors text-emerald-600 dark:text-emerald-500">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold">{lang === 'ar' ? 'النظام يعمل بكفاءة' : 'System Operational'}</div>
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">{lang === 'ar' ? 'لا توجد مشاكل حالية في الخوادم.' : 'All servers are running smoothly.'}</div>
                          </div>
                        </div>
                      </div>

                      {adminStats.unusedKeys < 5 && (
                        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl group hover:bg-amber-500/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <HelpCircle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-sans">{lang === 'ar' ? 'تنبيه: انخفاض المخزون' : 'Warning: Low Stock'}</div>
                              <div className={`text-xs ${styles.textMuted} mt-1`}>{lang === 'ar' ? 'بعض المنتجات على وشك النفاد من المفاتيح.' : 'Some products are running out of keys.'}</div>
                            </div>
                          </div>
                          <button onClick={() => setAdminSectionTab('products')} className="px-4 py-2 bg-amber-500/25 hover:bg-amber-500/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer">
                            {lang === 'ar' ? 'إدارة المخزون' : 'Manage stock'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB: HELP CENTER & FAQS ==================== */}
            {adminSectionTab === 'help' && (
              <div className="admin-section space-y-4">
                <HelpAdminSection lang={lang} isDark={isDark} onNotify={showToast} />
              </div>
            )}
          </div>
        )}

        {/* SITE FOOTER */}
        {(activeTab === 'overview' || activeTab === 'my-products') && (
          <div className="mt-auto pt-8 sm:pt-10">
            <Footer lang={lang} isDark={isDark} onNavigate={setActiveTab} />
          </div>
        )}
        </div>
      </main>

      {/* ====================================================================
          INVENTORY MODAL (Exact Design from User Screenshot)
          Shows: بيانات المنتج | الحقول المخصصة | الأكواد المتاحة
          Each key as a card with delete button
         ==================================================================== */}
      {/* ====================================================================
          PRODUCT STOCK MANAGEMENT MODAL (Enterprise Dark Premium)
          ==================================================================== */}
      {inventoryModalOpen && inventoryProduct && (
        <ProductStockModal
          isOpen={inventoryModalOpen}
          product={inventoryProduct}
          initialTab={inventoryInitialTab}
          lang={lang}
          onClose={() => {
            setInventoryModalOpen(false);
            setInventoryProduct(null);
          }}
          onProductUpdated={(updated) => {
            if (inventoryProduct?.id === 'new') setInventoryProduct(updated);
            setProducts((current) =>
              current.some((p) => p.id === updated.id)
                ? current.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                : [...current, updated]
            );
            loadDbProducts();
            loadAdminStats();
          }}
        />
      )}

      
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* GUIDE MODAL */}
      {/* ------------------------------------------------------------------------------------------------ */}
      {resetRequestProduct && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <button className="absolute inset-0 bg-[#020712]/[.82] backdrop-blur-[7px]" aria-label={lang === 'ar' ? 'إغلاق' : 'Close'} onClick={() => { if (!isSubmittingResetRequest) { setResetRequestProduct(null); setResetRequestReason(''); } }} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-amber-200/[.18] bg-[linear-gradient(145deg,#101a2a_0%,#09111f_62%,#070d18_100%)] shadow-[0_30px_100px_rgba(0,0,0,.62)]">
            <div className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-amber-300/[.12] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-cyan-400/[.08] blur-3xl" />
            <div className={`relative flex items-start justify-between gap-4 border-b border-white/[.07] px-5 py-5 sm:px-6 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-200/[.22] bg-[linear-gradient(145deg,rgba(251,191,36,.20),rgba(245,158,11,.06))] text-amber-100 shadow-[0_10px_26px_rgba(245,158,11,.12)]"><RefreshCw size={21} /></div>
                <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="text-[15px] font-black tracking-tight text-white">{lang === 'ar' ? 'طلب رستات المفتاح' : 'Request key reset'}</h3><span className="rounded-full border border-amber-200/[.16] bg-amber-300/[.08] px-2 py-0.5 text-[8px] font-black tracking-[.08em] text-amber-100">{lang === 'ar' ? 'إعادة ضبط' : 'RESET'}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-400">{lang === 'ar' ? 'اكتب سبباً واضحاً ليتمكن الفريق من مراجعة الطلب.' : 'Describe the reason clearly so the team can review it.'}</p></div>
              </div>
              <button onClick={() => { if (!isSubmittingResetRequest) { setResetRequestProduct(null); setResetRequestReason(''); } }} disabled={isSubmittingResetRequest} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.09] bg-white/[.04] text-slate-400 transition hover:border-white/[.16] hover:bg-white/[.08] hover:text-white disabled:opacity-45"><X size={16} /></button>
            </div>
            <div className="relative space-y-4 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-black/[.16] px-3.5 py-3"><div className="min-w-0"><p className="text-[9px] font-black tracking-[.12em] text-slate-500">{lang === 'ar' ? 'المنتج المرتبط بالطلب' : 'PRODUCT'}</p><p className="mt-1 truncate text-xs font-black text-slate-100">{resetRequestProduct.product?.name || resetRequestProduct.productId}</p></div><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-200/[.12] bg-cyan-300/[.06] text-cyan-200"><RefreshCw size={14} /></div></div>
              <div><div className="mb-2 flex items-center justify-between gap-3"><label className="text-[11px] font-black text-slate-200">{lang === 'ar' ? 'سبب طلب الرستات' : 'Reason for reset'}</label><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${resetRequestReason.length >= 3 ? 'bg-emerald-400/[.09] text-emerald-200' : 'bg-white/[.05] text-slate-500'}`}>{resetRequestReason.length}/500</span></div><textarea value={resetRequestReason} onChange={(event) => setResetRequestReason(event.target.value)} maxLength={500} placeholder={lang === 'ar' ? 'مثال: تم تغيير الجهاز وأحتاج رستات للترخيص.' : 'Example: I changed my device and need a license reset.'} className="min-h-[126px] w-full resize-none rounded-2xl border border-white/[.09] bg-[#050b15]/70 p-3.5 text-xs leading-6 text-white shadow-inner outline-none transition placeholder:text-slate-600 focus:border-amber-200/[.42] focus:bg-[#07101d] focus:ring-4 focus:ring-amber-300/[.055]" /></div>
              <div className="flex items-start gap-2 rounded-xl border border-cyan-200/[.09] bg-cyan-300/[.045] px-3 py-2.5 text-[10px] leading-5 text-slate-400"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,.85)]" />{lang === 'ar' ? 'سيظهر الطلب للإدارة مع المفتاح وبيانات الحساب للمراجعة فقط.' : 'Staff will see this request with the key and account details for review only.'}</div>
            </div>
            <div className="relative flex flex-col-reverse gap-2 border-t border-white/[.07] bg-black/[.12] px-5 py-4 sm:flex-row sm:px-6"><button onClick={() => { if (!isSubmittingResetRequest) { setResetRequestProduct(null); setResetRequestReason(''); } }} disabled={isSubmittingResetRequest} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[.09] text-[11px] font-black text-slate-300 transition hover:bg-white/[.06] disabled:opacity-45">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button><button disabled={isSubmittingResetRequest || resetRequestReason.trim().length < 3} onClick={() => void submitResetRequest()} className="inline-flex h-11 flex-[1.45] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fcd34d,#f59e0b)] text-[11px] font-black text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,.20)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-0 active:scale-[.985]">{isSubmittingResetRequest ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />}{isSubmittingResetRequest ? (lang === 'ar' ? 'جارٍ إرسال الطلب...' : 'Sending request...') : (lang === 'ar' ? 'إرسال طلب الرستات' : 'Send reset request')}</button></div>
          </div>
        </div>
      )}

      {guideModalProduct && guideView && !getLicenseTiming(guideModalProduct).isExpired && (
        <GuideDialog
          title={selectedGuideIssue?.title || guideTitle}
          eyebrow={lang === 'ar' ? 'دليل المنتج' : 'Product guide'}
          onClose={() => { setGuideModalProduct(null); setGuideView(null); }}
        >
          <nav className="product-guide-tabs" aria-label={lang === 'ar' ? 'أقسام دليل المنتج' : 'Product guide sections'}>
            <button type="button" aria-current={guideView === 'notice' || guideView === 'video' ? 'page' : undefined} onClick={() => { setGuideView('notice'); setGuideIssueId(null); }}><Play size={16} />{lang === 'ar' ? 'شرح المنتج' : 'Product video'}</button>
            <button type="button" aria-current={guideView === 'format' ? 'page' : undefined} onClick={() => { setGuideView('format'); setGuideIssueId(null); }}><Laptop size={16} />{lang === 'ar' ? 'فورمات الفلاشة' : 'Prepare USB'}</button>
            <button type="button" aria-current={guideView === 'issues' ? 'page' : undefined} onClick={() => setGuideView('issues')}><HelpCircle size={16} />{lang === 'ar' ? 'حل المشاكل' : 'Troubleshooting'}</button>
            <button type="button" aria-current={guideView === 'wrp' ? 'page' : undefined} onClick={() => { setGuideView('wrp'); setGuideIssueId(null); }}><Download size={16} />WRP</button>
          </nav>
          {guideView === 'notice' ? (
            <div className="product-guide-intro">
              <div className="product-guide-intro__icon"><Info size={24} aria-hidden="true" /></div>
              <h3>{lang === 'ar' ? 'تنويه قبل المتابعة' : 'Before you continue'}</h3>
              <p>{lang === 'ar' ? 'شاهد شرح المنتج كاملًا واتبع الخطوات بالترتيب قبل استخدامه.' : 'Watch the full product video and follow each step in order before use.'}</p>
              {guideModalProduct.product?.videoUrl ? (
                <button type="button" onClick={() => setGuideView('video')}>
                  <Play size={17} fill="currentColor" />{lang === 'ar' ? 'متابعة إلى الفيديو' : 'Continue to video'}
                </button>
              ) : (
                <p role="status" className="product-guide-intro__unavailable">{lang === 'ar' ? 'لم تتم إضافة فيديو شرح لهذا المنتج بعد.' : 'A guide video has not been added for this product yet.'}</p>
              )}
            </div>
          ) : guideView === 'video' && guideModalProduct.product?.videoUrl ? (
            <div className="product-guide-video">
              <GuideVideo
                url={guideModalProduct.product.videoUrl.includes('drive.google.com') ? DIRECT_TUTORIAL_VIDEO_URL : guideModalProduct.product.videoUrl}
                title={guideTitle}
                image={guideModalProduct.product.guideImage || guideModalProduct.product.image}
                hideCaption
              />
            </div>
          ) : guideView === 'format' ? (
            <section className="product-guide-section">
              <div className="product-guide-section__heading"><h3>{lang === 'ar' ? 'تجهيز فلاش Windows' : 'Prepare a Windows USB'}</h3><p>{lang === 'ar' ? 'اختر نسخة Windows المناسبة، ثم شاهد شرح تجهيز الفلاشة.' : 'Choose your Windows version, then watch the USB preparation guide.'}</p></div>
              <div className="product-guide-format-options">
                {([{ id: 'win11', label: 'Windows 11' }, { id: 'win10', label: 'Windows 10' }] as const).map(item => (
                  <button key={item.id} type="button" aria-pressed={guideFlashVersion === item.id} onClick={() => setGuideFlashVersion(item.id)}><Laptop size={19} /><span>{item.label}</span><Play size={15} /></button>
                ))}
              </div>
              {guideFlashVersion && <GuideVideo key={guideFlashVersion} url={guideFlashVersion === 'win11' ? 'https://youtu.be/XZ-9RbqlA2k' : 'https://youtu.be/WaFxvUmsNWs'} title={guideFlashVersion === 'win11' ? 'تجهيز فلاش Windows 11' : 'تجهيز فلاش Windows 10'} hideCaption />}
            </section>
          ) : guideView === 'issues' ? (
            selectedGuideIssue ? <div className="product-guide-section"><button type="button" className="product-guide-back" onClick={() => setGuideIssueId(null)}><ArrowRight size={16} />{lang === 'ar' ? 'العودة إلى حلول المشاكل' : 'Back to solutions'}</button><GuideArticleView key={selectedGuideIssue.id} article={selectedGuideIssue} product={guideModalProduct.product} /></div>
              : <section className="product-guide-section"><div className="product-guide-section__heading"><h3>{lang === 'ar' ? 'حل المشاكل' : 'Troubleshooting'}</h3><p>{lang === 'ar' ? 'اختر المشكلة المطابقة لما يظهر على جهازك.' : 'Choose the issue that matches what you see on your device.'}</p></div><div className="product-guide-issues">{guideIssues.map((article, index) => <GuideCard key={article.id} article={article} number={index + 1} onOpen={() => setGuideIssueId(article.id)} />)}</div></section>
          ) : guideView === 'wrp' ? (
            <section className="product-guide-section product-guide-wrp">
              <div className="product-guide-section__heading"><h3>WRP</h3><p>{lang === 'ar' ? 'إذا أكملت جميع خطوات الدليل وما زال الطرد أو الحظر قائمًا، اتبع هذه الخطوات بالترتيب.' : 'If you completed every guide step and are still kicked or banned, follow these steps in order.'}</p></div>
              <GuideVideo url="/guides/wrp-guide.mp4" title="WRP" image="/guides/wrp-guide-thumb.jpg" hideCaption />
              <ol className="product-guide-wrp__steps">
                {(lang === 'ar' ? [
                  'حمّل WRP من الرابط أدناه، واتركه متوقفًا في هذه المرحلة.',
                  'أعد تنفيذ جميع خطوات دليل المنتج من البداية.',
                  'شغّل WRP قبل دخول اللعبة مباشرة.',
                  'ادخل بحساب جديد أو غير محظور والعب به لمدة 3 أيام، ثم تحقّق من حالة الحظر.',
                ] : [
                  'Download WRP below, but leave it off for now.',
                  'Repeat every step in the product guide from the beginning.',
                  'Turn on WRP just before entering the game.',
                  'Use a new or unbanned account for 3 days, then check the ban status.',
                ]).map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}
              </ol>
              <a className="product-guide-wrp__download" href="https://downloads.cloudflareclient.com/v1/download/windows/ga" target="_blank" rel="noopener noreferrer"><Download size={17} />{lang === 'ar' ? 'تحميل WRP' : 'Download WRP'}</a>
            </section>
          ) : null}
        </GuideDialog>
      )}
      {/* CUSTOMER MANAGEMENT MODAL (ADMIN ONLY) */}
      {selectedAdminCustomer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-[#0b0c0e]/95 border border-white/[0.08] rounded-[28px] p-6 md:p-8 max-w-4xl w-full relative shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedAdminCustomer(null);
                setSelectedCustomerProducts([]);
              }}
              className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} p-2.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 cursor-pointer z-10`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Grid Layout: Left Column (7/12) and Right Column (5/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
              
              {/* LEFT COLUMN: PRODUCTS & KEYS (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* SECTION 1: ACTIVE PRODUCTS / SUBSCRIPTIONS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                    <span>{lang === 'ar' ? 'الاشتراكات والمنتجات النشطة' : 'Active Products & Subscriptions'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
                    {selectedCustomerProducts.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomerProducts.map((userProd) => {
                          const originalProd = products.find(p => p.id === userProd.productId);
                          const activatedKey = allKeysList.find((key) => key.usedByUserId === selectedAdminCustomer.id && key.productId === userProd.productId);
                          const expiresAt = userProd.expiresAt ? new Date(userProd.expiresAt) : null;
                          const isActiveLicense = userProd.status === 'Active' && (!expiresAt || expiresAt.getTime() > Date.now());
                          return (
                            <div key={userProd.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-4 shadow-inner shadow-black/10 transition-all hover:border-cyan-200/[0.16]">
                              <div className="space-y-1">
                                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                                  <span>{originalProd?.name || userProd.productId}</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="text-[11px] text-neutral-400 flex flex-wrap gap-x-3 font-medium">
                                  <span>{lang === 'ar' ? 'تاريخ التفعيل:' : 'Activated:'} {new Date(userProd.activatedAt).toLocaleDateString('ar-SA')}</span>
                                  <span className="text-neutral-600">|</span>
                                  <span className={isActiveLicense ? 'text-emerald-400 font-bold' : 'text-rose-300 font-bold'}>
                                    {isActiveLicense ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'منتهٍ' : 'Expired')}
                                  </span>
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                <div className="rounded-xl border border-cyan-200/[0.1] bg-black/25 px-3 py-2.5">
                                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500"><span>{lang === 'ar' ? 'مفتاح الترخيص المفعّل' : 'Activated license key'}</span><span>{expiresAt ? (lang === 'ar' ? 'ينتهي:' : 'Expires:') : (lang === 'ar' ? 'دائم' : 'Lifetime')}</span></div>
                                  <code className="block select-all overflow-x-auto whitespace-nowrap font-mono text-[11px] font-bold tracking-[0.04em] text-cyan-100">{activatedKey?.key || userProd.keyString || '—'}</code>
                                </div>
                                {(activatedKey?.key || userProd.keyString) && <button onClick={() => copyKeyToClipboard(activatedKey?.key || userProd.keyString!, `admin-${userProd.id}`)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.1] px-3 py-2.5 text-[11px] font-black text-cyan-100 transition hover:bg-cyan-300/[0.18] active:scale-95"><Copy size={13} />{copiedKeyId === `admin-${userProd.id}` ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ المفتاح' : 'Copy key')}</button>}
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'آخر تاريخ:' : 'Expiry:'} <b className={isActiveLicense ? 'text-emerald-200' : 'text-rose-200'}>{expiresAt ? expiresAt.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : (lang === 'ar' ? 'ترخيص دائم' : 'Lifetime license')}</b></span>
                              <button
                                onClick={() => handleRevokeUserProduct(selectedAdminCustomer.id, userProd.productId)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                              >
                                {lang === 'ar' ? 'سحب وتعطيل' : 'Revoke Product'}
                              </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 text-center py-6 font-medium">
                        {lang === 'ar' ? 'لا يملك هذا العميل أي منتجات نشطة حالياً.' : 'No active products found.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: GRANT NEW PRODUCT */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Key className="w-4.5 h-4.5 text-emerald-500" />
                    <span>{lang === 'ar' ? 'منح منتج جديد مباشرة' : 'Grant New Product'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="flex-grow w-full text-right">
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1.5">{lang === 'ar' ? 'اختر المنتج من المتجر' : 'Select Product'}</label>
                      <select
                        value={selectedProductToGrant}
                        onChange={(e) => setSelectedProductToGrant(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/[0.08] focus:border-white/20 text-xs font-bold text-white focus:outline-none"
                      >
                        <option value="">{lang === 'ar' ? '-- اختر منتجاً --' : '-- Choose Product --'}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleGrantProduct(selectedAdminCustomer.id)}
                      disabled={isProcessingAdminAction}
                      className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer sm:mt-5 active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'منح المنتج الآن' : 'Grant Product'}</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 3: ACTIVATED LICENSE KEYS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-sky-500" />
                    <span>{lang === 'ar' ? 'المفاتيح المفعلة وتاريخ الاستخدام' : 'Redeemed License Keys'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {allKeysList.filter(k => k.usedByUserId === selectedAdminCustomer.id).length > 0 ? (
                      <div className="space-y-3">
                        {allKeysList.filter(k => k.usedByUserId === selectedAdminCustomer.id).map(keyObj => (
                          <div key={keyObj.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/10 transition-all">
                            <div>
                              <div className="font-mono text-xs text-emerald-400 font-bold tracking-wider">{keyObj.key}</div>
                              <div className="text-[10px] text-neutral-400 mt-1 font-medium flex items-center gap-1.5">
                                <span>{lang === 'ar' ? 'المنتج:' : 'Product:'} <span className="text-white font-bold">{keyObj.productName || 'N/A'}</span></span>
                                <span className="text-neutral-600">•</span>
                                <span>{lang === 'ar' ? 'المدة:' : 'Duration:'} <span className="text-white font-bold">{keyObj.duration}</span></span>
                              </div>
                            </div>
                                    <div className="flex items-center gap-2">
                              <span className="text-[10px] text-neutral-500 font-mono">{new Date(keyObj.usedAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                              <button onClick={() => copyKeyToClipboard(keyObj.key, `history-${keyObj.id}`)} className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.08] p-2 text-cyan-100 transition hover:bg-cyan-300/[0.16]" title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy key'}>{copiedKeyId === `history-${keyObj.id}` ? <Check size={13} /> : <Copy size={13} />}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 text-center py-6 font-medium">
                        {lang === 'ar' ? 'لم يقم هذا العميل بتفعيل أي مفاتيح حتى الآن.' : 'No keys activated.'}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: PROFILE & MODERATION (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6 lg:border-r lg:border-white/[0.06] lg:pr-6">
                
                {/* Profile Card */}
                <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      selectedAdminCustomer.role === 'Boss' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {selectedAdminCustomer.role || 'Customer'}
                    </span>
                  </div>

                  <img
                    src={selectedAdminCustomer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={selectedAdminCustomer.name}
                    className="w-18 h-18 rounded-2xl border-2 border-indigo-500/30 object-cover shadow-xl mb-3"
                    onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  />

                  <h3 className="text-base font-extrabold text-white flex items-center gap-2 justify-center">
                    <span>{selectedAdminCustomer.name}</span>
                    {selectedAdminCustomer.isBanned && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {lang === 'ar' ? 'محظور' : 'Banned'}
                      </span>
                    )}
                  </h3>

                  <div className="w-full border-t border-white/[0.06] my-4 pt-4 space-y-2.5 text-right text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-indigo-400" /> Discord ID</span>
                      <span className="font-mono text-white font-bold select-all bg-black/30 px-2 py-0.5 rounded border border-white/5">{selectedAdminCustomer.discordId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-indigo-400" /> IP Address</span>
                      <span className="font-mono text-white font-bold">{selectedAdminCustomer.lastIp || '127.0.0.1'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-300" /> {lang === 'ar' ? 'آخر دخول' : 'Last sign-in'}</span>
                      <span className="font-bold text-slate-200">{selectedAdminCustomer.lastLogin ? new Date(selectedAdminCustomer.lastLogin).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {lang === 'ar' ? 'التحذيرات النشطة' : 'Warnings'}</span>
                      <span className="text-amber-500 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{selectedAdminCustomer.warningCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* PRIVATE DISCORD MESSAGE */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-cyan-300" />
                    <span>{lang === 'ar' ? 'رسالة Discord خاصة' : 'Private Discord Message'}</span>
                  </h4>
                  <div className="rounded-2xl border border-cyan-300/[0.14] bg-[linear-gradient(145deg,rgba(34,211,238,.09),rgba(14,23,38,.84)_55%)] p-5 shadow-inner shadow-black/20 space-y-3">
                    {selectedAdminCustomer.discordId ? (
                      <>
                        <div className="flex items-start gap-2 rounded-xl border border-cyan-200/[0.12] bg-cyan-200/[0.05] px-3 py-2.5 text-[10px] leading-relaxed text-cyan-50/80">
                          <DiscordIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                          <span>{lang === 'ar' ? 'تصل الرسالة لهذا العميل فقط من بوت دعم تعن في الخاص. لا تُرسل أي رسالة حتى تضغط زر التأكيد.' : 'The message is sent only to this customer by the Ta3n Support bot. Nothing is sent until you confirm.'}</span>
                        </div>
                        <textarea
                          value={discordDirectMessageInput}
                          onChange={(event) => setDiscordDirectMessageInput(event.target.value.slice(0, 1200))}
                          rows={4}
                          maxLength={1200}
                          placeholder={lang === 'ar' ? 'اكتب رسالتك للعميل بوضوح…' : 'Write a clear message for the customer…'}
                          className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/35 px-3.5 py-3 text-xs font-medium leading-relaxed text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/[0.38]"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold text-slate-500">{discordDirectMessageInput.length}/1200</span>
                          <button
                            onClick={() => void handleSendCustomerDiscordMessage(selectedAdminCustomer.id)}
                            disabled={isProcessingAdminAction || discordDirectMessageInput.trim().length < 2}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-100/70 bg-[linear-gradient(135deg,#d9f8ff,#7dd3fc)] px-4 text-[11px] font-black text-slate-950 shadow-[0_10px_22px_rgba(34,211,238,.13)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 active:scale-95"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{isProcessingAdminAction ? (lang === 'ar' ? 'جارٍ الإرسال…' : 'Sending…') : (lang === 'ar' ? 'إرسال في الخاص' : 'Send private message')}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-amber-300/[0.16] bg-amber-300/[0.06] px-3 py-3 text-xs font-bold leading-relaxed text-amber-100">{lang === 'ar' ? 'لا يوجد Discord ID مرتبط بهذا الحساب، لذلك لا يمكن إرسال رسالة خاصة له.' : 'This account has no linked Discord ID, so a private message cannot be sent.'}</div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: WARNING MANAGEMENT */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                    <span>{lang === 'ar' ? 'توجيه تحذير للعميل' : 'Warn Customer'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner space-y-4">
                    {selectedAdminCustomer.warningMessage && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-xl font-medium flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-0.5">{lang === 'ar' ? 'التحذير الحالي:' : 'Current Warning:'}</span>
                          <span>{selectedAdminCustomer.warningMessage}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <div className="w-full text-right">
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1.5">{lang === 'ar' ? 'اكتب رسالة التحذير للعميل' : 'Warning Message'}</label>
                        <input
                          type="text"
                          value={warningMessageInput}
                          onChange={(e) => setWarningMessageInput(e.target.value)}
                          placeholder={lang === 'ar' ? 'مثال: الرجاء الالتزام بشروط الاستخدام...' : 'Enter warning...'}
                          className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/[0.08] focus:border-white/20 text-xs font-medium text-white focus:outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => handleWarnUser(selectedAdminCustomer.id)}
                        disabled={isProcessingAdminAction}
                        className="h-11 px-5 bg-amber-500 hover:bg-amber-450 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 w-full"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'إرسال تحذير' : 'Send Warning'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: BAN/RESTRICTION MANAGEMENT */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Lock className="w-4.5 h-4.5 text-rose-500" />
                    <span>{lang === 'ar' ? 'إدارة حظر العميل (BAN CONTROLS)' : 'Ban Controls'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
                    {selectedAdminCustomer.isBanned ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl space-y-2 text-right">
                          <div className="font-black text-sm">{lang === 'ar' ? 'حساب العميل محظور حالياً' : 'Customer Account is Banned'}</div>
                          <div>
                            <span className="font-bold">{lang === 'ar' ? 'السبب:' : 'Reason:'}</span> {selectedAdminCustomer.banReason || 'N/A'}
                          </div>
                          <div>
                            <span className="font-bold">{lang === 'ar' ? 'النوع:' : 'Type:'}</span> {selectedAdminCustomer.banType === 'temporary' ? (lang === 'ar' ? 'مؤقت' : 'Temporary') : (lang === 'ar' ? 'دائم' : 'Permanent')}
                          </div>
                          {selectedAdminCustomer.banType === 'temporary' && selectedAdminCustomer.banExpiresAt && (
                            <div>
                              <span className="font-bold">{lang === 'ar' ? 'ينتهي في:' : 'Expires:'}</span> {new Date(selectedAdminCustomer.banExpiresAt).toLocaleString('ar-SA')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            askConfirm(
                              lang === 'ar' ? 'إلغاء الحظر' : 'Unban Account',
                              lang === 'ar' ? `هل أنت متأكد من إلغاء الحظر عن حساب العميل ${selectedAdminCustomer.name}؟` : `Are you sure you want to unban customer ${selectedAdminCustomer.name}?`,
                              () => handleUnbanUser(selectedAdminCustomer.id)
                            );
                          }}
                          disabled={isProcessingAdminAction}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'إلغاء حظر حساب العميل' : 'Unban Account'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="text-right">
                            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5">{lang === 'ar' ? 'سبب الحظر' : 'Ban Reason'}</label>
                            <input
                              type="text"
                              value={banReasonInput}
                              onChange={(e) => setBanReasonInput(e.target.value)}
                              placeholder={lang === 'ar' ? 'مخالفة شروط متجر تعن...' : 'Reason...'}
                              className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/[0.08] focus:border-white/20 text-xs font-semibold text-white focus:outline-none text-right"
                            />
                          </div>
                          <div className="text-right">
                            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5">{lang === 'ar' ? 'نوع الحظر' : 'Ban Type'}</label>
                            <select
                              value={banTypeInput}
                              onChange={(e) => setBanTypeInput(e.target.value as 'temporary' | 'permanent')}
                              className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/[0.08] focus:border-white/20 text-xs font-bold text-white focus:outline-none"
                            >
                              <option value="permanent">{lang === 'ar' ? 'دائم (Permanent)' : 'Permanent'}</option>
                              <option value="temporary">{lang === 'ar' ? 'مؤقت (Temporary)' : 'Temporary'}</option>
                            </select>
                          </div>

                          {banTypeInput === 'temporary' && (
                            <div className="text-right animate-slide-up">
                              <label className="block text-[10px] font-bold text-neutral-400 mb-1.5">{lang === 'ar' ? 'تاريخ ووقت انتهاء الحظر' : 'Ban Expiration Date & Time'}</label>
                              <input
                                type="datetime-local"
                                value={banExpiresAtInput}
                                onChange={(e) => setBanExpiresAtInput(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/[0.08] focus:border-white/20 text-xs font-bold text-white focus:outline-none"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            askConfirm(
                              lang === 'ar' ? 'تأكيد فرض الحظر' : 'Confirm Ban',
                              lang === 'ar' ? `هل أنت متأكد من حظر حساب العميل ${selectedAdminCustomer.name}؟` : `Are you sure you want to ban customer ${selectedAdminCustomer.name}?`,
                              () => handleBanUser(selectedAdminCustomer.id)
                            );
                          }}
                          disabled={isProcessingAdminAction}
                          className="w-full py-3 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Lock className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'تأكيد فرض الحظر' : 'Apply Ban'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
      {guestModalOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#02070e]/72 p-4 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className={`relative w-full max-w-sm overflow-hidden rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-white/[0.14] bg-[#0d1724]/95 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />
            <button onClick={() => !isRedeeming && !activationSuccess && setGuestModalOpen(false)} disabled={isRedeeming || !!activationSuccess} className={`absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'} rounded-lg p-2 ${isDark ? 'text-slate-400 hover:bg-white/[0.07] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
              <X className="h-4 w-4" />
            </button>
            {activationSuccess ? <ActivationSuccessState lang={lang} duration={activationSuccess.duration} productName={activationSuccess.productName} closing={activationSuccess.closing} /> : <>
            <div className={`mb-5 flex items-center gap-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200/25 bg-sky-300/[0.10] text-sky-100">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-[10px] font-black tracking-[0.14em] ${isDark ? 'text-sky-200/75' : 'text-sky-700/75'}`}>{lang === 'ar' ? 'تفعيل الترخيص' : 'LICENSE ACTIVATION'}</p>
                <h3 className="mt-0.5 text-base font-black">{lang === 'ar' ? 'استرداد مفتاح' : 'Redeem Key'}</h3>
              </div>
            </div>
            <form onSubmit={handleRedeemKey} className="space-y-3">
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{lang === 'ar' ? 'مفتاح الترخيص' : 'License Key'}</label>
              <input
                autoFocus
                type="text"
                dir="ltr"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                disabled={isRedeeming}
                placeholder="KEY-XXXXXX-XXXXXX"
                className={`w-full rounded-xl border px-4 py-3 text-center text-xs font-bold tracking-wider outline-none transition-colors ${isDark ? 'border-white/[0.12] bg-black/30 text-white placeholder:text-slate-600 focus:border-sky-300/65' : 'border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400 focus:border-sky-500/60'} font-mono`}
              />
              {redeemMessage && redeemMessage.type === 'error' && (
                <p className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.10] px-3 py-2.5 text-xs font-semibold text-rose-300 animate-in fade-in slide-in-from-top-1 duration-200"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-300/50 text-[11px] font-black">!</span><span>{redeemMessage.text}</span></p>
              )}
              <button type="submit" disabled={isRedeeming || !!activationSuccess || !keyInput.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                {isRedeeming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRedeeming ? (lang === 'ar' ? 'جارِ التفعيل...' : 'Redeeming...') : (lang === 'ar' ? 'تفعيل المفتاح' : 'Redeem Key')}
              </button>
            </form></>}
          </div>
        </div>
      )}

      {/* Central Toast Container Component (Top Right) */}
      <ToastContainer />

      {confirmModal?.isOpen && (
        <PremiumConfirmationModal
          modal={confirmModal}
          lang={lang}
          submitting={confirmSubmitting}
          onDismiss={dismissConfirm}
          onConfirm={submitConfirm}
        />
      )}
    </div>
  );
}


function PremiumConfirmationModal({ modal, lang, submitting, onDismiss, onConfirm }: {
  modal: { title: string; message: string };
  lang: 'ar' | 'en';
  submitting: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  const isRtl = lang === 'ar';
  const primaryRef = useRef<HTMLButtonElement>(null);
  const title = modal.title || (isRtl ? 'تأكيد الإجراء' : 'Confirm action');
  const destructive = /حذف|Delete|إلغاء|Revoke|حظر|Ban/i.test(title);
  const entity = /حساب|Account/i.test(title) ? (isRtl ? 'الحساب' : 'account') : /مفتاح|Key/i.test(title) ? (isRtl ? 'المفتاح' : 'key') : /منتج|Product/i.test(title) ? (isRtl ? 'المنتج' : 'product') : (isRtl ? 'العنصر' : 'item');
  const actionLabel = destructive ? (isRtl ? `حذف ${entity}` : `Delete ${entity}`) : (isRtl ? 'تأكيد الإجراء' : 'Confirm action');

  useEffect(() => {
    primaryRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss, submitting]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onMouseDown={(event) => { if (event.currentTarget === event.target && !submitting) onDismiss(); }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#02060d]/72 p-4 backdrop-blur-[10px]"
        dir={isRtl ? 'rtl' : 'ltr'}
        role="presentation"
      >
        <motion.section
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-confirm-title"
          aria-describedby="premium-confirm-description"
          className="relative w-full max-w-[440px] overflow-hidden rounded-[26px] border border-white/[0.13] bg-[linear-gradient(145deg,rgba(26,34,48,.97),rgba(8,12,21,.98))] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,.62),0_0_0_1px_rgba(112,214,255,.04),0_0_46px_rgba(122,76,100,.14)] sm:p-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(125,211,252,.14),transparent_36%),radial-gradient(circle_at_6%_100%,rgba(244,63,94,.08),transparent_34%)]" />
          <button
            type="button"
            onClick={onDismiss}
            disabled={submitting}
            aria-label={isRtl ? 'إغلاق نافذة التأكيد' : 'Close confirmation dialog'}
            className="absolute left-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] text-slate-300 transition hover:border-white/[0.20] hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-sky-300/70 disabled:cursor-not-allowed disabled:opacity-45"
          ><X className="h-4 w-4" /></button>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.09, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              className="mx-auto flex h-[66px] w-[66px] items-center justify-center rounded-full border border-rose-300/25 bg-rose-400/[0.11] text-rose-200 shadow-[0_0_0_8px_rgba(244,63,94,.035),0_0_32px_rgba(244,63,94,.20)]"
            ><AlertTriangle className="h-7 w-7 stroke-[1.65]" /></motion.div>

            <div className="mt-5">
              <p className="text-[10px] font-black tracking-[0.19em] text-rose-200/70">{isRtl ? 'إجراء حساس' : 'SENSITIVE ACTION'}</p>
              <h3 id="premium-confirm-title" className="mt-2 text-xl font-black tracking-tight text-white sm:text-[22px]">{title}</h3>
              <p id="premium-confirm-description" className="mx-auto mt-3 max-w-[350px] text-[13px] font-medium leading-6 text-slate-300/82">{modal.message}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200/[0.14] bg-amber-300/[0.055] px-4 py-3 text-right">
              <div className="flex items-center gap-2 text-[11px] font-black text-amber-100"><AlertCircle className="h-3.5 w-3.5 text-amber-300" />{isRtl ? 'تحذير' : 'Warning'}</div>
              <p className="mt-1.5 text-[11px] leading-5 text-amber-50/70">{isRtl ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه بعد تنفيذ عملية الحذف.' : 'This action is final and cannot be undone after it is completed.'}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={onDismiss} disabled={submitting} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.11] bg-white/[0.04] px-4 text-xs font-black text-slate-200 transition hover:border-white/[0.18] hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-sky-300/70 disabled:cursor-not-allowed disabled:opacity-45">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button ref={primaryRef} type="button" onClick={onConfirm} disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200/18 bg-[linear-gradient(135deg,#fb7185,#e11d48)] px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(225,29,72,.24)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-200/80 disabled:cursor-not-allowed disabled:opacity-65">
                {submitting ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />{isRtl ? 'جارٍ الحذف...' : 'Deleting...'}</> : <><Trash2 className="h-3.5 w-3.5" />{actionLabel}</>}
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
