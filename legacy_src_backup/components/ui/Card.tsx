import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'glass' | 'gradient';
  noPadding?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', noPadding = false, className = '', ...props }, ref) => {
    
    const variants = {
      default: 'bg-[#121212] border border-white/[0.04]',
      glass: 'bg-[#121212]/80 backdrop-blur-lg border border-white/[0.05]',
      gradient: 'bg-gradient-to-br from-[#151515] to-[#0F0F0F] border border-white/[0.05]',
    };

    return (
      <motion.div
        ref={ref}
        className={`
          rounded-xl overflow-hidden relative
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        <div className={`relative z-10 ${noPadding ? '' : 'p-5 sm:p-6'}`}>
          {children}
        </div>
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
