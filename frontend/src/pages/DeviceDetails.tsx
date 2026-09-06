import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import {
  ArrowLeft,
  Cpu,
  RefreshCw,
  Sliders,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
  Terminal,
  Clock,
  Send
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useToast } from '../context/ToastContext';

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, triggerDeviceAction } = useDemoData();
  const { showToast } = useToast();

  const device = devices.find((d) => d.deviceId === id) || devices[0];

  const [telemetryHistory, setTelemetryHistory] = useState(() => [
    { time: '10:00:00', temp: 24.1, ph: 6.63, ec: 4.9, fat: 4.4 },
    { time: '10:00:02', temp: 24.2, ph: 6.64, ec: 5.0, fat: 4.5 },
    { time: '10:00:04', temp: 24.2, ph: 6.65, ec: 4.8, fat: 4.5 },
    { time: '10:00:06', temp: 24.3, ph: 6.64, ec: 5.1, fat: 4.6 },
    { time: '10:00:08', temp: 24.1, ph: 6.63, ec: 4.9, fat: 4.4 }
  ]);

  const [logs, setLogs] = useState(() => [
    `[${new Date().toLocaleTimeString()}] INFO: Boot sequence OK. Sensor array initialized.`,
    `[${new Date(Date.now() - 30000).toLocaleTimeString()}] DEBUG: Wi-Fi RSSI: -54 dBm (Excellent)`,
    `[${new Date(Date.now() - 15000).toLocaleTimeString()}] ACK: HTTP POST 200 OK /api/sensors/readings`,
    `[${new Date(Date.now() - 5000).toLocaleTimeString()}] HEARTBEAT: Node ping received.`
  ]);

  const isConnected = device?.status === 'CONNECTED';

  // Live telemetry push simulation
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const nextTemp = Number((24.0 + Math.random() * 0.4).toFixed(2));
      const nextPh = Number((6.62 + Math.random() * 0.05).toFixed(2));
      const nextEc = Number((4.9 + Math.random() * 0.3).toFixed(2));
      const nextFat = Number((4.3 + Math.random() * 0.3).toFixed(2));

      setTelemetryHistory((prev) => [
        ...prev.slice(1),
        { time: now, temp: nextTemp, ph: nextPh, ec: nextEc, fat: nextFat }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);

  if (!device) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">IoT Device not found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/devices')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Devices List
        </Button>
      </div>
    );
  }

  const sensorProbes = [
    { name: 'DS18B20 Temperature Probe', key: 'temperature', ok: device.sensors.temperature, pin: 'GPIO 4', offset: '±0.05 °C' },
    { name: 'Analog BNC pH Electrode', key: 'ph', ok: device.sensors.ph, pin: 'GPIO 34', offset: '±0.02 pH' },
    { name: 'NIR Optical Fat Sensor', key: 'fat', ok: device.sensors.fat, pin: 'GPIO 32', offset: '±0.1 %' },
    { name: 'Electrical Conductivity (EC)', key: 'conductivity', ok: device.sensors.conductivity, pin: 'GPIO 35', offset: '±0.05 mS' },
    { name: 'Ultrasonic Density Hydrometer', key: 'density', ok: device.sensors.density, pin: 'GPIO 25', offset: '±0.0005 g/mL' },
    { name: 'HX711 200kg Load Cell', key: 'level', ok: device.sensors.level, pin: 'GPIO 18/19', offset: '±0.1 L' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{device.name}</h2>
              <StatusIndicator status={device.status} />
              <Badge variant="neutral" size="sm">{device.firmwareVersion}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: <strong className="text-slate-700 font-mono">{device.deviceId}</strong> • Location: <strong>{device.location}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerDeviceAction(device.deviceId, 'RESTART');
              setLogs((prev) => [`[${new Date().toLocaleTimeString()}] RESTART: Reboot sequence triggered.`, ...prev]);
            }}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reboot Node
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerDeviceAction(device.deviceId, 'CALIBRATE');
              setLogs((prev) => [`[${new Date().toLocaleTimeString()}] CALIBRATION: Zero-point offset updated.`, ...prev]);
            }}
            icon={<Sliders className="w-3.5 h-3.5" />}
          >
            Calibrate Sensors
          </Button>
          {isConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => triggerDeviceAction(device.deviceId, 'DISCONNECT')}
              className="text-rose-600 hover:bg-rose-50"
              icon={<WifiOff className="w-3.5 h-3.5" />}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerDeviceAction(device.deviceId, 'CONNECT')}
              icon={<Wifi className="w-3.5 h-3.5" />}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Network & Hardware Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">IP / Endpoint</span>
          <span className="text-sm font-mono font-bold text-slate-800">{device.ipAddress || '192.168.1.101'}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Port: 5000 / HTTP REST</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">MAC Hardware Address</span>
          <span className="text-sm font-mono font-bold text-slate-800">{device.macAddress || '24:6F:28:8A:41:B2'}</span>
          <span className="text-[11px] text-slate-400 block mt-1">ESP32-WROOM-32D</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Wi-Fi Signal Strength</span>
          <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
            <Radio className="w-4 h-4" /> -54 dBm (Excellent)
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Channel 6 • 2.4 GHz</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Seen Heartbeat</span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            {new Date(device.lastSeen).toLocaleTimeString()}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Cycle: 2s Continuous</span>
        </div>
      </div>

      {/* Real-Time Live Telemetry Waveform */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Live Sensor Waveform Stream
            </h3>
            <p className="text-xs text-slate-500">Real-time probe readings received from microcontroller</p>
          </div>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Stream Live
            </span>
          )}
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none'
                }}
              />
              <Line type="monotone" dataKey="ph" name="pH" stroke="#0284c7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fat" name="Fat %" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ec" name="EC (mS)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Probe Health & Calibration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
            Hardware Probe Calibration Matrix
          </h3>
          <div className="space-y-2.5">
            {sensorProbes.map((probe) => (
              <div
                key={probe.key}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {probe.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block">{probe.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">Pin: {probe.pin}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={probe.ok ? 'success' : 'danger'} size="sm">
                    {probe.ok ? 'ONLINE' : 'PROBE ERROR'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Offset: {probe.offset}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Communication Event Logs Console */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-dairy-600" />
                Raw Telemetry Logs
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] Logs cleared.`])}
              >
                Clear
              </Button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1.5 max-h-64 overflow-y-auto border border-slate-800">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLogs((prev) => [`[${new Date().toLocaleTimeString()}] PING: Echo request sent -> 2ms roundtrip.`, ...prev]);
              showToast('Echo ping sent to ESP32 node', 'info');
            }}
            className="w-full mt-2"
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Send Echo Ping Command
          </Button>
        </Card>
      </div>
    </div>
  );
};
