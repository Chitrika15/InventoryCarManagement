import React from 'react';
import { Wrench, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-navy-950 border-t border-slate-200/80 dark:border-navy-800 transition-colors mt-20 no-print">
      {/* Feature Value Props */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-100 dark:border-navy-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/40">
            <div className="p-3 rounded-xl bg-accent-500/10 text-accent-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">100% Genuine Parts</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Authentic manufacturer warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/40">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Express Dispatch</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fast delivery nationwide</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/40">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Easy Returns</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hassle-free 15-day return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/40">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Professional Support</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automotive specialist assistance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">StockDrive IMS</span>
          <span>© 2026. All rights reserved. Built with MERN Stack.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </span>
          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
};
