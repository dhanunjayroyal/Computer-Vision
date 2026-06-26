import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { RiUserLine, RiMailLine, RiSaveLine, RiLoader4Line, RiCameraLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store';
import { userService } from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [tab, setTab] = useState<'profile' | 'password' | 'activity'>('profile');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { full_name: user?.full_name || '', username: user?.username || '', email: user?.email || '' }
  });

  const { register: regPwd, handleSubmit: handlePwd, watch, formState: { errors: pwdErrors } } = useForm<{ current_password: string; new_password: string; confirm: string }>();
  const newPwd = watch('new_password');

  const onSaveProfile = async (data: any) => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(data);
      updateUser(res.data.data!);
      toast.success('Profile updated successfully!');
    } catch { toast.error('Failed to update profile'); } finally { setSaving(false); }
  };

  const onChangePassword = async (data: any) => {
    setChangingPassword(true);
    try {
      await userService.changePassword(data.current_password, data.new_password);
      toast.success('Password changed successfully!');
    } catch { toast.error('Failed to change password. Check your current password.'); } finally { setChangingPassword(false); }
  };

  const roleColor = { admin: '#ef4444', researcher: '#eab308', user: '#22c55e' }[user?.role || 'user'];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Profile Header */}
      <div className="glass-card">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}>
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center glass"
              title="Change avatar">
              <RiCameraLine size={14} className="text-slate-300" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.full_name}</h2>
            <p className="text-slate-400">@{user?.username}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="badge" style={{ background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40` }}>
                {user?.role?.toUpperCase()}
              </span>
              {user?.is_verified && <span className="badge-success">✓ Verified</span>}
            </div>
          </div>
          <div className="ml-auto grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-primary-400">{user?.total_uploads || 0}</p><p className="text-xs text-slate-500">Uploads</p></div>
            <div><p className="text-2xl font-bold text-accent-400">{user?.total_recognitions || 0}</p><p className="text-xs text-slate-500">Recognized</p></div>
            <div><p className="text-2xl font-bold text-success-400">Active</p><p className="text-xs text-slate-500">Status</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {(['profile', 'password', 'activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card max-w-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Personal Information</h3>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className={`input-field pl-9 ${errors.full_name ? 'border-danger-500/50' : ''}`}
                  {...register('full_name', { required: 'Name required' })} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Username</label>
              <input className="input-field" {...register('username', { required: 'Username required' })} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input-field pl-9" disabled {...register('email')} />
              </div>
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? <><RiLoader4Line className="animate-spin" /> Saving...</> : <><RiSaveLine /> Save Changes</>}
            </button>
          </form>
        </motion.div>
      )}

      {tab === 'password' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card max-w-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Change Password</h3>
          <form onSubmit={handlePwd(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Current Password</label>
              <input type="password" className="input-field" {...regPwd('current_password', { required: true })} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">New Password</label>
              <input type="password" className="input-field" {...regPwd('new_password', { required: true, minLength: { value: 8, message: 'Min 8 chars' } })} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Confirm New Password</label>
              <input type="password" className="input-field" {...regPwd('confirm', { validate: v => v === newPwd || 'Passwords must match' })} />
              {pwdErrors.confirm && <p className="text-xs text-danger-400 mt-1">{pwdErrors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={changingPassword} className="btn-primary disabled:opacity-50">
              {changingPassword ? <><RiLoader4Line className="animate-spin" /> Changing...</> : 'Change Password'}
            </button>
          </form>
        </motion.div>
      )}

      {tab === 'activity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
          <h3 className="font-semibold text-slate-200 mb-4">Account Activity</h3>
          <p className="text-slate-500 text-sm">Activity timeline is loaded from the server. Connect your backend to view history.</p>
          <div className="space-y-3 mt-4">
            {['Logged in from Chrome (Windows)', 'Uploaded 3 images', 'Ran object recognition pipeline', 'Generated PDF report'].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
                <span className="text-sm text-slate-400">{activity}</span>
                <span className="ml-auto text-xs text-slate-600">{i + 1}h ago</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
