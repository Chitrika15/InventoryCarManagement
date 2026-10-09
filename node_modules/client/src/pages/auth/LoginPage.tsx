import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { useToast } from '../../components/ui/Toast.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      success(`Welcome back, ${user.name}!`);

      if (user.role === 'admin') {
        if (from && from.startsWith('/admin')) {
          navigate(from, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        if (from && !from.startsWith('/admin')) {
          navigate(from, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setValue('email', 'admin@stockdrive.com');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'customer@stockdrive.com');
      setValue('password', 'Customer@123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full border-slate-200 dark:border-navy-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-accent-500/25 mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black">Sign in to StockDrive</CardTitle>
          <CardDescription>
            Access your car accessories account or admin management panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Quick Demo Logins */}
          <div className="bg-slate-50 dark:bg-navy-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-navy-800 mb-6">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              ⚡ Quick Demo Credentials:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 hover:border-accent-500 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Admin (admin@stockdrive.com)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('customer')}
                className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 hover:border-accent-500 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Customer (customer@stockdrive.com)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@domain.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-accent-500 hover:text-accent-600 inline-flex items-center gap-1"
            >
              Create account <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
