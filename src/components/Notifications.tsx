import React, { useState, useEffect } from 'react';
import { auth } from '../currentUser';
import { Notification } from '../types';
import { Bell, Check, Trash2, Clock, MessageSquare, AlertCircle, CheckCircle2, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

const TYPE_CONFIG = {
  status_change: { icon: CheckCircle2, color: '#00FF88', bg: 'rgba(0,255,136,0.1)',  border: 'rgba(0,255,136,0.2)' },
  comment:       { icon: MessageSquare,color: '#00D4FF', bg: 'rgba(0,212,255,0.1)',  border: 'rgba(0,212,255,0.2)' },
  broadcast:     { icon: Globe,        color: '#BF5FFF', bg: 'rgba(191,95,255,0.1)', border: 'rgba(191,95,255,0.2)' },
  system:        { icon: AlertCircle,  color: '#FFB800', bg: 'rgba(255,184,0,0.1)',  border: 'rgba(255,184,0,0.2)' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchNotifications = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const res = await fetch(`/api/notifications/${encodeURIComponent(uid)}`);
        if (res.ok) setNotifications(await res.json());
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.read).map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.1)', boxShadow: '0 0 20px rgba(0,255,136,0.15)' }}>
              <Bell className="w-5 h-5" style={{ color: '#00FF88' }} />
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-white">Notifications</h1>
              <p className="text-xs" style={{ color: unreadCount > 0 ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={() => setNotifications([])}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'rgba(255,60,172,0.1)', color: '#FF3CAC', border: '1px solid rgba(255,60,172,0.2)' }}>
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <motion.div key={n.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="group rounded-2xl p-4 transition-all"
                  style={{ background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : cfg.border}` }}>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold leading-tight" style={{ color: n.read ? 'rgba(255,255,255,0.5)' : 'white' }}>{n.title}</p>
                        <span className="text-[10px] shrink-0 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          <Clock className="w-2.5 h-2.5" />
                          {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{n.message}</p>
                      {n.issueId && (
                        <Link to={`/issue/${n.issueId}`} onClick={() => markAsRead(n.id)}
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold transition-colors"
                          style={{ color: cfg.color }}>
                          View Issue <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <button onClick={() => markAsRead(n.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,60,172,0.1)', color: '#FF3CAC' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-2xl p-16 text-center" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Bell className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <p className="text-base font-bold text-white mb-1">All caught up!</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No new notifications</p>
        </div>
      )}
    </div>
  );
}
