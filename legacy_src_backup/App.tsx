import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './auth.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopBar } from './components/layout/TopBar.tsx';
import { ToastContainer, useToast } from './components/Toast.tsx';
import { Shield, Loader2 } from 'lucide-react';
import type { AppPage } from './types.ts';

// ─── User Pages ───
import { MyProductsPage } from './pages/user/MyProductsPage.tsx';
import { RedeemPage } from './pages/user/RedeemPage.tsx';
import { UserOverviewPage } from './pages/user/OverviewPage.tsx';
import { ProfilePage } from './pages/user/ProfilePage.tsx';
import { DocsPage } from './pages/DocsPage.tsx';

// ─── Admin Pages ───
import { AdminDashboardPage } from './pages/admin/OverviewPage.tsx';
import { AdminProductsPage } from './pages/admin/ProductsPage.tsx';
import { AdminKeysPage } from './pages/admin/KeysPage.tsx';
import { AdminUsersPage } from './pages/admin/UsersPage.tsx';
import { AdminAnalyticsPage } from './pages/admin/AnalyticsPage.tsx';
import { AdminLogsPage } from './pages/admin/LogsPage.tsx';
import { AdminSettingsPage } from './pages/admin/SettingsPage.tsx';
import { AdminRedeemedKeysPage } from './pages/admin/RedeemedKeysPage.tsx';

// ─── Page Titles ───
const pageTitles: Record<AppPage, { title: string; subtitle?: string }> = {
  'overview': { title: 'الرئيسية', subtitle: 'نظرة عامة على حسابك' },
  'products': { title: 'منتجاتي', subtitle: 'المنتجات المفعّلة في حسابك' },
  'redeem': { title: 'تفعيل مفتاح', subtitle: 'أدخل مفتاح الترخيص لتفعيل المنتج' },
  'docs': { title: 'مركز الشروحات', subtitle: 'الدليل الرسمي الشامل لخدمات T3N' },
  'profile': { title: 'الملف الشخصي', subtitle: 'معلومات حسابك' },
  'settings': { title: 'الإعدادات', subtitle: 'إعدادات حسابك' },
  'dashboard': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على المنصة' },
  'admin-products': { title: 'إدارة المنتجات', subtitle: 'إضافة وتعديل المنتجات' },
  'admin-keys': { title: 'مخزون المفاتيح', subtitle: 'المفاتيح الجاهزة والمخزون المتاح (Unused)' },
  'admin-redeemed-keys': { title: 'المفاتيح المفعّلة', subtitle: 'سجل جميع التراخيص والمفاتيح المستخدمة' },
  'admin-users': { title: 'إدارة المستخدمين', subtitle: 'عرض وإدارة حسابات المستخدمين' },
  'admin-analytics': { title: 'التحليلات', subtitle: 'إحصائيات وتقارير المنصة' },
  'admin-logs': { title: 'السجلات', subtitle: 'سجل العمليات والأنشطة' },
  'admin-settings': { title: 'إعدادات النظام', subtitle: 'إعدادات المنصة والويب هوك' },
  'admin-tickets': { title: 'تذاكر الدعم', subtitle: 'إدارة طلبات الدعم الفني' },
};

// ─── Login Screen ───
const LoginScreen: React.FC = () => {
  const { triggerGoogleLogin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await triggerGoogleLogin();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050B15] selection:bg-sky-500/20">
      {/* Subtle ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-sky-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl px-4 sm:px-6"
      >
        {/* Main Luxurious Card Container */}
        <div className="relative p-10 sm:p-14 text-center flex flex-col items-center justify-center rounded-2xl bg-[#0D1829]/90 backdrop-blur-xl border border-sky-900/25 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-8 w-full">
          
          {/* Logo Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative w-24 h-24"
          >
            <div className="absolute inset-0 rounded-2xl bg-sky-500/10 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-[#070E1A] p-4 border border-sky-900/20 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="T3N Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(14,165,233,0.3)]"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <div className="space-y-3 text-center w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-alexandria tracking-tight text-white leading-tight">
              مرحباً بك في T3N | تعن
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto font-medium">
              المنصة الرقمية الرسمية لاستلام طلبك وتفعيل خدماتك فورياً بأعلى درجات الأمان والسرعة.
            </p>
          </div>

          {/* Premium Google Login Button */}
          <div className="pt-2 w-full">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleGoogleLogin}
              disabled={loading || authLoading}
              className="w-full relative py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-base transition-all duration-300 shadow-[0_4px_20px_rgba(14,165,233,0.15)] border-0 flex items-center justify-center gap-3 group/btn overflow-hidden cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <div className="w-6 h-6 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/10">
                    <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="tracking-wide font-alexandria text-sm">تسجيل الدخول بحساب Google</span>
                </>
              )}
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

// ─── Premium Logo-Only Splash Screen ───
const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B15] overflow-hidden select-none">
      {/* Ambient glow behind logo */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[28rem] h-[28rem] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Spinning Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          rotate: { duration: 2, ease: 'easeInOut' }
        }}
        className="relative"
      >
        {/* Outer ring glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 rounded-full border border-sky-500/20"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(14,165,233,0.15), transparent, rgba(14,165,233,0.1), transparent)'
          }}
        />

        {/* Logo container */}
        <div className="relative w-24 h-24 rounded-2xl bg-[#0B1628]/80 backdrop-blur-xl p-4 border border-sky-500/15 shadow-[0_0_60px_rgba(14,165,233,0.15)] flex items-center justify-center">
          <motion.img
            src="/logo.png"
            alt="T3N"
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main App Content ───
const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toasts, removeToast, toast } = useToast();
  const [currentPage, setCurrentPage] = useState<AppPage>('overview');
  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const pageInfo = pageTitles[currentPage] || { title: '', subtitle: '' };

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <UserOverviewPage onNavigate={handleNavigate} toast={toast} />;
      case 'products':
        return <MyProductsPage toast={toast} />;
      case 'redeem':
        return <RedeemPage onNavigate={handleNavigate} toast={toast} />;
      case 'docs':
        return <DocsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <ProfilePage />;
      // Admin pages
      case 'dashboard':
        return isAdmin ? <AdminDashboardPage /> : null;
      case 'admin-products':
        return isAdmin ? <AdminProductsPage toast={toast} /> : null;
      case 'admin-keys':
        return isAdmin ? <AdminKeysPage toast={toast} /> : null;
      case 'admin-redeemed-keys':
        return isAdmin ? <AdminRedeemedKeysPage toast={toast} /> : null;
      case 'admin-users':
        return isAdmin ? <AdminUsersPage toast={toast} /> : null;
      case 'admin-analytics':
        return isAdmin ? <AdminAnalyticsPage /> : null;
      case 'admin-logs':
        return isAdmin ? <AdminLogsPage /> : null;
      case 'admin-settings':
        return isAdmin ? <AdminSettingsPage toast={toast} /> : null;
      default:
        return <UserOverviewPage onNavigate={handleNavigate} toast={toast} />;
    }
  };

  return (
    <div className="min-h-screen relative bg-[#050B15] selection:bg-sky-500/20 selection:text-white">
      {/* Subtle ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-sky-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Sidebar - always visible on desktop, toggleable on mobile */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        user={user ? { name: user.name || '', email: user.email || '', avatar: user.avatar || '', role: user.role || 'user' } : null}
        onLogout={logout}
        isCollapsed={!mobileSidebarOpen}
        onToggleCollapse={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Content Area - offset by sidebar width on desktop */}
      <div className="md:pr-[260px] min-h-screen flex flex-col w-full relative z-10">
        {/* Top Bar */}
        <TopBar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user ? { name: user.name || '', email: user.email || '', avatar: user.avatar || '', role: user.role || 'user' } : null}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isSidebarCollapsed={!mobileSidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10 w-full max-w-[1400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// ─── Error Boundary ───
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#060913] text-white p-6 text-center">
          <div className="max-w-md bg-[#0F172A] border border-white/10 rounded-2xl p-8 space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-alexandria">T3N | تعن</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              حدث خطأ غير متوقع أثناء عرض الصفحة. يرجى إعادة تحديث الصفحة أو المحاولة لاحقاً.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary py-2.5 px-6 text-xs w-full"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Root App ───
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
