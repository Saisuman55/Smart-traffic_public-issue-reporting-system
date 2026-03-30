import React, { useState, useEffect } from 'react';
import { IssueReport } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, Activity, BarChart3, PieChart as PieChartIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

const COLORS = ['#6366F1','#8B5CF6','#3B82F6','#10B981','#F59E0B','#F43F5E','#06B6D4','#14B8A6','#F97316','#D946EF'];

export default function Analytics() {
  const { t } = useI18n();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState(30);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/issues');
        if (res.ok) {
          const data: IssueReport[] = await res.json();
          setIssues(data.filter(i => new Date(i.createdAt) >= new Date(Date.now() - daysRange * 86400000)));
        }
      } catch { } finally { setLoading(false); }
    };
    fetch_();
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
    { name: 'Verified',    value: issues.filter(i => i.status === 'Verified').length,    color: '#6366F1' },
    { name: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, color: '#3B82F6' },
    { name: 'Resolved',    value: issues.filter(i => i.status === 'Resolved').length,    color: '#10B981' },
    { name: 'Rejected',    value: issues.filter(i => i.status === 'Rejected').length,    color: '#F43F5E' },
  ];

  const statCards = [
    { label: 'Total Reports', value: stats.total,    icon: TrendingUp,   color: '#6366F1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.15)' },
    { label: 'Verified',      value: stats.verified, icon: ShieldCheck,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
    { label: 'Resolved',      value: stats.resolved, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
    { label: 'Flagged Fake',  value: stats.fake,     icon: AlertTriangle,color: '#F43F5E', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.15)' },
  ];

  const card = { background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(99,102,241,0.07)' };
  const tooltipStyle = { borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 8px 32px rgba(99,102,241,0.12)', padding: '10px 14px', fontSize: 12, background: 'white', color: '#f4f4f5' };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(99,102,241,0.15)', borderTopColor: '#6366F1' }} />
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden" style={card}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black" style={{ color: '#f4f4f5' }}>Analytics</h1>
              <p className="text-xs font-medium" style={{ color: 'rgba(161,161,170,0.9)' }}>System intelligence overview</p>
            </div>
          </div>
          <div className="flex p-1 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
            {[30, 90, 365].map(range => (
              <button key={range} onClick={() => setDaysRange(range)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={daysRange === range
                  ? { background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }
                  : { color: 'rgba(161,161,170,0.9)' }}>
                {range}D
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4, scale: 1.01 }} className="rounded-2xl p-4 cursor-default" style={card}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: stat.bg, color: stat.color }}>{daysRange}d</span>
            </div>
            <p className="text-2xl font-display font-black tracking-tight" style={{ color: '#f4f4f5' }}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'rgba(161,161,170,0.9)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5" style={card}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#6366F1' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(161,161,170,0.9)' }}>By Category</p>
              <p className="text-sm font-bold" style={{ color: '#f4f4f5' }}>Distribution</p>
            </div>
          </div>
          {categoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center" style={{ color: 'rgba(161,161,170,0.7)' }}>
              <p className="text-sm font-medium">No data for this period</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(161,161,170,0.9)', fontWeight: 700 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(161,161,170,0.9)', fontWeight: 700 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.04)', radius: 8 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                    {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5" style={card}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <PieChartIcon className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(161,161,170,0.9)' }}>By Status</p>
              <p className="text-sm font-bold" style={{ color: '#f4f4f5' }}>Breakdown</p>
            </div>
          </div>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-black" style={{ color: '#f4f4f5' }}>{stats.total}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(161,161,170,0.9)' }}>Total</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.06)' }}>
            {statusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <div>
                  <p className="text-[9px] font-bold truncate" style={{ color: 'rgba(161,161,170,1.0)' }}>{entry.name}</p>
                  <p className="text-sm font-black" style={{ color: '#f4f4f5' }}>{entry.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
