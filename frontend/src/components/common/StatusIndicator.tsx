import React from 'react';

export interface StatusIndicatorProps {
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'OFFLINE' | 'ACTIVE' | 'INACTIVE' | 'NORMAL' | 'WARNING' | 'CRITICAL';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  labelOverride?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = true,
  size = 'md',
  labelOverride
}) => {
  const getColors = () => {
    switch (status) {
      case 'CONNECTED':
      case 'ACTIVE':
      case 'NORMAL':
        return { dot: 'bg-emerald-500', pulse: 'bg-emerald-400', text: 'text-emerald-700' };
      case 'WARNING':
        return { dot: 'bg-amber-500', pulse: 'bg-amber-400', text: 'text-amber-700' };
      case 'ERROR':
      case 'CRITICAL':
      case 'DISCONNECTED':
      case 'OFFLINE':
        return { dot: 'bg-rose-500', pulse: 'bg-rose-400', text: 'text-rose-700' };
      case 'INACTIVE':
      default:
        return { dot: 'bg-slate-400', pulse: 'bg-slate-300', text: 'text-slate-600' };
    }
  };

  const colors = getColors();

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex">
        {(status === 'CONNECTED' || status === 'ACTIVE') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.pulse} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${colors.dot}`} />
      </span>
      {showLabel && (
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
          {labelOverride || status}
        </span>
      )}
    </div>
  );
};
