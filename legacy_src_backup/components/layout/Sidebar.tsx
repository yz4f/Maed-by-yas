import React from 'react';
import {
  LayoutDashboard,
  Package,
  KeyRound,
  BookOpen,
  UserCircle,
  BarChart3,
  ShoppingBag,
  Key,
  CheckCircle,
  Users,
  TrendingUp,
  ScrollText,
  Settings,
  MessageSquare,
  LogOut,
  X
} from 'lucide-react';
import type { AppPage } from '../../types';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isAdmin: boolean;
  user: { name: string; email: string; avatar?: string; role: string } | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isAdmin,
  user,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}) => {
  const userNavGroups = [
    {
      label: 'الرئيسية',
      items: [
        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
      ],
    },
    {
      label: 'الخدمات',
      items: [
        { id: 'products', label: 'المنتجات', icon: Package },
        { id: 'redeem', label: 'استرداد مفتاح', icon: KeyRound },
      ],
    },
    {
      label: 'الدعم',
      items: [
        { id: 'docs', label: 'التوثيق', icon: BookOpen },
      ],
    },
    {
      label: 'الحساب',
      items: [
        { id: 'profile', label: 'الملف الشخصي', icon: UserCircle },
      ],
    },
  ];

  const adminNavGroups = [
    {
      label: 'لوحة الإدارة',
      items: [
        { id: 'dashboard', label: 'الاحصائيات', icon: BarChart3 },
        { id: 'admin-products', label: 'المنتجات', icon: ShoppingBag },
        { id: 'admin-keys', label: 'المفاتيح', icon: Key },
        { id: 'admin-redeemed-keys', label: 'المفاتيح المستردة', icon: CheckCircle },
        { id: 'admin-users', label: 'المستخدمين', icon: Users },
        { id: 'admin-analytics', label: 'التحليلات', icon: TrendingUp },
        { id: 'admin-logs', label: 'السجلات', icon: ScrollText },
        { id: 'admin-settings', label: 'الإعدادات', icon: Settings },
        { id: 'admin-tickets', label: 'التذاكر', icon: MessageSquare },
      ],
    },
  ];

  const renderNavItems = (groups: typeof userNavGroups) => {
    return groups.map((group, idx) => (
      <div key={idx} className="mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.15em] text-sky-500/40 font-semibold px-5 mb-1.5 mt-5">
          {group.label}
        </h3>
        <ul className="space-y-1 px-3">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onNavigate(item.id as AppPage);
                    if (window.innerWidth < 768) {
                      onToggleCollapse();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative group
                    ${
                      isActive
                        ? 'bg-sky-500/10 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03] hover:scale-[1.02]'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[70%] w-[3px] bg-gradient-to-b from-sky-500 to-blue-600 rounded-l-full shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  )}
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'}`} />
                  <span className="text-[13px] font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 h-screen bg-[#070E1A] z-50 flex flex-col transition-transform duration-500 ease-out border-l border-white/[0.02]
          ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}
          md:translate-x-0 md:w-[260px] md:static md:flex-shrink-0
          shadow-[0_0_40px_rgba(0,0,0,0.5)] md:shadow-none
        `}
        style={{ width: '260px' }}
      >
        {/* Subtle left border gradient line */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-sky-500/20 to-transparent" />

        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.04] relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#0D1829] border border-sky-900/30 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.15)]">
              <img src="/logo.png" alt="T3N Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-l from-white to-sky-400 bg-clip-text text-transparent tracking-wide">
                T3N | تعن
              </span>
              <span className="text-[10px] text-sky-400/60 font-medium tracking-wider">
                Security Platform
              </span>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sky-500/10 hover:[&::-webkit-scrollbar-thumb]:bg-sky-500/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {renderNavItems(userNavGroups)}
          
          {isAdmin && (
            <>
              <div className="my-4 mx-5 h-[1px] bg-gradient-to-r from-transparent via-sky-900/30 to-transparent" />
              {renderNavItems(adminNavGroups)}
            </>
          )}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/[0.04] shrink-0 bg-[#070E1A]/50 backdrop-blur-md">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1829] border border-sky-900/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-sky-500/20 to-blue-600/20 flex items-center justify-center border border-sky-500/20 shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sky-400 font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white truncate">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-sky-400/70 truncate">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500">
              Not logged in
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
