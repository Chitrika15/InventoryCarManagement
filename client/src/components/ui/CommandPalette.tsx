import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  BarChart3,
  Store,
  PlusCircle,
  Moon,
  Sun,
  LogOut,
  Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useToast } from './Toast.js';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  adminOnly?: boolean;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user, toggleTheme, theme, clearAuth } = useAuthStore();
  const { success } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isAdmin = user?.role === 'admin';

  const commands: CommandItem[] = [
    {
      id: 'storefront',
      title: 'Storefront Catalog',
      description: 'Explore car accessories and catalog products',
      icon: <Store className="w-4 h-4 text-accent-500" />,
      action: () => {
        navigate('/');
        setIsOpen(false);
      },
    },
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      description: 'View KPIs, quick metrics, and analytics overview',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-500" />,
      action: () => {
        navigate('/admin');
        setIsOpen(false);
      },
      adminOnly: true,
    },
    {
      id: 'admin-products',
      title: 'Manage Products',
      description: 'Add, edit, or deactivate inventory accessories',
      icon: <Package className="w-4 h-4 text-emerald-500" />,
      action: () => {
        navigate('/admin/products');
        setIsOpen(false);
      },
      adminOnly: true,
    },
    {
      id: 'admin-stock',
      title: 'Stock Movements & Ledger',
      description: 'Stock IN/OUT adjustment and low stock alerts',
      icon: <Boxes className="w-4 h-4 text-amber-500" />,
      action: () => {
        navigate('/admin/stock');
        setIsOpen(false);
      },
      adminOnly: true,
    },
    {
      id: 'admin-orders',
      title: 'Orders Management',
      description: 'Filter orders, change status, and process cancellations',
      icon: <ShoppingCart className="w-4 h-4 text-purple-500" />,
      action: () => {
        navigate('/admin/orders');
        setIsOpen(false);
      },
      adminOnly: true,
    },
    {
      id: 'admin-reports',
      title: 'Analytics & Reports',
      description: 'View aggregation charts and export CSV reports',
      icon: <BarChart3 className="w-4 h-4 text-rose-500" />,
      action: () => {
        navigate('/admin/reports');
        setIsOpen(false);
      },
      adminOnly: true,
    },
    {
      id: 'customer-orders',
      title: 'My Orders',
      description: 'View personal order history and printable invoices',
      icon: <ShoppingCart className="w-4 h-4 text-indigo-500" />,
      action: () => {
        navigate('/orders');
        setIsOpen(false);
      },
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle visual appearance theme',
      icon:
        theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700" />
        ),
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      id: 'logout',
      title: 'Sign Out',
      description: 'Log out of current user account session',
      icon: <LogOut className="w-4 h-4 text-rose-500" />,
      action: () => {
        clearAuth();
        success('Logged out successfully');
        navigate('/');
        setIsOpen(false);
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (cmd.adminOnly && !isAdmin) return false;
    if (!query) return true;
    return (
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-navy-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search destination... (ESC to close)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-800 rounded border border-slate-300 dark:border-navy-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-navy-800/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 text-left transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800/80 group-hover:scale-110 transition-transform">
                  {cmd.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {cmd.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
