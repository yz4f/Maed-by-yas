'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Send, Star, Trash2, X } from 'lucide-react';
import type { UserProduct } from '@/types';

type Props = {
  license: UserProduct;
  productImage: string;
  lang: 'ar' | 'en';
  onClose: () => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
};

async function compressScreenshot(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8_000_000) {
    throw new Error('اختر صورة JPG أو PNG أو WebP بحجم أقل من 8 MB.');
  }
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
      element.src = source;
    });
    if (image.naturalWidth * image.naturalHeight > 30_000_000) {
      throw new Error('أبعاد الصورة كبيرة جدًا. اختر لقطة أصغر.');
    }
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة.');
    context.fillStyle = '#07111d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.65, 0.52]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 650_000) return result;
    }
    throw new Error('الصورة كبيرة بعد الضغط. جرّب لقطة أصغر.');
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function ProductReviewModal({ license, productImage, lang, onClose, onNotify }: Props) {
  const ar = lang === 'ar';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [onClose, sending]);

  const chooseImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    setError('');
    try { setImage(await compressScreenshot(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر تجهيز الصورة.'); }
    finally { setImageBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const sendReview = async () => {
    if (sending || imageBusy) return;
    if (!rating) { setError(ar ? 'اختر تقييمًا من 1 إلى 10.' : 'Choose a rating from 1 to 10.'); return; }
    if (comment.trim().length < 3) { setError(ar ? 'اكتب رأيك عن الخدمة أولًا.' : 'Write a short service review first.'); return; }
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/user/product-review', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: license.id, rating, comment: comment.trim(), ...(image ? { image } : {}) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || (ar ? 'تعذر الاتصال بخدمة التقييم. حاول مجددًا بعد قليل.' : 'Could not connect to the review service. Please try again shortly.'));
      }
      onNotify(ar ? 'تم إرسال تقييمك إلى ديسكورد.' : 'Your review was sent to Discord.', 'success');
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : (ar ? 'تعذر إرسال التقييم.' : 'Could not send review.');
      setError(message);
      onNotify(message, 'error');
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" dir={ar ? 'rtl' : 'ltr'}>
      <button type="button" onClick={() => { if (!sending) onClose(); }} aria-label={ar ? 'إغلاق التقييم' : 'Close review'} className="absolute inset-0 bg-[#020712]/85 backdrop-blur-[6px]" />
      <section role="dialog" aria-modal="true" aria-labelledby="product-review-title" className="relative flex max-h-[min(92dvh,800px)] w-full max-w-xl flex-col overflow-hidden rounded-[26px] border border-cyan-200/20 bg-[#0b1725] text-white shadow-[0_30px_90px_rgba(0,0,0,.6)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.13),transparent_65%)] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100"><Star size={20} /></div>
            <div className="min-w-0"><h2 id="product-review-title" className="text-base font-black">{ar ? 'تقييم المنتج' : 'Rate product'}</h2><p className="mt-0.5 text-[11px] text-slate-400">{ar ? 'شارك تجربتك معنا مباشرة' : 'Share your experience with us'}</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label={ar ? 'إغلاق' : 'Close'} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"><X size={17} /></button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.09] bg-white/[.035] p-2.5">
            <img src={productImage} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-black/20 object-cover" />
            <div className="min-w-0"><p className="text-[10px] font-bold text-cyan-200">{ar ? 'منتجك' : 'Your product'}</p><p className="mt-1 truncate text-sm font-black">{license.product?.name || license.productId}</p></div>
            <Check size={16} className="ms-auto shrink-0 text-emerald-300" aria-hidden="true" />
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-black">{ar ? 'تقييمك للمنتج' : 'Your product rating'} <span className="text-cyan-200">{rating ? `${rating}/10` : '—/10'}</span></legend>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10" aria-label={ar ? 'التقييم من 1 إلى 10' : 'Rating from 1 to 10'}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} / 10`} aria-pressed={rating === value} className={`flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-cyan-200 ${rating === value ? 'border-cyan-200/70 bg-cyan-300 text-[#07131d]' : 'border-white/10 bg-white/[.035] text-slate-300 hover:border-cyan-200/40 hover:bg-cyan-300/10'}`}>{value}</button>
              ))}
            </div>
          </fieldset>

          <label className="block"><span className="mb-2 block text-xs font-black">{ar ? 'كلامك عن الخدمة' : 'Your thoughts about the service'}</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={800} placeholder={ar ? 'اكتب هنا تجربتك مع المنتج والخدمة...' : 'Write about your experience...'} className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-[#06101c] p-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/10" /><span className="mt-1 block text-end text-[10px] text-slate-500">{comment.length}/800</span></label>

          <div><span className="mb-2 block text-xs font-black">{ar ? 'صورة اللعبة بعد فك الباند' : 'Game screenshot after unban'} <span className="font-medium text-slate-500">{ar ? '(اختياري)' : '(optional)'}</span></span><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void chooseImage(event.target.files?.[0])} />{image ? <div className="relative overflow-hidden rounded-2xl border border-cyan-200/20 bg-black/20"><img src={image} alt={ar ? 'معاينة صورة اللعبة' : 'Game screenshot preview'} className="max-h-52 w-full object-contain" /><button type="button" onClick={() => setImage(null)} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/75 text-white hover:bg-rose-500" aria-label={ar ? 'حذف الصورة' : 'Remove image'}><Trash2 size={15} /></button></div> : <button type="button" onClick={() => fileRef.current?.click()} disabled={imageBusy} className="flex min-h-20 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-200/25 bg-cyan-300/[.035] text-xs font-bold text-cyan-100 transition hover:border-cyan-200/55 hover:bg-cyan-300/[.08] disabled:opacity-50">{imageBusy ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}{imageBusy ? (ar ? 'جارٍ تجهيز الصورة...' : 'Preparing image...') : (ar ? 'إضافة صورة اللعبة' : 'Add game screenshot')}</button>}</div>

          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-white/10 bg-black/10 px-5 py-4 sm:px-6"><button type="button" onClick={onClose} disabled={sending} className="h-11 flex-1 rounded-xl border border-white/10 text-xs font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-40">{ar ? 'إلغاء' : 'Cancel'}</button><button type="button" onClick={() => void sendReview()} disabled={sending || imageBusy || rating === 0 || comment.trim().length < 3} className="flex h-11 flex-[1.7] items-center justify-center gap-2 rounded-xl bg-cyan-300 text-xs font-black text-[#07131d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{sending ? (ar ? 'جارٍ الإرسال...' : 'Sending...') : (ar ? 'إرسال التقييم' : 'Send review')}</button></div>
      </section>
    </div>
  );
}
