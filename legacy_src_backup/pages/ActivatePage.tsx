import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../auth.tsx';
import { apiFetch } from '../api.ts';
import { Key, Shield, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Lock, LayoutDashboard } from 'lucide-react';

interface ActivatePageProps {
  initialProductId?: string;
  onSuccessNavigate: () => void;
}

export const ActivatePage: React.FC<ActivatePageProps> = ({ onSuccessNavigate }) => {
  const { user, triggerGoogleLogin } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ productName: string; message: string } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('الرجاء إدخال مفتاح التفعيل أولاً');
      return;
    }

    if (!user) {
      setError('يجب تسجيل الدخول بحساب Google أولاً لتتمكن من ربط المفتاح بحسابك');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessInfo(null);

    try {
      const res = await apiFetch('/keys/redeem', {
        method: 'POST',
        body: { key: keyInput.trim() }
      });

      if (res && res.success) {
        setSuccessInfo({
          productName: res.productName || 'المنتج الرقمي',
          message: res.message || 'تم التفعيل بنجاح!'
        });
        setKeyInput('');
      }
    } catch (err: any) {
      setError(err.message || 'فشل تفعيل المفتاح. تأكد من صحة المفتاح وحاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-b from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-8 text-center">
          
          {/* Icon Header */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 mx-auto flex items-center justify-center shadow-xl shadow-sky-500/20 border border-sky-400/30">
            <Key className="w-10 h-10 text-white animate-bounce-slow" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white">تفعيل مفتاح منتج رقمي</h1>
          </div>

          {!user ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-4">
              <div className="flex items-center justify-center gap-2 font-bold text-base">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>تسجيل الدخول مطلوب للتفعيل</span>
              </div>
              <p className="text-xs text-amber-200/80 max-w-sm mx-auto leading-relaxed">
                لكي تضمن حماية مفتاحك وإمكانية العودة لتحميل ملفات المنتج في أي وقت من أي جهاز، يرجى تسجيل الدخول بحسابك عبر Google أولاً.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={triggerGoogleLogin}
                  className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  سجل دخولك الآن للمتابعة
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRedeem} className="space-y-6 max-w-lg mx-auto text-right">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300">
                  أدخل مفتاح المنتج (License Key / Serial):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="مثال: TA3N-PRO-XXXXXXXX-XXXX"
                    disabled={loading || !!successInfo}
                    className="w-full bg-gray-950/80 border border-gray-700/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-2xl px-5 py-4 text-center text-lg font-mono tracking-widest text-white placeholder:text-gray-600 transition-all outline-none shadow-inner uppercase disabled:opacity-50"
                  />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </motion.div>
              )}

              {successInfo ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">تم تفعيل {successInfo.productName} بنجاح!</h3>
                    <p className="text-xs text-emerald-200/90 mt-1">{successInfo.message}</p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onSuccessNavigate}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>انتقل لـ لوحتي لتحميل الملفات الآن</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !keyInput.trim()}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold py-4 rounded-2xl text-base shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري التحقق والتفعيل...</span>
                    </div>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>تفعيل المفتاح وربط المنتج</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}


        </div>
      </motion.div>
    </div>
  );
};
