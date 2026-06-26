import React from 'react';
import { Link } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';

const ResetPasswordPage: React.FC = () => (
  <div className="glass-card-dark">
    <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors">
      <RiArrowLeftLine /> Back to login
    </Link>
    <h2 className="text-3xl font-display font-bold text-slate-100 mb-2">Reset Password</h2>
    <p className="text-slate-500">Enter your new password below.</p>
  </div>
);

export default ResetPasswordPage;
