'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, MessageSquareText, RefreshCw, Search, Send } from 'lucide-react';

type BotMessage = {
  id: string;
  direction: 'in' | 'out';
  discordId: string;
  name: string;
  image: string | null;
  content: string;
  attachments: string;
  createdAt: string;
};

export function BotMessagesAdmin({ lang, isDark }: { lang: 'ar' | 'en'; isDark: boolean }) {
  const ar = lang === 'ar';
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [discordId, setDiscordId] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/bot-messages', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(ar ? 'انتهت جلسة الإدارة. حدّث الصفحة.' : 'Admin session expired. Refresh the page.');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load bot messages.');
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر تحميل الرسائل.' : 'Unable to load messages.'));
    } finally { setLoading(false); }
  }, [ar]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const visible = useMemo(() => messages.filter((item) => {
    const needle = search.trim().toLowerCase();
    return !needle || item.discordId.includes(needle) || item.name.toLowerCase().includes(needle) || item.content.toLowerCase().includes(needle);
  }), [messages, search]);

  const send = async () => {
    if (busy) return;
    setError(''); setSuccess(''); setBusy(true);
    try {
      const response = await fetch('/api/admin/bot-messages', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: discordId.trim(), message: body.trim() }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(ar ? 'تعذر الاتصال بالخادم.' : 'Unable to reach the server.');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send the message.');
      setBody('');
      setSuccess(ar ? 'تم إرسال الرسالة الخاصة للعضو.' : 'The direct message was sent.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر إرسال الرسالة.' : 'Unable to send the message.'));
    } finally { setBusy(false); }
  };

  const surface = isDark ? 'border-white/10 bg-[#0b1522] text-white' : 'border-slate-200 bg-white text-slate-900';
  const input = isDark ? 'border-white/10 bg-[#07111c] text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400';
  return <section className="space-y-4" dir={ar ? 'rtl' : 'ltr'}>
    <div className={`rounded-2xl border p-5 ${surface}`}>
      <div className="mb-4 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-400"><Bot size={21} /></span><div><h3 className="text-base font-black">{ar ? 'رسائل البوت الخاصة' : 'Bot direct messages'}</h3><p className="mt-1 text-xs opacity-60">{ar ? 'اكتب Discord ID للعضو أو اختره من الرسائل الواردة، ثم أرسل له من البوت مباشرة.' : 'Enter a member Discord ID or select one from the inbox, then send a direct message.'}</p></div></div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <label className="block text-xs font-bold">{ar ? 'Discord ID' : 'Discord ID'}<input dir="ltr" inputMode="numeric" value={discordId} onChange={(event) => setDiscordId(event.target.value)} placeholder="123456789012345678" maxLength={22} className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-cyan-400 ${input}`} /></label>
        <label className="block text-xs font-bold">{ar ? 'الرسالة' : 'Message'}<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1200} rows={3} placeholder={ar ? 'اكتب رسالتك للعضو هنا...' : 'Write your message here...'} className={`mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-cyan-400 ${input}`} /></label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] opacity-50">{body.length}/1200</span><button type="button" onClick={() => void send()} disabled={busy || !/^\d{16,22}$/.test(discordId.trim()) || body.trim().length < 2} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"><Send size={14} />{busy ? (ar ? 'جارٍ الإرسال...' : 'Sending...') : (ar ? 'إرسال بالخاص' : 'Send DM')}</button></div>
      {success && <p role="status" className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-500">{success}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">{error}</p>}
    </div>

    <div className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><MessageSquareText size={18} className="text-cyan-400" /><h3 className="text-sm font-black">{ar ? 'سجل رسائل البوت' : 'Bot message log'}</h3><span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-400">{messages.length}</span></div><button type="button" onClick={() => void load()} className="grid h-8 w-8 place-items-center rounded-lg border border-current/10 opacity-70 transition hover:opacity-100" aria-label={ar ? 'تحديث الرسائل' : 'Refresh messages'}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button></div>
      <div className="relative mb-4"><Search size={15} className="pointer-events-none absolute end-3 top-3 opacity-50" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? 'ابحث بالاسم أو Discord ID أو محتوى الرسالة' : 'Search name, Discord ID, or message'} className={`w-full rounded-xl border py-2.5 pe-10 ps-3 text-xs outline-none focus:border-cyan-400 ${input}`} /></div>
      {loading && !messages.length ? <p className="py-10 text-center text-xs opacity-50">{ar ? 'جارٍ تحميل الرسائل...' : 'Loading messages...'}</p> : !visible.length ? <p className="py-10 text-center text-xs opacity-50">{ar ? 'لا توجد رسائل لعرضها.' : 'No messages to show.'}</p> : <div className="max-h-[650px] space-y-2 overflow-y-auto pe-1">{visible.map((item) => <article key={item.id} className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-100 bg-slate-50'}`}><div className="flex items-start gap-3"><img src={item.image || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setDiscordId(item.discordId)} className="text-xs font-black text-cyan-500 hover:underline">{item.name}</button><span dir="ltr" className="text-[10px] opacity-50">{item.discordId}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.direction === 'in' ? 'bg-sky-400/10 text-sky-400' : 'bg-violet-400/10 text-violet-400'}`}>{item.direction === 'in' ? (ar ? 'واردة' : 'Incoming') : (ar ? 'مرسلة' : 'Sent')}</span></div><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6">{item.content}</p>{item.attachments && <p className="mt-1 break-all text-[10px] text-cyan-500">{item.attachments}</p>}<time className="mt-1 block text-[10px] opacity-50">{new Date(item.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh' })}</time></div></div></article>)}</div>}
    </div>
  </section>;
}
