import React from 'react';
import { Card } from '../common/Card';
import { QualityResult } from '../../types';
import { ShieldCheck, AlertTriangle, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export interface QualityScoreCardProps {
  quality: QualityResult;
  isSimulating?: boolean;
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({ quality }) => {
  const isAccepted = quality.result === 'ACCEPTED';
  const isWarning = quality.result === 'WARNING';
  const isRejected = quality.result === 'REJECTED';

  const theme = isAccepted
    ? {
        bg: 'from-emerald-600 to-teal-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ring: 'text-emerald-500',
        icon: <ShieldCheck className="w-8 h-8 text-emerald-100" />
      }
    : isWarning
    ? {
        bg: 'from-amber-600 to-yellow-700',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        ring: 'text-amber-500',
        icon: <AlertTriangle className="w-8 h-8 text-amber-100" />
      }
    : {
        bg: 'from-rose-600 to-red-800',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        ring: 'text-rose-500',
        icon: <AlertCircle className="w-8 h-8 text-rose-100" />
      };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 shadow-xl p-6 sm:p-7">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Overall Quality Score Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr shadow-lg p-1">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${theme.bg} opacity-90`} />
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono leading-none">
                {quality.score}%
              </span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">
                Quality Score
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Quality Classification
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-white/10 text-white/90 border border-white/20">
                Demo Score
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {quality.classification}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg border ${theme.badge}`}>
                STATUS: {quality.result}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-dairy-400" />
                {quality.mlConfidence != null
                  ? `Confidence: ${(quality.mlConfidence * 100).toFixed(0)}%`
                  : 'ML: DEMO PREDICTION'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Recommendations and Warning summary */}
        <div className="flex-1 max-w-lg bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 w-full">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-dairy-400" />
            Inspection Outcome & Recommendation
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {quality.recommendations[0] || 'Standard quality assessment complete.'}
          </p>

          {quality.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Flagged Observations:
              </span>
              {quality.warnings.map((w, idx) => (
                <p key={idx} className="text-[11px] text-amber-200/90 flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engineering Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="italic">
          * Demo/engineering assessment only. Not a certified laboratory assay.
        </span>
        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
          MILKGUARD Demo Engine
        </span>
      </div>
    </Card>
  );
};
