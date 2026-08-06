import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth.tsx';
import { apiFetch, getAuthToken } from '../api.ts';
import { ActivatedProduct, User } from '../types.ts';
import { SupportChatWidget } from '../components/SupportChatWidget.tsx';
import { 
  Shield, 
  Key, 
  Download, 
  User as UserIcon, 
  CheckCircle2, 
  FileText, 
  RefreshCw, 
  Copy, 
  LogOut, 
  Activity, 
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  AlertCircle
} from 'lucide-react';

import { ToastContainer, ToastMessage } from '../components/Toast.tsx';

export const DashboardPage: React.FC<{ onNavigateToActivate: () => void }> = ({ onNavigateToActivate }) => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<ActivatedProduct[]>([]);
  const [account, setAccount] = useState<User | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'overview' | 'activate' | 'profile' | 'rules'>('overview');
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  
  // Action States
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProductGuide, setSelectedProductGuide] = useState<ActivatedProduct | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Activation Tab States
  const [keyInput, setKeyInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccessInfo, setRedeemSuccessInfo] = useState<{ productName: string; message: string } | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/user/dashboard');
      if (res && res.success) {
        setProducts(res.products || []);
        setAccount(res.account || null);
        setLogs(res.logs || []);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      setDownloadingId(fileId);
      addToast({ type: 'info', title: 'جاري التحميل...', message: `جاري بدء تنزيل ${filename}` });
      const token = getAuthToken();
      
      const response = await fetch(`/api/files/download/${fileId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'فشل تحميل الملف');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({ type: 'success', title: 'تم التحميل بنجاح', message: `تم حفظ ${filename} على جهازك.` });
      // Refresh to update download logs
      fetchDashboard();
    } catch (err: any) {
      addToast({ type: 'error', title: 'فشل التحميل', message: err.message || 'حدث خطأ أثناء تحميل الملف' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadLoader = async (prod: ActivatedProduct) => {
    if (!prod.files || prod.files.length === 0) {
      addToast({ type: 'warning', title: 'لا توجد ملفات متوفرة', message: 'لم يتم العثور على ملفات لهذا المنتج حالياً. تواصل مع الدعم الفني.' });
      return;
    }
    const loaderFile = prod.files[0];
    handleDownloadFile(loaderFile.id, loaderFile.filename);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccessInfo(null);
    try {
      const res = await apiFetch('/user/redeem', {
        method: 'POST',
        body: { key: keyInput.trim() }
      });
      if (res && res.success) {
        setRedeemSuccessInfo({
          productName: res.productName || 'المنتج الجديد',
          message: res.message || 'تمت إضافة الترخيص لحسابك بنجاح. يمكنك الآن تحميله من قائمة المنتجات.'
        });
        setKeyInput('');
        fetchDashboard();
      } else {
        setRedeemError(res.error || 'كود التفعيل غير صالح أو مستخدم من قبل.');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-[600px] rounded-[30px] overflow-hidden border border-gray-800 bg-[#07090e] animate-pulse">
        <div className="w-full lg:w-64 bg-[#0a0d14] border-l border-gray-900 p-6 space-y-6 shrink-0" />
        <div className="flex-1 p-8 space-y-6">
          <div className="h-16 bg-gray-900/60 rounded-2xl border border-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-72 bg-gray-900/60 rounded-3xl border border-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[750px] rounded-[30px] overflow-hidden border border-gray-800/80 bg-[#07090e] shadow-2xl relative z-15" dir="rtl">
      
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="w-full lg:w-64 bg-[#0a0d14] border-l border-gray-900/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-900/60 select-none">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-[#3B82F6] rounded-xl blur-sm opacity-60"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-sky-950 flex items-center justify-center text-white border border-sky-500/30">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-lg text-white tracking-tight leading-none">تـعـن | T3N</h2>
              <span className="text-[9px] text-sky-400 font-extrabold tracking-wider uppercase mt-1 block font-sans">بوابة العميل</span>
            </div>
          </div>

          {/* Navigation Links by Category */}
          <nav className="p-4 space-y-6">
            {/* General */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-gray-500 tracking-wider uppercase block mb-2 font-sans">عام</span>
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'overview'
                    ? 'bg-white text-gray-950 font-black shadow-lg shadow-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-sky-400" />
                <span>الرئيسية</span>
              </button>
            </div>

            {/* License */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-gray-500 tracking-wider uppercase block mb-2 font-sans">التراخيص</span>
              <button
                onClick={() => setActiveSubTab('products')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'products'
                    ? 'bg-white text-gray-950 font-black shadow-lg shadow-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-sky-400" />
                <span>منتجاتي</span>
              </button>
              
              <button
                onClick={() => setActiveSubTab('activate')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'activate'
                    ? 'bg-white text-gray-950 font-black shadow-lg shadow-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <Key className="w-4 h-4 shrink-0 text-sky-400" />
                <span>تفعيل مفتاح</span>
              </button>
            </div>

            {/* Account */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-gray-500 tracking-wider uppercase block mb-2 font-sans">الحساب</span>
              <button
                onClick={() => setActiveSubTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'profile'
                    ? 'bg-white text-gray-950 font-black shadow-lg shadow-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0 text-sky-400" />
                <span>الملف الشخصي</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-gray-900/60 bg-[#090b10]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-950/50 border border-gray-900 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center overflow-hidden border border-sky-400/20 shrink-0">
              {account?.avatar ? (
                <img src={account.avatar} alt={account.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-xs font-black text-white truncate flex items-center gap-1">
                <span>{account?.name || user?.name}</span>
                <span className="text-[8px] bg-[#3B82F6]/10 text-sky-400 px-1 py-0.2 rounded border border-[#3B82F6]/20 font-sans">Client</span>
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5 font-sans">{account?.email || user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ─── RIGHT CONTENT AREA ─── */}
      <main className="flex-1 p-6 md:p-8 mesh-grid flex flex-col justify-between bg-[#07090e]">
        
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-5">
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                {activeSubTab === 'products' && (
                  <>
                    <Shield className="w-6 h-6 text-sky-400" />
                    <span>المنتجات</span>
                  </>
                )}
                {activeSubTab === 'overview' && (
                  <>
                    <LayoutDashboard className="w-6 h-6 text-sky-400" />
                    <span>الرئيسية</span>
                  </>
                )}
                {activeSubTab === 'activate' && (
                  <>
                    <Key className="w-6 h-6 text-sky-400" />
                    <span>تفعيل رخصة جديدة</span>
                  </>
                )}
                {activeSubTab === 'profile' && (
                  <>
                    <UserIcon className="w-6 h-6 text-sky-400" />
                    <span>الملف الشخصي</span>
                  </>
                )}
                {activeSubTab === 'rules' && (
                  <>
                    <FileText className="w-6 h-6 text-sky-400" />
                    <span>قوانين وشروط متجر تـعـن</span>
                  </>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-10 h-10 rounded-xl bg-[#090d14] hover:bg-gray-800/80 text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition-all cursor-pointer"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setActiveSubTab('activate')}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/10 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>تفعيل منتج</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            {activeSubTab === 'overview' && (
              <div className="space-y-6 text-right">
                {/* Welcome Card / Banner */}
                <div className="p-8 rounded-[30px] bg-gradient-to-tr from-sky-950/40 via-[#0a0d14] to-blue-950/20 border border-gray-800/80 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 max-w-xl">
                      <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-[10px] text-sky-400 font-extrabold uppercase tracking-wider font-sans">
                        <Activity className="w-3.5 h-3.5" />
                        <span>لوحة التحكم الرسمية</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        مرحباً بك في <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-400 to-blue-500">تـعـن</span>
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        منصتك المتكاملة لتفعيل وإدارة المنتجات والخدمات الرقمية وحماية هويتك العتادية بأعلى مستويات الأمان والدعم السريع.
                      </p>
                    </div>

                    <div className="shrink-0 relative w-20 h-20">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-3xl blur-md opacity-60 animate-pulse" />
                      <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-gray-950 via-sky-950 to-blue-950 flex items-center justify-center border border-sky-400/30">
                        <img src="/logo.png" alt="تعن" className="w-full h-full object-contain p-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Stat 1 */}
                  <div className="p-6 rounded-2xl bg-[#0a0d14]/80 border border-gray-800/80 flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block font-bold">المنتجات المفعلة</span>
                      <span className="text-xl font-black text-white mt-1 block">{products.length} منتج</span>
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="p-6 rounded-2xl bg-[#0a0d14]/80 border border-gray-800/80 flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block font-bold">حالة التراخيص</span>
                      <span className="text-xl font-black text-emerald-400 mt-1 block">مؤمنة وسليمة</span>
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="p-6 rounded-2xl bg-[#0a0d14]/80 border border-gray-800/80 flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block font-bold">خوادم الأمان</span>
                      <span className="text-xl font-black text-sky-400 mt-1 block">متصلة 100%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions / Shortcuts */}
                <div className="p-6 rounded-2xl bg-[#0a0d14]/80 border border-gray-800/80 space-y-4">
                  <h3 className="text-sm font-black text-white border-b border-gray-900 pb-3 flex items-center gap-2">
                    <LayoutDashboard className="w-4.5 h-4.5 text-sky-400" />
                    <span>إجراءات سريعة</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveSubTab('products')}
                      className="p-4 rounded-xl bg-gray-950/40 hover:bg-gray-950 border border-gray-900 hover:border-sky-500/20 text-right space-y-1.5 transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-black text-white group-hover:text-sky-400 transition-colors block">تصفح منتجاتي المفعّلة</span>
                      <span className="text-[10px] text-gray-500 block">إظهار كافة التراخيص والبرامج المتاحة للتنزيل</span>
                    </button>

                    <button
                      onClick={() => setActiveSubTab('activate')}
                      className="p-4 rounded-xl bg-gray-950/40 hover:bg-gray-950 border border-gray-900 hover:border-sky-500/20 text-right space-y-1.5 transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-black text-white group-hover:text-sky-400 transition-colors block">تفعيل كود ترخيص جديد</span>
                      <span className="text-[10px] text-gray-500 block">أدخل كود تفعيل منتج جديد للحصول عليه مباشرة</span>
                    </button>

                    <button
                      onClick={() => setActiveSubTab('profile')}
                      className="p-4 rounded-xl bg-gray-950/40 hover:bg-gray-950 border border-gray-900 hover:border-sky-500/20 text-right space-y-1.5 transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-black text-white group-hover:text-sky-400 transition-colors block">بيانات الحساب والنشاط</span>
                      <span className="text-[10px] text-gray-500 block">عرض الملف الشخصي وتفاصيل الحساب وتواريخ التسجيل</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'products' && (
              <>
                {products.length === 0 ? (
                  <div className="p-16 rounded-3xl bg-gray-900/20 border border-gray-800/80 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-950/80 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                      <Key className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-white text-base">لا توجد منتجات نشطة حالياً</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                        لم تقم بتفعيل أي منتجات أو تراخيص رقمية بعد. أدخل كود الترخيص في صفحة التفعيل.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('activate')}
                      className="bg-white hover:bg-gray-100 text-gray-950 font-black px-6 py-3 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      تفعيل منتجك الأول الآن
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((prod) => (
                      <motion.div
                        key={prod.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0d14]/40 border border-gray-800/80 hover:border-sky-500/25 rounded-[24px] p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px] transition-all duration-300 group"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-[40px] pointer-events-none" />
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-900 pb-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                                <Shield className="w-5 h-5" />
                              </div>
                              <div className="text-right">
                                <h3 className="font-black text-white text-sm">{prod.name}</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">منتج تعن</p>
                              </div>
                            </div>
                            
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider font-sans ${
                              prod.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {prod.status === 'active' ? 'نشط' : 'منتهي'}
                            </span>
                          </div>

                          <div className="space-y-3 relative z-10 font-sans">
                            <div className="bg-gray-950/80 border border-gray-900 rounded-xl p-3.5 flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-gray-500 tracking-wider block uppercase mb-1">مفتاح الترخيص</span>
                                <code className="text-xs text-gray-300 font-mono tracking-wide block truncate">{prod.key_value || 'KEY-NOT-FOUND'}</code>
                              </div>
                              <button
                                onClick={() => copyToClipboard(prod.key_value || '', prod.id)}
                                className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-gray-800/80"
                                title="نسخ المفتاح"
                              >
                                {copiedKey === prod.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-right">
                              <div className="bg-gray-950/30 border border-gray-900/50 p-2.5 rounded-xl">
                                <span className="text-[8px] font-bold text-gray-500 block">حالة الترخيص</span>
                                <span className="text-[10px] font-bold text-emerald-400 mt-0.5 block truncate">
                                  مفعل ونشط
                                </span>
                              </div>
                              <div className="bg-gray-950/30 border border-gray-900/50 p-2.5 rounded-xl">
                                <span className="text-[8px] font-bold text-gray-500 block">الصلاحية والانتهاء</span>
                                <span className="text-[10px] font-bold text-gray-300 mt-0.5 block truncate">
                                  {prod.expires_at ? new Date(prod.expires_at).toLocaleDateString('en-US') : 'مدى الحياة'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 relative z-10 font-sans">
                            <button
                              onClick={() => handleDownloadLoader(prod)}
                              disabled={downloadingId !== null || !prod.files || prod.files.length === 0}
                              className="w-full bg-white hover:bg-gray-100 text-gray-950 font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                              {downloadingId ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span>تحميل البرنامج</span>
                            </button>

                            <button
                              onClick={() => setSelectedProductGuide(prod)}
                              className="w-full bg-[#111622]/40 hover:bg-[#111622] text-gray-300 hover:text-white border border-gray-800 py-2.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                              <span>شروحات الاستخدام</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSubTab === 'activate' && (
              <div className="space-y-6 max-w-2xl mx-auto pt-6">
                <div className="p-8 rounded-[24px] bg-[#0a0d14]/80 border border-gray-800/80 shadow-2xl relative overflow-hidden text-right">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">تفعيل كود ترخيص رقمي</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">أدخل كود المنتج المكون من مفتاح ترخيص للحصول عليه فوراً</p>
                      </div>
                    </div>

                    <form onSubmit={handleRedeem} className="space-y-4 font-sans">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 tracking-wider block uppercase">كود التفعيل الخاص بك</label>
                        <input
                          type="text"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder="مثال: T3N-XXXXX-XXXXX-XXXXX"
                          className="w-full bg-gray-950/80 border border-gray-900 focus:border-sky-500/60 text-white placeholder-gray-600 font-mono text-sm px-4 py-3.5 rounded-xl outline-none transition-all text-left"
                          required
                        />
                      </div>

                      {redeemError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{redeemError}</span>
                        </div>
                      )}

                      {redeemSuccessInfo && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                          <p className="font-bold flex items-center gap-2 text-white">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>تم تفعيل: {redeemSuccessInfo.productName}</span>
                          </p>
                          <p className="text-gray-400 mt-1">{redeemSuccessInfo.message}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={redeemLoading || !keyInput.trim()}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {redeemLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        <span>تفعيل وتنزيل البرنامج</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'profile' && (
              <div className="space-y-6 max-w-md mx-auto pt-6 text-right">
                <div className="p-6 rounded-2xl bg-[#0a0d14]/80 border border-gray-800/80 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-gray-900 pb-3">
                    <UserIcon className="w-4.5 h-4.5 text-sky-400" />
                    <span>بيانات العميل الحالية</span>
                  </h3>
                  
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-900/40">
                      <span className="text-gray-500">اسم المستخدم</span>
                      <span className="text-white font-bold">{account?.name || user?.name || 'غير معروف'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-900/40">
                      <span className="text-gray-500">البريد الإلكتروني</span>
                      <span className="text-white font-mono">{account?.email || user?.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-900/40">
                      <span className="text-gray-500">تاريخ التسجيل</span>
                      <span className="text-white">{account?.created_at ? new Date(account.created_at).toLocaleDateString('en-US') : 'Jul 2026'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'rules' && (
              <div className="space-y-6 max-w-4xl mx-auto pt-4 text-right">
                <div className="p-6 md:p-8 rounded-[24px] bg-[#0a0d14] border border-gray-800/80 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">اتفاقية شروط وقوانين متجر تـعـن</h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">يرجى قراءة القوانين التالية بعناية للالتزام بها وتفادي تعليق الحساب</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Rule 1 */}
                      <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-900/60 hover:border-sky-500/15 transition-all duration-300 space-y-2 group/r">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover/r:scale-125 transition-transform" />
                          <h4 className="text-xs font-black text-white">1. سياسة استخدام مفاتيح التفعيل</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed pr-3.5">
                          جميع المفاتيح الرقمية المباعة مخصصة للاستخدام الشخصي فقط على جهاز واحد (ما لم يذكر خلاف ذلك). يمنع مشاركة المفاتيح أو نشرها؛ حيث يقوم نظام الحماية بإلغاء التفعيل فوراً وتلقائياً في حال اكتشاف مشاركة الترخيص.
                        </p>
                      </div>

                      {/* Rule 2 */}
                      <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-900/60 hover:border-sky-500/15 transition-all duration-300 space-y-2 group/r">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover/r:scale-125 transition-transform" />
                          <h4 className="text-xs font-black text-white">2. سياسة إعادة تعيين الهوية العتادية (HWID Reset)</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed pr-3.5">
                          تتوفر ميزة إعادة تعيين الهوية العتادية (HWID Reset) مجاناً لمساعدة عملائنا عند تغيير قطع الحاسوب أو الفرمتة. يُمنع إساءة استخدام هذه الميزة أو استغلالها لتشغيل المنتج على أجهزة متعددة لعملاء مختلفين.
                        </p>
                      </div>

                      {/* Rule 3 */}
                      <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-900/60 hover:border-sky-500/15 transition-all duration-300 space-y-2 group/r">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover/r:scale-125 transition-transform" />
                          <h4 className="text-xs font-black text-white">3. سياسة الاسترجاع والتعويض الرقمي</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed pr-3.5">
                          المنتجات الرقمية وتراخيص البرامج هي سلع غير قابلة للاسترجاع بمجرد إصدارها واستلام العميل لها. في حال وجود مشكلة فنية بالمنتج، يلتزم العميل بالتواصل مع الدعم الفني، وفي حال عجز الدعم عن حل المشكلة تماماً، يتم تعويض العميل.
                        </p>
                      </div>

                      {/* Rule 4 */}
                      <div className="p-5 rounded-2xl bg-gray-950/40 border border-gray-900/60 hover:border-sky-500/15 transition-all duration-300 space-y-2 group/r">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover/r:scale-125 transition-transform" />
                          <h4 className="text-xs font-black text-white">4. الالتزام بالسلوك اللائق والدعم</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed pr-3.5">
                          يسعدنا تقديم الدعم الفني لكافة العملاء عبر قنوات الاتصال الرسمية. يرجى احترام طاقم العمل وتجنب التهديد أو التحدث بأسلوب غير لائق لتفادي تعليق الخدمة أو إغلاق الحساب بشكل نهائي.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-900/80 pt-6 mt-12 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400">تـعـن الرقمية —</span>
            <span>جميع الحقوق محفوظة لـ تـعـن © 2026</span>
          </div>
          <button
            onClick={() => setShowRulesModal(true)}
            className="text-gray-500 hover:text-sky-400 transition-colors font-bold cursor-pointer"
          >
            قوانين شروط تعن
          </button>
          <div className="font-mono text-gray-600 bg-gray-950/60 px-3 py-1 rounded-full border border-gray-900">
            <span>حقوق التوزيع محفوظة لـ تـعـن</span>
          </div>
        </div>
      </main>

      {/* ─── GUIDE MODAL ─── */}
      <AnimatePresence>
        {selectedProductGuide && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0d14] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  <span>دليل تشغيل: {selectedProductGuide.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedProductGuide(null)}
                  className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center font-bold transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                <div className="flex items-start gap-3 bg-gray-950/40 p-4 rounded-2xl border border-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 font-bold">1</div>
                  <div>
                    <p className="font-bold text-white">تحميل اللودر (Loader)</p>
                    <p className="text-gray-400 mt-1">انقر على زر "Download Loader" في كرت المنتج لتحميل ملف التشغيل الخاص بك مباشرة.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#090d14] p-4 rounded-2xl border border-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 font-bold">2</div>
                  <div>
                    <p className="font-bold text-white">التشغيل كمسؤول</p>
                    <p className="text-gray-400 mt-1">اضغط بزر الماوس الأيمن على الملف الذي قمت بتحميله واختر <strong>"تشغيل كمسؤول" (Run as Administrator)</strong> لضمان عمل كافة الصلاحيات بنجاح.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#090d14] p-4 rounded-2xl border border-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 font-bold">3</div>
                  <div>
                    <p className="font-bold text-white">إدخال مفتاح التفعيل</p>
                    <p className="text-gray-400 mt-1">قم بنسخ مفتاح الترخيص الموضح في كرت المنتج والصقه في اللودر عند طلبه لبدء الاستخدام الفوري.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#090d14] p-4 rounded-2xl border border-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 font-bold">4</div>
                  <div>
                    <p className="font-bold text-white">ملاحظة إعادة تعيين الـ HWID</p>
                    <p className="text-gray-400 mt-1">إذا قمت بتغيير جهازك أو قمت بفرمتته وظهرت لك رسالة خطأ بالترخيص، يرجى النقر على زر <strong>HWID Reset</strong> في لوحتك لإعادة الاستخدام فوراً.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-900 flex justify-end">
                <button
                  onClick={() => setSelectedProductGuide(null)}
                  className="bg-white hover:bg-gray-100 text-gray-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  حسناً، فهمت ذلك
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── RULES MODAL ─── */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0d14] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <span>شروط وقوانين متجر تـعـن</span>
                </h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center font-bold transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-300 leading-relaxed overflow-y-auto max-h-[400px] pr-1">
                {/* Rule Item 1 */}
                <div className="bg-gray-950/50 p-4.5 rounded-2xl border border-gray-900/80 space-y-1.5 hover:border-sky-500/25 transition-all duration-300 group/item">
                  <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 group-hover/item:scale-125 transition-transform" />
                    <span>1. سياسة استخدام مفاتيح التفعيل</span>
                  </h4>
                  <p className="text-gray-400 leading-[1.8] pr-4">
                    جميع المفاتيح الرقمية المباعة مخصصة للاستخدام الشخصي فقط على جهاز واحد (ما لم يذكر خلاف ذلك). يمنع مشاركة المفاتيح أو نشرها؛ حيث يقوم نظام الحماية بإلغاء التفعيل فوراً وتلقائياً في حال اكتشاف مشاركة الترخيص.
                  </p>
                </div>

                {/* Rule Item 2 */}
                <div className="bg-gray-950/50 p-4.5 rounded-2xl border border-gray-900/80 space-y-1.5 hover:border-sky-500/25 transition-all duration-300 group/item">
                  <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 group-hover/item:scale-125 transition-transform" />
                    <span>2. سياسة إعادة تعيين الهوية العتادية (HWID Reset)</span>
                  </h4>
                  <p className="text-gray-400 leading-[1.8] pr-4">
                    تتوفر ميزة إعادة تعيين الهوية العتادية (HWID Reset) مجاناً لمساعدة عملائنا عند تغيير قطع الحاسوب أو الفرمتة. يُمنع إساءة استخدام هذه الميزة أو استغلالها لتشغيل المنتج على أجهزة متعددة لعملاء مختلفين.
                  </p>
                </div>

                {/* Rule Item 3 */}
                <div className="bg-gray-950/50 p-4.5 rounded-2xl border border-gray-900/80 space-y-1.5 hover:border-sky-500/25 transition-all duration-300 group/item">
                  <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 group-hover/item:scale-125 transition-transform" />
                    <span>3. سياسة الاسترجاع والتعويض</span>
                  </h4>
                  <p className="text-gray-400 leading-[1.8] pr-4">
                    المنتجات الرقمية وتراخيص البرامج هي سلع غير قابلة للاسترجاع بمجرد إصدارها واستلام العميل لها. في حال وجود مشكلة فنية بالمنتج، يلتزم العميل بالتواصل مع الدعم الفني، وفي حال عجز الدعم عن حل المشكلة تماماً، يتم تعويض العميل.
                  </p>
                </div>

                {/* Rule Item 4 */}
                <div className="bg-gray-950/50 p-4.5 rounded-2xl border border-gray-900/80 space-y-1.5 hover:border-sky-500/25 transition-all duration-300 group/item">
                  <h4 className="font-extrabold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 group-hover/item:scale-125 transition-transform" />
                    <span>4. الالتزام بالسلوك اللائق والدعم</span>
                  </h4>
                  <p className="text-gray-400 leading-[1.8] pr-4">
                    يسعدنا تقديم الدعم الفني لكافة العملاء عبر قنوات الاتصال الرسمية. يرجى احترام طاقم العمل وتجنب التهديد أو التحدث بأسلوب غير لائق لتفادي تعليق الخدمة أو إغلاق الحساب بشكل نهائي.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-900 flex justify-end relative z-10">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="bg-white hover:bg-gray-100 text-gray-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  حسناً، قرأت وفهمت القوانين
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Support Chat Widget */}
      <SupportChatWidget />

      {/* Global Toast Notifications Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
};
