import React, { useState, useEffect } from 'react';
import { IssueReport } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

const COLORS = ['#7C3AED', '#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#0EA5E9', '#F97316', '#D946EF'];

export default function Analytics() {
  const { t } = useI18n();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/issues');
        if (res.ok) {
          const data: IssueReport[] = await res.json();
          const rangeDate = new Date(Date.now() - daysRange * 86400000);
          setIssues(data.filter(i => new Date(i.createdAt) >= rangeDate));
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchAnalytics();
  }, [daysRange]);

  const stats = {
    total: issues.length,
    verified: issues.filter(i => ['Verified','In Progress','Resolved'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    fake: issues.filter(i => i.isFake).length,
  };

  const categoryData = Array.from(new Set(issues.map(i => i.category))).map((cat, idx) => ({
    name: cat, value: issues.filter(i => i.category === cat).length, color: COLORS[idx % COLORS.length]
  }));

  const statusData = [
    { name: 'Pending',     value: issues.filter(i => i.status === 'Pending').length,     color: '#F59E0B' },
    { name: 'Verified',    value: issues.filter(i => i.status === 'Verified').length,    color: '#7C3AED' },
    { name: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, color: '#2563EB' },
    { name: 'Resolved',    value: issues.filter(i => i.status === 'Resolved').length,    color: '#10B981' },
    { name: 'Rejected',    value: issues.filter(i => i.status === 'Rejected').length,    color: '#F43F5E' },
  ];

  const statCards = [
    { label: 'Total Reports', value: stats.total,    icon: TrendingUp,  color: 'from-purple-500 to-blue-600',   bg: 'bg-purple-50',  text: 'text-purple-600' },
    { label: 'Verified',      value: stats.verified, icon: ShieldCheck, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50',  text: 'text-violet-600' },
    { label: 'Resolved',      value: stats.resolved, icon: CheckCircle2,color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Flagged Fake',  value: stats.fake,     icon: AlertTriangle,color: 'from-rose-400 to-red-500',    bg: 'bg-rose-50',    text: 'text-rose-600' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D0D0D] to-[#1a1a2e] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black">Analytics</h1>
              <p className="text-white/40 text-xs">System intelligence overview</p>
            </div>
          </div>
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            {[30, 90, 365].map(range => (
              <button key={range} onClick={() => setDaysRange(range)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${daysRange === range ? 'bg-white text-neutral-900 shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                {range}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${stat.bg} ${stat.text}`}>
                {daysRange}d
              </span>
            </div>
            <p className="text-2xl font-display font-black text-neutral-900 tracking-tight">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">By Category</p>
              <p className="text-sm font-bold text-neutral-900">Distribution</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px', fontSize: 12 }} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">By Status</p>
              <p className="text-sm font-bold text-neutral-900">Breakdown</p>
            </div>
          </div>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '10px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-black text-neutral-900">{stats.total}</span>
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {statusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <div>
                  <p className="text-[9px] font-bold text-neutral-500 truncate">{entry.name}</p>
                  <p className="text-sm font-black text-neutral-900">{entry.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
