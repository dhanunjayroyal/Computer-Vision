import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { RiMailLine, RiLoader4Line, RiArrowLeftLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card-dark">
      <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
        <RiArrowLeftLine /> Back to login
      </Link>
      <h2 className="text-3xl font-display font-bold text-slate-100 mb-2">Forgot password?</h2>
      <p className="text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>

      {sent ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📧</div>
          <p className="text-slate-200 font-semibold mb-2">Check your inbox!</p>
          <p className="text-slate-500 text-sm">A password reset link has been sent to your email address.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="email" placeholder="you@example.com"
                className={`input-field pl-10 ${errors.email ? 'border-danger-500/50' : ''}`}
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
              />
            </div>
            {errors.email && <p className="text-xs text-danger-400 mt-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isLoading}
            className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-60">
            {isLoading ? <><RiLoader4Line className="animate-spin" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
