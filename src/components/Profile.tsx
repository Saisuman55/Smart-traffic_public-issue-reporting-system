import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../currentUser';
import { UserProfile, IssueReport } from '../types';
import { MapPin, Calendar, Mail, Edit3, Save, X, FileText, CheckCircle2, Shield, Loader2, LogOut } from 'lucide-react';
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,136,0.2)', borderTopColor: '#00FF88' }} />
    </div>
  );
  if (!profile) return null;

  const trustPct = Math.min(100, (profile.trustScore / 1000) * 100);
  const resolvedCount = userIssues.filter(i => i.status === 'Resolved').length;
  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', transition: 'all 0.2s' };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden" style={cardStyle}>
        {/* Banner */}
        <div className="h-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(0,212,255,0.1) 50%, rgba(191,95,255,0.1) 100%)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0,255,136,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(0,212,255,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=00FF88&color=0A0A0F&size=128`}
                alt={profile.displayName} className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: '3px solid #0A0A0F', boxShadow: '0 0 20px rgba(0,255,136,0.3)' }} />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full" style={{ background: '#00FF88', border: '2px solid #0A0A0F', boxShadow: '0 0 8px rgba(0,255,136,0.5)' }} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {isEditing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
              </button>
              <button onClick={() => signOut(auth)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(255,60,172,0.1)', color: '#FF3CAC', border: '1px solid rgba(255,60,172,0.2)' }}>
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>

          {/* Name & info */}
          <h1 className="text-xl font-display font-black text-white mb-1">{profile.displayName}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>
            {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{profile.joinedAt ? format(new Date(profile.joinedAt), 'MMM yyyy') : 'N/A'}</span>
          </div>

          {/* Trust score */}
          <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Trust Score</span>
              <span className="text-sm font-black" style={{ color: '#00FF88' }}>{profile.trustScore}<span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>/1000</span></span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${trustPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #00FF88, #00D4FF)', boxShadow: '0 0 8px rgba(0,255,136,0.4)' }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Reports',  value: userIssues.length,  color: '#00FF88', bg: 'rgba(0,255,136,0.08)' },
              { label: 'Resolved', value: resolvedCount,       color: '#00D4FF', bg: 'rgba(0,212,255,0.08)' },
              { label: 'Trust',    value: profile.trustScore,  color: '#BF5FFF', bg: 'rgba(191,95,255,0.08)' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                <p className="text-xl font-display font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio or edit form */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>Display Name</label>
                    <input type="text" value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })} style={inputStyle}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,255,136,0.5)'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>Location</label>
                    <div className="relative">
                      <input type="text" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} placeholder="Detect or type..."
                        style={{ ...inputStyle, paddingRight: '40px' }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(0,255,136,0.5)'}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
                      <button type="button" onClick={handleDetectLocation} disabled={isLocating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })}
                    style={{ ...inputStyle, height: '80px', resize: 'none' }}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(0,255,136,0.5)'}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <button onClick={handleSave}
                  className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 btn-neon">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </motion.div>
            ) : (
              <motion.p key="bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {profile.bio || 'No bio yet. Click Edit to add one.'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-white">My Reports</h2>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {userIssues.length} total
          </span>
        </div>
        {userIssues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        ) : (
          <div className="rounded-2xl p-12 text-center" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <FileText className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <p className="text-sm font-bold text-white mb-1">No reports yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Start reporting civic issues in your area</p>
          </div>
        )}
      </div>
    </div>
  );
}
