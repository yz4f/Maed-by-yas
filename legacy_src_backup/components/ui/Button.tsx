import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-bold font-alexandria transition-all duration-300 overflow-hidden';
    
    const variants = {
      primary: 'bg-[#0EA5E9] text-white hover:bg-[#0284C7] shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] border border-sky-400/50',
      secondary: 'bg-[#1E293B] text-white hover:bg-[#334155] border border-white/10 hover:border-white/20',
      danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40',
      ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
      glass: 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-md',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
      lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5',
      icon: 'p-2 rounded-xl',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${className}
        `}
        {...props}
      >
        {/* Glow effect on hover for primary */}
        {variant === 'primary' && !isDisabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
        )}

        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        
        {children && <span>{children}</span>}
        
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
