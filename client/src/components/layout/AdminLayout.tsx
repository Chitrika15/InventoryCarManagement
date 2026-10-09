import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar.js';
import { CommandPalette } from '../ui/CommandPalette.js';
import { Search, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';

export const AdminLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
              Management Portal
            </span>
            <span className="text-slate-300 dark:text-navy-700 hidden sm:inline">/</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              StockDrive Ops
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  ctrlKey: true,
                  metaKey: true,
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Command Palette</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-navy-900 rounded border border-slate-200 dark:border-navy-700 font-mono">
                Ctrl+K
              </kbd>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-navy-800">
              <div className="w-8 h-8 rounded-full bg-accent-500/15 text-accent-500 font-bold text-xs flex items-center justify-center">
                {user?.name?.[0] || 'A'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Admin Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
