import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/20',
      bg: 'bg-[#181A20]/95',
      progressColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/10',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
      border: 'border-red-500/30',
      bg: 'bg-[#181A20]/95',
      progressColor: 'bg-red-500',
      glow: 'shadow-red-500/10',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      border: 'border-amber-500/20',
      bg: 'bg-[#181A20]/95',
      progressColor: 'bg-amber-500',
      glow: 'shadow-amber-500/10',
    },
    info: {
      icon: <Info className="w-5 h-5 text-red-400 shrink-0" />,
      border: 'border-red-500/30',
      bg: 'bg-[#181A20]/95',
      progressColor: 'bg-[#C1121F]',
      glow: 'shadow-red-500/10',
    },
  };

  const c = config[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-2xl shadow-2xl ${c.border} ${c.bg} ${c.glow} pointer-events-auto overflow-hidden`}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div className={`h-full ${c.progressColor} toast-progress opacity-80`} />
      </div>

      {c.icon}
      <div className="flex-1 min-w-0 text-right">
        <h4 className="text-xs font-bold text-white leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

// Toast hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  }), [addToast]);

  return { toasts, addToast, removeToast, toast };
}
