'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Loader2, MonitorUp, ShieldCheck, Square, X } from 'lucide-react';
import { createImageAttachment } from '@/components/portal/ai-chat-modal';

type ScreenState = 'idle' | 'requesting' | 'sharing' | 'analyzing' | 'error';

export function ScreenAssistance({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<ScreenState>('idle');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
    setNotice('تم إيقاف مشاركة الشاشة. لا يتم حفظ أو تسجيل البث.');
  };

  useEffect(() => () => stopSharing(), []);

  const startSharing = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('متصفحك لا يدعم مشاركة الشاشة. استخدم نسخة حديثة من Chrome أو Edge.');
      setState('error');
      return;
    }
    setError('');
    setNotice('');
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 10 }, audio: false });
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack?.addEventListener('ended', stopSharing, { once: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('sharing');
    } catch (startError) {
      if (startError instanceof DOMException && startError.name === 'NotAllowedError') setError('لم تبدأ المشاركة لأنك لم توافق عليها. يمكنك المحاولة عندما تكون جاهزاً.');
      else setError('تعذر بدء مشاركة الشاشة الآن. أغلق أي طلب مشاركة آخر ثم حاول مجدداً.');
      setState('error');
    }
  };

  const analyzeCurrentScreen = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth < 2 || video.videoHeight < 2) {
      setError('بانتظار وصول صورة الشاشة. تأكد من اختيار نافذة أو شاشة ثم حاول مجدداً.');
      return;
    }
    setState('analyzing');
    setError('');
    setNotice('');
    try {
      const ratio = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
      canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
      if (!blob) throw new Error('capture');
      const attachment = await createImageAttachment(new File([blob], `screen-${sessionId}.jpg`, { type: 'image/jpeg' }));
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'chat', language: 'ar', body: 'هذه لقطة شاشة شاركتها بإرادتي للمساعدة. اقرأ ما يظهر فيها وحدد الخطوة التالية الواحدة فقط بوضوح، ولا تطلب أي كلمات مرور أو مفاتيح.', attachments: [attachment] }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر تحليل اللقطة.');
      setNotice('تم إرسال لقطة واحدة للمساعد. ستظهر الملاحظة والخطوة التالية داخل المحادثة خلال لحظات.');
      setState('sharing');
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'تعذر تحليل اللقطة حالياً.');
      setState('sharing');
    }
  };

  return <>
    <button type="button" onClick={() => { setOpen(true); setError(''); setNotice(''); }} className="fixed bottom-24 start-4 z-[120] inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-200/[.18] bg-[#0a1727]/95 px-3 text-[10px] font-black text-cyan-100 shadow-[0_12px_30px_rgba(0,0,0,.3)] backdrop-blur transition hover:bg-cyan-300/[.1] sm:bottom-5 sm:start-5"><MonitorUp className="h-4 w-4" />مساعدة الشاشة</button>
    {open && <div dir="rtl" className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={() => { if (state !== 'analyzing') setOpen(false); }}><section className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-cyan-200/[.16] bg-[#0a1727] text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,.5)]" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b border-white/[.08] px-5 py-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/[.15] bg-cyan-300/[.08] text-cyan-100"><MonitorUp className="h-5 w-5" /></span><div><h2 className="text-sm font-black">المساعدة المباشرة عبر الشاشة</h2><p className="mt-1 text-[10px] leading-5 text-slate-400">جلسة {sessionId} · لا يبدأ أي عرض أو إرسال إلا بعد موافقتك.</p></div></div><button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.1] text-slate-400 transition hover:bg-white/[.06] hover:text-white"><X className="h-4 w-4" /></button></header><div className="p-5"><div className="rounded-2xl border border-cyan-200/[.12] bg-cyan-300/[.045] p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" /><div><p className="text-xs font-black text-cyan-50">خصوصية الشاشة تحت تحكمك</p><p className="mt-1 text-[11px] leading-6 text-slate-300">سيطلب منك المتصفح اختيار شاشة أو نافذة. لا نسجل البث ولا نحفظ فيديو. لا تصل لقطة للمساعد إلا عند ضغطك على «حلّل اللقطة الحالية»، ويمكنك الإيقاف في أي وقت.</p></div></div></div>{state === 'sharing' || state === 'analyzing' ? <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.09] bg-black"><video ref={videoRef} autoPlay muted playsInline className="max-h-[45vh] w-full object-contain" /></div> : <div className="mt-4 flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-white/[.12] bg-black/[.18] text-center"><div><Eye className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-xs font-black text-slate-300">لم تبدأ مشاركة الشاشة بعد</p><p className="mt-1 text-[10px] text-slate-500">اختر فقط النافذة أو الشاشة المرتبطة بالمشكلة.</p></div></div>}{error && <p className="mt-3 flex gap-2 rounded-xl border border-rose-300/[.16] bg-rose-400/[.08] p-3 text-[11px] leading-5 text-rose-100"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</p>}{notice && <p className="mt-3 flex gap-2 rounded-xl border border-emerald-300/[.16] bg-emerald-400/[.08] p-3 text-[11px] leading-5 text-emerald-100"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2">{state !== 'sharing' && state !== 'analyzing' ? <button type="button" onClick={() => void startSharing()} disabled={state === 'requesting'} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-[11px] font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{state === 'requesting' && <Loader2 className="h-4 w-4 animate-spin" />}بدء مشاركة الشاشة</button> : <><button type="button" onClick={() => void analyzeCurrentScreen()} disabled={state === 'analyzing'} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-[11px] font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{state === 'analyzing' && <Loader2 className="h-4 w-4 animate-spin" />}حلّل اللقطة الحالية</button><button type="button" onClick={stopSharing} disabled={state === 'analyzing'} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-300/[.16] bg-rose-400/[.08] px-4 text-[11px] font-black text-rose-100 transition hover:bg-rose-400/[.15] disabled:opacity-50"><Square className="h-3.5 w-3.5" />إيقاف المشاركة</button></>}</div></div></section></div>}
  </>;
}
