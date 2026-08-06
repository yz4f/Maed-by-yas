import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface BadgeProps extends HTMLMotionProps<"span"> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'neutral', icon, className = '', ...props }, ref) => {
    
    const variants = {
      success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      error: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
      info: 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]',
      neutral: 'bg-white/5 text-gray-300 border-white/10',
    };

    return (
      <motion.span
        ref={ref}
        whileHover={{ scale: 1.05 }}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 
          text-[11px] font-bold font-alexandria tracking-wide 
          rounded-full border backdrop-blur-sm
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';
