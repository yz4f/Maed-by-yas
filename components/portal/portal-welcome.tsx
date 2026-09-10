'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Fingerprint, Globe2, Headphones, KeyRound, LoaderCircle, LockKeyhole, Moon, PackageCheck, ShieldCheck, ShoppingBag, Sun } from 'lucide-react';
import { DiscordMark } from './discord-mark';
import css from './portal-welcome.module.css';

interface PortalWelcomeProps {
  lang: 'ar' | 'en';
  isDark: boolean;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onSignIn: () => Promise<unknown>;
  children?: ReactNode;
}

export function PortalWelcome({ lang, isDark, onToggleLanguage, onToggleTheme, onSignIn, children }: PortalWelcomeProps) {
  const ar = lang === 'ar';
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const Chevron = ar ? ChevronLeft : ChevronRight;
  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setSignInError(false);
    try {
      await onSignIn();
    } catch {
      setSignInError(true);
    } finally {
      setSigningIn(false);
    }
  };

  const features = [
    { icon: KeyRound, number: '01', title: ar ? 'فعّل مفتاحك' : 'Activate your key', text: ar ? 'أضف ترخيصك واربطه بحسابك بخطوات بسيطة.' : 'Add your license and connect it to your account in a few steps.' },
    { icon: PackageCheck, number: '02', title: ar ? 'كل منتجاتك، بمكان واحد' : 'Everything in one place', text: ar ? 'تراخيصك، تحميلاتك وتحديثاتك. وصول أسهل وتحكّم أوضح.' : 'Your licenses, downloads and updates. Easy to find, simple to manage.' },
    { icon: Headphones, number: '03', title: ar ? 'نحن هنا لمساعدتك' : 'A little help, whenever needed', text: ar ? 'الشروحات ومركز المساعدة ومجتمع تعن، قريبين منك.' : 'Explore guides, the help center and the TA3N community.' },
  ];

  return (
    <div className={css.page} data-theme={isDark ? 'dark' : 'light'} dir={ar ? 'rtl' : 'ltr'}>
      <a className={css.skipLink} href="#welcome-content">{ar ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
      <div className={css.ambient} aria-hidden="true" />
      <header className={css.header}>
        <Link className={css.brand} href="/" aria-label={ar ? 'تعن — الرئيسية' : 'TA3N — Home'}>
          <Image src="/logo.png" width={46} height={46} alt="" priority />
          <span><strong translate="no">تعن<span className={css.brandDot}>.</span></strong><small>TA3N DIGITAL</small></span>
        </Link>
        <nav className={css.links} aria-label={ar ? 'روابط الموقع' : 'Site links'}>
          <a href="#how-it-works">{ar ? 'كيف تبدأ' : 'Getting started'}</a>
          <a href="https://t3nnn.com/" target="_blank" rel="noopener noreferrer">{ar ? 'المتجر' : 'Store'}<Arrow size={13} /></a>
          <a href="https://discord.gg/t3n" target="_blank" rel="noopener noreferrer">{ar ? 'المجتمع والدعم' : 'Community & support'}<Arrow size={13} /></a>
        </nav>
        <div className={css.controls}>
          <button type="button" onClick={onToggleLanguage} aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'}><Globe2 size={16} /><span>{ar ? 'EN' : 'عربي'}</span></button>
          <span className={css.controlDivider} />
          <button type="button" onClick={onToggleTheme} aria-label={isDark ? (ar ? 'تفعيل الوضع الفاتح' : 'Enable light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Enable dark mode')} title={ar ? 'تبديل المظهر' : 'Toggle theme'}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </header>

      <main id="welcome-content" className={css.content}>
        <section className={css.hero} aria-labelledby="welcome-title">
          <div className={css.heroCopy}>
            <div className={css.eyebrow}><span />{ar ? 'بوابتك إلى تجربة أفضل' : 'YOUR NEXT EXPERIENCE STARTS HERE'}</div>
            <h1 id="welcome-title">{ar ? <>وصولك أسهل.<br />تجربتك <em>أرقى.</em></> : <>Seamless access.<br />An <em>elevated</em> experience.</>}</h1>
            <p className={css.description}>{ar ? 'مساحتك الخاصة لإدارة منتجاتك وتراخيصك. سجّل دخولك، فعّل مفتاحك، وخلّ الباقي علينا.' : 'Your own space for products and licenses. Sign in, activate your key, and make yourself at home.'}</p>
            <div className={css.heroDetails}>
              <span><ShieldCheck size={17} />{ar ? 'دخول عبر ديسكورد' : 'Discord sign-in'}</span>
              <i />
              <span><KeyRound size={17} />{ar ? 'تحكّم كامل بتراخيصك' : 'Your licenses, in your hands'}</span>
            </div>
            <a className={css.explore} href="#how-it-works">{ar ? 'تعرّف على تجربتك في تعن' : 'Discover your TA3N experience'}<Chevron size={16} /></a>
          </div>

          <div className={css.accessWrap}>
            <div className={css.cardOrbit} aria-hidden="true" />
            <section className={css.accessCard} aria-labelledby="sign-in-title">
              <div className={css.cardTop}><span><i />{ar ? 'مساحتك الخاصة' : 'YOUR PERSONAL SPACE'}</span><Fingerprint size={23} /></div>
              <div className={css.accessIcon}><LockKeyhole size={28} strokeWidth={1.5} /><span><Check size={11} strokeWidth={3} /></span></div>
              <h2 id="sign-in-title">{ar ? 'حيّاك في تعن' : 'Welcome to TA3N'}</h2>
              <p>{ar ? 'تجربتك تبدأ بخطوة. تابع بحسابك في ديسكورد للوصول إلى لوحة التحكم.' : 'One simple step. Continue with your Discord account to access your dashboard.'}</p>
              <button type="button" className={css.signIn} disabled={signingIn} onClick={handleSignIn} aria-busy={signingIn}>
                {signingIn ? <LoaderCircle size={21} className={css.spinner} /> : <DiscordMark width={21} height={21} />}
                <span>{signingIn ? (ar ? 'جارٍ الانتقال…' : 'Connecting…') : (ar ? 'المتابعة عبر ديسكورد' : 'Continue with Discord')}</span>
                <Chevron size={17} />
              </button>
              {signInError && <p className={css.error} role="alert">{ar ? 'تعذّر الاتصال. حاول مرة أخرى.' : 'Unable to connect. Please try again.'}</p>}
              <span className={css.signInNote}><ShieldCheck size={13} />{ar ? 'بدون إنشاء حساب جديد أو كلمة مرور إضافية' : 'No new account or extra password needed'}</span>
              <div className={css.divider}><span />{ar ? 'جديد على تعن؟' : 'NEW TO TA3N?'}<span /></div>
              <a className={css.storeLink} href="https://t3nnn.com/" target="_blank" rel="noopener noreferrer"><ShoppingBag size={18} /><span>{ar ? 'اكتشف المتجر' : 'Explore the store'}</span><Arrow size={16} /></a>
            </section>
            <div className={css.cardCaption}><span />TA3N ACCESS<span className={css.captionLine} />{ar ? 'تجربة مصمّمة لك' : 'MADE FOR YOU'}</div>
          </div>
        </section>

        <section className={css.featuresSection} id="how-it-works" aria-label={ar ? 'كيف تبدأ' : 'Getting started'}>
          <div className={css.sectionLabel}><span>{ar ? 'بسيطة من أول خطوة' : 'SIMPLE FROM THE FIRST STEP'}</span><i /><small>THE TA3N EXPERIENCE</small></div>
          <div className={css.features}>
            {features.map(({ icon: Icon, number, title, text }) => <article className={css.feature} key={number}><div className={css.featureTop}><span className={css.featureIcon}><Icon size={22} strokeWidth={1.6} /></span><small>{number}</small></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>
      </main>
      <footer className={css.footer}><span>© {new Date().getFullYear()} {ar ? 'تعن. جميع الحقوق محفوظة.' : 'TA3N. All rights reserved.'}</span><a href="https://discord.gg/t3n" target="_blank" rel="noopener noreferrer"><DiscordMark width={15} height={15} />{ar ? 'جزء من مجتمع تعن' : 'Part of the TA3N community'}<Arrow size={12} /></a><span className={css.footerSignature}>CRAFTED FOR YOUR NEXT.</span></footer>
      {children}
    </div>
  );
}
