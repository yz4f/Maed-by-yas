'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Shield,
  Key,
  KeyRound,
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
  Plus,
  Search,
  UserCheck,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Edit3,
  Save,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  AlertTriangle,
  Unlock,
  Hash,
  Megaphone,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditEvent, Product, UserProduct, SystemLog, Key as KeyType, User as UserType, KeyDuration } from '@/types';
import { durationLabel, KEY_DURATION_OPTIONS } from '@/lib/license-duration';
import { PortalNavigation } from './portal-navigation';
import { AdminCustomerTable } from './admin-customer-table';
import { getPortalGuideText } from './portal-guide-text';
import { DiscordMark as DiscordIcon } from './discord-mark';
const FaqPage = dynamic(() => import('./faq-page').then((module) => module.FaqPage), { ssr: false });
const ProductFaqAdmin = dynamic(() => import('./product-faq-admin').then((module) => module.ProductFaqAdmin), { ssr: false });
const AdminAuditLogs = dynamic(() => import('./admin-audit-logs').then((module) => module.AdminAuditLogs), { ssr: false });
const SiteUpdatesAdmin = dynamic(() => import('./site-updates-admin').then((module) => module.SiteUpdatesAdmin), { ssr: false });
const ResetKeyRequestsAdmin = dynamic(() => import('./reset-key-requests-admin').then((module) => module.ResetKeyRequestsAdmin), { ssr: false });
const SitePresenceAdmin = dynamic(() => import('./site-presence-admin').then((module) => module.SitePresenceAdmin), { ssr: false });
const RoleManager = dynamic(() => import('./role-manager').then((module) => module.RoleManager), { ssr: false });
const AnnouncementAdmin = dynamic(() => import('./announcement-admin').then((module) => module.AnnouncementAdmin), { ssr: false });
const SystemSettings = dynamic(() => import('./system-settings').then((module) => module.SystemSettings), { ssr: false });
const CustomerAnnouncements = dynamic(() => import('./customer-announcements').then((module) => module.CustomerAnnouncements), { ssr: false });
import { ToastContainer } from '@/components/ui/toast';
import { toast as centralToast } from '@/lib/toast';

interface T3NUnifiedPortalProps {
  initialProducts: Product[];
}

const DIRECT_TUTORIAL_VIDEO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/mHiKjOdRBJBDsCnu.mp4';

export function T3NUnifiedPortal({ initialProducts }: T3NUnifiedPortalProps) {
  const { data: session } = useSession();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'my-products' | 'faqs' | 'redeem' | 'admin' | 'profile'>('overview');

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('self-delivery.theme');
    const savedLanguage = window.localStorage.getItem('self-delivery.language');
    const savedSidebar = window.localStorage.getItem('self-delivery.sidebar-collapsed');
    const frame = window.requestAnimationFrame(() => {
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') setTheme(savedTheme);
      if (savedLanguage === 'ar' || savedLanguage === 'en') setLang(savedLanguage);
      if (savedSidebar === 'true' || savedSidebar === 'false') setSidebarCollapsed(savedSidebar === 'true');
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const timer = window.setTimeout(() => setSystemPrefersDark(preference.matches), 0);
    const onSystemThemeChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    preference.addEventListener('change', onSystemThemeChange);
    return () => { window.clearTimeout(timer); preference.removeEventListener('change', onSystemThemeChange); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemPrefersDark));
    window.localStorage.setItem('self-delivery.theme', theme);
  }, [theme, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('self-delivery.language', lang);
  }, [lang]);

  useEffect(() => {
    window.localStorage.setItem('self-delivery.sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const [syncedUser, setSyncedUser] = useState<UserType | null>(null);

  // Dynamic Products State (Firestore-synced)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const lowStockProducts = products.filter((product) =>
    !product.isArchived && !product.isDisabled &&
    typeof product.stockKeysCount === 'number' &&
    product.stockKeysCount < (product.lowStockThreshold ?? 5)
  );
  const dbProductsRequestInFlightRef = useRef(false);

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
  const userProductsRequestInFlightRef = useRef(false);
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
  const [activationResult, setActivationResult] = useState<{ productName: string; activatedAt: string | null; expiresAt: string | null; licenseFound: boolean } | null>(null);

  // Copy Key Feedback State
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Guest Key Activation Modal State (Screenshot 2 "Buy / Activate license first")

  // Guide Modal States
  const [guideModalProduct, setGuideModalProduct] = useState<UserProduct | null>(null);
  const [guideView, setGuideView] = useState<'menu' | 'notice' | 'full' | 'issues' | 'format' | 'network' | 'timer' | 'spoofer' | null>(null);
  const [resetRequestProduct, setResetRequestProduct] = useState<UserProduct | null>(null);
  const [resetRequestReason, setResetRequestReason] = useState('');
  const [isSubmittingResetRequest, setIsSubmittingResetRequest] = useState(false);
  const [resetCompletionNotice, setResetCompletionNotice] = useState<{ id: string; title: string; message: string } | null>(null);
  const [isAcknowledgingResetCompletion, setIsAcknowledgingResetCompletion] = useState(false);
  const [tutorialCountdown, setTutorialCountdown] = useState(0);

  useEffect(() => {
    if (guideView !== 'notice') return;

    const startTimer = window.setTimeout(() => setTutorialCountdown(5), 0);
    const timer = window.setInterval(() => {
      setTutorialCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => { window.clearTimeout(startTimer); window.clearInterval(timer); };
  }, [guideView]);

  const guideText = getPortalGuideText(lang, guideModalProduct?.product?.name);

  // Admin Panel States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const adminStatsRequestInFlightRef = useRef(false);
  const adminCustomersRequestInFlightRef = useRef(false);
  const adminKeysRequestInFlightRef = useRef(false);
  const [isAdminRefreshing, setIsAdminRefreshing] = useState(false);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);
  const [bulkKeysText, setBulkKeysText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [adminLogs, setAdminLogs] = useState<SystemLog[]>([]);

  // Inventory Modal States
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const canEditInventoryProduct = inventoryProduct?.id === 'new'
    ? adminPermissions.includes('products.create')
    : adminPermissions.includes('products.edit');
  const [inventoryTab, setInventoryTab] = useState<'data' | 'custom' | 'codes'>('codes');
  const [inventoryKeys, setInventoryKeys] = useState<KeyType[]>([]);
  const [inventoryStock, setInventoryStock] = useState({ total: 0, available: 0, used: 0, disabled: 0, archived: 0, duplicateCodes: 0 });
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [singleAddOpen, setSingleAddOpen] = useState(false);
  const [singleKeyText, setSingleKeyText] = useState('');
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [isAddingSingleKey, setIsAddingSingleKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [inventoryKeyDuration, setInventoryKeyDuration] = useState<KeyDuration>('2 Days');

  // Extended Inventory Editing States
  const [editProductData, setEditProductData] = useState<{
    name: string;
    description: string;
    version: string;
    fileSize: string;
    category: string;
    downloadsCount: number;
    lowStockThreshold: number;
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
    lowStockThreshold: 5,
    image: '',
    videoUrl: '',
    guideUrl: '',
    fileUrl: '',
    cardColor: 'blue',
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveMessage, setProductSaveMessage] = useState<string | null>(null);
  const [keyActionMessage, setKeyActionMessage] = useState<string | null>(null);

  // Language State: 'ar' or 'en'
  // Central Toast Helper Wrapper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    centralToast.show({ message, type });
  };

  // Admin Categorized Dashboard Sub-Tabs
  const [adminSectionTab, setAdminSectionTab] = useState<'overview' | 'products' | 'customers' | 'sitePresence' | 'faqs' | 'updates' | 'resetRequests' | 'keys' | 'logs' | 'roles' | 'announcements' | 'settings'>('overview');
  const [allCustomersList, setAllCustomersList] = useState<any[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [customerRoleFilter, setCustomerRoleFilter] = useState('all');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [customerPage, setCustomerPage] = useState(0);
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState<any | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState<'overview' | 'products' | 'keys' | 'activity' | 'permissions'>('overview');
  const [selectedRoleDraft, setSelectedRoleDraft] = useState('Customer');
  const [selectedCustomerProducts, setSelectedCustomerProducts] = useState<any[]>([]);
  const [selectedProductToGrant, setSelectedProductToGrant] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banTypeInput, setBanTypeInput] = useState<'temporary' | 'permanent'>('permanent');
  const [banExpiresAtInput, setBanExpiresAtInput] = useState('');
  const [warningMessageInput, setWarningMessageInput] = useState('');
  const [isProcessingAdminAction, setIsProcessingAdminAction] = useState(false);
  const [allKeysList, setAllKeysList] = useState<KeyType[]>([]);
  const [searchKeysQuery, setSearchKeysQuery] = useState('');
  const [keyStatusFilter, setKeyStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const customerPageSize = 10;
  const filteredAdminCustomers = React.useMemo(() => {
    const query = searchCustomerQuery.trim().toLocaleLowerCase();
    return allCustomersList.filter((customer) => {
      const matchesQuery = !query
        || String(customer.name || '').toLocaleLowerCase().includes(query)
        || String(customer.email || '').toLocaleLowerCase().includes(query)
        || String(customer.discordId || '').toLocaleLowerCase().includes(query);
      const matchesRole = customerRoleFilter === 'all' || customer.role === customerRoleFilter;
      const matchesStatus = customerStatusFilter === 'all'
        || (customerStatusFilter === 'disabled' ? Boolean(customer.isBanned || customer.isArchived) : !customer.isBanned && !customer.isArchived);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [allCustomersList, searchCustomerQuery, customerRoleFilter, customerStatusFilter]);
  const customerPageCount = Math.max(1, Math.ceil(filteredAdminCustomers.length / customerPageSize));
  const safeCustomerPage = Math.min(customerPage, customerPageCount - 1);
  const pagedAdminCustomers = filteredAdminCustomers.slice(safeCustomerPage * customerPageSize, (safeCustomerPage + 1) * customerPageSize);

  const sessionDiscordId = (session?.user as any)?.discordId as string | undefined;
  const currentUser: UserType | null = React.useMemo(() => session?.user && sessionDiscordId ? (
    syncedUser?.discordId === sessionDiscordId ? syncedUser : {
      id: (session.user as any).id || sessionDiscordId,
      discordId: sessionDiscordId,
      name: session.user.name || 'T3N User',
      email: session.user.email,
      image: session.user.image,
      role: ((session.user as any).role || 'Customer') as UserType['role'],
      discordRoles: [],
      createdAt: String((session.user as any).createdAt || ''),
    }
  ) : null, [session, sessionDiscordId, syncedUser]);

  const isLoggedIn = !!currentUser;
  const isAdmin = ['Boss', 'Owner', 'Co-Boss', 'Admin', 'Moderator', 'Staff'].includes(String(currentUser?.role || ''));
  useEffect(() => {
    let active = true;
    if (!sessionUserId) {
      const frame = window.requestAnimationFrame(() => { if (active) setAdminPermissions([]); });
      return () => { active = false; window.cancelAnimationFrame(frame); };
    }
    fetch('/api/admin/permissions', { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (!active) return;
      const permissions: string[] = data.success ? data.permissions || [] : [];
      setAdminPermissions(permissions);
      if (!permissions.includes('dashboard.view')) setAdminSectionTab(permissions.includes('products.view') ? 'products' : permissions.includes('users.view') ? 'customers' : permissions.includes('faq.view') ? 'faqs' : permissions.includes('announcements.view') ? 'announcements' : 'overview');
    }).catch(() => { if (active) setAdminPermissions([]); });
    return () => { active = false; };
  }, [sessionUserId]);

  useEffect(() => {
    if (activeTab !== 'my-products' || !currentUser) return;
    let active = true;
    const loadResetCompletion = async () => {
      try {
        const response = await fetch('/api/reset-requests?view=notifications', { credentials: 'same-origin', cache: 'no-store' });
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
  }, [activeTab, currentUser]);
  const getLicenseTiming = (license: UserProduct) => {
    const parsedExpiry = license.expiresAt ? new Date(license.expiresAt).getTime() : Number.NaN;
    const hasValidExpiry = Number.isFinite(parsedExpiry) && parsedExpiry > 0;
    const isLifetime = !license.expiresAt;
    const expiresAtMs = hasValidExpiry ? parsedExpiry : 0;
    const remainingMs = hasValidExpiry ? Math.max(0, expiresAtMs - licenseClock) : 0;
    const isExpired = !isLifetime && hasValidExpiry && remainingMs === 0;
    const isUsable = license.status === 'Active' && (isLifetime || (hasValidExpiry && remainingMs > 0));
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const countdown = isLifetime
      ? (lang === 'ar' ? 'مدى الحياة' : 'Lifetime')
      : lang === 'ar'
        ? `${days}ي ${hours}س ${minutes}د`
        : `${days}d ${hours}h ${minutes}m`;
    return { expiresAtMs, remainingMs, isExpired, isUsable, countdown, isLifetime };
  };
  const activeProductCount = userProducts.filter((product) => getLicenseTiming(product).isUsable).length;
  const inactiveProductCount = userProducts.filter((product) => !getLicenseTiming(product).isUsable).length;
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
    const aPriority = getLicenseTiming(a).isUsable ? 0 : 1;
    const bPriority = getLicenseTiming(b).isUsable ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aActivatedAt = new Date(a.activatedAt || 0).getTime() || 0;
    const bActivatedAt = new Date(b.activatedAt || 0).getTime() || 0;
    return bActivatedAt - aActivatedAt;
  });
  const memberSince = (() => {
    if (!currentUser?.createdAt) return '—';
    const joined = new Date(currentUser.createdAt);
    if (Number.isNaN(joined.getTime())) return '—';
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }).format(joined);
  })();

  const loadUserProducts = useCallback(async (): Promise<void> => {
    if (!currentUser || userProductsRequestInFlightRef.current) return;
    userProductsRequestInFlightRef.current = true;
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/user/products', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        const nextProducts = Array.isArray(data.products) ? data.products as UserProduct[] : [];
        const nextActivity = Array.isArray(data.activity) ? data.activity as AuditEvent[] : [];
        if (data.user?.discordId === currentUser.discordId) setSyncedUser((user) => JSON.stringify(user) === JSON.stringify(data.user) ? user : data.user as UserType);
        setUserProducts((current) => JSON.stringify(current) === JSON.stringify(nextProducts) ? current : nextProducts);
        setUserActivity((current) => JSON.stringify(current) === JSON.stringify(nextActivity) ? current : nextActivity);
      }
    } catch (e) {
      console.error('Failed to load user products:', e);
    } finally {
      userProductsRequestInFlightRef.current = false;
      setIsLoadingProducts(false);
    }
  }, [currentUser]);

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
    setCustomerDetailTab('overview');
    setSelectedRoleDraft(customer.role || 'Customer');
    setSelectedCustomerProducts([]);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setSelectedAdminCustomer(data.user);
          setSelectedRoleDraft(data.user.role || 'Customer');
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

  const loadAdminLogs = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/logs', { cache: 'no-store' });
      if (!response.ok) return false;
      const data = await response.json();
      if (!data.success || !Array.isArray(data.logs)) return false;
      setAdminLogs(data.logs);
      return true;
    } catch (error) {
      console.error('Failed to load admin logs:', error);
      return false;
    }
  };

  // Load customer data after helper declarations; heavy admin lists are fetched only on demand.
  useEffect(() => {
    if (!currentUser?.id) return;
    const timer = window.setTimeout(() => { void loadUserProducts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUser?.id, loadUserProducts]);

  useEffect(() => {
    if (activeTab !== 'admin' || !isAdmin) return;
    const timer = window.setTimeout(() => {
      if (adminSectionTab === 'overview') void loadAdminStats();
      if (adminSectionTab === 'logs') void loadAdminLogs();
      if (adminSectionTab === 'products') { void loadDbProducts(); void loadAdminStats(); }
      if (adminSectionTab === 'customers') void loadAdminCustomersList();
      if (adminSectionTab === 'keys') void loadAllKeysList();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, adminSectionTab, isAdmin]);

  const selectedAdminCustomerId = selectedAdminCustomer?.id;
  const canViewAdminLogs = adminPermissions.includes('logs.view');
  useEffect(() => {
    if (!selectedAdminCustomerId || customerDetailTab !== 'activity' || !canViewAdminLogs) return;
    const timer = window.setTimeout(() => { void loadAdminLogs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedAdminCustomerId, customerDetailTab, canViewAdminLogs]);

  const refreshAdminPanel = async () => {
    if (!isAdmin || isAdminRefreshing) return;
    setIsAdminRefreshing(true);
    setAdminLoadError(null);
    try {
      const requests: Promise<boolean>[] = [];
      if (adminSectionTab === 'overview') requests.push(loadAdminStats());
      if (adminSectionTab === 'logs') requests.push(loadAdminLogs());
      if (adminSectionTab === 'products') {
        requests.push(loadDbProducts());
        requests.push(loadAdminStats());
      }
      if (adminSectionTab === 'customers') requests.push(loadAdminCustomersList());
      if (adminSectionTab === 'keys') requests.push(loadAllKeysList());
      if (requests.length === 0) return;
      const results = await Promise.all(requests);
      if (results.some((result) => !result)) throw new Error('refresh-failed');
    } catch {
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
        } catch {
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
    } catch {
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
    } catch {
      showToast('حدث خطأ أثناء إرسال التحذير.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleChangeUserRole = async (userId: string) => {
    if (!selectedAdminCustomer || selectedAdminCustomer.id !== userId || isProcessingAdminAction) return;
    askConfirm(
      lang === 'ar' ? 'تغيير دور العميل' : 'Change customer role',
      lang === 'ar' ? `ستسري صلاحيات دور ${selectedRoleDraft} على طلبات الخادم فوراً، ويُحدّث عرض القائمة عند تحديث الجلسة. هل تريد المتابعة؟` : `The ${selectedRoleDraft} permissions will apply to server requests immediately. Refresh the session to update the visible navigation. Continue?`,
      async () => {
        setIsProcessingAdminAction(true);
        try {
          const response = await fetch('/api/admin/customers/manage', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'change_role', userId, role: selectedRoleDraft }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || 'Could not change customer role.');
          setSelectedAdminCustomer((customer: any) => customer ? { ...customer, role: result.role } : customer);
          setAllCustomersList((customers) => customers.map((customer) => customer.id === userId ? { ...customer, role: result.role } : customer));
          showToast(lang === 'ar' ? 'تم تحديث دور العميل.' : 'Customer role updated.', 'success');
        } catch (error) {
          showToast(error instanceof Error ? error.message : (lang === 'ar' ? 'تعذر تحديث دور العميل.' : 'Could not update customer role.'), 'error');
        } finally {
          setIsProcessingAdminAction(false);
        }
      },
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
    } catch {
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
    } catch {
      showToast('حدث خطأ أثناء إلغاء الحظر.', 'error');
    } finally {
      setIsProcessingAdminAction(false);
    }
  };

  const handleDisableUserAccount = async (userId: string, userName: string) => {
    askConfirm(
      lang === 'ar' ? 'تعطيل حساب العميل' : 'Disable Customer Account',
      lang === 'ar' ? `سيتم تعطيل حساب ${userName} مع الاحتفاظ بسجله وتراخيصه. هل تريد المتابعة؟` : `Disable ${userName}'s account while keeping its history and licenses?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/customers/${userId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || (lang === 'ar' ? 'تم تعطيل حساب العميل.' : 'Customer account disabled.'));
            setSelectedAdminCustomer(null);
            loadAdminCustomersList();
            loadAdminStats();
          }
        } catch {
          showToast(lang === 'ar' ? 'حدث خطأ أثناء تعطيل العميل.' : 'Could not disable customer.');
        }
      }
    );
  };

  // Redeem Key Handler
  const handleRedeemKey = async (e: React.FormEvent, keyToRedeem?: string, stayOnActivationPage = false) => {
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
        setRedeemMessage({ type: 'success', text: data.message });
        setKeyInput('');
        showToast('License activated!', 'success');

        // Refresh the license library before showing the activation result.
        await loadUserProducts();
        if (stayOnActivationPage && data.product?.id) {
          const refreshed = await fetch('/api/user/products', { credentials: 'same-origin', cache: 'no-store' });
          const refreshedData = refreshed.ok ? await refreshed.json() : null;
          const license = Array.isArray(refreshedData?.products)
            ? (refreshedData.products as UserProduct[]).find((item) => item.productId === data.product.id && item.status === 'Active')
            : undefined;
          setActivationResult({ productName: data.product.name, activatedAt: license?.activatedAt || null, expiresAt: license?.expiresAt || null, licenseFound: Boolean(license) });
        } else {
          setActiveTab('my-products');
        }
      } else {
        setRedeemMessage({ type: 'error', text: data.message });
        showToast(data.message || 'Failed to activate license.', 'error');
      }
    } catch {
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
      const response = await fetch('/api/reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ productId: resetRequestProduct.productId, reason, language: lang }),
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

  // Download Handler
  const handleDownload = async (productId: string) => {
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
    } catch {
      showToast('حدث خطأ في طلب التحميل.', 'error');
    }
  };

  // Inventory Management
  const openInventoryModal = async (product: Product, defaultTab: 'data' | 'custom' | 'codes' = 'codes', openBulk: boolean = false) => {
    setInventoryProduct(product);
    setEditProductData({
      name: product.name || '',
      description: product.description || '',
      version: product.version || '',
      fileSize: product.fileSize || '',
      category: product.category || '',
      downloadsCount: product.downloadsCount || 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      image: product.image || '',
      videoUrl: product.videoUrl || '',
      guideUrl: product.guideUrl || '',
      fileUrl: product.fileUrl || '',
      cardColor: product.cardColor || 'blue',
    });
    setProductSaveMessage(null);
    setKeyActionMessage(null);
    setInventoryModalOpen(true);
    setInventoryTab(defaultTab);
    setBulkAddOpen(openBulk);
    setSingleAddOpen(false);
    setBulkKeysText('');
    setSingleKeyText('');
    setBulkMessage(null);
    if (product.id !== 'new') {
      setInventoryStock({ total: 0, available: product.stockKeysCount || 0, used: 0, disabled: 0, archived: 0, duplicateCodes: 0 });
      await loadInventoryKeys(product.id);
    } else {
      setInventoryKeys([]);
      setInventoryStock({ total: 0, available: 0, used: 0, disabled: 0, archived: 0, duplicateCodes: 0 });
    }
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
      lowStockThreshold: 5,
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
    openInventoryModal(blankProduct, 'data', false);
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
          setProducts(prev => [...prev, { ...data.product, stockKeysCount: 0 }]);
        } else {
          setProducts(prev => prev.map(p => p.id === data.product.id ? { ...data.product, stockKeysCount: p.stockKeysCount } : p));
        }
        
        loadAdminStats();
        loadUserProducts();
      } else {
        setProductSaveMessage(data.message || 'حدث خطأ أثناء حفظ التعديلات');
      }
    } catch {
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

  const handleRevokeKey = async (userId: string | null | undefined, keyId: string) => {
    if (!userId) return;
    askConfirm(
      lang === 'ar' ? 'إلغاء ترخيص المفتاح' : 'Revoke license key',
      lang === 'ar' ? 'هل تريد إلغاء هذا المفتاح وتعطيل الترخيص المرتبط به؟' : 'Revoke this key and disable its associated license?',
      async () => {
        try {
          const res = await fetch('/api/admin/keys/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, keyId })
          });
          const data = await res.json();
          if (data.success) {
            showToast(lang === 'ar' ? 'تم إلغاء المفتاح وتعطيل الترخيص المرتبط.' : 'Key revoked and associated license disabled.', 'success');
            await loadAllKeysList();
            loadAdminStats();
          } else {
            showToast(data.message || (lang === 'ar' ? 'تعذر إلغاء المفتاح.' : 'Key revocation failed.'));
          }
        } catch {
          showToast('Something went wrong.', 'error');
        }
      }
    );
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
            setInventoryModalOpen(false);
            loadAdminStats();
            loadUserProducts();
          }
        } catch {
          showToast(lang === 'ar' ? 'حدث خطأ أثناء حذف المنتج.' : 'Error deleting product.');
        }
      }
    );
  };

  const handleBulkAddKeys = async () => {
    if (!bulkKeysText.trim() || !inventoryProduct || isAddingKeys) return;

    const rawKeys = bulkKeysText.split(/[\n,]+/).map((key) => key.trim()).filter(Boolean);
    if (rawKeys.length === 0) return;

    setIsAddingKeys(true);
    setBulkMessage(`جارٍ التحقق من ${rawKeys.length} مفتاح وإضافتها إلى المخزون...`);

    try {
      const res = await fetch('/api/admin/keys/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: inventoryProduct.id, rawKeysText: rawKeys.join('\n'), duration: inventoryKeyDuration })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر إضافة المفاتيح إلى المخزون.');
      }

      const added = Number(data.count || 0);
      const skipped = Number(data.skipped || 0);
      setBulkMessage(added > 0
        ? `تمت إضافة ${added} مفتاح للمخزون الحقيقي${skipped ? `، وتم تجاهل ${skipped} مفتاح مكرر.` : '.'}`
        : `لم تتم إضافة مفاتيح جديدة${skipped ? ' لأن المفاتيح المدخلة مكررة.' : '.'}`);
      if (added > 0) setBulkKeysText('');

      await Promise.all([
        loadInventoryKeys(inventoryProduct.id),
        loadAdminStats(),
        loadDbProducts(),
        loadAllKeysList()
      ]);
    } catch (error: any) {
      console.error('Failed to bulk add keys:', error);
      const message = error?.message || 'حدث خطأ أثناء مزامنة المفاتيح مع الخادم.';
      setBulkMessage(message);
      showToast(message, 'error');
    } finally {
      setIsAddingKeys(false);
    }
  };

  const handleAddSingleKey = async () => {
    if (!singleKeyText.trim() || !inventoryProduct || isAddingSingleKey) return;
    setIsAddingSingleKey(true);
    try {
      const res = await fetch('/api/admin/keys/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: inventoryProduct.id, rawKeysText: singleKeyText.trim(), duration: inventoryKeyDuration })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر إضافة المفتاح.');
      }

      if (Number(data.count || 0) > 0) {
        setBulkMessage('تمت إضافة المفتاح إلى المخزون الحقيقي بنجاح.');
        setSingleKeyText('');
        setSingleAddOpen(false);
      } else {
        setBulkMessage('لم تتم الإضافة لأن هذا المفتاح موجود بالفعل في المخزون.');
      }
      await Promise.all([
        loadInventoryKeys(inventoryProduct.id),
        loadAdminStats(),
        loadDbProducts(),
        loadAllKeysList()
      ]);
    } catch (error: any) {
      console.error('Failed to add single key:', error);
      const message = error?.message || 'تعذر إضافة المفتاح. حاول مجدداً.';
      setBulkMessage(message);
      showToast(message, 'error');
    } finally {
      setIsAddingSingleKey(false);
    }
  };

  const handleLogout = async () => {
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
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  // Dynamic Theme Styling Object
  const styles = {
    bgApp: isDark ? 'bg-[#071016] text-[#EEF8FA]' : 'bg-[#F4F8F9] text-[#102027]',
    bgPanel: isDark ? 'bg-[#0A151D] border-white/[0.06]' : 'bg-[#F9FCFC] border-[#DCE8EB] shadow-sm',
    bgCard: isDark ? 'bg-[#0D1B24] border-white/[0.06] shadow-sm hover:border-cyan-300/20 transition-colors duration-150' : 'bg-white border-[#DCE8EB] shadow-sm hover:border-cyan-600/25 transition-colors duration-150',
    bgSidebar: isDark ? 'bg-[#0A151D] border-white/[0.06]' : 'bg-[#F9FCFC] border-[#DCE8EB] shadow-sm',
    bgInput: isDark ? 'bg-[#071016] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-cyan-300/40 transition-colors duration-150' : 'bg-[#F4F8F9] border-[#DCE8EB] text-slate-900 placeholder:text-slate-400 focus:border-cyan-600/40 transition-colors duration-150',
    bgInnerCard: isDark ? 'bg-[#10222C] border-white/[0.05]' : 'bg-[#F9FCFC] border-[#DCE8EB]',
    bgInnerCardDarkOnly: isDark ? 'bg-[#10222C] border-white/[0.05]' : 'bg-[#F4F8F9] border-[#DCE8EB]',
    textTitle: isDark ? 'text-white' : 'text-slate-950',
    textBody: isDark ? 'text-[#F4F4F5]' : 'text-slate-800',
    textMuted: isDark ? 'text-[#A1A1AA]' : 'text-slate-500',
    textLightMuted: isDark ? 'text-[#71717A]' : 'text-slate-450',
    borderSubtle: isDark ? 'border-white/[0.04]' : 'border-slate-100',
    borderNormal: isDark ? 'border-white/10' : 'border-slate-200',
    sidebarActive: isDark ? 'bg-cyan-300/10 border border-cyan-300/20 text-cyan-100 font-semibold' : 'bg-cyan-50 border border-cyan-600/15 text-cyan-800 font-semibold',
    sidebarInactive: isDark ? 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.01]' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50',
    btnSecondary: isDark ? 'border-white/[0.05] hover:border-white/20 hover:bg-white/5 text-[#A1A1AA] hover:text-white' : 'border-slate-200 hover:border-slate-350 hover:bg-black/[0.02] text-slate-700 hover:text-slate-950',
    btnPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm transition-colors duration-150',
    borderHover: isDark ? 'border-cyan-300/35' : 'border-cyan-700/30'
  };

  if (!isLoggedIn) {
    return (
      <div className={`redeem-page-wrapper ${isDark ? 'redeem-page-wrapper--dark' : 'redeem-page-wrapper--light'} min-h-screen w-full relative overflow-hidden select-none`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <style dangerouslySetInnerHTML={{ __html: `
          .redeem-page-wrapper {
            --night: #081321;
            --deep-blue: #10213a;
            --royal-blue: #4567d8;
            --sky: #8edbff;
            --ice: #f4f8fc;
            --silver: #c8d4e2;
            --muted: #a8b8ca;
            --glass: rgba(15, 27, 43, 0.82);
            --glass-border: rgba(193, 216, 240, 0.19);
            --discord: #5865f2;
            min-height: 100vh;
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            isolation: isolate;
            color: var(--ice);
            background: #071016;
            font-family: 'IBM Plex Sans Arabic', sans-serif;
          }
          .redeem-page-wrapper *,
          .redeem-page-wrapper *::before,
          .redeem-page-wrapper *::after { box-sizing: border-box; }
          .redeem-page-wrapper .login-background {
            position: absolute;
            inset: 0;
            z-index: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            pointer-events: none;
          }
          .redeem-page-wrapper .bg-gfx {
            display: none;
            position: absolute;
            inset: 0;
            z-index: 0;
            overflow: hidden;
            background:
              linear-gradient(125deg, rgba(2, 10, 24, 0.24) 0%, rgba(4, 29, 66, 0.16) 49%, rgba(2, 12, 28, 0.28) 100%),
              url('/images/t3n-login-azure-clean.png') center center / cover no-repeat,
              #061524;
          }
          .redeem-page-wrapper .bg-gfx::before,
          .redeem-page-wrapper .bg-gfx::after {
            content: '';
            position: absolute;
            inset: -12%;
            pointer-events: none;
          }
          .redeem-page-wrapper .bg-gfx::before {
            opacity: 0.18;
            filter: blur(28px);
            background:
              radial-gradient(ellipse 42% 28% at 25% 50%, rgba(152, 223, 255, 0.17), transparent 72%),
              radial-gradient(ellipse 34% 28% at 79% 27%, rgba(116, 208, 255, 0.12), transparent 75%);
            animation: mistFloat 16s ease-in-out infinite alternate;
          }
          .redeem-page-wrapper .bg-gfx::after {
            opacity: 0.16;
            background: linear-gradient(118deg, rgba(255,255,255,0.045), transparent 31%, rgba(197,226,248,0.075) 59%, transparent 83%);
          }
          .redeem-page-wrapper .grid-lines {
            display: none;
            position: absolute;
            inset: 0;
            opacity: 0.18;
            background-image:
              linear-gradient(rgba(215, 236, 253, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(215, 236, 253, 0.08) 1px, transparent 1px);
            background-size: 68px 68px;
            mask-image: radial-gradient(ellipse at 50% 46%, black 0%, transparent 72%);
          }
          .redeem-page-wrapper .blue-orb {
            display: none;
            position: absolute;
            border-radius: 50%;
            filter: blur(2px);
            opacity: 0.46;
            pointer-events: none;
          }
          .redeem-page-wrapper .blue-orb.one {
            width: min(44vw, 640px);
            aspect-ratio: 1;
            top: -24vw;
            right: -12vw;
            background: radial-gradient(circle at 42% 58%, rgba(138, 221, 255, 0.55) 0%, rgba(45, 136, 201, 0.32) 36%, transparent 70%);
            animation: driftOne 12s ease-in-out infinite;
          }
          .redeem-page-wrapper .blue-orb.two {
            width: min(47vw, 720px);
            aspect-ratio: 1;
            bottom: -31vw;
            left: -13vw;
            background: radial-gradient(circle at 58% 38%, rgba(123, 211, 255, 0.46) 0%, rgba(28, 104, 178, 0.28) 39%, transparent 70%);
            animation: driftTwo 15s ease-in-out infinite;
          }
          .redeem-page-wrapper .silver-ribbon {
            display: none;
            position: absolute;
            width: 66vw;
            height: 31vw;
            min-width: 760px;
            min-height: 360px;
            border: 1px solid rgba(231, 244, 255, 0.38);
            border-radius: 50%;
            box-shadow: 0 0 0 9px rgba(192, 216, 235, 0.045), 0 0 64px rgba(134, 207, 247, 0.14), inset 0 0 38px rgba(228, 241, 255, 0.06);
            background: linear-gradient(115deg, rgba(206, 225, 240, 0.17), transparent 18%, rgba(91, 183, 234, 0.08) 50%, rgba(229, 237, 245, 0.13) 82%, transparent);
            transform: rotate(-23deg);
            pointer-events: none;
          }
          .redeem-page-wrapper .ribbon-one { top: -13vw; left: 19vw; }
          .redeem-page-wrapper .ribbon-two {
            bottom: -16vw;
            right: 18vw;
            transform: rotate(-23deg) scale(0.82);
            opacity: 0.72;
          }
          .redeem-page-wrapper .wordmark-ghost {
            position: absolute;
            top: 48%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Almarai', sans-serif;
            font-weight: 900;
            font-size: min(25vw, 340px);
            letter-spacing: 0.14em;
            white-space: nowrap;
            user-select: none;
            pointer-events: none;
            color: transparent;
            background: linear-gradient(110deg, rgba(234, 246, 255, 0.03), rgba(235, 248, 255, 0.26), rgba(134, 202, 239, 0.05));
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-stroke: 1px rgba(220, 239, 255, 0.15);
          }
          .redeem-page-wrapper .noise {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.035;
            mix-blend-mode: soft-light;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }
          .redeem-page-wrapper .stage {
            box-sizing: border-box;
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            width: min(1240px, 100%);
            padding: 116px 6vw 86px;
            gap: clamp(56px, 9vw, 144px);
          }
          .redeem-page-wrapper .brand-corner {
            position: fixed;
            top: 28px;
            z-index: 6;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 3px 0;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            animation: fadeDown .7s ease both;
          }
          .redeem-page-wrapper .brand-corner .mark {
            width: 43px;
            height: 43px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            box-shadow: none;
          }
          .redeem-page-wrapper .brand-corner .mark img { width: 100%; height: 100%; border: 0; border-radius: 50%; object-fit: cover; box-shadow: none; }
          .redeem-page-wrapper .brand-corner > div:last-child { padding-inline-start: 0; border-inline-start: 0; }
          .redeem-page-wrapper .brand-name { font-family: 'Almarai', sans-serif; font-weight: 900; font-size: 21px; line-height: 1; letter-spacing: 0.03em; color: #fff; text-shadow: 0 1px 14px rgba(176, 228, 255, 0.28); }
          .redeem-page-wrapper .brand-tag { display: none; }
          .redeem-page-wrapper .copy { flex: 1; max-width: 554px; animation: fadeRight .8s ease both .1s; }
          .redeem-page-wrapper .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            margin-bottom: 22px;
            border: 1px solid rgba(223, 242, 255, 0.28);
            border-radius: 999px;
            background: rgba(131, 202, 244, 0.11);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
            color: #c4eaff;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
          }
          .redeem-page-wrapper .eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: #a8e7ff; box-shadow: 0 0 10px #a8e7ff; }
          .redeem-page-wrapper .headline {
            margin-bottom: 19px;
            color: #f6fbff;
            font-family: 'Almarai', sans-serif;
            font-size: clamp(38px, 4.3vw, 58px);
            font-weight: 900;
            line-height: 1.18;
            text-align: right;
            text-shadow: 0 5px 24px rgba(0, 12, 33, 0.28);
          }
          .redeem-page-wrapper[dir='ltr'] .headline { text-align: left; }
          .redeem-page-wrapper .headline .grad { background: linear-gradient(110deg, #d7f4ff 8%, #72d0ff 44%, #c5d8e6 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .redeem-page-wrapper .subtext { max-width: 445px; color: #c4d3e1; font-size: 15.5px; line-height: 1.95; text-align: right; text-shadow: 0 2px 14px rgba(0, 10, 29, 0.4); }
          .redeem-page-wrapper[dir='ltr'] .subtext { text-align: left; }
          .redeem-page-wrapper .mini-stats { display: flex; gap: 0; margin-top: 36px; border-right: 1px solid rgba(222, 241, 255, 0.34); }
          .redeem-page-wrapper[dir='ltr'] .mini-stats { border-right: 0; border-left: 1px solid rgba(222, 241, 255, 0.34); }
          .redeem-page-wrapper .mini-stats div { min-width: 104px; padding: 0 18px; text-align: right; border-left: 1px solid rgba(222, 241, 255, 0.22); }
          .redeem-page-wrapper[dir='ltr'] .mini-stats div { text-align: left; border-left: 0; border-right: 1px solid rgba(222, 241, 255, 0.22); }
          .redeem-page-wrapper .mini-stats div:first-child { padding-right: 0; }
          .redeem-page-wrapper[dir='ltr'] .mini-stats div:first-child { padding-right: 18px; padding-left: 0; }
          .redeem-page-wrapper .mini-stats div .n { color: #f4faff; font-family: 'Almarai', sans-serif; font-size: 22px; font-weight: 900; }
          .redeem-page-wrapper .mini-stats div .l { margin-top: 5px; color: #a8c4d8; font-size: 11px; font-weight: 600; }
          .redeem-page-wrapper .card {
            width: min(382px, 100%);
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
            padding: 28px 30px 31px;
            border: 1px solid rgba(219, 241, 255, 0.29);
            border-radius: 23px;
            color: var(--ice);
            text-align: center;
            background: linear-gradient(155deg, rgba(22, 37, 57, 0.96), rgba(13, 23, 38, 0.98) 57%, rgba(18, 33, 52, 0.96));
            box-shadow: 0 28px 75px rgba(0, 7, 22, 0.42), 0 0 0 5px rgba(170, 211, 246, 0.045), inset 0 1px 0 rgba(255,255,255,0.10);
            backdrop-filter: blur(26px) saturate(125%);
            -webkit-backdrop-filter: blur(26px) saturate(125%);
            animation: fadeUp .8s ease both .25s;
          }
          .redeem-page-wrapper .card::before { content: ''; position: absolute; top: 0; right: 14%; left: 14%; height: 1px; background: linear-gradient(90deg, transparent, rgba(238,249,255,0.86), transparent); box-shadow: 0 0 18px rgba(154,218,255,0.72); }
          .redeem-page-wrapper .card::after { content: ''; position: absolute; width: 280px; height: 280px; top: -166px; left: -104px; border-radius: 50%; background: radial-gradient(circle, rgba(117,202,249,0.18), transparent 70%); pointer-events: none; }
          .redeem-page-wrapper .card-topline { position: relative; z-index: 1; display: flex; justify-content: center; align-items: center; gap: 7px; margin-bottom: 18px; color: #b8dcf3; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; }
          .redeem-page-wrapper .card-topline i { width: 6px; height: 6px; border-radius: 50%; background: #82e5ff; box-shadow: 0 0 10px #82e5ff; }
          .redeem-page-wrapper .card-icon { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; width: 62px; height: 62px; margin: 0 auto 19px; border: 1px solid rgba(220,240,254,0.36); border-radius: 19px; color: #b9ecff; background: linear-gradient(145deg, rgba(166,225,255,0.28), rgba(33,101,164,0.17)); box-shadow: 0 0 30px rgba(100,207,255,0.2), inset 0 1px 0 rgba(255,255,255,0.18); }
          .redeem-page-wrapper .card-icon svg { width: 28px; height: 28px; }
          .redeem-page-wrapper .card h2 { position: relative; z-index: 1; margin-bottom: 11px; color: #f5fbff; font-family: 'Almarai', sans-serif; font-size: 21px; font-weight: 900; }
          .redeem-page-wrapper .card p { position: relative; z-index: 1; margin-bottom: 25px; color: #bed1e0; font-size: 13.5px; line-height: 1.85; }
          .redeem-page-wrapper .discord-btn { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px; border: 1px solid rgba(206,226,255,0.38); border-radius: 14px; cursor: pointer; color: white; background: linear-gradient(105deg, #385fc8 0%, #5c75e8 52%, #4165cc 100%); box-shadow: 0 12px 28px rgba(38, 82, 191, 0.35), inset 0 1px 0 rgba(255,255,255,0.25); font-family: inherit; font-size: 14.5px; font-weight: 800; transition: transform .22s ease, box-shadow .22s ease, filter .22s ease; }
          .redeem-page-wrapper .discord-btn:hover { transform: translateY(-3px); filter: brightness(1.08); box-shadow: 0 18px 35px rgba(51, 93, 211, 0.48), inset 0 1px 0 rgba(255,255,255,0.28); }
          .redeem-page-wrapper .discord-btn svg { width: 19px; height: 19px; }
          .redeem-page-wrapper .divider { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; margin: 22px 0 18px; }
          .redeem-page-wrapper .divider .line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(215,235,249,0.34), transparent); }
          .redeem-page-wrapper .divider span { color: #a9bfd0; font-size: 10px; font-weight: 700; }
          .redeem-page-wrapper .alt-link { position: relative; z-index: 1; color: #adbfce; font-size: 13px; }
          .redeem-page-wrapper .alt-link button { border: none; padding: 0; cursor: pointer; color: #bce9ff; background: transparent; font-family: inherit; font-weight: 800; text-decoration: none; }
          .redeem-page-wrapper .alt-link button:hover { color: #fff; text-decoration: underline; }
          .redeem-page-wrapper .floating-ctrls { position: fixed; top: 26px; z-index: 6; display: flex; align-items: center; gap: 9px; }
          .redeem-page-wrapper .floating-ctrls button { height: 42px; border: 1px solid rgba(203,224,245,0.18); border-radius: 13px; cursor: pointer; color: #eaf4ff; background: rgba(15, 27, 43, 0.86); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; transition: transform .2s ease, background .2s ease, border-color .2s ease; }
          .redeem-page-wrapper .floating-ctrls button:hover { transform: translateY(-2px); border-color: rgba(142,219,255,0.54); background: rgba(26, 48, 76, 0.94); }
          .redeem-page-wrapper--light { --night: #f4f8f9; --deep-blue: #eaf1f2; --ice: #102027; --silver: #71848c; --muted: #657a83; --glass: #fff; --glass-border: #dce8eb; color: #102027; background: #f4f8f9; }
          .redeem-page-wrapper .bg-gfx, .redeem-page-wrapper .noise { display: none !important; }
          .redeem-page-wrapper .stage { width: min(1120px, 100%); gap: clamp(36px, 7vw, 88px); padding: 94px 36px 56px; }
          .redeem-page-wrapper .headline { max-width: 520px; font-size: clamp(28px, 3vw, 38px); font-weight: 700; line-height: 1.45; text-shadow: none; }
          .redeem-page-wrapper .headline .grad, .redeem-page-wrapper--light .headline .grad { background: none; color: inherit; -webkit-text-fill-color: currentColor; }
          .redeem-page-wrapper .subtext { font-size: 14px; line-height: 1.8; text-shadow: none; }
          .redeem-page-wrapper .card { width: min(360px, 100%); padding: 24px; border-radius: 16px; background: #0a151d; border-color: rgba(145,190,205,.16); box-shadow: 0 14px 34px rgba(0,0,0,.16); backdrop-filter: none; -webkit-backdrop-filter: none; animation: none; }
          .redeem-page-wrapper--light .card { background: #fff; border-color: #dce8eb; box-shadow: 0 10px 24px rgba(28,60,72,.08); }
          .redeem-page-wrapper .card::before, .redeem-page-wrapper .card::after { display: none; }
          .redeem-page-wrapper .card-icon { border-color: rgba(82,216,223,.22); border-radius: 12px; background: rgba(82,216,223,.09); box-shadow: none; color: #52d8df; }
          .redeem-page-wrapper .discord-btn { border: 0; border-radius: 10px; background: #5865f2; box-shadow: none; transition: background .16s ease; }
          .redeem-page-wrapper .discord-btn:hover { transform: none; filter: none; background: #4752c4; box-shadow: none; }
          .redeem-page-wrapper .floating-ctrls button { border-radius: 9px; background: #0a151d; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
          .redeem-page-wrapper--light .floating-ctrls button { background: #fff; box-shadow: none; }
          .redeem-page-wrapper .floating-ctrls button:hover { transform: none; }
          .redeem-page-wrapper--light .bg-gfx { background: #f4f8f9; }
          .redeem-page-wrapper--light .bg-gfx::before { opacity: 0.10; background: linear-gradient(115deg, rgba(255,255,255,0.7), transparent 35%, rgba(95,168,212,0.12) 66%, transparent 85%); }
          .redeem-page-wrapper--light .grid-lines { opacity: 0.6; background-image: linear-gradient(rgba(56, 125, 175, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 125, 175, 0.1) 1px, transparent 1px); }
          .redeem-page-wrapper--light .silver-ribbon { border-color: rgba(69, 134, 179, 0.28); background: linear-gradient(115deg, rgba(255,255,255,0.46), transparent 18%, rgba(83, 165, 215, 0.09) 50%, rgba(255,255,255,0.42) 82%, transparent); box-shadow: 0 0 0 9px rgba(104, 169, 211, 0.06), 0 0 64px rgba(86, 170, 226, 0.14), inset 0 0 38px rgba(255,255,255,0.32); }
          .redeem-page-wrapper--light .wordmark-ghost { background: linear-gradient(110deg, rgba(36, 104, 151, 0.05), rgba(64, 137, 185, 0.22), rgba(45, 119, 167, 0.04)); -webkit-text-stroke-color: rgba(56, 125, 175, 0.16); }
          .redeem-page-wrapper--light .floating-ctrls button { border-color: rgba(67, 132, 177, 0.2); color: #163754; background: rgba(255, 255, 255, 0.64); box-shadow: 0 14px 40px rgba(50, 111, 153, 0.12), inset 0 1px 0 rgba(255,255,255,0.78); }
          .redeem-page-wrapper--light .brand-corner { border: 0; color: #163754; background: transparent; box-shadow: none; }
          .redeem-page-wrapper--light .brand-name, .redeem-page-wrapper--light .headline, .redeem-page-wrapper--light .card h2 { color: #102845; text-shadow: none; }
          .redeem-page-wrapper--light .brand-tag, .redeem-page-wrapper--light .card-topline { color: #2873a8; }
          .redeem-page-wrapper--light .headline .grad { background: linear-gradient(110deg, #155a90 8%, #2e93ce 48%, #426d90 100%); -webkit-background-clip: text; background-clip: text; }
          .redeem-page-wrapper--light .subtext, .redeem-page-wrapper--light .card p { color: #506e89; text-shadow: none; }
          .redeem-page-wrapper--light .mini-stats { border-color: rgba(67, 132, 177, 0.28); }
          .redeem-page-wrapper--light .mini-stats div { border-color: rgba(67, 132, 177, 0.2); }
          .redeem-page-wrapper--light .mini-stats div .n { color: #173b5d; }
          .redeem-page-wrapper--light .mini-stats div .l, .redeem-page-wrapper--light .alt-link { color: #5d7893; }
          .redeem-page-wrapper--light .card { color: #102845; border-color: rgba(73, 137, 185, 0.25); background: linear-gradient(145deg, rgba(255, 255, 255, 0.84), rgba(232, 245, 253, 0.9) 58%, rgba(211, 234, 247, 0.72)); box-shadow: 0 30px 90px rgba(49, 113, 157, 0.16), 0 0 0 5px rgba(104, 174, 219, 0.06), inset 0 1px 0 rgba(255,255,255,0.88); }
          .redeem-page-wrapper--light .card::before { background: linear-gradient(90deg, transparent, rgba(47, 138, 196, 0.7), transparent); box-shadow: 0 0 18px rgba(76, 173, 226, 0.52); }
          .redeem-page-wrapper--light .card-icon { color: #1c6b9f; border-color: rgba(76, 149, 196, 0.26); background: linear-gradient(145deg, rgba(255,255,255,0.84), rgba(143, 209, 242, 0.3)); }
          .redeem-page-wrapper--light .divider .line { background: linear-gradient(90deg, transparent, rgba(67, 132, 177, 0.32), transparent); }
          .redeem-page-wrapper--light .divider span { color: #61809b; }
          .redeem-page-wrapper--light .alt-link button { color: #2176ae; }
          .redeem-page-wrapper--light .card { background: #fff; border-color: #dce8eb; box-shadow: 0 10px 24px rgba(28,60,72,.08); }
          .redeem-page-wrapper--light .card::before, .redeem-page-wrapper--light .card::after { display: none; }
          .redeem-page-wrapper--light .card-icon { border-color: rgba(24,175,192,.2); background: rgba(24,175,192,.08); box-shadow: none; color: #18afc0; }
          .redeem-page-wrapper--light .headline .grad { background: none; color: inherit; -webkit-text-fill-color: currentColor; }
          .redeem-page-wrapper--light .eyebrow { background: rgba(24,175,192,.08); border-color: rgba(24,175,192,.18); box-shadow: none; color: #167783; }
          .redeem-page-wrapper--light .eyebrow .dot { background: #18afc0; box-shadow: none; }
          .redeem-page-wrapper--light .card-topline i { background: #18afc0; box-shadow: none; }
          @keyframes mistFloat { from { transform: translate3d(-1.5%, -1%, 0) scale(1); } to { transform: translate3d(2%, 1.5%, 0) scale(1.05); } }
          @keyframes driftOne { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-22px, 18px, 0) scale(1.04); } }
          @keyframes driftTwo { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(24px, -18px, 0) scale(1.03); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeRight { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
          @media (max-width: 900px) {
            .redeem-page-wrapper .stage { flex-direction: column; gap: 46px; padding: 126px 24px 64px; text-align: center; }
            .redeem-page-wrapper .copy { max-width: 100%; }
            .redeem-page-wrapper .headline, .redeem-page-wrapper .subtext { text-align: center !important; margin-left: auto; margin-right: auto; }
            .redeem-page-wrapper .mini-stats { justify-content: center; border: 0; }
            .redeem-page-wrapper .mini-stats div { min-width: auto; padding: 0 13px; text-align: center !important; }
            .redeem-page-wrapper .mini-stats div:first-child { padding-right: 13px; }
            .redeem-page-wrapper .silver-ribbon { min-width: 560px; min-height: 280px; }
          }
          @media (max-width: 560px) {
            .redeem-page-wrapper .brand-corner { top: 18px; padding: 6px 9px 6px 6px; }
            .redeem-page-wrapper .brand-corner .mark { width: 39px; height: 39px; border-radius: 50%; }
            .redeem-page-wrapper .brand-name { font-size: 16px; }
            .redeem-page-wrapper .floating-ctrls { top: 74px !important; }
            .redeem-page-wrapper .stage { padding-top: 150px; }
            .redeem-page-wrapper .headline { font-size: 36px; }
            .redeem-page-wrapper .mini-stats { gap: 0; }
            .redeem-page-wrapper .mini-stats div { padding: 0 9px; }
            .redeem-page-wrapper .mini-stats div .n { font-size: 18px; }
            .redeem-page-wrapper .mini-stats div .l { font-size: 10px; }
            .redeem-page-wrapper .card { padding: 27px 23px 28px; }
          }
        ` }} />

        {/* Interwoven blue and silver background */}
        <div className="bg-gfx" aria-hidden="true">
          <div className="grid-lines" />
          <div className="blue-orb one" />
          <div className="blue-orb two" />
          <div className="silver-ribbon ribbon-one" />
          <div className="silver-ribbon ribbon-two" />
        </div>
        <div className="noise" />

        {/* Prominent brand signature */}
        <div className="brand-corner" style={{ [lang === 'ar' ? 'right' : 'left']: '42px' }}>
          <div className="mark">
            <Image src="/logo.png" width={43} height={43} alt="شعار تعن" />
          </div>
          <div>
          <div className="brand-name">{lang === 'ar' ? 'بوابة عتن' : 'TA3N PORTAL'}</div>
            <div className="brand-tag">{lang === 'ar' ? 'منصة التراخيص' : 'LICENSE PLATFORM'}</div>
          </div>
        </div>

        {/* Floating Controls Container (Theme & Language Switchers) */}
        <div className="floating-ctrls" style={{ [lang === 'ar' ? 'left' : 'right']: '20px' }}>
          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-10"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-4 gap-2"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <span className="leading-none">{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        <div className="stage">
          {/* Left / Copy Section */}
          <div className="copy">
            <div className="eyebrow">
              <span className="dot" />
              {lang === 'ar' ? 'بوابة المنتجات الرقمية' : 'Digital products portal'}
            </div>
            
            <h1 className="headline">
              {lang === 'ar' ? (
                <>
                  إدارة منتجاتك<br /><span className="grad">من مكان واحد</span>
                </>
              ) : (
                <>
                  Manage your products<br /><span className="grad">in one place</span>
                </>
              )}
            </h1>
            
            <p className="subtext">
              {lang === 'ar' 
                ? 'سجّل الدخول عبر Discord للوصول إلى منتجاتك ومفاتيحك.'
                : 'Sign in with Discord to manage your products and licenses.'}
            </p>
            
          </div>

          {/* Side Discord access card */}
          <div className="card">
            <div className="card-topline"><i /> {lang === 'ar' ? 'تسجيل دخول' : 'LOGIN'}</div>
            <div className="card-icon">
              <DiscordIcon className="h-7 w-7" />
            </div>
            
            <h2>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</h2>
            
            <p>
              {lang === 'ar' 
                ? 'اربط حساب ديسكورد الخاص بك لاسترداد وإدارة تراخيصك.' 
                : 'Link your Discord account to redeem and manage your licenses.'}
            </p>
            
            <button 
              onClick={() => signIn('discord')}
              className="discord-btn"
            >
              <span className="discord-btn__icon" aria-hidden="true"><DiscordIcon className="h-5 w-5" /></span>
              <span>{lang === 'ar' ? 'المتابعة عبر ديسكورد' : 'Continue with Discord'}</span>
            </button>
            
            <div className="divider">
              <span className="line" />
              <span>{lang === 'ar' ? 'أو' : 'OR'}</span>
              <span className="line" />
            </div>
            
            <div className="alt-link">
              <span>{lang === 'ar' ? 'لديك مفتاح؟ سجّل الدخول لتفعيله.' : 'Have a key? Sign in to activate it.'}</span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div 
          className="absolute bottom-6 left-8 text-xs font-medium text-slate-500 tracking-wide z-10"
          dir="rtl"
        >
          © 2026 جميع الحقوق محفوظة لمنصة {renderBrandText('تعن')}
        </div>

      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER STATE 2: LOGGED-IN CUSTOMER PORTAL
  // ---------------------------------------------------------------------------
  if (currentUser?.isBanned || currentUser?.isArchived) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#071016] text-[#EEF8FA]' : 'bg-[#F4F8F9] text-[#102027]'} flex flex-col items-center justify-center p-4 relative overflow-hidden`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md ${isDark ? 'bg-[#0A151D] border-white/10' : 'bg-white border-[#DCE8EB] shadow-sm'} border rounded-2xl p-7 text-center space-y-5 relative z-10`}
        >
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto ${currentUser.isBanned ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600'}`}>
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className={`text-lg font-semibold ${currentUser.isBanned ? 'text-rose-500' : ''}`}>
              {currentUser.isBanned ? (lang === 'ar' ? 'تم حظر حسابك' : 'Your account is banned') : (lang === 'ar' ? 'الحساب مؤرشف' : 'Account archived')}
            </h2>
            <p className={`text-xs ${styles.textMuted} leading-relaxed px-2`}>
              {currentUser.isBanned ? (lang === 'ar' ? 'تم تقييد الوصول إلى هذا الحساب من قبل الإدارة.' : 'Access to this account has been restricted by an administrator.') : (lang === 'ar' ? 'هذا الحساب مؤرشف حاليًا. تواصل مع إدارة المتجر لإعادة تفعيله.' : 'This account is archived. Contact the store administrator to restore access.')}
            </p>
          </div>

          {currentUser.isBanned ? <div className={`p-4 rounded-xl ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'} border text-start space-y-3`}>
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
          </div> : currentUser.archivedAt && <p className={`text-xs ${styles.textMuted}`}>{lang === 'ar' ? 'تاريخ الأرشفة:' : 'Archived:'} {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' }).format(new Date(currentUser.archivedAt))}</p>}

          <button
            onClick={handleLogout}
            className="w-full min-h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
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
    faqs: lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently asked questions',
    redeem: lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key',
    profile: lang === 'ar' ? 'الملف الشخصي' : 'Profile',
    admin: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Control',
  }[activeTab];

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
          setActiveTab(tab);
        }}
        lang={lang}
        isDark={isDark}
        isAdmin={isAdmin}
        productCount={activeProductCount}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        mobileOpen={mobileMenuOpen}
        onMobileChange={setMobileMenuOpen}
        onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
        onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        onLogout={handleLogout}
        user={{ ...currentUser, role: isAdmin ? (lang === 'ar' ? 'مسؤول النظام' : 'Administrator') : (lang === 'ar' ? 'عميل' : 'Customer') }}
      />

      {/* Main Content Area */}
      <main className="portal-main-content portal-scroll-region flex-grow h-full overflow-y-auto p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-8 relative z-10">
        <div className="portal-content-frame max-w-[1520px] mx-auto space-y-6">

        <CustomerAnnouncements lang={lang} />

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
              onClick={async () => {
                try {
                  const response = await fetch('/api/user/warning', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'acknowledge' }),
                  });
                  const result = await response.json();
                  if (!response.ok || !result.success) throw new Error(result.error || 'Could not acknowledge warning.');
                  setSyncedUser((user) => user ? { ...user, warningMessage: null } : user);
                } catch {
                  showToast(lang === 'ar' ? 'تعذر تأكيد التنبيه. حاول مجدداً.' : 'Could not acknowledge the warning. Try again.', 'error');
                }
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="overview-dashboard grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              {/* Welcome banner: the spacious anchor of the dashboard. */}
              <section className={`overview-welcome-card relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-white/[0.14] bg-[#171b22]/92 text-white' : 'border-slate-200 bg-white text-slate-950 shadow-[0_18px_38px_rgba(30,64,95,0.08)]'}`}>
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(110deg,rgba(255,255,255,0.055),transparent_42%,rgba(88,172,234,0.10))]" />
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <Image
                    src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    width={56}
                    height={56}
                    unoptimized
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

              <section className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-white/[0.13] bg-[#171b22]/90' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.07)]'}`} aria-labelledby="customer-recent-activity">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 id="customer-recent-activity" className={`flex items-center gap-2 text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-950'}`}><Activity className="h-4 w-4 text-sky-500" />{lang === 'ar' ? 'آخر العمليات' : 'Recent activity'}</h2>
                  <button type="button" onClick={() => setActiveTab('my-products')} className={`text-xs font-bold ${isDark ? 'text-sky-200 hover:text-white' : 'text-sky-700 hover:text-sky-900'}`}>{lang === 'ar' ? 'منتجاتي' : 'My products'} <span aria-hidden="true">→</span></button>
                </div>
                {userActivity.length ? <ul className="space-y-3">{userActivity.slice(0, 5).map((event) => {
                  const occurredAt = new Date(event.occurredAt);
                  const formattedDate = Number.isNaN(occurredAt.getTime()) ? '—' : new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(occurredAt);
                  return <li key={event.id} className={`flex items-start justify-between gap-4 border-t pt-3 first:border-0 first:pt-0 ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                    <div className="min-w-0"><p className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{event.description}</p>{event.productId && <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{userProducts.find((product) => product.productId === event.productId)?.product?.name || event.productId}</p>}</div>
                    <time className={`shrink-0 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`} dateTime={Number.isNaN(occurredAt.getTime()) ? undefined : occurredAt.toISOString()}>{formattedDate}</time>
                  </li>;
                })}</ul> : <p className={`py-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isLoadingProducts ? (lang === 'ar' ? 'جارٍ تحميل النشاط...' : 'Loading activity...') : (lang === 'ar' ? 'لا توجد عمليات مسجلة حتى الآن.' : 'No activity recorded yet.')}</p>}
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
                  <span className="text-xs font-medium mt-1 text-neutral-500">{lang === 'ar' ? 'الأخبار والمجتمع' : 'News and community'}</span>
                    </div>
                  </div>
                  <ArrowLeft className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-neutral-600 group-hover:text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-800'} ${lang === 'ar' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
                </a>

                <button
                  onClick={() => setActiveTab('my-products')}
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
                </button>

              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MY PRODUCTS */}
        {activeTab === 'my-products' && (
          <div className="products-experience space-y-6">
            {resetCompletionNotice && <section dir={lang === 'ar' ? 'rtl' : 'ltr'} role="alert" className={`relative overflow-hidden rounded-[24px] border p-5 shadow-[0_22px_48px_rgba(16,185,129,.14)] sm:p-6 ${isDark ? 'border-emerald-300/[.28] bg-[linear-gradient(135deg,rgba(6,78,59,.88),rgba(10,36,42,.94))] text-emerald-50' : 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f0fdfa)] text-emerald-950'}`}>
              <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${isDark ? 'border-emerald-200/25 bg-emerald-300/[.14] text-emerald-100' : 'border-emerald-200 bg-white text-emerald-600'}`}><CheckCircle2 className="h-6 w-6" /></span><div><p className={`text-[10px] font-black tracking-[.16em] ${isDark ? 'text-emerald-200/75' : 'text-emerald-700/75'}`}>{lang === 'ar' ? 'تحديث الترخيص' : 'LICENSE UPDATE'}</p><h3 className="mt-1 text-base font-black sm:text-lg">{lang === 'ar' ? 'تم رستات المفتاح الخاص بك بنجاح' : 'Your license key was reset successfully'}</h3><p className={`mt-1.5 max-w-2xl text-xs leading-6 ${isDark ? 'text-emerald-50/80' : 'text-emerald-900/75'}`}>{resetCompletionNotice.message}</p><p className={`mt-1 text-[11px] font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{lang === 'ar' ? 'يمكنك الآن التسجيل أو تشغيل المنتج من جديد.' : 'You can now register or start the product again.'}</p></div></div>
                <button type="button" disabled={isAcknowledgingResetCompletion} onClick={async () => { const notice = resetCompletionNotice; if (!notice || isAcknowledgingResetCompletion) return; setIsAcknowledgingResetCompletion(true); setResetCompletionNotice(null); try { const response = await fetch('/api/reset-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: 'notification_seen', notificationId: notice.id }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error('mark-seen-failed'); } catch { setResetCompletionNotice(notice); } finally { setIsAcknowledgingResetCompletion(false); } }} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{isAcknowledgingResetCompletion ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isAcknowledgingResetCompletion ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (lang === 'ar' ? 'متابعة' : 'Continue')}</button>
              </div>
            </section>}

            <section className={`products-page-hero flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-sky-100/[0.14] bg-[#0d1c2f]/82' : 'border-slate-200 bg-white shadow-[0_14px_32px_rgba(30,64,95,0.08)]'}`}>
              <div className="min-w-0">
                <p className={`text-[10px] font-black tracking-[0.16em] uppercase ${isDark ? 'text-sky-200/70' : 'text-sky-700/70'}`}>{lang === 'ar' ? 'مكتبة التراخيص' : 'License Library'}</p>
                <h2 className={`mt-1 text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{lang === 'ar' ? 'منتجاتي' : 'My Products'}</h2>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-300/75' : 'text-slate-600'}`}>{lang === 'ar' ? 'إدارة منتجاتك وحالات التفعيل بسهولة من مكان واحد.' : 'Manage your products and activation states from one place.'}</p>
              </div>
              <button
                onClick={() => setActiveTab('redeem')}
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
                  onClick={() => setActiveTab('redeem')}
                  className="bg-white hover:bg-neutral-200 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                >
                  <Key className="w-4 h-4 text-black" />
                  <span>{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</span>
                </button>
              </div>
            ) : (
              <div className="product-library mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
                {sortedUserProducts.map((up, index) => {
                  const displayKey = up.keyString || (lang === 'ar' ? 'من تعن' : 'From TA3N');
                  const timing = getLicenseTiming(up);
                  const canUseProduct = timing.isUsable;
                  const previousTiming = index > 0 ? getLicenseTiming(sortedUserProducts[index - 1]) : null;
                  const startsExpiredSection = !canUseProduct && (!previousTiming || previousTiming.isUsable);
                  const productImg = getProductImage(up.product);

                  return (
                    <React.Fragment key={up.id}>
                      {index === 0 && canUseProduct && (
                        <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-sky-200" />
                            <div>
                              <p className="text-sm font-extrabold text-white">{lang === 'ar' ? 'التراخيص النشطة' : 'Active licenses'}</p>
                              <p className="mt-0.5 text-[11px] text-sky-100/65">{lang === 'ar' ? 'منتجاتك المتاحة للتحميل والمشاهدة الآن.' : 'Products ready to download and view now.'}</p>
                            </div>
                          </div>
                          <span className="rounded-full border border-sky-200/20 bg-sky-200/[0.08] px-2.5 py-1 text-[11px] font-bold text-sky-100">{activeProductCount}</span>
                        </div>
                      )}
                      {startsExpiredSection && (
                        <div className="md:col-span-2 mt-2 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-7">
                          <div className="flex items-center gap-2.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-sm font-extrabold text-slate-300">{lang === 'ar' ? 'التراخيص المنتهية والقديمة' : 'Expired & previous licenses'}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">{lang === 'ar' ? 'احتفظنا بها لسجلّك، ويمكن تجديدها باستخدام مفتاح جديد.' : 'Kept for your records; renew with a new key.'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowExpiredLicenses((current) => !current)}
                            aria-expanded={showExpiredLicenses}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:border-sky-300/30 hover:bg-sky-300/[0.06] hover:text-sky-100"
                          >
                            <span>{showExpiredLicenses ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'عرض' : 'Show')}</span>
                            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400">{inactiveProductCount}</span>
                            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${showExpiredLicenses ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      )}
                    {(canUseProduct || showExpiredLicenses) && <article
                      className={`product-license-card product-license-card--premium group ${canUseProduct ? '' : 'opacity-75 grayscale-[0.15]'}`}
                      data-active={canUseProduct ? 'true' : 'false'}
                    >
                      <div className="product-license-card__media" aria-hidden="true">
                        <Image className="product-license-card__image" src={productImg || '/logo.png'} width={640} height={360} unoptimized alt="" loading="lazy" onError={(e) => { if (!e.currentTarget.src.endsWith('/logo.png')) e.currentTarget.src = '/logo.png'; }} />
                        <div className="product-license-card__media-overlay" />
                        <div className={`product-license-card__expiry ${timing.isExpired ? 'product-license-card__expiry--expired' : ''}`}>
                          <Clock size={12} />
                          <span>{timing.isExpired ? (lang === 'ar' ? 'انتهت صلاحية الترخيص' : 'License expired') : `${lang === 'ar' ? 'متبقي' : 'Remaining'} · ${timing.countdown}`}</span>
                        </div>
                        <span className={`product-license-card__status ${canUseProduct ? 'product-license-card__status--active' : ''}`}>
                          <span className="product-license-card__status-dot" />
                          {canUseProduct ? (lang === 'ar' ? 'مفعّل' : 'Active') : (lang === 'ar' ? 'منتهٍ' : 'Expired')}
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
                            onClick={() => handleDownload(up.productId)}
                            disabled={!canUseProduct}
                            className="product-download-button"
                          >
                            <Download size={14} />
                            {lang === 'ar' ? 'تحميل اللودر' : 'Download Loader'}
                          </button>
                          <button
                            onClick={() => { setGuideModalProduct(up); setGuideView('menu'); }}
                            disabled={!canUseProduct}
                            className="product-guide-button"
                          >
                            <HelpCircle size={13} />
                            {lang === 'ar' ? 'دليل المنتج' : 'Product guide'}
                          </button>
                        </div>
                        <button
                          onClick={() => { setResetRequestProduct(up); setResetRequestReason(''); }}
                          disabled={!canUseProduct}
                          className="product-reset-button"
                        >
                          <span className="product-reset-button__icon"><RefreshCw size={15} /></span>
                          <span className="min-w-0 text-start"><span className="block text-[10px] font-black">{lang === 'ar' ? 'طلب إعادة ضبط المفتاح' : 'Request key reset'}</span><span className="mt-0.5 block text-[8px] font-bold opacity-70">{lang === 'ar' ? 'أرسل سبب الطلب دون مشاركة المفتاح' : 'Submit a reason without sharing the key'}</span></span>
                        </button>
                      </div>
                    </article>}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

          </div>
        )}
        {activeTab === 'faqs' && <FaqPage lang={lang} products={products} preferredProductIds={sortedUserProducts.filter((product) => getLicenseTiming(product).isUsable).map((product) => product.productId)} onOpenProducts={() => setActiveTab('my-products')} />}

        {activeTab === 'redeem' && (
          <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-3xl space-y-5">
            <header className="portal-page-header">
              <div className="portal-page-header__copy">
                <h2>{lang === 'ar' ? 'تفعيل مفتاح' : 'Activate a key'}</h2>
                <p>{lang === 'ar' ? 'أدخل مفتاح المنتج لربطه بحسابك.' : 'Enter your product key to add it to your account.'}</p>
              </div>
            </header>
            {activationResult ? (
              <section className={`space-y-5 rounded-xl border p-5 ${isDark ? 'border-white/10 bg-[#0d1b24]' : 'border-[#dce8eb] bg-white'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div><h3 className="text-sm font-semibold">{lang === 'ar' ? 'تم تفعيل المفتاح' : 'Key activated'}</h3><p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activationResult.productName}</p></div>
                </div>
                <dl className="grid gap-3 border-t border-inherit pt-4 sm:grid-cols-2">
                  <div><dt className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'مدة الترخيص' : 'License duration'}</dt><dd className="mt-1 text-sm font-medium">{!activationResult.licenseFound ? '—' : activationResult.expiresAt && activationResult.activatedAt ? `${Math.max(1, Math.round((Date.parse(activationResult.expiresAt) - Date.parse(activationResult.activatedAt)) / 86400000))} ${lang === 'ar' ? 'يوم' : 'days'}` : (lang === 'ar' ? 'مدى الحياة' : 'Lifetime')}</dd></div>
                  <div><dt className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiration date'}</dt><dd className="mt-1 text-sm font-medium">{!activationResult.licenseFound ? '—' : activationResult.expiresAt ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' }).format(new Date(activationResult.expiresAt)) : (lang === 'ar' ? 'لا ينتهي' : 'No expiration')}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setActiveTab('my-products')} className="min-h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950">{lang === 'ar' ? 'الذهاب إلى منتجاتي' : 'Go to my products'}</button><button type="button" onClick={() => { setActivationResult(null); setRedeemMessage(null); }} className={`min-h-10 rounded-lg border px-4 text-sm ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>{lang === 'ar' ? 'تفعيل مفتاح آخر' : 'Activate another key'}</button></div>
              </section>
            ) : (
              <form onSubmit={(event) => void handleRedeemKey(event, undefined, true)} className={`space-y-4 rounded-xl border p-5 ${isDark ? 'border-white/10 bg-[#0d1b24]' : 'border-[#dce8eb] bg-white'}`}>
                <label htmlFor="license-key" className="block text-sm font-medium">{lang === 'ar' ? 'مفتاح المنتج' : 'Product key'}</label>
                <input id="license-key" autoComplete="off" required dir="ltr" value={keyInput} onChange={(event) => { setKeyInput(event.target.value); setRedeemMessage(null); }} placeholder="KEY-XXXXXX-XXXXXX" className={`h-11 w-full rounded-lg border px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-cyan-400/20 ${isDark ? 'border-white/10 bg-[#071016] text-white placeholder:text-slate-500' : 'border-slate-200 bg-[#f9fcfc] text-slate-900 placeholder:text-slate-400'}`} />
                {redeemMessage?.type === 'error' && <p role="alert" className="text-sm text-rose-500">{redeemMessage.text}</p>}
                <button type="submit" disabled={isRedeeming || !keyInput.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">{isRedeeming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}{isRedeeming ? (lang === 'ar' ? 'جارٍ التفعيل...' : 'Activating...') : (lang === 'ar' ? 'تفعيل المفتاح' : 'Activate key')}</button>
              </form>
            )}
          </section>
        )}
        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-2xl mx-auto py-6 animate-slide-up">
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
                <Image
                  src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  width={80}
                  height={80}
                  unoptimized
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
                  {lang === 'ar' ? 'تاريخ الانضمام:' : 'Joined:'} {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' }) : '—'}
                </p>
              </div>
            </div>

            {/* Preferences & Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Appearance Setting */}
              <div className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className={`text-sm font-bold ${styles.textTitle} mb-1 flex items-center gap-2`}>
                    <Sun className="w-4 h-4 text-cyan-500" />
                    <span>{lang === 'ar' ? 'المظهر والمرئيات' : 'Appearance & Theme'}</span>
                  </h3>
                  <p className={`text-[11px] ${styles.textMuted} mb-5`}>
                    {lang === 'ar' ? 'اختر الوضع المفضل لديك لتصفح مريح' : 'Choose your preferred color theme for the portal'}
                  </p>
                </div>
                <div className="profile-segmented flex gap-2">
                  <button aria-pressed={theme === 'light'}
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isDark 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    {lang === 'ar' ? 'فاتح' : 'Light Mode'}
                  </button>
                  <button aria-pressed={theme === 'dark'}
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/15' 
                        : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted} hover:${styles.textTitle}`
                    }`}
                  >
                    {lang === 'ar' ? 'داكن' : 'Dark Mode'}
                  </button>
                  <button aria-pressed={theme === 'system'} onClick={() => setTheme('system')} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${theme === 'system' ? 'bg-cyan-500 border-cyan-500 text-slate-950' : `${styles.bgInnerCard} ${styles.borderNormal} ${styles.textMuted}`}`}>{lang === 'ar' ? 'النظام' : 'System'}</button>
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
          <div className="admin-workspace space-y-5 w-full max-w-[1440px] mx-auto">
            {/* Top Admin Header */}
            <div className={`admin-hero ${styles.bgCard} border ${styles.borderNormal} rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="min-w-0">
                <p className={`admin-hero__eyebrow ${styles.textMuted}`}>{lang === 'ar' ? 'إدارة المنصة' : 'PLATFORM MANAGEMENT'}</p>
                <h1 className={`text-2xl font-extrabold ${styles.textTitle} tracking-wide flex items-center gap-3`}>
                  <div className={`p-2 bg-black/5 dark:bg-white/5 rounded-xl border ${styles.borderSubtle}`}>
                    {adminSectionTab === 'overview' && <Activity className="w-6 h-6 text-sky-500 dark:text-sky-400" />}
                    {adminSectionTab === 'products' && <Package className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    {adminSectionTab === 'customers' && <Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />}
                    {adminSectionTab === 'faqs' && <HelpCircle className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />}
                    {adminSectionTab === 'updates' && <Megaphone className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />}
                    {adminSectionTab === 'resetRequests' && <RefreshCw className="w-6 h-6 text-amber-500 dark:text-amber-300" />}
                    {adminSectionTab === 'keys' && <Key className="w-6 h-6 text-indigo-600 dark:text-primary" />}
                    {adminSectionTab === 'logs' && <FileText className="w-6 h-6 text-orange-500 dark:text-orange-400" />}
                    {adminSectionTab === 'settings' && <Settings2 className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />}
                  </div>
                  <span>
                    {adminSectionTab === 'overview' && (lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Overview & Stats')}
                    {adminSectionTab === 'products' && (lang === 'ar' ? 'إدارة المنتجات والمخزون' : 'Products & Inventory')}
                    {adminSectionTab === 'customers' && (lang === 'ar' ? 'إدارة العملاء' : 'Customers Management')}
                    {adminSectionTab === 'faqs' && (lang === 'ar' ? 'الأسئلة الشائعة للمنتجات' : 'Product FAQs')}
                    {adminSectionTab === 'updates' && (lang === 'ar' ? 'تحديثات الموقع الرسمية' : 'Official Website Updates')}
                    {adminSectionTab === 'resetRequests' && (lang === 'ar' ? 'طلبات رستات المفاتيح' : 'Key Reset Requests')}
                    {adminSectionTab === 'keys' && (lang === 'ar' ? 'البحث في المفاتيح' : 'Keys Search')}
                  {adminSectionTab === 'logs' && (lang === 'ar' ? 'سجلات النظام' : 'System Logs')}
                  {adminSectionTab === 'settings' && (lang === 'ar' ? 'إعدادات النظام' : 'System settings')}
                  </span>
                </h1>
                <p className={`text-xs ${styles.textMuted} mt-2`}>
                  {adminSectionTab === 'overview' && (lang === 'ar' ? <>إحصائيات شاملة ومباشرة لمنصة {renderBrandText('تعن')} الرقمية.</> : 'Comprehensive live stats for the TA3N portal.')}
                  {adminSectionTab === 'products' && (lang === 'ar' ? 'تحكم كامل في إعدادات المنتجات وإضافة المفاتيح اليدوية.' : 'Full control over product settings and manual key addition.')}
                  {adminSectionTab === 'customers' && (lang === 'ar' ? 'استعراض بيانات العملاء، حظر، ومراجعة أنشطتهم.' : 'Browse customer data, manage bans, and audit their activities.')}
                  {adminSectionTab === 'faqs' && (lang === 'ar' ? 'أضف أسئلة وإجابات موثقة واربط كل سؤال بمنتج موجود.' : 'Add verified questions and answers linked to an existing product.')}
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

            <div className="admin-panel-layout">
            {/* Admin Sub-Tabs Navigation */}
            <div role="tablist" aria-label={lang === 'ar' ? 'أقسام لوحة الإدارة' : 'Admin sections'} className={`admin-navigation grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 bg-black/5 dark:bg-[#090b10] border ${styles.borderSubtle} rounded-2xl w-full`}>
              {[
                { id: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: Activity },
                { id: 'products', label: lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock', icon: Package },
                { id: 'customers', label: lang === 'ar' ? 'إدارة العملاء' : 'Customers', icon: Users },
                { id: 'sitePresence', label: lang === 'ar' ? 'نشاط الموقع' : 'Site Presence', icon: UserCheck },
                { id: 'faqs', label: lang === 'ar' ? 'الأسئلة الشائعة' : 'Product FAQs', icon: HelpCircle },
                { id: 'updates', label: lang === 'ar' ? 'تحديثات الموقع' : 'Website Updates', icon: Megaphone },
                { id: 'resetRequests', label: lang === 'ar' ? 'طلبات رستات المفاتيح' : 'Key Reset Requests', icon: RefreshCw },
                { id: 'keys', label: lang === 'ar' ? 'البحث عن المفاتيح' : 'Keys Search', icon: Key },
                { id: 'logs', label: lang === 'ar' ? 'سجلات النظام' : 'System Logs', icon: FileText },
                { id: 'roles', label: lang === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions', icon: Shield },
                { id: 'announcements', label: lang === 'ar' ? 'الإعلانات والبث' : 'Announcements & Broadcast', icon: Megaphone },
                { id: 'settings', label: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings2 },
              ].filter((tab) => { const permissionByTab: Record<string, string> = { overview: 'dashboard.view', products: 'products.view', customers: 'users.view', sitePresence: 'users.view', faqs: 'faq.view', updates: 'announcements.view', resetRequests: 'keys.reset', keys: 'keys.view', logs: 'logs.view', roles: 'roles.view', announcements: 'announcements.view', settings: 'settings.view' }; return adminPermissions.includes(permissionByTab[tab.id] || 'dashboard.view'); }).map((tab) => {
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
            </div>

            <div className="admin-panel-content">
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
                  {adminPermissions.includes('products.create') && <button
                    onClick={openAddProductModal}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer self-start sm:self-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة منتج جديد' : 'Add Product'}</span>
                  </button>}
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
                    {adminPermissions.includes('products.create') && <button
                      onClick={openAddProductModal}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إضافة منتج جديد الآن' : 'Add First Product'}</span>
                    </button>}
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
                          <Image
                            src={getProductImage(product)}
                            width={640}
                            height={192}
                            unoptimized
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
                            {adminPermissions.includes('inventory.edit') && <button
                              onClick={() => openInventoryModal(product, 'codes', true)}
                              className="py-3 px-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white dark:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-indigo-500/20"
                            >
                              <Key className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'إضافة مفاتيح' : 'Add Keys'}</span>
                            </button>}

                            {adminPermissions.includes('products.edit') && <button
                              onClick={() => openInventoryModal(product, 'data', false)}
                              className={`py-3 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border ${styles.borderNormal} rounded-xl text-xs font-bold ${styles.textTitle} transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5`}
                            >
                              <Edit3 className={`w-4 h-4 ${styles.textMuted}`} />
                              <span>{lang === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</span>
                            </button>}
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
              <AdminCustomerTable
                lang={lang}
                styles={styles}
                customers={pagedAdminCustomers}
                resultCount={filteredAdminCustomers.length}
                page={safeCustomerPage}
                pageCount={customerPageCount}
                pageSize={customerPageSize}
                search={searchCustomerQuery}
                roleFilter={customerRoleFilter}
                statusFilter={customerStatusFilter}
                canEdit={adminPermissions.includes('users.edit')}
                canDisable={adminPermissions.includes('users.disable')}
                onSearch={(value) => { setSearchCustomerQuery(value); setCustomerPage(0); }}
                onRoleFilter={(value) => { setCustomerRoleFilter(value); setCustomerPage(0); }}
                onStatusFilter={(value) => { setCustomerStatusFilter(value); setCustomerPage(0); }}
                onPageChange={setCustomerPage}
                onOpenCustomer={openCustomerModal}
                onDisableCustomer={(customer) => handleDisableUserAccount(customer.id, customer.name || '')}
              />
            )}
            {adminSectionTab === 'sitePresence' && (
              <SitePresenceAdmin lang={lang} isDark={isDark} />
            )}

            {adminSectionTab === 'faqs' && <ProductFaqAdmin products={products} lang={lang} isDark={isDark} onNotify={showToast} canCreate={adminPermissions.includes('faq.create')} canEdit={adminPermissions.includes('faq.edit')} canDelete={adminPermissions.includes('faq.delete')} />}

            {adminSectionTab === 'updates' && (
              <SiteUpdatesAdmin lang={lang} isDark={isDark} onNotify={showToast} canCreate={adminPermissions.includes('announcements.create')} canPublish={adminPermissions.includes('announcements.publish')} />
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
                                {keyObj.isUsed && adminPermissions.includes('keys.disable') && (
                                  <button
                                    onClick={() => handleRevokeKey(keyObj.usedByUserId, keyObj.id)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    title={lang === 'ar' ? 'حظر المستخدم وإلغاء المفتاح' : 'Revoke key and ban user'}
                                  >
                                    {lang === 'ar' ? 'إلغاء المفتاح' : 'Revoke key'}
                                  </button>
                                )}
                                {adminPermissions.includes('inventory.edit') && <button
                                  onClick={() => handleDeleteKey(keyObj.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-bold text-rose-500 transition-all cursor-pointer hover:scale-105"
                                >
                                  {lang === 'ar' ? 'حذف' : 'Delete'}
                                </button>}
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
            {adminSectionTab === 'roles' && <RoleManager lang={lang} onNotify={showToast} />}
            {adminSectionTab === 'announcements' && <AnnouncementAdmin lang={lang} products={products} onNotify={showToast} canCreate={adminPermissions.includes('announcements.create')} canPublish={adminPermissions.includes('announcements.publish')} canDelete={adminPermissions.includes('announcements.delete')} />}
            {adminSectionTab === 'settings' && <SystemSettings lang={lang} />}
            {adminSectionTab === 'logs' && <AdminAuditLogs logs={adminLogs} customers={allCustomersList} lang={lang} />}

            {/* ==================== SUB-TAB 5: OVERVIEW & STATS ==================== */}
            {adminSectionTab === 'overview' && adminStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total users', value: adminStats.totalUsers, detail: lang === 'ar' ? 'كل الحسابات المسجلة' : 'All registered accounts', icon: Users },
                    { label: lang === 'ar' ? 'مستخدمون نشطون' : 'Active users', value: adminStats.activeUsers, detail: lang === 'ar' ? 'سجّلوا الدخول خلال 30 يوماً' : 'Signed in within 30 days', icon: UserCheck },
                    { label: lang === 'ar' ? 'إجمالي المنتجات' : 'Total products', value: adminStats.totalProducts, detail: lang === 'ar' ? 'المنتجات المسجلة' : 'Registered products', icon: Package },
                    { label: lang === 'ar' ? 'المفاتيح النشطة' : 'Active licenses', value: adminStats.activeKeys, detail: lang === 'ar' ? 'تراخيص غير منتهية' : 'Unexpired licenses', icon: Key },
                    { label: lang === 'ar' ? 'المفاتيح المنتهية' : 'Expired licenses', value: adminStats.expiredKeys, detail: lang === 'ar' ? 'تراخيص انتهت مدتها' : 'Licenses past expiry', icon: Clock },
                    { label: lang === 'ar' ? 'التفعيلات اليوم' : 'Activations today', value: adminStats.todayActivations, detail: lang === 'ar' ? 'حسب وقت التفعيل المسجل' : 'From recorded activation times', icon: Activity },
                  ].map((metric) => {
                    const MetricIcon = metric.icon;
                    return <article key={metric.label} className="rounded-xl border p-5" style={{ background: 'var(--luxe-panel)', borderColor: 'var(--luxe-line)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium" style={{ color: 'var(--luxe-muted)' }}>{metric.label}</p>
                        <MetricIcon className="h-4 w-4" style={{ color: 'var(--luxe-accent)' }} />
                      </div>
                      <p className="mt-4 text-2xl font-semibold tabular-nums" style={{ color: 'var(--luxe-ink)' }}>{metric.value.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      <p className="mt-1 text-[11px]" style={{ color: 'var(--luxe-muted)' }}>{metric.detail}</p>
                    </article>;
                  })}
                </div>

                {lowStockProducts.length > 0 && <section className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-5" aria-label={lang === 'ar' ? 'تنبيهات انخفاض المخزون' : 'Low stock alerts'}>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--luxe-ink)' }}>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {lang === 'ar' ? 'مخزون منخفض' : 'Low stock'}
                    <span className="text-xs font-normal" style={{ color: 'var(--luxe-muted)' }}>({lowStockProducts.length})</span>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {lowStockProducts.map((product) => <li key={product.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--luxe-line)', background: 'var(--luxe-panel)' }}>
                      <span className="min-w-0 truncate font-medium" style={{ color: 'var(--luxe-ink)' }}>{product.name}</span>
                      <span className="shrink-0 tabular-nums text-amber-600 dark:text-amber-300">
                        {product.stockKeysCount ?? 0} / {product.lowStockThreshold ?? 5}
                      </span>
                    </li>)}
                  </ul>
                </section>}

                {/* Secondary Row: Recent Activity & Quick Alerts */}                {/* Secondary Row: Recent Activity & Quick Alerts */}
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
                            <div className={`text-sm font-bold ${styles.textTitle} truncate`}>{log.action}</div>
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
                        <Activity className="w-5 h-5 text-cyan-500" />
                        {lang === 'ar' ? 'حالة النظام والإشعارات' : 'System status & notifications'}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.035] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-white'}`}>
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold">{lang === 'ar' ? 'مراقبة الخوادم' : 'Server monitoring'}</div>
                            <div className={`mt-1 text-xs ${styles.textMuted}`}>{lang === 'ar' ? 'لا يتوفر فحص حي لحالة الخوادم حالياً.' : 'Live server health checks are not configured.'}</div>
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
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <section className="rounded-xl border p-5" style={{ background: 'var(--luxe-panel)', borderColor: 'var(--luxe-line)' }}>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--luxe-ink)' }}>{lang === 'ar' ? 'أحدث التفعيلات' : 'Recent activations'}</h3>
                    {adminStats.recentActivations?.length ? <ul className="divide-y" style={{ borderColor: 'var(--luxe-line)' }}>{adminStats.recentActivations.map((activation: { id: string; userName: string; productName: string; activatedAt: string }) => <li key={activation.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-medium" style={{ color: 'var(--luxe-ink)' }}>{activation.userName}</p><p className="mt-1 truncate text-[11px]" style={{ color: 'var(--luxe-muted)' }}>{activation.productName}</p></div><time className="shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--luxe-muted)' }}>{new Date(activation.activatedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></li>)}</ul> : <p className="py-5 text-center text-xs" style={{ color: 'var(--luxe-muted)' }}>{lang === 'ar' ? 'لا توجد تفعيلات مسجلة بعد.' : 'No activations recorded yet.'}</p>}
                  </section>
                  <section className="rounded-xl border p-5" style={{ background: 'var(--luxe-panel)', borderColor: 'var(--luxe-line)' }}>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--luxe-ink)' }}>{lang === 'ar' ? 'أحدث العملاء' : 'Recent customers'}</h3>
                    {adminStats.recentUsers?.length ? <ul className="divide-y" style={{ borderColor: 'var(--luxe-line)' }}>{adminStats.recentUsers.map((customer: { id: string; name: string; createdAt: string }) => <li key={customer.id} className="flex items-center justify-between gap-3 py-3"><p className="truncate text-xs font-medium" style={{ color: 'var(--luxe-ink)' }}>{customer.name || (lang === 'ar' ? 'عميل' : 'Customer')}</p><time className="shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--luxe-muted)' }}>{new Date(customer.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' })}</time></li>)}</ul> : <p className="py-5 text-center text-xs" style={{ color: 'var(--luxe-muted)' }}>{lang === 'ar' ? 'لا يوجد عملاء مسجلون بعد.' : 'No customers registered yet.'}</p>}
                  </section>
                </div>
              </div>
            )}
            </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ====================================================================
          INVENTORY MODAL (Exact Design from User Screenshot)
          Shows: بيانات المنتج | الحقول المخصصة | الأكواد المتاحة
          Each key as a card with delete button
         ==================================================================== */}
      {inventoryModalOpen && inventoryProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${styles.bgPanel} rounded-[28px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border`} style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            {/* Modal Header (Premium Style) */}
            <div className={`flex items-center justify-between px-6 py-5 ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'} border-b shrink-0 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -z-10" />
              <button
                onClick={() => setInventoryModalOpen(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/5 hover:bg-red-500/20 border-white/10 text-slate-400' : 'bg-slate-100 hover:bg-red-500/10 border-slate-200 text-slate-650'} hover:text-red-500 border transition-all cursor-pointer z-10`}
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className={`text-lg font-extrabold ${styles.textTitle} text-right flex-1 pr-3 z-10`}>
                {inventoryProduct.id === 'new' ? (
                  <span>إضافة منتج جديد</span>
                ) : (
                  <span>إدارة <span className="text-indigo-500 dark:text-primary">{inventoryProduct.name}</span></span>
                )}
              </h2>
            </div>

            {/* Tabs Row */}
            <div className={`flex ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-100/50 border-slate-200'} border-b shrink-0 p-4 gap-2`}>
              {inventoryProduct.id !== 'new' && (
                <button
                  onClick={() => setInventoryTab('codes')}
                  className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'codes' ? 'bg-indigo-600 dark:bg-primary text-white shadow-lg shadow-indigo-500/15' : `${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} border`}`}
                >
                  <span>الأكواد المتاحة</span>
                  <Key className="w-4 h-4 ml-1" />
                </button>
              )}
              {canEditInventoryProduct && <button
                onClick={() => setInventoryTab('custom')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'custom' ? 'bg-indigo-600 dark:bg-primary text-white shadow-lg shadow-indigo-500/15' : `${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} border`}`}
              >
                <span>الحقول المخصصة</span>
                <Layers className="w-4 h-4 ml-1" />
              </button>}
              {canEditInventoryProduct && <button
                onClick={() => setInventoryTab('data')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'data' ? 'bg-indigo-600 dark:bg-primary text-white shadow-lg shadow-indigo-500/15' : `${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} border`}`}
              >
                <span>بيانات المنتج</span>
                <FileText className="w-4 h-4 ml-1" />
              </button>}
            </div>

            {/* Modal Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* TAB: بيانات المنتج (Editable) */}
              {inventoryTab === 'data' && canEditInventoryProduct && (
                <div className="space-y-5 animate-slide-up">
                  {productSaveMessage && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl font-bold flex items-center justify-between">
                      <span>{productSaveMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>اسم المنتج</label>
                    <input
                      type="text"
                      value={editProductData.name}
                      onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-bold shadow-inner`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>صورة المنتج (رابط مسار الصورة)</label>
                    <input
                      type="text"
                      value={editProductData.image}
                      onChange={(e) => setEditProductData({ ...editProductData, image: e.target.value })}
                      placeholder="/products/fortnite-unban.png"
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>الوصف الشامل للمنتج</label>
                    <textarea
                      rows={3}
                      value={editProductData.description}
                      onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl p-4 text-xs focus:outline-none transition-all leading-relaxed shadow-inner`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>الإصدار (Version)</label>
                      <input
                        type="text"
                        value={editProductData.version}
                        onChange={(e) => setEditProductData({ ...editProductData, version: e.target.value })}
                        className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>حجم الملف (File Size)</label>
                      <input
                        type="text"
                        value={editProductData.fileSize}
                        onChange={(e) => setEditProductData({ ...editProductData, fileSize: e.target.value })}
                        className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all shadow-inner`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>التصنيف (Category)</label>
                      <input
                        type="text"
                        value={editProductData.category}
                        onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                        className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all shadow-inner`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>عدد التحميلات</label>
                      <input
                        type="number"
                        value={editProductData.downloadsCount}
                        onChange={(e) => setEditProductData({ ...editProductData, downloadsCount: Number(e.target.value) })}
                        className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      />
                    </div>
                    <div>
                      <label htmlFor="product-low-stock-threshold" className={`block text-xs font-bold ${styles.textMuted} mb-2`}>
                        {lang === 'ar' ? 'حد تنبيه انخفاض المخزون' : 'Low stock alert threshold'}
                      </label>
                      <input
                        id="product-low-stock-threshold"
                        type="number"
                        min={0}
                        max={100000}
                        value={editProductData.lowStockThreshold}
                        onChange={(e) => setEditProductData({ ...editProductData, lowStockThreshold: Number(e.target.value) })}
                        className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      />
                      <p className={`mt-1 text-[11px] ${styles.textMuted}`}>{lang === 'ar' ? 'صفر يوقف التنبيه لهذا المنتج.' : 'Set to zero to disable this alert.'}</p>
                    </div>
                  </div>

                  {canEditInventoryProduct && <div className={`pt-4 border-t ${styles.borderNormal}`}>
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{inventoryProduct.id === 'new' ? 'إضافة المنتج الجديد' : 'حفظ تغييرات المنتج'}</span>
                    </button>
                  </div>}
                </div>
              )}

              {/* TAB: الحقول المخصصة (Editable) */}
              {inventoryTab === 'custom' && canEditInventoryProduct && (
                <div className="space-y-5 animate-slide-up">
                  {productSaveMessage && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl font-bold flex items-center justify-between">
                      <span>{productSaveMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>رابط الشرح / فيديو (YouTube / Stream)</label>
                    <input
                      type="text"
                      value={editProductData.videoUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, videoUrl: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>رابط دليل الاستخدام (Discord / Docs)</label>
                    <input
                      type="text"
                      value={editProductData.guideUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, guideUrl: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      placeholder="https://discord.gg/t3n"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>رابط تحميل الملف (File Download URL)</label>
                    <input
                      type="text"
                      value={editProductData.fileUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, fileUrl: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none transition-all shadow-inner`}
                      placeholder="/uploads/spoofer.exe"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textMuted} mb-2`}>لون البطاقة (Theme Accent)</label>
                    <select
                      value={editProductData.cardColor}
                      onChange={(e) => setEditProductData({ ...editProductData, cardColor: e.target.value })}
                      className={`w-full ${styles.bgInput} focus:border-indigo-500/40 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all cursor-pointer font-bold shadow-inner`}
                    >
                      <option value="blue" className={isDark ? 'bg-[#050507] text-white' : 'bg-white text-slate-900'}>أزرق سماوي (Blue Glow)</option>
                      <option value="cyan" className={isDark ? 'bg-[#050507] text-white' : 'bg-white text-slate-900'}>سيان فائق (Cyan Neon)</option>
                      <option value="purple" className={isDark ? 'bg-[#050507] text-white' : 'bg-white text-slate-900'}>بنفسجي تبيان (Purple Spirit)</option>
                      <option value="gold" className={isDark ? 'bg-[#050507] text-white' : 'bg-white text-slate-900'}>ذهبي فاخر (Gold Edition)</option>
                    </select>
                  </div>

                  {((inventoryProduct.id === 'new' && adminPermissions.includes('products.create')) || (inventoryProduct.id !== 'new' && adminPermissions.includes('products.edit'))) && <div className={`pt-4 border-t ${styles.borderNormal} space-y-3`}>
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{inventoryProduct.id === 'new' ? 'إضافة المنتج الجديد' : 'حفظ تغييرات الحقول'}</span>
                    </button>

                    {inventoryProduct.id !== 'new' && adminPermissions.includes('products.delete') && (
                      <button
                        onClick={handleDeleteProductPermanently}
                        className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 dark:text-rose-450 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف المنتج نهائياً من النظام</span>
                      </button>
                    )}
                  </div>}
                </div>
              )}

              {/* TAB: الأكواد المتاحة (Premium T3N Style) */}
              {inventoryTab === 'codes' && (
                <div className="space-y-5 animate-slide-up">
                  
                  {keyActionMessage && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl font-bold flex items-center justify-between shadow-sm">
                      <span>{keyActionMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Premium Info Box */}
                  <div className={`bg-indigo-500/5 dark:bg-primary/5 border border-indigo-500/10 dark:border-primary/20 rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden shadow-sm`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 dark:bg-primary"></div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/25 dark:border-primary/30 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-indigo-500 dark:text-primary" />
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className={`text-sm font-extrabold ${styles.textTitle} mb-1`}>إدارة المخزون الذكية</h4>
                        <p className={`text-xs ${styles.textMuted} leading-relaxed`}>
                          يعرض المخزون المفاتيح القابلة للتفعيل فقط. تُستبعد المفاتيح المستخدمة أو المعطلة أو المكررة تلقائياً من الرصيد المتاح.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">متاح للتفعيل</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-200">{inventoryStock.available}</div>
                      </div>
                      <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 px-3 py-2 text-center">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300">الإجمالي</div>
                        <div className={`text-lg font-black ${styles.textTitle}`}>{inventoryStock.total}</div>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-300">مستخدم</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-200">{inventoryStock.used}</div>
                      </div>
                      <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center">
                        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-300">معطل / مؤرشف</div>
                        <div className="text-lg font-black text-rose-600 dark:text-rose-200">{inventoryStock.disabled + inventoryStock.archived}</div>
                      </div>
                    </div>
                    {inventoryStock.duplicateCodes > 0 && (
                      <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-600 dark:text-rose-300">
                        تم استبعاد {inventoryStock.duplicateCodes} كود مكرر من المخزون المتاح لحماية التفعيل.
                      </div>
                    )}
                    <div className="pt-1">
                      <div className={`mb-2 text-[11px] font-black ${styles.textTitle}`}>
                        {lang === 'ar' ? 'مدة المفاتيح عند التفعيل' : 'Key duration after activation'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {KEY_DURATION_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setInventoryKeyDuration(option)}
                            className={`rounded-lg border px-3 py-2 text-[11px] font-black transition-all cursor-pointer ${inventoryKeyDuration === option
                              ? 'border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : `${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}`}
                          >
                            {durationLabel(option, lang)}
                          </button>
                        ))}
                      </div>
                      <p className={`mt-2 text-[10px] leading-relaxed ${styles.textMuted}`}>
                        {lang === 'ar'
                          ? 'تُحسب نهاية الترخيص من لحظة تفعيل العميل، وليس من إضافة المفتاح للمخزون.'
                          : 'Expiry starts when the customer activates the key, not when it is added to stock.'}
                      </p>
                    </div>
                    {!bulkAddOpen && adminPermissions.includes('inventory.edit') && (
                      <button 
                        onClick={() => setBulkAddOpen(true)}
                        className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 dark:bg-primary/10 dark:hover:bg-primary/20 border border-indigo-500/20 dark:border-primary/30 text-indigo-600 dark:text-primary text-xs font-bold rounded-xl transition-all cursor-pointer mt-2"
                      >
                        فتح لوحة الإضافة السريعة (Batch Add)
                      </button>
                    )}
                  </div>

                  {/* Bulk Add Panel */}
                  <AnimatePresence>
                    {bulkAddOpen && adminPermissions.includes('inventory.edit') && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className={`${styles.bgCard} rounded-xl p-5 space-y-4 shadow-2xl relative overflow-hidden border border-indigo-500/10`}
                      >
                        <div className="absolute top-0 right-0 p-3">
                          <button onClick={() => setBulkAddOpen(false)} className={`text-slate-500 hover:text-red-500 transition-colors cursor-pointer p-1`}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center pr-2">
                          <span className="text-xs text-indigo-500 dark:text-primary font-bold tracking-widest uppercase">{lang === 'ar' ? 'مفاتيح الدفعة' : 'Batch Keys'}</span>
                          {bulkKeysText.trim() && (
                            <span className="text-xs font-bold bg-indigo-500/20 text-indigo-500 dark:text-primary px-3 py-1 rounded-lg">
                              {bulkKeysText.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0).length} مفاتيح
                            </span>
                          )}
                        </div>
                        
                        <div className="relative">
                          <textarea
                            rows={6}
                            value={bulkKeysText}
                            onChange={(e) => setBulkKeysText(e.target.value)}
                            placeholder="الصق المفاتيح هنا...&#10;يمكنك الفصل بينها بمسافة أو فاصلة أو سطر جديد."
                            className={`w-full ${styles.bgInput} rounded-xl p-4 text-sm font-mono placeholder:text-slate-550 focus:outline-none transition-all resize-y min-h-[120px] shadow-inner ${isAddingKeys ? 'border border-indigo-500 shadow-md text-indigo-500' : `border ${styles.borderNormal} focus:border-indigo-500/50 ${styles.textTitle}`}`}
                            style={{ lineHeight: '1.8' }}
                            dir="ltr"
                          />
                        </div>

                        {bulkMessage && (
                          <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-primary text-xs rounded-xl font-bold text-center border border-indigo-500/25 shadow-sm">
                            {bulkMessage}
                          </div>
                        )}

                        <button
                          onClick={handleBulkAddKeys}
                          disabled={isAddingKeys || !bulkKeysText.trim()}
                          className={`w-full py-4 font-bold text-sm rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 ${bulkKeysText.trim() ? 'bg-indigo-600 dark:bg-primary hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 hover:-translate-y-0.5' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border'}`}
                        >
                          {isAddingKeys ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>جاري المعالجة الفورية...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>إضافة الأكواد للمخزون</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Keys List */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h4 className={`text-sm font-bold ${styles.textTitle}`}>المفاتيح الحالية</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-sm">
                          {inventoryStock.available} متاح
                        </div>
                        <div className="text-xs font-bold text-indigo-650 dark:text-primary bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20 px-3 py-1.5 rounded-full shadow-sm">
                          {inventoryStock.total} إجمالي
                        </div>
                      </div>
                    </div>

                    {isLoadingKeys ? (
                      <div className={`flex flex-col items-center justify-center py-12 border ${styles.borderNormal} border-dashed rounded-xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
                        <RefreshCw className="w-6 h-6 animate-spin mb-3 text-indigo-500 dark:text-primary" />
                        <span className="text-xs font-bold text-slate-400">جارٍ جلب المفاتيح بسرعة...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inventoryKeys.map((keyItem) => (
                          <div key={keyItem.id} className={`group ${isDark ? 'bg-black/40 hover:bg-white/5 border-white/10' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border hover:border-indigo-500/30 rounded-xl overflow-hidden flex items-center justify-between p-4 gap-4 transition-all shadow-sm`}>
                            <div className={`flex-1 text-sm ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-black'} font-mono break-all text-left select-all transition-colors`} dir="ltr">
                              {keyItem.key}
                            </div>
                            <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                              {durationLabel(keyItem.duration, lang)}
                            </span>
                            <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${keyItem.isUsed ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : keyItem.isDisabled || keyItem.isArchived ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'}`}>
                              {keyItem.isUsed ? 'مستخدم' : keyItem.isDisabled || keyItem.isArchived ? 'غير متاح' : 'متاح'}
                            </span>
                            {adminPermissions.includes('inventory.edit') && <button
                              onClick={() => handleDeleteKey(keyItem.id)}
                              disabled={Boolean(deletingKeyId)}
                              className="shrink-0 p-2.5 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              title="حذف المفتاح"
                            >
                              {deletingKeyId === keyItem.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>}
                          </div>
                        ))}

                        {inventoryStock.total === 0 && !bulkAddOpen && !singleAddOpen && (
                          <div className={`text-center py-10 border ${styles.borderNormal} border-dashed rounded-xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
                            <Key className="w-8 h-8 text-slate-450 mx-auto mb-3 opacity-50" />
                            <p className={`text-xs ${styles.textMuted} font-bold`}>لا توجد مفاتيح في المخزون حالياً</p>
                          </div>
                        )}

                        {/* Single Add Key Block */}
                        <AnimatePresence>
                          {singleAddOpen && adminPermissions.includes('inventory.edit') && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`border ${styles.borderNormal} rounded-xl p-3 flex flex-col sm:flex-row gap-3 shadow-lg ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}
                            >
                              <input
                                type="text"
                                value={singleKeyText}
                                onChange={(e) => setSingleKeyText(e.target.value)}
                                placeholder="أدخل المفتاح هنا..."
                                className={`flex-1 ${styles.bgInput} rounded-lg px-4 py-3 text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-left transition-all shadow-inner`}
                                dir="ltr"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleAddSingleKey}
                                  disabled={!singleKeyText.trim() || isAddingSingleKey}
                                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/10"
                                >
                                  {isAddingSingleKey ? 'جارٍ الإضافة...' : 'إضافة'}
                                </button>
                                <button
                                  onClick={() => setSingleAddOpen(false)}
                                  className={`px-5 py-3 ${isDark ? 'bg-white/5 hover:bg-red-500/20 border-white/10' : 'bg-slate-100 hover:bg-red-500/10 border-slate-200'} border text-slate-650 hover:text-red-500 font-bold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap`}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Add New Key Button (+) */}
                        {!singleAddOpen && adminPermissions.includes('inventory.edit') && (
                          <button 
                            onClick={() => setSingleAddOpen(true)}
                            className={`w-full py-4 flex items-center justify-center gap-2 border border-dashed rounded-xl transition-all cursor-pointer mt-3 ${isDark ? 'bg-black/20 border-white/10 hover:border-primary/50 hover:bg-primary/5 text-slate-400 hover:text-primary' : 'bg-slate-50 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-500 hover:text-indigo-600'}`}
                          >
                            <span className="text-xl leading-none mb-0.5">+</span>
                            <span className="text-xs font-bold">إضافة مفتاح فردي</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-5 border-t ${styles.borderNormal} ${isDark ? 'bg-black/40' : 'bg-slate-50'} flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3`}>
              <button
                onClick={() => setInventoryProduct(null)}
                className={`w-full sm:w-auto px-6 py-3 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-slate-100 hover:bg-slate-200 border-slate-250'} border ${styles.textTitle} font-bold text-sm rounded-xl transition-all cursor-pointer hover:-translate-y-0.5`}
              >
                إلغاء
              </button>
              {canEditInventoryProduct && <button
                onClick={handleSaveProductChanges}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/15 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                حفظ التغييرات
              </button>}
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setGuideModalProduct(null); setGuideView(null); }} />
          <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="guide-experience-modal relative w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col rounded-[28px] border border-white/10 bg-slate-950/95 shadow-[0_28px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className={`min-h-[112px] px-5 sm:px-7 py-5 sm:py-6 border-b border-white/10 flex items-center justify-center ${lang === 'ar' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-primary/10 via-slate-950/70 to-slate-950/95 relative overflow-hidden`}>
              <div className="absolute -top-16 -left-10 w-56 h-56 bg-primary/20 rounded-full blur-[70px]" />
              <button
                onClick={() => { setGuideModalProduct(null); setGuideView(null); }}
                aria-label={guideText.close}
                className="absolute left-5 sm:left-7 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="z-10 flex items-center gap-3 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-[0_0_22px_rgba(59,130,246,0.24)]"><HelpCircle className="w-5 h-5" /></span>
                <h3 className="text-center text-xl font-black tracking-tight text-white sm:text-2xl">{guideView === 'spoofer' ? guideText.spooferIssueTitle : guideView === 'format' ? guideText.formatSectionTitle : `${guideModalProduct.product?.name || guideText.modalTitle} · ${guideText.modalTitle}`}</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="guide-experience-body p-4 sm:p-6 lg:p-7 overflow-y-auto scrollbar-thin bg-gradient-to-b from-slate-950/15 to-slate-950/55">
              {guideView === 'menu' && (
                <div className="grid auto-rows-fr grid-cols-1 gap-4 rounded-[28px] border border-white/[.10] bg-[#06101d]/92 p-3 sm:grid-cols-2 sm:gap-5 sm:p-4 lg:grid-cols-3 animate-slide-up">
                  {/* Full Tutorial Button */}
                  <button
                    onClick={() => {
                      setGuideView('notice');
                    }}
                    className="guide-menu-card relative h-full min-h-[274px] overflow-hidden flex flex-col items-center justify-center gap-4 p-7 sm:p-8 rounded-[22px] bg-gradient-to-br from-indigo-950/80 via-slate-900 to-[#070b14] border border-indigo-300/[.20] hover:border-indigo-300/55 transition-all duration-200 group cursor-pointer shadow-[0_14px_34px_rgba(0,0,0,.24)] hover:shadow-[0_22px_46px_rgba(37,99,235,.18)] hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200 shadow-[0_0_28px_rgba(59,130,246,0.2)]">
                      <Play className="w-7 h-7" fill="currentColor" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-extrabold text-white mb-2 text-lg">{guideText.tutorialTitle}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">{guideText.tutorialDescription}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setGuideView('format')}
                    className="guide-menu-card guide-prep-card relative h-full min-h-[274px] overflow-hidden flex flex-col items-center justify-center gap-4 p-7 sm:p-8 rounded-[22px] bg-gradient-to-br from-sky-950/85 via-[#0b1f31] to-[#070d18] border border-sky-300/[.22] hover:border-sky-300/55 transition-all duration-200 group cursor-pointer shadow-[0_14px_34px_rgba(0,0,0,.24)] hover:shadow-[0_22px_46px_rgba(14,116,144,.18)] hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-sky-400/[.12] border border-sky-300/[.25] flex items-center justify-center text-sky-200 group-hover:scale-110 transition-transform duration-200 shadow-[0_0_28px_rgba(56,189,248,.15)]">
                      <Play className="w-7 h-7" fill="currentColor" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-extrabold text-white mb-2 text-lg">{guideText.formatSectionTitle}</h4>
                      <p className="text-xs text-sky-100/65 leading-relaxed max-w-[220px]">{guideText.formatSectionDescription}</p>
                    </div>
                    <span className="inline-flex rounded-lg border border-sky-200/20 bg-sky-400/[.08] px-3 py-1.5 text-[10px] font-black text-sky-100">{guideText.formatSectionAction}</span>
                  </button>

                  {/* Visual issue-fix center */}
                  <button
                    onClick={() => setGuideView('issues')}
                    className="guide-menu-card relative h-full min-h-[274px] overflow-hidden flex flex-col items-center justify-center gap-4 p-7 sm:p-8 rounded-[22px] bg-gradient-to-br from-emerald-950/[.44] via-slate-900 to-[#070b14] border border-emerald-300/[.16] hover:border-emerald-300/45 transition-all duration-200 group cursor-pointer shadow-[0_14px_34px_rgba(0,0,0,.24)] hover:shadow-[0_22px_46px_rgba(16,185,129,.14)] hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform duration-200 shadow-[0_0_28px_rgba(16,185,129,0.13)]">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-extrabold text-white mb-2 text-lg">{guideText.issueFixesTitle}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">{guideText.issueFixesDescription}</p>
                    </div>
                  </button>
                </div>
              )}

              {guideView === 'format' && (
                <div className="animate-slide-up mx-auto w-full max-w-3xl space-y-5">
                  <section className="relative overflow-hidden rounded-[26px] border border-sky-300/[.22] bg-[linear-gradient(135deg,rgba(8,47,73,.90),rgba(15,23,42,.96))] p-5 shadow-[0_22px_52px_rgba(8,47,73,.22)] sm:p-6">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky-300/15 blur-[70px]" />
                    <div className="relative flex flex-col gap-5"><div className="flex flex-col gap-3 border-b border-sky-200/[.12] pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-200/20 bg-sky-400/[.12] text-sky-100"><Play className="h-5 w-5" fill="currentColor" /></span><div><p className="text-[10px] font-black tracking-[.16em] text-sky-200/80">{lang === 'ar' ? 'قسم تحضيري مستقل' : 'SEPARATE PREPARATION'}</p><h4 className="mt-1 text-xl font-black text-white">{guideText.formatSectionTitle}</h4><p className="mt-2 max-w-xl text-[12px] leading-6 text-slate-300">{guideText.preparationDescription}</p></div></div><button onClick={() => setGuideView('menu')} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-white/[.10] bg-white/[.04] px-3 text-[11px] font-black text-slate-300 transition hover:border-sky-300/35 hover:bg-sky-400/[.10] hover:text-white sm:self-auto">{lang === 'ar' ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}{guideText.back}</button></div>
                    <div className="grid gap-3 sm:grid-cols-2">{[{ label: guideText.windows11Label, url: 'https://youtu.be/XZ-9RbqlA2k', number: '01' }, { label: guideText.windows10Label, url: 'https://youtu.be/WaFxvUmsNWs', number: '02' }].map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group flex min-h-28 flex-col justify-between rounded-2xl border border-white/[.10] bg-slate-950/45 p-4 transition hover:-translate-y-0.5 hover:border-sky-300/45 hover:bg-sky-400/[.08]"><div className="flex items-center justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-sky-200/15 bg-sky-400/[.10] text-[10px] font-black text-sky-100">{item.number}</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.06] text-sky-200 transition group-hover:scale-105"><Play className="h-3.5 w-3.5" fill="currentColor" /></span></div><div><h5 className="text-sm font-black text-white">{item.label}</h5><p className="mt-1 text-[10px] text-slate-400">{guideText.watchPreparation}</p></div></a>)}</div>
                    <div className="rounded-2xl border border-amber-300/[.16] bg-amber-300/[.06] p-3.5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><p className="text-[11px] leading-6 text-amber-100/80"><strong className="font-black text-amber-100">{guideText.motherboardTitle}:</strong> {guideText.motherboardDescription}</p></div></div>
                    </div>
                  </section>
                </div>
              )}

              {guideView === 'issues' && (
                <div className="animate-slide-up mx-auto w-full max-w-4xl space-y-5">
                  <div className="flex flex-col gap-2 border-b border-white/[0.10] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="text-start">
                      <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-black tracking-[0.18em] text-emerald-300/80">{guideText.issuesLabel}</p><span className="rounded-md border border-emerald-300/20 bg-emerald-400/[0.08] px-2 py-1 text-[9px] font-black text-emerald-100">{guideText.libraryAvailable}</span></div>
                      <h4 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">{guideText.issuesTitle}</h4>
                      <p className="mt-2 max-w-2xl text-[12px] leading-6 text-slate-300 sm:text-[13px]">{guideText.issuesDescription}</p>
                    </div>
                    <button onClick={() => setGuideView('menu')} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-[11px] font-black text-slate-300 transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-white sm:self-auto">
                      {lang === 'ar' ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}{guideText.back}
                    </button>
                  </div>
                  <section className="relative overflow-hidden rounded-[22px] border border-rose-300/[.20] bg-[linear-gradient(135deg,rgba(136,19,55,.20),rgba(15,23,42,.92)_48%,rgba(8,47,73,.48))] p-4 shadow-[0_16px_40px_rgba(0,0,0,.16)] sm:p-5">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-rose-300/[.14] blur-3xl" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-rose-200/[.28] bg-rose-400/[.12] text-rose-100"><AlertCircle className="h-5 w-5" /></span>
                        <div className="min-w-0 text-start"><p className="text-[10px] font-black tracking-[.15em] text-rose-200/85">VISUAL C++ RUNTIME</p><h5 className="mt-1 text-sm font-black text-white sm:text-[15px]">{guideText.commonErrorsTitle}</h5><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-300">{guideText.commonErrorsDescription}</p><p className="mt-2 text-[10px] font-bold text-rose-100/80">{guideText.commonErrorsNote}</p></div>
                      </div>
                      <a href="https://aka.ms/vc14/vc_redist.x64.exe" target="_blank" rel="noreferrer" className="guide-runtime-download inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200/[.44] bg-rose-300 px-4 py-2.5 text-[11px] font-black text-rose-950 shadow-[0_10px_24px_rgba(251,113,133,.22)] transition hover:-translate-y-0.5 hover:bg-rose-200 active:scale-[.98]"><Download className="h-4 w-4" />{guideText.commonErrorsAction}</a>
                    </div>
                    <figure className="guide-runtime-preview relative mt-4 overflow-hidden rounded-2xl border border-rose-200/[.18] bg-slate-950/75 p-3 sm:p-4">
                      <div className="mb-3 flex flex-col gap-1 text-start sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black tracking-[.14em] text-rose-200">{guideText.runtimePreviewLabel}</p><p className="mt-1 text-[11px] leading-5 text-slate-300">{guideText.runtimePreviewDescription}</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-rose-200/[.18] bg-rose-400/[.10] px-2.5 py-1 text-[9px] font-black text-rose-100"><AlertCircle className="h-3.5 w-3.5" />MSVCP140.dll</span></div>
                      <Image src="/assets/guides/visual-cpp-runtime-error.png" alt={lang === 'ar' ? 'مثال لرسالة خطأ MSVCP140.dll وVisual C++ Runtime' : 'Example MSVCP140.dll and Visual C++ Runtime error message'} width={960} height={540} loading="lazy" className="max-h-[360px] w-full rounded-xl border border-white/[.12] bg-black object-contain shadow-[0_12px_26px_rgba(0,0,0,.28)] sm:max-h-[460px]" />
                      <figcaption className="mt-3 grid gap-2 text-[10px] leading-5 text-slate-300 sm:grid-cols-3"><span><b className="text-rose-100">01.</b> {guideText.runtimePreviewStepOne}</span><span><b className="text-rose-100">02.</b> {guideText.runtimePreviewStepTwo}</span><span><b className="text-rose-100">03.</b> {guideText.runtimePreviewStepThree}</span></figcaption>
                    </figure>
                  </section>
                  <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
                    {[
                      { view: 'network' as const, image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/witHZYIQKdMeiaUM.png', title: guideText.networkIssueTitle, description: guideText.networkIssueDescription, accent: 'sky' },
                      { view: 'timer' as const, image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/iUIBJOOTPsAnQTJW.png', title: guideText.timeIssueTitle, description: guideText.timeIssueDescription, accent: 'violet' },
                      { view: 'spoofer' as const, image: '/spoofer-list-fix.png', title: guideText.spooferIssueTitle, description: guideText.spooferIssueDescription, accent: 'emerald' },
                    ].map((issue, index) => (
                      <button key={issue.view} onClick={() => setGuideView(issue.view)} className={`group flex h-full flex-col overflow-hidden rounded-[22px] border text-start transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.26)] ${issue.accent === 'sky' ? 'border-sky-300/[0.18] bg-sky-400/[0.045] hover:border-sky-300/40' : issue.accent === 'emerald' ? 'border-emerald-300/[0.18] bg-emerald-400/[0.045] hover:border-emerald-300/40' : 'border-violet-300/[0.18] bg-violet-400/[0.045] hover:border-violet-300/40'}`}>
                        <div className="relative aspect-[16/8.8] overflow-hidden bg-black">
                          <Image src={issue.image} alt={issue.title} width={960} height={528} unoptimized loading="lazy" className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.035] group-hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                          <span className={`absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl border text-[11px] font-black ${issue.accent === 'sky' ? 'border-sky-200/30 bg-sky-400/15 text-sky-100' : issue.accent === 'emerald' ? 'border-emerald-200/30 bg-emerald-400/15 text-emerald-100' : 'border-violet-200/30 bg-violet-400/15 text-violet-100'}`}>0{index + 1}</span>
                          <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"><Play className="h-4 w-4" fill="currentColor" /></span><span className="absolute bottom-4 left-4 rounded-lg border border-white/[0.18] bg-slate-950/65 px-2 py-1 text-[9px] font-black tracking-[0.12em] text-white/90 backdrop-blur-sm">{guideText.videoGuide}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <h5 className="text-[15px] font-black text-white sm:text-base">{issue.title}</h5>
                          <p className="mt-2 min-h-10 text-[11px] leading-5 text-slate-300 sm:text-[12px]">{issue.description}</p>
                          <div className={`mt-auto pt-4 inline-flex items-center gap-2 text-[11px] font-black ${issue.accent === 'sky' ? 'text-sky-200' : issue.accent === 'emerald' ? 'text-emerald-200' : 'text-violet-200'}`}><Play className="h-3.5 w-3.5" fill="currentColor" />{guideText.watchSolution}</div>
                        </div>
                      </button>
                    ))}
                    <a href="https://aka.ms/vc14/vc_redist.x64.exe" target="_blank" rel="noreferrer" className="group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-[22px] border border-rose-300/[0.22] bg-[linear-gradient(135deg,rgba(136,19,55,.18),rgba(15,23,42,.88)_54%,rgba(8,47,73,.50))] p-4 text-start shadow-[0_16px_36px_rgba(0,0,0,.18)] transition-all duration-200 hover:-translate-y-1 hover:border-rose-300/45 hover:shadow-[0_20px_44px_rgba(136,19,55,.22)] sm:p-5">
                      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-rose-300/[.13] blur-3xl" />
                      <div className="relative flex items-start justify-between gap-4"><span className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200/30 bg-rose-400/[.15] text-[11px] font-black text-rose-100">04</span><span className="grid h-11 w-11 place-items-center rounded-xl border border-rose-200/[.26] bg-slate-950/30 text-rose-100 transition-transform duration-200 group-hover:scale-110"><AlertCircle className="h-5 w-5" /></span></div>
                      <div className="relative mt-auto pt-8"><span className="inline-flex rounded-lg border border-rose-200/[.22] bg-rose-400/[.10] px-2 py-1 text-[9px] font-black tracking-[.12em] text-rose-100">MICROSOFT VISUAL C++</span><h5 className="mt-3 text-[15px] font-black text-white sm:text-base">{guideText.runtimeIssueTitle}</h5><p className="mt-2 min-h-10 text-[11px] leading-5 text-slate-300 sm:text-[12px]">{guideText.runtimeIssueDescription}</p><p className="mt-3 border-t border-white/[.10] pt-3 text-[10px] leading-5 text-rose-100/80">{guideText.runtimeIssueHint}</p><span className="mt-4 inline-flex items-center gap-2 text-[11px] font-black text-rose-100"><Download className="h-3.5 w-3.5" />{guideText.runtimeIssueAction}</span></div>
                    </a>
                  </div>
                </div>
              )}

              {(guideView === 'network' || guideView === 'timer' || guideView === 'spoofer') && (() => {
                const isNetwork = guideView === 'network';
                const solution = guideView === 'network' ? {
                  title: guideText.networkIssueTitle,
                  description: guideText.networkIssueDescription,
                  image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/witHZYIQKdMeiaUM.png',
                  video: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/YDCQGNGzJcLXDrXO.mp4',
                  accent: 'sky',
                } : guideView === 'timer' ? {
                  title: guideText.timeIssueTitle,
                  description: guideText.timeIssueDescription,
                  image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/iUIBJOOTPsAnQTJW.png',
                  video: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152548301/dMYRLGIaslnDGgDt.mp4',
                  accent: 'violet',
                } : {
                  title: guideText.spooferIssueTitle,
                  description: guideText.spooferIssueDescription,
                  image: '/spoofer-list-fix.png',
                  video: '/spoofer-list-fix.mp4',
                  accent: 'emerald',
                };
                return <div className="animate-slide-up mx-auto w-full max-w-4xl space-y-4">
                  <div className="flex flex-col gap-3 border-b border-white/[0.10] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-start"><p className={`text-[10px] font-black tracking-[0.18em] ${solution.accent === 'sky' ? 'text-sky-300/85' : solution.accent === 'emerald' ? 'text-emerald-300/85' : 'text-violet-300/85'}`}>{guideText.solutionVideoLabel}</p><h4 className="mt-1 truncate text-lg font-black text-white sm:text-xl">{solution.title}</h4></div>
                    <button onClick={() => setGuideView('issues')} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-[11px] font-black text-slate-300 transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-white sm:self-auto">{lang === 'ar' ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}{guideText.back}</button>
                  </div>
                  <section className={`overflow-hidden rounded-[24px] border bg-black/45 shadow-[0_20px_52px_rgba(0,0,0,0.34)] ${solution.accent === 'sky' ? 'border-sky-300/[0.18]' : solution.accent === 'emerald' ? 'border-emerald-300/[0.18]' : 'border-violet-300/[0.18]'}`}>
                    <div className="relative aspect-video w-full bg-black"><video src={solution.video} className="absolute inset-0 h-full w-full bg-black object-contain" controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline preload="metadata" autoPlay /></div>
                    <div className="flex flex-col gap-3 border-t border-white/[0.09] p-4 sm:px-5"><div className="min-w-0 text-start"><p className="text-[12px] leading-6 text-slate-400">{solution.description}</p>{isNetwork && <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-emerald-300/[0.30] bg-[linear-gradient(135deg,rgba(16,185,129,.17),rgba(6,78,59,.28)_52%,rgba(2,44,34,.44))] p-3.5 shadow-[0_12px_30px_rgba(5,150,105,.14)] sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="min-w-0"><p className="text-[10px] font-black tracking-[0.14em] text-emerald-200/85">{guideText.downloadWarpLabel}</p><h5 className="mt-1 text-sm font-black leading-5 text-white sm:text-[15px]">{guideText.downloadWarp}</h5><p className="mt-1 text-[11px] leading-5 text-emerald-100/75">{guideText.downloadWarpHint}</p></div><a href="https://downloads.cloudflareclient.com/v1/download/windows/ga" target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200/45 bg-emerald-400 px-4 py-2.5 text-xs font-black text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_14px_30px_rgba(16,185,129,.38)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950"><ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} /><span>{guideText.downloadWarpAction}</span></a></div>}</div><div className="flex shrink-0 flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-2 self-start rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${solution.accent === 'sky' ? 'border-sky-300/20 bg-sky-400/10 text-sky-100' : solution.accent === 'emerald' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : 'border-violet-300/20 bg-violet-400/10 text-violet-100'}`}><Play className="h-3 w-3" fill="currentColor" />{guideText.watchSolution}</span></div></div>
                  </section>
                  <section className="overflow-hidden rounded-[20px] border border-white/[0.10] bg-white/[0.025] p-3 sm:p-4"><div className="mb-3 flex items-center gap-2 text-start text-[10px] font-black tracking-[0.14em] text-slate-400"><AlertTriangle className="h-3.5 w-3.5 text-amber-300" />{guideText.screenshotLabel}</div><Image src={solution.image} alt={solution.title} width={960} height={540} unoptimized loading="lazy" className="max-h-[360px] w-full rounded-xl border border-white/[0.08] bg-black object-contain" /></section>
                </div>;
              })()}

              {guideView === 'notice' && (
                <div className="animate-slide-up mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
                  <section className="relative overflow-hidden rounded-[24px] border border-amber-300/[0.22] bg-[linear-gradient(135deg,rgba(251,191,36,.12),rgba(15,23,42,.92)_46%,rgba(2,6,23,.96))] p-5 shadow-[0_20px_48px_rgba(0,0,0,.24),0_0_34px_rgba(245,158,11,.08)] sm:p-6">
                    <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-amber-300/15 blur-[76px]" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-amber-200/30 to-transparent" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-200/[0.30] bg-amber-300/[0.12] text-amber-200 shadow-[0_0_0_6px_rgba(251,191,36,.035),0_0_26px_rgba(251,191,36,.15)]">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1 text-start">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black tracking-[0.14em] text-amber-200/85">
                          <span>{guideText.noticeLabel}</span>
                          <span className="h-1 w-1 rounded-full bg-amber-200/60" />
                          <span className="text-amber-100/55">{guideText.noticeHint}</span>
                        </div>
                        <h4 className="mt-2 text-xl font-black tracking-tight text-white sm:text-[25px]">{guideText.noticeTitle}</h4>
                        <p className="mt-3 max-w-2xl text-[13px] font-medium leading-7 text-slate-200 sm:text-sm">{guideText.introBefore}<strong className="font-extrabold text-white">{guideText.introProduct}</strong>{guideText.introMiddle}<strong className="font-extrabold text-white">{guideText.introEmphasis}</strong>{guideText.introAfter}</p>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                    <section className="group rounded-[20px] border border-white/[0.10] bg-white/[0.035] p-5 transition-colors hover:border-white/[0.16]">
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.10] bg-white/[0.045] text-[11px] font-black text-slate-300">01</span>
                        <div className="min-w-0">
                          <h5 className="flex items-center gap-2 text-sm font-black text-white"><Shield className="h-4 w-4 text-primary" />{guideText.importantTitle}</h5>
                          <p className="mt-3 text-[13px] leading-6 text-slate-300">{guideText.importantPrimaryBefore}<strong className="font-extrabold text-white">{guideText.storeName}</strong>{guideText.importantPrimaryAfter}</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="rounded-[20px] border border-amber-300/[0.16] bg-amber-300/[0.055] p-4 sm:px-5">
                    <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/[.09] text-amber-200"><AlertCircle className="h-4 w-4" /></span><div><h5 className="text-xs font-black text-amber-100">{guideText.motherboardTitle}</h5><p className="mt-1.5 text-[11px] leading-5 text-amber-100/70">{guideText.motherboardDescription}</p></div></div>
                  </section>

                  <section className="flex flex-col gap-4 rounded-[20px] border border-white/[0.10] bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${tutorialCountdown > 0 ? 'border-amber-300/25 bg-amber-300/[0.10] text-amber-200' : 'border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-200'}`}>
                        {tutorialCountdown > 0 ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 text-start">
                        <p className="text-xs font-black text-slate-200">{tutorialCountdown > 0 ? guideText.waitingTitle : guideText.readyTitle}</p>
                        <p aria-live="polite" className="mt-1 text-[11px] leading-5 text-slate-400">{tutorialCountdown > 0 ? guideText.waitingMessage(tutorialCountdown) : guideText.readyMessage}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={tutorialCountdown > 0}
                      onClick={() => setGuideView('full')}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,.24)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-primary-hover enabled:hover:shadow-[0_14px_28px_rgba(37,99,235,.32)] enabled:active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500 sm:min-w-[196px]"
                    >
                      {tutorialCountdown > 0 ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {tutorialCountdown > 0 ? guideText.waitingButton(tutorialCountdown) : guideText.continueButton}
                    </button>
                  </section>
                </div>
              )}

              {guideView === 'full' && (
                <div className="space-y-4 animate-slide-up">
                  <div className={`flex items-center px-1 border-b border-white/10 pb-4 ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                    <button onClick={() => setGuideView('menu')} className="text-xs text-primary hover:text-white flex items-center gap-1.5 cursor-pointer font-bold bg-primary/10 hover:bg-primary px-3.5 py-2 rounded-xl transition-all duration-200 border border-primary/20 hover:scale-105">
                      {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      {guideText.back}
                    </button>
                  </div>
                  <div className="aspect-video w-full rounded-2xl sm:rounded-3xl border border-white/10 ring-1 ring-black/40 overflow-hidden bg-[#030712] flex flex-col items-center justify-center p-0 text-center relative shadow-[0_22px_55px_rgba(0,0,0,0.5)]">
                    {guideModalProduct.product?.videoUrl ? (
                      guideModalProduct.product.videoUrl.includes('youtube.com') || guideModalProduct.product.videoUrl.includes('youtu.be') ? (
                        <iframe 
                          src={guideModalProduct.product.videoUrl
                            .replace('watch?v=', 'embed/')
                            .replace('youtu.be/', 'youtube.com/embed/')
                            .replace(/[?&]t=([0-9]+)s?/, (match, p1) => {
                              const prefix = match.startsWith('&') ? '&' : '?';
                              return `${prefix}start=${p1}`;
                            })
                          } 
                          className="absolute inset-0 w-full h-full" 
                          allowFullScreen
                        />
                      ) : guideModalProduct.product.videoUrl.includes('drive.google.com') ? (
                        <video
                          src={DIRECT_TUTORIAL_VIDEO_URL}
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                          controls
                          controlsList="nodownload noremoteplayback"
                          disablePictureInPicture
                          playsInline
                          preload="auto"
                          autoPlay
                        />
                      ) : (                        <video 
                          src={guideModalProduct.product.videoUrl} 
                          className="absolute inset-0 w-full h-full object-contain bg-black" 
                          controls 
                          autoPlay
                        />
                      )
                    ) : (
                      <div className="p-8">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                          <AlertCircle className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-white font-extrabold mb-2 text-lg">{guideText.unavailableTitle}</h3>
                        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                          {guideText.unavailableMessage}
                          <br /><br />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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

            <div className="mt-4 mb-5 pe-12">
              <h2 className="truncate text-lg font-bold text-white">{selectedAdminCustomer.name}</h2>
              <p className="mt-1 text-xs text-neutral-400">{selectedAdminCustomer.discordId || selectedAdminCustomer.id}</p>
            </div>
            <nav aria-label={lang === 'ar' ? 'تفاصيل العميل' : 'Customer details'} className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
              {([
                ['overview', lang === 'ar' ? 'نظرة عامة' : 'Overview'],
                ['products', lang === 'ar' ? 'المنتجات' : 'Products'],
                ['keys', lang === 'ar' ? 'المفاتيح' : 'Keys'],
                ['activity', lang === 'ar' ? 'النشاط' : 'Activity'],
                ['permissions', lang === 'ar' ? 'الصلاحيات' : 'Permissions'],
              ] as const).map(([tab, label]) => <button key={tab} type="button" onClick={() => setCustomerDetailTab(tab)} aria-current={customerDetailTab === tab ? 'page' : undefined} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition ${customerDetailTab === tab ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-neutral-400 hover:text-white'}`}>{label}</button>)}
            </nav>

            {/* Grid Layout: Left Column (7/12) and Right Column (5/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
              
              {/* LEFT COLUMN: PRODUCTS & KEYS (lg:col-span-7) */}
              {(customerDetailTab === 'products' || customerDetailTab === 'keys') && <div className="lg:col-span-12 space-y-6">
                
                {/* SECTION 1: ACTIVE PRODUCTS / SUBSCRIPTIONS */}
                {customerDetailTab === 'products' && <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Package className="w-4.5 h-4.5 text-cyan-500" />
                    <span>{lang === 'ar' ? 'الاشتراكات والمنتجات النشطة' : 'Active Products & Subscriptions'}</span>
                  </h4>
                  <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
                    {selectedCustomerProducts.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomerProducts.map((userProd) => {
                          const originalProd = products.find(p => p.id === userProd.productId);
                          const activatedKey = allKeysList.find((key) => key.usedByUserId === selectedAdminCustomer.id && key.productId === userProd.productId);
                          const expiresAt = userProd.expiresAt ? new Date(userProd.expiresAt) : null;
                          const isActiveLicense = userProd.status === 'Active' && (!expiresAt || expiresAt.getTime() > licenseClock);
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
                              {adminPermissions.includes('users.edit') && <button
                                onClick={() => handleRevokeUserProduct(selectedAdminCustomer.id, userProd.productId)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                              >
                                {lang === 'ar' ? 'سحب وتعطيل' : 'Revoke Product'}
                              </button>}
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
                </div>}

                {/* SECTION 2: GRANT NEW PRODUCT */}
                {customerDetailTab === 'products' && adminPermissions.includes('users.edit') && <div className="space-y-3">
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
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'منح المنتج الآن' : 'Grant Product'}</span>
                    </button>
                  </div>
                </div>}

                {/* SECTION 3: ACTIVATED LICENSE KEYS */}
                {customerDetailTab === 'keys' && <div className="space-y-3">
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
                              <span className="text-[10px] text-neutral-500 font-mono">{keyObj.usedAt ? new Date(keyObj.usedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}</span>
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
                </div>}

              </div>}

              {/* RIGHT COLUMN: PROFILE & MODERATION (lg:col-span-5) */}
              {(customerDetailTab === 'overview' || customerDetailTab === 'permissions') && <div className="lg:col-span-12 space-y-6">

                {customerDetailTab === 'permissions' && <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e11] p-5 text-sm text-slate-200">
                  <h3 className="font-bold text-white">{lang === 'ar' ? 'دور الحساب' : 'Account role'}</h3>
                  <p className="mt-2">{selectedAdminCustomer.role || 'Customer'}</p>
                  <p className="mt-2 text-xs text-slate-400">{lang === 'ar' ? 'صلاحيات هذا الدور تضبط من قسم الأدوار والصلاحيات.' : 'This role’s permissions are managed in Roles and Permissions.'}</p>
                </div>}
                
                {/* Profile Card */}
                {customerDetailTab === 'overview' && <div className="bg-[#0e0e11] border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      selectedAdminCustomer.role === 'Boss' 
                        ? 'bg-cyan-300/10 text-cyan-200 border border-cyan-300/20'
                        : 'bg-white/[0.04] text-slate-300 border border-white/[0.08]'
                    }`}>
                      {selectedAdminCustomer.role || 'Customer'}
                    </span>
                  </div>

                  <Image
                    src={selectedAdminCustomer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    width={72}
                    height={72}
                    unoptimized
                    alt={selectedAdminCustomer.name}
                    className="w-18 h-18 rounded-2xl border border-cyan-300/20 object-cover mb-3"
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
                      <span className="text-neutral-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-cyan-300" /> Discord ID</span>
                      <span className="font-mono text-white font-bold select-all bg-black/30 px-2 py-0.5 rounded border border-white/5">{selectedAdminCustomer.discordId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-cyan-300" /> IP Address</span>
                      <span className="font-mono text-white font-bold">{selectedAdminCustomer.lastIp || '—'}</span>
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
                </div>}

                {customerDetailTab === 'permissions' && adminPermissions.includes('roles.manage') && String(currentUser?.role || '') === 'Owner' && !['Boss', 'Owner', 'Co-Boss'].includes(String(selectedAdminCustomer.role)) && <section className="space-y-3 rounded-2xl border border-white/[0.06] bg-[#0e0e11] p-5" aria-label={lang === 'ar' ? 'تغيير دور العميل' : 'Change customer role'}>
                  <label htmlFor="customer-role" className="block text-xs font-bold text-neutral-300">{lang === 'ar' ? 'دور الحساب' : 'Account role'}</label>
                  <div className="flex gap-2">
                    <select id="customer-role" value={selectedRoleDraft} onChange={(event) => setSelectedRoleDraft(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/[0.10] bg-black/40 px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400">
                      {['Admin', 'Moderator', 'Staff', 'Customer'].map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <button type="button" onClick={() => void handleChangeUserRole(selectedAdminCustomer.id)} disabled={isProcessingAdminAction || selectedRoleDraft === selectedAdminCustomer.role} className="min-h-11 rounded-xl bg-sky-500 px-4 text-xs font-black text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45">{lang === 'ar' ? 'حفظ' : 'Save'}</button>
                  </div>
                </section>}

                {/* SECTION 4: WARNING MANAGEMENT */}
                {customerDetailTab === 'overview' && adminPermissions.includes('users.edit') && <div className="space-y-3">
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
                </div>}

                {/* SECTION 5: BAN/RESTRICTION MANAGEMENT */}
                {customerDetailTab === 'overview' && adminPermissions.includes('users.disable') && <div className="space-y-3">
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
                              selectedAdminCustomer.isArchived
                                ? (lang === 'ar' ? 'إعادة تفعيل الحساب' : 'Reactivate Account')
                                : (lang === 'ar' ? 'إلغاء الحظر' : 'Unban Account'),
                              selectedAdminCustomer.isArchived
                                ? (lang === 'ar' ? `سيعود حساب ${selectedAdminCustomer.name} للعمل مع الاحتفاظ بتراخيصه وسجله. هل تريد المتابعة؟` : `Reactivate ${selectedAdminCustomer.name}'s account while keeping its licenses and history?`)
                                : (lang === 'ar' ? `هل أنت متأكد من إلغاء الحظر عن حساب العميل ${selectedAdminCustomer.name}؟` : `Are you sure you want to unban customer ${selectedAdminCustomer.name}?`),
                              () => handleUnbanUser(selectedAdminCustomer.id)
                            );
                          }}
                          disabled={isProcessingAdminAction}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>{selectedAdminCustomer.isArchived ? (lang === 'ar' ? 'إعادة تفعيل حساب العميل' : 'Reactivate Account') : (lang === 'ar' ? 'إلغاء حظر حساب العميل' : 'Unban Account')}</span>
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
                </div>}

              </div>}

              {customerDetailTab === 'activity' && <div className="lg:col-span-12 rounded-2xl border border-white/[0.06] bg-[#0e0e11] p-5">
                <h3 className="mb-4 text-sm font-bold text-white">{lang === 'ar' ? 'النشاط الأخير' : 'Recent activity'}</h3>
                {adminLogs.filter((log) => log.userId === selectedAdminCustomer.id || log.discordId === selectedAdminCustomer.discordId).length ? <div className="space-y-2">
                  {adminLogs.filter((log) => log.userId === selectedAdminCustomer.id || log.discordId === selectedAdminCustomer.discordId).slice(0, 25).map((log) => <div key={log.id} className="rounded-xl border border-white/[0.06] p-3 text-xs text-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-white">{log.action}</strong><time className="text-slate-500">{new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</time></div>
                    <p className="mt-1 break-words">{log.details}</p>
                  </div>)}
                </div> : <p className="text-xs text-slate-400">{lang === 'ar' ? 'لا يوجد نشاط مسجل لهذا العميل.' : 'No recorded activity for this customer.'}</p>}
              </div>}

            </div>
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
  const entity = /حساب|Account/i.test(title) ? (isRtl ? 'الحساب' : 'account') : /مفتاح|Key/i.test(title) ? (isRtl ? 'المفتاح' : 'key') : /منتج|Product/i.test(title) ? (isRtl ? 'المنتج' : 'product') : (isRtl ? 'العملية' : 'operation');
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
