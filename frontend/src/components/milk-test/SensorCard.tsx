import React from 'react';
import { Card } from '../common/Card';
import { ParameterAssessment } from '../../types';

export interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  assessment?: ParameterAssessment;
  icon: React.ReactNode;
  iconColor?: string;
  isSimulating?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  assessment,
  icon,
  iconColor = 'bg-dairy-50 text-dairy-600',
  isSimulating = false
}) => {
  const status = assessment?.status || 'NORMAL';

  const statusConfig = {
    NORMAL: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'NORMAL' },
    LOW: { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'LOW' },
    HIGH: { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'HIGH' },
    CRITICAL: { badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'CRITICAL' }
  };

  const { badge, text } = statusConfig[status];

  return (
    <Card hover className="relative overflow-hidden transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconColor}`}>{icon}</div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {value}
              </span>
              <span className="text-xs font-bold text-slate-500">{unit}</span>
            </div>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${badge}`}
        >
          {text}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Normal Range:{' '}
          <strong className="text-slate-700 font-semibold">
            {assessment ? `${assessment.normalMin} – ${assessment.normalMax} ${unit}` : 'Configured'}
          </strong>
        </span>
        {isSimulating && (
          <span className="flex items-center gap-1 text-[10px] text-dairy-600 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-dairy-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
    </Card>
  );
};
