'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  label?: string;
}

export function CopyButton({ textToCopy, className = '', label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 text-slate-200 hover:text-sky-400 border border-slate-700 hover:border-sky-500/50 transition-all font-mono text-xs font-semibold active:scale-95 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1.5 text-emerald-400"
          >
            <Check className="w-3.5 h-3.5" />
            {label ? 'تم النسخ!' : ''}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {label || 'نسخ'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
