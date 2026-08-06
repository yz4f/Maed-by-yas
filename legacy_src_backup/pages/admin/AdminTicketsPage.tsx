import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../api.ts';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  Clock, 
  User, 
  Paperclip,
  Search,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

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

export const AdminTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTickets = async (autoSelect = false) => {
    try {
      const res = await apiFetch('/admin/tickets');
      if (res && res.success) {
        const sorted = (res.tickets || []).sort(
          (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setTickets(sorted);
        
        if (autoSelect && sorted.length > 0 && !selectedTicketId) {
          setSelectedTicketId(sorted[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => fetchTickets(false), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicketId, tickets]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || (!replyText.trim() && !imageFile)) return;
    
    setSendingReply(true);
    try {
      const formData = new FormData();
      formData.append('message', replyText.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const res = await response.json();
      if (res && res.success) {
        setReplyText('');
        clearImage();
        await fetchTickets(false);
      } else {
        alert(res.error || 'فشل في إرسال الرد');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('حدث خطأ أثناء إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إغلاق هذه المحادثة؟')) return;
    try {
      const res = await apiFetch(`/admin/tickets/${ticketId}/close`, {
        method: 'POST'
      });
      if (res && res.success) {
        await fetchTickets(false);
      } else {
        alert(res.error || 'فشل إغلاق التذكرة');
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' ? true : ticket.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-sky-400" />
            تذاكر الدعم الفني
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            تواصل مع العملاء وحل الاستفسارات والمشاكل الفنية.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Badge variant="success" dot>
            {tickets.filter(t => t.status === 'open').length} نشطة حالياً
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Right Panel: Inbox */}
        <Card variant="glass" className="lg:col-span-1 border-white/[0.05] flex flex-col p-4 overflow-hidden h-full">
          <div className="space-y-4 shrink-0 mb-4">
            <div className="relative">
              <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم، البريد أو المشكلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 text-white placeholder-gray-500 text-sm pr-10 pl-4 py-3 rounded-xl outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'open', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                      : 'bg-[#030712] text-gray-400 hover:bg-white/[0.05] hover:text-white border border-white/[0.05]'
                  }`}
                >
                  {status === 'all' && 'الكل'}
                  {status === 'open' && 'المفتوحة'}
                  {status === 'closed' && 'المغلقة'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                <span className="text-xs font-mono">جاري التحميل...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 border border-dashed border-white/[0.05] rounded-xl bg-white/[0.02]">
                <span className="text-xs">لا توجد محادثات مطابقة</span>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicketId;
                  const lastMsg = ticket.messages[ticket.messages.length - 1];
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                          : 'bg-[#030712] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{ticket.user_name}</h4>
                        <Badge variant={ticket.status === 'open' ? 'success' : 'neutral'} size="sm">
                          {ticket.status === 'open' ? 'نشط' : 'مغلق'}
                        </Badge>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate max-w-[120px] font-mono">{ticket.user_email}</span>
                        <span className="font-mono text-[10px]">{new Date(ticket.updated_at).toLocaleDateString('ar-SA')}</span>
                      </div>

                      <div className="mt-3 border-t border-white/[0.05] pt-3 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-sky-400">
                          {ticket.title}
                        </span>
                        <p className="text-xs text-gray-400 truncate w-full">
                          {lastMsg ? lastMsg.message : 'لا توجد رسائل'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </Card>

        {/* Left Panel: Chat Interface */}
        <Card variant="glass" className="lg:col-span-2 border-white/[0.05] flex flex-col p-0 overflow-hidden h-full">
          
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/[0.05] p-5 shrink-0 bg-white/[0.01]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>{selectedTicket.user_name}</span>
                      <span className="text-xs text-gray-500 font-mono font-normal">({selectedTicket.user_email})</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="info" size="sm">{selectedTicket.title}</Badge>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        تحديث: {new Date(selectedTicket.updated_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTicket.status === 'open' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    إغلاق
                  </Button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90" style={{ backgroundBlendMode: 'overlay', backgroundColor: '#0a0a14' }}>
                {selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'owner';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-[10px] font-bold text-gray-400">
                          {msg.sender_name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10 text-gray-300'}`}>
                          {msg.sender_role === 'owner' ? 'المالك' : msg.sender_role === 'admin' ? 'الإدارة' : 'العميل'}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[70%] border shadow-lg ${
                          isAdmin
                            ? 'bg-sky-600 text-white border-sky-500 rounded-tr-sm bg-gradient-to-br from-sky-500 to-sky-700'
                            : 'bg-[#171F2F] text-gray-100 border-white/[0.05] rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        
                        {msg.image_url && (
                          <div className="mt-3 relative group overflow-hidden rounded-xl border border-black/20 shadow-inner">
                            <img
                              src={msg.image_url}
                              alt="Attachment"
                              className="max-h-[250px] w-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
                              <span className="text-xs text-white font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                فتح المرفق
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 mt-1.5 font-mono px-2">
                        {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              {selectedTicket.status === 'open' ? (
                <div className="p-5 border-t border-white/[0.05] bg-white/[0.02] shrink-0">
                  {imagePreview && (
                    <div className="flex items-center gap-3 bg-[#030712] border border-white/[0.05] p-3 rounded-xl max-w-sm mb-4 shadow-md">
                      <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                      <div className="flex-1 text-right min-w-0">
                        <p className="text-xs text-white truncate">{imageFile?.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{(imageFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearImage} className="text-rose-400 hover:text-rose-300 w-8 h-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="flex gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-xl bg-[#030712] hover:bg-white/[0.05] text-gray-400 hover:text-white border border-white/[0.08] flex items-center justify-center transition-all shrink-0 group"
                    >
                      <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <input
                      type="text"
                      placeholder="اكتب ردك هنا..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 text-white placeholder-gray-500 text-sm px-5 py-3.5 rounded-xl outline-none transition-all shadow-inner"
                      disabled={sendingReply}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={sendingReply}
                      disabled={(!replyText.trim() && !imageFile)}
                      leftIcon={!sendingReply && <Send className="w-4 h-4" />}
                      className="h-12 px-6 shadow-lg shadow-sky-500/20"
                    >
                      إرسال
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="p-5 border-t border-white/[0.05] bg-white/[0.01] shrink-0">
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center text-sm text-rose-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>المحادثة مغلقة. لا يمكن الرد على تذكرة مغلقة.</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-300">لم يتم اختيار تذكرة</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-[250px] leading-relaxed">يرجى تحديد تذكرة دعم من القائمة الجانبية لعرض المحادثة والرد على العميل.</p>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
};
