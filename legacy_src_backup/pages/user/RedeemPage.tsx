import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import type { AppPage } from '../../types.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

interface RedeemPageProps {
  onNavigate: (page: AppPage) => void;
  toast: ToastFunctions;
}

export function RedeemPage({ onNavigate, toast }: RedeemPageProps) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch('/keys/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() })
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('products');
        }, 2000);
      } else {
        if (res.error?.includes('used') || res.error?.includes('مستخدم')) {
          toast.error('خطأ', 'هذا المفتاح مستخدم مسبقاً');
        } else {
          toast.error('خطأ', 'مفتاح ترخيص غير صالح');
        }
      }
    } catch (err) {
      toast.error('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card variant="glass" className="p-8 text-center relative overflow-hidden bg-[#0D1829] border border-sky-900/25 shadow-none" noPadding={false}>
          {/* Subtle Background Glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-sky-500/10 blur-[50px] pointer-events-none" />

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 relative z-10"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] border border-sky-400/40 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-sky-950/60 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                  <KeyRound className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-black text-white font-alexandria mb-2 tracking-wide">تفعيل ترخيص جديد</h1>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    أدخل مفتاح الترخيص الخاص بك لتفعيل المنتج وإضافته فورياً إلى حسابك.
                  </p>
                </div>

                <form onSubmit={handleRedeem} className="space-y-5 pt-2">
                  <div className="relative group">
                    <input
                      type="text"
                      dir="ltr"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toUpperCase())}
                      placeholder="TA3N-XXXX-XXXX-XXXX"
                      className="w-full bg-[#070E1A] border border-sky-900/40 focus:border-[#0EA5E9] text-white font-mono text-center text-lg sm:text-xl tracking-[0.15em] rounded-2xl px-4 py-4 outline-none transition-all placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(14,165,233,0.15)] group-hover:border-sky-800"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!key.trim() || loading}
                    isLoading={loading}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                    fullWidth
                    className="py-4 text-base bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white border-0 shadow-[0_0_20px_rgba(14,165,233,0.25)]"
                  >
                    تفعيل الترخيص الحصري
                  </Button>
                </form>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>تفعيل آمن وفوري 100% بدون تأخير</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 space-y-5 relative z-10"
              >
                <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white font-alexandria mb-2">تم التفعيل بنجاح!</h2>
                  <p className="text-sm text-gray-400">
                    تم إضافة المنتج فورياً إلى حسابك. جاري تحويلك...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
