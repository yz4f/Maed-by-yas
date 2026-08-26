'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Language = 'ar' | 'en';
type SupportNotification = {
  id: string;
  type?: 'INACTIVITY_WARNING' | 'CONVERSATION_AUTO_CLOSED' | 'RESET_COMPLETED';
  title: string;
  message: string;
  seenAt?: string | null;
};

interface SupportNotificationBannerProps {
  lang: Language;
  isDark: boolean;
}

export function SupportNotificationBanner({ lang, isDark }: SupportNotificationBannerProps) {
  const [notification, setNotification] = useState<SupportNotification | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const response = await fetch('/api/ai?view=notifications', { credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !active) return;
        const next = (Array.isArray(data.notifications) ? data.notifications : []).find((item: SupportNotification) => !item.seenAt && item.type !== 'RESET_COMPLETED') || null;
        setNotification((current) => current?.id === next?.id ? current : next);
      } catch {
        // A non-critical notification check must never interrupt the current page.
      } finally {
        inFlightRef.current = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    void load();
    const timer = window.setInterval(refreshWhenVisible, 45_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const markSeen = async () => {
    const current = notification;
    if (!current) return;
    setNotification(null);
    try {
      await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'notification_seen', notificationId: current.id }),
      });
    } catch {
      // The notification remains stored and will be shown again on a later visit if marking it failed.
    }
  };

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => { void markSeen(); }, 60_000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  if (!notification) return null;
  return <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`pointer-events-none fixed inset-x-4 top-3 z-[85] md:top-4 ${lang === 'ar' ? 'md:right-[264px] md:left-8' : 'md:left-[264px] md:right-8'}`}>
    <section role="alert" className={`pointer-events-auto mx-auto flex max-w-4xl items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_18px_42px_rgba(127,29,29,.22)] backdrop-blur-xl sm:px-4 ${isDark ? 'border-rose-300/[.28] bg-[#551b28]/95 text-rose-50' : 'border-rose-300 bg-rose-700/95 text-white'}`}>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${isDark ? 'bg-rose-300/[.14] text-rose-100' : 'bg-white/15 text-white'}`}><AlertTriangle className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1"><p className="text-[11px] font-black sm:text-xs">{notification.title || (lang === 'ar' ? 'تنبيه مهم' : 'Important notice')}</p><p className="mt-0.5 text-[10px] leading-5 opacity-90 sm:text-[11px]">{notification.message}</p></div>
      <button type="button" onClick={() => void markSeen()} className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition active:scale-95 ${isDark ? 'hover:bg-white/[.1]' : 'hover:bg-white/15'}`} aria-label={lang === 'ar' ? 'إغلاق التنبيه' : 'Dismiss notification'}><X className="h-4 w-4" /></button>
    </section>
  </div>;
}
