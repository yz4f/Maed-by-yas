'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Check, ChevronLeft, Cpu, HardDrive, Layers, Monitor, Play, Router, Shield, Star, Wrench } from 'lucide-react';
import type { UserProduct } from '@/types';
import { articlesForProduct, GUIDE_STAGES, MAIN_VIDEO_FALLBACK } from '@/lib/guide-library';
import { BeforeStart, GuideArticleView, GuideCard, GuideDialog, GuideVideo } from './guide-ui';
import { ProductNotice } from './product-notice';
import styles from './guides.module.css';

type Progress = { last: string; steps: string[]; articles: string[]; accepted: boolean; variants: Record<string, string> };
const empty: Progress = { last: 'home', steps: [], articles: [], accepted: false, variants: {} };
function loadProgress(key: string): Progress {
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    if (!data || typeof data.last !== 'string') return empty;
    return { last: data.last, steps: Array.isArray(data.steps) ? data.steps.filter((v: unknown) => typeof v === 'string').slice(0,500) : [], articles: Array.isArray(data.articles) ? data.articles.filter((v: unknown) => typeof v === 'string').slice(0,100) : [], accepted: data.accepted === true, variants: data.variants && typeof data.variants === 'object' ? Object.fromEntries(Object.entries(data.variants).filter(([, value]) => typeof value === 'string').slice(0,30)) as Record<string, string> : {} };
  } catch { return empty; }
}
const categories = [
  { id: 'prepare', title: 'قبل التشغيل' }, { id: 'run', title: 'تشغيل المنتج' }, { id: 'finish', title: 'الاتصال والخطوات النهائية' }, { id: 'issues', title: 'حلول المشاكل' },
];

export function ProductGuideModal({ license, onClose }: { license: UserProduct; onClose: () => void }) {
  const product = license.product;
  const key = `ta3n:guide:v1:${license.userId}:${license.id}`;
  const [progress, setProgress] = useState<Progress>(() => loadProgress(key));
  const [storageFailed, setStorageFailed] = useState(false);
  const [view, setView] = useState('home');
  const [category, setCategory] = useState('prepare');
  const articles = articlesForProduct(product);
  const article = articles.find(item => item.id === view);
  const stage = view === 'before' ? 0 : view === 'main' || view === 'permanent' ? 4 : article?.stage ?? -1;
  const stageDone = GUIDE_STAGES.map((_, index) => {
    if (index === 0) return progress.accepted;
    if (index === 4) return progress.articles.includes('main');
    const matching = articles.filter(item => item.stage === index);
    return matching.length > 0 && (index === 5 ? matching.every(item => progress.articles.includes(item.id)) : matching.some(item => progress.articles.includes(item.id)));
  });
  const completedCount = stageDone.filter(Boolean).length;
  useEffect(() => {
    const frame = requestAnimationFrame(() => { try { localStorage.setItem(key, JSON.stringify(progress)); } catch { setStorageFailed(true); } });
    return () => cancelAnimationFrame(frame);
  }, [key, progress]);
  const open = (id: string) => { setView(id); if (id !== 'home') setProgress(current => ({ ...current, last: id })); };
  const canResume = progress.last !== 'home' && (['before', 'main', 'permanent', 'issues'].includes(progress.last) || articles.some(item => item.id === progress.last));
  const sectionCards = [
    { id: 'main', title: 'دليل استخدام المنتج', text: 'التعليمات الأساسية والفيديو الخاص بمنتجك.', number: '01', group: 'run', icon: Play },
    { id: 'bios', title: 'إعداد BIOS', text: 'اختر اللوحة ثم اتبع إعداداتها.', number: '02', group: 'prepare', icon: Cpu },
    { id: 'windows', title: 'تجهيز Windows', text: 'Windows 11 وWindows 10.', number: '03', group: 'prepare', icon: Monitor },
    { id: 'raid', title: 'RAID Reinstallation', text: 'إعادة التثبيت ومتطلبات الأقراص.', number: '04', group: 'prepare', icon: Layers },
    { id: 'permanent', title: 'Permanent Spoof', text: 'اختر المسار المدعوم لمنتجك.', number: '05', group: 'run', icon: Shield },
    { id: 'network', title: 'Network Unflag', text: 'إعدادات محول Ethernet.', number: '06', group: 'finish', icon: Router },
    { id: 'vpn', title: 'استخدام VPN', text: 'إعداد الاتصال حسب دليل المصدر.', number: '07', group: 'finish', icon: Shield },
    { id: 'disk', title: 'Disk Guide', text: 'إعداد VHD ومشاكل ظهور القرص.', number: '08', group: 'prepare', icon: HardDrive },
    { id: 'issues', title: 'حلول المشاكل الشائعة', text: 'التشغيل والشبكة وVisual C++.', number: '09', group: 'issues', icon: Wrench },
  ].filter(item => ['main', 'issues'].includes(item.id) || (item.id === 'permanent' ? articles.some(a => a.category === 'Permanent Spoof') : articles.some(a => a.id === item.id)));
  const nextStage = () => {
    if (stage === 3) { open('main'); return; }
    if (view === 'main' && articles.some(item => item.category === 'Permanent Spoof')) { open('permanent'); return; }
    if (view === 'network' && articles.some(item => item.id === 'vpn')) { open('vpn'); return; }
    const next = articles.find(item => item.stage > stage && !progress.articles.includes(item.id));
    open(next?.id || 'home');
  };
  return <GuideDialog title={product?.name || 'دليل المنتج'} onClose={onClose} onBack={view === 'home' ? undefined : () => open('home')} sectionKey={view}>
    <div className={styles.stack}>
      <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"><span>{stage >= 0 ? `الخطوة ${stage + 1} من 7 · ${GUIDE_STAGES[stage]}` : 'اختر قسمًا للبدء'}</span><span>أكملت {completedCount} من 7 مراحل</span></div>
        <div className={styles.progress} role="progressbar" aria-label="تقدم دليل المنتج" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={7}><div style={{ width: `${completedCount / 7 * 100}%` }} /></div>
        <nav aria-label="مراحل الدليل" className={styles.stageGrid}>{GUIDE_STAGES.map((label, index) => <button key={label} className={styles.stage} aria-current={stage === index ? 'step' : undefined} data-done={stageDone[index]} onClick={() => { const target = index === 0 ? 'before' : index === 4 ? 'main' : index === 6 ? 'issues' : articles.find(item => item.stage === index)?.id; if (target) open(target); }} disabled={![0,4,6].includes(index) && !articles.some(item => item.stage === index)}><span>{stageDone[index] ? <Check size={14} /> : index + 1}</span>{label}</button>)}</nav>
      </div>
      {storageFailed && <p className={styles.warning}>المتصفح يمنع الحفظ المحلي. سيبقى التقدم محفوظًا خلال هذه الجلسة فقط.</p>}
      {view === 'home' && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200/15 bg-cyan-200/[.04] px-3.5 py-3 text-xs text-slate-300">
          <span>😊 لا تنسَ تقييم المنتج، رأيك يهمنا.</span>
          <a href="https://t3nnn.com/ar/account/orders" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-cyan-200/25 px-2.5 py-1.5 font-semibold text-cyan-100 transition-colors hover:bg-cyan-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"><Star size={14} aria-hidden="true" />تقييم المنتج</a>
        </div>
        <ProductNotice product={product} placement="guide" />
        {canResume && <div className={`${styles.panel} flex flex-wrap items-center justify-between gap-4`}><div><h3 className="font-bold">متابعة من حيث توقفت</h3><p>يُحفظ تقدم هذا الترخيص على هذا الجهاز.</p></div><button className={styles.primary} onClick={() => open(progress.last)}>متابعة الشرح<ChevronLeft size={18} /></button></div>}
        <button className={`${styles.panel} text-start`} onClick={() => open('before')}><div className="flex items-center gap-3"><BookOpen className="text-amber-200" /><h3 className="font-bold">ابدأ هنا · المتطلبات والتنبيهات</h3>{progress.accepted && <Check className="ms-auto text-emerald-300" />}</div><p>راجع التعليمات قبل تشغيل أي شرح.</p></button>
        <div className={styles.tabs} aria-label="أقسام الدليل">{categories.map(item => <button key={item.id} className={styles.tab} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.title}</button>)}</div>
        <div className={styles.grid}>{sectionCards.filter(item => item.group === category).map(item => <button key={item.id} className={`${styles.card} text-start`} onClick={() => open(item.id)}><div className={styles.cardTop}><span className={styles.stepNumber}>{item.number}</span><item.icon size={22} className="text-cyan-200/70" /></div><h3 className="mt-5 text-base font-bold">{item.title}</h3><p className={styles.muted}>{item.text}</p><span className="mt-5 inline-flex items-center gap-2 text-xs text-cyan-100">فتح القسم<ChevronLeft size={15} /></span></button>)}</div>
      </>}
      {view === 'before' && <BeforeStart product={product} onContinue={() => { setProgress(current => ({ ...current, accepted: true })); open(articles.find(item => item.stage === 1)?.id || 'main'); }} />}
      {view === 'main' && (!progress.accepted ? <BeforeStart product={product} onContinue={() => setProgress(current => ({ ...current, accepted: true }))} /> : <div className={styles.stack}>
        <h3 className={styles.heading}>دليل استخدام {product?.name}</h3>
        {product?.videoUrl ? <GuideVideo url={product.videoUrl.includes('drive.google.com') ? MAIN_VIDEO_FALLBACK : product.videoUrl} title={product.name} image={product.guideImage || product.image} product={product} skipNotice /> : <p className={styles.warning}>لم تُضف الإدارة فيديو لهذا المنتج حتى الآن. الشروحات المكتوبة متاحة من الأقسام الأخرى.</p>}
        <section className={styles.panel}><h4>خطوات المتابعة</h4><ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-7 text-slate-300"><li>راجع المتطلبات والتنبيهات الخاصة بمنتجك.</li><li>أكمل الأقسام المناسبة لجهازك حسب شرح المنتج.</li><li>تابع الفيديو بالترتيب، ثم افتح قسم المشكلة المطابقة إن ظهر خطأ.</li></ol></section>
        <button className={styles.primary} onClick={() => { setProgress(current => ({ ...current, articles: [...new Set([...current.articles, 'main'])] })); nextStage(); }}><Check size={18} />أكملت شرح المنتج — التالي</button>
      </div>)}
      {(view === 'permanent' || view === 'issues') && <><div><h3 className={styles.heading}>{view === 'permanent' ? 'Permanent Spoof' : 'مركز حلول ومساعدة'}</h3><p className={styles.muted}>{view === 'permanent' ? 'اختر مسارًا واحدًا مطابقًا لمنتجك ولوحتك. خطوات ASUS مستقلة عن المسار العادي.' : 'اختر الرسالة المطابقة لما يظهر على جهازك.'}</p></div><div className={styles.grid}>{articles.filter(item => view === 'permanent' ? item.category === 'Permanent Spoof' : item.stage === 6).map((item, index) => <GuideCard key={item.id} article={item} number={index + 1} onOpen={() => open(item.id)} />)}</div></>}
      {article && <GuideArticleView key={article.id} article={article} product={product} savedVariant={progress.variants[article.id]} onVariant={id => setProgress(current => ({ ...current, variants: { ...current.variants, [article.id]: id } }))} completed={progress.steps} onStep={id => setProgress(current => ({ ...current, steps: [...new Set([...current.steps, id])] }))} onComplete={() => { setProgress(current => ({ ...current, articles: [...new Set([...current.articles, article.id])] })); nextStage(); }} />}
    </div>
  </GuideDialog>;
}
