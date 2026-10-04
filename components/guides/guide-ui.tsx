'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, Check, ChevronLeft, CircleHelp, Download, ExternalLink, Info, Play, X } from 'lucide-react';
import type { Product } from '@/types';
import type { GuideArticle } from '@/lib/guide-library';
import { guideStepEntries } from '@/lib/guide-library';
import { ProductNotice } from './product-notice';
import styles from './guides.module.css';

function BidiText({ text }: { text: string }) {
  return <>{text.split(/([A-Za-z][A-Za-z0-9_+./:#-]*(?:[ >]+[A-Za-z0-9_+./:#-]+)*)/g).map((part, index) => /^[A-Za-z]/.test(part) ? <bdi key={index} dir="ltr">{part}</bdi> : part)}</>;
}

export function GuideDialog({ title, onClose, onBack, children, sectionKey }: { title: string; onClose: () => void; onBack?: () => void; children: ReactNode; sectionKey?: string }) {
  const dialog = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [sectionKey]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select, textarea, video[controls], iframe, [tabindex="0"]') || []).filter(node => node.getClientRects().length);
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<div className={styles.overlay} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} dir="rtl" className={styles.dialog}>
      <header className={styles.header}>
        <span className={styles.icon}><CircleHelp size={23} /></span>
        <div className="min-w-0 flex-1"><p className={styles.eyebrow}>تعن / مركز الشروحات</p><h2 id={titleId} className="mt-1 break-words text-lg font-bold sm:text-xl">{title}</h2></div>
        {onBack && <button className={styles.iconButton} onClick={onBack} aria-label="الرجوع"><ArrowRight size={20} /></button>}
        <button className={styles.iconButton} onClick={onClose} aria-label="إغلاق الدليل"><X size={20} /></button>
      </header>
      <div ref={scroll} className={styles.scroll}>{children}</div>
    </div>
  </div>, document.body);
}

export function BeforeStart({ product, onContinue }: { product?: Product; onContinue: () => void }) {
  const [seconds, setSeconds] = useState(5);
  const [read, setRead] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, []);
  return <section className={styles.stack}>
    <div><p className={styles.eyebrow}>قبل تشغيل الشرح</p><h3 className={styles.heading}>مهم قبل البدء</h3></div>
    <ProductNotice product={product} placement="video" />
    <div className={styles.twoColumns}>
      <section className={styles.panel}><h4>الدعم الفني</h4><p>راجع الخطوات بالترتيب. عند وجود خطأ متعلق بالمنتج، أرسل للدعم اسم المنتج وصورة واضحة للمشكلة. احتفظ بمفتاحك ولا تشاركه.</p></section>
      <section className={styles.panel}><h4>توافق اللوحة الأم والمتطلبات</h4><p>اختر مسار جهازك فقط. قد تختلف الخيارات بين اللوحات. جهّز USB ونسخة Windows المناسبة عندما يتطلب شرح منتجك ذلك. لا يمكن ضمان توافق كل جهاز.</p></section>
    </div>
    <label className={styles.checkLabel}><input type="checkbox" checked={read} onChange={event => setRead(event.target.checked)} /><span>قرأت التعليمات والمتطلبات وأفهم تنبيهات المنتج.</span></label>
    <button className={styles.primary} disabled={!read || seconds > 0} onClick={onContinue}>{seconds > 0 ? `يمكنك المتابعة بعد ${seconds} ثوانٍ` : 'أوافق وأريد المتابعة'}<ChevronLeft size={18} /></button>
  </section>;
}

export function videoEmbed(url: string): { kind: 'iframe' | 'video'; src: string; thumbnail?: string } | null {
  if (url.startsWith('/') && !url.startsWith('//')) return { kind: 'video', src: url };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.replace(/^www\./, '');
    if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? parsed.pathname.split('/')[1] : parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }
    if (host === 'streamable.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id && /^[\w-]+$/.test(id) ? { kind: 'iframe', src: `https://streamable.com/e/${id}` } : null;
    }
    if (host === 'drive.google.com') {
      const id = parsed.pathname.match(/\/d\/([\w-]+)/)?.[1] || parsed.searchParams.get('id');
      return id ? { kind: 'iframe', src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` } : null;
    }
    return { kind: 'video', src: url };
  } catch { return null; }
}

export function GuideVideo({ url, title, image, product, skipNotice = false }: { url: string; title: string; image?: string; product?: Product; skipNotice?: boolean }) {
  const [mode, setMode] = useState<'poster' | 'notice' | 'play'>('poster');
  const [failed, setFailed] = useState(false);
  const media = videoEmbed(url);
  if (!media) return <p className={styles.warning}>رابط الفيديو غير صالح. تواصل مع الدعم.</p>;
  if (mode === 'notice') return <BeforeStart product={product} onContinue={() => setMode('play')} />;
  const poster = image || media.thumbnail;
  return <section className={styles.videoBlock}>
    {mode === 'poster' ? <button className={styles.videoPoster} onClick={() => setMode(product && !skipNotice ? 'notice' : 'play')} aria-label={`تشغيل شرح ${title}`}>
      {poster ? <img src={poster} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <BookOpen size={64} className="opacity-15" />}
      <span className={styles.play}><Play size={25} fill="currentColor" /></span><span className={styles.posterLabel}>{title}</span>
    </button> : <div className={styles.player}>
      {media.kind === 'iframe' ? <iframe title={title} src={media.src} allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <video src={media.src} controls playsInline preload="metadata" onError={() => setFailed(true)} />}
    </div>}
    {failed && <p className={styles.warning}>تعذّر تحميل الفيديو. أعد المحاولة أو تواصل مع الدعم.</p>}
    <div className="px-4 py-3 text-xs text-slate-400">{title} · يمكنك قراءة الخطوات المكتوبة أدناه.</div>
  </section>;
}

export function GuideArticleView({ article, completed = [], onStep, onComplete, product, savedVariant, onVariant }: { article: GuideArticle; completed?: string[]; onStep?: (id: string) => void; onComplete?: () => void; product?: Product; savedVariant?: string; onVariant?: (id: string) => void }) {
  const [variant, setVariant] = useState(article.variants?.some(item => item.id === savedVariant) ? savedVariant! : article.variants?.[0]?.id || '');
  const [localDone, setLocalDone] = useState<string[]>([]);
  const chosen = article.variants?.find(item => item.id === variant);
  const steps = guideStepEntries(article, variant);
  const done = onStep ? completed : localDone;
  const stepKey = (index: number) => steps[index].id;
  const nextIndex = steps.findIndex((_, index) => !done.includes(stepKey(index)));
  const video = chosen?.video || article.video;
  return <article className={styles.stack}>
    <div><p className={styles.eyebrow}>{article.category}</p><h3 className={styles.heading}>{article.title}</h3><p className={styles.muted}>{article.description}</p></div>
    {article.warning && <aside className={styles.warning}><Info size={20} className="shrink-0" /><p>{article.warning}</p></aside>}
    {article.variants && <div><h4 className="mb-3 text-sm font-semibold">اختر المسار المناسب</h4><div className={article.id === 'windows' ? styles.twoColumns : styles.tabs}>{article.variants.map(item => <button key={item.id} className={article.id === 'windows' ? styles.variantCard : styles.tab} aria-pressed={variant === item.id} onClick={() => { setVariant(item.id); onVariant?.(item.id); }}><span dir="ltr">{item.label}</span>{article.id === 'windows' && <><img src={videoEmbed(item.video || '')?.thumbnail} alt="" loading="lazy" className="my-3 aspect-video w-full rounded-xl object-cover" /><span className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Play size={14} />شرح تجهيز الفلاش · مشاهدة داخل الموقع</span></>}</button>)}</div></div>}
    {video && <GuideVideo key={video} url={video} title={chosen?.label || article.title} image={article.image} product={product} />}
    {!video && article.image && <img className={styles.referenceImage} src={article.image} alt={`صورة توضيحية: ${article.title}`} loading="lazy" />}
    <div className="flex items-center justify-between gap-3"><h4 className="font-bold">الحل خطوة بخطوة</h4><span dir="ltr" className={styles.muted}>{steps.filter((_, index) => done.includes(stepKey(index))).length} / {steps.length}</span></div>
    <div className={styles.stack}>{steps.map((step, index) => {
      const id = stepKey(index); const checked = done.includes(id);
      return <section key={id} id={`guide-step-${article.id}-${index}`} tabIndex={-1} aria-label={`الخطوة ${index + 1}: ${step.title}`} className={styles.step} data-current={nextIndex === index}>
        <span className={styles.stepNumber} data-done={checked}>{checked ? <Check size={18} /> : String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1"><h5 className="font-bold"><bdi>{step.title}</bdi></h5>
          {step.path && <p dir="ltr" className={styles.path}>{step.path}</p>}
          {step.value && <div className="mt-3 text-xs text-slate-400">القيمة المطلوبة: <bdi className={styles.value} dir="ltr">{step.value}</bdi></div>}
          <p className={styles.stepText}><BidiText text={step.text} /></p>
          {step.commands?.map(command => <code key={command} dir="ltr" data-allow-copy className={`${styles.path} block select-text`}>{command}</code>)}
          {step.image && <img src={step.image} alt={step.title} loading="lazy" className={`${styles.referenceImage} my-4`} />}
          <button className={styles.smallButton} aria-pressed={checked} disabled={checked} onClick={() => { if (onStep) onStep(id); else setLocalDone(current => [...current, id]); const next = document.getElementById(`guide-step-${article.id}-${index + 1}`); next?.focus({ preventScroll: true }); next?.scrollIntoView({ behavior: 'auto', block: 'nearest' }); }}>{checked ? 'تم تنفيذ الخطوة' : 'تم تنفيذ الخطوة — التالي'}<Check size={16} /></button>
        </div>
      </section>;
    })}</div>
    {article.links?.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className={styles.primary}><Download size={18} />{link.label}</a>)}
    {onComplete && <button className={styles.primary} disabled={nextIndex !== -1} onClick={onComplete}><Check size={18} />أكملت هذا الشرح — متابعة</button>}
    {article.source && <a className={styles.source} href={article.source} target="_blank" rel="noreferrer"><ExternalLink size={14} />المصدر الأصلي · ملخص عربي للخطوات</a>}
  </article>;
}

export function GuideCard({ article, number, onOpen }: { article: GuideArticle; number: number; onOpen: () => void }) {
  return <article className={styles.card}>
    <div className={styles.cardTop}><span className={styles.stepNumber}>{String(number).padStart(2, '0')}</span><span className={styles.eyebrow}>{article.category}</span></div>
    {article.image && <img className={styles.cardImage} src={article.image} alt={article.title} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} />}
    <h3 className="mt-4 text-base font-bold leading-7">{article.title}</h3><p className={styles.muted}>{article.description}</p>
    <div className="mt-auto flex flex-wrap gap-2 pt-5"><button className={styles.smallButton} onClick={onOpen}><BookOpen size={16} />الحل خطوة بخطوة</button>{(article.video || article.variants?.some(item => item.video)) && <button className={styles.smallButton} onClick={onOpen}><Play size={16} />مشاهدة الشرح</button>}</div>
  </article>;
}
