import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast.js';
import { useAuthStore } from './store/useAuthStore.js';
import { api } from './lib/api.js';

// Layouts
import { StoreLayout } from './components/layout/StoreLayout.js';
import { AdminLayout } from './components/layout/AdminLayout.js';

// Route Guards
import { RequireAuth } from './components/auth/RequireAuth.js';
import { RequireRole } from './components/auth/RequireRole.js';

// Pages
import { CatalogPage } from './pages/store/CatalogPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { CartPage } from './pages/cart/CartPage.js';
import { OrdersPage } from './pages/orders/OrdersPage.js';
import { OrderDetailPage } from './pages/orders/OrderDetailPage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.js';
import { AdminStockPage } from './pages/admin/AdminStockPage.js';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { theme, setAuth } = useAuthStore();

  // Initialize theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Attempt silent refresh on app load to restore valid session if cookie exists
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.data) {
          const { user, accessToken } = res.data.data;
          setAuth(user, accessToken);
        }
      } catch {
        // No active refresh session, ignore
      }
    };
    restoreSession();
  }, [setAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Storefront Routes */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/orders"
                element={
                  <RequireAuth>
                    <OrdersPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RequireAuth>
                    <OrderDetailPage />
                  </RequireAuth>
                }
              />
            </Route>

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Management Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <RequireRole roles={['admin']}>
                  <AdminLayout />
                </RequireRole>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="stock" element={<AdminStockPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};
