import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RiSettings4Line,
  RiShieldFlashLine,
  RiDatabase2Line,
  RiNotificationBadgeLine,
  RiLoader4Line,
  RiSaveLine,
  RiAlertLine
} from 'react-icons/ri';
import { adminService } from '../../services/api';
import type { SystemSettings } from '../../types';
import { toast } from 'react-toastify';

const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'limits' | 'security' | 'features'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSystemSettings();
      if (res.data.success) {
        setSettings(res.data.data ?? null);
      } else {
        toast.error('Failed to load system settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to backend settings API');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await adminService.updateSystemSettings(settings);
      if (res.data.success) {
        toast.success('System settings updated successfully!');
      } else {
        toast.error(res.data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings to the server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RiLoader4Line className="animate-spin text-primary-500" size={48} />
        <p className="text-slate-400 font-medium">Loading system configurations...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
        <RiAlertLine className="text-danger-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-300 font-display">Failed to load configurations</h3>
        <p className="text-slate-500 max-w-sm mt-2">There was an issue fetching the settings from the FastAPI database.</p>
        <button onClick={fetchSettings} className="btn-primary mt-6">Retry Connection</button>
      </div>
    );
  }

  const tabItems = [
    { id: 'general', label: 'General', icon: <RiSettings4Line /> },
    { id: 'limits', label: 'System Limits', icon: <RiDatabase2Line /> },
    { id: 'security', label: 'Security & Rate Limiting', icon: <RiShieldFlashLine /> },
    { id: 'features', label: 'Features & Status', icon: <RiNotificationBadgeLine /> }
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure application limits, security constraints, and metadata settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Tabs Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-slate-800/60">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:whitespace-normal ${
                activeTab === tab.id
                  ? 'bg-primary-950/40 text-primary-400 border border-primary-800/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 border border-transparent'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Form */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="glass-card space-y-6">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/60 pb-3 font-display">General Configurations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Application Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={settings.app_name}
                      onChange={(e) => handleUpdateField('app_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Contact Support Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={settings.contact_email}
                      onChange={(e) => handleUpdateField('contact_email', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Application Description</label>
                    <textarea
                      rows={4}
                      className="input-field py-3 resize-none"
                      value={settings.app_description}
                      onChange={(e) => handleUpdateField('app_description', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'limits' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/60 pb-3 font-display">System Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Max Upload Size (MB)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={settings.max_upload_size_mb}
                      onChange={(e) => handleUpdateField('max_upload_size_mb', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Max Images Per User</label>
                    <input
                      type="number"
                      className="input-field"
                      value={settings.max_images_per_user}
                      onChange={(e) => handleUpdateField('max_images_per_user', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/60 pb-3 font-display">Security & Rate Limiting</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-850">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Enable API Rate Limiting</p>
                      <p className="text-xs text-slate-500 mt-1">Restrict number of API calls per IP to prevent DDoS attacks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enable_rate_limiting}
                        onChange={(e) => handleUpdateField('enable_rate_limiting', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  {settings.enable_rate_limiting && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400">Rate Limit Requests</label>
                        <input
                          type="number"
                          className="input-field"
                          value={settings.rate_limit_requests}
                          onChange={(e) => handleUpdateField('rate_limit_requests', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400">Rate Limit Window (Minutes)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={settings.rate_limit_window_minutes}
                          onChange={(e) => handleUpdateField('rate_limit_window_minutes', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'features' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/60 pb-3 font-display">Features & System Status</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-850">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Global Notifications</p>
                      <p className="text-xs text-slate-500 mt-1">Enable user real-time feedback notifications in the web client.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enable_notifications}
                        onChange={(e) => handleUpdateField('enable_notifications', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-danger-950/10 border border-danger-900/20">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Maintenance Mode</p>
                      <p className="text-xs text-slate-500 mt-1">Locks the user application for general public and displays a offline banner.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.maintenance_mode}
                        onChange={(e) => handleUpdateField('maintenance_mode', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger-500"></div>
                    </label>
                  </div>

                  {settings.maintenance_mode && (
                    <div className="flex gap-3 p-4 rounded-xl bg-warning-950/20 border border-warning-900/30 text-warning-400 text-sm">
                      <RiAlertLine className="flex-shrink-0 mt-0.5" size={18} />
                      <p>
                        <strong>Warning:</strong> Enforcing maintenance mode will prevent regular users from accessing pages, uploading images, or performing detection pipeline queries. Only admins can disable this feature.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={fetchSettings}
                className="btn-secondary py-2.5 px-4 text-sm"
                disabled={saving}
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="btn-primary py-2.5 px-4 text-sm"
                disabled={saving}
              >
                {saving ? <RiLoader4Line className="animate-spin" size={16} /> : <RiSaveLine size={16} />}
                Save Configurations
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
