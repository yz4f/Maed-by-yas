'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Shield,
  Key,
  Download,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
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
  Eye,
  EyeOff,
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
  Unlock,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, UserProduct, SystemLog, Key as KeyType, User as UserType } from '@/types';
import { DashboardLayout } from './DashboardLayout';

interface T3NUnifiedPortalProps {
  initialProducts: Product[];
}

export function T3NUnifiedPortal({ initialProducts }: T3NUnifiedPortalProps) {
  const { data: session, status } = useSession();

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
  const [activeTab, setActiveTab] = useState<'overview' | 'my-products' | 'redeem' | 'admin' | 'profile'>('overview');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const askConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmModal(null);
      }
    });
  };
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const toggleKeyReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Demo Local Authentication for instant local testing
  const [demoUser, setDemoUser] = useState<UserType | null>(null);

  // Dynamic Products State (Firestore-synced)
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const loadDbProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.products) {
          setProducts(data.products);
        }
      }
    } catch (e) {
      console.error('Failed to load db products:', e);
    }
  };

  // User Products State
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Key Redemption State
  const [keyInput, setKeyInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copy Key Feedback State
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Guest Key Activation Modal State (Screenshot 2 "Buy / Activate license first")
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Guide Modal States
  const [guideModalProduct, setGuideModalProduct] = useState<UserProduct | null>(null);
  const [guideView, setGuideView] = useState<'menu' | 'full' | 'network' | 'timer' | null>(null);

  // Admin Panel States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [bulkProductId, setBulkProductId] = useState<string>(initialProducts[0]?.id || '');
  const [bulkKeysText, setBulkKeysText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [adminLogs, setAdminLogs] = useState<SystemLog[]>([]);

  // Inventory Modal States
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryTab, setInventoryTab] = useState<'data' | 'custom' | 'codes'>('codes');
  const [inventoryKeys, setInventoryKeys] = useState<KeyType[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [singleAddOpen, setSingleAddOpen] = useState(false);
  const [singleKeyText, setSingleKeyText] = useState('');
  const [isAddingKeys, setIsAddingKeys] = useState(false);

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
  // Premium Stackable Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev; // Prevent duplicate texts
      const newToast = { id: Math.random().toString(36).substring(2, 9), message, type };
      return [...prev, newToast].slice(-5); // Keep max 5 toasts visible
    });
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 3500); // Auto-dismiss after 3.5s
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Translations Object
  const t = {
    ar: {
      siteTitle: 'تعن',
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
      siteTitle: 'TA3N',
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
  const [adminSectionTab, setAdminSectionTab] = useState<'overview' | 'products' | 'customers' | 'keys' | 'logs'>('products');
  const [allCustomersList, setAllCustomersList] = useState<any[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState<any | null>(null);
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
        role: ((session.user as any).role || 'Customer') as 'Boss' | 'Co-Boss' | 'Customer',
        discordRoles: [],
        createdAt: new Date().toISOString()
      } as UserType;
    }
    return null;
  }, [demoUser, session?.user]);

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'Boss' || currentUser?.role === 'Co-Boss' || currentUser?.email === 'boss@t3n-store.com';

  // Load User Products when user logs in
  useEffect(() => {
    if (currentUser) {
      loadUserProducts();
      loadDbProducts();
      if (isAdmin) {
        loadAdminStats();
        loadAdminCustomersList();
        loadAllKeysList();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      loadDbProducts();
      if (adminSectionTab === 'overview') loadAdminStats();
      if (adminSectionTab === 'customers') loadAdminCustomersList();
      if (adminSectionTab === 'keys') loadAllKeysList();
      if (adminSectionTab === 'logs') loadAdminStats();
    }
  }, [activeTab, adminSectionTab]);

  const loadUserProducts = async () => {
    if (!currentUser) return;
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/user/products?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to load user products:', e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setAdminStats(data.stats);
          setAdminLogs(data.stats.recentLogs || []);
        } else {
          // If the API somehow directly returns the stats object instead of {success: true, stats}
          setAdminStats(data.stats || data);
          setAdminLogs(data.stats?.recentLogs || data.recentLogs || []);
        }
      }
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    }
  };

  const loadAdminCustomersList = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setAllCustomersList(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  const openCustomerModal = async (customer: any) => {
    setSelectedAdminCustomer(customer);
    setSelectedCustomerProducts([]);
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

  const loadAllKeysList = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setAllKeysList(data.keys || []);
      }
    } catch (e) {
      console.error('Failed to load keys:', e);
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
            showToast(data.message || (lang === 'ar' ? 'تم استرجاع المنتج!' : 'Product restored!'), 'success');
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
          showToast(lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'Something went wrong.', 'error');
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
      const userPayload = currentUser ? {
        discordId: currentUser.discordId,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image
      } : {
        discordId: '1422761753573593088',
        name: 'Yaser_VIP',
        email: 'yaser@t3n-store.com',
        image: 'https://cdn.discordapp.com/embed/avatars/1.png'
      };

      const res = await fetch('/api/keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyString: key.trim(),
          userProfile: userPayload
        })
      });

      const data = await res.json();

      if (data.success) {
        setRedeemMessage({ type: 'success', text: data.message });
        setKeyInput('');
        showToast(lang === 'ar' ? 'تم التفعيل بنجاح!' : 'License activated!', 'success');

        // Auto login demo user if guest activated
        if (!currentUser && data.user) {
          setDemoUser(data.user);
        }

        // Refresh user products
        loadUserProducts();
        setActiveTab('my-products');
        setGuestModalOpen(false);
      } else {
        setRedeemMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setRedeemMessage({ type: 'error', text: 'حدث خطأ غير متوقع أثناء التفعيل.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Sync Discord Roles Handler
  const handleSyncDiscordRoles = async () => {
    try {
      const res = await fetch('/api/user/sync-discord-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'ar' ? 'تمت مزامنة رتب ديسكورد!' : 'Discord roles synced!', 'success');
      } else {
        showToast(lang === 'ar' ? 'فشلت المزامنة.' : 'Failed to sync Discord roles.', 'error');
      }
    } catch {
      showToast(lang === 'ar' ? 'تمت مزامنة رتب ديسكورد!' : 'Discord roles synced!', 'success');
    }
  };

  // Copy Key to Clipboard
  const copyKeyToClipboard = (keyStr: string, id: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Download Handler
  const handleDownload = async (productId: string, productName: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
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
  const openInventoryModal = async (product: Product, defaultTab: 'data' | 'custom' | 'codes' = 'codes', openBulk: boolean = false) => {
    setInventoryProduct(product);
    setEditProductData({
      name: product.name || '',
      description: product.description || '',
      version: product.version || '',
      fileSize: product.fileSize || '',
      category: product.category || '',
      downloadsCount: product.downloadsCount || 0,
      image: product.image || '',
      videoUrl: product.videoUrl || '',
      guideUrl: product.guideUrl || '',
      fileUrl: product.fileUrl || '',
      cardColor: product.cardColor || 'blue',
    });
    setProductSaveMessage(null);
    setKeyActionMessage(null);
    setEditingKeyId(null);
    setInventoryModalOpen(true);
    setInventoryTab(defaultTab);
    setBulkAddOpen(openBulk);
    setSingleAddOpen(false);
    setBulkKeysText('');
    setSingleKeyText('');
    setBulkMessage(null);
    if (product.id !== 'new') {
      await loadInventoryKeys(product.id);
    } else {
      setInventoryKeys([]);
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
      if (res.ok) {
        const data = await res.json();
        setInventoryKeys(data.keys || []);
        if (inventoryProduct) {
          inventoryProduct.stockKeysCount = (data.keys || []).length;
          
          // Update dynamic products state
          setProducts(prev => prev.map(p => p.id === inventoryProduct.id ? { ...p, stockKeysCount: (data.keys || []).length } : p));
          
          // Fallback
          const idx = initialProducts.findIndex((p) => p.id === inventoryProduct.id);
          if (idx !== -1) initialProducts[idx].stockKeysCount = (data.keys || []).length;
        }
      }
    } catch (e) {
      console.error('Failed to load inventory keys:', e);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
      });
      const data = await res.json();
      if (data.success) {
        setKeyActionMessage('تم حذف الكود بنجاح');
        if (inventoryProduct) await loadInventoryKeys(inventoryProduct.id);
        await loadAllKeysList();
        loadAdminStats();
      }
    } catch (e) {
      console.error('Failed to delete key:', e);
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
          showToast(lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'Something went wrong.', 'error');
        }
      }
    );
  };

  const handleDeleteAllKeys = async () => {
    if (!inventoryProduct) return;
    askConfirm(
      lang === 'ar' ? 'حذف جميع الأكواد' : 'Delete All Keys',
      lang === 'ar' ? `هل أنت متأكد من حذف جميع الأكواد المتاحة (${inventoryKeys.length} كود) لهذا المنتج؟` : `Are you sure you want to delete all available keys (${inventoryKeys.length} keys) for this product?`,
      async () => {
        try {
          const res = await fetch('/api/keys', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteAllForProductId: inventoryProduct.id })
          });
          const data = await res.json();
          if (data.success) {
            setKeyActionMessage(lang === 'ar' ? `تم حذف جميع الأكواد بنجاح (${data.count || inventoryKeys.length} كود)` : `Successfully deleted all available keys (${data.count || inventoryKeys.length} keys)`);
            await loadInventoryKeys(inventoryProduct.id);
            loadAdminStats();
          }
        } catch (e) {
          setKeyActionMessage(lang === 'ar' ? 'حدث خطأ أثناء حذف جميع الأكواد' : 'Error deleting keys');
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

  const handleBulkAddKeys = async () => {
    if (!bulkKeysText.trim() || !inventoryProduct) return;
    
    // OPTIMISTIC UI: Instant Zero-Latency Update
    const rawKeys = bulkKeysText.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0);
    const count = rawKeys.length;
    if (count === 0) return;

    setIsAddingKeys(true);
    setBulkMessage(`تم معالجة ${count} مفتاح لحظياً!`);
    
    // Optimistically create key objects for the UI
    const optimisticKeys: KeyType[] = rawKeys.map((k, i) => ({
      id: `temp-${Date.now()}-${i}`,
      key: k,
      productId: inventoryProduct.id,
      productName: inventoryProduct.name,
      isUsed: false,
      isDisabled: false,
      isArchived: false,
      duration: 'Lifetime',
      createdAt: new Date().toISOString()
    }));

    // Update Local States immediately (Zero-Latency)
    setInventoryKeys(prev => [...optimisticKeys, ...prev]);
    setAllKeysList(prev => [...optimisticKeys, ...prev]);
    setInventoryProduct(prev => prev ? { ...prev, stockKeysCount: (prev.stockKeysCount || 0) + count } : null);
    setBulkKeysText('');
    
    // Smooth neon bar effect
    setTimeout(() => setIsAddingKeys(false), 500);

    try {
      // Fire-and-forget background sync
      const res = await fetch('/api/admin/keys/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: inventoryProduct.id, rawKeysText: rawKeys.join('\n') })
      });
      const data = await res.json();
      if (data.success) {
        // Silently reload real keys in background to get real IDs later if needed
        loadInventoryKeys(inventoryProduct.id);
        loadAdminStats();
      }
    } catch (e) {
      console.error('Failed to bulk add keys:', e);
      showToast('حدث خطأ أثناء مزامنة المفاتيح مع الخادم.', 'error');
    }
  };

  const handleAddSingleKey = async () => {
    if (!singleKeyText.trim() || !inventoryProduct) return;
    try {
      const res = await fetch('/api/admin/keys/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: inventoryProduct.id, rawKeysText: singleKeyText })
      });
      const data = await res.json();
      if (data.success) {
        setBulkMessage(`تم إضافة المفتاح بنجاح!`);
        setSingleKeyText('');
        setSingleAddOpen(false);
        await loadInventoryKeys(inventoryProduct.id);
        loadAdminStats();
      }
    } catch (e) {
      console.error('Failed to add single key:', e);
    }
  };

  const handleLogout = () => {
    setDemoUser(null);
    if (session) {
      signOut();
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
      <div className={`min-h-screen w-full ${isDark ? 'bg-[#050508] text-[#F4F4F5]' : 'bg-[#FAFAFA] text-[#09090B]'} flex flex-col items-center justify-center p-4 relative overflow-hidden select-none transition-colors duration-500`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Ambient Premium Grid Backdrop */}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,${isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'}_1px,transparent_1px),linear-gradient(to_bottom,${isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'}_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] ${isDark ? 'opacity-70' : 'opacity-100'} pointer-events-none`} />
        
        {/* Radial background gradient matching brand color */}
        {isDark && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.09)_0%,rgba(5,5,8,1)_75%)] pointer-events-none" />
        )}

        {/* Ambient moving glow circles */}
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 40, -20, 0],
                y: [0, -30, 20, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-indigo-500/[0.06] rounded-full blur-[110px]"
            />
            <motion.div
              animate={{
                x: [0, -30, 30, 0],
                y: [0, 40, -20, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[130px]"
            />
          </div>
        )}

        {/* Floating Controls Container (Theme & Language Switchers) */}
        <div className="fixed top-5 z-50 flex items-center gap-3 transition-all" style={{ [lang === 'ar' ? 'left' : 'right']: '1.25rem' }}>
          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${
              isDark 
                ? 'bg-[#09090B]/85 border-white/[0.08] hover:bg-[#121217] hover:border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' 
                : 'bg-white/85 border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-800 shadow-md'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className={`h-10 px-4 rounded-full border flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${
              isDark 
                ? 'bg-[#09090B]/85 border-white/[0.08] hover:bg-[#121217] hover:border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' 
                : 'bg-white/85 border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-800 shadow-md'
            }`}
            title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <span className="text-sm flex items-center justify-center leading-none">{lang === 'ar' ? '🇺🇸' : '🇸🇦'}</span>
            <span className="leading-none">{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        {/* Animated Login Card */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-[400px] p-[1.5px] rounded-[40px] bg-gradient-to-b ${
              isDark 
                ? 'from-indigo-500/25 via-purple-500/10 to-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.18)]' 
                : 'from-indigo-200/50 via-slate-200 to-indigo-200/30 shadow-[0_20px_50px_rgba(0,0,0,0.04)]'
            } backdrop-blur-3xl z-10`}
          >
            <div className={`rounded-[38px] ${isDark ? 'bg-[#070709]/95' : 'bg-white/95'} p-9 sm:p-11 text-center space-y-9`}>
              
              {/* Logo Section */}
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.15 }}
                className="flex justify-center animate-pulse-slow"
              >
                <div className="relative group cursor-pointer">
                  {/* Outer pulsing glow ring */}
                  <div className="absolute -inset-2.5 rounded-full bg-indigo-500/20 blur-lg opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                  
                  {/* Circle frame with radial gradient */}
                  <div className={`w-24 h-24 rounded-full overflow-hidden border ${
                    isDark 
                      ? 'border-indigo-500/20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,#0A0A0C_100%)] shadow-[0_0_20px_rgba(99,102,241,0.25)]' 
                      : 'border-indigo-500/15 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,#ffffff_100%)] shadow-lg shadow-indigo-500/5'
                  } flex items-center justify-center p-1.5 relative z-10 transition-all duration-500 group-hover:scale-[1.05] group-hover:border-indigo-500/40 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]`}>
                    {/* Inner gradient mask */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                    
                    {/* Logo image */}
                    <img 
                      src="/logo.png?v=6" 
                      alt="تعن" 
                      className="w-full h-full rounded-full object-cover select-none" 
                      onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Titles */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-3"
              >
                <h1 className={`text-2xl sm:text-3xl font-extrabold ${styles.textTitle} notranslate`} translate="no">
                  {renderBrandText(lang === 'ar' ? 'تعن' : 'TA3N')}
                </h1>
                <p className={`text-[12px] ${styles.textMuted} font-medium leading-relaxed max-w-[290px] mx-auto`}>
                  {lang === 'ar' ? 'المنصة الاحترافية الأولى لفك حظر الألعاب والتجربة الآمنة' : 'The premier gaming unban and protection platform.'}
                </p>
              </motion.div>

              {/* Discord Login */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-4"
              >
                <button
                  onClick={() => signIn('discord')}
                  className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#5865F2] to-[#4F46E5] hover:brightness-110 active:scale-[0.96] text-white font-bold text-[14.5px] transition-all duration-300 flex items-center justify-center gap-3.5 shadow-[0_6px_24px_rgba(88,101,242,0.28)] hover:shadow-[0_10px_32px_rgba(88,101,242,0.45)] cursor-pointer relative overflow-hidden group border border-white/10"
                >
                  {/* Glow sweep effect */}
                  <div className="absolute inset-0 w-1/2 h-full bg-white/15 skew-x-[-25deg] -translate-x-full group-hover:animate-shine pointer-events-none" />
                  
                  {/* Text first, then Discord logo */}
                  <span className="font-extrabold">{lang === 'ar' ? 'تسجيل دخول عبر ديسكورد' : 'Login with Discord'}</span>
                  
                  <svg className="w-[22px] h-[22px] fill-current shrink-0 transition-transform duration-300 group-hover:scale-108" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                  </svg>
                </button>
              </motion.div>

              {/* Bottom Footer Link */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className={`pt-6 border-t ${styles.borderSubtle} text-xs flex items-center justify-center gap-2`}
              >
                <span className="text-[#71717A] font-medium">{lang === 'ar' ? 'عضو جديد؟' : 'New member?'}</span>
                <button
                  onClick={() => setGuestModalOpen(true)}
                  className={`font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-650 hover:text-indigo-550'} transition-colors cursor-pointer bg-transparent border-none p-0`}
                >
                  {lang === 'ar' ? 'تفعيل مفتاح جديد' : 'Activate new key'}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
 
        {/* Copyright Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`absolute bottom-6 left-8 text-xs font-medium ${isDark ? 'text-slate-650' : 'text-slate-400'} tracking-wide`}
          dir="rtl"
        >
          © 2026 جميع الحقوق محفوظة لمنصة {renderBrandText('تعن')}
        </motion.div>

        {/* Guest Key Redemption Modal */}
        {guestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card border border-brand-border rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
              <button
                onClick={() => setGuestModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

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
                    placeholder="T3N-FORT-99999-PERM"
                    className="w-full bg-brand-sidebar border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono tracking-wider"
                  />
                </div>

                {redeemMessage && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${redeemMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                    {redeemMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRedeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>تفعيل المفتاح الآن</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#070709] text-white selection:bg-white selection:text-black transition-colors duration-300 relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Subtle Infinite Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0 opacity-100" />

      {/* PREMIUM SAAS SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#09090b] shrink-0 h-full relative z-20 border-white/[0.08]" style={{ borderLeftWidth: lang === 'ar' ? '1px' : '0', borderRightWidth: lang === 'ar' ? '0' : '1px' }}>
        
        {/* BRAND / LOGO */}
        <div className="p-6 relative z-10 flex items-center justify-center md:justify-start border-b border-white/[0.05]">
          <div className="flex items-center gap-3.5 w-full">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img src="/logo.png" alt="تعن" className="w-full h-full rounded-full object-cover select-none" />
            </div>
            <span className="text-[19px] font-extrabold tracking-wider text-white notranslate" translate="no">
              {renderBrandText('تعن')}
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-6 relative z-10">
          
          {/* GENERAL */}
          <div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2.5 px-3">
              {lang === 'ar' ? 'عام' : 'GENERAL'}
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  activeTab === 'overview' 
                    ? 'bg-white/10 border border-white/15 text-white font-bold shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] font-medium'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 transition-colors" />
                <span className={`text-sm tracking-wide ${activeTab === 'overview' ? 'font-bold' : 'font-medium'}`}>{lang === 'ar' ? 'الرئيسية' : 'Overview'}</span>
              </button>
            </div>
          </div>

          {/* LICENSE */}
          <div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2.5 px-3">
              {lang === 'ar' ? 'الرخص' : 'LICENSE'}
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('my-products')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  activeTab === 'my-products' 
                    ? 'bg-white/10 border border-white/15 text-white font-bold shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] font-medium'
                }`}
              >
                <Package className="w-4 h-4 transition-colors" />
                <span className={`text-sm tracking-wide ${activeTab === 'my-products' ? 'font-bold' : 'font-medium'}`}>{lang === 'ar' ? 'منتجاتي' : 'My Products'}</span>
              </button>


            </div>
          </div>

          {/* COMMUNITY */}
          <div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2.5 px-3">
              {lang === 'ar' ? 'المجتمع' : 'COMMUNITY'}
            </div>
            <div className="space-y-1">
              <a 
                href="https://discord.gg/t3n"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.04] font-medium transition-all duration-200 group cursor-pointer relative"
              >
                <MessageSquare className="w-4 h-4 transition-colors" />
                <span className="text-sm font-medium tracking-wide">{lang === 'ar' ? 'ديسكورد' : 'Discord'}</span>
              </a>
            </div>
          </div>

          {/* ACCOUNT */}
          <div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2.5 px-3">
              {lang === 'ar' ? 'الحساب' : 'ACCOUNT'}
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  activeTab === 'profile' 
                    ? 'bg-white/10 border border-white/15 text-white font-bold shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] font-medium'
                }`}
              >
                <User className="w-4 h-4 transition-colors" />
                <span className={`text-sm tracking-wide ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>{lang === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
              </button>

              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    activeTab === 'admin' 
                      ? 'bg-white/10 border border-white/15 text-white font-bold shadow-sm' 
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Shield className="w-4 h-4 transition-colors text-amber-400" />
                  <span className={`text-sm tracking-wide ${activeTab === 'admin' ? 'font-bold text-amber-400' : 'font-medium text-amber-400/90'}`}>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin Control'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM USER AREA */}
        <div className="p-4 relative z-10 border-t border-white/[0.05] mt-auto w-full flex flex-col gap-2">
          {/* Profile Card */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-full bg-[#0e0e11] hover:bg-[#121216] border border-white/[0.08] rounded-xl p-2.5 flex items-center gap-3 cursor-pointer transition-all duration-200 group"
            dir="ltr"
          >
            <img
              src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
              onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
            />
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-white tracking-wide truncate group-hover:text-neutral-200 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium truncate">
                {currentUser.role === 'Boss' || currentUser.role === 'Co-Boss' || currentUser.role === 'Admin' ? 'Owner' : 'Discord Customer'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full h-9 rounded-xl bg-[#0e0e11] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-neutral-400 hover:text-red-400 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow h-full overflow-y-auto p-4 sm:p-6 md:p-8 scrollbar-none relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">

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

        {/* UNIFIED TOP BAR HEADER (MATCHING SCREENSHOT 1) */}
        <header className="flex items-center justify-between pb-6 mb-4 border-b border-white/[0.08] animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeTab === 'overview' && (lang === 'ar' ? 'الرئيسية' : 'Overview')}
              {activeTab === 'my-products' && (lang === 'ar' ? 'منتجاتي' : 'My Products')}
              {activeTab === 'redeem' && (lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key')}
              {activeTab === 'profile' && (lang === 'ar' ? 'الملف الشخصي' : 'Profile')}
              {activeTab === 'admin' && (lang === 'ar' ? 'لوحة الإدارة' : 'Admin Control')}
            </h1>
          </div>

          {/* Primary Action Button matching Screenshot 1 */}
          <button
            onClick={() => {
              setActiveTab('my-products');
              setTimeout(() => {
                const el = document.getElementById('my-products-key-input');
                if (el) el.focus();
              }, 150);
            }}
            className="bg-white hover:bg-neutral-200 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md active:scale-95 shrink-0"
          >
            <Key className="w-4 h-4 text-black" />
            <span>{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</span>
          </button>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Banner Card */}
            <div className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden transition-all duration-200 shadow-xl">
              <img
                src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-sm shrink-0"
                onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
              />
              <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {lang === 'ar' ? `مرحباً بعودتك، ${currentUser.name}!` : `Welcome back, ${currentUser.name}!`}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                  {lang === 'ar' ? `لديك ${userProducts.length} منتجات مفعلة بحسابك.` : `You have ${userProducts.length} active product(s) on your account.`}
                </p>
              </div>
            </div>

            {/* Quick Actions Grid (Matching Screenshots 2 & 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discord Quick Action Item (Screenshot 2 & 3) */}
              <a
                href="https://discord.gg/t3n"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0e0e11] hover:bg-[#121216] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">{lang === 'ar' ? 'ديسكورد' : 'Discord'}</span>
                    <span className="text-xs text-neutral-400 font-medium mt-0.5">{lang === 'ar' ? 'الدعم والتحديثات' : 'Support & Updates'}</span>
                  </div>
                </div>
                <ArrowLeft className={`w-4 h-4 text-neutral-500 group-hover:text-white transition-colors transform ${lang === 'ar' ? '' : 'rotate-180'}`} />
              </a>

              {/* My Products Item */}
              <button
                onClick={() => setActiveTab('my-products')}
                className="bg-[#0e0e11] hover:bg-[#121216] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">{lang === 'ar' ? 'منتجاتي' : 'My Products'}</span>
                    <span className="text-xs text-neutral-400 font-medium mt-0.5">{lang === 'ar' ? 'عرض المفاتيح والتحميلات' : 'View keys & downloads'}</span>
                  </div>
                </div>
                <ArrowLeft className={`w-4 h-4 text-neutral-500 group-hover:text-white transition-colors transform ${lang === 'ar' ? '' : 'rotate-180'}`} />
              </button>

              {/* Redeem Key Item */}
              <button
                onClick={() => {
                  setActiveTab('my-products');
                  setTimeout(() => {
                    const el = document.getElementById('my-products-key-input');
                    if (el) el.focus();
                  }, 150);
                }}
                className="bg-[#0e0e11] hover:bg-[#121216] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Key className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</span>
                    <span className="text-xs text-neutral-400 font-medium mt-0.5">{lang === 'ar' ? 'تفعيل رخصة جديدة' : 'Activate a new license'}</span>
                  </div>
                </div>
                <ArrowLeft className={`w-4 h-4 text-neutral-500 group-hover:text-white transition-colors transform ${lang === 'ar' ? '' : 'rotate-180'}`} />
              </button>

              {/* Sync Discord Roles Item */}
              <button
                onClick={() => handleSyncDiscordRoles()}
                className="bg-[#0e0e11] hover:bg-[#121216] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">{lang === 'ar' ? 'مزامنة الرتب' : 'Sync Discord Roles'}</span>
                    <span className="text-xs text-neutral-400 font-medium mt-0.5">{lang === 'ar' ? 'استعادة رتب العملاء' : 'Restore customer & product roles'}</span>
                  </div>
                </div>
                <ArrowLeft className={`w-4 h-4 text-neutral-500 group-hover:text-white transition-colors transform ${lang === 'ar' ? '' : 'rotate-180'}`} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MY PRODUCTS */}
        {activeTab === 'my-products' && (
          <div className="space-y-6">
            {/* Inline Premium Key Activation Card */}
            <div className="w-full bg-[#0e0e11] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className={`flex items-center gap-4 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="w-12 h-12 bg-white/[0.04] border border-white/10 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{lang === 'ar' ? 'تفعيل مفتاح الترخيص' : 'Activate License Key'}</h3>
                    <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{lang === 'ar' ? 'أدخل مفتاح التفعيل لإضافته لحسابك فوراً' : 'Enter your activation key to add it to your account instantly'}</p>
                  </div>
                </div>

                <form onSubmit={handleRedeemKey} className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto shrink-0">
                  <input
                    type="text"
                    dir="ltr"
                    id="my-products-key-input"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="KEY-XXXXXX-XXXXXX"
                    className="w-full sm:w-64 bg-[#060709] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-mono tracking-wider shadow-inner text-center"
                  />
                  <button
                    type="submit"
                    disabled={isRedeeming}
                    className="py-3 px-5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-md shrink-0"
                  >
                    {isRedeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{lang === 'ar' ? 'تفعيل' : 'Activate'}</span>
                  </button>
                </form>
              </div>

              {redeemMessage && (
                <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up ${redeemMessage?.type === 'success' ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {redeemMessage?.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{redeemMessage?.text}</span>
                </div>
              )}
            </div>
            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl overflow-hidden p-5 space-y-4 animate-pulse">
                    <div className="h-44 bg-white/[0.04] rounded-xl w-full" />
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-white/[0.04] rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                        <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-14 bg-white/[0.04] rounded-xl w-full" />
                    <div className="h-11 bg-white/[0.04] rounded-xl w-full" />
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
                  onClick={() => {
                    const el = document.getElementById('my-products-key-input');
                    if (el) el.focus();
                  }}
                  className="bg-white hover:bg-neutral-200 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                >
                  <Key className="w-4 h-4 text-black" />
                  <span>{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userProducts.map((up) => (
                  <div
                    key={up.id}
                    className="bg-[#0e0e11] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl hover:border-white/20 hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col group relative"
                  >
                    {/* 1. HEADER / BANNER */}
                    <div className="relative h-44 w-full overflow-hidden bg-black/40 border-b border-white/[0.08]">
                      <img
                        src={getProductImage(up.product)}
                        alt={up.product?.name || 'Product'}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        onError={(e) => { 
                          e.currentTarget.src = '/logo.png'; 
                          e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-80 transition-transform duration-500 ease-out group-hover:scale-105'; 
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-transparent to-transparent opacity-90" />
                      
                      {/* Top Category Badge */}
                      <div className={`absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'} px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider shadow-md flex items-center gap-1.5`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{up.product?.category || 'SPOOFER'}</span>
                      </div>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      
                      {/* 2 & 3. PRODUCT NAME & SUBLINE */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-white shadow-inner">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <h3 className="font-extrabold text-white text-base tracking-tight truncate">
                            {up.product?.name || 'فك باند فورت نايت'}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {lang === 'ar' ? 'فعال' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. MASKED LICENSE KEY BOX WITH REVEAL TOGGLE & COPY */}
                      <div className="bg-[#060709] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2 relative transition-all duration-200 hover:border-white/15 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            {lang === 'ar' ? 'مفتاح الترخيص' : 'License Key'}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-400/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {lang === 'ar' ? 'صالح' : 'Valid'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <code dir="ltr" className="text-xs sm:text-sm font-mono text-white font-bold tracking-wider truncate flex-1 text-left select-all">
                            {(() => {
                              const rawKey = up.keyString || 'KEY-ACTIVATED';
                              const fullKey = rawKey.toUpperCase().startsWith('KEY-') ? rawKey : `KEY-${rawKey}`;
                              return revealedKeys[up.id]
                                ? fullKey
                                : `${fullKey.substring(0, 5)}••••-••••`;
                            })()}
                          </code>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleKeyReveal(up.id)}
                              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
                              title={revealedKeys[up.id] ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'إظهار' : 'Show')}
                            >
                              {revealedKeys[up.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => copyKeyToClipboard(up.keyString || 'KEY-ACTIVATED', up.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
                                copiedKeyId === up.id
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-neutral-400 hover:text-white'
                              }`}
                              title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy Key'}
                            >
                              {copiedKeyId === up.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 5. ACTION BUTTONS (WHITE PRIMARY DOWNLOAD BUTTON) */}
                      <div className="space-y-2 pt-1">
                        {/* Primary Download Button (White Button matching reference) */}
                        <button
                          onClick={() => handleDownload(up.productId, up.product?.name || 'Product')}
                          className="w-full h-11 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                        >
                          <Download className="w-4 h-4 text-black" />
                          <span>{lang === 'ar' ? 'تحميل البرنامج' : 'Download Loader'}</span>
                        </button>

                        {/* Secondary Guide Button */}
                        <button
                          onClick={() => {
                            setGuideModalProduct(up);
                            setGuideView('menu');
                          }}
                          className="w-full h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <HelpCircle className="w-4 h-4 text-neutral-400" />
                          <span>{lang === 'ar' ? 'الشروحات والتعليمات' : 'Guide & Documentation'}</span>
                        </button>
                      </div>

                      {/* 6. FOOTER DATE METADATA */}
                      {up.activatedAt && (
                        <div className="mt-2 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                          <span>{new Date(up.activatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        /* TAB 3: REDEEM KEY (Integrated into My Products) */
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

            {/* Support Box */}
            <div className="bg-[#0e0e11] border border-white/[0.08] border-r-4 border-r-indigo-500 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                <h4 className={`text-sm font-bold ${styles.textTitle}`}>{lang === 'ar' ? 'هل تحتاج إلى تحديث بياناتك؟' : 'Need to update details?'}</h4>
                <p className={`text-[11px] ${styles.textMuted} mt-1`}>
                  {lang === 'ar' ? 'تواصل مع الدعم الفني لمزامنة الرتب أو حل مشكلات الحساب.' : 'Connect with our Discord support team to resolve billing or access issues.'}
                </p>
              </div>
              <a
                href="https://discord.gg/t3n"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer shrink-0"
              >
                {lang === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN PANEL (Categorized Dashboard with Sub-Tabs) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Admin Header */}
            <div className={`${styles.bgCard} border ${styles.borderNormal} rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div>
                <h1 className={`text-2xl font-extrabold ${styles.textTitle} tracking-wide flex items-center gap-3`}>
                  <div className={`p-2 bg-black/5 dark:bg-white/5 rounded-xl border ${styles.borderSubtle}`}>
                    {adminSectionTab === 'overview' && <Activity className="w-6 h-6 text-sky-500 dark:text-sky-400" />}
                    {adminSectionTab === 'products' && <Package className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    {adminSectionTab === 'customers' && <Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />}
                    {adminSectionTab === 'keys' && <Key className="w-6 h-6 text-indigo-600 dark:text-primary" />}
                    {adminSectionTab === 'logs' && <FileText className="w-6 h-6 text-orange-500 dark:text-orange-400" />}
                  </div>
                  <span>
                    {adminSectionTab === 'overview' && (lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Overview & Stats')}
                    {adminSectionTab === 'products' && (lang === 'ar' ? 'إدارة المنتجات والمخزون' : 'Products & Inventory')}
                    {adminSectionTab === 'customers' && (lang === 'ar' ? 'إدارة العملاء' : 'Customers Management')}
                    {adminSectionTab === 'keys' && (lang === 'ar' ? 'البحث في المفاتيح' : 'Keys Search')}
                    {adminSectionTab === 'logs' && (lang === 'ar' ? 'سجلات النظام' : 'System Logs')}
                  </span>
                </h1>
                <p className={`text-xs ${styles.textMuted} mt-2`}>
                  {adminSectionTab === 'overview' && (lang === 'ar' ? <>إحصائيات شاملة ومباشرة لمنصة {renderBrandText('تعن')} الرقمية.</> : 'Comprehensive live stats for the TA3N portal.')}
                  {adminSectionTab === 'products' && (lang === 'ar' ? 'تحكم كامل في إعدادات المنتجات وإضافة المفاتيح اليدوية.' : 'Full control over product settings and manual key addition.')}
                  {adminSectionTab === 'customers' && (lang === 'ar' ? 'استعراض بيانات العملاء، حظر، ومراجعة أنشطتهم.' : 'Browse customer data, manage bans, and audit their activities.')}
                  {adminSectionTab === 'keys' && (lang === 'ar' ? 'تتبع سريع للمفاتيح المباعة والمتاحة في النظام.' : 'Quick tracking of sold and available license keys in the system.')}
                  {adminSectionTab === 'logs' && (lang === 'ar' ? 'مراقبة حية لجميع حركات دخول وخروج واستخدام الموقع.' : 'Live auditing of all logins, transactions, and site usage.')}
                </p>
              </div>

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

            {/* Admin Sub-Tabs Navigation */}
            <div className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-black/5 dark:bg-[#090b10] border ${styles.borderSubtle} rounded-2xl w-fit`}>
              {[
                { id: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: Activity },
                { id: 'products', label: lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock', icon: Package },
                { id: 'customers', label: lang === 'ar' ? 'إدارة العملاء' : 'Customers', icon: Users },
                { id: 'keys', label: lang === 'ar' ? 'البحث عن المفاتيح' : 'Keys Search', icon: Key },
                { id: 'logs', label: lang === 'ar' ? 'سجلات النظام' : 'System Logs', icon: FileText },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = adminSectionTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminSectionTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

            {/* ==================== SUB-TAB 1: PRODUCTS & INVENTORY ==================== */}
            {adminSectionTab === 'products' && (
              <div className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="glass-card rounded-[24px] overflow-hidden hover:border-indigo-500/40 dark:hover:border-primary/40 transition-all duration-300 flex flex-col group"
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
                              onClick={() => openInventoryModal(product, 'codes', true)}
                              className="py-3 px-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white dark:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-indigo-500/20"
                            >
                              <Key className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'إضافة مفاتيح' : 'Add Keys'}</span>
                            </button>

                            <button
                              onClick={() => openInventoryModal(product, 'data', false)}
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

            {/* ==================== SUB-TAB 3: SEARCH ALL KEYS ==================== */}
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
                      {adminLogs.map((log) => {
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
                                {log.action}
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
                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
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

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
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

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
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

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
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
              <button
                onClick={() => setInventoryTab('custom')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'custom' ? 'bg-indigo-600 dark:bg-primary text-white shadow-lg shadow-indigo-500/15' : `${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} border`}`}
              >
                <span>الحقول المخصصة</span>
                <Layers className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => setInventoryTab('data')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'data' ? 'bg-indigo-600 dark:bg-primary text-white shadow-lg shadow-indigo-500/15' : `${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} border`}`}
              >
                <span>بيانات المنتج</span>
                <FileText className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* TAB: بيانات المنتج (Editable) */}
              {inventoryTab === 'data' && (
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
                  </div>

                  <div className={`pt-4 border-t ${styles.borderNormal}`}>
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{inventoryProduct.id === 'new' ? 'إضافة المنتج الجديد' : 'حفظ تغييرات المنتج'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: الحقول المخصصة (Editable) */}
              {inventoryTab === 'custom' && (
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

                  <div className={`pt-4 border-t ${styles.borderNormal} space-y-3`}>
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>{inventoryProduct.id === 'new' ? 'إضافة المنتج الجديد' : 'حفظ تغييرات الحقول'}</span>
                    </button>

                    {inventoryProduct.id !== 'new' && (
                      <button
                        onClick={handleDeleteProductPermanently}
                        className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 dark:text-rose-450 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف المنتج نهائياً من النظام</span>
                      </button>
                    )}
                  </div>
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
                          يمكنك إضافة آلاف المفاتيح دفعة واحدة بدون أي تأخير. النظام سيقوم بمعالجتها في الخلفية.
                        </p>
                      </div>
                    </div>
                    {!bulkAddOpen && (
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
                    {bulkAddOpen && (
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
                          <span className="text-xs text-indigo-500 dark:text-primary font-bold tracking-widest uppercase">Batch Keys</span>
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
                      <div className="text-xs font-bold text-indigo-650 dark:text-primary bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20 px-3 py-1.5 rounded-full shadow-sm">
                        {inventoryKeys.length} مفتاح
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
                            <button
                              onClick={() => handleDeleteKey(keyItem.id)}
                              className="shrink-0 p-2.5 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                              title="حذف المفتاح"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {inventoryKeys.length === 0 && !bulkAddOpen && !singleAddOpen && (
                          <div className={`text-center py-10 border ${styles.borderNormal} border-dashed rounded-xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
                            <Key className="w-8 h-8 text-slate-450 mx-auto mb-3 opacity-50" />
                            <p className={`text-xs ${styles.textMuted} font-bold`}>لا توجد مفاتيح في المخزون حالياً</p>
                          </div>
                        )}

                        {/* Single Add Key Block */}
                        <AnimatePresence>
                          {singleAddOpen && (
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
                                  disabled={!singleKeyText.trim()}
                                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/10"
                                >
                                  إضافة
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
                        {!singleAddOpen && (
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
              <button
                onClick={handleSaveProductChanges}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-650 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-primary-hover text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/15 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* GUIDE MODAL */}
      {/* ------------------------------------------------------------------------------------------------ */}
      {guideModalProduct && guideView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setGuideModalProduct(null); setGuideView(null); }} />
          <div className="relative glass-card rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between bg-black/40 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -z-10" />
              <div className="flex flex-col items-end w-full pr-2 z-10">
                <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1 flex-row-reverse">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  {guideView === 'menu' ? 'قائمة الشروحات والمساعدة' : 
                   guideView === 'full' ? 'شرح خطوات التفعيل والتشغيل' :
                   guideView === 'network' ? 'حل مشكلة إغلاق البرنامج أو خطأ الشبكة' : 'حل مشكلة الوقت (Timer)'}
                </h3>
                <p className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{guideModalProduct.product?.name || ''}</p>
              </div>
              <button
                onClick={() => { setGuideModalProduct(null); setGuideView(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer shrink-0 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto scrollbar-thin">
              {guideView === 'menu' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
                  {/* Full Tutorial Button */}
                  <button
                    onClick={() => {
                      setGuideView('full');
                    }}
                    className="flex flex-col items-center justify-center gap-5 p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group cursor-pointer shadow-lg hover:shadow-brand-glow hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                      <ExternalLink className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-extrabold text-white mb-2 text-lg">شرح التفعيل (فيديو)</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">شرح مرئي كامل يوضح طريقة التفعيل والتشغيل خطوة بخطوة.</p>
                    </div>
                  </button>

                  {/* Guide Link Button */}
                  <button
                    onClick={() => {
                      if (guideModalProduct.product?.guideUrl) {
                        window.open(guideModalProduct.product.guideUrl, '_blank');
                      } else {
                        window.open('https://discord.gg/t3n', '_blank');
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-5 p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group cursor-pointer shadow-lg hover:shadow-brand-glow hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-extrabold text-white mb-2 text-lg">دعم ومشاكل (ديسكورد)</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">حلول للمشاكل المفاجئة مثل أخطاء الشبكة ومشاكل الوقت.</p>
                    </div>
                  </button>
                </div>
              )}

              {guideView === 'full' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex justify-between items-center px-1 border-b border-white/10 pb-4">
                    <button onClick={() => setGuideView('menu')} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1.5 cursor-pointer font-bold bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20 hover:scale-105">
                      <ArrowRight className="w-4 h-4" />
                      العودة للقائمة السابقة
                    </button>
                  </div>
                  <div className="aspect-video w-full rounded-2xl border border-white/10 overflow-hidden bg-[#050505] flex flex-col items-center justify-center p-0 text-center relative shadow-2xl">
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
                      ) : (
                        <video 
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
                        <h3 className="text-white font-extrabold mb-2 text-lg">لا يوجد فيديو شرح متاح</h3>
                        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                          لم تقم الإدارة بإضافة رابط فيديو شرح لهذا المنتج حتى الآن.
                          <br /><br />
                          الرجاء إبلاغ الدعم الفني أو زيارة سيرفر الديسكورد للمساعدة.
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
                          return (
                            <div key={userProd.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/10 transition-all">
                              <div className="space-y-1">
                                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                                  <span>{originalProd?.name || userProd.productId}</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="text-[11px] text-neutral-400 flex flex-wrap gap-x-3 font-medium">
                                  <span>{lang === 'ar' ? 'تاريخ التفعيل:' : 'Activated:'} {new Date(userProd.activatedAt).toLocaleDateString('ar-SA')}</span>
                                  <span className="text-neutral-600">|</span>
                                  <span className="text-emerald-400 font-bold">
                                    {lang === 'ar' ? 'نشط' : 'Active'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRevokeUserProduct(selectedAdminCustomer.id, userProd.productId)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                              >
                                {lang === 'ar' ? 'سحب وتعطيل' : 'Revoke Product'}
                              </button>
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
                            <div className="text-[10px] text-neutral-500 font-mono">
                              {new Date(keyObj.usedAt || Date.now()).toLocaleDateString('ar-SA')}
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
                      <span className="text-neutral-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {lang === 'ar' ? 'التحذيرات النشطة' : 'Warnings'}</span>
                      <span className="text-amber-500 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{selectedAdminCustomer.warningCount || 0}</span>
                    </div>
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
      {/* Premium Toast Notification Stack (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none flex flex-col gap-3 items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[#111113] border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)] rounded-lg px-4 py-2.5 pointer-events-auto relative overflow-hidden flex items-center min-w-[200px] max-w-sm"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Subtle accent vertical line */}
              <div className={`absolute ${lang === 'ar' ? 'right-0' : 'left-0'} top-0 bottom-0 w-[3px] rounded-full ${
                toast.type === 'error' ? 'bg-rose-500/80' : 
                toast.type === 'warning' ? 'bg-amber-500/80' :
                toast.type === 'info' ? 'bg-sky-500/80' : 
                'bg-white/40'
              }`} />
              
              {/* Toast Message */}
              <span className={`text-[13px] font-bold text-white tracking-wide ${lang === 'ar' ? 'pr-3' : 'pl-3'}`}>
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Custom Premium Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-[#0b0c0e]/95 border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-white">{confirmModal.title}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => confirmModal.onCancel ? confirmModal.onCancel() : setConfirmModal(null)}
                className="flex-grow py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-grow py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                {lang === 'ar' ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
