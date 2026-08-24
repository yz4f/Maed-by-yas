'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { AiChatModal } from '@/components/portal/ai-chat-modal';

type Conversation = { supportSessionId?: string | null };

export function SupportSessionPage({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/ai?view=conversation', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'تعذر فتح جلسة الدعم.');
        const conversation = data.conversation as Conversation | undefined;
        if (!conversation?.supportSessionId) {
          if (active) setState('not-found');
          return;
        }
        if (conversation.supportSessionId !== sessionId) {
          router.replace(`/support/session/${encodeURIComponent(conversation.supportSessionId)}`);
          return;
        }
        if (active) setState('ready');
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'تعذر فتح جلسة الدعم.');
        setState('error');
      });
    return () => { active = false; };
  }, [router, sessionId]);

  if (state === 'ready') {
    return <AiChatModal open standalone sessionId={sessionId} onClose={() => router.push('/support')} lang="ar" isDark onNotify={() => undefined} onOpenGuide={(destination) => router.push(destination === 'issues' ? '/?tab=my-products&guide=issues' : '/?tab=my-products&guide=product')} />;
  }

  return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#07111d] p-5 text-slate-100"><section className="w-full max-w-md rounded-[28px] border border-white/[.09] bg-[#0b1726] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,.34)]">{state === 'loading' ? <><Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" /><h1 className="mt-4 text-base font-black">جارٍ فتح جلسة الدعم</h1><p className="mt-2 text-xs leading-6 text-slate-400">نتحقق من جلستك المحفوظة بشكل آمن.</p></> : <><AlertTriangle className="mx-auto h-7 w-7 text-amber-200" /><h1 className="mt-4 text-base font-black">{state === 'not-found' ? 'هذه الجلسة غير متاحة' : 'تعذر فتح الجلسة'}</h1><p className="mt-2 text-xs leading-6 text-slate-400">{state === 'not-found' ? 'افتح جلسة الدعم من مركز المساعدة داخل حسابك.' : error}</p><button onClick={() => router.push('/support')} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-200/[.16] bg-cyan-300/[.08] px-4 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[.14]"><ArrowLeft className="h-4 w-4" />العودة لمركز المساعدة</button></>}</section></main>;
}
