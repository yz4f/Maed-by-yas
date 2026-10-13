'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import styles from './welcome-video.module.css';

const VIDEO_URL = '/videos/welcome-1011.mp4';

interface WelcomeVideoProps {
  lang: 'ar' | 'en';
  name: string;
  onComplete: () => void;
  mode?: 'required' | 'replay';
}

export function WelcomeVideo({ lang, name, onComplete, mode = 'required' }: WelcomeVideoProps) {
  const arabic = lang === 'ar';
  const isReplay = mode === 'replay';
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const allowedPosition = useRef(0);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    void videoRef.current?.play().catch(() => setPlayBlocked(true));
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (ended) startButtonRef.current?.focus();
  }, [ended]);

  const stage = seconds < 18 ? 0 : seconds < 39 ? 1 : seconds < 58 ? 2 : 3;
  const stages = arabic
    ? ['لوحة واضحة لحسابك', 'منتجاتك ومفاتيحك في مكان واحد', 'مساعدة وقت الحاجة', 'دليل المنتج خطوة بخطوة']
    : ['Your account at a glance', 'Products and keys together', 'Help when you need it', 'A step-by-step product guide'];
  const progress = duration > 0 ? Math.min(100, seconds / duration * 100) : 0;

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || ended) return;
    if (video.paused) {
      try {
        await video.play();
        setPlayBlocked(false);
      } catch { setPlayBlocked(true); }
    } else {
      video.pause();
    }
  }

  async function enterSite() {
    if ((!ended && !videoError) || saving) return;
    if (isReplay) {
      onComplete();
      return;
    }
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch('/api/user/welcome-video/complete', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Could not save video completion');
      onComplete();
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} dir={arabic ? 'rtl' : 'ltr'} aria-labelledby="welcome-video-title" onCancel={(event) => { if (isReplay) onComplete(); else event.preventDefault(); }}>
      <div className={styles.shell}>
        {isReplay && <button className={styles.close} type="button" onClick={onComplete} aria-label={arabic ? 'إغلاق الشرح' : 'Close tour'}><X size={19} /></button>}
        <div className={styles.heading}>
          <div className={styles.eyebrow}><span />{isReplay ? (arabic ? 'شرح خدمات الموقع' : 'Site services tour') : (arabic ? 'مرحبًا بك في تعن' : 'Welcome to T3N')}</div>
          <h2 id="welcome-video-title">{isReplay ? (arabic ? 'تعرّف على خدمات تعن' : 'Explore T3N services') : (arabic ? `أهلًا ${name}، لنبدأ من هنا` : `Hi ${name}, let’s get started`)}</h2>
          <p>{isReplay ? (arabic ? 'جولة قصيرة تعرض حسابك ومنتجاتك ومركز المساعدة. يمكنك إغلاقها والعودة إلى الموقع في أي وقت.' : 'A short tour of your account, products, and help center. You can close it and return to the site at any time.') : (arabic ? 'جولة قصيرة تعرفك على حسابك ومنتجاتك ومركز المساعدة. شاهدها حتى النهاية، ثم ابدأ التصفح.' : 'A short tour of your account, products, and help center. Watch it to the end, then start exploring.')}</p>
        </div>

        <div className={styles.videoFrame}>
          <video
            ref={videoRef} src={VIDEO_URL} poster="/images/welcome-poster.webp"
            autoPlay muted playsInline preload="metadata" disablePictureInPicture disableRemotePlayback
            controls={false} controlsList="nodownload noplaybackrate noremoteplayback"
            onContextMenu={(event) => event.preventDefault()}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (video.seeking || ended) return;
              allowedPosition.current = video.currentTime;
              setSeconds(video.currentTime);
            }}
            onSeeking={(event) => {
              const video = event.currentTarget;
              if (!ended && Math.abs(video.currentTime - allowedPosition.current) > 0.8) video.currentTime = allowedPosition.current;
            }}
            onRateChange={(event) => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
            onEnded={() => { setEnded(true); setPlaying(false); setSeconds(videoRef.current?.duration || duration); }}
            onError={() => { setVideoError(true); setPlaying(false); }}
          />
          <span className={styles.videoTag}>{isReplay ? (arabic ? 'شرح الخدمات' : 'SERVICES TOUR') : (arabic ? 'جولتك الأولى' : 'YOUR FIRST TOUR')}</span>
          {playBlocked && !ended && !videoError && <button className={styles.playOverlay} type="button" onClick={() => void togglePlayback()}><Play size={22} fill="currentColor" />{arabic ? 'تشغيل الجولة' : 'Play the tour'}</button>}
          {ended && <div className={styles.finishOverlay}><Check size={24} />{arabic ? 'اكتملت الجولة' : 'Tour complete'}</div>}
        </div>

        <div className={styles.statusRow}>
          <div className={styles.stage}><span className={styles.stageNumber}>{String(stage + 1).padStart(2, '0')}</span><span>{ended ? (arabic ? 'أنت جاهز للانطلاق' : 'You are ready to go') : stages[stage]}</span></div>
          <span className={styles.counter} dir="ltr">{Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
        </div>
        <div className={styles.progress} role="progressbar" aria-label={arabic ? 'تقدم الفيديو' : 'Video progress'} aria-valuenow={Math.floor(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${progress / 100})` }} /></div>

        <div className={styles.actions}>
          <div className={styles.playerActions}>
            <button type="button" onClick={() => void togglePlayback()} disabled={ended || videoError} aria-label={playing ? (arabic ? 'إيقاف مؤقت' : 'Pause') : (arabic ? 'تشغيل' : 'Play')} title={playing ? (arabic ? 'إيقاف مؤقت' : 'Pause') : (arabic ? 'تشغيل' : 'Play')}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button type="button" onClick={() => { const video = videoRef.current; if (!video) return; video.muted = !video.muted; setMuted(video.muted); }} disabled={videoError} aria-label={muted ? (arabic ? 'تشغيل الصوت' : 'Unmute') : (arabic ? 'كتم الصوت' : 'Mute')} title={muted ? (arabic ? 'تشغيل الصوت' : 'Unmute') : (arabic ? 'كتم الصوت' : 'Mute')}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          </div>
          <p className={styles.hint}>{videoError ? (arabic ? 'تعذر تشغيل الفيديو على جهازك. يمكنك العودة إلى الموقع الآن.' : 'The video could not play on your device. You can return to the site.') : ended ? (arabic ? 'اكتملت الجولة. استكشف الموقع براحتك.' : 'Your tour is complete. Explore the site at your pace.') : isReplay ? (arabic ? 'يمكنك إيقاف الشرح مؤقتًا أو إغلاقه في أي وقت.' : 'You can pause or close the tour at any time.') : (arabic ? 'يمكنك الإيقاف مؤقتًا وتشغيل الصوت. سيظهر زر البدء عند انتهاء الجولة.' : 'You can pause or turn on sound. The start button appears when the tour ends.')}</p>
          {(ended || videoError) && <button ref={startButtonRef} className={styles.start} type="button" onClick={() => void enterSite()} disabled={saving}>
            {saving ? <LoaderCircle className={styles.spinner} size={18} /> : arabic ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            {saving ? (arabic ? 'جارٍ فتح الموقع...' : 'Opening the site…') : isReplay ? (arabic ? 'العودة إلى الموقع' : 'Return to site') : (arabic ? 'ابدأ تصفح الموقع' : 'Start exploring')}
          </button>}
        </div>
        {saveError && <p className={styles.error} role="alert">{arabic ? 'تعذر حفظ إكمال الجولة. حاول مرة أخرى.' : 'Could not save your progress. Please try again.'}</p>}
      </div>
    </dialog>
  );
}
