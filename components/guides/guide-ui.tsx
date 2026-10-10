'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, CircleHelp, Download, ExternalLink, Info, Play, ShieldCheck, X } from 'lucide-react';
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
  const closingRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => {});
  const [closing, setClosing] = useState(false);
  const reduceMotion = useReducedMotion();
  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (reduceMotion) closeRef.current();
    else setClosing(true);
  };
  requestCloseRef.current = requestClose;
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [sectionKey]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (!dialog.current?.contains(document.activeElement)) return;
      if (event.key === 'Escape') { event.preventDefault(); requestCloseRef.current(); }
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
  return createPortal(<motion.div className={styles.overlay} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }} onClick={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <motion.div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} dir="rtl" className={styles.dialog}
      initial={reduceMotion ? false : 'initial'} animate={closing ? 'closed' : 'open'}
      variants={{ initial: { opacity: 0, y: 6, scale: 0.98 }, open: { opacity: 1, y: 0, scale: 1 }, closed: { opacity: 0, y: 6, scale: 0.98 } }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      onAnimationComplete={definition => { if (definition === 'closed') closeRef.current(); }}>
      <header className={styles.header}>
        <span className={styles.icon}><CircleHelp size={23} /></span>
        <div className="min-w-0 flex-1"><p className={styles.eyebrow}>{eyebrow}</p><h2 id={titleId} className="mt-1 break-words text-lg font-bold sm:text-xl">{title}</h2></div>
        {onBack && <button className={styles.iconButton} onClick={onBack} aria-label="الرجوع"><ArrowRight size={20} /></button>}
        <button className={styles.iconButton} onClick={requestClose} aria-label="إغلاق الدليل"><X size={20} /></button>
      </header>
      <div ref={scroll} className={styles.scroll}>{children}</div>
    </motion.div>
  </motion.div>, document.body);
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

export function GuideVideo({ url, title, image, product, skipNotice = false, hideCaption = false }: { url: string; title: string; image?: string; product?: Product; skipNotice?: boolean; hideCaption?: boolean }) {
  const [mode, setMode] = useState<'poster' | 'play'>('poster');
  const [failed, setFailed] = useState(false);
  const media = videoEmbed(url);
  if (!media) return <p className={styles.warning}>رابط الفيديو غير صالح.</p>;
  const poster = image || media.thumbnail;
  return <section className={styles.videoBlock}>
    {mode === 'poster' ? <button className={styles.videoPoster} onClick={() => setMode('play')} aria-label={`تشغيل شرح ${title}`}>
      {poster ? <img src={poster} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <BookOpen size={64} className="opacity-15" />}
      <span className={styles.play}><Play size={25} fill="currentColor" /></span><span className={styles.posterLabel}>{title}</span>
    </button> : <div className={styles.player}>
      {media.kind === 'iframe' ? <iframe title={title} src={media.src} allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <video src={media.src} controls playsInline preload="metadata" onError={() => setFailed(true)} />}
    </div>}
    {failed && <p className={styles.warning}>تعذّر تحميل الفيديو. أعد المحاولة.</p>}
    {!hideCaption && <div className="px-4 py-3 text-xs text-slate-400">{title} · يمكنك قراءة الخطوات المكتوبة أدناه.</div>}
  </section>;
}

export function VpnShowcaseCard() {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-[#0f2433] via-[#0a1b27] to-[#07121b] p-5 text-center shadow-xl shadow-cyan-950/40">
      {/* Decorative ambient radial glows */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-emerald-400/10 blur-xl" />

      {/* Main VPN Emblem Logo */}
      <div className="relative my-2 flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-cyan-400/20 blur-xl animate-pulse" />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#122e40] to-[#091724] shadow-inner shadow-cyan-400/20">
          <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14">
            <defs>
              <linearGradient id="vpnShieldGrad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="1" stopColor="#0284c7" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="vpnStrokeGrad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <path
              d="M32 7L49 13.5V29C49 42.5 40 51.5 32 56C24 51.5 15 42.5 15 29V13.5L32 7Z"
              fill="url(#vpnShieldGrad)"
              stroke="url(#vpnStrokeGrad)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M32 20C28.7 20 26 22.7 26 26V29H38V26C38 22.7 35.3 20 32 20Z"
              stroke="#e0f2fe"
              strokeWidth="2.2"
            />
            <rect x="23.5" y="29" width="17" height="13" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="32" cy="35" r="2" fill="#ffffff" />
            <path d="M32 37V39" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="absolute -bottom-2.5 rounded-full border border-cyan-300/50 bg-[#081b2a] px-2.5 py-0.5 text-[11px] font-black tracking-widest text-cyan-200 shadow-md">
            VPN
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="mt-3 text-base font-bold text-white tracking-wide">
        استخدام شبكة VPN
      </h3>
      <p className="mt-1 text-xs text-slate-300/80 leading-relaxed">
        إعدادات وتوصيات الاتصال الآمن وتخطي الحظر
      </p>

      {/* Status indicator */}
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span>توصيات الحماية وتغيير المعرّفات</span>
      </div>

      {/* Feature tags */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="rounded-lg border border-cyan-400/20 bg-cyan-950/50 px-2 py-0.5 text-cyan-200">
          Stealth Protocol
        </span>
        <span className="rounded-lg border border-purple-400/20 bg-purple-950/50 px-2 py-0.5 text-purple-200">
          Residential IP
        </span>
        <span className="rounded-lg border border-sky-400/20 bg-sky-950/50 px-2 py-0.5 text-sky-200">
          Double-hop
        </span>
      </div>

      {/* Direct Service Launch Cards */}
      <div className="mt-4 w-full space-y-2.5 text-start">
        <a
          href="https://windscribe.com/features/use-for-free"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-cyan-400/30 bg-[#0a1e2d] p-3 transition-all hover:border-cyan-400 hover:bg-[#0e273a] hover:shadow-lg hover:shadow-cyan-950/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 font-extrabold text-sm shadow">
              W
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-cyan-200 flex items-center gap-1.5">
                <span>Windscribe VPN</span>
                <span className="rounded bg-cyan-400/20 px-1 py-0.2 text-[9px] font-semibold text-cyan-300">مجاني</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">وضع Stealth + Firewall Automatic</div>
            </div>
          </div>
          <ExternalLink size={15} className="text-cyan-300 group-hover:translate-x-[-2px] transition-transform shrink-0 ms-2" />
        </a>

        <a
          href="https://www.mysteriumdark.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-purple-400/30 bg-[#14122b] p-3 transition-all hover:border-purple-400 hover:bg-[#1d1a3e] hover:shadow-lg hover:shadow-purple-950/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-400/40 bg-purple-500/20 text-purple-200 font-extrabold text-sm shadow">
              M
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-purple-200 flex items-center gap-1.5">
                <span>Mysterium Dark</span>
                <span className="rounded bg-purple-400/20 px-1 py-0.2 text-[9px] font-semibold text-purple-300">لـ Rust</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">اتصال سكني Residential + Double-hop</div>
            </div>
          </div>
          <ExternalLink size={15} className="text-purple-300 group-hover:translate-x-[-2px] transition-transform shrink-0 ms-2" />
        </a>
      </div>
    </div>
  );
}

export function GuideArticleView({ article, product, savedVariant, onVariant }: { article: GuideArticle; completed?: string[]; onStep?: (id: string) => void; onComplete?: () => void; product?: Product; savedVariant?: string; onVariant?: (id: string) => void }) {
  const [variant, setVariant] = useState(article.variants?.some(item => item.id === savedVariant) ? savedVariant! : article.variants?.[0]?.id || '');
  const chosen = article.variants?.find(item => item.id === variant);
  const steps = guideStepEntries(article, variant);
  const video = chosen?.video || article.video;
  const isVpn = article.category === 'VPN' || article.id === 'vpn';
  return <article className={styles.stack}>
    <div><p className={styles.eyebrow}>{article.category}</p><p className={styles.muted}>{article.description}</p></div>
    {article.warning && <aside className={styles.warning}><Info size={18} className="shrink-0" /><p>{article.warning}</p></aside>}
    {article.variants && <div><h4 className="mb-3 text-sm font-medium">اختر المسار المناسب</h4><div className={styles.tabs}>{article.variants.map(item => <button key={item.id} className={styles.tab} aria-pressed={variant === item.id} onClick={() => { setVariant(item.id); onVariant?.(item.id); }}><bdi>{item.label}</bdi></button>)}</div></div>}
    <div className={styles.articleLayout}>
    <div className={styles.articleMedia}>
      {article.image && <ImageLightbox src={article.image} alt={article.title} />}
      {video && <GuideVideo key={video} url={video} title={chosen?.label || article.title} product={product} />}
      {!article.image && !video && steps.find(step => step.image) && <ImageLightbox src={steps.find(step => step.image)!.image!} alt={article.title} />}
      {!article.image && !video && !steps.some(step => step.image) && (
        isVpn ? <VpnShowcaseCard /> : <div className={styles.articlePlaceholder}><BookOpen size={44} /><span>T3N</span></div>
      )}
    </div>
    <div className={styles.stack}>{steps.map((step, index) => <section key={step.id} id={`guide-step-${article.id}-${index}`} tabIndex={-1} aria-label={`الخطوة ${index + 1}: ${step.title}`} className={styles.step}>
      <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1"><h4 className="font-semibold"><bdi>{step.title}</bdi></h4>
        {step.path && <p dir="ltr" className={styles.path}>{step.path}</p>}
        {step.value && <div className="mt-3 text-xs text-slate-400">القيمة المطلوبة: <bdi className={styles.value} dir="ltr">{step.value}</bdi></div>}
        <p className={styles.stepText}><BidiText text={step.text} /></p>
        {step.commands?.map(command => <code key={command} dir="ltr" data-allow-copy className={`${styles.path} block select-text`}>{command}</code>)}
        {step.links && step.links.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2">
          {step.links.map(link => {
            const isMysterium = link.url.includes('mysterium');
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isMysterium
                    ? "inline-flex items-center gap-1.5 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200 transition-colors hover:border-purple-400/60 hover:bg-purple-500/20 hover:text-white"
                    : "inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-white"
                }
              >
                <ExternalLink size={13} className="shrink-0" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>}
        {step.image && <ImageLightbox src={step.image} alt={step.title} />}
      </div>
    </section>)}</div>
    </div>
    {!isVpn && article.links && article.links.length > 0 && <div className="flex flex-wrap items-center gap-2.5 pt-2">
      {article.links.map(link => {
        const isDownload = link.url.endsWith('.exe') || link.url.includes('/download') || link.label.includes('تحميل');
        return <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.smallButton}>
          {isDownload ? <Download size={15} className="shrink-0" /> : <ExternalLink size={15} className="shrink-0" />}
          <span>{link.label}</span>
        </a>;
      })}
    </div>}
  </article>;
}

export function GuideCard({ article, number, onOpen }: { article: GuideArticle; number: number; onOpen: () => void }) {
  const previewVideo = article.video || article.variants?.find(item => item.video)?.video;
  const preview = previewVideo ? videoEmbed(previewVideo) : null;
  const previewImage = article.image || article.steps.find(step => step.image)?.image || preview?.thumbnail;
  const isVpn = article.category === 'VPN' || article.id === 'vpn';
  return <article className={styles.card}>
    <div className={styles.cardTop}><span className={styles.stepNumber}>{String(number).padStart(2, '0')}</span><span className={styles.eyebrow}>{article.category}</span></div>
    <div className={styles.cardPreview}>
      {previewImage ? (
        <img className={styles.cardImage} src={previewImage} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} />
      ) : isVpn ? (
        <div className="flex flex-col items-center justify-center gap-2 text-cyan-300">
          <ShieldCheck size={40} className="text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
          <span className="rounded-full border border-cyan-400/40 bg-cyan-950/60 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-cyan-200">VPN</span>
        </div>
      ) : (
        <BookOpen size={28} className="text-cyan-200/45" />
      )}
      {previewVideo && <span className={styles.cardPlay} aria-label="يتضمن فيديو"><Play size={19} fill="currentColor" /></span>}
    </div>
    <h3 className="mt-3 text-[17px] font-semibold leading-7">{article.title}</h3><p className={`${styles.muted} line-clamp-2`}>{article.description}</p>
    <button className={`${styles.smallButton} mt-auto self-start`} onClick={onOpen}><BookOpen size={16} />فتح الشرح</button>
  </article>;
}
