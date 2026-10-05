'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, Cpu, HardDrive, KeyRound, Layers, LifeBuoy, Monitor, Network, Search, ShieldCheck, Wrench, X } from 'lucide-react';
import { GUIDE_ARTICLES, matchesGuide, normalizeGuideSearch, type GuideArticle } from '@/lib/guide-library';
import { GuideArticleView, GuideCard, GuideDialog, ImageLightbox } from '@/components/guides/guide-ui';
import { ProductNotice } from '@/components/guides/product-notice';
import type { FaqCategory, FaqItem, Product } from '@/types';
import css from '@/components/guides/guides.module.css';

interface HelpCenterProps { lang: 'ar' | 'en'; isDark: boolean; products?: Product[]; onNavigateTab?: (tab: string) => void; initialCategoryId?: string | null }
const sections = [
  { id:'Windows', label:'Windows', text:'التثبيت وتجهيز النظام', icon:Monitor },
  { id:'BIOS', label:'BIOS', text:'إعدادات اللوحة الأم', icon:Cpu },
  { id:'RAID', label:'RAID', text:'إعداد وتجهيز RAID', icon:Layers },
  { id:'Network', label:'Network', text:'الشبكة والاتصال', icon:Network },
  { id:'VPN', label:'VPN', text:'إعداد الاتصال', icon:ShieldCheck },
  { id:'Disk', label:'Disk', text:'الأقراص والتقسيمات', icon:HardDrive },
  { id:'Visual C++', label:'Visual C++', text:'المكتبات المطلوبة', icon:Wrench },
  { id:'تشغيل البرنامج', label:'تشغيل البرنامج', text:'التشغيل والقائمة', icon:BookOpen },
  { id:'Permanent Spoof', label:'Permanent Spoof', text:'إعدادات Permanent', icon:ShieldCheck },
  { id:'أخطاء البرنامج', label:'أخطاء البرنامج', text:'حلول الأخطاء الشائعة', icon:Wrench },
  { id:'admin', label:'الإدارة', text:'الحساب والمفاتيح', icon:KeyRound },
];
const rank = ['windows','bios','network','vpn','disk','raid','menu','normal','asus','runtime','connection','clock'];
const articles = [...GUIDE_ARTICLES].sort((a,b) => rank.indexOf(a.id)-rank.indexOf(b.id));

function FaqAnswer({ text }: { text: string }) {
  return <div className="space-y-2.5">{text.split('\n').map((line, index) => {
    const value = line.trim();
    if (!value) return <div key={index} className="h-1" />;
    const step = value.match(/^(\d+)\.\s*(.+)$/);
    if (step) return <div key={index} className="flex items-start gap-2"><span className={css.stepNumber}>{step[1]}</span><span>{step[2]}</span></div>;
    if (value.startsWith('- ') || value.startsWith('• ')) return <div key={index} className="flex items-start gap-2"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" /><span>{value.slice(2)}</span></div>;
    if (/^\[warning\]|^(تنبيه|تحذير|ملاحظة):/i.test(value)) return <aside key={index} className={css.warning}><AlertTriangle size={16} className="shrink-0" /><span>{value.replace(/^\[warning\]\s*/i, '')}</span></aside>;
    return <p key={index}>{value}</p>;
  })}</div>;
}

export function HelpCenter({lang, products=[], onNavigateTab, initialCategoryId}:HelpCenterProps) {
  const ar=lang==='ar';
  const [faqs,setFaqs]=useState<FaqItem[]>([]);
  const [categories,setCategories]=useState<FaqCategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState(initialCategoryId ? `admin:${initialCategoryId}` : 'all');
  const [more,setMore]=useState(false);
  const [article,setArticle]=useState<GuideArticle|null>(null);
  const [openFaq,setOpenFaq]=useState<string|null>(null);
  const [sort,setSort]=useState('order');
  const viewed=useRef(new Set<string>());
  const resultHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    const controller=new AbortController();
    Promise.all([fetch('/api/help/faqs',{cache:'no-store',signal:controller.signal}),fetch('/api/help/categories',{cache:'no-store',signal:controller.signal})])
      .then(async([faqResponse,categoryResponse])=>{
        const [faqData,categoryData]=await Promise.all([faqResponse.json(),categoryResponse.json()]);
        if(!faqResponse.ok||!faqData.success||!Array.isArray(faqData.faqs))throw new Error('FAQ request failed');
        if(controller.signal.aborted)return;
        setFaqs(faqData.faqs);setCategories(Array.isArray(categoryData.categories)?categoryData.categories:[]);setError(false);
      }).catch(()=>{if(!controller.signal.aborted)setError(true)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[retry]);
  const filteredArticles=useMemo(()=>articles.filter(item=>(category==='all'||item.category===category)&&matchesGuide(item,query)),[category,query]);
  const filteredFaqs=useMemo(()=>faqs.filter(f=>{
    if(category!=='all'&&category!=='admin'&&category!==`admin:${f.category_id}`)return false;
    const value=[f.question_ar,f.question_en,f.answer_ar,f.answer_en,...(f.keywords||[])].join(' ');
    return normalizeGuideSearch(value).includes(normalizeGuideSearch(query));
  }).sort((a,b)=>sort==='views'?(b.views||0)-(a.views||0):sort==='latest'?new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime():Number(b.is_pinned)-Number(a.is_pinned)||a.sort_order-b.sort_order),[faqs,category,query,sort]);
  useEffect(()=>{
    if(query.trim().length<2)return;
    const timer=setTimeout(()=>{void fetch('/api/help/search-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:query.trim(),resultsCount:filteredArticles.length+filteredFaqs.length,lang})}).catch(()=>{})},400);
    return()=>clearTimeout(timer);
  },[query,filteredArticles.length,filteredFaqs.length,lang]);
  const select=(id:string)=>{setCategory(id);setOpenFaq(null);setMore(false)};
  const toggleFaq=(id:string)=>{
    setOpenFaq(current=>current===id?null:id);
    if(!viewed.current.has(id)){viewed.current.add(id);void fetch(`/api/help/faqs/${encodeURIComponent(id)}/view`,{method:'POST'}).catch(()=>{})}
  };
  const chips=[{id:'all',label:ar?'الكل':'All'},...sections.slice(0,4),sections[7],sections[8]];
  return <section dir={ar?'rtl':'ltr'} className={`${css.hub} ${css.stack}`}>
    <header className={css.helpHeader}><div><h2>{ar?'مركز المساعدة':'Help center'}</h2><p>{ar?'ابحث عن المشكلة أو اختر القسم المناسب.':'Search for an issue or choose a category.'}</p></div>{onNavigateTab&&<button className={css.smallButton} onClick={()=>onNavigateTab('my-products')}><BookOpen size={17}/>{ar?'دليل منتجك في «منتجاتي»':'Find your product guide in My products'}</button>}</header>
    <label className={css.search} style={{marginTop:0}}><Search size={19}/><span className="sr-only">{ar?'ابحث عن مشكلتك':'Search help'}</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ar?'ابحث عن مشكلتك... Windows، BIOS، RAID، Network':'Search... Windows, BIOS, RAID, Network'}/>{query&&<button aria-label={ar?'مسح البحث':'Clear search'} onClick={()=>setQuery('')}><X size={18}/></button>}</label>
    <div className={css.filterBar}><nav className={css.filterRail} aria-label="تصنيفات مركز المساعدة">{chips.map(item=><button key={item.id} className={css.tab} aria-pressed={category===item.id} onClick={()=>select(item.id)}>{item.label}</button>)}<button className={css.tab} aria-expanded={more} aria-controls="help-more-categories" aria-pressed={more || !chips.some(item=>item.id===category)} onClick={()=>setMore(!more)}>المزيد<ChevronDown size={14}/></button></nav>
    {more&&<div id="help-more-categories" className={css.filterMenu}>{sections.filter(s=>!chips.some(c=>c.id===s.id)).map(item=><button key={item.id} className={css.tab} aria-pressed={category===item.id} onClick={()=>select(item.id)}>{item.label}</button>)}{categories.map(item=><button key={item.id} className={css.tab} aria-pressed={category===`admin:${item.id}`} onClick={()=>select(`admin:${item.id}`)}>{ar?item.name_ar:item.name_en}</button>)}</div>}</div>
    {!query&&category==='all'&&<details open className={css.stack}><summary className="mb-3 cursor-pointer text-sm font-semibold">الأقسام</summary><div className={css.categoryGrid}>{sections.map(item=><button key={item.id} className={css.categoryCard} onClick={()=>{select(item.id);resultHeading.current?.scrollIntoView({block:'start'})}}><item.icon size={19} strokeWidth={1.7}/><div><strong>{item.label}</strong><p>{item.text}</p><small>{item.id==='admin'?faqs.length:articles.filter(a=>a.category===item.id).length} {item.id==='admin'?'أسئلة':'شروحات'}</small></div></button>)}</div></details>}
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 ref={resultHeading} className="text-lg font-semibold">{ar?'مكتبة الشروحات والحلول':'Guides and solutions'}</h3><span role="status" className={css.muted}>{filteredArticles.length+filteredFaqs.length} {ar?'نتيجة':'results'}</span></div>
    {filteredArticles.length>0&&<div className={filteredArticles.length===1?css.singleResult:css.grid}>{filteredArticles.map(item=><GuideCard key={item.id} article={item} number={articles.indexOf(item)+1} onOpen={()=>setArticle(item)}/>)}</div>}
    {(category==='all'||category.startsWith('admin'))&&<>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{ar?'أسئلة الحساب والمنتجات':'Account and product questions'}</h3><label className="text-xs text-slate-400">{ar?'الترتيب: ':'Sort: '}<select className="rounded-lg border border-white/15 bg-[#101e29] p-2 text-slate-200" value={sort} onChange={e=>setSort(e.target.value)}><option value="order">{ar?'ترتيب الإدارة':'Default'}</option><option value="views">{ar?'الأكثر مشاهدة':'Most viewed'}</option><option value="latest">{ar?'آخر الإضافات':'Latest'}</option></select></label></div>
      {loading&&<p role="status" className={css.muted}>جارٍ تحميل الأسئلة…</p>}
      {error&&<div className={css.warning}>تعذر تحميل الأسئلة.<button className={css.smallButton} onClick={()=>{setLoading(true);setRetry(v=>v+1)}}>إعادة المحاولة</button></div>}
      {filteredFaqs.length>0&&<div className={css.grid}>{filteredFaqs.map(faq=><article key={faq.id} className={css.card}>
        <div className={css.cardPreview}>{faq.image_url?<img className={css.cardImage} src={faq.image_url} alt="" loading="lazy"/>:<BookOpen size={34} aria-hidden="true"/>}</div>
        <p className={css.eyebrow}>{faq.category_name_ar||'أسئلة شائعة'}</p>
        <h4 className={css.faqCardTitle}>{ar?faq.question_ar:faq.question_en||faq.question_ar}</h4>
        <button className={`${css.smallButton} mt-auto self-start`} onClick={()=>toggleFaq(faq.id)}><BookOpen size={16}/>{ar?'فتح الشرح':'Open guide'}</button>
      </article>)}</div>}
    </>}
    {!loading&&!error&&!filteredArticles.length&&!filteredFaqs.length&&<div className={css.empty}>لا توجد نتائج مطابقة.<button className={`${css.smallButton} mt-3`} onClick={()=>{setQuery('');select('all')}}>عرض الكل</button></div>}
    {products.length>0&&<details className={css.panel}><summary className="cursor-pointer text-sm font-medium">متطلبات وتنبيهات المنتجات قبل الشراء</summary><div className="mt-4 grid gap-3">{products.map(product=><section key={product.id}><h3 className="mb-2 text-sm font-medium">{product.name}</h3><ProductNotice product={product} placement="beforePurchase"/></section>)}</div></details>}
    <div className={`${css.panel} flex flex-wrap items-center justify-between gap-3`}><span className="inline-flex items-center gap-2 text-sm"><LifeBuoy size={18}/>هل تحتاج مساعدة إضافية؟</span><a className={css.smallButton} href="/support">فتح تذكرة دعم</a></div>
    {article&&<GuideDialog title={article.title} onClose={()=>setArticle(null)}><GuideArticleView key={article.id} article={article}/></GuideDialog>}
    {openFaq&&faqs.find(faq=>faq.id===openFaq)&&(()=>{const faq=faqs.find(item=>item.id===openFaq)!;return <GuideDialog title={ar?faq.question_ar:faq.question_en||faq.question_ar} onClose={()=>setOpenFaq(null)}><div className={css.faqDetail}>
      <div className={css.faqVisual}>{faq.image_url?<ImageLightbox src={faq.image_url} alt={ar?faq.question_ar:faq.question_en||faq.question_ar}/>:<div className={css.faqVisualFallback}><BookOpen size={50}/><span>T3N</span></div>}</div>
      <div className={css.faqExplanation}><p className={css.eyebrow}>{faq.category_name_ar||'الأسئلة الشائعة'}</p><FaqAnswer text={ar?faq.answer_ar:faq.answer_en||faq.answer_ar}/><a className={`${css.smallButton} mt-4`} href={`/support?guide=${encodeURIComponent((faq.category_name_ar||'الإدارة')+' — '+faq.question_ar)}`}>فتح تذكرة دعم</a></div>
    </div></GuideDialog>})()}
    <footer className={css.helpFooter}>© {new Date().getFullYear()} T3N · جميع الحقوق محفوظة</footer>
  </section>;
}
