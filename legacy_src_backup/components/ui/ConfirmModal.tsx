import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const variantConfig = {
  danger: {
    icon: <ShieldAlert className="h-6 w-6 text-red-500" />,
    buttonClass: 'bg-[#C1121F] hover:bg-[#E5383B] text-white shadow-lg shadow-red-950/40',
    iconBg: 'bg-red-950/60 border-red-900/40'
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40',
    iconBg: 'bg-amber-950/60 border-amber-900/40'
  },
  info: {
    icon: <Info className="h-6 w-6 text-red-400" />,
    buttonClass: 'bg-[#C1121F] hover:bg-[#E5383B] text-white shadow-lg shadow-red-950/40',
    iconBg: 'bg-red-950/60 border-red-900/40'
  }
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger'
}: ConfirmModalProps) {
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-md bg-[#181A20] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border shrink-0 ${config.iconBg}`}>
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`btn-primary text-xs ${config.buttonClass}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
