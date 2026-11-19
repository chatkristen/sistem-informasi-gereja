import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm';

  const variants = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-600 active:scale-[0.98]',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 active:scale-[0.98]',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 shadow-gold-500/20 shadow-md focus:ring-gold-400 active:scale-[0.98]',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-navy-500 active:scale-[0.98]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 shadow-none focus:ring-slate-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
