import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Sparkles } from 'lucide-react';
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

export function AdminProductsPage({ toast }: { toast: ToastFunctions }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [formData, setFormData] = useState({ name: '', description: '', category: '', image: '', status: 'active' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/products');
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      toast.error('خطأ', 'فشل في جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await apiFetch(`/admin/products/${currentProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('نجاح', 'تم تحديث المنتج بنجاح');
      } else {
        await apiFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('نجاح', 'تم إضافة المنتج بنجاح');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('خطأ', 'فشل في حفظ المنتج');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await apiFetch(`/admin/products/${deleteModal.id}`, { method: 'DELETE' });
      toast.success('نجاح', 'تم حذف المنتج');
      setDeleteModal({ isOpen: false, id: null });
      fetchProducts();
    } catch (error) {
      toast.error('خطأ', 'فشل في حذف المنتج');
    }
  };

  const toggleStatus = async (product: any) => {
    const newStatus = product.status === 'active' ? 'hidden' : 'active';
    try {
      await apiFetch(`/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...product, status: newStatus })
      });
      fetchProducts();
      toast.success('نجاح', 'تم تحديث حالة المنتج');
    } catch (error) {
      toast.error('خطأ', 'فشل في تحديث حالة المنتج');
    }
  };

  const openModal = (product: any = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({ name: product.name, description: product.description, category: product.category, image: product.image, status: product.status });
    } else {
      setFormData({ name: '', description: '', category: '', image: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const columns = [
    { 
      key: 'image', 
      title: 'الصورة', 
      width: '100px',
      render: (item: any) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.05] bg-[#030712]">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )
    },
    { 
      key: 'name', 
      title: 'المنتج',
      render: (item: any) => (
        <div>
          <div className="font-bold text-white mb-1">{item.name}</div>
          <div className="text-[10px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded inline-block">
            {item.category || 'غير مصنف'}
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      title: 'الحالة', 
      width: '120px',
      render: (item: any) => (
        <Badge variant={item.status === 'active' ? 'success' : 'neutral'}>
          {item.status === 'active' ? 'نشط' : 'مخفي'}
        </Badge>
      )
    },
    { 
      key: 'stats', 
      title: 'الإحصائيات',
      render: (item: any) => (
        <div className="flex gap-4 text-xs font-mono">
          <div className="text-center">
            <span className="block text-gray-500 mb-1 font-sans">تفعيلات</span>
            <span className="text-emerald-400">{item.activations_count || 0}</span>
          </div>
          <div className="text-center">
            <span className="block text-gray-500 mb-1 font-sans">تحميلات</span>
            <span className="text-sky-400">{item.downloads_count || 0}</span>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'إجراءات',
      width: '150px',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleStatus(item)}
            className="w-8 h-8 text-gray-400 hover:text-white"
            title={item.status === 'active' ? 'إخفاء' : 'إظهار'}
          >
            {item.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openModal(item)}
            className="w-8 h-8 text-gray-400 hover:text-sky-400"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
            className="w-8 h-8 text-gray-400 hover:text-rose-400"
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
            <Package className="w-6 h-6 text-sky-400" />
            إدارة المنتجات
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            أضف وعدل منتجات المتجر التي تظهر للمستخدمين.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => openModal()} 
          leftIcon={<Plus className="w-4 h-4" />}
          className="mt-4 sm:mt-0"
        >
          إضافة منتج جديد
        </Button>
      </Card>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" noPadding className="overflow-hidden">
          <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
            <Badge variant="info" icon={<Sparkles className="w-3.5 h-3.5" />}>
              إجمالي المنتجات: {products.length}
            </Badge>
          </div>
          <div className="p-4">
            <DataTable 
              data={products} 
              columns={columns} 
              loading={loading} 
              emptyMessage="لا توجد منتجات مسجلة في النظام" 
              emptyIcon={<Package className="w-12 h-12 text-gray-500" />} 
              searchable 
            />
          </div>
        </Card>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg z-10"
            >
              <Card variant="glass" className="border-sky-500/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 border-b border-white/[0.05] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    {currentProduct ? <Edit className="w-5 h-5 text-sky-400" /> : <Plus className="w-5 h-5 text-sky-400" />}
                  </div>
                  <h2 className="text-xl font-bold text-white font-alexandria">
                    {currentProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
                  </h2>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">اسم المنتج</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-sky-500/50" 
                      placeholder="مثال: Spoofer V1"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">التصنيف</label>
                    <input 
                      type="text" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-sky-500/50" 
                      placeholder="مثال: أدوات الحماية"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">رابط الصورة (URL)</label>
                    <input 
                      type="url" 
                      value={formData.image} 
                      onChange={(e) => setFormData({...formData, image: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-sky-500/50 text-left" 
                      placeholder="https://..."
                      dir="ltr"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">الوصف</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-sky-500/50 h-24 resize-none" 
                      placeholder="اكتب وصفاً جذاباً للمنتج..."
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">حالة الظهور</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-sky-500/50"
                    >
                      <option value="active">مفعل (يظهر للمستخدمين)</option>
                      <option value="hidden">مخفي</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.05] mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" variant="primary">
                      {currentProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
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
        title="حذف المنتج"
        message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المتعلقة به."
        variant="error"
        confirmText="نعم، احذف المنتج"
        cancelText="إلغاء"
      />
    </div>
  );
}
