import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench,
  ShoppingCart,
  Sun,
  Moon,
  Search,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useCartStore } from '../../store/useCartStore.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { useToast } from '../ui/Toast.js';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, theme, toggleTheme, clearAuth } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCartItems = getTotalItems();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    clearAuth();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { name: 'All', href: '/' },
    { name: 'Tyres & Alloys', href: '/?category=tyres-alloys' },
    { name: 'Batteries', href: '/?category=batteries-inverters' },
    { name: 'Audio', href: '/?category=audio-infotainment' },
    { name: 'Lighting', href: '/?category=lighting-leds' },
    { name: 'Interior', href: '/?category=seat-covers-interior' },
    { name: 'Detailing', href: '/?category=detailing-car-care' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-navy-950/90 border-b border-slate-200/80 dark:border-navy-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center text-white shadow-lg shadow-accent-500/25 group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                StockDrive <span className="text-accent-500">IMS</span>
              </span>
              <span className="hidden sm:block text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                Auto Accessories & Care
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-slate-100/70 dark:hover:bg-navy-900 transition-all whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Cmd+K trigger shortcut */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  ctrlKey: true,
                  metaKey: true,
                });
                window.dispatchEvent(event);
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-900/50 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-700">
                ⌘K
              </kbd>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 border border-transparent hover:border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Cart Icon & Badge */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 border border-transparent hover:border-slate-200 dark:border-navy-800 transition-all"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white rounded-full text-[11px] font-bold flex items-center justify-center animate-in zoom-in-50 duration-150 shadow-sm shadow-accent-500/50">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* User Dropdown or Auth Buttons */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800/80 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name[0]}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                    {user.name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-accent-500" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    >
                      <Package className="w-4 h-4 text-blue-500" />
                      My Orders & Timeline
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs px-2.5 sm:px-3">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="text-xs px-2.5 sm:px-3">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-navy-800 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-1">
                Categories
              </span>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-navy-800 space-y-1">
                {user ? (
                  <>
                    <Link
                      to="/orders"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-blue-500" />
                      My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-accent-500 hover:bg-accent-50 dark:hover:bg-navy-900 transition-colors flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 p-2">
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
