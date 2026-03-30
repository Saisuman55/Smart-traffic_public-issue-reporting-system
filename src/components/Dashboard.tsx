import React, { useState, useEffect } from 'react';
import { auth } from '../currentUser';
import { IssueReport, UserProfile } from '../types';
import IssueCard from './IssueCard';
import LoadingSpinner from './ui/LoadingSpinner';
import { Map as MapIcon, List as ListIcon, Search, Loader2, MapPin, AlertCircle, Users, CheckCircle2, Clock, ChevronDown, Activity, ShieldAlert, X, TrendingUp, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'motion/react';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '../i18n';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

interface DashboardProps { user: UserProfile | null; }

export default function Dashboard({ user }: DashboardProps) {
  const { t } = useI18n();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchTimeoutRef = React.useRef<any>(null);
  const [showFake, setShowFake] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');

  const handleLocateMe = (silent = false) => {
    setIsLocating(true);
    if (!('geolocation' in navigator)) { setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
        if (!silent) { setViewMode('map'); toast.success('Location synced!'); }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setLocationAddress(data.address?.city || data.address?.town || data.address?.village || '');
        } catch { /* silent */ }
      },
      () => { setIsLocating(false); if (!silent) toast.error('Could not get location.'); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => { handleLocateMe(true); }, []);
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setActiveUsersCount(d.activeUsers)).catch(() => {});
  }, []);

  const fetchIssues = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.append('category', filter);
      const res = await fetch(`/api/issues?${params}`);
      if (res.ok) setIssues(await res.json());
    } catch { /* silent */ } finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => {
    fetchIssues(true);
    const interval = setInterval(() => fetchIssues(false), 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) { setLocationSuggestions([]); return; }
    setSuggestionsLoading(true);
    try {
      const lat = userLocation?.[0] ?? 20.2961, lon = userLocation?.[1] ?? 85.8245;
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const features = (data.features || [])
        .filter((f: any) => f.properties?.countrycode === 'IN')
        .sort((a: any, b: any) => {
          const [aLon, aLat] = a.geometry.coordinates, [bLon, bLat] = b.geometry.coordinates;
          return Math.hypot(aLat - lat, aLon - lon) - Math.hypot(bLat - lat, bLon - lon);
        })
        .map((f: any) => {
          const p = f.properties;
          const primary = p.name || p.street || p.city || query;
          const parts = [p.district || p.suburb, p.city || p.town || p.village, p.state].filter(Boolean);
          return { primary, secondary: parts.join(', '), fullText: [primary, parts.join(', ')].filter(Boolean).join(', ') };
        });
      setLocationSuggestions(features);
    } catch { setLocationSuggestions([]); } finally { setSuggestionsLoading(false); }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value); setShowSuggestions(true);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchLocationSuggestions(value), 300);
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = filter === 'All' || issue.category === filter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    const matchesSearch = issue.description?.toLowerCase().includes(search.toLowerCase()) || issue.address.toLowerCase().includes(search.toLowerCase());
    const matchesFake = showFake || !issue.isFake || issue.status === 'Resolved' || issue.status === 'Verified';
    return matchesCategory && matchesStatus && matchesSearch && matchesFake;
  }).sort((a, b) => {
    if (userLocation) return getDistance(userLocation[0], userLocation[1], a.latitude, a.longitude) - getDistance(userLocation[0], userLocation[1], b.latitude, b.longitude);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const stats = [
    { label: t('dashboard.total_reports'), value: issues.length,                                      icon: TrendingUp,   color: '#6366F1', glow: 'rgba(99,102,241,0.2)',   bg: 'rgba(99,102,241,0.08)' },
    { label: t('dashboard.verified'),      value: issues.filter(i => i.status === 'Verified').length, icon: CheckCircle2, color: '#10B981', glow: 'rgba(16,185,129,0.2)',  bg: 'rgba(16,185,129,0.08)' },
    { label: t('dashboard.pending'),       value: issues.filter(i => i.status === 'Pending').length,  icon: Clock,        color: '#F59E0B', glow: 'rgba(245,158,11,0.2)',  bg: 'rgba(245,158,11,0.08)' },
    { label: t('dashboard.active_users'),  value: activeUsersCount ?? '...',                          icon: Users,        color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)',  bg: 'rgba(139,92,246,0.08)' },
  ];

  const center: [number, number] = userLocation ?? (filteredIssues.length > 0
    ? [filteredIssues.reduce((s, i) => s + i.latitude, 0) / filteredIssues.length, filteredIssues.reduce((s, i) => s + i.longitude, 0) / filteredIssues.length]
    : [20.2961, 85.8245]);

  function ChangeView({ issues, userLocation }: { issues: IssueReport[], userLocation: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
      const bounds = L.latLngBounds([]);
      if (userLocation) bounds.extend(userLocation);
      issues.forEach(i => bounds.extend([i.latitude, i.longitude]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, [issues, userLocation, map]);
    return null;
  }

  const STATUS_NEON: Record<string, { bg: string; color: string }> = {
    All:          { bg: 'rgba(99,102,241,0.08)',  color: '#6366F1' },
    Pending:      { bg: 'rgba(245,158,11,0.1)',   color: '#D97706' },
    Verified:     { bg: 'rgba(99,102,241,0.1)',   color: '#6366F1' },
    'In Progress':{ bg: 'rgba(59,130,246,0.1)',   color: '#3B82F6' },
    Resolved:     { bg: 'rgba(16,185,129,0.1)',   color: '#10B981' },
    Rejected:     { bg: 'rgba(244,63,94,0.1)',    color: '#F43F5E' },
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="rounded-2xl p-4 cursor-default glass-dark">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: stat.bg, color: stat.color }}>
                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: stat.color }} />
                LIVE
              </span>
            </div>
            <p className="text-2xl font-display font-black tracking-tight text-white">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'rgba(161,161,170,0.9)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Header + Search */}
      <div className="rounded-2xl p-5 glass-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366F1', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366F1' }}>{t('dashboard.live_feed')}</span>
            </div>
            <h1 className="text-2xl font-display font-black text-white">
              Civic <span className="text-gradient">Intelligence</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <button onClick={() => setViewMode('grid')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={viewMode === 'grid' ? { background: 'rgba(0,255,136,0.15)', color: '#00FF88' } : { color: 'rgba(255,255,255,0.4)' }}>
                <ListIcon className="w-3.5 h-3.5" /> {t('dashboard.grid_view')}
              </button>
              <button onClick={() => setViewMode('map')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={viewMode === 'map' ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF' } : { color: 'rgba(255,255,255,0.4)' }}>
                <MapIcon className="w-3.5 h-3.5" /> {t('dashboard.map_view')}
              </button>
            </div>
            <button onClick={() => handleLocateMe(false)} disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={userLocation
                ? { background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {userLocation ? locationAddress || t('dashboard.you_are_here') : t('dashboard.near_me_active')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
          <input type="text" placeholder="Search locations, institutes, descriptions..."
            value={search} onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full rounded-xl py-2.5 pl-10 pr-9 text-sm transition-all input-field"
          />
          {search && (
            <button onClick={() => { setSearch(''); setLocationSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-4 h-4" />
            </button>
          )}

          {showSuggestions && search.length >= 1 && (() => {
            const issueMatches = issues.filter(i => i.address.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase())).slice(0, 2)
              .map(i => ({ kind: 'issue' as const, primary: i.address.split(',')[0], secondary: i.category, fullText: i.address }));
            const locMatches = locationSuggestions.map((s: any) => ({ kind: 'place' as const, primary: s.primary, secondary: s.secondary, fullText: s.fullText }));
            const all = [...issueMatches, ...locMatches];
            return (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                style={{ background: '#f4f4f5', border: '1px solid rgba(255,255,255,0.1)' }}>
                {suggestionsLoading && (
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                  </div>
                )}
                {all.length > 0 ? all.map((s, i) => (
                  <button key={i} onMouseDown={() => { setSearch(s.fullText); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: s.kind === 'issue' ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.1)', color: s.kind === 'issue' ? '#00FF88' : '#00D4FF' }}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.primary}</p>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.secondary}</p>
                    </div>
                    {s.kind === 'issue' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>Report</span>
                    )}
                  </button>
                )) : !suggestionsLoading && search.length >= 2 ? (
                  <div className="px-4 py-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No results for "{search}"</div>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'].map(s => {
            const neon = STATUS_NEON[s];
            const isActive = statusFilter === s;
            const statusLabel: Record<string, string> = {
              All: t('dashboard.total_reports') ? t('nav.dashboard') && 'All' : 'All',
              Pending: t('dashboard.pending'),
              Verified: t('dashboard.verified'),
              'In Progress': t('dashboard.in_progress'),
              Resolved: t('dashboard.resolved'),
              Rejected: t('dashboard.rejected'),
            };
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
                style={isActive
                  ? { background: neon.bg, color: neon.color, border: `1px solid ${neon.color}40` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {statusLabel[s] || s}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const el = document.getElementById('cat-scroll'); el?.scrollBy({ left: -180, behavior: 'smooth' }); }}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          </button>
          <div id="cat-scroll" className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 pb-1">
            {['All', 'Traffic', 'Road', 'Emergency', 'Safety', 'Sanitation', 'Water', 'Electricity', 'Environment', 'Infrastructure', 'Public Health'].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
                style={filter === cat
                  ? { background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
          </div>
          <button onClick={() => { const el = document.getElementById('cat-scroll'); el?.scrollBy({ left: 180, behavior: 'smooth' }); }}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Map banner */}
      {viewMode === 'map' && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl glass-dark">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: userLocation ? '#00FF88' : 'rgba(255,255,255,0.2)', boxShadow: userLocation ? '0 0 8px rgba(0,255,136,0.5)' : 'none' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {userLocation ? `📍 ${locationAddress || `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}` : 'Location not detected'}
            </span>
          </div>
          <button onClick={() => handleLocateMe(false)} disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>
            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            {userLocation ? 'Refresh' : 'Detect'}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner label={t('dashboard.syncing')} /></div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {filteredIssues.length} report{filteredIssues.length !== 1 ? 's' : ''}
              {statusFilter !== 'All' ? ` · ${statusFilter}` : ''}
              {filter !== 'All' ? ` · ${filter}` : ''}
            </p>
            <button onClick={() => setShowFake(!showFake)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={showFake
                ? { background: 'rgba(255,60,172,0.15)', color: '#FF3CAC', border: '1px solid rgba(255,60,172,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <ShieldAlert className="w-3 h-3" /> {showFake ? t('dashboard.verified') + ' ✓' : 'Show Fake'}
            </button>
          </div>
          {filteredIssues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIssues.map(issue => <IssueCard key={issue.id} issue={issue} user={user} />)}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <AlertCircle className="w-10 h-10 mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('dashboard.no_intelligence')}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{t('dashboard.load_more')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[420px] lg:h-[560px] rounded-2xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full z-0">
            <ChangeView issues={filteredIssues} userLocation={userLocation} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userLocation && <Marker position={userLocation}><Popup><p className="font-bold text-xs" style={{ color: '#00FF88' }}>{t('dashboard.you_are_here')}</p></Popup></Marker>}
            {filteredIssues.map(issue => (
              <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                <Popup>
                  <div className="p-2 max-w-[200px]">
                    <img src={issue.imageUrl} className="w-full aspect-video object-cover rounded-lg mb-2" alt="Issue" />
                    <p className="text-xs font-semibold text-zinc-100 line-clamp-2 mb-1">{issue.description}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{issue.status}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
