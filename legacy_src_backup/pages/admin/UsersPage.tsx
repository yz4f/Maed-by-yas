import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Ban, Trash2, CheckCircle, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { DataTable } from '../../components/ui/DataTable.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export function AdminUsersPage({ toast }: { toast: ToastFunctions }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState<{ isOpen: boolean; id: string | null; reason: string }>({ isOpen: false, id: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users');
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('خطأ', 'فشل في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModal.id) return;
    try {
      await apiFetch(`/admin/users/${banModal.id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason: banModal.reason })
      });
      toast.success('نجاح', 'تم حظر المستخدم');
      setBanModal({ isOpen: false, id: null, reason: '' });
      fetchUsers();
    } catch (error) {
      toast.error('خطأ', 'فشل في حظر المستخدم');
    }
  };

  const handleUnban = async (id: string) => {
    try {
      await apiFetch(`/admin/users/${id}/unban`, { method: 'POST' });
      toast.success('نجاح', 'تم فك الحظر عن المستخدم');
      fetchUsers();
    } catch (error) {
      toast.error('خطأ', 'فشل في فك الحظر');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await apiFetch(`/admin/users/${deleteModal.id}`, { method: 'DELETE' });
      toast.success('نجاح', 'تم حذف المستخدم');
      setDeleteModal({ isOpen: false, id: null });
      fetchUsers();
    } catch (error) {
      toast.error('خطأ', 'فشل في حذف المستخدم');
    }
  };

  const columns = [
    { 
      key: 'avatar', 
      title: 'الصورة', 
      width: '60px',
      render: (item: any) => (
        <div className="relative">
          <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=random`} alt={item.name} className="w-10 h-10 rounded-full border border-white/[0.05] shadow-sm" />
          {item.role === 'admin' && (
            <div className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full p-0.5 border-2 border-[#0a0a14]">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'name', 
      title: 'المستخدم',
      render: (item: any) => (
        <div>
          <div className="font-bold text-white flex items-center gap-2">
            {item.name}
            {item.is_banned && <Badge variant="error" size="sm">محظور</Badge>}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">{item.email}</div>
        </div>
      )
    },
    { 
      key: 'role', 
      title: 'الرتبة',
      width: '100px',
      render: (item: any) => (
        <Badge variant={item.role === 'admin' ? 'info' : 'neutral'} dot>
          {item.role === 'admin' ? 'مدير' : 'مستخدم'}
        </Badge>
      )
    },
    { 
      key: 'stats', 
      title: 'النشاط', 
      render: (item: any) => (
        <div className="text-xs">
          <div className="text-gray-300">
            المنتجات: <span className="font-bold text-emerald-400">{item.products_count || 0}</span>
          </div>
          <div className="text-gray-500 mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            آخر دخول: {item.last_login ? new Date(item.last_login).toLocaleDateString('ar-SA') : 'لم يدخل'}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'إجراءات',
      width: '120px',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.is_banned ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleUnban(item.id)} 
              className="text-emerald-500 hover:text-emerald-400 w-8 h-8" 
              title="فك الحظر"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setBanModal({ isOpen: true, id: item.id, reason: '' })} 
              className="text-amber-500 hover:text-amber-400 w-8 h-8" 
              title="حظر المستخدم"
            >
              <Ban className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDeleteModal({ isOpen: true, id: item.id })} 
            className="text-gray-500 hover:text-rose-400 w-8 h-8" 
            title="حذف نهائي"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <Users className="w-6 h-6 text-sky-400" />
            إدارة المستخدمين
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            تحكم في حسابات المستخدمين، الرتب، وحالات الحظر.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Badge variant="info">إجمالي: {users.length}</Badge>
          <Badge variant="error">محظورين: {users.filter(u => u.is_banned).length}</Badge>
        </div>
      </Card>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" noPadding className="overflow-hidden">
          <div className="p-4">
            <DataTable 
              data={users} 
              columns={columns} 
              loading={loading} 
              searchable 
              searchPlaceholder="ابحث بالاسم أو البريد الإلكتروني..."
              emptyMessage="لا يوجد مستخدمين مسجلين" 
              emptyIcon={<Users className="w-12 h-12 text-gray-500" />} 
            />
          </div>
        </Card>
      </motion.div>

      {/* Ban Modal */}
      <AnimatePresence>
        {banModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBanModal({ isOpen: false, id: null, reason: '' })} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md z-10"
            >
              <Card variant="glass" className="border-amber-500/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 border-b border-white/[0.05] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white font-alexandria">حظر المستخدم</h2>
                </div>
                
                <form onSubmit={handleBan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">سبب الحظر (اختياري، يظهر للمستخدم)</label>
                    <textarea 
                      value={banModal.reason} 
                      onChange={(e) => setBanModal({...banModal, reason: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all h-28 resize-none" 
                      placeholder="اكتب سبب الحظر هنا لتوثيقه..." 
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.05] mt-6">
                    <Button type="button" variant="ghost" onClick={() => setBanModal({ isOpen: false, id: null, reason: '' })}>
                      إلغاء
                    </Button>
                    <Button type="submit" variant="danger">
                      تأكيد الحظر
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="حذف المستخدم نهائياً"
        message="هل أنت متأكد من حذف هذا المستخدم؟ سيتم مسح كافة البيانات المرتبطة به ولن يتمكن من الدخول للمنصة مرة أخرى."
        variant="error"
        confirmText="نعم، احذف المستخدم"
        cancelText="تراجع"
      />
    </div>
  );
}
