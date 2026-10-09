import React from 'react';
import { cn } from '../../lib/utils.js';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer';

    const variants = {
      primary:
        'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/35 dark:focus:ring-offset-navy-950',
      secondary:
        'bg-navy-800 hover:bg-navy-700 text-white dark:bg-navy-800 dark:hover:bg-navy-700 dark:border dark:border-navy-700',
      outline:
        'border border-slate-300 dark:border-navy-700 bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-800 dark:text-slate-100',
      destructive:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-10 gap-2',
      lg: 'text-base px-6 py-3 h-12 gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
