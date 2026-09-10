'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowUpLeft, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Headphones, KeyRound, LayoutGrid, LogOut, Menu, MessageSquare, Moon, Package, PanelRightClose, PanelRightOpen, ShieldCheck, Sun, UserRound, X, type LucideIcon } from 'lucide-react';
import { DiscordMark } from './discord-mark';
import css from './portal-navigation.module.css';

export type PortalTab = 'overview' | 'my-products' | 'faqs' | 'redeem' | 'tickets' | 'admin' | 'admin-chats' | 'profile';
interface PortalNavigationProps {
  activeTab: PortalTab;
  onNavigate: (tab: PortalTab) => void;
  lang: 'ar' | 'en';
  isDark: boolean;
  isAdmin: boolean;
  productCount: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileChange: (open: boolean) => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
  user: { name: string; image?: string | null };
}
interface NavigationItem { tab: PortalTab; label: string; icon: LucideIcon; count?: number }

export function PortalNavigation({ activeTab, onNavigate, lang, isDark, isAdmin, productCount, collapsed, onToggleCollapsed, mobileOpen, onMobileChange, onToggleTheme, onToggleLanguage, onLogout, user }: PortalNavigationProps) {
  const ar = lang === 'ar';
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const Chevron = ar ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const shell = drawerRef.current?.closest('.portal-shell');
    const background = Array.from(shell?.children ?? []).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== drawerRef.current && !element.contains(drawerRef.current));
    const previousInert = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onMobileChange(false); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const viewport = window.matchMedia('(min-width: 768px)');
    const onResize = () => { if (viewport.matches) onMobileChange(false); };
    document.addEventListener('keydown', onKeyDown);
    viewport.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('change', onResize);
      trigger?.focus();
    };
  }, [mobileOpen, onMobileChange]);

  const navigate = (tab: PortalTab) => { onNavigate(tab); onMobileChange(false); };
  const groups: { title: string; items: NavigationItem[] }[] = [
    { title: ar ? 'عام' : 'GENERAL', items: [
      { tab: 'overview', label: ar ? 'الرئيسية' : 'Overview', icon: LayoutGrid },
      { tab: 'my-products', label: ar ? 'منتجاتي' : 'My products', icon: Package, count: productCount },
      { tab: 'redeem', label: ar ? 'تفعيل مفتاح' : 'Activate a key', icon: KeyRound },
    ] },
    { title: ar ? 'الدعم' : 'SUPPORT', items: [
      { tab: 'tickets', label: ar ? 'مركز المساعدة' : 'Help center', icon: Headphones },
      ...(productCount > 0 ? [{ tab: 'faqs' as const, label: ar ? 'الأسئلة الشائعة' : 'FAQs', icon: BookOpen }] : []),
      ...(isAdmin ? [{ tab: 'admin-chats' as const, label: ar ? 'محادثات مساعد تعن' : 'Assistant Chats', icon: MessageSquare }] : []),
    ] },
    { title: ar ? 'الحساب' : 'ACCOUNT', items: [
      { tab: 'profile', label: ar ? 'الملف الشخصي' : 'Profile', icon: UserRound },
      ...(isAdmin ? [{ tab: 'admin' as const, label: ar ? 'لوحة الإدارة' : 'Admin Control', icon: ShieldCheck }] : []),
    ] },
  ];

  const brand = <><Image src="/logo.png" width={42} height={42} alt="" /><span className={css.brandCopy}><strong translate="no">تعن</strong><small>{ar ? 'بوابة المنتجات والدعم' : 'Products & Support Portal'}</small></span></>;
  const navigation = (compact: boolean) => <nav className={css.nav} aria-label={ar ? 'القائمة الرئيسية' : 'Main navigation'}>
    {groups.map((group, index) => <div className={css.group} key={group.title}><p className={css.groupTitle}>{group.title}</p>
      {group.items.map(({ tab, label, icon: Icon, count }) => <button type="button" key={tab} className={css.item} data-active={activeTab === tab} aria-current={activeTab === tab ? 'page' : undefined} aria-label={label} title={compact ? label : undefined} onClick={() => navigate(tab)}><span className={css.itemIcon}><Icon size={19} strokeWidth={1.7} /></span><span className={css.itemLabel}>{label}</span>{count !== undefined ? <span className={css.badge}>{count}</span> : activeTab === tab && <Chevron className={css.chevron} size={14} />}</button>)}
      {index === 1 && <a className={css.item} href="https://discord.gg/t3n" target="_blank" rel="noopener noreferrer" title={compact ? (ar ? 'مجتمع ديسكورد' : 'Discord community') : undefined} aria-label={ar ? 'مجتمع ديسكورد' : 'Discord community'}><span className={css.itemIcon}><DiscordMark width={18} height={18} /></span><span className={css.itemLabel}>{ar ? 'مجتمع ديسكورد' : 'Discord community'}</span><Arrow className={css.chevron} size={13} /></a>}
    </div>)}
  </nav>;
  const footer = <div className={css.account}>
    <button type="button" className={css.user} onClick={() => navigate('profile')} aria-label={ar ? 'فتح الملف الشخصي' : 'Open profile'} title={collapsed ? user.name : undefined}><Image src={user.image || '/logo.png'} alt="" width={34} height={34} onError={event => { event.currentTarget.src = '/logo.png'; }} /><span className={css.userCopy}><strong>{user.name}</strong><small><i />{ar ? 'حسابك متصل' : 'You are connected'}</small></span><Chevron className={css.chevron} size={15} /></button>
    <button type="button" className={css.logout} onClick={onLogout} aria-label={ar ? 'تسجيل الخروج' : 'Sign out'} title={collapsed ? (ar ? 'تسجيل الخروج' : 'Sign out') : undefined}><LogOut size={17} strokeWidth={1.7} /><span>{ar ? 'تسجيل الخروج' : 'Sign out'}</span></button>
  </div>;

  return <>
    <aside className={`${css.sidebar} ${collapsed ? css.collapsed : ''}`} aria-label={ar ? 'التنقّل' : 'Navigation'}>
      <div className={css.brandRow}>
        <button type="button" className={css.brand} onClick={() => navigate('overview')} aria-label={ar ? 'تعن — الرئيسية' : 'TA3N — Home'}>{brand}</button>
        <button type="button" className={`${css.collapseButton} ${css.iconButton}`} onClick={onToggleCollapsed} title={collapsed ? (ar ? 'إظهار القائمة' : 'Expand navigation') : (ar ? 'طي القائمة' : 'Collapse navigation')} aria-label={collapsed ? (ar ? 'إظهار القائمة' : 'Expand navigation') : (ar ? 'طي القائمة' : 'Collapse navigation')} aria-pressed={collapsed}>{collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}</button>
      </div>
      {navigation(collapsed)}
      {footer}
    </aside>
    <div className={css.mobileBar}>
      <button ref={triggerRef} type="button" className={css.iconButton} onClick={() => onMobileChange(true)} aria-label={ar ? 'فتح القائمة' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="portal-navigation-drawer"><Menu size={21} /></button>
      <button type="button" className={css.mobileBrand} onClick={() => navigate('overview')} aria-label={ar ? 'تعن — الرئيسية' : 'TA3N — Home'}>{brand}</button>
      <div className={css.mobileControls}><button type="button" className={css.iconButton} onClick={onToggleLanguage} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'}>{ar ? 'EN' : 'ع'}</button><button type="button" className={css.iconButton} onClick={onToggleTheme} aria-label={ar ? 'تبديل المظهر' : 'Toggle theme'}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
    </div>
    {mobileOpen && <div className={css.mobileOverlay} onClick={() => onMobileChange(false)}>
      <aside ref={drawerRef} id="portal-navigation-drawer" className={css.drawer} role="dialog" aria-modal="true" aria-label={ar ? 'القائمة الرئيسية' : 'Main navigation'} onClick={event => event.stopPropagation()}>
        <div className={css.drawerHeader}><button type="button" className={css.brand} onClick={() => navigate('overview')} aria-label={ar ? 'تعن — الرئيسية' : 'TA3N — Home'}>{brand}</button><button ref={closeRef} type="button" className={css.iconButton} onClick={() => onMobileChange(false)} aria-label={ar ? 'إغلاق القائمة' : 'Close navigation'}><X size={20} /></button></div>
        {navigation(false)}{footer}
      </aside>
    </div>}
  </>;
}
