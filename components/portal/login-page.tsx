'use client';

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ArrowUpLeft, Check, ChevronDown, Globe2, LoaderCircle, Moon, Sun } from 'lucide-react';
import { toast } from '@/lib/toast';
import styles from './login-page.module.css';

interface LoginPageProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onToggleTheme: () => void;
}

function WaveWords({ text, start = 0, accent = false }: { text: string; start?: number; accent?: boolean }) {
  const words = text.split(' ');
  return <>{words.map((word, index) => {
    const position = start + index;
    const style = { '--wave-y': `${Math.round(12 * Math.sin((position + 1) * 1.1))}px`, animationDelay: `${position * 75}ms` } as CSSProperties;
    return <Fragment key={`${word}-${index}`}><span className={`${styles.waveWord} ${accent ? styles.waveAccent : ''}`} style={style}>{word}</span>{index < words.length - 1 ? ' ' : null}</Fragment>;
  })}</>;
}

export function LoginPage({ lang, isDark, onLanguageChange, onToggleTheme }: LoginPageProps) {
  const ar = lang === 'ar';
  const reducedMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [ripple, setRipple] = useState<{ id: number; x: number; y: number; size: number } | null>(null);
  const pending = useRef(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const languageControl = useRef<HTMLDivElement>(null);
  const languageButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onPageShow = () => { pending.current = false; setBusy(false); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pageshow', onPageShow);
    // OAuth errors return to the configured sign-in page. Keep the message local.
    const url = new URL(window.location.href);
    let errorTimer: ReturnType<typeof setTimeout> | undefined;
    if (url.searchParams.has('error')) {
      errorTimer = setTimeout(() => {
        toast.error(ar ? 'تعذر تسجيل الدخول عبر Discord. حاول مرة أخرى.' : 'Unable to sign in with Discord. Please try again.');
        url.searchParams.delete('error');
        window.history.replaceState(window.history.state, '', url);
      }, 0);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pageshow', onPageShow);
      clearTimeout(errorTimer);
    };
  }, [ar]);

  useEffect(() => {
    if (!languagesOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!languageControl.current?.contains(event.target as Node)) setLanguagesOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setLanguagesOpen(false); languageButton.current?.focus(); }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [languagesOpen]);

  async function connect() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await signIn('discord');
    } catch {
      toast.error(ar ? 'تعذر تسجيل الدخول عبر Discord. حاول مرة أخرى.' : 'Unable to sign in with Discord. Please try again.');
      pending.current = false;
      setBusy(false);
    }
  }

  function showRipple(button: HTMLButtonElement, clientX?: number, clientY?: number) {
    if (reducedMotion || busy) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    setRipple({
      id: Date.now(),
      x: (clientX ?? rect.left + rect.width / 2) - rect.left - size / 2,
      y: (clientY ?? rect.top + rect.height / 2) - rect.top - size / 2,
      size,
    });
  }

  return (
    <div className={styles.page} data-theme={isDark ? 'dark' : 'light'} dir={ar ? 'rtl' : 'ltr'} lang={lang}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label={ar ? 'تعن — الرئيسية' : 'T3N — Home'}>
            {/* Fixed dimensions reserve space before the small brand image loads. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-256.png" width={42} height={42} alt="" />
            <span>{ar ? 'تعن' : 'T3N'}<small>{ar ? 'منتجاتك، في مكان واحد' : 'Your products, together'}</small></span>
          </Link>
          <div className={styles.tools}>
            <div ref={languageControl} className={styles.languageControl} onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setLanguagesOpen(false);
            }}>
              <button ref={languageButton} className={styles.control} type="button" aria-expanded={languagesOpen} aria-controls="login-language-options" aria-label={ar ? 'تغيير اللغة' : 'Change language'} onClick={() => setLanguagesOpen(value => !value)}>
                <Globe2 size={17} /><span>{ar ? 'العربية' : 'English'}</span><ChevronDown size={13} />
              </button>
              <AnimatePresence initial={false}>{languagesOpen && <motion.div id="login-language-options" className={styles.languageOptions} initial={reducedMotion ? false : { opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}>
                {(['ar', 'en'] as const).map(value => <button key={value} type="button" lang={value} aria-pressed={value === lang} onClick={() => { onLanguageChange(value); setLanguagesOpen(false); languageButton.current?.focus(); }}>
                  <span>{value === 'ar' ? 'العربية' : 'English'}</span>{value === lang && <Check size={15} />}
                </button>)}
              </motion.div>}</AnimatePresence>
            </div>
            <button type="button" className={`${styles.control} ${styles.theme}`} onClick={onToggleTheme} title={ar ? (isDark ? 'الوضع الفاتح' : 'الوضع الداكن') : (isDark ? 'Light mode' : 'Dark mode')} aria-label={ar ? (isDark ? 'الوضع الفاتح' : 'الوضع الداكن') : (isDark ? 'Light mode' : 'Dark mode')}>
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.hero} aria-labelledby="login-hero-title">
          <span className={styles.badge}><i aria-hidden="true" />{ar ? 'تفعيل الترخيص' : 'License activation'}</span>
          <h1 id="login-hero-title" aria-label={ar ? 'فعّل مفتاح الترخيص وافتح جميع المزايا' : 'Activate your license. Unlock every feature.'}>
            <span aria-hidden="true"><WaveWords text={ar ? 'فعّل' : 'Activate'} />{' '}<WaveWords text={ar ? 'مفتاح الترخيص' : 'your license.'} start={1} accent /><br /><WaveWords text={ar ? 'وافتح جميع المزايا' : 'Unlock every feature.'} start={3} /></span>
          </h1>
          <p className={styles.description}>{ar ? 'أدخل بحسابك عبر Discord للوصول إلى منتجاتك، أدلة الاستخدام والتحديثات، من مكان واحد.' : 'Sign in with Discord to access your products, guides and updates. Everything you need, in one place.'}</p>
          <dl className={styles.stats}>
            {[['+2,400', ar ? 'عضو نشط' : 'Active members'], ['99.9%', ar ? 'وقت التشغيل' : 'Uptime'], ['24/7', ar ? 'دعم مستمر' : 'Support']].map(([number, label]) => <div key={number}><dt>{label}</dt><dd dir="ltr">{number}</dd></div>)}
          </dl>
        </section>

        <section className={styles.card} aria-labelledby="login-card-title">
          <div className={styles.cardLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-256.png" width={54} height={54} alt="" />
          </div>
          <h2 id="login-card-title" aria-label={ar ? 'تسجيل الدخول' : 'Welcome back'}><span aria-hidden="true"><WaveWords text={ar ? 'تسجيل الدخول' : 'Welcome back'} start={3} /></span></h2>
          <p>{ar ? 'اربط حساب Discord الخاص بك للوصول إلى حسابك وإدارة تراخيصك.' : 'Connect your Discord account to access and manage your licenses.'}</p>
          <button type="button" className={styles.primary} disabled={busy} aria-busy={busy} onPointerDown={event => showRipple(event.currentTarget, event.clientX, event.clientY)} onClick={event => { if (event.detail === 0) showRipple(event.currentTarget); void connect(); }}>
            {ripple && <span key={ripple.id} className={styles.ripple} style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }} aria-hidden="true" onAnimationEnd={() => setRipple(null)} />}
            {busy && <LoaderCircle size={19} className={styles.spinner} />}
            <span aria-live="polite">{busy ? (ar ? 'جارٍ تسجيل الدخول...' : 'Signing in…') : (ar ? 'تسجيل دخول' : 'Sign in')}</span>
          </button>
          <div className={styles.divider}><span>{ar ? 'أو' : 'or'}</span></div>
          <p className={styles.storePrompt}>{ar ? 'ليس لديك مفتاح حتى الآن؟' : 'Don’t have a license yet?'}</p>
          <a className={styles.store} href="https://t3nnn.com/" target="_blank" rel="noopener noreferrer">{ar ? 'زيارة المتجر' : 'Visit the store'}<ArrowUpLeft size={17} /></a>
        </section>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>{ar ? 'جميع الحقوق محفوظة' : 'All rights reserved'} <span dir="ltr">© {new Date().getFullYear()}</span> {ar ? 'تعن' : 'T3N'}</p>
        </div>
      </footer>
    </div>
  );
}
