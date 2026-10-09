import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Mail, Lock, User as UserIcon, UserPlus, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { useToast } from '../../components/ui/Toast.js';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      success(`Welcome to StockDrive IMS, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full border-slate-200 dark:border-navy-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-accent-500/25 mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black">Create an Account</CardTitle>
          <CardDescription>
            Join StockDrive IMS for premium car accessories and instant delivery
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Alex Vance"
                icon={<UserIcon className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="alex@domain.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password (min 8 chars, A-Z, 0-9)
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              <UserPlus className="w-4 h-4 mr-2" />
              Register Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-accent-500 hover:text-accent-600 inline-flex items-center gap-1"
            >
              Sign in <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
