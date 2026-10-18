'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { toast, ToastItem } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => {
        // Prevent duplicate text in active toasts
        if (prev.some((t) => t.message === newToast.message)) return prev;
        return [...prev, newToast].slice(-5); // Stack max 5
      });

      // Auto dismiss after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[99999] pointer-events-none flex flex-col gap-2.5 items-end max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <AnimatePresence mode="sync">
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout="position"
            initial={reduceMotion ? false : { opacity: 0, x: 14, y: -3, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: 10, scale: 0.985, transition: { duration: 0.14, ease: 'easeIn' } }}
            whileHover={reduceMotion ? undefined : { x: -2, y: -2, scale: 1.01 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1], layout: { duration: reduceMotion ? 0 : 0.18 } }}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`toast-card toast-card--${item.type} backdrop-blur-xl border shadow-[0_12px_34px_rgba(0,11,28,0.30)] rounded-xl px-3.5 py-3 pointer-events-auto relative overflow-hidden flex items-center gap-2.5 min-w-[240px] max-w-full`}
          >
            <div className="toast-card__icon shrink-0">
              {item.type === 'error' ? <AlertCircle className="w-4 h-4" /> : item.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : item.type === 'info' ? <Info className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <span className="text-[13px] font-semibold text-white tracking-wide select-none leading-relaxed">
              {item.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
