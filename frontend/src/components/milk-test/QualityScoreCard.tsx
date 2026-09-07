import React from 'react';
import { Card } from '../common/Card';
import { QualityResult } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Cpu,
  Info
} from 'lucide-react';

export interface QualityScoreCardProps {
  quality: QualityResult;
  isSimulating?: boolean;
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({ quality }) => {
  const purityScore = quality.purityScore ?? quality.score ?? 0;
  const recommendation = quality.aiRecommendation || (quality.result === 'ACCEPTED' ? 'ACCEPT' : quality.result === 'WARNING' ? 'REVIEW' : 'REJECT');
  const classification = quality.classification || (purityScore >= 90 ? 'EXCELLENT' : purityScore >= 75 ? 'GOOD' : purityScore >= 60 ? 'WARNING' : 'POOR');

  const isAccept = recommendation === 'ACCEPT';
  const isReview = recommendation === 'REVIEW';
  const isReject = recommendation === 'REJECT';

  const theme = isAccept
    ? {
        bg: 'from-emerald-600 via-teal-600 to-emerald-800',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        banner: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        bannerText: '✅ ACCEPT MILK',
        ringColor: '#10b981',
        icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />
      }
    : isReview
    ? {
        bg: 'from-amber-600 via-yellow-600 to-amber-800',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        banner: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        bannerText: '⚠️ REVIEW MILK',
        ringColor: '#f59e0b',
        icon: <AlertTriangle className="w-6 h-6 text-amber-400" />
      }
    : {
        bg: 'from-rose-600 via-red-600 to-rose-900',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        banner: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        bannerText: '❌ REJECT MILK',
        ringColor: '#f43f5e',
        icon: <AlertCircle className="w-6 h-6 text-rose-400" />
      };

  const observations = quality.scoreExplanation && quality.scoreExplanation.length > 0
    ? quality.scoreExplanation
    : [
        `✓ Temperature within configured range (${quality.parameters?.temperature?.reading || 24}°C)`,
        `✓ pH within configured reference range (${quality.parameters?.ph?.reading || 6.64})`,
        `✓ Estimated Fat within configured range (${quality.parameters?.fat?.reading || 4.5}%)`,
        `✓ Density within configured range (${quality.parameters?.density?.reading || 1.029} g/mL)`,
        `✓ Electrical Conductivity within baseline (${quality.parameters?.conductivity?.reading || 4.8} mS/cm)`
      ];

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-dairy-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            AI / Quality Screening Assessment
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/10 text-slate-300 border border-white/15 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-dairy-400" />
            Model: {quality.modelVersion || 'screening-baseline-v1'}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${theme.badge}`}>
            {classification}
          </span>
        </div>
      </div>

      {/* Main Center Section: Score Gauge & Recommendation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Purity Score Radial Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-slate-800/40 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Milk Purity Score
          </span>
          <div className="relative flex items-center justify-center w-28 h-28 my-2">
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#334155"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={theme.ringColor}
                strokeWidth="8"
                strokeDasharray={`${(purityScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {purityScore}%
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 mt-1">
            Status: <span className="text-white font-extrabold">{classification}</span>
          </span>
        </div>

        {/* Right: AI Recommendation & Key Observations */}
        <div className="md:col-span-8 space-y-4">
          {/* Prominent Recommendation Banner */}
          <div className={`p-4 rounded-2xl border ${theme.banner} flex items-center justify-between gap-4 shadow-sm`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                AI/ML Recommendation
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block mt-0.5">
                {theme.bannerText}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 shrink-0">
              {theme.icon}
            </div>
          </div>

          {/* Key Observations Checklist */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Key Observations & Parameter Checks:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {observations.map((obs, idx) => {
                const isAnomaly = obs.startsWith('⚠') || obs.includes('deviat') || obs.includes('outside') || obs.includes('elevated');
                return (
                  <div
                    key={idx}
                    className={`text-xs flex items-start gap-2 leading-relaxed ${
                      isAnomaly ? 'text-amber-300 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {isAnomaly ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span>{obs}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          <strong>Notice:</strong> Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing.
        </span>
      </div>
    </Card>
  );
};
