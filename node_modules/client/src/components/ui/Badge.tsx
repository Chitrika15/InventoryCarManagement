import React from 'react';
import { cn } from '../../lib/utils.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300 border-slate-200 dark:border-navy-700',
    primary:
      'bg-accent-500/10 text-accent-600 dark:text-accent-400 border-accent-500/20',
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    outline:
      'bg-transparent border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
