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
  new_issue:     { color: '#FFB800', bg: 'rgba(255,184,0,0.1)',   border: 'rgba(255,184,0,0.2)',   label: 'New Report' },
  comment:       { color: '#BF5FFF', bg: 'rgba(191,95,255,0.1)',  border: 'rgba(191,95,255,0.2)',  label: 'Comment' },
  status_change: { color: '#00FF88', bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.2)',   label: 'Update' },
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
    if (type === 'new_issue') return <AlertTriangle className="w-4 h-4" style={{ color: '#FFB800' }} />;
    if (type === 'comment') return <MessageSquare className="w-4 h-4" style={{ color: '#BF5FFF' }} />;
    if (status === 'Resolved') return <CheckCircle2 className="w-4 h-4" style={{ color: '#00FF88' }} />;
    if (status === 'Verified') return <Shield className="w-4 h-4" style={{ color: '#00D4FF' }} />;
    if (status === 'In Progress') return <Zap className="w-4 h-4" style={{ color: '#00D4FF' }} />;
    return <Clock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />;
  };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,60,172,0.08) 0%, rgba(191,95,255,0.05) 100%)', border: '1px solid rgba(255,60,172,0.15)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,60,172,0.06)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,60,172,0.15)', boxShadow: '0 0 20px rgba(255,60,172,0.2)' }}>
              <Radio className="w-5 h-5" style={{ color: '#FF3CAC' }} />
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-white">Live Feed</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Real-time civic activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF3CAC', boxShadow: '0 0 8px rgba(255,60,172,0.6)' }} />
            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Synchronizing...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {events.map((event, i) => {
              const cfg = EVENT_CONFIG[event.type];
              return (
                <motion.div key={event.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="rounded-2xl p-4 transition-all group cursor-default"
                  style={cardStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.border; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      {getIcon(event.type, event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : ''}
                          </span>
                        </div>
                        <Link to={`/issue/${event.issueId}`}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold transition-all"
                          style={{ color: cfg.color }}>
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">{event.title}</p>
                      <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          <MapPin className="w-3 h-3" /> {event.address.split(',')[0]}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>· {event.category}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {events.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>No activity yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
