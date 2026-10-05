'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, Check, CircleHelp, Download, ExternalLink, Info, Play, X } from 'lucide-react';
import type { Product } from '@/types';
import type { GuideArticle } from '@/lib/guide-library';
import { guideStepEntries } from '@/lib/guide-library';
import { ProductNotice } from './product-notice';
import styles from './guides.module.css';

function BidiText({ text }: { text: string }) {
  return <>{text.split(/([A-Za-z][A-Za-z0-9_+./:#-]*(?:[ >]+[A-Za-z0-9_+./:#-]+)*)/g).map((part, index) => /^[A-Za-z]/.test(part) ? <bdi key={index} dir="ltr">{part}</bdi> : part)}</>;
}

export function GuideDialog({ title, onClose, onBack, children, sectionKey, eyebrow = 'مركز المساعدة' }: { title: string; onClose: () => void; onBack?: () => void; children: ReactNode; sectionKey?: string; eyebrow?: string }) {
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
      if (!dialog.current?.contains(document.activeElement)) return;
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
        <div className="min-w-0 flex-1"><p className={styles.eyebrow}>{eyebrow}</p><h2 id={titleId} className="mt-1 break-words text-lg font-bold sm:text-xl">{title}</h2></div>
        {onBack && <button className={styles.iconButton} onClick={onBack} aria-label="الرجوع"><ArrowRight size={20} /></button>}
        <button className={styles.iconButton} onClick={onClose} aria-label="إغلاق الدليل"><X size={20} /></button>
      </header>
      <div ref={scroll} className={styles.scroll}>{children}</div>
    </div>
  </div>, document.body);
}

export function BeforeStart({ product }: { product?: Product; onContinue?: () => void }) {
  return <ProductNotice product={product} placement="video" />;
}

export function ImageLightbox({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return <>
    <button type="button" className={`${styles.imageButton} ${className}`} onClick={() => { if (failed) setFailed(false); else setOpen(true); }} aria-label={failed ? `إعادة تحميل الصورة: ${alt}` : `تكبير الصورة: ${alt}`}>
      {failed ? <span>تعذر تحميل الصورة — اضغط للمحاولة</span> : <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
      <span className={styles.imageHint}>تكبير الصورة</span>
    </button>
    {open && <GuideDialog title={alt} onClose={() => setOpen(false)}><img src={src} alt={alt} className={styles.lightboxImage} /></GuideDialog>}
  </>;
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
  const [mode, setMode] = useState<'poster' | 'play'>('poster');
  const [failed, setFailed] = useState(false);
  const media = videoEmbed(url);
  if (!media) return <p className={styles.warning}>رابط الفيديو غير صالح. تواصل مع الدعم.</p>;
  const poster = image || media.thumbnail;
  return <section className={styles.videoBlock}>
    {mode === 'poster' ? <button className={styles.videoPoster} onClick={() => setMode('play')} aria-label={`تشغيل شرح ${title}`}>
      {poster ? <img src={poster} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <BookOpen size={64} className="opacity-15" />}
      <span className={styles.play}><Play size={25} fill="currentColor" /></span><span className={styles.posterLabel}>{title}</span>
    </button> : <div className={styles.player}>
      {media.kind === 'iframe' ? <iframe title={title} src={media.src} allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <video src={media.src} controls playsInline preload="metadata" onError={() => setFailed(true)} />}
    </div>}
    {failed && <p className={styles.warning}>تعذّر تحميل الفيديو. أعد المحاولة أو تواصل مع الدعم.</p>}
    <div className="px-4 py-3 text-xs text-slate-400">{title} · يمكنك قراءة الخطوات المكتوبة أدناه.</div>
  </section>;
}

export function GuideArticleView({ article, product, savedVariant, onVariant }: { article: GuideArticle; completed?: string[]; onStep?: (id: string) => void; onComplete?: () => void; product?: Product; savedVariant?: string; onVariant?: (id: string) => void }) {
  const [variant, setVariant] = useState(article.variants?.some(item => item.id === savedVariant) ? savedVariant! : article.variants?.[0]?.id || '');
  const chosen = article.variants?.find(item => item.id === variant);
  const steps = guideStepEntries(article, variant);
  const video = chosen?.video || article.video;
  return <article className={styles.stack}>
    <div><p className={styles.eyebrow}>{article.category}</p><p className={styles.muted}>{article.description}</p></div>
    {article.warning && <aside className={styles.warning}><Info size={18} className="shrink-0" /><p>{article.warning}</p></aside>}
    {article.variants && <div><h4 className="mb-3 text-sm font-medium">اختر المسار المناسب</h4><div className={styles.tabs}>{article.variants.map(item => <button key={item.id} className={styles.tab} aria-pressed={variant === item.id} onClick={() => { setVariant(item.id); onVariant?.(item.id); }}><bdi>{item.label}</bdi></button>)}</div></div>}
    <div className={styles.articleLayout}>
    <div className={styles.articleMedia}>
      {article.image && <ImageLightbox src={article.image} alt={article.title} />}
      {video && <GuideVideo key={video} url={video} title={chosen?.label || article.title} product={product} />}
      {!article.image && !video && steps.find(step => step.image) && <ImageLightbox src={steps.find(step => step.image)!.image!} alt={article.title} />}
      {!article.image && !video && !steps.some(step => step.image) && <div className={styles.articlePlaceholder}><BookOpen size={44} /><span>T3N</span></div>}
    </div>
    <div className={styles.stack}>{steps.map((step, index) => <section key={step.id} id={`guide-step-${article.id}-${index}`} tabIndex={-1} aria-label={`الخطوة ${index + 1}: ${step.title}`} className={styles.step}>
      <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1"><h4 className="font-semibold"><bdi>{step.title}</bdi></h4>
        {step.path && <p dir="ltr" className={styles.path}>{step.path}</p>}
        {step.value && <div className="mt-3 text-xs text-slate-400">القيمة المطلوبة: <bdi className={styles.value} dir="ltr">{step.value}</bdi></div>}
        <p className={styles.stepText}><BidiText text={step.text} /></p>
        {step.commands?.map(command => <code key={command} dir="ltr" data-allow-copy className={`${styles.path} block select-text`}>{command}</code>)}
        {step.image && <ImageLightbox src={step.image} alt={step.title} />}
      </div>
    </section>)}</div>
    </div>
    {article.links?.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className={styles.smallButton}><Download size={16} />{link.label}</a>)}
    {article.source && <details className={styles.muted}><summary className="cursor-pointer">مرجع الشرح</summary><a className={styles.source} href={article.source} target="_blank" rel="noreferrer"><ExternalLink size={14} />المصدر الأصلي</a></details>}
  </article>;
}

export function GuideCard({ article, number, onOpen }: { article: GuideArticle; number: number; onOpen: () => void }) {
  const previewVideo = article.video || article.variants?.find(item => item.video)?.video;
  const preview = previewVideo ? videoEmbed(previewVideo) : null;
  const previewImage = article.image || article.steps.find(step => step.image)?.image || preview?.thumbnail;
  return <article className={styles.card}>
    <div className={styles.cardTop}><span className={styles.stepNumber}>{String(number).padStart(2, '0')}</span><span className={styles.eyebrow}>{article.category}</span></div>
    <div className={styles.cardPreview}>{previewImage ? <img className={styles.cardImage} src={previewImage} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <BookOpen size={28} className="text-cyan-200/45" />}{previewVideo && <span className={styles.cardPlay} aria-label="يتضمن فيديو"><Play size={19} fill="currentColor" /></span>}</div>
    <h3 className="mt-3 text-[17px] font-semibold leading-7">{article.title}</h3><p className={`${styles.muted} line-clamp-2`}>{article.description}</p>
    <button className={`${styles.smallButton} mt-auto self-start`} onClick={onOpen}><BookOpen size={16} />فتح الشرح</button>
  </article>;
}
