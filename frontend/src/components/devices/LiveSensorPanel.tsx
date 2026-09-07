import React from 'react';
import {
  Thermometer,
  Activity,
  Droplets,
  Layers,
  Zap,
  Gauge,
  Wifi,
  WifiOff,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  Cpu
} from 'lucide-react';
import { SensorReading, DeviceStatus } from '../../types';

interface LiveSensorPanelProps {
  reading: SensorReading | null;
  deviceId?: string;
  deviceName?: string;
  deviceStatus?: DeviceStatus;
  isDemo?: boolean;
  onCaptureSnapshot?: (reading: SensorReading) => void;
  onSimulateTick?: () => void;
  compact?: boolean;
}

export const LiveSensorPanel: React.FC<LiveSensorPanelProps> = ({
  reading,
  deviceId = 'ESP32-MILK-001',
  deviceName = 'Collection Station Analyzer',
  deviceStatus = 'ONLINE',
  isDemo = false,
  onCaptureSnapshot,
  onSimulateTick,
  compact = false
}) => {
  // Helper to determine parameter health status
  const getParamStatus = (
    param: 'temp' | 'ph' | 'fat' | 'density' | 'cond' | 'level',
    val?: number
  ): { label: 'NORMAL' | 'WARNING' | 'INVALID' | 'NO DATA'; color: string; bg: string } => {
    if (val === undefined || val === null || !Number.isFinite(val)) {
      return { label: 'NO DATA', color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700' };
    }

    switch (param) {
      case 'temp':
        if (val < -10 || val > 100) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        if (val < 15 || val > 30) return { label: 'WARNING', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      case 'ph':
        if (val < 0 || val > 14) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        if (val < 6.5 || val > 6.8) return { label: 'WARNING', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      case 'fat':
        if (val < 0 || val > 20) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        if (val < 3.2 || val > 6.0) return { label: 'WARNING', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      case 'density':
        if (val < 0.5 || val > 2.0) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        if (val < 1.026 || val > 1.034) return { label: 'WARNING', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      case 'cond':
        if (val < 0 || val > 50) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        if (val < 4.0 || val > 6.0) return { label: 'WARNING', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      case 'level':
        if (val < 0) return { label: 'INVALID', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/30' };
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
      default:
        return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
    }
  };

  const isSimulated = isDemo || Boolean(reading?.isDemo);
  const tempStatus = getParamStatus('temp', reading?.temperature);
  const phStatus = getParamStatus('ph', reading?.ph);
  const fatStatus = getParamStatus('fat', reading?.fat);
  const densityStatus = getParamStatus('density', reading?.density);
  const condStatus = getParamStatus('cond', reading?.conductivity);
  const levelStatus = getParamStatus('level', reading?.milkLevel);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        isSimulated
          ? 'bg-amber-500/10 border-amber-500/20'
          : deviceStatus === 'ONLINE'
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : deviceStatus === 'WARNING'
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-slate-800/40 border-slate-700/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isSimulated
              ? 'bg-amber-500/20 text-amber-400'
              : deviceStatus === 'ONLINE'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm md:text-base">{deviceName}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {deviceId}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {reading?.timestamp
                ? `Last update: ${new Date(reading.timestamp).toLocaleTimeString()}`
                : 'No telemetry reported'}
            </p>
          </div>
        </div>

        {/* Status Pill & Mode Badge */}
        <div className="flex items-center gap-2">
          {isSimulated ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              DEMO SENSOR DATA
            </span>
          ) : deviceStatus === 'ONLINE' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              CONNECTED HARDWARE
            </span>
          ) : deviceStatus === 'WARNING' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              WARNING / ATTENTION
            </span>
          ) : deviceStatus === 'UNKNOWN' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700/50 text-slate-400 border border-slate-600">
              <Clock className="w-3.5 h-3.5" />
              UNKNOWN (NO TELEMETRY)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
              <WifiOff className="w-3.5 h-3.5" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Grid of 6 Live Sensors */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Temperature */}
          <div className={`p-3.5 rounded-xl border transition-all ${tempStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                Temp
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tempStatus.color} bg-slate-900/60`}>
                {tempStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {reading?.temperature !== undefined ? reading.temperature.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-slate-400">°C</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ref: 20-25 °C</span>
          </div>

          {/* 2. pH */}
          <div className={`p-3.5 rounded-xl border transition-all ${phStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                pH Level
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${phStatus.color} bg-slate-900/60`}>
                {phStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {reading?.ph !== undefined ? reading.ph.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400">pH</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ref: 6.6-6.8</span>
          </div>

          {/* 3. Fat Content */}
          <div className={`p-3.5 rounded-xl border transition-all ${fatStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-amber-400" />
                Fat
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${fatStatus.color} bg-slate-900/60`}>
                {fatStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {reading?.fat !== undefined ? reading.fat.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ref: 3.5-6.5 %</span>
          </div>

          {/* 4. Density */}
          <div className={`p-3.5 rounded-xl border transition-all ${densityStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Density
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${densityStatus.color} bg-slate-900/60`}>
                {densityStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-slate-100">
                {reading?.density !== undefined ? reading.density.toFixed(4) : '--'}
              </span>
              <span className="text-xs text-slate-400">g/mL</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ref: 1.028-1.032</span>
          </div>

          {/* 5. Conductivity */}
          <div className={`p-3.5 rounded-xl border transition-all ${condStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Conductivity
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${condStatus.color} bg-slate-900/60`}>
                {condStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {reading?.conductivity !== undefined ? reading.conductivity.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400">mS/cm</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ref: 4.5-5.5</span>
          </div>

          {/* 6. Milk Level */}
          <div className={`p-3.5 rounded-xl border transition-all ${levelStatus.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Level / Vol
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${levelStatus.color} bg-slate-900/60`}>
                {levelStatus.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {reading?.milkLevel !== undefined ? reading.milkLevel.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Sensor probe</span>
          </div>
        </div>

        {/* Action Controls & Metadata */}
        {!compact && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <span>Firmware: <strong className="text-slate-200">{reading?.firmwareVersion || 'v1.0.0-telemetry'}</strong></span>
              {reading?.batteryLevel !== undefined && (
                <span>Battery: <strong className="text-slate-200">{reading.batteryLevel}%</strong></span>
              )}
              {reading?.sequenceNumber !== undefined && (
                <span>Seq: <strong className="text-slate-200">#{reading.sequenceNumber}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onSimulateTick && isSimulated && (
                <button
                  onClick={onSimulateTick}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Simulate Fluctuation
                </button>
              )}
              {onCaptureSnapshot && reading && (
                <button
                  onClick={() => onCaptureSnapshot(reading)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Capture Sensor Snapshot
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
