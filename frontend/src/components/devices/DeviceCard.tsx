import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusIndicator } from '../common/StatusIndicator';
import { Device } from '../../types';
import { Cpu, RefreshCw, Sliders, Wifi, WifiOff, CheckCircle2, XCircle, Eye } from 'lucide-react';

export interface DeviceCardProps {
  device: Device;
  onAction: (deviceId: string, action: 'RESTART' | 'CALIBRATE' | 'CONNECT' | 'DISCONNECT') => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onAction }) => {
  const navigate = useNavigate();
  const isConnected = device.status === 'CONNECTED';

  const sensorKeys: { key: keyof typeof device.sensors; label: string }[] = [
    { key: 'temperature', label: 'Temperature' },
    { key: 'ph', label: 'pH Probe' },
    { key: 'fat', label: 'Fat / Optical' },
    { key: 'conductivity', label: 'EC Probe' },
    { key: 'density', label: 'Density Hydrometer' },
    { key: 'level', label: 'Load Cell / Level' }
  ];

  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isConnected ? 'bg-dairy-50 text-dairy-600' : 'bg-slate-100 text-slate-400'}`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900 leading-tight">{device.name}</h4>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-50 text-amber-800 border border-amber-200">
                  SIMULATED DEVICE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{device.deviceId}</p>
            </div>
          </div>
          <StatusIndicator status={device.status} />
        </div>

        {/* Location & IP Details */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bay Location</span>
            <span className="font-semibold text-slate-700">{device.location || 'Testing Dock'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Firmware</span>
            <span className="font-semibold text-slate-700 font-mono">{device.firmwareVersion}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">IP Address</span>
            <span className="font-mono text-slate-600">{device.ipAddress || '192.168.1.100'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Heartbeat</span>
            <span className="text-slate-600">
              {new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Sensor Probe Health Grid */}
        <div className="my-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Sensor Probe Health
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sensorKeys.map((s) => {
              const isHealthy = device.sensors[s.key];
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                    isHealthy
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200/80 text-rose-800'
                  }`}
                >
                  {isHealthy ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/devices/${device.deviceId}`)}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          Node Telemetry
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction(device.deviceId, 'RESTART')}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reboot
          </Button>
          {isConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(device.deviceId, 'DISCONNECT')}
              className="text-rose-600 hover:bg-rose-50"
              icon={<WifiOff className="w-3.5 h-3.5" />}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAction(device.deviceId, 'CONNECT')}
              icon={<Wifi className="w-3.5 h-3.5" />}
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
