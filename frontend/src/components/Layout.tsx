import React from 'react';
import { LogOut, Shield, LayoutDashboard, FilePlus, BarChart3, Menu, X, Bell, UserCircle, Trophy, Activity, BookOpen, Globe, ChevronRight } from 'lucide-react';
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
      } catch (error) {
        if (error instanceof Error && error.message !== 'Failed to fetch') {
          console.error('Error fetching unread count:', error);
        }
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: t('nav.admin'), icon: Shield, path: '/admin' }] : []),
    { id: 'report', label: t('nav.report'), icon: FilePlus, path: '/report' },
    { id: 'live', label: t('nav.live'), icon: Activity, path: '/live' },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, path: '/analytics' },
    { id: 'leaderboard', label: t('nav.leaderboard'), icon: Trophy, path: '/leaderboard' },
    { id: 'notifications', label: t('nav.notifications') || 'Notifications', icon: Bell, path: '/notifications', badge: unreadNotifications },
    { id: 'guide', label: t('nav.guide') || 'User Guide', icon: BookOpen, path: '/guide' },
    { id: 'profile', label: t('nav.profile'), icon: UserCircle, path: '/profile' },
  ];

  const activeTab = navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-[#F8F7FF] font-sans relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-72 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0D0D0D] z-50 hidden lg:flex flex-col overflow-hidden">
        {/* Sidebar glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-base tracking-tight leading-none">Civic Pillar</p>
              <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-medium mt-0.5">Governance Platform</p>
            </div>
          </Link>
        </div>

        {/* Language selector */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <Globe className="w-3.5 h-3.5 text-white/40" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-[11px] font-semibold text-white/60 focus:outline-none cursor-pointer w-full appearance-none"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="or">ଓଡ଼ିଆ</option>
            </select>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto no-scrollbar">
          <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold px-3 pb-2">Navigation</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive ? 'nav-active text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="ml-auto w-3 h-3 text-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/5">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-2">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-purple-500/30"
                alt="Profile"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{user.displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (user.trustScore / 1000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-white/30 text-[9px] font-bold">{user.trustScore}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-xl border-b border-neutral-200/60 px-4 py-3 flex items-center justify-between z-[60] shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base text-neutral-900">Civic Pillar</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border border-purple-100 rounded-lg">
            <Globe className="w-3 h-3 text-purple-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold text-purple-600 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="or">OR</option>
            </select>
          </div>
          {unreadNotifications > 0 && (
            <Link to="/notifications" className="relative p-2 bg-neutral-100 rounded-xl">
              <Bell className="w-4 h-4 text-neutral-600" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">{unreadNotifications}</span>
            </Link>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-neutral-100 rounded-xl"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="lg:hidden fixed inset-0 bg-[#0D0D0D] z-[55] pt-16 flex flex-col"
          >
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                      isActive ? 'nav-active text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-semibold text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/5">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-3">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl object-cover" alt="Profile" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{user.displayName}</p>
                    <p className="text-white/30 text-[10px]">Trust Score: {user.trustScore}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-sm"
              >
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
