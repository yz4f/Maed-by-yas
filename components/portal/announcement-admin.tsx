'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import type { Announcement, AnnouncementAudience, AnnouncementType } from '@/lib/announcements';
import type { Product } from '@/types';

type Form = {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: AnnouncementType;
  audienceType: AnnouncementAudience;
  audienceValue: string;
  startsAt: string;
  expiresAt: string;
  pinned: boolean;
  dismissible: boolean;
  priority: number;
};
type PublishPreview = { announcement: Announcement; recipientCount: number };

const localDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const blank = (): Form => ({
  id: crypto.randomUUID(),
  titleAr: '',
  titleEn: '',
  contentAr: '',
  contentEn: '',
  type: 'INFO',
  audienceType: 'ALL',
  audienceValue: '',
  startsAt: localDateTime(new Date(Date.now() - 60_000).toISOString()),
  expiresAt: '',
  pinned: false,
  dismissible: true,
  priority: 50,
});

async function postAnnouncement(payload: unknown) {
  const response = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ الإجراء.');
  return data;
}

export function AnnouncementAdmin({
  lang,
  products,
  onNotify,
  canCreate,
  canPublish,
  canDelete,
}: {
  lang: string;
  products: Product[];
  onNotify: (message: string, type?: 'success' | 'error') => void;
  canCreate: boolean;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);
  const [pendingPublish, setPendingPublish] = useState<PublishPreview | null>(null);
  const ar = lang === 'ar';

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/announcements', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems(data.announcements || []);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : (ar ? 'تعذر تحميل الإعلانات.' : 'Could not load announcements.'), 'error');
    } finally {
      setBusy(false);
    }
  }, [ar, onNotify]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveDraft() {
    if (!form) return;
    setSaving(true);
    try {
      await postAnnouncement({
        action: 'save',
        announcement: {
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        },
      });
      onNotify(ar ? 'تم حفظ المسودة.' : 'Draft saved.');
      setForm(null);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : (ar ? 'تعذر حفظ المسودة.' : 'Could not save the draft.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function previewPublish(announcement: Announcement) {
    setSaving(true);
    try {
      const data = await postAnnouncement({
        action: 'estimate',
        audienceType: announcement.audienceType,
        audienceValue: announcement.audienceValue,
      });
      setPendingPublish({ announcement, recipientCount: Number(data.recipientCount) || 0 });
    } catch (error) {
      onNotify(error instanceof Error ? error.message : (ar ? 'تعذر حساب المستلمين.' : 'Could not estimate recipients.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: 'publish' | 'archive' | 'delete', announcement: Announcement) {
    setSaving(true);
    try {
      await postAnnouncement({ action, id: announcement.id });
      onNotify(ar ? 'تم تحديث الإعلان.' : 'Announcement updated.');
      setPendingDelete(null);
      setPendingPublish(null);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : (ar ? 'تعذر تنفيذ الإجراء.' : 'Could not complete the action.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = (status: string) => ({
    DRAFT: ar ? 'مسودة' : 'Draft',
    ACTIVE: ar ? 'نشط' : 'Active',
    SCHEDULED: ar ? 'مجدول' : 'Scheduled',
    EXPIRED: ar ? 'منتهي' : 'Expired',
    ARCHIVED: ar ? 'مؤرشف' : 'Archived',
  } as Record<string, string>)[status] || status;
  const field = 'w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm outline-none focus:border-cyan-300/50';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Megaphone size={19} />{ar ? 'الإعلانات والبث' : 'Announcements & Broadcast'}</h2>
          <p className="mt-1 text-xs opacity-60">{ar ? 'إعلانات موجهة ومجدولة مع حالة قراءة محفوظة لكل عميل.' : 'Targeted, scheduled announcements with per-customer read state.'}</p>
        </div>
        {canCreate && <button type="button" onClick={() => setForm(blank())} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950"><Plus size={15} />{ar ? 'إعلان جديد' : 'New announcement'}</button>}
      </div>

      {form && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs"><span>العنوان بالعربية</span><input dir="rtl" className={field} value={form.titleAr} maxLength={120} onChange={(event) => setForm({ ...form, titleAr: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>Title in English</span><input dir="ltr" className={field} value={form.titleEn} maxLength={120} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>{ar ? 'النوع' : 'Type'}</span><select className={field} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AnnouncementType })}><option value="INFO">{ar ? 'معلومات' : 'Information'}</option><option value="WARNING">{ar ? 'تنبيه' : 'Warning'}</option><option value="UPDATE">{ar ? 'تحديث' : 'Update'}</option><option value="IMPORTANT">{ar ? 'مهم' : 'Important'}</option></select></label>
            <label className="space-y-1 text-xs"><span>المحتوى بالعربية</span><textarea dir="rtl" className={`${field} min-h-24`} value={form.contentAr} maxLength={4000} onChange={(event) => setForm({ ...form, contentAr: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>Content in English</span><textarea dir="ltr" className={`${field} min-h-24`} value={form.contentEn} maxLength={4000} onChange={(event) => setForm({ ...form, contentEn: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>{ar ? 'المستلمون' : 'Audience'}</span><select className={field} value={form.audienceType} onChange={(event) => setForm({ ...form, audienceType: event.target.value as AnnouncementAudience, audienceValue: '' })}><option value="ALL">{ar ? 'الجميع' : 'Everyone'}</option><option value="ACTIVE">{ar ? 'النشطون آخر 30 يوماً' : 'Active in the last 30 days'}</option><option value="PRODUCT">{ar ? 'مالكو منتج' : 'Product owners'}</option><option value="ROLE">{ar ? 'حسب الدور' : 'By role'}</option><option value="USER">{ar ? 'مستخدم محدد' : 'Specific user'}</option></select></label>
            {form.audienceType === 'PRODUCT' && <label className="space-y-1 text-xs"><span>{ar ? 'المنتج' : 'Product'}</span><select className={field} value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })}><option value="">—</option>{products.filter((product) => !product.isArchived).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}
            {form.audienceType === 'ROLE' && <label className="space-y-1 text-xs"><span>{ar ? 'الدور' : 'Role'}</span><select className={field} value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })}><option value="">—</option>{['Customer', 'Staff', 'Moderator', 'Admin', 'Owner'].map((role) => <option key={role}>{role}</option>)}</select></label>}
            {form.audienceType === 'USER' && <label className="space-y-1 text-xs"><span>{ar ? 'معرف Discord للمستخدم' : 'User Discord ID'}</span><input className={field} value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })} /></label>}
            <label className="space-y-1 text-xs"><span>{ar ? 'تاريخ البداية' : 'Starts at'}</span><input type="datetime-local" className={field} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>{ar ? 'تاريخ الانتهاء (اختياري)' : 'Expires at (optional)'}</span><input type="datetime-local" className={field} value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
            <label className="space-y-1 text-xs"><span>{ar ? 'الأولوية 0–100' : 'Priority 0–100'}</span><input type="number" min="0" max="100" className={field} value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} /></label>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:col-span-2">
              <label className="flex gap-2"><input type="checkbox" checked={form.pinned} onChange={(event) => setForm({ ...form, pinned: event.target.checked })} />{ar ? 'مثبّت' : 'Pinned'}</label>
              <label className="flex gap-2"><input type="checkbox" checked={form.dismissible} onChange={(event) => setForm({ ...form, dismissible: event.target.checked })} />{ar ? 'قابل للإخفاء' : 'Dismissible'}</label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="button" disabled={saving} onClick={() => void saveDraft()} className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{ar ? 'حفظ كمسودة' : 'Save draft'}</button>
          </div>
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {busy ? <p className="p-5 text-sm opacity-60">…</p> : items.length === 0 ? <p className="p-6 text-center text-sm opacity-60">{ar ? 'لا توجد إعلانات' : 'No announcements yet.'}</p> : items.map((item) => (
          <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] p-4 last:border-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{ar ? item.titleAr : item.titleEn}</strong><span className="rounded-full bg-white/[.07] px-2 py-1 text-[10px]">{statusLabel(item.status)}</span><span className="text-[10px] opacity-60">{item.audienceType}{item.audienceValue ? ` · ${item.audienceValue}` : ''} · P{item.priority}</span></div>
              <p className="mt-1 max-w-3xl truncate text-xs opacity-60">{ar ? item.contentAr : item.contentEn}</p>
              <p className="mt-1 text-[10px] opacity-50">{ar ? 'بواسطة' : 'By'} {item.createdByName} · {ar ? 'أُنشئ' : 'Created'} {new Date(item.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')} {item.publishedAt && <>· {ar ? 'نُشر' : 'Published'} {new Date(item.publishedAt).toLocaleString(ar ? 'ar-SA' : 'en-US')}</>} {item.status !== 'DRAFT' && <>· {ar ? 'المستهدفون' : 'Recipients'} {Number(item.recipientCount || 0).toLocaleString(ar ? 'ar-SA' : 'en-US')} · {ar ? 'المشاهدات' : 'Views'} {Number(item.readCount || 0).toLocaleString(ar ? 'ar-SA' : 'en-US')}</>}</p>
            </div>
            <div className="flex gap-1">
              {item.status !== 'ARCHIVED' && item.status !== 'EXPIRED' && canCreate && <button type="button" title={ar ? 'تعديل' : 'Edit'} onClick={() => setForm({ ...item, startsAt: localDateTime(item.startsAt), expiresAt: item.expiresAt ? localDateTime(item.expiresAt) : '' })} className="rounded-lg p-2 hover:bg-white/10"><Pencil size={15} /></button>}
              {item.status === 'DRAFT' && canPublish && <button type="button" title={ar ? 'معاينة المستلمين ثم النشر' : 'Preview recipients and publish'} disabled={saving} onClick={() => void previewPublish(item)} className="rounded-lg p-2 text-cyan-300 hover:bg-white/10 disabled:opacity-50"><Send size={15} /></button>}
              {item.status !== 'ARCHIVED' && canDelete && <button type="button" title={ar ? 'أرشفة' : 'Archive'} disabled={saving} onClick={() => void runAction('archive', item)} className="rounded-lg p-2 opacity-60 hover:bg-white/10 disabled:opacity-50"><Archive size={15} /></button>}
              {canDelete && <button type="button" title={ar ? 'حذف' : 'Delete'} disabled={saving} onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-rose-300/70 hover:bg-white/10 disabled:opacity-50"><Trash2 size={15} /></button>}
            </div>
          </article>
        ))}
      </div>

      {(pendingPublish || pendingDelete) && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setPendingDelete(null); setPendingPublish(null); } }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="announcement-confirm-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            {pendingPublish ? <>
              <h3 id="announcement-confirm-title" className="text-base font-semibold">{ar ? 'معاينة الإعلان قبل النشر' : 'Review announcement before publishing'}</h3>
              <p className="mt-2 text-sm opacity-75">{pendingPublish.announcement.audienceType === 'ALL' ? (ar ? 'سيصل هذا الإعلان إلى جميع المستخدمين.' : 'This announcement will be sent to all users.') : (ar ? 'المستلمون المتوقعون:' : 'Expected recipients:')} <strong>{pendingPublish.recipientCount.toLocaleString(ar ? 'ar-SA' : 'en-US')}</strong></p>
              <p className="mt-2 text-xs opacity-60">{ar ? pendingPublish.announcement.titleAr : pendingPublish.announcement.titleEn}</p>
              <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setPendingPublish(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs">{ar ? 'مراجعة لاحقاً' : 'Review later'}</button><button type="button" disabled={saving} onClick={() => void runAction('publish', pendingPublish.announcement)} className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{ar ? 'تأكيد النشر' : 'Confirm publish'}</button></div>
            </> : pendingDelete && <>
              <h3 id="announcement-confirm-title" className="text-base font-semibold">{ar ? 'حذف الإعلان' : 'Delete announcement'}</h3>
              <p className="mt-2 text-sm opacity-70">{ar ? `هل تريد حذف «${pendingDelete.titleAr}» نهائياً؟` : `Permanently delete “${pendingDelete.titleEn}”? `}</p>
              <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setPendingDelete(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs">{ar ? 'إلغاء' : 'Cancel'}</button><button type="button" disabled={saving} onClick={() => void runAction('delete', pendingDelete)} className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{ar ? 'حذف نهائي' : 'Delete permanently'}</button></div>
            </>}
          </section>
        </div>
      )}
    </div>
  );
}
