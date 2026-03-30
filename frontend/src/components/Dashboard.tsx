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
  const [hasMore] = useState(false);
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
        .filter((f: any) => { const cc = f.properties?.countrycode || ''; return cc === 'IN'; })
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
    { label: 'Total Reports', value: issues.length, icon: TrendingUp, color: 'from-purple-500 to-blue-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Verified', value: issues.filter(i => i.status === 'Verified').length, icon: CheckCircle2, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Pending', value: issues.filter(i => i.status === 'Pending').length, icon: Clock, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Active Users', value: activeUsersCount ?? '...', icon: Users, color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
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

  const STATUS_COLORS: Record<string, string> = {
    All: 'bg-neutral-900 text-white', Pending: 'bg-amber-500 text-white',
    Verified: 'bg-purple-600 text-white', 'In Progress': 'bg-blue-500 text-white',
    Resolved: 'bg-emerald-500 text-white', Rejected: 'bg-rose-500 text-white',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${stat.bg} ${stat.text}`}>Live</span>
            </div>
            <p className="text-2xl font-display font-black text-neutral-900 tracking-tight">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Live Feed</span>
            </div>
            <h1 className="text-2xl font-display font-black text-neutral-900">
              Civic <span className="text-gradient">Intelligence</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('grid')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>
                <ListIcon className="w-3.5 h-3.5" /> Grid
              </button>
              <button onClick={() => setViewMode('map')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
            </div>
            <button onClick={() => handleLocateMe(false)} disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${userLocation ? 'border-purple-300 text-purple-600 bg-purple-50' : 'border-neutral-200 text-neutral-500 bg-white'}`}>
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {userLocation ? locationAddress || 'Located' : 'Near Me'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <input type="text" placeholder="Search locations, institutes, descriptions..."
            value={search} onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
          />
          {search && <button onClick={() => { setSearch(''); setLocationSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"><X className="w-4 h-4" /></button>}

          {showSuggestions && search.length >= 1 && (() => {
            const issueMatches = issues.filter(i => i.address.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase())).slice(0, 2)
              .map(i => ({ kind: 'issue' as const, primary: i.address.split(',')[0], secondary: i.category, fullText: i.address }));
            const locMatches = locationSuggestions.map((s: any) => ({ kind: 'place' as const, primary: s.primary, secondary: s.secondary, fullText: s.fullText }));
            const all = [...issueMatches, ...locMatches];
            return (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {suggestionsLoading && <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-400"><Loader2 className="w-3 h-3 animate-spin" /> Searching...</div>}
                {all.length > 0 ? all.map((s, i) => (
                  <button key={i} onMouseDown={() => { setSearch(s.fullText); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-colors text-left border-b border-neutral-50 last:border-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.kind === 'issue' ? 'bg-purple-50 text-purple-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{s.primary}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{s.secondary}</p>
                    </div>
                    {s.kind === 'issue' && <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full shrink-0">Report</span>}
                  </button>
                )) : !suggestionsLoading && search.length >= 2 ? (
                  <div className="px-4 py-3 text-sm text-neutral-400 text-center">No results for "{search}"</div>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${statusFilter === s ? STATUS_COLORS[s] + ' shadow-sm' : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300'}`}>
              {s === 'All' ? 'All Status' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const el = document.getElementById('cat-scroll'); el?.scrollBy({ left: -180, behavior: 'smooth' }); }}
            className="shrink-0 w-7 h-7 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-all">
            <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          </button>
          <div id="cat-scroll" className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 pb-1">
            {['All', 'Traffic', 'Road', 'Emergency', 'Safety', 'Sanitation', 'Water', 'Electricity', 'Environment', 'Infrastructure', 'Public Health'].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${filter === cat ? 'bg-neutral-900 text-white shadow-sm' : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300'}`}>
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
          </div>
          <button onClick={() => { const el = document.getElementById('cat-scroll'); el?.scrollBy({ left: 180, behavior: 'smooth' }); }}
            className="shrink-0 w-7 h-7 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-all">
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Map banner */}
      {viewMode === 'map' && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-neutral-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${userLocation ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
            <span className="text-xs font-semibold text-neutral-600">{userLocation ? `📍 ${locationAddress || `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}` : 'Location not detected'}</span>
          </div>
          <button onClick={() => handleLocateMe(false)} disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all disabled:opacity-50">
            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            {userLocation ? 'Refresh' : 'Detect'}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><LoadingSpinner label="Loading reports..." /></div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-400">{filteredIssues.length} report{filteredIssues.length !== 1 ? 's' : ''}{statusFilter !== 'All' ? ` · ${statusFilter}` : ''}{filter !== 'All' ? ` · ${filter}` : ''}</p>
            <button onClick={() => setShowFake(!showFake)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${showFake ? 'bg-rose-500 text-white border-transparent' : 'bg-white text-neutral-400 border-neutral-200'}`}>
              <ShieldAlert className="w-3 h-3" /> {showFake ? 'Hide Fake' : 'Show Fake'}
            </button>
          </div>
          {filteredIssues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIssues.map(issue => <IssueCard key={issue.id} issue={issue} user={user} />)}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-neutral-200">
              <AlertCircle className="w-10 h-10 text-neutral-200 mb-3" />
              <p className="text-sm font-semibold text-neutral-400">No reports found</p>
              <p className="text-xs text-neutral-300 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[420px] lg:h-[560px] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative">
          <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full z-0">
            <ChangeView issues={filteredIssues} userLocation={userLocation} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userLocation && <Marker position={userLocation}><Popup><p className="font-bold text-xs text-purple-600">You are here</p></Popup></Marker>}
            {filteredIssues.map(issue => (
              <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                <Popup>
                  <div className="p-2 max-w-[200px]">
                    <img src={issue.imageUrl} className="w-full aspect-video object-cover rounded-lg mb-2" alt="Issue" />
                    <p className="text-xs font-semibold text-neutral-800 line-clamp-2 mb-1">{issue.description}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${issue.status === 'Verified' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{issue.status}</span>
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
