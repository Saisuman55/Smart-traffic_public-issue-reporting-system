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
        <div className={`${sizes[size]} border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className={`${iconSizes[size]} text-purple-500/40`} />
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{label}</p>}
    </div>
  );
}
