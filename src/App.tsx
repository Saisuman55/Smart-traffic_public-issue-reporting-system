import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProfile } from './types';

import Layout from './components/Layout';
import Auth from './components/Auth';
import LoadingSpinner from './components/ui/LoadingSpinner';

import { Toaster } from 'sonner';
import { I18nProvider, useI18n } from './i18n';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ReportForm = lazy(() => import('./components/ReportForm'));
const Analytics = lazy(() => import('./components/Analytics'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const Profile = lazy(() => import('./components/Profile'));
const Notifications = lazy(() => import('./components/Notifications'));
const IssueDetails = lazy(() => import('./components/IssueDetails'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const LiveFeed = lazy(() => import('./components/LiveFeed'));
const UserGuide = lazy(() => import('./components/UserGuide'));

function decodeJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function buildUserProfile(raw: any, decoded: any): UserProfile {
  return {
    uid: raw._id || decoded?.id || '',
    email: raw.email || '',
    displayName: raw.name || raw.displayName || 'User',
    role: raw.role || decoded?.role || 'user',
    trustScore: raw.score ?? raw.trustScore ?? 50,
    photoURL: raw.photoURL || undefined,
    bio: raw.bio || undefined,
    location: raw.location || undefined,
    joinedAt: raw.createdAt || raw.joinedAt || new Date().toISOString(),
  };
}

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner label="Loading page..." />
    </div>
  );
}

// ================== APP CONTENT ==================
function AppContent({
  loading,
  user,
  setUser
}: {
  loading: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white gap-6">
        <LoadingSpinner size="lg" label={t('app.initializing')} />
        <div className="text-center mt-4">
          <p className="text-xl font-bold tracking-tight">{t('app.title')}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">
            {t('app.version')}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Layout user={user}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/report" element={<ReportForm onSuccess={() => navigate('/')} />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/live" element={<LiveFeed />} />
          <Route path="/profile" element={<Profile onUpdate={setUser} />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/guide" element={<UserGuide />} />
          <Route path="/issue/:id" element={<IssueDetails />} />
          <Route
            path="/admin"
            element={user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </Layout>
  );
}

// ================== MAIN APP ==================
export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    const decoded = decodeJwt(token);
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // Always fetch fresh user data from DB on app load
    fetch(`/api/users/${decoded.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          // data is already formatted by formatUser in backend
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          // fallback to localStorage if API fails
          const rawUser = localStorage.getItem('user');
          if (rawUser) setUser(buildUserProfile(JSON.parse(rawUser), decoded));
        }
      })
      .catch(() => {
        const rawUser = localStorage.getItem('user');
        if (rawUser) setUser(buildUserProfile(JSON.parse(rawUser), decoded));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <I18nProvider>
      <AppContent loading={loading} user={user} setUser={setUser} />
    </I18nProvider>
  );
}
