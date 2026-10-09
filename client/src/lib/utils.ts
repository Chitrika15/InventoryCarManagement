import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getStockStatus(stock: number, reorderLevel: number = 5): {
  label: string;
  variant: 'in_stock' | 'low_stock' | 'out_of_stock';
  badgeClass: string;
} {
  if (stock <= 0) {
    return {
      label: 'Out of Stock',
      variant: 'out_of_stock',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    };
  }
  if (stock <= reorderLevel) {
    return {
      label: `Low Stock (${stock} left)`,
      variant: 'low_stock',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };
  }
  return {
    label: `In Stock (${stock})`,
    variant: 'in_stock',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  };
}
