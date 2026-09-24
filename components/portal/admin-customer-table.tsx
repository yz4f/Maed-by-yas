'use client';

import { Edit3, Search, Trash2, Users } from 'lucide-react';
import Image from 'next/image';

type Customer = {
  id: string;
  name?: string;
  image?: string | null;
  email?: string | null;
  discordId?: string;
  role?: string;
  productCount?: number;
  keyCount?: number;
  lastActivity?: string | null;
  createdAt?: string;
  isBanned?: boolean;
  isArchived?: boolean;
};
type CustomerTableStyles = {
  textTitle: string;
  textMuted: string;
  textLightMuted: string;
  bgInnerCard: string;
  borderNormal: string;
};
type Props = {
  lang: 'ar' | 'en';
  styles: CustomerTableStyles;
  customers: Customer[];
  resultCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
  roleFilter: string;
  statusFilter: 'all' | 'active' | 'disabled';
  canEdit: boolean;
  canDisable: boolean;
  onSearch: (value: string) => void;
  onRoleFilter: (value: string) => void;
  onStatusFilter: (value: 'all' | 'active' | 'disabled') => void;
  onPageChange: (page: number) => void;
  onOpenCustomer: (customer: Customer) => void;
  onDisableCustomer: (customer: Customer) => void;
};

export function AdminCustomerTable({
  lang,
  styles,
  customers,
  resultCount,
  page,
  pageCount,
  pageSize,
  search,
  roleFilter,
  statusFilter,
  canEdit,
  canDisable,
  onSearch,
  onRoleFilter,
  onStatusFilter,
  onPageChange,
  onOpenCustomer,
  onDisableCustomer,
}: Props) {
  const ar = lang === 'ar';
  const from = resultCount ? page * pageSize + 1 : 0;
  const to = Math.min((page + 1) * pageSize, resultCount);

  return (
    <div className="glass-card space-y-6 rounded-[24px] p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h3 className={`flex items-center gap-2 text-lg font-semibold ${styles.textTitle}`}>
          <Users className="h-5 w-5 text-cyan-400" />
          <span>{ar ? 'قائمة العملاء وإدارة الاشتراكات' : 'Customers list & subscriptions'}</span>
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative w-full md:w-72">
            <span className="sr-only">{ar ? 'ابحث باسم العميل أو إيميله أو Discord ID' : 'Search by customer name, email, or Discord ID'}</span>
            <Search className={`absolute top-3.5 h-4 w-4 ${ar ? 'right-4' : 'left-4'} ${styles.textMuted}`} />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={ar ? 'ابحث بالاسم أو البريد أو Discord ID...' : 'Search name, email, or Discord ID...'}
              className={`w-full rounded-xl border ${styles.borderNormal} ${styles.bgInnerCard} py-3 text-xs ${ar ? 'pr-11 pl-4' : 'pl-11 pr-4'} ${styles.textTitle} shadow-inner transition-all focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/20`}
            />
          </label>
          <label className="sr-only" htmlFor="customer-role-filter">{ar ? 'تصفية حسب الدور' : 'Filter by role'}</label>
          <select id="customer-role-filter" value={roleFilter} onChange={(event) => onRoleFilter(event.target.value)} className={`min-h-11 rounded-xl border ${styles.borderNormal} ${styles.bgInnerCard} px-3 text-xs ${styles.textTitle}`}>
            <option value="all">{ar ? 'كل الأدوار' : 'All roles'}</option>
            {['Owner', 'Boss', 'Admin', 'Co-Boss', 'Moderator', 'Staff', 'Customer', 'Member'].map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <label className="sr-only" htmlFor="customer-status-filter">{ar ? 'تصفية حسب الحالة' : 'Filter by status'}</label>
          <select id="customer-status-filter" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as Props['statusFilter'])} className={`min-h-11 rounded-xl border ${styles.borderNormal} ${styles.bgInnerCard} px-3 text-xs ${styles.textTitle}`}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            <option value="active">{ar ? 'نشط' : 'Active'}</option>
            <option value="disabled">{ar ? 'معطل' : 'Disabled'}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className={`border-b ${styles.borderNormal} ${styles.textMuted} font-medium`}>
              <th className="pb-3.5 pr-2">{ar ? 'العميل' : 'Customer'}</th>
              <th className="pb-3.5">{ar ? 'البريد / Discord' : 'Email / Discord'}</th>
              <th className="pb-3.5">{ar ? 'الرتبة' : 'Role'}</th>
              <th className="pb-3.5">{ar ? 'المنتجات' : 'Products'}</th>
              <th className="pb-3.5">{ar ? 'المفاتيح' : 'Keys'}</th>
              <th className="pb-3.5">{ar ? 'الحالة' : 'Status'}</th>
              <th className="pb-3.5">{ar ? 'آخر نشاط' : 'Last activity'}</th>
              <th className="pb-3.5">{ar ? 'تاريخ التسجيل' : 'Joined'}</th>
              <th className="pb-3.5">{ar ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${styles.borderNormal}`}>
            {customers.length === 0 ? <tr><td colSpan={9} className={`py-10 text-center ${styles.textMuted}`}>{ar ? 'لا يوجد عملاء مطابقون' : 'No matching customers.'}</td></tr> : customers.map((customer) => {
              const disabled = Boolean(customer.isBanned || customer.isArchived);
              return (
                <tr key={customer.id} className={`${styles.textTitle} transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]`}>
                  <td className="flex items-center gap-2 py-3.5 pr-2 font-medium">
                    <Image
                      src={customer.image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      width={32}
                      height={32}
                      unoptimized
                      alt=""
                      className={`h-8 w-8 rounded-full border object-cover ${styles.borderNormal}`}
                      onError={(event) => { event.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                    />
                    <div>
                      <div>{customer.name || '—'}</div>
                      <div className={`font-mono text-[10px] ${styles.textLightMuted}`}>ID: {customer.id}</div>
                    </div>
                  </td>
                  <td className={`py-3.5 ${styles.textTitle}`}>
                    <div>{customer.email || (ar ? 'لا يوجد بريد' : 'No email')}</div>
                    <div className="font-mono text-[10px] text-cyan-500">Discord: {customer.discordId || '—'}</div>
                  </td>
                  <td className="py-3.5"><span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${customer.role === 'Boss' || customer.role === 'Owner' ? 'border-cyan-400/20 bg-cyan-400/[.07] text-cyan-300' : `${styles.borderNormal} ${styles.textMuted}`}`}>{customer.role || 'Customer'}</span></td>
                  <td className={`py-3.5 ${styles.textMuted}`}>{customer.productCount ?? 0}</td>
                  <td className={`py-3.5 ${styles.textMuted}`}>{customer.keyCount ?? 0}</td>
                  <td className="py-3.5"><span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${disabled ? 'border-rose-500/20 bg-rose-500/[.07] text-rose-300' : 'border-emerald-500/20 bg-emerald-500/[.07] text-emerald-300'}`}>{disabled ? (ar ? 'معطل' : 'Disabled') : (ar ? 'نشط' : 'Active')}</span></td>
                  <td className={`py-3.5 ${styles.textMuted}`}>{customer.lastActivity ? new Date(customer.lastActivity).toLocaleDateString(ar ? 'ar-SA' : 'en-US') : '—'}</td>
                  <td className={`py-3.5 ${styles.textMuted}`}>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US') : '—'}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onOpenCustomer(customer)} title={ar ? 'عرض تفاصيل العميل وإدارة اشتراكاته ومفاتيحه' : 'View customer profile and manage licenses'} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-1.5 text-[10px] font-medium text-cyan-300 transition-colors hover:bg-cyan-400/[.12]">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{canEdit ? (ar ? 'إدارة العميل' : 'Manage') : (ar ? 'عرض التفاصيل' : 'View details')}</span>
                      </button>
                      {canDisable && !disabled && <button type="button" onClick={() => onDisableCustomer(customer)} title={ar ? 'تعطيل العميل' : 'Disable customer'} className="cursor-pointer rounded-lg border border-rose-500/20 bg-rose-500/[.06] p-1.5 text-rose-300 transition-colors hover:bg-rose-500/[.12]"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[.07] pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className={styles.textMuted}>{ar ? `عرض ${from}–${to} من ${resultCount} عميل` : `Showing ${from}–${to} of ${resultCount} customers`}</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))} className={`rounded-lg border ${styles.borderNormal} px-3 py-2 disabled:opacity-40`}>{ar ? 'السابق' : 'Previous'}</button>
          <span className={styles.textMuted}>{page + 1} / {pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))} className={`rounded-lg border ${styles.borderNormal} px-3 py-2 disabled:opacity-40`}>{ar ? 'التالي' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
