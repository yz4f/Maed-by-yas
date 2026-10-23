'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronLeft, ImageIcon, MessageSquareText, RefreshCw, Search, Send, UserRoundPlus } from 'lucide-react';
import css from './bot-messages-admin.module.css';

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

type Conversation = {
  id: string;
  name: string;
  image: string | null;
  latest: BotMessage;
  received: number;
  sent: number;
};

function mergeMessages(current: BotMessage[], incoming: BotMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id === b.id ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1);
}

function Avatar({ image, name, bot = false }: { image?: string | null; name: string; bot?: boolean }) {
  const [failed, setFailed] = useState(false);
  const source = bot ? '/logo-256.png' : image;
  useEffect(() => setFailed(false), [source]);
  return source && !failed
    ? <img src={source} alt={name} className={css.avatar} onError={() => setFailed(true)} />
    : <span className={css.avatarFallback} aria-label={name}>{bot ? <Bot size={18} /> : name.slice(0, 1).toUpperCase()}</span>;
}

function timeLabel(value: string, ar: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(ar ? 'ar-SA' : 'en-US', {
    timeZone: 'Asia/Riyadh', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function Attachment({ value }: { value: string }) {
  const entries = value.split('\n').filter(Boolean);
  return <div className={css.attachments}>{entries.map((entry, index) => {
    const match = /^\[([^\]]+)\]\((https:\/\/cdn\.discordapp\.com\/attachments\/[^)]+)\)$/.exec(entry);
    return match
      ? <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer"><ImageIcon size={14} />{match[1]}</a>
      : <span key={index}><ImageIcon size={14} />{entry}</span>;
  })}</div>;
}

export function BotMessagesAdmin({ lang, isDark }: { lang: 'ar' | 'en'; isDark: boolean }) {
  const ar = lang === 'ar';
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newId, setNewId] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const initialLoaded = useRef(false);
  const refreshInFlight = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (before?: string) => {
    const url = before ? `/api/admin/bot-messages?before=${encodeURIComponent(before)}` : '/api/admin/bot-messages';
    const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(ar ? 'انتهت جلسة الإدارة. حدّث الصفحة.' : 'Admin session expired. Refresh the page.');
    }
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load bot messages.');
    return {
      messages: Array.isArray(data.messages) ? data.messages as BotMessage[] : [],
      nextBefore: typeof data.nextBefore === 'string' ? data.nextBefore : null,
    };
  }, [ar]);

  const loadRecent = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      const page = await fetchPage();
      setMessages((current) => mergeMessages(current, page.messages));
      if (!initialLoaded.current) {
        setOlderCursor(page.nextBefore);
        initialLoaded.current = true;
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر تحميل الرسائل.' : 'Unable to load messages.'));
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  }, [ar, fetchPage]);

  useEffect(() => {
    void loadRecent();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadRecent();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [loadRecent]);

  const loadOlder = async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await fetchPage(olderCursor);
      setMessages((current) => mergeMessages(current, page.messages));
      setOlderCursor(page.nextBefore);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر تحميل الرسائل الأقدم.' : 'Unable to load older messages.'));
    } finally {
      setLoadingOlder(false);
    }
  };

  const conversations = useMemo(() => {
    const byId = new Map<string, Conversation>();
    for (const message of messages) {
      const existing = byId.get(message.discordId);
      if (!existing) {
        byId.set(message.discordId, {
          id: message.discordId, name: message.name || message.discordId,
          image: message.image, latest: message,
          received: message.direction === 'in' ? 1 : 0,
          sent: message.direction === 'out' ? 1 : 0,
        });
      } else {
        if (existing.name === existing.id && message.name && message.name !== message.discordId) existing.name = message.name;
        if (!existing.image && message.image) existing.image = message.image;
        if (message.direction === 'in') existing.received++;
        else existing.sent++;
      }
    }
    return [...byId.values()];
  }, [messages]);

  useEffect(() => {
    if (!selectedId && conversations.length) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    const matchingIds = new Set(messages.filter((message) =>
      message.content.toLowerCase().includes(needle)).map((message) => message.discordId));
    return conversations.filter((person) =>
      person.id.includes(needle) || person.name.toLowerCase().includes(needle) || matchingIds.has(person.id));
  }, [conversations, messages, search]);

  const selected = conversations.find((person) => person.id === selectedId);
  const thread = useMemo(() => messages.filter((message) => message.discordId === selectedId).reverse(), [messages, selectedId]);
  const latestId = thread[thread.length - 1]?.id;
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [selectedId, latestId]);

  const startConversation = () => {
    const id = newId.trim();
    if (!/^\d{16,22}$/.test(id)) return;
    setSelectedId(id);
    setNewId('');
    setNotice('');
    setError('');
  };

  const send = async () => {
    if (sending || !/^\d{16,22}$/.test(selectedId) || body.trim().length < 2) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/bot-messages', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: selectedId, message: body.trim() }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(ar ? 'تعذر الاتصال بالخادم.' : 'Unable to reach the server.');
      }
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send the message.');
      setBody('');
      setNotice(ar ? 'تم إرسال الرسالة.' : 'Message sent.');
      await loadRecent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (ar ? 'تعذر إرسال الرسالة.' : 'Unable to send the message.'));
    } finally {
      setSending(false);
    }
  };

  return <section className={css.inbox} data-theme={isDark ? 'dark' : 'light'} dir={ar ? 'rtl' : 'ltr'}>
    <header className={css.intro}>
      <span className={css.headingIcon}><MessageSquareText size={20} /></span>
      <div className={css.headingText}>
        <h3>{ar ? 'محادثات البوت' : 'Bot conversations'}</h3>
        <p>{ar ? 'الرسائل الواردة والردود، مرتبة حسب الشخص.' : 'Incoming messages and replies, organized by person.'}</p>
      </div>
      <button type="button" className={css.refresh} onClick={() => void loadRecent()} aria-label={ar ? 'تحديث المحادثات' : 'Refresh conversations'} title={ar ? 'تحديث' : 'Refresh'}>
        <RefreshCw size={17} className={refreshing ? css.spinning : ''} />
      </button>
    </header>

    {error && <p role="alert" className={css.error}>{error}</p>}

    <div className={css.layout}>
      <aside className={css.people} aria-label={ar ? 'الأشخاص' : 'People'}>
        <div className={css.peopleHeader}>
          <div><strong>{ar ? 'المحادثات' : 'Conversations'}</strong><span>{conversations.length}</span></div>
          <p>{ar ? 'اختر شخصًا لعرض الرسائل' : 'Select a person to view messages'}</p>
        </div>
        <label className={css.searchBox}>
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? 'ابحث عن شخص أو رسالة' : 'Search people or messages'} aria-label={ar ? 'بحث في المحادثات' : 'Search conversations'} />
        </label>
        <div className={css.peopleList}>
          {loading && !messages.length ? <p className={css.listEmpty}>{ar ? 'جارٍ تحميل المحادثات...' : 'Loading conversations...'}</p>
            : visibleConversations.length ? visibleConversations.map((person) => <button
              key={person.id} type="button" className={css.person} data-active={selectedId === person.id}
              onClick={() => { setSelectedId(person.id); setNotice(''); }}
              aria-label={`${person.name}، ${person.received} ${ar ? 'رسائل واردة' : 'incoming messages'}`}
              aria-current={selectedId === person.id ? 'true' : undefined}
            >
              <Avatar image={person.image} name={person.name} />
              <span className={css.personInfo}><strong>{person.name}</strong><small>{person.latest.content || (ar ? 'مرفق' : 'Attachment')}</small></span>
              <span className={css.personMeta}><time>{timeLabel(person.latest.createdAt, ar)}</time><small>{person.received} <MessageSquareText size={11} /></small></span>
            </button>) : <p className={css.listEmpty}>{search ? (ar ? 'لا توجد نتائج.' : 'No matches.') : (ar ? 'لا توجد رسائل مسجلة بعد.' : 'No recorded messages yet.')}</p>}
          {olderCursor && <button type="button" className={css.older} onClick={() => void loadOlder()} disabled={loadingOlder}>{loadingOlder ? (ar ? 'جارٍ التحميل...' : 'Loading...') : (ar ? 'تحميل محادثات أقدم' : 'Load older conversations')}</button>}
        </div>
        <div className={css.newConversation}>
          <label htmlFor="bot-new-discord-id"><UserRoundPlus size={15} />{ar ? 'مراسلة شخص جديد' : 'New conversation'}</label>
          <div><input id="bot-new-discord-id" dir="ltr" inputMode="numeric" maxLength={22} value={newId} onChange={(event) => setNewId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') startConversation(); }} placeholder="Discord ID" />
            <button type="button" disabled={!/^\d{16,22}$/.test(newId.trim())} onClick={startConversation} aria-label={ar ? 'فتح المحادثة' : 'Open conversation'}><ChevronLeft size={18} /></button></div>
        </div>
      </aside>

      <div className={css.chat}>
        {selectedId ? <>
          <header className={css.chatHeader}>
            <Avatar image={selected?.image} name={selected?.name || selectedId} />
            <div><strong>{selected?.name || selectedId}</strong><small dir="ltr">{selectedId}</small></div>
            <span className={css.chatCount}>{thread.length} {ar ? 'رسالة' : 'messages'}</span>
          </header>
          <div ref={messagesRef} className={css.messages} role="log" aria-label={ar ? 'سجل المحادثة' : 'Conversation history'}>
            {thread.length ? thread.map((message) => <article key={message.id} className={css.message} data-direction={message.direction}>
              <Avatar image={message.direction === 'in' ? message.image || selected?.image : null} name={message.direction === 'in' ? selected?.name || message.name : 'T3N'} bot={message.direction === 'out'} />
              <div className={css.messageBody}>
                <div className={css.messageMeta}><strong>{message.direction === 'in' ? selected?.name || message.name : (ar ? 'بوت تعن' : 'T3N Bot')}</strong><span>{message.direction === 'in' ? (ar ? 'واردة' : 'Received') : (ar ? 'مرسلة' : 'Sent')}</span><time>{timeLabel(message.createdAt, ar)}</time></div>
                {message.content && <p>{message.content}</p>}
                {message.attachments && <Attachment value={message.attachments} />}
              </div>
            </article>) : <div className={css.emptyThread}><Bot size={26} /><strong>{ar ? 'محادثة جديدة' : 'New conversation'}</strong><p>{ar ? 'اكتب رسالتك أدناه لبدء المحادثة.' : 'Write a message below to start the conversation.'}</p></div>}
          </div>
          <div className={css.composer}>
            {notice && <p role="status" className={css.notice}>{notice}</p>}
            <label htmlFor="bot-chat-reply">{ar ? 'الرد على المحادثة' : 'Reply to conversation'}</label>
            <textarea id="bot-chat-reply" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1200} rows={2} placeholder={ar ? 'اكتب رسالتك هنا...' : 'Write your message here...'} />
            <div><span>{body.length}/1200</span><button type="button" onClick={() => void send()} disabled={sending || body.trim().length < 2}><Send size={15} />{sending ? (ar ? 'جارٍ الإرسال...' : 'Sending...') : (ar ? 'إرسال بالخاص' : 'Send DM')}</button></div>
          </div>
        </> : <div className={css.noSelection}><Bot size={30} /><strong>{ar ? 'اختر محادثة' : 'Select a conversation'}</strong><p>{ar ? 'تظهر هنا الرسائل الواردة والمرسلة مرتبة بالوقت.' : 'Incoming and sent messages appear here in time order.'}</p></div>}
      </div>
    </div>
    <p className={css.historyNote}>{ar ? 'يظهر السجل الذي حفظه البوت منذ تفعيل تسجيل الرسائل. استخدم «تحميل محادثات أقدم» لعرض المزيد.' : 'This shows messages recorded since bot logging was enabled. Use “Load older conversations” for more.'}</p>
  </section>;
}
