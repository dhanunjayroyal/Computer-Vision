import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  RiEyeLine, RiEyeOffLine, RiLockPasswordLine, RiMailLine, RiLoader4Line,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store';
import type { LoginRequest } from '../../types';

const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      const { user, access_token, refresh_token, token_type, expires_in } = res.data.data!;
      login(user, { access_token, refresh_token, token_type, expires_in });
      toast.success(`Welcome back, ${user.full_name}! 👋`);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'user') => {
    const creds = {
      admin: { email: 'admin@smartvision.ai', password: 'Admin@123' },
      user:  { email: 'user@smartvision.ai',  password: 'User@123' },
    };
    setValue('email', creds[role].email);
    setValue('password', creds[role].password);
  };

  return (
    <div className="auth-card">
      {/* Mobile brand */}
      <div className="flex items-center gap-3 mb-7 lg:hidden">
        <div className="brand-mark text-xl">🔍</div>
        <div>
          <p className="font-display font-bold text-lg text-slate-100">SmartVision AI</p>
          <p className="text-xs text-slate-500">Secure access portal</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="auth-pill mb-3">Professional workspace access</div>
        <h2 className="text-3xl font-display font-bold text-slate-100 mb-2">Welcome back</h2>
        <p className="text-sm text-slate-500">Sign in to manage your computer vision workflows.</p>
      </div>

      {/* Demo credentials */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Demo Credentials</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillDemo('admin')}
            className="flex-1 text-xs py-2 px-3 rounded-lg font-medium text-primary-300 transition-colors hover:bg-primary-500/10"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemo('user')}
            className="flex-1 text-xs py-2 px-3 rounded-lg font-medium text-slate-300 transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            👤 User
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <RiMailLine
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
              size={15}
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`input-field pl-10 ${errors.email ? 'border-red-500/40' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
              })}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <RiLockPasswordLine
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
              size={15}
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-500/40' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters required' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.99 }}
          className="btn-primary w-full justify-center py-3 mt-2"
          id="login-submit-btn"
        >
          {isLoading ? (
            <><RiLoader4Line className="animate-spin" size={17} /> Signing in...</>
          ) : 'Sign In'}
        </motion.button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-slate-600 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Create account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
