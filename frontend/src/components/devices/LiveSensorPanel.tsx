import React, { useState, useEffect } from 'react';
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
  Cpu,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { SensorReading, DeviceStatus, CalibrationStatus } from '../../types';

interface LiveSensorPanelProps {
  reading: SensorReading | null;
  deviceId?: string;
  deviceName?: string;
  deviceStatus?: DeviceStatus;
  calibrationStatus?: CalibrationStatus;
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
  calibrationStatus = 'CALIBRATED',
  isDemo = false,
  onCaptureSnapshot,
  onSimulateTick,
  compact = false
}) => {
  const [dataAgeSec, setDataAgeSec] = useState<number | null>(null);
  const [showStaleConfirm, setShowStaleConfirm] = useState<boolean>(false);

  // Calculate dynamic data age
  useEffect(() => {
    const updateAge = () => {
      if (reading?.timestamp) {
        const time = new Date(reading.timestamp).getTime();
        if (!isNaN(time)) {
          const sec = Math.max(0, Math.floor((Date.now() - time) / 1000));
          setDataAgeSec(sec);
          return;
        }
      }
      setDataAgeSec(null);
    };

    updateAge();
    const timer = setInterval(updateAge, 1000);
    return () => clearInterval(timer);
  }, [reading]);

  const isSimulated = isDemo || Boolean(reading?.isDemo);
  const isStale = dataAgeSec !== null && dataAgeSec > 60;
  const isLive = !isSimulated && deviceStatus === 'ONLINE' && !isStale && reading !== null;

  // Format data age string
  const formatAgeString = () => {
    if (dataAgeSec === null || !reading) return 'No telemetry reported';
    if (dataAgeSec < 5) return 'Just now (<5s)';
    if (dataAgeSec < 60) return `${dataAgeSec}s ago`;
    const mins = Math.floor(dataAgeSec / 60);
    const remSec = dataAgeSec % 60;
    return `${mins}m ${remSec}s ago`;
  };

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

  const tempStatus = getParamStatus('temp', reading?.temperature);
  const phStatus = getParamStatus('ph', reading?.ph);
  const fatStatus = getParamStatus('fat', reading?.fat);
  const densityStatus = getParamStatus('density', reading?.density);
  const condStatus = getParamStatus('cond', reading?.conductivity);
  const levelStatus = getParamStatus('level', reading?.milkLevel);

  const handleCaptureClick = () => {
    if (!reading || !onCaptureSnapshot) return;
    if (isStale && !showStaleConfirm) {
      setShowStaleConfirm(true);
      return;
    }
    setShowStaleConfirm(false);
    onCaptureSnapshot(reading);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isSimulated
          ? 'bg-amber-500/10 border-amber-500/20'
          : isLive
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : isStale
          ? 'bg-amber-950/30 border-amber-600/30'
          : deviceStatus === 'WARNING'
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-slate-800/40 border-slate-700/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isSimulated
              ? 'bg-amber-500/20 text-amber-400'
              : isLive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm md:text-base tracking-tight">{deviceName}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {deviceId}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {reading?.timestamp
                  ? `${new Date(reading.timestamp).toLocaleTimeString()} (${formatAgeString()})`
                  : 'No telemetry reported'}
              </span>
              {dataAgeSec !== null && isStale && (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  STALE SNAPSHOT (&gt;60s)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mode & Live Badges */}
        <div className="flex items-center gap-2">
          {isSimulated ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              DEMO SENSOR DATA
            </span>
          ) : isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE TELEMETRY
            </span>
          ) : isStale ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/50 text-amber-400 border border-amber-500/40">
              <Clock className="w-3.5 h-3.5" />
              STALE DATA
            </span>
          ) : deviceStatus === 'UNKNOWN' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700/50 text-slate-400 border border-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
              NO DATA RECEIVED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
              <WifiOff className="w-3.5 h-3.5" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Informational Calibration Warning */}
      {(calibrationStatus === 'DUE' || calibrationStatus === 'OVERDUE') && (
        <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Informational Notice:</strong> Sensor calibration is currently <span className="font-bold underline">{calibrationStatus}</span>. Physical recalibration recommended.
          </span>
        </div>
      )}

      {/* Stale Warning Action Bar if Operator clicked capture */}
      {showStaleConfirm && (
        <div className="p-3 bg-amber-950/80 border-b border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Telemetry reading is stale ({dataAgeSec}s old). Are you sure you want to capture this frozen snapshot?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStaleConfirm(false)}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCaptureClick}
              className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Confirm Stale Capture
            </button>
          </div>
        </div>
      )}

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
                  onClick={handleCaptureClick}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-lg transition-all flex items-center gap-1.5 ${
                    isStale
                      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isStale ? 'Capture Stale Snapshot' : 'Capture Sensor Snapshot'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
