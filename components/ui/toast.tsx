'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastItem } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#111113]/95 backdrop-blur-md border border-white/[0.08] shadow-[0_6px_28px_rgba(0,0,0,0.65)] rounded-lg px-4 py-2.5 pointer-events-auto relative overflow-hidden flex items-center min-w-[220px] max-w-full"
          >
            {/* Minimal vertical accent line */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${
                item.type === 'error'
                  ? 'bg-rose-500/80'
                  : item.type === 'warning'
                  ? 'bg-amber-500/80'
                  : item.type === 'info'
                  ? 'bg-sky-500/80'
                  : 'bg-white/40'
              }`}
            />

            {/* Message */}
            <span className="text-[13px] font-semibold text-white tracking-wide pl-2.5 select-none leading-relaxed">
              {item.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
