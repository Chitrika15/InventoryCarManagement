import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Footer } from './Footer.js';
import { CommandPalette } from '../ui/CommandPalette.js';

export const StoreLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
};
