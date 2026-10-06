'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ArrowUpLeft, Check, ChevronDown, Globe2, LoaderCircle, Moon, Sun } from 'lucide-react';
import { DiscordMark } from './discord-mark';
import { toast } from '@/lib/toast';
import styles from './login-page.module.css';

interface LoginPageProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onToggleTheme: () => void;
}

export function LoginPage({ lang, isDark, onLanguageChange, onToggleTheme }: LoginPageProps) {
  const ar = lang === 'ar';
  const [busy, setBusy] = useState(false);
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
              {languagesOpen && <div id="login-language-options" className={styles.languageOptions}>
                {(['ar', 'en'] as const).map(value => <button key={value} type="button" lang={value} aria-pressed={value === lang} onClick={() => { onLanguageChange(value); setLanguagesOpen(false); languageButton.current?.focus(); }}>
                  <span>{value === 'ar' ? 'العربية' : 'English'}</span>{value === lang && <Check size={15} />}
                </button>)}
              </div>}
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
          <h1 id="login-hero-title">{ar ? <>فعّل <span>مفتاح الترخيص</span><br />وافتح جميع المزايا</> : <>Activate <span>your license.</span><br />Unlock every feature.</>}</h1>
          <p className={styles.description}>{ar ? 'أدخل بحسابك عبر Discord للوصول إلى منتجاتك، أدلة الاستخدام والتحديثات، من مكان واحد.' : 'Sign in with Discord to access your products, guides and updates. Everything you need, in one place.'}</p>
          <dl className={styles.stats}>
            {[['+2,400', ar ? 'عضو نشط' : 'Active members'], ['99.9%', ar ? 'وقت التشغيل' : 'Uptime'], ['24/7', ar ? 'دعم مستمر' : 'Support']].map(([number, label]) => <div key={number}><dt>{label}</dt><dd dir="ltr">{number}</dd></div>)}
          </dl>
        </section>

        <section className={styles.card} aria-labelledby="login-card-title">
          <div className={styles.discordIcon}><DiscordMark width={30} height={30} /></div>
          <h2 id="login-card-title">{ar ? 'تسجيل الدخول' : 'Welcome back'}</h2>
          <p>{ar ? 'اربط حساب Discord الخاص بك للوصول إلى حسابك وإدارة تراخيصك.' : 'Connect your Discord account to access and manage your licenses.'}</p>
          <button type="button" className={styles.primary} disabled={busy} aria-busy={busy} onClick={connect}>
            {busy ? <LoaderCircle size={21} className={styles.spinner} /> : <DiscordMark width={21} height={21} />}
            <span aria-live="polite">{busy ? (ar ? 'جارٍ الاتصال بديسكورد...' : 'Connecting to Discord…') : (ar ? 'تسجيل دخول' : 'Continue with Discord')}</span>
          </button>
          <div className={styles.divider}><span>{ar ? 'أو' : 'or'}</span></div>
          <p className={styles.storePrompt}>{ar ? 'ليس لديك مفتاح حتى الآن؟' : 'Don’t have a license yet?'}</p>
          <a className={styles.store} href="https://t3nnn.com/" target="_blank" rel="noopener noreferrer">{ar ? 'زيارة المتجر' : 'Visit the store'}<ArrowUpLeft size={17} /></a>
        </section>
      </div>
      <footer className={styles.footer}>{ar ? 'جميع الحقوق محفوظة' : 'All rights reserved'} <span dir="ltr">© 2026</span> {ar ? 'تعن' : 'T3N'}</footer>
    </div>
  );
}
