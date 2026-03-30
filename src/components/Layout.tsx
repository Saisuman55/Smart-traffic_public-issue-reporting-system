import React from 'react';
import { LogOut, Shield, LayoutDashboard, FilePlus, BarChart3, Menu, X, Bell, UserCircle, Trophy, Activity, BookOpen, Globe, Sparkles } from 'lucide-react';
import { auth, signOut } from '../currentUser';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
}

export default function Layout({ children, user }: LayoutProps) {
  const { t, language, setLanguage } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const location = useLocation();

  React.useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      if (!user?.uid) return;
      try {
        const res = await fetch(`/api/notifications/${encodeURIComponent(user.uid)}`);
        if (res.ok) {
          const notifications = await res.json();
          setUnreadNotifications(notifications.filter((n: any) => !n.read).length);
        }
      } catch { /* silent */ }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { id: 'dashboard',     label: t('nav.dashboard'),                  icon: LayoutDashboard, path: '/',              color: '#06b6d4' }, // changed to cyan
    ...(user?.role === 'admin' ? [{ id: 'admin', label: t('nav.admin'), icon: Shield, path: '/admin', color: '#f43f5e' }] : []),
    { id: 'report',        label: t('nav.report'),                     icon: FilePlus,        path: '/report',        color: '#10b981' },
    { id: 'live',          label: t('nav.live'),                       icon: Activity,        path: '/live',          color: '#f43f5e' },
    { id: 'analytics',     label: t('nav.analytics'),                  icon: BarChart3,       path: '/analytics',    color: '#3b82f6' },
    { id: 'leaderboard',   label: t('nav.leaderboard'),                icon: Trophy,          path: '/leaderboard',  color: '#f59e0b' },
    { id: 'notifications', label: t('nav.notifications') || 'Alerts', icon: Bell,            path: '/notifications', color: '#a855f7', badge: unreadNotifications },
    { id: 'guide',         label: t('nav.guide') || 'Guide',           icon: BookOpen,        path: '/guide',        color: '#0ea5e9' },
    { id: 'profile',       label: t('nav.profile'),                    icon: UserCircle,      path: '/profile',      color: '#14b8a6' },
  ];

  const activeTab = navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id || 'dashboard';

  const activeItem = navItems.find(i => i.id === activeTab);

  return (
    <div className="min-h-screen font-sans relative aurora-bg text-zinc-100">

      {/* Aurora background blobs from index.css logic implicitly apply, but keep existing ones tailored for dark mode if needed. Removing explicit inline styles to rely on aurora-bg ::before. */}
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-full w-64 z-50 hidden lg:flex flex-col glass-dark border-r border-white/5 shadow-2xl">

        {/* Logo */}
        <div className="px-6 pt-6 pb-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: 10, scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <p className="font-display font-black text-base tracking-tight text-white">Civic Pillar</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                <p className="text-[10px] font-semibold text-zinc-400">Live Platform</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Language */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <select value={language} onChange={e => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full appearance-none text-cyan-400">
              <option value="en" className="bg-zinc-900">English</option>
              <option value="hi" className="bg-zinc-900">हिंदी</option>
              <option value="or" className="bg-zinc-900">ଓଡ଼ିଆ</option>
            </select>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto no-scrollbar">
          <p className="text-[9px] uppercase tracking-[0.3em] font-bold px-3 pb-2 text-zinc-500">Menu</p>
          {navItems.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={item.path}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'nav-active' : 'text-zinc-400 hover:text-zinc-200 hover:glass-dark/5'}`}
                  style={isActive ? { color: item.color } : {}}>
                  <div className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all glass-dark/5 group-hover:glass-dark/10"
                    style={isActive ? { background: `${item.color}20` } : {}}>
                    <item.icon className="w-4 h-4" style={isActive ? { color: item.color } : {}} />
                  </div>
                  <span className="text-sm font-semibold relative z-10">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="ml-auto text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full relative z-10 bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/5">
          {user && (
            <motion.div whileHover={{ scale: 1.01 }}
              className="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-default bg-zinc-900/50 border border-white/5">
              <div className="relative">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  className="w-9 h-9 rounded-xl object-cover border-2 border-cyan-500/20" alt="Profile" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-zinc-100">{user.displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1 flex-1 rounded-full overflow-hidden bg-zinc-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (user.trustScore / 1000) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                  </div>
                  <span className="text-[9px] font-bold text-cyan-400">{user.trustScore}</span>
                </div>
              </div>
            </motion.div>
          )}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20">
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.logout')}
          </motion.button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 w-full px-4 py-3 flex items-center justify-between z-[60] glass-dark border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-black text-base text-white">Civic Pillar</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
            <Globe className="w-3 h-3 text-cyan-400" />
            <select value={language} onChange={e => setLanguage(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold focus:outline-none cursor-pointer appearance-none text-cyan-400">
              <option value="en" className="bg-zinc-900">EN</option>
              <option value="hi" className="bg-zinc-900">HI</option>
              <option value="or" className="bg-zinc-900">OR</option>
            </select>
          </div>
          {unreadNotifications > 0 && (
            <Link to="/notifications" className="relative p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20">
              <Bell className="w-4 h-4 text-purple-400" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[8px] font-black flex items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                {unreadNotifications}
              </span>
            </Link>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl glass-dark/5 hover:glass-dark/10 text-cyan-400">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-[55] pt-16 flex flex-col glass-dark h-dvh">
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item, i) => {
                const isActive = activeTab === item.id;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                      style={isActive
                        ? { background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`, border: `1px solid ${item.color}30`, color: item.color }
                        : { color: '#a1a1aa', border: '1px solid transparent' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center glass-dark/5">
                        <item.icon className="w-4 h-4" style={isActive ? { color: item.color } : {}} />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/5">
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-zinc-900/50 border border-white/5">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-cyan-500/20" alt="Profile" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-white">{user.displayName}</p>
                    <p className="text-xs font-medium text-cyan-400">Trust: {user.trustScore}</p>
                  </div>
                </div>
              )}
              <button onClick={() => signOut(auth)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20">
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
