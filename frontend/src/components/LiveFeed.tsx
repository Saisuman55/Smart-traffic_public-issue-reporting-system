import React, { useState, useEffect } from 'react';
import { IssueReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, MessageSquare, AlertTriangle, CheckCircle2, Clock, Shield, Zap, MapPin, ArrowUpRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

interface FeedEvent {
  id: string; type: 'new_issue' | 'status_change' | 'comment';
  title: string; description: string; timestamp: string;
  issueId: string; category: string; status?: string; address: string;
}

const EVENT_CONFIG = {
  new_issue:     { bg: 'bg-amber-50',   text: 'text-amber-600',  border: 'border-amber-100',  label: 'New Report' },
  comment:       { bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-100', label: 'Comment' },
  status_change: { bg: 'bg-emerald-50', text: 'text-emerald-600',border: 'border-emerald-100',label: 'Update' },
};

export default function LiveFeed() {
  const { t } = useI18n();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/issues');
        if (!res.ok) return;
        const issues: IssueReport[] = await res.json();
        const allEvents: FeedEvent[] = [];
        issues.forEach(issue => {
          allEvents.push({ id: `${issue.id}-created`, type: 'new_issue', title: 'New Issue Reported', description: `${issue.category} issue at ${issue.address.split(',')[0]}`, timestamp: issue.createdAt, issueId: issue.id, category: issue.category, address: issue.address });
          if (issue.createdAt !== issue.updatedAt) {
            allEvents.push({ id: `${issue.id}-updated`, type: 'status_change', title: 'Status Updated', description: `Issue marked as ${issue.status}`, timestamp: issue.updatedAt, issueId: issue.id, category: issue.category, status: issue.status, address: issue.address });
          }
          issue.comments?.forEach(comment => {
            allEvents.push({ id: `${issue.id}-comment-${comment.id}`, type: 'comment', title: 'New Comment', description: `${comment.authorName}: ${comment.text.slice(0, 60)}${comment.text.length > 60 ? '...' : ''}`, timestamp: comment.createdAt, issueId: issue.id, category: issue.category, address: issue.address });
          });
        });
        setEvents(allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50));
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: FeedEvent['type'], status?: string) => {
    if (type === 'new_issue') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (type === 'comment') return <MessageSquare className="w-4 h-4 text-purple-500" />;
    if (status === 'Resolved') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'Verified') return <Shield className="w-4 h-4 text-purple-500" />;
    if (status === 'In Progress') return <Zap className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D0D0D] to-[#1a1a2e] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black">Live Feed</h1>
              <p className="text-white/40 text-xs">Real-time civic activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-white/60 text-xs font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Synchronizing...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {events.map((event, i) => {
              const cfg = EVENT_CONFIG[event.type];
              return (
                <motion.div key={event.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="bg-white rounded-2xl border border-neutral-100 p-4 hover:shadow-md hover:border-neutral-200 transition-all group">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      {getIcon(event.type, event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          <span className="text-[10px] text-neutral-300">{event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : ''}</span>
                        </div>
                        <Link to={`/issue/${event.issueId}`} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 transition-all">
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 mb-1">{event.title}</p>
                      <p className="text-xs text-neutral-500 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-neutral-300">
                          <MapPin className="w-3 h-3" /> {event.address.split(',')[0]}
                        </span>
                        <span className="text-[10px] text-neutral-300">· {event.category}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {events.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200">
              <Activity className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-400">No activity yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
