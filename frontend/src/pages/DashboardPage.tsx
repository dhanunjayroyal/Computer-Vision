import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  RiImageLine, RiEyeLine, RiTimeLine, RiTrophyLine,
  RiArrowUpLine, RiArrowDownLine, RiRefreshLine, RiUploadCloud2Line,
  RiFlowChart, RiMagicLine, RiParentLine, RiKeyLine,
} from 'react-icons/ri';
import { analyticsService } from '../services/api';
import { useAuthStore, useDashboardStore } from '../store';
import type { DashboardStats, RecognitionTrend, ObjectDistribution, RecentActivity } from '../types';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  color: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="stat-card relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{label}</p>
        <p className="text-3xl font-display font-bold text-slate-100">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
            {change >= 0 ? <RiArrowUpLine /> : <RiArrowDownLine />}
            <span>{Math.abs(change)}% vs last week</span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
    {/* Glow */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20"
      style={{ background: color }} />
  </motion.div>
);

// ─── Module Card ───────────────────────────────────────────────────────────────
interface ModuleCardProps { icon: string; title: string; desc: string; path: string; color: string; delay?: number; }
const ModuleCard: React.FC<ModuleCardProps> = ({ icon, title, desc, path, color, delay = 0 }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      onClick={() => navigate(path)}
      className="module-card cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium" style={{ color }}>
        <span>Get started</span>
        <span>→</span>
      </div>
    </motion.div>
  );
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs"
        style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { stats, setStats } = useDashboardStore();
  const [trends, setTrends] = useState<RecognitionTrend[]>([]);
  const [distribution, setDistribution] = useState<ObjectDistribution[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pieColors = ['#6366f1', '#d946ef', '#06b6d4', '#22c55e', '#eab308', '#f87171', '#a78bfa', '#34d399'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, trendsRes, distRes, actRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        analyticsService.getTrends(30),
        analyticsService.getObjectDistribution(),
        analyticsService.getRecentActivity(8),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data!);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data.data || []);
      if (distRes.status === 'fulfilled') setDistribution(distRes.value.data.data || []);
      if (actRes.status === 'fulfilled') setActivities(actRes.value.data.data || []);
    } catch { /* use fallback data */ } finally {
      setIsLoading(false);
    }
  };

  // Fallback demo data
  const demoStats: DashboardStats = stats || {
    total_images: 1248,
    total_recognitions: 986,
    avg_accuracy: 94.7,
    avg_processing_time_ms: 342,
    images_today: 23,
    recognitions_today: 18,
    success_rate: 97.2,
    active_users: 12,
  };

  const demoTrends: RecognitionTrend[] = trends.length > 0 ? trends : Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: Math.floor(Math.random() * 80) + 20,
    avg_confidence: 88 + Math.random() * 10,
  }));

  const demoDist: ObjectDistribution[] = distribution.length > 0 ? distribution : [
    { category: 'Vehicles', count: 342, percentage: 34.6 },
    { category: 'Animals', count: 218, percentage: 22.1 },
    { category: 'Buildings', count: 156, percentage: 15.8 },
    { category: 'People', count: 134, percentage: 13.6 },
    { category: 'Objects', count: 89, percentage: 9.0 },
    { category: 'Plants', count: 47, percentage: 4.9 },
  ];

  const demoActivities: RecentActivity[] = activities.length > 0 ? activities : [
    { id: '1', type: 'recognition', description: 'Vehicle recognized with 96.2% confidence', user: 'John D.', timestamp: new Date(Date.now() - 300000).toISOString(), status: 'success' },
    { id: '2', type: 'upload', description: '3 images uploaded for processing', user: 'Sarah M.', timestamp: new Date(Date.now() - 900000).toISOString(), status: 'success' },
    { id: '3', type: 'report', description: 'Monthly analytics report generated', user: 'Admin', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'success' },
    { id: '4', type: 'recognition', description: 'Animal classification with 78% confidence', user: 'Mike R.', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'warning' },
    { id: '5', type: 'upload', description: 'Batch upload of 10 images completed', user: 'Lisa K.', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'success' },
  ];

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const activityIcon = (type: string) => ({ upload: '📤', recognition: '🔍', report: '📄', login: '🔐', export: '📊' }[type] || '📌');
  const activityColor = (status: string) => ({ success: 'text-success-400', warning: 'text-warning-400', error: 'text-danger-400' }[status] || 'text-slate-400');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-100">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'User'}!</span>
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your SmartVision platform today.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <button onClick={loadData} className="btn-secondary text-sm py-2 px-4" title="Refresh data">
            <RiRefreshLine /> Refresh
          </button>
          <button onClick={() => window.location.assign('/upload')} className="btn-primary text-sm py-2 px-4">
            <RiUploadCloud2Line /> Upload Image
          </button>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<RiImageLine />}  label="Total Images"       value={demoStats.total_images.toLocaleString()} change={12.5} color="#6366f1" delay={0.05} />
        <StatCard icon={<RiEyeLine />}    label="Recognitions"       value={demoStats.total_recognitions.toLocaleString()} change={8.3} color="#d946ef" delay={0.1} />
        <StatCard icon={<RiTrophyLine />} label="Avg Accuracy"       value={`${demoStats.avg_accuracy}%`} change={2.1} color="#22c55e" delay={0.15} />
        <StatCard icon={<RiTimeLine />}   label="Avg Process Time"   value={`${demoStats.avg_processing_time_ms}ms`} change={-5.2} color="#06b6d4" delay={0.2} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recognition Trends */}
        <motion.div className="lg:col-span-2 chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Recognition Trends</h3>
            <span className="badge-primary text-xs">Last 14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demoTrends}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="count" name="Recognitions" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" />
              <Area type="monotone" dataKey="avg_confidence" name="Avg Confidence %" stroke="#d946ef" strokeWidth={2} fill="url(#colorConf)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Object Distribution */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold text-slate-200 mb-4">Object Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={demoDist} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                {demoDist.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {demoDist.slice(0, 4).map((item, i) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="text-xs text-slate-400">{item.category}</span>
                </div>
                <span className="text-xs text-slate-500">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV Modules */}
        <motion.div className="lg:col-span-2 glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="font-semibold text-slate-200 mb-4">CV Processing Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModuleCard icon="🔼" title="Upload Image"     desc="Drag & drop or browse images"  path="/upload"      color="#6366f1" delay={0.4} />
            <ModuleCard icon="🎨" title="Enhancement"     desc="Enhance and preprocess images"  path="/enhancement" color="#d946ef" delay={0.45} />
            <ModuleCard icon="📐" title="Harris Corner"   desc="Detect corner features"         path="/harris"      color="#06b6d4" delay={0.5} />
            <ModuleCard icon="🔑" title="SIFT Features"   desc="Extract SIFT keypoints"         path="/sift"        color="#22c55e" delay={0.55} />
            <ModuleCard icon="📊" title="PCA Optimize"    desc="Reduce feature dimensions"      path="/pca"         color="#eab308" delay={0.6} />
            <ModuleCard icon="🔍" title="Recognition"     desc="Classify and identify objects"  path="/recognition" color="#f97316" delay={0.65} />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Recent Activity</h3>
            <span className="badge-primary text-xs">{demoActivities.length} events</span>
          </div>
          <div className="space-y-3">
            {demoActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-lg flex-shrink-0">{activityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600">{activity.user}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-600">{timeAgo(activity.timestamp)}</span>
                  </div>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${activityColor(activity.status)}`}
                  style={{ background: activity.status === 'success' ? '#22c55e' : activity.status === 'warning' ? '#eab308' : '#ef4444' }} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Processing Pipeline CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(217,70,239,0.05) 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }} />
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <RiFlowChart />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-100">Full Processing Pipeline</h3>
              <p className="text-slate-400 text-sm mt-0.5">Upload → Enhance → Harris → SIFT → PCA → Recognize in one click</p>
            </div>
          </div>
          <button
            onClick={() => window.location.assign('/pipeline')}
            className="btn-primary"
          >
            <RiFlowChart /> Launch Pipeline
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
