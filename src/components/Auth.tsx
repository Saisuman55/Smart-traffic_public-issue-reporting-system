import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, MapPin, Bell, BarChart3, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { API_BASE } from '../services/apiBase';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

const features = [
  { icon: MapPin,    title: 'Report Issues',   desc: 'Pin civic problems on the map instantly', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { icon: Shield,    title: 'AI Verification', desc: 'Every report verified by Gemini AI',       color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  { icon: Bell,      title: 'Live Updates',    desc: 'Real-time status notifications',            color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { icon: BarChart3, title: 'Analytics',       desc: 'Track resolution trends & insights',       color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
];

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) { toast.error('Please enter your name.'); setLoading(false); return; }
        const res = await registerUser({ name, email, password });
        if (res.msg === 'User registered' || res.user) {
          toast.success('Account created! Please log in.');
          setMode('login'); setLoading(false); return;
        }
        toast.error(res.msg || 'Registration failed.');
      } else if (mode === 'login') {
        const res = await loginUser({ email, password });
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          window.location.reload();
        } else { toast.error(res.msg || 'Login failed.'); }
      } else if (mode === 'forgot') {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.resetToken) { toast.success(`Reset code: ${data.resetToken}`, { duration: 30000 }); setMode('reset'); }
        else toast.error(data.msg || 'Email not found.');
      } else if (mode === 'reset') {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, resetToken, newPassword })
        });
        const data = await res.json();
        if (data.msg === 'Password reset successfully') { toast.success('Password reset! Please log in.'); setMode('login'); }
        else toast.error(data.msg || 'Reset failed.');
      }
    } catch { toast.error('Network error. Is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 50%, #faf5ff 100%)' }}>
      <Toaster position="top-right" richColors />

      {/* Aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', animation: 'aurora-shift 12s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', animation: 'aurora-shift 15s ease-in-out infinite reverse' }} />
      </div>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)', boxShadow: '0 8px 25px rgba(99,102,241,0.35)' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-xl" style={{ color: '#f4f4f5' }}>Civic Pillar</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3" style={{ color: '#6366F1' }} />
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(161,161,170,0.9)' }}>AI-Powered Platform</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-5xl font-display font-black leading-tight mb-5" style={{ color: '#f4f4f5' }}>
              Making Cities<br />
              <span className="text-gradient">Smarter</span><br />
              Together
            </h1>
            <p className="text-lg font-medium leading-relaxed max-w-sm" style={{ color: 'rgba(161,161,170,1.0)' }}>
              Report, track and resolve civic issues in your community with AI-powered verification.
            </p>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl p-4 cursor-default"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(99,102,241,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: f.bg }}>
                <f.icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <p className="font-bold text-sm mb-0.5" style={{ color: '#f4f4f5' }}>{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(161,161,170,0.9)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 flex items-center gap-8 pt-6" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
          {[['10K+', 'Issues Resolved', '#6366F1'], ['98%', 'AI Accuracy', '#10B981'], ['24/7', 'Monitoring', '#8B5CF6']].map(([val, label, color]) => (
            <div key={label}>
              <p className="font-display font-black text-xl" style={{ color }}>{val}</p>
              <p className="text-xs font-medium" style={{ color: 'rgba(161,161,170,0.9)' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-xl" style={{ color: '#f4f4f5' }}>Civic Pillar</span>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 40px rgba(99,102,241,0.1)' }}>
            <AnimatePresence mode="wait">
              {/* LOGIN / REGISTER */}
              {(mode === 'login' || mode === 'register') && (
                <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-black mb-1" style={{ color: '#f4f4f5' }}>
                      {mode === 'login' ? 'Welcome back 👋' : 'Join us today ✨'}
                    </h2>
                    <p className="text-sm" style={{ color: 'rgba(161,161,170,0.9)' }}>
                      {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="flex p-1 rounded-xl mb-6" style={{ background: 'rgba(99,102,241,0.06)' }}>
                    {['login', 'register'].map(tab => (
                      <button key={tab} onClick={() => setMode(tab as Mode)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 capitalize"
                        style={mode === tab
                          ? { background: 'white', color: '#6366F1', boxShadow: '0 2px 8px rgba(99,102,241,0.15)' }
                          : { color: 'rgba(161,161,170,0.9)' }}>
                        {tab === 'login' ? 'Login' : 'Register'}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                      {mode === 'register' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} />
                            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="input-field pl-11" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} />
                      <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="input-field pl-11" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field pl-11 pr-12" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(161,161,170,0.7)' }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold transition-colors" style={{ color: '#6366F1' }}>Forgot password?</button>
                      </div>
                    )}
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === 'register' ? 'Create Account' : 'Sign In'}<ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </form>

                  <p className="text-center text-sm mt-5" style={{ color: 'rgba(161,161,170,0.9)' }}>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold transition-colors" style={{ color: '#6366F1' }}>
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>

                  <div className="flex items-center justify-center gap-4 mt-5 pt-5" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                    {['AI Verified', 'Secure', 'Free'].map(badge => (
                      <div key={badge} className="flex items-center gap-1.5" style={{ color: 'rgba(161,161,170,0.9)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                        <span className="text-xs font-medium">{badge}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* FORGOT */}
              {mode === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <button onClick={() => setMode('login')} className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors" style={{ color: 'rgba(161,161,170,0.9)' }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <KeyRound className="w-6 h-6" style={{ color: '#6366F1' }} />
                  </div>
                  <h2 className="text-2xl font-display font-black mb-1" style={{ color: '#f4f4f5' }}>Forgot Password?</h2>
                  <p className="text-sm mb-6" style={{ color: 'rgba(161,161,170,0.9)' }}>Enter your email to get a reset code.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} />
                      <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="input-field pl-11" />
                    </div>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </form>
                  <p className="text-center mt-4"><button onClick={() => setMode('reset')} className="text-xs font-semibold" style={{ color: '#6366F1' }}>Already have a code?</button></p>
                </motion.div>
              )}

              {/* RESET */}
              {mode === 'reset' && (
                <motion.div key="reset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <button onClick={() => setMode('forgot')} className="flex items-center gap-2 text-sm font-medium mb-6" style={{ color: 'rgba(161,161,170,0.9)' }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <KeyRound className="w-6 h-6" style={{ color: '#10B981' }} />
                  </div>
                  <h2 className="text-2xl font-display font-black mb-1" style={{ color: '#f4f4f5' }}>Reset Password</h2>
                  <p className="text-sm mb-6" style={{ color: 'rgba(161,161,170,0.9)' }}>Enter your reset code and new password.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} /><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field pl-11" /></div>
                    <div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} /><input type="text" placeholder="Reset Code" value={resetToken} onChange={e => setResetToken(e.target.value.toUpperCase())} required className="input-field pl-11 tracking-widest" /></div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(161,161,170,0.7)' }} />
                      <input type={showPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="input-field pl-11 pr-12" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(161,161,170,0.7)' }}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
