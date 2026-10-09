import React from 'react';
import { cn } from '../../lib/utils.js';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200/80 dark:border-navy-800 bg-white/80 dark:bg-navy-900/60 backdrop-blur-md shadow-sm transition-all duration-200',
      className
    )}
    {...props}
  />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6 pb-4', className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn('text-lg font-bold tracking-tight text-slate-900 dark:text-white', className)}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn('text-sm text-slate-500 dark:text-slate-400 mt-1', className)}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6 pt-0', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('p-6 pt-0 flex items-center justify-between', className)}
    {...props}
  />
);
