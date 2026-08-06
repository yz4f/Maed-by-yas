import React, { useState } from 'react';
import { useAuth } from '../auth.tsx';
import { Shield, Key, LayoutDashboard, Settings, LogOut, User as UserIcon, CheckCircle2, Lock } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}


interface NavbarProps {
  activeTab: 'dashboard' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, loading, triggerGoogleLogin, loginWithEmail, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      return;
    }
    setLoginSubmitting(true);
    try {
      const ok = await loginWithEmail(emailInput, nameInput);
      if (ok) {
        setShowLoginModal(false);
      } else {
        // Error handled silently - form will stay open
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleGoogleLoginClick = () => {
    triggerGoogleLogin();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-950/85 backdrop-blur-xl border-b border-gray-800/80 transition-all shadow-xl shadow-black/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-22 py-3 flex items-center justify-between">
          
          {/* Luxury Glowing Logo Section */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <div className="relative w-12 h-12 rounded-2xl bg-gray-950 flex items-center justify-center shadow-xl border border-sky-400/35 group-hover:scale-105 transition-all duration-300 overflow-hidden">
                <img src="/logo.png" alt="تعن" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-3.5xl tracking-tight transition-all duration-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] flex items-center">
                  <span className="text-white">ت</span>
                  <span className="text-[#38bdf8]">عن</span>
                </span>
              </div>
            </div>
          </div>

          {/* Luxury Desktop Navigation Menu Tabs */}
          <nav className="hidden md:flex items-center gap-2.5 bg-gray-900/90 p-2 rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            {user && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === 'dashboard' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 transform scale-105 border border-sky-400/30 font-black' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/80 hover:scale-102 border border-transparent'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-sky-400'}`} />
                <span>لوحة التحكم</span>
              </button>
            )}

            {user && (user.role === 'admin' || user.role === 'owner') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === 'admin' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 transform scale-105 border border-sky-400/30 font-black' 
                    : 'text-sky-400/90 hover:text-sky-300 hover:bg-sky-500/10 hover:scale-102 border border-transparent'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : 'text-sky-400/90'}`} />
                <span>الإدارة</span>
              </button>
            )}
          </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-28 h-10 rounded-xl bg-gray-800/50 animate-pulse border border-gray-700/50" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/60 hover:border-sky-500/50 p-1.5 pl-4 rounded-2xl transition-all shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center overflow-hidden border border-sky-400/30">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {user.role === 'owner' && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] px-1.5 py-0.2 rounded font-extrabold">Owner</span>}
                    {user.role === 'admin' && <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[9px] px-1.5 py-0.2 rounded font-extrabold">Admin</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 max-w-[130px] truncate">{user.email}</div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-xs text-gray-400">حساب Google المتصل:</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حساب نشط ومحمي بـ Google OAuth</span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); setActiveTab('dashboard'); }}
                      className="w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:bg-gray-800/80 flex items-center gap-2.5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-sky-400" />
                      <span>المنتجات المفعلة والتحميلات</span>
                    </button>

                    {(user.role === 'admin' || user.role === 'owner') && (
                      <button
                        onClick={() => { setDropdownOpen(false); setActiveTab('admin'); }}
                        className="w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors mt-0.5"
                      >
                        <Settings className="w-4 h-4 text-amber-400" />
                        <span>لوحة إدارة المنصة</span>
                      </button>
                    )}
                  </div>

                  <div className="p-1.5 border-t border-gray-800 mt-1">
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full text-right px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 text-sm"
              >
                <span>تسجيل الدخول</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>

    {/* Luxury Mobile Bottom Navigation Bar (Appears only on smartphones/tablets) */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-2xl border-t border-gray-800/80 px-2 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {user && (
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-sky-400 font-bold scale-105' : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]' : ''}`} />
          <span className="text-[10px] mt-1">لوحة التحكم</span>
        </button>
      )}

      {user && (user.role === 'admin' || user.role === 'owner') && (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'admin' ? 'text-sky-400 font-black scale-105' : 'text-sky-500/80 hover:text-sky-300'
          }`}
        >
          <Settings className="w-5 h-5 animate-spin-slow" />
          <span className="text-[10px] mt-1 font-extrabold">الإدارة</span>
        </button>
      )}
    </div>

    {/* Luxury Glassmorphic Login Modal */}
    {showLoginModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-md bg-gray-900/95 border border-sky-500/30 rounded-3xl p-6 shadow-2xl shadow-sky-500/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-sky-400" />
              <span>تسجيل الدخول إلى تـعـن</span>
            </h3>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Email & Google Login Options */}
          <div className="space-y-5">
            {/* Email Login Form */}
            <form onSubmit={handleEmailLoginSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/60 focus:border-sky-500/60 text-white placeholder-gray-500 text-sm px-4 py-3.5 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-sky-500/20"
                dir="ltr"
                required
              />
              <input
                type="text"
                placeholder="الاسم (اختياري)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/60 focus:border-sky-500/60 text-white placeholder-gray-500 text-sm px-4 py-3.5 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3.5 rounded-2xl shadow-xl transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{loginSubmitting ? 'جاري الدخول...' : 'دخول بالبريد الإلكتروني'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[10px] text-gray-500 font-bold">أو</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                triggerGoogleLogin();
              }}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-150 text-gray-950 font-black py-3.5 rounded-2xl shadow-xl transition-all text-sm cursor-pointer"
            >
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7.1C.6 9.1 0 10.7 0 12.3s.6 3.2 1.6 5.2l3.7-2.7z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.2L1.6 15.9C3.5 19.7 7.4 23 12 23z" />
              </svg>
              <span>تسجيل الدخول بـ Google</span>
            </button>

            {/* Subtle Developer Demo Shortcuts */}
            <div className="pt-4 border-t border-gray-900 flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 text-center font-bold">تسجيل دخول تجريبي سريع للمطورين</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLoginSubmitting(true);
                    try {
                      const ok = await loginWithEmail('yasemoh24@gmail.com', 'ياسر (المسؤول)');
                      if (ok) setShowLoginModal(false);
                    } finally {
                      setLoginSubmitting(false);
                    }
                  }}
                  className="bg-amber-500/5 hover:bg-amber-500/10 text-amber-400/80 hover:text-amber-400 border border-amber-500/10 rounded-xl py-2 text-[10px] font-bold transition-all cursor-pointer"
                >
                  دخول (مسؤول)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoginSubmitting(true);
                    try {
                      const ok = await loginWithEmail('demo-user@ta3n.com', 'عميل تجريبي');
                      if (ok) setShowLoginModal(false);
                    } finally {
                      setLoginSubmitting(false);
                    }
                  }}
                  className="bg-sky-500/5 hover:bg-sky-500/10 text-sky-400/80 hover:text-sky-400 border border-sky-500/10 rounded-xl py-2 text-[10px] font-bold transition-all cursor-pointer"
                >
                  دخول (عميل)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
