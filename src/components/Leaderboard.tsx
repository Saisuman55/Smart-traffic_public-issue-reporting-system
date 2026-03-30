import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Trophy, Crown, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setTopUsers(d.slice(0, 10))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }} />
    </div>
  );

  const podium = [topUsers[1], topUsers[0], topUsers[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];
  const podiumColors = ['#00D4FF', '#00FF88', '#BF5FFF'];
  const podiumHeights = ['h-24', 'h-32', 'h-20'];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,184,0,0.08) 0%, rgba(191,95,255,0.05) 100%)', border: '1px solid rgba(255,184,0,0.15)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,184,0,0.06)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.15)', boxShadow: '0 0 20px rgba(255,184,0,0.2)' }}>
            <Trophy className="w-5 h-5" style={{ color: '#FFB800' }} />
          </div>
          <div>
            <h1 className="text-xl font-display font-black text-white">Leaderboard</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Top civic contributors</p>
          </div>
        </div>
      </div>

      {/* Podium */}
      {topUsers.length >= 3 && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-end justify-center gap-4">
            {podium.map((user, i) => {
              const rank = podiumRanks[i];
              const color = podiumColors[i];
              const isFirst = rank === 1;
              return (
                <motion.div key={user.uid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative">
                    {isFirst && <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5" style={{ color: '#FFB800' }} />}
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                      className={`rounded-2xl object-cover ${isFirst ? 'w-16 h-16' : 'w-12 h-12'}`}
                      alt={user.displayName}
                      style={{ border: `2px solid ${color}`, boxShadow: `0 0 15px ${color}40` }} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white truncate max-w-[80px]">{user.displayName}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3" style={{ color }} />
                      <span className="text-xs font-black" style={{ color }}>{user.trustScore}</span>
                    </div>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} rounded-t-xl flex items-start justify-center pt-2`}
                    style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    <span className="font-black text-sm" style={{ color }}>#{rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of list */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Rankings</span>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Trust Score</span>
        </div>
        <div>
          {topUsers.slice(3).map((user, i) => (
            <motion.div key={user.uid} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              className="flex items-center justify-between px-5 py-3.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black w-6" style={{ color: 'rgba(255,255,255,0.2)' }}>#{i + 4}</span>
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  className="w-9 h-9 rounded-xl object-cover" alt={user.displayName}
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                <div>
                  <p className="text-sm font-bold text-white">{user.displayName}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Level {Math.floor(user.trustScore / 100) + 1} Citizen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (user.trustScore / 1000) * 100)}%`, background: 'linear-gradient(90deg, #00FF88, #00D4FF)' }} />
                </div>
                <span className="text-sm font-black text-white w-10 text-right">{user.trustScore}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
