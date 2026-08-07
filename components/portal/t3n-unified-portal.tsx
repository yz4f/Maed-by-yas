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
  Menu,
  X,
  Bot,
  Edit3,
  Save,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, UserProduct, SystemLog, Key as KeyType, User as UserType } from '@/types';

interface T3NUnifiedPortalProps {
  initialProducts: Product[];
}

export function T3NUnifiedPortal({ initialProducts }: T3NUnifiedPortalProps) {
  const { data: session, status } = useSession();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'my-products' | 'redeem' | 'admin'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

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
  const [allKeysList, setAllKeysList] = useState<KeyType[]>([]);
  const [searchKeysQuery, setSearchKeysQuery] = useState('');
  const [keyStatusFilter, setKeyStatusFilter] = useState<'all' | 'unused' | 'used'>('all');

  // Current active user (either NextAuth session or Demo User)
  const currentUser = React.useMemo(() => {
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
      };
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
    if (!confirm('هل أنت تأكد من سحب وتعطيل هذا المنتج عن العميل؟')) return;
    try {
      const res = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_product', userId, productId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'تم تعطيل المنتج عن العميل بنجاح');
        loadAdminCustomersList();
        loadAdminStats();
      }
    } catch (e) {
      showToast('حدث خطأ أثناء تعطيل المنتج.');
    }
  };

  const handleDeleteUserAccount = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت تأكد من حذف حساب العميل ${userName} نهائياً؟`)) return;
    try {
      const res = await fetch(`/api/admin/customers/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'تم حذف العميل بنجاح.');
        loadAdminCustomersList();
        loadAdminStats();
      }
    } catch (e) {
      showToast('حدث خطأ أثناء حذف العميل.');
    }
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
        showToast(data.message || 'عذراً، فشل التحميل.');
      }
    } catch (e) {
      showToast('حدث خطأ في طلب التحميل.');
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
    await loadInventoryKeys(product.id);
  };

  const handleSaveProductChanges = async () => {
    if (!inventoryProduct) return;
    setIsSavingProduct(true);
    setProductSaveMessage(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inventoryProduct.id,
          ...editProductData
        })
      });
      const data = await res.json();
      if (data.success && data.product) {
        setInventoryProduct(data.product);
        setProductSaveMessage('تم حفظ تعديلات المنتج بنجاح!');
        
        // Update dynamic products state
        setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
        
        // Update in-memory initialProducts fallback
        const idx = initialProducts.findIndex((p) => p.id === data.product.id);
        if (idx !== -1) {
          initialProducts[idx] = { ...initialProducts[idx], ...data.product };
        }
        
        loadAdminStats();
        loadUserProducts(); // Refresh user products immediately to sync updated product image
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
    if (!confirm('هل أنت متأكد من حظر المستخدم وإلغاء مفتاحه وسحب المنتج منه؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch('/api/admin/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, keyId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حظر المستخدم وسحب المفتاح والمنتج بنجاح.');
        await loadAllKeysList();
        loadAdminStats();
      } else {
        showToast(data.message || 'فشل الحظر والإلغاء.');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  const handleDeleteAllKeys = async () => {
    if (!inventoryProduct) return;
    if (!confirm(`هل أنت تأكد من حذف جميع الأكواد المتاحة (${inventoryKeys.length} كود) لهذا المنتج؟`)) return;

    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAllForProductId: inventoryProduct.id })
      });
      const data = await res.json();
      if (data.success) {
        setKeyActionMessage(`تم حذف جميع الأكواد بنجاح (${data.count || inventoryKeys.length} كود)`);
        await loadInventoryKeys(inventoryProduct.id);
        loadAdminStats();
      }
    } catch (e) {
      setKeyActionMessage('حدث خطأ أثناء حذف جميع الأكواد');
    }
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
    if (!confirm(`هل أنت تأكد من حذف المنتج "${inventoryProduct.name}" نهائياً من المتجر وكافة العملاء؟`)) return;
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
      showToast('حدث خطأ أثناء حذف المنتج.');
    }
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
      showToast('حدث خطأ أثناء مزامنة المفاتيح مع الخادم.');
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

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#06080d] text-slate-100' : 'bg-slate-50 text-slate-900'} bg-grid-pattern flex flex-col items-center justify-center p-4 relative overflow-hidden select-none transition-colors duration-500`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Floating Controls Container */}
        <div className="fixed top-5 z-50 flex items-center gap-3 transition-all" style={{ [lang === 'ar' ? 'left' : 'right']: '1.25rem' }}>
          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-full ${isDark ? 'bg-[#10121a]/90 border-white/20 hover:border-sky-400 text-white' : 'bg-white/90 border-slate-200 hover:border-sky-500 text-slate-800'} border backdrop-blur-md shadow-2xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className={`px-3.5 py-2 rounded-full ${isDark ? 'bg-[#10121a]/90 border-white/20 hover:border-sky-400 text-white' : 'bg-white/90 border-slate-200 hover:border-sky-500 text-slate-800'} border backdrop-blur-md shadow-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all hover:scale-105 cursor-pointer`}
            title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <span className="text-sm">{lang === 'ar' ? '🇺🇸' : '🇸🇦'}</span>
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>

        {/* Subtle Background Glow Spheres */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isDark ? 'bg-sky-500/10' : 'bg-sky-400/20'} rounded-full blur-[150px] pointer-events-none transition-colors duration-500`} />
        <div className={`absolute bottom-10 right-10 w-[400px] h-[400px] ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-400/20'} rounded-full blur-[130px] pointer-events-none transition-colors duration-500`} />

        {/* Animated Login Glass Card */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-[400px] ${isDark ? 'bg-[#101115]/80 border-white/[0.04]' : 'bg-white/90 border-slate-200'} border rounded-[2rem] p-10 shadow-2xl relative z-10 text-center space-y-8 transition-colors duration-500 backdrop-blur-2xl`}
          >
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className={`w-[110px] h-[110px] rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border ${isDark ? 'border-white/5 bg-[#0a0b0e]' : 'border-slate-200 bg-black shadow-xl'}`}>
                <img src="/logo.png?v=6" alt="تعن" className="w-full h-full object-cover scale-110 opacity-90 hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>

            {/* Titles */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-wide`}>
                تعن
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-bold tracking-wide leading-relaxed px-4`}>
                منصتك الاحترافية والمثالية لتجربة واستعراض الميزات الفريدة لمنتجاتنا المميزة.
              </p>
            </motion.div>

            {/* Discord Login */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => signIn('discord')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(88,101,242,0.3)] hover:shadow-[0_4px_25px_rgba(88,101,242,0.5)] cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Bot className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
              </button>
            </motion.div>

            {/* Bottom Footer Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`pt-6 border-t ${isDark ? 'border-white/5 text-slate-400' : 'border-slate-200 text-slate-500'} text-xs flex items-center justify-center gap-2`}
            >
              <span>عضو جديد؟</span>
              <button
                onClick={() => setGuestModalOpen(true)}
                className={`font-bold underline underline-offset-4 transition-colors cursor-pointer ${isDark ? 'text-sky-500 hover:text-sky-400' : 'text-sky-600 hover:text-sky-500'}`}
              >
                تفعيل مفتاح جديد
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Copyright Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`absolute bottom-6 left-8 text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'} tracking-wide`}
          dir="rtl"
        >
          © 2026 جميع الحقوق محفوظة لمنصة تعن
        </motion.div>

        {/* Guest Key Redemption Modal */}
        {guestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#10121a] border border-white/10 rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
              <button
                onClick={() => setGuestModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">تفعيل مفتاح جديد</h3>
                  <p className="text-xs text-slate-400">أدخل مفتاح التفعيل للانضمام التلقائي للموقع والديسكورد</p>
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
                    className="w-full bg-[#08090d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors font-mono tracking-wider"
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

        {/* CUSTOMER MANAGEMENT MODAL (ADMIN ONLY) */}
        {selectedAdminCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#10121a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAdminCustomer(null)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <img
                  src={selectedAdminCustomer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={selectedAdminCustomer.name}
                  className="w-14 h-14 rounded-full border border-sky-500/30 object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedAdminCustomer.name}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedAdminCustomer.role === 'Boss' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                      {selectedAdminCustomer.role}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex gap-3">
                    <span>Discord: <span className="text-sky-400 font-mono">{selectedAdminCustomer.discordId}</span></span>
                    <span>|</span>
                    <span>IP: <span className="font-mono text-slate-300">{selectedAdminCustomer.lastIp || '127.0.0.1'}</span></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* User Keys */}
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span>مفاتيح العميل المستخدمة</span>
                  </h4>
                  <div className="bg-[#08090d] border border-white/5 rounded-xl p-4">
                    {allKeysList.filter(k => k.usedByUserId === selectedAdminCustomer.id).length > 0 ? (
                      <div className="space-y-2">
                        {allKeysList.filter(k => k.usedByUserId === selectedAdminCustomer.id).map(keyObj => (
                          <div key={keyObj.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                            <div>
                              <div className="font-mono text-xs text-emerald-400 tracking-wider">{keyObj.key}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                منتج: <span className="text-slate-200">{keyObj.productName || 'غير محدد'}</span> - المدة: {keyObj.duration}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              تم التفعيل: {new Date(keyObj.usedAt || Date.now()).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 text-center py-4">لا توجد مفاتيح مستخدمة لهذا العميل حالياً.</div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span>إجراءات سريعة</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRevokeUserProduct(selectedAdminCustomer.id, 'prod-fortnite')}
                      className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      <span>تعطيل منتج: فورت نايت</span>
                    </button>
                    <button
                      onClick={() => handleRevokeUserProduct(selectedAdminCustomer.id, 'prod-hwid-master')}
                      className="py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>تعطيل منتج: سبوفر تعن</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast(`تم حظر العميل ${selectedAdminCustomer.name} من النظام بنجاح!`);
                        setSelectedAdminCustomer(null);
                      }}
                      className="col-span-1 sm:col-span-2 py-2.5 px-4 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>حظر العميل نهائياً (Ban)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER STATE 2: LOGGED IN (SPIRITX DASHBOARD PANEL)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#08090d] bg-grid-pattern text-slate-100 flex flex-col md:flex-row selection:bg-sky-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Circular Language Switcher Button */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="fixed top-4 md:top-5 z-50 px-3.5 py-2 rounded-full bg-[#10121a]/95 border border-white/20 hover:border-sky-400 backdrop-blur-md shadow-2xl flex items-center justify-center gap-1.5 text-xs font-bold text-white transition-all hover:scale-105 cursor-pointer"
        style={{ [lang === 'ar' ? 'left' : 'right']: '1.25rem' }}
        title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
      >
        <span className="text-sm">{lang === 'ar' ? '🇺🇸' : '🇸🇦'}</span>
        <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
      </button>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0d0f17] border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-500/30">
            <img src="/logo.png?v=5" alt="تعن" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-white text-base tracking-wide">{t.siteTitle}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 bg-[#090b10] border-r border-white/[0.06] flex flex-col justify-between p-4 ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
        <div>
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3 px-3 py-3 mb-6 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-black/40 border border-white/10 shrink-0">
              <img src="/logo.png?v=6" alt="تعن" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-wider leading-tight">{t.siteTitle}</h2>
              <p className="text-[10px] text-primary font-extrabold tracking-widest uppercase">PLATFORM</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* GENERAL */}
            <div>
              <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase px-3 mb-3">
                {lang === 'ar' ? 'عام' : 'GENERAL'}
              </div>
              <button
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                  activeTab === 'overview'
                    ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {activeTab === 'overview' && (
                  <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                )}
                <Layers className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'overview' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                <span>{t.overview}</span>
              </button>
            </div>

            {/* LICENSE */}
            <div>
              <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase px-3 mb-3">
                {lang === 'ar' ? 'الاشتراكات والمفاتيح' : 'LICENSE'}
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setActiveTab('my-products'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                    activeTab === 'my-products'
                      ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {activeTab === 'my-products' && (
                    <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                  )}
                  <Package className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'my-products' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                  <span>{t.myProducts}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('redeem'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                    activeTab === 'redeem'
                      ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {activeTab === 'redeem' && (
                    <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                  )}
                  <Key className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'redeem' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                  <span>{t.redeemKey}</span>
                </button>
              </div>
            </div>

            {/* ADMIN SECTION (If admin user) */}
            {isAdmin && (
              <div>
                <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase px-3 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-brand-glow animate-pulse" />
                  {lang === 'ar' ? 'الإدارة (Admin)' : 'ADMIN CONTROL'}
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSectionTab('overview'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                      activeTab === 'admin' && adminSectionTab === 'overview'
                        ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {activeTab === 'admin' && adminSectionTab === 'overview' && (
                      <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                    )}
                    <Activity className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'admin' && adminSectionTab === 'overview' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                    <span>{lang === 'ar' ? 'الرئيسية والإحصائيات' : 'Overview & Stats'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSectionTab('products'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                      activeTab === 'admin' && adminSectionTab === 'products'
                        ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {activeTab === 'admin' && adminSectionTab === 'products' && (
                      <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                    )}
                    <Package className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'admin' && adminSectionTab === 'products' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                    <span>{lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Inventory'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSectionTab('customers'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                      activeTab === 'admin' && adminSectionTab === 'customers'
                        ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {activeTab === 'admin' && adminSectionTab === 'customers' && (
                      <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                    )}
                    <Users className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'admin' && adminSectionTab === 'customers' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                    <span>{lang === 'ar' ? 'إدارة العملاء' : 'Customers'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSectionTab('keys'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                      activeTab === 'admin' && adminSectionTab === 'keys'
                        ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {activeTab === 'admin' && adminSectionTab === 'keys' && (
                      <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                    )}
                    <Key className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'admin' && adminSectionTab === 'keys' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                    <span>{lang === 'ar' ? 'البحث عن المفاتيح' : 'Keys Search'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin'); setAdminSectionTab('logs'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer relative group rounded-xl ${
                      activeTab === 'admin' && adminSectionTab === 'logs'
                        ? 'text-white bg-white/10 border border-white/10 shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {activeTab === 'admin' && adminSectionTab === 'logs' && (
                      <div className={`absolute top-2.5 bottom-2.5 w-1 bg-primary rounded-full shadow-brand-glow ${lang === 'ar' ? 'right-0' : 'left-0'}`} />
                    )}
                    <FileText className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'admin' && adminSectionTab === 'logs' ? 'text-primary' : 'text-slate-500 group-hover:text-primary/70'}`} />
                    <span>{lang === 'ar' ? 'سجلات النظام' : 'System Logs'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* COMMUNITY */}
            <div>
              <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase px-3 mb-3">
                {lang === 'ar' ? 'المجتمع' : 'COMMUNITY'}
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => showToast(lang === 'ar' ? 'تمت مزامنة رتب الديسكورد بنجاح!' : 'Discord roles synced!')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 cursor-pointer group"
                >
                  <Bot className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors duration-300" />
                  <span>{lang === 'ar' ? 'مزامنة الديسكورد' : 'Sync Discord Roles'}</span>
                </button>
                <a
                  href="https://discord.gg/t3n"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group"
                >
                  <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors duration-300" />
                  <span>{lang === 'ar' ? 'الانضمام للديسكورد' : 'Join Discord'}</span>
                </a>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom User Card */}
        <div className="pt-4 border-t border-white/[0.04] mt-6 space-y-3">
          <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl border border-primary/30 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-[#0a0a0a]" />
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-sm text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 font-mono mt-0.5">
                <span className="text-primary font-semibold">{currentUser.role}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* TAB 1: OVERVIEW (Screenshot 3) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                {lang === 'ar' ? 'النظرة العامة' : 'Overview'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'مرحباً بك في لوحة تحكم T3N STORE المتكاملة' : 'Welcome to the T3N STORE Unified Dashboard'}
              </p>
            </div>

            {/* Welcome Banner Card (Premium Redesign) */}
            <div className="glass-card rounded-[24px] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />
              <div className="flex items-center gap-5 z-10">
                <img
                  src={currentUser.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-[18px] border border-primary/30 object-cover shadow-brand-glow"
                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                />
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
                    {lang === 'ar' ? 'مرحباً بك،' : 'Welcome back,'} <span className="text-glow-primary text-primary">{currentUser.name}</span>!
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    {lang === 'ar' ? (
                      <>لديك <span className="text-white font-bold">{userProducts.length}</span> منتج نشط في حسابك.</>
                    ) : (
                      <>You have <span className="text-white font-bold">{userProducts.length}</span> active product(s) on your account.</>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('my-products')}
                className="py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-brand-glow transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 z-10"
              >
                <span>{lang === 'ar' ? 'عرض المنتجات' : 'View Products'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Layout: Stats Cards & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: 4 Stat Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {/* Stat 1: Active Products */}
                <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary w-fit mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{userProducts.length}</div>
                  <div className="text-sm text-slate-400 font-medium">{lang === 'ar' ? 'المنتجات النشطة' : 'Active Products'}</div>
                </div>

                {/* Stat 2: Account Status */}
                <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary w-fit mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-primary mb-1">{lang === 'ar' ? 'نشط' : 'Active'}</div>
                  <div className="text-sm text-slate-400 font-medium">{lang === 'ar' ? 'حالة الحساب' : 'Account Status'}</div>
                </div>

                {/* Stat 3: Member Since */}
                <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary w-fit mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-black text-white mb-1" dir="ltr">
                    {new Date(currentUser.createdAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-sm text-slate-400 font-medium">{lang === 'ar' ? 'عضو منذ' : 'Member Since'}</div>
                </div>

                {/* Stat 4: Total Downloads */}
                <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary w-fit mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Download className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{userProducts.reduce((sum, up) => sum + (up.product?.downloadsCount || 0), 0) || 12}</div>
                  <div className="text-sm text-slate-400 font-medium">{lang === 'ar' ? 'عدد التحميلات' : 'Downloads Count'}</div>
                </div>
              </div>

              {/* Right Column: Quick Actions Card */}
              <div className="glass-card rounded-[24px] p-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
                  {lang === 'ar' ? 'إجراءات سريعة' : 'QUICK ACTIONS'}
                </div>

                {/* Quick Action 1 */}
                <button
                  onClick={() => setActiveTab('my-products')}
                  className={`w-full p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-between transition-all duration-200 group cursor-pointer ${lang === 'ar' ? 'text-right flex-row-reverse' : 'text-left flex-row'}`}
                >
                  <div className={`flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Package className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{lang === 'ar' ? 'منتجاتي' : 'My Products'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lang === 'ar' ? 'عرض المفاتيح والتحميلات' : 'View keys & downloads'}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </button>

                {/* Quick Action 2 */}
                <button
                  onClick={() => setActiveTab('redeem')}
                  className={`w-full p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-between transition-all duration-200 group cursor-pointer ${lang === 'ar' ? 'text-right flex-row-reverse' : 'text-left flex-row'}`}
                >
                  <div className={`flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Key className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lang === 'ar' ? 'تفعيل رخصة جديدة' : 'Activate a new license'}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </button>

                {/* Quick Action 3 */}
                <button
                  onClick={() => showToast(lang === 'ar' ? 'تمت مزامنة رتب الديسكورد!' : 'Discord roles synced!')}
                  className={`w-full p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-between transition-all duration-200 group cursor-pointer ${lang === 'ar' ? 'text-right flex-row-reverse' : 'text-left flex-row'}`}
                >
                  <div className={`flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Users className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{lang === 'ar' ? 'مزامنة رتب الديسكورد' : 'Sync Discord Roles'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lang === 'ar' ? 'استعادة رتب العملاء' : 'Restore customer roles'}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY PRODUCTS (Exact SpiritX Design - Screenshot 4) */}
        {activeTab === 'my-products' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  {lang === 'ar' ? 'منتجاتي' : 'My Products'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' ? 'المنتجات المفعلة بحسابك والمفاتيح والتحميلات المتاحة' : 'Your active products, keys, and downloads'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('redeem')}
                className={`py-2.5 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${lang === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <Key className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تفعيل مفتاح جديد' : 'Redeem New Key'}</span>
              </button>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-[#0f1115] border border-white/5 rounded-[20px] overflow-hidden flex flex-col p-5 space-y-4 animate-pulse">
                    <div className="h-44 bg-white/5 rounded-xl w-full" />
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-white/5 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-white/5 rounded w-3/4" />
                        <div className="h-3.5 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-white/5 rounded-xl w-full" />
                    <div className="h-14 bg-white/5 rounded-xl w-full" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-10 bg-white/5 rounded-xl" />
                      <div className="h-10 bg-white/5 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userProducts.length === 0 ? (
              <div className="bg-[#10121a] border border-white/10 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {lang === 'ar' ? 'لا توجد منتجات مفعلة بحسابك حالياً' : 'No active products in your account'}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {lang === 'ar' ? 'قم بتفعيل مفتاح الاشتراك الخاص بك للوصول الفوري للملفات والرتب' : 'Activate your license key to instantly access files and roles'}
                </p>
                <button
                  onClick={() => setActiveTab('redeem')}
                  className="py-3 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'تفعيل مفتاح الآن' : 'Redeem Key Now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProducts.map((up) => (
                  <div
                    key={up.id}
                    className="glass-card rounded-[24px] overflow-hidden group flex flex-col animate-slide-up hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Top Image Banner - Full Width */}
                    <div className="relative h-48 w-full bg-[#050505] overflow-hidden border-b border-white/[0.04]">
                      <img
                        src={up.product?.image || '/logo.png?v=6'}
                        alt={up.product?.name || 'Product'}
                        className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${!up.product?.image || up.product?.image === '/logo.png?v=6' ? 'object-contain p-8 opacity-60 group-hover:opacity-100' : 'object-cover'}`}
                        onError={(e) => { 
                          e.currentTarget.src = '/logo.png?v=6'; 
                          e.currentTarget.className = 'w-full h-full transition-transform duration-700 group-hover:scale-110 object-contain p-8 opacity-60 group-hover:opacity-100'; 
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                      
                      {/* Top Category Tag Pill */}
                      <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-primary uppercase tracking-wider shadow-lg`}>
                        {up.product?.category || 'SPOOFER'}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Title & Icon Row */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-extrabold text-white text-lg tracking-wide group-hover:text-primary transition-colors">{up.product?.name || 'Unknown Product'}</h3>
                        <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-slate-300">
                          {up.product?.version || 'v1.0'}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className={`flex items-center gap-3 mb-4 text-xs font-medium text-slate-400 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-brand-glow animate-pulse" />
                          <span className="text-primary text-[10px] font-bold">{lang === 'ar' ? 'فعال' : 'Active'}</span>
                        </div>
                        <span className="text-slate-700">•</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>{up.product?.downloadsCount || 1420} {lang === 'ar' ? 'مستخدم' : 'Users'}</span>
                        </div>
                      </div>

                      {/* Product Description */}
                      <div className="mb-5 flex-1">
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                          {up.product?.description || (lang === 'ar' ? 'لا يوجد وصف متاح لهذا المنتج حالياً.' : 'No description available for this product at the moment.')}
                        </p>
                      </div>

                      {/* License Key Box - Premium Redesign */}
                      <div className="mb-5 relative group/key">
                        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md opacity-0 group-hover/key:opacity-100 transition-opacity" />
                        <div className="bg-[#050505] border border-white/10 hover:border-primary/30 rounded-xl p-1.5 pl-4 flex items-center justify-between gap-3 relative transition-colors shadow-inner">
                          <div className="flex-1 overflow-hidden flex flex-col justify-center py-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{lang === 'ar' ? 'مفتاح الترخيص' : 'License Key'}</span>
                            <code dir="ltr" className="text-[13px] font-mono text-slate-200 tracking-widest font-bold truncate block w-full text-left">
                              {up.keyString || 'KEY-ACTIVATED-OK'}
                            </code>
                          </div>
                          <button
                            onClick={() => copyKeyToClipboard(up.keyString || 'KEY-ACTIVATED-OK', up.id)}
                            className={`p-3 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${copiedKeyId === up.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-transparent'}`}
                            title="Copy Key"
                          >
                            {copiedKeyId === up.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                          onClick={() => handleDownload(up.productId, up.product?.name || 'Product')}
                          className="py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-brand-glow transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                        >
                          <Download className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'تحميل البرنامج' : 'Download Loader'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setGuideModalProduct(up);
                            setGuideView('menu');
                          }}
                          className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                        >
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          <span>{lang === 'ar' ? 'الشروحات' : 'Guide'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REDEEM KEY */}
        {activeTab === 'redeem' && (
          <div className="space-y-8 max-w-xl mx-auto py-8 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-brand-glow">
                <Key className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-wide mb-2">
                {lang === 'ar' ? 'تفعيل مفتاح' : 'Redeem Key'}
              </h1>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'أدخل مفتاح الاشتراك الخاص بك لإضافته لحسابك فوراً' : 'Enter your license key to add it to your account instantly'}
              </p>
            </div>

            <div className="glass-card rounded-[24px] p-8 shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 group-hover:bg-primary/10 transition-colors duration-500" />
              <form onSubmit={handleRedeemKey} className="space-y-5 relative z-10">
                <div>
                  <label className={`block text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {lang === 'ar' ? 'مفتاح التفعيل (License Key)' : 'License Key'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="KEY-T3N-ABCD-1234-EFGH"
                    className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-mono tracking-widest text-center shadow-inner"
                  />
                </div>

                {redeemMessage && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${redeemMessage.type === 'success' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {redeemMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{redeemMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black text-sm rounded-xl transition-all shadow-brand-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
                >
                  {isRedeeming ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>{lang === 'ar' ? 'تفعيل المفتاح الآن' : 'Redeem Key Now'}</span>
                </button>
              </form>

              <div className="pt-6 border-t border-white/[0.04] space-y-4 relative z-10">
                <a
                  href="https://t3nnn.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl p-4 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">لا تملك مفتاح اشتراك؟</div>
                      <div className="text-xs text-slate-500 mt-0.5">احصل عليه الآن من متجرنا الرسمي بأسعار حصرية</div>
                    </div>
                  </div>
                  <div className="bg-primary text-white text-xs font-extrabold px-3 py-2 rounded-lg flex items-center gap-1 shadow-brand-glow shrink-0 group-hover:scale-105 transition-transform">
                    <span>شراء مفتاح</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>

                <a
                  href="https://discord.gg/t3n"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl p-4 flex items-center justify-between transition-all group mt-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">تحتاج إلى مساعدة؟</div>
                      <div className="text-xs text-slate-500 mt-0.5">تواصل مع فريق الدعم الفني عبر ديسكورد</div>
                    </div>
                  </div>
                  <div className="bg-white/10 text-white text-xs font-extrabold px-3 py-2 rounded-lg flex items-center gap-1 border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                    <span>الدعم الفني</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN PANEL (Categorized Dashboard with Sub-Tabs) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Admin Header */}
            <div className="bg-[#10121a] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-wide flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    {adminSectionTab === 'overview' && <Activity className="w-6 h-6 text-sky-400" />}
                    {adminSectionTab === 'products' && <Package className="w-6 h-6 text-indigo-400" />}
                    {adminSectionTab === 'customers' && <Users className="w-6 h-6 text-pink-400" />}
                    {adminSectionTab === 'keys' && <Key className="w-6 h-6 text-primary" />}
                    {adminSectionTab === 'logs' && <FileText className="w-6 h-6 text-orange-400" />}
                  </div>
                  <span>
                    {adminSectionTab === 'overview' && (lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Overview & Stats')}
                    {adminSectionTab === 'products' && (lang === 'ar' ? 'إدارة المنتجات والمخزون' : 'Products & Inventory')}
                    {adminSectionTab === 'customers' && (lang === 'ar' ? 'إدارة العملاء' : 'Customers Management')}
                    {adminSectionTab === 'keys' && (lang === 'ar' ? 'البحث في المفاتيح' : 'Keys Search')}
                    {adminSectionTab === 'logs' && (lang === 'ar' ? 'سجلات النظام' : 'System Logs')}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-2">
                  {adminSectionTab === 'overview' && 'إحصائيات شاملة ومباشرة لمنصة تعن الرقمية.'}
                  {adminSectionTab === 'products' && 'تحكم كامل في إعدادات المنتجات وإضافة المفاتيح اليدوية.'}
                  {adminSectionTab === 'customers' && 'استعراض بيانات العملاء، حظر، ومراجعة أنشطتهم.'}
                  {adminSectionTab === 'keys' && 'تتبع سريع للمفاتيح المباعة والمتاحة في النظام.'}
                  {adminSectionTab === 'logs' && 'مراقبة حية لجميع حركات دخول وخروج واستخدام الموقع.'}
                </p>
              </div>

              {adminStats && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>{adminStats.unusedKeys} مفتاح متاح</span>
                  </span>
                  <span className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl font-bold">
                    {adminStats.totalUsers} عميل مسجل
                  </span>
                </div>
              )}
            </div>

            {/* ==================== SUB-TAB 1: PRODUCTS & INVENTORY ==================== */}
            {adminSectionTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-sky-400" />
                    <span>منتجات المتجر والمخزون المتاح</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">انقر على أي منتج لفتحه وتعديله وت عبئة مفاتيحه</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="glass-card rounded-[24px] overflow-hidden hover:border-primary/40 transition-all duration-300 flex flex-col group"
                    >
                      {/* Top Image Banner - Full Width */}
                      <div className="relative h-48 w-full bg-[#050505] overflow-hidden border-b border-white/[0.04]">
                        <img
                          src={product.image || '/logo.png?v=6'}
                          alt={product.name}
                          className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${!product.image || product.image === '/logo.png?v=6' ? 'object-contain p-8 opacity-60 group-hover:opacity-100' : 'object-cover'}`}
                          onError={(e) => { 
                            e.currentTarget.src = '/logo.png?v=6'; 
                            e.currentTarget.className = 'w-full h-full transition-transform duration-700 group-hover:scale-110 object-contain p-8 opacity-60 group-hover:opacity-100'; 
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                        
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-primary/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">المخزون المتاح:</span>
                          <span className="text-xs font-black text-primary">{product.stockKeysCount || 0}</span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex-1 flex flex-col">
                        {/* Title & Icon Row */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-brand-glow">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-white text-lg leading-tight tracking-wide group-hover:text-primary transition-colors">{product.name}</h3>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{product.version}</span>
                              <span className="text-slate-600">·</span>
                              <span className="font-bold text-slate-300">{product.category}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-6 flex-1">
                          {product.description}
                        </p>

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <button
                            onClick={() => openInventoryModal(product, 'codes', true)}
                            className="py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-brand-glow transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                          >
                            <Key className="w-4 h-4" />
                            <span>إضافة مفاتيح</span>
                          </button>

                          <button
                            onClick={() => openInventoryModal(product, 'data', false)}
                            className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                          >
                            <Edit3 className="w-4 h-4 text-slate-400" />
                            <span>تعديل المنتج</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB 2: CUSTOMERS MANAGEMENT ==================== */}
            {adminSectionTab === 'customers' && (
              <div className="space-y-4 animate-slide-up">
                <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span>قائمة العملاء وإدارة الاشتراكات</span>
                    </h3>

                    {/* Search Bar for Customers */}
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute right-4 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchCustomerQuery}
                        onChange={(e) => setSearchCustomerQuery(e.target.value)}
                        placeholder="ابحث باسم العميل أو إيميله أو Discord ID..."
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 rounded-xl pr-11 pl-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-slate-400 font-bold">
                          <th className="pb-3.5 pr-2">العميل</th>
                          <th className="pb-3.5">البريد / Discord</th>
                          <th className="pb-3.5">الرتبة</th>
                          <th className="pb-3.5">عنوان IP</th>
                          <th className="pb-3.5">الإجراءات والاشتراكات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {allCustomersList
                          .filter(
                            (u) =>
                              !searchCustomerQuery ||
                              u.name?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                              u.email?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                              u.discordId?.includes(searchCustomerQuery)
                          )
                          .map((customer) => (
                            <tr key={customer.id} className="text-slate-300 hover:bg-white/[0.03] transition-colors duration-150">
                              <td className="py-3.5 pr-2 font-bold text-white flex items-center gap-2">
                                <img
                                  src={customer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                  alt={customer.name}
                                  className="w-8 h-8 rounded-full border border-white/10"
                                  onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                                />
                                <div>
                                  <div className="font-extrabold">{customer.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">ID: {customer.id}</div>
                                </div>
                              </td>
                              <td className="py-3.5 text-slate-300">
                                <div className="font-medium">{customer.email || 'لا يوجد إيميل'}</div>
                                <div className="text-[10px] text-primary font-mono">Discord: {customer.discordId}</div>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${customer.role === 'Boss' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                                  {customer.role}
                                </span>
                              </td>
                              <td className="py-3.5 font-mono text-[11px] text-slate-400">{customer.lastIp || '127.0.0.1'}</td>
                              <td className="py-3.5 space-y-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedAdminCustomer(customer)}
                                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-[10px] font-black text-primary transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                                    title="عرض تفاصيل العميل وإدارة اشتراكاته ومفاتيحه"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>إدارة العميل</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUserAccount(customer.id, customer.name)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors cursor-pointer hover:scale-[1.02]"
                                    title="حذف العميل نهائياً"
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
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      <span>البحث الشامل وتفتيش المفاتيح في النظام</span>
                    </h3>

                    {/* Key Search Input */}
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute right-4 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchKeysQuery}
                        onChange={(e) => setSearchKeysQuery(e.target.value)}
                        placeholder="ابحث بكود المفتاح (e.g. T3N-FORT...)..."
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 rounded-xl pr-11 pl-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setKeyStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'all' ? 'bg-primary text-white font-extrabold shadow-brand-glow' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      الكل ({allKeysList.length})
                    </button>
                    <button
                      onClick={() => setKeyStatusFilter('unused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'unused' ? 'bg-primary text-white font-extrabold shadow-brand-glow' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      متاح فقط ({allKeysList.filter((k) => !k.isUsed).length})
                    </button>
                    <button
                      onClick={() => setKeyStatusFilter('used')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${keyStatusFilter === 'used' ? 'bg-primary text-white font-extrabold shadow-brand-glow' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      مستعمل ({allKeysList.filter((k) => k.isUsed).length})
                    </button>
                  </div>

                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-right text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-slate-400 font-sans font-bold">
                          <th className="pb-3.5 pr-2">الكود (Key)</th>
                          <th className="pb-3.5">المنتج المرتبط</th>
                          <th className="pb-3.5">الحالة</th>
                          <th className="pb-3.5">المستخدم</th>
                          <th className="pb-3.5">تاريخ الإنشاء</th>
                          <th className="pb-3.5 text-left pl-2">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {allKeysList
                          .filter((k) => {
                            if (keyStatusFilter === 'unused' && k.isUsed) return false;
                            if (keyStatusFilter === 'used' && !k.isUsed) return false;
                            if (!searchKeysQuery) return true;
                            return k.key.toLowerCase().includes(searchKeysQuery.toLowerCase());
                          })
                          .map((keyObj) => (
                            <tr key={keyObj.id} className="text-slate-300 hover:bg-white/[0.03] transition-colors duration-150">
                              <td className="py-3.5 pr-2 font-bold text-primary select-all">{keyObj.key}</td>
                              <td className="py-3.5 font-sans text-white font-semibold">
                                {products.find((p) => p.id === keyObj.productId)?.name || keyObj.productId}
                              </td>
                              <td className="py-3.5 font-sans">
                                {keyObj.isUsed ? (
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-bold">
                                    مستعمل
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold">
                                    متاح
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 font-sans text-primary font-semibold text-xs">
                                {keyObj.isUsed ? (
                                  allCustomersList.find((u: any) => u.id === keyObj.usedByUserId)?.name || 
                                  allCustomersList.find((u: any) => u.id === keyObj.usedByUserId)?.discordId || 
                                  'مستخدم غير معروف'
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3.5 text-slate-400 text-[11px]">
                                {new Date(keyObj.createdAt).toLocaleDateString('ar-SA')}
                              </td>
                              <td className="py-3.5 font-sans flex items-center justify-end gap-2 pl-2">
                                {keyObj.isUsed && (
                                  <button
                                    onClick={() => handleRevokeAndBan(keyObj.usedByUserId, keyObj.id)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    title="حظر المستخدم وإلغاء المفتاح"
                                  >
                                    إلغاء وحظر
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteKey(keyObj.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-bold text-rose-400 transition-all cursor-pointer hover:scale-105"
                                >
                                  حذف
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
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>سجلات الأمان والنشاط المباشرة (System Audit Logs)</span>
                </h3>

                <div className="overflow-x-auto scrollbar-none">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold">
                        <th className="pb-4">الحدث</th>
                        <th className="pb-4">التفاصيل</th>
                        <th className="pb-4">المستخدم / Discord</th>
                        <th className="pb-4">عنوان IP</th>
                        <th className="pb-4">التوقيت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {adminLogs.map((log) => (
                        <tr key={log.id} className="text-slate-300 hover:bg-white/5 transition-colors duration-200">
                          <td className="py-4 font-bold text-white">{log.action}</td>
                          <td className="py-4 max-w-xs truncate">{log.details}</td>
                          <td className="py-4 text-primary font-semibold">{log.userName || log.discordId || 'زائر'}</td>
                          <td className="py-4 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                          <td className="py-4 text-slate-400">{new Date(log.createdAt).toLocaleTimeString('ar-SA')}</td>
                        </tr>
                      ))}
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
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">إجمالي العملاء</div>
                        <div className="text-3xl font-black text-white">{adminStats.totalUsers}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">المفاتيح المتاحة</div>
                        <div className="text-3xl font-black text-primary">{adminStats.unusedKeys}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                        <Key className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">المنتجات النشطة</div>
                        <div className="text-3xl font-black text-white">{adminStats.activeProducts}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[20px] p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">إجمالي التحميلات</div>
                        <div className="text-3xl font-black text-white">{adminStats.totalDownloads}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Row: Recent Activity & Quick Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {/* Recent Logs Summary */}
                  <div className="glass-card rounded-[24px] p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <h3 className="font-extrabold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        آخر الأنشطة في المنصة
                      </h3>
                      <button onClick={() => setAdminSectionTab('logs')} className="text-[11px] text-primary hover:text-primary-hover font-bold transition-colors uppercase tracking-wider">
                        عرض الكل &rarr;
                      </button>
                    </div>
                    <div className="space-y-3">
                      {adminLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            <UserCheck className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-200 truncate">{log.action}</div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">{log.details}</div>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono shrink-0 bg-black/40 px-2 py-1 rounded-md">
                            {new Date(log.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                      {adminLogs.length === 0 && (
                        <div className="text-center text-sm text-slate-500 py-6">لا توجد أنشطة مسجلة مؤخراً</div>
                      )}
                    </div>
                  </div>

                  {/* Quick System Status */}
                  <div className="glass-card rounded-[24px] p-6 space-y-6">
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="font-extrabold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        حالة النظام والإشعارات
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl group hover:bg-primary/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-brand-glow">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-primary">النظام يعمل بكفاءة</div>
                            <div className="text-xs text-slate-300 mt-1">لا توجد مشاكل حالية في الخوادم.</div>
                          </div>
                        </div>
                      </div>

                      {adminStats.unusedKeys < 5 && (
                        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl group hover:bg-amber-500/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <HelpCircle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-amber-400 font-sans">تنبيه: انخفاض المخزون</div>
                              <div className="text-xs text-slate-300 mt-1">بعض المنتجات على وشك النفاد من المفاتيح.</div>
                            </div>
                          </div>
                          <button onClick={() => setAdminSectionTab('products')} className="px-4 py-2 bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition-all hover:scale-105">
                            إدارة المخزون
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
      </main>

      {/* ====================================================================
          INVENTORY MODAL (Exact Design from User Screenshot)
          Shows: بيانات المنتج | الحقول المخصصة | الأكواد المتاحة
          Each key as a card with delete button
         ==================================================================== */}
      {inventoryModalOpen && inventoryProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-[24px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/10">
            {/* Modal Header (Premium Style) */}
            <div className="flex items-center justify-between px-6 py-5 bg-black/40 border-b border-white/10 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -z-10" />
              <button
                onClick={() => setInventoryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-extrabold text-white text-right flex-1 pr-3 z-10">
                إدارة <span className="text-primary">{inventoryProduct.name}</span>
              </h2>
            </div>

            {/* Tabs Row */}
            <div className="flex bg-black/20 border-b border-white/10 shrink-0 p-4 gap-2">
              <button
                onClick={() => setInventoryTab('codes')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'codes' ? 'bg-primary text-white shadow-brand-glow' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'}`}
              >
                <span>الأكواد المتاحة</span>
                <Key className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => setInventoryTab('custom')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'custom' ? 'bg-primary text-white shadow-brand-glow' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'}`}
              >
                <span>الحقول المخصصة</span>
                <Layers className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => setInventoryTab('data')}
                className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all rounded-xl cursor-pointer hover:-translate-y-0.5 ${inventoryTab === 'data' ? 'bg-primary text-white shadow-brand-glow' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'}`}
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
                    <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl font-bold flex items-center justify-between">
                      <span>{productSaveMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">اسم المنتج</label>
                    <input
                      type="text"
                      value={editProductData.name}
                      onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-bold shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">صورة المنتج (رابط مسار الصورة)</label>
                    <input
                      type="text"
                      value={editProductData.image}
                      onChange={(e) => setEditProductData({ ...editProductData, image: e.target.value })}
                      placeholder="/products/fortnite-unban.png"
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">الوصف الشامل للمنتج</label>
                    <textarea
                      rows={3}
                      value={editProductData.description}
                      onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl p-4 text-xs text-white focus:outline-none transition-all leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">الإصدار (Version)</label>
                      <input
                        type="text"
                        value={editProductData.version}
                        onChange={(e) => setEditProductData({ ...editProductData, version: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">حجم الملف (File Size)</label>
                      <input
                        type="text"
                        value={editProductData.fileSize}
                        onChange={(e) => setEditProductData({ ...editProductData, fileSize: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">التصنيف (Category)</label>
                      <input
                        type="text"
                        value={editProductData.category}
                        onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">عدد التحميلات</label>
                      <input
                        type="number"
                        value={editProductData.downloadsCount}
                        onChange={(e) => setEditProductData({ ...editProductData, downloadsCount: Number(e.target.value) })}
                        className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-brand-glow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>حفظ تغييرات المنتج</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: الحقول المخصصة (Editable) */}
              {inventoryTab === 'custom' && (
                <div className="space-y-5 animate-slide-up">
                  {productSaveMessage && (
                    <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl font-bold flex items-center justify-between">
                      <span>{productSaveMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">رابط الشرح / فيديو (YouTube / Stream)</label>
                    <input
                      type="text"
                      value={editProductData.videoUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, videoUrl: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none transition-all shadow-inner"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">رابط دليل الاستخدام (Discord / Docs)</label>
                    <input
                      type="text"
                      value={editProductData.guideUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, guideUrl: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none transition-all shadow-inner"
                      placeholder="https://discord.gg/t3n"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">رابط تحميل الملف (File Download URL)</label>
                    <input
                      type="text"
                      value={editProductData.fileUrl}
                      onChange={(e) => setEditProductData({ ...editProductData, fileUrl: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none transition-all shadow-inner"
                      placeholder="/uploads/spoofer.exe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">لون البطاقة (Theme Accent)</label>
                    <select
                      value={editProductData.cardColor}
                      onChange={(e) => setEditProductData({ ...editProductData, cardColor: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all cursor-pointer font-bold shadow-inner"
                    >
                      <option value="blue" className="bg-[#050505] text-white">أزرق سماوي (Blue Glow)</option>
                      <option value="cyan" className="bg-[#050505] text-white">سيان فائق (Cyan Neon)</option>
                      <option value="purple" className="bg-[#050505] text-white">بنفسجي تبيان (Purple Spirit)</option>
                      <option value="gold" className="bg-[#050505] text-white">ذهبي فاخر (Gold Edition)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <button
                      onClick={handleSaveProductChanges}
                      disabled={isSavingProduct}
                      className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-xl shadow-brand-glow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isSavingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>حفظ تغييرات الحقول</span>
                    </button>

                    <button
                      onClick={handleDeleteProductPermanently}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف المنتج نهائياً من النظام</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: الأكواد المتاحة (Premium T3N Style) */}
              {inventoryTab === 'codes' && (
                <div className="space-y-5 animate-slide-up">
                  
                  {keyActionMessage && (
                    <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl font-bold flex items-center justify-between shadow-brand-glow">
                      <span>{keyActionMessage}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Premium Info Box */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-brand-glow"></div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 shadow-brand-glow">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-sm font-extrabold text-white mb-1">إدارة المخزون الذكية</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          يمكنك إضافة آلاف المفاتيح دفعة واحدة بدون أي تأخير. النظام سيقوم بمعالجتها في الخلفية.
                        </p>
                      </div>
                    </div>
                    {!bulkAddOpen && (
                      <button 
                        onClick={() => setBulkAddOpen(true)}
                        className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer mt-2"
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
                        className="glass-card rounded-xl p-5 space-y-4 shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3">
                          <button onClick={() => setBulkAddOpen(false)} className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center pr-2">
                          <span className="text-xs text-primary font-bold tracking-widest uppercase">Batch Keys</span>
                          {bulkKeysText.trim() && (
                            <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-lg">
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
                            className={`w-full bg-[#050505] rounded-xl p-4 text-sm font-mono placeholder:text-slate-600 focus:outline-none transition-all resize-y min-h-[120px] shadow-inner ${isAddingKeys ? 'border border-primary shadow-brand-glow text-primary/90' : 'border border-white/10 focus:border-primary/50 text-slate-300'}`}
                            style={{ lineHeight: '1.8' }}
                            dir="ltr"
                          />
                        </div>

                        {bulkMessage && (
                          <div className="p-3 bg-primary/10 text-primary text-xs rounded-xl font-bold text-center border border-primary/20 shadow-brand-glow">
                            {bulkMessage}
                          </div>
                        )}

                        <button
                          onClick={handleBulkAddKeys}
                          disabled={isAddingKeys || !bulkKeysText.trim()}
                          className={`w-full py-4 font-bold text-sm rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 ${bulkKeysText.trim() ? 'bg-primary hover:bg-primary-hover text-white shadow-brand-glow hover:-translate-y-0.5' : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'}`}
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
                      <h4 className="text-sm font-bold text-white">المفاتيح الحالية</h4>
                      <div className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full shadow-brand-glow">
                        {inventoryKeys.length} مفتاح
                      </div>
                    </div>

                    {isLoadingKeys ? (
                      <div className="flex flex-col items-center justify-center py-12 border border-white/10 border-dashed rounded-xl bg-black/20">
                        <RefreshCw className="w-6 h-6 animate-spin mb-3 text-primary" />
                        <span className="text-xs font-bold text-slate-400">جارٍ جلب المفاتيح بسرعة...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inventoryKeys.map((keyItem) => (
                          <div key={keyItem.id} className="group bg-black/40 hover:bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl overflow-hidden flex items-center justify-between p-4 gap-4 transition-all shadow-md">
                            <div className="flex-1 text-sm text-slate-300 font-mono break-all text-left select-all group-hover:text-white transition-colors" dir="ltr">
                              {keyItem.key}
                            </div>
                            <button
                              onClick={() => handleDeleteKey(keyItem.id)}
                              className="shrink-0 p-2.5 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                              title="حذف المفتاح"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {inventoryKeys.length === 0 && !bulkAddOpen && !singleAddOpen && (
                          <div className="text-center py-10 border border-white/10 border-dashed rounded-xl bg-black/20">
                            <Key className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
                            <p className="text-xs text-slate-500 font-bold">لا توجد مفاتيح في المخزون حالياً</p>
                          </div>
                        )}

                        {/* Single Add Key Block */}
                        <AnimatePresence>
                          {singleAddOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="glass-card border border-primary/30 rounded-xl p-3 flex flex-col sm:flex-row gap-3 shadow-lg"
                            >
                              <input
                                type="text"
                                value={singleKeyText}
                                onChange={(e) => setSingleKeyText(e.target.value)}
                                placeholder="أدخل المفتاح هنا..."
                                className="flex-1 bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-primary/50 text-left transition-all shadow-inner"
                                dir="ltr"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleAddSingleKey}
                                  disabled={!singleKeyText.trim()}
                                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-black text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-brand-glow"
                                >
                                  إضافة
                                </button>
                                <button
                                  onClick={() => setSingleAddOpen(false)}
                                  className="px-5 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-400 font-bold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap"
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
                            className="w-full py-4 flex items-center justify-center gap-2 bg-black/20 border border-white/10 border-dashed hover:border-primary/50 hover:bg-primary/5 rounded-xl text-slate-400 hover:text-primary transition-all cursor-pointer mt-3"
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
            
            <div className="p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3">
              <button
                onClick={() => setInventoryProduct(null)}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer hover:-translate-y-0.5"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveProductChanges}
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-black text-sm rounded-xl shadow-brand-glow transition-all cursor-pointer hover:-translate-y-0.5"
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
    </div>
  );
}
