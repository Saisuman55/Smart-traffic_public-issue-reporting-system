import React from 'react';
import { Shield } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' };
  const iconSizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-10 h-10' };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`${sizes[size]} border-2 rounded-full animate-spin`}
          style={{ borderColor: 'rgba(99,102,241,0.15)', borderTopColor: '#6366F1' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className={`${iconSizes[size]}`} style={{ color: 'rgba(99,102,241,0.4)' }} />
        </div>
      </div>
      {label && <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(161,161,170,0.9)' }}>{label}</p>}
    </div>
  );
}
