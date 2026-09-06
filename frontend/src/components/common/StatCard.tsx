import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number; // e.g. +8.4 or -2.1
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  change,
  changeLabel = 'vs yesterday',
  icon,
  iconBg = 'bg-dairy-50 text-dairy-600',
  badge,
  subtitle
}) => {
  const isPositive = change !== undefined ? change >= 0 : undefined;

  return (
    <Card hover className="flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={`p-3 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-slate-400">{changeLabel}</span>
          </div>
        ) : subtitle ? (
          <span className="text-xs text-slate-500">{subtitle}</span>
        ) : (
          <div />
        )}
        {badge}
      </div>
    </Card>
  );
};
