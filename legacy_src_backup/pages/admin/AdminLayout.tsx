import React, { useState } from 'react';
import { useAuth } from '../../auth.tsx';
import { OverviewPage } from './OverviewPage.tsx';
import { ProductsPage } from './ProductsPage.tsx';
import { KeysPage } from './KeysPage.tsx';
import { UsersPage } from './UsersPage.tsx';
import { LogsPage } from './LogsPage.tsx';
import { SettingsPage } from './SettingsPage.tsx';
import { AdminTicketsPage } from './AdminTicketsPage.tsx';
import { 
  LayoutDashboard, 
  Layers, 
  Key, 
  Users, 
  FileText, 
  Settings, 
  ShieldAlert, 
  Sparkles, 
  Shield,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';

export type AdminTab = 'overview' | 'products' | 'keys' | 'users' | 'logs' | 'settings' | 'tickets';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('products');

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="p-16 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-lg mx-auto my-12">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h2 className="text-xl font-bold">وصول مرفوض</h2>
        <p className="text-sm text-rose-300 mt-1">هذه الصفحة مخصصة لمسؤولي المنصة فقط</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'نظرة عامة والإحصائيات', desc: 'مؤشرات الأداء ومراقبة المنصة', icon: LayoutDashboard },
    { id: 'products', label: 'إدارة المنتجات والملفات', desc: 'مخزون البرمجيات والملفات والشروحات', icon: Layers },
    { id: 'keys', label: 'مخزون المفاتيح (License Keys)', desc: 'استيراد وإدارة مفاتيح التراخيص', icon: Key },
    { id: 'users', label: 'المستخدمون والصلاحيات', desc: 'إدارة الأعضاء ورتب المسؤولين', icon: Users },
    { id: 'tickets', label: 'إدارة التذاكر والدردشة', desc: 'محادثات الدعم والردود والملفات المرفقة', icon: MessageSquare },
    { id: 'logs', label: 'سجلات المراقبة (Audit Logs)', desc: 'سجل العمليات والتغيرات الحية', icon: FileText },
    { id: 'settings', label: 'إعدادات المنصة والربط', desc: 'Discord Webhook وهوية الموقع', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-10 pb-20 min-h-[880px] bg-[#090D16] text-[#FFFFFF]">
      <div className="flex flex-col lg:flex-row gap-8 relative">
        
        {/* ─── PROFESSIONAL SAAS EXPANDED RTL SIDEBAR ─── */}
        <aside className="w-full lg:w-96 shrink-0 bg-[#0F172A]/90 border border-[#1E293B] rounded-[26px] p-6 shadow-2xl flex flex-col justify-between self-start backdrop-blur-xl">
          
          <div className="space-y-6">
            {/* Sidebar Top Brand Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#1E293B]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-600 rounded-[18px] blur-sm opacity-75 animate-pulse" />
                  <div className="relative w-13 h-13 rounded-[18px] bg-[#0F172A] flex items-center justify-center text-white border border-sky-400/40 shrink-0 shadow-xl">
                    <Sparkles className="w-7 h-7 text-sky-400 font-black" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>إدارة تـعـن</span>
                    <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">لوحة التحكم التنفيذية الشاملة</p>
                </div>
              </div>
              <span className="bg-[#1E293B] text-sky-400 text-[11px] font-mono font-black px-3 py-1 rounded-xl border border-sky-500/20 shadow-inner">
                v3.5
              </span>
            </div>

            {/* Navigation Items — Sleek Expanded Cards */}
            <nav className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubTab(item.id as AdminTab)}
                    className={`w-full text-right p-4 rounded-[20px] flex items-center justify-between transition-all duration-300 group cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 text-white border-sky-400/50 shadow-xl shadow-sky-500/25 scale-[1.01]'
                        : 'bg-[#1E293B]/60 text-slate-300 border-[#1E293B] hover:bg-[#1E293B] hover:text-white hover:border-sky-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 text-white shadow-inner border border-white/30' 
                          : 'bg-[#0F172A] text-sky-400 group-hover:text-white group-hover:bg-sky-500/20 border border-slate-700/60 shadow-md'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-base font-bold leading-tight truncate">{item.label}</h3>
                        <p className={`text-xs truncate mt-1 ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>{item.desc}</p>
                      </div>
                    </div>

                    <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                      isActive ? 'text-white -translate-x-1' : 'text-slate-500 group-hover:text-sky-400'
                    }`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer User/Owner Card */}
          <div className="mt-8 pt-5 border-t border-[#1E293B]">
            <div className="bg-[#1E293B]/80 border border-slate-700/60 rounded-[20px] p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-[16px] bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 font-black shadow-inner">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-black text-white truncate">{user.name}</p>
                  <p className="text-xs text-sky-400 font-bold">{user.role === 'owner' ? 'المشرف العام (Owner)' : 'مسؤول المنصة (Admin)'}</p>
                </div>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
            </div>
          </div>

        </aside>

        {/* ─── MAIN CONTENT CONTAINER ─── */}
        <main className="flex-1 bg-[#121826]/60 border border-[#273449] rounded-[22px] p-6 md:p-10 shadow-2xl min-w-0">
          {activeSubTab === 'overview' && <OverviewPage onNavigateTab={(tab) => setActiveSubTab(tab as AdminTab)} />}
          {activeSubTab === 'products' && <ProductsPage />}
          {activeSubTab === 'keys' && <KeysPage />}
          {activeSubTab === 'users' && <UsersPage />}
          {activeSubTab === 'logs' && <LogsPage />}
          {activeSubTab === 'settings' && <SettingsPage />}
          {activeSubTab === 'tickets' && <AdminTicketsPage />}
        </main>

      </div>

      {/* Coordinated TA3N Footer Copyright */}
      <footer className="mt-auto border-t border-[#273449] pt-6 pb-2 text-center text-xs text-[#94A3B8]">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FFFFFF]">متجر تـعـن (TA3N STOREFRONT)</span>
            <span>—</span>
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[#94A3B8]">
            <span className="bg-[#171F2F] px-3 py-1 rounded-full border border-[#273449] text-[11px] font-mono">
              TA3N / SaaS Enterprise Architecture
            </span>
            <span className="text-[#22C55E] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              أنظمة الحماية نشطة
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
