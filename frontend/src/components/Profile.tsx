import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../currentUser';
import { UserProfile, IssueReport } from '../types';
import { MapPin, Calendar, Mail, Edit3, Save, X, FileText, CheckCircle2, Shield, Loader2, LogOut, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import IssueCard from './IssueCard';
import { useI18n } from '../i18n';

interface ProfileProps { onUpdate?: (user: UserProfile) => void; }

export default function Profile({ onUpdate }: ProfileProps) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userIssues, setUserIssues] = useState<IssueReport[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${uid}`);
        if (res.ok) { const data = await res.json(); setProfile(data); setEditData({ displayName: data.displayName, bio: data.bio || '', location: data.location || '' }); }
      } catch { /* silent */ }
    };
    const fetchIssues = async () => {
      try { const res = await fetch(`/api/issues?reporterUid=${uid}`); if (res.ok) setUserIssues(await res.json()); }
      catch { /* silent */ } finally { setLoading(false); }
    };
    fetchProfile(); fetchIssues();
  }, []);

  const handleDetectLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setEditData(prev => ({ ...prev, location: data.address?.city || data.address?.town || data.address?.state || 'Unknown' }));
          toast.success('Location detected.');
        } catch { setEditData(prev => ({ ...prev, location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` })); }
        finally { setIsLocating(false); }
      },
      () => { setIsLocating(false); toast.error('Could not detect location.'); },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser || !profile) return;
    try {
      const updates = { ...profile, ...editData, updatedAt: new Date().toISOString() };
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (res.ok) {
        const saved = await res.json();
        setProfile(saved); localStorage.setItem('user', JSON.stringify(saved));
        if (onUpdate) onUpdate(saved); setIsEditing(false); toast.success('Profile updated!');
      }
    } catch { toast.error('Failed to update profile.'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return null;

  const trustPct = Math.min(100, (profile.trustScore / 1000) * 100);
  const resolvedCount = userIssues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=7C3AED&color=fff&size=128`}
                alt={profile.displayName} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-purple-50 hover:text-purple-600 text-neutral-500 rounded-xl text-xs font-bold transition-all">
                {isEditing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
              </button>
              <button onClick={() => signOut(auth)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-rose-50 hover:text-rose-500 text-neutral-500 rounded-xl text-xs font-bold transition-all">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>

          {/* Name & info */}
          <h1 className="text-xl font-display font-black text-neutral-900 mb-1">{profile.displayName}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 mb-4">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>
            {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{profile.joinedAt ? format(new Date(profile.joinedAt), 'MMM yyyy') : 'N/A'}</span>
          </div>

          {/* Trust score */}
          <div className="bg-neutral-50 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600">Trust Score</span>
              <span className="text-sm font-black text-purple-600">{profile.trustScore}<span className="text-neutral-300 font-medium text-xs">/1000</span></span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${trustPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Reports', value: userIssues.length, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Resolved', value: resolvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Trust', value: profile.trustScore, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-display font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio or edit form */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="space-y-3 bg-neutral-50 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Display Name</label>
                    <input type="text" value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Location</label>
                    <div className="relative">
                      <input type="text" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} placeholder="Detect or type..."
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all" />
                      <button type="button" onClick={handleDetectLocation} disabled={isLocating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-purple-500 transition-colors">
                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all h-20 resize-none" />
                </div>
                <button onClick={handleSave}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/20">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </motion.div>
            ) : (
              <motion.p key="bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-neutral-500 leading-relaxed">
                {profile.bio || 'No bio yet. Click Edit to add one.'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-neutral-900">My Reports</h2>
          <span className="text-xs font-bold text-neutral-400 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg">{userIssues.length} total</span>
        </div>
        {userIssues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
            <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-neutral-200" />
            </div>
            <p className="text-sm font-bold text-neutral-500">No reports yet</p>
            <p className="text-xs text-neutral-400 mt-1">Start reporting civic issues in your area</p>
          </div>
        )}
      </div>
    </div>
  );
}
