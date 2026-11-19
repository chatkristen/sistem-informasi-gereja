import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={cn('text-base font-bold text-navy-900 tracking-tight flex items-center gap-2', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'navy' | 'gold' | 'outline';
  className?: string;
}> = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    navy: 'bg-navy-50 text-navy-800 border-navy-200',
    gold: 'bg-gold-50 text-gold-900 border-gold-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 disabled:bg-slate-50 disabled:text-slate-500',
            leftIcon && 'pl-10',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-600 disabled:bg-slate-50 disabled:text-slate-500',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
};
