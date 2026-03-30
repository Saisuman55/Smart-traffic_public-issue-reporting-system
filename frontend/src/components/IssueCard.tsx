import React from 'react';
import { MapPin, Clock, Shield, CheckCircle2, AlertTriangle, ArrowUpRight, ThumbsUp, MessageSquare, ShieldAlert, Zap } from 'lucide-react';
import { IssueReport, UserProfile } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth } from '../currentUser';
import { toast } from 'sonner';
import { useI18n } from '../i18n';

interface IssueCardProps {
  issue: IssueReport;
  user?: UserProfile | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Pending:      { bg: 'bg-amber-500/15',  text: 'text-amber-600',  dot: 'bg-amber-500',  label: 'Pending' },
  Verified:     { bg: 'bg-purple-500/15', text: 'text-purple-600', dot: 'bg-purple-500', label: 'Verified' },
  'In Progress':{ bg: 'bg-blue-500/15',   text: 'text-blue-600',   dot: 'bg-blue-500',   label: 'In Progress' },
  Resolved:     { bg: 'bg-emerald-500/15',text: 'text-emerald-600',dot: 'bg-emerald-500',label: 'Resolved' },
  Rejected:     { bg: 'bg-rose-500/15',   text: 'text-rose-600',   dot: 'bg-rose-500',   label: 'Rejected' },
};

const CAT_EMOJI: Record<string, string> = {
  Traffic: '🚦', Road: '🛣️', Emergency: '🚨', Safety: '🛡️',
  Sanitation: '♻️', Water: '💧', Electricity: '⚡', Environment: '🌳',
  Infrastructure: '🏗️', 'Public Health': '🏥', Other: '📝',
};

export default function IssueCard({ issue, user }: IssueCardProps) {
  const { t } = useI18n();
  const status = STATUS_STYLES[issue.status] || STATUS_STYLES.Pending;
  const isUpvoted = auth.currentUser ? issue.upvotes?.includes(auth.currentUser.uid) : false;
  const isOwn = auth.currentUser?.uid === issue.reporterUid;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await fetch(`/api/issues/${issue.id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.currentUser.uid, action: isUpvoted ? 'remove' : 'add' })
      });
      toast.success(isUpvoted ? 'Upvote removed' : 'Issue upvoted');
    } catch { toast.error('Failed to upvote'); }
  };

  return (
    <Link to={`/issue/${issue.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group bg-white rounded-2xl border border-neutral-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-500/8 transition-all duration-300 cursor-pointer flex flex-col h-full"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
          <img
            src={issue.imageUrl}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={issue.category}
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${issue.id}/800/450?blur=2`; }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isOwn && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-lg">
                <Zap className="w-2.5 h-2.5" /> Your Report
              </span>
            )}
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider rounded-lg">
              {CAT_EMOJI[issue.category] || '📝'} {issue.category}
            </span>
          </div>

          {/* AI confidence */}
          {issue.aiConfidence !== undefined && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-lg">
              <Shield className="w-2.5 h-2.5 text-emerald-400" />
              AI {(issue.aiConfidence * 100).toFixed(0)}%
            </div>
          )}

          {/* Fake badge */}
          {issue.isFake && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-rose-600 text-white text-[9px] font-bold rounded-lg">
              <ShieldAlert className="w-2.5 h-2.5" /> Fake
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
              {status.label}
            </span>
            <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          {/* Description */}
          <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug flex-1">
            {issue.description || `${issue.category} issue reported`}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-neutral-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs truncate">{issue.address.split(',').slice(0, 2).join(',')}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 text-xs font-bold transition-colors ${isUpvoted ? 'text-purple-600' : 'text-neutral-400 hover:text-purple-500'}`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-current' : ''}`} />
                {issue.upvotes?.length || 0}
              </button>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <MessageSquare className="w-3.5 h-3.5" />
                {issue.comments?.length || 0}
              </div>
            </div>
            <span className="text-[10px] text-neutral-300 font-medium">
              {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
