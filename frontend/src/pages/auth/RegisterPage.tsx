import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  RiEyeLine, RiEyeOffLine, RiLockPasswordLine, RiMailLine,
  RiUserLine, RiLoader4Line, RiCheckLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';
import type { RegisterRequest } from '../../types';

interface RegisterForm extends RegisterRequest {
  confirm_password: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const passwordChecks = [
    { label: 'At least 8 characters', valid: (password?.length || 0) >= 8 },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password || '') },
    { label: 'Contains number', valid: /\d/.test(password || '') },
    { label: 'Contains special character', valid: /[!@#$%^&*]/.test(password || '') },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Registration failed.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card-dark">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5 lg:hidden">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}>🔍</div>
          <span className="font-display font-bold text-lg gradient-text">SmartVision AI</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-100 mb-2">Create account</h2>
        <p className="text-slate-500">Join SmartVision AI to start recognizing objects</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="full_name">Full Name</label>
          <div className="relative">
            <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className={`input-field pl-10 ${errors.full_name ? 'border-danger-500/50' : ''}`}
              {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
            />
          </div>
          {errors.full_name && <p className="text-xs text-danger-400 mt-1">{errors.full_name.message}</p>}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="username">Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="johndoe"
              className={`input-field pl-8 ${errors.username ? 'border-danger-500/50' : ''}`}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores' },
              })}
            />
          </div>
          {errors.username && <p className="text-xs text-danger-400 mt-1">{errors.username.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="reg-email">Email Address</label>
          <div className="relative">
            <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`input-field pl-10 ${errors.email ? 'border-danger-500/50' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
              })}
            />
          </div>
          {errors.email && <p className="text-xs text-danger-400 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="reg-password">Password</label>
          <div className="relative">
            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500/50' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                pattern: { value: /^(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase and number' },
              })}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
          {/* Password strength */}
          {password && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-1">
                  <RiCheckLine className={`text-xs ${check.valid ? 'text-success-400' : 'text-slate-700'}`} />
                  <span className={`text-xs ${check.valid ? 'text-slate-400' : 'text-slate-700'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-danger-400 mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="confirm_password">Confirm Password</label>
          <div className="relative">
            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input-field pl-10 pr-10 ${errors.confirm_password ? 'border-danger-500/50' : ''}`}
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match',
              })}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showConfirm ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-danger-400 mt-1">{errors.confirm_password.message}</p>}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="btn-primary w-full justify-center py-3.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          id="register-submit-btn"
        >
          {isLoading ? (
            <><RiLoader4Line className="animate-spin" size={18} />Creating account...</>
          ) : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
