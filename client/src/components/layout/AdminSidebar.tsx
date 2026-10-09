import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  BarChart3,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wrench,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { cn } from '../../lib/utils.js';
import { useToast } from '../ui/Toast.js';

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, clearAuth, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();
  const { success } = useToast();

  const handleLogout = () => {
    clearAuth();
    if (onCloseMobile) onCloseMobile();
    success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products Catalog', path: '/admin/products', icon: Package },
    { name: 'Stock & Ledger', path: '/admin/stock', icon: Boxes },
    { name: 'Orders Management', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Reports & Aggregations', path: '/admin/reports', icon: BarChart3 },
  ];

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 transition-all duration-300 flex flex-col h-screen sticky top-0 shrink-0 z-40',
          // Desktop styles
          collapsed ? 'md:w-20' : 'md:w-64',
          // Mobile responsive drawer styles
          'fixed inset-y-0 left-0 w-64 md:relative transform md:transform-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <Link
            to="/admin"
            onClick={handleNavClick}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-accent-500/25">
              <Wrench className="w-5 h-5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <h2 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  StockDrive
                </h2>
                <span className="text-[10px] font-bold tracking-wider text-accent-500 uppercase">
                  Admin Control
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Mobile Close */}
          <div className="flex items-center">
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
              aria-label="Close mobile sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                  isActive
                    ? 'bg-accent-500 text-white shadow-md shadow-accent-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Tools & User Info */}
        <div className="p-3 border-t border-slate-200 dark:border-navy-800 space-y-2">
          <Link
            to="/"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors',
              collapsed && !mobileOpen && 'justify-center'
            )}
            title="Back to Customer Storefront"
          >
            <Store className="w-4 h-4 text-emerald-500 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Go to Storefront</span>}
          </Link>

          <button
            onClick={toggleTheme}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer',
              collapsed && !mobileOpen && 'justify-center'
            )}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 shrink-0" />
            )}
            {(!collapsed || mobileOpen) && (
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
            {(!collapsed || mobileOpen) && (
              <div className="truncate mr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
