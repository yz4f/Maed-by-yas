import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  Plus, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../api.ts';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'admin' | 'owner';
  message: string;
  image_url?: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export const SupportChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  
  // Create ticket form states
  const [isCreating, setIsCreating] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('سؤال عام');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketImage, setTicketImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reply form states
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserTickets = async () => {
    try {
      const res = await apiFetch('/user/tickets');
      if (res && res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserTickets();
      const interval = setInterval(fetchUserTickets, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicketId, tickets]);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTicketImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim() && !ticketImage) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const formData = new FormData();
      formData.append('title', ticketTitle);
      formData.append('message', ticketMessage.trim());
      if (ticketImage) {
        formData.append('image', ticketImage);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const res = await response.json();
      if (res && res.success) {
        setTicketMessage('');
        setTicketImage(null);
        setImagePreview(null);
        setIsCreating(false);
        await fetchUserTickets();
        
        if (res.ticket) {
          setActiveTicketId(res.ticket.id);
        }
      } else {
        setCreateError(res.error || 'فشل في فتح التذكرة');
      }
    } catch (err) {
      setCreateError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || (!replyText.trim() && !replyImage)) return;

    setReplyLoading(true);
    try {
      const formData = new FormData();
      formData.append('message', replyText.trim());
      if (replyImage) {
        formData.append('image', replyImage);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const res = await response.json();
      if (res && res.success) {
        setReplyText('');
        setReplyImage(null);
        setReplyImagePreview(null);
        await fetchUserTickets();
      }
    } catch (err) {
      console.error('Error replying:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseActiveTicket = async () => {
    if (!activeTicketId) return;
    if (!window.confirm('هل تريد إغلاق هذه التذكرة؟')) return;
    try {
      const res = await apiFetch(`/user/tickets/${activeTicketId}/close`, {
        method: 'POST'
      });
      if (res && res.success) {
        await fetchUserTickets();
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 text-right" dir="rtl">
      
      {/* ─── CHAT OPEN TRIGGEER BUTTON ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-xl shadow-sky-500/20 hover:scale-105 transition-all duration-300 relative border border-sky-400/30 cursor-pointer"
      >
        {isOpen ? <X className="w-6 h-6 animate-spin-once" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && tickets.some(t => t.status === 'open') && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#07090e] animate-ping" />
        )}
      </button>

      {/* ─── FLOATING CHAT PANEL ─── */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 sm:w-96 h-[500px] bg-[#0a0d14]/95 border border-gray-800 rounded-[24px] shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-md animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-[#121826] border-b border-gray-900 px-4.5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">الدعم الفني المباشر</h3>
                <p className="text-[9px] text-[#22C55E] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>متصلين لمساعدتك</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#07090e]/40">
            
            {/* VIEW A: ACTIVE CHAT SCREEN */}
            {activeTicket ? (
              <div className="flex flex-col h-full justify-between gap-4">
                
                {/* Chat window Header Info */}
                <div className="bg-[#121826]/75 border border-gray-900 p-2.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">
                      {activeTicket.title}
                    </span>
                    <span className="text-[9px] text-gray-500 font-sans mr-2">#{activeTicket.id.slice(0, 8)}</span>
                  </div>
                  
                  {activeTicket.status === 'open' ? (
                    <button
                      onClick={handleCloseActiveTicket}
                      className="text-[9px] text-rose-400 hover:text-rose-300 font-bold border border-rose-500/20 px-2 py-0.5 rounded bg-rose-500/5 cursor-pointer"
                    >
                      إغلاق التذكرة
                    </button>
                  ) : (
                    <span className="text-[9px] text-gray-500 font-bold">تذكرة مغلقة</span>
                  )}
                </div>

                {/* Messages Loop */}
                <div className="flex-1 overflow-y-auto max-h-[280px] space-y-3.5 pr-0.5 custom-scrollbar">
                  {activeTicket.messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'owner';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <span className="text-[8px] text-gray-500 mb-0.5 font-bold">
                          {isAdmin ? `الدعم (${msg.sender_name})` : 'أنت'}
                        </span>
                        <div
                          className={`p-3 rounded-xl max-w-[85%] text-right text-xs leading-relaxed border ${
                            isAdmin
                              ? 'bg-[#121826] text-gray-200 border-gray-900 rounded-tr-none'
                              : 'bg-[#3B82F6] text-white border-[#3B82F6] rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="Attach screenshot"
                              className="mt-2 rounded-lg max-h-[140px] w-auto object-cover cursor-pointer border border-black/10"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Reply Area */}
                {activeTicket.status === 'open' ? (
                  <form onSubmit={handleSendReply} className="border-t border-gray-900 pt-3 space-y-2 shrink-0">
                    {replyImagePreview && (
                      <div className="flex items-center gap-2 bg-[#121826] p-1.5 rounded-lg max-w-xs">
                        <img src={replyImagePreview} alt="Preview" className="w-8 h-8 object-cover rounded" />
                        <span className="text-[9px] text-gray-400 truncate flex-1 font-sans">{replyImage?.name}</span>
                        <button
                          type="button"
                          onClick={() => { setReplyImage(null); setReplyImagePreview(null); }}
                          className="text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => replyFileInputRef.current?.click()}
                        className="w-9 h-9 rounded-lg bg-[#121826] hover:bg-gray-800 text-gray-400 border border-gray-900 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                        title="إرفاق صورة"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        onChange={handleReplyImageChange}
                        accept="image/*"
                        className="hidden"
                      />

                      <input
                        type="text"
                        placeholder="اكتب ردك الفني..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-[#121826] border border-gray-900 focus:border-[#3B82F6]/60 text-white placeholder-gray-600 text-xs px-3 py-2.5 rounded-lg outline-none transition-all"
                        disabled={replyLoading}
                      />

                      <button
                        type="submit"
                        disabled={replyLoading || (!replyText.trim() && !replyImage)}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-850 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-2 text-[10px] text-gray-500 font-bold border-t border-gray-900">
                    هذه التذكرة مغلقة.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTicketId(null)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 self-start font-bold cursor-pointer mt-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة إلى التذاكر</span>
                </button>

              </div>
            ) : isCreating ? (
              
              /* VIEW B: NEW TICKET FORM SCREEN */
              <form onSubmit={handleCreateTicket} className="space-y-4 text-right">
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-black text-white">فتح تذكرة دعم جديدة</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5">يرجى ملء التفاصيل لربطك بالدعم الفني</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400">قسم ونوع المشكلة</label>
                  <select
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full bg-[#121826] border border-gray-900 text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-[#3B82F6]/60 font-sans"
                  >
                    <option value="تحسين جهاز">تحسين أداء الجهاز</option>
                    <option value="ترتيب">ترتيب وتنسيق الموقع</option>
                    <option value="حل مشاكل">حل مشكلة برمجية/تفعيل</option>
                    <option value="اضافات">طلب إضافات/مميزات</option>
                    <option value="سؤال عام">سؤال فني عام</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400">شرح المشكلة أو الملاحظة</label>
                  <textarea
                    rows={4}
                    placeholder="اكتب تفاصيل سؤالك أو ملاحظتك هنا..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-[#121826] border border-gray-900 text-white placeholder-gray-600 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-[#3B82F6]/60 resize-none"
                    required
                  />
                </div>

                {/* Screenshot input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 block">إرفاق لقطة شاشة (اختياري)</label>
                  {imagePreview ? (
                    <div className="flex items-center gap-2 bg-[#121826] p-2 rounded-lg border border-gray-900">
                      <img src={imagePreview} alt="Screenshot preview" className="w-10 h-10 object-cover rounded" />
                      <span className="text-[9px] text-gray-400 truncate flex-1 font-sans">{ticketImage?.name}</span>
                      <button
                        type="button"
                        onClick={() => { setTicketImage(null); setImagePreview(null); }}
                        className="text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 rounded-lg bg-[#121826] hover:bg-gray-800 border border-gray-900 border-dashed text-gray-500 hover:text-white transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <ImageIcon className="w-4 h-4 text-[#3B82F6]" />
                      <span>اضغط لإرفاق لقطة شاشة</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCreateImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {createError && (
                  <div className="p-2 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-[10px] rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 shrink-0">
                  <button
                    type="submit"
                    disabled={createLoading || (!ticketMessage.trim() && !ticketImage)}
                    className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-850 text-white font-extrabold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {createLoading ? 'جاري الفتح...' : 'تأكيد إرسال التذكرة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="bg-[#121826] hover:bg-gray-800 text-gray-400 border border-gray-900 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            ) : (
              
              /* VIEW C: TICKETS INDEX LIST SCREEN */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-black text-white">محادثاتك السابقة</h4>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>تذكرة جديدة</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5 custom-scrollbar">
                  {tickets.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 space-y-3">
                      <MessageSquare className="w-10 h-10 mx-auto text-gray-800" />
                      <div>
                        <p className="text-xs font-bold text-gray-400">لا توجد تذاكر دعم سابقة</p>
                        <p className="text-[9px] text-gray-600 mt-1">اضغط على زر "تذكرة جديدة" لبدء محادثة</p>
                      </div>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const isClosed = ticket.status === 'closed';
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => setActiveTicketId(ticket.id)}
                          className="p-3 bg-[#121826]/80 hover:bg-[#121826] border border-gray-900 hover:border-[#3B82F6]/30 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 text-right"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white truncate">{ticket.title}</span>
                              <span className={`text-[8px] px-1.5 rounded font-black uppercase font-sans shrink-0 ${
                                isClosed 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isClosed ? 'مغلقة' : 'مفتوحة'}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1 truncate">
                              {ticket.messages[ticket.messages.length - 1]?.message || 'محادثة جديدة'}
                            </p>
                          </div>
                          
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
