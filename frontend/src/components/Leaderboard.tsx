import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Trophy, Crown, Medal, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setTopUsers(d.slice(0, 10))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const podium = [topUsers[1], topUsers[0], topUsers[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];
  const podiumHeights = ['h-28', 'h-36', 'h-24'];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D0D0D] to-[#1a1a2e] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black">Leaderboard</h1>
            <p className="text-white/40 text-xs">Top civic contributors</p>
          </div>
        </div>
      </div>

      {/* Podium */}
      {topUsers.length >= 3 && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
          <div className="flex items-end justify-center gap-3">
            {podium.map((user, i) => {
              const rank = podiumRanks[i];
              const isFirst = rank === 1;
              return (
                <motion.div key={user.uid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                      className={`rounded-2xl object-cover border-4 shadow-lg ${isFirst ? 'w-16 h-16 border-amber-400 shadow-amber-200' : 'w-12 h-12 border-neutral-200'}`}
                      alt={user.displayName} />
                    {isFirst && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-neutral-900 truncate max-w-[80px]">{user.displayName}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-black text-purple-600">{user.trustScore}</span>
                    </div>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} rounded-t-xl flex items-start justify-center pt-2 ${isFirst ? 'bg-gradient-to-b from-amber-400 to-amber-500' : rank === 2 ? 'bg-gradient-to-b from-neutral-300 to-neutral-400' : 'bg-gradient-to-b from-orange-300 to-orange-400'}`}>
                    <span className="text-white font-black text-sm">#{rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of list */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Rankings</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Trust Score</span>
        </div>
        <div className="divide-y divide-neutral-50">
          {topUsers.slice(3).map((user, i) => (
            <motion.div key={user.uid} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-neutral-300 w-6">#{i + 4}</span>
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  className="w-9 h-9 rounded-xl object-cover shadow-sm" alt={user.displayName} />
                <div>
                  <p className="text-sm font-bold text-neutral-900">{user.displayName}</p>
                  <p className="text-[10px] text-neutral-400">Level {Math.floor(user.trustScore / 100) + 1} Citizen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${Math.min(100, (user.trustScore / 1000) * 100)}%` }} />
                </div>
                <span className="text-sm font-black text-neutral-700 w-10 text-right">{user.trustScore}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
